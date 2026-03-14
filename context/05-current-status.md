# 05 -- Current Status

> What works, what's broken, and what's next.
> **Updated: 2026-03-14 (audit pass 3 — verified against source).**

## Build Status

| Repo | Status | Notes |
|---|---|---|
| Frontend (Vercel) | Running | v4.5 — responsive layouts, gamification UI, lazyRetry |
| Backend (Supabase EF) | Running | v4.5 — ~200+ endpoints, 10 route modules + 6 flat |
| Supabase | Running | 50+ tables, 52+ migrations, RLS partial |

## Still Pending

| Item | Priority | Details |
|---|---|---|
| **CORS wildcard (BUG-004)** | **HIGH** | Reverted to `"*"` for MVP. Must restrict before launch |
| RLS policies (BUG-003) | HIGH | Partially mitigated (RPCs revoked from authenticated) |
| JWT crypto (BUG-002) | LOW | PostgREST mitigates 95% |
| `resolution_tier` (BUG-001) | HIGH | Mux webhook field mismatch |
| Content tree JS filter (BUG-006) | MEDIUM | |
| kv_store_* cleanup (BUG-011) | LOW | ~25 junk tables |
| WhatsApp backend routes | In dev | Tables + cron created |

## Database

- 50+ tables (+ ~25 kv_store_* junk)
- **52+ SQL migrations**
- 20+ RPCs
- pgvector: **1536d** (OpenAI text-embedding-3-**large**, Matryoshka)
- pg_trgm, pg_cron (MV refresh, daily/weekly XP reset, WhatsApp jobs)
- RLS on `rag_query_log` + RPCs revoked from authenticated

## AI/RAG Pipeline

| Phase | Status |
|---|---|
| 1-6 | **ALL DONE** (tsvector, pgvector, hybrid search, Multi-Query, HyDE, Re-ranking) |
| 7 (PDF) | **IN PROGRESS** — DB columns + `extractTextFromPdf()` code exists |
| 8A-8D | **ALL DONE** (adaptive gen, reports, dashboard, bulk pre-gen) |

**Models:** Gemini 2.5 Flash (text) + OpenAI text-embedding-3-large (1536d embeddings)

## Gamification

Backend 100% complete. Frontend ~70% connected (8 hooks, 7+ components, palette migrated).

## Backend Tests

**16 test files**, ~183+ test cases. Includes unit (auth, validation, algorithms) and integration (CRUD, sessions, security).

## Frontend Status

All DONE: Layout v2, auth consolidation, code splitting (22 lazy), lazyRetry, summary reader, cross-summary nav, dead code cleanup, Axon Medical Academy palette.
