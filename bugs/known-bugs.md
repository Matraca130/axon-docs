# Known Bugs

> Confirmed bugs from audits. **UPDATED 2025-02-27.**

## Critical

### BUG-001: `resolution_tier` vs `max_resolution` column mismatch

- **Location:** `routes-mux.ts` (webhook handler)
- **Problem:** Webhook writes to `resolution_tier` but the DB column is `max_resolution`
- **Impact:** Video resolution data never saves
- **Fix:** Change column name in the INSERT/UPDATE query
- **Hotfix ID:** HF-D
- **Status:** PENDING

### BUG-002: RLS disabled on all 43 tables

- **Tables:** ALL (confirmed via Query 3b: 0 policies, 0 RLS enabled)
- **Problem:** No Row Level Security anywhere
- **Impact:** Defense-in-depth missing (backend uses service_role so primary security is OK)
- **Fix:** Enable RLS + add policies on high-priority tables
- **Status:** DEFERRED — will apply after site is feature-complete

### BUG-003: JWT not cryptographically verified

- **Location:** Auth middleware
- **Problem:** Backend accepts JWTs without verifying the signature
- **Impact:** Anyone can forge a valid-looking token
- **Fix:** Verify JWT signature against Supabase JWT secret
- **Status:** PENDING

## High

### BUG-004: CORS origin: "*"

- **Location:** CORS middleware
- **Problem:** Accepts requests from any origin
- **Fix:** Restrict to Vercel deployment URLs
- **Status:** PENDING

### BUG-005: `flashcards.keyword_id` nullable inconsistency

- **DB:** `keyword_id` is NULLABLE
- **Backend:** `keyword_id` is in `requiredFields`
- **Fix:** Align DB and backend (pick one)
- **Status:** PENDING

### BUG-010: Duplicate indexes — FIXED

- **Status:** DONE (2025-02-27)
- ~25 `kv_store_*` tables dropped (~150 junk indexes)
- 6 duplicate indexes on legitimate tables dropped
- See `database/rls-and-indexes.md` cleanup log

### BUG-011: `deleted_at` vs `is_active` dual soft-delete

- **Tables:** flashcards, keywords, models_3d, quiz_questions, quizzes, subtopics, summaries
- **Problem:** These tables have BOTH `is_active` boolean AND `deleted_at` timestamp
- **Impact:** Unclear which one controls visibility; indexes use `deleted_at IS NULL`
- **Fix:** Standardize on one pattern across all tables
- **Status:** PENDING

## Medium

### BUG-006: Study Queue ~5 sequential queries

- **Fix:** Combine into 1-2 queries or use a DB function
- **Status:** PENDING

### BUG-007: Content Tree filters in JS

- **Fix:** Add WHERE clause to filter at DB level
- **Status:** PENDING

### BUG-008: Search makes ~100 queries

- **Fix:** Use PostgreSQL full-text search or UNION query
- **Status:** PENDING

### BUG-009: Reorder does N individual UPDATEs

- **Fix:** Use single UPDATE with CASE or unnest
- **Status:** PENDING

### BUG-012: `reviews` table payload mismatch — FIXED

- **Was:** Build error (HF-B) → reclassified as RT-003, RT-004
- **Fix:** Removed `response_time_ms`, `subtopic_id`, `keyword_id` from payloads
- **Status:** DONE (2025-02-27)

### BUG-013: `study_sessions` payload mismatch — FIXED

- **Was:** Build error (HF-B) → reclassified as RT-001, RT-002
- **Fix:** `ended_at` → `completed_at`, removed `duration_seconds`, `user_id` → `student_id`
- **Status:** DONE (2025-02-27)

## Low / Info

### BUG-014: Bundle size 3.2 MB — FIXED

- **Was:** Single chunk 3,236 KB (879 KB gzipped)
- **Fix:** Route-level code splitting with React Router `lazy` + vendor manualChunks
- **Details:** See `frontend/bundle-optimization.md`
- **Status:** DONE (2025-02-27)
