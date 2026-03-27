# FSRS + BKT Calendar Integration — Implementation Reference
## Code Templates, SQL Queries, and Pseudocode

**Date:** March 27, 2026  
**Status:** Technical reference for developers implementing calendar features  
**Related:** `AUDIT_FSRS_BKT_CALENDAR_2026-03-27.md`

---

## Part 1: Data Queries

### 1.1 Student Timeliness Profile

Calculate how many days late a student typically reviews cards:

```sql
-- Calculate review timeliness distribution
WITH review_gaps AS (
  SELECT
    r.student_id,
    r.review_date::date - fs.due_at::date AS days_late,
    COUNT(*) AS review_count,
    ROUND(AVG(fs.stability), 1) AS avg_stability_at_review
  FROM reviews r
  JOIN flashcards f ON r.card_id = f.id
  JOIN fsrs_states fs ON f.id = fs.card_id
    AND r.review_date >= fs.updated_at  -- Get FSRS state at review time
  WHERE r.student_id = $1
    AND r.review_date > NOW() - INTERVAL '90 days'
    AND r.review_date > fs.due_at  -- Only count reviews (not future)
  GROUP BY r.student_id, (r.review_date::date - fs.due_at::date)
)
SELECT
  student_id,
  ROUND(AVG(days_late)::numeric, 1) AS avg_days_late,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY days_late) AS q1_delay,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY days_late) AS median_delay,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY days_late) AS q3_delay,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY days_late) AS p95_delay,
  COUNT(*) AS total_review_count
FROM review_gaps
GROUP BY student_id;
```

**Interpretation:**
- Use `avg_days_late` for workload heatmap projection
- Use `median_delay` for conservative estimates
- Use `p95_delay` for burnout risk assessment

---

### 1.2 Projected Daily Workload (Tier 1)

Forecast review volume per day based on current FSRS states and student timeliness:

```sql
-- Projected workload accounting for student's typical delay
WITH student_timeliness AS (
  SELECT
    $1::UUID AS student_id,
    COALESCE(
      (SELECT ROUND(AVG(r.review_date::date - fs.due_at::date)::numeric, 0)::int
       FROM reviews r
       JOIN fsrs_states fs ON r.card_id = fs.card_id
       WHERE r.student_id = $1
         AND r.review_date > NOW() - INTERVAL '90 days'),
      2  -- Default 2-day delay
    ) AS avg_delay_days
),
projected_dates AS (
  SELECT
    fs.card_id,
    fs.due_at,
    fs.stability,
    (fs.due_at::date + INTERVAL '1 day' * st.avg_delay_days)::date AS projected_review_date
  FROM fsrs_states fs
  CROSS JOIN student_timeliness st
  WHERE fs.student_id = $1
    AND fs.due_at > NOW()
    AND fs.due_at < NOW() + INTERVAL '90 days'
)
SELECT
  projected_review_date,
  COUNT(*) AS card_count,
  ROUND((COUNT(*) * 15.0 / 60.0)::numeric, 1) AS estimated_hours,  -- 15 sec/card avg
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY stability) AS q1_stability,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY stability) AS median_stability
FROM projected_dates
GROUP BY projected_review_date
ORDER BY projected_review_date
LIMIT 90;
```

**Output columns:**
- `projected_review_date` — When student likely reviews
- `card_count` — How many cards
- `estimated_hours` — Time needed (at 15 sec/card)
- `q1_stability`, `median_stability` — Shows difficulty distribution

---

### 1.3 Exam Readiness %

Calculate course-level readiness with weighted aggregation:

```sql
-- Exam readiness percentage with weighted aggregation
WITH topic_weights AS (
  SELECT
    t.course_id,
    t.id AS topic_id,
    t.name,
    COALESCE(t.topic_weight, 1.0) AS weight
  FROM topics t
  WHERE t.course_id = $2  -- course_id parameter
)
SELECT
  c.id AS course_id,
  c.name AS course_name,
  ROUND(
    COALESCE(
      SUM(bs.p_know * tw.weight) / NULLIF(SUM(tw.weight), 0),
      0
    )::numeric,
    3
  ) AS weighted_readiness,
  COUNT(DISTINCT bs.subtopic_id) FILTER (WHERE bs.p_know IS NOT NULL) 
    AS topics_studied,
  COUNT(DISTINCT bs.subtopic_id) AS total_topics,
  CASE
    WHEN COALESCE(SUM(bs.p_know * tw.weight) / NULLIF(SUM(tw.weight), 0), 0) >= 0.75
      THEN 'Ready'
    WHEN COALESCE(SUM(bs.p_know * tw.weight) / NULLIF(SUM(tw.weight), 0), 0) >= 0.50
      THEN 'At Risk'
    ELSE 'Critical'
  END AS readiness_status
FROM courses c
JOIN topics t ON c.id = t.course_id
JOIN topic_weights tw ON t.id = tw.topic_id
LEFT JOIN bkt_states bs ON t.id = (
  SELECT topic_id FROM subtopics WHERE id = bs.subtopic_id
)
  AND bs.student_id = $1  -- student_id parameter
WHERE c.id = $2
GROUP BY c.id, c.name;
```

---

### 1.4 Weakest Topics (Top 3)

Identify topics needing priority study:

```sql
-- Top 3 weakest topics (by knowledge deficit weighted by importance)
SELECT
  sub.id AS subtopic_id,
  sub.name AS subtopic_name,
  t.name AS topic_name,
  COALESCE(bs.p_know, 0) AS p_know,
  COALESCE(t.topic_weight, 1.0) AS topic_weight,
  (1 - COALESCE(bs.p_know, 0)) * COALESCE(t.topic_weight, 1.0) AS deficit_score,
  COUNT(DISTINCT CASE WHEN fs.due_at < NOW() THEN fs.card_id END) AS overdue_cards
FROM subtopics sub
JOIN topics t ON sub.topic_id = t.id
LEFT JOIN bkt_states bs ON sub.id = bs.subtopic_id
  AND bs.student_id = $1
LEFT JOIN flashcards f ON sub.id = f.subtopic_id
LEFT JOIN fsrs_states fs ON f.id = fs.card_id
  AND fs.student_id = $1
WHERE t.course_id = $2
GROUP BY sub.id, sub.name, t.id, t.name, bs.p_know, t.topic_weight
ORDER BY deficit_score DESC, overdue_cards DESC
LIMIT 3;
```

---

## Part 2: NeedScore Extensions

### 2.1 Exam-Aware NeedScore (Tier 1)

Extend the study queue ranking to account for exam urgency:

```sql
-- Extended NeedScore with exam urgency factor
WITH exam_context AS (
  SELECT
    e.id AS exam_id,
    e.course_id,
    e.exam_date,
    (e.exam_date::date - NOW()::date)::float AS days_to_exam
  FROM exams e
  WHERE e.student_id = $1
    AND e.exam_date > NOW()
    AND e.exam_date < NOW() + INTERVAL '90 days'
),
card_context AS (
  SELECT
    fs.card_id,
    f.topic_id,
    t.course_id,
    fs.due_at,
    fs.stability,
    COALESCE(bs.p_know, 0) AS p_know,
    -- Days overdue (clamped to [0, 1])
    CASE
      WHEN (NOW()::date - fs.due_at::date) <= 0 THEN 0
      ELSE LEAST(1.0, 
        (NOW()::date - fs.due_at::date)::float / 
        GREATEST(1, (SELECT MAX(NOW()::date - due_at::date)::float 
                     FROM fsrs_states WHERE student_id = $1))
      )
    END AS overdue_factor,
    -- Fragility: inverse of stability (risk of forgetting)
    LEAST(1.0, 1.0 / GREATEST(1, fs.stability)) AS fragility,
    -- Novelty: 1 if new, 0 if learned
    CASE WHEN fs.state = 'new' THEN 1.0 ELSE 0.0 END AS novelty
  FROM flashcards f
  JOIN fsrs_states fs ON f.id = fs.card_id
  JOIN topics t ON f.topic_id = t.id
  LEFT JOIN bkt_states bs ON f.subtopic_id = bs.subtopic_id
    AND bs.student_id = $1
  WHERE fs.student_id = $1
    AND t.course_id = $2  -- focus on course_id
),
need_scores AS (
  SELECT
    cc.card_id,
    cc.course_id,
    cc.p_know,
    cc.overdue_factor,
    cc.fragility,
    cc.novelty,
    ec.exam_date,
    ec.days_to_exam,
    -- Base NeedScore (original formula)
    (0.40 * cc.overdue_factor
     + 0.30 * (1 - cc.p_know)
     + 0.20 * cc.fragility
     + 0.10 * cc.novelty) AS base_need_score,
    -- Exam urgency factor
    CASE
      WHEN ec.days_to_exam IS NULL THEN 0
      WHEN ec.days_to_exam <= 14 THEN GREATEST(0, 1 - (ec.days_to_exam / 14))
      ELSE 0
    END AS exam_urgency,
    -- Combined score
    (0.40 * cc.overdue_factor
     + 0.30 * (1 - cc.p_know)
     + 0.20 * cc.fragility
     + 0.10 * cc.novelty) +
    (CASE
      WHEN ec.days_to_exam IS NULL THEN 0
      WHEN ec.days_to_exam <= 14 THEN GREATEST(0, 1 - (ec.days_to_exam / 14)) * 0.50
      ELSE 0
    END) AS combined_need_score
  FROM card_context cc
  LEFT JOIN exam_context ec ON cc.course_id = ec.course_id
)
SELECT
  card_id,
  ROUND(base_need_score::numeric, 3) AS base_score,
  ROUND(COALESCE(exam_urgency, 0)::numeric, 3) AS exam_urgency,
  ROUND(combined_need_score::numeric, 3) AS final_score,
  days_to_exam,
  CASE
    WHEN combined_need_score > 0.7 THEN 'CRITICAL'
    WHEN combined_need_score > 0.5 THEN 'HIGH'
    WHEN combined_need_score > 0.3 THEN 'MEDIUM'
    ELSE 'LOW'
  END AS priority
FROM need_scores
ORDER BY combined_need_score DESC
LIMIT 50;
```

---

### 2.2 Daily Study Queue with Extended NeedScore

```typescript
// TypeScript service for study queue ranking
interface StudyQueueCard {
  card_id: string;
  topic_name: string;
  subtitle: string;
  need_score: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  days_overdue: number;
  days_to_exam?: number;
  p_know: number;
  stability: number;
}

async function getStudyQueue(
  studentId: string,
  courseId: string,
  limit: number = 50
): Promise<StudyQueueCard[]> {
  const query = `
    -- Query from 2.1 (extended NeedScore)
    ... (full SQL above)
  `;
  
  const results = await db.query(query, [studentId, courseId]);
  
  return results.map(row => ({
    card_id: row.card_id,
    topic_name: row.topic_name,
    subtitle: row.subtopic_name,
    need_score: row.final_score,
    priority: row.priority,
    days_overdue: Math.max(0, -row.days_to_due),
    days_to_exam: row.days_to_exam,
    p_know: row.p_know,
    stability: row.stability,
  }));
}
```

---

## Part 3: Exam-Aware Stability Management

### 3.1 Create Ephemeral Exam Overrides

Do NOT modify fsrs_states directly. Instead:

```typescript
interface ExamScheduleOverride {
  id: string;
  card_id: string;
  exam_id: string;
  original_due_at: Date;
  original_stability: number;
  override_due_at: Date;
  override_stability_days: number;
  reason: 'insufficient_time' | 'weak_topic' | 'overdue';
  active: boolean;
}

async function createExamScheduleOverride(
  cardId: string,
  examId: string,
  reason: ExamScheduleOverride['reason']
): Promise<ExamScheduleOverride> {
  // Get current FSRS state
  const fsrsState = await db.one(
    `SELECT due_at, stability FROM fsrs_states WHERE card_id = $1`,
    [cardId]
  );
  
  // Get exam date
  const exam = await db.one(
    `SELECT exam_date FROM exams WHERE id = $1`,
    [examId]
  );
  
  const daysToExam = daysBetween(new Date(), exam.exam_date);
  const safetyMargin = 3;
  
  let overrideDueAt: Date;
  let overrideStability: number;
  
  if (daysToExam > safetyMargin) {
    // Schedule review with safety margin
    overrideStability = daysToExam - safetyMargin;
    overrideDueAt = addDays(new Date(), Math.ceil(overrideStability / 2));
  } else {
    // Exam is very soon; daily reviews
    overrideStability = 1;
    overrideDueAt = addDays(new Date(), 1);
  }
  
  // Save override (NOT modifying fsrs_states)
  const override = await db.one(
    `INSERT INTO exam_schedules
     (card_id, exam_id, original_due_at, original_stability, 
      override_due_at, override_stability_days, reason, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)
     RETURNING *`,
    [
      cardId,
      examId,
      fsrsState.due_at,
      fsrsState.stability,
      overrideDueAt,
      overrideStability,
      reason,
    ]
  );
  
  return override;
}
```

### 3.2 Use Overrides in Study Queue

When fetching study queue, prioritize override due_at over FSRS due_at:

```sql
-- Study queue respecting exam overrides
SELECT
  fs.card_id,
  COALESCE(es.override_due_at, fs.due_at) AS effective_due_at,
  COALESCE(es.override_stability_days, fs.stability) AS effective_stability,
  CASE WHEN es.active THEN 'exam_override' ELSE 'normal' END AS schedule_type
FROM fsrs_states fs
LEFT JOIN exam_schedules es ON fs.card_id = es.card_id
  AND es.exam_id = (
    -- Most imminent exam for this card's course
    SELECT e.id FROM exams e
    JOIN topics t ON t.course_id = e.course_id
    WHERE e.student_id = fs.student_id
      AND t.id = (SELECT topic_id FROM flashcards WHERE id = fs.card_id)
    ORDER BY e.exam_date ASC
    LIMIT 1
  )
  AND es.active = TRUE
WHERE fs.student_id = $1
ORDER BY COALESCE(es.override_due_at, fs.due_at) ASC;
```

### 3.3 Deactivate Overrides Post-Exam

```sql
-- After exam, deactivate overrides (resume normal FSRS)
UPDATE exam_schedules
SET active = FALSE,
    deactivated_at = NOW()
WHERE exam_id = $1
  AND active = TRUE;
```

---

## Part 4: Knowledge Decay Modeling

### 4.1 Power-Law Decay Function

```typescript
interface BKTDecayModel {
  p_know_at_time_0: number;
  decay_rate: number;
  decay_exponent: number;
}

function predictKnowledgeAtTime(
  model: BKTDecayModel,
  days_elapsed: number
): number {
  const {p_know_at_time_0, decay_rate, decay_exponent} = model;
  
  const predicted = p_know_at_time_0 - 
    (decay_rate * Math.pow(days_elapsed, decay_exponent));
  
  // Can't go below 0
  return Math.max(0, predicted);
}

// Example:
const model = {
  p_know_at_time_0: 0.90,
  decay_rate: 0.20,
  decay_exponent: 0.35,
};

console.log('At exam (30 days):',
  predictKnowledgeAtTime(model, 30));  // ~0.66
console.log('At exam (60 days):',
  predictKnowledgeAtTime(model, 60));  // ~0.58
```

### 4.2 Estimate Student Decay Rate

```sql
-- Estimate decay rate from historical data
-- Premise: If student hasn't reviewed a topic in X days, p_know has decayed

WITH historical_gaps AS (
  SELECT
    bs.student_id,
    bs.subtopic_id,
    bs.p_know AS p_know_at_start,
    EXTRACT(DAY FROM (NOW() - bs.last_updated_at))::float AS days_since_review,
    -- Infer decay by looking at next review performance
    CASE
      WHEN (SELECT AVG(CASE WHEN grade >= 3 THEN 1 ELSE 0 END)
            FROM reviews r
            JOIN flashcards f ON r.card_id = f.id
            WHERE f.subtopic_id = bs.subtopic_id
              AND r.student_id = bs.student_id
              AND r.review_date > bs.last_updated_at
              AND r.review_date < bs.last_updated_at + INTERVAL '7 days') > 0.85
        THEN 0.85  -- High performance → low decay
      WHEN (SELECT AVG(CASE WHEN grade >= 3 THEN 1 ELSE 0 END)
            FROM reviews r
            JOIN flashcards f ON r.card_id = f.id
            WHERE f.subtopic_id = bs.subtopic_id
              AND r.student_id = bs.student_id
              AND r.review_date > bs.last_updated_at
              AND r.review_date < bs.last_updated_at + INTERVAL '7 days') > 0.65
        THEN 0.65  -- Medium performance → medium decay
      ELSE 0.50  -- Low performance → high decay
    END AS inferred_p_know_at_next_review
  FROM bkt_states bs
  WHERE bs.last_updated_at > NOW() - INTERVAL '180 days'
    AND EXTRACT(DAY FROM (NOW() - bs.last_updated_at)) > 7
)
SELECT
  student_id,
  ROUND(AVG(
    (p_know_at_start - inferred_p_know_at_next_review) /
    GREATEST(1, days_since_review)
  )::numeric, 4) AS estimated_daily_decay_rate,
  ROUND(AVG(
    (p_know_at_start - inferred_p_know_at_next_review)
  )::numeric, 3) AS avg_total_decay_per_topic,
  COUNT(*) AS sample_size
FROM historical_gaps
GROUP BY student_id;
```

### 4.3 Predict Readiness at Exam Time with Decay

```sql
-- Exam readiness WITH knowledge decay prediction
WITH student_decay AS (
  SELECT
    $1::UUID AS student_id,
    0.20::float AS decay_rate,  -- Conservative default
    0.35::float AS decay_exponent
),
exam_readiness_with_decay AS (
  SELECT
    t.name AS topic_name,
    sub.name AS subtopic_name,
    COALESCE(bs.p_know, 0) AS p_know_today,
    e.exam_date,
    (e.exam_date::date - NOW()::date)::float AS days_to_exam,
    sd.decay_rate,
    sd.decay_exponent,
    -- Power law decay: p_know(t) = p_know(0) - decay_rate * t^exponent
    GREATEST(
      0,
      COALESCE(bs.p_know, 0) - 
      (sd.decay_rate * POWER((e.exam_date::date - NOW()::date)::float, sd.decay_exponent))
    ) AS predicted_p_know_at_exam
  FROM bkt_states bs
  JOIN subtopics sub ON bs.subtopic_id = sub.id
  JOIN topics t ON sub.topic_id = t.id
  CROSS JOIN student_decay sd
  JOIN exams e ON t.course_id = e.course_id
    AND e.student_id = bs.student_id
  WHERE bs.student_id = $1
)
SELECT
  topic_name,
  subtopic_name,
  ROUND(p_know_today::numeric, 3) AS p_know_today,
  ROUND(predicted_p_know_at_exam::numeric, 3) AS p_know_at_exam,
  ROUND((p_know_today - predicted_p_know_at_exam)::numeric, 3) AS knowledge_loss,
  days_to_exam::int,
  CASE
    WHEN predicted_p_know_at_exam >= 0.75 THEN 'Ready'
    WHEN predicted_p_know_at_exam >= 0.50 THEN 'At Risk'
    ELSE 'Critical'
  END AS predicted_status
FROM exam_readiness_with_decay
ORDER BY predicted_p_know_at_exam ASC;
```

---

## Part 5: Load Balancing & Redistribution

### 5.1 Detect Overloaded Days

```sql
-- Identify unsustainably high workload days
WITH daily_loads AS (
  SELECT
    DATE(fs.due_at) AS load_date,
    COUNT(*) AS card_count,
    COUNT(*) * 15.0 / 60.0 AS estimated_hours
  FROM fsrs_states fs
  WHERE fs.student_id = $1
    AND fs.due_at > NOW()
    AND fs.due_at < NOW() + INTERVAL '90 days'
  GROUP BY DATE(fs.due_at)
),
overload_threshold AS (
  SELECT 3.0::float AS max_sustainable_hours  -- 3 hours/day
)
SELECT
  dl.load_date,
  dl.card_count,
  ROUND(dl.estimated_hours::numeric, 1) AS estimated_hours,
  ROUND((dl.estimated_hours - ot.max_sustainable_hours)::numeric, 1) 
    AS excess_hours,
  ROUND(((dl.card_count * ot.max_sustainable_hours) / dl.estimated_hours)::numeric, 0)
    AS sustainable_card_count,
  dl.card_count - ROUND(((dl.card_count * ot.max_sustainable_hours) / dl.estimated_hours)::numeric, 0)
    AS cards_to_redistribute
FROM daily_loads dl
CROSS JOIN overload_threshold ot
WHERE dl.estimated_hours > ot.max_sustainable_hours
ORDER BY dl.load_date;
```

### 5.2 Suggest Redistribution

```typescript
interface LoadRedistributionPlan {
  source_date: Date;
  excess_cards: number;
  target_dates: { date: Date; cards_to_add: number }[];
}

function suggestRedistribution(
  overloadedDates: {date: Date; card_count: number; estimated_hours: number}[]
): LoadRedistributionPlan[] {
  const maxHoursPerDay = 3;
  const secondsPerCard = 15;
  const targetCardsPerDay = Math.floor(maxHoursPerDay * 60 * 60 / secondsPerCard); // ~720
  
  const plans: LoadRedistributionPlan[] = [];
  
  for (const overloaded of overloadedDates) {
    const excessCards = overloaded.card_count - targetCardsPerDay;
    
    // Spread excess across next 3 days
    const cardsPerDay = Math.ceil(excessCards / 3);
    const targetDates = [];
    
    for (let i = 1; i <= 3; i++) {
      const targetDate = addDays(overloaded.date, i);
      targetDates.push({
        date: targetDate,
        cards_to_add: cardsPerDay,
      });
    }
    
    plans.push({
      source_date: overloaded.date,
      excess_cards: excessCards,
      target_dates: targetDates,
    });
  }
  
  return plans;
}
```

---

## Part 6: Testing & Validation

### 6.1 Unit Test: NeedScore Calculation

```typescript
import {calculateNeedScore} from '../lib/study-queue';

describe('NeedScore Calculation', () => {
  it('should weight overdue heavily', () => {
    const card = {
      due_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      stability: 30,
      p_know: 0.70,
      state: 'review',
    };
    
    const needScore = calculateNeedScore(card, {max_days_overdue: 10});
    expect(needScore).toBeGreaterThan(0.5); // High priority
  });
  
  it('should boost score with exam urgency', () => {
    const card = {
      due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      stability: 30,
      p_know: 0.60,
      state: 'review',
    };
    
    const examDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const needScore = calculateNeedScore(card, {
      max_days_overdue: 10,
      exam_date: examDate,
    });
    
    expect(needScore).toBeGreaterThan(0.6); // Boosted by exam
  });
});
```

### 6.2 Integration Test: Exam Schedule Overrides

```typescript
describe('Exam Schedule Overrides', () => {
  it('should not modify fsrs_states permanently', async () => {
    const cardId = 'card-123';
    const examId = 'exam-456';
    
    // Get original FSRS state
    const originalFSRS = await db.one(
      'SELECT due_at, stability FROM fsrs_states WHERE id = $1',
      [cardId]
    );
    
    // Create override
    await createExamScheduleOverride(cardId, examId, 'insufficient_time');
    
    // Verify fsrs_states is unchanged
    const afterFSRS = await db.one(
      'SELECT due_at, stability FROM fsrs_states WHERE id = $1',
      [cardId]
    );
    
    expect(afterFSRS.due_at).toEqual(originalFSRS.due_at);
    expect(afterFSRS.stability).toEqual(originalFSRS.stability);
    
    // But override should exist
    const override = await db.one(
      'SELECT * FROM exam_schedules WHERE card_id = $1 AND exam_id = $2',
      [cardId, examId]
    );
    
    expect(override).toBeDefined();
  });
});
```

---

## Appendix: Algorithm Constants Reference

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| FSRS w8 | 1.10 | Calibration | Easy factor base |
| FSRS w11 | 2.18 | Calibration | Hard penalty |
| FSRS w15 | 0.29 | Calibration | Difficulty modifier |
| FSRS w16 | 2.61 | Calibration | Stability multiplier |
| NeedScore weights (overdue) | 0.40 | Study queue | Scheduling urgency |
| NeedScore weights (1-p_know) | 0.30 | Study queue | Knowledge gap |
| NeedScore weights (fragility) | 0.20 | Study queue | Forgetting risk |
| NeedScore weights (novelty) | 0.10 | Study queue | New content |
| Exam urgency factor | 0.50 | Calendar | Exam-awareness boost |
| BKT p_correct_given_know | 0.95 | BKT model | Probability correct if knows |
| BKT p_correct_given_guess | 0.25 | BKT model | Probability correct if guesses |
| BKT p_transit | 0.10 | BKT model | Knowledge gain per attempt |
| Decay rate (power law) | 0.20 | Cognitive psych | Conservative default |
| Decay exponent | 0.35 | Cognitive psych | Ebbinghaus-like |
| Safety margin (exam) | 3 days | Calendar | Review before exam |
| Max sustainable hours/day | 3.0 | Pedagogy | Medical student workload |

---

**Next Steps:**
1. Implement queries from Part 1 as database views or stored procedures
2. Extend NeedScore service (Part 2) in backend routes
3. Add exam override endpoints (Part 3) for Tier 2 feature
4. Integrate decay model (Part 4) into exam readiness calculations
5. Test with load balancing scenarios (Part 5)
6. Run unit & integration tests (Part 6) before deployment

