# Private Interview Storage Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make interview recordings private by removing client-side public storage access and moving upload/access control to the server.

**Architecture:** The browser will send recorded video blobs only to the existing interview API route. The route will upload the blob to Supabase using a server-only client, pass the same blob to Gemini for analysis, and keep only a private storage object key in history. The client will no longer depend on public bucket URLs or the browser Supabase client.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase Storage, Google GenAI, Node test runner

---

## Chunk 1: Test Coverage

### Task 1: Add route-level regression tests

**Files:**
- Create: `src/app/api/interview/generate/route.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run the route test to verify it fails**
- [ ] **Step 3: Add minimal test harness support if needed**
- [ ] **Step 4: Run the route test to verify the failure is the target behavior**

### Task 2: Add client-flow regression tests

**Files:**
- Create: `src/app/interview/page.test.tsx`
- Modify: `package.json`

- [ ] **Step 1: Write the failing tests for API failure and upload failure recovery**
- [ ] **Step 2: Run the client test to verify it fails**
- [ ] **Step 3: Add minimal test harness support if needed**
- [ ] **Step 4: Run the client test to verify the failure is the target behavior**

## Chunk 2: Server-Side Private Upload Path

### Task 3: Add a server-only Supabase storage client

**Files:**
- Create: `src/lib/supabase-server.ts`

- [ ] **Step 1: Read the existing Supabase client usage**
- [ ] **Step 2: Add a server-only helper using the service-role key**
- [ ] **Step 3: Keep the helper scoped to storage upload needs only**
- [ ] **Step 4: Run the targeted tests**

### Task 4: Move interview recording persistence into the API route

**Files:**
- Modify: `src/app/api/interview/generate/route.ts`
- Test: `src/app/api/interview/generate/route.test.ts`

- [ ] **Step 1: Update the route to upload incoming video blobs to private storage**
- [ ] **Step 2: Store a private object key in history instead of a public URL**
- [ ] **Step 3: Keep Gemini analysis using the temp file upload flow**
- [ ] **Step 4: Make the route validate inputs and fail cleanly**
- [ ] **Step 5: Run the route tests and make them pass**

## Chunk 3: Client Cleanup

### Task 5: Remove browser-side storage access

**Files:**
- Modify: `src/app/interview/page.tsx`
- Delete: `src/lib/supabase.ts`
- Test: `src/app/interview/page.test.tsx`

- [ ] **Step 1: Remove the client Supabase dependency and upload logic**
- [ ] **Step 2: Send the recorded blob directly to the API route**
- [ ] **Step 3: Handle non-OK API responses**
- [ ] **Step 4: Recover from processing failures without trapping the UI**
- [ ] **Step 5: Stop media tracks on cleanup**
- [ ] **Step 6: Run the client tests and make them pass**

## Chunk 4: Verification And Operational Change

### Task 6: Final verification and bucket privacy change

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Document the required server-side Supabase secret**
- [ ] **Step 2: Run lint and build**
- [ ] **Step 3: Flip the `interviews` bucket to private**
- [ ] **Step 4: Re-verify bucket state**
