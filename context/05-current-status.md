# 05 -- Current Status

> **Updated: 2026-03-17 (audit pass 17 — full recount: 122 backend TS files, 586 frontend files, 62 migrations).**

## Build Status

| Repo | Status | Notes |
|---|---|---|
| Frontend (Vercel) | Running | v4.5 — 586 files, voice calls, admin messaging, StudyHub, Vitest |
| Backend (Supabase EF) | Running | v4.4 (index.ts) / v4.5 (docs) — 122 TS files, 11 route dirs, Claude AI, Telegram+WhatsApp bots, Realtime voice |
| Supabase | Running | 50+ tables, **62 migrations**, pgvector 1536d |

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

## Recent Changes (2026-03-14–17)

### Backend
- **AI migrated from Gemini to Claude** for all text generation (chat, generate, reports, re-ranking)
- **claude-ai.ts** (9KB, 323 lines): 3 model tiers (opus-4, sonnet-4, haiku-4.5)
- **Voice calls:** `POST /ai/realtime-session` (335 lines) — ephemeral OpenAI Realtime token + student context + tool executors
- **Telegram bot:** 9 files, 2,816 lines — Claude agentic loop (5 iter), 11 tools, slash commands, inline flashcard review, voice transcription
- **WhatsApp enhanced:** async-queue.ts (408 lines), pg_cron job processor every minute
- **Messaging admin:** `messaging-admin.ts` — GET/PUT/POST per channel
- **Gamification fixes:** xp_transactions.source_id→TEXT, badge criteria column
- **DB:** 62 migrations total (was 53). New tables: telegram_links, telegram_sessions, telegram_message_log, messaging_admin_settings, whatsapp_links, whatsapp_sessions, whatsapp_message_log, whatsapp_jobs

### Frontend
- **Voice call mode** in AxonAIAssistant (40KB, 901 lines) — 5th mode "voice" with OpenAI Realtime WebSocket
- **VoiceCallPanel.tsx** (8KB) + **useRealtimeVoice.ts** (12KB) + **as-realtime.ts** (8KB)
- **Admin Messaging Integrations page** (20KB, 521 lines) — Telegram & WhatsApp config
- **AdminSettingsPage.tsx** — converted from placeholder to settings hub
- **pa-messaging.ts** — new API wrapper for messaging settings
- **StudyHub merge:** StudyHubSectionCards.tsx (26KB), useStudyHubProgress.ts hook
- **Flashcard v4.5.1:** responsive, Spanish locale, keyboard nav, adaptive AI
- **Voice bug fix:** interval+timeout memory leak in WebSocket connect wait
- **Vitest test infrastructure:** setup.ts, contract tests, GitHub CI workflow

## Backend: 122 TypeScript files (11 route dirs + 6 flat + 25 core + 3 lib)

### Route Modules (11 split + 6 flat)

| Module | Files | Lines | Key Files |
|---|---|---|---|
| ai/ | 15 | 4,175 | realtime-session (335), generate-smart 30KB, chat 18KB |
| telegram/ | 9 | 2,816 | handler (462), tools (796), webhook (387), review-flow (305) |
| whatsapp/ | 10 | 3,068 | tools 21KB, handler 16KB, async-queue (408) |
| content/ | 11 | 1,791 | keyword-connections 10KB |
| gamification/ | 6 | 1,460 | badges (445), streak (287), helpers (347) |
| study/ | 6 | 1,668 | batch-review 22KB, progress 16KB |
| plans/ | 5 | 304 | access, ai-generations, crud, diagnostics |
| mux/ | 5 | 550 | api 9KB, webhook |
| members/ | 4 | 609 | memberships 11KB, institutions 8KB |
| search/ | 4 | 331 | trash-restore 5KB |
| settings/ | 3 | 538 | algorithm-config 6KB, messaging-admin (303) |
| **Flat** | | | |
| routes-billing.ts | — | — | 16KB |
| routes-study-queue.ts | — | — | 16KB |
| routes-models.ts | — | — | 10KB |
| routes-storage.ts | — | — | 8KB |
| routes-auth.ts | — | — | 6KB |
| routes-student.ts | — | — | 5KB |

### Core Files

| File | Size | Purpose |
|---|---|---|
| crud-factory.ts | 20KB | Generic CRUD builder for Hono routes |
| xp-hooks.ts | 17KB | XP triggers for study actions |
| retrieval-strategies.ts | 14KB | RAG: multi-query, HyDE, re-ranking (Claude) |
| auth-helpers.ts | 12KB | Fail-closed role auth, institution-scoped |
| streak-engine.ts | 11KB | Streak tracking + freeze mechanics |
| claude-ai.ts | 9KB | Anthropic API client (3 model tiers) |
| gemini.ts | 8.8KB | PDF extraction + voice transcription only |
| db.ts | 7.6KB | Supabase clients, JWT decode (BUG-002) |
| xp-engine.ts | 7.4KB | XP calculation logic |
| rate-limit.ts | 5.9KB | 120 req/min + AI limits |
| openai-embeddings.ts | 4.3KB | text-embedding-3-large (1536d) |
| **lib/** | | fsrs-v4 (8.7KB), bkt-v4 (4KB), types (5.5KB) |

### Security Model

- JWT decoded locally (~0.1ms) — crypto deferred to PostgREST on DB queries
- **WARNING in db.ts**: Non-DB routes (AI, Stripe) may NOT validate JWT cryptographically
- auth-helpers.ts: Fail-closed, institution-scoped, `ROLE_HIERARCHY` enforced
- Rate limiting: 120 req/min/user + 20 AI POST/hr + 10 pre-generate/hr
- RAG functions: SECURITY DEFINER + auth.uid() checks + search_path protection
- Telegram webhook: secret token verification (no JWT)
- WhatsApp phones: SHA-256 hashed with salt

## Frontend: 586 TypeScript/TSX files (346 components + 42 hooks + 35 services + 9 contexts)

### Services Architecture

| Directory | Files | Purpose |
|---|---|---|
| ai-service/ | 9 | as-chat, as-generate, as-generate-smart, as-realtime (NEW), as-ingest, as-reports, as-analytics, as-legacy, as-types |
| platform-api/ | 9 | pa-admin, pa-content, pa-flashcards, pa-institutions, pa-messaging (NEW), pa-plans, pa-student-data, pa-study-plans |
| Root services/ | 17+ | studentApi, flashcardApi, quizApi, gamificationApi, bktApi, studySessionApi, etc. |

### Hooks (42+ files)

| Category | Key Hooks |
|---|---|
| Voice (NEW) | useRealtimeVoice.ts (12KB, 260 lines) |
| Study | useFlashcardEngine, useStudyPlans, useStudyQueueData, useReviewBatch |
| Progress | useStudyHubProgress (NEW), useTopicProgress, useKeywordMastery, useTopicMastery |
| AI | useSmartGeneration, usePdfIngest, useAdaptiveSession |
| Gamification | useGamification, useSessionXP |
| Queries | queryKeys.ts + specialized query hooks |

### Context Providers (9)

1. AuthContext.tsx (17KB) — authentication, institutions, roles
2. StudentDataContext.tsx (15KB) — student-specific data
3. PlatformDataContext.tsx (11KB) — owner/admin/professor shared data
4. ContentTreeContext.tsx (9KB) — course/topic hierarchy
5. AppContext.tsx (5KB) — current course, topic, UI state
6. GamificationContext.tsx (3.2KB) — XP, badges, streaks (STUB — BUG-021)
7. StudyPlansContext.tsx (2.8KB) — study plan state
8. StudyTimeEstimatesContext.tsx (1.2KB)
9. TopicMasteryContext.tsx (1.2KB)

### Components (346 .tsx files)

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
| roles/pages/admin/ | **7** (was 6 — added AdminMessagingSettingsPage) |
| auth/ | 6 |
| schedule/ | 6 |
| tiptap/ (+ extensions/) | 5 |
| roles/ (flat) | 4 |
| student-panel/ | 4 |
| welcome/ | 3 |
| ai/ | **3** (AxonAIAssistant, SmartFlashcardGenerator, VoiceCallPanel) |
| video/ | 2 |
| summary/ | 2 |
| flat | 2 |
| **TOTAL** | **~346** |

### Admin Pages (7 total)

1. AdminDashboardPage — overview dashboard
2. AdminMembersPage — institution members
3. AdminContentPage — academic content
4. AdminScopesPage — permissions
5. AdminReportsPage — statistics
6. **AdminSettingsPage** — settings hub (profile, notifications, messaging)
7. **AdminMessagingSettingsPage** (20KB, 521 lines) — Telegram & WhatsApp config

### BUG-030: Routes vs Components Mismatch

**professor-routes.ts** uses `lazyPlaceholder()` for all 8 routes. BUT:
- `roles/pages/professor/` has **16 real page files**: ProfessorCurriculumPage (12KB), ProfessorFlashcardsPage (17KB), ProfessorQuizzesPage (12KB), SummaryDetailView (39KB!), TopicDetailPanel (18KB), etc.
- `components/professor/` has **38 real CMS components** + 7 hooks
- These are BUILT but NOT WIRED to the router.

**owner-routes.ts** also uses `lazyPlaceholder()`. BUT:
- `roles/pages/owner/` has **8 real page files**: OwnerMembersPage (**50KB** — largest in app!), OwnerPlansPage (30KB), OwnerDashboardPage (23KB), OwnerSubscriptionsPage (15KB), OwnerAccessRulesPage (15KB), OwnerReportsPage (13KB)
- These are BUILT but NOT WIRED.

**admin-routes.ts**: 7 pages now. AdminSettingsPage and AdminMessagingSettingsPage are real implementations.

### Mega-files (F-020 — UPDATED)

| File | Size | Location |
|---|---|---|
| FlashcardsManager.tsx | **61KB** | content/ |
| StudyOrganizerWizard.tsx | **51KB** | content/ |
| **OwnerMembersPage.tsx** | **50KB** | roles/pages/owner/ |
| AxonAIAssistant.tsx | **40KB** | ai/ (was 39KB, added voice mode) |
| **SummaryDetailView.tsx** | **39KB** | roles/pages/professor/ |
| ModelViewer3D.tsx | **38KB** | content/ |
| QuizSelection.tsx | **35KB** | content/ |
| **OwnerPlansPage.tsx** | **30KB** | roles/pages/owner/ |
| FlashcardBulkImport.tsx | **30KB** | professor/ |
| TipTapEditor.tsx | **29KB** | tiptap/ |
| StudyHubSectionCards.tsx | **26KB** | content/ (NEW) |
| StudyHubHero.tsx | **25KB** | content/ (UPDATED) |

**14+ files >25KB**. Top priority for splitting.

### Test Infrastructure (NEW)

- Vitest setup (`vitest.config.ts`, `src/app/test/setup.ts`)
- Component contract tests (`StudyHubHero.contract.test.ts`)
- Unit tests (`StudyHubHero.test.tsx`)
- GitHub CI workflow (`.github/workflows/test.yml`)

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
| F-020 | **WORSE** — 14+ files >25KB |
| F-032 | **PARTIALLY FIXED** — Vitest added, first tests written |
