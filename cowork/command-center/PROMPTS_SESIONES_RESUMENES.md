# Prompts de Ejecución — Plan Resúmenes (3 Sesiones)

> **Generado:** 2026-03-27
> **Referencia:** PLAN_RESUMENES_FINAL_v1.md
> **Instrucciones:** Copiar cada prompt completo en Claude Code CLI

---

## SESIÓN 1: Merge `feat/block-based-summaries` → `main`

> **Prerequisito:** Ninguno
> **Dónde:** Claude Code CLI en `C:\dev\axon\frontend`
> **Agentes:** XX-01 (Architect), XX-02 (Quality Gate)
> **Nota:** El repo principal YA está en `feat/block-based-summaries`. Hay 2 worktrees huérfanos que limpiar.

### Prompt (copiar entero):

```
Eres XX-01 (Arquitecto). Lee .claude/AGENT-REGISTRY.md.

CONTEXTO: feat/block-based-summaries tiene 26 commits y 35 archivos (+4529 líneas) con las 6 waves
de resúmenes block-based. Necesitamos mergearlo a main de forma segura.

IMPORTANTE: El repo principal ya está en feat/block-based-summaries (no en main).
Hay worktrees huérfanos — limpiarlos primero.

PASO 1 — Limpieza:
git worktree prune
git worktree list  # verificar que quedaron solo los válidos

PASO 2 — Sincronizar con remote:
git pull origin feat/block-based-summaries
git fetch origin main

PASO 3 — Merge main INTO feat branch (resolver posibles conflictos):
git merge origin/main
# Si hay conflictos, resolverlos priorizando el código de feat branch para archivos de resúmenes,
# y el código de main para todo lo demás.

PASO 4 — Quality Gate (OBLIGATORIO antes de push):
npm install
npm run build   # → 0 errors TypeScript
npm run test    # → tests pasan

PASO 5 — Si todo pasa:
git push origin feat/block-based-summaries

PASO 6 — Crear PR:
gh pr create --title "feat: block-based summaries (6 waves)" --body "$(cat <<'EOF'
## Summary
- Wave 1: SidebarOutline, ReadingProgress, SearchBar
- Wave 2: MasteryBar, useSummaryBlockMastery
- Wave 3: Bookmarks, Annotations, Quiz per block
- Wave 4: TTS, StudyTimer, ReadingSettings
- Wave 5: Dark mode (scoped)
- Wave 6: Undo/Redo, ResizableImage, AI InsertBlockButton

35 files changed, +4529 lines
6 waves implemented and tested on feat branch

## Test plan
- [ ] `npm run build` passes (0 TS errors)
- [ ] `npm run test` passes
- [ ] Student view: summary with blocks renders correctly
- [ ] Professor view: block editor works
- [ ] Dark mode toggle works
- [ ] Mobile responsive (375px)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

PASO 7 — Reportar:
Dime la URL del PR y el resultado de build + tests.
NO mergear el PR — eso lo hace Petrick en browser.
```

### Post-merge (ejecutar después de que Petrick mergee el PR):

```
El PR de feat/block-based-summaries fue mergeado a main por Petrick.

1. git checkout main && git pull origin main
2. Verificar que el build sigue pasando: npm run build && npm run test
3. Limpiar el branch local: git branch -d feat/block-based-summaries
4. git worktree prune  # limpiar worktrees huérfanos

Reporta si todo está limpio.
```

---

## SESIÓN 2: Verificación + Fix Gaps Críticos

> **Prerequisito:** Sesión 1 mergeada en main
> **Dónde:** Claude Code CLI en `C:\dev\axon\frontend`
> **Agentes activos (max 5 simultáneos):**
>
> | Agent | ID | Del AGENT-REGISTRY | Tarea |
> |-------|----|--------------------|-------|
> | Architect | XX-01 | Cross-cutting | Orquestación |
> | Summaries Frontend v2 | SM-01 | Sec 3 | Auditoría código real + hooks huérfanos |
> | Text Highlighter | SM-06 | Sec 3 | Keyboard shortcuts + TextHighlighter |
> | Design System | XX-08 | Cross-cutting | Consolidar design tokens |
> | Quality Gate | XX-02 | Cross-cutting | Build + test + review |

### Prompt (copiar entero):

```
Eres XX-01 (Arquitecto). Lee .claude/AGENT-REGISTRY.md y .claude/agents/architect.md.

CONTEXTO: Las 6 waves de resúmenes block-based YA están en main (PR mergeado).
Una auditoría identificó 10 gaps que PUEDEN o NO seguir abiertos.
Tu trabajo es VERIFICAR primero, luego fijar solo lo confirmado.

SETUP:
source /c/dev/axon/worktree.sh frontend fix/summaries-post-merge-gaps
git pull origin main

FASE 1 — INVESTIGACIÓN (SM-01, obligatoria antes de cualquier fix):

Lanza SM-01 (summaries-frontend-v2). Debe leer .claude/agents/summaries-frontend-v2.md
y .claude/agent-memory/individual/SM-01-summaries-frontend-v2.md.

SM-01 debe verificar en el código REAL de main:

1. HOOKS HUÉRFANOS: grep -r para imports de:
   - useSummaryViewer
   - useSummaryTimer
   - useSearch
   - useSummaryPersistence
   → ¿Alguno tiene 0 importadores? Si sí, es huérfano.

2. TEXT HIGHLIGHTER: ¿TextHighlighter.tsx está importado en algún componente
   de student view (ViewerBlock, SummaryViewer, etc.)?

3. KEYBOARD SHORTCUTS: ¿Existe algún useEffect con keydown listener para
   Ctrl+F, Ctrl+Z, o Esc en componentes de resúmenes?

4. DESIGN TOKENS: Contar cuántos archivos definen tokens de color:
   - design-system/colors.ts
   - design-system/palette.ts (si existe)
   - dk-tokens.ts o dark-tokens (si existe)
   - mastery-colors.ts (si existe)
   - section-colors.ts (si existe)
   - styles/theme.css
   → ¿Están dispersos o ya consolidados?

5. MASTERY LEVELS: ¿Cuántos niveles define el sistema? ¿5 o 6?
   Buscar en mastery-helpers.ts, mastery-colors, MasteryBar, etc.

SM-01 produce un reporte JSON:
{
  "orphan_hooks": ["nombre1", ...],
  "text_highlighter_integrated": true/false,
  "keyboard_shortcuts_exist": true/false,
  "design_token_files": ["archivo1", ...],
  "mastery_levels_count": 5 o 6,
  "gaps_confirmed": ["G1", "G3", ...]
}

FASE 2 — FIX (paralelo, solo gaps confirmados por SM-01):

Lanza SOLO los agentes necesarios según el reporte de SM-01:

SI hay hooks huérfanos confirmados:
→ SM-01 mismo los elimina (están en su ownership)

SI TextHighlighter no está integrado:
→ SM-06 (text-highlighter). Lee .claude/agents/text-highlighter.md.
  Integrar TextHighlighter en el student view de resúmenes.

SI keyboard shortcuts no existen:
→ SM-06 también implementa:
  - Ctrl+F → focus SearchBar
  - Ctrl+Z → trigger undo (si useUndoRedo está conectado)
  - Esc → cerrar sidebar/modales abiertos

SI design tokens dispersos:
→ XX-08 (design-system). Lee .claude/agents/design-system.md.
  Consolidar tokens en design-system/index.ts como barrel.
  NO borrar archivos originales — re-exportar desde un punto central.
  Unificar mastery levels a 5 canónicos.

REGLAS:
- Max 4 agentes simultáneos (XX-01 + 3 workers)
- Cada agente con model: "opus", mode: "bypassPermissions"
- 2+ agentes mismos archivos → isolation: "worktree"
- SM-01 y SM-06 NO tocan los mismos archivos (SM-01=hooks, SM-06=highlighter+shortcuts)

FASE 3 — QUALITY GATE:

Lanza XX-02 (quality-gate). Lee .claude/agents/quality-gate.md.
- npm run build → 0 errors
- npm run test → pasan
- Revisar que no se rompió ningún componente existente
- Verificar imports limpios (no circular, no dead)

FASE 4 — CIERRE:

git add [archivos modificados]
git commit con mensaje descriptivo de los gaps resueltos
git push -u origin fix/summaries-post-merge-gaps

Reporta:
1. Reporte de SM-01 (qué gaps estaban realmente abiertos)
2. Qué se fixeó
3. Resultado de quality gate
4. URL del branch pusheado (yo creo el PR en browser)
```

---

## SESIÓN 3: Polish + Gaps Opcionales

> **Prerequisito:** Sesión 2 mergeada en main
> **Dónde:** Claude Code CLI en `C:\dev\axon\frontend`
> **Prioridad:** BAJA — solo si hay tiempo
> **Agentes:**
>
> | Agent | ID | Tarea |
> |-------|----|-------|
> | Architect | XX-01 | Orquestación |
> | Summaries Tester | SM-03 | Accessibility + tests useUndoRedo |
> | Summaries Frontend v2 | SM-01 | DrawingCanvas básico (opcional) |
> | Quality Gate | XX-02 | Build + test |

### Prompt (copiar entero):

```
Eres XX-01 (Arquitecto). Lee .claude/AGENT-REGISTRY.md.

CONTEXTO: Resúmenes block-based en main, gaps críticos ya fixeados (Sesión 2).
Esta sesión es polish opcional. Priorizar accessibility > tests > features.

SETUP:
source /c/dev/axon/worktree.sh frontend feat/summaries-polish
git pull origin main

PLAN (ejecutar en orden de prioridad, parar si alguno falla):

PRIORIDAD 1 — Accessibility (SM-03):
Lanza SM-03 (summaries-tester). Lee .claude/agents/summaries-tester.md
y .claude/agent-memory/individual/SM-03-summaries-tester.md.

SM-03 implementa:
a) MasteryBar: agregar aria-label con nivel textual ("Mastery: Beginner", etc.)
b) HighlightToolbar: role="tooltip" + aria-live="polite"
c) SidebarOutline: al click en item, focus management al bloque destino
   (scrollIntoView + focus con tabIndex=-1)

PRIORIDAD 2 — Tests useUndoRedo (SM-03 continúa):
SM-03 escribe tests unitarios para useUndoRedo:
- Test: push state → undo → verify previous state
- Test: undo → redo → verify restored state
- Test: undo en stack vacío → no crash
- Test: max stack size (si hay límite)
Ubicación: src/app/hooks/__tests__/useUndoRedo.test.ts

PRIORIDAD 3 — Severity tokens (XX-08, solo si sobra tiempo):
XX-08 (design-system) crea tokens mild/moderate/critical en design-system/
para indicadores de severidad en quizzes y mastery.

PRIORIDAD 4 — DrawingCanvas (SM-01, SOLO si Petrick confirma):
SM-01 crea DrawingCanvas básico:
- Canvas con pen + eraser
- Sin persistencia backend
- Componente standalone en components/content/DrawingCanvas.tsx

QUALITY GATE: XX-02 al final.

git add → commit → git push -u origin feat/summaries-polish
Reporta qué se implementó y resultado del quality gate.
```

---

## Notas para Petrick

### Orden de ejecución
```
Sesión 1 (merge) ──→ Sesión 2 (gaps) ──→ Sesión 3 (polish, opcional)
   ~1h                  ~2-3h                ~1-2h
```

### Agentes del AGENT-REGISTRY usados

| Sesión | Agentes | IDs |
|--------|---------|-----|
| 1 | Architect, Quality Gate | XX-01, XX-02 |
| 2 | Architect, Summaries Frontend v2, Text Highlighter, Design System, Quality Gate | XX-01, SM-01, SM-06, XX-08, XX-02 |
| 3 | Architect, Summaries Tester, Summaries Frontend v2, Design System, Quality Gate | XX-01, SM-03, SM-01, XX-08, XX-02 |

### Máximo agentes paralelos por sesión
- Sesión 1: 1 (secuencial, merge es lineal)
- Sesión 2: 4 simultáneos (SM-01 investigación → luego SM-01 + SM-06 + XX-08 paralelo → XX-02)
- Sesión 3: 3 simultáneos (SM-03 + SM-01 + XX-08 paralelo → XX-02)

### Worktree reminder
- Sesión 1: NO necesita worktree (merge directo en repo principal)
- Sesión 2: `source /c/dev/axon/worktree.sh frontend fix/summaries-post-merge-gaps`
- Sesión 3: `source /c/dev/axon/worktree.sh frontend feat/summaries-polish`
