# Ideas de Personalizacion Profunda — Axon Platform

> **Fecha:** 2026-03-22
> **Autor:** Ralph Loop (analisis iterativo profundo)
> **Version:** 5.0 (Ralph Loop iteracion 6 — 24 loops, 122 ideas, 58 ranked)
> **Objetivo:** Hacer la experiencia de cada alumno UNICA — que dos estudiantes nunca vean la misma plataforma
> **Contexto:** Builds on top of existing ideas (ideas-ia-seeki.md, RECOPILADO-IDEAS-SEEKI.md). Everything here is NEW.

---

## Estado de Decisiones (Sesion Cowork 2026-03-22)

> Documento de decisiones completo: `Decisiones_Personalizacion_Axon.docx`

| Simbolo | Significado |
|---------|-------------|
| ✅ SPRINT 0 | Aprobado para implementar ahora |
| 🔜 PROX | Aprobado conceptualmente, proximamente |
| ❌ NO | Rechazado en esta fase |
| ⏸️ PENDIENTE | Necesita mas definicion |
| _(sin marca)_ | No evaluado todavia |

**Sprint 0 (solo 3 ideas):** 4.3 Badges Esfuerzo + 1.2 Dificultad Adaptativa + 1.7+3.1 Calendario Inteligente (consolidados)

---

## Filosofia

La personalizacion no es solo "mostrar contenido diferente". Es hacer que el alumno sienta que la plataforma **lo conoce**. Cada interaccion debe comunicar: "se quien sos, se como aprendes, se que necesitas ahora mismo."

Organizamos las ideas en 14 loops de profundidad creciente:

```
Loop 1:  Learning DNA (sin IA) ............. cosas que podemos hacer HOY
Loop 2:  IA Pura ........................... potencia de LLMs + embeddings
Loop 3:  Mixtas (IA + reglas) .............. lo mejor de ambos mundos
Loop 4:  Social & Emocional ................ la dimension humana
Loop 5:  Visionarias (con prerrequisitos) .. el futuro a 12-24 meses
Loop 6:  Metacognicion ..................... ensenar a aprender
Loop 7:  Profesor-Side ..................... personalizar al creador
Loop 8:  Data Flywheel & Monetizacion ...... escalar y monetizar
Loop 9:  Gamificacion 2.0 .................. mas alla de badges
Loop 10: Bienestar & Anti-Burnout .......... cuidar al alumno
Loop 11: Mobile-First & Micro-Momentos ..... estudiar en cualquier lado
Loop 12: Descubrimiento & Serendipia ....... lo que no sabias que necesitabas
Loop 13: Accesibilidad & Inclusion ......... para TODOS, sin excepcion
Loop 14: AI Agents ......................... automatizacion inteligente en background
```

---

## LOOP 1: Learning DNA (Sin IA)

> Ideas que personalizan usando SOLO datos que ya tenemos en la DB + logica de reglas.
> Cero costo adicional de API. Implementables con lo que existe.

---

### 1.1 Perfil de Ritmo Circadiano del Alumno 🔜 PROX

**Que es:** Detectar automaticamente si el alumno es matutino, vespertino o nocturno, y adaptar la plataforma a su ritmo.

**Como se detecta:**
```sql
-- Analizar study_sessions.started_at para encontrar patron
SELECT
  student_id,
  EXTRACT(HOUR FROM started_at) AS study_hour,
  COUNT(*) AS sessions,
  AVG(duration_minutes) AS avg_duration,
  AVG(cards_correct::float / NULLIF(cards_total, 0)) AS avg_accuracy
FROM study_sessions
WHERE started_at > NOW() - INTERVAL '30 days'
GROUP BY student_id, EXTRACT(HOUR FROM started_at)
ORDER BY sessions DESC;
```

**Como personaliza:**
- **Notificaciones:** Si es nocturno, los reminders de Telegram/WhatsApp llegan a las 20h, no a las 8h
- **Sugerencias del dashboard:** "Tu mejor rendimiento es entre 21:00 y 23:00. Tienes una sesion pendiente."
- **FSRS scheduling:** Las cards se programan para que venzan a la hora optima del alumno
- **Streak tracking:** No penalizar al nocturno que no estudio a las 7am — su "dia" empieza mas tarde

**Datos necesarios:** `study_sessions` (ya existe), `daily_activities` (ya existe)
**Tabla nueva:** Ninguna. Se guarda en `user_profiles.preferences` como JSON:
```json
{
  "circadian": {
    "peak_hours": [21, 22, 23],
    "detected_type": "nocturno",
    "confidence": 0.82,
    "last_calculated": "2026-03-22"
  }
}
```

**Esfuerzo:** 3-5 dias | **Impacto:** Medio-Alto | **Costo:** $0

---

### 1.2 Calibracion Adaptativa de Dificultad (sin IA) ✅ SPRINT 0

**Que es:** Ajustar la dificultad de flashcards y quizzes en tiempo real basandose en la "zona de flujo" del alumno. Ni muy facil (aburrimiento) ni muy dificil (frustracion).

**Teoria:** Zona de Desarrollo Proximo (Vygotsky) + Flow State (Csikszentmihalyi). El ratio optimo es ~85% de acierto.

**Como funciona:**
```
1. Calcular ratio de acierto de las ultimas 20 interacciones
2. Si ratio > 90%: subir dificultad (seleccionar cards con stability baja o subtopicos con p_know medio)
3. Si ratio < 70%: bajar dificultad (seleccionar cards con stability alta o subtopicos con p_know alto)
4. Si ratio 70-90%: zona de flujo — mantener mix actual
5. Ajustar clinical_priority de keywords como multiplicador de dificultad
```

**Integracion con FSRS:**
- FSRS ya tiene `difficulty` por card (1-10)
- Agregar un `target_difficulty_range` por estudiante en preferences
- Al generar sesiones, filtrar cards cuyo `difficulty` este en el rango del alumno
- El rango se auto-ajusta sesion a sesion

**Integracion con BKT:**
- BKT ya sabe p_know por subtopico
- Smart generate ya apunta a p_know < 0.5
- Mejora: crear 3 "bandas" de dificultad y rotar entre ellas:
  - Consolidacion (p_know 0.6-0.8): reforzar lo que casi domina
  - Desafio (p_know 0.3-0.6): empujar hacia dominio
  - Exploracion (p_know < 0.3): introducir gradualmente

**Esfuerzo:** 5-7 dias | **Impacto:** Alto | **Costo:** $0

---

### 1.3 Formato Favorito Detectado ❌ NO

**Que es:** Detectar si el alumno aprende mejor con flashcards, quizzes, lectura de resumenes, o video — y priorizar ese formato en su feed.

**Deteccion:**
```
Para cada formato, calcular:
  engagement_score = (tiempo_en_formato / tiempo_total) * 0.4
                   + (precision_en_formato) * 0.4
                   + (frecuencia_voluntaria) * 0.2

Formatos: flashcards, quizzes, summaries, videos, mindmap
```

**Como personaliza:**
- **Study Hub:** Reordena las opciones poniendo el formato favorito primero
- **Sugerencias post-sesion:** "Te fue genial con flashcards hoy. Quieres probar un quiz sobre lo mismo?"
- **Content priority:** Al tener un subtopico debil, sugerir el formato con mejor engagement primero
- **Dashboard widgets:** Reorganizar segun preferencia

**Datos necesarios:** `study_sessions` (type, duration), `reviews` (accuracy), `reading_states` (time)
**Tabla nueva:** Ninguna. Va en `user_profiles.preferences.format_affinity`

**Esfuerzo:** 3-5 dias | **Impacto:** Medio | **Costo:** $0

---

### 1.4 Micro-Sesiones Calibradas 🔜 PROX

**Que es:** Detectar la duracion optima de sesion de cada alumno y sugerir sesiones de esa longitud exacta.

**Deteccion:**
```
Para cada alumno, analizar:
  - Duracion promedio antes de que el accuracy empiece a caer
  - Duracion promedio antes de que abandone la sesion
  - Duracion de sus 10 mejores sesiones (mayor accuracy)

optimal_duration = percentil_75(duraciones con accuracy > 80%)
```

**Como personaliza:**
- Al iniciar sesion: "Sesion optima para vos: 25 minutos (12 flashcards + 1 quiz corto)"
- Timer visual no intrusivo con "meta de hoy"
- Sesiones fragmentadas: si tiene 10 minutos, ofrecerle 6 flashcards especificas
- Micro-breaks sugeridos cada N minutos (basado en atencion historica)

**Integracion con Telegram/WhatsApp:**
- "Tienes 15 min libres? Aqui van 8 flashcards de Farmacologia" (con review flow interactivo)

**Esfuerzo:** 3-5 dias | **Impacto:** Medio-Alto | **Costo:** $0

---

### 1.5 Dashboard Personal Reconfigurable

**Que es:** El dashboard del alumno se reconfigura automaticamente segun su etapa del semestre y comportamiento.

**Etapas detectadas:**
| Etapa | Indicadores | Dashboard prioriza |
|-------|------------|-------------------|
| Inicio de semestre | Poca actividad, muchos topics sin tocar | Exploracion: mapa de contenido, videos, lectura |
| Ritmo de crucero | Actividad constante, streak activo | Mantenimiento: flashcards pendientes, mastery ring, streak |
| Pre-examen (< 14 dias) | Exam registrado, intensidad sube | Preparacion: countdown, debilidades, plan de repaso, prediccion |
| Post-examen | Actividad cae, exam pasado | Recuperacion: resumen de rendimiento, celebracion, next steps |
| Riesgo | 3+ dias sin actividad, fsrs overdue alto | Rescate: mensaje motivacional, sesion minima, streak recovery |

**Como funciona:**
- Cada widget del dashboard tiene una prioridad base
- Un `dashboardLayoutEngine` reordena widgets segun la etapa detectada
- El alumno puede fijar ("pin") widgets que quiere siempre visibles
- Los widgets que nunca usa se auto-ocultan despues de 2 semanas

**Esfuerzo:** 1-2 semanas | **Impacto:** Alto | **Costo:** $0

---

### 1.6 Mapa de Progreso Visual Personal 🔜 PROX

**Que es:** Un "mapa de aventura" visual donde cada topic es un nodo y el alumno ve su recorrido, como un arbol de habilidades de videojuego.

**Diferencia vs Knowledge Graph actual:**
- El KG actual muestra relaciones entre keywords (academico)
- Este mapa muestra el PROGRESO del alumno (motivacional)
- Usa los 5 colores de mastery (gray/red/yellow/green/blue) para colorear nodos
- Conecta topics por prerequisitos (no keywords)
- Nodos bloqueados (prerrequisitos no cumplidos) aparecen con candado

**Integracion:**
- `keyword_connections` ya tiene relaciones `requires`
- `bkt_states` ya tiene p_know por subtopico
- Visualizacion: reutilizar D3.js del KnowledgeGraph pero con layout de skill-tree

**Gamificacion:**
- Al desbloquear un nodo: animacion + XP + badge potencial
- "Caminos" sugeridos: "Si dominas Farmacologia basica, desbloqueas Farmacologia clinica"
- Porcentaje de mapa explorado visible en perfil

**Esfuerzo:** 2-3 semanas | **Impacto:** Muy Alto | **Costo:** $0

---

### 1.7 Objetivos Personales con Micro-Metas ✅ SPRINT 0 (consolidado con 3.1)

**Que es:** El alumno define sus propios objetivos ("Quiero dominar Cardio para el 15/04") y la plataforma descompone eso en micro-metas diarias.

**Como funciona:**
```
1. Alumno setea: "Dominar Cardiologia antes del 15/04"
2. Sistema calcula:
   - Subtopicos de Cardio: 24
   - Subtopicos con p_know < 0.75: 18
   - Dias hasta deadline: 24
   - Meta diaria: ~1 subtopico por dia
3. Cada dia, el sistema sugiere:
   - "Hoy: enfocate en Arritmias (p_know: 0.32)"
   - Sesion sugerida: 3 flashcards + 1 quiz + leer resumen
4. Al completar la meta diaria: micro-celebracion + XP bonus
5. Progress bar visual en dashboard
```

**Integracion con study_plans:**
- `study_plan_tasks` ya existe
- Agregar campo `auto_generated: boolean` para diferenciar tareas manuales de automaticas
- Agregar campo `linked_goal_id` para vincular a un objetivo personal

**Gamificacion:**
- Streak especifico del objetivo (diferente al streak global)
- Badge "Goal Crusher" al completar 3 objetivos
- Compartir logro con compas (opcional)

**Esfuerzo:** 1-2 semanas | **Impacto:** Alto | **Costo:** $0

---

## LOOP 2: IA Pura

> Ideas que REQUIEREN IA (LLM, embeddings, ML) y no funcionan sin ella.
> Aprovechan Gemini Flash (ya integrado) + OpenAI embeddings (ya integrado).

---

### 2.1 Mnemonicos Personalizados por IA 🔜 PROX

**Que es:** La IA genera trucos de memoria (mnemonicos, acronimos, analogias) adaptados a los INTERESES del alumno.

**Como funciona:**
1. El perfil cognitivo del alumno incluye "intereses" (futbol, gaming, cocina, musica, etc.)
2. Cuando el alumno falla una flashcard 2+ veces, el sistema genera un mnemonico:
   - Si le gusta el futbol: "Los betabloqueadores son como un DT que le dice al corazon 'mas lento, mas control'"
   - Si le gusta cocina: "La cascada de coagulacion es como una receta: factor X es la harina, sin ella no hay masa"
3. El mnemonico se guarda vinculado a la flashcard/keyword
4. En futuras revisiones, se muestra como hint opcional

**Prompt template:**
```
Genera un mnemonico para recordar: {concepto}
Definicion: {definition}
Contexto medico: {summary_chunk}
Intereses del alumno: {interests}
Reglas:
- Usa analogias del mundo de {primary_interest}
- Maximo 2 oraciones
- Debe ser memorable y un poco gracioso
- Cientificamente correcto
```

**Tabla nueva:**
```sql
CREATE TABLE personal_mnemonics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  keyword_id UUID REFERENCES keywords(id),
  flashcard_id UUID REFERENCES flashcards(id),
  mnemonic_text TEXT NOT NULL,
  mnemonic_type TEXT DEFAULT 'analogy', -- 'acronym', 'story', 'analogy', 'rhyme'
  effectiveness_score NUMERIC, -- se actualiza basado en si ayudo a recordar
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Metricas de efectividad:**
- Si despues de ver el mnemonico, el alumno acierta la card en la proxima revision: +1
- Si sigue fallando: el sistema genera uno nuevo con estrategia diferente

**Costo:** ~$3/mes (Gemini Flash, 1000 alumnos, ~5 mnemonicos/dia/alumno)
**Esfuerzo:** 1-2 semanas | **Impacto:** Alto

---

### 2.2 Explicaciones Multi-Nivel ("Explain Like I'm...") 🔜 PROX

**Que es:** Para cada concepto, el alumno puede elegir el nivel de profundidad de la explicacion, y la IA adapta el lenguaje, ejemplos y complejidad.

**Niveles:**
| Nivel | Nombre | Audiencia | Ejemplo para "Potencial de Accion" |
|-------|--------|-----------|-------------------------------------|
| 1 | Basico | Primer anio, sin base | "Es como una ola electrica que viaja por el nervio" |
| 2 | Intermedio | Entiende biologia celular | "Cambios de voltaje por apertura secuencial de canales Na+ y K+" |
| 3 | Avanzado | Entiende fisiologia | "Despolarizacion por INa transitoria, repolarizacion por IK rectificador tardio, con periodo refractario absoluto durante inactivacion de Na+" |
| 4 | Clinico | Aplicacion medica | "Relevante para: bloqueo AV (falla conduccion), anestesicos locales (bloqueo Na+), antiarritmicos clase I" |
| 5 | Examen | Formato de pregunta | "Pregunta tipica: Cual es el ion responsable de la fase 0 del potencial de accion cardiaco?" |

**Como funciona:**
1. El nivel default se detecta automaticamente via BKT:
   - p_know < 0.3 en prereqs del tema: nivel 1-2
   - p_know 0.3-0.7: nivel 2-3
   - p_know > 0.7: nivel 3-4
   - Pre-examen: nivel 5
2. El alumno puede subir/bajar nivel con botones +/-
3. El contenido se genera via Gemini y se cachea por (keyword_id, level)
4. Se reutiliza para todos los alumnos del mismo nivel (cache compartido)

**Integracion con RAG:**
- Cuando el alumno pregunta algo en el chat, el nivel de la respuesta se adapta automaticamente
- El system prompt del chat incluye: "El alumno tiene nivel {level} en {topic}. Responde acorde."

**Costo:** ~$5/mes (cacheo agresivo reduce llamadas a API)
**Esfuerzo:** 2-3 semanas | **Impacto:** Muy Alto

---

### 2.3 Simulador de Casos Clinicos con Branching Narrativo 🔜 PROX (renombrar a scenario_cases, adaptar por ano)

**Que es:** La IA genera un caso clinico interactivo donde el alumno toma decisiones y el caso evoluciona segun sus elecciones. Como un "Choose Your Own Adventure" medico.

**Como funciona:**
```
1. El sistema selecciona subtopicos debiles del alumno (BKT p_know < 0.5)
2. Gemini genera un caso clinico que REQUIERE esos conceptos para resolverse
3. El caso se presenta como narrativa:
   "Paciente masculino, 58 anios, llega a guardia con dolor precordial..."
4. El alumno elige acciones:
   a) Pedir ECG
   b) Administrar aspirina
   c) Pedir enzimas cardiacas
   d) Derivar a cirugia
5. Cada decision tiene consecuencias narrativas:
   - Correcta: "El ECG muestra supradesnivel ST en V1-V4. Buen llamado."
   - Incorrecta: "Administraste beta-bloqueador a un paciente con bradicardia. El paciente empeora."
   - Parcial: "Pediste enzimas pero tardaron 4 horas. Mientras tanto..."
6. Al final: debrief con explicacion de cada decision + link a keywords relevantes
```

**Tabla nueva:**
```sql
CREATE TABLE clinical_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id),
  topic_id UUID REFERENCES topics(id),
  title TEXT NOT NULL,
  initial_scenario TEXT NOT NULL,
  decision_tree JSONB NOT NULL, -- arbol de decisiones con consecuencias
  target_keywords UUID[] NOT NULL, -- keywords que evalua
  difficulty_level INTEGER DEFAULT 2, -- 1-5
  generated_by TEXT DEFAULT 'ai',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE case_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  case_id UUID NOT NULL REFERENCES clinical_cases(id),
  decisions JSONB NOT NULL, -- [{step: 1, choice: "a", correct: true}]
  score NUMERIC,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Gamificacion:**
- XP por completar caso (escala con dificultad)
- Badge "Diagnosticador" al completar 10 casos
- Badge "Sin Error" al completar caso perfecto
- Leaderboard de casos clinicos

**Costo:** ~$12/mes (casos son mas largos, ~5K tokens por caso)
**Esfuerzo:** 4-6 semanas | **Impacto:** Muy Alto (diferenciador clave)

---

### 2.4 Resumen Personalizado Auto-Generado

**Que es:** Para cada topic, la IA genera un resumen personalizado para el alumno basado en lo que ya sabe y lo que no, enfatizando sus debilidades y saltando lo que domina.

**Diferencia vs resumenes actuales:**
- El resumen del profesor es IGUAL para todos
- Este resumen es UNICO por alumno
- Si el alumno ya domina la introduccion, la salta
- Si tiene debilidad en un subtopico, lo expande con mas ejemplos

**Como funciona:**
```
1. Cargar bkt_states del alumno para el topic
2. Cargar summary chunks del topic via RAG
3. Para cada chunk:
   - Si el subtopico tiene p_know > 0.8: resumir en 1 oracion ("Ya dominas: ...")
   - Si p_know 0.5-0.8: mantener normal
   - Si p_know < 0.5: expandir con ejemplos adicionales + preguntas de autoevaluacion
4. Generar resumen personalizado via Gemini
5. Cachear por 7 dias (invalidar si bkt cambia significativamente)
```

**UI:**
- Seccion nueva en la vista de Summary: "Tu resumen personalizado"
- Secciones colapsables: verdes (dominas), amarillas (en progreso), rojas (enfocate aqui)
- Mini-quizzes inline en secciones debiles

**Costo:** ~$8/mes (Gemini Flash, resumenes cacheados)
**Esfuerzo:** 3-4 semanas | **Impacto:** Alto

---

### 2.5 Chat RAG con Personalidad Adaptable 🔜 PROX

**Que es:** El Axon AI Assistant actual tiene una sola personalidad. Esta mejora le da multiples "modos" que el alumno puede elegir o que se detectan automaticamente.

**Personalidades disponibles:**
| Modo | Estilo | Cuando se activa auto |
|------|--------|----------------------|
| Tutor Socratico | Solo hace preguntas, nunca da la respuesta directa | Alumno esta en zona de flujo (accuracy 70-90%) |
| Explicador | Da explicaciones claras, paso a paso | Alumno esta perdido (accuracy < 50%) |
| Retador | Presenta contraejemplos, cuestiona respuestas | Alumno esta confiado (accuracy > 95%) |
| Motivador | Celebra logros, recuerda progreso, anima | Alumno tiene streak en riesgo o engagement bajo |
| Clinico | Usa casos reales, conecta teoria con practica | Pre-examen o p_know > 0.7 en basics |
| Express | Respuestas ultra-cortas, tipo ficha tecnica | Alumno esta en sesion rapida (< 10 min) |

**Deteccion automatica:**
```
Si last_5_accuracy < 0.5: Explicador
Si last_5_accuracy > 0.95 AND streak > 7: Retador
Si days_since_last_session > 2: Motivador
Si exam_in_days < 14 AND p_know_avg > 0.7: Clinico
Si session_duration_target < 10min: Express
Default: Tutor Socratico
```

**El alumno puede override:** Boton selector de modo en la interfaz de chat

**Costo:** ~$0 extra (solo cambia el system prompt)
**Esfuerzo:** 1 semana | **Impacto:** Alto

---

### 2.6 Generador de Analogias Inter-Materias

**Que es:** La IA conecta conceptos de materias DIFERENTES para reforzar comprension. Ejemplo: "La cascada de coagulacion funciona como la cascada del complemento que viste en Inmunologia — ambas son cascadas de proteasas con amplificacion secuencial."

**Como funciona:**
1. Cuando el alumno estudia un concepto, la IA busca conceptos similares en OTROS cursos del alumno
2. Usa embeddings para encontrar keywords de otros cursos con alta similaridad semantica
3. Genera una analogia que conecta ambos conceptos
4. La muestra como "tip" en la interfaz

**SQL para encontrar conexiones inter-curso:**
```sql
-- Encontrar keywords similares en diferentes cursos
SELECT k1.name, k1.course_id, k2.name, k2.course_id,
       1 - (c1.embedding <=> c2.embedding) AS similarity
FROM keywords k1
JOIN chunks c1 ON c1.summary_id = k1.summary_id
JOIN chunks c2 ON c2.id != c1.id
JOIN keywords k2 ON k2.summary_id = c2.summary_id
WHERE k1.course_id != k2.course_id
  AND k1.course_id IN (SELECT course_id FROM memberships WHERE student_id = $1)
  AND 1 - (c1.embedding <=> c2.embedding) > 0.75
ORDER BY similarity DESC LIMIT 5;
```

**Costo:** ~$2/mes (pocas analogias, altamente cacheables)
**Esfuerzo:** 2 semanas | **Impacto:** Medio-Alto

---

### 2.7 Auto-Notas Inteligentes

**Que es:** Mientras el alumno estudia (lee resumenes, hace flashcards, responde quizzes), la IA genera automaticamente notas de repaso personalizadas basadas en sus interacciones.

**Como funciona:**
```
1. Tracking continuo durante sesion de estudio:
   - Keywords que miro (hover > 2s en popover)
   - Flashcards que fallo
   - Quiz questions que respondio incorrectamente
   - Secciones de summary donde paso mas tiempo

2. Al finalizar la sesion, la IA compila:
   "Notas de tu sesion del 22/03:
   - Fallaste 'betabloqueadores selectivos vs no selectivos' —
     Recorda: Selectivos (atenolol, metoprolol) actuan SOLO en B1.
     No selectivos (propranolol) actuan en B1 Y B2.
   - Leiste mucho sobre arritmias supraventriculares —
     dato clave: FA es la mas comun, tx con amiodarona o cardioversion."

3. Las notas se guardan y se pueden revisar despues
4. Se integran con la review session del dia siguiente como contexto
```

**Tabla:**
```sql
CREATE TABLE auto_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  session_id UUID REFERENCES study_sessions(id),
  topic_id UUID REFERENCES topics(id),
  content TEXT NOT NULL,
  source_interactions JSONB, -- que interacciones generaron esta nota
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Costo:** ~$4/mes (Gemini Flash, 1 compilacion por sesion)
**Esfuerzo:** 2-3 semanas | **Impacto:** Alto

---

## LOOP 3: Mixtas (IA + Reglas + Datos)

> Combinan logica deterministica con IA para el maximo impacto.

---

### 3.1 Learning Path Optimizer (Secuenciador Inteligente) ✅ SPRINT 0 (consolidado con 1.7)

**Que es:** Un sistema que calcula el ORDEN OPTIMO en que un alumno debe estudiar los topics de un curso, basado en prerequisitos, mastery actual y fecha de examen.

**Componentes:**

**A. Grafo de Prerequisitos (reglas):**
```
keyword_connections con type = 'requires' ya existe
→ Construir DAG (Directed Acyclic Graph) de topics
→ Topological sort = orden base
```

**B. Ponderacion por urgencia (reglas + datos):**
```
Para cada topic:
  urgency = (1 - bkt_avg_p_know) * weight_mastery
          + (days_to_exam / total_study_days) * weight_deadline
          + (prerequisite_for_count) * weight_unlocks

  // Un topic que es prerequisito de 5 otros tiene prioridad
```

**C. Secuenciacion final (IA):**
```
Gemini recibe: lista de topics con urgency scores + grafo de prerequisitos
Output: plan dia-a-dia con justificacion
"Dia 1: Anatomia Cardiaca (prerequisito de todo lo demas)
 Dia 2-3: Fisiologia del ECG (necesitas esto para Arritmias)
 Dia 4-5: Farmacologia cardiovascular (base para clinica)
 Dia 6-8: Arritmias (tu mayor debilidad, 3 dias para consolidar)"
```

**Visualizacion:**
- Timeline horizontal con nodos de topics
- Coloreado por mastery
- Drag-and-drop para que el alumno pueda reordenar (override manual)
- "Rutas alternativas" sugeridas: "Si te sentis bien con cardio, podes saltar a respiratorio"

**Esfuerzo:** 3-4 semanas | **Impacto:** Muy Alto | **Costo:** ~$2/mes

---

### 3.2 Spaced Repetition para Lectura (no solo flashcards)

**Que es:** Aplicar FSRS no solo a flashcards sino a SECCIONES de resumenes. El sistema recuerda que partes del resumen el alumno necesita releer.

**Como funciona:**
```
1. reading_states ya trackea % leido y tiempo por summary
2. NUEVO: trackear por CHUNK (seccion) del summary:
   - time_spent_on_chunk
   - scroll_speed (rapido = ya lo sabe, lento = dificil)
   - highlight_count (interaccion = interes)
3. Calcular "reading_mastery" por chunk:
   - Alto tiempo + bajo scroll = necesita repaso
   - Bajo tiempo + alto scroll = ya dominado
4. Aplicar FSRS al chunk:
   - Si reading_mastery bajo: programar re-lectura
   - Si alto: intervalos mas largos
5. En la vista de Summary, resaltar secciones que necesitan re-lectura:
   - Sidebar con "Secciones para repasar hoy" (como flashcards due)
```

**Tabla nueva:**
```sql
CREATE TABLE reading_chunk_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  chunk_id UUID NOT NULL REFERENCES chunks(id),
  time_spent_seconds INTEGER DEFAULT 0,
  scroll_speed NUMERIC, -- chars/second
  interactions INTEGER DEFAULT 0, -- highlights, clicks
  reading_mastery NUMERIC DEFAULT 0, -- 0-1
  fsrs_due_at TIMESTAMPTZ,
  fsrs_stability NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, chunk_id)
);
```

**Esfuerzo:** 3-4 semanas | **Impacto:** Alto | **Costo:** $0

---

### 3.3 Sistema de Alertas Contextuales Inteligentes

**Que es:** No mas notificaciones genericas. Cada alerta es hiper-personalizada y accionable, combinando datos de la DB con generacion de texto por IA.

**Tipos de alertas y triggers:**

| Alerta | Trigger (reglas) | Mensaje (IA genera) | Accion |
|--------|-----------------|---------------------|--------|
| Decaimiento de memoria | fsrs_stability cae 20% en 7 dias en 3+ cards del mismo topic | "Tu memoria de Farmaco esta bajando. 10 min de repaso hoy salvan 1 hora maniana." | Link a sesion de flashcards filtrada |
| Patron de error repetido | Mismo keyword errado 3+ veces en 14 dias | "Llevas 3 veces confundiendo atenolol con propranolol. Te explico la diferencia clave?" | Link a explicacion generada |
| Oportunidad de conexion | 2 keywords con embeddings similares en topics diferentes, ambos con p_know > 0.6 | "Ya dominas X en Cardio e Y en Farmaco. Sabian que estan conectados? Mira por que." | Link a analogia inter-materia |
| Desbloqueo de camino | Alumno alcanzo mastery en prerequisito | "Dominaste Anatomia Cardiaca! Eso desbloquea Arritmias. Listo para empezar?" | Link a topic nuevo |
| Streak en riesgo | 20:00 del dia sin actividad, streak > 3 dias | "Tu racha de {n} dias esta en juego. Una sesion de 5 min la salva." | Link a micro-sesion |
| Celebracion de hito | p_know cruzo 0.75 en un topic | "Acabas de dominar Cardiologia! Eso te ubica en el top 20% de tu curso." | Animacion + badge |

**Canal de entrega (segun preferencia):**
- In-app: siempre (banner/toast en dashboard)
- Telegram: si conectado + preference = true
- WhatsApp: si conectado + preference = true
- Email: solo alertas criticas (V2)

**Esfuerzo:** 2-3 semanas | **Impacto:** Alto | **Costo:** ~$3/mes (Gemini para generar mensajes)

---

### 3.4 Examen Simulacro Personalizado

**Que es:** Generar un examen simulacro completo que replica las condiciones reales: mismo formato, misma dificultad, mismo tiempo, pero con preguntas personalizadas a las debilidades del alumno.

**Como funciona:**
1. **Configuracion** (reglas):
   - El profesor define formato del examen: N preguntas MCQ, M desarrollo, tiempo X
   - El alumno elige fecha de simulacro

2. **Generacion** (IA):
   - 60% preguntas en subtopicos con p_know < 0.6 (debilidades)
   - 20% preguntas en subtopicos con p_know 0.6-0.8 (consolidacion)
   - 20% preguntas "sorpresa" en subtopicos con p_know > 0.8 (verificacion)
   - Las preguntas se generan via Gemini con contexto de chunks relevantes

3. **Ejecucion** (reglas):
   - Timer real (no pausable)
   - Sin acceso a material (se oculta sidebar)
   - Entrega automatica al terminar el tiempo

4. **Correccion** (IA):
   - MCQ: automatica
   - Desarrollo: Gemini evalua con rubrica + feedback por pregunta
   - Nota estimada + comparacion con nota de aprobacion

5. **Post-simulacro** (mixto):
   - Debrief detallado: que erraste, por que, que estudiar
   - Plan de repaso generado para los dias restantes hasta el examen real
   - Prediccion actualizada de probabilidad de aprobar

**Esfuerzo:** 4-6 semanas | **Impacto:** Muy Alto | **Costo:** ~$8/mes

---

### 3.5 Modo "Flow State" — Sesion de Estudio Inmersiva

**Que es:** Un modo de estudio sin distracciones donde la plataforma elimina TODO lo que no sea contenido de estudio y adapta lo que muestra en tiempo real.

**Como funciona:**
1. **Activacion:** Alumno clickea "Modo Focus" o se activa automaticamente si la sesion dura > 15 min
2. **UI cambia:**
   - Sidebar se oculta
   - Header se minimiza
   - Fondo cambia a modo oscuro suave
   - Timer visible pero no intrusivo
   - Notificaciones silenciadas
3. **Contenido adaptativo:**
   - Si esta haciendo flashcards y acierta 5 seguidas: sube dificultad automaticamente
   - Si falla 3 seguidas: ofrece "explicacion rapida" sin salir del flow
   - Si lleva 25 min: sugiere Pomodoro break (2 min)
   - Si el accuracy empieza a caer: sugiere parar y volver mas tarde
4. **Musica/sonido ambiente** (opcional):
   - Sonidos de lluvia, cafe, naturaleza (audio HTML5 nativo)
   - Sin dependencia externa
5. **Post-flow:** Resumen de la sesion con metricas + comparacion con sesiones anteriores

**Esfuerzo:** 2-3 semanas | **Impacto:** Alto | **Costo:** $0

---

## LOOP 4: Social y Emocional

> La dimension humana de la personalizacion. No todo es algoritmos.

---

### 4.1 Compas de Estudio (Peer Matching Simple)

**Que es:** Sin IA ni sesiones grupales complejas (eso ya esta en ideas-ia-seeki.md). Simplemente conectar alumnos que estudian lo mismo al mismo tiempo.

**Como funciona:**
- Cuando un alumno esta estudiando un topic, mostrar: "2 compas tambien estan estudiando Cardio ahora"
- Boton "Estudiar juntos" que abre un chat simple (texto) para esa sesion
- Sin IA moderando — solo conexion humana
- Se cierra automaticamente cuando ambos dejan de estudiar

**Privacidad:**
- Opt-in explicito
- Solo muestra nombre + avatar
- No revela mastery ni stats del otro alumno
- El alumno puede ser "invisible" si no quiere ser contactado

**Integracion tecnica:**
- Supabase Realtime (0 subscriptions actuales — oportunidad perfecta para primer uso)
- `presence` channel por topic

**Esfuerzo:** 1-2 semanas | **Impacto:** Medio | **Costo:** $0

---

### 4.2 Diario de Aprendizaje

**Que es:** Un espacio personal donde el alumno puede reflexionar sobre su aprendizaje. La plataforma lo guia con prompts basados en su actividad reciente.

**Prompts personalizados (basados en datos):**
- Post-sesion exitosa: "Hoy dominaste 3 keywords nuevos en Farmaco. Que te ayudo a entenderlos?"
- Post-sesion dificil: "Hoy fue un dia duro con Anatomia. Que se sintio dificil? Que te ayudaria a entenderlo mejor?"
- Hito de streak: "Llevas 14 dias seguidos. Como se siente mantener la constancia?"
- Pre-examen: "Faltan 5 dias para tu parcial. Como te sentis de preparado del 1 al 10?"
- Post-examen: "Como te fue? Que harias diferente la proxima vez?"

**El diario NO se comparte con nadie.** Es privado. Pero el alumno puede elegir compartir entradas especificas con el tutor IA para que lo conozca mejor.

**Tabla:**
```sql
CREATE TABLE learning_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  prompt_type TEXT, -- 'post_session', 'milestone', 'pre_exam', etc.
  entry_text TEXT NOT NULL,
  mood INTEGER, -- 1-5 emoji scale
  shared_with_tutor BOOLEAN DEFAULT false,
  related_topic_id UUID REFERENCES topics(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Beneficio metacognitivo:** La reflexion mejora el aprendizaje (efecto spacing + retrieval practice aplicado a la metacognicion).

**Esfuerzo:** 1-2 semanas | **Impacto:** Medio | **Costo:** $0

---

### 4.3 Sistema de Reconocimiento de Esfuerzo (no solo Resultado) ✅ SPRINT 0

**Que es:** La gamificacion actual premia RESULTADOS (accuracy, mastery, XP). Esta idea premia ESFUERZO: constancia, mejora, resiliencia.

**Badges de esfuerzo nuevos:**
| Badge | Criterio | Mensaje |
|-------|----------|---------|
| "Guerrero" | 3 sesiones en un dia donde accuracy fue < 50% (no se rindio) | "No fue facil, pero no paraste. Eso vale mas que cualquier nota." |
| "Remontada" | p_know subio de < 0.3 a > 0.7 en un topic en 14 dias | "De cero a heroe en 2 semanas. Eso es dedicacion." |
| "Madrugador" | 5 sesiones antes de las 7am en un mes | "Mientras otros duermen, vos avanzas." |
| "Nocturno" | 5 sesiones despues de las 23pm en un mes | "Las mejores ideas llegan de noche." |
| "Resiliente" | Rompio streak de 14+ dias y lo reconstruyo a 7+ | "Caiste, pero volviste mas fuerte." |
| "Explorador" | Estudio 5+ topics diferentes en una semana | "Curiosidad insaciable." |
| "Profundizador" | 3+ horas en un solo topic en una semana | "La maestria viene de la profundidad." |
| "Primer Paso" | Primer sesion de estudio en la plataforma | "Todo experto empezo como principiante. Bienvenido." |

**Notificaciones personalizadas:**
- No "Desbloqueaste un badge" generico
- Personalizado: "Llevas 3 sesiones hoy a pesar de que Farmaco esta dificil. Eso es caracter. Badge 'Guerrero' desbloqueado."

**Esfuerzo:** 1 semana | **Impacto:** Alto | **Costo:** $0

---

### 4.4 Onboarding Personalizado

**Que es:** Los primeros 7 dias del alumno en la plataforma son criticos. Este sistema adapta la experiencia inicial segun las respuestas del alumno.

**Flujo:**
```
Dia 0: Cuestionario de entrada (5 preguntas)
  1. "En que anio estas?" → calibra dificultad base
  2. "Que materia te cuesta mas?" → prioriza ese curso
  3. "Cuantas horas por dia podes estudiar?" → calibra metas diarias
  4. "Como preferis estudiar?" (flashcards/lectura/quizzes/video) → formato default
  5. "Tenes algun examen proximo?" → activa modo pre-examen si < 30 dias

Dia 1: Tour guiado personalizado
  - Si prefiere flashcards: empieza por flashcard review
  - Si prefiere lectura: empieza por summary viewer
  - Meta del dia: completar 1 sesion corta (10 min max)

Dia 2-3: Primer sesion real
  - Dificultad calibrada a su anio
  - Pocos items (5-8 flashcards o 1 quiz corto)
  - Celebracion exagerada: "Genial! Ya tenes tu primer dia de estudio!"

Dia 4-5: Descubrimiento
  - Introducir features que no uso: "Probaste el mapa mental? Mira como conecta lo que estudiaste"
  - Primer badge facil de desbloquear

Dia 6-7: Habito
  - "Llevas 7 dias! Tu primer streak badge desbloqueado"
  - Sugerir configurar notificaciones
  - Establecer meta semanal
```

**Metricas:**
- % de alumnos que completan onboarding
- Retencion D7, D14, D30 (comparar con/sin onboarding personalizado)
- Engagement promedio post-onboarding

**Esfuerzo:** 2-3 semanas | **Impacto:** Muy Alto | **Costo:** $0

---

### 4.5 Feedback Loop Alumno → Profesor 🔜 PROX

**Que es:** El alumno puede dar feedback anonimo sobre el contenido que le resulta confuso, y el profesor recibe un reporte agregado de "que no se entiende".

**Como funciona:**
1. En cada summary/flashcard/quiz, boton sutil "No entendi esto"
2. El alumno puede agregar comentario opcional (privado, anonimo)
3. La plataforma agrega: "15 alumnos marcaron 'Betabloqueadores selectivos' como confuso"
4. El profesor ve un dashboard con:
   - Keywords mas marcados como confusos
   - Correlacion con quiz accuracy (keywords confusos + bajo p_know = contenido problematico)
   - Sugerencia automatica: "Considere expandir la explicacion de X"

**Beneficio para personalizacion:**
- El profesor mejora el contenido = todos los alumnos se benefician
- Los keywords marcados se priorizan para mnemonicos/explicaciones extra por IA
- Crea un ciclo virtuoso: contenido mejora → comprension mejora → mastery sube

**Esfuerzo:** 1-2 semanas | **Impacto:** Alto | **Costo:** $0

---

## LOOP 5: Visionarias (Con Prerrequisitos)

> Ideas que requieren nuevas integraciones, infraestructura, o datos que aun no tenemos.
> Horizonte: 12-24 meses.

---

### 5.1 Digital Twin Academico

**Prerequisito:** 6+ meses de datos de un alumno en la plataforma

**Que es:** Un modelo predictivo completo del alumno que simula su comportamiento de aprendizaje. Responde preguntas como: "Si estudio 2 horas extra de Farmaco esta semana, cuanto sube mi mastery?" o "Si no estudio nada por 5 dias, cuanto pierdo?"

**Como funciona:**
```
1. Modelo entrenado con datos historicos del alumno:
   - Input: horas de estudio, formato, topic, contexto (pre-exam vs normal)
   - Output: delta de p_know por subtopico

2. Simulacion "what-if":
   - "Si hago 20 flashcards/dia de Farmaco por 7 dias"
   - El modelo predice: p_know sube de 0.42 a 0.71
   - Visualizacion: grafico de antes/despues del mastery ring

3. Recomendacion optima:
   - "Para maximizar tu mastery total en 10 horas de estudio, la distribucion optima es:
     4h Farmaco + 3h Cardio + 2h Anatomia + 1h Fisiologia"
```

**Prerequisitos tecnicos:**
- Suficientes datos historicos (minimo 1 semestre por alumno)
- Modelo ML por alumno (lightweight, tipo regresion lineal o XGBoost mini)
- Edge Function con ONNX runtime (ya propuesto en ideas existentes)

**Esfuerzo:** 8-12 semanas | **Impacto:** Muy Alto | **Costo:** ~$5/mes

---

### 5.2 Integracion con Calendario Personal (Google/Apple)

**Prerequisito:** OAuth con Google Calendar API / Apple Calendar

**Que es:** La plataforma sabe cuando el alumno tiene horas libres y sugiere sesiones de estudio en esos huecos.

**Como funciona:**
```
1. Alumno conecta Google Calendar (OAuth, read-only)
2. Sistema analiza:
   - Bloques libres > 15 min
   - Horarios peak del alumno (de Learning DNA)
   - Flashcards/reviews pendientes
3. Sugiere: "Tenes 45 min libres entre las 14:00 y 14:45.
   Sesion sugerida: 20 min flashcards Farmaco + 10 min quiz Cardio + 15 min lectura Anatomia"
4. El alumno puede aceptar y se crea un evento en su Google Calendar:
   "Axon Study Session - Farmaco + Cardio" con link directo a la app
```

**Tambien permite:**
- Bloquear automaticamente "horarios de estudio" en el calendario
- Detectar examenes del calendario academico y crear countdowns automaticos
- Sincronizar study_plan_tasks como eventos del calendario

**Esfuerzo:** 3-4 semanas | **Impacto:** Alto | **Costo:** $0 (Google Calendar API gratuita)

---

### 5.3 Voice-First Learning (Estudio en Movimiento)

**Prerequisito:** Web Speech API / React Native (si hay mobile app)

**Que es:** El alumno puede estudiar con las manos libres — caminando, en el transporte, haciendo ejercicio.

**Modos:**
1. **Flashcard por Voz:**
   - Sistema lee la pregunta en voz alta
   - Alumno responde verbalmente
   - IA evalua si la respuesta es correcta (speech-to-text + Gemini)
   - "Correcto! Siguiente card..."

2. **Repaso por Audio:**
   - Generar version audio del resumen personalizado (TTS)
   - Como un podcast educativo personalizado
   - Pausar/resumir con voz

3. **Quiz Oral:**
   - IA hace preguntas verbalmente
   - Alumno responde con voz
   - IA da feedback inmediato

**Integracion con OpenAI Realtime:**
- Ya tienen la infra de voice sessions
- Extender para soportar flashcard/quiz flow estructurado (no solo chat libre)

**Esfuerzo:** 4-6 semanas | **Impacto:** Alto | **Costo:** ~$15/mes (Realtime API es cara)

---

### 5.4 Learning Analytics Avanzados para el Alumno

**Prerequisito:** 30+ dias de datos del alumno

**Que es:** Un panel de analiticas profundas que le muestra al alumno patrones de su propio aprendizaje que no puede ver a simple vista.

**Visualizaciones:**
1. **Curva de Olvido Personal:**
   - Grafico que muestra como decae su memoria por topic
   - Basado en fsrs_stability real
   - "Tu memoria de Farmaco decae a 50% en 4 dias. La de Anatomia en 8 dias."

2. **Heatmap de Actividad:**
   - Estilo GitHub contributions pero para estudio
   - Colores = intensidad de estudio por dia
   - Patrones visibles: "Estudias mucho los domingos y poco los miercoles"

3. **Radar de Habilidades:**
   - Grafico radar con cada materia/topic como eje
   - p_know como radio
   - Comparacion con: hace 1 mes, hace 1 semana, promedio del curso (anonimizado)

4. **Tendencias de Accuracy:**
   - Line chart de accuracy por semana
   - Separado por formato (flashcards vs quizzes)
   - Detectar si esta mejorando o estancado

5. **Time-to-Mastery:**
   - Para cada topic: cuanto tardo en llegar a mastery (p_know > 0.75)
   - Prediccion: "A tu ritmo actual, dominaras Cardio en ~12 dias"

6. **Comparacion Consigo Mismo:**
   - "Esta semana vs la semana pasada"
   - "Este mes vs el mes pasado"
   - NUNCA comparacion con otros alumnos (a menos que opt-in en leaderboard)

**Esfuerzo:** 3-4 semanas | **Impacto:** Alto | **Costo:** $0

---

### 5.5 Plataforma de Creacion de Contenido por Alumnos

**Prerequisito:** Moderacion de contenido + sistema de votacion

**Que es:** Los alumnos pueden crear flashcards, mnemonicos, y explicaciones para compartir con sus companeros. Los mejores se integran al contenido oficial.

**Como funciona:**
```
1. Alumno crea flashcard/mnemonico/explicacion
2. Se marca como "contenido comunitario"
3. Otros alumnos votan (upvote/downvote)
4. Top contenido:
   - Se muestra a otros alumnos como alternativa
   - El profesor puede "promover" a contenido oficial
   - El creador recibe XP bonus ("Contributor" badge)
5. Moderacion:
   - IA filtra contenido inapropiado
   - Profesor puede vetar cualquier contenido
   - Report system para alumnos
```

**Gamificacion:**
| Badge | Criterio |
|-------|----------|
| "Contributor" | Primera pieza de contenido compartida |
| "Popular" | 10+ upvotes en una pieza de contenido |
| "Professor in Training" | 5+ piezas promovidas a contenido oficial |
| "Community Champion" | 50+ upvotes totales |

**Esfuerzo:** 4-6 semanas | **Impacto:** Alto | **Costo:** $0

---

### 5.6 Adaptive Testing (CAT — Computerized Adaptive Testing)

**Prerequisito:** Item Response Theory (IRT) model calibrado

**Que es:** Un sistema de evaluacion donde cada pregunta se selecciona basada en la respuesta anterior, convergiendo rapidamente en el nivel real del alumno.

**Como funciona:**
```
1. Se estima theta_0 (habilidad inicial) del alumno via p_know promedio
2. Se selecciona primera pregunta con dificultad cercana a theta_0
3. Si responde correctamente: theta sube, se selecciona pregunta mas dificil
4. Si responde incorrectamente: theta baja, se selecciona pregunta mas facil
5. Converge en ~10-15 preguntas (vs 30-40 en test fijo)
6. Resultado: estimacion precisa de habilidad con intervalo de confianza
```

**Beneficios:**
- Tests 60% mas cortos con misma precision
- Cada alumno ve preguntas diferentes
- Detecta el nivel exacto (no "aprobado/desaprobado" binario)
- Se integra con BKT para actualizar p_know mas rapidamente

**Prerequisitos:**
- Banco de preguntas calibradas (dificultad + discriminacion por IRT)
- Modelo 2PL o 3PL calibrado con datos historicos
- Minimo ~500 respuestas por pregunta para calibrar

**Esfuerzo:** 6-8 semanas | **Impacto:** Muy Alto | **Costo:** $0 (corre localmente)

---

## LOOP 6: Metacognicion — Ensenar a Aprender

> No basta con personalizar el contenido. Hay que ensenarle al alumno a CONOCERSE como aprendiz.
> Estas ideas hacen al alumno consciente de sus propios procesos cognitivos.

---

### 6.1 Coach de Tecnicas de Estudio

**Que es:** La plataforma detecta como estudia el alumno y le sugiere tecnicas mas efectivas, basadas en ciencia cognitiva.

**Deteccion de anti-patrones:**
| Anti-patron | Como se detecta | Intervencion |
|-------------|----------------|-------------|
| Relectura pasiva | `reading_states.time_spent` alto pero `quiz_accuracy` bajo en ese topic | "Leer no es estudiar. Proba hacer flashcards mientras lees — tu retencion sube 3x." |
| Cramming | 80%+ de actividad en ultimos 3 dias pre-examen | "Estudiar todo junto no funciona. La proxima vez, distribuye: 30min/dia x 14 dias > 7h el dia anterior." |
| Solo formato facil | 90%+ del tiempo en un solo formato | "Diversificar formatos mejora retencion. Proba un quiz sobre lo que leiste." |
| Evitacion de debilidades | No toca topics con p_know < 0.3 en 14+ dias | "Estas evitando Farmaco. Es normal — lo dificil da miedo. Empeza con 5 flashcards faciles." |
| Sesiones largas sin pausa | Sesiones > 90 min sin break, accuracy cae ultimo 30% | "Tus ultimos 30 min fueron poco productivos. Sesiones de 45 min + 10 min pausa rinden mas." |
| Review sin retrieval | Solo lee flashcards sin intentar responder (flip rapido < 3s) | "Estas viendo las respuestas sin pensar. Intenta responder antes de girar la card." |

**Niveles de intervencion:**
1. **Sutil:** Tip en el dashboard (primera vez)
2. **Directo:** Notificacion con datos ("Tu accuracy cae 30% despues de 60 min")
3. **Interactivo:** El tutor IA sugiere un "experimento": "Esta semana proba estudiar en bloques de 25 min. Te aviso como cambia tu rendimiento."

**Ciencia detras:**
- Retrieval practice (Roediger & Karpicke, 2006)
- Spacing effect (Ebbinghaus, revalidado por Cepeda et al., 2006)
- Interleaving (Rohrer & Taylor, 2007)
- Testing effect (cada quiz es mejor que releer 3 veces)

**Esfuerzo:** 2-3 semanas | **Impacto:** Muy Alto | **Costo:** $0 (reglas) / ~$2/mes (si IA genera mensajes)

---

### 6.2 Mapa de Confianza vs Competencia ❌ NO

**Que es:** Visualizar la discrepancia entre lo que el alumno CREE que sabe y lo que REALMENTE sabe. El efecto Dunning-Kruger aplicado al estudio.

**Como funciona:**
```
1. Antes de cada quiz, preguntar:
   "Del 1 al 5, que tan preparado te sentis para este tema?"
   → confidence_pre = respuesta del alumno

2. Despues del quiz:
   → competence_actual = quiz_score

3. Calcular discrepancia:
   Si confidence > competence: "Sobreconfianza" (rojo)
   Si confidence < competence: "Subestimacion" (azul)
   Si confidence ≈ competence: "Calibrado" (verde)

4. Visualizar en scatter plot:
   Eje X: Confianza declarada
   Eje Y: Performance real
   Linea diagonal = calibracion perfecta
   Puntos arriba = subestima (puede relajar)
   Puntos abajo = sobreconfia (peligro)
```

**UI:**
```
+-------------------------------------------+
|  Tu Mapa de Calibracion                   |
|                                           |
|  Performance  ^                           |
|  real         |     * Anatomia (calibrado)|
|               |  * Cardio (subestimas)    |
|               |           * Farmaco       |
|               |             (sobreconfias)|
|               +------------------------> |
|                 Confianza declarada        |
|                                           |
|  "Cuidado con Farmaco: crees que lo       |
|   dominas pero tu accuracy es 52%"        |
+-------------------------------------------+
```

**Integracion con alertas:**
- Si sobreconfianza + exam < 14 dias: alerta critica
- Si subestimacion consistente: mensaje motivacional
- El tutor IA menciona: "Se que sentis que Anatomia es dificil, pero tus numeros dicen que lo estas haciendo bien"

**Tabla nueva:**
```sql
CREATE TABLE confidence_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  topic_id UUID NOT NULL REFERENCES topics(id),
  confidence_score INTEGER NOT NULL CHECK (confidence_score BETWEEN 1 AND 5),
  actual_score NUMERIC, -- llenado post-quiz
  quiz_id UUID REFERENCES quizzes(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Esfuerzo:** 1-2 semanas | **Impacto:** Alto | **Costo:** $0

---

### 6.3 Revision de Errores con Patron Detective

**Que es:** En lugar de solo decir "erraste", la plataforma categoriza POR QUE el alumno erra y le muestra su "perfil de errores".

**Taxonomia de errores medicos:**
| Tipo de error | Ejemplo | Deteccion |
|--------------|---------|-----------|
| Confusion de terminos similares | Atenolol vs Propranolol | Mismas 2 keywords alternadas en errores |
| Error conceptual | "Los betabloqueadores dilatan coronarias" | Respuesta contradice definicion del keyword |
| Error de aplicacion | Sabe la teoria pero falla en caso clinico | Acierta flashcards pero falla quizzes clinicos |
| Olvido temporal | Sabia hace 2 semanas, hoy no | fsrs_stability alta pero fallo |
| Adivinanza | Responde rapido y sin patron | response_time < 5s + accuracy cercana a 25% (1/4 MCQ) |
| Error por distraccion | Respuestas incorrectas en sesiones largas | Accuracy cae en ultimos 20% de sesion |

**Deteccion (mezcla reglas + IA):**
```
Reglas:
- Si falla keyword X y luego keyword Y, y X.embedding <=> Y.embedding > 0.85
  → "Confusion de terminos similares"
- Si response_time < 5s AND accuracy < 30%
  → "Adivinanza"
- Si accuracy_first_half > accuracy_second_half * 1.3
  → "Error por distraccion"

IA (para errores conceptuales):
- Enviar respuesta incorrecta + respuesta correcta + keyword a Gemini
- Prompt: "Clasifica el tipo de error: conceptual, de memoria, de aplicacion, o de atencion"
```

**Perfil de errores del alumno:**
```
+-------------------------------------------+
|  Tu Perfil de Errores (ultimo mes)        |
|                                           |
|  Confusion de terminos  ████████ 35%      |
|  Error conceptual       █████ 22%         |
|  Olvido temporal        ████ 18%          |
|  Error de aplicacion    ███ 13%           |
|  Distraccion            ██ 8%             |
|  Adivinanza             █ 4%              |
|                                           |
|  Recomendacion: Tu principal desafio es   |
|  diferenciar terminos similares. Proba    |
|  hacer tablas comparativas.               |
+-------------------------------------------+
```

**Acciones automaticas por tipo de error:**
- Confusion → Generar flashcard comparativa ("Diferencias entre X e Y")
- Conceptual → Link a explicacion IA del concepto
- Olvido → Reducir intervalo FSRS para esas cards
- Aplicacion → Sugerir caso clinico
- Distraccion → Sugerir sesiones mas cortas
- Adivinanza → Bloquear "siguiente" por 10 segundos (anti-skip)

**Esfuerzo:** 3-4 semanas | **Impacto:** Muy Alto | **Costo:** ~$3/mes (Gemini para clasificar errores)

---

### 6.4 "Teach-Back" Individual

**Que es:** El alumno le "explica" un concepto al tutor IA, y la IA evalua si la explicacion es correcta y completa. Basado en la piramide de aprendizaje: ensenar = retencion del 90%.

**Flujo:**
```
1. Alumno completa un topic (p_know > 0.7)
2. La plataforma sugiere: "Parece que dominas Arritmias. Podes explicarlo?"
3. El alumno escribe o graba (voz) su explicacion
4. Gemini evalua:
   - Correctitud: conceptos erroneos?
   - Completitud: faltan aspectos clave?
   - Claridad: se entiende?
5. Feedback:
   "Buena explicacion! Pero olvidaste mencionar que la FA puede ser paroxistica.
    Tu explicacion cubrio 7/10 conceptos clave. Podes agregar los que faltan?"
6. Si pasa: XP bonus + badge "Maestro de Arritmias"
7. Si no pasa: se identifican gaps → se generan flashcards para esos gaps
```

**Prompt para evaluacion:**
```
Evalua esta explicacion del alumno sobre {topic}:
"{student_explanation}"

Conceptos clave que DEBE incluir: {keywords_with_definitions}

Responde en JSON:
{
  "score": 0-10,
  "correct_concepts": ["..."],
  "missing_concepts": ["..."],
  "incorrect_concepts": [{"said": "...", "should_be": "..."}],
  "feedback": "..."
}
```

**Esfuerzo:** 2-3 semanas | **Impacto:** Alto | **Costo:** ~$4/mes

---

## LOOP 7: Profesor-Side — Personalizacion del Creador de Contenido

> El profesor tambien merece una plataforma personalizada.
> Si el profesor crea mejor contenido, TODOS los alumnos se benefician.

---

### 7.1 Dashboard de Debilidades Colectivas

**Que es:** El profesor ve un mapa de calor de donde TODOS sus alumnos luchan, para saber donde mejorar su contenido.

**Visualizacion:**
```
+-----------------------------------------------------------+
|  Mapa de Debilidades — Cardiologia (45 alumnos)           |
|                                                           |
|  Topic              | p_know prom | Alumnos < 0.5 | Trend|
|  -------------------|-------------|---------------|------|
|  Anatomia cardiaca  | 0.78        | 5 (11%)       |  ↑   |
|  ECG basico         | 0.65        | 12 (27%)      |  →   |
|  Arritmias          | 0.41        | 28 (62%)      |  ↓   |  ← CRITICO
|  Farmaco cardio     | 0.38        | 31 (69%)      |  ↓   |  ← CRITICO
|  ICC                | 0.55        | 18 (40%)      |  →   |
|                                                           |
|  Sugerencias IA:                                          |
|  - "Arritmias: 62% de alumnos no domina. Considere       |
|    agregar mas ejemplos de ECG con arritmias comunes."    |
|  - "Farmaco: los alumnos confunden selectivos vs no       |
|    selectivos. Una tabla comparativa ayudaria."           |
+-----------------------------------------------------------+
```

**Datos:** Todo viene de `bkt_states` agregado por course + topic. Zero infra nueva.

**Acciones del profesor:**
- Click en topic critico → ver keywords especificos problematicos
- "Generar material de refuerzo" → IA crea flashcards/explicaciones extras
- "Programar sesion de repaso" → crea quiz focusado para la clase

**Esfuerzo:** 2-3 semanas | **Impacto:** Alto | **Costo:** ~$1/mes (sugerencias IA)

---

### 7.2 Asistente de Creacion de Contenido para Profesor

**Que es:** Cuando el profesor crea un summary/flashcard/quiz, la IA sugiere mejoras en tiempo real.

**Sugerencias mientras escribe:**
| Trigger | Sugerencia |
|---------|-----------|
| Summary sin keywords marcados | "Este parrafo menciona 'atenolol' pero no es un keyword. Queres agregarlo?" |
| Flashcard con respuesta > 100 palabras | "Respuesta muy larga. Los alumnos retienen mejor respuestas de 1-2 oraciones." |
| Quiz con todas las opciones de largo similar | "Las respuestas correctas tienden a ser mas largas. Variando el largo evitas que adivinen." |
| Topic sin flashcards | "Este topic tiene summary pero no flashcards. Queres que genere 10?" |
| Keyword sin conexiones | "'{keyword}' no esta conectado a ningun otro concepto. Sugerir conexiones?" |
| Summary sin imagenes | "Los resumenes con imagenes tienen 40% mas engagement. Queres agregar una?" |

**Analisis post-publicacion:**
- Despues de 2 semanas: "Tu resumen de Arritmias tiene accuracy promedio de 45%. Los alumnos luchan con la seccion sobre FA. Queres expandirla?"
- Comparacion con otros topics: "Tus flashcards de Anatomia tienen 82% accuracy. Las de Farmaco 41%. El contenido de Farmaco necesita atencion."

**Esfuerzo:** 3-4 semanas | **Impacto:** Alto | **Costo:** ~$3/mes

---

### 7.3 Generador de Examenes Inteligente para Profesor

**Que es:** El profesor quiere armar un parcial. La plataforma le sugiere preguntas basadas en que conceptos son mas importantes Y donde los alumnos tienen debilidades.

**Flujo:**
```
1. Profesor selecciona: "Armar parcial de Cardiologia"
2. Sistema analiza:
   - Keywords con clinical_priority alta
   - Subtopicos con p_know promedio bajo (donde MAS alumnos luchan)
   - Preguntas que nunca se evaluaron (coverage gaps)
3. Genera examen balanceado:
   - 30% facil (p_know promedio > 0.7) — para que no sea masacre
   - 50% medio (p_know 0.4-0.7) — discrimina bien
   - 20% dificil (p_know < 0.4) — para los mejores
4. Profesor revisa, edita, aprueba
5. Post-examen: El sistema compara resultado real vs prediccion
```

**Diferencia vs quizzes actuales:**
- Los quizzes actuales los genera el alumno para si mismo
- Este examen lo genera el profesor para TODA la clase
- Incluye variantes (Version A/B/C con preguntas equivalentes)

**Esfuerzo:** 4-5 semanas | **Impacto:** Muy Alto | **Costo:** ~$5/mes

---

### 7.4 Alertas Tempranas para Profesor (Alumno en Riesgo)

**Que es:** El profesor recibe alertas cuando un alumno muestra seniales de riesgo academico. SOLO si el alumno dio consentimiento (opt-in).

**Alertas:**
| Alerta | Trigger | Accion sugerida |
|--------|---------|----------------|
| "Alumno inactivo" | 7+ dias sin actividad | "Juan no estudio hace 10 dias. Considere contactarlo." |
| "Caida de rendimiento" | p_know promedio bajo 15% en 14 dias | "Maria paso de 72% a 55% en Farmaco esta quincena." |
| "Patron de error sistematico" | Mismo keyword errado 5+ veces en 30 dias | "Pedro confunde sistematicamente X con Y." |
| "Preparacion insuficiente" | Exam < 14 dias AND p_know < 0.4 AND study_frequency < 0.3 | "Laura tiene parcial en 10 dias pero su prep es 38%." |

**Privacidad (CRITICO):**
- Default: OFF. El alumno debe activar explicitamente "compartir mi progreso con el profesor"
- El profesor NUNCA ve flashcards individuales ni diario ni conversaciones con IA
- Solo ve: p_know agregado por topic, frecuencia de estudio, dias activos
- El alumno puede revocar en cualquier momento
- LGPD/GDPR: datos anonimizables, derecho a borrado

**Esfuerzo:** 2-3 semanas | **Impacto:** Alto | **Costo:** $0

---

### 7.5 Templates de Curso Personalizables

**Que es:** Cuando un profesor crea un curso nuevo, puede elegir un template basado en la materia. El template pre-configura: estructura de topics, clinical_priority de keywords, formato recomendado de contenido.

**Templates:**
| Template | Estructura sugerida | Formato prioritario |
|----------|-------------------|-------------------|
| Anatomia | Regiones corporales → Sistemas → Organos | Visual (imagenes, 3D) |
| Farmacologia | Familias de drogas → Mecanismos → Clinica | Tablas comparativas, flashcards |
| Fisiologia | Sistemas → Procesos → Regulacion | Diagramas de flujo, quizzes |
| Patologia | Organo → Patologia → Diagnostico → Tratamiento | Casos clinicos |
| Semiologia | Aparato → Inspeccion → Palpacion → Percusion → Auscultacion | Video, checklist |

**IA assist:** Al seleccionar template, Gemini genera una propuesta de topics/subtopics basada en el syllabus de la materia (el profesor puede pegar el programa de la catedra).

**Esfuerzo:** 2-3 semanas | **Impacto:** Medio-Alto | **Costo:** ~$1/mes

---

## LOOP 8: Data Flywheel y Monetizacion

> Como cada feature alimenta a las demas, y como convertir personalizacion en revenue.

---

### 8.1 El Flywheel de Datos de Axon

**Concepto:** Cada interaccion del alumno mejora la plataforma para TODOS.

```
                    ┌─────────────────────────┐
                    │ Alumno estudia           │
                    │ (genera datos)           │
                    └──────────┬──────────────┘
                               │
                    ┌──────────▼──────────────┐
                    │ BKT/FSRS se actualizan   │
                    │ (mastery, stability)      │
                    └──────────┬──────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼──────┐ ┌──────▼──────┐ ┌──────▼──────────┐
    │ Smart Generate │ │ Predictor   │ │ Prof Dashboard   │
    │ mejora         │ │ mas preciso │ │ detecta gaps     │
    └─────────┬──────┘ └──────┬──────┘ └──────┬──────────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                    ┌──────────▼──────────────┐
                    │ Contenido se adapta      │
                    │ (mejor para TODOS)       │
                    └──────────┬──────────────┘
                               │
                    ┌──────────▼──────────────┐
                    │ Alumno estudia mejor     │
                    │ (genera mas datos)       │
                    └─────────────────────────┘
                               ↻ FLYWHEEL
```

**Aceleradores del flywheel:**
1. **Mas alumnos** → mas datos → mejores predicciones → mejor experiencia → mas alumnos
2. **Mas contenido** → mas chunks → mejor RAG → mejores respuestas → mas engagement
3. **Mas errores** → mejores patrones de error → mejores mnemonicos → menos errores
4. **Mas profesores** → mas templates validados → onboarding mas rapido → mas profesores

**Metricas del flywheel:**
- Time-to-value: cuantas sesiones hasta que el alumno "siente" la personalizacion
- Data density: interacciones/alumno/semana
- Prediction accuracy: % de alertas que el alumno confirma como utiles
- Content quality: accuracy promedio por pieza de contenido

---

### 8.2 Personalizacion como Feature Premium

**Que es:** Algunas features de personalizacion se convierten en el diferenciador del plan Pro vs Free.

**Propuesta de segmentacion:**

| Feature | Free | Pro |
|---------|------|-----|
| Flashcards + FSRS | Si | Si |
| Quizzes + BKT | Si | Si |
| Resumenes | Si | Si |
| RAG Chat (5 msg/dia) | Si | Ilimitado |
| Ritmo circadiano | No | Si |
| Mnemonicos personalizados | No | Si |
| Explicaciones multi-nivel | Nivel 1-2 | Todos |
| Casos clinicos | 1/semana | Ilimitado |
| Learning Path Optimizer | Basico | Completo |
| Modo Flow | No | Si |
| Analytics avanzados | Basico | Completo |
| Digital Twin | No | Si |
| Voice-First | No | Si |
| Tutor IA con memoria | No | Si |
| Dashboard reconfigurable | No | Si |
| Mapa de confianza | No | Si |
| Auto-notas | No | Si |
| Alertas inteligentes | Basicas | Completas + WhatsApp |

**Pricing sugerido:**
- **Free**: Suficiente para estudiar efectivamente (no crippled)
- **Pro Individual** ($5-8 USD/mes): Todas las features de personalizacion
- **Pro Institucional** ($3-5 USD/alumno/mes): Todo + profesor dashboard + analytics

**La clave:** Free debe ser BUENO (si no, no hay flywheel). Pro debe ser IRRESISTIBLE (porque ya probaste free y ves lo que te falta).

---

### 8.3 Benchmark Anonimizado Inter-Institucional

**Que es:** Agregar datos anonimizados de TODAS las instituciones para crear benchmarks. "Tus alumnos dominan Anatomia mejor que el 75% de las instituciones".

**Beneficios:**
- El profesor sabe si su contenido es efectivo vs el promedio
- La institucion sabe si sus resultados son competitivos
- Los alumnos ven "top 10% nacional" (si opt-in)

**Privacidad:**
- Datos 100% anonimizados y agregados
- Minimo 50 alumnos por benchmark para evitar re-identificacion
- Opt-in por institucion (no por alumno)
- Nunca se comparten datos individuales

**Monetizacion:**
- Reporte trimestral de benchmark = feature premium institucional
- "Tu institucion vs el promedio nacional en 15 metricas"

**Esfuerzo:** 4-6 semanas | **Impacto:** Medio (para alumnos) / Alto (para instituciones) | **Costo:** $0

---

### 8.4 API de Integraciones Academicas

**Que es:** Abrir una API para que otros sistemas (SIU Guarani, aulas virtuales, ERPs academicos) se integren con Axon.

**Endpoints publicos (read-only para terceros):**
```
GET /api/v1/student/{id}/mastery → p_know por topic
GET /api/v1/student/{id}/progress → % completion, horas, streak
GET /api/v1/course/{id}/analytics → mastery promedio, debilidades
POST /api/v1/webhook/grade → recibir nota final del alumno (para entrenar predictor)
```

**Beneficios:**
- SIU Guarani puede mostrar mastery de Axon en el perfil del alumno
- El aula virtual puede importar contenido desde Axon
- ERP puede sincronizar inscripciones
- Profesores que usan otras plataformas pueden complementar con Axon

**Monetizacion:** API access = feature enterprise

**Esfuerzo:** 6-8 semanas | **Impacto:** Medio-Alto (a largo plazo) | **Costo:** $0

---

### 8.5 Axon Insights — Reportes de IA para Instituciones

**Que es:** Reportes mensuales generados por IA que analizan el rendimiento institucional y sugieren acciones.

**Reporte ejemplo:**
```
AXON INSIGHTS — Universidad Nacional de Cordoba
Mes: Marzo 2026

RESUMEN EJECUTIVO
- 342 alumnos activos (+12% vs febrero)
- Mastery promedio: 0.61 (+0.05 vs febrero)
- 3 topics criticos detectados (p_know promedio < 0.4)

HALLAZGOS CLAVE
1. Farmacologia Cardiovascular es el topic con mayor
   dificultad (p_know prom: 0.32). Sugerencia: agregar
   tablas comparativas y mas flashcards.

2. Los alumnos que usan el tutor IA tienen +23% de
   mastery vs los que no. Considere promover su uso.

3. La actividad cae 60% los viernes. Considere
   programar actividades bonificadas los viernes.

ALUMNOS EN RIESGO
- 18 alumnos (5.3%) con probabilidad de aprobar < 40%
- Accion sugerida: sesion de repaso grupal focalizada

TOP PERFORMERS
- 12 alumnos con mastery > 0.9 en todos los topics
- Candidatos a tutores pares
```

**Generacion:** Cron mensual → agregar datos → Gemini genera narrativa → PDF via @react-pdf/renderer

**Monetizacion:** Feature enterprise exclusiva

**Esfuerzo:** 3-4 semanas | **Impacto:** Alto (para vender a instituciones) | **Costo:** ~$2/mes

---

## LOOP 9: Gamificacion 2.0 — Mas Alla de Badges

> El sistema actual tiene 39 badges + XP + streaks + leaderboard.
> Eso es "Gamificacion 1.0". Lo que sigue es hacer que el alumno viva una NARRATIVA.

---

### 9.1 Niveles que Desbloquean Features (Level-Gating)

**Que es:** Ya existen 12 niveles medicos (Novato → Catedratico, XP 0-10,000). Pero actualmente son COSMETICOS — no desbloquean nada. Esta idea les da poder real: cada nivel desbloquea una feature de personalizacion.

**Ya existe:** 12 niveles, XP engine, level-up celebration, progress bar.
**Lo que falta:** Que los niveles IMPORTEN mas alla del titulo.

**Feature-gating por nivel:**
| Nivel | Titulo actual | Feature que desbloquea |
|-------|--------------|----------------------|
| 1 | Novato | Acceso basico (flashcards, quizzes, summaries) |
| 2 | Aprendiz | Estadisticas basicas + heatmap de actividad |
| 3 | Practicante | Modo Flow State + Pomodoro calibrado |
| 4 | Interno | Auto-notas inteligentes + check-in emocional |
| 5 | Residente Jr | Mnemonicos IA + explicaciones multi-nivel |
| 6 | Residente | Learning Path Optimizer + desafios 1v1 |
| 7 | Residente Sr | Casos clinicos interactivos + teach-back |
| 8 | Especialista Jr | Analytics avanzados + radar de habilidades |
| 9 | Especialista | Feed de descubrimiento + rabbit hole |
| 10 | Subespecialista | Resumen personalizado + simulacro de examen |
| 11 | Jefe de Servicio | Digital Twin + todas las features |
| 12 | Catedratico | Prestigio: resetear nivel con badge exclusivo + mentor status |

**Por que funciona:**
- Motivacion intrinseca: "quiero llegar a nivel 6 para desbloquear desafios"
- Onboarding gradual: no abruma al alumno con 62 features el dia 1
- Retencion: siempre hay algo nuevo por descubrir
- Monetizacion: plan Pro podria desbloquear niveles antes de tiempo

**Implementacion:** Flag `required_level` por feature, check en frontend antes de renderizar

**Esfuerzo:** 1-2 semanas | **Impacto:** Muy Alto | **Costo:** $0

---

### 9.2 Misiones Diarias y Semanales

**Que es:** Cada dia y cada semana, el alumno recibe misiones personalizadas basadas en su estado actual. No son genericas — estan calibradas a SU perfil.

**Misiones diarias (se regeneran cada dia, elegir 3 de 5):**
```
Misiones generadas para Maria (Nivel 4, focus: Farmacologia):

[ ] Completar 10 flashcards de Farmaco (15 XP)
    → Generada porque: 8 cards overdue en ese topic

[ ] Hacer 1 quiz de Cardio con 70%+ accuracy (25 XP)
    → Generada porque: p_know de Cardio bajo de 0.6 a 0.52

[ ] Leer el resumen de Arritmias completo (10 XP)
    → Generada porque: reading_completion = 0%

[ ] Conectar 2 keywords en el mindmap (20 XP)
    → Generada porque: 3 keywords sin conexiones

[ ] Revisar tus notas de ayer (10 XP)
    → Generada porque: hizo sesion ayer pero no reviso
```

**Misiones semanales (mas ambiciosas, elegir 2 de 4):**
```
[ ] Alcanzar p_know > 0.7 en Farmaco (100 XP + badge)
    → Actualmente: p_know = 0.52

[ ] Completar 5 sesiones de estudio (75 XP)
    → Actualmente: 2/5 esta semana

[ ] Hacer teach-back de 1 topic (50 XP)
    → Nunca lo hizo

[ ] Zero flashcards overdue al final de la semana (100 XP)
    → Actualmente: 23 overdue
```

**Logica de generacion (reglas, sin IA):**
```python
def generate_daily_missions(student):
    missions = []

    # Overdue flashcards → mission de review
    overdue = get_overdue_count(student)
    if overdue > 5:
        missions.append(Mission("flashcard_review", topic=most_overdue_topic, target=min(overdue, 15)))

    # Decaying mastery → mission de quiz
    decaying = get_decaying_topics(student, days=7)
    if decaying:
        missions.append(Mission("quiz_challenge", topic=decaying[0], target_accuracy=0.7))

    # Unread content → mission de lectura
    unread = get_unread_summaries(student)
    if unread:
        missions.append(Mission("read_summary", summary=unread[0]))

    # Disconnected keywords → mission de mindmap
    disconnected = get_keywords_without_connections(student)
    if disconnected:
        missions.append(Mission("connect_keywords", count=2))

    # Streak risk → mission de actividad minima
    if student.streak > 3 and not student.studied_today:
        missions.append(Mission("quick_session", duration=5, xp_bonus=True))

    return random.sample(missions, min(5, len(missions)))
```

**Tabla nueva:**
```sql
CREATE TABLE daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  mission_type TEXT NOT NULL, -- 'flashcard_review', 'quiz_challenge', etc.
  mission_data JSONB NOT NULL, -- target, topic_id, etc.
  xp_reward INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'expired'
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Esfuerzo:** 2-3 semanas | **Impacto:** Muy Alto | **Costo:** $0

---

### 9.3 Temporadas y Eventos

**Que es:** La gamificacion tiene "temporadas" (como Fortnite/Apex) que renuevan la motivacion periodicamente.

**Calendario de temporadas:**
| Temporada | Periodo | Tema | Mecanica especial |
|-----------|---------|------|-------------------|
| Pre-parciales | 4 semanas pre-exam | "Modo Guerrero" | XP x1.5, misiones intensivas, countdown |
| Semana de finales | Semana del exam | "La Hora de la Verdad" | Modo nocturno automatico, simulacros gratis, streak freeze gratis |
| Post-examen | 2 semanas post | "Descanso del Heroe" | Misiones relajadas, badges de reflexion, sin penalidad por streaks |
| Verano/Receso | Vacaciones | "Exploracion Libre" | Contenido de otras materias desbloqueado, XP por curiosidad |
| Inicio de semestre | Primeras 3 semanas | "Nuevos Comienzos" | Onboarding mejorado, boost de XP, matcheo con compas |

**Pass de Temporada (inspirado en gaming):**
```
TEMPORADA "MODO GUERRERO" — Pre-parciales Marzo 2026

Nivel 1: █████░░░░░ Estudiar 3 dias seguidos → Badge "Warming Up"
Nivel 2: ██████░░░░ Completar 50 flashcards → Avatar border dorado
Nivel 3: ███████░░░ p_know > 0.5 en 3 topics → Titulo "Determinado"
Nivel 4: ████████░░ Hacer 1 simulacro → Badge "Simulador"
Nivel 5: █████████░ Zero overdue cards → Badge "Al Dia"
Nivel 6: ██████████ Completar todas las misiones semanales → Badge "Guerrero Completo"

Recompensa final: Badge exclusivo de temporada (nunca mas se puede obtener)
```

**Lo que hace especial a las temporadas:**
- Badges EXCLUSIVOS (FOMO positivo — si no lo obtenes ahora, no lo obtenes nunca)
- Tematica visual: colores del dashboard cambian, animaciones especiales
- Leaderboard de temporada (resetea cada temporada — todos empiezan de cero)
- Historia: cada temporada tiene una "narrativa" leve ("El camino del futuro medico")

**Esfuerzo:** 3-4 semanas | **Impacto:** Muy Alto | **Costo:** $0

---

### 9.4 Desafios Entre Alumnos (1v1 y Torneos)

**Que es:** Un alumno puede desafiar a otro a un quiz en tiempo real. Tambien hay torneos semanales automaticos.

**1v1 Quick Match:**
```
1. Alumno A clickea "Desafiar" en el perfil de Alumno B
2. Alumno B recibe notificacion (in-app + Telegram)
3. Ambos aceptan → 10 preguntas del mismo topic
4. Timer compartido: 30 segundos por pregunta
5. Quien responde mas rapido Y correcto gana puntos
6. Resultado: Winner +30 XP, Loser +10 XP (siempre ganas algo)
7. Stats: Head-to-head record visible en perfiles
```

**Torneo semanal automatico:**
```
Cada lunes:
1. Agrupar alumnos por curso y nivel (fair matching)
2. Bracket de 8-16 alumnos
3. Ronda 1 (lun-mar): 4 matches
4. Ronda 2 (mie-jue): 2 matches
5. Final (vie): 1 match
6. Campeon: Badge "Campeon Semanal de {Curso}" + 200 XP
7. Todos los participantes: +50 XP por round jugado
```

**Integracion tecnica:**
- Supabase Realtime para sync de preguntas/respuestas en tiempo real
- `presence` para detectar cuando ambos estan online
- Quiz questions se seleccionan de pool compartido (mismo topic, misma dificultad)

**Esfuerzo:** 4-5 semanas | **Impacto:** Alto | **Costo:** $0

---

### 9.5 Avatar y Personalizacion Visual

**Que es:** El alumno tiene un avatar/perfil visual que personaliza con items ganados por logros academicos.

**Items desbloqueables:**
| Categoria | Ejemplo | Como se obtiene |
|-----------|---------|----------------|
| Bordes de perfil | Dorado, fuego, medico | Nivel 3+, temporada, badges |
| Iconos de titulo | Estetoscopio, microscopio, DNA | Mastery de topics especificos |
| Color de fondo | Teal, azul noche, verde esmeralda | Completar misiones semanales |
| Efectos | Particulas, brillo, pulso | Streaks de 30+, 60+, 90+ dias |
| Marcos de badge | Plata, oro, platino | Cantidad total de badges |

**Donde se ve:**
- En su perfil publico
- En el leaderboard
- En compas de estudio
- En contenido comunitario que cree
- Compartible como imagen (para redes sociales/WhatsApp)

**No es pay-to-win:** TODO se obtiene por merito academico. Cero items de pago.

**Esfuerzo:** 2-3 semanas | **Impacto:** Medio-Alto | **Costo:** $0

---

## LOOP 10: Bienestar y Anti-Burnout

> La productividad sin bienestar es insostenible.
> Estas ideas CUIDAN al alumno, no lo explotan.

---

### 10.1 Detector de Burnout

**Que es:** El sistema detecta seniales tempranas de burnout y actua ANTES de que el alumno abandone.

**Seniales detectables (ya en la DB):**
| Senial | Indicador | Umbral |
|--------|-----------|--------|
| Fatiga de sesion | Accuracy cae >20% en ultimos 30% de sesion | 3+ sesiones consecutivas |
| Engagement decay | Sesiones/semana cayendo 3 semanas seguidas | Tendencia negativa sostenida |
| Over-study | >4 horas/dia 5+ dias seguidos | Riesgo de burnout por exceso |
| Frustration loop | Mismo keyword fallado 5+ veces en 3 dias | Sin progreso visible |
| Ghost mode | 5+ dias sin actividad despues de racha activa | Abandono potencial |
| Velocity drop | Time-to-answer subiendo pero accuracy estable | Fatiga cognitiva |

**Intervenciones graduales:**
```
Nivel 1 (sutil): Cambiar el mensaje del dashboard
  Antes: "Tienes 15 flashcards pendientes"
  Despues: "Hoy fue un dia largo. Que tal 5 flashcards y listo?"

Nivel 2 (directo): Notificacion de cuidado
  "Llevas 3 horas seguidas. Tu accuracy bajo 20% en la ultima hora.
   Un descanso de 15 min puede recuperar tu concentracion."

Nivel 3 (proactivo): Sugerir plan de descanso
  "Notamos que tu rendimiento bajo esta semana. Sugerencia:
   - Hoy: sesion corta de 15 min (solo repaso facil)
   - Manana: descanso total (tu streak no se pierde con freeze)
   - Pasado: volver con sesion normal
   Tu cuerpo necesita descanso para consolidar lo aprendido."

Nivel 4 (celebrar el descanso): Badge
  "Usaste tu dia de descanso. Badge 'Self-Care Champion' desbloqueado.
   Los mejores medicos saben cuando parar."
```

**Ciencia detras:**
- La consolidacion de memoria ocurre durante el descanso (Walker, 2017)
- Over-study puede REDUCIR retencion (spacing effect reverso)
- El burnout academico tiene 3 fases: agotamiento, cinismo, ineficacia (Maslach)

**Esfuerzo:** 2-3 semanas | **Impacto:** Alto | **Costo:** $0

---

### 10.2 Pomodoro Integrado con Datos

**Que es:** No un Pomodoro generico — uno calibrado al alumno basado en sus datos de atencion.

**Calibracion personalizada:**
```
1. Analizar study_sessions del alumno:
   - Punto donde accuracy empieza a caer (attention_cliff)
   - Duracion de las sesiones mas productivas (peak_duration)

2. Calcular Pomodoro personalizado:
   - work_minutes = min(attention_cliff, peak_duration) * 0.9
   - break_minutes = work_minutes * 0.2 (minimo 5, maximo 15)

3. Ejemplo:
   Alumno A: 25 min trabajo + 5 min pausa (clasico)
   Alumno B: 40 min trabajo + 10 min pausa (atencion larga)
   Alumno C: 15 min trabajo + 5 min pausa (atencion corta)
```

**Sugerencias durante el break:**
- "Levantate y estira" (si lleva 2+ pomodoros)
- "Toma agua" (cada 3 pomodoros)
- "Mira por la ventana 20 segundos a algo lejano" (regla 20-20-20 para ojos)
- "Respira profundo 5 veces" (si accuracy bajo mucho)

**Post-sesion Pomodoro:**
- Mini-resumen: "Hiciste 3 pomodoros (75 min total). Revisaste 22 flashcards con 78% accuracy."
- Comparacion: "Tu accuracy fue 5% mejor que tu promedio. Los breaks ayudaron."

**Esfuerzo:** 1-2 semanas | **Impacto:** Medio-Alto | **Costo:** $0

---

### 10.3 Modo Examen-Sano

**Que es:** Antes de examenes, los alumnos tienden a cramming autodestructivo. Este modo protege al alumno de si mismo.

**Activacion:** Automatica cuando exam < 7 dias

**Que hace:**
```
1. Limita sesiones a 3 horas/dia
   "Ya estudiaste 3 horas hoy. Mas no es mejor — descansa y vuelve manana fresco."

2. Muestra el "punto de rendimientos decrecientes"
   Grafico: "Despues de 2.5 horas, tu retencion baja. Aqui esta la evidencia de TU historial."

3. Sugiere sesiones espaciadas
   "En lugar de 6 horas hoy, estudia 2h hoy + 2h manana + 2h pasado.
    La ciencia dice que retendras 40% mas."

4. Elimina el leaderboard temporalmente
   "No necesitas compararte con nadie ahora. Enfocate en VOS."

5. Activa streak freeze automatico
   "Si necesitas un dia off, tu streak esta protegido durante semana de finales."

6. Prioriza suenio
   Si estudia despues de las 23:00: "Dormir 8 horas antes del examen vale
   mas que 3 horas de estudio nocturno. Tu memoria se consolida durmiendo."
```

**El alumno puede desactivar** (override manual), pero el default es ON.

**Esfuerzo:** 1-2 semanas | **Impacto:** Alto | **Costo:** $0

---

### 10.4 Check-in Emocional Rapido ⏸️ PENDIENTE (abstracto todavia)

**Que es:** Al iniciar sesion de estudio, un micro-survey de 1 pregunta sobre como se siente. La plataforma adapta la sesion segun la respuesta.

**UI:**
```
+-------------------------------------------+
|  Como te sentis hoy?                      |
|                                           |
|  😤 Frustrado  😐 Normal  😊 Motivado      |
|  😴 Cansado    🔥 Energetico               |
+-------------------------------------------+
```

**Adaptacion por estado:**
| Estado | Sesion adaptada |
|--------|----------------|
| Frustrado | Solo flashcards faciles (p_know > 0.6), mensajes de aliento, sin timer |
| Normal | Sesion estandar personalizada |
| Motivado | Misiones bonus desbloqueadas, contenido desafiante, modo retador |
| Cansado | Sesion corta (10 min max), solo repaso, sin contenido nuevo |
| Energetico | Sesion extendida, contenido nuevo, casos clinicos, desafios |

**Tracking longitudinal:**
- Correlacionar mood con performance a lo largo del tiempo
- "Cuando te sentis energetico, tu accuracy es 23% mas alta. Intenta estudiar temas dificiles en esos momentos."
- Detectar patrones: "Los lunes sueles estar cansado. Esos dias te sugerimos sesiones cortas."

**Tabla:**
```sql
CREATE TABLE mood_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  mood TEXT NOT NULL, -- 'frustrated', 'normal', 'motivated', 'tired', 'energetic'
  session_id UUID REFERENCES study_sessions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Esfuerzo:** 1 semana | **Impacto:** Alto | **Costo:** $0

---

### 10.5 Celebraciones Significativas

**Que es:** Las celebraciones actuales son genericas ("Badge desbloqueado!"). Estas son SIGNIFICATIVAS — conectan el logro con el esfuerzo real.

**Ejemplos de celebraciones personalizadas:**

**En lugar de:** "Completaste 100 flashcards!"
**Decir:** "Hace 3 semanas, tu mastery de Farmaco era 28%. Hoy es 74%. Esas 100 flashcards cambiaron todo. Sos una persona diferente de la que empezo."

**En lugar de:** "Streak de 30 dias!"
**Decir:** "30 dias seguidos. Hubo dias en que no querias (el 12 de marzo casi no estudias — pero lo hiciste, 5 minutos bastaron). Eso es disciplina real."

**En lugar de:** "Nuevo nivel: Especialista"
**Decir:** "Pasaste de Residente a Especialista. En tu camino dominaste 12 topics, respondiste 340 preguntas, y le dedicaste 47 horas al estudio. Cada hora conto."

**Implementacion:**
- Al generar celebracion, consultar datos reales del alumno
- Incluir datos concretos: fechas, numeros, topics
- Si hay historia de lucha (dias de accuracy baja seguidos de recovery), mencionarla
- Tone: orgulloso pero no condescendiente

**Generacion:** Template con datos reales (sin IA) o Gemini para narrativa natural (+$1/mes)

**Esfuerzo:** 1-2 semanas | **Impacto:** Alto | **Costo:** $0-1/mes

---

## LOOP 11: Mobile-First y Micro-Momentos

> 70% de los estudiantes universitarios estudian desde el celular.
> Estas ideas hacen que estudiar en 2 minutos en el colectivo sea tan valioso como 1 hora en el escritorio.

---

### 11.1 Modo Colectivo (2 minutos productivos)

**Que es:** Un modo ultra-compacto para estudiar en momentos cortos: cola del super, espera en el consultorio, viaje en colectivo.

**UI:**
```
+---------------------------+
|  MODO COLECTIVO    ⏱ 2:00 |
|                           |
|  Cual es el mecanismo     |
|  de los betabloqueadores  |
|  selectivos?              |
|                           |
|  [Mostrar respuesta]      |
|                           |
|  1/5 cards   ████░ 80%    |
+---------------------------+
```

**Caracteristicas:**
- MAX 5 cards por sesion (no mas)
- Cards seleccionadas por mayor urgencia (overdue + alta clinical_priority)
- UI simplificada: 1 card a la vez, botones grandes para touch
- Sin navegacion, sin sidebar, sin distracciones
- Al terminar: "Bien! 2 min productivos. +15 XP"

**Activacion:**
- Widget en home screen (si PWA)
- Notificacion de Telegram con deep-link directo
- Boton "Sesion rapida" prominente en dashboard mobile

**Esfuerzo:** 1-2 semanas | **Impacto:** Alto | **Costo:** $0

---

### 11.2 Notificaciones Inteligentes con Micro-Contenido

**Que es:** Las notificaciones de Telegram/WhatsApp no solo dicen "estudia" — traen contenido directamente consumible en la notificacion.

**Tipos de micro-contenido en notificacion:**

**Tipo 1: Flashcard express**
```
Telegram:
🧠 Flashcard del dia — Farmaco

P: ¿Diferencia entre atenolol y propranolol?

[Ver respuesta]

R: Atenolol = selectivo B1 (solo corazon)
   Propranolol = no selectivo B1+B2 (corazon + bronquios)

Recordar: "AteNOlol = NO bronquios"

[✅ Lo sabia] [❌ No lo sabia] [📖 Estudiar mas]
```

**Tipo 2: Dato curioso clinico**
```
Telegram:
🏥 Dato del dia — Cardiologia

¿Sabias que la FA es la arritmia sostenida mas
comun? Afecta al 1-2% de la poblacion y es la
causa #1 de ACV cardioembólico.

Tu mastery de Arritmias: 52% → Queres repasar?

[📚 Repasar arritmias] [⏭ Siguiente]
```

**Tipo 3: Mini-quiz**
```
Telegram:
📝 Quiz rapido — Anatomia

¿Cual arteria irriga el nodo sinusal?
A) Coronaria derecha (55-60%)
B) Circunfleja (40-45%)
C) Descendente anterior
D) Ambas A y B son correctas ✓

[A] [B] [C] [D]
```

**Personalizacion del contenido:**
- Las flashcards se eligen por FSRS due_at (las mas urgentes)
- Los datos curiosos se eligen de keywords con p_know > 0.5 (refuerzo, no frustracion)
- Los quizzes apuntan a subtopics con p_know 0.4-0.6 (zona de aprendizaje)

**Timing personalizado:**
- Se envian a la hora de peak_activity del alumno (de perfil circadiano)
- No mas de 3 por dia
- Si el alumno no interactua con 3 consecutivas: pausar por 3 dias

**Esfuerzo:** 2-3 semanas | **Impacto:** Muy Alto | **Costo:** $0 (Telegram/WhatsApp ya integrados)

---

### 11.3 Offline Mode con Sync Inteligente

**Que es:** El alumno puede descargar contenido para estudiar sin internet (subte, avion, zona sin signal).

**Que se descarga:**
```
1. Flashcards due para hoy y manana (JSON liviano, ~50KB)
2. Resumen del topic en estudio actual (HTML cacheado, ~200KB)
3. Keywords + definiciones del topic (JSON, ~10KB)
4. Ultimo quiz pendiente (JSON, ~30KB)

Total offline package: ~300KB por topic
```

**Sync cuando vuelve la conexion:**
```
1. Reviews hechas offline → POST /reviews (batch)
2. Quiz responses offline → POST /quiz-attempts (batch)
3. Reading progress offline → PATCH /reading-states (merge)
4. Timestamp-based conflict resolution (last-write-wins)
```

**Implementacion tecnica:**
- Service Worker (PWA) para cache de assets
- IndexedDB para almacenar contenido y reviews pendientes
- Background sync API para enviar datos cuando vuelve la conexion
- Banner "Modo offline — tus resultados se sincronizaran al conectarte"

**Esfuerzo:** 3-4 semanas | **Impacto:** Alto | **Costo:** $0

---

### 11.4 Widget de Home Screen

**Que es:** Un widget para la home screen del celular que muestra info relevante sin abrir la app.

**Variantes:**
```
Widget pequeño (2x1):
+-------------------+
| 🔥 14 dias        |
| 8 cards pendientes|
+-------------------+

Widget mediano (2x2):
+-------------------+
| 🔥 Streak: 14     |
| Cards: 8 due      |
| Mastery: 67% ↑    |
| [Sesion rapida]   |
+-------------------+

Widget grande (4x2):
+-------------------+
| Hoy:              |
| ✅ 5 flashcards    |
| ⬜ Quiz Farmaco    |
| ⬜ Leer Arritmias  |
| Proximo examen: 8d|
| [Empezar] [Mision]|
+-------------------+
```

**Prerequisito:** PWA con manifest + iOS/Android widget API (o React Native)

**Esfuerzo:** 2-3 semanas | **Impacto:** Medio-Alto | **Costo:** $0

---

### 11.5 Modo Picture-in-Picture para Video

**Que es:** Los videos de Mux (ya integrados) se pueden ver en PiP mientras el alumno toma notas en otra app o revisa flashcards en la misma plataforma.

**Flujo:**
```
1. Alumno ve video de clase (Mux player)
2. Click en icono PiP → video flota en esquina
3. El alumno puede:
   - Abrir flashcards debajo del video (study + review simultaneo)
   - Abrir el summary del topic (leer mientras mira)
   - Abrir otra app (notas, WhatsApp) — el video sigue
4. Tracking: se registra que estudio en "modo dual" (video + flashcards)
```

**Implementacion:** Picture-in-Picture API nativa del browser (ya soportada en Chrome, Firefox, Safari)

**Esfuerzo:** 3-5 dias | **Impacto:** Medio | **Costo:** $0

---

## LOOP 12: Descubrimiento y Serendipia

> No todo debe ser optimizado y dirigido.
> A veces, el mejor aprendizaje viene de encontrar algo que no buscabas.

---

### 12.1 Feed de Descubrimiento ("Para Vos")

**Que es:** Un feed tipo TikTok/Instagram pero con contenido educativo, personalizado por los intereses y mastery del alumno.

**Contenido del feed:**
| Tipo | Fuente | Ejemplo |
|------|--------|---------|
| Dato curioso | IA + keywords con p_know > 0.5 | "El corazon late ~100,000 veces por dia. El nodo sinusal genera cada uno." |
| Conexion sorpresa | Embeddings inter-curso | "La cascada de coagulacion se parece a la del complemento. Mira por que." |
| Flashcard de otro topic | FSRS due pronto | "Esta flashcard de Anatomia vence manana. Adelantala?" |
| Logro de companero | Leaderboard (opt-in) | "Pedro alcanzo mastery en Farmaco. Lo conoces?" |
| Tip de estudio | Coach de tecnicas | "Los alumnos que hacen quizzes retienen 3x mas que los que solo leen." |
| Preview de topic | Topics con 0% completion | "Todavia no exploraste Semiologia. Mira de que se trata." |
| Mnemonico popular | Contenido comunitario | "'CRASH' para betabloqueadores: Congestive HF, Rate control, Angina, SVT, HTN" |

**Algoritmo de ranking (sin IA):**
```python
def feed_score(item, student):
    relevance = cosine_sim(item.embedding, student.current_focus_embedding)
    novelty = 1.0 if item.topic_id not in student.studied_topics else 0.3
    urgency = item.fsrs_urgency if item.type == 'flashcard' else 0
    serendipity = random.uniform(0.1, 0.5)  # factor aleatorio intencional

    return relevance * 0.4 + novelty * 0.25 + urgency * 0.25 + serendipity * 0.1
```

**UI:** Scroll vertical, cards con diseno tipo Spotify Discover. No infinite scroll — max 10 items por sesion.

**Esfuerzo:** 3-4 semanas | **Impacto:** Alto | **Costo:** $0

---

### 12.2 "Rabbit Hole" Mode — Exploracion Libre

**Que es:** Un modo donde el alumno explora el knowledge graph libremente, sin objetivo. Cada click en un keyword abre una rama de conceptos relacionados, y la plataforma lo premia por explorar.

**Flujo:**
```
1. Click en un keyword → ver definicion + conceptos conectados
2. Click en concepto conectado → nueva definicion + sus conexiones
3. Cada nodo visitado: +5 XP
4. Si el nodo es nuevo (nunca visitado): +10 XP + efecto visual especial
5. Si conecta 2 nodos que no estaban conectados: +20 XP
6. Despues de 10 nodos: "Exploraste 10 conceptos! Queres hacer un quiz rapido?"
7. El quiz se genera sobre los nodos que visito (retrieval practice sobre lo explorado)
```

**Visualizacion:** El knowledge graph con efecto "fog of war" — solo se ven los nodos visitados. Los no visitados son sombras borrosas que invitan a explorar.

**Badge:** "Explorador" (10 nodos), "Cartografo" (50 nodos), "Marco Polo" (100 nodos), "Enciclopedia Viviente" (todos los nodos de un curso)

**Esfuerzo:** 2-3 semanas | **Impacto:** Medio-Alto | **Costo:** $0

---

### 12.3 Flashcard del Dia (Universal) 🔜 PROX

**Que es:** TODOS los alumnos de un curso reciben la misma "Flashcard del Dia" — una pregunta interesante, no necesariamente de lo que estan estudiando.

**Proposito:** Crear un momento compartido. "Viste la flashcard de hoy? Estaba dificil."

**Seleccion:**
- Se elige 1 flashcard por curso por dia (cron a las 00:00)
- Criterio: clinical_priority alta + no demasiado especifica + interesante
- El profesor puede override y elegir la flashcard del dia manualmente

**UI:**
```
+-------------------------------------------+
|  💡 FLASHCARD DEL DIA — Cardiologia        |
|                                           |
|  "Un paciente con FA cronica necesita      |
|   anticoagulacion. ¿Cual es la alternativa |
|   mas segura a la warfarina?"              |
|                                           |
|  145 alumnos ya respondieron              |
|  Accuracy del curso: 67%                  |
|                                           |
|  [Responder] [Ver despues]                |
+-------------------------------------------+
```

**Social:**
- Ver que porcentaje del curso acerto (despues de responder)
- "Sos parte del 33% que respondio correctamente"
- Conversacion ligera: "Fue dificil para el 67% del curso"

**Esfuerzo:** 1 semana | **Impacto:** Medio | **Costo:** $0

---

### 12.4 Conexiones con el Mundo Real

**Que es:** La IA conecta lo que el alumno esta estudiando con noticias medicas reales, papers recientes, o casos clinicos famosos.

**Trigger:** Cuando el alumno domina un topic (p_know > 0.7), mostrar:
```
+-------------------------------------------+
|  🌍 EN EL MUNDO REAL                      |
|                                           |
|  Dominaste "Arritmias". Mira esto:        |
|                                           |
|  "En 2024, la FDA aprobo una nueva droga  |
|   para FA: edoxaban. Funciona como los    |
|   anticoagulantes que estudiaste pero con  |
|   menor riesgo de sangrado."              |
|                                           |
|  ¿Por que importa? Porque conecta lo que  |
|  estudiaste con la practica clinica real.  |
|                                           |
|  [Leer mas] [Generar flashcard] [Dismiss] |
+-------------------------------------------+
```

**Generacion:**
- Gemini busca conexiones entre el topic y aplicaciones clinicas reales
- Se cachea por topic (no por alumno) — todos ven lo mismo
- El profesor puede curar/aprobar conexiones

**Esfuerzo:** 2-3 semanas | **Impacto:** Alto | **Costo:** ~$3/mes

---

### 12.5 "Time Capsule" — Carta a Tu Yo Futuro

**Que es:** Al inicio del semestre, el alumno escribe una carta a su yo del final del semestre. Al final, la recibe junto con sus datos reales.

**Flujo:**
```
Inicio de semestre:
"Escribile una carta a tu yo del futuro. ¿Como te sentis ahora?
 ¿Que esperas lograr este semestre? ¿Que te preocupa?"

[Area de texto libre]

Fin de semestre:
"Hace 4 meses, te escribiste esta carta:
 '{contenido de la carta}'

 Esto es lo que paso:
 - Estudiaste 127 horas (promedio de tu curso: 98)
 - Dominaste 34 topics (empezaste con 0)
 - Tu mastery promedio paso de 0% a 72%
 - Tu racha mas larga fue de 23 dias
 - Desbloqueaste 12 badges
 - Llegaste a nivel 5: Adjunto

 ¿Que le dirias a tu yo del inicio?"
```

**Beneficio:** Metacognicion + reflexion + celebracion de crecimiento. Altisimo impacto emocional.

**Esfuerzo:** 3-5 dias | **Impacto:** Alto (emocional) | **Costo:** $0

---

## LOOP 13: Accesibilidad e Inclusion

> Una plataforma verdaderamente personalizada se adapta a TODAS las personas.
> No es optional — es responsabilidad.

---

### 13.1 Modo Daltonismo (Color-Blind Friendly)

**Que es:** El sistema de mastery usa 5 colores (gray/red/yellow/green/blue) que son indistinguibles para 8% de hombres con daltonismo. Esta idea agrega modos alternativos.

**Estado actual (del audit QA):** 35+ botones sin ARIA labels. Zero modos de accesibilidad.

**Solucion:**
```
En Preferences, selector "Modo de vision":
  - Normal (default)
  - Protanopia (rojo-verde) → reemplaza rojo por naranja oscuro, verde por azul claro
  - Deuteranopia (verde-rojo) → similar al anterior con ajustes
  - Tritanopia (azul-amarillo) → reemplaza azul por violeta, amarillo por naranja
  - Alto contraste → blancos puros, negros puros, bordes gruesos
```

**Implementacion:**
- CSS custom properties para cada color de mastery
- `data-color-mode="protanopia"` en `<html>`
- Los colores se leen de una paleta alternativa
- Opcional: iconos ADICIONALES a los colores (checkmark, X, circulo vacio) para redundancia

**Ademas de colores, agregar forma:**
| Mastery | Color normal | Forma (redundancia) |
|---------|-------------|-------------------|
| Undiscovered | Gray | Circulo vacio |
| Emerging | Red | Triangulo |
| In progress | Yellow | Cuadrado medio-lleno |
| Consolidated | Green | Cuadrado lleno |
| Mastery | Blue | Estrella |

**Esfuerzo:** 1 semana | **Impacto:** Medio (alto para el 8% afectado) | **Costo:** $0

---

### 13.2 Modo Dislexia

**Que es:** Fuente, espaciado y formato adaptados para alumnos con dislexia (afecta ~10% de la poblacion).

**Cambios:**
```css
/* Modo dislexia activado */
[data-dyslexia="true"] {
  font-family: 'OpenDyslexic', 'Comic Sans MS', sans-serif;
  letter-spacing: 0.12em;
  word-spacing: 0.16em;
  line-height: 1.8;
  /* Sin justificacion — alineacion izquierda siempre */
  text-align: left !important;
  /* Sin italicas — mas dificil de leer con dislexia */
  font-style: normal !important;
}
```

**Ademas del CSS:**
- Opcion de aumentar tamano de fuente (slider 14px-24px)
- Resaltador de linea actual (una regla visual que sigue el scroll)
- TTS (Text-to-Speech) para resumenes (Web Speech API nativa)
- Opcion de "leer con audio" en cada summary/flashcard

**Esfuerzo:** 1-2 semanas | **Impacto:** Alto (para quienes lo necesitan) | **Costo:** $0

---

### 13.3 Modo Bajo Ancho de Banda

**Que es:** Para alumnos en zonas rurales o con conexion limitada (comun en Argentina). La plataforma se adapta para funcionar con 2G.

**Como funciona:**
```
1. Detectar conexion:
   navigator.connection.effectiveType → '2g', '3g', '4g'
   O: medir tiempo de respuesta de API calls

2. Si conexion lenta:
   - Desactivar animaciones (prefers-reduced-motion)
   - No cargar imagenes de summaries (solo texto)
   - Comprimir respuestas API (gzip ya activo, pero reducir payload)
   - No cargar videos Mux (mostrar "Video disponible con WiFi")
   - No cargar knowledge graph D3 (pesado)
   - Flashcards: solo texto (sin imagenes de apoyo)
   - Desactivar chat IA streaming (batch response)

3. Banner informativo:
   "Conexion lenta detectada. Axon se adapto para funcionar mejor."
```

**Esfuerzo:** 1-2 semanas | **Impacto:** Medio-Alto | **Costo:** $0

---

### 13.4 Soporte Multi-Idioma (i18n Base)

**Que es:** Preparar la plataforma para soportar multiples idiomas. No traducir todo HOY, sino crear la infraestructura.

**Estado actual:** Todo hardcoded en espanol. Algunos strings en ingles (legacy).

**MVP:**
```
1. Instalar react-i18next
2. Extraer strings a archivos de traduccion JSON:
   /locales/es/common.json  (espanol — idioma base)
   /locales/pt/common.json  (portugues — mercado brasileno)
   /locales/en/common.json  (ingles — expansion internacional)
3. Reemplazar strings hardcoded por t('key')
4. Selector de idioma en preferences
```

**Por que importa para personalizacion:**
- Argentina tiene alumnos de intercambio que hablan portugues o ingles
- Abrir al mercado brasileno (100M+ universitarios)
- Las explicaciones de IA ya pueden generarse en el idioma del alumno (Gemini es multilingue)

**Esfuerzo:** 3-4 semanas (infra), ongoing (traducciones) | **Impacto:** Medio (ahora), Alto (futuro) | **Costo:** $0

---

### 13.5 Modo TDAH (Atencion Reducida)

**Que es:** Adaptaciones para alumnos con TDAH (Trastorno por Deficit de Atencion e Hiperactividad, afecta ~5% de adultos).

**Adaptaciones:**
| Feature | Adaptacion TDAH |
|---------|----------------|
| Sesiones | Max 15 min default, con timer visible y prominente |
| Flashcards | Solo 5 por ronda (vs 10-20 normal) |
| Quizzes | 5 preguntas max, con pausa permitida entre preguntas |
| Resumenes | Divididos en bloques colapsables de 200 palabras |
| Dashboard | Minimalista: solo 3 widgets (lo mas urgente) |
| Notificaciones | Reducidas a 1/dia max (evitar sobrecarga) |
| Gamificacion | Recompensas mas frecuentes pero pequenas (micro-dopamina) |
| Navegacion | Breadcrumb siempre visible (evitar perderse) |
| Animaciones | Reducidas pero no eliminadas (necesitan estimulacion) |
| Flow mode | Default ON — sidebar oculta, header minimo |

**Combinacion con micro-sesiones (11.1):**
- El "Modo Colectivo" de 2 minutos es IDEAL para TDAH
- Sesiones ultra-cortas con recompensa inmediata
- Variedad de formato en cada sesion (flashcard → quiz → lectura corta → listo)

**Esfuerzo:** 2-3 semanas | **Impacto:** Alto (para quienes lo necesitan) | **Costo:** $0

---

## LOOP 14: AI Agents — Automatizacion Inteligente

> En lugar de que el alumno BUSQUE lo que necesita, la IA lo TRAE.
> Agents que actuan autonomamente en background para mejorar la experiencia.

---

### 14.1 Agent de Repaso Proactivo 🔜 PROX

**Que es:** Un agente que corre en background y prepara la sesion de estudio del alumno ANTES de que abra la app.

**Como funciona:**
```
Cron: cada dia a las 02:00 AM (batch para todos los alumnos)

Para cada alumno activo:
1. Calcular FSRS cards due para hoy → ordenar por urgencia
2. Calcular BKT subtopics con p_know decayendo → priorizar
3. Si exam < 14 dias: sesgar hacia topics del examen
4. Si mood_last = 'tired': reducir volumen a 60%
5. Si circadian_peak = 'nocturno': no enviar notification AM

Resultado: "study_pack" pre-generado guardado en cache
  {
    flashcards: [ids ordenados por urgencia],
    suggested_quiz_topic: topic_id,
    estimated_duration: "22 min",
    message: "Hoy: 12 flashcards de Farmaco + quiz rapido de Cardio"
  }

Cuando el alumno abre la app: el pack se muestra inmediatamente.
Sin loading, sin "calculando..." — ya esta listo.
```

**Beneficio:** La experiencia se siente INSTANTANEA y personalizada desde el primer segundo.

**Esfuerzo:** 2-3 semanas | **Impacto:** Alto | **Costo:** $0 (Edge Function cron)

---

### 14.2 Agent de Deteccion de Oportunidades

**Que es:** Un agente que analiza los datos del alumno y detecta "oportunidades" que el alumno no pidio pero necesita.

**Oportunidades detectables:**
| Oportunidad | Trigger | Accion del agent |
|-------------|---------|-----------------|
| "Casi dominas X" | p_know 0.65-0.74 en un topic | Generar mini-pack de 5 flashcards especificas |
| "X y Y son iguales" | 2 keywords con embedding similarity > 0.9 en cursos distintos | Generar conexion sugerida |
| "Tu companero domina lo que a vos te cuesta" | Alumno A bajo en X, Alumno B alto en X (ambos opt-in) | Sugerir match de estudio |
| "Hace 14 dias dominabas Z" | fsrs_stability cayo 50%+ en 14 dias | Generar refresh pack de 3 cards |
| "Este quiz tiene trampas" | Quiz con opcion incorrecta que atrae > 60% de respuestas | Agregar "alert" al quiz + generar explicacion del distractor |
| "Nadie entiende esta seccion" | 70%+ alumnos con p_know < 0.4 en misma seccion | Notificar al profesor + sugerir contenido refuerzo |

**Frecuencia:** Cada 6 horas (batch)
**Tabla:**
```sql
CREATE TABLE ai_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id), -- null = para profesor
  opportunity_type TEXT NOT NULL,
  data JSONB NOT NULL, -- topic_id, keywords, suggested_actions
  status TEXT DEFAULT 'pending', -- 'pending', 'shown', 'acted', 'dismissed'
  priority NUMERIC DEFAULT 0.5, -- 0-1
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);
```

**Esfuerzo:** 3-4 semanas | **Impacto:** Muy Alto | **Costo:** $0 (reglas, sin IA)

---

### 14.3 Agent de Contenido Proactivo

**Que es:** Un agente que genera contenido nuevo ANTES de que alguien lo pida, basandose en gaps detectados.

**Gaps que detecta:**
```
1. Topic con summaries pero sin flashcards
   → Pre-generar 10 flashcards con Gemini
   → Marcar como "AI-generated, pending professor review"

2. Keywords sin definicion
   → Generar definicion via Gemini + RAG de chunks existentes
   → Marcar para review del profesor

3. Topics con alta tasa de error en 1 keyword especifico
   → Generar flashcard comparativa ("Diferencias entre X e Y")
   → Agregar al pool comun

4. Subtopics sin coverage de quiz
   → Generar 3 preguntas MCQ por subtopico
   → Agregar a pool de smart-generate

5. Keywords sin conexiones en knowledge graph
   → Usar embeddings para proponer conexiones
   → Marcar como "AI-suggested" para profesor
```

**Frecuencia:** Semanal (batch domingo noche)
**Review flow:** Todo se marca como "draft" — el profesor aprueba o rechaza

**Esfuerzo:** 3-4 semanas | **Impacto:** Alto | **Costo:** ~$5/mes (generacion batch)

---

### 14.4 Agent de Optimizacion de Parametros

**Que es:** Un agente que auto-ajusta los parametros del sistema basandose en datos reales.

**Parametros que optimiza:**
| Parametro | Valor default | Optimizacion |
|-----------|---------------|-------------|
| XP daily cap | 500 | Si el promedio de los top 10% es 480, subir a 600 |
| FSRS weights | Defaults SM-2 | Ajustar por materia basado en retention rates reales |
| BKT p_transit | 0.3 | Subir si alumnos aprenden mas rapido de lo esperado |
| clinical_priority thresholds | 0.7-0.9 | Ajustar si mastery distribution es bimodal |
| Flashcard difficulty | 1-10 | Recalibrar basado en accuracy real (si todos aciertan = muy facil) |
| Session target duration | 25 min | Ajustar al attention_cliff promedio del curso |
| Daily goal default | 100 XP | Ajustar al P50 de XP diario real |

**Logica:** Analisis estadistico simple (medianas, percentiles, regresion lineal) — sin IA.

**Frecuencia:** Mensual
**Transparencia:** Log de cambios visible para el admin/owner: "El cap diario de XP subio de 500 a 550 basado en datos de 342 alumnos."

**Esfuerzo:** 2-3 semanas | **Impacto:** Medio-Alto | **Costo:** $0

---

### 14.5 Agent de Recuperacion de Alumnos Inactivos

**Que es:** Cuando un alumno deja de estudiar, el agente diseña una "rampa de re-entrada" personalizada.

**Triggers:**
```
Si dias_sin_actividad > 7 AND tenia_streak > 3:
  → Alumno "ghost" detectado
```

**Secuencia de re-engagement (espaciada):**
```
Dia 7 sin actividad:
  Telegram: "Hola {nombre}! No te vimos hace una semana.
  Tu mastery de Farmaco bajo de 68% a 61%.
  Una sesion de 5 min la recupera. [Link rapido]"

Dia 10:
  Telegram: "Tu record de streak era {record} dias.
  Empezar uno nuevo? Solo necesitas 1 sesion.
  [Empezar] [Recordarme manana]"

Dia 14:
  Telegram: "{nombre}, armamos un mini-plan de 3 dias
  para que vuelvas al ritmo:
  Dia 1: 5 flashcards faciles (5 min)
  Dia 2: 1 quiz rapido (10 min)
  Dia 3: Leer 1 resumen (15 min)
  [Empezar plan] [No gracias]"

Dia 21:
  Email: Resumen visual de lo que perdio (mastery decay graph)
  + lo que puede recuperar en 1 semana

Dia 30+:
  Dejar de enviar (respetar la decision del alumno)
```

**La "rampa" adapta volumen:**
- Si el alumno hacia 1h/dia → sugerir 10 min para volver
- Si hacia 10 min/dia → sugerir 3 min
- Nunca sugerir mas de 50% de su volumen habitual como re-entrada

**Esfuerzo:** 2-3 semanas | **Impacto:** Muy Alto (retencion) | **Costo:** $0

---

## MATRIZ DE PRIORIZACION (ACTUALIZADA — Loops 1-14)

### Por impacto/esfuerzo:

### Por impacto/esfuerzo (TODOS los loops, 72 ideas):

| Tier | Ideas | Esfuerzo | Impacto |
|------|-------|----------|---------|
| **Quick Wins** (< 1 semana) | 1.1 Ritmo Circadiano, 1.3 Formato Favorito, 2.5 Chat Personalidad, 4.3 Badges Esfuerzo, 4.5 Feedback Loop, 6.2 Mapa Confianza, 10.4 Check-in Emocional, 10.5 Celebraciones, 11.5 PiP Video, 12.3 Flashcard del Dia, 12.5 Time Capsule, 13.1 Modo Daltonismo | 3-5 dias c/u | Alto |
| **High Value** (1-3 semanas) | 1.2 Dificultad, 1.4 Micro-Sesiones, 1.7 Objetivos, 2.1 Mnemonicos, 2.7 Auto-Notas, 4.1 Compas, 4.2 Diario, 6.1 Coach, 6.4 Teach-Back, 7.4 Alertas Prof, 9.1 Level-Gating, 9.2 Misiones, 10.1 Burnout, 10.2 Pomodoro, 10.3 Examen-Sano, 11.1 Colectivo, 11.2 Micro-Contenido, 12.2 Rabbit Hole, 12.4 Mundo Real, 13.2 Dislexia, 13.5 TDAH, 14.1 Agent Repaso, 14.4 Agent Params, 14.5 Agent Reactivacion | 1-3 sem c/u | Alto-Muy Alto |
| **Diferenciadores** (2-5 semanas) | 1.5 Dashboard, 1.6 Mapa Progreso, 2.2 Multi-Nivel, 2.3 Casos Clinicos, 2.4 Resumen Personal, 3.1 Learning Path, 3.2 SR Lectura, 3.4 Simulacro, 3.5 Flow, 4.4 Onboarding, 5.4 Analytics, 6.3 Patron Detective, 7.1 Dashboard Prof, 7.2 Asist Contenido, 7.3 Gen Examenes, 7.5 Templates, 9.3 Temporadas, 9.5 Avatar, 11.3 Offline, 11.4 Widget, 12.1 Feed, 13.3 Bajo Ancho, 13.4 i18n, 14.2 Agent Oportunidades, 14.3 Agent Contenido | 2-5 sem c/u | Muy Alto |
| **Visionarios** (4-12 semanas) | 5.1 Digital Twin, 5.2 Calendar, 5.3 Voice-First, 5.5 Comunitario, 5.6 CAT, 8.3 Benchmark, 8.4 API, 8.5 Insights, 9.4 Torneos 1v1 | 4-12 sem c/u | Transformativo |

---

## COSTOS CONSOLIDADOS (1000 alumnos activos, todos los loops)

| Loop | Ideas | Costo/mes | IA requerida |
|------|-------|-----------|-------------|
| **Loop 1** (7 ideas) | Learning DNA | $0 | No |
| **Loop 2** (7 ideas) | IA Pura | $34 | Gemini Flash |
| **Loop 3** (5 ideas) | Mixtas | $13 | Gemini Flash |
| **Loop 4** (5 ideas) | Social & Emocional | $0 | No |
| **Loop 5** (6 ideas) | Visionarias | $20 | Mixto |
| **Loop 6** (4 ideas) | Metacognicion | $9 | Gemini Flash |
| **Loop 7** (5 ideas) | Profesor-Side | $10 | Gemini Flash |
| **Loop 8** (5 ideas) | Flywheel & Monetizacion | $2 | Gemini Flash |
| **Loop 9** (5 ideas) | Gamificacion 2.0 | $0 | No |
| **Loop 10** (5 ideas) | Bienestar & Anti-Burnout | $1 | Opcional |
| **Loop 11** (5 ideas) | Mobile-First | $0 | No |
| **Loop 12** (5 ideas) | Descubrimiento | $3 | Gemini Flash |
| **Loop 13** (5 ideas) | Accesibilidad | $0 | No |
| **Loop 14** (5 ideas) | AI Agents | $5 | Gemini Flash (batch) |
| **TOTAL ABSOLUTO** | **72 ideas, 14 loops** | **~$97/mes** | |

> **$97/mes para 1000 alumnos = $0.097 por alumno por mes.**
> Menos que un cafe. Para la plataforma de estudio mas personalizada del mercado.

---

## ROADMAP SUGERIDO (10 Fases, 62 ideas)

```
FASE 1 — "Conozco tu ritmo" (Semanas 1-3) — $0/mes
├── 1.1 Ritmo Circadiano
├── 1.3 Formato Favorito
├── 1.4 Micro-Sesiones Calibradas
├── 4.3 Badges de Esfuerzo (8 nuevos)
├── 2.5 Chat con Personalidad Adaptable
├── 6.2 Mapa Confianza vs Competencia
├── 10.4 Check-in Emocional Rapido
├── 12.3 Flashcard del Dia
└── 12.5 Time Capsule
    Resultado: el alumno siente que la plataforma lo conoce desde el dia 1
    Ideas: 9 | Costo: $0

FASE 2 — "Tu contenido, unico" (Semanas 4-7) — +$14/mes
├── 1.2 Dificultad Adaptativa (zona de flujo 85%)
├── 2.1 Mnemonicos Personalizados por IA
├── 2.2 Explicaciones Multi-Nivel (5 niveles)
├── 1.7 Objetivos con Micro-Metas
├── 4.5 Feedback Loop Alumno→Profesor
├── 3.3 Alertas Contextuales Inteligentes
├── 6.1 Coach de Tecnicas de Estudio
└── 10.5 Celebraciones Significativas
    Resultado: cada interaccion es diferente segun el alumno
    Ideas: 8 | Costo acumulado: $14

FASE 3 — "Tu camino, tu ritmo" (Semanas 8-12) — +$6/mes
├── 1.5 Dashboard Reconfigurable por etapa
├── 1.6 Mapa de Progreso Visual (skill tree)
├── 3.1 Learning Path Optimizer
├── 3.5 Modo Flow State
├── 2.7 Auto-Notas Inteligentes
├── 5.4 Learning Analytics Avanzados
├── 6.3 Patron Detective de Errores
└── 9.1 Sistema de Niveles Medicos
    Resultado: la plataforma guia al alumno por SU camino optimo
    Ideas: 8 | Costo acumulado: $20

FASE 4 — "Engagement a otro nivel" (Semanas 13-17) — +$1/mes
├── 9.2 Misiones Diarias y Semanales
├── 9.3 Temporadas y Eventos
├── 9.5 Avatar y Personalizacion Visual
├── 10.1 Detector de Burnout
├── 10.2 Pomodoro Integrado con Datos
├── 10.3 Modo Examen-Sano
├── 11.1 Modo Colectivo (2 min)
└── 4.4 Onboarding Personalizado
    Resultado: el alumno esta enganchado Y cuidado al mismo tiempo
    Ideas: 8 | Costo acumulado: $21

FASE 5 — "Experiencia inmersiva" (Semanas 18-24) — +$24/mes
├── 2.3 Simulador de Casos Clinicos (branching)
├── 2.4 Resumen Personalizado por alumno
├── 3.2 Spaced Rep para Lectura
├── 3.4 Examen Simulacro Personalizado
├── 4.1 Compas de Estudio (Supabase Realtime)
├── 4.2 Diario de Aprendizaje
├── 6.4 Teach-Back Individual
└── 12.1 Feed de Descubrimiento
    Resultado: cada sesion es una experiencia completa y personalizada
    Ideas: 8 | Costo acumulado: $45

FASE 6 — "Mobile everywhere" (Semanas 25-28) — +$3/mes
├── 11.2 Notificaciones con Micro-Contenido
├── 11.3 Offline Mode con Sync
├── 11.4 Widget de Home Screen
├── 11.5 Modo PiP para Video
├── 12.2 Rabbit Hole Mode
└── 12.4 Conexiones con Mundo Real
    Resultado: estudiar en cualquier lugar, cualquier momento
    Ideas: 6 | Costo acumulado: $48

FASE 7 — "El profesor tambien" (Semanas 29-34) — +$10/mes
├── 7.1 Dashboard de Debilidades Colectivas
├── 7.2 Asistente de Creacion de Contenido
├── 7.3 Generador de Examenes Inteligente
├── 7.4 Alertas Tempranas para Profesor
└── 7.5 Templates de Curso por Materia
    Resultado: el profesor crea contenido 3x mas rapido y mas efectivo
    Ideas: 5 | Costo acumulado: $58

FASE 8 — "El futuro" (Semanas 35-42) — +$20/mes
├── 5.1 Digital Twin Academico
├── 5.2 Google Calendar Integration
├── 5.3 Voice-First Learning
├── 5.5 Contenido Comunitario
├── 5.6 Adaptive Testing (CAT)
└── 9.4 Torneos y Desafios 1v1
    Resultado: Axon es la plataforma mas personalizada del mercado
    Ideas: 6 | Costo acumulado: $78

FASE 9 — "Analogias y conexiones" (Semanas 43-46) — +$5/mes
├── 2.6 Analogias Inter-Materias
└── 2.4 version completa (resumenes hiper-personalizados)
    Resultado: cada concepto conecta con todo lo demas
    Ideas: 2 | Costo acumulado: $83

FASE 10 — "Escalar y monetizar" (Semanas 47+) — +$9/mes
├── 8.1 Data Flywheel (optimizar loops)
├── 8.2 Personalizacion Premium (monetizacion)
├── 8.3 Benchmark Inter-Institucional
├── 8.4 API de Integraciones Academicas
└── 8.5 Axon Insights (reportes IA)
    Resultado: Axon se convierte en plataforma y ecosistema
    Ideas: 5 | Costo acumulado: $92/mes (TECHO)

TOTAL: 62 ideas en 10 fases (~47 semanas = ~1 ano)
COSTO FINAL: $92/mes para 1000 alumnos ($0.092/alumno/mes)
```

---

## METRICAS DE EXITO

Para cada fase, medir:
1. **Retencion:** D7, D14, D30 (% alumnos que vuelven)
2. **Engagement:** Sesiones/semana, duracion promedio, formatos usados
3. **Mastery velocity:** Cuanto tarda un alumno en llegar a p_know > 0.75 por topic
4. **Satisfaction:** NPS in-app (micro-survey post-sesion, cada 2 semanas)
5. **Conversion:** Free → Pro (si la personalizacion se convierte en feature premium)

---

## NOTAS FINALES

### Lo que hace a Axon UNICO vs la competencia

La mayoria de plataformas educativas personalizan en UNA dimension (dificultad). Con estos 14 loops, Axon personaliza en CATORCE:

1. **Dificultad** — zona de flujo 85%, calibracion adaptativa (FSRS + BKT)
2. **Formato** — detecta si prefiere flashcards, quizzes, lectura, video, voz
3. **Timing** — ritmo circadiano, duracion optima, deadline-aware, micro-momentos
4. **Emocion** — motivacion, esfuerzo, resiliencia, check-in emocional, celebraciones
5. **Contenido** — mnemonicos, analogias, explicaciones multi-nivel, resumenes unicos
6. **Camino** — secuencia optima, prerequisitos, learning path, skill tree
7. **Metacognicion** — confianza vs competencia, patrones de error, teach-back, coaching
8. **Social** — compas de estudio, desafios 1v1, torneos, contenido comunitario
9. **Institucional** — dashboard profesor, templates, benchmarks, insights
10. **Bienestar** — anti-burnout, pomodoro calibrado, examen-sano, celebraciones con datos
11. **Narrativa** — niveles con desbloqueo, temporadas, misiones, avatar, time capsule
12. **Descubrimiento** — feed personalizado, rabbit hole, flashcard del dia, mundo real
13. **Accesibilidad** — daltonismo, dislexia, TDAH, bajo ancho de banda, multi-idioma
14. **Proactividad** — AI agents que preparan, detectan y generan contenido en background

### Competencia directa y como Axon se diferencia

| Competidor | Dimensiones | Lo que Axon hace diferente |
|-----------|:-----------:|---------------------------|
| **Anki** | 1 | +11 dimensiones, UI moderna, IA, gamificacion |
| **Quizlet** | 2 | +Camino, +Metacognicion, +Bienestar, +Narrativa |
| **Osmosis** | 2 | +Adaptativo, +Knowledge graph, +Casos clinicos, +Social |
| **Lecturio** | 2 | +Timing, +Social, +Profesor-side, +Mobile |
| **Amboss** | 3 | +FSRS, +BKT, +Metacognicion, +Bienestar, +Descubrimiento |
| **Duolingo** | 4 | +Profundidad medica, +Profesor-side, +Metacognicion |
| **Khan Academy** | 3 | +Gamificacion narrativa, +Social, +Bienestar, +Institucional |

**Ninguna plataforma del mercado personaliza en 14 dimensiones simultaneamente.**
**Axon seria la primera.**

### Competencia directa y como Axon se diferencia

| Competidor | Dimensiones | Lo que Axon hace diferente |
|-----------|:-----------:|---------------------------|
| **Anki** | 1 | +13 dimensiones, UI moderna, IA, gamificacion |
| **Quizlet** | 2 | +Camino, +Metacognicion, +Bienestar, +Narrativa |
| **Osmosis** | 2 | +Adaptativo, +Knowledge graph, +Casos clinicos, +Social |
| **Lecturio** | 2 | +Timing, +Social, +Profesor-side, +Mobile |
| **Amboss** | 3 | +FSRS, +BKT, +Metacognicion, +Bienestar, +Accesibilidad |
| **Duolingo** | 4 | +Profundidad medica, +Profesor-side, +AI Agents |
| **Khan Academy** | 3 | +Gamificacion narrativa, +Social, +Proactividad |
| **Coursera** | 2 | +Adaptativo, +Accesible, +Proactivo, +Emocional |

### Resumen del documento (v2.0)

| Metrica | Valor |
|---------|-------|
| Total de ideas | **72** |
| Loops | **14** |
| Ideas sin costo de IA | **42** (58%) |
| Ideas con IA < $5/mes | **20** (28%) |
| Ideas con IA > $5/mes | **10** (14%) |
| Costo total (1000 alumnos) | **$97/mes** |
| Costo por alumno | **$0.097/mes** |
| Dimensiones de personalizacion | **14** |
| Tablas nuevas propuestas | **14** |
| Fases del roadmap | **10** |
| Esfuerzo total estimado | **~55 semanas** (~1 ano) |

### El "One-Liner" de Axon

> **"Axon no es una plataforma de estudio. Es TU plataforma de estudio."**

### Principios de Diseno de Personalizacion

1. **Datos antes que features** — Cada idea usa datos que YA existen en la DB. Si no existen, se crean organicamente con el uso.
2. **Gradual reveal** — No mostrar 72 features el dia 1. Desbloquear progresivamente con niveles y confianza.
3. **El alumno tiene control** — Cada feature tiene opt-out. Nada es forzado. La personalizacion es un servicio, no una imposicion.
4. **Privacidad by default** — Datos del alumno son SUYOS. Compartir con profesor/institucion requiere consentimiento explicito.
5. **Lo simple primero** — Si funciona con reglas, no usar IA. Si funciona con IA local, no llamar a API. Optimizar costo siempre.
6. **Celebrar el esfuerzo, no solo el resultado** — El sistema valora consistencia y resiliencia tanto como accuracy.
7. **Bienestar > productividad** — Si el alumno necesita descansar, la plataforma lo dice. Un alumno quemado no aprende.
8. **Accesibilidad no es feature premium** — Todos los modos de accesibilidad son gratuitos, siempre.

---

## APENDICE A: TOP 10 — Implementar Primero (Sprint 0)

> Las 10 ideas con mejor ratio impacto/esfuerzo que se pueden hacer en 2-3 semanas totales.
> Cada una es independiente — se pueden hacer en paralelo con agents.

---

### #1. Check-in Emocional (10.4) — 2-3 dias

**Spec completa:**
- **Frontend:** Componente `MoodCheckin.tsx` — 5 emojis clickeables
- **Trigger:** Se muestra 1 vez al dia, al iniciar primera sesion
- **Storage:** `mood_checkins` table (student_id, mood, session_id, created_at)
- **Efecto inmediato:** Si "cansado" → reducir suggested_cards a 5. Si "energetico" → sugerir contenido nuevo
- **Backend:** POST `/gamification/mood-checkin` + GET `/gamification/mood-history`
- **No necesita:** IA, migraciones complejas, cambios de UI existente
- **Archivos:** 1 componente nuevo + 1 endpoint + 1 migracion

---

### #2. Chat con Personalidad (2.5) — 2-3 dias

**Spec completa:**
- **Cambio:** Solo el system prompt de `/ai/rag-chat` y `/ai/tutor-chat`
- **Agregar al prompt:** Bloque condicional basado en datos del alumno:
  ```
  Si last_5_accuracy < 0.5: "Sos un tutor paciente. Explica paso a paso."
  Si last_5_accuracy > 0.95: "Sos un tutor retador. Hace preguntas Socraticas."
  Si days_since_last > 2: "Sos motivador. Celebra que volvio."
  Default: "Sos un tutor equilibrado."
  ```
- **Frontend:** Chip selector opcional en el chat: "Modo: Auto | Socratico | Explicador | Retador"
- **No necesita:** Tabla nueva, endpoint nuevo — solo editar system prompt existente
- **Archivos:** 1 archivo backend (rag-chat.ts) + 1 componente frontend (selector)

---

### #3. Badges de Esfuerzo (4.3) — 1-2 dias

**Spec completa:**
- **Backend:** Agregar 8 badges nuevos a la tabla `badges`:
  ```sql
  INSERT INTO badges (slug, name, description, icon, category, rarity, xp_reward, criteria) VALUES
  ('guerrero', 'Guerrero', '3 sesiones en un dia con accuracy < 50%', 'Sword', 'consistency', 'rare', 50, 'sessions_low_accuracy >= 3'),
  ('remontada', 'Remontada', 'p_know subio de <0.3 a >0.7 en 14 dias', 'TrendingUp', 'mastery', 'epic', 100, 'p_know_delta >= 0.4'),
  ('resiliente', 'Resiliente', 'Reconstruyo streak de 7+ dias despues de romperlo', 'Shield', 'consistency', 'rare', 75, 'streak_rebuilt'),
  ('explorador', 'Explorador', 'Estudio 5+ topics en una semana', 'Compass', 'exploration', 'common', 30, 'topics_week >= 5'),
  ('profundizador', 'Profundizador', '3+ horas en un topic en una semana', 'Search', 'study', 'rare', 50, 'hours_topic_week >= 3'),
  ('primer_paso', 'Primer Paso', 'Primera sesion de estudio', 'Footprints', 'study', 'common', 25, 'first_session'),
  ('madrugador', 'Madrugador', '5 sesiones antes de las 7am en un mes', 'Sunrise', 'consistency', 'rare', 50, 'early_sessions >= 5'),
  ('nocturno', 'Nocturno', '5 sesiones despues de las 23h en un mes', 'Moon', 'consistency', 'rare', 50, 'late_sessions >= 5');
  ```
- **Backend:** Agregar logica de check en `checkBadges()` para los nuevos criterios
- **No necesita:** Cambios frontend (BadgeShowcase ya renderiza cualquier badge)

---

### #4. Flashcard del Dia (12.3) — 2-3 dias

**Spec completa:**
- **Backend:** Cron (o endpoint) que selecciona 1 flashcard por curso/dia
  ```sql
  SELECT f.id, f.front, f.back FROM flashcards f
  JOIN keywords k ON f.keyword_id = k.id
  WHERE f.course_id = $1
    AND k.clinical_priority > 0.5
    AND f.deleted_at IS NULL
  ORDER BY RANDOM() LIMIT 1;
  ```
- **Frontend:** Widget `FlashcardOfDay.tsx` en el dashboard
  - Muestra la pregunta, boton "Mostrar respuesta"
  - Despues de responder: "145 alumnos respondieron. Accuracy: 67%"
  - Endpoint: GET `/flashcards/daily?course_id=X`
- **Backend tracking:** `daily_flashcard_responses` (student_id, flashcard_id, correct, date)
- **Archivos:** 1 componente + 1 endpoint + 1 tabla simple

---

### #5. Celebraciones con Datos (10.5) — 2-3 dias

**Spec completa:**
- **Cambio:** Modificar `LevelUpCelebration.tsx` y `BadgeEarnedToast.tsx`
- **En lugar de:** "Badge desbloqueado: Guerrero"
- **Decir:** "Badge Guerrero desbloqueado! Hoy hiciste 3 sesiones a pesar de que Farmaco estuvo dificil (accuracy 42%). Eso es caracter."
- **Datos necesarios:** Consultar `study_sessions` + `reviews` del dia para generar contexto
- **Template engine:** Sin IA — templates con placeholders:
  ```
  templates = {
    'guerrero': 'Hoy hiciste {sessions} sesiones a pesar de que {topic} estuvo dificil (accuracy {acc}%). Eso es caracter.',
    'remontada': 'Hace {days} dias, tu mastery de {topic} era {old}%. Hoy es {new}%. {diff} puntos de puro esfuerzo.',
    'streak_7': 'En estos 7 dias respondiste {cards} flashcards y {quizzes} quizzes. Cada dia conto.'
  }
  ```
- **Archivos:** Editar 2 componentes existentes + crear `celebrationTemplates.ts`

---

### #6. Ritmo Circadiano (1.1) — 3-5 dias

**Spec completa:**
- **Backend:** Endpoint GET `/analytics/circadian-profile?student_id=X`
  ```sql
  SELECT
    EXTRACT(HOUR FROM started_at) AS hour,
    COUNT(*) AS sessions,
    AVG(CASE WHEN accuracy > 0 THEN accuracy END) AS avg_accuracy
  FROM study_sessions
  WHERE student_id = $1 AND started_at > NOW() - INTERVAL '30 days'
  GROUP BY EXTRACT(HOUR FROM started_at)
  ORDER BY sessions DESC;
  ```
- **Calculo:** `peak_hours` = top 3 horas por sessions * avg_accuracy
- **Storage:** En `user_profiles.preferences` → `circadian: {peak_hours, type, confidence}`
- **Frontend:** Widget en analytics: "Tu mejor rendimiento es entre 21:00 y 23:00"
- **Integracion:** Telegram/WhatsApp reminders se envian a `peak_hours[0] - 30min`
- **Archivos:** 1 endpoint + 1 widget + editar notification scheduler

---

### #7. Formato Favorito (1.3) — 2-3 dias

**Spec completa:**
- **Backend:** Endpoint GET `/analytics/format-affinity?student_id=X`
  ```sql
  SELECT
    type, -- 'flashcard', 'quiz', 'reading', 'video'
    COUNT(*) AS sessions,
    SUM(duration_seconds) AS total_time,
    AVG(accuracy) AS avg_accuracy
  FROM study_sessions
  WHERE student_id = $1 AND started_at > NOW() - INTERVAL '30 days'
  GROUP BY type
  ORDER BY (COUNT(*) * 0.3 + AVG(accuracy) * 0.4 + SUM(duration_seconds)::float / 3600 * 0.3) DESC;
  ```
- **Frontend:**
  - Study Hub reordena opciones poniendo formato favorito primero
  - Widget: "Tu formato mas efectivo: Flashcards (78% accuracy)"
- **Archivos:** 1 endpoint + editar Study Hub ordering

---

### #8. Mapa Confianza vs Competencia (6.2) — 3-5 dias

**Spec completa:**
- **Frontend:** Pre-quiz modal: "Del 1 al 5, que tan preparado te sentis?"
- **Post-quiz:** Scatter plot con Recharts (ya instalado)
- **Backend:**
  ```sql
  CREATE TABLE confidence_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id),
    topic_id UUID NOT NULL REFERENCES topics(id),
    confidence_score INTEGER NOT NULL CHECK (confidence_score BETWEEN 1 AND 5),
    actual_score NUMERIC,
    quiz_id UUID REFERENCES quizzes(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ```
- **Visualizacion:** Scatter con linea diagonal = calibracion perfecta
- **Insight:** "Cuidado con Farmaco: crees que lo dominas pero tu accuracy es 52%"
- **Archivos:** 1 modal + 1 chart component + 1 tabla + 2 endpoints

---

### #9. Feedback Alumno→Profesor (4.5) — 2-3 dias

**Spec completa:**
- **Frontend:** Boton sutil en cada summary/flashcard/quiz: icono `ThumbsDown` con tooltip "No entendi"
- **Al clickear:** Optional textarea "Que no entendiste?" + submit
- **Backend:**
  ```sql
  CREATE TABLE content_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id),
    content_type TEXT NOT NULL, -- 'summary', 'flashcard', 'quiz_question'
    content_id UUID NOT NULL,
    keyword_id UUID REFERENCES keywords(id),
    feedback_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ```
- **Profesor view:** Tabla agregada: "15 alumnos marcaron 'betabloqueadores' como confuso"
- **Archivos:** 1 boton component + 1 profesor dashboard widget + 1 tabla + 2 endpoints

---

### #10. Time Capsule (12.5) — 1-2 dias

**Spec completa:**
- **Frontend:** Modal al inicio de semestre: "Escribile a tu yo del futuro"
- **Backend:**
  ```sql
  CREATE TABLE time_capsules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id),
    course_id UUID REFERENCES courses(id),
    message TEXT NOT NULL,
    semester TEXT NOT NULL, -- '2026-1'
    opened_at TIMESTAMPTZ,
    stats_snapshot JSONB, -- se llena al abrir: horas, mastery, badges, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ```
- **Trigger apertura:** Cuando `semester_end_date - NOW() < 7 days` → mostrar notificacion
- **Vista apertura:** Muestra carta original + stats reales del semestre
- **Archivos:** 1 modal write + 1 modal read + 1 tabla + 2 endpoints

---

## APENDICE B: Hallazgos del Audit de Accesibilidad

> Datos del agente de investigacion. Util para priorizar Loop 13.

**Lo que YA existe (buena base):**
- 50+ ARIA labels semanticos
- 100+ focus-visible rings (teal/purple)
- 40+ keyboard handlers (Enter/Space/Escape)
- 64 touch targets de 44px minimo (standard iOS)
- aria-live="polite" en chat
- MobileDrawer responsive (340px)
- 514+ clases responsive (sm:/md:/lg:)
- Fluid typography con clamp()

**Lo que FALTA (oportunidades):**
- Dark mode: UIContext tiene toggle pero esta hardcoded en 'light'
- Modos de accesibilidad: Zero (daltonismo, dislexia, TDAH)
- PWA/Offline: Zero (no manifest, no service worker)
- Mood/Wellness tracking: Zero
- i18n framework: Strings hardcoded (pt-BR y es mezclados)
- Reduced motion: No `prefers-reduced-motion` media query
- High contrast mode: No existe
- Font size control: No existe

**Quick win de accesibilidad (no en los loops):**
- Activar dark mode: UIContext ya tiene la infra, solo falta:
  1. Agregar `dark:` variants a los componentes existentes
  2. Toggle en preferences
  3. `prefers-color-scheme` media query como default
  - **Esfuerzo:** 3-5 dias | **Impacto:** Alto (muchos alumnos estudian de noche)

---

# PARTE III — LOOPS DE SEGUNDA GENERACION (15-20)

> Estas ideas van mas alla de la personalizacion del alumno individual.
> Tocan: cross-platform, content discovery, assessment innovation,
> profesor-side, AI agents, y el data flywheel que conecta todo.

---

## LOOP 15 — Cross-Platform Study: Estudiar Donde Estes 📱
**Tipo: Mixta | Prerequisitos: Telegram Bot + WhatsApp ya existen**

> El alumno no siempre esta frente a la computadora. Ya tenemos Telegram y WhatsApp.
> La personalizacion aqui es: adaptar el CANAL al contexto del alumno.

### 15.1 Micro-Reviews por Telegram/WhatsApp
**Tipo: No-IA**
- **Que:** Enviar 3-5 flashcards due como mensajes interactivos
- **Como:** Inline keyboard en Telegram, interactive buttons en WhatsApp
- **Personalizacion:** Solo enviar del topic con mas cards due, en el horario optimo (ritmo circadiano)
- **Flow:**
  ```
  Bot: "Hola! Tienes 12 cards pendientes de Farmaco. Repasamos 3 rapidas?"
  [Si, dale] [Ahora no]
  Bot: "Cual es el mecanismo de accion del Enalapril?"
  [Mostrar respuesta]
  Bot: "Enalapril: Inhibidor de la ECA. Reduce angiotensina II..."
  [Facil ✅] [Bien 👍] [Dificil ⚠️] [No sabia ❌]
  ```
- **Impacto:** Reviews FSRS reales sin abrir la app. Estudiar en el bus, en la fila, etc.
- **Esfuerzo:** 5-7 dias (backend formatting + button handlers)
- **Data:** Cada review por mensaje actualiza FSRS como si fuera en la app

### 15.2 Daily Digest Personalizado
**Tipo: IA**
- **Que:** Mensaje matinal personalizado con resumen del dia
- **Template IA:**
  ```
  "Buenos dias {nombre}! 🌅

  Tu dia de estudio:
  • 8 flashcards pendientes (Farmaco: 5, Anatomia: 3)
  • Quiz de Patologia disponible (nuevo!)
  • Tu streak: 12 dias 🔥
  • Meta diaria: 100 XP (ayer hiciste 145!)

  Consejo: Ayer te costaron los betabloqueadores.
  Hoy hay 2 cards de repaso sobre eso.

  [Empezar a estudiar 📚]"
  ```
- **IA genera:** El "consejo" personalizado basado en weak spots + contenido nuevo
- **Esfuerzo:** 3-5 dias
- **Horario:** Se envia a `peak_hours[0] - 30min` (ritmo circadiano, Loop 1)

### 15.3 Notificaciones Contextuales Inteligentes
**Tipo: No-IA**
- **Que:** Notificaciones que saben CUANDO no molestar
- **Reglas:**
  - No enviar si ya estudio hoy (studied_today = true)
  - No enviar si mood del dia es "cansado" o "estresado"
  - No enviar en horarios fuera de peak (circadiano)
  - Frecuencia maxima: 2 notificaciones/dia
  - Si ignoro 3 consecutivas → reducir frecuencia automaticamente
- **Tipos de notificacion:**
  - "Streak en riesgo!" (solo si streak > 3 dias — no molestar por streak de 1 dia)
  - "Quiz nuevo disponible en {topic}" (solo si topic es del interes del alumno)
  - "Meta diaria al 80%! Te faltan 20 XP" (motivacional, solo PM)
- **Esfuerzo:** 3-5 dias (logica condicional en notification scheduler)

### 15.4 PWA + Offline Mode
**Tipo: No-IA | Prerequisito: Service Worker**
- **Que:** Instalar Axon como app en el celular, estudiar sin internet
- **Offline cache:**
  - Flashcards due de hoy (pre-fetch al conectarse)
  - Ultimo summary leido (cache local)
  - UI shell completa
- **Sync:** Al reconectar, sincronizar reviews offline con FSRS backend
- **Personalizacion:** El cache priorizaria el formato favorito del alumno (Loop 1.3)
- **Esfuerzo:** 7-10 dias (service worker + sync logic + cache strategy)
- **Impacto:** ALTISIMO para alumnos con internet inestable (contexto LATAM)

### 15.5 Voice Study Mode (Telegram)
**Tipo: IA | Prerequisito: Speech-to-text**
- **Que:** Estudiar por audio en Telegram
- **Flow:**
  ```
  Bot: [Audio] "Cual es la diferencia entre Enalapril y Losartan?"
  Alumno: [Audio] "Enalapril es un IECA y Losartan es un ARA II..."
  Bot: [Audio] "Correcto! Enalapril inhibe la ECA, Losartan bloquea AT1.
        Tu respuesta cubrio el mecanismo pero te falto mencionar
        las diferencias en efectos adversos. Un dato clave:
        los IECA pueden causar tos seca, los ARA II no."
  ```
- **IA evalua:** Respuesta oral del alumno comparada con RAG del keyword
- **Esfuerzo:** 10-15 dias (TTS + STT + evaluation pipeline)
- **Impacto:** Estudiar mientras caminas, cocinas, etc. Hands-free learning.

---

## LOOP 16 — Content Discovery: El Netflix de Estudiar 🎯
**Tipo: Mixta | Usa datos existentes**

> El alumno no deberia tener que buscar que estudiar.
> La plataforma deberia SABER que le conviene y presentarselo.

### 16.1 "Para Ti" — Feed Personalizado
**Tipo: No-IA**
- **Que:** Homepage que muestra contenido curado para el alumno
- **Algoritmo de ranking (sin IA):**
  ```
  score = (
    urgency_weight * days_overdue / 7  +    // cards/quizzes que ya deberian haberse revisado
    weakness_weight * (1 - p_know)     +    // topics donde mas le cuesta
    freshness_weight * is_new_content  +    // contenido recien publicado por profesor
    format_weight * format_affinity    +    // formato que mas le gusta (Loop 1.3)
    social_weight * peers_studying          // topics que sus companeros estan estudiando
  )
  ```
- **Secciones:**
  - "Continuar donde dejaste" (ultima sesion incompleta)
  - "Te conviene repasar" (highest urgency score)
  - "Nuevo de tus profesores" (contenido reciente)
  - "Popular esta semana" (social proof)
- **Esfuerzo:** 5-7 dias
- **Impacto:** Reduce decision fatigue — el alumno abre y YA SABE que hacer

### 16.2 Pathways Adaptativos
**Tipo: IA**
- **Que:** Rutas de estudio sugeridas basadas en objetivos
- **Input alumno:** "Tengo examen de Farmaco en 15 dias"
- **Output IA:**
  ```
  Plan personalizado para tu examen de Farmaco (15 dias):

  Semana 1: Refuerzo de bases
  ├── Dia 1-2: AINES (p_know: 0.45 — necesitas trabajo)
  ├── Dia 3-4: Antibioticos (p_know: 0.62 — repaso rapido)
  └── Dia 5: Quiz diagnostico de la semana

  Semana 2: Temas criticos
  ├── Dia 6-7: Antihipertensivos (p_know: 0.38 — CRITICO)
  ├── Dia 8-9: Analgesicos opioides (p_know: 0.71 — mantenimiento)
  └── Dia 10: Simulacro parcial

  Dias 11-15: Repaso final
  └── Solo flashcards de topics con p_know < 0.7

  Estimacion: Si seguis el plan, accuracy en examen: ~72%
  ```
- **Personalizacion:** Usa p_know de BKT real, formato favorito, ritmo circadiano
- **Esfuerzo:** 7-10 dias (IA genera plan, backend crea study_plan tasks)
- **Impacto:** Diferenciador masivo vs Anki/Quizlet (que no saben de examenes)

### 16.3 Prerequisitos Inteligentes
**Tipo: IA**
- **Que:** Detectar y sugerir prerequisitos que el alumno no domina
- **Ejemplo:**
  ```
  Antes de estudiar "Insuficiencia Cardiaca",
  te recomendamos repasar:

  ⚠️ Fisiologia Cardiovascular (p_know: 0.35 — debil)
  ✅ Farmacologia de Diureticos (p_know: 0.82 — ok)
  ⚠️ Anatomia del Corazon (p_know: 0.41 — debil)

  [Repasar prerequisitos primero] [Continuar de todas formas]
  ```
- **IA genera:** Grafo de dependencias entre topics usando embeddings de similarity
- **Backend:** Tabla `topic_prerequisites` (topic_id, prerequisite_id, weight, source)
  - Source: 'manual' (profesor define) o 'ai_suggested' (IA detecta)
- **Esfuerzo:** 7-10 dias
- **Impacto:** Evita frustration de estudiar algo sin las bases

### 16.4 "Alumnos como tu tambien estudiaron..."
**Tipo: No-IA**
- **Que:** Recomendaciones basadas en peers similares (collaborative filtering)
- **Definicion de "similar":**
  - Mismo curso + misma institucion
  - Accuracy promedio en rango ±10%
  - Horas de estudio semanales similares
- **Query:**
  ```sql
  -- Encontrar peers similares
  WITH my_profile AS (
    SELECT avg_accuracy, weekly_hours FROM student_analytics WHERE student_id = $1
  ),
  similar_peers AS (
    SELECT student_id FROM student_analytics sa, my_profile mp
    WHERE sa.course_id = $2
      AND ABS(sa.avg_accuracy - mp.avg_accuracy) < 0.1
      AND sa.student_id != $1
    LIMIT 20
  )
  -- Encontrar topics que ellos estudian y yo no
  SELECT k.name, COUNT(*) as peer_count
  FROM study_sessions ss
  JOIN keywords k ON ss.keyword_id = k.id
  WHERE ss.student_id IN (SELECT student_id FROM similar_peers)
    AND ss.keyword_id NOT IN (
      SELECT keyword_id FROM study_sessions WHERE student_id = $1
    )
  GROUP BY k.name
  ORDER BY peer_count DESC
  LIMIT 5;
  ```
- **Display:** "3 companeros con tu nivel tambien estudiaron {topic}"
- **Esfuerzo:** 3-5 dias
- **Impacto:** Social proof sin exponer datos individuales

### 16.5 Resumen Semanal "Tu Semana en Axon"
**Tipo: Mixta**
- **Que:** Email/mensaje semanal estilo Spotify Wrapped pero cada semana
- **Contenido:**
  ```
  📊 Tu semana en Axon (17-23 Mar 2026)

  ⏱ Estudiaste 4h 32min (vs 3h la semana pasada — +50%!)
  📚 78 flashcards revisadas
  ✅ 2 quizzes completados (accuracy: 74%)
  🔥 Streak: 12 dias
  🏆 Ranking: #7 de 45 alumnos

  💪 Tu mayor logro: Subiste Farmaco de 52% a 68%
  ⚠️ Atencion: Anatomia bajo de 71% a 65%

  🎯 La proxima semana te recomendamos:
  1. 15min/dia de Anatomia (para recuperar)
  2. Seguir con Farmaco (estas en racha)
  3. Empezar el quiz de Patologia (pendiente)
  ```
- **Personalizacion:** Cada seccion se basa en datos reales del alumno
- **Esfuerzo:** 3-5 dias (template + data aggregation + cron)
- **Canal:** Email, Telegram, o WhatsApp (preferencia del alumno)

---

## LOOP 17 — Assessment Innovation: Mas Alla del Multiple Choice 📝
**Tipo: Mixta | Prerequisitos parciales**

> Los quizzes MCQ testean reconocimiento, no comprension.
> La personalizacion del assessment es TAN importante como la del contenido.

### 17.1 Quizzes Adaptativos en Tiempo Real
**Tipo: No-IA**
- **Que:** El quiz se adapta DURANTE la sesion basandose en respuestas
- **Algoritmo:**
  ```
  if last_3_correct:
    next_question = get_harder_question(current_difficulty + 1)
  elif last_3_wrong:
    next_question = get_easier_question(current_difficulty - 1)
  else:
    next_question = get_same_difficulty(current_difficulty)
  ```
- **Niveles de dificultad:** Bloom's taxonomy (Remember → Understand → Apply → Analyze → Evaluate → Create)
- **Personalizacion:** El quiz encuentra el nivel justo del alumno — ni aburrido ni frustrante
- **Datos:** `questions.difficulty_level` (ya existe como campo?) + `student_responses`
- **Esfuerzo:** 5-7 dias
- **Impacto:** Assessment que realmente mide — no penaliza ni infla

### 17.2 Preguntas Abiertas con Evaluacion IA
**Tipo: IA**
- **Que:** "Explica con tus palabras el mecanismo de accion de los IECA"
- **Evaluacion IA:**
  ```json
  {
    "score": 7,
    "max_score": 10,
    "concepts_mentioned": ["ECA", "angiotensina II", "vasodilatacion"],
    "concepts_missing": ["bradicinina", "aldosterona"],
    "feedback": "Buena explicacion del mecanismo principal. Te falto mencionar
                 que al inhibir la ECA tambien se acumula bradicinina (que causa
                 la tos tipica como efecto adverso) y que baja la aldosterona
                 (efecto natriuretico)."
  }
  ```
- **Rubrica:** IA compara contra el contenido del summary/keyword en RAG
- **Personalizacion:** El nivel de exigencia se adapta al p_know del alumno
  - p_know < 0.5: Evaluar conceptos basicos, ser generoso
  - p_know > 0.8: Exigir precision, conexiones, aplicacion clinica
- **Esfuerzo:** 7-10 dias
- **Impacto:** Testea comprension real, no solo reconocimiento de opciones

### 17.3 Casos Clinicos Interactivos
**Tipo: IA**
- **Que:** Simulacion de caso clinico paso a paso
- **Flow:**
  ```
  IA: "Paciente masculino de 55 anos consulta por disnea progresiva
       de 3 semanas de evolucion. Antecedentes: HTA hace 10 anos.
       Que le preguntarias primero?"

  Alumno: "Le preguntaria sobre medicacion actual"

  IA: "Buena pregunta. El paciente toma Enalapril 10mg/dia desde hace
       5 anos. Tambien menciona edema en miembros inferiores hace 1 semana.
       Que estudios solicitarias?"

  Alumno: "Ecocardiograma y BNP"

  IA: "Excelente eleccion. El ecocardiograma muestra FEVI 35%.
       BNP elevado. Con estos datos, cual es tu diagnostico
       y plan terapeutico?"
  ```
- **Personalizacion:**
  - Caso generado sobre topics donde p_know esta entre 0.4-0.7 (zona de aprendizaje)
  - Complejidad del caso basada en nivel del alumno
  - Keywords del caso se cruzan con weak spots
- **Esfuerzo:** 10-15 dias (IA conversacional + rubrica + tracking)
- **Impacto:** DIFERENCIADOR UNICO vs Anki/Quizlet. Medicina necesita razonamiento clinico.

### 17.4 Auto-Evaluacion Guiada (Flashcard Extendida)
**Tipo: No-IA**
- **Que:** Despues de voltear la flashcard, guia de auto-evaluacion
- **En lugar de:** "Facil / Bien / Dificil / No sabia"
- **Preguntar:**
  ```
  Antes de calificarte, responde:
  ☐ Pude recordar la respuesta ANTES de voltear? (recall)
  ☐ Mi respuesta mental fue completa? (completeness)
  ☐ Podria explicarselo a un companero? (transfer)
  ☐ Se en que situacion clinica aplicaria esto? (application)

  Basado en tus respuestas: rating sugerido = "Bien" (3/4 criterios)
  [Aceptar sugerencia] [Cambiar a Facil] [Cambiar a Dificil]
  ```
- **Personalizacion:** Entrena al alumno a ser mejor auto-evaluador
- **Calibracion:** Compara auto-evaluacion vs performance futura para detectar sesgos
- **Esfuerzo:** 3-5 dias (UI changes + optional checklist)
- **Impacto:** Mejora calidad de reviews FSRS → mejor scheduling → mejor aprendizaje

### 17.5 Examen Simulacro Personalizado
**Tipo: IA**
- **Que:** "Simula un examen de Farmaco como el de mi universidad"
- **Input:** Alumno describe formato del examen real (MCQ, casos, abierta, mix)
- **IA genera:**
  - N preguntas distribuidas por topic segun peso del programa
  - Dificultad calibrada al nivel del alumno
  - Timer configurable
  - Condiciones de examen (no hints, no volver atras)
- **Post-examen:**
  ```
  Resultado: 68/100

  Diagnostico:
  ✅ AINES: 90% — Dominas este tema
  ⚠️ Antibioticos: 60% — Necesitas repasar aminoglucosidos
  ❌ Antihipertensivos: 40% — Area critica

  Plan de accion sugerido: [Generar plan de repaso]

  Comparacion con tu historial:
  Hace 30 dias habrias sacado ~55%. Mejoraste 13 puntos.
  ```
- **Esfuerzo:** 10-15 dias
- **Impacto:** Prediccion de performance en examen real. Reduce ansiedad.

---

## LOOP 18 — Professor-Side Personalization: El Profesor Tambien Se Beneficia 👨‍🏫
**Tipo: Mixta | Usa datos existentes**

> La personalizacion no es solo para alumnos.
> Un profesor que entiende CADA alumno ensena mejor.

### 18.1 Dashboard de Alumno Individual (Professor View)
**Tipo: No-IA**
- **Que:** Cuando un profesor clickea un alumno, ver SU perfil completo
- **Datos mostrados:**
  ```
  ALUMNO: Maria Garcia | Nivel 7 (Experto) | Streak: 15 dias

  📊 Overview:
  • Formato favorito: Flashcards (65% de su tiempo)
  • Ritmo: Estudia mejor de noche (21-23h)
  • Promedio accuracy: 72%
  • Tendencia: ↑ mejorando (+5% esta semana)

  🎯 Topics por mastery:
  ████████████░ Farmaco: 85% ✅
  ████████░░░░ Anatomia: 62% ⚠️
  ████░░░░░░░░ Patologia: 35% ❌

  ⚠️ Alertas:
  - Bajo rendimiento en Antibioticos (3 quizzes < 50%)
  - No ha estudiado Patologia en 12 dias
  - Confianza alta pero accuracy baja en Antihipertensivos (Dunning-Kruger?)
  ```
- **Privacidad:** Profesor solo ve datos academicos, NUNCA mood/bienestar
- **Esfuerzo:** 5-7 dias (aggregation endpoint + dashboard page)
- **Impacto:** Profesor puede intervenir ANTES de que el alumno repruebe

### 18.2 Alertas Tempranas para Profesores
**Tipo: No-IA**
- **Que:** Notificaciones automaticas al profesor sobre alumnos en riesgo
- **Triggers:**
  ```
  ALERTA ALTA:
  - Alumno no entra hace 7+ dias (y tenia streak activo)
  - accuracy cayo >15% en una semana
  - 3 quizzes consecutivos con <50%

  ALERTA MEDIA:
  - p_know de un topic cayo de >0.7 a <0.5 en 14 dias
  - Alumno usando streakFreeze >2 veces en una semana
  - Tiempo de estudio semanal bajo 50% vs promedio anterior

  INFORMATIVA:
  - Alumno alcanzo mastery (p_know > 0.9) en un topic
  - Alumno completo 100% de un plan de estudio
  - Alumno en top 3 del leaderboard
  ```
- **Canal:** Dashboard card + opcionalmente Telegram/Email
- **Esfuerzo:** 5-7 dias (scheduled checker + notification system)
- **Impacto:** Intervencion temprana salva alumnos

### 18.3 Content Effectiveness Analytics
**Tipo: No-IA**
- **Que:** El profesor ve QUE contenido funciona y cual no
- **Dashboard:**
  ```
  📊 Tus Flashcards — Efectividad:

  Top 5 (mas faciles de aprender):
  1. "Mecanismo del Enalapril" — 89% first-try correct
  2. "Clasificacion de Diureticos" — 82% first-try correct

  Bottom 5 (mas dificiles):
  1. "Interacciones de Warfarina" — 23% first-try correct ⚠️
  2. "Dosis pediatricas de Amoxicilina" — 31% first-try correct

  💡 Sugerencia: "Interacciones de Warfarina" podria beneficiarse
     de una tabla comparativa. 15 alumnos la marcaron como "confusa".
  ```
- **Datos:** Aggregate de `reviews` por flashcard_id + `content_feedback` (Loop 4.5)
- **Esfuerzo:** 3-5 dias (aggregation queries + visualization)
- **Impacto:** Feedback loop profesor↔contenido↔alumno

### 18.4 Generacion de Contenido Guiada por Datos
**Tipo: IA**
- **Que:** IA sugiere QUE contenido crear basado en gaps de los alumnos
- **Flow profesor:**
  ```
  IA: "Analice los datos de tus 45 alumnos de Farmaco. Detecte:

  1. 28 alumnos tienen p_know < 0.4 en 'Interacciones medicamentosas'
     pero no tienes flashcards sobre ese tema.
     → [Generar 10 flashcards de interacciones]

  2. El quiz de 'Antibioticos' tiene 3 preguntas que TODOS fallan.
     Probablemente estan mal formuladas o el contenido no lo cubre.
     → [Ver preguntas problematicas] [Regenerar preguntas]

  3. 12 alumnos marcaron 'farmacocinetica de opioides' como confuso.
     Tu summary no tiene seccion dedicada.
     → [Agregar seccion al summary] [Generar flashcards]"
  ```
- **Esfuerzo:** 7-10 dias (analytics pipeline + IA suggestions + smart-gen integration)
- **Impacto:** El profesor crea contenido que SABE que es necesario, no intuye

### 18.5 Diferenciacion por Grupo de Nivel
**Tipo: No-IA**
- **Que:** Profesor puede asignar contenido diferente por nivel del alumno
- **Ejemplo:**
  ```
  Asignar flashcards de "Antihipertensivos":

  ☐ Nivel 1-4 (Basico): 10 cards de mecanismo + clasificacion
  ☐ Nivel 5-8 (Intermedio): + 10 cards de dosis y efectos adversos
  ☐ Nivel 9-12 (Avanzado): + 10 cards de interacciones y casos

  [Asignar por nivel automaticamente] [Asignar a todos igual]
  ```
- **Backend:** `content_assignments` tabla con campo `min_level` y `max_level`
- **Esfuerzo:** 5-7 dias (assignment logic + professor UI)
- **Impacto:** Cada alumno recibe contenido a su nivel — sin intervenir manualmente

---

## LOOP 19 — AI Agents Autonomos: El Copilot de Estudio 🤖
**Tipo: IA pura | Prerequisitos: LLM API + datos del alumno**

> No un chatbot que responde preguntas.
> Un AGENTE que actua proactivamente para ayudar al alumno.

### 19.1 Study Buddy Agent
**Tipo: IA**
- **Que:** Agente que "vive" en la plataforma y conoce al alumno
- **Personalidad:** Evoluciona con el nivel del alumno
  - Nivel 1-4: "Companero de estudio" — motivacional, explica basico
  - Nivel 5-8: "Tutor avanzado" — hace preguntas Socraticas, debate
  - Nivel 9-12: "Colega academico" — discute papers, casos complejos
- **Acciones proactivas:**
  ```
  [Despues de 3 flashcards dificiles seguidas]
  Buddy: "Noto que Antibioticos te esta costando.
          ¿Queres que te explique la clasificacion con un mnemotecnico?"

  [Cuando detecta patron de error]
  Buddy: "Siempre confundis IECA con ARA II.
          ¿Te armo una tabla comparativa?"

  [Cuando el alumno lleva 90min estudiando]
  Buddy: "Llevas 90 minutos. Tu accuracy bajo de 78% a 61%.
          Te sugiero un break de 15 min. ¿Pongo timer?"
  ```
- **Contexto:** Acceso a reviews, p_know, mood, streak, weak spots — TODO
- **Esfuerzo:** 15-20 dias (agent framework + context injection + action handlers)
- **Impacto:** DIFERENCIADOR MAXIMO. Ningun competidor tiene esto.

### 19.2 Error Pattern Detective
**Tipo: IA**
- **Que:** Agente que analiza PATRONES en los errores, no errores individuales
- **Detecciones:**
  ```
  📊 Patron detectado en tus ultimas 200 reviews:

  1. CONFUSION SISTEMATICA: Confundis farmacos que terminan en "-pril" con
     los que terminan en "-sartan" el 73% de las veces.
     → Son clases diferentes: IECA vs ARA II.
     → [Ver tabla comparativa] [Generar flashcards especificas]

  2. DECAIMIENTO TEMPORAL: Tu accuracy cae un 25% despues de 45min de estudio.
     → Tu sesion optima es de ~40 minutos.
     → [Configurar alertas de sesion]

  3. FALSO POSITIVO RECURRENTE: Calificas como "Facil" cards que despues
     fallas. Esto afecta tu scheduling FSRS.
     → [Activar auto-evaluacion guiada] (17.4)
  ```
- **Esfuerzo:** 10-15 dias (pattern analysis + LLM interpretation + actionable suggestions)
- **Impacto:** Metacognicion asistida — el alumno aprende COMO aprende

### 19.3 Curator Agent (Content Enrichment)
**Tipo: IA**
- **Que:** Agente que enriquece el contenido automaticamente
- **Acciones autonomas (con aprobacion profesor):**
  - Detecta flashcard con accuracy < 30% → sugiere reescribirla mas clara
  - Detecta topic sin casos clinicos → genera 2-3 casos basicos
  - Detecta gap entre topics → sugiere flashcard puente
  - Detecta summary largo sin imagenes → sugiere donde agregar diagrama
- **Nivel de autonomia (configurable por profesor):**
  ```
  ☐ Solo sugerir (profesor aprueba cada cambio)
  ☐ Auto-generar borrador (profesor revisa antes de publicar)
  ☐ Full autonomo (publicar automaticamente, profesor puede revertir)
  ```
- **Esfuerzo:** 15-20 dias
- **Impacto:** Contenido que se mejora SOLO basado en datos de uso real

### 19.4 Exam Coach Agent
**Tipo: IA**
- **Que:** Agente especializado en preparacion de examenes
- **Timeline:**
  ```
  30 dias antes del examen:
  Coach: "Faltan 30 dias para Farmaco. Tu p_know promedio es 0.55.
          Para llegar a 0.75 necesitas ~25min/dia. ¿Armamos el plan?"

  15 dias antes:
  Coach: "Vas bien! p_know subio a 0.65. Pero Antibioticos esta estancado.
          Sugiero cambiar a casos clinicos para ese topic —
          a vos te funcionan mejor que las flashcards (Loop 1.3)."

  3 dias antes:
  Coach: "p_know promedio: 0.73. Hoy sugiero un simulacro (17.5).
          Solo 15 preguntas, enfocadas en tus 3 topics mas debiles.
          Mañana: repaso ligero. Pasado mañana: descanso total."

  Dia del examen:
  Coach: "Hoy es el dia! Recorda: tu fuerte es Farmaco Cardiovascular.
          Si te trabas, respira y pasa a la siguiente. Exito! 🎯"
  ```
- **Esfuerzo:** 10-15 dias (scheduling + adaptive suggestions + LLM for coaching)
- **Impacto:** Reduce ansiedad pre-examen. Coaching personalizado con datos reales.

### 19.5 Knowledge Connector Agent
**Tipo: IA**
- **Que:** Agente que encuentra conexiones entre topics que el alumno no ve
- **Ejemplo:**
  ```
  Agent: "Interesante: estas estudiando Insuficiencia Cardiaca en Patologia
          y la semana pasada revisaste Diureticos en Farmaco.

          Conexion: Los diureticos de asa (furosemida) son primera linea
          en IC para reducir congestion. Tu p_know de diureticos es 0.82
          pero de IC es 0.45.

          ¿Queres que te arme un caso clinico que conecte ambos temas?
          Usar lo que ya sabes para aprender lo nuevo."
  ```
- **Backend:** Cosine similarity entre embeddings de topics + student p_know overlay
- **Esfuerzo:** 7-10 dias (embedding similarity + context generation)
- **Impacto:** Aprendizaje interconectado, no silos. Asi funciona la medicina real.

---

## LOOP 20 — Data Flywheel & Monetizacion 💰🔄
**Tipo: Estrategica | Meta-loop que conecta todo**

> Cada feature genera datos. Cada dato mejora otra feature.
> El flywheel es lo que hace que Axon sea incopiable.

### 20.1 El Data Flywheel de Axon
**Tipo: Framework**
- **Ciclo virtuoso:**
  ```
  Alumno estudia → genera datos (reviews, accuracy, time, mood)
       ↓
  Datos alimentan personalizacion (circadiano, formato, weak spots)
       ↓
  Personalizacion mejora la experiencia
       ↓
  Mejor experiencia → mas engagement → mas datos
       ↓
  Mas datos → mejor personalizacion → FLYWHEEL
  ```
- **Efecto de red:**
  ```
  Mas alumnos en un curso →
    mejor collaborative filtering (16.4) →
    mejores recomendaciones →
    mejor engagement →
    mas alumnos se quedan
  ```
- **Moat competitivo:** Despues de 1 semestre, los datos del alumno son UNICOS a Axon.
  - Anki no sabe su ritmo circadiano
  - Quizlet no sabe sus patrones de error
  - Osmosis no tiene los datos de SU profesor
  - Nadie tiene todo junto

### 20.2 Tiers de Personalizacion (Monetizacion)
**Tipo: Estrategia**
- **Free tier (siempre gratis):**
  - FSRS basico (reviews, scheduling)
  - Flashcards, quizzes, summaries
  - Gamificacion completa (XP, badges, streak)
  - Accesibilidad completa (13.x — NUNCA es premium)
  - Check-in emocional basico

- **Pro tier ($5-8/mes/alumno):**
  - Ritmo circadiano personalizado
  - Content discovery "Para Ti" feed
  - Weekly digest detallado
  - Micro-reviews por Telegram/WhatsApp
  - Celebraciones personalizadas
  - Formato favorito detection
  - Analytics avanzados (confianza vs competencia)
  - Dark mode + modos de accesibilidad

- **Premium tier ($12-15/mes/alumno):**
  - Study Buddy Agent (19.1)
  - Casos clinicos interactivos (17.3)
  - Error Pattern Detective (19.2)
  - Exam Coach Agent (19.4)
  - Pathways adaptativos con IA (16.2)
  - Preguntas abiertas con evaluacion IA (17.2)
  - Examen simulacro personalizado (17.5)
  - Voice Study Mode (15.5)

- **Institutional tier ($20-30/alumno/mes — paga la institucion):**
  - Todo lo anterior para todos los alumnos
  - Dashboard profesor individual (18.1)
  - Alertas tempranas (18.2)
  - Content effectiveness analytics (18.3)
  - Generacion de contenido guiada por datos (18.4)
  - Diferenciacion por grupo de nivel (18.5)
  - Curator Agent (19.3)
  - Reportes de cohorte exportables
  - SLA + soporte dedicado

### 20.3 Metricas de Exito por Feature
**Tipo: Framework**
- **Engagement metrics:**
  - DAU/MAU ratio (target: >40% = "excelente" para edu)
  - Sessions/week (target: 5+ = daily habit)
  - Average session duration (target: 15-30min — ni poco ni burnout)
  - Streak length distribution (target: median >7 dias)

- **Learning metrics:**
  - p_know growth rate (target: +0.1/semana promedio)
  - Content completion rate (target: >60%)
  - Quiz accuracy trend (target: mejorando mes a mes)
  - Self-rating calibration (auto-evaluacion vs reality)

- **Personalization metrics (nuevas):**
  - Circadian adherence: % de sesiones en horario optimo
  - Format adherence: % de sesiones en formato favorito
  - Recommendation click-through rate
  - AI agent interaction rate
  - Mood improvement trend (si usa check-in emocional)

### 20.4 Competitive Moats por Feature
**Tipo: Analisis**
```
Feature                    | Anki | Quizlet | Osmosis | Axon
---------------------------|------|---------|---------|------
Spaced repetition          |  ✅  |   ❌    |   ❌    |  ✅ (FSRS v4)
Knowledge tracing (BKT)   |  ❌  |   ❌    |   ❌    |  ✅
Ritmo circadiano           |  ❌  |   ❌    |   ❌    |  ✅
Formato favorito           |  ❌  |   ❌    |   ❌    |  ✅
Check-in emocional         |  ❌  |   ❌    |   ❌    |  ✅
Casos clinicos IA          |  ❌  |   ❌    |   ✅*   |  ✅ (personalizado)
RAG sobre contenido propio |  ❌  |   ❌    |   ❌    |  ✅
Profesor analytics         |  ❌  |   ❌    |   ❌    |  ✅
Alertas tempranas          |  ❌  |   ❌    |   ❌    |  ✅
Study Buddy Agent          |  ❌  |   ❌    |   ❌    |  ✅
Exam Coach                 |  ❌  |   ❌    |   ❌    |  ✅
Cross-platform (TG/WA)     |  ❌  |   ❌    |   ❌    |  ✅
Gamificacion medica        |  ❌  |   ✅*   |   ❌    |  ✅ (12 niveles medicos)
PWA offline                |  ✅* |   ❌    |   ❌    |  ✅ (propuesto)
Accesibilidad medica       |  ❌  |   ❌    |   ❌    |  ✅ (propuesto)
```
*parcial/generico

**Conclusion del moat:** Con las 102 ideas implementadas, Axon tendria 15 ventajas competitivas que NINGUN competidor tiene. El flywheel de datos hace que la ventaja CREZCA con el uso.

### 20.5 Roadmap de Implementacion Sugerido
**Tipo: Plan**

```
FASE 1 — Quick Wins (Sprint 0, 2-3 semanas):
Top 10 del Apendice A. Sin IA. 10 features independientes.
Resultado: Alumno siente "esta plataforma me conoce"

FASE 2 — Intelligence Layer (4-6 semanas):
Loops 1, 3, 6, 16.1, 16.4
Ritmo circadiano, weak spots, learning paths, collaborative filtering
Resultado: "Para Ti" feed, analytics personales

FASE 3 — Cross-Platform (4-6 semanas):
Loop 15 (Telegram/WhatsApp), PWA
Micro-reviews, daily digest, notificaciones inteligentes
Resultado: Estudiar en cualquier momento/lugar

FASE 4 — Assessment Innovation (4-6 semanas):
Loop 17: adaptativos, abiertos, casos clinicos
Resultado: Assessment que realmente mide comprension

FASE 5 — Professor Power (4-6 semanas):
Loop 18: dashboards, alertas, content analytics
Resultado: Profesor equipado con datos accionables

FASE 6 — AI Agents (8-12 semanas):
Loop 19: Study Buddy, Error Detective, Exam Coach
Resultado: El diferenciador definitivo de Axon

FASE 7 — Bienestar & Accesibilidad (ongoing):
Loops 10, 13: modos, PWA, wellness
Resultado: Plataforma inclusiva y sostenible
```

**Timeline total:** ~6-9 meses para implementar las 7 fases
**Equipo sugerido:** 2-3 developers full-time (o Petri + Claude agents)

---

## LOOP 21 — Social & Collaborative Learning: Aprender Juntos 🤝
**Tipo: Mixta | Prerequisitos parciales**

> Estudiar solo funciona, pero estudiar con otros funciona MEJOR.
> La personalizacion social es: conectar al alumno con las personas correctas.

### 21.1 Study Squads (Grupos de Estudio Automaticos)
**Tipo: No-IA**
- **Que:** Formar grupos de 3-5 alumnos con niveles complementarios
- **Algoritmo de matching:**
  ```
  Para cada alumno, buscar companeros donde:
  - Mismo curso + institucion
  - Horario de estudio similar (ritmo circadiano ±2h)
  - Niveles COMPLEMENTARIOS, no iguales:
    - Si Alumno A es fuerte en Farmaco (p_know 0.8) y debil en Anatomia (0.3)
    - Buscar Alumno B que sea fuerte en Anatomia y debil en Farmaco
    - El resultado: pueden ensenarse mutuamente
  ```
- **Features del squad:**
  - Chat grupal dentro de Axon
  - Leaderboard interno (minicompetencia amigable)
  - Retos semanales compartidos: "El squad que mas flashcards complete gana X XP"
  - Streak grupal: "Si TODOS del squad estudian hoy, bonus 2x XP"
- **Privacidad:** Solo se ve nombre, nivel, y areas fuertes/debiles (NO datos detallados)
- **Esfuerzo:** 10-15 dias (matching algorithm + chat + group gamification)
- **Impacto:** Accountability social + peer teaching (el que ensena aprende 2x)

### 21.2 Peer Teaching Mode
**Tipo: No-IA**
- **Que:** Alumno A crea una flashcard/explicacion para Alumno B
- **Flow:**
  ```
  Sistema detecta: Maria domina "Betabloqueadores" (p_know 0.92)
  Sistema detecta: Juan tiene dificultad (p_know 0.31)

  A Maria:
  "Dominas Betabloqueadores! ¿Queres crear una flashcard
   que ayude a un companero que esta luchando con ese tema?"
  [Crear flashcard] [Ahora no]

  Maria crea: "Truco para recordar betabloqueadores..."

  A Juan:
  "Una companera que domina Betabloqueadores te creo
   un tip personalizado. ¿Queres verlo?"
  ```
- **Gamificacion:**
  - Badge "Maestro" → crear 10+ flashcards para peers
  - XP bonus por flashcards que peers califiquen como utiles
  - Badge "Agradecido" → dar thanks a 5+ peer flashcards
- **Privacidad:** Anonimo por default ("un companero"), opt-in para mostrar nombre
- **Esfuerzo:** 7-10 dias
- **Impacto:** Efecto Protege — ensenar consolida conocimiento

### 21.3 Debates Guiados por IA
**Tipo: IA**
- **Que:** Dos alumnos debaten un caso clinico, IA modera
- **Flow:**
  ```
  IA: "Caso: Paciente con hipertension y diabetes.
       Alumno A defiende: IECA como primera linea.
       Alumno B defiende: ARA II como primera linea.
       Cada uno tiene 3 turnos para argumentar."

  Alumno A: "Los IECA tienen efecto nefroprotector probado..."
  IA: "Buen punto. Alumno B, como respondes?"
  Alumno B: "Los ARA II tienen menos tos como efecto adverso..."

  [Al final]
  IA: "Excelente debate! Ambos tienen razon parcial.
       Las guias actuales recomiendan IECA por evidencia
       en HOPE/EUROPA, pero ARA II es alternativa valida
       en intolerancia a tos. Score: A=8/10, B=7/10."
  ```
- **Personalizacion:** IA elige topic del debate basado en areas donde ambos tienen p_know medio (0.4-0.7)
- **Esfuerzo:** 10-15 dias
- **Impacto:** Pensamiento critico + argumentacion clinica

### 21.4 Ranking de Explicadores
**Tipo: No-IA**
- **Que:** Los alumnos pueden responder dudas de otros (tipo Stack Overflow medico)
- **Flow:**
  ```
  Juan pregunta: "No entiendo por que los IECA causan tos"
  (Tag: Farmaco > IECA > Efectos adversos)

  Maria responde: "Es por la bradicinina! Los IECA inhiben la ECA,
  que normalmente degrada la bradicinina. Al acumularse,
  la bradicinina irrita los receptores de las vias aereas..."

  Otros alumnos votan: ⬆️ 12 | ⬇️ 1

  Maria gana: +30 XP, contribuye al badge "Profesor Honorario"
  ```
- **Moderacion:** Profesor puede marcar respuestas como "verificadas"
- **Personalizacion:** Las preguntas se muestran segun expertise del alumno
  - Si p_know > 0.7 en un topic → ve preguntas sobre ese topic para responder
  - Si p_know < 0.4 → ve preguntas para aprender de las respuestas
- **Esfuerzo:** 10-15 dias (Q&A system + voting + moderation)
- **Impacto:** Comunidad de aprendizaje auto-sustentable

### 21.5 Challenge Mode (Duelos Academicos)
**Tipo: No-IA**
- **Que:** Duelo 1v1 de flashcards/quiz en tiempo real
- **Flow:**
  ```
  Juan desafia a Maria: "Duelo de Farmaco, 10 preguntas, 15 seg cada una"
  Maria acepta.

  Pregunta 1: "Mecanismo de accion del Losartan"
  Juan: [responde en 8 seg] ✅ → 10pts + 2pts speed bonus
  Maria: [responde en 12 seg] ✅ → 10pts

  ...

  Resultado final:
  Juan: 85pts ⚔️ Maria: 92pts
  Maria gana! +50 XP bonus
  Juan: +25 XP (participacion)
  ```
- **Matchmaking:** Emparejar alumnos de nivel similar (±1 nivel de gamificacion)
- **Preguntas:** Del pool comun del curso, dificultad media del par
- **Esfuerzo:** 10-15 dias (real-time sync con Supabase Realtime)
- **Impacto:** Engagement altisimo. Convierte estudio en juego competitivo.

---

## LOOP 22 — Onboarding & Re-engagement: El Primer y Ultimo Dia 🚀
**Tipo: Mixta | Usa datos existentes parcialmente**

> La primera impresion define si el alumno vuelve.
> La ultima interaccion define si el alumno que se fue regresa.

### 22.1 Onboarding Personalizado (Primera Vez)
**Tipo: No-IA**
- **Que:** Flujo de bienvenida que personaliza la experiencia desde el dia 1
- **Steps:**
  ```
  Step 1 — "Como aprendes mejor?"
  ☐ Leyendo resúmenes           → boost reading content
  ☐ Flashcards repetidas        → boost flashcard queue
  ☐ Haciendo quizzes             → boost quiz suggestions
  ☐ Viendo videos                → boost video content
  ☐ No se todavia               → mix equilibrado

  Step 2 — "Cuando estudias?"
  [Selector visual de franjas horarias: Manana / Tarde / Noche]
  → pre-seed ritmo circadiano (Loop 1.1)

  Step 3 — "Que meta te pones?"
  [Slider: 15min/dia ... 2h/dia]
  → configura daily goal

  Step 4 — "Algun examen pronto?"
  [Selector de fecha + materia]
  → auto-crea study plan (Loop 16.2)

  Step 5 — "Prueba tu primera sesion! 🎯"
  → 5 flashcards del topic mas basico del curso
  → con tutorial inline (donde clickear, como calificar)
  ```
- **Resultado:** En 2 minutos el alumno tiene perfil pre-configurado
- **Esfuerzo:** 5-7 dias
- **Impacto:** Reduce friction del dia 1. Time-to-value < 3 minutos.

### 22.2 Tutorial Contextual Progresivo
**Tipo: No-IA**
- **Que:** En lugar de tutorial upfront, tips contextuales que aparecen cuando son relevantes
- **Triggers:**
  ```
  Primera flashcard → tooltip: "Desliza o usa los botones para calificar"
  Primer quiz → tooltip: "Puedes volver atras antes de enviar"
  Primera visita a analytics → tooltip: "Los colores muestran tu mastery"
  Primer badge → celebration + "Gana mas completando sesiones"
  Nivel 3 → "Desbloqueaste Study Plans! Arma tu primer plan"
  Nivel 5 → "Ahora puedes ver tu Ritmo Circadiano"
  Nivel 7 → "Desbloqueaste el RAG Chat! Preguntale lo que quieras"
  ```
- **Storage:** `onboarding_milestones` JSONB en profile (set de milestones completados)
- **Esfuerzo:** 3-5 dias (tooltip system + milestone tracking)
- **Impacto:** Gradual reveal (Principio 2) — no abrumar al alumno nuevo

### 22.3 Re-engagement Campaign (El Alumno que se Fue)
**Tipo: Mixta**
- **Que:** Secuencia automatica para alumnos que dejaron de estudiar
- **Timeline:**
  ```
  Dia 3 sin estudiar (y tenia streak):
  [Telegram/WhatsApp] "Tu streak de {n} dias esta en riesgo!
  Solo 1 sesion lo salva. ¿5 minutitos? 🙏"

  Dia 7 sin estudiar:
  [Email] "Hola {nombre}, hace una semana que no te vemos.
  Mientras tanto, {n} flashcards se acumularon.
  Si volves hoy, te regalamos 2x XP por 24h."

  Dia 14 sin estudiar:
  [Telegram] "Tus companeros avanzaron esta semana:
  - Maria subio 15 posiciones en el ranking
  - Tu p_know de Farmaco bajo a 52% (era 71%)
  Pero SIEMPRE se puede volver. [Retomar ahora]"

  Dia 30 sin estudiar:
  [Email] "Ha pasado un mes. Mucho cambio:
  - Tu profesor agrego 3 nuevos quizzes
  - {n} alumnos se unieron al curso
  - Tenes {n} flashcards pendientes
  Reseteo facil: empeza con solo 5 cards. [Volver a Axon]"
  ```
- **Personalizacion:**
  - Canal preferido del alumno (TG vs WA vs email)
  - Mensaje adaptado al motivo posible (si dejo despues de quiz malo → motivacional, si dejo despues de streak largo → nostalgia)
  - Incentivo escalado (dia 7: 2x XP, dia 14: streak restore gratis)
- **Opt-out:** Siempre. "No quiero recibir estos mensajes" → respeta
- **Esfuerzo:** 5-7 dias (campaign logic + templates + scheduler)
- **Impacto:** Recuperar 10-20% de churned students = revenue directo

### 22.4 "Welcome Back" Experience
**Tipo: No-IA**
- **Que:** Cuando un alumno vuelve despues de ausencia, no tirarlo al agua fria
- **Flow:**
  ```
  [Alumno abre la app despues de 12 dias]

  "Bienvenido de vuelta! 🎉
  Mientras no estuviste:

  📊 Lo que cambio:
  • Tu mastery de Farmaco bajo de 71% a 58% (normal, es spacing!)
  • 3 quizzes nuevos disponibles
  • Tu profesor agrego 15 flashcards de Patologia

  🎯 Plan de re-entrada sugerido:
  1. Hoy: 10 flashcards de repaso rapido (tus mas urgentes)
  2. Manana: Quiz diagnostico de Farmaco
  3. Esta semana: Retomar tu plan de estudio

  Tu meta ajustada: 50 XP/dia (bajamos de 100 para que sea gradual)

  [Empezar repaso suave] [Ir al dashboard normal]"
  ```
- **Adaptaciones automaticas:**
  - Reducir daily goal temporalmente (50% del original)
  - Mostrar solo las 10 cards mas urgentes (no las 80 acumuladas)
  - Streak restoration gratis la primera vez
- **Esfuerzo:** 3-5 dias
- **Impacto:** Reduce el "muro de pendientes" que causa que el alumno cierre la app

### 22.5 Semester Wrap-Up (Cierre de Semestre)
**Tipo: Mixta**
- **Que:** Experiencia estilo "Spotify Wrapped" al final del semestre
- **Contenido generado:**
  ```
  🎓 Tu Semestre en Axon — 2026.1

  ⏱ 87 horas de estudio (top 15% de tu curso!)
  📚 1,247 flashcards revisadas
  ✅ 23 quizzes completados
  🔥 Tu mejor streak: 34 dias
  🏆 Ranking final: #4 de 45

  🧠 Tu evolucion:
  [Grafico: mastery de cada topic al inicio vs al final]
  Farmaco: 12% → 78% (+66 puntos!)
  Anatomia: 35% → 85% (+50 puntos!)
  Patologia: 0% → 62% (desde cero!)

  💪 Tu momento mas epico:
  "El 15 de abril estudiaste 3 horas seguidas de Farmaco
   despues de fallar un quiz con 35%. Una semana despues
   sacaste 89% en el mismo tema. Eso es perseverancia."

  🏅 Badges del semestre: [grid de badges ganados]
  🔑 Tu frase del semestre: [auto-generada por IA]

  📤 [Compartir en Instagram Stories] [Guardar como imagen]
  ```
- **Time Capsule (12.5):** Si el alumno escribio una al inicio, se abre ahora
- **Compartible:** Genera imagen para redes sociales (marketing organico!)
- **Esfuerzo:** 7-10 dias
- **Impacto:** Cierre emocional + marketing viral + retention para siguiente semestre

---

# PARTE IV — VISION MAP: Como Se Conecta Todo 🗺️

> Cada loop no es independiente. Las ideas se alimentan entre si.
> Este mapa muestra las conexiones y dependencias.

```
                    ┌──────────────────────────────────────────┐
                    │           DATA FLYWHEEL (20.1)           │
                    │  Cada accion genera datos que mejoran     │
                    │  la siguiente accion del alumno           │
                    └──────────────────┬───────────────────────┘
                                       │
               ┌───────────────────────┼───────────────────────┐
               │                       │                       │
    ┌──────────▼──────────┐ ┌──────────▼──────────┐ ┌─────────▼──────────┐
    │  DATOS DEL ALUMNO   │ │  DATOS DE CONTENIDO │ │  DATOS SOCIALES    │
    │                     │ │                     │ │                    │
    │ Loop 1: Perfil      │ │ Loop 3: Weak Spots  │ │ Loop 21: Social    │
    │ • Circadiano        │ │ • Errores por topic │ │ • Study Squads     │
    │ • Velocidad         │ │ • Accuracy trends   │ │ • Peer Teaching    │
    │ • Formato favorito  │ │ • Content gaps      │ │ • Challenges       │
    │                     │ │                     │ │ • Rankings         │
    │ Loop 6: Metacog     │ │ Loop 18: Profesor   │ │                    │
    │ • Confianza         │ │ • Effectiveness     │ │ Loop 16: Discovery │
    │ • Calibracion       │ │ • Feedback data     │ │ • Peers similares  │
    │                     │ │ • Gap analysis      │ │ • "Para Ti" feed   │
    │ Loop 10: Bienestar  │ │                     │ │                    │
    │ • Mood              │ │                     │ │                    │
    │ • Fatigue           │ │                     │ │                    │
    └──────────┬──────────┘ └──────────┬──────────┘ └─────────┬──────────┘
               │                       │                       │
               └───────────────────────┼───────────────────────┘
                                       │
                    ┌──────────────────▼───────────────────────┐
                    │       PERSONALIZATION ENGINE              │
                    │                                          │
                    │  Loop 2: Contenido Adaptativo            │
                    │  Loop 5: Interfaz Adaptativa             │
                    │  Loop 7: Learning Paths                  │
                    │  Loop 17: Assessment Innovation          │
                    │  Loop 22: Onboarding & Re-engagement     │
                    │                                          │
                    │  INPUT: todos los datos de arriba         │
                    │  OUTPUT: experiencia unica por alumno     │
                    └──────────────────┬───────────────────────┘
                                       │
               ┌───────────────────────┼───────────────────────┐
               │                       │                       │
    ┌──────────▼──────────┐ ┌──────────▼──────────┐ ┌─────────▼──────────┐
    │   DELIVERY LAYER    │ │   MOTIVATION LAYER  │ │   SAFETY LAYER     │
    │                     │ │                     │ │                    │
    │ Loop 15: Cross-plat │ │ Loop 4: Gamif 2.0   │ │ Loop 10: Wellness  │
    │ • Web app           │ │ • Badges esfuerzo   │ │ • Fatigue detect   │
    │ • Telegram          │ │ • Celebrations      │ │ • Break reminders  │
    │ • WhatsApp          │ │ • Time Capsule      │ │ • Mood check-in    │
    │ • PWA offline       │ │                     │ │                    │
    │ • Email             │ │ Loop 9: Gamif 2.0+  │ │ Loop 13: a11y      │
    │                     │ │ • Missions          │ │ • Dark mode        │
    │                     │ │ • Seasonal events   │ │ • Dyslexia mode    │
    │                     │ │ • Prestige          │ │ • ADHD mode        │
    │                     │ │                     │ │ • Color blind      │
    └─────────────────────┘ └─────────────────────┘ └────────────────────┘
                                       │
                    ┌──────────────────▼───────────────────────┐
                    │          AI AGENTS LAYER (19)             │
                    │                                          │
                    │  Study Buddy → usa TODOS los datos        │
                    │  Error Detective → analiza patrones       │
                    │  Exam Coach → planifica con p_know        │
                    │  Curator → mejora contenido con feedback  │
                    │  Knowledge Connector → embeddings         │
                    │                                          │
                    │  Los agentes ORQUESTAN las features,      │
                    │  no son features aparte.                  │
                    └──────────────────────────────────────────┘
```

### Dependencias Clave (Orden de Implementacion)

```
CAPA 0 — Prerequisitos (ya existen):
  ✅ FSRS v4
  ✅ BKT v4
  ✅ Gamificacion (12 niveles, 39 badges, XP, streaks)
  ✅ Content tree (Course→Semester→Section→Topic)
  ✅ Smart generation (flashcards, quizzes)
  ✅ RAG chat
  ✅ Telegram bot
  ✅ WhatsApp Cloud API
  ✅ Supabase Realtime
  ✅ Keyword connections (prerequisite type)

CAPA 1 — Data Collection (Sprint 0):
  Check-in emocional (10.4)         → alimenta Loop 10 entero
  Ritmo circadiano (1.1)            → alimenta Loop 15 y Study Buddy
  Formato favorito (1.3)            → alimenta Loop 16 y Content Discovery
  Confianza rating (6.2)            → alimenta Loop 6 y Error Detective
  Content feedback (4.5)            → alimenta Loop 18 entero

CAPA 2 — Personalization Logic:
  "Para Ti" feed (16.1)             → requiere 1.1 + 1.3 + BKT
  Notificaciones contextuales (15.3)→ requiere 1.1 + 10.4
  Celebraciones con datos (10.5)    → requiere gamificacion existente
  Prerequisitos UI (16.3)           → requiere KeywordConnection (ya existe)

CAPA 3 — Advanced Features:
  Pathways adaptativos (16.2)       → requiere BKT + 1.1 + 1.3
  Quizzes adaptativos (17.1)        → requiere BKT + question difficulty
  Casos clinicos (17.3)             → requiere RAG + BKT + embeddings
  Micro-reviews TG/WA (15.1)       → requiere bot existente + FSRS

CAPA 4 — AI Agents:
  Study Buddy (19.1)                → requiere CAPA 1 completa
  Error Detective (19.2)            → requiere historial de reviews
  Exam Coach (19.4)                 → requiere study plans + BKT

CAPA 5 — Social & Community:
  Study Squads (21.1)               → requiere matching data + Realtime
  Peer Teaching (21.2)              → requiere mastery data
  Challenges (21.5)                 → requiere Supabase Realtime
```

---

## APENDICE C: Hallazgos del Audit de Curriculum

> Datos del agente de investigacion. Util para priorizar Loops 16 y 18.

**Estructura confirmada:**
```
Institution → Course → Semester → Section → Topic
                                               ├── Summary (markdown, professor-created)
                                               │   └── Keywords (extracted, with p_know via BKT)
                                               │       ├── Flashcards (AI/manual)
                                               │       └── KeywordConnections (prerequisite|related|deepens)
                                               ├── Quizzes → Questions (mcq|true_false|fill_blank|open)
                                               └── Videos (Mux)
```

**Quick wins revelados por el audit:**
1. `KeywordConnection` con `dependency_type: 'prerequisite'` YA EXISTE en backend pero sin UI frontend → Idea 16.3 es quick win
2. `question_type: 'open'` YA EXISTE en el schema de quizzes pero sin evaluacion IA → Idea 17.2 es medio win
3. `SmartTargetMeta` ya tiene `primary_reason` (new_concept, low_mastery, etc.) → Data para Study Buddy (19.1)
4. `StudyPlanTask` tiene `estimated_minutes` adaptable → Base para Exam Coach (19.4)
5. Study Plans ya tienen reschedule engine → Base para Pathways adaptativos (16.2)

---

## RESUMEN FINAL — Numeros del Documento

| Metrica | Valor |
|---------|-------|
| Total de loops | 24 |
| Total de ideas | 122 |
| Ideas sin IA | ~50 |
| Ideas con IA | ~35 |
| Ideas mixtas | ~37 |
| Apendices | 5 (Top 10 Sprint 0, Audit a11y, Audit Curriculum, Audit Messaging, Matriz Prioridad) |
| Tabla competitiva | 15 ventajas vs Anki/Quizlet/Osmosis |
| Roadmap | 7 fases, 6-9 meses |
| Tiers de monetizacion | 4 (Free, Pro, Premium, Institutional) |
| Costo IA estimado | $97/mes para 1000 alumnos |
| Ideas rankeadas en Matriz | 58 (Tier S: 7, A: 18, B: 12, C: 14, D: 7) |

### Ideas por Categoria

| Categoria | Loops | Ideas |
|-----------|-------|-------|
| Perfil del Alumno | 1, 6 | 10 |
| Contenido Adaptativo | 2, 16 | 10 |
| Weak Spots & Patrones | 3, 19.2 | 6 |
| Gamificacion 2.0 | 4, 9 | 11 |
| Interfaz Adaptativa | 5, 13 | 10 |
| Learning Paths | 7, 8 | 10 |
| Bienestar & Wellness | 10, 11 | 10 |
| Emotional Engagement | 12 | 5 |
| Accesibilidad | 13 | 5 |
| Gamificacion Avanzada | 9 | 5 |
| Cross-Platform | 15 | 5 |
| Content Discovery | 16 | 5 |
| Assessment Innovation | 17 | 5 |
| Professor-Side | 18 | 5 |
| AI Agents | 19 | 5 |
| Strategy & Monetization | 20 | 5 |
| Social Learning | 21 | 5 |
| Onboarding & Retention | 22 | 5 |
| Integraciones Externas | 23 | 5 |
| Analytics Predictivos | 24 | 5 |

---

# PARTE V — LOOPS DE FRONTERA (23-24)

> Las ultimas fronteras: conectar Axon con el mundo exterior
> y predecir el futuro academico del alumno.

---

## LOOP 23 — Integraciones Externas: Axon en Tu Ecosistema 🔗
**Tipo: No-IA | Prerequisitos: APIs de terceros**

> El alumno ya tiene herramientas. Axon no deberia reemplazarlas, sino integrarse.

### 23.1 Google Calendar Sync
**Tipo: No-IA**
- **Que:** Sincronizar study plan tasks con Google Calendar
- **Flow:**
  ```
  Alumno conecta Google Calendar (OAuth)

  Study Plan task "Repasar Farmaco" (Martes 14:00-14:30)
  → aparece en Google Calendar como evento
  → reminder 15min antes
  → color teal (identidad Axon)

  Si el alumno mueve el evento en Calendar
  → se actualiza en Axon automaticamente (webhook bidireccional)
  ```
- **Personalizacion:** Las tareas se sugieren en bloques libres del calendario
- **Esfuerzo:** 7-10 dias (OAuth + Calendar API + bidirectional sync)
- **Impacto:** Study plan integrado con la vida real del alumno

### 23.2 Anki Import/Export
**Tipo: No-IA**
- **Que:** Importar decks de Anki existentes y exportar Axon → Anki
- **Import:**
  ```
  [Upload .apkg file]
  → Parse SQLite dentro del .apkg
  → Mapear notes → flashcards de Axon
  → Mapear review history → seed FSRS state
  → "Importamos 250 flashcards de Farmaco.
     Tu historial de Anki se uso para pre-calibrar
     tus intervalos de repaso."
  ```
- **Export:** Generar .apkg con cards + scheduling data para alumnos que quieren backup
- **Personalizacion:** El import preserva la memoria — no empieza de cero
- **Esfuerzo:** 5-7 dias (.apkg parser + FSRS state mapping)
- **Impacto:** Reduce barrera de entrada para usuarios de Anki (competencia directa)

### 23.3 Notion/Obsidian Knowledge Sync
**Tipo: No-IA**
- **Que:** Sincronizar notas de Notion/Obsidian con summaries de Axon
- **Flow Notion:**
  ```
  Alumno conecta Notion workspace
  → Selecciona paginas/databases
  → Axon importa como summaries (markdown)
  → Keywords se extraen automaticamente
  → Flashcards se generan via smart-gen
  ```
- **Flow Obsidian:**
  ```
  Alumno instala plugin de Obsidian
  → Plugin detecta notas con tag #axon
  → Sync bidireccional via API
  → Notas en Obsidian → summaries en Axon
  → Mastery data de Axon → badges en Obsidian
  ```
- **Esfuerzo:** 10-15 dias (por plataforma)
- **Impacto:** Captura knowledge que el alumno ya tiene en otros tools

### 23.4 Exam Calendar Integration
**Tipo: No-IA**
- **Que:** Profesor publica calendario de examenes, se integra con todo
- **Flow:**
  ```
  Profesor: "Examen de Farmaco: 15 de Abril, 09:00"

  → Se crea evento en calendarios de TODOS los alumnos
  → Exam Coach (19.4) se activa automaticamente 30 dias antes
  → Countdown visible en dashboard: "Faltan 23 dias para Farmaco"
  → Study plan se ajusta automaticamente (prioriza topics del examen)
  → Notificaciones escaladas:
    30 dias: "Falta un mes. Tu p_know promedio: 52%"
    7 dias: "Falta una semana. Sugiero simulacro"
    1 dia: "Manana es el dia. Repaso ligero hoy, descanso temprano."
  ```
- **Esfuerzo:** 5-7 dias (exam calendar + integration hooks)
- **Impacto:** Todo el sistema se alinea al deadline real del alumno

### 23.5 Health/Fitness Tracker Integration
**Tipo: No-IA | Prerequisito: Apple Health / Google Fit API**
- **Que:** Usar datos de salud para optimizar estudio
- **Datos utiles:**
  ```
  Sueno (horas anoche) → Si < 6h: "Hoy sesiones mas cortas. Tu cerebro
                           necesita descanso. Solo 5 cards de repaso."
  Pasos/Actividad → Si sedentario >8h: "Levantate y camina 5 min
                     antes de la proxima sesion."
  Heart Rate Variability → Indicador de estres. Si HRV bajo:
                           reducir carga cognitiva.
  ```
- **Privacidad:** 100% opt-in. Datos NUNCA compartidos con profesor/institucion.
- **Esfuerzo:** 10-15 dias (API integration + privacy framework)
- **Impacto:** Personalizacion basada en estado fisico REAL, no solo academico

---

## LOOP 24 — Analytics Predictivos: Ver el Futuro 🔮
**Tipo: IA/ML | Prerequisitos: datos historicos suficientes**

> Con suficientes datos, podemos PREDECIR resultados.
> No para juzgar, sino para INTERVENIR a tiempo.

### 24.1 Prediccion de Nota de Examen
**Tipo: IA/ML**
- **Que:** "Si el examen fuera hoy, sacarias aproximadamente 68%"
- **Features del modelo:**
  ```python
  features = [
    avg_p_know_all_topics,          # BKT mastery promedio
    avg_p_know_weak_topics,         # mastery de bottom 3 topics
    total_study_hours_30d,          # dedicacion reciente
    quiz_accuracy_trend,            # mejorando o empeorando?
    flashcard_accuracy_trend,
    consistency_score,              # que tan regular estudia
    days_since_last_study,
    confidence_calibration_gap,     # sobre/sub-confianza
    format_diversity,               # usa multiples formatos?
    peer_comparison_percentile,     # posicion relativa
  ]
  ```
- **Modelo:** Regresion lineal simple (no necesita deep learning)
- **Calibracion:** Comparar prediccion vs nota real → ajustar pesos
- **Output:**
  ```
  📊 Prediccion para examen de Farmaco (15 Abril):

  Nota estimada: 68% (±8%)
  Confianza: Media (basada en 45 dias de datos)

  Para subir a 75%:
  • Estudiar Antibioticos 20min/dia (tu p_know: 0.38)
  • Completar 2 quizzes mas de practica
  • Mantener tu streak actual

  Para subir a 85%:
  • Todo lo anterior +
  • 3 sesiones de casos clinicos
  • Repasar Interacciones medicamentosas (p_know: 0.22)
  ```
- **Esfuerzo:** 10-15 dias (feature engineering + model + calibration)
- **Impacto:** ALTISIMO. Convierte datos en accion concreta.

### 24.2 Churn Prediction (Alumno en Riesgo de Abandonar)
**Tipo: ML**
- **Que:** Predecir que alumnos van a dejar de usar la plataforma
- **Senales de riesgo:**
  ```
  Alta probabilidad de churn:
  ☐ Frecuencia de sesiones bajando 3 semanas seguidas
  ☐ Session duration bajando (sesiones cada vez mas cortas)
  ☐ Uso de streakFreeze creciente
  ☐ Accuracy estancada o bajando
  ☐ No abre notificaciones de TG/WA
  ☐ Mood check-ins negativos (si usa)
  ☐ No interactua con contenido nuevo del profesor
  ```
- **Acciones automaticas por nivel de riesgo:**
  ```
  Score 0.3-0.5 (Riesgo bajo):
  → Enviar content de re-engagement ligero
  → Sugerir formato nuevo (si siempre usa flashcards, sugerir quiz)

  Score 0.5-0.7 (Riesgo medio):
  → Alerta al profesor (18.2)
  → Enviar mensaje personalizado por TG/WA
  → Ofrecer reduccion de carga (daily goal mas bajo)

  Score 0.7-1.0 (Riesgo alto):
  → Alerta URGENTE al profesor
  → Humano-in-the-loop: profesor contacta directamente
  → Ofrecer "Welcome Back" (22.4) proactivamente
  ```
- **Esfuerzo:** 10-15 dias
- **Impacto:** Retener 1 alumno = revenue recurrente. Prevenir es mas barato que recuperar.

### 24.3 Optimal Study Load Prediction
**Tipo: ML**
- **Que:** Predecir la carga optima de estudio para CADA alumno
- **El problema:**
  ```
  Muy poco estudio → no aprende
  Mucho estudio → burnout, abandona
  La zona optima es diferente para cada persona
  ```
- **Modelo:** Buscar la carga semanal que maximiza p_know growth sin aumentar churn risk
- **Output:**
  ```
  Tu carga optima esta semana: 4h 20min
  (Basado en: tu rendimiento historico + tu estres actual + examen en 20 dias)

  Distribucion sugerida:
  Lun: 45min (Farmaco flashcards)
  Mar: 60min (Anatomia quiz + reading)
  Mie: 30min (repaso ligero)
  Jue: 60min (Farmaco casos clinicos)
  Vie: 45min (Quiz simulacro)
  Sab-Dom: descanso (tu accuracy cae los fines de semana)
  ```
- **Adaptativo:** Se recalcula semanalmente basado en resultados
- **Esfuerzo:** 10-15 dias
- **Impacto:** "Estudia menos, aprende mas" — el santo grial

### 24.4 Topic Difficulty Calibration
**Tipo: ML**
- **Que:** Calibrar la dificultad REAL de cada topic/keyword basado en datos de TODOS los alumnos
- **Problema actual:** La dificultad de una flashcard es subjetiva — cada alumno califica diferente
- **Solucion:**
  ```sql
  -- Dificultad objetiva por keyword
  SELECT
    k.term,
    AVG(1 - r.rating::float / 5) AS objective_difficulty,
    COUNT(DISTINCT r.student_id) AS sample_size,
    STDDEV(r.rating::float / 5) AS variance
  FROM reviews r
  JOIN flashcards f ON r.flashcard_id = f.id
  JOIN keywords k ON f.keyword_id = k.id
  WHERE r.created_at > NOW() - INTERVAL '90 days'
  GROUP BY k.term
  HAVING COUNT(DISTINCT r.student_id) >= 5
  ORDER BY objective_difficulty DESC;
  ```
- **Usos:**
  - Quiz adaptativo (17.1) usa dificultad calibrada
  - Smart generation prioriza keywords realmente dificiles
  - Profesor ve que keywords son universalmente dificiles vs personalmente dificiles
- **Esfuerzo:** 3-5 dias (query + cache + integration)
- **Impacto:** Mejora TODA la personalizacion que depende de dificultad

### 24.5 Learning Velocity Tracking
**Tipo: No-IA**
- **Que:** Medir que tan rapido aprende cada alumno cada tipo de contenido
- **Metricas:**
  ```
  Learning Velocity = p_know_delta / study_hours

  Alumno A: Farmaco velocity = 0.15 p_know/hora (rapido)
  Alumno A: Anatomia velocity = 0.05 p_know/hora (lento)

  → Alumno A necesita 3x mas tiempo para Anatomia que para Farmaco
  → Study plan deberia asignar 3x mas horas a Anatomia
  ```
- **Personalizacion:** Ajustar `estimated_minutes` de study plan tasks basado en velocity
- **Visualizacion:** Radar chart de velocidad por topic
- **Esfuerzo:** 3-5 dias (calculation + visualization)
- **Impacto:** Study plans REALMENTE calibrados al alumno, no estimaciones genericas

---

## APENDICE D: Hallazgos del Audit de Messaging

> Datos del agente de investigacion. Util para priorizar Loop 15.

**Infraestructura confirmada (100% implementada):**
- Telegram bot: linking (6-digit code), webhooks, review-flow, rate limiting
- WhatsApp Cloud API: phone linking, webhooks, review-flow
- Admin config UI: per-channel settings (bot token, phone ID, etc.)
- Security: timing-safe verification, HMAC SHA-256, fail-closed
- Student settings: link/unlink UI con countdown timer

**Review-flow actual:**
- Bot envia reminders de repaso
- Alumno puede responder desde el bot
- ~800 LOC duplicadas entre TG y WA (tech debt conocido)

**Lo que NO existe todavia (oportunidades Loop 15):**
- Micro-reviews con botones interactivos (15.1) — el review-flow es basico
- Daily digest personalizado (15.2) — no hay template engine
- Notificaciones contextuales inteligentes (15.3) — no hay logica condicional
- Voice study mode (15.5) — no hay TTS/STT
- Mensaje adaptado por mood/circadiano — no hay integracion con esos datos

**Quick win de messaging:**
- Agregar inline keyboard buttons para TG: `[Facil] [Bien] [Dificil] [No sabia]`
- Agregar interactive buttons para WA: mismo layout
- Esfuerzo: 2-3 dias (buttons ya estan soportados por ambas APIs)
- Impacto: Reviews FSRS completos desde el celular sin abrir la app

---

## APENDICE E: Matriz de Prioridad (Impact vs Effort)

> TODAS las ideas rankeadas. Use esto para decidir que construir primero.

### Tier S — Quick Wins de Alto Impacto (1-3 dias, impacto alto)
| # | Idea | Loop | Esfuerzo | IA? |
|---|------|------|----------|-----|
| 1 | Badges de esfuerzo (8 nuevos) | 4.3 | 1-2d | No |
| 2 | Time Capsule | 12.5 | 1-2d | No |
| 3 | Celebraciones con datos | 10.5 | 2-3d | No |
| 4 | Topic Difficulty Calibration | 24.4 | 3-5d | No |
| 5 | Learning Velocity Tracking | 24.5 | 3-5d | No |
| 6 | Chat con personalidad (system prompt) | 2.5 | 2-3d | No* |
| 7 | Tutorial contextual progresivo | 22.2 | 3-5d | No |

### Tier A — Medium Effort, High Impact (3-7 dias)
| # | Idea | Loop | Esfuerzo | IA? |
|---|------|------|----------|-----|
| 8 | Check-in emocional | 10.4 | 2-3d | No |
| 9 | Flashcard del dia | 12.3 | 2-3d | No |
| 10 | Formato favorito detection | 1.3 | 2-3d | No |
| 11 | Feedback alumno→profesor | 4.5 | 2-3d | No |
| 12 | Micro-reviews TG/WA (buttons) | 15.1 | 2-3d | No |
| 13 | Daily digest personalizado | 15.2 | 3-5d | Mixta |
| 14 | Notificaciones contextuales | 15.3 | 3-5d | No |
| 15 | Ritmo circadiano | 1.1 | 3-5d | No |
| 16 | "Para Ti" feed | 16.1 | 5-7d | No |
| 17 | Content effectiveness analytics | 18.3 | 3-5d | No |
| 18 | Prerequisitos UI (ya existe backend) | 16.3 | 3-5d | No |
| 19 | Onboarding wizard | 22.1 | 5-7d | No |
| 20 | Welcome Back experience | 22.4 | 3-5d | No |
| 21 | Resumen semanal "Tu Semana" | 16.5 | 3-5d | Mixta |
| 22 | Alertas tempranas profesor | 18.2 | 5-7d | No |
| 23 | Exam calendar integration | 23.4 | 5-7d | No |
| 24 | "Alumnos como tu" recomendaciones | 16.4 | 3-5d | No |
| 25 | Re-engagement campaign | 22.3 | 5-7d | Mixta |

### Tier B — Medium Effort, Medium-High Impact (5-10 dias)
| # | Idea | Loop | Esfuerzo | IA? |
|---|------|------|----------|-----|
| 26 | Mapa confianza vs competencia | 6.2 | 3-5d | No |
| 27 | Dashboard alumno individual (profesor) | 18.1 | 5-7d | No |
| 28 | Auto-evaluacion guiada | 17.4 | 3-5d | No |
| 29 | Quizzes adaptativos | 17.1 | 5-7d | No |
| 30 | Diferenciacion por nivel | 18.5 | 5-7d | No |
| 31 | Anki import/export | 23.2 | 5-7d | No |
| 32 | Semester Wrap-Up | 22.5 | 7-10d | Mixta |
| 33 | Generacion contenido guiada | 18.4 | 7-10d | IA |
| 34 | Pathways adaptativos | 16.2 | 7-10d | IA |
| 35 | Dark mode (infra ready) | — | 3-5d | No |
| 36 | Modo dislexia | 13.2 | 3-5d | No |
| 37 | Modo daltonismo | 13.1 | 2-3d | No |

### Tier C — High Effort, Very High Impact (10-20 dias)
| # | Idea | Loop | Esfuerzo | IA? |
|---|------|------|----------|-----|
| 38 | Study Buddy Agent | 19.1 | 15-20d | IA |
| 39 | Error Pattern Detective | 19.2 | 10-15d | IA |
| 40 | Casos clinicos interactivos | 17.3 | 10-15d | IA |
| 41 | Exam Coach Agent | 19.4 | 10-15d | IA |
| 42 | Examen simulacro personalizado | 17.5 | 10-15d | IA |
| 43 | Preguntas abiertas evaluacion IA | 17.2 | 7-10d | IA |
| 44 | Study Squads | 21.1 | 10-15d | No |
| 45 | Challenge Mode (duelos) | 21.5 | 10-15d | No |
| 46 | PWA + Offline | 15.4 | 7-10d | No |
| 47 | Knowledge Connector Agent | 19.5 | 7-10d | IA |
| 48 | Prediccion nota de examen | 24.1 | 10-15d | ML |
| 49 | Churn prediction | 24.2 | 10-15d | ML |
| 50 | Optimal study load | 24.3 | 10-15d | ML |
| 51 | Google Calendar sync | 23.1 | 7-10d | No |

### Tier D — Moonshots (15+ dias, alto riesgo)
| # | Idea | Loop | Esfuerzo | IA? |
|---|------|------|----------|-----|
| 52 | Voice Study Mode | 15.5 | 10-15d | IA |
| 53 | Debates guiados por IA | 21.3 | 10-15d | IA |
| 54 | Curator Agent (auto-content) | 19.3 | 15-20d | IA |
| 55 | Health tracker integration | 23.5 | 10-15d | No |
| 56 | Notion/Obsidian sync | 23.3 | 10-15d | No |
| 57 | Peer Teaching Mode | 21.2 | 7-10d | No |
| 58 | Ranking de Explicadores | 21.4 | 10-15d | No |

> **Recomendacion:** Empezar con Tier S (7 ideas, ~2 semanas total).
> Luego Tier A items 8-15 (3 semanas). El alumno ya sentira
> que la plataforma lo CONOCE. Todo lo demas es escalar.

> **"Axon no es una plataforma de estudio. Es TU plataforma de estudio."**
