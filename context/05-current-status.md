# 05 -- Current Status

> What works, what's broken, and what's next. Updated: 2026-02-27.

## Build Status

| Repo | Status | Notes |
|---|---|---|
| Frontend (Vercel) | In development | Separate session |
| Backend (Deno Deploy) | Running | 3 audits completed, all fixes deployed |
| Supabase | Running | RLS deferred, 3 pending migrations |

## Backend Optimization History

Three successive audits performed on 2026-02-27:

### Audit #1: Architecture Audit (M-1 to M-5) — ALL DONE

See `backend-architecture-audit.md` for details.

| ID | Fix | Commit | Migration |
|----|-----|--------|-----------|
| M-5 | Remove phantom `duration_seconds`, `ended_at` → `completed_at` | `54ff57d` | None |
| M-4 | Delete dead frontend files `admin-routes.tsx`, `owner-routes.tsx` | `e92fa06` + `c4c1a5d` | None |
| M-2 | Verify `scopeToUser` already covers student_id auto-set | Already covered | None |
| M-3 | Reorder N+1 → `bulk_reorder()` DB function | `899a26f` | `20260227_01_bulk_reorder.sql` ✅ |
| M-1 | Study-queue parallel + `get_course_summary_ids()` RPC | `49ae13d` | `20260227_02_get_course_summary_ids.sql` ✅ |

### Audit #2: Deep Audit (N-1 to N-10) — 8/10 DONE

See `backend-deep-audit-2.md` for details.

| ID | Fix | Commit | Migration |
|----|-----|--------|-----------|
| N-6 | BUG: GET /me auto-profile `user_metadata` fix | `f40d349` | None |
| N-1 | Search parallel + batch path resolution | `f40d349` | None |
| N-2 | Trash `Promise.all` | `f40d349` | None |
| N-8 | `escapeLike()` sanitization | `f40d349` | None |
| N-9 | Pagination cap at 500 | `f40d349` | None |
| N-7 | Atomic `view_count` via `upsert_video_view()` | `b1bd2c0` | `20260227_03_upsert_video_view.sql` 🟡 |
| N-3 | Billing checkout parallel | SKIPPED | Billing not implemented yet |
| N-4 | Content-access embedded select | SKIPPED | Billing not implemented yet |
| N-5 | Content-tree DB function | DEFERRED | Phase 3 backlog |
| N-10 | Stripe constant-time comparison | DEFERRED | Security hardening phase |

### Audit #3: Ultra-Deep Audit (O-1 to O-8)

See `backend-deep-audit-3.md` for details. 8 new findings.

## Pending Migrations

| Migration | Status | Notes |
|-----------|--------|-------|
| `20260227_01_bulk_reorder.sql` | ✅ Applied | M-3 reorder |
| `20260227_02_get_course_summary_ids.sql` | ✅ Applied | M-1 study-queue |
| `20260227_03_upsert_video_view.sql` | 🟡 Pending | N-7 track-view (fallback works) |

## Database

- ~43 legitimate tables
- 0 RLS policies (DEFERRED until feature-complete)
- 3 DB functions deployed: `bulk_reorder()`, `get_course_summary_ids()`, `upsert_video_view()` (pending)

## Known Deferred Items

| Item | Phase | Notes |
|------|-------|-------|
| RLS policies (0 currently) | Security hardening | BUG-003 |
| JWT signature verification | Security hardening | BUG-003 |
| CORS whitelist (currently `*`) | Security hardening | BUG-004 |
| Stripe timing-safe comparison | Security hardening | N-10 |
| Content-tree DB function | Phase 3 | N-5 |
| Rate limiting | Pre-launch | O-8 |
| Billing integration (Stripe) | Not started | Routes exist but env vars not set |
