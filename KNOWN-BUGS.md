# Axon v4.4 - Known Bugs

> Bugs confirmados contra el schema real de la DB y el codigo del backend.
>
> **Ultima actualizacion:** 2026-03-06

---

## Severidad

| Nivel | Significado |
|---|---|
| CRITICAL | Seguridad comprometida o datos corruptos |
| HIGH | Funcionalidad rota o performance grave |
| MEDIUM | Funcionalidad degradada |
| LOW | Inconveniente menor |

---

## BUG-001: `resolution_tier` vs `max_resolution` (Backend)

**Severidad:** HIGH
**Ubicacion:** `routes-mux.ts` (webhook handler)
**Descripcion:** El webhook escribe en el campo `resolution_tier` pero la columna real en la DB se llama `max_resolution`. El valor **nunca se guarda**.
**Impacto:** La resolucion de video nunca se persiste correctamente.
**Fix:** Cambiar `resolution_tier` a `max_resolution` en el webhook handler.
**Estado:** Pendiente

---

## BUG-002: JWT sin verificacion criptografica local (Backend)

**Severidad:** MEDIUM (rebajado de CRITICAL)
**Ubicacion:** `db.ts` — funcion `authenticate()`
**Descripcion:** `authenticate()` decodifica el JWT localmente pero NO verifica la firma criptografica.

**Mitigacion existente (verificada en codigo):**
- PostgREST valida el JWT criptograficamente en la **primera query DB** de cada request.
- `getUserClient(jwt)` pasa el token en el header Authorization, y PostgREST lo verifica antes de ejecutar SQL.
- `authenticate()` SI valida expiracion (`exp`) localmente para fast-fail.
- Las rutas admin usan `getAdminClient().auth.getUser(token)` que verifica via red.

**Riesgo residual:** Rutas que llaman APIs externas (Gemini, Mux, Stripe) SIN hacer query DB primero. Un JWT forjado consumiria creditos de API pagados. La regla PF-05 en el codigo documenta este riesgo.

**Fix recomendado:** Agregar verificacion con `jose` y `SUPABASE_JWT_SECRET` en `authenticate()`. Prioridad baja porque PostgREST ya cubre el 95% de los casos.
**Estado:** Mitigado — fix completo para Fase futura

---

## BUG-003: RLS deshabilitado en tablas criticas (Database)

**Severidad:** CRITICAL
**Ubicacion:** Supabase PostgreSQL
**Tablas afectadas:**
- `flashcards` - Sin RLS
- `quiz_questions` - Sin RLS
- `quizzes` - Sin RLS

**Mitigacion existente:** El backend aplica institution scoping via `checkContentScope()` en `crud-factory.ts` (fix H-5). Todos los endpoints CRUD verifican membership antes de operar.

**Riesgo residual:** Acceso directo a Supabase con el anon key (expuesto en frontend) bypass el backend completamente.

**Fix:** Habilitar RLS + crear policies basadas en `institution_id` via JOINs a memberships.
**Estado:** Pendiente — se aplicara cuando la app este lista para produccion

---

## ~~BUG-004: CORS origin wildcard (Backend)~~ FIXED

**Severidad:** ~~HIGH~~ FIXED
**Ubicacion:** `index.ts`
**Fix aplicado:** Commit `33eb56e` (2026-03-06) — CORS restringido a dominios especificos.
**Estado:** **FIXED**

---

## BUG-005: Study Queue con queries secuenciales (Backend)

**Severidad:** LOW (rebajado de MEDIUM)
**Ubicacion:** `routes-study-queue.tsx`

**Estado parcial:** El path primario ahora usa `get_study_queue()` RPC (fix S-3) que hace todo en una sola query SQL. El fallback JS todavia hace ~5 queries pero usa `Promise.all()` para 4 de ellas.

---

## BUG-006: Content Tree filtra inactivos en JS (Backend)

**Severidad:** MEDIUM
**Ubicacion:** `routes/content/content-tree.ts`
**Descripcion:** Trae registros de la DB y luego filtra los inactivos en JavaScript.
**Fix:** Agregar filtros `is_active` y `deleted_at` a la query SQL.
**Estado:** Pendiente

---

## BUG-007: Search hace queries excesivas (Backend)

**Severidad:** MEDIUM (rebajado de HIGH)
**Ubicacion:** `routes/search/`
**Descripcion:** La busqueda global ejecuta multiples queries individuales.
**Mitigacion parcial:** Se agregaron indices trigram (migration `20260227_05`) y RPC `search_keywords_by_institution` (migration `20260305_06`).
**Fix completo:** Consolidar en menos queries o usar una sola funcion RPC.
**Estado:** Parcialmente mitigado

---

## BUG-008: Reorder hace N updates individuales (Backend)

**Severidad:** LOW (rebajado de MEDIUM)
**Ubicacion:** `routes/content/reorder.ts`
**Mitigacion:** Ya usa `bulk_reorder()` RPC (migration `20260227_01`) para reorder atomico.
**Estado:** **Posiblemente FIXED** — verificar si todas las rutas usan el RPC.

---

## BUG-009: `flashcards.keyword_id` nullable vs required (Backend/DB)

**Severidad:** LOW
**Ubicacion:** Schema de DB vs crud-factory config
**Descripcion:** En la DB, `flashcards.keyword_id` es NULLABLE. En el backend, el crud-factory lo tiene como REQUIRED en `requiredFields`.
**Decision:** El backend es correcto — keyword_id DEBE ser required para la integridad del contenido.
**Estado:** By design (no es bug)

---

## BUG-010: Build del frontend roto (Frontend)

**Severidad:** CRITICAL
**Ubicacion:** `platformApi.ts` en numero1
**Descripcion:** El frontend llama a funciones que no existen:
- `createStudySession`
- `updateStudySession`
- `submitReview`

**Nota:** Ahora que los schemas correctos de reviews y study_sessions estan documentados en `api/routes-study.md`, estas funciones pueden implementarse correctamente.
**Estado:** Pendiente

---

## BUG-011: Tablas basura `kv_store_*` (Database)

**Severidad:** LOW
**Ubicacion:** Supabase PostgreSQL
**Descripcion:** ~25 tablas `kv_store_*` creadas automaticamente por Figma Make.
**Fix:** `DROP TABLE kv_store_* CASCADE;`
**Estado:** Pendiente (seguro eliminar)

---

## Resumen por Severidad

| Severidad | Cantidad | IDs |
|---|---|---|
| CRITICAL | 2 | BUG-003, BUG-010 |
| HIGH | 1 | BUG-001 |
| MEDIUM | 2 | BUG-002, BUG-006 |
| LOW | 3 | BUG-005, BUG-009, BUG-011 |
| FIXED | 2 | BUG-004, BUG-008 |
| By Design | 1 | BUG-009 |
