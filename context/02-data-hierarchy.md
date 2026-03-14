# 02 -- Data Hierarchy

> The core data model of Axon. **Updated: 2026-03-14**

## Hierarchy

```
Institution
  +-- Course
  |     +-- Semester
  |     |     +-- Section
  |     |           +-- Topic
  |     |                 +-- Summary (institution_id denormalized)
  |     |                 |     +-- Chunks (embedding 768d, fts tsvector)
  |     |                 |     +-- Summary Blocks
  |     |                 |     +-- Keywords
  |     |                 |     |     +-- Subtopics (max 6 per keyword)
  |     |                 |     |     |     +-- BKT States (per student)
  |     |                 |     |     |     +-- Flashcards (subtopic_id FK)
  |     |                 |     |     |     +-- Quiz Questions (subtopic_id FK)
  |     |                 |     |     +-- Flashcards (keyword_id FK, nullable)
  |     |                 |     |     +-- Keyword Connections (bidirectional, canonical a<b)
  |     |                 |     |     +-- Kw Prof Notes
  |     |                 |     |     +-- Kw Student Notes
  |     |                 |     |     +-- Model 3D Pins (keyword_id FK)
  |     |                 |     +-- Videos (Mux)
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
  |           +-- Study Plan Tasks
  +-- Institution Plans
  |     +-- Plan Access Rules
  |     +-- Memberships (institution_plan_id FK)
  +-- Institution Subscriptions
  +-- Memberships
  |     +-- Admin Scopes
  +-- Badge Definitions (institution-scoped)
  +-- Algorithm Config (NeedScore weights)

Platform Plans (global, no institution)
Profiles (= auth.users)
  +-- Student Stats (XP, level, streaks)
  +-- XP History
  +-- Student Badges
  +-- Badge Notifications
  +-- Streak Repairs
  +-- Streak Freezes
  +-- Daily Activities
  +-- AI Generations
  +-- FSRS States (per flashcard)
  +-- BKT States (per subtopic)

System Tables:
  +-- RAG Query Log (RLS enabled)
  +-- AI Content Reports
  +-- Processed Webhook Events
  +-- Rate Limit (UNLOGGED)
  +-- Materialized View: mv_student_knowledge_profile
```

## Key Relationships

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
| Keyword | Subtopic | `keyword_id` | Sub-divisions (max 6) |
| Keyword | Flashcard | `keyword_id` | **NULLABLE** secondary FK |
| Keyword | Quiz Question | `keyword_id` | **NULLABLE** secondary FK |
| Keyword | Keyword Connection | `keyword_a_id`, `keyword_b_id` | Bidirectional, canonical a<b |
| Subtopic | BKT State | `subtopic_id` | Per-student knowledge state |

## Multi-Tenancy

All queries scoped by `institution_id` through the membership chain.
`summaries` has denormalized `institution_id` (migration `20260304_06`).

## Ordering

All ordering uses `order_index` INTEGER NOT NULL (NOT `sort_order`).

## Roles (4 roles)

| Role | Value | Level |
|---|---|---|
| Student | `student` | 1 |
| Professor | `professor` | 2 |
| Admin | `admin` | 3 |
| Owner | `owner` | 4 |
