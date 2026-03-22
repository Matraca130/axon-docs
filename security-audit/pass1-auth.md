# Security Audit -- Pass 1: Auth / JWT / Sessions

> **Auditor:** Infra Agent (Claude Opus 4.6)
> **Date:** 2026-03-18
> **Scope:** Authentication, JWT handling, session management, rate limiting
> **Files audited:** `db.ts`, `auth-helpers.ts`, `rate-limit.ts`, `api.ts` (frontend), `supabase.ts` (frontend), `AuthContext.tsx`, `routes/ai/index.ts`

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH     | 3 |
| MEDIUM   | 3 |
| LOW      | 2 |
| INFO     | 2 |
| **Total** | **12** |

---

## Findings

### [AUTH-001] JWT not cryptographically verified in authenticate()
- **Severity**: CRITICAL
- **Archivo**: `axon-backend/supabase/functions/server/db.ts:100-176`
- **Descripcion**: `authenticate()` only does a base64 decode of the JWT payload (lines 100-123). It never verifies the HMAC-SHA256 signature. The comment at line 97 says "PostgREST/RLS handles that," but this creates a dangerous gap: any route that calls `authenticate()` and then uses `user.id` for non-DB operations (external API calls, logging, business logic) trusts an unverified identity.
- **Evidencia**:
```ts
// db.ts:100-105
const decodeJwtPayload = (
  token: string,
): { sub: string; email?: string; exp?: number } | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
```
- **Impacto**: An attacker can craft a JWT with any `sub` (user ID) and `email`. For routes that only call external APIs (OpenAI, Gemini, Stripe) without a preceding Supabase query, the forged identity is never challenged. The attacker can consume paid API credits, impersonate users in AI interactions, and trigger actions on behalf of other users. The code's own CRITICAL WARNING comment (lines 136-143) acknowledges this exact scenario.
- **Documentado**: Yes. BUG-002 in KNOWN-BUGS.md (MEDIUM). H1 in DECISIONS.md (P0, PLANNED for deploy D2 using jose). The severity in KNOWN-BUGS.md is underrated -- this should be CRITICAL given that AI routes with real costs exist.

---

### [AUTH-002] Token stored in localStorage -- vulnerable to XSS exfiltration
- **Severity**: CRITICAL
- **Archivo**: `numero1_sseki_2325_55/src/app/lib/api.ts:37-41`
- **Descripcion**: The user's JWT access token is stored in `localStorage` under the key `axon_access_token`. localStorage is accessible to any JavaScript running on the same origin. A single XSS vulnerability anywhere in the application (or in any third-party dependency) allows an attacker to exfiltrate the token with `localStorage.getItem('axon_access_token')`.
- **Evidencia**:
```ts
// api.ts:37-41
if (t) {
  localStorage.setItem('axon_access_token', t);
} else {
  localStorage.removeItem('axon_access_token');
}
```
- **Impacto**: Full account takeover. The stolen token can be used from any machine until it expires. Unlike cookies with HttpOnly/Secure/SameSite, localStorage offers zero protection against script-based theft. Combined with AUTH-001 (no server-side signature check on non-DB routes), the attack surface is amplified.
- **Documentado**: Not explicitly documented in KNOWN-BUGS.md or DECISIONS.md. BUG-025 mentions the ANON_KEY being hardcoded but not the user token in localStorage.

---

### [AUTH-003] No server-side session invalidation on logout
- **Severity**: HIGH
- **Archivo**: `numero1_sseki_2325_55/src/app/context/AuthContext.tsx:357-371`
- **Descripcion**: The `logout()` function calls `supabase.auth.signOut()` which invalidates the Supabase refresh token, but the access JWT remains valid until its `exp` claim expires (typically 1 hour for Supabase). Since `authenticate()` in db.ts only checks `exp` locally and PostgREST also only checks `exp` on the signature, a stolen access token remains usable after logout.
- **Evidencia**:
```ts
// AuthContext.tsx:357-371
const logout = useCallback(async () => {
  try {
    await supabase.auth.signOut();
  } catch {} finally {
    setUser(null);
    setAccessTokenState(null);
    setApiToken(null);
    // ... localStorage cleanup
  }
}, []);
```
- **Impacto**: If an attacker obtains a token (via XSS per AUTH-002), logging out does not stop the attacker. The token remains valid for up to 1 hour. There is no token blocklist or server-side session revocation mechanism.
- **Documentado**: No.

---

### [AUTH-004] ANON_KEY hardcoded and exposed in client bundle
- **Severity**: HIGH
- **Archivo**: `numero1_sseki_2325_55/src/app/lib/supabase.ts:9-10`
- **Descripcion**: The Supabase ANON_KEY is hardcoded in the source code and will be included in the production JavaScript bundle. While Supabase intends ANON_KEY to be public (it only grants access to RLS-protected operations), its exposure combined with the disabled RLS on content tables (BUG-003 CRITICAL) means anyone with this key can directly query PostgREST and access all content data without authentication.
- **Evidencia**:
```ts
// supabase.ts:9-10
export const SUPABASE_URL = 'https://xdnciktarvxyhkrokbng.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```
- **Impacto**: Combined with BUG-003 (RLS disabled on content tables), anyone can bypass the backend entirely and query PostgREST directly at `SUPABASE_URL/rest/v1/` with just the ANON_KEY. This is not a vulnerability by itself (ANON_KEY is designed to be public), but becomes HIGH severity because of the RLS gap.
- **Documentado**: Partially. BUG-025 in KNOWN-BUGS.md notes hardcoded ANON_KEY in 3 files (MEDIUM). BUG-003 documents RLS being disabled (CRITICAL). The combination is not documented.

---

### [AUTH-005] Non-DB routes have zero JWT validation -- forged tokens consume paid APIs
- **Severity**: HIGH
- **Archivo**: `axon-backend/supabase/functions/server/db.ts:136-143`, `axon-backend/supabase/functions/server/routes/ai/index.ts:68-71`
- **Descripcion**: The AI rate limit middleware calls `authenticate()` (line 69) which only does base64 decode. It then uses `auth.user.id` (line 71) as the rate limit key. If the subsequent AI handler also calls `authenticate()` and makes external API calls (Gemini, OpenAI) before any DB query, the JWT is never verified. The AI rate limiter's RPC call (`check_rate_limit`) uses `getAdminClient()` which bypasses RLS entirely, so even that DB call does not validate the user's JWT.
- **Evidencia**:
```ts
// routes/ai/index.ts:68-71
const auth = await authenticate(c);
if (auth instanceof Response) return auth;
const userId = auth.user.id;  // unverified claim from forged JWT
c.set("userId", userId);

const adminDb = getAdminClient();  // SERVICE_ROLE -- no JWT validation here
```
- **Impacto**: An attacker can forge a JWT with any `sub`, pass authenticate() (which only base64 decodes), and the rate limit RPC runs under the admin client -- so the forged user ID is never challenged against Supabase Auth. The attacker can then consume Gemini/OpenAI credits. The per-user rate limit is also bypassable by rotating the `sub` in forged JWTs.
- **Documentado**: Partially. db.ts lines 136-143 contain a CRITICAL WARNING comment. H1 in DECISIONS.md marks this P0. But the specific interaction with the AI rate limiter using adminClient is not documented.

---

### [AUTH-006] Rate limiter bypassable via forged JWT sub rotation
- **Severity**: MEDIUM
- **Archivo**: `axon-backend/supabase/functions/server/rate-limit.ts:65-93`
- **Descripcion**: The rate limit key is derived from the JWT's `sub` claim (line 76-77). Since the JWT is not cryptographically verified, an attacker can generate unlimited JWTs with different `sub` values, each getting their own fresh 120 req/min bucket.
- **Evidencia**:
```ts
// rate-limit.ts:76-77
if (typeof payload.sub === "string" && payload.sub.length > 0) {
  return `uid:${payload.sub}`;
}
```
- **Impacto**: Complete rate limit bypass. An attacker can send unlimited requests by rotating the `sub` field in forged JWTs. This affects both the general rate limiter (120 req/min) and the AI-specific rate limiter (20 req/hour) since both derive keys from unverified JWT claims.
- **Documentado**: Yes. H8 in DECISIONS.md (P2, TECH DEBT). Noted as depending on D2 (jose) being deployed first.

---

### [AUTH-007] getAdminClient() singleton available to all route modules
- **Severity**: MEDIUM
- **Archivo**: `axon-backend/supabase/functions/server/db.ts:48-55`
- **Descripcion**: `getAdminClient()` returns a singleton Supabase client with SERVICE_ROLE_KEY that bypasses all RLS. It is exported and imported by 36 files across the codebase. While necessary for certain operations (signup, webhooks), its widespread availability increases the blast radius of any code injection or logic bug.
- **Evidencia**:
```ts
// db.ts:50-55
export const getAdminClient = (): SupabaseClient => {
  if (!_adminClient) {
    _adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }
  return _adminClient;
};
```
- **Impacto**: Any route handler that accidentally (or through injection) uses `getAdminClient()` instead of the user-scoped `db` client bypasses all RLS policies. With 36 importers, the surface area for misuse is large. A single logic error could expose all data across all institutions.
- **Documentado**: Not as a security concern. The comment says "Use sparingly" but there is no enforcement mechanism.

---

### [AUTH-008] exp check is optional -- tokens without exp are accepted
- **Severity**: MEDIUM
- **Archivo**: `axon-backend/supabase/functions/server/db.ts:166`
- **Descripcion**: The expiration check in `authenticate()` only runs if `payload.exp` exists. A forged JWT without an `exp` field passes the local check and is treated as never-expiring.
- **Evidencia**:
```ts
// db.ts:166
if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
  return err(c, "JWT has expired", 401);
}
```
- **Impacto**: Since authenticate() does not verify the signature anyway (AUTH-001), this is additive rather than standalone. However, once jose is deployed (D2), this optional check should be tightened. A legitimate Supabase JWT always has `exp`, so a missing `exp` should be treated as suspicious. This is defense-in-depth that is currently missing.
- **Documentado**: No.

---

### [AUTH-009] Supabase client has autoRefreshToken enabled on frontend
- **Severity**: LOW
- **Archivo**: `numero1_sseki_2325_55/src/app/lib/supabase.ts:19`
- **Descripcion**: The frontend Supabase client is configured with `autoRefreshToken: true` and `persistSession: true`. While this is standard Supabase practice, it means the refresh token is stored in localStorage by the Supabase SDK (under `sb-<ref>-auth-token`). This is a separate token from the access token in AUTH-002, doubling the exfiltrable credentials.
- **Evidencia**:
```ts
// supabase.ts:18-21
auth: {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: false,
},
```
- **Impacto**: An XSS attack can steal both the access token (from `axon_access_token` in localStorage) and the refresh token (from the Supabase auth storage key). With the refresh token, an attacker can generate new access tokens indefinitely, even after the original access token expires. Logout via `supabase.auth.signOut()` does revoke the refresh token server-side, but only if the user actually logs out.
- **Documentado**: No.

---

### [AUTH-010] No CSRF protection for state-changing operations
- **Severity**: LOW
- **Archivo**: `numero1_sseki_2325_55/src/app/lib/api.ts:75-82`
- **Descripcion**: All API calls use custom headers (`Authorization`, `X-Access-Token`) sent via `fetch()`. Custom headers provide implicit CSRF protection because browsers enforce CORS preflight for non-simple headers. However, the CORS configuration must be correctly restrictive for this to hold.
- **Evidencia**: The backend index.ts has CORS restricted to specific origins (BUG-004 FIX confirmed), so the implicit CSRF protection from custom headers + CORS is effective. This is LOW rather than informational because any future CORS misconfiguration would immediately expose CSRF.
- **Impacto**: Currently mitigated. If CORS is ever widened to `*` again (as it was before BUG-004 fix), all state-changing operations become CSRF-vulnerable.
- **Documentado**: No explicit CSRF documentation.

---

### [AUTH-011] auth-helpers.ts is well-designed -- fail-closed everywhere
- **Severity**: INFO
- **Archivo**: `axon-backend/supabase/functions/server/auth-helpers.ts`
- **Descripcion**: Positive finding. The role hierarchy, `requireInstitutionRole()`, `resolveCallerRole()`, and `canAssignRole()` all implement fail-closed semantics correctly. Empty inputs return null/deny, DB errors return null/deny, unknown roles map to 0 (caller) or Infinity (target). The privilege escalation prevention in `canAssignRole()` is sound. This module does not need changes for security.
- **Evidencia**: Lines 54-56 (unknown roles), line 162 (empty inputs), line 174 (DB errors), line 228 (role not in allowed list) -- all return denial.
- **Impacto**: N/A -- this is a positive finding.
- **Documentado**: Yes, extensively in the file's own comments.

---

### [AUTH-012] AI rate limiter is now fail-closed (previously fail-open)
- **Severity**: INFO
- **Archivo**: `axon-backend/supabase/functions/server/routes/ai/index.ts:82-98`
- **Descripcion**: Positive finding. The AI rate limiter now returns 500 on RPC error (line 84) and 500 on exception (line 97), both preventing requests from proceeding. This was previously fail-open (H2 in DECISIONS.md) and has been fixed.
- **Evidencia**:
```ts
if (error) {
  console.error(`[AI RateLimit] RPC failed: ${error.message}. Denying request.`);
  return err(c, "Could not verify rate limit status.", 500);
}
// ...
} catch (e) {
  return err(c, "Could not verify rate limit status.", 500);
}
```
- **Impacto**: N/A -- this is a positive finding confirming D1 was deployed.
- **Documentado**: Yes. H2 in DECISIONS.md marked as D1 fix.

---

## Checklist Responses

| # | Question | Answer |
|---|----------|--------|
| 1 | JWT verified cryptographically? | **NO.** Only base64 decoded. Signature verification deferred to PostgREST (AUTH-001). |
| 2 | `exp` field validated? | **Partially.** Checked only if present. Missing `exp` = accepted (AUTH-008). |
| 3 | Token replay protection? | **NO.** No nonce, no jti tracking, no token blocklist (AUTH-003). |
| 4 | Token storage location? | **localStorage** -- vulnerable to XSS (AUTH-002). Refresh token also in localStorage via Supabase SDK (AUTH-009). |
| 5 | Tokens sent via secure headers? | **Yes.** Custom headers `X-Access-Token` and `Authorization`, which also provide implicit CSRF protection. |
| 6 | Refresh token flow? | **Yes.** Supabase SDK handles refresh automatically (`autoRefreshToken: true`). `TOKEN_REFRESHED` event updates the in-memory token (AuthContext.tsx:266-269). |
| 7 | Rate limiter bypassable? | **Yes.** Via forged JWT sub rotation (AUTH-006). Not via IP spoofing (rate limit is per-user-JWT, not per-IP). |
| 8 | authenticate() fail-closed? | **Partially.** Returns 401 on missing token, malformed JWT, and expired JWT. But accepts tokens without `exp` and never verifies signature (AUTH-001, AUTH-008). |
| 9 | getAdminClient() restricted? | **No enforcement.** Exported globally, imported by 36 files (AUTH-007). |
| 10 | Logout/session invalidation? | **Client-side only.** Refresh token revoked server-side via Supabase, but access JWT remains valid until exp (AUTH-003). |

---

## Priority Remediation Order

1. **D2 (jose verification)** -- Fixes AUTH-001, AUTH-005, AUTH-006, AUTH-008 simultaneously. This is the single highest-impact change. Already planned in DECISIONS.md.
2. **Token storage migration** -- Move from localStorage to HttpOnly cookies or in-memory-only with Supabase PKCE flow. Fixes AUTH-002, AUTH-009. Requires backend CORS/cookie coordination.
3. **D3 (RLS policies)** -- Fixes the force multiplier behind AUTH-004. Already planned in DECISIONS.md.
4. **Restrict getAdminClient() exports** -- Consider a wrapper that requires an explicit reason string for audit logging (AUTH-007). Lower priority but reduces blast radius.

---

*End of Pass 1 audit.*
