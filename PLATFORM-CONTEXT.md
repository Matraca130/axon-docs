# Axon v4.5 — Platform Context

> **Paste this at the start of every Figma Make session.**
> **Updated:** 2026-03-17 (audit pass 17 — full recount: 122 backend files, 586 frontend files, 62 migrations)

---

## 1. Architecture

```
Frontend (React 18 + Vite + Tailwind v4) → Vercel
  └─ apiCall() in lib/api.ts → Backend (Hono/Deno) → Supabase Edge Functions
       └─ PostgreSQL + pgvector | Claude | Gemini (PDF) | OpenAI (embed+voice) | Mux | Stripe | Telegram
```

## 2. Auth (Dual Token)

```
Authorization: Bearer <SUPABASE_ANON_KEY>   ← Project key
X-Access-Token: <USER_JWT>                  ← User session
```

Backend: `extractToken()` in db.ts checks X-Access-Token first, then Authorization Bearer.
Role NOT in JWT — comes from `GET /institutions` + memberships table lookup.
JWT decoded locally (~0.1ms) — crypto verification deferred to PostgREST (BUG-002).

## 3. Roles: owner(4), admin(3), professor(2), student(1)

> **BUG-030:** Professor + Owner routes use `lazyPlaceholder()` in router files, but real page components EXIST and are READY to wire up.

| Role | Router Status | Components Status |
|---|---|---|
| **Student** | 22+ real routes, fully wired | ~57 components + 48 content + 14 viewer3d |
| **Professor** | 8 routes → PlaceholderPage | **16 real pages + 38 CMS components READY** (BUG-030) |
| **Owner** | 8 routes → PlaceholderPage | **8 real pages READY** (incl. 50KB MembersPage) (BUG-030) |
| **Admin** | 6 routes → real pages | **7 admin pages** (dashboard, members, content, scopes, reports, settings, messaging) |

Auth enforced by `auth-helpers.ts`: fail-closed, role hierarchy (`canAssignRole`), institution-scoped.

## 4. Hierarchy: Institution → Course → Semester → Section → Topic → Summary

## 5. Backend: 122 TypeScript files (11 route dirs + 6 flat + 25 core + 3 lib)

> index.ts says version "4.4" — docs say "4.5".

**Split modules (routes/):** ai (15 files), content (11), telegram (9, NEW), whatsapp (10), gamification (6), study (6), plans (5), mux (5), members (4), search (4), settings (3)
**Flat routes:** auth, billing (16KB), models, storage, student, study-queue (16KB)
**Core:** claude-ai.ts (9KB, 3 model tiers), gemini.ts (PDF+voice transcription only), openai-embeddings.ts, retrieval-strategies.ts (14KB), crud-factory (20KB), db, auth-helpers (12KB), xp-engine, xp-hooks (17KB), streak-engine (11KB), rate-limit, validate, chunker, semantic-chunker, auto-ingest, ai-normalizers, summary-hook, timing-safe
**lib/:** fsrs-v4 (8.7KB), bkt-v4, types

## 6. Frontend: 586 TypeScript/TSX files (346 components + 42 hooks + 35 services + 9 contexts)

| Layer | Files |
|---|---|
| Components (20+ subdirs incl. roles/pages/) | **346** |
| Hooks (flat + queries/) | **42+** |
| Services (ai-service/ + platform-api/ + flat) | **35+** |
| Context providers | **9** |
| Types, lib, utils, routes, design-system | ~154 |
| **TOTAL** | **586** |

Key: React Query v5, central `apiCall()` with dual-token, Vitest test infrastructure, 14+ mega-files >25KB.

## 7. Known Open Bugs (16 open, BUG-001..030)

| ID | Sev | Summary |
|---|---|---|
| BUG-003 | CRIT | RLS disabled on content tables |
| BUG-001 | HIGH | `resolution_tier` vs `max_resolution` |
| BUG-004 | HIGH | **CORS wildcard `"*"` — confirmed** |
| **BUG-030** | **HIGH** | **Professor + Owner routes disconnected from real pages** |
| BUG-002 | MED | JWT no crypto (PostgREST mitigates; non-DB routes at risk) |
| BUG-021 | MED | GamificationContext STUB |
| BUG-025 | MED | ANON_KEY hardcoded x3 |
| BUG-026 | MED | demo-student-001 fallback |
| BUG-028 | MED | architecture.ts 30KB stale |
| BUG-020..024, 027, 029 | LOW | Tech debt (7 items) |

Full: [`bugs/known-bugs.md`](bugs/known-bugs.md)

## 8. Gamification: 13 endpoints, 39 badges, 11 XP actions, daily cap 500

Backend: xp-engine + xp-hooks + streak-engine + 6 gamification route files (1,460 lines)
Frontend: 14 components, 8 React Query hooks, `useSessionXP.ts`

## 9. AI: Claude (text gen) + OpenAI (embeddings 1536d + Realtime voice) + Gemini (PDF + voice transcription)

**Claude models (claude-ai.ts):**
- `claude-opus-4` — complex analysis, reports
- `claude-sonnet-4` — default: RAG, chat, generation
- `claude-haiku-4.5` — simple formatting, lookups

**15 AI route files on disk**, 12 mounted. Text generation fully migrated to Claude.
**Voice:** `POST /ai/realtime-session` → ephemeral OpenAI Realtime token; frontend WebSocket (PCM16, 24kHz).
**Telegram bot:** Claude agentic loop (5 iterations) + 11 tools + inline flashcard review.
**WhatsApp bot:** Claude agentic loop + async job processor (pg_cron).

## 10. DB: 50+ tables, 62 migrations, pgvector 1536d

Algorithms: FSRS v4 + BKT v4 (in lib/) for spaced repetition scheduling.
Recent tables: `telegram_links`, `telegram_sessions`, `telegram_message_log`, `messaging_admin_settings`, `whatsapp_links`, `whatsapp_sessions`, `whatsapp_message_log`, `whatsapp_jobs`.

## 11. Messaging: Telegram + WhatsApp (feature-flagged)

Both bots use **Claude agentic loop** with tool_use (5 iterations max) and **11 shared tools**: study queue, RAG search, progress, agenda, keywords, summaries, content nav, flashcard gen, reports, goals.
**Telegram:** 9 files (2,816 lines). Slash commands: `/agenda`, `/estudiar`, `/progreso`, `/cursos`, `/help`. Interactive flashcard review via inline keyboards.
**WhatsApp:** 10 files (3,068 lines). Async job processor (pg_cron every minute). Phone numbers hashed (SHA-256 + salt).
**Admin:** Messaging Integrations settings page for both channels. Shared `messaging_admin_settings` table.

## 12. Tech Stack

**Frontend:** React 18, TypeScript, Vite 6, Tailwind v4, React Router v7, React Query v5, shadcn/ui, Lucide, Motion, TipTap, Three.js, Mux Player, Sonner, date-fns, Vitest.
**Backend:** Hono + Deno, PostgreSQL + pgvector, Claude (Anthropic), Gemini 2.5 Flash (PDF/voice), OpenAI (embeddings + Realtime), Stripe, Mux, Telegram Bot API, WhatsApp Cloud API.

## 13. Environment Variables

```
ANTHROPIC_API_KEY          # Claude (text generation) — REQUIRED
OPENAI_API_KEY             # Embeddings + Realtime voice — REQUIRED
GEMINI_API_KEY             # PDF extraction + voice transcription — REQUIRED
TELEGRAM_ENABLED=true      # Feature flag
WHATSAPP_ENABLED=true      # Feature flag
```
