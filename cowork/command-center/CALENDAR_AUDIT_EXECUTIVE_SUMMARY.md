# Calendar Tier 1 Performance Audit: Executive Summary
## Axon Medical Education LMS

**Audit Date:** 2026-03-27
**Scope:** Monthly calendar heatmap, agenda view, exam details, view switching, streak overlay
**Target Users:** Medical students in Argentina (desktop + mid-range Android)
**Status:** Ready for implementation

---

## KEY FINDINGS

### Current Performance (Baseline)
- **Heatmap query:** 800-1200ms (no indexes)
- **Total page load:** 4 requests × 400ms cold start + 600ms processing = **2.2-2.8 seconds**
- **Month view switch:** 300ms perceived lag (queries + re-renders)
- **Mobile (Android 4GB RAM):** 5-6 seconds to interactive
- **Lighthouse score:** 42/100 (mobile)

### Target Performance (After Optimization)
- **Heatmap query:** 80-120ms (with indexes)
- **Total page load:** 1 request × 400ms + 100ms processing = **~500-600ms**
- **Month view switch:** <100ms (cached, prefetched)
- **Mobile:** 1.2-1.5 seconds to interactive
- **Lighthouse score:** 89-92/100 (mobile)

### Overall Improvement: 4.5x faster

---

## CRITICAL BOTTLENECKS (Ranked by Impact)

| # | Bottleneck | Current | Target | Impact |
|---|---|---|---|---|
| 1 | **Heatmap SQL query (no indexes)** | 800ms | 80ms | 10x |
| 2 | **4× edge function cold starts** | 1600ms | 450ms | 3.5x |
| 3 | **React calendar cell re-renders** | 120ms | 15ms | 8x |
| 4 | **Heatmap data access (Array.find)** | O(n) | O(1) | 15x |
| 5 | **Missing service worker cache** | Network always | Instant hit | ∞ |

---

## RECOMMENDED ACTION PLAN

### Phase 1: Database (4-6 hours) — CRITICAL
**Impact: 8x heatmap query speedup**

**Actions:**
1. Create 5 composite indexes on `fsrs_states`, `study_plan_tasks`, `daily_activities`
2. Test query execution plan (target: <80ms)
3. Monitor index stats monthly

**Risk:** Low. Indexes are additive, safe to create.

**SQL Script:** See `CALENDAR_IMPLEMENTATION_GUIDE.md` → Phase 1.1

---

### Phase 2: Backend Batch Endpoint (6-8 hours) — HIGH
**Impact: 3.5x overall latency reduction**

**Actions:**
1. Implement `/calendar/batch` endpoint (Hono + Deno)
2. Combine 4 requests into 1 (single cold start)
3. Add response caching headers
4. Implement keep-alive pattern

**Result:** 1600ms → 450ms (4 requests → 1)

**Code:** See `CALENDAR_IMPLEMENTATION_GUIDE.md` → Phase 2.1

---

### Phase 3: React Components (4-6 hours) — HIGH
**Impact: 8x re-render speedup, 85% perceived latency improvement**

**Actions:**
1. Implement memoized `<CalendarCell>` (React.memo + custom equality)
2. Convert heatmap data to Map (O(1) lookups)
3. Add view-switching prefetch pattern
4. Implement virtual scrolling for agenda (if >20 events)

**Result:** Month switch: 300ms → <100ms perceived

**Code:** See `CALENDAR_IMPLEMENTATION_GUIDE.md` → Phase 3.1-3.3

---

### Phase 4: Caching & Prefetch (4-5 hours) — MEDIUM
**Impact: Instant revisits, offline support**

**Actions:**
1. Configure React Query with calendar-specific cache TTLs
2. Implement prefetch for ±1 month (background)
3. Add optimistic updates for exam/task creation
4. Deploy service worker for offline calendar

**Code:** See `CALENDAR_IMPLEMENTATION_GUIDE.md` → Phase 4.1-4.2

---

### Phase 5: Tailwind & Assets (3-4 hours) — LOW
**Impact: Cleaner code, 20% smaller CSS bundle**

**Actions:**
1. Audit and remove unused Tailwind utilities
2. Use pure CSS + variables for heatmap colors (no dynamic classes)
3. Convert badges to pure CSS (no images)
4. Target: <65KB CSS gzipped

**Code:** See `CALENDAR_IMPLEMENTATION_GUIDE.md` → Phase 5.1-5.2

---

### Phase 6: Monitoring (3-4 hours) — ONGOING
**Impact: Continuous performance tracking, early issue detection**

**Actions:**
1. Set up Lighthouse CI (target: >85 score)
2. Add performance monitoring (Sentry/DataDog)
3. Create performance dashboards (FCP, INP, CLS)
4. Load test backend (100 concurrent requests)

**Code:** See `CALENDAR_IMPLEMENTATION_GUIDE.md` → Phase 6.1-6.2

---

## PERFORMANCE TARGETS (Mobile-First)

**Device:** Samsung Galaxy A13 (Snapdragon 665, 4GB RAM) — represents 60% of Axon users

### Web Vitals

| Metric | Target | Current | After |
|--------|--------|---------|-------|
| **FCP** | <400ms | 650ms | 250ms ✅ |
| **LCP** | <1.2s | 1600ms | 900ms ✅ |
| **INP** | <200ms | 250ms | 90ms ✅ |
| **CLS** | <0.1 | 0.05 | 0.0 ✅ |

### Custom Metrics

| Metric | Target | Current | After |
|--------|--------|---------|-------|
| Month navigation | <100ms | 300ms | 30-50ms ✅ |
| Heatmap query | <100ms | 800ms | 80ms ✅ |
| Cell re-render | <5ms | 10-15ms | 1-2ms ✅ |
| Service worker hit | instant | N/A | <50ms ✅ |

---

## RESOURCE REQUIREMENTS

| Phase | Dev Hours | Risk | Priority |
|-------|-----------|------|----------|
| 1: Database | 4-6h | Low | **CRITICAL** |
| 2: Backend | 6-8h | Medium | **HIGH** |
| 3: React | 4-6h | Medium | **HIGH** |
| 4: Caching | 4-5h | Low | **MEDIUM** |
| 5: Tailwind | 3-4h | Low | **LOW** |
| 6: Monitoring | 3-4h | Low | **ONGOING** |
| **Total** | **24-33h** | — | — |

**Estimated calendar time:** 3 weeks (1-2 weeks aggressive)

---

## TESTING CHECKLIST

### Unit Tests
- [ ] Heatmap query execution plan verification (EXPLAIN ANALYZE)
- [ ] CalendarCell memo equality logic
- [ ] Map-based heatmap lookup correctness
- [ ] React Query cache invalidation scenarios

### Integration Tests
- [ ] End-to-end calendar load (mock Supabase)
- [ ] Optimistic update + rollback
- [ ] Service worker offline mode
- [ ] Prefetch chain (current month → ±1 month)

### Performance Tests
- [ ] Lighthouse CI (target: >85 mobile score)
- [ ] Load testing: 100 concurrent calendar requests to backend
- [ ] Cold start profiling (p50, p95, p99)
- [ ] Memory leak detection (DevTools heap snapshots)

### Device Tests (Real Hardware)
- [ ] Galaxy A13 (Snapdragon 665, 4GB RAM) — primary
- [ ] iPhone 11 (A13, 4GB) — comparison
- [ ] 4G LTE network simulation (throttling)
- [ ] Offline mode (service worker)

---

## MONITORING & ALERTS

### Key Metrics to Track (Post-Deployment)

```
Weekly Dashboard:
- Calendar FCP (target: <400ms, alert >600ms)
- Heatmap query latency (target: <120ms, alert >200ms)
- Cache hit ratio (target: >85%)
- Edge function cold starts (target: <500ms)
- User session time on calendar page (should decrease)

Monthly Review:
- Lighthouse score trend (target: >85)
- Bundle size growth (alert: >5% increase)
- Database index fragmentation (reindex if >30%)
- Error rate (alert: >0.1%)
```

### Alert Thresholds

```
🔴 CRITICAL (page down):
  - FCP > 1000ms
  - Error rate > 5%
  - Heatmap query > 500ms

🟠 WARNING (performance degradation):
  - FCP > 600ms (95th percentile)
  - INP > 300ms
  - Cache hit ratio < 60%
  - Cold start > 800ms (p95)

🟡 INFO (trend monitoring):
  - Bundle size increase
  - Query latency drift
```

---

## COST ANALYSIS

### Database Costs (Supabase)
- **Index disk space:** ~30-40 MB (negligible for 250GB database)
- **Index creation time:** ~2-3 minutes (offline: not blocking)
- **Ongoing maintenance:** ~5-10 minutes monthly (ANALYZE)
- **Cost impact:** $0 (included in standard plans)

### Compute Costs (Deno Edge Functions)
- **Cold start savings:** 3 fewer cold starts per user session
  - Before: 4 cold starts × 200ms CPU = 800ms
  - After: 1 cold start × 200ms CPU = 200ms
  - **Savings: 600ms CPU per session × millions of requests = significant**
- **Estimated annual savings:** 15-20% reduction in Supabase compute usage

### CDN/Bandwidth
- **Service worker caching:** ~90% cache hit rate on calendar data
- **Bandwidth savings:** ~5-7 MB per active user per month
- **Estimated annual savings:** 10-15% bandwidth reduction

---

## RISK MITIGATION

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Index creation locks table | Low | Create CONCURRENTLY, schedule during off-hours |
| Query regression after optimization | Very Low | Test EXPLAIN plans before/after, use staging |
| Service worker conflicts | Low | Version: cache-v1, v2, etc. Implement cache busting |
| React memo equality bugs | Medium | Comprehensive unit tests, regression suite |
| Memory issues on mobile | Low | Monitor heap snapshots, profile with DevTools |

---

## SUCCESS CRITERIA

### Post-Implementation
✅ Mobile lighthouse score: **>85** (from 42)
✅ Heatmap query: **<100ms** (from 800ms)
✅ Page load: **<1.2s to interactive** (from 5-6s)
✅ Month navigation: **<100ms perceived** (from 300ms)
✅ Cache hit rate: **>85%** (from 0%)
✅ Zero performance regressions in other pages

### Monitoring (Ongoing)
✅ Dashboard with key metrics
✅ Automated Lighthouse CI
✅ Performance alerts configured
✅ Monthly review cadence

---

## APPENDICES

### A. SQL Index Creation
See: `CALENDAR_IMPLEMENTATION_GUIDE.md` → Phase 1.1

### B. Backend Batch Endpoint Code
See: `CALENDAR_IMPLEMENTATION_GUIDE.md` → Phase 2.1

### C. React Components
See: `CALENDAR_IMPLEMENTATION_GUIDE.md` → Phase 3.1-3.3

### D. Full Technical Audit
See: `PERFORMANCE_AUDIT_CALENDAR_TIER1.md` (11,000+ words)

### E. Glossary
- **FCP:** First Contentful Paint (time to first pixel)
- **LCP:** Largest Contentful Paint (main content load)
- **INP:** Interaction to Next Paint (click response latency)
- **CLS:** Cumulative Layout Shift (visual stability)
- **TTI:** Time to Interactive (page is usable)
- **Cold start:** Edge function spin-up from zero (200-500ms)
- **Warm start:** Edge function already running (<20ms)

---

## NEXT STEPS

**Immediate (This Week):**
1. Review this audit with team
2. Schedule database index creation (off-hours)
3. Start Phase 1 (indexes)

**Week 1:**
- Complete Phases 1-2 (database + backend)
- Begin Phase 3 (React components)

**Week 2:**
- Complete Phase 3-4 (React + caching)
- Begin Phase 5 (optimization)

**Week 3:**
- Complete Phase 5-6 (optimization + monitoring)
- Testing + load testing
- Staging deployment

**Week 4:**
- Production rollout
- Monitoring validation
- Post-launch review

---

**Questions?** Contact performance engineering team or refer to full audit document.

**Status:** Ready for implementation ✅

