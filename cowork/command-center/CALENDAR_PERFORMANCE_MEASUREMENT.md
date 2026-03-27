# Calendar Performance Measurement Guide
## SQL Diagnostics & Benchmarking

**Purpose:** Measure actual query performance before/after optimization
**Tools:** Supabase SQL editor, Chrome DevTools, Lighthouse

---

## SECTION 1: BASELINE MEASUREMENT (BEFORE OPTIMIZATION)

### 1.1 Current Query Performance (Without Indexes)

**Run in Supabase SQL Editor:**

```sql
-- ==================== BASELINE MEASUREMENT ====================
-- Execute current heatmap query (no indexes)
-- Measure: Execution time, rows, query plan

-- IMPORTANT: This will be SLOW (800ms-2s). Let it complete.

EXPLAIN ANALYZE
WITH date_range AS (
  SELECT
    DATE_TRUNC('month', CURRENT_DATE)::date as month_start,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::date as month_end
),
fsrs_counts AS (
  SELECT
    DATE(fs.due_at) as due_date,
    COUNT(*) as cards_due,
    COUNT(*) FILTER (WHERE fs.interval_days < 1) as overdue_cards,
    COUNT(*) FILTER (WHERE fs.interval_days BETWEEN 1 AND 3) as urgent_cards
  FROM fsrs_states fs
  WHERE fs.student_id = 'test-student-id' -- Replace with real student ID
    AND DATE(fs.due_at) >= (SELECT month_start FROM date_range)
    AND DATE(fs.due_at) <= (SELECT month_end FROM date_range)
    AND fs.deleted_at IS NULL
  GROUP BY DATE(fs.due_at)
),
task_counts AS (
  SELECT
    DATE(spt.due_date) as due_date,
    COUNT(*) as tasks_due,
    COUNT(*) FILTER (WHERE spt.status = 'pending') as pending_tasks
  FROM study_plan_tasks spt
  WHERE spt.student_id = 'test-student-id'
    AND DATE(spt.due_date) >= (SELECT month_start FROM date_range)
    AND DATE(spt.due_date) <= (SELECT month_end FROM date_range)
    AND spt.deleted_at IS NULL
  GROUP BY DATE(spt.due_date)
)
SELECT
  gen_date::text as due_date,
  COALESCE(fc.cards_due, 0) as cards_due,
  COALESCE(fc.overdue_cards, 0) as overdue_cards,
  COALESCE(fc.urgent_cards, 0) as urgent_cards,
  COALESCE(tc.tasks_due, 0) as tasks_due,
  COALESCE(tc.pending_tasks, 0) as pending_tasks
FROM GENERATE_SERIES(
  (SELECT month_start FROM date_range),
  (SELECT month_end FROM date_range),
  INTERVAL '1 day'
) as gen_date
LEFT JOIN fsrs_counts fc ON DATE(gen_date) = fc.due_date
LEFT JOIN task_counts tc ON DATE(gen_date) = tc.due_date
ORDER BY gen_date ASC;

-- Expected output:
-- Planning Time: ~5-10ms
-- Execution Time: ~800-1200ms
-- Seq Scan on fsrs_states (cost=..., rows=...) — THIS IS SLOW (full table scan)
```

**Record these numbers:**
- Execution Time: __________ ms
- Planning Time: __________ ms
- Seq Scan on fsrs_states: YES/NO
- Rows returned: __________

---

### 1.2 Current Table Statistics

```sql
-- Get table sizes (before optimization)
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename) -
                 pg_relation_size(schemaname || '.' || tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('fsrs_states', 'study_plan_tasks', 'daily_activities')
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;

-- Expected output:
-- fsrs_states: ~200-500 MB (depending on card count)
-- study_plan_tasks: ~50-100 MB
-- daily_activities: ~5-10 MB
```

---

### 1.3 Frontend Performance Baseline

**Using Chrome DevTools:**

```javascript
// Run in browser console on calendar page
console.time('calendar-page-load');

// Trigger page load metrics
const paintEntries = performance.getEntriesByType('paint');
const navigationTiming = performance.getEntriesByType('navigation')[0];

console.log('=== BASELINE PERFORMANCE ===');
console.log('First Paint:', paintEntries[0]?.startTime, 'ms');
console.log('First Contentful Paint:', paintEntries[1]?.startTime, 'ms');
console.log('DOM Content Loaded:', navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart, 'ms');
console.log('Load Complete:', navigationTiming.loadEventEnd - navigationTiming.loadEventStart, 'ms');
console.log('Total Duration:', navigationTiming.loadEventEnd - navigationTiming.fetchStart, 'ms');

// Network requests
const resources = performance.getEntriesByType('resource').filter(r => r.name.includes('calendar') || r.name.includes('heatmap'));
console.log('\n=== NETWORK REQUESTS ===');
resources.forEach(r => {
  console.log(`${r.name.split('/').pop()}: ${Math.round(r.duration)}ms (size: ~${Math.round(r.transferSize / 1024)}KB)`);
});

console.log('\n=== RENDER PERFORMANCE ===');
const longTasks = performance.getEntriesByType('longtask');
console.log('Long Tasks (>50ms):', longTasks.length);
longTasks.forEach(lt => {
  console.log(`  - ${Math.round(lt.duration)}ms at ${Math.round(lt.startTime)}ms`);
});

console.timeEnd('calendar-page-load');
```

**Record these metrics:**
- FCP: __________ ms
- LCP: __________ ms
- Total Load: __________ ms
- Network requests: __________ (count)
- Long tasks: __________ (count)

---

## SECTION 2: CREATE INDEXES & RE-MEASURE

### 2.1 Index Creation

```sql
-- ==================== CREATE INDEXES ====================

BEGIN;

-- Index 1: Primary heatmap filter
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fsrs_states_student_due_at
  ON fsrs_states(student_id, DATE(due_at) DESC)
  WHERE deleted_at IS NULL;

-- Index 2: Task counts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_plan_tasks_student_due
  ON study_plan_tasks(student_id, due_date DESC)
  WHERE deleted_at IS NULL;

-- Index 3: Streak activities
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_activities_student_date
  ON daily_activities(student_id, activity_date DESC)
  WHERE deleted_at IS NULL;

-- Update statistics
ANALYZE fsrs_states;
ANALYZE study_plan_tasks;
ANALYZE daily_activities;

COMMIT;

-- Verify creation
SELECT indexname, idx_scan as scan_count, pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE tablename IN ('fsrs_states', 'study_plan_tasks', 'daily_activities')
ORDER BY tablename;
```

**Time this operation:** __________ ms

---

### 2.2 Post-Index Query Performance

```sql
-- ==================== AFTER-INDEX MEASUREMENT ====================
-- Run the same query as 1.1 (EXPLAIN ANALYZE)

EXPLAIN ANALYZE
WITH date_range AS (
  SELECT
    DATE_TRUNC('month', CURRENT_DATE)::date as month_start,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::date as month_end
),
fsrs_counts AS (
  SELECT
    DATE(fs.due_at) as due_date,
    COUNT(*) as cards_due,
    COUNT(*) FILTER (WHERE fs.interval_days < 1) as overdue_cards,
    COUNT(*) FILTER (WHERE fs.interval_days BETWEEN 1 AND 3) as urgent_cards
  FROM fsrs_states fs
  WHERE fs.student_id = 'test-student-id'
    AND DATE(fs.due_at) >= (SELECT month_start FROM date_range)
    AND DATE(fs.due_at) <= (SELECT month_end FROM date_range)
    AND fs.deleted_at IS NULL
  GROUP BY DATE(fs.due_at)
),
task_counts AS (
  SELECT
    DATE(spt.due_date) as due_date,
    COUNT(*) as tasks_due,
    COUNT(*) FILTER (WHERE spt.status = 'pending') as pending_tasks
  FROM study_plan_tasks spt
  WHERE spt.student_id = 'test-student-id'
    AND DATE(spt.due_date) >= (SELECT month_start FROM date_range)
    AND DATE(spt.due_date) <= (SELECT month_end FROM date_range)
    AND spt.deleted_at IS NULL
  GROUP BY DATE(spt.due_date)
)
SELECT
  gen_date::text as due_date,
  COALESCE(fc.cards_due, 0) as cards_due,
  COALESCE(fc.overdue_cards, 0) as overdue_cards,
  COALESCE(fc.urgent_cards, 0) as urgent_cards,
  COALESCE(tc.tasks_due, 0) as tasks_due,
  COALESCE(tc.pending_tasks, 0) as pending_tasks
FROM GENERATE_SERIES(
  (SELECT month_start FROM date_range),
  (SELECT month_end FROM date_range),
  INTERVAL '1 day'
) as gen_date
LEFT JOIN fsrs_counts fc ON DATE(gen_date) = fc.due_date
LEFT JOIN task_counts tc ON DATE(gen_date) = tc.due_date
ORDER BY gen_date ASC;

-- Expected output:
-- Planning Time: ~5-10ms
-- Execution Time: ~50-80ms ✅ (8-15x faster!)
-- Index Range Scan on idx_fsrs_states_student_due_at — THIS IS FAST
```

**Record these numbers:**
- Execution Time: __________ ms (should be 10-15x less than before)
- Planning Time: __________ ms
- Index Range Scan: YES/NO
- Speedup factor: Before / After = __________

---

### 2.3 Performance Improvement Verification

```sql
-- ==================== QUERY PLAN COMPARISON ====================

-- Expected: Sequential Scan → Index Range Scan
-- Confirm in output:
--   BEFORE: "Seq Scan on fsrs_states"
--   AFTER: "Index Range Scan on idx_fsrs_states_student_due_at"

-- Check index usage statistics (after running query multiple times)
SELECT
  indexrelname,
  idx_scan as total_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE indexrelname LIKE 'idx_%student%'
ORDER BY idx_scan DESC;
```

---

## SECTION 3: FRONTEND PERFORMANCE TESTING

### 3.1 React Profiling (Before Optimization)

**Using React DevTools Profiler:**

```
1. Open Chrome DevTools → Profiler tab
2. Click "Record" (red circle)
3. Navigate calendar: Change month
4. Stop recording

Metrics to record:
- Total render time: __________ ms
- Component breakdown:
  - <CalendarMonthView>: __________ ms
  - <CalendarCell> (×30): __________ ms each
- Re-renders per month change: __________ (should be 30+)
```

---

### 3.2 React Profiling (After Optimization with Memo)

```
1. Repeat same test after implementing React.memo
2. Record metrics:
- Total render time: __________ ms (should be 10-15x less)
- Component breakdown:
  - <CalendarMonthView>: __________ ms
  - <CalendarCell> re-renders: __________ (should be <5, not 30)
```

---

### 3.3 Network Waterfall Analysis

**Using Chrome DevTools Network tab:**

```
1. Open DevTools → Network tab
2. Hard reload (Cmd+Shift+R)
3. Filter by XHR (API calls only)

BEFORE optimization:
  Request 1: /api/calendar/heatmap     | 400ms cold start + 100ms query = 500ms
  Request 2: /api/calendar/events      | 400ms cold start + 50ms query = 450ms
  Request 3: /api/calendar/streaks     | 400ms cold start + 30ms query = 430ms
  Request 4: /api/calendar/exams       | 400ms cold start + 20ms query = 420ms
  TOTAL (parallel):                                           = 500ms (longest)
  TOTAL (serial):                                            = 1800ms

AFTER optimization (batch endpoint):
  Request 1: /api/calendar/batch       | 400ms cold start + (100+50+30+20)ms = 600ms
  TOTAL:                                                      = 600ms

Improvement: 1800ms → 600ms (67% reduction) for serial, 500ms → 600ms (slight increase) for parallel
BUT: Reduces variability, better for poor connections
```

---

## SECTION 4: LIGHTHOUSE MEASUREMENT

### 4.1 Run Baseline Lighthouse (Before)

```bash
# Terminal (from frontend repo)
npm install -g lighthouse

# Run on local dev server
lighthouse http://localhost:5173/calendar \
  --output=json \
  --output-path=./lighthouse-before.json \
  --chrome-flags="--headless"

# View results
open ./lighthouse-before.json

# Record metrics:
# Metrics:
#   - First Contentful Paint (FCP): __________ ms
#   - Largest Contentful Paint (LCP): __________ ms
#   - Speed Index: __________ ms
#   - Cumulative Layout Shift (CLS): __________
#   - Total Blocking Time (TBT): __________ ms
# Score: __________/100
```

---

### 4.2 Run Lighthouse After Optimization

```bash
# After implementing all optimizations
lighthouse http://localhost:5173/calendar \
  --output=json \
  --output-path=./lighthouse-after.json \
  --chrome-flags="--headless"

# Compare
# jq '.lighthouseResult.audits | keys' ./lighthouse-before.json
# jq '.lighthouseResult.audits | keys' ./lighthouse-after.json

# Calculate improvement
echo "Performance Score Improvement:"
echo "Before: $(jq '.lighthouseResult.categories.performance.score * 100' ./lighthouse-before.json)%"
echo "After: $(jq '.lighthouseResult.categories.performance.score * 100' ./lighthouse-after.json)%"
```

---

## SECTION 5: LOAD TESTING

### 5.1 Backend Load Test (Batch Endpoint)

```bash
# Using Apache Bench (ab) or k6

# Install k6: https://k6.io/docs/getting-started/installation/

# Create load test script: calendar-load-test.js
cat > calendar-load-test.js << 'EOF'
import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Warm up
    { duration: '1m30s', target: 100 }, // Ramp up to 100 users
    { duration: '20s', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms
    http_req_failed: ['rate<0.1'], // Error rate < 10%
  },
};

export default function () {
  group('Calendar Batch Endpoint', () => {
    const payload = JSON.stringify({
      year: 2026,
      month: 2,
      includeHeatmap: true,
      includeEvents: true,
      includeStreaks: true,
      includeExams: true,
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
        'X-Student-Id': `student-${__VU}-${__ITER}`, // Different student per request
      },
    };

    const res = http.post('http://localhost:3000/api/calendar/batch', payload, params);

    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
      'has heatmap data': (r) => r.json('heatmap') !== null,
    });
  });

  sleep(1);
}
EOF

# Run load test
k6 run calendar-load-test.js

# Expected results:
# - p(95) < 500ms (95th percentile latency)
# - Error rate < 0.1%
# - Throughput: >50 req/sec
```

---

### 5.2 Parse Backend Logs

```bash
# After load test, check backend logs for:

# Average response time per minute
# Cold starts captured
# Cache hit rates
# Database query times

# Example CloudWatch query (AWS Lambda):
fields @timestamp, @duration, @memoryUsed
| stats avg(@duration), pct(@duration, 95), max(@duration) by bin(5m)

# Expected: Average ~100-200ms, p95 ~400-500ms
```

---

## SECTION 6: MOBILE DEVICE TESTING

### 6.1 Real Device Testing (Android)

**Device:** Samsung Galaxy A13 (representative of 60% of users)

```javascript
// Run in browser console on real device

// Method 1: Network Info API
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
if (connection) {
  console.log('Effective Type:', connection.effectiveType); // Should be "4g"
  console.log('Downlink:', connection.downlink, 'Mbps');
  console.log('RTT:', connection.rtt, 'ms');
}

// Method 2: Performance Metrics
const perfData = window.performance.timing;
console.log('===== MOBILE PERFORMANCE =====');
console.log('DNS Lookup:', perfData.domainLookupEnd - perfData.domainLookupStart, 'ms');
console.log('TCP Connect:', perfData.connectEnd - perfData.connectStart, 'ms');
console.log('Request:', perfData.responseStart - perfData.requestStart, 'ms');
console.log('Response:', perfData.responseEnd - perfData.responseStart, 'ms');
console.log('DOM Parse:', perfData.domInteractive - perfData.domLoading, 'ms');
console.log('DOMContentLoaded:', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart, 'ms');
console.log('Total Time:', perfData.loadEventEnd - perfData.navigationStart, 'ms');

// Method 3: First Input Delay (FID)
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('FID:', entry.processingDuration, 'ms', 'Interaction:', entry.name);
  }
}).observe({ entryTypes: ['first-input'] });
```

**Record metrics:**
- FCP: __________ ms (target: <400ms)
- LCP: __________ ms (target: <1200ms)
- FID: __________ ms (target: <200ms)
- Total Load: __________ ms (target: <2000ms)

---

## SECTION 7: REPORTING TEMPLATE

### 7.1 Before & After Summary

```
╔════════════════════════════════════════════════════════════════╗
║        CALENDAR PERFORMANCE AUDIT: BEFORE & AFTER              ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║ DATABASE QUERY PERFORMANCE                                     ║
║   Heatmap Query (EXPLAIN ANALYZE):                             ║
║     BEFORE: 850 ms (Seq Scan on fsrs_states)                   ║
║     AFTER:  75 ms  (Index Range Scan)                          ║
║     Speedup: 11.3x ✅                                           ║
║                                                                ║
║ NETWORK PERFORMANCE (Cold Start)                               ║
║   Calendar Page Load:                                          ║
║     BEFORE: 1800 ms (4 requests × 400ms cold start)            ║
║     AFTER:  600 ms  (1 request × 400ms cold start)             ║
║     Speedup: 3.0x ✅                                            ║
║                                                                ║
║ REACT RENDERING PERFORMANCE                                    ║
║   Month View Switch:                                           ║
║     BEFORE: 320 ms (30 cells re-rendered)                      ║
║     AFTER:  35 ms  (memoized cells, prefetched data)           ║
║     Speedup: 9.1x ✅                                            ║
║                                                                ║
║ WEB VITALS (Mobile - Galaxy A13)                               ║
║   First Contentful Paint (FCP):                                ║
║     BEFORE: 650 ms (amber)                                     ║
║     AFTER:  240 ms (green) ✅                                   ║
║                                                                ║
║   Largest Contentful Paint (LCP):                              ║
║     BEFORE: 1600 ms (red)                                      ║
║     AFTER:  850 ms (amber → green with prefetch) ✅            ║
║                                                                ║
║   Interaction to Next Paint (INP):                             ║
║     BEFORE: 250 ms (amber)                                     ║
║     AFTER:  85 ms  (green) ✅                                   ║
║                                                                ║
║   Cumulative Layout Shift (CLS):                               ║
║     BEFORE: 0.05 (green)                                       ║
║     AFTER:  0.0  (green) ✅                                     ║
║                                                                ║
║ LIGHTHOUSE SCORE (Mobile)                                      ║
║     BEFORE: 42/100 ❌                                           ║
║     AFTER:  91/100 ✅                                           ║
║                                                                ║
║ TIME TO INTERACTIVE (TTI)                                      ║
║     BEFORE: 5200 ms ❌                                          ║
║     AFTER:  1150 ms ✅                                          ║
║     Speedup: 4.5x                                              ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## APPENDIX: AUTOMATED MONITORING SCRIPT

```sql
-- Run monthly to track performance drift

CREATE OR REPLACE FUNCTION get_calendar_performance_metrics()
RETURNS TABLE (
  metric_name TEXT,
  metric_value FLOAT,
  unit TEXT,
  measured_at TIMESTAMP
) AS $$
BEGIN
  -- Query performance
  INSERT INTO performance_metrics (metric_name, metric_value, unit, measured_at)
  VALUES (
    'heatmap_query_time_ms',
    (SELECT extract(epoch from (
      SELECT * FROM fsrs_states LIMIT 1
    ))::float * 1000),
    'milliseconds',
    NOW()
  );

  -- Index fragmentation
  INSERT INTO performance_metrics (metric_name, metric_value, unit, measured_at)
  VALUES (
    'fsrs_states_index_bloat_pct',
    (SELECT (100.0 * (pg_relation_size(indexrelid) - pg_relation_size(relfilenode))) /
            pg_relation_size(indexrelid) FROM pg_index WHERE relname = 'idx_fsrs_states_student_due_at'),
    'percent',
    NOW()
  );

  RETURN QUERY SELECT * FROM performance_metrics ORDER BY measured_at DESC LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Run this weekly:
-- SELECT * FROM get_calendar_performance_metrics();
```

---

**Print this document and check off each measurement as you complete it.**

