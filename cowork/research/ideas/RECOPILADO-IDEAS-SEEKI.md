# Recopilado de Ideas — Seeki/Axon
> **Fecha:** 2026-03-17
> **Equipos de research:** 4 agentes en paralelo
> **Estado:** Ideas para revision — sin implementacion de codigo

---

## Indice

1. [Calendario Academico Argentino](#1-calendario-academico-argentino)
2. [PDF Integrado a Sesion de Resumen](#2-pdf-integrado-a-sesion-de-resumen)
3. [3 Visuales para Sesion de Resumen](#3-tres-visuales-para-sesion-de-resumen)
4. [4 Ideas de IA](#4-cuatro-ideas-de-ia)
5. [Matriz General de Priorizacion](#5-matriz-general-de-priorizacion)
6. [Roadmap Unificado](#6-roadmap-unificado)

---

## 1. Calendario Academico Argentino

> Documento completo: `docs/ideas-calendario-finales-argentina.md`

### Resumen Ejecutivo

14 ideas de features para adaptar Seeki al sistema de finales/parciales argentino. Se analizaron las interfaces existentes (`UpcomingExam`, `FallbackEvent`), el motor de reprogramacion (`rescheduleEngine`), y el sistema de gamificacion (39 badges, 13 endpoints).

### Top 5 Features (MVP)

| # | Feature | Prioridad | Complejidad | Impacto |
|---|---------|-----------|-------------|---------|
| 1 | **Countdown Dashboard** — Panel con countdown por examen + indicador de preparacion basado en p_know | ALTA | Media | Alto |
| 2 | **Recordatorio de Inscripcion a Mesa** — Alertas automaticas para inscripcion en SIU Guarani | ALTA | Baja | Alto |
| 3 | **Panorama de Materias** — Vista global de todas las materias con estado, mastery, correlatividades | ALTA | Media | Alto |
| 4 | **Smart Review Plan Generator** — Plan de repaso auto-generado basado en debilidades y fecha de examen | ALTA | Media | Alto |
| 5 | **Notificaciones Progresivas** — Escalonadas: 30d, 15d, 7d, 3d, 1d, dia del examen | MEDIA-ALTA | Media | Alto |

### Otras Ideas Destacadas

- **Modo "Semana de Finales"** — UI y algoritmos cambian a modo intensivo
- **Exam-Aware Spaced Repetition** — FSRS modificado para que due_at nunca pase la fecha del examen
- **Correlatividades como Grafo** — Reutiliza el knowledge graph (G6) para visualizar dependencias entre materias
- **Importacion desde SIU Guarani** — MVP con copy-paste + AI (Gemini)
- **Gamificacion de Finales** — Badges de temporada, XP x2, streak freeze gratuito

### Modelo de Datos Propuesto

- Tabla `exams` (student_id, course_id, exam_type, date, registration_opens/closes)
- Tabla `course_prerequisites` (course_id, prerequisite_course_id, requirement_type)
- 8 endpoints nuevos

---

## 2. PDF Integrado a Sesion de Resumen

> Documento completo: `docs/ideas-pdf-sesion-resumen.md`

### Resumen Ejecutivo

11 ideas de integracion PDF. Se descubrio que ya existe un pipeline completo de ingesta PDF con Gemini OCR, el knowledge graph ya exporta a PNG/JPEG, y hay 18+ endpoints con datos ricos.

### Top Ideas por Prioridad

**P0 — Hacer primero (1-2 semanas):**

| # | Feature | Descripcion |
|---|---------|-------------|
| 1 | **PDF de Resumen de Sesion** | Al completar sesion, descargar PDF con stats, mastery ring, keywords, progreso |
| 2 | **Mindmap a PDF** | Exportar knowledge graph como PDF (ya existe exportPNG) |
| 3 | **Certificados de Gamificacion** | PDFs de certificados para badges/niveles/logros |

**P1 — Hacer pronto (2-3 semanas):**

| # | Feature | Descripcion |
|---|---------|-------------|
| 4 | **OCR PDF a Flashcards** | Subir PDF de apuntes → IA genera flashcards automaticamente |
| 5 | **PDF de Plan de Estudio** | Exportar study plan con tareas, calendario, progreso |
| 6 | **Importar PDFs de Apuntes** | Vincular PDFs del alumno a topics/summaries |

**P2/P3 — Backlog:**
- Ficha de materia (cheat sheet auto-generada)
- Templates por tipo de sesion (repaso rapido, simulacro, practica)
- Reporte para padres/tutores
- PDF compartible para grupos
- Anotaciones sobre PDF

### Tecnologias Recomendadas

| Libreria | Uso |
|----------|-----|
| **@react-pdf/renderer** | Layouts complejos (reportes, fichas) — JSX declarativo |
| **jsPDF + autotable** | PDFs simples con tablas (certificados) |
| **pdf-lib** | Modificar PDFs existentes |
| **react-pdf (viewer)** | Visualizar PDFs existentes |
| **Gemini OCR** | Ya integrado — extractTextFromPdf() |

---

## 3. Tres Visuales para Sesion de Resumen

> Documento completo: `docs/ideas-visuales-sesion-resumen.md`

### Resumen Ejecutivo

3 propuestas de diseño visual para la sesion de resumen del alumno, basadas en analisis del design system actual (palette.ts, dk-tokens, dk-primitives, 18 componentes reutilizables).

### Visual 1: Dashboard Analitico ⭐ RECOMENDADO COMO V1

**Estilo:** Limpio, data-driven, inspirado en Notion/Linear
**Reutiliza:** 80% de componentes existentes (HeroSection, StatCard, ProgressBar, MasteryRing)
**Componentes nuevos:** Solo 4 (SubjectBreakdownBar, WeeklyHeatmapMini, BadgeRevealCard, SessionScoreGauge)

```
+------------------------------------------------------------------+
|  [HeroSection - gradient teal oscuro]                             |
|   Sesion Completada    ProgressRing(120)   StreakBadge             |
|   "45 flashcards"     [87%]               [7 dias]               |
|   [StatCard x4: Correctas | Tiempo | XP | Dominio]               |
+------------------------------------------------------------------+
|  [Desglose por materia - ProgressBars con deltas]                 |
|  [Grid de Keywords con mastery colors]                            |
|  [Historial de rondas | Actividad semanal]                        |
|  [Badges desbloqueados]                                           |
+------------------------------------------------------------------+
```

### Visual 2: Storytelling / Journey

**Estilo:** Narrativo, timeline vertical, "tu dia de estudio fue..."
**Reutiliza:** 40% componentes existentes
**Componentes nuevos:** 7 (TimelineLine, TimelineNode, TimelineMomentCard, etc.)
**Mejor para:** Resumenes mensuales o de fin de semestre

### Visual 3: Card-based / Magazine

**Estilo:** Spotify Wrapped / Instagram Stories, cards swipeables
**Reutiliza:** 55% componentes existentes
**Componentes nuevos:** 8 (CardCarousel, FullCard, KeywordBubbleCloud, etc.)
**Mejor para:** Mobile-first, gamificacion visual

### Comparacion Rapida

| Criterio | Dashboard | Storytelling | Card-based |
|----------|:---------:|:------------:|:----------:|
| Reutilizacion componentes | 80% | 40% | 55% |
| Complejidad implementacion | Baja | Alta | Media-Alta |
| Mobile-friendliness | Media | Alta | Muy Alta |
| Engagement emocional | Medio | Alto | Muy Alto |
| Alineacion design system | Perfecta | Buena | Buena |

**Recomendacion:** Dashboard Analitico como V1, con elementos Card-based como V2 (KeywordBubbleCloud, BadgeShowcase, weekly wrapped).

---

## 4. Cuatro Ideas de IA

> Documento completo: `docs/ideas-ia-seeki.md`

### Estado Actual de IA en Seeki

Ya existe: RAG chat (Gemini), generacion de flashcards/quizzes, voice calls (OpenAI Realtime), PDF ingest con OCR, AI tutor panel en mindmap, FSRS v4 + BKT v4, embeddings (OpenAI 1536d).

### Idea 1: Tutor IA Personalizado con Memoria a Largo Plazo

**Que es:** Tutor que mantiene perfil cognitivo persistente del alumno — recuerda conversaciones, detecta patrones de error, sugiere proactivamente.

**Diferencia vs RAG actual:** El chat actual es stateless. Este tutor recuerda que el alumno confunde X con Y, sabe que tiene parcial el jueves, y adapta todo a su estilo de aprendizaje.

**Costo:** ~$45/mes (Gemini Flash, 1K alumnos) | MVP: 4 semanas

### Idea 2: Content Factory (Generador de Contenido)

**Que es:** Pipeline que transforma PDFs/apuntes/fotos en flashcards, quizzes, resumenes y conexiones del knowledge graph automaticamente.

**Ya existe el 70% de la infra:** PDF ingest, smart generate, semantic chunker, embeddings.

**Costo:** ~$8/mes | MVP: 3 semanas

### Idea 3: Predictor de Rendimiento Academico

**Que es:** ML que predice probabilidad de aprobar usando 15+ features ya en la DB (bkt_states, fsrs_states, quiz_attempts, study_sessions). Genera alertas tempranas accionables.

**MVP:** Heuristicas rule-based (sin ML). V2: XGBoost con datos historicos.

**Etica:** Nunca "vas a reprobar" → siempre "oportunidades de mejorar". Opt-out. No compartir con profesores sin consentimiento.

**Costo:** ~$6/mes | MVP: 3 semanas

### Idea 4: Grupo de Estudio IA

**Que es:** Matching inteligente de alumnos con perfiles complementarios + sesiones colaborativas moderadas por IA (Quiz Battle, Debate Guiado, Teach-Back, Mapa Mental Colaborativo).

**Usa:** pgvector para matching, Supabase Realtime para sync, gamificacion grupal.

**Costo:** ~$6/mes | MVP: 5 semanas

### Costo Total IA (1K alumnos, todos los MVPs)

| Idea | Costo/mes |
|------|-----------|
| Tutor Personalizado | $45 |
| Content Factory | $8 |
| Predictor | $6 |
| Grupos de Estudio | $6 |
| **TOTAL** | **$65/mes** |

---

## 5. Matriz General de Priorizacion

Todas las ideas de los 4 documentos, ordenadas por ratio impacto/esfuerzo:

### Tier 1 — Quick Wins (alto impacto, bajo esfuerzo)

| Idea | Origen | Esfuerzo | Impacto |
|------|--------|----------|---------|
| PDF de Resumen de Sesion | PDF | 3-5 dias | Alto |
| Certificados de Gamificacion | PDF | 3-5 dias | Medio-Alto |
| Mindmap a PDF | PDF | 3-5 dias | Medio-Alto |
| Recordatorio de Inscripcion | Calendario | 2-3 dias | Alto |
| Dashboard Analitico (Visual 1) | Visuales | 1-2 sem | Alto |

### Tier 2 — Alto Valor (alto impacto, esfuerzo medio)

| Idea | Origen | Esfuerzo | Impacto |
|------|--------|----------|---------|
| Content Factory MVP | IA | 3 semanas | Alto |
| Countdown Dashboard | Calendario | 1-2 sem | Alto |
| Smart Review Plan | Calendario | 1-2 sem | Alto |
| Predictor Rendimiento MVP | IA | 3 semanas | Alto |
| OCR PDF a Flashcards | PDF | 1-2 sem | Alto |

### Tier 3 — Diferenciadores (muy alto impacto, esfuerzo alto)

| Idea | Origen | Esfuerzo | Impacto |
|------|--------|----------|---------|
| Tutor IA Personalizado MVP | IA | 4 semanas | Muy Alto |
| Modo Semana de Finales | Calendario | 2-3 sem | Muy Alto |
| Exam-Aware Spaced Repetition | Calendario | 2-3 sem | Muy Alto |
| Grupo de Estudio IA MVP | IA | 5 semanas | Muy Alto |

### Tier 4 — Backlog

- Ficha de materia, Templates PDF, Reporte para padres
- SIU Guarani Sync, Calendario compartido
- Visual Storytelling (mejor para resumen mensual)
- Card-based Magazine (V2 del resumen)

---

## 6. Roadmap Unificado

```
SPRINT 1 (Semanas 1-2): Quick Wins
├── PDF de Resumen de Sesion
├── Certificados de Gamificacion
├── Mindmap a PDF
├── Recordatorio de Inscripcion a Mesa
└── Dashboard Analitico (Visual 1) para sesion de resumen

SPRINT 2 (Semanas 3-5): Content + Calendario
├── Content Factory MVP (PDF → flashcards, quizzes auto)
├── Countdown Dashboard
├── Smart Review Plan Generator
└── Panorama de Materias

SPRINT 3 (Semanas 6-8): IA Core
├── Tutor IA Personalizado MVP
├── Predictor de Rendimiento MVP (heuristicas)
├── OCR PDF a Flashcards
└── Notificaciones Progresivas (in-app)

SPRINT 4 (Semanas 9-12): Intensivo + Social
├── Modo Semana de Finales
├── Exam-Aware Spaced Repetition
├── Grupo de Estudio IA MVP
└── Gamificacion de temporada de finales

SPRINT 5+ (Semanas 13+): Expansion
├── Versiones completas de cada idea (segun metricas de uso)
├── SIU Guarani Sync (MVP con AI)
├── Correlatividades como Grafo
├── Visual Card-based (V2 del resumen)
└── WhatsApp/Telegram notifications
```

### Costo Total Estimado (infraestructura IA, 1K alumnos)

| Sprint | Costo nuevo/mes |
|--------|----------------|
| Sprint 1 | $0 (sin IA) |
| Sprint 2 | ~$8 (Content Factory) |
| Sprint 3 | ~$57 (+Tutor +Predictor) |
| Sprint 4 | ~$65 (+Grupos) |

---

## Documentos Individuales

Cada documento tiene mucho mas detalle (wireframes, SQL, endpoints, analisis de componentes):

1. `docs/ideas-calendario-finales-argentina.md` — 650 lineas
2. `docs/ideas-pdf-sesion-resumen.md` — 450 lineas
3. `docs/ideas-visuales-sesion-resumen.md` — 550 lineas
4. `docs/ideas-ia-seeki.md` — 660 lineas
