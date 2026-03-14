# Audit Read Tracker

> **Updated:** 2026-03-14 (pass 14 — DEFINITIVE)
> **Total files READ end-to-end:** ~194 (188 logic + 14 design-system, some overlap)
> **Total files LISTED (dir scan):** ~320 (components/) — ALL subdirs including nested
> **Grand total frontend files mapped:** ~508

## Logic Layers (ALL READ)

| Layer | Files | % |
|---|---|---|
| services/ | 53 | 100% |
| context/ | 9 | 100% |
| types/ | 11 | 100% |
| hooks/ (flat) | 35 | 100% |
| hooks/queries/ | 21 | 100% |
| lib/ | 25 | 100% |
| utils/ | 10 | 100% |
| routes/ | 10 | 100% |
| design-system/ | 14 | 100% |
| **TOTAL** | **188** | **100%** |

## Component Layer (ALL LISTED, not deep-read)

| Subdir | Files |
|---|---|
| professor/ | 38 |
| student/ (+ gamification + renderers) | 57 |
| content/ (+ flashcard/) | 48 |
| ui/ | 44 |
| shared/ | 25 |
| layout/ (+ topic-sidebar/) | 18 |
| viewer3d/ | 14 |
| gamification/ (+ pages/) | 14 |
| dashboard/ | 11 |
| design-kit/ | 9 |
| auth/ | 6 |
| schedule/ | 6 |
| tiptap/ (+ extensions/) | 5 |
| roles/ (+ pages/) | 4+ |
| student-panel/ | 4 |
| welcome/ | 3 |
| ai/ | 2 |
| video/ | 2 |
| summary/ | 2 |
| flat | 2 |
| **TOTAL** | **~320** |

## Backend (NOT read this session)

Structure: `supabase/`, `tests/`, `docs/`. Need to read `supabase/functions/` for route verification.

## Bugs Found

- BUG-020..027 (pass 12): logic layer bugs
- BUG-028..029 (pass 13): design-system staleness + color mismatch
- Pass 14: CRITICAL doc correction — professor is NOT "ALL PlaceholderPage" (38 real components)

Canonical lists: `bugs/known-bugs.md`, `context/05-current-status.md`
