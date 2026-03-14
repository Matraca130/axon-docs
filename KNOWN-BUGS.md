# Axon v4.5 — Known Bugs (Quick Reference)

> **Canonical list:** [`bugs/known-bugs.md`](bugs/known-bugs.md)  
> **Security details:** [`bugs/security-audit.md`](bugs/security-audit.md)  
> **Updated:** 2026-03-14 (audit pass 15 — ~630 files mapped, backend READ started)

---

## Open — By Severity

| ID | Sev | Summary | Location |
|---|---|---|---|
| BUG-003 | CRITICAL | RLS disabled on content tables | Backend DB |
| BUG-001 | HIGH | `resolution_tier` vs `max_resolution` Mux webhook | Backend routes-models.ts |
| BUG-004 | HIGH | **CORS wildcard `"*"` — confirmed in index.ts** | Backend index.ts |
| **BUG-030** | **HIGH** | **Professor + Owner routes use PlaceholderPage despite 16+8 real pages existing** | `professor-routes.ts`, `owner-routes.ts` vs `roles/pages/` |
| BUG-002 | MEDIUM | JWT no crypto verification locally (non-DB routes at risk) | Backend db.ts |
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

## Key Corrections (pass 15)

- Professor ROUTES = PlaceholderPage, but **16 real page files + 38 CMS components** exist in `roles/pages/professor/` + `components/professor/` → ready to wire up (BUG-030)
- Owner ROUTES = PlaceholderPage, but **8 real pages** exist in `roles/pages/owner/` (OwnerMembersPage **50KB**, OwnerPlansPage 30KB) → ready to wire up (BUG-030)
- Frontend total: **~350 component files** (not "~100+")
- Backend: **~93 files** in `supabase/functions/server/`
- Version mismatch: backend index.ts = **"4.4"**, docs = **"4.5"**

## Resolved

BUG-005, BUG-008, BUG-009 (by design), BUG-010, BUG-012..014, RT-001..004, AUTH-DUAL, STALE-CHUNK.  
All 25+ gamification bugs resolved 2026-03-13.

## Totals

| Severity | Open | Fixed |
|---|---|---|
| CRITICAL | 1 | 1 |
| HIGH | **3** | 2 |
| MEDIUM | 5 | 4 |
| LOW | 7 | 2 |
| **Total Open** | **16** | |
