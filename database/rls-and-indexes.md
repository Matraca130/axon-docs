# RLS Status & Indexes

> Index data from Query 3a. RLS data from Query 3b. Updated: 2025-02-27.
> **Status: COMPLETE** — All queries executed. Cleanup applied.

## RLS Status (VERIFIED — Query 3b)

### Summary

- **43 legitimate tables** (excludes kv_store_* junk)
- **ALL 43 have RLS DISABLED** (`rowsecurity = false`)
- **0 RLS policies exist** (pg_policies returned 0 rows)
- **2 new tables discovered** not in previous docs: `model_layers`, `model_parts`

### Full Table List

| # | Table | RLS | Policies |
|---|---|---|---|
| 1 | admin_scopes | OFF | 0 |
| 2 | ai_generations | OFF | 0 |
| 3 | bkt_states | OFF | 0 |
| 4 | chunks | OFF | 0 |
| 5 | courses | OFF | 0 |
| 6 | daily_activities | OFF | 0 |
| 7 | flashcards | OFF | 0 |
| 8 | fsrs_states | OFF | 0 |
| 9 | institution_plans | OFF | 0 |
| 10 | institution_subscriptions | OFF | 0 |
| 11 | institutions | OFF | 0 |
| 12 | keyword_connections | OFF | 0 |
| 13 | keywords | OFF | 0 |
| 14 | kw_prof_notes | OFF | 0 |
| 15 | kw_student_notes | OFF | 0 |
| 16 | memberships | OFF | 0 |
| 17 | model_3d_notes | OFF | 0 |
| 18 | model_3d_pins | OFF | 0 |
| 19 | model_layers | OFF | 0 |
| 20 | model_parts | OFF | 0 |
| 21 | models_3d | OFF | 0 |
| 22 | plan_access_rules | OFF | 0 |
| 23 | platform_plans | OFF | 0 |
| 24 | profiles | OFF | 0 |
| 25 | quiz_attempts | OFF | 0 |
| 26 | quiz_questions | OFF | 0 |
| 27 | quizzes | OFF | 0 |
| 28 | reading_states | OFF | 0 |
| 29 | reviews | OFF | 0 |
| 30 | sections | OFF | 0 |
| 31 | semesters | OFF | 0 |
| 32 | student_stats | OFF | 0 |
| 33 | study_plan_tasks | OFF | 0 |
| 34 | study_plans | OFF | 0 |
| 35 | study_sessions | OFF | 0 |
| 36 | subtopics | OFF | 0 |
| 37 | summaries | OFF | 0 |
| 38 | summary_diagnostics | OFF | 0 |
| 39 | text_annotations | OFF | 0 |
| 40 | topics | OFF | 0 |
| 41 | video_notes | OFF | 0 |
| 42 | video_views | OFF | 0 |
| 43 | videos | OFF | 0 |

### RLS Risk Assessment

Since the backend (Hono on Deno) uses `service_role` key to talk to Supabase, RLS is bypassed anyway. However:

**High Priority** — These tables contain user-specific data and were flagged in the original audit:

| Table | Risk | Why |
|---|---|---|
| flashcards | HIGH | Student data, multi-tenancy |
| quiz_questions | HIGH | Course content, multi-tenancy |
| quizzes | HIGH | Course content, multi-tenancy |
| profiles | HIGH | PII (email, name) |
| memberships | HIGH | Role/access control |

**Medium Priority** — Student-owned data:

| Table | Risk |
|---|---|
| fsrs_states | Student learning state |
| bkt_states | Student knowledge state |
| reading_states | Student progress |
| text_annotations | Student notes |
| kw_student_notes | Student notes |
| study_sessions | Study activity |
| reviews | Review history |
| quiz_attempts | Quiz answers |
| daily_activities | Activity tracking |
| student_stats | Aggregated stats |

**Note:** RLS only matters if the frontend ever calls Supabase directly (e.g., Realtime subscriptions, Storage). Currently all data flows through the Hono backend with `service_role`, so RLS is defense-in-depth, not the primary security boundary.

---

## Indexes (VERIFIED from Query 3a)

### Legitimate Table Indexes (43 tables, 68 indexes after cleanup)

| Table | Index | Type | Definition |
|---|---|---|---|
| **admin_scopes** | idx_admin_scopes_membership | btree | (membership_id) |
| **ai_generations** | idx_ai_gen_institution | btree | (institution_id) |
| **bkt_states** | uq_bkt_states_student_subtopic | UNIQUE | (student_id, subtopic_id) |
| **chunks** | idx_chunks_summary | btree | (summary_id, order_index) |
| **courses** | idx_courses_institution | btree | (institution_id) |
| **courses** | idx_courses_order | btree | (institution_id, order_index) |
| **daily_activities** | uq_daily_activities_student_date | UNIQUE | (student_id, activity_date) |
| **flashcards** | idx_fc_subtopic | partial | (subtopic_id) WHERE deleted_at IS NULL |
| **flashcards** | idx_flashcards_keyword | btree | (keyword_id) |
| **flashcards** | idx_flashcards_summary | btree | (summary_id) |
| **fsrs_states** | idx_fsrs_due | partial | (student_id, due_at) WHERE due_at IS NOT NULL |
| **fsrs_states** | uq_fsrs_states_student_flashcard | UNIQUE | (student_id, flashcard_id) |
| **institution_plans** | idx_inst_plans_institution | btree | (institution_id) |
| **institution_subscriptions** | idx_inst_subs_institution | btree | (institution_id) |
| **institution_subscriptions** | idx_inst_subs_plan | btree | (plan_id) |
| **institutions** | idx_institutions_owner | btree | (owner_id) |
| **institutions** | idx_institutions_slug | UNIQUE | (slug) |
| **keyword_connections** | idx_connections_a | btree | (keyword_a_id) |
| **keyword_connections** | idx_connections_b | btree | (keyword_b_id) |
| **keyword_connections** | idx_connections_unique | UNIQUE | (keyword_a_id, keyword_b_id) |
| **keywords** | idx_keywords_active | partial | (summary_id) WHERE deleted_at IS NULL |
| **keywords** | idx_keywords_summary | btree | (summary_id) |
| **kw_prof_notes** | idx_kw_prof_notes_keyword | btree | (keyword_id) |
| **kw_prof_notes** | uq_kw_prof_notes_prof_keyword | UNIQUE | (professor_id, keyword_id) |
| **kw_student_notes** | idx_kw_student_notes | UNIQUE | (student_id, keyword_id) |
| **memberships** | idx_memberships_institution | btree | (institution_id) |
| **memberships** | idx_memberships_plan | btree | (institution_plan_id) |
| **memberships** | idx_memberships_user_inst | UNIQUE | (user_id, institution_id) |
| **model_3d_notes** | idx_model3d_notes_student | btree | (student_id, model_id) |
| **model_3d_pins** | idx_pins_keyword | partial | (keyword_id) WHERE keyword_id IS NOT NULL |
| **model_3d_pins** | idx_pins_model | btree | (model_id) |
| **models_3d** | idx_models3d_active | partial | (topic_id) WHERE deleted_at IS NULL |
| **models_3d** | idx_models3d_topic | btree | (topic_id, order_index) |
| **plan_access_rules** | idx_access_rules_plan | btree | (plan_id) |
| **plan_access_rules** | idx_access_rules_unique | UNIQUE | (plan_id, scope_type, scope_id) |
| **platform_plans** | idx_platform_plans_slug | UNIQUE | (slug) |
| **profiles** | idx_profiles_email | UNIQUE | (email) |
| **quiz_attempts** | idx_attempts_session | btree | (session_id) |
| **quiz_attempts** | idx_attempts_student | btree | (student_id, quiz_question_id) |
| **quiz_attempts** | idx_qa_quiz | btree | (quiz_id) |
| **quiz_questions** | idx_qq_quiz | partial | (quiz_id) WHERE deleted_at IS NULL |
| **quiz_questions** | idx_qq_subtopic | partial | (subtopic_id) WHERE deleted_at IS NULL |
| **quiz_questions** | idx_quiz_keyword | btree | (keyword_id) |
| **quiz_questions** | idx_quiz_summary | btree | (summary_id) |
| **quizzes** | idx_quizzes_created_by | btree | (created_by) |
| **quizzes** | idx_quizzes_summary | partial | (summary_id) WHERE deleted_at IS NULL |
| **reading_states** | uq_reading_states_student_summary | UNIQUE | (student_id, summary_id) |
| **reviews** | idx_reviews_session | btree | (session_id) |
| **sections** | idx_sections_semester | btree | (semester_id, order_index) |
| **semesters** | idx_semesters_course | btree | (course_id, order_index) |
| **student_stats** | uq_student_stats_student | UNIQUE | (student_id) |
| **study_plan_tasks** | idx_plan_tasks | btree | (study_plan_id, order_index) |
| **study_plans** | idx_study_plans_student | btree | (student_id) |
| **study_sessions** | idx_sessions_student | btree | (student_id, started_at DESC) |
| **subtopics** | idx_subtopics_active | partial | (keyword_id) WHERE deleted_at IS NULL |
| **subtopics** | idx_subtopics_keyword | btree | (keyword_id) |
| **summaries** | idx_summaries_active | partial | (topic_id) WHERE deleted_at IS NULL |
| **summaries** | idx_summaries_topic | btree | (topic_id, order_index) |
| **summary_diagnostics** | idx_diag_parent | partial | (parent_diagnostic_id) WHERE NOT NULL |
| **summary_diagnostics** | idx_diag_summary | btree | (summary_id) |
| **summary_diagnostics** | idx_diag_type | btree | (summary_id, diagnostic_type) |
| **text_annotations** | idx_annotations_student_summary | btree | (student_id, summary_id) |
| **topics** | idx_topics_section | btree | (section_id, order_index) |
| **video_notes** | idx_video_notes_student | btree | (student_id, video_id) |
| **video_views** | idx_video_views_user_id | btree | (user_id) |
| **video_views** | idx_video_views_video_id | btree | (video_id) |
| **video_views** | video_views_video_id_user_id_key | UNIQUE | (video_id, user_id) |
| **videos** | idx_videos_mux_asset_id | partial | (mux_asset_id) WHERE NOT NULL |
| **videos** | idx_videos_mux_upload_id | partial | (mux_upload_id) WHERE NOT NULL |
| **videos** | idx_videos_summary | btree | (summary_id, order_index) |

> **model_layers** and **model_parts** have no custom indexes (only PK).

---

## Cleanup Log

### ✅ kv_store Cleanup — DONE (2025-02-27)

- Dropped ~25 `kv_store_*` tables via `cleanup-kv-store.sql`
- ~150+ junk indexes removed automatically (CASCADE)

### ✅ Duplicate Index Cleanup — DONE (2025-02-27)

Dropped 6 duplicate indexes via `cleanup-duplicate-indexes.sql`:

| Table | Dropped | Kept |
|---|---|---|
| bkt_states | idx_bkt_student_subtopic | uq_bkt_states_student_subtopic |
| daily_activities | idx_daily_student_date | uq_daily_activities_student_date |
| fsrs_states | idx_fsrs_student_fc | uq_fsrs_states_student_flashcard |
| kw_prof_notes | idx_kw_prof_notes_unique | uq_kw_prof_notes_prof_keyword |
| reading_states | idx_reading_student_summary | uq_reading_states_student_summary |
| student_stats | idx_student_stats | uq_student_stats_student |

---

## Key Discoveries

### 1. Soft-Delete Pattern (`deleted_at IS NULL`)

7 tables use partial indexes with `WHERE deleted_at IS NULL`:

| Table | Index |
|---|---|
| flashcards | idx_fc_subtopic |
| keywords | idx_keywords_active |
| models_3d | idx_models3d_active |
| quiz_questions | idx_qq_quiz, idx_qq_subtopic |
| quizzes | idx_quizzes_summary |
| subtopics | idx_subtopics_active |
| summaries | idx_summaries_active |

### 2. `fsrs_states.due_at` (not `due`)

The FSRS due date column is `due_at` not `due`.

### 3. Videos have Mux columns

- `mux_asset_id` (indexed, partial WHERE NOT NULL)
- `mux_upload_id` (indexed, partial WHERE NOT NULL)

---

## Missing Indexes (Recommendations)

| Table | Suggested Index | Reason |
|---|---|---|
| memberships | (user_id, is_active) | Auth queries filter by active |
| reviews | (item_id, instrument_type) | Generic item lookups |
| study_sessions | (course_id) | Filter sessions by course |
| text_annotations | (summary_id) | Load annotations for a summary |
| quiz_attempts | (quiz_question_id) | Stats per question |
| model_layers | (model_id) | Query layers by model |
| model_parts | (model_id) | Query parts by model |
