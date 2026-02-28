# Contract Audit Report — Axon v4.4

> **Date:** 2026-02-28  
> **Sources cross-referenced:** FRONTEND-DIAGNOSTIC.md, BACKEND-DIAGNOSTIC.md, ARCHITECTURE-PRACTICES.md, API-MAP.md, routes-study.md, routes-content.md, routes-auth.md, routes-courses.md, routes-institutions.md, routes-misc.md, 01-architecture.md, 02-data-hierarchy.md, 03-auth-and-roles.md, 04-api-conventions.md, 05-current-status.md, PLATFORM-CONTEXT.md, reference-data.ts, migration-guide.tsx

## Summary

| Category | Count | Status |
|---|---|---|
| Errors | 8 | All fixed |
| Gaps | 10 | All fixed |
| Inconsistencies | 3 | All fixed |
| Improvements | 4 | All applied |
| **Total** | **25** | **25/25 resolved** |

---

## ERRORS (8)

### AUD-01: Flashcards query param conflict
- **Issue:** routes-study.md says `?keyword_id`, reference-data.ts says `?summary_id`
- **Root cause:** Flashcards have BOTH FKs. CRUD factory parentKey config determines which works
- **Fix:** Added warning annotation. Agents should test both params

### AUD-02: Quiz-questions query param conflict  
- Same as AUD-01 for quiz-questions

### AUD-03: Videos query param conflict
- routes-content.md says `?keyword_id`, but data hierarchy corrects: FK is summary_id NOT keyword_id
- **Fix:** Contract correctly uses ?summary_id

### AUD-04: Response format mismatch — CRITICAL
- **Issue:** institutions, memberships, admin-scopes, keyword-connections, kw-prof-notes, reviews, quiz-attempts, daily-activities, fsrs-states, bkt-states return FLAT ARRAYS `{ data: [...] }`, NOT paginated `{ data: { items } }`
- **Fix:** Added GR-12 golden rule listing which routes use which format

### AUD-05: Reviews polymorphic structure conflict
- routes-study.md says `user_id, rating, flashcard_id/quiz_question_id` (OLD)
- 04-api-conventions.md says `session_id, item_id, instrument_type, grade` (CORRECTED)
- **Fix:** Contract follows corrected schema with warning

### AUD-06: ContentCascadeSelector created TWICE
- P0-09 creates it, A1-S5 also creates it at wrong path
- **Fix:** P0-09 is the sole creator at components/shared/. A1/A3 just USE it

### AUD-07: GR-01 protects file that P0-05 deletes
- GR-01 lists `contexts/AuthContext.tsx` as protected, but P0-05 moves it
- **Fix:** GR-01 applies AFTER Phase 0 completes

### AUD-08: Agent 5 modifies AppContext.tsx without ownership
- A5-S3 changes AppContext.tsx but it's not in filesOwned
- **Fix:** Added to Agent 5 filesOwned

---

## GAPS (10)

### AUD-09: Missing F-011 (node_modules in git)
- ALTA severity diagnostic with no Phase 0 task
- **Fix:** Added P0-10

### AUD-10: Missing F-016 (MUI 1MB+ evaluation)
- **Fix:** Added P0-11

### AUD-11: Missing F-018 (AuthContext backward-compat aliases)
- **Fix:** Added to P0-05 sub-task

### AUD-12: Subtopics entity completely missing
- 02-data-hierarchy.md shows subtopics under keywords with BKT states
- **Fix:** Added to Agent 3 scope

### AUD-13: Quizzes entity missing (separate from quiz-questions)
- /quizzes is a separate CRUD entity from /quiz-questions
- **Fix:** Added to Agent 1 API routes

### AUD-14: AI generation endpoints unassigned
- aiService.ts, aiFlashcardGenerator.ts, ai-generations
- **Fix:** Shared: Agent 1 (AI quiz), Agent 3 (AI flashcard)

### AUD-15: video-notes not covered
- CRUD factory entity in reference-data.ts
- **Fix:** Added to Agent 2

### AUD-16: 4 roles, not 3 — Admin under-covered
- Admin has SCOPED access via admin_scopes (scope_type: full/course/semester/section)
- **Fix:** Added clarification to Agent 4

### AUD-17: professor-routes.ts not owned by any agent
- Modified by Agents 1, 2, 3 but no single owner
- **Fix:** Added as shared file with append-only rule

### AUD-18: student-routes.ts same conflict
- **Fix:** Added as shared file with append-only rule

---

## INCONSISTENCIES (3)

### AUD-19: P0-09 depends on Agent 2 outputs
- ContentCascadeSelector uses content-tree, but Agent 2 refactors it later
- **Fix:** Moved P0-09 to Phase 1A or create basic version

### AUD-20: Agent 5 blocked by Agent 3 evaluation
- **Fix:** Agent 5 uses mastery-helpers for DISPLAY only. No blocking dependency

### AUD-21: ensureGeneralKeyword in file being replaced
- lib/api.ts being replaced by api-client.ts in P0-01
- **Fix:** Move ensureGeneralKeyword to services/content.ts

---

## IMPROVEMENTS (4)

### AUD-22: Response format annotation per route
- Added (paginated) vs (flat) suffixes

### AUD-23: order_index warning
- Added GR-11: use order_index, NEVER sort_order

### AUD-24: content_markdown warning
- Summary content field is content_markdown, not content

### AUD-25: BUILD-CRITICAL flag for A5-S1
- createStudySession/submitReview are MISSING and break the build
