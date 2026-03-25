# Agent Self-Evaluation Results
Last updated: 2026-03-25

---

## Rondas de evaluación

| Ronda | Fecha | Agentes | Avg Score | Fix aplicado |
|-------|-------|---------|-----------|-------------|
| v1 | 2026-03-25 | 6 | 14.9/31 | — |
| v2 | 2026-03-25 | 6 | 17.6/31 | Revisión/escalación + tabla severidad QG |

## Comparación v1 vs v2

| Agent | v1 Score | v2 Score | Δ | Mejora en |
|-------|----------|----------|---|-----------|
| FC-04 flashcards-fsrs | 16/31 | 18/31 | +2 | D1 (sabe quién revisa), E1 (escalación) |
| XX-02 quality-gate | 12/31 | 16.5/31 | +4.5 | C (tabla severidad), D1, E1 |
| AS-04 security-scanner | 16/31 | 19/31 | +3 | D1, E1 (escalación clara) |
| XX-06 test-orchestrator | 16/31 | 18/31 | +2 | D1, E1 |
| AI-02 rag-chat | 17.5/31 | 18/31 | +0.5 | D1 |
| SM-04 content-tree | 12/31 | 16/31 | +4 | D1 (sabe quién revisa), E1 (escalación) |
| **PROMEDIO** | **14.9** | **17.6** | **+2.7** | |

### Lo que mejoró (P0 fix impactó)
- **D1**: 0/6 → 6/6 saben quién revisa su trabajo
- **E1**: 0/6 → 6/6 tienen criterios de escalación
- **XX-02 C**: Tabla de severidad resolvió ambigüedad BLOCK vs NEEDS FIX

### Lo que sigue igual (necesita P1/P2)
- **A5**: 0/6 tienen "Depends On" documentado
- **D5**: Aún no leen AGENT-METRICS.md al iniciar (saben que existe pero no lo consultan)
- **D6**: 0/6 tienen reglas marcadas como [APRENDIDO]
- **E4**: 5/6 sin protocolo de coordinación para contratos compartidos
- **B2/B3**: SM-04 aún no lee CLAUDE.md ni isolation rules

---

## Issues pendientes por agente (con fix ideal)

### FC-04 flashcards-fsrs (18/31)

| Issue | Categoría | Fix ideal |
|-------|-----------|-----------|
| flashcard-types.ts es contrato cross-agent sin protección | E3/E4 | Agregar regla: "Cambios a flashcard-types.ts requieren coordinación con FC-05/FC-06 antes de implementar" |
| Sin "Depends On" | A5 | Agregar sección con dependencias de FC-05, FC-06, tipos compartidos |
| AGENT-METRICS.md no en ritual de inicio | D5 | Agregar paso 7: "Lee AGENT-METRICS.md → tu fila en Agent Detail" |
| Zona de solo lectura con paths vagos | A4 | Listar archivos concretos en vez de "Tipos compartidos" |
| Valores GRADES solo en memoria, no en definición | F1 | Mover Again=0.0, Hard=0.35, Good=0.65, Easy=1.0 a Contexto técnico |

### XX-02 quality-gate (16.5/31)

| Issue | Categoría | Fix ideal |
|-------|-----------|-----------|
| Sin zona de ownership declarada | A3/A4 | Agregar sección con: archivos que ESCRIBE (XX-02-quality-gate.md, AGENT-METRICS.md Error Ledger) vs SOLO LEE (todo código fuente) |
| Sin protocolo de recepción de input | B6 | Agregar: "Al ser invocado, necesitás: (a) nombre del agente auditado, (b) branch/commit, (c) contexto de tarea" |
| Sin patrones a evitar | D4 | Agregar: "NO marcar BLOCK si solo hay dudas. NO omitir la tabla de output aunque el veredicto sea APPROVE" |
| No cubre nuevas dependencias/configs/migraciones | C3 | Agregar checks: deps con CVEs, cambios de strictness en config, migraciones de DB |
| Herramienta Write posiblemente necesaria | F2 | Agregar Write al frontmatter o aclarar que el Arquitecto actualiza su memoria |

### AS-04 security-scanner (19/31)

| Issue | Categoría | Fix ideal |
|-------|-----------|-----------|
| Reglas de código son de ESCRITURA, no de escaneo | C1/C5 | Reemplazar "TypeScript strict, no any" por template de reporte: Tipo \| OWASP \| Archivo:línea \| Severidad \| Remediación |
| localStorage como token storage — ambigüedad | F4 | Agregar regla: "localStorage para tokens es decisión de arquitectura — NO reportar sin escalar" |
| Sin template de reporte de vulnerabilidad | C3 | Definir formato obligatorio: SEC-XXX, OWASP cat, severidad, evidencia, remediación |
| Zona ownership demasiado vaga (**/*) | A3 | Reemplazar con lista de directorios + tipo de vuln a buscar en cada uno |

### XX-06 test-orchestrator (18/31)

| Issue | Categoría | Fix ideal |
|-------|-----------|-----------|
| Sin distinción error de entorno vs test fallido | C3/F4 | Agregar regla: "Si npm run test falla por compilación (no por test), reportar como ERROR DE ENTORNO, no como test fallido" |
| Sin umbral de cobertura definido | C4 | Definir: "Umbral mínimo de cobertura: X% (o documentar que no hay umbral)" |
| Sin patrones a evitar | D4 | Agregar: "NO proponer fixes. NO marcar flaky con una sola observación — requiere 2+ ejecuciones" |
| Contexto técnico superficial | F1 | Agregar: vitest.config.ts, configuración de cobertura, deno.json |
| Modelo opus posiblemente sobredimensionado | F3 | Evaluar si sonnet es suficiente — la tarea es principalmente ejecutar + formatear |

### AI-02 rag-chat (18/31)

| Issue | Categoría | Fix ideal |
|-------|-----------|-----------|
| Lecciones BUG-035 y DOMPurify no marcadas [APRENDIDO] en definición | D6 | Agregar a Reglas de código: `[APRENDIDO BUG-035] Enviar BOTH ?stream=1 AND body.stream` y `[APRENDIDO] DOMPurify obligatorio en output AI` |
| AGENT-METRICS.md no en "Al iniciar" | D5/B1 | Agregar paso 6: "Lee AGENT-METRICS.md → Error Ledger para AI-02" |
| 4 archivos de services/ai-service/ no documentados | F4 | Listar los 10 archivos del directorio con su agente owner |
| Sin regla de cierre para archivos desconocidos | E2 | Agregar: "Cualquier archivo no listado en ownership ni solo lectura está PROHIBIDO. Ante duda, escalar." |
| Ventana de historial sin valor exacto | C4 | Definir: "Ventana: N turnos máximo" o "X tokens de historial" |

### SM-04 content-tree (16/31)

| Issue | Categoría | Fix ideal |
|-------|-----------|-----------|
| Falta CLAUDE.md e isolation rules en "Al iniciar" | B2/B3 | Agregar pasos 0 y 1: "Lee CLAUDE.md" y "Lee feedback_agent_isolation.md" |
| types/content.ts en estado limbo | A4/E2/E3 | Declarar explícitamente como solo lectura: "Si necesita cambios, escalar a XX-01" |
| Librería drag-and-drop "por definir" | C3/F1 | Resolver: elegir librería (dnd-kit, react-dnd) y documentar |
| Sin "Depends On" | A5 | Agregar: types/content.ts (dueño: XX-04?), backend API endpoints |
| Sin coordinación para contratos compartidos | E4 | Agregar: "Cambios a ContentTreeContext requieren notificar al Arquitecto" |

---

## Próximos pasos (priorizado post-v2)

| Prioridad | Acción | Agentes afectados | Issues que resuelve |
|-----------|--------|-------------------|---------------------|
| **P1** | Agregar "Depends On" / "Produces for" a definiciones | Todos | A5 (0/6) |
| **P1** | Agregar AGENT-METRICS.md al ritual de inicio | Todos | D5 (6/6 no lo leen) |
| **P1** | Reemplazar reglas de código de supervisores read-only | AS-04, AS-03 | C1/C5 |
| **P1** | Marcar reglas con [APRENDIDO] donde hay trazabilidad | AI-02 (BUG-035, DOMPurify) | D6 |
| **P2** | Declarar types/content.ts como solo lectura de SM-04 | SM-04 | A4/E2/E3 |
| **P2** | Agregar zona de ownership al quality-gate | XX-02 | A3/A4 |
| **P2** | Agregar template de reporte a AS-04 | AS-04 | C3 |
| **P2** | Definir librería DnD para SM-04 | SM-04 | C3/F1 |
| **P2** | Completar "Al iniciar" de SM-04 | SM-04 | B2/B3 |
| **P3** | Evaluar si XX-06 puede usar sonnet en vez de opus | XX-06 | F3 (costo) |
