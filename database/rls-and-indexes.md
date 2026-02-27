# RLS Status & Indexes

> Index data from Query 3 output. Updated: 2025-02-27.
> RLS/policies data still pending (run the RLS query separately).

## RLS Status

> **PENDING** - Run this query in Supabase SQL Editor:

```sql
SELECT schemaname, tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename NOT LIKE 'kv_store_%'
ORDER BY tablename;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename NOT LIKE 'kv_store_%'
ORDER BY tablename, policyname;
```

### Known RLS Issues (from audit)

| Table | RLS Enabled | Issue |
|---|---|---|
| flashcards | NO (assumed) | Multi-tenancy broken |
| quiz_questions | NO (assumed) | Multi-tenancy broken |
| quizzes | NO (assumed) | Multi-tenancy broken |

---

## Indexes (VERIFIED from Query 3)

### Legitimate Table Indexes (38 tables)

| Table | Index | Type | Definition |
|---|---|---|---|
| **admin_scopes** | idx_admin_scopes_membership | btree | (membership_id) |
| **ai_generations** | idx_ai_gen_institution | btree | (institution_id) |
| **bkt_states** | idx_bkt_student_subtopic | UNIQUE | (student_id, subtopic_id) |
| **bkt_states** | uq_bkt_states_student_subtopic | UNIQUE | (student_id, subtopic_id) **DUPLICATE** |
| **chunks** | idx_chunks_summary | btree | (summary_id, order_index) |
| **courses** | idx_courses_institution | btree | (institution_id) |
| **courses** | idx_courses_order | btree | (institution_id, order_index) |
| **daily_activities** | idx_daily_student_date | UNIQUE | (student_id, activity_date) |
| **daily_activities** | uq_daily_activities_student_date | UNIQUE | (student_id, activity_date) **DUPLICATE** |
| **flashcards** | idx_fc_subtopic | btree | (subtopic_id) WHERE deleted_at IS NULL |
| **flashcards** | idx_flashcards_keyword | btree | (keyword_id) |
| **flashcards** | idx_flashcards_summary | btree | (summary_id) |
| **fsrs_states** | idx_fsrs_due | btree | (student_id, **due_at**) WHERE due_at IS NOT NULL |
| **fsrs_states** | idx_fsrs_student_fc | UNIQUE | (student_id, flashcard_id) |
| **fsrs_states** | uq_fsrs_states_student_flashcard | UNIQUE | (student_id, flashcard_id) **DUPLICATE** |
| **institution_plans** | idx_inst_plans_institution | btree | (institution_id) |
| **institution_subscriptions** | idx_inst_subs_institution | btree | (institution_id) |
| **institution_subscriptions** | idx_inst_subs_plan | btree | (plan_id) |
| **institutions** | idx_institutions_owner | btree | (owner_id) |
| **institutions** | idx_institutions_slug | UNIQUE | (slug) |
| **keyword_connections** | idx_connections_a | btree | (keyword_a_id) |
| **keyword_connections** | idx_connections_b | btree | (keyword_b_id) |
| **keyword_connections** | idx_connections_unique | UNIQUE | (keyword_a_id, keyword_b_id) |
| **keywords** | idx_keywords_active | btree | (summary_id) WHERE deleted_at IS NULL |
| **keywords** | idx_keywords_summary | btree | (summary_id) |
| **kw_prof_notes** | idx_kw_prof_notes_keyword | btree | (keyword_id) |
| **kw_prof_notes** | idx_kw_prof_notes_unique | UNIQUE | (professor_id, keyword_id) |
| **kw_prof_notes** | uq_kw_prof_notes_prof_keyword | UNIQUE | (professor_id, keyword_id) **DUPLICATE** |
| **kw_student_notes** | idx_kw_student_notes | UNIQUE | (student_id, keyword_id) |
| **memberships** | idx_memberships_institution | btree | (institution_id) |
| **memberships** | idx_memberships_plan | btree | (institution_plan_id) |
| **memberships** | idx_memberships_user_inst | UNIQUE | (user_id, institution_id) |
| **model_3d_notes** | idx_model3d_notes_student | btree | (student_id, model_id) |
| **model_3d_pins** | idx_pins_keyword | btree | (keyword_id) WHERE keyword_id IS NOT NULL |
| **model_3d_pins** | idx_pins_model | btree | (model_id) |
| **models_3d** | idx_models3d_active | btree | (topic_id) WHERE deleted_at IS NULL |
| **models_3d** | idx_models3d_topic | btree | (topic_id, order_index) |
| **plan_access_rules** | idx_access_rules_plan | btree | (plan_id) |
| **plan_access_rules** | idx_access_rules_unique | UNIQUE | (plan_id, scope_type, scope_id) |
| **platform_plans** | idx_platform_plans_slug | UNIQUE | (slug) |
| **profiles** | idx_profiles_email | UNIQUE | (email) |
| **quiz_attempts** | idx_attempts_session | btree | (session_id) |
| **quiz_attempts** | idx_attempts_student | btree | (student_id, quiz_question_id) |
| **quiz_attempts** | idx_qa_quiz | btree | (quiz_id) |
| **quiz_questions** | idx_qq_quiz | btree | (quiz_id) WHERE deleted_at IS NULL |
| **quiz_questions** | idx_qq_subtopic | btree | (subtopic_id) WHERE deleted_at IS NULL |
| **quiz_questions** | idx_quiz_keyword | btree | (keyword_id) |
| **quiz_questions** | idx_quiz_summary | btree | (summary_id) |
| **quizzes** | idx_quizzes_created_by | btree | (created_by) |
| **quizzes** | idx_quizzes_summary | btree | (summary_id) WHERE deleted_at IS NULL |
| **reading_states** | idx_reading_student_summary | UNIQUE | (student_id, summary_id) |
| **reading_states** | uq_reading_states_student_summary | UNIQUE | (student_id, summary_id) **DUPLICATE** |
| **reviews** | idx_reviews_session | btree | (session_id) |
| **sections** | idx_sections_semester | btree | (semester_id, order_index) |
| **semesters** | idx_semesters_course | btree | (course_id, order_index) |
| **student_stats** | idx_student_stats | UNIQUE | (student_id) |
| **student_stats** | uq_student_stats_student | UNIQUE | (student_id) **DUPLICATE** |
| **study_plan_tasks** | idx_plan_tasks | btree | (study_plan_id, order_index) |
| **study_plans** | idx_study_plans_student | btree | (student_id) |
| **study_sessions** | idx_sessions_student | btree | (student_id, started_at DESC) |
| **subtopics** | idx_subtopics_active | btree | (keyword_id) WHERE deleted_at IS NULL |
| **subtopics** | idx_subtopics_keyword | btree | (keyword_id) |
| **summaries** | idx_summaries_active | btree | (topic_id) WHERE deleted_at IS NULL |
| **summaries** | idx_summaries_topic | btree | (topic_id, order_index) |
| **summary_diagnostics** | idx_diag_parent | btree | (parent_diagnostic_id) WHERE NOT NULL |
| **summary_diagnostics** | idx_diag_summary | btree | (summary_id) |
| **summary_diagnostics** | idx_diag_type | btree | (summary_id, diagnostic_type) |
| **text_annotations** | idx_annotations_student_summary | btree | (student_id, summary_id) |
| **topics** | idx_topics_section | btree | (section_id, order_index) |
| **video_notes** | idx_video_notes_student | btree | (student_id, video_id) |
| **video_views** | idx_video_views_user_id | btree | (user_id) |
| **video_views** | idx_video_views_video_id | btree | (video_id) |
| **video_views** | video_views_video_id_user_id_key | UNIQUE | (video_id, user_id) |
| **videos** | idx_videos_mux_asset_id | btree | (mux_asset_id) WHERE NOT NULL |
| **videos** | idx_videos_mux_upload_id | btree | (mux_upload_id) WHERE NOT NULL |
| **videos** | idx_videos_summary | btree | (summary_id, order_index) |

---

## Key Discoveries

### 1. `deleted_at` Soft-Delete Pattern

Multiple tables use `deleted_at IS NULL` in partial indexes, proving they use **`deleted_at` timestamp** for soft-delete (not just `is_active` boolean):

| Table | Index with `WHERE deleted_at IS NULL` |
|---|---|
| flashcards | idx_fc_subtopic |
| keywords | idx_keywords_active |
| models_3d | idx_models3d_active |
| quiz_questions | idx_qq_quiz, idx_qq_subtopic |
| quizzes | idx_quizzes_summary |
| subtopics | idx_subtopics_active |
| summaries | idx_summaries_active |

> These tables have BOTH `is_active` boolean AND `deleted_at` timestamp columns.

### 2. `fsrs_states.due_at` (not `due`)

The FSRS due date column is `due_at` not `due` as documented.

### 3. Videos have Mux columns

- `mux_asset_id` (indexed, partial WHERE NOT NULL)
- `mux_upload_id` (indexed, partial WHERE NOT NULL)

### 4. Duplicate Indexes (7 pairs)

These tables have redundant unique indexes:

| Table | Duplicate Pair |
|---|---|
| bkt_states | idx_bkt_student_subtopic = uq_bkt_states_student_subtopic |
| daily_activities | idx_daily_student_date = uq_daily_activities_student_date |
| fsrs_states | idx_fsrs_student_fc = uq_fsrs_states_student_flashcard |
| kw_prof_notes | idx_kw_prof_notes_unique = uq_kw_prof_notes_prof_keyword |
| reading_states | idx_reading_student_summary = uq_reading_states_student_summary |
| student_stats | idx_student_stats = uq_student_stats_student |

**Fix:** Drop one from each pair (keep the `uq_` constraint-backed ones).

### 5. kv_store Index Bloat

~150+ junk indexes across kv_store_* tables. Worst offenders:

| Table | Duplicate Indexes |
|---|---|
| kv_store_229c9fbf | **39 identical indexes** |
| kv_store_6569f786 | **30 identical indexes** |
| kv_store_0ada7954 | 13 identical indexes |
| kv_store_8cb6316a | 11 identical indexes |
| kv_store_2a9cf36e | 10 identical indexes |

All are `btree (key text_pattern_ops)` on the same column.

---

## Cleanup SQL

### Drop duplicate legitimate indexes

```sql
-- Keep uq_* (constraint-backed), drop manual duplicates
DROP INDEX IF EXISTS idx_bkt_student_subtopic;
DROP INDEX IF EXISTS idx_daily_student_date;
DROP INDEX IF EXISTS idx_fsrs_student_fc;
DROP INDEX IF EXISTS idx_kw_prof_notes_unique;
DROP INDEX IF EXISTS idx_reading_student_summary;
DROP INDEX IF EXISTS idx_student_stats;
```

### Drop ALL kv_store tables and their indexes

```sql
-- Generate DROP statements for all kv_store tables
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename LIKE 'kv_store_%'
  LOOP
    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
END $$;
```

> This will also drop all ~150+ kv_store indexes automatically.

---

## Missing Indexes (Recommendations)

| Table | Suggested Index | Reason |
|---|---|---|
| memberships | (user_id, is_active) | Auth queries filter by active |
| reviews | (item_id, instrument_type) | Generic item lookups |
| study_sessions | (course_id) | Filter sessions by course |
| text_annotations | (summary_id) | Load annotations for a summary |
| quiz_attempts | (quiz_question_id) | Stats per question |
