const MOCK_SUPABASE_URL = 'https://mock.supabase.co';
const MOCK_SUPABASE_KEY = 'mock-key';

export interface SupabaseServerConfig {
  mode: 'live' | 'mock';
  url: string;
  serviceRoleKey: string;
}

export function getSupabaseServerConfig(
  env: NodeJS.ProcessEnv = process.env
): SupabaseServerConfig {
  if (env.SUPABASE_USE_MOCK === 'true') {
    return {
      mode: 'mock',
      url: MOCK_SUPABASE_URL,
      serviceRoleKey: MOCK_SUPABASE_KEY,
    };
  }

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  }

  return {
    mode: 'live',
    url,
    serviceRoleKey,
  };
}
