# Axon v4.5 - Known Bugs

> Bugs confirmados contra el schema real de la DB y el codigo del backend/frontend.
>
> **Ultima actualizacion:** 2026-03-14 (audit pass 12 — 74 frontend files read)

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
**Descripcion:** El webhook escribe en `resolution_tier` pero la columna real es `max_resolution`.
**Estado:** Pendiente

---

## BUG-002: JWT sin verificacion criptografica local (Backend)

**Severidad:** MEDIUM (rebajado de CRITICAL)
**Ubicacion:** `db.ts` — `authenticate()`
**Mitigacion:** PostgREST valida JWT en primera DB query. Exp checked locally. Admin routes use getUser().
**Riesgo residual:** Rutas sin DB query (Gemini, Mux, Stripe).
**Estado:** Mitigado

---

## BUG-003: RLS deshabilitado en tablas criticas (Database)

**Severidad:** CRITICAL
**Mitigacion:** Backend enforces via `checkContentScope()`. RPCs revocados de authenticated role.
**Riesgo:** Acceso directo con anon key bypasea backend.
**Estado:** Pendiente (parcialmente mitigado)

---

## BUG-004: CORS origin wildcard (Backend)

**Severidad:** HIGH
**Ubicacion:** `index.ts` — CORS middleware
**Descripcion:** CORS fue restringido (commit `33eb56e`, 2026-03-06) pero **revertido a `"*"`** para desarrollo MVP.
**Estado:** **NOT FIXED — wildcard activo en produccion**

---

## ~~BUG-005: Study Queue con queries secuenciales~~ FIXED
## BUG-006: Content Tree filtra inactivos en JS — Pendiente (MEDIUM)
## BUG-007: Search hace queries excesivas — Parcialmente mitigado (MEDIUM)
## ~~BUG-008: Reorder hace N updates individuales~~ FIXED
## BUG-009: `flashcards.keyword_id` nullable vs required — By design
## ~~BUG-010: Build del frontend roto~~ FIXED
## BUG-011: Tablas basura `kv_store_*` — Pendiente (LOW)

---

## NUEVOS (encontrados en audit pass 12 — 2026-03-14)

### BUG-012: quizzesEntityApi envia campo que backend no soporta

**Severidad:** LOW
**Ubicacion:** `src/app/services/quizzesEntityApi.ts`
**Descripcion:** Frontend envia `time_limit_seconds` en createQuiz/updateQuiz, pero backend NO tiene esa columna en `quizzes` table ni en createFields/updateFields del CRUD factory. El campo es silenciosamente ignorado.
**Fix:** Backend needs: `ALTER TABLE quizzes ADD COLUMN time_limit_seconds INTEGER;` + add to createFields + updateFields.
**Estado:** Frontend adelantado al backend

---

### BUG-013: GamificationContext es un STUB vacio

**Severidad:** MEDIUM
**Ubicacion:** `src/app/context/GamificationContext.tsx`
**Descripcion:** El GamificationProvider exporta un context con TODOS los metodos como no-ops (refresh, triggerBadgeCheck, dismissLevelUp, dismissNewBadges). `totalXp=0`, `level=1`, `streak=null`, `newBadges=[]`. Los componentes QuizResults, QuizTaker, useQuizGamificationFeedback importan de este context y reciben datos vacios.
**Workaround:** `useGamification.ts` hook (React Query) es la implementacion REAL y funciona correctamente. Solo el Context provider esta hueco.
**Fix:** Sprint G5 — reemplazar stub con GamificationProvider real que use gamificationApi.
**Estado:** Pendiente (TODO Sprint G5)

---

### BUG-014: apiConfig.ts tiene logica de fetch duplicada

**Severidad:** LOW (tech debt)
**Ubicacion:** `src/app/services/apiConfig.ts`
**Descripcion:** `realRequest()` y `figmaRequest()` duplican exactamente la misma logica que `lib/api.ts apiCall()` (mismo fetch, mismos headers, mismo envelope unwrap, mismo GET dedup). Ambos existen en paralelo. Algunos archivos legacy importan de apiConfig, otros de lib/api.
**Riesgo:** Si se cambia la logica en uno, se olvida el otro.
**Fix:** Migrar todos los importadores de apiConfig a lib/api.ts y eliminar las funciones duplicadas.
**Estado:** Tech debt (backward compat)

---

### BUG-015: aiFlashcardGenerator.ts es dead code

**Severidad:** LOW
**Ubicacion:** `src/app/services/aiFlashcardGenerator.ts`
**Descripcion:** `generateFlashcardsForKeywords()` llama a `aiGenerateFlashcards()` de studentApi, que esta DEPRECATED y retorna `{ flashcards: [] }` siempre. El flujo real es `aiService.generateSmart()` o `adaptiveGenerationApi.generateAdaptiveBatch()`. Este archivo solo existe para SmartFlashcardGenerator.tsx backward compat.
**Fix:** Eliminar archivo y migrar SmartFlashcardGenerator a usar adaptiveGenerationApi.
**Estado:** Dead code

---

### BUG-016: Tipos duplicados para kw-student-notes y text-annotations

**Severidad:** LOW (confusing)
**Ubicacion:** `studentNotesApi.ts` vs `studentSummariesApi.ts` + `textAnnotationsApi.ts` vs `studentSummariesApi.ts`
**Descripcion:** Dos service files definen tipos diferentes para el mismo endpoint `/kw-student-notes`. studentNotesApi usa `content` + `note_type` fields; studentSummariesApi usa `note` field sin `note_type`. Mismo overlap para `/text-annotations`: textAnnotationsApi tiene `selected_text`, `annotation_type`, `chunk_id`; studentSummariesApi tiene version simplificada con `start_offset`/`end_offset`.
**Riesgo:** Desarrollador usa el tipo incorrecto y envia campos que backend ignora, o no envia campos requeridos.
**Fix:** Designar UNA de las dos como canonical y deprecar la otra.
**Estado:** Tech debt

---

### BUG-017: supabase.ts tiene ANON_KEY hardcodeado

**Severidad:** MEDIUM (security hygiene)
**Ubicacion:** `src/app/lib/supabase.ts`
**Descripcion:** `SUPABASE_URL` y `SUPABASE_ANON_KEY` estan hardcodeados directamente en el source code en vez de usar `import.meta.env.VITE_SUPABASE_URL`. La anon key es publica por diseno (Supabase docs), pero hardcodearla impide usar diferentes projects para staging/production.
**Riesgo:** No se puede hacer multi-environment sin rebuild. Expone URL de produccion en source control.
**Fix:** Mover a env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` con fallback a los valores actuales.
**Estado:** Pendiente

---

## Resumen por Severidad

| Severidad | Pendientes | IDs |
|---|---|---|
| CRITICAL | 1 | BUG-003 |
| HIGH | 2 | BUG-001, BUG-004 |
| MEDIUM | 4 | BUG-002, BUG-006, **BUG-013**, **BUG-017** |
| LOW | 5 | BUG-011, **BUG-012**, **BUG-014**, **BUG-015**, **BUG-016** |
| FIXED | 4 | BUG-005, BUG-008, BUG-010 |
| By Design | 1 | BUG-009 |

---

## Gamificacion — Todos resueltos (2026-03-13)

G-001 to G-015, A-001 to A-014, B-001 to B-004, D-1 to D-6, S3-001 to S3-004. Todos FIXED.

## Frontend — Todos resueltos (2026-03-13/14)

AUTH-DUAL, LAYOUT-V1, LAYOUT-MOBILE, STALE-CHUNK. Todos FIXED.
