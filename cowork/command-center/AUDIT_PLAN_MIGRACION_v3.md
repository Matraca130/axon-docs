# Auditoría Arquitectural: PLAN_MIGRACION_BLOQUES_v3.md

> **Auditor:** Claude (Cowork) — Architectural Review
> **Fecha:** 2026-03-24
> **Scope:** Revisión exhaustiva del plan de integración antes de ejecución por agente
> **Veredicto global:** Plan SÓLIDO con 7 defectos críticos, 9 warnings, 4 mejoras estratégicas

---

## VEREDICTO EJECUTIVO

El plan v3 es **significativamente mejor** que v2. La decisión de "embedding solo al publicar" elimina la fuente principal de bugs de sincronización. La simplificación "todo resumen nuevo es block-based" elimina complejidad condicional. Sin embargo, hay **7 defectos que un agente ejecutando esto a ciegas va a romper**.

---

## DEFECTOS CRÍTICOS (bloquean ejecución correcta)

### C1. Inconsistencia de type names: `callout` vs `callout_edu`

**El problema:** El plan usa `callout_edu` en la tabla de types (sección Anexo A, línea 1430), en `block-flatten.ts` (línea 886), y en la interfaz TypeScript de frontend (línea 1030). Pero el prototipo (`Prototipo_Resumenes_Axon_FINAL.jsx`) y el `block-schema.json` usan `callout` (sin sufijo `_edu`). Los `INITIAL_BLOCKS` del prototipo usan `type: "callout"`. El schema JSON también define `callout`.

**Impacto:** Un agente que sigue el plan crea renderers para `callout_edu`, pero los datos en BD tienen `type: "callout"`. El switch de `ViewerBlock.tsx` nunca matchea. Los bloques callout aparecen en blanco.

**Fix:** Unificar en `callout` en todos lados. En `block-flatten.ts`, el case debe ser `"callout"` (no `"callout_edu"`). En la interfaz TypeScript, el union type debe incluir `'callout'`, no `'callout_edu'`. En el Anexo A, la tabla debe decir `callout`. El sufijo `_edu` fue una buena intención para diferenciar del legacy `callout` de CMS, pero el schema ya ganó esa batalla.

**Severidad:** CRÍTICA — rendering completamente roto para callouts si no se arregla.

---

### C2. `block-flatten.ts` tiene un bug silencioso: `flattenBlock` no procesa keywords en list_detail/grid

**El problema:** La función `flattenBlock` para los tipos `list_detail` y `grid` extrae `item.detail` directo (líneas 864-875). Pero esos campos pueden contener `{{keyword_id}}` markers (el prototipo renderiza keywords en ListDetailBlock). La función `stripKeywordMarkers` solo se aplica a `prose`, `key_point`, `stages`, y `callout_edu`.

**Impacto:** Si un list_detail tiene `"Daño del {{endotelio}} por estrés"`, el content_markdown resultante tendrá `"Daño del {{endotelio}} por estrés"` literal. Esto contamina los chunks y embeddings con marcadores de template. El RAG devuelve texto con `{{}}` al usuario.

**Fix:** Aplicar `stripKeywordMarkers()` a TODOS los campos de texto en TODOS los block types. La función debería ser el paso final de cada case, no selectivo.

---

### C3. `publishSummary` hace embedding secuencial — N+1 API calls sin rate limiting

**El problema:** En `publish-summary.ts` (línea 966-975), el loop `for (const block of blocks)` llama a `generateEmbedding()` uno por uno, secuencialmente. Para un resumen con 12 bloques, son 12 llamadas a OpenAI. Si se publican 5 resúmenes en batch, son 60 llamadas secuenciales.

**Impacto:** Tiempo de respuesta del endpoint `POST /publish` será ~15-30 segundos (12 bloques × 1-2s por embedding). El frontend va a timeoutear (el default de `apiCall` probablemente es 30s). No hay retry si falla a la mitad — estado parcialmente publicado.

**Fix:** Tres cambios:
1. Usar `Promise.allSettled()` con concurrency limit (p.ej., `p-limit(5)`) para paralelizar embeddings
2. Hacer el publish async: retornar `202 Accepted` inmediato, procesar embeddings en background, notificar completitud via SSE o polling
3. Wrappear en transacción: si falla embedding de un bloque, no dejar status en limbo. Marcar `status = 'published'` ANTES de embeddings (embeddings son enhancement, no blocker)

---

### C4. La migración SQL no maneja el CHECK constraint de `summaries.status` correctamente

**El problema:** La sección 2.3 (línea 249-258) dice "Actualizar CHECK constraint de status" con un comentario `-- NOTA: verificar si ya hay un CHECK constraint antes de agregar`. Pero NO da el SQL para hacerlo. Un agente ejecutando esto no tiene instrucciones claras.

**Impacto:** Si ya existe un CHECK constraint (y lo hay — el memory dice que `summaries.status` tiene constraint), intentar agregar otro falla silenciosamente o levanta error. O peor: el agente ignora esta parte y no agrega `'raw'` y `'review'` como valores válidos. Entonces `INSERT summary SET status='review'` falla en producción.

**Fix:** Agregar el SQL explícito:
```sql
-- Drop existing CHECK if any (safe: solo si hay constraint)
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'summaries'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE summaries DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE summaries ADD CONSTRAINT summaries_status_check
  CHECK (status IN ('draft', 'raw', 'review', 'published', 'archived'));
```

---

### C5. Frontend `SummaryBlock.type` tiene union type inflado con legacy types que confunden al agente

**El problema:** La interfaz en sección 6.1 (línea 1024-1031) mantiene AMBOS sets de types:
```typescript
type: 'text' | 'heading' | 'image' | 'video' | 'pdf' | 'callout' | 'divider' | 'keyword-ref'
   | 'prose' | 'key_point' | 'stages' | ...
```

El plan dice "Los 11 summaries legacy se ignoran" y "Todo resumen nuevo es block-based". Pero el type union incluye los legacy types.

**Impacto:** Un agente creando `ViewerBlock.tsx` va a crear cases para TODOS los types (8 legacy + 10 nuevos = 18 cases). Duplica trabajo y confunde la arquitectura. El `callout` legacy y el `callout` nuevo tienen schemas diferentes pero el mismo type name.

**Fix:** Separar los types con un comment claro y NO crear renderers para legacy types. Mejor aún, usar un type discriminated union:
```typescript
type BlockType = 'prose' | 'key_point' | 'stages' | 'comparison' | 'list_detail'
  | 'grid' | 'two_column' | 'callout' | 'image_reference' | 'section_divider';
type LegacyBlockType = 'text' | 'heading' | 'image' | 'video' | 'pdf' | 'divider' | 'keyword-ref';
type SummaryBlockType = BlockType | LegacyBlockType;
```
Y en `ViewerBlock.tsx`, el switch solo tiene cases para `BlockType`. Legacy blocks get un fallback genérico que muestra texto plano.

---

### C6. `afterWrite` hook en CRUD factory no existe como pattern — el plan asume una API que puede no existir

**El problema:** La sección 5.1 (línea 703) agrega `afterWrite: onBlockWrite` a la CRUD factory config. Pero el plan dice "CRUD factory para summary-blocks ya existe" y muestra el actual config que NO tiene `afterWrite`. El plan asume que `registerCrud` acepta un campo `afterWrite`.

**Impacto:** Si `crud-factory.ts` no soporta `afterWrite` callbacks, el hook nunca se ejecuta. El agente escribe el hook, lo importa, pero nunca se llama. Todo parece funcionar pero los summaries nunca se marcan como dirty después de editar bloques.

**Fix:** ANTES de la Fase 4, verificar que `crud-factory.ts` soporta `afterWrite`. Si no:
1. Leer el código actual de `crud-factory.ts` (el plan dice "NO tocar: crud-factory.ts" en la validación de Fase 4, línea 1495 — CONTRADICCIÓN)
2. Opción A: Agregar soporte `afterWrite` al factory (requiere tocar crud-factory.ts)
3. Opción B: Implementar el hook como middleware de Hono en la ruta, no en el factory

**Nota:** La línea 1495 dice "NO tocar: crud-factory.ts" pero la sección 5.1 REQUIERE modificar la config que el factory lee. Esto es confuso para un agente. Clarificar: se modifica la CONFIG de `registerCrud` en `crud.ts`, pero NO el factory engine en `crud-factory.ts`. Sin embargo, si el factory no soporta `afterWrite`, SÍ hay que tocarlo.

---

### C7. Race condition en `markSummaryDirty`: debounce usa Map en memoria, no persiste

**El problema:** `block-hook.ts` (líneas 733-749) usa un `Map<string, number>()` en memoria para debounce. Supabase Edge Functions son serverless — cada invocación puede ser en un cold start diferente. El Map se resetea en cada cold start.

**Impacto:** El debounce de 5 segundos no funciona en producción. Cada request a una Edge Function puede ser una instancia nueva. El Map siempre está vacío al arrancar. La "protección" contra dirty-flags múltiples es ilusoria.

**Fix:** Tres opciones:
1. **Eliminar el debounce** — el dirty-flag es idempotente (re-setear `status='review'` cuando ya es `review` es no-op). No hay costo real de repetir.
2. **Usar un timestamp en BD** — agregar `dirty_since timestamptz` al summary y hacer un conditional update: `UPDATE summaries SET dirty_since = now() WHERE id = $id AND (dirty_since IS NULL OR dirty_since < now() - interval '5 seconds')`. Atomico y persiste.
3. **Aceptar que no hay debounce en serverless** — documentar que cada block edit hace una query de check (es un SELECT + condicional UPDATE, no es costoso).

**Recomendación:** Opción 1. El debounce es innecesario. El overhead de un SELECT + no-op UPDATE es despreciable vs. la complejidad del debounce.

---

## WARNINGS (no bloquean pero causan problemas)

### W1. Plan contradice memoria: "motion v12 instalado" pero la memoria dice "no dnd-kit"

La sección 9.1 dice "⚠️ `motion` v12 instalado, no dnd-kit" y el Anexo C dice "Drag: usar motion v12 drag". Pero `motion` (ex framer-motion) NO tiene un API de drag-and-drop comparable a @dnd-kit para listas reordenables. `motion`'s `Reorder` component es básico y no soporta drag handles, virtualization, ni multi-container. El prototipo usa HTML5 drag events (onDragStart/onDragOver/onDrop).

**Recomendación:** Investigar si `motion` v12 `Reorder` es suficiente. Si no, el agente de Fase 5 necesitará instalar @dnd-kit. Documentar la decisión.

### W2. `summary-hook.ts` guard para "summaries con bloques" no está definido

La sección 5.5 dice "el hook se desactiva para summaries con bloques" pero no explica CÓMO. No hay campo en `summaries` que diga "este summary es block-based". El plan asume "todo resumen nuevo", pero ¿cómo sabe el hook si un summary es nuevo vs legacy?

**Recomendación:** Usar `status`: si `status IN ('raw', 'review')`, skip el hook (es block-based, publicará manualmente). Si `status = 'draft'` (legacy), dejar el hook activo. O mejor: check if `SELECT count(*) FROM summary_blocks WHERE summary_id = $id` > 0.

### W3. `generate-summary-blocks.ts` llama a Claude opus — costo no documentado

Un solo resumen genera ~12 bloques + ~8 keywords + ~10 quiz questions. Una sola llamada a Claude opus con un prompt largo (workflow + schema + PDF content + ejemplos) puede costar $0.50-$2.00 por resumen. En batch de 20 resúmenes, eso es $10-$40.

**Recomendación:** Agregar confirmation step en la UI ("Esto generará bloques IA. Costo estimado: ~$X"). O usar Gemini 2.5 Flash para generación (más barato) y Claude solo para revisión/mejora.

### W4. No hay rollback path si `publish` falla a mitad

Si `autoChunkAndEmbed` falla después de actualizar `content_markdown` pero antes de cambiar `status`, el summary queda con content_markdown actualizado pero status='review'. Re-intentar publish va a re-flatten (idempotente) y re-embed (costoso). No hay forma de "resume where it left off".

**Recomendación:** Agregar `published_at` timestamp. Al retry, skip blocks que ya tienen embedding con `updated_at > published_at`.

### W5. `position_x/y/width/height` son YAGNI puro

El plan dice: "future-proofing para layout canvas libre. No los usamos todavía." Cada columna agrega bytes a cada fila, aparece en APIs, confunde agentes que ven campos no usados.

**Recomendación:** NO agregar. Cuando (si) se necesiten, una migración es trivial (tabla vacía). YAGNI > future-proofing en sistema joven.

### W6. `rag_block_search` y `rag_hybrid_search_v2` duplican lógica de búsqueda

La sección 4.2 crea `rag_block_search` como RPC standalone. La sección 2.3 menciona `rag_hybrid_search_v2` que busca en ambas tablas. Pero solo `rag_block_search` tiene SQL concreto. `rag_hybrid_search_v2` es solo un diagrama. Un agente no sabe cuál implementar.

**Recomendación:** Solo implementar `rag_block_search` como complemento al `rag_hybrid_search` existente. El llamante (chat.ts o retrieval-strategies.ts) puede llamar ambas funciones y merge results. No crear una v2 del hybrid search — es más riesgo que valor.

### W7. Prototipo usa `imageData` (base64 inline) pero producción debe usar URLs

El prototipo almacena imágenes como base64 en `block.imageData`. El plan de producción (sección 7.4) usa `image_url` en Supabase Storage. El agente de Fase 2 que convierte el prototipo a componentes de producción necesita saber que `imageData` no existe en producción — es `content.image_url`.

**Recomendación:** Agregar nota explícita en el Anexo C de Fase 2: "En producción, imágenes vienen de `block.content.image_url` (URL de Supabase Storage), NO de `block.imageData` (base64 del prototipo). Los renderers deben usar `<img src={block.content.image_url}>`, no leer imageData."

### W8. El plan no menciona RLS para `summary_blocks` en la migración

La sección 3.1 dice "summary_blocks hereda permisos de summaries via FK + policies existentes." Pero RLS en PostgreSQL NO hereda automáticamente. Cada tabla necesita sus propias policies.

**Recomendación:** Verificar si hay RLS policies en `summary_blocks`. Si no (tabla nueva con 0 rows, probablemente no), agregar policies que repliquen las de `summaries`:
```sql
ALTER TABLE summary_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks_same_as_summary" ON summary_blocks
  USING (summary_id IN (SELECT id FROM summaries WHERE /* existing summary RLS */));
```

### W9. Fase 5 depende de Fase 2 merge, pero no hay timeout

El plan dice "PREREQUISITO: Mergear feat/block-based-summaries antes". Si la PR de Fase 2 queda en review 3 días, Fase 5 se bloquea. No hay plan B.

**Recomendación:** Fase 5 puede basarse en la branch de Fase 2 directamente (`git checkout -b feat/block-editor-professor feat/block-based-summaries`), haciendo rebase después del merge. Documentar esto.

---

## MEJORAS ESTRATÉGICAS (no urgentes pero high-value)

### M1. Agregar `block_hash` para optimistic updates y sync detection

Calcular un hash del content JSONB (`md5(content::text)`) permite detectar si un bloque cambió sin comparar el JSONB entero. Útil para: auto-save inteligente (no save si no cambió), sync health check rápido, conflict detection si dos editores abren el mismo resumen.

### M2. El endpoint `/publish` debería retornar el `chunks_count` real

El plan tiene un TODO inline: `chunks_count: /* from autoChunkAndEmbed */ -1`. El agente va a dejar ese -1 literal. `autoChunkAndEmbed` debería retornar el count, o se hace un `SELECT count(*) FROM chunks WHERE summary_id = $id` después.

### M3. Considerar soft-delete para bloques (ya existe `is_active`)

El plan usa `DELETE /summary-blocks/:id` como hard delete. Pero la tabla tiene `is_active`. Usar soft-delete (set `is_active = false`) permite undo, auditoría, y no rompe FKs si quiz_questions referencian un `block_id`. El CRUD factory ya soporta esto.

### M4. El plan no contempla versionamiento de resúmenes

Cuando un profesor publica, edita, y re-publica, no hay forma de volver a la versión anterior. En un sistema educativo donde los alumnos ya estudiaron con la versión 1, esto es relevante. Considerar: snapshot de `content_markdown` al publicar, o tabla `summary_versions`.

---

## CHECKLIST PRE-EJECUCIÓN

Antes de darle el plan a un agente, corregir:

- [ ] **C1** — Reemplazar `callout_edu` por `callout` en todo el plan (flatten, types, anexo)
- [ ] **C2** — Aplicar `stripKeywordMarkers` en TODOS los block types de flatten
- [ ] **C3** — Cambiar publish a async o al menos parallelizar embeddings
- [ ] **C4** — Agregar SQL explícito para el CHECK constraint de status
- [ ] **C5** — Separar legacy types de nuevos types en la interfaz TypeScript
- [ ] **C6** — Verificar si crud-factory soporta `afterWrite` y resolver la contradicción
- [ ] **C7** — Eliminar el debounce con Map (o hacerlo en BD)
- [ ] **W7** — Agregar nota sobre `imageData` vs `image_url` en Fase 2
- [ ] **W8** — Agregar RLS policies para summary_blocks
- [ ] **M2** — Resolver el TODO de `chunks_count: -1`

---

## RESUMEN DE CALIDAD POR SECCIÓN

| Sección | Calidad | Notas |
|---------|---------|-------|
| 1. Diagnóstico | 9/10 | Excelente análisis del estado actual |
| 2. Pipeline v3 | 8/10 | Arquitectura sólida, buen cambio de v2→v3 |
| 3. Modelo Híbrido A+B | 8/10 | Diagrama claro. Warning: sección 2.2 vs 3.1 usan numeración duplicada |
| 4. Migración SQL | 7/10 | Falta CHECK constraint SQL (C4), sobra YAGNI (W5) |
| 5. Backend | 6/10 | Bugs en flatten (C2), debounce roto (C7), afterWrite asumido (C6) |
| 6. Frontend Student | 7/10 | Type union inflado (C5), falta nota imageData (W7) |
| 7. Frontend Professor | 8/10 | Bien estructurado, sub-componentes claros |
| 8. Plan de Ejecución | 9/10 | Fases bien secuenciadas, validaciones correctas |
| 9. Riesgos | 7/10 | Falta RLS (W8), falta costo IA (W3) |
| 10. Anexos | 7/10 | callout_edu inconsistente (C1) |

**Score global: 7.5/10 — Ejecutable con las correcciones de los 7 defectos críticos.**

---

## ACCIÓN RECOMENDADA

1. Corregir los 7 defectos críticos en el plan ANTES de dárselo a un agente
2. Agregar las notas de los warnings más importantes (W7, W8)
3. Hacer un v3.1 del plan con las correcciones
4. Recién entonces copiar los Anexos C como instrucciones para Claude Code CLI
