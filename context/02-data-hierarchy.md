# 02 -- Data Hierarchy

> The core data model of Axon. **UPDATED with Query 2 corrections.**

## Hierarchy (Corrected)

```
Institution
  +-- Course
  |     +-- Semester
  |     |     +-- Section
  |     |           +-- Topic
  |     |                 +-- Summary
  |     |                 |     +-- Chunks
  |     |                 |     +-- Keywords
  |     |                 |     |     +-- Subtopics
  |     |                 |     |     |     +-- BKT States (per student)
  |     |                 |     |     |     +-- Flashcards (subtopic_id FK)
  |     |                 |     |     |     +-- Quiz Questions (subtopic_id FK)
  |     |                 |     |     +-- Flashcards (keyword_id FK, nullable)
  |     |                 |     |     +-- Keyword Connections
  |     |                 |     |     +-- Kw Prof Notes
  |     |                 |     |     +-- Kw Student Notes
  |     |                 |     |     +-- Model 3D Pins (keyword_id FK)
  |     |                 |     +-- Videos
  |     |                 |     +-- Quizzes
  |     |                 |     +-- Quiz Questions (summary_id FK)
  |     |                 |     +-- Flashcards (summary_id FK)
  |     |                 |     +-- Summary Diagnostics
  |     |                 |     +-- Text Annotations (per student)
  |     |                 |     +-- Reading States (per student)
  |     |                 +-- Models 3D
  |     |                       +-- Model Layers
  |     |                       +-- Model Parts
  |     |                       +-- Model 3D Pins
  |     |                       +-- Model 3D Notes (per student)
  |     +-- Study Sessions (course_id FK)
  |     +-- Study Plans (course_id FK)
  +-- Institution Plans
  |     +-- Plan Access Rules
  |     +-- Memberships (institution_plan_id FK)
  +-- Institution Subscriptions
  +-- Memberships
        +-- Admin Scopes

Platform Plans (global, no institution)
Profiles (= auth.users)
  +-- Student Stats
  +-- Daily Activities
  +-- AI Generations
```

## Key Relationships (Corrected)

| Parent | Child | FK Column | Notes |
|---|---|---|---|
| Institution | Course | `institution_id` | Multi-tenancy root |
| Course | Semester | `course_id` | |
| Semester | Section | `semester_id` | |
| Section | Topic | `section_id` | |
| Topic | Summary | `topic_id` | Usually 1:1 |
| Topic | Model 3D | `topic_id` | 3D viewer support |
| Summary | Chunk | `summary_id` | Ordered content |
| Summary | Keyword | `summary_id` | Key terms |
| Summary | Video | `summary_id` | **FK is summary_id NOT keyword_id** |
| Summary | Quiz | `summary_id` | **FK is summary_id NOT keyword_id** |
| Summary | Flashcard | `summary_id` | Primary parent |
| Summary | Quiz Question | `summary_id` | Primary parent |
| Keyword | Subtopic | `keyword_id` | Sub-divisions |
| Keyword | Flashcard | `keyword_id` | **NULLABLE** secondary FK |
| Keyword | Quiz Question | `keyword_id` | **NULLABLE** secondary FK |
| Keyword | Keyword Connection | `keyword_a_id`, `keyword_b_id` | Bidirectional |
| Subtopic | BKT State | `subtopic_id` | Per-student knowledge state |
| Subtopic | Flashcard | `subtopic_id` | Optional tertiary FK |
| Subtopic | Quiz Question | `subtopic_id` | Optional tertiary FK |

## Multi-Tenancy

All queries scoped by `institution_id` through the membership chain.

## Ordering

All ordering uses `order_index` INTEGER NOT NULL (NOT `sort_order`).

## Roles (CORRECTED: 4 not 3)

| Role | Value |
|---|---|
| Student | `student` |
| Professor | `professor` |
| Admin | `admin` |
| Owner | `owner` |
