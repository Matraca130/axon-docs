# DEEP AUDIT: FSRS v4 + BKT v4 Integration with Calendar Features
## Axon/Seeki Learning Management System

**Audit Date:** March 27, 2026  
**Auditor Role:** Learning Science + Spaced Repetition Algorithms Expert  
**Platform:** Axon (Medical LMS) — React 18 + Hono/Deno + PostgreSQL + pgvector  
**Scope:** Calendar-aware scheduling, exam readiness prediction, workload forecasting, algorithm stability

---

## Executive Summary

Axon currently integrates FSRS v4 (forgetting-curve spaced repetition) and BKT v4 (Bayesian knowledge tracing) for adaptive learning, with a emerging calendar system for exam dates and study planning. This audit identifies **7 critical learning-science questions** that determine whether calendar features preserve algorithm correctness while enabling exam-aware scheduling.

**Key Finding:** The platform has a sound foundation (dual-algorithm adaptive learning, NeedScore ranking, BKT aggregation), but calendar integration risks include:
- **Heatmap accuracy:** FSRS due_at assumes on-time reviews; overdue cards break this assumption
- **Exam-date collision:** Capping due_at could destabilize FSRS difficulty/stability estimates
- **Readiness aggregation:** BKT p_know has no standard weighted-average formula defined
- **Workload forecasting:** No predictive model exists for future review demand
- **BKT decay:** Knowledge degrades over time, but calendar doesn't account for this

---

## Context: Current Algorithms & Data Model

### 1.1 FSRS v4 (Forgetting Curve Spaced Repetition)

**Algorithm:** Optimized spaced repetition with 17 weight parameters.

**Key constants (from agent-memory):**
```
w8 = 1.10   (easy factor base)
w11 = 2.18  (hard penalty)
w15 = 0.29  (difficulty modifier)
w16 = 2.61  (stability multiplier)
```

**State per card (fsrs_states table):**
- `due_at` — DATETIME when card next reviews
- `stability` — Days until 50% chance of forgetting (interval)
- `difficulty` — 1-10 estimate of intrinsic card hardness
- `reps` — Total repetitions
- `lapses` — Times forgotten
- `state` — "new" | "learning" | "review" | "relearning"

**Critical assumption:** Students review cards ON their due_at date. If overdue:
- Stability is artificially inflated (days-overdue are not reps)
- Difficulty can drift (late reviews appear "easy" because forgetting is incomplete)
- Next due_at is scheduled from today, not from ideal spacing window
- Algorithm state (reps, lapses) remains valid, but timing predictions become unreliable

### 1.2 BKT v4 (Bayesian Knowledge Tracing)

**Algorithm:** Probabilistic model of knowledge state.

**State per subtopic (bkt_states table):**
- `p_know` — Probability student knows the concept [0, 1]
- `max_p_know` — Peak p_know ever achieved
- `total_attempts` — Review count
- `correct_attempts` — Successes
- `delta` — Rate of change per attempt
- `last_updated_at` — Timestamp of last review

**Update rule (simplified BKT v4 filter):**
```
posterior_p_know = P(Know | Correct)
                 = (p_know * p_correct_given_know) / 
                   (p_know * p_correct_given_know + (1 - p_know) * p_correct_given_guess)

Typical parameters:
  p_correct_given_know = 0.95  (prob. correct if knows)
  p_correct_given_guess = 0.25 (prob. correct if guesses)
  p_transit = 0.10             (prob. knowledge gained per attempt)
```

**Critical assumption:** Knowledge is static between reviews. In reality, it decays over time (weeks/months), but BKT requires active review to update. Decay is NOT modeled in standard BKT — calendar predictions must account for this separately.

### 1.3 Current NeedScore Formula

**Study queue ranking (routes-study-queue.ts):**
```
NeedScore = 0.40*overdue + 0.30*(1 - p_know) + 0.20*fragility + 0.10*novelty

where:
  overdue ∈ [0, 1]         — days overdue / max(days_overdue)
  p_know ∈ [0, 1]          — BKT knowledge state
  fragility ∈ [0, 1]       — 1 / stability (FSRS)
  novelty ∈ [0, 1]         — 1 if never seen, 0 if mastered
```

This is a **composite score** without exam awareness. Good for daily scheduling, insufficient for exam prep.

### 1.4 Data Tables Referenced

| Table | Key Columns | Purpose |
|-------|--|--|
| `fsrs_states` | card_id, due_at, stability, difficulty, reps, lapses | Individual card scheduling |
| `bkt_states` | subtopic_id, p_know, max_p_know, total_attempts | Subtopic mastery |
| `exams` (proposed) | exam_id, student_id, course_id, exam_date, exam_type | Exam calendar |
| `study_sessions` | student_id, started_at, duration_minutes, cards_correct | Study activity log |
| `daily_activities` | student_id, activity_date, cards_reviewed, streaks | Daily aggregates |
| `reviews` | card_id, student_id, grade (1-5), review_date | Individual review history |

---

## AUDIT: Seven Critical Learning-Science Questions

### Q1: Heatmap Data Accuracy — Due vs. Projected Workload

**Question:** When displaying review load per day in a calendar heatmap, should we show:
- **(A)** Scheduled due_at dates (what FSRS planned)?
- **(B)** Projected actual reviews (accounting for student's historical timeliness)?
- **(C)** Something else?

#### Current State
The calendar doc (ideas-calendario-finales-argentina.md) mentions:
> "Workload Heatmap — show per-day review load from fsrs_states.due_at"

This implies option (A): raw due_at dates.

#### Analysis

**Option A Risks:**
1. **Overdue bias:** If a student is chronically overdue (e.g., 70% of reviews are 2-3 days late), the heatmap shows an "ideal" workload that never materializes. False sense of preparedness.
2. **Burnout prediction fails:** A heatmap showing 50 cards due Friday is misleading if the student typically reviews on Sunday.
3. **Exam week misalignment:** If cards cluster on exam day (due_at = exam_date), the heatmap shows a spike that won't actually occur.

**Option B Benefits:**
1. **Realistic workload forecast:** Adjust due_at by student's typical delay (e.g., due_at + 2 days).
2. **Personalized prep:** Students see their *actual* study pattern, not the algorithm's intent.
3. **Exam planning:** Reverse-plan from exam date with realistic delays baked in.

#### Recommendation

**Use Option B for Tier 1 heatmap; add transparency layer:**

```sql
-- For each student, calculate review timeliness profile
SELECT
  student_id,
  ROUND(AVG(EXTRACT(DAY FROM (review_date - due_at)))::numeric, 1) 
    AS avg_days_late,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY EXTRACT(DAY FROM (review_date - due_at)))
    AS pct_25_delay,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY EXTRACT(DAY FROM (review_date - due_at)))
    AS pct_75_delay,
  COUNT(*) AS total_reviews
FROM fsrs_states fs
JOIN reviews r ON fs.card_id = r.card_id
WHERE r.review_date IS NOT NULL
  AND r.student_id = ? 
  AND r.review_date > NOW() - INTERVAL '90 days'
GROUP BY student_id;
```

**Then project workload:**
```sql
-- Projected review count per day (accounting for timeliness)
SELECT
  DATE(due_at + INTERVAL '1 day' * avg_days_late) AS projected_review_date,
  COUNT(*) AS projected_card_count,
  ROUND(AVG(stability), 1) AS avg_stability_days,
  MIN(due_at) AS earliest_due,
  MAX(due_at) AS latest_due
FROM fsrs_states
WHERE student_id = ?
  AND due_at > NOW()
  AND due_at < NOW() + INTERVAL '90 days'
GROUP BY DATE(due_at + INTERVAL '1 day' * avg_days_late)
ORDER BY projected_review_date;
```

**Heatmap display:**
- **Base:** Projected date + count
- **Transparency:** Show pct_25_delay to pct_75_delay as confidence bands
- **Label:** "Projected 45 cards (typically ±3 days)"

**Learning Science Note:** This respects **metacognitive awareness** — showing students their actual patterns builds self-regulation.

---

### Q2: Exam Readiness % Calculation — Aggregating BKT p_know

**Question:** Given bkt_states.p_know per subtopic, what's the correct way to aggregate to a course-level readiness %?

**Options:**
- **(A)** Simple average: `AVG(p_know)`
- **(B)** Weighted by topic importance (column: `topic_weight`)
- **(C)** Weighted by exam content map (percent of exam per topic)
- **(D)** Minimum p_know (bottleneck)
- **(E)** Harmonic mean (penalizes weak topics)

#### Current State
From the calendar doc:
> "Usa `bkt_states.p_know` por subtopic para generar un score de 'confianza' por materia."

No aggregation formula is specified.

#### Analysis

**Option A (Simple Average):** 
- ✅ Simple to compute
- ❌ Treats all topics equally (medical exams do not)
- ❌ Ignores foundation concepts (e.g., anatomy is prerequisite for pathology)

**Option B (Topic Weight):**
- ✅ Respects domain structure
- ✅ Parameterizable by professor/curriculum
- ⚠️ Requires manual curation of weights
- ✅ Good for Tier 1

**Option C (Exam Content Map):**
- ✅ Aligned to actual exam distribution
- ⚠️ Requires exam blueprint (rarely available pre-exam)
- ✅ Gold standard if available

**Option D (Minimum p_know - Bottleneck):**
- ✅ Identifies critical weak point
- ❌ Over-pessimistic (student could still pass with weak topics if they're minor)
- ✅ Good for prerequisite chains (correlativities)

**Option E (Harmonic Mean):**
- ✅ Penalizes weak outliers mathematically
- ✅ Standard in educational measurement
- ⚠️ Computationally heavier

#### Recommendation

**Implement tiered approach:**

1. **Tier 1 (MVP):** Weighted average by topic_weight
```sql
SELECT
  c.course_id,
  s.student_id,
  ROUND(
    SUM(bs.p_know * t.topic_weight) / NULLIF(SUM(t.topic_weight), 0),
    3
  ) AS course_readiness_pct
FROM bkt_states bs
JOIN subtopics sub ON bs.subtopic_id = sub.id
JOIN topics t ON sub.topic_id = t.id
JOIN sections se ON t.section_id = se.id
JOIN courses c ON se.course_id = c.id
WHERE bs.student_id = ?
  AND c.course_id = ?
  AND bs.p_know IS NOT NULL
GROUP BY c.course_id, s.student_id;
```

2. **Tier 2 (Exam Aware):** Add exam_blueprint mapping
```sql
-- Exam blueprint: what % of exam is each topic
CREATE TABLE exam_blueprints (
  exam_id UUID PRIMARY KEY,
  topic_id UUID,
  content_percent NUMERIC(5, 2),  -- 0-100
  is_foundation BOOLEAN DEFAULT FALSE,
  CONSTRAINT total_100 CHECK ((SELECT SUM(content_percent) FROM exam_blueprints WHERE exam_id=id) = 100)
);

-- Then:
SELECT
  ROUND(
    SUM(bs.p_know * eb.content_percent) / 100,
    3
  ) AS exam_readiness_pct
FROM bkt_states bs
JOIN subtopics sub ON bs.subtopic_id = sub.id
JOIN topics t ON sub.topic_id = t.id
JOIN exam_blueprints eb ON t.id = eb.topic_id
WHERE bs.student_id = ?
  AND eb.exam_id = ?;
```

3. **Tier 2+:** Foundation concept weighting
```sql
-- Penalty for low foundation topics
SELECT
  weighted_pct,
  CASE
    WHEN MIN(p_know) FILTER (WHERE is_foundation) < 0.50
      THEN weighted_pct * 0.85  -- 15% penalty for weak foundation
    ELSE weighted_pct
  END AS adjusted_readiness_pct
FROM ...
```

**Handling null p_know:**
- Subtopics never studied: treat as p_know = 0 (pessimistic) or exclude with SUM(...) WHERE p_know IS NOT NULL
- Recommend pessimistic approach (p_know = 0) to avoid inflating readiness

**Color thresholds (align with mastery system):**
```
p_know ≥ 0.75   → Green  (Ready)
0.50-0.75       → Yellow (Prepare)
0.25-0.50       → Orange (Weak)
< 0.25          → Red    (Critical)
```

---

### Q3: Weak Topics Identification — Selecting Top-N Failing Subtopics

**Question:** The exam panel should show "3 weakest topics." Which algorithm?

**Candidates:**
- **(A)** Lowest p_know (raw)
- **(B)** Lowest p_know AND highest weight
- **(C)** Lowest p_know AND highest content_percent in exam
- **(D)** Most overdue cards per subtopic
- **(E)** (1 - p_know) * topic_weight * cards_overdue (composite)

#### Analysis

**Option A (Lowest p_know):**
- Simple, but ignores importance
- Wrong if student is weak in minor topics

**Option B (Lowest p_know × Topic Weight):**
- ✅ Balances knowledge deficit with importance
- ✅ Prioritizes high-impact weak topics
- Good for prioritized study planning

**Option C (Lowest p_know × Exam Content %):**
- ✅ Aligns with exam pressure
- ✅ Respects exam blueprint (if available)
- Best for exam prep

**Option D (Most Overdue FSRS Cards):**
- ✅ Captures scheduling urgency
- ⚠️ Doesn't reflect knowledge state
- Good as secondary sort

**Option E (Composite - Weighted deficit + overdue):**
- ✅ Combines learning science + scheduling
- ⚠️ Complex; needs parameter tuning

#### Recommendation

**Use Option B for Tier 1; Option C for Tier 2:**

```sql
-- Tier 1: Composite weakness score
SELECT
  sub.id,
  sub.name,
  COALESCE(bs.p_know, 0) AS p_know,
  t.topic_weight,
  COALESCE(bs.p_know, 0) * t.topic_weight AS weighted_know,
  (1 - COALESCE(bs.p_know, 0)) * t.topic_weight AS deficit_score,
  COUNT(DISTINCT fs.card_id) FILTER (WHERE fs.due_at < NOW()) 
    AS overdue_card_count
FROM subtopics sub
JOIN topics t ON sub.topic_id = t.id
LEFT JOIN bkt_states bs ON sub.id = bs.subtopic_id AND bs.student_id = ?
LEFT JOIN flashcards f ON sub.id = f.subtopic_id
LEFT JOIN fsrs_states fs ON f.id = fs.card_id AND fs.student_id = ?
WHERE t.course_id = ?
GROUP BY sub.id, sub.name, bs.p_know, t.topic_weight
ORDER BY deficit_score DESC, overdue_card_count DESC
LIMIT 3;
```

**Display format (3-row list):**
```
🔴 Weak: Pathology (p_know: 0.35, 40% of exam)
   → 12 overdue flashcards
   → Suggested: 2-hour study session (review weakest cards first)

🟠 Moderate: Pharmacology (p_know: 0.52, 30% of exam)
   → 8 overdue flashcards
   → Suggested: 1.5-hour session

🟡 Pending: Histology (p_know: 0.60, 20% of exam)
   → 3 overdue flashcards
   → Suggested: 45-min review
```

---

### Q4: FSRS + Exam Date Collision — Can We Cap due_at Without Breaking Stability?

**Question:** Feature 2.4 from calendar doc:
> "If a card's FSRS-computed due_at falls AFTER the exam date, what should happen?"

**Options:**
- **(A)** Soft cap: Schedule review earlier (e.g., -5 days before exam)
- **(B)** Hard cap: Set due_at = exam_date
- **(C)** Algorithmically safe: Reduce stability, increase interval, reschedule
- **(D)** Don't modify FSRS; instead prioritize in NeedScore

#### Current State
The calendar doc suggests:
> "If un flashcard tiene stability de 30 dias pero el examen es en 10 dias, se fuerza un repaso antes."

This is vague. "Fuerza un repaso" could mean any of A-C.

#### Analysis: Risk Assessment

**Option A (Soft Cap: due_at - 5 days):**
- ✅ Preserves FSRS algorithm state
- ✅ Simple; no math changes
- ❌ Arbitrary (-5 days with no justification)
- ⚠️ Risk: Cards reviewed with >5 days confidence before exam (forgetting)

**Option B (Hard Cap: due_at = exam_date):**
- ❌ BREAKS FSRS STABILITY CALCULATIONS
  - If card has stability=30 days, next_interval = stability × new_factor
  - Due_at set to exam_date (10 days) violates this
  - If student reviews on exam_date after passing (or retake), FSRS sees 10-day gap, not 30-day
  - Stability gets recalibrated downward; algorithm "forgets" the 30-day plan
- ❌ Scheduling mismatch: Student reviews early (before exam_date due_at), FSRS thinks it's overdue

**Option C (Reduce Stability + Reschedule):**
- ✅ Algorithmically sound
- ⚠️ Complex; requires "inverse" stability calculation
- Process:
  1. Card has current stability S
  2. Exam is in E days (E < S)
  3. Reduce stability to S' = E - 1 (review before exam)
  4. Schedule next due_at = NOW() + (E - margin)
  5. Do NOT change difficulty or reps — only stability for this exam only
  6. After exam, restore full FSRS logic for long-term retention
- ✅ Respects FSRS state; no corruption

**Option D (Prioritize in NeedScore, don't modify FSRS):**
- ✅ No FSRS mutations
- ✅ Transparent: exam urgency is visible in ranking
- ❌ Doesn't force review before exam; student must choose to study
- Good for "smart nudge," bad for mandatory prep

#### Recommendation

**Use Option C for Tier 2 (exam-aware scheduling); Option D for Tier 1.**

**Tier 1 Implementation (NeedScore Priority):**

Extend NeedScore formula:
```
NeedScore_v2 = 0.40*overdue 
             + 0.30*(1 - p_know) 
             + 0.20*fragility 
             + 0.10*novelty
             + 0.50*exam_urgency  (if exam within 14 days)

where:
  exam_urgency = MAX(0, 1 - (days_to_exam / 14))
  
This adds up to 1.50 when exam is imminent, re-normalizing by dividing by SUM of weights.
```

```sql
-- Calculate exam urgency per card
WITH upcoming_exams AS (
  SELECT
    c.course_id,
    e.exam_date,
    GREATEST(0, (e.exam_date::date - NOW()::date))::int AS days_to_exam
  FROM exams e
  JOIN courses c ON e.course_id = c.id
  WHERE e.student_id = ?
    AND e.exam_date > NOW()
    AND e.exam_date < NOW() + INTERVAL '90 days'
)
SELECT
  f.id AS card_id,
  t.course_id,
  fs.due_at,
  CASE
    WHEN ue.days_to_exam IS NULL THEN 0
    WHEN ue.days_to_exam <= 14 
      THEN GREATEST(0, 1 - (ue.days_to_exam::float / 14))
    ELSE 0
  END AS exam_urgency_factor
FROM flashcards f
JOIN topics t ON f.subtopic_id IN (
  SELECT sub.id FROM subtopics sub WHERE sub.topic_id IN (
    SELECT id FROM topics WHERE course_id = t.course_id
  )
)
JOIN fsrs_states fs ON f.id = fs.card_id
LEFT JOIN upcoming_exams ue ON t.course_id = ue.course_id
WHERE fs.student_id = ?;
```

**Tier 2 Implementation (Exam-Aware Stability Adjustment):**

```typescript
// Pseudocode for exam-aware rescheduling
interface ExamAwareSchedule {
  card_id: string;
  exam_date: Date;
  current_stability_days: number;
  days_to_exam: number;
  action: 'force_review' | 'increase_frequency' | 'normal';
  new_due_at: Date;
  stability_override: number | null;
}

function scheduleForExam(
  card: FSRSCard,
  exam: Exam,
  now: Date = new Date()
): ExamAwareSchedule {
  const daysToExam = daysBetween(now, exam.exam_date);
  const currentStability = card.stability;
  const safetyMargin = 3; // Review 3 days before exam to retain confidence
  
  if (daysToExam >= currentStability) {
    // Normal FSRS scheduling applies
    return {
      card_id: card.id,
      exam_date: exam.exam_date,
      current_stability_days: currentStability,
      days_to_exam: daysToExam,
      action: 'normal',
      new_due_at: card.due_at, // Keep FSRS due_at
      stability_override: null,
    };
  }
  
  if (daysToExam > safetyMargin) {
    // Exam is soon; need to review before exam
    // Reduce stability to force a review before exam_date
    const new_stability = daysToExam - safetyMargin;
    const new_due_at = addDays(now, Math.ceil(new_stability / 2)); // Mid-window
    
    return {
      card_id: card.id,
      exam_date: exam.exam_date,
      current_stability_days: currentStability,
      days_to_exam: daysToExam,
      action: 'force_review',
      new_due_at: new_due_at,
      stability_override: new_stability,
      // NOTE: This is ephemeral! After exam, restore full FSRS
    };
  }
  
  if (daysToExam <= safetyMargin) {
    // Exam is within 3 days; increase frequency
    const new_due_at = now.addDays(1); // Review tomorrow, then daily until exam
    
    return {
      card_id: card.id,
      exam_date: exam.exam_date,
      current_stability_days: currentStability,
      days_to_exam: daysToExam,
      action: 'increase_frequency',
      new_due_at: new_due_at,
      stability_override: 1, // 1-day intervals until exam
    };
  }
}
```

**Critical Safety Notes:**
1. **Do NOT permanently modify fsrs_states.stability** — this breaks future long-term scheduling
2. Instead, create ephemeral `exam_schedules` table with overrides:
```sql
CREATE TABLE exam_schedules (
  id UUID PRIMARY KEY,
  card_id UUID NOT NULL,
  exam_id UUID NOT NULL,
  original_due_at TIMESTAMP,
  original_stability NUMERIC,
  override_due_at TIMESTAMP,
  override_stability_days INT,
  reason TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (card_id) REFERENCES flashcards(id),
  FOREIGN KEY (exam_id) REFERENCES exams(id)
);
```

3. **Post-exam cleanup:**
```sql
-- After exam ends, deactivate overrides
UPDATE exam_schedules 
SET active = FALSE 
WHERE exam_id = ? 
  AND exam_date < NOW();

-- Resume normal FSRS for these cards
-- (overrides are no longer consulted)
```

---

### Q5: Workload Forecasting — Predicting Future Review Demand

**Question:** Can we predict daily review volume 30-90 days in advance? E.g., "April has 3x the cards due compared to March"?

**Use Cases:**
- Pre-exam warning: "Based on your habits, peak review load is April 8-12; plan accordingly"
- Long-term pacing: "You'll need 90 min/day in weeks 10-14 to stay current"

#### Analysis: Forecasting Models

**Model 1: Simple Projection (Naive)**
```
Assume future due_at dates follow current due_at distribution.

projected_load[day_D] = 
  COUNT(fsrs_states WHERE date(due_at) = day_D AND student_id = ?)
  
Risk: Doesn't account for:
  - Cards reviewed between now and day_D (will have new due_at)
  - Student's review success rate (lapses → relearning)
  - Upcoming new content (decks added to course)
```

**Model 2: Temporal Projection (Better)**
```
For each card, forecast its next-next due_at:

FOR each card fc IN flashcards WHERE student_id = ? AND course_id = ?:
  IF fc.due_at > NOW() AND fc.due_at < TODAY + 90d:
    next_review_date = fc.due_at
    success_prob = estimate_success(fc, student)  // based on p_know
    
    IF success_prob > 0.80:
      next_next_stability = fc.stability * 1.3  (improved with success)
    ELSE IF success_prob < 0.60:
      next_next_stability = fc.stability * 0.6  (degraded with failure)
    ELSE:
      next_next_stability = fc.stability
    
    projected_next_due = next_review_date + next_next_stability
    
    IF projected_next_due < TODAY + 90d:
      forecasted_load[date(projected_next_due)] += 1

RETURN forecasted_load
```

This is **Monte Carlo forecasting** — probabilistic, not deterministic.

**Model 3: Course-Aware Forecasting (Best)**
```
Account for:
  1. Current FSRS states (Model 2)
  2. Upcoming course schedule (syllabus, module release dates)
  3. Student's historical review pattern (circadian, session length)
  4. Exam dates (clustering effect)

Require:
  - course_schedule table (lecture dates, module unlock dates)
  - student_preferences table (optimal_session_length, peak_hours)
  - exams table (exam_date, exam_type)

Weighted formula:
  forecasted_load[day] = 
    0.40 * FSRS_projection(day)
    + 0.30 * MODULE_release_effect(day)
    + 0.20 * EXAM_preparation_effect(day)
    + 0.10 * STUDENT_pattern_effect(day)
```

#### Recommendation

**Implement Model 2 for Tier 1; Model 3 for Tier 2+:**

```sql
-- Tier 1: Probabilistic FSRS projection
WITH student_success_rate AS (
  SELECT
    AVG(CASE WHEN grade >= 3 THEN 1 ELSE 0 END)::float AS success_prob,
    COUNT(*) AS total_reviews
  FROM reviews r
  JOIN flashcards f ON r.card_id = f.id
  WHERE r.student_id = ?
    AND r.review_date > NOW() - INTERVAL '30 days'
    AND f.course_id = ?
),
projected_reviews AS (
  SELECT
    fs.card_id,
    fs.due_at,
    fs.stability,
    CASE
      WHEN sr.success_prob > 0.80 THEN fs.stability * 1.3
      WHEN sr.success_prob < 0.60 THEN fs.stability * 0.6
      ELSE fs.stability
    END AS next_stability,
    (fs.due_at::date + 
     (CASE
        WHEN sr.success_prob > 0.80 THEN fs.stability * 1.3
        WHEN sr.success_prob < 0.60 THEN fs.stability * 0.6
        ELSE fs.stability
      END)::int * INTERVAL '1 day')::date AS projected_next_due
  FROM fsrs_states fs
  CROSS JOIN student_success_rate sr
  WHERE fs.student_id = ?
    AND fs.due_at > NOW()
    AND fs.due_at < NOW() + INTERVAL '90 days'
)
SELECT
  projected_next_due,
  COUNT(*) AS projected_card_count,
  ROUND(AVG(projected_next_due::date - fs.due_at::date), 1) 
    AS avg_stability_days
FROM projected_reviews pr
GROUP BY projected_next_due
ORDER BY projected_next_due;
```

**Forecast Display (Tier 1):**
```
📊 90-Day Review Forecast
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Week 12-13 (Apr 8-14):   ████████ 180 cards
Week 14-15 (Apr 15-21):  ████████████ 220 cards (PEAK)
Week 16-17 (Apr 22-28):  ████████ 170 cards
Week 18-19 (Apr 29-May5): ████████████████ 290 cards (Exam prep spike)

Tip: Weeks 14-19 are intense. Consider lightening other courses.
```

**Implementation Notes:**
- Update forecast daily (or hourly for accuracy)
- Cache for 24 hours (expensive query)
- Show confidence bands (±20% margin due to student variance)
- Link to "adjust study plan" feature (Tier 2.3)

---

### Q6: BKT Decay — Knowledge Degradation Over Time

**Question:** BKT models knowledge as static between reviews. But in reality, knowledge decays (forgetting) over time. Should the calendar account for this?

**Scenario:** Student has p_know = 0.90 for Anatomy on March 1. Exam is April 30 (60 days later). What's the predicted p_know at exam time if no reviews happen?

#### Analysis: Temporal Decay

**BKT Standard Model:**
- Knowledge state only updates on reviews
- Between reviews, p_know is frozen
- ❌ This is unrealistic; cognitive science shows decay (Ebbinghaus curve)

**Power-Law Decay (Empirical):**
```
p_know(t) = p_know(0) - (decay_rate * t^decay_exponent)

Typical values (from cognitive psychology):
  decay_rate ≈ 0.15-0.25
  decay_exponent ≈ 0.3-0.4

Example:
  p_know(0) = 0.90
  decay_rate = 0.20
  decay_exponent = 0.35
  
  p_know(30 days) = 0.90 - (0.20 * 30^0.35) ≈ 0.90 - 0.24 ≈ 0.66
  p_know(60 days) = 0.90 - (0.20 * 60^0.35) ≈ 0.90 - 0.32 ≈ 0.58
```

**Forgetting Curve (Ebbinghaus):**
```
retention(t) = (1 - decay_rate) ^ t

More pessimistic than power law. If decay_rate = 0.10/day:
  retention(30 days) ≈ 0.04 (95% forgotten!)
```

#### Current State
The calendar doc doesn't mention knowledge decay. The exam readiness calculation assumes p_know is static.

#### Recommendation

**Tier 2: Implement Decay-Aware Readiness Prediction**

```sql
-- Model 1: Power-law decay
-- Requires: student-specific decay_rate (can be estimated from historical data)

WITH student_decay AS (
  SELECT
    bs.student_id,
    -- Estimate decay rate from recent study data
    AVG(CASE
      WHEN bs.last_updated_at < NOW() - INTERVAL '30 days'
        THEN 0.20  -- Conservative default
      WHEN bs.last_updated_at < NOW() - INTERVAL '14 days'
        THEN 0.15
      ELSE 0.10
    END) AS estimated_decay_rate
  FROM bkt_states bs
  WHERE bs.student_id = ?
  GROUP BY bs.student_id
),
exam_time_decay AS (
  SELECT
    bs.subtopic_id,
    bs.p_know,
    bs.last_updated_at,
    e.exam_date,
    (e.exam_date::date - NOW()::date)::float AS days_to_exam,
    sd.estimated_decay_rate,
    -- Power-law decay formula
    GREATEST(
      0,  -- p_know can't go negative
      bs.p_know - 
      (sd.estimated_decay_rate * POWER((e.exam_date::date - NOW()::date)::float, 0.35))
    ) AS predicted_p_know_at_exam
  FROM bkt_states bs
  CROSS JOIN student_decay sd
  JOIN exams e ON bs.student_id = e.student_id
    AND bs.subtopic_id IN (
      SELECT sub.id FROM subtopics sub
      WHERE sub.topic_id IN (
        SELECT id FROM topics WHERE course_id = e.course_id
      )
    )
  WHERE bs.student_id = ?
    AND e.exam_date > NOW()
)
SELECT
  subtopic_id,
  p_know,
  predicted_p_know_at_exam,
  days_to_exam,
  CASE
    WHEN predicted_p_know_at_exam >= 0.75 THEN 'Ready'
    WHEN predicted_p_know_at_exam >= 0.50 THEN 'At Risk'
    ELSE 'Critical'
  END AS readiness_status
FROM exam_time_decay
ORDER BY predicted_p_know_at_exam ASC;
```

**Calendar Display (Tier 2+):**
```
📅 Exam Readiness with Decay Prediction
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Exam Date: April 30 (34 days away)

Topic                   Today      At Exam    Status     Action
─────────────────────────────────────────────────────────────
Pathology              0.85  →    0.61       At Risk    ⚠️ +10 hrs
Pharmacology           0.72  →    0.48       Critical   🚨 +15 hrs
Anatomy                0.92  →    0.75       Ready      ✓
Histology              0.60  →    0.35       Critical   🚨 +20 hrs

Projected Readiness:   74%        58%        Weak
Recommendation: Start intensive prep this week
```

**Safety Note:**
- Decay rates are **highly individual** (varies by student learning style, spaced rep effectiveness)
- Estimate decay_rate from student's own historical data if possible
- Default to conservative estimate (0.20) if insufficient data
- Show uncertainty bands: "58% (±12%)"

**Integration with Exam-Aware Scheduling:**
- Use predicted_p_know_at_exam to trigger "urgent review" mode
- If predicted p_know < 0.50 at exam, recommend doubling current study time
- Reverse-plan from target p_know (e.g., 0.75) to calculate required review dates

---

### Q7: Daily Review Load Calculation — Normalizing & Displaying Workload

**Question:** Medical exams have massive card counts (thousands across multiple decks). A student might have "847 reviews due." Is this realistic, and how should the calendar display this?

**Concerns:**
1. **Feasibility:** Can a student review 847 cards in one day?
2. **UI overflow:** Will the calendar UI break with numbers >99?
3. **Burnout risk:** Should the system warn if load is unrealistic?

#### Analysis

**Typical Medical Student Load:**
```
Med school flashcard deck sizes (observed):
  - Anatomy:        500-1000 cards
  - Pharmacology:   1000-1500 cards
  - Pathology:      800-1200 cards
  - Biochemistry:   600-900 cards
  - ─────────────────────────
  TOTAL:           3500-5600 cards per subject

Study time per card (empirical):
  - New card:       60-90 seconds (exposure + understanding)
  - Review card:    10-20 seconds (depends on stability)
  
If 847 cards due:
  - All new:        14-21 hours
  - All in review:  2.5-5 hours
  - Mixed (70% review, 30% new): 5-8 hours
```

**Workload Feasibility Check:**
```sql
-- Calculate realistic daily capacity per student
SELECT
  student_id,
  -- Recent study time per session
  ROUND(AVG(duration_minutes)::numeric, 1) AS avg_session_minutes,
  -- Cards per session
  ROUND(AVG(cards_reviewed)::numeric, 1) AS avg_cards_per_session,
  -- Implied review time per card (in seconds)
  ROUND((AVG(duration_minutes) * 60 / NULLIF(AVG(cards_reviewed), 0))::numeric, 1) 
    AS seconds_per_card,
  -- Daily capacity (assuming 90 min/day realistic for students)
  ROUND((90 * 60 / (AVG(duration_minutes) * 60 / NULLIF(AVG(cards_reviewed), 0)))::numeric, 0)
    AS daily_capacity_cards
FROM study_sessions
WHERE started_at > NOW() - INTERVAL '30 days'
GROUP BY student_id;
```

**Risk Zones:**
```
If daily capacity = 150 cards (realistic estimate):
  due_count < 100     → Green   (Normal)
  due_count 100-200   → Yellow  (Heavy; manageable)
  due_count 200-350   → Orange  (Very heavy; warn)
  due_count > 350     → Red     (Unsustainable; danger)
```

#### Recommendation

**Tier 1: Load Normalization + Visual Scaling**

```typescript
interface DailyLoad {
  date: Date;
  card_count: number;
  estimated_hours: number;
  feasibility: 'green' | 'yellow' | 'orange' | 'red';
  recommendation: string;
}

function calculateDailyLoad(
  student_id: string,
  date: Date,
  fsrs_states: FSRSState[]
): DailyLoad {
  // Get student's historical capacity
  const avg_seconds_per_card = getStudentPacePerCard(student_id); // e.g., 15 sec
  
  // Count cards due on this date
  const cards_due = fsrs_states.filter(
    fs => fs.student_id === student_id && 
          fs.due_at.toDateString() === date.toDateString()
  ).length;
  
  // Estimate hours (assuming 70% review, 30% new)
  const avg_seconds = avg_seconds_per_card;
  const estimated_seconds = cards_due * avg_seconds;
  const estimated_hours = estimated_seconds / 3600;
  
  // Feasibility (daily capacity ~90 min = 1.5 hours for busy med students)
  let feasibility: 'green' | 'yellow' | 'orange' | 'red';
  let recommendation: string;
  
  if (estimated_hours <= 1.5) {
    feasibility = 'green';
    recommendation = 'Manageable';
  } else if (estimated_hours <= 3) {
    feasibility = 'yellow';
    recommendation = 'Heavy day; plan ahead';
  } else if (estimated_hours <= 5) {
    feasibility = 'orange';
    recommendation = 'Very heavy; consider re-scheduling';
  } else {
    feasibility = 'red';
    recommendation = 'Unsustainable; redistribute cards across days';
  }
  
  return {
    date,
    card_count: cards_due,
    estimated_hours: Math.round(estimated_hours * 10) / 10,
    feasibility,
    recommendation,
  };
}
```

**Heatmap Display with Smart Scaling:**

```
Visual representation (3 levels):
  1. Card count (tooltip): "347 cards"
  2. Time estimate (main label): "5.2 hrs"
  3. Feasibility color (background): red

Heatmap grid:
  ┌─────┬─────┬─────┬─────┬─────┐
  │  47 │  89 │ 156 │ 347 │  72 │  ← card counts
  │1.2h │2.1h │3.8h │5.2h │1.7h │  ← time estimates
  │ 🟢  │ 🟢  │ 🟡  │ 🔴  │ 🟢  │  ← feasibility
  └─────┴─────┴─────┴─────┴─────┘
   Mon   Tue  Wed   Thu   Fri
```

**Tier 2: Automated Load Balancing**

If workload is unsustainable:

```sql
-- Detect overloaded days and offer redistribution
WITH daily_loads AS (
  SELECT
    DATE(fs.due_at) AS load_date,
    COUNT(*) AS card_count,
    COUNT(*) * 15 / 60.0 AS estimated_hours  -- 15 sec per card
  FROM fsrs_states fs
  WHERE fs.student_id = ?
    AND fs.due_at > NOW()
    AND fs.due_at < NOW() + INTERVAL '90 days'
  GROUP BY DATE(fs.due_at)
),
overloaded_days AS (
  SELECT
    load_date,
    card_count,
    estimated_hours
  FROM daily_loads
  WHERE estimated_hours > 3  -- Unsustainable threshold
)
SELECT
  load_date,
  card_count,
  ROUND(estimated_hours::numeric, 1) AS estimated_hours,
  card_count - 150 AS cards_to_redistribute,
  -- Suggest spreading across next 3 days
  ROUND(((card_count - 150) / 3.0)::numeric, 0) AS cards_per_next_day
FROM overloaded_days
ORDER BY load_date;
```

**Offer Students Smart Redistribution:**
```
⚠️ April 15 is overloaded: 347 cards in 5.2 hours

Options:
  [1] Spread across Apr 13-15 (−116 cards today)
  [2] Increase study time (6 hours/day possible? Y/N)
  [3] Reduce scope (skip low-value cards)
  [4] Extend study plan (+1 week, ease pressure)

Recommendation: Option 1 (automatic spread)
```

---

## Summary Table: Audit Findings & Recommendations

| Question | Finding | Tier 1 (MVP) | Tier 2 (Production) | Learning Science Risk |
|----------|---------|---|---|---|
| **Q1: Heatmap** | FSRS due_at ≠ actual review dates | Project with student delay (SQL) | Add confidence bands | High — burnout if false optimism |
| **Q2: Exam Readiness %** | No aggregation formula defined | Weighted avg by topic_weight | Exam blueprint mapping | Medium — aggregation affects target |
| **Q3: Weak Topics** | Algorithm undefined | Deficit score = (1-p_know) × weight | Add overdue cards weight | Medium — weak topics affect prep |
| **Q4: FSRS Capping** | Hard cap breaks stability | Extend NeedScore with exam_urgency | Ephemeral stability overrides | **HIGH — algorithm corruption risk** |
| **Q5: Forecasting** | No predictive model | Monte Carlo FSRS projection | Course + exam awareness | Medium — forecasts guide behavior |
| **Q6: BKT Decay** | Knowledge decay ignored | Assume static p_know | Power-law decay model | **HIGH — 30%+ knowledge loss ignored** |
| **Q7: Daily Load** | No feasibility check | Scale display; estimate hours | Auto-redistribute overloaded days | Medium — burnout if unchecked |

---

## Implementation Roadmap

### Phase 1 (Sprint 1-2): MVP — Tier 1 Heatmap + Readiness
- Weighted exam readiness calculation (Q2)
- Projected workload heatmap with student delay (Q1)
- Weak topics identification (Q3)
- Daily load feasibility display (Q7)
- **New tables:** `exam_schedules`, `exam_blueprints` (if exam_blueprint feature approved)

### Phase 2 (Sprint 3-4): Exam-Aware Scheduling
- Extend NeedScore with exam_urgency (Q4, Tier 1)
- Ephemeral stability overrides for exam prep (Q4, Tier 2)
- 90-day review forecast with probability (Q5)
- Automated load rebalancing (Q7, Tier 2)

### Phase 3 (Sprint 5+): Knowledge Science
- BKT decay model (Q6, Tier 2)
- Exam blueprint mapping (Q2, Tier 2)
- Full exam-aware calendar UX

---

## Appendix: SQL Schemas

```sql
-- Exam registration and scheduling
CREATE TABLE exams (
  id UUID PRIMARY KEY,
  institution_id UUID NOT NULL,
  course_id UUID NOT NULL,
  student_id UUID NOT NULL,
  exam_type TEXT NOT NULL,  -- 'parcial' | 'final' | 'recovery' | 'recuperatorio'
  exam_date TIMESTAMP NOT NULL,
  exam_location TEXT,
  duration_minutes INT DEFAULT 120,
  content_scope TEXT,  -- 'unit_1_3' | 'full_course'
  status TEXT DEFAULT 'registered',  -- 'registered' | 'completed' | 'failed' | 'absent'
  score NUMERIC(5, 2),  -- 0-100
  exam_result JSONB,  -- Rich exam results (questions, answers, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (student_id) REFERENCES auth.users(id)
);

-- Exam content blueprint (what % of exam is each topic)
CREATE TABLE exam_blueprints (
  id UUID PRIMARY KEY,
  exam_id UUID NOT NULL,
  topic_id UUID NOT NULL,
  content_percent NUMERIC(5, 2) NOT NULL,  -- 0-100, sum must = 100
  is_foundation BOOLEAN DEFAULT FALSE,
  question_types TEXT[],  -- ['MCQ', 'essay', 'case_study']
  difficulty_level TEXT,  -- 'basic' | 'intermediate' | 'advanced'
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (exam_id) REFERENCES exams(id),
  FOREIGN KEY (topic_id) REFERENCES topics(id),
  CONSTRAINT valid_percent CHECK (content_percent > 0 AND content_percent <= 100)
);

-- Exam-specific FSRS overrides (for force-review scheduling)
CREATE TABLE exam_schedules (
  id UUID PRIMARY KEY,
  card_id UUID NOT NULL,
  exam_id UUID NOT NULL,
  original_due_at TIMESTAMP NOT NULL,
  original_stability NUMERIC NOT NULL,
  override_due_at TIMESTAMP NOT NULL,
  override_stability_days INT,
  reason TEXT,  -- 'insufficient_time' | 'weak_topic' | 'overdue'
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  deactivated_at TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES flashcards(id),
  FOREIGN KEY (exam_id) REFERENCES exams(id)
);

-- Topic importance weights (for readiness aggregation)
ALTER TABLE topics ADD COLUMN topic_weight NUMERIC(4, 2) DEFAULT 1.0 CHECK (topic_weight > 0 AND topic_weight <= 5.0);

-- Student decay rate (for BKT knowledge decay modeling)
ALTER TABLE user_profiles ADD COLUMN learning_decay_profile JSONB DEFAULT '{
  "estimated_decay_rate": 0.20,
  "decay_exponent": 0.35,
  "confidence": 0.5,
  "last_calculated": null
}';
```

---

## Closing Recommendation

**The calendar feature is strategically important but learning-science-sensitive.** Implementing Tier 1 quickly (6-10 workdays) is feasible and safe. Tier 2 requires careful testing because:

1. **FSRS stability must never be corrupted** (Q4 — use ephemeral overrides)
2. **BKT decay is a 30%+ knowledge loss** that changes exam predictions (Q6)
3. **Heatmaps can breed complacency if unrealistic** (Q1 — project with delay)

The roadmap provides a safe, incremental path to sophisticated exam-aware scheduling without compromising algorithm stability.

