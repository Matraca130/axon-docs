# Known Bugs (Summary)

> **Updated:** 2026-03-20 (added BUG-031, BUG-032 from QA/UX diagnostic)
> **Canonical source:** See root `KNOWN-BUGS.md` for full details with descriptions.

## Pending

| ID | Severity | Description | Status |
|---|---|---|---|
| BUG-001 | HIGH | `resolution_tier` vs `max_resolution` in Mux webhook | Pending |
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
| **BUG-031** | **HIGH** | **AuthContext swallows 500 errors from /institutions — returns [] instead of error state, causing redirect loop to /select-org.** When backend returns 500 (e.g., missing `ai_model` column), AuthContext catches the error and sets memberships to `[]`, which triggers PostLoginRouter to redirect to `/select-org`, which fetches again, gets 500, loops. | Pending |
| BUG-032 | LOW | 37 `console.log` statements in production code without `import.meta.env.DEV` guard. Worst offender: `useStudyPlans.ts` (18 statements). Others: `useReviewBatch.ts` (4), `StudentDataContext.tsx`, `ContentTreeContext.tsx`, `api.ts` (3). | Tech debt |
| **BUG-030** | **HIGH** | **Professor + Owner routes use PlaceholderPage despite REAL pages existing.** Professor has 16 ready pages + 38 sub-components. Owner has 8 ready pages (OwnerMembersPage 50KB, OwnerPlansPage 30KB). Router files (`professor-routes.ts`, `owner-routes.ts`) use `lazyPlaceholder()` instead of importing real pages from `roles/pages/`. | **Ready to wire up** |
| SEC-S7 | LOW | JWT expiry 3600s — needs Supabase Pro plan to reduce to 300s | Blocked (plan upgrade) |
| SEC-S9B | MEDIUM | 6 SQL functions need REVOKE from authenticated (~12 callers must migrate to adminDb) | Pending migration |
| SEC-S16 | LOW | 13 low/info backlog items (package-lock.json, redirect validation, image domain allowlist, etc.) | Backlog |
| TEST-001 | LOW | Frontend tests failing on main (pre-existing, not from security changes) | Pre-existing |
| TEST-002 | LOW | chunker.test.ts maxChunkSize test assertion wrong | Pre-existing |

## Fixed — Security Audit (2026-03-19)

| ID | Severity | Description | When |
|---|---|---|---|
| BUG-003 / AUTH-001 | ~~CRITICAL~~ | RLS disabled on content tables — now enabled on 33+ tables with institution-scoped policies | 2026-03-19 |
| BUG-002 | ~~MEDIUM~~ | JWT not cryptographically verified locally — now uses jose + ES256 JWKS | 2026-03-19 |
| BUG-004 | ~~HIGH~~ | CORS wildcard `"*"` — removed, returns 403 for missing Origin | 2026-03-19 |
| SEC-TELEGRAM | ~~HIGH~~ | Telegram webhooks unhardened — timing-safe comparison, fail-closed, admin hardened | 2026-03-19 |
| SEC-AI-INJECT | ~~HIGH~~ | AI prompt injection — `sanitizeForPrompt()` on all 6 AI route files | 2026-03-19 |
| SEC-AI-OUTPUT | ~~MEDIUM~~ | AI output unsanitized — `stripHtmlTags` on all LLM output before DB insert | 2026-03-19 |
| SEC-ACCESS | ~~MEDIUM~~ | Access control gaps — bulk_reorder REVOKE, gamification institution scoping, SECURITY DEFINER hardened | 2026-03-19 |
| SEC-RATE-SIGNUP | ~~MEDIUM~~ | /signup not rate-limited — now 5 req/min | 2026-03-19 |
| SEC-ERR | ~~LOW~~ | Internal DB details in error messages — `safeErr()` strips internals | 2026-03-19 |
| SEC-XSS | ~~HIGH~~ | dangerouslySetInnerHTML unsanitized — DOMPurify on 6 components + enrichHtmlWithImages | 2026-03-19 |
| SEC-CSP | ~~MEDIUM~~ | No Content-Security-Policy — added (script-src self, no unsafe-eval) | 2026-03-19 |
| SEC-HSTS | ~~LOW~~ | No HSTS header — Strict-Transport-Security 2yr + includeSubDomains | 2026-03-19 |
| SEC-ROUTES | ~~MEDIUM~~ | Student routes missing RequireRole guards — added | 2026-03-19 |
| SEC-PERMS | ~~LOW~~ | No Permissions-Policy — microphone=self added | 2026-03-19 |

## Fixed — Previous

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
