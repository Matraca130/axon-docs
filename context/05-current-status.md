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
| Query 2 | CHECK, UNIQUE, FK, PK constraints | DONE - Processed into docs |
| Query 3 | RLS status, policies, indexes | PENDING |

## Major Corrections from Query 2

- **4 roles** not 3: owner, admin, professor, student
- **~15 new tables** discovered (subtopics, models_3d, fsrs_states, bkt_states, etc.)
- All ordering uses `order_index` not `sort_order`
- `memberships.is_active` is BOOLEAN not `status` enum
- `videos` and `quizzes` FK to `summary_id` not `keyword_id`
- `reviews` table is completely different: uses `session_id`, `item_id`, `instrument_type`, `grade`
- `study_sessions` uses `student_id` not `user_id`, `course_id` not `topic_id`
- `keywords` has NO `definition` or `is_general` columns
- `model_layers` and `model_parts` are NOT orphan tables

## Real Table Count (excluding kv_store_*)

~38 legitimate tables (confirmed from Query 2 output).

## Pending Hotfixes

| ID | Description | Status |
|---|---|---|
| HF-B | Add missing `platformApi.ts` functions | Pending |
| HF-D | Fix `resolution_tier` -> `max_resolution` in webhook | Pending |

## Next Steps (Priority Order)

1. Run Query 3 -> update `database/rls-and-indexes.md`
2. Fix HF-B (add missing platformApi functions) -> unblock Vercel build
3. Fix HF-D (resolution_tier -> max_resolution) -> fix webhook
4. Enable RLS on flashcards, quiz_questions, quizzes
5. Add JWT signature verification
6. Lock down CORS origins
7. Update `bugs/known-bugs.md` with corrections from Query 2
