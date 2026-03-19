import { NextResponse } from 'next/server';
import { GoogleGenAI, createUserContent, createPartFromUri } from '@google/genai';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Initialize the Google Gen AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    let jobDescription: string;
    let skills: string;
    let history: { role: string; content: string }[];
    let phase: string;
    let questionNumber: number;
    let videoBlob: Blob | null = null;

    // Parse either FormData (with video) or JSON (first question, no video)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      jobDescription = formData.get('jobDescription') as string;
      skills = formData.get('skills') as string;
      history = JSON.parse(formData.get('history') as string);
      phase = formData.get('phase') as string;
      questionNumber = parseInt(formData.get('questionNumber') as string, 10);
      
      const videoFile = formData.get('video');
      if (videoFile instanceof Blob) {
        videoBlob = videoFile;
      }
    } else {
      const body = await req.json();
      jobDescription = body.jobDescription;
      skills = body.skills;
      history = body.history;
      phase = body.phase;
      questionNumber = body.questionNumber;
    }

    // Limit the number of questions
    if (phase === 'technical' && questionNumber > 5) {
      return NextResponse.json({ finished: true });
    }

    let nextQuestion: string;

    if (history.length === 0 && phase === 'intro') {
      // First question — no video to analyze yet, text-only prompt
      const prompt = `
        You are an expert technical interviewer. 
        Job Description Context:
        ${jobDescription}

        This is the start of the interview. 
        Generate exactly one professional, welcoming introductory question asking the candidate to introduce themselves and discuss a recent project or job relevant to the Job Description above. 
        Do not output anything else except the question itself.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.7 },
      });

      nextQuestion = response.text?.trim() || 'Could you introduce yourself and tell us about a recent relevant project?';

    } else if (videoBlob) {
      // Subsequent questions WITH video — multimodal analysis
      // 1. Write the video blob to a temp file
      const tempPath = join(tmpdir(), `interview_${Date.now()}.webm`);
      const arrayBuffer = await videoBlob.arrayBuffer();
      await writeFile(tempPath, Buffer.from(arrayBuffer));

      try {
        // 2. Upload the video to Gemini File API
        console.log('[Interview API] Uploading video to Gemini File API...');
        const uploadedFile = await ai.files.upload({
          file: tempPath,
          config: { mimeType: 'video/webm' },
        });
        console.log('[Interview API] Video uploaded successfully:', uploadedFile.uri);

        // 3. Build the multimodal prompt
        const textPrompt = `
          You are an expert technical interviewer conducting an interview based on the following details.

          Job Description:
          ${jobDescription}

          Target Skills for Technical Phase:
          ${skills || 'General technical proficiency related to the job description'}

          Current Phase: ${phase} Phase (Question ${questionNumber} of 5)

          Previous interview questions and answers in this session:
          ${JSON.stringify(history)}

          IMPORTANT: The attached video is the candidate's answer to the previous question. Watch it carefully and analyze:
          1. What specific topics, technologies, or experiences did the candidate mention?
          2. How confident and clear was their response?
          3. Were there any areas where they seemed uncertain or could elaborate further?

          Task:
          Based on your analysis of the candidate's video answer and the current phase (${phase}), generate the NEXT single interview question.

          If Phase is 'intro': Ask a specific follow-up that digs deeper into something the candidate actually said in their video answer. Reference their specific points to show you were listening.
          If Phase is 'technical': Ask a specific technical question related to the technologies, tools, or concepts the candidate mentioned in their previous answers and that are relevant to the job description.

          Do not output any pleasantries, feedback, or markdown. Output ONLY the raw text of the question.
        `;

        // 4. Call generateContent with video + text
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: createUserContent([
            createPartFromUri(uploadedFile.uri!, uploadedFile.mimeType!),
            textPrompt,
          ]),
          config: { temperature: 0.7 },
        });

        nextQuestion = response.text?.trim() || 'Could you elaborate more on your previous experience?';

      } finally {
        // Clean up temp file
        await unlink(tempPath).catch(() => {});
      }

    } else {
      // Subsequent questions WITHOUT video (fallback — shouldn't normally happen)
      const prompt = `
        You are an expert technical interviewer conducting an interview based on the following details.
        
        Job Description:
        ${jobDescription}

        Target Skills for Technical Phase:
        ${skills || 'General technical proficiency related to the job description'}

        Current Phase: ${phase} Phase (Question ${questionNumber} of 5)
        
        Interview History context:
        ${JSON.stringify(history)}

        Task:
        Based on the current phase (${phase}), generate the NEXT single interview question.
        
        If Phase is 'intro': Ask a follow-up detail about their previous experience related to the job description.
        If Phase is 'technical': Ask a specific technical question about the languages/skills required for this job.

        Do not output any pleasantries, feedback, or markdown. Output ONLY the raw text of the question.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.7 },
      });

      nextQuestion = response.text?.trim() || 'Could you elaborate more on your previous experience?';
    }

    return NextResponse.json({
      nextQuestion,
      finished: false,
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate question.' },
      { status: 500 }
    );
  }
}
