# Backend Deep Audit #3 — Ultra-Deep: Subtle Bugs, Data Isolation & Edge Cases

**Date:** 2026-02-27  
**Auditor:** AI assistant  
**Scope:** All 15 files in `supabase/functions/server/` (third pass)  
**Previous audits:**
- Audit #1: `backend-architecture-audit.md` (M-1..M-5, all done)
- Audit #2: `backend-deep-audit-2.md` (N-1..N-10, 8/10 done)

**Overall grade: A** (up from A- after O-1..O-6 fixes)

> **STATUS:** 4 of 8 items completed. O-3/O-7 deferred to RLS/billing phase.
> O-4 deferred until data grows. O-8 deferred to pre-launch.

---

## Completion Status

| ID | Category | Severity | Status | Commit |
|----|----------|----------|--------|--------|
| O-1 | Correctness | **HIGH** | ✅ DONE | `3954c10` |
| O-2 | Error Handling | **HIGH** | ✅ DONE | `3954c10` |
| O-3 | Data Isolation | **HIGH** | ⏳ DEFERRED | RLS phase |
| O-4 | Performance | MEDIUM | ⏳ DEFERRED | When data grows |
| O-5 | Data Isolation | MEDIUM | ✅ DONE | `3954c10` |
| O-6 | Error Handling | LOW | ✅ DONE | `3954c10` |
| O-7 | Correctness | MEDIUM | ⏳ DEFERRED | When billing ships |
| O-8 | Security | MEDIUM | ⏳ DEFERRED | Pre-launch |

---

## O-1: PostgREST `or()` Filter Injection ✅ FIXED

**Commit:** `3954c10`  
**Fix:** Values in `or()` filter now wrapped in double-quotes per PostgREST spec:
```ts
.or(`title.ilike."${pattern}",content_markdown.ilike."${pattern}"`)
```
Commas and parentheses in search queries no longer break the filter.

## O-2: Storage Routes Missing `safeJson()` ✅ FIXED

**Commit:** `3954c10`  
**Fix:** `POST /storage/signed-url` and `DELETE /storage/delete` now use `safeJson(c)` + null check instead of raw `c.req.json()`. Also added `safeJson` to the import from `db.ts`.

## O-3: Reviews Not Scoped to Student ⏳ DEFERRED

**File:** `routes-study.tsx`, reviews GET + POST  
**Impact:** Any authenticated user can list or create reviews for any study session.

Reviews are linked via `session_id` but there's no check that the session belongs to the requesting user. Student A can read student B's review grades.

**Fix options:**
- Application-level: verify session ownership before proceeding
- RLS: policy on `reviews` JOINing `study_sessions.student_id = auth.uid()`

**Status:** Deferred to RLS phase. Known data isolation gap.

## O-4: Missing Trigram Indexes for Search ⏳ DEFERRED

**Impact:** `ilike` on text columns does sequential scans. Affected columns:
- `summaries.title`, `summaries.content_markdown`
- `keywords.name`, `keywords.definition`  
- `videos.title`

**Fix:** `CREATE EXTENSION pg_trgm` + GIN indexes.  
**Status:** Not urgent at current data volume. Apply when >1000 summaries.

## O-5: Factory `GET /:id` Ignores `scopeToUser` ✅ FIXED

**Commit:** `3954c10`  
**Fix:** GET by ID now applies `scopeToUser` filter, matching LIST/UPDATE/DELETE behavior:
```ts
let query = db.from(cfg.table).select("*").eq("id", id);
if (cfg.scopeToUser) query = query.eq(cfg.scopeToUser, user.id);
```
Students can no longer fetch another student's record by UUID.

## O-6: Storage Base64 `atob()` No Try/Catch ✅ FIXED

**Commit:** `3954c10`  
**Fix:** `atob()` wrapped in try/catch. Invalid base64 returns `400 "Invalid base64 data"` instead of unhandled exception.

## O-7: Webhook Handlers Lack Idempotency ⏳ DEFERRED

**File:** `routes-billing.tsx` (Stripe `checkout.session.completed`)  
**Impact:** Retried webhook events could create duplicate subscription rows.

**Fix:** Check for existing subscription before INSERT, or use UPSERT with `stripe_subscription_id` as conflict key.

**Status:** Billing not implemented yet. Fix when Stripe integration goes live.

## O-8: No Rate Limiting ⏳ DEFERRED

**Impact:** No request rate limiting. Risky for `/signup`, `/search`, `/mux/create-upload`.

**Fix:** Hono rate-limit middleware or infrastructure-level limiting.

**Status:** Deferred to pre-launch security hardening.

---

## Cross-Audit Summary: All 3 Audits

| Audit | Findings | Completed | Deferred | 
|-------|----------|-----------|----------|
| #1 (M-1..M-5) | 5 | 5/5 ✅ | 0 |
| #2 (N-1..N-10) | 10 | 8/10 | 2 (billing + security) |
| #3 (O-1..O-8) | 8 | 4/8 | 4 (RLS + billing + data + launch) |

**Total: 23 findings across 3 audits. 17 completed. 6 deferred to appropriate phases.**

### All Backend Commits (chronological)

| Commit | Changes |
|--------|---------|
| `54ff57d` | M-5: remove phantom duration_seconds, ended_at → completed_at |
| `e92fa06` | M-4: delete admin-routes.tsx (frontend) |
| `c4c1a5d` | M-4: delete owner-routes.tsx (frontend) |
| `899a26f` | M-3: bulk_reorder() DB function + fallback |
| `49ae13d` | M-1: study-queue Promise.all + get_course_summary_ids() |
| `f40d349` | N-6, N-1, N-2, N-8, N-9: /me bug, search parallel, trash parallel, escapeLike, pagination cap |
| `b1bd2c0` | N-7: upsert_video_view() atomic view_count |
| `3954c10` | O-1, O-2, O-5, O-6: or() quoting, safeJson storage, GET/:id scope, atob catch |

### Pending Migrations

| Migration | Status |
|-----------|--------|
| `20260227_01_bulk_reorder.sql` | ✅ Applied |
| `20260227_02_get_course_summary_ids.sql` | ✅ Applied |
| `20260227_03_upsert_video_view.sql` | 🟡 Pending (fallback active) |
