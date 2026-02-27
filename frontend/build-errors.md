# Frontend Build Errors

> **STATUS: RESOLVED** — Vercel build passes as of commit `a33f6ea`.
> Build time: 12.15s, 3207 modules. Deploy successful.

## HF-B — RESOLVED (2025-02-27)

The original TS2339 errors (`createStudySession`, `updateStudySession`, `submitReview` not on platformApi) were resolved by adding these functions to `studySessionApi.ts` and `quizApi.ts` instead. No component imports them from `platformApi`.

Additionally, `vite build` uses esbuild (not tsc), so TypeScript type errors don't block the build.

## Remaining: Runtime Payload Bugs

These don't break the build but cause **HTTP 400/500 errors at runtime** when students use study sessions, flashcard reviews, or quizzes. See `bugs/runtime-payload-bugs.md` for details and fix plan.

## Bundle Size Warning

```
dist/assets/index-CMBHrIfe.js  3,236.75 kB | gzip: 879.38 kB
```

Entire app is in ONE chunk. Needs code-splitting via lazy routes.
See `frontend/bundle-optimization.md` (TODO).
