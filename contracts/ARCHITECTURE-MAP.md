# Architecture Map — Axon v4.4

> Complete file-to-agent ownership map based on the REAL project structure.

## Key Pattern

**Directories = by ROLE** (student/, professor/, content/)  
**Ownership = by FEATURE** (quiz, summary, flashcard, dashboard, admin, 3d)

This means files from DIFFERENT agents live in the SAME directory.

## Mixed-Ownership Directories (Critical)

### components/student/ — Agent 2 + Agent 3
```
Agent 2 (Summary):     SummaryViewer, ViewerBlock, TextHighlighter,
                       HighlightToolbar, AnnotationTimeline, ImageLightbox,
                       SmartPopup, VideoPlayer, VideoNoteForm
Agent 3 (Flashcard):   KeywordPopup, KeywordBadges, KeywordHighlighterInline,
                       InlineKeywordPopover, ConnectionsMap
```

### components/professor/ — Agent 2 + Agent 3
```
Agent 2 (Summary):     EditorSidebar, VideosManager
Agent 3 (Flashcard):   KeywordsManager, KeywordConnectionsPanel, SubtopicsPanel,
                       ProfessorNotesPanel, QuickKeywordCreator, KeywordClickPopover
```

### components/content/ — Agent 2 + Agent 5
```
Agent 2 (Summary):     StudentSummariesView, StudentSummaryReader, SummaryView, StudentPlaceholder
Agent 5 (Dashboard):   DashboardView, StudyHubView, StudyView
Dead code:             WelcomeView, LessonGridView, SummarySessionNew
```

### components/shared/ — Agent 1 + 2 + 3 + 5
```
Agent 1 (Quiz):        AIQuestionItem
Agent 2 (Summary):     TextAnnotationsPanel
Agent 3 (Flashcard):   MasteryIndicator, EditableKeyword
Agent 5 (Dashboard):   CourseCard, KPICard, ActivityItem
Shared infra:          ContentTree, ConfirmDialog, PageHeader, SearchFilterBar, etc.
```

### hooks/ — Agent 2 + 3 + 5
```
Agent 2 (Summary):     useSummaryPersistence, useSummaryTimer, useSummaryViewer,
                       useTextAnnotations, useContentTree (stub→real)
Agent 3 (Flashcard):   useKeywordMastery, useSmartPopupPosition, useSmartPosition
Agent 5 (Dashboard):   useStudentNav, useStudySession (stub→real)
```

## Full Ownership Table

| File | Owner | Status | Notes |
|---|---|---|---|
| **PROTECTED** | | | |
| App.tsx | 🔒 | exists | entrypoint |
| routes.tsx | 🔒 | exists | createBrowserRouter |
| context/*.tsx | 🔒 | exists | All 5 contexts protected |
| contexts/AuthContext.tsx | 🔒 | exists | Real auth logic |
| components/auth/*.tsx | 🔒 | exists | 6 auth files |
| components/roles/*.tsx | 🔒 | exists | 6 role shells |
| components/ui/*.tsx | ∞ | exists | 47 shadcn files |
| design-system/*.ts | ∞ | exists | 13 token files |
| components/design-kit.tsx | ∞ | exists | Layout components |
| **DEAD CODE (Phase 0 deletes)** | | | |
| lib/supabase-client.ts | 🗑️ | delete | 0 importers |
| lib/config.ts | 🗑️ | delete | wrong URL |
| types/legacy-stubs.ts | 🗑️ | delete | 9 files depend on empty stubs |
| services/apiConfig.ts | 🗑️ | delete | legacy realRequest |
| content/WelcomeView.tsx | 🗑️ | delete | uses stubs |
| content/LessonGridView.tsx | 🗑️ | delete | uses stubs |
| content/SummarySessionNew.tsx | 🗑️ | delete | uses stubs |
| shared/PageStates.tsx | 🗑️ | delete | 0 users |
| **PHASE 0 (create then FREEZE)** | | | |
| services/api-client.ts | P0 | create | universal HTTP wrapper |
| types/base.ts | P0 | create | UUID, Timestamps |
| types/index.ts | P0 | create | barrel re-exports |
| hooks/useContentTree.ts | P0→A2 | create stub | Agent 2 implements |
| hooks/useStudySession.ts | P0→A5 | create stub | Agent 5 implements |
| **AGENT 1: Quiz** | | | |
| services/quizApi.ts | A1 | create | |
| types/quiz.ts | A1 | create | |
| routes/student-quiz-routes.ts | A1 | create | |
| routes/professor-quiz-routes.ts | A1 | create | |
| shared/AIQuestionItem.tsx | A1 | refactor | fix legacy-stubs |
| **AGENT 2: Summary/Content** | | | |
| services/contentTreeApi.ts | A2 | refactor | |
| services/summariesApi.ts | A2 | refactor | |
| services/studentSummariesApi.ts | A2 | refactor | |
| lib/muxApi.ts | A2 | refactor | |
| types/content.ts | A2 | create | |
| types/video.ts | A2 | create | |
| hooks/useSummary*.ts (4 files) | A2 | exists | |
| hooks/useTextAnnotations.ts | A2 | exists | |
| content/StudentSummaries*.tsx | A2 | exists | |
| content/SummaryView.tsx | A2 | exists | |
| student/SummaryViewer.tsx | A2 | exists | |
| student/ViewerBlock.tsx | A2 | exists | |
| student/TextHighlighter.tsx | A2 | exists | |
| student/HighlightToolbar.tsx | A2 | exists | |
| student/AnnotationTimeline.tsx | A2 | exists | |
| student/ImageLightbox.tsx | A2 | exists | |
| student/SmartPopup.tsx | A2 | exists | |
| student/VideoPlayer.tsx | A2 | exists | |
| student/VideoNoteForm.tsx | A2 | exists | |
| professor/EditorSidebar.tsx | A2 | exists | |
| professor/VideosManager.tsx | A2 | exists | |
| summary/ChunkRenderer.tsx | A2 | exists | |
| summary/SummaryHeader.tsx | A2 | exists | |
| tiptap/*.tsx (4 files) | A2 | exists | |
| video/MuxVideoPlayer.tsx | A2 | exists | |
| roles/pages/professor/*.tsx (4) | A2 | exists | |
| layout/TopicSidebar.tsx | A2 | exists | |
| **AGENT 3: Flashcards/Keywords** | | | |
| services/flashcardApi.ts | A3 | create | |
| services/keywordsApi.ts | A3 | create | |
| types/flashcard.ts | A3 | create | |
| lib/mastery-helpers.ts | A3 | refactor | |
| hooks/useKeywordMastery.ts | A3 | refactor | |
| hooks/useSmartPopupPosition.ts | A3 | exists | |
| hooks/useSmartPosition.ts | A3 | exists | |
| student/KeywordPopup.tsx | A3 | split | 1000+ lines |
| student/KeywordBadges.tsx | A3 | exists | |
| student/KeywordHighlighterInline.tsx | A3 | exists | |
| student/InlineKeywordPopover.tsx | A3 | exists | |
| student/ConnectionsMap.tsx | A3 | exists | |
| professor/KeywordsManager.tsx | A3 | exists | |
| professor/KeywordConnectionsPanel.tsx | A3 | exists | |
| professor/SubtopicsPanel.tsx | A3 | exists | |
| professor/ProfessorNotesPanel.tsx | A3 | exists | |
| professor/QuickKeywordCreator.tsx | A3 | exists | |
| professor/KeywordClickPopover.tsx | A3 | exists | |
| shared/MasteryIndicator.tsx | A3 | exists | |
| shared/EditableKeyword.tsx | A3 | refactor | |
| **AGENT 4: Admin/Owner** | | | |
| services/platformApi.ts | A4 | refactor | |
| services/institutionsApi.ts | A4 | create | |
| types/institution.ts | A4 | create | |
| routes/owner-routes.ts | A4 | exists | |
| routes/admin-routes.ts | A4 | exists | |
| **AGENT 5: Dashboard/Study** | | | |
| services/studentApi.ts | A5 | refactor | |
| services/studySessionApi.ts | A5 | create | |
| types/study.ts | A5 | create | |
| types/student.ts | A5 | refactor | |
| hooks/useStudentNav.ts | A5 | exists | |
| content/DashboardView.tsx | A5 | exists | |
| content/StudyHubView.tsx | A5 | exists | |
| content/StudyView.tsx | A5 | exists | |
| shared/CourseCard.tsx | A5 | exists | |
| shared/KPICard.tsx | A5 | exists | |
| shared/ActivityItem.tsx | A5 | exists | |
| layout/CourseSwitcher.tsx | A5 | refactor | |
| **AGENT 6: 3D Models** | | | |
| services/models3dApi.ts | A6 | create | |
| types/model3d.ts | A6 | create | |
| routes/student-3d-routes.ts | A6 | create | |

See interactive app for tree view with expand/collapse and copy-to-clipboard per agent.
