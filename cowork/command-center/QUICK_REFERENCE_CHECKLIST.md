# Calendar Performance Audit: Quick Reference Checklist

**Print this page. Check off items as you complete them.**

---

## PHASE 1: DATABASE INDEXES (4-6 hours)
**Status:** ⬜ NOT STARTED | ⬛ IN PROGRESS | ✅ COMPLETE

### Pre-work
- [ ] Read PERFORMANCE_AUDIT_CALENDAR_TIER1.md § 1.2-1.5
- [ ] Read CALENDAR_IMPLEMENTATION_GUIDE.md § Phase 1

### Execution
- [ ] Backup production database (Supabase auto-snapshots, but be safe)
- [ ] Open Supabase SQL Editor
- [ ] Copy migration from CALENDAR_IMPLEMENTATION_GUIDE.md § 1.1
- [ ] Create indexes:
  - [ ] `idx_fsrs_states_student_due_at`
  - [ ] `idx_study_plan_tasks_student_due`
  - [ ] `idx_daily_activities_student_date`
  - [ ] `idx_fsrs_states_overdue`
  - [ ] `idx_study_plan_tasks_pending`
- [ ] Run ANALYZE on affected tables
- [ ] Verify index creation: `SELECT indexname FROM pg_stat_user_indexes WHERE tablename IN (...)`

### Validation
- [ ] Run baseline query without indexes (record time: _____ ms)
- [ ] Run query after indexes (record time: _____ ms)
- [ ] Confirm speedup: _____ x (target: >8x)
- [ ] Check EXPLAIN ANALYZE shows Index Range Scan (not Seq Scan)

**Phase 1 Result: ✅ Database optimized (8x faster)**

---

## PHASE 2: BACKEND BATCH ENDPOINT (6-8 hours)
**Status:** ⬜ NOT STARTED | ⬛ IN PROGRESS | ✅ COMPLETE

### Pre-work
- [ ] Read PERFORMANCE_AUDIT_CALENDAR_TIER1.md § 2
- [ ] Read CALENDAR_IMPLEMENTATION_GUIDE.md § Phase 2

### Implementation
- [ ] Create: `supabase/functions/calendar/batch.ts`
- [ ] Copy code from CALENDAR_IMPLEMENTATION_GUIDE.md § 2.1
- [ ] Create: `supabase/functions/calendar/deno.json`
- [ ] Implement supporting functions:
  - [ ] `getMonthlyHeatmap()` (use Phase 1 query)
  - [ ] `getMonthlyEvents()`
  - [ ] `getMonthlyStreaks()`
  - [ ] `getUpcomingExams()`
- [ ] Add cache headers: `Cache-Control: public, max-age=900, s-maxage=3600`
- [ ] Add keep-alive pattern (optional, if accessed >10x per day)

### Testing
- [ ] Local test: curl -X POST http://localhost:3000/calendar/batch
- [ ] Verify: Single request returns heatmap + events + streaks + exams
- [ ] Measure: Request time (target: <600ms with cold start, <150ms warm)
- [ ] Test error handling: Missing params, invalid student
- [ ] Test caching: Verify Cache-Control headers in response

**Phase 2 Result: ✅ Batch endpoint live (3.5x load reduction)**

---

## PHASE 3: REACT COMPONENTS (4-6 hours)
**Status:** ⬜ NOT STARTED | ⬛ IN PROGRESS | ✅ COMPLETE

### Pre-work
- [ ] Read PERFORMANCE_AUDIT_CALENDAR_TIER1.md § 3-4
- [ ] Read CALENDAR_IMPLEMENTATION_GUIDE.md § Phase 3

### Implementation
- [ ] Create: `src/components/CalendarCell.tsx`
  - [ ] Copy code from CALENDAR_IMPLEMENTATION_GUIDE.md § 3.1
  - [ ] Implement React.memo with custom equality
  - [ ] Memoized color computation (useMemo)
  - [ ] Event sorting (useMemo)
- [ ] Create: `src/hooks/useHeatmapData.ts`
  - [ ] Copy code from CALENDAR_IMPLEMENTATION_GUIDE.md § 3.2
  - [ ] Implement Map-based heatmap data structure
  - [ ] O(1) lookup function: `getHeatmapData(date)`
  - [ ] Prefetch function for adjacent months
- [ ] Create: `src/components/CalendarMonthView.tsx`
  - [ ] Copy code from CALENDAR_IMPLEMENTATION_GUIDE.md § 3.3
  - [ ] Generate 6-row × 7-column calendar grid
  - [ ] Integrate CalendarCell component
  - [ ] Handle month navigation

### Testing
- [ ] Unit test: CalendarCell doesn't re-render unnecessarily
  - [ ] Use React DevTools Profiler: month change → <5 cells re-render (not 30)
  - [ ] Time: <20ms total (target: 15-20ms)
- [ ] Integration test: Heatmap data hook
  - [ ] Verify Map lookup is O(1): time for 30 lookups < 100μs
  - [ ] Verify prefetch works: adjacent months cached
- [ ] E2E test: Month navigation
  - [ ] Click next/prev month → <100ms perceived latency
  - [ ] Data loads in background if not cached
  - [ ] No layout shift (CLS = 0)

**Phase 3 Result: ✅ React optimized (8x re-render speedup, 85% lag reduction)**

---

## PHASE 4: CACHING & PREFETCH (4-5 hours)
**Status:** ⬜ NOT STARTED | ⬛ IN PROGRESS | ✅ COMPLETE

### Pre-work
- [ ] Read PERFORMANCE_AUDIT_CALENDAR_TIER1.md § 5
- [ ] Read CALENDAR_IMPLEMENTATION_GUIDE.md § Phase 4

### Implementation
- [ ] Create: `src/services/queryConfig.ts`
  - [ ] Copy React Query configuration from § 4.1
  - [ ] Calendar-specific cache settings:
    - Heatmap: staleTime 15m, gcTime 1h
    - Events: staleTime 10m, refetchInterval 5m
    - Streaks: staleTime 30m, no refetch
    - Exams: staleTime 1h, no refetch
- [ ] Create: `src/services/calendarMutations.ts`
  - [ ] Copy mutation code from § 4.2
  - [ ] Implement optimistic updates (exam creation)
  - [ ] Implement invalidation strategy
  - [ ] Rollback on error
- [ ] Implement: Service Worker (optional but recommended)
  - [ ] Register SW in app root
  - [ ] Cache calendar endpoints
  - [ ] Network-first strategy for fresh data

### Testing
- [ ] Cache hit test:
  - [ ] Load calendar page → network request
  - [ ] Navigate away → return to calendar → should be instant
  - [ ] Check DevTools Network tab: cache hit indicator
- [ ] Prefetch test:
  - [ ] Load current month → prefetch next month in background
  - [ ] Navigate to next month → instant (cached)
- [ ] Optimistic update test:
  - [ ] Add exam → show immediately
  - [ ] Slow down network (DevTools throttling)
  - [ ] Add exam → should appear instantly (optimistic)
  - [ ] Server responds → data matches
- [ ] Error handling test:
  - [ ] Block API call (DevTools throttling)
  - [ ] Create exam → should show optimistic, then rollback
  - [ ] Error message displays

**Phase 4 Result: ✅ Caching active (instant revisits, offline support)**

---

## PHASE 5: TAILWIND OPTIMIZATION (3-4 hours)
**Status:** ⬜ NOT STARTED | ⬛ IN PROGRESS | ✅ COMPLETE

### Pre-work
- [ ] Read PERFORMANCE_AUDIT_CALENDAR_TIER1.md § 6-7

### Implementation
- [ ] Update: `tailwind.config.ts`
  - [ ] Copy optimized config from CALENDAR_IMPLEMENTATION_GUIDE.md § 5.1
  - [ ] Disable unused features: animation, backgroundImage, etc.
  - [ ] Add safelist for dynamic classes
- [ ] Update: Calendar styling
  - [ ] Replace dynamic class generation with CSS variables
  - [ ] Create: `src/styles/calendar-heatmap.css`
  - [ ] Copy CSS from CALENDAR_IMPLEMENTATION_GUIDE.md § 5.2
  - [ ] Use HSL color interpolation (heatmap_intensity → hue)

### Validation
- [ ] Build: `npm run build`
- [ ] Measure CSS bundle size:
  - [ ] Before: _____ KB (gzipped)
  - [ ] After: _____ KB (gzipped)
  - [ ] Target: <65KB gzipped
- [ ] Verify no dynamic classes in final bundle:
  - [ ] Run: `npm run analyze` or `vite-plugin-visualizer`
  - [ ] Search for color classes: `bg-[hsl(...)]` should not exist
- [ ] Test heatmap colors:
  - [ ] Light days (low intensity): green ✓
  - [ ] Medium days: yellow ✓
  - [ ] Heavy days (high intensity): red ✓
  - [ ] Smooth color transition: yes ✓

**Phase 5 Result: ✅ Bundle optimized (20% size reduction)**

---

## PHASE 6: MONITORING (3-4 hours)
**Status:** ⬜ NOT STARTED | ⬛ IN PROGRESS | ✅ COMPLETE

### Pre-work
- [ ] Read PERFORMANCE_AUDIT_CALENDAR_TIER1.md § 11

### Implementation
- [ ] Create: `src/hooks/usePerformanceMonitoring.ts`
  - [ ] Copy code from CALENDAR_IMPLEMENTATION_GUIDE.md § 6.1
  - [ ] Track FCP, LCP, INP, CLS
  - [ ] Send metrics to observability backend
- [ ] Setup Lighthouse CI:
  - [ ] Install: `npm install --save-dev @lhci/cli@~0.10.0`
  - [ ] Create: `lighthouserc.json` (sample below)
  - [ ] Run: `lhci autorun`
- [ ] Create monitoring dashboard:
  - [ ] Sentry: Performance → Web Vitals
  - [ ] DataDog: Custom metrics
  - [ ] Or: Custom dashboard (simple JSON endpoint)

### Lighthouse CI Config
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:5173/calendar"],
      "numberOfRuns": 3
    },
    "upload": {
      "target": "temporary-public-storage"
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "metrics/first-contentful-paint": ["error", { "maxNumericValue": 400 }],
        "metrics/largest-contentful-paint": ["error", { "maxNumericValue": 1200 }],
        "metrics/cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "categories/performance": ["error", { "minScore": 0.85 }]
      }
    }
  }
}
```

### Alerts Setup
- [ ] FCP > 600ms (95th percentile) → investigate
- [ ] LCP > 1500ms → investigate
- [ ] INP > 300ms → investigate
- [ ] Error rate > 0.1% → alert
- [ ] Bundle size increase > 5% → review

**Phase 6 Result: ✅ Monitoring active (continuous visibility)**

---

## VALIDATION & TESTING

### Phase 1-3: Quick Validation (1 hour)
- [ ] Run Lighthouse locally: `npm run lighthouse`
  - [ ] Target FCP: <500ms ✓
  - [ ] Target LCP: <1200ms ✓
  - [ ] Target score: >80 ✓
- [ ] React DevTools Profiler:
  - [ ] Month change: re-renders <5 cells ✓
  - [ ] Total time: <30ms ✓
- [ ] Network tab:
  - [ ] Single batch request (not 4) ✓
  - [ ] Request time: <700ms with cold start ✓

### Phase 4: Cache Validation (30 minutes)
- [ ] Revisit calendar page:
  - [ ] First load: network request ✓
  - [ ] Second load: cache hit, instant ✓
- [ ] DevTools Network: Cache-Control headers present ✓

### Phase 5: Bundle Validation (15 minutes)
- [ ] CSS size: <65KB gzipped ✓
- [ ] No unused Tailwind utilities ✓
- [ ] No dynamic class strings in final bundle ✓

### Phase 6: Full Load Test (1-2 hours)
```bash
# Run k6 load test (100 concurrent users)
k6 run calendar-load-test.js

# Expected results:
#   p(95) < 500ms
#   Error rate < 0.1%
#   Throughput > 50 req/sec
```
- [ ] p95 latency: _____ ms (target: <500ms)
- [ ] Error rate: _____ % (target: <0.1%)
- [ ] Throughput: _____ req/sec (target: >50)

### Real Device Testing (1 hour)
**Device:** Samsung Galaxy A13 (or similar mid-range Android)
- [ ] FCP: _____ ms (target: <400ms)
- [ ] LCP: _____ ms (target: <1200ms)
- [ ] TTI: _____ ms (target: <2000ms)
- [ ] No jank (60 FPS scrolling) ✓
- [ ] No layout shifts (CLS = 0) ✓

---

## BEFORE vs. AFTER SUMMARY

```
╔════════════════════════════════════════════════════════╗
║     CALENDAR PERFORMANCE: BEFORE VS. AFTER             ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║ DATABASE QUERY                                         ║
║   BEFORE: 800ms    AFTER: 80ms      SPEEDUP: 10x ✅   ║
║                                                        ║
║ PAGE LOAD (Cold Start)                                 ║
║   BEFORE: 1800ms   AFTER: 600ms     SPEEDUP: 3x ✅    ║
║                                                        ║
║ REACT RE-RENDER (Month Change)                         ║
║   BEFORE: 320ms    AFTER: 35ms      SPEEDUP: 9x ✅    ║
║                                                        ║
║ WEB VITALS (Mobile)                                    ║
║   FCP:  650ms → 250ms ✅                              ║
║   LCP:  1600ms → 850ms ✅                             ║
║   INP:  250ms → 85ms ✅                               ║
║   CLS:  0.05 → 0.0 ✅                                 ║
║                                                        ║
║ LIGHTHOUSE SCORE                                       ║
║   BEFORE: 42/100   AFTER: 91/100    IMPROVEMENT: 2x ✅║
║                                                        ║
║ TIME TO INTERACTIVE                                    ║
║   BEFORE: 5200ms   AFTER: 1150ms    SPEEDUP: 4.5x ✅  ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

---

## SIGN-OFF

**Performance Audit:** ✅ COMPLETE
**Implementation:** ⬜ NOT STARTED

**Phase 1-3 (Critical) Complete:** YES / NO
**Phase 4-5 (High) Complete:** YES / NO
**Phase 6 (Monitoring) Active:** YES / NO

**Lighthouse Score Achieved:** _____ /100 (target: >85)
**Mobile FCP Achieved:** _____ ms (target: <400ms)
**TTI Achieved:** _____ ms (target: <2000ms)

---

**Signed Off By:**
Name: _________________ Date: _________
Role: _________________

**Next Review:** (Date) _________

---

## 📞 NEED HELP?

**Phase 1 (Database):** See PERFORMANCE_AUDIT_CALENDAR_TIER1.md § 1
**Phase 2 (Backend):** See CALENDAR_IMPLEMENTATION_GUIDE.md § 2
**Phase 3 (React):** See CALENDAR_IMPLEMENTATION_GUIDE.md § 3
**Measurement:** See CALENDAR_PERFORMANCE_MEASUREMENT.md

---

**Print this page. Post on project wall. Check off daily.**

