# Calendar × Gamification: Technical Specifications & Code Reference

**Quick reference for developers implementing the audit recommendations**

---

## 1. Streak Overlay

### Frontend Hook
```typescript
// hooks/useStreakCalendar.ts
export function useStreakCalendar(
  studentId: string,
  month: Date
): {
  streakDays: Record<string, boolean>;
  freezeDays: Record<string, boolean>;
  loading: boolean;
  error: Error | null;
} {
  const [state, setState] = useState({
    streakDays: {},
    freezeDays: {},
    loading: true,
    error: null
  });

  useEffect(() => {
    const year = month.getFullYear();
    const monthNum = month.getMonth() + 1;

    gamificationApi
      .getStreakCalendar(studentId, year, monthNum)
      .then(res => {
        setState({
          streakDays: res.streakDays,
          freezeDays: res.freezeDays,
          loading: false,
          error: null
        });
      })
      .catch(err => {
        setState(prev => ({ ...prev, error: err, loading: false }));
      });
  }, [studentId, month]);

  return state;
}
```

### Component
```typescript
// components/calendar/CalendarStreakDot.tsx
import { cn } from '@/lib/utils';

interface CalendarStreakDotProps {
  hasActivity: boolean;
  isFrozen: boolean;
  isToday: boolean;
  streak: number;
  onHover?: (message: string) => void;
}

export const CalendarStreakDot = ({
  hasActivity,
  isFrozen,
  isToday,
  streak,
  onHover
}: CalendarStreakDotProps) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Day number stays here */}
      <span className="text-sm font-medium">15</span>

      {/* Activity dot: bottom-right */}
      {hasActivity && (
        <div
          className={cn(
            'absolute bottom-1 right-1',
            'w-2 h-2 rounded-full',
            'bg-green-500 hover:bg-green-600 hover:scale-125',
            'transition-all cursor-help'
          )}
          onMouseEnter={() =>
            onHover?.(`${streak} day streak — you studied today!`)
          }
          onTouchStart={() =>
            onHover?.(`${streak} day streak — you studied today!`)
          }
          title={`Studied ${streak} consecutive days`}
          aria-label={`Study activity on this day`}
        />
      )}

      {/* Freeze: bottom-left */}
      {isFrozen && (
        <div
          className="absolute bottom-1 left-1 text-xs"
          title="Streak freeze used"
          aria-label="Streak freeze used on this day"
        >
          ❄️
        </div>
      )}

      {/* Today border */}
      {isToday && (
        <div className="absolute inset-0 rounded border-2 border-blue-500 pointer-events-none" />
      )}
    </div>
  );
};
```

### API Client
```typescript
// services/gamificationApi.ts (additions)
export const gamificationApi = {
  // ... existing endpoints ...

  getStreakCalendar: async (
    studentId: string,
    year: number,
    month: number
  ): Promise<{
    streakDays: Record<string, boolean>;
    freezeDays: Record<string, boolean>;
  }> => {
    return apiCall('GET', '/gamification/streak-calendar', {
      params: { studentId, year, month }
    });
  },

  buyStreakFreeze: async (): Promise<{ success: boolean }> => {
    return apiCall('POST', '/gamification/streak-freeze/buy');
  }
};
```

### Backend Endpoint
```typescript
// routes/gamification-calendar.ts
import { Router } from 'hono';
import * as db from '../db.ts';
import * as validate from '../validate.ts';

const router = new Router();

router.get('/streak-calendar', async (c) => {
  const studentId = c.req.query('studentId');
  const year = parseInt(c.req.query('year'));
  const month = parseInt(c.req.query('month'));

  if (!validate.validateFields({ studentId, year, month })) {
    return c.json(
      { error: 'Missing or invalid parameters' },
      { status: 422 }
    );
  }

  try {
    // Fetch daily activities
    const activities = await db.query(
      `
      SELECT
        date,
        total_activities,
        time_spent_seconds
      FROM daily_activities
      WHERE student_id = $1
        AND EXTRACT(YEAR FROM date) = $2
        AND EXTRACT(MONTH FROM date) = $3
      ORDER BY date ASC
      `,
      [studentId, year, month]
    );

    // Fetch streak freezes used
    const freezes = await db.query(
      `
      SELECT date
      FROM streak_freeze_usage
      WHERE student_id = $1
        AND date >= make_date($2, $3, 1)
        AND date < make_date($2, $3, 1) + interval '1 month'
      `,
      [studentId, year, month]
    );

    const streakDays: Record<string, boolean> = {};
    const freezeDays: Record<string, boolean> = {};

    // Mark streak days (1+ activity AND 5+ minutes)
    for (const activity of activities) {
      const dateKey = formatDate(activity.date);
      streakDays[dateKey] =
        activity.total_activities >= 1 &&
        activity.time_spent_seconds >= 300;
    }

    // Mark freeze days
    for (const freeze of freezes) {
      const dateKey = formatDate(freeze.date);
      freezeDays[dateKey] = true;
    }

    return c.json({ streakDays, freezeDays }, { status: 200 });
  } catch (error) {
    console.error('streak-calendar error:', error);
    return c.json({ error: 'Internal error' }, { status: 500 });
  }
});

export default router;
```

---

## 2. Finals Mode Detection

### Service
```typescript
// services/finals-service.ts
import * as db from '../db.ts';

export type FinalsMode = {
  enabled: boolean;
  reason: 'auto' | 'manual' | 'institutional';
  nextExamDaysAway: number;
  affectedExams: string[];
  professorSetEnd?: Date;
};

export async function detectFinalsMode(
  studentId: string,
  institutionId: string
): Promise<FinalsMode> {
  // 1. Check institutional/professor-set finals period
  const professorFinalsEnd = await db.queryOne(
    `
    SELECT MAX(finals_period_end) as end_date
    FROM finals_periods fp
    WHERE fp.institution_id = $1
      AND fp.course_id IN (
        SELECT course_id FROM study_plans sp
        WHERE sp.student_id = $2
      )
      AND fp.finals_period_end > NOW()
    `,
    [institutionId, studentId]
  );

  if (professorFinalsEnd?.end_date) {
    const daysAway = Math.ceil(
      (new Date(professorFinalsEnd.end_date).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );

    return {
      enabled: true,
      reason: 'institutional',
      nextExamDaysAway: daysAway,
      affectedExams: [],
      professorSetEnd: new Date(professorFinalsEnd.end_date)
    };
  }

  // 2. Auto-detect from exam events (2+ exams within 7 days)
  const upcomingExams = await db.query(
    `
    SELECT exam_event_id, exam_date
    FROM exam_events
    WHERE student_id = $1
      AND exam_date > NOW()
      AND exam_date <= NOW() + interval '7 days'
    ORDER BY exam_date ASC
    `,
    [studentId]
  );

  if (upcomingExams.length >= 2) {
    const nearestExam = upcomingExams[0];
    const daysAway = Math.ceil(
      (new Date(nearestExam.exam_date).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );

    return {
      enabled: true,
      reason: 'auto',
      nextExamDaysAway: daysAway,
      affectedExams: upcomingExams.map(e => e.exam_event_id)
    };
  }

  // 3. Check manual override
  const manualOverride = await db.queryOne(
    `
    SELECT enabled_until
    FROM student_prefs
    WHERE student_id = $1 AND finals_mode_enabled = true
      AND enabled_until > NOW()
    `,
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

export async function getFinalsMode(
  studentId: string
): Promise<FinalsMode | null> {
  // Get institution from user
  const user = await db.queryOne(
    `SELECT institution_id FROM memberships WHERE user_id = $1 LIMIT 1`,
    [studentId]
  );

  if (!user) return null;

  return detectFinalsMode(studentId, user.institution_id);
}
```

### Frontend Hook
```typescript
// hooks/useFinalsMode.ts
export function useFinalsMode() {
  const [finalsMode, setFinalsMode] = useState<FinalsMode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gamificationApi
      .getFinalsMode()
      .then(setFinalsMode)
      .finally(() => setLoading(false));
  }, []);

  return { finalsMode, loading };
}
```

---

## 3. XP Multiplier & Anti-Gaming

### Multiplier Logic
```typescript
// lib/xp-multiplier.ts
export interface StudyActivityStats {
  activeDaysThisWeek: number;
  methodsUsed: Set<'flashcard' | 'quiz' | 'reading'>;
}

export const FINALS_XP_BONUS = {
  baseMultiplier: 1.5,
  consistencyBonus: {
    1: 0,
    2: 0.05,
    3: 0.1,
    4: 0.2,
    5: 0.3,
    6: 0.4,
    7: 0.5
  },
  diversityBonus: {
    1: 0,
    2: 0.1,
    3: 0.25
  }
};

export function computeFinalsMultiplier(
  stats: StudyActivityStats,
  isFinalsWeek: boolean
): number {
  if (!isFinalsWeek) return 1.0;

  let multiplier = FINALS_XP_BONUS.baseMultiplier;

  // Consistency bonus
  const consistencyBonus =
    FINALS_XP_BONUS.consistencyBonus[stats.activeDaysThisWeek] ?? 0;
  multiplier += consistencyBonus;

  // Diversity bonus
  const methodCount = Math.min(3, stats.methodsUsed.size);
  const diversityBonus = FINALS_XP_BONUS.diversityBonus[methodCount] ?? 0;
  multiplier += diversityBonus;

  // Cap at 2.25x
  return Math.min(multiplier, 2.25);
}
```

### XP Award with Safeguards
```typescript
// services/xp-service.ts
export async function awardXPSafe(
  studentId: string,
  amount: number,
  source: XPSource,
  context?: {
    sessionId?: string;
    isFinalsWeek?: boolean;
  }
): Promise<{
  xpGranted: number;
  xpWithMultiplier: number;
  multiplier: number;
  reason?: string;
}> {
  // 1. Check daily cap
  const dailyCap = context?.isFinalsWeek ? 750 : 500;
  const todayXP = await getTodayXP(studentId);

  if (todayXP + amount > dailyCap) {
    return {
      xpGranted: 0,
      xpWithMultiplier: 0,
      multiplier: 0,
      reason: 'daily_cap_reached'
    };
  }

  // 2. Validate session duration (if applicable)
  if (context?.sessionId && source === 'reading_complete') {
    const session = await db.queryOne(
      `SELECT duration_seconds FROM study_sessions WHERE id = $1`,
      [context.sessionId]
    );

    if (!session || session.duration_seconds < 300) {
      return {
        xpGranted: 0,
        xpWithMultiplier: 0,
        multiplier: 0,
        reason: 'session_too_short'
      };
    }
  }

  // 3. Check event throttle
  if (!canEmitXPEvent(studentId)) {
    return {
      xpGranted: 0,
      xpWithMultiplier: 0,
      multiplier: 0,
      reason: 'throttled'
    };
  }

  // 4. Compute multiplier
  let multiplier = 1.0;
  if (context?.isFinalsWeek) {
    const stats = await getStudyActivityStats(studentId);
    multiplier = computeFinalsMultiplier(stats, true);
  }

  const xpWithMultiplier = Math.floor(amount * multiplier);

  // 5. Award XP
  await db.insert('xp_log', {
    student_id: studentId,
    amount: xpWithMultiplier,
    source,
    multiplier,
    created_at: new Date()
  });

  // 6. Update student_stats
  await db.query(
    `UPDATE student_stats SET total_xp = total_xp + $1 WHERE student_id = $2`,
    [xpWithMultiplier, studentId]
  );

  return {
    xpGranted: amount,
    xpWithMultiplier,
    multiplier
  };
}

function getTodayXP(studentId: string): Promise<number> {
  return db.queryOne(
    `
    SELECT COALESCE(SUM(amount), 0) as total
    FROM xp_log
    WHERE student_id = $1 AND DATE(created_at) = CURRENT_DATE
    `,
    [studentId]
  ).then(res => res.total);
}

function canEmitXPEvent(studentId: string): boolean {
  // In-memory throttle (or Redis for distributed)
  const key = `xp-throttle:${studentId}`;
  const count = throttleMap.get(key) ?? 0;

  if (count >= 5) {
    // 5 events per 10 seconds max
    return false;
  }

  throttleMap.set(key, count + 1);
  setTimeout(() => throttleMap.delete(key), 10000);

  return true;
}
```

---

## 4. Badge Triggers

### Study Plan Creation Trigger
```typescript
// services/study-plan-service.ts
export async function createStudyPlanWithBadgeCheck(
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

  // Trigger badge checks
  await Promise.all([
    checkBadgeSobreviviente(studentId),
    planData.exam_event_id
      ? checkBadgeCeroPanico(studentId, planData.exam_event_id)
      : Promise.resolve()
  ]);

  return plan;
}

async function checkBadgeSobreviviente(
  studentId: string
): Promise<void> {
  // Already earned?
  const earned = await db.queryOne(
    `
    SELECT id FROM student_badges
    WHERE student_id = $1 AND badge_id = 'badge_sobreviviente'
    `,
    [studentId]
  );

  if (earned) return;

  // Count review plans this week
  const count = await db.queryOne(
    `
    SELECT COUNT(*) as count FROM study_plans
    WHERE student_id = $1
      AND is_finals_plan = true
      AND DATE_PART('week', created_at) = DATE_PART('week', NOW())
      AND DATE_PART('year', created_at) = DATE_PART('year', NOW())
    `,
    [studentId]
  );

  if (count.count >= 3) {
    await db.insert('student_badges', {
      student_id: studentId,
      badge_id: 'badge_sobreviviente',
      earned_at: new Date()
    });

    // Queue notification
    await queueNotification(studentId, {
      type: 'badge_earned',
      badge: BADGES.badge_sobreviviente,
      animation: 'full_reveal'
    });
  }
}

async function checkBadgeCeroPanico(
  studentId: string,
  examEventId: string
): Promise<void> {
  const earned = await db.queryOne(
    `
    SELECT id FROM student_badges
    WHERE student_id = $1 AND badge_id = 'badge_cero_panico'
    `,
    [studentId]
  );

  if (earned) return;

  const exam = await db.queryOne(
    `SELECT exam_date FROM exam_events WHERE id = $1`,
    [examEventId]
  );

  if (!exam) return;

  const daysUntil = Math.floor(
    (new Date(exam.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntil >= 15) {
    await db.insert('student_badges', {
      student_id: studentId,
      badge_id: 'badge_cero_panico',
      earned_at: new Date()
    });

    await queueNotification(studentId, {
      type: 'badge_earned',
      badge: BADGES.badge_cero_panico,
      animation: 'full_reveal'
    });
  }
}
```

### Daily Batch Check (Cron)
```typescript
// cron/daily-badge-checks.ts
export async function checkDailyBadges(): Promise<void> {
  // Run every 11:59 PM UTC

  // Get all active students
  const students = await db.query(
    `
    SELECT DISTINCT student_id FROM study_sessions
    WHERE DATE(created_at) = CURRENT_DATE
    `
  );

  for (const student of students) {
    await checkBadgeMaraton(student.student_id);
  }
}

async function checkBadgeMaraton(studentId: string): Promise<void> {
  const earned = await db.queryOne(
    `
    SELECT id FROM student_badges
    WHERE student_id = $1 AND badge_id = 'badge_maraton'
    `,
    [studentId]
  );

  if (earned) return; // Only unlock once

  // Check if finals mode is active
  const finalsMode = await detectFinalsMode(studentId, ...);
  if (!finalsMode.enabled) return;

  // Sum study time today
  const sessions = await db.query(
    `
    SELECT SUM(duration_seconds) as total_seconds
    FROM study_sessions
    WHERE student_id = $1 AND DATE(started_at) = CURRENT_DATE
    `,
    [studentId]
  );

  const hours = (sessions[0].total_seconds || 0) / 3600;

  if (hours >= 4) {
    await db.insert('student_badges', {
      student_id: studentId,
      badge_id: 'badge_maraton',
      earned_at: new Date()
    });

    await queueNotification(studentId, {
      type: 'badge_earned',
      badge: BADGES.badge_maraton,
      animation: 'full_reveal'
    });
  }
}
```

---

## 5. Animations

### Tailwind Configuration
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      animation: {
        'streak-pulse': 'streakPulse 1.5s ease-out',
        'streak-bloom': 'streakBloom 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'badge-spin': 'badgeSpin 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'confetti-fall': 'confettiFall 2s ease-out forwards',
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
        },
        badgeSpin: {
          '0%': { transform: 'scale(0) rotateZ(-180deg)', opacity: '0' },
          '100%': { transform: 'scale(1) rotateZ(0deg)', opacity: '1' },
        },
        confettiFall: {
          to: {
            transform: 'translateY(100vh)',
            opacity: '0',
          },
        },
      },
    },
  },
};
```

### Badge Reveal (Framer Motion)
```typescript
// components/gamification/BadgeReveal.tsx
import { motion } from 'framer-motion';
import { Badge } from '@/types/gamification';

interface BadgeRevealProps {
  badge: Badge;
  onDismiss: () => void;
}

export const BadgeReveal = ({ badge, onDismiss }: BadgeRevealProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }}
        className="bg-white rounded-lg p-8 text-center shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Icon with continuous rotation */}
        <motion.div
          className="text-8xl mb-4 mx-auto"
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          {badge.icon}
        </motion.div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {badge.name}
        </h2>

        <p className="text-gray-600 mb-6">{badge.description}</p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onDismiss}
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
        >
          Awesome! 🎉
        </motion.button>
      </motion.div>
    </motion.div>
  );
};
```

### Confetti Animation
```typescript
// components/gamification/ConfettiAnimation.tsx
import { motion } from 'framer-motion';

interface ConfettiAnimationProps {
  count?: number;
  duration?: number;
}

export const ConfettiAnimation = ({
  count = 20,
  duration = 2
}: ConfettiAnimationProps) => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <Confetti key={i} duration={duration} index={i} />
      ))}
    </div>
  );
};

function Confetti({
  duration,
  index
}: {
  duration: number;
  index: number;
}) {
  const startX = Math.random() * window.innerWidth;
  const startY = window.innerHeight * 0.5;
  const offsetX = (Math.random() - 0.5) * 400;
  const offsetY = Math.random() * 300 + 100;
  const rotate = Math.random() * 360;

  return (
    <motion.div
      initial={{
        x: startX,
        y: startY,
        opacity: 1,
        rotate: 0
      }}
      animate={{
        x: startX + offsetX,
        y: startY + offsetY,
        opacity: 0,
        rotate: rotate
      }}
      transition={{
        duration,
        delay: (index % 5) * 0.05,
        ease: 'easeOut'
      }}
      className={`absolute w-3 h-3 ${
        index % 3 === 0
          ? 'bg-green-500'
          : index % 3 === 1
          ? 'bg-blue-500'
          : 'bg-amber-500'
      }`}
      style={{
        borderRadius: Math.random() > 0.5 ? '50%' : '0%'
      }}
    />
  );
}
```

---

## 6. Database Schema

### Migrations
```sql
-- Migration: 001_finals_tables.sql
CREATE TABLE finals_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  course_id UUID NOT NULL,
  finals_period_start DATE NOT NULL,
  finals_period_end DATE NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

CREATE TABLE streak_freeze_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  date DATE NOT NULL,
  used_at TIMESTAMP DEFAULT now(),

  UNIQUE(student_id, date),
  FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE exam_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_id UUID NOT NULL,
  exam_name TEXT NOT NULL,
  exam_date TIMESTAMP NOT NULL,
  exam_type VARCHAR(20),
  location TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Alter study_plans table
ALTER TABLE study_plans
ADD COLUMN is_finals_plan BOOLEAN DEFAULT false,
ADD COLUMN exam_event_id UUID REFERENCES exam_events(id),
ADD COLUMN finals_mode_active BOOLEAN DEFAULT false;

-- Indexes
CREATE INDEX idx_finals_periods_institution_course
  ON finals_periods(institution_id, course_id);

CREATE INDEX idx_exam_events_student_date
  ON exam_events(student_id, exam_date);

CREATE INDEX idx_exam_events_course_date
  ON exam_events(course_id, exam_date);

CREATE INDEX idx_study_plans_finals
  ON study_plans(student_id, is_finals_plan, exam_event_id);

CREATE INDEX idx_study_plans_exam_event
  ON study_plans(exam_event_id);

CREATE INDEX idx_streak_freeze_student_date
  ON streak_freeze_usage(student_id, date);
```

---

## 7. Testing

### Unit Tests (Vitest)
```typescript
// tests/finals-mode.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { detectFinalsMode } from '@/services/finals-service';

describe('Finals Mode Detection', () => {
  it('detects finals when 2+ exams within 7 days', async () => {
    const result = await detectFinalsMode('student-1', 'institution-1');
    expect(result.enabled).toBe(true);
    expect(result.reason).toBe('auto');
  });

  it('ignores single exam', async () => {
    const result = await detectFinalsMode('student-2', 'institution-1');
    expect(result.enabled).toBe(false);
  });

  it('respects professor-set finals period', async () => {
    const result = await detectFinalsMode('student-3', 'institution-1');
    expect(result.enabled).toBe(true);
    expect(result.reason).toBe('institutional');
  });

  it('returns daysAway correctly', async () => {
    const result = await detectFinalsMode('student-1', 'institution-1');
    expect(result.nextExamDaysAway).toBeGreaterThan(0);
  });
});

describe('XP Multiplier', () => {
  it('applies 1.5x base during finals', () => {
    const stats = {
      activeDaysThisWeek: 1,
      methodsUsed: new Set(['flashcard'])
    };
    const mult = computeFinalsMultiplier(stats, true);
    expect(mult).toBe(1.5);
  });

  it('adds consistency bonus for 5+ days', () => {
    const stats = {
      activeDaysThisWeek: 5,
      methodsUsed: new Set(['flashcard'])
    };
    const mult = computeFinalsMultiplier(stats, true);
    expect(mult).toBe(1.5 + 0.3); // 1.8
  });

  it('caps at 2.25x', () => {
    const stats = {
      activeDaysThisWeek: 7,
      methodsUsed: new Set(['flashcard', 'quiz', 'reading'])
    };
    const mult = computeFinalsMultiplier(stats, true);
    expect(mult).toBe(2.25);
  });
});
```

---

**End of Technical Specs**
