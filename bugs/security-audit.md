# Security Audit

> Findings from the backend code audit. Updated: 2025-02-27.

## Summary

| Finding | Severity | Status |
|---|---|---|
| RLS disabled on 3 tables | 🔴 Critical | Pending |
| JWT without signature verification | 🔴 Critical | Pending |
| CORS origin: * | 🟡 High | Pending |
| No rate limiting | 🟡 High | Pending |
| Service role key exposure risk | 🟡 High | Review needed |

## Detail

### 1. RLS Disabled (Critical)

**Tables affected:** `flashcards`, `quiz_questions`, `quizzes`

These tables have RLS completely disabled. Since the backend uses the Supabase service role key, it bypasses RLS anyway — but if any direct Supabase access exists (PostgREST, realtime, etc.), data is fully exposed.

**Recommended policies:**
```sql
-- Example for flashcards
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access flashcards from their institutions"
ON flashcards FOR ALL
USING (
  keyword_id IN (
    SELECT k.id FROM keywords k
    JOIN summaries s ON k.summary_id = s.id
    JOIN topics t ON s.topic_id = t.id
    JOIN sections sec ON t.section_id = sec.id
    JOIN semesters sem ON sec.semester_id = sem.id
    JOIN courses c ON sem.course_id = c.id
    JOIN memberships m ON m.institution_id = c.institution_id
    WHERE m.user_id = auth.uid() AND m.status = 'active'
  )
);
```

### 2. JWT Not Verified (Critical)

The backend reads the JWT from `X-Access-Token` and decodes it, but does NOT verify the cryptographic signature. This means:

- Anyone can base64-encode a fake JWT payload
- The backend will trust it as a valid user

**Fix:** Use Supabase JWT secret (from project settings) to verify with a library like `jose`.

### 3. CORS origin: * (High)

The Hono CORS middleware is configured with `origin: "*"`, allowing any website to make authenticated requests.

**Fix:**
```typescript
app.use('*', cors({
  origin: [
    'https://your-app.vercel.app',
    'http://localhost:5173', // dev only
  ],
  credentials: true,
}))
```

### 4. No Rate Limiting (High)

No rate limiting middleware exists. API is vulnerable to brute force and DoS.

**Fix:** Add rate limiting via Hono middleware or Deno Deploy's built-in options.
