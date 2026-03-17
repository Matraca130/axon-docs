# Axon v4.5 - API Route Map

> Mapa completo de rutas. **Ultima actualizacion:** 2026-03-17 (audit pass 16 — voice, Telegram, Claude migration)

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
| 3 | `routes/ai/` | 15 en disco | **12 montados** | AI/RAG + PDF ingest + **realtime-session** (2 dead: list-models, re-embed-all) |
| 4 | `routes/members/` | 4 | 4 | Instituciones + memberships |
| 5 | `routes/mux/` | 5 | 5 | Video (Mux) |
| 6 | `routes/plans/` | 5 | 5 | Planes + AI tracking |
| 7 | `routes/search/` | 4 | 4 | Busqueda + trash |
| 8 | `routes/gamification/` | 6 | 6 | XP, badges, streaks, goals |
| 9 | `routes/settings/` | 2 | 2 | Algorithm config |
| 10 | `routes/telegram/` | NEW | NEW | **Telegram bot (Claude-powered chatbot)** |
| 11 | `routes/whatsapp/` | 10 | ~6 routes | WhatsApp bot (feature-flagged) |

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

## AI / RAG (11 active routes) — 20 POST/hr rate limit

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
| **POST `/ai/realtime-session`** | **Ephemeral OpenAI Realtime API token for voice calls** |

**REMOVED (PHASE-A2):** `list-models.ts`, `re-embed-all.ts` — files exist on disk but NOT mounted in router.

> **AI Model Migration (2026-03-17):** Text generation migrated from Gemini 2.5 Flash to **Claude** (Anthropic). Gemini retained only for PDF extraction. All chat, generate, report, and re-ranking endpoints now use Claude.

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

## Telegram (Claude-powered chatbot)

| Ruta | Descripcion |
|---|---|
| POST `/webhooks/telegram` | Incoming Telegram messages → Claude AI response |
| POST `/telegram/configure` | Admin: set bot token + webhook URL |
| GET `/telegram/status` | Bot connection status |

Admin UI: Messaging Integrations settings page (Telegram & WhatsApp).
DB: `telegram_bot_configs`, `telegram_conversations` tables with RLS policies + indexes.

## WhatsApp (feature-flagged: WHATSAPP_ENABLED=true)

| Ruta | Descripcion |
|---|---|
| GET `/webhooks/whatsapp` | Meta verification |
| POST `/webhooks/whatsapp` | Incoming messages |
| POST `/whatsapp/link-code` | Generate linking code |
| POST `/whatsapp/unlink` | Unlink phone |
| POST `/whatsapp/process-queue` | Job processor (service_role only) |

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
