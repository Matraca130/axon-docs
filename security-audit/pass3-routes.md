# Diagnostico Final -- Routes / Webhooks / CORS / Input Validation

**Auditor:** quality-gate agent (Opus 4.6)
**Date:** 2026-03-18
**Inputs:** pass1-routes.md (infra-agent, 14 findings), pass2-routes.md (cross-review, 5 additional findings)
**Total hallazgos evaluados:** 19

---

## Estado General

El dominio de routes/webhooks presenta una vulnerabilidad critica (Telegram webhook bypass) y dos vulnerabilidades altas (comparaciones no timing-safe del service_role_key), ambas concentradas en el modulo Telegram. El resto de webhooks (Stripe, WhatsApp, Mux) estan correctamente implementados en sus aspectos fundamentales. La superficie de ataque mas urgente es la posibilidad de que un atacante envie updates falsos al webhook de Telegram sin autenticacion alguna.

---

## Hallazgos Confirmados

| ID | Severidad | Titulo | Archivo:Linea | Status | Recomendacion |
|----|-----------|--------|---------------|--------|---------------|
| ROUTE-001 | CRITICAL | Telegram webhook acepta todo cuando el secret no esta configurado | routes/telegram/webhook.ts:120-125 | Confirmado P1+P2 | Cambiar return true a return false + log error. Fail closed. |
| ROUTE-002 | HIGH | Telegram webhook secret usa === en vez de timingSafeEqual | routes/telegram/webhook.ts:128 | Confirmado P1+P2 | Importar y usar timingSafeEqual (ya existe en timing-safe.ts) |
| ROUTE-003 | HIGH | Telegram admin routes usan !== para service_role_key | routes/telegram/index.ts:57,86 | Confirmado P1+P2 | Copiar patron de whatsapp/index.ts:71 (timingSafeEqual) |
| ROUTE-004 | MEDIUM | CORS devuelve * cuando no hay header Origin | index.ts:59 | Confirmado P1+P2, rebajado de HIGH | Devolver string vacio o null en vez de * para requests sin Origin |
| ROUTE-005 | MEDIUM | POST /signup sin rate limiting | routes-auth.ts:38, rate-limit.ts:153 | Confirmado P1+P2 | Agregar rate limit por IP (5 req/min/IP) para endpoints no autenticados |
| ROUTE-006 | MEDIUM | Errores exponen nombres de tablas y mensajes de PostgREST | crud-factory.ts:304,331,389,447 + 8 mas | Confirmado P1+P2, alcance mayor al reportado | Log completo server-side, devolver mensajes genericos al cliente |
| ROUTE-007 | INFO | timingSafeEqual filtra longitud via early return | timing-safe.ts:20 | Confirmado P1+P2, rebajado de MEDIUM | No explotable en uso actual. Documentar para referencia futura |
| ROUTE-008 | LOW | WhatsApp verification token usa === | routes/whatsapp/webhook.ts:190 | Confirmado P1+P2, rebajado de MEDIUM | Usar timingSafeEqual por consistencia. Bajo impacto real |
| ROUTE-009 | LOW | Mux webhook sin proteccion de replay | routes/mux/helpers.ts:35-63 | Confirmado P1+P2 | Validar timestamp contra tiempo actual (tolerancia 300s como Stripe) |
| ROUTE-010 | LOW | Mux webhook sin tracking de idempotencia | routes/mux/webhook.ts | Confirmado P1+P2 | Agregar check contra processed_webhook_events con source=mux |
| ROUTE-011 | LOW | PUT /me no valida tipos de campo | routes-auth.ts:174-175 | Confirmado P1+P2 | Validar que full_name y avatar_url sean strings + limitar longitud |
| ROUTE-012 | INFO | Health endpoint revela servicios configurados | index.ts:82-95 | Confirmado P1+P2 | Aceptable. Opcionalmente gatearlo detras de auth en produccion |
| ROUTE-013 | INFO | 404 handler hace echo del path | index.ts:119-130 | Confirmado P1+P2 | Aceptable. JSON elimina riesgo XSS |
| ROUTE-014 | LOW | Stripe webhook devuelve detalles de error al caller | routes/billing/webhook.ts:184 | Confirmado P1+P2 | Devolver error generico, logear detalle server-side |
| ROUTE-ADD-01 | N/A | WhatsApp y Mux fallan cerrado cuando secret falta (POSITIVO) | whatsapp/webhook.ts:78-81, mux/helpers.ts:39 | Observacion positiva | Modelo correcto -- Telegram debe replicar este patron |
| ROUTE-ADD-02 | INFO | Telegram link-code y unlink sin anotacion visible de auth middleware | routes/telegram/index.ts:45-46 | Identificado P2 | Verificar que authenticate() se llama internamente; documentar |
| ROUTE-ADD-03 | LOW | Stripe idempotencia es best-effort con fallo silencioso | routes/billing/webhook.ts:57-59,170-177 | Identificado P2 | Logear warning cuando idempotency check falla en vez de silenciar |
| ROUTE-ADD-04 | INFO | Mux no valida presencia de MUX_WEBHOOK_SECRET al startup | routes/mux/helpers.ts:14 | Identificado P2 | Logear warning si env var falta. Videos se quedan en preparing |
| ROUTE-ADD-05 | INFO | Telegram webhook logea contenido de mensajes a consola | routes/telegram/webhook.ts:290-293 | Identificado P2 | Enmascarar contenido de mensajes en logs de produccion |

---

## Detalle de Hallazgos Criticos y Altos

### ROUTE-001 -- Telegram Webhook Bypass (CRITICAL)

**Problema:** La funcion verifyWebhookSecret() en routes/telegram/webhook.ts:120-125 retorna true cuando la variable de entorno TELEGRAM_WEBHOOK_SECRET no esta configurada. El comentario dice "for development" pero no hay verificacion de entorno (NODE_ENV/DENO_ENV). Si Telegram esta habilitado (TELEGRAM_ENABLED=true) pero el secret no esta seteado, cualquier atacante que descubra la URL del webhook puede:

- Forjar updates de Telegram, impersonando usuarios
- Disparar llamadas a la AI (Claude), quemando creditos
- Ejecutar tool calls (modificar schedules, revisar flashcards) si el chat_id coincide con un usuario linkeado
- Linkear/deslinkear cuentas de Telegram

**Verificacion cruzada:** WhatsApp y Mux correctamente retornan false cuando su secret no esta configurado (ROUTE-ADD-01). Esto confirma que ROUTE-001 es una inconsistencia aislada al modulo Telegram, no un patron del codebase.

**Remediacion:** Cambiar la linea 124 de return true a return false y agregar console.error("[Telegram] CRITICAL: TELEGRAM_WEBHOOK_SECRET not configured, rejecting all webhooks").

### ROUTE-002 -- Telegram Webhook Secret Timing Leak (HIGH)

**Problema:** Cuando el secret SI esta configurado, la comparacion en linea 128 usa === (operador estandar) en vez de timingSafeEqual(). Un atacante con capacidad de medir tiempos de respuesta a nivel de microsegundos podria recuperar el secret byte a byte.

**Remediacion:** Importar timingSafeEqual de timing-safe.ts y reemplazar headerSecret === secret con timingSafeEqual(headerSecret, secret).

### ROUTE-003 -- Service Role Key Timing Leak en Admin Routes (HIGH)

**Problema:** Los endpoints /telegram/setup-webhook (linea 57) y /telegram/delete-webhook (linea 86) comparan el Bearer token contra SUPABASE_SERVICE_ROLE_KEY usando !==. El equivalente en WhatsApp (/whatsapp/process-queue en index.ts:71) correctamente usa timingSafeEqual. El service_role_key bypasa RLS completamente, haciendo esta vulnerabilidad de mayor impacto que ROUTE-002.

**Remediacion:** Agregar import { timingSafeEqual } from "../timing-safe.ts" en telegram/index.ts y reemplazar ambas comparaciones con timingSafeEqual(token, serviceRoleKey).

---

## Buenas Practicas Detectadas

1. **Stripe webhook completo:** Verificacion HMAC timing-safe via crypto.subtle, tolerancia de timestamp de 300s, tabla de idempotencia processed_webhook_events. Es el gold standard del codebase.
2. **WhatsApp webhook HMAC correcto:** Usa timingSafeEqual para HMAC y crypto.subtle para firma. El modulo WhatsApp es consistentemente seguro.
3. **Mux HMAC inherentemente timing-safe:** Usa crypto.subtle.verify() que es constant-time por diseno de la Web Crypto API.
4. **Consultas parametrizadas:** Todo el codebase usa el cliente Supabase con parametros, eliminando riesgo de SQL injection.
5. **Auth dual-token correcto:** La separacion Authorization (anon key) + X-Access-Token (user JWT) esta bien implementada en los endpoints autenticados.
6. **WhatsApp y Mux fail-closed:** Ambos rechazan webhooks cuando su secret no esta configurado (contraste directo con Telegram).
7. **Rate limiting para endpoints autenticados:** El middleware funciona correctamente para requests con token.

---

## Nivel de Riesgo: ALTO

Justificacion: Un hallazgo CRITICAL (bypass completo de autenticacion del webhook de Telegram) mas dos hallazgos HIGH (timing leaks del service_role_key). El CRITICAL es directamente explotable si el entorno de produccion no tiene TELEGRAM_WEBHOOK_SECRET configurado. Los HIGH requieren condiciones mas especificas pero afectan la llave mas privilegiada del sistema.

---

## Prioridades de Remediacion

### Inmediato (antes del proximo deploy)

| Prioridad | ID | Esfuerzo | Descripcion |
|-----------|-----|----------|-------------|
| P0 | ROUTE-001 | 5 min | Cambiar return true a return false en verifyWebhookSecret cuando secret no esta configurado |
| P1 | ROUTE-003 | 10 min | Usar timingSafeEqual para service_role_key en telegram/index.ts (2 locations) |
| P2 | ROUTE-002 | 5 min | Usar timingSafeEqual para webhook secret en telegram/webhook.ts |

### Sprint actual

| Prioridad | ID | Esfuerzo | Descripcion |
|-----------|-----|----------|-------------|
| P3 | ROUTE-006 | 2-3 hrs | Sanitizar todos los mensajes de error (12+ locations) -- log server-side, generico al cliente |
| P4 | ROUTE-004 | 10 min | CORS: devolver null/empty para requests sin Origin |
| P5 | ROUTE-005 | 1-2 hrs | Rate limiting por IP para /signup y otros endpoints no autenticados |

### Backlog

| Prioridad | ID | Esfuerzo | Descripcion |
|-----------|-----|----------|-------------|
| P6 | ROUTE-009 + ROUTE-010 | 1 hr | Replay protection + idempotencia para Mux webhook |
| P7 | ROUTE-011 | 30 min | Validacion de tipos y longitud en PUT /me |
| P8 | ROUTE-008 | 5 min | timingSafeEqual para WhatsApp verification token |
| P9 | ROUTE-014 + ROUTE-ADD-03 | 30 min | Sanitizar errores de Stripe webhook + logear fallos de idempotencia |
| P10 | ROUTE-ADD-05 | 15 min | Enmascarar contenido de mensajes en logs de Telegram |

### No requieren accion

| ID | Razon |
|----|-------|
| ROUTE-007 | No explotable en ningun code path actual (INFO) |
| ROUTE-012 | Practica estandar para health checks (INFO) |
| ROUTE-013 | JSON response elimina riesgo XSS (INFO) |
| ROUTE-ADD-02 | Verificar que auth existe internamente; documentar (INFO) |
| ROUTE-ADD-04 | Issue de reliability, no seguridad (INFO) |

---

## Estadisticas Consolidadas

| Metrica | Valor |
|---------|-------|
| Total hallazgos evaluados | 19 |
| Confirmados sin cambio de severidad | 10 |
| Confirmados con severidad ajustada | 3 (ROUTE-004 HIGH->MEDIUM, ROUTE-007 MEDIUM->INFO, ROUTE-008 MEDIUM->LOW) |
| Falsos positivos | 0 |
| Hallazgos adicionales (Pass 2) | 5 |
| Observaciones positivas | 1 (ROUTE-ADD-01) |

| Severidad | Count |
|-----------|-------|
| CRITICAL | 1 |
| HIGH | 2 |
| MEDIUM | 3 |
| LOW | 6 |
| INFO | 6 |
| N/A (positivo) | 1 |
