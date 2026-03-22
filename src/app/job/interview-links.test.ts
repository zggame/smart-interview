import { describe, expect, it } from 'vitest';
import { mapInterviewSessionsToLinks } from './interview-links';

describe('interview-links', () => {
  it('converts persisted sessions into dashboard links', () => {
    expect(
      mapInterviewSessionsToLinks(
        [
          { id: 'interview-1', candidate_name: 'Alice Smith' },
          { id: 'interview-2', candidate_name: 'Bob Jones' },
        ],
        'https://smartinterview.example'
      )
    ).toEqual([
      {
        id: 'interview-1',
        name: 'Alice Smith',
        email: undefined,
        status: undefined,
        expiresAt: undefined,
        recommendation: undefined,
        summary: undefined,
        url: 'https://smartinterview.example/interview/interview-1',
      },
      {
        id: 'interview-2',
        name: 'Bob Jones',
        email: undefined,
        status: undefined,
        expiresAt: undefined,
        recommendation: undefined,
        summary: undefined,
        url: 'https://smartinterview.example/interview/interview-2',
      },
    ]);
  });
});
