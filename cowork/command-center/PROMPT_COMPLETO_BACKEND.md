# PROMPT COMPLETO: Backend — Tests + Implementación (Fase 4)

> **Uso:** Copiar TODO este prompt en Claude Code CLI → `/loop`
> **Branch:** `feat/block-embeddings` desde `main`
> **Repo:** `C:\dev\axon\backend`
> **Tiempo total:** ~4-5h (tests ~1h + implementación ~3-4h)
> **La memoria se resetea cada ~10 min.** El archivo PROGRESS.md te dice dónde vas.

---

## 🚨 REGLA ABSOLUTA: JAMÁS TRABAJAR EN MAIN 🚨

**Antes de escribir UNA SOLA LÍNEA de código, verificar la branch:**

```bash
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  echo "❌ ABORT: Estás en $CURRENT_BRANCH — PROHIBIDO. Cambiando a feature branch..."
  git checkout feat/block-embeddings 2>/dev/null || git checkout -b feat/block-embeddings main
fi
echo "✅ Branch segura: $(git branch --show-current)"
```

**Si por CUALQUIER razón estás en main → cambia a `feat/block-embeddings` ANTES de hacer nada.**
**NUNCA hacer commit, push, ni editar archivos estando en main.**

---

## REGLA #1: SIEMPRE EMPIEZA AQUÍ

```bash
# 1. Verificar branch (NUNCA main)
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  git checkout feat/block-embeddings 2>/dev/null || git checkout -b feat/block-embeddings main
fi

# 2. Leer progreso
cat PROGRESS.md 2>/dev/null || echo "FRESH_START"
```

- `FRESH_START` → ve a INICIALIZACIÓN
- Una task → continúa desde ahí
- `ALL_COMPLETE` → responde "✅ Fase 4 completa"

---

## INICIALIZACIÓN (solo primera vez)

```bash
cd C:\dev\axon\backend
git pull origin main
git checkout -b feat/block-embeddings main 2>/dev/null || git checkout feat/block-embeddings
```

Leer para contexto:
- `CLAUDE.md` y `docs/AGENT_INDEX.md`
- `supabase/functions/server/routes/content/crud.ts` (CRUD factory actual)
- `supabase/functions/server/crud-factory.ts` (buscar si tiene `afterWrite`)
- `supabase/functions/server/summary-hook.ts` (hook actual)
- `supabase/functions/server/auto-ingest.ts` (buscar `autoChunkAndEmbed`)
- `supabase/functions/server/tests/` (pattern de tests existentes)

Crear PROGRESS.md:
```bash
cat > PROGRESS.md << 'EOF'
# Fase 4 — Backend Hooks + Flatten + Publish
## Current: TASK_1
## Phase: TESTS
## Tasks:
- TASK_1: PENDING — test fixtures
- TASK_2: PENDING — 22 tests block-flatten
- TASK_3: PENDING — 5 tests block-hook
- TASK_4: PENDING — verify tests fail (red)
- TASK_5: PENDING — afterWrite in crud-factory
- TASK_6: PENDING — CRUD config summary-blocks
- TASK_7: PENDING — block-hook.ts
- TASK_8: PENDING — block-flatten.ts
- TASK_9: PENDING — publish-summary.ts
- TASK_10: PENDING — summary-hook.ts guard
- TASK_11: PENDING — deno check + tests pass (green)
- TASK_12: PENDING — commit + push
EOF
```

---

## REFERENCIA: Block Schema (para flatten logic)

Crear `.ref/block-schema.json` al iniciar (para consultar campos de cada tipo):

```bash
mkdir -p .ref
cat > .ref/block-schema.json << 'SCHEMA_EOF'
{
  "title": "Axon Summary Block Schema v1.0",
  "block_types": {
    "prose": { "required": ["type","title","content"], "flatten": "## {title}\\n\\n{content}" },
    "key_point": { "required": ["type","title","content","importance"], "flatten": "🔑 CONCEPTO CLAVE ({importance}): {title}\\n{content}" },
    "stages": { "required": ["type","title","items"], "flatten": "## {title}\\nitems[].stage. items[].title — items[].content" },
    "comparison": { "required": ["type","title","headers","rows"], "flatten": "## {title}\\nheaders pipe-separated\\nrows pipe-separated" },
    "list_detail": { "required": ["type","title","items"], "flatten": "## {title}\\n{intro}\\n- items[].label: items[].detail" },
    "grid": { "required": ["type","title","columns","items"], "flatten": "## {title}\\n- items[].label: items[].detail" },
    "two_column": { "required": ["type","columns"], "flatten": "### col[0].title\\n- items\\n### col[1].title\\n- items" },
    "callout": { "required": ["type","variant","title","content"], "flatten": "[{VARIANT}] {title}: {content}" },
    "image_reference": { "required": ["type","description","caption"], "flatten": "[Imagen: {description}] {caption}" },
    "section_divider": { "required": ["type"], "flatten": "--- {label} ---" }
  },
  "keyword_syntax": "{{keyword_id}} — strip markers in flatten (e.g. {{aterosclerosis}} → aterosclerosis)",
  "legacy_types": {
    "text": "strip HTML tags, extract text content",
    "heading": "output as ## heading text"
  }
}
SCHEMA_EOF
echo '.ref/' >> .gitignore
```

---

## ═══════════════════════════════════════
## FASE A: TESTS (TDD Red Phase)
## ═══════════════════════════════════════

### TASK_1: Test fixtures

Crear `supabase/functions/server/tests/block-fixtures.ts` con:
- `TestBlock` interface: `{ type: string; content: Record<string,any>; order_index: number }`
- `BLOCKS` record: fixtures para los 10 tipos edu + 2 legacy (text, heading) + edge cases
- `makeBlockList(...keys)` helper que crea array ordenado

Incluir fixtures para: prose (con {{keywords}}), key_point (critical), stages (3 items con severity), comparison (3 cols), list_detail, grid, two_column, callout (tip, warning, exam), image_reference, section_divider (con y sin label), legacy_text (con HTML), legacy_heading.

Actualizar PROGRESS → `TASK_1: DONE`

---

### TASK_2: 22 tests para block-flatten

Crear `supabase/functions/server/tests/block-flatten.test.ts`

Usar `Deno.test` + `assertEquals`/`assertStringIncludes`/`assert` de `https://deno.land/std/assert/mod.ts`.

**Tests a crear (mínimo 22):**
1. prose: título como ## + contenido
2. prose: strips {{keyword}} markers
3. key_point: incluye CONCEPTO CLAVE + importancia
4. stages: lista etapas con números
5. stages: strips keywords en contenido
6. comparison: headers y rows pipe-separated
7. list_detail: intro + items con bullet
8. grid: items con label + detail
9. two_column: ambas columnas
10. callout tip: incluye [TIP] + contenido
11. callout sin título: no crash
12. image_reference: placeholder text
13. section_divider con label
14. section_divider vacío → string vacío
15. legacy text: strips HTML tags
16. legacy heading: produce texto
17. múltiples bloques separados por ---
18. respeta order_index sorting (invertido → sale ordenado)
19. array vacío → string vacío
20. tipo desconocido → JSON.stringify fallback
21. content null/undefined → no crash
22. resumen completo realista (9 bloques, >200 chars, sin {{, sin }})

**IMPORTANTE:** Comentar la línea de import de `block-flatten.ts` hasta que exista:
```typescript
// TODO: uncomment when block-flatten.ts exists
// import { flattenBlocksToMarkdown } from "../block-flatten.ts";
```

Cuando lo implementes (TASK_8), descomentas el import.

Actualizar PROGRESS → `TASK_2: DONE`

---

### TASK_3: 5 tests para block-hook

Crear `supabase/functions/server/tests/block-hook.test.ts`

Tests (con mocks del Supabase client — seguir pattern existente del proyecto):
1. No crash si summary_id falta en row
2. No hace nada si status = 'review' (ya está dirty)
3. Reverts 'published' → 'review' cuando se edita un bloque
4. No hace nada si status = 'draft'
5. Fire-and-forget: errores se loguean, no se propagan

Actualizar PROGRESS → `TASK_3: DONE`

---

### TASK_4: Verify + commit tests

```bash
deno test supabase/functions/server/tests/block-flatten.test.ts --allow-env --allow-net --allow-read 2>&1 | tail -20
```

Expected: falla por import (módulo no existe). Si hay errores de SINTAXIS → arreglar.

```bash
git add supabase/functions/server/tests/
git commit -m "test: block-flatten (22 tests) + block-hook (5 tests) — TDD red phase"
```

Actualizar PROGRESS → `TASK_4: DONE`, Phase: IMPLEMENTATION

---

## ═══════════════════════════════════════
## FASE B: IMPLEMENTACIÓN (TDD Green Phase)
## ═══════════════════════════════════════

### TASK_5: afterWrite en crud-factory

**Archivo:** `supabase/functions/server/crud-factory.ts`

```bash
grep -n "afterWrite\|after_write\|onAfterWrite" supabase/functions/server/crud-factory.ts
```

- **Si YA existe** → skip, marcar DONE
- **Si NO existe** → agregar de forma aditiva:
  - `export interface AfterWriteParams { action: 'create'|'update'|'delete'; row: Record<string,any>; }`
  - En la interface de config: `afterWrite?: (params: AfterWriteParams) => void`
  - En handlers POST/PUT/DELETE: después del db call exitoso, `config.afterWrite?.({ action, row })`

Actualizar PROGRESS → `TASK_5: DONE`

---

### TASK_6: CRUD config summary-blocks

**Archivo:** `supabase/functions/server/routes/content/crud.ts`

Buscar el `registerCrud` de `summary-blocks`. Cambiar:
- `hasCreatedBy: true`, `hasUpdatedAt: true`
- Agregar `"style", "metadata"` a createFields y updateFields
- Agregar `afterWrite: onBlockWrite` (import se agrega en TASK_7)
- Agregar import: `import { onBlockWrite } from "../../block-hook.ts";`

**NOTA:** No compilará hasta crear block-hook.ts en TASK_7.

Actualizar PROGRESS → `TASK_6: DONE`

---

### TASK_7: block-hook.ts

**Archivo NUEVO:** `supabase/functions/server/block-hook.ts`

Hook fire-and-forget. Cuando un bloque se edita:
- Si summary status = 'published' → revertir a 'review'
- Si status = 'review'/'raw'/'draft' → no hacer nada (ya dirty)
- Errores se loguean, nunca se propagan

**IMPORTANTE:** Usar los imports/helpers EXACTOS del proyecto (leer db.ts, crud-factory.ts).

Actualizar PROGRESS → `TASK_7: DONE`

---

### TASK_8: block-flatten.ts

**Archivo NUEVO:** `supabase/functions/server/block-flatten.ts`

`flattenBlocksToMarkdown(blocks)` → string markdown.
- Sort by order_index
- Each block type has its own flatten logic
- `stripKeywordMarkers()` → remove `{{...}}` wrappers
- Bloques separados por `\n\n---\n\n`
- Legacy types: strip HTML, extract text

**Descomentar el import en los tests:**
```bash
# En block-flatten.test.ts, descomentar la línea de import
```

Actualizar PROGRESS → `TASK_8: DONE`

---

### TASK_9: publish-summary.ts

**Archivo NUEVO:** `supabase/functions/server/routes/content/publish-summary.ts`

Endpoint: `POST /content/summaries/:id/publish`

1. Auth + get summaryId
2. Verify status = 'review' + has blocks
3. flattenBlocksToMarkdown → update content_markdown
4. Status → 'published' FIRST
5. autoChunkAndEmbed (reusa pipeline existente)
6. Per-block embeddings en batches de 5 (Promise.allSettled)
7. Return { status, chunks_count, blocks_embedded }

**Registrar ruta** en el router Hono (buscar dónde se registran las rutas de content).

**IMPORTANTE:** Leer imports del proyecto. Buscar cómo se hace auth, cómo se accede al DB admin, paths de auto-ingest y openai-embeddings.

Actualizar PROGRESS → `TASK_9: DONE`

---

### TASK_10: Guard en summary-hook.ts

**Archivo:** `supabase/functions/server/summary-hook.ts`

En `onSummaryWrite`, agregar guard: si el summary tiene summary_blocks activos, skip autoChunkAndEmbed (lo maneja publish-summary.ts).

Actualizar PROGRESS → `TASK_10: DONE`

---

### TASK_11: deno check + tests green

```bash
deno check supabase/functions/server/index.ts
deno test supabase/functions/server/tests/block-flatten.test.ts --allow-env --allow-net --allow-read
deno test supabase/functions/server/tests/block-hook.test.ts --allow-env --allow-net --allow-read
```

Si falla → arreglar. Re-run hasta verde.

Actualizar PROGRESS → `TASK_11: DONE`

---

### TASK_12: Commit + Push

```bash
git add supabase/functions/server/block-hook.ts supabase/functions/server/block-flatten.ts supabase/functions/server/routes/content/publish-summary.ts supabase/functions/server/routes/content/crud.ts supabase/functions/server/summary-hook.ts supabase/functions/server/crud-factory.ts supabase/functions/server/tests/
git commit -m "feat: block hooks, flatten, publish endpoint + test suite (TDD green)

- afterWrite hook support in crud-factory
- block-hook.ts: dirty-flag on block edit (no embedding)
- block-flatten.ts: blocks → markdown (22 tests passing)
- publish-summary.ts: flatten + embed at publish time
- Guard summary-hook.ts: skip embed for block-based summaries
- 27 tests total (22 flatten + 5 hook)

Part of: block-based summaries migration (Fase 4)"
git push -u origin feat/block-embeddings
```

```bash
cat > PROGRESS.md << 'EOF'
# Fase 4 — Backend Hooks + Flatten + Publish
## Current: ALL_COMPLETE
## Phase: DONE
## All 12 tasks completed successfully.
EOF
```

---

## REGLAS CRÍTICAS

0. **🚨 JAMÁS TRABAJAR EN MAIN.** Verificar branch al inicio de CADA ciclo. Si estás en main → `git checkout feat/block-embeddings`. NUNCA hacer commit/push en main. Si detectas que hiciste commit en main, PARA y avisa al usuario.
1. **Leer PROGRESS.md AL INICIO de cada ciclo.**
2. **Leer código existente ANTES de escribir.** Imports, helpers, patterns del proyecto mandan.
3. **NO instalar dependencias nuevas.**
4. **Fire-and-forget:** block-hook NUNCA bloquea la respuesta CRUD.
5. **Si deno check o tests fallan** → arreglar ANTES de marcar DONE.
6. **Un commit al final** (TASK_12). Solo en `feat/block-embeddings`, JAMÁS en main.
7. **Antes de git push:** `git branch --show-current` — si dice main, ABORTAR.
