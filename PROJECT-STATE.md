# Project State

> Updated: 2026-03-27

## Agent System Status

- **40/76 agents completed recon** (Batch 1: 20, Batch 2: 20)
- **36 pending:** Batch 3 (AI/3D/Infra/Messaging/Billing = 20) + Batch 4 (Cross-cutting/legacy = 16)
- **8 PRs merged to main** (cumulative)

## PRs Merged (Cumulative)

1. fix/batch1-architect-fixes — registry + dead code + memories
2. fix/watchtime-tracking — MuxVideoPlayer real watch time
3. fix/studyhub-dead-code — orphan removal + deprecated
4. fix/batch2-memories — AS-03/AS-04 audit results
5. fix/flashcard-generation-bugs (#204) — 5 bug fixes for flashcard generation
6. feat/flashcard-image-pipeline (backend #174) — Gemini 2.0 Flash image service + DB schema
7. feat/flashcard-image-pipeline (frontend #207) — FlashcardImage component + useFlashcardImage hook
8. feat/block-based-summaries (#208) — 6 waves + 12 code review fixes (35 files, +4630 lines)

## Completed (2026-03-27 Session)

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
- **Next:** Smoke test + Session 2 (verify + fix gaps) + Session 3 (polish)

### Infra — Worktree Isolation

- Git post-checkout hooks in frontend + backend
- Script `C:\dev\axon\worktree.sh` for isolated worktrees
- agent-workflow.md updated with critical worktree rules

## Critical Findings (Pending Fix)

### Security (URGENT)

- **RLS:** platform_plans + ai_reading_config too permissive (AS-03)
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

| Branch | Content | Files |
|---|---|---|
| feature/mindmap-knowledge-graph | Knowledge graph, mindmap, AI tutor | 345 |
| feat/sessioncalendario | Scheduling intelligence, study plans, calendar | 107 |
| feat/student-telegram-and-ai-assistant | Telegram integration, AI assistant | 105 |
| security/phase-1-frontend | Security audit fixes | 303 |

### Backend

| Branch | Content |
|---|---|
| feat/sessioncalendario | Study intelligence, reanalyze endpoint, topic analyzer |
| perf/ralph-autonomous-improvements | Performance improvements AI + gamification |
| fix/realtime-v2-session | Realtime session v2 |
| feature/whatsapp-phase3 | WhatsApp Cloud API integration |

## Next Steps

1. Smoke test summaries in production (Vercel deploy of PR #208)
2. Session 2 summaries: verify + fix gaps post-merge
3. Security fixes (RLS + webhook + 401 interceptor)
4. Complete recon Batch 3+4 (36 agents)
5. Student flashcard creation feature (design spec complete, implementation pending)
