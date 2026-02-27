# Schema: Extra Tables

> Student activity, notes, annotations, 3D models, AI, diagnostics.
> **VERIFIED against Query 2 constraints data.**

## Student Activity & Stats

### study_plans

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| student_id | UUID | NO | FK → profiles.id |
| course_id | UUID | YES | FK → courses.id |
| name | TEXT | NO | |
| status | TEXT | NO | CHECK: `active`, `completed`, `archived` |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

### study_plan_tasks

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| study_plan_id | UUID | NO | FK → study_plans.id |
| item_type | TEXT | NO | CHECK: `flashcard`, `quiz`, `reading`, `keyword` |
| item_id | UUID | NO | Polymorphic ref |
| status | TEXT | NO | CHECK: `pending`, `completed`, `skipped` |
| order_index | INTEGER | NO | |
| completed_at | TIMESTAMPTZ | YES | |
| created_at | TIMESTAMPTZ | NO | |

### daily_activities

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| student_id | UUID | NO | FK → profiles.id |
| activity_date | DATE | NO | |
| reviews_count | INTEGER | NO | |
| correct_count | INTEGER | NO | |
| time_spent_seconds | INTEGER | NO | |
| sessions_count | INTEGER | NO | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

UNIQUE: `(student_id, activity_date)`

### student_stats

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| student_id | UUID | NO | FK → profiles.id |
| current_streak | INTEGER | NO | |
| longest_streak | INTEGER | NO | |
| total_reviews | INTEGER | NO | |
| total_time_seconds | INTEGER | NO | |
| total_sessions | INTEGER | NO | |
| last_review_date | DATE | YES | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

UNIQUE: `(student_id)`

### reading_states

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| student_id | UUID | NO | FK → profiles.id |
| summary_id | UUID | NO | FK → summaries.id |
| scroll_position | NUMERIC | NO | |
| time_spent_seconds | INTEGER | NO | |
| completed | BOOLEAN | NO | |
| completed_at | TIMESTAMPTZ | YES | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

UNIQUE: `(student_id, summary_id)`

## Notes & Annotations

### kw_prof_notes

Professor notes on keywords.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| professor_id | UUID | NO | FK → profiles.id |
| keyword_id | UUID | NO | FK → keywords.id |
| note | TEXT | NO | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

UNIQUE: `(professor_id, keyword_id)`

### kw_student_notes

Student notes on keywords.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| student_id | UUID | NO | FK → profiles.id |
| keyword_id | UUID | NO | FK → keywords.id |
| note | TEXT | NO | |
| is_public | BOOLEAN | YES | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

### text_annotations

Highlights/annotations on summary text.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| student_id | UUID | NO | FK → profiles.id |
| summary_id | UUID | NO | FK → summaries.id |
| start_offset | INTEGER | NO | |
| end_offset | INTEGER | NO | |
| color | TEXT | NO | |
| annotation_note | TEXT | YES | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

### video_notes

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| student_id | UUID | NO | FK → profiles.id |
| video_id | UUID | NO | FK → videos.id |
| timestamp_seconds | INTEGER | YES | |
| note | TEXT | NO | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

### video_views

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| video_id | UUID | NO | FK → videos.id |
| user_id | UUID | NO | FK → profiles.id |
| institution_id | UUID | NO | FK → institutions.id |
| watch_time_seconds | INTEGER | NO | |
| total_watch_time_seconds | INTEGER | NO | |
| completion_percentage | NUMERIC | NO | CHECK: 0–100 |
| completed | BOOLEAN | NO | |
| last_position_seconds | INTEGER | NO | |
| view_count | INTEGER | NO | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

UNIQUE: `(video_id, user_id)`
