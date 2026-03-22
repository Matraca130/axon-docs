# AXON PLATFORM — Security Diagnostic Report

**Date:** 2026-03-18
**Method:** 3-pass audit (5 parallel agents per pass, 15 agents total, all Claude Opus 4.6)
**Scope:** Full platform — backend (137 TS files), frontend (619 TS/TSX files), 62 SQL migrations
**Type:** Diagnostic only — zero code changes made

---

## 1. Resumen Ejecutivo

La plataforma Axon tiene una arquitectura de autorizacion bien disenada a nivel aplicativo (auth-helpers.ts, crud-factory.ts) pero con deficiencias criticas a nivel de base de datos (RLS ausente en 30+ tablas) y frontend (XSS sin sanitizacion). El sistema depende de "security by obscurity" — la capa Hono bloquea acceso via API, pero un atacante que acceda directamente a PostgREST (usando la anon key publica del frontend) puede leer y escribir datos de cualquier institucion.

**Hallazgos totales verificados: 86** (tras eliminar duplicados cross-dominio)

| Severidad | Cantidad | Dominios afectados |
|-----------|----------|-------------------|
| CRITICAL | 7 | Auth(1), Access(2), Routes(1), AI(1), Frontend(2) |
| HIGH | 14 | Auth(3), Access(3), Routes(2), AI(3), Frontend(3) |
| MEDIUM | 22 | Distribuidos en los 5 dominios |
| LOW | 21 | Distribuidos en los 5 dominios |
| INFO | 22 | Observaciones y buenas practicas |

**Tasa de falsos positivos: 0%** (70 hallazgos de Pasada 1, todos confirmados en Pasada 2)

---

## 2. Tabla Maestra de Hallazgos

### CRITICAL (7)

| ID | Titulo | Archivo:Linea | Status | Recomendacion |
|----|--------|---------------|--------|---------------|
| AUTH-001 | JWT sin verificacion criptografica | db.ts:100-176 | Conocido (BUG-002, DEC-003 D2) | Implementar jose verification |
| ACCESS-001 | RLS deshabilitado en 30+ tablas de contenido | Multiple tables | Conocido (BUG-003, D3) | Habilitar RLS + politicas |
| ACCESS-002 | bulk_reorder() SECURITY DEFINER sin auth/tenant check | 20260227_01_bulk_reorder.sql:18,75 | **NUEVO** | REVOKE + auth.uid() + institution check |
| ROUTE-001 | Telegram webhook acepta todo sin secret | telegram/webhook.ts:120-125 | **NUEVO** | return false cuando !secret |
| AI-001 | Output LLM insertado en DB sin validacion (stored XSS) | generate.ts:257, generate-smart.ts:162, pre-generate.ts:338 | **NUEVO** | Crear validateLlmOutput() |
| FE-001 | dangerouslySetInnerHTML sin DOMPurify (8 instancias) | ViewerBlock.tsx:61,228; ChunkRenderer.tsx:65; +5 mas | **NUEVO** | npm install dompurify + wrapper |
| FE-002 | JWT en localStorage (exfiltrable via XSS) | api.ts:38; AuthContext.tsx:220,366 | **NUEVO** | Se mitiga con FE-001+FE-003; evaluar httpOnly cookies |

### HIGH (14)

| ID | Titulo | Archivo:Linea | Status | Recomendacion |
|----|--------|---------------|--------|---------------|
| AUTH-002 | Token en localStorage vulnerable a XSS | api.ts:37-41 | Nuevo | Migrar a httpOnly o in-memory |
| AUTH-003 | Sin invalidacion server-side al logout (1hr window) | AuthContext.tsx:357-371 | Nuevo | JWT expiry a 300s |
| AUTH-004 | ANON_KEY hardcoded + RLS off = DB abierta | supabase.ts:9-10 | Conocido (BUG-025+BUG-003) | Habilitar RLS (D3) |
| ACCESS-003 | messaging-admin selecciona institucion non-deterministic | messaging-admin.ts:38-49 | Nuevo | Param institution_id + requireInstitutionRole() |
| ACCESS-004 | Gamificacion acepta institution_id sin verificar membership | goals.ts:31-34,80-83,148-151 | **NUEVO** | requireInstitutionRole() |
| ACCESS-005 | subtopics-batch sin verificacion de institucion | subtopics-batch.ts:51-98 | **NUEVO** | Resolver institucion + requireInstitutionRole() |
| ROUTE-002 | Telegram webhook secret: === en vez de timingSafeEqual | telegram/webhook.ts:128 | **NUEVO** | Usar timingSafeEqual |
| ROUTE-003 | Telegram admin routes: service_role_key no timing-safe | telegram/index.ts:57,86 | **NUEVO** | Usar timingSafeEqual |
| AI-002 | pre-generate.ts omite sanitizacion de prompts | pre-generate.ts:278-311 | **NUEVO** | sanitizeForPrompt() + wrapXml() |
| AI-003 | retrieval-strategies.ts: queries sin sanitizar | retrieval-strategies.ts:120,162,213 | **NUEVO** | sanitizeForPrompt() + wrapXml() |
| AI-005 | lib/rag-search.ts: RAG context sin sanitizar (Telegram/WhatsApp) | rag-search.ts:115 | **NUEVO** | sanitizeForPrompt() por chunk |
| FE-003 | Sin Content-Security-Policy | vercel.json | **NUEVO** | Agregar CSP header |
| FE-004 | Anon key hardcodeada y duplicada | supabase.ts:9-10, config.ts:11-13 | Conocido (BUG-025) | Eliminar duplicado |
| FE-005 | Student routes sin RequireRole guard | routes.tsx:100-107 | **NUEVO** | Agregar RequireRole |

### MEDIUM (22) — Resumen

| Dominio | Cantidad | Highlights |
|---------|----------|-----------|
| Auth | 4 | Rate-limit bypass via forged sub, getAdminClient() global, unauthenticated bypass |
| Access | 5 | Reorder first-item-only check, SECURITY DEFINER sin search_path (12+), funciones expuestas |
| Routes | 3 | CORS wildcard sin Origin, /signup sin rate limit, error messages exponen DB details |
| AI | 7 | Streaming sin timeout, token budget ausente, profNotes duplicado raw, query plaintext |
| Frontend | 3 | Sin HSTS, ErrorBoundary expone messages, enrichHtml sin domain allowlist |

### LOW (21) + INFO (22) — Ver reportes individuales pass3-*.md

---

## 3. Hallazgos Criticos — Detalle

### Cadena de Ataque #1: PostgREST Direct Access
```
ANON_KEY (publica en bundle JS)
  + RLS deshabilitado (ACCESS-001)
  + bulk_reorder() SECURITY DEFINER sin auth (ACCESS-002)
  = Lectura/escritura total de TODAS las instituciones sin autenticacion
```
**Impacto:** Exfiltracion completa de datos educativos y de estudiantes.
**Esfuerzo de fix:** ALTO (politicas RLS para 30+ tablas) + BAJO (REVOKE de bulk_reorder)

### Cadena de Ataque #2: XSS-to-Account-Takeover
```
dangerouslySetInnerHTML sin sanitizar (FE-001)
  + JWT en localStorage (FE-002)
  + Sin CSP (FE-003)
  = Stored XSS → robo de JWT → account takeover
```
**Impacto:** Compromise de cualquier cuenta (incluido Owner/Admin).
**Esfuerzo de fix:** MEDIO (DOMPurify + CSP = 3-5 horas)

### Cadena de Ataque #3: AI Pipeline Poisoning
```
Profesor malicioso o contenido envenenado
  + pre-generate sin sanitizacion (AI-002)
  + Output LLM sin validar (AI-001)
  = XSS almacenado masivo via generacion batch (5 items/call)
```
**Impacto:** Contamina contenido educativo para todos los estudiantes de una institucion.
**Esfuerzo de fix:** MEDIO (sanitizacion + validacion = 7 horas)

### Telegram Webhook Bypass (ROUTE-001)
```
TELEGRAM_WEBHOOK_SECRET no configurado
  + verifyWebhookSecret() retorna true
  = Cualquier atacante envia updates falsos → ejecuta tool calls, quema creditos AI
```
**Impacto:** Impersonacion de usuarios, consumo de creditos.
**Esfuerzo de fix:** TRIVIAL (cambiar return true a return false, 5 minutos)

---

## 4. Buenas Practicas Detectadas

| Area | Practica | Archivo |
|------|----------|---------|
| Auth | auth-helpers.ts fail-closed en todos los paths, unknown roles deniegan | auth-helpers.ts |
| Auth | AI rate limiter fail-closed (D1 fix) | routes/ai/index.ts |
| Access | checkContentScope() cubre los 6 CRUD endpoints del factory | crud-factory.ts |
| Access | Proteccion de ultimo owner previene instituciones huerfanas | memberships.ts |
| Access | RAG functions hardened con 3-layer defense (REVOKE + auth.uid + search_path) | migrations 20260311-12 |
| Routes | Stripe webhook: HMAC timing-safe + timestamp tolerance + idempotencia | billing/webhook.ts |
| Routes | WhatsApp webhook: HMAC + dedup + PII hashing + rate limit | whatsapp/webhook.ts |
| Routes | Mux webhook: crypto.subtle.verify (inherently timing-safe) | mux/helpers.ts |
| Routes | Consultas 100% parametrizadas (0 SQL injection) | Todo el codebase |
| AI | Aislamiento multi-tenant RAG robusto (SEC-01 fix) | chat.ts, rag-search.ts |
| AI | API keys via env vars, cero hardcoded | claude-ai.ts, gemini.ts |
| AI | Sanitizacion existente en chat.ts y generate.ts (patron correcto, falta universalizar) | prompt-sanitize.ts |
| Frontend | 0 instancias de eval(), new Function(), .innerHTML | Todo el codebase |
| Frontend | CSRF mitigado via custom headers + CORS restrictivo | api.ts |
| Frontend | Headers parciales: X-Frame-Options DENY, nosniff, strict referrer | vercel.json |

---

## 5. Mapa de Riesgo por Area

| Area | Nivel de Riesgo | Hallazgos Clave | Mitiga con |
|------|----------------|-----------------|------------|
| **Database/RLS** | **CRITICO** | ACCESS-001, ACCESS-002 | D3 deploy (RLS) + REVOKE |
| **JWT/Auth** | **ALTO** | AUTH-001, AUTH-003, AUTH-004 | D2 deploy (jose) + JWT expiry 300s |
| **Frontend XSS** | **ALTO** | FE-001, FE-002, FE-003 | DOMPurify + CSP |
| **AI/Prompt Injection** | **ALTO** | AI-001, AI-002, AI-005 | validateLlmOutput() + sanitizacion universal |
| **Telegram** | **ALTO** | ROUTE-001, ROUTE-002, ROUTE-003 | Fail-closed + timingSafeEqual |
| **WhatsApp** | BAJO | ROUTE-008 (solo cosmetic) | timingSafeEqual por consistencia |
| **Stripe/Billing** | BAJO | ROUTE-014 (error leakage) | Mensajes genericos |
| **Mux/Video** | BAJO | ROUTE-009, ROUTE-010 | Replay protection + idempotencia |
| **Members/Roles** | MUY BAJO | Solo AUTH-012 (owner-to-owner intencional) | Audit log |

---

## 6. Prioridades de Remediacion

### INMEDIATO (antes del proximo deploy) — ~30 min de trabajo

| # | ID | Accion | Esfuerzo |
|---|----|--------|----------|
| 1 | ROUTE-001 | Telegram: return false cuando !secret | 5 min |
| 2 | ROUTE-002 | Telegram: timingSafeEqual para webhook secret | 5 min |
| 3 | ROUTE-003 | Telegram: timingSafeEqual para service_role_key (x2) | 10 min |
| 4 | ACCESS-002 | REVOKE bulk_reorder() de anon/authenticated + auth check | 30 min |

### SPRINT ACTUAL (semana 1) — ~15 horas

| # | ID | Accion | Esfuerzo |
|---|----|--------|----------|
| 5 | FE-001 | DOMPurify + wrapper en 8 instancias | 3 hrs |
| 6 | FE-003 | CSP en vercel.json | 2 hrs |
| 7 | AI-001 | validateLlmOutput() + aplicar en 3 endpoints | 4 hrs |
| 8 | AI-002 | sanitizeForPrompt en pre-generate.ts | 1 hr |
| 9 | AI-005 | sanitizeForPrompt en rag-search.ts | 1 hr |
| 10 | AI-003 | sanitizeForPrompt en retrieval-strategies.ts | 1 hr |
| 11 | AUTH-003 | JWT expiry a 300s en Supabase Dashboard | 5 min |
| 12 | ACCESS-004 | requireInstitutionRole en gamification (3 endpoints) | 1 hr |
| 13 | ACCESS-005 | Institution scoping en subtopics-batch | 1 hr |
| 14 | ACCESS-008 | REVOKE get_course_summary_ids() | 15 min |
| 15 | ACCESS-009 | REVOKE upsert_video_view() + auth.uid() | 30 min |

### SPRINT SIGUIENTE (semana 2-3) — Esfuerzo mayor

| # | ID | Accion | Esfuerzo |
|---|----|--------|----------|
| 16 | AUTH-001 | jose JWT verification (D2 deploy) | 1-2 dias |
| 17 | ACCESS-001 | RLS policies para 30+ tablas (D3 deploy) | 3-5 dias |
| 18 | FE-005 | RequireRole en student routes | 30 min |
| 19 | ACCESS-007 | SET search_path en 12+ SECURITY DEFINER functions | 2 hrs |
| 20 | ROUTE-005 | Rate limiting por IP para /signup | 2 hrs |
| 21 | ROUTE-006 | Sanitizar error messages (12+ locations) | 3 hrs |

### BACKLOG

Items AI-006 a AI-013, AUTH-007 a AUTH-014, ROUTE-008 a ROUTE-014, FE-006 a FE-011, ACCESS-010 a ACCESS-019. Ver reportes pass3-*.md para detalle completo.

---

## Apendice: Archivos del Audit

```
axon-docs/security-audit/
  pass1-auth.md          — P1 diagnostico auth (12 hallazgos)
  pass1-access.md        — P1 diagnostico access (15 hallazgos)
  pass1-routes.md        — P1 diagnostico routes (14 hallazgos)
  pass1-ai.md            — P1 diagnostico AI (15 hallazgos)
  pass1-frontend.md      — P1 diagnostico frontend (14 hallazgos)
  pass2-auth.md          — P2 cross-review auth
  pass2-access.md        — P2 cross-review access
  pass2-routes.md        — P2 cross-review routes
  pass2-ai.md            — P2 cross-review AI
  pass2-frontend.md      — P2 cross-review frontend
  pass3-auth.md          — P3 diagnostico final auth
  pass3-access.md        — P3 diagnostico final access
  pass3-routes.md        — P3 diagnostico final routes
  pass3-ai.md            — P3 diagnostico final AI
  pass3-frontend.md      — P3 diagnostico final frontend
  SECURITY-DIAGNOSTIC.md — Este documento (consolidado ejecutivo)
```

**Verificacion de integridad:** git status en ambos repos confirma 0 archivos de codigo modificados.
