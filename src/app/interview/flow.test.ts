import { describe, expect, it } from 'vitest';
import { getNextInterviewStep, parseGenerateResponse } from './flow';

describe('interview flow helpers', () => {
  it('transitions from intro to technical', () => {
    const step = getNextInterviewStep('intro', 5, 5, 5);
    expect(step.nextPhase).toBe('technical');
    expect(step.nextCount).toBe(1);
    expect(step.finished).toBe(false);
  });

  it('transitions from technical to closing', () => {
    const step = getNextInterviewStep('technical', 5, 5, 5);
    expect(step.nextPhase).toBe('closing');
    expect(step.nextCount).toBe(1);
    expect(step.finished).toBe(false);
  });

  it('finishes after closing', () => {
    const step = getNextInterviewStep('closing', 1, 5, 5);
    expect(step.nextPhase).toBe('closing');
    expect(step.finished).toBe(true);
  });

  it('parses turnId and summary from generate response', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        nextQuestion: 'Any final thoughts?',
        turnId: 'turn-123',
        summary: 'Good interview.',
        finished: true
      }),
      { status: 200 }
    );

    const parsed = await parseGenerateResponse(mockResponse);
    expect(parsed).toMatchObject({
      finished: true,
      turnId: 'turn-123',
      summary: 'Good interview.',
      nextQuestion: 'Any final thoughts?'
    });
  });
});
