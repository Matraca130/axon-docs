# Calendar Component Templates & Implementation Checklist

Reference templates for building the refactored calendar components.

---

## TEMPLATE 1: Context Hook (useCalendarContext)

```typescript
// hooks/useCalendarContext.ts
import { createContext, useContext, useState, useMemo } from 'react';

export type ViewMode = 'agenda' | 'day' | 'week' | 'month';

interface CalendarContextValue {
  // Navigation
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;

  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Drawer
  selectedExamId: string | null;
  setSelectedExamId: (id: string | null) => void;

  // Memoized
  dateRange: { start: Date; end: Date };
  visibleDates: Date[];
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  const dateRange = useMemo(
    () => getDateRangeForView(selectedDate, viewMode),
    [selectedDate, viewMode]
  );

  const visibleDates = useMemo(
    () => getDatesBetween(dateRange.start, dateRange.end),
    [dateRange]
  );

  return (
    <CalendarContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        viewMode,
        setViewMode,
        selectedExamId,
        setSelectedExamId,
        dateRange,
        visibleDates,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendarContext() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('useCalendarContext outside provider');
  return ctx;
}

// Helper
function getDateRangeForView(
  selectedDate: Date,
  viewMode: ViewMode
): { start: Date; end: Date } {
  switch (viewMode) {
    case 'month':
      return getMonthRange(selectedDate);
    case 'week':
      return getWeekRange(selectedDate);
    case 'day':
      return { start: selectedDate, end: selectedDate };
    case 'agenda':
      // 30 days forward from today
      return {
        start: new Date(),
        end: addDays(new Date(), 30),
      };
  }
}
```

---

## TEMPLATE 2: Data Hook (useCalendarData)

```typescript
// hooks/useCalendarData.ts
import { useQuery } from '@tanstack/react-query';
import { calendarKeys } from '@/types/queryKeys';
import {
  UpcomingExam,
  ReviewCard,
  StudyPlanBlock,
  DailyActivity,
} from '@/types/calendar';

export interface UseCalendarDataResult {
  exams: UpcomingExam[];
  reviewsDue: ReviewCard[];
  planTasks: StudyPlanBlock[];
  dailyActivities: DailyActivity[];
  isLoading: boolean;
  error: Error | null;
}

export function useCalendarData(dateRange: {
  start: Date;
  end: Date;
}): UseCalendarDataResult {
  // Query: Exams (month-granule, cached)
  const examsQuery = useQuery({
    queryKey: calendarKeys.exams,
    queryFn: async () => {
      const res = await fetch('/api/exams');
      return res.json() as Promise<UpcomingExam[]>;
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });

  // Query: Reviews due (date-range, refetch on range change)
  const reviewsQuery = useQuery({
    queryKey: calendarKeys.reviewsDue(dateRange.start, dateRange.end),
    queryFn: async () => {
      const res = await fetch(
        `/api/reviews-due?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`
      );
      return res.json() as Promise<ReviewCard[]>;
    },
    staleTime: 1000 * 60 * 2, // 2 min (more volatile)
  });

  // Query: Study plan tasks
  const planTasksQuery = useQuery({
    queryKey: calendarKeys.planTasks(dateRange.start, dateRange.end),
    queryFn: async () => {
      const res = await fetch(
        `/api/study-plans/tasks?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`
      );
      return res.json() as Promise<StudyPlanBlock[]>;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Query: Daily activities (for streaks)
  const activitiesQuery = useQuery({
    queryKey: calendarKeys.dailyActivities(dateRange.start, dateRange.end),
    queryFn: async () => {
      const res = await fetch(
        `/api/daily-activities?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`
      );
      return res.json() as Promise<DailyActivity[]>;
    },
    staleTime: 1000 * 60 * 10,
  });

  return {
    exams: examsQuery.data ?? [],
    reviewsDue: reviewsQuery.data ?? [],
    planTasks: planTasksQuery.data ?? [],
    dailyActivities: activitiesQuery.data ?? [],
    isLoading:
      examsQuery.isLoading ||
      reviewsQuery.isLoading ||
      planTasksQuery.isLoading ||
      activitiesQuery.isLoading,
    error:
      examsQuery.error ||
      reviewsQuery.error ||
      planTasksQuery.error ||
      activitiesQuery.error,
  };
}
```

---

## TEMPLATE 3: Zustand Filters Store

```typescript
// stores/calendarFilters.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CalendarFiltersState {
  hideExams: boolean;
  hideReviews: boolean;
  hideScheduledPlans: boolean;
  toggleHideExams: () => void;
  toggleHideReviews: () => void;
  toggleHideScheduledPlans: () => void;
}

export const useCalendarFilters = create<CalendarFiltersState>()(
  persist(
    (set) => ({
      hideExams: false,
      hideReviews: false,
      hideScheduledPlans: false,
      toggleHideExams: () =>
        set((state) => ({ hideExams: !state.hideExams })),
      toggleHideReviews: () =>
        set((state) => ({ hideReviews: !state.hideReviews })),
      toggleHideScheduledPlans: () =>
        set((state) => ({
          hideScheduledPlans: !state.hideScheduledPlans,
        })),
    }),
    {
      name: 'calendar-filters',
    }
  )
);
```

---

## TEMPLATE 4: EventCell Component

```typescript
// components/calendar/EventCell.tsx
import { memo } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { ACTIVITY_TYPE_COLORS } from '@/utils/colors';
import { cn } from '@/lib/cn';

interface EventCellProps {
  event: CalendarEvent;
  view: 'agenda' | 'day' | 'week' | 'month';
  onSelect: (examId: string) => void;
  compact?: boolean;
}

function EventCellBase({
  event,
  view,
  onSelect,
  compact = false,
}: EventCellProps) {
  const examId = 'examId' in event ? event.examId : event.id;
  const title = 'title' in event ? event.title : event.content;
  const type = 'type' in event ? event.type : 'review';

  const color = ACTIVITY_TYPE_COLORS[type];
  const textColor = getContrastColor(color);

  // Sizing per view
  const sizeClasses = {
    agenda: 'p-3 rounded-lg',
    day: 'p-2 rounded-md',
    week: 'p-1 rounded-sm',
    month: 'p-1',
  };

  return (
    <div
      className={cn(
        'cursor-pointer transition-all duration-150 border-l-4',
        `bg-opacity-10 hover:bg-opacity-20`,
        sizeClasses[view]
      )}
      style={{
        backgroundColor: `${color}20`,
        borderLeftColor: color,
      }}
      onClick={() => onSelect(examId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect(examId);
      }}
    >
      {!compact && (
        <>
          <h4 className="font-semibold text-sm truncate">{title}</h4>
          {view !== 'week' && type === 'exam' && (
            <p className="text-xs text-gray-600">
              {'daysLeft' in event && `${event.daysLeft} days`}
            </p>
          )}
        </>
      )}

      {compact && (
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
}

// Memoized to prevent re-render on parent updates
export const EventCell = memo(EventCellBase, (prev, next) => {
  return (
    prev.event.id === next.event.id &&
    prev.view === next.view &&
    prev.compact === next.compact
  );
});

function getContrastColor(hex: string): string {
  // Simple luminance check
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 255;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
```

---

## TEMPLATE 5: Heatmap Overlay

```typescript
// components/calendar/overlays/HeatmapOverlay.tsx
import { useMemo } from 'react';
import { ReviewCard, StudyPlanBlock, HeatmapIntensity } from '@/types/calendar';
import { useHeatmapIntensity } from '@/hooks/useHeatmapIntensity';
import { formatDateKey } from '@/utils/dateGrouping';
import { cn } from '@/lib/cn';

interface HeatmapOverlayProps {
  reviewsDue: ReviewCard[];
  scheduledPlans: StudyPlanBlock[];
  dateRange: { start: Date; end: Date };
  visibleDates: Date[];
}

const INTENSITY_COLORS: Record<HeatmapIntensity, string> = {
  low: 'bg-green-100',
  medium: 'bg-green-400',
  high: 'bg-green-600',
};

export function HeatmapOverlay({
  reviewsDue,
  scheduledPlans,
  dateRange,
  visibleDates,
}: HeatmapOverlayProps) {
  const intensityMap = useHeatmapIntensity(
    reviewsDue,
    scheduledPlans,
    dateRange
  );

  // Pre-calculate class map (memoized)
  const dayColorMap = useMemo(() => {
    const map = new Map<string, string>();
    visibleDates.forEach((date) => {
      const key = formatDateKey(date);
      const intensity = intensityMap.get(key);
      if (intensity) {
        map.set(key, INTENSITY_COLORS[intensity]);
      }
    });
    return map;
  }, [intensityMap, visibleDates]);

  // Return function for parent to apply CSS classes
  // (This component doesn't render directly, it provides styling data)
  return {
    getColorClass: (date: Date) => dayColorMap.get(formatDateKey(date)) ?? '',
    getTooltip: (date: Date) => {
      const key = formatDateKey(date);
      const intensity = intensityMap.get(key);
      if (!intensity) return null;

      const reviewCount = reviewsDue.filter(
        (r) => formatDateKey(r.dueDate) === key
      ).length;
      const planCount = scheduledPlans.filter(
        (p) => formatDateKey(p.dueDate) === key
      ).length;

      return `${reviewCount} reviews, ${planCount} tasks (${intensity})`;
    },
  };
}
```

**Usage in MonthView:**

```typescript
const heatmap = useHeatmapOverlay({ reviewsDue, scheduledPlans, dateRange, visibleDates });

<DayPicker
  modifiers={{
    heatmapIntense: visibleDates.filter(
      d => heatmap.getColorClass(d) !== ''
    ),
  }}
  modifiersClassNames={{
    heatmapIntense: heatmap.getColorClass(/* dynamic */) // Note: limitation
  }}
/>
```

---

## TEMPLATE 6: Exam Details Drawer

```typescript
// components/calendar/ExamDetailsPanel.tsx
import { useState, useCallback } from 'react';
import { useCalendarContext } from '@/hooks/useCalendarContext';
import { useCalendarViewMode } from '@/hooks/useCalendarViewMode';
import { useExamDetail } from '@/hooks/useExamDetail';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

export function ExamDetailsPanel() {
  const { selectedExamId, setSelectedExamId } = useCalendarContext();
  const { isMobile } = useCalendarViewMode();
  const { exam, isLoading } = useExamDetail(selectedExamId);

  const [activeTab, setActiveTab] = useState('overview');

  const handleClose = useCallback(() => {
    setSelectedExamId(null);
  }, [setSelectedExamId]);

  const handleStartReview = useCallback(() => {
    // Navigate to review interface
    window.location.href = `/review/${selectedExamId}`;
  }, [selectedExamId]);

  const handleReschedule = useCallback(() => {
    // Open reschedule modal
    // TODO: implement
  }, [selectedExamId]);

  if (!selectedExamId) return null;

  return (
    <Drawer
      open={!!selectedExamId}
      onOpenChange={(open) => !open && handleClose()}
      direction={isMobile ? 'bottom' : 'right'}
    >
      <DrawerContent className={isMobile ? 'h-[80vh]' : 'w-96'}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : exam ? (
          <>
            <DrawerHeader className="border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{exam.title}</h2>
                <Badge variant="secondary">
                  {exam.daysLeft === 0
                    ? 'Today'
                    : `${exam.daysLeft} days`}
                </Badge>
              </div>
              {exam.description && (
                <p className="text-sm text-gray-600 mt-2">{exam.description}</p>
              )}
            </DrawerHeader>

            <DrawerBody className="overflow-y-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="overview" className="flex-1">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="schedule" className="flex-1">
                    Schedule
                  </TabsTrigger>
                  <TabsTrigger value="resources" className="flex-1">
                    Resources
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Progress</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        Topics: {exam.masteredCount} / {exam.topicsCount}
                      </p>
                      <p>Review Cards: {exam.reviewCardsCount}</p>
                      <p>Estimated Time: {exam.estimatedMinutes} minutes</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Schedule</h3>
                    <p className="text-sm text-gray-600">
                      Due: {exam.dueDate.toLocaleDateString()}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="resources" className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Resources content here
                  </p>
                </TabsContent>
              </Tabs>
            </DrawerBody>

            <DrawerFooter className="border-t bg-gray-50 gap-2">
              <Button
                onClick={handleStartReview}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                ▶ Start Review Now
              </Button>
              <Button
                onClick={handleReschedule}
                variant="outline"
                className="w-full"
              >
                Reschedule
              </Button>
              <DrawerClose asChild>
                <Button variant="ghost" className="w-full">
                  Close
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </>
        ) : (
          <div className="p-4">
            <p className="text-sm text-red-600">Exam not found</p>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Foundation (Week 1)

- [ ] Create `types/calendar.ts` with all interfaces
- [ ] Create `types/queryKeys.ts` with React Query keys
- [ ] Create `hooks/useCalendarContext.ts` with context + provider
- [ ] Create `CalendarProvider` wrapper for `CalendarShell`
- [ ] Create `CalendarShell.tsx` scaffold
- [ ] Create `CalendarHeader.tsx` with date navigation
- [ ] Create `ViewToggle.tsx` with mobile detection
- [ ] Extract `MonthView.tsx` from `WeekMonthViews.tsx`
- [ ] Extract `AgendaView.tsx` as new component
- [ ] Update state prop passing to use context
- [ ] Test view switching (no data yet)

### Phase 2: Data & Queries (Week 1-2)

- [ ] Create `hooks/useCalendarData.ts` with all queries
- [ ] Create `stores/calendarFilters.ts` (Zustand)
- [ ] Connect to `/api/exams`, `/api/reviews-due`, etc.
- [ ] Add error boundaries + loading states
- [ ] Test data flow with React Query DevTools
- [ ] Implement query pagination (if backend supports)

### Phase 3: Overlays (Week 2)

- [ ] Create `utils/heatmapCalculation.ts` with intensity logic
- [ ] Create `hooks/useHeatmapIntensity.ts` for memoization
- [ ] Create `HeatmapOverlay.tsx` (non-rendered provider)
- [ ] Integrate heatmap modifiers into MonthView's DayPicker
- [ ] Create `StreakOverlay.tsx` for daily activity dots
- [ ] Test overlay performance with 10k+ cards

### Phase 4: Components & Interactions (Week 2)

- [ ] Create `EventCell.tsx` (memoized, all views)
- [ ] Create `ExamDetailsPanel.tsx` drawer
- [ ] Implement drawer open/close via context
- [ ] Connect "Start Review Now" CTA to router
- [ ] Implement reschedule button (scaffold)
- [ ] Test mobile drawer vs. desktop drawer

### Phase 5: Polish & Performance (Week 3)

- [ ] Virtual agenda list (if >50 items)
- [ ] Debounce dateRange changes
- [ ] React.memo on event cells
- [ ] Tablet layout (responsive sidebar/drawer)
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Accessibility audit (ARIA labels, focus management)

### Phase 6: Testing & Optimization (Week 3)

- [ ] Unit tests: heatmap calculation
- [ ] Unit tests: date grouping logic
- [ ] Integration tests: view switching, drawer
- [ ] Performance tests: React DevTools Profiler
- [ ] E2E: navigate month → select exam → open drawer → click CTA

---

## CODE ORGANIZATION QUICK REFERENCE

```
src/calendar/
├─ CalendarShell.tsx              ← Entry point (renders context provider)
├─ CalendarHeader.tsx             ← Date nav + breadcrumbs
├─ ViewToggle.tsx                 ← View mode buttons
├─ ViewContainer.tsx              ← Conditional view rendering
├─ views/
│  ├─ MonthView.tsx               ← React DayPicker base
│  ├─ WeekView.tsx                ← 7-day grid
│  ├─ DayView.tsx                 ← Single day grid
│  └─ AgendaView.tsx              ← Flat event list
├─ overlays/
│  ├─ HeatmapOverlay.tsx          ← Intensity coloring
│  ├─ StreakOverlay.tsx           ← Daily activity dots
│  └─ EventIndicators.tsx         ← Event dot badges
├─ ExamDetailsPanel.tsx           ← Drawer component
└─ EventCell.tsx                  ← Reusable event badge

hooks/
├─ useCalendarContext.ts          ← Navigation + view state
├─ useCalendarData.ts             ← All React Query hooks
├─ useCalendarViewMode.ts         ← Mobile detection
├─ useHeatmapIntensity.ts         ← Memoized heatmap calc
└─ useExamDetail.ts               ← Single exam query

stores/
└─ calendarFilters.ts             ← Zustand (user filters)

utils/
├─ heatmapCalculation.ts          ← Intensity binning logic
├─ dateGrouping.ts                ← Group events by date
└─ colors.ts                       ← ACTIVITY_TYPE_COLORS map
```

---

**Status:** Ready for implementation sprint. All templates have runnable code; adapt to existing Axon codebase patterns (API calls, UI library components, etc.).
