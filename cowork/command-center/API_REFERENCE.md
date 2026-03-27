# API Reference - Axon Platform

Documentación de referencia completa para la API de Axon, incluyendo endpoints, ejemplos, y subscription real-time.

## Tabla de Contenidos

1. [Autenticación](#autenticación)
2. [Study Summaries](#study-summaries)
3. [Agents](#agents)
4. [Agent Tasks](#agent-tasks)
5. [Changelog](#changelog)
6. [Real-time Subscriptions](#real-time-subscriptions)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Ejemplos Completos](#ejemplos-completos)

---

## Autenticación

### Overview
Axon utiliza JWT tokens para autenticación. Los tokens se obtienen a través de Supabase Auth y se incluyen en todas las requests.

### Obtener Token
```bash
# Email + Password
curl -X POST https://<PROJECT>.supabase.co/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'

# Response
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGc..."
}
```

### Usar Token en Requests
```bash
# Header Authorization
Authorization: Bearer {access_token}

# Query parameter (alternativa)
?apikey={access_token}
```

### Refresh Token
```bash
curl -X POST https://<PROJECT>.supabase.co/auth/v1/token?grant_type=refresh_token \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "refresh_token_value"
  }'
```

### Verificar Token Actual
```bash
curl -X GET https://<PROJECT>.supabase.co/auth/v1/user \
  -H "Authorization: Bearer {access_token}"

# Response
{
  "id": "uuid",
  "email": "user@example.com",
  "email_confirmed_at": "2026-03-21T10:00:00Z",
  "user_metadata": {},
  "created_at": "2026-03-20T00:00:00Z",
  "updated_at": "2026-03-21T10:00:00Z"
}
```

---

## Study Summaries

### Crear Resumen
```http
POST /rest/v1/study_summaries
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Cardiovascular Pathophysiology",
  "medical_topic": "cardiology",
  "content": {},
  "status": "draft"
}
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "auth-user-id",
  "title": "Cardiovascular Pathophysiology",
  "medical_topic": "cardiology",
  "content": {},
  "status": "draft",
  "version": 1,
  "created_at": "2026-03-21T14:30:00Z",
  "updated_at": "2026-03-21T14:30:00Z"
}
```

### Obtener Resúmenes del Usuario
```http
GET /rest/v1/study_summaries?user_id=eq.{user_id}&order=created_at.desc&limit=20
Authorization: Bearer {access_token}
```

**Query Parameters**:
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `select` | string | Columnas a retornar (default: *) |
| `user_id` | string | Filtrar por user_id |
| `status` | string | Filtrar por status |
| `order` | string | Campo y dirección (ej: created_at.desc) |
| `limit` | integer | Límite de resultados (max: 1000) |
| `offset` | integer | Página (para paginación) |

**Ejemplo con filtros complejos**:
```http
GET /rest/v1/study_summaries?user_id=eq.{user_id}&status=eq.published&order=updated_at.desc&limit=10&offset=20
```

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "auth-user-id",
    "title": "Cardiovascular Pathophysiology",
    "medical_topic": "cardiology",
    "status": "published",
    "created_at": "2026-03-21T14:30:00Z",
    "updated_at": "2026-03-21T16:00:00Z",
    "version": 3
  }
]
```

### Obtener Resumen Específico con Relaciones
```http
GET /rest/v1/study_summaries?id=eq.{summary_id}&select=*,agent_tasks(id,agent_id,status,created_at),changelog(id,change_type,description,created_at)
Authorization: Bearer {access_token}
```

**Response**:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Cardiovascular Pathophysiology",
    "status": "processing",
    "agent_tasks": [
      {
        "id": "task-uuid-1",
        "agent_id": "analyzer",
        "status": "completed",
        "created_at": "2026-03-21T14:30:00Z"
      },
      {
        "id": "task-uuid-2",
        "agent_id": "validator",
        "status": "processing",
        "created_at": "2026-03-21T14:35:00Z"
      }
    ],
    "changelog": [
      {
        "id": "change-uuid-1",
        "change_type": "created",
        "description": "Summary created by user",
        "created_at": "2026-03-21T14:30:00Z"
      },
      {
        "id": "change-uuid-2",
        "change_type": "modified",
        "description": "Analysis completed",
        "created_at": "2026-03-21T14:35:00Z"
      }
    ]
  }
]
```

### Actualizar Resumen
```http
PATCH /rest/v1/study_summaries?id=eq.{summary_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Updated Title",
  "content": {
    "sections": [
      {
        "title": "Introduction",
        "content": "..."
      }
    ]
  },
  "status": "draft"
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Updated Title",
  "status": "draft",
  "updated_at": "2026-03-21T15:00:00Z",
  "version": 2
}
```

### Eliminar Resumen
```http
DELETE /rest/v1/study_summaries?id=eq.{summary_id}
Authorization: Bearer {access_token}
```

**Response** (204 No Content):
```
(no response body)
```

---

## Agents

### Obtener Lista de Agentes
```http
GET /rest/v1/agents
Authorization: Bearer {access_token}
```

**Response** (200 OK):
```json
[
  {
    "id": "agent-analyzer-uuid",
    "name": "Analysis Agent",
    "type": "analyzer",
    "status": "idle",
    "last_heartbeat": "2026-03-21T14:35:00Z",
    "config": {
      "max_concurrent_tasks": 5,
      "timeout_seconds": 300,
      "model": "claude-3-5-sonnet-20241022"
    },
    "created_at": "2026-03-20T00:00:00Z",
    "updated_at": "2026-03-21T14:35:00Z"
  },
  {
    "id": "agent-validator-uuid",
    "name": "Validation Agent",
    "type": "validator",
    "status": "processing",
    "last_heartbeat": "2026-03-21T14:35:00Z",
    "config": {},
    "created_at": "2026-03-20T00:00:00Z",
    "updated_at": "2026-03-21T14:35:00Z"
  },
  {
    "id": "agent-enhancer-uuid",
    "name": "Enhancement Agent",
    "type": "enhancer",
    "status": "idle",
    "last_heartbeat": "2026-03-21T14:35:00Z",
    "config": {},
    "created_at": "2026-03-20T00:00:00Z",
    "updated_at": "2026-03-21T14:35:00Z"
  },
  {
    "id": "agent-integrator-uuid",
    "name": "Integration Agent",
    "type": "integrator",
    "status": "idle",
    "last_heartbeat": "2026-03-21T14:35:00Z",
    "config": {},
    "created_at": "2026-03-20T00:00:00Z",
    "updated_at": "2026-03-21T14:35:00Z"
  },
  {
    "id": "agent-coordinator-uuid",
    "name": "Coordinator Agent",
    "type": "coordinator",
    "status": "processing",
    "last_heartbeat": "2026-03-21T14:35:00Z",
    "config": {},
    "created_at": "2026-03-20T00:00:00Z",
    "updated_at": "2026-03-21T14:35:00Z"
  }
]
```

### Obtener Agente Específico
```http
GET /rest/v1/agents?id=eq.{agent_id}
Authorization: Bearer {access_token}
```

### Actualizar Estado del Agente
```http
PATCH /rest/v1/agents?id=eq.{agent_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "status": "error",
  "last_heartbeat": "2026-03-21T14:36:00Z"
}
```

### Obtener Métricas del Agente
```http
GET /rest/v1/agents?id=eq.{agent_id}&select=*,agent_tasks(status)
Authorization: Bearer {access_token}
```

---

## Agent Tasks

### Crear Tarea
```http
POST /rest/v1/agent_tasks
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "agent_id": "agent-analyzer-uuid",
  "summary_id": "550e8400-e29b-41d4-a716-446655440000",
  "task_type": "analyze_content",
  "input_data": {
    "content": "Text to analyze",
    "specialty": "cardiology"
  },
  "priority": 1,
  "status": "pending"
}
```

**Response** (201 Created):
```json
{
  "id": "task-uuid-123",
  "agent_id": "agent-analyzer-uuid",
  "summary_id": "550e8400-e29b-41d4-a716-446655440000",
  "task_type": "analyze_content",
  "input_data": {
    "content": "Text to analyze",
    "specialty": "cardiology"
  },
  "output_data": null,
  "status": "pending",
  "priority": 1,
  "error_message": null,
  "created_at": "2026-03-21T14:30:00Z",
  "updated_at": "2026-03-21T14:30:00Z",
  "completed_at": null
}
```

### Obtener Tareas de Agente
```http
GET /rest/v1/agent_tasks?agent_id=eq.{agent_id}&status=eq.processing&order=priority.desc,created_at.asc
Authorization: Bearer {access_token}
```

**Query Filters Útiles**:
```http
# Solo tareas pendientes
?status=eq.pending

# Solo tareas completadas en últimas 24 horas
?status=eq.completed&created_at=gt.2026-03-20T14:30:00Z

# Tareas por prioridad
?priority=gt.2&order=priority.desc

# Tareas con error
?status=eq.failed&error_message=not.is.null
```

### Obtener Tareas de Resumen Específico
```http
GET /rest/v1/agent_tasks?summary_id=eq.{summary_id}&select=*,agents(name,type)&order=created_at.desc
Authorization: Bearer {access_token}
```

**Response**:
```json
[
  {
    "id": "task-uuid-1",
    "agent_id": "agent-analyzer-uuid",
    "summary_id": "550e8400-e29b-41d4-a716-446655440000",
    "task_type": "analyze_content",
    "status": "completed",
    "output_data": {
      "concepts": ["hypertension", "heart rate"],
      "structure": { ... },
      "confidence": 0.96
    },
    "created_at": "2026-03-21T14:30:00Z",
    "completed_at": "2026-03-21T14:35:00Z",
    "agents": {
      "name": "Analysis Agent",
      "type": "analyzer"
    }
  },
  {
    "id": "task-uuid-2",
    "agent_id": "agent-validator-uuid",
    "status": "processing",
    "created_at": "2026-03-21T14:36:00Z",
    "agents": {
      "name": "Validation Agent",
      "type": "validator"
    }
  }
]
```

### Actualizar Tarea
```http
PATCH /rest/v1/agent_tasks?id=eq.{task_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "status": "completed",
  "output_data": {
    "concepts": ["concept1", "concept2"],
    "structure": { ... },
    "quality_score": 0.95
  },
  "completed_at": "2026-03-21T14:35:00Z"
}
```

---

## Changelog

### Crear Entrada de Changelog
```http
POST /rest/v1/changelog
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "summary_id": "550e8400-e29b-41d4-a716-446655440000",
  "agent_id": "agent-analyzer-uuid",
  "change_type": "analyzed",
  "description": "Extracted 42 medical concepts with 96% confidence",
  "changes": {
    "concepts_count": 42,
    "confidence_score": 0.96,
    "processing_time_ms": 2345
  }
}
```

**Response** (201 Created):
```json
{
  "id": "changelog-uuid-123",
  "summary_id": "550e8400-e29b-41d4-a716-446655440000",
  "agent_id": "agent-analyzer-uuid",
  "change_type": "analyzed",
  "description": "Extracted 42 medical concepts with 96% confidence",
  "changes": {
    "concepts_count": 42,
    "confidence_score": 0.96,
    "processing_time_ms": 2345
  },
  "created_at": "2026-03-21T14:35:00Z"
}
```

### Obtener Changelog de Resumen
```http
GET /rest/v1/changelog?summary_id=eq.{summary_id}&order=created_at.desc
Authorization: Bearer {access_token}
```

**Response** (200 OK):
```json
[
  {
    "id": "changelog-uuid-1",
    "summary_id": "550e8400-e29b-41d4-a716-446655440000",
    "agent_id": "agent-analyzer-uuid",
    "change_type": "analyzed",
    "description": "Extracted 42 medical concepts",
    "created_at": "2026-03-21T14:35:00Z"
  },
  {
    "id": "changelog-uuid-2",
    "summary_id": "550e8400-e29b-41d4-a716-446655440000",
    "agent_id": "agent-validator-uuid",
    "change_type": "validated",
    "description": "Validated content against medical databases",
    "created_at": "2026-03-21T14:40:00Z"
  }
]
```

### Obtener Changelog Completo (con detalles)
```http
GET /rest/v1/changelog?summary_id=eq.{summary_id}&select=*,agents(name,type),study_summaries(title)&order=created_at.desc
Authorization: Bearer {access_token}
```

---

## Real-time Subscriptions

### Suscribirse a Cambios en Resumen
```typescript
const channel = supabase.channel(`summary:${summaryId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'study_summaries',
    filter: `id=eq.${summaryId}`
  }, (payload) => {
    console.log('Summary changed:', payload.new)
    // Handle update
  })
  .subscribe()

// Cleanup
await supabase.removeChannel(channel)
```

### Suscribirse a Tareas de Agente
```typescript
const channel = supabase.channel(`agent-tasks:${summaryId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'agent_tasks',
    filter: `summary_id=eq.${summaryId}`
  }, (payload) => {
    console.log('New task:', payload.new)
  })
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'agent_tasks',
    filter: `summary_id=eq.${summaryId}`
  }, (payload) => {
    console.log('Task updated:', payload.new)
  })
  .subscribe()
```

### Suscribirse a Estado de Agentes
```typescript
const channel = supabase.channel('agent-status')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'agents'
  }, (payload) => {
    const { id, status, last_heartbeat } = payload.new
    console.log(`Agent ${id} status: ${status}`)
    // Update dashboard
  })
  .subscribe()
```

### Suscribirse a Changelog
```typescript
const channel = supabase.channel(`changelog:${summaryId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'changelog',
    filter: `summary_id=eq.${summaryId}`
  }, (payload) => {
    const { agent_id, change_type, description } = payload.new
    console.log(`Agent ${agent_id} ${change_type}: ${description}`)
    // Update activity feed
  })
  .subscribe()
```

### Multicanal con Broadcast (Custom)
```typescript
// Listen para custom notifications
const channel = supabase.channel('agent-notifications')
  .on('broadcast', {
    event: 'task-completed'
  }, (payload) => {
    console.log('Task completed:', payload.payload)
  })
  .on('broadcast', {
    event: 'error-occurred'
  }, (payload) => {
    console.log('Error:', payload.payload.error)
  })
  .subscribe()
```

---

## Error Handling

### Formatos de Error

**4xx Errors (Client)**:
```json
{
  "message": "Invalid request",
  "details": "user_id is required",
  "hint": "Make sure to include user_id in the query",
  "code": "PGRST001"
}
```

**401 Unauthorized**:
```json
{
  "message": "Unauthorized",
  "code": "401"
}
```

**403 Forbidden** (RLS Policy):
```json
{
  "message": "new row violates row-level security policy",
  "code": "PGRST204"
}
```

**5xx Errors (Server)**:
```json
{
  "message": "Internal Server Error",
  "code": "500"
}
```

### Manejo en Cliente
```typescript
try {
  const { data, error } = await supabase
    .from('study_summaries')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    if (error.code === '401') {
      // Handle authentication error
      await refreshToken()
    } else if (error.code === '403') {
      // Handle authorization error
      showErrorMessage('Access denied')
    } else {
      // Handle other errors
      logger.error('Database error:', error)
    }
  }

  return data
} catch (error) {
  logger.error('Unexpected error:', error)
  throw error
}
```

---

## Rate Limiting

### Límites Aplicados

| Endpoint | Límite |
|----------|--------|
| GET (lectura) | 1000 requests/minuto |
| POST (creación) | 100 requests/minuto |
| PATCH (actualización) | 100 requests/minuto |
| DELETE | 50 requests/minuto |
| WebSocket (Realtime) | 100 mensajes/minuto |

### Headers de Rate Limit
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1643817600
```

### Manejar Rate Limiting
```typescript
const backoffDelay = (attempt: number) => {
  return Math.min(1000 * Math.pow(2, attempt), 30000)
}

async function fetchWithRetry(
  fetchFn: () => Promise<any>,
  maxAttempts: number = 3
) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fetchFn()
    } catch (error: any) {
      if (error.status === 429 && attempt < maxAttempts - 1) {
        // Rate limited
        const delay = backoffDelay(attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
}
```

---

## Ejemplos Completos

### Ejemplo 1: Crear Resumen Completo con Seguimiento
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

async function createAndProcessSummary(
  userId: string,
  title: string,
  content: string
) {
  try {
    // 1. Crear resumen
    const { data: summary, error: summaryError } = await supabase
      .from('study_summaries')
      .insert({
        user_id: userId,
        title,
        content: { raw: content },
        status: 'pending'
      })
      .select()
      .single()

    if (summaryError) throw summaryError

    console.log('Summary created:', summary.id)

    // 2. Subscribe a cambios en tiempo real
    const channel = supabase.channel(`summary:${summary.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'study_summaries',
        filter: `id=eq.${summary.id}`
      }, (payload) => {
        console.log('Status updated:', payload.new.status)
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'agent_tasks',
        filter: `summary_id=eq.${summary.id}`
      }, (payload) => {
        console.log(`Agent ${payload.new.agent_id} started task`)
      })
      .subscribe()

    // 3. Subscribe a changelog
    const changelogChannel = supabase.channel(`changelog:${summary.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'changelog',
        filter: `summary_id=eq.${summary.id}`
      }, (payload) => {
        console.log(`Change: ${payload.new.change_type} - ${payload.new.description}`)
      })
      .subscribe()

    return {
      summaryId: summary.id,
      channel,
      changelogChannel
    }
  } catch (error) {
    console.error('Error creating summary:', error)
    throw error
  }
}
```

### Ejemplo 2: Monitorear Estado de Agentes
```typescript
async function monitorAgentHealth() {
  // Get all agents
  const { data: agents } = await supabase
    .from('agents')
    .select('*')

  if (!agents) return

  // Subscribe to agent updates
  const channel = supabase.channel('agent-health')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'agents'
    }, (payload) => {
      const agent = payload.new
      const now = new Date()
      const lastHeartbeat = new Date(agent.last_heartbeat)
      const diffSeconds = (now.getTime() - lastHeartbeat.getTime()) / 1000

      if (diffSeconds > 60) {
        console.warn(`Agent ${agent.name} heartbeat stale (${diffSeconds}s)`)
      }

      if (agent.status === 'error') {
        console.error(`Agent ${agent.name} in error state`)
      }
    })
    .subscribe()

  return channel
}
```

### Ejemplo 3: Obtener Resumen Completo con Todos los Detalles
```typescript
async function getFullSummary(summaryId: string) {
  const { data } = await supabase
    .from('study_summaries')
    .select(`
      *,
      agent_tasks (
        id,
        agent_id,
        task_type,
        status,
        input_data,
        output_data,
        error_message,
        created_at,
        completed_at,
        agents (
          id,
          name,
          type
        )
      ),
      changelog (
        id,
        agent_id,
        change_type,
        description,
        changes,
        created_at,
        agents (
          id,
          name
        )
      )
    `)
    .eq('id', summaryId)
    .single()

  return data
}
```

---

## Conclusión

Esta API proporciona acceso completo a todos los recursos de Axon. Consultar la documentación de Supabase para detalles avanzados sobre PostgREST, filtrado, y subscripciones.

**Soporte**: contact@axon-medical.com
**Status**: https://status.axon-medical.com
**Changelog**: /docs/API_CHANGELOG.md
