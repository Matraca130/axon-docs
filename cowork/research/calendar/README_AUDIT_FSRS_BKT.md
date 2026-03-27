# FSRS v4 + BKT v4 Calendar Integration Audit
## Complete Analysis & Implementation Guide

**Date:** March 27, 2026  
**Status:** Complete  
**For:** Axon Medical LMS Development Team

---

## Quick Start

If you're implementing calendar features with FSRS/BKT, **read in this order:**

1. **AUDIT_SUMMARY.txt** (5 min read)
   - 7 critical questions summarized
   - Key findings and risks
   - Implementation roadmap (Sprints 1-5)

2. **AUDIT_FSRS_BKT_CALENDAR_2026-03-27.md** (30 min detailed read)
   - Full learning science analysis
   - Each question answered in depth
   - SQL schemas and constants

3. **FSRS_BKT_IMPLEMENTATION_REFERENCE.md** (20 min skim, reference while coding)
   - Production-ready SQL queries
   - TypeScript pseudocode
   - Testing patterns

4. **/.auto-memory/audit_fsrs_bkt_calendar.md** (project memory for next session)

---

## Document Guide

### AUDIT_SUMMARY.txt (16 KB, 307 lines)
**Best for:** Quick overview, stakeholder communication, sprint planning

Covers:
- Executive summary
- 7 questions with risk assessment
- Key formulas (FSRS, NeedScore, BKT)
- Critical constraints for developers
- Implementation roadmap (checklists)
- Critical risks & mitigations
- Product questions for PM team

**Read time:** 5 minutes

---

### AUDIT_FSRS_BKT_CALENDAR_2026-03-27.md (39 KB, 1166 lines)
**Best for:** Deep learning science understanding, decision-making, architecture

Covers:
- Section 1: Current algorithms (FSRS v4, BKT v4, NeedScore)
- Section 2: DEEP AUDIT of 7 critical questions:
  - Q1: Heatmap data accuracy (due_at vs projected workload)
  - Q2: Exam readiness aggregation (weighted p_know formula)
  - Q3: Weak topics identification (algorithm specification)
  - Q4: FSRS + exam collision (CRITICAL — algorithm corruption risk)
  - Q5: Workload forecasting (Monte Carlo projection)
  - Q6: BKT decay (CRITICAL — 30% knowledge loss unmodeled)
  - Q7: Daily load calculation (feasibility & burnout prevention)
- Section 3: Summary table
- Section 4: Implementation roadmap (Tier 1 MVP, Tier 2 production, Tier 3 science)
- Section 5: SQL schemas (exams, exam_schedules, exam_blueprints)
- Section 6: Appendix (algorithm constants)

**Read time:** 30-45 minutes for full understanding

---

### FSRS_BKT_IMPLEMENTATION_REFERENCE.md (22 KB, 766 lines)
**Best for:** Developers implementing features, copy-paste SQL, testing patterns

Covers:
- Part 1: Data queries (ready-to-use SQL)
  - Student timeliness profile
  - Projected daily workload
  - Exam readiness %
  - Weakest topics identification
  
- Part 2: NeedScore extensions
  - Exam-aware ranking formula
  - Study queue endpoint implementation
  
- Part 3: Exam-aware stability management
  - Create ephemeral overrides (don't modify fsrs_states!)
  - Use overrides in study queue
  - Post-exam cleanup
  
- Part 4: Knowledge decay modeling
  - Power-law decay function (TypeScript)
  - Estimate decay rate from data (SQL)
  - Predict readiness at exam time (SQL)
  
- Part 5: Load balancing
  - Detect overloaded days (SQL)
  - Suggest redistribution (TypeScript)
  
- Part 6: Testing & validation
  - Unit test example
  - Integration test example
  
- Appendix: Algorithm constants reference table

**Read time:** 20 minutes for skim; reference while coding

---

## Key Findings at a Glance

### Two CRITICAL Risks

**Risk 1: FSRS Stability Corruption (Q4)**
- Problem: Hard-capping due_at to exam_date breaks FSRS state
- Wrong approach: `UPDATE fsrs_states SET due_at = exam_date`
- Right approach: Create ephemeral `exam_schedules` table with overrides
- Impact: Data corruption if wrong; safe if right

**Risk 2: BKT Knowledge Decay Ignored (Q6)**
- Problem: Standard BKT doesn't model forgetting over time
- Finding: Knowledge can drop 30%+ over 60 days without reviews
- Impact: Exam readiness predictions are optimistic
- Solution: Power-law decay model for predictions, document assumption

### Tier 1 (MVP) Is Safe

Questions 1, 2, 3, 5, 7 are safe to implement in Tier 1 (Sprints 1-2):
- Weighted readiness aggregation
- Workload projection with timeliness
- Weak topics identification
- Daily load feasibility check
- Review forecasting

Estimated effort: 3-4 weeks, no algorithm risk

### Tier 2 Requires Careful Design

Questions 4 and 6 (and 2, 5 extended) require Tier 2 (Sprints 3-4+):
- Ephemeral FSRS overrides (safe, non-mutating)
- Knowledge decay modeling (adds sophistication)
- Exam blueprint mapping (requires professor input)

Estimated effort: 2-3 additional weeks

---

## How to Use These Documents

### For Backend Developers (Building Queries & APIs)

1. Read **AUDIT_SUMMARY.txt** → understand the context
2. Reference **FSRS_BKT_IMPLEMENTATION_REFERENCE.md** Part 1 for SQL templates
3. Use Part 2-5 for specific features you're implementing
4. Run unit tests from Part 6 before integration testing

### For Frontend Developers (Building UI)

1. Read **AUDIT_SUMMARY.txt** → understand what readiness % means
2. Skim Part 1 of implementation guide to understand data shapes
3. Key data structures:
   - `daily_load`: { projected_review_date, card_count, estimated_hours, feasibility }
   - `exam_readiness`: { weighted_readiness_pct, readiness_status, days_to_exam }
   - `weak_topics`: [ { subtopic_name, p_know, deficit_score, overdue_cards } ]

### For Product Managers (Planning Features)

1. Read **AUDIT_SUMMARY.txt** fully
2. Pay attention to:
   - Implementation roadmap (which sprints)
   - Critical risks section (what can go wrong)
   - Questions for Product Team (decisions needed)
3. Decide on:
   - Will professors define exam blueprints?
   - Auto-suggest or auto-apply load redistribution?
   - How to message knowledge decay?

### For QA/Testing

1. Use **FSRS_BKT_IMPLEMENTATION_REFERENCE.md** Part 6
2. Test focus areas:
   - Never modify fsrs_states directly (smoke test)
   - NeedScore extends correctly with exam urgency
   - Overloaded days are detected and redistributed correctly
   - Decay model produces reasonable predictions (compare to human estimate)

---

## Critical Constraints (Don't Forget!)

1. **FSRS stability must never be directly modified**
   - Use exam_schedules table for overrides (ephemeral, not persisted to fsrs_states)
   
2. **BKT knowledge decay is NOT modeled by default**
   - Document this assumption in readiness UI
   - Implement decay model in Tier 2
   
3. **Use median (percentile_cont 0.50), not average, for student timeliness**
   - Average is skewed by occasional long gaps
   
4. **Medical students have thousands of cards**
   - Heatmap will show 300+ cards on some days
   - This is unsustainable (5+ hours); warn at 150+ cards
   
5. **Exam blueprints are not yet defined in the system**
   - Current workaround: weight by topic_weight
   - Tier 2 feature: add exam_blueprints table (professor input)

---

## Roadmap Summary

### Sprint 1-2 (Weeks 1-3) — MVP ✓ Safe
- [ ] Add topic_weight column to topics
- [ ] Implement weighted readiness (Q2)
- [ ] Timeliness profile query (Q1)
- [ ] Weak topics identification (Q3)
- [ ] Daily load feasibility (Q7)
- [ ] Calendar heatmap MVP

**Deliverable:** Heatmap showing projected workload + readiness %

### Sprint 3-4 (Weeks 4-6) — Exam-Aware
- [ ] exams table
- [ ] exam_schedules table (ephemeral overrides)
- [ ] Extend NeedScore with exam_urgency (Q4)
- [ ] 90-day review forecast (Q5)
- [ ] Auto-redistribute overloaded days (Q7)

**Deliverable:** Study queue with exam awareness

### Sprint 5+ (Weeks 7+) — Knowledge Science
- [ ] Power-law decay model (Q6)
- [ ] Exam readiness with decay prediction
- [ ] Exam blueprint mapping (Q2)

**Deliverable:** Full exam-aware calendar with knowledge decay

---

## File Locations

```
/AXON PROJECTO/
├── docs/
│   ├── AUDIT_SUMMARY.txt  ........................ Quick overview
│   ├── AUDIT_FSRS_BKT_CALENDAR_2026-03-27.md .. Main audit (full)
│   ├── FSRS_BKT_IMPLEMENTATION_REFERENCE.md ... Code templates
│   ├── README_AUDIT_FSRS_BKT.md ............... This file
│   ├── ideas-calendario-finales-argentina.md .. Original ideas (product)
│   └── IDEAS-PERSONALIZACION-DEEP-LOOPS.md ... Related personalization
│
├── .claude/
│   ├── agents/flashcards-fsrs.md ............. FSRS agent profile
│
└── .auto-memory/
    └── audit_fsrs_bkt_calendar.md ............ Project memory (quick ref)
```

---

## Next Steps

1. **Product Team:** Review AUDIT_SUMMARY.txt, answer the 5 Product Questions
2. **Backend:** Start with Sprint 1-2 (Tier 1) using FSRS_BKT_IMPLEMENTATION_REFERENCE.md
3. **Frontend:** Plan heatmap + readiness UI based on data structures
4. **QA:** Prepare test cases (especially FSRS state integrity checks)
5. **All:** Link to this README in sprint docs so team knows where to find answers

---

**Questions?** Each document has learning science reasoning. If something seems odd, check the full audit (AUDIT_FSRS_BKT_CALENDAR_2026-03-27.md) section for that question number.

