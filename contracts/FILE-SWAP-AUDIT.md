# File-Swap Parallel Audit — Axon v4.4

> **Date:** 2026-02-28
> **Model:** Each agent receives a COMPLETE FUNCTIONAL PROJECT with only THEIR section populated
> **Findings:** 31 | **Critical:** 10 | **High:** 14 | **Medium:** 7

## Real Workflow (confirmed)

```
1. Coordinador completa Phase 0 al 100%
2. Copia el proyecto completo 6 veces
3. En cada copia, solo los archivos de ESE agente estan poblados
   (los de otros agentes estan vacios o no existen)
4. Cada agente trabaja en su copia aislada
5. Coordinador toma los archivos modificados y los SUSTITUYE en el proyecto real
6. Swap en ORDEN: 6,4 → 2 → verify → 5 → verify → 1,3 → final verify
```

## Critical Phase 0 Additions (P0-10 through P0-17)

| Task | Description | Effort |
|---|---|---|
| P0-10 | Split types/platform.ts into domain files per agent | 30 min |
| P0-11 | Split student-routes.ts into per-agent sub-files | 20 min |
| P0-12 | Split professor-routes.ts into per-agent sub-files | 15 min |
| P0-13 | Create STUBS for shared hooks with rigid interfaces | 30 min |
| P0-14 | Create STUBS for all service files with FINAL names | 30 min |
| P0-15 | Resolve file duplicates (model3d, mux, studyQueue) | 20 min |
| P0-16 | Deprecate AppContext navigation state | 15 min |
| P0-17 | Convert platformApi.ts into bridge of re-exports | 30 min |
| P0-18 | Document migration map (existing files → target files) | 20 min |
| P0-19 | Delete legacy-stubs.ts + dead code consumers | 15 min |
| P0-20 | Document which design system to use | 10 min |
| P0-21 | Add DEPRECATED headers to apiConfig.ts and lib/api.ts | 5 min |

## All 31 Findings

### Write Collisions (5)
- FS-01: types/platform.ts — 6 agents write (CRITICAL)
- FS-02: student-routes.ts — 5 agents write (CRITICAL)
- FS-03: professor-routes.ts — 3 agents write (CRITICAL)
- FS-04: AppContext.tsx — Agent 5 modifies, 1-3 read (HIGH)
- FS-05: platformApi.ts — all extract, nobody deletes (HIGH)

### Phantom Imports (4)
- FS-06: api-client.ts must exist before distribution (CRITICAL)
- FS-07: useContentTree() stub needed (HIGH)
- FS-08: ensureGeneralKeyword() must be relocated (HIGH)
- FS-09: File names are import contracts (HIGH)

### Interface Mismatches (3)
- FS-10: useContentTree() return type undefined (CRITICAL)
- FS-11: CRUD vs custom response format (HIGH)
- FS-12: useStudySession() signature mismatch (HIGH)

### Missing Context (6)
- FS-13: spacedRepetition.ts missing from Agent 3 (HIGH)
- FS-14: muxApi.ts missing from Agent 2 (HIGH)
- FS-15: studentApi.ts missing from Agent 5 (HIGH)
- FS-16: model3d duplicate files (MEDIUM)
- FS-28: Agents see other agents' populated files (HIGH)
- FS-30: apiConfig.ts LEGACY exists, agents might use it (HIGH)

### Swap Order (2)
- FS-17: Swap order is mandatory (CRITICAL)
- FS-18: Post-swap verification checklist (HIGH)

### Phase 0 Gaps (4)
- FS-19: Must create ALL stubs before distributing (CRITICAL)
- FS-20: AuthContext must be consolidated first (CRITICAL)
- FS-26: Existing service files would be overwritten (CRITICAL)
- FS-27: legacy-stubs.ts confuses agents (CRITICAL)
- FS-29: Two design systems without guidance (HIGH)

### Packet Design (6)
- FS-21: Each agent needs complete packet (CRITICAL)
- FS-22: README with agent-specific rules (CRITICAL)
- FS-23: ParentKey map per packet (HIGH)
- FS-24: Explicit list of allowed new files (HIGH)
- FS-25: READONLY files frozen during cycle (MEDIUM)
- FS-31: Agent 2 dual component directories (CRITICAL)

## Swap Order (MANDATORY)

1. **Round 1:** Agent 6 (3D) + Agent 4 (Admin) — independent, any order
2. **Round 2:** Agent 2 (Content) — provides useContentTree() real
3. **VERIFY:** `tsc --noEmit`
4. **Round 3:** Agent 5 (Dashboard) — provides useStudySession() real
5. **VERIFY:** `tsc --noEmit`
6. **Round 4:** Agent 1 (Quiz) + Agent 3 (Flashcard) — consumers
7. **FINAL:** `tsc --noEmit` + `vite build`

## See interactive app for packet manifests with copy-to-clipboard.
