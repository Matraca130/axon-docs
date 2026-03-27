# PROMPT: Fase 4 — Backend Hooks + Publish Endpoint

> **Uso:** Copiar este prompt completo en Claude Code CLI con `/loop`.
> **Branch:** `feat/block-embeddings` desde `main`
> **Repo:** `C:\dev\axon\backend`
> **Validación final:** `deno check supabase/functions/server/index.ts`

---

## INSTRUCCIONES PARA EL AGENTE

Eres un agente de implementación quirúrgica para backend Deno/Hono. Tu memoria se resetea cada ~10 minutos. **SIEMPRE** empieza cada ciclo así:

### PASO 0 — ORIENTACIÓN (hacer SIEMPRE al iniciar)

```bash
# 1. Leer tu checkpoint de progreso
cat C:\dev\axon\backend\CHECKPOINT_FASE4.md 2>/dev/null || echo "NO_CHECKPOINT"

# 2. Si NO_CHECKPOINT → crear archivo y empezar desde TASK 1
# 3. Si existe → leer qué task está completada y continuar con la siguiente
```

### PASO 1 — CONTEXTO (solo primer ciclo)

```bash
cd C:\dev\axon\backend
git pull origin main
git checkout -b feat/block-embeddings main 2>/dev/null || git checkout feat/block-embeddings
```

Leer:
- `CLAUDE.md` y `docs/AGENT_INDEX.md` (reglas del repo)
- `supabase/functions/server/routes/content/crud.ts` (CRUD factory actual)
- `supabase/functions/server/crud-factory.ts` (buscar si tiene `afterWrite`)
- `supabase/functions/server/summary-hook.ts` (hook de summaries actual)
- `supabase/functions/server/auto-ingest.ts` (función `autoChunkAndEmbed`)
- `supabase/functions/server/openai-embeddings.ts` (función `generateEmbedding`)

---

## TASKS

### TASK 1: Verificar/agregar soporte `afterWrite` en crud-factory

**Archivo:** `supabase/functions/server/crud-factory.ts`

```bash
grep -n "afterWrite\|after_write\|onAfterWrite" supabase/functions/server/crud-factory.ts
```

- **Si existe:** Pasar a TASK 2 directamente.
- **Si NO existe:** Agregar soporte aditivo:
  1. En el type/interface de config, agregar: `afterWrite?: (params: AfterWriteParams) => void`
  2. Exportar el tipo: `export interface AfterWriteParams { action: 'create' | 'update' | 'delete'; row: Record<string, any>; }`
  3. En los handlers de POST, PUT, DELETE: después del `db` call exitoso, invocar `config.afterWrite?.({ action, row })`
  4. Esto es un cambio **aditivo** — NO modifica ninguna lógica existente

**Verificación:** `deno check supabase/functions/server/crud-factory.ts`

**Al completar:** Actualizar CHECKPOINT → `TASK 1: DONE`

---

### TASK 2: Actualizar CRUD factory para `summary-blocks`

**Archivo:** `supabase/functions/server/routes/content/crud.ts`
**Buscar:** El `registerCrud` existente para `summary-blocks` (alrededor de línea 123)

**Cambios:**
1. Agregar import al inicio: `import { onBlockWrite } from "../../block-hook.ts";`
2. Actualizar la config:
   - `hasCreatedBy: true` (era false)
   - `hasUpdatedAt: true` (era false)
   - Agregar `"style", "metadata"` a `createFields` y `updateFields`
   - Agregar `afterWrite: onBlockWrite`

**Resultado final del registerCrud:**
```typescript
registerCrud(contentCrudRoutes, {
  table: "summary_blocks",
  slug: "summary-blocks",
  parentKey: "summary_id",
  hasCreatedBy: true,
  hasUpdatedAt: true,
  hasOrderIndex: true,
  hasIsActive: true,
  requiredFields: ["type", "content"],
  createFields: [
    "type", "content", "order_index",
    "heading_text", "heading_level", "is_active",
    "style", "metadata",
  ],
  updateFields: [
    "type", "content", "order_index",
    "heading_text", "heading_level", "is_active",
    "style", "metadata",
  ],
  afterWrite: onBlockWrite,
});
```

**NOTA:** Este archivo NO compilará todavía porque `block-hook.ts` no existe. Se crea en TASK 3.

**Al completar:** Actualizar CHECKPOINT → `TASK 2: DONE`

---

### TASK 3: Crear `block-hook.ts`

**Archivo NUEVO:** `supabase/functions/server/block-hook.ts`

```typescript
/**
 * block-hook.ts — afterWrite hook for summary_blocks
 *
 * v3: NO embedding during edit. Only marks summary as dirty.
 * Embedding happens at publish time (publish-summary.ts).
 *
 * Fire-and-forget: errors are logged but never affect the CRUD response.
 * No debounce needed — dirty-flag is idempotent, and Edge Functions
 * don't persist in-memory state between invocations.
 */
import type { AfterWriteParams } from "./crud-factory.ts";
import { getAdminClient } from "./db.ts";

export function onBlockWrite({ action, row }: AfterWriteParams): void {
  const summaryId = row.summary_id as string;
  if (!summaryId) return;

  // Fire-and-forget
  markSummaryDirty(summaryId).catch((err) => {
    console.error(`[Block Hook] Error marking summary dirty ${summaryId}:`, err);
  });
}

async function markSummaryDirty(summaryId: string): Promise<void> {
  const db = getAdminClient();

  const { data: summary } = await db
    .from("summaries")
    .select("status")
    .eq("id", summaryId)
    .single();

  if (summary?.status === "published") {
    await db
      .from("summaries")
      .update({ status: "review" })
      .eq("id", summaryId);
    console.log(`[Block Hook] Summary ${summaryId} reverted to 'review' (blocks changed post-publish)`);
  }
}
```

**IMPORTANTE:** Ajustar los imports (`getAdminClient`, `AfterWriteParams`) a los paths y nombres exactos que usa el proyecto. Leer `db.ts` y `crud-factory.ts` para confirmar.

**Verificación:** `deno check supabase/functions/server/block-hook.ts`

**Al completar:** Actualizar CHECKPOINT → `TASK 3: DONE`

---

### TASK 4: Crear `block-flatten.ts`

**Archivo NUEVO:** `supabase/functions/server/block-flatten.ts`

```typescript
/**
 * block-flatten.ts — Convert structured blocks to plain markdown text
 *
 * Used by publish-summary.ts to generate content_markdown from blocks.
 * Each block type has its own flattening logic for embeddings + FTS.
 */

interface BlockRow {
  type: string;
  content: Record<string, any>;
  order_index: number;
}

export function flattenBlocksToMarkdown(blocks: BlockRow[]): string {
  return blocks
    .sort((a, b) => a.order_index - b.order_index)
    .map(flattenBlock)
    .filter(Boolean)
    .join("\n\n---\n\n");
}

function flattenBlock(block: BlockRow): string {
  const c = block.content || {};
  const s = stripKeywordMarkers;
  switch (block.type) {
    case "prose":
      return [c.title && `## ${s(c.title)}`, s(c.content)]
        .filter(Boolean).join("\n\n");

    case "key_point":
      return [
        `**CONCEPTO CLAVE: ${s(c.title || "")}**`,
        c.importance === "critical" ? "[CRÍTICO]" : "",
        s(c.content),
      ].filter(Boolean).join("\n");

    case "stages":
      return [
        c.title && `## ${s(c.title)}`,
        ...(c.items || []).map((item: any) =>
          `Etapa ${item.stage}: ${s(item.title)} — ${s(item.content)}`
        ),
      ].filter(Boolean).join("\n");

    case "comparison":
      return [
        c.title && `## ${s(c.title)}`,
        (c.headers || []).map(s).join(" | "),
        ...(c.rows || []).map((row: string[]) => row.map(s).join(" | ")),
      ].filter(Boolean).join("\n");

    case "list_detail":
      return [
        c.title && `## ${s(c.title)}`,
        s(c.intro),
        ...(c.items || []).map((item: any) =>
          `• ${s(item.label)}: ${s(item.detail)}`
        ),
      ].filter(Boolean).join("\n");

    case "grid":
      return [
        c.title && `## ${s(c.title)}`,
        ...(c.items || []).map((item: any) =>
          `• ${s(item.label)}: ${s(item.detail)}`
        ),
      ].filter(Boolean).join("\n");

    case "two_column":
      return (c.columns || []).map((col: any) => [
        col.title && `### ${s(col.title)}`,
        ...(col.items || []).map((item: any) =>
          `• ${s(item.label)}: ${s(item.detail)}`
        ),
      ].filter(Boolean).join("\n")).join("\n\n");

    case "callout":
      return [
        `[${(c.variant || "info").toUpperCase()}] ${s(c.title || "")}`,
        s(c.content),
      ].filter(Boolean).join("\n");

    case "image_reference":
      return `[Imagen: ${s(c.caption) || s(c.description) || "Sin descripción"}]`;

    case "section_divider":
      return s(c.label) || "";

    // Legacy CMS types (11 existing summaries)
    case "text":
      return s(c.html?.replace(/<[^>]+>/g, "") || c.text || "");
    case "heading":
      return s(c.text || "");

    default:
      return JSON.stringify(c);
  }
}

function stripKeywordMarkers(text: string | undefined): string {
  if (!text) return "";
  return text.replace(/\{\{([^}]+)\}\}/g, "$1");
}
```

**Verificación:** `deno check supabase/functions/server/block-flatten.ts`

**Al completar:** Actualizar CHECKPOINT → `TASK 4: DONE`

---

### TASK 5: Crear `publish-summary.ts`

**Archivo NUEVO:** `supabase/functions/server/routes/content/publish-summary.ts`

Endpoint: `POST /content/summaries/:id/publish`

**Lógica:**
1. Authenticate + get summaryId from param
2. Verify summary status = 'review' and has active blocks
3. `flattenBlocksToMarkdown(blocks)` → update `content_markdown`
4. Set status = 'published' FIRST (embeddings are enhancement)
5. `autoChunkAndEmbed(summaryId)` — reuses existing pipeline
6. Per-block embeddings in parallel batches of 5 (Promise.allSettled)
7. Return `{ status, chunks_count, blocks_embedded }`

**IMPORTANTE:** Leer los imports existentes del proyecto para encontrar:
- `authenticate` (o como se llame la función de auth)
- `autoChunkAndEmbed` (path exacto en auto-ingest.ts)
- `generateEmbedding` (path exacto en openai-embeddings.ts)
- El client de Supabase admin (getAdminClient o similar)
- Cómo se registran rutas en el router Hono existente

**Registrar la ruta** en el archivo de routes correspondiente (probablemente `crud.ts` o un `index.ts`):
```typescript
import { publishSummary } from "./publish-summary.ts";
contentCrudRoutes.post("/summaries/:id/publish", publishSummary);
```

**Verificación:** `deno check` del archivo + el index.ts

**Al completar:** Actualizar CHECKPOINT → `TASK 5: DONE`

---

### TASK 6: Guardar summary-hook.ts para v3

**Archivo:** `supabase/functions/server/summary-hook.ts`

**Cambio:** En `onSummaryWrite`, agregar guard para que NO ejecute `autoChunkAndEmbed` si el summary tiene bloques activos:

```typescript
// v3: si el summary tiene summary_blocks, el embedding se maneja via publish-summary.ts
const { count: blockCount } = await db
  .from("summary_blocks")
  .select("id", { count: "exact", head: true })
  .eq("summary_id", summaryId)
  .eq("is_active", true);

if (blockCount && blockCount > 0) {
  console.log(`[Summary Hook] Skipping autoChunkAndEmbed for ${summaryId} — has ${blockCount} blocks (use publish endpoint)`);
  return;
}
// ... existing autoChunkAndEmbed logic continues for non-block summaries
```

**Verificación:** `deno check supabase/functions/server/summary-hook.ts`

**Al completar:** Actualizar CHECKPOINT → `TASK 6: DONE`

---

### TASK 7: Full build + Commit + Push

```bash
cd C:\dev\axon\backend
deno check supabase/functions/server/index.ts
```

Si pasa limpio:

```bash
git add supabase/functions/server/block-hook.ts supabase/functions/server/block-flatten.ts supabase/functions/server/routes/content/publish-summary.ts supabase/functions/server/routes/content/crud.ts supabase/functions/server/summary-hook.ts supabase/functions/server/crud-factory.ts
git commit -m "feat: block hooks, flatten, and publish endpoint for block-based summaries

- Add afterWrite hook support to crud-factory (additive change)
- Update summary-blocks CRUD: hasCreatedBy, hasUpdatedAt, style, metadata
- Add block-hook.ts: marks summary dirty on block edit (no embedding)
- Add block-flatten.ts: structured blocks → markdown for embeddings
- Add publish-summary.ts: POST /summaries/:id/publish (flatten + embed)
- Guard summary-hook.ts: skip autoChunkAndEmbed for block-based summaries

Part of: block-based summaries migration (Fase 4)"
git push -u origin feat/block-embeddings
```

**Al completar:** Actualizar CHECKPOINT → `TASK 7: DONE — ALL COMPLETE`

---

## CHECKPOINT FILE FORMAT

Crear/actualizar `C:\dev\axon\backend\CHECKPOINT_FASE4.md`:

```markdown
# Fase 4 Progress
- TASK 1: DONE | PENDING | IN_PROGRESS (afterWrite in factory)
- TASK 2: DONE | PENDING | IN_PROGRESS (CRUD config)
- TASK 3: DONE | PENDING | IN_PROGRESS (block-hook.ts)
- TASK 4: DONE | PENDING | IN_PROGRESS (block-flatten.ts)
- TASK 5: DONE | PENDING | IN_PROGRESS (publish-summary.ts)
- TASK 6: DONE | PENDING | IN_PROGRESS (summary-hook guard)
- TASK 7: DONE | PENDING | IN_PROGRESS (build + commit)
## Notes
(problemas encontrados, paths ajustados, etc.)
```

## REGLAS CRÍTICAS

1. **NO tocar archivos no listados.** Cambios mínimos y quirúrgicos.
2. **Leer el código existente ANTES de escribir.** Los imports, helpers y patterns del proyecto mandan. Si el proyecto usa `createClient()` en vez de `getAdminClient()`, usa lo del proyecto.
3. **NO instalar dependencias nuevas.**
4. **Fire-and-forget:** block-hook NUNCA debe bloquear la respuesta CRUD.
5. **Idempotente:** publicar dos veces no debe romper nada.
6. **Leer CHECKPOINT al inicio de CADA ciclo.** No repetir trabajo hecho.
7. **Si `deno check` falla** → arreglarlo ANTES de marcar task como DONE.
8. **Un commit al final** (Task 7). No hacer commits intermedios.
