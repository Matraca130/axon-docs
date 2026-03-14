# Audit Read Tracker

> **Updated:** 2026-03-14 (batch 5 complete)
> **Total files READ this session:** 155

## Completion Status

| Layer | READ | Total | % |
|---|---|---|---|
| **services/** | **53** | **53** | **100%** |
| **context/** | **9** | **9** | **100%** |
| **types/** | **11** | **11** | **100%** |
| **hooks/ (flat)** | **35** | **35** | **100%** |
| **hooks/queries/** | **21** | **21** | **100%** |
| lib/ | 14 | 25 | 56% |
| utils/ | 7 | 10 | 70% |
| routes/ | 1 | 10 | 10% |
| design-system/ | 0 | 14 | 0% |
| components/ | 0 | ~100+ | 0% |
| **SESSION TOTAL** | **155** | | |

## Layers 100% Complete (5 of 10)

1. services/ (53/53)
2. context/ (9/9)
3. types/ (11/11)
4. hooks/ flat (35/35)
5. hooks/queries/ (21/21)

## Total Bugs Found This Session: 19

| ID | Sev | Summary |
|---|---|---|
| BUG-012 | LOW | quizzesEntityApi sends time_limit_seconds, backend lacks column |
| BUG-013 | MED | GamificationContext is STUB (TODO Sprint G5) |
| BUG-014 | LOW | apiConfig.ts duplicate fetch logic |
| BUG-015 | LOW | aiFlashcardGenerator.ts dead code |
| BUG-016 | LOW | Overlapping types for kw-student-notes/text-annotations |
| BUG-017 | MED | supabase.ts hardcoded ANON_KEY |
| BUG-018 | MED | useSummaryPersistence 'demo-student-001' fallback |
| BUG-019 | LOW | Dual content tree implementations |

## Remaining (small files only)

- lib/ (11 remaining): config, content-tree-helpers, date-utils, error-utils, flashcard-export, flashcard-utils, keyword-scroll-helpers, mastery-helpers, palette, quiz-utils, summary-content-helpers, withBoundary
- utils/ (3 remaining): categoryStyles, devLog, getErrorMessage, studyMethodStyles
- routes/ (9 remaining): admin, owner, professor, quiz, flashcard, study, summary, threed, professor-placeholders
- design-system/ (14): untouched
- components/ (~100+): untouched
