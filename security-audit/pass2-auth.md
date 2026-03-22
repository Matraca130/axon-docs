# Security Audit -- Pass 2: Auth / JWT / Sessions (Cross-Review)

> **Reviewer:** Quality Gate Agent (Claude Opus 4.6)
> **Date:** 2026-03-18
> **Scope:** Cross-verification of Pass 1 findings against actual source code
> **Pass 1 Author:** Infra Agent (Claude Opus 4.6)

---

## Hallazgo [AUTH-001]: JWT not cryptographically verified in authenticate()

- **Status**: CONFIRMADO
- **Linea verificada**: Si. db.ts:100-123 contains decodeJwtPayload() which only does base64 decode of the JWT payload. Lines 104-105 split on dot and decode parts[1]. No signature verification anywhere. The CRITICAL WARNING comment exists at lines 136-143 exactly as cited.
- **Severidad original -> Severidad revisada**: CRITICAL -> CRITICAL (no change)
- **Notas**: The report accurately describes the issue. The comment at line 97 (PostgREST/RLS handles that) is present. The authenticate() function at lines 150-176 returns { user, db } with unverified claims. One nuance: the db client returned IS configured with the raw JWT in the Authorization header (line 67), so any subsequent PostgREST query WILL validate the signature. The vulnerability is real but scoped to code paths that use user.id or user.email BEFORE or WITHOUT a DB query.

---

## Hallazgo [AUTH-002]: Token stored in localStorage -- vulnerable to XSS exfiltration

- **Status**: SEVERIDAD AJUSTADA
- **Linea verificada**: Si. api.ts:37-38 reads localStorage.setItem("axon_access_token", t) exactly as cited. The setAccessToken() function at lines 34-41 matches the evidence.
- **Severidad original -> Severidad revisada**: CRITICAL -> HIGH
- **Notas**: Severity adjustment justified. While localStorage is indeed accessible to any same-origin JS, this is the standard pattern used by Supabase SDK and the vast majority of SPA applications. The Supabase SDK itself stores tokens in localStorage (the sb-ref-auth-token key mentioned in AUTH-009). Moving to HttpOnly cookies in a SPA architecture requires significant backend coordination (cookie-based auth proxy) and introduces its own tradeoffs (CSRF vulnerability, cross-origin complexity). The real precondition for exploitation is an XSS vulnerability, and the application already sets X-Content-Type-Options: nosniff and X-Frame-Options: DENY via Vercel headers. This is HIGH risk (industry-standard SPA pattern with known tradeoffs) not CRITICAL (which implies immediate exploitability). That said, if there IS an XSS, the impact is full account takeover, so HIGH is warranted.

---

## Hallazgo [AUTH-003]: No server-side session invalidation on logout

- **Status**: CONFIRMADO
- **Linea verificada**: Si. AuthContext.tsx:357-371 matches. The logout function calls supabase.auth.signOut() (line 359), then clears local state. Lines 360-370 match the evidence exactly (setUser(null), localStorage cleanup).
- **Severidad original -> Severidad revisada**: HIGH -> HIGH (no change)
- **Notas**: The report correctly notes that signOut() revokes the refresh token but the access JWT stays valid until exp. This is a known Supabase architectural limitation -- Supabase does not support access token blocklists. The only mitigation is short JWT lifetimes (Supabase default is 3600s / 1 hour). The auditor could have noted that reducing the JWT expiry to a shorter window (e.g., 300s) is a partial mitigation available via Supabase dashboard settings.

---

## Hallazgo [AUTH-004]: ANON_KEY hardcoded and exposed in client bundle

- **Status**: CONFIRMADO
- **Linea verificada**: Si. supabase.ts:9-10 contains the hardcoded URL and full ANON_KEY exactly as cited.
- **Severidad original -> Severidad revisada**: HIGH -> HIGH (no change)
- **Notas**: The report correctly qualifies this as HIGH only because of the combination with BUG-003 (disabled RLS). By itself, a public ANON_KEY is by-design in Supabase. The compound risk assessment is accurate. One additional note: the ANON_KEY JWT payload decoded shows role=anon and exp=2086789860 (year 2036), meaning this key has a very long lifetime and cannot be rotated without downtime.

---

## Hallazgo [AUTH-005]: Non-DB routes have zero JWT validation -- forged tokens consume paid APIs

- **Status**: SEVERIDAD AJUSTADA
- **Linea verificada**: Si. routes/ai/index.ts:68-74 matches. Line 69: authenticate(c), line 71: auth.user.id assigned to userId, line 74: getAdminClient() used for the RPC call.
- **Severidad original -> Severidad revisada**: HIGH -> MEDIUM
- **Notas**: After closer inspection, the actual AI handler routes (e.g., chat.ts) call authenticate(c) again AND perform DB queries using the user-scoped db client (via requireInstitutionRole()). The chat.ts file (line 44 comment: PF-05 FIX) explicitly states that DB queries precede external API calls. This means PostgREST WILL validate the JWT before any Gemini/Claude call happens. The vulnerability in the rate-limit middleware is real (it uses adminClient with unverified userId), but the actual paid-API-consumption path is protected by the user-scoped DB queries in the handler. The attacker can pollute rate-limit counters but cannot actually consume Gemini/Claude credits without a valid JWT. Downgraded to MEDIUM: rate-limit pollution is the real impact, not credit consumption.

---

## Hallazgo [AUTH-006]: Rate limiter bypassable via forged JWT sub rotation

- **Status**: CONFIRMADO
- **Linea verificada**: Si. rate-limit.ts:76-77 matches exactly. The extractKey() function at line 65 decodes the JWT payload and uses payload.sub as the rate limit key.
- **Severidad original -> Severidad revisada**: MEDIUM -> MEDIUM (no change, but see note on AUTH-005 downgrade)
- **Notas**: The report is accurate. However, given the AUTH-005 downgrade (actual AI handlers validate JWT via DB queries before external calls), the practical impact of rate-limit bypass is reduced. An attacker with forged JWTs can bypass the in-memory rate limiter (120 req/min) but will get 401s from PostgREST on every actual data/AI handler call. Net impact: the attacker can waste some RPC calls to check_rate_limit but cannot reach the expensive external APIs.

---

## Hallazgo [AUTH-007]: getAdminClient() singleton available to all route modules

- **Status**: CONFIRMADO
- **Linea verificada**: Si. db.ts:50-55 matches exactly. The function is exported and the singleton pattern is as described.
- **Severidad original -> Severidad revisada**: MEDIUM -> MEDIUM (no change)
- **Notas**: The report claimed "36 files" import getAdminClient. Actual count is 31 source files (.ts) that import it, across 43 total file matches (including docs and migrations). The 36 number is close but slightly inflated. The concern is valid -- widespread availability of the service-role client increases blast radius. However, this is a standard pattern in Supabase Edge Functions. There is no practical alternative without a major architectural refactor.

---

## Hallazgo [AUTH-008]: exp check is optional -- tokens without exp are accepted

- **Status**: SEVERIDAD AJUSTADA
- **Linea verificada**: Si. db.ts:166 checks payload.exp with a truthy guard, meaning a missing exp skips the check entirely.
- **Severidad original -> Severidad revisada**: MEDIUM -> LOW
- **Notas**: Downgraded because this finding is entirely dependent on AUTH-001 (no signature verification). Once jose is deployed (D2), the JWT signature verification will reject any token not signed by Supabase, and all legitimate Supabase JWTs always contain exp. In the current state (pre-D2), this is additive to AUTH-001 but not independently exploitable -- an attacker who can forge JWTs without exp can also forge them WITH a far-future exp. The missing exp check adds zero incremental attack surface. It is purely a defense-in-depth gap that matters post-D2.

---

## Hallazgo [AUTH-009]: Supabase client has autoRefreshToken enabled on frontend

- **Status**: CONFIRMADO
- **Linea verificada**: Si. supabase.ts:19-21 shows persistSession: true, autoRefreshToken: true, detectSessionInUrl: false exactly as cited.
- **Severidad original -> Severidad revisada**: LOW -> LOW (no change)
- **Notas**: This is the default Supabase SDK configuration. The report correctly identifies the additional exfiltrable credential (refresh token). The note that signOut() does revoke the refresh token server-side is an important mitigating factor.

---

## Hallazgo [AUTH-010]: No CSRF protection for state-changing operations

- **Status**: FALSO POSITIVO
- **Linea verificada**: Si, the code matches. But the finding itself acknowledges that CSRF protection IS present via custom headers + CORS.
- **Severidad original -> Severidad revisada**: LOW -> INFO
- **Notas**: The report correctly states that custom headers (Authorization, X-Access-Token) trigger CORS preflight, which provides effective CSRF protection. The report then says this is LOW because of hypothetical future CORS misconfiguration -- this is speculative. A hypothetical future misconfiguration is not a current vulnerability. By its own analysis, CSRF is currently mitigated. This should be INFO (architectural note) not LOW.

---

## Hallazgo [AUTH-011]: auth-helpers.ts is well-designed -- fail-closed everywhere

- **Status**: CONFIRMADO
- **Linea verificada**: Si. Verified all fail-closed patterns: unknown roles get 0/Infinity, empty inputs return null, DB errors return null, role not in allowedRoles returns deny.
- **Severidad original -> Severidad revisada**: INFO -> INFO (no change)
- **Notas**: Positive finding confirmed. This module is well-engineered.

---

## Hallazgo [AUTH-012]: AI rate limiter is now fail-closed (previously fail-open)

- **Status**: CONFIRMADO
- **Linea verificada**: Si. routes/ai/index.ts:82-84 shows the RPC error path returning 500. Lines 95-97 show the catch block also returning 500. Both match the evidence.
- **Severidad original -> Severidad revisada**: INFO -> INFO (no change)
- **Notas**: Positive finding confirmed. The fail-closed behavior is correctly implemented.

---

## Hallazgos Adicionales Encontrados

### [AUTH-013] extractToken() accepts JWT from either header without priority enforcement

- **Severidad**: LOW
- **Archivo**: axon-backend/supabase/functions/server/db.ts:84-93
- **Descripcion**: extractToken() checks X-Access-Token first, then falls back to Authorization: Bearer. If both headers are present with DIFFERENT tokens, the X-Access-Token wins silently. An attacker could send a valid JWT in Authorization (which the Supabase gateway validates before reaching the Edge Function) and a different forged JWT in X-Access-Token (which authenticate() uses for user.id). This creates a token confusion scenario where the identity seen by the gateway differs from the identity used by application logic.
- **Impacto**: Limited in practice because getUserClient() at line 64-75 sets Authorization: Bearer using the SAME token from extractToken(). So both the application identity and the DB identity come from the same source. However, the Supabase gateway may independently interpret the original Authorization header before the Edge Function runs. This depends on Supabase gateway architecture and is worth documenting.

### [AUTH-014] Unauthenticated requests bypass rate limiter entirely

- **Severidad**: MEDIUM
- **Archivo**: axon-backend/supabase/functions/server/rate-limit.ts:152-156
- **Descripcion**: The rateLimitMiddleware at lines 152-156 calls extractToken(c) and if no token is found, calls next() without any rate limiting. This means unauthenticated requests (no JWT at all) are completely exempt from rate limiting. While most routes require authentication and will return 401, any public routes plus the 401 error responses themselves are not rate-limited.
- **Impacto**: An attacker can send unlimited unauthenticated requests to any endpoint. The endpoint will return 401, but the request still consumes Edge Function compute time and network bandwidth. This enables a low-effort denial-of-service vector.

---

## Estadisticas

| Metric | Count |
|--------|-------|
| Total findings reviewed | 12 |
| CONFIRMADO (unchanged) | 7 |
| SEVERIDAD AJUSTADA | 3 |
| FALSO POSITIVO | 1 |
| LINEA INCORRECTA | 0 |
| Hallazgos adicionales | 2 |

### Severity Changes Summary

| Finding | Original | Revised | Reason |
|---------|----------|---------|--------|
| AUTH-002 | CRITICAL | HIGH | Standard SPA pattern; requires XSS precondition; Supabase SDK does the same |
| AUTH-005 | HIGH | MEDIUM | AI handlers validate JWT via DB queries before external API calls (PF-05 FIX) |
| AUTH-008 | MEDIUM | LOW | Entirely dependent on AUTH-001; adds zero incremental attack surface |
| AUTH-010 | LOW | INFO | CSRF is currently mitigated; future misconfiguration is speculative |

### Revised Severity Distribution

| Severity | Count (original) | Count (revised, including new findings) |
|----------|-------------------|-----------------------------------------|
| CRITICAL | 2 | 1 |
| HIGH | 3 | 3 |
| MEDIUM | 3 | 3 |
| LOW | 2 | 3 |
| INFO | 2 | 3 |
| **Total** | **12** | **13 (12 reviewed + 2 new, with 1 reclassified from LOW to INFO)** |

---

## Assessment of Pass 1 Quality

The Pass 1 audit is **high quality**. Line references are accurate in all 12 findings. Code evidence matches the actual source. The priority remediation order is sound (D2/jose first). The severity adjustments reflect contextual nuances that a first-pass auditor working at speed would reasonably miss (the PF-05 fix in chat.ts that changes AUTH-005 impact, and the industry-standard nature of localStorage token storage). No fabricated findings were detected.

---

*End of Pass 2 cross-review.*
