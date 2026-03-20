import { NextResponse } from 'next/server';

import { createInterviewUploadUrl } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mimeType = body?.mimeType;

    if (typeof mimeType !== 'string' || !mimeType.startsWith('video/')) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
    }

    const uploadTarget = await createInterviewUploadUrl({ mimeType });
    return NextResponse.json(uploadTarget);
  } catch {
    return NextResponse.json(
      { error: 'Failed to create upload URL.' },
      { status: 500 }
    );
  }
}
