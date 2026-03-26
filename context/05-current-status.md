# 05 -- Current Status

> **Updated: 2026-03-14 (audit pass 15 — ~630 files mapped across 3 repos).**

## Build Status

| Repo | Status | Notes |
|---|---|---|
| Frontend (Vercel) | Running | v4.5 — responsive, gamification, AI reports, PDF ingest |
| Backend (Supabase EF) | Running | v4.4 (index.ts) / v4.5 (docs) — ~103 files, 17 route modules. **Note:** Backend index.ts reports v4.4; documentation targets v4.5 specification. |
| Supabase | Running | 50+ tables, **53 migrations** |

## Still Pending

| Item | Priority |
|---|---|
| **CORS wildcard (BUG-004)** | **HIGH** |
| **Professor+Owner routes disconnected (BUG-030)** | **HIGH** — Pages ready, just need router update |
| RLS policies (BUG-003) | HIGH |
| `resolution_tier` (BUG-001) | HIGH |
| JWT crypto (BUG-002) | MEDIUM — PostgREST mitigates DB routes; non-DB routes at risk |
| GamificationContext STUB (BUG-021) | MEDIUM |
| Hardcoded ANON_KEY x3 (BUG-025) | MEDIUM |
| Demo student fallback (BUG-026) | MEDIUM |
| architecture.ts 30KB stale (BUG-028) | MEDIUM |
| kv_store_* cleanup (BUG-011) | LOW |
| 7 LOW tech debt items (BUG-020..024, 027, 029) | LOW |

## Backend: ~93 files LISTED + 3 READ

### Route Modules (11 split + 6 flat = 17 mounted in index.ts)

| Module | Files | Key File Size |
|---|---|---|
| ai/ | 14 | generate-smart 30KB, chat 18KB, pre-generate 16KB |
| content/ | 10 | keyword-connections 10KB |
| whatsapp/ | 10 | tools 21KB, handler 16KB |
| telegram/ | 10 | tools, handler, webhook, async-queue |
| gamification/ | 6 | badges 11KB, helpers 10KB |
| study/ | 6 | batch-review 22KB, progress 16KB |
| plans/ | 5 | access, ai-generations, crud, diagnostics |
| mux/ | 5 | api 9KB, webhook |
| members/ | 4 | memberships 11KB, institutions 8KB |
| search/ | 4 | trash-restore 5KB |
| settings/ | 2 | algorithm-config 6KB |
| **Flat** | | |
| routes-billing.ts | — | 16KB |
| routes-study-queue.ts | — | 16KB |
| routes-models.ts | — | 10KB |
| routes-storage.ts | — | 8KB |
| routes-auth.ts | — | 6KB |
| routes-student.ts | — | 5KB |

### Core Files (READ: db.ts, auth-helpers.ts, index.ts)

- **crud-factory.ts** (20KB): Generic CRUD builder for Hono routes
- **db.ts** (7.6KB READ): `PREFIX="/server"`, admin/user clients, `authenticate()`, JWT decode (no crypto — BUG-002)
- **auth-helpers.ts** (11KB READ): Fail-closed role authorization, `requireInstitutionRole()`, `canAssignRole()`, role hierarchy
- **xp-hooks.ts** (16KB): XP triggers for study actions
- **retrieval-strategies.ts** (13KB): RAG retrieval
- **lib/**: fsrs-v4.ts (8.7KB), bkt-v4.ts (4KB), types.ts (5.5KB)

### Security Model (from db.ts + auth-helpers.ts READ)

- JWT decoded locally (~0.1ms) — crypto deferred to PostgREST on DB queries
- **WARNING in db.ts**: Non-DB routes (AI, Stripe) may NOT validate JWT cryptographically
- auth-helpers.ts: Fail-closed, institution-scoped, `ROLE_HIERARCHY` enforced
- Rate limiting: 120 req/min/user (middleware in index.ts)

## Frontend: 188 logic READ + ~350 components LISTED

### Logic (ALL READ)

| Layer | Files |
|---|---|
| services/ | 53 |
| hooks/ (flat + queries) | 56 |
| lib/ | 25 |
| design-system/ | 14 |
| types/ | 11 |
| routes/ | 10 |
| utils/ | 10 |
| context/ | 9 |
| **TOTAL** | **188** |

### Components (~350 LISTED, incl. roles/pages/)

| Subdir | Files |
|---|---|
| student/ (+ sub) | 57 |
| content/ (+ flashcard/) | 48 |
| ui/ | 44 |
| professor/ | 38 |
| shared/ | 25 |
| layout/ (+ topic-sidebar/) | 18 |
| roles/pages/professor/ | 16 |
| viewer3d/ | 14 |
| gamification/ (+ pages/) | 14 |
| dashboard/ | 11 |
| design-kit/ | 9 |
| roles/pages/owner/ | 8 |
| auth/ | 6 |
| schedule/ | 6 |
| roles/pages/admin/ | 6 |
| tiptap/ (+ extensions/) | 5 |
| roles/ (flat) | 4 |
| student-panel/ | 4 |
| welcome/ | 3 |
| ai/ | 2 |
| video/ | 2 |
| summary/ | 2 |
| flat | 2 |
| **TOTAL** | **~350** |

### BUG-030: Routes vs Components Mismatch

**professor-routes.ts** uses `lazyPlaceholder()` for all 8 routes. BUT:
- `roles/pages/professor/` has **16 real page files**: ProfessorCurriculumPage (12KB), ProfessorFlashcardsPage (17KB), ProfessorQuizzesPage (12KB), SummaryDetailView (39KB!), TopicDetailPanel (18KB), etc.
- `components/professor/` has **38 real CMS components** + 7 hooks
- These are BUILT but NOT WIRED to the router.

**owner-routes.ts** also uses `lazyPlaceholder()`. BUT:
- `roles/pages/owner/` has **8 real page files**: OwnerMembersPage (**50KB** — largest in app!), OwnerPlansPage (30KB), OwnerDashboardPage (23KB), OwnerSubscriptionsPage (15KB), OwnerAccessRulesPage (15KB), OwnerReportsPage (13KB)
- These are BUILT but NOT WIRED.

**admin-routes.ts** uses `lazyPlaceholder()`. Pages in `roles/pages/admin/` are small (1-1.6KB) wrappers.

### Mega-files (F-020 — UPDATED)

| File | Size | Location |
|---|---|---|
| FlashcardsManager.tsx | **61KB** | content/ |
| StudyOrganizerWizard.tsx | **51KB** | content/ |
| **OwnerMembersPage.tsx** | **50KB** | roles/pages/owner/ |
| AxonAIAssistant.tsx | **39KB** | ai/ |
| **SummaryDetailView.tsx** | **39KB** | roles/pages/professor/ |
| ModelViewer3D.tsx | **38KB** | content/ |
| QuizSelection.tsx | **35KB** | content/ |
| **OwnerPlansPage.tsx** | **30KB** | roles/pages/owner/ |
| FlashcardBulkImport.tsx | **30KB** | professor/ |
| TipTapEditor.tsx | **29KB** | tiptap/ |

**14 files >25KB** (was 11 before discovering roles/pages/). Top priority for splitting.

### Colocated Hooks

- student/: 7, professor/: 7, dashboard/: 1, roles/pages/professor/: 1 = **16 total**

## FRONTEND-DIAGNOSTIC F-xxx

| ID | Status |
|---|---|
| F-001 | **FIXED** |
| F-002 | PARTIALLY FIXED (BUG-022) |
| F-003 | **NOT FIXED** (BUG-025) |
| F-005 | PARTIALLY FIXED (BUG-028) |
| F-006 | **FIXED** |
| F-008 | **FIXED** |
| F-009 | **FIXED** |
| F-010 | **FIXED** |
| F-014 | **FIXED** |
| F-020 | **WORSE** — 14 files >25KB |
