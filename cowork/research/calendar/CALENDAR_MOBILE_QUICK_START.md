# Axon Calendar Mobile UX: Quick Start Guide

**For developers building the calendar feature**
**Read this BEFORE implementing anything**

---

## TL;DR: Mobile-First Design Decisions

| Decision | Reason | Impact |
|----------|--------|--------|
| **Agenda is default view, not Month** | 375px month grid (7 cols) = unreadable | Start with agenda, add month as secondary |
| **Bottom sheet for exam details** | Natural swipe-to-dismiss on mobile | Use RDK Dialog + drag handle, not centered modal |
| **Sticky bottom tab bar (56px)** | Thumb-reachable navigation | Fix `pb-20` in content + `h-14` tab bar + safe area |
| **Swipe ← → for week nav** | Native gesture for time navigation | Use `useSwipe()` hook (provided) |
| **Heatmap + indicator dots layered** | 48×48px cell can't fit text + color + dots | Layer colors (background) + indicators (position: absolute) |
| **Dark mode colors verified WCAG AA** | OLED screens need contrast | Use color tokens with light + dark variants |

---

## Implementation Phases

### Phase 1: Agenda + Details Panel (Week 1)
**Goal:** Core interaction loop works on 375px phone

```bash
# Files to create:
src/components/calendar/AgendaView.tsx
src/components/calendar/AgendaSection.tsx
src/components/calendar/AgendaEventCard.tsx
src/components/calendar/ExamDetailsPanel.tsx
src/hooks/useSwipe.ts

# What it does:
1. Fetch exams for current week
2. Group by urgency (TODAY, THIS WEEK, NEXT 2 WEEKS)
3. Tap card → open bottom sheet
4. Swipe down → close sheet
5. Swipe ← → → next/prev week
```

**Testing on real device:**
```bash
# Deploy to Vercel preview
# Open on iPhone SE 2 (375px)
# Test: scroll, tap, swipe, bottom sheet dismiss
```

### Phase 2: Month View + Tab Toggle (Week 2)
**Goal:** All three views (Agenda, Week, Month) switchable

```bash
# Files to create:
src/components/calendar/MonthView.tsx
src/components/calendar/MonthDayCell.tsx
src/components/calendar/WeekView.tsx
src/components/calendar/ViewToggle.tsx

# What it does:
1. Bottom tab bar with 3 tabs (Agenda, Semana, Mes)
2. Tab switching toggles views
3. Month grid: 7×6 (42 cells), 48×48px each
4. Day cell tap → filter agenda to that date
5. Heatmap colors per urgency
```

**Dark mode testing:**
```bash
# Open DevTools → toggle dark mode
# Verify colors pass WCAG contrast checker
# Test on iPhone in dark mode (late-night studying)
```

### Phase 3: Performance + Tablet (Week 3)
**Goal:** Works smoothly on low-end phones; scales to tablet

```bash
# Optimizations:
- Virtual scrolling for agenda (render only visible events)
- Lazy-load exam details panel
- Defer heatmap color fetch (render gray first, load real data async)
- Debounce swipe events

# Responsive:
- 375px: full-width stacked views
- 768px: sidebar (month) + main (agenda) side-by-side
- Test on: Moto G7, iPad Air
```

---

## Key Components (Copy-Paste Ready)

### 1. Swipe Hook (CRITICAL)

```tsx
// src/hooks/useSwipe.ts
import { useRef, useCallback } from 'react';

export function useSwipe(handlers: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}) {
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const { onSwipeLeft, onSwipeRight, onSwipeDown, threshold = 50 } = handlers;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = startXRef.current - e.changedTouches[0].clientX;
    const deltaY = e.changedTouches[0].clientY - startYRef.current;

    if (Math.abs(deltaY) > threshold && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY > threshold && onSwipeDown) onSwipeDown();
    }

    if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > threshold && onSwipeLeft) onSwipeLeft();
      if (deltaX < -threshold && onSwipeRight) onSwipeRight();
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeDown, threshold]);

  return { onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd };
}
```

### 2. Color Tokens

```tsx
// src/theme/calendarColors.ts
export const HEATMAP_COLORS = {
  none: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700',
  study: 'bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-700',
  review: 'bg-teal-50 dark:bg-teal-900 text-teal-900 dark:text-teal-100 border border-teal-200 dark:border-teal-700',
  exam: 'bg-orange-50 dark:bg-orange-900 text-orange-900 dark:text-orange-100 border border-orange-200 dark:border-orange-700',
  urgent: 'bg-red-50 dark:bg-red-900 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-700',
};

export function getUrgencyColor(daysLeft: number) {
  if (daysLeft < 3) return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200';
  if (daysLeft < 7) return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200';
  if (daysLeft < 14) return 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200';
  if (daysLeft < 30) return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200';
  return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
}
```

### 3. Agenda Event Card (Minimal)

```tsx
// src/components/calendar/AgendaEventCard.tsx
export default function AgendaEventCard({ event, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-lg border transition-all
        active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500
        ${getUrgencyColor(event.daysLeft)}
      `}
    >
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {event.subject}
      </p>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
        {formatDate(event.date)} • {event.daysLeft}d
      </p>
    </button>
  );
}
```

### 4. Month Day Cell (Minimal)

```tsx
// src/components/calendar/MonthDayCell.tsx
export default function MonthDayCell({ day, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        h-12 w-12 rounded-md flex items-center justify-center
        text-sm font-semibold relative
        focus-visible:ring-2 focus-visible:ring-blue-500
        ${HEATMAP_COLORS[day.urgency] || HEATMAP_COLORS.none}
      `}
    >
      {day.date}
      {day.eventCount > 0 && (
        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-red-500" />
      )}
    </button>
  );
}
```

### 5. Bottom Sheet (Core Logic)

```tsx
// src/components/calendar/ExamDetailsPanel.tsx
export default function ExamDetailsPanel({ exam, isOpen, onClose }) {
  const [dragStart, setDragStart] = useState(0);

  const handleDragEnd = (e) => {
    if (e.changedTouches[0].clientY - dragStart > 100) onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div
        onTouchStart={(e) => setDragStart(e.touches[0].clientY)}
        onTouchEnd={handleDragEnd}
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl max-h-[90vh] z-50"
      >
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-12 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>
        <div className="px-4 py-6 space-y-6 pb-safe">
          {/* Content here */}
        </div>
      </div>
    </>
  );
}
```

### 6. View Toggle Tab Bar

```tsx
// src/components/calendar/ViewToggle.tsx
export default function ViewToggle({ activeView, onViewChange }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40">
      <div className="flex justify-around h-14">
        {['agenda', 'week', 'month'].map((view) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
              activeView === view
                ? 'text-blue-600 dark:text-blue-400 border-t-3 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {view === 'agenda' && '☑'}
            {view === 'week' && '📋'}
            {view === 'month' && '📅'}
            <span className="text-[10px] font-semibold capitalize">{view}</span>
          </button>
        ))}
      </div>
      <div style={{ height: 'max(0.5rem, env(safe-area-inset-bottom))' }} />
    </div>
  );
}
```

---

## Tailwind Config (Required)

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
      },
    },
  },
  darkMode: 'class',
};
```

---

## Data Structures

### Exam Event

```ts
interface ExamEvent {
  id: string;
  type: 'exam' | 'study' | 'quiz' | 'review';
  subject: string;
  date: Date;
  daysLeft: number;
  prepPercentage: number;
  time?: string;
  location?: string;
  weakTopics: Array<{
    id: string;
    name: string;
    mastery: number;
  }>;
}
```

### Month Day

```ts
interface MonthDay {
  date: number;
  isCurrentMonth: boolean;
  urgency: 'none' | 'study' | 'review' | 'exam' | 'urgent';
  eventCount: number;
  streakActive: boolean;
}
```

---

## Common Pitfalls (Don't Make These Mistakes)

| Mistake | Why It's Bad | Fix |
|---------|-------------|-----|
| **Centered modal for exam details** | Takes full screen; no context on 375px | Use bottom sheet instead |
| **7-column month grid with text labels** | Text unreadable at 48px width | Just show day number + indicators |
| **Swipe + scroll both enabled** | User can't tell which is happening | Use threshold (50px); prioritize vertical over horizontal |
| **Dark mode colors = inverted light colors** | Doesn't work; dark-blue on dark-bg fails | Use color tokens with explicit light + dark variants |
| **No safe area inset on iOS** | Content hidden under home indicator | Use `pb-safe` or `env(safe-area-inset-bottom)` |
| **Tab bar overlaps content** | Content scrolls behind tabs | Add `pb-20` to scrollable container |
| **Rendering all 50 events at once** | Slow on Moto G7 (2GB RAM) | Virtual scrolling; render only visible + 5 buffer |

---

## Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| **First Contentful Paint (FCP)** | < 2.5s on slow 4G | Lighthouse, WebPageTest |
| **Interaction to Paint (INP)** | < 200ms | Core Web Vitals |
| **Memory** | < 50 MB after 5 min navigation | DevTools → Memory tab |
| **Swipe frame rate** | 60 FPS (48+ acceptable) | Chrome DevTools → Performance |

**Run Lighthouse CI on every PR:**
```bash
npm run build
npm run lighthouse
```

---

## Testing Devices (Priority Order)

1. **iPhone SE 2 (375px, iOS 15+)** — Primary user
2. **Moto G7 (360px, Android 9)** — Typical budget phone in Argentina
3. **iPhone 13 (390px, iOS 16+)** — Secondary iOS
4. **iPad Air (768px, iPadOS)** — Tablet layout verification

---

## Accessibility Checklist

- [ ] All buttons/cards >= 44×44px touch targets
- [ ] Color contrast >= 4.5:1 (verified with WCAG checker)
- [ ] Keyboard nav works (Tab through, arrows navigate)
- [ ] ARIA labels on cards: `aria-label="Examen de X en Y días"`
- [ ] Bottom sheet dismissible with X button (fallback for swipe)
- [ ] Respects `prefers-reduced-motion` (no swipe duration changes)
- [ ] Screen reader announces exam details on focus

---

## Dark Mode Testing

```bash
# In DevTools Console:
document.documentElement.classList.add('dark');
document.documentElement.classList.remove('dark');

# Then verify:
1. All text readable (4.5:1 contrast)
2. Event cards distinct from background
3. Urgency badges (red, orange, amber) still visible
4. Tab bar icons visible
```

---

## Deployment Checklist

- [ ] Merge to `feat/calendar-mobile` branch
- [ ] Run `npm run build` — no errors
- [ ] Run `npm run test` — all tests pass
- [ ] Lighthouse score >= 90 (mobile)
- [ ] Test on 375px phone + 768px tablet
- [ ] Dark mode works
- [ ] Keyboard nav works
- [ ] Swipe gestures work (50px, 100px thresholds tested)
- [ ] Bottom sheet dismisses on swipe
- [ ] Safe area respected (no content under notch)
- [ ] Create PR with this checklist

---

## Getting Help

**Refer to these docs:**
1. **Full audit:** `AUDIT_MOBILE_UX_CALENDAR_v1.md` (comprehensive)
2. **Component patterns:** `CALENDAR_MOBILE_COMPONENTS_REFERENCE.md` (copy-paste code)
3. **This guide:** Quick decisions + gotchas

**For mobile UX questions:** See Tier 1–10 sections in audit.

---

**Last updated:** 2026-03-27
**Author:** Senior Mobile UX Designer
**For:** Axon medical education platform
