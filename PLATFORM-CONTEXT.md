# Axon v4.5 — Platform Context

> **Paste this at the start of every Figma Make session.**  
> **Updated:** 2026-03-14 (audit pass 14 — 194 READ + ~320 LISTED + backend mapped)

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

- **Student:** 22+ real routes — fully functional
- **Professor:** 8 routes — **REAL CMS** (38 components: flashcards, quiz, keywords, 3D models, AI reports, video)
- **Owner:** 8 routes — PlaceholderPage
- **Admin:** 6 routes — PlaceholderPage

## 4. Hierarchy: Institution → Course → Semester → Section → Topic → Summary

## 5. Backend: 16 route modules mounted (10 split + 6 flat)

> ⚠️ index.ts says version "4.4" but docs say "4.5" — may need update.

**Flat routes:** auth, billing (16KB), models, storage, student, study-queue (16KB)  
**Split modules (routes/):** ai, content, gamification, members, mux, plans, search, settings, study, whatsapp  
**Core:** crud-factory (20KB), db, auth-helpers, gemini, openai-embeddings, xp-engine, xp-hooks (16KB), streak-engine, rate-limit, validate, chunker, semantic-chunker, retrieval-strategies, auto-ingest, ai-normalizers, summary-hook, timing-safe  
**lib/:** fsrs-v4, bkt-v4, types

Detailed: [`API-MAP.md`](API-MAP.md) + [`api/`](api/) directory

## 6. Frontend (✅ 188 logic files READ, ~320 components LISTED)

| Layer | Files | Status |
|---|---|---|
| services/ | **53** | 100% READ |
| hooks/ (flat + queries) | **56** | 100% READ |
| lib/ | **25** | 100% READ |
| types/ | **11** | 100% READ |
| context/ | **9** | 100% READ |
| utils/ | **10** | 100% READ |
| routes/ | **10** | 100% READ |
| design-system/ | **14** | 100% READ |
| **components/** | **~320** | 100% LISTED |

**Key architecture:**
- React Query v5 with 21 query hooks, 25+ centralized queryKeys, shared cache
- Central `apiCall()` with dual-token, GET dedup, 15s timeout
- Grade mapper: SM-2(1-5) → FSRS(1-4), `isCorrect`: FSRS≥2, BKT≥3
- `lazyRetry` handles stale Vite chunks after deploy
- 15 colocated hooks in components (7 student, 7 professor, 1 dashboard)
- 11 mega-files >25KB (FlashcardsManager 61KB largest)

Detailed: [`context/05-current-status.md`](context/05-current-status.md)

## 7. Known Open Bugs (12 open, BUG-001..029)

| ID | Sev | Summary |
|---|---|---|
| BUG-003 | CRIT | RLS disabled on content tables |
| BUG-001 | HIGH | `resolution_tier` vs `max_resolution` |
| BUG-004 | HIGH | **CORS wildcard `"*"` — confirmed in index.ts** |
| BUG-021 | MED | GamificationContext is STUB |
| BUG-025 | MED | ANON_KEY hardcoded in 3 files |
| BUG-026 | MED | `'demo-student-001'` fallback studentId |
| BUG-028 | MED | architecture.ts 30KB stale docs-as-code |
| BUG-020..024, 027, 029 | LOW | Tech debt (7 items) |

Full: [`bugs/known-bugs.md`](bugs/known-bugs.md)

## 8. Gamification: 13 endpoints, 39 badges, 11 XP actions, daily cap 500

Backend: xp-engine.ts + xp-hooks.ts + streak-engine.ts + gamification routes  
Frontend: 14 components, 8 React Query hooks, `useSessionXP.ts`  
> GamificationContext.tsx is STUB (BUG-021). `useGamification.ts` is the real impl.

## 9. AI/RAG: Gemini 2.5 Flash + OpenAI text-embedding-3-large (1536d)

Phases 1-8D ALL DONE. Backend: gemini.ts, openai-embeddings.ts, chunker.ts, semantic-chunker.ts, retrieval-strategies.ts, auto-ingest.ts + 10 split AI routes (11 mounted).

## 10. DB: 50+ tables, 53 migrations, pgvector 1536d

Backend lib: FSRS v4 (`fsrs-v4.ts`) + BKT v4 (`bkt-v4.ts`) for spaced repetition.

## 11. Tech Stack

**Frontend:** React 18, TypeScript, Vite 6, Tailwind v4, React Router v7, React Query v5, shadcn/ui, Lucide, Motion, TipTap, Three.js, Mux Player, Sonner, date-fns.

**Backend:** Hono + Deno, PostgreSQL + pgvector, Gemini 2.5 Flash, OpenAI, Stripe, Mux, WhatsApp Cloud API.
