# 🎯 MISSION CONTROL — Block-Based Summaries Migration

> **Última actualización:** 2026-03-24
> **Actualizar este archivo** cada vez que una fase cambie de estado.
> **Ubicación:** OneDrive → PROJETO DESAROLLO RESUMEN/ (accesible desde cualquier máquina)

---

## ESTADO GLOBAL

| Fase | Descripción | Repo | Branch | Estado | Agente |
|------|------------|------|--------|--------|--------|
| 0 | Status flow summaries (SQL) | Supabase DB | — | ✅ DONE | Cowork MCP |
| 1 | Migración summary_blocks (SQL) | Supabase DB | — | ✅ DONE | Cowork MCP |
| 2-T | Tests student renderers | frontend | `feat/block-based-summaries` | ⬜ PENDING | CLI /loop |
| 2 | Student block rendering | frontend | `feat/block-based-summaries` | ⬜ PENDING | CLI /loop |
| 4-T | Tests backend hooks/flatten | backend | `feat/block-embeddings` | ⬜ PENDING | CLI /loop |
| 4 | Backend hooks + publish | backend | `feat/block-embeddings` | ⬜ PENDING | CLI /loop |
| 3 | Primer resumen real | Cowork + DB | — | ⬜ PENDING | Cowork manual |
| 3b | Generación IA desde Cowork | Cowork + DB | — | ⬜ PENDING | Cowork manual |
| 5 | Block editor profesor | frontend | `feat/block-editor-professor` | ⬜ PENDING | CLI /loop |
| 6 | E2E testing + polish | all | — | ⬜ PENDING | Cowork + CLI |

**Leyenda:** ⬜ PENDING → 🔄 IN_PROGRESS → ✅ DONE → ❌ BLOCKED

---

## DEPENDENCIAS (qué necesita qué)

```
Fase 0 ──→ Fase 1 ──→ Fase 2-T ──→ Fase 2 ──→ [MERGE PR] ──→ Fase 5
                  └──→ Fase 4-T ──→ Fase 4           │
                                                       └──→ Fase 3 ──→ Fase 3b
```

- **Fases 2 y 4 son PARALELAS** (repos distintos)
- **Fase 5 requiere Fase 2 mergeada a main**
- **Fase 3 requiere Fase 2 deployed + Fase 4 deployed**
- **Tests (T) van ANTES de implementación**

---

## CHECKPOINTS POR AGENTE

### Fase 0+1 (SQL — Cowork)
- [x] Step 0.1: Verificar estado actual
- [x] Step 0.2: ALTER summaries + constraint (6 statuses incl. rejected)
- [x] Step 0.3: 4 tests Fase 0 PASSED
- [x] Step 1.1: Pre-flight checks
- [x] Step 1.2: Migración principal (content→JSONB, 5 cols, HNSW, trigger clock_timestamp)
- [x] Step 1.3: RPCs creadas + REVOKE/GRANT (rag→service_role, sync→authenticated)
- [x] Step 1.4: 15 tests Fase 1 PASSED (3 tests de seguridad nuevos)

### Fase 2-T (Tests Frontend — CLI)
- [ ] TASK 1: test-utils + fixtures
- [ ] TASK 2: 10 test files (50+ tests)
- [ ] TASK 3: ViewerBlock integration test
- [ ] TASK 4: Verify all fail (red phase)
- [ ] TASK 5: Commit + push

### Fase 2 (Impl Frontend — CLI)
- [ ] TASK 1: Types en summariesApi.ts
- [ ] TASK 2: 10 renderers + barrel
- [ ] TASK 3: Integrar en ViewerBlock.tsx
- [ ] TASK 4: SummaryViewer.tsx wrapper
- [ ] TASK 5: npm run build ✅
- [ ] TASK 6: Commit + push
- [ ] **PR creada y mergeada a main**

### Fase 4-T (Tests Backend — CLI)
- [ ] TASK 1: Fixtures
- [ ] TASK 2: 22 tests block-flatten
- [ ] TASK 3: 5 tests block-hook
- [ ] TASK 4: Verify fail + commit

### Fase 4 (Impl Backend — CLI)
- [ ] TASK 1: afterWrite en crud-factory
- [ ] TASK 2: CRUD config summary-blocks
- [ ] TASK 3: block-hook.ts
- [ ] TASK 4: block-flatten.ts
- [ ] TASK 5: publish-summary.ts
- [ ] TASK 6: summary-hook.ts guard
- [ ] TASK 7: deno check ✅ + commit

### Fase 5 (Editor Profesor — CLI)
- [ ] TASK 1: useBlockEditorMutations
- [ ] TASK 2: Base components (4)
- [ ] TASK 3: Block forms (10)
- [ ] TASK 4: BlockFormRouter
- [ ] TASK 5: BlockEditor.tsx
- [ ] TASK 6: SummaryDetailView.tsx
- [ ] TASK 7: npm run build ✅ + commit

---

## LOG DE SESIONES

| Fecha | Qué se hizo | Quién | Notas |
|-------|-------------|-------|-------|
| 2026-03-24 | Prompts creados para todas las fases | Cowork | TDD: tests primero |
| 2026-03-24 | Fase 0+1 SQL ejecutada — 15/15 tests PASSED | Cowork MCP | Auditada 2x, clock_timestamp, REVOKE anon |

---

## NOTAS IMPORTANTES

- **OneDrive corrupts .git/** — NUNCA clonar repos en OneDrive
- **Repos viven en `C:\dev\axon\`** (frontend, backend, docs)
- **Este archivo vive en OneDrive** — es el punto de coordinación
- **Cada agente tiene su CHECKPOINT local** en su repo
- **Este archivo es el GLOBAL** — actualizar manualmente cuando completes cada fase
