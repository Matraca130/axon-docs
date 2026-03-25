# Procedimiento: Sistema Multi-Agent con Arquitecto (70 agentes)

> **Date:** 2026-03-25
> **Escala:** 70 agentes especializados + 1 arquitecto orquestador
> **Basado en:** Sistema actual de 16→24 agentes, escalado a cobertura total

---

## Resumen

```
Usuario → Arquitecto → [selecciona agentes del Registry] → lanza sesión → quality-gate
```

El **Arquitecto** (XX-01) es el punto de entrada único. Lee el **Agent Registry** (índice de 70 agentes), identifica cuáles son necesarios para el pedido, resuelve dependencias, y genera un plan de ejecución.

---

## Paso 1: Crear las definiciones de agentes faltantes

Actualmente tienes 16 agentes definidos en `claude-config/agents/`. Necesitas crear 54 más.

### Formato estándar para cada agente

```markdown
---
name: [agent-name]
description: [1 línea de qué hace. Usa para X, Y, Z.]
tools: Read, Write, Edit, Bash, Glob, Grep
model: opus
---

## Rol
Sos el agente [nombre] de AXON. [1 línea de responsabilidad].

## Tu zona de ownership
**Por nombre:** [patrón de archivos]
**Por directorio:**
- [lista explícita de archivos]

## Zona de solo lectura
Todo fuera de tu zona. Escalar al lead para modificar lógica de otra zona.

## Al iniciar cada sesión
1. Leer `.claude/agent-memory/[section].md`

## Reglas de código
- TypeScript strict, no `any`, no console.log
- Usar `apiCall()` de `lib/api.ts`
- [reglas específicas de la sección]

## Contexto técnico
- [stack relevante]
- [APIs que usa]
- [dependencias clave]
```

### Orden de creación recomendado

Crear por sección, en este orden (de más a menos impacto):

| Prioridad | Sección | Agentes a crear | Ya existen |
|-----------|---------|-----------------|------------|
| 1 | Cross-cutting (XX) | XX-04 a XX-09 (6) | XX-01 (architect), XX-02 (quality-gate), XX-03 (docs-writer) |
| 2 | Auth & Security (AS) | AS-01 a AS-05 (5) | — |
| 3 | AI & RAG (AI) | AI-01 a AI-06 (6) | infra-ai (parcial) |
| 4 | Study (ST) | ST-01 a ST-05 (5) | study-dev (parcial) |
| 5 | Dashboard (DG) | DG-01 a DG-05 (5) | — |
| 6 | Quiz (QZ) | QZ-04 a QZ-06 (3) | quiz-frontend, quiz-backend, quiz-tester |
| 7 | Flashcards (FC) | FC-04 a FC-06 (3) | flashcards-frontend, flashcards-backend, flashcards-tester |
| 8 | Summaries (SM) | SM-01 a SM-06 (6) | summaries-frontend, summaries-backend, summaries-tester |
| 9 | Admin (AO) | AO-01 a AO-04 (4) | admin-dev (parcial) |
| 10 | Infra (IF) | IF-04, IF-05 (2) | infra-plumbing, infra-ui, infra-ai |
| 11 | 3D (3D) | 3D-01 a 3D-04 (4) | — |
| 12 | Messaging (MG) | MG-01 a MG-04 (4) | — |
| 13 | Billing (BL) | BL-01 a BL-04 (4) | — |

---

## Paso 2: Crear agent-memory por sección

Cada sección necesita un archivo de memoria compartida:

```
claude-config/agent-memory/
├── quiz.md          ← ya existe
├── flashcards.md    ← ya existe
├── summaries.md     ← ya existe
├── study.md         ← ya existe
├── admin.md         ← ya existe
├── infra.md         ← ya existe
├── docs.md          ← ya existe
├── auth.md          ← CREAR
├── ai-rag.md        ← CREAR
├── 3d-viewer.md     ← CREAR
├── dashboard.md     ← CREAR
├── messaging.md     ← CREAR
├── billing.md       ← CREAR
└── cross-cutting.md ← CREAR
```

Formato de cada memory:

```markdown
# [Section] Memory

## Estado actual
- [qué está hecho, qué falta]

## Decisiones tomadas
- [decisiones que NO se deben re-litigar]

## Archivos clave
- [files y su propósito]

## Bugs conocidos
- [bugs abiertos de esta sección]
```

---

## Paso 3: Flujo de uso diario

### 3a. Inicio de sesión

```
Usuario: "Quiero agregar analytics a los quizzes"
     │
     ▼
Arquitecto (XX-01) se activa:
  1. Lee AGENT-REGISTRY.md
  2. Busca archivos relevantes (Glob/Grep "analytics", "quiz")
  3. Identifica agentes: QZ-06 (quiz-analytics), QZ-02 (quiz-backend), DG-01 (dashboard)
  4. Resuelve deps: QZ-06 depende de QZ-02 y DG-01
  5. Genera plan:
     Phase 1: QZ-02 (nuevo endpoint analytics)
     Phase 2: QZ-06 + DG-01 (paralelo, frontend)
     Phase 3: XX-02 (quality-gate)
  6. Muestra plan al usuario
  7. Usuario confirma → lanza agentes
```

### 3b. Durante la sesión

```
Arquitecto monitorea:
  - ¿Agente terminó? → lanza quality-gate en background
  - ¿Quality-gate falló? → notifica al usuario
  - ¿Dependencia completada? → lanza siguiente fase
  - ¿Conflicto detectado? → pausa y escala al usuario
```

### 3c. Fin de sesión

```
1. Todos los agentes terminaron
2. Todos los quality-gates pasaron
3. Arquitecto reporta:
   - Agentes ejecutados
   - Archivos modificados
   - Branches creadas
   - PRs para review
4. Actualiza agent-memory de las secciones tocadas
```

---

## Paso 4: Configuración del CLAUDE.md raíz

Agregar al CLAUDE.md raíz del proyecto:

```markdown
## Agent System

- **70 agents** organized in 12 sections + cross-cutting
- **Architect agent** (XX-01) is the entry point for multi-agent sessions
- **Agent Registry:** `axon-docs/claude-config/AGENT-REGISTRY.md`
- **Agent definitions:** `axon-docs/claude-config/agents/*.md`
- **Agent memory:** `axon-docs/claude-config/agent-memory/*.md`

### To start a multi-agent session:
1. Describe what you want
2. The Architect will propose a plan
3. Confirm → agents launch

### Single-agent tasks:
For simple tasks (1 file, 1 change), invoke the agent directly — no need for the Architect.
```

---

## Paso 5: Mantener el registro actualizado

### Cuándo actualizar AGENT-REGISTRY.md

| Evento | Acción |
|--------|--------|
| Nuevo archivo/módulo en el codebase | Asignar ownership a un agente existente o crear nuevo |
| Agente siempre se usa junto con otro | Considerar fusionarlos (reducir count) |
| Agente nunca se usa | Marcar como `dormant`, no eliminar |
| Archivo cambia de dueño | Actualizar "Files Owned" en registry |
| Nuevo agente creado | Agregar al registry con ID, section, deps |

### Auditoría periódica

Cada 2 semanas (o cuando el codebase cambie significativamente):

1. `XX-07` (refactor-scout) escanea archivos sin dueño
2. Arquitecto verifica que no hay overlap entre agentes
3. Actualizar registry si hay cambios

---

## Límites operativos

| Límite | Valor | Razón |
|--------|-------|-------|
| Agentes simultáneos | 20 | Configurado por el equipo |
| Agentes por sesión | 15-20 | Más allá pierde coherencia |
| Archivos por agente | 10-20 | Más allá el agente pierde foco |
| Fases de ejecución | 4-5 max | Más allá la sesión es demasiado larga |
| Quality-gates por sesión | 1 por agente que escribe código | Nunca saltear |

---

## Ejemplo completo: "Quiero que el student vea un leaderboard con XP"

```
Arquitecto analiza:
  → Toca gamification (XP) + leaderboard UI + dashboard
  → Archivos: gamification-service, leaderboard components, dashboard

Plan:
  Phase 1: DG-04 (gamification-backend) — endpoint GET /leaderboard
  Phase 2: DG-05 (leaderboard UI) + DG-03 (XP hooks) — paralelo
  Phase 3: DG-01 (dashboard) — integrar widget
  Phase 4: XX-02 (quality-gate) — después de cada fase

Branches:
  DG-04 → feat/leaderboard-api
  DG-05 → feat/leaderboard-ui
  DG-03 → feat/xp-hooks
  DG-01 → feat/dashboard-leaderboard

Merge order:
  DG-04 → DG-05 + DG-03 → DG-01
```
