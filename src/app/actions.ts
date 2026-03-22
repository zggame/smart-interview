'use server'

import { requireRecruiterAuth } from '@/lib/recruiter-auth';
import { getAppConfig } from '@/lib/app-config';
import { generateInviteToken, hashInviteToken, calculateExpiryDate } from '@/lib/invite-token';
import {
  createInterviewSession,
  createJob,
  getInterviewSession,
  getJob,
  listInterviewSessions,
  createInterviewInvite,
  listJobInterviewsForRecruiter,
  getRecruiterInterviewReview,
  getCandidateInterviewByInviteToken,
  markInterviewIdentityConfirmed,
  markInterviewConsented,
  markInterviewStarted
} from '@/lib/supabase-server'

export async function createJobAction(formData: FormData) {
  const { user } = await requireRecruiterAuth();

  const jobDescription = formData.get('jobDescription') as string
  const skills = formData.get('skills') as string
  const numIntroQuestions = parseInt(formData.get('numIntroQuestions') as string, 10)
  const numTechQuestions = parseInt(formData.get('numTechQuestions') as string, 10)
  const prepTimeLimit = parseInt(formData.get('prepTimeLimit') as string, 10)
  const recordTimeLimit = parseInt(formData.get('recordTimeLimit') as string, 10)

  const jobId = await createJob(
    user.id,
    jobDescription,
    skills,
    numIntroQuestions,
    numTechQuestions,
    prepTimeLimit,
    recordTimeLimit
  )

  return jobId
}

export async function createInterviewSessionAction(jobId: string, formData: FormData) {
  await requireRecruiterAuth();
  const candidateName = formData.get('candidateName') as string
  const interviewId = await createInterviewSession(jobId, candidateName)
  return interviewId
}

export async function createInterviewInviteAction(jobId: string, formData: FormData) {
  await requireRecruiterAuth();

  const candidateName = formData.get('candidateName') as string;
  const candidateEmail = formData.get('candidateEmail') as string;

  const config = getAppConfig();
  const rawToken = generateInviteToken();
  const tokenHash = hashInviteToken(rawToken);
  const expiryDate = calculateExpiryDate(config.inviteExpiryDays);

  const interviewId = await createInterviewInvite(
    jobId,
    candidateEmail,
    candidateName,
    tokenHash,
    expiryDate
  );

  return { interviewId, rawToken };
}

export async function getInterviewSessionAction(interviewId: string) {
  const session = await getInterviewSession(interviewId)
  return session
}

export async function getJobAction(jobId: string) {
  await requireRecruiterAuth();
  const job = await getJob(jobId)
  return job
}

export async function listInterviewSessionsAction(jobId: string) {
  await requireRecruiterAuth();
  const sessions = await listInterviewSessions(jobId)
  return sessions
}

export async function listJobInterviewsForRecruiterAction(jobId: string) {
  await requireRecruiterAuth();
  const sessions = await listJobInterviewsForRecruiter(jobId);
  return sessions;
}

export async function getRecruiterInterviewReviewAction(interviewId: string) {
  await requireRecruiterAuth();
  const review = await getRecruiterInterviewReview(interviewId);
  return review;
}

export async function getCandidateInterviewByInviteTokenAction(interviewId: string, token: string) {
  // Using token directly, but database expects the hash
  const tokenHash = hashInviteToken(token);
  const interview = await getCandidateInterviewByInviteToken(interviewId, tokenHash);
  return interview;
}

export async function markInterviewIdentityConfirmedAction(interviewId: string, token: string) {
  const tokenHash = hashInviteToken(token);
  await getCandidateInterviewByInviteToken(interviewId, tokenHash); // Auth check
  await markInterviewIdentityConfirmed(interviewId);
}

export async function markInterviewConsentedAction(interviewId: string, token: string) {
  const tokenHash = hashInviteToken(token);
  await getCandidateInterviewByInviteToken(interviewId, tokenHash); // Auth check
  await markInterviewConsented(interviewId);
}

export async function markInterviewStartedAction(interviewId: string, token: string) {
  const tokenHash = hashInviteToken(token);
  await getCandidateInterviewByInviteToken(interviewId, tokenHash); // Auth check
  await markInterviewStarted(interviewId);
}
