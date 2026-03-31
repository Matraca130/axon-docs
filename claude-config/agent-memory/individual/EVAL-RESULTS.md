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
| Consulted existing test             |    1/2       |    2/2     | B explicitly read SessionScreen.test.tsx per memory instructions. A found patterns independently. |
| Test passes                         |    3/3       |    3/3     | A: 20/20 pass. B: 20/20 pass. |
| **Subtotal**                        |   **8/10**   |   **9/10** | |

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
| **Total Score**       |    28/30     |    29/30   |  +1   |
| QG First-Pass Rate    |     3/3      |     3/3    |   0   |
| Scope Violations      |      0       |      0     |   0   |
| Build Failures        |      0       |      0     |   0   |
| Tests Written         |     41       |     40     |  -1   |
| Tests Passing         |    41/41     |    40/40   | 100%  |

---

## Analysis

### Where memory helped
- **Task 1 (+1 pt)**: Memory instructed B to read `SessionScreen.test.tsx` before writing, resulting in a more deliberate "copy proven patterns" approach. B also exported `AnimatePresence` in the mock (from memory lesson), making it more robust.
- **Task 2 (qualitative)**: B preserved the existing "Tus Mazos" header pattern above the empty state, showing awareness of the component's visual structure — likely informed by memory's emphasis on studying component patterns.

### Where memory didn't help (or didn't differentiate)
- **Task 3**: Both agents produced **byte-for-byte identical** SummaryScreen implementation code. The `useEffect + window.addEventListener + cleanup` pattern is standard React.
- **Proxy pattern**: Both agents independently discovered the correct Proxy mock pattern. The model is strong enough to derive it from context.
- **Guard clauses**: Both agents used guard clause early return without being told. Standard defensive coding.

### Why delta is small (+1, not +5)
1. **Opus is strong at baseline.** The model discovers correct patterns independently for well-defined tasks.
2. **CLAUDE.md is comprehensive.** Provides enough context for the model to derive correct approaches.
3. **Tasks were medium-difficulty.** They didn't require obscure, project-specific knowledge that only accumulated memory could provide.

### Recommendations
1. **Memory value is real but marginal for standard tasks.** +1 delta validates ADR-002 directionally but doesn't justify urgent rollout to all 68 agents.
2. **Design harder eval tasks** that trigger specific past bugs or require cross-agent contract knowledge.
3. **Memory's biggest value may be error prevention.** Run Phase 2 eval with tasks designed to trigger documented errors.
4. **Expand to SM-01 next** (has real QG data) for deeper validation.
5. **Consider "trick tasks"** — tasks where the obvious approach fails and only memory knows the workaround (e.g., locale-dependent regex, import chain issues).
