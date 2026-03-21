alter table public.jobs add column recruiter_user_id uuid;

alter table public.interviews
  add column candidate_email text,
  add column invite_token_hash text,
  add column invite_expires_at timestamptz,
  add column identity_confirmed_at timestamptz,
  add column consented_at timestamptz,
  add column started_at timestamptz,
  add column completed_at timestamptz,
  add column failed_at timestamptz,
  add column ai_summary text,
  add column ai_recommendation text,
  add column recruiter_rating text,
  add column recruiter_notes text,
  add column last_error text;

update public.interviews set status = 'not_started' where status is null or status = 'pending';

create table public.interview_turns (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  phase text not null,
  question_number integer not null,
  question_text text not null,
  answer_storage_key text,
  answer_mime_type text,
  answered_at timestamptz,
  created_at timestamptz default now()
);

alter table public.interview_turns add constraint uq_interview_turns_phase_qnum unique (interview_id, phase, question_number);

create index idx_jobs_recruiter_user_id on public.jobs(recruiter_user_id);
create index idx_interviews_job_id on public.interviews(job_id);
create index idx_interviews_status on public.interviews(status);
create index idx_interview_turns_interview_id on public.interview_turns(interview_id);
