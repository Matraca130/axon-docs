# Agent Workflow Rules (ALL sessions)

## Sistema: AGENT TEAMS (obligatorio)

**SIEMPRE usar Agent Teams (TeamCreate + SendMessage).** Nunca fire-and-forget con Agent tool solo.

### Flujo estándar

```
1. TeamCreate("nombre-de-sesion")
2. Spawn teammates con Agent tool (team_name + name)
3. Asignar tareas via TaskCreate / SendMessage
4. Los agentes trabajan, se comunican, actualizan tareas
5. Al terminar: shutdown teammates → TeamDelete
```

### Config de cada teammate (NO EXCEPTIONS)

```
subagent_type: "<nombre-del-agente>"   ← matchea .claude/agents/<nombre>.md
model: "opus"                           ← SIEMPRE opus, nunca sonnet/haiku
mode: "bypassPermissions"               ← sin confirmaciones
team_name: "<nombre-del-team>"          ← el team activo
name: "<ID-del-agente>"                 ← ej: "QZ-01", "FC-02"
```

### Ventajas sobre Agent tool solo

- Agentes VIVEN hasta shutdown — pueden recibir tareas adicionales
- Se COMUNICAN entre ellos via SendMessage
- MANTIENEN contexto entre tareas (estudiar → arreglar sin re-lanzar)
- Task list compartida — visibilidad de progreso
- Arquitecto (yo) orquesto como team lead

## Aislamiento por sesión (Git Worktrees) — CRÍTICO

> **PROBLEMA REAL:** Múltiples sesiones de Claude Code comparten `C:\dev\axon\frontend`.
> Cuando una hace `git checkout`, ROMPE la otra sesión. Esto ya causó commits en branches equivocadas.

**ENFORCEMENTS técnicos instalados:**
1. `post-checkout` git hook en ambos repos → WARNING visible si checkout non-main en repo principal
2. Script helper: `source /c/dev/axon/worktree.sh <frontend|backend> <branch>`

### REGLA #0 (ANTES de cualquier otra cosa)

```bash
# PRIMER comando de TODA sesión que trabaje en un branch:
source /c/dev/axon/worktree.sh frontend fix/my-branch
# → Crea C:\dev\axon\frontend-fix-my-branch y cd's into it
# → Toda la sesión trabaja SOLO desde ese directorio
```

### Prohibiciones absolutas

- **NUNCA `git checkout <branch>` en `C:\dev\axon\frontend` o `C:\dev\axon\backend`**
- **NUNCA trabajar en un branch desde el repo principal** — SIEMPRE worktree
- El repo principal SOLO se usa para: `git pull origin main`, `git worktree add/remove/list`

### Al finalizar la sesión

```bash
# Después de commit + push, desde el repo principal:
cd /c/dev/axon/frontend && git worktree remove ../frontend-fix-my-branch
```

### Convenciones

- Directorio: `C:\dev\axon\{repo}-{branch-con-guiones}` truncado a 30 chars
- `git worktree prune` al inicio para limpiar huérfanos
- `git worktree prune` al inicio de cada sesión para limpiar huérfanos
- Sub-agentes dentro de una sesión: `isolation: "worktree"` en Agent tool (ya existente)

## Reglas de Git

1. **NEVER push to main.** Always feature branch + PR.
2. **Git branches ALWAYS from main:** `git checkout main && git pull && git checkout -b fix/xxx main`
3. **Verify before push:** `git log --oneline main..<branch>` — if empty, commit went wrong.
4. **Each agent gets EXPLICIT file list** — zero overlap between agents.

## Reglas de Agentes

5. **ALL agents `model: "opus"`** — nunca sonnet/haiku, incluso para recon.
6. **ALL agents `mode: "bypassPermissions"`** — sin esto se bloquean pidiendo confirmación.
7. **Quality-gate audit** after every agent that writes code.
8. **Max 5 Opus teammates simultaneously** (API 529 above this).
9. **READ `feedback_agent_isolation.md`** before any multi-agent session.
10. **Agents MUST update their memory** (`agent-memory/individual/<ID>.md`) al final de cada sesión.
11. **2+ agents same repo → `isolation: "worktree"`** — solo funciona desde git repo, no desde Cowork.
