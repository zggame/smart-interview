// import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseServerConfig } from '@/lib/supabase-config';

export async function createRecruiterClient() {
  const config = getSupabaseServerConfig();
  const cookieStore = await cookies();

  return createServerClient(
    config.url,
    config.anonKey, // Uses anon key with user session cookies
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

export async function requireRecruiterAuth() {
  const config = getSupabaseServerConfig();
  if (config.mode === 'mock') {
    return {
      user: {
        id: 'mock-recruiter-id',
        email: 'test@example.com',
      }
    };
  }

  const supabase = await createRecruiterClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return { user };
}
