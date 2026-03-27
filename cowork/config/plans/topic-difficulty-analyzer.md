# Plan: Auto-análisis de dificultad de topic al subir resumen

## Contexto

Cuando un profesor sube un resumen, `summary-hook.ts` ya dispara `autoChunkAndEmbed()` (chunking + embeddings). Queremos **agregar un paso más**: analizar el contenido para estimar la dificultad del topic padre, usando parámetros investigados y fundamentados en ciencia cognitiva.

## Parámetros de dificultad (research-backed)

La estimación combina **señales algorítmicas** (gratis, instantáneas) con **análisis de IA** (Gemini Flash, ~$0.001/call):

### Señales algorítmicas (computadas sin IA)
| Señal | Cómo se calcula | Por qué importa |
|---|---|---|
| `word_count` | Contar palabras del markdown | Más contenido = más tiempo de estudio |
| `keyword_count` | COUNT de keywords asociadas al topic | Más keywords = más conceptos a dominar |
| `keyword_density` | keywords / (word_count / 100) | Ratio de términos técnicos por 100 palabras |
| `tree_depth_position` | Posición ordinal en el content tree | Topics al final del semestre suelen depender de anteriores |
| `has_formulas` | Regex para detectar expresiones matemáticas/fórmulas | Fórmulas = carga cognitiva extra |
| `media_count` | Contar imágenes/tablas/diagramas en markdown | Contenido multimedia indica complejidad visual |

### Señales de IA (Gemini Flash, 1 llamada)
| Señal | Qué devuelve Gemini | Fundamento |
|---|---|---|
| `bloom_level` | 1-6 (Remember→Create) | Taxonomía de Bloom: niveles altos = más difícil |
| `abstraction_level` | 1-5 (concreto→abstracto) | Anatomía visible < mecanismos fisiológicos < farmacología molecular |
| `concept_density` | 1-5 (pocos→muchos conceptos por sección) | Mayor densidad conceptual = más carga cognitiva |
| `interrelation_score` | 1-5 | Cuánto depende de otros temas |
| `prerequisite_topics` | string[] (nombres de topics que deberían estudiarse antes) | Para ordenamiento inteligente en scheduling |
| `estimated_study_minutes` | integer | Tiempo realista de estudio para un estudiante promedio |

### Señales de cohorte (SQL aggregation, sin IA)
| Señal | Cómo se calcula | Cuándo se actualiza |
|---|---|---|
| `cohort_difficulty` | AVG de error_rate de todos los estudiantes que han estudiado este topic | Batch: cada vez que un estudiante completa review, o batch semanal |

### Fórmula final de difficulty_estimate

```
difficulty_estimate = (
  0.30 * normalize(bloom_level, 1, 6) +
  0.25 * normalize(abstraction_level, 1, 5) +
  0.20 * normalize(concept_density, 1, 5) +
  0.10 * normalize(keyword_density, 0, max) +
  0.10 * normalize(interrelation_score, 1, 5) +
  0.05 * has_formulas_bonus
)
```

Resultado: `0.0` (trivial) a `1.0` (muy difícil). Si hay `cohort_difficulty` disponible (estudiantes reales), se blendea: `0.6 * ai_estimate + 0.4 * cohort_difficulty`.

---

## Arquitectura

```
Professor saves summary (POST/PUT)
    ↓
summary-hook.ts (ya existe)
    ↓ fire-and-forget
autoChunkAndEmbed() ← ya existe, no se toca
    ↓ después de completar
analyzeTopicDifficulty() ← NUEVO
    ├─ Señales algorítmicas (word_count, keywords, etc.) ← SQL queries
    ├─ Señales de IA (Gemini Flash con prompt estructurado) ← 1 API call
    ├─ Señales de cohorte (AVG de error_rate) ← SQL query
    ↓ combina todo con fórmula
UPDATE topics SET difficulty_estimate, estimated_study_minutes,
                  prerequisite_topic_ids, bloom_level, ...
```

---

## Archivos a crear/modificar

### 1. Migración SQL: `20260321000001_topic_difficulty_metadata.sql`
Agrega columnas a tabla `topics`:

```sql
ALTER TABLE topics ADD COLUMN IF NOT EXISTS difficulty_estimate NUMERIC(3,2) DEFAULT NULL;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS estimated_study_minutes INTEGER DEFAULT NULL;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS bloom_level SMALLINT DEFAULT NULL;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS abstraction_level SMALLINT DEFAULT NULL;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS concept_density SMALLINT DEFAULT NULL;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS interrelation_score SMALLINT DEFAULT NULL;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS prerequisite_topic_ids UUID[] DEFAULT '{}';
ALTER TABLE topics ADD COLUMN IF NOT EXISTS cohort_difficulty NUMERIC(3,2) DEFAULT NULL;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS analysis_version SMALLINT DEFAULT 1;
```

También crea RPC `compute_topic_similarity` que usa embeddings existentes en summaries para calcular similitud coseno entre topics.

Y crea RPC `compute_cohort_difficulty` que calcula el AVG de error_rate por topic.

### 2. Nuevo archivo: `topic-analyzer.ts`
Función pura (sin Hono). Exporta:

- `analyzeTopicDifficulty(summaryId, topicId, institutionId)` — orquestador principal
- `computeAlgorithmicSignals(content, keywordCount)` — señales sin IA
- `analyzeWithAI(content, topicName)` — llamada a Gemini Flash
- `computeDifficultyEstimate(signals)` — fórmula de combinación
- `DIFFICULTY_WEIGHTS` — pesos de la fórmula (exportado para testeo)
- Fallback defaults si Gemini falla (difficulty=0.5, minutes=30)

Usa `generateText()` de `gemini.ts` (Gemini Flash es más barato que Claude para esta tarea estructurada).

### 3. Modificar: `summary-hook.ts`
Después de `autoChunkAndEmbed()`, dispara `analyzeTopicDifficulty()` en fire-and-forget:

```ts
autoChunkAndEmbed(summaryId, institutionId)
  .then((result) => {
    // Solo analizar si el ingest fue exitoso
    if (result.chunks_created > 0) {
      return analyzeTopicDifficulty(summaryId, topicId, institutionId);
    }
  })
  .catch(/* log */);
```

Necesita el `topicId` — lo obtiene de `row.topic_id` (ya está en el row del CRUD).

### 4. Modificar: `routes/content/crud.ts`
Agregar las nuevas columnas a `updateFields` del topic CRUD para que sean legibles via API:

```ts
// No se agregan a createFields ni updateFields (son auto-computadas)
// Pero necesitan estar en selectFields o ser devueltas por el SELECT *
```

En realidad no necesita cambio — el CRUD usa `SELECT *` por defecto, así que las nuevas columnas ya se devuelven automáticamente.

### 5. Nuevo endpoint (opcional): `GET /topics/:id/analysis`
Para que el profesor pueda ver el análisis de dificultad y los prerequisitos detectados. Podría ir en `routes/content/` o como extensión del CRUD.

---

## Prompt de Gemini (el corazón del análisis)

```
You are an expert in medical education and cognitive science.
Analyze this study material and estimate its difficulty for a medical student.

Topic: {topicName}
Content (truncated to 4000 chars):
{contentMarkdown}

Respond in JSON:
{
  "bloom_level": <1-6, 1=Remember, 2=Understand, 3=Apply, 4=Analyze, 5=Evaluate, 6=Create>,
  "abstraction_level": <1-5, 1=concrete/visual, 5=abstract/molecular>,
  "concept_density": <1-5, concepts per section>,
  "interrelation_score": <1-5, how much it depends on other topics>,
  "estimated_study_minutes": <integer, realistic for average student>,
  "prerequisite_topics": ["topic name 1", "topic name 2"],
  "reasoning": "brief explanation"
}
```

Temperature: 0.2 (queremos consistencia, no creatividad).
Max tokens: 512 (respuesta corta).

---

## Graceful degradation

| Fallo | Qué pasa |
|---|---|
| Gemini 503/429 | Usa defaults: difficulty=0.5, bloom=2, minutes=30 |
| Summary sin contenido | No analiza (gate en summary-hook) |
| Topic sin keywords | keyword_density=0, keyword_count=0 |
| Sin datos de cohorte | cohort_difficulty=NULL, no se blendea |
| Prompt injection en contenido | sanitizeForPrompt() antes de enviar a Gemini |

---

## Costo

- 1 llamada Gemini Flash por summary creado/actualizado con contenido
- ~150 input tokens (prompt) + ~100 output tokens (JSON) = ~$0.0003 por llamada
- A 1000 summaries/mes = $0.30/mes

---

## Qué NO está en este plan (fase 2)

- `prerequisite_topic_ids` se llena con nombres, no UUIDs — mapear a UUIDs reales requiere fuzzy matching contra topics existentes del mismo curso. Se puede hacer con embedding similarity (RPC ya creada).
- Recalibración automática (batch semanal que compara AI estimate vs cohort reality)
- Visualización en frontend (professor dashboard con heatmap de dificultad)
- `analysis_version` permite re-analizar si el prompt/modelo mejora
