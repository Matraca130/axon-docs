# Plan: Features Restantes vs Prototipo — v2 (con Agent System)

> Estado: 2026-03-26 | Branch base: `feat/block-based-summaries`
> Referencia: `Prototipo_Resumenes_Axon_FINAL.jsx` (1902 líneas)
> Sistema: 76 agentes definidos en `.claude/agents/`, orquestados por XX-01 (Arquitecto)

---

## Cómo ejecutar cada oleada

En Claude Code CLI, desde `C:\dev\axon\frontend`:

```bash
# 1. El Arquitecto (XX-01) recibe el prompt de la oleada
# 2. Lee AGENT-REGISTRY.md, project_current_state.md, feedback_agent_isolation.md
# 3. Selecciona agentes, asigna archivos, define fases
# 4. Confirma plan con Petrick
# 5. Lanza agentes via TeamCreate + Agent tool
# 6. Quality Gate (XX-02) audita cada agente al terminar
# 7. Post-mortem automático
```

Cada oleada es un branch desde `feat/block-based-summaries`. Al terminar: `npm run build` → commit → push → PR.

## Regla global anti-movimiento

**TODAS LAS OLEADAS:** NO animaciones que desplacen bloques en hover. La vista del estudiante debe ser estática. Hover effects sutiles (shadow, border-color) OK. Nada de `transform`, `translateY`, o layout shifts en bloques.

---

## Oleada 1 — Fundamentos de Lectura

> Branch: `feat/wave1-reading-foundations`
> Impacto: ★★★★★ | Esfuerzo: Bajo

### Agentes

| Agent | ID | Tarea | Archivos nuevos |
|-------|----|-------|----------------|
| summaries-frontend-v2 | SM-01 | SidebarOutline + integración en SummaryViewer | `student/SidebarOutline.tsx`, modificar `SummaryViewer.tsx` layout |
| design-tokens | IF-07 | ReadingProgress bar + ToastContainer (usa dk-feedback) | `student/ReadingProgress.tsx`, puede extender `dk-feedback.tsx` |
| text-highlighter | SM-06 | SearchBar con highlight de matches | `student/SearchBar.tsx` |
| quality-gate | XX-02 | Auditoría post-implementación | — |

### Fases de ejecución

```
Fase 1 (paralelo): SM-01 + IF-07 + SM-06 (archivos sin overlap)
Fase 2 (secuencial): SM-01 integra los 3 componentes en SummaryViewer.tsx
Fase 3: XX-02 quality-gate
```

### Specs por componente

**SidebarOutline.tsx** (SM-01):
- Sidebar colapsable a la izquierda del contenido
- Lista de bloques con icono por tipo (FileText→prose, Zap→key_point, ArrowRight→stages, Table→comparison, List→list_detail, LayoutGrid→grid, Columns2→two_column, AlertTriangle→callout, Image→image_reference, Minus→section_divider)
- Scroll-spy: resalta el bloque actualmente visible (IntersectionObserver)
- Click → scroll suave (`scrollIntoView({ behavior: 'smooth' })`)
- Toggle collapse con PanelLeftOpen icon
- Dot de color preparado para mastery (Oleada 2) — gris por defecto
- Prototipo: líneas 839-877

**ReadingProgress.tsx** (IF-07):
- Barra fina (3px) en la parte superior del visor
- Color: tealAccent del design system
- Progreso basado en scroll position (no en bloques leídos)
- Prototipo: líneas 1304-1315

**ToastContainer.tsx** (IF-07):
- Stack de toasts en esquina inferior derecha
- Auto-dismiss después de 3s
- Variantes: success (verde), info (azul), warning (amarillo)
- Prototipo: líneas 1330-1345
- Puede reusar/extender `dk-feedback.tsx` si ya tiene toast primitives

**SearchBar.tsx** (SM-06):
- Input con ícono Search, toggle via Ctrl+F o botón en header
- Filtra texto visible en los bloques
- Muestra conteo de resultados ("3 de 7")
- Prototipo: líneas 957-969

---

## Oleada 2 — Mastery por Bloque

> Branch: `feat/wave2-block-mastery`
> Impacto: ★★★★★ | Esfuerzo: Medio
> Prerequisito: endpoint backend que retorne mastery por bloque

### Agentes

| Agent | ID | Tarea | Archivos |
|-------|----|-------|----------|
| study-progress | ST-05 | Hook useSummaryBlockMastery + MasteryBar component | `hooks/queries/useSummaryBlockMastery.ts`, `student/MasteryBar.tsx` |
| summaries-frontend-v2 | SM-01 | Integrar MasteryBar en ViewerBlock + SidebarOutline dots | Modificar `ViewerBlock.tsx`, `SidebarOutline.tsx` |
| summaries-backend-v2 | SM-02 | Endpoint GET /summaries/:id/block-mastery | Backend route + service |
| quality-gate | XX-02 | Auditoría | — |

### Fases

```
Fase 1: SM-02 (backend endpoint)
Fase 2 (paralelo): ST-05 (hook + component) — puede mockear endpoint
Fase 3: SM-01 (integración en viewer)
Fase 4: XX-02
```

### Specs

**MasteryBar.tsx** (ST-05):
- 5 niveles con design tokens del prototipo (líneas 20-42):
  - Por descubrir (gris): mastery < 0.5
  - Emergente (rojo): 0.5 ≤ m < 0.85
  - En progreso (amarillo): 0.85 ≤ m < 1.0
  - Consolidado (verde): m = 1.0
  - Maestría (azul): m > 1.1
- Barra + label + color. Transición de color suave (NO de posición)
- Props: `{ level: number, showLabel?: boolean, size?: 'sm' | 'md' }`

**useSummaryBlockMastery.ts** (ST-05):
- React Query: `GET /content/summaries/:id/block-mastery`
- Returns: `{ block_id: string, mastery_level: number }[]`
- Fallback: todos en 0 si endpoint 404

---

## Oleada 3 — Interacción del Estudiante

> Branch: `feat/wave3-student-interaction`
> Impacto: ★★★★☆ | Esfuerzo: Medio

### Agentes

| Agent | ID | Tarea | Archivos |
|-------|----|-------|----------|
| text-highlighter | SM-06 | AnnotationsPanel por bloque (adaptar ReaderAnnotationsTab) | `student/BlockAnnotationsPanel.tsx` o modificar existente |
| summaries-frontend-v2 | SM-01 | BookmarkButton + BookmarksPanel | `student/BookmarkButton.tsx`, `student/BookmarksPanel.tsx` |
| quiz-frontend | QZ-01 | QuizModal contextual por bloque | `student/BlockQuizModal.tsx` o adaptar `AdaptiveQuizModal.tsx` |
| quality-gate | XX-02 | Auditoría | — |

### Fases

```
Fase 1 (paralelo): SM-06 + SM-01 + QZ-01 (archivos sin overlap)
Fase 2: SM-01 integra los 3 en SummaryViewer/ViewerBlock
Fase 3: XX-02
```

### Specs

**BookmarkButton.tsx** (SM-01):
- Toggle icon: Bookmark ↔ BookmarkCheck
- Persist: localStorage inicialmente, migrar a Supabase después
- Props: `{ blockId: string, isBookmarked: boolean, onToggle: () => void }`
- Prototipo: líneas 1077-1086

**BookmarksPanel.tsx** (SM-01):
- Panel lateral/modal con lista de bloques bookmarked
- Click → scroll al bloque
- Botón remove bookmark
- Prototipo: líneas 1263-1298

**BlockAnnotationsPanel.tsx** (SM-06):
- Verificar primero si `ReaderAnnotationsTab.tsx` (222L) se puede adaptar
- Si no: panel de notas por bloque con textarea + lista + delete
- Persist via Supabase (student_id + block_id)
- Prototipo: líneas 919-952

**BlockQuizModal.tsx** (QZ-01):
- Verificar si `AdaptiveQuizModal.tsx` puede recibir `blockId` como filtro
- Modal con pregunta MC + feedback + explicación
- Actualiza mastery del bloque al responder
- Botón en cada bloque (Brain icon o similar)
- Prototipo: líneas 782-834

---

## Oleada 4 — Experiencia de Estudio

> Branch: `feat/wave4-study-experience`
> Impacto: ★★★☆☆ | Esfuerzo: Bajo

### Agentes

| Agent | ID | Tarea | Archivos |
|-------|----|-------|----------|
| summaries-frontend-v2 | SM-01 | TTSButton (Web Speech API) | `student/TTSButton.tsx` |
| study-dev | ST-?? | StudyTimer (Pomodoro) | `student/StudyTimer.tsx` |
| design-tokens | IF-07 | ReadingSettingsPanel | `student/ReadingSettingsPanel.tsx` |
| quality-gate | XX-02 | Auditoría | — |

### Fases

```
Fase 1 (paralelo): SM-01 + study-dev + IF-07
Fase 2: SM-01 integra en SummaryViewer
Fase 3: XX-02
```

### Specs

**TTSButton.tsx** (SM-01):
- Botón play/pause por bloque
- Web Speech API (`window.speechSynthesis`)
- Extrae texto plano (strip `{{keyword}}` markup)
- Prototipo: líneas 1091-1121

**StudyTimer.tsx** (study-dev):
- Timer Pomodoro: start/pause/reset
- Configurable: 25/50 min
- Toast al terminar
- Floating position o en header
- Prototipo: líneas 1198-1258

**ReadingSettingsPanel.tsx** (IF-07):
- Font size slider (14-22px)
- Line spacing (1.5-2.5)
- Font family (sans/serif)
- TTS velocity
- Persist en localStorage
- Prototipo: líneas 1126-1193

---

## Oleada 5 — Features Avanzadas

> Branch: `feat/wave5-advanced-features`
> Impacto: ★★★☆☆ | Esfuerzo: Alto

### Agentes

| Agent | ID | Tarea | Archivos |
|-------|----|-------|----------|
| design-tokens | IF-07 | Dark mode toggle para resúmenes | Tokens LIGHT/DARK, toggle en SummaryViewer |
| summaries-frontend-v2 | SM-01 | DrawingCanvas overlay por bloque | `student/DrawingCanvas.tsx` |
| quality-gate | XX-02 | Auditoría | — |

### Fases

```
Fase 1 (paralelo): IF-07 + SM-01
Fase 2: XX-02
```

**Nota:** DrawingCanvas es la feature más compleja y menos prioritaria. Puede posponerse indefinidamente si las oleadas 1-4 cubren el MVP.

---

## Oleada 6 — Polish del Editor del Profesor

> Branch: `feat/wave6-editor-polish`
> Impacto: ★★☆☆☆ | Esfuerzo: Medio

### Agentes

| Agent | ID | Tarea | Archivos |
|-------|----|-------|----------|
| summaries-frontend-v2 | SM-01 | Undo/Redo hook + integración en BlockEditor | `hooks/useUndoRedo.ts`, modificar `BlockEditor.tsx` |
| summaries-frontend-v2 | SM-01 | ResizableImage + AI InsertBlockButton | `professor/block-editor/ResizableImage.tsx` |
| quality-gate | XX-02 | Auditoría | — |

---

## Resumen ejecutivo

| Oleada | Features | Agentes | Impacto |
|--------|----------|---------|---------|
| 1 | SidebarOutline, ReadingProgress, Toast, Search | SM-01, IF-07, SM-06 | ★★★★★ |
| 2 | MasteryBar, useSummaryBlockMastery, backend endpoint | ST-05, SM-01, SM-02 | ★★★★★ |
| 3 | Bookmarks, Annotations por bloque, Quiz por bloque | SM-01, SM-06, QZ-01 | ★★★★☆ |
| 4 | TTS, StudyTimer, ReadingSettings | SM-01, study-dev, IF-07 | ★★★☆☆ |
| 5 | Dark mode, DrawingCanvas | IF-07, SM-01 | ★★★☆☆ |
| 6 | Undo/Redo, ResizableImage, AI insert | SM-01 | ★★☆☆☆ |

**Total:** 6 oleadas, ~12 agentes únicos involucrados, cada oleada ejecutable en 1 sesión de Claude Code CLI con el Arquitecto (XX-01) orquestando.

## Prompt para el Arquitecto

Para lanzar una oleada, darle a Claude Code CLI:

```
Eres XX-01 (Arquitecto). Lee AGENT-REGISTRY.md y project_current_state.md.

Ejecuta la Oleada N del plan en docs/PLAN_FEATURES_RESTANTES_v2.md.

Branch: feat/waveN-nombre
Base: feat/block-based-summaries

Regla global: NO animaciones que desplacen bloques en hover.

Lanza los agentes según las fases definidas en el plan.
Al terminar cada agente: XX-02 quality-gate.
Al terminar todo: npm run build, commit, push.
```
