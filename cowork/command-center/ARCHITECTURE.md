# Arquitectura del Proyecto Axon

## Visión General del Sistema

Axon es una plataforma de educación médica que permite crear resúmenes de estudio interactivos mediante inteligencia artificial. El sistema integra múltiples agentes de Claude para trabajar colaborativamente en la generación, validación y mejora del contenido educativo.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AXON PLATFORM OVERVIEW                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     PRESENTACIÓN (Frontend)                  │  │
│  │  React + Tailwind CSS + TypeScript                           │  │
│  │  - Dashboard de estudiantes                                  │  │
│  │  - Editor interactivo de resúmenes                           │  │
│  │  - Visualizador de contenido médico                          │  │
│  │  - Panel de control de agentes (Command Center)              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                            ↓ HTTP/WS                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    CAPA DE APLICACIÓN                        │  │
│  │  Edge Functions (Deno) - Supabase                            │  │
│  │  - REST API endpoints                                        │  │
│  │  - WebSocket handlers                                        │  │
│  │  - Orquestación de agentes                                   │  │
│  │  - Validación y procesamiento                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                            ↓ SQL/Real-time                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                BASE DE DATOS (Backend)                       │  │
│  │  PostgreSQL (Supabase)                                       │  │
│  │  - Usuarios y autenticación                                  │  │
│  │  - Resúmenes y contenido                                     │  │
│  │  - Historial de agentes                                      │  │
│  │  - Changelog y auditoría                                     │  │
│  │  - Configuración del sistema                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                            ↓ API/Prompts                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    AGENTES DE CLAUDE                         │  │
│  │  5 Agentes especializados colaborativos                      │  │
│  │  - Agent Análisis: Extracción y estructura                   │  │
│  │  - Agent Validación: Calidad y precisión                     │  │
│  │  - Agent Mejora: Optimización y enriquecimiento              │  │
│  │  - Agent Integración: Google Docs y sincronización           │  │
│  │  - Agent Coordinador: Orquestación y supervisión             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │               INTEGRACIONES EXTERNAS                         │  │
│  │  ├─ Google Docs API (importación/exportación)                │  │
│  │  ├─ Claude API (procesamiento de contenido)                  │  │
│  │  ├─ Storage Bucket (archivos multimedia)                     │  │
│  │  └─ Auth Providers (OAuth, JWT)                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Desglose de Componentes

### 1. Frontend (Presentación)

**Ubicación**: `/frontend`

**Tecnologías**:
- React 18+
- TypeScript
- Tailwind CSS
- Zustand (gestión de estado)
- TanStack Query (sincronización de datos)

**Componentes principales**:
```
frontend/
├── components/
│   ├── Dashboard/        # Panel principal del estudiante
│   ├── Editor/          # Editor interactivo de resúmenes
│   ├── CommandCenter/   # Panel de control de agentes
│   ├── Viewer/          # Visualizador de contenido
│   └── Common/          # Componentes reutilizables
├── pages/
│   ├── dashboard.tsx
│   ├── study-summary.tsx
│   ├── command-center.tsx
│   └── settings.tsx
├── hooks/
│   ├── useAgent.ts
│   ├── useSummary.ts
│   └── useRealtimeUpdates.ts
├── store/
│   ├── agentStore.ts
│   ├── summaryStore.ts
│   └── uiStore.ts
└── utils/
    ├── api-client.ts
    └── transformers.ts
```

**Responsabilidades**:
- Renderizar interfaz de usuario responsive
- Gestionar estado local de componentes
- Comunicarse con backend vía REST y WebSocket
- Mostrar actualizaciones en tiempo real de agentes
- Validar entrada de usuario antes de enviar al servidor

### 2. Backend (Aplicación)

**Ubicación**: `/backend`

**Tecnologías**:
- Supabase (PostgreSQL + Auth)
- Edge Functions (Deno)
- PostgREST API
- Realtime subscriptions

**Estructura**:
```
backend/
├── functions/
│   ├── agent-orchestrator/
│   │   └── index.ts          # Punto de entrada para orquestación
│   ├── summary-processor/
│   │   └── index.ts          # Procesamiento de resúmenes
│   ├── validate-content/
│   │   └── index.ts          # Validación de contenido
│   ├── sync-google-docs/
│   │   └── index.ts          # Sincronización Google Docs
│   └── webhook-handler/
│       └── index.ts          # Manejador de webhooks
├── migrations/
│   ├── 001_create_base_tables.sql
│   ├── 002_create_agents_table.sql
│   ├── 003_create_changelog_table.sql
│   └── 004_create_indexes.sql
├── prompts/
│   ├── analyzer.md           # Prompt del agente de análisis
│   ├── validator.md          # Prompt del agente de validación
│   ├── enhancer.md           # Prompt del agente de mejora
│   ├── integrator.md         # Prompt del agente de integración
│   └── coordinator.md        # Prompt del agente coordinador
└── types/
    ├── database.ts           # Tipos de Supabase
    └── common.ts             # Tipos compartidos
```

**Responsabilidades**:
- Exponer API REST para operaciones CRUD
- Orquestar agentes de Claude
- Gestionar transacciones y consistencia
- Registrar cambios en changelog
- Notificar clientes de cambios en tiempo real

### 3. Base de Datos (PostgreSQL)

**Ubicación**: Supabase PostgreSQL

**Esquema principal**:
```sql
-- Tabla de usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  role VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de resúmenes de estudio
CREATE TABLE study_summaries (
  id UUID PRIMARY KEY,
  title VARCHAR(500),
  user_id UUID REFERENCES users(id),
  medical_topic VARCHAR(255),
  content JSONB,
  status VARCHAR(50), -- draft, processing, published
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  version INT DEFAULT 1
);

-- Tabla de agentes
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  type VARCHAR(50), -- analyzer, validator, enhancer, integrator, coordinator
  status VARCHAR(50), -- idle, processing, error
  last_heartbeat TIMESTAMP,
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de tareas de agentes
CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agents(id),
  summary_id UUID REFERENCES study_summaries(id),
  task_type VARCHAR(100),
  input_data JSONB,
  output_data JSONB,
  status VARCHAR(50), -- pending, processing, completed, failed
  error_message TEXT,
  priority INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Tabla de changelog
CREATE TABLE changelog (
  id UUID PRIMARY KEY,
  summary_id UUID REFERENCES study_summaries(id),
  agent_id UUID REFERENCES agents(id),
  change_type VARCHAR(50), -- created, modified, validated, enhanced
  description TEXT,
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de configuración
CREATE TABLE system_config (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Índices críticos**:
- `study_summaries(user_id, created_at)`
- `agent_tasks(agent_id, status, created_at)`
- `changelog(summary_id, created_at)`

### 4. Agentes de Claude

**Tipos de agentes**:

#### 4.1 Agent Análisis (Analyzer)
- **Rol**: Extrae y estructura información del contenido médico
- **Entrada**: Texto bruto, documentos
- **Salida**: Contenido estructurado con conceptos, definiciones, relaciones
- **Prompts**: `/backend/prompts/analyzer.md`
- **Métricas**: Tiempo de procesamiento, precisión de extracción

#### 4.2 Agent Validación (Validator)
- **Rol**: Valida precisión, completitud y adherencia a estándares médicos
- **Entrada**: Contenido estructurado
- **Salida**: Reporte de validación con mejoras sugeridas
- **Prompts**: `/backend/prompts/validator.md`
- **Métricas**: Score de validación, issues encontrados

#### 4.3 Agent Mejora (Enhancer)
- **Rol**: Optimiza la presentación y enriquece con ejemplos y analogías
- **Entrada**: Contenido validado
- **Salida**: Contenido mejorado y enriquecido
- **Prompts**: `/backend/prompts/enhancer.md`
- **Métricas**: Nivel de enriquecimiento, feedback de usuario

#### 4.4 Agent Integración (Integrator)
- **Rol**: Sincroniza con Google Docs y gestiona integraciones externas
- **Entrada**: Resumen procesado
- **Salida**: Documento sincronizado
- **Prompts**: `/backend/prompts/integrator.md`
- **Métricas**: Tasa de sincronización exitosa, latencia

#### 4.5 Agent Coordinador (Coordinator)
- **Rol**: Orquesta el flujo de trabajo y supervisiona otros agentes
- **Entrada**: Tareas del usuario
- **Salida**: Resumen completamente procesado
- **Prompts**: `/backend/prompts/coordinator.md`
- **Responsabilidades**:
  - Enrutar tareas a agentes especializados
  - Monitorear progreso
  - Manejar errores y reintentos
  - Mantener contexto compartido
  - Registrar decisiones

## Flujo de Datos

### Flujo de Creación de Resumen

```
Usuario Input
    ↓
Frontend (React)
    ├─ Valida entrada
    └─ Envía a Backend
        ↓
Edge Function (Agent Orchestrator)
    ├─ Crea tarea en DB
    ├─ Notifica Command Center
    └─ Enruta al Coordinator Agent
        ↓
Coordinator Agent
    ├─ Inicia flujo de procesamiento
    ├─ Envía a Analyzer Agent
    │   ├─ Extrae estructura
    │   └─ Retorna contenido estructurado
    ├─ Envía a Validator Agent
    │   ├─ Valida precisión
    │   └─ Retorna reporte
    ├─ Envía a Enhancer Agent
    │   ├─ Optimiza presentación
    │   └─ Retorna contenido mejorado
    └─ Opcional: Envía a Integrator Agent
        ├─ Sincroniza Google Docs
        └─ Retorna resultado
            ↓
Backend
    ├─ Actualiza DB
    ├─ Registra en Changelog
    └─ Notifica Frontend vía WebSocket
        ↓
Frontend
    └─ Actualiza UI en tiempo real
```

### Flujo de Actualizaciones en Tiempo Real

```
Backend (PostgreSQL)
    ↓
Realtime Broadcast
    ├─ Agent status changes
    ├─ Task completions
    └─ Summary updates
        ↓
WebSocket Listener (Frontend)
    ├─ Recibe cambios
    ├─ Actualiza estado local
    └─ Re-renderiza UI
        ↓
Usuario ve actualización en vivo
```

## Stack Tecnológico Detallado

### Frontend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 18+ | Interfaz de usuario |
| TypeScript | 5+ | Tipado estático |
| Tailwind CSS | 3+ | Estilos utility-first |
| Zustand | 4+ | Gestión de estado |
| TanStack Query | 5+ | Sincronización servidor-cliente |
| Supabase Client | Latest | Conexión con backend |
| Axios | 1+ | HTTP requests |

### Backend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Supabase | Latest | Plataforma completa |
| PostgreSQL | 14+ | Base de datos |
| Deno | 1.40+ | Runtime Edge Functions |
| PostgREST | Latest | API automática |
| Realtime | Latest | WebSocket subscriptions |
| JWT | - | Autenticación |

### AI & Integrations
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Claude API | Latest | Agentes de IA |
| Google Docs API | v1 | Sincronización documentos |
| Anthropic SDK | Latest | Cliente Python/JS |

### DevOps & Tools
| Herramienta | Uso |
|-----------|-----|
| Git | Control de versión |
| GitHub | Repositorio |
| GitHub Actions | CI/CD |
| Docker | Containerización |
| Vercel | Hosting Frontend |
| Supabase Hosting | Backend |

## Puntos de Integración

### 1. Supabase Integration
- **Autenticación**: OAuth, Email/Password
- **Base de datos**: PostgREST API, Raw SQL
- **Realtime**: WebSocket subscriptions
- **Storage**: Bucket para archivos
- **Edge Functions**: Lógica de backend serverless

### 2. Google Docs Integration
- **Import**: Leer documentos de Google Drive
- **Export**: Escribir resúmenes a Google Docs
- **Sync**: Mantener sincronización bidireccional
- **Permissions**: Gestionar acceso compartido
- **Updates**: Webhook para cambios externos

### 3. Claude API Integration
- **Async Processing**: Llamadas no-bloqueantes a API
- **Streaming**: Procesar respuestas en tiempo real
- **Context Management**: Mantener contexto de conversación
- **Token Optimization**: Gestionar uso de tokens
- **Error Handling**: Reintentos y fallback strategies

### 4. External Services
- **SendGrid/Resend**: Notificaciones por email
- **S3/Storage**: Archivos multimedia
- **Analytics**: Tracking de uso
- **Error Monitoring**: Sentry/LogRocket

## Consideraciones de Escalabilidad

### Capacidad Actual
- **Usuarios concurrentes**: 100-500
- **Resúmenes/día**: 1000+
- **Agentes paralelos**: 5-10
- **Requests/segundo**: 50-100

### Bottlenecks Identificados
1. **API de Google Docs**: Rate limits
2. **Claude API**: Tokens por minuto
3. **PostgreSQL**: Conexiones simultáneas
4. **Edge Functions**: Tiempo de ejecución (10 min max)

### Estrategias de Escalabilidad

**Corto plazo**:
- Implementar colas (Redis/RabbitMQ)
- Cacheo agresivo (Redis)
- Paginación en resultados grandes

**Mediano plazo**:
- Base de datos replicada (read replicas)
- CDN para assets estáticos
- Batch processing para tareas asincrónicas

**Largo plazo**:
- Microservicios separados por dominio
- Event sourcing para auditoría completa
- CQRS para lecturas/escrituras
- Kubernetes para orquestación de contenedores

## Consideraciones de Seguridad

### Autenticación & Autorización
- **JWT tokens** con expiración corta (15 min)
- **Refresh tokens** con expiración larga (7 días)
- **Row-level security** (RLS) en PostgreSQL
- **Role-based access control** (RBAC)
- **API key rotation** para servicios internos

### Protección de Datos
- **Encriptación en tránsito**: TLS/HTTPS
- **Encriptación en reposo**: AES-256
- **PII handling**: Enmascaramiento de datos sensibles
- **HIPAA compliance**: Para datos médicos
- **Audit logging**: Changelog completo de cambios

### Multi-Agent Access Control
```sql
-- RLS Policy ejemplo
CREATE POLICY "agents_can_view_assigned_tasks"
  ON agent_tasks
  USING (agent_id = current_setting('app.current_agent_id')::uuid);

-- Row-level filtering por usuario
CREATE POLICY "users_can_see_own_summaries"
  ON study_summaries
  USING (user_id = auth.uid());
```

### API Security
- **Rate limiting**: Por IP y por usuario
- **CORS**: Whitelist de dominios permitidos
- **Input validation**: Sanitización de todos los inputs
- **SQL injection prevention**: Prepared statements
- **XSS protection**: Content Security Policy headers

## Deployment Architecture

```
┌─────────────────────────────────────────────┐
│         GitHub Repository                   │
│  (main, develop, feature branches)          │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ↓          ↓          ↓
   Main Branch  Develop   Feature
        │          │          │
        ├─────────┬┴──────────┤
        ↓         ↓           ↓
    GitHub    Pull      Manual
    Actions   Request   Deploy
      │        Review
      └────┬────────┘
           ↓
    ┌──────────────────────┐
    │   Build & Test       │
    │   - ESLint           │
    │   - TypeScript       │
    │   - Unit Tests       │
    │   - Integration      │
    └──────────────────────┘
           │
    ┌──────┴──────┐
    ↓             ↓
Frontend      Backend
(Vercel)    (Supabase)
    │             │
    └─────┬───────┘
          ↓
    Production
    Environment
```

## Conclusión

Axon es un sistema modular y escalable que aprovecha el poder de múltiples agentes de Claude especializados para proporcionar educación médica interactiva de alta calidad. La arquitectura está diseñada para crecer con la demanda manteniendo seguridad, confiabilidad y facilidad de mantenimiento.
