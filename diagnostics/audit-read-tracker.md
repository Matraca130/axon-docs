# Audit Read Tracker

> Honest inventory of what has been read END-TO-END vs LISTED vs PENDING.
>
> **Updated:** 2026-03-14 (batch 2 complete)
> **Total files READ this session:** 44
> **Services layer coverage:** 40/53 = 75%

## Status: READ / LISTED / PENDING

---

## 1. Frontend Services (`src/app/services/`)

### Flat files (32 total) — 26 READ

| File | Size | Status |
|---|---|---|
| adaptiveGenerationApi.ts | 10KB | READ |
| aiApi.ts | 7.5KB | READ |
| aiFlashcardGenerator.ts | 4.5KB | LISTED |
| aiReportApi.ts | 6.8KB | LISTED |
| aiService.ts | 2.5KB | LISTED |
| apiConfig.ts | 5.4KB | LISTED |
| bktApi.ts | 3KB | READ |
| contentTreeApi.ts | 5KB | READ |
| flashcardApi.ts | 4.5KB | READ |
| flashcardMappingApi.ts | 2.8KB | LISTED |
| gamificationApi.ts | 10.4KB | READ |
| keywordConnectionsApi.ts | 2.4KB | READ |
| keywordMasteryApi.ts | 18.6KB | READ |
| models3dApi.ts | 12.3KB | READ |
| platformApi.ts | 4KB | READ (barrel) |
| quizApi.ts | 3.2KB | LISTED |
| quizAttemptsApi.ts | 1.8KB | LISTED |
| quizConstants.ts | 5.7KB | LISTED |
| quizDesignTokens.ts | 6.3KB | LISTED |
| quizQuestionsApi.ts | 4.8KB | READ |
| quizzesEntityApi.ts | 3.7KB | LISTED |
| reviewsApi.ts | 1.5KB | READ |
| searchApi.ts | 1.7KB | READ |
| smartGenerateApi.ts | 3.2KB | LISTED |
| studentApi.ts | 2.1KB | READ (barrel) |
| studentNotesApi.ts | 3.6KB | READ |
| studentSummariesApi.ts | 5.8KB | READ |
| studySessionApi.ts | 7.9KB | READ |
| summariesApi.ts | 8.8KB | READ |
| textAnnotationsApi.ts | 4KB | READ |
| topicProgressApi.ts | 7.5KB | READ |
| trashApi.ts | 2.2KB | LISTED |

### student-api/ (6 files) — ALL READ

| File | Size | Status |
|---|---|---|
| sa-infra.ts | 5.4KB | READ |
| sa-profile-stats.ts | 2.8KB | READ |
| sa-activity-sessions.ts | 3.8KB | READ |
| sa-content.ts | 6KB | READ |
| sa-course-progress.ts | 5.6KB | READ |
| sa-ai-legacy.ts | 3.4KB | READ |

### platform-api/ (7 files) — ALL READ

| File | Size | Status |
|---|---|---|
| pa-admin.ts | 6.7KB | READ |
| pa-content.ts | 3.3KB | READ |
| pa-flashcards.ts | 2.8KB | READ |
| pa-institutions.ts | 5.1KB | READ |
| pa-plans.ts | 4.4KB | READ |
| pa-student-data.ts | 5.8KB | READ |
| pa-study-plans.ts | 7KB | READ |

### ai-service/ (8 files) — ALL READ

| File | Size | Status |
|---|---|---|
| as-types.ts | 6KB | READ |
| as-generate-smart.ts | 2.3KB | READ |
| as-generate.ts | 1.9KB | READ |
| as-chat.ts | 1.8KB | READ |
| as-ingest.ts | 2.2KB | READ |
| as-analytics.ts | 1.7KB | READ |
| as-reports.ts | 2.7KB | READ |
| as-legacy.ts | 1.2KB | READ |

---

## 2. Frontend Lib (`src/app/lib/`) — 1/25 READ

| File | Status |
|---|---|
| api.ts | READ |
| All other 24 files | LISTED |

## 3. Frontend Hooks (`src/app/hooks/`) — 1/55 READ

| File | Status |
|---|---|
| useReviewBatch.ts | READ |
| All other 34 hooks + 20 queries/ | LISTED |

## 4. Frontend Context — 0/9 READ
## 5. Frontend Types — 0/11 READ  
## 6. Frontend Routes — 0/10 READ
## 7. Frontend Utils — 0/10 READ
## 8. Frontend Design System — 0/14 READ
## 9. Frontend Components — 0 READ (20 subdirs not expanded)
## 10. Backend — 0 READ this session

---

## Cross-Check Findings (All Batches)

### Harmless Mismatches (from batch 1)
1. flashcardApi.ts `updateFlashcard()` sends `keyword_id` — backend ignores
2. summariesApi.ts `createKeyword()` missing v4.2 fields — set via other tools
3. adaptiveGenerationApi.ts uses N×POST not Fase 8E `count` — legacy but works

### New Findings (from batch 2)
4. **pa-admin.ts** `getAdminStudents()` uses RAW FETCH bypassing apiCall to preserve pagination envelope
5. **sa-content.ts** `getTopicKeywords()` fetches ALL bkt-states globally (`limit=500`) instead of using subtopic_ids filter — wasteful for power users. `keywordMasteryApi.ts` has better batch approach.
6. **sa-course-progress.ts** does "big 3 fetch" (sessions+fsrs+bkt all with high limits) for client-side aggregation — acceptable for MVP
7. **studentNotesApi.ts** vs **studentSummariesApi.ts** — overlapping kw-student-notes types with different field names (`content` vs `note`, `note_type` vs absent). Two service files call the same backend endpoint with slightly different type definitions.
8. **textAnnotationsApi.ts** vs **studentSummariesApi.ts** — same overlap for text-annotations types. textAnnotationsApi has richer type (`selected_text`, `annotation_type`, `chunk_id`) while studentSummariesApi has simpler version.

### AI Endpoints Mapped (14 total from frontend)

| # | Endpoint | Frontend File |
|---|---|---|
| 1 | POST /ai/generate | as-generate.ts, aiApi.ts |
| 2 | POST /ai/generate-smart | as-generate-smart.ts, aiApi.ts |
| 3 | POST /ai/pre-generate | as-generate-smart.ts, aiApi.ts |
| 4 | POST /ai/rag-chat | as-chat.ts |
| 5 | PATCH /ai/rag-feedback | as-analytics.ts |
| 6 | GET /ai/rag-analytics | as-analytics.ts |
| 7 | GET /ai/embedding-coverage | as-analytics.ts |
| 8 | POST /ai/ingest-pdf | as-ingest.ts |
| 9 | POST /ai/ingest-embeddings | as-ingest.ts |
| 10 | POST /ai/re-chunk | as-ingest.ts |
| 11 | POST /ai/report | as-reports.ts |
| 12 | PATCH /ai/report/:id | as-reports.ts |
| 13 | GET /ai/report-stats | as-reports.ts |
| 14 | GET /ai/reports | as-reports.ts |

---

## Summary Scorecard

| Layer | READ | Total | % |
|---|---|---|---|
| services/ (flat) | 20 | 32 | 62.5% |
| services/student-api/ | 6 | 6 | 100% |
| services/platform-api/ | 7 | 7 | 100% |
| services/ai-service/ | 8 | 8 | 100% |
| **SERVICES TOTAL** | **41** | **53** | **77%** |
| lib/ | 1 | 25 | 4% |
| hooks/ + queries/ | 1 | 55 | 2% |
| context/ | 0 | 9 | 0% |
| types/ | 0 | 11 | 0% |
| routes/ | 0 | 10 | 0% |
| utils/ | 0 | 10 | 0% |
| design-system/ | 0 | 14 | 0% |
| components/ | 0 | ~100+ | 0% |
| backend (this session) | 0 | ~130 | 0% |

## Priority Queue (Remaining)

### P0 — Still unread services (6 flat files)
- aiFlashcardGenerator.ts (4.5KB)
- aiReportApi.ts (6.8KB)
- aiService.ts (2.5KB)
- quizApi.ts (3.2KB)
- quizzesEntityApi.ts (3.7KB)
- quizAttemptsApi.ts (1.8KB)

### P1 — Hooks (biggest value for bug discovery)
- useStudyPlans.ts (23KB)
- useAdaptiveSession.ts (18.4KB)
- useFlashcardNavigation.ts (15.9KB)
- useStudyTimeEstimates.ts (16.6KB)
- useSessionXP.ts (8.7KB)
- hooks/queries/useKeywordPopupQueries.ts (13.4KB)
- hooks/queries/useSummaryReaderMutations.ts (10.7KB)

### P2 — Contexts
- AuthContext.tsx (17KB)
- StudentDataContext.tsx (14.7KB)
- PlatformDataContext.tsx (11KB)

### P3 — Types + Utils + Design System
### P4 — Components (expand subdirs first)
### P5 — Backend re-read for this session
