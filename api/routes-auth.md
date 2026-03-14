# API Routes: Auth

> Authentication and user management endpoints.
> **Verified against:** `routes-auth.ts`, `routes/members/`
> **Updated:** 2026-03-14

## Auth Flow

```
1. Frontend calls Supabase Auth directly for login/signup
2. Supabase returns a JWT (access_token)
3. Frontend sends BOTH tokens to backend:
   - Authorization: Bearer <SUPABASE_ANON_KEY>
   - X-Access-Token: <USER_JWT>
4. Backend extracts user_id from JWT (mitigated: PostgREST validates on DB query)
```

## Auth Endpoints (`routes-auth.ts`)

| Method | Endpoint | Description | Response |
|---|---|---|---|
| POST | `/signup` | Create account | `{ data: { user, session } }` |
| GET | `/me` | Get profile (auto-creates if missing via upsert) | `{ data: { ... } }` |
| PUT | `/me` | Update profile | `{ data: { ... } }` |

> Password max length capped at 128 chars (P-5).
> Auto-profile uses upsert to handle race conditions (P-6).

## Institutions (`routes/members/institutions.ts`)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/institutions` | `search`, `is_active` | Paginated |
| GET | `/institutions/:id` | | Single |
| POST | `/institutions` | | Single |
| PUT | `/institutions/:id` | | Single |
| DELETE | `/institutions/:id` | | Single |
| POST | `/institutions/join` | `{ code }` | Single (join by code) |

**Required fields:** `name`, `slug`

## Memberships (`routes/members/memberships.ts`)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/memberships` | `user_id`, `institution_id` | Paginated |
| GET | `/memberships/:id` | | Single |
| POST | `/memberships` | | Single |
| PUT | `/memberships/:id` | | Single |
| DELETE | `/memberships/:id` | | Single |

**Required fields:** `user_id`, `institution_id`, `role`

## Notes

- Login/signup happens through Supabase Auth SDK on the frontend, NOT through the backend
- The backend manages profiles, memberships, and access rules
- Role is NOT in JWT — comes from `GET /institutions` response (includes `membership_id` + `role`)
- JWT mitigated by PostgREST (BUG-002), not cryptographically verified locally
