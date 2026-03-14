# Axon v4.5 - Known Bugs

> Bugs confirmados contra el schema real de la DB y el codigo del backend/frontend.
>
> **Ultima actualizacion:** 2026-03-14

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
**Ubicacion:** `routes/mux/webhook.ts`
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

**Mitigacion existente:** El backend aplica institution scoping via `checkContentScope()` en `crud-factory.ts`. Todos los endpoints CRUD verifican membership antes de operar.

**Riesgo residual:** Acceso directo a Supabase con el anon key (expuesto en frontend) bypasea el backend completamente.

**Fix:** Habilitar RLS + crear policies basadas en `institution_id` via JOINs a memberships.
**Estado:** Pendiente — se aplicara cuando la app este lista para produccion

---

## ~~BUG-004: CORS origin wildcard (Backend)~~ FIXED

**Severidad:** ~~HIGH~~ FIXED
**Fix aplicado:** Commit `33eb56e` (2026-03-06) — CORS restringido a dominios especificos.
**Estado:** **FIXED**

---

## ~~BUG-005: Study Queue con queries secuenciales (Backend)~~ FIXED

**Severidad:** ~~LOW~~ FIXED
**Ubicacion:** `routes-study-queue.ts`
**Fix:** Path primario usa `get_study_queue()` RPC (1 SQL query). Fallback JS usa `Promise.all()`.
**Estado:** **FIXED**

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
**Mitigacion parcial:** Indices trigram + RPC `search_keywords_by_institution`. Queries en paralelo.
**Fix completo:** Consolidar en una sola funcion RPC.
**Estado:** Parcialmente mitigado

---

## ~~BUG-008: Reorder hace N updates individuales (Backend)~~ FIXED

**Severidad:** ~~LOW~~ FIXED
**Fix:** Usa `bulk_reorder()` RPC (migration `20260227_01`) para reorder atomico.
**Estado:** **FIXED**

---

## BUG-009: `flashcards.keyword_id` nullable vs required (Backend/DB)

**Severidad:** LOW
**Ubicacion:** Schema de DB vs crud-factory config
**Descripcion:** En la DB, `flashcards.keyword_id` es NULLABLE. En el backend, el crud-factory lo tiene como REQUIRED en `requiredFields`.
**Decision:** El backend es correcto — keyword_id DEBE ser required para la integridad del contenido.
**Estado:** By design (no es bug)

---

## ~~BUG-010: Build del frontend roto (Frontend)~~ FIXED

**Severidad:** ~~CRITICAL~~ FIXED
**Ubicacion:** `platformApi.ts` / `studentApi.ts` en numero1
**Descripcion original:** El frontend llamaba a funciones que no existian (`createStudySession`, `updateStudySession`, `submitReview`).
**Fix:** APIs de study session implementadas y conectadas. Confirmado en commit EC-03/04/05 (2026-03-13).
**Estado:** **FIXED**

---

## BUG-011: Tablas basura `kv_store_*` (Database)

**Severidad:** LOW
**Ubicacion:** Supabase PostgreSQL
**Descripcion:** ~25 tablas `kv_store_*` creadas automaticamente por Figma Make.
**Fix:** `DROP TABLE kv_store_* CASCADE;`
**Estado:** Pendiente (seguro eliminar)

---

## Gamificacion — Bugs encontrados y resueltos (2026-03-13)

Todos los bugs de gamificacion fueron encontrados en auditoria y resueltos en el mismo dia.

### CRITICAL (resueltos)

| ID | Descripcion | Fix |
|---|---|---|
| G-001 | `streak_freezes` INSERT faltaba `freeze_type` + `xp_cost` | Agregados campos requeridos |
| G-008 | Quiz XP 100% roto — no resolvia via `quiz_question_id` | Corregido path de resolucion |
| G-002 | `student_badges` INSERT faltaba `institution_id` | Agregado campo |
| A-001 | `badges.ts` usaba `icon_url` en vez de `icon` (columna real) | Corregido |
| A-004 | `streak_repairs` INSERT faltaba `institution_id` + `repair_date` | Agregados |
| A-009 | XP engine fallback `.single()` crasheaba para nuevos students | Cambiado a `.maybeSingle()` |
| B-001 | `daily_goal` renombrado a `daily_goal_minutes` (4 archivos) | Schema-code mismatch resuelto |
| B-002 | `source_id` tipo UUID vs TEXT (code pasa strings) | Migration TEXT aplicada |
| B-003 | `badge_definitions` faltaba columna `criteria` | Agregada + populated |

### HIGH (resueltos)

| ID | Descripcion | Fix |
|---|---|---|
| G-005 | `awardXP` no validaba `xpBase > 0` | Early return agregado |
| D-4 | `student_stats.total_reviews` y `total_sessions` no incrementaban | XP hooks ahora los incrementan |

### MEDIUM (resueltos)

| ID | Descripcion | Fix |
|---|---|---|
| G-003 | `POST /goals/complete` sin proteccion anti-duplicado | 409 on same day |
| G-006 | JS fallback no aplicaba daily cap 500 | Cap implementado |
| A-003 | Badge notifications sin filtro `institution_id` | Filtrado agregado |
| S3-002 | 4 badges Recolector apuntaban a `flashcards` (sin `student_id`) | Redirigidos a `fsrs_states` |
| S3-004 | `ai_conversations` y `leaderboard_weekly` no existen en DB | Removidos de whitelist, badges desactivados |

---

## Frontend — Bugs encontrados y resueltos (2026-03-13/14)

| ID | Descripcion | Fix |
|---|---|---|
| AUTH-DUAL | Dos `createContext()` para AuthContext (contexts/ vs context/) | Bridge convertido a re-export, luego eliminado. Canonical: `context/AuthContext.tsx` |
| LAYOUT-V1 | `roles/StudentLayout` faltaba 3 providers (TopicMastery, StudyPlans, StudyTimeEstimates) | Migrado a `layout/StudentLayout` v2 |
| LAYOUT-MOBILE | `roles/RoleShell` v1 sin soporte mobile | Migrado a `layout/RoleShell` v2 (MobileDrawer + auto-close) |
| STALE-CHUNK | Stale chunk errors post-deploy ("Failed to fetch dynamically imported module") | `lazyRetry()` utility en 22 lazy imports |

---

## Resumen por Severidad

| Severidad | Pendientes | IDs |
|---|---|---|
| CRITICAL | 1 | BUG-003 |
| HIGH | 1 | BUG-001 |
| MEDIUM | 2 | BUG-002, BUG-006 |
| LOW | 1 | BUG-011 |
| FIXED | 6 | BUG-004, BUG-005, BUG-008, BUG-010, AUTH-DUAL, STALE-CHUNK |
| By Design | 1 | BUG-009 |
| Gamificacion | 0 pendientes | G-series, A-series, B-series, S3-series (todos resueltos) |
