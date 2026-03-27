# Cowork — Central de Comando Axon

> Contenido migrado desde OneDrive (AXON PROJECTO) al repo para que todo quede registrado en GitHub.

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

## Qué NO está aquí

- **assets/hero-video/** (1200+ frames de video) — demasiado grande para el repo, vive solo en OneDrive
- **landing-deploy/** (1200+ archivos de deploy) — artefacto de build, no documentación
- **Archivos temporales** (.patch, .zip, .lnk) — no relevantes

## Cómo usar esto

Si estás onboarding o necesitas contexto sobre una feature específica, navega a la carpeta de research correspondiente. Cada sub-carpeta tiene documentos auto-explicativos con nombres descriptivos.

Para entender cómo funciona el sistema de agentes, mira `config/` junto con `claude-config/` (en la raíz del repo).
