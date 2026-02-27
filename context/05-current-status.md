# 05 — Current Status

> What works, what's broken, and what's next. Updated: 2025-02-27.

## Build Status

| Repo | Status | Notes |
|---|---|---|
| Frontend (Vercel) | ❌ **BROKEN** | Missing functions in `platformApi.ts` |
| Backend (Deno Deploy) | ✅ Running | Has bugs but deploys fine |
| Supabase | ✅ Running | RLS issues pending |

## Frontend Build Errors

The Vercel build fails because these functions are called but NOT defined in `platformApi.ts`:

- `createStudySession` — called by study components
- `updateStudySession` — called by study components
- `submitReview` — called by review components

## Pending Hotfixes

| ID | Description | Status |
|---|---|---|
| HF-B | Add missing `platformApi.ts` functions | ❌ Pending |
| HF-D | Fix `resolution_tier` → `max_resolution` column name in webhook | ❌ Pending |

## Pending Database Queries

| Query | Purpose | Status |
|---|---|---|
| Query 1 | Full schema dump | ✅ Done |
| Query 2 | CHECK, UNIQUE, FK, PK constraints | ❌ Run in Supabase SQL Editor |
| Query 3 | RLS status, policies, indexes | ❌ Run in Supabase SQL Editor |

## Junk Tables to Clean Up

~25 tables named `kv_store_*` created by Figma Make sessions. Safe to DROP.

Orphan tables: `model_layers`, `model_parts` — no backend routes reference them.

## Next Steps (Priority Order)

1. Run Query 2 and Query 3 → update `database/constraints.md` and `database/rls-and-indexes.md`
2. Fix HF-B (add missing platformApi functions) → unblock Vercel build
3. Fix HF-D (resolution_tier → max_resolution) → fix webhook
4. Enable RLS on flashcards, quiz_questions, quizzes
5. Add JWT signature verification
6. Lock down CORS origins
