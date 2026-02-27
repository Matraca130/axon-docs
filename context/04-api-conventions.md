# 04 — API Conventions

> How the backend API works. Updated with Query 2 corrections.

## Route Style

Flat routes with query params:

```
GET  /topics?section_id=abc          ← list
GET  /topics/123                      ← get one
POST /topics                          ← create
PUT  /topics/123                      ← update
DELETE /topics/123                    ← delete
```

NEVER nested like `/sections/abc/topics`.

## Response Formats

### CRUD Factory (paginated list)
```json
{ "data": { "items": [...], "total": 42, "limit": 20, "offset": 0 } }
```

### Custom routes (array)
```json
{ "data": [...] }
```

### Single item
```json
{ "data": { ... } }
```

### Error
```json
{ "error": "message here" }
```

## Critical Type Rules (verified against DB)

| Field | DB Type | Values | NOT a string! |
|---|---|---|---|
| `priority` | INTEGER | 1, 2, 3 | ❌ "high", "medium", "low" |
| `difficulty` | INTEGER | 1, 2, 3 | ❌ "easy", "medium", "hard" |
| `question_type` | TEXT | `mcq`, `true_false`, `fill_blank`, `open` | |
| `source` | TEXT | `manual`, `ai` | On flashcards & quiz_questions |
| `order_index` | INTEGER | 0, 1, 2... | ❌ NOT `sort_order` |

## Corrected Column Names

| Old (wrong) | Real (DB) | Tables |
|---|---|---|
| `sort_order` | `order_index` | courses, semesters, sections, topics, chunks, etc. |
| `content` | `content_markdown` | summaries |
| `user_id` | `student_id` | study_sessions, quiz_attempts, etc. |
| `status` (text) | `is_active` (bool) | memberships |

## quiz_questions Required Fields

```
keyword_id, summary_id, question_type, question, correct_answer, source, created_by
```

**There is NO `name` column** on quiz_questions.

## reviews Structure (CORRECTED)

Reviews use polymorphic pattern:
```
session_id       → study_sessions.id (required)
item_id          → UUID of flashcard or quiz_question
instrument_type  → 'flashcard' | 'quiz'
grade            → INTEGER
```

NOT separate `flashcard_id`/`quiz_question_id` columns.
