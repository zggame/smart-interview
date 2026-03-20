import { afterEach, describe, expect, it, vi } from 'vitest';

const mockCreateInterviewUploadUrl = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  createInterviewUploadUrl: mockCreateInterviewUploadUrl,
}), { virtual: true });

describe('POST /api/interview/upload-url', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns a signed upload target for a private interview recording', async () => {
    const { POST } = await import('./route');

    mockCreateInterviewUploadUrl.mockResolvedValue({
      path: '2026-03-19/answer-1.webm',
      storageKey: '2026-03-19/answer-1.webm',
      signedUrl: 'https://example.supabase.co/storage/v1/object/upload/sign/interviews/2026-03-19/answer-1.webm?token=abc',
      token: 'abc',
    });

    const response = await POST(
      new Request('http://localhost/api/interview/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mimeType: 'video/webm' }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      path: '2026-03-19/answer-1.webm',
      signedUrl: 'https://example.supabase.co/storage/v1/object/upload/sign/interviews/2026-03-19/answer-1.webm?token=abc',
      storageKey: '2026-03-19/answer-1.webm',
      token: 'abc',
    });
    expect(mockCreateInterviewUploadUrl).toHaveBeenCalledWith({ mimeType: 'video/webm' });
  });
});
