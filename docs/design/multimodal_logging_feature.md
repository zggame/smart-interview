# Design: Multimodal Video Analysis & Structured Logging

This document summarizes the recent architecture and feature updates to the `smart-interview` system, enabling context-aware follow-up questions and debuggable logging pipelines.

---

## 📅 Overview

To simulate a fully immersive technical interview, the system previously ignored the actual recorded response of candidates. Questions were generated based solely on static text and job descriptions.

We upgraded the pipeline to **watch and analyze the video** directly utilizing the multimodal capabilities of `gemini-2.5-flash`. Additionally, we added a **custom file-based logging system** to safely manage and audit backend state.

---

## 📹 Part 1: Multimodal Video Analysis

### **How it works**
1. **Recording & Upload**: 
   * Frontend: `src/app/interview/page.tsx` records candidates via `MediaRecorder`.
   * After saving to Supabase Storage, it sends the raw `.webm` video blob through `FormData` POST to the `/api/interview/generate` endpoint.
2. **File Processing**:
   * Backend: `src/app/api/interview/generate/route.ts` parses the stream, writing it to a temporary file in local `/tmp/`.
   * It uploads the buffer securement to **Gemini File API** via `ai.files.upload()`.
3. **Wait Processing State**:
   * Since video requires brief transcoding, we added a polling interval with `ai.files.get()` verifying file `state === 'ACTIVE'` before proceeding.
4. **Content Generation query**:
   * Feeds the `uploadedFile` object and textual context items inside `createUserContent([videoPart, textPrompt])`.
   * Gemini analyzes the speech tone, text topics, and body language to ask a dynamic follow-up.

---

## 🪵 Part 2: Structured Logging System

To better audit API generation issues like Rate Limits or Processing Failures, a lightweight diagnostics logger was appended.

### **Logger config** (`logger.config.json`)
Allows controlling logging outputs without redeploying code files.
```json
{
  "level": "DEBUG",
  "logDir": "./tmp",
  "console": true,
  "file": true,
  "contexts": {
    "InterviewAPI": "DEBUG"
  }
}
```

### **Core Modules** (`src/lib/logger.ts`)
* Implements static `DEBUG`, `INFO`, `WARN`, `ERROR` priorities.
* Dual routing output: Prints cleanly to developer consoles + appends robust audit hooks into daily rotating files (`./tmp/app-YYYY-MM-DD.log`).
* Automatically excludes from commits via `.gitignore`.
