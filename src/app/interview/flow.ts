export type InterviewPhase = 'intro' | 'technical';

interface GenerateQuestionResponse {
  error?: string;
  finished?: boolean;
  nextQuestion?: string;
}

interface UploadTargetResponse {
  path?: string;
  signedUrl?: string;
  storageKey?: string;
  token?: string;
  error?: string;
}

export interface UploadTarget {
  path: string;
  signedUrl: string;
  storageKey: string;
  token: string;
}

export async function parseGenerateResponse(response: Response) {
  const data = (await response.json()) as GenerateQuestionResponse;

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate question.');
  }

  if (data.finished) {
    return { finished: true as const };
  }

  if (typeof data.nextQuestion !== 'string' || data.nextQuestion.trim().length === 0) {
    throw new Error('Invalid response from AI server.');
  }

  return {
    finished: false as const,
    nextQuestion: data.nextQuestion.trim(),
  };
}

export async function parseUploadTargetResponse(response: Response): Promise<UploadTarget> {
  const data = (await response.json()) as UploadTargetResponse;

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create upload URL.');
  }

  if (
    typeof data.path !== 'string'
    || typeof data.signedUrl !== 'string'
    || typeof data.storageKey !== 'string'
    || typeof data.token !== 'string'
  ) {
    throw new Error('Invalid upload target from server.');
  }

  return {
    path: data.path,
    signedUrl: data.signedUrl,
    storageKey: data.storageKey,
    token: data.token,
  };
}

export function buildAnswerHistoryEntry(storageKey: string) {
  return {
    role: 'user' as const,
    content: `[User answered via private video object: ${storageKey}]`,
  };
}

export function getNextInterviewStep(phase: InterviewPhase, questionCount: number) {
  const nextCount = questionCount + 1;

  if (phase === 'intro' && nextCount > 5) {
    return {
      finished: false as const,
      nextCount: 1,
      nextPhase: 'technical' as const,
    };
  }

  if (phase === 'technical' && nextCount > 5) {
    return {
      finished: true as const,
      nextCount,
      nextPhase: phase,
    };
  }

  return {
    finished: false as const,
    nextCount,
    nextPhase: phase,
  };
}
