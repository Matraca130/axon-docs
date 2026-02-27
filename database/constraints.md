# Database Constraints (Query 2 Results)

> Real data from Supabase SQL Editor. Updated: 2025-02-27.

## CHECK Constraints (domain rules)

| Table | Constraint | Check Clause |
|---|---|---|
| admin_scopes | scope_type_check | `scope_type IN ('full','course','semester','section')` |
| ai_generations | generation_type_check | `generation_type IN ('flashcards','quiz','keywords','chat','summary_diagnostic')` |
| flashcards | source_check | `source IN ('manual','ai')` |
| fsrs_states | state_check | `state IN ('new','learning','review','relearning')` |
| institution_plans | billing_cycle_check | `billing_cycle IN ('monthly','semester','yearly')` |
| institution_subscriptions | status_check | `status IN ('active','past_due','canceled','trialing')` |
| keyword_connections | check | `keyword_a_id < keyword_b_id` (enforces ordering) |
| memberships | role_check | `role IN ('owner','admin','professor','student')` ⚠️ **4 roles!** |
| model_3d_pins | pin_type_check | `pin_type IN ('point','line','area')` |
| models_3d | file_format_check | `file_format IN ('glb','gltf','obj','fbx')` |
| plan_access_rules | scope_type_check | `scope_type IN ('course','semester','section','topic','summary')` |
| platform_plans | billing_cycle_check | `billing_cycle IN ('monthly','yearly')` |
| profiles | platform_role_check | `platform_role IN ('platform_admin','user')` |
| quiz_questions | question_type_check | `question_type IN ('mcq','true_false','fill_blank','open')` |
| quiz_questions | source_check | `source IN ('manual','ai')` |
| reviews | instrument_type_check | `instrument_type IN ('flashcard','quiz')` |
| study_plan_tasks | item_type_check | `item_type IN ('flashcard','quiz','reading','keyword')` |
| study_plan_tasks | status_check | `status IN ('pending','completed','skipped')` |
| study_plans | status_check | `status IN ('active','completed','archived')` |
| study_sessions | session_type_check | `session_type IN ('flashcard','quiz','reading','mixed')` |
| summaries | status_check | `status IN ('draft','published','rejected')` |
| summary_diagnostics | diagnostic_type_check | `diagnostic_type IN ('general','depth_analysis','weak_areas','content_quality','comparative')` |
| video_views | completion_percentage_check | `completion_percentage >= 0 AND <= 100` |
| videos | platform_check | `platform IN ('youtube','vimeo','other')` |

## UNIQUE Constraints

| Table | Constraint | Columns |
|---|---|---|
| bkt_states | uq_bkt_states_student_subtopic | `(student_id, subtopic_id)` |
| daily_activities | uq_daily_activities_student_date | `(student_id, activity_date)` |
| fsrs_states | uq_fsrs_states_student_flashcard | `(student_id, flashcard_id)` |
| kw_prof_notes | uq_kw_prof_notes_prof_keyword | `(professor_id, keyword_id)` |
| reading_states | uq_reading_states_student_summary | `(student_id, summary_id)` |
| student_stats | uq_student_stats_student | `(student_id)` |
| video_views | video_views_video_id_user_id_key | `(video_id, user_id)` |

## Foreign Keys (non-obvious / cross-domain)

| Table | Column | → References |
|---|---|---|
| admin_scopes | membership_id | memberships.id |
| ai_generations | source_keyword_id | keywords.id |
| ai_generations | source_summary_id | summaries.id |
| flashcards | subtopic_id | subtopics.id |
| fsrs_states | flashcard_id | flashcards.id |
| institution_subscriptions | plan_id | platform_plans.id |
| memberships | institution_plan_id | institution_plans.id |
| quiz_attempts | session_id | study_sessions.id |
| quiz_attempts | quiz_id | quizzes.id |
| quiz_questions | quiz_id | quizzes.id |
| quiz_questions | subtopic_id | subtopics.id |
| study_plans | course_id | courses.id |
| study_sessions | course_id | courses.id |
| summary_diagnostics | ai_generation_id | ai_generations.id |
| summary_diagnostics | parent_diagnostic_id | summary_diagnostics.id (self-ref) |

## Key Corrections vs Initial Docs

1. **4 roles not 3:** `owner`, `admin`, `professor`, `student`
2. **`memberships.is_active`** (boolean), NOT `status` (text)
3. **`order_index`** everywhere, NOT `sort_order`
4. **`summaries.content_markdown`**, NOT `content`
5. **`quizzes`/`quiz_questions`/`flashcards`** link to `summary_id`, not just `keyword_id`
6. **`reviews`** uses `session_id` + `item_id` + `instrument_type` + `grade`, NOT individual flashcard_id/quiz_question_id/rating
7. **`study_sessions`** uses `student_id` + `course_id`, NOT `user_id` + `topic_id`
8. **`videos`** links to `summary_id`, NOT `keyword_id`
