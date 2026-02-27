# 02 — Data Hierarchy

> The core data model of Axon. Updated with Query 2 real data.

## Hierarchy (corrected)

```
Institution
  ├── Course
  │     └── Semester
  │           └── Section
  │                 └── Topic
  │                       ├── Summary
  │                       │     ├── Chunks
  │                       │     ├── Keywords → Subtopics
  │                       │     │              └── BKT States (per student)
  │                       │     ├── Keyword Connections (many-to-many)
  │                       │     ├── Flashcards → FSRS States (per student)
  │                       │     ├── Quiz Questions
  │                       │     ├── Videos → Video Views (per student)
  │                       │     ├── Reading States (per student)
  │                       │     ├── Text Annotations (per student)
  │                       │     └── Summary Diagnostics (AI)
  │                       └── Models 3D
  │                             ├── Pins
  │                             ├── Layers
  │                             ├── Parts
  │                             └── Notes (per student)
  ├── Institution Plans
  │     └── Plan Access Rules
  └── Memberships
        └── Admin Scopes

Quizzes (linked to Summary)
  └── Quiz Questions
       └── Quiz Attempts (per student)

Study Sessions (per student + course)
  ├── Reviews
  └── Quiz Attempts

Study Plans (per student + course)
  └── Study Plan Tasks

Student Stats / Daily Activities (per student)
AI Generations (per institution)
```

## Key Relationships (corrected)

| Parent | Child | FK Column | Notes |
|---|---|---|---|
| Institution | Course | `institution_id` | Multi-tenancy root |
| Course | Semester | `course_id` | |
| Semester | Section | `semester_id` | |
| Section | Topic | `section_id` | |
| Topic | Summary | `topic_id` | Usually 1:1 |
| Topic | Model 3D | `topic_id` | |
| Summary | Chunk | `summary_id` | |
| Summary | Keyword | `summary_id` | |
| Summary | Flashcard | `summary_id` | ⚠️ Links to summary, not just keyword |
| Summary | Quiz Question | `summary_id` | ⚠️ Links to summary |
| Summary | Quiz | `summary_id` | ⚠️ Links to summary |
| Summary | Video | `summary_id` | ⚠️ Links to summary, not keyword |
| Keyword | Subtopic | `keyword_id` | |
| Membership | Admin Scope | `membership_id` | Granular perms |
| Institution | Institution Plan | `institution_id` | |
| Institution Plan | Plan Access Rule | `plan_id` | |

## Ordering

All orderable entities use `order_index` (INTEGER, NOT NULL), NOT `sort_order`.

## Real Table Count

~35 real application tables + ~25 `kv_store_*` junk tables.
