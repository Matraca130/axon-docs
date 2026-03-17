# 01 — Architecture

> Paste this in every Figma Make session for base context.
> **Updated:** 2026-03-17 (audit pass 17 — full recount: 122 backend files, 586 frontend files, 62 migrations)

## Stack

| Layer | Tech | Repo / Location |
|---|---|---|
| Frontend | React 18, Vite 6, Tailwind CSS 4, React Query v5, shadcn/ui, Lucide | `Matraca130/numero1_sseki_2325_55` (Vercel) |
| Backend | Hono (Supabase Edge Functions), Deno runtime | `Matraca130/axon-backend` (Supabase EF via GitHub Actions) |
| Database | PostgreSQL + pgvector (1536d) | Supabase `xdnciktarvxyhkrokbng` |
| Auth | Supabase Auth + custom JWT | Double-token system |
| AI (text) | **Claude** (Anthropic) | Text generation + Re-ranking (migrated from Gemini) |
| AI (embed) | OpenAI **text-embedding-3-large** (1536d Matryoshka) | Embeddings |
| AI (voice) | OpenAI **Realtime API** | Voice calls (WebSocket, gpt-4o-realtime) |
| AI (PDF) | Gemini 2.5 Flash | PDF text extraction (multimodal) |
| Messaging | **Telegram Bot** + WhatsApp Cloud API | Claude-powered chatbot + notifications |
| Video | Mux | Upload + signed playback |
| Billing | Stripe | Checkout + portal + webhooks |

## Request Flow

```
Browser
  → Frontend (Vercel)
    → Backend (Hono on Supabase Edge Functions)
      → Supabase PostgreSQL
      → Claude API (text generation, re-ranking)
      → Gemini API (PDF extraction)
      → OpenAI API (embeddings + Realtime voice)
      → Telegram Bot API (Claude-powered chatbot)
      → Mux API (Video)
      → Stripe API (Billing)
```

The frontend NEVER talks to Supabase DB directly. All data goes through the Hono backend.
Auth (login/signup) uses Supabase Auth SDK directly from frontend.

## Backend Architecture

- **Route style:** Flat routes with query params (NOT nested REST)
- **CRUD Factory:** `crud-factory.ts` auto-generates 5 endpoints per entity
- **Route modules:** **11 split dirs** + 6 flat files = **122 TypeScript files**, ~200+ total endpoints
- **Split modules:** ai (15), content (11), telegram (9), whatsapp (10), gamification (6), study (6), plans (5), mux (5), members (4), search (4), settings (3)
- **Core:** claude-ai.ts (9KB), gemini.ts (PDF only), openai-embeddings.ts, retrieval-strategies.ts (14KB), crud-factory (20KB), auth-helpers (12KB)
- **Tests:** **16 Deno-native test files** (~183+ test cases)
- **Migrations:** **62** SQL files

## Security Note

> **CORS is now restricted to a whitelist of allowed origins** (BUG-004 FIXED).
> See BUG-004 in KNOWN-BUGS.md.

## Deploy

- Frontend: Push to main → Vercel auto-deploys
- Backend: Push to main → GitHub Actions → Supabase Edge Functions
- Docs: Push to main → nothing (no CI/CD)
