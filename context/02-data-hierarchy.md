# 02 -- Data Hierarchy

> The core data model of Axon. **Updated: 2026-03-14 (audit pass 5)**

## Hierarchy

```
Institution
  +-- Course
  |     +-- Semester
  |     |     +-- Section
  |     |           +-- Topic
  |     |                 +-- Summary (institution_id denormalized, pdf_source_url/page_start/page_end)
  |     |                 |     +-- Chunks (embedding 1536d OpenAI, fts tsvector)
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
  +-- WhatsApp Accounts + Sessions + Messages + Jobs

Platform Plans (global, no institution)
Profiles (= auth.users)
  +-- Student Stats (XP, level, streaks)
  +-- Student XP (aggregate per institution)
  +-- XP Transactions (immutable log)
  +-- Student Badges
  +-- Streak Freezes
  +-- Streak Repairs
  +-- Daily Activities
  +-- AI Generations
  +-- FSRS States (per flashcard)
  +-- BKT States (per subtopic)

System Tables:
  +-- RAG Query Log (RLS enabled)
  +-- AI Content Reports
  +-- Processed Webhook Events
  +-- Rate Limit (UNLOGGED)
  +-- MV: mv_student_knowledge_profile
  +-- MV: leaderboard_weekly (hourly refresh)
```

## Key Relationships

| Parent | Child | FK Column | Notes |
|---|---|---|---|
| Institution | Course | `institution_id` | Multi-tenancy root |
| Course | Semester | `course_id` | |
| Semester | Section | `semester_id` | |
| Section | Topic | `section_id` | |
| Topic | Summary | `topic_id` | Usually 1:1 |
| Topic | Model 3D | `topic_id` | 3D viewer |
| Summary | Chunk | `summary_id` | Ordered, **1536d embeddings** |
| Summary | Keyword | `summary_id` | Key terms |
| Summary | Video | `summary_id` | **FK is summary_id NOT keyword_id** |
| Summary | Flashcard | `summary_id` | Primary parent |
| Keyword | Subtopic | `keyword_id` | Max 6 |
| Keyword | Flashcard | `keyword_id` | **NULLABLE** secondary FK |
| Keyword | Keyword Connection | `keyword_a_id`, `keyword_b_id` | Canonical a<b |

## Multi-Tenancy

All queries scoped by `institution_id`. Summaries have denormalized `institution_id`.

## Ordering: `order_index` INTEGER (NOT `sort_order`)

## Roles: owner(4), admin(3), professor(2), student(1)
