# Axon v4.5 - API Route Map

> Mapa completo de rutas. **Última actualización:** 2026-03-17 (audit pass 17 — verified 122 files, 62 migrations)

---

## Patrones

```
Base: https://xdnciktarvxyhkrokbng.supabase.co/functions/v1/server
Headers: Authorization (anon key), X-Access-Token (JWT), Content-Type: application/json
Rutas planas: GET /topics?section_id=xxx (NUNCA anidadas)
```

---

## Modulos (11 split + 6 flat = 122 TypeScript files total)

| # | Modulo | Archivos | Lineas | Tipo |
|---|---|---|---|---|
| 1 | `routes/ai/` | 15 (12 montados) | 4,175 | AI/RAG + PDF ingest + realtime-session (2 dead: list-models, re-embed-all) |
| 2 | `routes/content/` | 11 | 1,791 | CRUD + connections, search, reorder, tree, batch |
| 3 | `routes/telegram/` | 9 | 2,816 | Claude-powered chatbot, 11 tools, inline flashcards |
| 4 | `routes/whatsapp/` | 10 | 3,068 | Claude-powered chatbot, async job processor |
| 5 | `routes/gamification/` | 6 | 1,460 | XP, badges, streaks, goals |
| 6 | `routes/study/` | 6 | 1,668 | Sessions, reviews, progress, spaced-rep, batch |
| 7 | `routes/plans/` | 5 | 304 | Planes + AI tracking |
| 8 | `routes/mux/` | 5 | 550 | Video (Mux) |
| 9 | `routes/members/` | 4 | 609 | Instituciones + memberships |
| 10 | `routes/search/` | 4 | 331 | Busqueda + trash |
| 11 | `routes/settings/` | 3 | 538 | Algorithm config + messaging admin |

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

## AI / RAG (12 active routes) — 20 POST/hr rate limit

> **AI Provider:** Claude (Anthropic) for all text generation. Gemini only for PDF extraction + voice transcription.
> **Claude models:** opus-4 (complex), sonnet-4 (default), haiku-4.5 (simple)

| Ruta | Descripcion |
|---|---|
| POST `/ai/generate` | Generate flashcard/quiz (Claude) |
| POST `/ai/generate-smart` | Adaptive NeedScore [8A] (Claude) |
| POST `/ai/pre-generate` | Bulk (own rate limit) [8D] (Claude) |
| POST `/ai/report` | Quality report [8B] (Claude) |
| PATCH `/ai/report/:id` | Resolve [8B] |
| GET `/ai/report-stats` | Metrics [8C] |
| GET `/ai/reports` | Listing [8C] |
| POST `/ai/ingest-embeddings` | Batch embeddings (OpenAI 1536d) |
| POST `/ai/ingest-pdf` | PDF ingestion (Gemini multimodal) |
| POST `/ai/re-chunk` | Manual re-chunking |
| POST `/ai/rag-chat` | RAG chat [Fase 6] (Claude + retrieval-strategies) |
| PATCH `/ai/rag-feedback` | Thumbs |
| GET `/ai/rag-analytics` | Metrics |
| GET `/ai/embedding-coverage` | Coverage % |
| **POST `/ai/realtime-session`** | **Ephemeral OpenAI Realtime API token for voice calls** |

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

## Telegram (9 files, 2,816 lines — feature-flagged: TELEGRAM_ENABLED=true)

| Ruta | Descripcion |
|---|---|
| POST `/webhooks/telegram` | Incoming messages → Claude agentic loop (no auth, secret token verified) |
| POST `/telegram/link-code` | Generate 6-digit link code (JWT auth) |
| POST `/telegram/unlink` | Remove link (JWT auth) |
| POST `/telegram/setup-webhook` | Admin: set webhook URL (service_role auth) |
| POST `/telegram/delete-webhook` | Admin: remove webhook (service_role auth) |

**Architecture:** Claude tool_use loop (5 iterations max), 11 tools, inline flashcard review.
**Slash commands:** `/agenda`, `/estudiar`, `/progreso`, `/cursos`, `/help`.
**Voice:** Gemini multimodal transcription.
**DB:** `telegram_links`, `telegram_sessions`, `telegram_message_log`, `messaging_admin_settings`. RLS on links + admin settings.

## WhatsApp (10 files, 3,068 lines — feature-flagged: WHATSAPP_ENABLED=true)

| Ruta | Descripcion |
|---|---|
| GET `/webhooks/whatsapp` | Meta verification |
| POST `/webhooks/whatsapp` | Incoming messages → Claude agentic loop |
| POST `/whatsapp/link-code` | Generate linking code |
| POST `/whatsapp/unlink` | Unlink phone |
| POST `/whatsapp/process-queue` | Job processor (service_role only, pg_cron every minute) |

**Architecture:** Claude tool_use loop (5 iterations max), 11 shared tools, async job queue.
**DB:** `whatsapp_links` (SHA-256 phone hash), `whatsapp_sessions` (optimistic locking), `whatsapp_message_log`, `whatsapp_jobs`.
**Cron:** Job processor every minute (pg_cron + pg_net), 7-day retention cleanup daily at 04:00 UTC.

## Settings (3 files)

| Ruta | Descripcion |
|---|---|
| GET `/algorithm-config?institution_id=` | Read config (fallback: global → hardcoded) |
| PUT `/algorithm-config?institution_id=` | Upsert (admin/owner, validates weight sum=1.0) |
| GET `/settings/messaging/:channel` | Read messaging config (admin/owner) |
| PUT `/settings/messaging/:channel` | Update messaging config (tokens masked) |
| POST `/settings/messaging/:channel/test` | Test channel connectivity |

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
