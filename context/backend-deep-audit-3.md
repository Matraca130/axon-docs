# Backend Deep Audit #3 — Ultra-Deep: Subtle Bugs, Data Isolation & Edge Cases

**Date:** 2026-02-27
**Auditor:** AI assistant
**Scope:** All 15 files in `supabase/functions/server/` (third pass)
**Previous audits:**
- Audit #1: `backend-architecture-audit.md` (M-1..M-5, all done)
- Audit #2: `backend-deep-audit-2.md` (N-1..N-10, all done)

**Overall grade: A** (up from A- after O-1..O-6 fixes)

> **STATUS:** 8 of 8 items completed. All previously deferred items are now DONE.
>
> **v4.5 UPDATE (2026-03-14):** O-3, O-4, O-7, O-8 all resolved in subsequent commits.

---

## Completion Status

| ID | Category | Severity | Status | Notes |
|----|----------|----------|--------|-------|
| O-1 | Correctness | **HIGH** | DONE | `3954c10` — or() quoting |
| O-2 | Error Handling | **HIGH** | DONE | `3954c10` — safeJson storage |
| O-3 | Data Isolation | **HIGH** | **DONE** | Session ownership verification in reviews |
| O-4 | Performance | MEDIUM | **DONE** | Trigram indexes applied (migration `20260227_05`) |
| O-5 | Data Isolation | MEDIUM | DONE | `3954c10` — GET/:id scopeToUser |
| O-6 | Error Handling | LOW | DONE | `3954c10` — atob try/catch |
| O-7 | Correctness | MEDIUM | **DONE** | Webhook idempotency for Stripe + Mux |
| O-8 | Security | MEDIUM | **DONE** | Rate limiting: 120 req/min + 20 AI POST/hr |

---

## O-1: PostgREST `or()` Filter Injection FIXED

**Commit:** `3954c10`
Values in `or()` filter now wrapped in double-quotes per PostgREST spec.
Double-quote escaping added in P-3.

## O-2: Storage Routes Missing `safeJson()` FIXED

**Commit:** `3954c10`
All storage routes now use `safeJson(c)` + null check.

## O-3: Reviews Not Scoped to Student — DONE

**Fix:** Session ownership verification added in `routes/study/reviews.ts`.
Before proceeding with review operations, the backend verifies that the study session belongs to the requesting user.

## O-4: Missing Trigram Indexes — DONE

**Fix:** `CREATE EXTENSION pg_trgm` + GIN indexes on key text columns.
Migration `20260227_05` applied.

## O-5: Factory `GET /:id` Ignores `scopeToUser` FIXED

**Commit:** `3954c10`
GET by ID now applies `scopeToUser` filter.

## O-6: Storage Base64 `atob()` No Try/Catch FIXED

**Commit:** `3954c10`
`atob()` wrapped in try/catch. Invalid base64 returns 400.

## O-7: Webhook Handlers Lack Idempotency — DONE

**Fix:** `processed_webhook_events` table + event tracking for both Stripe and Mux.
Migration `20260227_06` applied.

## O-8: No Rate Limiting — DONE

**Fix:** Multi-layer rate limiting:
- General: 120 req/min sliding window (in-memory, `rate-limit.ts`)
- AI POST: 20/hr per user (distributed via `check_rate_limit()` RPC, migration `20260303_02`)
- Pre-generate: 10/hr per user (separate bucket)

---

## Cross-Audit Summary: All 3 Audits

| Audit | Findings | Completed |
|-------|----------|-----------|
| #1 (M-1..M-5) | 5 | 5/5 |
| #2 (N-1..N-10) | 10 | 10/10 |
| #3 (O-1..O-8) | 8 | 8/8 |

**Total: 23 findings across 3 audits. ALL 23 COMPLETED.**
