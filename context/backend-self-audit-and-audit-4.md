# Backend Self-Audit + Audit #4 — Regression Detection & Fresh Deep Pass

**Date:** 2026-02-27  
**Auditor:** AI assistant (auditing own previous work)  
**Scope:** Full re-read of all 16 files + verification of every fix from audits #1-3  
**Previous audits:**
- Audit #1: `backend-architecture-audit.md` (M-1..M-5, all done)
- Audit #2: `backend-deep-audit-2.md` (N-1..N-10, 8/10 done)
- Audit #3: `backend-deep-audit-3.md` (O-1..O-8, 4/8 done)

**Overall grade: A** (holds — regressions caught and fixed before reaching users)

> **STATUS:** All 8 items completed.

---

## Methodology

1. Re-read all 16 backend files from GitHub HEAD
2. Verify each of the 17 previously completed fixes is correct
3. Check for regressions introduced by the fixes
4. Perform a completely fresh line-by-line audit looking for new issues

---

## Part 1: Regressions in My Own Changes

### P-1: REGRESSION — Search Path Truncation (from N-1 fix) ✅ FIXED

**Commit:** `321d350`  
**Severity:** HIGH  

My N-1 batch path resolution for keywords/videos only resolved one level up:
```
Original buildParentPath: Course > Semester > Topic > Summary
My N-1 fix:               Topic > Summary
```
The `summaryPathMap` query was `select("id, title, topics(name)")` — missing `sections`, `semesters`, and `courses` in the embedded select.

**Fix:** Changed to `select("id, title, topics(name, sections(name, semesters(name, courses(name))))")`
and rebuilt the full path from the nested result.

### P-2: INCOMPLETE — Pagination Cap Only in Factory (from N-9 fix) ✅ FIXED

**Commits:** `3c6b17b` + `931635c`  
**Severity:** MEDIUM  

The `parsePagination()` helper was only used in `crud-factory.ts`. Four manual routes bypassed it:
- `routes-study.tsx`: daily-activities, fsrs-states, bkt-states
- `routes-plans.tsx`: ai-generations

All four used raw `parseInt` with no max cap. Client could request `limit=1000000`.

**Fix:** Added inline pagination caps (max 500) to all four routes.

### P-3: INCOMPLETE — O-1 Fix Missing Double Quote Escaping ✅ FIXED

**Commit:** `321d350`  
**Severity:** MEDIUM  

My O-1 fix quoted or() values with `"..."` to handle commas, but didn't escape literal double quotes in the search query. Searching for `he said "hello"` would break the PostgREST filter.

**Fix:** Added `escapeOrQuote()` function that doubles `"` to `""` per PostgREST spec.

### P-4: INCOMPLETE — O-2 Fix Missing in Upload Route ✅ FIXED

**Commit:** `dd71673`  
**Severity:** LOW  

My O-2 fix converted `signed-url` and `delete` routes to use `safeJson()`, but missed the `upload` route's JSON path which also used raw `c.req.json()`.

**Fix:** Replaced with `safeJson(c)` + null check.

---

## Part 2: New Findings (Fresh Audit)

### P-5: No Password Max Length in Signup ✅ FIXED

**Commit:** `dd71673`  
**Severity:** LOW  

A client could send a multi-MB password string, wasting a network round-trip to Supabase Auth before rejection.

**Fix:** `if (password.length > 128) return err(...)` added after the min-length check.

### P-6: GET /me Auto-Profile Race Condition ✅ FIXED

**Commit:** `dd71673`  
**Severity:** LOW  

Two concurrent `/me` requests for a user without a profile row would both detect PGRST116 and try to INSERT. The second would fail with a duplicate key error → 500.

**Fix:** Changed `.insert()` to `.upsert({ onConflict: "id" })`. The second request simply updates (no-op) instead of failing.

### P-7: No Batch Size Limit on Signed-URL Paths ✅ FIXED

**Commit:** `dd71673`  
**Severity:** LOW  

A client could send 10,000 paths in a single `POST /storage/signed-url` batch request.

**Fix:** `if (body.paths.length > 100) return err(...)` — cap at 100 paths per batch.

### P-8: Off-By-One Second in Daily Usage Count ✅ FIXED

**Commit:** `931635c`  
**Severity:** LOW  

`GET /usage-today` used `.lt("created_at", "${today}T23:59:59Z")` which missed the final second of the day (23:59:59.001 through 23:59:59.999).

**Fix:** Compute tomorrow's date and use `.lt("created_at", "${tomorrow}T00:00:00Z")` for proper boundary.

---

## Cross-Audit Summary: All 4 Audits

| Audit | Findings | Completed | Deferred |
|-------|----------|-----------|----------|
| #1 (M-1..M-5) | 5 | 5/5 ✅ | 0 |
| #2 (N-1..N-10) | 10 | 8/10 | 2 (billing + security) |
| #3 (O-1..O-8) | 8 | 4/8 | 4 (RLS + billing + data + launch) |
| #4 Self-audit (P-1..P-8) | 8 | 8/8 ✅ | 0 |

**Total: 31 findings across 4 audits. 25 completed. 6 deferred to appropriate phases.**

### All Backend Commits (chronological)

| Commit | Changes |
|--------|---------|
| `54ff57d` | M-5: remove phantom duration_seconds |
| `e92fa06` | M-4: delete admin-routes.tsx |
| `c4c1a5d` | M-4: delete owner-routes.tsx |
| `899a26f` | M-3: bulk_reorder() DB function |
| `49ae13d` | M-1: study-queue Promise.all |
| `f40d349` | N-6, N-1, N-2, N-8, N-9 |
| `b1bd2c0` | N-7: upsert_video_view() |
| `3954c10` | O-1, O-2, O-5, O-6 |
| `321d350` | P-1 (path regression), P-3 (quote escaping) |
| `dd71673` | P-4 (upload safeJson), P-5 (password cap), P-6 (upsert profile), P-7 (batch limit) |
| `3c6b17b` | P-2: pagination caps in routes-study.tsx |
| `931635c` | P-2 + P-8: pagination cap + date boundary in routes-plans.tsx |
