# 01 — Architecture

> Paste this in every Figma Make session for base context.
> **Updated:** 2026-03-14

## Stack

| Layer | Tech | Repo / Location |
|---|---|---|
| Frontend | React 18, Vite 6, Tailwind CSS 4, React Query v5, shadcn/ui, Lucide | `Matraca130/numero1_sseki_2325_55` (Vercel) |
| Backend | Hono (Supabase Edge Functions), Deno runtime | `Matraca130/axon-backend` (Supabase Edge Functions via GitHub Actions) |
| Database | PostgreSQL + pgvector | Supabase `xdnciktarvxyhkrokbng` |
| Auth | Supabase Auth + custom JWT | Double-token system |
| AI | Gemini 2.5 Flash + gemini-embedding-001 (768d) | RAG pipeline (Fase 1-8) |
| Video | Mux | Upload + signed playback |
| Billing | Stripe | Checkout + portal + webhooks |

## Request Flow

```
Browser
  → Frontend (Vercel)
    → Backend (Hono on Supabase Edge Functions)
      → Supabase PostgreSQL
      → Gemini API (AI/RAG)
      → Mux API (Video)
      → Stripe API (Billing)
```

The frontend NEVER talks to Supabase DB directly. All data goes through the Hono backend.
Auth (login/signup) uses Supabase Auth SDK directly from frontend.

## Backend Architecture

- **Route style:** Flat routes with query params (NOT nested REST)
  - Correct: `GET /topics?section_id=xxx`
  - Wrong: `GET /sections/xxx/topics`
- **CRUD Factory:** `crud-factory.ts` auto-generates 5 endpoints per entity
- **Route modules:** 8 split modules + 6 flat files, ~200+ total endpoints
- **Key modules:** content, study, ai, members, mux, plans, search, gamification
- **Infrastructure:** `db.ts` (auth), `validate.ts`, `gemini.ts`, `auth-helpers.ts`, `rate-limit.ts`, `retrieval-strategies.ts`
- **Tests:** 7 Deno-native test files (auth, validation, rate-limit, RAG, chunking)

## Deploy

- Frontend: Push to main → Vercel auto-deploys
- Backend: Push to main → GitHub Actions → Supabase Edge Functions
- Docs (this repo): Push to main → nothing happens (no CI/CD)

## Production URLs

```
Frontend: https://numero1-sseki-2325-55.vercel.app (or custom domain)
Backend:  https://xdnciktarvxyhkrokbng.supabase.co/functions/v1/server
```
