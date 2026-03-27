# Axon v4.5 — Platform Documentation

Central documentation for the Axon educational platform.
Designed to be copy-pasted into Figma Make sessions as context.

> **File size rule:** Every file stays under 10KB (~300 lines) so Figma Make can read it fully.

## Quick Start (Figma Make)

1. Open the file(s) relevant to your task
2. Copy the raw markdown
3. Paste into Figma Make as context

## Repos

| Repo | Purpose | Deploy | Status |
|---|---|---|---|
| `Matraca130/numero1_sseki_2325_55` | Frontend (React 18/Vite/TW4) | Vercel | v4.5 |
| `Matraca130/axon-backend` | Backend (Hono/Deno) | Supabase Edge Functions | v4.5 |
| `Matraca130/axon-docs` | Documentation (this repo) | None | Updated 2026-03-14 |

## Supabase

- Project ID: `xdnciktarvxyhkrokbng`
- ~50+ tables (+ ~25 `kv_store_*` junk)
- **52+ SQL migrations**
- Embeddings: **1536d** (OpenAI **text-embedding-3-large**, Matryoshka truncation)

## What Changed (2026-03-10–14)

### Backend
- **Gamification system** complete: XP engine, 8 hooks (11 actions), 39 badges, streaks, goals
- **Embedding migration**: Gemini 768d → OpenAI text-embedding-3-large 1536d
- **WhatsApp integration**: Tables + cron + route module (in development)
- **PDF extraction**: `extractTextFromPdf()` in gemini.ts (Fase 7)
- **RAG security hardening**: Revoked RPC access from authenticated role
- **Settings module**: New `routes/settings/` directory
- **Batch endpoints**: keyword-connections-batch, flashcards-by-topic, review-batch, topic-progress
- **11 split route modules** + 6 flat files, **16 test files** (~183+ cases)
- CORS: **Still wildcard `"*"`** (reverted for MVP, must restrict before launch)

### Frontend
- **Layout v2**: All roles on responsive RoleShell + MobileDrawer
- **Auth consolidation**: Single `createContext()`, dual-context bug resolved
- **lazyRetry**: Stale chunk error recovery for 22 lazy routes
- **Gamification UI**: 8 React Query hooks + 7 components connected
- **Axon Medical Academy palette**: teal/gray theme migration
- Dead code cleanup: old layouts, auth bridge deleted
