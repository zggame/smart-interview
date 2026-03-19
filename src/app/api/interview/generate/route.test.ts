import { afterEach, describe, expect, it, vi } from 'vitest';

const mockGenerateContent = vi.fn();
const mockFilesUpload = vi.fn();
const mockFilesGet = vi.fn();
const mockCreateUserContent = vi.fn((parts) => parts);
const mockCreatePartFromUri = vi.fn((uri, mimeType) => ({ uri, mimeType }));
const mockServerUploadInterviewRecording = vi.fn();

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
  uploadInterviewRecording: mockServerUploadInterviewRecording,
}), { virtual: true });

describe('POST /api/interview/generate', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('uploads the recorded video through the server storage path and returns the next question', async () => {
    const { POST } = await import('./route');

    mockFilesUpload.mockResolvedValue({
      uri: 'https://example.com/video.webm',
      mimeType: 'video/webm',
      name: 'files/123',
    });
    mockFilesGet.mockResolvedValue({ state: 'ACTIVE' });
    mockGenerateContent.mockResolvedValue({ text: 'What challenges did you run into?' });
    mockServerUploadInterviewRecording.mockResolvedValue({
      storageKey: 'interviews/session-1/answer-1.webm',
    });

    const videoBlob = new Blob(['fake-video'], { type: 'video/webm' });
    const formData = new FormData();
    formData.append('jobDescription', 'Build reliable APIs.');
    formData.append('skills', 'TypeScript');
    formData.append('history', JSON.stringify([{ role: 'assistant', content: 'Tell me about your background.' }]));
    formData.append('phase', 'intro');
    formData.append('questionNumber', '2');
    formData.append('video', videoBlob, 'answer.webm');

    const response = await POST(
      new Request('http://localhost/api/interview/generate', {
        method: 'POST',
        body: formData,
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      nextQuestion: 'What challenges did you run into?',
      finished: false,
    });
    expect(mockServerUploadInterviewRecording).toHaveBeenCalledTimes(1);
    expect(mockServerUploadInterviewRecording).toHaveBeenCalledWith(
      expect.objectContaining({
        blob: expect.any(Blob),
        mimeType: 'video/webm',
      })
    );
  });
});
