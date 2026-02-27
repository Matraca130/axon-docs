# Database Constraints (Query 2 Results)

> Generated from actual Supabase SQL output. Updated: 2025-02-27.
> Excludes `kv_store_*` junk tables.

## CHECK Constraints (Business Rules)

| Table | Constraint | Check Clause |
|---|---|---|
| admin_scopes | admin_scopes_scope_type_check | `scope_type IN ('full','course','semester','section')` |
| ai_generations | ai_generations_generation_type_check | `generation_type IN ('flashcards','quiz','keywords','chat','summary_diagnostic')` |
| flashcards | flashcards_source_check | `source IN ('manual','ai')` |
| fsrs_states | fsrs_states_state_check | `state IN ('new','learning','review','relearning')` |
| institution_plans | institution_plans_billing_cycle_check | `billing_cycle IN ('monthly','semester','yearly')` |
| institution_subscriptions | institution_subscriptions_status_check | `status IN ('active','past_due','canceled','trialing')` |
| keyword_connections | keyword_connections_check | `keyword_a_id < keyword_b_id` |
| memberships | memberships_role_check | `role IN ('owner','admin','professor','student')` |
| model_3d_pins | model_3d_pins_pin_type_check | `pin_type IN ('point','line','area')` |
| models_3d | models_3d_file_format_check | `file_format IN ('glb','gltf','obj','fbx')` |
| plan_access_rules | plan_access_rules_scope_type_check | `scope_type IN ('course','semester','section','topic','summary')` |
| platform_plans | platform_plans_billing_cycle_check | `billing_cycle IN ('monthly','yearly')` |
| profiles | profiles_platform_role_check | `platform_role IN ('platform_admin','user')` |
| quiz_questions | quiz_questions_question_type_check | `question_type IN ('mcq','true_false','fill_blank','open')` |
| quiz_questions | quiz_questions_source_check | `source IN ('manual','ai')` |
| quizzes | (implied from source NOT NULL) | `source` column exists |
| reviews | reviews_instrument_type_check | `instrument_type IN ('flashcard','quiz')` |
| study_plan_tasks | study_plan_tasks_item_type_check | `item_type IN ('flashcard','quiz','reading','keyword')` |
| study_plan_tasks | study_plan_tasks_status_check | `status IN ('pending','completed','skipped')` |
| study_plans | study_plans_status_check | `status IN ('active','completed','archived')` |
| study_sessions | study_sessions_session_type_check | `session_type IN ('flashcard','quiz','reading','mixed')` |
| summaries | summaries_status_check | `status IN ('draft','published','rejected')` |
| video_views | video_views_completion_percentage_check | `completion_percentage >= 0 AND <= 100` |
| videos | videos_platform_check | `platform IN ('youtube','vimeo','other')` |

## UNIQUE Constraints

| Table | Constraint | Columns |
|---|---|---|
| bkt_states | uq_bkt_states_student_subtopic | (student_id, subtopic_id) |
| daily_activities | uq_daily_activities_student_date | (student_id, activity_date) |
| fsrs_states | uq_fsrs_states_student_flashcard | (student_id, flashcard_id) |
| kw_prof_notes | uq_kw_prof_notes_prof_keyword | (professor_id, keyword_id) |
| reading_states | uq_reading_states_student_summary | (student_id, summary_id) |
| student_stats | uq_student_stats_student | (student_id) |
| video_views | video_views_video_id_user_id_key | (video_id, user_id) |

## Foreign Keys

| Table | Column | References |
|---|---|---|
| admin_scopes | membership_id | memberships.id |
| ai_generations | institution_id | institutions.id |
| ai_generations | requested_by | profiles.id |
| ai_generations | source_keyword_id | keywords.id |
| ai_generations | source_summary_id | summaries.id |
| bkt_states | student_id | profiles.id |
| bkt_states | subtopic_id | subtopics.id |
| chunks | summary_id | summaries.id |
| courses | created_by | profiles.id |
| courses | institution_id | institutions.id |
| daily_activities | student_id | profiles.id |
| flashcards | created_by | profiles.id |
| flashcards | keyword_id | keywords.id |
| flashcards | summary_id | summaries.id |
| flashcards | subtopic_id | subtopics.id |
| fsrs_states | flashcard_id | flashcards.id |
| fsrs_states | student_id | profiles.id |
| institution_plans | institution_id | institutions.id |
| institution_subscriptions | institution_id | institutions.id |
| institution_subscriptions | plan_id | platform_plans.id |
| institution_subscriptions | user_id | profiles.id |
| institutions | owner_id | profiles.id |
| keyword_connections | keyword_a_id | keywords.id |
| keyword_connections | keyword_b_id | keywords.id |
| keywords | created_by | profiles.id |
| keywords | summary_id | summaries.id |
| kw_prof_notes | keyword_id | keywords.id |
| kw_prof_notes | professor_id | profiles.id |
| kw_student_notes | keyword_id | keywords.id |
| kw_student_notes | student_id | profiles.id |
| memberships | institution_id | institutions.id |
| memberships | institution_plan_id | institution_plans.id |
| memberships | user_id | profiles.id |
| model_3d_notes | model_id | models_3d.id |
| model_3d_notes | student_id | profiles.id |
| model_3d_pins | created_by | profiles.id |
| model_3d_pins | keyword_id | keywords.id |
| model_3d_pins | model_id | models_3d.id |
| model_layers | model_id | models_3d.id |
| model_parts | model_id | models_3d.id |
| models_3d | created_by | profiles.id |
| models_3d | topic_id | topics.id |
| plan_access_rules | plan_id | institution_plans.id |
| profiles | id | auth.users.id |
| quiz_attempts | quiz_id | quizzes.id |
| quiz_attempts | quiz_question_id | quiz_questions.id |
| quiz_attempts | session_id | study_sessions.id |
| quiz_attempts | student_id | profiles.id |
| quiz_questions | created_by | profiles.id |
| quiz_questions | keyword_id | keywords.id |
| quiz_questions | quiz_id | quizzes.id |
| quiz_questions | subtopic_id | subtopics.id |
| quiz_questions | summary_id | summaries.id |
| quizzes | created_by | profiles.id |
| quizzes | summary_id | summaries.id |
| reading_states | student_id | profiles.id |
| reading_states | summary_id | summaries.id |
| reviews | session_id | study_sessions.id |
| sections | created_by | profiles.id |
| sections | semester_id | semesters.id |
| semesters | course_id | courses.id |
| semesters | created_by | profiles.id |
| student_stats | student_id | profiles.id |
| study_plan_tasks | study_plan_id | study_plans.id |
| study_plans | course_id | courses.id |
| study_plans | student_id | profiles.id |
| study_sessions | course_id | courses.id |
| study_sessions | student_id | profiles.id |
| subtopics | keyword_id | keywords.id |
| summary_diagnostics | ai_generation_id | ai_generations.id |
| summary_diagnostics | parent_diagnostic_id | summary_diagnostics.id |
| summary_diagnostics | requested_by | profiles.id |
| summary_diagnostics | summary_id | summaries.id |
| text_annotations | student_id | profiles.id |
| text_annotations | summary_id | summaries.id |
| video_notes | student_id | profiles.id |
| video_notes | video_id | videos.id |
| video_views | institution_id | institutions.id |
| video_views | user_id | profiles.id |
| video_views | video_id | videos.id |
| videos | created_by | profiles.id |
| videos | summary_id | summaries.id |

## Primary Keys

All tables use `id UUID` as PK except `kv_store_*` which use `key TEXT`.
