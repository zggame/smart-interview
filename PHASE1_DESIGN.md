# Smart Interview App - Phase 1 Design

## Architecture
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **Deployment target:** Vercel (recommended)

## Data Flow
1. **Setup:** The Interviewer pastes a Job Description (JD) and clicks "Start Interview".
2. **First Question:** The UI requests the first question from the Next.js API route (`/api/interview/generate`), which asks Google Gemini to generate an introductory question based on the JD.
3. **Recording:** 
    - The Interviewee is shown the question.
    - A 30-second prep timer counts down.
    - Recording automatically starts (or user can start early).
    - User records up to 5 minutes of video using the browser's `MediaRecorder` API.
4. **Upload:** When recording stops, the `Blob` is uploaded to a public Supabase Storage bucket named `interviews`.
5. **Evaluation & Next Question:** 
    - The Supabase public URL of the uploaded video is sent to the `/api/interview/generate` endpoint.
    - The Next.js API sends the URL, the JD, and interview history to Google Gemini.
    - Gemini is prompted to:
        a) Grade/evaluate the answer.
        b) Generate the *next* question based on the evaluation, the JD, and the current phase of the interview (Intro phase vs Technical phase).
6. **Loop:** Steps 3-5 repeat up to the defined limit (e.g., 5 Intro questions + 5 Tech questions).

## Key Components

### `src/app/page.tsx` (Setup)
A simple form allowing the user to paste a Job Description and set the number of questions. It pushes the state to the `/interview` page via query params or context.

### `src/app/interview/page.tsx` (The Engine)
The main client-side React component.
- **State Management:** Uses React hooks to track:
  - `status`: 'setup' | 'prep' | 'recording' | 'processing' | 'finished'
  - `currentQuestion`: string
  - `history`: Array of previous questions and answers.
  - `timers`: `prepTime` (30s), `recordTime` (300s).
- **Media Handling:** Uses `navigator.mediaDevices.getUserMedia` for the webcam stream and `MediaRecorder` to capture chunks.

### `src/app/api/interview/generate/route.ts` (The Brain)
A Next.js POST route handler.
- Receives the payload: `{ jobDescription, history, currentPhase, lastVideoUrl }`
- Interacts with `@google/genai` to structure a prompt.
- Returns JSON containing: `{ nextQuestion: string, lastAnswerEvaluation: string }`

### `src/lib/supabase.ts`
Utility to initialize the `@supabase/supabase-js` client and provide an upload function using the public `anon` key.

## Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`: The URL of the Supabase project.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The public API key for Supabase (allows frontend uploading).
- `GEMINI_API_KEY`: The Google AI Studio key (kept secret on the server-side API routes).
