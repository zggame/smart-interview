import { NextResponse } from 'next/server';
import { GoogleGenAI, createUserContent, createPartFromUri } from '@google/genai';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { createLogger } from '@/lib/logger';
import { downloadInterviewRecording } from '@/lib/supabase-server';

// Initialize the Google Gen AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const log = createLogger('InterviewAPI');

function isMessageHistory(value: unknown): value is { role: string; content: string }[] {
  return Array.isArray(value)
    && value.every(
      (item) => item
        && typeof item === 'object'
        && typeof item.role === 'string'
        && typeof item.content === 'string'
    );
}

function isInterviewFinished(phase: string, questionNumber: number, numTechQuestions: number) {
  return phase === 'technical' && questionNumber > numTechQuestions;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    log.info('Incoming request', { contentType });

    log.debug('Parsing request as JSON');
    const body = await req.json();
    const jobDescription = body.jobDescription;
    const skills = body.skills;
    const history = body.history;
    const phase = body.phase;
    const questionNumber = body.questionNumber;
    const numIntroQuestions = body.numIntroQuestions || 5;
    const numTechQuestions = body.numTechQuestions || 5;
    const storageKey = typeof body.storageKey === 'string' ? body.storageKey : null;

    if (
      typeof jobDescription !== 'string'
      || typeof skills !== 'string'
      || !isMessageHistory(history)
      || (phase !== 'intro' && phase !== 'technical')
      || !Number.isInteger(questionNumber)
      || (storageKey !== null && storageKey.length === 0)
    ) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
    }

    log.info('Request parsed', { phase, questionNumber, historyLength: history.length, hasVideo: !!storageKey });

    if (isInterviewFinished(phase, questionNumber, numTechQuestions)) {
      log.info('Interview finished — technical phase complete');
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

    } else if (storageKey) {
      // Subsequent questions WITH stored video — multimodal analysis
      const downloadedRecording = await downloadInterviewRecording(storageKey);

      // 1. Write the stored video blob to a temp file
      const extension = downloadedRecording.mimeType === 'video/mp4' ? 'mp4' : 'webm';
      const tempPath = join(tmpdir(), `interview_${crypto.randomUUID()}.${extension}`);
      const arrayBuffer = await downloadedRecording.blob.arrayBuffer();
      await writeFile(tempPath, Buffer.from(arrayBuffer));

      try {
        // 2. Upload the video to Gemini File API
        log.info('Uploading video to Gemini File API...');
        const uploadedFile = await ai.files.upload({
          file: tempPath,
          config: { mimeType: downloadedRecording.mimeType },
        });
        log.info('Video uploaded to Gemini. Waiting for processing to complete...', { uri: uploadedFile.uri });

        // Wait for the file to become ACTIVE (processing finished)
        let file = await ai.files.get({ name: uploadedFile.name! });
        let attempts = 0;
        const maxAttempts = 30; // 60 seconds max wait
        
        while (file.state === 'PROCESSING' && attempts < maxAttempts) {
          log.debug(`Video processing state: PROCESSING (Attempt ${attempts + 1}/${maxAttempts})`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          file = await ai.files.get({ name: uploadedFile.name! });
          attempts++;
        }

        if (file.state !== 'ACTIVE') {
          throw new Error(`Video processing timed out or failed. State: ${file.state}`);
        }
        
        log.info('Video is now ACTIVE and ready for analysis');

        // 3. Build the multimodal prompt
        const textPrompt = `
          You are an expert technical interviewer conducting an interview based on the following details.

          Job Description:
          ${jobDescription}

          Target Skills for Technical Phase:
          ${skills || 'General technical proficiency related to the job description'}

          Current Phase: ${phase} Phase (Question ${questionNumber} of ${phase === 'intro' ? numIntroQuestions : numTechQuestions})

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

        Current Phase: ${phase} Phase (Question ${questionNumber} of ${phase === 'intro' ? numIntroQuestions : numTechQuestions})
        
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

    log.info('Generated question', { questionNumber, phase, question: nextQuestion });

    return NextResponse.json({
      nextQuestion,
      finished: false,
    });

  } catch (error) {
    log.error('Failed to generate question', error instanceof Error ? { message: error.message, stack: error.stack } : error);
    return NextResponse.json(
      { error: 'Failed to generate question.' },
      { status: 500 }
    );
  }
}
