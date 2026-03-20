import { afterEach, describe, expect, it, vi } from 'vitest';

const mockGenerateContent = vi.fn();
const mockFilesUpload = vi.fn();
const mockFilesGet = vi.fn();
const mockCreateUserContent = vi.fn((parts) => parts);
const mockCreatePartFromUri = vi.fn((uri, mimeType) => ({ uri, mimeType }));
const mockDownloadInterviewRecording = vi.fn();

vi.mock('@google/genai', () => {
  class GoogleGenAI {
    models = {
      generateContent: mockGenerateContent,
    };

    files = {
      upload: mockFilesUpload,
      get: mockFilesGet,
    };
  }

  return {
    GoogleGenAI,
    createUserContent: mockCreateUserContent,
    createPartFromUri: mockCreatePartFromUri,
  };
});

vi.mock('@/lib/supabase-server', () => ({
  downloadInterviewRecording: mockDownloadInterviewRecording,
}), { virtual: true });

describe('POST /api/interview/generate', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('downloads the recorded video from private storage and returns the next question', async () => {
    const { POST } = await import('./route');

    mockFilesUpload.mockResolvedValue({
      uri: 'https://example.com/video.webm',
      mimeType: 'video/webm',
      name: 'files/123',
    });
    mockFilesGet.mockResolvedValue({ state: 'ACTIVE' });
    mockGenerateContent.mockResolvedValue({ text: 'What challenges did you run into?' });
    mockDownloadInterviewRecording.mockResolvedValue({
      blob: new Blob(['fake-video'], { type: 'video/webm' }),
      mimeType: 'video/webm',
    });

    const response = await POST(
      new Request('http://localhost/api/interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: 'Build reliable APIs.',
          skills: 'TypeScript',
          history: [{ role: 'assistant', content: 'Tell me about your background.' }],
          phase: 'intro',
          questionNumber: 2,
          storageKey: '2026-03-19/answer-1.webm',
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      nextQuestion: 'What challenges did you run into?',
      finished: false,
    });
    expect(mockDownloadInterviewRecording).toHaveBeenCalledTimes(1);
    expect(mockDownloadInterviewRecording).toHaveBeenCalledWith('2026-03-19/answer-1.webm');
  });

  it('passes structured history entries through to the Gemini prompt', async () => {
    const { POST } = await import('./route');

    mockFilesUpload.mockResolvedValue({
      uri: 'https://example.com/video.webm',
      mimeType: 'video/webm',
      name: 'files/123',
    });
    mockFilesGet.mockResolvedValue({ state: 'ACTIVE' });
    mockGenerateContent.mockResolvedValue({ text: 'Tell me about a trade-off you made.' });
    mockDownloadInterviewRecording.mockResolvedValue({
      blob: new Blob(['fake-video'], { type: 'video/webm' }),
      mimeType: 'video/webm',
    });

    await POST(
      new Request('http://localhost/api/interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: 'Build reliable APIs.',
          skills: 'TypeScript',
          history: [
            { role: 'assistant', content: 'Tell me about your background.' },
            { role: 'user', content: '[User answered via private video object: 2026-03-19/answer-1.webm]' },
          ],
          phase: 'intro',
          questionNumber: 2,
          storageKey: '2026-03-19/answer-1.webm',
        }),
      })
    );

    expect(mockCreateUserContent).toHaveBeenCalledTimes(1);
    const prompt = mockCreateUserContent.mock.calls[0]?.[0]?.[1];
    expect(prompt).toContain('"role":"assistant"');
    expect(prompt).toContain('"role":"user"');
    expect(prompt).toContain('2026-03-19/answer-1.webm');
    expect(prompt.match(/2026-03-19\/answer-1\.webm/g)).toHaveLength(1);
  });

  it('analyzes the final technical answer before finishing the interview', async () => {
    const { POST } = await import('./route');

    mockFilesUpload.mockResolvedValue({
      uri: 'https://example.com/video.webm',
      mimeType: 'video/webm',
      name: 'files/999',
    });
    mockFilesGet.mockResolvedValue({ state: 'ACTIVE' });
    mockDownloadInterviewRecording.mockResolvedValue({
      blob: new Blob(['final-video'], { type: 'video/webm' }),
      mimeType: 'video/webm',
    });
    mockGenerateContent.mockResolvedValue({ text: 'Thanks for finishing the interview.' });

    const response = await POST(
      new Request('http://localhost/api/interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: 'Build reliable APIs.',
          skills: 'TypeScript',
          history: [{ role: 'assistant', content: 'Explain a production incident.' }],
          phase: 'technical',
          questionNumber: 5,
          storageKey: '2026-03-19/answer-5.webm',
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      nextQuestion: 'Thanks for finishing the interview.',
      finished: false,
    });
    expect(mockDownloadInterviewRecording).toHaveBeenCalledWith('2026-03-19/answer-5.webm');
    expect(mockFilesUpload).toHaveBeenCalledTimes(1);
  });
});
