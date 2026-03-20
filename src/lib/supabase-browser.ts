import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowser() {
  if (!browserClient) {
    browserClient = createClient(
      requireEnv('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl),
      requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', supabaseAnonKey)
    );
  }

  return browserClient;
}
