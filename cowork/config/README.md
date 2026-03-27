# Config — Configuración de Claude Agents

Configuración completa del sistema de agentes Claude que opera sobre el proyecto Axon.

## Carpetas

### `settings/`
| Archivo | Descripción |
|---|---|
| `settings.local.json` | Config de Claude Code: mode bypassPermissions, repos adicionales, model preferences |
| `launch.json` | Config de lanzamiento de Claude Code para esta máquina |
| `launch-PETRICK.json` | Config de lanzamiento específica de Petrick |
| `ralph-loop.local.md` | Config del loop autónomo de Ralph (agente autónomo) |

### `skills/`
| Archivo/Carpeta | Descripción |
|---|---|
| `code-review.md` | Skill de code review — instrucciones para que los agentes hagan reviews |
| `agendamientocorrecto/SKILL.md` | Skill de agendamiento correcto — instrucciones para scheduling tasks |

### `plans/`
| Archivo | Descripción |
|---|---|
| `topic-difficulty-analyzer.md` | Plan de implementación del analizador de dificultad por topic |

### `rules/`
| Archivo | Descripción |
|---|---|
| `design-system.md` | Reglas del design system: fuentes (Georgia headings, Inter body), no glassmorphism, tokens CSS |

### `bug-hunter/`
| Archivo | Descripción |
|---|---|
| `STATE.md` | Estado completo del bug hunter: 33 errores encontrados, 8 fijos, plan de remediación por prioridad |
