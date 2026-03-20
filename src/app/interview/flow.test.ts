import { describe, expect, it } from 'vitest';

import { getNextInterviewStep, parseGenerateResponse } from './flow';

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
