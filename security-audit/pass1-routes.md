# Security Audit -- Pass 1: Routes / Webhooks / CORS / Input Validation

**Auditor:** infra-agent
**Date:** 2026-03-18
**Scope:** Webhooks, CORS, rate limiting, input validation, error handling
**Files audited:** 12 files across server/, routes/telegram/, routes/whatsapp/, routes/mux/, routes/billing/

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 2     |
| HIGH     | 3     |
| MEDIUM   | 4     |
| LOW      | 3     |
| INFO     | 2     |
| **Total**| **14**|

---

## Findings

### [ROUTE-001] Telegram webhook accepts all requests when secret is not configured

- **Severity**: CRITICAL
- **File**: `supabase/functions/server/routes/telegram/webhook.ts:120-125`
- **Description**: `verifyWebhookSecret()` returns `true` when `TELEGRAM_WEBHOOK_SECRET` env var is not set. Any attacker who discovers the webhook URL can send arbitrary Telegram updates, triggering AI responses, linking/unlinking accounts, and consuming Claude API credits.
- **Evidence**:
```typescript
function verifyWebhookSecret(c: Context): boolean {
  const secret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
  if (!secret) {
    // No secret configured -- allow all (for development)
    return true;
  }
  const headerSecret = c.req.header("X-Telegram-Bot-Api-Secret-Token");
  return headerSecret === secret;
}
```
- **Impact**: Full webhook bypass -- attacker can forge Telegram updates, impersonate users, trigger AI tool calls (schedule modifications, flashcard reviews), and burn AI credits. If a chat_id matches a linked user, the attacker can act as that user.
- **Documented**: Not in KNOWN-BUGS.md. Pre-identified in audit scope.

---

### [ROUTE-002] Telegram webhook secret comparison is not timing-safe

- **Severity**: HIGH
- **File**: `supabase/functions/server/routes/telegram/webhook.ts:128`
- **Description**: When the secret IS configured, comparison uses `===` instead of `timingSafeEqual()`. An attacker can measure response times to incrementally guess the secret byte-by-byte.
- **Evidence**:
```typescript
const headerSecret = c.req.header("X-Telegram-Bot-Api-Secret-Token");
return headerSecret === secret;
```
- **Impact**: Timing side-channel allows secret recovery given enough requests. Practical difficulty is medium (requires ~microsecond measurement precision over network), but the fix is trivial since `timingSafeEqual` already exists in the codebase.
- **Documented**: Pre-identified in audit scope.

---

### [ROUTE-003] Telegram admin routes use non-timing-safe secret comparison

- **Severity**: HIGH
- **File**: `supabase/functions/server/routes/telegram/index.ts:57,86`
- **Description**: Both `/telegram/setup-webhook` and `/telegram/delete-webhook` compare the Bearer token against `SUPABASE_SERVICE_ROLE_KEY` using `!==` (standard equality). The WhatsApp equivalent (`/whatsapp/process-queue` at index.ts:71) correctly uses `timingSafeEqual`.
- **Evidence**:
```typescript
// telegram/index.ts:57
if (!token || !serviceRoleKey || token !== serviceRoleKey) {
  return err(c, "Unauthorized", 401);
}
```
vs.
```typescript
// whatsapp/index.ts:71
if (!token || !serviceRoleKey || !timingSafeEqual(token, serviceRoleKey)) {
```
- **Impact**: Timing side-channel on the service_role_key, which grants admin access to the entire Supabase database. Higher impact than ROUTE-002 because the service_role_key bypasses RLS.
- **Documented**: Pre-identified in audit scope.

---

### [ROUTE-004] CORS returns wildcard `*` for requests without Origin header

- **Severity**: HIGH
- **File**: `supabase/functions/server/index.ts:59`
- **Description**: When a request has no `Origin` header (server-to-server, curl, Postman), the CORS middleware returns `Access-Control-Allow-Origin: *`. This undermines the CORS allowlist for any tool that omits Origin. While browsers always send Origin, this defeats defense-in-depth for non-browser clients and can interact with misconfigured proxies.
- **Evidence**:
```typescript
origin: (origin) => {
  // Allow requests with no origin (e.g. server-to-server, Postman)
  if (!origin) return "*";
```
- **Impact**: Non-browser HTTP clients bypass the CORS allowlist entirely. If a reverse proxy strips the Origin header, the protection is nullified. Additionally, returning `*` prevents `credentials: include` from working, which could cause subtle auth bugs.
- **Documented**: BUG-004 in KNOWN-BUGS.md references CORS wildcard as "confirmed in index.ts".

---

### [ROUTE-005] POST /signup has no rate limiting

- **Severity**: MEDIUM
- **File**: `supabase/functions/server/routes-auth.ts:38`
- **Description**: The rate limit middleware only applies to authenticated requests (those with a valid token). `POST /signup` is unauthenticated by design, so it is completely exempt from rate limiting. An attacker can automate account creation.
- **Evidence**:
```typescript
// rate-limit.ts:153-156
const token = extractToken(c);
if (!token) {
  return next();  // Unauthenticated requests skip rate limit
}
```
- **Impact**: Mass account creation (credential stuffing preparation, resource exhaustion). Supabase's auth.admin.createUser has its own limits, but the backend does not enforce any. Could exhaust the auth.users table and Supabase free-tier limits.
- **Documented**: Pre-identified in audit scope.

---

### [ROUTE-006] Error responses expose internal table names and DB error messages

- **Severity**: MEDIUM
- **File**: `supabase/functions/server/crud-factory.ts:304,331,389,447` and multiple route files
- **Description**: Error messages returned to the client include the Supabase table name and the raw PostgREST error message. This leaks internal schema information to attackers.
- **Evidence**:
```typescript
// crud-factory.ts:304
if (error) return err(c, `List ${cfg.table} failed: ${error.message}`, 500);

// crud-factory.ts:447
return err(c, `Update ${cfg.table} ${id} failed: ${error.message}`, 500);

// routes-auth.ts:93
return err(c, `Profile creation failed (auth rolled back): ${profileError.message}`, 500);
```
- **Impact**: Attackers learn table names (institution_subscriptions, profiles, etc.), column constraints, and error patterns. This aids in crafting targeted attacks against the database schema. PostgREST error codes like PGRST116 also leak the API layer.
- **Documented**: Pre-identified in audit scope.

---

### [ROUTE-007] `timingSafeEqual` leaks string length via early return

- **Severity**: MEDIUM
- **File**: `supabase/functions/server/timing-safe.ts:20`
- **Description**: The function returns `false` immediately when string lengths differ. While the XOR loop is constant-time for equal-length strings, the early return on length mismatch leaks whether the attacker's guess has the correct length. This is a known pattern in timing-safe implementations.
- **Evidence**:
```typescript
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;  // <-- leaks length
  // ... constant-time XOR comparison
}
```
- **Impact**: For Stripe signatures (fixed 64-char hex) and HMAC comparisons this is not exploitable because both sides always have the same length. For the Telegram secret and service_role_key comparisons (ROUTE-002, ROUTE-003), an attacker can first determine the correct secret length, reducing the search space. However, since those comparisons currently use `===` anyway (not timingSafeEqual), this is informational for when those get fixed.
- **Documented**: No.

---

### [ROUTE-008] WhatsApp verification token comparison is not timing-safe

- **Severity**: MEDIUM
- **File**: `supabase/functions/server/routes/whatsapp/webhook.ts:190`
- **Description**: The Meta verification challenge handler compares `hub.verify_token` using `===`. This is a one-time setup endpoint, but the token value could be brute-forced if the endpoint remains active after initial setup.
- **Evidence**:
```typescript
if (mode === "subscribe" && token && token === expectedToken) {
  console.log("[WA-Webhook] Verification challenge accepted");
  return c.text(challenge ?? "", 200);
}
```
- **Impact**: Low practical impact since this is only used during initial webhook registration with Meta. However, if an attacker can call this endpoint with arbitrary `hub.challenge` values and the server echoes them back, they can confirm the token via timing analysis and then use the verification endpoint to probe the secret.
- **Documented**: No.

---

### [ROUTE-009] Mux webhook has no replay protection

- **Severity**: LOW
- **File**: `supabase/functions/server/routes/mux/webhook.ts:15-75` and `routes/mux/helpers.ts:35-63`
- **Description**: The Mux webhook verifies HMAC signature correctly (using `crypto.subtle.verify` which is inherently timing-safe), but does not check the timestamp in the signature header for replay protection. The Stripe webhook checks timestamp tolerance (300s), but Mux does not.
- **Evidence**:
```typescript
// mux/helpers.ts -- timestamp is parsed but never validated
const timestamp = parts["t"];
const v1 = parts["v1"];
if (!timestamp || !v1) return false;
const signedPayload = `${timestamp}.${body}`;
// ... verifies signature but never checks if timestamp is recent
```
- **Impact**: A captured valid Mux webhook payload can be replayed indefinitely. The impact is limited because Mux events are idempotent (asset.ready just updates status to "ready" again), but an attacker could replay errored events to flip video status.
- **Documented**: No.

---

### [ROUTE-010] Mux webhook has no idempotency tracking

- **Severity**: LOW
- **File**: `supabase/functions/server/routes/mux/webhook.ts:15-75`
- **Description**: Unlike the Stripe webhook (which uses `processed_webhook_events` table), the Mux webhook has no deduplication. Each replayed event will re-execute the database UPDATE.
- **Evidence**: No idempotency check exists anywhere in `mux/webhook.ts`. Compare with Stripe's:
```typescript
// billing/webhook.ts:44-59 -- Stripe has this, Mux doesn't
const { data: existing } = await admin
  .from("processed_webhook_events")
  .select("id")
  .eq("event_id", eventId)
  .eq("source", "stripe")
  .maybeSingle();
if (existing) { return ok(c, { received: true, deduplicated: true }); }
```
- **Impact**: Combined with ROUTE-009 (no replay protection), allows repeated database writes from captured payloads. Impact is low since the writes are UPDATE (not INSERT) and the final state converges.
- **Documented**: No.

---

### [ROUTE-011] PUT /me does not validate field types before writing to DB

- **Severity**: LOW
- **File**: `supabase/functions/server/routes-auth.ts:174-175`
- **Description**: The `PUT /me` endpoint copies `full_name` and `avatar_url` from the request body without type validation. An attacker can send non-string values (numbers, objects, arrays) which will be passed directly to Supabase.
- **Evidence**:
```typescript
for (const f of allowedFields) {
  if (body[f] !== undefined) patch[f] = body[f];  // no type check
}
```
- **Impact**: PostgreSQL will likely reject invalid types, but the raw error message will be returned to the client (see ROUTE-006). An attacker could also pass extremely long strings for `full_name` or `avatar_url` since there is no length validation. No SQL injection risk because Supabase client uses parameterized queries.
- **Documented**: No.

---

### [ROUTE-012] Health endpoint reveals which services are configured

- **Severity**: INFO
- **File**: `supabase/functions/server/index.ts:82-95`
- **Description**: The `/health` endpoint reveals boolean presence of API keys for Gemini, OpenAI, Claude, WhatsApp, and Telegram. This tells attackers which integrations are active.
- **Evidence**:
```typescript
services: {
  gemini: !!Deno.env.get("GEMINI_API_KEY"),
  openai: !!Deno.env.get("OPENAI_API_KEY"),
  claude: !!Deno.env.get("ANTHROPIC_API_KEY"),
  whatsapp: Deno.env.get("WHATSAPP_ENABLED") === "true",
  telegram: Deno.env.get("TELEGRAM_ENABLED") === "true",
},
```
- **Impact**: Minimal -- reveals integration surface area but no secrets. Standard practice for health checks, but could be gated behind auth in production.
- **Documented**: No. Comment says "does NOT expose the actual key".

---

### [ROUTE-013] 404 handler echoes back the request path

- **Severity**: INFO
- **File**: `supabase/functions/server/index.ts:119-130`
- **Description**: The catch-all 404 handler returns the requested path and method in the response body. This could be used for path enumeration or reflected content in logs.
- **Evidence**:
```typescript
return c.json({
  error: "Route not found",
  path: c.req.path,
  method: c.req.method,
  hint: "Check that the route path and HTTP method are correct.",
}, 404);
```
- **Impact**: Minimal. The path is already in server logs. No XSS risk since response is JSON. Assists slightly in endpoint discovery.
- **Documented**: No.

---

### [ROUTE-014] Stripe webhook returns processing error details to caller

- **Severity**: LOW (upgrade candidate)
- **File**: `supabase/functions/server/routes/billing/webhook.ts:184`
- **Description**: When webhook processing throws, the error message is returned in the HTTP response. Stripe's retry mechanism receives these messages, but if an attacker can trigger errors (e.g., by replaying malformed events that pass signature verification), they can probe internal error messages.
- **Evidence**:
```typescript
return err(c, `Webhook processing failed: ${msg}`, 500);
```
- **Impact**: Leaks internal error messages (DB constraint names, table names) to any caller who can forge valid Stripe signatures. Since Stripe signature verification includes timestamp tolerance, this is only exploitable within the 5-minute replay window.
- **Documented**: No.

---

## Checklist Answers

| # | Question | Answer |
|---|----------|--------|
| 1 | CORS allows wildcard in production? | YES -- for requests without Origin header (ROUTE-004) |
| 2 | Requests without Origin header? | Returns `*`, bypassing the allowlist (ROUTE-004) |
| 3 | Stripe webhook timing-safe HMAC? | YES -- uses `timingSafeEqual` correctly. Timestamp tolerance = 300s. |
| 4 | Telegram webhook timing-safe? | NO -- uses `===` (ROUTE-002) |
| 5 | Telegram webhook bypassable without secret? | YES -- returns true when env var is missing (ROUTE-001) |
| 6 | WhatsApp webhook HMAC correct? | YES -- uses `timingSafeEqual` for HMAC, `crypto.subtle` for signing. Verification token uses `===` (ROUTE-008). |
| 7 | Mux webhook signature verification? | YES -- uses `crypto.subtle.verify` (inherently timing-safe). No replay protection (ROUTE-009). |
| 8 | POST /signup rate limited? | NO -- unauthenticated requests skip rate limiter (ROUTE-005) |
| 9 | Error responses expose internals? | YES -- table names and PostgREST messages in 20+ locations (ROUTE-006) |
| 10 | SQL injection / XSS coverage? | SQL injection: SAFE (Supabase uses parameterized queries). XSS: NOT APPLICABLE (API returns JSON, no HTML rendering). Stored XSS via `full_name`/`avatar_url` depends on frontend sanitization. |
| 11 | Unauthenticated endpoints that should require auth? | `/health` is intentionally public. Webhook endpoints are correctly auth-free (use HMAC). No issues found. |
| 12 | Replay attack protection? | Stripe: YES (300s timestamp + idempotency table). Telegram: NO mechanism. WhatsApp: NO mechanism (relies on Meta's dedup). Mux: NO (ROUTE-009, ROUTE-010). |

---

## Priority Remediation Order

1. **ROUTE-001** (CRITICAL) -- Telegram webhook must reject when secret is not configured. Change `return true` to `return false` and log an error.
2. **ROUTE-003** (HIGH) -- Telegram admin routes must use `timingSafeEqual` for service_role_key. Copy the pattern from `whatsapp/index.ts:71`.
3. **ROUTE-002** (HIGH) -- Telegram webhook secret verification must use `timingSafeEqual`.
4. **ROUTE-004** (HIGH) -- CORS should return `""` (deny) for missing Origin, not `"*"`. Server-to-server callers don't need CORS headers.
5. **ROUTE-005** (MEDIUM) -- Add IP-based rate limiting for `/signup` (e.g., 5 req/min/IP).
6. **ROUTE-006** (MEDIUM) -- Sanitize error messages: log full details server-side, return generic messages to client.
