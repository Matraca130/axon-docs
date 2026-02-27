# Backend Architecture Audit

> **Date:** 2025-02-27 | **Auditor:** Claude (Architect) | **Commit:** `06af298`

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

## Areas to Improve

### 🟡 Medium Priority (fix before beta users)

#### M-1: Study Queue makes ~5 sequential DB queries

```
bkt_states → fsrs_states → flashcards → semesters → sections → topics → summaries
```

**Fix:** Replace with a single PostgreSQL function (`get_study_queue`) that does all JOINs server-side. Returns ready-to-consume JSON.

#### M-2: Search makes N+1 queries via `buildParentPath()`

For each search result, it does 4 sequential queries to build the breadcrumb path.

**Fix:** Either:
- (a) Materialize `parent_path` as a column on summaries/keywords (denormalize)
- (b) Use a single recursive CTE in a DB function
- (c) Batch the parent lookups (group by topic_id, then section_id, etc.)

#### M-3: Reorder does N individual UPDATEs

The reorder endpoint fires one UPDATE per item. For 50 items, that's 50 queries.

**Fix:** Single DB function using `unnest()` or `UPDATE FROM jsonb_array_elements()`.

#### M-4: Content Tree fetches inactive nodes then filters in JS

`filterActiveTree()` exists because PostgREST's `.eq("is_active", true)` only filters the top level. Nested children come unfiltered.

**Fix:** DB function with `jsonb_agg` + `FILTER (WHERE is_active = true)` at each nesting level.

#### M-5: `study_sessions` CRUD has phantom `duration_seconds` in updateFields

The factory config lists `duration_seconds` as an updateField, but this column was removed from DB (RT-002 fix). Won't cause a runtime error (Supabase just ignores unknown columns in UPDATE), but it's misleading.

**Fix:** Remove `duration_seconds` from `updateFields` and `ended_at` → `completed_at`.

### 🟢 Low Priority (pre-launch polish)

#### L-1: Some `.tsx` files don't use JSX

`routes-billing.tsx`, `routes-study.tsx`, `routes-members.tsx` etc. have `.tsx` extension but use zero JSX. Should be `.ts`. Not a bug, but confusing.

#### L-2: Mixed language in comments

English + Portuguese + Spanish across files. Pick one (English recommended for a team project).

#### L-3: Stripe client is a fetch wrapper, not the SDK

This is actually fine for Edge Functions (avoids Node.js SDK dependency). But the `encodeFormData()` helper should be tested against Stripe's nested array format.

#### L-4: No rate limiting

No request rate limiting anywhere. A single user could hammer the study-queue endpoint.

**Fix:** Add middleware with `hono/rate-limiter` or a simple in-memory counter before security hardening.

#### L-5: Duplicate route files in frontend

`admin-routes.ts` + `admin-routes.tsx` and `owner-routes.ts` + `owner-routes.tsx` both exist. Only `.ts` is used (Vite resolution order). The `.tsx` files are dead code.

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
│  (RLS DEFERRED)       │
└─────────────────────┘
```

## Recommendation

The backend is well-architected for current needs. Priority order for improvements:

1. **M-5** — Fix phantom `duration_seconds`/`ended_at` in study_sessions config (5 min)
2. **M-1** — Study Queue DB function (high impact, reduces latency significantly)
3. **M-3** — Reorder DB function (prevents N queries)
4. **M-2** — Search optimization (N+1 elimination)
5. **M-4** — Content Tree DB function

All of these are performance optimizations, not correctness bugs. The app works correctly as-is.
