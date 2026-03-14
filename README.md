# Axon v4.5 — Platform Documentation

Central documentation for the Axon educational platform.
Designed to be copy-pasted into Figma Make sessions as context.

> **File size rule:** Every file stays under 10KB (~300 lines) so Figma Make can read it fully (limit: 30KB).

## Quick Start (Figma Make)

1. Open the file(s) relevant to your task
2. Copy the raw markdown
3. Paste into Figma Make as context
4. Start coding with full platform awareness

## Structure

```
axon-docs/
├── context/              ← Paste these in EVERY Figma Make session
│   ├── 01-architecture.md
│   ├── 02-data-hierarchy.md
│   ├── 03-auth-and-roles.md
│   ├── 04-api-conventions.md
│   ├── 05-current-status.md
│   └── RAG_PHASES.md
│
├── database/             ← Schema split by domain
├── api/                  ← Routes split by module
├── bugs/                 ← Bug tracking + security audit
├── frontend/             ← Frontend-specific docs
├── practices/            ← Multi-agent coordination
├── contracts/            ← Interface contracts
├── diagnostics/          ← Debug & audit tools
│
├── PLATFORM-CONTEXT.md   ← Single-file context (paste into every session)
├── API-MAP.md            ← Complete endpoint reference
└── KNOWN-BUGS.md         ← Bug tracker with severity levels
```

## Repos

| Repo | Purpose | Deploy | Status |
|---|---|---|---|
| `Matraca130/numero1_sseki_2325_55` | Frontend (React 18/Vite/TW4) | Vercel | v4.5 — Responsive layouts, gamification UI |
| `Matraca130/axon-backend` | Backend (Hono/Deno) | Supabase Edge Functions | v4.5 — ~200+ endpoints, gamification, AI/RAG Fase 8 |
| `Matraca130/axon-docs` | Documentation (this repo) | None — reference only | Updated 2026-03-14 |

## Supabase

- Project ID: `xdnciktarvxyhkrokbng`
- ~50+ tables (including ~25 `kv_store_*` junk tables from Figma Make)
- **52+ SQL migrations**
- Embeddings: **1536d** (OpenAI text-embedding-3-small, migrated from Gemini 768d)

## What Changed (2026-03-10–14)

### Backend
- **Gamification system** complete: XP engine, 8 hooks (11 actions), 39 badges, streaks, goals, leaderboard
- **Embedding migration**: Gemini 768d → OpenAI text-embedding-3-small 1536d
- **WhatsApp integration**: Tables + cron job processor (backend routes in development)
- **PDF source tracking**: `pdf_source_url`, `pdf_page_start/end` on summaries (Fase 7 started)
- **RAG security hardening**: Revoked RPC access from authenticated role
- **Batch endpoints**: `keyword-connections-batch`, `flashcards-by-topic`, `review-batch`, `topic-progress`, `topics-overview`
- Route files renamed `.tsx` → `.ts`
- Gamification audit: G/A/B/D/S3 series (all resolved)

### Frontend
- **Layout v2**: All roles migrated to responsive `RoleShell` with MobileDrawer
- **Auth consolidation**: Single `createContext()`, dual-context bug resolved
- **lazyRetry**: Stale chunk error recovery for all 22 lazy routes
- Dead code cleanup: old layouts, auth bridge deleted
