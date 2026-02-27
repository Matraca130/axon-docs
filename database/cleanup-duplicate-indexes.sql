-- =============================================================
-- CLEANUP: Drop duplicate unique indexes
-- =============================================================
-- These tables have TWO identical unique indexes each.
-- Keep the constraint-backed uq_* versions, drop the manual idx_* ones.
--
-- Each pair is verified identical from Query 3 output.
-- =============================================================

-- 1. bkt_states: idx_bkt_student_subtopic = uq_bkt_states_student_subtopic
--    Both: UNIQUE btree (student_id, subtopic_id)
DROP INDEX IF EXISTS idx_bkt_student_subtopic;

-- 2. daily_activities: idx_daily_student_date = uq_daily_activities_student_date
--    Both: UNIQUE btree (student_id, activity_date)
DROP INDEX IF EXISTS idx_daily_student_date;

-- 3. fsrs_states: idx_fsrs_student_fc = uq_fsrs_states_student_flashcard
--    Both: UNIQUE btree (student_id, flashcard_id)
DROP INDEX IF EXISTS idx_fsrs_student_fc;

-- 4. kw_prof_notes: idx_kw_prof_notes_unique = uq_kw_prof_notes_prof_keyword
--    Both: UNIQUE btree (professor_id, keyword_id)
DROP INDEX IF EXISTS idx_kw_prof_notes_unique;

-- 5. reading_states: idx_reading_student_summary = uq_reading_states_student_summary
--    Both: UNIQUE btree (student_id, summary_id)
DROP INDEX IF EXISTS idx_reading_student_summary;

-- 6. student_stats: idx_student_stats = uq_student_stats_student
--    Both: UNIQUE btree (student_id)
DROP INDEX IF EXISTS idx_student_stats;

-- =============================================================
-- Verify: should show 0 of the dropped indexes
-- =============================================================
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_bkt_student_subtopic',
    'idx_daily_student_date',
    'idx_fsrs_student_fc',
    'idx_kw_prof_notes_unique',
    'idx_reading_student_summary',
    'idx_student_stats'
  );
-- Should return 0 rows
