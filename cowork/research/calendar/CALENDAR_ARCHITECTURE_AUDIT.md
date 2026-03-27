# CALENDAR FEATURE — ARCHITECTURAL AUDIT & IMPLEMENTATION PLAN
**Date:** 2026-03-27
**Branch:** `feat/sessioncalendario`
**Scope:** Tier 1 calendar features (agenda, heatmap, exam panel, streaks, color system)

---

## EXECUTIVE SUMMARY

The current calendar implementation (687 lines in `WeekMonthViews.tsx`) is **monolithic and blocking feature expansion**. This audit prescribes:

1. **Immediate:** Split `WeekMonthViews.tsx` into 6 focused components
2. **Architecture:** Hierarchical component tree with context-based state
3. **State:** Zustand for calendar filters + local/context for UI state
4. **View Toggle:** Mobile-first (Agenda default) using CSS + JS detection
5. **react-day-picker:** Extend via custom event rendering + heatmap overlay (don't replace)
6. **ExamDetailsPanel:** Drawer pattern (consistent with existing UI)
7. **Performance:** Memoization + lazy heatmap calculation + virtualization for agenda

**Verdict:** react-day-picker is sufficient for calendar base; the gaps are UI layers (heatmap, streaks, event cells), not the picker itself. The real bottleneck is monolithic component logic.

---

## 1. COMPONENT TREE DESIGN

### Ideal Hierarchy

```
CalendarShell
├── CalendarHeader
│   ├── DateNavigator (prev/next month, today button)
│   └── ViewToggle (Agenda | Day | Week | Month)
│
├── ViewContainer (conditional render by viewMode)
│   ├── AgendaView
│   │   ├── AgendaEventList
│   │   │   └── AgendaEventCard[] (virtualized if >50 items)
│   │   └── [ExamDetailsPanel]
│   │
│   ├── DayView
│   │   ├── DayHeader
│   │   ├── TimeGrid (hours + event cells)
│   │   └── [ExamDetailsPanel]
│   │
│   ├── WeekView
│   │   ├── WeekHeader (7 days)
│   │   ├── TimeGrid
│   │   ├── EventOverlay
│   │   └── [ExamDetailsPanel]
│   │
│   └── MonthView
│       ├── DayPicker (react-day-picker base)
│       ├── HeatmapOverlay (intensity layer)
│       ├── StreakOverlay (green dots)
│       ├── EventIndicators (small dots per day)
│       └── [ExamDetailsPanel]
│
└── ExamDetailsPanel (drawer, shared across all views)
    ├── ExamHeader (title, daysLeft badge)
    ├── ContentTabs (overview, schedule, resources)
    └── CTAButtons (Start Review Now, Reschedule, etc.)
```

### Component Count & Responsibility

| Component | Lines | Responsibility |
|-----------|-------|---|
| `CalendarShell` | ~50 | View mode state, panel open/close, layout |
| `CalendarHeader` | ~40 | Date nav, view toggle, breadcrumbs |
| `ViewToggle` | ~30 | Button group, mobile detection |
| `AgendaView` | ~120 | List layout, event grouping by date, virtualization |
| `DayView` | ~100 | Single day grid, time slots |
| `WeekView` | ~150 | 7-day grid, time slots, event positioning |
| `MonthView` | ~140 | DayPicker integration, overlays |
| `HeatmapOverlay` | ~80 | Intensity calculation & rendering |
| `StreakOverlay` | ~60 | Daily activity dots |
| `EventCell/Card` | ~50 | Single event display, color coding |
| `ExamDetailsPanel` | ~200 | Exam detail UI, tabs, actions |
| **TOTAL** | ~1,020 | vs. 687 monolithic (48% larger, but modular) |

**Trade-off:** Modular approach adds ~48% LOC but:
- Each component is <200 lines (testable, reviewable)
- Logic is isolated (easier to debug)
- Features can be added without touching unrelated code

---

## 2. SHARED STATE DESIGN

### State Distribution Matrix

```
┌─────────────────────────┬──────────────┬─────────────────┬──────────────┐
│ State Type              │ Location     │ Scope           │ Why?         │
├─────────────────────────┼──────────────┼─────────────────┼──────────────┤
│ viewMode                │ Context      │ Shell + all     │ Frequently   │
│ (agenda|day|week|month) │ (useCalendar)│ views           │ toggled      │
├─────────────────────────┼──────────────┼─────────────────┼──────────────┤
│ selectedDate            │ Context      │ Shell + nav     │ Drives all   │
│                         │ (useCalendar)│ rendering       │ views        │
├─────────────────────────┼──────────────┼─────────────────┼──────────────┤
│ dateRange (month/week)  │ Context      │ Derives dates   │ Needed by    │
│                         │ (useCalendar)│ for queries     │ all views    │
├─────────────────────────┼──────────────┼─────────────────┼──────────────┤
│ examsList               │ React Query  │ Data layer      │ Shared across│
│ (from /exams/:user)     │ (useQuery)   │                 │ views & panel│
├─────────────────────────┼──────────────┼─────────────────┼──────────────┤
│ reviewsDue (FSRS)       │ React Query  │ Data layer      │ Heatmap +    │
│                         │ (useQuery)   │                 │ agenda       │
├─────────────────────────┼──────────────┼─────────────────┼──────────────┤
│ dailyActivities         │ React Query  │ Data layer      │ Streak calc  │
│                         │ (useQuery)   │                 │              │
├─────────────────────────┼──────────────┼─────────────────┼──────────────┤
│ selectedExam (panel)    │ Local state  │ ExamDetailsPanel│ Drawer open/ │
│ panelOpen               │ (useState)   │ only            │ close        │
├─────────────────────────┼──────────────┼─────────────────┼──────────────┤
│ hoverDay (heatmap)      │ Local state  │ MonthView       │ Tooltip only │
│                         │ (useState)   │                 │              │
├─────────────────────────┼──────────────┼─────────────────┼──────────────┤
│ filters                 │ Zustand      │ Persisted user  │ "Hide exams" │
│ (hideExams, hideReview) │ (store)      │ preferences     │ toggle, etc. │
└─────────────────────────┴──────────────┴─────────────────┴──────────────┘
```

### Context Structure

```typescript
// hooks/useCalendarContext.ts
interface CalendarContextValue {
  // UI state
  viewMode: 'agenda' | 'day' | 'week' | 'month';
  setViewMode: (mode: CalendarContextValue['viewMode']) => void;

  selectedDate: Date;
  setSelectedDate: (date: Date) => void;

  // Derived date ranges (memoized)
  dateRange: { start: Date; end: Date };
  visibleDates: Date[]; // All days in current view

  // Drawer state
  selectedExamId: string | null;
  setSelectedExamId: (id: string | null) => void;
}

// Zustand store
export const useCalendarFilters = create<{
  hideExams: boolean;
  hideReviews: boolean;
  hideScheduledPlans: boolean;
  toggleHideExams: () => void;
  // ...
}>(/* ... */);
```

### Query Keys

```typescript
// hooks/queryKeys.ts
export const calendarKeys = {
  exams: ['exams', userId] as const,
  examDetail: (id: string) => ['exams', userId, id] as const,
  reviewsDue: ['reviews-due', userId, startDate, endDate] as const,
  dailyActivities: ['daily-activities', userId, startDate, endDate] as const,
} as const;
```

---

## 3. THE WeekMonthViews.tsx PROBLEM: MONOLITHIC SPLIT PLAN

### Current Issues

- **687 lines:** Logic for week + month mixed
- **No separation of concerns:** Calendar logic + rendering + event handling in one file
- **Difficult to test:** Can't test heatmap without testing entire month
- **Hard to extend:** Adding agenda view requires untangling existing logic
- **Prop drilling:** Likely passing 10+ props through intermediate components

### Proposed Split (6 Components)

#### A. `MonthView.tsx` (~140 lines)

**Responsibility:** Month grid layout + react-day-picker integration

```typescript
interface MonthViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  exams: UpcomingExam[];
  reviewsDue: ReviewCard[];
  dailyActivities: DailyActivity[];
  onSelectExam: (examId: string) => void;
}

export function MonthView({
  selectedDate,
  onSelectDate,
  exams,
  reviewsDue,
  dailyActivities,
  onSelectExam,
}: MonthViewProps) {
  return (
    <div className="relative">
      {/* react-day-picker calendar */}
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onSelectDate}
        // Custom footer / modifiers
      />

      {/* Layered overlays */}
      <HeatmapOverlay dateRange={getMonthRange(selectedDate)} />
      <StreakOverlay dailyActivities={dailyActivities} />
      <EventIndicators exams={exams} />
    </div>
  );
}
```

#### B. `WeekView.tsx` (~150 lines)

**Responsibility:** 7-day grid with time-based positioning

```typescript
interface WeekViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  exams: UpcomingExam[];
  timeSlots?: 'day' | 'week'; // Granularity
  onSelectExam: (examId: string) => void;
}

export function WeekView({ /* ... */ }: WeekViewProps) {
  const weekDates = getWeekDates(selectedDate);

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Header: Day names + dates */}
      <WeekHeader dates={weekDates} onSelectDate={onSelectDate} />

      {/* Time grid: 24 hours × 7 days */}
      <TimeGrid
        dates={weekDates}
        exams={exams}
        onSelectExam={onSelectExam}
      />
    </div>
  );
}
```

#### C. `AgendaView.tsx` (~120 lines)

**Responsibility:** Flat list sorted by date + priority

```typescript
interface AgendaViewProps {
  selectedDate: Date;
  exams: UpcomingExam[];
  reviewsDue: ReviewCard[];
  onSelectExam: (examId: string) => void;
}

export function AgendaView({
  selectedDate,
  exams,
  reviewsDue,
  onSelectExam,
}: AgendaViewProps) {
  // Group exams + reviews by date
  const grouped = groupEventsByDate([...exams, ...reviewsDue], selectedDate);

  return (
    <div className="space-y-4">
      {grouped.map(({ date, items }) => (
        <AgendaDateSection key={date.toISOString()} date={date} items={items}>
          {items.map(item => (
            <AgendaEventCard
              key={item.id}
              item={item}
              onSelect={() => onSelectExam(item.examId)}
            />
          ))}
        </AgendaDateSection>
      ))}
    </div>
  );
}
```

**Virtualization note:** If >50 items, wrap in `react-window` or `TanStack Virtual`:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

// Inside AgendaView:
const virtualizer = useVirtualizer({
  count: grouped.length,
  getScrollElement: () => containerRef.current,
  estimateSize: () => 120,
});
```

#### D. `HeatmapOverlay.tsx` (~80 lines)

**Responsibility:** Intensity calculation + day cell coloring

```typescript
interface HeatmapOverlayProps {
  reviewsDue: ReviewCard[];
  scheduledPlans: StudyPlan[]; // Tasks due
  dateRange: { start: Date; end: Date };
  colorScheme?: 'green' | 'blue' | 'rainbow';
}

export function HeatmapOverlay({
  reviewsDue,
  scheduledPlans,
  dateRange,
}: HeatmapOverlayProps) {
  // Pre-calculate intensity per day (memoized)
  const intensityMap = useMemo(
    () => calculateDayIntensity(reviewsDue, scheduledPlans, dateRange),
    [reviewsDue, scheduledPlans, dateRange]
  );

  // Returns CSS class map: Day → intensity level
  // Applied as background color via Tailwind (bg-intensity-low, bg-intensity-high)

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Rendered as background color overlay on each day cell */}
    </div>
  );
}

// Helper (separate file: utils/heatmapCalculation.ts)
function calculateDayIntensity(
  reviewsDue: ReviewCard[],
  scheduledPlans: StudyPlan[],
  dateRange: DateRange
): Map<string, 'low' | 'medium' | 'high'> {
  const dayMap = new Map<string, number>();

  // Count reviews + plans per day
  reviewsDue.forEach(review => {
    const dateKey = formatDateKey(review.dueDate);
    dayMap.set(dateKey, (dayMap.get(dateKey) ?? 0) + 1);
  });

  scheduledPlans.forEach(plan => {
    const dateKey = formatDateKey(plan.dueDate);
    dayMap.set(dateKey, (dayMap.get(dateKey) ?? 0) + 1);
  });

  // Normalize to intensity bins
  const max = Math.max(...dayMap.values(), 1);
  const result = new Map<string, 'low' | 'medium' | 'high'>();

  dayMap.forEach((count, dateKey) => {
    const normalized = count / max;
    if (normalized >= 0.66) result.set(dateKey, 'high');
    else if (normalized >= 0.33) result.set(dateKey, 'medium');
    else result.set(dateKey, 'low');
  });

  return result;
}
```

#### E. `StreakOverlay.tsx` (~60 lines)

**Responsibility:** Green dot visualization per day

```typescript
interface StreakOverlayProps {
  dailyActivities: DailyActivity[];
  dateRange: { start: Date; end: Date };
}

export function StreakOverlay({ dailyActivities, dateRange }: StreakOverlayProps) {
  // Map: Date → completed (boolean)
  const completedDays = useMemo(() => {
    const set = new Set<string>();
    dailyActivities
      .filter(a => a.completedAt)
      .forEach(a => set.add(formatDateKey(a.date)));
    return set;
  }, [dailyActivities]);

  // Rendered as green dot overlaid on each day cell
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Component returns a map of day → dot visibility */}
    </div>
  );
}
```

#### F. `EventCell.tsx` (~50 lines)

**Responsibility:** Reusable event card (agenda, day, week, heatmap)

```typescript
interface EventCellProps {
  exam: UpcomingExam;
  view: 'agenda' | 'day' | 'week' | 'month';
  onSelect: (examId: string) => void;
  compact?: boolean;
}

export function EventCell({ exam, view, onSelect, compact }: EventCellProps) {
  const color = ACTIVITY_TYPE_COLORS[exam.type]; // Unified color system

  return (
    <div
      className={cn(
        'rounded-md p-2 cursor-pointer transition-colors',
        `bg-${color}-100 border-l-4 border-${color}-500`,
        'hover:bg-opacity-75'
      )}
      onClick={() => onSelect(exam.id)}
    >
      {!compact && <h4 className="font-semibold text-sm">{exam.title}</h4>}
      {!compact && <p className="text-xs text-gray-600">{exam.daysLeft} days</p>}
      {compact && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />}
    </div>
  );
}
```

---

## 4. react-day-picker ANALYSIS: SUFFICIENT OR REPLACE?

### Current Capabilities

✅ **What react-day-picker does well:**
- Month/week grid layout
- Date selection state
- Modifiers (disabled, selected, highlighted)
- Keyboard navigation
- RTL support
- Styled base (integrates with shadcn/ui)

❌ **What it doesn't do (but we need UI for):**
- Event rendering (only CSS classes on day cells)
- Custom overlays (heatmap, streaks)
- Tooltips per day
- Multi-select date ranges
- Time-based events (WeekView with hourly slots)

### Verdict: EXTEND, DON'T REPLACE

**Reason:** react-day-picker is the calendar grid foundation. The "missing" features are UI layers above it, not within it.

**Concrete extensions:**

```typescript
// 1. Custom modifier for heatmap intensity
<DayPicker
  mode="single"
  selected={selectedDate}
  modifiers={{
    heatmapLow: [/* dates with low intensity */],
    heatmapHigh: [/* dates with high intensity */],
    hasEvents: [/* dates with exams */],
    completedStreak: [/* dates with activity */],
  }}
  modifiersStyles={{
    heatmapLow: { backgroundColor: '#e8f5e9' },
    heatmapHigh: { backgroundColor: '#c8e6c9' },
  }}
/>

// 2. Custom footer or overlay (rendered alongside, not inside)
<div className="relative">
  <DayPicker {...props} />
  <HeatmapOverlay {...heatmapProps} /> {/* Absolute positioned overlay */}
  <StreakOverlay {...streakProps} />
</div>
```

### Constraint: Event Rendering Workaround

react-day-picker doesn't render event cells inside day cells. Solution:

```typescript
// Option A: Use modifiers for visual hints (dots, background)
// Cheap, performant, but no event titles visible

// Option B: Custom day content (if react-day-picker v9+)
<DayPicker
  components={{
    DayContent: ({ day, ...props }) => (
      <div>
        {day.getDate()}
        {/* Show small dots for events */}
        <EventDotIndicators examsOnDay={examsOnDay} />
      </div>
    ),
  }}
/>

// Option C: Overlay div with event cells (current approach in MonthView)
// Click event on day cell opens drawer → shows full event list
```

**Recommended:** Use **Option A (modifiers)** for heatmap + streaks (cheap), **Option B (DayContent)** for event dot indicators (light), and **ExamDetailsPanel drawer** for full event details.

---

## 5. MOBILE VS. DESKTOP VIEW SWITCHING

### Design Decision: Agenda as Mobile Default

**User flow:**
- Mobile (≤768px): Default to Agenda, view toggle always visible, drawer for details
- Desktop (>768px): Default to Month, view toggle always visible, sidebar for details

### Implementation: CSS + JS Hybrid

```typescript
// hooks/useCalendarViewMode.ts
export function useCalendarViewMode() {
  const [isMobile, setIsMobile] = useState(false);
  const [userPreferredView, setUserPreferredView] = useState<ViewMode>(
    () => localStorage.getItem('calendarViewMode') as ViewMode || 'month'
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Mobile forces Agenda, desktop respects preference
  const effectiveViewMode = isMobile ? 'agenda' : userPreferredView;

  return {
    viewMode: effectiveViewMode,
    setViewMode: (mode: ViewMode) => {
      if (!isMobile) setUserPreferredView(mode);
      localStorage.setItem('calendarViewMode', mode);
    },
    isMobile,
  };
}
```

**View toggle styling:**

```typescript
// components/ViewToggle.tsx
export function ViewToggle({
  viewMode,
  onViewModeChange,
  isMobile,
}: ViewToggleProps) {
  const availableViews = isMobile
    ? ['agenda'] // Mobile only shows agenda
    : ['agenda', 'day', 'week', 'month']; // Desktop shows all

  return (
    <div className="flex gap-2">
      {availableViews.map(view => (
        <Button
          key={view}
          variant={viewMode === view ? 'default' : 'outline'}
          onClick={() => onViewModeChange(view as ViewMode)}
          size="sm"
        >
          {capitalize(view)}
        </Button>
      ))}
    </div>
  );
}
```

**Breakpoint strategy:**
- Use Tailwind's `hidden md:block` for desktop-only components (e.g., WeekView sidebar)
- Use `md:hidden` for mobile-only components (e.g., drawer footer buttons)
- Keep view toggle visible on all breakpoints

---

## 6. ExamDetailsPanel PATTERN: DRAWER VS. SIDEBAR VS. MODAL

### Analysis

| Pattern | Mobile | Desktop | Drawbacks |
|---------|--------|---------|-----------|
| **Drawer** (bottom/right) | ✅ Excellent | ✅ Good | Takes up space |
| **Sidebar** (right) | ❌ Poor (too narrow) | ✅ Excellent | Awkward on mobile |
| **Modal** (center) | ✅ Good | ✅ Good | Dismisses calendar view |
| **In-place** (replace view) | ✅ OK | ❌ Breaks layout | Lost context |

### Recommendation: DRAWER with Smart Positioning

```typescript
// components/ExamDetailsPanel.tsx
interface ExamDetailsPanelProps {
  examId: string | null;
  onClose: () => void;
}

export function ExamDetailsPanel({ examId, onClose }: ExamDetailsPanelProps) {
  const { isMobile } = useCalendarViewMode();
  const exam = useExamDetail(examId);

  if (!examId) return null;

  // Mobile: bottom drawer (slide up from bottom)
  // Desktop: right drawer (slide in from right)
  return (
    <Drawer
      open={!!examId}
      onOpenChange={(open) => !open && onClose()}
      direction={isMobile ? 'bottom' : 'right'}
    >
      <DrawerContent>
        <DrawerHeader>
          <h2 className="text-lg font-bold">{exam?.title}</h2>
          <Badge className="ml-2">{exam?.daysLeft} days</Badge>
        </DrawerHeader>

        <DrawerBody className="overflow-y-auto max-h-[60vh] md:max-h-screen">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {/* Exam overview */}
            </TabsContent>
            {/* ... other tabs */}
          </Tabs>
        </DrawerBody>

        <DrawerFooter className="border-t bg-gray-50">
          <Button onClick={handleStartReview} className="w-full">
            ▶ Start Review Now
          </Button>
          <Button variant="outline" onClick={() => handleReschedule()}>
            Reschedule
          </Button>
          <DrawerClose asChild>
            <Button variant="ghost">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
```

**Integration:**

```typescript
// CalendarShell.tsx
export function CalendarShell() {
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  return (
    <div className="flex gap-4">
      {/* Calendar view (agenda/day/week/month) */}
      <div className="flex-1">
        <ViewContainer onSelectExam={setSelectedExamId} />
      </div>

      {/* Drawer always rendered, shown conditionally */}
      <ExamDetailsPanel
        examId={selectedExamId}
        onClose={() => setSelectedExamId(null)}
      />
    </div>
  );
}
```

---

## 7. EVENT DATA MODEL: TypeScript INTERFACES

### Calendar Domain

```typescript
// types/calendar.ts

// Activity type → Color mapping (unified system)
export type ActivityType =
  | 'exam'
  | 'review'
  | 'plan_task'
  | 'quiz'
  | 'reading'
  | 'lecture'
  | 'practice';

export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  exam: '#ef4444',      // Red
  review: '#3b82f6',    // Blue
  plan_task: '#8b5cf6', // Purple
  quiz: '#f59e0b',      // Amber
  reading: '#10b981',   // Green
  lecture: '#ec4899',   // Pink
  practice: '#06b6d4',  // Cyan
};

// Exam event (from /exams/:user)
export interface UpcomingExam {
  id: string;
  title: string;
  description?: string;
  type: 'exam' | 'quiz';
  dueDate: Date;
  daysLeft: number;
  priority: 'high' | 'medium' | 'low';
  estimatedMinutes?: number;
  topicsCount: number;
  masteredCount: number;
  reviewCardsCount: number;
}

// Review card (from FSRS /reviews-due/:user)
export interface ReviewCard {
  id: string;
  examId: string;
  cardId: string;
  content: string;
  dueDate: Date;
  interval: number;
  difficulty: number;
  nextEase: number;
  type: 'review';
}

// Study plan task (from /study-plans/:user)
export interface StudyPlanBlock {
  id: string;
  planId: string;
  title: string;
  description?: string;
  type: 'plan_task';
  dueDate: Date;
  estimatedMinutes: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
}

// Daily activity (from /daily-activities/:user)
export interface DailyActivity {
  id: string;
  date: Date;
  reviewsCompleted: number;
  minutesStudied: number;
  cardsReviewed: number;
  completedAt?: Date; // Null = incomplete
  streakDays?: number;
}

// Unified event (internal union)
export type CalendarEvent = UpcomingExam | ReviewCard | StudyPlanBlock;

// Grouped agenda view
export interface AgendaDateSection {
  date: Date;
  items: CalendarEvent[];
  totalMinutes: number;
  priority: 'high' | 'medium' | 'low';
}

// Heatmap intensity
export type HeatmapIntensity = 'low' | 'medium' | 'high';
export interface DayHeatmapData {
  date: Date;
  intensity: HeatmapIntensity;
  reviewCount: number;
  planCount: number;
  totalEstimatedMinutes: number;
}

// Time slot (week/day view)
export interface TimeSlot {
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  events: CalendarEvent[];
}
```

### Query/Store Interfaces

```typescript
// hooks/useCalendarData.ts

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
  const examsQuery = useQuery({
    queryKey: calendarKeys.exams,
    queryFn: () => apiCall('GET /exams/:user'),
  });

  const reviewsQuery = useQuery({
    queryKey: calendarKeys.reviewsDue(dateRange.start, dateRange.end),
    queryFn: () =>
      apiCall('GET /reviews-due/:user', {
        params: { startDate: dateRange.start, endDate: dateRange.end },
      }),
  });

  // ... more queries

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
    error: examsQuery.error || reviewsQuery.error || planTasksQuery.error,
  };
}
```

---

## 8. PERFORMANCE CONCERNS: FSRS CARD SCALE

### Problem Statement

- FSRS v4 can manage 10,000+ cards per user
- Heatmap needs to bin reviews across all cards per day
- Rendering 30 days × 100+ reviews = 3,000+ DOM nodes (if unoptimized)
- **Risk:** Heatmap recalculation on every render

### Solution: Memoization + Lazy Calculation

#### A. Heatmap Intensity Cache

```typescript
// hooks/useHeatmapIntensity.ts
export function useHeatmapIntensity(
  reviewsDue: ReviewCard[],
  scheduledPlans: StudyPlanBlock[],
  dateRange: { start: Date; end: Date }
): Map<string, HeatmapIntensity> {
  return useMemo(() => {
    // Calculate intensity only when inputs change
    const dayMap = new Map<string, number>();

    // Bin reviews by date O(n)
    reviewsDue.forEach(review => {
      const key = formatDateKey(review.dueDate);
      dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    });

    scheduledPlans.forEach(plan => {
      const key = formatDateKey(plan.dueDate);
      dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    });

    // Normalize to intensity bins O(1) per day
    const max = Math.max(...dayMap.values(), 1);
    const result = new Map<string, HeatmapIntensity>();

    dayMap.forEach((count, key) => {
      const normalized = count / max;
      if (normalized >= 0.66) result.set(key, 'high');
      else if (normalized >= 0.33) result.set(key, 'medium');
      else result.set(key, 'low');
    });

    return result;
  }, [reviewsDue, scheduledPlans, dateRange]);
}
```

**Complexity:** O(n) where n = review count (acceptable, runs once per dateRange change)

#### B. Virtual Agenda List

```typescript
// components/AgendaView.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function AgendaView({
  selectedDate,
  exams,
  reviewsDue,
  onSelectExam,
}: AgendaViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Group and sort by date
  const grouped = useMemo(
    () => groupEventsByDate([...exams, ...reviewsDue], selectedDate),
    [exams, reviewsDue, selectedDate]
  );

  // Virtualize if >50 items
  const virtualizer =
    grouped.length > 50
      ? useVirtualizer({
          count: grouped.length,
          getScrollElement: () => containerRef.current,
          estimateSize: () => 140, // Height of AgendaDateSection
          overscan: 5, // Render 5 extra items outside viewport
        })
      : null;

  const virtualItems = virtualizer?.getVirtualItems() ?? [];
  const totalSize = virtualizer?.getTotalSize() ?? 0;

  const paddingStart = virtualItems.length > 0 ? virtualItems?.[0]?.start ?? 0 : 0;
  const paddingEnd =
    virtualItems.length > 0
      ? totalSize - (virtualItems?.[virtualItems.length - 1]?.end ?? 0)
      : 0;

  return (
    <div
      ref={containerRef}
      className="space-y-4 overflow-y-auto max-h-screen"
    >
      {paddingStart > 0 && <div style={{ height: paddingStart }} />}

      {(virtualItems.length > 0 ? virtualItems : grouped).map(
        (virtualItem, index) => {
          const item =
            virtualItems.length > 0
              ? grouped[virtualItem.index]
              : virtualItem;

          return (
            <AgendaDateSection
              key={`${item.date}-${index}`}
              date={item.date}
              items={item.items}
            >
              {item.items.map(event => (
                <AgendaEventCard
                  key={event.id}
                  item={event}
                  onSelect={() => onSelectExam(event.examId)}
                />
              ))}
            </AgendaDateSection>
          );
        }
      )}

      {paddingEnd > 0 && <div style={{ height: paddingEnd }} />}
    </div>
  );
}
```

**Result:** Only visible items (≈5-8) + buffer rendered, even with 500 items in list.

#### C. React Query Pagination (Backend Optimization)

```typescript
// If reviews-due endpoint supports pagination:
const reviewsQuery = useQuery({
  queryKey: calendarKeys.reviewsDue(dateRange.start, dateRange.end),
  queryFn: () =>
    apiCall('GET /reviews-due/:user', {
      params: {
        startDate: dateRange.start,
        endDate: dateRange.end,
        limit: 100, // Fetch in batches
        offset: 0,
      },
    }),
});
```

#### D. Memoized Event Cells

```typescript
// components/EventCell.tsx
export const EventCell = memo(
  function EventCell({ exam, view, onSelect, compact }: EventCellProps) {
    const color = ACTIVITY_TYPE_COLORS[exam.type];

    return (
      <div
        className={cn(
          'rounded-md p-2 cursor-pointer transition-colors',
          `bg-${color}-100 border-l-4 border-${color}-500`
        )}
        onClick={() => onSelect(exam.id)}
      >
        {/* ... */}
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.exam.id === nextProps.exam.id &&
    prevProps.view === nextProps.view &&
    prevProps.compact === nextProps.compact
);
```

### Performance Checklist

| Optimization | Impact | Complexity |
|---|---|---|
| Memoize heatmap calculation | High (avoids O(n) on render) | Low |
| Virtual agenda list | High (if >50 items) | Medium |
| Memoized EventCell | Medium | Low |
| React Query pagination | Medium | Medium |
| Debounce dateRange changes | Low | Low |

---

## 9. DATA FLOW DIAGRAM: REQUEST → RENDER

```
┌──────────────────────────────────────────────────────────────────┐
│ USER INTERACTION                                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Click "Month" button → ViewToggle → setViewMode('month')   │
│  2. Context updates → CalendarShell re-renders                 │
│  3. ViewContainer sees viewMode='month' → mounts MonthView     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ STATE & QUERIES (CalendarShell context provider)                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  const { selectedDate, setSelectedDate } = useCalendarContext()│
│  const { exams, reviews, plans, activities } = useCalendarData()│
│  const filters = useCalendarFilters()  // Zustand store        │
│                                                                  │
│  dateRange = useMemo(() => getMonthRange(selectedDate), [...]) │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ MEMOIZED CALCULATIONS (useCallback / useMemo)                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  intensityMap = useHeatmapIntensity(reviews, plans, dateRange) │
│  completedDays = useMemo(() => new Set(...), [activities])     │
│  agendaGroups = useMemo(() => groupByDate(...), [events])      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ RENDER TREE (View Components)                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MonthView:                                                      │
│    ├─ DayPicker (react-day-picker)                             │
│    │  └─ onClick: setSelectedDate(date)                        │
│    ├─ HeatmapOverlay (absolute) → CSS class per day           │
│    ├─ StreakOverlay (absolute) → green dots per day           │
│    └─ EventIndicators → small dots per exam                   │
│                                                                  │
│  OR AgendaView:                                                 │
│    └─ virtualized list of AgendaDateSections                   │
│       └─ AgendaEventCard[] (memoized)                          │
│       └─ onClick: setSelectedExamId(examId)                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ DRAWER / DETAIL PANEL                                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  selectedExamId from context → ExamDetailsPanel opens          │
│  Drawer mounts ExamDetail component (lazy if needed)           │
│  Fetch exam details if not cached: useQuery(examDetailKey)    │
│  Render tabs: Overview | Schedule | Resources                 │
│  Primary CTA: "Start Review Now" → navigate to reviewer        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 10. IMPLEMENTATION ROADMAP (PHASE 1)

### Week 1: Foundation

**Files to create:**

```
src/
├─ components/calendar/
│  ├─ CalendarShell.tsx          (new)
│  ├─ CalendarHeader.tsx          (new)
│  ├─ ViewToggle.tsx              (new)
│  ├─ ViewContainer.tsx           (new)
│  ├─ MonthView.tsx               (refactor from WeekMonthViews.tsx)
│  ├─ AgendaView.tsx              (new)
│  ├─ EventCell.tsx               (new)
│  ├─ ExamDetailsPanel.tsx        (new)
│  └─ overlays/
│     ├─ HeatmapOverlay.tsx       (new)
│     └─ StreakOverlay.tsx        (new)
│
├─ hooks/
│  ├─ useCalendarContext.ts       (new)
│  ├─ useCalendarData.ts          (new)
│  ├─ useCalendarViewMode.ts      (new)
│  └─ useHeatmapIntensity.ts      (new)
│
├─ stores/
│  └─ calendarFilters.ts          (new Zustand store)
│
├─ types/
│  ├─ calendar.ts                 (new)
│  └─ queryKeys.ts                (new)
│
└─ utils/
   ├─ heatmapCalculation.ts       (new)
   ├─ dateGrouping.ts             (new)
   └─ colors.ts                   (refactor ACTIVITY_TYPE_COLORS)
```

**Tasks:**

1. Extract interfaces from `scheduleFallbackData.ts` → `types/calendar.ts`
2. Create `CalendarShell.tsx` + context provider (scaffold)
3. Refactor `WeekMonthViews.tsx` → split into `MonthView.tsx` + `AgendaView.tsx`
4. Create `ExamDetailsPanel.tsx` (drawer skeleton)
5. Create `ViewToggle.tsx` + mobile detection
6. Create `HeatmapOverlay.tsx` + `utils/heatmapCalculation.ts`

### Week 2: Polish & Performance

1. Implement StreakOverlay + overlay positioning
2. Virtual agenda list (if >50 items)
3. Drawer interactions (open/close/keyboard)
4. Color system unification (7 activity types)
5. Mobile breakpoints (css hidden/block + view toggle logic)
6. Tablet layout (adjustable sidebar vs. drawer)

### Week 3: Integration

1. Connect to real API endpoints (exams, reviews-due, daily-activities)
2. Error boundaries + loading states
3. Tests (unit: heatmap calc, integration: view switching)
4. Performance audit (React DevTools Profiler)

---

## SUMMARY TABLE: COMPONENT RESPONSIBILITIES

| Component | Props | Internal State | External State | Renders |
|-----------|-------|---|---|---|
| `CalendarShell` | — | viewMode | selectedDate (context) | Header + ViewContainer + Panel |
| `CalendarHeader` | — | — | selectedDate (context) | DateNav + ViewToggle + breadcrumbs |
| `ViewToggle` | isMobile | — | viewMode (context) | 4 buttons (or 1 on mobile) |
| `MonthView` | selectedDate, exams, reviews | hoverDay | — | DayPicker + overlays |
| `AgendaView` | selectedDate, events | — | — | Virtualized list |
| `WeekView` | selectedDate, events | — | — | 7-day grid |
| `HeatmapOverlay` | reviewsDue, plans, dateRange | — | — | Absolute positioned DIVs |
| `StreakOverlay` | dailyActivities, dateRange | — | — | Green dots |
| `EventCell` | exam, view, onSelect | — | — | Badge + title + daysLeft |
| `ExamDetailsPanel` | examId, onClose | tabIndex | selectedExamId (context) | Drawer + tabs + CTA |

---

## FINAL RECOMMENDATION

**Proceed with modular split.** The monolithic `WeekMonthViews.tsx` is blocking features A–E. By splitting into 6 focused components:

- **Code clarity:** Each component <200 lines, single responsibility
- **Feature velocity:** Add Day view, Week view, or time-slot features without touching Month/Agenda
- **Testing:** Easy to test heatmap calc, event cell styling, drawer interactions in isolation
- **Performance:** Memoization + virtual lists handle 10k+ FSRS cards
- **Mobile-first:** Agenda default respected via hook + CSS breakpoints

**Start this sprint:** Extract interfaces → refactor to component tree → integrate API.

---

**Appendix: react-day-picker + TailwindCSS Integration Example**

```typescript
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css'; // Base styles

// Override in Tailwind:
<style>{`
  .rdp { @apply p-4 bg-white; }
  .rdp-cell { @apply w-14 h-14; }
  .rdp-day_selected:not([disabled]) { @apply bg-blue-500 text-white; }
  .rdp-day_today:not([disabled]) { @apply bg-blue-100 font-bold; }
  .rdp-day_modifier_heatmapHigh { @apply bg-green-500 text-white; }
`}</style>
```
