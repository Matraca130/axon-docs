# Frontend -> Backend API Map

> Maps frontend function calls to backend endpoints.
> **Updated:** 2026-03-17 (audit pass 17 — full recount: 586 frontend files, 122 backend files)
>
> **All paths relative to:** `src/app/` (NOT `src/`)

## Status Legend

- CONNECTED — function exists, imported by components, correct payload
- RESOLVED — previously broken, now fixed
- VERIFIED — cross-checked against backend source code (audit pass 12)

## Study Sessions & Reviews

| Function | Defined In | Endpoint | Status |
|---|---|---|---|
| `createStudySession` | services/studySessionApi.ts | `POST /study-sessions` | VERIFIED |
| `closeStudySession` | services/studySessionApi.ts | `PUT /study-sessions/:id` | VERIFIED |
| `getStudySessions` | services/studySessionApi.ts | `GET /study-sessions` | VERIFIED |
| `submitReview` | services/studySessionApi.ts | `POST /reviews` | VERIFIED |
| `submitReviewBatch` | services/studySessionApi.ts | `POST /review-batch` | VERIFIED (PERF M1) |
| `fallbackToIndividualPosts` | services/studySessionApi.ts | `POST /reviews` (N×) | VERIFIED (degraded) |
| `createReview` | services/reviewsApi.ts | `POST /reviews` | VERIFIED |

## FSRS & BKT States

| Function | Defined In | Endpoint | Status |
|---|---|---|---|
| `getFsrsStates` | services/studySessionApi.ts | `GET /fsrs-states` | VERIFIED |
| `upsertFsrsState` | services/studySessionApi.ts | `POST /fsrs-states` | VERIFIED |
| `getBktStates` | services/bktApi.ts | `GET /bkt-states` | VERIFIED (M-5: subtopic_ids) |
| `upsertBktState` | services/bktApi.ts | `POST /bkt-states` | VERIFIED (M-1: INCREMENT) |

## Flashcards

| Function | Defined In | Endpoint | Status |
|---|---|---|---|
| `getFlashcards` | services/flashcardApi.ts | `GET /flashcards?summary_id=` | VERIFIED |
| `getFlashcardsByTopic` | services/flashcardApi.ts | `GET /flashcards-by-topic?topic_id=` | VERIFIED (PERF C1) |
| `createFlashcard` | services/flashcardApi.ts | `POST /flashcards` | VERIFIED |
| `updateFlashcard` | services/flashcardApi.ts | `PUT /flashcards/:id` | VERIFIED ¹ |
| `deleteFlashcard` | services/flashcardApi.ts | `DELETE /flashcards/:id` | VERIFIED |
| `restoreFlashcard` | services/flashcardApi.ts | `PUT /flashcards/:id/restore` | VERIFIED |

> ¹ `updateFlashcard` sends `keyword_id` but backend updateFields doesn't include it — silently dropped. Harmless.

## Quiz Questions & Quizzes

| Function | Defined In | Endpoint | Status |
|---|---|---|---|
| `getQuizQuestions` | services/quizQuestionsApi.ts | `GET /quiz-questions?summary_id=` | VERIFIED |
| `createQuizQuestion` | services/quizQuestionsApi.ts | `POST /quiz-questions` | VERIFIED |
| `updateQuizQuestion` | services/quizQuestionsApi.ts | `PUT /quiz-questions/:id` | VERIFIED |
| `deleteQuizQuestion` | services/quizQuestionsApi.ts | `DELETE /quiz-questions/:id` | VERIFIED |
| `restoreQuizQuestion` | services/quizQuestionsApi.ts | `PUT /quiz-questions/:id/restore` | VERIFIED |
| Quiz CRUD | services/quizzesEntityApi.ts | `/quizzes` CRUD | CONNECTED |
| `createQuizAttempt` | services/quizAttemptsApi.ts | `POST /quiz-attempts` | CONNECTED |

## Content CRUD (Professor)

| Function | Defined In | Endpoint | Status |
|---|---|---|---|
| Summaries CRUD | services/summariesApi.ts | `/summaries` | VERIFIED |
| Chunks CRUD | services/summariesApi.ts | `/chunks` | VERIFIED |
| Keywords CRUD | services/summariesApi.ts | `/keywords` | VERIFIED ² |
| Subtopics CRUD | services/summariesApi.ts | `/subtopics` | VERIFIED |
| Videos CRUD | services/summariesApi.ts | `/videos` | VERIFIED |
| Summary Blocks | services/summariesApi.ts | `/summary-blocks` | VERIFIED |
| Reorder | services/summariesApi.ts | `PUT /reorder` | VERIFIED |
| Content Tree | services/contentTreeApi.ts | `GET /content-tree` | CONNECTED |

> ² `createKeyword` doesn't send `clinical_priority` or `is_foundation` (v4.2 fields). These are set via other tools, not the main editor UI.

## Progress & Topic Tracking

| Function | Defined In | Endpoint | Status |
|---|---|---|---|
| `getTopicProgress` | services/topicProgressApi.ts | `GET /topic-progress?topic_id=` | VERIFIED |
| `getTopicsOverview` | services/topicProgressApi.ts | `GET /topics-overview?topic_ids=` | VERIFIED |
| Both have N+1 fallbacks | services/topicProgressApi.ts | Multiple endpoints | VERIFIED |

## Keyword Connections

| Function | Defined In | Endpoint | Status |
|---|---|---|---|
| `getConnections` | services/keywordConnectionsApi.ts | `GET /keyword-connections?keyword_id=` | VERIFIED |
| `createConnection` | services/keywordConnectionsApi.ts | `POST /keyword-connections` | VERIFIED |
| `deleteConnection` | services/keywordConnectionsApi.ts | `DELETE /keyword-connections/:id` | VERIFIED |
| `searchKeywords` | services/keywordConnectionsApi.ts | `GET /keyword-search?q=` | VERIFIED |

## AI / RAG

| Function | Defined In | Endpoint | Status |
|---|---|---|---|
| `generateContent` | services/aiService.ts | `POST /ai/generate` | CONNECTED |
| `generateSmart` | services/aiService.ts | `POST /ai/generate-smart` | VERIFIED |
| `ragChat` | services/aiService.ts | `POST /ai/rag-chat` | CONNECTED |
| `ragFeedback` | services/aiService.ts | `PATCH /ai/rag-feedback` | CONNECTED |
| `generateAdaptiveBatch` | services/adaptiveGenerationApi.ts | N× `POST /ai/generate-smart` | VERIFIED ³ |
| AI reports | services/aiReportApi.ts | `/ai/report*` | CONNECTED |

> ³ Uses client-side parallel batching (N×POST, MAX_CONCURRENT=3). Backend supports Fase 8E count param for server-side bulk, but frontend hasn't adopted it yet. Both work correctly.

## Gamification (13 endpoints)

| Function | Defined In | Endpoint | Status |
|---|---|---|---|
| `getProfile` | services/gamificationApi.ts | `GET /gamification/profile` | VERIFIED |
| `getXPHistory` | services/gamificationApi.ts | `GET /gamification/xp-history` | VERIFIED |
| `getLeaderboard` | services/gamificationApi.ts | `GET /gamification/leaderboard` | VERIFIED |
| `getStreakStatus` | services/gamificationApi.ts | `GET /gamification/streak-status` | CONNECTED |
| `dailyCheckIn` | services/gamificationApi.ts | `POST /gamification/daily-check-in` | CONNECTED |
| `buyStreakFreeze` | services/gamificationApi.ts | `POST /gamification/streak-freeze/buy` | CONNECTED |
| `repairStreak` | services/gamificationApi.ts | `POST /gamification/streak-repair` | CONNECTED |
| `getBadges` | services/gamificationApi.ts | `GET /gamification/badges` | CONNECTED |
| `checkBadges` | services/gamificationApi.ts | `POST /gamification/check-badges` | CONNECTED |
| `getNotifications` | services/gamificationApi.ts | `GET /gamification/notifications` | CONNECTED |
| `updateDailyGoal` | services/gamificationApi.ts | `PUT /gamification/daily-goal` | CONNECTED |
| `completeGoal` | services/gamificationApi.ts | `POST /gamification/goals/complete` | CONNECTED |
| `onboarding` | services/gamificationApi.ts | `POST /gamification/onboarding` | CONNECTED |
| `getStudyQueue` | services/gamificationApi.ts | `GET /study-queue` | VERIFIED |

## Hook: useReviewBatch

| Function | Defined In | Notes |
|---|---|---|
| `queueReview` | hooks/useReviewBatch.ts | Enqueues items, BKT heuristic for visual feedback only |
| `submitBatch` | hooks/useReviewBatch.ts | Calls `submitReviewBatch()` → POST /review-batch |
| `retryPendingBatches` | hooks/useReviewBatch.ts | localStorage resilience, retries on app mount |

## API Service Files (Complete Inventory)

### Core (`src/app/lib/`)

| File | Purpose |
|---|---|
| `api.ts` | Central `apiCall()` wrapper — dual-token headers, GET dedup, 15s timeout |
| `api-helpers.ts` | extractItems(), unwrap helpers |
| `supabase.ts` | SUPABASE_URL + SUPABASE_ANON_KEY source of truth |
| `config.ts` | Environment config |
| `queryClient.ts` | React Query client |
| `concurrency.ts` | `parallelWithLimit()` for AI batch |
| `connection-types.ts` | V2 keyword connection type definitions |
| `grade-mapper.ts` | SM-2 → FSRS grade mapping |
| `mastery-helpers.ts` | BKT/mastery color + threshold utils |
| `session-stats.ts` | Session statistics computation |
| `sessionAnalytics.ts` | Session analytics |
| `studyQueueApi.ts` | Study queue API (also in gamificationApi) |
| `xp-constants.ts` | XP constants (frontend mirror) |
| `model3d-api.ts` | 3D model API |
| `muxApi.ts` | Mux video API |

### Services (`src/app/services/` — 32 files + 4 subdirs)

| File | Backend Endpoints | Size |
|---|---|---|
| `studySessionApi.ts` | /study-sessions, /reviews, /fsrs-states, /review-batch | 7.9KB |
| `flashcardApi.ts` | /flashcards, /flashcards-by-topic | 4.5KB |
| `gamificationApi.ts` | /gamification/* (13 endpoints), /study-queue | 10.4KB |
| `summariesApi.ts` | /summaries, /chunks, /keywords, /subtopics, /videos, /summary-blocks, /reorder | 8.8KB |
| `quizQuestionsApi.ts` | /quiz-questions CRUD | 4.8KB |
| `quizzesEntityApi.ts` | /quizzes CRUD | 3.7KB |
| `quizAttemptsApi.ts` | /quiz-attempts | 1.8KB |
| `bktApi.ts` | /bkt-states | 3KB |
| `topicProgressApi.ts` | /topic-progress, /topics-overview | 7.5KB |
| `keywordConnectionsApi.ts` | /keyword-connections, /keyword-search | 2.4KB |
| `keywordMasteryApi.ts` | /bkt-states, /review-batch, mastery computation | 18.6KB |
| `adaptiveGenerationApi.ts` | N× POST /ai/generate-smart | 10KB |
| `smartGenerateApi.ts` | POST /ai/generate-smart (single) | 3.2KB |
| `aiApi.ts` | /ai/* endpoints | 7.5KB |
| `aiService.ts` | AI wrapper (generate, generateSmart, ragChat) | 2.5KB |
| `aiFlashcardGenerator.ts` | /ai/generate (flashcard-specific) | 4.5KB |
| `aiReportApi.ts` | /ai/report, /ai/report-dashboard | 6.8KB |
| `reviewsApi.ts` | POST /reviews | 1.5KB |
| `platformApi.ts` | /institutions, /memberships, content queries | 4KB |
| `studentApi.ts` | Barrel re-exporter → student-api/*.ts | 2.1KB |
| `studentSummariesApi.ts` | /topic-progress, /reading-states | 5.8KB |
| `studentNotesApi.ts` | /kw-student-notes, /video-notes | 3.6KB |
| `textAnnotationsApi.ts` | /text-annotations | 4KB |
| `contentTreeApi.ts` | /content-tree | 5KB |
| `models3dApi.ts` | /models-3d, /model-3d-pins, /model-3d-notes, etc. | 12.3KB |
| `searchApi.ts` | /search | 1.7KB |
| `flashcardMappingApi.ts` | Flashcard mapping utils | 2.8KB |
| `trashApi.ts` | */restore endpoints | 2.2KB |
| `apiConfig.ts` | API configuration | 5.4KB |
| `quizConstants.ts` | Quiz type/difficulty constants | 5.7KB |
| `quizDesignTokens.ts` | Quiz UI design tokens | 6.3KB |
| **Subdirs:** | `__tests__/`, `ai-service/` (9 files), `platform-api/` (9 files), `student-api/` |

## New Service Files (2026-03-14–17)

| File | Endpoints | Size |
|---|---|---|
| `ai-service/as-realtime.ts` | POST /ai/realtime-session (ephemeral token) | 8KB |
| `platform-api/pa-messaging.ts` | GET/PUT /settings/messaging/:channel, POST test | 4KB |
| `aiService.ts` (barrel) | Re-exports all ai-service/ modules incl. realtime | 79 lines |

## New Hooks (2026-03-14–17)

| Hook | Purpose |
|---|---|
| `useRealtimeVoice.ts` (12KB) | WebSocket lifecycle, PCM16 audio, mic capture |
| `queries/useStudyHubProgress.ts` | Study progress tracking for StudyHub |

## Cross-Check Findings (Audit Pass 12)

### Harmless Mismatches

1. **flashcardApi.ts** `updateFlashcard()` sends `keyword_id` — backend `updateFields` doesn't include it, silently dropped
2. **summariesApi.ts** `createKeyword()` doesn't send `clinical_priority` or `is_foundation` (v4.2 fields) — set via other tools
3. **adaptiveGenerationApi.ts** uses N×POST instead of Fase 8E server-side `count` param — both work, N×POST is legacy

### No Breaking Mismatches Found

All 14 service files cross-checked send correct field names, correct HTTP methods, and correct endpoint paths. Auth convention (ANON_KEY + X-Access-Token) is consistent across all files.
