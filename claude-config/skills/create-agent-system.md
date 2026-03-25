---
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent
description: Analiza un codebase y crea un sistema completo de agentes especializados con memoria individual, métricas, auto-evaluación y evolución continua
disable-model-invocation: false
---

# Skill: Crear Sistema de Agentes

Creá un sistema completo de agentes especializados para el codebase del directorio actual (o el que el usuario indique).

## Fase 1: Análisis del codebase (3 agentes en paralelo)

Lanzá 3 agentes Explore en paralelo:

**Agente 1 — Estructura de archivos:**
- Mapear todos los directorios y archivos del proyecto
- Identificar módulos/secciones lógicas (por directorio, por feature, por capa)
- Contar archivos por módulo
- Detectar archivos compartidos (importados por 5+)

**Agente 2 — Dependencias y ownership:**
- Identificar archivos de configuración (package.json, deno.json, tsconfig, etc.)
- Detectar imports cruzados entre módulos
- Identificar archivos "bloqueantes" (que si cambian, rompen muchos otros)
- Mapear tests existentes y su cobertura

**Agente 3 — Stack y convenciones:**
- Identificar stack técnico (framework, runtime, DB, APIs externas)
- Detectar patrones de código (CRUD factory, auth middleware, API conventions)
- Leer CLAUDE.md si existe para extraer convenciones existentes
- Identificar parámetros técnicos críticos (algoritmos, constantes calibradas)

## Fase 2: Diseño del sistema (1 agente Plan)

Con los resultados de Fase 1, lanzar 1 agente Plan que:

1. **Definir secciones** — Agrupar archivos en 8-15 secciones lógicas (ej: Auth, Content, Quiz, AI, Infra, etc.)
2. **Definir agentes por sección** — 2-6 agentes por sección:
   - Frontend (si aplica)
   - Backend (si aplica)
   - Tester (si hay tests)
   - Especialista (algoritmos, engines, etc.)
3. **Asignar ownership** — Cada archivo del proyecto asignado a exactamente 1 agente. Zero overlap.
4. **Resolver dependencias** — Qué agentes dependen de cuáles (grafo de deps)
5. **Definir cross-cutting** — Agentes de supervisión:
   - XX-01 Architect (orquestador)
   - XX-02 Quality Gate (auditor)
   - XX-03+ (según necesidad: tipos, tests, docs, migrations, security)

Presentar el plan al usuario y pedir confirmación antes de continuar.

## Fase 3: Crear archivos del sistema

Después de confirmación, crear toda la estructura:

### 3a. Crear AGENT-REGISTRY.md
```
claude-config/AGENT-REGISTRY.md
```
Índice maestro con tabla por sección: ID | Agent Name | Scope | Files Owned | Depends On | Definition

### 3b. Crear definiciones de agentes
```
claude-config/agents/<nombre>.md
```
Cada agente con este template (adaptar al contexto real del agente):

```markdown
---
name: [agent-name]
description: [1 línea]
tools: Read, Write, Edit, Bash, Glob, Grep
model: opus
---

## Rol
[1-2 oraciones con identidad del agente]

## Tu zona de ownership
[Lista ESPECÍFICA de archivos — NO globs vagos]

## Zona de solo lectura
[Archivos que lee pero no modifica]

## Depends On / Produces for
- **Depende de:** [agentes upstream]
- **Produce para:** [agentes downstream]
- **Contrato compartido:** [archivos que son interfaz con otros agentes]

## Al iniciar cada sesión (OBLIGATORIO)
1. Lee el CLAUDE.md del repo donde vas a trabajar
2. Lee `memory/feedback_agent_isolation.md` (reglas de aislamiento)
3. Lee `agent-memory/<section>.md` (contexto de sección)
4. Lee `agent-memory/individual/<ID>.md` (TU memoria personal)
5. Lee `agent-memory/individual/AGENT-METRICS.md` → tu fila en Agent Detail

## Reglas de código
[Reglas ESPECÍFICAS del dominio — NO genéricas]

## Contexto técnico
[Stack, APIs, parámetros exactos]

## Revisión y escalación
- **Tu trabajo lo revisa:** XX-02 (quality-gate) después de cada sesión
- **Resultados QG:** `agent-memory/individual/AGENT-METRICS.md`
- **Cuándo escalar al Arquitecto (XX-01):**
  - Si necesitás modificar un archivo fuera de tu zona
  - Si encontrás un conflicto con otro agente
  - Si una decisión tiene impacto cross-section
- **NO escalar:** si la tarea está dentro de tu zona y tus reglas la cubren
```

### 3c. Crear memorias individuales
```
claude-config/agent-memory/individual/<ID>-<nombre>.md
```
Cada memoria con:
- Rol (1 línea)
- Parámetros críticos (si aplica)
- Lecciones aprendidas (tabla vacía)
- Efectividad de lecciones (tabla vacía)
- Decisiones técnicas (NO re-litigar) con reasoning
- Patrones que funcionan (extraídos del código real)
- Patrones a evitar (anti-patterns del dominio)
- Métricas (contadores en 0)

### 3d. Crear memorias de sección
```
claude-config/agent-memory/<section>.md
```
Una por sección con: errores conocidos, patterns, decisiones compartidas.

### 3e. Crear archivos de sistema

1. **AGENT-METRICS.md** — Dashboard con 6 secciones:
   - System Pulse (5-second health check)
   - Section Health (por sección)
   - Agent Detail (por agente, ventana rodante L5)
   - Error Ledger (últimos 20 errores con recurrencia)
   - Supervisor Metrics (por auditor)
   - Scoring Rules + Update Protocol

2. **AGENT-SELF-EVAL.md** — Protocolo de auto-evaluación (31 puntos, 6 categorías)

3. **MULTI-AGENT-PROCEDURE.md** — Procedimiento completo del sistema

4. **feedback_agent_isolation.md** — Reglas de aislamiento + evolución continua

5. **Architect agent** — Con procedimiento de selección, post-mortem, y self-eval

6. **Quality Gate agent** — Con checklist de 6 checks, tabla de severidad, y auto-registro de lecciones

### 3f. Crear CLAUDE-MD-ADDON.md
Template para agregar al CLAUDE.md del repo con instrucciones de cómo usar el sistema.

## Fase 4: Verificación

1. Contar archivos creados vs esperados
2. Verificar que cada archivo del proyecto tiene exactamente 1 agente dueño
3. Verificar que todos los agentes tienen memoria individual
4. Verificar que todos los agentes leen su memoria al iniciar
5. Verificar que el registry es coherente con las definiciones

## Fase 5: Auto-evaluación + fix loop (MÍNIMO GOOD para todos)

### Ronda 1: Evaluación masiva
Lanzar todos los agentes en paralelo (batches de 10-20) para auto-evaluarse con AGENT-SELF-EVAL.md.
Cada agente reporta: `AGENT: [ID] TOTAL: X/31 | A:X B:X C:X D:X E:X F:X | TOP_ISSUE: [1 línea]`

### Ronda 2+: Fix loop (repetir hasta que TODOS ≥ 22/31)

```
MIENTRAS haya agentes con score < 22 (GOOD):
    │
    ├── 1. Identificar agentes < 22 y sus categorías más débiles
    │
    ├── 2. Agrupar por tipo de problema:
    │       - B < 4 → falta CLAUDE.md, isolation, o memoria en "Al iniciar"
    │       - C < 3 → reglas genéricas → reescribir con reglas del dominio
    │       - D < 3 → sin memoria individual, sin acceso a QG results
    │       - E < 3 → sin escalación, sin ownership claro
    │
    ├── 3. Aplicar fixes en paralelo (agentes batch por tipo de problema)
    │
    ├── 4. Re-evaluar SOLO los agentes que se fixearon
    │
    └── 5. Si todos ≥ 22 → FIN. Si no → repetir desde paso 1.
```

### Criterio de salida

| Nivel | Score | Requerido |
|-------|-------|-----------|
| CRITICAL (<16) | 0 agentes | **OBLIGATORIO** — no se puede terminar con CRITICALs |
| NEEDS ATTN (16-21) | 0 agentes | **OBLIGATORIO** — todos deben ser GOOD mínimo |
| GOOD (22-27) | cualquier cantidad | Aceptable |
| EXCELLENT (28+) | deseable | Objetivo aspiracional, no bloqueante |

### Máximo 5 rondas de fix

Si después de 5 rondas un agente sigue < 22, reportar al usuario con diagnóstico:
- Qué categorías siguen bajas
- Qué se intentó
- Qué falta (posiblemente info del codebase que no se tiene)

### Guardar resultados

Después de cada ronda, actualizar `agent-memory/individual/SELF-EVAL-RESULTS.md` con:
- Fecha, ronda, avg score, distribución
- Agentes que subieron y por qué
- Agentes que siguen bajos y qué se intentó

## Principios

- **Ownership sin huérfanos:** cada archivo tiene exactamente 1 dueño
- **Reglas específicas:** nunca "TypeScript strict, no any" genérico — siempre reglas del dominio
- **Memoria con reasoning:** decisiones incluyen POR QUÉ y alternativas descartadas
- **Evolución por conocimiento:** no buscar mejoras de código, registrar aprendizajes
- **Mínimo viable:** no crear agentes que no se necesitan. Si un módulo tiene 3 archivos, 1 agente es suficiente

---

## Lecciones aprendidas (sesión 2026-03-25 — sistema AXON frontend)

> Estas lecciones vienen de crear el sistema para 70 agentes, 7 rondas de auto-evaluación, y 20-agent democratic voting.

### Lo que más impacta en la calidad de agentes

1. **La memoria individual es el factor #1.** Agentes con memoria: D avg 4.3/6. Sin memoria: D avg 2.7/6. Diferencia de +89%. Crear memoria individual para TODOS, no solo los "complejos".

2. **Revisión y escalación es obligatorio.** Sin esta sección, 100% de agentes no sabían quién revisaba su trabajo ni cuándo escalar. Agregar desde el día 1.

3. **"Depends On / Produces for" evita scope creep.** Los agentes que saben de quién dependen y quién consume su output tienen E avg 4/4. Los que no: E avg 2/4.

### Errores que cometimos y corregimos

4. **No usar reglas de escritura para agentes de solo lectura.** AS-04 (security scanner) tenía "TypeScript strict, no any" — reglas de escritura para un agente que solo lee. Reemplazar con reglas de auditoría/escaneo.

5. **"< 20 líneas" como criterio de mejora es gameable.** Lo reemplazamos por "¿cualquier dev diría 'obvio sí' sin debate?" + "¿NO agrega complejidad?". Después lo evolucionamos a reflexión de conocimiento, no de código.

6. **La evolución real es acumulación de conocimiento, no cambios de código.** La regla final: "¿Qué aprendí? ¿Casi cometí un error? ¿Tomé una decisión?" — registrar en memoria. NO buscar code fixes como excusa.

7. **AGENT-METRICS.md es overhead si cada agente lo lee completo.** 273 líneas donde cada agente solo necesita 5. Considerar que solo el Arquitecto y QG lean el archivo completo.

### Orden óptimo de implementación

8. **Crear primero, evaluar después.** No intentar que las definiciones sean perfectas al inicio. Crear la estructura, lanzar auto-evaluación, y dejar que los agentes mismos te digan qué falta.

9. **Propagar fixes masivamente.** Cuando encontrás un gap sistémico (ej: ningún agente tiene escalación), no arreglar 1 por 1 — arreglar todos en paralelo con agentes batch.

10. **Democracia de agentes funciona.** Lanzar 20 agentes a proponer mejoras y contar votos reveló insights que ningún diseño top-down hubiera encontrado (ej: 14/20 pidieron auto-vincular QG failures a lecciones).

### Métricas de referencia

| Ronda | Score | Qué se hizo |
|-------|-------|-------------|
| v1 (definiciones básicas) | 14.9/31 | Solo definiciones, sin memoria ni escalación |
| v2 (+ escalación) | 17.6/31 | +2.7 por agregar revisión/escalación |
| v3 (+ P1 fixes) | 22.8/31 | +5.2 por Depends On, METRICS en inicio, [APRENDIDO] |
| v4 (+ propagación) | 24.0/31 | +1.2 por CLAUDE.md e isolation en todos |
| v5 (+ 65 memorias) | 24.7/31 | +0.7 por memoria para todos |
| v6 (post-memoria, muestra) | 28.8/31 | +4.1 — la memoria individual fue el salto más grande |
| v7 (evaluación completa) | 26.0/31 | Promedio real de 65 agentes (v6 era muestra optimista) |

### Tiempo real de implementación

- Crear 65 memorias individuales: ~8 agentes paralelos × 2 min = 16 min
- Propagar sección a 75 definiciones: ~5 agentes paralelos × 1 min = 5 min
- Auto-evaluación de 65 agentes: ~22 agentes paralelos × 30s = ~5 min
- Total sistema completo (70 agentes): ~2-3 horas con iteraciones de evaluación
