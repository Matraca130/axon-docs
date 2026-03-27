# Convenciones de Código y Documentación - Axon

Este documento define los estándares que todos los agentes deben seguir para garantizar consistencia, mantenibilidad y profesionalismo en el código.

## 1. Convenciones de Nombres de Archivos

### TypeScript/React
```
✅ CORRECTO                          ❌ INCORRECTO
─────────────────────────────────────────────────────
components/                          components/
  ├── Button.tsx                       ├── button.tsx
  ├── Card.tsx                         ├── Card.ts (no es React)
  └── CommandCenter/                   └── command_center/
      └── AgentMonitor.tsx                 └── agent-monitor.tsx

hooks/
  ├── useAgent.ts                     hooks/
  ├── useSummary.ts                     ├── AgentHook.ts
  └── useRealtimeUpdates.ts            └── realtime_updates.ts

types/
  ├── agent.ts                        types/
  ├── summary.ts                        ├── Agent_Types.ts
  └── database.ts                       └── db-types.ts
```

**Reglas**:
- **Componentes React**: PascalCase + .tsx
- **Hooks**: camelCase + "use" prefix + .ts
- **Tipos/Interfaces**: camelCase + .ts
- **Funciones utilitarias**: camelCase + .ts
- **Constantes**: UPPER_SNAKE_CASE + .ts
- **Directorios**: kebab-case o PascalCase (ser consistente)

### Backend (Deno/Edge Functions)
```
supabase/functions/
  ├── agent-orchestrator/             # kebab-case
  │   ├── index.ts                    # Punto de entrada
  │   ├── types.ts
  │   ├── handlers/
  │   │   ├── analyze.ts
  │   │   ├── validate.ts
  │   │   └── enhance.ts
  │   └── utils/
  │       └── prompt-builder.ts
  │
  ├── validate-content/
  │   └── index.ts
  │
  └── deno.json                        # Configuración global
```

### Migraciones de Base de Datos
```
supabase/migrations/
  ├── 001_create_base_tables.sql       # 3 dígitos + descripción
  ├── 002_create_agents_table.sql
  ├── 003_add_changelog_support.sql
  └── 004_create_indexes.sql

Naming pattern: YYYYMMDD_description.sql
Ejemplos:
  ✅ 20260321_create_users_table.sql
  ✅ 20260321_add_agent_heartbeat_index.sql
```

### Prompts de Agentes
```
backend/prompts/
  ├── analyzer.md                     # Descripción del rol
  ├── validator.md
  ├── enhancer.md
  ├── integrator.md
  └── coordinator.md

Archivo = {agent-type}.md
Contenido = System prompt + ejemplos + guías
```

## 2. Formato de Commits

### Estructura
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Tipos de Commits
```
feat      - Nueva feature
fix       - Bug fix
refactor  - Refactoring sin cambios funcionales
test      - Tests nuevos o modificados
docs      - Cambios en documentación
style     - Cambios de formato (no afecta código)
perf      - Mejoras de performance
ci        - Cambios en CI/CD
chore     - Otras tareas
```

### Ejemplos
```
✅ CORRECTO:

feat(command-center): add agent health monitoring dashboard
- Implemented real-time agent status tracking
- Added WebSocket subscription for live updates
- Created health status UI components

fix(agent-analysis): prevent hallucinations in medical content
- Added fact-checking against medical databases
- Implemented confidence scoring
- Added human review flag for low-confidence results

refactor(api): extract agent orchestration logic
- Separated concerns in orchestrator function
- Created reusable agent handler utilities
- Improved testability of core functions

❌ INCORRECTO:

fixed bug
fixed it
working on stuff
made changes
update
wip
```

### Scope Recomendados
```
- api         (API endpoints)
- agents      (Agent logic)
- database    (Schema, migrations)
- auth        (Autenticación)
- ui          (Componentes React)
- command-center (Command Center specific)
- google-docs (Google Docs integration)
- docs        (Documentación)
- test        (Testing infrastructure)
```

### Convenciones Adicionales
- **Primera línea**: < 72 caracteres
- **Tense**: Imperativo ("add" no "added" o "adds")
- **Lowercase**: Minúsculas (excepto nombres propios)
- **Referencia a issues**: `Fixes #123` en footer
- **Breaking changes**: `BREAKING CHANGE:` en footer

### Ejemplo Completo
```
feat(agents): implement multi-agent task prioritization

Implement a priority queue system that allows the Coordinator Agent
to assign priority levels to tasks based on urgency and dependencies.
This enables better resource allocation during high-load periods.

- Added TaskPriority enum (CRITICAL, HIGH, MEDIUM, LOW)
- Created PriorityQueue data structure in PostgreSQL
- Implemented dynamic task routing based on priority
- Added metrics for queue depth and processing time

The system now processes critical medical validations first,
ensuring accurate content reaches users faster.

Fixes #456
BREAKING CHANGE: Agent task format now requires priority field
```

## 3. Cómo Documentar Cambios en Agentes

### Agent Change Log (Interno)
**Archivo**: `backend/prompts/{agent-type}.md`
**Formato**: Mantener sección "Changelog" con versiones

```markdown
# Agent: Medical Content Analyzer

## Version 1.2.0 (2026-03-21)

### Added
- Confidence scoring for extracted concepts
- Multi-language support for medical terminology
- Cross-reference identification

### Fixed
- Hallucination rate reduced from 2.5% to 0.8%
- Improved handling of ambiguous medical terms

### Improved
- Processing speed: 180s → 120s average
- Structural accuracy: 93% → 96%

### Known Issues
- Some rare drug interactions missed (< 0.5%)
- German medical terminology support incomplete

## Version 1.1.0 (2026-03-14)
...
```

### Changelog del Proyecto (Público)
**Archivo**: `CHANGELOG.md` en raíz del proyecto
**Formato**: [Keep a Changelog](https://keepachangelog.com)

```markdown
# Changelog

## [1.0.0] - 2026-04-01

### Added
- Command Center MVP with agent monitoring
- Real-time agent status updates
- Medical content validation workflow
- Google Docs integration (import/export)
- User authentication with Supabase

### Changed
- Restructured database schema for better performance
- Updated API endpoints to v1

### Fixed
- Fixed race condition in concurrent agent tasks
- Resolved WebSocket connection stability issues

### Security
- Implemented rate limiting on API endpoints
- Added input sanitization for medical content

## [0.9.0] - 2026-03-21

### Added
- Beta version for internal testing
- Basic agent orchestration
- Frontend MVP

---

## [Unreleased]

### Planned
- Multi-language support
- Advanced analytics dashboard
- API public availability
```

### Changelog Entry Format (Por Agentes)
Cuando un agente completa una tarea importante:

```
Agent: {Agent Name}
Date: YYYY-MM-DD HH:MM UTC
Task: {Brief description}
Duration: {Time taken}
Status: ✅ Success / ⚠️ Warning / ❌ Failed
Result: {Quantified result}
Notes: {Additional context}

Example:
─────────────────────────────────────────
Agent: Validation Agent
Date: 2026-03-21 14:30 UTC
Task: Validate medical accuracy in 50 summaries
Duration: 23 minutes
Status: ✅ Success
Result: 48/50 approved (96% pass rate)
Notes: 2 summaries flagged for human review due to
       conflicting medical opinions on treatment protocols
─────────────────────────────────────────
```

## 4. Convenciones de Creación de Tareas

Cuando un agente identifica una tarea que debe hacerse:

### Task Card Format
```yaml
id: TASK-{YYYYMMDD}-{number}
title: "Descriptive title in English"
agent_created_by: "Agent Name"
assigned_to: "Agent Name or Backlog"
priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
category: "feature" | "bug" | "refactor" | "test" | "docs"
estimated_effort: "1h" | "4h" | "1d" | "3d" | "1w"
description: |
  Detailed description of what needs to be done.
  Include context, motivation, and success criteria.

acceptance_criteria:
  - Criterion 1
  - Criterion 2
  - Criterion 3

dependencies:
  - TASK-YYYYMMDD-X
  - TASK-YYYYMMDD-Y

created_at: 2026-03-21T14:30:00Z
due_date: 2026-03-28T23:59:59Z
```

### Ejemplo Completo
```yaml
id: TASK-20260321-001
title: "Implement fact-checking against medical databases"
agent_created_by: "Validation Agent"
assigned_to: "Validation Agent"
priority: "CRITICAL"
category: "feature"
estimated_effort: "3d"
description: |
  The Validation Agent needs the ability to cross-reference
  extracted medical facts against authoritative databases
  (MeSH, ICD-11, UpToDate) to reduce hallucination rate.

  This is blocking the release of the validation workflow
  and is critical for medical accuracy.

acceptance_criteria:
  - Integration with 3+ medical knowledge bases
  - Confidence scoring system implemented
  - Accuracy rate > 99% on test dataset
  - Query latency < 5 seconds per fact
  - Proper error handling for API failures

dependencies:
  - TASK-20260320-015  # Database schema updates

created_at: 2026-03-21T14:30:00Z
due_date: 2026-03-24T23:59:59Z
```

## 5. Checklist de Code Review

Todos los cambios deben pasar este checklist:

### Formato y Estilo
- [ ] Nombrado según convenciones
- [ ] Indentación consistente (2 espacios)
- [ ] No hay código comentado
- [ ] No hay console.logs en producción
- [ ] Imports organizados alfabéticamente

### Funcionalidad
- [ ] Código cumple su propósito
- [ ] Lógica es clara y comprensible
- [ ] Edge cases están manejados
- [ ] Sin hardcoded values
- [ ] DRY (Don't Repeat Yourself)

### Tests
- [ ] Tests unitarios escritos
- [ ] Tests pasan localmente
- [ ] Coverage > 80% para funciones críticas
- [ ] Tests integración si aplica

### Documentación
- [ ] Funciones tienen docstrings
- [ ] Tipos están documentados
- [ ] Cambios en README (si aplica)
- [ ] CHANGELOG actualizado

### Performance
- [ ] Sin N+1 queries
- [ ] API calls están batched
- [ ] Sin memory leaks
- [ ] Renderizado optimizado (si es UI)

### Seguridad
- [ ] No hay secrets en código
- [ ] Inputs están sanitizados
- [ ] Auth/permissions checked
- [ ] SQL injection prevented (prepared statements)

### Ejemplo de PR Description
```markdown
## Description
Brief description of changes.

## Type of Change
- [x] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [x] Unit tests added
- [x] Manual testing completed
- Tested with 50 medical summaries

## Checklist
- [x] Code follows conventions
- [x] Tests pass
- [x] Documentation updated
- [x] No breaking changes
- [x] Performance impact assessed

## Screenshots (if UI)
[Add screenshots here]

## Related Issues
Fixes #123
Relates to #456
```

## 6. Convenciones de Base de Datos

### Nombres de Tablas
```
✅ study_summaries       # plural, snake_case
✅ agent_tasks          # clara relación
✅ changelog            # singular si es log
❌ StudySummary         # no PascalCase
❌ summary              # debe ser plural
```

### Nombres de Columnas
```
✅ user_id              # FK reference clara
✅ created_at           # timestamps siempre
✅ is_active            # booleans with "is_"
✅ medical_topic        # snake_case
❌ UserId               # no CamelCase
❌ created              # usar _at
❌ active               # ser explícito
```

### Índices
```sql
-- Nombre descriptivo
CREATE INDEX idx_study_summaries_user_id
  ON study_summaries(user_id);

CREATE INDEX idx_agent_tasks_status_created
  ON agent_tasks(status, created_at DESC)
  WHERE status != 'completed';
```

### Convenciones de Data Types
| Uso | Tipo |
|-----|------|
| IDs | uuid |
| Booleanos | boolean |
| Timestamps | timestamp with time zone |
| Texto corto | varchar(n) |
| Texto largo | text |
| JSON | jsonb |
| Dinero | numeric(10,2) |
| Conteos | integer |

## 7. TypeScript Conventions

### Tipos Generales
```ts
// ✅ CORRECTO

// Interfaces para datos públicos
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// Types para uniones y tipos complejos
type AgentStatus = 'idle' | 'processing' | 'error';
type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

// Enums para valores fijos
enum MedicalSpecialty {
  CARDIOLOGY = 'cardiology',
  NEUROLOGY = 'neurology',
  PEDIATRICS = 'pediatrics'
}

// Generics para reutilización
interface ApiResponse<T> {
  data: T;
  error: Error | null;
  timestamp: Date;
}

// ❌ INCORRECTO

type User = {  // Usar interface
  id: string;
  email: string;
};

interface Status = string;  // Type es mejor para unions

// Evitar any
const data: any = response;
```

### Funciones
```ts
// ✅ CORRECTO
export async function analyzeMedicalContent(
  content: string,
  specialty: MedicalSpecialty
): Promise<AnalysisResult> {
  // Implementation
}

// Con tipos de retorno complejos
export function filterValidSummaries(
  summaries: Summary[]
): ApiResponse<Summary[]> {
  // Implementation
}

// ❌ INCORRECTO
export function analyze(content: any) {
  // No types specified
}

export const fn = (x) => {  // No return type
  return x;
};
```

### Error Handling
```ts
// ✅ CORRECTO
try {
  const result = await processContent(content);
  return { success: true, data: result };
} catch (error) {
  if (error instanceof ValidationError) {
    return { success: false, error: error.message };
  }
  throw error;  // Re-throw unexpected errors
}

// ❌ INCORRECTO
try {
  const result = await processContent(content);
} catch (e) {
  console.log(e);  // Never just log
}
```

## 8. React Component Conventions

### Estructura de Componente
```tsx
// ✅ CORRECTO

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/Button'
import { type Summary } from '@/types/summary'
import styles from './SummaryCard.module.css'

interface SummaryCardProps {
  summary: Summary
  onSelect?: (id: string) => void
  className?: string
}

export function SummaryCard({
  summary,
  onSelect,
  className = ''
}: SummaryCardProps): JSX.Element {
  const [isHovered, setIsHovered] = React.useState(false)

  const handleClick = () => {
    onSelect?.(summary.id)
  }

  return (
    <div
      className={`summary-card ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <h3>{summary.title}</h3>
      <p>{summary.topic}</p>
    </div>
  )
}

// ❌ INCORRECTO
export const SummaryCard = (props) => {  // No types
  const [hover, setHover] = useState(false)
  // Implementation
}
```

## 9. Convenciones de Logging

### Niveles de Log
```ts
import { logger } from '@/utils/logger'

// Debug - Development only
logger.debug('Processing summary', { summaryId, content })

// Info - General flow
logger.info('Summary created', { userId, summaryId })

// Warn - Potentially problematic
logger.warn('High hallucination rate detected', { rate: 0.02 })

// Error - Something went wrong
logger.error('Failed to validate content', error, { summaryId })

// Fatal - System critical
logger.fatal('Database connection lost', error)
```

### Formato de Logs
```json
{
  "timestamp": "2026-03-21T14:30:00.000Z",
  "level": "INFO",
  "agent": "Analysis Agent",
  "action": "summary_analysis_completed",
  "duration_ms": 2345,
  "summary_id": "uuid",
  "user_id": "uuid",
  "status": "success",
  "metrics": {
    "concepts_extracted": 42,
    "confidence_score": 0.96
  }
}
```

## 10. Convenciones de Testing

### Estructura de Tests
```ts
// ✅ CORRECTO

describe('AnalysisAgent', () => {
  describe('analyzeMedicalContent', () => {
    it('should extract key medical concepts', async () => {
      // Arrange
      const content = 'Hypertension is elevated blood pressure...'

      // Act
      const result = await agent.analyzeMedicalContent(content)

      // Assert
      expect(result.concepts).toContain('hypertension')
      expect(result.confidence).toBeGreaterThan(0.9)
    })

    it('should handle edge cases', async () => {
      // Test edge cases
    })

    it('should flag uncertain content', async () => {
      // Test uncertainty handling
    })
  })
})

// ❌ INCORRECTO
test('it works', () => {
  const result = agent.analyze('content')
  expect(result).toBeDefined()
})
```

## Conclusión

Estas convenciones aseguran que:
- ✅ El código sea consistente y fácil de leer
- ✅ Los agentes trabajen coordinadamente
- ✅ El historial de cambios sea claro
- ✅ La base de datos sea mantenible
- ✅ Los tests sean efectivos
- ✅ La documentación sea precisa

Todos los agentes deben seguir estas convenciones. Ante dudas, consultar al Agent Coordinador.
