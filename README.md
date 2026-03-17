# Axon v4.5 — Platform Documentation

Central documentation for the Axon educational platform.
Designed to be copy-pasted into Figma Make sessions as context.

> **File size rule:** Every file stays under 10KB (~300 lines) so Figma Make can read it fully.

## Quick Start (Figma Make)

1. Open the file(s) relevant to your task
2. Copy the raw markdown
3. Paste into Figma Make as context

## Repos

| Repo | Purpose | Deploy | Status |
|---|---|---|---|
| `Matraca130/numero1_sseki_2325_55` | Frontend (React 18/Vite/TW4) — **586 files** | Vercel | v4.5 |
| `Matraca130/axon-backend` | Backend (Hono/Deno) — **122 TS files** | Supabase Edge Functions | v4.5 |
| `Matraca130/axon-docs` | Documentation (this repo) | None | Updated 2026-03-17 |

## Supabase

- Project ID: `xdnciktarvxyhkrokbng`
- ~50+ tables (+ ~25 `kv_store_*` junk)
- **62 SQL migrations**
- Embeddings: **1536d** (OpenAI **text-embedding-3-large**, Matryoshka truncation)

## What Changed (2026-03-14–17)

### Backend
- **AI migrated from Gemini to Claude** (Anthropic) — claude-ai.ts (9KB): opus-4, sonnet-4, haiku-4.5
- **Voice calls**: `POST /ai/realtime-session` (335 lines) — ephemeral OpenAI Realtime token + student context + tool executors
- **Telegram bot**: 9 files, 2,816 lines — Claude agentic loop (5 iter), 11 tools, slash commands, inline flashcard review
- **WhatsApp enhanced**: async-queue.ts (408 lines), pg_cron job processor every minute
- **Messaging admin**: `messaging-admin.ts` — GET/PUT/POST per channel (Telegram + WhatsApp)
- **Gamification fixes**: xp_transactions.source_id→TEXT, badge criteria column
- **DB**: 62 migrations total. New tables: telegram_links, telegram_sessions, telegram_message_log, messaging_admin_settings, whatsapp_links, whatsapp_sessions, whatsapp_message_log, whatsapp_jobs
- **11 split route dirs** + 6 flat files = **122 TypeScript files**
- CORS: **FIXED** — restricted to whitelist of allowed origins

### Frontend
- **Voice call mode**: AxonAIAssistant (40KB, 901 lines) + VoiceCallPanel + useRealtimeVoice.ts (OpenAI Realtime WebSocket)
- **Admin Messaging Integrations**: AdminMessagingSettingsPage (20KB, 521 lines) — Telegram & WhatsApp config
- **StudyHub merge**: hero + study paths + progress tracking + A4 layout + StudyHubSectionCards (26KB)
- **Flashcard v4.5.1**: responsive, Spanish locale, keyboard nav, adaptive AI
- **Voice bug fix**: interval+timeout memory leak in WebSocket connect wait
- **Vitest test infrastructure**: setup, contract tests, GitHub CI workflow
- **586 total files** (346 components + 42 hooks + 35 services + 9 contexts)

## What Changed (2026-03-10–13)

### Backend
- **Gamification system** complete: XP engine, 8 hooks (11 actions), 39 badges, streaks, goals
- **Embedding migration**: Gemini 768d → OpenAI text-embedding-3-large 1536d
- **WhatsApp integration**: Tables + cron + route module
- **PDF extraction**: `extractTextFromPdf()` in gemini.ts (Fase 7)
- **RAG security hardening**: Revoked RPC access from authenticated role
- **Settings module**: New `routes/settings/` directory
- **Batch endpoints**: keyword-connections-batch, flashcards-by-topic, review-batch, topic-progress

### Frontend
- **Layout v2**: All roles on responsive RoleShell + MobileDrawer
- **Auth consolidation**: Single `createContext()`, dual-context bug resolved
- **lazyRetry**: Stale chunk error recovery for 22 lazy routes
- **Gamification UI**: 8 React Query hooks + 7 components connected
- **Axon Medical Academy palette**: teal/gray theme migration
- Dead code cleanup: old layouts, auth bridge deleted
