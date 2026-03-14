# Axon v4.5 - Platform Context

> **Proposito:** Pega este archivo al inicio de cada sesion de Figma Make para dar contexto completo.
>
> **Ultima actualizacion:** 2026-03-14 (audit pass 12 FINAL — 180 files read, 8/10 layers 100%)

---

## 1. Arquitectura General

```
Frontend (React 18 + Vite + Tailwind v4) → Vercel
  └─ apiCall() en lib/api.ts → Backend (Hono/Deno) → Supabase Edge Functions
       └─ PostgreSQL + pgvector | Gemini API | OpenAI API | Mux | Stripe
```

## 2. Autenticacion (Doble Token)

```
Authorization: Bearer <SUPABASE_ANON_KEY>   ← Proyecto
X-Access-Token: <USER_JWT>                  ← Usuario
```

JWT decodificado localmente. Verificacion criptografica via PostgREST en primera DB query.
Rol NO esta en JWT — viene de `GET /institutions`.

AuthContext flow: supabase.signIn → setAccessToken(jwt) → GET /me → GET /institutions → auto-select if 1 institution → route by role.

> **⚠️ CORS sigue siendo wildcard `"*"`** (BUG-004).
> **⚠️ ANON_KEY hardcodeado en 3 archivos** (supabase.ts, config.ts, lib/api.ts) (BUG-017).

## 3. Roles: owner(4), admin(3), professor(2), student(1)

Sets: `ALL_ROLES`, `MANAGEMENT_ROLES`, `CONTENT_WRITE_ROLES`

> **⚠️ Admin/Owner/Professor routes son ALL placeholder pages.** Solo student tiene componentes reales (22+ routes).

## 4. Jerarquia: Institution → Course → Semester → Section → Topic → Summary

Summary tiene: Chunks (1536d embeddings), Keywords (Flashcards, Quiz Questions, Connections, Subtopics, Prof Notes), Videos (Mux), Student Data.

## 5. Backend

**10 modulos split + 6 flat** (ver API-MAP.md para detalle completo)

## 6. Gamificacion

13 endpoints, 11 XP actions, 39 badges, daily cap 500 XP, 12 levels.
> **⚠️ GamificationContext es STUB** (BUG-013). useGamification.ts (React Query) es la impl real.

## 7. Embeddings: OpenAI text-embedding-3-large (1536d), Gemini 2.5 Flash

## 8. DB: 50+ tables, 53 migrations, pgvector 1536d, pg_trgm, pg_cron

## 9. Seguridad

| Issue | Estado | Bug |
|---|---|---|
| CORS wildcard | NOT FIXED | BUG-004 |
| RLS deshabilitado | Parcialmente mitigado | BUG-003 |
| JWT sin crypto local | Mitigado por PostgREST | BUG-002 |
| Hardcoded credentials | 3 archivos | BUG-017 |
| Demo student fallback | useSummaryPersistence | BUG-018 |

## 10. Frontend (VERIFIED — 180 files read, 8/10 layers 100%)

### 10.0 File Counts

| Layer | Files | Status |
|---|---|---|
| services/ | 53 | **100%** |
| context/ | 9 | **100%** |
| types/ | 11 | **100%** |
| hooks/ (flat + queries/) | 56 | **100%** |
| lib/ | 25 | **100%** |
| utils/ | 10 | **100%** |
| routes/ | 10 | **100%** |
| design-system/ | 14 | 0% (UI-only) |
| components/ | ~100+ | 0% (UI-only) |

### 10.1 Types Layer (11 files)

- `content.ts` — UI nested types (Course > Semester > Section > Topic > Flashcard)
- `platform.ts` — DB row types (Institution, Members, Plans, Subscriptions)
- `student.ts` — Student domain (Profile, Stats, CourseProgress, KeywordState)
- `gamification.ts` — XP (11 actions), Badges, StreakStatus, StudyQueue
- `keyword-connections.ts` — ConnectionTypes, canonical A<B order
- `keywords.ts` — MasteryLevel, KeywordData
- `model3d.ts` — Model3D, Pin, Note, Layer, Part
- `study-plan.ts` — StudyPlan + StudyPlanTask
- `legacy-stubs.ts`, `flashcard-manager.ts`, `keyword-notes.ts`

### 10.2 Critical Lib Files (25 total)

- `api.ts` — Central apiCall(): dual-token, GET dedup, 15s timeout
- `supabase.ts` — Singleton client (hardcoded URL+KEY)
- `config.ts` — 3rd copy of hardcoded credentials
- `xp-constants.ts` — Mirror of backend XP_TABLE, LEVEL_THRESHOLDS, DAILY_CAP=500
- `sessionAnalytics.ts` — READ-THEN-INCREMENT with module-level mutex
- `studyQueueApi.ts` — NeedScore = overdue(40%) + mastery(30%) + fragility(20%) + novelty(10%)
- `grade-mapper.ts` — SM-2(1-5) → FSRS(1-4), isCorrect: FSRS≥2, BKT≥3
- `connection-types.ts` — 10 medical connection types
- `model3d-api.ts` — XHR upload with progress tracking
- `muxApi.ts` — 5 Mux video endpoints
- `palette.ts` — SSoT for Axon Medical Academy colors
- `queryClient.ts` — React Query defaults: 5min stale, 10min gc, no refetch on focus
- `mastery-helpers.ts` — BKT p_know → color (green≥0.8, yellow≥0.5, red<0.5)
- `flashcard-export.ts` — CSV/JSON export
- `flashcard-utils.ts` — CardType detection, image extraction
- `summary-content-helpers.tsx` — HTML enrichment, pagination, plain text rendering
- `withBoundary.tsx` — ErrorBoundary HOC for lazy routes
- `lazyRetry.ts` (utils) — Stale chunk auto-reload

### 10.3 Context Architecture (9 files)

- `AuthContext` (17KB) — Login/signup/logout, role from /institutions
- `StudentDataContext` (14.7KB) — v2: uses platformApi, profile from AuthContext
- `PlatformDataContext` (11KB) — 6 parallel API calls per institution
- `ContentTreeContext` (8.9KB) — Full CRUD for content hierarchy
- `AppContext` (5KB) — UI state, study plans, theme
- `GamificationContext` (3.2KB) — **STUB** (BUG-013)
- `StudyPlansContext`, `StudyTimeEstimatesContext`, `TopicMasteryContext` — Thin wrappers

### 10.4 React Query Layer (21 query hooks)

- `queryKeys.ts` — 25+ centralized key factories
- `staleTimes.ts` — 6 constants (professor 10min, student 2min, connections 5min, search 30s)
- Shared cache patterns: professor+student share same queryKey, use `select` for role-specific views
- Optimistic updates: annotations, kw-notes, connections
- Cache seeding: batch subtopics → individual kwSubtopics entries

### 10.5 Routes Architecture (10 files)

- **Student** (22+ real routes): per-agent ownership pattern (6 agents)
  - Agent 1: quiz, Agent 2: summary, Agent 3: flashcard, Agent 5: study/dashboard, Agent 6: 3D
  - Includes gamification sub-pages (badges, leaderboard, xp-history)
- **Professor** (8 routes): ALL PlaceholderPage (no real functionality)
- **Owner** (8 routes): ALL PlaceholderPage
- **Admin** (6 routes): ALL PlaceholderPage
- All routes use `lazyRetry()` for stale chunk handling + `withBoundary()` for error recovery

### 10.6 Dead Code + Tech Debt

- `aiFlashcardGenerator.ts` — wraps deprecated fn returning [] (BUG-015)
- `apiConfig.ts` — duplicate fetch logic (BUG-014)
- `config.ts` — 3rd copy of hardcoded credentials (BUG-017)
- `studentNotesApi.ts` vs `studentSummariesApi.ts` — overlapping types (BUG-016)
- `useSummaryPersistence.ts` — 'demo-student-001' fallback (BUG-018)
- `hooks/useContentTree.ts` vs `context/ContentTreeContext.tsx` — dual impl (BUG-019)
- Barrel re-exporters: `studentApi.ts`, `platformApi.ts`, `aiService.ts`, `quizApi.ts`

### 10.7 Missing API-MAP Endpoints

- `GET /flashcard-mappings`, `GET /flashcards-by-topic`, `GET /topic-progress`
- `GET /topics-overview`, `GET /subtopics-batch`, `PUT /study-plan-tasks/batch`

## 11. Tech Stack

**Frontend:** React 18, TypeScript, Vite 6, Tailwind v4, React Router v7, React Query v5, shadcn/ui, Lucide, Motion, TipTap, Three.js, Mux Player, @floating-ui/react, Sonner, date-fns. Vercel.

**Backend:** Hono + Deno, PostgreSQL + pgvector, Gemini 2.5 Flash + OpenAI text-embedding-3-large (1536d), Stripe, Mux, WhatsApp Cloud API. GitHub Actions CI/CD.
