# RLS Status & Indexes

> Row Level Security status and database indexes.
> **STATUS: TEMPLATE — Run Query 3 in Supabase SQL Editor to populate.**

## Query 3 (run in Supabase SQL Editor)

```sql
-- RLS status per table
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'kv_store_%'
ORDER BY tablename;

-- Existing RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'kv_store_%'
ORDER BY tablename, policyname;

-- Indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'kv_store_%'
ORDER BY tablename, indexname;
```

## RLS Status

> Paste output here after running query.

### Known RLS Issues (from audit)

| Table | RLS Enabled | Has Policies | Issue |
|---|---|---|---|
| flashcards | ❌ NO | ❌ | Multi-tenancy broken |
| quiz_questions | ❌ NO | ❌ | Multi-tenancy broken |
| quizzes | ❌ NO | ❌ | Multi-tenancy broken |
| _other tables_ | _run query_ | _run query_ | |

### RLS Priority Actions

1. Enable RLS on flashcards, quiz_questions, quizzes
2. Add institution-scoped policies (see `bugs/security-audit.md` for example SQL)
3. Verify all other tables have appropriate policies

## Indexes

> Paste output here after running query.

### Expected Important Indexes

| Table | Column(s) | Purpose |
|---|---|---|
| courses | institution_id | Multi-tenancy filter |
| semesters | course_id | Parent lookup |
| sections | semester_id | Parent lookup |
| topics | section_id | Parent lookup |
| summaries | topic_id | Parent lookup |
| keywords | summary_id | Parent lookup |
| flashcards | keyword_id | Parent lookup |
| quiz_questions | keyword_id | Parent lookup |
| memberships | user_id | Auth lookup |
| memberships | institution_id | Auth lookup |
| memberships | (user_id, institution_id) | Unique + lookup |

### Recommended Missing Indexes

_Determine after running Query 3 and comparing with expected list above._
