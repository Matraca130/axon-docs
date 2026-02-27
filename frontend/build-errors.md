# Frontend Build Errors

> Current errors preventing the Vercel build from succeeding.
> **UPDATED with correct column names from Query 2.**

## Error 1: Missing `platformApi` functions

**Error message:**
```
TS2339: Property 'createStudySession' does not exist on type '...'
TS2339: Property 'updateStudySession' does not exist on type '...'
TS2339: Property 'submitReview' does not exist on type '...'
```

## CORRECTED Fix (HF-B)

The initial fix had wrong column names! Here are the CORRECT payloads:

### createStudySession

```typescript
async createStudySession(data: {
  student_id: string;    // NOT user_id!
  course_id?: string;    // NOT topic_id!
  session_type: 'flashcard' | 'quiz' | 'reading' | 'mixed';
}) {
  return this.post('/study-sessions', data);
}
```

DB columns: `student_id` (NOT NULL), `course_id` (nullable), `session_type` (NOT NULL, CHECK: flashcard/quiz/reading/mixed), `started_at` (auto), `total_reviews` (default 0), `correct_reviews` (default 0)

### updateStudySession

```typescript
async updateStudySession(id: string, data: {
  completed_at?: string;
  total_reviews?: number;
  correct_reviews?: number;
  // NO score column!
}) {
  return this.put(`/study-sessions/${id}`, data);
}
```

### submitReview

```typescript
async submitReview(data: {
  session_id: string;       // NOT optional! FK -> study_sessions
  item_id: string;          // Generic UUID (flashcard or quiz_question)
  instrument_type: 'flashcard' | 'quiz';  // NOT separate flashcard_id/quiz_question_id!
  grade: number;            // NOT rating!
}) {
  return this.post('/reviews', data);
}
```

DB columns: `session_id` (NOT NULL), `item_id` (NOT NULL), `instrument_type` (NOT NULL, CHECK: flashcard/quiz), `grade` (NOT NULL)

**NO** `user_id`, `flashcard_id`, `quiz_question_id`, `rating`, `response_time_ms`, or `reviewed_at` columns exist.

## Status

| Error | Hotfix | Status |
|---|---|---|
| Missing platformApi functions | HF-B | PENDING - use CORRECTED payloads above |
