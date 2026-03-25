# Sistema Multi-Agente AXON — 70 Agentes Especializados

> 65 agentes con memoria individual, métricas, auto-evaluación, y evolución continua.

## Quick Start

**Tarea simple (1 agente):**
```
Actuá como [agente]. Lee tu definición en claude-config/agents/<nombre>.md
y tu memoria en claude-config/agent-memory/individual/<ID>.md.
Implementá [tarea].
```

**Tarea compleja (multi-agente):**
```
Actuá como el Arquitecto (XX-01). Lee claude-config/agents/architect.md.
Necesito [descripción].
```

## Estructura

```
claude-config/
│
├── AGENT-REGISTRY.md              ← EMPEZAR AQUÍ: índice de 70 agentes
├── MULTI-AGENT-PROCEDURE.md       ← Procedimiento completo del sistema
├── AGENT-SELF-EVAL.md             ← Protocolo de auto-evaluación (31 puntos)
├── CLAUDE-MD-ADDON.md             ← Sección para agregar al CLAUDE.md del repo de código
│
├── agents/                        ← Definiciones de agentes (76 archivos)
│   ├── architect.md               ← XX-01: Orquestador (punto de entrada)
│   ├── quality-gate.md            ← XX-02: Auditor post-ejecución
│   ├── quiz-frontend.md           ← QZ-01: UI de quizzes
│   ├── quiz-backend.md            ← QZ-02: API de quizzes
│   ├── ...                        ← 72 agentes más
│   └── (cada archivo tiene: rol, ownership, reglas, escalación)
│
├── agent-memory/                  ← Memoria compartida por sección
│   ├── quiz.md                    ← Errores y patterns de Quiz
│   ├── flashcards.md              ← Errores y patterns de Flashcards
│   ├── ai-rag.md                  ← Estado del sistema AI/RAG
│   ├── auth.md                    ← Decisiones de autenticación
│   ├── ...                        ← 10 secciones más
│   │
│   └── individual/                ← Memoria personal de CADA agente (65 archivos)
│       ├── QZ-01-quiz-frontend.md ← Lecciones, patrones, decisiones, métricas
│       ├── FC-04-fsrs.md          ← Parámetros FSRS, weights, calibración
│       ├── XX-02-quality-gate.md  ← Falsos positivos/negativos
│       ├── ...                    ← 62 agentes más
│       │
│       ├── AGENT-METRICS.md       ← Dashboard de métricas del sistema
│       ├── SELF-EVAL-RESULTS.md   ← Resultados de auto-evaluación (7 rondas)
│       └── IMPROVEMENT-VOTES.md   ← Votos democráticos de mejora
│
├── memory/                        ← Memoria global del proyecto
│   ├── feedback_agent_isolation.md ← Reglas de aislamiento + EVOLUCIÓN CONTINUA
│   ├── project_current_state.md   ← Estado actual del proyecto
│   └── ...
│
├── rules/                         ← Reglas auto-cargadas por sesión
├── skills/                        ← Skills personalizados
└── plans/                         ← Planes de implementación
```

## Cómo funciona

```
Agente inicia sesión
    ↓
Lee: definición → memoria individual → memoria de sección → isolation rules
    ↓
Trabaja dentro de su zona de ownership
    ↓
Quality Gate (XX-02) audita → auto-registra lecciones si hay errores
    ↓
Agente reflexiona → actualiza su memoria (EVOLUCIÓN CONTINUA)
    ↓
Próxima sesión: lee lecciones previas → no repite errores
```

## Archivos clave (por orden de importancia)

| # | Archivo | Para qué |
|---|---------|----------|
| 1 | `AGENT-REGISTRY.md` | Índice maestro: quién es quién, qué archivos posee, de quién depende |
| 2 | `agents/architect.md` | Punto de entrada para orquestación multi-agente |
| 3 | `memory/feedback_agent_isolation.md` | Reglas que TODOS los agentes leen (aislamiento + evolución) |
| 4 | `agents/quality-gate.md` | Auditor con tabla de severidad + auto-registro de lecciones |
| 5 | `AGENT-SELF-EVAL.md` | Protocolo de auto-evaluación para auditar calidad de agentes |
| 6 | `AGENT-METRICS.md` | Dashboard de métricas con Error Ledger y health scores |

## Métricas del sistema

| Métrica | Valor |
|---------|-------|
| Agentes totales | 70 (65 activos + 5 deprecated) |
| Agentes con memoria individual | 65 |
| Score promedio (auto-evaluación) | 26.0/31 |
| Agentes EXCELLENT (28+) | 30 (46%) |
| Agentes CRITICAL | 0 |
| Categorías evaluadas | Claridad, Contexto, Reglas, Feedback, Aislamiento, Completitud |

## Secciones de agentes

| Sección | IDs | Agentes | Foco |
|---------|-----|---------|------|
| Quiz | QZ-01 a QZ-06 | 6 | Quizzes adaptativos con BKT |
| Flashcards | FC-01 a FC-06 | 6 | Repetición espaciada FSRS v4 |
| Summaries | SM-01 a SM-06 | 6 | Contenido académico + video + highlighting |
| Study | ST-01 a ST-05 | 5 | Sesiones de estudio + planes + progreso |
| Dashboard | DG-01 a DG-05 | 5 | Dashboards + gamificación + leaderboard |
| Admin | AO-01 a AO-04 | 4 | Gestión de instituciones |
| Auth | AS-01 a AS-05 | 5 | Autenticación, RLS, seguridad |
| AI/RAG | AI-01 a AI-06 | 6 | Pipeline RAG, chat, embeddings, prompts |
| 3D | 3D-01 a 3D-04 | 4 | Visor 3D con Three.js |
| Infra | IF-01 a IF-05 | 5 | Plumbing, UI compartida, CI/CD |
| Messaging | MG-01 a MG-04 | 4 | Telegram, WhatsApp, notificaciones |
| Billing | BL-01 a BL-04 | 4 | Stripe checkout, webhooks, planes |
| Cross-cutting | XX-01 a XX-09 | 9 | Arquitecto, QG, tipos, tests, docs, migrations |
