# Parallel Practices Audit — Axon v4.4

> **Date:** 2026-02-28
> **Focus:** Best practices to facilitate safe parallel work by 6 AI agents on the same codebase
> **Categories:** 8 | **Findings:** 25 | **Critical:** 7 | **High:** 12 | **Medium:** 6

## Top 5 Actions for Phase 0

| # | Action | Effort |
|---|---|---|
| PP-01 | Split types/platform.ts into domain files (quiz.ts, flashcard.ts, etc.) with barrel index | 30 min |
| PP-02 | Split student-routes.ts into per-agent sub-files | 20 min |
| PP-06 | Define TypeScript interfaces for useContentTree() and useStudySession() BEFORE implementation | 30 min |
| PP-23 | Create STUBS of shared hooks so agents can work in parallel from Day 1 | 30 min |
| PP-09 | Create verify-phase0 script for automatic validation | 45 min |

## Categories

### Collision Prevention (5 findings)
- PP-01: types/platform.ts single file collision (CRITICAL)
- PP-02: student-routes.ts multi-agent collision (CRITICAL)
- PP-03: AppContext.tsx modification timing (CRITICAL)
- PP-04: platformApi.ts extraction map missing (HIGH)
- PP-05: ensureGeneralKeyword() location after lib/api.ts deletion (HIGH)

### Interface Contracts (3 findings)
- PP-06: useContentTree() has no interface defined before implementation (CRITICAL)
- PP-07: useStudySession() shared but only Agent 5 owns it (HIGH)
- PP-08: ContentCascadeSelector props undefined (HIGH)

### Dependency Gates (3 findings)
- PP-09: No automatic Phase 0 completion verification (CRITICAL)
- PP-10: Phase 1A graduation criteria missing (CRITICAL)
- PP-11: No phase gate between Phase 2 and Phase 3 (HIGH)

### Git Workflow (2 findings)
- PP-12: No branching strategy for 6 agents (CRITICAL)
- PP-13: No hotfix protocol for shared files (HIGH)

### Recovery (2 findings)
- PP-14: No rollback strategy (HIGH)
- PP-15: StudentDataContext refactor risk (HIGH)

### Communication (2 findings)
- PP-16: No signaling protocol between agents (HIGH)
- PP-17: No decision log for inter-agent decisions (MEDIUM)

### Testing (2 findings)
- PP-18: No smoke test per agent before merge (CRITICAL)
- PP-19: No contract tests for shared hooks (HIGH)

### Missing Practices (6 findings)
- PP-20: No import boundary enforcement (CRITICAL)
- PP-21: No naming convention for components (HIGH)
- PP-22: No file lock mechanism (HIGH)
- PP-23: No stub strategy for blocked agents (HIGH)
- PP-24: No dependency graph visualization (MEDIUM)
- PP-25: No per-agent changelog (MEDIUM)

## Dependency DAG (Critical Path)

```
Phase 0 (Foundation) ─── BLOCKS ALL
├──→ Agent 4 (Admin) ──────────────────────────→ merge 2nd
├──→ Agent 6 (3D) ─────────────────────────────→ merge 1st
│
└──→ Phase 1A: Agent 2 (Content Core) ── BLOCKS 1,3,5
     ├── useContentTree() → Agent 1, 3, 5
     ├── content.ts → Agent 1, 3
     └── ContentCascadeSelector → Agent 1, 3

Agent 3 (mastery types) → Agent 5 (dashboard)
Agent 5 (useStudySession) → Agent 1, 3

Merge order: 6 → 4 → 2 → 1 → 3 → 5
```

## See interactive app for full details with implementation code.
