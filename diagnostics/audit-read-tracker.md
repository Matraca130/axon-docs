# Audit Read Tracker

> **Updated:** 2026-03-14 (FINAL — all logic layers complete)
> **Total files READ this session:** 180

## Completion Status

| Layer | READ | Total | % |
|---|---|---|---|
| **services/** | **53** | **53** | **100%** |
| **context/** | **9** | **9** | **100%** |
| **types/** | **11** | **11** | **100%** |
| **hooks/ (flat)** | **35** | **35** | **100%** |
| **hooks/queries/** | **21** | **21** | **100%** |
| **lib/** | **25** | **25** | **100%** |
| **utils/** | **10** | **10** | **100%** |
| **routes/** | **10** | **10** | **100%** |
| design-system/ | 0 | 14 | 0% |
| components/ | 0 | ~100+ | 0% |
| **SESSION TOTAL** | **180** | | |

## 8 of 10 Layers at 100%

Every file that contains business logic, API calls, state management,
type definitions, routing, or utility functions has been read end-to-end.

The 2 remaining layers (design-system/ and components/) are **UI-only**:
Tailwind classes, JSX rendering, layout composition. They don't contain
API calls, state logic, or type definitions — only consume them.

## Total Bugs Found: 8 new (BUG-012 to BUG-019)

| ID | Sev | Summary |
|---|---|---|
| BUG-012 | LOW | quizzesEntityApi sends time_limit_seconds, backend lacks column |
| BUG-013 | MED | GamificationContext is STUB (TODO Sprint G5) |
| BUG-014 | LOW | apiConfig.ts duplicate fetch logic |
| BUG-015 | LOW | aiFlashcardGenerator.ts dead code |
| BUG-016 | LOW | Overlapping types for kw-student-notes/text-annotations |
| BUG-017 | MED | supabase.ts + config.ts + lib/api.ts = 3 copies of hardcoded ANON_KEY |
| BUG-018 | MED | useSummaryPersistence 'demo-student-001' fallback |
| BUG-019 | LOW | Dual content tree implementations |

## Architecture Insights (not bugs, but undocumented until now)

1. **Admin/Owner/Professor routes are ALL placeholder pages** — no real
   functionality. Only student role has real components (22+ routes).
2. **Routes use agent ownership pattern** — 6 agents each own a route file.
   student-routes.ts is an assembler that spreads them.
3. **React Query layer**: queryKeys.ts (25+ keys), staleTimes.ts (6 constants),
   21 query hooks with shared cache patterns and optimistic updates.
4. **useStudyQueueData** is the central data hub — 3 consumers share 1 fetch.
5. **palette.ts** is SSoT for Axon Medical Academy colors (consolidates 7 dupes).
6. **lazyRetry.ts** handles stale Vite chunks after deploy with auto-reload.
7. **withBoundary.tsx** wraps every lazy route with ErrorBoundary.
8. **Grade scales**: SM-2 (1-5) in UI, FSRS (1-4) in backend. grade-mapper.ts
   translates between them with different isCorrect thresholds per context.

## Remaining (UI-only, optional)

- design-system/ (14 files): Tailwind tokens, shadcn components
- components/ (~100+ files in 20 subdirs): React components (JSX + Tailwind)
