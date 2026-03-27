# Plan: Features Restantes vs Prototipo

> Estado: 2026-03-26 | Branch base: `feat/block-based-summaries` (ya tiene main mergeado)
> Referencia: `Prototipo_Resumenes_Axon_FINAL.jsx` (1902 líneas)

---

## Contexto

El core está listo: 10 renderers de bloques (estudiante), BlockEditor completo (profesor), wiring en SummaryView.tsx. Lo que falta son **features de engagement y estudio** que hacen que la experiencia sea como el prototipo.

## Regla global

- **NO animaciones que desplacen bloques en hover** — la vista del estudiante debe ser estática. Hover effects sutiles (shadow, border-color) OK, pero nada que mueva el layout.
- Cada oleada es un branch independiente (`feat/wave-N-descripcion`) desde `feat/block-based-summaries`
- Cada oleada termina con `npm run build` limpio
- Máximo 3-4 agentes simultáneos por oleada

---

## Oleada 1 — Fundamentos de Lectura (Impacto alto, complejidad baja)

> Branch: `feat/wave1-reading-foundations`
> Agentes: 3 en paralelo

### Agent A: ReadingProgress + ToastContainer
**Archivos nuevos:**
- `src/app/components/student/ReadingProgress.tsx` — Barra de progreso de lectura (scroll-based) en el header del SummaryViewer
- `src/app/components/student/ToastContainer.tsx` — Sistema de toasts para feedback visual (bookmark added, annotation saved, etc.)

**Integración:** Importar en SummaryViewer.tsx

**Referencia prototipo:** líneas 1304-1345

### Agent B: SidebarOutline
**Archivos nuevos:**
- `src/app/components/student/SidebarOutline.tsx` — Sidebar colapsable con:
  - Lista de bloques con icono por tipo (FileText, Zap, ArrowRight, Table, etc.)
  - Scroll-spy: resalta el bloque actualmente visible
  - Click → scroll suave al bloque
  - Toggle collapse/expand
  - Indicador de mastery por bloque (dot de color, preparado para Oleada 2)

**Integración:** Layout de SummaryViewer: sidebar izquierda + contenido derecha

**Referencia prototipo:** líneas 839-877

### Agent C: SearchBar
**Archivos nuevos:**
- `src/app/components/student/SearchBar.tsx` — Barra de búsqueda dentro del resumen:
  - Input con ícono Search
  - Filtra/resalta matches en los bloques visibles
  - Muestra conteo de resultados
  - Keyboard shortcut: Ctrl+F

**Integración:** Toggle desde header del SummaryViewer

**Referencia prototipo:** líneas 957-969

---

## Oleada 2 — Sistema de Mastery por Bloque (Impacto alto, complejidad media)

> Branch: `feat/wave2-block-mastery`
> Agentes: 2 en paralelo
> **Prerequisito:** Backend endpoint que retorne mastery por bloque (FSRS/BKT data)

### Agent A: MasteryBar component + integración en ViewerBlock
**Archivos nuevos/modificados:**
- `src/app/components/student/MasteryBar.tsx` — Barra visual de mastery con 5 niveles:
  - Por descubrir (gris), Emergente (rojo), En progreso (amarillo), Consolidado (verde), Maestría (azul)
  - Muestra label + barra coloreada
  - Animación suave al cambiar de nivel (NO desplazamiento, solo color transition)
- Modificar `ViewerBlock.tsx` — Agregar MasteryBar debajo de cada bloque

**Design tokens:** Usar MASTERY/MASTERY_DARK del prototipo (líneas 20-42)

**Referencia prototipo:** líneas 599-698 (BlockWrapper mastery section)

### Agent B: Hook useSummaryMastery
**Archivos nuevos:**
- `src/app/hooks/queries/useSummaryMastery.ts` — React Query hook:
  - `GET /content/summaries/:id/mastery` → array de { block_id, mastery_level }
  - Cacheo por summaryId
  - Fallback: todos en 0 (gris) si endpoint no existe aún

**Integración:** SummaryViewer consume el hook y pasa mastery a cada ViewerBlock

---

## Oleada 3 — Interacción del Estudiante (Impacto alto, complejidad media)

> Branch: `feat/wave3-student-interaction`
> Agentes: 3 en paralelo

### Agent A: BookmarkButton + BookmarksPanel
**Archivos nuevos:**
- `src/app/components/student/BookmarkButton.tsx` — Toggle bookmark por bloque (ícono Bookmark/BookmarkCheck)
- `src/app/components/student/BookmarksPanel.tsx` — Panel lateral/modal con lista de bloques bookmarked, click → scroll al bloque
- `src/app/hooks/mutations/useBookmarkMutations.ts` — Persist bookmarks (puede ser localStorage inicialmente, Supabase después)

**Referencia prototipo:** líneas 1077-1298

### Agent B: AnnotationsPanel (mejorado)
**Verificar primero:** `ReaderAnnotationsTab.tsx` ya existe en el código — ¿está conectado a bloques?
**Si no:** Crear/adaptar para que funcione por bloque:
- `src/app/components/student/AnnotationsPanel.tsx` — Panel de notas por bloque
  - Textarea para agregar nota
  - Lista de notas existentes con timestamp
  - Delete nota
  - Persist via Supabase (student_id + block_id)

**Referencia prototipo:** líneas 919-952

### Agent C: QuizModal por bloque
**Verificar primero:** `AdaptiveQuizModal.tsx` ya existe — ¿puede recibir un block_id como contexto?
**Objetivo:** Botón en cada bloque que genera quiz contextual:
- Modal con pregunta de opción múltiple
- Feedback inmediato (correcto/incorrecto + explicación)
- Actualiza mastery del bloque
- Puede reutilizar el backend de quiz existente con filtro por bloque

**Referencia prototipo:** líneas 782-834

---

## Oleada 4 — Experiencia de Estudio (Impacto medio, complejidad baja-media)

> Branch: `feat/wave4-study-experience`
> Agentes: 3 en paralelo

### Agent A: TTSButton (Text-to-Speech)
**Archivos nuevos:**
- `src/app/components/student/TTSButton.tsx` — Botón play/pause por bloque
  - Usa Web Speech API (speechSynthesis)
  - Extrae texto plano del bloque (strip keywords markup)
  - Play/pause/stop
  - Highlight del bloque activo durante lectura

**Referencia prototipo:** líneas 1091-1121

### Agent B: StudyTimer
**Archivos nuevos:**
- `src/app/components/student/StudyTimer.tsx` — Timer Pomodoro:
  - Start/Pause/Reset
  - Configurable: 25/50 min
  - Notificación al terminar (toast)
  - Posición: floating o en header

**Referencia prototipo:** líneas 1198-1258

### Agent C: ReadingSettingsPanel
**Archivos nuevos:**
- `src/app/components/student/ReadingSettingsPanel.tsx` — Panel de preferencias:
  - Font size (slider: 14-22px)
  - Line spacing (1.5-2.5)
  - Font family (sans/serif)
  - TTS velocity
  - Persist en localStorage

**Referencia prototipo:** líneas 1126-1193

---

## Oleada 5 — Features Avanzadas (Impacto medio, complejidad alta)

> Branch: `feat/wave5-advanced-features`
> Agentes: 2 en paralelo

### Agent A: Dark Mode para Resúmenes
- Agregar toggle dark/light en SummaryViewer header
- Usar design tokens LIGHT/DARK del prototipo (líneas 7-18)
- Asegurar que TODOS los renderers respetan el tema
- Callout variants dark (CALLOUT_DARK, líneas 51-57)
- Mastery colors dark (MASTERY_DARK, líneas 27-33)

### Agent B: DrawingCanvas
- `src/app/components/student/DrawingCanvas.tsx` — Canvas overlay por bloque:
  - Herramientas: pen, eraser, color picker
  - Undo/redo de strokes
  - Save/load (base64 en Supabase o localStorage)
  - Toggle on/off
  - ~100 líneas en prototipo (974-1073)

**Nota:** Esta es la feature más compleja y menos prioritaria. Puede posponerse.

---

## Oleada 6 — Polish del Editor del Profesor (Impacto bajo-medio)

> Branch: `feat/wave6-editor-polish`
> Agentes: 2 en paralelo

### Agent A: Undo/Redo en BlockEditor
- Implementar `useUndoRedo` hook (prototipo líneas 64-91)
- Integrar en BlockEditor.tsx: Ctrl+Z / Ctrl+Shift+Z
- Botones Undo/Redo en BlockEditorToolbar

### Agent B: ResizableImage + AI Insert
- `ResizableImage.tsx` — Drag handles para resize de imágenes en editor
- Mejorar `InsertBlockButton` — agregar opción "Generar con IA" (Sparkles icon) que llama al backend para generar un bloque

---

## Orden de Prioridad Recomendado

| Oleada | Impacto en UX | Esfuerzo | Agentes | Estimación |
|--------|--------------|----------|---------|------------|
| 1. Fundamentos de Lectura | ★★★★★ | Bajo | 3 | 1 sesión CLI |
| 2. Mastery por Bloque | ★★★★★ | Medio | 2 | 1 sesión CLI |
| 3. Interacción Estudiante | ★★★★☆ | Medio | 3 | 1-2 sesiones CLI |
| 4. Experiencia de Estudio | ★★★☆☆ | Bajo | 3 | 1 sesión CLI |
| 5. Features Avanzadas | ★★★☆☆ | Alto | 2 | 1-2 sesiones CLI |
| 6. Polish Editor | ★★☆☆☆ | Medio | 2 | 1 sesión CLI |

## Cómo Ejecutar

Cada oleada se ejecuta en Claude Code CLI:

```bash
cd C:\dev\axon\frontend
git checkout feat/block-based-summaries
git pull origin feat/block-based-summaries
git checkout -b feat/wave1-reading-foundations

# Darle a Claude Code el prompt de la oleada + este documento como contexto
# Claude Code lanza agentes en paralelo
# Al terminar: npm run build → commit → push → PR
```

Después de cada oleada, merge a `feat/block-based-summaries` via PR, y la siguiente oleada parte de ahí.
