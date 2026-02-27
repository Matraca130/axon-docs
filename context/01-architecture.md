# 01 — Architecture

> Paste this in every Figma Make session for base context.

## Stack

| Layer | Tech | Repo / Location |
|---|---|---|
| Frontend | React 18, Vite, Tailwind CSS 4, Radix UI, Lucide | `Matraca130/numero1_sseki_2325_55` (Vercel) |
| Backend | Hono (Edge Functions), Deno runtime | `Matraca130/axon-backend` (Deno Deploy) |
| Database | PostgreSQL | Supabase `xdnciktarvxyhkrokbng` |
| Auth | Supabase Auth + custom JWT | Double-token system |

## Request Flow

```
Browser
  → Frontend (Vercel)
    → Backend (Hono on Deno Deploy)
      → Supabase PostgreSQL
```

The frontend NEVER talks to Supabase directly. All data goes through the Hono backend.

## Backend Architecture

- **Route style:** Flat routes with query params (NOT nested REST)
  - ✅ `GET /topics?section_id=xxx`
  - ❌ `GET /sections/xxx/topics`
- **CRUD Factory:** `crud-factory.ts` auto-generates 5 endpoints per entity (list, get, create, update, delete)
- **Route modules:** ~12 files, generating ~176 total endpoints
- **Custom routes:** Study queue, content tree, search, reorder, webhooks

## Deploy

- Frontend: Push to main → Vercel auto-deploys
- Backend: Push to main → GitHub Actions → Deno Deploy
- Docs (this repo): Push to main → nothing happens (no CI/CD)
