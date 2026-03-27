# Integración Resúmenes Bloques → Axon Med

## Estado Actual (Auditoría)

### Lo que ya existe en Supabase (`xdnciktarvxyhkrokbng`)

**Jerarquía de contenido:**
```
courses (4) → semesters → sections (3) → topics (4) → summaries (11)
```

**Tablas relevantes y su estado:**

| Tabla | Filas | Estado |
|-------|-------|--------|
| `summaries` | 11 | Tienen `content_markdown` (texto plano del PDF) |
| `summary_blocks` | **0** | Existe pero vacía — schema básico: `type='paragraph'` |
| `keywords` | 14 | Tienen `name`, `definition`, FK a `summary_id` |
| `quiz_questions` | 13 | Tienen `question`, `options` (jsonb), `correct_answer` |
| `keyword_connections` | — | Links entre keywords (graph) |

**Pipeline de ingesta actual:**
1. Profesor sube PDF → `POST /ai/ingest-pdf`
2. Gemini extrae texto → se guarda como `content_markdown`
3. Hook `onSummaryWrite()` → `autoChunkAndEmbed()` → chunks + embeddings
4. El frontend muestra el markdown renderizado

### El Gap

La tabla `summary_blocks` tiene un schema de **markdown/párrafos**:
```sql
-- Schema actual (insuficiente)
summary_blocks (
  id uuid, summary_id uuid, type text DEFAULT 'paragraph',
  content text, heading_text text, heading_level smallint,
  order_index integer
)
```

Nuestro prototipo usa **10 tipos de bloques ricos** con datos estructurados:
```javascript
// Un bloque 'stages' tiene items con severity, un 'comparison' tiene headers y rows 2D
{ type: "stages", items: [{ stage: 1, title: "...", content: "...", severity: "critical" }] }
{ type: "comparison", headers: ["A","B"], rows: [["x","y"]], highlight_column: 1 }
```

---

## Estrategia de Integración

### Opción Elegida: `data` JSONB + Migración de Schema

Agregar una columna `data jsonb` a `summary_blocks` que contenga la estructura completa de cada bloque. Esto es el patrón más usado en Supabase/Postgres para contenido polimórfico.

### Migración necesaria

```sql
-- 1. Agregar columna JSONB para datos estructurados del bloque
ALTER TABLE summary_blocks
  ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}';

-- 2. Expandir los tipos válidos (actualmente solo 'paragraph')
-- No hay constraint, solo el default. Nuestros tipos:
-- prose, key_point, stages, comparison, list_detail,
-- grid, two_column, callout, image_reference, section_divider

-- 3. Agregar campo 'related' a keywords (para los tags del popover)
ALTER TABLE keywords
  ADD COLUMN IF NOT EXISTS related text[] DEFAULT '{}';

-- 4. Agregar block_id a quiz_questions (vincular quiz a bloque específico)
ALTER TABLE quiz_questions
  ADD COLUMN IF NOT EXISTS block_id uuid REFERENCES summary_blocks(id);

-- 5. Agregar campos de metadata al summary
ALTER TABLE summaries
  ADD COLUMN IF NOT EXISTS block_version text DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS professor_name text,
  ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'pending';
```

### Cómo se almacena cada tipo de bloque

```jsonc
// summary_blocks row para un bloque 'stages':
{
  "id": "uuid",
  "summary_id": "uuid-del-summary",
  "type": "stages",
  "heading_text": "Patogénesis de la Aterosclerosis",  // título del bloque
  "order_index": 3,
  "data": {
    "items": [
      { "stage": 1, "title": "Disfunción endotelial", "content": "...", "severity": "mild" },
      { "stage": 2, "title": "Estría grasa", "content": "...", "severity": "moderate" }
    ]
  }
}

// summary_blocks row para un bloque 'comparison':
{
  "type": "comparison",
  "heading_text": "Diagnóstico Diferencial",
  "data": {
    "headers": ["Criterio", "Angina Estable", "SCA"],
    "rows": [["Dolor", "Predecible", "En reposo"]],
    "highlight_column": 2
  }
}

// summary_blocks row para un bloque 'prose':
{
  "type": "prose",
  "heading_text": "Introducción",
  "content": "La {{aterosclerosis}} es una enfermedad...",
  "data": {
    "imageData": null,
    "imageSize": "md",
    "imagePos": "right"
  }
}

// summary_blocks row para un bloque 'callout':
{
  "type": "callout",
  "heading_text": "Manejo de Emergencia",
  "content": "Ante sospecha de SCA...",
  "data": {
    "variant": "clinical"  // clinical | exam | mnemonic
  }
}

// summary_blocks row para un bloque 'key_point':
{
  "type": "key_point",
  "heading_text": "Concepto Central",
  "content": "La aterosclerosis NO es depósito pasivo...",
  "data": {
    "importance": "critical"
  }
}
```

---

## Pipeline Automatizado desde Cowork

### Flujo completo: PDF → Resumen en Axon

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Petrick da  │────▶│  Claude razona   │────▶│  Genera JSON con  │
│  el PDF acá  │     │  bloques según   │     │  bloques+keywords │
│  en Cowork   │     │  WORKFLOW_AXON   │     │  +quiz_data       │
└─────────────┘     └──────────────────┘     └────────┬──────────┘
                                                       │
                           ┌───────────────────────────┘
                           ▼
              ┌─────────────────────────┐
              │  INSERT directo a       │
              │  Supabase via MCP:      │
              │  1. summaries           │
              │  2. summary_blocks (x N)│
              │  3. keywords (x N)      │
              │  4. quiz_questions (x N)│
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │  Frontend de Axon lee   │
              │  de la DB y renderiza   │
              │  con el motor de bloques│
              └─────────────────────────┘
```

### Paso a paso concreto

**Paso 1: Recibir contenido**
- Petrick sube PDF a Cowork o pega las imágenes/texto
- Claude extrae el contenido médico del material

**Paso 2: Razonar bloques (ya lo hacemos)**
- Seguir WORKFLOW_RESUMENES_AXON.md
- Fase 1: Lectura profunda → identificar conceptos
- Fase 2: Seleccionar bloques por naturaleza del contenido
- Fase 3: Generar keywords con definiciones y related terms
- Fase 4: Escribir contenido con {{keyword_id}} syntax

**Paso 3: Generar JSON estructurado**
```json
{
  "summary": {
    "title": "Farmacoepidemiología",
    "topic_id": "uuid-del-topic",
    "status": "draft",
    "professor_name": "Dra. Calvo",
    "block_version": "1.0"
  },
  "blocks": [
    { "type": "prose", "order_index": 0, "heading_text": "Introducción", "content": "...", "data": {} },
    { "type": "key_point", "order_index": 1, "heading_text": "...", "content": "...", "data": {"importance":"critical"} }
  ],
  "keywords": [
    { "name": "farmacoepidemiología", "definition": "...", "related": ["EBM","farmacovigilancia"], "priority": 1 }
  ],
  "quiz": [
    { "question": "...", "options": ["A","B","C","D"], "correct_answer": "B", "block_index": 0 }
  ]
}
```

**Paso 4: INSERT a Supabase (via MCP)**
```sql
-- 1. Crear summary
INSERT INTO summaries (topic_id, title, status, professor_name, block_version, created_by, institution_id)
VALUES (:topic_id, :title, 'draft', :prof, '1.0', :user_id, :inst_id)
RETURNING id;

-- 2. Insertar bloques
INSERT INTO summary_blocks (summary_id, type, heading_text, content, order_index, data)
VALUES
  (:sid, 'prose', 'Introducción', 'La {{farmacoepidemiologia}} es...', 0, '{}'),
  (:sid, 'key_point', 'Concepto Central', '...', 1, '{"importance":"critical"}'),
  ...;

-- 3. Insertar keywords
INSERT INTO keywords (summary_id, name, definition, related, created_by)
VALUES
  (:sid, 'farmacoepidemiología', 'Estudio del uso...', ARRAY['EBM','farmacovigilancia'], :user_id),
  ...;

-- 4. Insertar quiz questions
INSERT INTO quiz_questions (summary_id, block_id, question, options, correct_answer, question_type, source, created_by)
VALUES
  (:sid, :block_id, '¿Qué estudia...?', '["A","B","C","D"]', 'B', 'mcq', 'ai', :user_id),
  ...;
```

**Paso 5: Verificar**
- SELECT de vuelta para confirmar integridad
- Contar bloques, keywords, quiz questions

---

## Rendering en el Frontend de Axon

### Opción A: Componente React que consume la DB (Recomendado)

El frontend de Axon (React 18 + Vite 6 + Tailwind v4) necesita un componente `<SummaryViewer>` que:

1. Fetch: `GET /content/summaries/:id` → devuelve summary + blocks + keywords
2. Renderiza cada bloque según su `type` usando componentes React
3. Usa el mismo CSS/design system del prototipo HTML

```tsx
// Pseudo-código del componente principal
function SummaryViewer({ summaryId }) {
  const { summary, blocks, keywords } = useSummaryData(summaryId);

  return (
    <div className="document-wrapper">
      <SummaryHeader summary={summary} keywords={keywords} />
      {blocks.map(block => (
        <BlockRenderer key={block.id} block={block} keywords={keywords} />
      ))}
    </div>
  );
}

function BlockRenderer({ block, keywords }) {
  switch (block.type) {
    case 'prose':      return <ProseBlock block={block} keywords={keywords} />;
    case 'key_point':  return <KeyPointBlock block={block} keywords={keywords} />;
    case 'stages':     return <StagesBlock block={block} />;
    case 'comparison': return <ComparisonBlock block={block} />;
    // ... 10 tipos
  }
}
```

### Opción B: Renderizar HTML desde template (Más rápido de implementar)

Si el frontend de Axon aún no tiene el componente React listo, podemos:
1. Tener un template HTML "vacío" con todo el CSS + JS de rendering
2. Una Edge Function que inyecta los datos desde la DB en el template
3. Servir el HTML como iframe o página independiente

---

## Flujo de Trabajo Iterativo (Loop)

Para crear múltiples resúmenes de un mismo PDF con varios temas:

```
Petrick: "Acá está el PDF de Farmacología, tiene 5 temas"
   │
   ▼
Claude: Lee el PDF, identifica los 5 temas
   │
   ├── Tema 1: Farmacoepidemiología → genera JSON → INSERT
   ├── Tema 2: Farmacodinamia → genera JSON → INSERT
   ├── Tema 3: Farmacocinética → genera JSON → INSERT
   ├── Tema 4: Farmacovigilancia → genera JSON → INSERT
   └── Tema 5: Interacciones → genera JSON → INSERT
   │
   ▼
Claude: "Listo, 5 resúmenes insertados en Axon. ¿Querés que revise alguno?"
```

Cada iteración puede usar agentes en paralelo para ir más rápido.

---

## Próximos Pasos

1. **Correr la migración** — agregar `data jsonb` a `summary_blocks` + `related` a `keywords`
2. **Crear endpoint** — `GET /content/summaries/:id/full` que devuelva summary + blocks + keywords + quiz en una sola llamada
3. **Primer INSERT real** — tomar el JSON de Farmacoepidemiología que ya tenemos y insertarlo en Supabase
4. **Probar** — verificar que los datos se lean correctamente desde el frontend
5. **Iterar** — crear el resto de resúmenes del PDF de Farmacología
