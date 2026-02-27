# Runtime Payload Bugs

> Frontend sends wrong column names to backend. Backend returns 400/500.
> Discovered 2025-02-27 during HF-B audit.
> **STATUS: FIXED** — All 4 RT bugs resolved in commits f202422..db6e52e.

## Summary

The frontend API service files were sending payloads with column names that **didn't match the actual DB schema**. The Vite build passed (esbuild doesn't type-check), but the backend rejected or ignored these fields at runtime.

## Bug List — ALL FIXED

### RT-001: `closeStudySession` sends wrong columns — DONE

**Fix:** `ended_at` → `completed_at`, removed `duration_seconds`
**Files changed:** studySessionApi.ts, quizApi.ts, useFlashcardEngine.ts, FlashcardReviewer.tsx, ReviewSessionView.tsx, QuizTaker.tsx

### RT-002: `StudySessionRecord` type has wrong field names — DONE

**Fix:** `user_id` → `student_id`, `ended_at` → `completed_at`, removed `duration_seconds`, added `'reading'` to session_type
**Files changed:** studySessionApi.ts, quizApi.ts

### RT-003: `submitReview` allows wrong fields — DONE

**Fix:** `instrument_type` widened to `'flashcard' | 'quiz'`, removed `response_time_ms`
**Files changed:** studySessionApi.ts, useFlashcardEngine.ts

### RT-004: `platformApi.ts` ReviewRequest has phantom fields — DONE

**Fix:** Removed `subtopic_id`, `keyword_id`, `response_time_ms` from ReviewRequest
**Files changed:** platformApi.ts

## Verification

After Vercel deploys, test:
1. Start a flashcard review session → should create session without error
2. Grade cards → reviews should POST successfully
3. Finish session → session should close with `completed_at`
4. Start a quiz → same flow, quiz sessions should close correctly
