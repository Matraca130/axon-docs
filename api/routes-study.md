# API Routes: Study

> Flashcards, quizzes, quiz questions, study sessions, reviews, and spaced repetition.
>
> **Verified against:** `routes-student.tsx`, `routes/study/reviews.ts`,
> `routes/study/sessions.ts`, `routes/study/spaced-rep.ts`,
> `routes/study/progress.ts`, `routes-study-queue.tsx`
>
> **Last verified:** 2026-03-06

---

## Flashcards

**Source:** `routes-student.tsx` via `crud-factory.ts`
**Parent key:** `summary_id` (required on LIST and CREATE)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/flashcards` | `summary_id` (required), `keyword_id`, `subtopic_id` (optional) | Paginated |
| GET | `/flashcards/:id` | | Single |
| POST | `/flashcards` | | Single (201) |
| PUT | `/flashcards/:id` | | Single |
| DELETE | `/flashcards/:id` | | Single (soft-delete) |
| PUT | `/flashcards/:id/restore` | | Single (restore) |

**Required fields (POST):** `keyword_id`, `front`, `back`
**Create fields:** `keyword_id`, `subtopic_id`, `front`, `back`, `source`, `front_image_url`, `back_image_url`
**Update fields:** `front`, `back`, `source`, `subtopic_id`, `is_active`, `front_image_url`, `back_image_url`
**Flags:** `hasCreatedBy`, `hasUpdatedAt`, `softDelete`, `hasIsActive`

## Quizzes

**Source:** `routes-student.tsx` via `crud-factory.ts`
**Parent key:** `summary_id` (required on LIST and CREATE)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/quizzes` | `summary_id` (required), `source`, `is_active` (optional) | Paginated |
| GET | `/quizzes/:id` | | Single |
| POST | `/quizzes` | | Single (201) |
| PUT | `/quizzes/:id` | | Single |
| DELETE | `/quizzes/:id` | | Single (soft-delete) |
| PUT | `/quizzes/:id/restore` | | Single (restore) |

**Required fields (POST):** `title`, `source`
**Create fields:** `title`, `description`, `source`
**Update fields:** `title`, `description`, `is_active`
**Flags:** `hasCreatedBy`, `hasUpdatedAt`, `softDelete`, `hasIsActive`

## Quiz Questions

**Source:** `routes-student.tsx` via `crud-factory.ts`
**Parent key:** `summary_id` (required on LIST and CREATE)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/quiz-questions` | `summary_id` (required), `keyword_id`, `question_type`, `difficulty`, `subtopic_id`, `quiz_id` (optional) | Paginated |
| GET | `/quiz-questions/:id` | | Single |
| POST | `/quiz-questions` | | Single (201) |
| PUT | `/quiz-questions/:id` | | Single |
| DELETE | `/quiz-questions/:id` | | Single (soft-delete) |
| PUT | `/quiz-questions/:id/restore` | | Single (restore) |

**Required fields (POST):** `keyword_id`, `question_type`, `question`, `correct_answer`
**Create fields:** `keyword_id`, `subtopic_id`, `quiz_id`, `question_type`, `question`, `options`, `correct_answer`, `explanation`, `difficulty`, `source`
**Update fields:** `question_type`, `question`, `options`, `correct_answer`, `explanation`, `difficulty`, `source`, `subtopic_id`, `quiz_id`, `is_active`

> `question_type` valid values: `"mcq"`, `"true_false"`, `"fill_blank"`, `"open"`
> `difficulty` and `priority` are INTEGER (1,2,3), not strings.
> There is **NO `name` column** on quiz_questions.

## Videos

**Source:** `routes-student.tsx` via `crud-factory.ts`
**Parent key:** `summary_id` (required on LIST and CREATE)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/videos` | `summary_id` (required) | Paginated (ordered by `order_index`) |
| GET | `/videos/:id` | | Single |
| POST | `/videos` | | Single (201) |
| PUT | `/videos/:id` | | Single |
| DELETE | `/videos/:id` | | Single (soft-delete) |
| PUT | `/videos/:id/restore` | | Single (restore) |

**Required fields (POST):** `title`, `url`
**Create fields:** `title`, `url`, `platform`, `duration_seconds`, `order_index`
**Update fields:** `title`, `url`, `platform`, `duration_seconds`, `order_index`, `is_active`
**Flags:** `hasCreatedBy`, `hasUpdatedAt`, `hasOrderIndex`, `softDelete`, `hasIsActive`

## Study Sessions

**Source:** `routes/study/sessions.ts` via `crud-factory.ts`
**Scope:** `scopeToUser: "student_id"` (auto-set on CREATE, auto-filtered on LIST/GET/UPDATE/DELETE)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/study-sessions` | `course_id`, `session_type` (optional) | Paginated |
| GET | `/study-sessions/:id` | | Single |
| POST | `/study-sessions` | | Single (201) |
| PUT | `/study-sessions/:id` | | Single |
| DELETE | `/study-sessions/:id` | | Single (hard delete) |

**Required fields (POST):** `session_type`
**Create fields:** `course_id`, `session_type`
**Update fields:** `completed_at`, `total_reviews`, `correct_reviews`

> `student_id` is auto-set from JWT, never sent by client.
> `session_type` valid values: `"flashcard"`, `"quiz"`, `"reading"`, `"mixed"`
> There is NO `user_id`, `topic_id`, or `score` field.

## Reviews

**Source:** `routes/study/reviews.ts` (custom, NOT crud-factory)
**Type:** CREATE-ONLY (LIST + POST, no update, no delete)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/reviews` | `session_id` (required, UUID) | Array (paginated) |
| POST | `/reviews` | | Single (201) |

**Required fields (POST):** `session_id` (UUID), `item_id` (UUID), `instrument_type` (string), `grade` (number 0-5)
**Optional fields:** `response_time_ms` (non-negative integer)

> `instrument_type` valid values: `"flashcard"`, `"quiz"`
> O-3 FIX: Verifies session ownership before any operation.
> There is NO `user_id`, `rating`, `flashcard_id`, or `quiz_question_id` field.

## Quiz Attempts

**Source:** `routes/study/reviews.ts` (custom)
**Type:** CREATE-ONLY (LIST + POST)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/quiz-attempts` | `quiz_question_id` and/or `session_id` (at least one required) | Array (paginated) |
| POST | `/quiz-attempts` | | Single (201) |

**Required fields (POST):** `quiz_question_id` (UUID), `answer` (string), `is_correct` (boolean)
**Optional fields:** `session_id` (UUID), `time_taken_ms` (non-negative integer)

> `student_id` is auto-set from JWT.

## Study Queue

**Source:** `routes-study-queue.tsx` (custom)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/study-queue` | `course_id` (optional UUID), `limit` (default 20, max 100), `include_future` ("1" or absent) | `{ data: { queue: [...], meta: {...} } }` |

> Uses `get_study_queue()` RPC as primary path (S-3 FIX).
> Falls back to JS-based logic if RPC unavailable.
> Algorithm: NeedScore = 0.40*overdue + 0.30*(1-p_know) + 0.20*fragility + 0.10*novelty
> There is NO `user_id` or `topic_id` parameter.

## Spaced Repetition

**Source:** `routes/study/spaced-rep.ts` (custom)

### FSRS States (per student+flashcard)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/fsrs-states` | `flashcard_id`, `state`, `due_before` (all optional) | Array (paginated) |
| POST | `/fsrs-states` | | Single (upsert) |

**Required (POST):** `flashcard_id` (UUID)
**Optional:** `stability`, `difficulty` (0-10), `due_at`, `last_review_at`, `reps`, `lapses`, `state`
**Upsert key:** `student_id,flashcard_id`

### BKT States (per student+subtopic)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/bkt-states` | `subtopic_id` (optional) | Array (paginated) |
| POST | `/bkt-states` | | Single (upsert) |

**Required (POST):** `subtopic_id` (UUID)
**Optional:** `p_know`, `p_transit`, `p_slip`, `p_guess` (all 0-1), `delta`, `total_attempts`, `correct_attempts`, `last_attempt_at`
**Upsert key:** `student_id,subtopic_id`

> M-1 FIX: `total_attempts`/`correct_attempts` INCREMENT instead of replace.

## Progress Tracking

**Source:** `routes/study/progress.ts` (custom)

### Topic Progress (unified endpoint)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/topic-progress` | `topic_id` (required UUID) | `{ summaries, reading_states, flashcard_counts }` |

> Replaces N+1 pattern: 1 request instead of 1 + 2N.

### Topics Overview (batch endpoint)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/topics-overview` | `topic_ids` (required, comma-separated UUIDs, max 50) | `{ summaries_by_topic, keyword_counts_by_topic }` |

### Reading States, Daily Activities, Student Stats

All use GET (list/single) + POST (upsert) pattern with `student_id` auto-set from JWT.
