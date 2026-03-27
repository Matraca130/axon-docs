# Plan Final Resúmenes — Paridad Visual + UX con Prototipo

> **Fecha:** 2026-03-27
> **Autor:** Petrick + Claude (Cowork)
> **Scope:** Solo resúmenes block-based — enfoque en PARIDAD VISUAL con prototipo
> **Estado main:** ✅ Merge completado — 6 waves en producción
> **Prototipo de referencia:** `Prototipo_Resumenes_Axon_FINAL.jsx`
> **Sistema:** Agent Teams (TeamCreate → Agents → Quality Gate → TeamDelete)
> **Scheduling:** Cowork scheduled tasks para seguimiento automatizado

---

## Contexto

Las 6 waves están en `main`. La funcionalidad existe. Pero Petrick reporta que la **experiencia visual no coincide con el prototipo**. Los issues específicos:

### Issues reportados por Petrick (2026-03-27)

| # | Issue | Prototipo | Implementación actual | Prioridad |
|---|-------|-----------|----------------------|-----------|
| V1 | **Header/Nav superior demasiado grande** | Barra compacta: `padding: 10px 20px`, solo "AXON" + "Resúmenes" + iconos de tools | Header completo de la app (breadcrumb, nav, mucho espacio vertical) | **CRÍTICA** |
| V2 | **Enfoque debe ser 100% el resumen** | Full-page dedicada: no hay sidebar de app, no hay nav extra. Solo back button + toolbar compacta | El resumen está dentro del layout general de la app con sidebar y header de navegación | **CRÍTICA** |
| V3 | **Sidebar izquierda (outline) no funciona bien** | Click en item → scroll suave directo al bloque (ej: "Factores de Riesgo"). Scroll-spy activo | El scrollTo no funciona correctamente / no navega al bloque | **ALTA** |
| V4 | **MasteryBar visual no coincide** | 5 niveles con colores específicos (gray/red/yellow/green/blue), barra 3px izquierda en student mode, labels textuales | Aspecto visual diferente al prototipo | **ALTA** |
| V5 | **Spacing/tamaño de bloques diferente** | Contenido a `max-width: 800px`, card con `borderRadius: 20, padding: 28px 32px`, separación entre bloques bien definida | Espaciado no coincide — bloques no usan el mismo espacio | **MEDIA** |
| V6 | **Falta botón "Volver" prominente** | Solo necesita un back button claro para ir a la lista de resúmenes | No hay forma clara de volver sin usar la nav completa | **ALTA** |

### Lo que el prototipo define (medidas exactas del JSX)

**Header (modo estudiante):**
```
- height: ~40px (padding 10px vertical)
- background: headerBg (#1B3B36 light, #0d0e11 dark)
- position: sticky, top: 0, z-index: 100
- left: "AXON" (16px bold, Space Grotesk) + "Resúmenes" (13px light)
- right: iconos 16px cada uno con padding 6px, separadores de 1px
- NO breadcrumb, NO navegación de app, NO nombre de institución
```

**Layout:**
```
- maxWidth del contenedor: 1100px, centrado
- Sidebar outline: a la izquierda (colapsable)
- Contenido: maxWidth 800px, centrado dentro del 1100
- Student mode: card con borderRadius 20, padding 28px 32px, shadow 0 1px 4px
- page background: #F0F2F5 (light) / #111215 (dark)
```

**Mastery (student mode):**
```
- Barra izquierda de 3px en cada bloque (borderLeft: 3px solid {mastery.border})
- Colores: gray (#a1a1aa) / red (#ef4444) / yellow (#f59e0b) / green (#10b981) / blue (#3b82f6)
- Badge: ej "85%" en círculo pequeño top-right del bloque
- Labels: "Por descubrir" / "Emergente" / "En progreso" / "Consolidado" / "Maestría"
- Leyenda togglable en header del summary (mini circles + labels)
```

**Sidebar Outline:**
```
- width: ~220px cuando expandida, ~52px colapsada
- Icono por tipo de bloque (FileText→prose, Zap→key_point, ArrowRight→stages, etc.)
- Active block: background teal50, borderLeft 3px tealAccent, fontWeight 600
- Click → scrollIntoView({ behavior: 'smooth', block: 'center' })
- Scroll-spy: IntersectionObserver con threshold 0.3
```

---

## Plan de Ejecución — 2 Sesiones

---

### SESIÓN 1: Paridad Visual — Header Inmersivo + Layout + Sidebar Fix

> **Branch:** `fix/summary-visual-parity` desde `main`
> **Prioridad:** ALTA — esto es lo que ve el estudiante
> **Dónde:** Claude Code CLI desde `C:\dev\axon\frontend`
> **Duración estimada:** ~3-4 horas

#### Objetivo

Que la vista del estudiante al abrir un resumen sea **visualmente idéntica al prototipo**: header compacto dedicado, layout centrado, sidebar funcional, mastery visual correcta.

#### Agent Team: `summary-visual-parity`

| Agent | ID | Rol | Archivos principales |
|-------|----|-----|---------------------|
| layout-agent | SM-01 | V1+V2+V6: Header inmersivo + layout full-page + back button | `StudentBlockReader.tsx` o equivalente, layout wrapper |
| sidebar-agent | SM-02 | V3: Fix sidebar scroll-to + scroll-spy | `SidebarOutline.tsx`, `useSummaryViewer.ts` o equivalente |
| mastery-agent | SM-03 | V4: Mastery visual alineada al prototipo | `MasteryBar.tsx`, `BlockWrapper.tsx`, tokens de mastery |
| spacing-agent | SM-04 | V5: Spacing, padding, max-width, border-radius | Estilos en todos los block renderers + wrapper |
| quality-gate | XX-02 | QA | Build + test + visual review |

#### Fases

```
Fase 0 (INVESTIGACIÓN — obligatoria):
    TODOS los agentes leen el prototipo JSX (Prototipo_Resumenes_Axon_FINAL.jsx)
    y el código actual para entender las diferencias EXACTAS.
    SM-01 produce un diff visual: "prototipo dice X, código actual hace Y".

Fase 1 (paralelo — archivos sin overlap):
    SM-01: Header inmersivo (reemplazar nav de app por toolbar compacta)
    SM-02: Sidebar scrollTo + scroll-spy fix
    SM-03: Mastery tokens + barra visual
    SM-04: Spacing de bloques

Fase 2 (integración):
    SM-01 verifica que todos los cambios funcionan juntos

Fase 3:
    XX-02 quality-gate: build + test + revisión visual
```

#### Checklist Detallado

| # | Tarea | Agent | Spec del prototipo | Status |
|---|-------|-------|--------------------|--------|
| **V1+V2: Header Inmersivo** | | | | |
| 1.1 | Auditar cómo se renderiza actualmente la vista del estudiante (qué componentes, qué wrappers) | SM-01 | — | ☐ |
| 1.2 | Crear/modificar `StudentBlockReader` para que cuando el estudiante esté EN un resumen, el header de la app desaparezca y se muestre una toolbar compacta propia | SM-01 | Header: sticky, padding 10px 20px, bg #1B3B36 | ☐ |
| 1.3 | Toolbar compacta: izquierda = back button + "AXON" + "Resúmenes" | SM-01 | fontSize 16 + 13, fontFamily Space Grotesk | ☐ |
| 1.4 | Toolbar compacta: derecha = iconos de herramientas (16px, padding 6px cada uno) | SM-01 | Search, Highlight, Annotations, Bookmarks, Timer, Settings, Sidebar toggle, Dark mode, Mastery toggle | ☐ |
| 1.5 | NO mostrar breadcrumb, NO nav de institución, NO sidebar de app cuando se está en el resumen | SM-01 | El resumen es la experiencia completa | ☐ |
| 1.6 | Back button claro: click → volver a lista de resúmenes del topic | SM-01 | ChevronLeft o ArrowLeft + "Volver" | ☐ |
| **V3: Sidebar Outline** | | | | |
| 1.7 | Verificar que `scrollIntoView({ behavior: 'smooth', block: 'center' })` funciona al hacer click en un item del sidebar | SM-02 | Scroll suave al bloque exacto | ☐ |
| 1.8 | Verificar que IntersectionObserver actualiza el bloque activo en la sidebar al scrollear | SM-02 | threshold: 0.3, rootMargin configurable | ☐ |
| 1.9 | Si el scroll-spy no funciona: verificar que cada bloque tiene un `id` o `ref` que el Observer pueda observar | SM-02 | Cada bloque debe tener `id={block.id}` o ref | ☐ |
| 1.10 | Sidebar width: 220px expandida, 52px colapsada | SM-02 | Con transition suave | ☐ |
| 1.11 | Active item: bg teal50, borderLeft 3px tealAccent, fontWeight 600 | SM-02 | Visual feedback claro de dónde está el estudiante | ☐ |
| 1.12 | Icono por tipo de bloque en sidebar (FileText→prose, Zap→key_point, etc.) | SM-02 | Lucide icons | ☐ |
| **V4: MasteryBar Visual** | | | | |
| 1.13 | Student mode: barra izquierda de 3px por bloque con color de mastery | SM-03 | `borderLeft: 3px solid {mastery.border}` | ☐ |
| 1.14 | 5 niveles de colores alineados al prototipo | SM-03 | gray #a1a1aa, red #ef4444, yellow #f59e0b, green #10b981, blue #3b82f6 | ☐ |
| 1.15 | Badge de porcentaje (ej: "85%") en esquina del bloque cuando mastery está activo | SM-03 | Círculo pequeño top-right | ☐ |
| 1.16 | Labels textuales: "Por descubrir" / "Emergente" / "En progreso" / "Consolidado" / "Maestría" | SM-03 | Tooltip o en leyenda | ☐ |
| 1.17 | Leyenda de mastery togglable debajo del título del summary | SM-03 | Mini circles + labels, fondo cardBg con borde | ☐ |
| 1.18 | Dark mode mastery: colores oscuros del prototipo (bg oscuro, border brillante, text claro) | SM-03 | MASTERY_DARK del prototipo | ☐ |
| **V5: Spacing y Layout** | | | | |
| 1.19 | Contenedor principal: maxWidth 1100px, centrado | SM-04 | `margin: "0 auto"` | ☐ |
| 1.20 | Área de bloques: maxWidth 800px, centrado dentro del 1100 | SM-04 | Contenido de lectura a 800px | ☐ |
| 1.21 | Card wrapper (student mode): borderRadius 20px, padding 28px 32px, shadow sutil | SM-04 | `boxShadow: "0 1px 4px rgba(0,0,0,0.06)"` | ☐ |
| 1.22 | Page background: #F0F2F5 (light) / #111215 (dark) | SM-04 | Fuera de la card | ☐ |
| 1.23 | Summary header: tags (Cardiología, Alta relevancia, ~15 min), título Georgia 30px bold, subtítulo 14px | SM-04 | Medidas exactas del prototipo | ☐ |
| **Quality Gate** | | | | |
| 1.24 | `npm run build` → 0 errors | XX-02 | — | ☐ |
| 1.25 | `npm run test` → pasan | XX-02 | — | ☐ |
| 1.26 | Comparación visual: abrir prototipo JSX y app en paralelo | XX-02 | Deben verse ~iguales | ☐ |
| 1.27 | Mobile 375px: verificar que no hay overflow ni layout breaks | XX-02 | — | ☐ |
| **Cierre** | | | | |
| 1.28 | Commit + push | XX-01 | — | ☐ |
| 1.29 | PR en GitHub | Petrick | — | ☐ |
| 1.30 | Merge PR | Petrick | — | ☐ |
| 1.31 | Verificación en producción con Petrick | Petrick | — | ☐ |

#### Prompt para Claude Code CLI

```
Eres XX-01 (Arquitecto). Lee AGENT-REGISTRY.md y project_current_state.md.

source /c/dev/axon/worktree.sh frontend fix/summary-visual-parity
git pull origin main

CONTEXTO: Las 6 waves de resúmenes están en main. La funcionalidad existe pero la EXPERIENCIA
VISUAL del estudiante no coincide con el prototipo. Este fix es puramente visual/UX.

REFERENCIA OBLIGATORIA: Lee `Prototipo_Resumenes_Axon_FINAL.jsx` (en OneDrive AXON PROJECTO/
PROJETO DESAROLLO RESUMEN/) — es el spec visual. Cada agente DEBE leerlo antes de tocar código.

ISSUES A RESOLVER (en orden de prioridad):

V1+V2: HEADER INMERSIVO — Cuando el estudiante está en un resumen, reemplazar el header/nav
completo de la app por una toolbar compacta propia del resumen:
  - Sticky, padding 10px 20px, bg #1B3B36
  - Izquierda: back button + "AXON" + "Resúmenes"
  - Derecha: iconos de tools (16px cada uno)
  - NO breadcrumb, NO sidebar de app, NO nav de institución
  - El resumen es la experiencia COMPLETA — full-page dedicada

V3: SIDEBAR OUTLINE — El click debe hacer scrollIntoView al bloque exacto.
  Scroll-spy con IntersectionObserver. Width 220px expandida / 52px colapsada.
  Active item: bg teal50, borderLeft 3px tealAccent.

V4: MASTERY VISUAL — Barra 3px izquierda por bloque. 5 colores del prototipo.
  Badge % en esquina. Labels textuales. Dark mode con MASTERY_DARK.

V5: SPACING — maxWidth 1100px container, 800px content. Student card: borderRadius 20,
  padding 28px 32px, shadow sutil. Page bg: #F0F2F5 light / #111215 dark.

AGENTES (paralelo, archivos sin overlap):
  SM-01: Header inmersivo + layout + back button
  SM-02: Sidebar scroll-to + scroll-spy
  SM-03: Mastery visual
  SM-04: Spacing/padding/sizes

XX-02 quality-gate al final.
Al terminar: npm run build (0 errors), commit, git push -u origin fix/summary-visual-parity.
```

---

### SESIÓN 2: Cleanup Técnico + Polish

> **Branch:** `fix/summaries-cleanup` desde `main` (post Sesión 1)
> **Prerequisito:** Sesión 1 mergeada + verificada visualmente por Petrick
> **Dónde:** Claude Code CLI
> **Duración estimada:** ~1-2 horas
> **Prioridad:** Media-Baja — ejecutar después de validar Sesión 1

#### Agent Team: `summaries-cleanup`

| Agent | ID | Rol |
|-------|----|-----|
| code-auditor | SM-01 | Verificar gaps técnicos reales (hooks huérfanos, tokens) |
| tokens-agent | IF-07 | Consolidar design tokens |
| shortcuts-agent | SM-06 | Keyboard shortcuts |
| hooks-agent | SM-02 | Hooks cleanup |
| quality-gate | XX-02 | QA |

#### Checklist

| # | Tarea | Agent | Status |
|---|-------|-------|--------|
| **Investigación** | | | |
| 2.1 | SM-01: grep imports de useSummaryViewer, useSummaryTimer, useSearch, useSummaryPersistence | SM-01 | ☐ |
| 2.2 | SM-01: verificar si TextHighlighter está integrado en student view | SM-01 | ☐ |
| 2.3 | SM-01: contar archivos de tokens de color | SM-01 | ☐ |
| 2.4 | SM-01: producir lista de gaps REALES confirmados | SM-01 | ☐ |
| **Fix gaps confirmados** | | | |
| 2.5 | IF-07: consolidar design tokens en 1 archivo (si siguen dispersos) | IF-07 | ☐ |
| 2.6 | IF-07: unificar mastery tokens a 5 niveles | IF-07 | ☐ |
| 2.7 | SM-06: Ctrl+F → focus SearchBar | SM-06 | ☐ |
| 2.8 | SM-06: Ctrl+Z → undo | SM-06 | ☐ |
| 2.9 | SM-06: Esc → cerrar modales/sidebar | SM-06 | ☐ |
| 2.10 | SM-02: eliminar hooks huérfanos confirmados | SM-02 | ☐ |
| **QA** | | | |
| 2.11 | `npm run build` → 0 errors | XX-02 | ☐ |
| 2.12 | `npm run test` → pasan | XX-02 | ☐ |
| 2.13 | Commit + push + PR | XX-01 | ☐ |

#### Prompt para Claude Code CLI

```
Eres XX-01 (Arquitecto). Lee AGENT-REGISTRY.md y project_current_state.md.

source /c/dev/axon/worktree.sh frontend fix/summaries-cleanup
git pull origin main

Cleanup técnico post visual-parity. Primero INVESTIGAR, luego fix:

Fase 1: SM-01 audita el código real:
  - ¿Los 4 hooks huérfanos ahora tienen imports?
  - ¿TextHighlighter está integrado en student view?
  - ¿Design tokens siguen en 6 archivos separados?
  - ¿Mastery tokens duplicados?

Fase 2 (solo gaps confirmados):
  - IF-07: consolidar tokens
  - SM-06: keyboard shortcuts (Ctrl+F, Ctrl+Z, Esc)
  - SM-02: eliminar hooks huérfanos

XX-02 quality-gate al final.
Al terminar: commit, git push -u origin fix/summaries-cleanup.
```

---

## Dependencias

```
✅ Merge a main (COMPLETADO)
    │
    └──→ Sesión 1 (paridad visual) ──→ Sesión 2 (cleanup técnico)
```

**Sesión 1 es la prioridad absoluta.** Es lo que el estudiante ve. Sesión 2 es housekeeping.

---

## Scheduled Tasks (Cowork)

### Task: `resumenes-post-session`

**Trigger:** Manual (ad-hoc)

**Prompt:**
```
Petrick terminó una sesión de resúmenes en Claude Code CLI.

1. Pregunta: "¿Qué sesión terminaste y qué se logró?"
2. Con su respuesta:
   a. Actualiza `.auto-memory/project_current_state.md` con lo hecho y lo pendiente.
   b. Actualiza PLAN_RESUMENES_FINAL_v1.md marcando ☐ → ☑.
   c. Si hubo bugs nuevos, agrégalos al plan.
   d. Si hubo feedback, guárdalo como memoria tipo `feedback`.
3. Confirma qué actualizaste.
```

---

## Métricas

| Métrica | Actual (post-merge) | Post-Sesión 1 | Post-Sesión 2 |
|---------|---------------------|---------------|---------------|
| Header inmersivo | ❌ usa nav completa de app | ✅ toolbar compacta dedicada | ✅ |
| Sidebar scroll-to | ❌ no navega al bloque | ✅ scrollIntoView smooth | ✅ |
| Mastery visual | ❌ diferente al prototipo | ✅ 3px barra + 5 colores + badge | ✅ |
| Spacing/layout | ❌ no coincide | ✅ 800px content, card 20px radius | ✅ |
| Back button | ❌ no existe | ✅ visible en toolbar | ✅ |
| Design tokens | Dispersos 6 archivos | Dispersos 6 archivos | ✅ 1 centralizado |
| Hooks huérfanos | 4 (por verificar) | 4 (por verificar) | 0 |
| Keyboard shortcuts | ❌ | ❌ | ✅ Ctrl+F/Z/Esc |

---

## Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Ocultar el header de la app puede romper navegación global | Alto | Back button prominente + feature flag para modo legacy |
| Cambios de layout pueden romper mobile | Medio | Quality gate incluye test 375px |
| Sidebar scroll-spy depende de IDs en cada bloque | Bajo | Verificar que cada bloque tiene `id` o `data-block-id` |
| Prototipo usa inline styles, implementación usa Tailwind — traducción imperfecta | Bajo | Agentes deben leer el JSX para extraer valores exactos y traducir a Tailwind equivalente |
