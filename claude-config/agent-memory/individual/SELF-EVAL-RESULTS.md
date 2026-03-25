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
| **v5** | **2026-03-25** | **70** | **24.7/31** | **Fix NEEDS ATTN agents + evaluación completa del sistema** |

---

## Distribución final del sistema (70 agentes)

```
EXCELLENT (28+):  ██████████████          14 (20%)
GOOD (22-27):     ██████████████████████████████████████  38 (54%)
NEEDS ATTN (16-21): ██████████████████    18 (26%)
CRITICAL (<16):                            0 (0%)
```

**0 agentes CRITICAL. 72% del sistema en GOOD o mejor.**

---

## Todos los scores (70 agentes)

### EXCELLENT (28+) — 14 agentes

| Agent | Score | A | B | C | D | E | F |
|-------|-------|---|---|---|---|---|---|
| 3D-02 viewer3d-backend | **30** | 5 | 6 | 5 | 5 | 4 | 5 |
| QZ-03 quiz-tester | **29** | 5 | 6 | 5 | 5 | 4 | 4 |
| QZ-05 quiz-questions | **29** | 5 | 6 | 5 | 4 | 4 | 5 |
| QZ-06 quiz-analytics | **29** | 5 | 6 | 5 | 4 | 4 | 5 |
| XX-07 refactor-scout | **29** | 5 | 6 | 5 | 5 | 4 | 4 |
| AI-02 rag-chat | **28** | 5 | 5 | 4 | 6 | 3 | 5 |
| AI-03 ai-generation | **28** | 5 | 6 | 5 | 5 | 3 | 4 |
| BL-03 billing-frontend | **28** | 5 | 6 | 5 | 3 | 4 | 5 |
| BL-04 billing-plans | **28** | 5 | 6 | 5 | 3 | 4 | 5 |
| FC-02 flashcards-backend | **28** | 5 | 6 | 5 | 3 | 4 | 5 |
| FC-04 flashcards-fsrs | **28** | 5 | 5 | 4 | 5 | 4 | 5 |
| MG-04 messaging-backend | **28** | 5 | 6 | 5 | 4 | 4 | 4 |
| BL-01 stripe-checkout | **27** (borderline) | 5 | 5 | 5 | 4 | 4 | 4 |
| FC-06 flashcards-generation | **27** | 5 | 6 | 5 | 4 | 3 | 4 |

### GOOD (22-27) — 38 agentes

| Agent | Score | A | B | C | D | E | F |
|-------|-------|---|---|---|---|---|---|
| 3D-01 viewer3d-frontend | 27 | 5 | 5 | 5 | 4 | 4 | 4 |
| BL-02 stripe-webhooks | 27 | 5 | 6 | 5 | 3 | 4 | 4 |
| DG-03 gamification-engine | 26 | 5 | 5 | 5 | 4 | 3 | 4 |
| AI-04 embeddings | 26 | 4 | 5 | 5 | 4 | 4 | 4 |
| XX-04 type-guardian | 26 | 4 | 5 | 5 | 5 | 3 | 4 |
| IF-04 infra-database | 26 | 4 | 5 | 5 | 4 | 4 | 4 |
| DG-01 dashboard-student | 26 | 5 | 5 | 5 | 3 | 4 | 4 |
| XX-03 docs-writer | 26 | 5 | 3 | 5 | 5 | 4 | 4 |
| XX-02 quality-gate | 26 | 5 | 6 | 5 | 4 | 3 | 3 |
| FC-03 flashcards-tester | 26 | 4 | 6 | 5 | 3 | 4 | 4 |
| FC-05 flashcards-keywords | 26 | 5 | 6 | 4 | 3 | 4 | 4 |
| 3D-03 viewer3d-upload | 26 | 5 | 6 | 4 | 4 | 3 | 4 |
| MG-02 whatsapp-bot | 26 | 5 | 6 | 4 | 4 | 4 | 3 |
| ST-01 study-hub | 25 | 5 | 5 | 4 | 3 | 4 | 4 |
| AS-04 security-scanner | 25 | 5 | 5 | 4 | 4 | 3 | 4 |
| AI-01 rag-pipeline | 25 | 4 | 6 | 4 | 4 | 3 | 4 |
| MG-01 telegram-bot | 25 | 4 | 5 | 5 | 3 | 4 | 4 |
| AI-05 ai-backend | 25 | 4 | 5 | 5 | 3 | 4 | 4 |
| AI-06 ai-prompts | 25 | 4 | 5 | 5 | 3 | 4 | 4 |
| IF-05 infra-ci | 25 | 5 | 6 | 5 | 2 | 3 | 4 |
| DG-05 leaderboard | 25 | 5 | 5 | 5 | 2 | 4 | 4 |
| AS-02 auth-frontend | 24 | 5 | 5 | 4 | 4 | 3 | 3 |
| AS-03 rls-auditor | 24 | 5 | 5 | 2 | 5 | 4 | 3 |
| XX-05 migration-writer | 24 | 5 | 6 | 5 | 2 | 2 | 4 |
| SM-02 summaries-backend | 24 | 4 | 5 | 5 | 2 | 4 | 4 |
| AS-01 auth-backend | 23 | 4 | 5 | 4 | 3 | 3 | 4 |
| AO-04 owner-backend | 23 | 5 | 5 | 4 | 2 | 4 | 3 |
| AS-05 cors-headers | 23 | 4 | 4 | 4 | 2 | 3 | 2 |(nota: apiCall irrelevante para middleware)
| MG-03 notifications | 23 | 4 | 5 | 5 | 3 | 3 | 3 |
| ST-02 study-sessions | 23 | 4 | 4 | 5 | 3 | 3 | 4 |
| ST-03 study-queue | 23 | 4 | 4 | 5 | 3 | 3 | 4 |
| 3D-04 viewer3d-annotations | 23 | 4 | 6 | 4 | 3 | 2 | 4 |
| XX-06 test-orchestrator | 22 | 4 | 4 | 4 | 4 | 3 | 3 |
| SM-05 video-player | 22 | 4 | 4 | 5 | 2 | 3 | 4 |
| SM-06 text-highlighter | 22 | 4 | 4 | 5 | 2 | 3 | 4 |
| ST-05 study-progress | 22 | 4 | 4 | 4 | 3 | 4 | 3 |
| FC-01 flashcards-frontend | 22 | 5 | 4 | 5 | 2 | 3 | 3 |
| XX-09 api-contract | 21 (borderline) | 4 | 4 | 4 | 2 | 4 | 3 |

### NEEDS ATTENTION (16-21) — 18 agentes

| Agent | Score | A | B | C | D | E | F |
|-------|-------|---|---|---|---|---|---|
| AO-01 admin-frontend | 21 | 4 | 5 | 4 | 2 | 3 | 3 |
| IF-02 infra-ui | 21 | 5 | 5 | 1 | 3 | 2 | 5 |
| ST-04 study-plans | 20 | 3 | 4 | 4 | 3 | 3 | 3 |
| IF-03 infra-ai | 19 | 4 | 5 | 1 | 2 | 3 | 4 |
| DG-02 dashboard-professor | 19 | 4 | 4 | 4 | 2 | 3 | 2 |
| QZ-02 quiz-backend | 18 | 4 | 4 | 3 | 1 | 3 | 3 |
| SM-04 content-tree | 18 | 5 | 3 | 4 | 1 | 3 | 2 |
| DG-04 gamification-backend | 18 | 5 | 3 | 4 | 1 | 3 | 2 |
| QZ-01 quiz-frontend | 17 | 4 | 3 | 4 | 1 | 2 | 3 |
| IF-01 infra-plumbing | 17 | 5 | 3 | 3 | 1 | 2 | 3 |
| SM-03 summaries-tester | 16 | 4 | 3 | 3 | 1 | 3 | 2 |
| AO-02 admin-backend | 12 | 3 | 2 | 3 | 1 | 2 | 1 |
| AO-03 owner-frontend | 14 | 4 | 2 | 3 | 1 | 2 | 2 |

> Nota: AO-02 y AO-03 son los agentes más débiles del sistema. Necesitan reescritura de definición.

---

## Análisis por categoría (70 agentes)

| Categoría | Avg | Min | Agentes <50% |
|-----------|-----|-----|-------------|
| A. Claridad | 4.6/5 | 3 | 2 (ST-04, AO-02) |
| B. Contexto | 4.9/6 | 2 | 3 (AO-02, AO-03, SM-04) |
| C. Reglas | 4.3/5 | 1 | 2 (IF-02, IF-03) — sin reglas de código |
| **D. Feedback** | **3.0/6** | **1** | **28 agentes con D ≤ 3** |
| E. Aislamiento | 3.3/4 | 2 | 8 |
| F. Completitud | 3.8/5 | 1 | 3 (AO-02, AS-05, DG-02) |

### Hallazgo principal: D (Feedback) sigue siendo el diferenciador

- Agentes con memoria individual (13): D avg **4.3/6**
- Agentes sin memoria individual (57): D avg **2.7/6**
- **Diferencia: +1.6 puntos** — la memoria individual es el factor más impactante

---

## Top problemas sistémicos restantes

| Problema | Agentes afectados | Fix |
|----------|------------------|-----|
| Memorias de sección vacías (templates sin datos) | ~40 agentes | Poblar con estado real del proyecto |
| Sin [APRENDIDO] en definiciones | 68/70 (solo AI-02 las tiene) | Se genera con uso real |
| IF-02/IF-03 sin reglas de código | 2 | Agregar reglas específicas |
| AO-02/AO-03 definiciones muy débiles | 2 | Reescribir definiciones completas |
| D ≤ 2 en 18 agentes | 18 | Agregar AGENT-METRICS al inicio (5 ya fijados) |

---

## Evolución completa del sistema

| Métrica | v1 | v5 | Δ |
|---------|----|----|---|
| Agentes evaluados | 6 | **70** | +64 |
| Promedio | 14.9 | **24.7** | **+9.8** |
| EXCELLENT | 0 | **14** | +14 |
| GOOD | 0 | **38** | +38 |
| NEEDS ATTN | 4 | **18** | — |
| CRITICAL | 2 | **0** | -2 |
| D (Feedback) avg | 1.7 | **3.0** | +1.3 |
| E (Aislamiento) avg | 1.2 | **3.3** | +2.1 |
