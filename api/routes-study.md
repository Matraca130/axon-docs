# API Routes: Study

> Flashcards, quizzes, quiz questions, study sessions, reviews, spaced repetition, and study plans.
>
> **Verified against:** `routes-student.ts`, `routes/study/reviews.ts`,
> `routes/study/sessions.ts`, `routes/study/spaced-rep.ts`,
> `routes/study/progress.ts`, `routes-study-queue.ts`
>
> **Last verified:** 2026-03-14 (audit pass 10 — cross-checked all createFields/updateFields)

---

## Flashcards

**Source:** `routes-student.ts` via `crud-factory.ts`
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

**Source:** `routes-student.ts` via `crud-factory.ts`
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

**Source:** `routes-student.ts` via `crud-factory.ts`
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

**Source:** `routes-student.ts` via `crud-factory.ts`
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

## Student Notes (3 entities from routes-student.ts)

All use `scopeToUser: "student_id"` — auto-set from JWT, auto-filtered on all ops.

### Keyword Student Notes

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/kw-student-notes` | `keyword_id` (required) | Paginated (user-scoped) |
| GET | `/kw-student-notes/:id` | | Single |
| POST | `/kw-student-notes` | | Single (201) |
| PUT | `/kw-student-notes/:id` | | Single |
| DELETE | `/kw-student-notes/:id` | | Single (soft-delete) |

**Required:** `note`
**Create/Update fields:** `note`

### Text Annotations

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/text-annotations` | `summary_id` (required) | Paginated (user-scoped) |
| GET | `/text-annotations/:id` | | Single |
| POST | `/text-annotations` | | Single (201) |
| PUT | `/text-annotations/:id` | | Single |
| DELETE | `/text-annotations/:id` | | Single (soft-delete) |

**Required:** `start_offset`, `end_offset`
**Create fields:** `start_offset`, `end_offset`, `color`, `note`
**Update fields:** `color`, `note`

### Video Notes

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/video-notes` | `video_id` (required) | Paginated (user-scoped) |
| GET | `/video-notes/:id` | | Single |
| POST | `/video-notes` | | Single (201) |
| PUT | `/video-notes/:id` | | Single |
| DELETE | `/video-notes/:id` | | Single (soft-delete) |

**Required:** `note`
**Create fields:** `timestamp_seconds`, `note`
**Update fields:** `timestamp_seconds`, `note`

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
**afterWrite:** `xpHookForSessionComplete` — Awards XP when session completed

> `student_id` is auto-set from JWT, never sent by client.
> `session_type` valid values: `"flashcard"`, `"quiz"`, `"reading"`, `"mixed"`
> There is NO `user_id`, `topic_id`, or `score` field.

## Study Plans

**Source:** `routes/study/sessions.ts` via `crud-factory.ts`
**Scope:** `scopeToUser: "student_id"`

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/study-plans` | `course_id`, `status` (optional) | Paginated |
| GET | `/study-plans/:id` | | Single |
| POST | `/study-plans` | | Single (201) |
| PUT | `/study-plans/:id` | | Single |
| DELETE | `/study-plans/:id` | | Single (hard delete) |

**Required fields (POST):** `name`
**Create fields:** `course_id`, `name`, `status`, `completion_date`, `weekly_hours`, `metadata`
**Update fields:** `name`, `status`, `completion_date`, `weekly_hours`, `metadata`

> `status` valid values: `"active"`, `"completed"`, `"archived"`
> `completion_date` — DATE, DT-02 FIX
> `weekly_hours` — NUMERIC, DT-02 FIX
> `metadata` — JSONB, DT-02 FIX

## Study Plan Tasks

**Source:** `routes/study/sessions.ts` via `crud-factory.ts`
**Parent key:** `study_plan_id` (required on LIST and CREATE)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/study-plan-tasks` | `study_plan_id` (required) | Paginated (ordered by `order_index`) |
| GET | `/study-plan-tasks/:id` | | Single |
| POST | `/study-plan-tasks` | | Single (201) |
| PUT | `/study-plan-tasks/:id` | | Single |
| DELETE | `/study-plan-tasks/:id` | | Single (hard delete) |

**Required fields (POST):** `item_type`, `item_id`
**Create fields:** `item_type`, `item_id`, `status`, `order_index`, `original_method`, `scheduled_date`, `estimated_minutes`, `task_kind`
**Update fields:** `status`, `order_index`, `completed_at`, `scheduled_date`, `estimated_minutes`, `original_method`, `task_kind`
**afterWrite:** `xpHookForPlanTaskComplete` — Awards 15 XP per task + 100 XP bonus on full plan completion

> `item_type` valid values: `"flashcard"`, `"quiz"`, `"reading"`, `"keyword"`
> `status` valid values: `"pending"`, `"completed"`, `"skipped"`
> `task_kind` — PR1a scheduling engine field

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
> Gamification: `xpHookForReview` fires on POST (Sprint 1).
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
> Gamification: `xpHookForQuizAttempt` fires on POST (Sprint 1).

## Study Queue

**Source:** `routes-study-queue.ts` (custom)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/study-queue` | `course_id` (optional UUID), `limit` (default 20, max 100), `include_future` ("1" or absent) | `{ data: { queue: [...], meta: {...} } }` |

> Uses `get_study_queue()` RPC as primary path (S-3 FIX).
> Falls back to JS-based logic if RPC unavailable.
> Algorithm: NeedScore = 0.40*overdue + 0.30*(1-p_know) + 0.20*fragility + 0.10*novelty
> v4.2: clinical_priority exponential scaling, 5-color mastery scale, leech detection
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
| GET | `/bkt-states` | `subtopic_id` (optional), `subtopic_ids` (optional, comma-separated, max 200) | Array (paginated) |
| POST | `/bkt-states` | | Single (upsert) |

**Required (POST):** `subtopic_id` (UUID)
**Optional:** `p_know`, `p_transit`, `p_slip`, `p_guess` (all 0-1), `delta`, `total_attempts`, `correct_attempts`, `last_attempt_at`
**Upsert key:** `student_id,subtopic_id`

> M-1 FIX: `total_attempts`/`correct_attempts` INCREMENT instead of replace.
> M-5 FIX: `subtopic_ids` (plural) batch filter — comma-separated UUIDs, max 200.
>   Mutually exclusive with `subtopic_id` (singular). Reduces "fetch all BKT states"
>   to "only BKT states for this summary's subtopics".

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

### Reading States

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/reading-states` | `summary_id` (required UUID) | Single (user-scoped) |
| POST | `/reading-states` | | Single (upsert) |

**Optional (POST):** `scroll_position`, `time_spent_seconds`, `completed`, `last_read_at`
**Upsert key:** `student_id,summary_id`
> Gamification: `xpHookForReadingComplete` fires when `completed=true` (Sprint 1).

### Daily Activities

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/daily-activities` | `from`, `to` (optional YYYY-MM-DD) | Array (paginated, default 90) |
| POST | `/daily-activities` | | Single (upsert) |

**Required (POST):** `activity_date` (YYYY-MM-DD)
**Optional:** `reviews_count`, `correct_count`, `time_spent_seconds`, `sessions_count`
**Upsert key:** `student_id,activity_date`

### Student Stats

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/student-stats` | (none — auto-scoped to user) | Single |
| POST | `/student-stats` | | Single (upsert) |

**Optional (POST):** `current_streak`, `longest_streak`, `total_reviews`, `total_time_seconds`, `total_sessions`, `last_study_date`
**Upsert key:** `student_id`
