# Axon v4.5 — Known Bugs (Quick Reference)

> **Canonical list:** [`bugs/known-bugs.md`](bugs/known-bugs.md)
> **Security details:** [`bugs/security-audit.md`](bugs/security-audit.md)
> **Updated:** 2026-03-20 (resolved BUG-020/026/033; BUG-025 reclassified to INFO; BUG-034 location corrected; resolved BUG-028..032; BUG-022/023 reclassified to INFO; resolved BUG-035, TEST-002, TEST-003)

---

## Open — By Severity

| ID | Sev | Summary | Location |
|---|---|---|---|
| BUG-001 | HIGH | `resolution_tier` vs `max_resolution` Mux webhook | Backend routes-models.ts |
| BUG-006 | MEDIUM | Content tree filters inactives in JS | Backend |
| BUG-021 | MEDIUM | GamificationContext is STUB (no-ops) | `context/GamificationContext.tsx` |
| BUG-025 | INFO | ANON_KEY hardcoded in 3 files — by design, Supabase ANON_KEY is a public gateway key, not a secret. Standard Supabase pattern. | `supabase.ts`, `config.ts`, `api.ts` |
| BUG-011 | LOW | ~25 `kv_store_*` junk tables | DB |
| BUG-022 | INFO | apiConfig.ts duplicate fetch logic -- NOT dead code, used by `models3dApi.ts` | `services/apiConfig.ts` |
| BUG-023 | INFO | aiFlashcardGenerator.ts -- NOT dead code, used by `SmartFlashcardGenerator.tsx` | `services/aiFlashcardGenerator.ts` |
| BUG-024 | LOW | Overlapping types kw-notes in 2 services | `studentNotesApi` vs `studentSummariesApi` |
| BUG-027 | LOW | Dual content tree impl (hook vs context) | `hooks/useContentTree` vs `context/ContentTreeContext` |
| SEC-S7 | LOW | JWT expiry 3600s (needs Supabase Pro for 300s) | Supabase config |
| SEC-S9B | MEDIUM | 6 SQL functions need REVOKE from authenticated (~12 callers must migrate to adminDb) | Backend DB |
| SEC-S16 | LOW | 13 low/info backlog items (package-lock, redirect validation, image domain allowlist, etc.) | Mixed |
| TEST-001 | LOW | Frontend tests failing on main (pre-existing) | Frontend test suite |
| BUG-034 | LOW | `GET /reading-states?limit=1000` returns 400 — likely missing required parent param | `services/studentSummariesApi.ts` + `hooks/queries/useStudyHubProgress.ts` |

## Key Corrections (pass 15)

- ~~Professor ROUTES = PlaceholderPage~~ **RESOLVED** -- all 13 routes wired to real page components (PR #150)
- ~~Owner ROUTES = PlaceholderPage~~ **RESOLVED** -- all 13 routes wired to real page components (PR #150)
- Frontend total: **~350 component files** (not "~100+")
- Backend: **~103 files** in `supabase/functions/server/`
- Version mismatch: backend index.ts = **"4.4"**, docs = **"4.5"**

## Resolved — Security Audit (2026-03-19)

| ID | Sev | Summary | Resolution |
|---|---|---|---|
| BUG-003 / AUTH-001 | ~~CRITICAL~~ | RLS disabled on content tables | **RESOLVED 2026-03-19** — RLS enabled on 33+ tables, institution-scoped policies, `auth.user_institution_ids()` helper |
| BUG-002 | ~~MEDIUM~~ | JWT no crypto verification locally | **RESOLVED 2026-03-19** — jose + ES256 JWKS cryptographic verification |
| BUG-004 | ~~HIGH~~ | CORS wildcard `"*"` | **RESOLVED 2026-03-19** — returns 403 for missing Origin, no wildcard fallback |
| SEC-TELEGRAM | ~~HIGH~~ | Telegram webhook not hardened | **RESOLVED 2026-03-19** — timing-safe comparison, fail-closed, admin routes hardened |
| SEC-AI-INJECT | ~~HIGH~~ | AI prompt injection unmitigated | **RESOLVED 2026-03-19** — `sanitizeForPrompt()` on all 6 AI route files |
| SEC-AI-OUTPUT | ~~MEDIUM~~ | AI output not sanitized before DB insert | **RESOLVED 2026-03-19** — `stripHtmlTags` on all LLM output (flashcards + quizzes) |
| SEC-ACCESS | ~~MEDIUM~~ | bulk_reorder open, gamification unscoped | **RESOLVED 2026-03-19** — REVOKE, institution scoping, SECURITY DEFINER hardened |
| SEC-RATE | ~~MEDIUM~~ | /signup not rate-limited | **RESOLVED 2026-03-19** — 5 req/min on signup |
| SEC-ERR | ~~LOW~~ | Internal DB details leaked in errors | **RESOLVED 2026-03-19** — `safeErr()` strips internals |
| SEC-XSS | ~~HIGH~~ | dangerouslySetInnerHTML unsanitized | **RESOLVED 2026-03-19** — DOMPurify on 6 components + enrichHtmlWithImages |
| SEC-CSP | ~~MEDIUM~~ | No Content-Security-Policy | **RESOLVED 2026-03-19** — CSP header (script-src self, no unsafe-eval) |
| SEC-HSTS | ~~LOW~~ | No HSTS header | **RESOLVED 2026-03-19** — Strict-Transport-Security 2yr + includeSubDomains |
| SEC-ROUTES | ~~MEDIUM~~ | Student routes missing RequireRole guards | **RESOLVED 2026-03-19** — RequireRole on student routes |
| SEC-PERMS | ~~LOW~~ | No Permissions-Policy header | **RESOLVED 2026-03-19** — microphone=self for voice features |

## Resolved — 2026-03-20

| ID | Sev | Summary | Resolution |
|---|---|---|---|
| BUG-035 | ~~HIGH~~ | AI Chat streaming broken — backend checked `?stream=1` URL param but frontend sent `stream: true` in POST body. AI Assistant showed empty responses. | **RESOLVED 2026-03-20** — backend PR #149 (check body.stream), frontend PR #148 (add `?stream=1` to URL). Both merged to main. |
| BUG-028 | ~~LOW~~ | architecture.ts (30KB) stale docs-as-code in bundle | **RESOLVED 2026-03-20** — 582-line file deleted + stale config references cleaned. PRs #149, #153. |
| BUG-029 | ~~LOW~~ | Sidebar color mismatch (`components.ts` vs `colors.ts`) | **RESOLVED 2026-03-20** — Fixed by PR #139 (design tokens audit). |
| BUG-030 | ~~HIGH~~ | Professor + Owner routes use PlaceholderPage despite 16+8 real pages existing | **RESOLVED 2026-03-20** — All 13 routes wired to real page components. PR #150. |
| BUG-031 | ~~HIGH~~ | AuthContext swallows 500 errors from /institutions — redirect loop to /select-org | **RESOLVED 2026-03-20** — authError state added, fetchInstitutions throws on error, loadSession returns structured result. PR #155. |
| BUG-032 | ~~LOW~~ | console.log statements in production without `import.meta.env.DEV` guard | **RESOLVED 2026-03-20** — console.error in ContentTreeContext guarded with `import.meta.env.DEV`. PR #151. (Other files were already guarded.) |
| BUG-020 | ~~LOW~~ | `time_limit_seconds` sent but no DB column | **RESOLVED 2026-03-20** — stripped from API payloads in createQuiz/updateQuiz. PR #158. |
| BUG-026 | ~~MEDIUM~~ | `'demo-student-001'` fallback studentId | **RESOLVED 2026-03-20** — removed hardcoded fallback, persistence skipped when no user. PR #159. |
| BUG-033 | ~~MEDIUM~~ | `useTopicMastery` calls `GET /flashcards?status=published&limit=500` without required `summary_id` param — backend returns 400, FSRS per-topic aggregation silently fails | **RESOLVED 2026-03-20** — switched to per-topic endpoint getFlashcardsByTopic. PR #160. |
| TEST-002 | ~~LOW~~ | chunker.test.ts maxChunkSize assertion wrong (`>` should be `>=` for dense sentences) | **RESOLVED 2026-03-20** — assertion fixed, PR #118 merged |
| TEST-003 | ~~MEDIUM~~ | Backend CI tests failing — xp_engine_test.ts syntax error, xp_hooks_test.ts leaking ops, chunker.test.ts flaky assertion, missing `--allow-env`/`--allow-net` flags | **RESOLVED 2026-03-20** — PR #118 merged with all fixes + test-gate.yml updated |

## Previously Resolved

BUG-005, BUG-008, BUG-009 (by design), BUG-010, BUG-012..014, RT-001..004, AUTH-DUAL, STALE-CHUNK.
All 25+ gamification bugs resolved 2026-03-13.

## Totals

| Severity | Open | Fixed |
|---|---|---|
| CRITICAL | 0 | 2 |
| HIGH | **1** | 10 |
| MEDIUM | **3** | 13 |
| LOW | **7** | 12 |
| INFO | 3 | — |
| **Total Open** | **14** | |
| **Total Fixed** | | **37+** |
