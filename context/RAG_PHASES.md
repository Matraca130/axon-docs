# RAG Pipeline Phases — Status Tracker

> **Last updated:** 2026-03-14 (audit pass 2)

## Phase Status

| Phase | Name | Status |
|---|---|---|
| 1 | Denorm institution_id on summaries | **DONE** |
| 2 | Stored tsvector + GIN + RPC v3 | **DONE** |
| 3 | pgvector + HNSW index + coarse-to-fine | **DONE** |
| 4 | Query logging + feedback + analytics | **DONE** |
| 5 | Auto-chunking + summary hook + re-chunk | **DONE** |
| 6 | Multi-Query + HyDE + Re-ranking | **DONE** |
| 7 | Multi-source ingestion (PDF) | **STARTED** — DB columns added |
| 8A | Adaptive generation (NeedScore) | **DONE** |
| 8B | AI content quality reports | **DONE** |
| 8C | Quality dashboard | **DONE** |
| 8D | Bulk pre-generation | **DONE** |

## CRITICAL: Embedding Model Change (2026-03-11)

> **Migrated from Gemini 768d to OpenAI 1536d.**
>
> - Old model: `gemini-embedding-001` (768 dimensions, via `gemini.ts`)
> - New model: OpenAI `text-embedding-3-small` (1536 dimensions, via `openai-embeddings.ts`)
> - Migration: `20260311_01_embedding_migration_1536.sql` + `20260311_01_embedding_openai_1536.sql`
> - HNSW indexes recreated: `20260311_02_recreate_hnsw_indexes.sql`
> - RPCs updated: `rag_hybrid_search()` and `rag_coarse_to_fine_search()` now use `vector(1536)`
> - All existing embeddings must be re-ingested after migration
> - Text generation still uses **Gemini 2.5 Flash** (unchanged)

### If You Need to Change the Embedding Model Again

1. `openai-embeddings.ts` — change model name and dimensions
2. `ALTER TABLE chunks ALTER COLUMN embedding TYPE vector(NEW_DIM)`
3. `ALTER TABLE summaries ALTER COLUMN embedding TYPE vector(NEW_DIM)`
4. Update RPC signatures: `p_query_embedding vector(NEW_DIM)`
5. Re-run ingest for ALL chunks and summaries
6. Recreate HNSW indexes (dimension-specific)

## Phase 5 Details: Auto-Chunking

- `chunker.ts` — Recursive character chunking (~500 chars, respects headings)
- `semantic-chunker.ts` — Semantic chunking engine
- `auto-ingest.ts` — Triggered by `summary-hook.ts` afterWrite
- `re-chunk.ts` — `POST /ai/re-chunk` for manual re-chunking

## Phase 5 Details: Context-Aware RAG

- History-augmented search (last 2 messages concatenated before embedding)
- Adjacent chunk expansion (order_index ±1, capped ~3000 chars)
- Response metadata: `_search.augmented`, `_search.context_chunks`, `_search.primary_matches`
- `search_type` in `rag_query_log`: `"hybrid"` vs `"hybrid_augmented"`

## Phase 6 Details: Advanced Retrieval

- **Multi-Query:** Gemini generates 2 reformulations, all 3 embedded in parallel
- **HyDE:** Gemini generates hypothetical answer, embedded instead of question
- **Re-ranking:** Gemini-as-Judge scores relevance, final = 0.6×rerank + 0.4×original
- **Strategy selection:** summaryId→standard, short→hyde, long→multi_query
- **Observability:** `retrieval_strategy` + `rerank_applied` in `rag_query_log`

## Phase 7 Details: PDF Source Tracking (STARTED)

- Migration `20260310_01_pdf_source_columns.sql`
- New columns on `summaries`: `pdf_source_url`, `pdf_page_start`, `pdf_page_end`
- Backend ingestion of PDF content: pending

## Phase 8 Details: Adaptive AI

- **8A:** `generate-smart.ts` — NeedScore keyword selection via `get_smart_generate_target()` RPC
- **8B:** `report.ts` — Student flags bad content, professor resolves
- **8C:** `report-dashboard.ts` — `get_ai_report_stats()` RPC
- **8D:** `pre-generate.ts` — Bulk, separate rate limit (10/hr)

## RAG Security Hardening (2026-03-11/12)

- Migration `20260311_02_rag_security_hardening.sql`
- Migration `20260312_01_revoke_rpc_from_authenticated.sql` — prevents direct RPC calls from frontend
- Only `service_role` can call sensitive RPCs (rag_hybrid_search, award_xp, etc.)

## Migration Application Order

1. `20260307_01_consolidated_rag_safe_apply.sql` (Phases 1+2+3, idempotent)
2. `20260305_04_rag_query_log.sql` (Phase 4, has RLS)
3. Supporting: `20260305_01`, `20260305_02`, `20260305_04_pg_cron`, `20260306_02_search_kw`
4. Chunking: `20260307_02`, `20260307_03`
5. **Embedding migration: `20260311_01_*` + `20260311_02_recreate_hnsw_indexes.sql`**
6. Fase 8: `20260308_01`, `20260308_02`, `20260308_03`
7. Fase 6: `20260309_01`
8. PDF: `20260310_01`
9. Security: `20260311_02_rag_security_hardening`, `20260312_01_revoke_rpc`
