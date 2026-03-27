# Calendar Feature Audit — Executive Summary

**Prepared:** 2026-03-27
**Scope:** Architectural review for Tier 1 features (agenda, heatmap, exam panel, streaks, colors)
**Status:** Ready for implementation

---

## PROBLEM STATEMENT

**Current state:** `WeekMonthViews.tsx` (~687 lines) is monolithic, blocking parallel feature development.

**Symptoms:**
- Week + month logic intertwined (can't test independently)
- Adding Day/Agenda view requires untangling existing code
- Event rendering has no dedicated component (copy-paste risk)
- No clear state contract (prop drilling)
- Performance concerns with FSRS scale (10k+ cards)

**Impact:** Feature velocity is low; technical debt accumulates.

---

## RECOMMENDATION: MODULAR SPLIT

**Action:** Refactor into 6 focused components + supporting hooks/stores.

### Proposed Structure

```
CalendarShell (orchestrator)
├─ CalendarHeader (nav + view toggle)
├─ ViewContainer (conditional view render)
│  ├─ MonthView + HeatmapOverlay + StreakOverlay
│  ├─ AgendaView (virtualized list)
│  ├─ WeekView + TimeGrid
│  └─ DayView + TimeGrid
└─ ExamDetailsPanel (drawer)
```

### Key Benefits

| Benefit | Impact |
|---------|--------|
| **Modular design** | Each component <200 lines, testable in isolation |
| **State clarity** | Context for nav, local state for UI, Zustand for filters |
| **Feature isolation** | Add Day view without touching Month/Agenda logic |
| **Performance** | Memoization + virtual lists handle 10k+ FSRS cards |
| **Mobile-first** | Agenda default, responsive drawer, CSS breakpoints |

---

## ARCHITECTURE DECISIONS

### 1. react-day-picker: EXTEND, DON'T REPLACE

**Verdict:** Sufficient as calendar grid foundation. Extend via overlays.

**Why:**
- Provides month grid, date selection, accessibility
- Heatmap/streaks/events are UI layers above it, not within
- Custom modifiers + overlay divs = clean separation

**Implementation:** DayPicker + absolute-positioned overlays (HeatmapOverlay, StreakOverlay)

### 2. State Location

| State | Location | Reason |
|-------|----------|--------|
| `selectedDate`, `viewMode` | Context | Drives all views |
| `selectedExamId` (drawer) | Context | Global need |
| `reviewsDue`, `exams`, `plans` | React Query | Shared across views, cached |
| `hideExams`, `hideReviews` | Zustand | Persisted user filter |
| `hoverDay` (tooltip) | Local useState | Local UI only |

### 3. Mobile vs. Desktop

**Strategy:** Mobile-first (Agenda default) + CSS breakpoints.

- Mobile (<768px): Agenda only, drawer from bottom
- Desktop (≥768px): Month default, all views available, drawer from right

**Implementation:** `useCalendarViewMode()` hook + Tailwind `hidden md:block`

### 4. ExamDetailsPanel

**Pattern:** Drawer (bottom/right responsive).

**Why:** Drawer preserves calendar context (vs. modal) while sliding up on mobile for touch comfort.

**Primary CTA:** "▶ Start Review Now" (prominent, navy button)

### 5. Heatmap at Scale

**Problem:** 10k+ FSRS cards → heatmap calc O(n), can't recalc every render.

**Solution:**
- Memoize `useHeatmapIntensity()` with deps: [reviewsDue, scheduledPlans, dateRange]
- Pre-calculate intensity bins (O(n) once, not per-render)
- Virtual scrolling for AgendaView (>50 items)
- Lazy load detail queries (only when drawer opens)

**Result:** Heatmap <50ms, even with 10k cards.

---

## IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1)
- Extract types + context
- Refactor MonthView + create AgendaView
- Split components, no data yet
- Test view switching

### Phase 2: Data & Queries (Week 1-2)
- Connect React Query hooks
- Implement Zustand filters
- Error boundaries + loading states

### Phase 3: Overlays (Week 2)
- HeatmapOverlay + intensity calculation
- StreakOverlay (daily activity dots)
- Test performance at scale

### Phase 4: Components & Interactions (Week 2)
- ExamDetailsPanel (drawer)
- EventCell (memoized)
- CTA navigation

### Phase 5: Polish & Performance (Week 3)
- Virtual agenda list
- Responsive drawer (mobile/desktop)
- Keyboard navigation
- Accessibility audit

### Phase 6: Testing (Week 3)
- Unit tests (heatmap, grouping)
- Integration tests (view switch, drawer)
- E2E tests (full user flow)
- Performance profiling

---

## COMPONENT RESPONSIBILITIES (QUICK REF)

| Component | Single Responsibility |
|-----------|---|
| `CalendarShell` | Orchestrate views, manage context, coordinate drawer |
| `CalendarHeader` | Date navigation + view toggle |
| `ViewToggle` | Button group, mobile detection |
| `MonthView` | Month grid layout (react-day-picker + overlays) |
| `AgendaView` | Flat event list sorted by date (with virtual scrolling) |
| `WeekView` | 7-day time grid |
| `DayView` | Single day time grid |
| `HeatmapOverlay` | Intensity calculation + styling (non-rendered data provider) |
| `StreakOverlay` | Daily activity dot visualization |
| `EventCell` | Reusable event badge (memoized) |
| `ExamDetailsPanel` | Drawer with tabs, detail view, CTAs |

---

## DATA FLOW (SIMPLIFIED)

```
User selects date → context updates
    ↓
dateRange recalculates (memoized)
    ↓
React Query refetches in parallel:
  - /api/exams
  - /api/reviews-due?start=X&end=Y
  - /api/plan-tasks?start=X&end=Y
  - /api/daily-activities?start=X&end=Y
    ↓
useHeatmapIntensity() recalcs (memoized, O(n))
    ↓
Views render with data
    ↓
User clicks event → selectedExamId updates
    ↓
ExamDetailsPanel opens, fetches detail
```

---

## PERFORMANCE TARGETS

| Metric | Target | Method |
|--------|--------|--------|
| Heatmap calc | <50ms | useMemo + binning algorithm |
| Agenda scroll | >60fps | Virtual scrolling (>50 items) |
| First interaction | <400ms | Parallel queries |
| Drawer open | <200ms | Lazy detail query |
| 10k+ card heatmap | <200ms | Pre-calculate, memoize |

---

## OPEN QUESTIONS (FOR IMPLEMENTATION)

1. **Time grid on Day/Week view:** Should exams appear in hourly slots, or stay as badges? (Current design doesn't specify timing.)

2. **Exam reschedule UI:** Is it inline (modal) or a separate page? How does it integrate with rescheduleEngine.ts?

3. **Study plan blocks:** Are they time-based events or day-level tasks? (Affects layout in Day/Week views.)

4. **Daily activity aggregation:** What counts as "completed"? (Needed for streak calculation.)

5. **Color overrides:** Can students customize event colors, or are they fixed per activity type?

6. **Drag-to-reschedule:** Should calendar support drag-drop to move events? (Not in Tier 1, but worth noting for future.)

---

## FILES CREATED (REFERENCE DOCS)

1. **CALENDAR_ARCHITECTURE_AUDIT.md** — Complete architectural analysis
   - Component tree design (full hierarchy)
   - Shared state design matrix
   - WeekMonthViews split plan (6 components)
   - react-day-picker analysis
   - Mobile/desktop strategy
   - ExamDetailsPanel pattern
   - TypeScript interfaces
   - Performance optimizations
   - Data flow diagram
   - Implementation roadmap

2. **CALENDAR_COMPONENT_TEMPLATES.md** — Runnable code templates
   - useCalendarContext hook (full implementation)
   - useCalendarData hook (queries + caching)
   - Zustand filters store
   - EventCell component (memoized)
   - HeatmapOverlay implementation
   - ExamDetailsPanel drawer (full UI)
   - Implementation checklist (48 tasks)
   - Code organization quick reference

3. **CALENDAR_VISUAL_ARCHITECTURE.md** — Visual diagrams & decision trees
   - Complete component hierarchy (ASCII tree)
   - State flow diagram
   - User interaction flows
   - React Query cache keys
   - Mobile-first breakpoint strategy
   - Virtual scrolling decision tree
   - Heatmap intensity algorithm (with example)
   - Color system (7 activity types)
   - Responsive drawer pattern
   - Performance waterfall
   - Error handling flowchart
   - Testing strategy (unit, integration, E2E, perf)

4. **CALENDAR_AUDIT_EXECUTIVE_SUMMARY.md** ← You are here
   - High-level overview
   - Key decisions + rationale
   - Implementation roadmap (6 phases)
   - Quick reference tables

---

## NEXT STEPS

**For architecture review:**
1. Review the 4 docs (especially Architecture + Visual Architecture)
2. Verify component hierarchy matches your UX flow
3. Check TypeScript interfaces against backend API
4. Confirm mobile breakpoint (768px) matches product specs
5. Clarify open questions (timing, reschedule flow, etc.)

**For implementation:**
1. Assign developer(s) to Phase 1 (foundation)
2. Use component templates from CALENDAR_COMPONENT_TEMPLATES.md as starters
3. Reference CALENDAR_VISUAL_ARCHITECTURE.md during development
4. Follow implementation checklist (48 tasks, ~2-3 per component)
5. Measure performance targets with React DevTools Profiler

**Estimated effort:** 3 weeks (one sprint) for Tier 1 + polish. Longer if reschedule/time-grid complexity is underestimated.

---

## SUCCESS CRITERIA

- [ ] All 6 components (<200 lines each)
- [ ] View switching smooth (no lag)
- [ ] Heatmap renders <50ms (10k cards)
- [ ] Mobile: Agenda default, responsive drawer
- [ ] Desktop: Month default, all views available
- [ ] ExamDetailsPanel CTA navigates correctly
- [ ] 95+ unit/integration test coverage
- [ ] Lighthouse performance: >90
- [ ] Zero accessibility violations (WAVE)

---

**Ready to build. Let's ship.**
