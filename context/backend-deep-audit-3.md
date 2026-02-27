# Backend Deep Audit #3 — Ultra-Deep: Subtle Bugs, Data Isolation & Edge Cases

**Date:** 2026-02-27  
**Auditor:** AI assistant  
**Scope:** All 15 files in `supabase/functions/server/` (third pass)  
**Previous audits:**
- Audit #1: `backend-architecture-audit.md` (M-1..M-5, all done)
- Audit #2: `backend-deep-audit-2.md` (N-1..N-10, 8/10 done)

**Overall grade: A-** (holds from audit #2 — remaining items are pre-RLS or pre-launch)

---

## Summary

| ID | Category | Severity | File | Description |
|----|----------|----------|------|-------------|
| O-1 | Correctness | **HIGH** | routes-search.ts | PostgREST `or()` filter breaks on commas/parens in search query |
| O-2 | Error Handling | **HIGH** | routes-storage.tsx | `signed-url` and `delete` routes use `c.req.json()` instead of `safeJson()` |
| O-3 | Data Isolation | **HIGH** | routes-study.tsx | Reviews GET/POST not scoped to student — any user can read/write any session's reviews |
| O-4 | Performance | MEDIUM | Database | Missing trigram indexes for `ilike` search on text columns |
| O-5 | Data Isolation | MEDIUM | crud-factory.ts | `GET /:id` ignores `scopeToUser` — student can fetch another's note by UUID |
| O-6 | Error Handling | LOW | routes-storage.tsx | `atob()` in base64 upload path has no try/catch |
| O-7 | Correctness | MEDIUM | routes-billing/mux | Webhook handlers lack idempotency — retried events process twice |
| O-8 | Security | MEDIUM | index.ts | No rate limiting on any endpoint (esp. `/signup`) |

---

## O-1: PostgREST `or()` Filter Injection (HIGH)

**File:** `routes-search.ts`  
**Impact:** Search queries containing commas or parentheses break the PostgREST filter, causing 400 errors or incorrect results.

### Problem

```ts
const pattern = `%${escapeLike(q)}%`;
// ...
.or(`title.ilike.${pattern},content_markdown.ilike.${pattern}`)
```

PostgREST's `or()` filter uses **commas** to separate conditions and **parentheses** for grouping. If the user searches for `"RNA, DNA"`, the pattern becomes `%RNA\, DNA%` and the filter string becomes:

```
title.ilike.%RNA\, DNA%,content_markdown.ilike.%RNA\, DNA%
```

PostgREST parses this as **4 conditions** split by commas:
1. `title.ilike.%RNA\`
2. ` DNA%` (invalid)
3. `content_markdown.ilike.%RNA\`
4. ` DNA%` (invalid)

Result: 400 error or garbage matches.

### Fix

Wrap values in double quotes per PostgREST spec:

```ts
.or(`title.ilike."${pattern}",content_markdown.ilike."${pattern}"`)
```

PostgREST treats quoted values as literals, ignoring internal commas.

### Affected queries
- Summaries search: `.or(`title.ilike...,content_markdown.ilike...`)`
- Keywords search: `.or(`name.ilike...,definition.ilike...`)`

---

## O-2: Storage Routes Missing `safeJson()` (HIGH)

**File:** `routes-storage.tsx`  
**Impact:** Invalid JSON body → unhandled exception → generic 500 with no useful error message.

### Problem

```ts
// POST /storage/signed-url
const body = await c.req.json();  // ← THROWS on invalid JSON

// DELETE /storage/delete
const body = await c.req.json();  // ← THROWS on invalid JSON
```

Every other route in the codebase uses `safeJson(c)` which catches parse errors and returns `null`. These two routes are the only exceptions.

### Fix

Replace `c.req.json()` with `safeJson(c)` + null check:

```ts
const body = await safeJson(c);
if (!body) return err(c, "Invalid or missing JSON body", 400);
```

---

## O-3: Reviews Not Scoped to Student (HIGH)

**File:** `routes-study.tsx`, reviews GET + POST  
**Impact:** Any authenticated user can list or create reviews for any study session.

### Problem

```ts
// GET /reviews?session_id=xxx
// No check that session_id belongs to the requesting user!
const { data, error } = await db
  .from("reviews")
  .select("*")
  .eq("session_id", sessionId)  // Any session, any user
  .order("created_at", { ascending: true });

// POST /reviews
// No check that body.session_id belongs to the requesting user!
const { data, error } = await db
  .from("reviews")
  .insert({ session_id: body.session_id, ... })
```

Student A can:
- Read student B's review grades by guessing/knowing a session_id
- Create fake reviews on student B's session

### Fix (2 options)

**Option A (application-level):** Verify session ownership before proceeding:
```ts
const { data: session } = await db
  .from("study_sessions")
  .select("id")
  .eq("id", sessionId)
  .eq("student_id", user.id)
  .single();
if (!session) return err(c, "Session not found or not yours", 403);
```

**Option B (deferred to RLS):** RLS policy on `reviews` that JOINs `study_sessions.student_id = auth.uid()`. This is the proper long-term fix but requires RLS activation.

### Current status

Deferred to RLS phase. **Document this as a known data isolation gap.**

---

## O-4: Missing Trigram Indexes for Search (MEDIUM)

**File:** Database schema (not in backend code)  
**Impact:** `ilike` on text columns without trigram indexes does sequential table scans. As data grows, search gets linearly slower.

### Affected columns

- `summaries.title`
- `summaries.content_markdown` (large text — most impactful)
- `keywords.name`
- `keywords.definition`
- `videos.title`

### Fix (migration)

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY idx_summaries_title_trgm
  ON summaries USING gin (title gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_summaries_content_trgm
  ON summaries USING gin (content_markdown gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_keywords_name_trgm
  ON keywords USING gin (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_keywords_definition_trgm
  ON keywords USING gin (definition gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_videos_title_trgm
  ON videos USING gin (title gin_trgm_ops);
```

**Note:** `content_markdown` can be very large. The GIN trigram index will consume significant disk space but makes `ilike` queries use index scans instead of sequential scans.

### When to apply

When search performance becomes noticeable (likely >1000 summaries). Not urgent at current data volume.

---

## O-5: Factory `GET /:id` Ignores `scopeToUser` (MEDIUM)

**File:** `crud-factory.ts`, GET by ID handler  
**Impact:** Even with `scopeToUser: "student_id"`, a student can fetch another student's record by UUID.

### Problem

```ts
// GET /:id — no user scope applied!
app.get(`${base}/:id`, async (c: Context) => {
  const { db } = auth;
  const id = c.req.param("id");
  const { data, error } = await db
    .from(cfg.table)
    .select("*")
    .eq("id", id)
    .single();  // Returns ANY row matching the ID
});
```

Compare with LIST, UPDATE, DELETE which all apply:
```ts
if (cfg.scopeToUser) query = query.eq(cfg.scopeToUser, user.id);
```

GET by ID is the only CRUD operation that skips this check.

### Fix

```ts
let query = db.from(cfg.table).select("*").eq("id", id);
if (cfg.scopeToUser) query = query.eq(cfg.scopeToUser, user.id);
const { data, error } = await query.single();
```

### Current status

Low urgency because:
- UUIDs are unguessable (128-bit random)
- RLS will enforce this properly when enabled

But it's a defense-in-depth gap. Worth fixing in the next backend pass.

---

## O-6: Storage Base64 `atob()` No Try/Catch (LOW)

**File:** `routes-storage.tsx`, JSON upload path  
**Impact:** Invalid base64 input → unhandled `atob()` exception → generic 500.

### Problem

```ts
const binaryString = atob(body.base64);  // ← THROWS on invalid base64
const bytes = new Uint8Array(binaryString.length);
```

If `body.base64` contains characters outside the base64 alphabet, `atob()` throws `DOMException: The string to be decoded contains invalid characters`.

### Fix

Wrap in try/catch:
```ts
let binaryString: string;
try {
  binaryString = atob(body.base64);
} catch {
  return err(c, "Invalid base64 data", 400);
}
```

---

## O-7: Webhook Handlers Lack Idempotency (MEDIUM)

**File:** `routes-billing.tsx` (Stripe webhook), `routes-mux.ts` (Mux webhook)  
**Impact:** If Stripe/Mux retries a webhook event, the handler processes it again.

### Problem

**Stripe `checkout.session.completed`:**
```ts
// Always INSERTs a new subscription row
await admin.from("institution_subscriptions").insert({ ... });
```
If Stripe retries, a duplicate subscription row is created.

**Mux `video.asset.ready`:**
```ts
// Always UPDATEs the video row
await admin.from("videos").update({ ... }).eq("id", video.id);
```
Mux retry is safe here (UPDATE is idempotent). **Only Stripe webhook is affected.**

### Fix (when billing is implemented)

**Option A:** Check for existing subscription before inserting:
```ts
const { data: existing } = await admin
  .from("institution_subscriptions")
  .select("id")
  .eq("stripe_subscription_id", subscriptionId)
  .maybeSingle();
if (existing) break; // Already processed
```

**Option B:** Use UPSERT with `stripe_subscription_id` as conflict key.

### Current status

Not urgent — billing is not implemented yet. Fix when Stripe integration goes live.

---

## O-8: No Rate Limiting (MEDIUM)

**File:** `index.ts` (middleware layer)  
**Impact:** No request rate limiting on any endpoint. Particularly risky for:

- **`POST /signup`** — Unlimited account creation (credential stuffing, abuse)
- **`GET /search`** — Expensive ilike queries could be used for DoS
- **`POST /mux/create-upload`** — Each call creates a Mux upload (costs money)
- **`POST /ai-generations`** — AI generation logging (if paired with actual AI calls later)

### Fix (pre-launch)

**Option A:** Hono rate-limit middleware:
```ts
import { rateLimiter } from "hono-rate-limiter";
app.use("/server/signup", rateLimiter({ limit: 5, window: "15m" }));
app.use("/server/search", rateLimiter({ limit: 30, window: "1m" }));
```

**Option B:** Supabase Edge Function invocation limits (configured in dashboard).

**Option C:** Cloudflare WAF / Vercel Edge Middleware rate limiting (infrastructure level).

### Current status

Deferred to pre-launch security hardening phase. Not urgent during development.

---

## Recommended Priority Order

| Priority | ID | Effort | Urgency | Notes |
|----------|----|--------|---------|-------|
| 1 | O-1 | 5 min | NOW | Search breaks on commas — real user input |
| 2 | O-2 | 5 min | NOW | Unhandled throws — trivial fix |
| 3 | O-5 | 5 min | SOON | GET /:id scope gap — defense in depth |
| 4 | O-6 | 5 min | SOON | atob() unhandled throw |
| 5 | O-3 | 10 min | RLS phase | Reviews data isolation |
| 6 | O-4 | 10 min | When data grows | Trigram indexes for search |
| 7 | O-7 | 10 min | When billing ships | Webhook idempotency |
| 8 | O-8 | 15 min | Pre-launch | Rate limiting |

**Immediate fixes (O-1, O-2, O-5, O-6): ~20 minutes**  
**All fixes: ~65 minutes**

---

## Cross-Audit Summary: All 3 Audits

| Audit | Findings | Completed | Deferred | Grade Impact |
|-------|----------|-----------|----------|-------------|
| #1 (M-1..M-5) | 5 | 5/5 ✅ | 0 | B+ → A- |
| #2 (N-1..N-10) | 10 | 8/10 | 2 (billing + security) | A- holds |
| #3 (O-1..O-8) | 8 | 0/8 (new) | 4 (RLS + billing + launch) | A- holds if O-1..O-2 fixed |

**Total: 23 findings across 3 audits. 13 completed, 4 immediate, 6 deferred.**
