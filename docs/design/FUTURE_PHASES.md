# Smart Interview - Project Phases

## Phase 1: Dynamic Interview Core (Current Phase)
The MVP focus is purely on the automated interview experience and AI integration. 

**Features:**
- Setup page to input a Job Description and interview parameters.
- Interviewee UI utilizing the `MediaRecorder` API.
- 30-second prep countdown and up to 5-minute recording timer per question.
- Videos are uploaded to Supabase Storage (public bucket `interviews`).
- Audio/Video context is passed (or transcribed and passed) to Google Gemini 1.5.
- Gemini evaluates the answer against the JD and dynamically generates the next question.
- Question flow: Up to 5 introductory/JD-related questions, followed by up to 5 technical questions.

**Tech Stack:**
- Next.js (App Router, Frontend & API)
- Tailwind CSS
- Google Gemini API (`@google/genai`)
- Supabase Storage (`@supabase/supabase-js`)

---

## Future Phases (Phase 2+)

### Roles and Authentication
Introduce a robust authentication system (e.g., Supabase Auth or NextAuth) with Role-Based Access Control (RBAC).

#### 1. Interviewer Role
- **Job Management:** 
  - Page to upload new Job Descriptions or select from a library of existing ones.
  - Granular controls: Select specific skills to test, define the number of questions per skill, or set total time limits.
- **Candidate Management:**
  - Review incoming applications and resumes.
  - Approve candidates for interviews.
  - Send automated email invitations to candidates with registration/login links to access their specific interview.
- **Evaluation Dashboard:**
  - Dashboard to track all interviews across jobs.
  - Interface to review completed interviews, watch the recorded videos, see AI-generated transcripts, and review the AI-assigned grades.

#### 2. Interviewee Role
- **Portal:**
  - Login securely.
  - Dashboard showing application status (waiting for approval, interview ready).
  - Ability to submit basic profile information and upload resumes.
- **Interview Execution:**
  - Once approved, select the pending interview and enter the recording room.
  - (The recording room uses the Phase 1 UI: webcam view, question panel, timers).

#### 3. Admin Role
- **System Management:**
  - Approve Interviewer accounts after they sign up.
  - Assign roles and manage user permissions.
  - Standard admin functions (billing, global settings, audit logs).

### Technical Additions for Future Phases
- **Database:** Implement Postgres tables (via Supabase or Prisma) for `Users`, `Jobs`, `Applications`, `Interviews`, `Questions`, and `Answers`.
- **Email Provider:** Integrate Resend or SendGrid for the invite system.
- **Security:** Replace public Supabase Storage buckets with authenticated, signed URLs for private video access.
