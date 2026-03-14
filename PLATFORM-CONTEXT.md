# Axon v4.5 - Platform Context

> **Proposito:** Pega este archivo al inicio de cada sesion de Figma Make para dar contexto completo.
>
> **Ultima actualizacion:** 2026-03-14 (audit pass 4 — verified file-by-file)

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

| Modulo | Archivos | Proposito |
|---|---|---|
| `routes/content/` | **11** | Content CRUD, connections, search, reorder, tree, batch |
| `routes/study/` | 6 | Sessions, reviews, progress, spaced-rep, batch-review |
| `routes/ai/` | **14** | Generate, smart-gen, PDF ingest, re-embed, RAG chat, reports |
| `routes/members/` | 4 | Institutions, memberships, admin-scopes |
| `routes/mux/` | 5 | Video upload, playback, tracking, webhook |
| `routes/plans/` | 5 | Plans, AI generations, diagnostics, access |
| `routes/search/` | 4 | Global search, trash, restore |
| `routes/gamification/` | 6 | XP, badges, streaks, goals, leaderboard |
| `routes/settings/` | 2 | Algorithm config (FSRS/BKT params) |
| `routes/whatsapp/` | **9** | **COMPLETE:** webhook, handler, tools, review-flow, link, client, rate-limit, formatter, async-queue |

| Flat | Proposito |
|---|---|
| `routes-auth.ts` | Auth (`/signup`, `/me`) |
| `routes-billing.ts` | Stripe |
| `routes-models.ts` | 3D models (5 CRUD + batch + upload) |
| `routes-storage.ts` | File storage |
| `routes-student.ts` | Student instruments |
| `routes-study-queue.ts` | Study queue algorithm |

### Key Infrastructure Files

`db.ts`, `crud-factory.ts`, `validate.ts`, `auth-helpers.ts`, `gemini.ts` (text gen + PDF extract), `openai-embeddings.ts` (1536d), `retrieval-strategies.ts`, `chunker.ts`, `semantic-chunker.ts`, `auto-ingest.ts`, `summary-hook.ts`, `xp-engine.ts`, `xp-hooks.ts`, `streak-engine.ts`, `ai-normalizers.ts`, `rate-limit.ts`, `timing-safe.ts`, `lib/bkt-v4.ts`, `lib/fsrs-v4.ts`, `lib/types.ts`

### Tests: **16 files**, ~183+ cases (unit + integration)

## 6. Gamificacion

13 endpoints, 8 hooks (11 XP actions), 39 badges, daily cap 500 XP, 4 bonus types.
Ver `GAMIFICATION_MAP.md` en backend.

## 7. Embeddings (¡VERIFICADO!)

> **Modelo:** OpenAI `text-embedding-3-large` (1536d via Matryoshka)
> **Generacion:** Gemini 2.5 Flash
> **gemini.ts** `generateEmbedding()` = HARD ERROR (throws, prevents dimension mismatch)

## 8. DB: 50+ tables, 52+ migrations, pgvector 1536d, pg_trgm, pg_cron

## 9. Seguridad

| Issue | Estado |
|---|---|
| **CORS wildcard** | **NOT FIXED** — revertido a `"*"` |
| RLS | Parcialmente mitigado (RPCs revoked) |
| JWT | Mitigado por PostgREST |

## 10. Frontend (verificado contra source)

- **30+ service files** en `src/app/services/` (gamification, AI, quiz, flashcard, content tree, etc.)
- **35+ hook files** en `src/app/hooks/` incluyendo:
  - `useGamification.ts` (8 React Query hooks)
  - `usePdfIngest.ts` (PDF ingestion connected)
  - `useAiReports.ts` (quality reports connected)
  - `useSmartGeneration.ts` (adaptive gen connected)
  - `useSessionXP.ts` (XP tracking in sessions)
  - `useAdminAiTools.ts` (admin AI tools)
- **4 role route files** + shared auth + `lazyRetry()`
- **Axon Medical Academy palette** (teal/gray)
- React Router v7 data mode, React Query v5, shadcn/ui

## 11. Tech Stack

**Frontend:** React 18, TypeScript, Vite 6, Tailwind v4, React Router v7, React Query v5, shadcn/ui, Lucide, Motion, TipTap, Three.js, Mux Player, @floating-ui/react, Sonner. Vercel.

**Backend:** Hono + Deno, PostgreSQL + pgvector, Gemini 2.5 Flash + OpenAI text-embedding-3-large (1536d), Stripe, Mux, WhatsApp Cloud API. GitHub Actions CI/CD.
