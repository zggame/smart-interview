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

function getVideoExtension(mimeType: string) {
  if (mimeType === 'video/mp4') {
    return 'mp4';
  }

  return 'webm';
}

function createInterviewStorageKey(mimeType: string) {
  return `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${getVideoExtension(mimeType)}`;
}

export async function createInterviewUploadUrl({
  mimeType,
}: {
  mimeType: string;
}) {
  const storageKey = createInterviewStorageKey(mimeType);
  const { data, error } = await supabase.storage
    .from('interviews')
    .createSignedUploadUrl(storageKey);

  if (error) {
    throw new Error(`Failed to create interview upload URL: ${error.message}`);
  }

  return {
    path: data.path,
    signedUrl: data.signedUrl,
    storageKey,
    token: data.token,
  };
}

export async function downloadInterviewRecording(storageKey: string) {
  const { data, error } = await supabase.storage
    .from('interviews')
    .download(storageKey);

  if (error) {
    throw new Error(`Failed to download interview recording: ${error.message}`);
  }

  return {
    blob: data,
    mimeType: data.type || 'video/webm',
  };
}
