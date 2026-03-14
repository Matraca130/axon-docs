# Audit Read Tracker

> Honest inventory of what has been read END-TO-END (full file content downloaded and analyzed)
> vs what has only been LISTED (directory listing) vs what is PENDING (never touched).
>
> **Updated:** 2026-03-14 (audit pass 12)
> **Session:** Figma Make cross-check session

## Status Legend

- READ = Full file content downloaded and analyzed line-by-line
- LISTED = Directory listing only (know file exists, size, name)
- PENDING = Never accessed in any way
- PRIOR = Read in prior audit sessions (passes 1-11), not re-read this session

---

## 1. Frontend (`numero1_sseki_2325_55`)

### src/app/lib/ (25 files + 1 subdir)

| File | Size | Status | Notes |
|---|---|---|---|
| api.ts | 5KB | READ | Central wrapper, dual-token, GET dedup |
| api-helpers.ts | 1.7KB | LISTED | |
| concurrency.ts | 1.6KB | LISTED | parallelWithLimit |
| config.ts | 0.8KB | LISTED | |
| connection-types.ts | 4.5KB | LISTED | V2 keyword connection types |
| content-tree-helpers.ts | 2.2KB | LISTED | |
| date-utils.ts | 0.9KB | LISTED | |
| error-utils.ts | 2KB | LISTED | |
| flashcard-export.ts | 3.2KB | LISTED | |
| flashcard-utils.ts | 2KB | LISTED | |
| grade-mapper.ts | 6.5KB | LISTED | |
| keyword-scroll-helpers.ts | 3.9KB | LISTED | |
| logger.ts | 3.2KB | LISTED | |
| mastery-helpers.ts | 2.8KB | LISTED | |
| model3d-api.ts | 11.7KB | LISTED | |
| muxApi.ts | 2.3KB | LISTED | |
| palette.ts | 1.7KB | LISTED | |
| queryClient.ts | 0.9KB | LISTED | |
| quiz-utils.ts | 1.9KB | LISTED | |
| session-stats.ts | 3KB | LISTED | |
| sessionAnalytics.ts | 7.4KB | LISTED | |
| studyQueueApi.ts | 2.7KB | LISTED | |
| summary-content-helpers.tsx | 7KB | LISTED | |
| supabase.ts | 1.2KB | LISTED | |
| withBoundary.tsx | 1.7KB | LISTED | |
| xp-constants.ts | 2.5KB | LISTED | |
| __tests__/ | dir | LISTED | |

**Score: 1/25 READ (4%)**

### src/app/services/ (32 files + 4 subdirs)

| File | Size | Status | Notes |
|---|---|---|---|
| adaptiveGenerationApi.ts | 10KB | READ | N x POST /ai/generate-smart |
| aiApi.ts | 7.5KB | LISTED | |
| aiFlashcardGenerator.ts | 4.5KB | LISTED | |
| aiReportApi.ts | 6.8KB | LISTED | |
| aiService.ts | 2.5KB | LISTED | |
| apiConfig.ts | 5.4KB | LISTED | |
| bktApi.ts | 3KB | READ | /bkt-states verified |
| contentTreeApi.ts | 5KB | LISTED | |
| flashcardApi.ts | 4.5KB | READ | CRUD verified |
| flashcardMappingApi.ts | 2.8KB | LISTED | |
| gamificationApi.ts | 10.4KB | READ | 13 endpoints verified |
| keywordConnectionsApi.ts | 2.4KB | READ | 4 functions verified |
| keywordMasteryApi.ts | 18.6KB | LISTED | BIGGEST service file |
| models3dApi.ts | 12.3KB | LISTED | |
| platformApi.ts | 4KB | LISTED | |
| quizApi.ts | 3.2KB | LISTED | |
| quizAttemptsApi.ts | 1.8KB | LISTED | |
| quizConstants.ts | 5.7KB | LISTED | |
| quizDesignTokens.ts | 6.3KB | LISTED | |
| quizQuestionsApi.ts | 4.8KB | READ | CRUD verified |
| quizzesEntityApi.ts | 3.7KB | LISTED | |
| reviewsApi.ts | 1.5KB | READ | POST /reviews verified |
| searchApi.ts | 1.7KB | LISTED | |
| smartGenerateApi.ts | 3.2KB | LISTED | |
| studentApi.ts | 2.1KB | READ | Barrel re-exporter |
| studentNotesApi.ts | 3.6KB | LISTED | |
| studentSummariesApi.ts | 5.8KB | LISTED | |
| studySessionApi.ts | 7.9KB | READ | 6 functions verified |
| summariesApi.ts | 8.8KB | READ | Full CRUD verified |
| textAnnotationsApi.ts | 4KB | LISTED | |
| topicProgressApi.ts | 7.5KB | READ | Unified + fallback verified |
| trashApi.ts | 2.2KB | LISTED | |

**Score: 12/32 READ (37.5%)**

#### services/student-api/ (6 files)

| File | Size | Status |
|---|---|---|
| sa-activity-sessions.ts | 3.8KB | LISTED |
| sa-ai-legacy.ts | 3.4KB | LISTED |
| sa-content.ts | 6KB | LISTED |
| sa-course-progress.ts | 5.6KB | LISTED |
| sa-infra.ts | 5.4KB | LISTED |
| sa-profile-stats.ts | 2.8KB | LISTED |

**Score: 0/6 READ (0%)**

#### services/ai-service/ (8 files)

| File | Size | Status |
|---|---|---|
| as-analytics.ts | 1.7KB | LISTED |
| as-chat.ts | 1.8KB | LISTED |
| as-generate-smart.ts | 2.3KB | LISTED |
| as-generate.ts | 1.9KB | LISTED |
| as-ingest.ts | 2.2KB | LISTED |
| as-legacy.ts | 1.2KB | LISTED |
| as-reports.ts | 2.7KB | LISTED |
| as-types.ts | 6KB | LISTED |

**Score: 0/8 READ (0%)**

#### services/platform-api/ (7 files + 1 README)

| File | Size | Status |
|---|---|---|
| pa-admin.ts | 6.7KB | LISTED |
| pa-content.ts | 3.3KB | LISTED |
| pa-flashcards.ts | 2.8KB | LISTED |
| pa-institutions.ts | 5.1KB | LISTED |
| pa-plans.ts | 4.4KB | LISTED |
| pa-student-data.ts | 5.8KB | LISTED |
| pa-study-plans.ts | 7KB | LISTED |

**Score: 0/7 READ (0%)**

### src/app/hooks/ (35 files + 1 subdir)

| File | Size | Status | Notes |
|---|---|---|---|
| useReviewBatch.ts | 9.4KB | READ | PATH B verified |
| flashcard-types.ts | 2.7KB | LISTED | |
| useAdaptiveSession.ts | 18.4KB | LISTED | |
| useAdminAiTools.ts | 6.3KB | LISTED | |
| useAiReports.ts | 7.7KB | LISTED | |
| useCalendarGrid.ts | 5KB | LISTED | |
| useContentTree.ts | 3.2KB | LISTED | |
| useDebouncedValue.ts | 0.7KB | LISTED | |
| useFlashcardEngine.ts | 11.5KB | LISTED | |
| useFlashcardNavigation.ts | 15.9KB | LISTED | |
| useGamification.ts | 4.5KB | LISTED | |
| useIsMobile.ts | 0.8KB | LISTED | |
| useKeywordMastery.ts | 4.6KB | LISTED | |
| useKeywordNavigation.ts | 6.8KB | LISTED | |
| useLastStudiedTopic.ts | 2KB | LISTED | |
| usePdfIngest.ts | 5KB | LISTED | |
| useQuickGenerate.ts | 3.2KB | LISTED | |
| useRagAnalytics.ts | 4.6KB | LISTED | |
| useReadingTimeTracker.ts | 6.8KB | LISTED | |
| useSearch.ts | 3KB | LISTED | |
| useSessionXP.ts | 8.7KB | LISTED | |
| useSmartGeneration.ts | 8KB | LISTED | |
| useSmartPopupPosition.ts | 7.9KB | LISTED | |
| useSmartPosition.ts | 5.4KB | LISTED | |
| useStudentNav.ts | 2.8KB | LISTED | |
| useStudentNotes.ts | 3.6KB | LISTED | |
| useStudyPlans.ts | 23KB | LISTED | BIGGEST hook |
| useStudyQueueData.ts | 9.5KB | LISTED | |
| useStudyTimeEstimates.ts | 16.6KB | LISTED | |
| useSummaryPersistence.ts | 6.4KB | LISTED | |
| useSummaryTimer.ts | 1.5KB | LISTED | |
| useSummaryViewer.ts | 3.8KB | LISTED | |
| useTextAnnotations.ts | 3.7KB | LISTED | |
| useTopicLookup.ts | 2.6KB | LISTED | |
| useTopicMastery.ts | 11.2KB | LISTED | |
| useTopicProgress.ts | 8.6KB | LISTED | |
| useTreeCourses.ts | 2KB | LISTED | |

**Score: 1/35 READ (2.8%)**

#### hooks/queries/ (20 files)

| File | Size | Status |
|---|---|---|
| queryKeys.ts | 4.7KB | LISTED |
| staleTimes.ts | 1KB | LISTED |
| useAnnotationMutations.ts | 2.9KB | LISTED |
| useKeywordConnectionsQueries.ts | 4.3KB | LISTED |
| useKeywordDetailQueries.ts | 2.9KB | LISTED |
| useKeywordMasteryQuery.ts | 9.3KB | LISTED |
| useKeywordPopupQueries.ts | 13.4KB | LISTED |
| useKeywordSuggestionsQuery.ts | 4.3KB | LISTED |
| useKeywordsManagerQueries.ts | 6.6KB | LISTED |
| useProfessorNotesQueries.ts | 3.9KB | LISTED |
| useSubtopicMutations.ts | 4.8KB | LISTED |
| useSummaryBlocksQuery.ts | 1.6KB | LISTED |
| useSummaryReaderMutations.ts | 10.7KB | LISTED |
| useSummaryReaderQueries.ts | 4.1KB | LISTED |
| useSummaryViewQueries.ts | 4.6KB | LISTED |
| useTopicDetailQueries.ts | 7KB | LISTED |
| useTopicProgressQuery.ts | 2.2KB | LISTED |
| useTopicProgressRawQuery.ts | 2.3KB | LISTED |
| useTopicsOverviewQuery.ts | 2.3KB | LISTED |
| useVideoPlayerQueries.ts | 4.4KB | LISTED |
| useVideosManagerQueries.ts | 3KB | LISTED |

**Score: 0/20 READ (0%)**

### src/app/context/ (9 files)

| File | Size | Status |
|---|---|---|
| AppContext.tsx | 5KB | LISTED |
| AuthContext.tsx | 17KB | LISTED |
| ContentTreeContext.tsx | 8.9KB | LISTED |
| GamificationContext.tsx | 3.2KB | LISTED |
| PlatformDataContext.tsx | 11KB | LISTED |
| StudentDataContext.tsx | 14.7KB | LISTED |
| StudyPlansContext.tsx | 2.8KB | LISTED |
| StudyTimeEstimatesContext.tsx | 1.3KB | LISTED |
| TopicMasteryContext.tsx | 1.2KB | LISTED |

**Score: 0/9 READ (0%)**

### src/app/types/ (11 files)

| File | Size | Status |
|---|---|---|
| content.ts | 3.1KB | LISTED |
| flashcard-manager.ts | 0.3KB | LISTED |
| gamification.ts | 5.5KB | LISTED |
| keyword-connections.ts | 2.9KB | LISTED |
| keyword-notes.ts | 0.5KB | LISTED |
| keywords.ts | 2.4KB | LISTED |
| legacy-stubs.ts | 4KB | LISTED |
| model3d.ts | 2.5KB | LISTED |
| platform.ts | 6.6KB | LISTED |
| student.ts | 5.2KB | LISTED |
| study-plan.ts | 1.1KB | LISTED |

**Score: 0/11 READ (0%)**

### src/app/components/ (2 files + 20 subdirs)

| Item | Status | Notes |
|---|---|---|
| DiagnosticsPage.tsx | LISTED | 15.4KB |
| design-kit.tsx | LISTED | 2.9KB |
| ai/ | LISTED (dir) | |
| auth/ | LISTED (dir) | |
| content/ | LISTED (dir) | |
| dashboard/ | LISTED (dir) | |
| design-kit/ | LISTED (dir) | |
| figma/ | LISTED (dir) | |
| gamification/ | LISTED (dir) | |
| layout/ | LISTED (dir) | |
| professor/ | LISTED (dir) | |
| roles/ | LISTED (dir) | |
| schedule/ | LISTED (dir) | |
| shared/ | LISTED (dir) | |
| student-panel/ | LISTED (dir) | |
| student/ | LISTED (dir) | |
| summary/ | LISTED (dir) | |
| tiptap/ | LISTED (dir) | |
| ui/ | LISTED (dir) | |
| video/ | LISTED (dir) | |
| viewer3d/ | LISTED (dir) | |
| welcome/ | LISTED (dir) | |

**Score: 0 READ. Subdirs not expanded (file count unknown).**

### src/app/routes/ (10 files)

| File | Size | Status |
|---|---|---|
| admin-routes.ts | 1.5KB | LISTED |
| flashcard-student-routes.ts | 0.8KB | LISTED |
| owner-routes.ts | 1.8KB | LISTED |
| professor-placeholders.tsx | 2KB | LISTED |
| professor-routes.ts | 1.7KB | LISTED |
| quiz-student-routes.ts | 0.6KB | LISTED |
| student-routes.ts | 1.5KB | LISTED |
| study-student-routes.ts | 3.1KB | LISTED |
| summary-student-routes.ts | 0.9KB | LISTED |
| threed-student-routes.ts | 0.6KB | LISTED |

**Score: 0/10 READ (0%)**

### src/app/utils/ (10 files)

| File | Size | Status |
|---|---|---|
| categoryStyles.ts | 0.7KB | LISTED |
| constants.ts | 3.5KB | LISTED |
| devLog.ts | 0.9KB | LISTED |
| getErrorMessage.ts | 1KB | LISTED |
| lazyRetry.ts | 1.8KB | LISTED |
| masteryColors.ts | 2.9KB | LISTED |
| planSchedulingUtils.ts | 4.2KB | LISTED |
| rescheduleEngine.ts | 5.9KB | LISTED |
| studyMethodStyles.tsx | 2KB | LISTED |
| studyPlanMapper.ts | 3.9KB | LISTED |

**Score: 0/10 READ (0%)**

### src/app/design-system/ (14 files)

| File | Size | Status |
|---|---|---|
| animation.ts | 1.8KB | LISTED |
| architecture.ts | 30.2KB | LISTED | BIGGEST frontend file |
| brand.ts | 1.9KB | LISTED |
| colors.ts | 3.9KB | LISTED |
| components.ts | 7.3KB | LISTED |
| index.ts | 6.5KB | LISTED |
| layout.ts | 1.3KB | LISTED |
| navigation.ts | 3.1KB | LISTED |
| package.json | 3.4KB | LISTED |
| rules.ts | 1.9KB | LISTED |
| section-colors.ts | 2.4KB | LISTED |
| shadows.ts | 0.9KB | LISTED |
| shapes.ts | 1.3KB | LISTED |
| tsconfig.build.json | 1KB | LISTED |
| typography.ts | 3.1KB | LISTED |

**Score: 0/14 READ (0%)**

### Other frontend files

| File | Status |
|---|---|
| src/app/App.tsx | LISTED |
| src/app/routes.tsx | LISTED |
| src/app/pages/DashboardPage.tsx | LISTED |

---

## 2. Backend (`axon-backend`)

**Status: 0 files read in THIS session (pass 12).**

All backend knowledge used for cross-check came from prior sessions (passes 1-11, ~130 files read per user's description). No backend files were re-read or verified in this session.

### Priority for next pass:
1. `routes/gamification/` (4 files) - verify 13 endpoints match frontend
2. `routes/ai/` (~11 files) - never cross-checked against docs
3. `routes/study/batch-review.ts` - critical PATH B logic
4. `gamification tables schema` - still undocumented

---

## 3. Docs (`axon-docs`)

| File | Status |
|---|---|
| frontend/platform-api-map.md | READ + UPDATED (pass 12) |
| All other docs | PRIOR (passes 1-11) |

---

## Summary Scorecard

| Layer | Files READ | Files LISTED | Files PENDING | % Read |
|---|---|---|---|---|
| Frontend services/ | 12 | 20 | 0 | 37.5% |
| Frontend services/student-api/ | 0 | 6 | 0 | 0% |
| Frontend services/ai-service/ | 0 | 8 | 0 | 0% |
| Frontend services/platform-api/ | 0 | 7 | 0 | 0% |
| Frontend lib/ | 1 | 24 | 0 | 4% |
| Frontend hooks/ | 1 | 34 | 0 | 2.8% |
| Frontend hooks/queries/ | 0 | 20 | 0 | 0% |
| Frontend context/ | 0 | 9 | 0 | 0% |
| Frontend types/ | 0 | 11 | 0 | 0% |
| Frontend components/ | 0 | 2 + 20 subdirs | unknown | 0% |
| Frontend routes/ | 0 | 10 | 0 | 0% |
| Frontend utils/ | 0 | 10 | 0 | 0% |
| Frontend design-system/ | 0 | 14 | 0 | 0% |
| Backend (this session) | 0 | 0 | all | 0% |
| **TOTAL this session** | **14** | **~175** | **unknown** | **~7%** |

## Priority Queue for Next Passes

### P0 - High Value (API-calling files, likely to have mismatches)
1. `services/keywordMasteryApi.ts` (18.6KB) - biggest service, calls /bkt-states + /review-batch
2. `services/student-api/sa-course-progress.ts` (5.6KB) - frontend aggregation
3. `services/student-api/sa-activity-sessions.ts` (3.8KB) - daily activity + sessions
4. `services/platform-api/pa-study-plans.ts` (7KB) - study plans CRUD
5. `services/platform-api/pa-admin.ts` (6.7KB) - admin endpoints
6. `services/aiApi.ts` (7.5KB) - AI endpoints
7. `services/models3dApi.ts` (12.3KB) - 3D model CRUD
8. Backend `routes/gamification/` (4 files) - verify against frontend
9. Backend `routes/ai/` (~11 files) - never cross-checked

### P1 - Medium Value (hooks that orchestrate complex flows)
1. `hooks/useStudyPlans.ts` (23KB) - biggest hook
2. `hooks/useAdaptiveSession.ts` (18.4KB) - adaptive session
3. `hooks/useFlashcardNavigation.ts` (15.9KB) - flashcard navigation
4. `hooks/useStudyTimeEstimates.ts` (16.6KB) - time estimates
5. `hooks/useSessionXP.ts` (8.7KB) - XP hook
6. `hooks/queries/useKeywordPopupQueries.ts` (13.4KB) - biggest query hook

### P2 - Context Layer
1. `context/AuthContext.tsx` (17KB) - auth flow
2. `context/StudentDataContext.tsx` (14.7KB) - student data
3. `context/PlatformDataContext.tsx` (11KB) - platform data

### P3 - UI Components (lowest priority for API correctness)
1. Expand all 20 component subdirs to get file counts
2. Read key components that make API calls directly
