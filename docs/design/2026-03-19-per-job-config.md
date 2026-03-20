# Implementation Plan - Per-Job Interview Configuration

This plan introduces dynamic configuration for interviews and a proper relational database schema. A "Job" acts as a configuration template, and an "Interview" is a unique session generated for a specific candidate.

## Objective
Persist the interview configuration in Supabase and allow an interviewer to create multiple unique "Interview Sessions" for a single "Job" template.

## Key Files & Context
- `src/lib/supabase-server.ts`: Supabase client and DB utilities.
- `src/app/page.tsx`: The Job setup page.
- `src/app/job/[id]/page.tsx`: NEW - A dashboard for the interviewer to view the job and generate unique interview links.
- `src/app/interview/[interviewId]/page.tsx`: The dynamic interview room that fetches the session and job configuration.

## Database Schema (Supabase)
We will need two tables to support this one-to-many relationship:

**1. `jobs` Table (The Template)**
- `id`: uuid (Primary Key)
- `job_description`: text
- `skills`: text
- `num_intro_questions`: integer
- `num_tech_questions`: integer
- `prep_time_limit`: integer
- `record_time_limit`: integer
- `created_at`: timestamp

**2. `interviews` Table (The Session)**
- `id`: uuid (Primary Key, this is the ID in the link sent to the candidate)
- `job_id`: uuid (Foreign Key referencing `jobs.id`)
- `candidate_name`: text (optional, for the interviewer to keep track)
- `status`: text (e.g., 'pending', 'in_progress', 'completed')
- `created_at`: timestamp

## Implementation Steps

### 1. Database Integration (`src/lib/supabase-server.ts`)
Add helper functions:
- `createJob(...)`: Inserts into `jobs` and returns the `id`.
- `createInterviewSession(jobId, candidateName)`: Inserts into `interviews` and returns the `id`.
- `getInterviewSession(interviewId)`: Fetches the `interviews` record JOINED with the `jobs` record to retrieve the full configuration.

### 2. Update Setup Page (`src/app/page.tsx`)
- Add UI inputs for the timing and question limits.
- On submit, call the backend to create a `Job` record.
- Redirect the interviewer to `/job/[job_id]`.

### 3. Create Job Dashboard (`src/app/job/[id]/page.tsx`)
- Build a simple dashboard for the interviewer.
- It displays the job's configuration.
- Includes a form: "Generate Interview Link" (inputs: Candidate Name).
- On submit, creates an `interviews` record and displays the unique URL: `https://.../interview/[interviewId]`.

### 4. Create Dynamic Interview Room (`src/app/interview/[interviewId]/page.tsx`)
- Move existing logic to this dynamic route.
- On load, fetch the interview session using the `interviewId` from the URL.
- Extract the nested `job` configuration.
- Pass the dynamic limits (`numIntroQuestions`, `numTechQuestions`, `prepTimeLimit`, `recordTimeLimit`) into the React state and `getNextInterviewStep` logic.

### 5. Update AI Flow & API
- `src/app/interview/flow.ts`: Update `getNextInterviewStep` to accept dynamic limits instead of hardcoded 5s.
- `src/app/api/interview/generate/route.ts`: Update the POST payload and logic to accept and respect the dynamic limits when determining if the phase or interview is "finished".

## Verification & Testing
1. **DB Setup:** Ensure tables and foreign keys are created in Supabase.
2. **Template Creation:** Submit a new Job on `/` and verify it redirects to the dashboard.
3. **Session Generation:** Generate a link for "Alice" and verify an `interviews` record is created.
4. **Candidate Flow:** Navigate to the `/interview/[interviewId]` link, verify the specific timers load, and complete the specified number of questions.
