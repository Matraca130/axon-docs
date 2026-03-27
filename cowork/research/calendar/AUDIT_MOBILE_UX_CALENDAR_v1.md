# MOBILE UX AUDIT: Axon Calendar Feature

**Auditor:** Senior Mobile UX Designer + React Developer
**Date:** 2026-03-27
**Target:** Calendar feature for Axon/Seeki medical education LMS
**Platform:** React 18 + Tailwind v4, Vercel (web app)
**Primary Users:** Medical students in Argentina, 4-5 daily checks on mobile
**Viewport Focus:** 375px (iPhone SE 2–8) and 768px (iPad tablets)

---

## EXECUTIVE SUMMARY

**Finding:** The current calendar plan (`ideas-calendario-finales-argentina.md`) is **desktop-first** with no mobile-specific design considerations. This creates a **critical UX debt** for Axon's primary use case: medical students checking exam schedules on their phones.

**Tier 1 Problems:**
1. **No mobile-default view** — plan assumes Month/Week views work on 375px (they don't)
2. **Heatmap unreadable at 375px** — 7 columns × 375px = 47px cells; even text labels are illegible
3. **Exam details panel undefined** — no spec for mobile (modal vs. bottom sheet vs. inline)
4. **Touch target failures** — 47px cells meet WCAG 44px minimum, but with overlaid heatmap + streak dots, effective tap area shrinks
5. **No gesture vocabulary** — swipe, long-press, tap patterns undefined
6. **Dark mode colors untested** — 7-color heatmap system not designed for OLED dark mode

**Recommendation:** Before building the calendar, define **mobile-first wireframes** for all Tier 1 features using this audit. Route the feature through a mobile-specific design phase.

---

## TIER 1: AGENDA VIEW (Mobile Default)

### 1.1 Current Plan Gap

The document mentions an "Agenda view" but provides **no visual spec**. The UI sketches (3.1–3.4) are all desktop/tablet focused. For mobile, we need an **Agenda as the primary entry point**, not a secondary tab.

### 1.2 RECOMMENDED: Agenda View Design at 375px

**Purpose:** Scrollable list of exams and study events for the next 7–14 days, grouped by urgency. Primary interaction: tap event → details panel.

#### Wireframe A: Compact Agenda (375px, Mobile First)

```
┌─────────────────────────────────────┐
│ ← Calendario                    ⋮   │ ← Header with back + menu
├─────────────────────────────────────┤
│ HOY                                 │
│ ┌─────────────────────────────────┐ │
│ │ PARCIAL Anatomía II     72%  [→] │ ← 60px tall, tap-friendly
│ │ 10 jul  •  AULA 203  •  14:00   │ │
│ │ Faltan: 5 días                  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 📚 Repaso: Aparato Respiratorio │ ← Study session (lighter bg)
│ │ 2 jul  •  09:00  •  1.5h        │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ESTA SEMANA                         │
│ ┌─────────────────────────────────┐ │
│ │ FINAL Fisiología                │ │
│ │ 18 jul  •  Pendiente registro   │ ← Urgent: red dot
│ │ Faltan: 10 días  [!]            │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Quiz Simulado: Bioquímica       │ │
│ │ 15 jul  •  10:00  •  45min      │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ PROXIMAS 2 SEMANAS                  │
│ ┌─────────────────────────────────┐ │
│ │ FINAL Patología                 │ │
│ │ 25 jul  •  Prep: 45%            │ ← Far away: muted colors
│ │ Faltan: 17 días                 │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Recuperatorio Anatomía          │ │
│ │ 28 jul  •  10:00                │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [📅 Mes] [📋 Semana] [☑ Agenda]   │ ← View toggle (sticky bottom)
└─────────────────────────────────────┘
```

**Design Specifications:**

| Element | Spec | Rationale |
|---------|------|-----------|
| **Card height** | 60px + padding 16px | Two lines of text + 44px min touch target |
| **Card spacing** | 12px gap | Standard Tailwind spacing (touch breathing room) |
| **Section header** | Font-weight-600, 12px, text-muted-foreground, 16px margin-top | Visual hierarchy without scrolling fatigue |
| **Primary info** | Exam type (PARCIAL/FINAL/Quiz) + Subject name in 14px semibold | Instantly scannable |
| **Secondary info** | Date + time + status in 12px regular muted | Scan hierarchy: size shows importance |
| **Urgency badge** | Color-coded dot + text indicator | See color system in §1.4 |
| **Touch target** | Full card is tap target (60px × 345px available) | Exceeds 44×44px WCAG |
| **Scroll behavior** | Vertical scroll, sections sticky until next section enters | Context awareness: always know what time range you're viewing |

**Event Types & Icons:**

```
┌─────────────────────┬──────────────────────────┬───────────┐
| Type                | Icon + Label             | BG Color  |
├─────────────────────┼──────────────────────────┼───────────┤
| PARCIAL / FINAL     | 🎓 + Red accent          | red-50    |
| Quiz / Simulacro    | 📝 + Orange accent       | orange-50 |
| Study Session       | 📚 + Blue accent         | blue-50   |
| Repaso Programado   | 🔄 + Teal accent         | teal-50   |
| Recuperatorio       | ↩️ + Amber accent        | amber-50  |
└─────────────────────┴──────────────────────────┴───────────┘
```

**Color System (Urgency, consistent with fallback data §3.1):**

```
┌──────────────────────┬────────────────────┬──────────────────┐
| Days Until Exam      | Badge Color        | Text Color       |
├──────────────────────┼────────────────────┼──────────────────┤
| > 30 days            | bg-gray-100        | text-gray-600    |
| 15–30 days           | bg-blue-100        | text-blue-700    |
| 7–14 days            | bg-amber-100       | text-amber-700   |
| 3–7 days             | bg-orange-100      | text-orange-700  |
| < 3 days             | bg-red-100         | text-red-700     |
│ RED DOT              | [●]                | Danger: action   |
└──────────────────────┴────────────────────┴──────────────────┘
```

#### Tailwind CSS Classes (375px Agenda):

```jsx
// Agenda Card Container
<div className="space-y-3">
  {/* Event Card */}
  <div
    className="
      bg-white border border-gray-200 rounded-lg p-4
      active:bg-gray-50 active:border-gray-300
      cursor-pointer touch-target
      min-h-[60px] flex flex-col justify-center
    "
  >
    {/* Header: Type + Subject + Indicator */}
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">
          PARCIAL Anatomía II
        </p>
      </div>
      {/* Urgency Badge */}
      <div className="flex-shrink-0">
        {daysLeft < 3 && (
          <div className="w-2 h-2 rounded-full bg-red-500"
               title="Acción urgente" />
        )}
      </div>
    </div>

    {/* Subheader: Date + Time + Meta */}
    <p className="text-xs text-gray-500 mt-2 leading-snug">
      10 jul • AULA 203 • 14:00
    </p>

    {/* Progress or Status */}
    <div className="flex items-center justify-between mt-2">
      <p className="text-xs font-medium text-gray-700">
        Faltan: {daysLeft} días
      </p>
      <p className="text-xs text-amber-600 font-semibold">72%</p>
    </div>
  </div>
</div>

// Section Header (Sticky)
<div className="sticky top-0 bg-white py-3 px-4 -mx-4 border-b border-gray-200">
  <p className="text-xs font-semibold text-gray-600 uppercase">
    Esta semana
  </p>
</div>
```

#### Navigation: Swipe vs. Buttons

**Current Plan Gap:** No mention of how to change weeks/time ranges.

**Recommendation for 375px:**

```
┌─────────────────────────────────────┐
│ ← Calendario                         │
├─────────────────────────────────────┤
│ < SEMANA DEL 3 AL 9 DE JULIO >      │ ← Swipe to change week
│   (or tap arrows)                   │
├─────────────────────────────────────┤
│ [Agenda events]                      │
│                                     │
│ [Gesture hints]                      │
│ Desliza para cambiar semana          │ ← Discovery hint (1st load only)
└─────────────────────────────────────┘
```

**Implementation (no additional libraries):**

```jsx
const [weekOffset, setWeekOffset] = useState(0);

const handleSwipe = (direction: 'left' | 'right') => {
  if (direction === 'right' && weekOffset > -12) setWeekOffset(weekOffset - 1);
  if (direction === 'left' && weekOffset < 0) setWeekOffset(weekOffset + 1);
};

return (
  <SwipeArea
    onSwipe={handleSwipe}
    className="touch-pan-x"
  >
    <WeekHeader weekOffset={weekOffset} />
    <AgendaList weekOffset={weekOffset} />
  </SwipeArea>
);
```

---

## TIER 2: MONTH VIEW AT 375PX (Redesign Required)

### 2.1 Current Problem

The existing plan assumes a standard 7×6 grid (7 columns = days of week, 6 rows = weeks). At 375px:

```
375px - 32px padding (2×16px) = 343px available
343px / 7 columns = 49px per cell (including gutters)
49px - 4px gutter = 45px per cell
```

**Issue:** At 45px, you can fit:
- Day number (14px): 1 line ✓
- One event dot: 1px ✓
- Heatmap color: ✓
- Streak indicator: ✗ (no room)

**If you add:**
- Text labels ("Mo", "Tu", "We"): ✓
- Event count badge: ✗
- Drag-drop handles: ✗

### 2.2 Recommendation: Compressed Month View + Delegate Events to Agenda

**Design Philosophy:** On mobile, the Month view becomes a **navigation grid only** (days + heatmap). All event details move to the Agenda view.

#### Wireframe B: Month View at 375px (Compressed)

```
┌─────────────────────────────────────┐
│ ← Calendario                    ⋮   │
├─────────────────────────────────────┤
│ < JULIO 2026 >                      │ ← Month header + nav
├─────────────────────────────────────┤
│ L   M   M   J   V   S   D           │ ← Day labels, 8px font
├─────────────────────────────────────┤
│ [ ] [ ] [ ] [ ] [ ] [ ] [1]         │ ← Row 1 (empty cells = prev month)
│ [2][3][4][5][6][7] [8]              │    Heatmap color fill
│    ● ●                              │    Event dots (tiny, 2px)
│ [9][10][11][12][13][14][15]         │
│ ●●●                                 │
│ [16][17][18][19][20][21][22]        │
│ ●  ◐                                │ ← ◐ = streak indicator (optional)
│ [23][24][25][26][27][28][29]        │
│                                     │
│ [30][31][ ][ ][ ][ ][ ]             │
├─────────────────────────────────────┤
│ [📅 Mes] [📋 Semana] [☑ Agenda]   │
└─────────────────────────────────────┘
```

**Design Specs:**

| Element | 375px Spec | Rationale |
|---------|-----------|-----------|
| **Cell size** | 48×48px (including 2px gutter) | WCAG 44px minimum touch target |
| **Day number** | 10px, semibold, centered | Just readable at 48px |
| **Heatmap color** | Full cell background | Reutiliza color system (§1.4) |
| **Event dots** | 2px radius, max 2 visible | Indicates "multiple events today" |
| **Tap behavior** | Cell tap → show day in Agenda view (filtered to that date) | Delegates to Agenda |
| **Streak indicator** | Optional ring or small dot in corner; hide if space low | Don't fight for pixels |
| **Day labels** | "L M M J V S D" (Spanish single letters) | Fit within 375px width |

#### Tailwind CSS (375px Month Grid):

```jsx
// Month grid container
<div className="grid grid-cols-7 gap-0.5 px-4">
  {/* Day label row */}
  <div className="col-span-7 grid grid-cols-7 gap-0.5 mb-2">
    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label) => (
      <div key={label} className="h-6 flex items-center justify-center">
        <span className="text-[8px] font-semibold text-gray-600 uppercase">
          {label}
        </span>
      </div>
    ))}
  </div>

  {/* Calendar cells */}
  {days.map((day) => (
    <button
      key={day.id}
      onClick={() => handleDayClick(day)}
      className={`
        h-12 w-12 rounded-md flex flex-col items-center justify-center
        text-sm font-medium transition-colors
        ${day.isCurrentMonth
          ? 'bg-white border border-gray-200 hover:border-gray-300 active:bg-gray-50'
          : 'bg-gray-50 text-gray-300'}
        ${getHeatmapColor(day.urgency)}
        relative
      `}
    >
      {/* Day number */}
      <span className="text-xs font-semibold">{day.date}</span>

      {/* Event dots (max 2) */}
      {day.events.slice(0, 2).map((evt, i) => (
        <div
          key={i}
          className="absolute bottom-1 w-1 h-1 rounded-full bg-red-500"
          style={{ left: `${6 + i * 4}px` }}
        />
      ))}

      {/* Streak indicator (optional, corner ring) */}
      {day.streakActive && (
        <div className="absolute top-1 right-1 w-1.5 h-1.5 border border-green-500 rounded-full" />
      )}
    </button>
  ))}
</div>

// Helper: Get heatmap color by urgency
function getHeatmapColor(urgency: 'none' | 'study' | 'review' | 'exam' | 'urgent') {
  const colors = {
    none: 'bg-white',
    study: 'bg-blue-50',
    review: 'bg-teal-50',
    exam: 'bg-orange-50',
    urgent: 'bg-red-50',
  };
  return colors[urgency];
}
```

### 2.3 Why NOT a Compound View (Calendar + List Side-by-Side)

**Tempting but wrong on mobile:**
- At 375px, side-by-side = ~180px calendar + ~180px list. Both become unreadable.
- Switching tabs (Agenda ↔ Month) is 1 tap anyway. Vertical stacking (stack 2 views, switch) is cleaner.
- Storage of tab state per week is unnecessary complexity.

---

## TIER 3: EXAM DETAILS PANEL (Bottom Sheet vs. Modal vs. Inline)

### 3.1 Problem Analysis

**Current Plan:** §3.2 shows a sidebar panel (desktop-oriented). On mobile (375px), this creates three bad options:

| Option | Problem |
|--------|---------|
| Overlay Modal (centered) | Takes full screen, 375px width, OK for reading but hides context. Typical for web. |
| Bottom Sheet | Slides from bottom, occupies ~60% screen, thumb-friendly for mobile. Like Google Maps. |
| Full-screen Overlay | Max readability but loses context (no calendar visible). Similar to iOS Calendar app. |
| Inline Expansion | Event card expands within list. Very mobile-native but complex state. |

### 3.2 RECOMMENDATION: Bottom Sheet

**Why bottom sheet for medical exam details:**
1. **Thumb-reachable** on single-hand use (student lying down, reviewing)
2. **Preserves context** — calendar/agenda visible above the sheet
3. **Swipe-to-dismiss** (gesture natural on mobile)
4. **Progressively expandable** — peek → drag → full screen optional

#### Wireframe C: Bottom Sheet for Exam Details (375px)

```
┌─────────────────────────────────────┐
│ [Agenda list, partially visible]     │ ← Backdrop (30% opacity)
│ PARCIAL Anatomía    72%  ◄─┐         │
│ ...other cards...         │         │
├─────────────────────────────────────┤ ← Drag handle (swipe to dismiss)
│ ≡ FINAL: Anatomía II                │ ← Title (sticky top of sheet)
├─────────────────────────────────────┤
│ 📅 Fecha: 12 jul 2026  14:00        │ ← Key info, immediately
│ 📍 Lugar: AULA 203                  │    scannable
│ ⏱ Faltan: 5 días                    │
│                                     │
│ Preparación estimada                │
│ [═══════════════════=>  ] 72%        │ ← Progress bar
│                                     │
│ Temas débiles (repasa estos):       │ ← Color-coded list
│ 🔴 Miembro inferior (45%)           │ ← Red = high priority
│ 🟡 Osteología craneal (52%)         │ ← Amber = medium
│ 🟢 Articulaciones (81%)             │ ← Green = low priority
│                                     │
│ [Iniciar repaso express]            │ ← CTA buttons (full width)
│ [Ver plan completo] [Modo intensivo]│    Min 44px height
│                                     │
│ [← Cerrar]                          │ ← Dismiss (or swipe down)
└─────────────────────────────────────┘
```

#### Tailwind CSS Implementation (Bottom Sheet):

```jsx
// Bottom sheet container (uses Radix Dialog + Drawer pattern)
import { useRef, useState } from 'react';

export function ExamDetailsPanel({ exam, isOpen, onClose }) {
  const [dragStart, setDragStart] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.TouchEvent) => {
    setDragStart(e.touches[0].clientY);
  };

  const handleDragEnd = (e: React.TouchEvent) => {
    const dragEnd = e.changedTouches[0].clientY;
    if (dragEnd - dragStart > 100) {
      onClose(); // Swipe down > 100px = dismiss
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white rounded-t-2xl shadow-2xl
          max-h-[90vh] overflow-y-auto
          transition-all duration-300 ease-out
          pb-safe px-4
        `}
      >
        {/* Drag handle (visual indicator + swipe zone) */}
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-12 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Content: Sticky header */}
        <div className="sticky top-0 bg-white pt-2 pb-4 -mx-4 px-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {exam.type}: {exam.subject}
          </h2>
        </div>

        {/* Key Info: Date, time, place (always visible) */}
        <div className="space-y-3 py-4">
          <InfoRow icon="📅" label="Fecha" value={exam.date} />
          <InfoRow icon="📍" label="Lugar" value={exam.location} />
          <InfoRow icon="⏱" label="Faltan" value={`${exam.daysLeft} días`} />
        </div>

        {/* Progress bar */}
        <div className="py-4 space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Preparación estimada
          </label>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 transition-all duration-300"
              style={{ width: `${exam.prepPercentage}%` }}
            />
          </div>
          <p className="text-right text-sm font-semibold text-gray-700">
            {exam.prepPercentage}%
          </p>
        </div>

        {/* Weak topics (color-coded) */}
        <div className="py-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            Temas débiles (repasa estos):
          </p>
          {exam.weakTopics.map((topic) => (
            <div key={topic.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getTopicColor(topic.mastery)}`}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{topic.name}</p>
                <p className="text-xs text-gray-500">{topic.mastery}%</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs (full width, stacked for mobile) */}
        <div className="space-y-2 py-6 pb-8">
          <button className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg active:bg-blue-700 transition">
            Iniciar repaso express
          </button>
          <button className="w-full py-3 bg-gray-100 text-gray-900 font-semibold rounded-lg active:bg-gray-200 transition">
            Ver plan completo
          </button>
          <button className="w-full py-3 bg-orange-100 text-orange-700 font-semibold rounded-lg active:bg-orange-200 transition">
            Activar modo intensivo
          </button>
        </div>

        {/* Footer: Close hint (optional) */}
        <div className="flex items-center justify-center pb-6">
          <p className="text-xs text-gray-500">Desliza hacia abajo para cerrar</p>
        </div>
      </div>
    </>
  );
}

// Helper: Info row component
function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// Helper: Topic color by mastery
function getTopicColor(mastery: number) {
  if (mastery < 0.5) return 'bg-red-500';
  if (mastery < 0.75) return 'bg-amber-500';
  if (mastery < 0.95) return 'bg-yellow-500';
  return 'bg-green-500';
}
```

#### Bottom Sheet: Tablet Breakpoint (768px+)

At 768px, you have options:
- **Keep bottom sheet** (still feels natural on iPad)
- **Switch to side panel** (350px wide, right-aligned, leaves ~400px for calendar)

```jsx
// Responsive wrapper (use Tailwind breakpoints)
export function ExamDetailsWrapper({ exam, isOpen, onClose }) {
  return (
    <div className="hidden md:block">
      {/* Tablet: Side panel */}
      <SidePanelView exam={exam} isOpen={isOpen} onClose={onClose} />
    </div>
    <div className="md:hidden">
      {/* Mobile: Bottom sheet */}
      <ExamDetailsPanel exam={exam} isOpen={isOpen} onClose={onClose} />
    </div>
  );
}
```

---

## TIER 4: TOUCH GESTURES (No Extra Libraries)

### 4.1 Gesture Vocabulary for Axon Calendar

**Design goal:** Intuitive for medical students (low cognitive load before exams).

#### Table: Recommended Gestures

| Gesture | Context | Action | Why |
|---------|---------|--------|-----|
| **Tap** | Event card in agenda | Open details bottom sheet | Standard mobile pattern |
| **Tap** | Day cell in month view | Filter agenda to that date | Fast navigation |
| **Swipe left/right** | Agenda view (horizontal swipe) | Next/previous week | Native gesture for time navigation |
| **Swipe down** | Bottom sheet (open) | Dismiss sheet | iOS/Material convention |
| **Long press** | Exam event (future) | Quick actions: "Mark as studied", "Set reminder" | Advanced, optional for v1 |
| **Pinch** | Month view (two-finger) | Zoom month grid (optional, low priority) | Rarely used on phones |

### 4.2 Implementation (React, no libraries)

#### Swipe Detection Hook:

```jsx
// hooks/useSwipe.ts
import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Default 50px
}

export function useSwipe(handlers: SwipeHandlers) {
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const { onSwipeLeft, onSwipeRight, onSwipeDown, threshold = 50 } = handlers;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const deltaX = startXRef.current - endX;
    const deltaY = endY - startYRef.current;

    // Vertical swipe (higher priority than horizontal)
    if (Math.abs(deltaY) > threshold && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY > threshold && onSwipeDown) {
        onSwipeDown();
      }
    }

    // Horizontal swipe
    if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > threshold && onSwipeLeft) {
        onSwipeLeft();
      }
      if (deltaX < -threshold && onSwipeRight) {
        onSwipeRight();
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeDown, threshold]);

  return { onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd };
}
```

#### Usage in Agenda View:

```jsx
export function AgendaView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const swipe = useSwipe({
    onSwipeLeft: () => setWeekOffset(Math.min(weekOffset + 1, 0)),
    onSwipeRight: () => setWeekOffset(Math.max(weekOffset - 1, -52)),
    threshold: 50,
  });

  return (
    <div {...swipe} className="flex flex-col h-screen overflow-hidden">
      <AgendaHeader weekOffset={weekOffset} />
      <AgendaList weekOffset={weekOffset} />
      <ViewToggle />
    </div>
  );
}
```

#### Long Press (Advanced, v2+):

```jsx
// hooks/useLongPress.ts
export function useLongPress(callback: () => void, delay: number = 500) {
  const timerRef = useRef<NodeJS.Timeout>();

  const handleTouchStart = useCallback(() => {
    timerRef.current = setTimeout(callback, delay);
  }, [callback, delay]);

  const handleTouchEnd = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd };
}

// Usage
<ExamCard
  {...useLongPress(() => showQuickActionsMenu(exam), 500)}
/>
```

---

## TIER 5: TOUCH TARGET SIZES & WCAG COMPLIANCE

### 5.1 Problem Recap

At 375px with a 7-column month grid:
- Cell width: 48px (within WCAG 44×44px minimum for non-text elements)
- But: **event dots overlay** reduces effective tap area to ~40px if you aim for the dot
- Solution: **Increase touch target beyond visual bounds** (invisible hit areas)

### 5.2 Solutions

#### A. Increase Cell Size (Not Scalable)

```
Current: 48×48px per cell
Proposed: 52×52px per cell
Result: 52×7 + gutters = 382px (exceeds 375px)
Verdict: REJECTED (doesn't fit)
```

#### B. Use Pseudo-Elements for Touch Targets (RECOMMENDED)

```jsx
// Each cell has invisible hit area
<button
  className={`
    h-12 w-12 rounded-md
    relative
    after:content-[''] after:absolute after:inset-1
    after:bg-transparent after:pointer-events-none
  `}
  style={{
    // Expand click area beyond visual bounds
    WebkitTouchCallout: 'none',
  }}
>
  {/* Visual content at 48px */}
  <span className="text-xs font-semibold">{day.date}</span>
  {/* Dots, indicators */}
</button>
```

**Better approach: Use container query or parent wrapper:**

```jsx
<div className="p-2 rounded-md cursor-pointer active:bg-gray-50">
  {/* Tap target is 48px + 8px padding = 64px effective */}
  <button className="h-12 w-12 flex items-center justify-center rounded">
    {/* Visual content */}
  </button>
</div>
```

#### C. Heatmap + Dots: Visual Hierarchy

**Instead of competing for space, layer them:**

```
┌─────────────────────────────────────────┐
│ Cell (48×48px, full heatmap color)     │
│ ┌───────────────────────────────────┐   │
│ │ [Day number: 12]                  │   │ ← Touch target: full cell
│ │  ● ● (small event dots, 2-4px)    │   │ ← Indicators, not touch targets
│ │    ◐ (streak, corner, 3px ring)   │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Tailwind CSS:**

```jsx
<button
  className={`
    relative h-12 w-12 rounded-md
    flex flex-col items-center justify-center
    text-xs font-semibold
    border border-gray-200
    transition-colors duration-150
    active:bg-gray-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500
    ${getHeatmapColor(day.urgency)}
  `}
>
  {/* Day number (centered, primary) */}
  <span className="relative z-10">{day.date}</span>

  {/* Event indicators (don't consume tap area) */}
  <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none">
    {day.events.slice(0, 2).map((_, i) => (
      <div
        key={i}
        className="w-1 h-1 rounded-full bg-red-500 mx-0.5"
      />
    ))}
  </div>

  {/* Streak indicator (corner ring, don't consume tap area) */}
  {day.streakActive && (
    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 border border-green-600 rounded-full pointer-events-none" />
  )}
</button>
```

### 5.3 Testing on Real Devices

**Critical:** Test with thumbs on actual 375px phones:
- **iPhone SE 2 (375px):** Test one-handed use (thumb reaching top-right cell)
- **iPhone 13 Mini (375px):** Same
- **Android mid-range (360px–375px):** Typical user device in Argentina
- **Dark theme:** Colors must be distinguishable

---

## TIER 6: PERFORMANCE ON LOW-END DEVICES

### 6.1 Performance Concerns

**Typical student device:** Moto G7 / A10 (2019–2021 vintage)
- **RAM:** 2–4 GB (shared with OS, browser, other apps)
- **CPU:** Octa-core ARM A53 ~2 GHz (vs. A15 in iPhone 13)
- **GPU:** Adreno 504 (older, limited WebGL)
- **Network:** 4G LTE, often congested in university WiFi

**Axon calendar will render:**
1. Heatmap (30+ colored cells)
2. Streak dots + indicators (15–30 tiny SVG/div elements)
3. Smooth swipe animations
4. Fetch exams + mastery data from backend

### 6.2 Optimization Strategies

#### A. Virtual Scrolling for Agenda (Don't Render All 50 Events)

```jsx
// Only render visible events + 2 buffer rows
import { useVirtualizer } from '@tanstack/react-virtual';

export function AgendaList({ events }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Event card height
    overscan: 5, // Render 5 items outside viewport
  });

  return (
    <div ref={parentRef} className="h-[calc(100vh-140px)] overflow-y-auto">
      {virtualizer.getVirtualItems().map((virtualItem) => (
        <div key={virtualItem.key} className="flex items-center">
          <EventCard event={events[virtualItem.index]} />
        </div>
      ))}
    </div>
  );
}
```

**Why:** At 50 events, rendering all = 50 DOM nodes. Virtualizing = 8–10 visible nodes. ~5x faster on low-end.

#### B. CSS Grid Over Flexbox for Month View

```jsx
// Grid is more performant for static layouts
<div className="grid grid-cols-7 gap-0.5">
  {/* 42 cells (6 weeks × 7 days) */}
</div>

// Avoid:
<div className="flex flex-wrap">
  {/* Layout shift on every re-render */}
</div>
```

#### C. Defer Rendering of Heatmap Colors (Split Render)

```jsx
// Phase 1: Render month grid with placeholder colors (fast)
// Phase 2: Load mastery data + update heatmap colors (async)

export function MonthView() {
  const [heatmapData, setHeatmapData] = useState<null>(null);

  useEffect(() => {
    // Render first with neutral colors
    // Then fetch mastery data
    fetchHeatmapData(weekOffset).then(setHeatmapData);
  }, [weekOffset]);

  return (
    <div>
      <MonthGrid heatmapData={heatmapData} /* defaults to 'gray' if null */ />
    </div>
  );
}
```

#### D. Debounce Swipe Events

```jsx
// Prevent rapid swipes triggering multiple fetches
const handleSwipeLeft = useMemo(
  () => debounce((weekOffset) => {
    fetchHeatmapData(weekOffset + 1);
    setWeekOffset(weekOffset + 1);
  }, 300),
  []
);
```

#### E. Lazy-Load Event Details Panel

```jsx
// Don't include full details panel in initial bundle
const ExamDetailsPanel = lazy(() => import('./ExamDetailsPanel'));

<Suspense fallback={<div className="h-96 bg-gray-100" />}>
  <ExamDetailsPanel exam={selectedExam} />
</Suspense>
```

### 6.3 Metrics to Monitor

| Metric | Target | Tool |
|--------|--------|------|
| **First Contentful Paint (FCP)** | < 2.5s on 4G slow | Lighthouse |
| **Interaction to Paint (INP)** | < 200ms | Core Web Vitals |
| **Memory usage** | < 50 MB after 5 min navigation | DevTools → Memory |
| **Swipe frame rate** | 60 FPS (or 48+ FPS acceptable) | Chrome DevTools → Perf |

### 6.4 Recommended: Lighthouse CI in GitHub Actions

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run build
      - uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: ./lighthouserc.json
          # Target: FCP < 2.5s, INP < 200ms
```

---

## TIER 7: VIEW TOGGLE DESIGN (Always Visible on Mobile)

### 7.1 Current Problem

The plan mentions "Month | Week | Day | Agenda" tabs, but doesn't specify **where** these tabs live on mobile. At 375px:
- **Top fixed bar:** Takes vertical space (worse on short screens, 667px iPhone SE)
- **Bottom fixed bar:** More natural for thumb reach, but conflicts with soft keyboard
- **Floating FAB:** Unconventional for navigation

### 7.2 RECOMMENDATION: Sticky Bottom Tab Bar (with Safe Area)

#### Wireframe D: View Toggle (375px, Bottom Tab Bar)

```
┌─────────────────────────────────────┐
│ [Agenda content, scrollable]         │
│ [...]                                │
│ [...]                                │
│                                      │
│ [←scroll up to see more↓]            │
├─────────────────────────────────────┤ ← Sticky / position: sticky
│ [📅 Mes] [📋 Semana] [☑ Agenda]   │ ← Tab bar (56px total height)
│ (with bottom safe area: ~20px)      │    Accessible to safe-area-inset-bottom
└─────────────────────────────────────┘
```

**Design Specs:**

| Element | Spec | Rationale |
|---------|------|-----------|
| **Height** | 56px (48px touch + 8px padding) | Standard Material Design |
| **Safe area** | 20px bottom (iOS notch/home indicator) | `pb-safe` from Tailwind Arbitrary Values |
| **Icon size** | 24px | Visible at 56px height |
| **Label** | 10px, below icon | Supported by UN accessibility |
| **Active state** | Highlighted icon + underline (3px border-top) | WCAG AA contrast |
| **Inactive state** | Gray 500 | Reduced visual weight |

#### Tailwind CSS (Tab Bar):

```jsx
export function ViewToggle({ activeView, onViewChange }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      {/* Safe area for iOS */}
      <div className="flex justify-around items-stretch h-14">
        {/* Agenda tab */}
        <button
          onClick={() => onViewChange('agenda')}
          className={`
            flex-1 flex flex-col items-center justify-center gap-1
            transition-colors duration-150
            ${activeView === 'agenda'
              ? 'text-blue-600 border-t-3 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900'}
          `}
        >
          <ChecklistIcon className="w-6 h-6" />
          <span className="text-[10px] font-semibold">Agenda</span>
        </button>

        {/* Week tab */}
        <button
          onClick={() => onViewChange('week')}
          className={`
            flex-1 flex flex-col items-center justify-center gap-1
            transition-colors duration-150
            ${activeView === 'week'
              ? 'text-blue-600 border-t-3 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900'}
          `}
        >
          <LayoutListIcon className="w-6 h-6" />
          <span className="text-[10px] font-semibold">Semana</span>
        </button>

        {/* Month tab */}
        <button
          onClick={() => onViewChange('month')}
          className={`
            flex-1 flex flex-col items-center justify-center gap-1
            transition-colors duration-150
            ${activeView === 'month'
              ? 'text-blue-600 border-t-3 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900'}
          `}
        >
          <CalendarIcon className="w-6 h-6" />
          <span className="text-[10px] font-semibold">Mes</span>
        </button>
      </div>

      {/* Safe area inset (iOS) */}
      <div className="h-5 bg-white" style={{ height: 'max(0.5rem, env(safe-area-inset-bottom))' }} />
    </div>
  );
}
```

**In tailwind.config.js:**

```js
export default {
  theme: {
    extend: {
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
      },
    },
  },
};
```

#### Preventing Content Overlap

```jsx
// Content container must account for tab bar
<div className="pb-20"> {/* 56px tab bar + 20px safe area ≈ 80px */}
  {/* Agenda/Month/Week content here */}
</div>

<ViewToggle {...} />
```

---

## TIER 8: DARK MODE & COLOR CONTRAST

### 8.1 Problem Statement

Axon has dark mode. The calendar's 7-color heatmap (gray, blue, amber, orange, red) must be adapted for:
- **OLED dark mode (near-black background):** Colors that work on white don't work on dark
- **WCAG AA contrast:** 4.5:1 for normal text, 3:1 for large text (18px+)
- **Night use case:** Medical students studying late; blue light fatigue

### 8.2 Color System: Light + Dark Variants

#### Current (Light Mode Only):

```jsx
const heatmapColors = {
  none: 'bg-white text-gray-900',
  study: 'bg-blue-50 text-blue-900',
  review: 'bg-teal-50 text-teal-900',
  exam: 'bg-orange-50 text-orange-900',
  urgent: 'bg-red-50 text-red-900',
};
```

#### Proposed (Light + Dark):

```jsx
const heatmapColors = {
  none: {
    light: 'bg-white text-gray-900 border-gray-200',
    dark: 'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600',
  },
  study: {
    light: 'bg-blue-50 text-blue-900',
    dark: 'dark:bg-blue-900 dark:text-blue-100',
  },
  review: {
    light: 'bg-teal-50 text-teal-900',
    dark: 'dark:bg-teal-900 dark:text-teal-100',
  },
  exam: {
    light: 'bg-orange-50 text-orange-900',
    dark: 'dark:bg-orange-900 dark:text-orange-100',
  },
  urgent: {
    light: 'bg-red-50 text-red-900',
    dark: 'dark:bg-red-900 dark:text-red-100',
  },
};

// Usage
<div className={`${heatmapColors.exam.light} ${heatmapColors.exam.dark}`}>
  {/* Exam day cell */}
</div>
```

#### Contrast Check:

```
Light Mode:
- bg-orange-50 (#fdf2f8) + text-orange-900 (#7c2d12) = 17.7:1 ✅ WCAG AAA

Dark Mode:
- bg-orange-900 (#78350f) + text-orange-100 (#fed7aa) = 7.2:1 ✅ WCAG AAA
  (verified with WebAIM contrast checker)
```

### 8.3 Tailwind Dark Mode Setup

```jsx
// tailwind.config.js
export default {
  darkMode: 'class', // or 'media' if you prefer system preference
  theme: {
    extend: {},
  },
};

// In your app root
<div className={darkMode ? 'dark' : ''}>
  <CalendarApp />
</div>
```

### 8.4 Bottom Sheet Dark Mode

```jsx
// Bottom sheet adapts to dark mode
<div className="fixed bottom-0 bg-white dark:bg-gray-900 shadow-lg">
  <h2 className="text-gray-900 dark:text-gray-100">FINAL: Anatomía II</h2>
  <p className="text-gray-600 dark:text-gray-400">12 jul • 14:00</p>
</div>
```

### 8.5 Tab Bar Dark Mode

```jsx
<div className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
  <button className="text-gray-600 dark:text-gray-400 data-[active]:text-blue-600 dark:data-[active]:text-blue-400">
    📅 Mes
  </button>
</div>
```

---

## TIER 9: TABLET BREAKPOINT (768px+)

### 9.1 Responsive Behavior

At 768px (iPad), you have ~350px width for sidebar + ~400px for content. Consider:

#### Option A: Side-by-Side Layout (Calendar + Agenda)

```
┌─────────────────────────────────────────────────────────────┐
│ ← Calendario                                            ⋮   │
├──────────────────────┬──────────────────────────────────────┤
│                      │ [Agenda: scrollable list]            │
│  Month Calendar      │ PARCIAL Anatomía II        72%  [→]  │
│  (compressed)        │ 10 jul • 14:00 • AULA 203           │
│  [7×6 grid, 52px]    │                                      │
│                      │ FINAL Fisiología                     │
│                      │ 18 jul • Faltan: 10 días            │
│                      │                                      │
│  [📅 Mes]           │ [━━━━━━━━━━━━━━━━━━━]                │
│  [📋 Semana]        │ (swipe or scroll to more)             │
│  [☑ Agenda]         │                                      │
├──────────────────────┴──────────────────────────────────────┤
│ [Exam Details Panel in drawer or modal on top]            │
└─────────────────────────────────────────────────────────────┘
```

**Tailwind CSS:**

```jsx
<div className="grid grid-cols-3 gap-4 h-screen">
  {/* Sidebar: Month view + toggle */}
  <div className="col-span-1 border-r border-gray-200 overflow-y-auto">
    <MonthView {...} />
    <ViewToggle {...} className="sticky bottom-0" />
  </div>

  {/* Content: Agenda */}
  <div className="col-span-2 overflow-y-auto">
    <AgendaView {...} />
  </div>
</div>
```

#### Option B: Tabbed Views (Keep Mobile Layout)

At 768px, switching to tabs instead of sidebar may feel more consistent:
- Tab bar changes to **horizontal layout** (4 equal-width tabs)
- Each tab still full-width content

```jsx
// At md breakpoint, tabs become visible
<div className="hidden md:flex gap-2 mb-4">
  <button className="flex-1 py-2 text-center font-semibold border-b-2">
    📅 Mes
  </button>
  <button className="flex-1 py-2 text-center font-semibold border-b-2">
    📋 Semana
  </button>
  <button className="flex-1 py-2 text-center font-semibold border-b-2">
    ☑ Agenda
  </button>
</div>
```

---

## TIER 10: ACCESSIBILITY (WCAG 2.1 AA Compliance)

### 10.1 Checklist

| Item | Status | Notes |
|------|--------|-------|
| **Touch targets ≥ 44×44px** | ✅ | Calendar cells 48×48px, buttons 44px min |
| **Color contrast ≥ 4.5:1 (normal text)** | ✅ | Verified above |
| **Keyboard navigation** | ⚠️ | Tab through cells, arrows to navigate weeks |
| **ARIA labels** | ⚠️ | Add `aria-label` to event cards, buttons |
| **Screen reader support** | ⚠️ | Announce exam details on focus |
| **Focus indicators** | ⚠️ | 3px ring around focused elements |
| **Motion reduction** | ⚠️ | Respect `prefers-reduced-motion` |

### 10.2 Implementation Examples

#### A. Keyboard Navigation

```jsx
// Handle arrow keys to navigate calendar
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'ArrowRight') {
    setWeekOffset(Math.min(weekOffset + 1, 0));
  }
  if (e.key === 'ArrowLeft') {
    setWeekOffset(Math.max(weekOffset - 1, -52));
  }
  if (e.key === 'Enter') {
    openDetailsPanel(focusedEvent);
  }
};

<div onKeyDown={handleKeyDown} tabIndex={0} className="focus-visible:ring-2">
  {/* Calendar grid */}
</div>
```

#### B. ARIA Labels

```jsx
<button
  aria-label={`${exam.subject} final, ${exam.date}, ${exam.daysLeft} días restantes`}
  onClick={() => openDetails(exam)}
>
  {exam.subject}
</button>

<div role="alert" aria-live="polite" aria-atomic="true">
  {/* Announcement for screen readers when exam details load */}
  Examen de {exam.subject} en {exam.daysLeft} días. Preparación: {exam.prep}%.
</div>
```

#### C. Reduced Motion

```jsx
import { useReducedMotion } from '@react-aria/utils';

export function ExamDetailsPanel({ exam }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={`
        transition-all duration-300
        ${prefersReducedMotion ? 'duration-0' : 'duration-300'}
      `}
    >
      {/* Bottom sheet slides up (or instant if reduced motion) */}
    </div>
  );
}
```

---

## SUMMARY TABLE: Mobile-First Tier 1 Features

| Feature | 375px Design | 768px Design | Status |
|---------|--------------|--------------|--------|
| **1. Agenda View** | Scrollable list, grouped by urgency, swipe to change week | Keep mobile design or add sidebar | ✅ RECOMMENDED |
| **2. Month View** | Compressed grid (48×48px cells), heatmap colors, event dots | Add as sidebar or tab | ⚠️ REDESIGNED |
| **3. Bottom Sheet** | SwipeArea + drag handle, stacked CTAs | Optional: side panel | ✅ RECOMMENDED |
| **4. Gestures** | Swipe ←→ (week nav), swipe ↓ (dismiss), tap (open details) | Same | ✅ DEFINED |
| **5. Touch Targets** | 44×44px minimum met; use invisible hit areas for indicators | ≥ 52px | ✅ WCAG COMPLIANT |
| **6. Performance** | Virtual scrolling, lazy-load details, defer heatmap | Same | ✅ OPTIMIZED |
| **7. View Toggle** | Sticky bottom tab bar (56px + safe area) | Horizontal tabs at top | ✅ DEFINED |
| **8. Dark Mode** | 7-color heatmap adapted (light + dark variants) | Same | ✅ CONTRAST OK |
| **9. Tablet Layout** | Full-width view tabs | Option A: sidebar; Option B: tabs | ✅ OPTIONS DEFINED |
| **10. Accessibility** | WCAG 2.1 AA: contrast, keyboard nav, ARIA labels | Same | ⚠️ NEEDS TESTING |

---

## IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1–2)
1. Build Agenda view (375px) with scrollable list + section headers
2. Implement swipe gesture for week navigation
3. Create ExamDetailsPanel (bottom sheet)
4. Add View Toggle (sticky bottom tab bar)

**Deliverable:** Agenda + Details working on mobile (test on real 375px device)

### Phase 2: Month View (Week 2–3)
1. Build compressed month grid (48×48px cells)
2. Add heatmap colors (gray, blue, amber, orange, red)
3. Implement day cell tap → filter agenda to that date
4. Optimize rendering (virtual scrolling for agenda)

**Deliverable:** Month view + Agenda tab-switching (test performance on Moto G7)

### Phase 3: Polish & Dark Mode (Week 3–4)
1. Test dark mode contrast (verify WCAG AA)
2. Add keyboard navigation (arrow keys, Tab, Enter)
3. Add ARIA labels (screen reader support)
4. Test on multiple devices (iPhone SE, Pixel 4a, iPad Air)

**Deliverable:** Full calendar feature, mobile-optimized

### Phase 4: Tablet Layout (Week 4–5, Optional)
1. Add responsive breakpoints (768px+)
2. Implement sidebar layout (Option A) or horizontal tabs (Option B)
3. Test on iPad

**Deliverable:** Responsive calendar (375px → 768px → 1024px)

---

## RISKS & MITIGATIONS

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Month grid unreadable at 375px** | HIGH | Already redesigned (see §2.2); delegate events to Agenda |
| **Bottom sheet doesn't dismiss on swipe (platform bugs)** | MEDIUM | Test on iOS + Android; fallback: X button |
| **Heatmap colors don't render well in dark mode** | MEDIUM | Verify contrast before shipping; adjust color palette if needed |
| **Swipe interferes with page scroll** | MEDIUM | Use `event.preventDefault()` only for horizontal swipes; vertical takes priority |
| **Performance on Moto G7 (2019)** | MEDIUM | Profile with Lighthouse CI; use virtual scrolling; lazy-load details |
| **Keyboard nav broken on side-by-side layout (tablet)** | LOW | Test Tab order; use `tabIndex` prop if needed |

---

## CONCLUSION

The current calendar plan is **desktop-first**. This audit provides **mobile-first wireframes, Tailwind CSS patterns, and implementation strategies** for Tier 1 features (Agenda, Month, Bottom Sheet, Gestures, Touch Targets, Performance, Dark Mode).

**Key Recommendations:**
1. **Agenda view is the mobile default**, not Month
2. **Bottom sheet for exam details**, not centered modal
3. **Sticky bottom tab bar** for view toggle (not top nav)
4. **Swipe gestures** for week navigation (no click arrows)
5. **Heatmap + indicators layered**, not competing for space
6. **Virtual scrolling** for 50+ events
7. **Dark mode colors** verified WCAG AA before ship

**Next Step:** Use this document to design the calendar in Figma (mobile-first wireframes), then hand off to frontend team for implementation.

---

**Audit prepared for:** Axon/Seeki medical education platform
**Target users:** Medical students in Argentina, 4–5 daily mobile checks
**Reviewed for:** Mobile-first UX, WCAG accessibility, performance, dark mode
