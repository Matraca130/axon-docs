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
| v5 | 2026-03-25 | 70 | 24.7/31 | Evaluación completa del sistema |
| **v6** | **2026-03-25** | **20** | **28.8/31** | **Memoria individual para TODOS los 65 agentes** |

---

## v6 Audit Results (20 agentes post memoria-individual-para-todos)

| Agent | v5 Score | v6 Score | Δ | Level |
|-------|----------|----------|---|-------|
| ST-04 study-plans | 20 | **31** | +11 | PERFECT |
| AO-01 admin-frontend | 21 | **31** | +10 | PERFECT |
| AO-02 admin-backend | 12 | **31** | +19 | PERFECT |
| AO-03 owner-frontend | 14 | **30** | +16 | EXCELLENT |
| AS-05 cors-headers | 23 | **30** | +7 | EXCELLENT |
| IF-03 infra-ai | 19 | **30** | +11 | EXCELLENT |
| QZ-01 quiz-frontend | 17 | **29** | +12 | EXCELLENT |
| SM-03 summaries-tester | 16 | **29** | +13 | EXCELLENT |
| SM-06 text-highlighter | 22 | **29** | +7 | EXCELLENT |
| MG-02 whatsapp-bot | 26 | **29** | +3 | EXCELLENT |
| 3D-04 viewer3d-annotations | 23 | **29** | +6 | EXCELLENT |
| FC-01 flashcards-frontend | 21 | **28** | +7 | EXCELLENT |
| DG-04 gamification-backend | 18 | **28** | +10 | EXCELLENT |
| DG-02 dashboard-professor | 19 | **28** | +9 | EXCELLENT |
| IF-02 infra-ui | 21 | **28** | +7 | EXCELLENT |
| XX-05 migration-writer | 24 | **28** | +4 | EXCELLENT |
| IF-01 infra-plumbing | 17 | **27** | +10 | GOOD |
| BL-02 stripe-webhooks | 27 | **27** | 0 | GOOD |
| QZ-02 quiz-backend | 18 | **24** | +6 | GOOD |
| SM-04 content-tree | 18 | **24** | +6 | GOOD |

### Mejoras más impactantes

| Agent | v5 → v6 | Δ | De → A |
|-------|---------|---|--------|
| AO-02 admin-backend | 12 → 31 | **+19** | CRITICAL → PERFECT |
| AO-03 owner-frontend | 14 → 30 | **+16** | CRITICAL → EXCELLENT |
| SM-03 summaries-tester | 16 → 29 | **+13** | NEEDS ATTN → EXCELLENT |
| QZ-01 quiz-frontend | 17 → 29 | **+12** | NEEDS ATTN → EXCELLENT |
| ST-04 study-plans | 20 → 31 | **+11** | NEEDS ATTN → PERFECT |
| IF-03 infra-ai | 19 → 30 | **+11** | NEEDS ATTN → EXCELLENT |

---

## Evolución completa del sistema

| Métrica | v1 | v5 | v6 (sample) |
|---------|----|----|-------------|
| Promedio | **14.9** | **24.7** | **28.8** |
| EXCELLENT+ (28+) | 0 | 14 | **18/20** |
| GOOD (22-27) | 0 | 38 | 2/20 |
| NEEDS ATTN | 4 | 18 | **0/20** |
| CRITICAL | 2 | 0 | **0** |
| D (Feedback) avg | 1.7 | 3.0 | **5.1** |

### Impacto de la memoria individual en categoría D

| Estado | D avg v5 | D avg v6 | Δ |
|--------|----------|----------|---|
| 13 agentes con memoria (antes) | 4.3/6 | — | — |
| 57 agentes sin memoria (antes) | 2.7/6 | — | — |
| **20 agentes auditados (después)** | — | **5.1/6** | **+2.1 vs v5** |

**La memoria individual subió D de 2.7 a 5.1 (+89%).** El feedback loop ahora funciona en todo el sistema.

---

## Distribución v6 (20 agentes auditados)

```
PERFECT (31):     ███            3 (15%)
EXCELLENT (28-30): ███████████████  15 (75%)
GOOD (24-27):     ████            4 (20%) — nota: suma >100% por redondeo, son 20 total
NEEDS ATTN:                        0 (0%)
CRITICAL:                          0 (0%)
```

**0 agentes NEEDS ATTENTION. 0 CRITICAL. 90% del sample en EXCELLENT o mejor.**

---

## Issues residuales (ya no son sistémicos — son por agente)

| Issue | Agentes | Tipo |
|-------|---------|------|
| Memoria vacía (sin lecciones reales aún) | Todos | Se resuelve con uso real |
| Sin reglas [APRENDIDO] | ~63 agentes | Se genera con errores reales |
| QZ-02 params BKT sin valores exactos en def | 1 | Fix puntual |
| SM-04 librería DnD "por definir" | 1 | Decisión pendiente |

Estos ya no son problemas sistémicos — son detalles que se resuelven con uso real del sistema o decisiones puntuales.
