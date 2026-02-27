# API Routes: Institutions

> CRUD + custom endpoints for institution management.

## CRUD (via crud-factory)

| Method | Endpoint | Description | Response Format |
|---|---|---|---|
| GET | `/institutions` | List institutions | `{ data: { items, total, limit, offset } }` |
| GET | `/institutions/:id` | Get one | `{ data: { ... } }` |
| POST | `/institutions` | Create | `{ data: { ... } }` |
| PUT | `/institutions/:id` | Update | `{ data: { ... } }` |
| DELETE | `/institutions/:id` | Delete | `{ data: { ... } }` |

## Query Params (list)

| Param | Type | Description |
|---|---|---|
| limit | number | Page size (default: 20) |
| offset | number | Skip N items |
| search | string | Filter by name |
| is_active | boolean | Filter active/inactive |

## Required Fields (create)

```
name, slug
```

## Notes

- `slug` must be unique (used in URLs)
- `owner_id` is set automatically from the authenticated user on creation
- `plan` defaults to `'free'`
