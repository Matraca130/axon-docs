# Axon v4.5 - API Route Map

> Mapa completo de rutas. **Ultima actualizacion:** 2026-03-14 (audit pass 4 — verified file-by-file)

---

## Patrones

```
Base: https://xdnciktarvxyhkrokbng.supabase.co/functions/v1/server
Headers: Authorization (anon key), X-Access-Token (JWT), Content-Type: application/json
Rutas planas: GET /topics?section_id=xxx (NUNCA anidadas)
```

---

## Modulos (10 split + 6 flat)

| # | Modulo | Archivos | Tipo |
|---|---|---|---|
| 1 | `routes/content/` | **11** | CRUD + connections, search, reorder, tree, batch |
| 2 | `routes/study/` | 6 | Sessions, reviews, progress, spaced-rep, batch |
| 3 | `routes/ai/` | **14** | AI/RAG + PDF ingest + re-embed |
| 4 | `routes/members/` | 4 | Instituciones + memberships |
| 5 | `routes/mux/` | 5 | Video (Mux) |
| 6 | `routes/plans/` | 5 | Planes + AI tracking |
| 7 | `routes/search/` | 4 | Busqueda + trash |
| 8 | `routes/gamification/` | 6 | XP, badges, streaks, goals |
| 9 | `routes/settings/` | 2 | Algorithm config |
| 10 | `routes/whatsapp/` | **9** | WhatsApp bot (complete module) |

| # | Flat | Proposito |
|---|---|---|
| 1 | `routes-auth.ts` | Auth (`/signup`, `/me`) |
| 2 | `routes-billing.ts` | Stripe |
| 3 | `routes-models.ts` | 3D models (5 CRUD + batch + upload) |
| 4 | `routes-storage.ts` | File upload/download |
| 5 | `routes-student.ts` | Student instruments |
| 6 | `routes-study-queue.ts` | Study queue |

---

## CRUD Factory Entities (27 total)

**Content (9):** courses, semesters, sections, topics, summaries, chunks, summary-blocks, keywords, subtopics
**Study (3):** study-sessions, study-plans, study-plan-tasks
**Student (6):** flashcards, quiz-questions, videos, student-notes, student-annotations, highlight-tags
**Plans (4):** platform-plans, institution-plans, plan-access-rules, institution-subscriptions
**Models (5):** models-3d, model-3d-pins, model-3d-notes, model-layers, model-parts

---

## Content (11 archivos)

| Ruta | Descripcion |
|---|---|
| GET `/keyword-connections?keyword_id=` | Bidireccional |
| GET/POST/DELETE `/keyword-connections` | CRUD |
| GET `/keyword-connections-batch?keyword_ids=` | Batch max 50 |
| GET `/keyword-search?q=` | Cross-summary search |
| GET/POST/DELETE `/kw-prof-notes` | Professor notes |
| PUT `/reorder` | Bulk RPC |
| GET `/content-tree?institution_id=` | Nested tree |
| GET `/flashcards-by-topic?topic_id=` | Batch |
| GET `/subtopics-batch?keyword_ids=` | Batch subtopics |
| GET `/flashcard-mappings?keyword_id=` | Flashcard→keyword mappings |

## AI / RAG (14 archivos) — 20 POST/hr rate limit

| Ruta | Descripcion |
|---|---|
| POST `/ai/generate` | Generate flashcard/quiz |
| POST `/ai/generate-smart` | Adaptive NeedScore [8A] |
| POST `/ai/pre-generate` | Bulk [8D] |
| POST `/ai/report` | Quality report [8B] |
| PATCH `/ai/report/:id` | Resolve [8B] |
| GET `/ai/report-stats` | Metrics [8C] |
| GET `/ai/reports` | Listing [8C] |
| POST `/ai/ingest-embeddings` | Batch embeddings (1536d) |
| POST `/ai/ingest-pdf` | **PDF ingestion (Fase 7)** |
| POST `/ai/re-chunk` | Manual re-chunking |
| POST `/ai/re-embed-all` | **Re-embed all chunks** |
| POST `/ai/rag-chat` | RAG chat [Fase 6] |
| PATCH `/ai/rag-feedback` | Thumbs |
| GET `/ai/rag-analytics` | Metrics |
| GET `/ai/embedding-coverage` | Coverage % |
| GET `/ai/list-models` | Diagnostic |

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

## WhatsApp (9 archivos) — COMPLETE MODULE

| Archivo | Proposito |
|---|---|
| `index.ts` | Route combiner |
| `webhook.ts` | WhatsApp webhook receiver |
| `handler.ts` | Message processing |
| `tools.ts` | Gemini tool-calling integration |
| `review-flow.ts` | Flashcard review via WhatsApp |
| `link.ts` | Account linking (WhatsApp→Axon) |
| `wa-client.ts` | WhatsApp Cloud API client |
| `wa-rate-limit.ts` | Per-user rate limiting |
| `formatter.ts` | Message formatting |
| `async-queue.ts` | Background job processing |

## Settings (2 archivos)

| Ruta | Descripcion |
|---|---|
| GET/PUT `/settings/algorithm-config` | FSRS/BKT algorithm parameters |

## Models 3D (5 CRUD + 2 custom)

| Ruta | Descripcion |
|---|---|
| CRUD | models-3d, model-3d-pins, model-3d-notes, model-layers, model-parts |
| GET `/models-3d/batch?topic_ids=` | Batch fetch (max 200) |
| POST `/upload-model-3d` | Multipart .glb/.gltf upload |

## Respuestas

| Tipo | Formato |
|---|---|
| Lista | `{ "data": { "items": [...], "total", "limit", "offset" } }` |
| Item | `{ "data": { ... } }` |
| Custom | `{ "data": [...] }` |
| Error | `{ "error": "mensaje" }` |
