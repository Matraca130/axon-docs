# Runtime Payload Bugs

> Frontend sends wrong column names to backend. Backend returns 400/500.
> Discovered 2025-02-27 during HF-B audit.
> **Priority: HIGH** — Breaks core student functionality.

## Summary

The frontend API service files send payloads with column names that **don't match the actual DB schema**. The Vite build passes (esbuild doesn't type-check), but the backend rejects or ignores these fields at runtime.

## Bug List

### RT-001: `closeStudySession` sends wrong columns

**Files:** `studySessionApi.ts`, `quizApi.ts`
**Called by:** `FlashcardReviewer.tsx`, `ReviewSessionView.tsx`, `QuizTaker.tsx`, `useFlashcardEngine.ts`

| Sent by frontend | Actual DB column | Notes |
|---|---|---|
| `ended_at` | `completed_at` | Timestamp when session ended |
| `duration_seconds` | **does not exist** | No duration column in study_sessions |

**Current code (studySessionApi.ts):**
```typescript
await sessionApi.closeStudySession(sessionId, {
  ended_at: now.toISOString(),        // WRONG
  duration_seconds: durationSeconds,   // WRONG
  total_reviews: totalCards,           // OK
  correct_reviews: correctReviews,     // OK
});
```

**Correct payload:**
```typescript
await sessionApi.closeStudySession(sessionId, {
  completed_at: now.toISOString(),     // CORRECT
  total_reviews: totalCards,
  correct_reviews: correctReviews,
});
```

### RT-002: `StudySessionRecord` type has wrong field names

**Files:** `studySessionApi.ts`, `quizApi.ts`

| Type field | Actual DB column |
|---|---|
| `user_id` | `student_id` |
| `ended_at` | `completed_at` |
| `duration_seconds` | does not exist |
| session_type missing `'reading'` | CHECK allows `flashcard/quiz/reading/mixed` |

### RT-003: `submitReview` in studySessionApi allows wrong fields

**File:** `studySessionApi.ts`

| Issue | Detail |
|---|---|
| `instrument_type` typed as `'flashcard'` only | Should be `'flashcard' \| 'quiz'` |
| `response_time_ms` in payload | Column does NOT exist in `reviews` table |

**Current:**
```typescript
export async function submitReview(data: {
  session_id: string;
  item_id: string;
  instrument_type: 'flashcard';       // TOO NARROW
  grade: number;
  response_time_ms?: number;           // DOES NOT EXIST IN DB
})
```

**Correct:**
```typescript
export async function submitReview(data: {
  session_id: string;
  item_id: string;
  instrument_type: 'flashcard' | 'quiz';
  grade: number;
  // NO response_time_ms
})
```

### RT-004: `platformApi.ts` ReviewRequest has phantom fields

**File:** `platformApi.ts`

| Field in ReviewRequest | In DB? |
|---|---|
| `session_id` | YES |
| `item_id` | YES |
| `instrument_type` | YES |
| `grade` | YES |
| `subtopic_id` | NO |
| `keyword_id` | NO |
| `response_time_ms` | NO |

The backend's `crud-factory` likely ignores unknown fields, so these don't cause errors — but they bloat payloads and mislead developers.

## Fix Plan

| Step | File | Change | Risk |
|---|---|---|---|
| 1 | `studySessionApi.ts` | Fix `StudySessionRecord` type + `closeStudySession` payload + `submitReview` type | LOW |
| 2 | `quizApi.ts` | Fix `StudySession` type + `closeStudySession` payload | LOW |
| 3 | `platformApi.ts` | Clean `ReviewRequest` type (remove phantom fields) | LOW |
| 4 | Verify | Test flashcard review + quiz flow end-to-end | — |

## Affected Components (5 files call closeStudySession)

1. `src/app/services/studySessionApi.ts` — function definition
2. `src/app/services/quizApi.ts` — function definition
3. `src/app/components/student/FlashcardReviewer.tsx` — calls closeStudySession
4. `src/app/components/roles/pages/student/ReviewSessionView.tsx` — calls closeStudySession
5. `src/app/components/student/QuizTaker.tsx` — calls quizApi.closeStudySession
6. `src/app/hooks/useFlashcardEngine.ts` — calls closeStudySession
