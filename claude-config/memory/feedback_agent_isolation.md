---
name: Agent isolation and coordination (PERMANENT)
description: MANDATORY rules for ALL multi-agent sessions. Covers file isolation, worktrees, model, quality-gate, merge order. Merges former feedback_agent_coordination_lessons.md.
type: feedback
---

## PRE-LAUNCH

0. **MANDATORY: Each agent MUST read the CLAUDE.md of its target repo + `feedback_agent_isolation.md` BEFORE writing any code**
1. `git pull origin main` in each repo
2. `git status --short` — working dir CLEAN (stash if dirty)
3. Assign EXPLICIT file list per agent — zero overlap
4. If file needs 2+ agents, assign to ONE; others wait
5. If agent A creates file that B needs, B goes AFTER A
6. ALWAYS `model: "opus"` — never sonnet/haiku
7. 2+ agents same repo: use `isolation: "worktree"` (pre-create `.claude/worktrees/`)
8. Max 20 agents simultaneously (configured by team)

## IN EACH AGENT PROMPT

```
## MANDATORY READS (before writing any code)
0. Read the CLAUDE.md of your target repo
1. Read `.claude/memory/feedback_agent_isolation.md`
2. Read `.claude/agent-memory/[your-section].md`

## ISOLATION RULES
1. You MUST ONLY modify these files: [EXPLICIT LIST]
2. Do NOT modify ANY other file
3. If you see uncommitted changes from other agents, IGNORE THEM
4. Do NOT import from files that don't exist on the main branch
5. First: git checkout -b <branch> main
6. Last: verify git diff main..<branch> --stat shows ONLY your files
```

## POST-EXECUTION

9. Quality-gate Opus IMMEDIATELY when each agent completes (in background, don't wait for others)
10. Verify `git diff main..<branch> --stat` — only authorized files
11. If contamination: rebuild clean branch from main
12. Merge PRs ONE at a time; rebase remaining branches after each merge
13. Never `git commit --amend` on branches with open PRs

## PATTERNS

- **Same file, N agents:** sequential (A merges, B branches from updated main, etc.)
- **Disjoint files:** parallel safe, merge without conflicts

## MEJORA CONTINUA (OBLIGATORIO en cada sesión)

Al finalizar tu tarea principal, ANTES de reportar al usuario:

1. **Buscar 1 mejora real** en tu zona de ownership:
   - ¿Hay un patrón que se repite y podría extraerse?
   - ¿Hay un nombre de variable/función que confunde?
   - ¿Hay un error handling que falta?
   - ¿Hay un tipo `any` que podría tiparse?
   - ¿Hay un test que falta para un caso obvio?

2. **Evaluar si vale la pena** (NO sobre-ingeniería):
   - ¿Cualquier dev vería este cambio y diría "obvio, sí"? (sin debate)
   - ¿NO agrega archivos, dependencias, ni abstracciones nuevas?
   - ¿El código queda más simple DESPUÉS del cambio, no más complejo?
   - Si las 3 son SI → implementar junto con tu tarea

3. **Registrar en tu memoria individual** (`agent-memory/individual/<TU-ID>.md`):
   - Si encontraste mejora → agregarla a "Lecciones aprendidas" o "Patrones que funcionan"
   - Si encontraste algo que NO deberías hacer → agregar a "Patrones a evitar"
   - Si tomaste una decisión técnica → agregar a "Decisiones técnicas (NO re-litigar)"

4. **Si NO encuentras nada que mejorar** → está bien. No inventes cambios.

> **Regla de oro:** Si necesitás justificar por qué el cambio es bueno, no lo hagas. La mejora debe ser tan obvia que no necesite explicación. Ejemplos: tipar un `any`, agregar un `try/catch` que falta, renombrar una variable confusa. Contra-ejemplos: "extraer un helper para reusar", "reorganizar imports", "agregar un wrapper".

## HISTORICAL ERRORS (2026-03-18)

| Error | Prevention |
|-------|------------|
| Scope creep (3x) | Isolation rules in each prompt |
| Import roto (2x) | "Don't import non-existent files" |
| Merge accidental | Never amend with open PR |
| Conflictos merge (3x) | Sequential merge + rebase |
| Worktree EEXIST | Pre-create `.claude/worktrees/` |
| API 529 (2x) | Max 20 simultaneous agents (configured by team) |
