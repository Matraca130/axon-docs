# Axon v4.5 - Platform Context

> **Proposito:** Pega este archivo al inicio de cada sesion de Figma Make para dar contexto completo.
>
> **Ultima actualizacion:** 2026-03-14 (audit pass 7 — all blind spots verified)

---

## 1. Arquitectura General

```
Frontend (React 18 + Vite + Tailwind v4) → Vercel
  └─ apiCall() en lib/api.ts → Backend (Hono/Deno) → Supabase Edge Functions
       └─ PostgreSQL + pgvector | Gemini API | OpenAI API | Mux | Stripe
```

## 2. Autenticacion (Doble Token)

```
Authorization: Bearer <SUPABASE_ANON_KEY>   ← Proyecto
X-Access-Token: <USER_JWT>                  ← Usuario
```

JWT decodificado localmente. Verificacion criptografica via PostgREST en primera DB query.
Rol NO esta en JWT — viene de `GET /institutions`.

> **⚠️ CORS sigue siendo wildcard `"*"`** (revertido para MVP). Ver BUG-004.

## 3. Roles: owner(4), admin(3), professor(2), student(1)

Sets: `ALL_ROLES`, `MANAGEMENT_ROLES`, `CONTENT_WRITE_ROLES`

## 4. Jerarquia: Institution → Course → Semester → Section → Topic → Summary

Summary tiene: Chunks (1536d embeddings), Keywords (Flashcards, Quiz Questions, Connections, Subtopics, Prof Notes), Videos (Mux), Student Data.
Campos PDF: `pdf_source_url`, `pdf_page_start`, `pdf_page_end`.

## 5. Backend

### Rutas: planas con query params, ~200+ endpoints

**10 modulos split + 6 flat:**

| Modulo | Archivos | Montados | Proposito |
|---|---|---|---|
| `routes/content/` | 11 | 11 | Content CRUD, connections, search, reorder, tree, batch |
| `routes/study/` | 6 | 6 | Sessions, reviews, progress, spaced-rep, batch-review |
| `routes/ai/` | **14** | **11** | Generate, smart-gen, PDF ingest, RAG chat, reports. **2 dead:** list-models, re-embed-all |
| `routes/members/` | 4 | 4 | Institutions, memberships, admin-scopes |
| `routes/mux/` | 5 | 5 | Video upload, playback, tracking, webhook |
| `routes/plans/` | 5 | 5 | Plans, AI generations, diagnostics, access |
| `routes/search/` | 4 | 4 | Global search, trash, restore |
| `routes/gamification/` | 6 | 6 | XP, badges, streaks, goals, leaderboard |
| `routes/settings/` | 2 | 2 | Algorithm config (FSRS/BKT params) |
| `routes/whatsapp/` | **10** | ~6 routes | **COMPLETE:** webhook, handler, gemini-tools, review-flow, link, client, rate-limit, formatter, async-queue, index |

| Flat | Proposito |
|---|---|
| `routes-auth.ts` | Auth (`/signup`, `/me`) |
| `routes-billing.ts` | Stripe |
| `routes-models.ts` | 3D models (5 CRUD + batch + upload) |
| `routes-storage.ts` | File storage |
| `routes-student.ts` | 7 CRUD entities (flashcards, quizzes, quiz-questions, videos, kw-student-notes, text-annotations, video-notes) |
| `routes-study-queue.ts` | Study queue algorithm |

### Key Infrastructure Files

`db.ts`, `crud-factory.ts`, `validate.ts`, `auth-helpers.ts`, `gemini.ts` (text gen + PDF extract), `openai-embeddings.ts` (1536d), `retrieval-strategies.ts`, `chunker.ts`, `semantic-chunker.ts`, `auto-ingest.ts`, `summary-hook.ts`, `xp-engine.ts`, `xp-hooks.ts`, `streak-engine.ts`, `ai-normalizers.ts`, `rate-limit.ts`, `timing-safe.ts`, `lib/bkt-v4.ts`, `lib/fsrs-v4.ts`, `lib/types.ts`

### Tests: **16 files** (auth-helpers, bkt-v4, check-in-decision, fase3, fsrs-v4, gamification-helpers, integration, rate-limit, retrieval-strategies, semantic-chunker, streak-engine, summary-hook, timing-safe, validate, xp-engine, xp-hooks)

## 6. Gamificacion

13 endpoints, 8 hooks (11 XP actions), 39 badges, daily cap 500 XP, 4 bonus types.
MVP constants: FREEZE_COST=100 (contract: 200), MAX_FREEZES=3 (contract: 2), REPAIR_COST=200 (contract: 400).

## 7. Embeddings (¡VERIFICADO!)

> **Modelo:** OpenAI `text-embedding-3-large` (1536d via Matryoshka)
> **Generacion:** Gemini 2.5 Flash
> **gemini.ts** `generateEmbedding()` = HARD ERROR (throws, prevents dimension mismatch)

## 8. DB: 50+ tables, 53 migrations, pgvector 1536d, pg_trgm, pg_cron

## 9. Seguridad

| Issue | Estado |
|---|---|
| **CORS wildcard** | **NOT FIXED** — revertido a `"*"` |
| RLS | Parcialmente mitigado (RPCs revoked) |
| JWT | Mitigado por PostgREST |

## 10. Frontend (verified pass 7)

- **28 service files** + 4 subdirs (`__tests__`, `ai-service`, `platform-api`, `student-api`)
- **33 hook files** + 1 subdir (`queries`), including:
  - `useGamification.ts`, `usePdfIngest.ts`, `useAiReports.ts`, `useSmartGeneration.ts`
  - `useSessionXP.ts`, `useAdminAiTools.ts`, `useAdaptiveSession.ts`
  - `useFlashcardEngine.ts`, `useStudyPlans.ts`, `useStudyQueueData.ts`
- **21 component dirs** (ai, auth, content, dashboard, design-kit, figma, gamification, layout, professor, roles, schedule, shared, student-panel, student, summary, tiptap, ui, video, viewer3d, welcome) + 2 root files
- **11 type files**, **10 route files**, **9 context files**, **10 util files**
- React Router v7 data mode, React Query v5, shadcn/ui
- **Axon Medical Academy palette** (teal/gray)

## 11. Tech Stack

**Frontend:** React 18, TypeScript, Vite 6, Tailwind v4, React Router v7, React Query v5, shadcn/ui, Lucide, Motion, TipTap, Three.js, Mux Player, @floating-ui/react, Sonner. Vercel.

**Backend:** Hono + Deno, PostgreSQL + pgvector, Gemini 2.5 Flash + OpenAI text-embedding-3-large (1536d), Stripe, Mux, WhatsApp Cloud API. GitHub Actions CI/CD.
