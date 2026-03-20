'use server'

import { createJob, createInterviewSession, getInterviewSession, getJob } from '@/lib/supabase-server'

export async function createJobAction(formData: FormData) {
  const jobDescription = formData.get('jobDescription') as string
  const skills = formData.get('skills') as string
  const numIntroQuestions = parseInt(formData.get('numIntroQuestions') as string, 10)
  const numTechQuestions = parseInt(formData.get('numTechQuestions') as string, 10)
  const prepTimeLimit = parseInt(formData.get('prepTimeLimit') as string, 10)
  const recordTimeLimit = parseInt(formData.get('recordTimeLimit') as string, 10)

  const jobId = await createJob(
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
  const candidateName = formData.get('candidateName') as string

  const interviewId = await createInterviewSession(jobId, candidateName)

  return interviewId
}

export async function getInterviewSessionAction(interviewId: string) {
  const session = await getInterviewSession(interviewId)
  return session
}

export async function getJobAction(jobId: string) {
  const job = await getJob(jobId)
  return job
}
