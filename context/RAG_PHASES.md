# RAG Pipeline Phases — Status Tracker

> **Last updated:** 2026-03-14

## Phase Status

| Phase | Name | Code | DB Migration | Status |
|---|---|---|---|---|
| 1 | Denorm institution_id on summaries | `20260304_06` | Use consolidated | **DONE** |
| 2 | Stored tsvector + GIN + RPC v3 | `20260306_02/03` | Use consolidated | **DONE** |
| 3 | pgvector + HNSW index + coarse-to-fine | `20260305_03`, `20260307_03` | Use consolidated | **DONE** |
| 4 | Query logging + feedback + analytics | `20260305_04` | Separate (has RLS) | **DONE** |
| 5 | Auto-chunking + summary hook + re-chunk | `chunker.ts`, `auto-ingest.ts`, `summary-hook.ts`, `re-chunk.ts` | `20260307_02` | **DONE** |
| 6 | Multi-Query + HyDE + Re-ranking | `retrieval-strategies.ts`, `chat.ts` | `20260309_01` | **DONE** |
| 7 | Multi-source ingestion (PDF) | — | — | Planned |
| 8A | Adaptive generation (NeedScore) | `generate-smart.ts` | `20260308_01` | **DONE** |
| 8B | AI content quality reports | `report.ts` | `20260308_02` | **DONE** |
| 8C | Quality dashboard | `report-dashboard.ts` | `20260308_03` | **DONE** |
| 8D | Bulk pre-generation | `pre-generate.ts` | — | **DONE** |

## How to Apply All Migrations

### Step 1: Run the consolidated migration (Phases 1+2+3)

Open Supabase Dashboard → SQL Editor.

Paste the ENTIRE contents of:
```
supabase/migrations/20260307_01_consolidated_rag_safe_apply.sql
```

This single file applies Phases 1+2+3 in the correct order. Fully idempotent.

### Step 2: Run Phase 4 migration

```
supabase/migrations/20260305_04_rag_query_log.sql
```

Creates `rag_query_log` table with RLS policies and analytics RPCs.

### Step 3: Run supporting migrations

```
20260305_01  → mv_knowledge_profile materialized view
20260305_02  → get_student_knowledge_context() RPC
20260305_04  → pg_cron refresh every 15 min
20260306_02  → search_kw_published_filter
20260307_02  → chunk_strategy + last_chunked_at columns (Fase 5)
20260307_03  → Summary embeddings + rag_coarse_to_fine_search() (Fase 3)
```

### Step 4: Run Fase 6+8 migrations (PENDING application)

```
20260308_01  → get_smart_generate_target() RPC (Fase 8A)
20260308_02  → ai_content_reports table (Fase 8B)
20260308_03  → get_ai_report_stats() RPC (Fase 8C)
20260309_01  → retrieval_strategy + rerank_applied on rag_query_log (Fase 6)
```

## Phase 5 Details: Auto-Chunking

### `chunker.ts` — Recursive Character Chunking Engine
- Splits markdown content into semantic chunks (target ~500 chars)
- Respects heading boundaries, paragraph breaks, list items
- `chunk_strategy` column tracks which algorithm was used

### `auto-ingest.ts` — Auto-Chunking + Embedding Pipeline
- Triggered by `summary-hook.ts` afterWrite on summaries
- Re-chunks content + generates embeddings in one pipeline
- Only runs when `content_markdown` actually changes

### `re-chunk.ts` — Manual Re-Chunking
- `POST /ai/re-chunk` for professor-initiated re-chunking
- Deletes old chunks, creates new ones, triggers embedding

## Phase 5 Details: Context-Aware RAG

### History-Augmented Search
Last 2 user messages concatenated with current query BEFORE embedding.
Improves recall for contextual follow-ups.

### Adjacent Chunk Expansion
For each matched chunk (top 5), fetches chunks with order_index ±1.
Capped at ~3000 chars. Graceful fallback.

### Response Metadata
```json
{
  "_search": {
    "augmented": true,
    "context_chunks": 12,
    "primary_matches": 5
  }
}
```

## Phase 6 Details: Advanced Retrieval (NEW)

### Multi-Query Retrieval
Gemini generates 2 reformulations of the user's query. All 3 (original + 2 reformulations) are embedded in parallel. Results merged by highest score per chunk_id.

### HyDE — Hypothetical Document Embeddings
Gemini generates a hypothetical answer to the question. This answer is embedded instead of the question, bridging the question-answer semantic gap.

### Re-ranking via Gemini-as-Judge
After retrieval, Gemini scores each chunk's relevance (0-10). Final score = 0.6×rerank + 0.4×original. Top-K after re-ranking.

### Dynamic Strategy Selection (`selectStrategy`)
- Has `summaryId` → `standard` (scoped search, no expansion needed)
- Short query (<30 chars) → `hyde` (needs expansion)
- Long query (>100 chars) → `multi_query` (needs decomposition)
- Default → `standard`

### Observability
`rag_query_log` now tracks: `retrieval_strategy`, `rerank_applied` (migration `20260309_01`).

## Phase 8 Details: Adaptive AI (NEW)

### 8A: Smart Generation (`generate-smart.ts`)
NeedScore-based keyword selection. Auto-targets the keyword that needs content the most based on: existing flashcard/quiz count, mastery levels, recency.

### 8B: Quality Reports (`report.ts`)
Students can flag AI-generated content (wrong, unclear, offensive). Professors resolve/dismiss.

### 8C: Quality Dashboard (`report-dashboard.ts`)
Aggregate metrics via `get_ai_report_stats()` RPC. Paginated listing with filters.

### 8D: Bulk Pre-Generation (`pre-generate.ts`)
Professor fills coverage gaps across keywords. Separate rate limit bucket (10/hr).

## Migration Conflict Resolution

**Rule: Always use `20260307_01_consolidated_rag_safe_apply.sql` instead of running individual Phase 1/2/3 migrations.**

The consolidated migration resolves all duplicate/conflicting files and is fully idempotent.
