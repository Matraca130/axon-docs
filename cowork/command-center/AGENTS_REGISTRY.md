# Registro de Agentes - Agent Registry
## Axon v4.5 Medical Education Platform

**Última Actualización:** 2026-03-21
**Total Agentes Fase 1:** 13 | **Fase 2 (on-demand):** 3
**Estado:** 🟢 Activos y Coordinados

---

## 📊 Tabla Resumen de Agentes

| # | Nombre Agente | Módulo | Rol/Especialidad | Repo | Estado | Memory File | Tareas |
|---|---|---|---|---|---|---|---|
| 1 | flashcards-backend | Flashcards | Backend CRUD, FSRS v4, Batch Review | axon-backend | 🟢 Activo | memory/flashcards-backend.md | TASK-010+ |
| 2 | flashcards-frontend | Flashcards | React UI, Review Sessions, Adaptive Learning | numero1_sseki_2325_55 | 🟢 Activo | memory/flashcards-frontend.md | TASK-020+ |
| 3 | flashcards-tester | Flashcards | Unit Tests, Integration, E2E | axon-backend | 🟡 Setup | memory/flashcards-tester.md | TASK-030 |
| 4 | quiz-backend | Quiz | Backend CRUD, BKT v4 Scoring, Smart Generation | axon-backend | 🟢 Activo | memory/quiz-backend.md | TASK-040+ |
| 5 | quiz-frontend | Quiz | React UI Quiz, Results Display, Creation | numero1_sseki_2325_55 | 🟢 Activo | memory/quiz-frontend.md | TASK-050+ |
| 6 | quiz-tester | Quiz | Unit Tests, Integration, E2E | axon-backend | 🟡 Setup | memory/quiz-tester.md | TASK-060 |
| 7 | summaries-backend | Summaries | Backend CRUD, Semantic Chunking, RAG, Embeddings | axon-backend | 🟢 Activo | memory/summaries-backend.md | TASK-070+ |
| 8 | summaries-frontend | Summaries | React UI Summary Reader + TipTap Editor | numero1_sseki_2325_55 | 🟢 Activo | memory/summaries-frontend.md | TASK-080+ |
| 9 | summaries-tester | Summaries | Unit Tests, Integration, E2E | axon-backend | 🟡 Setup | memory/summaries-tester.md | TASK-090 |
| 10 | infra-plumbing | Infrastructure | Core CRUD Factory, DB, Auth, Validation, Rate Limiting | axon-backend | 🟢 Activo | memory/infra-plumbing.md | TASK-100+ |
| 11 | infra-ai | Infrastructure | AI Providers, RAG Pipeline, Gemini/Claude/OpenAI | axon-backend | 🟢 Activo | memory/infra-ai.md | TASK-110+ |
| 12 | infra-ui | Infrastructure | Shared UI Components, Contexts, Types, Lib | numero1_sseki_2325_55 | 🟢 Activo | memory/infra-ui.md | TASK-120+ |
| 13 | quality-gate | QA/Audit | Code Auditor - Reviews every agent's changes | Ambos | 🟢 Activo | memory/quality-gate.md | TASK-130+ |

**Fase 2 (on-demand):**
- admin-dev: Admin dashboard, user management, permissions
- study-dev: Study planner, analytics, recommendations
- docs-writer: API docs, user guides, tutorials

---

## 📋 Detalles por Agente

### 1. flashcards-backend

**Rol:** Backend CRUD, FSRS Scheduling, Batch Review Operations
**Especialidad:** Spaced Repetition Algorithm (FSRS v4), Flashcard Data Management
**Estado:** 🟢 Activo

#### Información Técnica
- **Repo:** axon-backend (Hono/Deno)
- **Stack:** Hono, Deno, TypeScript, PostgreSQL
- **Archivos Propios:**
  - `src/routes/flashcards.ts` (endpoints)
  - `src/lib/fsrs.ts` (FSRS v4 logic)
  - `src/db/flashcards.sql` (queries)
  - `src/middleware/auth.ts` (compartido)

#### Responsabilidades
- POST /flashcards - Crear tarjeta
- GET /flashcards - Listar (con paginación)
- PUT /flashcards/:id - Actualizar
- DELETE /flashcards/:id - Eliminar
- POST /flashcards/:id/review - Registrar revisión + FSRS
- GET /review-batch - Obtener batch para revisar
- PATCH /batch-review - Actualizar múltiples con FSRS

#### Dependencias
- Depende de: infra-plumbing (CRUD factory, DB), infra-ai (puede usarse para generación)
- Bloquea a: flashcards-frontend (para datos), flashcards-tester (para testear)

#### Métricas de Rendimiento
- **Score Total:** 85/100
- **Tareas Completadas:** 5 (endpoints core implementados)
- **Tareas Fallidas:** 0
- **Cobertura Testing:** 60% (goal: 80%)

#### Capabilidades
- ✅ FSRS v4 algorithm implementation
- ✅ Batch processing
- ✅ Spaced repetition scheduling
- ✅ Database transaction management
- ✅ API endpoint design

---

### 2. flashcards-frontend

**Rol:** React UI, Review Sessions, Adaptive Learning Interface
**Especialidad:** User Experience, Interactive Components, State Management
**Estado:** 🟢 Activo

#### Información Técnica
- **Repo:** numero1_sseki_2325_55 (React 18, Vite 6, Tailwind v4)
- **Stack:** React 18, TypeScript, Tailwind CSS v4, React Router, TanStack Query
- **Archivos Propios:**
  - `src/components/flashcards/` (UI components)
  - `src/pages/FlashcardReview.tsx` (review page)
  - `src/hooks/useFlashcards.ts` (data fetching)
  - `src/contexts/ReviewContext.tsx` (state)

#### Responsabilidades
- Flashcard browser UI
- Review session interactive flow
- Performance metrics display
- Adaptive learning visualization
- Integration with flashcards-backend API

#### Dependencias
- Depende de: flashcards-backend (API), infra-ui (components, contexts)
- Bloquea a: flashcards-tester (for E2E tests)

#### Métricas de Rendimiento
- **Score Total:** 78/100
- **Tareas Completadas:** 4 (pages and components)
- **Tareas Fallidas:** 0
- **Test Coverage:** 45% (goal: 80%) - **BLOCKER: TEST-001**

#### Capabilidades
- ✅ React component architecture
- ✅ Responsive design (Tailwind v4)
- ✅ API integration
- ✅ State management with Context
- ✅ UX optimization

---

### 3. flashcards-tester

**Rol:** Testing (Unit, Integration, E2E)
**Especialidad:** Quality Assurance, Test Strategy, Coverage Analysis
**Estado:** 🟡 Pending Setup

#### Información Técnica
- **Repo:** axon-backend (tests) + numero1_sseki_2325_55 (tests)
- **Stack:** Vitest, Jest, Cypress (E2E), TypeScript
- **Archivos Propios:**
  - `tests/unit/flashcards.test.ts`
  - `tests/integration/flashcards-api.test.ts`
  - `tests/e2e/flashcard-review.cy.ts` (Cypress)

#### Responsabilidades
- Unit tests for FSRS algorithm
- API endpoint integration tests
- E2E user flow testing
- Coverage reporting
- Test maintenance and updates

#### Dependencias
- Depende de: flashcards-backend, flashcards-frontend (code to test)
- Works after: Core functionality is implemented

#### Métricas de Rendimiento
- **Score Total:** 50/100 (pending)
- **Tareas Completadas:** 0
- **Setup Status:** Awaiting backend completion

#### Capabilidades
- ✅ Test framework setup (Jest/Vitest)
- ✅ Unit test design
- ✅ Integration test strategy
- ✅ E2E test design with Cypress
- ✅ Coverage analysis

---

### 4. quiz-backend

**Rol:** Backend CRUD, BKT Scoring, Smart Quiz Generation
**Especialidad:** Knowledge Tracing (BKT v4), Question Pool Management
**Estado:** 🟢 Activo

#### Información Técnica
- **Repo:** axon-backend (Hono/Deno)
- **Stack:** Hono, Deno, TypeScript, PostgreSQL, Gemini 2.5 Flash
- **Archivos Propios:**
  - `src/routes/quizzes.ts` (endpoints)
  - `src/lib/bkt.ts` (BKT v4 logic)
  - `src/lib/quiz-generator.ts` (AI generation)
  - `src/db/quizzes.sql` (queries)

#### Responsabilidades
- POST /quizzes - Crear quiz
- GET /quizzes - Listar
- POST /quizzes/:id/questions - Agregar preguntas
- POST /quizzes/:id/attempt - Registrar intento
- PATCH /quizzes/:id/attempt/:attemptId - Score con BKT
- POST /quizzes/generate - Generar preguntas con AI

#### Dependencias
- Depende de: infra-plumbing (CRUD), infra-ai (Gemini for generation)
- Bloquea a: quiz-frontend, quiz-tester

#### Métricas de Rendimiento
- **Score Total:** 80/100
- **Tareas Completadas:** 4 (core endpoints + BKT)
- **Tareas Fallidas:** 0
- **Cobertura Testing:** 55%

#### Capabilidades
- ✅ BKT v4 knowledge tracing
- ✅ Question pool management
- ✅ Score calculation
- ✅ AI-powered question generation
- ✅ Psychometric modeling

---

### 5. quiz-frontend

**Rol:** React UI Quiz Taking, Results Display, Quiz Creation
**Especialidad:** Interactive Forms, Real-time Scoring, Assessment UX
**Estado:** 🟢 Activo

#### Información Técnica
- **Repo:** numero1_sseki_2325_55 (React 18, Vite 6, Tailwind v4)
- **Stack:** React 18, TypeScript, Tailwind CSS v4, React Hook Form, TanStack Query
- **Archivos Propios:**
  - `src/components/quiz/` (UI components)
  - `src/pages/QuizTake.tsx` (quiz interface)
  - `src/pages/QuizBuilder.tsx` (creation interface)
  - `src/hooks/useQuiz.ts` (data fetching)

#### Responsabilidades
- Quiz taking interface (responsive)
- Real-time answer submission
- Results and performance display
- Quiz creation/editing interface
- Score visualization and analytics

#### Dependencias
- Depende de: quiz-backend (API), infra-ui (components)
- Bloquea a: quiz-tester

#### Métricas de Rendimiento
- **Score Total:** 75/100
- **Tareas Completadas:** 3 (UI pages)
- **Tareas Fallidas:** 0
- **Test Coverage:** 40%

#### Capabilidades
- ✅ Complex form handling
- ✅ Real-time state updates
- ✅ Responsive design
- ✅ Data visualization
- ✅ Performance optimization

---

### 6. quiz-tester

**Rol:** Testing (Unit, Integration, E2E)
**Especialidad:** QA for Assessment Features
**Estado:** 🟡 Pending Setup

#### Información Técnica
- **Repo:** axon-backend + numero1_sseki_2325_55
- **Stack:** Vitest, Jest, Cypress, TypeScript
- **Tests cover:**
  - BKT algorithm correctness
  - Quiz API endpoints
  - UI interaction flows

#### Responsabilidades
- BKT algorithm unit tests
- Quiz API integration tests
- Quiz taking E2E tests
- Result calculation verification
- Coverage maintenance

#### Dependencias
- Depende de: quiz-backend, quiz-frontend (code to test)

#### Métricas de Rendimiento
- **Score Total:** 50/100 (pending)
- **Tareas Completadas:** 0

---

### 7. summaries-backend

**Rol:** Backend CRUD, Semantic Chunking, RAG, Embeddings
**Especialidad:** NLP, Vector Database, Knowledge Retrieval
**Estado:** 🟢 Activo

#### Información Técnica
- **Repo:** axon-backend (Hono/Deno)
- **Stack:** Hono, Deno, TypeScript, PostgreSQL, pgvector, OpenAI Embeddings, Gemini
- **Archivos Propios:**
  - `src/routes/summaries.ts` (endpoints)
  - `src/lib/chunking.ts` (semantic chunking)
  - `src/lib/rag.ts` (RAG pipeline)
  - `src/lib/embeddings.ts` (OpenAI integration)
  - `src/db/summaries.sql` (vector queries)

#### Responsabilidades
- POST /summaries - Crear resumen
- GET /summaries - Listar (with search)
- PUT /summaries/:id - Actualizar
- POST /summaries/:id/chunk - Semantic chunking
- POST /summaries/search - Vector similarity search
- POST /summaries/rag - RAG query response

#### Dependencias
- Depende de: infra-plumbing (CRUD, DB), infra-ai (embeddings, RAG)
- Bloquea a: summaries-frontend, summaries-tester

#### Métricas de Rendimiento
- **Score Total:** 82/100
- **Tareas Completadas:** 4 (endpoints + RAG pipeline)
- **Tareas Fallidas:** 0
- **Cobertura Testing:** 58%

#### Capabilidades
- ✅ Vector embeddings (OpenAI text-embedding-3-large)
- ✅ Semantic chunking algorithms
- ✅ pgvector queries
- ✅ RAG pipeline design
- ✅ Knowledge retrieval optimization

---

### 8. summaries-frontend

**Rol:** React UI Summary Reader + TipTap Editor
**Especialidad:** Rich Text Editing, Document Viewing, Collaborative Features
**Estado:** 🟢 Activo

#### Información Técnica
- **Repo:** numero1_sseki_2325_55 (React 18, Vite 6, Tailwind v4)
- **Stack:** React 18, TypeScript, TipTap Editor, Tailwind CSS v4, TanStack Query
- **Archivos Propios:**
  - `src/components/summaries/` (UI components)
  - `src/pages/SummaryReader.tsx` (reader page)
  - `src/pages/SummaryEditor.tsx` (TipTap editor)
  - `src/hooks/useSummary.ts` (data fetching)

#### Responsabilidades
- Summary document reader (responsive)
- TipTap rich text editor integration
- Search within content (Ctrl+F equivalent)
- Content tree navigation (hierarchy view)
- Collaborative editing indicators

#### Dependencias
- Depende de: summaries-backend (API), infra-ui (components)
- Bloquea a: summaries-tester

#### Known Issues
- **BUG-006:** Content tree filters inactives in JavaScript
- **BUG-027:** Dual content tree implementation (needs refactoring)

#### Métricas de Rendimiento
- **Score Total:** 72/100
- **Tareas Completadas:** 3 (reader + editor pages)
- **Tareas Fallidas:** 0
- **Test Coverage:** 38% (BUG: TEST-001)

#### Capabilidades
- ✅ Rich text editing (TipTap)
- ✅ Document rendering
- ✅ Content search
- ✅ Responsive design
- ✅ Real-time updates

---

### 9. summaries-tester

**Rol:** Testing (Unit, Integration, E2E)
**Especialidad:** RAG and Editor Testing
**Estado:** 🟡 Pending Setup

#### Información Técnica
- **Repo:** axon-backend + numero1_sseki_2325_55
- **Stack:** Vitest, Jest, Cypress, TypeScript
- **Tests cover:**
  - Semantic chunking correctness
  - Vector search accuracy
  - TipTap editor functionality
  - RAG response quality

#### Responsabilidades
- Unit tests for chunking/RAG
- API integration tests
- Editor E2E tests
- Content search verification
- RAG response evaluation

---

### 10. infra-plumbing

**Rol:** Core Infrastructure - CRUD Factory, Database, Auth, Validation, Rate Limiting
**Especialidad:** Backend Architecture, Database Design, Security
**Estado:** 🟢 Activo

#### Información Técnica
- **Repo:** axon-backend (Hono/Deno)
- **Stack:** Hono, Deno, TypeScript, PostgreSQL, Supabase
- **Archivos Propios:**
  - `src/lib/crud.ts` (factory pattern)
  - `src/db/schema.sql` (database)
  - `src/middleware/auth.ts` (JWT auth)
  - `src/middleware/validation.ts` (zod)
  - `src/middleware/rateLimit.ts` (rate limiting)

#### Responsabilidades
- Generic CRUD factory for all modules
- Database schema design and migrations
- JWT token authentication (dual token system)
- Input validation (Zod schemas)
- Rate limiting per user/IP
- Database connection pooling

#### Key Components
- **Auth:** Bearer SUPABASE_ANON_KEY + X-Access-Token JWT
- **Hierarchy:** Institution → Course → Semester → Section → Topic → Summary
- **Database:** PostgreSQL + pgvector (1536d)
- **Role system:** Extracted from GET /institutions endpoint

#### Known Issues
- **SEC-S9B:** 6 SQL functions need REVOKE (MEDIUM security)
- **SEC-S7:** JWT expiry 3600s (should be higher) (LOW)
- **BUG-034:** GET /reading-states returns 400 (LOW)
- **BUG-011:** ~25 kv_store_* junk tables (LOW cleanup)

#### Métricas de Rendimiento
- **Score Total:** 88/100
- **Tareas Completadas:** 6 (core infrastructure)
- **Tareas Fallidas:** 0
- **Cobertura Testing:** 70%

#### Capabilidades
- ✅ API design patterns
- ✅ Database architecture
- ✅ Authentication/Authorization
- ✅ Input validation
- ✅ Performance optimization

---

### 11. infra-ai

**Rol:** Infrastructure - AI Providers, RAG Pipeline, Model Integration
**Especialidad:** LLM Integration, Vector Operations, AI/ML Pipelines
**Estado:** 🟢 Activo

#### Información Técnica
- **Repo:** axon-backend (Hono/Deno)
- **Stack:** Hono, Deno, TypeScript, Gemini 2.5 Flash, Claude 3.5 Sonnet, OpenAI
- **Archivos Propios:**
  - `src/lib/ai/gemini.ts` (Gemini 2.5 Flash)
  - `src/lib/ai/openai.ts` (text-embedding-3-large)
  - `src/lib/ai/claude.ts` (Claude for reasoning)
  - `src/lib/rag/pipeline.ts` (RAG coordination)
  - `src/lib/streaming.ts` (AI streaming)

#### Responsabilidades
- Gemini 2.5 Flash for question generation
- OpenAI embeddings (text-embedding-3-large, 1536d)
- Claude for complex reasoning tasks
- RAG pipeline orchestration
- Streaming responses handling

#### Model Configuration
| Model | Purpose | Provider | Endpoint |
|-------|---------|----------|----------|
| Gemini 2.5 Flash | Question generation, content | Google | /api/generate |
| OpenAI text-embedding-3-large | Embeddings (1536d) | OpenAI | Vector DB |
| Claude 3.5 Sonnet | Complex reasoning, analysis | Anthropic | /api/analyze |

#### Known Issues
- **BUG-001:** resolution_tier vs max_resolution Mux webhook (HIGH) - **CRITICAL**

#### Métricas de Rendimiento
- **Score Total:** 85/100
- **Tareas Completadas:** 5 (all AI integrations)
- **Tareas Fallidas:** 0 (excluding BUG-001)
- **Cobertura Testing:** 65%

#### Recently Resolved
- BUG-035: AI streaming fixed ✅

#### Capabilidades
- ✅ LLM integration (multiple providers)
- ✅ Vector embeddings
- ✅ Prompt engineering
- ✅ RAG pipeline design
- ✅ Streaming implementation

---

### 12. infra-ui

**Rol:** Infrastructure - Shared UI Components, Contexts, Types, Library
**Especialidad:** Design System, Component Library, TypeScript Types
**Estado:** 🟢 Activo

#### Información Técnica
- **Repo:** numero1_sseki_2325_55 (React 18, Vite 6, Tailwind v4)
- **Stack:** React 18, TypeScript, Tailwind CSS v4
- **Archivos Propios:**
  - `src/components/shared/` (reusable components)
  - `src/contexts/` (global contexts)
  - `src/types/` (TypeScript definitions)
  - `src/lib/` (utility functions)
  - `src/hooks/` (custom hooks)

#### Shared Components
- **UI:** Button, Input, Modal, Card, Table, Navbar, etc.
- **Forms:** FormField, FormGroup, FormSubmit
- **Layout:** Container, Grid, Flex, Stack
- **Data:** DataTable, Pagination, Sorting
- **Feedback:** Toast, Alert, Loading, Skeleton

#### Global Contexts
- **AuthContext** - User auth state
- **ThemeContext** - Light/Dark mode
- **NotificationContext** - Toast notifications
- **GamificationContext** - User XP, streaks, badges (STUB)

#### Shared Types
| Type | Location | Purpose |
|------|----------|---------|
| User | types/auth.ts | User profile |
| Flashcard | types/flashcard.ts | Flashcard data |
| Quiz | types/quiz.ts | Quiz data |
| Summary | types/summary.ts | Summary data |
| Institution | types/institution.ts | Org hierarchy |

#### Known Issues
- **BUG-021:** GamificationContext is STUB (needs full impl)
- **BUG-024:** Overlapping types in 2 services (LOW refactor)

#### Métricas de Rendimiento
- **Score Total:** 80/100
- **Tareas Completadas:** 5 (component library + contexts)
- **Tareas Fallidas:** 0
- **Cobertura Testing:** 62%

#### Capabilidades
- ✅ Design system creation
- ✅ Component library management
- ✅ TypeScript type definition
- ✅ Global state management
- ✅ Accessibility standards

---

### 13. quality-gate

**Rol:** QA/Code Audit - Reviews every agent's changes
**Especialidad:** Code Quality, Security, Performance Analysis
**Estado:** 🟢 Activo

#### Información Técnica
- **Repo:** Ambos (axon-backend + numero1_sseki_2325_55)
- **Stack:** TypeScript, ESLint, Prettier, SonarQube, Security scanners
- **Tools:**
  - ESLint (code quality)
  - Prettier (code formatting)
  - TypeScript strict mode
  - Security: Snyk, npm audit
  - Performance: Lighthouse, Bundle analysis

#### Responsibilities
- **Code Review:** Every PR gets audited before merge
- **Linting:** ESLint compliance check
- **Type Safety:** TypeScript strict mode enforcement
- **Security:** Vulnerability scanning (Snyk)
- **Performance:** Bundle size and Lighthouse checks
- **Testing:** Coverage threshold enforcement (80% goal)

#### Audit Rounds (4 iterations planned)
| Round | Focus | Status |
|-------|-------|--------|
| 1 | Basic linting + TS strict | ✅ Done |
| 2 | Security scanning | ✅ Done (13 issues fixed) |
| 3 | Performance + bundling | 🟡 In Progress |
| 4 | Testing coverage analysis | ⏳ Pending |

#### Metrics Tracked
- Code quality score (per agent)
- ESLint violations (trend)
- Type errors
- Security vulnerabilities
- Bundle size growth
- Test coverage (%age)

#### Métricas de Rendimiento
- **Audit Score:** 89/100
- **Total Reviews:** 47 PRs audited
- **Issues Found:** 156 (mostly low severity)
- **Issues Fixed:** 143 (91% resolution rate)

#### Capabilidades
- ✅ Automated code analysis
- ✅ Security vulnerability detection
- ✅ Performance profiling
- ✅ Test coverage analysis
- ✅ Best practices enforcement

---

## 📊 Estadísticas del Equipo

| Métrica | Valor |
|---------|-------|
| Total de Agentes (Fase 1) | 13 |
| Agentes Activos | 10 (3 pending setup) |
| Score Promedio del Equipo | 79/100 |
| Tareas Totales Asignadas | 43 |
| Tareas Completadas | 32 (74%) |
| Tasa de Éxito Promedio | 94% |
| Bugs Abiertos | 11 (1 HIGH, 4 MEDIUM, 6 LOW) |
| Tiempo Total Invertido (Fase 1) | ~180 agent-hours |

---

## 🎯 Matriz de Habilidades Fase 1

| Habilidad | flashcards | quiz | summaries | infra-p | infra-a | infra-u | quality |
|-----------|------------|------|-----------|---------|---------|---------|---------|
| Backend | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | - | ⭐⭐⭐⭐ |
| Frontend | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | - | - | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| AI/ML | - | - | ⭐⭐⭐⭐⭐ | - | ⭐⭐⭐⭐⭐ | - | ⭐⭐⭐ |
| Testing | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| DevOps | - | - | - | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Security | - | - | - | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | - | ⭐⭐⭐⭐⭐ |

---

## 🔄 Fase 2 On-Demand Agentes (Ready to Deploy)

### admin-dev
- Admin dashboard, user management, permissions
- Status: 🟢 Ready (no task yet)

### study-dev
- Study planner, learning analytics, recommendations
- Status: 🟢 Ready (no task yet)

### docs-writer
- API documentation, user guides, tutorials
- Status: 🟢 Ready (no task yet)

---

## 📝 Notas para el Equipo

1. **Workflow:** Siempre feature branch + PR → quality-gate review → merge to main
2. **Model:** Todos los agentes usan Opus (plan límite: 5 simultáneos)
3. **Repos:** Si 2+ agentes en mismo repo → usa git worktree para aislamiento
4. **Memory:** Cada agente tiene archivo en `/memory/[AGENT-NAME].md` para contexto persistente
5. **Communication:** Issues/PRs en GitHub, docs en este Command Center

---

## 🔗 Referencias Rápidas

- **Source Docs:** `/sessions/nice-brave-hawking/mnt/AXON PROJECTO/axon-docs/`
- **Agent Workflow:** Ver README.md "Instrucciones para Agentes"
- **Decision Log:** Ver `/memory/DECISIONS.md`
- **Bug Tracker:** Ver `/ideas/TODO_IMPLEMENT.md`

---

**Última actualización:** 2026-03-21
**Estado del equipo:** 🟢 Coordinado y Activo
