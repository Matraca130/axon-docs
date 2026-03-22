# Bundle Optimization

> **STATUS: APPLIED + ENHANCED** — Code splitting + lazyRetry
> **Updated:** 2026-03-14

## Problem (solved)

Entire app was a single chunk:
```
dist/assets/index-CMBHrIfe.js  3,236 KB | gzip: 879 KB
```

A student downloading the login page also downloaded all admin, owner, and professor code.

## Solution: Route-Level Code Splitting

### Technique: React Router `lazy` property + `lazyRetry`

All 22 route components use lazy imports wrapped in `lazyRetry()`:
```typescript
{ path: 'study-hub', lazy: () => lazyRetry(() => import('@/app/components/content/StudyHubView')).then(m => ({ Component: m.StudyHubView })) }
```

`lazyRetry()` catches stale chunk errors post-deploy, auto-reloads once, prevents infinite loops via sessionStorage flag.

### Files Changed

| File | Change |
|------|--------|
| `routes/student-routes.ts` | 16+ components → lazy |
| `routes/professor-routes.ts` | Components → lazy |
| `routes/admin-routes.ts` | Components → lazy |
| `routes/owner-routes.ts` | Components → lazy |
| `routes/study-student-routes.ts` | Components → lazy |
| `routes/summary-student-routes.ts` | Components → lazy |
| `routes.tsx` | 4 role layouts → lazy |
| `vite.config.ts` | Added `manualChunks` for vendor splitting |
| `lib/lazyRetry.ts` | **NEW** — stale chunk error recovery |

### Vendor Chunks (vite.config.ts)

```typescript
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router'],
  'vendor-three': ['three'],
  'vendor-motion': ['motion'],
}
```

### Result

| Before | After |
|--------|-------|
| 1 chunk, 3,236 KB | ~15-20 chunks |
| 879 KB gzipped | ~200-300 KB initial gzipped |
| All code loaded upfront | Per-route loading on navigation |

### How Navigation Works

React Router keeps showing the current page while the next chunk loads. No blank screen.

### Duplicate Route Files — CLEANED UP

Previously there were duplicate `.ts` + `.tsx` files:
- `admin-routes.ts` + `admin-routes.tsx` → `.tsx` deleted
- `owner-routes.ts` + `owner-routes.tsx` → `.tsx` deleted

All layouts migrated to `layout/RoleShell` v2 (responsive).
Old `roles/RoleShell` v1 and `roles/StudentLayout` v1 deleted.
