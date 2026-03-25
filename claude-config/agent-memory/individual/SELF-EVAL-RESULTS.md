# Agent Self-Evaluation Results
Last updated: 2026-03-25

---

## Rondas de evaluación

| Ronda | Fecha | Agentes | Avg Score | Fix aplicado |
|-------|-------|---------|-----------|-------------|
| v1 | 2026-03-25 | 6 | 14.9/31 | — |
| v2 | 2026-03-25 | 6 | 17.6/31 | P0: Revisión/escalación + tabla severidad QG |
| v3 | 2026-03-25 | 12 | 22.8/31 | P1: Depends On + METRICS en inicio + [APRENDIDO] + reglas scanner |
| v4 | 2026-03-25 | 24 | 24.0/31 | Propagación masiva: CLAUDE.md + isolation a 56 agentes |

---

## Todos los scores (24 agentes evaluados)

### EXCELLENT (28+) — 3 agentes

| Agent | Score | A | B | C | D | E | F |
|-------|-------|---|---|---|---|---|---|
| XX-07 refactor-scout | **29** | 5/5 | 6/6 | 5/5 | 5/6 | 4/4 | 4/5 |
| FC-04 flashcards-fsrs | **28** | 5/5 | 5/6 | 4/5 | 5/6 | 4/4 | 5/5 |
| AI-02 rag-chat | **28** | 5/5 | 5/6 | 4/5 | 6/6 | 3/4 | 5/5 |

### GOOD (22-27) — 15 agentes

| Agent | Score | A | B | C | D | E | F |
|-------|-------|---|---|---|---|---|---|
| 3D-01 viewer3d-frontend | **27** | 5/5 | 5/6 | 5/5 | 4/6 | 4/4 | 4/5 |
| BL-01 stripe-checkout | **27** | 5/5 | 5/6 | 5/5 | 4/6 | 4/4 | 4/5 |
| XX-02 quality-gate | **26** | 5/5 | 6/6 | 5/5 | 4/6 | 3/4 | 3/5 |
| DG-03 gamification-engine | **26** | 5/5 | 5/6 | 5/5 | 4/6 | 3/4 | 4/5 |
| AI-04 embeddings | **26** | 4/5 | 5/6 | 5/5 | 4/6 | 4/4 | 4/5 |
| XX-04 type-guardian | **26** | 4/5 | 5/6 | 5/5 | 5/6 | 3/4 | 4/5 |
| IF-04 infra-database | **26** | 4/5 | 5/6 | 5/5 | 4/6 | 4/4 | 4/5 |
| DG-01 dashboard-student | **26** | 5/5 | 5/6 | 5/5 | 3/6 | 4/4 | 4/5 |
| ST-01 study-hub | **25** | 5/5 | 5/6 | 4/5 | 3/6 | 4/4 | 4/5 |
| AS-04 security-scanner | **25** | 5/5 | 5/6 | 4/5 | 4/6 | 3/4 | 4/5 |
| AI-01 rag-pipeline | **25** | 4/5 | 6/6 | 4/5 | 4/6 | 3/4 | 4/5 |
| MG-01 telegram-bot | **25** | 4/5 | 5/6 | 5/5 | 3/6 | 4/4 | 4/5 |
| AS-02 auth-frontend | **24** | 5/5 | 5/6 | 4/5 | 4/6 | 3/4 | 3/5 |
| AS-01 auth-backend | **23** | 4/5 | 5/6 | 4/5 | 3/6 | 3/4 | 4/5 |
| XX-06 test-orchestrator | **22** | 4/5 | 4/6 | 4/5 | 4/6 | 3/4 | 3/5 |

### NEEDS ATTENTION (16-21) — 6 agentes

| Agent | Score | A | B | C | D | E | F |
|-------|-------|---|---|---|---|---|---|
| AO-01 admin-frontend | **21** | 4/5 | 5/6 | 4/5 | 2/6 | 3/4 | 3/5 |
| FC-01 flashcards-frontend | **21** | 5/5 | 3/6 | 5/5 | 2/6 | 3/4 | 3/5 |
| SM-04 content-tree | **18** | 5/5 | 3/6 | 4/5 | 1/6 | 3/4 | 2/5 |
| QZ-02 quiz-backend | **18** | 4/5 | 4/6 | 3/5 | 1/6 | 3/4 | 3/5 |
| QZ-01 quiz-frontend | **16** | 4/5 | 2/6 | 4/5 | 1/6 | 2/4 | 3/5 |
| IF-01 infra-plumbing | **16** | 5/5 | 2/6 | 3/5 | 1/6 | 2/4 | 3/5 |

### CRITICAL (<16) — 0 agentes

---

## Análisis por categoría (24 agentes)

| Categoría | Avg | Min | Max | Agentes con score bajo |
|-----------|-----|-----|-----|----------------------|
| A. Claridad | 4.6/5 | 4 | 5 | — (todos bien) |
| B. Contexto | 4.8/6 | 2 | 6 | QZ-01 (2), IF-01 (2), FC-01 (3), SM-04 (3) |
| C. Reglas | 4.5/5 | 3 | 5 | QZ-02 (3), IF-01 (3) |
| D. Feedback | 3.5/6 | 1 | 6 | QZ-01 (1), QZ-02 (1), SM-04 (1), IF-01 (1), AO-01 (2), FC-01 (2) |
| E. Aislamiento | 3.4/4 | 2 | 4 | QZ-01 (2), IF-01 (2) |
| F. Completitud | 3.8/5 | 2 | 5 | SM-04 (2) |

### Patrón claro

**Categoría D (Feedback Loop) sigue siendo la más débil** — avg 3.5/6. Los 6 agentes NEEDS ATTN tienen D ≤ 2/6. Esto es porque:
- No tienen memoria individual (solo los 13 agentes con archivos en `individual/`)
- Sus memorias de sección están vacías (templates sin datos)
- No tienen reglas [APRENDIDO]

**Los agentes que recibieron P1 (memoria individual + METRICS en inicio) tienen D avg 4.5/6.** Los que no lo recibieron tienen D avg 1.8/6.

---

## Distribución del sistema

```
EXCELLENT (28+):   3 agentes (12.5%)  ████
GOOD (22-27):     15 agentes (62.5%)  ████████████████
NEEDS ATTN (16-21): 6 agentes (25%)   ████████
CRITICAL (<16):    0 agentes (0%)
```

**24/70 agentes evaluados (34%)**. Promedio: **24.0/31**.

---

## Issues recurrentes en los 12 nuevos

| Issue | Frecuencia | Fix |
|-------|-----------|-----|
| Memoria de sección vacía (template sin datos) | 8/12 | Poblar con estado actual, bugs conocidos |
| Sin memoria individual | 11/12 | Solo los 13 agentes priorizados la tienen |
| Sin reglas [APRENDIDO] | 12/12 | Se genera con uso real del sistema |
| D5: Acceso a QG results no explícito | 6/12 | Agregar lectura de AGENT-METRICS.md |

---

## Top suggestions de los 12 nuevos (F5)

| Agent | Sugerencia |
|-------|-----------|
| QZ-02 | Poblar agent-memory/quiz.md con errores/patrones conocidos |
| ST-01 | Crear feedback loop en study.md |
| DG-03 | Crear memoria individual DG-03 |
| AO-01 | Agregar dependencias de componentes cross-section |
| AS-02 | Expandir auth.md con Lessons & Antipatterns |
| AI-04 | Criterios claros IVFFlat vs HNSW |
| 3D-01 | Agregar AGENT-METRICS.md al inicio |
| MG-01 | Crear memoria individual MG-01 |
| BL-01 | Crear memoria individual stripe-checkout |
| XX-04 | Matriz de escalación para consolidación de tipos |
| XX-07 | Scanning Protocol con orden de búsquedas |
| IF-04 | Crear memoria individual IF-04 |
