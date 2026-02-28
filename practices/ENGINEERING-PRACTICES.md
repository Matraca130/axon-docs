# Practicas de Ingenieria — Axon v4.4+

> **Proposito:** Guia viva de practicas arquitecturales, de performance, seguridad y modularizacion para que Axon pueda evolucionar y escalar sin reescrituras.
>
> **Audiencia:** Cualquier desarrollador (humano o AI) que toque el codebase.
>
> **Fecha:** 2026-02-28 | **Basado en:** Analisis completo del backend (16 archivos), axon-docs (9 schemas, 4 auditorias), y PLATFORM-CONTEXT.md.

---

## Tabla de Contenidos

1. [Principios Fundamentales](#1-principios-fundamentales)
2. [Backend — Modularizacion](#2-backend--modularizacion)
3. [Backend — Patron de Ruta](#3-backend--patron-de-ruta)
4. [Base de Datos — Practicas SQL](#4-base-de-datos--practicas-sql)
5. [Performance — Reglas No Negociables](#5-performance--reglas-no-negociables)
6. [Seguridad — Checklist por Ruta](#6-seguridad--checklist-por-ruta)
7. [API Design — Contratos Estables](#7-api-design--contratos-estables)
8. [Testing — Estrategia por Capa](#8-testing--estrategia-por-capa)
9. [Frontend — Arquitectura de Consumo](#9-frontend--arquitectura-de-consumo)
10. [Migraciones — Protocolo de Seguridad](#10-migraciones--protocolo-de-seguridad)
11. [Documentacion — Fuente de Verdad](#11-documentacion--fuente-de-verdad)
12. [Checklist Pre-Implementacion](#12-checklist-pre-implementacion)

---

## 1. Principios Fundamentales

Estos principios gobiernan TODAS las decisiones. Cuando haya conflicto, resuelve en este orden:

### 1.1 Evolve, Don't Replace

Nunca reescribir un modulo funcional. Extender el existente. Si un cambio rompe la firma de una funcion exportada, es una senal de que estas reemplazando en vez de evolucionando.

```
// MAL: Reescribir crud-factory.ts para agregar una feature
// BIEN: Agregar un nuevo flag al CrudConfig interface
```

### 1.2 Fail Fast, Fail Loud

Toda validacion de input ocurre ANTES de tocar la base de datos. Todo error se loguea con contexto suficiente para reproducir.

```typescript
// MAL: Dejar que PostgreSQL rechace un UUID invalido
// BIEN: if (!isUuid(body.session_id)) return err(c, "...", 400);
```

### 1.3 Computar en SQL, No en JavaScript

Si una operacion involucra filtrar, agregar, o transformar datos de multiples rows, SIEMPRE preferir un RPC/function SQL sobre fetching + procesamiento en JS.

```
// MAL: fetch 5000 rows → .filter() → .reduce() en Deno
// BIEN: SELECT COUNT(*), AVG(completion_percentage) FROM video_views WHERE ...
```

### 1.4 Graceful Degradation with Fallback

Toda feature nueva que dependa de un RPC o migracion SQL debe tener fallback al patron anterior. Esto permite deployer backend antes que la migracion corra.

```typescript
const { data, error } = await db.rpc("new_function", params);
if (!error) return ok(c, data);  // Primary path
// Fallback: old pattern
console.warn(`[route] RPC failed, using fallback: ${error.message}`);
```

### 1.5 Institution-Scoped Everything

Axon es multi-tenant. TODA query que toque datos de usuario debe filtrar por `institution_id` directa o indirectamente. Si una ruta no tiene `institution_id` en su query, es un bug de diseno.

---

## 2. Backend — Modularizacion

### 2.1 Estructura Actual (Monolito)

```
supabase/functions/server/
  index.ts              ← Entrypoint (routing + middleware)
  db.ts                 ← Clients, auth, helpers
  crud-factory.ts       ← CRUD generico
  validate.ts           ← Validacion runtime
  rate-limit.ts         ← Rate limiting
  timing-safe.ts        ← Crypto utility
  routes-{domain}.ts    ← 12 modulos de rutas
  tests/                ← Deno-native tests (canonico)
```

### 2.2 Reglas de Modularizacion

**Regla 1: Un archivo de ruta por dominio de negocio.**

Cada `routes-*.ts` maneja UN dominio y no importa de otros route files.

```
routes-auth.ts      → Solo auth y profiles
routes-content.ts   → Solo jerarquia de contenido
routes-study.ts     → Solo sesiones, reviews, estados
```

**Regla 2: Utilidades compartidas van en archivos dedicados, nunca en route files.**

```
db.ts           → authenticate(), ok(), err(), safeJson()
validate.ts     → isUuid(), validateFields(), etc.
rate-limit.ts   → rateLimitMiddleware()
```

Si necesitas un helper que usa dos o mas rutas, crealo como archivo separado:
```
require-role.ts   → requireRole() middleware
cache.ts          → in-memory TTL cache
request-id.ts     → X-Request-Id middleware
```

**Regla 3: NUNCA exportar funciones internas de un route file.**

Si `routes-content.ts` tiene una funcion util, y `routes-search.ts` la necesita, MUEVELA a un archivo compartido. No crees dependencias cruzadas entre routes.

**Regla 4: El crud-factory.ts es SAGRADO.**

No modificarlo para agregar logica especifica de una tabla. En su lugar, registrar la tabla con CRUD factory y crear rutas custom adicionales en el mismo route file.

```typescript
// BIEN: Factory para CRUD basico + ruta custom para logica especial
registerCrud(app, { table: "courses", ... });
app.get(`${PREFIX}/content-tree`, async (c) => { /* custom logic */ });
```

### 2.3 Cuando Separar en Multiples Edge Functions

No separar ahora. Separar cuando:
- Cold start > 500ms (medir con `console.time`)
- Memory usage > 128MB consistentemente
- Un dominio necesita scaling independiente (e.g., webhooks)

Cuando llegue el momento, separar asi:

```
supabase/functions/api/         ← CRUD + search + content (80% del trafico)
supabase/functions/webhooks/    ← Stripe + Mux (no auth, HMAC)
supabase/functions/study/       ← Study queue + sessions (CPU-intensive)
supabase/functions/storage/     ← Uploads (memory-intensive)
```

Compartir codigo entre functions via un directorio `_shared/`:
```
supabase/functions/_shared/
  db.ts
  validate.ts
  require-role.ts
```

---

## 3. Backend — Patron de Ruta

### 3.1 Anatomia de una Ruta

TODA ruta sigue esta secuencia exacta:

```typescript
app.post(`${PREFIX}/resource`, async (c: Context) => {
  // 1. AUTENTICACION
  const auth = await authenticate(c);
  if (auth instanceof Response) return auth;
  const { user, db } = auth;

  // 2. AUTORIZACION (cuando aplique)
  const roleErr = await requireRole(c, db, user.id, institutionId, ["owner", "admin"]);
  if (roleErr) return roleErr;

  // 3. PARSING + VALIDACION (todo ANTES de tocar DB)
  const body = await safeJson(c);
  if (!body) return err(c, "Invalid or missing JSON body", 400);
  if (!isUuid(body.target_id)) return err(c, "target_id must be a valid UUID", 400);
  const { fields, error: valErr } = validateFields(body, rules);
  if (valErr) return err(c, valErr, 400);

  // 4. LOGICA DE NEGOCIO (queries, RPCs, external APIs)
  const { data, error } = await db.from("table").insert(row).select().single();
  if (error) return err(c, `Create failed: ${error.message}`, 500);

  // 5. RESPUESTA
  return ok(c, data, 201);
});
```

**NUNCA mezclar estos pasos.** No validar despues de un INSERT. No hacer auth despues de parsear el body.

### 3.2 Patron para Rutas que Llaman APIs Externas

Rutas que llaman Stripe, Mux, OpenAI, etc. requieren verificacion EXTRA del JWT porque el admin client no valida el token:

```typescript
// ANTES de llamar a una API externa con user.id:
// Hacer una query canary a la DB para forzar validacion del JWT
const { error: canaryErr } = await db.from("profiles").select("id").eq("id", user.id).single();
if (canaryErr) return err(c, "Invalid user token", 401);

// Ahora si, llamar a la API externa
await stripe.request("POST", "/checkout/sessions", { ...params });
```

### 3.3 Naming Conventions

| Elemento | Convencion | Ejemplo |
|----------|------------|--------|
| Archivo de ruta | `routes-{dominio}.ts` | `routes-billing.ts` |
| Extension | `.ts` (nunca `.tsx` sin JSX) | |
| Variable de ruta | `{dominio}Routes` | `billingRoutes` |
| Ruta URL | kebab-case | `/study-sessions` |
| Tabla DB | snake_case | `study_sessions` |
| Slug en factory | kebab-case | `study-sessions` |
| Query params | snake_case | `?institution_id=` |
| Helper compartido | kebab-case filename | `require-role.ts` |

---

## 4. Base de Datos — Practicas SQL

### 4.1 Migraciones

Toda migracion SQL sigue este template:

```sql
-- ============================================================
-- TICKET-ID: Descripcion corta
-- ============================================================
-- Contexto: por que existe esta migracion
-- Impacto: que queries mejora/cambia
-- Rollback: como revertir
--
-- Run in: Supabase SQL Editor
-- ============================================================

-- El DDL aqui (CREATE, ALTER, etc.)

-- Verification query:
-- SELECT ... FROM ... WHERE ...;
```

**Reglas:**
- TODA migracion es idempotente (`IF NOT EXISTS`, `CREATE OR REPLACE`)
- TODA migracion tiene query de verificacion
- TODA migracion tiene instruccion de rollback
- Nombrar: `YYYYMMDD_NN_descripcion.sql`
- Archivo va en `migrations/` del repo backend

### 4.2 Cuando Crear un RPC (DB Function)

Crear un RPC cuando:

| Criterio | Ejemplo en Axon |
|----------|------------------|
| Operacion atomica que no puede ser un upsert simple | `upsert_video_view()` — increment + conditional logic |
| Query que JOIN 3+ tablas | `get_content_tree()` — courses → semesters → sections → topics |
| Aggregacion sobre muchas rows | Video stats: `COUNT, AVG, SUM` |
| Batch operation | `bulk_reorder()` — N updates en 1 call |
| Logica que filtra en niveles anidados | Content tree: filtrar is_active en cada nivel |

NO crear un RPC cuando:
- Es un simple CRUD (el factory ya lo maneja)
- Es un SELECT con 1-2 filtros (PostgREST es suficiente)
- La logica es de negocio, no de datos (mantenerla en Hono)

### 4.3 Indexes

Crear indexes para:

| Patron de Query | Tipo de Index |
|-----------------|---------------|
| `WHERE column = value` (FK lookups) | B-tree (default, PostgreSQL lo crea con FK) |
| `WHERE column ILIKE '%text%'` | GIN con pg_trgm |
| `WHERE column @> '{...}'` (JSONB contains) | GIN |
| Composite: `WHERE a = x AND b = y` | B-tree composite `(a, b)` |
| Unique constraint: `ON CONFLICT (a, b)` | UNIQUE index `(a, b)` |

**Regla:** Verificar con `EXPLAIN ANALYZE` antes y despues en queries lentas.

### 4.4 Multi-tenancy en Queries

TODA query visible al usuario filtra por `institution_id`, directa o indirectamente:

```sql
-- Directo (tablas que tienen institution_id)
SELECT * FROM courses WHERE institution_id = $1;

-- Indirecto (tablas hijas que heredan scope via FK chain)
SELECT s.* FROM summaries s
  JOIN topics t ON s.topic_id = t.id
  JOIN sections sec ON t.section_id = sec.id
  JOIN semesters sem ON sec.semester_id = sem.id
  JOIN courses c ON sem.course_id = c.id
WHERE c.institution_id = $1;
```

El crud-factory maneja esto via `parentKey`. Para rutas custom, verificar manualmente.

---

## 5. Performance — Reglas No Negociables

### Regla 1: Todo LIST tiene Paginacion

Sin excepciones. Toda ruta que devuelve una lista DEBE tener `limit` (con MAX cap) y `offset`.

```typescript
const MAX = 500;
let limit = parseInt(c.req.query("limit") ?? "100", 10);
if (isNaN(limit) || limit < 1) limit = 100;
if (limit > MAX) limit = MAX;
let offset = parseInt(c.req.query("offset") ?? "0", 10);
if (isNaN(offset) || offset < 0) offset = 0;
query = query.range(offset, offset + limit - 1);
```

### Regla 2: Nunca `.select("*")` en Queries de Lista

Seleccionar solo las columnas necesarias:

```typescript
// MAL
db.from("summaries").select("*")

// BIEN
db.from("summaries").select("id, title, topic_id, is_active, order_index")
```

Excepcion: GET by ID puede usar `select("*")` porque es 1 row.

### Regla 3: Queries Independientes Siempre en Parallel

```typescript
// MAL: Secuencial
const bkt = await db.from("bkt_states").select(...);
const fsrs = await db.from("fsrs_states").select(...);
const cards = await db.from("flashcards").select(...);

// BIEN: Paralelo
const [bkt, fsrs, cards] = await Promise.all([
  db.from("bkt_states").select(...),
  db.from("fsrs_states").select(...),
  db.from("flashcards").select(...),
]);
```

### Regla 4: Agregaciones en SQL, No en JS

```typescript
// MAL: Fetch 5000 rows y reducir en JS
const { data: views } = await db.from("video_views").select("*").eq("video_id", id);
const avg = views.reduce((s, v) => s + v.completion_percentage, 0) / views.length;

// BIEN: SQL aggregation
const { data } = await db.rpc("get_video_stats", { p_video_id: id });
// O al menos:
const { data } = await db.from("video_views")
  .select("video_id", { count: "exact", head: true })
  .eq("video_id", id);
```

### Regla 5: Batch Operations con Limites

Todo batch (reorder, bulk delete, bulk create) tiene un MAX_ITEMS:

```typescript
const MAX_BATCH = 200;
if (items.length > MAX_BATCH) {
  return err(c, `Max ${MAX_BATCH} items per batch`, 400);
}
```

### Regla 6: Caching para Datos Semi-Estaticos

Datos que cambian pocas veces deben tener cache:

```typescript
// Patron: in-memory Map con TTL
const cache = new Map<string, { data: unknown; expiresAt: number }>();

function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data as T;
  return fetcher().then(data => {
    cache.set(key, { data, expiresAt: Date.now() + ttlMs });
    return data;
  });
}

// Uso:
const tree = await getCached(
  `content-tree:${institutionId}`,
  60_000, // 1 minuto
  () => db.rpc("get_content_tree", { p_institution_id: institutionId })
);
```

Candidatos para cache:
- Content tree (TTL: 60s)
- Institution plans (TTL: 300s)
- Platform plans (TTL: 600s)

---

## 6. Seguridad — Checklist por Ruta

### 6.1 Clasificacion de Rutas

Toda ruta cae en una de estas categorias:

| Tipo | Auth | Role Check | Ejemplo |
|------|------|------------|--------|
| **Publico** | No | No | `GET /health` |
| **Webhook** | HMAC | No | `POST /webhooks/stripe` |
| **Autenticado** | JWT | No | `GET /me` |
| **Role-Gated** | JWT | Si | `POST /courses` (professor+) |
| **Owner-Only** | JWT | Si | `DELETE /institutions/:id` |

### 6.2 Checklist por Ruta Nueva

Antes de mergear cualquier ruta nueva:

- [ ] **Auth:** Usa `authenticate(c)` y hace early return?
- [ ] **Role:** Tiene check de rol si modifica datos de institucion?
- [ ] **Validation:** Todo input validado con `validate.ts` (no typeof inline)?
- [ ] **Scope:** Filtra por `institution_id` o `user_id` segun corresponda?
- [ ] **Pagination:** Si es LIST, tiene limit + offset con MAX cap?
- [ ] **Error:** Errores logeados con `err()` y status code correcto?
- [ ] **External API:** Si llama API externa, tiene canary query antes?
- [ ] **Test:** Tiene al menos un test unitario?

### 6.3 Role Matrix de Axon

| Accion | Student | Professor | Admin | Owner |
|--------|---------|-----------|-------|-------|
| Ver contenido de su seccion | Si | Si | Si | Si |
| Crear notas personales | Si | - | - | - |
| Crear/editar contenido (summaries, keywords) | - | Si | Si | Si |
| Crear flashcards/quizzes | - | Si | Si | Si |
| Gestionar miembros | - | - | Si | Si |
| Gestionar planes/billing | - | - | - | Si |
| Eliminar institucion | - | - | - | Si |

Esta matriz DEBE implementarse como middleware `requireRole()`.

---

## 7. API Design — Contratos Estables

### 7.1 Response Format (estandar)

```typescript
// Exito — item singular
{ "data": { id: "...", ... } }

// Exito — lista paginada (factory)
{ "data": { "items": [...], "total": 42, "limit": 20, "offset": 0 } }

// Exito — lista custom
{ "data": { "results": [...], "meta": { ... } } }

// Error
{ "error": "Human-readable message", "code": "ERROR_CODE" }
```

### 7.2 Error Codes (adoptar gradualmente)

| Code | HTTP Status | Significado |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input invalido |
| `AUTH_REQUIRED` | 401 | Sin token o token expirado |
| `AUTH_INVALID` | 401 | Token invalido/malformado |
| `FORBIDDEN` | 403 | Sin permisos para esta accion |
| `NOT_FOUND` | 404 | Recurso no encontrado |
| `CONFLICT` | 409 | Duplicado o conflicto de estado |
| `RATE_LIMITED` | 429 | Rate limit excedido |
| `INTERNAL_ERROR` | 500 | Error interno del servidor |
| `UPSTREAM_ERROR` | 502 | Error en API externa (Stripe, Mux) |

### 7.3 Versionado de API

Actualmente no hay versionado (todas las rutas son `/server/resource`). Cuando se necesite:

```
Phase 1 (actual): /server/resource
Phase 2 (breaking change): /server/v2/resource (coexiste con v1)
Phase 3 (deprecation): v1 devuelve header Deprecation: true
```

NO versionear prematuramente. Solo cuando un cambio rompe el contrato del frontend.

---

## 8. Testing — Estrategia por Capa

### 8.1 Directorio Canonico

```
supabase/functions/server/tests/    ← UNICO directorio de tests
  {module}_test.ts                   ← Deno.test() native
```

Eliminar `__tests__/`. No usar Jest. Deno tiene test runner nativo.

### 8.2 Que Testear

| Capa | Tipo | Que testear | Prioridad |
|------|------|-------------|----------|
| Utilidades puras | Unit | validate.ts, timing-safe.ts, rate-limit.ts | ALTA |
| Logica de negocio | Unit | NeedScore calculation, path resolution | ALTA |
| Route handlers | Integration | Request completo con mock de DB | MEDIA |
| CRUD factory | Integration | Que genera los endpoints correctos | BAJA |
| Full flow | E2E | Signup → create content → study | BAJA (manual por ahora) |

### 8.3 Template de Test

```typescript
import { assertEquals, assertThrows } from "https://deno.land/std/assert/mod.ts";
import { functionToTest } from "../module.ts";

Deno.test("functionToTest — caso normal", () => {
  const result = functionToTest(validInput);
  assertEquals(result, expectedOutput);
});

Deno.test("functionToTest — caso edge", () => {
  const result = functionToTest(edgeInput);
  assertEquals(result, expectedEdgeOutput);
});

Deno.test("functionToTest — input invalido", () => {
  assertThrows(() => functionToTest(invalidInput));
});
```

### 8.4 Correr Tests

```bash
# Todos los tests
deno test supabase/functions/server/tests/

# Un archivo especifico
deno test supabase/functions/server/tests/validate_test.ts

# Con coverage
deno test --coverage=cov_profile supabase/functions/server/tests/
```

---

## 9. Frontend — Arquitectura de Consumo

### 9.1 Capa de API

Todo acceso al backend pasa por `platformApi.ts`. NUNCA hacer `fetch()` directo desde un componente.

```typescript
// platformApi.ts — estructura ideal
export const platformApi = {
  // Auth
  getMe: () => api.get("/me"),
  updateMe: (data) => api.put("/me", data),

  // Content (generado o manual)
  courses: crudEndpoints("courses"),
  semesters: crudEndpoints("semesters"),
  // ...

  // Custom
  getContentTree: (institutionId: string) =>
    api.get(`/content-tree?institution_id=${institutionId}`),
  search: (q: string, type?: string) =>
    api.get(`/search?q=${encodeURIComponent(q)}&type=${type ?? "all"}`),
};
```

### 9.2 Patron: Factory de CRUD en Frontend

Mirror del backend. Si el backend tiene `crud-factory.ts`, el frontend debe tener un helper equivalente:

```typescript
function crudEndpoints(slug: string) {
  return {
    list: (params: Record<string, string>) =>
      api.get(`/${slug}?${new URLSearchParams(params)}`),
    get: (id: string) => api.get(`/${slug}/${id}`),
    create: (data: unknown) => api.post(`/${slug}`, data),
    update: (id: string, data: unknown) => api.put(`/${slug}/${id}`, data),
    delete: (id: string) => api.delete(`/${slug}/${id}`),
  };
}
```

### 9.3 State Management

Para Axon, usar esta jerarquia:

| Tipo de Estado | Solucion | Ejemplo |
|----------------|----------|---------|
| Server state (DB data) | React Query / SWR / custom hook | Contenido, flashcards, sessions |
| UI state local | `useState` | Modal abierto, tab activo |
| UI state compartido | Context | Tema, sidebar abierto |
| Auth state | Context + Supabase listener | User, token, role |
| Form state | `react-hook-form` | Crear curso, editar summary |

**Regla:** NO usar Context para datos del servidor. Context no tiene cache, refetch, ni stale-while-revalidate.

### 9.4 Patron de Data Loading

```typescript
// Hook custom por entidad
function useContentTree(institutionId: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    platformApi.getContentTree(institutionId)
      .then(res => setData(res.data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [institutionId]);

  return { data, loading, error, refetch: () => { /* ... */ } };
}
```

### 9.5 Separacion de Componentes

```
src/app/
  components/
    layout/          ← Shell, sidebar, nav, user dropdown
    content/         ← Content tree, summary viewer, keyword cards
    study/           ← Flashcard deck, quiz player, study session
    admin/           ← Institution settings, member management
    shared/          ← Button, Modal, Toast, ErrorBoundary
  context/           ← Auth, theme, institution
  hooks/             ← useContentTree, useStudyQueue, etc.
  lib/               ← platformApi, formatters, constants
  pages/             ← Route-level components
```

---

## 10. Migraciones — Protocolo de Seguridad

### 10.1 Flujo de Migracion

```
1. Escribir SQL en migrations/YYYYMMDD_NN_descripcion.sql
2. Incluir rollback y verification query
3. Commit al repo axon-backend
4. Deploy backend (con fallback — no depende de la migracion)
5. Correr migracion en Supabase SQL Editor
6. Verificar con el query de verificacion
7. Confirmar que la ruta usa el path primario (RPC) en lugar del fallback
```

### 10.2 Reglas de Migracion

- **NUNCA** hacer `DROP TABLE` o `DROP COLUMN` sin migracion previa que elimine las referencias
- **NUNCA** renombrar columnas — agregar la nueva, migrar datos, deprecar la vieja
- **SIEMPRE** `IF NOT EXISTS` / `CREATE OR REPLACE`
- **SIEMPRE** testear en un proyecto Supabase de staging primero (cuando exista)

### 10.3 Tipos de Migracion por Riesgo

| Tipo | Riesgo | Requiere downtime? |
|------|--------|-------------------|
| Crear funcion RPC | Nulo | No |
| Crear index | Bajo (bloqueo breve en tablas grandes) | No |
| Crear tabla | Nulo | No |
| Agregar columna nullable | Nulo | No |
| Agregar columna NOT NULL con default | Bajo | No |
| Cambiar tipo de columna | ALTO | Posiblemente |
| Drop column/table | CRITICO | Si, coordinado |

---

## 11. Documentacion — Fuente de Verdad

### 11.1 axon-docs es la Fuente de Verdad

Todo conocimiento del proyecto vive en `Matraca130/axon-docs`. Los repos de codigo (backend, frontend) contienen solo READMEs basicos de setup.

### 11.2 Estructura de axon-docs

```
axon-docs/
  PLATFORM-CONTEXT.md    ← Resumen para pegar al inicio de sesiones AI
  API-MAP.md             ← Mapa de rutas (mantener actualizado)
  KNOWN-BUGS.md          ← Bugs conocidos y su status
  context/               ← Arquitectura, auth, auditorias
  database/              ← Schemas, constraints, RLS
  frontend/              ← Build errors, bundle, API map
  diagnostics/           ← Analisis de performance y seguridad
  practices/             ← ESTE archivo y guias de ingenieria
```

### 11.3 Cuando Actualizar Documentacion

| Evento | Que actualizar |
|--------|---------------|
| Nueva ruta en backend | API-MAP.md |
| Nueva tabla/columna | database/schema-*.md |
| Bug encontrado | KNOWN-BUGS.md |
| Bug resuelto | KNOWN-BUGS.md (status → RESOLVED) |
| Migracion creada | Commit en migrations/ + database/*.md |
| Auditoria realizada | diagnostics/ |
| Cambio arquitectural | context/ + PLATFORM-CONTEXT.md |

---

## 12. Checklist Pre-Implementacion

Copiar y llenar ANTES de empezar cualquier feature nueva:

```markdown
## Pre-Implementation Checklist: [FEATURE NAME]

### Impacto
- [ ] Que archivos se modifican?
- [ ] Que tablas se tocan?
- [ ] Requiere migracion SQL?
- [ ] Rompe alguna API existente?

### Seguridad
- [ ] La ruta necesita auth? (authenticate)
- [ ] Necesita role check? (requireRole)
- [ ] Toca API externa? (canary query)
- [ ] Input validado con validate.ts?

### Performance
- [ ] LIST tiene paginacion?
- [ ] Queries usan select() especifico (no *)?
- [ ] Queries independientes en Promise.all?
- [ ] Aggregaciones en SQL (no JS reduce)?

### Testing
- [ ] Tiene test unitario para logica pura?
- [ ] Casos edge cubiertos?

### Documentacion
- [ ] API-MAP.md actualizado?
- [ ] Schema docs actualizado si hay cambios de DB?
- [ ] KNOWN-BUGS.md actualizado si resuelve un bug?
```
