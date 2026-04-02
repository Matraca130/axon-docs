# Axon — Known Bugs
> Updated: 2026-04-02
> Sources: Bug Hunter (33 errors, 8 fixed) + legacy bug tracker (BUG-001 through BUG-034) + Weekly Tech Debt Audit (AXO-53)

## Open — CRITICAL

| ID | Domain | Description | File |
|---|---|---|---|
| BH-ERR-027 | design-system | Glassmorphism (bg-white/65 backdrop-blur-xl) on content cards — 14 instances in 5 files | StudyDashboardsView, KnowledgeHeatmapView, MasteryDashboardView, QuizXpConfirmedCard, StudyHubHero |
| BH-ERR-028 | design-system | Glassmorphism in design-kit PRIMITIVES (dk-navigation, dk-layouts) — cascades to all consumers | dk-navigation.tsx:45, dk-layouts.tsx:110 |

## Open — HIGH

| ID | Domain | Description | File |
|---|---|---|---|
| BUG-001 | backend | resolution_tier vs max_resolution Mux webhook mismatch | routes-models.ts |
| BH-ERR-015 | rls/security | 3 SECURITY DEFINER functions missing SET search_path = public, pg_temp (search_path hijack). **Branch `fix/security-definer-search-path` exists but no PR yet** | 20260325_01 + _02 migrations |
| BH-ERR-016 | backend | Race conditions: increment_student_stat + decrement_streak_freezes RPCs created but NEVER wired in app code. xp-hooks.ts still SELECT→UPDATE. **PR #182 ready for review** | xp-hooks.ts:147-161, streak-engine.ts:290-303 |
| BH-ERR-029 | design-system | Wrong heading font: Space Grotesk instead of Georgia — 12 instances | StudyDashboardsView, KnowledgeHeatmapView, MasteryDashboardView, AxonAIAssistant |
| BH-ERR-030 | design-system | Hardcoded gradients on interactive elements — 4 files | QuizXpConfirmedCard, LevelUpCelebration, BadgeEarnedToast, LeaderboardPage |
| BH-ERR-031 | tech-debt | categoryStyles.ts created but never connected — consumers still have local duplicates | utils/categoryStyles.ts |

## Open — MEDIUM

| ID | Domain | Description | File |
|---|---|---|---|
| BUG-006 | backend | Content tree filters inactives in JS (should be SQL) | Backend |
| BUG-021 | frontend | GamificationContext is STUB (no-ops) | context/GamificationContext.tsx |
| SEC-S9B | security | 6 SQL functions need REVOKE from authenticated. **PRs #183 + #184 ready — merge #183 first, rebase #184** | Backend DB |
| BH-ERR-003 | types | **361 uses of `: any`** across frontend (was 238 on 2026-03-29 — **+52% regression**). Needs lint rule to block new additions | frontend/src |
| BH-ERR-004 | types | 64 catch(err: any) blocks — getErrorMessage() helper exists but only used in 4 files | frontend/src (38 files) |
| BH-ERR-021 | types | MasteryLevel defined 3 times with 3 DIFFERENT value sets | keywords.ts, legacy-stubs.ts, useKeywordMastery.ts |
| BH-ERR-022 | types | XPTransaction + StreakStatus duplicated in gamificationApi.ts vs gamification.ts | gamificationApi.ts, gamification.ts |
| BH-ERR-023 | types | Summary interface duplicated with DIVERGENT shapes | summariesApi.ts vs platform.ts |
| BH-ERR-032 | tech-debt | Dead exports: MAX_CONCURRENT_GENERATIONS, RECOMMENDED_MAX_BATCH, SmartMetadata, AXON_TODAY, navigation design-system | Multiple files |

## Open — LOW

| ID | Domain | Description | File |
|---|---|---|---|
| BUG-011 | database | ~25 kv_store_* junk tables | DB |
| BUG-024 | types | Overlapping types kw-notes in 2 services | studentNotesApi vs studentSummariesApi |
| BUG-027 | tech-debt | Dual content tree (hook vs context) | useContentTree vs ContentTreeContext |
| BUG-034 | api | GET /reading-states?limit=1000 returns 400 | studentSummariesApi + useStudyHubProgress |
| SEC-S7 | security | JWT expiry 3600s (needs Supabase Pro for 300s) | Supabase config |
| BH-ERR-005 | tech-debt | 4 deprecated files still present | QuizResultsScreen, QuizSessionView, as-legacy, sa-ai-legacy |
| BH-ERR-006 | tech-debt | 5 deprecated stubs still exported from StudentDataContext | StudentDataContext.tsx |
| BH-ERR-007 | design-system | 1031 hardcoded hex colors across 175 files | frontend components (worst: schedule/ 235 hex) |
| BH-ERR-008 | quality | 8 TODO/FIXME comments in production code | 8 files |
| BH-ERR-009 | tech-debt | 19 files with @deprecated markers | frontend/src |
| BH-ERR-012 | tech-debt | 3D viewer notes use local state only — no backend persistence | useNoteData.ts |
| BH-ERR-014 | tech-debt | Files >500 lines — partially fixed (PR #242 split 11 mega-files, PR #328 draft continues). 3 production files still over: sidebar.tsx (726), StudentSummaryReader.tsx (710), WeekMonthViews.tsx (687) | frontend |
| BH-ERR-034 | perf | StudentSummaryReader.tsx bundle chunk 1,222 kB (over 600 kB limit) — needs code-splitting | frontend build |
| BH-ERR-024 | types | Multiple type duplicates: AIQuestion, KeywordData, Model3D, KeywordCollection | legacy-stubs.ts vs multiple |
| BH-ERR-025 | types | Runtime logic in type files (functions, const arrays, config) — 4 files | gamification.ts, content.ts, legacy-stubs.ts, keywords.ts |
| BH-ERR-026 | types | Record<string, any> in Institution.settings and PlatformPlan.features | platform.ts |
| BH-ERR-033 | api | ensureGeneralKeyword returns string, but .id called on it | FlashcardFormModal.tsx:256 |
| TEST-001 | testing | Frontend tests failing on main (pre-existing) | Frontend test suite |

## Open — INFO

| ID | Description |
|---|---|
| BUG-022 | apiConfig.ts duplicate fetch — NOT dead code, used by models3dApi.ts |
| BUG-023 | aiFlashcardGenerator.ts — NOT dead code, used by SmartFlashcardGenerator |
| BUG-025 | ANON_KEY hardcoded x3 — by design (Supabase public key pattern) |
| INFO-001 | Frontend PRs #313/#314/#315 conflict cluster — all 3 modify StudentSummaryReader.tsx, SidebarOutline.tsx, ViewerBlock.tsx. Must serialize merges (2026-04-02) |
| INFO-002 | ~85 stale remote branches in backend (oldest: 2026-02-25). Recommend cleanup of branches >14 days (2026-04-02) |
| INFO-003 | 8 `claude/` draft PRs on frontend — auto-generated agent PRs. Review for staleness (2026-04-02) |

## Recently FIXED (2026-03-19 — 2026-03-29)

| ID | Severity | Description | Resolution |
|---|---|---|---|
| BH-ERR-001 | HIGH | CORS wildcard fallback | Fixed cycle 3 — return "" instead of "*" |
| BH-ERR-002 | MEDIUM | DOMPurify ALLOW_DATA_ATTR + style injection | Fixed cycle 5 |
| BH-ERR-010 | MEDIUM | Weekly leaderboard wrong query | Fixed cycle 4 |
| BH-ERR-011 | MEDIUM | Quiz time_limit_seconds silently stripped | Fixed cycle 5 |
| BH-ERR-017 | CRITICAL | getCourses() typed as array, gets paginated object | Fixed cycle 8 |
| BH-ERR-018 | CRITICAL | getTopicSummaries() typed as array, gets paginated — crashes | Fixed cycle 8 |
| BH-ERR-019 | CRITICAL | ensureGeneralKeyword() DATA CORRUPTION — .find() on paginated object | Fixed cycle 8 (PR #204) |
| BH-ERR-020 | MEDIUM | getKeywords() broken duplicate in pa-content.ts | Fixed cycle 8 |
| BUG-002 | MEDIUM | JWT no crypto verification | Fixed 2026-03-19 — jose + ES256 JWKS |
| BUG-003 | CRITICAL | RLS disabled on content tables | Fixed 2026-03-19 — RLS on 33+ tables |
| BUG-004 | HIGH | CORS wildcard "*" | Fixed 2026-03-19 |
| SEC-TELEGRAM | HIGH | Telegram webhook not hardened | Fixed 2026-03-19 |
| SEC-AI-INJECT | HIGH | AI prompt injection | Fixed 2026-03-19 |
| SEC-XSS | HIGH | dangerouslySetInnerHTML unsanitized | Fixed 2026-03-19 — DOMPurify |

| — | HIGH | platform_plans RLS too permissive | Fixed 2026-03-28 — restrict writes to service_role (fix/rls-platform-plans) |
| — | HIGH | WhatsApp tool call 100% failure (Claude→Gemini format) | Fixed 2026-03-28 — tool format adapter (#172) |
| — | MEDIUM | Auto-ingest embedding rate limit crash | Fixed 2026-03-28 — exponential backoff + content_hash (#171) |
| — | MEDIUM | Gamification dispatcher double badge XP | Fixed 2026-03-28 — advisory lock (fix/dispatcher-advisory-lock) |
| — | MEDIUM | summary_blocks schema out of sync with prod | Fixed 2026-03-28 — idempotent migration (fix/summary-blocks-schema-sync) |

## Security Audit Summary
Full 3-pass security audit completed 2026-03-19. Details in security-audit/ folder.
Major items resolved: RLS, JWT verification, CORS, XSS, AI injection, Telegram hardening, platform_plans RLS.
Remaining: ai_reading_config RLS, webhook salt, 401 interceptor, 3 SECURITY DEFINER functions (branch exists, no PR), 6 SQL REVOKEs (PRs #183/#184 ready).

### Security Fix Tracker (as of 2026-04-02)

| Bug ID | Fix | Status |
|---|---|---|
| BH-ERR-015 (SECURITY DEFINER) | Branch `fix/security-definer-search-path` | Needs PR creation |
| BH-ERR-016 (race conditions) | PR #182 (`xp-hooks.ts` + `streak-engine.ts`) | Ready for review |
| SEC-S9B (6 SQL REVOKE) | PRs #183 + #184 | Ready — merge #183 first |
