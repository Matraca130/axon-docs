# Ideas: Calendario de Finales y Parciales para el Sistema Universitario Argentino

> **Documento de producto** -- Seeki/Axon v4.5
> **Fecha:** 2026-03-17
> **Autor:** Investigacion de producto (asistido por IA)
> **Estado:** Borrador para revision del equipo

---

## 1. Calendario Academico Argentino -- Estructura de Referencia

### 1.1 Cuatrimestre 1 (marzo - julio)

| Periodo | Fechas tipicas | Actividad |
|---|---|---|
| Inicio de clases | 2da-3ra semana de marzo | Inscripcion a materias, adaptacion |
| Primer parcial | 2da-3ra semana de mayo (~semana 8-9) | Evaluacion parcial 1 |
| Segundo parcial | 2da-3ra semana de junio (~semana 12-13) | Evaluacion parcial 2 |
| Recuperatorios | Ultima semana de junio / 1ra de julio | Segunda oportunidad para parciales |
| Mesa de finales julio | 1ra-3ra semana de julio | 2-3 llamados por materia, turnos de 1 semana |
| Receso invernal | Ultima semana de julio / 1ra de agosto | |

### 1.2 Cuatrimestre 2 (agosto - diciembre)

| Periodo | Fechas tipicas | Actividad |
|---|---|---|
| Inicio de clases | 2da semana de agosto | Inscripcion a materias |
| Primer parcial | 2da-3ra semana de octubre (~semana 8-9) | Evaluacion parcial 1 |
| Segundo parcial | 2da-3ra semana de noviembre (~semana 12-13) | Evaluacion parcial 2 |
| Recuperatorios | Ultima semana de noviembre / 1ra de diciembre | Segunda oportunidad |
| Mesa de finales diciembre | 1ra-3ra semana de diciembre | 2-3 llamados |

### 1.3 Mesa de Finales Extraordinaria (febrero - marzo)

| Periodo | Fechas tipicas | Actividad |
|---|---|---|
| Mesa febrero | 1ra-2da semana de febrero | Materias del 2do cuatrimestre + anuales |
| Mesa marzo | 1ra-2da semana de marzo | Ultimo llamado antes del nuevo ciclo |

### 1.4 Particularidades del Sistema Argentino

- **Regularidad vs. Libre:** Un estudiante puede estar "regular" (aprobo parciales, puede rendir final) o "libre" (debe rendir todo en un unico examen mas exigente).
- **Vencimiento de regularidad:** Generalmente 1 ano (2 cuatrimestres + mesas de febrero/marzo). Esto agrega urgencia a la planificacion.
- **Correlatividades:** No se puede rendir el final de Materia B sin haber aprobado Materia A. Esto crea arboles de dependencia criticos.
- **Multiples materias simultaneas:** Un estudiante tipico cursa 4-6 materias por cuatrimestre y puede tener 3-5 finales pendientes.
- **Inscripcion a mesas:** Suele hacerse via SIU Guarani entre 48h y 7 dias antes del examen. Hay que recordar al estudiante.
- **Turnos de examen:** En una mesa de julio puede haber 3 fechas posibles para una misma materia, espaciadas 1 semana. El estudiante elige a cual presentarse.

---

## 2. Ideas de Features para Finales y Parciales

### 2.1 Countdown Inteligente por Examen

**Nombre:** Exam Countdown Dashboard
**Descripcion:** Un panel que muestra countdowns en tiempo real para cada parcial y final registrado. No es un simple timer: incluye un indicador de "preparacion estimada" basado en el progreso del study plan y la mastery actual del estudiante (datos de `fsrs_states` y `bkt_states`).

**Integracion con Seeki existente:**
- Lee `study_plans` y `study_plan_tasks` para calcular porcentaje de preparacion.
- Usa `bkt_states.p_know` por subtopic para generar un score de "confianza" por materia.
- Los colores de urgencia usan el mismo sistema de mastery colors que ya existe (`green/yellow/red/gray`).
- Se conecta con el `scheduleFallbackData.ts` que ya define `UpcomingExam` con `daysLeft` y `priority`.

**Prioridad:** ALTA
**Complejidad:** Media. El frontend ya tiene la estructura (`UpcomingExam` interface en `scheduleFallbackData.ts`). Falta conectar con datos reales y agregar la barra de progreso de preparacion.

---

### 2.2 Modo "Semana de Finales" (Intensivo)

**Nombre:** Finals Week Mode
**Descripcion:** Cuando el estudiante activa este modo (o se activa automaticamente cuando quedan <7 dias para un final), Seeki cambia su comportamiento:
- El `study-queue` prioriza exclusivamente el material de la materia del proximo final.
- El `rescheduleEngine` redistribuye tareas pendientes con mayor densidad.
- La interfaz muestra un banner persistente con countdown + checklist de temas.
- Se habilita un "plan de estudio de emergencia" autogenerado: recorre todos los subtopics con p_know < 0.75 y crea tareas de repaso concentradas.

**Integracion con Seeki existente:**
- Extiende `rescheduleEngine.ts` -- ya tiene la logica de repriorizar tareas pendientes basada en mastery (`getTimeMultiplier`, `interleaveByPriority`).
- Usa `distributeAcrossDays` de `planSchedulingUtils.ts` pero con un override de horas diarias mas alto (modo intensivo).
- El `study-queue` endpoint ya acepta `course_id` como filtro -- se puede forzar desde el frontend.
- Conecta con `sessionAnalytics.ts` para trackear horas de estudio durante el modo intensivo.

**Prioridad:** ALTA
**Complejidad:** Alta. Requiere estado nuevo en el backend (o en `study_plans.metadata` JSONB), cambios en el reschedule engine, y nuevo componente UI.

---

### 2.3 Generador de Plan de Repaso Pre-Examen

**Nombre:** Smart Review Plan Generator
**Descripcion:** Dado un examen con fecha X, genera automaticamente un plan de repaso de N dias. El algoritmo:
1. Identifica todos los subtopics de la materia.
2. Ordena por `p_know` ascendente (los mas debiles primero).
3. Asigna sesiones de flashcards + quiz por cada subtopic debil.
4. Intercala sesiones de repaso general usando `interleaveByPriority`.
5. Los ultimos 2 dias se reservan para simulacros/repasos globales.

**Integracion con Seeki existente:**
- Usa la API `POST /study-plans` con `completion_date` seteada a la fecha del examen.
- Las tareas se crean via `POST /study-plan-tasks` con `item_type` flashcard/quiz/reading.
- La logica de distribucion ya existe en `planSchedulingUtils.ts`.
- El `getTimeMultiplier` ya ajusta tiempo segun mastery.

**Prioridad:** ALTA
**Complejidad:** Media. La infraestructura de study plans ya existe. Lo nuevo es la logica de "plan de repaso inverso desde la fecha del examen".

---

### 2.4 Distribucion Inteligente con Spaced Repetition Adaptado a Fechas

**Nombre:** Exam-Aware Spaced Repetition
**Descripcion:** Modifica el algoritmo FSRS para que la fecha de due_at nunca caiga DESPUES del examen. Si un flashcard tiene stability de 30 dias pero el examen es en 10 dias, se fuerza un repaso antes. Ademas, se incrementa la frecuencia de repaso para cards con stability < 15 dias cuando el examen esta cerca.

**Integracion con Seeki existente:**
- Modifica la logica del `study-queue` endpoint (`routes-study-queue.ts`) que ya calcula NeedScore.
- Se puede agregar un factor "exam proximity" al NeedScore: `0.40*overdue + 0.30*(1-p_know) + 0.20*fragility + 0.10*novelty` podria incluir un quinto factor `exam_urgency`.
- Los `fsrs_states` ya tienen `due_at` -- se trata de cap-ear ese valor con la fecha del examen.
- La lib `fsrs-v4` (8.7KB) en el backend es el punto de intervencion.

**Prioridad:** ALTA
**Complejidad:** Alta. Tocar el algoritmo de spaced repetition requiere cuidado para no romper la progresion normal.

---

### 2.5 Sistema de Notificaciones Progresivas

**Nombre:** Exam Notification Cascade
**Descripcion:** Notificaciones escalonadas que se intensifican a medida que se acerca el examen:
- **30 dias:** "Tenes un final de [materia] en 30 dias. Tu mastery promedio es X%. Recomendamos activar un plan de repaso."
- **15 dias:** "Faltan 15 dias para [materia]. Tus temas mas debiles son: [lista]. Sesion de repaso sugerida."
- **7 dias:** "Esta semana se viene el final de [materia]. Activar Modo Intensivo?"
- **3 dias:** "En 3 dias rendis [materia]. Hoy: repaso de temas criticos (X cards pendientes)."
- **1 dia:** "Manana rendis [materia]. Sesion de repaso rapido + simulacro disponible."
- **Dia del examen:** "Hoy rendis [materia] a las [hora]. Exitos! Tip: repaso de 15 min con los temas mas debiles."

Canal: push notification + in-app banner + WhatsApp/Telegram (via la integracion de messaging que ya existe en `pa-messaging.ts`).

**Integracion con Seeki existente:**
- La infraestructura de messaging ya soporta WhatsApp y Telegram (`pa-messaging.ts`).
- Las notificaciones de gamificacion ya existen (`GamificationNotification` type).
- Se puede extender el tipo de notificacion para incluir `type: 'exam_reminder'`.

**Prioridad:** MEDIA-ALTA
**Complejidad:** Media. El backend necesita un cron job o scheduled task que cheque fechas de examenes y dispare notificaciones.

---

### 2.6 Vista "Panorama de Materias"

**Nombre:** Subject Panorama View
**Descripcion:** Una vista de alto nivel que muestra TODAS las materias del estudiante con:
- Estado: cursando / regular / libre / aprobada
- Proxima fecha de examen (parcial o final)
- Porcentaje de preparacion (basado en mastery de subtopics)
- Barra de progreso visual (colores: verde >75%, amarillo 50-75%, rojo <50%)
- Indicador de correlatividades (que materias desbloquea aprobar esta)
- Vencimiento de regularidad (deadline)

**Integracion con Seeki existente:**
- La jerarquia `Institution > Course > Semester > Section > Topic > Summary` ya modela las materias.
- El endpoint `GET /topics-overview` ya devuelve summaries y keyword counts por topic.
- Las mastery colors (`MASTERY_HEX` en `mindmap.ts`) ya definen el esquema visual.
- Los `bkt_states` por subtopic dan el p_know necesario para calcular preparacion.

**Prioridad:** ALTA
**Complejidad:** Media. Los datos ya existen; lo nuevo es la vista agregada y el concepto de "estado de materia" (cursando/regular/libre).

---

### 2.7 Calendario Compartido de Finales

**Nombre:** Shared Finals Calendar
**Descripcion:** Permite que estudiantes de la misma institucion/curso compartan sus fechas de finales. Features:
- Ver cuando rinden tus companeros la misma materia.
- Crear grupo de estudio para un final especifico.
- Sincronizar con Google Calendar / Apple Calendar via .ics export.
- Feed de "X companeros rinden [materia] esta semana".

**Integracion con Seeki existente:**
- Se apoya en la estructura de `institutions` y `memberships` (roles).
- El leaderboard de gamificacion (`getLeaderboard`) ya lista estudiantes de la misma institucion -- se puede reusar para el social graph.
- La tabla `study_plans` ya esta scoped a `student_id` + `course_id` -- se puede extender con un flag `is_public`.

**Prioridad:** MEDIA
**Complejidad:** Media-Alta. Requiere permisos de visibilidad, export .ics, y logica social que no existe todavia.

---

### 2.8 Importacion desde SIU Guarani

**Nombre:** SIU Guarani Sync
**Descripcion:** Integracion con SIU Guarani (sistema de gestion academica usado por universidades nacionales argentinas) para importar:
- Fechas de mesas de finales
- Estado de materias (regular/libre/aprobada)
- Notas de parciales
- Correlatividades
- Horarios de cursada

**Implementacion propuesta:**
- **Fase 1 (MVP):** Importacion manual via copy-paste de URL o screenshot del calendario de Guarani. Parsing con AI (Gemini 2.5 Flash, que ya esta integrado en el backend).
- **Fase 2:** Scraping automatizado del portal (previa autenticacion del estudiante). Complejo por la diversidad de versiones de SIU Guarani (3.x, 4.x tienen UI muy diferentes).
- **Fase 3:** API oficial (si alguna universidad la expone -- pocas lo hacen).

**Integracion con Seeki existente:**
- La AI ya procesa contenido con Gemini (`routes/ai/` con 14 archivos).
- El chunker y semantic-chunker podrian adaptarse para parsear HTML de Guarani.
- Las fechas importadas se guardan como `study_plan_tasks` o en una nueva tabla.

**Prioridad:** MEDIA
**Complejidad:** Alta. SIU Guarani no tiene API publica estandar. El scraping es fragil. El MVP con copy-paste + AI es mas viable.

---

### 2.9 Modo Colaborativo Pre-Final

**Nombre:** Study Group Mode
**Descripcion:** Para la semana previa a un final, los estudiantes pueden:
- Crear una "sala de estudio" temporal para una materia.
- Compartir flashcards y quizzes custom.
- Hacer quizzes competitivos en tiempo real (quiz battle).
- Ver un ranking de preparacion del grupo (anonimizado o no).
- Chat grupal tematico.

**Integracion con Seeki existente:**
- La gamificacion ya tiene leaderboard semanal/diario.
- Los badges con categoria `'social'` ya estan definidos en `gamification.ts`.
- Las flashcards y quizzes ya tienen `created_by` -- se pueden "compartir" sin duplicar, solo dando acceso.
- El concepto de `institution_id` ya scope-a todo -- los grupos se forman dentro de la institucion.

**Prioridad:** MEDIA
**Complejidad:** Alta. Requiere real-time (websockets o polling), permisos granulares, y UI de chat/sala.

---

### 2.10 Analytics Post-Parcial / Post-Final

**Nombre:** Post-Exam Analytics
**Descripcion:** Despues de cada examen, el estudiante registra su resultado y Seeki genera un analisis:
- Correlacion entre horas de estudio (`daily_activities.time_spent_seconds`) y resultado.
- Que metodos de estudio uso mas (flashcards vs. quiz vs. reading) -- datos de `study_sessions.session_type`.
- Cuales subtopics estaban flojos antes del examen (p_know historico de `bkt_states`).
- Que hubiera necesitado estudiar mas (gaps de mastery vs. temas que aparecieron en el examen).
- Recomendaciones para el proximo examen basadas en patrones.

**Integracion con Seeki existente:**
- `sessionAnalytics.ts` ya trackea reviews, tiempo, y sesiones por dia.
- `student_stats` tiene `total_reviews`, `total_time_seconds`, `total_sessions`.
- `daily_activities` tiene granularidad diaria perfecta para graficar esfuerzo pre-examen.
- `session-stats.ts` ya calcula `computeMasteryPct` y `computeDeltaStats`.
- `DeltaStats` ya tiene `improved`, `declined`, `newlyMastered` -- perfecto para un "antes vs. despues".

**Prioridad:** MEDIA-ALTA
**Complejidad:** Baja-Media. Los datos ya se recolectan. Lo nuevo es la vista de analisis y la correlacion.

---

### 2.11 Gamificacion Especial para Epoca de Finales

**Nombre:** Finals Season Gamification
**Descripcion:** Desafios y recompensas especiales durante las semanas de finales:
- **Badge "Sobreviviente de Finales":** Completar 3+ planes de repaso durante mesa de julio/diciembre.
- **Badge "Maraton de Estudio":** Estudiar 4+ horas en un solo dia durante semana de finales.
- **Badge "Cero Panico":** Empezar el plan de repaso con 15+ dias de anticipacion.
- **XP Multiplicador x2:** Durante la semana de finales, todo XP se duplica para incentivar el estudio.
- **Streak Freeze Gratis:** Un freeze gratuito durante semana de finales (para no perder el streak por estudiar para el examen y no usar la app).
- **Desafio Grupal:** "Tu universidad puede acumular X horas de estudio esta semana de finales" -- ranking entre instituciones.

**Integracion con Seeki existente:**
- El sistema de badges ya tiene 39 badges con categorias (`consistency`, `study`, `mastery`, `exploration`, `social`).
- `XP_TABLE` ya define acciones con XP base -- se puede agregar un multiplicador temporal.
- `buyStreakFreeze` ya existe -- se puede dar uno gratis via la API.
- `checkBadges` ya evalua criterios automaticamente.
- El `XP_DAILY_CAP` de 500 podria subirse temporalmente durante finales.

**Prioridad:** MEDIA
**Complejidad:** Baja-Media. La infraestructura de gamificacion es robusta. Solo se agregan badges nuevos y un flag de "temporada de finales" para multiplicadores.

---

### 2.12 Templates de Plan de Estudio por Tipo de Materia

**Nombre:** Study Plan Templates
**Descripcion:** Plantillas predefinidas que se adaptan al tipo de materia:
- **Teorica pura** (ej: Historia, Filosofia): Enfasis en reading + flashcards de conceptos. 70% lectura, 20% flashcards, 10% quiz.
- **Teorica-practica** (ej: Anatomia, Fisiologia): Balance flashcards + quiz + reading. 40% flashcards, 30% quiz, 30% reading.
- **Practica/Laboratorio** (ej: Quimica, Fisica): Enfasis en quiz y problemas. 50% quiz, 30% flashcards, 20% reading.
- **Clinica** (ej: Semiologia, Medicina Interna): Casos clinicos + knowledge graph. 40% quiz (casos), 30% mindmap review, 20% flashcards, 10% reading.
- **Custom:** El estudiante define sus propios porcentajes.

Cada template define:
- Proporcion de metodos de estudio
- Distribucion temporal (ej: teorica pura empieza con reading, clinica empieza con casos)
- Horas sugeridas por semana segun dificultad reportada

**Integracion con Seeki existente:**
- `StudyPlan` ya tiene `methods: string[]` y `weeklyHours: number[]`.
- `study_plan_tasks.item_type` ya soporta flashcard/quiz/reading/keyword.
- El wizard de estudio ya genera tareas -- se trata de agregar templates al paso inicial.
- `study_plans.metadata` (JSONB) puede guardar el template seleccionado.

**Prioridad:** MEDIA
**Complejidad:** Baja. Es mayormente UI + presets de configuracion. No requiere cambios de backend.

---

### 2.13 Tracker de Correlatividades

**Nombre:** Correlativities Graph
**Descripcion:** Un grafo visual (estilo knowledge graph pero a nivel materias) que muestra:
- Que materias son prerequisito de cuales.
- Estado de cada materia (aprobada / regular / pendiente).
- "Camino critico" resaltado: la cadena de materias que el estudiante necesita aprobar para llegar a su objetivo.
- Alerta cuando una regularidad esta por vencer y eso bloquea otras materias.

**Integracion con Seeki existente:**
- El mindmap/knowledge graph ya usa G6 para visualizacion de grafos (`MapNode`, `MapEdge`, `GraphData` en `mindmap.ts`).
- Los `CONNECTION_TYPES` incluyen `prerequisito` con `directed: true` -- perfecto para correlatividades.
- `GraphControls` ya tiene zoom, collapse, export -- se reutiliza 1:1.
- Se puede crear un tipo de grafo nuevo `type: 'correlativities'` usando la misma infra de rendering.

**Prioridad:** MEDIA-ALTA
**Complejidad:** Media. La visualizacion ya existe. Lo nuevo es el modelo de datos de correlatividades (tabla nueva o extension de courses).

---

### 2.14 Recordatorio de Inscripcion a Mesa

**Nombre:** Exam Registration Reminder
**Descripcion:** Notificacion automatica para recordar inscribirse a la mesa de finales en SIU Guarani. Tipicamente la inscripcion abre 7 dias antes y cierra 48h antes del examen. El sistema envia:
- Aviso cuando abre la inscripcion.
- Aviso 24h antes del cierre de inscripcion.
- Confirmacion: "Te inscribiste a [materia]? Marca como confirmado."

**Integracion con Seeki existente:**
- Usa la misma infra de notificaciones que el feature 2.5 (WhatsApp/Telegram).
- Se guarda como campo adicional en el evento de examen: `registration_opens`, `registration_closes`.

**Prioridad:** ALTA (esto es algo que los estudiantes olvidan constantemente y pierden la oportunidad de rendir).
**Complejidad:** Baja. Es un recordatorio con fechas fijas, no requiere logica compleja.

---

## 3. UX/UI Suggestions

### 3.1 Calendario en Modo "Epoca de Finales"

**Estado actual:** El calendario (`calendar.tsx`) es un `react-day-picker` basico con estilos de shadcn/ui. Soporta seleccion de dia, rango, y navegacion mensual. No tiene concepto de "eventos" o "examenes".

**Propuesta visual para epoca de finales:**

**Vista mensual mejorada:**
```
+-----------------------------------------------+
|  << Julio 2026 >>    [Mes] [Semana] [Agenda]  |
+-----------------------------------------------+
| L   M   M   J   V   S   D                     |
|                 1   2   3   4                  |
|                     [F]                        |
| 5   6   7   8   9   10  11                     |
|     [P]                 [F]                    |
| 12  13  14  15  16  17  18                     |
| [F]             [R]                            |
| 19  20  21  22  23  24  25                     |
|                                                |
| 26  27  28  29  30  31                         |
+-----------------------------------------------+
| [F] = Final  [P] = Parcial  [R] = Recuperatorio|
+-----------------------------------------------+
```

**Indicadores visuales por dia:**
- Dias con examen: borde grueso rojo + icono de alerta
- Dias de repaso programado: fondo suave azul/teal (reutiliza `bg-teal-100` del fallback data)
- Dias "libres": fondo gris sutil
- Hoy: circulo de acento (ya existe en `day_today`)

**Colores por urgencia (sistema de 5 niveles):**
- `>30 dias`: gris neutro (`text-muted-foreground`) -- "hay tiempo"
- `15-30 dias`: azul (`bg-blue-100 text-blue-700`) -- "empeza a planificar"
- `7-14 dias`: amarillo/amber (`bg-amber-100 text-amber-700`) -- "hora de intensificar"
- `3-7 dias`: naranja (`bg-orange-100 text-orange-700`) -- "modo intensivo"
- `<3 dias`: rojo (`bg-red-100 text-red-700`) -- "ultimo repaso"

Estos colores son coherentes con los que ya se usan en `scheduleFallbackData.ts` para los tipos `study`, `review`, `exam`, `task`.

### 3.2 Panel Lateral de Examen (Click en un dia con examen)

```
+----------------------------------+
| FINAL: Anatomia II               |
| Fecha: 12 Jul 2026, 14:00       |
| Faltan: 5 dias                   |
|                                  |
| [==============>   ] 72%         |
| Preparacion estimada             |
|                                  |
| Temas debiles:                   |
| - Miembro inferior (p=0.45) [!]  |
| - Osteologia craneal (p=0.52) [!]|
| - Articulaciones (p=0.81) [ok]   |
|                                  |
| [Iniciar repaso express]         |
| [Ver plan completo]              |
| [Activar modo intensivo]         |
+----------------------------------+
```

### 3.3 Vista Semanal durante Finales

```
+--------------------------------------------------------+
| Semana del 6 al 12 de Julio                            |
+--------------------------------------------------------+
| LUN 6       | MAR 7       | MIE 8       | JUE 9       |
|             |             |             |             |
| 09:00       | 09:00       | 09:00       | 09:00       |
| [Repaso     | [Flashcards | [Quiz       | [Repaso     |
|  Anatomia]  |  Fisiologia]|  Bioquimica]|  General]   |
| 2h          | 1.5h        | 1h          | 2h          |
|             |             |             |             |
| 14:00       | 14:00       |             | 14:00       |
| [Simulacro  | [Lectura    |             | [FINAL      |
|  Anatomia]  |  Patologia] |             |  FISIOLOGIA]|
| 1.5h        | 1h          |             | ~~~~~       |
+--------------------------------------------------------+
| VIE 10      | SAB 11      | DOM 12                     |
|             |             |                            |
| 10:00       | 10:00       | DESCANSO                   |
| [Repaso     | [Simulacro  | RECOMENDADO                |
|  final      |  general]   |                            |
|  Anatomia]  | 2h          |                            |
| 2h          |             |                            |
|             |             |                            |
| >>>>>>>>>>> LUNES 12: FINAL ANATOMIA <<<<<<<<<<<<<<    |
+--------------------------------------------------------+
```

### 3.4 Widget de Dashboard "Proximos Examenes"

```
+----------------------------------------+
| PROXIMOS EXAMENES                       |
+----------------------------------------+
| [!] Fisiologia     | 3 dias  | 72% [==>]|
| [!] Anatomia II    | 8 dias  | 58% [=>] |
| [ ] Bioquimica     | 15 dias | 45% [>]  |
| [ ] Patologia      | 22 dias | 30% [>]  |
+----------------------------------------+
| [+ Agregar examen]  [Ver calendario]    |
+----------------------------------------+
```

El indicador `[!]` es rojo para <7 dias, amarillo para 7-14 dias.

---

## 4. Integracion con Features Existentes

### 4.1 Integracion con Mindmap / Knowledge Graph

**Estado actual:** El knowledge graph (`mindmap.ts`) visualiza relaciones entre keywords y topics con mastery colors. Tiene 10 tipos de conexion medica (prerequisito, causa-efecto, mecanismo, etc.).

**Integracion propuesta:**
- **Vista "Pre-examen" del knowledge graph:** Filtrar el grafo para mostrar solo los nodos con mastery < 0.75 (temas que necesitan repaso). Los nodos rojos/amarillos brillan, los verdes se atenuan.
- **Path de estudio visual:** Resaltar en el grafo el camino sugerido de repaso (de nodos mas debiles a mas fuertes), creando una narrativa visual de "por donde empezar".
- **Click en nodo -> accion rapida:** Desde el grafo pre-examen, click en un nodo debil abre directamente una sesion de flashcards o quiz para ese keyword.
- **Correlatividades como grafo:** Reutilizar `MapNode` y `MapEdge` para visualizar materias y sus dependencias (ver feature 2.13).

**Conexion tecnica:**
- `MapNode.mastery` (0-1) ya tiene el dato de p_know.
- `MapNode.masteryColor` ya mapea a colores semanticos.
- `NodeAction` ya soporta `'flashcard' | 'quiz' | 'summary'`.

### 4.2 Integracion con Sesiones de Estudio

**Estado actual:** Las sesiones (`study_sessions`) trackean tipo (flashcard/quiz/reading/mixed), inicio, fin, reviews totales y correctas. `sessionAnalytics.ts` acumula datos en `student_stats` y `daily_activities`. El `rescheduleEngine` reprioriza tareas cuando se completa una.

**Integracion propuesta:**
- **Sesiones "Pre-examen" taggeadas:** Agregar un campo opcional `exam_id` a `study_sessions` para vincular sesiones con un examen especifico. Esto permite analytics post-examen precisas.
- **Sesion de repaso express:** Un tipo de sesion especial que selecciona automaticamente las 20 flashcards con peor retention de una materia especifica. Usa `getStudyQueue({ course_id })` pero con un sort por `need_score` descendente.
- **Simulacro de examen:** Una sesion que mezcla quiz questions de TODOS los topics de una materia, simulando un examen real. Timer incluido, resultado con porcentaje y analisis por topic.
- **Sesion post-examen de refuerzo:** Para los topics donde el estudiante reporto que le fue mal, genera automaticamente una sesion de refuerzo con flashcards y quizzes.

**Conexion tecnica:**
- `study_sessions.session_type` podria extenderse con `'exam_review'` y `'mock_exam'`.
- `logSession` en `sa-activity-sessions.ts` ya crea sesiones con course_id.
- `quiz_attempts` ya tiene `time_taken_ms` para simular presion de tiempo.

### 4.3 Integracion con Gamificacion

**Estado actual:** 13 endpoints, 39 badges, XP system con 12 niveles, streaks con freeze/repair, leaderboard semanal/diario, daily goals, study queue con FSRS+BKT.

**Integracion propuesta:**
- **XP Boosts durante finales:**
  - Multiplicador x1.5 durante las 2 semanas previas a cualquier final registrado.
  - Multiplicador x2 durante la ultima semana.
  - Se implementa como un `bonus_type` nuevo en `xp_transactions` (ya tiene campo `bonus_type`).

- **Badges de temporada de finales** (agregar a la tabla `badges`):
  - `finals_survivor`: Aprobar 3+ finales en una mesa.
  - `early_bird`: Empezar plan de repaso 30+ dias antes del final.
  - `consistency_king`: Mantener streak durante toda la semana de finales.
  - `mock_master`: Completar 5+ simulacros de examen.
  - `comeback_kid`: Mejorar mastery de un topic de rojo a verde en <14 dias.
  - Rareza sugerida: `epic` para los primeros, `legendary` para los ultimos.

- **Desafio institucional:** Ranking de "Universidad que mas estudio esta semana de finales". Extiende el leaderboard existente con un scope `period: 'finals'`.

- **Streak protection:** Durante semana de finales, dar un streak freeze gratuito (ya existe `buyStreakFreeze`, se agrega `grantFreeFreeze`).

**Conexion tecnica:**
- `XPAction` puede agregar `'finals_study'`, `'mock_exam_complete'`.
- `Badge.category` ya tiene `'consistency'`, `'mastery'` -- las badges de finales pueden ir en una nueva categoria `'seasonal'` o repartirse en las existentes.
- `xp-engine.ts` en backend maneja multiplicadores -- se agrega logica de fecha.

### 4.4 Integracion con Mensajeria (WhatsApp / Telegram)

**Estado actual:** Integracion con WhatsApp Cloud API y Telegram (10 archivos de rutas en `routes/whatsapp/`). Configuracion via `pa-messaging.ts` (admin settings: token, webhook, test connection).

**Integracion propuesta:**
- **Recordatorios de examen via WhatsApp/Telegram:** Mensajes automaticos con countdown, mastery snapshot, y link a sesion de repaso.
- **Resumen diario durante epoca de finales:** "Hoy estudiaste X horas. Tu mastery promedio en [materia] subio de Y% a Z%. Manana te recomendamos estudiar [topics]."
- **Alerta de inscripcion a mesa:** "La inscripcion a la mesa de [materia] cierra en 24h. Inscribite en SIU Guarani: [link]."
- **Notificacion de companero:** "3 companeros de tu curso rinden [materia] la misma fecha. Crear grupo de estudio?"

**Conexion tecnica:**
- Backend WhatsApp ya tiene capacidad de enviar mensajes programados.
- Se necesita un scheduler (cron job) que consulte examenes proximos y dispare mensajes.
- Los templates de WhatsApp requieren aprobacion de Meta -- hay que disenarlos con anticipacion.

---

## 5. Roadmap Sugerido de Implementacion

### Fase 1 -- MVP (Sprint 1-2, ~4 semanas)
1. **Modelo de datos de examenes:** Nueva tabla `exams` (student_id, course_id, exam_type [parcial/final/recuperatorio], date, time, location, status, metadata). O extension de `study_plans` con un campo `exam_date` y `exam_type` en metadata.
2. **Countdown Dashboard** (feature 2.1) -- vista basica con datos hardcodeados primero, luego conectada.
3. **Notificaciones basicas** (feature 2.5) -- in-app solamente, sin WhatsApp aun.
4. **Recordatorio de inscripcion** (feature 2.14) -- alerta simple.

### Fase 2 -- Smart Planning (Sprint 3-4, ~4 semanas)
5. **Smart Review Plan Generator** (feature 2.3)
6. **Templates por tipo de materia** (feature 2.12)
7. **Panorama de Materias** (feature 2.6)

### Fase 3 -- Adaptive (Sprint 5-6, ~4 semanas)
8. **Modo Semana de Finales** (feature 2.2)
9. **Exam-Aware Spaced Repetition** (feature 2.4)
10. **Analytics Post-Parcial** (feature 2.10)

### Fase 4 -- Social y Gamificacion (Sprint 7-8, ~4 semanas)
11. **Finals Season Gamification** (feature 2.11)
12. **Calendario Compartido** (feature 2.7)
13. **Notificaciones WhatsApp/Telegram** (extension de feature 2.5)
14. **Correlativities Graph** (feature 2.13)

### Fase 5 -- Integraciones Externas (Sprint 9+)
15. **SIU Guarani Sync** MVP con copy-paste + AI (feature 2.8)
16. **Modo Colaborativo** (feature 2.9)

---

## 6. Consideraciones Tecnicas

### 6.1 Nuevo Modelo de Datos Necesario

```sql
-- Tabla de examenes (propuesta)
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  course_id UUID REFERENCES courses(id),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  exam_type TEXT NOT NULL CHECK (exam_type IN ('parcial_1', 'parcial_2', 'recuperatorio', 'final', 'libre')),
  title TEXT NOT NULL,
  exam_date DATE NOT NULL,
  exam_time TIME,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'passed', 'failed')),
  score NUMERIC,
  registration_opens DATE,
  registration_closes DATE,
  is_registered BOOLEAN DEFAULT false,
  study_plan_id UUID REFERENCES study_plans(id),
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de correlatividades (propuesta)
CREATE TABLE course_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id),
  prerequisite_course_id UUID NOT NULL REFERENCES courses(id),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  requirement_type TEXT NOT NULL DEFAULT 'approved' CHECK (requirement_type IN ('approved', 'regular', 'cursando')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, prerequisite_course_id)
);

-- Extension de study_plans para modo intensivo
-- (se puede usar el campo metadata JSONB existente)
-- metadata: { "exam_id": "uuid", "mode": "intensive", "template": "teorica-practica" }
```

### 6.2 Endpoints Nuevos Necesarios

| Metodo | Endpoint | Descripcion |
|---|---|---|
| GET | `/exams` | Listar examenes del estudiante (filtros: course_id, exam_type, status, from, to) |
| POST | `/exams` | Crear examen |
| PUT | `/exams/:id` | Actualizar examen (resultado, estado) |
| DELETE | `/exams/:id` | Eliminar examen |
| GET | `/exams/upcoming` | Examenes proximos con mastery snapshot |
| POST | `/exams/:id/generate-plan` | Generar plan de repaso automatico para un examen |
| GET | `/course-prerequisites` | Correlatividades de un course_id |
| POST | `/course-prerequisites` | Crear correlatividad (profesor/admin) |

### 6.3 Impacto en Performance

- El `study-queue` ya es el endpoint mas pesado (16KB de logica). Agregar `exam_urgency` al NeedScore agrega 1 query extra (examenes del estudiante para el course_id). Cacheable por 1h.
- Las notificaciones requieren un cron job. Recomendacion: Supabase pg_cron o un Deno Deploy scheduled function.
- El knowledge graph con correlatividades a nivel materia es mucho mas liviano que el de keywords (decenas de nodos vs. miles).

---

## 7. Resumen Ejecutivo

| Feature | Prioridad | Complejidad | Impacto Estimado |
|---|---|---|---|
| Countdown Dashboard | ALTA | Media | Alto -- visibilidad inmediata |
| Modo Semana de Finales | ALTA | Alta | Muy alto -- diferenciador |
| Smart Review Plan | ALTA | Media | Alto -- automatizacion |
| Exam-Aware Spaced Rep | ALTA | Alta | Muy alto -- mejora retención |
| Notificaciones Progresivas | MEDIA-ALTA | Media | Alto -- engagement |
| Panorama de Materias | ALTA | Media | Alto -- overview |
| Calendario Compartido | MEDIA | Media-Alta | Medio -- social |
| SIU Guarani Sync | MEDIA | Alta | Alto -- reduccion friccion (si funciona) |
| Modo Colaborativo | MEDIA | Alta | Medio-Alto -- social |
| Analytics Post-Parcial | MEDIA-ALTA | Baja-Media | Alto -- feedback loop |
| Gamificacion Finales | MEDIA | Baja-Media | Medio -- retention |
| Templates de Plan | MEDIA | Baja | Medio -- onboarding |
| Correlatividades | MEDIA-ALTA | Media | Alto -- planificacion |
| Recordatorio Inscripcion | ALTA | Baja | Alto -- utilidad directa |

**Top 5 para MVP:** Countdown Dashboard, Recordatorio de Inscripcion, Panorama de Materias, Smart Review Plan, Notificaciones Progresivas.

Estas 5 features cubren el 80% del valor con ~30% de la complejidad total.
