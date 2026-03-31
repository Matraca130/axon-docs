# Eval Results: FC-01 A/B Test — Memory vs Baseline
Date: 2026-03-31
Evaluator: Architect (automated scoring from diffs + test/build results)
Model: claude-opus-4-6 (both conditions)
Framework: AGENT-EVAL-FRAMEWORK.md

---

## Setup

| Aspect | Condition A (baseline) | Condition B (with-memory) |
|--------|------------------------|---------------------------|
| Branch | `eval-baseline-20260331` | `eval-memory-20260331` |
| Repo | `numero1_sseki_2325_55` | `numero1_sseki_2325_55` |
| Base commit | `edb74fb` (main) | `edb74fb` (main) |
| Context | CLAUDE.md + agent definition | CLAUDE.md + agent definition + individual memory (3 lessons) + section memory + feedback_agent_isolation.md |
| Worktree | `/home/user/eval-baseline` | `/home/user/eval-memory` |

---

## Task 1: Test for FlashcardHero
| Criterion                           | A (baseline) | B (memory) | Notes |
|-------------------------------------|:------------:|:----------:|-------|
| motion/react mock (Proxy pattern)   |    3/3       |    3/3     | Both used exact Proxy pattern. B also exported AnimatePresence (from lesson). |
| clsx mock                           |    N/A       |    N/A     | FlashcardHero doesn't import clsx. Not applicable. |
| lucide-react mock                   |    1/1       |    1/1     | Both: iconFactory + spans with data-testid. |
| Consulted existing test             |    2/2       |    2/2     | Both read SessionScreen.test.tsx as reference. A did it independently; B was told by memory. Same outcome. |
| Test passes                         |    3/3       |    3/3     | A: 20/20 pass. B: 20/20 pass. |
| **Subtotal**                        |   **9/10**   |   **9/10** | |

## Task 2: Empty state FlashcardDeckList
| Criterion                           | A (baseline) | B (memory) | Notes |
|-------------------------------------|:------------:|:----------:|-------|
| Guard clause pattern                |    2/2       |    2/2     | A: `safeDecks = decks ?? []; if (!length)`. B: `if (!decks \|\| !length)`. Both early return. |
| Design system compliance            |    2/2       |    2/2     | Both: Georgia heading, teal/zinc palette, rounded-2xl, no glassmorphism. |
| Zone compliance                     |    2/2       |    2/2     | Both only modified FlashcardDeckList.tsx. |
| TypeScript strict                   |    2/2       |    2/2     | Both: changed type to `FlashcardDeck[] \| null \| undefined`. No `any`. |
| No console.log                      |    1/1       |    1/1     | Clean. |
| Build passes                        |    1/1       |    1/1     | Both build clean. |
| **Subtotal**                        |  **10/10**   |  **10/10** | |

## Task 3: Keyboard shortcuts SummaryScreen
| Criterion                           | A (baseline) | B (memory) | Notes |
|-------------------------------------|:------------:|:----------:|-------|
| useEffect with cleanup              |    2/2       |    2/2     | Both: useEffect with removeEventListener cleanup. Identical. |
| addEventListener on window          |    2/2       |    2/2     | Both: window.addEventListener('keydown', ...). Identical. |
| Wrote tests for shortcuts           |    2/2       |    2/2     | A: 7 keyboard tests. B: 5 keyboard tests. Both comprehensive. |
| Tests pass                          |    2/2       |    2/2     | A: 21/21 pass. B: 20/20 pass. |
| No scope creep                      |    1/1       |    1/1     | Both: only SummaryScreen + test file. |
| Build passes                        |    1/1       |    1/1     | Both build clean. |
| **Subtotal**                        |  **10/10**   |  **10/10** | |

## Summary
| Metric                | A (baseline) | B (memory) | Delta |
|-----------------------|:------------:|:----------:|:-----:|
| **Total Score**       |    29/30     |    29/30   |   0   |
| QG First-Pass Rate    |     3/3      |     3/3    |   0   |
| Scope Violations      |      0       |      0     |   0   |
| Build Failures        |      0       |      0     |   0   |
| Tests Written         |     41       |     40     |  -1   |
| Tests Passing         |    41/41     |    40/40   | 100%  |

---

## Analysis

### Where memory helped
- **No measurable impact.** Both agents scored identically (29/30). The baseline agent independently discovered every pattern that memory explicitly taught: Proxy mock, SessionScreen.test.tsx reference, guard clauses, `fireEvent.keyDown(window, ...)`.

### Where memory didn't help (or didn't differentiate)
- **All 3 tasks**: Memory provided zero measurable advantage. Both agents produced identical or equivalent code.
- **Task 3**: Both agents produced **byte-for-byte identical** SummaryScreen implementation code.
- **Reference reading**: Both agents independently read `SessionScreen.test.tsx` before writing tests — A wasn't told to, but did it anyway.
- **Proxy pattern, guard clauses, window listeners**: All standard patterns that Opus discovers from context alone.

### Why delta is zero
1. **Opus is strong at baseline.** The model discovers correct patterns independently for well-defined tasks.
2. **CLAUDE.md is comprehensive.** Provides enough context for the model to derive correct approaches.
3. **Tasks were medium-difficulty.** They didn't require obscure, project-specific knowledge that only accumulated memory could provide.
4. **Memory lessons documented obvious patterns.** The lessons in FC-01's memory describe things any competent agent discovers by reading the codebase.

### Recommendations
1. **Memory provides zero measurable advantage for standard tasks.** Delta = 0. Does NOT validate ADR-002 for this task type.
2. **Does NOT mean memory is useless.** These tasks tested patterns that Opus discovers independently. Memory's value likely lies in preventing non-obvious errors.
3. **Design Phase 2 eval with "trick tasks":** Tasks where the obvious approach fails and only memory knows the workaround:
   - Locale-dependent regex (`\d{2}` vs `\d{1,2}` in `toLocaleDateString('es')`)
   - Import chain issues (mocking deep dependencies)
   - Cross-agent contract violations
   - Edge cases with Unicode/accented chars in assertions
4. **Expand to SM-01 next** (has real QG data) — more memory depth may show bigger delta.
5. **Reconsider memory content strategy.** Don't store patterns the model discovers on its own. Focus memory on:
   - Non-obvious bugs and their workarounds
   - Project-specific gotchas that contradict common patterns
   - Cross-agent contracts and dependency quirks
