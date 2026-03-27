# Plan Maestro Axon — v1

> **Fecha:** 2026-03-27
> **Autor:** Petrick + Claude (Cowork)
> **Estado:** Listo para ejecución
> **Sistema:** Agent Teams (TeamCreate → Agents → Quality Gate → TeamDelete)
> **Scheduling:** Cowork scheduled tasks para seguimiento automatizado

---

## Estado Actual del Proyecto

### Completado
- [x] Summaries block-based: 6 waves implementadas en `feat/block-based-summaries`
- [x] Migración repos a `C:\dev\axon\` (fuera OneDrive)
- [x] Auditoría 10 agentes: COMPARACION corregida y coherente
- [x] Auditoría landings: 100+ landings + 10 patrones documentados
- [x] Decisión: landing en español, target UNLP

### En Curso
- [ ] Landing v3 institucional (HTML en progreso)

### No Ejecutado (planes listos)
- [ ] Flashcard bug fixes (5 bugs, plan en PLAN_FLASHCARD_PIPELINE_v1.md)
- [ ] Flashcard image pipeline (Gemini + DB + frontend)
- [ ] Merge `feat/block-based-summaries` → `main`

### Pendientes Menores
- [ ] DrawingCanvas (wave 5b) — baja prioridad, pospuesto
- [ ] Tests para useUndoRedo
- [ ] Flashcard rebrand visual
- [ ] Bug registry review (axon-docs/KNOWN-BUGS.md)

---

## Mapa de Branches

```
main (producción)
  │
  ├── feat/block-based-summaries ← MERGE PENDIENTE (6 waves completas)
  │
  ├── fix/flashcard-generation-bugs ← CREAR (Sesión 2)
  │     └── 5 bugs: BH-ERR-019, 033, 021, 024, 032
  │
  ├── feat/flashcard-image-pipeline ← CREAR post-merge fix (Sesión 3)
  │     └── Gemini images + DB migration + FlashcardImage component
  │
  └── feat/landing-v3-institutional ← CREAR (Sesión 4)
        └── Landing HTML español + hero animado
```

**Regla:** Cada branch se trabaja en worktree aislado. Nunca checkout en repo principal.

---

## Plan de Ejecución — 5 Sesiones

---

### SESIÓN 1: Merge feat/block-based-summaries → main

> **Prioridad:** BLOCKER — todo lo demás depende de main actualizado
> **Dónde:** GitHub (browser) + Cowork verificación
> **Duración:** ~30 min

#### Checklist

| # | Tarea | Responsable | Herramienta | Status |
|---|-------|-------------|-------------|--------|
| 1.1 | `git pull origin main` en frontend | Petrick | CLI | ☐ |
| 1.2 | `git pull origin feat/block-based-summaries` | Petrick | CLI | ☐ |
| 1.3 | Verificar `npm run build` en feat branch (0 errors) | Petrick | CLI | ☐ |
| 1.4 | Verificar `npm run test` (tests pasan) | Petrick | CLI | ☐ |
| 1.5 | Crear PR `feat/block-based-summaries` → `main` en GitHub | Petrick | Browser | ☐ |
| 1.6 | Review rápido del diff (tamaño, archivos inesperados) | Cowork Agent | Agent Team | ☐ |
| 1.7 | Merge PR | Petrick | Browser | ☐ |
| 1.8 | Verificar deploy Vercel exitoso | Petrick | Vercel dashboard | ☐ |
| 1.9 | Smoke test en producción (navegar summary con bloques) | Petrick | Browser | ☐ |
| 1.10 | Actualizar `project_current_state.md` | Cowork | Auto-memory | ☐ |

---

### SESIÓN 2: Fix Flashcard Generation Bugs

> **Branch:** `fix/flashcard-generation-bugs` desde `main` (post-merge Sesión 1)
> **Prerequisito:** Sesión 1 completada
> **Duración:** ~1-2 horas
> **Dónde:** Claude Code CLI desde `C:\dev\axon\frontend`

#### Agent Team: `flashcard-bugfix`

| Agent | ID | Rol | Archivos | Aislamiento |
|-------|----|-----|----------|-------------|
| infra-ui | IF-05 | Bug 1: ensureGeneralKeyword() corrompe DB | `src/app/lib/api.ts` (~L288) | worktree |
| flashcards-frontend | FC-01 | Bug 2: FlashcardFormModal .id sobre string | `FlashcardFormModal.tsx` (~L256) | worktree |
| flashcards-keywords | FC-05 | Bugs 3+4: MasteryLevel + KeywordCollection tipos | `types/keywords.ts`, `legacy-stubs.ts`, `useKeywordMastery.ts`, `aiFlashcardGenerator.ts` | worktree |
| flashcards-generation | FC-06 | Bug 5: Dead exports en adaptiveGenerationApi | `adaptiveGenerationApi.ts` | worktree |
| quality-gate | XX-02 | Auditoría post-fix | — | — |

#### Fases de Ejecución

```
Fase 1 (investigación):  IF-05 verifica qué retorna GET /keywords?summary_id=xxx
                          → ¿Array o paginado {items, total, limit, offset}?

Fase 2 (paralelo):       IF-05 + FC-01 + FC-05 + FC-06 (archivos sin overlap)

Fase 3 (quality-gate):   XX-02 audita: npm run build + npm run test + review changes

Fase 4 (cierre):         Commit → push → PR
```

#### Checklist

| # | Tarea | Agent | Status |
|---|-------|-------|--------|
| 2.1 | Worktree: `source /c/dev/axon/worktree.sh frontend fix/flashcard-generation-bugs` | XX-01 | ☐ |
| 2.2 | `git pull origin main` antes de branchar | XX-01 | ☐ |
| 2.3 | TeamCreate("flashcard-bugfix") | XX-01 | ☐ |
| 2.4 | IF-05 investiga response shape de GET /keywords | IF-05 | ☐ |
| 2.5 | IF-05 fix: `.items.find()` o `extractItems()` en api.ts | IF-05 | ☐ |
| 2.6 | FC-01 fix: eliminar `.id` — usar retorno directo | FC-01 | ☐ |
| 2.7 | FC-05 fix: tipo canónico MasteryLevel en keywords.ts | FC-05 | ☐ |
| 2.8 | FC-05 fix: unificar KeywordCollection type | FC-05 | ☐ |
| 2.9 | FC-06 fix: eliminar dead exports (MAX_CONCURRENT, RECOMMENDED_MAX, SmartMetadata) | FC-06 | ☐ |
| 2.10 | XX-02: `npm run build` → 0 errors TypeScript | XX-02 | ☐ |
| 2.11 | XX-02: `npm run test` → flashcard tests pasan | XX-02 | ☐ |
| 2.12 | XX-02: verificar no hay regresiones en otros módulos | XX-02 | ☐ |
| 2.13 | Commit con mensaje descriptivo | XX-01 | ☐ |
| 2.14 | `git push -u origin fix/flashcard-generation-bugs` | XX-01 | ☐ |
| 2.15 | TeamDelete("flashcard-bugfix") | XX-01 | ☐ |
| 2.16 | Crear PR en GitHub | Petrick | ☐ |
| 2.17 | Merge PR → main | Petrick | ☐ |
| 2.18 | Validar en SQL: `SELECT count(*) FROM keywords WHERE term='General' GROUP BY summary_id HAVING count(*)>1` → 0 rows | Petrick | ☐ |

#### Prompt para Claude Code CLI

```
Eres XX-01 (Arquitecto). Lee AGENT-REGISTRY.md y project_current_state.md.

source /c/dev/axon/worktree.sh frontend fix/flashcard-generation-bugs
git pull origin main

Ejecuta la Oleada A del plan PLAN_FLASHCARD_PIPELINE_v1.md:
- 5 bugs de generación de flashcards (BH-ERR-019, 033, 021, 024, 032)
- Agentes: IF-05, FC-01, FC-05, FC-06 en paralelo → XX-02 quality-gate

Fases:
1. IF-05 investiga qué retorna GET /keywords?summary_id=xxx (¿array o paginado?)
2. Paralelo: IF-05 (api.ts), FC-01 (FlashcardFormModal), FC-05 (tipos), FC-06 (dead exports)
3. XX-02 quality-gate

Al terminar: npm run build (0 errors), commit, git push -u origin fix/flashcard-generation-bugs.
```

---

### SESIÓN 3: Flashcard Image Pipeline (Backend + Frontend)

> **Branch:** `feat/flashcard-image-pipeline` desde `main` (post-merge Sesión 2)
> **Prerequisito:** Sesión 2 mergeada + `GEMINI_API_KEY` en Supabase Vault
> **Duración:** ~3-4 horas (backend + frontend)
> **Dónde:** Claude Code CLI — frontend worktree + backend worktree
> **Spec:** `SPEC_FLASHCARD_IMAGES_PIPELINE.md`, `ESTRATEGIA_AI_GEMINI_CLAUDE.md`

#### Agent Team: `flashcard-images`

**Oleada B — Backend:**

| Agent | ID | Rol | Archivos nuevos |
|-------|----|-----|----------------|
| flashcards-backend | FC-02 | Servicio image generator + ruta API + migración SQL | `flashcard-image-generator.ts`, `flashcard-images.ts` (rutas) |
| ai-backend | AI-05 | Gemini client (gemini-image-client.ts) | `gemini-image-client.ts` |
| quality-gate | XX-02 | Auditoría backend | — |

**Oleada C — Frontend:**

| Agent | ID | Rol | Archivos |
|-------|----|-----|----------|
| flashcards-frontend | FC-01 | FlashcardImage component + integrar en FlashcardCard/Manager | `FlashcardImage.tsx` (NUEVO), mod `FlashcardCard.tsx`, `FlashcardsManager.tsx` |
| flashcards-generation | FC-06 | Hook useFlashcardImage + toggle en SmartFlashcardGenerator | `useFlashcardImage.ts` (NUEVO), mod `SmartFlashcardGenerator.tsx`, `AiGeneratePanel.tsx` |
| quality-gate | XX-02 | Auditoría frontend | — |

#### Fases

```
Oleada B:
  Fase 1: FC-02 ejecuta migración SQL (ALTER TABLE flashcards + 3 tablas nuevas + RLS + Storage bucket)
  Fase 2 (paralelo): AI-05 (Gemini client) + FC-02 (servicio + ruta)
  Fase 3: Integración AI-05 → FC-02
  Fase 4: XX-02 quality-gate backend

Oleada C:
  Fase 5 (paralelo): FC-01 (componente visual) + FC-06 (hook + mutation)
  Fase 6: FC-01 integra hook de FC-06
  Fase 7: XX-02 quality-gate frontend
```

#### Checklist

| # | Tarea | Agent | Status |
|---|-------|-------|--------|
| **Backend** | | | |
| 3.1 | Worktree backend: `source /c/dev/axon/worktree.sh backend feat/flashcard-image-pipeline` | XX-01 | ☐ |
| 3.2 | Ejecutar migración SQL: ALTER TABLE flashcards + 3 tablas nuevas | FC-02 | ☐ |
| 3.3 | Crear RLS policies para tablas nuevas | FC-02 | ☐ |
| 3.4 | Crear Storage bucket `flashcard-images` con policies | FC-02 | ☐ |
| 3.5 | INSERT 6 prompt templates globales (anatomy, pharma, pathology, physio, micro, general) | FC-02 | ☐ |
| 3.6 | Implementar `gemini-image-client.ts` (modelo: gemini-3.1-flash-image-preview) | AI-05 | ☐ |
| 3.7 | Implementar `flashcard-image-generator.ts` (pipeline: prompt → Gemini → Storage → DB) | FC-02 | ☐ |
| 3.8 | Crear ruta: `POST /content/flashcards/:id/generate-image` | FC-02 | ☐ |
| 3.9 | XX-02 quality-gate: `deno test` + review | XX-02 | ☐ |
| **Frontend** | | | |
| 3.10 | Worktree frontend: `source /c/dev/axon/worktree.sh frontend feat/flashcard-image-pipeline` | XX-01 | ☐ |
| 3.11 | Crear `FlashcardImage.tsx` (picture + AVIF/WebP sources + skeleton) | FC-01 | ☐ |
| 3.12 | Crear `useFlashcardImage.ts` (React Query mutation + toast) | FC-06 | ☐ |
| 3.13 | Integrar FlashcardImage en `FlashcardCard.tsx` (thumbnail) | FC-01 | ☐ |
| 3.14 | Integrar FlashcardImage en `FlashcardsManager.tsx` (grid + menú contextual) | FC-01 | ☐ |
| 3.15 | Toggle "Generar con imagen" en `SmartFlashcardGenerator.tsx` | FC-06 | ☐ |
| 3.16 | Progreso visual: "Generando texto... ✓ → Generando imagen... ✓" | FC-06 | ☐ |
| 3.17 | XX-02: `npm run build` → 0 errors | XX-02 | ☐ |
| 3.18 | XX-02: `npm run test` → pasan | XX-02 | ☐ |
| **Cierre** | | | |
| 3.19 | Commit + push ambos repos | XX-01 | ☐ |
| 3.20 | PR frontend + PR backend | Petrick | ☐ |
| 3.21 | Merge ambos PRs | Petrick | ☐ |
| 3.22 | Test manual: POST generate-image → verificar imagen en Storage | Petrick | ☐ |
| 3.23 | Test manual: `{image_url}?format=avif&width=800` → retorna AVIF | Petrick | ☐ |
| 3.24 | Test manual: FlashcardImage muestra thumbnail en grid | Petrick | ☐ |

#### Prompt para Claude Code CLI

```
Eres XX-01 (Arquitecto). Lee AGENT-REGISTRY.md y project_current_state.md.

source /c/dev/axon/worktree.sh frontend feat/flashcard-image-pipeline
git pull origin main

Ejecuta Oleadas B+C del plan PLAN_FLASHCARD_PIPELINE_v1.md:

Oleada B (backend):
- FC-02: migración SQL + servicio flashcard-image-generator + ruta API
- AI-05: Gemini client (gemini-image-client.ts)
- XX-02: quality-gate

Oleada C (frontend):
- FC-01: FlashcardImage.tsx component + integrar en FlashcardCard y FlashcardsManager
- FC-06: useFlashcardImage hook + toggle en SmartFlashcardGenerator
- XX-02: quality-gate

Referencia técnica: SPEC_FLASHCARD_IMAGES_PIPELINE.md (v2 — sin Sharp, Supabase Image Transformations on-demand).

Al terminar: npm run build (0 errors), commit, git push -u origin feat/flashcard-image-pipeline.
```

---

### SESIÓN 4: Landing Institucional v3

> **Branch:** `feat/landing-v3-institutional` (solo frontend o standalone HTML)
> **Prerequisito:** Ninguno (independiente del pipeline de flashcards)
> **Duración:** ~2-3 horas
> **Dónde:** Cowork (diseño + generación) + Claude Code CLI (deploy)
> **Nota:** Esta sesión puede ejecutarse EN PARALELO con Sesiones 2-3

#### Agent Team: `landing-v3`

| Agent | Rol | Tarea |
|-------|-----|-------|
| design-agent | Diseño visual | Hero animado, estructura CCA, 5 feature cards |
| ux-copy | Copy | Textos en español, CTAs, microcopy |
| accessibility | A11y | Audit WCAG 2.1 AA |
| quality-gate | QA | Performance, mobile 375px, Lighthouse |

#### Checklist

| # | Tarea | Responsable | Status |
|---|-------|-------------|--------|
| 4.1 | Definir estructura final CCA (hero, features, social proof, CTA) | Cowork | ☐ |
| 4.2 | Generar video 3-4s con Gemini (neural genesis / scroll-linked) | Cowork | ☐ |
| 4.3 | Construir HTML + Tailwind (single file) | Agent Team | ☐ |
| 4.4 | Integrar video como spritesheet scroll-linked | Agent Team | ☐ |
| 4.5 | UX copy review (español, target UNLP) | ux-copy | ☐ |
| 4.6 | Design critique | design-agent | ☐ |
| 4.7 | Accessibility review (contraste, keyboard nav, touch targets) | accessibility | ☐ |
| 4.8 | Mobile test: 375px, 390px, 414px breakpoints | quality-gate | ☐ |
| 4.9 | Lighthouse: Performance > 90, A11y > 95 | quality-gate | ☐ |
| 4.10 | Deploy a Vercel (o hosting estático) | Petrick | ☐ |

---

### SESIÓN 5: Cleanup + Deuda Técnica

> **Branch:** `fix/cleanup-tech-debt` desde `main`
> **Prerequisito:** Sesiones 1-3 mergeadas
> **Duración:** ~1-2 horas
> **Prioridad:** Baja — ejecutar cuando haya tiempo

#### Checklist

| # | Tarea | Complejidad | Status |
|---|-------|-------------|--------|
| 5.1 | Tests para useUndoRedo | Baja | ☐ |
| 5.2 | DrawingCanvas básico (si se decide implementar) | Media | ☐ |
| 5.3 | Ownership useUndoRedo.ts en AGENT-REGISTRY | Trivial | ☐ |
| 5.4 | Consolidar design tokens (6 archivos → 1 centralizado) | Media | ☐ |
| 5.5 | Consolidar mastery tokens (5 vs 6 niveles → 5 canónico) | Baja | ☐ |
| 5.6 | Integrar TextHighlighter.tsx en student view (si no se hizo en waves) | Media | ☐ |
| 5.7 | Revisar KNOWN-BUGS.md y priorizar fixes pendientes | Baja | ☐ |
| 5.8 | Mobile 375px: validar bento grid no rompe | Baja | ☐ |

---

## Dependencias entre Sesiones

```
Sesión 1 (merge summaries)
    │
    ├──→ Sesión 2 (flashcard bugs) ──→ Sesión 3 (image pipeline)
    │                                        │
    │                                        └──→ Sesión 5 (cleanup)
    │
    └──→ Sesión 4 (landing) ← INDEPENDIENTE, puede ser paralela
```

**Crítico:** Sesión 2 NO puede empezar hasta que Sesión 1 (merge) esté completa. Sesión 3 NO puede empezar hasta que Sesión 2 esté mergeada. Sesión 4 es independiente.

---

## Scheduled Tasks (Cowork)

Usar el sistema de scheduled tasks de Cowork para seguimiento automatizado.
**Para activar:** pegar cada bloque como orden en Cowork o ejecutar via `/schedule`.

---

### Task 1: `axon-daily-status` — Status diario del proyecto

**Cron:** `0 9 * * 1-5` (lunes a viernes, 9:00 AM)

**Orden de creación:**
```
Crea un scheduled task llamado "axon-daily-status" que corra lunes a viernes a las 9 AM con este prompt:
```

**Prompt:**
```
Eres el asistente de proyecto de Petrick para Axon Medical Academy.

1. Lee `.auto-memory/project_current_state.md` para entender el estado actual.
2. Lee `PROJETO DESAROLLO RESUMEN/PLAN_MAESTRO_AXON_v1.md` para identificar cuál es la próxima sesión pendiente.
3. Genera un resumen corto:
   - **Próxima sesión:** (número y nombre)
   - **Prerequisitos:** (listos o pendientes, cuáles)
   - **PRs abiertos:** (si hay alguno por mergear)
   - **Blocker:** (si algo impide avanzar)
4. Si hay PRs abiertos que ya deberían haberse mergeado, recuérdalo como acción urgente.
5. Mantén el reporte a máximo 10 líneas — Petrick prefiere conciso.
```

---

### Task 2: `axon-post-session` — Actualización post-sesión CLI

**Trigger:** Manual (ad-hoc, sin cron)

**Orden de creación:**
```
Crea un scheduled task manual (sin cron) llamado "axon-post-session" con este prompt:
```

**Prompt:**
```
Petrick acaba de terminar una sesión de Claude Code CLI para Axon.

1. Pregunta a Petrick: "¿Qué sesión terminaste y qué se logró?"
2. Con su respuesta:
   a. Actualiza `.auto-memory/project_current_state.md` con lo que se hizo, qué quedó pendiente, y la fecha.
   b. Si hubo bugs nuevos descubiertos, agrégalos al backlog de PLAN_MAESTRO_AXON_v1.md.
   c. Si hubo feedback (correcciones, preferencias), guárdalo como memoria tipo `feedback` en `.auto-memory/`.
   d. Actualiza TASKS.md si corresponde.
3. Confirma a Petrick qué archivos actualizaste.
```

---

### Task 3: `axon-weekly-branches` — Higiene de branches semanal

**Cron:** `0 10 * * 1` (lunes, 10:00 AM)

**Orden de creación:**
```
Crea un scheduled task llamado "axon-weekly-branches" que corra los lunes a las 10 AM con este prompt:
```

**Prompt:**
```
Es lunes — hora de limpiar branches del proyecto Axon.

1. Lee `.auto-memory/project_current_state.md` para ver branches activos esperados.
2. Lee `PROJETO DESAROLLO RESUMEN/PLAN_MAESTRO_AXON_v1.md` para ver el mapa de branches del plan.
3. Genera un reporte:
   - **Branches que deberían existir** (según el plan y estado actual)
   - **Branches que probablemente ya se mergearon** (y deberían borrarse)
   - **Recordatorio:** Verificar worktrees huérfanos en C:\dev\axon\ con `git worktree list`
4. Si hay branches que llevan más de 2 semanas sin actividad, marca como candidatos a borrar.
5. Mantén el reporte breve — máximo 15 líneas.
```

---

### Resumen de Tasks

| Task ID | Tipo | Frecuencia | Propósito |
|---------|------|-----------|-----------|
| `axon-daily-status` | Automático | L-V 9:00 AM | Status del proyecto + próxima acción |
| `axon-post-session` | Manual | Después de cada sesión CLI | Actualizar estado + memoria |
| `axon-weekly-branches` | Automático | Lunes 10:00 AM | Limpiar branches + worktrees |

---

## Métricas de Progreso

| Métrica | Actual | Post-Sesión 3 | Post-Sesión 5 |
|---------|--------|---------------|---------------|
| Summaries en main | ❌ (en feat branch) | ✅ | ✅ |
| Flashcard bugs | 5 abiertos | 0 | 0 |
| Image pipeline | No existe | ✅ Funcional | ✅ |
| Landing v3 | En progreso | En progreso | ✅ (si Sesión 4 done) |
| Tech debt items | 8 pendientes | 8 pendientes | ≤3 |
| Design tokens consolidados | 6 archivos | 6 archivos | 1 centralizado |

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| Merge conflicts feat/block-based-summaries → main | Media | Alto | Hacer merge ASAP (Sesión 1), antes de que main divierja más |
| GEMINI_API_KEY no configurada en Supabase | Baja | Blocker Sesión 3 | Verificar antes de empezar Sesión 3, tener key lista |
| Supabase Image Transformations no habilitadas | Baja | Blocker para AVIF/WebP | Verificar en Supabase dashboard → Settings → Storage |
| Bug 1 (General keyword) ya contaminó datos en prod | Media | Media | Query de validación en checklist 2.18 + script cleanup si hay duplicados |
| Landing video generation falla con Gemini | Media | Media | Fallback: imagen estática con animación CSS |

---

## Backlog (post-Sesión 5)

Estas tareas no tienen sesión asignada — priorizar según necesidad:

| Tarea | Esfuerzo | Dependencia |
|-------|----------|-------------|
| Flashcard rebrand visual completo | Alto | Post image pipeline |
| WhatsApp webhook review-flow | Medio | Independiente |
| Mux video: upload + signed playback | Medio | Independiente |
| Telegram bot: review reminders | Bajo | Independiente |
| Stripe billing: portal auto-servicio | Medio | Independiente |
| Leaderboard público (gamificación) | Medio | Independiente |
| Low-friction onboarding (probar sin registro) | Alto | Post landing |
