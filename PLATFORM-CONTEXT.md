# Axon v4.5 - Platform Context

> **Proposito:** Pega este archivo al inicio de cada sesion de Figma Make para dar contexto completo.
>
> **Ultima actualizacion:** 2026-03-14 (audit pass 12 — 74 frontend files read end-to-end)

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

> **⚠️ CORS sigue siendo wildcard `"*"`** (revertido para MVP). Ver BUG-004.
> **⚠️ supabase.ts tiene ANON_KEY hardcodeado** (no env var). Ver BUG-017.

## 3. Roles: owner(4), admin(3), professor(2), student(1)

Sets: `ALL_ROLES`, `MANAGEMENT_ROLES`, `CONTENT_WRITE_ROLES`

## 4. Jerarquia: Institution → Course → Semester → Section → Topic → Summary

Summary tiene: Chunks (1536d embeddings), Keywords (Flashcards, Quiz Questions, Connections, Subtopics, Prof Notes), Videos (Mux), Student Data.
Campos PDF: `pdf_source_url`, `pdf_page_start`, `pdf_page_end`.

## 5. Backend

### Rutas: planas con query params, ~200+ endpoints

**10 modulos split + 6 flat** (ver API-MAP.md para detalle completo)

### Key Infrastructure Files

`db.ts`, `crud-factory.ts`, `validate.ts`, `auth-helpers.ts`, `gemini.ts` (text gen + PDF extract), `openai-embeddings.ts` (1536d), `retrieval-strategies.ts`, `chunker.ts`, `semantic-chunker.ts`, `auto-ingest.ts`, `summary-hook.ts`, `xp-engine.ts`, `xp-hooks.ts`, `streak-engine.ts`, `ai-normalizers.ts`, `rate-limit.ts`, `timing-safe.ts`, `lib/bkt-v4.ts`, `lib/fsrs-v4.ts`, `lib/types.ts`

### Tests: **16 files**

## 6. Gamificacion

13 endpoints, 8 hooks (11 XP actions), 39 badges, daily cap 500 XP, 4 bonus types.
MVP constants: FREEZE_COST=100, MAX_FREEZES=3, REPAIR_COST=200.

> **⚠️ GamificationContext es un STUB** (BUG-013). useGamification.ts (React Query) es la impl real.

## 7. Embeddings

> **Modelo:** OpenAI `text-embedding-3-large` (1536d via Matryoshka)
> **Generacion:** Gemini 2.5 Flash
> **gemini.ts** `generateEmbedding()` = HARD ERROR (throws, prevents dimension mismatch)

## 8. DB: 50+ tables, 53 migrations, pgvector 1536d, pg_trgm, pg_cron

## 9. Seguridad

| Issue | Estado |
|---|---|
| CORS wildcard | NOT FIXED (BUG-004) |
| RLS | Parcialmente mitigado (BUG-003) |
| JWT | Mitigado por PostgREST (BUG-002) |
| Hardcoded anon key | Pendiente (BUG-017) |

## 10. Frontend (verified pass 12 — 74 files read)

### 10.0 File Counts (VERIFIED)

| Layer | Files | Read % |
|---|---|---|
| services/ (flat) | 32 | 100% |
| services/student-api/ | 6 | 100% |
| services/platform-api/ | 7 | 100% |
| services/ai-service/ | 8 | 100% |
| **services/ TOTAL** | **53** | **100%** |
| hooks/ (flat) | 35 | 29% |
| hooks/queries/ | 20 | 0% |
| context/ | 9 | 100% |
| types/ | 11 | 100% |
| lib/ | 25 | 28% |
| utils/ | 10 | 40% |
| routes/ | 10 | 0% |
| design-system/ | 14 | 0% |
| components/ | 20 subdirs + 2 root | 0% |

All paths relative to `src/app/`.

### 10.1 Types Layer (11 files — ALL READ)

- `content.ts` — UI nested types (Course > Semester > Section > Topic > Flashcard) + stub courses[]
- `platform.ts` — DB row types (Institution, MemberListItem, Plans, Subscriptions, AdminScope, AccessRules, Content Hierarchy)
- `student.ts` — Student domain (Profile, Preferences, Stats, CourseProgress, Reviews, DailyActivity, KeywordState)
- `gamification.ts` — XP (11 actions, XP_TABLE, 12 levels), Badges, StreakStatus, StudyQueueItem/Meta/Response
- `keyword-connections.ts` — KeywordConnection (canonical A<B order), CreateConnectionInput, SearchResultKeyword
- `keywords.ts` — MasteryLevel (red/yellow/green), KeywordData, masteryConfig
- `model3d.ts` — Model3D, Pin, Note, Layer, Part, PaginatedResponse, SectionWithModels
- `study-plan.ts` — StudyPlan + StudyPlanTask (extracted from AppContext)
- `legacy-stubs.ts` — Old data/ folder stubs (courses, lessons, keywords, studyContent, sectionImages)
- `flashcard-manager.ts` — Subtopic type for FlashcardsManager
- `keyword-notes.ts` — KwProfNote re-export from useKeywordPopupQueries

### 10.2 Critical Lib Files

- `api.ts` — Central apiCall() wrapper: dual-token, GET dedup, 15s timeout, { data } unwrap
- `supabase.ts` — Singleton client (HARDCODED URL+KEY, Symbol.for HMR protection)
- `xp-constants.ts` — Frontend mirror of backend XP_TABLE (11 actions), LEVEL_THRESHOLDS (12 levels), DAILY_CAP=500
- `sessionAnalytics.ts` — postSessionAnalytics() with READ-THEN-INCREMENT + module-level mutex
- `studyQueueApi.ts` — GET /study-queue, NeedScore = overdue(40%) + mastery(30%) + fragility(20%) + novelty(10%)
- `grade-mapper.ts` — SM-2(1-5) → FSRS(1-4) translation, different isCorrect thresholds per context (FSRS≥2, BKT≥3)
- `connection-types.ts` — 10 medical connection types (prerequisito, causa-efecto, mecanismo, dx-diferencial, tratamiento, manifestacion, regulacion, contraste, componente, asociacion)

### 10.3 Context Architecture (9 files — ALL READ)

- `AuthContext` (17KB) — Login/signup/logout, supabase.auth, /me + /institutions, role from membership, backward-compat aliases
- `StudentDataContext` (14.7KB) — v2: uses platformApi (not studentApi), profile from AuthContext, READ-THEN-INCREMENT via sessionAnalytics, legacy stubs warn
- `PlatformDataContext` (11KB) — 6 parallel API calls per institution change, CRUD mutation wrappers, per-slice refresh
- `ContentTreeContext` (8.9KB) — Full CRUD for courses/semesters/sections/topics, role-based canEdit
- `AppContext` (5KB) — UI state: currentCourse, currentTopic, sidebar, studyPlans, theme, quizAutoStart
- `GamificationContext` (3.2KB) — **STUB** (BUG-013). All methods are no-ops. useGamification.ts hook is the real impl.
- `StudyPlansContext` (2.8KB) — Thin wrapper around useStudyPlans hook + reschedule data injection
- `StudyTimeEstimatesContext` (1.3KB) — Thin wrapper around useStudyTimeEstimates hook
- `TopicMasteryContext` (1.2KB) — Thin wrapper around useTopicMastery hook

### 10.4 Dead Code + Tech Debt

- `aiFlashcardGenerator.ts` — wraps deprecated function returning [] (BUG-015)
- `apiConfig.ts` — duplicate fetch logic parallel to lib/api.ts (BUG-014)
- `studentNotesApi.ts` vs `studentSummariesApi.ts` — overlapping types (BUG-016)
- `legacy-stubs.ts` — TODO: migrate remaining views to ContentTreeContext
- Barrel re-exporters: `studentApi.ts`, `platformApi.ts`, `aiService.ts`, `quizApi.ts` (backward compat)

### 10.5 Missing API-MAP Endpoints (found in frontend, not in API-MAP.md)

- `GET /flashcard-mappings` — lightweight id→subtopic→keyword mapping
- `GET /flashcards-by-topic?topic_id=` — PERF C1 batch
- `GET /topic-progress?topic_id=` — unified progress
- `GET /topics-overview?topic_ids=` — batch section-level
- `GET /subtopics-batch?keyword_ids=` — batch subtopic fetch
- `PUT /study-plan-tasks/batch` — batch task update

## 11. Tech Stack

**Frontend:** React 18, TypeScript, Vite 6, Tailwind v4, React Router v7, React Query v5, shadcn/ui, Lucide, Motion, TipTap, Three.js, Mux Player, @floating-ui/react, Sonner. Vercel.

**Backend:** Hono + Deno, PostgreSQL + pgvector, Gemini 2.5 Flash + OpenAI text-embedding-3-large (1536d), Stripe, Mux, WhatsApp Cloud API. GitHub Actions CI/CD.
