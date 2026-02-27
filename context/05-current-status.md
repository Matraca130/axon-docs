# 05 -- Current Status

> What works, what's broken, and what's next. Updated: 2026-02-27.

## Build Status

| Repo | Status | Notes |
|---|---|---|
| Frontend (Vercel) | In development | Separate session |
| Backend (Deno Deploy) | Running | 4 audits completed, 25/31 fixes deployed |
| Supabase | Running | RLS deferred, 1 pending migration |

## Backend Optimization History

Four successive audits performed on 2026-02-27 (12 commits, 25 fixes):

### Audit #1 (M-1..M-5) — ALL DONE
Architecture fixes: study-queue parallel, bulk_reorder, phantom fields.

### Audit #2 (N-1..N-10) — 8/10 DONE
Search N+1, trash parallel, GET /me bug, view_count race, escapeLike, pagination cap.
Skipped: N-3/N-4 (billing). Deferred: N-5 (content-tree), N-10 (Stripe timing).

### Audit #3 (O-1..O-8) — 4/8 DONE
or() quoting, safeJson storage, GET/:id scope, atob catch.
Deferred: O-3 (reviews scope/RLS), O-4 (trigram indexes), O-7 (webhook idempotency), O-8 (rate limiting).

### Audit #4 / Self-Audit (P-1..P-8) — ALL DONE
See `backend-self-audit-and-audit-4.md` for full details.
- P-1: REGRESSION — search path truncation fixed (full hierarchy restored)
- P-2: Pagination caps added to 4 manual routes
- P-3: Double quote escaping in or() filter
- P-4: Upload route safeJson
- P-5: Password max length cap
- P-6: Auto-profile race condition (upsert)
- P-7: Signed-url batch size cap
- P-8: usage-today date boundary fix

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
| Stripe timing-safe (N-10) | Security hardening |
| Reviews scope (O-3) | RLS phase |
| Content-tree DB func (N-5) | Phase 3 |
| Trigram indexes (O-4) | When data grows |
| Rate limiting (O-8) | Pre-launch |
| Webhook idempotency (O-7) | When billing ships |
| Billing integration | Not started |
