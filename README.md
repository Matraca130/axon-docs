# Axon — Platform Documentation

Central documentation for the Axon educational platform (LMS for medical education).

> Updated: 2026-03-29

## Repos

| Repo | Local Path | Stack | Deploy |
|---|---|---|---|
| `Matraca130/numero1_sseki_2325_55` | `AXON PROJECTO/frontend` | React 18 + Vite 6 + Tailwind v4 + TS | Vercel |
| `Matraca130/axon-backend` | `AXON PROJECTO/backend` | Hono + Deno (Supabase Edge Functions) | GitHub Actions → Supabase |
| `Matraca130/axon-docs` | `AXON PROJECTO/docs` | Markdown (this repo) | — |

## Architecture

```
Frontend (React 18 + Vite + Tailwind v4) → Vercel
  └─ apiCall() in lib/api.ts
       │
       ▼
Backend (Hono/Deno) → Supabase Edge Functions
  ├─ PostgreSQL + pgvector (1536d embeddings)
  ├─ AI/RAG: Gemini 2.5 Flash (gen) + OpenAI text-embedding-3-large + Claude (alt)
  │   ├─ Semantic chunking → embedding ingest → RAG chat (streaming)
  │   └─ Smart generation: flashcards, quizzes, summaries
  ├─ Adaptive Learning: FSRS v4 (spaced rep) + BKT v4 (knowledge tracing)
  ├─ Gamification: XP engine + streaks + badges + leaderboard
  ├─ Messaging: Telegram bot + WhatsApp Cloud API (review-flow, webhooks)
  ├─ Video: Mux (upload, signed playback, view tracking)
  └─ Billing: Stripe (checkout, portal, webhooks)
```

## Auth (Dual Token)

```
Authorization: Bearer <SUPABASE_ANON_KEY>   ← Project key (always)
X-Access-Token: <USER_JWT>                  ← User session
```

Role is NOT in JWT — comes from `GET /institutions`.

## 4 Roles

Owner → Admin → Professor → Student

## Supabase

- Project ID: xdnciktarvxyhkrokbng
- ~50+ tables, 60+ SQL migrations
- Embeddings: 1536d (OpenAI text-embedding-3-large)

## Doc Structure (This Repo)

| Folder | Contents |
|---|---|
| `api/` | API route documentation (7 modules) |
| `bugs/` | Known bugs, runtime bugs, security audit |
| `claude-config/` | Agent system: registry, agents, memories, rules, skills, bug-hunter |
| `context/` | Architecture, data hierarchy, auth, API conventions, status |
| `contracts/` | Architecture maps, coordination contracts, audits |
| `cowork/` | Cowork sessions: research, prototypes, config, audits, vault, command center |
| `database/` | Schema docs (auth, content, core, study, AI, extras) |
| `diagnostics/` | Frontend + backend diagnostics |
| `frontend/` | Build errors, bundle optimization, platform API map |
| `practices/` | Engineering practices, commit guide, decision log, workflow |
| `security-audit/` | 3-pass security audit (auth, routes, access, AI, frontend) |

## Key Files (Start Here)

- **PLATFORM-CONTEXT.md** — Full platform overview
- **PROJECT-STATE.md** — Current state, what's done, what's pending (updated per session)
- **KNOWN-BUGS.md** — All known bugs by severity
- **ROADMAP.md** — Approved features and priorities
- **API-MAP.md** — Complete API endpoint map

## Development Workflow

1. Repos cloned inside `AXON PROJECTO/` (frontend/, backend/, docs/)
2. Always feature branch + PR, never push to main
3. Git worktrees for parallel sessions (never checkout non-main in main repo)
4. Quality gate audit after every agent that writes code
5. CLI runs from AXON PROJECTO; Cowork also mounts AXON PROJECTO

## Agent System

74 specialized agents organized in 12 sections. See `claude-config/AGENT-REGISTRY.md` for the full index.

- **40/76 agents completed recon** (Batch 1: 20, Batch 2: 20)
- **36 pending** (Batch 3+4)
- **14 PRs merged to main** (cumulative, as of 2026-03-29)

## Getting Started

1. Read `PLATFORM-CONTEXT.md` for the full technical overview
2. Check `PROJECT-STATE.md` for what's in flight
3. See `ROADMAP.md` for approved features
4. Browse `api/API-MAP.md` to understand endpoints
5. Start with agent recon in `claude-config/AGENT-REGISTRY.md` if contributing analysis

---

Last updated 2026-03-29.
