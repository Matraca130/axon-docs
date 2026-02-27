# Known Bugs

> Confirmed bugs from audits. **UPDATED with Query 2/3 corrections.**

## Critical

### BUG-001: `resolution_tier` vs `max_resolution` column mismatch

- **Location:** `routes-mux.ts` (webhook handler)
- **Problem:** Webhook writes to `resolution_tier` but the DB column is `max_resolution`
- **Impact:** Video resolution data never saves
- **Fix:** Change column name in the INSERT/UPDATE query
- **Hotfix ID:** HF-D
- **New info:** Videos also have `mux_asset_id` and `mux_upload_id` columns (indexed)

### BUG-002: RLS disabled on study tables

- **Tables:** `flashcards`, `quiz_questions`, `quizzes`
- **Problem:** No Row Level Security
- **Impact:** Data leakage between institutions
- **Fix:** Enable RLS + add policies scoped by institution_id via summaries chain

### BUG-003: JWT not cryptographically verified

- **Location:** Auth middleware
- **Problem:** Backend accepts JWTs without verifying the signature
- **Impact:** Anyone can forge a valid-looking token
- **Fix:** Verify JWT signature against Supabase JWT secret

## High

### BUG-004: CORS origin: "*"

- **Location:** CORS middleware
- **Problem:** Accepts requests from any origin
- **Fix:** Restrict to Vercel deployment URLs

### BUG-005: `flashcards.keyword_id` nullable inconsistency

- **DB:** `keyword_id` is NULLABLE
- **Backend:** `keyword_id` is in `requiredFields`
- **Fix:** Align DB and backend (pick one)

### BUG-010 (NEW): Duplicate indexes waste storage

- **7 pairs** of identical unique indexes on legitimate tables
- **~150+ junk indexes** on kv_store_* tables
- **Fix:** See `database/rls-and-indexes.md` cleanup SQL

### BUG-011 (NEW): `deleted_at` vs `is_active` dual soft-delete

- **Tables:** flashcards, keywords, models_3d, quiz_questions, quizzes, subtopics, summaries
- **Problem:** These tables have BOTH `is_active` boolean AND `deleted_at` timestamp
- **Impact:** Unclear which one controls visibility; indexes use `deleted_at IS NULL`
- **Fix:** Standardize on one pattern across all tables

## Medium

### BUG-006: Study Queue ~5 sequential queries

- **Fix:** Combine into 1-2 queries or use a DB function

### BUG-007: Content Tree filters in JS

- **Fix:** Add WHERE clause to filter at DB level

### BUG-008: Search makes ~100 queries

- **Fix:** Use PostgreSQL full-text search or UNION query

### BUG-009: Reorder does N individual UPDATEs

- **Fix:** Use single UPDATE with CASE or unnest

### BUG-012 (NEW): `reviews` table structure mismatch

- **What was documented:** `user_id`, `flashcard_id`, `quiz_question_id`, `rating`
- **What actually exists:** `session_id`, `item_id`, `instrument_type`, `grade`
- **Impact:** Frontend `submitReview` function (HF-B) must use correct column names
- **Fix:** Update platformApi.ts to match actual schema

### BUG-013 (NEW): `study_sessions` structure mismatch

- **What was documented:** `user_id`, `topic_id`, `score`
- **What actually exists:** `student_id`, `course_id`, `total_reviews`, `correct_reviews`
- **Impact:** Frontend `createStudySession`/`updateStudySession` (HF-B) must use correct columns
- **Fix:** Update platformApi.ts to match actual schema
