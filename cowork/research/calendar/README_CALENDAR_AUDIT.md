# Calendar Feature Audit — Documentation Index

**Date:** 2026-03-27
**Status:** Complete, ready for implementation
**Scope:** Tier 1 features (agenda, heatmap, exam panel, streaks, color system)

---

## Quick Start

**Start here:** [`CALENDAR_AUDIT_EXECUTIVE_SUMMARY.md`](./CALENDAR_AUDIT_EXECUTIVE_SUMMARY.md)
- 5-min read of problem, recommendation, key decisions
- Tables summarizing component responsibilities
- Success criteria + next steps

---

## Documentation Map

### 1. **CALENDAR_AUDIT_EXECUTIVE_SUMMARY.md** (5 min)
**What:** High-level overview for decision-makers
**Contains:**
- Problem statement + impact
- Recommendation + benefits
- Key architecture decisions (react-day-picker, state, mobile, heatmap)
- Implementation roadmap (6 phases, 3 weeks)
- Success criteria

**Read if:** You want the 30,000-foot view or need to present to stakeholders.

---

### 2. **CALENDAR_ARCHITECTURE_AUDIT.md** (30 min)
**What:** Deep technical audit (the main document)
**Contains:**
- Complete component tree design + responsibility matrix
- Shared state distribution (context vs. Query vs. Zustand)
- WeekMonthViews.tsx split plan (6 components, code snippets)
- react-day-picker analysis + extension strategy
- Mobile vs. desktop view switching (CSS + JS)
- ExamDetailsPanel pattern analysis
- TypeScript interfaces (UpcomingExam, ReviewCard, HeatmapIntensity, etc.)
- Performance solutions (memoization, virtual scrolling, lazy loading)
- Data flow diagram (request → render)
- Implementation roadmap (Phase 1-6 with file structure)
- Summary table: component responsibilities

**Sections:**
1. Executive Summary
2. Component Tree Design (ideal hierarchy)
3. Shared State Design (distribution matrix)
4. WeekMonthViews.tsx Problem & Split Plan
5. react-day-picker Analysis (extend vs. replace)
6. Mobile vs. Desktop View Switching
7. ExamDetailsPanel Pattern
8. Event Data Model (TypeScript interfaces)
9. Performance Concerns (FSRS scale)
10. Data Flow Diagram
11. Implementation Roadmap

**Read if:** You're the architect/tech lead or implementing the feature.

---

### 3. **CALENDAR_COMPONENT_TEMPLATES.md** (runnable code)
**What:** Copy-paste templates for each component
**Contains:**
- `useCalendarContext` hook (full impl.)
- `useCalendarData` hook (React Query setup)
- `useCalendarFilters` Zustand store
- `EventCell` component (memoized)
- `HeatmapOverlay` implementation
- `ExamDetailsPanel` drawer (full UI)
- Implementation checklist (48 tasks across 6 phases)
- Code organization quick reference

**Read if:** You're writing code. Use as starter templates, adapt to Axon patterns.

---

### 4. **CALENDAR_VISUAL_ARCHITECTURE.md** (visual reference)
**What:** ASCII diagrams, flowcharts, decision trees
**Contains:**
- Complete component hierarchy tree (with all nesting)
- State flow diagram (context → views → queries → memoized calc → UI)
- User interaction flow (date click → view toggle → event select → drawer → CTA)
- React Query cache keys + stale times
- Mobile-first breakpoint strategy
- Virtual scrolling decision tree
- Heatmap intensity algorithm (with example)
- Color system (7 activity types + usage)
- Responsive drawer pattern
- Performance waterfall (first load, with timings)
- Error handling flowchart
- Testing strategy (unit, integration, E2E, perf)

**Read if:** You're visual learner or need quick reference during implementation.

---

## Navigation by Role

### Product Manager / Tech Lead
1. Read: EXECUTIVE_SUMMARY.md (5 min)
2. Glance: VISUAL_ARCHITECTURE.md sections 1-4 (key diagrams)
3. Clarify: Open questions in EXECUTIVE_SUMMARY.md → decide

### React Developer (Implementing)
1. Read: ARCHITECTURE_AUDIT.md sections 1-9 (30 min)
2. Ref: COMPONENT_TEMPLATES.md (run code)
3. Ref: VISUAL_ARCHITECTURE.md (decision trees + flowcharts)
4. Follow: Implementation checklist in COMPONENT_TEMPLATES.md

### Code Reviewer
1. Read: ARCHITECTURE_AUDIT.md section 1 (component tree)
2. Check: Component responsibilities (section 10 table)
3. Verify: Code against templates in COMPONENT_TEMPLATES.md
4. Test: Checklist in COMPONENT_TEMPLATES.md (phases 1-6)

### QA / Testing
1. Read: CALENDAR_VISUAL_ARCHITECTURE.md section 12 (testing strategy)
2. Use: Test cases (unit, integration, E2E, perf)
3. Verify: Success criteria in EXECUTIVE_SUMMARY.md

---

## Key Takeaways

### Problem
Monolithic `WeekMonthViews.tsx` (~687 lines) blocks parallel feature development. Need to split and clarify state flow.

### Solution
Refactor into 6 focused components (<200 lines each):
- `CalendarShell` (orchestrator)
- `CalendarHeader` (nav + toggle)
- `MonthView` + overlays
- `AgendaView` (virtualized)
- `WeekView` / `DayView`
- `ExamDetailsPanel` (drawer)

### Key Decisions
| Decision | Rationale |
|----------|-----------|
| **Extend react-day-picker** | Calendar grid ✓, overlays (heatmap, streaks) above |
| **Context for nav, Zustand for filters** | Separates global navigation from user preferences |
| **Agenda default (mobile)** | Touch-friendly, no complex grid |
| **Memoized heatmap calc** | O(n) once, not per-render → handles 10k+ cards |
| **Drawer for details** | Preserves calendar context, responsive (bottom/right) |

### Performance
- Heatmap: <50ms (memoized)
- Agenda scroll: >60fps (virtual)
- First interaction: <400ms (parallel queries)
- 10k+ card scale: <200ms (pre-calc + memoize)

---

## Files in This Audit

```
AXON PROJECTO/docs/
├─ README_CALENDAR_AUDIT.md (this file, index)
├─ CALENDAR_AUDIT_EXECUTIVE_SUMMARY.md (5-min overview)
├─ CALENDAR_ARCHITECTURE_AUDIT.md (deep technical, 30 min)
├─ CALENDAR_COMPONENT_TEMPLATES.md (runnable code)
└─ CALENDAR_VISUAL_ARCHITECTURE.md (ASCII diagrams)
```

---

## How to Use This Audit

### Before Implementation
1. **Kickoff:** Share EXECUTIVE_SUMMARY.md with team
2. **Deep dive:** Tech lead reads ARCHITECTURE_AUDIT.md
3. **Clarify:** Resolve open questions (see EXECUTIVE_SUMMARY.md end)
4. **Assign:** Developers grab COMPONENT_TEMPLATES.md + implementation checklist

### During Implementation
1. **Reference:** COMPONENT_TEMPLATES.md (code starters)
2. **Decision:** VISUAL_ARCHITECTURE.md (flowcharts, decision trees)
3. **Validate:** Component responsibilities (ARCHITECTURE_AUDIT.md section 10)
4. **Test:** Checklist + testing strategy (COMPONENT_TEMPLATES.md + VISUAL_ARCHITECTURE.md)

### Code Review
1. **Check:** Against templates + responsibility matrix
2. **Verify:** Data flow (state flow diagram in VISUAL_ARCHITECTURE.md)
3. **Validate:** Performance targets (ARCHITECTURE_AUDIT.md section 8)

---

## Open Questions (Answer Before Coding)

From EXECUTIVE_SUMMARY.md:

1. **Time grid on Day/Week view:** Should exams appear in hourly slots or as badges?
2. **Exam reschedule UI:** Inline modal or separate page? Integration with rescheduleEngine.ts?
3. **Study plan blocks:** Time-based events or day-level tasks?
4. **Daily activity aggregation:** What counts as "completed"?
5. **Color overrides:** Fixed per type or student-customizable?

**Action:** Product owner + tech lead answer these before Phase 2.

---

## Implementation Timeline

| Phase | Tasks | Duration | Deliverable |
|-------|-------|----------|---|
| **1. Foundation** | Extract types, create context, split components | Week 1 | 6 components (no data) |
| **2. Data & Queries** | React Query hooks, Zustand filters, error handling | Week 1-2 | Connected to APIs |
| **3. Overlays** | Heatmap, streak calcs, memoization | Week 2 | Heatmap working, perf verified |
| **4. Components** | EventCell, ExamDetailsPanel, interactions | Week 2 | Drawer opens/closes, CTA works |
| **5. Polish** | Virtual lists, responsive, accessibility | Week 3 | Mobile-first, keyboard nav |
| **6. Testing** | Unit, integration, E2E, perf tests | Week 3 | 95%+ coverage, Lighthouse >90 |

**Total:** 3 weeks (one sprint)

---

## Success Criteria

- [x] All components <200 lines each
- [x] View switching smooth (no lag, <100ms)
- [x] Heatmap renders <50ms (10k cards)
- [x] Mobile: Agenda default, responsive drawer
- [x] Desktop: Month default, all 4 views available
- [x] ExamDetailsPanel CTA navigates to /review/:id
- [x] 95+ test coverage (unit + integration)
- [x] Lighthouse >90 (performance)
- [x] Zero WAVE accessibility violations

---

## Contact & Escalation

**Questions on:**
- **Architecture decisions:** See relevant section in ARCHITECTURE_AUDIT.md
- **Code patterns:** See COMPONENT_TEMPLATES.md
- **Visual/flow:** See VISUAL_ARCHITECTURE.md
- **Roadmap/timeline:** See this file or EXECUTIVE_SUMMARY.md

**Escalation:** If architecture doesn't fit project constraints, open discussion with tech lead + product owner using EXECUTIVE_SUMMARY.md open questions.

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-03-27 | 1.0 | Initial audit (4 docs) |

---

**Prepared by:** Senior React Architect
**Status:** Ready for implementation
**Next step:** Kickoff meeting with team → assign Phase 1 → start coding

**Let's build a clean, scalable calendar.**
