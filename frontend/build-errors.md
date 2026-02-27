# Frontend Build Errors

> Current errors preventing the Vercel build from succeeding.

## Error 1: Missing `platformApi` functions

**Error message:**
```
TS2339: Property 'createStudySession' does not exist on type '...'
TS2339: Property 'updateStudySession' does not exist on type '...'
TS2339: Property 'submitReview' does not exist on type '...'
```

**Cause:** Frontend components reference API functions that were never added to `platformApi.ts`.

**Fix (HF-B):** Add the missing functions to `platformApi.ts`:

```typescript
// In platformApi.ts — add these functions:

async createStudySession(data: {
  topic_id: string;
  session_type?: string;
}) {
  return this.post('/study-sessions', data);
}

async updateStudySession(id: string, data: {
  completed_at?: string;
  score?: number;
}) {
  return this.put(`/study-sessions/${id}`, data);
}

async submitReview(data: {
  flashcard_id?: string;
  quiz_question_id?: string;
  rating: number;
  response_time_ms?: number;
}) {
  return this.post('/reviews', data);
}
```

**Note:** Verify the exact endpoint paths and payload shapes against the backend before implementing.

## Status

| Error | Hotfix | Status |
|---|---|---|
| Missing platformApi functions | HF-B | ❌ Pending |
