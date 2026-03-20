import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key'

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey)

// Add mocked local fallback for tests
const mockedJobs = new Map();
const mockedInterviews = new Map();

export async function getJob(jobId: string) {
  if (supabaseUrl === 'https://mock.supabase.co') {
    const job = mockedJobs.get(jobId);
    if (!job) throw new Error("Not found");
    return {
      id: job.id,
      job_description: job.jobDescription,
      skills: job.skills,
      num_intro_questions: job.numIntroQuestions,
      num_tech_questions: job.numTechQuestions,
      prep_time_limit: job.prepTimeLimit,
      record_time_limit: job.recordTimeLimit
    };
  }

  const { data, error } = await supabaseServer
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (error) {
    throw error
  }
  return data
}

export async function createJob(
  jobDescription: string,
  skills: string,
  numIntroQuestions: number,
  numTechQuestions: number,
  prepTimeLimit: number,
  recordTimeLimit: number
) {
  if (supabaseUrl === 'https://mock.supabase.co') {
    const id = 'mock-job-' + Date.now();
    mockedJobs.set(id, {
      id, jobDescription, skills, numIntroQuestions, numTechQuestions, prepTimeLimit, recordTimeLimit
    });
    return id;
  }

  const { data, error } = await supabaseServer
    .from('jobs')
    .insert([
      {
        job_description: jobDescription,
        skills,
        num_intro_questions: numIntroQuestions,
        num_tech_questions: numTechQuestions,
        prep_time_limit: prepTimeLimit,
        record_time_limit: recordTimeLimit,
      }
    ])
    .select('id')
    .single()

  if (error) {
    throw error
  }
  return data.id
}

export async function createInterviewSession(jobId: string, candidateName: string) {
  if (supabaseUrl === 'https://mock.supabase.co') {
    const id = 'mock-interview-' + Date.now();
    mockedInterviews.set(id, {
      id, jobId, candidateName, status: 'pending'
    });
    return id;
  }

  const { data, error } = await supabaseServer
    .from('interviews')
    .insert([
      {
        job_id: jobId,
        candidate_name: candidateName,
        status: 'pending',
      }
    ])
    .select('id')
    .single()

  if (error) {
    throw error
  }
  return data.id
}

export async function getInterviewSession(interviewId: string) {
  if (supabaseUrl === 'https://mock.supabase.co') {
    const interview = mockedInterviews.get(interviewId);
    if (!interview) throw new Error("Not found");
    const job = mockedJobs.get(interview.jobId);
    return {
      ...interview,
      job: {
        id: job.id,
        job_description: job.jobDescription,
        skills: job.skills,
        num_intro_questions: job.numIntroQuestions,
        num_tech_questions: job.numTechQuestions,
        prep_time_limit: job.prepTimeLimit,
        record_time_limit: job.recordTimeLimit
      }
    };
  }

  const { data, error } = await supabaseServer
    .from('interviews')
    .select(`
      *,
      job:jobs (*)
    `)
    .eq('id', interviewId)
    .single()

  if (error) {
    throw error
  }
  return data
}
