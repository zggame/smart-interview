import { describe, expect, it } from 'vitest';
import { getSupabaseServerConfig, getSupabaseBrowserConfig } from './supabase-config';

describe('supabase-config', () => {
  it('throws when server credentials are missing', () => {
    expect(() =>
      getSupabaseServerConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock',
      })
    ).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('only enables mock mode explicitly', () => {
    expect(
      getSupabaseServerConfig({
        SUPABASE_USE_MOCK: 'true',
      })
    ).toEqual({
      mode: 'mock',
      url: 'https://mock.supabase.co',
      anonKey: 'mock-key',
      serviceRoleKey: 'mock-key',
    });
  });
});
