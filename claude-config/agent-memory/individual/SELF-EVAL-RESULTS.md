# Agent Self-Evaluation Results
Last updated: 2026-03-25

> Primera ronda de auto-evaluación: 6 agentes (3 implementadores + 3 supervisores)

---

## Summary Dashboard

| Eval Date | Agents Evaluated | Avg Score | Excellent (28+) | Good (22-27) | Needs Attn (16-21) | Critical (<16) |
|-----------|-----------------|-----------|-----------------|--------------|---------------------|----------------|
| 2026-03-25 | 6 | 14.9/31 | 0 | 0 | 4 | 2 |

## Scores individuales

| Agent | Type | Score | Level | Peor categoría | Mejor categoría |
|-------|------|-------|-------|----------------|-----------------|
| XX-02 quality-gate | Supervisor | 12/31 | CRITICO | E: 0/4, D: 1/6 | C: 3/5 |
| SM-04 content-tree | Implementador | 12/31 | CRITICO | D: 0/6 | A: 3/5, C: 3/5 |
| FC-04 flashcards-fsrs | Implementador | 16/31 | NEEDS ATTN | E: 1/4, D: 2/6 | B: 4/6 |
| AS-04 security-scanner | Supervisor | 16/31 | NEEDS ATTN | C: 2/5, D: 2/6 | B: 4/6 |
| XX-06 test-orchestrator | Supervisor | 16/31 | NEEDS ATTN | D: 2/6, E: 2/4 | C: 3/5 |
| AI-02 rag-chat | Implementador | 17.5/31 | NEEDS ATTN | E: 1/4 | B: 4/6 |

---

## Systemic Issues (patrones en múltiples agentes)

### CRITICO: Categoría D (Feedback Loop) — Avg 1.7/6

| Issue | Agentes afectados | Frecuencia |
|-------|-------------------|------------|
| D1: No saben quién revisa su trabajo | 6/6 (TODOS) | 100% |
| D5: No pueden ver resultados del quality-gate | 6/6 (TODOS) | 100% |
| D6: Sin reglas marcadas como [APRENDIDO] | 6/6 (TODOS) | 100% |
| D3/D4: Memoria sin lecciones reales (nueva) | 5/6 | 83% |

**Diagnóstico:** El feedback loop está ROTO en todo el sistema. Los agentes producen trabajo pero no saben qué pasa después. No hay trazabilidad entre bugs y reglas.

**Acción requerida:** Agregar a CADA definición de agente:
1. Quién revisa su trabajo (XX-02 quality-gate)
2. Cómo acceder a resultados QG (AGENT-METRICS.md → Error Ledger)
3. Marcar reglas existentes con [APRENDIDO] donde corresponda

---

### CRITICO: Categoría E (Aislamiento) — Avg 1.2/4

| Issue | Agentes afectados | Frecuencia |
|-------|-------------------|------------|
| E1: Sin criterios de escalación | 6/6 (TODOS) | 100% |
| E4: Sin protocolo de coordinación | 5/6 | 83% |
| E2: Lista de archivos prohibidos incompleta | 4/6 | 67% |

**Diagnóstico:** Ningún agente sabe cuándo escalar ni a quién. Las zonas de solo lectura son incompletas.

**Acción requerida:** Agregar a CADA definición:
1. Sección "Escalación": cuándo escalar, a quién (Arquitecto)
2. Sección "Coordinación": protocolo para archivos compartidos

---

### ALTO: A5 (Dependencias) — 0/6 agentes la tienen

Ningún agente tiene sección "Depends On" en su definición. Esto está en el AGENT-REGISTRY pero no en las definiciones individuales.

**Acción:** Agregar "Depends On" y "Produces for" a cada agente.

---

### MEDIO: Reglas genéricas en supervisores (C1/C5)

AS-04 y AS-03 tienen reglas de código de ESCRITURA ("TypeScript strict, no any") que son irrelevantes para agentes de SOLO LECTURA. Genera confusión.

**Acción:** Reemplazar con reglas de auditoría específicas.

---

## Top 5 sugerencias de los agentes (F5: "Si pudiera cambiar 1 cosa")

| Agent | Sugerencia |
|-------|-----------|
| FC-04 | Agregar "Contratos de datos: lo que produzco / lo que consumo" |
| XX-02 | Agregar tabla de severidad para verdicts (BLOCK vs NEEDS FIX) |
| AS-04 | Agregar template de reporte de output obligatorio |
| XX-06 | Agregar destino del reporte + umbral de cobertura + criterios de escalación |
| AI-02 | Agregar sección "Escalamiento y coordinación" |
| SM-04 | Agregar sección "Escalación y coordinación" + definir dueño de types/content.ts |

> **Patrón:** 5/6 agentes piden lo mismo → **sección de escalación/coordinación** y **contratos de datos**

---

## Próximos pasos recomendados

1. **[P0] Agregar sección estándar "Revisión y escalación" a TODAS las definiciones** — resolver D1, D5, E1
2. **[P0] Agregar tabla de severidad al quality-gate** — resolver ambigüedad NEEDS FIX vs BLOCK
3. **[P1] Agregar "Depends On" / "Produces for" a las definiciones** — resolver A5
4. **[P1] Limpiar reglas de código de supervisores read-only** — resolver C1/C5 de AS-04
5. **[P2] Marcar reglas con [APRENDIDO] donde hay trazabilidad a bugs** — resolver D6
6. **[P2] Completar "Al iniciar" de agentes sin CLAUDE.md ni isolation rules** — resolver B2/B3
