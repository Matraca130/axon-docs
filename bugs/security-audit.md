# Security Audit

> **Updated:** 2026-03-14

## Critical Issues

### 1. JWT Not Cryptographically Verified (BUG-002)

**Status:** Mitigated
**File:** `db.ts` — `authenticate()`

`authenticate()` decodes the JWT locally but does NOT verify the cryptographic signature.

**Mitigations:**
- PostgREST validates JWT on every DB query
- Expiration (`exp`) checked locally for fast-fail
- Admin routes use `getAdminClient().auth.getUser(token)` (network verification)

**Residual risk:** Routes calling Gemini/Mux/Stripe APIs without a prior DB query.

### 2. RLS Disabled on Content Tables (BUG-003)

**Status:** Pending (deferred to production hardening)
**Tables:** `flashcards`, `quiz_questions`, `quizzes` (and others)

**Mitigation:** Backend enforces institution scoping via `checkContentScope()` in `crud-factory.ts`. All endpoints verify membership before operating.

**Risk:** Direct Supabase access with anon key bypasses backend.

### 3. ~~CORS Wildcard~~ FIXED

**Status:** **FIXED** (2026-03-06, commit `33eb56e`)
CORS restricted to specific allowed domains.

### 4. ~~No Rate Limiting~~ FIXED

**Status:** **FIXED** (O-8)
- General: 120 req/min sliding window (in-memory)
- AI POST: 20/hr per user (distributed via `check_rate_limit()` RPC)
- Pre-generate: 10/hr per user (separate bucket)

### 5. ~~Webhook Idempotency~~ FIXED

**Status:** **FIXED** (O-7)
- Stripe: `processed_webhook_events` table + event tracking
- Mux: Same idempotency pattern

### 6. ~~Stripe Timing-Safe~~ FIXED

**Status:** **FIXED** (N-10)
Constant-time string comparison via `timing-safe.ts` for webhook signature verification.

### 7. ~~Storage atob() No Try/Catch~~ FIXED

**Status:** **FIXED** (O-6)
Invalid base64 returns 400 instead of unhandled exception.

### 8. ~~Search SQL Injection via ilike~~ FIXED

**Status:** **FIXED** (N-8)
`escapeLike()` sanitizes `%`, `_`, `\` before constructing patterns.

### 9. ~~PostgREST or() Injection~~ FIXED

**Status:** **FIXED** (O-1 + P-3)
Values quoted + double-quote escaping per PostgREST spec.

## Summary

| Issue | Status |
|---|---|
| JWT verification | Mitigated (BUG-002) |
| RLS disabled | Pending (BUG-003) |
| CORS | **FIXED** |
| Rate limiting | **FIXED** |
| Webhook idempotency | **FIXED** |
| Stripe timing-safe | **FIXED** |
| Storage atob() | **FIXED** |
| Search ilike | **FIXED** |
| or() injection | **FIXED** |
| Password max length | **FIXED** (P-5, 128 chars) |
| Batch size limits | **FIXED** (P-7, 100 paths) |
