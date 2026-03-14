# Audit Read Tracker

> **Updated:** 2026-03-14 (batch 4 complete)
> **Total files READ this session:** 125

## Completion Status

| Layer | READ | Total | % |
|---|---|---|---|
| **services/** | **53** | **53** | **100%** |
| **context/** | **9** | **9** | **100%** |
| **types/** | **11** | **11** | **100%** |
| hooks/ (flat) | **35** | **35** | **100%** |
| hooks/queries/ | 3 | 21 | 14% |
| lib/ | 7 | 25 | 28% |
| utils/ | 3 | 10 | 30% |
| routes/ | 0 | 10 | 0% |
| design-system/ | 0 | 14 | 0% |
| components/ | 0 | ~100+ | 0% |
| **SESSION TOTAL** | **125** | | |

## Layers 100% Complete

- services/ (53/53)
- context/ (9/9)
- types/ (11/11)
- hooks/ flat (35/35)

## Batch 4 New Findings

### BUG-018: useSummaryPersistence hardcoded fallback studentId
- File: `hooks/useSummaryPersistence.ts`
- Uses `studentId || 'demo-student-001'` as fallback
- If auth fails, all data writes go to shared demo account
- Risk: data leakage between unauthenticated sessions

### BUG-019: Dual content tree implementations
- `hooks/useContentTree.ts` fetches /content-tree + /memberships, filters by professor
- `context/ContentTreeContext.tsx` fetches /content-tree only, no professor filter
- Two different code paths for the same data, confusing for new devs
- useContentTree hook is used by professor cascade selectors (quiz, flashcard managers)
- ContentTreeContext is used by student views + platform data

### Architecture insights (no bugs, but undocumented)
- `useStudyQueueData` is the central data hub — 3 consumers share 1 fetch
- `queryKeys.ts` has 25+ query key patterns (central factory)
- `useKeywordPopupQueries` does 3-phase external KW resolution (0 extra requests for F1-joined data)
- `useReadingTimeTracker` has 4-layer persistence (periodic, visibility, beforeunload+keepalive, unmount)
- `useSummaryReaderMutations` has 7 mutations with optimistic deletes
- `flashcard-types.ts` has BOTH SM-2 RATINGS (1-5) and FSRS GRADES (1-4) scales

## Remaining Priority Queue

### P0 — queries/ (18 remaining)
All React Query hooks for professor/student views

### P1 — lib/ (18 remaining)
api-helpers, concurrency, config, content-tree-helpers, date-utils, error-utils,
flashcard-export, flashcard-utils, keyword-scroll-helpers, logger, mastery-helpers,
model3d-api, muxApi, palette, queryClient, quiz-utils, session-stats,
summary-content-helpers, withBoundary

### P2 — utils/ (7 remaining), routes/ (10)
### P3 — design-system/ (14), components/ (~100+)
### P4 — Backend re-verification
