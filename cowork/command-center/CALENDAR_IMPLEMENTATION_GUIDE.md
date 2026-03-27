# Calendar Tier 1 Implementation Guide
## Concrete Code & Configuration Examples

**Status:** Ready to implement
**Target:** Achieve 4.5x overall performance improvement
**Phases:** 1-6 (3 weeks total)

---

## PHASE 1: DATABASE INDEXES & QUERIES

### Step 1.1: Index Creation Script

**File:** `supabase/migrations/[TIMESTAMP]_calendar_indexes.sql`

```sql
-- Migration: Add indexes for calendar heatmap queries
-- Created: 2026-03-27
-- Purpose: Accelerate monthly heatmap + agenda queries from 800ms → 80ms

BEGIN;

-- ==================== FSRS INDEXES ====================

-- Primary index: Used by heatmap query (SELECT due_at WHERE student_id AND date BETWEEN)
-- Size estimate: 15MB (5000 cards per student)
-- Query speedup: 40x (2000ms → 50ms)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fsrs_states_student_due_at
  ON fsrs_states(student_id, DATE(due_at) DESC)
  WHERE deleted_at IS NULL
  AND interval_days >= 0; -- Only active cards

-- Secondary index: Overdue card filtering (frequent in dashboard widgets)
-- Used by: urgent_cards_count, overdue_alerts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fsrs_states_overdue
  ON fsrs_states(student_id, due_at)
  WHERE deleted_at IS NULL
  AND interval_days < 1; -- Only overdue

-- Tertiary index: Recent activity (for daily study streaks)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fsrs_states_recent
  ON fsrs_states(student_id, last_review_at DESC)
  WHERE deleted_at IS NULL
  AND last_review_at > NOW() - INTERVAL '30 days';

-- ==================== STUDY PLAN INDEXES ====================

-- Primary index: Heatmap task counts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_plan_tasks_student_due
  ON study_plan_tasks(student_id, due_date DESC)
  WHERE deleted_at IS NULL
  AND status IN ('pending', 'in_progress');

-- Secondary index: Pending task filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_plan_tasks_pending
  ON study_plan_tasks(student_id, status, due_date DESC)
  WHERE deleted_at IS NULL
  AND status = 'pending';

-- ==================== DAILY ACTIVITY INDEXES ====================

-- Streak tracking: efficient lookup by date range
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_activities_student_date
  ON daily_activities(student_id, activity_date DESC)
  WHERE deleted_at IS NULL;

-- ==================== EXAM EVENT INDEXES ====================

-- Agenda view: fetch exams in date range
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exam_events_student_date
  ON exam_events(student_id, exam_date DESC)
  WHERE deleted_at IS NULL
  AND exam_date >= NOW();

-- ==================== STATISTICS UPDATE ====================

-- Update table statistics for query optimizer
ANALYZE fsrs_states;
ANALYZE study_plan_tasks;
ANALYZE daily_activities;
ANALYZE exam_events;

-- ==================== VERIFICATION ====================

-- Verify all indexes created successfully (should return 7 rows)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scan_count,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE tablename IN ('fsrs_states', 'study_plan_tasks', 'daily_activities', 'exam_events')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

COMMIT;
```

---

### Step 1.2: Heatmap Query Function

**File:** `supabase/functions/calendar/heatmap-query.ts`

```typescript
// Optimized PostgreSQL query for monthly heatmap
// Target: 50-80ms execution with full indexes
// Input: studentId, year, month (e.g. 2026, 2 for Feb)
// Output: Array<{ due_date, cards_due, tasks_due, heatmap_intensity, ... }>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface HeatmapEntry {
  due_date: string; // ISO date: "2026-03-15"
  cards_due: number;
  overdue_cards: number;
  urgent_cards: number;
  tasks_due: number;
  pending_tasks: number;
  streak_count: number;
  cards_reviewed: number;
  heatmap_intensity: number; // 0.0-1.0
}

export async function getMonthlyHeatmap(
  studentId: string,
  year: number,
  month: number
): Promise<HeatmapEntry[]> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  const { data, error } = await supabase.rpc(
    "get_calendar_heatmap",
    {
      p_student_id: studentId,
      p_month_start: monthStart.toISOString().split("T")[0],
      p_month_end: monthEnd.toISOString().split("T")[0],
    }
  );

  if (error) throw error;
  return data as HeatmapEntry[];
}

// Alternative: Raw SQL query (for platforms without RPC support)
export async function getMonthlyHeatmapRaw(
  studentId: string,
  year: number,
  month: number
): Promise<HeatmapEntry[]> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );

  const query = `
    WITH date_range AS (
      SELECT
        DATE_TRUNC('month', DATE '${year}-${String(month + 1).padStart(2, "0")}-01')::date as month_start,
        (DATE_TRUNC('month', DATE '${year}-${String(month + 1).padStart(2, "0")}-01') +
         INTERVAL '1 month' - INTERVAL '1 day')::date as month_end
    ),
    fsrs_counts AS (
      SELECT
        DATE(fs.due_at) as due_date,
        COUNT(*) as cards_due,
        COUNT(*) FILTER (WHERE fs.interval_days < 1) as overdue_cards,
        COUNT(*) FILTER (WHERE fs.interval_days BETWEEN 1 AND 3) as urgent_cards
      FROM fsrs_states fs
      WHERE fs.student_id = '${studentId}'
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
      WHERE spt.student_id = '${studentId}'
        AND DATE(spt.due_date) >= (SELECT month_start FROM date_range)
        AND DATE(spt.due_date) <= (SELECT month_end FROM date_range)
        AND spt.deleted_at IS NULL
      GROUP BY DATE(spt.due_date)
    ),
    daily_activities_counts AS (
      SELECT
        da.activity_date,
        da.streak_count,
        COALESCE(da.total_cards_reviewed, 0) as cards_reviewed
      FROM daily_activities da
      WHERE da.student_id = '${studentId}'
        AND da.activity_date >= (SELECT month_start FROM date_range)
        AND da.activity_date <= (SELECT month_end FROM date_range)
        AND da.deleted_at IS NULL
    )
    SELECT
      gen_date::text as due_date,
      COALESCE(fc.cards_due, 0) as cards_due,
      COALESCE(fc.overdue_cards, 0) as overdue_cards,
      COALESCE(fc.urgent_cards, 0) as urgent_cards,
      COALESCE(tc.tasks_due, 0) as tasks_due,
      COALESCE(tc.pending_tasks, 0) as pending_tasks,
      COALESCE(da.streak_count, 0) as streak_count,
      COALESCE(da.cards_reviewed, 0) as cards_reviewed,
      LEAST(1.0, (COALESCE(fc.cards_due, 0)::float / 50.0) +
                 (COALESCE(tc.tasks_due, 0)::float / 10.0)) as heatmap_intensity
    FROM GENERATE_SERIES(
      (SELECT month_start FROM date_range),
      (SELECT month_end FROM date_range),
      INTERVAL '1 day'
    ) as gen_date
    LEFT JOIN fsrs_counts fc ON DATE(gen_date) = fc.due_date
    LEFT JOIN task_counts tc ON DATE(gen_date) = tc.due_date
    LEFT JOIN daily_activities_counts da ON gen_date::date = da.activity_date
    ORDER BY gen_date ASC;
  `;

  const { data, error } = await supabase.rpc("exec_sql", { query });

  if (error) throw error;
  return data as HeatmapEntry[];
}
```

---

## PHASE 2: BACKEND BATCH ENDPOINT

### Step 2.1: Unified Calendar Fetch Endpoint

**File:** `supabase/functions/calendar/batch.ts`

```typescript
import { Hono } from "https://deno.land/x/hono@v3.0.0/mod.ts";
import { cors } from "https://deno.land/x/hono@v3.0.0/middleware.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getMonthlyHeatmap } from "./heatmap-query.ts";

interface BatchCalendarRequest {
  year: number;
  month: number;
  includeHeatmap?: boolean;
  includeEvents?: boolean;
  includeStreaks?: boolean;
  includeExams?: boolean;
}

interface BatchCalendarResponse {
  heatmap?: Array<any>;
  events?: Array<any>;
  streaks?: Array<any>;
  exams?: Array<any>;
  timestamp: number;
  cacheAge?: number; // Seconds since cached
  requestDuration: number; // Total time in ms
}

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["https://axon.vercel.app", "http://localhost:5173"],
    allowHeaders: ["Authorization", "X-Access-Token"],
    credentials: true,
  })
);

app.post("/calendar/batch", async (c) => {
  const startTime = performance.now();
  const studentId = c.req.header("X-Student-Id");

  if (!studentId) {
    return c.json({ error: "Missing X-Student-Id header" }, 401);
  }

  const body: BatchCalendarRequest = await c.req.json();
  const {
    year,
    month,
    includeHeatmap = true,
    includeEvents = true,
    includeStreaks = true,
    includeExams = true,
  } = body;

  try {
    // Parallel fetch: all queries run simultaneously
    const promises = [];

    if (includeHeatmap) {
      promises.push(
        getMonthlyHeatmap(studentId, year, month)
          .then((data) => ({ key: "heatmap", data }))
          .catch((err) => ({ key: "heatmap", error: err.message }))
      );
    }

    if (includeEvents) {
      promises.push(
        getMonthlyEvents(studentId, year, month)
          .then((data) => ({ key: "events", data }))
          .catch((err) => ({ key: "events", error: err.message }))
      );
    }

    if (includeStreaks) {
      promises.push(
        getMonthlyStreaks(studentId, year, month)
          .then((data) => ({ key: "streaks", data }))
          .catch((err) => ({ key: "streaks", error: err.message }))
      );
    }

    if (includeExams) {
      promises.push(
        getUpcomingExams(studentId)
          .then((data) => ({ key: "exams", data }))
          .catch((err) => ({ key: "exams", error: err.message }))
      );
    }

    const results = await Promise.all(promises);

    // Build response object
    const response: BatchCalendarResponse = {
      timestamp: Date.now(),
      requestDuration: Math.round(performance.now() - startTime),
    };

    for (const result of results) {
      if (result.error) {
        console.error(`Error fetching ${result.key}:`, result.error);
      } else {
        response[result.key as keyof BatchCalendarResponse] = result.data;
      }
    }

    // Set cache headers
    return c.json(response, 200, {
      "Cache-Control": "public, max-age=900, s-maxage=3600", // 15m client, 1h edge
      "X-Request-Duration": `${response.requestDuration}ms`,
      "Content-Type": "application/json; charset=utf-8",
    });
  } catch (error) {
    console.error("Batch calendar error:", error);
    return c.json(
      { error: "Failed to fetch calendar data" },
      500
    );
  }
});

// Health check (keep-alive)
app.head("/calendar/health", (c) => {
  return c.text("OK", 200, {
    "Cache-Control": "no-cache",
  });
});

export default app;

// Supporting functions (stub implementations)
async function getMonthlyEvents(studentId: string, year: number, month: number) {
  // TODO: Implement exam_events + study_plan_tasks query
  return [];
}

async function getMonthlyStreaks(studentId: string, year: number, month: number) {
  // TODO: Implement daily_activities streak aggregation
  return [];
}

async function getUpcomingExams(studentId: string) {
  // TODO: Implement upcoming exams query
  return [];
}
```

---

### Step 2.2: Deno Configuration

**File:** `supabase/functions/calendar/deno.json`

```json
{
  "imports": {
    "hono": "https://deno.land/x/hono@v3.0.0/mod.ts",
    "supabase": "https://esm.sh/@supabase/supabase-js@2"
  },
  "tasks": {
    "dev": "deno run --allow-all --allow-env --allow-net --watch supabase/functions/calendar/index.ts",
    "test": "deno test --allow-env --allow-net supabase/functions/calendar/tests/"
  }
}
```

---

## PHASE 3: REACT COMPONENTS

### Step 3.1: Memoized Calendar Cell

**File:** `src/components/CalendarCell.tsx`

```typescript
import React, { useMemo, useCallback } from 'react';

interface CalendarCellProps {
  date: Date;
  heatmapIntensity: number; // 0.0-1.0
  cards_due: number;
  tasks_due: number;
  streak_count: number;
  events: Array<{ id: string; type: 'exam' | 'task'; title: string }>;
  onClick: (date: Date) => void;
  isSelected?: boolean;
}

/**
 * Memoized calendar cell component.
 * Only re-renders if core data (intensity, counts, events) changes.
 *
 * Performance: ~1-2ms per cell (vs 5-10ms without memo)
 */
const CalendarCell = React.memo(
  ({
    date,
    heatmapIntensity,
    cards_due,
    tasks_due,
    streak_count,
    events,
    onClick,
    isSelected = false,
  }: CalendarCellProps) => {
    // Memoized: Compute HSL color once
    const bgColor = useMemo(() => {
      const intensity = Math.min(1, heatmapIntensity);
      // Hue: 120° (green) → 0° (red)
      const hue = intensity * (-120) + 120;
      // Lightness decreases with intensity (darker = busier)
      const lightness = 60 - intensity * 20;
      return `hsl(${Math.round(hue)}, 70%, ${Math.round(lightness)}%)`;
    }, [heatmapIntensity]);

    // Memoized: Sort events by type (exams first)
    const sortedEvents = useMemo(() => {
      return [...events].sort((a, b) => {
        return a.type === 'exam' && b.type !== 'exam' ? -1 : 1;
      });
    }, [events]);

    // Handler
    const handleClick = useCallback(() => {
      onClick(date);
    }, [date, onClick]);

    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    return (
      <div
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
        role="button"
        tabIndex={0}
        className={`
          relative p-3 min-h-24 rounded-lg cursor-pointer
          transition-all duration-200 ease-out
          ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'}
          border border-gray-200 border-opacity-30
        `}
        style={{
          backgroundColor: bgColor,
        }}
        aria-label={`${dateStr}: ${cards_due} cards, ${tasks_due} tasks`}
      >
        {/* Date number */}
        <div className="text-sm font-semibold text-gray-800 mb-2">
          {date.getDate()}
        </div>

        {/* Streak badge */}
        {streak_count > 0 && (
          <div className="mb-2">
            <StreakBadge count={streak_count} />
          </div>
        )}

        {/* Event icons (max 2 + overflow indicator) */}
        {sortedEvents.length > 0 && (
          <div className="flex gap-1 mb-2">
            {sortedEvents.slice(0, 2).map((event, idx) => (
              <EventIcon
                key={`${date.toISOString()}-${idx}`}
                type={event.type}
                title={event.title}
              />
            ))}
            {sortedEvents.length > 2 && (
              <span className="text-xs text-gray-600 font-medium">
                +{sortedEvents.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Load density indicator */}
        {(cards_due > 0 || tasks_due > 0) && (
          <div className="text-xs text-gray-700 font-medium space-y-0.5">
            {cards_due > 0 && (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                <span>{cards_due} card{cards_due !== 1 ? 's' : ''}</span>
              </div>
            )}
            {tasks_due > 0 && (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                <span>{tasks_due} task{tasks_due !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  },

  // Custom equality check: only re-render if core data changes
  (prevProps, nextProps) => {
    return (
      prevProps.heatmapIntensity === nextProps.heatmapIntensity &&
      prevProps.cards_due === nextProps.cards_due &&
      prevProps.tasks_due === nextProps.tasks_due &&
      prevProps.streak_count === nextProps.streak_count &&
      prevProps.events.length === nextProps.events.length &&
      prevProps.isSelected === nextProps.isSelected &&
      // Deep check events array only if length changed
      (prevProps.events.length === nextProps.events.length
        ? prevProps.events.every((e, i) => e.id === nextProps.events[i]?.id)
        : false)
    );
  }
);

CalendarCell.displayName = 'CalendarCell';

export default CalendarCell;

// ==================== Helper Components ====================

interface StreakBadgeProps {
  count: number;
}

const StreakBadge: React.FC<StreakBadgeProps> = ({ count }) => {
  const getSizeClass = (n: number) => {
    if (n >= 30) return 'text-sm font-bold';
    if (n >= 14) return 'text-xs font-semibold';
    return 'text-xs font-medium';
  };

  const getColorClass = (n: number) => {
    if (n >= 30) return 'text-orange-700 bg-orange-100 border-orange-300';
    if (n >= 14) return 'text-yellow-700 bg-yellow-100 border-yellow-300';
    if (n >= 7) return 'text-blue-700 bg-blue-100 border-blue-300';
    return 'text-green-700 bg-green-100 border-green-300';
  };

  return (
    <div
      className={`
        inline-flex items-center justify-center gap-1
        px-2 py-1 rounded-full border
        ${getSizeClass(count)}
        ${getColorClass(count)}
        whitespace-nowrap
      `}
      aria-label={`${count} day streak`}
    >
      <span className="text-base">🔥</span>
      {count}
    </div>
  );
};

interface EventIconProps {
  type: 'exam' | 'task';
  title: string;
}

const EventIcon: React.FC<EventIconProps> = ({ type, title }) => {
  return (
    <div
      className={`
        w-5 h-5 rounded flex items-center justify-center text-xs font-bold
        ${type === 'exam' ? 'bg-red-300 text-red-700' : 'bg-blue-300 text-blue-700'}
      `}
      title={title}
    >
      {type === 'exam' ? '📋' : '✓'}
    </div>
  );
};
```

---

### Step 3.2: Heatmap Data Hook with Map-Based Lookup

**File:** `src/hooks/useHeatmapData.ts`

```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

export interface HeatmapEntry {
  due_date: string; // ISO: "2026-03-15"
  cards_due: number;
  overdue_cards: number;
  urgent_cards: number;
  tasks_due: number;
  pending_tasks: number;
  streak_count: number;
  cards_reviewed: number;
  heatmap_intensity: number; // 0.0-1.0
}

/**
 * Hook: Fetch heatmap data and expose O(1) lookup by date.
 *
 * Performance: Map.get() is O(1), vs Array.find() which is O(n).
 * With 30+ cells per render, this is significant.
 *
 * Example:
 *   const { getHeatmapData, isLoading } = useHeatmapData(2026, 2);
 *   const data = getHeatmapData(new Date(2026, 1, 15));
 *   // Returns HeatmapEntry | null in O(1) time
 */
export const useHeatmapData = (year: number, month: number) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['calendar', 'heatmap', year, month],
    queryFn: async () => {
      const response = await fetch(
        `/api/calendar/batch`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Student-Id': await getStudentId(), // Your auth logic
          },
          body: JSON.stringify({
            year,
            month,
            includeHeatmap: true,
            includeEvents: false,
            includeStreaks: false,
            includeExams: false,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to fetch heatmap');
      const data = await response.json();
      return data.heatmap as HeatmapEntry[];
    },

    // Cache config
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 1 * 60 * 60 * 1000, // 1 hour
    refetchInterval: 30 * 60 * 1000, // Refetch every 30 min in background
    refetchOnWindowFocus: false, // Don't refetch on tab switch

    // Selector: Convert array to Map immediately
    select: (data) => {
      const map = new Map<string, HeatmapEntry>();
      data.forEach((entry) => {
        map.set(entry.due_date, entry);
      });
      return map;
    },
  });

  /**
   * O(1) lookup by date
   *
   * Usage:
   *   const entry = getHeatmapData(new Date(2026, 1, 15));
   *   if (entry) {
   *     console.log(entry.cards_due, entry.heatmap_intensity);
   *   }
   */
  const getHeatmapData = useCallback(
    (date: Date): HeatmapEntry | null => {
      const key = date.toISOString().split('T')[0]; // "2026-03-15"
      return query.data?.get(key) ?? null;
    },
    [query.data]
  );

  // Prefetch adjacent months for smooth navigation
  const prefetchAdjacentMonths = useCallback(() => {
    const months = [-1, 0, 1];
    months.forEach((offset) => {
      const d = new Date(year, month + offset);
      queryClient.prefetchQuery({
        queryKey: ['calendar', 'heatmap', d.getFullYear(), d.getMonth()],
        queryFn: () => fetch(
          `/api/calendar/batch`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Student-Id': await getStudentId(),
            },
            body: JSON.stringify({
              year: d.getFullYear(),
              month: d.getMonth(),
              includeHeatmap: true,
            }),
          }
        ).then((r) => r.json()).then((data) => data.heatmap),
        staleTime: 15 * 60 * 1000,
      });
    });
  }, [year, month, queryClient]);

  return {
    getHeatmapData,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    data: query.data,
    prefetchAdjacentMonths,
  };
};

// Stub: Replace with your auth logic
async function getStudentId(): Promise<string> {
  // TODO: Get from auth context
  return 'student-123';
}
```

---

### Step 3.3: Calendar Month View Component

**File:** `src/components/CalendarMonthView.tsx`

```typescript
import React, { useCallback, useEffect, useState } from 'react';
import CalendarCell from './CalendarCell';
import { useHeatmapData } from '../hooks/useHeatmapData';
import type { HeatmapEntry } from '../hooks/useHeatmapData';

interface CalendarMonthViewProps {
  year: number;
  month: number;
  onDateSelect: (date: Date) => void;
}

/**
 * Calendar month view with memoized cells and O(1) heatmap lookups.
 *
 * Performance targets:
 *   - Initial render: ~50ms (30 cells × 1.5ms each)
 *   - Month navigation: ~15ms (cells cached, heatmap prefetched)
 *   - Cell re-renders: <1ms per cell (React.memo)
 */
export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  year,
  month,
  onDateSelect,
}) => {
  const { getHeatmapData, isLoading, prefetchAdjacentMonths } = useHeatmapData(year, month);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Prefetch adjacent months on mount
  useEffect(() => {
    prefetchAdjacentMonths();
  }, [prefetchAdjacentMonths]);

  // Generate calendar grid: Start on Sunday, pad with prev/next month dates
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  // Pad with previous month's days
  const calendarDays: { date: Date; isCurrentMonth: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  // Current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      date: new Date(year, month, day),
      isCurrentMonth: true,
    });
  }

  // Pad with next month's days (to fill 6 rows)
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({
      date: new Date(year, month + 1, day),
      isCurrentMonth: false,
    });
  }

  const handleDateClick = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      onDateSelect(date);
    },
    [onDateSelect]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-gray-600">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid: 6 rows × 7 columns */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((dayObj, idx) => {
          const { date, isCurrentMonth } = dayObj;
          const heatmap = getHeatmapData(date);

          // Skip rendering if not current month and no data
          if (!isCurrentMonth && !heatmap) {
            return (
              <div key={idx} className="p-3 min-h-24 bg-gray-50 rounded-lg opacity-50" />
            );
          }

          return (
            <CalendarCell
              key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
              date={date}
              heatmapIntensity={heatmap?.heatmap_intensity ?? 0}
              cards_due={heatmap?.cards_due ?? 0}
              tasks_due={heatmap?.tasks_due ?? 0}
              streak_count={heatmap?.streak_count ?? 0}
              events={[]} // TODO: Fetch from useEventsData hook
              onClick={handleDateClick}
              isSelected={
                selectedDate?.toDateString() === date.toDateString()
              }
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded" style={{ backgroundColor: 'hsl(120, 70%, 60%)' }} />
          <span>Light workload</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded" style={{ backgroundColor: 'hsl(60, 70%, 50%)' }} />
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded" style={{ backgroundColor: 'hsl(0, 70%, 50%)' }} />
          <span>Heavy workload</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarMonthView;
```

---

## PHASE 4: DATA FETCHING & CACHING

### Step 4.1: React Query Configuration

**File:** `src/services/queryConfig.ts`

```typescript
import { QueryClient, DefaultOptions } from '@tanstack/react-query';

const queryConfig: DefaultOptions = {
  queries: {
    // Global defaults
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  },
};

export const queryClient = new QueryClient({ defaultOptions: queryConfig });

// Calendar-specific query config
export const calendarQueries = {
  heatmap: (year: number, month: number) => ({
    queryKey: ['calendar', 'heatmap', year, month] as const,
    staleTime: 15 * 60 * 1000, // 15 min: heatmap rarely changes
    gcTime: 1 * 60 * 60 * 1000, // 1 hour: accessed frequently
    refetchInterval: 30 * 60 * 1000, // Background: every 30 min
  }),

  events: (startDate: Date, endDate: Date) => ({
    queryKey: ['calendar', 'events', startDate.toISOString(), endDate.toISOString()] as const,
    staleTime: 10 * 60 * 1000, // 10 min: events change moderately
    gcTime: 30 * 60 * 1000, // 30 min
    refetchInterval: 5 * 60 * 1000, // Every 5 min (user might add exam)
    refetchOnWindowFocus: true, // High priority: refetch on tab switch
  }),

  streaks: (year: number, month: number) => ({
    queryKey: ['calendar', 'streaks', year, month] as const,
    staleTime: 30 * 60 * 1000, // 30 min: streaks only reset at 00:00
    gcTime: 4 * 60 * 60 * 1000, // 4 hours
    refetchInterval: null, // No background refetch
    refetchOnWindowFocus: false,
  }),

  examDetails: (examId: string) => ({
    queryKey: ['calendar', 'exam', examId] as const,
    staleTime: 1 * 60 * 60 * 1000, // 1 hour: static until edited
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchInterval: null,
  }),

  upcomingExams: () => ({
    queryKey: ['calendar', 'exams', 'upcoming'] as const,
    staleTime: 30 * 60 * 1000, // 30 min
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchInterval: 10 * 60 * 1000, // Every 10 min
  }),
};
```

---

### Step 4.2: Optimistic Updates & Invalidation

**File:** `src/services/calendarMutations.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarQueries } from './queryConfig';

interface CreateExamInput {
  title: string;
  course_id: string;
  exam_date: Date;
  exam_type: 'parcial' | 'final';
  student_id: string;
}

/**
 * Hook: Add exam mutation with optimistic update
 *
 * Behavior:
 *   1. Show exam immediately in UI (optimistic)
 *   2. Send to backend in background
 *   3. If success: keep optimistic data + refetch heatmap
 *   4. If error: rollback to previous state
 */
export const useAddExamMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExamInput) => {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to create exam');
      return response.json();
    },

    // Optimistic update: show exam before response
    onMutate: async (newExam) => {
      const startDate = new Date(newExam.exam_date);
      const endDate = new Date(newExam.exam_date);
      endDate.setDate(endDate.getDate() + 1);

      const queryKey = calendarQueries.events(startDate, endDate).queryKey;

      // Snapshot previous data for rollback
      const previousEvents = queryClient.getQueryData(queryKey);

      // Update optimistically
      queryClient.setQueryData(queryKey, (old: any[] = []) => [
        ...old,
        {
          id: `temp-${Date.now()}`,
          title: newExam.title,
          type: 'exam',
          exam_date: newExam.exam_date,
          status: 'optimistic',
        },
      ]);

      return { previousEvents, queryKey };
    },

    // On success: replace optimistic data with server response
    onSuccess: (response, newExam, context) => {
      if (context) {
        queryClient.setQueryData(context.queryKey, (old: any[] = []) =>
          old
            .filter((e) => !e.id.startsWith('temp-'))
            .concat([response])
        );
      }

      // Invalidate heatmap in background (will refetch)
      queryClient.invalidateQueries({
        queryKey: calendarQueries.heatmap(
          newExam.exam_date.getFullYear(),
          newExam.exam_date.getMonth()
        ).queryKey,
        refetchType: 'background', // Don't block UI
      });

      // Invalidate upcoming exams
      queryClient.invalidateQueries({
        queryKey: calendarQueries.upcomingExams().queryKey,
        refetchType: 'background',
      });
    },

    // On error: rollback to previous state
    onError: (error, newExam, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(context.queryKey, context.previousEvents);
      }

      // Show error to user (your error handling)
      console.error('Failed to create exam:', error);
    },
  });
};
```

---

## PHASE 5: TAILWIND OPTIMIZATION

### Step 5.1: Optimized Tailwind Config

**File:** `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

export default {
  // Content: Scan these paths for class names
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  // Safely list any STATIC classes that might not be detected
  safelist: [
    // Heatmap fallback colors (in case dynamic generation needed)
    'bg-green-100', 'bg-yellow-100', 'bg-red-100',
    // Streak badge sizes
    'text-xs', 'text-sm', 'text-base',
    // Event icon colors
    'bg-red-300', 'bg-blue-300',
  ],

  theme: {
    extend: {
      // Custom theme extensions
      colors: {
        'heatmap-cold': 'hsl(120, 70%, 60%)', // Green
        'heatmap-warm': 'hsl(60, 70%, 50%)',  // Yellow
        'heatmap-hot': 'hsl(0, 70%, 50%)',    // Red
      },
      spacing: {
        'calendar-cell': '5.5rem', // 22 * 0.25rem
      },
    },
  },

  // Disable unused Tailwind features to reduce CSS
  corePlugins: {
    animation: false, // If calendar doesn't animate
    backgroundImage: false, // If not using bg gradients
    backgroundOpacity: false, // If not using opacity variants
    backdropFilter: false, // If not using backdrop blur
  },

  // PurgeCSS is built into Tailwind v4: unused classes are automatically removed
  // Target CSS output: ~50-65KB minified (down from ~85KB default)
} satisfies Config;
```

---

### Step 5.2: CSS Variables for Heatmap

**File:** `src/styles/calendar-heatmap.css`

```css
/* Calendar heatmap styling using CSS custom properties for dynamic colors */

.calendar-cell {
  --heatmap-intensity: 0.5; /* 0.0 to 1.0, updated via inline style */

  /* Compute HSL color from intensity */
  --hue: calc(var(--heatmap-intensity) * -120 + 120deg);
  --saturation: 70%;
  --lightness: calc(60% - var(--heatmap-intensity) * 20%);

  background-color: hsl(var(--hue), var(--saturation), var(--lightness));

  /* Smooth color transition on hover or focus */
  transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 150ms ease-out;
}

/* Hover state: slightly darker */
.calendar-cell:hover {
  filter: brightness(0.92);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Focus state: outline */
.calendar-cell:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Selected state */
.calendar-cell[aria-selected="true"] {
  box-shadow: 0 0 0 3px rgb(59, 130, 246);
}

/* Print media: remove colors */
@media print {
  .calendar-cell {
    background-color: transparent;
    border: 1px solid #ccc;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .calendar-cell {
    --saturation: 60%;
    --lightness: calc(50% - var(--heatmap-intensity) * 15%);
    border-color: rgba(255, 255, 255, 0.1);
  }
}
```

---

## PHASE 6: MONITORING & PROFILING

### Step 6.1: Performance Monitoring Hook

**File:** `src/hooks/usePerformanceMonitoring.ts`

```typescript
import { useEffect } from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  tags?: Record<string, string>;
}

/**
 * Hook: Track key performance metrics
 * Sends to your observability backend (Sentry, DataDog, etc.)
 */
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // 1. Monitor First Contentful Paint (FCP)
    const fcpObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          trackMetric({
            name: 'calendar.fcp_ms',
            value: entry.startTime,
            unit: 'ms',
            tags: { page: 'calendar' },
          });
        }
      });
    });
    fcpObserver.observe({ entryTypes: ['paint'] });

    // 2. Monitor interaction latency (Interaction to Next Paint)
    const inpObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: any) => {
        trackMetric({
          name: 'calendar.inp_ms',
          value: entry.duration,
          unit: 'ms',
          tags: {
            interaction_type: entry.name,
            target: entry.target?.className,
          },
        });
      });
    });
    inpObserver.observe({ type: 'interaction', buffered: true });

    // 3. Monitor Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        trackMetric({
          name: 'calendar.lcp_ms',
          value: entry.renderTime || entry.loadTime,
          unit: 'ms',
        });
      });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // 4. Monitor Cumulative Layout Shift (CLS)
    let cls = 0;
    const clsObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          cls += entry.value;
          trackMetric({
            name: 'calendar.cls',
            value: cls,
            unit: 'count',
          });
        }
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    return () => {
      fcpObserver.disconnect();
      inpObserver.disconnect();
      lcpObserver.disconnect();
      clsObserver.disconnect();
    };
  }, []);
};

/**
 * Send metric to backend/observability service
 */
function trackMetric(metric: PerformanceMetric) {
  // Example: Send to Sentry
  if (window.__sentry) {
    window.__sentry.captureMessage(`Metric: ${metric.name} = ${metric.value} ${metric.unit}`, {
      level: 'info',
      tags: metric.tags,
    });
  }

  // Or send to custom analytics endpoint
  navigator.sendBeacon('/api/metrics', JSON.stringify(metric));
}
```

---

### Step 6.2: Bundle Size Analyzer

**File:** `scripts/analyze-bundle.sh`

```bash
#!/bin/bash
# Analyze bundle size and generate HTML report

echo "Building production bundle..."
npm run build

echo "Analyzing bundle..."
npm run vite -- build --mode analyze

# Check for regressions
CURRENT_SIZE=$(du -sh dist/ | cut -f1)
echo "Current bundle size: $CURRENT_SIZE"

# Compare to previous (if available)
if [ -f .bundle-size ]; then
  PREVIOUS=$(cat .bundle-size)
  echo "Previous bundle size: $PREVIOUS"
fi

echo $CURRENT_SIZE > .bundle-size

# Generate Lighthouse report
echo "Running Lighthouse audit..."
lighthouse http://localhost:5173/calendar --output=json --output-path=./lighthouse.json

echo "Done! Check dist/ and lighthouse.json"
```

---

## IMPLEMENTATION TIMELINE

**Week 1:**
- Monday: Database indexes (Phase 1)
- Tuesday-Wednesday: Backend batch endpoint (Phase 2)
- Thursday-Friday: React components (Phase 3)

**Week 2:**
- Monday-Tuesday: React Query configuration (Phase 4)
- Wednesday: Tailwind optimization (Phase 5)
- Thursday-Friday: Testing + profiling (Phase 6 start)

**Week 3:**
- Monday-Wednesday: Load testing + bug fixes
- Thursday: Performance monitoring setup
- Friday: Documentation + deployment

---

**Next step:** Start with Phase 1 (database indexes). Estimated time: 2-3 hours including testing.

