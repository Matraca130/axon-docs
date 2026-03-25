# Agent Metrics Dashboard
Last updated: 2026-03-25

> El Arquitecto actualiza esta tabla después de cada post-mortem.

## Métricas globales por agente

| Agent ID | Name | Sessions | QG PASS | QG FAIL | QG BLOCK | Scope Creep | Avg Files | Last Run | Health |
|----------|------|----------|---------|---------|----------|-------------|-----------|----------|--------|
| FC-04 | flashcards-fsrs | 0 | 0 | 0 | 0 | 0 | — | — | NEW |
| QZ-04 | quiz-adaptive | 0 | 0 | 0 | 0 | 0 | — | — | NEW |
| AI-01 | rag-pipeline | 0 | 0 | 0 | 0 | 0 | — | — | NEW |
| AI-02 | rag-chat | 0 | 0 | 0 | 0 | 0 | — | — | NEW |
| AI-04 | embeddings | 0 | 0 | 0 | 0 | 0 | — | — | NEW |
| AS-01 | auth-backend | 0 | 0 | 0 | 0 | 0 | — | — | NEW |
| XX-02 | quality-gate | 0 | 0 | 0 | 0 | 0 | — | — | NEW |

> Agentes sin memoria individual usan solo métricas en esta tabla.
> Los 7 agentes con memoria individual tienen métricas detalladas en sus archivos.

## Todos los agentes (resumen)

| Agent ID | Sessions | Last QG | Last Run |
|----------|----------|---------|----------|
| QZ-01 | 0 | — | — |
| QZ-02 | 0 | — | — |
| QZ-03 | 0 | — | — |
| QZ-04 | 0 | — | — |
| QZ-05 | 0 | — | — |
| QZ-06 | 0 | — | — |
| FC-01 | 0 | — | — |
| FC-02 | 0 | — | — |
| FC-03 | 0 | — | — |
| FC-04 | 0 | — | — |
| FC-05 | 0 | — | — |
| FC-06 | 0 | — | — |
| SM-01 | 0 | — | — |
| SM-02 | 0 | — | — |
| SM-03 | 0 | — | — |
| SM-04 | 0 | — | — |
| SM-05 | 0 | — | — |
| SM-06 | 0 | — | — |
| ST-01 | 0 | — | — |
| ST-02 | 0 | — | — |
| ST-03 | 0 | — | — |
| ST-04 | 0 | — | — |
| ST-05 | 0 | — | — |
| DG-01 | 0 | — | — |
| DG-02 | 0 | — | — |
| DG-03 | 0 | — | — |
| DG-04 | 0 | — | — |
| DG-05 | 0 | — | — |
| AO-01 | 0 | — | — |
| AO-02 | 0 | — | — |
| AO-03 | 0 | — | — |
| AO-04 | 0 | — | — |
| AS-01 | 0 | — | — |
| AS-02 | 0 | — | — |
| AS-03 | 0 | — | — |
| AS-04 | 0 | — | — |
| AS-05 | 0 | — | — |
| AI-01 | 0 | — | — |
| AI-02 | 0 | — | — |
| AI-03 | 0 | — | — |
| AI-04 | 0 | — | — |
| AI-05 | 0 | — | — |
| AI-06 | 0 | — | — |
| 3D-01 | 0 | — | — |
| 3D-02 | 0 | — | — |
| 3D-03 | 0 | — | — |
| 3D-04 | 0 | — | — |
| IF-01 | 0 | — | — |
| IF-02 | 0 | — | — |
| IF-03 | 0 | — | — |
| IF-04 | 0 | — | — |
| IF-05 | 0 | — | — |
| MG-01 | 0 | — | — |
| MG-02 | 0 | — | — |
| MG-03 | 0 | — | — |
| MG-04 | 0 | — | — |
| BL-01 | 0 | — | — |
| BL-02 | 0 | — | — |
| BL-03 | 0 | — | — |
| BL-04 | 0 | — | — |
| XX-01 | 0 | — | — |
| XX-02 | 0 | — | — |
| XX-03 | 0 | — | — |
| XX-04 | 0 | — | — |
| XX-05 | 0 | — | — |
| XX-06 | 0 | — | — |
| XX-07 | 0 | — | — |
| XX-08 | 0 | — | — |
| XX-09 | 0 | — | — |

## Health Scores

| Score | Meaning | Criteria |
|-------|---------|----------|
| NEW | Sin datos | 0 sesiones |
| GREEN | Saludable | >80% QG PASS, 0 scope creep en últimas 5 sesiones |
| YELLOW | Atención | 50-80% QG PASS, o 1 scope creep reciente |
| RED | Problemático | <50% QG PASS, o 2+ scope creep, o 2+ BLOCK |

## Instrucciones para el Arquitecto

Después de cada post-mortem:
1. Incrementar `Sessions` del agente ejecutado
2. Actualizar `Last QG` con PASS/FAIL/BLOCK
3. Actualizar `Last Run` con fecha
4. Si el agente tiene memoria individual → actualizar también su archivo en `individual/`
5. Recalcular `Health` según criterios de la tabla
