# API Routes: Misc

> Webhooks, reorder, health, and utility endpoints.
> **Updated:** 2026-03-14

---

## Webhooks

| Method | Endpoint | Description | Notes |
|---|---|---|---|
| POST | `/webhooks/mux` | Mux video webhook | Idempotent (O-7). BUG-001: `resolution_tier` vs `max_resolution` still pending |
| POST | `/webhooks/stripe` | Stripe webhook | Timing-safe signature (N-10). Idempotent (O-7) |

## Reorder

Single unified endpoint using `bulk_reorder()` RPC (atomic):

| Method | Endpoint | Body |
|---|---|---|
| PUT | `/reorder` | `{ table: "chunks"|"summaries"|"subtopics"|"videos"|..., items: [{ id, order_index }] }` |

> **BUG-008: FIXED** — Uses `bulk_reorder()` RPC (migration `20260227_01`).
> Falls back to sequential updates if RPC unavailable.
> Field is `order_index` (INTEGER), NOT `sort_order`.

## Health Check

| Method | Endpoint | Response |
|---|---|---|
| GET | `/health` | `{ status: "ok" }` |

## Route Count Summary

The backend has 8 split modules + 6 flat route files:

| Source | Count | Subtotal |
|---|---|---|
| CRUD factory entities | ~25 entities × 5 endpoints | ~125 |
| Content manual (connections, search, reorder, tree, batch) | ~12 | ~12 |
| Study manual (reviews, attempts, batch, progress, spaced-rep) | ~18 | ~18 |
| AI/RAG endpoints | ~14 | ~14 |
| Gamification endpoints | ~13 | ~13 |
| Auth, billing, storage, search, mux | ~15 | ~15 |
| Study queue | ~1 | ~1 |
| **Total** | | **~200+** |
