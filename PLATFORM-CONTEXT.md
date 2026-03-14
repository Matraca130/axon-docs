# Axon v4.5 — Platform Context

> **Paste this at the start of every Figma Make session.**  
> **Updated:** 2026-03-14 (audit pass 12 — 180 frontend files verified)

---

## 1. Architecture

```
Frontend (React 18 + Vite + Tailwind v4) → Vercel
  └─ apiCall() in lib/api.ts → Backend (Hono/Deno) → Supabase Edge Functions
       └─ PostgreSQL + pgvector | Gemini | OpenAI | Mux | Stripe
```

Detailed: [`context/01-architecture.md`](context/01-architecture.md)

## 2. Auth (Dual Token)

```
Authorization: Bearer <SUPABASE_ANON_KEY>   ← Project key
X-Access-Token: <USER_JWT>                  ← User session
```

Role NOT in JWT — comes from `GET /institutions`. Detailed: [`context/03-auth-and-roles.md`](context/03-auth-and-roles.md)

## 3. Roles: owner(4), admin(3), professor(2), student(1)

> ⚠️ Admin/Owner/Professor routes are ALL placeholder pages. Only student has real components (22+ routes).

## 4. Hierarchy: Institution → Course → Semester → Section → Topic → Summary

Detailed: [`context/02-data-hierarchy.md`](context/02-data-hierarchy.md)

## 5. Backend: 10 split modules + 6 flat (~200+ endpoints)

Detailed: [`API-MAP.md`](API-MAP.md) + [`api/`](api/) directory

## 6. Frontend (VERIFIED — 180 files, 8/10 layers at 100%)

| Layer | Files | Status |
|---|---|---|
| services/ | **53** | 100% |
| hooks/ (flat + queries) | **56** | 100% |
| lib/ | **25** | 100% |
| types/ | **11** | 100% |
| context/ | **9** | 100% |
| utils/ | **10** | 100% |
| routes/ | **10** | 100% |
| design-system/ | 14 | UI-only, not read |
| components/ | ~100+ | UI-only, not read |

**Key architecture:**
- React Query v5 with 21 query hooks, 25+ centralized queryKeys, shared cache
- Central `apiCall()` with dual-token, GET dedup, 15s timeout
- `useStudyQueueData` = shared data hub (3 consumers, 1 fetch)
- Grade mapper: SM-2(1-5) → FSRS(1-4), `isCorrect`: FSRS≥2, BKT≥3
- Student routes: per-agent ownership (6 agents), all lazy + withBoundary
- `lazyRetry` handles stale Vite chunks after deploy

Detailed: [`diagnostics/FRONTEND-DIAGNOSTIC.md`](diagnostics/FRONTEND-DIAGNOSTIC.md) + [`context/05-current-status.md`](context/05-current-status.md)

## 7. Known Open Bugs

| ID | Sev | Summary |
|---|---|---|
| BUG-003 | CRIT | RLS disabled on content tables |
| BUG-001 | HIGH | `resolution_tier` vs `max_resolution` |
| BUG-004 | HIGH | **CORS wildcard `"*"` — NOT FIXED** |
| BUG-021 | MED | GamificationContext is STUB |
| BUG-025 | MED | ANON_KEY hardcoded in 3 files |
| BUG-026 | MED | `'demo-student-001'` fallback studentId |
| BUG-020 | LOW | `time_limit_seconds` sent but no DB column |
| BUG-022–024, 027 | LOW | Dead code, duplicate types, dual impl |

Full list: [`KNOWN-BUGS.md`](KNOWN-BUGS.md) → canonical: [`bugs/known-bugs.md`](bugs/known-bugs.md)

## 8. Gamification: 13 endpoints, 39 badges, 11 XP actions, daily cap 500

> ⚠️ GamificationContext.tsx is STUB (BUG-021). `useGamification.ts` (React Query) is the real impl.

## 9. AI/RAG: Gemini 2.5 Flash + OpenAI text-embedding-3-large (1536d)

Phases 1-8D ALL DONE. 14 AI route files, 11 mounted. Detailed: [`context/RAG_PHASES.md`](context/RAG_PHASES.md)

## 10. DB: 50+ tables, 53 migrations, pgvector 1536d

Detailed: [`database/`](database/) directory

## 11. Tech Stack

**Frontend:** React 18, TypeScript, Vite 6, Tailwind v4, React Router v7, React Query v5, shadcn/ui, Lucide, Motion, TipTap, Three.js, Mux Player, Sonner, date-fns.

**Backend:** Hono + Deno, PostgreSQL + pgvector, Gemini 2.5 Flash, OpenAI, Stripe, Mux, WhatsApp Cloud API.
