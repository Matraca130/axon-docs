# API Routes: Study

> Flashcards, quizzes, quiz questions, study sessions, and reviews.

## Flashcards

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/flashcards` | `keyword_id` | Paginated |
| GET | `/flashcards/:id` | | Single |
| POST | `/flashcards` | | Single |
| PUT | `/flashcards/:id` | | Single |
| DELETE | `/flashcards/:id` | | Single |

**Required fields (backend):** `keyword_id`, `front`, `back`

⚠️ `keyword_id` is NULLABLE in DB but REQUIRED by backend (BUG-005)
⚠️ Uses `ensureGeneralKeyword` if no keyword_id
⚠️ `difficulty` is INTEGER (1,2,3), not string

## Quizzes

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/quizzes` | `keyword_id` | Paginated |
| GET | `/quizzes/:id` | | Single |
| POST | `/quizzes` | | Single |
| PUT | `/quizzes/:id` | | Single |
| DELETE | `/quizzes/:id` | | Single |

## Quiz Questions

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/quiz-questions` | `keyword_id` | Paginated |
| GET | `/quiz-questions/:id` | | Single |
| POST | `/quiz-questions` | | Single |
| PUT | `/quiz-questions/:id` | | Single |
| DELETE | `/quiz-questions/:id` | | Single |

**Required fields:** `keyword_id`, `question_type`, `question`, `correct_answer`

⚠️ **NO `name` column** — do not send `name` in requests
⚠️ `question_type`: `"mcq"`, `"true_false"`, `"fill_blank"`, `"open"`
⚠️ `difficulty` and `priority` are INTEGER (1,2,3)

## Study Sessions

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/study-sessions` | `user_id`, `topic_id` | Paginated |
| GET | `/study-sessions/:id` | | Single |
| POST | `/study-sessions` | | Single |
| PUT | `/study-sessions/:id` | | Single |
| DELETE | `/study-sessions/:id` | | Single |

**Required fields:** `user_id`, `topic_id`

## Reviews

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/reviews` | `user_id` | Paginated |
| POST | `/reviews` | | Single |

**Required fields:** `user_id`, `rating` + at least one of `flashcard_id` or `quiz_question_id`

## Study Queue (custom)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/study-queue` | `user_id`, `topic_id` | `{ data: [...] }` (array) |

Returns items due for review (spaced repetition).
⚠️ Makes ~5 sequential DB queries (BUG-006).
