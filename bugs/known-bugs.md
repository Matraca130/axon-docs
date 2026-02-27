# Known Bugs

> Confirmed bugs from the backend audit. Cross-referenced against DB schema.

## Critical

### BUG-001: `resolution_tier` vs `max_resolution` column mismatch

- **Location:** `routes-mux.ts` (webhook handler)
- **Problem:** Webhook writes to `resolution_tier` but the DB column is `max_resolution`
- **Impact:** Video resolution data never saves
- **Fix:** Change column name in the INSERT/UPDATE query
- **Hotfix ID:** HF-D

### BUG-002: RLS disabled on study tables

- **Tables:** `flashcards`, `quiz_questions`, `quizzes`
- **Problem:** No Row Level Security — any authenticated user can read/write any row
- **Impact:** Data leakage between institutions (multi-tenancy broken)
- **Fix:** Enable RLS + add policies scoped by institution_id via memberships

### BUG-003: JWT not cryptographically verified

- **Location:** Auth middleware
- **Problem:** Backend accepts JWTs without verifying the signature
- **Impact:** Anyone can forge a valid-looking token
- **Fix:** Verify JWT signature against Supabase JWT secret

## High

### BUG-004: CORS origin: "*"

- **Location:** CORS middleware
- **Problem:** Accepts requests from any origin
- **Impact:** Any website can make API calls to your backend
- **Fix:** Restrict to Vercel deployment URLs

### BUG-005: `flashcards.keyword_id` nullable inconsistency

- **DB:** `keyword_id` is NULLABLE
- **Backend:** `keyword_id` is in `requiredFields` array
- **Impact:** Backend rejects null but DB allows it. `ensureGeneralKeyword` masks this.
- **Fix:** Either make DB column NOT NULL, or remove from requiredFields

## Medium

### BUG-006: Study Queue ~5 sequential queries

- **Location:** Study queue endpoint
- **Problem:** Makes ~5 DB queries one after another instead of a single optimized query
- **Impact:** Slow response under load
- **Fix:** Combine into 1-2 queries or use a DB function

### BUG-007: Content Tree filters in JS

- **Location:** Content tree endpoint
- **Problem:** Fetches all records then filters inactive ones in JavaScript
- **Impact:** Wastes bandwidth and memory; slow for large datasets
- **Fix:** Add WHERE clause to filter at DB level

### BUG-008: Search makes ~100 queries

- **Location:** Search endpoint
- **Problem:** Searches across multiple tables with individual queries
- **Impact:** Very slow; O(n) queries per search
- **Fix:** Use PostgreSQL full-text search or a single UNION query

### BUG-009: Reorder does N individual UPDATEs

- **Location:** Reorder endpoint
- **Problem:** Updates each item's `sort_order` one at a time
- **Impact:** Slow for large lists; no transaction wrapping
- **Fix:** Use a single UPDATE with CASE or unnest
