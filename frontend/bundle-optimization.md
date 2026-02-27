# Bundle Optimization

> **STATUS: APPLIED** — commit `670890b` on `numero1_sseki_2325_55`

## Problem

Entire app was a single chunk:
```
dist/assets/index-CMBHrIfe.js  3,236 KB | gzip: 879 KB
```

A student downloading the login page also downloaded all admin, owner, and professor code.

## Solution: Route-Level Code Splitting

### Technique: React Router `lazy` property

Instead of static imports:
```typescript
import { StudyHubView } from '@/app/components/content/StudyHubView';
{ path: 'study-hub', Component: StudyHubView }
```

We use lazy imports:
```typescript
{ path: 'study-hub', lazy: () => import('@/app/components/content/StudyHubView').then(m => ({ Component: m.StudyHubView })) }
```

Vite automatically creates a separate chunk for each lazy import.

### Files Changed

| File | Change |
|------|--------|
| `routes/student-routes.ts` | 16 components → lazy |
| `routes/professor-routes.ts` | 4 real components → lazy (placeholders stay static) |
| `routes.tsx` | 4 role layouts → lazy |
| `vite.config.ts` | Added `manualChunks` for vendor splitting |

### Vendor Chunks (vite.config.ts)

```typescript
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router'],
  'vendor-three': ['three'],
  'vendor-motion': ['motion'],
}
```

### Expected Result

| Before | After (estimated) |
|--------|--------------------|
| 1 chunk, 3,236 KB | ~15-20 chunks |
| 879 KB gzipped | ~200-300 KB initial gzipped |
| All code loaded upfront | Per-route loading on navigation |

### How Navigation Works

React Router keeps showing the current page while the next chunk loads. No blank screen, no spinner needed. For slow connections, you can add a loading bar using `useNavigation()` in the layout.

### Duplicate Route Files (cleanup TODO)

There are duplicate files that should be cleaned up:
- `admin-routes.ts` + `admin-routes.tsx` (Vite uses .ts, .tsx is dead code)
- `owner-routes.ts` + `owner-routes.tsx` (same)

The `.tsx` duplicates can be safely deleted.
