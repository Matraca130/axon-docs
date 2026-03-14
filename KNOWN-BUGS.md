# Axon v4.5 - Known Bugs

> Bugs confirmados contra el schema real de la DB y el codigo del backend/frontend.
>
> **Ultima actualizacion:** 2026-03-14 (audit pass 4)

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
**Ubicacion:** `routes/mux/webhook.ts`
**Descripcion:** El webhook escribe en `resolution_tier` pero la columna real es `max_resolution`.
**Estado:** Pendiente

---

## BUG-002: JWT sin verificacion criptografica local (Backend)

**Severidad:** MEDIUM (rebajado de CRITICAL)
**Ubicacion:** `db.ts` — `authenticate()`
**Mitigacion:** PostgREST valida JWT en primera DB query. Exp checked locally. Admin routes use getUser().
**Riesgo residual:** Rutas sin DB query (Gemini, Mux, Stripe).
**Estado:** Mitigado

---

## BUG-003: RLS deshabilitado en tablas criticas (Database)

**Severidad:** CRITICAL
**Mitigacion:** Backend enforces via `checkContentScope()`. RPCs revocados de authenticated role.
**Riesgo:** Acceso directo con anon key bypasea backend.
**Estado:** Pendiente (parcialmente mitigado)

---

## BUG-004: CORS origin wildcard (Backend)

**Severidad:** HIGH
**Ubicacion:** `index.ts` — CORS middleware
**Descripcion:** CORS fue restringido (commit `33eb56e`, 2026-03-06) pero **revertido a `"*"`** para desarrollo MVP.
**Verificado:** `index.ts` tiene `origin: "*"` con comentario "MVP: Temporarily reverted to '*' for development flexibility."
**Estado:** **NOT FIXED — wildcard activo en produccion**
**Fix:** Re-restringir a dominios especificos antes de launch.

---

## ~~BUG-005: Study Queue con queries secuenciales~~ FIXED
## BUG-006: Content Tree filtra inactivos en JS — Pendiente (MEDIUM)
## BUG-007: Search hace queries excesivas — Parcialmente mitigado (MEDIUM)
## ~~BUG-008: Reorder hace N updates individuales~~ FIXED
## BUG-009: `flashcards.keyword_id` nullable vs required — By design
## ~~BUG-010: Build del frontend roto~~ FIXED
## BUG-011: Tablas basura `kv_store_*` — Pendiente (LOW)

---

## Gamificacion — Todos resueltos (2026-03-13)

G-001 to G-015, A-001 to A-014, B-001 to B-004, D-1 to D-6, S3-001 to S3-004. Todos FIXED.

## Frontend — Todos resueltos (2026-03-13/14)

AUTH-DUAL, LAYOUT-V1, LAYOUT-MOBILE, STALE-CHUNK. Todos FIXED.

---

## Resumen por Severidad

| Severidad | Pendientes | IDs |
|---|---|---|
| CRITICAL | 1 | BUG-003 |
| HIGH | 2 | BUG-001, **BUG-004** |
| MEDIUM | 2 | BUG-002, BUG-006 |
| LOW | 1 | BUG-011 |
| FIXED | 4 | BUG-005, BUG-008, BUG-010 |
| By Design | 1 | BUG-009 |
