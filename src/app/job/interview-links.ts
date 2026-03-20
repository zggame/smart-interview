export interface InterviewLinkSession {
  id: string;
  candidate_name: string;
}

export interface InterviewLink {
  name: string;
  url: string;
}

export function mapInterviewSessionsToLinks(
  sessions: InterviewLinkSession[],
  origin: string
): InterviewLink[] {
  return sessions.map((session) => ({
    name: session.candidate_name,
    url: `${origin}/interview/${session.id}`,
  }));
}
