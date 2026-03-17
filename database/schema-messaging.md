# Schema: Messaging Tables (Telegram + WhatsApp)

> **Created:** 2026-03-17 (audit pass 17)
> **Migrations:** `20260314_01_whatsapp_tables.sql`, `20260315_01_whatsapp_job_processor_cron.sql`, `20260316_01_telegram_tables.sql`

## messaging_admin_settings (shared)

Per-institution configuration for messaging channels.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| institution_id | UUID | NO | FK -> institutions.id |
| channel | TEXT | NO | CHECK: `whatsapp`, `telegram` |
| enabled | BOOLEAN | NO | Default false |
| config | JSONB | NO | Channel-specific tokens |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

UNIQUE: `(institution_id, channel)`
RLS: admin/owner only via memberships check (select + write policies)

## Telegram

### telegram_links

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| user_id | UUID | NO | FK -> profiles.id, UNIQUE |
| chat_id | BIGINT | NO | Telegram chat identifier |
| username | TEXT | YES | Telegram username |
| linked_at | TIMESTAMPTZ | NO | |
| created_at | TIMESTAMPTZ | NO | |

UNIQUE: `(user_id)`, INDEX: `idx_telegram_links_chat_id`
RLS: Users manage their own link (auth.uid() = user_id)

### telegram_sessions

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| chat_id | BIGINT | NO | |
| user_id | UUID | YES | NULL until linked |
| mode | TEXT | NO | `conversation`, `flashcard_review`, `linking` |
| context | JSONB | YES | Session state data |
| expires_at | TIMESTAMPTZ | YES | Cleanup via pg_cron |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

INDEX: `idx_telegram_sessions_user_id` (WHERE user_id IS NOT NULL)
NO RLS (admin-only table)

### telegram_message_log

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| chat_id | BIGINT | NO | |
| tg_message_id | BIGINT | YES | For dedup |
| direction | TEXT | NO | `inbound`, `outbound` |
| message_type | TEXT | NO | `text`, `voice`, `callback`, `command` |
| content | TEXT | YES | |
| created_at | TIMESTAMPTZ | NO | |

INDEXES: `idx_tg_log_created` (DESC), `idx_tg_log_chat` (chat_id, created_at DESC), `idx_tg_log_msg_id` (partial)
Cleanup: pg_cron 30-day retention

## WhatsApp

### whatsapp_links

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| user_id | UUID | NO | FK -> profiles.id |
| phone_hash | TEXT | NO | SHA-256 + salt (PII protected) |
| linked_at | TIMESTAMPTZ | NO | |
| created_at | TIMESTAMPTZ | NO | |

INDEX: `idx_whatsapp_links_phone_hash`
RLS: Users see/update their own links

### whatsapp_sessions

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| phone_hash | TEXT | NO | |
| user_id | UUID | YES | |
| mode | TEXT | NO | |
| context | JSONB | YES | |
| version | INTEGER | NO | Optimistic locking |
| expires_at | TIMESTAMPTZ | YES | 30min TTL, cleanup via pg_cron |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

### whatsapp_message_log

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| phone_hash | TEXT | NO | |
| wa_message_id | TEXT | YES | For dedup |
| direction | TEXT | NO | `inbound`, `outbound` |
| message_type | TEXT | NO | `text`, `voice` |
| content | TEXT | YES | |
| created_at | TIMESTAMPTZ | NO | |

INDEXES: `idx_wa_log_created`, `idx_wa_log_phone`, `idx_wa_log_msg_id` (partial)
Cleanup: pg_cron 30-day retention

### whatsapp_jobs

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| type | TEXT | NO | `generate_content`, `generate_weekly_report` |
| payload | JSONB | NO | |
| status | TEXT | NO | `pending`, `processing`, `completed`, `failed` |
| attempts | INTEGER | NO | Default 0 |
| error | TEXT | YES | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

INDEX: `idx_wa_jobs_pending` (partial, WHERE status='pending')
Shared by Telegram + WhatsApp for async tasks.
Cron: `wa-job-processor` every minute (pg_cron + pg_net), `wa-job-retention` daily 04:00 UTC (7-day cleanup).

## Cron Jobs (pg_cron)

| Job | Schedule | Purpose |
|---|---|---|
| `wa-job-processor` | Every minute | Process up to 5 pending jobs via pg_net HTTP POST |
| `wa-job-retention` | Daily 04:00 UTC | Remove completed/failed jobs older than 7 days |
| `tg-session-cleanup` | Hourly | Remove expired telegram_sessions |
| `wa-session-cleanup` | Hourly | Remove expired whatsapp_sessions (30min TTL) |
| `tg-log-retention` | Daily | Remove telegram_message_log older than 30 days |
| `wa-log-retention` | Daily | Remove whatsapp_message_log older than 30 days |
