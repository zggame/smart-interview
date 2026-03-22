import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseBrowserConfig } from '@/lib/supabase-config';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowser() {
  if (!browserClient) {
    const config = getSupabaseBrowserConfig();
    browserClient = createBrowserClient(config.url, config.anonKey);
  }

  return browserClient;
}
