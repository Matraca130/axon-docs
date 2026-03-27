# 🗺️ ROADMAP DEL PROYECTO - Axon v4.5

## 📌 Visión General

Axon v4.5 es una plataforma de educación médica completa que combina:
- **Flashcards adaptativas** con algoritmo FSRS v4 (spaced repetition)
- **Quizzes inteligentes** con BKT v4 (knowledge tracing)
- **Resúmenes con RAG** (retrieval-augmented generation)
- **Gamificación** (XP, streaks, badges, leaderboard)
- **Stack moderno:** React 18 + Hono/Deno + PostgreSQL + pgvector

---

## 🎯 Fases del Proyecto

### 📌 Fase 0: Setup y Preparación ✅ COMPLETADA
**Estado**: 🟢 COMPLETADA | **Duración**: 2 semanas (Enero 2026)

#### Logros
- [x] Inicializar repositorios (frontend + backend + docs)
- [x] Configurar Supabase (PostgreSQL + pgvector)
- [x] Configurar Vercel (frontend deployment)
- [x] Setup GitHub Actions CI/CD
- [x] Definir 13-agent strategy con quality-gate
- [x] Crear architecture & design docs
- [x] Inicializar Command Center
- [x] First security audit (13 issues fixed)

#### Deliverables
- ✅ 3 repositorios configurados
- ✅ CI/CD pipelines working
- ✅ Design system planned
- ✅ 13 agents mapped and ready

---

### 📌 Fase 1: Core Module Implementation ← **ACTUAL**
**Estado**: 🟡 EN PROGRESO (29% completada) | **Deadline**: 2026-04-30
**Duración estimada**: 8 semanas (Febrero - Abril 2026)

#### Módulos por Completar (13 Agents)

##### ✅ Flashcards Module
- [x] **flashcards-backend:** FSRS v4 algorithm, CRUD, batch review
- [x] **flashcards-frontend:** React UI, review sessions, adaptive learning
- [ ] **flashcards-tester:** Unit + Integration + E2E tests (BLOCKED: TEST-001)

##### ✅ Quiz Module
- [x] **quiz-backend:** BKT v4 scoring, smart generation, CRUD
- [x] **quiz-frontend:** Quiz taking UI, results display (In Progress), creation
- [ ] **quiz-tester:** Unit + Integration + E2E tests (BLOCKED: TEST-001)

##### ✅ Summaries Module
- [x] **summaries-backend:** RAG pipeline, semantic chunking, embeddings
- [x] **summaries-frontend:** Reader UI, TipTap editor (BUG-006 pending)
- [ ] **summaries-tester:** Unit + Integration + E2E tests (BLOCKED: TEST-001)

##### ✅ Infrastructure Layer
- [x] **infra-plumbing:** CRUD factory, DB, auth (dual token), validation, rate limiting
- [x] **infra-ai:** Gemini, OpenAI embeddings, Claude, RAG pipeline
- [x] **infra-ui:** Shared components, contexts, types, lib
- [x] **quality-gate:** Code auditor, security scanning, performance checks

#### Critical Tasks This Sprint
1. **🔴 BUG-001 (CRITICAL):** Fix Mux webhook resolution_tier mismatch
2. **🟡 TEST-001 (HIGH):** Setup frontend test infrastructure (Vitest + Jest)
3. **🟡 BUG-006 (MEDIUM):** Fix content tree filter logic
4. **🟡 SEC-S9B (MEDIUM):** Add REVOKE to 6 SQL functions
5. Complete quiz results display UI

#### Metrics at Phase 1 End
- **Code Coverage:** Backend 80%, Frontend 80%
- **ESLint Compliance:** 100%
- **TypeScript Strict:** 100%
- **Security Issues:** 0
- **API Endpoints:** 26/26 implemented + tested
- **Bug Count:** 0 (fix all high priority items)

---

### 📌 Fase 2: Advanced Features & Polish
**Estado**: ⏳ PENDIENTE | **Planned Start**: 2026-05-01
**Duración estimada**: 6 semanas (Mayo - Junio 2026)

#### On-Demand Agents (Ready to deploy)
- [ ] **admin-dev:** Admin dashboard, user management, permissions
- [ ] **study-dev:** Study planner, analytics, recommendations
- [ ] **docs-writer:** API docs (OpenAPI), user guides, tutorials

#### Features YA Implementadas (no repetir)
- [x] ~~Gamification system~~ — **COMPLETADO 2026-03-13** (XP engine, 39 badges, streaks, goals, leaderboard, 13 endpoints + 8 hooks)
- [x] ~~Messaging (Telegram + WhatsApp)~~ — **COMPLETADO 2026-03-10** (webhooks, review-flow, rate-limit, timing-safe)
- [x] ~~Video (Mux)~~ — **COMPLETADO** (upload via @mux/upchunk, signed playback JWTs, view tracking)
- [x] ~~Billing (Stripe)~~ — **COMPLETADO** (checkout, portal, webhooks refactored into routes/billing/)
- [x] ~~Embedding migration~~ — **COMPLETADO 2026-03-18** (Gemini 768d → OpenAI text-embedding-3-large 1536d)
- [x] ~~Claude AI integration~~ — **COMPLETADO** (claude-ai.ts)
- [x] ~~Realtime voice sessions~~ — **COMPLETADO** (as-realtime.ts frontend + realtime-session.ts backend)

#### Features PENDIENTES para Fase 2
- [ ] Admin dashboard polish (admin-dev agent)
- [ ] Study planner & analytics (study-dev agent)
- [ ] API documentation (OpenAPI) (docs-writer agent)
- [ ] Multi-language support (i18n) — actualmente ES + PT-BR solo
- [ ] Dark mode full implementation
- [ ] Performance optimization & caching
- [ ] User analytics & progress tracking dashboards
- [ ] WhatsApp + Telegram deduplicate review-flow logic (~800 LOC each duplicated)

#### Deliverables
- Admin console fully functional
- Study planner with recommendations
- Complete API documentation (OpenAPI)
- User guides and tutorials
- Analytics dashboard
- Deduplicated messaging code

---

### 📌 Fase 3: Testing & Quality Assurance
**Estado**: ⏳ PENDIENTE | **Planned Start**: 2026-06-01
**Duración estimada**: 4 semanas (Junio 2026)

#### Comprehensive Testing
- [ ] Full E2E test coverage (Cypress)
- [ ] Load testing (k6)
- [ ] Security audit round 2
- [ ] Performance testing & optimization
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Cross-browser testing

#### Quality Gates
- [ ] 90%+ code coverage
- [ ] 0 critical security issues
- [ ] <100ms API response times (p95)
- [ ] <3s initial page load
- [ ] Lighthouse score >90

#### Deliverables
- Test report with metrics
- Performance baseline
- Security audit findings + fixes
- Accessibility report

---

### 📌 Fase 4: Deployment & Launch
**Estado**: ⏳ PENDIENTE | **Planned Start**: 2026-06-15
**Duración estimada**: 2 semanas (Junio 2026)

#### Pre-Launch Activities
- [ ] Database backups & disaster recovery plan
- [ ] Monitoring & alerting setup
- [ ] Log aggregation (Datadog, New Relic, etc.)
- [ ] Documentation review & finalization
- [ ] Team training
- [ ] Beta testing with select users

#### Launch Activities
- [ ] Production environment setup
- [ ] DNS & domain configuration
- [ ] SSL certificates
- [ ] CDN setup (Cloudflare)
- [ ] Marketing & announcements
- [ ] User onboarding flow

#### Post-Launch
- [ ] Monitor for issues
- [ ] Gather feedback
- [ ] Plan Phase 5 improvements
- [ ] Release notes & changelog

---

### 📌 Fase 5: Growth & Iteration (Post-Launch)
**Estado**: ⏳ PENDIENTE | **Planned Start**: 2026-07-01

#### Continuous Improvement
- [ ] User feedback integration
- [ ] Feature requests evaluation
- [ ] Performance optimization
- [ ] Scaling infrastructure
- [ ] Expansion to new medical specialties

#### Future Features (Backlog)
- AI tutor chatbot
- Peer-to-peer learning features
- Certification program tracking
- Institution management suite
- API for third-party integrations
- Mobile native apps (iOS/Android)

---

## 📊 Métricas de Progreso

### Fase 1 Progress Details
| Componente | Tareas | Hechas | % | Status |
|-----------|--------|--------|---|--------|
| Flashcards Backend | 5 | 5 | 100% | ✅ Done |
| Flashcards Frontend | 4 | 3 | 75% | 🟡 In Dev |
| Flashcards Testing | 3 | 0 | 0% | 🔴 Blocked (TEST-001) |
| Quiz Backend | 5 | 4 | 80% | 🟡 In Dev |
| Quiz Frontend | 4 | 3 | 75% | 🟡 In Dev |
| Quiz Testing | 3 | 0 | 0% | 🔴 Blocked (TEST-001) |
| Summaries Backend | 5 | 4 | 80% | 🟡 In Dev |
| Summaries Frontend | 4 | 3 | 75% | 🟡 In Dev (BUG-006) |
| Summaries Testing | 3 | 0 | 0% | 🔴 Blocked (TEST-001) |
| Infrastructure | 8 | 7 | 87% | 🟡 In Dev |
| Quality Gate | 6 | 6 | 100% | ✅ Done |
| **TOTAL** | **53** | **38** | **72%** | 🟡 |

### Overall Phase Progress
```
Fase 0: ████████████████████ 100% ✅ Done
Fase 1: ███████░░░░░░░░░░░░░ 29% 🟡 In Progress
Fase 2: ░░░░░░░░░░░░░░░░░░░░ 0% ⏳ Pending
Fase 3: ░░░░░░░░░░░░░░░░░░░░ 0% ⏳ Pending
Fase 4: ░░░░░░░░░░░░░░░░░░░░ 0% ⏳ Pending
```

---

## 🎯 Próximos Hitos

### Hito 1.1: Bug Fixes & Test Setup (Esta semana)
- **Deadline:** 2026-03-28
- **Tasks:**
  - Fix BUG-001 (Mux webhook)
  - Setup TEST-001 (frontend tests)
  - Fix BUG-006 (content tree)
  - Fix SEC-S9B (SQL REVOKE)

### Hito 1.2: Core Features Complete (2 semanas)
- **Deadline:** 2026-04-04
- **Tasks:**
  - Complete quiz results display
  - Fix remaining LOW priority bugs
  - 80% test coverage backend
  - 80% test coverage frontend

### Hito 1.3: Full Test Coverage (4 semanas)
- **Deadline:** 2026-04-18
- **Tasks:**
  - Complete all unit tests
  - Complete all integration tests
  - Setup E2E tests (Cypress)
  - Fix all ESLint violations
  - Fix all TypeScript strict issues

### Hito 1.4: Fase 1 Complete (8 semanas)
- **Deadline:** 2026-04-30
- **Tasks:**
  - All 13 agents delivering
  - All PRs merged to main
  - Zero critical/high bugs
  - Production-ready code

### Hito 2.1: Fase 2 Begin (Phase 2 agents)
- **Deadline:** 2026-05-01
- **Tasks:**
  - Deploy admin-dev agent
  - Deploy study-dev agent
  - Deploy docs-writer agent
  - Start gamification implementation

---

## 🎬 Dependencias y Caminos Críticos

### Flujo de Dependencias (Fase 1)
```
infra-plumbing (CRUD factory, DB, auth)
├── flashcards-backend ─→ flashcards-frontend ─→ flashcards-tester
├── quiz-backend ────────→ quiz-frontend ──────→ quiz-tester
├── summaries-backend ──→ summaries-frontend ──→ summaries-tester
└── infra-ai ─→ RAG + AI integration
    └── infra-ui ─→ Shared components used by all frontends
        └── quality-gate ─→ Code review + security audit (all agents)
```

### Camino Crítico (Critical Path)
```
1. infra-plumbing (CRUD, DB, auth) ───→ [DONE]
2. infra-ai (AI integration) ──────────→ [DONE] but BUG-001 CRITICAL
3. Backend modules (3×) all in parallel → [80%] waiting for tests
4. Frontend modules (3×) all in parallel → [75%] waiting for tests
5. Testing setup (TEST-001) ───────────→ [0%] BLOCKER
6. Complete feature parity ───────────→ [72%]
7. Achieve test coverage goals ────────→ [Pending]
8. Fix all bugs ──────────────────────→ [Pending]
9. Fase 1 complete ───────────────────→ [Est. 2026-04-30]
```

### 🔴 Bloqueadores Actuales
1. **BUG-001:** Mux webhook (blocks video uploads)
2. **TEST-001:** Frontend test setup (blocks all frontend agent testing)
3. **BUG-006:** Content tree filter (blocks summaries full feature)

---

## 📈 Estimaciones de Esfuerzo

### Fase 1 (Core Implementation)
- **Estimated Total:** 320 agent-hours
- **Completed:** ~180 agent-hours (56%)
- **Remaining:** ~140 agent-hours
- **Duration:** 8 weeks @ 5 agents = 40 hours/week
- **Completion Date:** 2026-04-30

### Fase 2 (Advanced Features)
- **Estimated Total:** 240 agent-hours
- **Duration:** 6 weeks @ 4 new agents
- **Planned Start:** 2026-05-01

### Fase 3 (Testing & QA)
- **Estimated Total:** 160 agent-hours
- **Duration:** 4 weeks @ 2 agents
- **Planned Start:** 2026-06-01

### Fase 4 (Deployment)
- **Estimated Total:** 80 agent-hours
- **Duration:** 2 weeks @ 2 agents
- **Planned Start:** 2026-06-15

**Total Project Estimate:** ~800 agent-hours (100 working days)

---

## 💰 Recursos & Presupuesto

### AI Model Usage (Estimated)
| Model | Monthly Cost | Usage |
|-------|--------------|-------|
| Gemini 2.5 Flash | $50 | Question generation |
| OpenAI Embeddings | $20 | Vector embeddings |
| Claude 3.5 | $100 | Reasoning + audit |
| **Total** | **$170** | Per month |

### Infrastructure (Estimated)
| Service | Monthly Cost | Purpose |
|---------|--------------|---------|
| Supabase | $100 | Database + auth |
| Vercel | $20 | Frontend hosting |
| Mux | $30 | Video processing |
| Stripe | 2.9% | Payment processing |
| **Total** | **$150+** | Per month (excl. Stripe) |

---

## 🔗 Referencias Rápidas

- **Source Docs:** `/sessions/nice-brave-hawking/mnt/AXON PROJECTO/axon-docs/`
- **Current State:** `/memory/CONTEXT.md`
- **Agent Details:** `/agents/AGENTS_REGISTRY.md`
- **Known Bugs:** `/ideas/TODO_IMPLEMENT.md`
- **Decisions:** `/memory/DECISIONS.md`

---

## 📝 Notas Importantes

1. **Fase 1 es crítica:** Define arquitectura y patrones para todo el proyecto
2. **Quality-gate auditor:** Revisa cada cambio antes de merge
3. **13 agents estrategia:** Permite paralelización máxima
4. **Testing is blocker:** TEST-001 debe resolverse para progreso
5. **Security first:** Audit round 2 planeada antes de producción

---

**Próxima actualización del roadmap:** 2026-03-28
**Estado del proyecto:** 🟡 EN PROGRESO (Fase 1 - 29% complete)
**Bloqueadores activos:** 1 CRÍTICO (BUG-001) + 1 ALTO (TEST-001)
