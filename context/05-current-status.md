# 05 -- Current Status

> **Updated: 2026-03-14 (audit pass 4 — verified file-by-file).**

## Build Status

| Repo | Status | Notes |
|---|---|---|
| Frontend (Vercel) | Running | v4.5 — responsive, gamification, AI reports, PDF ingest |
| Backend (Supabase EF) | Running | v4.5 — ~200+ endpoints, 10 modules + 6 flat |
| Supabase | Running | 50+ tables, 52+ migrations |

## Still Pending

| Item | Priority |
|---|---|
| **CORS wildcard (BUG-004)** | **HIGH** — Reverted to `"*"` |
| RLS policies (BUG-003) | HIGH — Partially mitigated |
| `resolution_tier` (BUG-001) | HIGH |
| JWT crypto (BUG-002) | MEDIUM — PostgREST mitigates |
| Content tree JS filter (BUG-006) | MEDIUM |
| kv_store_* cleanup (BUG-011) | LOW |

## Database

52+ migrations, pgvector 1536d (OpenAI text-embedding-3-**large**), pg_trgm, pg_cron.

## AI/RAG: Phases 1-6 DONE, Phase 7 IN PROGRESS, Phase 8A-8D ALL DONE

Models: Gemini 2.5 Flash (text) + OpenAI text-embedding-3-large (1536d)
**14 AI route files** including `ingest-pdf.ts` (Fase 7) and `re-embed-all.ts`

## Gamification: Backend 100%, Frontend ~80%

8 React Query hooks, 7+ components, Axon palette, `useSessionXP.ts` for XP tracking.

## WhatsApp: COMPLETE MODULE (9 files)

Full implementation: webhook, handler, Gemini tool-calling, flashcard review flow, account linking, rate limiting, async queue, message formatting.

## Frontend: 30+ services, 35+ hooks, 4 role layouts

Connected: gamification, AI reports (`useAiReports.ts`), PDF ingest (`usePdfIngest.ts`), smart generation (`useSmartGeneration.ts`), admin AI tools, session XP.

All DONE: Layout v2, auth consolidation, code splitting (22 lazy), lazyRetry, Axon palette.
