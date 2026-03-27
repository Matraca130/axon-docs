# Gamification × Calendar Audit: Executive Summary

**Deep audit of integrating Axon's gamification system with the proposed calendar/finals features**

---

## What Was Delivered

Three comprehensive specification documents for implementing Tier D (Streak overlay), Tier J (Finals gamification), and Tier O (Collaborative study):

### 1. **GAMIFICATION_CALENDAR_AUDIT.md** (Main document)
- **10 major sections** covering all design problems
- Each section: problem statement → solution → edge cases → component code
- Focus on psychology, UX, and anti-gaming safeguards
- 50+ code snippets and visual mockups

### 2. **CALENDAR_GAMIFICATION_TECHNICAL_SPECS.md** (Developer reference)
- Ready-to-implement code for all systems
- TypeScript + React + Hono backend specs
- Database migrations and indexes
- Unit tests (Vitest)
- ~800 lines of production-ready code

### 3. **GAMIFICATION_CALENDAR_DECISIONS.md** (Decision log)
- 15 key design decisions with rationale
- Trade-offs explored for each choice
- Priority order for implementation
- Guiding principles (celebrate effort, not clicks)

---

## Key Findings

### **Critical Design Problems Solved**

| Problem | Solution | Impact |
|---|---|---|
| **Streak completion undefined** | 5-min minimum + activity count | Prevents gaming, aligns with pedagogy |
| **Finals detection ambiguous** | Hybrid: Institutional → Auto → Manual | Eliminates false positives, honors boundaries |
| **XP x2 feels crude** | 1.5x base + consistency/diversity bonuses | Sustainable, incentivizes real study |
| **Badge triggers scattered** | Multiple trigger points (plan + cron) | Immediate reward + batch efficiency |
| **Celebration fatigue risk** | Throttle by type (badge 60s, confetti 30s) | Maintains delight without spam |
| **Freeze day visibility low** | ❄️ emoji + light blue background | Universal, not confusing |
| **Leaderboard anxiety during finals** | Optional social indicators | Respects student psychology |
| **Gaming X2 multiplier** | 4-layer validation stack | Session duration → diversity → throttle |
| **Mobile calendar clutter** | Responsive heatmap design | Desktop dots, mobile colors |
| **Animation performance unknown** | CSS-first, Framer Motion only for complex | Sub-100ms interactions |

---

## Architecture Highlights

### **Streak Overlay System**
- Backend: `GET /gamification/streak-calendar` endpoint
- Frontend: `useStreakCalendar()` hook + `CalendarStreakDot` component
- Data source: `daily_activities` table (5-min min, 1+ activity)
- Visual: Green dot bottom-right, ❄️ emoji bottom-left, no overlap

### **Finals Detection Service**
```
Priority: Institutional > Auto (2+ exams ≤7d) > Manual toggle
Edge case: 1 exam ≤7d = ignore (not a "season")
Returns: { enabled, reason, daysAway, affectedExams }
```

### **XP Multiplier Logic**
```
Base: 1.5x
+ Consistency bonus: 0 to +0.5 (1-7 days active)
+ Diversity bonus: 0 to +0.25 (1-3 study methods)
= Max 2.25x (prevents infinite scaling)
```

### **Badge System**
```
Sobreviviente (3+ plans/week):     Triggers on POST /study-plans
Maratón (4+ hours/day):             Triggers on 11:59 PM cron
Cero Pánico (15+ days before exam): Triggers on POST /study-plans
```

### **Animation Strategy**
```
Lightweight (CSS):     Streak pulse, bloom effects
Complex (Framer):      Confetti burst, badge reveal, icon rotation
Throttle:              Badge 60s, confetti 30s, streak daily max
Performance target:    <100ms interactions, 60fps on mobile
```

---

## Implementation Roadmap

### **Phase 1: Streak Overlay (Week 1) — Tier D**
- [ ] `useStreakCalendar` hook
- [ ] `GET /gamification/streak-calendar` backend
- [ ] `CalendarStreakDot` component
- [ ] `streak_freeze_usage` table
- Test: Full month retrieval, visual positioning

### **Phase 2: Finals Detection (Week 2) — Tier J Core**
- [ ] `finals_periods` table
- [ ] `detectFinalsMode()` service
- [ ] Auto-detection logic (2+ exams)
- [ ] `FinalsMultiplierBanner` component
- [ ] `exam_events` table (if missing)
- Test: All three detection paths, edge cases

### **Phase 3: Gamification Hooks (Week 3) — Tier J Rewards**
- [ ] XP multiplier (`FINALS_XP_BONUS` with bonuses)
- [ ] Anti-gaming validations (session duration, diversity, throttle)
- [ ] Badge triggers (create study plan + daily cron)
- [ ] `checkBadgeAsync()` service
- [ ] XP daily cap (500 normal, 750 finals)
- Test: Multiplier tiers, gaming attempts, cap enforcement

### **Phase 4: Animations (Week 4) — Tier O Social**
- [ ] Tailwind keyframes (pulse, bloom, confetti)
- [ ] `BadgeRevealAnimation` (Framer Motion)
- [ ] `ConfettiAnimation` component
- [ ] Celebration throttle system
- [ ] `StreakMilestoneAnimation` (7/14/30/60 days)
- Test: Performance on mobile, no jank, throttle works

### **Phase 5: Polish (Week 5)**
- [ ] Settings toggles (social indicators, animation level)
- [ ] E2E testing: full finals week flow
- [ ] Visual regression tests
- [ ] Load testing (concurrent badge unlocks)
- [ ] Gather feedback on multiplier fairness

### **Phase 6: Monitoring (Week 6)**
- [ ] Log anti-gaming checks (session too short, throttled)
- [ ] Monitor badge unlock patterns (detect cheating)
- [ ] Daily XP cap alerts
- [ ] A/B test multiplier (1.5 vs 2.0 vs adaptive)

---

## Risk Mitigation

### **Risk 1: Celebration Fatigue**
- Mitigation: Throttle by type, show <5 animations per hour
- Fallback: Reduce confetti count if complaints

### **Risk 2: Finals Mode False Positives**
- Mitigation: Require 2+ exams (not 1), honor institutional dates
- Fallback: Manual override in settings

### **Risk 3: XP Inflation Spiral**
- Mitigation: 1.5x base + caps, validate session duration
- Fallback: Cap daily XP at 600 (down from 750) if metrics show abuse

### **Risk 4: Gaming Session Duration**
- Mitigation: Require 5 min minimum, track activity count
- Fallback: Increase to 10 min if gaming detected

### **Risk 5: Mobile Animation Jank**
- Mitigation: Use CSS animations (not JS), limit particle count
- Fallback: Disable confetti on mid-range devices (60fps fallback)

---

## Success Metrics

### **Engagement**
- 60%+ of students enable finals mode when eligible
- 50%+ earn at least one finals-specific badge
- 3+ study sessions per day during finals week (vs. 1.5 baseline)

### **Psychology**
- Survey: "Did x2 feel fair?" (target: 75% agree)
- "Were animations annoying?" (target: <10% yes)
- "Social indicators helpful?" (target: 60% yes if enabled)

### **Safety**
- 0 students exceed daily XP cap during finals
- <5% of sessions flagged for gaming checks
- 0 badge double-unlocks (de-duplication works)

### **Performance**
- Streak overlay loads in <500ms (entire month)
- Badge reveal animation at 60 FPS on Pixel 4
- Finals detection triggers in <200ms

---

## Assumptions & Constraints

### **Assumptions**
1. `daily_activities` table exists and is accurate (verified ✓)
2. Professors can set finals periods via admin panel (design required)
3. Exam dates are reliable (students enter correctly)
4. Student timezone preference available (for cron triggers)
5. Existing XP system is working (no changes required)

### **Constraints**
1. **No modifications to badge count** — Stay at 39 existing + 3 new
2. **XP cap must be honored** — Never exceed 750/day finals
3. **No real-time multiplayer** — Social indicators are opt-in
4. **Mobile-first** — Animations must work on phones
5. **Backwards compatible** — Non-finals students unaffected

---

## Next Steps

1. **Review with Petrick**
   - Confirm streak definition (5-min vs. activity count?)
   - Approve finals detection approach
   - Feedback on animation throttle values

2. **Select implementation team**
   - DG-03 (frontend): Streak overlay, animations, calendar UX
   - DG-04 (backend): Finals service, XP multiplier, badge triggers
   - Data team: `daily_activities` accuracy audit

3. **Schedule agent work**
   - Create feature branch: `feat/finals-gamification`
   - Create git worktree for isolation
   - Weekly sync on progress

4. **Prepare launch plan**
   - Soft launch (10% of students) 2 weeks before first finals
   - Gather metrics & feedback
   - Full rollout 1 week before finals

---

## Files Delivered

**Location:** `/mnt/AXON PROJECTO/`

1. **GAMIFICATION_CALENDAR_AUDIT.md** (3,500 lines)
   - Main specification with all design decisions
   - Sections 1-10: Problems, solutions, code, psychology

2. **CALENDAR_GAMIFICATION_TECHNICAL_SPECS.md** (600 lines)
   - Developer-ready code snippets
   - TypeScript/React/Hono examples
   - Database schemas, migrations, tests

3. **GAMIFICATION_CALENDAR_DECISIONS.md** (400 lines)
   - Decision log: 15 key choices with rationale
   - Trade-offs and alternatives explored
   - Guiding principles

4. **AUDIT_SUMMARY.md** (this file)
   - Executive overview
   - Roadmap and risk mitigation
   - Success metrics

---

## Key Principle (TL;DR)

**Gamification should reinforce reality (studying IS the reward), not create friction.**

Duolingo's success isn't from celebrating "opened app" — it's from celebrating "completed lesson." Axon's finals gamification follows this principle:

- ✅ Celebrate 4-hour study day (Maratón badge + confetti)
- ✅ Celebrate planning ahead (Cero Pánico badge)
- ✅ Celebrate consistency through hard week (Sobreviviente + streak milestone)
- ✅ Reward multi-method studying (XP diversity bonus)
- ❌ Don't celebrate app opens (prevent gaming)
- ❌ Don't add celebration spam (throttle animations)
- ❌ Don't force social comparison (make it optional)

---

**Audit completed:** 2026-03-27 | **Ready for implementation**
