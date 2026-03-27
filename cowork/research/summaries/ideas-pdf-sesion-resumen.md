# Ideas: Integracion de PDFs en la Sesion de Resumen - Seeki/Axon

> Documento de investigacion de producto. No contiene codigo, solo ideas y analisis.
> Fecha: 2026-03-17

---

## 1. Analisis de lo que ya existe

### 1.1 Sesion de resumen actual (StudentSummaryReader)

La sesion de resumen del alumno actualmente muestra:

**Contenido del resumen (lector):**
- Texto del resumen en markdown/HTML con paginacion (3500 chars por pagina)
- Imagenes enriquecidas automaticamente (markdown images, URLs crudas)
- Chunks del resumen (tab separado)
- Keywords del resumen con definiciones
- Anotaciones de texto del alumno (highlights con color + nota)
- Barra de progreso con texto motivacional ("Buen comienzo!", "Ya casi terminas!")
- Strip markdown para previews en tarjetas

**Pantalla de sesion completada (AdaptiveCompletedScreen):**
- Total de flashcards revisadas y rondas completadas
- Anillo de dominio general (MasteryRing) con porcentaje
- Delta badges: cards mejoradas, cards que bajaron, cards nuevamente dominadas
- Historial de rondas (professor vs IA)
- Conteo de correctas vs total
- Opciones: Reiniciar o Finalizar

**Pantalla entre rondas (AdaptivePartialSummary):**
- Mastery Ring con porcentaje de dominio
- Delta badges del progreso
- Panel de keywords con mastery por keyword
- Resultado de la ultima generacion IA (cards creadas, keywords cubiertos)
- Selector para generar mas flashcards con IA (enfocadas en areas debiles)
- Historial de rondas previas

### 1.2 Datos del backend disponibles

| Dato | Endpoint | Descripcion |
|------|----------|-------------|
| Resumen completo | `GET /summaries/:id` | title, content_markdown, source_type, estimated_study_minutes |
| Chunks | `GET /chunks?summary_id=X` | Fragmentos con embeddings, order_index |
| Keywords | `GET /keywords?summary_id=X` | name, definition, priority, clinical_priority, is_foundation |
| Subtopics | `GET /subtopics?keyword_id=X` | name, order_index |
| Flashcards | `GET /flashcards?summary_id=X` | front, back, source (ai/professor), images |
| Quiz Questions | `GET /quiz-questions?summary_id=X` | question, options, correct_answer, explanation, difficulty |
| Sesiones de estudio | `GET /study-sessions` | session_type, completed_at, total_reviews, correct_reviews |
| Reviews | `GET /reviews?session_id=X` | item_id, grade (0-5), response_time_ms |
| FSRS States | `GET /fsrs-states` | stability, difficulty, due_at, reps, lapses, state, is_leech |
| BKT States | `GET /bkt-states` | p_know, max_p_know, total_attempts, correct_attempts, delta |
| Study Queue | `GET /study-queue` | need_score, retention, mastery_color, clinical_priority |
| Actividad diaria | `GET /daily-activities` | reviews_count, correct_count, time_spent_seconds, sessions_count |
| Stats del alumno | `GET /student-stats` | current_streak, longest_streak, total_reviews, total_time_seconds |
| Progreso por topic | `GET /topic-progress?topic_id=X` | summaries, reading_states, flashcard_counts |
| Reading states | `GET /reading-states?summary_id=X` | scroll_position, time_spent_seconds, completed |
| Keyword connections | `GET /keyword-connections-batch` | edges del knowledge graph con connection_type |
| Gamificacion perfil | `GET /gamification/profile` | level, total_xp, daily progress |
| Badges | `GET /gamification/badges` | earned badges, rarity, icon |
| Study Plans | `GET /study-plans` | name, status, weekly_hours, tasks |
| Notas del alumno | `GET /kw-student-notes`, `GET /text-annotations`, `GET /video-notes` | Notas personales |
| Anotaciones de texto | `GET /text-annotations?summary_id=X` | start_offset, end_offset, color, note |

### 1.3 Infraestructura PDF existente

- **Ingest PDF** (`POST /ai/ingest-pdf`): Ya existe un pipeline completo que sube PDFs, extrae texto con Gemini, crea un summary, lo sube a Supabase Storage (bucket `pdf-sources`), y ejecuta auto-chunking + embedding. Soporta hasta 10MB.
- **Storage**: Supabase Storage con bucket `pdf-sources` ya configurado.
- **Campos en summaries**: `source_type`, `source_file_name`, `source_file_path`, `pdf_source_url`, `pdf_page_start`, `pdf_page_end`.
- **Knowledge Graph**: G6 con export a PNG/JPEG ya implementado (`exportPNG()`, `exportJPEG()` en `GraphControls`).

---

## 2. Ideas de integracion PDF

### IDEA 1: PDF automatico del resumen de sesion

**Nombre:** Session Summary PDF Export

**Descripcion:** Al finalizar una sesion de estudio (flashcards, quiz, o lectura), el alumno puede descargar un PDF con el resumen completo de su sesion.

**Como funciona:**
1. Al llegar a AdaptiveCompletedScreen, aparece un boton "Descargar PDF"
2. El sistema recopila: stats de la sesion, mastery ring (como imagen SVG/canvas), delta badges, historial de rondas, keywords con mastery
3. Se genera un PDF client-side con el branding de Seeki
4. Incluye: fecha, materia, topic, duracion, flashcards revisadas, % dominio, keywords debiles/fuertes, grafico de progreso

**Beneficio para el alumno:** Registro tangible de cada sesion de estudio. Util para revisar que estudio, compartir con companieros, o mostrar a padres/tutores como evidencia de estudio.

**Complejidad estimada:** Media. Los datos ya estan disponibles en el frontend al momento de completar la sesion. Solo falta la generacion del PDF.

---

### IDEA 2: Exportar Knowledge Graph / Mindmap a PDF

**Nombre:** Mindmap PDF Export

**Descripcion:** Exportar el knowledge graph (mapa de keywords + conexiones + mastery colors) como un PDF de alta calidad, con leyenda de colores y conexiones.

**Como funciona:**
1. Ya existe `exportPNG()` y `exportJPEG()` en GraphControls (G6)
2. Agregar opcion "Exportar PDF" que capture el canvas del grafo
3. Envolver la imagen en un PDF con: titulo del topic/curso, leyenda de colores de mastery (red/orange/yellow/green/blue), leyenda de tipos de conexion (10 tipos medicos), fecha, nombre del alumno
4. Opcion de incluir tabla de keywords con su % de mastery

**Beneficio para el alumno:** Material de estudio visual imprimible. Los mindmaps son herramientas de estudio probadas. Poder imprimirlo o tenerlo como PDF permite estudio offline y repaso rapido.

**Complejidad estimada:** Baja-Media. La captura del grafo ya funciona. Solo falta envolverlo en PDF con metadata.

---

### IDEA 3: PDF de plan de estudio personalizado

**Nombre:** Study Plan PDF

**Descripcion:** Generar un PDF del study plan del alumno con las tareas planificadas, progreso actual, y calendario sugerido.

**Como funciona:**
1. Desde la vista de Study Plans, boton "Exportar plan"
2. Recopilar: study plan tasks, status de cada task, scheduled_dates, estimated_minutes
3. Generar PDF con: tabla de tareas por dia/semana, % completado, materias pendientes, estimacion de tiempo restante
4. Incluir un mini-calendario visual con los dias planificados

**Beneficio para el alumno:** Plan de estudio tangible que puede pegar en su escritorio, refrigerador, o compartir con su grupo. Convierte la planificacion digital en algo fisico y recordable.

**Complejidad estimada:** Media. Los datos existen en `/study-plans` y `/study-plan-tasks`. La complejidad esta en el diseno del layout del PDF.

---

### IDEA 4: Ficha de materia (Subject Cheat Sheet)

**Nombre:** Subject Summary Sheet

**Descripcion:** PDF de "ficha de materia" que consolida todo lo estudiado en un topic: keywords clave, definiciones, relaciones entre conceptos, flashcards importantes, y estado de mastery.

**Como funciona:**
1. Desde la vista de un topic, boton "Generar ficha"
2. Fetch paralelo: keywords + definitions, subtopics, keyword connections, BKT states, flashcards mas falladas (is_leech), quiz questions con baja tasa de acierto
3. Layout del PDF en formato "cheat sheet" (2 columnas, compacto):
   - Seccion 1: Keywords con definiciones (priorizados por clinical_priority)
   - Seccion 2: Relaciones clave (del knowledge graph)
   - Seccion 3: Puntos debiles (keywords con mastery < 50%)
   - Seccion 4: Flashcards "leech" (las que mas se fallan)
   - Seccion 5: Mini mindmap (captura del grafo)
4. Opcion de imprimir en A4 o carta

**Beneficio para el alumno:** La "cheat sheet" es una tecnica de estudio clasica. Tener una auto-generada con los datos de su propia performance es extremadamente util para repasos pre-examen.

**Complejidad estimada:** Alta. Requiere consolidar datos de multiples endpoints y crear un layout denso y legible.

---

### IDEA 5: PDF compartible para grupos de estudio

**Nombre:** Study Group Report

**Descripcion:** PDF que un alumno puede compartir con su grupo de estudio, mostrando que topics ha cubierto, en que es fuerte/debil (anonimizado opcionalmente), y flashcards/quizzes recomendados.

**Como funciona:**
1. El alumno selecciona un curso o materia
2. Se genera un PDF con:
   - Topics estudiados vs pendientes
   - Areas de fortaleza (donde puede ayudar al grupo)
   - Areas debiles (donde necesita ayuda)
   - Flashcards recomendadas para estudiar en grupo
   - QR code o link para unirse a la plataforma
3. Opcion de "modo anonimo" que oculta el nombre pero mantiene los datos utiles

**Beneficio para el alumno:** Facilita el estudio colaborativo. Cada miembro del grupo puede ver donde complementarse. Promueve el aprendizaje entre pares.

**Complejidad estimada:** Media-Alta. Requiere logica de seleccion de datos relevantes y diseno pensado para compartir.

---

### IDEA 6: Reporte de progreso para padres/tutores

**Nombre:** Parent Progress Report

**Descripcion:** PDF formal con el progreso del alumno, disenado para que padres o tutores puedan entender como va el estudio.

**Como funciona:**
1. Desde el perfil del alumno, boton "Generar reporte para padres"
2. Recopilar datos de las ultimas 2-4 semanas:
   - Horas de estudio totales (de daily_activities.time_spent_seconds)
   - Sesiones completadas (student_stats.total_sessions)
   - Streak actual y racha mas larga
   - Nivel de gamificacion y badges ganados
   - Progreso por materia (% de topics dominados)
   - Grafico de actividad diaria (heatmap estilo GitHub)
3. Tono del PDF: profesional, con graficos claros, lenguaje accesible para no-expertos
4. Incluir: logo de la institucion, nombre del alumno, periodo del reporte

**Beneficio para el alumno:** Transparencia con padres/tutores. Demuestra esfuerzo tangible. Los padres pueden identificar areas donde el alumno necesita apoyo adicional.

**Complejidad estimada:** Media-Alta. Los datos existen pero la presentacion debe ser muy cuidada para un publico no-tecnico.

---

### IDEA 7: Importar PDFs de apuntes y vincularlos a sesiones

**Nombre:** PDF Notes Import & Link

**Descripcion:** Los alumnos pueden subir sus propios PDFs (apuntes escaneados, material de clase, papers) y vincularlos a topics/summaries especificos para tener todo centralizado.

**Como funciona:**
1. En la vista de un topic/summary, boton "Adjuntar material"
2. Upload del PDF a Supabase Storage (ya existe el bucket pdf-sources)
3. Crear una entrada en una tabla nueva `student_attachments` (student_id, topic_id/summary_id, file_path, title, file_size)
4. El PDF aparece como recurso adicional en la sidebar del reader
5. Opcionalmente: extraer texto con Gemini (reusar pipeline de ingest-pdf) para hacer el contenido buscable

**Beneficio para el alumno:** Un solo lugar para todo su material de estudio. No necesita alternar entre apps. Puede revisar sus apuntes junto al contenido oficial.

**Complejidad estimada:** Media. La infraestructura de storage y extraccion ya existe. Falta el CRUD de attachments y la UI.

---

### IDEA 8: OCR de PDFs escaneados para crear flashcards automaticas

**Nombre:** PDF-to-Flashcards

**Descripcion:** Subir un PDF (apuntes escaneados, slides del profesor) y que la IA genere flashcards automaticamente a partir del contenido.

**Como funciona:**
1. El alumno sube un PDF desde la vista de estudio
2. El pipeline existente de ingest-pdf extrae el texto con Gemini (ya soporta OCR de scans)
3. El texto extraido se envia al endpoint de generacion IA (`POST /ai/generate-smart`) para crear flashcards
4. Las flashcards se agregan al topic correspondiente con source="ai_from_pdf"
5. El alumno puede revisar y aprobar/rechazar cada flashcard generada

**Beneficio para el alumno:** Convierte material pasivo (apuntes, slides) en material de estudio activo (flashcards). Ahorra horas de creacion manual.

**Complejidad estimada:** Media. Los pipelines individuales existen (ingest-pdf + generate-smart). Falta orquestarlos en un flujo unificado.

---

### IDEA 9: Anotaciones sobre PDF integradas en la sesion de estudio

**Nombre:** PDF Annotation Layer

**Descripcion:** Cuando un resumen proviene de un PDF (source_type="pdf"), el alumno puede ver el PDF original y hacer anotaciones directamente sobre el, vinculadas a keywords.

**Como funciona:**
1. Si el summary tiene `source_file_path`, mostrar opcion "Ver PDF original"
2. Renderizar el PDF con react-pdf en un viewer integrado
3. Permitir anotaciones similares a text-annotations pero con coordenadas de pagina/posicion del PDF
4. Las anotaciones se vinculan al keyword mas cercano (por proximidad semantica o seleccion manual)
5. Las anotaciones aparecen en la sidebar de keywords

**Beneficio para el alumno:** Mantiene el contexto original del material. Las anotaciones sobre el PDF son mas naturales que sobre texto procesado.

**Complejidad estimada:** Alta. Requiere un viewer PDF completo con layer de anotaciones. El modelo de datos de anotaciones necesita extenderse para soportar coordenadas PDF (pagina, x, y, width, height).

---

### IDEA 10: Certificados/logros de gamificacion en PDF

**Nombre:** Achievement Certificates

**Descripcion:** PDFs de certificados visuales cuando el alumno alcanza logros: badges, niveles, streaks largos, o completar todos los topics de un curso.

**Como funciona:**
1. Al ganar un badge o subir de nivel, opcion "Descargar certificado"
2. Template de certificado con:
   - Nombre del logro y su icono/insignia
   - Nombre del alumno
   - Fecha de obtencion
   - Datos del logro (ej: "500 flashcards revisadas", "30 dias de streak")
   - Firma digital de la institucion
   - QR code de verificacion (opcional)
3. Templates distintos por rarity del badge (comun, raro, epico, legendario)

**Beneficio para el alumno:** Recompensa tangible del sistema de gamificacion. Compartible en redes sociales o curriculum. Refuerza la motivacion intrinseca con reconocimiento extrinseco.

**Complejidad estimada:** Baja-Media. Los datos de badges y logros existen. Solo falta el template del certificado y la generacion.

---

### IDEA 11: Templates de PDF por tipo de sesion

**Nombre:** Session-Type PDF Templates

**Descripcion:** PDFs pre-formateados segun el tipo de sesion: repaso rapido, practica intensiva, simulacro de examen.

**Como funciona:**

**Template "Repaso rapido":**
- Lista de keywords con definiciones cortas
- Top 10 flashcards mas dificiles (is_leech o lowest retention)
- Mini quiz de 5 preguntas clave
- Cabe en 1-2 paginas para llevar impreso

**Template "Practica intensiva":**
- Todas las flashcards de un topic, organizadas por keyword
- Espacio para notas a mano al lado de cada flashcard
- Respuestas en pagina separada (auto-evaluacion)

**Template "Simulacro de examen":**
- Quiz questions del topic organizadas por dificultad
- Formato de examen real (numeradas, sin respuestas visibles)
- Hoja de respuestas al final
- Espacio para mostrar trabajo/razonamiento

1. Desde la vista de estudio, el alumno elige tipo de template y topic/materia
2. Se genera el PDF correspondiente

**Beneficio para el alumno:** Material de estudio adaptado al objetivo. Un repaso rapido es diferente a una practica intensiva. Permite estudiar offline (transporte, lugares sin internet).

**Complejidad estimada:** Media-Alta. Cada template requiere su propio layout y logica de seleccion de contenido.

---

## 3. Tecnologias sugeridas

### 3.1 Librerias de generacion PDF (client-side)

| Libreria | Ventajas | Desventajas | Recomendacion |
|----------|----------|-------------|---------------|
| **jsPDF** | Madura, popular, API simple, soporte canvas/images | API imperativa, difícil layouts complejos | Buena para PDFs simples (certificados, reportes basicos) |
| **jsPDF + jspdf-autotable** | Tablas automaticas, paginacion | Dependencia extra | Ideal para reportes con tablas |
| **@react-pdf/renderer** | JSX para definir layouts, React-native, componentes declarativos | Bundle size (~200KB), no renderiza en DOM | **Recomendada para layouts complejos** (fichas, reportes para padres) |
| **pdf-lib** | Modificar PDFs existentes, bajo nivel, tree-shakeable | API verbose, sin layout engine | Buena para certificados con templates pre-hechos |
| **html2canvas + jsPDF** | Capturar cualquier componente React como PDF | Calidad variable, problemas con CSS, lento | Fallback rapido, no ideal para produccion |
| **Puppeteer/Playwright (server)** | Render perfecto de HTML a PDF | Requiere servidor, lento, costoso | Solo si se necesita fidelidad perfecta |

**Recomendacion principal:**
- **@react-pdf/renderer** para ideas 1, 3, 4, 5, 6, 11 (layouts complejos con datos dinamicos)
- **jsPDF + jspdf-autotable** para idea 10 (certificados con template simple)
- **pdf-lib** para idea 9 (anotar sobre PDFs existentes)
- **react-pdf** (de react-pdf, no @react-pdf/renderer) para idea 9 (visualizar PDFs existentes)

### 3.2 Librerias de visualizacion PDF (viewer)

| Libreria | Uso |
|----------|-----|
| **react-pdf** (wojtekmaj) | Viewer de PDF con paginacion, zoom, texto seleccionable. Ideal para idea 9. |
| **pdfjs-dist** | Motor base de Mozilla, mas control pero mas trabajo |

### 3.3 OCR y extraccion

- **Gemini** (ya integrado): `extractTextFromPdf()` en `gemini.ts` ya existe. Soporta OCR de scans.
- No se necesita libreria adicional de OCR.

### 3.4 Consideraciones de rendimiento

1. **Generacion client-side vs server-side:**
   - Client-side (recomendado para MVP): No consume recursos del servidor, respuesta inmediata, funciona offline
   - Server-side (futuro): Para PDFs pesados (>20 paginas) o batch generation, considerar Deno/Node con Puppeteer

2. **Bundle size:**
   - @react-pdf/renderer: ~200KB gzipped. Usar lazy loading (`React.lazy`) para cargar solo cuando el usuario pide un PDF
   - jsPDF: ~80KB gzipped
   - react-pdf (viewer): ~400KB gzipped (incluye pdf.worker.js). Cargar async

3. **Imagenes en PDF:**
   - El MasteryRing y graficos deben convertirse a canvas/SVG antes de insertarlos
   - Para el Knowledge Graph: reusar `exportPNG()` ya existente

4. **Memoria:**
   - PDFs grandes (>50 paginas) pueden causar problemas en mobile
   - Implementar progress indicator durante generacion
   - Considerar Web Workers para generacion en background

### 3.5 Almacenamiento y CDN

- **PDFs generados on-demand:** No almacenar. Generar cada vez que el usuario lo pida (los datos cambian constantemente).
- **PDFs subidos por alumnos (idea 7):** Almacenar en Supabase Storage, bucket `student-attachments` (nuevo). RLS por student_id.
- **Templates de certificados (idea 10):** Assets estaticos en el bundle o en Supabase Storage (bucket publico `certificate-templates`).
- **Limites sugeridos:**
  - Upload de PDF por alumno: max 10MB por archivo, max 500MB total por alumno
  - Cache: No cachear PDFs generados (datos en tiempo real)

---

## 4. Priorizacion (Impacto vs Complejidad)

### Matriz de priorizacion

| # | Idea | Impacto (1-5) | Complejidad (1-5) | Ratio | Prioridad |
|---|------|:---:|:---:|:---:|:---:|
| 1 | PDF de resumen de sesion | 5 | 2 | 2.50 | **P0 - Hacer primero** |
| 10 | Certificados de gamificacion | 4 | 2 | 2.00 | **P0 - Hacer primero** |
| 2 | Mindmap a PDF | 4 | 2 | 2.00 | **P0 - Hacer primero** |
| 8 | OCR PDF a flashcards | 5 | 3 | 1.67 | **P1 - Hacer pronto** |
| 3 | PDF de plan de estudio | 4 | 3 | 1.33 | **P1 - Hacer pronto** |
| 7 | Importar PDFs de apuntes | 4 | 3 | 1.33 | **P1 - Hacer pronto** |
| 4 | Ficha de materia | 5 | 4 | 1.25 | **P2 - Backlog** |
| 11 | Templates por tipo de sesion | 4 | 4 | 1.00 | **P2 - Backlog** |
| 6 | Reporte para padres/tutores | 4 | 4 | 1.00 | **P2 - Backlog** |
| 5 | PDF para grupos de estudio | 3 | 4 | 0.75 | **P3 - Futuro** |
| 9 | Anotaciones sobre PDF | 4 | 5 | 0.80 | **P3 - Futuro** |

### Escala de impacto:
- 5 = Diferenciador competitivo, todos los usuarios lo usarian
- 4 = Muy util, la mayoria lo usaria
- 3 = Util para un segmento especifico
- 2 = Nice to have
- 1 = Marginal

### Escala de complejidad:
- 1 = Trivial (1-2 dias)
- 2 = Baja (3-5 dias)
- 3 = Media (1-2 semanas)
- 4 = Alta (2-4 semanas)
- 5 = Muy alta (1+ mes)

### Roadmap sugerido

**Sprint 1 (P0 - Quick wins, 1-2 semanas):**
- Idea 1: PDF de resumen de sesion -- Los datos ya estan en memoria en CompletedScreen
- Idea 10: Certificados -- Template simple + datos de badges existentes
- Idea 2: Mindmap PDF -- exportPNG() ya existe, solo envolver en PDF

**Sprint 2 (P1 - Valor alto, 2-3 semanas):**
- Idea 8: OCR PDF a flashcards -- Orquestar pipelines existentes
- Idea 7: Importar PDFs -- CRUD simple + Storage existente
- Idea 3: PDF de plan de estudio -- Datos disponibles, layout medio

**Sprint 3+ (P2/P3 - Backlog, segun demanda):**
- Idea 4, 6, 11: Requieren mas diseno y validacion con usuarios
- Idea 5, 9: Requieren features adicionales (grupos, PDF viewer)

---

## Apendice: Archivos clave del codebase

### Frontend (seeki-perf)
- `src/app/components/content/flashcard/adaptive/AdaptiveCompletedScreen.tsx` -- Pantalla de sesion completada
- `src/app/components/content/flashcard/adaptive/AdaptivePartialSummary.tsx` -- Pantalla entre rondas
- `src/app/lib/session-stats.ts` -- Helpers de estadisticas (computeMasteryPct, computeDeltaStats)
- `src/app/lib/sessionAnalytics.ts` -- Post analytics (student-stats + daily-activities)
- `src/app/lib/summary-content-helpers.tsx` -- Helpers de contenido (paginacion, enriquecimiento HTML)
- `src/app/components/content/summary-helpers.ts` -- stripMarkdown, getMotivation
- `src/app/routes/summary-student-routes.ts` -- Rutas de summary para alumno
- `src/app/services/reviewsApi.ts` -- API de reviews
- `src/app/services/student-api/sa-activity-sessions.ts` -- API de sesiones y actividad

### Frontend (mindmap - numero1_sseki)
- `src/app/types/mindmap.ts` -- Tipos del knowledge graph (MapNode, MapEdge, GraphControls con exportPNG/JPEG)
- `src/app/services/mindmapApi.ts` -- API del mindmap (fetchGraphByTopic, fetchGraphByCourse)

### Backend (axon-backend)
- `supabase/functions/server/routes/ai/ingest-pdf.ts` -- Pipeline de ingesta de PDF existente
- `supabase/functions/server/routes-student.ts` -- CRUD de flashcards, quiz, notas
- `supabase/functions/server/routes-study-queue.ts` -- Study queue con NeedScore
- `supabase/functions/server/routes/gamification/badges.ts` -- Sistema de badges

### Docs (axon-docs)
- `api/routes-study.md` -- Documentacion de endpoints de estudio
- `api/routes-content.md` -- Documentacion de endpoints de contenido
