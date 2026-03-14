# 01 — Architecture

> Paste this in every Figma Make session for base context.
> **Updated:** 2026-03-14 (audit pass 9 — final cleanup)

## Stack

| Layer | Tech | Repo / Location |
|---|---|---|
| Frontend | React 18, Vite 6, Tailwind CSS 4, React Query v5, shadcn/ui, Lucide | `Matraca130/numero1_sseki_2325_55` (Vercel) |
| Backend | Hono (Supabase Edge Functions), Deno runtime | `Matraca130/axon-backend` (Supabase EF via GitHub Actions) |
| Database | PostgreSQL + pgvector (1536d) | Supabase `xdnciktarvxyhkrokbng` |
| Auth | Supabase Auth + custom JWT | Double-token system |
| AI (text) | Gemini 2.5 Flash | Text generation + Re-ranking + PDF extraction |
| AI (embed) | OpenAI **text-embedding-3-large** (1536d Matryoshka) | Embeddings |
| Video | Mux | Upload + signed playback |
| Billing | Stripe | Checkout + portal + webhooks |

## Request Flow

```
Browser
  → Frontend (Vercel)
    → Backend (Hono on Supabase Edge Functions)
      → Supabase PostgreSQL
      → Gemini API (text generation, re-ranking, PDF extraction)
      → OpenAI API (embeddings)
      → Mux API (Video)
      → Stripe API (Billing)
```

The frontend NEVER talks to Supabase DB directly. All data goes through the Hono backend.
Auth (login/signup) uses Supabase Auth SDK directly from frontend.

## Backend Architecture

- **Route style:** Flat routes with query params (NOT nested REST)
- **CRUD Factory:** `crud-factory.ts` auto-generates 5 endpoints per entity
- **Route modules:** **10 split modules** + 6 flat files, ~200+ total endpoints
- **Split modules:** ai, content, gamification, members, mux, plans, search, settings, study, whatsapp
- **Tests:** **16 Deno-native test files** (~183+ test cases)
- **Migrations:** **53** SQL files

## Security Note

> **CORS is currently wildcard `"*"`** (reverted for MVP development).
> See BUG-004 in KNOWN-BUGS.md. Must be restricted before production.

## Deploy

- Frontend: Push to main → Vercel auto-deploys
- Backend: Push to main → GitHub Actions → Supabase Edge Functions
- Docs: Push to main → nothing (no CI/CD)
