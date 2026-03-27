---
name: Agent Lessons — Oleada A (Flashcard Bug Fixes)
description: Lessons learned by agents FC-01, FC-05, FC-06, IF-05 during flashcard generation bug fix session (2026-03-27)
type: feedback
---

## FC-01 (flashcards-frontend)
**Error:** Only fixed `.id` on string in FlashcardFormModal.tsx but missed the same bug pattern in `CaptureViewDialog.tsx` and `useQuestionForm.ts`.
**Why:** Did not grep for ALL callers of `ensureGeneralKeyword` before fixing — only checked the assigned file.
**How to apply:** When fixing a bug on a function's return type, ALWAYS grep all callers across the codebase (`grep -r "ensureGeneralKeyword"`) and fix every call site, not just the one in your assigned file. The quality gate (XX-02) caught this — if FC-01 had done the grep, it would have been a cleaner first pass.

## FC-05 (flashcards-keywords)
**Error:** Changed `KeywordCollection` from `Record<string, KeywordData>` to `Record<string, KeywordState>` but did NOT update `getKeywordsNeedingCards()` return type, creating a latent type mismatch for `SmartFlashcardGenerator.tsx`.
**Why:** Focused on the type unification task without checking downstream consumers of functions that use the changed types.
**How to apply:** When changing a type that is used in function signatures (params or return types), grep for all functions using that type and verify their signatures still align with their consumers. Check both the function definition AND its call sites.

## FC-06 (flashcards-generation)
**Success:** Correctly identified that `MAX_CONCURRENT_GENERATIONS` and `SmartMetadata` were used internally — removed `export` keyword instead of deleting entirely. `RECOMMENDED_MAX_BATCH` was unused anywhere — deleted completely.
**How to apply:** When removing dead exports, always distinguish between "unused externally" (remove export) and "unused entirely" (delete). Grep for internal usage within the same file before deleting.

## IF-05 (infra-plumbing)
**Success:** Used the existing `extractItems()` helper from `api-helpers.ts` rather than writing inline normalization. Followed established codebase patterns.
**How to apply:** Before writing new utility code, always check if a helper already exists (grep for common patterns like `extractItems`, `normalizeResponse`, etc.). Reuse > reinvent.

## XX-02 (quality-gate)
**Success:** Caught 2 additional `.id` bugs that FC-01 missed (CaptureViewDialog, useQuestionForm). Validated the quality gate's value.
**Lesson:** The quality gate pass is essential — agents working on isolated files miss cross-cutting bugs. Always run XX-02 after any multi-agent session.

## General Lesson
**Cross-file impact analysis is mandatory.** When an agent changes a type, function signature, or return value, they must trace ALL consumers — not just within their assigned files. The agent's "file scope" is for WRITE access; READ access should be unrestricted for impact analysis.
