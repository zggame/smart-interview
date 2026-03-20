import test from 'node:test';
import assert from 'node:assert/strict';

import { getSupabaseServerConfig } from './supabase-config.ts';

test('getSupabaseServerConfig throws when server credentials are missing', () => {
  assert.throws(
    () =>
      getSupabaseServerConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      }),
    /SUPABASE_SERVICE_ROLE_KEY/
  );
});

test('getSupabaseServerConfig only enables mock mode explicitly', () => {
  assert.deepEqual(
    getSupabaseServerConfig({
      SUPABASE_USE_MOCK: 'true',
    }),
    {
      mode: 'mock',
      url: 'https://mock.supabase.co',
      serviceRoleKey: 'mock-key',
    }
  );
});
