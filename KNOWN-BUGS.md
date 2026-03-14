# Axon v4.5 - Known Bugs

> Bugs confirmados contra el schema real de la DB y el codigo del backend/frontend.
>
> **Ultima actualizacion:** 2026-03-14 (audit pass 12 — 155 frontend files read)

---

## Severidad

| Nivel | Significado |
|---|---|
| CRITICAL | Seguridad comprometida o datos corruptos |
| HIGH | Funcionalidad rota o performance grave |
| MEDIUM | Funcionalidad degradada |
| LOW | Inconveniente menor |

---

## BUG-001: `resolution_tier` vs `max_resolution` (Backend) — HIGH, Pendiente
## BUG-002: JWT sin verificacion criptografica local — MEDIUM, Mitigado
## BUG-003: RLS deshabilitado en tablas criticas — CRITICAL, Parcialmente mitigado
## BUG-004: CORS origin wildcard `"*"` — HIGH, NOT FIXED
## ~~BUG-005~~ FIXED | BUG-006 MEDIUM Pendiente | BUG-007 MEDIUM Parcial
## ~~BUG-008~~ FIXED | BUG-009 By Design | ~~BUG-010~~ FIXED | BUG-011 LOW Pendiente

---

## Encontrados en audit pass 12 (2026-03-14)

### BUG-012: quizzesEntityApi envia campo que backend no soporta — LOW
Frontend envia `time_limit_seconds` en createQuiz/updateQuiz pero backend NO tiene esa columna.

### BUG-013: GamificationContext es un STUB vacio — MEDIUM
Todos los metodos son no-ops. `useGamification.ts` (React Query) es la impl real. TODO Sprint G5.

### BUG-014: apiConfig.ts tiene logica de fetch duplicada — LOW
`realRequest()`/`figmaRequest()` duplican `lib/api.ts apiCall()`. Backward compat.

### BUG-015: aiFlashcardGenerator.ts es dead code — LOW
Wraps deprecated `aiGenerateFlashcards()` que retorna `[]`. SmartFlashcardGenerator.tsx backward compat.

### BUG-016: Tipos duplicados para kw-student-notes y text-annotations — LOW
`studentNotesApi.ts` vs `studentSummariesApi.ts` definen tipos diferentes para el mismo endpoint.

### BUG-017: supabase.ts tiene ANON_KEY hardcodeado — MEDIUM
No usa `import.meta.env.VITE_SUPABASE_URL`. Impide multi-environment sin rebuild.

### BUG-018: useSummaryPersistence usa fallback 'demo-student-001' — MEDIUM
**Ubicacion:** `hooks/useSummaryPersistence.ts` linea: `const sid = studentId || 'demo-student-001'`
**Riesgo:** Si AuthContext no provee studentId (timeout, error de red, logout parcial), TODOS los datos de estudio se escriben a un ID compartido. Datos de un estudiante pueden sobreescribir datos de otro.
**Fix:** No usar fallback — si no hay studentId, no guardar (o mostrar error).

### BUG-019: Dos implementaciones de content tree (hook vs context) — LOW
**Ubicaciones:** `hooks/useContentTree.ts` y `context/ContentTreeContext.tsx`
**Diferencia funcional:**
- Hook: GET /content-tree + GET /memberships → filtra por courses del profesor
- Context: GET /content-tree solamente → muestra todos los courses
**Riesgo:** Confusing para devs. Si se cambia logica en uno, se olvida el otro.
**Uso actual:** Hook usado por cascade selectors de professor. Context usado por student views + platform.
**Nota:** No es un bug funcional — es tech debt por tener dos code paths.

---

## Resumen por Severidad

| Severidad | Pendientes | IDs |
|---|---|---|
| CRITICAL | 1 | BUG-003 |
| HIGH | 2 | BUG-001, BUG-004 |
| MEDIUM | 5 | BUG-002, BUG-006, BUG-013, BUG-017, **BUG-018** |
| LOW | 6 | BUG-011, BUG-012, BUG-014, BUG-015, BUG-016, **BUG-019** |
| FIXED | 4 | BUG-005, BUG-008, BUG-010 |
| By Design | 1 | BUG-009 |

---

## Gamificacion — Todos resueltos (2026-03-13)
G-001 to G-015, A-001 to A-014, B-001 to B-004, D-1 to D-6, S3-001 to S3-004.

## Frontend — Todos resueltos (2026-03-13/14)
AUTH-DUAL, LAYOUT-V1, LAYOUT-MOBILE, STALE-CHUNK.
