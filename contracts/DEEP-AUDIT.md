# Deep Cross-Reference Audit — Axon v4.4

> **Date:** 2026-02-28  
> **Method:** Line-by-line reading of REAL backend code (axon-backend) + REAL frontend code (numero1_sseki_2325_55) + all diagnostic documents  
> **Backend files read:** index.ts, crud-factory.ts, routes-content.tsx, routes-study.tsx, routes-student.tsx, routes-models.tsx, db.ts  
> **Frontend files verified:** 15 service files, 10 lib files, 5 type files, context/, contexts/, data/  

## Summary

| Category | Count |
|---|---|
| Backend vs Contract | 11 |
| Frontend vs Contract | 8 |
| Cross-Stack | 4 |
| Diagnostic vs Reality | 4 |
| Contract Internal | 4 |
| **Total** | **31** |

| Severity | Count |
|---|---|
| Critical | 5 |
| High | 12 |
| Medium | 14 |

---

## CRITICAL FINDINGS (5)

### DA-01: model-3d-notes parentKey is 'model_id', NOT 'pin_id'
- **Evidence:** routes-models.tsx: `parentKey: "model_id"`. Contract says `?pin_id=xxx`.
- **Impact:** Agent 6 3D viewer would 400 on all note fetches.

### DA-02: quiz_questions required fields WRONG
- **Evidence:** routes-student.tsx: requiredFields: `['keyword_id', 'question_type', 'question', 'correct_answer']`. summary_id is auto-set via parentKey.
- **Impact:** Agent 1 would send wrong fields.

### DA-03: flashcards required fields incomplete
- **Evidence:** routes-student.tsx: requiredFields: `['keyword_id', 'front', 'back']`. Not difficulty/priority as contract implies.
- **Impact:** Agent 3 might skip keyword_id.

### DA-24: Frontend flashcardApi.ts may use WRONG parentKey
- **Evidence:** Backend requires `?summary_id=xxx` (parentKey). Old docs said `?keyword_id`. Frontend file may use old param.
- **Impact:** All flashcard listing would 400.

### DA-25: reviews schema mismatch between docs and real code
- **Evidence:** Real: session_id, item_id, instrument_type, grade [0-5]. Old docs: user_id, rating, flashcard_id/quiz_question_id.
- **Impact:** Frontend review submission would completely fail.

---

## CRITICAL ParentKey Map (verified from routes-student.tsx, routes-content.tsx, routes-models.tsx)

| Entity (slug) | parentKey (required) | Optional Filters | Soft Delete? |
|---|---|---|---|
| flashcards | summary_id | keyword_id, subtopic_id | Yes |
| quiz-questions | summary_id | keyword_id, question_type, difficulty, subtopic_id, quiz_id | Yes |
| quizzes | summary_id | source, is_active | Yes |
| videos | summary_id | — | Yes |
| keywords | summary_id | — | Yes |
| subtopics | keyword_id | — | Yes |
| summary-blocks | summary_id | — | No |
| kw-student-notes | keyword_id | (auto-scoped to user) | Yes (no is_active) |
| text-annotations | summary_id | (auto-scoped to user) | Yes (no is_active) |
| video-notes | video_id | (auto-scoped to user) | Yes (no is_active) |
| model-3d-notes | model_id | (auto-scoped to user) | Yes (no is_active) |
| model-3d-pins | model_id | keyword_id | No (hard delete) |

---

## HIGH FINDINGS (12)

### DA-04: summary_blocks missing from contract
Backend has `summary-blocks` CRUD (Smart Reader feature). No agent owns it.

### DA-05: study_sessions required field is 'session_type'
Not user_id/topic_id as old docs say. student_id is auto-scoped.

### DA-06: reviews grade must be in [0,5]
Contract says 'INTEGER' without range.

### DA-07: quiz_attempts structure undocumented
Requires: quiz_question_id, answer, is_correct. Optional: session_id, time_taken_ms.

### DA-12: DUPLICATE 3D API files
lib/model3d-api.ts (8.4KB) AND services/models3dApi.ts (5.7KB) both exist.

### DA-13: 3 API files in lib/ should be in services/
lib/model3d-api.ts, lib/muxApi.ts, lib/studyQueueApi.ts.

### DA-14: Frontend already has 7 split service files
Contract understates progress. platformApi.ts is still 26KB but partial split exists.

### DA-15: keywordManager.ts (8.5KB) unassigned
### DA-16: spacedRepetition.ts (16.3KB) unassigned
### DA-19: studentApi.ts (11.8KB) unassigned
### DA-27: 13 frontend files total are orphaned
### DA-28: quiz-attempts auto-scopes student_id

---

## See interactive app for full details of all 31 findings.
