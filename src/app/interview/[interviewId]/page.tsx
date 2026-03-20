'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Camera, Mic, Loader2, Play, Circle, Square, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getInterviewSessionAction } from '@/app/actions';
import { createUploadRecoveryState } from '@/app/interview/interview-flow';

type InterviewPhase = 'intro' | 'technical';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export default function InterviewPage() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params.interviewId as string;

  const [jobDescription, setJobDescription] = useState('');
  const [skills, setSkills] = useState('');
  
  // Dynamic limits
  const [numIntroQuestions, setNumIntroQuestions] = useState(2);
  const [numTechQuestions, setNumTechQuestions] = useState(3);
  const [maxPrepTime, setMaxPrepTime] = useState(30);
  const [maxRecordTime, setMaxRecordTime] = useState(300);

  // State
  const [status, setStatus] = useState<'loading' | 'setup' | 'prep' | 'recording' | 'processing' | 'finished'>('loading');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionCount, setQuestionCount] = useState(1);
  const [phase, setPhase] = useState<InterviewPhase>('intro');
  const [history, setHistory] = useState<Message[]>([]);
  
  // Timers
  const [prepTimeLeft, setPrepTimeLeft] = useState(30);
  const [recordTimeLeft, setRecordTimeLeft] = useState(300); // 5 mins max
  
  // Media Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    async function initInterview() {
      try {
        const session = await getInterviewSessionAction(interviewId);
        if (!session || !session.job) {
          router.push('/');
          return;
        }

        const job = session.job;
        setJobDescription(job.job_description);
        setSkills(job.skills || '');
        setNumIntroQuestions(job.num_intro_questions || 2);
        setNumTechQuestions(job.num_tech_questions || 3);
        setMaxPrepTime(job.prep_time_limit || 30);
        setMaxRecordTime(job.record_time_limit || 300);

        setPrepTimeLeft(job.prep_time_limit || 30);
        setRecordTimeLeft(job.record_time_limit || 300);

        setStatus('setup');

        // Start webcam and fetch first question
        await initializeMedia();
        fetchNextQuestion(
          job.job_description,
          job.skills || '',
          [],
          'intro',
          1,
          undefined,
          job.num_intro_questions || 2,
          job.num_tech_questions || 3,
          job.prep_time_limit || 30,
          job.record_time_limit || 300
        );
      } catch (error) {
        console.error('Failed to load interview session:', error);
        router.push('/');
      }
    }

    initInterview();
  }, [interviewId, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (status === 'prep' && prepTimeLeft > 0) {
      timer = setTimeout(() => setPrepTimeLeft(p => p - 1), 1000);
    } else if (status === 'prep' && prepTimeLeft === 0) {
      startRecording();
    } else if (status === 'recording' && recordTimeLeft > 0) {
      timer = setTimeout(() => setRecordTimeLeft(p => p - 1), 1000);
    } else if (status === 'recording' && recordTimeLeft === 0) {
      stopRecording();
    }
    
    return () => clearTimeout(timer);
  }, [status, prepTimeLeft, recordTimeLeft]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing media devices.", error);
      alert("Please allow camera and microphone access to continue.");
    }
  };

  const fetchNextQuestion = async (
    jd: string,
    sk: string,
    chatHistory: Message[],
    currentPhase: InterviewPhase,
    count: number,
    videoBlob?: Blob,
    introLimit: number = numIntroQuestions,
    techLimit: number = numTechQuestions,
    prepLimit: number = maxPrepTime,
    recordLimit: number = maxRecordTime
  ) => {
    setStatus('processing');
    
    try {
      let res: Response;

      if (videoBlob) {
        // Send FormData with the video blob for multimodal analysis
        const formData = new FormData();
        formData.append('jobDescription', jd);
        formData.append('skills', sk);
        formData.append('history', JSON.stringify(chatHistory));
        formData.append('phase', currentPhase);
        formData.append('questionNumber', count.toString());
        formData.append('numIntroQuestions', introLimit.toString());
        formData.append('numTechQuestions', techLimit.toString());
        formData.append('video', videoBlob, `answer_${Date.now()}.webm`);

        res = await fetch('/api/interview/generate', {
          method: 'POST',
          body: formData,
        });
      } else {
        // First question — no video yet, send JSON
        res = await fetch('/api/interview/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobDescription: jd,
            skills: sk,
            history: chatHistory,
            phase: currentPhase,
            questionNumber: count,
            numIntroQuestions: introLimit,
            numTechQuestions: techLimit,
          }),
        });
      }
      
      const data = await res.json();
      
      if (data.finished) {
        setStatus('finished');
        return;
      }

      setCurrentQuestion(data.nextQuestion);
      setHistory(prev => [...prev, { role: 'assistant', content: data.nextQuestion }]);
      setPrepTimeLeft(prepLimit);
      setRecordTimeLeft(recordLimit);
      setStatus('prep');
      
    } catch (err) {
      console.error("Error fetching question", err);
      alert("Error contacting AI server.");
      setStatus('setup');
    }
  };

  const startRecording = () => {
    if (!videoRef.current?.srcObject) return;
    
    const stream = videoRef.current.srcObject as MediaStream;
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    mediaRecorder.onstop = handleUploadAndNext;
    
    mediaRecorder.start();
    setStatus('recording');
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleUploadAndNext = async () => {
    setStatus('processing');
    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    
    try {
      // 1. Upload to Supabase Storage
      const fileName = `interview_${Date.now()}.webm`;
      const { error } = await supabase.storage
        .from('interviews')
        .upload(fileName, blob, {
          contentType: 'video/webm'
        });
        
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('interviews')
        .getPublicUrl(fileName);
        
      // Update history with the user's video answer URL
      const newHistory: Message[] = [...history, { role: 'user', content: `[User answered via video: ${publicUrl}]` }];
      setHistory(newHistory);
      
      // Determine next phase/count
      let nextCount = questionCount + 1;
      let nextPhase = phase;
      
      if (nextCount > numIntroQuestions && phase === 'intro') {
        nextPhase = 'technical';
        nextCount = 1; // Reset count for technical phase
      }
      
      if (nextCount > numTechQuestions && phase === 'technical') {
        setStatus('finished');
        return;
      }
      
      setQuestionCount(nextCount);
      setPhase(nextPhase);
      
      // Fetch next question — pass the video blob for multimodal analysis
      await fetchNextQuestion(jobDescription, skills, newHistory, nextPhase, nextCount, blob);
      
    } catch (err) {
      console.error("Upload error", err);
      alert("Failed to upload video. Please check connection.");
      const recoveryState = createUploadRecoveryState({
        prepTimeLimit: maxPrepTime,
        recordTimeLimit: maxRecordTime,
      });
      setPrepTimeLeft(recoveryState.prepTimeLeft);
      setRecordTimeLeft(recoveryState.recordTimeLeft);
      setStatus(recoveryState.status);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (status === 'finished') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden p-12 text-center">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Interview Complete!</h1>
          <p className="text-gray-600 mb-8">Thank you for your time. Your responses have been recorded and will be reviewed shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar: Question Panel */}
      <div className="w-1/3 bg-gray-800 p-8 flex flex-col border-r border-gray-700">
        <div className="mb-8">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-900/50 text-blue-300 text-sm font-medium mb-4 uppercase tracking-wider">
            {phase} Phase • Question {questionCount}/{phase === 'intro' ? numIntroQuestions : numTechQuestions}
          </div>
          <h2 className="text-2xl font-bold leading-relaxed text-gray-100">
            {status === 'setup' || status === 'processing' ? (
              <div className="flex items-center gap-3 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                AI is generating next question...
              </div>
            ) : (
              currentQuestion
            )}
          </h2>
        </div>
        
        <div className="mt-auto">
          {status === 'prep' && (
            <div className="bg-yellow-900/30 border border-yellow-700/50 p-6 rounded-xl">
              <h3 className="text-yellow-500 font-semibold mb-2 flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Preparation Time
              </h3>
              <div className="text-4xl font-mono text-yellow-100">{formatTime(prepTimeLeft)}</div>
              <p className="text-yellow-200/60 text-sm mt-2">Recording will start automatically.</p>
            </div>
          )}
          
          {status === 'recording' && (
            <div className="bg-red-900/30 border border-red-700/50 p-6 rounded-xl">
              <h3 className="text-red-500 font-semibold mb-2 flex items-center gap-2">
                <Circle className="w-3 h-3 fill-red-500 animate-pulse" />
                Recording in Progress
              </h3>
              <div className="text-4xl font-mono text-red-100">{formatTime(recordTimeLeft)}</div>
              <p className="text-red-200/60 text-sm mt-2">Speak clearly. Max {formatTime(maxRecordTime)}.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Area: Video & Controls */}
      <div className="flex-1 p-8 flex flex-col items-center justify-center relative">
        <div className="w-full max-w-4xl relative rounded-2xl overflow-hidden bg-black shadow-2xl aspect-video border border-gray-700">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover transform -scale-x-100" // Mirror effect
          />
          
          {/* Status Overlay */}
          <div className="absolute top-4 left-4 flex gap-2">
            {status === 'recording' && (
              <div className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                REC
              </div>
            )}
            <div className="bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-md text-sm flex items-center gap-2">
              <Mic className="w-4 h-4" />
              <Camera className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex gap-4">
          {status === 'prep' && (
            <button 
              onClick={startRecording}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold flex items-center gap-3 transition-colors shadow-lg shadow-blue-900/20"
            >
              <Play className="w-5 h-5" />
              Start Answering Now
            </button>
          )}
          
          {status === 'recording' && (
            <button 
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-bold flex items-center gap-3 transition-colors shadow-lg shadow-red-900/20"
            >
              <Square className="w-5 h-5 fill-current" />
              Finish Answer
            </button>
          )}
          
          {status === 'processing' && (
            <button disabled className="bg-gray-800 text-gray-400 px-8 py-4 rounded-full font-bold flex items-center gap-3 cursor-not-allowed">
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading & Processing...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
