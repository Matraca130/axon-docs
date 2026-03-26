# Axon v4.5 - API Route Map

> Mapa completo de rutas. **Ultima actualizacion:** 2026-03-14 (audit pass 6 — verified via router index files)

---

## Patrones

```
Base: https://xdnciktarvxyhkrokbng.supabase.co/functions/v1/server
Headers: Authorization (anon key), X-Access-Token (JWT), Content-Type: application/json
Rutas planas: GET /topics?section_id=xxx (NUNCA anidadas)
```

---

## Modulos (11 split + 6 flat)

| # | Modulo | Archivos | Activos | Tipo |
|---|---|---|---|---|
| 1 | `routes/content/` | 11 | 11 | CRUD + connections, search, reorder, tree, batch |
| 2 | `routes/study/` | 6 | 6 | Sessions, reviews, progress, spaced-rep, batch |
| 3 | `routes/ai/` | 14 en disco | **14 endpoints (12 files mounted)** | AI/RAG + PDF ingest (2 dead: list-models, re-embed-all) |
| 4 | `routes/members/` | 4 | 4 | Instituciones + memberships |
| 5 | `routes/mux/` | 5 | 5 | Video (Mux) |
| 6 | `routes/plans/` | 5 | 5 | Planes + AI tracking |
| 7 | `routes/search/` | 4 | 4 | Busqueda + trash |
| 8 | `routes/gamification/` | 6 | 6 | XP, badges, streaks, goals |
| 9 | `routes/settings/` | 2 | 2 | Algorithm config |
| 10 | `routes/whatsapp/` | 10 | **5 routes mounted** | WhatsApp bot (feature-flagged) |
| 11 | `routes/telegram/` | 10 | **7 routes mounted** | Telegram bot (feature-flagged) |

| # | Flat | Proposito |
|---|---|---|
| 1 | `routes-auth.ts` | Auth: POST /signup, GET/PUT /me |
| 2 | `routes-billing.ts` | Stripe: checkout, portal, webhooks, subscription-status |
| 3 | `routes-models.ts` | 3D models (5 CRUD + batch + upload) |
| 4 | `routes-storage.ts` | File upload/download/delete |
| 5 | `routes-student.ts` | 7 CRUD entities (flashcards, quizzes, quiz-questions, videos, kw-student-notes, text-annotations, video-notes) |
| 6 | `routes-study-queue.ts` | Study queue algorithm |

---

## CRUD Factory Entities (29 total)

**Content (9):** courses, semesters, sections, topics, summaries, chunks, summary-blocks, keywords, subtopics
**Study (3):** study-sessions, study-plans, study-plan-tasks
**Student (7):** flashcards, quizzes, quiz-questions, videos, kw-student-notes, text-annotations, video-notes
**Plans (4):** platform-plans, institution-plans, plan-access-rules, institution-subscriptions
**Models (5):** models-3d, model-3d-pins, model-3d-notes, model-layers, model-parts
**Highlight tags:** registered elsewhere (1)

---

## AI / RAG (14 active routes) — 20 POST/hr rate limit

| Ruta | Descripcion |
|---|---|
| POST `/ai/generate` | Generate flashcard/quiz |
| POST `/ai/generate-smart` | Adaptive NeedScore [8A] |
| POST `/ai/pre-generate` | Bulk (own rate limit) [8D] |
| POST `/ai/report` | Quality report [8B] |
| PATCH `/ai/report/:id` | Resolve [8B] |
| GET `/ai/report-stats` | Metrics [8C] |
| GET `/ai/reports` | Listing [8C] |
| POST `/ai/ingest-embeddings` | Batch embeddings (1536d) |
| POST `/ai/ingest-pdf` | PDF ingestion (Fase 7) |
| POST `/ai/re-chunk` | Manual re-chunking |
| POST `/ai/rag-chat` | RAG chat [Fase 6] |
| PATCH `/ai/rag-feedback` | Thumbs |
| GET `/ai/rag-analytics` | Metrics |
| GET `/ai/embedding-coverage` | Coverage % |

**REMOVED (PHASE-A2):** `list-models.ts`, `re-embed-all.ts` — files exist on disk but NOT mounted in router.

## Gamification (6 archivos, 13 endpoints)

| Ruta | Descripcion |
|---|---|
| GET `/gamification/profile` | XP, level, stats |
| GET `/gamification/xp-history` | Transaction log |
| GET `/gamification/leaderboard` | Weekly |
| GET `/gamification/badges` | All + earned |
| POST `/gamification/check-badges` | Evaluate |
| GET `/gamification/notifications` | Events |
| GET `/gamification/streak-status` | Streak info |
| POST `/gamification/daily-check-in` | Login XP |
| POST `/gamification/streak-freeze/buy` | Freeze |
| POST `/gamification/streak-repair` | Repair |
| PUT `/gamification/daily-goal` | Set goal |
| POST `/gamification/goals/complete` | Complete |
| POST `/gamification/onboarding` | Init |

## WhatsApp (feature-flagged: WHATSAPP_ENABLED=true)

> **Note:** Module has 10 files on disk but only 5 routes are mounted in the router (shown below). Remaining files are helpers, types, and queue internals.

| Ruta | Descripcion |
|---|---|
| GET `/webhooks/whatsapp` | Meta verification |
| POST `/webhooks/whatsapp` | Incoming messages |
| POST `/whatsapp/link-code` | Generate linking code |
| POST `/whatsapp/unlink` | Unlink phone |
| POST `/whatsapp/process-queue` | Job processor (service_role only) |

### WhatsApp Job Processor (`async-queue.ts`)

Background job processor for slow tool operations (called by `pg_cron` every minute):

| Property | Value |
|---|---|
| **Job types** | `generate_content` (~10s), `generate_weekly_report` (~15s) |
| **Storage** | `whatsapp_jobs` table (fallback for pgmq) |
| **Retry policy** | 3 attempts (`MAX_ATTEMPTS = 3`) |
| **Error handling** | Errors logged; after max retries, job status set to `failed` with truncated error message (500 chars) |
| **Cleanup** | 7-day retention; completed/failed jobs purged by scheduled task |
| **Security** | Phone numbers AES-GCM encrypted in job payload (C1 FIX: AUDIT-05 PII protection) |
| **Auth** | `service_role_key` required (timing-safe comparison) |

## Telegram (feature-flagged: TELEGRAM_ENABLED=true)

> **Note:** Module has 10 files on disk but only 7 routes are mounted in the router (shown below). Remaining files are helpers, formatters, tools, and queue internals. The Telegram bot uses Claude AI with 11 tools (extends WhatsApp's 9 shared tools with `update_agenda`, `get_keywords`, and `get_summary`; WhatsApp has `handle_voice_message` which Telegram does not).

| Ruta | Descripcion |
|---|---|
| POST `/webhooks/telegram` | Incoming updates (verified by secret token) |
| POST `/telegram/link-code` | Generate 6-digit linking code |
| POST `/telegram/unlink` | Unlink Telegram account |
| GET `/telegram/link-status` | Check linking status (polling) |
| POST `/telegram/setup-webhook` | Set Telegram webhook URL (service_role only) |
| POST `/telegram/delete-webhook` | Remove webhook (service_role only) |
| POST `/telegram/process-queue` | Async job processor (service_role only) |

### Slash Commands

| Command | Description |
|---|---|
| `/start` | Show welcome message and linking instructions |
| `/help` / `/ayuda` | List all available commands |
| `/agenda` | Show today's schedule and pending tasks |
| `/semana` | Show this week's schedule |
| `/estudiar` | Start a flashcard review session |
| `/progreso` | Show study progress and mastery levels |
| `/cursos` | Browse enrolled courses |
| `/salir` | Exit active flashcard review session |

### Telegram Bot Tools (11 total)

| Tool | Description | Shared with WhatsApp |
|---|---|---|
| `get_study_queue` | Flashcards pending review, ordered by FSRS+BKT urgency | Yes |
| `ask_academic_question` | RAG-powered academic Q&A over course content | Yes |
| `check_progress` | Mastery per topic, weak areas, overall percentage | Yes |
| `get_schedule` | Agenda: pending tasks, deadlines, planned sessions | Yes |
| `submit_review` | Record flashcard rating (1=Fail, 3=Good, 4=Easy) | Yes |
| `browse_content` | Navigate course tree: courses, sections, topics | Yes |
| `generate_content` | Generate flashcards or quiz (async, ~10s) | Yes |
| `generate_weekly_report` | Weekly study analytics report (async, ~15s) | Yes |
| `update_agenda` | Complete, create, or reschedule tasks | No (Telegram only) |
| `get_keywords` | Keywords with definitions and connections for a topic | No (Telegram only) |
| `get_summary` | Retrieve or search summaries by title or ID | No (Telegram only) |

## Settings

| Ruta | Descripcion |
|---|---|
| GET `/algorithm-config?institution_id=` | Read config (fallback: global → hardcoded) |
| PUT `/algorithm-config?institution_id=` | Upsert (admin/owner, validates weight sum=1.0) |

## Auth

| Ruta | Descripcion |
|---|---|
| POST `/signup` | Register (admin client) |
| GET `/me` | Profile (auto-creates if missing) |
| PUT `/me` | Update (full_name, avatar_url) |

## Billing (Stripe)

| Ruta | Descripcion |
|---|---|
| POST `/billing/checkout-session` | Create checkout |
| POST `/billing/portal-session` | Customer portal |
| GET `/billing/subscription-status` | Current subscription |
| POST `/webhooks/stripe` | Webhook (HMAC + idempotent) |

## Respuestas

| Tipo | Formato |
|---|---|
| Lista | `{ "data": { "items": [...], "total", "limit", "offset" } }` |
| Item | `{ "data": { ... } }` |
| Custom | `{ "data": [...] }` |
| Error | `{ "error": "mensaje" }` |
