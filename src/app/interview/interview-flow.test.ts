import test from 'node:test';
import assert from 'node:assert/strict';

import { createUploadRecoveryState } from './interview-flow.ts';

test('createUploadRecoveryState returns a recoverable prep state with reset timers', () => {
  assert.deepEqual(
    createUploadRecoveryState({
      prepTimeLimit: 45,
      recordTimeLimit: 180,
    }),
    {
      status: 'prep',
      prepTimeLeft: 45,
      recordTimeLeft: 180,
    }
  );
});
