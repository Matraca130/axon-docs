# Known Bugs (Summary)

> **Updated:** 2026-03-14 (audit pass 13 — 194 READ + ~130 LISTED)
> **Canonical source:** See root `KNOWN-BUGS.md` for full details with descriptions.

## Pending

| ID | Severity | Description | Status |
|---|---|---|---|
| BUG-001 | HIGH | `resolution_tier` vs `max_resolution` in Mux webhook | Pending |
| BUG-002 | MEDIUM | JWT not cryptographically verified locally | Mitigated (PostgREST validates) |
| BUG-003 | CRITICAL | RLS disabled on content tables | Pending (backend enforces scoping) |
| BUG-004 | HIGH | **CORS wildcard — reverted to `"*"`** | **NOT FIXED** (was fixed then reverted) |
| BUG-006 | MEDIUM | Content tree filters inactives in JS | Pending |
| BUG-007 | MEDIUM | Search still uses multiple queries | Partially mitigated (trigram + RPC) |
| BUG-011 | LOW | ~25 `kv_store_*` junk tables | Pending (safe to drop) |
| BUG-020 | LOW | quizzesEntityApi sends `time_limit_seconds`, backend lacks column | Pending |
| BUG-021 | MEDIUM | GamificationContext is STUB — all methods are no-ops | Pending (TODO Sprint G5) |
| BUG-022 | LOW | apiConfig.ts duplicate fetch logic (redundant with lib/api.ts) | Tech debt |
| BUG-023 | LOW | aiFlashcardGenerator.ts is dead code (wraps fn returning []) | Tech debt |
| BUG-024 | LOW | Overlapping types for kw-student-notes in 2 service files | Tech debt |
| BUG-025 | MEDIUM | supabase.ts + config.ts + lib/api.ts = 3 copies of hardcoded ANON_KEY | Pending |
| BUG-026 | MEDIUM | useSummaryPersistence uses 'demo-student-001' fallback studentId | Risk: data leakage |
| BUG-027 | LOW | hooks/useContentTree.ts vs context/ContentTreeContext.tsx — dual impl | Tech debt |
| **BUG-028** | MEDIUM | architecture.ts (30KB) STALE docs-as-code in bundle. Lists 5 services (real: 53), old endpoints, old nav. Not re-exported but Vite processes it. | Tech debt / bundle |
| **BUG-029** | LOW | Sidebar color mismatch: components.ts `bgOuter: '#1c1c1e'` vs colors.ts `dark.navBar: '#1B3B36'` | Inconsistency |

## Fixed

| ID | Severity | Description | When |
|---|---|---|---|
| BUG-005 | ~~LOW~~ | Study queue sequential queries | Fixed (RPC + fallback) |
| BUG-008 | ~~LOW~~ | Reorder N individual UPDATEs | Fixed (`bulk_reorder()` RPC) |
| BUG-009 | — | `flashcards.keyword_id` nullable vs required | By design |
| BUG-010 | ~~CRITICAL~~ | Frontend build roto (missing study APIs) | 2026-03-13 |
| RT-001..004 | ~~HIGH~~ | Runtime payload bugs (wrong column names) | 2025-02-27 |
| BUG-012 | ~~MEDIUM~~ | Reviews payload mismatch | 2025-02-27 |
| BUG-013 | ~~MEDIUM~~ | Study sessions payload mismatch | 2025-02-27 |
| BUG-014 | ~~LOW~~ | Bundle size 3.2 MB single chunk | Fixed (code splitting) |
| AUTH-DUAL | ~~HIGH~~ | Dual AuthContext `createContext()` | 2026-03-13 |
| STALE-CHUNK | ~~MEDIUM~~ | Stale chunk errors post-deploy | 2026-03-14 |

## Gamification Bugs (all resolved 2026-03-13)

All 25+ gamification bugs (G-001..G-015, A-001..A-014, B-001..B-004, D-1..D-6, S3-001..S3-004) were found and fixed in the same day. See root `KNOWN-BUGS.md` for details.

## Duplicate Index Cleanup

- ~25 `kv_store_*` tables dropped (~150 junk indexes)
- 6 duplicate indexes on legitimate tables dropped
- See `database/rls-and-indexes.md` for cleanup log
