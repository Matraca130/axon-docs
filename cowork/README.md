# Cowork — Central de Comando Axon

> Contenido migrado desde OneDrive (AXON PROJECTO) al repo para que todo quede registrado en GitHub.
> Updated: 2026-03-29

Este directorio contiene TODO el material de trabajo del proyecto Axon que se genera y gestiona desde Cowork (Claude desktop). Incluye investigación, prototipos, configuración de agentes, auditorías, y documentos de decisiones.

## Estructura

| Carpeta | Qué contiene | Para qué sirve |
|---|---|---|
| `research/` | Documentos de investigación organizados por feature | Contexto profundo para implementar cada feature — calendar, flashcards, summaries, landing, personalización |
| `prototypes/` | Prototipos funcionales (.jsx, .html, .pdf) | Visualizar ideas antes de implementar — resúmenes, landing pages, dashboards |
| `audits/` | Auditorías de código y UX | Diagnósticos de calidad del código, gamificación, mobile UX |
| `config/` | Configuración de Claude: settings, skills, plans, rules, bug-hunter | Cómo están configurados los agentes, qué reglas siguen, estado del bug hunter |
| `command-center/` | PROJETO DESAROLLO RESUMEN — versión anterior del command center | Arquitectura, changelog, roadmap, memoria de sesiones anteriores (pre-Cowork) |
| `vault/` | MI VAULT CLAUDINHO — notas de Obsidian | Notas de semiología médica y contenido educativo del proyecto |
| `design-reference/` | Imágenes de referencia para rebrand de flashcards | Screenshots y mockups que definen la dirección visual |
| `photos/` | Fotos y assets del proyecto Axon | Logos, imágenes generadas para la plataforma |
| `memory/` | Memorias de contexto adicionales | Contexto de plataforma, glosario, estado de proyectos específicos |
| `Axon_Workflow_Guide.docx` | Guía completa de workflow | El documento canónico de cómo se organiza y opera el proyecto |

## Organización del Proyecto (AXON PROJECTO/)

El mono-workspace tiene esta estructura:

```
AXON PROJECTO/                  ← raíz del proyecto (montado en Cowork + CLI)
  frontend/                     ← repo git: Matraca130/numero1_sseki_2325_55 (siempre en main)
  backend/                      ← repo git: Matraca130/axon-backend (siempre en main)
  docs/                         ← repo git: Matraca130/axon-docs (este repo)
  01-audits/                    ← auditorías de sesiones anteriores
  02-plans/                     ← planes de implementación
  03-specs/                     ← especificaciones técnicas
  04-design/                    ← assets de diseño
  05-prompts/                   ← prompts de sesiones
  06-prototypes/                ← prototipos funcionales
  07-landing/                   ← landing page assets
  08-ai-config/                 ← configuración de AI
  09-workflow-hub/              ← hub de workflows
  10-chat-agent/                ← chat agent config
  11-vault/                     ← vault de notas
  12-assets/                    ← assets generales
  13-misc/                      ← misceláneos
  RESUMENES/                    ← resúmenes de sesiones
  memory/                       ← memorias persistentes
  .claude/                      ← reglas, agents, skills para Claude Code CLI
  CLAUDE.md                     ← contexto principal para Claude
  TASKS.md                      ← tareas activas
  INDEX.md                      ← índice del proyecto
```

## Workflow de Desarrollo

- **Git worktrees obligatorios** — nunca checkout en repos principales, siempre worktrees como hermanos (`AXON PROJECTO/frontend-feat-branch/`)
- **Agent Teams** — sistema multi-agente con TeamCreate/SendMessage, todos los agentes en modelo Opus
- **Feature branches + PR** — nunca push directo a main
- **Quality gate audit** después de cada agente que escribe código
- **Máximo 5 agentes Opus simultáneos** (límite API 529)

## Estado Actual (2026-03-29)

- **14 PRs merged** a main (acumulativo)
- **Calendar v2** — completado y mergeado (7 sesiones + QA)
- **Block-Based Summaries** — en producción (PR #208)
- **Flashcard Image Pipeline** — mergeado, pendiente e2e test
- **40/76 agentes recon completados** (Batch 1+2)
- **Sprint 0:** Badges de Esfuerzo + Calibración Adaptativa pendientes

## Qué NO está aquí

- **assets/hero-video/** (1200+ frames de video) — demasiado grande para el repo, vive solo en OneDrive
- **landing-deploy/** (1200+ archivos de deploy) — artefacto de build, no documentación
- **Archivos temporales** (.patch, .zip, .lnk) — no relevantes

## Cómo usar esto

Si estás onboarding o necesitas contexto sobre una feature específica, navega a la carpeta de research correspondiente. Cada sub-carpeta tiene documentos auto-explicativos con nombres descriptivos.

Para entender cómo funciona el sistema de agentes, mira `config/` junto con `claude-config/` (en la raíz del repo).
