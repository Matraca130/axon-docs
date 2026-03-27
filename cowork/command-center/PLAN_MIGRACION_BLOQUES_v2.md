# Plan de Migración: Sistema de Bloques Educativos para Axon

> **Versión:** 3.0 — 2026-03-23
> **Autor:** Claude (Cowork) + Petrick
> **Estado:** Planificación
> **Modelo:** Resumen primero, embedding después — la IA genera bloques curados ANTES de embeddear
> **Cambio clave v2→v3:** Embedding se mueve de "cada edit" a "solo al publicar". Se agrega status flow y pipeline de generación IA.
> **Branches:** `feat/block-based-summaries` (frontend) + `feat/block-editor-professor` (frontend) + `feat/block-embeddings` (backend)

---

## 1. Situación Actual (Diagnóstico)

### 1.1 Base de Datos — `summary_blocks`

La tabla existe pero tiene **0 filas** y un schema básico:

```
summary_blocks (ACTUAL):
  id              UUID PK DEFAULT gen_random_uuid()
  summary_id      UUID FK → summaries.id ON DELETE CASCADE
  type            TEXT NOT NULL DEFAULT 'paragraph'
  content         TEXT NOT NULL DEFAULT ''        ← PROBLEMA: es TEXT, no JSONB
  heading_text    TEXT NULL
  heading_level   SMALLINT NULL
  order_index     INTEGER NOT NULL DEFAULT 0
  is_active       BOOLEAN NOT NULL DEFAULT true
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  -- FALTAN: updated_at, position_x/y, width, height, style, metadata, embedding
```

### 1.2 Backend — CRUD Factory para `summary-blocks`

```typescript
// crud.ts línea 123
registerCrud(contentCrudRoutes, {
  table: "summary_blocks",
  slug: "summary-blocks",
  parentKey: "summary_id",
  hasCreatedBy: false,       // ← PROBLEMA: no trackea quién creó
  hasUpdatedAt: false,       // ← PROBLEMA: no trackea cuándo se editó
  hasOrderIndex: true,
  hasIsActive: true,
  requiredFields: ["type", "content"],
  createFields: ["type", "content", "order_index", "heading_text", "heading_level", "is_active"],
  updateFields: ["type", "content", "order_index", "heading_text", "heading_level", "is_active"],
  // ← FALTA: afterWrite hook para sync content_markdown + embeddings
});
```

**Endpoints generados automáticamente (ya funcionan):**
```
POST   /summary-blocks              → crear bloque
GET    /summary-blocks?summary_id=X → listar bloques
GET    /summary-blocks/:id          → obtener bloque
PUT    /summary-blocks/:id          → actualizar bloque
DELETE /summary-blocks/:id          → eliminar bloque (hard delete)
PUT    /reorder                     → reordenar (ya soporta summary_blocks)
```

### 1.3 Backend — Hook de Summaries (`summary-hook.ts`)

```
onSummaryWrite() → si content_markdown cambió → autoChunkAndEmbed()
  autoChunkAndEmbed():
    1. Fetch content_markdown
    2. Split en chunks (recursive o semantic chunker)
    3. DELETE chunks viejos → INSERT nuevos
    4. generateEmbeddings() para cada chunk (OpenAI text-embedding-3-large 1536d)
    5. embedSummaryContent() — embedding a nivel de summary
```

**Importante:** Este hook se dispara en POST/PUT de summaries. NO tiene equivalente para `summary_blocks`. Cuando el profesor edite un bloque via PUT /summary-blocks/:id, **nada se re-sincroniza automáticamente**.

### 1.4 Frontend — `SummaryBlock` Interface

```typescript
// summariesApi.ts línea 90
export interface SummaryBlock {
  id: string;
  summary_id: string;
  type: 'text' | 'heading' | 'image' | 'video' | 'pdf' | 'callout' | 'divider' | 'keyword-ref';
  content: Record<string, any>;  // ← espera JSONB, BD tiene TEXT
  position_x: number;            // ← NO existe en BD
  position_y: number;            // ← NO existe en BD
  width: number;                 // ← NO existe en BD
  height: number;                // ← NO existe en BD
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;            // ← NO existe en BD
}
```

**API functions existentes:** Solo `getSummaryBlocks()` (read). No existe create, update, delete en el frontend.

### 1.5 Frontend — Flujo del StudentSummaryReader

```
StudentSummaryReader
  ├── useSummaryReaderQueries(summaryId) — 4 queries paralelas
  │     ├── getChunks()        → chunks[] (para fallback + RAG)
  │     ├── getKeywords()      → keywords[] (filtrado is_active)
  │     ├── getAnnotations()   → annotations[] (del alumno)
  │     └── getSummaryBlocks() → hasBlocks (boolean via select)
  │
  ├── Header Card (título, fecha, reading time, mark read → XP +15)
  ├── Paginated content_markdown (con KeywordHighlighterInline)
  │
  └── Tabs
        ├── "Contenido" → ReaderChunksTab
        │     ├── SI hasBlocks → SummaryViewer → ViewerBlock (por bloque)  ← PUNTO DE INTEGRACIÓN
        │     └── SI NO → chunks con KeywordHighlighterInline (fallback)
        ├── "Keywords" → ReaderKeywordsTab → InlineKeywordPopover → KeywordPopup
        │     ├── KeywordDefinitionSection (definición + notas)
        │     ├── KeywordConnectionsSection (mapa + crear conexiones)
        │     └── KeywordActionsSection (AI explain, flashcard/quiz counts)
        ├── "Videos" → VideoPlayer (Mux)
        └── "Mis Notas" → ReaderAnnotationsTab
```

### 1.6 Frontend — Flujo del Profesor (SummaryDetailView)

```
SummaryDetailView (profesor)
  ├── hasBlocks detection (query compartido con SummaryViewer)
  │     └── Si hay bloques → muestra badge "Vista enriquecida"
  ├── TipTapEditor (monolítico)
  │     ├── WYSIWYG: guarda todo como HTML en content_markdown
  │     ├── Auto-save cada 30s + Ctrl+S
  │     ├── ImageUploadDialog → Supabase Storage bucket "axon-images"
  │     ├── KeywordHighlightPlugin (decoración ProseMirror)
  │     └── handleSave → PUT /summaries/:id { content_markdown: html }
  │                        ↓
  │                    onSummaryWrite() → autoChunkAndEmbed()
  │
  ├── KeywordClickPopover (crear keyword desde selección de texto)
  ├── Keyword list (CRUD con conexiones, notas, subtemas)
  └── Videos panel
```

**Problema central:** El profesor hoy edita un documento HTML monolítico. No tiene concepto de bloques editables individualmente.

---

## 2. Pipeline: Resumen Primero, Embedding Después (NUEVO v3)

### 2.0 Cambio Arquitectural v2 → v3

**v2 decía:** Cada edición de bloque → onBlockWrite → re-genera content_markdown → autoChunkAndEmbed → embedding inmediato.
**v3 dice:** La IA genera bloques curados → profesor revisa → al PUBLICAR → flatten + embed una sola vez.

**Por qué el cambio:** Embeddear texto crudo del PDF introduce ruido (headers, footers, formato roto). Embeddear el contenido curado de los bloques da RAG limpio y pedagógico.

### 2.1 Status Flow del Summary

```
┌──────┐     ┌────────┐     ┌───────────┐
│ raw  │────▶│ review │────▶│ published │
└──────┘     └────────┘     └───────────┘
   │              │               │
   │              │               └─ Estudiantes ven el resumen
   │              │                  RAG tiene embeddings curados
   │              │                  content_markdown = derivado de bloques
   │              │
   │              └─ Profesor revisa/edita bloques en modo Editor
   │                 NO hay embedding todavía
   │                 Puede regenerar bloques con IA
   │
   └─ PDF subido, Gemini extrajo texto
      content_markdown_raw = texto crudo del PDF
      summary_blocks = vacío (aún)
```

**Transiciones:**
- `raw → review`: `POST /ai/generate-summary-blocks` (o inserción manual via Cowork MCP)
- `review → published`: `POST /content/summaries/:id/publish` (flatten + embed + status update)

### 2.2 Dos Caminos de Generación

#### Camino A: Cowork (manual, tú + Claude)

```
Petrick da el PDF aquí en Cowork
    ↓
Claude lee el PDF, sigue WORKFLOW_RESUMENES_AXON.md
    ↓
Claude genera JSON (cumple block-schema.json)
    ↓
Claude inserta via MCP Supabase:
  1. INSERT summary (status='review', content_markdown_raw=texto extraído)
  2. INSERT summary_blocks (N bloques con type + content JSONB)
  3. INSERT keywords (con related[] y priority)
  4. INSERT quiz_questions (con block_id FK)
    ↓
Petrick revisa en el frontend (modo Editor)
    ↓
Petrick publica → flatten + embed
```

**Cuándo usar:** Prototyping, primeros resúmenes, temas complejos que necesitan supervisión humana.

#### Camino B: Endpoint automatizado (producción)

```
Profesor sube PDF en Axon → POST /ai/ingest-pdf
    ↓
Gemini extrae texto → content_markdown_raw (summary.status = 'raw')
    ↓
Profesor clickea "Generar con IA" → POST /ai/generate-summary-blocks
    ↓
Backend:
  1. Lee content_markdown_raw del summary
  2. Llama a Claude con system prompt = WORKFLOW + block-schema.json
  3. Valida JSON contra schema
  4. INSERT summary_blocks + keywords + quiz_questions
  5. summary.status = 'review'
    ↓
Profesor revisa en modo Editor (puede editar, reordenar, regenerar bloques individuales)
    ↓
Profesor clickea "Publicar" → POST /content/summaries/:id/publish
    ↓
Backend:
  1. flattenBlocksToMarkdown() → content_markdown (curado)
  2. autoChunkAndEmbed() sobre content_markdown curado
  3. Embed individual por bloque (Opción B)
  4. summary.status = 'published'
```

**Cuándo usar:** Flujo normal de producción, batch de varios temas.

#### Camino B — Batch (varios temas a la vez)

```
Profesor selecciona materia → marca temas → clickea "Generar todos"
    ↓
Backend procesa en paralelo (SSE para progress):
  - Tema 1: generate-summary-blocks → status='review'
  - Tema 2: generate-summary-blocks → status='review'
  - Tema N: ...
    ↓
Profesor revisa cola de resúmenes en status 'review'
Publica los aprobados uno a uno (o batch publish)
```

### 2.3 Cambios en Tablas para el Status Flow

```sql
-- summaries: agregar status y content_markdown_raw
ALTER TABLE summaries
  ADD COLUMN IF NOT EXISTS content_markdown_raw text,         -- texto crudo del PDF (referencia)
  ADD COLUMN IF NOT EXISTS generation_config    jsonb DEFAULT '{}'; -- modelo IA, parámetros

-- Actualizar CHECK constraint de status (si existe) o crear uno
-- Los valores válidos: 'draft', 'raw', 'review', 'published', 'archived'
-- NOTA: verificar si ya hay un CHECK constraint antes de agregar
```

### 2.4 Cambio en Hooks: Embedding Solo al Publicar

**ANTES (v2):**
```
onBlockWrite() → cada edit:
  1. Embed bloque individual
  2. Re-generar content_markdown
  3. Trigger onSummaryWrite → autoChunkAndEmbed (chunks)
```

**DESPUÉS (v3):**
```
onBlockWrite() → cada edit:
  1. NO embed (ahorra API calls durante edición)
  2. NO re-generar content_markdown (es review, no publicado)
  3. Solo dirty-flag: summary.needs_publish = true (opcional)

onPublish() → solo al publicar:
  1. flattenBlocksToMarkdown → content_markdown (curado, sin ruido)
  2. autoChunkAndEmbed() sobre content_markdown curado
  3. Embed individual por bloque (Opción B)
  4. summary.status = 'published'
```

**Beneficios:**
- 0 API calls a OpenAI durante edición (ahorro de costos)
- No hay embeddings parciales/inconsistentes durante review
- El RAG siempre tiene contenido curado y completo
- content_markdown nunca tiene texto crudo del PDF

### 2.5 Endpoint Nuevo: POST /ai/generate-summary-blocks

```typescript
// routes/ai/generate-summary-blocks.ts (NUEVO)
//
// Input: { summary_id: string, options?: { model?: string, block_count?: number } }
// Process:
//   1. Fetch summary.content_markdown_raw (texto del PDF)
//   2. Build prompt: WORKFLOW + block-schema.json + ejemplos
//   3. Call Claude (opus) → JSON de bloques
//   4. Validate JSON against block-schema.json
//   5. INSERT summary_blocks, keywords, quiz_questions
//   6. UPDATE summary SET status = 'review'
// Output: { blocks_count: number, keywords_count: number, quiz_count: number }
//
// System prompt includes:
//   - WORKFLOW_RESUMENES_AXON.md (reglas pedagógicas)
//   - block-schema.json (schema estricto)
//   - 1-2 ejemplos de JSON completo (ej: diabetes, aterosclerosis)
```

### 2.6 Endpoint Nuevo: POST /content/summaries/:id/publish

```typescript
// routes/content/publish-summary.ts (NUEVO)
//
// Input: { summary_id: string } (via URL param)
// Auth: Solo profesor/admin de la institución
// Process:
//   1. Verify summary.status = 'review' (no publicar 'raw')
//   2. Verify summary tiene bloques (count > 0)
//   3. flattenBlocksToMarkdown(summary_id) → texto curado
//   4. UPDATE summary SET content_markdown = texto_curado
//   5. autoChunkAndEmbed(summary_id) → chunks + embeddings de texto curado
//   6. Para cada bloque: generateEmbedding(bloque) → UPDATE embedding
//   7. UPDATE summary SET status = 'published'
// Output: { status: 'published', chunks_count: number, blocks_embedded: number }
```

---

## 3. Arquitectura del Modelo Híbrido A+B (actualizada v3)

### 3.1 Las Tres Capas de Datos

```
┌─────────────────────────────────────────────────────────────┐
│ CAPA 1 — summary_blocks (FUENTE DE VERDAD)                  │
│                                                              │
│ Cada bloque tiene:                                           │
│   - content JSONB (datos estructurados del bloque)           │
│   - embedding vector(1536) (embedding propio — Opción B)     │
│   - type, order_index, metadata                              │
│                                                              │
│ El profesor edita aquí directamente.                          │
│ El alumno lee desde aquí (rendering rico).                   │
└──────────────────────┬───────────────────────────────────────┘
                       │ afterWrite hook (automático)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ CAPA 2 — summaries.content_markdown (DERIVADO — Opción A)    │
│                                                              │
│ Texto plano concatenado de todos los bloques.                │
│ Se re-genera cada vez que un bloque cambia.                  │
│ Alimenta: vista paginada del header, búsqueda FTS.           │
└──────────────────────┬───────────────────────────────────────┘
                       │ onSummaryWrite hook (existente)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ CAPA 3 — chunks (DERIVADO — pipeline existente)              │
│                                                              │
│ Fragmentos de ~300-400 chars con embeddings + FTS.           │
│ Se re-generan cuando content_markdown cambia.                │
│ Alimentan: rag_hybrid_search, rag_coarse_to_fine_search,     │
│            RAG chat, smart generation, embedding coverage.    │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Flujo Completo Cuando el Profesor Edita un Bloque

```
Profesor edita bloque #3 (stages) en el Block Editor
    ↓
PUT /summary-blocks/:id { content: {...nuevo json...} }
    ↓
CRUD factory actualiza la fila en BD
    ↓
afterWrite hook NUEVO: onBlockWrite()
    ├── 1. Generar embedding del bloque editado (Opción B)
    │      generateEmbedding(texto plano del bloque)
    │      UPDATE summary_blocks SET embedding = $vec WHERE id = $block_id
    │
    ├── 2. Re-generar content_markdown (Opción A)
    │      SELECT * FROM summary_blocks WHERE summary_id = $sid ORDER BY order_index
    │      Concatenar texto plano → UPDATE summaries SET content_markdown = $text
    │
    └── 3. Trigger cascada existente
           onSummaryWrite() detecta content_markdown cambió
           → autoChunkAndEmbed() → re-chunk + re-embed chunks
```

### 2.3 RAG Híbrido — Búsqueda en Dos Niveles

```sql
-- NUEVO: rag_hybrid_search_v2()
-- Busca en AMBAS tablas: chunks (granular) + summary_blocks (contexto rico)

-- Nivel 1: búsqueda en chunks (existente, no cambia)
SELECT content, embedding <=> $query_vec AS distance
FROM chunks WHERE summary_id IN (...) AND embedding IS NOT NULL

UNION ALL

-- Nivel 2: búsqueda en summary_blocks (NUEVO)
SELECT content::text, embedding <=> $query_vec AS distance
FROM summary_blocks WHERE summary_id IN (...) AND embedding IS NOT NULL

ORDER BY distance LIMIT $k;
```

Esto da lo mejor de ambos mundos: chunks pequeños para precisión + bloques completos para contexto rico.

---

## 3. Análisis de Impacto Transversal

### 3.1 Sistemas que NO requieren cambios

| Sistema | Razón |
|---------|-------|
| **KeywordHighlighterInline** | Regex sobre DOM via TreeWalker. Busca `keyword.name` en texto visible. Independiente de la fuente del HTML. |
| **InlineKeywordPopover** | Click en `.axon-kw-highlight` → @floating-ui popup. Independiente. |
| **KeywordPopup** | Opera por `keyword_id`: definición, subtemas, conexiones, AI explain. |
| **KeywordActionsSection** | `POST /ai/explain` por concepto. Flashcard/quiz counts por keyword. |
| **Reading state + XP** | `useSummaryReaderMutations` opera por `summary_id`. Mark read, time tracking. |
| **Videos tab** | Vinculados a `summary_id` via `useVideoListQuery`. |
| **Annotations tab** | `TextAnnotation` CRUD por `summary_id`. |
| **useSummaryReaderQueries** | Ya fetcha blocks (query 4). Sin cambios. |
| **useSummaryBlocksQuery** | Fetcha full `SummaryBlock[]`. Sin cambios. |
| **Quiz/Flashcard generation** | `POST /ai/generate` ya acepta `block_id` como parámetro opcional. |
| **RAG chat (existing)** | `rag_hybrid_search` busca en chunks. Sigue funcionando con Opción A. |
| **Embedding coverage** | `rag_embedding_coverage()` opera sobre chunks. |
| **`hasBlocks` switch** | `ReaderChunksTab.tsx` líneas 69-70: si hay blocks → SummaryViewer. Ya existe. |
| **Professor `hasBlocks` badge** | `SummaryDetailView.tsx` línea 268: muestra "Vista enriquecida". Ya existe. |
| **Reorder endpoint** | `PUT /reorder` ya soporta `summary_blocks` en su allowlist. |
| **RLS policies** | `summary_blocks` hereda permisos de `summaries` via FK + policies existentes. |

### 3.2 Sistemas que SÍ requieren cambios

| Cambio | Archivo(s) | Complejidad | Branch |
|--------|-----------|-------------|--------|
| **Migración BD** — content→JSONB, +columnas, +embedding vector | SQL via Supabase MCP | Baja | — (Cowork) |
| **CRUD factory** — actualizar createFields/updateFields, agregar afterWrite | `crud.ts` | Baja | backend |
| **Block write hook** — onBlockWrite() sync→markdown+embed | **NUEVO** `block-hook.ts` | Media | backend |
| **Flatten function** — blocks→texto plano para content_markdown | **NUEVO** `block-flatten.ts` | Baja | backend |
| **Block embedding function** — extraer texto del bloque→embedding | **NUEVO** en `block-hook.ts` | Baja | backend |
| **RPC rag_hybrid_search_v2** — buscar en chunks + blocks | **NUEVA** SQL function | Media | backend |
| **SummaryBlock type** — ampliar union type | `summariesApi.ts` | Baja | frontend |
| **CRUD functions frontend** — create, update, delete blocks | `summariesApi.ts` | Baja | frontend |
| **ViewerBlock.tsx** — 10 renderers educativos | `ViewerBlock.tsx` + `blocks/*.tsx` | Media | frontend |
| **SummaryViewer.tsx** — envolver en KeywordHighlighterInline | `SummaryViewer.tsx` | Baja | frontend |
| **Block Editor (profesor)** — editor de bloques visual | **NUEVO** `BlockEditor.tsx` + sub-componentes | Alta | frontend |
| **SummaryDetailView** — integrar BlockEditor cuando hasBlocks | `SummaryDetailView.tsx` | Media | frontend |
| **React Query mutations** — create/update/delete/reorder blocks | **NUEVO** `useBlockEditorMutations.ts` | Media | frontend |

### 3.3 Dependencias Entre Cambios

```
MIGRACIÓN SQL ──────────────────────────┐
  (content JSONB + embedding + columnas) │
                                         │
BACKEND CRUD UPDATE ◄───────────────────┘
  (createFields, updateFields, afterWrite)
      │
      ├── block-hook.ts (onBlockWrite)
      │     ├── block-flatten.ts (blocks → text plano)
      │     └── openai-embeddings.ts (generateEmbedding — ya existe)
      │
      └── rag_hybrid_search_v2 (SQL function)
             ├── usa chunks.embedding (ya existe)
             └── usa summary_blocks.embedding (NUEVO)

FRONTEND — STUDENT (Branch: feat/block-based-summaries)
  ├── summariesApi.ts (types + CRUD functions)
  ├── ViewerBlock.tsx (10 renderers nuevos)
  ├── blocks/*.tsx (componentes de cada tipo)
  └── SummaryViewer.tsx (wrap KeywordHighlighterInline)

FRONTEND — PROFESOR (Branch: feat/block-editor-professor)
  ├── BlockEditor.tsx (editor visual de bloques)
  │     ├── BlockToolbar.tsx (agregar bloque, cambiar tipo)
  │     ├── BlockDragHandle.tsx (reorder con dnd)
  │     ├── InlineBlockEditor.tsx (TipTap dentro de bloque prose)
  │     └── BlockSettingsPanel.tsx (config por tipo)
  ├── useBlockEditorMutations.ts (React Query mutations)
  └── SummaryDetailView.tsx (integrar BlockEditor)
```

### 3.4 Decisión: Keywords `{{keyword}}` — Cero cambios transversales

El `KeywordHighlighterInline` funciona por regex del DOM renderizado:
```
JSON: { content: "La aterosclerosis es una enfermedad..." }
  → Renderer pone el texto plano en el DOM
  → TreeWalker busca "Aterosclerosis" (del array de keywords del summary)
  → Envuelve en <span class="axon-kw-highlight"> con color Delta Mastery
  → Click → InlineKeywordPopover → KeywordPopup completo
```
No necesitamos la sintaxis `{{keyword}}` en runtime. Solo la usamos al generar el JSON (para saber qué keywords incluir en cada bloque).

---

## 4. Migración SQL

### 4.1 Migración de `summary_blocks`

```sql
-- ============================================================
-- Migración: summary_blocks para sistema de bloques educativos
-- Modelo híbrido A+B
-- Fecha: 2026-03-23
-- PRECONDICIÓN: La tabla tiene 0 filas (verificar antes de correr)
-- ============================================================

-- 1. Verificar que no hay datos (safety check)
DO $$
BEGIN
  IF (SELECT count(*) FROM summary_blocks) > 0 THEN
    RAISE EXCEPTION 'summary_blocks has data — review migration before running';
  END IF;
END $$;

-- 2. Cambiar content de TEXT a JSONB
ALTER TABLE summary_blocks
  ALTER COLUMN content SET DEFAULT '{}'::jsonb,
  ALTER COLUMN content TYPE jsonb USING content::jsonb;

-- 3. Agregar columnas para el frontend (layout + metadata)
-- NOTA: position_x/y/width/height son future-proofing para layout canvas libre.
-- En v1, el editor es lista vertical — estos campos quedan en sus defaults (0/100).
-- No los usamos todavía, pero tenerlos en schema evita otra migración después.
ALTER TABLE summary_blocks
  ADD COLUMN IF NOT EXISTS position_x    integer      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS position_y    integer      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS width         integer      DEFAULT 100,
  ADD COLUMN IF NOT EXISTS height        integer      DEFAULT 100,
  ADD COLUMN IF NOT EXISTS style         jsonb        DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata      jsonb        DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz  DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by    uuid         NULL;

-- 4. Agregar columna de embedding (Opción B)
-- vector(1536) — misma dimensión que chunks (OpenAI text-embedding-3-large)
ALTER TABLE summary_blocks
  ADD COLUMN IF NOT EXISTS embedding vector(1536) NULL;

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_sb_summary_order
  ON summary_blocks (summary_id, order_index);

CREATE INDEX IF NOT EXISTS idx_sb_embedding
  ON summary_blocks USING hnsw (embedding vector_cosine_ops);
  -- DECISIÓN: HNSW desde el inicio (no ivfflat).
  -- ivfflat requiere ≥50 filas para ser útil — con pocos bloques iniciales es inútil.
  -- HNSW funciona bien con cualquier cantidad de filas y no necesita re-indexar al crecer.

-- 6. Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_summary_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_summary_blocks_updated_at ON summary_blocks;
CREATE TRIGGER trg_summary_blocks_updated_at
  BEFORE UPDATE ON summary_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_summary_blocks_updated_at();
```

### 4.2 RPC: rag_block_search (Opción B)

```sql
-- Búsqueda semántica en summary_blocks
-- Complementa rag_hybrid_search (que busca en chunks)
CREATE OR REPLACE FUNCTION rag_block_search(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 5,
  filter_summary_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  block_id uuid,
  summary_id uuid,
  block_type text,
  content jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sb.id AS block_id,
    sb.summary_id,
    sb.type AS block_type,
    sb.content,
    1 - (sb.embedding <=> query_embedding) AS similarity
  FROM summary_blocks sb
  WHERE sb.embedding IS NOT NULL
    AND sb.is_active = true
    AND 1 - (sb.embedding <=> query_embedding) > match_threshold
    AND (filter_summary_ids IS NULL OR sb.summary_id = ANY(filter_summary_ids))
  ORDER BY sb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 4.3 SQL de Verificación Post-Migración

```sql
-- Verificar schema
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'summary_blocks' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar índices
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'summary_blocks';

-- Verificar trigger
SELECT trigger_name, event_manipulation
FROM information_schema.triggers WHERE event_object_table = 'summary_blocks';

-- Verificar RPC
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'rag_block_search';

-- Test insert
INSERT INTO summary_blocks (summary_id, type, content, order_index)
VALUES (
  (SELECT id FROM summaries WHERE title IS NOT NULL LIMIT 1),
  'key_point',
  '{"title":"Test","content":"Texto de prueba","importance":"critical"}'::jsonb,
  0
) RETURNING id, type, content, embedding IS NULL as needs_embedding;

-- Cleanup
-- DELETE FROM summary_blocks WHERE content->>'title' = 'Test';
```

### 4.4 RPC: check_block_sync_health (Diagnóstico de sincronización)

```sql
-- Detecta si hay bloques editados después de la última regeneración
-- de content_markdown. Útil para detectar fallos silenciosos del hook.
CREATE OR REPLACE FUNCTION check_block_sync_health(p_summary_id uuid)
RETURNS TABLE (in_sync boolean, stale_since timestamptz)
LANGUAGE sql STABLE
AS $$
  SELECT
    (max_block_updated <= summary_updated) AS in_sync,
    CASE
      WHEN max_block_updated > summary_updated THEN max_block_updated
      ELSE NULL
    END AS stale_since
  FROM (
    SELECT
      (SELECT COALESCE(MAX(updated_at), '1970-01-01') FROM summary_blocks
       WHERE summary_id = p_summary_id AND is_active = true) AS max_block_updated,
      (SELECT COALESCE(updated_at, '1970-01-01') FROM summaries
       WHERE id = p_summary_id) AS summary_updated
  ) sub;
$$;
```

---

## 5. Cambios en Backend

### 5.1 Actualizar CRUD Factory — `crud.ts`

**Archivo:** `supabase/functions/server/routes/content/crud.ts` línea 123

```typescript
// 7. Summary Blocks — Summary -> Block (Smart Reader)
// v2: Modelo híbrido A+B — bloques educativos con embeddings
import { onBlockWrite } from "../../block-hook.ts";

registerCrud(contentCrudRoutes, {
  table: "summary_blocks",
  slug: "summary-blocks",
  parentKey: "summary_id",
  hasCreatedBy: true,           // CAMBIO: ahora trackea quién creó
  hasUpdatedAt: true,           // CAMBIO: ahora trackea cuándo se editó
  hasOrderIndex: true,
  hasIsActive: true,
  requiredFields: ["type", "content"],
  createFields: [
    "type", "content", "order_index",
    "heading_text", "heading_level", "is_active",
    "position_x", "position_y", "width", "height",  // NUEVO
    "style", "metadata",                              // NUEVO
  ],
  updateFields: [
    "type", "content", "order_index",
    "heading_text", "heading_level", "is_active",
    "position_x", "position_y", "width", "height",  // NUEVO
    "style", "metadata",                              // NUEVO
  ],
  afterWrite: onBlockWrite,     // NUEVO: hook de sincronización
});
```

### 5.2 NUEVO: `block-hook.ts` — Hook de Sincronización (v3: sin embedding en edit)

```typescript
/**
 * block-hook.ts — afterWrite hook for summary_blocks
 *
 * v3 CHANGE: NO embedding during edit. Embedding only happens at publish.
 * This hook only marks the summary as needing re-publish.
 *
 * Called by crud-factory after POST/PUT/DELETE on summary_blocks.
 * During review (editing):
 *   - NO embedding (saves API calls, avoids partial/inconsistent embeddings)
 *   - NO content_markdown regeneration (it's derived at publish time)
 *   - Only marks summary as dirty (needs_publish flag)
 *
 * At publish time (called by publish-summary.ts, NOT by this hook):
 *   1. flattenBlocksToMarkdown → content_markdown curado
 *   2. autoChunkAndEmbed → chunks + embeddings de contenido curado
 *   3. Per-block embedding (Opción B)
 *
 * Fire-and-forget: errors are logged but never affect the CRUD response.
 */
import type { AfterWriteParams } from "./crud-factory.ts";
import { getAdminClient } from "./db.ts";

// Debounce map: prevents multiple dirty-flags if edits are rapid
const syncTimestamps = new Map<string, number>();
const SYNC_DEBOUNCE_MS = 5_000;

export function onBlockWrite({ action, row }: AfterWriteParams): void {
  const summaryId = row.summary_id as string;
  const blockId = row.id as string;
  if (!summaryId) return;

  // Debounce por summary_id (no por bloque) — múltiples edits rápidos
  // deben coalescer en un solo flag.
  const lastSync = syncTimestamps.get(summaryId) || 0;
  const now = Date.now();
  if (now - lastSync < SYNC_DEBOUNCE_MS) {
    console.log(`[Block Hook] Debounced dirty-flag for summary ${summaryId}`);
    return;
  }
  syncTimestamps.set(summaryId, now);

  // Fire-and-forget: solo marcar como dirty
  markSummaryDirty(summaryId).catch((err) => {
    console.error(`[Block Hook] Error marking summary dirty ${summaryId}:`, err);
  });
}

async function markSummaryDirty(summaryId: string): Promise<void> {
  const db = getAdminClient();

  // Si el summary estaba 'published', volver a 'review' (contenido cambió)
  // Si estaba 'review', no hacer nada (ya está en edición)
  const { data: summary } = await db
    .from("summaries")
    .select("status")
    .eq("id", summaryId)
    .single();

  if (summary?.status === "published") {
    await db
      .from("summaries")
      .update({ status: "review" }) // Vuelve a review — embeddings desactualizados
      .eq("id", summaryId);
    console.log(`[Block Hook] Summary ${summaryId} reverted to 'review' (blocks changed post-publish)`);
  }
  // Si status es 'review' o 'raw', no hacer nada — ya está en edición
}

/**
 * Health-check: detecta bloques cuyo updated_at es posterior
 * a la última regeneración de content_markdown.
 * Llamar periódicamente o exponer como RPC para diagnóstico.
 */
export async function checkBlockSyncHealth(summaryId: string): Promise<{
  inSync: boolean;
  staleSince: string | null;
}> {
  const db = getAdminClient();
  const { data } = await db.rpc("check_block_sync_health", { p_summary_id: summaryId });
  // RPC devuelve: { in_sync: boolean, stale_since: timestamptz | null }
  return {
    inSync: data?.in_sync ?? true,
    staleSince: data?.stale_since ?? null,
  };
  // SQL para este RPC en sección 4.4
}

function extractTextFromBlock(type: string, content: any): string {
  // Delegate to block-flatten for consistent text extraction
  return flattenBlocksToMarkdown([{ type, content, order_index: 0 }]);
}
```

### 5.3 NUEVO: `block-flatten.ts` — Blocks → Texto Plano

```typescript
/**
 * block-flatten.ts — Convert structured blocks to plain text
 *
 * Used by:
 *   - block-hook.ts (sync content_markdown)
 *   - Individual block embedding (extract text for one block)
 *
 * Each block type has its own flattening logic to produce
 * readable text suitable for embeddings and FTS.
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
  switch (block.type) {
    case "prose":
      return [c.title && `## ${c.title}`, stripKeywordMarkers(c.content)]
        .filter(Boolean).join("\n\n");

    case "key_point":
      return [
        `**CONCEPTO CLAVE: ${c.title || ""}**`,
        c.importance === "critical" ? "[CRÍTICO]" : "",
        stripKeywordMarkers(c.content),
      ].filter(Boolean).join("\n");

    case "stages":
      return [
        c.title && `## ${c.title}`,
        ...(c.items || []).map((item: any) =>
          `Etapa ${item.stage}: ${item.title} — ${stripKeywordMarkers(item.content)}`
        ),
      ].filter(Boolean).join("\n");

    case "comparison":
      return [
        c.title && `## ${c.title}`,
        (c.headers || []).join(" | "),
        ...(c.rows || []).map((row: string[]) => row.join(" | ")),
      ].filter(Boolean).join("\n");

    case "list_detail":
      return [
        c.title && `## ${c.title}`,
        c.intro,
        ...(c.items || []).map((item: any) =>
          `• ${item.label}: ${item.detail}`
        ),
      ].filter(Boolean).join("\n");

    case "grid":
      return [
        c.title && `## ${c.title}`,
        ...(c.items || []).map((item: any) =>
          `• ${item.label}: ${item.detail}`
        ),
      ].filter(Boolean).join("\n");

    case "two_column":
      return (c.columns || []).map((col: any) => [
        col.title && `### ${col.title}`,
        ...(col.items || []).map((item: any) =>
          `• ${item.label}: ${item.detail}`
        ),
      ].filter(Boolean).join("\n")).join("\n\n");

    case "callout_edu":
      return [
        `[${(c.variant || "info").toUpperCase()}] ${c.title || ""}`,
        stripKeywordMarkers(c.content),
      ].filter(Boolean).join("\n");

    case "image_reference":
      return `[Imagen: ${c.caption || c.description || "Sin descripción"}]`;

    case "section_divider":
      return c.label || "";

    // Legacy CMS types
    case "text":
      return c.html?.replace(/<[^>]+>/g, "") || c.text || "";
    case "heading":
      return c.text || "";
    case "callout":
      return c.text || c.html?.replace(/<[^>]+>/g, "") || "";

    default:
      return JSON.stringify(c);
  }
}

function stripKeywordMarkers(text: string | undefined): string {
  if (!text) return "";
  return text.replace(/\{\{([^}]+)\}\}/g, "$1");
}
```

### 5.4 NUEVO: `publish-summary.ts` — Endpoint de Publicación (v3)

```typescript
/**
 * publish-summary.ts — POST /content/summaries/:id/publish
 *
 * v3: THIS is where embedding happens. Not during editing.
 *
 * 1. Verify status = 'review' and has blocks
 * 2. flattenBlocksToMarkdown → content_markdown (curado)
 * 3. autoChunkAndEmbed → chunks + embeddings del contenido curado
 * 4. Per-block embeddings (Opción B)
 * 5. status → 'published'
 */
import { flattenBlocksToMarkdown } from "./block-flatten.ts";
import { autoChunkAndEmbed } from "./auto-ingest.ts";
import { generateEmbedding } from "./openai-embeddings.ts";
import { getAdminClient, authenticate } from "./db.ts";

export async function publishSummary(c: Context): Promise<Response> {
  const { client, userId } = authenticate(c);
  const summaryId = c.req.param("id");
  const db = getAdminClient();

  // 1. Verify status and blocks
  const { data: summary } = await db
    .from("summaries").select("status").eq("id", summaryId).single();
  if (!summary || summary.status !== "review") {
    return c.json({ error: "Summary must be in 'review' status to publish" }, 400);
  }
  const { data: blocks } = await db
    .from("summary_blocks")
    .select("id, type, content, order_index")
    .eq("summary_id", summaryId).eq("is_active", true)
    .order("order_index");
  if (!blocks?.length) {
    return c.json({ error: "Summary has no blocks to publish" }, 400);
  }

  // 2. Flatten blocks → curated content_markdown
  const markdown = flattenBlocksToMarkdown(blocks);
  await db.from("summaries")
    .update({ content_markdown: markdown })
    .eq("id", summaryId);

  // 3. autoChunkAndEmbed on the curated content (reuses existing pipeline)
  await autoChunkAndEmbed(summaryId);

  // 4. Per-block embeddings (Opción B)
  let blocksEmbedded = 0;
  for (const block of blocks) {
    const text = flattenBlocksToMarkdown([block]);
    if (text.length > 20) {
      const embedding = await generateEmbedding(text);
      await db.from("summary_blocks")
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", block.id);
      blocksEmbedded++;
    }
  }

  // 5. Status → published
  await db.from("summaries")
    .update({ status: "published" })
    .eq("id", summaryId);

  return c.json({
    status: "published",
    chunks_count: /* from autoChunkAndEmbed */ -1,
    blocks_embedded: blocksEmbedded,
  });
}
```

### 5.5 Cambio en `summary-hook.ts` (v3)

```
v2: onSummaryWrite() → si content_markdown cambió → autoChunkAndEmbed() SIEMPRE
v3: onSummaryWrite() → si content_markdown cambió Y status='published' → autoChunkAndEmbed()
    (o simplemente: publish-summary.ts llama autoChunkAndEmbed() directamente,
     y el hook se desactiva para summaries con bloques)
```

**Opción más limpia:** El hook verifica `hasBlocks` antes de actuar:
- Si summary NO tiene bloques → legacy mode, hook funciona como antes
- Si summary SÍ tiene bloques → hook NO hace nada (publish-summary.ts maneja todo)

### 5.6 Archivos del backend que NO se tocan

```
auto-ingest.ts         — sigue funcionando: chunking + embedding pipeline (lo llama publish-summary.ts)
chunker.ts             — sigue funcionando: split en chunks
semantic-chunker.ts    — sigue funcionando: chunking semántico
openai-embeddings.ts   — sigue funcionando: generateEmbedding() (lo reutiliza block-hook)
claude-ai.ts           — sigue funcionando: generateText/Stream
retrieval-strategies.ts— sigue funcionando: selectStrategy, multi-query, HyDE
routes/ai/generate.ts  — sigue funcionando: ya acepta block_id
routes/ai/chat.ts      — sigue funcionando: RAG chat con chunks
auth-helpers.ts        — sigue funcionando: roles
db.ts                  — sigue funcionando: authenticate, getAdminClient
```

---

## 6. Cambios en Frontend — Student (Branch: `feat/block-based-summaries`)

### 6.1 `summariesApi.ts` — Types + CRUD Functions

```typescript
// ── Ampliar SummaryBlock type ──
export interface SummaryBlock {
  id: string;
  summary_id: string;
  type:
    | 'text' | 'heading' | 'image' | 'video' | 'pdf' | 'callout' | 'divider' | 'keyword-ref'
    | 'prose' | 'key_point' | 'stages' | 'comparison' | 'list_detail'
    | 'grid' | 'two_column' | 'callout_edu' | 'image_reference' | 'section_divider';
  content: Record<string, any>;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  style?: Record<string, any>;
  metadata?: Record<string, any>;
}

// ── NUEVO: CRUD para bloques ──
export async function createSummaryBlock(data: {
  summary_id: string;
  type: string;
  content: Record<string, any>;
  order_index?: number;
}): Promise<SummaryBlock> {
  return apiCall<SummaryBlock>('/summary-blocks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSummaryBlock(
  id: string,
  data: Partial<Pick<SummaryBlock, 'type' | 'content' | 'order_index' | 'is_active' | 'style' | 'metadata'>>
): Promise<SummaryBlock> {
  return apiCall<SummaryBlock>(`/summary-blocks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteSummaryBlock(id: string): Promise<void> {
  await apiCall(`/summary-blocks/${id}`, { method: 'DELETE' });
}
```

### 6.2 `ViewerBlock.tsx` — 10 Renderers Educativos

Agregar nuevos `case` al switch. Los componentes se importan de `./blocks/`:

```
blocks/ProseBlock.tsx         — título Georgia + contenido con lineHeight
blocks/KeyPointBlock.tsx      — fondo teal oscuro, ícono Zap, badge importancia
blocks/StagesBlock.tsx        — timeline vertical, severity dots, border-left coloreado
blocks/ComparisonBlock.tsx    — tabla con headers, highlight_column, zebra striping
blocks/ListDetailBlock.tsx    — ícono Lucide + label bold + detail + severity bar
blocks/GridBlock.tsx          — N columnas de cards con ícono
blocks/TwoColumnBlock.tsx     — 2 columnas con contenido mixto
blocks/CalloutEduBlock.tsx    — 5 variantes: tip/warning/clinical/mnemonic/exam
blocks/ImageReferenceBlock.tsx— imagen o placeholder + caption
blocks/SectionDividerBlock.tsx— línea decorativa + label opcional
blocks/index.ts               — barrel export
```

**Fuente:** `Prototipo_Resumenes_Axon_v2.jsx` — los renderers están completos.

**Conversión necesaria:** inline styles → Tailwind v4, `T.darkTeal` → `text-teal-900`, tipado TypeScript.

### 6.3 `SummaryViewer.tsx` — Envolver en KeywordHighlighterInline

```tsx
import { KeywordHighlighterInline } from './KeywordHighlighterInline';

// Dentro del render, envolver el contenedor de bloques:
<KeywordHighlighterInline summaryId={summaryId} onNavigateKeyword={onKeywordClick}>
  <div ref={containerRef} className="space-y-6">
    {blocks.map((block) => (
      <ViewerBlock key={block.id} block={block} isMobile={isMobile} ... />
    ))}
  </div>
</KeywordHighlighterInline>
```

El TreeWalker del highlighter recorre todo el texto renderizado y decora keywords automáticamente.

### 6.4 Archivos que NO se tocan (Student)

```
StudentSummaryReader.tsx     ReaderChunksTab.tsx
ReaderHeader.tsx             ReaderKeywordsTab.tsx
ReaderAnnotationsTab.tsx     KeywordHighlighterInline.tsx
InlineKeywordPopover.tsx     KeywordPopup.tsx
KeywordDefinitionSection.tsx KeywordConnectionsSection.tsx
KeywordActionsSection.tsx    KeywordBadges.tsx
ChunkRenderer.tsx            SummaryHeader.tsx
useSummaryReaderQueries.ts   useSummaryReaderMutations.ts
useSummaryBlocksQuery.ts     summary-content-helpers.tsx
studentSummariesApi.ts       reader-atoms.tsx
mastery-helpers.ts           as-chat.ts
as-generate.ts               as-generate-smart.ts
as-ingest.ts
```

---

## 7. Cambios en Frontend — Profesor (Branch: `feat/block-editor-professor`)

### 7.1 `BlockEditor.tsx` — Editor Visual de Bloques

Componente principal que reemplaza/complementa el TipTap monolítico para resúmenes con bloques.

**Funcionalidades:**
- Lista vertical de bloques con drag-and-drop para reordenar
- Botón "+" entre bloques para insertar nuevo bloque
- Menú de tipo de bloque (10 educativos + image)
- Editor inline por bloque (TipTap para prose, forms estructurados para stages/comparison/etc)
- Auto-save por bloque (debounce 2s + dirty tracking)
- Preview mode (toggle editor ↔ student view)
- Indicador de confianza IA por bloque (si fue generado automáticamente)

**Sub-componentes:**
```
BlockEditor.tsx                    — orquestador principal
├── BlockEditorToolbar.tsx         — agregar bloque, preview toggle, publicar
├── BlockCard.tsx                  — wrapper con drag handle + actions
│     ├── BlockTypeIndicator.tsx   — badge de tipo + color
│     └── BlockActions.tsx         — editar, duplicar, eliminar, mover
├── BlockFormRouter.tsx            — switch por tipo → form correcto
│     ├── ProseForm.tsx            — TipTap mini-editor para texto
│     ├── KeyPointForm.tsx         — título + contenido + selector importancia
│     ├── StagesForm.tsx           — lista dinámica de etapas
│     ├── ComparisonForm.tsx       — tabla editable (headers + rows)
│     ├── ListDetailForm.tsx       — lista de items con ícono + severity
│     ├── GridForm.tsx             — items + selector de columnas
│     ├── TwoColumnForm.tsx        — 2 paneles con items
│     ├── CalloutEduForm.tsx       — selector variante + título + contenido
│     ├── ImageReferenceForm.tsx   — upload (reutiliza ImageUploadDialog) + caption
│     └── SectionDividerForm.tsx   — label opcional
├── BlockTypeSelector.tsx          — modal/dropdown para elegir tipo
├── AddBlockButton.tsx             — botón "+" flotante entre bloques
└── BlockAIGenerator.tsx           — "Generar con IA" → POST /ai/generate-summary
```

### 7.2 `useBlockEditorMutations.ts` — React Query Mutations

```typescript
// Mutations para el editor de bloques del profesor
export function useBlockEditorMutations(summaryId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.summaryBlocks(summaryId) });
  };

  const createBlock = useMutation({
    mutationFn: (data: CreateBlockData) => summariesApi.createSummaryBlock({ summary_id: summaryId, ...data }),
    onSuccess: invalidate,
  });

  const updateBlock = useMutation({
    mutationFn: ({ id, ...data }: UpdateBlockData) => summariesApi.updateSummaryBlock(id, data),
    onSuccess: invalidate,
  });

  const deleteBlock = useMutation({
    mutationFn: (id: string) => summariesApi.deleteSummaryBlock(id),
    onSuccess: invalidate,
  });

  const reorderBlocks = useMutation({
    mutationFn: (items: { id: string; order_index: number }[]) =>
      apiCall('/reorder', { method: 'PUT', body: JSON.stringify({ table: 'summary_blocks', items }) }),
    onSuccess: invalidate,
  });

  return { createBlock, updateBlock, deleteBlock, reorderBlocks };
}
```

### 7.3 `SummaryDetailView.tsx` — Integrar BlockEditor

**Cambio:** Cuando `hasBlocks = true`, mostrar `BlockEditor` en vez de (o junto a) `TipTapEditor`.

```tsx
{hasBlocks ? (
  <BlockEditor
    summaryId={summary.id}
    onBack={onBack}
    onStatusChange={handleStatusChange}
    summaryTitle={summary.title}
    summaryStatus={summary.status}
  />
) : (
  <TipTapEditor
    summaryId={summary.id}
    contentMarkdown={summary.content_markdown}
    // ... props existentes
  />
)}
```

El TipTap monolítico sigue disponible para resúmenes legacy (sin bloques). Los nuevos resúmenes usan BlockEditor.

### 7.4 Imágenes en Bloques

El `ImageUploadDialog.tsx` existente sube a Supabase Storage bucket `axon-images`:
```
axon-images/summaries/{userId}/{filename}
```
Retorna URL pública. El `ImageReferenceForm.tsx` reutiliza este mismo dialog.

Para bloques `image_reference`:
```json
{
  "type": "image_reference",
  "content": {
    "description": "Etapas de la aterogénesis",
    "caption": "Figura 1. Formación de la placa",
    "image_url": "https://db.xdnciktarvxyhkrokbng.supabase.co/storage/v1/object/public/axon-images/summaries/abc/placa.png"
  }
}
```

Para imágenes dentro de bloques `prose`, el TipTap mini-editor dentro del bloque usa el mismo `ImageWithPosition` extension que ya existe.

---

## 8. Plan de Ejecución por Fases

### Fase 0 — Migración Summaries Status Flow (Cowork, ~10 min) ← NUEVO v3
- [ ] ALTER summaries: ADD content_markdown_raw text
- [ ] ALTER summaries: ADD generation_config jsonb DEFAULT '{}'
- [ ] Actualizar CHECK constraint de status: ('draft','raw','review','published','archived')
- [ ] Verificar con SELECT DISTINCT status FROM summaries

### Fase 1 — Migración BD summary_blocks (Cowork, ~20 min)
- [ ] Correr SQL de migración via MCP Supabase (con índice HNSW, no ivfflat)
- [ ] Verificar schema con queries de verificación
- [ ] Correr SQL de `rag_block_search` RPC (sección 4.2)
- [ ] Correr SQL de `check_block_sync_health` RPC (sección 4.4)
- [ ] Test insert de bloque con content JSONB

### Fase 2 — Student Rendering (Claude Code CLI, ~2-3h)
**Branch:** `feat/block-based-summaries`

**Archivos a modificar (3):**
```
src/app/services/summariesApi.ts            — types + CRUD functions
src/app/components/student/ViewerBlock.tsx   — importar nuevos renderers
src/app/components/student/SummaryViewer.tsx — envolver en KeywordHighlighterInline
```

**Archivos a crear (11):**
```
src/app/components/student/blocks/ProseBlock.tsx
src/app/components/student/blocks/KeyPointBlock.tsx
src/app/components/student/blocks/StagesBlock.tsx
src/app/components/student/blocks/ComparisonBlock.tsx
src/app/components/student/blocks/ListDetailBlock.tsx
src/app/components/student/blocks/GridBlock.tsx
src/app/components/student/blocks/TwoColumnBlock.tsx
src/app/components/student/blocks/CalloutEduBlock.tsx
src/app/components/student/blocks/ImageReferenceBlock.tsx
src/app/components/student/blocks/SectionDividerBlock.tsx
src/app/components/student/blocks/index.ts
```

**Validación:** `npm run build` sin errores.

### Fase 3 — Primer Resumen Real via Cowork (Cowork, ~30 min) ← ACTUALIZADO v3
- [ ] Tomar un JSON ejemplo existente (ej: ejemplo-diabetes-tipo2.json en /schema/)
- [ ] Insertar summary con status='review' y content_markdown_raw=(texto fuente)
- [ ] Insertar summary_blocks via MCP SQL (bloques del JSON)
- [ ] Insertar keywords del resumen
- [ ] **NO generar content_markdown todavía** (se hace al publicar)
- [ ] Verificar rendering en frontend (student view) — los bloques se ven sin embedding
- [ ] Verificar keywords se resaltan correctamente
- [ ] Verificar KeywordPopup funciona al hacer click
- [ ] Simular publish: correr flattenBlocksToMarkdown manualmente → UPDATE content_markdown

### Fase 3b — Generación IA desde Cowork (Cowork, ~1h) ← NUEVO v3
- [ ] Petrick da un PDF nuevo de un tema
- [ ] Claude lee el PDF + WORKFLOW_RESUMENES_AXON.md + block-schema.json
- [ ] Claude genera JSON de bloques completo
- [ ] Claude inserta via MCP Supabase (summary + blocks + keywords + quiz)
- [ ] Verificar en frontend → iterar si hace falta
- [ ] Documentar el prompt que funcionó bien (para reuso en endpoint automatizado)

### Fase 4 — Backend: Hooks + Endpoints de Generación y Publish (Claude Code CLI, ~3-4h) ← ACTUALIZADO v3
**Branch:** `feat/block-embeddings`

**Archivos a modificar (2):**
```
supabase/functions/server/routes/content/crud.ts — actualizar CRUD factory
supabase/functions/server/summary-hook.ts        — guardar para summaries con bloques (v3)
```

**Archivos a crear (5):**
```
supabase/functions/server/block-hook.ts                    — onBlockWrite (solo dirty-flag, sin embed)
supabase/functions/server/block-flatten.ts                 — blocks → texto plano
supabase/functions/server/routes/content/publish-summary.ts — POST /publish (flatten + embed)
supabase/functions/server/routes/ai/generate-summary-blocks.ts — POST /generate-summary-blocks (IA → JSON → INSERT)
supabase/functions/server/routes/ai/prompts/workflow-resumenes.ts — WORKFLOW como template string
```

**Validación:**
- `deno check supabase/functions/server/index.ts`
- Insertar bloque → verificar que NO se genera embedding (solo dirty-flag)
- Llamar publish endpoint → verificar que SÍ se genera content_markdown + embeddings
- Llamar generate-summary-blocks → verificar que genera bloques válidos

### Fase 5 — Block Editor Profesor (Claude Code CLI, ~4-6h)
**Branch:** `feat/block-editor-professor`
> **⚠️ PREREQUISITO:** Mergear `feat/block-based-summaries` (Fase 2) a main ANTES de crear este branch. Si no, Fase 5 acumula drift y el rebase será doloroso. Secuencia: Fase 2 PR → merge → `git checkout -b feat/block-editor-professor main`.

**Archivos a crear (~15):**
```
src/app/components/professor/block-editor/BlockEditor.tsx
src/app/components/professor/block-editor/BlockEditorToolbar.tsx
src/app/components/professor/block-editor/BlockCard.tsx
src/app/components/professor/block-editor/BlockFormRouter.tsx
src/app/components/professor/block-editor/forms/ProseForm.tsx
src/app/components/professor/block-editor/forms/KeyPointForm.tsx
src/app/components/professor/block-editor/forms/StagesForm.tsx
src/app/components/professor/block-editor/forms/ComparisonForm.tsx
src/app/components/professor/block-editor/forms/ListDetailForm.tsx
src/app/components/professor/block-editor/forms/CalloutEduForm.tsx
src/app/components/professor/block-editor/forms/ImageReferenceForm.tsx
src/app/components/professor/block-editor/BlockTypeSelector.tsx
src/app/components/professor/block-editor/AddBlockButton.tsx
src/app/hooks/queries/useBlockEditorMutations.ts
```

**Archivos a modificar (1):**
```
src/app/components/roles/pages/professor/SummaryDetailView.tsx — integrar BlockEditor
```

**Validación:** `npm run build` + crear/editar/reordenar/eliminar bloques desde la UI.

### Fase 6 — E2E Testing + Polish (Cowork + CLI, ongoing)
- [ ] Dark mode para bloques educativos
- [ ] ResumenMap (outline sidebar) opcional
- [ ] Mastery per-block (colores de borde por dominio)
- [ ] Quiz por bloque (botón → POST /ai/generate con block_id)
- [ ] Verificar RAG chat funciona con content_markdown regenerado
- [ ] Verificar embeddings por bloque se generan correctamente
- [ ] Crear más resúmenes reales

---

## 9. Dependencias, Riesgos y Contingencias

### 9.1 Dependencias

| Dependencia | Estado | Bloquea Fase |
|-------------|--------|-------------|
| Supabase MCP conectado | ✅ Funciona | 1 |
| pgvector extension instalada | ✅ Ya activa (chunks usan) | 1 |
| Frontend repo en GitHub | ✅ Accesible | 2, 5 |
| Backend repo en GitHub | ✅ Accesible | 4 |
| `getSummaryBlocks()` API | ✅ Ya existe | 2 |
| `useSummaryBlocksQuery` hook | ✅ Ya existe | 2 |
| `hasBlocks` switch en ReaderChunksTab | ✅ Ya existe | 2 |
| Prototipo v2 con renderers | ✅ JSX listo | 2 |
| CRUD factory para summary-blocks | ✅ Ya existe | 4 |
| `PUT /reorder` soporta summary_blocks | ✅ Ya en allowlist | 5 |
| `onSummaryWrite` → autoChunkAndEmbed | ✅ Ya existe | 4 |
| `generateEmbedding()` | ✅ Ya existe | 4 |
| `ImageUploadDialog` | ✅ Ya existe | 5 |
| Design tokens (`colors.ts`, `typography.ts`) | ✅ En repo | 2, 5 |
| @dnd-kit o motion drag | ⚠️ `motion` v12 instalado, no dnd-kit | 5 |

### 9.2 Riesgos

| Riesgo | Prob. | Impacto | Mitigación |
|--------|-------|---------|------------|
| ~~ivfflat index falla con <50 filas~~ | ~~Media~~ | ~~Bajo~~ | **RESUELTO:** Migración usa HNSW desde el inicio (ver sección 4.1) |
| ~~Block hook + summary hook = doble embedding~~ | ~~Baja~~ | ~~Medio~~ | **RESUELTO v3:** Block hook ya no embeddea. Solo dirty-flag. Embedding ocurre solo en publish-summary.ts. summary-hook tiene guard para summaries con bloques. |
| TipTap dentro de BlockEditor conflicta con TipTap existente | Baja | Medio | Instancias separadas con IDs distintos |
| Professor ve bloques pero quiere editar como TipTap | Media | Alto | Mantener toggle: "Editor clásico" vs "Editor de bloques" en SummaryDetailView |
| Rate limits de OpenAI embeddings al editar muchos bloques | Baja | Medio | **IMPLEMENTADO:** Debounce 5s por `summary_id` en block-hook.ts (ver sección 5.2) |
| Content_markdown se desincroniza de bloques | Baja | Alto | Content_markdown es SIEMPRE derivado de bloques. Nunca se edita directamente si hasBlocks. **NUEVO:** RPC `check_block_sync_health` (sección 4.4) + health-check en block-hook.ts para detectar desincronización silenciosa. |

### 9.3 Invariantes del Sistema

Estas reglas deben cumplirse SIEMPRE después de la migración:

1. **Si un summary tiene bloques, `content_markdown` es derivado.** Se genera SOLO al publicar via flattenBlocksToMarkdown(). Nunca editado directamente.
2. **Si un summary NO tiene bloques, funciona como antes.** TipTap monolítico edita content_markdown directamente. Sin regresión.
3. **Keywords se vinculan a `summary_id`, no a bloques.** El highlighting funciona por regex sobre texto renderizado. Sin cambio de modelo.
4. **Chunks se generan de `content_markdown`, no de bloques.** El pipeline RAG existente no cambia. La Opción B agrega búsqueda adicional en bloques, no reemplaza chunks.
5. **El `hasBlocks` switch decide todo.** Si hay filas en summary_blocks para ese summary → modo bloques (student + professor). Si no → modo legacy.
6. **Activación de modo bloques.** Un summary entra en modo bloques cuando se inserta su primer bloque — ya sea manualmente ("Convertir a bloques" en SummaryDetailView) o automáticamente (al generar con IA via `POST /ai/generate-summary-blocks`). Una vez activado, no hay vuelta atrás.
7. **Embedding solo al publicar (v3).** Durante edición (status='review'), NO se genera ningún embedding. onBlockWrite() solo marca el summary como dirty. Embedding ocurre exclusivamente en publish-summary.ts. Esto ahorra costos de API y evita embeddings parciales/inconsistentes.
8. **Si se edita un summary publicado, vuelve a 'review'.** onBlockWrite() detecta status='published' y lo revierte a 'review'. El profesor debe re-publicar para que los embeddings se actualicen. Esto garantiza que RAG siempre tiene contenido consistente.

---

## 10. Anexos

### Anexo A — Schema de Bloques Educativos

| Tipo | content fields | Uso |
|------|---------------|-----|
| `prose` | `title`, `content` | Párrafo narrativo |
| `key_point` | `title`, `content`, `importance` (critical/high/normal) | Concepto central destacado |
| `stages` | `title`, `items[]` { stage, title, content, severity } | Proceso paso a paso |
| `comparison` | `title`, `headers[]`, `rows[][]`, `highlight_column` | Tabla comparativa |
| `list_detail` | `title`, `intro`, `items[]` { label, detail, icon, severity } | Lista con detalles |
| `grid` | `title`, `columns`, `items[]` { label, detail, icon } | Cards en grilla |
| `two_column` | `columns[]` { title, content_type, items[] } | Dos columnas |
| `callout_edu` | `variant` (tip/warning/clinical/mnemonic/exam), `title`, `content` | Destacado temático |
| `image_reference` | `description`, `caption`, `image_url` | Imagen con caption |
| `section_divider` | `label` | Separador |

### Anexo B — Iconos (Lucide React)

```
Activity, Heart, Pill, Stethoscope, Shield, FlaskConical, Clock,
Lightbulb, Target, AlertCircle, Brain, Info, AlertTriangle,
HelpCircle, CheckCircle2, BookOpen, Zap
```

### Anexo C — Instrucciones para Claude Code CLI

**Fase 2 — Student Rendering:**
```
Branch: feat/block-based-summaries (base: main)
git pull origin main && git checkout -b feat/block-based-summaries main

Modificar:
  src/app/services/summariesApi.ts — ampliar SummaryBlock type + add CRUD functions
  src/app/components/student/ViewerBlock.tsx — import blocks/, add cases
  src/app/components/student/SummaryViewer.tsx — wrap KeywordHighlighterInline

Crear:
  src/app/components/student/blocks/*.tsx (10 + index.ts)
  Fuente: /AXON PROJECTO/Prototipo_Resumenes_Axon_v2.jsx
  Convertir: inline styles → Tailwind v4, tokens → design-system/colors.ts

Design system: Georgia headings, Inter body, teal primary.
PROHIBIDO: glassmorphism, gradients on buttons, blue/violet.

NO tocar: StudentSummaryReader, ReaderChunksTab, KeywordHighlighterInline,
          KeywordPopup, RAG, embeddings, chunks.

Validación: npm run build
```

**Fase 4 — Backend Hooks + Endpoints (v3):**
```
Branch: feat/block-embeddings (base: main)
git pull origin main && git checkout -b feat/block-embeddings main

Modificar:
  supabase/functions/server/routes/content/crud.ts
    — summary-blocks config: hasCreatedBy true, hasUpdatedAt true,
      add position/style/metadata to fields, add afterWrite: onBlockWrite
  supabase/functions/server/summary-hook.ts
    — Agregar guard: si summary tiene bloques (hasBlocks), NO disparar autoChunkAndEmbed
      (publish-summary.ts lo maneja)

Crear:
  supabase/functions/server/block-hook.ts — onBlockWrite (solo dirty-flag, SIN embed)
  supabase/functions/server/block-flatten.ts — flattenBlocksToMarkdown
  supabase/functions/server/routes/content/publish-summary.ts — POST /summaries/:id/publish
    (flatten + autoChunkAndEmbed + per-block embed + status='published')
  supabase/functions/server/routes/ai/generate-summary-blocks.ts — POST /generate-summary-blocks
    (content_markdown_raw → Claude → JSON → INSERT blocks + keywords + quiz)
  supabase/functions/server/routes/ai/prompts/workflow-resumenes.ts
    (WORKFLOW_RESUMENES_AXON.md como template string para el prompt)

CLAVE v3: Embedding NO ocurre en cada edit. Solo al publicar.
  onBlockWrite() = dirty-flag (si published → revert a review)
  publishSummary() = flatten + embed + status update

NO tocar: auto-ingest.ts, openai-embeddings.ts, crud-factory.ts

Validación: deno check supabase/functions/server/index.ts
```

**Fase 5 — Block Editor Professor:**
```
Branch: feat/block-editor-professor (base: main, DESPUÉS de mergear feat/block-based-summaries)

Crear:
  src/app/components/professor/block-editor/ (14 archivos)
  src/app/hooks/queries/useBlockEditorMutations.ts

Modificar:
  src/app/components/roles/pages/professor/SummaryDetailView.tsx
    — if hasBlocks → BlockEditor, else → TipTapEditor

Drag: usar motion v12 drag (ya instalado), NO instalar dnd-kit.
Images: reutilizar ImageUploadDialog existente.

Validación: npm run build
```

### Anexo D — Resumen de Archivos Tocados vs No Tocados

**TOTAL MODIFICADOS: 6 archivos**
```
FRONTEND:
  summariesApi.ts            — types + CRUD functions
  ViewerBlock.tsx            — importar renderers educativos
  SummaryViewer.tsx          — wrap KeywordHighlighterInline
  SummaryDetailView.tsx      — integrar BlockEditor

BACKEND:
  routes/content/crud.ts     — actualizar CRUD factory config
  (SQL migration via MCP)
```

**TOTAL CREADOS: ~28 archivos**
```
FRONTEND Student (11):    blocks/*.tsx + index.ts
FRONTEND Professor (15):  block-editor/*.tsx + forms/*.tsx + mutations hook
BACKEND (2):              block-hook.ts + block-flatten.ts
SQL (3):                  migración + RPC rag_block_search + RPC check_block_sync_health
```

**NO SE TOCAN: 40+ archivos**
```
StudentSummaryReader, ReaderChunksTab, ReaderHeader,
ReaderKeywordsTab, ReaderAnnotationsTab,
KeywordHighlighterInline, InlineKeywordPopover, KeywordPopup,
KeywordDefinitionSection, KeywordConnectionsSection, KeywordActionsSection,
KeywordBadges, KeywordMasterySection, KeywordHighlighterInline,
ChunkRenderer, SummaryHeader, ImageLightbox,
FlashcardReviewer, QuizTaker, SmartPopup,
useSummaryReaderQueries, useSummaryReaderMutations, useSummaryBlocksQuery,
useKeywordMasteryQuery, useKeywordPopupQueries, useKeywordDetailQueries,
summary-content-helpers, mastery-helpers, reader-atoms,
studentSummariesApi, as-chat, as-generate, as-generate-smart, as-ingest,
summary-hook.ts, auto-ingest.ts, openai-embeddings.ts, crud-factory.ts,
chunker.ts, semantic-chunker.ts, retrieval-strategies.ts, claude-ai.ts
```
