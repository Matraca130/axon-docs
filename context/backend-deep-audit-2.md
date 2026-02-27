# Backend Deep Audit #2 — Performance, Correctness & Architecture

**Date:** 2026-02-27  
**Auditor:** AI assistant  
**Scope:** All 15 files in `supabase/functions/server/`  
**Previous audit:** `backend-architecture-audit.md` (M-1 to M-5, all resolved)  
**Overall grade:** A- (up from B+, thanks to M-1..M-5 fixes)

---

## Summary

| ID | Category | Severity | File | Description |
|----|----------|----------|------|-------------|
| N-1 | Performance | **CRITICAL** | routes-search.ts | Search N+1: `buildParentPath` does 4 queries × N results |
| N-2 | Performance | HIGH | routes-search.ts | Trash route queries 5 tables sequentially |
| N-3 | Performance | MEDIUM | routes-billing.tsx | Checkout: 2 independent queries run sequentially |
| N-4 | Performance | MEDIUM | routes-plans.tsx | Content-access: 3 sequential queries |
| N-5 | Performance | LOW | routes-content.tsx | Content-tree: inactive nodes transferred then discarded in JS |
| N-6 | Bug | **CRITICAL** | routes-auth.tsx | GET /me auto-profile: `user.user_metadata` is always undefined |
| N-7 | Correctness | HIGH | routes-mux.ts | track-view: race condition on view_count increment |
| N-8 | Correctness | MEDIUM | routes-search.ts | ilike pattern not sanitized (SQL wildcards in user input) |
| N-9 | Architecture | LOW | crud-factory.ts | Pagination limit has no max cap |
| N-10 | Security | LOW | routes-billing.tsx | Stripe signature comparison not constant-time |

---

## N-1: Search N+1 — `buildParentPath` (CRITICAL)

**File:** `routes-search.ts`, lines ~45-90  
**Impact:** ~80 sequential DB queries for a 20-result search

### Problem

```ts
for (const s of summaries || []) {
  const parent_path = await buildParentPath(db, "summary", s);
  // Each call does: topics → sections → semesters → courses (4 queries)
  results.push({ ...s, parent_path });
}
```

For 20 summaries + 7 keywords + 6 videos = 33 results × 4 queries each = **132 sequential DB round-trips**.

### Fix Options

**Option A (recommended): DB function `search_with_paths()`**  
A single SQL function that does the text search + joins parent names in one query. Returns results with `parent_path` already built.

**Option B (quick win): Parallel `buildParentPath`**  
Replace the `for...of` with `Promise.all(results.map(...))`. Reduces from 132 sequential to 132 parallel (~1 round-trip latency). Still too many queries but 10x faster.

**Option C (best of both): Batch path resolution**  
Collect all unique `topic_id`s from search results, resolve all paths in one query with JOINs, then look up from a map.

### Estimated savings

| Approach | Queries | Latency |
|----------|---------|---------|
| Current | ~132 sequential | ~1300ms |
| Option B (parallel) | ~132 parallel | ~130ms |
| Option C (batch) | 3 searches + 1 path query | ~40ms |
| Option A (DB function) | 1 RPC | ~15ms |

---

## N-2: Trash Route Sequential (HIGH)

**File:** `routes-search.ts`, trash handler  
**Impact:** 5 sequential queries instead of parallel

### Problem

```ts
for (const target of targets) {
  const { data } = await db.from(target.table).select(...);
  // Runs one by one
}
```

### Fix

Trivial `Promise.all`:

```ts
const results = await Promise.all(
  targets.map(target =>
    db.from(target.table)
      .select(`id, ${target.titleField}, deleted_at`)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(50)
  )
);
```

**Estimated savings:** ~150ms → ~35ms (5 queries parallel instead of sequential)

---

## N-3: Billing Checkout Sequential (MEDIUM)

**File:** `routes-billing.tsx`, POST `/billing/checkout-session`  
**Impact:** 2 independent queries run sequentially

### Problem

```ts
const { data: plan } = await db.from("institution_plans").select("*").eq("id", plan_id)...;
const { data: existingSub } = await db.from("institution_subscriptions").select("stripe_customer_id")...;
```

These are completely independent — `Promise.all` them.

**Estimated savings:** ~60ms → ~30ms

---

## N-4: Content-Access Sequential (MEDIUM)

**File:** `routes-plans.tsx`, GET `/content-access`  
**Impact:** 3 sequential queries where 2 could be combined

### Problem

```ts
// Query 1: subscription
const { data: sub } = await db.from("institution_subscriptions")...;
// Query 2: plan (depends on sub.plan_id)
const { data: plan } = await db.from("institution_plans")...;
// Query 3: rules (depends on sub.plan_id)
const { data: rules } = await db.from("plan_access_rules")...;
```

### Fix

Use PostgREST embedded select to fetch subscription + plan in one query:
```ts
const { data: sub } = await db
  .from("institution_subscriptions")
  .select("id, plan_id, status, current_period_end, institution_plans(name, features)")
  ...
```
Then fetch rules in parallel with the embedded query.

**Estimated savings:** 3 queries → 1-2 queries

---

## N-5: Content-Tree Bandwidth Waste (LOW — DEFERRED)

**File:** `routes-content.tsx`, GET `/content-tree`  
**Impact:** All inactive nested nodes transferred over wire, then discarded in JS

PostgREST's `.eq("is_active", true)` only filters top-level `courses`. Nested `semesters`, `sections`, and `topics` return ALL rows regardless. The `filterActiveTree()` JS function then discards inactive ones.

**Fix:** DB function using `jsonb_agg` with WHERE filters at each nesting level.  
**Status:** Already documented as Phase 3 backlog. Keep deferred.

---

## N-6: GET /me Auto-Profile Bug (CRITICAL)

**File:** `routes-auth.tsx`, GET `/me` auto-creation path  
**Impact:** Every auto-created profile gets `full_name: ""` instead of the user's actual name

### Problem

```ts
const auth = await authenticate(c);
const { user } = auth;
// user = { id: string, email: string }  ← that's ALL authenticate() returns

const meta = user.user_metadata || {};  // ← ALWAYS undefined!
const { data: created } = await admin.from("profiles").insert({
  id: user.id,
  email: user.email,
  full_name: meta.full_name || meta.name || "",  // ← Always ""
});
```

`authenticate()` decodes the JWT locally and only returns `{ id, email }`. The JWT **does** contain `user_metadata` in its payload, but `decodeJwtPayload()` ignores it.

### Fix

Use the admin client to fetch the full user record:

```ts
if (error?.code === "PGRST116") {
  const admin = getAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(user.id);
  const meta = authUser?.user?.user_metadata || {};
  // Now meta.full_name actually has the value
}
```

---

## N-7: track-view Race Condition (HIGH)

**File:** `routes-mux.ts`, POST `/mux/track-view`  
**Impact:** Concurrent views can lose count increments

### Problem

```ts
// Step 1: Read current count
const { data: existing } = await db.from("video_views").select("view_count")...;
const newViewCount = (existing?.view_count ?? 0) + 1;

// Step 2: Upsert with computed count
await db.from("video_views").upsert({ view_count: newViewCount, ... });
```

Two concurrent requests both read `view_count=5`, both write `view_count=6`. Lost increment.

### Fix

Use a DB function or trigger that does `view_count = view_count + 1` atomically:

```sql
CREATE OR REPLACE FUNCTION upsert_video_view(...)
RETURNS video_views AS $$
  INSERT INTO video_views (...) VALUES (...)
  ON CONFLICT (video_id, user_id) DO UPDATE
  SET view_count = video_views.view_count + 1, ...
  RETURNING *;
$$ LANGUAGE sql;
```

---

## N-8: Search ilike Not Sanitized (MEDIUM)

**File:** `routes-search.ts`  
**Impact:** SQL wildcard characters in user input cause unexpected matches

### Problem

```ts
const pattern = `%${q}%`;
// User types "100%" → pattern = "%100%%" → matches "100" followed by anything
// User types "file_name" → "_" matches any single character
```

### Fix

Escape LIKE wildcards before constructing the pattern:

```ts
function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, '\\$&');
}
const pattern = `%${escapeLike(q)}%`;
```

---

## N-9: Pagination No Max Cap (LOW)

**File:** `crud-factory.ts`  
**Impact:** Client can request `limit=1000000` and fetch entire table

### Current

```ts
const limit = parseInt(c.req.query("limit") ?? "100", 10);
// No cap!
```

### Fix

```ts
let limit = parseInt(c.req.query("limit") ?? "100", 10);
if (isNaN(limit) || limit < 1) limit = 100;
if (limit > 500) limit = 500; // hard cap
```

---

## N-10: Stripe Signature Not Constant-Time (LOW — DEFERRED)

**File:** `routes-billing.tsx`  
**Impact:** Timing side-channel on webhook signature verification

### Problem

```ts
return parts.signatures.some((s) => s === expected);
// String === is NOT constant-time
```

### Fix (for security hardening phase)

Compare HMAC of both values, or use byte-by-byte XOR comparison.

**Status:** DEFERRED to security hardening pre-launch (same phase as BUG-003, BUG-004).

---

## Recommended Priority Order

| Priority | ID | Effort | Impact |
|----------|----|--------|--------|
| 1 | N-6 | 10 min | Bug fix — profiles missing names |
| 2 | N-2 | 5 min | Trash Promise.all — trivial |
| 3 | N-1 | 30 min | Search N+1 — biggest perf win |
| 4 | N-8 | 5 min | ilike sanitization |
| 5 | N-3 | 5 min | Billing parallel — easy |
| 6 | N-9 | 5 min | Pagination cap — easy |
| 7 | N-7 | 20 min | view_count race — DB function |
| 8 | N-4 | 10 min | Content-access embedded select |
| 9 | N-5 | — | Content-tree — DEFERRED (Phase 3) |
| 10 | N-10 | — | Stripe timing — DEFERRED (security hardening) |

**Total estimated effort for N-1 through N-9:** ~90 minutes
