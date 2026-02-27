# Schema: Study

> Tables for flashcards, quizzes, and study sessions.
> Source: Query 1 output cross-referenced with backend code.

## flashcards

⚠️ **RLS DISABLED** — see `bugs/security-audit.md`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| keyword_id | UUID | **YES** | | FK → keywords.id ⚠️ NULLABLE in DB but REQUIRED in backend |
| front | TEXT | NO | | Question side |
| back | TEXT | NO | | Answer side |
| difficulty | **INTEGER** | YES | | 1, 2, 3 — NOT a string! |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## quizzes

⚠️ **RLS DISABLED**

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| keyword_id | UUID | YES | | FK → keywords.id |
| title | TEXT | YES | | |
| description | TEXT | YES | | |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## quiz_questions

⚠️ **RLS DISABLED** — ⚠️ **NO `name` COLUMN** (phantom field in old docs)

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| keyword_id | UUID | NO | | FK → keywords.id |
| question_type | TEXT | NO | | `"mcq"`, `"true_false"`, `"fill_blank"`, `"open"` |
| question | TEXT | NO | | The question text |
| correct_answer | TEXT | NO | | |
| options | JSONB | YES | | For mcq: array of option strings |
| explanation | TEXT | YES | | Why the answer is correct |
| difficulty | **INTEGER** | YES | | 1, 2, 3 — NOT a string! |
| priority | **INTEGER** | YES | | 1, 2, 3 — NOT a string! |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**Required fields (backend):** `keyword_id`, `question_type`, `question`, `correct_answer`

## study_sessions

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | | FK → profiles.id |
| topic_id | UUID | YES | | FK → topics.id |
| session_type | TEXT | YES | | e.g. "flashcard", "quiz" |
| started_at | TIMESTAMPTZ | NO | now() | |
| completed_at | TIMESTAMPTZ | YES | | null = in progress |
| score | NUMERIC | YES | | Final score if applicable |
| created_at | TIMESTAMPTZ | NO | now() | |

## reviews

Spaced repetition review records.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | | FK → profiles.id |
| flashcard_id | UUID | YES | | FK → flashcards.id |
| quiz_question_id | UUID | YES | | FK → quiz_questions.id |
| rating | INTEGER | NO | | User's self-rating |
| response_time_ms | INTEGER | YES | | How long they took |
| reviewed_at | TIMESTAMPTZ | NO | now() | |

## Critical Reminders

- `difficulty` and `priority` are **INTEGER** (1, 2, 3), never strings
- `quiz_questions` has **NO `name` column**
- `question_type` valid values: `"mcq"`, `"true_false"`, `"fill_blank"`, `"open"`
- `flashcards.keyword_id` is NULLABLE in DB but REQUIRED by backend (BUG-005)
- Both flashcards and quiz_questions use `ensureGeneralKeyword`
