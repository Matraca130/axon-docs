# Axon v4.5 — Known Bugs (Quick Reference)

> **Canonical list:** [`bugs/known-bugs.md`](bugs/known-bugs.md)
> **Security details:** [`bugs/security-audit.md`](bugs/security-audit.md)
> **Updated:** 2026-03-20 (added BUG-031, BUG-032 from QA/UX diagnostic)

---

## Open — By Severity

| ID | Sev | Summary | Location |
|---|---|---|---|
| BUG-001 | HIGH | `resolution_tier` vs `max_resolution` Mux webhook | Backend routes-models.ts |
| **BUG-030** | **HIGH** | **Professor + Owner routes use PlaceholderPage despite 16+8 real pages existing** | `professor-routes.ts`, `owner-routes.ts` vs `roles/pages/` |
| BUG-006 | MEDIUM | Content tree filters inactives in JS | Backend |
| BUG-021 | MEDIUM | GamificationContext is STUB (no-ops) | `context/GamificationContext.tsx` |
| BUG-025 | MEDIUM | ANON_KEY hardcoded in 3 files | `supabase.ts`, `config.ts`, `api.ts` |
| BUG-026 | MEDIUM | `'demo-student-001'` fallback studentId | `hooks/useSummaryPersistence.ts` |
| BUG-028 | MEDIUM | architecture.ts (30KB) stale docs-as-code in bundle | `design-system/architecture.ts` |
| BUG-011 | LOW | ~25 `kv_store_*` junk tables | DB |
| BUG-020 | LOW | `time_limit_seconds` sent but no DB column | `services/quizzesEntityApi.ts` |
| BUG-022 | LOW | apiConfig.ts duplicate fetch logic | `services/apiConfig.ts` |
| BUG-023 | LOW | aiFlashcardGenerator.ts dead code | `services/aiFlashcardGenerator.ts` |
| BUG-024 | LOW | Overlapping types kw-notes in 2 services | `studentNotesApi` vs `studentSummariesApi` |
| BUG-027 | LOW | Dual content tree impl (hook vs context) | `hooks/useContentTree` vs `context/ContentTreeContext` |
| BUG-029 | LOW | Sidebar color mismatch | `components.ts` vs `colors.ts` |
| **BUG-031** | **HIGH** | **AuthContext swallows 500 errors from /institutions — returns [] instead of error state, causing redirect loop to /select-org** | `context/AuthContext.tsx` |
| BUG-032 | LOW | 37 console.log statements in production code without `import.meta.env.DEV` guard (worst: useStudyPlans.ts has 18) | 14 files across src/ |
| SEC-S7 | LOW | JWT expiry 3600s (needs Supabase Pro for 300s) | Supabase config |
| SEC-S9B | MEDIUM | 6 SQL functions need REVOKE from authenticated (~12 callers must migrate to adminDb) | Backend DB |
| SEC-S16 | LOW | 13 low/info backlog items (package-lock, redirect validation, image domain allowlist, etc.) | Mixed |
| TEST-001 | LOW | Frontend tests failing on main (pre-existing) | Frontend test suite |
| TEST-002 | LOW | chunker.test.ts maxChunkSize assertion wrong (pre-existing) | Backend tests |

## Key Corrections (pass 15)

- Professor ROUTES = PlaceholderPage, but **16 real page files + 38 CMS components** exist in `roles/pages/professor/` + `components/professor/` -> ready to wire up (BUG-030)
- Owner ROUTES = PlaceholderPage, but **8 real pages** exist in `roles/pages/owner/` (OwnerMembersPage **50KB**, OwnerPlansPage 30KB) -> ready to wire up (BUG-030)
- Frontend total: **~350 component files** (not "~100+")
- Backend: **~93 files** in `supabase/functions/server/`
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

## Previously Resolved

BUG-005, BUG-008, BUG-009 (by design), BUG-010, BUG-012..014, RT-001..004, AUTH-DUAL, STALE-CHUNK.
All 25+ gamification bugs resolved 2026-03-13.

## Totals

| Severity | Open | Fixed |
|---|---|---|
| CRITICAL | 0 | 2 |
| HIGH | **3** | 7 |
| MEDIUM | **5** | 10 |
| LOW | **13** | 6 |
| **Total Open** | **21** | |
| **Total Fixed** | | **25+** |
