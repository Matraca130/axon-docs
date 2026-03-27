# TASK-004: Fix SEC-S9B (MEDIUM) - Add REVOKE to 6 SQL Functions

## Metadata
- **ID**: TASK-004
- **Created**: 2026-03-21
- **Priority**: 🟡 MEDIUM (Security)
- **Status**: 🟡 ABIERTO
- **Sprint/Fase**: Fase 1 - Security Hardening
- **Estimación**: 4 horas
- **Deadline**: 2026-03-25

## Agentes Asignados
| Agente | Rol | Estado | Última Actividad |
|--------|-----|--------|-----------------|
| infra-plumbing | Backend (Database) | ABIERTO | 2026-03-21 |

## Descripción
Security audit round 1 encontró 6 SQL functions que tienen permisos GRANT públicos. Deben revertirse con REVOKE y restrictarse solo a usuarios autenticados.

**Hallazgo:**
Algunas funciones tienen `GRANT EXECUTE ON FUNCTION fn_name() TO PUBLIC;` lo que permite acceso anónimo. Debería ser `GRANT EXECUTE ON FUNCTION fn_name() TO authenticated;` con `SECURITY DEFINER`.

**Impacto Seguridad:**
- 🟡 MEDIUM: Funciones críticas pueden ser llamadas sin auth
- Riesgo: Exposure de algoritmos internos (FSRS, BKT)
- Riesgo: Bypass de permission checking

## Criterios de Aceptación
- [ ] Identificar las 6 functions exactas
- [ ] Crear migration script con REVOKE statements
- [ ] Test que functions accesibles solo para authenticated
- [ ] Test que functions no accessible desde anonymous
- [ ] Verify SECURITY DEFINER context
- [ ] No performance regression
- [ ] All tests passing
- [ ] Migration can rollback safely

## Dependencias
- Depende de: Database schema conocido
- Bloquea a: Nada (pero security improvement)
- Requires: database migration tool (Supabase migrations)

## Functions Afectadas

### 1. fn_calculate_fsrs_weight()
**Current (VULNERABLE):**
```sql
GRANT EXECUTE ON FUNCTION fn_calculate_fsrs_weight(
  last_review integer,
  reviews_count integer
) TO PUBLIC;
```

**Should Be (SECURE):**
```sql
REVOKE EXECUTE ON FUNCTION fn_calculate_fsrs_weight(
  last_review integer,
  reviews_count integer
) FROM PUBLIC;

ALTER FUNCTION fn_calculate_fsrs_weight(
  last_review integer,
  reviews_count integer
) SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION fn_calculate_fsrs_weight(
  last_review integer,
  reviews_count integer
) TO authenticated;
```

---

### 2. fn_bkt_calculate_probability()
**Purpose:** BKT knowledge tracing
**Current:** PUBLIC
**Change:** REVOKE PUBLIC, SECURITY DEFINER, GRANT authenticated

---

### 3. fn_chunk_summary()
**Purpose:** Semantic chunking for RAG
**Current:** PUBLIC
**Change:** REVOKE PUBLIC, RESTRICTED, GRANT authenticated

---

### 4. fn_generate_embedding()
**Purpose:** Generate embeddings for vectors
**Current:** PUBLIC
**Change:** REVOKE PUBLIC, SECURITY DEFINER, GRANT authenticated

---

### 5. fn_validate_institution_access()
**Purpose:** Permission checking
**Current:** PUBLIC
**Change:** REVOKE PUBLIC, SECURITY DEFINER, GRANT authenticated

---

### 6. fn_check_course_permission()
**Purpose:** Role-based access control
**Current:** PUBLIC
**Change:** REVOKE PUBLIC, SECURITY DEFINER, GRANT authenticated

---

## Pasos de Implementación

### 1. Audit & Documentation (30 minutos)
- [ ] Encontrar todas las 6 functions en schema
- [ ] Verificar current grants (lista completa)
- [ ] Revisar qué hace cada function
- [ ] Documentar dependencies entre functions

Query para encontrar:
```sql
SELECT
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'fn_calculate_fsrs_weight',
  'fn_bkt_calculate_probability',
  'fn_chunk_summary',
  'fn_generate_embedding',
  'fn_validate_institution_access',
  'fn_check_course_permission'
);
```

Query para ver grants:
```sql
SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'fn_calculate_fsrs_weight';
```

### 2. Create Migration File (1 hora)
- [ ] Create nueva migration en `supabase/migrations/`
- [ ] Nombre: `20260321_revoke_public_functions.sql`
- [ ] Include todas las 6 functions

Migration template:
```sql
-- Migration: Revoke PUBLIC access from critical functions
-- Date: 2026-03-21
-- Reason: Security audit finding (SEC-S9B)

-- Function 1: fn_calculate_fsrs_weight
ALTER FUNCTION public.fn_calculate_fsrs_weight(
  last_review integer,
  reviews_count integer
) OWNER TO postgres;

ALTER FUNCTION public.fn_calculate_fsrs_weight(
  last_review integer,
  reviews_count integer
) SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.fn_calculate_fsrs_weight(
  last_review integer,
  reviews_count integer
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.fn_calculate_fsrs_weight(
  last_review integer,
  reviews_count integer
) TO authenticated;

-- [Repeat for functions 2-6...]
```

### 3. Test Migration (1 hora)
- [ ] Deploy migration a staging
- [ ] Test authenticated users CAN call functions
- [ ] Test anonymous users CANNOT call functions
- [ ] Verify no application errors

Test script:
```typescript
// Test 1: Authenticated user can call
const { data, error } = await supabase
  .rpc('fn_calculate_fsrs_weight', { last_review: 5, reviews_count: 10 })
  .auth(validToken);

expect(error).toBeNull();
expect(data).toBeDefined();

// Test 2: Anonymous cannot call
const { data: anonData, error: anonError } = await supabase
  .rpc('fn_calculate_fsrs_weight', { last_review: 5, reviews_count: 10 })
  .auth(null); // No token

expect(anonError).toBeDefined();
expect(anonError.message).toContain('permission denied');
```

### 4. Verify No Regressions (1 hora)
- [ ] Run full test suite
- [ ] Check application still works
- [ ] Monitor logs para permission errors
- [ ] Verify performance (SECURITY DEFINER might add overhead)

Checklist:
- [ ] FSRS calculations work
- [ ] BKT scoring works
- [ ] RAG chunking works
- [ ] Embeddings generate
- [ ] Permission checks pass
- [ ] No 403 errors in logs

### 5. Apply to Production (30 minutos)
- [ ] Deploy migration via Supabase CLI
- [ ] Monitor deployment
- [ ] Check application health
- [ ] Document change

## Log de Progreso

### 2026-03-21 - STATUS: ABIERTO
- Tarea creada
- Asignada a: infra-plumbing agent
- Waiting for audit phase

### [Agent Work Here]

---

## Información Técnica

### SECURITY DEFINER Implications
```sql
-- SECURITY DEFINER = function runs with owner's permissions
-- Not user's permissions
-- Useful para restricting access mientras allowing specific operations

CREATE OR REPLACE FUNCTION fn_example()
RETURNS boolean AS $$
BEGIN
  -- This query runs AS postgres (owner)
  -- Not AS current user
  -- Prevents unauthorized data access
  SELECT COUNT(*) FROM secrets_table;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Role Hierarchy en Supabase
```
postgres (superuser)
  └─ service_role (backend service)
      └─ authenticated (logged-in users)
          └─ anon (public, no login)
```

### Current vs Desired State
| Function | Current | Desired | Risk |
|----------|---------|---------|------|
| fn_calculate_fsrs_weight | PUBLIC | authenticated + SECURITY DEFINER | MEDIUM |
| fn_bkt_calculate_probability | PUBLIC | authenticated + SECURITY DEFINER | MEDIUM |
| fn_chunk_summary | PUBLIC | authenticated + SECURITY DEFINER | HIGH |
| fn_generate_embedding | PUBLIC | authenticated + SECURITY DEFINER | HIGH |
| fn_validate_institution_access | PUBLIC | authenticated + SECURITY DEFINER | HIGH |
| fn_check_course_permission | PUBLIC | authenticated + SECURITY DEFINER | CRITICAL |

## Testing Checklist

- [ ] All 6 functions pass tests
- [ ] No TypeScript errors
- [ ] ESLint compliance
- [ ] Migration can rollback
- [ ] Performance metrics unchanged
- [ ] Security audit confirms fix

## Rollback Strategy

Si hay problema, revert es simple:
```sql
-- Rollback: Restore PUBLIC access
GRANT EXECUTE ON FUNCTION public.fn_calculate_fsrs_weight(...) TO PUBLIC;
ALTER FUNCTION public.fn_calculate_fsrs_weight(...) SECURITY INVOKER;
-- [Repeat for other functions...]
```

## Success Metrics

✅ **Definition of Done:**
- All 6 functions secured
- Anonymous requests denied
- Authenticated users unaffected
- No performance regression
- All tests passing
- Security audit confirms fix

## Notas Importantes

1. **CRITICAL:** fn_check_course_permission es el most important
2. **Performance:** SECURITY DEFINER puede agregar small overhead (~1-5ms)
3. **Backward Compat:** Applications using those functions vía service_role OK
4. **Audit Trail:** Supabase logs todas las function calls

## Recursos

- **Supabase Security:** https://supabase.com/docs/guides/security
- **PostgreSQL SECURITY DEFINER:** https://www.postgresql.org/docs/current/sql-createfunction.html
- **Migration Guide:** https://supabase.com/docs/guides/cli/local-development
- **Audit Details:** `/ideas/TODO_IMPLEMENT.md` (SEC-S9B)

---

**Próxima Acción:** infra-plumbing agent comienza audit
**Tiempo Total Estimado:** 4 horas (30 + 60 + 60 + 60 + 30 = 240 minutos)
**Tipo:** Security hardening (no new features)
**Risk Level:** LOW (fix will not break anything)
**Security Improvement:** HIGH (prevents unauthorized function access)
