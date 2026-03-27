# AUDITORÍA COMPLETA: SQL Migración Fase 0 + Fase 1

> **Fecha:** 2026-03-24
> **Auditado:** `PROMPT_LOOP_FASE0_1_SQL.md`
> **Método:** Comparación del prompt contra el schema REAL de producción (Supabase project `xdnciktarvxyhkrokbng`)
> **Veredicto global:** 🔴 **4 bugs críticos, 3 defectos moderados, 4 mejoras recomendadas**

---

## ESTADO REAL DE LA BASE DE DATOS (pre-migración)

### `summaries` — 19 columnas, 11 filas

| Dato | Valor real |
|------|-----------|
| Filas | 11 |
| Statuses en uso | `draft`, `published` |
| Constraint actual | `summaries_status_check`: `draft`, `published`, `rejected` |
| `updated_at` | ✅ YA EXISTE |
| `institution_id` | ✅ YA EXISTE |
| RLS policies | 5 policies con `institution_id = ANY(user_institution_ids())` — **scoped por institución** |

### `summary_blocks` — 9 columnas, 0 filas

| Dato | Valor real |
|------|-----------|
| Filas | 0 ✅ (seguro migrar) |
| `content` tipo actual | `text` con default `''::text` |
| `type` default actual | `'paragraph'::text` |
| RLS | ✅ YA HABILITADO |
| Policies existentes | 3 policies (profesor=owner, student=read active, service_role=all) |
| Indices existentes | `summary_blocks_pkey`, `idx_summary_blocks_summary_id`, `idx_summary_blocks_order (summary_id, order_index) WHERE is_active=true` |
| Triggers | Ninguno |
| RPCs | Ninguna |
| pgvector | ✅ v0.8.0 instalado |

---

## 🔴 BUGS CRÍTICOS (4)

### BUG-1: El trigger `updated_at` usa `now()` — Test 10 fallará SIEMPRE

**Ubicación:** Step 1.2 (trigger) + Step 1.4 (Test 10)

**El problema:** El trigger define:
```sql
NEW.updated_at = now();
```

Pero `now()` en PostgreSQL devuelve el timestamp del **inicio de la transacción**, no el wall-clock. Como el Test 10 ejecuta INSERT + `pg_sleep(0.1)` + UPDATE todo dentro de un `DO $$` block (= una sola transacción), `now()` retorna **el mismo valor** para ambos. El test compara `updated_ts <= created_ts` — será `=`, y el test reportará FAILED.

**Fix para el trigger:**
```sql
NEW.updated_at = clock_timestamp();  -- wall-clock, no transaction-time
```

**Fix alternativo para el test:** Ejecutar INSERT y UPDATE como statements separados fuera del DO block (transacciones distintas). Pero es mejor arreglar el trigger, porque en producción el CRUD también corre cada operación en su propia transacción y `now()` funcionaría. Aun así, `clock_timestamp()` es la práctica correcta para triggers `updated_at`.

**Severidad:** 🔴 CRÍTICA — El test fallará al ejecutar, bloqueando la migración.

---

### BUG-2: RLS policies del prompt son INSEGURAS y DUPLICADAS

**Ubicación:** Step 1.2, punto 6 (RLS policies)

**El problema:** El prompt crea:
```sql
CREATE POLICY "sb_read_via_summary" ON summary_blocks
  FOR SELECT USING (summary_id IN (SELECT id FROM summaries));

CREATE POLICY "sb_write_via_summary" ON summary_blocks
  FOR ALL USING (summary_id IN (SELECT id FROM summaries));
```

Dos problemas graves:

**A) INSEGURAS:** Estas policies permiten que **CUALQUIER usuario autenticado** lea y escriba **CUALQUIER bloque** de **CUALQUIER institución**. Solo verifican que el `summary_id` exista en `summaries`, sin restricción por usuario ni institución. En un sistema multi-tenant médico, esto es una brecha de seguridad.

**B) DUPLICADAS:** La tabla YA tiene 3 policies CORRECTAS:

| Policy existente | Qué hace |
|---|---|
| `Professors manage summary_blocks` | FOR ALL — solo si `s.created_by = auth.uid()` (el profesor dueño) |
| `Students read active summary_blocks` | FOR SELECT — solo bloques activos de summaries no eliminados |
| `summary_blocks_service_role_all` | FOR ALL — solo service_role (backend) |

Estas policies existentes son **mucho más seguras**. Agregar las del prompt crearía un bypass: un estudiante podría ESCRIBIR bloques usando `sb_write_via_summary`.

**Fix:** ELIMINAR completamente el bloque de creación de policies del prompt. Las policies existentes son correctas.

```sql
-- ELIMINAR ESTAS LÍNEAS DEL PROMPT:
-- CREATE POLICY "sb_read_via_summary" ...
-- CREATE POLICY "sb_write_via_summary" ...

-- Las policies existentes ya son correctas:
-- "Professors manage summary_blocks" (CRUD para dueño)
-- "Students read active summary_blocks" (solo lectura)
-- "summary_blocks_service_role_all" (backend)
```

**Severidad:** 🔴 CRÍTICA — Crearía un agujero de seguridad en un sistema médico multi-tenant.

---

### BUG-3: ALTER COLUMN default antes de TYPE change puede fallar

**Ubicación:** Step 1.2, punto 2

```sql
ALTER TABLE summary_blocks
  ALTER COLUMN content SET DEFAULT '{}'::jsonb,  -- ← jsonb default en columna TEXT
  ALTER COLUMN content TYPE jsonb USING content::jsonb;
```

PostgreSQL procesa sub-comandos de ALTER TABLE secuencialmente. El `SET DEFAULT '{}'::jsonb` se aplica cuando la columna es aún `text`. Dependiendo de la versión de PG, esto puede fallar con un type mismatch.

**Fix:** Invertir el orden o separar:
```sql
ALTER TABLE summary_blocks
  ALTER COLUMN content TYPE jsonb USING content::jsonb;

ALTER TABLE summary_blocks
  ALTER COLUMN content SET DEFAULT '{}'::jsonb;
```

**Severidad:** 🔴 CRÍTICA — La migración podría abortar en el paso más importante.

---

### BUG-4: Test 4 (Fase 0) es falso — no valida nada

**Ubicación:** Step 0.3, Test 4

```sql
DO $$
DECLARE
  s text;
  valid_statuses text[] := ARRAY['draft', 'raw', 'review', 'published', 'archived'];
BEGIN
  FOREACH s IN ARRAY valid_statuses LOOP
    PERFORM 1 WHERE s = ANY(valid_statuses);  -- ← compara el array consigo mismo!
  END LOOP;
  RAISE NOTICE 'TEST PASSED — all 5 statuses are valid';
END $$;
```

Este test **siempre pasa** independientemente de si el constraint existe o no. Itera un array local y verifica que cada elemento está en... el mismo array. No toca la tabla ni el constraint.

**Fix:**
```sql
DO $$
DECLARE
  s text;
  valid_statuses text[] := ARRAY['draft', 'raw', 'review', 'published', 'archived'];
  test_id uuid;
BEGIN
  SELECT id INTO test_id FROM summaries LIMIT 1;
  IF test_id IS NULL THEN
    RAISE NOTICE 'TEST 4 SKIPPED — no summaries to test';
    RETURN;
  END IF;

  FOREACH s IN ARRAY valid_statuses LOOP
    UPDATE summaries SET status = s WHERE id = test_id;
    -- If constraint rejects any valid status, this will throw
  END LOOP;

  -- Restore original
  UPDATE summaries SET status = 'draft' WHERE id = test_id;
  RAISE NOTICE 'TEST 4 PASSED — all 5 statuses accepted by constraint';
END $$;
```

**Severidad:** 🔴 CRÍTICA — Falso positivo. Da confianza falsa de que el constraint funciona.

---

## 🟡 DEFECTOS MODERADOS (3)

### DEF-1: Índice duplicado/redundante

**Ubicación:** Step 1.2, punto 5

El prompt crea:
```sql
CREATE INDEX IF NOT EXISTS idx_sb_summary_order
  ON summary_blocks (summary_id, order_index);
```

Pero YA EXISTE un índice **mejor**:
```sql
idx_summary_blocks_order ON summary_blocks (summary_id, order_index) WHERE (is_active = true)
```

El índice existente es un **partial index** que solo indexa bloques activos — más eficiente y semánticamente correcto (nunca buscas bloques inactivos por orden).

El índice del prompt es un **superset sin filtro** — redundante y desperdicia espacio.

**Fix:** Eliminar la creación de `idx_sb_summary_order`. El existente es suficiente. Si se necesita buscar bloques inactivos por orden (raro), agregar un índice separado con nombre distinto.

---

### DEF-2: No hay GRANT EXECUTE en las RPCs

**Ubicación:** Step 1.3

Las RPCs se crean pero no se otorga permiso de ejecución:

```sql
-- FALTA:
GRANT EXECUTE ON FUNCTION rag_block_search TO authenticated;
GRANT EXECUTE ON FUNCTION check_block_sync_health TO authenticated;
```

Sin esto, los usuarios autenticados no pueden llamar estas funciones desde el frontend via Supabase client (`.rpc('rag_block_search', ...)`). Solo `service_role` podría llamarlas.

**Nota:** `rag_block_search` probablemente solo se llama desde el backend (service_role), así que podría no necesitar GRANT. Pero `check_block_sync_health` es útil desde el frontend del profesor.

---

### DEF-3: Constraint migration borra `rejected`

**Ubicación:** Step 0.2

El constraint actual permite: `draft`, `published`, **`rejected`**

El nuevo constraint permite: `draft`, `raw`, `review`, `published`, `archived`

Se **elimina `rejected`** y se agregan `raw`, `review`, `archived`. Actualmente ninguna fila tiene `status = 'rejected'`, pero:

1. Si alguna fila fuera marcada `rejected` entre ahora y la migración → falla
2. El código actual (frontend/backend) podría referenciar `rejected` en algún lugar

**Fix:** Verificar que ningún código referencia `rejected`. Si existe lógica para `rejected`, mapearla a `archived` antes de migrar. Considerar agregar `rejected` al nuevo constraint por compatibilidad:
```sql
CHECK (status IN ('draft', 'raw', 'review', 'published', 'archived', 'rejected'))
```

---

## 🟢 MEJORAS RECOMENDADAS (4)

### MJ-1: El default de `type` sigue siendo `'paragraph'`

El default actual de `summary_blocks.type` es `'paragraph'::text`. Los 10 tipos educativos nuevos son: `prose`, `key_point`, `stages`, etc. `'paragraph'` no es ninguno de ellos.

**Recomendación:** Agregar al prompt:
```sql
ALTER TABLE summary_blocks ALTER COLUMN type SET DEFAULT 'prose';
```

---

### MJ-2: Test 3 (Fase 0) puede fallar silenciosamente

Si `(SELECT id FROM summaries LIMIT 1)` devuelve NULL (tabla vacía), el UPDATE afecta 0 filas → no hay constraint violation → no entra en EXCEPTION → llega a `RAISE EXCEPTION 'TEST FAILED'`. Así que con tabla vacía, falsamente reportaría FAILED.

Con 11 filas actuales funciona, pero agregar un guard sería más robusto:
```sql
IF (SELECT count(*) FROM summaries) = 0 THEN
  RAISE NOTICE 'TEST 3 SKIPPED — no summaries to test';
  RETURN;
END IF;
```

---

### MJ-3: Idempotencia de policies

El prompt usa `CREATE POLICY` sin `IF NOT EXISTS` (que no existe en PostgreSQL). Si se re-ejecuta, fallará con "policy already exists".

**Recomendación:** Agregar `DROP POLICY IF EXISTS` antes de cada `CREATE POLICY`. Pero dado BUG-2 (las policies del prompt se deben eliminar), esto es irrelevante si se aplica ese fix.

---

### MJ-4: `content` empty string → jsonb cast

El default actual de `content` es `''::text`. Si alguna fila tuviera `''`, el cast `content::jsonb` fallaría porque `''` no es JSON válido.

Con 0 filas es seguro, pero el safety check (Step 1.2 punto 1) ya verifica esto. Podría agregarse un `USING COALESCE(NULLIF(content, ''), '{}')::jsonb` por robustez:

```sql
ALTER COLUMN content TYPE jsonb USING COALESCE(NULLIF(content, ''), '{}')::jsonb;
```

---

## RESUMEN DE COBERTURA DE TESTS

| Test | ¿Correcto? | Nota |
|------|-----------|------|
| F0-T1: Columnas existen | ✅ OK | |
| F0-T2: Constraint existe | ✅ OK | |
| F0-T3: Rechaza inválido | ⚠️ | Falla silencioso si tabla vacía |
| F0-T4: Acepta válidos | 🔴 FAKE | No toca el constraint |
| F1-T1: 14 columnas | ✅ OK | |
| F1-T2: content=jsonb | ✅ OK | |
| F1-T3: 2 índices custom | ⚠️ | Busca `idx_sb_summary_order` que es redundante |
| F1-T4: HNSW | ✅ OK | |
| F1-T5: Trigger exists | ✅ OK | |
| F1-T6: RLS enabled | ✅ OK | Pero ya estaba enabled |
| F1-T7: ≥2 policies | ✅ OK | Ya hay 3 existentes |
| F1-T8: RPCs exist | ✅ OK | |
| F1-T9: JSONB CRUD | ✅ OK | Buen test end-to-end |
| F1-T10: Trigger fires | 🔴 BUG | `now()` en transacción = mismo valor |
| F1-T11: sync health RPC | ✅ OK | |
| F1-T12: Vector 1536d | ✅ OK | |

**Tests que faltan:**
- Test funcional de `rag_block_search` (solo se verifica existencia)
- Test de que `created_by` acepta UUID válido y FK (si aplica)
- Test de idempotencia (re-ejecutar migración no rompe)

---

## PROMPT CORREGIDO: Cambios necesarios

### En Step 0.2:
- Considerar incluir `rejected` en el nuevo constraint, o verificar que no hay código que lo use

### En Step 0.3:
- **Test 3**: Agregar guard para tabla vacía
- **Test 4**: Reescribir para que realmente actualice filas contra el constraint

### En Step 1.2:
- **Punto 2**: Separar SET DEFAULT y TYPE change en dos ALTER statements
- **Punto 5**: Eliminar `idx_sb_summary_order` (redundante con existente)
- **Punto 6**: ELIMINAR las dos CREATE POLICY — las existentes son correctas y más seguras
- **Punto 7**: Cambiar `now()` → `clock_timestamp()` en el trigger

### En Step 1.3:
- Agregar `GRANT EXECUTE ON FUNCTION ... TO authenticated` donde corresponda

### En Step 1.4:
- **Test 3**: Actualizar para buscar el índice existente, no el nuevo eliminado
- **Test 7**: Verificar que las policies existentes siguen intactas (no que se crearon nuevas)
- **Test 10**: Funciona si se arregla el trigger con `clock_timestamp()`

---

## VEREDICTO FINAL

La migración es **ejecutable con correcciones**. Los 4 bugs críticos deben arreglarse ANTES de ejecutar. El más peligroso es BUG-2 (RLS policies inseguras) que abriría acceso cross-tenant en un sistema médico. Los demás son bugs de ejecución que bloquearían la migración.

Con las correcciones aplicadas, la migración es sólida: el schema está bien diseñado, las RPCs son útiles, y el 90% de los tests son buenos.
