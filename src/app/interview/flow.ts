export type InterviewPhase = 'intro' | 'technical' | 'closing';

interface GenerateQuestionResponse {
  error?: string;
  finished?: boolean;
  nextQuestion?: string;
  turnId?: string;
  summary?: string;
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
    return {
      finished: true as const,
      nextQuestion: data.nextQuestion,
      turnId: data.turnId,
      summary: data.summary,
    };
  }

  if (typeof data.nextQuestion !== 'string' || data.nextQuestion.trim().length === 0) {
    throw new Error('Invalid response from AI server.');
  }

  return {
    finished: false as const,
    nextQuestion: data.nextQuestion.trim(),
    turnId: data.turnId,
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

export function getNextInterviewStep(
  phase: InterviewPhase,
  questionCount: number,
  numIntroQuestions: number = 5,
  numTechQuestions: number = 5
) {
  const nextCount = questionCount + 1;

  if (phase === 'intro' && nextCount > numIntroQuestions) {
    return {
      finished: false as const,
      nextCount: 1,
      nextPhase: 'technical' as const,
    };
  }

  if (phase === 'technical' && nextCount > numTechQuestions) {
    return {
      finished: false as const,
      nextCount: 1,
      nextPhase: 'closing' as const,
    };
  }

  if (phase === 'closing' && nextCount > 1) {
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

export function shouldFinishAfterGenerateResponse(input: {
  resultFinished: boolean;
  phase: InterviewPhase;
  questionCount: number;
  numIntroQuestions?: number;
  numTechQuestions?: number;
}) {
  if (input.resultFinished) {
    return true;
  }

  return getNextInterviewStep(
    input.phase,
    input.questionCount,
    input.numIntroQuestions,
    input.numTechQuestions
  ).finished;
}

export function createUploadRecoveryState(input: {
  prepTimeLimit: number;
  recordTimeLimit: number;
}) {
  return {
    status: 'prep' as const,
    prepTimeLeft: input.prepTimeLimit,
    recordTimeLeft: input.recordTimeLimit,
  };
}
