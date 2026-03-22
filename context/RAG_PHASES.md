# RAG Pipeline Phases — Status Tracker

> **Last updated:** 2026-03-14 (audit pass 3 — verified against source)

## Phase Status

| Phase | Name | Status |
|---|---|---|
| 1 | Denorm institution_id on summaries | **DONE** |
| 2 | Stored tsvector + GIN + RPC v3 | **DONE** |
| 3 | pgvector + HNSW index + coarse-to-fine | **DONE** |
| 4 | Query logging + feedback + analytics | **DONE** |
| 5 | Auto-chunking + summary hook + re-chunk | **DONE** |
| 6 | Multi-Query + HyDE + Re-ranking | **DONE** |
| 7 | Multi-source ingestion (PDF) | **IN PROGRESS** — DB columns + extraction code |
| 8A | Adaptive generation (NeedScore) | **DONE** |
| 8B | AI content quality reports | **DONE** |
| 8C | Quality dashboard | **DONE** |
| 8D | Bulk pre-generation | **DONE** |

## CRITICAL: Embedding Model (verified against openai-embeddings.ts)

> **Model:** OpenAI `text-embedding-3-large` (NOT small!)
> **Dimensions:** 1536 (truncated via Matryoshka Representation Learning)
> **File:** `openai-embeddings.ts` — constants `EMBEDDING_MODEL` and `EMBEDDING_DIMENSIONS`
> **Previous:** Gemini `gemini-embedding-001` (768d) — `gemini.ts` now throws if called
> **Text generation:** Still Gemini 2.5 Flash (unchanged)

### gemini.ts generateEmbedding() is a HARD ERROR

The old `generateEmbedding()` in `gemini.ts` now throws immediately:
```
[Axon Fatal] gemini.ts generateEmbedding() is REMOVED.
Use openai-embeddings.ts generateEmbedding() instead.
```
This prevents accidental insertion of 768d vectors into 1536d columns.

## Phase 7 Details: PDF Ingestion (IN PROGRESS)

**DB columns (migration `20260310_01`):**
- `summaries.pdf_source_url` TEXT
- `summaries.pdf_page_start` INTEGER
- `summaries.pdf_page_end` INTEGER

**Backend code (`gemini.ts`):**
- `extractTextFromPdf(base64Data, mimeType)` — uses Gemini 2.5 Flash multimodal
- 30s timeout, structured markdown output
- Safety filter handling (blocked content returns clear error)

**Still needed:** Upload route, ingest pipeline, frontend UI.

## Phase 6 Details: Advanced Retrieval

- Multi-Query, HyDE, Re-ranking via Gemini-as-Judge
- Strategy selection: summaryId→standard, short→hyde, long→multi_query
- Observability: `retrieval_strategy` + `rerank_applied` in `rag_query_log`

## Phase 8 Details: Adaptive AI

- 8A: `generate-smart.ts` — NeedScore keyword selection
- 8B: `report.ts` — Quality reports
- 8C: `report-dashboard.ts` — Stats + listing
- 8D: `pre-generate.ts` — Bulk, 10/hr rate limit

## RAG Security Hardening

- `20260311_02_rag_security_hardening.sql`
- `20260312_01_revoke_rpc_from_authenticated.sql`
- Only `service_role` can call sensitive RPCs
