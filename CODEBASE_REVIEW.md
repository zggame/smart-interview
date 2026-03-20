# Codebase & Business Process Review: Smart Interview App

## 1. Business Process Analysis & Enhancements

### Current Process
1. **Job Creation**: Recruiter enters a job description, skills, and configures the interview (number of questions, time limits).
2. **Link Generation**: Recruiter generates unique links for each candidate.
3. **Interview Execution**: Candidate joins, AI asks an intro question. Candidate records a video answer within a time limit. Video uploads to Supabase.
4. **AI Generation**: Supabase storage sends video to Gemini. Gemini analyzes the video and generates the next question (intro or technical) based on context and previous answers.
5. **Completion**: Process repeats until configured questions are exhausted, then interview finishes.

### Comparison to Human-Led Process & Gaps
* **Empathy & Flexibility**: A human interviewer adapts dynamically—if a candidate struggles with audio, a human pauses. The current app is rigid; if upload fails or a candidate stutters, the rigid timer might penalize them.
* **Two-Way Interaction**: Human interviews allow candidates to ask questions. This app is currently one-way (interrogation style).
* **Feedback Loop**: After an interview, a human panel debriefs. Currently, there is no automated scoring or summary generation for the recruiter to review post-interview.

### Suggested Enhancements (Business Process)
* **Pre-Interview Tech Check**: Before the interview starts, add a mandatory audio/video check phase to ensure the candidate's mic and camera are working properly, reducing drop-offs.
* **"Ask a Question" Phase**: Allow candidates a final phase where they can ask questions about the company. The AI could use RAG (Retrieval-Augmented Generation) on company public docs to answer them.
* **Recruiter Dashboard & Automated Scoring**: Create a post-interview dashboard for recruiters. Use Gemini to process the transcript of all videos and provide a summarized score/rubric (e.g., "Communication: 8/10", "React Knowledge: 7/10").
* **Pause/Resume Functionality**: Allow candidates to pause the interview once for emergencies.

## 2. Design vs. Code Alignment

### Current Implementation
* The app uses standard `TailwindCSS` utility classes.
* Layouts are straightforward, relying heavily on flexbox, centered cards, and primary colored buttons (blue/green/red).
* Use of `lucide-react` for standard iconography.
* Dark mode is forced on the interview screen (`bg-gray-900 text-white`), while other screens are light mode.

### Divergences & Robust UX Patterns
* **Loading States**: The app has `isLoading` states, but the transition during video processing can be abrupt. A skeleton loader or a more engaging "AI is thinking..." animation (beyond a simple spinner) would align better with modern AI apps.
* **Error States & Recovery**: If a video upload fails, there is a basic `alert()`. A robust design would use a Toast notification system and offer a clear "Retry Upload" button without breaking the interview flow.
* **Responsive Design**: The interview view layout might become cramped on smaller mobile devices. The video element uses an aspect ratio, but side-by-side layout (`w-1/3` and `flex-1`) should stack vertically on mobile screens.

## 3. Suggest Fixes and Refactoring

### Potential Fixes
1. **File Upload Robustness**: In `src/app/interview/[interviewId]/page.tsx`, `handleUploadAndNext` relies on a single attempt. Implement retry logic for Supabase uploads in case of temporary network drops.
2. **Memory Leaks in MediaStream**: `stopMediaStream` is called on unmount, but ensuring all tracks are properly stopped and variables nulled out is critical. Also, `MediaRecorder` chunks should be cleared properly to avoid memory bloating on long interviews.
3. **Error Handling in API**: `src/app/api/interview/generate/route.ts` has a timeout loop for Gemini processing. If it fails, it throws a generic 500. It should return a specific error so the client can retry the generation step specifically without needing the user to re-record.

### Refactoring Opportunities
1. **Component Extraction**: `src/app/interview/[interviewId]/page.tsx` is over 300 lines long. It should be broken down into:
   * `<VideoPreview />`
   * `<InterviewControls />`
   * `<QuestionPanel />`
2. **State Management**: The interview page uses 15+ individual `useState` hooks. Moving the interview state (status, timers, phase) into a `useReducer` or a custom hook (`useInterviewManager`) would drastically simplify the component logic.
3. **Environment Variables Check**: The Next.js build failed previously because `NEXT_PUBLIC_SUPABASE_URL` was missing. Implement a centralized config file (e.g., `src/lib/env.ts`) using `zod` to validate all required environment variables at startup/build time.

## 4. Suggested New Enhancements (Technical)
* **WebSockets for Progress**: Instead of polling for Gemini video processing state in the API, use Server-Sent Events (SSE) or WebSockets to stream the progress back to the UI.
* **Transcriptions**: Utilize Gemini's or another service's audio transcription capabilities to save text transcripts alongside the video for easier recruiter review.
* **Accessibility (a11y)**: Add `aria-labels` to buttons (especially the record/stop buttons) and ensure the screen reader announces when a new question is presented or a timer is ending.