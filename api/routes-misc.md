# API Routes: Misc

> Webhooks, reorder, and utility endpoints.

## Webhooks

| Method | Endpoint | Description | Notes |
|---|---|---|---|
| POST | `/webhooks/mux` | Mux video webhook | ⚠️ BUG-001: writes `resolution_tier` instead of `max_resolution` |

## Reorder

| Method | Endpoint | Body |
|---|---|---|
| PUT | `/semesters/reorder` | `{ items: [{ id, sort_order }] }` |
| PUT | `/sections/reorder` | `{ items: [{ id, sort_order }] }` |
| PUT | `/topics/reorder` | `{ items: [{ id, sort_order }] }` |
| PUT | `/chunks/reorder` | `{ items: [{ id, sort_order }] }` |

⚠️ All reorder endpoints do N individual UPDATE queries (BUG-009).

## Health Check

| Method | Endpoint | Response |
|---|---|---|
| GET | `/health` | `{ status: "ok" }` |

## Route Count Summary

The backend has ~12 route MODULE files generating approximately:

| Source | Count | Subtotal |
|---|---|---|
| CRUD factory entities | ~25 entities × 5 endpoints | ~125 |
| Reorder endpoints | ~4 | ~4 |
| Custom endpoints (search, content-tree, study-queue) | ~5 | ~5 |
| Auth/webhook endpoints | ~3 | ~3 |
| **Total** | | **~137+** |

The exact count of 176 needs verification by running:
```bash
grep -rn "\.(get\|post\|put\|delete\|patch)(" src/ --include="*.ts" | wc -l
```
in the `axon-backend` repo.
