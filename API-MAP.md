# Axon v4.5 - API Route Map

> Mapa completo de rutas del backend y su estado.
>
> **Ultima actualizacion:** 2026-03-14
>
> **Fuente de verdad:** `docs/BACKEND_MAP.md` en `axon-backend`

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
| 3 | `routes-models.ts` | 3D models, pins, notes |
| 4 | `routes-storage.ts` | File upload/download/delete |
| 5 | `routes-student.ts` | Student instruments & notes |
| 6 | `routes-study-queue.ts` | Study queue algorithm |

---

## CRUD Factory - Endpoints por Entidad

Cada entidad registrada en el factory genera estos 5 endpoints:

```
GET    /{entity}          Lista paginada (query params: limit, offset, filtros)
GET    /{entity}/:id      Obtener uno por ID
POST   /{entity}           Crear nuevo
PUT    /{entity}/:id      Actualizar
DELETE /{entity}/:id      Soft-delete (o hard delete segun config)
```

### Entidades CRUD Factory

**Content (9):** `courses`, `semesters`, `sections`, `topics`, `summaries`, `chunks`, `summary-blocks`, `keywords`, `subtopics`

**Study (3):** `study-sessions`, `study-plans`, `study-plan-tasks`

**Student (6):** `flashcards`, `quiz-questions`, `videos`, `student-notes`, `student-annotations`, `highlight-tags`

**Plans (4):** `platform-plans`, `institution-plans`, `plan-access-rules`, `institution-subscriptions`

**Models (3):** `models-3d`, `model-3d-pins`, `model-3d-notes`

---

## Endpoints Manuales por Modulo

### Content (`routes/content/`)

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/keyword-connections?keyword_id=` | List connections (bidireccional) |
| GET | `/keyword-connections/:id` | Get by ID |
| POST | `/keyword-connections` | Create (enforces a < b canonical order) |
| DELETE | `/keyword-connections/:id` | Hard delete |
| GET | `/keyword-connections-batch?keyword_ids=uuid1,uuid2,...` | **NUEVO** Batch load (max 50, elimina N+1) |
| GET | `/keyword-search?q=&exclude_summary_id=&course_id=&limit=15` | Cross-summary keyword search (institution-scoped RPC) |
| GET | `/kw-prof-notes?keyword_id=` | List professor notes |
| POST | `/kw-prof-notes` | Upsert (one per prof per keyword) |
| DELETE | `/kw-prof-notes/:id` | Hard delete |
| PUT | `/reorder` | Bulk reorder (RPC + fallback) |
| GET | `/content-tree?institution_id=` | Nested hierarchy tree |
| GET | `/flashcards-by-topic?topic_id=` | Batch flashcards por topico (PERF C1) |

### Study (`routes/study/`)

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/topic-progress?topic_id=` | Summaries + reading states + flashcard counts (1 request) |
| GET | `/topics-overview?topic_ids=a,b,c` | Batch (max 50) summaries + keyword counts |
| GET | `/reviews?session_id=` | List reviews (session ownership verified) |
| POST | `/reviews` | Create review (grade 0-5) |
| GET | `/quiz-attempts?quiz_question_id=&session_id=` | List attempts |
| POST | `/quiz-attempts` | Create attempt |
| POST | `/review-batch` | **PERF** Atomic batch: reviews + FSRS + BKT (90 reqs → 1) |
| GET | `/reading-states?summary_id=` | Get reading state |
| POST | `/reading-states` | Upsert reading state |
| GET | `/daily-activities?from=&to=` | List (capped 500) |
| POST | `/daily-activities` | Upsert |
| GET | `/student-stats` | Get student stats |
| POST | `/student-stats` | Upsert |
| GET | `/fsrs-states?flashcard_id=&state=&due_before=` | List FSRS states (capped 500) |
| POST | `/fsrs-states` | Upsert |
| GET | `/bkt-states?subtopic_id=` | List BKT states (capped 500) |
| POST | `/bkt-states` | Upsert |

### AI / RAG (`routes/ai/`)

Rate limited: 20 POST/hour per user (excepto report y pre-generate).

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| POST | `/ai/generate` | ALL_ROLES | Generate flashcard/quiz (client provides IDs) |
| POST | `/ai/generate-smart` | ALL_ROLES | Adaptive (NeedScore auto-selects keyword) [Fase 8A] |
| POST | `/ai/pre-generate` | CONTENT_WRITE | Bulk pre-generation (own rate limit) [Fase 8D] |
| POST | `/ai/report` | ALL_ROLES | Report AI content quality issue [Fase 8B] |
| PATCH | `/ai/report/:id` | CONTENT_WRITE | Resolve/dismiss report [Fase 8B] |
| GET | `/ai/report-stats` | CONTENT_WRITE | Aggregate quality metrics [Fase 8C] |
| GET | `/ai/reports` | CONTENT_WRITE | Paginated report listing [Fase 8C] |
| POST | `/ai/ingest-embeddings` | MANAGEMENT | Batch embeddings for chunks + summaries |
| POST | `/ai/re-chunk` | CONTENT_WRITE | Manual re-chunking [Fase 5] |
| POST | `/ai/rag-chat` | ALL_ROLES | Multi-Query/HyDE + Re-rank + hybrid search [Fase 6] |
| PATCH | `/ai/rag-feedback` | ALL_ROLES | Feedback on RAG response (thumbs up/down) |
| GET | `/ai/rag-analytics` | MANAGEMENT | RAG query metrics |
| GET | `/ai/embedding-coverage` | MANAGEMENT | % chunks with embeddings |
| GET | `/ai/list-models` | ALL_ROLES | Diagnostic: list Gemini models |

### Gamification (`routes/gamification/`) — NUEVO

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/gamification/profile` | XP, level, streaks, stats |
| GET | `/gamification/xp-history` | XP history timeline |
| GET | `/gamification/leaderboard` | Weekly leaderboard (institution-scoped) |
| GET | `/gamification/badges` | All badges + earned status |
| POST | `/gamification/check-badges` | Evaluate and award eligible badges |
| GET | `/gamification/notifications` | Badge notifications (unread) |
| GET | `/gamification/streak-status` | Current streak info |
| POST | `/gamification/daily-check-in` | Daily check-in (XP + streak) |
| POST | `/gamification/streak-freeze` | Use a streak freeze (max 3) |
| POST | `/gamification/streak-repair` | Repair broken streak |
| PUT | `/gamification/daily-goal` | Set daily goal (5-120 minutes) |
| POST | `/gamification/goals/complete` | Mark daily goal as completed |
| POST | `/gamification/onboarding` | Initial gamification setup |

### Members (`routes/members/`)

| Metodo | Ruta | Descripcion |
|---|---|---|
| CRUD | `/institutions` | Institution management |
| POST | `/institutions/join` | Join by code |
| CRUD | `/memberships` | Institution memberships |
| - | `/admin-scopes` | Admin scope management |

### Mux Video (`routes/mux/`)

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/mux/create-upload` | Direct upload to Mux |
| GET | `/mux/playback-token` | Signed JWT for playback |
| GET | `/mux/asset/:video_id` | Asset info |
| POST | `/mux/track-view` | Track video view (atomic upsert) |
| GET | `/mux/video-stats` | Video statistics |
| POST | `/webhooks/mux` | Mux webhook (idempotent) |

### Plans (`routes/plans/`)

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/ai-generations` | AI generation history |
| GET | `/usage-today` | Today's AI usage count |
| GET | `/summary-diagnostics` | Summary diagnostics |
| GET | `/content-access` | Content access check |

### Search (`routes/search/`)

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/search` | Global search (parallel queries) |
| GET | `/trash` | List deleted items |
| POST | `/restore/:table/:id` | Restore deleted item |

### Auth (`routes-auth.ts`)

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/signup` | Create account |
| GET | `/me` | Get profile |
| PUT | `/me` | Update profile |

### Billing (`routes-billing.ts`)

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/billing/checkout` | Stripe checkout session |
| POST | `/billing/portal` | Stripe customer portal |
| GET | `/billing/subscription` | Current subscription |
| POST | `/webhooks/stripe` | Stripe webhook (timing-safe) |

### Storage (`routes-storage.ts`)

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/storage/upload` | File upload (base64 or form) |
| POST | `/storage/signed-url` | Batch signed URLs (max 100) |
| POST | `/storage/delete` | Delete file |

### Study Queue (`routes-study-queue.ts`)

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/study-queue?course_id=&limit=&include_future=` | NeedScore-based study queue |

### Student (`routes-student.ts`)

CRUD factory for student-scoped tables: `flashcards`, `quiz-questions`, `videos`, `student-notes`, `student-annotations`, `highlight-tags`

Plus manual:

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/kw-student-notes?keyword_id=` | Student notes on keywords |
| POST | `/kw-student-notes` | Create note |
| PUT | `/kw-student-notes/:id` | Update note |
| DELETE | `/kw-student-notes/:id` | Soft-delete |
| GET | `/text-annotations?summary_id=` | Text annotations |
| POST | `/text-annotations` | Create annotation |
| PUT | `/text-annotations/:id` | Update |
| DELETE | `/text-annotations/:id` | Soft-delete |
| GET | `/video-notes?video_id=` | Video notes |
| POST | `/video-notes` | Create note |
| PUT | `/video-notes/:id` | Update |
| DELETE | `/video-notes/:id` | Soft-delete |

---

## Respuestas

### Lista paginada (factory CRUD)
```json
{
  "data": {
    "items": [{ "id": "uuid", "...fields" }],
    "total": 100,
    "limit": 20,
    "offset": 0
  }
}
```

### Item unico
```json
{
  "data": { "id": "uuid", "...fields" }
}
```

### Lista custom (array plano)
```json
{
  "data": [...]
}
```

### Error
```json
{
  "error": "mensaje descriptivo"
}
```

---

## Estado de Conexion Frontend ↔ Backend

### Conectado (funciona)
- CRUD completo de todas las entidades de contenido
- Content tree, search, reorder
- Study sessions, reviews, batch-review
- Reading states, FSRS/BKT states
- AI generate, RAG chat
- Video (Mux upload, playback, tracking)
- Auth (signup, login, profile)
- Gamificacion (parcial — Sprint 3 en progreso)

### En progreso
- Gamificacion frontend (DailyGoalWidget, GamificationCard conectados)
- AI quality reports (frontend por implementar)
- Pre-generate bulk (frontend por implementar)
