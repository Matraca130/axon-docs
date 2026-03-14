# Known Bugs (Summary)

> **Updated:** 2026-03-14 (audit pass 15 — frontend 100% mapped, backend ~93 files LISTED, db.ts+auth-helpers READ)
> **Canonical source:** See root `KNOWN-BUGS.md` for full details with descriptions.

## Pending

| ID | Severity | Description | Status |
|---|---|---|---|
| BUG-001 | HIGH | `resolution_tier` vs `max_resolution` in Mux webhook | Pending |
| BUG-002 | MEDIUM | JWT not cryptographically verified locally | Mitigated (PostgREST validates). db.ts comments explicitly warn about non-DB routes |
| BUG-003 | CRITICAL | RLS disabled on content tables | Pending (backend enforces scoping via auth-helpers.ts) |
| BUG-004 | HIGH | **CORS wildcard — reverted to `"*"`** | **NOT FIXED** (confirmed in index.ts line-by-line) |
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
| BUG-028 | MEDIUM | architecture.ts (30KB) STALE docs-as-code in bundle | Tech debt / bundle |
| BUG-029 | LOW | Sidebar color mismatch: components.ts vs colors.ts | Inconsistency |
| **BUG-030** | **HIGH** | **Professor + Owner routes use PlaceholderPage despite REAL pages existing.** Professor has 16 ready pages + 38 sub-components. Owner has 8 ready pages (OwnerMembersPage 50KB, OwnerPlansPage 30KB). Router files (`professor-routes.ts`, `owner-routes.ts`) use `lazyPlaceholder()` instead of importing real pages from `roles/pages/`. | **Ready to wire up** |

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

All 25+ gamification bugs found and fixed same day. See root `KNOWN-BUGS.md` for details.
