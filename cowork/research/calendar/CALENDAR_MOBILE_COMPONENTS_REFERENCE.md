# Axon Calendar: Mobile Components Reference

**Quick reference for frontend team implementing calendar features**
**Document version:** 2026-03-27
**Breakpoints:** 375px (mobile), 768px (tablet), 1024px (desktop)

---

## TABLE OF CONTENTS

1. [Agenda View Component](#agenda-view)
2. [Month View Component](#month-view)
3. [Bottom Sheet Panel](#bottom-sheet-panel)
4. [View Toggle Tab Bar](#view-toggle)
5. [Utility Hooks (Swipe, Dark Mode)](#utility-hooks)
6. [Color System](#color-system)
7. [Safe Area & Responsive Patterns](#safe-area)

---

## AGENDA VIEW

### AgendaView.tsx (Main Container)

```tsx
import { useState, useRef, useCallback } from 'react';
import { useSwipe } from '@/hooks/useSwipe';
import AgendaHeader from './AgendaHeader';
import AgendaSection from './AgendaSection';
import ExamDetailsPanel from './ExamDetailsPanel';

interface AgendaEvent {
  id: string;
  type: 'exam' | 'study' | 'quiz' | 'review';
  subject: string;
  date: Date;
  daysLeft: number;
  prepPercentage: number;
  time?: string;
  location?: string;
  weakTopics: Topic[];
}

export default function AgendaView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Swipe gesture to navigate weeks
  const swipe = useSwipe({
    onSwipeLeft: () => {
      if (weekOffset < 0) setWeekOffset(weekOffset + 1);
    },
    onSwipeRight: () => {
      if (weekOffset > -52) setWeekOffset(weekOffset - 1);
    },
    threshold: 50,
  });

  const groupedEvents = groupEventsByUrgency(fetchEvents(weekOffset));

  return (
    <div
      ref={containerRef}
      {...swipe}
      className="flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden"
    >
      {/* Header: Title + nav */}
      <AgendaHeader
        weekOffset={weekOffset}
        onPrevWeek={() => setWeekOffset(Math.max(weekOffset - 1, -52))}
        onNextWeek={() => setWeekOffset(Math.min(weekOffset + 1, 0))}
      />

      {/* Gesture hint (show on first load) */}
      {weekOffset === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900 border-b border-blue-200 dark:border-blue-700 px-4 py-3">
          <p className="text-xs text-blue-700 dark:text-blue-200">
            💡 Desliza el dedo para cambiar de semana
          </p>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {groupedEvents.map((group) => (
          <AgendaSection
            key={group.section}
            section={group.section}
            events={group.events}
            onEventClick={setSelectedEvent}
          />
        ))}

        {groupedEvents.length === 0 && (
          <div className="flex items-center justify-center h-48">
            <p className="text-gray-500 dark:text-gray-400 text-center">
              No hay exámenes programados esta semana
            </p>
          </div>
        )}
      </div>

      {/* Details panel (bottom sheet) */}
      {selectedEvent && (
        <ExamDetailsPanel
          exam={selectedEvent}
          isOpen={true}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}

// Helper: Group events by section (TODAY, THIS WEEK, NEXT 2 WEEKS)
function groupEventsByUrgency(events: AgendaEvent[]): GroupedEvents[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const groups = {
    today: { section: 'HOY', events: [] as AgendaEvent[] },
    thisWeek: { section: 'ESTA SEMANA', events: [] as AgendaEvent[] },
    next2Weeks: { section: 'PROXIMAS 2 SEMANAS', events: [] as AgendaEvent[] },
  };

  events.forEach((event) => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    const daysFromNow = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 86400));

    if (daysFromNow === 0) groups.today.events.push(event);
    else if (daysFromNow <= 7) groups.thisWeek.events.push(event);
    else if (daysFromNow <= 14) groups.next2Weeks.events.push(event);
  });

  return [groups.today, groups.thisWeek, groups.next2Weeks].filter(
    (g) => g.events.length > 0
  );
}
```

### AgendaSection.tsx (Section with Sticky Header)

```tsx
interface AgendaSectionProps {
  section: string;
  events: AgendaEvent[];
  onEventClick: (event: AgendaEvent) => void;
}

export default function AgendaSection({
  section,
  events,
  onEventClick,
}: AgendaSectionProps) {
  return (
    <div>
      {/* Sticky section header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 py-3 px-4 border-b border-gray-100 dark:border-gray-800">
        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          {section}
        </p>
      </div>

      {/* Event cards */}
      <div className="space-y-3 px-4 py-4">
        {events.map((event) => (
          <AgendaEventCard
            key={event.id}
            event={event}
            onClick={() => onEventClick(event)}
          />
        ))}
      </div>
    </div>
  );
}
```

### AgendaEventCard.tsx (Individual Event Card)

```tsx
interface AgendaEventCardProps {
  event: AgendaEvent;
  onClick: () => void;
}

export default function AgendaEventCard({ event, onClick }: AgendaEventCardProps) {
  const urgencyColor = getUrgencyColor(event.daysLeft);
  const eventIcon = getEventIcon(event.type);

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-lg border transition-all
        active:scale-95 active:bg-gray-50 dark:active:bg-gray-800
        focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500
        ${urgencyColor.bg}
      `}
    >
      {/* Header: Type + Subject + Urgency Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 flex items-start gap-2">
          <span className="text-lg flex-shrink-0">{eventIcon}</span>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {event.subject}
          </p>
        </div>

        {/* Red dot for urgent exams */}
        {event.daysLeft < 3 && (
          <div
            className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 mt-1"
            title="Acción urgente"
          />
        )}
      </div>

      {/* Metadata: Date + Time + Location */}
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 ml-8">
        {formatDate(event.date)}
        {event.time && ` • ${event.time}`}
        {event.location && ` • ${event.location}`}
      </p>

      {/* Progress bar + Days left */}
      <div className="flex items-center justify-between ml-8">
        <p className={`text-xs font-medium ${urgencyColor.text}`}>
          Faltan: {event.daysLeft} día{event.daysLeft !== 1 ? 's' : ''}
        </p>
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {event.prepPercentage}%
        </p>
      </div>
    </button>
  );
}

function getUrgencyColor(daysLeft: number) {
  if (daysLeft < 3)
    return { bg: 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700', text: 'text-red-700 dark:text-red-200' };
  if (daysLeft < 7)
    return { bg: 'bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-200' };
  if (daysLeft < 14)
    return { bg: 'bg-amber-50 dark:bg-amber-900 border-amber-200 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-200' };
  if (daysLeft < 30)
    return { bg: 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-200' };
  return { bg: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700', text: 'text-gray-700 dark:text-gray-300' };
}

function getEventIcon(type: string) {
  const icons = {
    exam: '🎓',
    study: '📚',
    quiz: '📝',
    review: '🔄',
  };
  return icons[type as keyof typeof icons] || '📌';
}
```

---

## MONTH VIEW

### MonthView.tsx (Compressed Grid)

```tsx
import { useCallback, useMemo } from 'react';

interface MonthDay {
  date: number;
  isCurrentMonth: boolean;
  urgency: 'none' | 'study' | 'review' | 'exam' | 'urgent';
  eventCount: number;
  streakActive: boolean;
}

export default function MonthView() {
  const [selectedDate, setSelectedDate] = useCallback(() => {
    // Trigger agenda filter to this date
  }, []);

  const days = useMemo(() => generateMonthDays(), []);

  return (
    <div className="px-4 py-4">
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          {/* Left arrow */}
          &lt;
        </button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Julio 2026
        </h2>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          {/* Right arrow */}
          &gt;
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-0.5 mb-2">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label) => (
          <div key={label} className="h-6 flex items-center justify-center">
            <span className="text-[8px] font-bold text-gray-600 dark:text-gray-400 uppercase">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, idx) => (
          <MonthDayCell
            key={idx}
            day={day}
            onClick={() => setSelectedDate(day.date)}
          />
        ))}
      </div>
    </div>
  );
}

function generateMonthDays(): MonthDay[] {
  // Generate 42 days (6 weeks × 7 days)
  // Include leading/trailing days from previous/next month (grayed out)
  // For each day: determine urgency based on heatmap data + fetch from backend
  return [];
}
```

### MonthDayCell.tsx (Individual Day Cell)

```tsx
interface MonthDayCellProps {
  day: MonthDay;
  onClick: () => void;
}

export default function MonthDayCell({ day, onClick }: MonthDayCellProps) {
  return (
    <button
      onClick={onClick}
      aria-label={`${day.date} de Julio, ${getDayUrgencyLabel(day.urgency)}, ${day.eventCount} eventos`}
      className={`
        h-12 w-12 rounded-md flex flex-col items-center justify-center
        text-sm font-semibold transition-colors duration-150
        relative
        focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500
        ${
          day.isCurrentMonth
            ? `border border-gray-200 dark:border-gray-700 hover:border-gray-300 active:bg-gray-100 dark:active:bg-gray-700`
            : `text-gray-300 dark:text-gray-600`
        }
        ${getHeatmapColor(day.urgency)}
      `}
    >
      {/* Day number */}
      <span className="relative z-10 text-gray-900 dark:text-gray-100">
        {day.date}
      </span>

      {/* Event indicator dots (max 2 visible) */}
      {day.eventCount > 0 && (
        <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none">
          {Array.from({ length: Math.min(day.eventCount, 2) }).map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-red-500 mx-0.5" />
          ))}
        </div>
      )}

      {/* Streak indicator (corner ring) */}
      {day.streakActive && (
        <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 border border-green-600 dark:border-green-400 rounded-full pointer-events-none" />
      )}
    </button>
  );
}

function getHeatmapColor(urgency: string) {
  const colors = {
    none: 'bg-white dark:bg-gray-800',
    study: 'bg-blue-50 dark:bg-blue-900',
    review: 'bg-teal-50 dark:bg-teal-900',
    exam: 'bg-orange-50 dark:bg-orange-900',
    urgent: 'bg-red-50 dark:bg-red-900',
  };
  return colors[urgency as keyof typeof colors] || colors.none;
}

function getDayUrgencyLabel(urgency: string) {
  const labels = {
    none: 'Sin eventos',
    study: 'Sesión de estudio',
    review: 'Repaso programado',
    exam: 'Examen',
    urgent: 'Examen urgente',
  };
  return labels[urgency as keyof typeof labels];
}
```

---

## BOTTOM SHEET PANEL

### ExamDetailsPanel.tsx (Bottom Sheet)

```tsx
import { useRef, useState, useCallback } from 'react';

interface ExamDetailsPanelProps {
  exam: AgendaEvent;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExamDetailsPanel({
  exam,
  isOpen,
  onClose,
}: ExamDetailsPanelProps) {
  const [dragStart, setDragStart] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.TouchEvent) => {
    setDragStart(e.touches[0].clientY);
  }, []);

  const handleDragEnd = useCallback(
    (e: React.TouchEvent) => {
      const dragEnd = e.changedTouches[0].clientY;
      // Swipe down > 100px = dismiss
      if (dragEnd - dragStart > 100) {
        onClose();
      }
    },
    [dragStart, onClose]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
        className="
          fixed bottom-0 left-0 right-0 z-50
          bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl
          max-h-[90vh] overflow-y-auto
          transition-all duration-300 ease-out
          pb-safe
        "
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-12 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Sticky header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 pt-2 pb-4 px-4 border-b border-gray-100 dark:border-gray-800 -mx-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {exam.type.toUpperCase()}: {exam.subject}
          </h2>
        </div>

        {/* Content */}
        <div className="px-4 py-6 space-y-6">
          {/* Key info rows */}
          <InfoRow icon="📅" label="Fecha" value={formatDate(exam.date)} />
          {exam.location && (
            <InfoRow icon="📍" label="Lugar" value={exam.location} />
          )}
          {exam.time && (
            <InfoRow icon="🕐" label="Hora" value={exam.time} />
          )}
          <InfoRow
            icon="⏱"
            label="Faltan"
            value={`${exam.daysLeft} día${exam.daysLeft !== 1 ? 's' : ''}`}
          />

          {/* Progress bar */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Preparación estimada
            </label>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2.5 transition-all duration-300"
                style={{ width: `${exam.prepPercentage}%` }}
              />
            </div>
            <div className="flex justify-between">
              <p className="text-xs text-gray-600 dark:text-gray-400">0%</p>
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {exam.prepPercentage}%
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">100%</p>
            </div>
          </div>

          {/* Weak topics */}
          {exam.weakTopics.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Temas débiles (repasa estos):
              </p>
              {exam.weakTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${getMasteryColor(topic.mastery)}`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {topic.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {topic.mastery}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA Buttons (stacked on mobile) */}
          <div className="space-y-2 pt-4">
            <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition">
              Iniciar repaso express
            </button>
            <button className="w-full py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 text-gray-900 dark:text-gray-100 font-semibold rounded-lg transition">
              Ver plan completo
            </button>
            <button className="w-full py-3 bg-orange-100 dark:bg-orange-900 hover:bg-orange-200 dark:hover:bg-orange-800 active:bg-orange-300 text-orange-700 dark:text-orange-200 font-semibold rounded-lg transition">
              Activar modo intensivo
            </button>
          </div>

          {/* Close hint */}
          <div className="flex items-center justify-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Desliza hacia abajo para cerrar
            </p>
          </div>
        </div>

        {/* Safe area spacing (iOS) */}
        <div style={{ height: 'max(1rem, env(safe-area-inset-bottom))' }} />
      </div>
    </>
  );
}

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xl flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">
          {label}
        </p>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {value}
        </p>
      </div>
    </div>
  );
}

function getMasteryColor(mastery: number) {
  if (mastery < 50) return 'bg-red-500';
  if (mastery < 75) return 'bg-amber-500';
  if (mastery < 95) return 'bg-yellow-500';
  return 'bg-green-500';
}
```

---

## VIEW TOGGLE

### ViewToggle.tsx (Sticky Bottom Tab Bar)

```tsx
import { ReactNode } from 'react';

type ViewType = 'agenda' | 'week' | 'month';

interface ViewToggleProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export default function ViewToggle({
  activeView,
  onViewChange,
}: ViewToggleProps) {
  const tabs: { id: ViewType; label: string; icon: ReactNode }[] = [
    { id: 'agenda', label: 'Agenda', icon: '☑' },
    { id: 'week', label: 'Semana', icon: '📋' },
    { id: 'month', label: 'Mes', icon: '📅' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40">
      <div className="flex justify-around items-stretch h-14 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            aria-label={tab.label}
            aria-selected={activeView === tab.id}
            className={`
              flex-1 flex flex-col items-center justify-center gap-1
              transition-colors duration-200
              focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500
              ${
                activeView === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-t-3 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* iOS safe area (home indicator) */}
      <div
        className="bg-white dark:bg-gray-800"
        style={{ height: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      />
    </div>
  );
}
```

### Layout Wrapper (Accounts for Tab Bar)

```tsx
// In your main calendar page layout
export default function CalendarPage() {
  const [view, setView] = useState<'agenda' | 'week' | 'month'>('agenda');

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Calendario
        </h1>
      </header>

      {/* Content (accounts for 80px bottom tab bar) */}
      <main className="flex-1 overflow-hidden pb-20">
        {view === 'agenda' && <AgendaView />}
        {view === 'week' && <WeekView />}
        {view === 'month' && <MonthView />}
      </main>

      {/* Tab bar */}
      <ViewToggle activeView={view} onViewChange={setView} />
    </div>
  );
}
```

---

## UTILITY HOOKS

### useSwipe.ts (Gesture Detection)

```ts
import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useSwipe(handlers: SwipeHandlers) {
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeDown,
    threshold = 50,
  } = handlers;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const deltaX = startXRef.current - endX;
      const deltaY = endY - startYRef.current;

      // Prioritize vertical swipes
      if (Math.abs(deltaY) > threshold && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY > threshold && onSwipeDown) {
          onSwipeDown();
        }
      }

      // Horizontal swipes
      if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > threshold && onSwipeLeft) {
          onSwipeLeft();
        }
        if (deltaX < -threshold && onSwipeRight) {
          onSwipeRight();
        }
      }
    },
    [onSwipeLeft, onSwipeRight, onSwipeDown, threshold]
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}
```

### useLongPress.ts (Advanced Interactions, v2+)

```ts
import { useRef, useCallback } from 'react';

export function useLongPress(
  callback: () => void,
  delay: number = 500
) {
  const timerRef = useRef<NodeJS.Timeout>();

  const handleTouchStart = useCallback(() => {
    timerRef.current = setTimeout(callback, delay);
  }, [callback, delay]);

  const handleTouchEnd = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}
```

### useDarkMode.ts (Dark Mode Toggle)

```ts
import { useEffect, useState } from 'react';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) return stored === 'true';

    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', String(isDark));

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return {
    isDark,
    toggle: () => setIsDark(!isDark),
  };
}

// Usage in app root
export default function App() {
  const { isDark, toggle } = useDarkMode();

  return (
    <div className={isDark ? 'dark' : ''}>
      <button onClick={toggle}>Toggle dark mode</button>
      {/* App content */}
    </div>
  );
}
```

---

## COLOR SYSTEM

### Color Tokens (Heatmap + Urgency)

```ts
// colors.ts
export const HEATMAP_COLORS = {
  none: {
    light: 'bg-white text-gray-900 border-gray-200',
    dark: 'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700',
  },
  study: {
    light: 'bg-blue-50 text-blue-900 border-blue-200',
    dark: 'dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700',
  },
  review: {
    light: 'bg-teal-50 text-teal-900 border-teal-200',
    dark: 'dark:bg-teal-900 dark:text-teal-100 dark:border-teal-700',
  },
  exam: {
    light: 'bg-orange-50 text-orange-900 border-orange-200',
    dark: 'dark:bg-orange-900 dark:text-orange-100 dark:border-orange-700',
  },
  urgent: {
    light: 'bg-red-50 text-red-900 border-red-200',
    dark: 'dark:bg-red-900 dark:text-red-100 dark:border-red-700',
  },
};

export const URGENCY_COLORS = {
  'more-than-30': {
    light: 'bg-gray-100 text-gray-700',
    dark: 'dark:bg-gray-700 dark:text-gray-300',
  },
  '15-30': {
    light: 'bg-blue-100 text-blue-700',
    dark: 'dark:bg-blue-800 dark:text-blue-200',
  },
  '7-14': {
    light: 'bg-amber-100 text-amber-700',
    dark: 'dark:bg-amber-800 dark:text-amber-200',
  },
  '3-7': {
    light: 'bg-orange-100 text-orange-700',
    dark: 'dark:bg-orange-800 dark:text-orange-200',
  },
  'less-than-3': {
    light: 'bg-red-100 text-red-700',
    dark: 'dark:bg-red-800 dark:text-red-200',
  },
};

// Helper: Get color by days left
export function getUrgencyColor(daysLeft: number) {
  if (daysLeft < 3) return URGENCY_COLORS['less-than-3'];
  if (daysLeft < 7) return URGENCY_COLORS['3-7'];
  if (daysLeft < 14) return URGENCY_COLORS['7-14'];
  if (daysLeft < 30) return URGENCY_COLORS['15-30'];
  return URGENCY_COLORS['more-than-30'];
}

// Helper: Apply both light + dark classes
export function applyColorClasses(urgency: string, dark?: boolean) {
  const color = HEATMAP_COLORS[urgency as keyof typeof HEATMAP_COLORS];
  if (!color) return '';

  const base = color.light;
  const darkClasses = color.dark;

  return `${base} ${darkClasses}`;
}
```

---

## SAFE AREA & RESPONSIVE PATTERNS

### tailwind.config.js Extension

```js
export default {
  theme: {
    extend: {
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
      },
      backdropBlur: {
        sm: '4px',
      },
    },
  },
  darkMode: 'class',
};
```

### Responsive Breakpoints (Calendar-specific)

```jsx
// 375px (mobile)
<div className="px-4 py-3">
  {/* Single column layouts */}
  <AgendaView />
</div>

// 768px (tablet)
<div className="md:grid md:grid-cols-3 md:gap-4">
  <div className="md:col-span-1">
    <MonthView />
  </div>
  <div className="md:col-span-2">
    <AgendaView />
  </div>
</div>

// 1024px (desktop)
<div className="lg:grid lg:grid-cols-4 lg:gap-6">
  {/* Even more spacious */}
</div>
```

### Safe Area Inset Pattern

```jsx
// For components that extend to edges (bottom sheet, tab bar)
<div className="pb-safe">
  {/* Content */}
</div>

// Or use env variable directly
<style>{`
  .my-component {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
`}</style>
```

---

## TESTING CHECKLIST

- [ ] AgendaView scrolls smoothly on Moto G7
- [ ] Swipe gestures work on iOS + Android (test 50px + 100px swipes)
- [ ] Bottom sheet dismisses on 100px+ down swipe
- [ ] Dark mode colors pass WCAG AA contrast (4.5:1)
- [ ] Touch targets >= 44×44px (test with thumb on real device)
- [ ] View toggle tab bar doesn't overlap content
- [ ] Month grid renders all 42 cells (6 weeks)
- [ ] Performance: FCP < 2.5s on slow 4G
- [ ] Keyboard navigation: Tab through events, arrows navigate week
- [ ] Screen reader announces exam details on focus
- [ ] Safe area respected on iPhone with notch/home indicator

---

**Last updated:** 2026-03-27
**For questions:** Refer to AUDIT_MOBILE_UX_CALENDAR_v1.md
