# Frontend Build Errors

> **STATUS: ALL RESOLVED** — Build passes, code-split, deployed.
> **Updated:** 2026-03-14

## HF-B — RESOLVED (2025-02-27)

The original TS2339 errors (`createStudySession`, `updateStudySession`, `submitReview` not on platformApi) were resolved by adding these functions to `studySessionApi.ts` and `quizApi.ts`.

## Runtime Payload Bugs — RESOLVED (2026-03-13)

Study session and review APIs are now fully connected. See EC-03/04/05 commits in `axon-docs`.

## Bundle Size — RESOLVED (code splitting applied)

Previous state: Entire app in ONE chunk (3,236 KB / 879 KB gzipped).

Current state:
- 22 lazy route imports via `React Router lazy()`
- Vendor chunks: `vendor-react`, `vendor-three`, `vendor-motion`
- `lazyRetry()` utility handles stale chunk errors post-deploy
- Per-role code splitting: student never downloads admin/owner/professor code

## Stale Chunk Errors — RESOLVED (2026-03-14)

After deploys, cached HTML pointed to old chunk filenames. `lazyRetry()` catches the error, auto-reloads once, and prevents infinite loops via sessionStorage flag.

Applied to all 22 lazy route imports across 6 route files.
