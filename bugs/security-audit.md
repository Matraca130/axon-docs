# Security Audit

> **Updated:** 2026-03-14 (audit pass 3 — verified against source)

## Critical Issues

### 1. JWT Not Cryptographically Verified (BUG-002)

**Status:** Mitigated
**File:** `db.ts` — `authenticate()`

Mitigated by PostgREST (validates on DB query), exp check, admin routes use getUser().
Residual risk on non-DB routes.

### 2. RLS Disabled on Content Tables (BUG-003)

**Status:** Partially mitigated
Backend enforces via `checkContentScope()`. RPCs revoked from authenticated role (`20260312_01`).
Direct Supabase access still bypasses.

### 3. CORS Wildcard (BUG-004)

**Status:** **NOT FIXED — reverted to `"*"`**
Was restricted (commit `33eb56e`) but reverted for MVP development.
`index.ts` comment: "MVP: Temporarily reverted to '*' for development flexibility."
**Must restrict before production launch.**

### 4. ~~No Rate Limiting~~ FIXED (O-8)

120 req/min sliding window + 20 AI POST/hr + 10 pre-generate/hr.

### 5. ~~Webhook Idempotency~~ FIXED (O-7)

`processed_webhook_events` table for Stripe + Mux.

### 6. ~~Stripe Timing-Safe~~ FIXED (N-10)

Constant-time via `timing-safe.ts`.

### 7. ~~Storage atob()~~ FIXED (O-6)
### 8. ~~Search ilike~~ FIXED (N-8)
### 9. ~~PostgREST or()~~ FIXED (O-1 + P-3)
### 10. ~~Password max~~ FIXED (P-5, 128 chars)
### 11. ~~Batch size~~ FIXED (P-7, 100 paths)

## Summary

| Issue | Status |
|---|---|
| JWT verification | Mitigated (BUG-002) |
| RLS disabled | Partially mitigated (BUG-003) |
| **CORS wildcard** | **NOT FIXED — reverted to `"*"` for MVP** |
| Rate limiting | FIXED |
| Webhook idempotency | FIXED |
| Stripe timing-safe | FIXED |
| Storage atob() | FIXED |
| Search ilike | FIXED |
| or() injection | FIXED |
| Password max length | FIXED |
| Batch size limits | FIXED |
