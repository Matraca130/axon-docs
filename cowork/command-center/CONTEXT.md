# Contexto Actual del Proyecto - Axon v4.5 Project State

**Última Actualización:** 2026-03-21
**Actualizado Por:** System Administrator
**Proyecto:** Axon v4.5 - Medical Education Platform (LMS)

---

## 🎯 Fase Actual del Proyecto

### Fase: FASE 1 - Core Module Implementation
**Estado:** 🟢 EN PROGRESO
**Progreso:** 29% (BUG FIXING + OPTIMIZATION)
**Duración estimada:** 8 semanas más (started: 2026-02)

La Fase 1 implementa 13 agentes especializados para construir los módulos core de Axon:
- Flashcards (FSRS v4 adaptive learning)
- Quizzes (BKT v4 knowledge tracing)
- Summaries (RAG + semantic search)
- Infrastructure (auth, DB, AI)

---

## 📊 Tareas Activas por Módulo

### Flashcards Module
| Tarea | Agente | Estado | Prioridad |
|-------|--------|--------|-----------|
| FSRS v4 implementation | flashcards-backend | ✅ Done | HIGH |
| Batch review API | flashcards-backend | ✅ Done | HIGH |
| React review UI | flashcards-frontend | ✅ Done | HIGH |
| TEST-001: Frontend tests failing | flashcards-tester | 🟡 Blocked | HIGH |

### Quiz Module
| Tarea | Agente | Estado | Prioridad |
|-------|--------|--------|-----------|
| BKT v4 scoring | quiz-backend | ✅ Done | HIGH |
| Question generation (Gemini) | quiz-backend | ✅ Done | HIGH |
| Quiz taking UI | quiz-frontend | ✅ Done | HIGH |
| Results display | quiz-frontend | 🟡 In Dev | HIGH |

### Summaries Module
| Tarea | Agente | Estado | Prioridad |
|-------|--------|--------|-----------|
| RAG pipeline | summaries-backend | ✅ Done | HIGH |
| Vector search | summaries-backend | ✅ Done | HIGH |
| TipTap editor | summaries-frontend | ✅ Done | HIGH |
| BUG-006: Tree filter | summaries-frontend | 🟡 Blocked | MEDIUM |

### Infrastructure
| Tarea | Agente | Estado | Prioridad |
|-------|--------|--------|-----------|
| CRUD factory | infra-plumbing | ✅ Done | HIGH |
| JWT auth (dual token) | infra-plumbing | ✅ Done | HIGH |
| AI provider integration | infra-ai | ✅ Done | HIGH |
| Shared components | infra-ui | ✅ Done | HIGH |
| BUG-001: Mux webhook | infra-ai | 🔴 CRITICAL | CRITICAL |
| SEC-S9B: SQL REVOKE | infra-plumbing | 🟡 Pending | MEDIUM |

---

## 🔴 Bloqueadores Críticos

### BUG-001 (CRITICAL) - resolution_tier vs max_resolution Mux webhook
**Módulo:** infra-ai
**Impacto:** Video processing broken for content
**Síntomas:** Mux webhook handler expects `resolution_tier` but API returns `max_resolution`
**Fix required:** Update webhook payload handler
**Status:** 🔴 BLOCKING flashcard/summary video uploads

### TEST-001 (HIGH) - Frontend tests failing
**Módulo:** flashcards-frontend + quiz-frontend + summaries-frontend
**Impacto:** Cannot deploy frontend without test coverage
**Root cause:** Test setup incomplete (Vitest + React Testing Library)
**Status:** 🟡 Blocking test-related PRs

### BUG-006 (MEDIUM) - Content tree filters inactives in JS
**Módulo:** summaries-frontend
**Impacto:** UI renders inactive items in hierarchy
**Root cause:** Filter logic error in React component
**Status:** 🟡 UX degradation but functional

---

## 📋 Decisiones Recientes

### ARQ-013: Dual Token Authentication (2026-03-10)
**Estado:** ✅ Implemented
- Bearer token: SUPABASE_ANON_KEY (for anonymous access)
- X-Access-Token: JWT (for authenticated users)
- Role extraction: From GET /institutions endpoint
- Expiry: 3600s (⚠️ See SEC-S7 for improvement)

### ARQ-014: RAG Pipeline with pgvector (2026-03-12)
**Estado:** ✅ Implemented
- Embeddings: OpenAI text-embedding-3-large (1536d)
- Vector DB: PostgreSQL + pgvector
- Chunking: Semantic (recursive splitting)
- Search: Cosine similarity with reranking

### ARQ-015: 13-Agent Strategy with Quality-Gate (2026-03-15)
**Estado:** ✅ Implemented
- 10 functional agents (3 pending test setup)
- Audit rounds: 4 planned (1 linting, 1 security done, 2 remaining)
- Code review: Mandatory before merge
- Model: All agents use Claude Opus

### OP-008: Workspace Isolation via Git Worktree (2026-03-18)
**Estado:** ✅ Implemented
- When 2+ agents on same repo → use worktree isolation
- Example: flashcards-backend + quiz-backend both in axon-backend
- Prevents merge conflicts and work interference

---

## 🐛 Problemas Conocidos (11 Total)

### HIGH PRIORITY
- **BUG-001:** resolution_tier vs max_resolution Mux webhook (infra-ai) - CRITICAL

### MEDIUM PRIORITY
- **BUG-006:** Content tree filters inactives (summaries-frontend)
- **BUG-021:** GamificationContext is STUB (infra-ui)
- **SEC-S9B:** 6 SQL functions need REVOKE (infra-plumbing)

### LOW PRIORITY
- **BUG-011:** ~25 kv_store_* junk tables (cleanup)
- **BUG-024:** Overlapping types in 2 services
- **BUG-027:** Dual content tree implementation
- **SEC-S7:** JWT expiry 3600s (should be higher)
- **BUG-034:** GET /reading-states returns 400
- **TEST-001:** Frontend tests failing
- **3 INFO:** BUG-022, BUG-023, BUG-025

---

## ✅ Recentemente Resueltos

### Security Audit (2026-03-17)
- Completadas 13 issues de seguridad
- Focus: Auth, permissions, input validation
- Status: ✅ Fixed

### BUG-030: Professor/Owner Routes (2026-03-16)
- Role-based endpoint access
- Status: ✅ Fixed

### BUG-035: AI Streaming (2026-03-14)
- Streaming responses for real-time UI
- Status: ✅ Fixed

### BUG-031: Auth Error Handling (2026-03-13)
- Improved error messages for auth failures
- Status: ✅ Fixed

---

## 📈 Métricas de Salud del Proyecto

| Métrica | Valor | Target | Estado |
|---------|-------|--------|--------|
| Code Coverage (Backend) | 62% | 80% | 🟡 Progressing |
| Code Coverage (Frontend) | 45% | 80% | 🟡 Progressing |
| ESLint Compliance | 98% | 100% | 🟡 Almost there |
| TypeScript Strict | 95% | 100% | 🟡 Almost there |
| Security Issues | 0 (after audit) | 0 | ✅ Good |
| API Endpoint Coverage | 24/26 endpoints | 26 | 🟡 95% |
| Test Pass Rate | 94% | 100% | 🟡 Good |

---

## 🔄 Próximos Pasos (Este Sprint)

### Prioridad CRÍTICA (Resolver esta semana)
1. **BUG-001:** Fix Mux webhook resolution_tier mismatch (infra-ai)
   - Estimated: 2 hours
   - Blocker for: Video uploads

2. **TEST-001:** Setup frontend test infrastructure
   - Estimated: 4 hours
   - Blocker for: Frontend deployments

### Prioridad ALTA (Próximas 2 semanas)
3. **SEC-S9B:** Add REVOKE to 6 SQL functions (infra-plumbing)
   - Estimated: 3 hours
   - Security improvement

4. **BUG-006:** Fix content tree filter logic (summaries-frontend)
   - Estimated: 2 hours
   - UX improvement

5. **Complete Results Display:** quiz-frontend (quiz-backend dependency done)
   - Estimated: 4 hours
   - Feature completion

### Prioridad MEDIA (Sprint 2)
- Implement GamificationContext (infra-ui)
- Refactor dual content tree (summaries)
- Clean up kv_store_* tables (DB maintenance)
- Increase JWT expiry (SEC-S7)

---

## 🏗️ Arquitectura Actual

```
Frontend (Vercel Deployment)
├── React 18 + Vite 6 + Tailwind v4
├── TypeScript strict mode
├── TanStack Query (data fetching)
├── Context API (state)
├── TipTap (rich text editing)
└── Responsive: Mobile-first

↓↓↓ apiCall() in lib/api.ts ↓↓↓

Backend (Supabase Edge Functions)
├── Hono framework
├── Deno runtime
├── TypeScript
├── PostgreSQL Database
│   ├── 45 tables (including pgvector)
│   ├── Hierarchy: Institution → Course → Semester → Section → Topic
│   └── Gamification: users_xp, user_streaks, badges, leaderboard
├── Authentication
│   ├── Bearer: SUPABASE_ANON_KEY
│   └── X-Access-Token: JWT (3600s expiry)
├── AI Integration
│   ├── Gemini 2.5 Flash (question generation)
│   ├── OpenAI text-embedding-3-large (1536d vectors)
│   └── Claude 3.5 Sonnet (reasoning)
├── RAG Pipeline
│   ├── Semantic chunking (recursive splitting)
│   ├── Vector DB: pgvector queries
│   └── Cosine similarity search
├── Algorithms
│   ├── FSRS v4 (flashcard spaced repetition)
│   └── BKT v4 (knowledge tracing)
├── External Services
│   ├── Stripe (billing/payments)
│   ├── Mux (video processing)
│   ├── Telegram + WhatsApp (messaging)
│   └── Webhooks: Stripe, Mux
└── Performance
    ├── Rate limiting (per user/IP)
    ├── Connection pooling
    └── Query optimization
```

---

## 👥 Equipo y Responsabilidades

### Backend Agents (5)
- flashcards-backend: FSRS + data model
- quiz-backend: BKT + smart generation
- summaries-backend: RAG + embeddings
- infra-plumbing: Core CRUD, auth, DB
- infra-ai: LLM integration, embeddings

### Frontend Agents (4)
- flashcards-frontend: Review UI
- quiz-frontend: Quiz interface
- summaries-frontend: Reader + editor
- infra-ui: Component library

### Testing Agents (3)
- flashcards-tester: Unit + E2E
- quiz-tester: Unit + E2E
- summaries-tester: Unit + E2E

### QA/Audit Agent (1)
- quality-gate: Code reviews, security, performance

---

## 🔗 URLs Importantes

- **GitHub Org:** https://github.com/Matraca130
- **Frontend Repo:** numero1_sseki_2325_55
- **Backend Repo:** axon-backend
- **Docs Repo:** axon-docs
- **Source Docs:** `/sessions/nice-brave-hawking/mnt/AXON PROJECTO/axon-docs/`

---

## 📚 Documentación Source

Location: `/sessions/nice-brave-hawking/mnt/AXON PROJECTO/axon-docs/`

Key files:
- `project_current_state.md` - Este contexto
- `known-bugs.md` - Bug descriptions
- `architecture.md` - Full architecture
- `agent-strategy.md` - 13-agent plan
- `api-endpoints.md` - API reference
- `database-schema.md` - DB design

---

## 🎯 Convenciones y Estándares

### Code
- Language: TypeScript (strict mode)
- Linter: ESLint (3 remaining violations)
- Formatter: Prettier
- Testing: Vitest (backend), Jest (frontend)

### Git
- Main branch: `main` (production)
- Development: `develop`
- Features: `feature/[AGENT]/[DESCRIPTION]`
- Bugfixes: `fix/[BUG-XXX]/[DESCRIPTION]`
- Commit format: `type(scope): description` (Conventional Commits)

### Branches por Agent
```
feature/flashcards-backend/fsrs-calculation
feature/quiz-frontend/results-page
fix/BUG-001/mux-webhook-resolution
```

### Documentation
- Format: Markdown
- Español para explicación
- Inglés para términos técnicos
- Encoding: UTF-8

---

## ⚙️ Ambiente

### Development
- Local: Node.js + Deno + PostgreSQL
- CI/CD: GitHub Actions
- Testing: Vitest + Jest + Cypress

### Staging
- Supabase preview branch
- Frontend: Vercel preview deployment
- Automated: On every PR

### Production
- Supabase: Main project
- Frontend: Vercel main branch
- Deployment: Automatic on main merge

---

## 📝 Notas para el Equipo

### Para Nuevos Agentes
1. Lee este archivo completamente
2. Lee AGENTS_REGISTRY.md para conocer el equipo
3. Consulta DECISIONS.md para decisiones previas
4. Crea tu sesión en SESSIONS.md
5. Lee el archivo source: `/sessions/nice-brave-hawking/mnt/AXON PROJECTO/axon-docs/project_current_state.md`

### Para Actualizaciones
- Update este archivo al final de cada sesión
- Include timestamps ISO 8601
- Document changes in CHANGELOG.md
- Update task progress in /tasks/TASK-00X.md

### Blockers & Escalation
- Critical issues: Update CONTEXT.md immediately
- Security issues: Mark with SEC-* prefix
- Create TASK file for each issue
- Notify quality-gate agent for code review

---

## 📞 Contactos

**Project Owner:** Petrick (petrick.brian@gmail.com)
**GitHub Org:** Matraca130
**Tech Lead:** Determined by agent consensus
**QA Lead:** quality-gate agent

---

**Estado General del Proyecto:** 🟢 ACTIVO Y PROGRESANDO
**Fase Actual:** Fase 1 (29% completada)
**Bloqueadores Activos:** 1 CRÍTICO (BUG-001), múltiples MEDIUM/LOW
**Equipos Especializados:** 13 agentes Fase 1 + 3 on-demand Fase 2
**Próxima Revisión:** 2026-03-28
