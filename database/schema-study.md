# Schema: Study

> Tables for flashcards, quizzes, study sessions, and spaced repetition.
> **VERIFIED** against Query 2 constraint output.
>
> **Cross-verified against backend code:** 2026-03-06

## flashcards

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| keyword_id | UUID | **YES** | | FK -> keywords.id (NULLABLE in DB, REQUIRED by backend) |
| summary_id | UUID | NO | | FK -> summaries.id (**parentKey** in crud-factory) |
| subtopic_id | UUID | YES | | FK -> subtopics.id |
| front | TEXT | NO | | Question side |
| back | TEXT | NO | | Answer side |
| source | TEXT | NO | | CHECK: `manual`, `ai` |
| front_image_url | TEXT | YES | | Supabase Storage path |
| back_image_url | TEXT | YES | | Supabase Storage path |
| created_by | UUID | NO | | FK -> profiles.id |
| is_active | BOOLEAN | NO | true | |
| deleted_at | TIMESTAMPTZ | YES | | Soft-delete marker |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## quizzes

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| summary_id | UUID | NO | | FK -> summaries.id (**parentKey**) |
| title | TEXT | NO | | |
| description | TEXT | YES | | |
| source | TEXT | NO | | CHECK: `manual`, `ai` |
| created_by | UUID | NO | | FK -> profiles.id |
| is_active | BOOLEAN | NO | true | |
| deleted_at | TIMESTAMPTZ | YES | | Soft-delete marker |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## quiz_questions

**NO `name` COLUMN** (confirmed by Query 2)

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| keyword_id | UUID | YES | | FK -> keywords.id (NULLABLE!) |
| summary_id | UUID | NO | | FK -> summaries.id (**parentKey**) |
| subtopic_id | UUID | YES | | FK -> subtopics.id |
| quiz_id | UUID | YES | | FK -> quizzes.id (optional, loose questions allowed) |
| question_type | TEXT | NO | | CHECK: `mcq`, `true_false`, `fill_blank`, `open` |
| question | TEXT | NO | | |
| options | JSONB | YES | | For mcq questions |
| correct_answer | TEXT | NO | | |
| explanation | TEXT | YES | | |
| difficulty | **INTEGER** | NO | | **NOT NULL, INTEGER** |
| source | TEXT | NO | | CHECK: `manual`, `ai` |
| created_by | UUID | NO | | FK -> profiles.id |
| is_active | BOOLEAN | NO | true | |
| deleted_at | TIMESTAMPTZ | YES | | Soft-delete marker |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## quiz_attempts

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| student_id | UUID | NO | | FK -> profiles.id |
| quiz_question_id | UUID | NO | | FK -> quiz_questions.id |
| quiz_id | UUID | YES | | FK -> quizzes.id |
| session_id | UUID | YES | | FK -> study_sessions.id |
| answer | TEXT | NO | | Student's answer |
| is_correct | BOOLEAN | NO | | |
| time_taken_ms | INTEGER | YES | | Response time |
| created_at | TIMESTAMPTZ | NO | now() | |

## study_sessions

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| student_id | UUID | NO | | FK -> profiles.id (**scopeToUser**, NOT `user_id`!) |
| course_id | UUID | YES | | FK -> courses.id (optional filter) |
| session_type | TEXT | NO | | CHECK: `flashcard`, `quiz`, `reading`, `mixed` |
| started_at | TIMESTAMPTZ | NO | now() | |
| completed_at | TIMESTAMPTZ | YES | | null = in progress |
| total_reviews | INTEGER | NO | 0 | |
| correct_reviews | INTEGER | NO | 0 | |
| created_at | TIMESTAMPTZ | NO | now() | |

> **NO `score`, `topic_id`, or `user_id` columns.** Uses `student_id` + `course_id`.

## reviews

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| session_id | UUID | NO | | FK -> study_sessions.id |
| item_id | UUID | NO | | Generic item reference |
| instrument_type | TEXT | NO | | CHECK: `flashcard`, `quiz` |
| grade | INTEGER | NO | | Grade value (0-5) |
| response_time_ms | INTEGER | YES | | M-2 FIX: added via migration |
| created_at | TIMESTAMPTZ | NO | now() | |

> **NO `user_id`, `flashcard_id`, `quiz_question_id`, `rating`, or `reviewed_at` columns!**
> Uses generic `item_id` + `instrument_type` pattern instead.
> CREATE-ONLY table: LIST + POST, no update, no delete.
> O-3 FIX: Session ownership verified before operations.

## fsrs_states

Free Spaced Repetition Scheduler state per student+flashcard.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| student_id | UUID | NO | | FK -> profiles.id |
| flashcard_id | UUID | YES | | FK -> flashcards.id |
| stability | NUMERIC | NO | | FSRS parameter |
| difficulty | NUMERIC | NO | | FSRS parameter (0-10, NOT integer) |
| reps | INTEGER | NO | 0 | Repetition count |
| lapses | INTEGER | NO | 0 | Lapse count |
| state | TEXT | NO | | CHECK: `new`, `learning`, `review`, `relearning` |
| due_at | TIMESTAMPTZ | YES | | Next review date |
| last_review_at | TIMESTAMPTZ | YES | | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**UNIQUE:** (student_id, flashcard_id)

> **VERIFY IN SUPABASE:** Backend code uses `due_at` and `last_review_at`.
> Previous doc version said `due` and `last_review`. Check actual column
> names in DB with: `SELECT column_name FROM information_schema.columns WHERE table_name = 'fsrs_states';`

## bkt_states

Bayesian Knowledge Tracing per student+subtopic.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| student_id | UUID | NO | | FK -> profiles.id |
| subtopic_id | UUID | NO | | FK -> subtopics.id |
| p_know | NUMERIC | NO | | Probability of knowing (0-1) |
| p_transit | NUMERIC | NO | | Transition probability (0-1) |
| p_slip | NUMERIC | NO | | Slip probability (0-1) |
| p_guess | NUMERIC | NO | | Guess probability (0-1) |
| delta | NUMERIC | NO | | Change metric |
| total_attempts | INTEGER | NO | 0 | M-1 FIX: INCREMENTs, not replaces |
| correct_attempts | INTEGER | NO | 0 | M-1 FIX: INCREMENTs, not replaces |
| last_attempt_at | TIMESTAMPTZ | YES | | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**UNIQUE:** (student_id, subtopic_id)

## student_stats

Aggregated per-student statistics.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| student_id | UUID | NO | | FK -> profiles.id |
| current_streak | INTEGER | NO | 0 | |
| longest_streak | INTEGER | NO | 0 | |
| total_reviews | INTEGER | NO | 0 | |
| total_time_seconds | INTEGER | NO | 0 | |
| total_sessions | INTEGER | NO | 0 | |
| last_study_date | DATE | YES | | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**UNIQUE:** (student_id)

## daily_activities

Daily study activity log.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| student_id | UUID | NO | | FK -> profiles.id |
| activity_date | DATE | NO | | |
| reviews_count | INTEGER | NO | 0 | |
| correct_count | INTEGER | NO | 0 | |
| time_spent_seconds | INTEGER | NO | 0 | |
| sessions_count | INTEGER | NO | 0 | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**UNIQUE:** (student_id, activity_date)

## reading_states

Per-summary reading progress.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| student_id | UUID | NO | | FK -> profiles.id |
| summary_id | UUID | NO | | FK -> summaries.id |
| scroll_position | NUMERIC | YES | | |
| time_spent_seconds | NUMERIC | YES | | |
| completed | BOOLEAN | YES | | |
| last_read_at | TIMESTAMPTZ | YES | | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**UNIQUE:** (student_id, summary_id)

## study_plans

Student study plans.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| student_id | UUID | NO | | FK -> profiles.id |
| course_id | UUID | YES | | FK -> courses.id |
| name | TEXT | NO | | |
| status | TEXT | NO | | CHECK: `active`, `completed`, `archived` |
| completion_date | DATE | YES | | DT-02 FIX |
| weekly_hours | NUMERIC | YES | | DT-02 FIX |
| metadata | JSONB | YES | | DT-02 FIX |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## study_plan_tasks

Tasks within a study plan.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| study_plan_id | UUID | NO | | FK -> study_plans.id |
| item_type | TEXT | NO | | CHECK: `flashcard`, `quiz`, `reading`, `keyword` |
| item_id | UUID | NO | | Generic item reference |
| status | TEXT | NO | | CHECK: `pending`, `completed`, `skipped` |
| order_index | INTEGER | NO | 0 | |
| completed_at | TIMESTAMPTZ | YES | | |
| created_at | TIMESTAMPTZ | NO | now() | |
