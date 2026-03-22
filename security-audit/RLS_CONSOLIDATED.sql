-- CONSOLIDATED RLS MIGRATION — Axon Security Audit S11 (v2 corrected)
-- Generated: 2026-03-19 (post-audit corrections)
-- Fixes: removed 3 non-existent functions, added memberships UPDATE/DELETE,
-- platform_plans writes, 8 missing tables (reading_states, student_stats,
-- admin_scopes, streak_freezes, streak_repairs, ai_generations,
-- summary_diagnostics, profiles)

BEGIN;

-- SOURCE: 20260319_01_bulk_reorder_security.sql

-- ============================================================================
-- Migration: Security hardening for bulk_reorder SECURITY DEFINER function
-- Date: 2026-03-19
-- Branch: security/phase-3-access-control
--
-- Problem:
--   bulk_reorder uses SECURITY DEFINER (bypasses RLS) and was GRANTed to
--   anon + authenticated. Any authenticated user could call it via PostgREST
--   RPC and reorder content in any institution, or reorder another user's
--   study plan tasks.
--
-- Remediation (defense in depth, same pattern as 20260311_02):
--   Layer 0 -- Table allowlist (already existed, preserved)
--   Layer 1 -- REVOKE from PUBLIC/anon/authenticated, GRANT to service_role only
--   Layer 2 -- Internal auth.uid() check when called outside service_role:
--              - Content tables: resolve institution via resolve_parent_institution(),
--                then verify caller has CONTENT_WRITE role (owner/admin/professor)
--              - study_plan_tasks: verify task belongs to caller via study_plans.student_id
--   Layer 3 -- SET search_path = public, pg_temp (prevents search_path hijacking)
--
-- The function is FUNCTIONALLY IDENTICAL to the original except for the
-- security layers added. All existing logic is preserved.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════
-- 1. DROP the old signature to avoid function overloading
-- ════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS bulk_reorder(text, jsonb);


-- ════════════════════════════════════════════════════════════════════
-- 2. CREATE the hardened function
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION bulk_reorder(
  p_table text,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp                          -- Layer 3
AS $$
DECLARE
  v_count int;
  v_has_updated_at bool;
  v_first_id uuid;
  v_institution_id uuid;
  v_caller_role text;
BEGIN
  -- ── Layer 0: Table allowlist (belt-and-suspenders with Hono validation) ──
  IF p_table NOT IN (
    'courses', 'semesters', 'sections', 'topics', 'summaries',
    'chunks', 'subtopics', 'videos', 'models_3d', 'model_3d_pins',
    'study_plan_tasks'
  ) THEN
    RAISE EXCEPTION 'Table "%" not allowed for reorder', p_table;
  END IF;

  -- ── Validate items array ──
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'p_items must be a non-empty JSON array';
  END IF;

  IF jsonb_array_length(p_items) > 200 THEN
    RAISE EXCEPTION 'Too many items: % (max 200)', jsonb_array_length(p_items);
  END IF;

  -- ── Layer 2: Defense-in-depth auth check ──
  -- auth.uid() IS NULL when called via service_role (Edge Functions) -> skip.
  -- auth.uid() IS NOT NULL when called via PostgREST by user -> verify.
  IF auth.uid() IS NOT NULL THEN

    v_first_id := (p_items->0->>'id')::uuid;

    IF p_table = 'study_plan_tasks' THEN
      -- study_plan_tasks: verify the task belongs to the caller
      IF NOT EXISTS (
        SELECT 1
        FROM study_plan_tasks spt
        JOIN study_plans sp ON sp.id = spt.study_plan_id
        WHERE spt.id = v_first_id
          AND sp.student_id = auth.uid()
      ) THEN
        RAISE EXCEPTION 'Access denied: study_plan_task does not belong to caller'
          USING ERRCODE = 'insufficient_privilege';
      END IF;

    ELSE
      -- Content tables: resolve institution, then check CONTENT_WRITE role
      v_institution_id := resolve_parent_institution(p_table, v_first_id);

      IF v_institution_id IS NULL THEN
        RAISE EXCEPTION 'Access denied: could not resolve institution for %.%', p_table, v_first_id
          USING ERRCODE = 'insufficient_privilege';
      END IF;

      SELECT m.role INTO v_caller_role
      FROM memberships m
      WHERE m.user_id = auth.uid()
        AND m.institution_id = v_institution_id
        AND m.is_active = true;

      IF v_caller_role IS NULL OR v_caller_role NOT IN ('owner', 'admin', 'professor') THEN
        RAISE EXCEPTION 'Access denied: caller lacks CONTENT_WRITE role in institution %', v_institution_id
          USING ERRCODE = 'insufficient_privilege';
      END IF;

    END IF;

  END IF;

  -- ── Determine if table has updated_at column ──
  v_has_updated_at := p_table IN (
    'courses', 'semesters', 'sections', 'topics', 'summaries',
    'videos', 'models_3d', 'model_3d_pins'
  );

  -- ── Single UPDATE with join on jsonb_array_elements ──
  IF v_has_updated_at THEN
    EXECUTE format(
      'UPDATE %I t
       SET order_index = (i->>''order_index'')::int,
           updated_at  = now()
       FROM jsonb_array_elements($1) AS i
       WHERE t.id = (i->>''id'')::uuid',
      p_table
    ) USING p_items;
  ELSE
    EXECUTE format(
      'UPDATE %I t
       SET order_index = (i->>''order_index'')::int
       FROM jsonb_array_elements($1) AS i
       WHERE t.id = (i->>''id'')::uuid',
      p_table
    ) USING p_items;
  END IF;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object('reordered', v_count);
END;
$$;

COMMENT ON FUNCTION bulk_reorder IS
  'Bulk-update order_index for any orderable table. Security hardened v2 (auth check + search_path + REVOKE).';


-- ════════════════════════════════════════════════════════════════════
-- 3. Layer 1 -- REVOKE / GRANT permissions
--    Primary defense: only service_role can execute this function.
-- ════════════════════════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION bulk_reorder(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION bulk_reorder(text, jsonb) TO service_role;


-- ════════════════════════════════════════════════════════════════════
-- 4. Verification
-- ════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_search_path TEXT;
  v_sec_type BOOLEAN;
  v_anon_revoked BOOLEAN;
  v_auth_revoked BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '  BULK_REORDER SECURITY HARDENING VERIFICATION';
  RAISE NOTICE '  =============================================';

  -- Check SECURITY DEFINER
  SELECT p.prosecdef INTO v_sec_type
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.proname = 'bulk_reorder' AND n.nspname = 'public';

  RAISE NOTICE '  SECURITY DEFINER: % (expect true)', v_sec_type;

  -- Check search_path
  SELECT array_to_string(p.proconfig, ', ') INTO v_search_path
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.proname = 'bulk_reorder' AND n.nspname = 'public';

  RAISE NOTICE '  search_path:      % (expect search_path=public, pg_temp)', COALESCE(v_search_path, 'NOT SET');

  -- Check anon cannot execute
  SELECT NOT has_function_privilege('anon', 'bulk_reorder(text,jsonb)', 'EXECUTE')
  INTO v_anon_revoked;

  RAISE NOTICE '  Revoked from anon:          % (expect true)', v_anon_revoked;

  -- Check authenticated cannot execute
  SELECT NOT has_function_privilege('authenticated', 'bulk_reorder(text,jsonb)', 'EXECUTE')
  INTO v_auth_revoked;

  RAISE NOTICE '  Revoked from authenticated: % (expect true)', v_auth_revoked;

  -- Final assertion
  IF v_sec_type AND v_search_path LIKE '%search_path=public, pg_temp%'
     AND v_anon_revoked AND v_auth_revoked THEN
    RAISE NOTICE '';
    RAISE NOTICE '  ALL CHECKS PASSED. bulk_reorder is hardened.';
  ELSE
    RAISE WARNING '  SOME CHECKS FAILED — review output above.';
  END IF;

  RAISE NOTICE '';
END;
$$;

-- SOURCE: 20260319_02_security_definer_hardening.sql

-- ============================================================================
-- Migration: Security Definer Hardening (S9)
-- Date: 2026-03-19
-- Purpose: Harden all remaining SECURITY DEFINER functions that lack
--          search_path = public, pg_temp and/or have overly broad
--          EXECUTE grants.
--
-- PART A: SET search_path = public, pg_temp on all 12 unhardened functions
-- PART B: REVOKE EXECUTE from anon/authenticated for service_role-only RPCs
-- PART C: Verification block
--
-- Safety:
--   - ALTER FUNCTION only changes config, does NOT replace function body
--   - REVOKE/GRANT are idempotent
--   - No table or data changes
-- ============================================================================


-- ========================================================================
-- PART A: SET search_path for ALL unhardened SECURITY DEFINER functions
-- ========================================================================
-- Adding pg_temp to search_path prevents temp-object hijacking attacks.
-- Trigger functions already had SET search_path = public; we add pg_temp.
-- Other functions had no search_path set at all.
-- ========================================================================

-- ── Trigger functions (already had search_path = public, adding pg_temp) ──

ALTER FUNCTION on_review_inserted()
  SET search_path = public, pg_temp;

ALTER FUNCTION on_study_session_completed()
  SET search_path = public, pg_temp;

-- ── Functions without any search_path ──

ALTER FUNCTION upsert_video_view(uuid, uuid, uuid, int, int, numeric, boolean, int)
  SET search_path = public, pg_temp;

-- get_course_summary_ids: SKIPPED — function does not exist in production

ALTER FUNCTION get_student_knowledge_context(uuid, uuid)
  SET search_path = public, pg_temp;

ALTER FUNCTION resolve_parent_institution(text, uuid)
  SET search_path = public, pg_temp;

ALTER FUNCTION search_keywords_by_institution(uuid, text, uuid, uuid, int)
  SET search_path = public, pg_temp;

-- search_scoped: SKIPPED — function does not exist in production
-- trash_scoped: SKIPPED — function does not exist in production

ALTER FUNCTION rag_analytics_summary(uuid, timestamptz, timestamptz)
  SET search_path = public, pg_temp;

ALTER FUNCTION rag_embedding_coverage(uuid)
  SET search_path = public, pg_temp;

ALTER FUNCTION get_ai_report_stats(uuid, timestamptz, timestamptz)
  SET search_path = public, pg_temp;


-- ========================================================================
-- PART B: REVOKE — DEFERRED TO SEPARATE PR
-- ========================================================================
-- Quality gate audit (2026-03-18) found that 5 of 6 functions listed for
-- REVOKE are actually called via user client `db`, NOT adminDb:
--   - upsert_video_view      → mux/tracking.ts uses db
--   - get_course_summary_ids → keyword-search.ts, study-queue/resolvers.ts use db
--   - get_student_knowledge_context → generate.ts, chat.ts, generate-smart.ts use db
--   - rag_analytics_summary  → analytics.ts uses db
--   - rag_embedding_coverage → analytics.ts uses db
--   - get_ai_report_stats    → report-dashboard.ts uses db
--
-- REVOKING these would cause immediate "permission denied" in production.
-- The correct fix requires a TWO-STEP migration:
--   Step 1: Change all TS callers from db.rpc() to getAdminClient().rpc()
--   Step 2: Then REVOKE from authenticated (in a separate PR)
--
-- For now, PART A (search_path hardening) is sufficient to prevent
-- search_path hijacking attacks without breaking functionality.
-- ========================================================================


-- ========================================================================
-- PART C: Verification block
-- ========================================================================

DO $$
DECLARE
  v_fn TEXT;
  v_sp TEXT;
BEGIN
  RAISE NOTICE 'SECURITY DEFINER HARDENING VERIFICATION';
  FOR v_fn IN SELECT unnest(ARRAY[
    'upsert_video_view', 'get_student_knowledge_context',
    'resolve_parent_institution', 'search_keywords_by_institution',
    'rag_analytics_summary', 'rag_embedding_coverage', 'get_ai_report_stats',
    'on_review_inserted', 'on_study_session_completed'
  ]) LOOP
    SELECT array_to_string(p.proconfig, ', ') INTO v_sp
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = v_fn AND n.nspname = 'public' LIMIT 1;
    RAISE NOTICE '  %: config = %', v_fn, COALESCE(v_sp, 'NOT SET');
  END LOOP;
END; $$;

-- SOURCE: 20260319_03_rls_helper_function.sql

-- ============================================================================
-- Migration: RLS helper function — auth.user_institution_ids()
-- Part of D3 RLS rollout (S11)
-- Date: 2026-03-19
--
-- Purpose: Returns an array of institution UUIDs where the calling user
-- has an active membership. Used by RLS policies to scope row access
-- without per-query RPCs.
--
-- SECURITY DEFINER: Runs as the function owner (bypasses RLS on
-- memberships) so the lookup always succeeds. search_path is locked
-- to prevent search_path injection attacks.
-- ============================================================================

CREATE OR REPLACE FUNCTION auth.user_institution_ids()
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    array_agg(institution_id),
    ARRAY[]::UUID[]
  )
  FROM memberships
  WHERE user_id = auth.uid()
    AND is_active = true;
$$;

COMMENT ON FUNCTION auth.user_institution_ids IS
  'S11/D3: Returns institution UUIDs where the calling user has an active membership. Used by RLS policies. SECURITY DEFINER, search_path locked.';

-- Grant to authenticated role so RLS policies can call it
GRANT EXECUTE ON FUNCTION auth.user_institution_ids() TO authenticated;

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'auth.user_institution_ids() created successfully';
END; $$;

-- SOURCE: 20260319_04_rls_content_tables.sql

-- ============================================================================
-- Migration: RLS policies for content hierarchy tables
-- Part of D3 RLS rollout (S11)
-- Date: 2026-03-19
--
-- Tables covered (9):
--   courses, semesters, sections, topics, summaries,
--   chunks, keywords, subtopics, keyword_connections
--
-- Tables SKIPPED (already have RLS):
--   summary_blocks (20260228_02), video_views (20260224_02)
--
-- Policy pattern:
--   members_select  — SELECT for institution members
--   members_insert  — INSERT for institution members
--   members_update  — UPDATE for institution members
--   members_delete  — DELETE for institution members
--   service_role_all — ALL for service_role (Edge Functions via getAdminClient)
--
-- The crud-factory uses the user's Supabase client (db) for all CRUD,
-- so authenticated users need read AND write policies.
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. COURSES — has institution_id directly
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_members_select" ON courses
  FOR SELECT USING (institution_id = ANY(auth.user_institution_ids()));

CREATE POLICY "courses_members_insert" ON courses
  FOR INSERT WITH CHECK (institution_id = ANY(auth.user_institution_ids()));

CREATE POLICY "courses_members_update" ON courses
  FOR UPDATE USING (institution_id = ANY(auth.user_institution_ids()));

CREATE POLICY "courses_members_delete" ON courses
  FOR DELETE USING (institution_id = ANY(auth.user_institution_ids()));

CREATE POLICY "courses_service_role_all" ON courses
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. SEMESTERS — FK: course_id -> courses.institution_id
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "semesters_members_select" ON semesters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = semesters.course_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "semesters_members_insert" ON semesters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = semesters.course_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "semesters_members_update" ON semesters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = semesters.course_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "semesters_members_delete" ON semesters
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = semesters.course_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "semesters_service_role_all" ON semesters
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. SECTIONS — FK: semester_id -> semesters -> courses.institution_id
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sections_members_select" ON sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM semesters s
      JOIN courses c ON c.id = s.course_id
      WHERE s.id = sections.semester_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "sections_members_insert" ON sections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM semesters s
      JOIN courses c ON c.id = s.course_id
      WHERE s.id = sections.semester_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "sections_members_update" ON sections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM semesters s
      JOIN courses c ON c.id = s.course_id
      WHERE s.id = sections.semester_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "sections_members_delete" ON sections
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM semesters s
      JOIN courses c ON c.id = s.course_id
      WHERE s.id = sections.semester_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "sections_service_role_all" ON sections
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. TOPICS — FK: section_id -> sections -> semesters -> courses
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "topics_members_select" ON topics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sections sec
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE sec.id = topics.section_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "topics_members_insert" ON topics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sections sec
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE sec.id = topics.section_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "topics_members_update" ON topics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sections sec
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE sec.id = topics.section_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "topics_members_delete" ON topics
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM sections sec
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE sec.id = topics.section_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "topics_service_role_all" ON topics
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 5. SUMMARIES — has denormalized institution_id (20260304_06)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "summaries_members_select" ON summaries
  FOR SELECT USING (institution_id = ANY(auth.user_institution_ids()));

CREATE POLICY "summaries_members_insert" ON summaries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM topics t
      JOIN sections sec ON sec.id = t.section_id
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE t.id = summaries.topic_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "summaries_members_update" ON summaries
  FOR UPDATE USING (institution_id = ANY(auth.user_institution_ids()));

CREATE POLICY "summaries_members_delete" ON summaries
  FOR DELETE USING (institution_id = ANY(auth.user_institution_ids()));

CREATE POLICY "summaries_service_role_all" ON summaries
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 6. CHUNKS — FK: summary_id -> summaries (has institution_id)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chunks_members_select" ON chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = chunks.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "chunks_members_insert" ON chunks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = chunks.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "chunks_members_update" ON chunks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = chunks.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "chunks_members_delete" ON chunks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = chunks.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "chunks_service_role_all" ON chunks
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 7. KEYWORDS — FK: summary_id -> summaries (has institution_id)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "keywords_members_select" ON keywords
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = keywords.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "keywords_members_insert" ON keywords
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = keywords.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "keywords_members_update" ON keywords
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = keywords.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "keywords_members_delete" ON keywords
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = keywords.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "keywords_service_role_all" ON keywords
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 8. SUBTOPICS — FK: keyword_id -> keywords -> summaries
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE subtopics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subtopics_members_select" ON subtopics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN summaries s ON s.id = k.summary_id
      WHERE k.id = subtopics.keyword_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "subtopics_members_insert" ON subtopics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN summaries s ON s.id = k.summary_id
      WHERE k.id = subtopics.keyword_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "subtopics_members_update" ON subtopics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN summaries s ON s.id = k.summary_id
      WHERE k.id = subtopics.keyword_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "subtopics_members_delete" ON subtopics
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN summaries s ON s.id = k.summary_id
      WHERE k.id = subtopics.keyword_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "subtopics_service_role_all" ON subtopics
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 9. KEYWORD_CONNECTIONS — FK: keyword_a_id -> keywords -> summaries
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE keyword_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kw_conn_members_select" ON keyword_connections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN summaries s ON s.id = k.summary_id
      WHERE k.id = keyword_connections.keyword_a_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "kw_conn_members_insert" ON keyword_connections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN summaries s ON s.id = k.summary_id
      WHERE k.id = keyword_connections.keyword_a_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "kw_conn_members_update" ON keyword_connections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN summaries s ON s.id = k.summary_id
      WHERE k.id = keyword_connections.keyword_a_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "kw_conn_members_delete" ON keyword_connections
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN summaries s ON s.id = k.summary_id
      WHERE k.id = keyword_connections.keyword_a_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "kw_conn_service_role_all" ON keyword_connections
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 10. FLASHCARDS — has institution_id (denormalized via summary trigger chain)
--     Actually flashcards FK to summary_id -> summaries (which has institution_id)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flashcards_members_select" ON flashcards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = flashcards.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "flashcards_members_insert" ON flashcards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = flashcards.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "flashcards_members_update" ON flashcards
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = flashcards.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "flashcards_members_delete" ON flashcards
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = flashcards.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "flashcards_service_role_all" ON flashcards
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 11. QUIZZES — FK: summary_id -> summaries
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quizzes_members_select" ON quizzes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = quizzes.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "quizzes_members_insert" ON quizzes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = quizzes.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "quizzes_members_update" ON quizzes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = quizzes.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "quizzes_members_delete" ON quizzes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = quizzes.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "quizzes_service_role_all" ON quizzes
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 12. QUIZ_QUESTIONS — FK: summary_id -> summaries
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_q_members_select" ON quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = quiz_questions.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "quiz_q_members_insert" ON quiz_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = quiz_questions.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "quiz_q_members_update" ON quiz_questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = quiz_questions.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "quiz_q_members_delete" ON quiz_questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = quiz_questions.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "quiz_q_service_role_all" ON quiz_questions
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 13. VIDEOS — FK: summary_id -> summaries
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "videos_members_select" ON videos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = videos.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "videos_members_insert" ON videos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = videos.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "videos_members_update" ON videos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = videos.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "videos_members_delete" ON videos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = videos.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "videos_service_role_all" ON videos
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 14. MODELS_3D — FK: topic_id -> topics -> sections -> semesters -> courses
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE models_3d ENABLE ROW LEVEL SECURITY;

CREATE POLICY "models_3d_members_select" ON models_3d
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM topics t
      JOIN sections sec ON sec.id = t.section_id
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE t.id = models_3d.topic_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "models_3d_members_insert" ON models_3d
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM topics t
      JOIN sections sec ON sec.id = t.section_id
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE t.id = models_3d.topic_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "models_3d_members_update" ON models_3d
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM topics t
      JOIN sections sec ON sec.id = t.section_id
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE t.id = models_3d.topic_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "models_3d_members_delete" ON models_3d
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM topics t
      JOIN sections sec ON sec.id = t.section_id
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE t.id = models_3d.topic_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "models_3d_service_role_all" ON models_3d
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 15. MODEL_3D_PINS — FK: model_id -> models_3d -> topics -> ... -> courses
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE model_3d_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "model_pins_members_select" ON model_3d_pins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM models_3d m
      JOIN topics t ON t.id = m.topic_id
      JOIN sections sec ON sec.id = t.section_id
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE m.id = model_3d_pins.model_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "model_pins_members_insert" ON model_3d_pins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM models_3d m
      JOIN topics t ON t.id = m.topic_id
      JOIN sections sec ON sec.id = t.section_id
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE m.id = model_3d_pins.model_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "model_pins_members_update" ON model_3d_pins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM models_3d m
      JOIN topics t ON t.id = m.topic_id
      JOIN sections sec ON sec.id = t.section_id
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE m.id = model_3d_pins.model_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "model_pins_members_delete" ON model_3d_pins
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM models_3d m
      JOIN topics t ON t.id = m.topic_id
      JOIN sections sec ON sec.id = t.section_id
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE m.id = model_3d_pins.model_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "model_pins_service_role_all" ON model_3d_pins
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 16. MODEL_LAYERS — FK: model_id -> models_3d -> topics -> ... -> courses
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE model_layers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "model_layers_members_select" ON model_layers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM models_3d m
      JOIN topics t ON t.id = m.topic_id
      JOIN sections sec ON sec.id = t.section_id
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE m.id = model_layers.model_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "model_layers_members_insert" ON model_layers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM models_3d m
      JOIN topics t ON t.id = m.topic_id
      JOIN sections sec ON sec.id = t.section_id
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE m.id = model_layers.model_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "model_layers_members_update" ON model_layers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM models_3d m
      JOIN topics t ON t.id = m.topic_id
      JOIN sections sec ON sec.id = t.section_id
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE m.id = model_layers.model_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "model_layers_members_delete" ON model_layers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM models_3d m
      JOIN topics t ON t.id = m.topic_id
      JOIN sections sec ON sec.id = t.section_id
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE m.id = model_layers.model_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "model_layers_service_role_all" ON model_layers
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 17. MODEL_PARTS — FK: model_id -> models_3d -> topics -> ... -> courses
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE model_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "model_parts_members_select" ON model_parts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM models_3d m
      JOIN topics t ON t.id = m.topic_id
      JOIN sections sec ON sec.id = t.section_id
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE m.id = model_parts.model_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "model_parts_members_insert" ON model_parts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM models_3d m
      JOIN topics t ON t.id = m.topic_id
      JOIN sections sec ON sec.id = t.section_id
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE m.id = model_parts.model_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "model_parts_members_update" ON model_parts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM models_3d m
      JOIN topics t ON t.id = m.topic_id
      JOIN sections sec ON sec.id = t.section_id
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE m.id = model_parts.model_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "model_parts_members_delete" ON model_parts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM models_3d m
      JOIN topics t ON t.id = m.topic_id
      JOIN sections sec ON sec.id = t.section_id
      JOIN semesters s ON s.id = sec.semester_id
      JOIN courses c ON c.id = s.course_id
      WHERE m.id = model_parts.model_id
        AND c.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "model_parts_service_role_all" ON model_parts
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- Verification
-- ══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_tables TEXT[] := ARRAY[
    'courses', 'semesters', 'sections', 'topics', 'summaries',
    'chunks', 'keywords', 'subtopics', 'keyword_connections',
    'flashcards', 'quizzes', 'quiz_questions', 'videos',
    'models_3d', 'model_3d_pins', 'model_layers', 'model_parts'
  ];
  v_table TEXT;
  v_rls BOOLEAN;
  v_policy_count INT;
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    SELECT relrowsecurity INTO v_rls
    FROM pg_class WHERE relname = v_table AND relnamespace = 'public'::regnamespace;

    SELECT count(*) INTO v_policy_count
    FROM pg_policies WHERE tablename = v_table;

    IF v_rls THEN
      RAISE NOTICE '[OK] % — RLS enabled, % policies', v_table, v_policy_count;
    ELSE
      RAISE WARNING '[FAIL] % — RLS NOT enabled!', v_table;
    END IF;
  END LOOP;
END; $$;

-- SOURCE: 20260319_05_rls_user_tables.sql

-- ============================================================================
-- Migration: RLS policies for user-scoped and gamification tables
-- Part of D3 RLS rollout (S11)
-- Date: 2026-03-19
--
-- User-scoped tables (use db/user client, need full CRUD policies):
--   reviews, quiz_attempts, study_sessions, study_plans,
--   study_plan_tasks, fsrs_states, bkt_states,
--   kw_student_notes, text_annotations, video_notes,
--   model_3d_notes, daily_activities
--
-- Gamification tables (writes via getAdminClient, reads via db):
--   student_xp, xp_transactions, badge_definitions, student_badges
--
-- Policy patterns:
--   user-scoped: own_select/own_insert/own_update/own_delete + service_role_all
--   gamification: own_select (read own data) + service_role_all (writes via admin)
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. REVIEWS — scoped via study_sessions.student_id (reviews has no user_id column)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_own_select" ON reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM study_sessions ss
      WHERE ss.id = reviews.session_id AND ss.student_id = auth.uid()
    )
  );

CREATE POLICY "reviews_own_insert" ON reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM study_sessions ss
      WHERE ss.id = reviews.session_id AND ss.student_id = auth.uid()
    )
  );

CREATE POLICY "reviews_own_update" ON reviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM study_sessions ss
      WHERE ss.id = reviews.session_id AND ss.student_id = auth.uid()
    )
  );

CREATE POLICY "reviews_own_delete" ON reviews
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM study_sessions ss
      WHERE ss.id = reviews.session_id AND ss.student_id = auth.uid()
    )
  );

CREATE POLICY "reviews_service_role_all" ON reviews
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. QUIZ_ATTEMPTS — student_id scoped
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_att_own_select" ON quiz_attempts
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "quiz_att_own_insert" ON quiz_attempts
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "quiz_att_own_update" ON quiz_attempts
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "quiz_att_own_delete" ON quiz_attempts
  FOR DELETE USING (student_id = auth.uid());

CREATE POLICY "quiz_att_service_role_all" ON quiz_attempts
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. STUDY_SESSIONS — student_id scoped (crud-factory scopeToUser)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "study_sess_own_select" ON study_sessions
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "study_sess_own_insert" ON study_sessions
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "study_sess_own_update" ON study_sessions
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "study_sess_own_delete" ON study_sessions
  FOR DELETE USING (student_id = auth.uid());

CREATE POLICY "study_sess_service_role_all" ON study_sessions
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. STUDY_PLANS — student_id scoped (crud-factory scopeToUser)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "study_plans_own_select" ON study_plans
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "study_plans_own_insert" ON study_plans
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "study_plans_own_update" ON study_plans
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "study_plans_own_delete" ON study_plans
  FOR DELETE USING (student_id = auth.uid());

CREATE POLICY "study_plans_service_role_all" ON study_plans
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 5. STUDY_PLAN_TASKS — FK via study_plan_id -> study_plans (no direct user_id)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE study_plan_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spt_own_select" ON study_plan_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM study_plans sp
      WHERE sp.id = study_plan_tasks.study_plan_id
        AND sp.student_id = auth.uid()
    )
  );

CREATE POLICY "spt_own_insert" ON study_plan_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM study_plans sp
      WHERE sp.id = study_plan_tasks.study_plan_id
        AND sp.student_id = auth.uid()
    )
  );

CREATE POLICY "spt_own_update" ON study_plan_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM study_plans sp
      WHERE sp.id = study_plan_tasks.study_plan_id
        AND sp.student_id = auth.uid()
    )
  );

CREATE POLICY "spt_own_delete" ON study_plan_tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM study_plans sp
      WHERE sp.id = study_plan_tasks.study_plan_id
        AND sp.student_id = auth.uid()
    )
  );

CREATE POLICY "spt_service_role_all" ON study_plan_tasks
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 6. FSRS_STATES — student_id scoped (user client in batch-review, spaced-rep)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE fsrs_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fsrs_own_select" ON fsrs_states
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "fsrs_own_insert" ON fsrs_states
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "fsrs_own_update" ON fsrs_states
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "fsrs_own_delete" ON fsrs_states
  FOR DELETE USING (student_id = auth.uid());

CREATE POLICY "fsrs_service_role_all" ON fsrs_states
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 7. BKT_STATES — student_id scoped (user client in batch-review, spaced-rep)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE bkt_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bkt_own_select" ON bkt_states
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "bkt_own_insert" ON bkt_states
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "bkt_own_update" ON bkt_states
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "bkt_own_delete" ON bkt_states
  FOR DELETE USING (student_id = auth.uid());

CREATE POLICY "bkt_service_role_all" ON bkt_states
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 8. KW_STUDENT_NOTES — student_id scoped (crud-factory scopeToUser)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE kw_student_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kw_sn_own_select" ON kw_student_notes
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "kw_sn_own_insert" ON kw_student_notes
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "kw_sn_own_update" ON kw_student_notes
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "kw_sn_own_delete" ON kw_student_notes
  FOR DELETE USING (student_id = auth.uid());

CREATE POLICY "kw_sn_service_role_all" ON kw_student_notes
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 9. TEXT_ANNOTATIONS — student_id scoped (crud-factory scopeToUser)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE text_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "txt_ann_own_select" ON text_annotations
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "txt_ann_own_insert" ON text_annotations
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "txt_ann_own_update" ON text_annotations
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "txt_ann_own_delete" ON text_annotations
  FOR DELETE USING (student_id = auth.uid());

CREATE POLICY "txt_ann_service_role_all" ON text_annotations
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 10. VIDEO_NOTES — student_id scoped (crud-factory scopeToUser)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE video_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vid_notes_own_select" ON video_notes
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "vid_notes_own_insert" ON video_notes
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "vid_notes_own_update" ON video_notes
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "vid_notes_own_delete" ON video_notes
  FOR DELETE USING (student_id = auth.uid());

CREATE POLICY "vid_notes_service_role_all" ON video_notes
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 11. MODEL_3D_NOTES — student_id scoped (crud-factory scopeToUser)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE model_3d_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "model_notes_own_select" ON model_3d_notes
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "model_notes_own_insert" ON model_3d_notes
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "model_notes_own_update" ON model_3d_notes
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "model_notes_own_delete" ON model_3d_notes
  FOR DELETE USING (student_id = auth.uid());

CREATE POLICY "model_notes_service_role_all" ON model_3d_notes
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 12. DAILY_ACTIVITIES — student_id scoped (user client reads in progress.ts)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_act_own_select" ON daily_activities
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "daily_act_own_insert" ON daily_activities
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "daily_act_own_update" ON daily_activities
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "daily_act_own_delete" ON daily_activities
  FOR DELETE USING (student_id = auth.uid());

CREATE POLICY "daily_act_service_role_all" ON daily_activities
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- GAMIFICATION TABLES
-- Writes go through getAdminClient() (service_role).
-- Reads often use user client (db) in badges.ts, goals.ts, streak.ts.
-- ══════════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════════
-- 13. STUDENT_XP — student_id scoped (reads via db, writes via adminDb)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE student_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_xp_own_select" ON student_xp
  FOR SELECT USING (student_id = auth.uid());

-- Leaderboard: institution members can see each other's XP
CREATE POLICY "student_xp_institution_select" ON student_xp
  FOR SELECT USING (institution_id = ANY(auth.user_institution_ids()));

CREATE POLICY "student_xp_service_role_all" ON student_xp
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 14. XP_TRANSACTIONS — student_id scoped (INSERT-ONLY via adminDb)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "xp_tx_own_select" ON xp_transactions
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "xp_tx_service_role_all" ON xp_transactions
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 15. BADGE_DEFINITIONS — global read (all authenticated users), admin write
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badge_def_authenticated_select" ON badge_definitions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "badge_def_service_role_all" ON badge_definitions
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 16. BADGE_AWARDS — student_id scoped (writes via adminDb only)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_badges_own_select" ON student_badges
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "student_badges_service_role_all" ON student_badges
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- Verification
-- ══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_tables TEXT[] := ARRAY[
    'reviews', 'quiz_attempts', 'study_sessions', 'study_plans',
    'study_plan_tasks', 'fsrs_states', 'bkt_states',
    'kw_student_notes', 'text_annotations', 'video_notes',
    'model_3d_notes', 'daily_activities',
    'student_xp', 'xp_transactions', 'badge_definitions', 'student_badges'
  ];
  v_table TEXT;
  v_rls BOOLEAN;
  v_policy_count INT;
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    SELECT relrowsecurity INTO v_rls
    FROM pg_class WHERE relname = v_table AND relnamespace = 'public'::regnamespace;

    SELECT count(*) INTO v_policy_count
    FROM pg_policies WHERE tablename = v_table;

    IF v_rls IS NULL THEN
      RAISE WARNING '[SKIP] % — table does not exist (may be in base schema)', v_table;
    ELSIF v_rls THEN
      RAISE NOTICE '[OK] % — RLS enabled, % policies', v_table, v_policy_count;
    ELSE
      RAISE WARNING '[FAIL] % — RLS NOT enabled!', v_table;
    END IF;
  END LOOP;
END; $$;

-- SOURCE: 20260319_06_rls_admin_tables.sql

-- ============================================================================
-- Migration: RLS policies for admin-only, messaging, and core tables
-- Part of D3 RLS rollout (S11)
-- Date: 2026-03-19
--
-- Admin/service-only tables (accessed via getAdminClient, no JWT context):
--   telegram_sessions, telegram_message_log,
--   whatsapp_sessions, whatsapp_message_log, whatsapp_jobs,
--   processed_webhook_events, ai_content_reports
--
-- Core tables with special policies:
--   institutions — members can read, service_role writes
--   memberships  — users can read own + institution-scoped, service_role writes
--   kw_prof_notes — institution-scoped content (uses db/user client)
--
-- Plan tables (CRUD via factory with user client):
--   platform_plans, institution_plans,
--   plan_access_rules, institution_subscriptions
--
-- Tables SKIPPED (already have RLS with policies):
--   whatsapp_links (20260314_01), telegram_links (20260316_01),
--   messaging_admin_settings (20260316_01),
--   ai_reading_config (20260303_01), algorithm_config (20260304_01),
--   rag_query_log (20260305_04), summary_blocks (20260228_02),
--   video_views (20260224_02)
-- ============================================================================


-- ══════════════════════════════════════════════════════════════════════════════
-- ADMIN/SERVICE-ONLY TABLES
-- These tables are only accessed via getAdminClient() (service_role).
-- RLS enabled but only service_role has access.
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. TELEGRAM_SESSIONS
ALTER TABLE telegram_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tg_sessions_service_role_only" ON telegram_sessions
  FOR ALL USING (auth.role() = 'service_role');


-- 2. TELEGRAM_MESSAGE_LOG
ALTER TABLE telegram_message_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tg_log_service_role_only" ON telegram_message_log
  FOR ALL USING (auth.role() = 'service_role');


-- 3. WHATSAPP_SESSIONS
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa_sessions_service_role_only" ON whatsapp_sessions
  FOR ALL USING (auth.role() = 'service_role');


-- 4. WHATSAPP_MESSAGE_LOG
ALTER TABLE whatsapp_message_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa_log_service_role_only" ON whatsapp_message_log
  FOR ALL USING (auth.role() = 'service_role');


-- 5. WHATSAPP_JOBS (fallback table; may be pgmq-managed instead)
-- Only create RLS if the table exists as a regular table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'whatsapp_jobs'
  ) THEN
    EXECUTE 'ALTER TABLE whatsapp_jobs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "wa_jobs_service_role_only" ON whatsapp_jobs FOR ALL USING (auth.role() = ''service_role'')';
    RAISE NOTICE '[OK] whatsapp_jobs — RLS enabled';
  ELSE
    RAISE NOTICE '[SKIP] whatsapp_jobs — table does not exist (using pgmq)';
  END IF;
END; $$;


-- 6. PROCESSED_WEBHOOK_EVENTS
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pwe_service_role_only" ON processed_webhook_events
  FOR ALL USING (auth.role() = 'service_role');


-- 7. AI_CONTENT_REPORTS — institution-scoped, accessed via Edge Functions
-- Note: the ai-report endpoints use authenticate() + requireInstitutionRole(),
-- but writes/reads go through the user client (db). We need both institution
-- member read access AND service_role.
ALTER TABLE ai_content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_reports_own_select" ON ai_content_reports
  FOR SELECT USING (reported_by = auth.uid());

CREATE POLICY "ai_reports_institution_select" ON ai_content_reports
  FOR SELECT USING (institution_id = ANY(auth.user_institution_ids()));

CREATE POLICY "ai_reports_own_insert" ON ai_content_reports
  FOR INSERT WITH CHECK (
    reported_by = auth.uid()
    AND institution_id = ANY(auth.user_institution_ids())
  );

CREATE POLICY "ai_reports_institution_update" ON ai_content_reports
  FOR UPDATE USING (institution_id = ANY(auth.user_institution_ids()));

CREATE POLICY "ai_reports_service_role_all" ON ai_content_reports
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- CORE TABLES: INSTITUTIONS & MEMBERSHIPS
-- ══════════════════════════════════════════════════════════════════════════════

-- 8. INSTITUTIONS — members can read their own institutions
-- POST uses getAdminClient(), GET/PUT/DELETE use db (user client)
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inst_members_select" ON institutions
  FOR SELECT USING (id = ANY(auth.user_institution_ids()));

-- PUT uses db (user client) in institutions.ts
CREATE POLICY "inst_members_update" ON institutions
  FOR UPDATE USING (id = ANY(auth.user_institution_ids()));

CREATE POLICY "inst_service_role_all" ON institutions
  FOR ALL USING (auth.role() = 'service_role');


-- 9. MEMBERSHIPS — users can read own + institution members can list
-- GET /memberships uses db (user client). POST uses adminDb.
-- requireInstitutionRole() itself reads memberships via db, so the
-- policy must allow reading own membership AND institution-scoped reads.
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Users can always see their own memberships (needed for GET /institutions)
CREATE POLICY "memberships_own_select" ON memberships
  FOR SELECT USING (user_id = auth.uid());

-- Institution admins can see all memberships in their institution
-- (needed for GET /memberships?institution_id=xxx)
CREATE POLICY "memberships_institution_select" ON memberships
  FOR SELECT USING (institution_id = ANY(auth.user_institution_ids()));

-- PUT /memberships/:id uses db (user client) — admin/owner can update members
-- in their own institution. requireInstitutionRole() already enforces hierarchy.
CREATE POLICY "memberships_institution_update" ON memberships
  FOR UPDATE USING (institution_id = ANY(auth.user_institution_ids()));

-- DELETE /memberships/:id is a soft-delete (UPDATE is_active=false) via db.
-- Same scoping as UPDATE.
CREATE POLICY "memberships_institution_delete" ON memberships
  FOR DELETE USING (institution_id = ANY(auth.user_institution_ids()));

-- POST uses getAdminClient() (service_role)
CREATE POLICY "memberships_service_role_all" ON memberships
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- CONTENT: KW_PROF_NOTES
-- Uses db (user client) for all CRUD in prof-notes.ts
-- ══════════════════════════════════════════════════════════════════════════════

-- 10. KW_PROF_NOTES — FK: keyword_id -> keywords -> summaries
ALTER TABLE kw_prof_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prof_notes_members_select" ON kw_prof_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN summaries s ON s.id = k.summary_id
      WHERE k.id = kw_prof_notes.keyword_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "prof_notes_members_insert" ON kw_prof_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN summaries s ON s.id = k.summary_id
      WHERE k.id = kw_prof_notes.keyword_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "prof_notes_members_update" ON kw_prof_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN summaries s ON s.id = k.summary_id
      WHERE k.id = kw_prof_notes.keyword_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "prof_notes_members_delete" ON kw_prof_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN summaries s ON s.id = k.summary_id
      WHERE k.id = kw_prof_notes.keyword_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "prof_notes_service_role_all" ON kw_prof_notes
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- PLAN TABLES (CRUD via factory with user client)
-- ══════════════════════════════════════════════════════════════════════════════

-- 11. PLATFORM_PLANS — global table (no institution_id)
-- Read: all authenticated users (students browse plans)
-- Write: authenticated users (backend enforces owner-only via requireInstitutionRole)
-- Note: This is a global table — RLS cannot enforce institution scoping.
-- The backend's role check is the primary access control for writes.
ALTER TABLE platform_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_plans_authenticated_select" ON platform_plans
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "platform_plans_authenticated_insert" ON platform_plans
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "platform_plans_authenticated_update" ON platform_plans
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "platform_plans_authenticated_delete" ON platform_plans
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "platform_plans_service_role_all" ON platform_plans
  FOR ALL USING (auth.role() = 'service_role');


-- 12. INSTITUTION_PLANS — institution-scoped
ALTER TABLE institution_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inst_plans_members_select" ON institution_plans
  FOR SELECT USING (institution_id = ANY(auth.user_institution_ids()));

CREATE POLICY "inst_plans_members_insert" ON institution_plans
  FOR INSERT WITH CHECK (institution_id = ANY(auth.user_institution_ids()));

CREATE POLICY "inst_plans_members_update" ON institution_plans
  FOR UPDATE USING (institution_id = ANY(auth.user_institution_ids()));

CREATE POLICY "inst_plans_members_delete" ON institution_plans
  FOR DELETE USING (institution_id = ANY(auth.user_institution_ids()));

CREATE POLICY "inst_plans_service_role_all" ON institution_plans
  FOR ALL USING (auth.role() = 'service_role');


-- 13. PLAN_ACCESS_RULES — FK: plan_id -> institution_plans
ALTER TABLE plan_access_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_rules_members_select" ON plan_access_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM institution_plans ip
      WHERE ip.id = plan_access_rules.plan_id
        AND ip.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "plan_rules_members_insert" ON plan_access_rules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM institution_plans ip
      WHERE ip.id = plan_access_rules.plan_id
        AND ip.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "plan_rules_members_update" ON plan_access_rules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM institution_plans ip
      WHERE ip.id = plan_access_rules.plan_id
        AND ip.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "plan_rules_members_delete" ON plan_access_rules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM institution_plans ip
      WHERE ip.id = plan_access_rules.plan_id
        AND ip.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "plan_rules_service_role_all" ON plan_access_rules
  FOR ALL USING (auth.role() = 'service_role');


-- 14. INSTITUTION_SUBSCRIPTIONS — institution-scoped
ALTER TABLE institution_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inst_subs_members_select" ON institution_subscriptions
  FOR SELECT USING (institution_id = ANY(auth.user_institution_ids()));

CREATE POLICY "inst_subs_members_insert" ON institution_subscriptions
  FOR INSERT WITH CHECK (institution_id = ANY(auth.user_institution_ids()));

CREATE POLICY "inst_subs_members_update" ON institution_subscriptions
  FOR UPDATE USING (institution_id = ANY(auth.user_institution_ids()));

CREATE POLICY "inst_subs_members_delete" ON institution_subscriptions
  FOR DELETE USING (institution_id = ANY(auth.user_institution_ids()));

CREATE POLICY "inst_subs_service_role_all" ON institution_subscriptions
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- Verification
-- ══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_tables TEXT[] := ARRAY[
    'telegram_sessions', 'telegram_message_log',
    'whatsapp_sessions', 'whatsapp_message_log',
    'processed_webhook_events', 'ai_content_reports',
    'institutions', 'memberships', 'kw_prof_notes',
    'platform_plans', 'institution_plans',
    'plan_access_rules', 'institution_subscriptions'
  ];
  v_table TEXT;
  v_rls BOOLEAN;
  v_policy_count INT;
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    SELECT relrowsecurity INTO v_rls
    FROM pg_class WHERE relname = v_table AND relnamespace = 'public'::regnamespace;

    SELECT count(*) INTO v_policy_count
    FROM pg_policies WHERE tablename = v_table;

    IF v_rls IS NULL THEN
      RAISE WARNING '[SKIP] % — table does not exist', v_table;
    ELSIF v_rls THEN
      RAISE NOTICE '[OK] % — RLS enabled, % policies', v_table, v_policy_count;
    ELSE
      RAISE WARNING '[FAIL] % — RLS NOT enabled!', v_table;
    END IF;
  END LOOP;
END; $$;

-- SOURCE: 20260319_15_rls_missing_tables.sql

-- ============================================================================
-- Migration: RLS policies for tables missed in 04/05/06
-- Part of D3 RLS rollout (S11) — discovered in final audit
-- Date: 2026-03-19
--
-- Tables:
--   reading_states  — student-scoped (getUserClient)
--   student_stats   — student-scoped reads (getUserClient) + service writes
--   admin_scopes    — institution-scoped via memberships (getUserClient)
--   streak_freezes  — service_role only (getAdminClient)
--   streak_repairs  — service_role only (getAdminClient)
-- ============================================================================


-- ══════════════════════════════════════════════════════════════════════════════
-- 1. READING_STATES — student-scoped
-- Used by: routes/study/progress.ts (GET + UPSERT), routes/mux/helpers.ts
-- Access: getUserClient (db) — filters by student_id
-- Columns: student_id (uuid), summary_id (uuid)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE reading_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reading_states_own_select" ON reading_states
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "reading_states_own_insert" ON reading_states
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "reading_states_own_update" ON reading_states
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "reading_states_own_delete" ON reading_states
  FOR DELETE USING (student_id = auth.uid());

CREATE POLICY "reading_states_service_role_all" ON reading_states
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. STUDENT_STATS — student reads own, service_role writes
-- Used by: routes/study/progress.ts (GET/UPSERT via db)
--          routes/gamification/profile.ts (GET via db)
--          routes/gamification/goals.ts, streak-engine.ts, xp-hooks.ts (via adminDb)
-- Columns: student_id (uuid)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE student_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_stats_own_select" ON student_stats
  FOR SELECT USING (student_id = auth.uid());

-- progress.ts POST /student-stats uses db (user client) for upsert
CREATE POLICY "student_stats_own_insert" ON student_stats
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "student_stats_own_update" ON student_stats
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "student_stats_service_role_all" ON student_stats
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. ADMIN_SCOPES — institution-scoped via membership FK
-- Used by: routes/members/admin-scopes.ts (GET/POST/DELETE via db)
-- Columns: membership_id (uuid) -> memberships.id
-- All 3 endpoints verify ["owner"] role in requireInstitutionRole()
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE admin_scopes ENABLE ROW LEVEL SECURITY;

-- Owner can read scopes for memberships in their institution
CREATE POLICY "admin_scopes_institution_select" ON admin_scopes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.id = admin_scopes.membership_id
        AND m.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "admin_scopes_institution_insert" ON admin_scopes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.id = admin_scopes.membership_id
        AND m.institution_id = ANY(auth.user_institution_ids())
    )
  );

-- admin-scopes.ts uses hard DELETE (not soft-delete)
CREATE POLICY "admin_scopes_institution_delete" ON admin_scopes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.id = admin_scopes.membership_id
        AND m.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "admin_scopes_service_role_all" ON admin_scopes
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. STREAK_FREEZES — service_role only
-- Used by: routes/gamification/streak.ts (via getAdminClient)
--          lib/streak-engine.ts (via getAdminClient)
-- Columns: student_id, institution_id
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE streak_freezes ENABLE ROW LEVEL SECURITY;

-- Students can read their own freezes (streak UI shows freeze inventory)
CREATE POLICY "streak_freezes_own_select" ON streak_freezes
  FOR SELECT USING (student_id = auth.uid());

-- All writes via getAdminClient (service_role)
CREATE POLICY "streak_freezes_service_role_all" ON streak_freezes
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 5. STREAK_REPAIRS — service_role only
-- Used by: routes/gamification/streak.ts (via getAdminClient)
-- Columns: student_id, institution_id
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE streak_repairs ENABLE ROW LEVEL SECURITY;

-- Students can read their own repairs (streak history)
CREATE POLICY "streak_repairs_own_select" ON streak_repairs
  FOR SELECT USING (student_id = auth.uid());

-- All writes via getAdminClient (service_role)
CREATE POLICY "streak_repairs_service_role_all" ON streak_repairs
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 6. AI_GENERATIONS — institution-scoped
-- Used by: routes/plans/ai-generations.ts (GET + POST via db)
--          routes/plans/access.ts (GET via db)
-- Columns: institution_id, requested_by
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_gen_institution_select" ON ai_generations
  FOR SELECT USING (institution_id = ANY(auth.user_institution_ids()));

CREATE POLICY "ai_gen_institution_insert" ON ai_generations
  FOR INSERT WITH CHECK (
    requested_by = auth.uid()
    AND institution_id = ANY(auth.user_institution_ids())
  );

CREATE POLICY "ai_gen_service_role_all" ON ai_generations
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 7. SUMMARY_DIAGNOSTICS — institution-scoped via summary FK
-- Used by: routes/plans/diagnostics.ts (GET + POST via db)
-- Columns: summary_id (FK -> summaries), requested_by
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE summary_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diag_institution_select" ON summary_diagnostics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = summary_diagnostics.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "diag_institution_insert" ON summary_diagnostics
  FOR INSERT WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM summaries s
      WHERE s.id = summary_diagnostics.summary_id
        AND s.institution_id = ANY(auth.user_institution_ids())
    )
  );

CREATE POLICY "diag_service_role_all" ON summary_diagnostics
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- 8. PROFILES — service_role only
-- Used by: routes/telegram/handler.ts, routes/whatsapp/handler.ts (via adminDb)
-- Note: Supabase Auth manages profiles. No user-client access from our backend.
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles_own_select" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- All other access via service_role (Telegram/WhatsApp handlers)
CREATE POLICY "profiles_service_role_all" ON profiles
  FOR ALL USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════════════════════
-- Verification
-- ══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_tables TEXT[] := ARRAY[
    'reading_states', 'student_stats', 'admin_scopes',
    'streak_freezes', 'streak_repairs',
    'ai_generations', 'summary_diagnostics', 'profiles'
  ];
  v_table TEXT;
  v_rls BOOLEAN;
  v_policy_count INT;
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    SELECT relrowsecurity INTO v_rls
    FROM pg_class WHERE relname = v_table AND relnamespace = 'public'::regnamespace;

    SELECT count(*) INTO v_policy_count
    FROM pg_policies WHERE tablename = v_table;

    IF v_rls IS NULL THEN
      RAISE WARNING '[SKIP] % — table does not exist', v_table;
    ELSIF v_rls THEN
      RAISE NOTICE '[OK] % — RLS enabled, % policies', v_table, v_policy_count;
    ELSE
      RAISE WARNING '[FAIL] % — RLS NOT enabled!', v_table;
    END IF;
  END LOOP;
END; $$;

COMMIT;
