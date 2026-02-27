# 04 — API Conventions

> How the backend API works. Essential for writing frontend API calls.

## Base URL

The backend base URL is configured in the frontend's environment variables.

## Route Style

Flat routes with query params:

```
GET  /topics?section_id=abc          ← list topics in a section
GET  /topics/123                      ← get single topic
POST /topics                          ← create topic
PUT  /topics/123                      ← update topic
DELETE /topics/123                    ← delete topic
```

NEVER nested like `/sections/abc/topics` — always flat with query params.

## Response Formats

### CRUD Factory (paginated list)

```json
{
  "data": {
    "items": [...],
    "total": 42,
    "limit": 20,
    "offset": 0
  }
}
```

### Custom routes (array)

```json
{
  "data": [...]
}
```

### Single item

```json
{
  "data": { ... }
}
```

### Error

```json
{
  "error": "message here"
}
```

## Critical Type Rules

| Field | Type | Values | NOT string! |
|---|---|---|---|
| `priority` | INTEGER | 1, 2, 3 | ❌ "high", "medium", "low" |
| `difficulty` | INTEGER | 1, 2, 3 | ❌ "easy", "medium", "hard" |
| `question_type` | TEXT | `"mcq"`, `"true_false"`, `"fill_blank"`, `"open"` | |

## quiz_questions Required Fields

```
keyword_id, question_type, question, correct_answer
```

**There is NO `name` column** on quiz_questions. This was a phantom field in old docs.

## Both Flashcards and Quizzes use `ensureGeneralKeyword`

When creating a flashcard or quiz question, if no `keyword_id` is provided, the backend auto-creates a "General" keyword for the summary.
