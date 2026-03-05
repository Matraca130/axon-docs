# RAG Pipeline Phases — Status Tracker

> **Last updated:** 2026-03-07

## Phase Status

| Phase | Name | Code | DB Migration | Status |
|---|---|---|---|---|
| 1 | Denorm institution_id on summaries | `20260304_06` | Use consolidated | Code DONE |
| 2 | Stored tsvector + GIN + RPC v3 | `20260306_02/03` | Use consolidated | Code DONE |
| 3 | pgvector + HNSW index | `20260305_03` | Use consolidated | Code DONE |
| 4 | Query logging + feedback + analytics | `20260305_04` | Separate (has RLS) | Code DONE |
| 5 | Context-Aware RAG (history + expansion) | `chat.ts` updated | No migration needed | **Code DONE** |
| 6 | TBD: Re-ranking / HyDE | | | Planned |
| 7 | TBD: Multi-query expansion | | | Planned |
| 8 | TBD: Adaptive retrieval parameters | | | Planned |

## How to Apply All Migrations

### Step 1: Run the consolidated migration

Open Supabase Dashboard → SQL Editor.

Paste the ENTIRE contents of:
```
supabase/migrations/20260307_01_consolidated_rag_safe_apply.sql
```

This single file applies Phases 1+2+3 in the correct order, resolving all
duplicate/conflicting migrations. It is fully idempotent (safe to run
multiple times).

**After running, check the NOTICE messages:**
```
  summaries.institution_id: OK
  chunks.embedding:         OK
  chunks.fts:               OK
  summaries.fts:            OK
  rag_hybrid_search RPC:    OK
  Backfill NULL count:      0 (should be 0)
  ALL CHECKS PASSED
```

### Step 2: Run Phase 4 migration (separately)

Paste the contents of:
```
supabase/migrations/20260305_04_rag_query_log.sql
```

This creates the `rag_query_log` table with RLS policies and analytics RPCs.
Run it separately because it has RLS setup that should be reviewed.

### Step 3: Run supporting migrations

These are independent and can be run in any order:

```
20260305_01_create_mv_knowledge_profile.sql  (then run: REFRESH MATERIALIZED VIEW mv_student_knowledge_profile;)
20260305_02_create_fn_knowledge_context.sql
20260305_04_pg_cron_refresh.sql
20260306_02_search_kw_published_filter.sql
```

### Step 4: Verify

Run this verification query:
```sql
SELECT
  (SELECT count(*) FROM summaries WHERE institution_id IS NOT NULL) AS summaries_with_inst,
  (SELECT count(*) FROM summaries WHERE institution_id IS NULL AND topic_id IS NOT NULL) AS summaries_missing_inst,
  (SELECT count(*) FROM chunks WHERE embedding IS NOT NULL) AS chunks_with_embedding,
  (SELECT count(*) FROM chunks WHERE embedding IS NULL) AS chunks_without_embedding,
  (SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'rag_hybrid_search')) AS rpc_exists;
```

## Migration Conflict Resolution

The repo has duplicate/conflicting migrations:

| File | Problem | Resolution |
|---|---|---|
| `20260305_03_pgvector_chunks.sql` | Defines rag_hybrid_search with OLD 6-JOIN version, overwriting Phase 1 | Consolidated migration re-applies v3 LAST |
| `20260306_02_restore_optimized...sql` | Fixes the overwrite but uses inline tsvector (not Phase 2) | Superseded by consolidated |
| `20260306_02_fts_columns...sql` | Phase 2 correct version | Included in consolidated |
| `20260306_03_tsvector_gin...sql` | Duplicate of above | Superseded by consolidated |

**Rule: Always use `20260307_01_consolidated_rag_safe_apply.sql` instead of running individual Phase 1/2/3 migrations.**

## Phase 5 Details

### History-Augmented Search
When a user asks a follow-up question, the last 2 user messages from
conversation history are concatenated with the current query BEFORE
embedding. This improves recall for contextual follow-ups.

Example:
- Message 1: "Explain mitosis" → embed("Explain mitosis")
- Message 2: "What about the phases?" → embed("Explain mitosis What about the phases?")

The original message (not augmented) is still used for FTS ranking.

### Adjacent Chunk Expansion
For each matched chunk (top 5), the system fetches chunks with
order_index ±1 from the same summary. This gives the LLM continuous
context instead of isolated fragments.

- Chunks are ordered by summary → order_index for coherent reading
- Total context is capped at ~3000 chars
- Graceful fallback if expansion fails

### Response Metadata
The response now includes a `_search` field:
```json
{
  "_search": {
    "augmented": true,
    "context_chunks": 12,
    "primary_matches": 5
  }
}
```

### Logging
`search_type` in `rag_query_log` now distinguishes:
- `"hybrid"` — standard search (no history)
- `"hybrid_augmented"` — history-augmented search
