# Axon v4.5 — Known Bugs (Quick Reference)

> **Canonical list:** [`bugs/known-bugs.md`](bugs/known-bugs.md)  
> **Security details:** [`bugs/security-audit.md`](bugs/security-audit.md)  
> **Updated:** 2026-03-14 (audit pass 12 — 180 frontend files read)

---

## Open — By Severity

| ID | Sev | Summary | Location |
|---|---|---|---|
| BUG-003 | CRITICAL | RLS disabled on content tables | Backend DB |
| BUG-001 | HIGH | `resolution_tier` vs `max_resolution` Mux webhook | Backend |
| BUG-004 | HIGH | **CORS wildcard `"*"` — reverted for MVP** | Backend index.ts |
| BUG-002 | MEDIUM | JWT no crypto verification local | Backend db.ts |
| BUG-006 | MEDIUM | Content tree filters inactives in JS | Backend |
| BUG-021 | MEDIUM | GamificationContext is STUB (no-ops) | `context/GamificationContext.tsx` |
| BUG-025 | MEDIUM | ANON_KEY hardcoded in 3 files | `supabase.ts`, `config.ts`, `api.ts` |
| BUG-026 | MEDIUM | `'demo-student-001'` fallback studentId | `hooks/useSummaryPersistence.ts` |
| BUG-011 | LOW | ~25 `kv_store_*` junk tables | DB |
| BUG-020 | LOW | `time_limit_seconds` sent but no DB column | `services/quizzesEntityApi.ts` |
| BUG-022 | LOW | apiConfig.ts duplicate fetch logic | `services/apiConfig.ts` |
| BUG-023 | LOW | aiFlashcardGenerator.ts dead code | `services/aiFlashcardGenerator.ts` |
| BUG-024 | LOW | Overlapping types kw-notes in 2 services | `studentNotesApi` vs `studentSummariesApi` |
| BUG-027 | LOW | Dual content tree impl (hook vs context) | `hooks/useContentTree` vs `context/ContentTreeContext` |

## Resolved

BUG-005, BUG-008, BUG-009 (by design), BUG-010, BUG-012..014 (payload/bundle), RT-001..004, AUTH-DUAL, STALE-CHUNK.  
All 25+ gamification bugs (G/A/B/D/S3 series) resolved 2026-03-13.

## Totals

| Severity | Open | Fixed |
|---|---|---|
| CRITICAL | 1 | 1 |
| HIGH | 2 | 2 |
| MEDIUM | 4 | 4 |
| LOW | 5 | 2 |
