-- =============================================================
-- CLEANUP: Drop all kv_store_* junk tables
-- =============================================================
-- These tables were auto-created by Figma Make sessions.
-- They contain no useful data and have ~150+ duplicate indexes.
--
-- SAFE TO RUN: No backend routes reference these tables.
-- This will also CASCADE drop all their indexes.
--
-- Tables to drop (25):
--   kv_store_02e53048, kv_store_099e81c5, kv_store_0ada7954,
--   kv_store_1bdefc48, kv_store_1d2105ca, kv_store_1f6cbdd9,
--   kv_store_229c9fbf, kv_store_24a5400a, kv_store_2a9cf36e,
--   kv_store_2eb24f7d, kv_store_2fe0e9f2, kv_store_34549f59,
--   kv_store_3af06e6d, kv_store_428b46eb, kv_store_50277a39,
--   kv_store_6049621b, kv_store_6569f786, kv_store_6e4db60a,
--   kv_store_722e576f, kv_store_7a20cd7d, kv_store_8cb6316a,
--   kv_store_9e5922ee, kv_store_ae4c3d80, kv_store_c8a43c24,
--   kv_store_ed602c94, kv_store_fbad5fe5
-- =============================================================

-- Option A: Dynamic (drops ALL kv_store_* tables)
DO $$
DECLARE
  r RECORD;
  count_dropped INT := 0;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename LIKE 'kv_store_%'
    ORDER BY tablename
  LOOP
    EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    RAISE NOTICE 'Dropped: %', r.tablename;
    count_dropped := count_dropped + 1;
  END LOOP;
  RAISE NOTICE 'Total tables dropped: %', count_dropped;
END $$;

-- Verify cleanup
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'kv_store_%';
-- Should return 0 rows
