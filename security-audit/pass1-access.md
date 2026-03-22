# Security Audit -- Pass 1: Access Control / RLS / IDOR

**Date:** 2026-03-18
**Auditor:** Infra Agent (Claude Opus 4.6)
**Scope:** crud-factory.ts, auth-helpers.ts, routes/members/*, RLS migrations, SECURITY DEFINER functions

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH     | 4 |
| MEDIUM   | 4 |
| LOW      | 3 |
| INFO     | 2 |

---

## Findings

### [ACCESS-001] RLS disabled on core content tables -- application-layer scoping only

- **Severity**: CRITICAL
- **Archivo**: Multiple tables: flashcards, quiz_questions, quizzes, keywords, subtopics, summaries, courses, semesters, sections, topics, chunks, keyword_connections, kw_prof_notes, models_3d, model_3d_pins, videos
- **Descripcion**: Only 8 tables have `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` in the migrations: `video_views`, `algorithm_config`, `ai_reading_config`, `rag_query_log`, `summary_blocks`, `whatsapp_links`, `telegram_links`, `messaging_admin_settings`. All core content-hierarchy tables (courses through subtopics) and learning instruments (flashcards, quiz_questions, quizzes, videos) have NO RLS enabled. Access control relies entirely on `checkContentScope()` in crud-factory.ts and `requireInstitutionRole()` in auth-helpers.ts.
- **Evidencia**: Searched all 62+ migrations. Only 8 `ENABLE ROW LEVEL SECURITY` statements found. Zero content-hierarchy tables are covered.
- **Impacto**: Any authenticated user who discovers the Supabase URL and anon key can bypass the Hono backend entirely and query PostgREST directly. They can read/write ALL content across ALL institutions. This is the single largest security gap in the system.
- **Documentado**: Yes -- BUG-003 in known-bugs.md (CRITICAL, Pending). Also H3 in DECISIONS.md (P1, PLANNED for D3 deploy).

---

### [ACCESS-002] bulk_reorder() SECURITY DEFINER callable by authenticated/anon, no institution scoping in SQL

- **Severity**: CRITICAL
- **Archivo**: `supabase/migrations/20260227_01_bulk_reorder.sql:75`
- **Descripcion**: The `bulk_reorder()` function is `SECURITY DEFINER` (bypasses RLS) and is `GRANT EXECUTE ... TO anon, authenticated`. It has a table allowlist but NO `auth.uid()` check and NO institution scoping inside the function. The Hono reorder.ts endpoint does check institution for content-hierarchy tables, but any authenticated user can call `bulk_reorder()` directly via PostgREST RPC, bypassing the Hono layer entirely. An attacker can reorder ANY institution's courses, semesters, topics, etc. by providing valid UUIDs.
- **Evidencia**:
  ```sql
  SECURITY DEFINER
  AS $$
  -- No auth.uid() check
  -- No institution_id check
  BEGIN
    IF p_table NOT IN ('courses', 'semesters', ...) THEN  -- table allowlist only
  ```
  ```sql
  GRANT EXECUTE ON FUNCTION bulk_reorder(text, jsonb) TO anon, authenticated;
  ```
- **Impacto**: Cross-tenant data manipulation. An attacker can scramble the order_index of all content in any institution.
- **Documentado**: No.

---

### [ACCESS-003] messaging_admin_settings getUserInstitution() picks first admin membership, not a specific one

- **Severity**: HIGH
- **Archivo**: `supabase/functions/server/routes/settings/messaging-admin.ts:38-49`
- **Descripcion**: The `getUserInstitution()` helper finds the FIRST institution where the user is admin/owner (`.limit(1).single()`). If a user is admin of multiple institutions, they will always operate on whichever membership Supabase returns first (non-deterministic without ORDER BY). The endpoint has no `institution_id` parameter from the caller. This means: (a) multi-institution admins cannot choose which institution to configure, and (b) race conditions could cause settings to be applied to the wrong institution.
- **Evidencia**:
  ```ts
  async function getUserInstitution(userId: string): Promise<string | null> {
    const db = getAdminClient();
    const { data } = await db
      .from("memberships")
      .select("institution_id, role")
      .eq("user_id", userId)
      .eq("is_active", true)
      .in("role", ["owner", "admin"])
      .limit(1)
      .single();
    return data?.institution_id ?? null;
  }
  ```
- **Impacto**: Admin of institution A could inadvertently configure messaging for institution B. Also uses `getAdminClient()` for the lookup itself, bypassing RLS unnecessarily.
- **Documentado**: Partially -- mentioned as "weak scoping" in the audit prompt's pre-identified findings.

---

### [ACCESS-004] gamification endpoints accept arbitrary institution_id without membership verification

- **Severity**: HIGH
- **Archivo**: `supabase/functions/server/routes/gamification/goals.ts:31-34, 80-83, 148-151`
- **Descripcion**: All three gamification goal endpoints (`PUT /daily-goal`, `POST /goals/complete`, `POST /onboarding`) accept `institution_id` from the request body but NEVER verify the caller has an active membership in that institution. They use `getAdminClient()` to write directly to `student_xp` and `xp_transactions`. An attacker can create XP records, claim goal bonuses, and initialize profiles in ANY institution.
- **Evidencia**:
  ```ts
  const institutionId = body.institution_id as string;
  if (!institutionId || !isUuid(institutionId)) {
    return err(c, "institution_id must be a valid UUID", 400);
  }
  // No requireInstitutionRole() check
  const adminDb = getAdminClient();
  const { data, error } = await adminDb.from("student_xp").upsert(...)
  ```
- **Impacto**: An authenticated user can manipulate gamification data for any institution. Could poison leaderboards, claim XP bonuses across institutions they don't belong to.
- **Documentado**: No.

---

### [ACCESS-005] subtopics-batch endpoint has no institution scoping

- **Severity**: HIGH
- **Archivo**: `supabase/functions/server/routes/content/subtopics-batch.ts:51-98`
- **Descripcion**: The `GET /subtopics-batch` endpoint accepts up to 50 keyword_ids and queries subtopics without ANY institution membership check. Compare with `keyword-connections-batch.ts` which correctly resolves institution from the first keyword and calls `requireInstitutionRole()`. The subtopics-batch endpoint skips this entirely.
- **Evidencia**:
  ```ts
  // No institution resolution
  // No requireInstitutionRole() call
  const { data, error } = await db
    .from("subtopics")
    .select("*")
    .in("keyword_id", ids)
    .is("deleted_at", null)
  ```
- **Impacto**: Any authenticated user can read subtopics from any institution by providing keyword_ids from that institution. Lower impact than write operations but still an information disclosure vulnerability.
- **Documentado**: No.

---

### [ACCESS-006] reorder endpoint only verifies institution for the first item

- **Severity**: HIGH
- **Archivo**: `supabase/functions/server/routes/content/reorder.ts:149-153`
- **Descripcion**: The reorder endpoint resolves institution from `typedItems[0].id` (the first item only). If an attacker sends items from different institutions in the same batch, only the first item's institution is checked. Items 2..N could belong to a different institution, and those would still be reordered.
- **Evidencia**:
  ```ts
  if (INSTITUTION_RESOLVABLE_TABLES.has(table)) {
    const { data: institutionId } = await db.rpc(
      "resolve_parent_institution",
      { p_table: table, p_id: typedItems[0].id },  // Only first item!
    );
  ```
- **Impacto**: An attacker who is a professor in institution A can inject item IDs from institution B into positions 2..N of a reorder batch. The bulk_reorder() function (SECURITY DEFINER) will execute the reorder without further checks.
- **Documentado**: No.

---

### [ACCESS-007] 12+ SECURITY DEFINER functions missing SET search_path

- **Severity**: MEDIUM
- **Archivo**: Multiple migrations (see list below)
- **Descripcion**: The following SECURITY DEFINER functions do NOT have `SET search_path = public, pg_temp`, making them vulnerable to search_path hijacking:
  1. `bulk_reorder` (20260227_01)
  2. `get_course_summary_ids` (20260227_02)
  3. `upsert_video_view` (20260227_03)
  4. `resolve_parent_institution` v2 (20260304_04)
  5. `search_scoped` (20260304_02)
  6. `trash_scoped` (20260304_02)
  7. `resolve_summary_institution` (20260304_02)
  8. `search_keywords_by_institution` (20260305_06)
  9. `get_student_knowledge_context` (20260305_02)
  10. `rag_hybrid_search` old v4 (20260305_03 / 20260306_02_restore)
  11. `ai_report_stats` (20260308_03)
  12. `search_keywords_by_institution` v2 (20260306_02_search_kw)
  13. `fts_search_content` (20260306_02_fts / 20260306_03)
  14. `upsert_summary_embedding` (20260307_03)
  15. `sync_summary_institution_id` (20260304_06, trigger function)

  Only the hardened functions from 20260311_02 and 20260318_01 have search_path set. The trigger functions from 20260228_01 (on_review_inserted, on_study_session_completed) DO have it.
- **Evidencia**: Confirmed by searching each migration file for `search_path`. No matches in the listed files.
- **Impacto**: If an attacker can create a schema or temp table with the same name as a referenced table (e.g. `memberships`), they could hijack the function's execution path. Exploitation requires CREATE SCHEMA or CREATE TABLE in pg_temp privilege, which authenticated users do not have by default in Supabase. Risk is LOW in practice but the pattern violates PostgreSQL security best practices.
- **Documentado**: Partially -- DECISIONS.md mentions search_path in the context of the 3 hardened RAG functions but does not track the remaining functions.

---

### [ACCESS-008] get_course_summary_ids() SECURITY DEFINER with GRANT to anon/authenticated, no auth check

- **Severity**: MEDIUM
- **Archivo**: `supabase/migrations/20260227_02_get_course_summary_ids.sql:20-31`
- **Descripcion**: The function is `SECURITY DEFINER` and `GRANT EXECUTE TO anon, authenticated`. It has NO `auth.uid()` check and NO institution membership verification. Any authenticated user (or anon caller) can enumerate all summary IDs for any course by providing a `course_id`.
- **Evidencia**:
  ```sql
  SECURITY DEFINER
  AS $$
    SELECT DISTINCT s.id FROM summaries s ... WHERE sem.course_id = p_course_id ...
  $$;
  GRANT EXECUTE ON FUNCTION get_course_summary_ids(uuid) TO anon, authenticated;
  ```
- **Impacto**: Information disclosure -- any user can enumerate summary IDs in any course. These IDs could be used to access summaries directly via PostgREST (given ACCESS-001, RLS is disabled on summaries).
- **Documentado**: No.

---

### [ACCESS-009] upsert_video_view() SECURITY DEFINER with GRANT to anon/authenticated, accepts arbitrary user_id

- **Severity**: MEDIUM
- **Archivo**: `supabase/migrations/20260227_03_upsert_video_view.sql:36-79`
- **Descripcion**: The function is `SECURITY DEFINER` and accepts `p_user_id` as a parameter (not derived from `auth.uid()`). Any authenticated user can call it via PostgREST RPC with another user's ID, creating or modifying video view records for that user.
- **Evidencia**:
  ```sql
  CREATE OR REPLACE FUNCTION upsert_video_view(
    p_video_id uuid,
    p_user_id uuid,       -- Caller-supplied, not auth.uid()
    p_institution_id uuid,
    ...
  )
  SECURITY DEFINER
  ...
  GRANT EXECUTE ON FUNCTION upsert_video_view(...) TO anon, authenticated;
  ```
- **Impacto**: An attacker can inflate or manipulate video view statistics for any user. Could affect analytics, completion tracking, and BKT/FSRS learning algorithms.
- **Documentado**: No.

---

### [ACCESS-010] resolve_parent_institution() v2 missing search_path and GRANT to authenticated

- **Severity**: MEDIUM
- **Archivo**: `supabase/migrations/20260304_04_resolve_parent_institution_v2.sql:24,186`
- **Descripcion**: This is the critical institution-resolution function used by `checkContentScope()` in the CRUD factory. It is `SECURITY DEFINER` without `SET search_path`. Additionally, it is `GRANT EXECUTE TO authenticated`, meaning any authenticated user can call it directly via PostgREST to discover which institution any content row belongs to.
- **Evidencia**:
  ```sql
  SECURITY DEFINER
  AS $$  -- No SET search_path
  ...
  GRANT EXECUTE ON FUNCTION resolve_parent_institution(TEXT, UUID) TO authenticated;
  ```
- **Impacto**: (a) search_path hijacking risk (theoretical). (b) Information disclosure: any authenticated user can map any content ID to its institution_id. While this alone is low severity, combined with ACCESS-001 (no RLS), it becomes a reconnaissance tool.
- **Documentado**: No.

---

### [ACCESS-011] JWT not cryptographically verified in authenticate() -- forged JWT accepted

- **Severity**: LOW (mitigated)
- **Archivo**: `supabase/functions/server/db.ts:100-123`
- **Descripcion**: `authenticate()` decodes the JWT payload via `atob()` without verifying the cryptographic signature. The code comments explicitly acknowledge this (lines 97-98, 129-143). Signature validation is deferred to PostgREST when the first DB query is made. However, routes that call external APIs (OpenAI, Gemini, Stripe, Mux, Telegram) WITHOUT making a DB query first would accept a forged JWT.
- **Evidencia**:
  ```ts
  const decodeJwtPayload = (token: string) => {
    // ... atob decode, no signature check
  };
  ```
  Comment on line 136-143:
  ```ts
  // If a route calls an external API using user.id WITHOUT
  // making any Supabase DB query, the JWT is NEVER validated.
  // An attacker could forge a JWT and consume paid API credits.
  ```
- **Impacto**: Depends on route implementation. Content routes are protected because they always query DB (PostgREST validates). AI routes and webhook routes may be vulnerable.
- **Documentado**: Yes -- BUG-002 in known-bugs.md (MEDIUM, Mitigated). H1 in DECISIONS.md (P0, PLANNED for D2).

---

### [ACCESS-012] canAssignRole() allows owner-to-owner assignment (intentional but worth noting)

- **Severity**: LOW
- **Archivo**: `supabase/functions/server/auth-helpers.ts:293-299`
- **Descripcion**: `canAssignRole("owner", "owner")` returns true (4 >= 4). This means an existing owner can create additional owners. While this is the intended design (documented in comments), it means privilege escalation is possible if an owner account is compromised -- the attacker can create more owner accounts.
- **Evidencia**:
  ```ts
  export function canAssignRole(callerRole: string, targetRole: string): boolean {
    const callerLevel = ROLE_HIERARCHY[callerRole] ?? 0;
    const targetLevel = ROLE_HIERARCHY[targetRole] ?? Infinity;
    return callerLevel >= targetLevel;
  }
  ```
- **Impacto**: If an owner account is compromised, the attacker can create additional owners that survive password resets on the original account. Persistence mechanism.
- **Documentado**: Intentional design (comments in auth-helpers.ts lines 277-278).

---

### [ACCESS-013] student_xp and xp_transactions tables have no RLS

- **Severity**: LOW
- **Archivo**: `supabase/migrations/20260312_001_gamification_core_tables.sql`
- **Descripcion**: The gamification tables `student_xp` and `xp_transactions` are created without `ENABLE ROW LEVEL SECURITY`. Combined with ACCESS-004 (no membership check in gamification endpoints), this means direct PostgREST access is unrestricted.
- **Evidencia**: The migration creates tables and indexes but never calls `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
- **Impacto**: Covered by ACCESS-001 (systemic RLS gap) and ACCESS-004 (no membership check). Listed separately because gamification is a newer feature that should have been built with RLS from the start.
- **Documentado**: Covered by BUG-003 (systemic).

---

### [ACCESS-014] checkContentScope() correctly fail-closed on unknown parents

- **Severity**: INFO (positive finding)
- **Archivo**: `supabase/functions/server/crud-factory.ts:206-244`
- **Descripcion**: `checkContentScope()` has solid fail-closed behavior: unknown parent keys return null from `resolveInstitutionFromParent()` which triggers a 404. The A-10 fix intentionally skips non-content-hierarchy parents (e.g. study_plan_id) because those are user-scoped. The logic is sound and well-documented.
- **Impacto**: None -- this is working correctly.
- **Documentado**: Yes -- extensive comments in crud-factory.ts.

---

### [ACCESS-015] auth-helpers.ts role hierarchy and membership checks are robust

- **Severity**: INFO (positive finding)
- **Archivo**: `supabase/functions/server/auth-helpers.ts`
- **Descripcion**: The authorization framework is well-designed:
  - Fail-closed on all paths (empty inputs, DB errors, unknown roles)
  - Unknown callerRole maps to level 0 (can't assign anything)
  - Unknown targetRole maps to Infinity (can't be assigned)
  - `requireInstitutionRole()` returns AuthDenied descriptor (not a Response), keeping it framework-agnostic and testable
  - Members module (memberships.ts) correctly enforces hierarchy on PUT/DELETE (A-5 fix)
  - Last-owner protection prevents orphaned institutions
  - Admin-scopes correctly require owner role
- **Impacto**: None -- this is working correctly.
- **Documentado**: Yes -- extensive JSDoc in auth-helpers.ts.

---

## Checklist Answers

### 1. Tables with RLS enabled vs disabled

**RLS ENABLED (8 tables):**
- `video_views` (20260224_02)
- `algorithm_config` (20260304_01)
- `ai_reading_config` (20260303_01)
- `rag_query_log` (20260305_04)
- `summary_blocks` (20260228_02)
- `whatsapp_links` (20260314_01)
- `telegram_links` (20260316_01)
- `messaging_admin_settings` (20260316_01)

**RLS NOT ENABLED (all other tables, 30+ including):**
courses, semesters, sections, topics, summaries, keywords, subtopics, keyword_connections, kw_prof_notes, kw_student_notes, text_annotations, video_notes, flashcards, quiz_questions, quizzes, videos, models_3d, model_3d_pins, chunks, study_sessions, reviews, daily_activities, student_stats, study_plans, study_plan_tasks, memberships, institutions, profiles, admin_scopes, student_xp, xp_transactions, ai_content_reports

### 2. Does checkContentScope() cover all CRUD endpoints?

**Yes for crud-factory routes.** All 6 endpoints (LIST, GET, POST, PUT, DELETE, RESTORE) call `checkContentScope()` before DB operations. The coverage is correct for tables in the content hierarchy.

**No for non-factory routes:** subtopics-batch.ts (ACCESS-005), reorder.ts partial (ACCESS-006), gamification routes (ACCESS-004), and messaging-admin.ts (ACCESS-003) have their own authorization patterns with gaps.

### 3. IDOR vulnerabilities?

**Yes -- multiple vectors:**
- Students can access other students' data via direct PostgREST (ACCESS-001, no RLS)
- subtopics-batch leaks cross-institution data (ACCESS-005)
- bulk_reorder can modify cross-tenant order_index (ACCESS-002)
- upsert_video_view accepts arbitrary user_id (ACCESS-009)

**Within the Hono layer:** IDOR is well-prevented. `scopeToUser` in crud-factory correctly filters by user.id on all operations. Student notes (kw_student_notes, text_annotations, video_notes) are properly scoped.

### 4. Can a professor access data from another institution?

**Via Hono:** No. `checkContentScope()` resolves institution and `requireInstitutionRole()` verifies membership. This is correct and fail-closed.

**Via direct PostgREST:** Yes, due to ACCESS-001 (no RLS on content tables).

### 5. Fail-closed on all paths?

**auth-helpers.ts:** Yes -- exemplary fail-closed design (ACCESS-015).

**crud-factory.ts:** Yes for content hierarchy. Non-hierarchy parents (study_plan_id) are intentionally skipped because they're user-scoped.

**SQL functions:** No -- bulk_reorder (ACCESS-002), get_course_summary_ids (ACCESS-008), upsert_video_view (ACCESS-009) are fail-open (no auth check at all).

### 6. Does canAssignRole() prevent privilege escalation?

**Yes.** Unknown callerRole -> level 0, unknown targetRole -> level Infinity. Admin cannot assign owner. The hierarchy is correct. Owner-to-owner assignment is intentional (ACCESS-012).

### 7. Do DELETE operations verify ownership?

**Yes within Hono layer:**
- crud-factory DELETE calls `checkContentScope()` with `isWrite: true`
- memberships DELETE verifies management role + hierarchy (A-5 fix)
- institutions DELETE requires owner role
- admin-scopes DELETE verifies owner of the institution

### 8. Bulk operations affecting other users' data?

**Yes -- two vectors:**
- `bulk_reorder()` RPC (ACCESS-002): no institution check in SQL
- `reorder.ts` only checks first item (ACCESS-006): items 2..N unchecked
- keyword-connections-batch.ts: correctly checks institution (only reads)
- subtopics-batch.ts: no institution check (ACCESS-005, reads only)

### 9. SECURITY DEFINER functions with search_path?

**Only 5 of 17+ have search_path set** (ACCESS-007):
- `on_review_inserted` -- YES
- `on_study_session_completed` -- YES
- `rag_hybrid_search` (v5, 20260311_02) -- YES
- `rag_coarse_to_fine_search` (v3, 20260311_02 and 20260318_01) -- YES
- `get_institution_summary_ids` (v2, 20260311_02) -- YES

All other SECURITY DEFINER functions lack search_path.

### 10. RPCs with REVOKE FROM authenticated/anon?

**Only 3 functions have REVOKE applied:**
- `rag_hybrid_search` (20260311_02 + 20260312_01)
- `rag_coarse_to_fine_search` (20260311_02 + 20260312_01)
- `get_institution_summary_ids` (20260311_02)

**Functions that SHOULD have REVOKE but do NOT:**
- `bulk_reorder` (CRITICAL -- ACCESS-002)
- `upsert_video_view` (MEDIUM -- ACCESS-009)
- `get_course_summary_ids` (MEDIUM -- ACCESS-008)
- `search_scoped`, `trash_scoped` (use auth.uid() internally, lower risk)
- `get_student_knowledge_context` (uses auth.uid() indirectly via student_id param)

---

## Priority Remediation Plan

| Priority | Finding | Effort | Fix |
|----------|---------|--------|-----|
| P0 | ACCESS-001 (RLS on content tables) | HIGH | D3 deploy per DECISIONS.md -- add RLS policies for all content tables |
| P0 | ACCESS-002 (bulk_reorder exposed) | LOW | REVOKE from authenticated/anon, add auth.uid() check, SET search_path |
| P1 | ACCESS-004 (gamification no membership check) | LOW | Add requireInstitutionRole() to all 3 goal endpoints |
| P1 | ACCESS-006 (reorder first-item-only check) | LOW | Verify all items belong to same institution OR resolve each item |
| P1 | ACCESS-005 (subtopics-batch no institution check) | LOW | Add institution resolution from first keyword (same as keyword-connections-batch) |
| P2 | ACCESS-003 (messaging-admin wrong institution) | LOW | Add institution_id param, verify membership with requireInstitutionRole() |
| P2 | ACCESS-007 (search_path missing on 12+ functions) | MEDIUM | Add SET search_path to all SECURITY DEFINER functions |
| P2 | ACCESS-008 (get_course_summary_ids exposed) | LOW | REVOKE from authenticated/anon OR add auth.uid() check |
| P2 | ACCESS-009 (upsert_video_view IDOR) | LOW | Use auth.uid() instead of p_user_id, or REVOKE from authenticated |
| P3 | ACCESS-011 (JWT not verified) | Already planned for D2 per DECISIONS.md |
