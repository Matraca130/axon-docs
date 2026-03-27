# Plan de Migración: Sistema de Bloques Educativos para Axon

> **Versión:** 1.0 — 2026-03-23
> **Autor:** Claude (Cowork) + Petrick
> **Estado:** Planificación
> **Decisión clave adoptada:** Opción A — `content_markdown` como texto plano para RAG, bloques JSON para rendering

---

## 1. Situación Actual (Diagnóstico)

### 1.1 Base de Datos — `summary_blocks`

La tabla existe pero tiene **0 filas** y un schema básico:

```
summary_blocks (ACTUAL):
  id              UUID PK DEFAULT gen_random_uuid()
  summary_id      UUID FK → summaries.id ON DELETE CASCADE
  type            TEXT NOT NULL DEFAULT 'paragraph'
  content         TEXT NOT NULL DEFAULT ''
  heading_text    TEXT NULL
  heading_level   SMALLINT NULL
  order_index     INTEGER NOT NULL DEFAULT 0
  is_active       BOOLEAN NOT NULL DEFAULT true
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

**Problemas:**
- `content` es TEXT — el frontend espera `Record<string, any>` (JSONB)
- Faltan columnas: `position_x`, `position_y`, `width`, `height`, `updated_at`, `style`, `metadata`
- `type` solo acepta valores genéricos — nuestro sistema necesita 10 tipos educativos
- Sin índice en `(summary_id, order_index)` para queries ordenadas

### 1.2 Frontend — `SummaryBlock` Interface

```typescript
// summariesApi.ts línea 90
export interface SummaryBlock {
  id: string;
  summary_id: string;
  type: 'text' | 'heading' | 'image' | 'video' | 'pdf' | 'callout' | 'divider' | 'keyword-ref';
  content: Record<string, any>;  // ← espera JSONB
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

### 1.3 Frontend — `ViewerBlock.tsx` (renderer actual)

Renderiza 8 tipos CMS: `text`, `heading`, `image`, `video`, `pdf`, `callout`, `divider`, `keyword-ref`.
Ninguno de estos es educativo. Nuestro sistema necesita 10 tipos distintos.

### 1.4 Pipeline de RAG y Embeddings

```
summaries.content_markdown → POST /ai/re-chunk → chunks (text + embedding 1536d + FTS)
                                                    ↓
                                              rag_hybrid_search()
                                              rag_coarse_to_fine_search()
                                                    ↓
                                              RAG chat, Smart generation
```

Los chunks tienen embeddings (pgvector) y FTS (tsvector). Las funciones RPC `rag_hybrid_search` y `rag_coarse_to_fine_search` buscan sobre la tabla `chunks`.

### 1.5 Flujo de Datos del StudentSummaryReader

```
StudentSummaryReader
  ├── useSummaryReaderQueries(summaryId)
  │     ├── Query 1: getChunks(summaryId) → chunks[]
  │     ├── Query 2: getKeywords(summaryId) → keywords[] (filtrado is_active)
  │     ├── Query 3: getTextAnnotations(summaryId) → annotations[]
  │     └── Query 4: getSummaryBlocks(summaryId) → hasBlocks (boolean)
  │
  ├── Header Card (título, fecha, tiempo lectura, mark read → XP)
  ├── Paginated content preview (content_markdown con KeywordHighlighterInline)
  │
  └── Tabs
        ├── "Contenido" → ReaderChunksTab
        │     ├── SI hasBlocks → SummaryViewer → ViewerBlock (por bloque)
        │     └── SI NO → chunks con KeywordHighlighterInline (fallback)
        ├── "Keywords" → ReaderKeywordsTab → InlineKeywordPopover → KeywordPopup
        │     ├── KeywordDefinitionSection
        │     ├── KeywordConnectionsSection
        │     └── KeywordActionsSection (AI explain, flashcard count, quiz count)
        ├── "Videos" → VideoPlayer (Mux)
        └── "Mis Notas" → ReaderAnnotationsTab
```

**Punto de integración crítico (ReaderChunksTab.tsx, líneas 69-70):**
```tsx
{!blocksLoading && hasBlocks ? (
  <SummaryViewer summaryId={summaryId} />
) : (
  // fallback: renderiza chunks
)}
```
El switch ya existe — si hay bloques en `summary_blocks`, automáticamente usa `SummaryViewer`.

---

## 2. Análisis de Impacto Transversal

### 2.1 Sistemas que NO requieren cambios

| Sistema | Por qué no cambia |
|---------|-------------------|
| **KeywordHighlighterInline** | Funciona por regex sobre DOM renderizado. Busca `keyword.name` en el texto visible con TreeWalker. No le importa de dónde viene el HTML. |
| **InlineKeywordPopover** | Se activa por click en spans `.axon-kw-highlight`. Posicionado con @floating-ui. Independiente del tipo de bloque. |
| **KeywordPopup** | Opera por `keyword_id`. Secciones: definición, subtemas, conexiones, AI explain. Cero relación con bloques. |
| **KeywordActionsSection** | AI explain via `POST /ai/explain`. Flashcard/quiz counts por keyword. Independiente. |
| **Reading state + XP** | `useSummaryReaderMutations` opera a nivel de `summary_id`. Mark read, annotations CRUD, kw notes CRUD. |
| **Videos tab** | Vinculados a `summary_id` via `useVideoListQuery`. |
| **Annotations tab** | `TextAnnotation` CRUD por `summary_id`. |
| **Quiz/Flashcard generation** | `POST /ai/generate` ya acepta `block_id` como parámetro opcional. |
| **RAG chat** | **Con Opción A**: busca sobre `chunks` que se generan de `content_markdown`. Seguirá funcionando si generamos `content_markdown`. |
| **Smart generation** | Idem RAG — usa chunks como contexto. |
| **Embedding coverage** | `rag_embedding_coverage()` opera sobre `chunks`. |

### 2.2 Sistemas que SÍ requieren cambios

| Sistema | Cambio | Complejidad |
|---------|--------|-------------|
| **`summary_blocks` BD** | Migración SQL: agregar columnas + cambiar content a jsonb | Baja |
| **`SummaryBlock` interface** | Ampliar union type con 10 tipos educativos | Baja |
| **`ViewerBlock.tsx`** | Agregar 10 case nuevos en el switch (o crear `EducationalBlockRenderer`) | Media |
| **`SummaryViewer.tsx`** | Envolver bloques con `KeywordHighlighterInline` para que el highlighting funcione | Baja |
| **`content_markdown` generation** | Al insertar bloques, concatenar texto plano → `summaries.content_markdown` | Baja |
| **Chunking post-insert** | Llamar `POST /ai/re-chunk` después de actualizar `content_markdown` | Baja |

### 2.3 Decisión: Keywords `{{keyword}}` vs Regex automático

**No se necesita cambio transversal.** Nuestro JSON usa `{{keyword}}` para marcar keywords en el contenido durante la generación. Pero el `KeywordHighlighterInline` funciona por regex del DOM:

```
1. Fetch keywords del summary → ["Aterosclerosis", "LDL oxidado", "Macrófagos"]
2. Build regex: /(Aterosclerosis|LDL oxidado|Macrófagos)/gi
3. TreeWalker recorre texto visible del DOM renderizado
4. Wraps matches en <span class="axon-kw-highlight">
```

El renderer de bloques simplemente renderiza el texto sin `{{}}`. El highlighter decora automáticamente. Flujo:

```
JSON block: { content: "La {{aterosclerosis}} es una enfermedad..." }
                      ↓ renderer quita {{}}
HTML rendered: "La aterosclerosis es una enfermedad..."
                      ↓ KeywordHighlighterInline
DOM final: "La <span class="axon-kw-highlight">aterosclerosis</span> es..."
```

### 2.4 Decisión: Embeddings — Opción A (content_markdown como texto plano)

Al crear un resumen con bloques:
1. INSERT bloques en `summary_blocks`
2. Concatenar texto plano de todos los bloques → UPDATE `summaries.content_markdown`
3. Llamar `POST /ai/re-chunk` → genera chunks con embeddings automáticamente
4. RAG, smart generation, FTS — todo sigue funcionando sin cambios

---

## 3. Migración SQL

### 3.1 Migración de `summary_blocks`

```sql
-- Migración: summary_blocks para sistema de bloques educativos
-- Fecha: 2026-03-23

-- 1. Cambiar content de TEXT a JSONB
-- (la tabla tiene 0 filas, no hay datos que migrar)
ALTER TABLE summary_blocks
  ALTER COLUMN content SET DEFAULT '{}'::jsonb,
  ALTER COLUMN content TYPE jsonb USING content::jsonb;

-- 2. Agregar columnas que el frontend espera
ALTER TABLE summary_blocks
  ADD COLUMN IF NOT EXISTS position_x integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS position_y integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS width integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS height integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS style jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Índice para queries ordenadas por summary
CREATE INDEX IF NOT EXISTS idx_summary_blocks_summary_order
  ON summary_blocks (summary_id, order_index);

-- 4. Trigger para updated_at automático
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

### 3.2 No se necesita migración de `keywords`

Los keywords ya tienen todo lo necesario: `name`, `definition`, `priority`, `clinical_priority`, `is_foundation`, `prerequisite_keyword_ids`. Se vinculan a `summary_id` (no a bloques individuales), lo cual es correcto — el `KeywordHighlighterInline` los busca a nivel de summary.

### 3.3 No se necesita migración de `chunks`

Los chunks se auto-generan via `POST /ai/re-chunk`. Tienen `embedding` (vector 1536d) y `fts` (tsvector). No necesitan cambios.

---

## 4. Cambios en Frontend

### 4.1 `SummaryBlock` interface — ampliar types

**Archivo:** `src/app/services/summariesApi.ts` línea 90

```typescript
export interface SummaryBlock {
  id: string;
  summary_id: string;
  type:
    // Tipos CMS existentes (retrocompatibilidad)
    | 'text' | 'heading' | 'image' | 'video' | 'pdf' | 'callout' | 'divider' | 'keyword-ref'
    // Tipos educativos nuevos
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
```

**Nota:** Usamos `callout_edu` para el callout educativo (5 variantes: tip, warning, clinical, mnemonic, exam) para no colisionar con el `callout` CMS existente. Alternativa: unificarlos.

### 4.2 `ViewerBlock.tsx` — agregar renderers educativos

**Archivo:** `src/app/components/student/ViewerBlock.tsx`

Agregar 10 nuevos `case` en el switch. El código de cada renderer ya existe en `Prototipo_Resumenes_Axon_v2.jsx` — la conversión a TypeScript + Tailwind es directa.

Nuevos cases a agregar:
```
case 'prose':            → ProseBlock (título + contenido con keywords)
case 'key_point':        → KeyPointBlock (fondo oscuro, ícono Zap, badge importancia)
case 'stages':           → StagesBlock (timeline vertical con severidad por etapa)
case 'comparison':       → ComparisonBlock (tabla con headers, highlight_column)
case 'list_detail':      → ListDetailBlock (ícono + label + detail + severity)
case 'grid':             → GridBlock (N columnas de cards con ícono)
case 'two_column':       → TwoColumnBlock (2 columnas con contenido mixto)
case 'callout_edu':      → CalloutEduBlock (5 variantes: tip/warning/clinical/mnemonic/exam)
case 'image_reference':  → ImageReferenceBlock (placeholder + caption + botón generar)
case 'section_divider':  → SectionDividerBlock (línea decorativa opcional)
```

### 4.3 `SummaryViewer.tsx` — envolver en KeywordHighlighterInline

**Archivo:** `src/app/components/student/SummaryViewer.tsx`

El `SummaryViewer` actual renderiza `ViewerBlock` por cada bloque pero **no envuelve en `KeywordHighlighterInline`**. Esto significa que los bloques educativos NO tendrían keywords resaltados automáticamente.

**Cambio necesario:** Envolver el contenedor de bloques en `<KeywordHighlighterInline summaryId={summaryId}>`:

```tsx
<KeywordHighlighterInline summaryId={summaryId} onNavigateKeyword={...}>
  <div ref={containerRef}>
    {blocks.map(block => (
      <ViewerBlock key={block.id} block={block} ... />
    ))}
  </div>
</KeywordHighlighterInline>
```

El TreeWalker del highlighter recorrerá el texto renderizado de todos los bloques y decorará los keywords automáticamente.

### 4.4 Archivos que NO se tocan

```
ReaderChunksTab.tsx       — el switch hasBlocks ya existe
StudentSummaryReader.tsx  — no cambia, delega a ReaderChunksTab
ReaderKeywordsTab.tsx     — independiente
ReaderAnnotationsTab.tsx  — independiente
KeywordHighlighterInline  — funciona por regex, sin cambios
InlineKeywordPopover      — floating-ui, sin cambios
KeywordPopup              — hub de keyword, sin cambios
KeywordActionsSection     — AI explain, sin cambios
useSummaryReaderQueries   — ya fetcha blocks, sin cambios
useSummaryBlocksQuery     — ya fetcha blocks, sin cambios
summariesApi.ts           — getSummaryBlocks() ya existe y funciona
```

---

## 5. Pipeline de Inserción (desde Cowork)

### 5.1 Flujo completo para crear un resumen

```
1. INPUT: Petrick proporciona PDF o material en Cowork

2. RAZONAMIENTO (Claude en Cowork):
   - Analiza el material
   - Decide tipos de bloque según contenido (siguiendo WORKFLOW_RESUMENES_AXON.md)
   - Genera JSON estructurado con bloques + keywords

3. INSERT en Supabase (via MCP SQL):

   a) Verificar topic_id existente:
      SELECT id, name FROM topics WHERE ...;

   b) Crear summary:
      INSERT INTO summaries (topic_id, title, content_markdown, status)
      VALUES ($topic_id, $title, $plain_text, 'draft')
      RETURNING id;

   c) Insertar bloques (N inserts):
      INSERT INTO summary_blocks (summary_id, type, content, order_index)
      VALUES ($summary_id, 'prose', '{"title":"...","content":"..."}', 0);
      -- repetir por cada bloque

   d) Insertar keywords:
      INSERT INTO keywords (summary_id, name, definition, priority, clinical_priority, is_foundation, created_by)
      VALUES ($summary_id, 'Aterosclerosis', 'Enfermedad inflamatoria...', 2, 0.8, true, $user_id);
      -- repetir por cada keyword

   e) Generar chunks + embeddings (via API, no SQL directo):
      POST /ai/re-chunk { summary_id, institution_id }
      POST /ai/ingest-embeddings { institution_id, summary_id }

4. VERIFICACIÓN:
   - SELECT count(*) FROM summary_blocks WHERE summary_id = $id;
   - El frontend debería mostrar bloques automáticamente (hasBlocks = true)
```

### 5.2 Formato JSON de un bloque (ejemplo)

```json
{
  "type": "stages",
  "content": {
    "title": "Patogénesis — Etapas de Formación de la Placa",
    "items": [
      {
        "stage": 1,
        "title": "Disfunción endotelial",
        "content": "El endotelio sufre daño por factores como hipertensión, tabaco, hiperglucemia o LDL elevado.",
        "severity": "mild"
      },
      {
        "stage": 2,
        "title": "Infiltración de LDL",
        "content": "El LDL penetra al subendotelio y sufre oxidación.",
        "severity": "mild"
      }
    ]
  },
  "order_index": 2
}
```

### 5.3 Generación de content_markdown (Opción A)

Después de insertar bloques, generar texto plano concatenado:

```
Para cada bloque en orden:
  - prose: título + "\n\n" + contenido
  - key_point: "CONCEPTO CLAVE: " + título + "\n" + contenido
  - stages: título + "\n" + items.map(i => "Etapa N: título — contenido").join("\n")
  - comparison: título + "\n" + headers.join(" | ") + "\n" + rows (tab-separated)
  - list_detail: título + "\n" + intro + "\n" + items.map(i => "• label: detail").join("\n")
  - callout: "[VARIANTE] título: contenido"
  - grid: título + "\n" + items.map(i => "• label: detail").join("\n")
  - two_column: columnas concatenadas
  - image_reference: "[Imagen: caption]"
  - section_divider: "---"

Concatenar todo con "\n\n" entre bloques → UPDATE summaries.content_markdown
```

---

## 6. Plan de Ejecución por Fases

### Fase 1 — BD (Cowork, ~15 min)
- [ ] Correr migración SQL de `summary_blocks` via MCP Supabase
- [ ] Verificar schema resultante
- [ ] Insertar un resumen de prueba con 3-4 bloques
- [ ] Verificar que `getSummaryBlocks()` retorna los datos correctamente

### Fase 2 — Frontend (Claude Code CLI, ~2-3 horas)
**Branch:** `feat/block-based-summaries`
**Archivos a modificar:**
```
src/app/services/summariesApi.ts            — ampliar SummaryBlock type
src/app/components/student/ViewerBlock.tsx   — agregar 10 renderers educativos
src/app/components/student/SummaryViewer.tsx — envolver en KeywordHighlighterInline
```
**Archivos nuevos (opcionales):**
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
**Fuente del código:** `Prototipo_Resumenes_Axon_v2.jsx` — los renderers están escritos, solo falta convertir:
- JSX inline styles → Tailwind classes
- `T.darkTeal` → `text-teal-900` / design tokens de Axon
- `T.tealAccent` → `text-teal-600`
- Props tipadas en TypeScript

### Fase 3 — Primer Resumen Real (Cowork, ~30 min)
- [ ] Elegir un tema médico real (ej: Farmacoepidemiología, Aterosclerosis)
- [ ] Generar JSON completo con bloques + keywords
- [ ] INSERT en Supabase via MCP
- [ ] Generar content_markdown y actualizar summary
- [ ] Correr re-chunk + embeddings
- [ ] Testear en el frontend: ¿se ven los bloques? ¿keywords resaltados? ¿RAG funciona?

### Fase 4 — Iteración (Cowork + CLI, ongoing)
- [ ] Dark mode para bloques educativos (llevar CSS del prototipo a Tailwind)
- [ ] Agregar ResumenMap (outline sidebar) como componente opcional
- [ ] Mastery per-block (colores de borde por nivel de dominio del alumno)
- [ ] Quiz por bloque (el botón, el backend ya acepta block_id)
- [ ] Más resúmenes: cada PDF que Petrick proporcione → pipeline automático

---

## 7. Dependencias y Riesgos

### 7.1 Dependencias

| Dependencia | Estado | Bloquea |
|-------------|--------|---------|
| Supabase MCP conectado | ✅ Funciona | Fase 1 |
| Frontend repo accesible | ✅ GitHub OK | Fase 2 |
| Backend CRUD factory para summary-blocks | ✅ Ya existe | Fase 1 |
| `getSummaryBlocks()` API | ✅ Ya existe | Fase 2 |
| `useSummaryBlocksQuery` hook | ✅ Ya existe | Fase 2 |
| `hasBlocks` switch en ReaderChunksTab | ✅ Ya existe | Fase 2 |
| Design tokens de Axon (`colors.ts`, `typography.ts`) | ✅ En repo | Fase 2 |
| Prototipo v2 con renderers | ✅ JSX listo | Fase 2 |
| `POST /ai/re-chunk` endpoint | ✅ Ya existe | Fase 3 |
| `POST /ai/ingest-embeddings` endpoint | ✅ Ya existe | Fase 3 |
| `KeywordHighlighterInline` compatible | ✅ Regex sobre DOM | Fase 2 |

### 7.2 Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| `content::jsonb` falla si hay texto no-JSON en content | Nula | — | La tabla tiene 0 filas, no hay datos |
| `ViewerBlock` switch no reconoce tipos nuevos | Baja | Media | Default case ya retorna null para tipos desconocidos |
| Tailwind v4 no tiene las clases del prototipo | Baja | Baja | El prototipo usa inline styles, se convierten a Tailwind utilities |
| Keywords no se resaltan en bloques | Baja | Alta | Mitigado envolviendo SummaryViewer en KeywordHighlighterInline |
| Chunks/embeddings no se generan post-insert | Media | Alta | Llamar re-chunk + ingest-embeddings explícitamente en Fase 3 |
| ProfessorSummaryDetailView espera bloques | Baja | Baja | Ya tiene `hasBlocks` check (línea 141), no crashea |

---

## 8. Anexos

### Anexo A — Schema de bloques educativos (resumen)

| Tipo | content fields | Ejemplo |
|------|---------------|---------|
| `prose` | `title`, `content` (texto con keywords) | Párrafo introductorio |
| `key_point` | `title`, `content`, `importance` (critical/high/normal) | Concepto central |
| `stages` | `title`, `items[]` { stage, title, content, severity } | Patogénesis paso a paso |
| `comparison` | `title`, `headers[]`, `rows[][]`, `highlight_column` | Diagnóstico diferencial |
| `list_detail` | `title`, `intro`, `items[]` { label, detail, icon, severity } | Factores de riesgo |
| `grid` | `title`, `columns` (int), `items[]` { label, detail, icon } | Territorios vasculares |
| `two_column` | `columns[]` { title, content_type, items[] } | Modificables vs no-modificables |
| `callout_edu` | `variant` (tip/warning/clinical/mnemonic/exam), `title`, `content` | Correlación clínica |
| `image_reference` | `description`, `caption`, `image_url` (nullable) | Diagrama de placa |
| `section_divider` | `label` (opcional) | Separador temático |

### Anexo B — Mapeo de iconos (Lucide React)

Los bloques usan nombres de íconos Lucide como strings en el JSON:
```
Activity, Heart, Pill, Stethoscope, Shield, FlaskConical, Clock,
Lightbulb, Target, AlertCircle, Brain, Info, AlertTriangle,
HelpCircle, CheckCircle2, BookOpen, Zap
```
El renderer necesita un map `string → Component`:
```typescript
const ICONS: Record<string, LucideIcon> = {
  Activity, Heart, Pill, Stethoscope, Shield, FlaskConical, Clock, ...
};
```
Esto ya existe en `Prototipo_Resumenes_Axon_v2.jsx` línea 287.

### Anexo C — Archivos del frontend que se tocan vs no se tocan

**SE MODIFICAN (3 archivos):**
```
summariesApi.ts            — 1 cambio: ampliar union type de SummaryBlock
ViewerBlock.tsx            — agregar switch cases (o importar sub-componentes)
SummaryViewer.tsx          — envolver en KeywordHighlighterInline
```

**SE CREAN (11 archivos, opcionales — pueden ir inline en ViewerBlock):**
```
blocks/ProseBlock.tsx
blocks/KeyPointBlock.tsx
blocks/StagesBlock.tsx
blocks/ComparisonBlock.tsx
blocks/ListDetailBlock.tsx
blocks/GridBlock.tsx
blocks/TwoColumnBlock.tsx
blocks/CalloutEduBlock.tsx
blocks/ImageReferenceBlock.tsx
blocks/SectionDividerBlock.tsx
blocks/index.ts
```

**NO SE TOCAN (21+ archivos):**
```
StudentSummaryReader.tsx, ReaderChunksTab.tsx, ReaderHeader.tsx,
ReaderKeywordsTab.tsx, ReaderAnnotationsTab.tsx,
KeywordHighlighterInline.tsx, InlineKeywordPopover.tsx,
KeywordPopup.tsx, KeywordDefinitionSection.tsx,
KeywordConnectionsSection.tsx, KeywordActionsSection.tsx,
KeywordHighlighterInline.tsx, KeywordBadges.tsx, KeywordMasterySection.tsx,
ChunkRenderer.tsx, SummaryHeader.tsx,
useSummaryReaderQueries.ts, useSummaryReaderMutations.ts,
useSummaryBlocksQuery.ts, summary-content-helpers.tsx,
studentSummariesApi.ts, as-ingest.ts, as-chat.ts, as-generate.ts
```

### Anexo D — Instrucciones para Claude Code CLI (Fase 2)

```
Branch: feat/block-based-summaries
Base: main (git pull origin main primero)

Tarea: Integrar sistema de bloques educativos al renderer de resúmenes.

Archivos a modificar:
1. src/app/services/summariesApi.ts
   - Línea 93: ampliar union type de SummaryBlock.type con:
     'prose' | 'key_point' | 'stages' | 'comparison' | 'list_detail' |
     'grid' | 'two_column' | 'callout_edu' | 'image_reference' | 'section_divider'
   - Agregar campos opcionales: style?: Record<string,any>, metadata?: Record<string,any>

2. src/app/components/student/ViewerBlock.tsx
   - Agregar 10 nuevos case al switch para tipos educativos
   - Importar sub-componentes de ./blocks/
   - Mantener retrocompatibilidad con los 8 types existentes

3. src/app/components/student/SummaryViewer.tsx
   - Envolver el contenedor de bloques en <KeywordHighlighterInline>
   - Import: KeywordHighlighterInline from './KeywordHighlighterInline'

Archivos a crear:
   src/app/components/student/blocks/*.tsx (10 renderers + index.ts)
   Fuente: convertir de /AXON PROJECTO/Prototipo_Resumenes_Axon_v2.jsx
   Convertir: inline styles → Tailwind v4, JSX → TypeScript, tokens → colors.ts

Design system obligatorio (src/app/design-system/):
   - Headings: Georgia serif
   - Body: Inter
   - Primary: teal scale
   - Mastery: gray/red/yellow/green/blue
   - PROHIBIDO: glassmorphism, gradients on buttons, blue/violet primary

NO tocar: StudentSummaryReader, ReaderChunksTab, KeywordHighlighterInline,
           KeywordPopup, ni ningún archivo de RAG/embeddings/chunks.

Validación: npm run build debe pasar sin errores.
```

### Anexo E — SQL de verificación post-migración

```sql
-- Verificar schema actualizado
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'summary_blocks' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar índice
SELECT indexname FROM pg_indexes WHERE tablename = 'summary_blocks';

-- Verificar trigger
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'summary_blocks';

-- Test insert de un bloque
INSERT INTO summary_blocks (summary_id, type, content, order_index)
VALUES (
  (SELECT id FROM summaries LIMIT 1),
  'key_point',
  '{"title":"Test Key Point","content":"This is a test","importance":"critical"}'::jsonb,
  0
) RETURNING id, type, content;

-- Cleanup test
-- DELETE FROM summary_blocks WHERE type = 'key_point' AND content->>'title' = 'Test Key Point';
```
