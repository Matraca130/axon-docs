# Security Audit -- Pass 2: Routes / Webhooks (Cross-Review)

**Reviewer:** quality-gate agent (Opus 4.6)
**Date:** 2026-03-18
**Input:** pass1-routes.md (14 findings by infra-agent)
**Method:** Each finding verified against source code at the exact file:line cited.

---

## Hallazgo [ROUTE-001]: Telegram webhook accepts all requests when secret is not configured

- **Status**: CONFIRMADO
- **Linea verificada**: Si -- routes/telegram/webhook.ts:120-128 matches exactly. Function verifyWebhookSecret returns true at line 124 when TELEGRAM_WEBHOOK_SECRET is not set, and uses === at line 128.
- **Severidad original -> revisada**: CRITICAL -> CRITICAL
- **Notas**: Verified verbatim. The comment on line 123 says "for development" but there is no environment check (e.g., NODE_ENV). This means production deploys without the env var are fully open. No mitigations found -- the feature flag TELEGRAM_ENABLED (index.ts:22) gates the entire route module, but if Telegram IS enabled without a secret, all requests pass through.

---

## Hallazgo [ROUTE-002]: Telegram webhook secret comparison is not timing-safe

- **Status**: CONFIRMADO -- LINEA INCORRECTA (minor)
- **Linea verificada**: The report cites line 128, which is correct for the === comparison. However, the report header says "line 128" while the description says "lines 120-125" for the function span. The code at line 128 is exactly: return headerSecret === secret;
- **Severidad original -> revisada**: HIGH -> HIGH
- **Notas**: The finding is accurate. timingSafeEqual is imported in whatsapp/webhook.ts:24 and used there, but is NOT imported in telegram/webhook.ts at all. The timingSafeEqual function exists in timing-safe.ts and is ready to use. Severity HIGH is appropriate given ROUTE-001 must be fixed first.

---

## Hallazgo [ROUTE-003]: Telegram admin routes use non-timing-safe secret comparison

- **Status**: CONFIRMADO
- **Linea verificada**: Si -- routes/telegram/index.ts:57 shows token !== serviceRoleKey (standard equality). Lines 84-86 show the same pattern for delete-webhook. Meanwhile, routes/whatsapp/index.ts:71 correctly uses timingSafeEqual(token, serviceRoleKey). The contrast is exact.
- **Severidad original -> revisada**: HIGH -> HIGH
- **Notas**: Both Telegram admin endpoints use !== while the WhatsApp equivalent uses timingSafeEqual. The timingSafeEqual import is present in whatsapp/index.ts:18 but completely absent from telegram/index.ts. This is clearly inconsistent. The service_role_key bypasses RLS, making this higher impact than ROUTE-002.

---

## Hallazgo [ROUTE-004]: CORS returns wildcard for requests without Origin header

- **Status**: CONFIRMADO
- **Linea verificada**: Si -- index.ts:59 is exactly: if (!origin) return "*";
- **Severidad original -> revisada**: HIGH -> MEDIUM
- **Notas**: Downgrading to MEDIUM. CORS is a browser-enforcement mechanism. Non-browser clients can call the API regardless of CORS headers. Returning * for no-origin requests does NOT bypass security for non-browser clients because they were never restricted by CORS. The real risk is a misconfigured reverse proxy stripping Origin, unlikely in Vercel + Supabase Edge Functions. Axon uses header-based auth (Authorization + X-Access-Token), not cookies. BUG-004 in KNOWN-BUGS.md already tracks this.

---

## Hallazgo [ROUTE-005]: POST /signup has no rate limiting

- **Status**: CONFIRMADO
- **Linea verificada**: Si -- rate-limit.ts:153-154 shows extractToken returns null for unauthenticated requests, and the middleware calls next(). routes-auth.ts:38 confirms POST /signup has no auth.
- **Severidad original -> revisada**: MEDIUM -> MEDIUM
- **Notas**: Accurate. Supabase GoTrue has its own internal rate limits, providing some mitigation. IP-based rate limiting is hard behind Supabase Edge Functions. MEDIUM is appropriate.

---

## Hallazgo [ROUTE-006]: Error responses expose internal table names and DB error messages

- **Status**: CONFIRMADO
- **Linea verificada**: Si -- verified all cited locations plus additional instances at crud-factory.ts:331,389 and routes-auth.ts:143,153,199 not cited in pass1.
- **Severidad original -> revisada**: MEDIUM -> MEDIUM
- **Notas**: The finding understates the scope -- at least 12 locations total leak table/error details. MEDIUM is correct.

---

## Hallazgo [ROUTE-007]: timingSafeEqual leaks string length via early return

- **Status**: CONFIRMADO
- **Linea verificada**: Si -- timing-safe.ts:20 is exactly: if (a.length !== b.length) return false;
- **Severidad original -> revisada**: MEDIUM -> INFO
- **Notas**: Downgrading to INFO. Not exploitable for current use cases: (1) Stripe HMAC sigs are always 64 hex chars, (2) Telegram/WhatsApp comparisons that would be affected currently use === anyway. For fixed-format secrets like service_role_key (JWT, predictable length) this is not useful. Theoretical weakness only.

---

## Hallazgo [ROUTE-008]: WhatsApp verification token comparison is not timing-safe

- **Status**: CONFIRMADO
- **Linea verificada**: Si -- routes/whatsapp/webhook.ts:190 shows token === expectedToken.
- **Severidad original -> revisada**: MEDIUM -> LOW
- **Notas**: Downgrading to LOW. Meta verification challenge is one-time setup. Even if attacker recovers the token, they can only make the endpoint return hub.challenge -- no data access. Minimal attack surface.

---

## Hallazgo [ROUTE-009]: Mux webhook has no replay protection

- **Status**: CONFIRMADO
- **Linea verificada**: Si -- routes/mux/helpers.ts:49-51 shows timestamp parsed but NEVER validated against current time. Compare with routes/billing/webhook.ts:213-214 which checks 300s tolerance.
- **Severidad original -> revisada**: LOW -> LOW
- **Notas**: Timestamp IS in HMAC input (cannot be tampered), but no freshness check. Impact LOW due to idempotent operations.

---

## Hallazgo [ROUTE-010]: Mux webhook has no idempotency tracking

- **Status**: CONFIRMADO
- **Linea verificada**: Si -- routes/mux/webhook.ts (76 lines) has no reference to processed_webhook_events.
- **Severidad original -> revisada**: LOW -> LOW
- **Notas**: Mux handler does UPDATE operations (not INSERT), so replayed events converge to same state. Code quality issue more than security.

---

## Hallazgo [ROUTE-011]: PUT /me does not validate field types before writing to DB

- **Status**: CONFIRMADO
- **Linea verificada**: Si -- routes-auth.ts:174-175 shows loop with no type check. allowedFields is ["full_name", "avatar_url"].
- **Severidad original -> revisada**: LOW -> LOW
- **Notas**: PostgreSQL rejects non-string values. Parameterized queries prevent injection. Main risk is error message leak (ROUTE-006) and no length validation.

---

## Hallazgo [ROUTE-012]: Health endpoint reveals which services are configured

- **Status**: CONFIRMADO
- **Linea verificada**: Si -- index.ts:82-95 matches exactly.
- **Severidad original -> revisada**: INFO -> INFO
- **Notas**: Standard practice. Boolean values only, no secrets.

---

## Hallazgo [ROUTE-013]: 404 handler echoes back the request path

- **Status**: CONFIRMADO
- **Linea verificada**: Si -- index.ts:119-130 matches exactly.
- **Severidad original -> revisada**: INFO -> INFO
- **Notas**: JSON response eliminates XSS risk. Common API practice.

---

## Hallazgo [ROUTE-014]: Stripe webhook returns processing error details to caller

- **Status**: CONFIRMADO
- **Linea verificada**: Si -- routes/billing/webhook.ts:184 matches.
- **Severidad original -> revisada**: LOW -> LOW
- **Notas**: Only callers with valid Stripe signatures (or replays within 300s) can trigger this. LOW is appropriate.

---

## Hallazgos Adicionales (Omisiones detectadas en Pass 2)

### [ROUTE-ADD-01] WhatsApp and Mux webhooks fail closed when secret is missing (POSITIVE)

- **Severidad**: N/A -- positive observation
- **File**: routes/whatsapp/webhook.ts:78-81 and routes/mux/helpers.ts:39
- **Description**: Unlike Telegram (ROUTE-001), both WhatsApp and Mux correctly return false when their respective secrets are not configured. This contrast highlights that ROUTE-001 is an inconsistency, not a codebase-wide pattern.

### [ROUTE-ADD-02] Telegram link-code and unlink routes lack explicit auth middleware annotation

- **Severidad**: INFO
- **File**: routes/telegram/index.ts:45-46
- **Description**: POST /telegram/link-code and POST /telegram/unlink are mounted without visible auth middleware in index.ts. They presumably call authenticate() internally, but the lack of annotation could lead to future regressions.

### [ROUTE-ADD-03] Stripe webhook idempotency is best-effort with silent failure

- **Severidad**: LOW
- **File**: routes/billing/webhook.ts:57-59 and 170-177
- **Description**: The idempotency check catches ALL exceptions and continues processing. If the processed_webhook_events table is unavailable, idempotency is silently disabled, potentially leading to duplicate subscription creates during partial DB outages.

### [ROUTE-ADD-04] Mux webhook does not validate MUX_WEBHOOK_SECRET is present at startup

- **Severidad**: INFO
- **File**: routes/mux/helpers.ts:14
- **Description**: MUX_WEBHOOK_SECRET defaults to empty string if env var is missing. All webhook verification silently fails. Unlike Telegram (feature flag), Mux routes are always mounted. Videos would get stuck in "preparing" status. Reliability issue, not security.

### [ROUTE-ADD-05] Telegram webhook logs user message content to console

- **Severidad**: INFO
- **File**: routes/telegram/webhook.ts:290-293
- **Description**: Logs the first 80 characters of every incoming message. WhatsApp correctly masks phone numbers (P1 FIX), but Telegram logs actual message content. Privacy consideration for production log aggregation.

---

## Estadisticas

| Metrica | Valor |
|---------|-------|
| Total hallazgos en Pass 1 | 14 |
| CONFIRMADOS (sin cambio de severidad) | 10 |
| CONFIRMADOS (severidad ajustada) | 3 |
| FALSOS POSITIVOS | 0 |
| LINEA INCORRECTA (minor) | 1 (ROUTE-002) |
| Hallazgos adicionales (Pass 2) | 5 |

### Resumen de ajustes de severidad

| Hallazgo | Original | Revisada | Razon |
|----------|----------|----------|-------|
| ROUTE-004 | HIGH | MEDIUM | CORS is browser-only enforcement; non-browser clients ignore it |
| ROUTE-007 | MEDIUM | INFO | Not exploitable in any current code path; theoretical only |
| ROUTE-008 | MEDIUM | LOW | One-time setup endpoint with no data access implications |

### Distribucion final de severidad

| Severity | Count |
|----------|-------|
| CRITICAL | 1 |
| HIGH | 2 |
| MEDIUM | 3 |
| LOW | 6 |
| INFO | 4+ |
| **Total (incl. additions)** | **19** |

### Conclusion

Pass 1 was thorough and accurate. Zero false positives detected. All 14 findings verified against source code with exact line matches. Three severity adjustments downward (ROUTE-004, ROUTE-007, ROUTE-008) are justified by practical exploitability analysis. Five additional findings identified, mostly INFO/LOW severity. The priority remediation order from Pass 1 remains valid: ROUTE-001 (CRITICAL) should be fixed immediately, followed by ROUTE-003 and ROUTE-002 (HIGH).
