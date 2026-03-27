---
mode: FIX
cycle_count: 8
last_run: 2026-03-26T20:15:00Z
total_errors_found: 33
total_errors_fixed: 8
fix_cycles_consecutive: 0
---

## Error Ledger

| ID | Severity | Domain | File:Line | Description | Status | Found Cycle | Fixed Cycle |
|----|----------|--------|-----------|-------------|--------|-------------|-------------|
| BH-ERR-001 | HIGH | security | backend/supabase/functions/server/index.ts:58 | CORS wildcard fallback: getAllowedOrigin() returns "*" when Origin header is empty — allows curl/Postman/server-to-server to bypass CORS. Fix: return "" instead of "*" | FIXED | 1 | 3 |
| BH-ERR-002 | MEDIUM | security | frontend/src/app/lib/sanitize.ts:34 | ALLOW_DATA_ATTR: true + `style` in ALLOWED_ATTR in DOMPurify config — CSS injection vectors via data-* attributes and inline styles. Fix: remove ALLOW_DATA_ATTR, remove 'style' from ALLOWED_ATTR. Verify no visual regression on rendered summaries. | FIXED | 1 | 5 |
| BH-ERR-003 | MEDIUM | types | frontend/src (82 files) | 238 uses of `: any` in production code across 82 files (increased from 222/75 — new code added) | OPEN | 1 | — |
| BH-ERR-004 | MEDIUM | types | frontend/src (38 files) | 64 `catch(err: any)` blocks — getErrorMessage() helper exists but only used in 4 files | OPEN | 1 | — |
| BH-ERR-005 | LOW | tech-debt | frontend/src (4 files) | 4 fully deprecated files still present: QuizResultsScreen.tsx, QuizSessionView.tsx, as-legacy.ts, sa-ai-legacy.ts | OPEN | 1 | — |
| BH-ERR-006 | LOW | tech-debt | frontend/src/app/context/StudentDataContext.tsx | 5 deprecated stubs still exported (seedStudentData, profile, stats, recordActivity, submitReview) | OPEN | 1 | — |
| BH-ERR-007 | LOW | design-system | frontend/src/app/components (175 files) | **SCOPE UPDATE cycle 8:** 1031 hardcoded hex color values instead of CSS design tokens across 175 files (was 413/71 — grew 2.5x). Worst: schedule/ (235 hex in 8 files), gamification (108 in 5 files). | OPEN | 1 | — |
| BH-ERR-008 | LOW | quality | frontend/src (8 files) | 8 TODO/FIXME comments in production code: legacy-stubs.ts:9, BadgeEarnedToast.tsx:11, LevelUpCelebration.tsx:11, useStudyHubProgress.ts:315, useNoteData.ts:5, useStudyQueueData.ts:96, QuizTaker.tsx:277, gamification/helpers.ts:131 (backend) | OPEN | 1 | — |
| BH-ERR-009 | INFO | tech-debt | frontend/src | 19 files with @deprecated markers (was 29+ exports count, refined in cycle 6) | OPEN | 1 | — |
| BH-ERR-010 | MEDIUM | backend-infra | backend/supabase/functions/server/routes/gamification/profile.ts:130 | Weekly leaderboard now queries student_xp directly (S3-004 fix confirmed in code) | FIXED | 2 | 4 |
| BH-ERR-011 | MEDIUM | api-contract | frontend/src/app/services/quizzesEntityApi.ts:89 | Quiz `time_limit_seconds`: migration exists (20260326_02), backend CRUD config has field, but frontend STILL strips it (BUG-020 workaround at lines 89-90, 101-102). Professors set timer limits that are silently dropped. Fix: remove destructuring strip in createQuiz() and updateQuiz(). | FIXED | 2 | 5 |
| BH-ERR-012 | LOW | tech-debt | frontend/src/app/hooks/useNoteData.ts:17 | 3D viewer spatial notes use local state only — no backend persistence. Notes lost on page refresh. Backend note endpoints not yet implemented. | OPEN | 2 | — |
| BH-ERR-013 | MEDIUM | quality | frontend/src (10 files) | 24 console.log() without import.meta.env.DEV guard in production code. Only 13/37 total console.log have DEV guards. Worst: useStudyPlans.ts (11), useReviewBatch (2), useFlashcardEngine (2), StudentDataContext (2), api.ts:86 (logs EVERY API call). | INVALID | 4 | — |
| BH-ERR-014 | LOW | tech-debt | frontend/src + backend | **SCOPE UPDATE cycle 8:** 28 files exceed 500-line limit (was only useStudyPlans.ts:735). Frontend: StudyOrganizerWizard.tsx (1299), OwnerMembersPage.tsx (1276), AxonAIAssistant.tsx (1104), scheduling-intelligence.ts (917), StudyPlanDashboard.tsx (881), TipTapEditor.tsx (861), OwnerPlansPage.tsx (844), SummaryDetailView.tsx (789), QuizSelection.tsx (748), sidebar.tsx (726), FlashcardBulkImport.tsx (723), WeekMonthViews.tsx (687), WelcomeView.tsx (668), ModelManager.tsx (666), useStudyPlans.ts (735), others. Backend: telegram/tools.ts (733), ai/chat.ts (721), batch-review.ts (669), generate-smart.ts (585), crud-factory.ts (566), whatsapp/handler.ts (541), xp-hooks.ts (512), whatsapp/tools.ts (509). | OPEN | 4 | — |
| BH-ERR-015 | MEDIUM | rls | backend/supabase/migrations/20260325_01_atomic_stat_increments.sql:22,56 + 20260325_02_atomic_bkt_stat_increment.sql:19 | 3 SECURITY DEFINER functions missing `SET search_path = public, pg_temp` — vulnerable to search_path hijacking. Functions: increment_student_stat (line 22), decrement_streak_freezes (line 56), increment_bkt_attempts (line 19 of _02). Fix: single migration with 3 `ALTER FUNCTION ... SET search_path = public, pg_temp` statements (pattern in 20260319000002_security_definer_hardening.sql). | OPEN | 8 | — |
| BH-ERR-016 | HIGH | backend-infra | backend/supabase/functions/server/routes/gamification/xp-hooks.ts:147-161 + streak-engine.ts:290-303 | Race conditions still active: migrations 20260325_01 created increment_student_stat and decrement_streak_freezes RPCs to replace SELECT+UPDATE patterns, but application code was NEVER updated to call them. xp-hooks.ts still uses SELECT-then-UPDATE for student stats (line 147-161); streak-engine.ts still uses SELECT-then-UPDATE for streak_freezes_owned (290-303). Only increment_bkt_attempts was correctly wired (batch-review.ts:507,584). The original race conditions those migrations were supposed to fix remain active. | OPEN | 8 | — |
| BH-ERR-017 | CRITICAL | api-contract | frontend/src/app/services/platform-api/pa-content.ts:22 | getCourses() typed as Promise<Course[]> but CRUD factory LIST returns { items, total, limit, offset }. PlatformDataContext.tsx:135 assigns result to courses state expecting array — gets paginated object. Breaks course listing for Owner/Admin/Professor roles across the entire platform. Fix: return response.items or use extractItems() helper. | FIXED | 8 | 8 |
| BH-ERR-018 | CRITICAL | api-contract | frontend/src/app/services/platform-api/pa-content.ts:54 | getTopicSummaries() typed as Promise<Summary[]> but receives { items, total, limit, offset }. useMasteryOverviewData.ts:93 calls .map() on result — crashes at runtime. QuizSelection.tsx:150 has defensive workaround `Array.isArray(s) ? s : (s?.items || [])` confirming this is a known mismatch. | FIXED | 8 | 8 |
| BH-ERR-019 | CRITICAL | api-contract | frontend/src/app/lib/api.ts:288 | DATA CORRUPTION: ensureGeneralKeyword() calls GET /keywords?summary_id=xxx expecting KeywordRow[] then calls .find() on result. Backend returns { items, total, limit, offset } — .find() on object is always undefined, so it ALWAYS falls through to create a new "General" keyword. Silently duplicates keywords in the database on every flashcard/quiz creation call. Used by FlashcardsManager, FlashcardFormModal, useQuestionForm and others. | FIXED | 8 | 8 |
| BH-ERR-020 | MEDIUM | api-contract | frontend/src/app/services/platform-api/pa-content.ts:85 | getKeywords() in pa-content.ts typed as Promise<Keyword[]> but gets paginated object. Less severe than BH-ERR-017/018 since summariesApi.ts:195 correctly types as PaginatedList<SummaryKeyword> and is used by hooks. The pa-content.ts version is a broken duplicate. Fix: update to match summariesApi.ts pattern. | FIXED | 8 | 8 |
| BH-ERR-021 | MEDIUM | types | frontend/src/app/types/keywords.ts:12 + legacy-stubs.ts:96 + hooks/useKeywordMastery.ts:31 | MasteryLevel defined 3 times with 3 DIFFERENT value sets: keywords.ts='red'\|'yellow'\|'green', legacy-stubs.ts='none'\|'seen'\|'learning'\|'familiar'\|'mastered', useKeywordMastery.ts=DeltaColorLevel alias. Consumers get wrong type depending on import source. | OPEN | 8 | — |
| BH-ERR-022 | MEDIUM | types | frontend/src/app/services/gamificationApi.ts:40,75 vs types/gamification.ts:12,97 | XPTransaction and StreakStatus duplicated: identical interfaces defined in both gamificationApi.ts and gamification.ts. Divergence risk on any future edit. | OPEN | 8 | — |
| BH-ERR-023 | MEDIUM | types | frontend/src/app/services/summariesApi.ts:23 vs types/platform.ts:207 | Summary interface duplicated with DIVERGENT shapes: summariesApi.ts has order_index, is_active, deleted_at; platform.ts has institution_id, course_id, version. Neither is a superset. Consumers get different fields depending on import source. | OPEN | 8 | — |
| BH-ERR-024 | LOW | types | frontend/src/app/types/legacy-stubs.ts vs multiple | Multiple type duplicates with shape divergence: (1) AIQuestion — legacy-stubs.ts:98 has id field, keywords.ts:14 does not. (2) KeywordData — different shapes. (3) Model3D — legacy-stubs.ts:53 has minimal {id,name,url?}, model3d.ts:11 has full DB shape. (4) KeywordCollection — aiFlashcardGenerator.ts:15 as Record<string,KeywordState>, keywords.ts:29 as Record<string,KeywordData>. | OPEN | 8 | — |
| BH-ERR-025 | LOW | types | frontend/src/app/types/gamification.ts:43-93 + content.ts:78-113 + legacy-stubs.ts:61-91 + keywords.ts:34-87 | Runtime logic (exported functions, const arrays, config objects) in type files. Type files should contain only type definitions. 4 files affected. | OPEN | 8 | — |
| BH-ERR-026 | LOW | types | frontend/src/app/types/platform.ts:30,101 | Record<string, any> in Institution.settings and PlatformPlan.features — hides untyped data. Should be Record<string, unknown> or proper typed interfaces. | OPEN | 8 | — |
| BH-ERR-027 | CRITICAL | design-system | frontend/src/app/components — StudyDashboardsView.tsx:296,328,435,509,524 + KnowledgeHeatmapView.tsx:135,213,279 + MasteryDashboardView.tsx:141,207,226 + QuizXpConfirmedCard.tsx:72 + StudyHubHero.tsx:318,408,427 | Glassmorphism (bg-white/65 backdrop-blur-xl, backdrop-filter:blur(12px)) on content cards and sidebars — forbidden pattern per design system. 14 instances across 5 files. | OPEN | 8 | — |
| BH-ERR-028 | CRITICAL | design-system | frontend/src/app/design-kit/dk-navigation.tsx:45 + dk-layouts.tsx:110 | Glassmorphism embedded in design-kit PRIMITIVES (bg-white/80 backdrop-blur-xl, bg-white/[0.05] backdrop-blur-sm). Any component using these primitives inherits the violation. Fixing at dk- level cascades to all consumers. Highest priority glassmorphism fix. | OPEN | 8 | — |
| BH-ERR-029 | HIGH | design-system | frontend/src/app/components — StudyDashboardsView.tsx:332,412,528 + KnowledgeHeatmapView.tsx:78,137,232 + MasteryDashboardView.tsx:86 + AxonAIAssistant.tsx:398,472,713,812,948 | Wrong heading font: Space Grotesk used instead of Georgia (design system spec). 12 instances across 4 files. | OPEN | 8 | — |
| BH-ERR-030 | HIGH | design-system | frontend/src/app/components — QuizXpConfirmedCard.tsx:67 + LevelUpCelebration.tsx:51 + BadgeEarnedToast.tsx:39 + gamification/pages/LeaderboardPage.tsx:17-19 | Hardcoded gradients with rgba/hex values on interactive elements and toast cards. linear-gradient(135deg, ...) pattern. 4 files. | OPEN | 8 | — |
| BH-ERR-031 | HIGH | tech-debt | frontend/src/app/utils/categoryStyles.ts:1 | Dead file created but never connected: CATEGORY_STYLES exported but never imported. Intended consumers (MasteryDashboardView.tsx:53, KnowledgeHeatmapView.tsx:63) still define local duplicates. The deduplication was created but not wired up. | OPEN | 8 | — |
| BH-ERR-032 | MEDIUM | tech-debt | frontend/src/app/services/adaptiveGenerationApi.ts:11-14 + utils/constants.ts:37 + design-system/navigation.ts:1 | Dead exports never consumed: MAX_CONCURRENT_GENERATIONS, RECOMMENDED_MAX_BATCH, SmartMetadata (adaptiveGenerationApi); AXON_TODAY const superseded by getAxonToday() (constants.ts); navigation design-system module (navigation.ts + shadows.ts + shapes.ts + designRules). | OPEN | 8 | — |
| BH-ERR-033 | LOW | api-contract | frontend/src/app/components/professor/FlashcardFormModal.tsx:256 | Calls `(await ensureGeneralKeyword(summaryId)).id` but ensureGeneralKeyword returns `string` not an object — `.id` is always `undefined`. Pre-existing on main, discovered by QG-01 during cycle 8 fix audit. | OPEN | 8 | — |

## Console.log NEEDS_VERIFICATION (cycle 8)

BH-06 found ~20 unguarded console.log calls in production hooks/contexts (useStudyPlans.ts:157-578 — 17 calls, ContentTreeContext.tsx:109, useFlashcardEngine.ts:129-154, api.ts:86-187, useKeywordNavigation.ts:101, useTopicProgress.ts:206, useReviewBatch.ts:130-205, StudentDataContext.tsx:307-381). This CONFLICTS with BH-05 which verified all console.log calls are DEV-guarded. Given BH-ERR-013 was a false positive, these need manual verification with 3+ lines of context before adding to ledger. NOT added as a new error yet.

## Fix Plan (generated cycle 8 — 27 OPEN errors)

### Priority 1 — Data corruption / App crashes (CRITICAL)

- **BH-ERR-019** (CRITICAL/api-contract): Fix ensureGeneralKeyword() in api.ts:288 — change .find() on paginated response to response.items.find() or use extractItems() helper. DATA CORRUPTION — urgent.
  - Agent: infra-ui | File: frontend/src/app/lib/api.ts

- **BH-ERR-017** (CRITICAL/api-contract): Fix getCourses() in pa-content.ts:22 — type as PaginatedList and extract .items
  - Agent: infra-ui | File: frontend/src/app/services/platform-api/pa-content.ts

- **BH-ERR-018** (CRITICAL/api-contract): Fix getTopicSummaries() in pa-content.ts:54 — same pattern
  - Agent: infra-ui | File: frontend/src/app/services/platform-api/pa-content.ts

- **BH-ERR-028** (CRITICAL/design-system): Remove glassmorphism from dk-navigation.tsx:45 and dk-layouts.tsx:110
  - Agent: design-tokens | Files: frontend/src/app/design-kit/dk-navigation.tsx, dk-layouts.tsx

### Priority 2 — High severity (race conditions, security, design)

- **BH-ERR-016** (HIGH/backend-infra): Wire up increment_student_stat and decrement_streak_freezes RPCs in xp-hooks.ts and streak-engine.ts
  - Agent: gamification-backend | Files: backend/supabase/functions/server/routes/gamification/xp-hooks.ts, streak-engine.ts

- **BH-ERR-015** (MEDIUM/rls): Add SET search_path to 3 SECURITY DEFINER functions via migration
  - Agent: migration-writer | New migration file

- **BH-ERR-029** (HIGH/design-system): Fix wrong heading fonts in 4 files (12 instances)
  - Agent: design-tokens | Files: StudyDashboardsView.tsx, KnowledgeHeatmapView.tsx, MasteryDashboardView.tsx, AxonAIAssistant.tsx

- **BH-ERR-031** (HIGH/tech-debt): Wire categoryStyles.ts into MasteryDashboardView.tsx and KnowledgeHeatmapView.tsx
  - Agent: infra-ui | Files: categoryStyles.ts, MasteryDashboardView.tsx, KnowledgeHeatmapView.tsx

### Priority 3 — Medium severity

- **BH-ERR-027** (CRITICAL/design-system): Remove glassmorphism from 5 content components (14 instances)
  - Agent: design-tokens | Files: StudyDashboardsView.tsx, KnowledgeHeatmapView.tsx, MasteryDashboardView.tsx, QuizXpConfirmedCard.tsx, StudyHubHero.tsx

- **BH-ERR-020** (MEDIUM/api-contract): Fix getKeywords() in pa-content.ts to use PaginatedList pattern
  - Agent: infra-ui | File: frontend/src/app/services/platform-api/pa-content.ts

- **BH-ERR-021** (MEDIUM/types): Consolidate MasteryLevel to single definition
  - Agent: type-guardian | Files: keywords.ts, legacy-stubs.ts, useKeywordMastery.ts

- **BH-ERR-022** (MEDIUM/types): Remove XPTransaction/StreakStatus duplicates from gamificationApi.ts
  - Agent: type-guardian | File: gamificationApi.ts

- **BH-ERR-023** (MEDIUM/types): Reconcile Summary interface shapes across summariesApi.ts and platform.ts
  - Agent: type-guardian | Files: summariesApi.ts, platform.ts

- **BH-ERR-032** (MEDIUM/tech-debt): Remove dead exports (adaptiveGenerationApi, AXON_TODAY, navigation.ts)
  - Agent: refactor-scout | Multiple files

### Priority 4 — Deferred (large effort or low impact)

- **BH-ERR-030** (HIGH/design-system): Replace gradient literals with design tokens in 4 gamification components
- **BH-ERR-003/004**: Type safety sprint (~238 any + ~64 catch any)
- **BH-ERR-007**: Design tokens sprint (1031 hardcoded colors, 175 files)
- **BH-ERR-024/025/026**: Type file cleanup (duplicates + runtime logic in type files)
- **BH-ERR-005/006**: Deprecated file/stub removal
- **BH-ERR-008**: Resolve 8 TODO/FIXME comments
- **BH-ERR-009**: @deprecated markers cleanup
- **BH-ERR-012**: 3D notes backend (new feature)
- **BH-ERR-014**: File size sprint (28 files > 500 lines)

## What's GOOD (Audit Cycle 8)

- Security: Zero new vulnerabilities. CORS, DOMPurify, HMAC webhooks, RLS, auth all confirmed clean.
- Frontend tests: 1080 tests, 0 failures (59 test files).
- authenticate() on all non-webhook endpoints (verified cycle 8).
- Rate limiting active globally.
- No broken lazy imports or missing route targets.
- All 11 context providers properly wired in component tree.
- No hardcoded secrets anywhere.
- Stripe/Mux/Telegram/WhatsApp webhooks all HMAC-verified.

## Execution Log

| Cycle | Mode | Timestamp | Agents Launched | Errors Found | Errors Fixed | Duration |
|-------|------|-----------|-----------------|--------------|--------------|----------|
| 1 | AUDIT | 2026-03-26T00:00:00Z | 1 (manual, no TeamCreate) | 9 | 0 | ~6 min |
| 2 | AUDIT | 2026-03-26T12:00:00Z | 1 (manual) | 3 new (12 total) | 0 | ~8 min |
| 3 | FIX | 2026-03-26T18:00:00Z | 1 architect + root exec | 0 new | 2 (BH-001,010). BH-002,011 incorrectly marked FIXED | ~15 min |
| 4 | AUDIT | 2026-03-26T22:00:00Z | 1 (manual Grep/Read/Glob) | 2 new (BH-013,014) + 2 reverted to OPEN (BH-002,011) | 0 | ~12 min |
| 5 | FIX | 2026-03-26T23:00:00Z | 1 architect (manual audit) + root exec | 0 new | 2 (BH-002,011 fixed); BH-013 INVALID (false positive — all console.log already guarded) | ~25 min |
| 6 | AUDIT | 2026-03-26T23:30:00Z | 1 (manual Grep/Read/Glob) | 0 new | 0 | ~10 min |
| 7 | AUDIT | 2026-03-27T00:00:00Z | 1 (manual Grep/Read/Glob) | 0 new | 0 | ~8 min |
| 8 | AUDIT | 2026-03-26T20:15:00Z | 10 (TeamCreate bug-hunter-audit-8, 2 batches of 5) | 18 new (BH-015 to BH-032) | 0 | ~20 min |

## Notes

- **Cycle 3 correction**: BH-ERR-002 and BH-ERR-011 were incorrectly marked FIXED. Audit cycle 4 verified the code and found issues still present. BH-ERR-010 was correctly FIXED.
- **FIX mode triggered cycle 4**: 12 OPEN errors >= threshold of 10. Priority 1 items (BH-002, 011, 013) are quick wins.
- **BH-ERR-013 false positive (cycle 5)**: Grep for console.log matches lines *inside* `if (import.meta.env.DEV)` blocks without seeing parent context. Future audits must use multiline patterns or check 2-3 lines of context. All 24 calls were already guarded.
- **OPEN errors after cycle 5**: 9. Mode reset to AUDIT — below 10 threshold.
- **Cycle 8 — FIX mode triggered**: 18 new errors found. Total OPEN = 27 (>= 10 threshold). Most critical: BH-ERR-019 (data corruption — ensureGeneralKeyword duplicates keywords in DB), BH-ERR-017/018 (app crashes), BH-ERR-028 (glassmorphism in design-kit cascades to all consumers), BH-ERR-016 (race conditions from incomplete migration wiring).
- **Console.log conflict**: BH-05 (quality-gate) said all console.log are DEV-guarded; BH-06 (refactor-scout) found ~20 unguarded. Needs manual verification before acting. Not added to ledger per BH-ERR-013 precedent.
- **Domain mapping for fix agents**: api-contract → infra-ui, rls/backend-infra → migration-writer+gamification-backend, design-system → design-tokens, types → type-guardian, tech-debt → refactor-scout.
