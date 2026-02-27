# Database Constraints

> CHECK, UNIQUE, FK, and PK constraints.
> **STATUS: TEMPLATE — Run Query 2 in Supabase SQL Editor to populate.**

## Query 2 (run in Supabase SQL Editor)

```sql
-- CHECK constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK'
  AND tc.table_name NOT LIKE 'kv_store_%'
ORDER BY tc.table_name, tc.constraint_name;

-- UNIQUE constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'UNIQUE'
  AND tc.table_name NOT LIKE 'kv_store_%'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;

-- Foreign Key constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name NOT LIKE 'kv_store_%'
ORDER BY tc.table_name;

-- Primary Key constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_name NOT LIKE 'kv_store_%'
ORDER BY tc.table_name;
```

## Results

> Paste the output below after running the query.

### CHECK Constraints

| Table | Constraint | Check Clause |
|---|---|---|
| _run query and paste here_ | | |

### UNIQUE Constraints

| Table | Constraint | Columns |
|---|---|---|
| memberships | (expected) | user_id, institution_id |
| institutions | (expected) | slug |
| _run query for complete list_ | | |

### Foreign Keys

| Table | Column | References |
|---|---|---|
| courses | institution_id | institutions.id |
| semesters | course_id | courses.id |
| sections | semester_id | semesters.id |
| topics | section_id | sections.id |
| summaries | topic_id | topics.id |
| chunks | summary_id | summaries.id |
| keywords | summary_id | summaries.id |
| flashcards | keyword_id | keywords.id |
| quiz_questions | keyword_id | keywords.id |
| videos | keyword_id | keywords.id |
| memberships | user_id | profiles.id |
| memberships | institution_id | institutions.id |
| _run query to verify and complete_ | | |

### Primary Keys

All tables use `id UUID` as PK (verify with query).
