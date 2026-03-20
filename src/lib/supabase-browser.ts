import { createClient } from '@supabase/supabase-js';
import { getSupabaseBrowserConfig } from '@/lib/supabase-config';

let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowser() {
  if (!browserClient) {
    const config = getSupabaseBrowserConfig();
    browserClient = createClient(config.url, config.anonKey);
  }

  return browserClient;
}
