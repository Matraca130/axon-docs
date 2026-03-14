# 05 -- Current Status

> What works, what's broken, and what's next. **Updated: 2026-03-14.**

## Build Status

| Repo | Status | Notes |
|---|---|---|
| Frontend (Vercel) | Running | v4.5 — responsive layouts, gamification UI, lazyRetry |
| Backend (Supabase EF) | Running | v4.5 — ~200+ endpoints, gamification, AI/RAG Fase 8 |
| Supabase | Running | 50+ tables, 41+ migrations, RLS deferred (backend enforces scoping) |

## Backend Audit History

Six successive audit rounds performed (Feb-Mar 2026):

| Audit | Findings | Completed | Deferred |
|---|---|---|---|
| #1 (M-1..M-5) | 5 | 5/5 | 0 |
| #2 (N-1..N-10) | 10 | 10/10 | 0 (N-5, N-10 completed later) |
| #3 (O-1..O-8) | 8 | 8/8 | 0 (O-3, O-7, O-8 completed later) |
| #4 Self-audit (P-1..P-8) | 8 | 8/8 | 0 |
| RAG audits (LA, PF, D, T) | 20+ | 20+ | 0 |
| Gamification (G, A, B, D, S3) | 25+ | 25+ | 0 |

**Total: 75+ findings across 6 audit rounds. All resolved.**

## Previously Deferred Items — NOW DONE

| Item | Status | When |
|---|---|---|
| CORS whitelist | **FIXED** | 2026-03-06 |
| Stripe timing-safe (N-10) | **FIXED** | 2026-03-06 |
| Rate limiting (O-8) | **FIXED** | 120 req/min + 20 AI POST/hr |
| Webhook idempotency (O-7) | **FIXED** | Event tracking for Stripe + Mux |
| Reviews scope (O-3) | **FIXED** | Session ownership verification |
| Content-tree DB func (N-5) | **FIXED** | RPC with graceful fallback |
| Trigram indexes (O-4) | **APPLIED** | Migration 20260227_05 |
| Billing integration | **DONE** | Stripe checkout, portal, webhooks |

## Still Pending

| Item | Phase | Priority |
|---|---|---|
| RLS policies (BUG-003) | Security hardening | HIGH (pre-production) |
| JWT crypto verification (BUG-002) | Security hardening | LOW (PostgREST mitigates 95%) |
| `resolution_tier` vs `max_resolution` (BUG-001) | Bug fix | HIGH |
| Content tree JS filtering (BUG-006) | Performance | MEDIUM |
| Search consolidation (BUG-007) | Performance | MEDIUM |
| kv_store_* cleanup (BUG-011) | Housekeeping | LOW |

## Database

- 50+ legitimate tables (+ ~25 kv_store_* junk)
- 41+ SQL migrations applied
- 20+ DB functions/RPCs (bulk_reorder, get_study_queue, rag_hybrid_search, search_keywords_by_institution, etc.)
- pgvector extension (768-dim embeddings)
- pg_trgm extension (trigram search)
- pg_cron job (refresh mv_knowledge_profile every 15 min)
- RLS: Applied on `rag_query_log` only. Rest deferred.

## AI/RAG Pipeline Status

| Phase | Name | Status |
|---|---|---|
| 1 | Denorm institution_id on summaries | **DONE** |
| 2 | Stored tsvector + GIN + RPC v3 | **DONE** |
| 3 | pgvector + HNSW + coarse-to-fine search | **DONE** |
| 4 | Query logging + feedback + analytics | **DONE** |
| 5 | Auto-chunking + summary hook + re-chunk | **DONE** |
| 6 | Multi-Query + HyDE + Re-ranking (Gemini-as-Judge) | **DONE** |
| 7 | Multi-source ingestion (PDF) | Planned |
| 8A | Adaptive generation (NeedScore) | **DONE** |
| 8B | AI content quality reports | **DONE** |
| 8C | Quality dashboard (stats + listing) | **DONE** |
| 8D | Bulk pre-generation | **DONE** |

## Gamification Status (NEW — 2026-03-13)

| Component | Status | Details |
|---|---|---|
| XP Engine | **DONE** | Multipliers, daily cap 500, fire-and-forget hooks |
| XP Hooks | **DONE** | 11/11 actions wired (reviews, sessions, videos, RAG, plans) |
| Badges | **DONE** | 39 badges (19 criteria + 20 COUNT-based), 2-phase evaluation |
| Streaks | **DONE** | Daily check-in, freeze (max 3), repair |
| Goals | **DONE** | Configurable 5-120 min, completion tracking |
| Leaderboard | **DONE** | Weekly, institution-scoped |
| Frontend | In progress | DailyGoalWidget, GamificationCard connected. Full UI pending |
| Audit fixes | **ALL DONE** | G-001..G-015, A-001..A-014, B-001..B-004, D-1..D-6, S3-001..S3-004 |

## Frontend Status (2026-03-14)

| Feature | Status |
|---|---|
| Layout v2 (responsive) | **DONE** — All roles on RoleShell v2 + MobileDrawer |
| Auth consolidation | **DONE** — Single canonical AuthContext |
| Code splitting | **DONE** — 22 lazy routes + vendor chunks |
| lazyRetry | **DONE** — Stale chunk error recovery post-deploy |
| Summary reader | **DONE** — Popover migration to @floating-ui/react |
| Cross-summary navigation | **DONE** — 3 cases (same summary, same topic, cross-topic) |
| Keyword suggestions | **DONE** — Proactive from sibling summaries |
| Dead code cleanup | **DONE** — Old layouts, auth bridge, RoleShell v1 deleted |
