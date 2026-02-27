# 02 — Data Hierarchy

> The core data model of Axon. Every entity belongs to a parent in this tree.

## Hierarchy

```
Institution
  └── Course
        └── Semester
              └── Section
                    └── Topic
                          └── Summary
                                ├── Chunks
                                ├── Keywords
                                │     ├── Flashcards
                                │     ├── Quiz Questions
                                │     └── Videos
                                └── (direct children)
```

## Key Relationships

| Parent | Child | FK Column | Notes |
|---|---|---|---|
| Institution | Course | `institution_id` | Multi-tenancy root |
| Course | Semester | `course_id` | |
| Semester | Section | `semester_id` | |
| Section | Topic | `section_id` | |
| Topic | Summary | `topic_id` | Usually 1:1 |
| Summary | Chunk | `summary_id` | Ordered pieces of content |
| Summary | Keyword | `summary_id` | Key terms extracted |
| Keyword | Flashcard | `keyword_id` | **NULLABLE in DB, REQUIRED in backend** |
| Keyword | Quiz Question | `keyword_id` | Required |
| Keyword | Video | `keyword_id` | |

## Multi-Tenancy

All queries are scoped by `institution_id`. A user can only access data from institutions they belong to via `memberships`.

## Ordering

Many entities have a `sort_order` or `position` column for manual reordering. The reorder endpoint currently does N individual UPDATE queries (known scalability issue).
