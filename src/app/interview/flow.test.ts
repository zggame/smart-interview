import { describe, expect, it } from 'vitest';

import {
  buildAnswerHistoryEntry,
  getNextInterviewStep,
  parseGenerateResponse,
  parseUploadTargetResponse,
  shouldFinishAfterGenerateResponse,
} from './flow';

describe('parseGenerateResponse', () => {
  it('throws the server error when the response is not ok', async () => {
    const response = new Response(JSON.stringify({ error: 'Failed to generate question.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });

    await expect(parseGenerateResponse(response)).rejects.toThrow('Failed to generate question.');
  });

  it('throws when the response is ok but missing a next question', async () => {
    const response = new Response(JSON.stringify({ finished: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    await expect(parseGenerateResponse(response)).rejects.toThrow('Invalid response from AI server.');
  });
});

describe('parseUploadTargetResponse', () => {
  it('returns the signed upload target when the payload is valid', async () => {
    const response = new Response(JSON.stringify({
      path: '2026-03-19/answer-1.webm',
      signedUrl: 'https://example.supabase.co/upload',
      storageKey: '2026-03-19/answer-1.webm',
      token: 'abc',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    await expect(parseUploadTargetResponse(response)).resolves.toEqual({
      path: '2026-03-19/answer-1.webm',
      signedUrl: 'https://example.supabase.co/upload',
      storageKey: '2026-03-19/answer-1.webm',
      token: 'abc',
    });
  });
});

describe('getNextInterviewStep', () => {
  it('moves from intro question 5 to technical question 1', () => {
    expect(getNextInterviewStep('intro', 5)).toEqual({
      finished: false,
      nextCount: 1,
      nextPhase: 'technical',
    });
  });

  it('finishes after technical question 5', () => {
    expect(getNextInterviewStep('technical', 5)).toEqual({
      finished: true,
      nextCount: 6,
      nextPhase: 'technical',
    });
  });
});

describe('shouldFinishAfterGenerateResponse', () => {
  it('finishes when the API says the interview is finished', () => {
    expect(
      shouldFinishAfterGenerateResponse({
        resultFinished: true,
        phase: 'technical',
        questionCount: 3,
        numIntroQuestions: 2,
        numTechQuestions: 5,
      })
    ).toBe(true);
  });

  it('finishes after the final technical answer even if the API returns another question', () => {
    expect(
      shouldFinishAfterGenerateResponse({
        resultFinished: false,
        phase: 'technical',
        questionCount: 5,
        numIntroQuestions: 2,
        numTechQuestions: 5,
      })
    ).toBe(true);
  });

  it('continues during non-terminal steps', () => {
    expect(
      shouldFinishAfterGenerateResponse({
        resultFinished: false,
        phase: 'intro',
        questionCount: 2,
        numIntroQuestions: 2,
        numTechQuestions: 5,
      })
    ).toBe(false);
  });
});

describe('buildAnswerHistoryEntry', () => {
  it('uses the private storage key consistently', () => {
    expect(buildAnswerHistoryEntry('2026-03-19/answer-1.webm')).toEqual({
      role: 'user',
      content: '[User answered via private video object: 2026-03-19/answer-1.webm]',
    });
  });
});
