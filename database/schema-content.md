# Schema: Content

> Summaries, chunks, keywords, subtopics, videos, and connections.
> **VERIFIED against Query 2 constraints data.**

## summaries

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| topic_id | UUID | NO | FK → topics.id |
| title | TEXT | NO | |
| content_markdown | TEXT | NO | ⚠️ NOT `content` |
| status | TEXT | NO | CHECK: `draft`, `published`, `rejected` |
| order_index | INTEGER | NO | |
| created_by | UUID | NO | FK → profiles.id |
| is_active | BOOLEAN | NO | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

## chunks

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| summary_id | UUID | NO | FK → summaries.id |
| content | TEXT | NO | Chunk text |
| order_index | INTEGER | NO | ⚠️ NOT `sort_order` |
| metadata | JSONB | NO | |
| created_at | TIMESTAMPTZ | NO | |

## keywords

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| summary_id | UUID | NO | FK → summaries.id |
| name | TEXT | NO | The keyword/term |
| definition | TEXT | YES | Explanation |
| priority | INTEGER | NO | ⚠️ INTEGER not string |
| created_by | UUID | NO | FK → profiles.id |
| is_active | BOOLEAN | NO | |
| source | TEXT | YES | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

## subtopics

Child of keywords. Referenced by flashcards, quiz_questions, bkt_states.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| keyword_id | UUID | NO | FK → keywords.id |
| name | TEXT | NO | |
| order_index | INTEGER | NO | |
| is_active | BOOLEAN | NO | |
| content | TEXT | YES | |
| created_at | TIMESTAMPTZ | NO | |

## keyword_connections

Links two related keywords (many-to-many, self-referencing).

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| keyword_a_id | UUID | NO | FK → keywords.id |
| keyword_b_id | UUID | NO | FK → keywords.id |
| relationship_type | TEXT | YES | |
| created_at | TIMESTAMPTZ | NO | |

CHECK: `keyword_a_id < keyword_b_id` (prevents duplicates)

## videos

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| summary_id | UUID | NO | FK → summaries.id ⚠️ NOT keyword_id |
| title | TEXT | NO | |
| url | TEXT | NO | |
| platform | TEXT | NO | CHECK: `youtube`, `vimeo`, `other` |
| keyword_id | UUID | YES | Optional FK → keywords.id |
| order_index | INTEGER | NO | |
| created_by | UUID | NO | FK → profiles.id |
| is_active | BOOLEAN | NO | |
| max_resolution | TEXT | YES | ⚠️ BUG-001: webhook writes `resolution_tier` |
| is_mux | BOOLEAN | NO | Whether processed by Mux |
| status | TEXT | NO | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

## Updated Hierarchy

```
Topic → Summary → Chunks
                 → Keywords → Subtopics
                           → Keyword Connections
                 → Videos
                 → Flashcards
                 → Quiz Questions
```
