# PROMPT: Fase 0 + 1 — Migración SQL + Tests de Validación

> **Uso:** Ejecutar desde Cowork con MCP Supabase, o copiar SQL manualmente en Supabase Dashboard.
> **NO es /loop** — es secuencial y lo ejecutas tú (Petrick) con mi ayuda.
> **Tiempo estimado:** ~30 min total
> **Auditado:** 2026-03-24 — todos los bugs críticos corregidos (ver AUDIT_SQL_FASE0_1.md)

---

## FASE 0 — Status Flow en `summaries` (~5 min)

### Step 0.1: Verificar estado actual

```sql
-- ¿Qué statuses existen hoy?
SELECT DISTINCT status, count(*) FROM summaries GROUP BY status;

-- ¿Existe ya el constraint?
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'summaries'::regclass AND contype = 'c';

-- ¿Existen ya las columnas nuevas?
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'summaries' AND column_name IN ('content_markdown_raw', 'generation_config');
```

### Step 0.2: Agregar columnas + constraint

```sql
-- Agregar columnas para el pipeline de generación IA
ALTER TABLE summaries
  ADD COLUMN IF NOT EXISTS content_markdown_raw text,
  ADD COLUMN IF NOT EXISTS generation_config    jsonb DEFAULT '{}';

-- Actualizar CHECK constraint de status (drop + create)
-- NOTA: El constraint anterior incluía 'rejected'. Se mantiene por compatibilidad.
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'summaries'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE summaries DROP CONSTRAINT %I', cname);
    RAISE NOTICE 'Dropped existing constraint: %', cname;
  END IF;
END $$;

ALTER TABLE summaries ADD CONSTRAINT summaries_status_check
  CHECK (status IN ('draft', 'raw', 'review', 'published', 'archived', 'rejected'));
```

### Step 0.3: TEST — Verificar Fase 0

```sql
-- TEST 1: columnas existen
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'summaries' AND column_name IN ('content_markdown_raw', 'generation_config')
ORDER BY column_name;
-- EXPECTED: 2 rows (content_markdown_raw → text, generation_config → jsonb)

-- TEST 2: constraint existe
SELECT conname FROM pg_constraint
WHERE conrelid = 'summaries'::regclass AND contype = 'c' AND conname = 'summaries_status_check';
-- EXPECTED: 1 row

-- TEST 3: constraint rechaza status inválido
DO $$
DECLARE
  test_id uuid;
BEGIN
  SELECT id INTO test_id FROM summaries LIMIT 1;
  IF test_id IS NULL THEN
    RAISE NOTICE 'TEST 3 SKIPPED — no summaries exist to test constraint';
    RETURN;
  END IF;
  UPDATE summaries SET status = 'INVALID_STATUS' WHERE id = test_id;
  RAISE EXCEPTION 'TEST 3 FAILED — constraint did not reject invalid status';
EXCEPTION WHEN check_violation THEN
  RAISE NOTICE 'TEST 3 PASSED — constraint correctly rejects invalid status';
END $$;

-- TEST 4: constraint acepta TODOS los status válidos (prueba real contra la tabla)
DO $$
DECLARE
  s text;
  valid_statuses text[] := ARRAY['draft', 'raw', 'review', 'published', 'archived', 'rejected'];
  test_id uuid;
  original_status text;
BEGIN
  SELECT id, status INTO test_id, original_status FROM summaries LIMIT 1;
  IF test_id IS NULL THEN
    RAISE NOTICE 'TEST 4 SKIPPED — no summaries exist to test constraint';
    RETURN;
  END IF;

  -- Actualizar la fila con cada status válido (si el constraint rechaza, lanza excepción)
  FOREACH s IN ARRAY valid_statuses LOOP
    UPDATE summaries SET status = s WHERE id = test_id;
  END LOOP;

  -- Restaurar el status original
  UPDATE summaries SET status = original_status WHERE id = test_id;
  RAISE NOTICE 'TEST 4 PASSED — all 6 statuses accepted by constraint, restored to %', original_status;
END $$;
```

**PASS CRITERIA:** 4/4 tests pass (o SKIPPED si no hay datos) -> continuar a Fase 1.

---

## FASE 1 — Migración `summary_blocks` (~15 min)

### Step 1.1: Pre-flight checks

```sql
-- CRITICAL: tabla debe tener 0 filas
SELECT count(*) AS row_count FROM summary_blocks;
-- MUST be 0. If not, STOP and analyze.

-- Verificar schema actual
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'summary_blocks' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar extensión pgvector
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
-- Si no existe: CREATE EXTENSION IF NOT EXISTS vector;

-- Verificar RLS policies existentes (NO borrar — son correctas)
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'summary_blocks';
-- EXPECTED: 3 policies (Professors manage, Students read active, service_role all)

-- Verificar índices existentes
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'summary_blocks';
-- EXPECTED: pkey + idx_summary_blocks_summary_id + idx_summary_blocks_order
```

### Step 1.2: Migración principal

```sql
-- ============================================================
-- Migración: summary_blocks para sistema de bloques educativos
-- Audited: 2026-03-24
-- ============================================================

-- 1. Safety check
DO $$
BEGIN
  IF (SELECT count(*) FROM summary_blocks) > 0 THEN
    RAISE EXCEPTION 'summary_blocks has data — abort migration';
  END IF;
END $$;

-- 2. Cambiar content de TEXT a JSONB (dos pasos separados para evitar type mismatch)
ALTER TABLE summary_blocks
  ALTER COLUMN content TYPE jsonb USING COALESCE(NULLIF(content, ''), '{}')::jsonb;

ALTER TABLE summary_blocks
  ALTER COLUMN content SET DEFAULT '{}'::jsonb;

-- 3. Agregar columnas (metadata + tracking)
ALTER TABLE summary_blocks
  ADD COLUMN IF NOT EXISTS style         jsonb        DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata      jsonb        DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz  DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by    uuid         NULL;

-- 4. Embedding column (vector 1536d — OpenAI text-embedding-3-large)
ALTER TABLE summary_blocks
  ADD COLUMN IF NOT EXISTS embedding vector(1536) NULL;

-- 5. Actualizar default de type ('paragraph' → 'prose' para alinear con block schema)
ALTER TABLE summary_blocks
  ALTER COLUMN type SET DEFAULT 'prose';

-- 6. Índice HNSW para embeddings (el índice compuesto summary_id+order_index YA existe)
-- NOTA: idx_summary_blocks_order (summary_id, order_index) WHERE is_active=true ya existe
--       NO creamos duplicado. Solo agregamos el índice de embeddings.
CREATE INDEX IF NOT EXISTS idx_sb_embedding
  ON summary_blocks USING hnsw (embedding vector_cosine_ops);

-- 7. RLS — YA está habilitado y las policies existentes son CORRECTAS y SEGURAS:
--    - "Professors manage summary_blocks" → created_by = auth.uid()
--    - "Students read active summary_blocks" → is_active = true
--    - "summary_blocks_service_role_all" → service role bypass
-- NO TOCAR. No crear policies nuevas.

-- 8. Trigger updated_at automático (usa clock_timestamp, NO now())
CREATE OR REPLACE FUNCTION update_summary_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_summary_blocks_updated_at ON summary_blocks;
CREATE TRIGGER trg_summary_blocks_updated_at
  BEFORE UPDATE ON summary_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_summary_blocks_updated_at();
```

### Step 1.3: Crear RPCs + Permisos

```sql
-- RPC: rag_block_search (búsqueda semántica en bloques)
CREATE OR REPLACE FUNCTION rag_block_search(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 5,
  filter_summary_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  block_id uuid,
  summary_id uuid,
  block_type text,
  content jsonb,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sb.id AS block_id,
    sb.summary_id,
    sb.type AS block_type,
    sb.content,
    1 - (sb.embedding <=> query_embedding) AS similarity
  FROM summary_blocks sb
  WHERE sb.embedding IS NOT NULL
    AND sb.is_active = true
    AND 1 - (sb.embedding <=> query_embedding) > match_threshold
    AND (filter_summary_ids IS NULL OR sb.summary_id = ANY(filter_summary_ids))
  ORDER BY sb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RPC: check_block_sync_health (diagnóstico de sincronización)
CREATE OR REPLACE FUNCTION check_block_sync_health(p_summary_id uuid)
RETURNS TABLE (in_sync boolean, stale_since timestamptz)
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
  SELECT
    (max_block_updated <= summary_updated) AS in_sync,
    CASE
      WHEN max_block_updated > summary_updated THEN max_block_updated
      ELSE NULL
    END AS stale_since
  FROM (
    SELECT
      (SELECT COALESCE(MAX(updated_at), '1970-01-01') FROM summary_blocks
       WHERE summary_id = p_summary_id AND is_active = true) AS max_block_updated,
      (SELECT COALESCE(updated_at, '1970-01-01') FROM summaries
       WHERE id = p_summary_id) AS summary_updated
  ) sub;
$$;

-- Permisos: REVOCAR acceso público primero (PostgreSQL da EXECUTE a PUBLIC por defecto),
-- luego otorgar solo a los roles necesarios.
-- rag_block_search: solo backend (service_role) — NUNCA exponer a authenticated/anon
-- check_block_sync_health: profesor (authenticated) + backend (service_role)
-- IMPORTANTE: En Supabase, REVOKE FROM PUBLIC no basta — los roles anon/authenticated
-- pueden tener grants heredados. Revocar explícitamente de cada rol.
REVOKE EXECUTE ON FUNCTION rag_block_search FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION rag_block_search FROM anon;
REVOKE EXECUTE ON FUNCTION rag_block_search FROM authenticated;
REVOKE EXECUTE ON FUNCTION check_block_sync_health FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION check_block_sync_health FROM anon;

GRANT EXECUTE ON FUNCTION rag_block_search TO service_role;
GRANT EXECUTE ON FUNCTION check_block_sync_health TO authenticated;
GRANT EXECUTE ON FUNCTION check_block_sync_health TO service_role;
```

### Step 1.4: TESTS — Suite Completa de Validación (~10 min)

Ejecutar TODOS estos tests. Si alguno falla, la migración no está completa.

```sql
-- ══════════════════════════════════════════════════
-- TEST SUITE: Fase 1 — summary_blocks migration
-- Audited: 2026-03-24
-- ══════════════════════════════════════════════════

-- ─── TEST 1: Schema columns ───
DO $$
DECLARE
  expected_cols text[] := ARRAY[
    'id', 'summary_id', 'type', 'content', 'heading_text', 'heading_level',
    'order_index', 'is_active', 'created_at', 'style', 'metadata',
    'updated_at', 'created_by', 'embedding'
  ];
  missing text[];
BEGIN
  SELECT array_agg(e) INTO missing
  FROM unnest(expected_cols) AS e
  WHERE e NOT IN (
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'summary_blocks' AND table_schema = 'public'
  );
  IF missing IS NOT NULL AND array_length(missing, 1) > 0 THEN
    RAISE EXCEPTION 'TEST 1 FAILED — Missing columns: %', missing;
  END IF;
  RAISE NOTICE 'TEST 1 PASSED — All 14 expected columns exist';
END $$;

-- ─── TEST 2: content is JSONB ───
DO $$
DECLARE
  dtype text;
BEGIN
  SELECT data_type INTO dtype FROM information_schema.columns
  WHERE table_name = 'summary_blocks' AND column_name = 'content';
  IF dtype != 'jsonb' THEN
    RAISE EXCEPTION 'TEST 2 FAILED — content is % (expected jsonb)', dtype;
  END IF;
  RAISE NOTICE 'TEST 2 PASSED — content column is jsonb';
END $$;

-- ─── TEST 3: Required indices exist ───
DO $$
DECLARE
  embedding_idx_exists boolean;
  order_idx_exists boolean;
BEGIN
  -- Verificar índice HNSW de embeddings
  SELECT EXISTS(
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'summary_blocks' AND indexname = 'idx_sb_embedding'
  ) INTO embedding_idx_exists;

  -- Verificar índice compuesto pre-existente (summary_id + order_index)
  SELECT EXISTS(
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'summary_blocks' AND indexname = 'idx_summary_blocks_order'
  ) INTO order_idx_exists;

  IF NOT embedding_idx_exists THEN
    RAISE EXCEPTION 'TEST 3 FAILED — HNSW embedding index (idx_sb_embedding) missing';
  END IF;
  IF NOT order_idx_exists THEN
    RAISE EXCEPTION 'TEST 3 FAILED — Order index (idx_summary_blocks_order) missing';
  END IF;
  RAISE NOTICE 'TEST 3 PASSED — Both required indices exist (embedding HNSW + order composite)';
END $$;

-- ─── TEST 4: HNSW index (not ivfflat) ───
DO $$
DECLARE
  idx_def text;
BEGIN
  SELECT indexdef INTO idx_def FROM pg_indexes
  WHERE tablename = 'summary_blocks' AND indexname = 'idx_sb_embedding';
  IF idx_def NOT LIKE '%hnsw%' THEN
    RAISE EXCEPTION 'TEST 4 FAILED — Embedding index is not HNSW: %', idx_def;
  END IF;
  RAISE NOTICE 'TEST 4 PASSED — Embedding index uses HNSW';
END $$;

-- ─── TEST 5: Trigger exists ───
DO $$
DECLARE
  trg_count int;
BEGIN
  SELECT count(*) INTO trg_count FROM information_schema.triggers
  WHERE event_object_table = 'summary_blocks' AND trigger_name = 'trg_summary_blocks_updated_at';
  IF trg_count = 0 THEN
    RAISE EXCEPTION 'TEST 5 FAILED — updated_at trigger missing';
  END IF;
  RAISE NOTICE 'TEST 5 PASSED — updated_at trigger exists';
END $$;

-- ─── TEST 6: RLS enabled ───
DO $$
DECLARE
  rls_on boolean;
BEGIN
  SELECT relrowsecurity INTO rls_on FROM pg_class WHERE relname = 'summary_blocks';
  IF NOT rls_on THEN
    RAISE EXCEPTION 'TEST 6 FAILED — RLS not enabled';
  END IF;
  RAISE NOTICE 'TEST 6 PASSED — RLS enabled on summary_blocks';
END $$;

-- ─── TEST 7: RLS policies — verify the 3 CORRECT pre-existing policies ───
DO $$
DECLARE
  pol_count int;
  has_professor boolean;
  has_student boolean;
  has_service boolean;
BEGIN
  SELECT count(*) INTO pol_count FROM pg_policies WHERE tablename = 'summary_blocks';

  SELECT EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'summary_blocks' AND policyname ILIKE '%professor%manage%') INTO has_professor;
  SELECT EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'summary_blocks' AND policyname ILIKE '%student%read%') INTO has_student;
  SELECT EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'summary_blocks' AND policyname ILIKE '%service_role%') INTO has_service;

  IF pol_count < 3 THEN
    RAISE EXCEPTION 'TEST 7 FAILED — Expected >=3 RLS policies, found %', pol_count;
  END IF;
  IF NOT (has_professor AND has_student AND has_service) THEN
    RAISE EXCEPTION 'TEST 7 FAILED — Missing expected policy. professor=%, student=%, service=%', has_professor, has_student, has_service;
  END IF;
  RAISE NOTICE 'TEST 7 PASSED — % RLS policies found (professor+student+service_role verified)', pol_count;
END $$;

-- ─── TEST 8: RPCs exist ───
DO $$
DECLARE
  rpc_count int;
BEGIN
  SELECT count(*) INTO rpc_count FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name IN ('rag_block_search', 'check_block_sync_health');
  IF rpc_count < 2 THEN
    RAISE EXCEPTION 'TEST 8 FAILED — Expected 2 RPCs, found %', rpc_count;
  END IF;
  RAISE NOTICE 'TEST 8 PASSED — Both RPCs exist';
END $$;

-- ─── TEST 9: CRUD insert works (JSONB content) ───
DO $$
DECLARE
  test_summary_id uuid;
  test_block_id uuid;
  test_content jsonb;
BEGIN
  SELECT id INTO test_summary_id FROM summaries LIMIT 1;
  IF test_summary_id IS NULL THEN
    RAISE NOTICE 'TEST 9 SKIPPED — No summaries exist to test FK';
    RETURN;
  END IF;

  INSERT INTO summary_blocks (summary_id, type, content, order_index)
  VALUES (
    test_summary_id,
    'key_point',
    '{"title":"Test Block","content":"This is a test key point","importance":"critical"}'::jsonb,
    9999
  ) RETURNING id, content INTO test_block_id, test_content;

  IF test_content->>'title' != 'Test Block' THEN
    DELETE FROM summary_blocks WHERE id = test_block_id;
    RAISE EXCEPTION 'TEST 9 FAILED — JSONB query failed';
  END IF;

  DELETE FROM summary_blocks WHERE id = test_block_id;
  RAISE NOTICE 'TEST 9 PASSED — JSONB insert + query works, cleaned up';
END $$;

-- ─── TEST 10: updated_at trigger fires (clock_timestamp makes this work) ───
DO $$
DECLARE
  test_summary_id uuid;
  test_block_id uuid;
  created_ts timestamptz;
  updated_ts timestamptz;
BEGIN
  SELECT id INTO test_summary_id FROM summaries LIMIT 1;
  IF test_summary_id IS NULL THEN
    RAISE NOTICE 'TEST 10 SKIPPED — No summaries exist';
    RETURN;
  END IF;

  INSERT INTO summary_blocks (summary_id, type, content, order_index)
  VALUES (test_summary_id, 'prose', '{"title":"Trigger Test"}'::jsonb, 9998)
  RETURNING id, updated_at INTO test_block_id, created_ts;

  -- pg_sleep ensures wall-clock time advances (clock_timestamp will differ)
  PERFORM pg_sleep(0.1);
  UPDATE summary_blocks SET content = '{"title":"Trigger Test Updated"}'::jsonb
  WHERE id = test_block_id;

  SELECT updated_at INTO updated_ts FROM summary_blocks WHERE id = test_block_id;

  IF updated_ts <= created_ts THEN
    DELETE FROM summary_blocks WHERE id = test_block_id;
    RAISE EXCEPTION 'TEST 10 FAILED — updated_at not bumped after UPDATE (created=%, updated=%)', created_ts, updated_ts;
  END IF;

  DELETE FROM summary_blocks WHERE id = test_block_id;
  RAISE NOTICE 'TEST 10 PASSED — Trigger bumped updated_at (% -> %)', created_ts, updated_ts;
END $$;

-- ─── TEST 11: check_block_sync_health RPC works ───
DO $$
DECLARE
  test_result record;
  test_summary_id uuid;
BEGIN
  SELECT id INTO test_summary_id FROM summaries LIMIT 1;
  IF test_summary_id IS NULL THEN
    RAISE NOTICE 'TEST 11 SKIPPED — No summaries exist';
    RETURN;
  END IF;

  SELECT * INTO test_result FROM check_block_sync_health(test_summary_id);
  IF test_result IS NULL THEN
    RAISE EXCEPTION 'TEST 11 FAILED — RPC returned no rows';
  END IF;
  RAISE NOTICE 'TEST 11 PASSED — check_block_sync_health returns: in_sync=%, stale_since=%', test_result.in_sync, test_result.stale_since;
END $$;

-- ─── TEST 12: vector column accepts 1536d embedding ───
DO $$
DECLARE
  test_summary_id uuid;
  test_block_id uuid;
BEGIN
  SELECT id INTO test_summary_id FROM summaries LIMIT 1;
  IF test_summary_id IS NULL THEN
    RAISE NOTICE 'TEST 12 SKIPPED — No summaries exist';
    RETURN;
  END IF;

  INSERT INTO summary_blocks (summary_id, type, content, order_index)
  VALUES (test_summary_id, 'prose', '{"title":"Vector Test"}'::jsonb, 9997)
  RETURNING id INTO test_block_id;

  UPDATE summary_blocks
  SET embedding = (SELECT array_agg(0)::vector(1536) FROM generate_series(1,1536))
  WHERE id = test_block_id;

  IF (SELECT embedding IS NOT NULL FROM summary_blocks WHERE id = test_block_id) THEN
    DELETE FROM summary_blocks WHERE id = test_block_id;
    RAISE NOTICE 'TEST 12 PASSED — 1536d vector stored and retrieved';
  ELSE
    DELETE FROM summary_blocks WHERE id = test_block_id;
    RAISE EXCEPTION 'TEST 12 FAILED — Embedding not stored';
  END IF;
END $$;

-- ─── TEST 13: type column default is 'prose' (not 'paragraph') ───
DO $$
DECLARE
  col_default text;
BEGIN
  SELECT column_default INTO col_default FROM information_schema.columns
  WHERE table_name = 'summary_blocks' AND column_name = 'type';
  IF col_default NOT LIKE '%prose%' THEN
    RAISE EXCEPTION 'TEST 13 FAILED — type default is % (expected prose)', col_default;
  END IF;
  RAISE NOTICE 'TEST 13 PASSED — type column default is prose';
END $$;

-- ─── TEST 14: GRANT/REVOKE on RPCs ───
DO $$
DECLARE
  sync_grant_auth boolean;
  rag_grant_anon boolean;
  rag_grant_service boolean;
BEGIN
  -- check_block_sync_health should be granted to authenticated
  SELECT EXISTS(
    SELECT 1 FROM information_schema.role_routine_grants
    WHERE routine_name = 'check_block_sync_health'
      AND grantee = 'authenticated'
      AND privilege_type = 'EXECUTE'
  ) INTO sync_grant_auth;

  -- rag_block_search should NOT be granted to anon (REVOKE PUBLIC)
  SELECT EXISTS(
    SELECT 1 FROM information_schema.role_routine_grants
    WHERE routine_name = 'rag_block_search'
      AND grantee = 'anon'
      AND privilege_type = 'EXECUTE'
  ) INTO rag_grant_anon;

  -- rag_block_search SHOULD be granted to service_role
  SELECT EXISTS(
    SELECT 1 FROM information_schema.role_routine_grants
    WHERE routine_name = 'rag_block_search'
      AND grantee = 'service_role'
      AND privilege_type = 'EXECUTE'
  ) INTO rag_grant_service;

  IF NOT sync_grant_auth THEN
    RAISE EXCEPTION 'TEST 14 FAILED — check_block_sync_health not granted to authenticated';
  END IF;
  IF rag_grant_anon THEN
    RAISE EXCEPTION 'TEST 14 FAILED — rag_block_search is accessible to anon (REVOKE failed!)';
  END IF;
  IF NOT rag_grant_service THEN
    RAISE EXCEPTION 'TEST 14 FAILED — rag_block_search not granted to service_role';
  END IF;
  RAISE NOTICE 'TEST 14 PASSED — RPC permissions correct (sync→authenticated, rag→service_role only)';
END $$;

-- ─── TEST 15: No insecure "sb_read/write_via_summary" policies exist ───
DO $$
DECLARE
  bad_count int;
BEGIN
  SELECT count(*) INTO bad_count FROM pg_policies
  WHERE tablename = 'summary_blocks' AND policyname LIKE 'sb_%_via_summary';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'TEST 15 FAILED — Found % insecure sb_*_via_summary policies. DROP them!', bad_count;
  END IF;
  RAISE NOTICE 'TEST 15 PASSED — No insecure bypass policies exist';
END $$;

-- ══════════════════════════════════════════════════
-- SUMMARY
-- ══════════════════════════════════════════════════
-- If all 15 tests show "PASSED" (some may show "SKIPPED" if no summaries exist),
-- Fase 0+1 is COMPLETE.
--
-- Expected output:
--   TEST 1 PASSED  — All 14 expected columns exist
--   TEST 2 PASSED  — content column is jsonb
--   TEST 3 PASSED  — Both required indices exist
--   TEST 4 PASSED  — Embedding index uses HNSW
--   TEST 5 PASSED  — updated_at trigger exists
--   TEST 6 PASSED  — RLS enabled
--   TEST 7 PASSED  — 3 correct RLS policies (professor+student+service)
--   TEST 8 PASSED  — Both RPCs exist
--   TEST 9 PASSED  — JSONB insert + query
--   TEST 10 PASSED — Trigger bumped updated_at (clock_timestamp)
--   TEST 11 PASSED — check_block_sync_health works
--   TEST 12 PASSED — 1536d vector stored
--   TEST 13 PASSED — type default is prose
--   TEST 14 PASSED — RPC permissions granted
--   TEST 15 PASSED — No insecure bypass policies
```

---

## POST-MIGRATION CHECKLIST

- [ ] All 15 tests PASSED
- [ ] No data was accidentally inserted (table still has 0 real rows)
- [ ] Screenshot of test results saved for reference
- [ ] Proceed to Fase 2 + Fase 4 (can run in parallel)
