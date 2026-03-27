import { useState, useReducer } from "react";
import { Search, Plus, ChevronDown, ChevronRight, Clock, CheckCircle, AlertCircle, XCircle, Users, GitBranch, FileText, Lightbulb, Map, Activity, Brain, Flag, Trash2, Edit3, Save, X, Filter, BarChart3, Zap, Target, Layers, MessageSquare, BookOpen, Settings, Eye, Play, Pause, RotateCcw } from "lucide-react";

// ============================================================
// DATA STORE — Axon v4.5 Medical Education Platform
// ============================================================
const initialState = {
  agents: [
    // FASE 1 — 13 Agentes Activos
    { id: "flashcards-be", name: "flashcards-backend", role: "FSRS v4, CRUD, batch review", status: "active", lastActive: "2026-03-20", tasksCompleted: 5, currentTask: null, repo: "axon-backend", module: "Flashcards" },
    { id: "flashcards-fe", name: "flashcards-frontend", role: "React UI, review sessions, adaptive", status: "active", lastActive: "2026-03-20", tasksCompleted: 3, currentTask: null, repo: "numero1_sseki_2325_55", module: "Flashcards" },
    { id: "flashcards-test", name: "flashcards-tester", role: "Unit + Integration + E2E tests", status: "idle", lastActive: "—", tasksCompleted: 0, currentTask: null, repo: "ambos", module: "Flashcards" },
    { id: "quiz-be", name: "quiz-backend", role: "BKT v4, smart gen, CRUD quizzes", status: "active", lastActive: "2026-03-20", tasksCompleted: 4, currentTask: null, repo: "axon-backend", module: "Quiz" },
    { id: "quiz-fe", name: "quiz-frontend", role: "Quiz taking, results, creation UI", status: "active", lastActive: "2026-03-20", tasksCompleted: 3, currentTask: "Quiz results display", repo: "numero1_sseki_2325_55", module: "Quiz" },
    { id: "quiz-test", name: "quiz-tester", role: "Unit + Integration + E2E tests", status: "idle", lastActive: "—", tasksCompleted: 0, currentTask: null, repo: "ambos", module: "Quiz" },
    { id: "summaries-be", name: "summaries-backend", role: "RAG pipeline, chunking, embeddings", status: "active", lastActive: "2026-03-20", tasksCompleted: 4, currentTask: null, repo: "axon-backend", module: "Summaries" },
    { id: "summaries-fe", name: "summaries-frontend", role: "Reader UI, TipTap editor, annotations", status: "active", lastActive: "2026-03-20", tasksCompleted: 3, currentTask: "BUG-006 fix", repo: "numero1_sseki_2325_55", module: "Summaries" },
    { id: "summaries-test", name: "summaries-tester", role: "Unit + Integration + E2E tests", status: "idle", lastActive: "—", tasksCompleted: 0, currentTask: null, repo: "ambos", module: "Summaries" },
    { id: "infra-plumb", name: "infra-plumbing", role: "CRUD factory, DB, auth, validation, rate limit", status: "active", lastActive: "2026-03-20", tasksCompleted: 7, currentTask: null, repo: "axon-backend", module: "Infrastructure" },
    { id: "infra-ai", name: "infra-ai", role: "Gemini, OpenAI, Claude, RAG pipeline", status: "active", lastActive: "2026-03-20", tasksCompleted: 5, currentTask: "BUG-001 investigation", repo: "axon-backend", module: "Infrastructure" },
    { id: "infra-ui", name: "infra-ui", role: "Shared components, contexts, types, lib", status: "active", lastActive: "2026-03-20", tasksCompleted: 4, currentTask: null, repo: "numero1_sseki_2325_55", module: "Infrastructure" },
    { id: "quality-gate", name: "quality-gate", role: "Code auditor — reviews every agent change", status: "active", lastActive: "2026-03-20", tasksCompleted: 6, currentTask: null, repo: "ambos", module: "QA" },
    // FASE 2 — On Demand
    { id: "admin-dev", name: "admin-dev", role: "Dashboard, Owner/Admin/Professor pages, Stripe", status: "idle", lastActive: "—", tasksCompleted: 0, currentTask: null, repo: "ambos", module: "Admin (Fase 2)" },
    { id: "study-dev", name: "study-dev", role: "Study Hub, Schedule, Mastery, Heatmap", status: "idle", lastActive: "—", tasksCompleted: 0, currentTask: null, repo: "ambos", module: "Study (Fase 2)" },
    { id: "docs-writer", name: "docs-writer", role: "API docs, KNOWN-BUGS, PLATFORM-CONTEXT", status: "idle", lastActive: "—", tasksCompleted: 0, currentTask: null, repo: "axon-docs", module: "Docs (Fase 2)" },
  ],
  tasks: [
    // Completadas
    { id: "task-setup", title: "Setup Command Center", description: "Crear estructura, dashboard, schema Supabase", status: "done", priority: "high", assignedTo: "quality-gate", phase: "Fase 0: Setup", createdAt: "2026-03-21", logs: [] },
    { id: "task-security", title: "Security Audit Round 1", description: "JWT, RLS 33+ tablas, CORS, XSS, CSP, HSTS, AI injection, Telegram", status: "done", priority: "critical", assignedTo: "infra-plumb", phase: "Fase 0: Setup", createdAt: "2026-03-19", logs: ["13 issues fixed"] },
    { id: "task-bug030", title: "BUG-030: Wire Professor+Owner routes", description: "16 professor + 8 owner real pages existian pero apuntaban a PlaceholderPage", status: "done", priority: "high", assignedTo: "infra-ui", phase: "Fase 1: Core Modules", createdAt: "2026-03-20", logs: ["PR #150 merged"] },
    { id: "task-bug035", title: "BUG-035: Fix AI Chat streaming", description: "Backend ?stream=1 URL vs frontend body.stream mismatch", status: "done", priority: "high", assignedTo: "infra-ai", phase: "Fase 1: Core Modules", createdAt: "2026-03-20", logs: ["Backend PR #149 + Frontend PR #148 merged"] },
    { id: "task-bug031", title: "BUG-031: Auth error loop fix", description: "AuthContext swallowed 500 from /institutions → redirect loop", status: "done", priority: "high", assignedTo: "infra-ui", phase: "Fase 1: Core Modules", createdAt: "2026-03-20", logs: ["PR #155 merged"] },
    // Activas / Pendientes
    { id: "task-bug001", title: "BUG-001: Mux webhook resolution_tier", description: "resolution_tier vs max_resolution mismatch en webhook de Mux. Bloquea video uploads.", status: "todo", priority: "critical", assignedTo: "infra-ai", phase: "Fase 1: Core Modules", createdAt: "2026-03-21", logs: [] },
    { id: "task-test001", title: "TEST-001: Setup frontend test infra", description: "Frontend tests failing en main. Configurar Vitest correctamente. BLOQUEA los 3 tester agents.", status: "todo", priority: "high", assignedTo: "", phase: "Fase 1: Core Modules", createdAt: "2026-03-21", logs: [] },
    { id: "task-bug006", title: "BUG-006: Content tree filters in JS", description: "Content tree filtra inactivos en JS en vez de SQL. Performance issue.", status: "todo", priority: "medium", assignedTo: "summaries-fe", phase: "Fase 1: Core Modules", createdAt: "2026-03-21", logs: [] },
    { id: "task-secs9b", title: "SEC-S9B: REVOKE 6 SQL functions", description: "6 funciones SQL necesitan REVOKE FROM authenticated. ~12 callers deben migrar a adminDb.", status: "todo", priority: "medium", assignedTo: "infra-plumb", phase: "Fase 1: Core Modules", createdAt: "2026-03-21", logs: [] },
    { id: "task-bug021", title: "BUG-021: GamificationContext STUB", description: "GamificationContext tiene no-ops. Necesita conectarse al backend real.", status: "backlog", priority: "medium", assignedTo: "infra-ui", phase: "Fase 1: Core Modules", createdAt: "2026-03-21", logs: [] },
    { id: "task-quiz-results", title: "Complete quiz results display", description: "Terminar UI de resultados de quiz (parcialmente implementado)", status: "in-progress", priority: "medium", assignedTo: "quiz-fe", phase: "Fase 1: Core Modules", createdAt: "2026-03-21", logs: [] },
    { id: "task-bug011", title: "BUG-011: Clean kv_store_* tables", description: "~25 tablas basura kv_store_* en la DB", status: "backlog", priority: "low", assignedTo: "infra-plumb", phase: "Fase 1: Core Modules", createdAt: "2026-03-21", logs: [] },
    { id: "task-bug027", title: "BUG-027: Dual content tree impl", description: "useContentTree hook vs ContentTreeContext — elegir uno", status: "backlog", priority: "low", assignedTo: "summaries-fe", phase: "Fase 1: Core Modules", createdAt: "2026-03-21", logs: [] },
    { id: "task-bug034", title: "BUG-034: /reading-states 400 error", description: "GET /reading-states?limit=1000 returns 400 — falta parent param", status: "backlog", priority: "low", assignedTo: "infra-plumb", phase: "Fase 1: Core Modules", createdAt: "2026-03-21", logs: [] },
    { id: "task-td-mui", title: "Remove MUI + Emotion", description: "MUI + Emotion installed con 0 imports. Limpiar deps del frontend.", status: "backlog", priority: "low", assignedTo: "infra-ui", phase: "Fase 1: Core Modules", createdAt: "2026-03-21", logs: [] },
    { id: "task-td-branches", title: "Clean stale branches", description: "78 stale remote branches (frontend) + 92 (backend). Limpiar.", status: "backlog", priority: "low", assignedTo: "", phase: "Fase 1: Core Modules", createdAt: "2026-03-21", logs: [] },
  ],
  roadmap: [
    { id: "phase-0", name: "Fase 0: Setup y Preparacion", status: "done", progress: 100, deadline: "2026-01-31" },
    { id: "phase-1", name: "Fase 1: Core Modules (13 agents)", status: "active", progress: 29, deadline: "2026-04-30" },
    { id: "phase-2", name: "Fase 2: Advanced Features (+3 agents)", status: "pending", progress: 0, deadline: "2026-06-30" },
    { id: "phase-3", name: "Fase 3: Testing & QA (E2E, load, security)", status: "pending", progress: 0, deadline: "2026-06-30" },
    { id: "phase-4", name: "Fase 4: Deploy & Launch", status: "pending", progress: 0, deadline: "2026-07-15" },
    { id: "phase-5", name: "Fase 5: Growth & Iteration", status: "pending", progress: 0, deadline: "" },
  ],
  changelog: [
    { id: "cl-10", date: "2026-03-21", agent: "Sistema", action: "Central de Comando creada con datos reales de Axon", type: "setup", details: "13 agentes, 11 bugs, roadmap 5 fases" },
    { id: "cl-9", date: "2026-03-20", agent: "infra-ai", action: "BUG-035 FIXED: AI Chat streaming", type: "fix", details: "Backend PR #149 + Frontend PR #148 merged. ?stream=1 + body.stream" },
    { id: "cl-8", date: "2026-03-20", agent: "infra-ui", action: "BUG-030 FIXED: Professor+Owner routes wired", type: "fix", details: "All 13 routes connected to real page components. PR #150" },
    { id: "cl-7", date: "2026-03-20", agent: "infra-ui", action: "BUG-031 FIXED: Auth error handling", type: "fix", details: "authError state, fetchInstitutions throws, loadSession structured. PR #155" },
    { id: "cl-6", date: "2026-03-20", agent: "infra-plumb", action: "BUG-020, BUG-026, BUG-033 FIXED", type: "fix", details: "time_limit stripped, demo-student removed, useTopicMastery fixed. PRs #158-160" },
    { id: "cl-5", date: "2026-03-20", agent: "quality-gate", action: "BUG-028 FIXED: architecture.ts deleted (30KB stale)", type: "fix", details: "582-line stale file removed. PR #153" },
    { id: "cl-4", date: "2026-03-19", agent: "infra-plumb", action: "Security Audit Round 1: 13 issues fixed", type: "security", details: "JWT crypto (jose ES256), RLS 33+ tables, CORS, XSS (DOMPurify), CSP, HSTS, AI sanitization, Telegram hardening" },
    { id: "cl-3", date: "2026-03-18", agent: "infra-ai", action: "Embedding migration: Gemini 768d → OpenAI 1536d", type: "feature", details: "text-embedding-3-large for RAG pipeline" },
    { id: "cl-2", date: "2026-03-13", agent: "infra-plumb", action: "Gamification complete", type: "feature", details: "XP engine, 39 badges, streaks, goals, leaderboard. 13 endpoints + 8 hooks" },
    { id: "cl-1", date: "2026-03-10", agent: "infra-ai", action: "Telegram bot + WhatsApp Cloud API integration", type: "feature", details: "Webhook, review-flow, rate-limit. Claude AI + realtime voice sessions" },
  ],
  ideas: [
    { id: "idea-1", title: "Sync changelog → Google Docs", description: "Automatizar la sincronizacion de cambios al Google Docs del proyecto", votes: 3, status: "new", author: "Petrick" },
    { id: "idea-2", title: "AI Tutor Chatbot (RAG Chat ya existe)", description: "Expandir RAG chat a tutor IA completo con historial, follow-ups, y contexto del progreso del estudiante. Backend /ai/rag-chat ya funciona.", votes: 2, status: "new", author: "Petrick" },
    { id: "idea-3", title: "Mobile Native (iOS/Android)", description: "Apps nativas con React Native reutilizando logica del frontend web", votes: 1, status: "new", author: "Petrick" },
    { id: "idea-4", title: "Peer-to-peer learning", description: "Features para que estudiantes colaboren: study groups, shared flashcards", votes: 1, status: "new", author: "Petrick" },
    { id: "idea-5", title: "Certification tracking", description: "Tracking de certificaciones medicas y creditos de educacion continua", votes: 0, status: "new", author: "Petrick" },
    { id: "idea-6", title: "i18n Multi-language", description: "Soporte multi-idioma completo (actualmente ES admin + PT-BR estudiante)", votes: 0, status: "new", author: "Petrick" },
    { id: "idea-7", title: "Deduplicar Telegram/WhatsApp review-flow", description: "~800 LOC duplicados entre ambos. Extraer a modulo compartido.", votes: 0, status: "new", author: "Petrick" },
    { id: "idea-8", title: "Remove MUI + Emotion deps", description: "Instalados con 0 imports. Limpiar package.json del frontend.", votes: 0, status: "new", author: "Petrick" },
  ],
  checkpoints: [
    { id: "cp-3", sessionId: "SES-003", date: "2026-03-21", agent: "Cowork", summary: "Command Center creado con datos reales de Axon v4.5", status: "completed" },
    { id: "cp-2", sessionId: "SES-002", date: "2026-03-20", agent: "Multi-agent", summary: "BUG-030, BUG-031, BUG-035 fixed + 4 more. 7 PRs merged.", status: "completed" },
    { id: "cp-1", sessionId: "SES-001", date: "2026-03-19", agent: "infra-plumb", summary: "Security Audit Round 1 — 13 issues fixed (JWT, RLS, CORS, XSS, CSP)", status: "completed" },
  ],
  memory: [
    // Decisions
    { id: "mem-1", key: "13 agentes Fase 1 (no re-litigar)", value: "40→35→32→24→13 agentes tras 4 rondas de auditoria. Directory-first ownership, single lead, no coordinators. Shared memory por seccion.", category: "decision", date: "2026-03-20" },
    { id: "mem-2", key: "Siempre Opus — nunca sonnet/haiku", value: "Todos los agentes usan model: opus. La calidad compensa el costo. Quality-gate tambien Opus.", category: "decision", date: "2026-03-20" },
    { id: "mem-3", key: "Dual Token Auth pattern", value: "Authorization: Bearer SUPABASE_ANON_KEY (gateway) + X-Access-Token: USER_JWT (identity). Role viene de GET /institutions, NO del JWT.", category: "decision", date: "2026-03-19" },
    { id: "mem-4", key: "Rutas planas, nunca nested", value: "WRONG: /topics/:id/summaries. RIGHT: /summaries?topic_id=xxx. Todas las rutas backend son flat con query params.", category: "decision", date: "2026-03-15" },
    { id: "mem-5", key: "XP via award_xp() RPC solamente", value: "Nunca modificar total_xp directamente. Siempre usar awardXP() en xp-engine.ts que llama al RPC award_xp(). Daily cap 500 XP.", category: "decision", date: "2026-03-13" },
    // Warnings
    { id: "mem-6", key: "Max 5 agentes simultaneos", value: "API retorna 529 por encima de 5 agentes Opus simultaneos. Respetar este limite.", category: "warning", date: "2026-03-20" },
    { id: "mem-7", key: "Feature branches SIEMPRE", value: "gh CLI no autenticado. Push branch, Petrick hace merge via browser. NUNCA push a main.", category: "warning", date: "2026-03-20" },
    { id: "mem-8", key: "2+ agentes mismo repo = worktree", value: "Si 2 o mas agentes trabajan en el mismo repo, usar isolation: worktree para evitar commits cruzados.", category: "warning", date: "2026-03-20" },
    // Learnings
    { id: "mem-9", key: "Streaming: enviar AMBOS parametros", value: "rag-chat: enviar ?stream=1 en URL Y stream: true en body. Backend debe checkear ambos. (Leccion de BUG-035)", category: "learning", date: "2026-03-20" },
    { id: "mem-10", key: "Estado volatil en memory, no CLAUDE.md", value: "CLAUDE.md solo tiene hechos estables. Estado actual (bugs, branches, WIP) va en memory/project_current_state.md.", category: "learning", date: "2026-03-20" },
    // Context
    { id: "mem-11", key: "Proyecto v4.5 — 62 migrations, 93 backend files", value: "Frontend: ~538 archivos (188 logic + 350 components). Backend: ~93 files. 50+ tablas DB. pgvector 1536d.", category: "context", date: "2026-03-21" },
    { id: "mem-13", key: "Features YA completadas (no reimplementar)", value: "Gamification (2026-03-13), Telegram+WhatsApp (2026-03-10), Mux video, Stripe billing, Claude AI, Realtime voice, Embeddings OpenAI 1536d (2026-03-18), Security audit 13 fixes (2026-03-19), Professor+Owner routes (2026-03-20)", category: "warning", date: "2026-03-21" },
    { id: "mem-12", key: "Petrick = solo developer/founder", value: "Trabaja en espanol, UI estudiante en portugues BR. Usa Figma Make para prototipos, Obsidian para notas.", category: "context", date: "2026-03-21" },
  ],
  docs: [
    { id: "doc-1", title: "Arquitectura Axon v4.5", content: "Frontend (React 18 + Vite + Tailwind v4) → Vercel\n  └─ apiCall() en lib/api.ts\n       │\n       ▼\nBackend (Hono/Deno) → Supabase Edge Functions\n  ├─ PostgreSQL + pgvector (1536d embeddings)\n  ├─ AI/RAG: Gemini 2.5 Flash + OpenAI embeddings + Claude\n  ├─ FSRS v4 (spaced rep) + BKT v4 (knowledge tracing)\n  ├─ Gamification: XP + streaks + badges + leaderboard\n  ├─ Messaging: Telegram + WhatsApp\n  ├─ Video: Mux\n  └─ Billing: Stripe\n\nJerarquia: Institution → Course → Semester → Section → Topic → Summary\n4 Roles: Owner(4), Admin(3), Professor(2), Student(1)", category: "architecture", lastUpdated: "2026-03-21" },
    { id: "doc-2", title: "Convenciones de Codigo", content: "1. Feature branches (nunca push a main)\n2. Quality gate despues de cada agente\n3. Documentar cambios en changelog\n4. Commit message: tipo(scope): descripcion\n5. Path alias: @ = ./src en frontend\n6. Import icons de lucide-react\n7. Toasts con sonner\n8. No modificar src/app/components/ui/ (shadcn primitives)\n9. Rutas flat: /things?parent_id=xxx\n10. apiCall() para todas las llamadas API", category: "conventions", lastUpdated: "2026-03-21" },
    { id: "doc-3", title: "Bugs Abiertos (14 total)", content: "HIGH (1):\n- BUG-001: resolution_tier vs max_resolution Mux webhook\n\nMEDIUM (3):\n- BUG-006: Content tree filters inactives in JS (deberia ser SQL)\n- BUG-021: GamificationContext is STUB (no-ops, necesita backend real)\n- SEC-S9B: 6 SQL functions need REVOKE from authenticated (~12 callers)\n\nLOW (7):\n- BUG-011: ~25 kv_store_* junk tables en DB\n- BUG-024: Overlapping types kw-notes in 2 services\n- BUG-027: Dual content tree impl (hook vs context)\n- SEC-S7: JWT expiry 3600s (needs Supabase Pro for 300s)\n- SEC-S16: 13 low/info backlog items (package-lock, redirects, etc.)\n- BUG-034: GET /reading-states?limit=1000 returns 400\n- TEST-001: Frontend tests failing on main (pre-existing)\n\nINFO (3): BUG-022 (apiConfig not dead), BUG-023 (aiFlashcardGen not dead), BUG-025 (ANON_KEY hardcoded by design)\n\nTOTAL FIXED: 37+ (incl security audit 13 issues)", category: "general", lastUpdated: "2026-03-21" },
    { id: "doc-4", title: "Tech Stack Detallado", content: "FRONTEND:\nReact 18, TypeScript, Vite 6, Tailwind v4, React Router v7, React Query v5, shadcn/ui, Lucide, Motion, TipTap, Three.js, Mux Player, Sonner, date-fns\n\nBACKEND:\nHono + Deno, PostgreSQL + pgvector, Gemini 2.5 Flash, OpenAI text-embedding-3-large, Claude, Stripe, Mux, WhatsApp Cloud API, Telegram Bot\n\nALGORITMOS:\nFSRS v4 (spaced repetition scheduling)\nBKT v4 (Bayesian Knowledge Tracing)\n\nDEPLOY:\nFrontend → Vercel (SPA)\nBackend → Supabase Edge Functions\nCI/CD → GitHub Actions", category: "architecture", lastUpdated: "2026-03-21" },
    { id: "doc-5", title: "Estrategia de 13 Agentes", content: "FASE 1 (13 agentes activos):\n- Flashcards: backend + frontend + tester\n- Quiz: backend + frontend + tester\n- Summaries: backend + frontend + tester\n- Infra: plumbing + ai + ui\n- QA: quality-gate\n\nFASE 2 (3 on-demand):\n- admin-dev, study-dev, docs-writer\n\nREGLAS:\n- Directory-first, keyword-second ownership\n- Single lead, no coordinators\n- Shared memory per section\n- ALL agents Opus\n- Quality-gate after every code change", category: "conventions", lastUpdated: "2026-03-21" },
    { id: "doc-6", title: "API Reference (Backend)", content: "AUTH: POST /signup, GET/PUT /me\nCONTENT: courses, semesters, sections, topics, summaries, chunks, keywords\nSTUDENT: flashcards, quizzes, notes, annotations, videos\nSTUDY: sessions, plans, reviews, /topic-progress, /study-queue\nAI: POST /ai/generate, POST /ai/rag-chat, POST /ai/ingest-embeddings\nGAMIFICATION: /profile, /badges, /streak-status, /daily-check-in, /leaderboard\nBILLING: /checkout-session, /portal-session, /webhooks/stripe\nVIDEO: /mux/create-upload, /mux/playback-token, /mux/track-view\nSEARCH: /search?q=&type=, /trash, /restore\nSTORAGE: /upload, /signed-url, /delete", category: "api", lastUpdated: "2026-03-21" },
  ]
};

function reducer(state, action) {
  switch (action.type) {
    case "ADD_TASK": return { ...state, tasks: [...state.tasks, action.payload] };
    case "UPDATE_TASK": return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) };
    case "DELETE_TASK": return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    case "ADD_AGENT": return { ...state, agents: [...state.agents, action.payload] };
    case "UPDATE_AGENT": return { ...state, agents: state.agents.map(a => a.id === action.payload.id ? { ...a, ...action.payload } : a) };
    case "DELETE_AGENT": return { ...state, agents: state.agents.filter(a => a.id !== action.payload) };
    case "ADD_CHANGELOG": return { ...state, changelog: [action.payload, ...state.changelog] };
    case "ADD_IDEA": return { ...state, ideas: [...state.ideas, action.payload] };
    case "VOTE_IDEA": return { ...state, ideas: state.ideas.map(i => i.id === action.payload ? { ...i, votes: i.votes + 1 } : i) };
    case "DELETE_IDEA": return { ...state, ideas: state.ideas.filter(i => i.id !== action.payload) };
    case "ADD_CHECKPOINT": return { ...state, checkpoints: [action.payload, ...state.checkpoints] };
    case "ADD_MEMORY": return { ...state, memory: [...state.memory, action.payload] };
    case "DELETE_MEMORY": return { ...state, memory: state.memory.filter(m => m.id !== action.payload) };
    case "UPDATE_ROADMAP": return { ...state, roadmap: state.roadmap.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r) };
    case "ADD_PHASE": return { ...state, roadmap: [...state.roadmap, action.payload] };
    case "ADD_DOC": return { ...state, docs: [...state.docs, action.payload] };
    case "UPDATE_DOC": return { ...state, docs: state.docs.map(d => d.id === action.payload.id ? { ...d, ...action.payload } : d) };
    default: return state;
  }
}

// ============================================================
// UI PRIMITIVES
// ============================================================
const Badge = ({ children, color = "#6366f1" }) => (
  <span style={{ background: color + "22", color, padding: "2px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{children}</span>
);

const StatusDot = ({ status }) => {
  const colors = { active: "#22c55e", idle: "#eab308", offline: "#ef4444", done: "#22c55e", "in-progress": "#3b82f6", pending: "#94a3b8", blocked: "#ef4444", new: "#8b5cf6", backlog: "#94a3b8", todo: "#eab308" };
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[status] || "#94a3b8", display: "inline-block", marginRight: 6, flexShrink: 0 }} />;
};

const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{ background: "#1e1e2e", border: "1px solid #313244", borderRadius: 12, padding: 16, ...style, cursor: onClick ? "pointer" : "default" }}>{children}</div>
);

const Button = ({ children, onClick, variant = "primary", size = "md", style = {} }) => {
  const base = { border: "none", borderRadius: 8, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, transition: "all 0.15s" };
  const sizes = { sm: { padding: "4px 10px", fontSize: 12 }, md: { padding: "8px 16px", fontSize: 13 }, lg: { padding: "10px 20px", fontSize: 14 } };
  const variants = { primary: { background: "#6366f1", color: "#fff" }, secondary: { background: "#313244", color: "#cdd6f4" }, danger: { background: "#ef4444", color: "#fff" }, ghost: { background: "transparent", color: "#cdd6f4", border: "1px solid #313244" } };
  return <button onClick={onClick} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>{children}</button>;
};

const Input = ({ value, onChange, placeholder, style = {} }) => (
  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ background: "#181825", border: "1px solid #313244", borderRadius: 8, padding: "8px 12px", color: "#cdd6f4", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", ...style }} />
);

const TextArea = ({ value, onChange, placeholder, rows = 3, style = {} }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ background: "#181825", border: "1px solid #313244", borderRadius: 8, padding: "8px 12px", color: "#cdd6f4", fontSize: 13, outline: "none", width: "100%", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", ...style }} />
);

const Select = ({ value, onChange, options, style = {} }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{ background: "#181825", border: "1px solid #313244", borderRadius: 8, padding: "8px 12px", color: "#cdd6f4", fontSize: 13, outline: "none", ...style }}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#1e1e2e", border: "1px solid #313244", borderRadius: 16, padding: 24, minWidth: 380, maxWidth: 560, maxHeight: "80vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ color: "#cdd6f4", margin: 0, fontSize: 18 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6c7086", cursor: "pointer" }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color = "#6366f1", sub }) => (
  <Card style={{ display: "flex", alignItems: "center", gap: 14 }}>
    <div style={{ background: color + "22", borderRadius: 10, padding: 10, display: "flex", flexShrink: 0 }}><Icon size={20} color={color} /></div>
    <div>
      <div style={{ color: "#6c7086", fontSize: 12 }}>{label}</div>
      <div style={{ color: "#cdd6f4", fontSize: 22, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ color: "#6c7086", fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  </Card>
);

const ProgressBar = ({ value, color = "#6366f1", height = 6 }) => (
  <div style={{ background: "#313244", borderRadius: height, height, width: "100%", overflow: "hidden" }}>
    <div style={{ background: color, height: "100%", width: `${Math.min(100, Math.max(0, value))}%`, borderRadius: height, transition: "width 0.3s" }} />
  </div>
);

const SectionTitle = ({ icon: Icon, children, action }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {Icon && <Icon size={18} color="#6366f1" />}
      <h2 style={{ color: "#cdd6f4", margin: 0, fontSize: 16, fontWeight: 700 }}>{children}</h2>
    </div>
    {action}
  </div>
);

const EmptyState = ({ icon: Icon, message, action }) => (
  <div style={{ textAlign: "center", padding: "32px 16px", color: "#6c7086" }}>
    <Icon size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
    <p style={{ margin: "8px 0" }}>{message}</p>
    {action}
  </div>
);

// ============================================================
// PANEL PRINCIPAL
// ============================================================
function DashboardPanel({ state }) {
  const totalTasks = state.tasks.length;
  const doneTasks = state.tasks.filter(t => t.status === "done").length;
  const inProgress = state.tasks.filter(t => t.status === "in-progress").length;
  const blocked = state.tasks.filter(t => t.status === "blocked").length;
  const activeAgents = state.agents.filter(a => a.status === "active").length;
  const activePhase = state.roadmap.find(r => r.status === "active");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <StatCard icon={Target} label="Tareas Totales" value={totalTasks} color="#6366f1" sub={`${doneTasks} completadas`} />
        <StatCard icon={Zap} label="En Progreso" value={inProgress} color="#3b82f6" sub={`${blocked} bloqueadas`} />
        <StatCard icon={Users} label="Agentes" value={state.agents.length} color="#22c55e" sub={`${activeAgents} activos`} />
        <StatCard icon={Map} label="Fase Actual" value={activePhase?.name?.split(":")[0] || "—"} color="#f59e0b" sub={`${activePhase?.progress || 0}%`} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card>
          <SectionTitle icon={Activity}>Actividad Reciente</SectionTitle>
          {state.changelog.slice(0, 6).map(cl => (
            <div key={cl.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #313244" }}>
              <StatusDot status={cl.type === "fix" ? "done" : cl.type === "feature" ? "active" : "idle"} />
              <div style={{ overflow: "hidden" }}>
                <div style={{ color: "#cdd6f4", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cl.action}</div>
                <div style={{ color: "#6c7086", fontSize: 11 }}>{cl.agent} — {cl.date}</div>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <SectionTitle icon={Flag}>Roadmap</SectionTitle>
          {state.roadmap.map(phase => (
            <div key={phase.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#cdd6f4", fontSize: 13 }}>{phase.name}</span>
                <span style={{ color: "#6c7086", fontSize: 11 }}>{phase.progress}%</span>
              </div>
              <ProgressBar value={phase.progress} color={phase.status === "done" ? "#22c55e" : phase.status === "active" ? "#6366f1" : "#313244"} />
            </div>
          ))}
        </Card>
      </div>
      <Card>
        <SectionTitle icon={Users}>Agentes</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
          {state.agents.map(ag => (
            <div key={ag.id} style={{ background: "#181825", borderRadius: 10, padding: 12, display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: ag.status === "active" ? "#22c55e22" : "#31324466", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Users size={16} color={ag.status === "active" ? "#22c55e" : "#6c7086"} />
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ color: "#cdd6f4", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ag.name}</div>
                <div style={{ color: "#6c7086", fontSize: 11 }}>{ag.role}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}><StatusDot status={ag.status} /><span style={{ color: "#6c7086", fontSize: 11 }}>{ag.status}</span></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// TAREAS (KANBAN)
// ============================================================
function TasksPanel({ state, dispatch }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", assignedTo: "", phase: "" });
  const [filter, setFilter] = useState("all");
  const columns = [
    { key: "backlog", label: "Backlog", color: "#94a3b8", icon: Layers },
    { key: "todo", label: "To Do", color: "#eab308", icon: Clock },
    { key: "in-progress", label: "En Progreso", color: "#3b82f6", icon: Play },
    { key: "blocked", label: "Bloqueada", color: "#ef4444", icon: XCircle },
    { key: "done", label: "Hecho", color: "#22c55e", icon: CheckCircle },
  ];
  const priorityColors = { critical: "#ef4444", high: "#f59e0b", medium: "#3b82f6", low: "#22c55e" };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    dispatch({ type: "ADD_TASK", payload: { id: `task-${Date.now()}`, ...newTask, status: "backlog", createdAt: new Date().toISOString().slice(0, 10), logs: [] } });
    dispatch({ type: "ADD_CHANGELOG", payload: { id: `cl-${Date.now()}`, date: new Date().toISOString().slice(0, 10), agent: "Petrick", action: `Tarea creada: ${newTask.title}`, type: "task" } });
    setNewTask({ title: "", description: "", priority: "medium", assignedTo: "", phase: "" });
    setShowAdd(false);
  };

  const moveTask = (taskId, newStatus) => {
    const task = state.tasks.find(t => t.id === taskId);
    dispatch({ type: "UPDATE_TASK", payload: { id: taskId, status: newStatus } });
    dispatch({ type: "ADD_CHANGELOG", payload: { id: `cl-${Date.now()}`, date: new Date().toISOString().slice(0, 10), agent: "Sistema", action: `${task?.title} → ${newStatus}`, type: "move" } });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", "critical", "high", "medium", "low"].map(f => (
            <Button key={f} variant={filter === f ? "primary" : "ghost"} size="sm" onClick={() => setFilter(f)}>
              {f === "all" ? "Todas" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm"><Plus size={14} /> Nueva Tarea</Button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns.length}, minmax(160px, 1fr))`, gap: 8, overflowX: "auto" }}>
        {columns.map(col => {
          const tasks = state.tasks.filter(t => t.status === col.key && (filter === "all" || t.priority === filter));
          return (
            <div key={col.key} style={{ background: "#181825", borderRadius: 12, padding: 10, minHeight: 180 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, color: col.color }}>
                <col.icon size={14} /><span style={{ fontWeight: 700, fontSize: 12 }}>{col.label}</span><Badge color={col.color}>{tasks.length}</Badge>
              </div>
              {tasks.map(task => (
                <Card key={task.id} style={{ marginBottom: 6, padding: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ color: "#cdd6f4", fontSize: 12, fontWeight: 600 }}>{task.title}</span>
                    <Badge color={priorityColors[task.priority]}>{task.priority}</Badge>
                  </div>
                  {task.description && <p style={{ color: "#6c7086", fontSize: 11, margin: "2px 0" }}>{task.description}</p>}
                  {task.assignedTo && <div style={{ color: "#6c7086", fontSize: 10 }}>{state.agents.find(a => a.id === task.assignedTo)?.name || "—"}</div>}
                  <div style={{ display: "flex", gap: 3, marginTop: 6, flexWrap: "wrap" }}>
                    {columns.filter(c => c.key !== col.key).map(c => (
                      <button key={c.key} onClick={() => moveTask(task.id, c.key)} style={{ background: c.color + "22", color: c.color, border: "none", borderRadius: 4, padding: "1px 5px", fontSize: 9, cursor: "pointer" }}>→ {c.label}</button>
                    ))}
                    <button onClick={() => dispatch({ type: "DELETE_TASK", payload: task.id })} style={{ background: "#ef444422", color: "#ef4444", border: "none", borderRadius: 4, padding: "1px 5px", fontSize: 9, cursor: "pointer", marginLeft: "auto" }}><Trash2 size={9} /></button>
                  </div>
                </Card>
              ))}
            </div>
          );
        })}
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nueva Tarea">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input value={newTask.title} onChange={v => setNewTask({ ...newTask, title: v })} placeholder="Titulo de la tarea" />
          <TextArea value={newTask.description} onChange={v => setNewTask({ ...newTask, description: v })} placeholder="Descripcion (opcional)" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Select value={newTask.priority} onChange={v => setNewTask({ ...newTask, priority: v })} options={[{ value: "critical", label: "Critica" }, { value: "high", label: "Alta" }, { value: "medium", label: "Media" }, { value: "low", label: "Baja" }]} />
            <Select value={newTask.assignedTo} onChange={v => setNewTask({ ...newTask, assignedTo: v })} options={[{ value: "", label: "Sin asignar" }, ...state.agents.map(a => ({ value: a.id, label: a.name }))]} />
          </div>
          <Input value={newTask.phase} onChange={v => setNewTask({ ...newTask, phase: v })} placeholder="Fase del roadmap (opcional)" />
          <Button onClick={addTask}>Crear Tarea</Button>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// ROADMAP
// ============================================================
function RoadmapPanel({ state, dispatch }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newPhase, setNewPhase] = useState({ name: "", deadline: "" });
  const statusColors = { done: "#22c55e", active: "#6366f1", pending: "#94a3b8" };
  const statusLabels = { done: "Completada", active: "En Progreso", pending: "Pendiente" };

  const addPhase = () => {
    if (!newPhase.name.trim()) return;
    dispatch({ type: "ADD_PHASE", payload: { id: `phase-${Date.now()}`, name: newPhase.name, status: "pending", progress: 0, deadline: newPhase.deadline } });
    setNewPhase({ name: "", deadline: "" });
    setShowAdd(false);
  };

  return (
    <div>
      <SectionTitle icon={Map} action={<Button onClick={() => setShowAdd(true)} size="sm"><Plus size={14} /> Nueva Fase</Button>}>Roadmap del Proyecto</SectionTitle>
      <div style={{ position: "relative", paddingLeft: 24 }}>
        <div style={{ position: "absolute", left: 11, top: 0, bottom: 0, width: 2, background: "#313244" }} />
        {state.roadmap.map(phase => {
          const phaseTasks = state.tasks.filter(t => t.phase === phase.name);
          const donePhaseTasks = phaseTasks.filter(t => t.status === "done").length;
          const pct = phaseTasks.length > 0 ? Math.round((donePhaseTasks / phaseTasks.length) * 100) : phase.progress;
          return (
            <div key={phase.id} style={{ position: "relative", marginBottom: 20 }}>
              <div style={{ position: "absolute", left: -19, top: 4, width: 14, height: 14, borderRadius: "50%", background: statusColors[phase.status], border: `2px solid ${phase.status === "active" ? "#6366f1" : "#1e1e2e"}`, zIndex: 1 }} />
              <Card style={{ marginLeft: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                  <div><span style={{ color: "#cdd6f4", fontSize: 15, fontWeight: 700 }}>{phase.name}</span>{" "}<Badge color={statusColors[phase.status]}>{statusLabels[phase.status]}</Badge></div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {["pending", "active", "done"].map(s => (
                      <button key={s} onClick={() => dispatch({ type: "UPDATE_ROADMAP", payload: { id: phase.id, status: s, progress: s === "done" ? 100 : s === "pending" ? 0 : phase.progress } })} style={{ background: statusColors[s] + "22", color: statusColors[s], border: "none", borderRadius: 4, padding: "2px 7px", fontSize: 10, cursor: "pointer" }}>{statusLabels[s]}</button>
                    ))}
                  </div>
                </div>
                {phase.deadline && <div style={{ color: "#6c7086", fontSize: 12, marginBottom: 6 }}>Deadline: {phase.deadline}</div>}
                <ProgressBar value={pct} color={statusColors[phase.status]} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ color: "#6c7086", fontSize: 11 }}>{phaseTasks.length} tareas ({donePhaseTasks} hechas)</span>
                  <span style={{ color: statusColors[phase.status], fontSize: 11, fontWeight: 600 }}>{pct}%</span>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nueva Fase">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input value={newPhase.name} onChange={v => setNewPhase({ ...newPhase, name: v })} placeholder="Nombre (ej: Fase 5: Optimizacion)" />
          <Input value={newPhase.deadline} onChange={v => setNewPhase({ ...newPhase, deadline: v })} placeholder="Deadline (ej: 2026-05-15)" />
          <Button onClick={addPhase}>Agregar Fase</Button>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// AGENTES
// ============================================================
function AgentsPanel({ state, dispatch }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: "", role: "" });

  const addAgent = () => {
    if (!newAgent.name.trim()) return;
    dispatch({ type: "ADD_AGENT", payload: { id: `ag-${Date.now()}`, name: newAgent.name, role: newAgent.role, status: "idle", lastActive: new Date().toISOString().slice(0, 16).replace("T", " "), tasksCompleted: 0, currentTask: null } });
    dispatch({ type: "ADD_CHANGELOG", payload: { id: `cl-${Date.now()}`, date: new Date().toISOString().slice(0, 10), agent: "Sistema", action: `Agente registrado: ${newAgent.name}`, type: "agent" } });
    setNewAgent({ name: "", role: "" });
    setShowAdd(false);
  };

  const toggleStatus = (ag) => {
    const next = ag.status === "active" ? "idle" : "active";
    dispatch({ type: "UPDATE_AGENT", payload: { id: ag.id, status: next, lastActive: new Date().toISOString().slice(0, 16).replace("T", " ") } });
  };

  return (
    <div>
      <SectionTitle icon={Users} action={<Button onClick={() => setShowAdd(true)} size="sm"><Plus size={14} /> Nuevo Agente</Button>}>Agentes</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {state.agents.map(ag => {
          const agTasks = state.tasks.filter(t => t.assignedTo === ag.id);
          const agDone = agTasks.filter(t => t.status === "done").length;
          const agActive = agTasks.find(t => t.status === "in-progress");
          return (
            <Card key={ag.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: ag.status === "active" ? "#22c55e22" : "#31324466", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Users size={18} color={ag.status === "active" ? "#22c55e" : "#6c7086"} />
                  </div>
                  <div>
                    <div style={{ color: "#cdd6f4", fontWeight: 700 }}>{ag.name}</div>
                    <div style={{ color: "#6c7086", fontSize: 12 }}>{ag.role}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => toggleStatus(ag)} style={{ background: ag.status === "active" ? "#22c55e22" : "#eab30822", color: ag.status === "active" ? "#22c55e" : "#eab308", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>{ag.status === "active" ? "Activo" : "Idle"}</button>
                  <button onClick={() => dispatch({ type: "DELETE_AGENT", payload: ag.id })} style={{ background: "#ef444422", color: "#ef4444", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}><Trash2 size={11} /></button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#6c7086" }}>
                {ag.repo && <div><Badge color="#313244">{ag.repo}</Badge>{ag.module && <span style={{ marginLeft: 4 }}>{ag.module}</span>}</div>}
                <div style={{ marginTop: 4 }}>Tareas: {agDone}/{agTasks.length}</div>
                <div>Ultima actividad: {ag.lastActive}</div>
                {ag.currentTask && <div style={{ color: "#3b82f6", marginTop: 4 }}>Actual: {ag.currentTask}</div>}
                {agActive && <div style={{ color: "#3b82f6", marginTop: 2 }}>Tarea: {agActive.title}</div>}
              </div>
              {agTasks.length > 0 && <div style={{ marginTop: 8 }}><ProgressBar value={agTasks.length > 0 ? (agDone / agTasks.length) * 100 : 0} color="#6366f1" /></div>}
            </Card>
          );
        })}
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nuevo Agente">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input value={newAgent.name} onChange={v => setNewAgent({ ...newAgent, name: v })} placeholder="Nombre (ej: flashcards-backend)" />
          <Input value={newAgent.role} onChange={v => setNewAgent({ ...newAgent, role: v })} placeholder="Rol (ej: Backend Dev, Tester)" />
          <Button onClick={addAgent}>Registrar Agente</Button>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// CHANGELOG
// ============================================================
function ChangelogPanel({ state, dispatch }) {
  const [showAdd, setShowAdd] = useState(false);
  const [entry, setEntry] = useState({ action: "", agent: "", type: "feature", details: "" });
  const typeColors = { feature: "#22c55e", fix: "#f59e0b", refactor: "#3b82f6", setup: "#8b5cf6", task: "#6366f1", move: "#94a3b8", agent: "#22c55e", docs: "#06b6d4", security: "#ef4444" };

  const addEntry = () => {
    if (!entry.action.trim()) return;
    dispatch({ type: "ADD_CHANGELOG", payload: { id: `cl-${Date.now()}`, date: new Date().toISOString().slice(0, 10), agent: entry.agent || "Petrick", action: entry.action, type: entry.type, details: entry.details } });
    setEntry({ action: "", agent: "", type: "feature", details: "" });
    setShowAdd(false);
  };

  return (
    <div>
      <SectionTitle icon={GitBranch} action={<Button onClick={() => setShowAdd(true)} size="sm"><Plus size={14} /> Nuevo</Button>}>Changelog</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {state.changelog.map(cl => (
          <Card key={cl.id} style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Badge color={typeColors[cl.type] || "#6c7086"}>{cl.type}</Badge>
                <div>
                  <div style={{ color: "#cdd6f4", fontSize: 14, fontWeight: 600 }}>{cl.action}</div>
                  {cl.details && <div style={{ color: "#6c7086", fontSize: 12, marginTop: 2 }}>{cl.details}</div>}
                </div>
              </div>
              <div style={{ textAlign: "right", whiteSpace: "nowrap", flexShrink: 0 }}>
                <div style={{ color: "#cdd6f4", fontSize: 12 }}>{cl.agent}</div>
                <div style={{ color: "#6c7086", fontSize: 11 }}>{cl.date}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Registrar Cambio">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input value={entry.action} onChange={v => setEntry({ ...entry, action: v })} placeholder="Que se hizo?" />
          <TextArea value={entry.details} onChange={v => setEntry({ ...entry, details: v })} placeholder="Detalles para documentacion" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Select value={entry.type} onChange={v => setEntry({ ...entry, type: v })} options={[{ value: "feature", label: "Feature" }, { value: "fix", label: "Bug Fix" }, { value: "refactor", label: "Refactor" }, { value: "security", label: "Security" }, { value: "docs", label: "Docs" }, { value: "setup", label: "Setup" }]} />
            <Input value={entry.agent} onChange={v => setEntry({ ...entry, agent: v })} placeholder="Agente / Autor" />
          </div>
          <Button onClick={addEntry}>Registrar</Button>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// IDEAS
// ============================================================
function IdeasPanel({ state, dispatch }) {
  const [showAdd, setShowAdd] = useState(false);
  const [idea, setIdea] = useState({ title: "", description: "" });

  const addIdea = () => {
    if (!idea.title.trim()) return;
    dispatch({ type: "ADD_IDEA", payload: { id: `idea-${Date.now()}`, title: idea.title, description: idea.description, votes: 0, status: "new", author: "Petrick" } });
    setIdea({ title: "", description: "" });
    setShowAdd(false);
  };

  return (
    <div>
      <SectionTitle icon={Lightbulb} action={<Button onClick={() => setShowAdd(true)} size="sm"><Plus size={14} /> Nueva Idea</Button>}>Ideas & Backlog</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {state.ideas.map(i => (
          <Card key={i.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#cdd6f4", fontSize: 14, fontWeight: 700 }}>{i.title}</span>
              <button onClick={() => dispatch({ type: "DELETE_IDEA", payload: i.id })} style={{ background: "none", border: "none", color: "#6c7086", cursor: "pointer" }}><Trash2 size={14} /></button>
            </div>
            {i.description && <p style={{ color: "#6c7086", fontSize: 12, margin: "4px 0" }}>{i.description}</p>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ color: "#6c7086", fontSize: 11 }}>by {i.author}</span>
              <Button onClick={() => dispatch({ type: "VOTE_IDEA", payload: i.id })} variant="ghost" size="sm"><Zap size={12} /> {i.votes}</Button>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nueva Idea">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input value={idea.title} onChange={v => setIdea({ ...idea, title: v })} placeholder="Titulo" />
          <TextArea value={idea.description} onChange={v => setIdea({ ...idea, description: v })} placeholder="Descripcion" rows={4} />
          <Button onClick={addIdea}>Agregar</Button>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// MEMORIA PERSISTENTE
// ============================================================
function MemoryPanel({ state, dispatch }) {
  const [showAdd, setShowAdd] = useState(false);
  const [mem, setMem] = useState({ key: "", value: "", category: "decision" });
  const catColors = { decision: "#6366f1", learning: "#22c55e", context: "#f59e0b", pattern: "#3b82f6", warning: "#ef4444" };

  const addMem = () => {
    if (!mem.key.trim()) return;
    dispatch({ type: "ADD_MEMORY", payload: { id: `mem-${Date.now()}`, key: mem.key, value: mem.value, category: mem.category, date: new Date().toISOString().slice(0, 10) } });
    setMem({ key: "", value: "", category: "decision" });
    setShowAdd(false);
  };

  return (
    <div>
      <SectionTitle icon={Brain} action={<Button onClick={() => setShowAdd(true)} size="sm"><Plus size={14} /> Nuevo</Button>}>Memoria Persistente</SectionTitle>
      <p style={{ color: "#6c7086", fontSize: 12, marginBottom: 16 }}>Decisiones, aprendizajes y contexto que los agentes deben recordar entre sesiones.</p>
      {["decision", "learning", "context", "pattern", "warning"].map(cat => {
        const items = state.memory.filter(m => m.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><Badge color={catColors[cat]}>{cat.toUpperCase()}</Badge><span style={{ color: "#6c7086", fontSize: 11 }}>{items.length}</span></div>
            {items.map(m => (
              <Card key={m.id} style={{ marginBottom: 6, padding: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#cdd6f4", fontWeight: 700, fontSize: 13 }}>{m.key}</span>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <span style={{ color: "#6c7086", fontSize: 11 }}>{m.date}</span>
                    <button onClick={() => dispatch({ type: "DELETE_MEMORY", payload: m.id })} style={{ background: "none", border: "none", color: "#6c7086", cursor: "pointer" }}><Trash2 size={12} /></button>
                  </div>
                </div>
                <div style={{ color: "#a6adc8", fontSize: 12, marginTop: 4 }}>{m.value}</div>
              </Card>
            ))}
          </div>
        );
      })}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nuevo Registro">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input value={mem.key} onChange={v => setMem({ ...mem, key: v })} placeholder="Titulo" />
          <TextArea value={mem.value} onChange={v => setMem({ ...mem, value: v })} placeholder="Contenido" rows={4} />
          <Select value={mem.category} onChange={v => setMem({ ...mem, category: v })} options={[{ value: "decision", label: "Decision" }, { value: "learning", label: "Aprendizaje" }, { value: "context", label: "Contexto" }, { value: "pattern", label: "Patron" }, { value: "warning", label: "Advertencia" }]} />
          <Button onClick={addMem}>Guardar</Button>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// CHECKPOINTS
// ============================================================
function CheckpointsPanel({ state, dispatch }) {
  const [showAdd, setShowAdd] = useState(false);
  const [cp, setCp] = useState({ agent: "", summary: "" });

  const addCheckpoint = () => {
    if (!cp.summary.trim()) return;
    dispatch({ type: "ADD_CHECKPOINT", payload: { id: `cp-${Date.now()}`, sessionId: `SES-${String(state.checkpoints.length + 1).padStart(3, "0")}`, date: new Date().toISOString().slice(0, 10), agent: cp.agent || "Petrick", summary: cp.summary, status: "completed" } });
    setCp({ agent: "", summary: "" });
    setShowAdd(false);
  };

  return (
    <div>
      <SectionTitle icon={Flag} action={<Button onClick={() => setShowAdd(true)} size="sm"><Plus size={14} /> Nuevo</Button>}>Checkpoints</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {state.checkpoints.map(c => (
          <Card key={c.id} style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}><Badge color="#6366f1">{c.sessionId}</Badge><span style={{ color: "#cdd6f4", fontSize: 14, fontWeight: 600 }}>{c.summary}</span></div>
              <div style={{ textAlign: "right" }}><div style={{ color: "#cdd6f4", fontSize: 12 }}>{c.agent}</div><div style={{ color: "#6c7086", fontSize: 11 }}>{c.date}</div></div>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nuevo Checkpoint">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input value={cp.agent} onChange={v => setCp({ ...cp, agent: v })} placeholder="Agente / Autor" />
          <TextArea value={cp.summary} onChange={v => setCp({ ...cp, summary: v })} placeholder="Resumen de la sesion" rows={4} />
          <Button onClick={addCheckpoint}>Crear Checkpoint</Button>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// DOCS
// ============================================================
function DocsPanel({ state, dispatch }) {
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: "", category: "general", content: "" });
  const catColors = { architecture: "#6366f1", conventions: "#22c55e", api: "#3b82f6", general: "#f59e0b", security: "#ef4444" };

  const startEdit = (doc) => { setSelected(doc); setEditContent(doc.content); setEditing(true); };
  const saveEdit = () => {
    dispatch({ type: "UPDATE_DOC", payload: { id: selected.id, content: editContent, lastUpdated: new Date().toISOString().slice(0, 10) } });
    setEditing(false);
  };
  const addDoc = () => {
    if (!newDoc.title.trim()) return;
    dispatch({ type: "ADD_DOC", payload: { id: `doc-${Date.now()}`, ...newDoc, lastUpdated: new Date().toISOString().slice(0, 10) } });
    setNewDoc({ title: "", category: "general", content: "" });
    setShowAdd(false);
  };

  return (
    <div>
      <SectionTitle icon={BookOpen} action={<Button onClick={() => setShowAdd(true)} size="sm"><Plus size={14} /> Nuevo Doc</Button>}>Documentacion</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {state.docs.map(doc => (
          <Card key={doc.id} onClick={() => { setSelected(doc); setEditing(false); }} style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><Badge color={catColors[doc.category] || "#6c7086"}>{doc.category}</Badge><span style={{ color: "#6c7086", fontSize: 11 }}>{doc.lastUpdated}</span></div>
            <div style={{ color: "#cdd6f4", fontWeight: 700, fontSize: 14 }}>{doc.title}</div>
            <div style={{ color: "#6c7086", fontSize: 12, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.content.slice(0, 80)}...</div>
          </Card>
        ))}
      </div>
      <Modal open={!!selected && !editing} onClose={() => setSelected(null)} title={selected?.title || ""}>
        <Badge color={catColors[selected?.category]}>{selected?.category}</Badge>
        <pre style={{ color: "#cdd6f4", fontSize: 13, whiteSpace: "pre-wrap", marginTop: 12, background: "#181825", padding: 12, borderRadius: 8, maxHeight: 400, overflow: "auto" }}>{selected?.content}</pre>
        <div style={{ marginTop: 12 }}><Button onClick={() => startEdit(selected)}><Edit3 size={14} /> Editar</Button></div>
      </Modal>
      <Modal open={editing} onClose={() => setEditing(false)} title={`Editando: ${selected?.title}`}>
        <TextArea value={editContent} onChange={setEditContent} rows={15} />
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}><Button onClick={saveEdit}><Save size={14} /> Guardar</Button><Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button></div>
      </Modal>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nuevo Documento">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input value={newDoc.title} onChange={v => setNewDoc({ ...newDoc, title: v })} placeholder="Titulo" />
          <Select value={newDoc.category} onChange={v => setNewDoc({ ...newDoc, category: v })} options={[{ value: "architecture", label: "Arquitectura" }, { value: "conventions", label: "Convenciones" }, { value: "api", label: "API" }, { value: "security", label: "Seguridad" }, { value: "general", label: "General" }]} />
          <TextArea value={newDoc.content} onChange={v => setNewDoc({ ...newDoc, content: v })} placeholder="Contenido..." rows={8} />
          <Button onClick={addDoc}>Crear</Button>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function AgentCommandCenter() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    { key: "dashboard", label: "Panel", icon: BarChart3 },
    { key: "tasks", label: "Tareas", icon: Target },
    { key: "roadmap", label: "Roadmap", icon: Map },
    { key: "agents", label: "Agentes", icon: Users },
    { key: "changelog", label: "Changelog", icon: GitBranch },
    { key: "ideas", label: "Ideas", icon: Lightbulb },
    { key: "memory", label: "Memoria", icon: Brain },
    { key: "checkpoints", label: "Checkpoints", icon: Flag },
    { key: "docs", label: "Docs", icon: BookOpen },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardPanel state={state} />;
      case "tasks": return <TasksPanel state={state} dispatch={dispatch} />;
      case "roadmap": return <RoadmapPanel state={state} dispatch={dispatch} />;
      case "agents": return <AgentsPanel state={state} dispatch={dispatch} />;
      case "changelog": return <ChangelogPanel state={state} dispatch={dispatch} />;
      case "ideas": return <IdeasPanel state={state} dispatch={dispatch} />;
      case "memory": return <MemoryPanel state={state} dispatch={dispatch} />;
      case "checkpoints": return <CheckpointsPanel state={state} dispatch={dispatch} />;
      case "docs": return <DocsPanel state={state} dispatch={dispatch} />;
      default: return null;
    }
  };

  return (
    <div style={{ background: "#11111b", color: "#cdd6f4", minHeight: "100vh", fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>
      <div style={{ background: "#1e1e2e", borderBottom: "1px solid #313244", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "#6366f1", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={20} color="#fff" /></div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#cdd6f4" }}>Central de Comando — Axon v4.5</h1>
            <span style={{ fontSize: 11, color: "#6c7086" }}>Medical Education Platform | 13 Agentes | Matraca130</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Badge color="#22c55e">{state.agents.filter(a => a.status === "active").length} activos</Badge>
          <Badge color="#6366f1">{state.tasks.filter(t => t.status === "in-progress").length} en progreso</Badge>
        </div>
      </div>
      <div style={{ background: "#1e1e2e", borderBottom: "1px solid #313244", padding: "0 24px", display: "flex", gap: 2, overflowX: "auto" }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ background: activeTab === tab.key ? "#6366f122" : "transparent", color: activeTab === tab.key ? "#6366f1" : "#6c7086", border: "none", borderBottom: activeTab === tab.key ? "2px solid #6366f1" : "2px solid transparent", padding: "10px 12px", display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500, whiteSpace: "nowrap" }}>
            <tab.icon size={14} />{tab.label}
          </button>
        ))}
      </div>
      <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>{renderTab()}</div>
    </div>
  );
}
