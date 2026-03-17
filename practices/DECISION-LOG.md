# Decisión Log — Axon v4.4+

> **Propósito:** Registrar decisiones arquitecturales significativas con su contexto y razonamiento. Cuando alguien pregunte "por que se hizo así?", la respuesta está aquí.

---

## Formato

Cada decisión sigue este formato:

```
### DEC-NNN: Titulo corto
**Fecha:** YYYY-MM-DD | **Status:** Accepted / Superseded / Deprecated  
**Contexto:** Por que surgio esta decisión  
**Decisión:** Que se decidio  
**Consecuencias:** Que implica esta decisión (positivo y negativo)  
```

---

## Decisiones Registradas

### DEC-001: Hono sobre Deno como backend framework
**Fecha:** 2025-xx-xx | **Status:** Accepted  
**Contexto:** Necesitabamos un framework HTTP ligero que corriera en Supabase Edge Functions (Deno runtime).  
**Decisión:** Usar Hono con Deno.serve() como entrypoint.  
**Consecuencias:**  
- (+) Cold start rápido, API compatible con Web Standards  
- (+) Middleware ecosystem (cors, logger)  
- (-) No tiene ORM integrado (usamos Supabase client directamente)  
- (-) Deploy atado a Supabase Edge Functions o Deno Deploy  

### DEC-002: CRUD Factory en lugar de código repetitivo
**Fecha:** 2025-xx-xx | **Status:** Accepted  
**Contexto:** 15+ tablas con patrones CRUD identicos. Copiar-pegar 200 líneas por tabla era insostenible.  
**Decisión:** Crear `crud-factory.ts` que genera 5-6 endpoints por configuración.  
**Consecuencias:**  
- (+) ~20 líneas de config por tabla vs ~200 de código  
- (+) Consistencia forzada (pagination, soft-delete, scoping)  
- (-) Logica custom requiere rutas adicionales fuera del factory  
- (-) Debugging mas indirecto (stack traces pasan por el factory)  

### DEC-003: JWT decode sin verificación criptográfica
**Fecha:** 2025-xx-xx | **Status:** Accepted (temporal, DEFERRED a security hardening)  
**Contexto:** En la arquitectura original, PostgREST/RLS verificaba el JWT en cada query. El backend solo necesitaba extraer claims.  
**Decisión:** `authenticate()` decodifica el JWT payload localmente (~0.1ms) sin verificar firma.  
**Consecuencias:**  
- (+) Zero latency en auth  
- (-) CRÍTICO: Con RLS deshabilitado, el JWT es forgeable  
- (-) Rutas que llaman APIs externas sin DB query son vulnerables  
- **Acción requerida:** Implementar verificación antes de launch  

### DEC-004: RLS deshabilitado durante desarrollo
**Fecha:** 2025-xx-xx | **Status:** Accepted (temporal, DEFERRED)  
**Contexto:** Configurar RLS para 43 tablas con 4 roles es un proyecto en si mismo. Priorizamos feature completeness.  
**Decisión:** 0 RLS policies. Toda autorización en código del backend (parcial).  
**Consecuencias:**  
- (+) Velocidad de desarrollo  
- (-) Sin segunda línea de defensa  
- (-) Si el backend tiene un bug de auth, no hay safety net  
- **Acción requerida:** RLS completo antes de datos reales  

### DEC-005: Flat routes con query params (no REST anidado)
**Fecha:** 2025-xx-xx | **Status:** Accepted  
**Contexto:** REST anidado (`/institutions/:id/courses/:id/semesters`) crea URLs largas y coupling entre entidades.  
**Decisión:** Rutas planas: `GET /semesters?course_id=xxx`  
**Consecuencias:**  
- (+) Mas simple de implementar y debuggear  
- (+) El CRUD factory funciona uniformemente  
- (-) El cliente necesita conocer los foreign keys  

### DEC-006: Stripe fetch wrapper en lugar de SDK
**Fecha:** 2025-xx-xx | **Status:** Accepted  
**Contexto:** El Stripe SDK oficial no funciona bien en Deno/Edge runtime (depende de Node.js APIs).  
**Decisión:** Wrapper mínimo con `fetch()` + `application/x-www-form-urlencoded`.  
**Consecuencias:**  
- (+) Funciona en Edge sin polyfills  
- (+) Zero dependencies adicionales  
- (-) Menos type safety que el SDK  
- (-) Hay que mantener el encoding manualmente  

### DEC-007: In-memory rate limiting
**Fecha:** 2026-02-27 | **Status:** Accepted (con limitaciones conocidas)  
**Contexto:** Necesitabamos rate limiting sin dependencia externa (Redis, etc.).  
**Decisión:** Map<string, RateLimitEntry> en memoria del isolate Deno.  
**Consecuencias:**  
- (+) Zero latency, zero dependencies  
- (-) Se resetea en cada deploy  
- (-) No funciona across multiple isolates (si se escala horizontalmente)  
- **Cuando escalar:** Migrar a Upstash Redis cuando haya >1 isolate  

### DEC-008: Fallback pattern para DB functions
**Fecha:** 2026-02-27 | **Status:** Accepted  
**Contexto:** Deployar backend y correr migraciones son pasos separados. El backend puede deployarse antes de que la migración exista.  
**Decisión:** Toda ruta que use un RPC intenta el RPC primero; si falla con "function not found", usa el patrón anterior.  
**Consecuencias:**  
- (+) Zero-downtime deploys  
- (+) Permite probar el backend sin la migración  
- (-) Codigo mas largo (try primary → catch fallback)  
- (-) Fallback puede tener peor performance  

### DEC-009: validate.ts sin Zod
**Fecha:** 2025-xx-xx | **Status:** Accepted  
**Contexto:** Zod es excelente pero agrega ~50KB al bundle del Edge Function y tiene overhead de parsing.  
**Decisión:** Validators puros: type guards + `validateFields()` declarativo.  
**Consecuencias:**  
- (+) Zero dependencies, ~5KB, mas rápido que Zod  
- (+) Facil de extender  
- (-) No genera types automaticamente (hay que mantener guards y types separados)  
- (-) Menos expresivo que Zod schemas  

---

## Template para Nuevas Decisiones

```markdown
### DEC-0XX: [Titulo]
**Fecha:** YYYY-MM-DD | **Status:** Accepted  
**Contexto:**  
**Decisión:**  
**Consecuencias:**  
- (+)  
- (-)  
```
