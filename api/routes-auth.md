# API Routes: Auth

> Authentication and user management endpoints.

## Auth Flow

```
1. Frontend calls Supabase Auth directly for login/signup
2. Supabase returns a JWT (access_token)
3. Frontend sends BOTH tokens to backend:
   - Authorization: Bearer <SUPABASE_ANON_KEY>
   - X-Access-Token: <USER_JWT>
4. Backend extracts user_id from JWT (⚠️ without crypto verification)
```

## Profiles

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/profiles` | | Paginated |
| GET | `/profiles/:id` | | Single |
| PUT | `/profiles/:id` | | Single |

Profiles are auto-created via Supabase trigger. No POST needed.

## Memberships

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/memberships` | `user_id`, `institution_id` | Paginated |
| GET | `/memberships/:id` | | Single |
| POST | `/memberships` | | Single |
| PUT | `/memberships/:id` | | Single |
| DELETE | `/memberships/:id` | | Single |

**Required fields:** `user_id`, `institution_id`, `role`

## Plan Access Rules

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/plan-access-rules` | `plan` | Paginated |
| GET | `/plan-access-rules/:id` | | Single |
| POST | `/plan-access-rules` | | Single |
| PUT | `/plan-access-rules/:id` | | Single |
| DELETE | `/plan-access-rules/:id` | | Single |

**Required fields:** `plan`, `feature`

## Notes

- Login/signup happens through Supabase Auth SDK on the frontend, NOT through the backend
- The backend only manages profiles, memberships, and access rules
- ⚠️ JWT is decoded but NOT cryptographically verified (BUG-003)
