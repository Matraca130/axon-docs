# Axon v4.5 — Platform Context

> **Paste this at the start of every Figma Make session.**  
> **Updated:** 2026-03-14 (audit pass 15 — ~630 files mapped across 3 repos)

---

## 1. Architecture

```
Frontend (React 18 + Vite + Tailwind v4) → Vercel
  └─ apiCall() in lib/api.ts → Backend (Hono/Deno) → Supabase Edge Functions
       └─ PostgreSQL + pgvector | Gemini | OpenAI | Mux | Stripe
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
| **Admin** | 6 routes → PlaceholderPage | 6 small page wrappers |

Auth enforced by `auth-helpers.ts`: fail-closed, role hierarchy (`canAssignRole`), institution-scoped.

## 4. Hierarchy: Institution → Course → Semester → Section → Topic → Summary

## 5. Backend: ~93 files (16 route modules + 24 core + 3 lib)

> index.ts says version "4.4" — docs say "4.5".

**Split modules (routes/):** ai (14 files, generate-smart 30KB), content (10), whatsapp (10), gamification (6), study (6), plans (5), mux (5), members (4), search (4), settings (2)  
**Flat routes:** auth, billing (16KB), models, storage, student, study-queue (16KB)  
**Core:** crud-factory (20KB), db, auth-helpers (11KB), gemini, openai-embeddings, xp-engine, xp-hooks (16KB), streak-engine, rate-limit, validate, chunker, semantic-chunker, retrieval-strategies (13KB), auto-ingest, ai-normalizers, summary-hook, timing-safe  
**lib/:** fsrs-v4 (8.7KB), bkt-v4, types

## 6. Frontend: 188 logic READ + ~350 components LISTED

| Layer | Files | Status |
|---|---|---|
| Logic (services, hooks, lib, types, context, utils, routes, design-system) | **188** | 100% READ |
| Components (20+ subdirs incl. roles/pages/) | **~350** | 100% LISTED |
| **TOTAL** | **~538** | |

Key: React Query v5, central `apiCall()` with dual-token, 15 colocated hooks, 11+ mega-files >25KB.

## 7. Known Open Bugs (17 open, BUG-001..030)

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

Backend: xp-engine + xp-hooks + streak-engine + 6 gamification route files  
Frontend: 14 components, 8 React Query hooks, `useSessionXP.ts`

## 9. AI/RAG: Gemini 2.5 Flash + OpenAI text-embedding-3-large (1536d)

14 AI route files on disk (generate-smart 30KB, chat 18KB, pre-generate 16KB). 11 mounted via index.ts.

## 10. DB: 50+ tables, 53 migrations, pgvector 1536d

Algorithms: FSRS v4 + BKT v4 (in lib/) for spaced repetition scheduling.

## 11. Tech Stack

**Frontend:** React 18, TypeScript, Vite 6, Tailwind v4, React Router v7, React Query v5, shadcn/ui, Lucide, Motion, TipTap, Three.js, Mux Player, Sonner, date-fns.  
**Backend:** Hono + Deno, PostgreSQL + pgvector, Gemini 2.5 Flash, OpenAI, Stripe, Mux, WhatsApp Cloud API.
