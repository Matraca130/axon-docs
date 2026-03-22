# API Routes: Content

> Topics, summaries, chunks, keywords, and keyword connections.
>
> **Verified against:** `routes/content/crud.ts`, `routes/content/content-tree.ts`,
> `routes/content/keyword-connections.ts`, `routes/content/keyword-search.ts`,
> `routes/content/prof-notes.ts`, `routes/content/reorder.ts`,
> `routes/content/flashcards-by-topic.ts`
>
> **Last verified:** 2026-03-14 (audit pass 11 — added V2 keyword connection fields)

---

## Topics

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/topics` | `section_id` (required) | Paginated |
| GET | `/topics/:id` | | Single |
| POST | `/topics` | | Single |
| PUT | `/topics/:id` | | Single |
| DELETE | `/topics/:id` | | Single (soft-delete) |
| PUT | `/topics/:id/restore` | | Single (restore) |

**Required fields:** `name`
**Parent key:** `section_id` (required on LIST and CREATE)
**Create fields:** `name`, `order_index`
**Update fields:** `name`, `order_index`, `is_active`

## Summaries

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/summaries` | `topic_id` (required) | Paginated |
| GET | `/summaries/:id` | | Single |
| POST | `/summaries` | | Single |
| PUT | `/summaries/:id` | | Single |
| DELETE | `/summaries/:id` | | Single (soft-delete) |
| PUT | `/summaries/:id/restore` | | Single (restore) |

**Required fields:** `title`
**Parent key:** `topic_id` (required on LIST and CREATE)
**Create fields:** `title`, `content_markdown`, `status`, `order_index`, `estimated_study_minutes`
**Update fields:** `title`, `content_markdown`, `status`, `order_index`, `is_active`, `estimated_study_minutes`
**afterWrite:** `onSummaryWrite` — triggers auto-ingest (chunking + embedding) on POST/PUT

> Has denormalized `institution_id` (migration `20260304_06`), stored `fts` tsvector,
> `embedding vector(1536)` for coarse-to-fine RAG (OpenAI text-embedding-3-large),
> `chunk_strategy`, `last_chunked_at`, `pdf_source_url`, `pdf_page_start`, `pdf_page_end`.

## Chunks

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/chunks` | `summary_id` (required) | Paginated |
| GET | `/chunks/:id` | | Single |
| POST | `/chunks` | | Single |
| PUT | `/chunks/:id` | | Single |
| DELETE | `/chunks/:id` | | Single |

**Required fields:** `content`
**Parent key:** `summary_id` (required on LIST and CREATE)
**Create fields:** `content`, `order_index`, `metadata`
**Update fields:** `content`, `order_index`, `metadata`

> Has `embedding vector(1536)` for RAG (OpenAI text-embedding-3-large) and stored `fts` tsvector.
> NO `updated_at`, NO `created_by`, NO soft-delete.

## Summary Blocks

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/summary-blocks` | `summary_id` (required) | Paginated |
| GET | `/summary-blocks/:id` | | Single |
| POST | `/summary-blocks` | | Single |
| PUT | `/summary-blocks/:id` | | Single |
| DELETE | `/summary-blocks/:id` | | Single |

**Required fields:** `type`, `content`
**Parent key:** `summary_id` (required on LIST and CREATE)
**Create fields:** `type`, `content`, `order_index`, `heading_text`, `heading_level`, `is_active`
**Update fields:** `type`, `content`, `order_index`, `heading_text`, `heading_level`, `is_active`

> Column is `type` NOT `block_type`.

## Keywords

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/keywords` | `summary_id` (required) | Paginated |
| GET | `/keywords/:id` | | Single |
| POST | `/keywords` | | Single |
| PUT | `/keywords/:id` | | Single |
| DELETE | `/keywords/:id` | | Single (soft-delete) |
| PUT | `/keywords/:id/restore` | | Single (restore) |

**Required fields:** `name`
**Parent key:** `summary_id` (required on LIST and CREATE)
**Create fields:** `name`, `definition`, `priority`, `clinical_priority`, `is_foundation`
**Update fields:** `name`, `definition`, `priority`, `is_active`, `clinical_priority`, `is_foundation`

> `definition` — TEXT, nullable. Used in tooltip previews and KeywordPopup.
> `priority` — INTEGER, NOT NULL.
> `clinical_priority` — FLOAT 0-1, for NeedScore exponential scaling (v4.2).
> `is_foundation` — BOOLEAN, marks prerequisite keywords.

## Subtopics

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/subtopics` | `keyword_id` (required) | Paginated |
| GET | `/subtopics/:id` | | Single |
| POST | `/subtopics` | | Single |
| PUT | `/subtopics/:id` | | Single |
| DELETE | `/subtopics/:id` | | Single (soft-delete) |

**Required fields:** `name`
**Parent key:** `keyword_id` (required on LIST and CREATE)
**Create fields:** `name`, `order_index`
**Update fields:** `name`, `order_index`, `is_active`
**Max 6 subtopics per keyword.**

## Content Tree (custom)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/content-tree` | `institution_id` or `course_id` | `{ data: [...] }` (nested tree) |

## Search (custom)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/search` | `q`, `institution_id` | `{ data: [...] }` (array) |

## Reorder (custom)

| Method | Endpoint | Body | Response |
|---|---|---|---|
| PUT | `/reorder` | `{ table, items: [{id, order_index}] }` | `{ data: { updated } }` |

Atomic bulk reorder using `bulk_reorder()` RPC.

## Keyword Connections (custom)

| Method | Endpoint | Query Params/Body | Response |
|---|---|---|---|
| GET | `/keyword-connections` | `keyword_id` (required) | Array (with keyword name joins) |
| GET | `/keyword-connections/:id` | | Single (with keyword name joins) |
| POST | `/keyword-connections` | See body below | Single (201) |
| DELETE | `/keyword-connections/:id` | | `{ deleted: id }` |
| GET | `/keyword-connections-batch` | `keyword_ids=uuid1,uuid2,...` (max 50) | Array with keyword names + summary info |

**POST body:**
```json
{
  "keyword_a_id": "uuid",
  "keyword_b_id": "uuid",
  "relationship": "free text (optional)",
  "connection_type": "one of 10 types (optional, V2)",
  "source_keyword_id": "uuid (optional, V2 — direction indicator)"
}
```

**V2 `connection_type` values (medical education):**
`prerequisito`, `causa-efecto`, `mecanismo`, `dx-diferencial`, `tratamiento`,
`manifestacion`, `regulacion`, `contraste`, `componente`, `asociacion`

> `source_keyword_id` must be either `keyword_a_id` or `keyword_b_id` (direction for directional types).
> Server enforces canonical order: `keyword_a_id < keyword_b_id`.
> F1+F2-A FIX: LIST/GET include keyword names, summary_id, definition via PostgREST joins.
> F3 FIX: Students only see connections where BOTH keywords belong to published summaries.

## Keyword Search (custom, FLAT route)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/keyword-search` | `q`, `exclude_summary_id`, `course_id`, `limit` (default 15) | Array of `{ id, name, summary_id, definition, summary_title }` |

## Professor Notes (custom)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/kw-prof-notes` | `keyword_id` (required) | Array |
| GET | `/kw-prof-notes/:id` | | Single |
| POST | `/kw-prof-notes` | `{ keyword_id, note }` | Single (201, upsert) |
| DELETE | `/kw-prof-notes/:id` | | `{ deleted: id }` |

## Flashcards by Topic (PERF)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/flashcards-by-topic` | `topic_id` (required) | Array |
