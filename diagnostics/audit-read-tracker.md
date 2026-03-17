# Audit Read Tracker

> **Updated:** 2026-03-14 (pass 15)
> **Frontend:** 188 logic READ + ~350 components LISTED (including roles/pages/)
> **Backend:** ~93 files LISTED + 3 READ (index.ts, db.ts, auth-helpers.ts)
> **Grand total files mapped:** ~630+

## Frontend Logic Layers (ALL READ)

| Layer | Files | % |
|---|---|---|
| services/ | 53 | 100% |
| context/ | 9 | 100% |
| types/ | 11 | 100% |
| hooks/ (flat) | 35 | 100% |
| hooks/queries/ | 21 | 100% |
| lib/ | 25 | 100% |
| utils/ | 10 | 100% |
| routes/ | 10 | 100% |
| design-system/ | 14 | 100% |
| **TOTAL** | **188** | **100%** |

## Frontend Components (ALL LISTED)

| Subdir | Files | Notes |
|---|---|---|
| professor/ | 38 | CMS components (NOT wired to routes — BUG-030) |
| roles/pages/professor/ | 16 | Ready pages + sub-components (NOT wired — BUG-030) |
| roles/pages/owner/ | 8 | Ready pages incl. 50KB OwnerMembersPage (NOT wired — BUG-030) |
| roles/pages/admin/ | 6 | Small wrappers |
| student/ (+ gamification + renderers) | 57 | Fully wired |
| content/ (+ flashcard/) | 48 | Fully wired |
| ui/ | 44 | shadcn/radix |
| shared/ | 25 | |
| layout/ (+ topic-sidebar/) | 18 | |
| viewer3d/ | 14 | |
| gamification/ (+ pages/) | 14 | |
| dashboard/ | 11 | |
| design-kit/ | 9 | |
| auth/ | 6 | |
| schedule/ | 6 | |
| tiptap/ (+ extensions/) | 5 | |
| roles/ (flat) | 4 | Layouts + PlaceholderPage |
| student-panel/ | 4 | |
| welcome/ | 3 | |
| ai/ | 2 | |
| video/ | 2 | |
| summary/ | 2 | |
| flat | 2 | |
| **TOTAL** | **~350** | |

## Backend (LISTED + 3 READ)

| Area | Files | Notes |
|---|---|---|
| **Flat files** | 24 | index.ts READ, db.ts READ, auth-helpers.ts READ |
| lib/ | 3 | fsrs-v4, bkt-v4, types |
| routes/ai/ | 14 | generate-smart 30KB largest |
| routes/content/ | 10 | CMS + keyword mgmt |
| routes/whatsapp/ | 10 | Full module confirmed |
| routes/gamification/ | 6 | |
| routes/study/ | 6 | batch-review 22KB |
| routes/plans/ | 5 | |
| routes/mux/ | 5 | |
| routes/members/ | 4 | institutions, memberships, admin-scopes |
| routes/search/ | 4 | |
| routes/settings/ | 2 | algorithm-config |
| **TOTAL BACKEND** | **~93** | |

## Bugs Found This Session

| Pass | Bugs |
|---|---|
| 12 | BUG-020..027 (logic layer) |
| 13 | BUG-028..029 (design-system) |
| 14 | Professor is NOT placeholder (components exist) |
| **15** | **BUG-030: Professor + Owner routes disconnected from real pages. 16+8 ready pages + 38 sub-components exist but router uses PlaceholderPage** |

## Security Observations (from backend READ)

- db.ts confirms BUG-002: JWT decoded locally, no crypto verification (PostgREST defers)
- db.ts WARNING: non-DB routes (AI, Stripe) may not validate JWT at all
- auth-helpers.ts: SOLID fail-closed implementation, role hierarchy enforced
- CORS restricted to whitelist of allowed origins (BUG-004 — FIXED)
- Rate limiting: 120 req/min/user (middleware active)
