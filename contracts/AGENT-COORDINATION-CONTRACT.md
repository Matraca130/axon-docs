# AXON v4.4 — Agent Coordination Contract

> **Date:** 2026-02-28  
> **Based on:** FRONTEND-DIAGNOSTIC.md, BACKEND-DIAGNOSTIC.md, ARCHITECTURE-PRACTICES.md  
> **Purpose:** Define boundaries for 6 parallel agents working on the Axon frontend.

---

## Golden Rules (ALL agents MUST follow)

| ID | Rule | Severity |
|---|---|---|
| GR-01 | NEVER touch protected files (App.tsx, routes.ts, AuthContext, RequireAuth, *Layout.tsx, /supabase/) | CRITICAL |
| GR-02 | Flat API routes ONLY: `GET /summaries?topic_id=xxx`, NEVER `/topics/:id/summaries` | CRITICAL |
| GR-03 | Use `apiClient` exclusively — no raw `fetch()`, no duplicate wrappers | CRITICAL |
| GR-04 | Types from `types/platform.ts` (DB types) and `types/ui.ts` (UI types). No inline interfaces in services | HIGH |
| GR-05 | No `console.log` in production — use `logger.debug()` from `lib/logger.ts` | HIGH |
| GR-06 | Component size limit: 500 lines. Split using directory pattern | MEDIUM |
| GR-07 | `React.memo` for list items. `useCallback` for list callbacks | MEDIUM |
| GR-08 | Every page uses `lazy()` in route definitions | HIGH |
| GR-09 | Response format: CRUD factory `{ data: { items, total, limit, offset } }` vs custom `{ data: [...] }` | CRITICAL |
| GR-10 | Navigation state in URL params, not Context | MEDIUM |

---

## Phase 0 — Foundation (BEFORE any agent starts)

| ID | Task | Effort | Diagnostic |
|---|---|---|---|
| P0-01 | Create `api-client.ts` — single `request<T>()` replacing `lib/api.ts` + `services/apiConfig.ts` | 1 hr | F-002, F-003 |
| P0-02 | Create `lib/config.ts` — env vars for ANON_KEY + API_BASE | 15 min | F-003 |
| P0-03 | Create `lib/logger.ts` — debug/info/warn/error with dev-only logging | 15 min | F-008 |
| P0-04 | Create `components/shared/ErrorBoundary.tsx` | 30 min | F-006 |
| P0-05 | Consolidate `context/` + `contexts/` into single directory | 30 min | F-001 |
| P0-06 | Consolidate Supabase clients — keep one `lib/supabase.ts` | 15 min | F-012 |
| P0-07 | Delete dead files: 3 .tsx docs (62KB), data/ (95KB), .patch file | 5 min | F-005, F-004 |
| P0-08 | Unify `types/platform.ts` — merge from content.ts, legacy-stubs.ts, platformApi.ts inline | 1 hr | F-015 |
| P0-09 | Create shared `ContentCascadeSelector` (used by Agent 1 + 3) | 1.5 hrs | — |

---

## Execution Order

```
Phase 0 ────────► ALL agents blocked until complete
    │
    ├──► Phase 1A: Agent 2 (Content Core) ──► creates useContentTree() + content.ts
    │         │
    │         ├──► Phase 2: Agent 1 (Quiz)      ── needs Agent 2 outputs
    │         ├──► Phase 2: Agent 3 (Flashcard)  ── needs Agent 2 outputs
    │         └──► Phase 2: Agent 5 (Dashboard)  ── needs Agent 2 + 3 outputs
    │
    ├──► Phase 1B: Agent 4 (Admin/Owner) ──► independent, starts after Phase 0
    └──► Phase 1B: Agent 6 (3D Viewer)   ──► independent, starts after Phase 0

Phase 3: Integration testing (all agents)
```

---

## Agent 1: Quiz Master

**Scope:** Quiz creation (professor), quiz taking (student), quiz results, quiz question CRUD.

### Files Owned
- `pages/professor/ProfessorQuizzesPage.tsx`
- `pages/student/QuizPage.tsx`
- `components/content/QuizTaker.tsx` (→ split to <10KB)
- `components/content/QuizResults.tsx` (→ split)
- `services/quizApi.ts`
- `hooks/useQuizEngine.ts`

### Steps
1. **A1-S1** Create `quizApi.ts` (low risk, 30 min) — fixes F-002, F-009
2. **A1-S2** Add quiz types to `platform.ts` (medium, 20 min) — fixes F-007, F-015
3. **A1-S3** Split QuizTaker.tsx 33KB → <10KB each (medium, 2 hrs) — fixes F-020, F-021
4. **A1-S4** Split QuizResults.tsx 17KB (low, 1 hr) — fixes F-020
5. **A1-S5** Professor cascade selector (medium, 1.5 hrs)
6. **A1-S6** Replace mock data with API (high, 2 hrs) — fixes F-004, F-019
7. **A1-S7** ErrorBoundary + lazy loading (low, 15 min) — fixes F-006, F-010

### Coordination
- SHARES ContentCascadeSelector with Agent 3
- DEPENDS ON Agent 2 for useContentTree()
- SHARES ensureGeneralKeyword() with Agent 3 (in lib/api.ts)

---

## Agent 2: Content Viewer

**Scope:** Summary viewing/editing, video player, content tree, chunks, text highlighting.

### Files Owned
- `pages/student/SummaryPage.tsx`
- `pages/professor/ProfessorSummariesPage.tsx`
- `components/content/TextHighlighter.tsx` (→ split)
- `components/content/VideoPlayer.tsx` (→ split)
- `context/ContentTreeContext.tsx`
- `services/content.ts`, `services/summariesApi.ts`
- `hooks/useContentTree.ts`, `hooks/useSummaryViewer.ts`

### Steps
1. **A2-S1** Create content.ts + summariesApi.ts (low, 45 min)
2. **A2-S2** Refactor ContentTreeContext with proper types (high, 2 hrs)
3. **A2-S3** Split VideoPlayer.tsx 25KB (medium, 1.5 hrs)
4. **A2-S4** Split TextHighlighter.tsx 16KB (medium, 1 hr)
5. **A2-S5** Replace mock data with API (high, 2 hrs)
6. **A2-S6** Video upload for professor (medium, 2 hrs)
7. **A2-S7** ErrorBoundary + lazy loading (low, 15 min)

### Coordination
- **PROVIDES** useContentTree() that Agents 1, 3, 5 depend on — MUST complete first
- **PROVIDES** content.ts service used by Agents 1, 3

---

## Agent 3: Flashcard Engine

**Scope:** Flashcard CRUD (professor), review/study (student), keywords, spaced repetition, mastery.

### Files Owned
- `pages/professor/ProfessorFlashcardsPage.tsx`
- `pages/student/FlashcardPage.tsx`
- `components/content/FlashcardReviewer.tsx` (31KB → split)
- `components/content/KeywordPopup.tsx` (37KB → split — LARGEST component)
- `services/flashcardApi.ts`
- `hooks/useFlashcardEngine.ts`
- `lib/bkt-engine.ts`, `lib/fsrs-engine.ts`, `lib/mastery-helpers.ts`

### Steps
1. **A3-S1** Create flashcardApi.ts (low, 45 min)
2. **A3-S2** Add flashcard/keyword types to platform.ts (medium, 20 min)
3. **A3-S3** Split KeywordPopup.tsx 37KB (high, 3 hrs)
4. **A3-S4** Split FlashcardReviewer.tsx 31KB (high, 2.5 hrs)
5. **A3-S5** React.memo on FlashcardCard + KeywordBadges (low, 30 min)
6. **A3-S6** Evaluate BKT/FSRS duplication (medium, 1 hr evaluation)
7. **A3-S7** Professor cascade + ensureGeneralKeyword (medium, 1 hr)

### Coordination
- SHARES ContentCascadeSelector with Agent 1
- DEPENDS ON Agent 2 for useContentTree()
- Agent 5 displays mastery data — coordinate types

---

## Agent 4: Platform Admin

**Scope:** Institution management, memberships, plans, student admin, settings.

### Files Owned
- `pages/admin/*.tsx`, `pages/owner/*.tsx`
- `components/admin/*.tsx`, `components/owner/*.tsx`
- `services/institutionsApi.ts`, `services/membersApi.ts`, `services/plansApi.ts`, `services/adminApi.ts`
- `routes/admin-routes.ts`, `routes/owner-routes.ts`

### Steps
1. **A4-S1** Create admin/owner service modules (low, 1 hr)
2. **A4-S2** Fix getAdminStudents() fetch bypass (medium, 30 min)
3. **A4-S3** Migrate owner-routes.ts to lazy() (low, 15 min) — fixes F-010
4. **A4-S4** Add admin/owner types to platform.ts (medium, 30 min)
5. **A4-S5** Build owner dashboard page (medium, 3 hrs)
6. **A4-S6** Build membership management page (medium, 3 hrs)
7. **A4-S7** Build plan management page (medium, 2 hrs)

### Coordination
- MOST ISOLATED — minimal dependencies on content agents
- Can start immediately after Phase 0

---

## Agent 5: Dashboard & Study

**Scope:** Student dashboard, study plans/sessions, daily activity, progress, study queue.

### Files Owned
- `pages/student/DashboardPage.tsx`, `pages/student/StudyPlanPage.tsx`, `pages/student/ProgressPage.tsx`
- `components/dashboard/*.tsx`
- `services/studyApi.ts`, `services/studySessionApi.ts`, `services/studyQueueApi.ts`
- `context/StudentDataContext.tsx` (refactor)

### Steps
1. **A5-S1** Create study service modules (medium, 1 hr) — INCLUDES missing createStudySession/submitReview
2. **A5-S2** Refactor StudentDataContext — lazy loading (high, 2 hrs) — fixes F-030
3. **A5-S3** Remove studyPlans/currentCourse/currentTopic from AppContext (high, 1.5 hrs) — fixes F-017
4. **A5-S4** Build real dashboard with API data (medium, 3 hrs)
5. **A5-S5** Implement study session flow (high, 3 hrs)
6. **A5-S6** Study queue integration (medium, 2 hrs)

### Coordination
- DEPENDS ON Agent 3 for mastery display types
- Study session hook is shared with Agent 1 (quiz) and Agent 3 (flashcards)
- StudentDataContext refactor affects ALL student pages

---

## Agent 6: 3D Viewer

**Scope:** 3D model viewer, pins/notes, model upload, Three.js integration.

### Files Owned
- `pages/student/Model3DPage.tsx`, `pages/professor/ProfessorModelsPage.tsx`
- `components/viewer3d/*.tsx`
- `services/models3dApi.ts`
- `hooks/useModel3D.ts`

### Steps
1. **A6-S1** Create models3dApi.ts (low, 30 min)
2. **A6-S2** Add 3D types to platform.ts (low, 15 min)
3. **A6-S3** Ensure Three.js stays in separate chunk (low, 10 min)
4. **A6-S4** Build 3D viewer with real data (medium, 4 hrs)
5. **A6-S5** Model upload for professor (medium, 2 hrs)

### Coordination
- MOST ISOLATED agent — minimal conflict risk
- Shares storage endpoints pattern with Agent 2 (video upload)
- Can start immediately after Phase 0

---

## Shared Dependencies Map

| File | Owner | Consumers | Rule |
|---|---|---|---|
| `services/api-client.ts` | Phase 0 | All | Must exist first. Agents may NOT modify |
| `types/platform.ts` | Phase 0 | All | Add via PR. Never remove. Never inline |
| `lib/logger.ts` | Phase 0 | All | Use, never modify |
| `context/AuthContext.tsx` | PROTECTED | All | useAuth() read-only for all |
| `context/ContentTreeContext.tsx` | Agent 2 | 1, 3, 5 | Agent 2 creates, others consume |
| `services/content.ts` | Agent 2 | 1, 3, 5 | Content hierarchy API calls |
| `components/shared/ErrorBoundary.tsx` | Phase 0 | All | Wrap features, don't modify |
| `lib/supabase.ts` | Phase 0 | 1, 4 | Single instance. Auth-only agents |

---

## Diagnostic Coverage

This contract addresses the following findings from FRONTEND-DIAGNOSTIC.md:

| Finding | Agent | Step |
|---|---|---|
| F-001 (context/ vs contexts/) | Phase 0 | P0-05 |
| F-002 (Triple API layer) | Phase 0 + All | P0-01, A*-S1 |
| F-003 (ANON_KEY hardcoded) | Phase 0 | P0-02 |
| F-004 (95KB mock data) | 1, 2, 5 | A*-S5/S6 |
| F-005 (62KB .tsx docs) | Phase 0 | P0-07 |
| F-006 (No ErrorBoundary) | Phase 0 + All | P0-04 |
| F-007 (any masivo) | All | A*-S2 |
| F-008 (console.log) | Phase 0 | P0-03 |
| F-009 (platformApi.ts 26KB) | All | A*-S1 |
| F-010 (owner lazy) | 4 | A4-S3 |
| F-012 (doble supabase) | Phase 0 | P0-06 |
| F-015 (types en 4 lugares) | Phase 0 | P0-08 |
| F-017 (AppContext nav state) | 5 | A5-S3 |
| F-020 (componentes gigantes) | 1, 2, 3 | A*-S3/S4 |
| F-021 (sin React.memo) | 3 | A3-S5 |
| F-023/F-031 (BKT/FSRS dup) | 3 | A3-S6 |
| F-030 (eager StudentData) | 5 | A5-S2 |
