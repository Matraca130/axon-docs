# 05 -- Current Status

> **Updated: 2026-03-14 (audit pass 12 — 180 files verified against source).**

## Build Status

| Repo | Status | Notes |
|---|---|---|
| Frontend (Vercel) | Running | v4.5 — responsive, gamification, AI reports, PDF ingest |
| Backend (Supabase EF) | Running | v4.5 — ~200+ endpoints, 10 modules + 6 flat |
| Supabase | Running | 50+ tables, **53 migrations** |

## Still Pending

| Item | Priority |
|---|---|
| **CORS wildcard (BUG-004)** | **HIGH** — Reverted to `"*"` |
| RLS policies (BUG-003) | HIGH — Partially mitigated |
| `resolution_tier` (BUG-001) | HIGH |
| JWT crypto (BUG-002) | MEDIUM — PostgREST mitigates |
| Content tree JS filter (BUG-006) | MEDIUM |
| GamificationContext STUB (BUG-021) | MEDIUM — useGamification.ts is real impl |
| Hardcoded ANON_KEY x3 (BUG-025) | MEDIUM |
| Demo student fallback (BUG-026) | MEDIUM |
| kv_store_* cleanup (BUG-011) | LOW |

## Database

53 migrations, pgvector **1536d** (OpenAI text-embedding-3-large), pg_trgm, pg_cron.

## AI/RAG: Phases 1-6 DONE, Phase 7 DONE (ingest-pdf route exists), Phase 8A-8D ALL DONE

Models: Gemini 2.5 Flash (text) + OpenAI text-embedding-3-large (1536d)
**14 AI route files on disk, 11 mounted** (PHASE-A2 removed list-models + re-embed-all from router)

## Gamification: Backend 100%, Frontend ~80%

8 React Query hooks, 7+ components, Axon palette, `useSessionXP.ts` for XP tracking.
> GamificationContext.tsx is a STUB (BUG-021). useGamification.ts (React Query) is the real implementation.

## WhatsApp: COMPLETE MODULE (**10 files**)

Full implementation: webhook.ts, handler.ts, tools.ts, review-flow.ts, link.ts, wa-client.ts, wa-rate-limit.ts, formatter.ts, async-queue.ts, index.ts.

## Frontend File Counts (VERIFIED 2026-03-14)

| Layer | Files | Audit Status |
|---|---|---|
| services/ | **53** | 100% read |
| hooks/ (flat) | **35** | 100% read |
| hooks/queries/ | **21** | 100% read |
| lib/ | **25** | 100% read |
| types/ | **11** | 100% read |
| context/ | **9** | 100% read |
| utils/ | **10** | 100% read |
| routes/ | **10** | 100% read |
| design-system/ | 14 | Not read (UI-only) |
| components/ | ~100+ | Not read (UI-only) |

### React Query Layer
- `queryKeys.ts` — 25+ centralized key factories
- `staleTimes.ts` — 6 constants (professor 10min, student 2min, connections 5min, search 30s)
- 21 query hooks with shared cache, optimistic updates, cache seeding

### Routes Architecture
- **Student:** 22+ real routes, per-agent ownership (6 agents), all lazy + withBoundary
- **Professor:** 8 routes — ALL PlaceholderPage (no real functionality yet)
- **Owner:** 8 routes — ALL PlaceholderPage
- **Admin:** 6 routes — ALL PlaceholderPage

## FRONTEND-DIAGNOSTIC.md F-xxx Resolution Status (verified 2026-03-14)

| ID | Original Issue | Current Status |
|---|---|---|
| F-001 | Dual context/ vs contexts/ | **FIXED** — consolidated to context/ |
| F-002 | Triple API layer | **PARTIALLY FIXED** — apiConfig.ts still exists (BUG-022) |
| F-003 | ANON_KEY hardcoded | **NOT FIXED** — now 3 copies (BUG-025) |
| F-004 | 95KB mock data | **PARTIALLY FIXED** — courses.ts still exists, used by AppContext |
| F-005 | .tsx doc files (62KB) | **FIXED** — removed from bundle |
| F-006 | No ErrorBoundary | **FIXED** — withBoundary.tsx wraps all lazy routes |
| F-007 | `any` in API layer | **PARTIALLY FIXED** — services typed, some contexts still use any |
| F-008 | console.log in prod | **FIXED** — logger.ts with levels + devLog.ts |
| F-009 | platformApi.ts monolith | **FIXED** — split into 53 service files |
| F-010 | owner-routes no lazy() | **FIXED** — all routes use lazy() + lazyRetry() |
| F-012 | Double supabase client | **NOT VERIFIED** — supabase.ts exists, supabase-client.ts not found |
| F-014 | No data cache | **FIXED** — React Query v5 with 21 query hooks |
| F-015 | Types in 4 places | **PARTIALLY FIXED** — 11 type files, some overlap remains (BUG-024) |
| F-020 | Giant components | **PARTIALLY FIXED** — many hooks extracted (useKeywordPopupQueries, etc) |
| F-024 | Hooks no barrel | By design — 56 hooks, barrel would be too large |
