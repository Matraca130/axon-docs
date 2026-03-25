# CLAUDE.md — AXON PROJECTO (Workspace Root)

> **Prefer parallel agents (agent teams) whenever tasks are independent.**

## What Is This

Workspace root for the Axon educational platform (LMS). Medical education platform with 4 roles (Owner, Admin, Professor, Student), AI/RAG, gamification, and spaced repetition (FSRS v4 + BKT v4).

> **Always run `git pull origin main` in each repo before starting work.** Local copies may be behind GitHub.

## Repos (all under GitHub org `Matraca130`)

| Folder | Repo | Stack | Deploy |
|---|---|---|---|
| `numero1_sseki_2325_55/` | `Matraca130/numero1_sseki_2325_55` | React 18 + Vite 6 + Tailwind v4 + TS | Vercel |
| `axon-backend/` | `Matraca130/axon-backend` | Hono + Deno (Supabase Edge Functions) | GitHub Actions → Supabase |
| `axon-docs/` | `Matraca130/axon-docs` | Markdown | — |

## Other Folders

| Folder | Purpose |
|---|---|
| `docs/` | Idea documents and brainstorming (not a git repo) |
| `MI VAULT CLAUDINHO/` | Obsidian vault for notes/graphs |
| `REBRAND SESSION FLASHCARD/` | Design reference images for flashcard rebrand |

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

Role is NOT in the JWT — comes from `GET /institutions`.

## Key Commands

```bash
# Frontend (from numero1_sseki_2325_55/)
npm install && npm run dev    # Dev server
npm run build                 # Production build (primary validation step)
npm run test                  # Vitest

# Backend (from axon-backend/) — no local dev server
deno test supabase/functions/server/tests/ --allow-env --allow-net --allow-read

# Git workflow (ALL repos)
git checkout -b feat/description main   # New feature branch
git push -u origin feat/description     # Push branch (user merges PR via browser)
```

## Sub-Repo Docs

Each repo has its own CLAUDE.md — do NOT duplicate their content here:
- **Frontend**: @numero1_sseki_2325_55/CLAUDE.md
- **Backend**: @axon-backend/CLAUDE.md → @axon-backend/docs/AGENT_INDEX.md
- **Platform overview**: @axon-docs/PLATFORM-CONTEXT.md

## MANDATORY Rules

Full rules in `.claude/rules/agent-workflow.md` (auto-loaded every session). Summary:
1. Never push to main — always feature branch + PR
2. All agents use `model: "opus"`
3. 2+ agents same repo → `isolation: "worktree"`
4. Quality-gate audit after every agent that writes code
5. Max 10 agents simultaneously (platform limit)

## Current State

**Do not maintain state here.** Current state (bugs, branches, tech debt, recent work) lives in Claude memory (`project_current_state.md`). This avoids duplication and staleness — memory is updated per-session, CLAUDE.md is for stable facts only.

See `axon-docs/KNOWN-BUGS.md` for the canonical bug registry.
