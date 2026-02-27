# Schema: Content

> Tables that hold educational content.
> Source: Query 1 output cross-referenced with backend code.

## topics

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| section_id | UUID | NO | | FK → sections.id |
| name | TEXT | NO | | |
| description | TEXT | YES | | |
| is_active | BOOLEAN | NO | true | |
| sort_order | INTEGER | YES | 0 | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## summaries

Usually 1:1 with topics. Contains the full text content.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| topic_id | UUID | NO | | FK → topics.id |
| title | TEXT | YES | | |
| content | TEXT | YES | | Full markdown/text content |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## chunks

Ordered pieces of a summary, used for progressive disclosure.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| summary_id | UUID | NO | | FK → summaries.id |
| content | TEXT | NO | | Chunk text |
| sort_order | INTEGER | YES | 0 | Display order |
| chunk_type | TEXT | YES | | e.g. "paragraph", "heading" |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## keywords

Key terms extracted from summaries. Parent of flashcards, quizzes, videos.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| summary_id | UUID | NO | | FK → summaries.id |
| name | TEXT | NO | | The keyword/term |
| definition | TEXT | YES | | Explanation |
| is_general | BOOLEAN | NO | false | true = auto-created "General" keyword |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## videos

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| keyword_id | UUID | YES | | FK → keywords.id |
| title | TEXT | YES | | |
| url | TEXT | YES | | Video URL |
| max_resolution | TEXT | YES | | ⚠️ Backend bug writes to `resolution_tier` |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## Notes

- `ensureGeneralKeyword`: Both flashcards and quizzes auto-create a keyword with `is_general=true` if none is provided
- The `videos.max_resolution` column has a known bug (BUG-001): the webhook writes to `resolution_tier` which doesn't exist
