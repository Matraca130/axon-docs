-- =============================================================
-- QUERY 3b: RLS Status + Policies
-- =============================================================
-- Run this in Supabase SQL Editor.
-- Paste results back into database/rls-and-indexes.md
-- =============================================================

-- Part 1: RLS enabled/disabled per table
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'kv_store_%'
ORDER BY tablename;

-- Part 2: Existing RLS policies
SELECT
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd,
  LEFT(qual::text, 200) AS qual_preview
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'kv_store_%'
ORDER BY tablename, policyname;
