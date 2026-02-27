# Axon v4.4 - Known Bugs

> Bugs confirmados contra el schema real de la DB y el codigo del backend.
>
> **Ultima actualizacion:** 2026-02-27

---

## Severidad

| Nivel | Significado |
|---|---|
| CRITICAL | Seguridad comprometida o datos corruptos |
| HIGH | Funcionalidad rota o performance grave |
| MEDIUM | Funcionalidad degradada |
| LOW | Inconveniente menor |

---

## BUG-001: `resolution_tier` vs `max_resolution` (Backend)

**Severidad:** HIGH
**Ubicacion:** `routes-mux.ts` (webhook handler)
**Descripcion:** El webhook escribe en el campo `resolution_tier` pero la columna real en la DB se llama `max_resolution`. El valor **nunca se guarda**.
**Impacto:** La resolucion de video nunca se persiste correctamente.
**Fix:** Cambiar `resolution_tier` a `max_resolution` en el webhook handler.
**Estado:** Pendiente

---

## BUG-002: JWT sin verificacion criptografica (Backend)

**Severidad:** CRITICAL
**Ubicacion:** Middleware de auth
**Descripcion:** El `X-Access-Token` JWT se decodifica pero NO se verifica la firma criptografica. Cualquier JWT fabricado seria aceptado.
**Impacto:** Un atacante puede fabricar un JWT con cualquier `user_id` y `role` y el backend lo acepta.
**Fix:** Verificar JWT con `jsonwebtoken.verify()` usando el JWT secret de Supabase.
**Estado:** Pendiente

---

## BUG-003: RLS deshabilitado en tablas criticas (Database)

**Severidad:** CRITICAL
**Ubicacion:** Supabase PostgreSQL
**Tablas afectadas:**
- `flashcards` - Sin RLS
- `quiz_questions` - Sin RLS
- `quizzes` - Sin RLS
**Descripcion:** Estas tablas no tienen Row Level Security habilitado. Cualquier request con el anon key puede leer/escribir datos de cualquier usuario.
**Impacto:** Datos de todos los usuarios expuestos.
**Fix:** Habilitar RLS + crear policies basadas en `institution_id` via JOINs.
**Estado:** Pendiente (requiere Query 3 para ver estado completo)

---

## BUG-004: CORS origin wildcard (Backend)

**Severidad:** HIGH
**Ubicacion:** Configuracion de CORS en Hono
**Descripcion:** `origin: "*"` permite requests desde cualquier dominio.
**Impacto:** Facilita ataques CSRF y abuso de la API.
**Fix:** Restringir a dominios especificos: `["https://axon.vercel.app", "http://localhost:5173"]`
**Estado:** Pendiente

---

## BUG-005: Study Queue con ~5 queries secuenciales (Backend)

**Severidad:** MEDIUM
**Ubicacion:** Ruta de Study Queue
**Descripcion:** Ejecuta ~5 queries a Supabase de forma secuencial en vez de paralela o en una sola query.
**Impacto:** Latencia multiplicada por 5 en cada request de study queue.
**Fix:** Combinar en una sola query SQL o usar `Promise.all()` para paralelizar.
**Estado:** Pendiente

---

## BUG-006: Content Tree filtra inactivos en JS (Backend)

**Severidad:** MEDIUM
**Ubicacion:** Ruta de Content Tree
**Descripcion:** Trae TODOS los registros de la DB y luego filtra los inactivos en JavaScript.
**Impacto:** Transfiere datos innecesarios, consume memoria, mas lento.
**Fix:** Agregar `WHERE is_active = true` a la query SQL.
**Estado:** Pendiente

---

## BUG-007: Search hace ~100 queries (Backend)

**Severidad:** HIGH
**Ubicacion:** Ruta de busqueda
**Descripcion:** La busqueda ejecuta ~100 queries individuales a Supabase.
**Impacto:** Extremadamente lento, puede causar rate limiting.
**Fix:** Usar full-text search de PostgreSQL (`to_tsvector`, `to_tsquery`) en una sola query.
**Estado:** Pendiente

---

## BUG-008: Reorder hace N updates individuales (Backend)

**Severidad:** MEDIUM
**Ubicacion:** Ruta de reordenamiento
**Descripcion:** Para reordenar N items, hace N queries UPDATE individuales.
**Impacto:** Lento y no atomico (puede quedar en estado inconsistente).
**Fix:** Usar una sola query con `CASE WHEN` o una funcion RPC en Supabase.
**Estado:** Pendiente

---

## BUG-009: `flashcards.keyword_id` nullable vs required (Backend/DB)

**Severidad:** LOW
**Ubicacion:** Schema de DB vs crud-factory config
**Descripcion:** En la DB, `flashcards.keyword_id` es NULLABLE. En el backend, el crud-factory lo tiene como REQUIRED en `requiredFields`.
**Impacto:** No puedes crear un flashcard sin keyword_id via API, aunque la DB lo permite.
**Fix:** Decidir cual es correcto y alinear ambos. Probablemente deberia ser required en ambos.
**Estado:** Pendiente

---

## BUG-010: Build del frontend roto (Frontend)

**Severidad:** CRITICAL
**Ubicacion:** `platformApi.ts` en numero1
**Descripcion:** El frontend llama a funciones que no existen:
- `createStudySession`
- `updateStudySession`
- `submitReview`
**Impacto:** El build de Vercel falla. La app no se puede deployar.
**Fix:** Implementar estas funciones en `platformApi.ts` apuntando a las rutas correctas del backend.
**Estado:** Pendiente

---

## BUG-011: Tablas basura `kv_store_*` (Database)

**Severidad:** LOW
**Ubicacion:** Supabase PostgreSQL
**Descripcion:** ~25 tablas `kv_store_*` creadas automaticamente por Figma Make. No tienen relacion con Axon.
**Impacto:** Ruido visual en el schema, posible confusion.
**Fix:** `DROP TABLE kv_store_* CASCADE;`
**Estado:** Pendiente (seguro eliminar)

---

## Resumen por Severidad

| Severidad | Cantidad | IDs |
|---|---|---|
| CRITICAL | 3 | BUG-002, BUG-003, BUG-010 |
| HIGH | 3 | BUG-001, BUG-004, BUG-007 |
| MEDIUM | 3 | BUG-005, BUG-006, BUG-008 |
| LOW | 2 | BUG-009, BUG-011 |
