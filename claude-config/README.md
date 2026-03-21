# Claude Config Backup

Copia de respaldo de toda la configuracion de Claude Code para el proyecto Axon.
Actualizado: 2026-03-21

## Estructura

```
claude-config/
  claude-md/          # CLAUDE.md de cada repo (instrucciones de proyecto)
    ROOT-CLAUDE.md    # Workspace root
    FRONTEND-CLAUDE.md # numero1_sseki_2325_55
  rules/              # .claude/rules/ (reglas auto-cargadas cada sesion)
    agent-workflow.md
    design-system.md
  agents/             # .claude/agents/ (15 agentes especializados)
  agent-memory/       # .claude/agent-memory/ (memoria por agente)
  memory/             # Claude memory (estado del proyecto, feedback, preferencias)
    MEMORY.md         # Indice de memoria
    project_*.md      # Estado del proyecto
    feedback_*.md     # Preferencias y reglas aprendidas
    reference_*.md    # Info de infra/repos
    user_petri.md     # Perfil del usuario
  skills/             # .claude/skills/ (skills personalizados)
  plans/              # .claude/plans/ (planes de implementacion)
  ralph-loop.local.md # Config de Ralph Loop
```

## Uso

Estos archivos son referencia. Los originales viven en:
- `.claude/` en el workspace root (agents, rules, agent-memory, skills, plans)
- `~/.claude/projects/.../memory/` (memory files)
- `CLAUDE.md` en cada repo root

Para restaurar, copiar cada carpeta a su ubicacion original.
