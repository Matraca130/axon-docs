# Security Audit

> **Updated:** 2026-03-19 (full security audit resolved — backend + frontend hardened)

## Resolved Issues (2026-03-19)

### 1. JWT Cryptographic Verification (BUG-002) -- RESOLVED

**Status:** FIXED 2026-03-19
**File:** `db.ts` — `authenticate()`

Was: base64-only decode, PostgREST mitigated on DB routes only.
Now: jose + ES256 JWKS cryptographic verification on all routes.

### 2. RLS on All Tables (BUG-003 / AUTH-001) -- RESOLVED

**Status:** FIXED 2026-03-19

Was: RLS disabled, backend enforced via `checkContentScope()` only.
Now: RLS enabled on 33+ tables with institution-scoped policies. `auth.user_institution_ids()` helper created.

### 3. CORS Wildcard (BUG-004) -- RESOLVED

**Status:** FIXED 2026-03-19
**File:** `index.ts`

Was: `"*"` wildcard for MVP development.
Now: Wildcard removed, returns 403 for missing Origin header.

### 4. Telegram Webhook Hardening -- RESOLVED

**Status:** FIXED 2026-03-19

Timing-safe comparison for webhook secret, fail-closed when no secret configured, admin routes hardened.

### 5. AI Prompt Injection -- RESOLVED

**Status:** FIXED 2026-03-19

Universal `sanitizeForPrompt()` applied on all 6 AI route files.

### 6. AI Output Validation -- RESOLVED

**Status:** FIXED 2026-03-19

`stripHtmlTags` on all LLM output before DB insert (flashcards + quizzes).

### 7. Access Control Hardening -- RESOLVED

**Status:** FIXED 2026-03-19

- `bulk_reorder` REVOKE from authenticated
- Gamification institution scoping added
- SECURITY DEFINER functions hardened (search_path set)

### 8. Signup Rate Limiting -- RESOLVED

**Status:** FIXED 2026-03-19

`/signup` now rate-limited at 5 req/min. (General rate limiting was already fixed: 120 req/min sliding window + 20 AI POST/hr + 10 pre-generate/hr.)

### 9. Error Message Sanitization -- RESOLVED

**Status:** FIXED 2026-03-19

`safeErr()` strips internal DB details from client responses.

### 10. XSS Prevention (Frontend) -- RESOLVED

**Status:** FIXED 2026-03-19

DOMPurify sanitization on all `dangerouslySetInnerHTML` usage (6 components + `enrichHtmlWithImages`).

### 11. Security Headers (Frontend) -- RESOLVED

**Status:** FIXED 2026-03-19

- Content-Security-Policy: script-src self, no unsafe-eval
- Strict-Transport-Security: 2yr + includeSubDomains
- Permissions-Policy: microphone=self (for voice features)

### 12. Route Guards (Frontend) -- RESOLVED

**Status:** FIXED 2026-03-19

`RequireRole` added on student routes.

## Previously Fixed

| # | Issue | Status |
|---|---|---|
| O-8 | Rate limiting (general) | FIXED |
| O-7 | Webhook idempotency | FIXED |
| N-10 | Stripe timing-safe | FIXED |
| O-6 | Storage atob() | FIXED |
| N-8 | Search ilike | FIXED |
| O-1 + P-3 | PostgREST or() injection | FIXED |
| P-5 | Password max length (128) | FIXED |
| P-7 | Batch size limits (100) | FIXED |

## Remaining Open Items

| ID | Severity | Description | Blocker |
|---|---|---|---|
| SEC-S7 | LOW | JWT expiry 3600s (want 300s) | Requires Supabase Pro plan |
| SEC-S9B | MEDIUM | 6 SQL functions need REVOKE from authenticated | ~12 callers must migrate to adminDb first |
| SEC-S16 | LOW | 13 low/info backlog items | Backlog priority |

## Summary

| Category | Status |
|---|---|
| JWT verification | **FIXED** (jose + ES256 JWKS) |
| RLS (33+ tables) | **FIXED** (institution-scoped) |
| CORS | **FIXED** (403 on missing Origin) |
| Telegram webhooks | **FIXED** (timing-safe, fail-closed) |
| AI prompt injection | **FIXED** (sanitizeForPrompt) |
| AI output validation | **FIXED** (stripHtmlTags) |
| Access control | **FIXED** (REVOKE, scoping, DEFINER) |
| Signup rate limit | **FIXED** (5 req/min) |
| Error sanitization | **FIXED** (safeErr) |
| XSS (frontend) | **FIXED** (DOMPurify) |
| CSP + HSTS + Permissions | **FIXED** (all headers added) |
| Route guards | **FIXED** (RequireRole) |
| JWT expiry (S7) | Open — needs Pro plan |
| SQL REVOKE (S9B) | Open — migration needed |
| Backlog (S16) | Open — 13 low/info items |
