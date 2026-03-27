---
name: project_file_organization
description: File organization after OneDrive migration (2026-03-21) — code repos in C:\dev\axon\, docs in OneDrive
type: project
---

Code repos moved out of OneDrive to C:\dev\axon\ on 2026-03-21 due to OneDrive corrupting .git/ directories (error 0x8007017F).

**Code (C:\dev\axon\ — NOT synced, GitHub is the backup):**
- `C:\dev\axon\frontend\` ← clone of Matraca130/numero1_sseki_2325_55
- `C:\dev\axon\backend\` ← clone of Matraca130/axon-backend
- `C:\dev\axon\docs\` ← clone of Matraca130/axon-docs

**Documents (OneDrive → AXON PROJECTO\ — synced between machines):**
- `docs/` — ideas, roadmaps, diagnósticos, schemas
- `PROJETO DESAROLLO RESUMEN/` — prototipos, command center, templates
- `REBRAND SESSION FLASHCARD/` — design reference images
- `MI VAULT CLAUDINHO/` — Obsidian vault (semiología médica)
- `.auto-memory/` — Cowork persistent memory
- `.claude/` — Claude configuration
- CLAUDE.md, prototipos sueltos (.jsx, .html, .pdf)

**Why:** OneDrive can't handle .git/, node_modules/, and .lock files. Moving repos out eliminates sync errors while keeping documents synced.

**How to apply:** When launching agents to edit code, they work in C:\dev\axon\, NOT in OneDrive. Cowork workspace (AXON PROJECTO) is for planning, docs, and prototypes only.
