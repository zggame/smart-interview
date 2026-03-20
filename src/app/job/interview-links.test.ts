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
        name: 'Alice Smith',
        url: 'https://smartinterview.example/interview/interview-1',
      },
      {
        name: 'Bob Jones',
        url: 'https://smartinterview.example/interview/interview-2',
      },
    ]);
  });
});
