# 05 -- Current Status

> What works, what's broken, and what's next. **Updated: 2026-03-14 (audit pass 2).**

## Build Status

| Repo | Status | Notes |
|---|---|---|
| Frontend (Vercel) | Running | v4.5 — responsive layouts, gamification UI, lazyRetry |
| Backend (Supabase EF) | Running | v4.5 — ~200+ endpoints, gamification, AI/RAG Fase 8 |
| Supabase | Running | 50+ tables, 52+ migrations, RLS partial |

## Still Pending

| Item | Phase | Priority |
|---|---|---|
| RLS policies (BUG-003) | Security hardening | HIGH — partially mitigated (revoke RPC) |
| JWT crypto verification (BUG-002) | Security hardening | LOW (PostgREST mitigates 95%) |
| `resolution_tier` vs `max_resolution` (BUG-001) | Bug fix | HIGH |
| Content tree JS filtering (BUG-006) | Performance | MEDIUM |
| Search consolidation (BUG-007) | Performance | MEDIUM |
| kv_store_* cleanup (BUG-011) | Housekeeping | LOW |
| WhatsApp backend routes | New feature | In development |

## Database

- 50+ legitimate tables (+ ~25 kv_store_* junk)
- **52+ SQL migration files** in `supabase/migrations/`
- 20+ DB functions/RPCs
- pgvector extension (**1536-dim embeddings** — migrated from 768d)
- pg_trgm extension (trigram search)
- pg_cron jobs (refresh MV every 15 min, WhatsApp job processor, reset daily/weekly XP)
- RLS: Applied on `rag_query_log` + RPCs revoked from authenticated role

### Recent Migration Highlights

| Date | Migration | Purpose |
|---|---|---|
| 2026-03-10 | `20260310_01` | PDF source columns on summaries |
| 2026-03-11 | `20260311_01` | **Embedding migration 768d → 1536d (OpenAI)** |
| 2026-03-11 | `20260311_02` | RAG security hardening + HNSW index recreation |
| 2026-03-12 | `20260312_001` | Gamification core tables |
| 2026-03-12 | `20260312_01` | Revoke RPC from authenticated role |
| 2026-03-12 | `20260312_02-04` | Task kind, flashcard status, study queue v3, spec v4.2 |
| 2026-03-13 | `20260313_01-02` | Badge fixes, smart target scoping |
| 2026-03-14 | `20260314_01` | **WhatsApp tables** |
| 2026-03-15 | `20260315_01` | WhatsApp job processor cron |
| 2026-03-16 | `20260316_01` | Gamification schema fixes |

## AI/RAG Pipeline Status

| Phase | Name | Status |
|---|---|---|
| 1 | Denorm institution_id on summaries | **DONE** |
| 2 | Stored tsvector + GIN + RPC v3 | **DONE** |
| 3 | pgvector + HNSW + coarse-to-fine search | **DONE** |
| 4 | Query logging + feedback + analytics | **DONE** |
| 5 | Auto-chunking + summary hook + re-chunk | **DONE** |
| 6 | Multi-Query + HyDE + Re-ranking | **DONE** |
| 7 | Multi-source ingestion (PDF) | **STARTED** — DB columns added (pdf_source_url, pdf_page_start/end) |
| 8A | Adaptive generation (NeedScore) | **DONE** |
| 8B | AI content quality reports | **DONE** |
| 8C | Quality dashboard | **DONE** |
| 8D | Bulk pre-generation | **DONE** |

**Embedding Model Change:** Migrated from Gemini gemini-embedding-001 (768d) to OpenAI text-embedding-3-small (1536d). File: `openai-embeddings.ts`. HNSW indexes recreated.

## Gamification Status (2026-03-13)

| Component | Status |
|---|---|
| XP Engine | **DONE** — 11 actions, 4 bonus types, daily cap 500 |
| Badges | **DONE** — 39 badges, 2-phase evaluation |
| Streaks | **DONE** — Check-in, freeze (3 max), repair |
| Goals | **DONE** — 5-120 min configurable |
| Leaderboard | **DONE** — Weekly, institution-scoped (MV + fallback) |
| Frontend | In progress — Sprint 3 |
| Audit fixes | **ALL DONE** |

## WhatsApp Integration (NEW — 2026-03-14)

- Migration `20260314_01`: WhatsApp tables created
- Migration `20260315_01`: Job processor cron
- Status: DB ready, backend routes in development

## Frontend Status (2026-03-14)

| Feature | Status |
|---|---|
| Layout v2 (responsive) | **DONE** |
| Auth consolidation | **DONE** |
| Code splitting (22 lazy routes) | **DONE** |
| lazyRetry | **DONE** |
| Summary reader (@floating-ui) | **DONE** |
| Cross-summary navigation | **DONE** |
| Dead code cleanup | **DONE** |
