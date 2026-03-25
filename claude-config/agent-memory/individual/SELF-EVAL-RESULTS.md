# Agent Self-Evaluation Results
Last updated: 2026-03-25

---

## Rondas de evaluación

| Ronda | Fecha | Agentes | Avg Score | Fix aplicado |
|-------|-------|---------|-----------|-------------|
| v1 | 2026-03-25 | 6 | 14.9/31 | — |
| v2 | 2026-03-25 | 6 | 17.6/31 | P0: Revisión/escalación + tabla severidad QG |
| v3 | 2026-03-25 | 12 | 22.8/31 | P1: Depends On + METRICS en inicio + [APRENDIDO] + reglas scanner |

---

## Comparación v1 → v2 → v3 (6 agentes originales)

| Agent | v1 | v2 | v3 | Δ total | Level v3 |
|-------|----|----|-----|---------|----------|
| FC-04 flashcards-fsrs | 16 | 18 | **28** | +12 | EXCELLENT |
| XX-02 quality-gate | 12 | 16.5 | **26** | +14 | GOOD |
| AS-04 security-scanner | 16 | 19 | **25** | +9 | GOOD |
| AI-02 rag-chat | 17.5 | 18 | **28** | +10.5 | EXCELLENT |
| XX-06 test-orchestrator | 16 | 18 | **22** | +6 | GOOD |
| SM-04 content-tree | 12 | 16 | **18** | +6 | NEEDS ATTN |
| **Promedio 6 originales** | **14.9** | **17.6** | **24.5** | **+9.6** | |

### Progreso por categoría (promedio 6 originales)

| Categoría | v1 | v3 | Δ |
|-----------|----|----|---|
| A. Claridad | 2.6/5 | 4.8/5 | +2.2 |
| B. Contexto | 3.2/6 | 4.7/6 | +1.5 |
| C. Reglas | 2.7/5 | 4.2/5 | +1.5 |
| D. Feedback | 1.7/6 | 4.5/6 | +2.8 |
| E. Aislamiento | 1.2/4 | 3.0/4 | +1.8 |
| F. Completitud | 3.0/5 | 3.7/5 | +0.7 |

---

## Nuevos agentes evaluados (v3 — primera vez)

| Agent | Score | Level | A | B | C | D | E | F |
|-------|-------|-------|---|---|---|---|---|---|
| DG-01 dashboard-student | **26** | GOOD | 5/5 | 5/6 | 5/5 | 3/6 | 4/4 | 4/5 |
| AI-01 rag-pipeline | **25** | GOOD | 4/5 | 6/6 | 4/5 | 4/6 | 3/4 | 4/5 |
| AS-01 auth-backend | **23** | GOOD | 4/5 | 5/6 | 4/5 | 3/6 | 3/4 | 4/5 |
| FC-01 flashcards-frontend | **21** | NEEDS ATTN | 5/5 | 3/6 | 5/5 | 2/6 | 3/4 | 3/5 |
| QZ-01 quiz-frontend | **16** | NEEDS ATTN | 4/5 | 2/6 | 4/5 | 1/6 | 2/4 | 3/5 |
| IF-01 infra-plumbing | **16** | NEEDS ATTN | 5/5 | 2/6 | 3/5 | 1/6 | 2/4 | 3/5 |

### Patrón en agentes no tocados por P0/P1

Los agentes que NO recibieron los fixes tienen los mismos problemas sistémicos que teníamos en v1:

| Issue | Frecuencia en 6 nuevos |
|-------|----------------------|
| B2: No leen CLAUDE.md al iniciar | 3/6 (QZ-01, FC-01, IF-01) |
| B3: No leen feedback_agent_isolation.md | 3/6 (QZ-01, FC-01, IF-01) |
| D: Feedback loop débil (avg 2.3/6) | 6/6 |
| D5: No saben dónde ver resultados QG | 4/6 |
| A5: Sin "Depends On" | 3/6 |

**Diagnóstico:** Los fixes P0/P1 solo se aplicaron a los 14 agentes con memoria individual. Los ~60 agentes restantes siguen con los problemas de v1.

---

## Score global del sistema (12 agentes evaluados)

| Level | Count | Agents |
|-------|-------|--------|
| EXCELLENT (28+) | 2 | FC-04, AI-02 |
| GOOD (22-27) | 5 | XX-02, AS-04, XX-06, DG-01, AI-01, AS-01 |
| NEEDS ATTN (16-21) | 4 | SM-04, FC-01, QZ-01, IF-01 |
| CRITICAL (<16) | 0 | — |

**Promedio global: 22.8/31** (vs 14.9 en v1)

---

## Top issues de los 6 nuevos agentes

| Agent | Top issue | Fix ideal |
|-------|-----------|-----------|
| QZ-01 | No lee CLAUDE.md ni isolation rules al iniciar | Actualizar "Al iniciar" con pasos estándar |
| QZ-01 | Sin feedback loop (D: 1/6) | Agregar AGENT-METRICS.md a inicio + acceso a QG results |
| FC-01 | No lee CLAUDE.md ni isolation rules al iniciar | Actualizar "Al iniciar" con pasos estándar |
| FC-01 | Patrones a evitar sin alternativas claras | Mejorar tablas en flashcards.md |
| IF-01 | No lee CLAUDE.md ni isolation rules al iniciar | Actualizar "Al iniciar" con pasos estándar |
| IF-01 | Sin reglas de código explícitas | Agregar sección "Reglas de código" real |
| AS-01 | Coordinación con AS-02/AS-03 no documentada | Agregar protocolo de coordinación para contrato dual-token |
| AI-01 | Sin política de reingestión de PDFs actualizados | Agregar regla para versionado de embeddings |
| DG-01 | No lee CLAUDE.md al iniciar | Actualizar "Al iniciar" |

---

## Próximo paso recomendado

**Aplicar fixes estándar a los ~60 agentes restantes:**
1. Agregar CLAUDE.md y isolation rules al "Al iniciar" de todos los agentes que no los tienen
2. Agregar lectura de AGENT-METRICS.md al inicio
3. Esto es un fix masivo pero mecánico — misma sección para todos
