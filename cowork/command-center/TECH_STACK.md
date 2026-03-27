# Tech Stack - Axon Medical Education Platform

## Visión General

El stack tecnológico de Axon está diseñado para ser moderno, escalable, y optimizado para machine learning con IA. Utilizamos arquitectura serverless con Supabase como BaaS principal, React para frontend, y Claude API para agentes inteligentes.

```
┌─────────────────────────────────────────────────────┐
│                    TECH STACK LAYERS                │
├─────────────────────────────────────────────────────┤
│  PRESENTATION   │ React 18 + TypeScript + Tailwind  │
│  STATE          │ Zustand + TanStack Query          │
│  API CLIENT     │ Supabase Client + Axios           │
│  EDGE/BACKEND   │ Deno Edge Functions               │
│  DATABASE       │ PostgreSQL (Supabase)             │
│  REALTIME       │ Supabase Realtime (WebSocket)     │
│  AI/AGENTS      │ Claude API + Agent SDK            │
│  INTEGRATIONS   │ Google Docs API                   │
│  STORAGE        │ Supabase Storage (S3-compatible)  │
│  AUTH           │ Supabase Auth (OAuth + JWT)       │
│  MONITORING     │ Sentry + LogRocket + Datadog      │
└─────────────────────────────────────────────────────┘
```

## 1. Frontend (Cliente)

### React.js
**Versión**: 18.x LTS
**Propósito**: Framework UI component-based
**Características usadas**:
- Functional components con hooks
- Server-side suspense (React Query integration)
- Concurrent rendering para mejor performance
- Error boundaries para error handling

**Ejemplo**:
```tsx
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export function SummaryDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['summaries'],
    queryFn: fetchUserSummaries
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorBoundary error={error} />;

  return (
    <div className="grid grid-cols-3 gap-4">
      {data?.map(summary => (
        <SummaryCard key={summary.id} summary={summary} />
      ))}
    </div>
  );
}
```

### TypeScript
**Versión**: 5.x
**Propósito**: Tipado estático para JavaScript
**Configuración**:
- `strict: true` para máxima seguridad de tipos
- `skipLibCheck: true` para mejor performance en build
- `module: "ESNext"` para moderna transpilación

**Archivos de configuración**:
- `tsconfig.json` - Configuración global
- `tsconfig.app.json` - Configuración para app
- `.eslintrc.json` - Reglas de linting

### Tailwind CSS
**Versión**: 3.x
**Propósito**: Utility-first CSS framework
**Configuración**:
```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        medical: {
          50: '#f0f7ff',
          500: '#0066cc',
          900: '#001a4d'
        }
      }
    }
  }
}
```

**Estrategia de Diseño**:
- Mobile-first responsive design
- Componentes reutilizables con clases base
- Dark mode support vía `prefers-color-scheme`
- Temas médicos customizados

### Zustand
**Versión**: 4.x
**Propósito**: Gestión de estado global ligera
**Uso**:
- Estado de usuario (autenticación)
- Estado de agentes (status, métricas)
- Estado de UI (modales, sidebars)

**Ejemplo**:
```ts
import { create } from 'zustand';

interface AgentState {
  agents: Agent[];
  selectedAgent: Agent | null;
  setSelectedAgent: (agent: Agent) => void;
  updateAgentStatus: (agentId: string, status: string) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  selectedAgent: null,
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  updateAgentStatus: (agentId, status) => set((state) => ({
    agents: state.agents.map(a =>
      a.id === agentId ? { ...a, status } : a
    )
  }))
}));
```

### TanStack Query (React Query)
**Versión**: 5.x
**Propósito**: Gestión de estado servidor con sincronización automática
**Características**:
- Cacheo inteligente con stale-while-revalidate
- Revalidación automática
- Manejo de errores robusto
- Deduplicación de requests

**Ejemplo**:
```ts
const { data: summaries, isFetching, refetch } = useQuery({
  queryKey: ['summaries', userId],
  queryFn: () => supabase.from('study_summaries')
    .select('*')
    .eq('user_id', userId),
  staleTime: 1000 * 60 * 5, // 5 minutos
  gcTime: 1000 * 60 * 30,   // 30 minutos
});
```

### Supabase Client (JavaScript)
**Versión**: Latest
**Propósito**: Cliente para conectarse a Supabase
**Funcionalidades**:
```ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_KEY!
);

// Autenticación
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Queries
const { data } = await supabase
  .from('summaries')
  .select('*')
  .eq('user_id', userId);

// Real-time subscriptions
const subscription = supabase
  .channel('summaries_changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'study_summaries',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('Summary updated:', payload);
  })
  .subscribe();
```

### Axios
**Versión**: 1.x
**Propósito**: HTTP client para llamadas custom
**Uso**:
- Llamadas a Edge Functions
- Integraciones con APIs externas
- Retries automáticos

**Ejemplo**:
```ts
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Handle token refresh
    }
    return Promise.reject(error);
  }
);
```

## 2. Backend (Aplicación)

### Supabase (BaaS)
**Proveedor**: Supabase.com
**Versión**: Latest (PostgreSQL 14+)
**Servicios usados**:

#### 2.1 PostgreSQL Database
**Propósito**: Almacenar todos los datos
**Características**:
- Conexiones: 100 simultáneas (escalable)
- Backups automáticos diarios
- Point-in-time recovery (PITR)
- Replicación de lectura disponible

**Tablas principales**:
```sql
-- Ver schema completo en ARCHITECTURE.md

-- Ejemplo: summaries table
CREATE TABLE study_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  title varchar(500) NOT NULL,
  medical_topic varchar(255),
  content jsonb,
  status varchar(50) DEFAULT 'draft',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  version int DEFAULT 1
);

CREATE INDEX idx_summaries_user_id ON study_summaries(user_id);
CREATE INDEX idx_summaries_status ON study_summaries(status);
```

#### 2.2 Supabase Auth
**Propósito**: Autenticación y autorización
**Métodos soportados**:
- Email + Password
- OAuth (Google, GitHub, Microsoft)
- Magic Links (passwordless)
- JWT tokens (acceso + refresh)

**Flujo**:
```ts
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password',
  options: {
    emailRedirectTo: `${location.origin}/auth/callback`,
  },
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure_password',
});

// Access current user
const { data } = await supabase.auth.getUser();
```

#### 2.3 Edge Functions (Deno)
**Propósito**: Lógica serverless para procesamiento
**Runtime**: Deno 1.40+
**Tiempo máximo**: 10 minutos
**Límites**: 512MB RAM

**Estructura**:
```
supabase/functions/
├── agent-orchestrator/
│   ├── index.ts          # Entry point
│   ├── types.ts
│   └── handlers/
│       ├── analyze.ts
│       ├── validate.ts
│       └── enhance.ts
└── deno.json             # Dependencies
```

**Ejemplo function**:
```ts
// supabase/functions/analyze-summary/index.ts

import { serve } from "https://deno.land/std@0.175.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

interface AnalyzeRequest {
  summary_id: string;
  content: string;
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { summary_id, content }: AnalyzeRequest = await req.json()

    // Call Claude API for analysis
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Analyze this medical content:\n\n${content}`
        }]
      })
    })

    const claudeResponse = await response.json()

    // Save results
    const { error } = await supabase
      .from('agent_tasks')
      .insert({
        summary_id,
        agent_id: 'analyzer',
        output_data: claudeResponse,
        status: 'completed'
      })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

#### 2.4 PostgREST API
**Propósito**: Auto-generated REST API
**Características**:
- CRUD automático en tablas
- Filtering, pagination, sorting
- Relationships (joins) automáticos
- Real-time subscriptions (con Realtime)

**Endpoints generados automáticamente**:
```
GET    /rest/v1/study_summaries
POST   /rest/v1/study_summaries
GET    /rest/v1/study_summaries/{id}
PATCH  /rest/v1/study_summaries/{id}
DELETE /rest/v1/study_summaries/{id}
```

**Ejemplo query**:
```ts
// Obtener resúmenes del usuario con agentes relacionados
const { data } = await supabase
  .from('study_summaries')
  .select(`
    id,
    title,
    status,
    created_at,
    agent_tasks(
      id,
      agent_id,
      status,
      completed_at
    )
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(20)
```

#### 2.5 Realtime Subscriptions
**Propósito**: Actualizaciones en tiempo real vía WebSocket
**Características**:
- Postgres Changes (INSERT, UPDATE, DELETE)
- Presence (user online/offline)
- Broadcast (custom messages)

**Ejemplo**:
```ts
// Subscribe a cambios en resumen específico
const channel = supabase.channel(`summary:${summaryId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'study_summaries',
    filter: `id=eq.${summaryId}`
  }, (payload) => {
    console.log('Summary changed:', payload)
    // Update UI
  })
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'agent_tasks',
    filter: `summary_id=eq.${summaryId}`
  }, (payload) => {
    console.log('Agent task updated:', payload)
    // Update progress UI
  })
  .subscribe()
```

#### 2.6 Storage Buckets
**Propósito**: Almacenar archivos (documentos, imágenes)
**Características**:
- S3-compatible API
- Signed URLs para acceso temporal
- Virus scanning disponible
- CDN integrado (Cloudflare)

**Ejemplo**:
```ts
// Upload archivo
const { data, error } = await supabase.storage
  .from('user_documents')
  .upload(`${userId}/document.pdf`, file)

// Generate signed URL
const { data } = await supabase.storage
  .from('user_documents')
  .createSignedUrl(`${userId}/document.pdf`, 3600) // 1 hora

// Download
const { data, error } = await supabase.storage
  .from('user_documents')
  .download(`${userId}/document.pdf`)
```

## 3. AI & Agentes

### Claude API
**Proveedor**: Anthropic
**Versión**: Latest (Claude 3.5 Sonnet)
**Endpoint**: `https://api.anthropic.com/v1/messages`

**Modelos disponibles**:
```ts
type ClaudeModel =
  | 'claude-3-5-sonnet-20241022'  // Default, mejor balance
  | 'claude-3-opus-20250219'       // Más poderoso, más caro
  | 'claude-3-haiku-20250307'      // Rápido, barato
```

**Configuración típica para agentes**:
```ts
const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 2048,
  system: `You are an expert medical educator specializing in ${specialty}.
           Your role is to ${task_description}.
           Always prioritize accuracy and cite sources.`,
  messages: [
    {
      role: "user",
      content: userPrompt
    }
  ]
})
```

**Costos estimados**:
- Claude 3.5 Sonnet: $3 / 1M tokens (entrada), $15 / 1M (salida)
- Estimado: $0.02-0.05 por resumen procesado

### Anthropic Agent SDK
**Versión**: Latest
**Propósito**: Orquestar múltiples agentes
**Características**:
- Agent composition
- Tool use (function calling)
- Context management
- Streaming responses

**Estructura típica**:
```ts
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

interface AgentMessage {
  role: "user" | "assistant"
  content: string
}

class MedicalAgent {
  name: string
  specialization: string
  conversationHistory: AgentMessage[] = []

  async process(input: string): Promise<string> {
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      system: this.getSystemPrompt(),
      messages: [
        ...this.conversationHistory,
        { role: "user", content: input }
      ]
    })

    const assistantMessage = response.content[0].type === "text"
      ? response.content[0].text
      : ""

    this.conversationHistory.push(
      { role: "user", content: input },
      { role: "assistant", content: assistantMessage }
    )

    return assistantMessage
  }

  private getSystemPrompt(): string {
    return `You are a medical education AI specializing in ${this.specialization}.
            Your role is to provide accurate, evidence-based medical education content.
            Always cite sources. Flag uncertainty. Ask clarifying questions when needed.`
  }
}
```

## 4. Integraciones

### Google Docs API
**Versión**: v1
**Scopes utilizados**:
- `https://www.googleapis.com/auth/documents` (leer/escribir docs)
- `https://www.googleapis.com/auth/drive` (acceder archivos)

**Funcionalidades**:
```ts
import { google } from "googleapis"

const docs = google.docs({ version: "v1", auth })

// Leer documento
const doc = await docs.documents.get({
  documentId: documentId
})

// Escribir contenido
await docs.documents.batchUpdate({
  documentId,
  requestBody: {
    requests: [
      {
        insertText: {
          location: { index: 1 },
          text: "Nuevo contenido"
        }
      }
    ]
  }
})

// Usar formato
await docs.documents.batchUpdate({
  documentId,
  requestBody: {
    requests: [
      {
        updateTextStyle: {
          range: { startIndex: 0, endIndex: 5 },
          textStyle: { bold: true },
          fields: "bold"
        }
      }
    ]
  }
})
```

## 5. DevOps & Deployment

### Git & GitHub
**Repositorio**: github.com/axon-medical/axon-platform
**Branching strategy**: Git Flow
```
main (production)
└── develop (staging)
    ├── feature/command-center-ui
    ├── feature/agent-validation
    └── bugfix/xyz
```

### GitHub Actions (CI/CD)
**Workflows configurados**:

```yaml
# .github/workflows/test-and-deploy.yml
name: Test & Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - run: npm install
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - run: npm install
      - run: npm run build
      - run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

### Vercel (Frontend Hosting)
**Propósito**: Hosting frontend con CDN global
**Configuración**:
```json
// vercel.json
{
  "framework": "react",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_KEY": "@supabase_key",
    "VITE_API_BASE_URL": "@api_base_url"
  },
  "regions": ["sfo1", "iad1", "arn1"]
}
```

### Supabase Hosting (Backend)
**Propósito**: Hosting PostgreSQL + Edge Functions
**Características**:
- Backups automáticos
- Monitoreo 24/7
- Auto-scaling
- SLA 99.9%

**Deployment de Edge Functions**:
```bash
supabase functions deploy agent-orchestrator \
  --project-id <project-id>
```

### Docker (Containerization)
**Propósito**: Desarrollo local consistente

**Dockerfile**:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --frozen-lockfile

# Copy source
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "run", "preview"]
```

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      VITE_SUPABASE_URL: ${SUPABASE_URL}
      VITE_SUPABASE_KEY: ${SUPABASE_ANON_KEY}
    depends_on:
      - supabase

  supabase:
    image: supabase/supabase
    ports:
      - "54321:5432"
    environment:
      POSTGRES_PASSWORD: postgres
```

## 6. Monitoreo y Observabilidad

### Sentry
**Propósito**: Error tracking en frontend y backend
**Configuración**:
```ts
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
```

### LogRocket
**Propósito**: Session replay y analytics de usuario
**Configuración**:
```ts
import LogRocket from 'logrocket'

LogRocket.init('axon-medical/axon-platform', {
  console: {
    shouldAggregateConsoleErrors: true,
  },
  network: {
    requestSanitizer: (request) => {
      request.headers = {}
      return request
    },
  },
})
```

### Datadog (Futuro)
**Propósito**: Observabilidad integral, APM
**Planned para Q2 2026**

## 7. Tabla de Versiones

| Componente | Versión | Año Release | Status |
|-----------|---------|------------|--------|
| React | 18 | 2022 | Stable |
| TypeScript | 5 | 2023 | Stable |
| Tailwind CSS | 3 | 2023 | Stable |
| Zustand | 4 | 2023 | Stable |
| Supabase | Latest | 2021 | Stable |
| PostgreSQL | 14+ | 2021 | Stable |
| Claude API | Latest | 2023 | Stable |
| Deno | 1.40+ | 2018 | Stable |
| Vercel | - | 2019 | Stable |

## 8. Dependencias Críticas

### npm packages principales
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "tailwindcss": "^3.3.0",
    "axios": "^1.6.0",
    "@anthropic-ai/sdk": "^0.9.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "vitest": "^1.0.0"
  }
}
```

## Conclusión

El tech stack de Axon está optimizado para:
- ✅ Escalabilidad (serverless, CDN)
- ✅ Confiabilidad (managed services)
- ✅ Developer experience (moderno, tipado)
- ✅ AI-first (integración nativa con Claude)
- ✅ Medical compliance (encriptación, HIPAA-ready)

Las decisiones tecnológicas priorizan precisión, seguridad, y capacidad de escalar sin comprometer la experiencia del usuario.
