# File-Swap Parallel Audit — Axon v4.4

> **Date:** 2026-02-28
> **Model:** Each agent receives their files in isolation, works independently, coordinator swaps files back
> **Findings:** 25 | **Critical:** 8 | **High:** 12 | **Medium:** 5

## Workflow

```
Phase 0 (complete 100%)
    ↓
Package files per agent (OWNED + READONLY + CONTEXT docs)
    ↓
Distribute to 6 agents simultaneously
    ↓
Each agent works in ISOLATION (no visibility of other agents)
    ↓
Coordinator receives modified OWNED files back
    ↓
Swap files in ORDER: 6,4 → 2 → verify → 5 → verify → 1,3 → final verify
```

## Critical Phase 0 Additions

| Task | Description |
|---|---|
| P0-10 | Split types/platform.ts into domain files (quiz.ts, flashcard.ts, etc.) |
| P0-11 | Split student-routes.ts into per-agent sub-files |
| P0-12 | Split professor-routes.ts into per-agent sub-files |
| P0-13 | Create STUBS for shared hooks (useContentTree, useStudySession, ContentCascadeSelector) |
| P0-14 | Create STUBS for all service files with FINAL names |
| P0-15 | Resolve duplicates (lib/model3d-api.ts, lib/muxApi.ts, lib/studyQueueApi.ts) |
| P0-16 | Deprecate AppContext navigation state |
| P0-17 | Convert platformApi.ts into bridge of re-exports |

## Swap Order (MANDATORY)

1. Round 1: Agent 6 (3D) + Agent 4 (Admin) — independent
2. Round 2: Agent 2 (Content) — provides useContentTree() real
3. VERIFY: tsc --noEmit
4. Round 3: Agent 5 (Dashboard) — provides useStudySession() real
5. VERIFY: tsc --noEmit
6. Round 4: Agent 1 (Quiz) + Agent 3 (Flashcard) — consumers
7. FINAL: tsc --noEmit + vite build

## Key Findings

### Write Collisions (5)
- FS-01: types/platform.ts — 6 agents write to same file (SPLIT into domain files)
- FS-02: student-routes.ts — 5 agents add routes (SPLIT into sub-files)
- FS-03: professor-routes.ts — 3 agents add routes (SPLIT into sub-files)
- FS-04: AppContext.tsx — Agent 5 modifies, Agents 1-3 read
- FS-05: platformApi.ts — all extract, nobody deletes

### Phantom Imports (4)
- FS-06: api-client.ts must exist before distribution
- FS-07: useContentTree() stub needed for Agents 1,3,5
- FS-08: ensureGeneralKeyword() must be relocated
- FS-09: File names are import contracts — never rename

### Interface Mismatches (3)
- FS-10: useContentTree() return type must be defined in stub
- FS-11: CRUD vs custom response format per endpoint
- FS-12: useStudySession() signature must match all consumers

### Packet Design (5)
- FS-21: Each agent needs complete self-contained packet
- FS-22: README with agent-specific rules
- FS-23: ParentKey map in every packet
- FS-24: Explicit list of allowed new files
- FS-25: READONLY files are frozen during work cycle

## See interactive app for packet manifests per agent.
