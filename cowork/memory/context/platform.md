# Axon Medical Academy — Platform Context

## Qué es
LMS de educación médica con 4 roles: Owner, Admin, Professor, Student.
Target: estudiantes de medicina en UNLP (Argentina).

## Stack
| Capa | Tech | Deploy |
|------|------|--------|
| Frontend | React 18 + Vite 6 + Tailwind v4 + TS | Vercel |
| Backend | Hono + Deno (Supabase Edge Functions) | GitHub Actions → Supabase |
| DB | PostgreSQL + pgvector (1536d embeddings) | Supabase |
| AI/RAG | Gemini 2.5 Flash + OpenAI text-embedding-3-large | — |
| Adaptive | FSRS v4 (spaced rep) + BKT v4 (knowledge tracing) | — |
| Gamification | XP + streaks + badges + leaderboard | — |
| Messaging | Telegram bot + WhatsApp Cloud API | — |
| Video | Mux (upload, signed playback, view tracking) | — |
| Billing | Stripe (checkout, portal, webhooks) | — |

## Repos (GitHub org: Matraca130)
- `numero1_sseki_2325_55` → Frontend (C:\dev\axon\frontend)
- `axon-backend` → Backend (C:\dev\axon\backend)
- `axon-docs` → Docs (C:\dev\axon\docs)

## Reglas críticas
- Repos en `C:\dev\axon\` (NUNCA en OneDrive — corrompe .git/)
- Nunca push a main — siempre feature branch + PR
- Worktrees para trabajo paralelo
