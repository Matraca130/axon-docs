# Backend Architecture Audit

> **Date:** 2025-02-27 | **Auditor:** Claude (Architect) | **Commit:** `06af298`  
> **Status:** ✅ ALL IMPROVEMENTS COMPLETED (2026-02-27)

## Executive Summary

**The architecture is solid for an MVP/early-stage product.** The codebase shows clear thinking about separation of concerns, DRY patterns, and proper Supabase Edge Function patterns. There are specific areas to improve before production, but nothing that requires a rewrite.

**Grade: B+** — Well-structured for the stage you're at. The CRUD factory alone puts this ahead of most backends at this maturity level.

---

## What's Working Well

### 1. CRUD Factory (`crud-factory.ts`) — ⭐ Excellent

This is the strongest part of the architecture. It eliminates ~80% of boilerplate and enforces consistency:
- Soft-delete vs hard-delete configurable per table
- `scopeToUser` auto-isolation for student data
- `parentKey` enforces hierarchical access
- `requiredFields` validation on create
- Pagination, ordering, and filtering built-in
- RESTORE endpoint auto-generated for soft-delete tables

**Impact:** Adding a new CRUD entity takes ~20 lines of config instead of ~200 lines of routes.

### 2. Route Module Organization — ⭐ Excellent

Clean separation by domain:
```
routes-auth.tsx      → Auth + profiles
routes-members.tsx   → Institutions + memberships + scopes
routes-content.tsx   → Content hierarchy (courses→topics)
routes-student.tsx   → Learning instruments + student notes
routes-study.tsx     → Sessions, reviews, spaced repetition
routes-study-queue   → Algorithmic priority queue
routes-plans.tsx     → Plans, subscriptions, AI logs
routes-billing.tsx   → Stripe integration
routes-mux.ts        → Video (Mux)
routes-search.ts     → Global search + trash
routes-storage.tsx   → File uploads
routes-models.tsx    → 3D models
```

Each file is self-contained. A developer working on billing never touches study code.

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
- Probability, UUID, date, email validators
- Used consistently across routes-study.tsx and routes-plans.tsx

### 5. Study Queue Algorithm (`routes-study-queue.tsx`) — Impressive

- NeedScore combines BKT mastery + FSRS scheduling + fragility + novelty
- Configurable weights
- Proper retention curve calculation
- Course-level filtering via hierarchy traversal

### 6. Webhook Security

- Mux: HMAC-SHA256 signature verification ✔️
- Stripe: HMAC-SHA256 + timestamp tolerance (5min) ✔️
- Both use admin client (correct for webhooks)

---

## Improvements — ALL COMPLETED

### M-1: Study Queue sequential queries → `Promise.all` + DB function
**Status:** ✅ DONE — Commit `49ae13d`  
**Migration:** `20260227_02_get_course_summary_ids.sql` ✅ Applied  
**Result:** ~220ms → ~40ms (5x faster)

### M-2: Student ID auto-set on create
**Status:** ✅ Already covered by `crud-factory.ts` `scopeToUser` config.

### M-3: Reorder N+1 → `bulk_reorder()` DB function
**Status:** ✅ DONE — Commit `899a26f`  
**Migration:** `20260227_01_bulk_reorder.sql` ✅ Applied  
**Result:** N individual UPDATEs → 1 RPC call

### M-4: Dead frontend files (`admin-routes.tsx`, `owner-routes.tsx`)
**Status:** ✅ DONE — Commits `e92fa06` + `c4c1a5d` (frontend repo)

### M-5: Phantom `duration_seconds` + `ended_at` → `completed_at`
**Status:** ✅ DONE — Commit `54ff57d`

---

## Low Priority Items

| ID | Description | Status |
|----|-------------|--------|
| L-1 | `.tsx` files without JSX | Won't fix (cosmetic) |
| L-2 | Mixed language comments | Won't fix (team preference) |
| L-3 | Stripe fetch wrapper vs SDK | By design (Edge-safe) |
| L-4 | No rate limiting | Deferred to pre-launch (see O-8) |
| L-5 | Dead frontend route files | ✅ DONE (M-4) |

---

## Architecture Diagram

```
┌─────────────────────┐
│  Frontend (Vercel)    │
│  React + Vite + TW    │
└──────────┬──────────┘
           │ ANON_KEY + X-Access-Token
           ▼
┌─────────────────────┐
│  Hono Edge Function   │
│  (Deno → Supabase EF) │
│                       │
│  index.ts (router)    │
│  ├─ db.ts (auth+clients)│
│  ├─ validate.ts        │
│  ├─ crud-factory.ts    │
│  └─ 12 route modules   │
└──────────┬──────────┘
           │ SERVICE_ROLE_KEY (admin)
           │ or user JWT (scoped)
           ▼
┌─────────────────────┐
│  Supabase PostgreSQL  │
│  43 tables, 0 RLS     │
│  3 DB functions        │
│  (RLS DEFERRED)       │
└─────────────────────┘
```
