# Calendar Dev Reference — Quick Lookup Sheet

Print this. Tape it to your monitor. Reference during implementation.

---

## COMPONENT CHECKLIST

```
□ CalendarShell
  ├─ Props: (none, uses context provider)
  ├─ State: viewMode, selectedDate, selectedExamId (context)
  ├─ Renders: Header + ViewContainer + Panel
  └─ Size: ~50 lines

□ CalendarHeader
  ├─ Props: (none, from context)
  ├─ Renders: DateNavigator + ViewToggle + breadcrumbs
  └─ Size: ~40 lines

□ ViewToggle
  ├─ Props: isMobile, viewMode, onViewModeChange
  ├─ Mobile: shows [Agenda] only
  ├─ Desktop: shows [Agenda] [Day] [Week] [Month]
  └─ Size: ~30 lines

□ MonthView
  ├─ Props: selectedDate, exams, reviews, activities, onSelect
  ├─ Renders: DayPicker + HeatmapOverlay + StreakOverlay
  ├─ Uses: HeatmapIntensity (memoized), DayPicker modifiers
  └─ Size: ~140 lines

□ AgendaView
  ├─ Props: selectedDate, events, onSelectExam
  ├─ Groups: events by date
  ├─ Virtual: if >50 items
  ├─ Renders: AgendaDateSection[] → AgendaEventCard[] → EventCell
  └─ Size: ~120 lines

□ WeekView
  ├─ Props: selectedDate, exams, reviews
  ├─ Renders: WeekHeader (7 days) + TimeGrid (24 × 7)
  ├─ TimeSlot: positioned absolutely (CSS Grid or Flexbox)
  └─ Size: ~150 lines

□ DayView
  ├─ Props: selectedDate, exams, reviews
  ├─ Renders: DayHeader + TimeGrid (24 rows)
  └─ Size: ~100 lines

□ HeatmapOverlay
  ├─ Input: reviewsDue, scheduledPlans, dateRange
  ├─ Calc: useHeatmapIntensity() → Map<dateKey, intensity>
  ├─ Output: colorMap for DayPicker modifiers
  ├─ Perf: O(n) once, memoized
  └─ Size: ~80 lines

□ StreakOverlay
  ├─ Input: dailyActivities
  ├─ Output: Set of completed dates
  ├─ Render: green dots (absolute positioned)
  └─ Size: ~60 lines

□ EventCell
  ├─ Props: event, view, onSelect, compact
  ├─ Views: agenda (full) | week/day (compact) | month (minimal)
  ├─ Memo: true (prevent parent re-renders)
  └─ Size: ~50 lines

□ ExamDetailsPanel
  ├─ State: selectedExamId (context), open/close logic
  ├─ Render: Drawer (responsive direction)
  ├─ Content: Tabs (Overview | Schedule | Resources)
  ├─ CTA: "▶ Start Review Now" (navigate /review/:id)
  └─ Size: ~200 lines
```

---

## STATE QUICK REFERENCE

```
Context (useCalendarContext):
  ├─ selectedDate: Date
  ├─ setSelectedDate: (date: Date) => void
  ├─ viewMode: 'agenda' | 'day' | 'week' | 'month'
  ├─ setViewMode: (mode) => void
  ├─ selectedExamId: string | null
  ├─ setSelectedExamId: (id: string | null) => void
  ├─ dateRange: { start: Date; end: Date } (derived)
  └─ visibleDates: Date[] (derived)

React Query (useCalendarData):
  ├─ exams: UpcomingExam[] (5 min stale)
  ├─ reviewsDue: ReviewCard[] (2 min stale, refetch on range change)
  ├─ planTasks: StudyPlanBlock[] (5 min stale)
  └─ dailyActivities: DailyActivity[] (10 min stale)

Zustand (useCalendarFilters):
  ├─ hideExams: boolean
  ├─ hideReviews: boolean
  ├─ hideScheduledPlans: boolean
  └─ (all persisted via localStorage)

Local State (inside components):
  ├─ MonthView: hoverDay (tooltip)
  ├─ AgendaView: scrollPos (virtualization)
  ├─ ExamDetailsPanel: activeTab ('overview' | 'schedule' | 'resources')
  └─ (all ephemeral, no persistence)
```

---

## TYPE IMPORTS

```typescript
// From types/calendar.ts
import {
  ActivityType,
  UpcomingExam,
  ReviewCard,
  StudyPlanBlock,
  DailyActivity,
  CalendarEvent,
  HeatmapIntensity,
  TimeSlot,
} from '@/types/calendar';

// From types/queryKeys.ts
import { calendarKeys } from '@/types/queryKeys';

// From hooks/useCalendarContext.ts
import { CalendarProvider, useCalendarContext } from '@/hooks/useCalendarContext';

// From hooks/useCalendarData.ts
import { useCalendarData } from '@/hooks/useCalendarData';

// From hooks/useHeatmapIntensity.ts
import { useHeatmapIntensity } from '@/hooks/useHeatmapIntensity';

// From stores/calendarFilters.ts
import { useCalendarFilters } from '@/stores/calendarFilters';

// From utils/colors.ts
import { ACTIVITY_TYPE_COLORS, getContrastColor } from '@/utils/colors';

// From utils/heatmapCalculation.ts
import { calculateDayIntensity } from '@/utils/heatmapCalculation';

// From utils/dateGrouping.ts
import { groupEventsByDate, formatDateKey } from '@/utils/dateGrouping';
```

---

## COLOR SYSTEM

```
Activity Type → Hex    → Tailwind Class
─────────────────────────────────────────
exam         → #ef4444 → red-500 / bg-red-100
review       → #3b82f6 → blue-500 / bg-blue-100
plan_task    → #8b5cf6 → purple-500 / bg-purple-100
quiz         → #f59e0b → amber-500 / bg-amber-100
reading      → #10b981 → green-500 / bg-green-100
lecture      → #ec4899 → pink-500 / bg-pink-100
practice     → #06b6d4 → cyan-500 / bg-cyan-100

Heatmap Intensity → Tailwind
──────────────────────────────
low              → bg-green-100
medium           → bg-green-400
high             → bg-green-600

Usage:
  backgroundColor: `${ACTIVITY_TYPE_COLORS[type]}20`  // 20% opacity
  borderLeftColor: ACTIVITY_TYPE_COLORS[type]
```

---

## COMMON PATTERNS

### Get Date Range
```typescript
const dateRange = {
  start: getFirstDayOfMonth(selectedDate),
  end: getLastDayOfMonth(selectedDate),
};
// Or per view:
const dateRange = getDateRangeForView(selectedDate, viewMode);
```

### Filter Events by User Prefs
```typescript
const { hideExams, hideReviews } = useCalendarFilters();
const filtered = events.filter(e => {
  if (hideExams && e.type === 'exam') return false;
  if (hideReviews && e.type === 'review') return false;
  return true;
});
```

### Calculate Day Intensity
```typescript
const intensityMap = useHeatmapIntensity(reviewsDue, planTasks, dateRange);
const intensity = intensityMap.get(formatDateKey(date)); // 'low' | 'medium' | 'high' | undefined
```

### Group Events by Date
```typescript
const grouped = groupEventsByDate(events, startDate);
// Returns: { date, items: CalendarEvent[] }[]
```

### Memoized Callback in View
```typescript
const handleSelectExam = useCallback(
  (examId: string) => {
    setSelectedExamId(examId);
  },
  [setSelectedExamId]
);
```

### Virtual Scrolling (AgendaView)
```typescript
const virtualizer = useVirtualizer({
  count: grouped.length,
  getScrollElement: () => containerRef.current,
  estimateSize: () => 140,
  overscan: 5,
});
```

### Mobile Detection
```typescript
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const mediaQuery = window.matchMedia('(max-width: 768px)');
  setIsMobile(mediaQuery.matches);
  mediaQuery.addEventListener('change', (e) => setIsMobile(e.matches));
  return () => mediaQuery.removeEventListener('change', ...);
}, []);
```

---

## API ENDPOINTS (EXPECTED)

```
GET /api/exams
  Response: UpcomingExam[]
  Caching: 5 min (stale)

GET /api/reviews-due?start=ISO&end=ISO
  Response: ReviewCard[]
  Caching: 2 min, refetch on range change

GET /api/study-plans/tasks?start=ISO&end=ISO
  Response: StudyPlanBlock[]
  Caching: 5 min

GET /api/daily-activities?start=ISO&end=ISO
  Response: DailyActivity[]
  Caching: 10 min

GET /api/exams/:examId
  Response: UpcomingExam (with full details)
  Caching: 1 min (drawer opened)
```

---

## PERFORMANCE TARGETS

```
Heatmap calculation:       <50ms   (memoized, O(n))
Agenda scroll:             >60fps  (virtual list >50 items)
First interaction:         <400ms  (parallel queries)
View switch animation:     <200ms  (CSS transform)
Drawer open:               <200ms  (lazy detail query)
10k+ card scale:           <200ms  (pre-calc + memoize)
```

---

## COMMON GOTCHAS

```
✗ DON'T:
  - Pass all events to MonthView (needs filtering)
  - Recalculate heatmap every render (use useMemo)
  - Create new intensityMap in every render
  - Render 10k+ agenda items without virtual scrolling
  - Forget to memoize EventCell (will re-render on parent updates)
  - Pass event obj directly as key (use event.id)
  - Create inline arrow functions in props (breaks memoization)

✓ DO:
  - Memoize expensive calculations (useMemo, useCallback)
  - Filter events via Zustand store (Axon pattern)
  - Use context for navigation state (viewMode, selectedDate)
  - Virtual scroll if event count >50
  - Memo EventCell with custom equality check
  - Use formatDateKey for consistent date grouping
  - Lazy load exam detail (only when drawer opens)
  - Handle error states (fallback to empty arrays)
```

---

## TESTING QUICK START

```typescript
// Unit test: heatmap calculation
test('intensityMap bins correctly', () => {
  const reviews = [
    { dueDate: new Date('2026-03-28'), ... },
    { dueDate: new Date('2026-03-28'), ... },
    { dueDate: new Date('2026-03-28'), ... },
  ];
  const result = calculateDayIntensity(reviews, [], dateRange);
  expect(result.get('2026-03-28')).toBe('medium'); // 3 items → 0.30 normalized
});

// Component test: MonthView renders heatmap
test('MonthView applies heatmap modifiers', () => {
  render(<MonthView reviews={mockReviews} ... />);
  expect(screen.getByRole('grid')).toHaveClass('has-heatmap');
});

// Integration test: Click event → drawer opens
test('Clicking event opens ExamDetailsPanel', async () => {
  render(<CalendarShell />);
  const eventCard = screen.getByText('Midterm Exam');
  fireEvent.click(eventCard);
  await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible());
});
```

---

## FILE LOCATIONS (REPO STRUCTURE)

```
src/
├─ components/calendar/
│  ├─ CalendarShell.tsx
│  ├─ CalendarHeader.tsx
│  ├─ ViewToggle.tsx
│  ├─ ViewContainer.tsx
│  ├─ EventCell.tsx
│  ├─ ExamDetailsPanel.tsx
│  ├─ views/
│  │  ├─ MonthView.tsx
│  │  ├─ AgendaView.tsx
│  │  ├─ WeekView.tsx
│  │  └─ DayView.tsx
│  └─ overlays/
│     ├─ HeatmapOverlay.tsx
│     └─ StreakOverlay.tsx
│
├─ hooks/
│  ├─ useCalendarContext.ts
│  ├─ useCalendarData.ts
│  ├─ useCalendarViewMode.ts
│  ├─ useHeatmapIntensity.ts
│  └─ useExamDetail.ts
│
├─ stores/
│  └─ calendarFilters.ts
│
├─ types/
│  ├─ calendar.ts
│  └─ queryKeys.ts
│
└─ utils/
   ├─ heatmapCalculation.ts
   ├─ dateGrouping.ts
   └─ colors.ts
```

---

## KEYBOARD SHORTCUTS (Accessibility)

```
Tab              → Focus navigation
Shift+Tab        → Focus previous
Enter            → Select date / Open drawer / Submit action
Escape           → Close drawer / Cancel action
Arrow Keys       → Navigate calendar grid (if supported by react-day-picker)
Alt+V            → Open view menu (if implemented)
```

---

## DEBUGGING TIPS

```
// Check heatmap calc
const { exams, reviews, plans } = useCalendarData(dateRange);
const intensityMap = useHeatmapIntensity(reviews, plans, dateRange);
console.log('Intensity:', Object.fromEntries(intensityMap)); // Map → object

// Check context state
const cal = useCalendarContext();
console.log('Selected date:', cal.selectedDate);
console.log('View mode:', cal.viewMode);
console.log('Date range:', cal.dateRange);

// Check React Query cache
import { useQueryClient } from '@tanstack/react-query';
const qc = useQueryClient();
console.log('Cache:', qc.getQueryData(calendarKeys.exams));

// Check Zustand store
const filters = useCalendarFilters();
console.log('Filters:', { hideExams: filters.hideExams, ... });

// React DevTools Profiler
// → Profile view switch, heatmap recalc, agenda scroll
// Target: <50ms heatmap, >60fps scroll

// Network tab
// → Check parallel query timing (should all start at t=0)
// → Stale times (reviews should refetch on range change)
```

---

## DEPLOYMENT CHECKLIST

- [ ] All components created + split (6 components)
- [ ] All types defined (interfaces in types/calendar.ts)
- [ ] Context provider wraps page
- [ ] React Query hooks connected to APIs
- [ ] Zustand store persists to localStorage
- [ ] Mobile detection working (<768px → Agenda)
- [ ] HeatmapOverlay memoized + <50ms
- [ ] Virtual scrolling for >50 agenda items
- [ ] ExamDetailsPanel drawer opens/closes
- [ ] CTA button navigates to /review/:id
- [ ] Error states handled (fallback to empty arrays)
- [ ] 95+ test coverage
- [ ] Lighthouse >90
- [ ] No WAVE violations
- [ ] Keyboard nav working (Tab, Enter, Escape)

---

**Print this. Reference during coding. Ship fast.**
