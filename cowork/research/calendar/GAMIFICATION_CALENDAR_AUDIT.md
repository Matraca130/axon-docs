# Gamification × Calendar Integration: Deep Audit & Design Specifications
**Axon/Seeki v4.5** | **Date:** 2026-03-27 | **Audit Scope:** Finals Season Gamification (Tiers D, J, O)

---

## Executive Summary

This audit addresses integrating Axon's robust gamification system (XP, badges, streaks, leaderboard) with the proposed calendar/finals features. **Seven critical design problems** are identified with complete specifications:

1. **Streak overlay visualization** — edge cases, data flow, visual language
2. **Streak freeze UI** — clear affordance without complexity bloat
3. **Finals detection logic** — safest approach, edge cases
4. **XP multiplier UX** — subtle communication during x2 mode
5. **Badge trigger timing** — "Cero Pánico" and others
6. **Celebration moments** — animation strategy + psychology
7. **Anti-gaming safeguards** — XP cap validation during finals

**Key principle:** Gamification must **reinforce reality** (studying harder IS the reward), not **create friction** (calendar clutter, animation spam, reward fatigue). Duolingo's success comes from celebrating *the behavior you want*, not *the action of opening the app*.

---

## Part 1: Streak Overlay Implementation

### 1.1 Problem Statement

Current understanding: "green dots on days with completed sessions." But **what constitutes completion?**

- Minimum 5 minutes of study? 1 activity? 50 XP threshold?
- Partial days (quick 5-min review) should count? Should show different visual?
- How does this layer onto a monthly calendar view without cluttering?
- What's the data source: `daily_activities` table or reconstructed from `study_sessions`?

### 1.2 Solution: Content-Driven Completion Definition

**Definition:** A day counts as "completed" if:
```
daily_activity.total_activities >= 1
AND daily_activity.time_spent_seconds >= 300  // minimum 5 min
AND date(study_sessions.created_at) = date(daily_activity.date)
```

**Rationale:**
- Prevents gaming (just opening the app doesn't count)
- 5 min threshold is low enough for a quick review session but filters accidental opens
- Aligns with how student engagement is tracked in `sessionAnalytics.ts`

**Alternative (more lenient, for mobile users):**
```
daily_activity.total_activities >= 1
OR flashcard reviews that day >= 1
OR quiz submitted that day
// No time minimum — activity count is proof of intent
```

Choose based on Petrick's philosophy: **tight (5-min) or lenient (any activity)?**

### 1.3 Data Flow: `daily_activities` → StreakDot Component

**Backend schema (existing `daily_activities` table):**
```sql
CREATE TABLE daily_activities (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  date DATE NOT NULL,
  total_sessions INT DEFAULT 0,
  total_activities INT DEFAULT 0,
  time_spent_seconds INT DEFAULT 0,
  flashcards_reviewed INT DEFAULT 0,
  quizzes_completed INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),

  UNIQUE(student_id, date),
  FOREIGN KEY (student_id) REFERENCES auth.users(id)
);
```

**Frontend hook to fetch streak data:**
```typescript
// hooks/useStreakCalendar.ts
export function useStreakCalendar(studentId: string, month: Date) {
  const [streakDays, setStreakDays] = useState<Record<string, boolean>>({});
  const [freezeDays, setFreezeDays] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Fetch daily_activities for the entire month
    apiCall('GET', '/gamification/streak-calendar', {
      studentId,
      year: month.getFullYear(),
      month: month.getMonth() + 1
    }).then(res => {
      // res = { streakDays: { '2026-03-15': true, ... }, freezeDays: {...} }
      setStreakDays(res.streakDays);
      setFreezeDays(res.freezeDays);
    });
  }, [month]);

  return { streakDays, freezeDays };
}
```

**Backend endpoint:**
```typescript
// routes/gamification-calendar.ts
router.get('/gamification/streak-calendar', async (req, res) => {
  const { studentId, year, month } = req.query;

  // Fetch all daily_activities for month
  const activities = await db.query(
    `SELECT date, total_activities, time_spent_seconds
     FROM daily_activities
     WHERE student_id = $1
       AND EXTRACT(YEAR FROM date) = $2
       AND EXTRACT(MONTH FROM date) = $3
     ORDER BY date ASC`,
    [studentId, year, month]
  );

  // Fetch streak freeze usage that month
  const freezes = await db.query(
    `SELECT date FROM streak_freeze_usage
     WHERE student_id = $1
       AND date >= make_date($2, $3, 1)
       AND date < make_date($2, $3, 1) + interval '1 month'`,
    [studentId, year, month]
  );

  const streakDays = {};
  const freezeDays = {};

  for (const activity of activities) {
    // A day counts if: 1+ activity AND 5+ min
    streakDays[activity.date] =
      activity.total_activities >= 1 && activity.time_spent_seconds >= 300;
  }

  for (const freeze of freezes) {
    freezeDays[freeze.date] = true;
  }

  return res.json({ streakDays, freezeDays });
});
```

### 1.4 Visual Language: Exact Component Design

**CalendarStreakDot component (sits inside each calendar day cell):**

```typescript
// components/calendar/CalendarStreakDot.tsx
import { cn } from '@/lib/utils';

interface CalendarStreakDotProps {
  date: Date;
  hasActivity: boolean;
  isFrozen: boolean;
  isToday: boolean;
  streak: number; // current streak count
  onHover?: (info: string) => void;
}

export function CalendarStreakDot({
  hasActivity,
  isFrozen,
  isToday,
  streak,
  onHover
}: CalendarStreakDotProps) {
  if (!hasActivity && !isFrozen) return null; // Empty cell

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Base calendar day number (unchanged) */}
      <span className="text-sm font-medium">15</span>

      {/* Streak dot: positioned bottom-right of day cell */}
      {hasActivity && (
        <div
          className={cn(
            'absolute bottom-1 right-1 w-2 h-2 rounded-full transition-all',
            // Green when active, darker green on hover
            'bg-green-500 hover:bg-green-600',
            // Scale on hover for subtle feedback (NOT movement)
            'hover:scale-125'
          )}
          onMouseEnter={() => onHover?.(
            `${streak} day streak — you studied today!`
          )}
          title={`Studied ${streak} consecutive days`}
        />
      )}

      {/* Freeze indicator: positioned bottom-left */}
      {isFrozen && (
        <div
          className="absolute bottom-1 left-1 text-xs"
          title="Streak freeze used"
        >
          ❄️
        </div>
      )}

      {/* Today indicator: subtle border */}
      {isToday && (
        <div className="absolute inset-0 rounded border-2 border-blue-500 pointer-events-none" />
      )}
    </div>
  );
}
```

**Integration into calendar cell:**

```typescript
// components/calendar/CalendarDayCell.tsx (existing component, modified)

export function CalendarDayCell({
  date,
  streakInfo
}: CalendarDayCellProps) {
  const isToday = isToday(date);

  return (
    <div className={cn(
      'relative p-2 h-24 border',
      // Base styling (existing)
      isToday && 'bg-blue-50 border-blue-500'
    )}>
      {/* Streak dot (NEW) */}
      <CalendarStreakDot
        date={date}
        hasActivity={streakInfo.streakDays[dateString(date)] ?? false}
        isFrozen={streakInfo.freezeDays[dateString(date)] ?? false}
        isToday={isToday}
        streak={streakInfo.currentStreak}
      />

      {/* Existing event badges */}
      {/* ... exam badges, task badges, etc ... */}
    </div>
  );
}
```

**Visual specs:**
- **Dot size:** 8px diameter (2x2 in Tailwind = 8px × 8px)
- **Position:** Bottom-right corner of day cell (inset 4px)
- **Color:** `#22c55e` (Tailwind green-500) on study day
- **Hover state:** Scale to 10px, darken to green-600
- **Freeze emoji:** ❄️ (Unicode) at bottom-left, size 10px
- **Monthly view:** One dot per day (no stacking or numbers)
- **Weekly view:** Same dot, can show multiple weeks
- **Mobile:** Tap to show tooltip (no hover)

### 1.5 Monthly View Clutter Prevention

**Problem:** 30+ dots in a month view could look noisy.

**Solution: "Heatmap mode" toggle**

```typescript
export function CalendarViewToggle() {
  const [viewMode, setViewMode] = useState<'standard' | 'heatmap'>('standard');

  return (
    <>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setViewMode('standard')}>
          Standard (Dots)
        </button>
        <button onClick={() => setViewMode('heatmap')}>
          Heatmap (Color)
        </button>
      </div>

      {viewMode === 'standard' && <StandardCalendar />}
      {viewMode === 'heatmap' && <HeatmapCalendar />}
    </>
  );
}
```

**Heatmap variant:** Color the entire day cell by intensity:
- White: no activity
- Light green (#dcfce7): 1 activity
- Green (#86efac): 2-3 activities
- Dark green (#22c55e): 4+ activities (or >2 hours)

This is **less noisy** than dots and **more informative** (shows study intensity).

### 1.6 Streak Freeze Days — Color & Icon

**Current freeze implementation:** `buyStreakFreeze` buys one freeze that applies to the next missed day.

**On the calendar:**
- **Day the freeze is used:** Show ❄️ emoji + very light blue background (`bg-blue-50`)
- **Not a failure indicator** — it's a safety net celebration
- **Hover text:** "Streak freeze used on [date] — your streak is safe!"

**Psychology:** The freeze day should feel **less important than active study days** (green > blue). This discourages relying on freezes and encourages actual study.

---

## Part 2: Finals Season Mode Detection

### 2.1 Problem: When Does "Finals Season" Start?

Three approaches with tradeoffs:

| Approach | Pros | Cons | Recommendation |
|---|---|---|---|
| **Manual toggle** (student/prof) | Complete control, no false positives | Requires awareness + action | Beta/testing only |
| **Auto-trigger** (exam_event ≤ 7 days) | No friction, automatic | Could trigger mid-semester | Hybrid (see 2.2) |
| **Professor sets** ("finals period") | Institutional accuracy | Requires data entry | Production (2024+) |

### 2.2 Recommended Hybrid Approach (2026)

```typescript
// types/finals.ts
export type FinalsMode = {
  enabled: boolean;          // Master switch
  reason: 'auto' | 'manual' | 'institutional';
  nextExamDaysAway: number; // Days until nearest exam
  affectedExams: string[];  // Which exams triggered this
  professorSetEnd?: Date;   // If institutional
};
```

**Backend logic:**

```typescript
// services/finals-service.ts

export async function detectFinalsMode(
  studentId: string,
  institutionId: string
): Promise<FinalsMode> {
  // Step 1: Check if professor set a "finals period" for this student's courses
  const professorFinalsEnd = await db.queryOne(
    `SELECT MAX(finals_period_end) as end_date
     FROM course_finals_periods
     WHERE institution_id = $1
       AND course_id IN (
         SELECT course_id FROM study_plans
         WHERE student_id = $2
       )
       AND finals_period_end > NOW()`,
    [institutionId, studentId]
  );

  if (professorFinalsEnd?.end_date) {
    return {
      enabled: true,
      reason: 'institutional',
      nextExamDaysAway: daysBetween(new Date(), professorFinalsEnd.end_date),
      affectedExams: [], // Could fetch these too
      professorSetEnd: professorFinalsEnd.end_date
    };
  }

  // Step 2: Auto-detect from exam events
  const nearestExam = await db.queryOne(
    `SELECT exam_event_id, exam_date, course_id
     FROM exam_events
     WHERE student_id = $1
       AND exam_date > NOW()
       AND exam_date <= NOW() + interval '7 days'
     ORDER BY exam_date ASC
     LIMIT 1`,
    [studentId]
  );

  if (nearestExam) {
    return {
      enabled: true,
      reason: 'auto',
      nextExamDaysAway: daysBetween(new Date(), nearestExam.exam_date),
      affectedExams: [nearestExam.exam_event_id]
    };
  }

  // Step 3: Check manual override (student can enable early)
  const manualOverride = await db.queryOne(
    `SELECT TRUE FROM student_prefs
     WHERE student_id = $1 AND finals_mode_enabled = true
     AND enabled_until > NOW()`,
    [studentId]
  );

  if (manualOverride) {
    return {
      enabled: true,
      reason: 'manual',
      nextExamDaysAway: 0,
      affectedExams: []
    };
  }

  return {
    enabled: false,
    reason: 'auto',
    nextExamDaysAway: 999,
    affectedExams: []
  };
}

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
```

### 2.3 Edge Cases & Safeguards

**Edge case 1: Multiple exams in same week**
```
Exam 1: March 30 (3 days)
Exam 2: April 2 (6 days)
→ Finals mode triggers on exam 1, stays on until after exam 2
→ nextExamDaysAway = 3 (always the nearest)
```

**Edge case 2: Finals period extends past last exam date**
```
Professor set: July 1-15 (finals week)
Last exam: July 12
→ Finals mode stays on until July 15 (honor professor's boundary)
```

**Edge case 3: Auto-trigger false positive**
```
One exam on April 5, student has no other exams
→ 7-day window is April 1-5
→ On April 6, finals mode OFF
→ Reason: Not a "season" (only 1 exam)
→ FIX: Require 2+ exams within window OR professor designation
```

**Safeguard: Minimum 2 exams for auto-trigger**
```typescript
const multipleExams = await db.query(
  `SELECT COUNT(*) as count FROM exam_events
   WHERE student_id = $1
     AND exam_date > NOW()
     AND exam_date <= NOW() + interval '7 days'`,
  [studentId]
);

if (multipleExams[0].count < 2) {
  // Don't auto-trigger on single exam
  // Only allow if professor set or manual
}
```

---

## Part 3: XP Multiplier UX

### 3.1 Problem: How to Communicate x2 Without Spam

If finals mode is on, all XP is doubled. But **how does the student know?**

| Approach | UX | Risk |
|---|---|---|
| **Persistent banner** at top | Obvious but takes space | Visual noise, fatigue |
| **XPPopup shows x2** | Already in-app, non-intrusive | Easy to miss |
| **Leaderboard shows x2** | Context-aware, only when comparing | Too late (post-event) |
| **In calendar only** | Specific, not spammy | Requires discovery |

### 3.2 Recommended: Layered Approach

**Layer 1: Dashboard banner (first load of day during finals)**
```typescript
// components/gamification/FinalsMultiplierBanner.tsx

export function FinalsMultiplierBanner({ finalsMode }: Props) {
  if (!finalsMode.enabled) return null;

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 rounded">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className="text-xl">⚡</span>

        {/* Message */}
        <div className="flex-1">
          <p className="font-semibold text-amber-900">
            Finals Week Mode: All XP x2!
          </p>
          <p className="text-sm text-amber-700 mt-1">
            Keep the momentum — every study session counts double.
            {finalsMode.reason === 'institutional' && (
              <> Ends {finalsMode.professorSetEnd?.toLocaleDateString()}</>
            )}
          </p>
        </div>

        {/* Close button (shows once per day via localStorage) */}
        <button
          className="text-amber-500 hover:text-amber-700"
          onClick={() => {
            localStorage.setItem(`finals-banner-${today()}`, 'dismissed');
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
```

**Layer 2: XPPopup modifier during XP events**
```typescript
// components/gamification/XPPopup.tsx (modified)

export function XPPopup({ xpGained, source, isFinalsWeek }: Props) {
  const displayXP = isFinalsWeek ? xpGained * 2 : xpGained;

  return (
    <div className="animate-bounce-out">
      <p className="text-lg font-bold text-green-600">
        +{displayXP} XP
        {isFinalsWeek && (
          <span className="text-sm text-amber-600 ml-1">
            (x2) ⚡
          </span>
        )}
      </p>
      <p className="text-xs text-gray-500">{source}</p>
    </div>
  );
}
```

**Layer 3: Calendar cell indicator (subtle)**
```typescript
// When rendering calendar cells during finals week

export function CalendarDayCell({ date, isFinalsWeek }: Props) {
  return (
    <div className={cn(
      'relative p-2 h-24 border',
      isFinalsWeek && 'bg-gradient-to-br from-amber-50 to-white'
      // Subtle gradient, not aggressive
    )}>
      {/* If this day has events AND finals mode */}
      {isFinalsWeek && hasEvent(date) && (
        <span className="absolute top-1 right-1 text-xs text-amber-600">
          ⚡ x2
        </span>
      )}
      {/* ... rest of cell */}
    </div>
  );
}
```

### 3.3 When to Show vs. Hide the Banner

**Show:**
- First page load of the day during finals week
- When student manually enables finals mode early
- At the moment auto-detection triggers (1-time notification)

**Hide (auto-dismiss):**
- After student closes it (localStorage: `finals-banner-{YYYY-MM-DD}`)
- Doesn't reappear until next calendar day
- On non-finals days

**Never show:**
- In the leaderboard (confuses comparison)
- In the badges page (not relevant there)
- Multiple times per day (spam prevention)

---

## Part 4: Badge Trigger Logic

### 4.1 Finals Season Badges

Three badges trigger during finals:

| Badge | Condition | Trigger Event | Psychology |
|---|---|---|---|
| **Sobreviviente de Finales** | Start 3+ review plans in finals week | `POST /study-plans` with `is_finals_plan: true` | Persistence through difficulty |
| **Maratón de Estudio** | 4+ hours study in one calendar day during finals | End of day batch: `study_sessions.time_total >= 14400s` | Peak effort celebration |
| **Cero Pánico** | Start review plan 15+ days before exam | `POST /study-plans` triggered + `exam_date - plan_created_at >= 15d` | Early planning reward |

### 4.2 Trigger Points: When to Call `checkBadges()`

**Current flow in gamification-backend.ts:**
```
POST /gamification/xp → POST /gamification/badges/check → Badge unlock
```

**Problem:** This only fires on XP events. But badge conditions are **time-based** or **plan-based**, not XP-based.

**Solution: Multiple trigger points**

```typescript
// services/study-plan-service.ts (backend)

export async function createStudyPlan(
  studentId: string,
  courseId: string,
  planData: StudyPlanInput
): Promise<StudyPlan> {
  const plan = await db.insert('study_plans', {
    student_id: studentId,
    course_id: courseId,
    ...planData,
    created_at: new Date()
  });

  // TRIGGER 1: Check "Sobreviviente" badge
  // (Requires: finalsMode.enabled && count(study_plans in this month) >= 3)
  await checkBadgeAsync(studentId, 'badge_sobreviviente', {
    plan_created_at: plan.created_at,
    finalsMode: getFinalsMode(studentId) // Fetch current finals mode
  });

  // TRIGGER 2: Check "Cero Pánico" badge
  // (Requires: exam_date exists && daysUntilExam(exam_date) >= 15)
  if (planData.exam_event_id) {
    const exam = await db.queryOne(
      `SELECT exam_date FROM exam_events WHERE id = $1`,
      [planData.exam_event_id]
    );
    if (exam) {
      const daysUntil = daysBetween(new Date(), exam.exam_date);
      if (daysUntil >= 15) {
        await checkBadgeAsync(studentId, 'badge_cero_panico', {
          exam_date: exam.exam_date,
          plan_created_at: plan.created_at
        });
      }
    }
  }

  return plan;
}
```

**For "Maratón de Estudio":**
```typescript
// services/session-service.ts (backend)

export async function finalizeStudySession(
  sessionId: string,
  endTime: Date
): Promise<StudySession> {
  const session = await db.update('study_sessions',
    { id: sessionId },
    { ended_at: endTime }
  );

  // Batch check at end of day (via cron or batch process)
  // Trigger at 11:59 PM for each time zone
  await checkDailyBadges(session.student_id, today());
}

export async function checkDailyBadges(
  studentId: string,
  date: Date
): Promise<void> {
  // Get all sessions for this day
  const sessions = await db.query(
    `SELECT SUM(duration_seconds) as total_seconds
     FROM study_sessions
     WHERE student_id = $1
       AND DATE(started_at) = $2`,
    [studentId, dateString(date)]
  );

  const totalSeconds = sessions[0].total_seconds || 0;

  // Check "Maratón" badge
  if (totalSeconds >= 14400) { // 4 hours = 14400 seconds
    const finalsMode = await detectFinalsMode(studentId, ...);
    if (finalsMode.enabled) {
      await checkBadgeAsync(studentId, 'badge_maraton', {
        hours_studied: Math.round(totalSeconds / 3600),
        date: date
      });
    }
  }
}
```

### 4.3 Badge Check Logic in Backend

```typescript
// services/badge-service.ts

export async function checkBadgeAsync(
  studentId: string,
  badgeId: string,
  context: Record<string, any>
): Promise<boolean> {
  // Get badge definition
  const badge = BADGES[badgeId];
  if (!badge) return false;

  // Check if already earned
  const earned = await db.queryOne(
    `SELECT id FROM student_badges WHERE student_id = $1 AND badge_id = $2`,
    [studentId, badgeId]
  );
  if (earned) return false; // Already earned

  // Evaluate condition
  const meetsCondition = await badge.evaluateCondition(
    studentId,
    context
  );

  if (meetsCondition) {
    // Insert into student_badges
    await db.insert('student_badges', {
      student_id: studentId,
      badge_id: badgeId,
      earned_at: new Date()
    });

    // Queue notification
    await queueNotification(studentId, {
      type: 'badge_earned',
      badge: badge,
      animationTrigger: 'celebration'
    });

    return true;
  }

  return false;
}

// Badge definitions
export const BADGES = {
  badge_sobreviviente: {
    name: 'Sobreviviente de Finales',
    evaluateCondition: async (studentId: string, ctx: any) => {
      // Count review plans created in current finals week
      const count = await db.queryOne(
        `SELECT COUNT(*) as count FROM study_plans
         WHERE student_id = $1
           AND is_finals_plan = true
           AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
           AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
           AND EXTRACT(WEEK FROM created_at) = EXTRACT(WEEK FROM NOW())`,
        [studentId]
      );
      return count[0].count >= 3;
    }
  },

  badge_cero_panico: {
    name: 'Cero Pánico',
    evaluateCondition: async (studentId: string, ctx: any) => {
      const daysUntil = daysBetween(ctx.plan_created_at, ctx.exam_date);
      return daysUntil >= 15;
    }
  },

  badge_maraton: {
    name: 'Maratón de Estudio',
    evaluateCondition: async (studentId: string, ctx: any) => {
      return ctx.hours_studied >= 4;
    }
  }
};
```

### 4.4 Frontend Badge Notification

When a badge is earned, trigger celebration:

```typescript
// hooks/useGameBadgeNotifications.ts

export function useGameBadgeNotifications() {
  const { showNotification } = useNotifications();

  useEffect(() => {
    // Poll for badge earned notification
    const unsubscribe = gamificationApi.subscribeToNotifications(
      (notification: GamificationNotification) => {
        if (notification.type === 'badge_earned') {
          // Show badge earned toast with animation
          showNotification({
            type: 'badge-earned',
            badge: notification.badge,
            triggerAnimation: true,
            duration: 3000 // Show for 3 seconds
          });
        }
      }
    );

    return unsubscribe;
  }, []);
}
```

---

## Part 5: Celebration Moments & Animation Strategy

### 5.1 Celebration Moments (Psychology-Driven)

Duolingo succeeds because it celebrates **the hard thing** (completing lessons), not **the easy thing** (opening the app).

**Axon celebrations should trigger at:**

| Event | Trigger | Animation | Timing | Why |
|---|---|---|---|---|
| **Streak day completed** | 11:59 PM if 5+ min today | Gentle dot pulse | End of day | Reinforce consistency |
| **Streak milestone** | 7, 14, 30, 60 days | Confetti burst | On unlock | Peak emotion harvest |
| **Review plan started** | `POST /study-plans` | Slide-up toast | Immediate | Lower initial friction |
| **Exam prep milestone** | 50% mastery on exam topics | Subtle float | On threshold cross | Show progress |
| **Badge earned** | Badge condition met | Full-screen badge reveal | On unlock | Rare, big celebration |
| **Finals mode unlocked** | Auto-detect or manual | Banner with shine | First load of day | Context celebration |
| **XP milestone** | Every 500 XP (level up) | Existing LevelUpCelebration | On unlock | Existing system |

### 5.2 Animation Approach: CSS-First, Framer-Only If Needed

**Strategy:** Use Tailwind CSS animations for lightweight moments, Framer Motion only for complex sequences.

**Streak dot pulse (end of day):**
```css
/* tailwind.config.ts */
theme: {
  extend: {
    animation: {
      'streak-pulse': 'streakPulse 1.5s ease-out',
      'streak-bloom': 'streakBloom 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
    keyframes: {
      streakPulse: {
        '0%': { transform: 'scale(1)', opacity: '1' },
        '50%': { transform: 'scale(1.5)', opacity: '0.8' },
        '100%': { transform: 'scale(1)', opacity: '1' },
      },
      streakBloom: {
        '0%': { transform: 'scale(0.5)', opacity: '0' },
        '100%': { transform: 'scale(1)', opacity: '1' },
      }
    }
  }
}
```

```tsx
// Streak dot during end-of-day check
<div className="animate-streak-bloom">
  <div className="w-2 h-2 rounded-full bg-green-500 animate-streak-pulse" />
</div>
```

**Confetti burst for milestone (Framer Motion):**
```tsx
// components/gamification/StreakMilestoneAnimation.tsx
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function StreakMilestoneAnimation({ streak }: { streak: number }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <div className="text-4xl font-bold text-green-600 text-center">
          🔥 {streak} Day Streak!
        </div>
      </motion.div>

      {/* Confetti particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: 0,
            y: 0,
            opacity: 1,
            rotate: 0
          }}
          animate={{
            x: (Math.random() - 0.5) * 300,
            y: Math.random() * -200,
            opacity: 0,
            rotate: Math.random() * 360
          }}
          transition={{ duration: 2, delay: Math.random() * 0.2 }}
          className="absolute top-1/2 left-1/2 w-3 h-3 bg-green-500 rounded pointer-events-none"
          style={{
            borderRadius: Math.random() > 0.5 ? '50%' : '0%'
          }}
        />
      ))}
    </div>
  );
}
```

**Badge reveal (full-screen):**
```tsx
// components/gamification/BadgeRevealAnimation.tsx
import { motion } from 'framer-motion';

export function BadgeRevealAnimation({ badge }: { badge: Badge }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <motion.div
        className="bg-white rounded-lg p-8 text-center shadow-2xl"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
      >
        <motion.div
          className="text-8xl mb-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8 }}
        >
          {badge.icon}
        </motion.div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {badge.name}
        </h2>
        <p className="text-gray-600 mb-4">{badge.description}</p>

        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={() => {}} // Dismiss
        >
          Awesome!
        </button>
      </motion.div>
    </motion.div>
  );
}
```

### 5.3 Celebration Frequency Safeguard

**Problem:** Too many celebrations = reward fatigue (psychological saturation).

**Solution:** Celebration throttle per type**

```typescript
// lib/celebration-throttle.ts

export class CelebrationThrottle {
  private lastCelebration: Record<string, number> = {};

  // Minimum milliseconds between celebrations of same type
  private THROTTLE_MS = {
    'streak-pulse': 0,       // Every day
    'streak-milestone': 0,   // Once per milestone (unique event)
    'badge-earned': 60000,   // Max 1 badge per minute
    'xp-popup': 0,           // Every XP (but cap 500/day anyway)
    'confetti': 30000        // Max 1 confetti per 30s
  };

  canCelebrate(type: string): boolean {
    const lastTime = this.lastCelebration[type] ?? 0;
    const now = Date.now();

    if (now - lastTime >= this.THROTTLE_MS[type]) {
      this.lastCelebration[type] = now;
      return true;
    }

    return false;
  }
}
```

**Frontend usage:**
```typescript
// hooks/useCelebration.ts
const throttle = useRef(new CelebrationThrottle());

function triggerCelebration(type: string) {
  if (!throttle.current.canCelebrate(type)) {
    return; // Skip if throttled
  }

  // Show animation
  // ...
}
```

---

## Part 6: Leaderboard Integration

### 6.1 Question: Should Calendar Show Leaderboard Data?

**Option A: No lively integration** — Calendar is study-focused, leaderboard is separate
**Option B: Subtle integration** — "X classmates studying now" in finals week
**Option C: Full integration** — Show who's preparing for same exams

### 6.2 Recommendation: Minimal, Opt-In Integration

**Rationale:**
- Too much social comparison during high-stress finals = anxiety
- Leaderboard should celebrate consistency across semester, not daily pressure
- Optional feature for students who want it

**Implementation:**

```typescript
// components/calendar/ClassmateStudyingIndicator.tsx (optional)

export function ClassmateStudyingIndicator({
  courseId,
  showIfEnabled: boolean
}: Props) {
  if (!showIfEnabled) return null;

  const [count, setCount] = useState(0);

  // Fetch classmates actively studying right now
  useEffect(() => {
    const poll = setInterval(() => {
      apiCall('GET', `/leaderboard/active-now`, {
        courseId
      }).then(res => setCount(res.countActive));
    }, 30000); // Poll every 30s

    return () => clearInterval(poll);
  }, [courseId]);

  if (count === 0) return null;

  return (
    <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      {count} classmate{count > 1 ? 's' : ''} studying now
    </div>
  );
}
```

**Enable via settings toggle:**
```typescript
// settings/GamificationPreferences.tsx

<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={showActiveFriends}
    onChange={() => setShowActiveFriends(!showActiveFriends)}
  />
  <span>Show classmates studying in calendar (social mode)</span>
</label>
```

**Key constraint:** This indicator should NEVER compare scores or create ranking anxiety. It only shows presence ("others are here"), not performance.

---

## Part 7: Anti-Gaming Safeguards

### 7.1 Problem: XP x2 During Finals = Incentive to Game

With XP doubled, students might:
- Open app, do 5 seconds of review, close app (many times)
- Create fake study sessions
- Spam low-effort activities (e.g., flashcard review without reading)

### 7.2 Solution: Multi-Layer Validation

**Layer 1: Minimum session duration**
```typescript
// services/xp-service.ts

export async function awardXP(
  studentId: string,
  amount: number,
  source: XPSource,
  sessionId?: string
): Promise<XPResult> {
  // Validation: If source is study_session, check duration
  if (sessionId && source === 'reading_complete') {
    const session = await db.queryOne(
      `SELECT duration_seconds FROM study_sessions WHERE id = $1`,
      [sessionId]
    );

    if (session.duration_seconds < 300) { // 5 minutes
      return {
        xpGranted: 0,
        reason: 'session_too_short',
        message: 'Study sessions must be at least 5 minutes'
      };
    }
  }

  // Rest of XP logic...
}
```

**Layer 2: Daily activity cap (during finals, raise to 750 instead of 500)**
```typescript
// XP_TABLE configuration
export const XP_DAILY_CAP = {
  normal: 500,
  finalsWeek: 750  // 50% more during high-stress period
};

export async function checkDailyXPCap(
  studentId: string,
  amount: number,
  finalsMode: boolean
): Promise<boolean> {
  const cap = finalsMode ? XP_DAILY_CAP.finalsWeek : XP_DAILY_CAP.normal;

  const today = new Date().toDateString();
  const todayXP = await db.queryOne(
    `SELECT SUM(amount) as total FROM xp_log
     WHERE student_id = $1
       AND DATE(created_at) = $2`,
    [studentId, today]
  );

  return (todayXP[0].total || 0) + amount <= cap;
}
```

**Layer 3: Activity diversity check**
```typescript
// Prevent: "I did 100 single-card reviews instead of a real session"

export async function validateActivityDiversity(
  studentId: string,
  sessionId: string,
  source: XPSource
): Promise<boolean> {
  // If source is flashcard_review, ensure it was part of a batch
  // (not isolated single-card reviews done 100 times)

  if (source === 'flashcard_review') {
    const session = await db.queryOne(
      `SELECT review_count FROM study_sessions WHERE id = $1`,
      [sessionId]
    );

    if (session.review_count < 5) {
      // Reviewing fewer than 5 cards in one session = not a real session
      return false;
    }
  }

  return true;
}
```

**Layer 4: Frequency throttle per student**
```typescript
// Max XP events per minute (prevents rapid-fire API spam)

export const XP_EVENT_THROTTLE = {
  normal: 1,        // 1 XP event per second
  finalsWeek: 2,    // 2 per second (slightly relaxed)
  burst: 5          // Up to 5 in a 10-second window
};

export async function checkXPEventThrottle(
  studentId: string
): Promise<boolean> {
  const lastTenSeconds = await db.query(
    `SELECT COUNT(*) as count FROM xp_log
     WHERE student_id = $1
       AND created_at > NOW() - interval '10 seconds'`,
    [studentId]
  );

  if (lastTenSeconds[0].count >= XP_EVENT_THROTTLE.burst) {
    return false; // Throttled
  }

  return true;
}
```

### 7.3 Finals Week XP Strategy

Instead of raw x2 multiplier, use **bonus tiering**:

```typescript
export const FINALS_XP_BONUS = {
  baseMultiplier: 1.5,      // 1.5x instead of 2x (less aggressive)
  consistencyBonus: {       // Extra bonus for spreading study across days
    1day: 0,                // No bonus for single-day cramming
    3days: 0.1,             // 10% bonus for 3 days
    5days: 0.25,            // 25% bonus for 5 days
    7days: 0.5              // 50% bonus for full week
  },
  diversityBonus: {         // Extra bonus for mixing study types
    single_method: 0,       // No bonus if only flashcards
    two_methods: 0.1,       // 10% bonus for 2+ methods
    three_methods: 0.25     // 25% bonus for 3+ methods
  }
};

export function computeFinalsXPMultiplier(
  studentStats: StudentStudyStats,
  finalsMode: boolean
): number {
  if (!finalsMode) return 1.0;

  let multiplier = FINALS_XP_BONUS.baseMultiplier;

  // Add consistency bonus
  const activeDaysThisWeek = countActiveDaysThisWeek(studentStats);
  multiplier += FINALS_XP_BONUS.consistencyBonus[activeDaysThisWeek] || 0;

  // Add diversity bonus
  const methodsUsed = countStudyMethods(studentStats);
  multiplier += FINALS_XP_BONUS.diversityBonus[methodsUsed] || 0;

  // Max multiplier: 2.25x (1.5 base + 0.5 consistency + 0.25 diversity)
  return Math.min(multiplier, 2.25);
}
```

**Example:**
- Day 1 (only flashcards): 50 XP × 1.5 = **75 XP**
- Day 3 (flashcards + quiz): 60 XP × (1.5 + 0.1) = **96 XP**
- Day 7 (flashcards + quiz + reading, full week): 70 XP × (1.5 + 0.5 + 0.25) = **157.5 XP**

**Incentive structure:**
- Single-day cramming doesn't get bonus (prevents all-nighters)
- Multi-day consistent study gets rewarded
- Diverse methods (real studying) get rewarded more than spam

---

## Part 8: Database Schema Additions

### 8.1 New Tables Required

```sql
-- Finals mode tracking
CREATE TABLE finals_periods (
  id UUID PRIMARY KEY,
  institution_id UUID NOT NULL,
  course_id UUID NOT NULL,
  finals_period_start DATE NOT NULL,
  finals_period_end DATE NOT NULL,
  created_by UUID NOT NULL, -- Professor/admin
  created_at TIMESTAMP DEFAULT now(),

  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Streak freeze usage
CREATE TABLE streak_freeze_usage (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  date DATE NOT NULL,
  used_at TIMESTAMP DEFAULT now(),

  UNIQUE(student_id, date),
  FOREIGN KEY (student_id) REFERENCES auth.users(id)
);

-- Exam events (if not already present)
CREATE TABLE exam_events (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  course_id UUID NOT NULL,
  exam_name TEXT NOT NULL,
  exam_date TIMESTAMP NOT NULL,
  exam_type VARCHAR(20), -- 'quiz', 'midterm', 'final', 'practical'
  location TEXT,
  created_at TIMESTAMP DEFAULT now(),

  FOREIGN KEY (student_id) REFERENCES auth.users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Finals-specific study plan metadata
ALTER TABLE study_plans ADD COLUMN (
  is_finals_plan BOOLEAN DEFAULT false,
  exam_event_id UUID REFERENCES exam_events(id),
  finals_mode_active BOOLEAN DEFAULT false
);
```

### 8.2 Indexes for Performance

```sql
CREATE INDEX idx_finals_periods_institution_course
  ON finals_periods(institution_id, course_id);

CREATE INDEX idx_exam_events_student_date
  ON exam_events(student_id, exam_date);

CREATE INDEX idx_study_plans_finals
  ON study_plans(student_id, is_finals_plan, exam_event_id);

CREATE INDEX idx_daily_activities_date
  ON daily_activities(student_id, date);
```

---

## Part 9: Component Integration Map

```
Dashboard/CalendarView
├── FinalsMultiplierBanner (conditional)
├── CalendarComponent (existing)
│   └── CalendarDayCell (per day)
│       ├── CalendarStreakDot (NEW)
│       ├── ExamEventBadge (existing)
│       └── TaskIndicator (existing)
├── ClassmateStudyingIndicator (conditional)
└── SidePanel: UpcomingExamDetail
    ├── ExamCountdown
    ├── PreparationProgressBar
    ├── WeakTopicsAlert
    └── QuickActionButtons

Study Plan Wizard
├── FinalsPlanTemplate (conditional if finals mode)
└── SmartReviewPlanGenerator

Gamification Hub
├── BadgeEarnedAnimation (full-screen for finals badges)
├── StreakMilestoneAnimation
├── XPPopup (shows x2 during finals)
└── LeaderboardPage (filters for period if finals)

Settings
└── GamificationPreferences
    ├── Enable/disable finals mode indicators
    └── Enable/disable classmate activity display
```

---

## Part 10: Implementation Checklist

### Phase 1: Streak Overlay (Week 1)
- [ ] Implement `useStreakCalendar` hook
- [ ] Create `GET /gamification/streak-calendar` endpoint
- [ ] Build `CalendarStreakDot` component
- [ ] Add streak_freeze_usage table
- [ ] Test streak data retrieval for full month
- [ ] Visual QA: dots positioned, colors correct, no clutter

### Phase 2: Finals Detection (Week 2)
- [ ] Create `finals_periods` table + migrations
- [ ] Implement `detectFinalsMode()` service
- [ ] Build `FinalsMultiplierBanner` component
- [ ] Add exam_events table (if not present)
- [ ] Test all three detection paths (institutional, auto, manual)
- [ ] Test edge cases (multiple exams, false positives)

### Phase 3: Gamification Hooks (Week 3)
- [ ] Add finals mode checks to XP system
- [ ] Implement `FINALS_XP_BONUS` multiplier logic
- [ ] Build badge trigger points for study plan creation
- [ ] Implement daily batch check for "Maratón" badge
- [ ] Wire up anti-gaming validations
- [ ] Test XP multiplier during finals mode

### Phase 4: Animations & UX (Week 4)
- [ ] Add Framer Motion animations (confetti, badge reveal)
- [ ] Implement celebration throttle
- [ ] Build `BadgeRevealAnimation` component
- [ ] Add animations to Tailwind config
- [ ] Create streak milestone animations
- [ ] Test animation performance (no jank on mobile)

### Phase 5: Polish & Integration (Week 5)
- [ ] Add leaderboard social indicators (optional)
- [ ] Implement `ClassmateStudyingIndicator` component
- [ ] Settings page toggles for social features
- [ ] E2E testing: finals week flow (end-to-end)
- [ ] Visual regression testing
- [ ] Load testing (finals week traffic spike)

### Phase 6: Monitoring & Safeguards (Week 6)
- [ ] Set up logging for anti-gaming checks
- [ ] Monitor badge unlock patterns (detect abuse)
- [ ] Set up alerts for XP cap hits (daily)
- [ ] A/B test finals multiplier (1.5x vs 2.0x)
- [ ] Gather student feedback on celebration frequency

---

## Appendix: Design Tokens

```typescript
// lib/finals-design-tokens.ts

export const FINALS_COLORS = {
  indicator: '#fbbf24',      // Amber-400
  warning: '#f87171',        // Red-400
  success: '#22c55e',        // Green-500
  frozen: '#93c5fd',         // Blue-300
  multiplier: '#fbbf24',     // Amber (same as Finals)
};

export const FINALS_ANIMATIONS = {
  streakPulse: 'streak-pulse 1.5s ease-out',
  streakBloom: 'streak-bloom 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
  celebration: 'celebration 2s ease-out',
};

export const FINALS_Z_INDEX = {
  banner: 40,
  badge: 50,
  confetti: 60,
  modal: 50,
};
```

---

## Final Recommendations

1. **Start with Tier D (Streak overlay)** — Low risk, high visibility, builds foundation
2. **Finals detection as utility** — Extract as separate service, reusable across features
3. **Throttle celebrations** — Reward fatigue is real; prefer quality > quantity
4. **Monitor XP patterns** — Set up dashboards to detect gaming attempts early
5. **Gather feedback** — Post-finals survey: "Did the multiplier feel fair?"
6. **Consider regional calendar** — Argentine finals (July, December, Feb) != US college schedule

---

**End of Audit**

---

## References

- **Existing:** `gamification-engine.md`, `gamification-backend.md` (agent ownership docs)
- **Product specs:** `ideas-calendario-finales-argentina.md` (2.11, 2.12, 2.13 sections)
- **Duolingo case study:** Celebration frequency, streak mechanics, multiplier psychology
- **FSRS research:** Spaced repetition during high-pressure periods (finals)
