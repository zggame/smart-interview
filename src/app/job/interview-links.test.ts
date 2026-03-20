import test from 'node:test';
import assert from 'node:assert/strict';

import { mapInterviewSessionsToLinks } from './interview-links.ts';

test('mapInterviewSessionsToLinks converts persisted sessions into dashboard links', () => {
  assert.deepEqual(
    mapInterviewSessionsToLinks(
      [
        { id: 'interview-1', candidate_name: 'Alice Smith' },
        { id: 'interview-2', candidate_name: 'Bob Jones' },
      ],
      'https://smartinterview.example'
    ),
    [
      {
        name: 'Alice Smith',
        url: 'https://smartinterview.example/interview/interview-1',
      },
      {
        name: 'Bob Jones',
        url: 'https://smartinterview.example/interview/interview-2',
      },
    ]
  );
});
