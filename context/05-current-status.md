# 05 -- Current Status

> What works, what's broken, and what's next. Updated: 2026-02-27.

## Build Status

| Repo | Status | Notes |
|---|---|---|
| Frontend (Vercel) | In development | Separate session |
| Backend (Deno Deploy) | Running | 3 audits completed, 17/23 fixes deployed |
| Supabase | Running | RLS deferred, 1 pending migration |

## Backend Optimization History

Three successive audits performed on 2026-02-27:

### Audit #1: Architecture Audit (M-1 to M-5) — ALL DONE

| ID | Fix | Commit |
|----|-----|--------|
| M-5 | Remove phantom `duration_seconds`, `ended_at` → `completed_at` | `54ff57d` |
| M-4 | Delete dead frontend files | `e92fa06` + `c4c1a5d` |
| M-2 | Verified `scopeToUser` already covers it | N/A |
| M-3 | Reorder N+1 → `bulk_reorder()` | `899a26f` |
| M-1 | Study-queue parallel + `get_course_summary_ids()` | `49ae13d` |

### Audit #2: Deep Audit (N-1 to N-10) — 8/10 DONE

| ID | Fix | Commit |
|----|-----|--------|
| N-6 | BUG: GET /me user_metadata fix | `f40d349` |
| N-1 | Search parallel + batch paths | `f40d349` |
| N-2 | Trash Promise.all | `f40d349` |
| N-8 | escapeLike() | `f40d349` |
| N-9 | Pagination cap 500 | `f40d349` |
| N-7 | Atomic view_count | `b1bd2c0` |
| N-3/N-4 | SKIPPED (billing) | — |
| N-5/N-10 | DEFERRED | — |

### Audit #3: Ultra-Deep (O-1 to O-8) — 4/8 DONE

| ID | Fix | Commit |
|----|-----|--------|
| O-1 | PostgREST or() quote injection | `3954c10` |
| O-2 | safeJson in storage routes | `3954c10` |
| O-5 | GET/:id scopeToUser | `3954c10` |
| O-6 | atob() try/catch | `3954c10` |
| O-3 | DEFERRED (RLS phase) | — |
| O-4 | DEFERRED (when data grows) | — |
| O-7 | DEFERRED (when billing ships) | — |
| O-8 | DEFERRED (pre-launch) | — |

## Pending Migrations

| Migration | Status |
|-----------|--------|
| `20260227_01_bulk_reorder.sql` | ✅ Applied |
| `20260227_02_get_course_summary_ids.sql` | ✅ Applied |
| `20260227_03_upsert_video_view.sql` | 🟡 Pending (fallback works) |

## Database

- ~43 legitimate tables
- 0 RLS policies (DEFERRED)
- 3 DB functions: `bulk_reorder()`, `get_course_summary_ids()`, `upsert_video_view()` (pending)

## Deferred Items

| Item | Phase |
|------|-------|
| RLS policies | Security hardening |
| JWT verification | Security hardening |
| CORS whitelist | Security hardening |
| Stripe timing-safe | Security hardening |
| Reviews scope (O-3) | RLS phase |
| Content-tree DB func (N-5) | Phase 3 |
| Trigram indexes (O-4) | When data grows |
| Rate limiting (O-8) | Pre-launch |
| Webhook idempotency (O-7) | When billing ships |
| Billing integration | Not started |
