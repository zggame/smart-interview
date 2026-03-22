export interface InterviewLinkSession {
  id: string;
  candidate_name: string;
  candidate_email?: string;
  status?: string;
  invite_expires_at?: string;
  ai_recommendation?: string;
  ai_summary?: string;
}

export interface InterviewLink {
  id: string;
  name: string;
  email?: string;
  url: string;
  status?: string;
  expiresAt?: string;
  recommendation?: string;
  summary?: string;
}

export function mapInterviewSessionsToLinks(
  sessions: InterviewLinkSession[],
  origin: string
): InterviewLink[] {
  return sessions.map((session) => ({
    id: session.id,
    name: session.candidate_name,
    email: session.candidate_email,
    url: `${origin}/interview/${session.id}`,
    status: session.status,
    expiresAt: session.invite_expires_at,
    recommendation: session.ai_recommendation,
    summary: session.ai_summary,
  }));
}
