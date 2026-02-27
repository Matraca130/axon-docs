# Schema: Student Features

> Tables for student-specific features: notes, annotations, reading progress.
> **NEW** - not in initial docs.

## kw_student_notes

Student notes on keywords.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| student_id | UUID | NO | | FK -> profiles.id |
| keyword_id | UUID | NO | | FK -> keywords.id |
| note | TEXT | NO | | |
| is_pinned | BOOLEAN | YES | | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## kw_prof_notes

Professor notes on keywords (visible to students).

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| professor_id | UUID | NO | | FK -> profiles.id |
| keyword_id | UUID | NO | | FK -> keywords.id |
| note | TEXT | NO | | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**UNIQUE:** (professor_id, keyword_id)

## text_annotations

Highlights and annotations on summary text.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| student_id | UUID | NO | | FK -> profiles.id |
| summary_id | UUID | NO | | FK -> summaries.id |
| start_offset | INTEGER | NO | | Character offset start |
| end_offset | INTEGER | NO | | Character offset end |
| color | TEXT | NO | | Highlight color |
| annotation_text | TEXT | YES | | Optional note |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## reading_states

Tracks reading progress per student per summary.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| student_id | UUID | NO | | FK -> profiles.id |
| summary_id | UUID | NO | | FK -> summaries.id |
| scroll_position | NUMERIC | NO | 0 | |
| time_spent_seconds | INTEGER | NO | 0 | |
| completed | BOOLEAN | NO | false | |
| completed_at | TIMESTAMPTZ | YES | | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**UNIQUE:** (student_id, summary_id)

## video_notes

Student notes on videos.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| student_id | UUID | NO | | FK -> profiles.id |
| video_id | UUID | NO | | FK -> videos.id |
| timestamp_seconds | NUMERIC | YES | | Video timestamp |
| note | TEXT | NO | | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## video_views

Tracks video watching progress.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| video_id | UUID | NO | | FK -> videos.id |
| user_id | UUID | NO | | FK -> profiles.id |
| institution_id | UUID | NO | | FK -> institutions.id |
| watch_time_seconds | INTEGER | NO | 0 | Current session |
| total_watch_time_seconds | INTEGER | NO | 0 | All time |
| completion_percentage | NUMERIC | NO | 0 | CHECK: 0-100 |
| completed | BOOLEAN | NO | false | |
| last_position_seconds | INTEGER | NO | 0 | Resume position |
| view_count | INTEGER | NO | 0 | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**UNIQUE:** (video_id, user_id)

## model_3d_notes

Student notes on 3D models.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| student_id | UUID | NO | | FK -> profiles.id |
| model_id | UUID | NO | | FK -> models_3d.id |
| part_name | TEXT | YES | | Specific part |
| note | TEXT | NO | | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |
