# Calendar Feature: Visual Architecture & Decision Trees

Complete visual reference for the calendar refactoring.

---

## 1. COMPONENT HIERARCHY (COMPLETE TREE)

```
App
 └─ Router
     └─ CalendarPage
         └─ CalendarProvider (context)
             └─ CalendarShell
                 ├─ CalendarHeader
                 │   ├─ DateNavigator
                 │   │   ├─ Button (prev month)
                 │   │   ├─ Date display
                 │   │   └─ Button (next month)
                 │   └─ ViewToggle
                 │       ├─ Button (Agenda) [visible all]
                 │       ├─ Button (Day)    [hidden on mobile]
                 │       ├─ Button (Week)   [hidden on mobile]
                 │       └─ Button (Month)  [hidden on mobile]
                 │
                 ├─ ViewContainer (conditional render)
                 │   ├─ AgendaView (if viewMode === 'agenda')
                 │   │   ├─ AgendaDateSection (for each date)
                 │   │   │   └─ AgendaEventCard[] (virtualized)
                 │   │   │       └─ EventCell (memoized)
                 │   │   │           └─ onClick → setSelectedExamId
                 │   │   └─ VirtualContainer (from @tanstack/react-virtual)
                 │   │
                 │   ├─ MonthView (if viewMode === 'month')
                 │   │   ├─ DayPicker (react-day-picker)
                 │   │   │   └─ Day cells (modifiers: heatmapLow/High, hasEvents)
                 │   │   ├─ HeatmapOverlay (absolute, pointer-events-none)
                 │   │   │   └─ Div per day (background color)
                 │   │   ├─ StreakOverlay (absolute, pointer-events-none)
                 │   │   │   └─ Green dot per completed day
                 │   │   └─ EventIndicators (absolute)
                 │   │       └─ Small dots per exam type
                 │   │
                 │   ├─ WeekView (if viewMode === 'week')
                 │   │   ├─ WeekHeader (7 day names + dates)
                 │   │   └─ TimeGrid (24 rows × 7 cols)
                 │   │       ├─ Hour header
                 │   │       └─ TimeSlot[24 × 7]
                 │   │           └─ EventCell[] (positioned absolutely)
                 │   │
                 │   └─ DayView (if viewMode === 'day')
                 │       ├─ DayHeader (selected date)
                 │       └─ TimeGrid (24 rows)
                 │           └─ TimeSlot[24]
                 │               └─ EventCell[]
                 │
                 └─ ExamDetailsPanel (drawer, always rendered)
                     ├─ DrawerTrigger (none - programmatic)
                     ├─ DrawerContent (bottom on mobile, right on desktop)
                     │   ├─ DrawerHeader
                     │   │   ├─ Exam title
                     │   │   └─ Days left badge
                     │   ├─ DrawerBody
                     │   │   └─ Tabs
                     │   │       ├─ Overview tab
                     │   │       ├─ Schedule tab
                     │   │       └─ Resources tab
                     │   └─ DrawerFooter
                     │       ├─ "Start Review Now" button (primary)
                     │       ├─ "Reschedule" button
                     │       └─ "Close" button
                     └─ Portal (rendered outside hierarchy)
```

---

## 2. STATE FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│ CONTEXT STATE (useCalendarContext)                              │
│  ├─ selectedDate: Date                                          │
│  ├─ viewMode: 'agenda' | 'day' | 'week' | 'month'             │
│  ├─ selectedExamId: string | null                             │
│  ├─ dateRange: { start, end } (derived, memoized)             │
│  └─ visibleDates: Date[] (derived, memoized)                  │
└─────────────────────────────────────────────────────────────────┘
                        ↓ Consumed by ↓
┌─────────────────────────────────────────────────────────────────┐
│ VIEW COMPONENTS                                                 │
│  ├─ CalendarHeader → DateNavigator, ViewToggle                │
│  ├─ ViewContainer → selectView(viewMode)                      │
│  ├─ MonthView / AgendaView / WeekView / DayView               │
│  └─ ExamDetailsPanel → queries exam by selectedExamId        │
└─────────────────────────────────────────────────────────────────┘
                        ↓ Fetches ↓
┌─────────────────────────────────────────────────────────────────┐
│ REACT QUERY DATA (useCalendarData)                              │
│  ├─ exams: UpcomingExam[] (cached)                            │
│  ├─ reviewsDue: ReviewCard[] (dateRange-bound)                │
│  ├─ planTasks: StudyPlanBlock[] (dateRange-bound)             │
│  ├─ dailyActivities: DailyActivity[] (dateRange-bound)        │
│  └─ ExamDetail query (selectedExamId-bound)                   │
└─────────────────────────────────────────────────────────────────┘
                        ↓ Filtered by ↓
┌─────────────────────────────────────────────────────────────────┐
│ ZUSTAND STORE (useCalendarFilters)                              │
│  ├─ hideExams: boolean                                         │
│  ├─ hideReviews: boolean                                       │
│  ├─ hideScheduledPlans: boolean                                │
│  └─ (User preferences, persisted)                              │
└─────────────────────────────────────────────────────────────────┘
                        ↓ Renders ↓
┌─────────────────────────────────────────────────────────────────┐
│ MEMOIZED CALCULATIONS (useMemo)                                 │
│  ├─ intensityMap = calculateDayIntensity(reviews, plans)      │
│  ├─ completedDays = dailyActivities.filter(a => a.completed) │
│  ├─ filteredEvents = allEvents.filter(applyFilters)           │
│  └─ agendaGroups = groupEventsByDate(filteredEvents)          │
└─────────────────────────────────────────────────────────────────┘
                        ↓ Used in ↓
┌─────────────────────────────────────────────────────────────────┐
│ UI RENDERING                                                    │
│  ├─ DayPicker modifiers + CSS classes                         │
│  ├─ Overlay divs (heatmap, streaks, event indicators)         │
│  ├─ EventCell memoized components                             │
│  └─ Drawer with tab content                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. USER INTERACTION FLOW

```
START: Calendar Page Loads
  ↓
Initialize context:
  - selectedDate = today
  - viewMode = isMobile ? 'agenda' : 'month'
  - selectedExamId = null
  ↓
Fetch data:
  - useCalendarData(dateRange)
  - All queries run in parallel
  ↓
┌─ USER CLICKS DATE in Month/Week/Day view ───┐
│                                              │
│ setSelectedDate(newDate)                    │
│   ↓ dateRange recalculates (memoized)       │
│   ↓ React Query refetches for new range     │
│   ↓ IntensityMap recalculates (memoized)    │
│   ↓ View re-renders with new events         │
│                                              │
└──────────────────────────────────────────────┘
  ↓
┌─ USER CLICKS VIEW TOGGLE ─────────────────┐
│                                            │
│ setViewMode('agenda' | 'week' | 'month') │
│   ↓ dateRange updates if needed           │
│   ↓ ViewContainer unmounts old view       │
│   ↓ mounts new view (animates)            │
│   ↓ New view renders with same data       │
│                                            │
└────────────────────────────────────────────┘
  ↓
┌─ USER CLICKS EVENT CARD ──────────────────┐
│                                            │
│ onSelect(examId)                          │
│   ↓ setSelectedExamId(examId)             │
│   ↓ context updates                       │
│   ↓ ExamDetailsPanel detects change       │
│   ↓ Drawer opens (animated)               │
│   ↓ useExamDetail(examId) fetches detail  │
│   ↓ Drawer body populates with tabs       │
│                                            │
└────────────────────────────────────────────┘
  ↓
┌─ USER CLICKS "START REVIEW NOW" ────────┐
│                                          │
│ handleStartReview()                     │
│   ↓ navigate(`/review/${examId}`)       │
│   ↓ Leave calendar page                 │
│   ↓ Context state preserved (not reset) │
│                                          │
└──────────────────────────────────────────┘
  ↓
┌─ USER FILTERS (Hide Exams) ────────────┐
│                                         │
│ filters.toggleHideExams()              │
│   ↓ Zustand store updates + persists   │
│   ↓ all views recalculate filtered list│
│   ↓ event cells disappear/reappear     │
│   ↓ heatmap recalculates (memoized)    │
│                                         │
└─────────────────────────────────────────┘
```

---

## 4. REACT QUERY CACHE KEYS & STALE TIME

```
calendarKeys = {
  exams: ['exams', userId]
    ├─ staleTime: 5 min (rarely changes, safe to cache)
    └─ refetch: manual or window focus

  reviews-due: ['reviews-due', userId, startDate, endDate]
    ├─ staleTime: 2 min (volatile, user reviews cards)
    └─ refetch: on dateRange change

  plan-tasks: ['plan-tasks', userId, startDate, endDate]
    ├─ staleTime: 5 min (plan changes are infrequent)
    └─ refetch: on dateRange change

  daily-activities: ['daily-activities', userId, startDate, endDate]
    ├─ staleTime: 10 min (infrequent, last queried)
    └─ refetch: on user action (completed review)

  exam-detail: ['exams', userId, examId]
    ├─ staleTime: 1 min (drawer just opened)
    └─ refetch: manual when needed
}
```

---

## 5. MOBILE-FIRST BREAKPOINT STRATEGY

```
BREAKPOINT: max-width 768px
│
├─ MOBILE (< 768px)
│   ├─ Default view: Agenda (forced)
│   ├─ ViewToggle shows: [Agenda] only
│   ├─ DateNavigator: compact (small buttons)
│   ├─ ExamDetailsPanel: drawer from bottom (80vh)
│   ├─ Event cards: full width, larger touch target
│   └─ Time grid (day/week): hidden
│
└─ DESKTOP (≥ 768px)
    ├─ Default view: Month (or user preference)
    ├─ ViewToggle shows: [Agenda] [Day] [Week] [Month]
    ├─ DateNavigator: standard size
    ├─ ExamDetailsPanel: drawer from right (w-96)
    ├─ Event cards: smaller, optimized for density
    └─ Time grid: visible

CSS Implementation:
─────────────────
// Hide desktop-only views on mobile
.md\:hidden {  // Tailwind: hidden by default, show on md+
  @media (max-width: 768px) { display: none; }
}

.hidden.md\:block {  // Tailwind: hidden by default, block on md+
  @media (min-width: 769px) { display: block; }
}

// Responsive drawer direction
const drawerDirection = isMobile ? 'bottom' : 'right';

// Responsive event card sizing
const cardClasses = isMobile
  ? 'text-base p-4 h-20'  // Larger on mobile
  : 'text-sm p-2 h-12';   // Compact on desktop
```

---

## 6. VIRTUAL SCROLLING DECISION TREE

```
START: AgendaView mounts with events
  ↓
Count = events.length
  ↓
┌─ Count > 50? ────────┐
│                       │
│ YES: Use Virtual     │ NO: Render all
│   ├─ import Virtual  │     ├─ Simple map
│   ├─ from @tanstack/ │     └─ Direct render
│   ├─ useVirtualizer  │
│   ├─ estimateSize    │
│   │  (140px per item)│
│   ├─ overscan: 5     │
│   └─ Padded divs     │
│                       │
└───────────────────────┘
  ↓
Rendering:
  - Virtual: 5-8 visible + 10 buffer = 15 DOM nodes
  - Non-virtual: 500 DOM nodes (performance hit)

Result:
  - Smooth scroll, 60 FPS
  - Memory efficient
  - Works on mobile/desktop
```

---

## 7. HEATMAP INTENSITY CALCULATION

```
INPUT:
  reviewsDue: ReviewCard[] (all due dates)
  scheduledPlans: StudyPlanBlock[] (all due dates)
  dateRange: { start, end }

ALGORITHM (O(n) where n = total events):
  ┌────────────────────────────────────────┐
  │ 1. Create dayMap: Map<dateKey, count> │
  ├────────────────────────────────────────┤
  │ 2. Loop reviews, increment count       │
  │    reviewsDue.forEach(r => {           │
  │      key = formatDateKey(r.dueDate)    │
  │      dayMap[key]++                     │
  │    })                                  │
  ├────────────────────────────────────────┤
  │ 3. Loop plans, increment count         │
  │    scheduledPlans.forEach(p => {       │
  │      key = formatDateKey(p.dueDate)    │
  │      dayMap[key]++                     │
  │    })                                  │
  ├────────────────────────────────────────┤
  │ 4. Find max count (normalization)      │
  │    max = Math.max(...dayMap.values())  │
  ├────────────────────────────────────────┤
  │ 5. Normalize to bins                   │
  │    normalized = count / max            │
  │    if normalized ≥ 0.66 → HIGH         │
  │    else if ≥ 0.33 → MEDIUM            │
  │    else → LOW                          │
  └────────────────────────────────────────┘

OUTPUT:
  intensityMap: Map<dateKey, 'low'|'medium'|'high'>

COMPLEXITY:
  Time: O(n) where n = reviews + plans
  Space: O(d) where d = unique dates

MEMOIZATION:
  deps: [reviewsDue, scheduledPlans, dateRange]
  → Only recalc when inputs change
  → Cached in useMemo hook

EXAMPLE:
  Input:
    - 2026-03-28: 5 reviews + 2 plans = 7
    - 2026-03-29: 1 review = 1
    - 2026-03-30: 10 reviews = 10  (max)

  Normalization (divide by 10):
    - 2026-03-28: 7/10 = 0.70 → HIGH (≥0.66)
    - 2026-03-29: 1/10 = 0.10 → LOW
    - 2026-03-30: 10/10 = 1.0 → HIGH
```

---

## 8. COLOR SYSTEM: 7 ACTIVITY TYPES

```
┌────────────────┬──────────────┬────────────────────────────────┐
│ Activity Type  │ Color (Hex)  │ Tailwind Class                 │
├────────────────┼──────────────┼────────────────────────────────┤
│ exam           │ #ef4444      │ red-500 bg-red-100 text-red-700
│ review         │ #3b82f6      │ blue-500 bg-blue-100 text-blue-700
│ plan_task      │ #8b5cf6      │ purple-500 bg-purple-100
│ quiz           │ #f59e0b      │ amber-500 bg-amber-100
│ reading        │ #10b981      │ green-500 bg-green-100
│ lecture        │ #ec4899      │ pink-500 bg-pink-100
│ practice       │ #06b6d4      │ cyan-500 bg-cyan-100
└────────────────┴──────────────┴────────────────────────────────┘

Usage in EventCell:
  const color = ACTIVITY_TYPE_COLORS[event.type];

  Style:
    backgroundColor: `${color}20`  // 20% opacity
    borderLeftColor: color

  Hover:
    backgroundColor: `${color}40`  // 40% opacity

Usage in Heatmap:
  INTENSITY_COLORS = {
    low: 'bg-green-100',
    medium: 'bg-green-400',
    high: 'bg-green-600',
  }
  (Separate from activity colors, monochrome scale)

Accessibility:
  - All colors meet WCAG AA contrast
  - Icons + labels (not color alone)
  - Patterns (e.g., hatching) for colorblind users (future)
```

---

## 9. RESPONSIVE DRAWER PATTERN

```
MOBILE (< 768px):
  ┌─────────────────────────────────┐
  │  Calendar View                  │
  │  (Agenda list)                  │
  │                                 │
  │                                 │
  └─────────────────────────────────┘
          ↓ User clicks event

  ┌─────────────────────────────────┐
  │  Calendar View (dimmed)          │
  │                                 │
  │  ╔═════════════════════════════╗ ← Drawer slides up from bottom
  │  ║ Exam Title          [Close] ║
  │  ║─────────────────────────────║
  │  ║ Overview | Schedule | Res.. ║
  │  ║                             ║
  │  ║ [Progress details]          ║
  │  ║                             ║
  │  ║─────────────────────────────║
  │  ║ [▶ Start Review Now]        ║ ← Full width button
  │  ║ [Reschedule]                ║
  │  ║ [Close]                     ║
  │  ╚═════════════════════════════╝
  │
  └─────────────────────────────────┘

DESKTOP (≥ 768px):
  ┌────────────────────────────────────────────────┐
  │ Calendar        │ Exam Title        [Close]    │
  │ (Month grid)    │                              │
  │                 ├──────────────────────────────┤
  │                 │ Overview | Schedule | Res..  │
  │                 │                              │
  │                 │ [Progress details]           │
  │                 │                              │
  │                 ├──────────────────────────────┤
  │                 │ [▶ Start Review Now]         │ ← Sidebar width button
  │                 │ [Reschedule]                 │
  │                 │ [Close]                      │
  │                 │                              │
  └────────────────────────────────────────────────┘

Drawer Direction:
  isMobile ? 'bottom' : 'right'

Drawer Height (mobile):
  - 80vh (leaves room for swipe-dismiss)

Drawer Width (desktop):
  - w-96 (24rem, standard sidebar)

Animation:
  - Slide up from bottom (mobile)
  - Slide in from right (desktop)
  - Fade backdrop on both
```

---

## 10. PERFORMANCE WATERFALL (FIRST LOAD)

```
┌────────────────────────────────────────────────────────────┐
│ t=0ms: CalendarPage mounts                                │
│   ├─ Context initialized                                  │
│   └─ CalendarProvider wrapper renders                    │
├────────────────────────────────────────────────────────────┤
│ t=50ms: useCalendarData queries fire (in parallel)        │
│   ├─ GET /api/exams                                       │
│   ├─ GET /api/reviews-due?start=X&end=Y                   │
│   ├─ GET /api/plan-tasks?start=X&end=Y                    │
│   └─ GET /api/daily-activities?start=X&end=Y              │
├────────────────────────────────────────────────────────────┤
│ t=150ms: Views render with skeleton loaders                │
│   ├─ CalendarHeader (instant)                             │
│   ├─ ViewContainer mounts MonthView (default)             │
│   └─ ExamDetailsPanel (hidden)                            │
├────────────────────────────────────────────────────────────┤
│ t=200-400ms: First response arrives (reviews-due fastest)  │
│   ├─ useHeatmapIntensity recalculates (memoized)          │
│   ├─ MonthView re-renders with heatmap                    │
│   └─ Streak overlay appears                               │
├────────────────────────────────────────────────────────────┤
│ t=400-800ms: Remaining queries resolve                     │
│   ├─ Event indicators appear                              │
│   ├─ AgendaView sidebar (desktop) populates               │
│   └─ Interactive UI ready (TTI)                           │
└────────────────────────────────────────────────────────────┘

Optimization:
  - All queries start in parallel (not sequential)
  - Heatmap calc is memoized (no blocking)
  - Overlays use CSS transforms (GPU-accelerated)
  - Virtual scrolling prevents DOM bloat
```

---

## 11. ERROR HANDLING FLOWCHART

```
                    useCalendarData() executes
                            ↓
                ┌──────────────────────────┐
                │ All queries fire         │
                │ (exams, reviews, etc.)   │
                └───────────┬──────────────┘
                            ↓
                ┌──────────────────────────┐
                │ One query fails          │
                │ e.g., reviews-due 500    │
                └───────────┬──────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │ Return: error from failed query       │
        ├───────────────────────────────────────┤
        │ Fallback: reviews = [] (empty array)  │
        │           heatmap doesn't calculate   │
        │           other views unaffected      │
        └───────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │ CalendarShell renders ErrorBoundary?  │
        │ OR checks: if (error) render <Alert> │
        └───────────────────────────────────────┘
                            ↓
        Display error toast:
        "Failed to load reviews. Retrying..."
                            ↓
        React Query auto-retry with exponential backoff
                            ↓
        On retry success: dismiss toast, refetch

Best Practice:
  - Catch error in useCalendarData hook
  - Return { ..., error: error | null }
  - Caller decides: show alert, skip rendering, etc.
  - Don't block entire page on single query failure
```

---

## 12. TESTING STRATEGY

```
UNIT TESTS:
  ├─ heatmapCalculation.ts
  │   ├─ Test: empty reviews → empty map
  │   ├─ Test: single day, 5 reviews → HIGH
  │   ├─ Test: normalized bins (0.66 threshold)
  │   └─ Test: multiple days, varying counts
  │
  ├─ dateGrouping.ts
  │   ├─ Test: group events by date
  │   ├─ Test: sort by daysLeft
  │   └─ Test: filter by type
  │
  └─ colors.ts
      ├─ Test: all activity types have colors
      └─ Test: no missing keys

COMPONENT TESTS (Vitest + React Testing Library):
  ├─ EventCell.tsx
  │   ├─ Test: renders title + daysLeft
  │   ├─ Test: onClick calls onSelect
  │   ├─ Test: memoization prevents re-render
  │   └─ Test: different views (compact vs. full)
  │
  ├─ MonthView.tsx
  │   ├─ Test: DayPicker renders
  │   ├─ Test: HeatmapOverlay applies classes
  │   ├─ Test: click day calls onSelectDate
  │   └─ Test: event indicators appear
  │
  ├─ AgendaView.tsx
  │   ├─ Test: groups events by date
  │   ├─ Test: virtual scrolling on >50 items
  │   └─ Test: click event opens detail panel
  │
  └─ ExamDetailsPanel.tsx
      ├─ Test: drawer opens/closes
      ├─ Test: tabs switch content
      ├─ Test: CTA click navigates
      └─ Test: responsive (bottom vs. right)

INTEGRATION TESTS (E2E via Playwright):
  ├─ Test: Load calendar → exams appear
  ├─ Test: Click view toggle → switch views
  ├─ Test: Click event → drawer opens
  ├─ Test: Click "Start Review" → navigate to /review/:id
  ├─ Test: Filter "Hide Exams" → exams disappear
  └─ Test: Mobile viewport → Agenda default

PERFORMANCE TESTS (React DevTools Profiler):
  ├─ Test: Heatmap recalc <50ms
  ├─ Test: Virtual agenda scroll >60fps
  ├─ Test: 10k card heatmap <200ms
  └─ Test: View switch animation smooth
```

---

**This document is the visual blueprint for the calendar refactoring. Reference sections 1–12 during implementation, reviews, and testing.**
