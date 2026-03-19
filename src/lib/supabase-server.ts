import 'server-only';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const supabase = createClient(
  requireEnv('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY', supabaseServiceRoleKey)
);

export async function uploadInterviewRecording({
  blob,
  mimeType,
}: {
  blob: Blob;
  mimeType: string;
}) {
  const storageKey = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.webm`;
  const arrayBuffer = await blob.arrayBuffer();
  const { error } = await supabase.storage
    .from('interviews')
    .upload(storageKey, Buffer.from(arrayBuffer), {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload interview recording: ${error.message}`);
  }

  return { storageKey };
}
