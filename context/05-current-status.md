# 05 -- Current Status

> **Updated: 2026-03-27 (8 PRs merged to main, Batch 1+2 recon complete, Batch 3+4 pending)**

## Build Status

| Repo | Status | Notes |
|---|---|---|
| Frontend (Vercel) | Running | npm run build passes (primary validation). React 18 + Vite 6 + Tailwind v4. Block-based summaries (PR #208) in production. |
| Backend (Supabase EF) | Running | deno test passes. ~103 files, 17 route modules. Flashcard image pipeline (PR #174) deployed. |
| Supabase | Running | 50+ tables, 60+ SQL migrations. 1536d embeddings (OpenAI text-embedding-3-large). |

## Session Highlights (2026-03-27)

- **8 PRs merged to main** (cumulative, includes fixes + features)
- **Flashcard pipeline complete:** Image generation (Gemini 2.0 Flash) + DB schema + components
- **Block-based summaries:** 35 files, +4630 lines, 6 waves of development, 12 code review fixes
- **Git worktrees:** Isolation infrastructure installed (post-checkout hooks + helper script)
- **Agent recon:** 40/76 agents completed (Batch 1+2), 36 pending (Batch 3+4)

## Critical Findings (Pending)

| Item | Category | Priority |
|---|---|---|
| RLS too permissive (platform_plans, ai_reading_config) | Security | **URGENT** |
| WhatsApp webhook hardcoded salt | Security | **URGENT** |
| No 401 interceptor in frontend | Security | **HIGH** |
| 3 SECURITY DEFINER missing SET search_path | Security | HIGH |
| Race conditions (xp-hooks, streak-engine) — RPCs wired but not called | Functional | HIGH |
| 1031 hardcoded hex colors (175 files) | Design | HIGH |
| Glassmorphism (14 instances) + wrong heading fonts | Design | HIGH |
| 238 uses of `: any` (82 files) | Type system | MEDIUM |
| 28 files exceed 500-line limit | Tech debt | MEDIUM |
| 5 ghost endpoints (pa-admin.ts) | Code | MEDIUM |

## Backend Architecture

### Route Modules (11 split + 6 flat = 17 mounted)

| Module | Files | Content |
|---|---|---|
| ai/ | 14 | Smart generation, RAG chat, embeddings (Gemini 2.5 Flash) |
| content/ | 10 | Curricula, topics, keywords, connections |
| whatsapp/ | 10 | WhatsApp Cloud API integration (Phase 3 branch) |
| telegram/ | 10 | Telegram bot + webhooks |
| gamification/ | 6 | XP engine (8 hooks, 11 actions), badges (39), streaks, goals |
| study/ | 6 | Flashcards, quizzes, batch review, progress tracking |
| plans/ | 5 | Study plans, scheduling, learning paths |
| mux/ | 5 | Video upload + signed playback + view tracking |
| members/ | 4 | User memberships, institutions, access |
| search/ | 4 | Full-text search, trash/restore |
| settings/ | 2 | Algorithm config, platform settings |
| **Flat files** | | |
| routes-billing.ts | — | Stripe checkout, portal, webhooks |
| routes-study-queue.ts | — | Review scheduling queue |
| routes-models.ts | — | Model lookup endpoints |
| routes-storage.ts | — | File storage operations |
| routes-auth.ts | — | Auth endpoints |
| routes-student.ts | — | Student dashboard data |

### Core Infrastructure

- **db.ts:** Hono client setup, JWT decode (NO crypto validation), `authenticate()`
- **auth-helpers.ts:** Fail-closed role authorization, institution-scoped, `ROLE_HIERARCHY`
- **xp-hooks.ts:** XP triggers (study, completion, mastery)
- **streak-engine.ts:** Streak calculation logic
- **retrieval-strategies.ts:** RAG retrieval (semantic + keyword hybrid)
- **lib/fsrs-v4.ts, bkt-v4.ts:** Spaced repetition + knowledge tracing
- **Rate limiting:** 120 req/min/user

## Frontend Stack & Structure

### Technology
- **React 18** + **Vite 6** + **Tailwind v4 (alpha)**
- 188 logic files (services, hooks, lib, design-system, types, context, utils)
- ~350 components across 22+ directories
- Gamification UI: 8 React Query hooks + 7 components
- 22 lazy routes with error recovery (lazyRetry)

### Component Distribution

| Category | Files | Notes |
|---|---|---|
| Student features | 57 | Dashboard, flashcards, quizzes, progress |
| Content management | 48 | Flashcard editors, bulk import, bulk ops |
| UI primitives | 44 | Design-kit atoms + helpers |
| Professor CMS | 38 | Content creation, class management |
| Gamification | 14 | XP, badges, streaks, leaderboard |
| Layout + Sidebar | 18 | RoleShell, responsive MobileDrawer |
| 3D Viewer | 14 | Anatomy models, interactive |
| Dashboard | 11 | Role-specific overviews |
| Auth | 6 | Login, register, role selection |
| Schedule | 6 | Calendar, session booking |

### Code Quality Issues

| Issue | Scope | Priority |
|---|---|---|
| **14 files >25KB** | FlashcardsManager (61KB), StudyOrganizerWizard (51KB), OwnerMembersPage (50KB), AxonAIAssistant (39KB), SummaryDetailView (39KB) | HIGH |
| **1031 hardcoded hex colors** | 175 files | HIGH |
| **238 instances of `: any`** | 82 files | MEDIUM |
| **Glassmorphism violations** | 14 instances on content cards + design-kit primitives | MEDIUM |
| **Wrong heading fonts** | 12 instances (Space Grotesk instead of Georgia) | MEDIUM |
| **28 files exceed 500 lines** | Various | MEDIUM |

## Active Development Branches

### Frontend Features
- `feature/mindmap-knowledge-graph` (345 files)
- `feat/sessioncalendario` (107 files)
- `feat/student-telegram-and-ai-assistant` (105 files)
- `security/phase-1-frontend` (303 files)

### Backend Features
- `feat/sessioncalendario` (study intelligence)
- `perf/ralph-autonomous-improvements` (AI + gamification perf)
- `fix/realtime-v2-session` (realtime updates)
- `feature/whatsapp-phase3` (WhatsApp Cloud API)
