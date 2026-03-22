import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServerConfig } from '@/lib/supabase-config';

const supabaseConfig = getSupabaseServerConfig();

export const supabaseServer = createClient(
  supabaseConfig.url,
  supabaseConfig.serviceRoleKey
);

// Add mocked local fallback for tests
const mockedJobs = new Map();
const mockedInterviews = new Map();

function getVideoExtension(mimeType: string) {
  if (mimeType === 'video/mp4') {
    return 'mp4';
  }
  return 'webm';
}

function createInterviewStorageKey(mimeType: string) {
  return `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${getVideoExtension(mimeType)}`;
}

export async function createInterviewUploadUrl({
  mimeType,
}: {
  mimeType: string;
}) {
  const storageKey = createInterviewStorageKey(mimeType);
  const { data, error } = await supabaseServer.storage
    .from('interviews')
    .createSignedUploadUrl(storageKey);

  if (error) {
    throw new Error(`Failed to create interview upload URL: ${error.message}`);
  }

  return {
    path: data.path,
    signedUrl: data.signedUrl,
    storageKey,
    token: data.token,
  };
}

export async function downloadInterviewRecording(storageKey: string) {
  const { data, error } = await supabaseServer.storage
    .from('interviews')
    .download(storageKey);

  if (error) {
    throw new Error(`Failed to download interview recording: ${error.message}`);
  }

  return {
    blob: data,
    mimeType: data.type || 'video/webm',
  };
}

export async function getJob(jobId: string) {
  if (supabaseConfig.mode === 'mock') {
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
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function createJob(recruiterUserId: string,
  jobDescription: string,
  skills: string,
  numIntroQuestions: number,
  numTechQuestions: number,
  prepTimeLimit: number,
  recordTimeLimit: number
) {
  if (supabaseConfig.mode === 'mock') {
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
        recruiter_user_id: recruiterUserId,
        job_description: jobDescription,
        skills,
        num_intro_questions: numIntroQuestions,
        num_tech_questions: numTechQuestions,
        prep_time_limit: prepTimeLimit,
        record_time_limit: recordTimeLimit,
      }
    ])
    .select('id')
    .single();

  if (error) {
    throw error;
  }
  return data.id;
}

export async function createInterviewSession(jobId: string, candidateName: string) {
  if (supabaseConfig.mode === 'mock') {
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
    .single();

  if (error) {
    throw error;
  }
  return data.id;
}

export async function getInterviewSession(interviewId: string) {
  if (supabaseConfig.mode === 'mock') {
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
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function listInterviewSessions(jobId: string) {
  if (supabaseConfig.mode === 'mock') {
    return Array.from(mockedInterviews.values())
      .filter((interview) => interview.jobId === jobId)
      .map((interview) => ({
        id: interview.id,
        candidate_name: interview.candidateName,
      }));
  }

  const { data, error } = await supabaseServer
    .from('interviews')
    .select('id, candidate_name')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  return data;
}

export async function createInterviewInvite(
  jobId: string,
  candidateEmail: string,
  candidateName: string,
  tokenHash: string,
  expiryDate: Date
) {
  const { data, error } = await supabaseServer
    .from('interviews')
    .insert([
      {
        job_id: jobId,
        candidate_email: candidateEmail,
        candidate_name: candidateName,
        invite_token_hash: tokenHash,
        invite_expires_at: expiryDate.toISOString(),
        status: 'not_started',
      }
    ])
    .select('id')
    .single();

  if (error) {
    throw error;
  }
  return data.id;
}

export async function listJobInterviewsForRecruiter(jobId: string) {
  const { data, error } = await supabaseServer
    .from('interviews')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  return data;
}

export async function getRecruiterInterviewReview(interviewId: string) {
  const { data, error } = await supabaseServer
    .from('interviews')
    .select(`
      *,
      job:jobs (*),
      turns:interview_turns (*)
    `)
    .eq('id', interviewId)
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function getCandidateInterviewByInviteToken(interviewId: string, tokenHash: string) {
  const { data, error } = await supabaseServer
    .from('interviews')
    .select(`
      *,
      job:jobs (*)
    `)
    .eq('id', interviewId)
    .eq('invite_token_hash', tokenHash)
    .single();

  if (error) {
    throw new Error('Invalid or expired invite');
  }
  return data;
}

export async function markInterviewIdentityConfirmed(interviewId: string) {
  const { error } = await supabaseServer
    .from('interviews')
    .update({ identity_confirmed_at: new Date().toISOString() })
    .eq('id', interviewId);
  if (error) throw error;
}

export async function markInterviewConsented(interviewId: string) {
  const { error } = await supabaseServer
    .from('interviews')
    .update({ consented_at: new Date().toISOString() })
    .eq('id', interviewId);
  if (error) throw error;
}

export async function markInterviewStarted(interviewId: string) {
  const { error } = await supabaseServer
    .from('interviews')
    .update({
      started_at: new Date().toISOString(),
      status: 'in_progress'
    })
    .eq('id', interviewId);
  if (error) throw error;
}

export async function appendInterviewTurn(interviewId: string, phase: string, questionNumber: number, questionText: string) {
  const { data, error } = await supabaseServer
    .from('interview_turns')
    .insert([
      {
        interview_id: interviewId,
        phase,
        question_number: questionNumber,
        question_text: questionText,
      }
    ])
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function attachAnswerToTurn(turnId: string, storageKey: string, mimeType: string) {
  const { error } = await supabaseServer
    .from('interview_turns')
    .update({
      answer_storage_key: storageKey,
      answer_mime_type: mimeType,
      answered_at: new Date().toISOString()
    })
    .eq('id', turnId);
  if (error) throw error;
}

export async function completeInterviewWithReview(interviewId: string, aiSummary: string, aiRecommendation: string) {
  const { error } = await supabaseServer
    .from('interviews')
    .update({
      ai_summary: aiSummary,
      ai_recommendation: aiRecommendation,
      completed_at: new Date().toISOString(),
      status: 'completed'
    })
    .eq('id', interviewId);
  if (error) throw error;
}
