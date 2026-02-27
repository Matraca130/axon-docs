# Schema: Study

> Tables for flashcards, quizzes, study sessions, and spaced repetition.
> **VERIFIED** against Query 2 constraint output.

## flashcards

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| keyword_id | UUID | **YES** | | FK -> keywords.id (NULLABLE) |
| summary_id | UUID | NO | | FK -> summaries.id |
| subtopic_id | UUID | YES | | FK -> subtopics.id |
| front | TEXT | NO | | Question side |
| back | TEXT | NO | | Answer side |
| source | TEXT | NO | | CHECK: `manual`, `ai` |
| created_by | UUID | NO | | FK -> profiles.id |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

> Note: `difficulty` column exists but is NULLABLE (no NOT NULL constraint found in Query 2).
> Has 4 FKs: keyword_id, summary_id, subtopic_id, created_by.

## quizzes

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| summary_id | UUID | NO | | FK -> summaries.id **NOT keyword_id!** |
| title | TEXT | NO | | |
| source | TEXT | NO | | CHECK: `manual`, `ai` |
| created_by | UUID | NO | | FK -> profiles.id |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## quiz_questions

**NO `name` COLUMN** (confirmed by Query 2)

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| keyword_id | UUID | YES | | FK -> keywords.id (NULLABLE!) |
| summary_id | UUID | NO | | FK -> summaries.id |
| subtopic_id | UUID | YES | | FK -> subtopics.id |
| quiz_id | UUID | YES | | FK -> quizzes.id |
| question_type | TEXT | NO | | CHECK: `mcq`, `true_false`, `fill_blank`, `open` |
| question | TEXT | NO | | |
| correct_answer | TEXT | NO | | |
| difficulty | **INTEGER** | NO | | **NOT NULL, INTEGER** |
| source | TEXT | NO | | CHECK: `manual`, `ai` |
| created_by | UUID | NO | | FK -> profiles.id |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

> Note: `options` (JSONB), `explanation` (TEXT), `priority` may exist but are nullable.

## quiz_attempts

**NEW TABLE** - individual question attempt records.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| student_id | UUID | NO | | FK -> profiles.id |
| quiz_question_id | UUID | NO | | FK -> quiz_questions.id |
| quiz_id | UUID | YES | | FK -> quizzes.id |
| session_id | UUID | YES | | FK -> study_sessions.id |
| answer | TEXT | NO | | Student's answer |
| is_correct | BOOLEAN | NO | | |
| created_at | TIMESTAMPTZ | NO | now() | |

## study_sessions

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| student_id | UUID | NO | | FK -> profiles.id **NOT `user_id`!** |
| course_id | UUID | YES | | FK -> courses.id |
| session_type | TEXT | NO | | CHECK: `flashcard`, `quiz`, `reading`, `mixed` |
| started_at | TIMESTAMPTZ | NO | now() | |
| completed_at | TIMESTAMPTZ | YES | | null = in progress |
| total_reviews | INTEGER | NO | 0 | |
| correct_reviews | INTEGER | NO | 0 | |
| created_at | TIMESTAMPTZ | NO | now() | |

> Note: NO `score` or `topic_id` columns! Uses `course_id` instead.

## reviews

**COMPLETELY DIFFERENT from initial docs!**

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| session_id | UUID | NO | | FK -> study_sessions.id |
| item_id | UUID | NO | | Generic item reference |
| instrument_type | TEXT | NO | | CHECK: `flashcard`, `quiz` |
| grade | INTEGER | NO | | Rating/grade value |
| created_at | TIMESTAMPTZ | NO | now() | |

> **NO** `user_id`, `flashcard_id`, `quiz_question_id`, `rating`, `response_time_ms`, or `reviewed_at` columns!
> Uses generic `item_id` + `instrument_type` pattern instead.

## fsrs_states

**NEW TABLE** - Free Spaced Repetition Scheduler state per student+flashcard.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| student_id | UUID | NO | | FK -> profiles.id |
| flashcard_id | UUID | YES | | FK -> flashcards.id |
| stability | NUMERIC | NO | | FSRS parameter |
| difficulty | NUMERIC | NO | | FSRS parameter (NOT integer) |
| reps | INTEGER | NO | 0 | Repetition count |
| lapses | INTEGER | NO | 0 | Lapse count |
| state | TEXT | NO | | CHECK: `new`, `learning`, `review`, `relearning` |
| due | TIMESTAMPTZ | YES | | Next review date |
| last_review | TIMESTAMPTZ | YES | | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**UNIQUE:** (student_id, flashcard_id)

## bkt_states

**NEW TABLE** - Bayesian Knowledge Tracing per student+subtopic.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| student_id | UUID | NO | | FK -> profiles.id |
| subtopic_id | UUID | NO | | FK -> subtopics.id |
| p_know | NUMERIC | NO | | Probability of knowing |
| p_transit | NUMERIC | NO | | Transition probability |
| p_slip | NUMERIC | NO | | Slip probability |
| p_guess | NUMERIC | NO | | Guess probability |
| delta | NUMERIC | NO | | Change metric |
| total_attempts | INTEGER | NO | 0 | |
| correct_attempts | INTEGER | NO | 0 | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**UNIQUE:** (student_id, subtopic_id)

## student_stats

**NEW TABLE** - aggregated per-student statistics.

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

**NEW TABLE** - daily study activity log.

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

## study_plans

**NEW TABLE** - student study plans.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| student_id | UUID | NO | | FK -> profiles.id |
| course_id | UUID | YES | | FK -> courses.id |
| name | TEXT | NO | | |
| status | TEXT | NO | | CHECK: `active`, `completed`, `archived` |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## study_plan_tasks

**NEW TABLE** - tasks within a study plan.

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
