export type InterviewPhase = 'intro' | 'technical';

interface GenerateQuestionResponse {
  error?: string;
  finished?: boolean;
  nextQuestion?: string;
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
