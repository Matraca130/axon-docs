# Decision Log — Axon v4.4+

> **Proposito:** Registrar decisiones arquitecturales significativas con su contexto y razonamiento. Cuando alguien pregunte "por que se hizo asi?", la respuesta esta aqui.

---

## Formato

Cada decision sigue este formato:

```
### DEC-NNN: Titulo corto
**Fecha:** YYYY-MM-DD | **Status:** Accepted / Superseded / Deprecated  
**Contexto:** Por que surgio esta decision  
**Decision:** Que se decidio  
**Consecuencias:** Que implica esta decision (positivo y negativo)  
```

---

## Decisiones Registradas

### DEC-001: Hono sobre Deno como backend framework
**Fecha:** 2025-xx-xx | **Status:** Accepted  
**Contexto:** Necesitabamos un framework HTTP ligero que corriera en Supabase Edge Functions (Deno runtime).  
**Decision:** Usar Hono con Deno.serve() como entrypoint.  
**Consecuencias:**  
- (+) Cold start rapido, API compatible con Web Standards  
- (+) Middleware ecosystem (cors, logger)  
- (-) No tiene ORM integrado (usamos Supabase client directamente)  
- (-) Deploy atado a Supabase Edge Functions o Deno Deploy  

### DEC-002: CRUD Factory en lugar de codigo repetitivo
**Fecha:** 2025-xx-xx | **Status:** Accepted  
**Contexto:** 15+ tablas con patrones CRUD identicos. Copiar-pegar 200 lineas por tabla era insostenible.  
**Decision:** Crear `crud-factory.ts` que genera 5-6 endpoints por configuracion.  
**Consecuencias:**  
- (+) ~20 lineas de config por tabla vs ~200 de codigo  
- (+) Consistencia forzada (pagination, soft-delete, scoping)  
- (-) Logica custom requiere rutas adicionales fuera del factory  
- (-) Debugging mas indirecto (stack traces pasan por el factory)  

### DEC-003: JWT decode sin verificacion criptografica
**Fecha:** 2025-xx-xx | **Status:** Accepted (temporal, DEFERRED a security hardening)  
**Contexto:** En la arquitectura original, PostgREST/RLS verificaba el JWT en cada query. El backend solo necesitaba extraer claims.  
**Decision:** `authenticate()` decodifica el JWT payload localmente (~0.1ms) sin verificar firma.  
**Consecuencias:**  
- (+) Zero latency en auth  
- (-) CRITICO: Con RLS deshabilitado, el JWT es forgeable  
- (-) Rutas que llaman APIs externas sin DB query son vulnerables  
- **Accion requerida:** Implementar verificacion antes de launch  

### DEC-004: RLS deshabilitado durante desarrollo
**Fecha:** 2025-xx-xx | **Status:** Accepted (temporal, DEFERRED)  
**Contexto:** Configurar RLS para 43 tablas con 4 roles es un proyecto en si mismo. Priorizamos feature completeness.  
**Decision:** 0 RLS policies. Toda autorizacion en codigo del backend (parcial).  
**Consecuencias:**  
- (+) Velocidad de desarrollo  
- (-) Sin segunda linea de defensa  
- (-) Si el backend tiene un bug de auth, no hay safety net  
- **Accion requerida:** RLS completo antes de datos reales  

### DEC-005: Flat routes con query params (no REST anidado)
**Fecha:** 2025-xx-xx | **Status:** Accepted  
**Contexto:** REST anidado (`/institutions/:id/courses/:id/semesters`) crea URLs largas y coupling entre entidades.  
**Decision:** Rutas planas: `GET /semesters?course_id=xxx`  
**Consecuencias:**  
- (+) Mas simple de implementar y debuggear  
- (+) El CRUD factory funciona uniformemente  
- (-) El cliente necesita conocer los foreign keys  

### DEC-006: Stripe fetch wrapper en lugar de SDK
**Fecha:** 2025-xx-xx | **Status:** Accepted  
**Contexto:** El Stripe SDK oficial no funciona bien en Deno/Edge runtime (depende de Node.js APIs).  
**Decision:** Wrapper minimo con `fetch()` + `application/x-www-form-urlencoded`.  
**Consecuencias:**  
- (+) Funciona en Edge sin polyfills  
- (+) Zero dependencies adicionales  
- (-) Menos type safety que el SDK  
- (-) Hay que mantener el encoding manualmente  

### DEC-007: In-memory rate limiting
**Fecha:** 2026-02-27 | **Status:** Accepted (con limitaciones conocidas)  
**Contexto:** Necesitabamos rate limiting sin dependencia externa (Redis, etc.).  
**Decision:** Map<string, RateLimitEntry> en memoria del isolate Deno.  
**Consecuencias:**  
- (+) Zero latency, zero dependencies  
- (-) Se resetea en cada deploy  
- (-) No funciona across multiple isolates (si se escala horizontalmente)  
- **Cuando escalar:** Migrar a Upstash Redis cuando haya >1 isolate  

### DEC-008: Fallback pattern para DB functions
**Fecha:** 2026-02-27 | **Status:** Accepted  
**Contexto:** Deployar backend y correr migraciones son pasos separados. El backend puede deployarse antes de que la migracion exista.  
**Decision:** Toda ruta que use un RPC intenta el RPC primero; si falla con "function not found", usa el patron anterior.  
**Consecuencias:**  
- (+) Zero-downtime deploys  
- (+) Permite probar el backend sin la migracion  
- (-) Codigo mas largo (try primary → catch fallback)  
- (-) Fallback puede tener peor performance  

### DEC-009: validate.ts sin Zod
**Fecha:** 2025-xx-xx | **Status:** Accepted  
**Contexto:** Zod es excelente pero agrega ~50KB al bundle del Edge Function y tiene overhead de parsing.  
**Decision:** Validators puros: type guards + `validateFields()` declarativo.  
**Consecuencias:**  
- (+) Zero dependencies, ~5KB, mas rapido que Zod  
- (+) Facil de extender  
- (-) No genera types automaticamente (hay que mantener guards y types separados)  
- (-) Menos expresivo que Zod schemas  

---

### DEC-010: Move git repos OUT of OneDrive
**Fecha:** 2026-03-21 | **Status:** Accepted
**Contexto:** OneDrive corrupted .git/ directories for both frontend and backend repos (error 0x8007017F). Files showed as "arquivo ilegível", git commands failed.
**Decision:** Move all git repos to C:\dev\axon\ (outside OneDrive). OneDrive only for documents, prototypes, and Cowork data.
**Consecuencias:**
- (+) No more .git corruption, node_modules sync errors, or .lock file conflicts
- (+) GitHub is the backup for code, OneDrive for docs
- (-) Code not synced between machines (need git push/pull)

### DEC-011: Mandatory git worktrees for branch work
**Fecha:** 2026-03-27 | **Status:** Accepted
**Contexto:** Multiple Claude Code sessions sharing C:\dev\axon\frontend caused commits on wrong branches when one session did git checkout.
**Decision:** NEVER git checkout <branch> in main repo. Always use git worktree add for branch work. post-checkout hooks warn if non-main checkout in main repo.
**Consecuencias:**
- (+) Complete session isolation — no more cross-contamination
- (+) Main repo always stays on main
- (-) Extra disk space for worktrees
- (-) Must remember to worktree remove after merge

### DEC-012: 74-agent specialized system with file ownership
**Fecha:** 2026-03-25 | **Status:** Accepted
**Contexto:** The codebase (~540 files) needed structured agent coverage. Initial approach was ad-hoc agent creation per task.
**Decision:** Create 74 specialized agents in 12 sections, each with explicit file ownership (zero overlap). Agents do recon → fix in batches. Quality gate agent (XX-02) audits after every session.
**Consecuencias:**
- (+) Clear ownership — no file conflicts between agents
- (+) Recon phase builds deep context per domain
- (+) Quality gate catches cross-file bugs agents miss
- (-) Large upfront setup cost (74 agent definitions)
- (-) Max 5 opus agents simultaneously (API limits)

### DEC-013: Cowork as command center, Claude Code CLI for execution
**Fecha:** 2026-03-22 | **Status:** Accepted
**Contexto:** Needed separation between planning/thinking and code execution.
**Decision:** Cowork (desktop, OneDrive-synced) is for thinking, planning, investigating, and organizing. Claude Code CLI is for actual code changes in feature branches.
**Consecuencias:**
- (+) State persists across machines via OneDrive .auto-memory/
- (+) Clear separation: plan here, execute there
- (-) Can't execute code changes directly from Cowork
- (-) Handoff between Cowork and CLI requires clear instructions

### DEC-014: Personalization focus — only 3 features for Sprint 0
**Fecha:** 2026-03-22 | **Status:** Accepted
**Contexto:** 195KB document of personalization ideas generated. Risk of scope explosion.
**Decision:** Only 3 items approved for now: (1) Badges de Esfuerzo, (2) Calibración Adaptativa de Dificultad, (3) Calendario Inteligente + Objetivos (consolidating ideas 1.7 + 3.1). Everything else deferred.
**Consecuencias:**
- (+) Extreme focus — no feature creep
- (+) All 3 build on existing infrastructure (FSRS, gamification, calendar)
- (-) Many interesting ideas explicitly deferred

### DEC-015: FSRS v4 + BKT v4 dual algorithm for adaptive learning
**Fecha:** 2025-xx-xx | **Status:** Accepted
**Contexto:** Needed spaced repetition for flashcards AND knowledge tracing for quizzes.
**Decision:** Use FSRS v4 for flashcard scheduling (when to review) and BKT v4 for quiz-based knowledge estimation (what the student knows). Both feed into the same mastery model.
**Consecuencias:**
- (+) Best-in-class algorithms for each use case
- (+) Combined mastery signal more accurate than either alone
- (-) Two algorithm implementations to maintain
- (-) Need careful calibration of how they interact

## Template para Nuevas Decisiones

```markdown
### DEC-0XX: [Titulo]
**Fecha:** YYYY-MM-DD | **Status:** Accepted
**Contexto:**
**Decision:**
**Consecuencias:**
- (+)
- (-)
```
