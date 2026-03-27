# Gamification × Calendar: Key Design Decisions

**Decision log for Axon finals season gamification (Tiers D, J, O)**

---

## Decision 1: Streak Completion Definition

**Option A:** Minimum 5 minutes of study
**Option B:** Any activity (count-based)

**Decision:** Option A (5-minute minimum)

**Rationale:**
- Prevents gaming: Tapping the app 100 times doesn't count
- Mobile-friendly: Accounts for accidental opens
- Aligns with pedagogical reality: 5-minute reviews have proven efficacy in spaced repetition
- Data source: `daily_activities.time_spent_seconds >= 300` is already tracked

**Alternative if Petrick prefers lenient:** Use `activity_count >= 1` instead. Test with 10% of users.

---

## Decision 2: Finals Detection Approach

**Option A:** Manual toggle only
**Option B:** Auto-detect when exam ≤ 7 days
**Option C:** Professor designates "finals period"
**Decision:** Hybrid (C primary, B as fallback, A as override)

**Rationale:**
- **C (Institutional)** is most reliable: professors know when finals happen
- **B (Auto-detect)** prevents false positives by requiring 2+ exams in 7 days
- **A (Manual)** allows early starters to opt-in without gaming the system
- Edge case handled: Student with 1 exam in 7 days won't trigger finals mode (not a "season")

**When to escalate to user:** If neither C nor B applies, show toggle: "Are you in finals week? Enable x2 XP."

---

## Decision 3: XP Multiplier Strategy

**Option A:** Simple 2x multiplier
**Option B:** 1.5x base + bonuses for consistency/diversity
**Decision:** Option B (1.5x + bonuses)

**Rationale for B:**
- **Prevents cramming:** Single long day gets 1.5x, not 2x
- **Incentivizes real study:** Mixing flashcards + quiz + reading gets +0.25 bonus
- **Sustainable:** 1.5x feels "generous" without breaking the economy
- **Psychological:** Earning 1.8x through consistency feels more rewarding than 2x handed out
- **Max cap:** 2.25x feels natural (not exploitable)

**Trade-off:** Slightly more complex, but UX still simple (students don't need to understand formula, just see the number).

---

## Decision 4: Finals Badges

**Three finals badges chosen:**

| Badge | Why This One | Why Not Alternatives |
|---|---|---|
| **Sobreviviente** (3+ review plans) | Celebrates persistence through high-stress week | Too easy if just one plan counts |
| **Maratón** (4+ hours/day) | Peak effort, rare achievement, big celebration | Could encourage unhealthy all-nighters |
| **Cero Pánico** (start 15+ days early) | Rewards proactive planning, reduces anxiety | 7 days is too tight; 21 days is too easy |

**Why not other ideas:**
- "Exam Crusher (Pass exam)": Requires user input we don't have; also celebrates luck vs. effort
- "Social Study (group mode)": Tier O feature, separate from these three
- "Perfect Week (7 days straight)": Too hard, could cause stress if broken by life events

---

## Decision 5: Celebration Frequency Throttle

**Option A:** No throttle (celebrate every badge, every milestone)
**Option B:** Throttle by type (badge every 60s, confetti every 30s)

**Decision:** Option B

**Rationale:**
- Duolingo research: Celebration fatigue is real
- Too many animations = annoying, no longer rewarding
- Throttle allows multiple celebrations without spam

**Throttle values chosen:**
- Badge earned: max 1 per minute (won't get 2 badges in 1 min)
- Confetti: max 1 per 30 seconds (could fire from streak + other sources)
- Streak pulse: no throttle (only fires once per day, max)

---

## Decision 6: Streak Freeze UX

**Option A:** Show freeze as different colored dot
**Option B:** Show freeze as emoji (❄️)
**Option C:** Show freeze as blue background

**Decision:** Option B + light background

**Rationale:**
- Emoji ❄️ is universally understood (doesn't need localization)
- Position: bottom-left (doesn't overlap with activity dot, top-right)
- Light blue background signals "safe" (not danger like red)
- Psychological: Freeze day should feel less important than active study days

**Why not A:** Confuses visual hierarchy (looks like two dots)
**Why not C alone:** Background alone is too subtle, might be missed

---

## Decision 7: Leaderboard Integration in Calendar

**Option A:** Show "X classmates studying now" (social pressure)
**Option B:** Show nothing (pure study focus)
**Option C:** Optional toggle (let students choose)

**Decision:** Option C (optional)

**Rationale:**
- **Respect individual psychology:** Some students are motivated by social proof; others find it stressful
- **Finals are high-stress:** Don't force social comparison during peak anxiety
- **Opt-in option:** Doesn't add complexity; setting is simple toggle
- **Minimal implementation:** Just fetch count every 30s, don't show rankings

**Constraint:** This indicator should ONLY show presence ("others here"), never performance ("ranked higher than you").

---

## Decision 8: Animation Technology Stack

**Option A:** Framer Motion for everything
**Option B:** CSS-only (Tailwind)
**Option C:** Hybrid (CSS for lightweight, Framer for complex)

**Decision:** Option C

**Rationale:**
- CSS for streak dot pulse: ~0.2 KB gzipped, no JS overhead
- Framer for badge reveal + confetti: complex choreography needs fine control
- Hybrid is performant: Reduces JS bundle, keeps animations smooth
- Mobile-friendly: CSS animations don't block main thread

**Animation targets:**
- Streak dot pulse: Tailwind CSS animation
- Confetti burst: Framer Motion (25 particles, staggered)
- Badge reveal: Framer Motion (icon rotation + scale + exit)
- XP popup: Existing system (keep as-is)

---

## Decision 9: Finals Mode Detection Priority

**Auto-detect vs. Institutional vs. Manual — which takes precedence?**

**Order of precedence:**
1. Institutional (professor set) — most authoritative
2. Auto-detect (2+ exams in 7 days) — automatic safety net
3. Manual override (student toggle) — allows early starters

**Rationale:**
- Institutional is fact-based (professor knows the calendar)
- Auto-detect is objective (exam dates are events, not opinions)
- Manual is for edge cases (student confident about approaching finals)

**Example flows:**
```
Case 1: Professor set finals 7/1-7/15, student has 3 exams that week
  → Use institutional (7/1-7/15 is the authority)

Case 2: No institutional deadline, but 2 exams on 7/5 and 7/8
  → Use auto-detect (trigger on 6/28 when within 7 days)

Case 3: Only 1 exam on 7/20, student wants to start studying now
  → Allow manual toggle (shows toggle in settings during June)
```

---

## Decision 10: Anti-Gaming Safeguard Priority

**Which validation is most important?**

**Priority order:**
1. **Session duration check** (prevent 5-second reviews)
2. **Daily XP cap** (existing system, maintain it)
3. **Activity diversity** (prevent 100 single-card reviews)
4. **Event throttle** (prevent API spam)

**Rationale:**
1. Session duration is pedagogically sound (5-min minimum is research-backed)
2. Daily cap prevents burnout (existing constraint, honored)
3. Diversity prevents low-effort farming (only real study gets bonus)
4. Throttle is technical safeguard (prevents DDoS-like behavior)

**Which could be removed if budget tight:**
- Diversity check (less critical, harder to game)
- Event throttle (mostly preventive, rare in practice)

**Which are essential:**
- Session duration & daily cap (pedagogical + safety)

---

## Decision 11: Finals Banner (UX/Timing)

**Option A:** Banner shows all day during finals
**Option B:** Banner shows once per day, user can dismiss
**Option C:** Banner only on first login of finals week

**Decision:** Option B

**Rationale:**
- Shows every day (keeps it top-of-mind)
- Dismissible (respects user who understands x2 already)
- Doesn't reappear until next calendar day (non-invasive)
- Storage: `localStorage['finals-banner-{YYYY-MM-DD}']` tracks dismissal

**Visual design:**
- Amber/gold color (celebratory, not alarm)
- Icon: ⚡ (energy/power, signals something special)
- Text: "Finals Week Mode: All XP x2!"
- Subtext: Shows end date if institutional (respect boundaries)

---

## Decision 12: Badge Trigger Points (When to Evaluate?)

**Option A:** Only on study events (quiz complete, flashcard review)
**Option B:** Only on daily cron job (11:59 PM)
**Option C:** Multiple trigger points (on plan create + daily batch)

**Decision:** Option C

**Rationale:**
- "Sobreviviente" triggers on `POST /study-plans` (immediate reward)
- "Cero Pánico" triggers on `POST /study-plans` (immediate reward)
- "Maratón" triggers on daily cron (batch check at EOD)

**Why C:**
- Immediate feedback for plan creation (students see badge instantly)
- Batch check for daily goal (respects timezone differences)
- No redundant queries (each badge evaluated once)

---

## Decision 13: Data Source for Streak Overlay

**Option A:** Reconstruct from `study_sessions` on demand
**Option B:** Use pre-computed `daily_activities` table
**Option C:** Use both (fallback if one unavailable)

**Decision:** Option B (primary)

**Rationale:**
- `daily_activities` is already computed by `sessionAnalytics.ts`
- One query per month (not per session)
- Guaranteed to be consistent with XP cap logic (same source of truth)
- Includes time-spent-seconds (our completion metric)

**Fallback:** If `daily_activities` missing, log warning but don't break calendar (show empty overlay).

---

## Decision 14: Finals Mode Duration

**Option A:** Auto-disable after last exam
**Option B:** Respect professor deadline (even if exams end early)
**Option C:** Student-controlled, with max 4-week limit

**Decision:** Option B (if institutional), Option A (if auto-detect)

**Rationale:**
- **Institutional:** Honor the designated period (professor may have reasons)
- **Auto-detect:** Turn off after last exam (students can re-enable if needed)
- Prevents: Finals mode staying on indefinitely by accident

**Example:**
```
Professor set: 7/1-7/15
Last exam: 7/12
→ Finals mode OFF on 7/16 (respects deadline)

Auto-detect: 2 exams on 7/5 and 7/8
→ Finals mode OFF on 7/9 (day after last exam)
```

---

## Decision 15: Mobile Calendar UX

**Streak dots work on desktop, but on mobile (small screens)?**

**Option A:** Replace dots with heatmap colors (simpler mobile UX)
**Option B:** Keep dots, make them larger on mobile
**Option C:** Hide dots on mobile, show only in heatmap view

**Decision:** Option A (responsive design)

**Rationale:**
- Mobile: Use cell background color (heatmap intensity)
- Desktop: Use dots + background (richer info)
- No cognitive overload on small screens
- Heatmap is more information-dense anyway

**Responsive breakpoints:**
```typescript
// Mobile (<640px): Heatmap only
// Tablet (640-1024px): Dots + background
// Desktop (>1024px): Dots + background + hover tooltips
```

---

## Summary: Key Principles

### **1. Celebrate the hard thing, not the easy thing**
- Studying for 4 hours → big celebration (confetti)
- Opening app 20 times → no reward (throttled)
- Planning ahead (Cero Pánico) → badge + animation

### **2. Make finals mode feel special without stressing**
- x2 XP is notable, not shocking
- Multiplier bonuses reward sustained effort, not cramming
- Social indicators are opt-in (no forced comparison)

### **3. Respect exam psychology**
- Finals are already stressful
- Don't add celebration fatigue
- Throttle animations, keep interface calm
- Allow early starters without penalty

### **4. Honor professor authority**
- If professor sets finals period, use it
- Institution is more reliable than auto-detection
- But auto-detect works as safety net

### **5. Safeguard against gaming**
- Multiple layers: session duration + diversity + throttle
- XP economy should survive finals x2 without breaking
- Activity validation is invisible to honest users

---

**Status:** Ready for implementation
**Priority:** Streak overlay (Tier D) first, then finals detection (Tier J), then animations
**Next:** Review with Petrick, schedule agent work
