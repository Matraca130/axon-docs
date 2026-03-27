# Axon Calendar Mobile UX Audit — Document Index

**Complete audit of mobile-first design for Axon/Seeki calendar feature**
**Date:** 2026-03-27 | **Auditor:** Senior Mobile UX Designer + React Developer

---

## Quick Navigation

### For Project Managers / Stakeholders
**Start here:** [`AUDIT_SUMMARY.txt`](AUDIT_SUMMARY.txt) (2 min read)
- Executive summary
- 6 critical issues found
- Recommendations by phase
- Risk mitigation
- Next steps to approve

### For Developers / Implementers
**Start here:** [`CALENDAR_MOBILE_QUICK_START.md`](CALENDAR_MOBILE_QUICK_START.md) (5 min read)
- TL;DR decisions
- Implementation phases (Week 1-3)
- Copy-paste component code
- Common pitfalls (don't make these mistakes)
- Performance targets
- Testing devices & checklists

### For Designers / Product
**Start here:** [`AUDIT_MOBILE_UX_CALENDAR_v1.md`](AUDIT_MOBILE_UX_CALENDAR_v1.md) (20 min read)
- Complete mobile UX analysis
- Detailed wireframes (ASCII) for 375px and 768px
- Design specifications (sizes, colors, spacing)
- Rationale for each decision
- All Tier 1-10 features analyzed

### For Code Reference
**Start here:** [`CALENDAR_MOBILE_COMPONENTS_REFERENCE.md`](CALENDAR_MOBILE_COMPONENTS_REFERENCE.md) (10 min browse)
- Copy-paste ready React components
- Hooks (useSwipe, useLongPress, useDarkMode)
- Color token system
- Tailwind CSS patterns
- Dark mode implementation
- Responsive breakpoints

---

## Document Descriptions

### 1. AUDIT_MOBILE_UX_CALENDAR_v1.md (1,395 lines)

**Comprehensive deep-dive into mobile calendar UX**

Contents:
- Executive summary (findings + recommendations)
- Tier 1-10 feature analysis:
  - Agenda view design (mobile default)
  - Month view redesign (48×48px compressed grid)
  - Bottom sheet vs. modal vs. inline analysis
  - Touch gestures (swipe, long-press, tap)
  - Touch target sizes (WCAG compliance)
  - Performance on low-end devices
  - View toggle design (sticky bottom tab bar)
  - Dark mode and color contrast
  - Tablet breakpoint (768px+)
  - Accessibility checklist
- Detailed Tailwind CSS classes
- ASCII wireframes for all screen sizes
- Color system with dark mode variants
- Implementation roadmap (3 phases)
- Risk assessment and mitigations

**Read this if:** You're designing the feature or need complete context.
**Time commitment:** 20-30 minutes

---

### 2. CALENDAR_MOBILE_COMPONENTS_REFERENCE.md (990 lines)

**Copy-paste ready React components and patterns**

Contents:
- AgendaView.tsx (scrollable list)
- AgendaSection.tsx (sticky headers)
- AgendaEventCard.tsx (individual cards)
- MonthView.tsx (compressed grid)
- MonthDayCell.tsx (individual day cell)
- ExamDetailsPanel.tsx (bottom sheet)
- ViewToggle.tsx (tab bar)
- useSwipe.ts (gesture detection hook)
- useLongPress.ts (v2 feature)
- useDarkMode.ts (theme toggle)
- Color tokens (heatmap + urgency)
- Tailwind config extension
- Responsive patterns
- Testing checklist

**Read this if:** You're implementing the components. Code is production-ready.
**Time commitment:** 10-15 minutes (browse) + time to integrate

---

### 3. CALENDAR_MOBILE_QUICK_START.md (420 lines)

**Developer quick reference guide**

Contents:
- TL;DR decisions table
- Implementation phases (Week 1-3 breakdown)
- Key components (minimal examples)
- Tailwind config requirements
- Data structures (TypeScript interfaces)
- Common pitfalls and fixes
- Performance targets (FCP, INP, memory)
- Testing devices (priority order)
- Accessibility checklist
- Dark mode testing guide
- Deployment checklist

**Read this if:** You're jumping into implementation and need quick guidance.
**Time commitment:** 5-10 minutes

---

### 4. AUDIT_SUMMARY.txt (Plain Text)

**Executive summary in plain text (for email/docs)**

Contents:
- Scope and findings
- Tier 1 critical issues
- Recommendations by phase
- Key design decisions (5 decisions explained)
- Deliverables summary
- Wireframe ASCII art
- Color system
- Performance targets
- Accessibility checklist
- Testing recommendations
- Risk matrix
- Next steps
- Document file guide

**Read this if:** You need a quick overview or want to share with stakeholders.
**Time commitment:** 3-5 minutes

---

## Key Findings Summary

### Critical Issues Found

1. **No Mobile-Default View**
   - Plan assumes Month/Week views work at 375px (they don't)
   - Recommendation: Make Agenda the primary view

2. **Month Grid Unreadable**
   - 7 columns × 375px = 47px cells (text illegible)
   - Solution: Compress grid to heatmap only; delegate events to Agenda

3. **Exam Details Panel Undefined**
   - No spec for mobile (centered modal is bad UX on 375px)
   - Recommendation: Use bottom sheet with swipe-to-dismiss

4. **Touch Target Failures**
   - Event indicators reduce effective tap area
   - Solution: Layer indicators (position: absolute) instead of side-by-side

5. **No Gesture Vocabulary**
   - Swipe, tap, long-press patterns undefined
   - Provided: useSwipe() hook + patterns for all gestures

6. **Dark Mode Untested**
   - 7-color heatmap not designed for OLED
   - Solution: Color tokens with light + dark variants (WCAG AA verified)

---

## Implementation Roadmap

### Phase 1: Agenda + Details (Week 1)
- Scrollable event list grouped by urgency
- Bottom sheet for exam details
- Swipe ←→ for week navigation
- **Files:** AgendaView, AgendaEventCard, ExamDetailsPanel, useSwipe hook

### Phase 2: Month View + Tab Toggle (Week 2)
- Compressed month grid (48×48px cells)
- Tab bar with Agenda/Week/Month
- Day cell tap → filter agenda
- **Files:** MonthView, MonthDayCell, ViewToggle

### Phase 3: Performance + Tablet (Week 3)
- Virtual scrolling for agenda
- Lazy-load details panel
- Defer heatmap colors
- Responsive layout at 768px+
- **Optimizations:** Lighthouse CI, debounce, split routes

---

## Design Decisions

### Decision 1: Agenda as PRIMARY View
- **Why:** Month grid at 375px is unreadable
- **How:** Tab toggle allows both; agenda is default
- **Impact:** Improves readability, reduces cognitive load

### Decision 2: Bottom Sheet for Exam Details
- **Why:** Natural swipe-to-dismiss; preserves context; thumb-friendly
- **How:** RDK Dialog + React touch handlers
- **Impact:** Mobile-native interaction, no extra libraries needed

### Decision 3: Swipe Gestures (Not Click Arrows)
- **Why:** Native mobile gesture; reduces UI clutter
- **How:** useSwipe() hook; 50px threshold; vertical priority
- **Impact:** Feels responsive, no button bloat

### Decision 4: Heatmap + Indicators Layered
- **Why:** 48×48px cell can't fit text + color + dots if side-by-side
- **How:** Heatmap = background; dots = position: absolute
- **Impact:** Clean visual hierarchy, full tap target

### Decision 5: Sticky Bottom Tab Bar
- **Why:** Bottom is thumb-reachable; top wastes vertical space
- **How:** 56px height + iOS safe-area-inset-bottom
- **Impact:** Navigation always accessible, content not hidden

---

## Testing Devices (Priority Order)

| Device | Screen | OS | Use Case |
|--------|--------|----|---------  |
| iPhone SE 2 | 375px | iOS 15+ | Primary user |
| Moto G7 | 360px | Android 9 | Budget phone (typical Argentina) |
| iPhone 13 | 390px | iOS 16+ | Secondary iOS |
| iPad Air | 768px | iPadOS | Tablet breakpoint |

**Critical:** Test on real devices, not Chrome DevTools emulator.

---

## Accessibility Requirements (WCAG 2.1 AA)

- ✓ Touch targets: 44×44px minimum (calendar cells 48×48px)
- ✓ Color contrast: 4.5:1 (verified for all heatmap colors + dark mode)
- ✓ Keyboard navigation: Tab, arrows, Enter
- ✓ ARIA labels: All cards have aria-label
- ✓ Screen reader: Announces exam details on focus
- ✓ Reduced motion: Respects prefers-reduced-motion

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| FCP (First Contentful Paint) | < 2.5s on slow 4G | Lighthouse |
| INP (Interaction to Paint) | < 200ms | Core Web Vitals |
| Memory | < 50 MB after 5 min | Low-end phone friendly |
| Swipe frame rate | 60 FPS (48+ acceptable) | Smooth on budget hardware |

**Optimizations:** Virtual scrolling, lazy-load details, defer heatmap colors.

---

## Color System

### Heatmap (Calendar Day Cells)

| Urgency | Light BG | Dark BG | Meaning |
|---------|----------|---------|---------|
| none | bg-white | dark:bg-gray-800 | No events |
| study | bg-blue-50 | dark:bg-blue-900 | Study session |
| review | bg-teal-50 | dark:bg-teal-900 | Repaso programado |
| exam | bg-orange-50 | dark:bg-orange-900 | Exam day |
| urgent | bg-red-50 | dark:bg-red-900 | Exam <7 days away |

### Urgency Badges (Exam Cards)

| Days Left | Color | Meaning |
|-----------|-------|---------|
| > 30 | Gray | "Hay tiempo" |
| 15-30 | Blue | "Empeza a planificar" |
| 7-14 | Amber | "Intensificar" |
| 3-7 | Orange | "Modo intensivo" |
| < 3 | Red | "Último repaso" |

All verified for 4.5:1 contrast ratio on light + dark backgrounds.

---

## Next Steps (For Approval)

1. **Design Phase** (Before coding)
   - Review wireframes with Figma designer
   - Get stakeholder approval on Agenda-as-default decision
   - Verify color palette matches existing design system

2. **Implementation Phase** (Follow Quick Start)
   - Week 1: Agenda + details panel
   - Week 2: Month view + tab toggle
   - Week 3: Performance optimizations + tablet responsive

3. **Testing Phase**
   - Deploy to Vercel preview on every commit
   - Test on real 375px phone (iPhone SE 2 or Moto G7)
   - Run Lighthouse CI (target >= 90 mobile score)
   - Verify dark mode + keyboard navigation

4. **Launch Phase**
   - Accessibility audit (axe-core)
   - QA sign-off on all browsers
   - Deploy to production

---

## File Locations

All files are in: `/sessions/vibrant-gallant-cori/mnt/AXON PROJECTO/`

| File | Size | Purpose |
|------|------|---------|
| AUDIT_MOBILE_UX_CALENDAR_v1.md | 1,395 lines | Complete audit (designers/PMs) |
| CALENDAR_MOBILE_COMPONENTS_REFERENCE.md | 990 lines | Copy-paste React code |
| CALENDAR_MOBILE_QUICK_START.md | 420 lines | Developer quick reference |
| AUDIT_SUMMARY.txt | Plain text | Stakeholder summary |
| README_MOBILE_UX_AUDIT.md | This file | Navigation guide |

---

## Reading Recommendations by Role

### Product Manager / Project Lead
1. Read: AUDIT_SUMMARY.txt (5 min)
2. Review: Wireframes in AUDIT_MOBILE_UX_CALENDAR_v1.md (Tier 1-2, 10 min)
3. Decide: Approve Agenda-as-default design? (5 min)
4. Next: Assign developers to implement Phase 1 (CALENDAR_MOBILE_QUICK_START.md)

### UI/UX Designer
1. Read: AUDIT_MOBILE_UX_CALENDAR_v1.md sections 1.1-3.2 (15 min)
2. Review: All wireframes (ASCII art, 10 min)
3. Design: Create Figma mockups based on provided wireframes
4. Verify: Dark mode colors against design system

### Frontend Developer
1. Read: CALENDAR_MOBILE_QUICK_START.md (5 min)
2. Review: CALENDAR_MOBILE_COMPONENTS_REFERENCE.md (skim components, 5 min)
3. Copy: Components into your codebase
4. Implement: Phase 1 (follow week 1 checklist)
5. Test: On real device + Lighthouse CI

### QA / Testing
1. Read: Testing section in CALENDAR_MOBILE_QUICK_START.md (5 min)
2. Devices: Get iPhone SE 2 + Moto G7 (or simulators)
3. Checklist: Use accessibility + deployment checklists
4. Sign-off: Verify all items before launch

---

## Questions?

- **"Why Agenda as default?"** → See Decision 1 in Recommendations
- **"What if bottom sheet dismiss fails?"** → Use X button fallback (see QUICK_START)
- **"How do dark mode colors work?"** → See Color System section
- **"What should I test first?"** → See Testing Devices table
- **"How long to implement?"** → 3 weeks, see Implementation Roadmap

---

## Final Notes

This audit represents **2,800+ lines of detailed analysis** covering:
- Mobile-first design principles
- Specific Tailwind CSS implementations
- React component patterns with full code
- Dark mode + accessibility compliance
- Performance optimization strategies
- Testing procedures for low-end devices
- Risk mitigation plan

All major UX decisions are already made. Developers just need to follow the provided patterns. No extensive design phase required—just approval of Agenda-as-default decision, then go.

---

**Created:** 2026-03-27
**For:** Axon/Seeki medical education platform
**Updated:** Use this document as the single source of truth for calendar development
