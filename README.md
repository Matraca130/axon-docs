# Axon v4.4 — Platform Documentation

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
│   └── 05-current-status.md
│
├── database/             ← Schema split by domain
│   ├── schema-core.md
│   ├── schema-content.md
│   ├── schema-study.md
│   ├── schema-auth.md
│   ├── constraints.md        ← TODO: Run Query 2
│   └── rls-and-indexes.md    ← TODO: Run Query 3
│
├── api/                  ← Routes split by module
│   ├── routes-institutions.md
│   ├── routes-courses.md
│   ├── routes-content.md
│   ├── routes-study.md
│   ├── routes-auth.md
│   └── routes-misc.md
│
├── bugs/
│   ├── known-bugs.md
│   └── security-audit.md
│
└── frontend/
    ├── platform-api-map.md
    └── build-errors.md
```

## Repos

| Repo | Purpose | Deploy |
|---|---|---|
| `Matraca130/numero1_sseki_2325_55` | Frontend (React/Vite) | Vercel |
| `Matraca130/axon-backend` | Backend (Hono/Deno) | Deno Deploy via GitHub Actions |
| `Matraca130/axon-docs` | Documentation (this repo) | None — reference only |

## Supabase

- Project ID: `xdnciktarvxyhkrokbng`
- Region: (check Supabase dashboard)
- ~50+ tables (including ~25 `kv_store_*` junk tables from Figma Make)
