# Audit Read Tracker

> **Updated:** 2026-03-14 (batch 3 complete)
> **Total files READ this session:** 74

## Completion Status

| Layer | READ | Total | % |
|---|---|---|---|
| **services/ (all subdirs)** | **53** | **53** | **100%** |
| **context/** | **9** | **9** | **100%** |
| hooks/ + queries/ | 10 | 55 | 18% |
| lib/ | 1 | 25 | 4% |
| types/ | 0 | 11 | 0% |
| routes/ | 0 | 10 | 0% |
| utils/ | 0 | 10 | 0% |
| design-system/ | 0 | 14 | 0% |
| components/ | 0 | ~100+ | 0% |
| backend (this session) | 0 | ~130 | 0% |
| **SESSION TOTAL** | **74** | | |

## Layers 100% Complete

### services/ (53/53) ✔
All flat files + student-api/ (6) + platform-api/ (7) + ai-service/ (8)

### context/ (9/9) ✔
AuthContext, StudentDataContext, PlatformDataContext, AppContext,
GamificationContext (STUB), ContentTreeContext, StudyPlansContext,
StudyTimeEstimatesContext, TopicMasteryContext

## Hooks READ (10/55)

| Hook | Size | Key Finding |
|---|---|---|
| useReviewBatch.ts | 9.4KB | PATH B, localStorage resilience |
| useStudyPlans.ts | 23KB | Phase 5 reschedule, batch update tasks |
| useAdaptiveSession.ts | 18.4KB | Multi-round AI session lifecycle |
| useFlashcardNavigation.ts | 15.9KB | LRU cache, on-demand card loading |
| useStudyTimeEstimates.ts | 16.6KB | Real time estimates, 4-tier fallback |
| useSessionXP.ts | 8.7KB | Optimistic XP, combo tracking |
| useFlashcardEngine.ts | 11.5KB | Session lifecycle, useReviewBatch |
| useGamification.ts | 4.5KB | React Query wrappers for gamification |
| useTopicMastery.ts | 11.2KB | BKT+FSRS per-topic aggregation |
| useTopicProgress.ts | 8.6KB | Study-queue based topic progress |

## Cross-Check Findings (All Batches)

### From Batch 1 (harmless)
1. flashcardApi `updateFlashcard()` sends `keyword_id` — backend ignores
2. summariesApi `createKeyword()` missing v4.2 fields
3. adaptiveGenerationApi N×POST not Fase 8E `count`

### From Batch 2
4. pa-admin.ts uses RAW FETCH bypassing apiCall (pagination envelope)
5. sa-content.ts fetches ALL bkt-states globally (wasteful)
6. sa-course-progress.ts big-3-fetch client aggregation
7. studentNotesApi vs studentSummariesApi overlapping types
8. textAnnotationsApi vs studentSummariesApi overlapping types

### From Batch 3
9. **GamificationContext is a STUB** — all methods are no-ops. TODO Sprint G5. useGamification.ts (React Query hooks) is the real implementation.
10. **quizzesEntityApi** sends `time_limit_seconds` but backend needs `ALTER TABLE quizzes ADD COLUMN time_limit_seconds INTEGER` + add to createFields/updateFields. Frontend is ahead of backend.
11. **aiFlashcardGenerator.ts** wraps `aiGenerateFlashcards()` which is DEPRECATED and returns `[]`. The file exists only for SmartFlashcardGenerator.tsx backward compat. Dead code.
12. **apiConfig.ts** has DUPLICATE `realRequest()` and `figmaRequest()` functions that duplicate `lib/api.ts apiCall()` logic (same fetch, same headers, same envelope unwrap). Kept for backward compat — some older files import from apiConfig.
13. **AuthContext** signup uses raw `fetch()` instead of `apiCall()` because POST /signup doesn't need X-Access-Token.
14. **StudentDataContext** v2 migrated from studentApi → platformApi for stats/daily/bkt. Profile comes from AuthContext (no API call). Legacy stubs warn in console.
15. **PlatformDataContext** loads 6 API calls in parallel per institution change (institution, stats, members, plans, subscription, courses).

### API Endpoint Summary (from all services)

**Content CRUD:** summaries, chunks, keywords, subtopics, videos, summary-blocks, flashcards, quizzes, quiz-questions, quiz-attempts, courses, semesters, sections, topics, reorder, models-3d, model-3d-pins, model-3d-notes, model-layers, model-parts

**Student Private:** reading-states, text-annotations, kw-student-notes, video-notes

**Study:** study-sessions, reviews, review-batch, fsrs-states, bkt-states, study-plans, study-plan-tasks, study-plan-tasks/batch, study-queue, flashcard-mappings, flashcards-by-topic, topic-progress, topics-overview

**AI (14):** /ai/generate, /ai/generate-smart, /ai/pre-generate, /ai/rag-chat, /ai/rag-feedback, /ai/rag-analytics, /ai/embedding-coverage, /ai/ingest-pdf, /ai/ingest-embeddings, /ai/re-chunk, /ai/report, /ai/report/:id, /ai/report-stats, /ai/reports

**Gamification (13):** profile, xp-history, leaderboard, streak-status, daily-check-in, streak-freeze/buy, streak-repair, badges, check-badges, notifications, daily-goal, goals/complete, onboarding

**Platform:** institutions, memberships, members, admin-scopes, plan-access-rules, check-access, platform-plans, institution-plans, institution-subscriptions, admin/students, content-tree, search, trash, restore, health, me, signup, student-stats, daily-activities

## Remaining Priority Queue

### P0 — Hooks (25 remaining flat + 20 queries/)
- useSmartGeneration.ts (8KB)
- useStudyQueueData.ts (9.5KB)
- useKeywordMastery.ts (4.6KB)
- useKeywordNavigation.ts (6.8KB)
- useReadingTimeTracker.ts (6.8KB)
- useSummaryPersistence.ts (6.4KB)
- useAiReports.ts (7.7KB)
- useAdminAiTools.ts (6.3KB)
- hooks/queries/* (20 files)

### P1 — Types (11 files) + Utils (10) + Lib (24)
### P2 — Design System (14) + Routes (10)
### P3 — Components (20 subdirs, ~100+ files)
### P4 — Backend re-verification
