# Project State

> Updated: 2026-03-29

## Agent System Status

- **40/76 agents completed recon** (Batch 1: 20, Batch 2: 20)
- **36 pending:** Batch 3 (AI/3D/Infra/Messaging/Billing = 20) + Batch 4 (Cross-cutting/legacy = 16)
- **14 PRs merged to main** (cumulative)

## PRs Merged (Cumulative)

1. fix/batch1-architect-fixes — registry + dead code + memories
2. fix/watchtime-tracking — MuxVideoPlayer real watch time
3. fix/studyhub-dead-code — orphan removal + deprecated
4. fix/batch2-memories — AS-03/AS-04 audit results
5. fix/flashcard-generation-bugs (#204) — 5 bug fixes for flashcard generation
6. feat/flashcard-image-pipeline (backend #174) — Gemini 2.0 Flash image service + DB schema
7. feat/flashcard-image-pipeline (frontend #207) — FlashcardImage component + useFlashcardImage hook
8. feat/block-based-summaries (#208) — 6 waves + 12 code review fixes (35 files, +4630 lines)
9. feat/calendar-v2 (frontend #209) — Full calendar v2 implementation (7 sessions completed)
10. feat/calendar-v2 (backend #175) — Calendar v2 DB schema, API, CRUD endpoints
11. fix/dispatcher-advisory-lock — advisory lock gamification + WhatsApp adapter + security fixes
12. fix/summary-blocks-schema-sync — idempotent migration to sync summary_blocks schema
13. fix/rls-platform-plans — restrict platform_plans writes to service_role
14. feat/block-embeddings — block hooks, flatten, publish endpoint + TDD tests

## Completed (2026-03-27 → 2026-03-29)

### Calendar v2 — COMPLETE & MERGED

- **PR #209 (frontend):** Full calendar v2 implementation
  - 7 sessions completed: Backend DB+API, Frontend Hooks+PoC, CalendarView+DayCell, ExamPanel+CRUD, Countdown+Finals Week, Mobile Polish+Dark Mode, QA (22 checks)
  - CalendarView, DayCell, ExamPanel, CountdownWidget, useFinalsWeek
  - Mobile responsive + dark mode support
- **PR #175 (backend):** Calendar v2 backend
  - exam_events table + RLS policies
  - CRUD endpoints for calendar events
  - Study session integration

### Flashcard Pipeline — COMPLETE

- **PR #204 (frontend):** 5 bug fixes (BH-ERR-019/021/024/032/033)
  - ensureGeneralKeyword paginated response fix
  - `.id` on string (3 callers fixed)
  - MasteryLevel/KeywordCollection type unification
  - Dead exports removed

- **PR #174 (backend):** Image pipeline — Gemini 2.0 Flash + Supabase Storage
  - gemini-image.ts, flashcard-image-generator.ts
  - POST /flashcards/:id/generate-image
  - SQL: flashcards image columns + image_style_packs + image_prompt_templates + image_generation_log + RLS + Storage bucket

- **PR #207 (frontend):** FlashcardImage component + useFlashcardImage hook
  - FlashcardImage.tsx (<picture> AVIF/WebP on-demand)
  - FlashcardCard.tsx integration, SmartFlashcardGenerator toggle

### Block-Based Summaries — IN PRODUCTION

- **PR #208 merged** to main (commit dabcc9f)
- 6 waves + 12 bug fixes from code review
- 35 files, +4630 lines
- Block embeddings pipeline merged (backend): hooks, flatten, publish endpoint + TDD tests

### Backend Stability Fixes (2026-03-27 → 2026-03-29)

- **fix/dispatcher-advisory-lock:** Advisory lock for gamification dispatcher + WhatsApp Claude-to-Gemini tool format adapter + security fixes
- **fix/summary-blocks-schema-sync:** Idempotent migration to sync summary_blocks schema with production
- **fix/rls-platform-plans:** Restrict platform_plans writes to service_role (resolves SEC finding)
- **fix/pregen-institution-rate-limit:** Institution-level rate limit for pre-generate endpoint
- **fix/wa-tool-format-adapter (#172):** WhatsApp tool format adapter to prevent 100% tool call failure
- **fix/auto-ingest-backoff (#171):** Exponential backoff for embedding rate limits + content_hash migration

### Infra — Worktree Isolation

- Git post-checkout hooks in frontend + backend
- Worktrees created as siblings: `AXON PROJECTO/frontend-feat-branch/`
- agent-workflow.md updated with critical worktree rules

## Critical Findings (Pending Fix)

### Security (URGENT)

- ~~**RLS:** platform_plans too permissive~~ → FIXED (fix/rls-platform-plans merged)
- **RLS:** ai_reading_config still too permissive (AS-03)
- **WhatsApp webhook:** hardcoded fallback salt (AS-04)
- **No 401 interceptor** in frontend (AS-04)
- **3 SECURITY DEFINER functions** missing SET search_path (BH-ERR-015)
- **Race conditions** in xp-hooks.ts + streak-engine.ts — RPCs created but never wired (BH-ERR-016)

### Functional

- 5 ghost endpoints in pa-admin.ts (AO-02)
- LEVEL_NAMES divergent: xp-constants vs types/gamification (DG-03/DG-04)
- MasteryLevel defined 3 times with different values (BH-ERR-021)
- XPTransaction/StreakStatus/Summary duplicated types (BH-ERR-022/023)

### Design System Violations

- **Glassmorphism on content cards** — 14 instances in 5 files (BH-ERR-027)
- **Glassmorphism in design-kit primitives** (BH-ERR-028) — highest priority
- **Wrong heading font** (Space Grotesk instead of Georgia) — 12 instances (BH-ERR-029)
- **Hardcoded gradients** on interactive elements (BH-ERR-030)
- **1031 hardcoded hex colors** across 175 files (BH-ERR-007)

### Tech Debt

- 238 uses of `: any` across 82 files (BH-ERR-003)
- 28 files exceed 500-line limit (BH-ERR-014)
- 4 deprecated files still present (BH-ERR-005)

## Build Status

- **Frontend:** npm run build passes (primary validation)
- **Backend:** deno test passes
- **Vercel:** PR #208 deployed successfully

## Config

- settings.local.json: defaultMode=bypassPermissions + additionalDirectories for both repos
- agent-workflow.md: Agent Teams mandatory, opus always, bypassPermissions, worktrees
- Git hooks: post-checkout in both repos (warn non-main checkout)

## Active Feature Branches

### Frontend

| Branch | Content | Status |
|---|---|---|
| feature/mindmap-knowledge-graph | Knowledge graph, mindmap, AI tutor | Active — large feature (345 files) |
| feat/student-telegram-and-ai-assistant | Telegram integration, AI assistant | Active |
| security/phase-1-frontend | Security audit fixes | Active (v2 branch also exists) |
| feat/session-analytics-infra | Session analytics infrastructure | Active |

### Backend

| Branch | Content | Status |
|---|---|---|
| feat/sessioncalendario | Study intelligence, reanalyze endpoint, topic analyzer | Active |
| perf/ralph-autonomous-improvements | Performance improvements AI + gamification | Active |
| fix/realtime-v2-session | Realtime session v2 | Active (10+ realtime PRs merged) |
| feature/whatsapp-phase3 | WhatsApp Cloud API integration | Active |

### Recently Merged / Completed

| Branch | Content |
|---|---|
| feat/calendar-v2 (frontend #209 + backend #175) | Calendar v2 — full implementation |
| feat/block-based-summaries (frontend #208) | Block-based summaries — 6 waves |
| feat/block-embeddings (backend) | Block embeddings pipeline |
| fix/dispatcher-advisory-lock, fix/rls-platform-plans, fix/summary-blocks-schema-sync | Backend stability + security |

## Next Steps

1. Smoke test summaries + calendar in production
2. Security fixes (ai_reading_config RLS + webhook salt + 401 interceptor + SECURITY DEFINER functions)
3. Complete recon Batch 3+4 (36 agents)
4. Student flashcard creation feature (design spec complete, implementation pending)
5. Calibración Adaptativa de Dificultad (Sprint 0 priority — wire FSRS+BKT into generation)
6. Badges de Esfuerzo (Sprint 0 — quick win, backend infra exists)
