# Project Current State
Updated: 2026-03-27

## Agent System Status
- **40/76 agentes** completaron recon (Batch 1: 20, Batch 2: 20)
- **36 pendientes**: Batch 3 (AI/3D/Infra/Messaging/Billing=20) + Batch 4 (Cross-cutting/legacy=16)
- **7 PRs mergeados** a main (4 previos + 3 esta sesión)
- Agent lessons guardadas en `feedback_agent_lessons_oleada_a.md`

## Completado esta sesión (2026-03-27)

### Flashcard Pipeline — PLAN COMPLETO ✅
- **PR #204** (frontend): 5 bug fixes generación flashcards (BH-ERR-019/021/024/032/033)
  - ensureGeneralKeyword paginated response, .id on string (3 callers), MasteryLevel/KeywordCollection type unification, dead exports
- **PR #174** (backend): Image pipeline — Gemini 2.0 Flash + Supabase Storage
  - gemini-image.ts, flashcard-image-generator.ts, POST /flashcards/:id/generate-image
  - SQL migration: flashcards image columns + image_style_packs + image_prompt_templates + image_generation_log + RLS + Storage bucket
- **PR #207** (frontend): FlashcardImage component + useFlashcardImage hook
  - FlashcardImage.tsx (<picture> AVIF/WebP on-demand), FlashcardCard.tsx integration, SmartFlashcardGenerator toggle

### Infra — Worktree isolation
- Git `post-checkout` hooks en frontend + backend (WARNING si checkout non-main en repo principal)
- Script `C:\dev\axon\worktree.sh` para crear worktrees aislados por sesión
- `agent-workflow.md` actualizado con regla CRÍTICA de worktrees

## Hallazgos críticos pendientes de fix
### Seguridad (URGENTE)
- RLS: platform_plans + ai_reading_config permisivos (AS-03 F-01, F-02)
- WhatsApp webhook hardcoded fallback salt (AS-04)
- No 401 interceptor en frontend (AS-04)

### Funcionales
- 5 endpoints fantasma en pa-admin.ts (AO-02)
- LEVEL_NAMES divergentes xp-constants vs types/gamification (DG-03/DG-04)
- ~~getKeywordsNeedingCards stub (FC-06) — SmartFlashcardGenerator roto~~ → FIXED (PR #204)
- ~~KeywordCollection type collision (FC-06)~~ → FIXED (PR #204)
- Registry paths incorrectos: AO-02, AO-04, AI-01, AI-02

## Config activa
- settings.local.json: `defaultMode: "bypassPermissions"` + `additionalDirectories` para ambos repos
- agent-workflow.md: Agent Teams obligatorio, opus siempre, bypassPermissions siempre, worktrees obligatorios
- Git hooks: post-checkout en ambos repos (warn non-main checkout)

## PRs mergeados (acumulado)
- fix/batch1-architect-fixes (registry + dead code + memories)
- fix/watchtime-tracking (MuxVideoPlayer real watch time)
- fix/studyhub-dead-code (orphan removal + deprecated)
- fix/batch2-memories (AS-03/AS-04 audit results)
- **fix/flashcard-generation-bugs (#204)** — 5 bug fixes generación
- **feat/flashcard-image-pipeline (backend #174)** — Gemini image service + DB
- **feat/flashcard-image-pipeline (frontend #207)** — FlashcardImage component + hook
- **feat/block-based-summaries (#208)** — 6 waves resúmenes + 12 code review fixes

## Pendiente para probar
- `GEMINI_API_KEY` ya configurada en Supabase secrets → test end-to-end: profesor genera flashcard con imagen

## Resúmenes Block-Based — EN MAIN (producción)
- **PR:** #208 mergeado a main (2026-03-27, commit dabcc9f)
- **Contenido:** 6 waves + 12 bug fixes del code review (35 archivos, +4630 líneas)
- **Sesión 1:** COMPLETADA — merge + code review + fixes
- **Próximo paso:** Smoke test en producción (items 1.13-1.23 del plan)
- **Sesión 2:** Verificar + fix gaps (hooks huérfanos, tokens, shortcuts) — pendiente
- **Sesión 3:** Polish opcional (accessibility, tests, DrawingCanvas) — pendiente

## Next session
1. **Smoke test resúmenes en producción** (Vercel deploy de PR #208)
2. **Sesión 2 resúmenes:** verificar + fix gaps post-merge
3. Fixes seguridad (RLS + webhook + 401 interceptor)
4. Completar recon Batch 3+4 (36 agentes)
