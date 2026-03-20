import { describe, expect, it, vi } from 'vitest';

const mockCreateSignedUploadUrl = vi.fn();
const mockDownload = vi.fn();

vi.mock('server-only', () => ({}), { virtual: true });

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        createSignedUploadUrl: mockCreateSignedUploadUrl,
        download: mockDownload,
      })),
    },
  })),
}));

describe('supabase-server helpers', () => {
  it('creates a signed upload target for interview recordings', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    mockCreateSignedUploadUrl.mockResolvedValue({
      data: {
        path: '2026-03-19/answer-1.webm',
        signedUrl: 'https://example.supabase.co/upload',
        token: 'abc',
      },
      error: null,
    });

    const { createInterviewUploadUrl } = await import('./supabase-server');
    const result = await createInterviewUploadUrl({ mimeType: 'video/webm' });

    expect(result.path).toBe('2026-03-19/answer-1.webm');
    expect(result.signedUrl).toBe('https://example.supabase.co/upload');
    expect(result.token).toBe('abc');
    expect(result.storageKey).toMatch(/\.webm$/);
  });

  it('downloads a private recording blob', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    mockDownload.mockResolvedValue({
      data: new Blob(['video'], { type: 'video/webm' }),
      error: null,
    });

    const { downloadInterviewRecording } = await import('./supabase-server');
    const result = await downloadInterviewRecording('2026-03-19/answer-1.webm');

    expect(result.mimeType).toBe('video/webm');
    expect(result.blob).toBeInstanceOf(Blob);
  });
});
