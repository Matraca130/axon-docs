# Axon v4.5 - API Route Map

> Mapa completo de rutas del backend y su estado.
>
> **Ultima actualizacion:** 2026-03-14 (audit pass 2)
>
> **Fuente de verdad:** `docs/BACKEND_MAP.md` y `docs/GAMIFICATION_MAP.md` en `axon-backend`

---

## Patrones del Backend

### Base URL
```
Produccion: https://xdnciktarvxyhkrokbng.supabase.co/functions/v1/server
Figma Make: https://xdnciktarvxyhkrokbng.supabase.co/functions/v1/make-server-6569f786
```

### Headers requeridos
```
Authorization: Bearer <SUPABASE_ANON_KEY>     <- SIEMPRE (gateway Supabase, FIJO)
X-Access-Token: <USER_JWT>                    <- Rutas autenticadas
Content-Type: application/json
```

### Formato de rutas
- Planas con query params: `GET /topics?section_id=xxx`
- NUNCA anidadas: ~~`GET /sections/xxx/topics`~~

---

## Modulos de Rutas (8 split + 6 flat)

### Split Modules

| # | Modulo | Archivos | Tipo |
|---|---|---|---|
| 1 | `routes/content/` | 8 | CRUD factory (9 tablas) + manual |
| 2 | `routes/study/` | 6 | CRUD factory (3 tablas) + manual |
| 3 | `routes/ai/` | 12 | AI/RAG (rate limited) |
| 4 | `routes/members/` | 4 | Instituciones + memberships |
| 5 | `routes/mux/` | 5 | Video (Mux) |
| 6 | `routes/plans/` | 5 | Planes + AI tracking + access |
| 7 | `routes/search/` | 4 | Busqueda global + trash |
| 8 | `routes/gamification/` | 5 | XP, badges, streaks, goals |

### Flat Route Files

| # | Archivo | Proposito |
|---|---|---|
| 1 | `routes-auth.ts` | Auth & profiles (`/signup`, `/me`) |
| 2 | `routes-billing.ts` | Stripe (checkout, portal, webhooks) |
| 3 | `routes-models.ts` | 3D models, pins, notes, layers, parts |
| 4 | `routes-storage.ts` | File upload/download/delete |
| 5 | `routes-student.ts` | Student instruments & notes |
| 6 | `routes-study-queue.ts` | Study queue algorithm |

---

## CRUD Factory - Entidades

**Content (9):** `courses`, `semesters`, `sections`, `topics`, `summaries`, `chunks`, `summary-blocks`, `keywords`, `subtopics`

**Study (3):** `study-sessions`, `study-plans`, `study-plan-tasks`

**Student (6):** `flashcards`, `quiz-questions`, `videos`, `student-notes`, `student-annotations`, `highlight-tags`

**Plans (4):** `platform-plans`, `institution-plans`, `plan-access-rules`, `institution-subscriptions`

**Models (5):** `models-3d`, `model-3d-pins`, `model-3d-notes`, `model-layers`, `model-parts`

Cada entidad genera 5 endpoints: LIST, GET, POST, PUT, DELETE.

---

## Endpoints Manuales por Modulo

### Content (`routes/content/`)

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/keyword-connections?keyword_id=` | Connections bidireccional |
| GET | `/keyword-connections/:id` | Get by ID |
| POST | `/keyword-connections` | Create (canonical a < b) |
| DELETE | `/keyword-connections/:id` | Hard delete |
| GET | `/keyword-connections-batch?keyword_ids=...` | Batch (max 50, EC-02) |
| GET | `/keyword-search?q=&exclude_summary_id=&course_id=&limit=15` | Cross-summary search |
| GET | `/kw-prof-notes?keyword_id=` | Professor notes |
| POST | `/kw-prof-notes` | Upsert |
| DELETE | `/kw-prof-notes/:id` | Hard delete |
| PUT | `/reorder` | Bulk reorder (RPC) |
| GET | `/content-tree?institution_id=` | Nested tree |
| GET | `/flashcards-by-topic?topic_id=` | Batch (PERF C1) |

### Study (`routes/study/`)

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/topic-progress?topic_id=` | Unified progress |
| GET | `/topics-overview?topic_ids=a,b,c` | Batch (max 50) |
| GET/POST | `/reviews` | Reviews (session ownership) |
| GET/POST | `/quiz-attempts` | Quiz attempts |
| POST | `/review-batch` | Atomic batch (PERF M1) |
| GET/POST | `/reading-states` | Upsert |
| GET/POST | `/daily-activities` | Activities |
| GET/POST | `/student-stats` | Stats |
| GET/POST | `/fsrs-states` | FSRS |
| GET/POST | `/bkt-states` | BKT |

### AI / RAG (`routes/ai/`) — Rate limited: 20 POST/hr

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/ai/generate` | Generate flashcard/quiz |
| POST | `/ai/generate-smart` | Adaptive (NeedScore) [Fase 8A] |
| POST | `/ai/pre-generate` | Bulk (own rate limit) [Fase 8D] |
| POST | `/ai/report` | Quality report [Fase 8B] |
| PATCH | `/ai/report/:id` | Resolve report [Fase 8B] |
| GET | `/ai/report-stats` | Quality metrics [Fase 8C] |
| GET | `/ai/reports` | Report listing [Fase 8C] |
| POST | `/ai/ingest-embeddings` | Batch embeddings (1536d) |
| POST | `/ai/re-chunk` | Manual re-chunking [Fase 5] |
| POST | `/ai/rag-chat` | RAG chat [Fase 6] |
| PATCH | `/ai/rag-feedback` | Feedback (thumbs) |
| GET | `/ai/rag-analytics` | Metrics |
| GET | `/ai/embedding-coverage` | Coverage % |
| GET | `/ai/list-models` | Diagnostic |

### Gamification (`routes/gamification/`)

Fuente de verdad: `docs/GAMIFICATION_MAP.md` en backend.

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/gamification/profile` | XP, level, streaks, stats |
| GET | `/gamification/xp-history` | XP transaction log |
| GET | `/gamification/leaderboard` | Weekly (institution-scoped) |
| GET | `/gamification/badges` | All badges + earned status |
| POST | `/gamification/check-badges` | Evaluate and award |
| GET | `/gamification/notifications` | XP + badge events |
| GET | `/gamification/streak-status` | Streak info + repair eligibility |
| POST | `/gamification/daily-check-in` | Daily login (XP + streak) |
| POST | `/gamification/streak-freeze/buy` | Purchase freeze with XP |
| POST | `/gamification/streak-repair` | Repair streak with XP |
| PUT | `/gamification/daily-goal` | Set goal (5-120 min) |
| POST | `/gamification/goals/complete` | Mark completed + bonus |
| POST | `/gamification/onboarding` | Initialize profile |

### Members, Mux, Plans, Search, Auth, Billing, Storage, Study Queue, Student, Models

Sin cambios desde la actualizacion anterior. Ver secciones correspondientes en la version previa.

---

## Respuestas

| Tipo | Formato |
|---|---|
| Lista paginada | `{ "data": { "items": [...], "total", "limit", "offset" } }` |
| Item unico | `{ "data": { ... } }` |
| Lista custom | `{ "data": [...] }` |
| Error | `{ "error": "mensaje" }` |

---

## Estado de Conexion Frontend ↔ Backend

### Conectado
CRUD completo, content tree, search, reorder, study sessions, reviews, batch-review, reading states, FSRS/BKT, AI generate, RAG chat, video (Mux), auth, gamificacion (parcial).

### En progreso
- Gamificacion frontend (Sprint 3)
- AI quality reports frontend
- WhatsApp integration (tablas creadas, backend en desarrollo)
