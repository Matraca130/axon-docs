# 05 -- Current Status

> **Updated: 2026-03-14 (audit pass 14 — 194 READ + ~320 LISTED).**

## Build Status

| Repo | Status | Notes |
|---|---|---|
| Frontend (Vercel) | Running | v4.5 — responsive, gamification, AI reports, PDF ingest |
| Backend (Supabase EF) | Running | v4.5 — ~200+ endpoints, 10 modules + 6 flat |
| Supabase | Running | 50+ tables, **53 migrations** |

## Still Pending

| Item | Priority |
|---|---|
| **CORS wildcard (BUG-004)** | **HIGH** — Reverted to `"*"` |
| RLS policies (BUG-003) | HIGH — Partially mitigated |
| `resolution_tier` (BUG-001) | HIGH |
| JWT crypto (BUG-002) | MEDIUM — PostgREST mitigates |
| Content tree JS filter (BUG-006) | MEDIUM |
| GamificationContext STUB (BUG-021) | MEDIUM |
| Hardcoded ANON_KEY x3 (BUG-025) | MEDIUM |
| Demo student fallback (BUG-026) | MEDIUM |
| architecture.ts 30KB stale (BUG-028) | MEDIUM |
| kv_store_* cleanup (BUG-011) | LOW |
| Sidebar color mismatch (BUG-029) | LOW |

## Database

53 migrations, pgvector **1536d** (OpenAI text-embedding-3-large), pg_trgm, pg_cron.

## AI/RAG: Phases 1-8D ALL DONE

Models: Gemini 2.5 Flash (text) + OpenAI text-embedding-3-large (1536d)
**14 AI route files on disk, 11 mounted**

## Gamification: Backend 100%, Frontend ~80%

8 React Query hooks, 14 components (10 flat + 3 pages + barrel), `useSessionXP.ts`.
> GamificationContext.tsx is a STUB (BUG-021). useGamification.ts is the real impl.

## WhatsApp: COMPLETE MODULE (**10 files**)

## Frontend DEFINITIVE File Counts (2026-03-14)

### Logic layers (ALL READ end-to-end)

| Layer | Files | Status |
|---|---|---|
| services/ | **53** | 100% |
| hooks/ (flat + queries) | **56** | 100% |
| lib/ | **25** | 100% |
| types/ | **11** | 100% |
| context/ | **9** | 100% |
| utils/ | **10** | 100% |
| routes/ | **10** | 100% |
| design-system/ | **14** | 100% |
| **TOTAL LOGIC** | **188** | **100%** |

### Component layers (~320 files, ALL LISTED)

| Subdir | Files | Notes |
|---|---|---|
| **professor/** | **38** | **REAL CMS: flashcards, quiz, keywords, 3D models, AI reports, video + 7 hooks** |
| student/ (flat + gamification + renderers) | **57** | Quiz, flashcard, keyword, reader, video + 7 hooks |
| content/ (flat + flashcard/) | **48** | Views + flashcard sub-module (16 files) |
| ui/ | **44** | shadcn/radix standard primitives |
| shared/ | **25** | AxonLogo, ErrorBoundary, KPICard, ContentTree, etc. |
| layout/ (flat + topic-sidebar/) | **18** | RoleShell, Sidebar, StudentLayout + 10 topic-sidebar |
| viewer3d/ | **14** | PinSystem, LayerPanel, ModelPartMesh, explode/clip/capture |
| gamification/ (flat + pages/) | **14** | XPPopup, BadgeShowcase, DailyGoal + 3 pages |
| dashboard/ | **11** | Charts, StatsCards, MasteryOverview + 1 hook + types |
| design-kit/ | **9** | dk-primitives, dk-feedback, dk-layouts, etc. |
| auth/ | **6** | Login, PostLoginRouter, RequireAuth, RequireRole, SelectRole |
| schedule/ | **6** | StudyPlanDashboard, DefaultScheduleView, nav links |
| tiptap/ (flat + extensions/) | **5** | TipTap editor + toolbar + 2 extensions |
| roles/ (flat + pages/) | **4+** | Layouts (Admin, Owner, Prof) + PlaceholderPage + page subdirs |
| student-panel/ | **4** | ConnectionBanner, DailyPerformance, PanelSidebar |
| welcome/ | **3** | QuickShortcuts, WelcomePerformanceSidebar |
| ai/ | **2** | AxonAIAssistant (39KB), SmartFlashcardGenerator |
| video/ | **2** | MuxUploadPanel, MuxVideoPlayer |
| summary/ | **2** | ChunkRenderer, SummaryHeader |
| flat files | **2** | DiagnosticsPage, design-kit.tsx |
| **TOTAL COMPONENTS** | **~320** | |

### CORRECTED: Professor is NOT placeholder

Previous docs said "Professor: 8 routes — ALL PlaceholderPage." **THIS IS WRONG.**

Professor has **38 real component files** implementing a full CMS:
- **Flashcard management**: BulkImport (30KB), FormModal (21KB), Preview, TypeSelector, ManagerCard, ImageUpload
- **Quiz management**: QuestionsEditor, QuestionCard, FormModal (14KB), Analytics, ExportImport (14KB), Filters, Stats
- **Keyword management**: Manager, FormDialog, ClickPopover, ConnectionsPanel, ListItem, QuickCreator (15KB)
- **3D Model management**: ModelManager (24KB), ModelPartsManager (26KB), UploadZone
- **AI**: GeneratePanel, ReportRow, ReportStatCard, ReportsDashboard (20KB)
- **Other**: EditorSidebar (17KB), VideosManager (15KB), SubtopicsPanel, BulkEditToolbar, etc.
- **7 colocated hooks**: useAiGenerate, useQuestionCrud, useQuestionForm, useQuizAnalytics, useQuizBulkOps, useQuizFilters, useQuizQuestionsLoader

**Corrected route summary:**
- **Student:** 22+ real routes — fully functional
- **Professor:** 8 routes — **REAL components** (CMS for content)
- **Owner:** 8 routes — PlaceholderPage
- **Admin:** 6 routes — PlaceholderPage

### Mega-files (F-020)

| File | Size |
|---|---|
| FlashcardsManager.tsx | **61KB** |
| StudyOrganizerWizard.tsx | **51KB** |
| AxonAIAssistant.tsx | **39KB** |
| ModelViewer3D.tsx | **38KB** |
| QuizSelection.tsx | **35KB** |
| FlashcardBulkImport.tsx | **30KB** |
| TipTapEditor.tsx | **29KB** |
| EditableKeyword.tsx | **27KB** |
| QuizSessionView.tsx | **27KB** |
| StudyDashboardsView.tsx | **27KB** |
| ModelPartsManager.tsx | **26KB** |

11 files > 25KB. Top priority for splitting.

### Colocated Hooks (not in hooks/ layer)

- **student/**: 7 (useQuizSession, useQuizNavigation, useQuizBackup, useQuizBkt, useQuizGamificationFeedback, useAdaptiveQuiz, useBktStates)
- **professor/**: 7 (useAiGenerate, useQuestionCrud, useQuestionForm, useQuizAnalytics, useQuizBulkOps, useQuizFilters, useQuizQuestionsLoader)
- **dashboard/**: 1 (useMasteryOverviewData)
- **Total**: 15 hooks colocated in components (vs 56 in hooks/)

## FRONTEND-DIAGNOSTIC F-xxx (updated)

| ID | Status |
|---|---|
| F-001 | **FIXED** |
| F-002 | PARTIALLY FIXED (BUG-022) |
| F-003 | **NOT FIXED** (BUG-025) |
| F-004 | PARTIALLY FIXED |
| F-005 | PARTIALLY FIXED (BUG-028: architecture.ts 30KB still in bundle) |
| F-006 | **FIXED** |
| F-007 | PARTIALLY FIXED |
| F-008 | **FIXED** |
| F-009 | **FIXED** |
| F-010 | **FIXED** |
| F-014 | **FIXED** |
| F-015 | PARTIALLY FIXED (BUG-024) |
| F-020 | **WORSE** — 11 files >25KB (was 1) |
