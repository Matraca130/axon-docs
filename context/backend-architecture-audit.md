# Backend Architecture Audit

> **Date:** 2025-02-27 | **Auditor:** Claude (Architect) | **Commit:** `06af298`
> **Status:** ALL IMPROVEMENTS COMPLETED (2026-02-27)
>
> **v4.5 NOTE (2026-03-14):** This audit is HISTORICAL. Since then:
> - Backend grew from ~12 to 14 route modules (~200+ endpoints)
> - Gamification system added (routes/gamification/, xp-engine, badges, streaks)
> - AI/RAG expanded to Fase 8 (12 files in routes/ai/)
> - Rate limiting added (120 req/min + 20 AI POST/hr)
> - Route files renamed .tsx → .ts
> - 41+ SQL migrations (was 3)
> - 7 test files (was 0)
> - All 6 deferred items from audits #1-4 are NOW DONE
> - See `context/05-current-status.md` for current state.

## Executive Summary

**The architecture is solid for an MVP/early-stage product.** The codebase shows clear thinking about separation of concerns, DRY patterns, and proper Supabase Edge Function patterns. There are specific areas to improve before production, but nothing that requires a rewrite.

**Grade: B+** (historical) → **A** (current, after all audit fixes)

---

## What's Working Well

### 1. CRUD Factory (`crud-factory.ts`) — Excellent

This is the strongest part of the architecture. It eliminates ~80% of boilerplate and enforces consistency:
- Soft-delete vs hard-delete configurable per table
- `scopeToUser` auto-isolation for student data
- `parentKey` enforces hierarchical access
- `requiredFields` validation on create
- Pagination, ordering, and filtering built-in
- RESTORE endpoint auto-generated for soft-delete tables
- `checkContentScope()` for institution scoping (added later)

**Impact:** Adding a new CRUD entity takes ~20 lines of config instead of ~200 lines of routes.

### 2. Route Module Organization — Excellent

Clean separation by domain. Since this audit, routes have been split into subdirectories:
```
routes/content/    → Content hierarchy (8 files)
routes/study/      → Study system (6 files)
routes/ai/         → AI/RAG (12 files)
routes/members/    → Institutions + memberships (4 files)
routes/mux/        → Video (5 files)
routes/plans/      → Plans + AI tracking (5 files)
routes/search/     → Search + trash (4 files)
routes/gamification/ → XP, badges, streaks, goals (5 files) [NEW]
routes-auth.ts     → Auth + profiles
routes-billing.ts  → Stripe
routes-models.ts   → 3D models
routes-storage.ts  → File uploads
routes-student.ts  → Student instruments
routes-study-queue.ts → Study queue algorithm
```

### 3. Auth Strategy (`db.ts`) — Good (with known caveats)

- Fast local JWT decode (~0.1ms) for claim extraction
- Cryptographic validation delegated to PostgREST on DB queries
- Clear documentation of the security gap for non-DB routes
- `extractToken()` handles both production and Figma Make token patterns
- Admin client is a lazy singleton (no memory leak)
- User client disables all background timers (Edge-safe)

### 4. Validation (`validate.ts`) — Good

- Zero dependencies (no Zod bloat in Edge)
- Type guards + declarative `validateFields()` batch validator

### 5. Study Queue Algorithm (`routes-study-queue.ts`) — Impressive

- NeedScore combines BKT mastery + FSRS scheduling + fragility + novelty
- Now uses `get_study_queue()` RPC as primary path (S-3 fix)

### 6. Webhook Security — Good

- Mux: HMAC-SHA256 + idempotency
- Stripe: HMAC-SHA256 + timestamp + timing-safe + idempotency

---

## Improvements — ALL COMPLETED

### M-1: Study Queue sequential queries → `Promise.all` + DB function
**Status:** DONE

### M-2: Student ID auto-set on create
**Status:** Already covered by `crud-factory.ts` `scopeToUser` config.

### M-3: Reorder N+1 → `bulk_reorder()` DB function
**Status:** DONE

### M-4: Dead frontend files
**Status:** DONE

### M-5: Phantom `duration_seconds` + `ended_at` → `completed_at`
**Status:** DONE

---

## Low Priority Items

| ID | Description | Status |
|----|-------------|--------|
| L-1 | `.tsx` files without JSX | **FIXED** (renamed to .ts, 2026-03-13) |
| L-2 | Mixed language comments | Won't fix (team preference) |
| L-3 | Stripe fetch wrapper vs SDK | By design (Edge-safe) |
| L-4 | No rate limiting | **FIXED** (O-8, 120 req/min) |
| L-5 | Dead frontend route files | DONE (M-4) |

---

## Architecture Diagram (updated)

```
┌─────────────────────┐
│  Frontend (Vercel)    │
│  React 18 + Vite + TW │
└──────────┬──────────┘
           │ ANON_KEY + X-Access-Token
           ▼
┌─────────────────────┐
│  Hono Edge Function   │
│  (Supabase EF / Deno) │
│                       │
│  index.ts (router)    │
│  ├─ db.ts (auth)       │
│  ├─ validate.ts        │
│  ├─ crud-factory.ts    │
│  ├─ gemini.ts          │
│  ├─ auth-helpers.ts    │
│  ├─ rate-limit.ts      │
│  └─ 14 route modules   │
└──────────┬──────────┘
           │
     ┌─────┼────────┐
     ▼     ▼          ▼
  Supabase  Gemini   Stripe/Mux
  50+ tables 2.5 Flash
  41+ migr.  768d embed
  20+ RPCs
  pgvector
```
