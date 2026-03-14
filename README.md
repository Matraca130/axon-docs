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
│   ├── schema-core.md
│   ├── schema-content.md
│   ├── schema-study.md
│   ├── schema-auth.md
│   ├── constraints.md
│   └── rls-and-indexes.md
│
├── api/                  ← Routes split by module
│   ├── routes-institutions.md
│   ├── routes-courses.md
│   ├── routes-content.md
│   ├── routes-study.md
│   ├── routes-auth.md
│   ├── routes-models.md
│   └── routes-misc.md
│
├── bugs/
│   ├── known-bugs.md
│   └── security-audit.md
│
├── frontend/
│   ├── platform-api-map.md
│   ├── build-errors.md
│   └── bundle-optimization.md
│
├── practices/            ← Multi-agent coordination
│
├── contracts/            ← Interface contracts
│
├── diagnostics/          ← Debug & audit tools
│
├── PLATFORM-CONTEXT.md   ← ⭐ Single-file context (paste into every session)
├── API-MAP.md            ← ⭐ Complete endpoint reference
└── KNOWN-BUGS.md         ← ⭐ Bug tracker with severity levels
```

## Repos

| Repo | Purpose | Deploy | Status |
|---|---|---|---|
| `Matraca130/numero1_sseki_2325_55` | Frontend (React 18/Vite/TW4) | Vercel | v4.5 — Responsive layouts, gamification UI |
| `Matraca130/axon-backend` | Backend (Hono/Deno) | Supabase Edge Functions | v4.5 — ~200+ endpoints, gamification, AI/RAG Fase 8 |
| `Matraca130/axon-docs` | Documentation (this repo) | None — reference only | Updated 2026-03-14 |

## Supabase

- Project ID: `xdnciktarvxyhkrokbng`
- Region: (check Supabase dashboard)
- ~50+ tables (including ~25 `kv_store_*` junk tables from Figma Make)
- 41+ SQL migrations

## What Changed (2026-03-13/14)

### Backend
- **Gamification system** complete: XP engine, 11 hooks, 39 badges, streaks, goals, leaderboard
- **Batch endpoints**: `keyword-connections-batch`, `flashcards-by-topic`, `review-batch`, `topic-progress`, `topics-overview`
- Route files renamed `.tsx` → `.ts`
- Gamification audit: G-001 to G-015 + A/B/D/S3 series (all resolved)

### Frontend
- **Layout v2**: All roles migrated to responsive `RoleShell` with MobileDrawer
- **Auth consolidation**: Single `createContext()`, dual-context bug resolved
- **lazyRetry**: Stale chunk error recovery for all 22 lazy routes
- Dead code cleanup: old layouts, auth bridge deleted
