# Diagnostico del Backend — Axon v4.4

> **Fecha:** 2026-02-28  
> **Scope:** `Matraca130/axon-backend` — Hono Edge Function (Deno)  
> **Archivos analizados:** 16 source files, 5 test files, 4 migrations  
> **Metodo:** Lectura linea por linea de todo el codigo fuente  

---

## Resumen Ejecutivo

El backend de Axon tiene una **arquitectura solida y bien pensada**. El `crud-factory.ts` es un patron excelente que elimina codigo repetitivo para ~15 tablas. El sistema de validacion (`validate.ts`) es limpio y extensible. Los comentarios son de alta calidad — explican el *por que*, no solo el *que*.

Sin embargo, hay **3 problemas criticos de seguridad** que deben resolverse antes de cualquier uso con datos reales, y varias oportunidades de performance que impactaran a escala.

### Scorecard

| Eje | Nota | Detalle |
|-----|------|---------|
| Seguridad | **D** | JWT sin verificar + RLS deshabilitado = sin autorizacion real |
| Performance | **B-** | Buenas bases, pero N+1 y fetches sin limite en rutas criticas |
| Escalabilidad | **B** | Edge Function monolitica pero adecuada para MVP |
| Mantenibilidad | **A-** | Excelente estructura, CRUD factory, buena documentacion |
| Calidad de Codigo | **B+** | Patrones consistentes, validacion robusta, pocos `any` |

---

## 1. SEGURIDAD

### 1.1 CRITICO — JWT Sin Verificacion Criptografica (BUG-003)

**Archivo:** `db.ts` lineas 85-105 (`decodeJwtPayload`)  
**Status:** Documentado, DEFERRED  

```
El JWT NUNCA se verifica criptograficamente en el backend.
authenticate() solo hace base64 decode del payload.
```

**Impacto real con RLS deshabilitado:**
- Un atacante puede construir un JWT con `{"sub": "cualquier-user-id"}` y acceder a TODOS los datos
- Rutas que llaman APIs externas (Stripe checkout, Mux create-upload) usan `user.id` del JWT falso → consumo de creditos pagados
- El comentario en db.ts dice "PostgREST/RLS handles that" pero RLS tiene 0 policies

**Solucion recomendada (Phase 1 — minimo viable):**
```typescript
// En authenticate(), agregar verificacion via network:
const { data: { user }, error } = await getAdminClient().auth.getUser(token);
if (error) return err(c, "Invalid token", 401);
```
Costo: ~50ms adicionales por request (1 network call a Supabase Auth).  
Alternativa (Phase 2): Verificar localmente con `jose` + `SUPABASE_JWT_SECRET`.

### 1.2 CRITICO — Sin Autorizacion por Roles en Codigo

**Archivos:** `routes-members.tsx`, `routes-content.tsx`, `routes-storage.tsx`  

Los comentarios dicen "Authorization enforced by RLS" pero RLS esta deshabilitado. Esto significa:

| Ruta | Riesgo |
|------|--------|
| `POST /memberships` | Cualquier usuario puede agregar a CUALQUIER usuario a CUALQUIER institucion con rol "owner" |
| `PUT /institutions/:id` | Cualquier usuario puede editar CUALQUIER institucion |
| `DELETE /institutions/:id` | Cualquier usuario puede desactivar CUALQUIER institucion |
| `POST /kw-prof-notes` | Un estudiante puede crear notas de profesor |
| `DELETE /keyword-connections/:id` | Sin verificacion de permisos |
| `DELETE /kw-prof-notes/:id` | Sin verificacion de permisos |

**Solucion recomendada:**
Crear un middleware `requireRole()` que consulte la tabla `memberships`:
```typescript
async function requireRole(c: Context, db: SupabaseClient, userId: string, 
  institutionId: string, allowedRoles: string[]): Promise<Response | null> {
  const { data } = await db.from("memberships")
    .select("role").eq("user_id", userId)
    .eq("institution_id", institutionId).eq("is_active", true).single();
  if (!data || !allowedRoles.includes(data.role)) {
    return err(c, "Insufficient permissions", 403);
  }
  return null;
}
```

### 1.3 CRITICO — CORS origin: "*" (BUG-004)

**Archivo:** `index.ts` linea 32  
**Status:** Documentado, DEFERRED  

Cualquier sitio web puede hacer requests autenticados al backend. Combinado con la falta de verificacion JWT, un atacante solo necesita conocer el URL del backend.

**Solucion:** Restringir a dominios conocidos:
```typescript
origin: ["https://axon-app.vercel.app", "http://localhost:5173"]
```

### 1.4 ALTO — Storage Path Traversal

**Archivo:** `routes-storage.tsx` linea 205  

```typescript
const unauthorized = paths.filter((p: string) => !p.includes(`/${user.id}/`));
```

Este check es bypasseable. Un path como `evil/${user.id}/../../../other-user/secret.jpg` pasaria el `includes()` check pero resolveria a otro directorio.

**Solucion:**
```typescript
// Normalizar path y verificar que el segmento real contiene el user.id
const normalized = new URL(p, "file:///").pathname;
if (!normalized.startsWith(`/${folder}/${user.id}/`)) { ... }
```

### 1.5 ALTO — Rate Limiter Key Collision

**Archivo:** `rate-limit.ts` linea 37  

```typescript
function extractKey(token: string): string {
  return token.substring(0, 32);
}
```

Los primeros 32 caracteres de un JWT son el header (`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`), que es **identico para todos los usuarios** que usen el mismo algoritmo. Esto significa que el rate limiter trata a TODOS los usuarios como uno solo.

**Solucion:** Usar los ultimos 32 chars del payload, o mejor aun, un hash del token completo:
```typescript
function extractKey(token: string): string {
  // Use a portion of the payload, not the header
  const parts = token.split(".");
  return parts[1]?.substring(0, 32) ?? token.substring(0, 32);
}
```

### 1.6 MEDIO — Webhook Idempotency Incompleta (O-7)

**Archivo:** `routes-mux.ts`  

O-7 solo se implemento en `routes-billing.tsx` (Stripe). El webhook de Mux en `routes-mux.ts` **no tiene idempotency check**. Mux reintenta webhooks hasta 24 horas — un `video.asset.ready` duplicado podria causar updates innecesarios.

---

## 2. PERFORMANCE

### 2.1 CRITICO — Content Tree N+1 (N-5 Incompleto)

**Archivo:** `routes-content.tsx` lineas 329-371  

La migracion `get_content_tree()` existe pero el route **no fue actualizado** para usarla. Sigue usando el patron PostgREST embed + JS filter:

```
db.from("courses").select(`id, ..., semesters(id, ..., sections(id, ..., topics(id, ...)))`)  
→ Fetches ALL rows (including inactive/deleted)  
→ filterActiveTree() descarta en JavaScript  
```

**Impacto:** Con 100 courses × 10 semesters × 10 sections × 20 topics = 200,000 rows transferidos por request. La funcion SQL filtra en la DB y devuelve solo activos.

**Fix requerido:**
```typescript
// Primary: RPC call
const { data, error } = await db.rpc("get_content_tree", { p_institution_id: institutionId });
if (!error) return ok(c, data);
// Fallback: current PostgREST embed pattern
```

### 2.2 ALTO — Study Queue Sin Limite de Flashcards

**Archivo:** `routes-study-queue.tsx` linea ~170  

```typescript
const flashcardsQuery = db.from("flashcards").select(...)
  .is("deleted_at", null).eq("is_active", true);
// NO .limit() !!!
```

Fetches TODAS las flashcards activas de TODA la plataforma (no hay institution_id filter). Con 10,000 flashcards, esto son ~2MB de datos transferidos y procesados en JavaScript.

**Solucion:**  
1. Agregar `.limit(1000)` como safety cap  
2. Si hay `courseId`, filtrar en la query SQL (no post-filter en JS)  
3. Idealmente: crear un RPC que haga el JOIN + NeedScore calculation en SQL  

### 2.3 ALTO — Video Stats Agregacion en JavaScript

**Archivo:** `routes-mux.ts` lineas 327-348  

```typescript
const { data: views } = await db.from("video_views").select(...).eq("video_id", videoId);
// Then: views.reduce(...) in JS
```

Un video popular con 5,000 views = 5,000 rows transferidos para calcular un promedio. Deberia ser un `SELECT COUNT(*), AVG(completion_percentage), ...` o un RPC.

### 2.4 ALTO — Trash Query Sin Scope de Institucion

**Archivo:** `routes-search.ts` lineas 199-230  

El endpoint `GET /trash` busca items borrados en 5 tablas **sin filtrar por institution_id**. Esto es un full table scan × 5 tablas.

### 2.5 MEDIO — Migraciones Pendientes

| Migracion | Status | Impacto si no se aplica |
|-----------|--------|------------------------|
| `upsert_video_view` | PENDIENTE | Race condition en view tracking (fallback funciona pero no es atomico) |
| `get_content_tree` | PENDIENTE | N+1 en content tree (el route ni siquiera lo usa aun) |
| `trigram_indexes` | PENDIENTE | ILIKE search hace sequential scan en toda la tabla |
| `webhook_events_table` | PENDIENTE | Idempotency check falla silenciosamente (table doesn't exist) |

---

## 3. ESCALABILIDAD

### 3.1 ALTO — Monolito en Un Solo Edge Function

**Archivo:** `index.ts`  

Todas las rutas (auth, billing, mux, search, study, content, storage, models, plans) estan en un solo Deno isolate. Implicaciones:

- **Cold start:** Crece con cada archivo importado (~16 archivos hoy)
- **Memoria:** Compartida entre todas las rutas; un memory leak en study-queue afecta billing
- **Deployment:** Un fix en auth requiere re-deploy de todo el backend

**Para MVP:** Aceptable. No actuar ahora.  
**Para escala (>1000 usuarios):** Separar en:
- `auth-function` (signup, me)
- `api-function` (CRUD, search, study)
- `webhook-function` (stripe, mux)
- `storage-function` (upload, signed-url)

### 3.2 ALTO — Sin Caching

Ninguna ruta implementa cache. Rutas con datos que cambian pocas veces:

| Ruta | Frecuencia de cambio | Cache sugerido |
|------|---------------------|----------------|
| `GET /content-tree` | Minutos/horas | 60s TTL |
| `GET /institution-plans` | Dias | 300s TTL |
| `GET /platform-plans` | Semanas | 600s TTL |
| `GET /institutions` | Horas | 60s TTL |

Implementacion: `Cache-Control` headers + edge caching, o in-memory Map con TTL.

### 3.3 MEDIO — Sin Paginacion en Varias Rutas

| Ruta | Sin paginacion |
|------|---------------|
| `GET /memberships` | Lista todos los miembros |
| `GET /admin-scopes` | Lista todos los scopes |
| `GET /kw-prof-notes` | Lista todas las notas |
| `GET /keyword-connections` | Lista todas las conexiones |
| `GET /mux/video-stats` | Todas las views |

---

## 4. MANTENIBILIDAD

### 4.1 ALTO — Directorios de Tests Duplicados

```
supabase/functions/server/
  __tests__/
    rate-limit.test.ts     (Jest-style, 1.9KB)
    timing-safe.test.ts    (Jest-style, 1KB)
    validate.test.ts       (Jest-style, 5.5KB)
  tests/
    rate_limit_test.ts     (Deno-style, 3.3KB)
    validate_test.ts       (Deno-style, 9.7KB)
```

**Problema:** Dos conjuntos de tests para lo mismo, con convenciones distintas (kebab-case vs snake_case, Jest vs Deno.test). No queda claro cual es el canonico.

**Solucion:** Consolidar en `tests/` (Deno-native), eliminar `__tests__/` (Jest-style no corre en Deno sin config adicional).

### 4.2 ALTO — Extensiones de Archivo Incorrectas

| Archivo | Extension | Usa JSX? |
|---------|-----------|----------|
| routes-auth.tsx | .tsx | NO |
| routes-members.tsx | .tsx | NO |
| routes-content.tsx | .tsx | NO |
| routes-billing.tsx | .tsx | NO |
| routes-plans.tsx | .tsx | NO |
| routes-storage.tsx | .tsx | NO |
| routes-student.tsx | .tsx | NO |
| routes-study.tsx | .tsx | NO |
| routes-study-queue.tsx | .tsx | NO |
| routes-models.tsx | .tsx | NO |
| routes-mux.ts | .ts | NO (correcto) |
| routes-search.ts | .ts | NO (correcto) |

Ninguno de estos archivos usa JSX. Deberian ser `.ts`.

### 4.3 ALTO — Sin Tipos de Base de Datos

No hay tipos generados por `supabase gen types`. Esto significa:
- Todas las respuestas de DB son `any` o `Record<string, unknown>`
- Errores de typo en nombres de columnas no se detectan hasta runtime
- El autocompletado del IDE no funciona para queries

**Solucion:**
```bash
supabase gen types typescript --project-id xdnciktarvxyhkrokbng > types/database.ts
```
Luego usar `createClient<Database>(...)` en db.ts.

### 4.4 MEDIO — Patrones de Validacion Inconsistentes

**Patron A** (validate.ts — bueno):
```typescript
if (!isUuid(body.session_id)) return err(c, "...", 400);
const { fields, error } = validateFields(body, rules);
```

**Patron B** (inline — fragil):
```typescript
if (typeof keyword_a_id !== "string" || typeof keyword_b_id !== "string") { ... }
```

Rutas que usan Patron B y deberian migrar a Patron A:
- `routes-content.tsx`: keyword_connections, kw_prof_notes
- `routes-members.tsx`: memberships, institutions, admin_scopes
- `routes-mux.ts`: create-upload, track-view

### 4.5 MEDIO — Sin Request ID / Tracing

No hay correlacion entre logs. Cuando ocurre un error en produccion:
```
[Axon Error] List summaries failed: connection timeout
[Axon Error] List summaries failed: connection timeout
```
No se sabe cual request es cual, de que usuario, ni de que institucion.

**Solucion:** Middleware que genera y propaga `X-Request-Id`.

### 4.6 MEDIO — Sin Codigos de Error Estandarizados

Actualmente los errores son strings libres:
```json
{"error": "Missing required field: name"}
{"error": "Get institution abc failed: PGRST116"}
```

El frontend tiene que hacer `error.includes("...")` para distinguir tipos.  
**Recomendacion:** Agregar `code` al response:
```json
{"error": "Missing required field", "code": "VALIDATION_ERROR", "field": "name"}
```

---

## 5. CALIDAD DE CODIGO — Lo que esta BIEN

Esto es importante documentar. Mucho del backend esta bien hecho:

| Aspecto | Evaluacion |
|---------|------------|
| **crud-factory.ts** | Excelente. Elimina ~2000 lineas de CRUD repetitivo. Configurable, extensible, maneja soft-delete, scoping, pagination, restore. |
| **validate.ts** | Limpio, zero-dependency, bien tipado, completo. validateFields() es un patron elegante. |
| **Fallback patterns** | Todos los RPCs (bulk_reorder, upsert_video_view, get_content_tree) tienen fallback graceful si la migracion no existe. Excelente para deploys sin downtime. |
| **Comentarios** | De alta calidad. Explican decisiones de diseno, no solo que hace el codigo. Los ⚠️ WARNING en db.ts son honestos y utiles. |
| **Error handling** | Consistente patron err(c, msg, status). safeJson() previene crashes por JSON malformado. |
| **Atomic operations** | Buen uso de upsert + ON CONFLICT para race conditions (reading_states, daily_activities, etc). |
| **timing-safe.ts** | Implementacion correcta de comparacion constant-time. |
| **Study Queue algorithm** | NeedScore es un scoring system bien pensado con pesos configurables. |

---

## 6. PLAN DE ACCION PRIORIZADO

### Fase 0 — Inmediato (antes de datos reales)

| # | Item | Esfuerzo | Riesgo si no se hace |
|---|------|----------|---------------------|
| 1 | Correr las 4 migraciones pendientes | 10 min | Funcionalidad degradada |
| 2 | Fix rate-limit key (usar payload, no header) | 5 min | Rate limiter inutil |
| 3 | Fix storage path traversal | 10 min | Acceso a archivos ajenos |
| 4 | Consolidar tests/ y __tests__/ | 15 min | Confusión, tests muertos |

### Fase 1 — Security Hardening (pre-launch)

| # | Item | Esfuerzo | Riesgo si no se hace |
|---|------|----------|---------------------|
| 5 | Verificar JWT con getUser() o jose | 2h | Suplantacion de identidad |
| 6 | CORS: restringir a dominios conocidos | 5 min | Requests desde cualquier sitio |
| 7 | Middleware requireRole() | 4h | Cualquier usuario puede hacer cualquier cosa |
| 8 | Mux webhook idempotency | 30 min | Updates duplicados |
| 9 | Actualizar content-tree route para usar RPC | 30 min | N+1 performance |

### Fase 2 — Performance (post-launch, <1000 users)

| # | Item | Esfuerzo |
|---|------|----------|
| 10 | Agregar limite a flashcards query en study-queue | 15 min |
| 11 | Video stats como SQL aggregate | 30 min |
| 12 | Trash con institution_id filter | 20 min |
| 13 | Cache headers en content-tree, plans | 1h |
| 14 | Generar tipos con supabase gen types | 30 min |

### Fase 3 — Scale-ready (>1000 users)

| # | Item | Esfuerzo |
|---|------|----------|
| 15 | Separar Edge Functions por dominio | 4h |
| 16 | RLS policies completas | 8h |
| 17 | Request ID / tracing middleware | 1h |
| 18 | Error codes estandarizados | 2h |
| 19 | OpenAPI spec auto-generado | 4h |

---

## 7. METRICAS DEL CODEBASE

| Metrica | Valor |
|---------|-------|
| Archivos fuente | 16 |
| Archivos de test | 5 (2 duplicados) |
| Lineas de codigo (approx) | ~3,800 |
| Rutas HTTP | ~65 |
| Tablas cubiertas por CRUD factory | 15 |
| Rutas con validacion completa (validate.ts) | ~40% |
| Rutas con inline typeof checks | ~35% |
| Rutas sin validacion de input | ~25% |
| Migraciones SQL pendientes | 4 |
| RLS policies activas | 0 |
| Tests unitarios | 5 archivos |
| Tests de integracion | 0 |
| Tests E2E | 0 |
