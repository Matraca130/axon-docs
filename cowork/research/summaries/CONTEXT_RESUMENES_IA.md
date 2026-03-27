# CONTEXT: Sistema de Resúmenes con IA — Índice Maestro

> **Propósito:** Archivo de contexto para cualquier sesión de trabajo en el sistema de resúmenes.
> Lee este archivo PRIMERO antes de hacer cualquier cambio.
> Última actualización: 2026-03-20

---

## Documentos de Este Proyecto (docs/)

| Archivo | Qué contiene | Para qué sirve |
|---------|-------------|-----------------|
| `docs/Mapa_Dependencias_Resumenes_IA.docx` | Mapa completo: qué EXISTE, qué EXTENDER, qué es NUEVO | **Documento principal** — consultar antes de implementar |
| `docs/Roadmap_v2_Sistema_Resumenes_Axon.docx` | 4 fases de implementación (~6-9 semanas) | Planificación de sprints |
| `docs/resumen-block-schema.json` | Schema JSON de 10 tipos de bloque flexibles | Referencia para IA y renderers |
| `docs/resumen-schema-ejemplo.json` | Ejemplo: aterosclerosis con keywords y bloques | Ejemplo concreto del schema |
| `docs/Resumen_Aterosclerosis_Completo.html` | Resumen completo ~12K palabras, estética Axon | Referencia visual del output final |
| `docs/Resumen_DragDrop_Preview.html` | Prototipo: botón + entre bloques, drag & drop | Preview de UX del editor |
| `docs/Resumen_ImageLayout_Preview.html` | 4 layouts de imagen + adaptación IA | Preview de sistema de imágenes |
| `docs/Resumen_Aterosclerosis_Preview.html` | Versión compacta con keywords y cards | Preview rápido |
| `docs/Roadmap_Sistema_Resumenes_Axon.docx` | Roadmap v1 OBSOLETO (7 fases, antes de auditoría) | Solo referencia histórica |
| `docs/CONTEXT_RESUMENES_IA.md` | **ESTE ARCHIVO** — índice maestro | Punto de entrada |

---

## Documentos de Ideas (docs/ — brainstorming previo)

| Archivo | Contenido clave |
|---------|----------------|
| `docs/ideas-ia-seeki.md` | 11 ideas de integración IA: tutoring, diagnostics, knowledge graph |
| `docs/ideas-pdf-sesion-resumen.md` | 11 ideas PDF: session export, mindmap, certificates, OCR→flashcards |
| `docs/ideas-visuales-sesion-resumen.md` | UX research: componentes UI disponibles, data sources, pantallas existentes |
| `docs/RECOPILADO-IDEAS-SEEKI.md` | Consolidación de 4 equipos de agentes: calendario, PDF, visual, IA |
| `docs/DIAGNOSTICO-QA-UIUX-2026-03-18.md` | Diagnóstico de QA y UI/UX de la plataforma |

---

## Documentación de Plataforma (axon-docs/)

### Contexto General
| Archivo | Para qué |
|---------|----------|
| `axon-docs/PLATFORM-CONTEXT.md` | **Visión general completa** — v4.5, 50+ tablas, 53 migraciones, stack, roles |
| `axon-docs/context/01-architecture.md` | Arquitectura técnica: request flow, módulos, CRUD factory |
| `axon-docs/context/02-data-hierarchy.md` | Modelo de datos: Institution→Course→...→Summary→Keywords→Subtopics |
| `axon-docs/context/03-auth-and-roles.md` | Dual-token auth, 4 roles (owner/admin/professor/student) |
| `axon-docs/context/04-api-conventions.md` | Convenciones de API: flat routes, query params, soft-delete |
| `axon-docs/context/05-current-status.md` | Status actual: 350 componentes, BUG-030 (rutas no wired) |
| `axon-docs/context/RAG_PHASES.md` | 8 fases RAG completas, Fase 7 (PDF) en progreso |

### Base de Datos
| Archivo | Tablas que documenta |
|---------|---------------------|
| `axon-docs/database/schema-content.md` | summaries, chunks, keywords, subtopics, keyword_connections, videos |
| `axon-docs/database/schema-study.md` | flashcards, quizzes, quiz_questions, fsrs_states, bkt_states, reviews |
| `axon-docs/database/schema-3d-ai.md` | models_3d, ai_generations, summary_diagnostics |
| `axon-docs/database/schema-core.md` | institutions, memberships, user_profiles |
| `axon-docs/database/schema-auth.md` | Auth tables |
| `axon-docs/database/rls-and-indexes.md` | RLS policies, índices, seguridad |
| `axon-docs/database/constraints.md` | CHECK constraints, FKs |

### Frontend
| Archivo | Contenido |
|---------|-----------|
| `axon-docs/frontend/platform-api-map.md` | 200+ endpoints mapeados frontend↔backend (audit pass 12) |
| `axon-docs/frontend/build-errors.md` | Errores de build conocidos |
| `axon-docs/frontend/bundle-optimization.md` | Optimización de bundle |

### Backend
| Archivo | Contenido |
|---------|-----------|
| `axon-backend/docs/AGENT_INDEX.md` | Índice de navegación del backend, patrones, errores comunes |
| `axon-backend/docs/AI_PIPELINE.md` | Pipeline IA completo: Gemini + OpenAI, 13 rutas, RPCs, rate limits |
| `axon-backend/docs/BACKEND_MAP.md` | Mapa de archivos del backend |

---

## Archivos de Código Clave (Frontend)

### Editor TipTap (YA EXISTE — extender)
```
numero1_sseki_2325_55/src/app/components/tiptap/
├── TipTapEditor.tsx          # Editor completo con auto-save, status toggle
├── TipTapToolbar.tsx          # Toolbar: formatting, headings, lists, alignment, image, undo/redo
├── ImageUploadDialog.tsx      # Upload: file picker + drag&drop + preview + Supabase
└── extensions/
    ├── ImageWithPosition.ts   # Custom node: left/center/right (agregar full-width)
    └── KeywordHighlightPlugin.ts  # ProseMirror: case-insensitive matching, decorations
```

### Keywords (YA EXISTE — completo)
```
numero1_sseki_2325_55/src/app/components/
├── student/InlineKeywordPopover.tsx    # Portal @floating-ui, mastery, definición
├── professor/KeywordClickPopover.tsx   # Crear keyword desde selección de texto
└── ...
numero1_sseki_2325_55/src/app/lib/
├── keyword-scroll-helpers.ts           # scrollFlashAndAutoOpen(), dual-path
└── summary-content-helpers.tsx         # enrichHtmlWithImages()
```

### Summaries (YA EXISTE — extender)
```
numero1_sseki_2325_55/src/app/components/summary/
├── ChunkRenderer.tsx      # Renderiza chunks con HTML/text, animaciones
└── SummaryHeader.tsx      # Breadcrumb, status badges, reading time

numero1_sseki_2325_55/src/app/components/student/
└── ViewerBlock.tsx        # Renderiza 8 tipos de bloque (agregar 5 nuevos)
```

### Servicios de IA (YA EXISTE — extender)
```
numero1_sseki_2325_55/src/app/services/ai-service/
├── as-chat.ts             # RAG chat + SSE streaming (chatStream, chatSync)
├── as-generate.ts         # generateFlashcard(), generateQuizQuestion()
├── as-generate-smart.ts   # generateSmart(), preGenerate(), NeedScore/BKT
├── as-ingest.ts           # ingestPdf(), ingestEmbeddings(), reChunk()
└── as-types.ts            # SmartTargetMeta, ContentMeta, interfaces
```

### APIs de Datos (YA EXISTE)
```
numero1_sseki_2325_55/src/app/services/
├── summariesApi.ts            # CRUD summaries + getSummaryBlocks()
├── studentSummariesApi.ts     # ReadingState, TextAnnotation, KwStudentNote
├── flashcardApi.ts            # CRUD flashcards + getByTopic (batch)
├── quizQuestionsApi.ts        # CRUD quiz questions
├── quizzesEntityApi.ts        # CRUD quizzes (contenedores)
├── quizAttemptsApi.ts         # Quiz attempts
├── keywordConnectionsApi.ts   # Conexiones bidireccionales (10 tipos médicos)
├── keywordMasteryApi.ts       # BKT aggregation, MASTERY_THRESHOLD=0.75
├── studySessionApi.ts         # Sessions, reviews, batch
├── bktApi.ts                  # BKT states per subtopic
└── ...
```

### Design System (REFERENCIA OBLIGATORIA)
```
numero1_sseki_2325_55/src/app/design-system/
├── colors.ts       # Primary teal scale, dark sidebar, surface, mastery levels
├── typography.ts   # Georgia headings, Inter body, Space Grotesk display
├── components.ts   # Card patterns, buttons, sidebar, KPI cards
├── brand.ts        # AXON branding
└── rules.ts        # Mandatory: Georgia headings, teal primary, pill buttons
                    # Forbidden: glassmorphism, gradients on buttons, blue/violet
```

---

## Archivos de Código Clave (Backend)

### AI Routes (YA EXISTE — extender)
```
axon-backend/supabase/functions/server/routes/ai/
├── generate.ts         # POST /ai/generate — flashcard/quiz (acepta block_id!)
├── generate-smart.ts   # POST /ai/generate-smart — NeedScore adaptive
├── pre-generate.ts     # POST /ai/pre-generate — bulk, 10/hr
├── chat.ts             # POST /ai/rag-chat — RAG con SSE streaming
├── ingest.ts           # POST /ai/ingest-embeddings — batch embeddings
├── ingest-pdf.ts       # POST /ai/ingest-pdf — Gemini PDF extraction
├── re-chunk.ts         # POST /ai/re-chunk — re-chunking manual
├── report.ts           # POST/PATCH /ai/report — quality reports
├── feedback.ts         # PATCH /ai/rag-feedback
├── analytics.ts        # GET /ai/rag-analytics, embedding-coverage
└── report-dashboard.ts # GET /ai/report-stats, reports
```

### Utilidades Compartidas (REUTILIZAR)
```
axon-backend/supabase/functions/server/
├── claude-ai.ts              # generateText(), generateTextStream(), parseClaudeJson()
├── openai-embeddings.ts      # generateEmbedding(), generateEmbeddings()
├── retrieval-strategies.ts   # selectStrategy(), multi-query, HyDE, rerank
├── prompt-sanitize.ts        # sanitizeForPrompt(), wrapXml()
├── db.ts                     # authenticate(), getAdminClient(), ok(), err()
├── auth-helpers.ts           # requireInstitutionRole(), CONTENT_WRITE_ROLES
├── validate.ts               # Type guards, validateFields()
└── crud-factory.ts           # Auto-genera 5 endpoints CRUD
```

### Content Routes (YA EXISTE)
```
axon-backend/supabase/functions/server/routes/content/
├── keyword-connections.ts  # GET/POST/DELETE connections (V2 con tipos)
├── keyword-search.ts       # GET /keyword-search (RPC ~5ms)
├── prof-notes.ts           # GET/POST /kw-prof-notes
├── reorder.ts              # PUT /reorder (genérico, soporta summary-blocks)
├── content-tree.ts         # GET /content-tree
└── flashcards-by-topic.ts  # GET /flashcards-by-topic (batch, N+1 eliminator)
```

---

## Endpoints NUEVOS a Construir

| Endpoint | Qué hace | Prioridad |
|----------|---------|-----------|
| `POST /ai/generate-summary` | Material → resumen JSON completo con bloques + keywords | ALTA |
| `POST /ai/transform-block` | Texto → tipo de bloque específico (lista, tabla, stages...) | ALTA |
| `POST /ai/extract-keywords` | Texto → keywords con definición + dificultad | ALTA |
| `POST /ai/regenerate-block` | Regenerar un bloque individual con contexto | MEDIA |
| `POST /ai/generate-block-quiz` | Quiz para bloques seleccionados | MEDIA |
| `POST /export/pdf` | HTML renderizado → PDF con estética Axon | MEDIA |

---

## Componentes Frontend NUEVOS a Construir

| Componente | Qué hace | Prioridad |
|-----------|---------|-----------|
| `BlockEditor` | Drag & drop de bloques, botón +, menú contextual | ALTA |
| `StagesBlock` | Renderer: línea de progresión con pasos numerados | ALTA |
| `ComparisonBlock` | Renderer: tabla comparativa editable | ALTA |
| `ListDetailBlock` | Renderer: ícono + label + descripción | ALTA |
| `GridBlock` / `TwoColumnBlock` | Renderer: layouts multi-columna | MEDIA |
| `AITransformMenu` | Menú contextual: texto → tipo de bloque vía IA | ALTA |
| `KeywordSuggestionPanel` | Panel de keywords sugeridos por IA | MEDIA |
| `BlockQuizGeneratorUI` | Botón por bloque para generar quiz | MEDIA |
| `MasteryColorWrapper` | Borde/fondo dinámico por mastery del alumno | MEDIA |
| `ImageResizeHandles` | Esquinas arrastrables para redimensionar | BAJA |
| `PDFExportButton` | Trigger de exportación con preview | MEDIA |

---

## Migraciones de BD Necesarias

| Migración | Detalle |
|-----------|---------|
| `summary_blocks.content → JSONB` | Migrar de TEXT a JSONB para bloques estructurados |
| `summary_blocks + style JSONB` | Campo para colores dinámicos de mastery |
| `summary_blocks + metadata JSONB` | Datos auxiliares: image_url, position, caption |
| `summaries.status + 'review'` | Agregar 'review' al CHECK constraint |
| `keywords + difficulty_level` | Campo para dificultad asignada por IA |
| `block_templates (nueva tabla)` | Templates de estructura por tipo de bloque |

---

## Stack Técnico Relevante

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Frontend | React 18 + Vite 6 + Tailwind v4 + TS | Vercel |
| Backend | Hono + Deno (Edge Functions) | Supabase |
| DB | PostgreSQL + pgvector (1536d) | Supabase |
| Text Gen | Claude (sonnet default, opus/haiku) | claude-ai.ts |
| Embeddings | OpenAI text-embedding-3-large (1536d) | openai-embeddings.ts |
| PDF Extract | Gemini 2.5 Flash (multimodal) | ingest-pdf.ts |
| Editor | TipTap v2 + ProseMirror | Extensiones custom |
| Spaced Rep | FSRS v4 + BKT v4 | fsrs-v4.ts, bkt-v4.ts |
| Storage | Supabase Storage | Signed URLs |
| Video | Mux | JWT playback tokens |
| Payments | Stripe | Webhooks HMAC |

---

## HALLAZGOS CRÍTICOS de Auditoría Profunda (2026-03-20)

> Los 5 agentes paralelos descubrieron detalles que corrigen el mapa de dependencias.
> Leer esta sección ANTES de implementar cualquier cosa.

### DATO CLAVE 1: El TipTap actual es MONOLÍTICO, no de bloques

El editor TipTap (`TipTapEditor.tsx`, 862 líneas) guarda contenido como **HTML monolítico** en `content_markdown`. NO tiene concepto de bloques individuales. El profesor escribe en un documento continuo tipo Word. Para el sistema de resúmenes necesitamos un **editor de bloques** completamente nuevo — el TipTap existente sirve como editor DENTRO de cada bloque de tipo prose/text, pero la gestión de bloques (drag, insert, delete, reorder) es construcción nueva.

### DATO CLAVE 2: summary_blocks.content es TEXT, no JSONB

La tabla `summary_blocks` en la BD tiene `content TEXT NOT NULL DEFAULT ''`. El frontend espera `Record<string, any>` (JSONB). Hay un **mismatch** que requiere migración ANTES de empezar. Además, las columnas `position_x`, `position_y`, `width`, `height` que el frontend type define **NO EXISTEN** en la BD. La migración completa necesaria:

```sql
ALTER TABLE summary_blocks ALTER COLUMN content TYPE jsonb USING content::jsonb;
ALTER TABLE summary_blocks
  ADD COLUMN IF NOT EXISTS position_x integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS position_y integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS width integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS height integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS style jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
```

### DATO CLAVE 3: CRUD factory de summary-blocks no tiene soft-delete

Config actual del CRUD factory:
```
hasCreatedBy: false, hasUpdatedAt: false, softDelete: false (hard delete!)
createFields: [type, content, order_index, heading_text, heading_level, is_active]
```
Necesita actualizarse para incluir `position_x/y`, `width`, `height`, `style`, `metadata`, y habilitar `hasUpdatedAt: true`.

### DATO CLAVE 4: No hay librería de drag & drop instalada

`package.json` NO incluye dnd-kit, react-beautiful-dnd, ni sortable. Solo tiene `motion` (v12.23.24, reemplazo de framer-motion). Para el editor de bloques necesitamos instalar `@dnd-kit/core` + `@dnd-kit/sortable` o usar las APIs de drag de `motion`.

### DATO CLAVE 5: Frontend SummaryKeyword type NO expone clinical_priority ni is_foundation

La BD tiene `clinical_priority NUMERIC [0,1]` e `is_foundation BOOLEAN` (migración v4.2), y el CRUD factory los acepta en create/update. Pero el type `SummaryKeyword` del frontend NO los incluye y no hay UI para editarlos. Para el NeedScore y la dificultad de keywords, necesitamos actualizar el type y agregar UI.

### DATO CLAVE 6: block_id ya funciona en generación de quiz/flashcard

El endpoint `POST /ai/generate` ya acepta `block_id` como parámetro. Se pasa al prompt de Claude como contexto adicional (fetch del bloque desde summary_blocks). La infraestructura de backend para "generar quiz por bloque" ya está — solo falta el botón en el frontend.

### DATO CLAVE 7: Mastery tiene 5 niveles con colores definidos

Sistema delta-based completo:
- **gray** (#a1a1aa): Por descubrir — delta < 0.50
- **red** (#ef4444): Emergente — delta >= 0.50
- **yellow** (#f59e0b): En progreso — delta >= 0.85
- **green** (#10b981): Consolidado — delta >= 1.00
- **blue** (#3b82f6): Maestría — delta >= 1.10

Delta = displayMastery / dominationThreshold. Threshold varía por clinical_priority (0.70 a 0.90).

Archivos clave: `mastery-helpers.ts`, `colors.ts` (masteryLevels), `dk-tokens.ts` (Tailwind classes).

### DATO CLAVE 8: Keywords son summary-scoped, NO block-scoped

Los keywords se vinculan a `summary_id`, no a bloques individuales. El highlighting funciona por decoración ProseMirror sobre todo el texto del summary. Para colores de mastery por bloque, necesitamos mapear qué keywords aparecen en cada bloque (regex match o tabla nueva `keyword_block_mappings`).

### DATO CLAVE 9: SSE streaming pattern completo en chat

`claude-ai.ts` → `generateTextStream()` retorna ReadableStream. Frontend `as-chat.ts` → `chatStream()` con callbacks `onChunk/onSources/onDone`. Formato: `{ type: 'chunk'|'sources'|'done'|'error', ... }`. Para streaming de bloques de resumen, reutilizar este patrón pero enviando bloques JSON completos en vez de texto plano.

### DATO CLAVE 10: summaries.status actual = draft|published|rejected (falta 'review')

El CHECK constraint actual solo permite 3 valores. Para el flujo de publicación completo (draft→review→published) necesitamos una migración que agregue 'review'.

---

## Estado Real de la BD (summary_blocks) — Migración 20260228000002

```
summary_blocks:
  id              UUID PK DEFAULT gen_random_uuid()
  summary_id      UUID FK → summaries.id ON DELETE CASCADE
  type            TEXT NOT NULL DEFAULT 'paragraph'     ← ES TEXT, no enum
  content         TEXT NOT NULL DEFAULT ''               ← ES TEXT, no JSONB
  heading_text    TEXT NULL
  heading_level   SMALLINT NULL
  order_index     INTEGER NOT NULL DEFAULT 0
  is_active       BOOLEAN NOT NULL DEFAULT true
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  -- NO: updated_at, created_by, deleted_at, position_x/y, width, height, style, metadata
```

Índices: `idx_summary_blocks_summary_id`, `idx_summary_blocks_order (summary_id, order_index) WHERE is_active`

---

## Estado Real de Keywords — Con migración v4.2

```
keywords:
  id                       UUID PK
  summary_id               UUID FK → summaries.id
  name                     TEXT NOT NULL
  definition               TEXT NULL
  priority                 INTEGER NOT NULL           ← 0-3 (categorical)
  clinical_priority        NUMERIC NOT NULL DEFAULT 0 ← [0,1] float (NeedScore)
  is_foundation            BOOLEAN NOT NULL DEFAULT false
  prerequisite_keyword_ids UUID[] DEFAULT '{}'
  created_by               UUID FK → profiles.id
  is_active                BOOLEAN NOT NULL DEFAULT true
  created_at               TIMESTAMPTZ
  updated_at               TIMESTAMPTZ
  deleted_at               TIMESTAMPTZ NULL           ← soft-delete
  -- NO: difficulty_level (necesita migración)
```

---

## Archivos Adicionales Descubiertos (no estaban en el mapa original)

```
Frontend:
├── components/student/SummaryViewer.tsx    # Renderiza TODOS los bloques (absolute pos desktop, stack mobile)
├── components/student/KeywordMasterySection.tsx  # Post-quiz mastery badges por keyword
├── components/student/QuizResults.tsx      # Resultados de quiz con mastery
├── components/professor/KeywordFormDialog.tsx    # Dialog de creación/edición de keyword
├── components/content/flashcard/adaptive/AdaptiveKeywordPanel.tsx  # Panel keywords en sesión adaptativa
├── components/design-kit/dk-tokens.ts      # Tailwind class mappings para mastery colors
├── hooks/queries/useSummaryBlocksQuery.ts  # React Query hook para bloques
├── services/aiApi.ts                       # Wrapper unificado de AI (generate, smart, pre-gen)
├── services/flashcardMappingApi.ts         # Lightweight mapping {id, subtopic_id, keyword_id}
├── lib/mastery-helpers.ts                  # getDeltaColor, getMasteryLevel, thresholds
├── types/keywords.ts                       # Extended keyword types
├── types/keyword-connections.ts            # KeywordConnection interface

Backend:
├── routes/content/crud.ts                  # CRUD factory configs para TODOS los content types
├── lib/fsrs-v4.ts (8.7KB)                 # FSRS v4 completo
├── lib/bkt-v4.ts (4KB)                    # BKT v4 completo
```

---

## Reglas de Desarrollo (de CLAUDE.md)

1. NUNCA push a main — siempre feature branch + PR
2. Todos los agentes usan model: "opus"
3. 2+ agentes en mismo repo → isolation: "worktree"
4. Cada agente recibe lista EXPLÍCITA de archivos — cero overlap
5. Quality-gate audit después de cada agente que escribe código
6. Verificar antes de push: `git log --oneline main..<branch>`
7. Max 5 agentes Opus simultáneos (API 529 arriba de esto)
8. Design system: Georgia headings, Inter body, teal primary, white cards rounded-2xl
9. Auth: siempre dual-token (SUPABASE_ANON_KEY + X-Access-Token)
10. API: flat routes con query params, nunca nested
