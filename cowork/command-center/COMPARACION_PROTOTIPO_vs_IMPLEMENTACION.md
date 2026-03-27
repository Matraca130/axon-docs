# Comparación: Prototipo vs Implementación — Student Summary View

**Fecha:** 2026-03-27
**Status:** Auditado por 10 agentes en paralelo — listo para ejecución
**Decisor:** Petrick (Tech Lead)

---

## Hallazgo Crítico de Arquitectura

> **El SummaryViewer (vista por bloques) existe y funciona, pero está anidado dentro del viejo StudentSummaryReader como contenido del tab "Contenido" por defecto.**

### Ruta completa del estudiante (verificada por auditoría)

```
URL: /student/summary/:topicId
  ↓
SummaryView.tsx (role check: isProfessor?)
  ↓ (student path)
StudentSummaryReader.tsx (1200+ líneas, 4 tabs)
  ↓
Tabs:
  ├─ Tab "Contenido" (DEFAULT) → ReaderChunksTab.tsx
  │     ├─ if hasBlocks → SummaryViewer.tsx ← BLOQUES AQUÍ
  │     └─ else → chunks HTML + KeywordHighlighter
  ├─ Tab "Keywords" → ReaderKeywordsTab.tsx
  ├─ Tab "Videos" → VideoPlayer.tsx
  └─ Tab "Mis Notas" → ReaderAnnotationsTab.tsx
```

**Corrección post-auditoría:** El framing original ("enterrado como sub-tab") era parcialmente engañoso. SummaryViewer ES el contenido default del primer tab cuando hay bloques — no está arbitrariamente escondido. Pero sigue siendo un tab dentro de un reader legacy, no una experiencia full-page dedicada como el prototipo.

### Problema adicional: Layout 2D vs Vertical Stack

> **RIESGO CRÍTICO descubierto en auditoría:** SummaryViewer usa posicionamiento absoluto (`position_x`, `position_y`) en desktop — diseñado para un **editor canvas**, no para lectura secuencial.

| Aspecto | Absolute Positioning (actual) | Vertical Stack (prototipo) |
|---------|-------------------------------|---------------------------|
| Caso de uso | Editor canvas | Lector de documentos |
| Scroll-spy | Frágil (bloques pueden solapar) | Natural |
| Mobile | Requiere dual layout | Layout único |
| Datos API | Necesita position_x/y/width/height | Solo order_index |
| Sidebar | Funciona pero confuso | Perfecto |

**Decisión requerida en Oleada 0:** Cambiar a vertical stack para lectura.

---

## Matriz de Comparación Feature-by-Feature

### Block Renderers (11 tipos + 2 utilities) — AUDITADOS

| Feature | Prototipo | Implementación | Parity Level |
|---------|-----------|----------------|-------------|
| ProseBlock | ✅ | ✅ 30 líneas + tests | **EXACT** |
| KeyPointBlock | ✅ | ✅ 32 líneas + tests | **EXACT** |
| StagesBlock | ✅ | ✅ 72 líneas + tests | **EXACT** |
| ComparisonBlock | ✅ | ✅ 75 líneas + tests | **CLOSE** — spacing Tailwind vs inline |
| ListDetailBlock | ✅ | ✅ 80 líneas + tests | **CLOSE** — badges de severidad diferentes (dots vs labels) |
| GridBlock | ✅ | ✅ 60 líneas + tests | **EXACT** — agrega responsive (mejora) |
| TwoColumnBlock | ✅ | ✅ 52 líneas + tests | **CLOSE** — agrega borders y responsive |
| CalloutBlock (5 variants) | ✅ | ✅ 77 líneas + tests | **CLOSE** — font sizes ligeramente ajustados |
| ImageReferenceBlock (STUDENT) | ✅ display | ✅ 39 líneas | **EXACT** para lectura |
| ImageReferenceBlock (EDITOR) | ✅ upload/resize/drag | ❌ solo display | **GAP** — falta editor completo (upload, resize handles, position toggle) |
| SectionDividerBlock | ✅ | ✅ 17 líneas + tests | **EXACT** |
| KeywordChip | ✅ | ✅ 92 líneas | **CLOSE** — popover width 320→288px, agrega click handler |
| renderTextWithKeywords | ✅ | ✅ 34 líneas | **CLOSE** — lógica equivalente |

**Veredicto auditado: 6 EXACT + 6 CLOSE + 1 GAP (editor only). Para la vista del estudiante, 12/12 funcionales.**

---

### 3 Bugs Visibles — ROOT CAUSE Identificado

> **Los 3 bugs tienen la misma raíz:** `renderTextWithKeywords.tsx` solo parsea `{{keywords}}` y `\n\n` — ignora TODO markdown.

| Bug | Root Cause | Fix Complexity |
|-----|-----------|---------------|
| `[Imagen: ...]` como texto | `renderTextWithKeywords.tsx` no parsea markdown images ni `[Imagen:]` custom | **Media** |
| `**bgb**` no bold | No hay parser de inline markdown (bold, italic, code) | **Fácil-Media** |
| `---` como texto | No detecta horizontal rules en contenido de bloques | **Fácil** |

**Fix unificado:** Agregar parser de inline markdown a `renderTextWithKeywords()` — resuelve los 3 bugs en un solo cambio.

---

### Layout y Navegación

| Feature | Prototipo | Implementación | Estado |
|---------|-----------|----------------|--------|
| Vista full-page por bloques | ✅ Vertical stack | ❌ Tab dentro de reader legacy + layout 2D en desktop | **GAP CRÍTICO** |
| SidebarOutline (collapsible) | ✅ Scroll-spy, íconos por tipo | ❌ No existe como componente | **GAP** |
| ReadingProgress bar | ✅ Scroll-based | ❌ No existe (pero `scroll_position` field existe en API reading-states) | **GAP** |
| Scroll-spy (sección activa) | ✅ IntersectionObserver | ❌ `useSummaryViewer.ts` HUÉRFANO confirmado — 0 imports | **GAP** |

---

### Features de Estudio por Bloque

| Feature | Prototipo | Implementación | API Status | Estado |
|---------|-----------|----------------|-----------|--------|
| BookmarkButton | ✅ Toggle | ❌ No existe | **NEW API NEEDED** — no hay tabla ni endpoint | **GAP** |
| TTSButton | ✅ Web Speech API | ❌ No existe | FRONTEND_ONLY | **GAP** |
| BlockQuizModal | ✅ MC per-block | ❌ No per-block (QuizTaker es quiz completo) | EXISTING (puede necesitar block_id) | **GAP** |
| MasteryBar | ✅ 5 niveles | ❌ No hay componente visual | EXISTING (`/bkt-states` + client-side avg) | **GAP** |
| DrawingCanvas | ✅ Pen/eraser | ❌ No existe | NEW API si persistente | **GAP (baja prioridad)** |

---

### Features de Anotación y Búsqueda — AUDITADAS

| Feature | Prototipo | Implementación | Estado | Detalle auditoría |
|---------|-----------|----------------|--------|-------------------|
| AnnotationsPanel | ✅ Per-block notes | 🟡 Summary-level CRUD | **PARCIAL** | Divergencia arquitectónica: prototipo=per-block, impl=per-summary con character offsets. Backend CRUD funciona. |
| HighlightToolbar | ✅ 5 colores | 🟡 `TextHighlighter.tsx` (422 líneas) — 4 colores | **PARCIAL** | **TextHighlighter existe pero NO ESTÁ INTEGRADO** en ReaderChunksTab. Código completo (selection→toolbar→CRUD) pero no se usa. Falta color naranja. |
| SearchBar UI | ✅ Ctrl+F + count | 🟡 `useSearch.ts` huérfano (0 imports) | **PARCIAL** | Hook funcional pero ningún componente lo importa. |
| BookmarksPanel | ✅ Lista | ❌ No existe | **GAP** | Depende de nuevo BookmarkButton + API |

---

### Features de Configuración

| Feature | Prototipo | Implementación | API Status | Estado |
|---------|-----------|----------------|-----------|--------|
| ReadingSettingsPanel | ✅ Font/spacing/family | ❌ No existe | **NEW API NEEDED** (`/student-preferences`) | **GAP** |
| StudyTimer (Pomodoro) | ✅ 25/5 ciclos | 🟡 `useSummaryTimer.ts` HUÉRFANO (0 imports), timer básico sin Pomodoro | FRONTEND_ONLY | **PARCIAL** |
| Dark Mode toggle | ✅ Toggle + tokens | ❌ No hay toggle (pero `useUI()` context con `theme` dark/light EXISTE y está conectado) | **NEW API** (`/student-preferences` theme field) | **GAP** |
| Focus Mode | ✅ Blur no-activos | ❌ No existe | FRONTEND_ONLY | **GAP** |

---

### Infraestructura — Design Tokens AUDITADOS

| Feature | Prototipo | Implementación | Estado | Detalle auditoría |
|---------|-----------|----------------|--------|-------------------|
| Tokens LIGHT | ✅ Objeto unificado | 🟡 **DISPERSOS en 6 archivos**: `colors.ts`, `palette.ts`, `dk-tokens.ts`, `mastery-colors.ts`, `section-colors.ts`, `theme.css` | **PARCIAL** | Tokens existen pero no están unificados |
| Tokens DARK | ✅ Objeto unificado | ❌ No centralizado (CalloutBlock usa `dark:` classes hardcoded) | **GAP** |
| Tokens MASTERY | ✅ 5 niveles | 🟡 **DUPLICADOS**: `colors.ts` (5 niveles) vs `mastery-colors.ts` (6 niveles, agrega SLATE) | **PARCIAL** — consolidar |
| Tokens CALLOUT | ✅ 5 variants | ✅ Hardcoded en `CalloutBlock.tsx` con 5 variants + dark mode | **CLOSE** — falta centralizar |
| Tokens SEVERITY | ✅ mild/moderate/critical | ❌ No existe en implementación | **GAP** |
| useUndoRedo | ✅ | ✅ Existe | **MATCH** |
| useToast | ✅ Custom | ✅ `sonner` library | **MATCH** |
| ImageLightbox | ✅ | ✅ 246 líneas | **MATCH** |
| Keyboard shortcuts | ✅ Ctrl+F/Z/Esc | ❌ No implementados para bloques | **GAP** |

---

## 4 Hooks Huérfanos Confirmados

La auditoría verificó que estos hooks están completos pero **ningún componente los importa**:

| Hook | Líneas | Diseñado para | Status |
|------|--------|---------------|--------|
| `useSummaryViewer.ts` | 137 | Zoom, fullscreen, scroll-spy, tool selection | **HUÉRFANO** — SummaryViewer.tsx reimplementa state localmente |
| `useSummaryTimer.ts` | 47 | Timer básico con pause/reset | **HUÉRFANO** — ningún componente lo usa |
| `useSearch.ts` | 99 | Búsqueda debounced (300ms) | **HUÉRFANO** — false positives en grep (`useSearchParams` ≠ `useSearch`) |
| `useSummaryPersistence.ts` | 190 | Auto-save anotaciones, mastery, notas, timer a Supabase | **HUÉRFANO** — diseñado como companion de useSummaryTimer |

**Hooks SÍ conectados:**
- `useUI()` — theme dark/light, sidebar state — activamente usado en 6+ archivos
- `useReadingTimeTracker()` — tracking persistente con 4-layer save — usado en StudentSummaryReader

---

## Resumen Cuantitativo (post-auditoría)

| Categoría | Total | Exact/Match | Close/Parcial | Gap |
|-----------|-------|-------------|---------------|-----|
| Block Renderers (student view) | 12 | **6** | **6** | 0 |
| Layout/Navegación | 4 | 0 | 0 | 4 |
| Features por Bloque | 5 | 0 | 0 | 5 |
| Anotación/Búsqueda | 4 | 0 | 3 | 1 |
| Configuración | 4 | 0 | 1 | 3 |
| Infraestructura | 9 | 3 | 3 | 3 |
| **TOTAL** | **38** | **9 (24%)** | **13 (34%)** | **16 (42%)** |

---

## Backend API Requirements (auditoría)

| Feature | Status | Detalle |
|---------|--------|---------|
| Block renderers | EXISTING | `GET /summary-blocks` completo |
| Reading state | EXISTING | `scroll_position` field existe |
| Mastery data | EXISTING | `/bkt-states` + client-side aggregation |
| Text annotations | EXISTING | CRUD completo (puede necesitar optional `block_id`) |
| Quiz per-block | EXISTING (parcial) | Endpoints existen, puede necesitar `block_id` field |
| **Bookmarks** | **NEW NEEDED** | POST/GET/DELETE `/block-bookmarks` — tabla nueva |
| **Student preferences** | **NEW NEEDED** | GET/PUT `/student-preferences` (theme, font, etc.) |
| Drawing persistence | NEW (si persistente) | Defer — canvas puede ser local-only en MVP |

---

## Ranking por Impacto Educativo (auditoría UX)

### Tier 1 — Fundamentales para aprendizaje

| # | Feature | Impacto | Oleada |
|---|---------|---------|--------|
| 1 | **SidebarOutline** | Schema building — el estudiante necesita ver la estructura conceptual | 1 |
| 2 | **MasteryBar** | Promesa de FSRS — sin feedback visual, el algoritmo adaptativo es invisible | 1 |
| 3 | **ReadingProgress** | Sesiones largas — "¿voy al 30% o 70%?" para gestión de tiempo | 1 |

### Tier 2 — Alto valor para calidad de estudio

| # | Feature | Impacto | Oleada |
|---|---------|---------|--------|
| 4 | **BookmarkButton** | Recall loops — marcar "re-estudiar esto" | 2 |
| 5 | **BlockQuizModal** | Active recall inmediato post-bloque | 2 |
| 6 | **HighlightToolbar** | Deep processing — ya existe (`TextHighlighter.tsx`), solo integrar | 1 |

### Tier 3 — Moderado

| # | Feature | Impacto | Oleada |
|---|---------|---------|--------|
| 7 | SearchBar UI | Retrieval rápido durante estudio | 1 |
| 8 | StudyTimer Pomodoro | Regulación de atención | 3 |
| 9 | ReadingSettingsPanel | Accesibilidad (dislexia, fatiga visual) | 3 |

### Tier 4 — Nice-to-have

| # | Feature | Impacto | Oleada |
|---|---------|---------|--------|
| 10-16 | TTS, DrawingCanvas, Dark Mode, Shortcuts, Tokens, Focus Mode, BookmarksPanel | Polish | 2-3 |

---

## Plan de Acción — 4 Oleadas (revisado post-auditoría)

> **NOTA HISTÓRICA (2026-03-27):** Este plan de 4 oleadas fue el output original de la auditoría. Fue posteriormente reemplazado por `PLAN_FEATURES_RESTANTES_v2.md` (6 waves) que se ejecutó completo. Las waves 1-6 de ese plan ya están implementadas y mergeadas en `feat/block-based-summaries`. Se conserva esta sección como referencia del análisis original.

### Oleada 0: Arquitectura + Fix Bugs (BLOCKER)

**Objetivo:** Bloques como experiencia principal + fix bugs visibles.

**Cambios:**

1. **SummaryView.tsx** — cuando `!isProfessor && hasBlocks`, renderizar `StudentBlockReader` en lugar de `StudentSummaryReader`

2. **SummaryViewer.tsx** — **CAMBIAR de absolute positioning a vertical stack**
   - Eliminar lógica de `position_x`/`position_y` (desktop)
   - Usar layout vertical para ALL breakpoints (como mobile actual)
   - Esto habilita scroll-spy, sidebar, y progress bar

3. **`renderTextWithKeywords.tsx`** — Agregar parser de inline markdown
   - `**bold**` → `<strong>`, `*italic*` → `<em>`
   - `[Imagen: ...]` → `<img>` o componente ImageReference
   - `---` → `<hr>`

4. **Crear `StudentBlockReader.tsx`** — nuevo wrapper
   - SummaryViewer + toolbar superior
   - Feature flag / URL param para forzar modo legacy

5. **Mantener `StudentSummaryReader`** como fallback para summaries sin bloques

**Complejidad:** Media
**Estimación:** 1 sesión, 2-3 agentes

---

### Oleada 1: Sidebar + Navegación + Progress + MasteryBar

| Componente | Prioridad | Complejidad | Base existente |
|------------|-----------|-------------|----------------|
| SidebarOutline | Tier 1 | Media | `useSummaryViewer.ts` (reescribir para vertical stack) |
| ReadingProgress | Tier 1 | Baja | Nuevo (scroll % + API `scroll_position`) |
| MasteryBar | Tier 1 | Media | Hooks `useKeywordMastery`/`useTopicMastery` + API `/bkt-states` |
| SearchBar UI | Tier 3 | Baja | `useSearch.ts` (hook existe, agregar UI) |
| Integrar TextHighlighter | Tier 2 | Baja | Ya existe (422 líneas), solo wiring |

**Resultado:** Experiencia de lectura navegable con mastery visual.
**Estimación:** 1 sesión, 4 agentes en paralelo

---

### Oleada 2: Toolbar por Bloque + Estudio

| Componente | Prioridad | Complejidad | Backend |
|------------|-----------|-------------|---------|
| BookmarkButton + Panel | Tier 2 | Media | **NUEVO:** tabla + POST/GET/DELETE `/block-bookmarks` |
| BlockQuizModal | Tier 2 | Media | Existente (agregar optional `block_id`) |
| TTSButton | Tier 4 | Baja | FRONTEND_ONLY (Web Speech API) |

**Resultado:** Cada bloque tiene toolbar con bookmark, quiz, TTS.
**Estimación:** 1 sesión, 3 agentes + 1 backend

---

### Oleada 3: Configuración + Polish

| Componente | Prioridad | Complejidad | Backend |
|------------|-----------|-------------|---------|
| ReadingSettingsPanel | Tier 3 | Baja | **NUEVO:** GET/PUT `/student-preferences` |
| StudyTimer Pomodoro | Tier 3 | Media | FRONTEND (crear `usePomodoro` nuevo, no refactorear timer existente) |
| Consolidar Design Tokens | Tier 4 | Media | — |
| Dark Mode toggle | Tier 4 | Media | `useUI()` ya tiene theme — conectar al toggle + tokens |
| Focus Mode | Tier 4 | Baja | FRONTEND (CSS opacity/blur) |
| AnnotationsPanel per-block | Tier 3 | Media | Agregar optional `block_id` a annotations API |
| Keyboard shortcuts | Tier 4 | Baja | FRONTEND |

**Resultado:** Experiencia completa de lectura personalizable.
**Estimación:** 2 sesiones, 4-5 agentes

---

## Riesgos Identificados por Auditoría

### CRÍTICOS (mitigar antes de empezar)

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Layout 2D incompatible con scroll-spy/sidebar | SidebarOutline no funciona con absolute positioning | **Oleada 0: cambiar a vertical stack** |
| 4 hooks huérfanos pueden tener bugs | useSummaryViewer nunca fue testeado en producción | Verificar cada hook antes de integrar; escribir unit test |
| No hay endpoint de bookmarks | Oleada 2 bloqueada sin backend | Crear tabla + endpoints como parte de Oleada 2 |

### MODERADOS

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Annotations per-block vs per-summary | Migración de anotaciones existentes | Grandfather old annotations como read-only; nuevas usan block_id |
| Mastery tokens duplicados (5 vs 6 niveles) | Inconsistencia visual | Consolidar a 5 niveles (alinear con prototipo) en Oleada 3 |
| Branch strategy: 4 oleadas en 1 branch | PR de 1000+ líneas | Sub-branches por oleada: `feat/student-block-reader/wave-0`, `/wave-1`, etc. |

### ACCESIBILIDAD

| Issue | Severidad | Fix |
|-------|-----------|-----|
| MasteryBar solo color (sin texto) | Alta | Agregar labels: "Por descubrir" / "Emergente" / "Consolidado" / etc. |
| Highlight toolbar invisible para screen readers | Alta | `role="tooltip"` + aria-live region |
| Block focus management al click sidebar | Media | `focus()` en bloque destino después de scroll |

---

## MVP Definition (auditoría UX)

**Oleada 0 + Oleada 1 = MVP funcional** que entrega ~80% del valor:

- ✅ Bloques como vista principal (no sub-tab)
- ✅ Vertical stack para lectura natural
- ✅ Sidebar para schema building
- ✅ Progress bar para sesiones largas
- ✅ MasteryBar para feedback de FSRS
- ✅ SearchBar para navegación rápida
- ✅ TextHighlighter integrado
- ✅ Fix de 3 bugs de rendering markdown

**Estimación MVP:** 2 sesiones Claude Code (~2 semanas)
**Estimación total (4 oleadas):** 5 sesiones (~4-5 semanas)

---

## Branch Strategy (revisada)

```
feat/student-block-reader          ← integration branch
  ├─ feat/student-block-reader/wave-0-arch     ← PR #1
  ├─ feat/student-block-reader/wave-1-nav      ← PR #2 (depends on #1)
  ├─ feat/student-block-reader/wave-2-toolbar   ← PR #3
  └─ feat/student-block-reader/wave-3-config    ← PR #4
```

PRs incrementales, merges a `feat/student-block-reader`, luego PR final a `main`.

---

## Cognitive Load — Progressive Disclosure (auditoría UX)

El prototipo muestra 13 botones en el header. Recomendación:

**Siempre visible (Tier 1-2):** Sidebar toggle, Progress, Search, Mastery toggle, Dark mode
**En menú dropdown "Herramientas":** Highlight mode, Annotations, Timer, Settings
**Oculto (power users):** Undo/Redo, Drawing, Focus mode, Keyboard shortcuts help
