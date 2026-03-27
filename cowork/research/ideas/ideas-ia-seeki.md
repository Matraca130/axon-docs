# Ideas de IA para Seeki -- Documento de Producto

> **Fecha:** 2026-03-17
> **Autor:** Investigacion de Producto (IA)
> **Version:** 1.0
> **Contexto:** Basado en auditoria completa del frontend (2 repos, ~538 archivos), backend (93 archivos, Hono/Deno), y documentacion (axon-docs).

---

## Estado Actual de IA en la Plataforma

Antes de proponer ideas nuevas, es importante mapear lo que ya existe:

| Feature IA existente | Estado | Modelo | Descripcion |
|---|---|---|---|
| RAG Chat (Axon AI Assistant) | Produccion | Gemini 2.5 Flash | Chat contextual con retrieval de chunks del contenido del curso |
| Generacion de Flashcards | Produccion | Gemini 2.5 Flash | Genera flashcards desde un topico libre |
| Generacion de Quiz | Produccion | Gemini 2.5 Flash | Genera MCQ con explicaciones |
| Explicacion de Conceptos | Produccion | Gemini 2.5 Flash | Explicacion profunda de un concepto medico |
| Smart Generate (Adaptativo) | Produccion | Gemini 2.5 Flash + BKT | Selecciona subtopicos debiles via BKT y genera preguntas dirigidas |
| Voice Call (Realtime) | Produccion | OpenAI Realtime API | Llamada de voz con tutor IA via WebSocket |
| RAG Avanzado (Multi-Query, HyDE) | Produccion | Gemini + OpenAI Embeddings (1536d) | Estrategias de retrieval sofisticadas con re-ranking |
| PDF Ingest | Produccion | Gemini 2.5 Flash (multimodal) | Extraccion de texto desde PDFs |
| AI Tutor Panel (Mindmap) | Produccion | Gemini | Analiza knowledge graph, identifica debilidades, sugiere conexiones |
| Smart Flashcard Generator | Produccion | Gemini | Genera flashcards para keywords sin cobertura |
| Embeddings | Produccion | OpenAI text-embedding-3-large | 1536d con truncacion Matryoshka |

**Datos clave del backend:**
- 50+ tablas PostgreSQL con pgvector
- FSRS v4 (spaced repetition) + BKT v4 (knowledge tracing) ya implementados
- Sistema de gamificacion completo: 39 badges, 11 acciones XP, streaks, cap diario 500 XP
- Jerarquia: Institution > Course > Semester > Section > Topic > Summary > Keywords > Subtopics
- Roles: Owner, Admin, Professor, Student
- WhatsApp integration (en desarrollo)

---

## Idea 1: Tutor IA Personalizado con Memoria a Largo Plazo

### Descripcion Completa

Un tutor IA que evoluciona con el estudiante a lo largo de todo el semestre. A diferencia del chat RAG actual (que es stateless entre sesiones), este tutor mantiene un **perfil cognitivo persistente** del estudiante: sabe que temas domina, cuales le cuestan, como prefiere aprender, y adapta su comunicacion en consecuencia.

La diferencia clave vs. el Axon AI Assistant actual es que este **recuerda conversaciones previas**, detecta patrones de error recurrentes, y proactivamente sugiere intervenciones antes de que el estudiante pregunte.

### Como Funciona

El tutor combina tres fuentes de contexto en cada interaccion:

1. **Perfil Cognitivo Persistente** (nuevo): Un documento JSON por estudiante que se actualiza despues de cada interaccion, almacenando:
   - Mapa de dominio por subtopico (derivado de bkt_states.p_know)
   - Patrones de error detectados (ej: "confunde arteria renal con vena renal")
   - Estilo de aprendizaje inferido (visual, textual, por casos clinicos)
   - Historial resumido de las ultimas 20 interacciones (compresion via LLM)
   - Metas activas del estudiante (ej: "preparandome para parcial de cardio el 25/03")

2. **Contexto Academico en Tiempo Real** (existente):
   - bkt_states: mastery por subtopico
   - fsrs_states: flashcards pendientes/vencidas
   - study_sessions: frecuencia y duracion de estudio
   - quiz_attempts: historial de respuestas
   - student_stats: streak, tiempo total
   - reading_states: progreso de lectura

3. **Contenido del Curso via RAG** (existente):
   - Chunks embebidos con OpenAI text-embedding-3-large
   - Estrategias Multi-Query/HyDE ya implementadas

### Integracion con Features Existentes

| Feature | Integracion |
|---|---|
| **Study Sessions** | El tutor sugiere iniciar sesiones cuando detecta que el estudiante no ha estudiado hoy (streak at risk). Puede generar un plan de sesion de 30min optimizado. |
| **Knowledge Graph / Mindmap** | El tutor puede decir "Tu mapa de cardio tiene 3 nodos en rojo. Quieres que hagamos una sesion de repaso?" y navegar al estudiante directamente al mindmap con esos nodos resaltados. |
| **Quizzes** | Despues de un quiz mal hecho, el tutor analiza patrones: "En los ultimos 3 quizzes erraste preguntas sobre farmacologia de betabloqueadores. Esto es un patron -- te explico la diferencia clave?" |
| **Flashcards (FSRS)** | El tutor monitorea flashcards vencidas y proactivamente recuerda: "Tienes 12 flashcards vencidas de anatomia. Si las revisas ahora, tu stability sube un 40%." |
| **Gamificacion** | El tutor celebra logros: "Desbloqueaste el badge 'Streak de 7 dias'! Tu racha esta fuerte." |
| **Calendario/Schedule** | Se integra con study_plans y study_plan_tasks para crear planes de estudio personalizados. |

### Modelo de IA Recomendado

**Produccion:** Claude 3.5 Sonnet (Anthropic) via API

Justificacion:
- Superior en instrucciones largas y complejas (el system prompt con perfil cognitivo puede ser 3-4K tokens)
- Mejor adherencia a formato (respuestas estructuradas para el frontend)
- Pricing competitivo: ~$3/MTok input, ~$15/MTok output
- Alternativa: Gemini 2.5 Flash (ya integrado, mas barato, pero menor calidad en contextos largos)

**MVP:** Gemini 2.5 Flash (ya integrado, zero setup adicional)

### Flujo de Usuario Paso a Paso

1. Estudiante abre la app. El dashboard muestra un widget "Tu tutor IA dice:" con un mensaje proactivo basado en su perfil (ej: "Buen dia! Tienes un parcial de cardio en 8 dias y tu mastery en arritmias esta en 42%. Quieres un plan intensivo?").
2. Estudiante hace click en el widget o abre el panel de chat.
3. El backend carga: perfil_cognitivo + bkt_states + fsrs_states + student_stats + study_plans del estudiante.
4. Todo se inyecta en el system prompt del LLM.
5. Estudiante interactua normalmente. El LLM tiene contexto completo.
6. Despues de cada sesion de chat (>3 mensajes), un job en background actualiza el perfil_cognitivo:
   - LLM resume la conversacion en 2-3 oraciones
   - Extrae nuevos patrones de error detectados
   - Actualiza preferencia de estilo inferida
7. El tutor puede ejecutar **acciones**: crear flashcards, iniciar quiz, navegar a un summary, agregar tareas al study_plan. Estas se implementan como function-calling del LLM.

### Datos Necesarios del Backend

**Tablas existentes (sin cambios):**
- `bkt_states` (p_know por subtopico)
- `fsrs_states` (stability, difficulty, due_at por flashcard)
- `study_sessions` (historial de sesiones)
- `quiz_attempts` (historial de respuestas)
- `student_stats` (streak, totales)
- `daily_activities` (actividad por dia)
- `reading_states` (progreso de lectura)
- `study_plans` + `study_plan_tasks`
- `keyword_connections` (para entender el grafo)

**Tabla nueva necesaria:**
```sql
CREATE TABLE student_cognitive_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  profile_data JSONB NOT NULL DEFAULT '{}',
  -- profile_data contiene:
  -- {
  --   "learning_style": "visual" | "textual" | "clinical_cases",
  --   "weak_patterns": [{"pattern": "confunde X con Y", "detected_at": "...", "count": 3}],
  --   "conversation_summaries": [{"date": "...", "summary": "...", "topics": [...]}],
  --   "goals": [{"description": "...", "deadline": "...", "status": "active"}],
  --   "preferences": {"verbosity": "concise", "language": "pt-BR", "examples_preferred": true}
  -- }
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, institution_id)
);
```

**Nuevo endpoint necesario:**
- `GET /ai/tutor-context/:studentId` -- agrega bkt_states + fsrs due count + stats + perfil cognitivo en un solo request
- `POST /ai/tutor-chat` -- similar a `/ai/rag-chat` pero con perfil cognitivo inyectado
- `POST /ai/tutor-action` -- ejecuta acciones (crear flashcard, iniciar quiz, etc.)

### Costo Estimado de API Calls

**Supuestos:** 1000 estudiantes activos, promedio 5 interacciones/dia con tutor, cada interaccion ~2K tokens input + 500 tokens output.

| Modelo | Input/dia | Output/dia | Costo/dia | Costo/mes |
|---|---|---|---|---|
| Gemini 2.5 Flash | 10M tokens | 2.5M tokens | ~$1.50 | ~$45 |
| Claude 3.5 Sonnet | 10M tokens | 2.5M tokens | ~$67.50 | ~$2,025 |
| GPT-4o-mini | 10M tokens | 2.5M tokens | ~$5.25 | ~$157 |

**Recomendacion:** MVP con Gemini 2.5 Flash (ya integrado, costo minimo). Migrar a Claude Sonnet solo para features premium o cuando se necesite mejor calidad de razonamiento.

### MVP vs Version Completa

| Aspecto | MVP (4 semanas) | Version Completa (12 semanas) |
|---|---|---|
| Perfil cognitivo | JSON basico con weak_patterns | Perfil completo con learning style, goals, summaries |
| Proactividad | Mensaje estatico en dashboard | Push notifications + WhatsApp (ya hay integracion) |
| Acciones | Solo "navegar a" | Crear flashcards, quizzes, study plans via function-calling |
| Memoria | Ultimas 5 conversaciones | 20 conversaciones + compresion automatica |
| Modelo | Gemini 2.5 Flash | Claude Sonnet con fallback a Gemini |
| Multimodal | Solo texto | Texto + imagenes de apuntes + voz (ya hay realtime) |

---

## Idea 2: Generador de Contenido de Estudio con IA (Content Factory)

### Descripcion Completa

Un sistema integral que transforma **cualquier material crudo** (PDFs, apuntes manuscritos fotografiados, presentaciones, videos de clase) en **contenido de estudio estructurado y listo para usar** dentro de la plataforma. Esto incluye: flashcards, quizzes, resumenes, mapas mentales, y keywords -- todo generado automaticamente y vinculado al knowledge graph existente.

La diferencia clave vs. la generacion actual (que requiere topico manual) es que este sistema **ingiere material real del estudiante** y produce contenido contextualizado dentro de la estructura existente del curso.

### Sub-features Detalladas

#### 2a. Auto-generacion de Flashcards desde Apuntes/PDFs

**Como funciona:**
1. Estudiante sube un PDF o foto de sus apuntes
2. Backend usa Gemini 2.5 Flash multimodal (ya existe `extractTextFromPdf()` en gemini.ts) para extraer texto
3. El texto se chunka con `semantic-chunker.ts` (ya existe)
4. Cada chunk se analiza para extraer pares pregunta-respuesta
5. Los pares se vinculan a keywords existentes via embedding similarity (OpenAI text-embedding-3-large ya configurado)
6. Las flashcards se insertan en la tabla `flashcards` con `source: 'ai'` y `keyword_id` correcto
7. Se crean fsrs_states para el estudiante automaticamente

**Prompt de extraccion (ejemplo):**
```
Eres un experto en educacion medica. Del siguiente texto de apuntes, genera flashcards tipo pregunta-respuesta.
Cada flashcard debe:
- Testear UN concepto especifico
- Tener pregunta clara y respuesta concisa
- Incluir el keyword principal al que se refiere
- Clasificar dificultad: 1 (basica), 2 (intermedia), 3 (avanzada)
Formato JSON: [{front, back, keyword_hint, difficulty}]
```

**Integracion con FSRS existente:** Las flashcards generadas entran automaticamente al ciclo de spaced repetition. El FSRS v4 ya implementado las agenda para revision.

#### 2b. Quizzes Personalizados Basados en Debilidades

**Como funciona:**
1. Sistema consulta `bkt_states` para encontrar subtopicos con `p_know < 0.5`
2. Para cada subtopico debil, recupera chunks relevantes via RAG
3. Genera preguntas MCQ enfocadas especificamente en las areas de confusion
4. Las preguntas se insertan como `quiz_questions` con `source: 'ai'` y `subtopic_id` correcto
5. Se crea un `quiz` entity con titulo descriptivo (ej: "Repaso: Tus puntos debiles en Farmacologia")

**Esto ya esta parcialmente implementado** en `generate-smart.ts` (Fase 8A). La mejora seria:
- Agregar "diagnostico de confusion": analizar quiz_attempts anteriores para entender **por que** el estudiante erra (ej: confunde dos conceptos similares) y generar preguntas que apunten a esa confusion especifica.
- Generar quizzes completos de una vez (5-10 preguntas) en lugar de una por una.

#### 2c. Resumenes Automaticos de Temas

**Como funciona:**
1. Profesor sube material extenso (PDF de 50 paginas, transcripcion de clase)
2. El sistema genera un **resumen estructurado** que sigue la jerarquia de Axon: Seccion > Topico > Subtopico
3. Automaticamente crea la estructura en el content tree:
   - Detecta keywords y los vincula o crea
   - Genera subtopicos con explicaciones
   - Propone keyword_connections (relaciones entre conceptos)
4. El profesor revisa y aprueba (o edita) antes de publicar

**Pipeline:**
```
PDF -> extractTextFromPdf() -> semantic-chunker.ts -> LLM analisis de estructura
    -> Propuesta de jerarquia (Section/Topic/Subtopic)
    -> Generacion de keywords + definiciones
    -> Generacion de keyword_connections
    -> Profesor review -> Publicar
```

#### 2d. Mapas Mentales Generados por IA

**Integracion con mindmap/knowledge graph existente:**

El sistema ya tiene:
- `KnowledgeGraph.tsx` con D3.js force/radial/tree layouts
- `keyword_connections` table (source_id, target_id, connection_type)
- `AiTutorPanel.tsx` que analiza el grafo y sugiere conexiones

**La mejora:**
1. **Auto-generacion de conexiones**: Cuando se agrega un nuevo keyword, el LLM analiza semanticamente su relacion con keywords existentes y propone connection_type (es_parte_de, causa, requiere, similar_a, etc.)
2. **Clustering inteligente**: El LLM agrupa keywords en clusters tematicos y sugiere una visualizacion optima del grafo
3. **"Explode node"**: Click en un nodo del mindmap -> la IA genera 5-8 sub-nodos con las ramificaciones conceptuales de ese keyword

**Implementacion:**
- Nuevo endpoint: `POST /ai/suggest-connections` que recibe un keyword_id y devuelve [{target_keyword_id, connection_type, reasoning}]
- Usa embeddings existentes para pre-filtrar candidatos (similarity > 0.6) y luego Gemini para clasificar tipo de conexion
- Se apoya en `createCustomEdge()` de mindmapApi (ya existe)

### Modelo de IA Recomendado

- **Extraccion de texto/imagenes:** Gemini 2.5 Flash (ya integrado, excelente para multimodal)
- **Generacion de contenido:** Gemini 2.5 Flash para MVP; Claude Sonnet para quizzes de alta calidad
- **Embeddings:** OpenAI text-embedding-3-large (ya configurado, 1536d)

### Costo Estimado

**Supuestos:** 50 profesores subiendo ~2 PDFs/semana, 1000 estudiantes generando ~3 sets de flashcards/semana.

| Operacion | Volume/mes | Tokens/op | Costo/mes (Gemini Flash) |
|---|---|---|---|
| PDF extraction | 400 PDFs | ~30K tokens/PDF | ~$1.80 |
| Flashcard generation | 3000 requests | ~2K tokens | ~$0.90 |
| Quiz generation | 1000 requests | ~3K tokens | ~$0.45 |
| Summary generation | 400 requests | ~20K tokens | ~$1.20 |
| Connection suggestions | 5000 requests | ~1K tokens | ~$0.75 |
| Embeddings (OpenAI) | ~50K chunks | 500 tokens/chunk | ~$2.50 |
| **TOTAL** | | | **~$7.60/mes** |

Extremadamente economico gracias a Gemini Flash.

### MVP vs Version Completa

| Aspecto | MVP (3 semanas) | Version Completa (10 semanas) |
|---|---|---|
| Input | Solo PDF text | PDF + fotos + audio transcripcion + video |
| Flashcard gen | Desde topico (ya existe) | Desde PDF con keyword linking automatico |
| Quiz gen | Smart generate (ya existe) | Diagnostico de confusion + quizzes dirigidos |
| Resumenes | Manual | Auto-generacion con review de profesor |
| Mindmap | Conexiones manuales | Auto-sugerencia + "explode node" |
| Batch | Una a una | Bulk generation con progress bar |

---

## Idea 3: Predictor de Rendimiento Academico

### Descripcion Completa

Un sistema de machine learning que analiza los patrones de estudio de un estudiante para **predecir su probabilidad de aprobar** cada materia y **generar alertas tempranas** cuando detecta riesgo. No es un simple porcentaje -- es un sistema de early warning que actua antes de que sea demasiado tarde.

### Como Funciona

#### Modelo Predictivo

**Features de entrada (todas ya disponibles en la DB):**

| Feature | Tabla fuente | Descripcion |
|---|---|---|
| study_frequency | daily_activities | Dias activos / dias del periodo |
| avg_session_duration | study_sessions | Duracion promedio de sesiones |
| total_study_hours | student_stats | Horas totales acumuladas |
| streak_consistency | student_stats | current_streak / dias desde inicio |
| bkt_avg_p_know | bkt_states | Promedio de p_know en subtopicos del curso |
| bkt_below_threshold | bkt_states | % de subtopicos con p_know < 0.5 |
| fsrs_overdue_ratio | fsrs_states | Flashcards vencidas / total |
| fsrs_avg_stability | fsrs_states | Estabilidad promedio de memoria |
| quiz_accuracy_trend | quiz_attempts | Tendencia de accuracy (ultimos 7 dias vs anterior) |
| quiz_response_time | quiz_attempts | Tiempo promedio de respuesta (proxy de confianza) |
| reading_completion | reading_states | % de summaries completados |
| reading_depth | reading_states | Tiempo promedio por summary |
| xp_daily_avg | (gamification) | XP promedio diario |
| days_to_exam | study_plans | Dias restantes hasta fecha de examen |
| engagement_decay | daily_activities | Pendiente de actividad (creciente/decreciente) |

**Modelo recomendado:**

Para MVP: **Gradient Boosting (XGBoost/LightGBM)** entrenado en datos historicos.

Justificacion:
- Tabular data = XGBoost es gold standard
- Interpretable (feature importances = podemos explicar al estudiante *por que* esta en riesgo)
- No requiere GPU
- Puede correr como una Supabase Edge Function con ONNX runtime

Para V2: **Red neuronal temporal** (LSTM/Transformer) que modela la secuencia temporal de actividades.

#### Pipeline de Prediccion

```
[Cron job diario - 2 AM]
  -> Para cada estudiante activo:
     1. Agregar features de las ultimas 24h
     2. Ejecutar modelo de prediccion
     3. Guardar resultado en student_predictions table
     4. Si prob_aprobar < umbral (configurable, default 60%):
        -> Crear alerta en student_alerts table
        -> Notificar via push + email
        -> (V2) Notificar via WhatsApp (integracion ya existe)
     5. Si prob_aprobar cayo >15% en 7 dias:
        -> Alerta critica "tu rendimiento esta cayendo"
```

#### Alertas y Recomendaciones

Las alertas no son genericas -- son **accionables y especificas:**

| Tipo de Alerta | Ejemplo | Accion Sugerida |
|---|---|---|
| Streak en riesgo | "Llevas 2 dias sin estudiar y tu streak de 15 dias esta en riesgo" | Link directo a sesion rapida de 10min |
| Mastery decayendo | "Tu dominio de Farmacologia bajo de 72% a 58% esta semana" | Link a quiz adaptativo de Farmacologia |
| Flashcards acumuladas | "Tienes 47 flashcards vencidas. Revisar hoy toma ~15min" | Link a sesion de flashcards |
| Ritmo insuficiente | "A tu ritmo actual, cubririas solo 60% del material antes del parcial" | Sugiere plan de estudio intensivo |
| Patron de error | "Erraste 4/5 preguntas sobre betabloqueadores en los ultimos 3 quizzes" | Link a explicacion IA del tema + flashcards especificas |

### Datos Necesarios y Modelo de Entrenamiento

**Datos de entrenamiento:**
El principal desafio es que Seeki necesita datos historicos de resultado final (aprobo/no aprobo). Opciones:

1. **Cold start (MVP):** Usar reglas heuristicas basadas en investigacion educativa en lugar de ML:
   - Si bkt_avg < 0.4 AND study_frequency < 0.3 -> riesgo alto
   - Si fsrs_overdue > 50% AND engagement_decay < 0 -> riesgo medio
   - Calibrar umbrales con feedback de profesores

2. **V2 (con datos):** Despues de 1-2 semestres de datos, entrenar XGBoost real:
   - El profesor ingresa nota final del estudiante
   - Se cruza con features historizados
   - Train/test split por semestre (no por estudiante, para evitar leakage temporal)

**Tablas nuevas:**
```sql
CREATE TABLE student_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  prediction_date DATE NOT NULL,
  prob_pass NUMERIC NOT NULL CHECK (prob_pass >= 0 AND prob_pass <= 1),
  confidence NUMERIC, -- model confidence
  features_snapshot JSONB, -- features usados para esta prediccion
  model_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_id, prediction_date)
);

CREATE TABLE student_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  alert_type TEXT NOT NULL, -- 'risk_high', 'streak_risk', 'mastery_decay', etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT, -- deep link dentro de la app
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  read_at TIMESTAMPTZ, -- null = no leida
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Consideraciones Eticas y de Privacidad

1. **Transparencia:** El estudiante siempre debe ver *por que* el sistema predice lo que predice. Feature importances se muestran como: "Esta prediccion se basa en: frecuencia de estudio (40%), mastery actual (30%), flashcards pendientes (20%), tendencia de quiz (10%)."

2. **No punitivo:** Las predicciones NUNCA se comparten con profesores o administradores sin consentimiento explicito del estudiante. Es una herramienta de auto-mejora, no de vigilancia.

3. **Opt-out:** El estudiante puede desactivar predicciones y alertas en preferences.

4. **Sesgo:** Monitorear que el modelo no discrimine por patrones demograficos. Validar fairness metrics por grupo.

5. **Efecto Pigmalion inverso:** El mensaje nunca debe ser "vas a reprobar" sino "aqui hay oportunidades de mejorar". Framing positivo siempre.

6. **LGPD/GDPR compliance:** Los features_snapshot en student_predictions deben ser anonimizables. El estudiante puede solicitar borrado de su historial predictivo.

### Costo Estimado

| Componente | Costo/mes |
|---|---|
| Cron job (Supabase Edge Function) | $0 (incluido en plan) |
| XGBoost inference (CPU, ~1ms/student) | $0 (corre en Edge Function) |
| Almacenamiento predictions (1000 students * 30 dias) | < $1 |
| Gemini para generar mensajes de alerta personalizados | ~$5 |
| **TOTAL** | **~$6/mes** |

Es la idea mas barata porque el ML corre localmente (no LLM).

### MVP vs Version Completa

| Aspecto | MVP (3 semanas) | Version Completa (16 semanas) |
|---|---|---|
| Modelo | Heuristicas rule-based | XGBoost entrenado con datos reales |
| Alertas | En-app notifications | Push + Email + WhatsApp |
| Dashboard | Widget simple en home | Panel completo con graficos de tendencia |
| Profesor view | No | Dashboard de riesgo por grupo (opt-in del estudiante) |
| Recomendaciones | Genericas | Personalizadas via LLM con perfil cognitivo |
| Calibracion | Manual (umbrales fijos) | Auto-calibracion por cohorte |

---

## Idea 4: Grupo de Estudio IA -- Estudio Colaborativo Inteligente

### Descripcion Completa

Un sistema que crea **grupos de estudio virtuales optimizados por IA** donde estudiantes con perfiles complementarios son emparejados para estudiar juntos. La IA actua como moderadora de sesiones de estudio grupales, generando desafios, debates, y actividades colaborativas en tiempo real.

La premisa psicologica: la investigacion muestra que ensenar a otros es la forma mas efectiva de aprender (efecto protege). Si un estudiante domina Farmacologia pero lucha con Anatomia, y otro tiene el perfil inverso, ambos se benefician de estudiar juntos.

### Como Funciona

#### Matching Inteligente

```
1. Construir perfil de habilidades por estudiante:
   skills_vector = [bkt_p_know para cada subtopico del curso]

2. Calcular complementariedad entre pares:
   complementarity(A, B) = cosine_distance(skills_A, skills_B)
   // Alto = perfiles complementarios (uno fuerte donde el otro es debil)

3. Formar grupos de 3-4 estudiantes maximizando:
   - Complementariedad de skills
   - Horarios compatibles (de study_sessions.started_at patterns)
   - Mismo curso/semestre
   - Engagement similar (para evitar que un inactivo afecte al grupo)
```

#### Sesiones de Estudio Grupal con IA

**Modalidades:**

1. **Quiz Battle:** La IA genera un quiz y los estudiantes compiten en tiempo real. Cada pregunta se asigna al subtopico donde el grupo tiene mayor varianza de mastery (uno sabe, otro no). Despues de cada pregunta, el que acerto explica al que erro.

2. **Debate Guiado:** La IA presenta un caso clinico (generado o del contenido del curso) y asigna posiciones: "Estudiante A, defiende que el tratamiento es X. Estudiante B, defiende Y." El debate se cronometra y la IA modera, haciendo preguntas Socraticas.

3. **Teach-Back:** La IA asigna a cada estudiante un subtopico donde es fuerte y le pide que lo explique al grupo en 3 minutos. Los otros evaluan y hacen preguntas. La IA mide comprension de todos al final con un mini-quiz.

4. **Mapa Mental Colaborativo:** Los estudiantes construyen un mapa conceptual juntos en el KnowledgeGraph existente. La IA sugiere conexiones y desafia: "Creen que X esta conectado con Y? Por que?"

#### Gamificacion Grupal

Se integra con el sistema de gamificacion existente (39 badges, XP engine):

| Accion | XP | Badge |
|---|---|---|
| Participar en sesion grupal | 30 XP | "Team Player" |
| Explicar concepto a companero (teach-back) | 25 XP | "Mentor" |
| Ganar Quiz Battle | 20 XP | "Champion" |
| Racha grupal (3 sesiones seguidas) | 50 XP | "Study Squad" |
| Grupo con mejor mejoria semanal | 100 XP | "Dream Team" |

### Integracion Tecnica

**Tablas nuevas:**
```sql
CREATE TABLE study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, archived
  max_members INTEGER NOT NULL DEFAULT 4,
  ai_matching_score NUMERIC, -- calidad del matching
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE study_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES study_groups(id),
  student_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT NOT NULL DEFAULT 'member', -- member, leader
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, student_id)
);

CREATE TABLE group_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES study_groups(id),
  session_type TEXT NOT NULL, -- quiz_battle, debate, teach_back, collab_map
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, active, completed
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  ai_content JSONB, -- preguntas/casos generados por IA
  results JSONB, -- resultados de la sesion
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Realtime:** Usar Supabase Realtime (ya disponible) para sincronizar estado de la sesion grupal entre participantes. No necesita WebSocket adicional.

### Modelo de IA Recomendado

- **Matching:** No requiere LLM -- puro calculo vectorial en PostgreSQL (pgvector ya esta)
- **Generacion de contenido para sesiones:** Gemini 2.5 Flash
- **Moderacion de debates:** Claude 3.5 Sonnet (mejor en dialogo multi-turno largo)
- **Realtime voice (debates):** OpenAI Realtime API (ya integrado para voice calls)

### Costo Estimado

| Componente | Volume/mes | Costo/mes |
|---|---|---|
| Matching algorithm (SQL) | 1000 students | $0 |
| Quiz Battle generation | 500 sesiones * ~3K tokens | ~$0.23 |
| Debate case generation | 200 sesiones * ~5K tokens | ~$0.15 |
| AI moderation (claude) | 200 sesiones * ~10K tokens | ~$6.00 |
| Supabase Realtime | Incluido en plan Pro | $0 |
| **TOTAL** | | **~$6.40/mes** |

### MVP vs Version Completa

| Aspecto | MVP (5 semanas) | Version Completa (14 semanas) |
|---|---|---|
| Matching | Manual (estudiante elige grupo) | IA matching automatico por skills |
| Sesiones | Solo Quiz Battle | Quiz + Debate + Teach-Back + Collab Map |
| Comunicacion | Chat texto en-app | Texto + Voice (via Realtime API existente) |
| Gamificacion | XP basico por participar | Badges grupales + leaderboard de grupos |
| Horarios | Manual | Sugerencia automatica basada en patrones |
| Moderacion | Sin IA | IA modera debates y evalua teach-backs |

---

## Comparacion y Roadmap

### Tabla de Impacto vs Esfuerzo

| Idea | Impacto Educativo | Impacto en Retention | Esfuerzo MVP | Esfuerzo Completo | Costo IA/mes | Dependencias |
|---|---|---|---|---|---|---|
| **1. Tutor Personalizado** | Muy Alto | Alto | 4 semanas | 12 semanas | $45-$2K | Ninguna |
| **2. Content Factory** | Alto | Medio | 3 semanas | 10 semanas | ~$8 | Ninguna |
| **3. Predictor Rendimiento** | Alto | Muy Alto | 3 semanas | 16 semanas | ~$6 | Datos historicos (1-2 semestres) |
| **4. Grupo de Estudio IA** | Muy Alto | Muy Alto | 5 semanas | 14 semanas | ~$6 | >= 10 estudiantes activos por curso |

### Orden de Implementacion Recomendado

```
Fase 1 (Semanas 1-3):  Idea 2 MVP — Content Factory
  Razon: Mayor valor inmediato para profesores Y estudiantes.
  Ya tiene 70% de la infraestructura (PDF ingest, smart generate, embeddings).
  Quick win que demuestra valor de IA tangible.

Fase 2 (Semanas 4-7):  Idea 1 MVP — Tutor Personalizado
  Razon: Diferenciador principal de Seeki. Usa Gemini Flash (ya integrado).
  Depende conceptualmente de Content Factory (mas contenido = mejor tutor).

Fase 3 (Semanas 8-10): Idea 3 MVP — Predictor de Rendimiento
  Razon: Facil de implementar como heuristicas.
  Los datos de uso de Fase 1+2 alimentan mejores predicciones.

Fase 4 (Semanas 11-15): Idea 4 MVP — Grupo de Estudio
  Razon: Requiere masa critica de usuarios activos.
  Las Fases 1-3 aumentan engagement, creando la base de usuarios necesaria.

Fase 5 (Semanas 16+):  Versiones completas de cada idea
  Priorizar segun metricas de uso del MVP.
```

### Dependencias Entre Ideas

```
Content Factory (2) ─── alimenta ───> Tutor Personalizado (1)
       |                                      |
       |                                      v
       └──────────> Predictor (3) <─── datos de uso
                         |
                         v
                  Grupos de Estudio (4) <── requiere usuarios activos
```

- Idea 1 (Tutor) se beneficia de Idea 2 (Content Factory) porque mas contenido generado = mas contexto para el tutor.
- Idea 3 (Predictor) necesita datos de uso que se acumulan con Ideas 1 y 2.
- Idea 4 (Grupos) requiere masa critica de estudiantes activos, que Ideas 1-3 ayudan a lograr.

### Stack Tecnologico Recomendado por Idea

| Componente | Idea 1 | Idea 2 | Idea 3 | Idea 4 |
|---|---|---|---|---|
| **LLM Principal** | Gemini 2.5 Flash | Gemini 2.5 Flash | N/A | Gemini 2.5 Flash |
| **LLM Premium** | Claude Sonnet (v2) | Claude Sonnet (v2) | Gemini (alertas) | Claude Sonnet (debates) |
| **Embeddings** | OpenAI 1536d (existente) | OpenAI 1536d (existente) | N/A | pgvector (existente) |
| **ML Framework** | N/A | N/A | XGBoost + ONNX Runtime | Scipy (matching) |
| **Realtime** | N/A | N/A | Supabase Cron | Supabase Realtime |
| **Storage** | JSONB (perfil cognitivo) | Supabase Storage (PDFs) | JSONB (features) | JSONB (sesiones) |
| **Frontend** | Modificar AxonAIAssistant | Nuevo upload flow + review UI | Dashboard widget + alertas | Nuevo modulo de grupos |
| **Backend** | 3 nuevos endpoints Hono | 5 nuevos endpoints + cron | 2 endpoints + cron diario | 6 endpoints + realtime |

### Estimacion de Costos de Infraestructura IA (Total)

| Escenario | Idea 1 | Idea 2 | Idea 3 | Idea 4 | TOTAL/mes |
|---|---|---|---|---|---|
| **1K estudiantes (MVP)** | $45 | $8 | $6 | $6 | **$65/mes** |
| **5K estudiantes** | $225 | $40 | $30 | $32 | **$327/mes** |
| **20K estudiantes** | $900 | $160 | $120 | $128 | **$1,308/mes** |
| **20K est. (con Claude premium)** | $10,000 | $800 | $120 | $640 | **$11,560/mes** |

**Recomendacion de costos:** Comenzar 100% con Gemini 2.5 Flash. Solo activar Claude Sonnet como tier premium (estudiantes que pagan plan avanzado). Esto mantiene costos en ~$65/mes para 1K estudiantes, que es extremadamente competitivo.

### Metricas de Exito por Idea

| Idea | Metrica Principal | Target (6 meses) |
|---|---|---|
| 1. Tutor | % estudiantes que interactuan con tutor >3 veces/semana | > 40% |
| 2. Content Factory | Flashcards generadas por IA vs manuales | > 60% AI-generated |
| 3. Predictor | % de alertas que resultan en accion del estudiante | > 50% |
| 4. Grupos | Sesiones grupales completadas / semana | > 2 por grupo activo |
| **General** | Retencion mensual de estudiantes | +25% vs baseline |

---

## Apendice: Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigacion |
|---|---|---|---|
| Costos de API escalan mas de lo esperado | Media | Alto | Rate limiting existente + caps por estudiante. Monitorear con rag_query_log (ya existe). |
| Calidad de contenido generado insuficiente | Media | Alto | Sistema de reports existente (Fase 8B/8C). Professor review obligatorio para contenido publicado. |
| Estudiantes dependen demasiado del tutor | Baja | Medio | Limitar interacciones/dia. Incentivar estudio activo vs pasivo en gamificacion. |
| Predictor genera ansiedad | Media | Alto | Framing positivo siempre. Opt-out disponible. Nunca mensajes de "vas a reprobar". |
| Grupos de estudio con baja participacion | Alta | Medio | Comenzar con matching manual. Solo automatizar cuando hay masa critica. Gamificacion grupal para incentivar. |
| Alucinaciones del LLM en contenido medico | Media | Muy Alto | RAG con chunks verificados por profesor. Disclaimer visible. Report system existente. |
