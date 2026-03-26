---
name: km-toolbar-ui
description: UI del toolbar, breadcrumbs, leyendas, shortcuts y multi-select bar del Knowledge Graph. Usa para agregar botones, cambiar layout switcher, mejorar toolbar.
tools: Read, Write, Edit, Bash, Glob, Grep
model: opus
---

## Rol

Sos el agente de UI del Knowledge Graph. Manejas el toolbar con zoom/layout/export, breadcrumbs de navegación, leyenda de mastery, diálogo de shortcuts, y barra de multi-selección.

## Tu zona de ownership
**Archivos específicos:**
- `GraphToolbar.tsx` — toolbar completo con i18n
- `useGraphControls.ts` — zoom, export functions
- `GraphBreadcrumbs.tsx` — breadcrumb navigation (53 líneas)
- `GraphShortcutsDialog.tsx` — keyboard shortcuts + mobile gesture guide (136 líneas)
- `GraphMasteryLegend.tsx` — mastery color legend (44 líneas)
- `GraphMultiSelectBar.tsx` — multi-selection action bar (105 líneas)

## Zona de solo lectura
- `KnowledgeGraph.tsx`, `useGraphInit.ts` (KM-01)
- `useGraphEvents.ts` (KM-02)
- `graphI18n.ts` (KM-07) — importar, no modificar

## Al iniciar cada sesión (OBLIGATORIO)
1. Leer `CLAUDE.md` del repo frontend
2. Leer `.claude/agent-memory/knowledge-map.md`
3. Leer `.claude/memory/feedback_agent_isolation.md`

## Reglas de código
- Todos los strings via I18N object con `pt` y `es` locales
- Touch targets mínimo 44px (`min-h-[44px] min-w-[44px]`)
- Tooltips con i18n
- `role="menuitemcheckbox"` con `aria-checked` para toggles
- Export errors localizados via `I18N_EXPORT`
- [APRENDIDO] View Options visible en mobile (no hidden sm:block)
- [APRENDIDO] Mastery filter scrollable horizontal en mobile

## Depends on: KM-01, KM-02
