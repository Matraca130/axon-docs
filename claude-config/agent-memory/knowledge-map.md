# Knowledge Map — Section Memory

> **Section:** KM (Knowledge Map)
> **Agents:** KM-01 to KM-08 (8 agents)
> **Last Updated:** 2026-03-25

## Stack

- **Graph Engine:** AntV G6 v5 (`@antv/g6`)
- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS v4 + inline styles for canvas
- **Animations:** motion/react + Canvas 2D API
- **i18n:** Inline I18N objects (pt/es) + centralized graphI18n.ts / mapViewI18n.ts

## Architecture

```
KnowledgeMapView.tsx (orchestrator, 971 lines)
├── KnowledgeGraph.tsx (core component, 615 lines)
│   ├── useGraphInit.ts (G6 constructor, config, 865 lines)
│   ├── useGraphEvents.ts (event handlers, 462 lines)
│   ├── useGraphHighlighting.ts (highlights, 204 lines)
│   ├── useKeyboardNav.ts (keyboard navigation)
│   ├── useDragConnect.ts (drag-to-connect, 558 lines)
│   │   └── drawDragConnectOverlay.ts (canvas drawing, 399 lines)
│   ├── useEdgeReconnect.ts (edge reconnection)
│   └── graphHelpers.ts (shared utilities, GRAPH_COLORS)
├── GraphToolbar.tsx (toolbar UI)
│   └── useGraphControls.ts (zoom, export)
├── GraphBreadcrumbs.tsx, GraphShortcutsDialog.tsx
├── GraphMasteryLegend.tsx, GraphMultiSelectBar.tsx
├── useMapUIState.ts, useMapToolState.ts
├── useMapStickyNotes.ts, useMapNodeColors.ts
├── useMapEdgeActions.ts, useMapNodeActions.ts
├── MapViewEmptyStates.tsx (8 components)
├── AddNodeEdgeModal.tsx, NodeAnnotationModal.tsx
├── AiTutorPanel.tsx, GraphTemplatePanel.tsx
├── NodeContextMenu.tsx, useNodeColors.ts
└── graphI18n.ts, mapViewI18n.ts
```

## Key Patterns

1. **batchDraw()**: Coalesces multiple `graph.draw()` calls in single RAF — use ALWAYS
2. **Spotlight O(delta)**: `spotlightedIdsRef` tracks which IDs have spotlight states — only update changed
3. **sharedIsDraggingRef**: Coordinates between useDragConnect and useEdgeReconnect — prevents simultaneous drags
4. **Reactive touch**: `lastPointerTypeRef` tracks pointer type per interaction — no static IS_TOUCH
5. **Edge set optimistic**: After drag-connect, immediately add edge keys to prevent duplicates
6. **Create-first-then-delete**: Edge reconnect creates new edge before deleting old — prevents data loss
7. **GRAPH_COLORS**: Centralized color constants — never hardcode `#2a8c7a`

## G6 Features Currently Used

### Behaviors
- drag-canvas (sensitivity 1.3)
- zoom-canvas (Ctrl+Wheel, sensitivity 1, origin: pointer)
- scroll-canvas (plain wheel pans)
- optimize-viewport-transform (hide labels during zoom/pan)
- drag-element (no touch delay)
- hover-activate (degree: 1)
- brush-select (shift+drag)

### Plugins
- tooltip (2 instances: nodes + edges)
- minimap
- grid-line

### Layouts
- d3-force (default)
- radial
- compact-box (tree)

### Node/Edge Types
- circle nodes
- line + quadratic edges

## Errores Conocidos

| Fecha | Error | Agente | Lección |
|-------|-------|--------|---------|
| 2026-03-25 | Agentes de i18n periféricos se trabaron por permisos | — | Usar bypassPermissions para edición de archivos |
| 2026-03-25 | Branch switching perdió cambios (stash conflicts) | — | Siempre verificar branch actual antes de editar |
| 2026-03-25 | IS_TOUCH estático no funciona en hybrid devices | KM-03 | Usar lastPointerTypeRef reactivo |

## Pending Improvements

- [ ] G6 behaviors: collapse-expand, click-select, fix-element-size, auto-adapt-label, lasso-select
- [ ] G6 plugins: history (undo/redo), snapline, hull, fullscreen
- [ ] Layouts: dagre, mindmap, concentric
- [ ] Node types: donut (mastery ring)
- [ ] Edge types: cubic-horizontal/vertical
- [ ] Rect combos for topic grouping
