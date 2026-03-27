# Axon Roadmap

> Updated: 2026-03-27

## Sprint 0 — Approved NOW (3 Items Only)

### 1. Badges de Esfuerzo ✓

Status: Approved, easy/quick
Backend gamification infrastructure already exists.

### 2. Calibración Adaptativa de Dificultad

Status: Approved — KEY PRIORITY
FSRS v4 + BKT v4 infrastructure exists. Need to wire difficulty calibration into flashcard/quiz generation.

### 3. Calendario Inteligente + Objetivos (Consolidated 1.7 + 3.1)

Status: Approved — consolidated into single feature
Calendar shows topics, click opens detailed interactive panel with keywords + mastery.
Learning Path Optimizer suggests topic order within the plan the student created.

## Approved Conceptually (Not for Now)

- 2.5 Chat con Personalidad — later
- 1.1 Ritmo Circadiano — later
- 1.4 Micro-Sesiones — no utility seen yet
- 14.1 Agent de Repaso Proactivo — coming soon
- **Tier 4:** 2.3 Escenarios, 2.1 Mnemónicos, 2.2 Multi-Nivel, 1.6 Skill Tree — future

## Rejected

- 1.3 Formato Favorito — NO
- 12.3 Flashcard del Día — not yet
- 10.4 Check-in Emocional — too abstract
- 6.2 Mapa Confianza — NO
- 4.5 Feedback Loop — not yet

## In-Flight Features

### Block-Based Summaries
- PR #208 merged, in production
- Needs: smoke test + Session 2 polish

### Flashcard Image Pipeline
- PRs #174 + #207 merged
- Needs: e2e test with GEMINI_API_KEY

### Student Flashcard Creation
- Design spec complete
- Implementation pending

## Infrastructure Backlog

### Security (Priority 1)
- RLS tightening (platform_plans, ai_reading_config)
- WhatsApp webhook hardening
- 401 interceptor in frontend
- SECURITY DEFINER functions (SET search_path)
- Race condition fixes (xp-hooks, streak-engine)

### Type System
- Deduplicate MasteryLevel (3 definitions)
- Deduplicate XPTransaction/StreakStatus/Summary
- Remove `: any` (238 instances across 82 files)
- Unify LEVEL_NAMES (xp-constants vs types/gamification)

### Design System
- Remove glassmorphism (14 instances)
- Fix heading fonts (Space Grotesk → Georgia, 12 instances)
- Centralize hex colors (1031 hardcoded across 175 files)
- Remove hardcoded gradients on interactive elements

### Tech Debt
- 5 ghost endpoints (pa-admin.ts)
- 28 files exceed 500-line limit
- 4 deprecated files
- Remove deprecated code

## Agent System

Recon status: 40/76 complete. Batch 3+4 (36 agents) pending.
