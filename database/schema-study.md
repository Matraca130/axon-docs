# Schema: Study

> Flashcards, quizzes, study sessions, reviews, spaced repetition.
> **VERIFIED against Query 2 constraints data.**

## flashcards

⚠️ **RLS DISABLED**

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| keyword_id | UUID | YES | FK → keywords.id (nullable!) |
| summary_id | UUID | NO | FK → summaries.id |
| subtopic_id | UUID | YES | FK → subtopics.id |
| front | TEXT | NO | Question side |
| back | TEXT | NO | Answer side |
| source | TEXT | NO | CHECK: `manual`, `ai` |
| created_by | UUID | NO | FK → profiles.id |
| is_active | BOOLEAN | NO | |
| difficulty | INTEGER | YES | 1, 2, 3 — NOT string |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

## quizzes

⚠️ **RLS DISABLED**

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| summary_id | UUID | NO | FK → summaries.id ⚠️ NOT keyword_id |
| title | TEXT | NO | |
| description | TEXT | YES | |
| source | TEXT | NO | CHECK: `manual`, `ai` |
| created_by | UUID | NO | FK → profiles.id |
| is_active | BOOLEAN | NO | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

## quiz_questions

⚠️ **RLS DISABLED** — ⚠️ **NO `name` COLUMN**

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| keyword_id | UUID | YES | FK → keywords.id |
| summary_id | UUID | NO | FK → summaries.id |
| quiz_id | UUID | YES | FK → quizzes.id |
| subtopic_id | UUID | YES | FK → subtopics.id |
| question_type | TEXT | NO | CHECK: `mcq`, `true_false`, `fill_blank`, `open` |
| question | TEXT | NO | |
| options | JSONB | YES | For mcq |
| correct_answer | TEXT | NO | |
| explanation | TEXT | YES | |
| difficulty | INTEGER | NO | ⚠️ NOT NULL, INTEGER (1,2,3) |
| source | TEXT | NO | CHECK: `manual`, `ai` |
| created_by | UUID | NO | FK → profiles.id |
| is_active | BOOLEAN | NO | |
| priority | INTEGER | YES | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

## quiz_attempts

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| student_id | UUID | NO | FK → profiles.id |
| quiz_question_id | UUID | NO | FK → quiz_questions.id |
| quiz_id | UUID | YES | FK → quizzes.id |
| session_id | UUID | YES | FK → study_sessions.id |
| answer | TEXT | NO | |
| is_correct | BOOLEAN | NO | |
| response_time_ms | INTEGER | YES | |
| created_at | TIMESTAMPTZ | NO | |

## study_sessions

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| student_id | UUID | NO | FK → profiles.id ⚠️ NOT `user_id` |
| course_id | UUID | YES | FK → courses.id ⚠️ NOT `topic_id` |
| session_type | TEXT | NO | CHECK: `flashcard`, `quiz`, `reading`, `mixed` |
| started_at | TIMESTAMPTZ | NO | |
| completed_at | TIMESTAMPTZ | YES | |
| duration_seconds | INTEGER | YES | |
| total_reviews | INTEGER | NO | |
| correct_reviews | INTEGER | NO | |
| created_at | TIMESTAMPTZ | NO | |

## reviews

⚠️ **Structure different from initial docs!**

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| session_id | UUID | NO | FK → study_sessions.id |
| item_id | UUID | NO | Generic ref to flashcard or quiz_question |
| instrument_type | TEXT | NO | CHECK: `flashcard`, `quiz` |
| grade | INTEGER | NO | Rating/grade value |
| created_at | TIMESTAMPTZ | NO | |

**Key difference:** Reviews use `item_id` + `instrument_type` pattern (polymorphic), NOT separate `flashcard_id`/`quiz_question_id` columns.

## fsrs_states (Free Spaced Repetition Scheduler)

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| student_id | UUID | NO | FK → profiles.id |
| flashcard_id | UUID | YES | FK → flashcards.id |
| stability | NUMERIC | NO | FSRS parameter |
| difficulty | NUMERIC | NO | FSRS parameter |
| due_date | TIMESTAMPTZ | YES | Next review date |
| last_review | TIMESTAMPTZ | YES | |
| reps | INTEGER | NO | Total repetitions |
| lapses | INTEGER | NO | Times forgotten |
| state | TEXT | NO | CHECK: `new`, `learning`, `review`, `relearning` |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

UNIQUE: `(student_id, flashcard_id)`

## bkt_states (Bayesian Knowledge Tracing)

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| student_id | UUID | NO | FK → profiles.id |
| subtopic_id | UUID | NO | FK → subtopics.id |
| p_know | NUMERIC | NO | Probability of knowing |
| p_transit | NUMERIC | NO | |
| p_slip | NUMERIC | NO | |
| p_guess | NUMERIC | NO | |
| delta | NUMERIC | NO | |
| total_attempts | INTEGER | NO | |
| correct_attempts | INTEGER | NO | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

UNIQUE: `(student_id, subtopic_id)`
