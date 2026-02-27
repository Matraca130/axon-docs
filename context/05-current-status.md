# 05 -- Current Status

> What works, what's broken, and what's next. Updated: 2025-02-27.

## Build Status

| Repo | Status | Notes |
|---|---|---|
| Frontend (Vercel) | BROKEN | Missing functions in `platformApi.ts` |
| Backend (Deno Deploy) | Running | Has bugs but deploys fine |
| Supabase | Running | RLS issues pending |

## Database Documentation Status

| Query | Purpose | Status |
|---|---|---|
| Query 1 | Full schema dump | DONE |
| Query 2 | Constraints (CHECK, UNIQUE, FK, PK) | DONE |
| Query 3a | Indexes | DONE |
| Query 3b | RLS status + policies | PENDING |

## Major Corrections Applied

- 4 roles not 3 (+ `admin` with `admin_scopes`)
- ~15 new tables discovered
- `order_index` not `sort_order`
- `is_active` BOOLEAN not `status` enum on memberships
- `videos`/`quizzes` FK to `summary_id` not `keyword_id`
- `reviews` uses session_id/item_id/instrument_type/grade pattern
- `study_sessions` uses student_id/course_id (not user_id/topic_id)
- Soft-delete via `deleted_at` on 7 tables (alongside `is_active`)
- `fsrs_states.due_at` not `due`
- Videos have `mux_asset_id`/`mux_upload_id` columns

## New Bugs Found

- BUG-010: 7 duplicate index pairs + ~150 kv_store junk indexes
- BUG-011: `deleted_at` vs `is_active` dual soft-delete ambiguity
- BUG-012: `reviews` table structure completely different from docs
- BUG-013: `study_sessions` structure mismatch

## Real Table Count

~38 legitimate tables + ~25 kv_store junk tables = ~63 total.

## Pending

| Item | Status |
|---|---|
| Query 3b (RLS/policies) | PENDING |
| HF-B (platformApi functions) | PENDING - needs correct column names from Query 2! |
| HF-D (resolution_tier webhook) | PENDING |
| Drop kv_store tables (~150 junk indexes) | PENDING |
| Drop 7 duplicate index pairs | PENDING |
| Enable RLS on 3 tables | PENDING |

## Next Steps

1. Run RLS query -> complete `rls-and-indexes.md`
2. Drop kv_store_* tables (cleanup SQL in rls-and-indexes.md)
3. Drop 7 duplicate indexes
4. Fix HF-B with CORRECT column names (see BUG-012, BUG-013)
5. Fix HF-D
6. Enable RLS
7. Resolve deleted_at vs is_active ambiguity
