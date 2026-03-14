# Axon v4.5 - Platform Context

> **Proposito:** Pega este archivo al inicio de cada sesion de Figma Make para dar contexto completo.
>
> **Ultima actualizacion:** 2026-03-14 (audit pass 2)

---

## 1. Arquitectura General

```
Frontend (React 18 + Vite + Tailwind v4)
  ├── Deploy: Vercel
  ├── Repo: Matraca130/numero1_sseki_2325_55
  └── Llama al backend via apiCall() en lib/api.ts
        |
        v
Backend (Hono Edge Function en Deno)
  ├── Deploy: Supabase Edge Functions
  ├── Repo: Matraca130/axon-backend
  └── Conecta a Supabase via service_role key (admin) o anon key + JWT (user)
        |
        v
Supabase PostgreSQL
  ├── Project ID: xdnciktarvxyhkrokbng
  └── ~50+ tablas reales + ~25 kv_store_* basura de Figma Make
```

## 2. Autenticacion (Doble Token)

Todas las requests del frontend al backend llevan:

```
Authorization: Bearer <SUPABASE_ANON_KEY>   <- Identifica el proyecto
X-Access-Token: <USER_JWT>                  <- Identifica al usuario
```

`authenticate()` en `db.ts` decodifica el JWT localmente (~0.1ms).
La verificacion criptografica real la hace PostgREST en la primera query DB.

> **Riesgo residual:** Rutas que llaman APIs externas (Gemini/OpenAI, Mux) SIN
> hacer query a la DB primero NO validan el JWT criptograficamente.
> Para esas rutas, siempre hacer una query canary primero. Ver PF-05.

**IMPORTANTE:** El rol del usuario NO esta en el JWT. Viene de `GET /institutions`.
Un usuario puede tener diferentes roles en diferentes instituciones.

## 3. Roles y Acceso

4 roles con jerarquia estricta (definidos en `auth-helpers.ts`):

| Rol | Nivel | Acceso |
|---|---|---|
| `owner` | 4 | Acceso total a la institucion. Puede asignar cualquier rol. |
| `admin` | 3 | Gestiona institucion, miembros, contenido. NO puede asignar owners. |
| `professor` | 2 | Gestiona cursos y contenido asignado. Puede asignar professors y students. |
| `student` | 1 | Ve contenido de sus cursos. Solo puede asignar students. |

Controlado por:
- `memberships` tabla (user_id + institution_id + role + is_active)
- `requireInstitutionRole()` en auth-helpers.ts (fail-closed)
- `canAssignRole()` previene escalacion de privilegios
- Multi-tenancy: todo filtrado por `institution_id`

**Sets de roles pre-definidos:**
- `ALL_ROLES` — cualquier miembro activo
- `MANAGEMENT_ROLES` — owner, admin
- `CONTENT_WRITE_ROLES` — owner, admin, professor

## 4. Jerarquia de Datos

```
Institution
  └── Course
        └── Semester
              └── Section
                    └── Topic
                          └── Summary (institution_id denormalized, pdf_source_url, pdf_page_start/end)
                                ├── Chunks (fragmentos + embeddings 1536d)
                                ├── Keywords (conceptos clave)
                                │     ├── Flashcards
                                │     ├── Quiz Questions → Quizzes
                                │     ├── Keyword Connections
                                │     ├── Subtopics (max 6 por keyword)
                                │     └── Prof Notes (kw_prof_notes)
                                ├── Videos (Mux)
                                └── Student Data (kw_student_notes, text_annotations, video_notes, reading_states)
```

## 5. Backend - Patrones Clave

### Rutas
- **Planas con query params**, nunca REST anidadas
- Ejemplo: `GET /topics?section_id=xxx` (no `/sections/xxx/topics`)
- `crud-factory.ts` genera 5 endpoints por entidad (LIST, GET, POST, PUT, DELETE)
- 8 modulos split + 6 archivos flat, ~200+ endpoints totales

### Modulos de Rutas (8 split + 6 flat)

| # | Modulo | Archivos | Proposito |
|---|---|---|---|
| 1 | `routes/content/` | 8 | Jerarquia de contenido (courses→subtopics, keyword-search, connections, reorder, content-tree, flashcards-by-topic) |
| 2 | `routes/study/` | 6 | Sesiones, reviews, progreso, spaced-rep, batch-review |
| 3 | `routes/ai/` | 12 | AI/RAG: generate, generate-smart, pre-generate, report, chat, ingest, analytics |
| 4 | `routes/members/` | 4 | Instituciones, memberships, admin-scopes |
| 5 | `routes/mux/` | 5 | Video (upload, playback, tracking, webhook) |
| 6 | `routes/plans/` | 5 | Planes, AI generations, diagnostics, access |
| 7 | `routes/search/` | 4 | Busqueda global, trash, restore |
| 8 | `routes/gamification/` | 5 | XP, badges, streaks, goals, leaderboard |

| # | Archivo flat | Proposito |
|---|---|---|
| 1 | `routes-auth.ts` | Auth & profiles |
| 2 | `routes-billing.ts` | Stripe (checkout, portal, webhooks) |
| 3 | `routes-models.ts` | 3D models, pins, notes |
| 4 | `routes-storage.ts` | File upload/download/delete |
| 5 | `routes-student.ts` | Student instruments & notes |
| 6 | `routes-study-queue.ts` | Study queue algorithm |

### Archivos de Infraestructura Clave

| Archivo | Proposito |
|---|---|
| `db.ts` | Supabase clients, JWT auth, response helpers |
| `crud-factory.ts` | Generic CRUD route generator |
| `validate.ts` | Runtime validation guards |
| `auth-helpers.ts` | Role-based access control |
| `gemini.ts` | Gemini API helpers + GENERATE_MODEL constant |
| `openai-embeddings.ts` | OpenAI embeddings (1536d) — post-migration |
| `retrieval-strategies.ts` | Multi-Query, HyDE, Re-ranking |
| `chunker.ts` | Recursive character chunking engine |
| `semantic-chunker.ts` | Semantic chunking engine |
| `auto-ingest.ts` | Auto-chunking + embedding pipeline |
| `summary-hook.ts` | afterWrite hook for summaries |
| `xp-engine.ts` | XP calculation + level thresholds |
| `xp-hooks.ts` | 8 fire-and-forget XP hooks |
| `streak-engine.ts` | Streak computation |
| `ai-normalizers.ts` | AI response normalization |
| `rate-limit.ts` | 120 req/min sliding window |
| `timing-safe.ts` | Constant-time comparison |

### Formatos de Respuesta

**Rutas CRUD (factory):**
```json
{ "data": { "items": [...], "total": 100, "limit": 20, "offset": 0 } }
```

**Rutas custom:**
```json
{ "data": { ... } }
```

## 6. Sistema de Gamificacion (2026-03-13)

Sistema completo de XP, badges, streaks, y goals.
Ver `GAMIFICATION_MAP.md` en `axon-backend/docs/` para referencia completa.

### Componentes
- **XP Engine** (`xp-engine.ts`): Calcula XP con multiplicadores (streak, on-time, flow zone, variable reward)
- **XP Hooks** (`xp-hooks.ts`): 8 hooks fire-and-forget + `streak_daily` inline
- **Badges** (`badges.ts`): 39 badges (19 criteria + 20 COUNT-based), evaluacion en 2 fases
- **Streaks** (`streak.ts`): Check-in diario, freeze (3 max), repair
- **Goals** (`goals.ts`): Daily goal configurable (5-120 min), completion tracking
- **Profile** (`profile.ts`): XP history, leaderboard, student stats

### XP Actions (11 total)
| Accion | XP Base |
|---|---|
| `review_flashcard` | 5 |
| `review_correct` (grade ≥3) | 10 |
| `quiz_answer` | 5 |
| `quiz_correct` | 15 |
| `complete_session` | 25 |
| `complete_reading` | 30 |
| `complete_video` | 20 |
| `streak_daily` | 15 |
| `complete_plan_task` | 15 |
| `complete_plan` | 100 |
| `rag_question` | 5 |

Daily cap: 500 XP. Post-cap rate: 10%.

## 7. Base de Datos - Datos Criticos

### Embeddings (¡CAMBIO RECIENTE!)

> **Migracion 20260311_01:** Embeddings migrados de `vector(768)` (Gemini) a `vector(1536)` (OpenAI text-embedding-3-small).
> Archivo: `openai-embeddings.ts` reemplaza `generateEmbedding()` de `gemini.ts` para embeddings.
> Generacion de texto sigue usando Gemini 2.5 Flash.
> HNSW indexes recreados (migration `20260311_02_recreate_hnsw_indexes.sql`).

### Tipos que causan confusion
| Campo | Tipo REAL en DB | NO es |
|---|---|---|
| `priority` | INTEGER (1, 2, 3) | String |
| `difficulty` | INTEGER (1, 2, 3) | String |
| `question_type` | TEXT con CHECK | Enum |
| `daily_goal_minutes` | INTEGER (5-120) | `daily_goal` (renombrado en B-001) |

### Valores validos de `question_type`
`"mcq"`, `"true_false"`, `"fill_blank"`, `"open"`

### `quiz_questions` - Campos reales
`["keyword_id", "question_type", "question", "correct_answer"]`
**NO tiene columna `name`**.

### Campos nullable vs required
- `flashcards.keyword_id`: NULLABLE en DB pero REQUIRED en backend

## 8. Estado Actual del Proyecto

### Bugs conocidos
Ver `KNOWN-BUGS.md` para la lista completa.
- BUG-002 (JWT): Mitigado por PostgREST, riesgo residual en rutas sin DB query
- BUG-003 (RLS): Pendiente — parcialmente mitigado (revoke RPC from authenticated, migration `20260312_01`)
- BUG-004 (CORS): **FIXED** (2026-03-06)
- BUG-008 (Reorder): **FIXED**
- BUG-010 (Frontend build roto): **FIXED**

### Nuevas Funcionalidades (post-docs anteriores)

**WhatsApp Integration (2026-03-14):**
- Migracion `20260314_01_whatsapp_tables.sql` — tablas para mensajeria WhatsApp
- Migracion `20260315_01_whatsapp_job_processor_cron.sql` — procesador de jobs con pg_cron
- Estado: Tablas creadas, backend en desarrollo

**PDF Source Tracking (2026-03-10):**
- Migracion `20260310_01_pdf_source_columns.sql` — columnas en summaries para tracking de fuente PDF
- Campos: `pdf_source_url`, `pdf_page_start`, `pdf_page_end`
- Preparacion para Fase 7 (multi-source ingestion)

**RAG Security Hardening (2026-03-11/12):**
- Migracion `20260311_02_rag_security_hardening.sql`
- Migracion `20260312_01_revoke_rpc_from_authenticated.sql` — revoca acceso directo a RPCs sensibles

### RAG Pipeline
- Gemini 2.5 Flash para generacion de texto
- **OpenAI text-embedding-3-small (1536d)** para embeddings (migrado de Gemini 768d)
- rag_hybrid_search() actualizado para vector(1536)
- Fase 6: Multi-Query, HyDE, Re-ranking con Gemini-as-Judge
- Fase 7: PDF source columns preparados
- Fase 8: Generacion adaptativa (NeedScore), quality reports, pre-generacion bulk

### Migraciones
- **52+ archivos SQL** en `supabase/migrations/`
- Incluye: gamificacion, WhatsApp, PDF, RAG security, embedding migration, badge seeds

## 9. Frontend - Cambios Recientes (2026-03-13/14)

### Layout v2 (Responsive)
- Todos los layouts migrados a `layout/RoleShell` v2 (MobileDrawer + auto-close)
- `roles/RoleShell` v1 eliminado (dead code)
- `roles/StudentLayout` v1 eliminado (faltaba providers)

### Auth Consolidation
- `contexts/AuthContext.tsx` bridge eliminado
- Canonical: `context/AuthContext.tsx` (unico `createContext()`)

### lazyRetry
- Nuevo `lazyRetry()` utility en 22 lazy route imports
- Captura errores de chunks stale post-deploy, auto-reload una vez

## 10. Tablas Basura (seguro eliminar)

~25 tablas `kv_store_*` creadas automaticamente por Figma Make. Se pueden dropear sin impacto.

## 11. Tech Stack

### Frontend
- React 18 + TypeScript + Vite 6
- Tailwind CSS v4 + shadcn/ui (Radix UI) + Lucide icons
- React Router v7 (data mode) + React Query v5
- Motion, TipTap, Three.js, Mux Player, @floating-ui/react, Sonner
- Deploy: Vercel

### Backend
- Hono + Deno (Supabase Edge Functions)
- Supabase PostgreSQL + pgvector
- **Gemini 2.5 Flash** (text generation) + **OpenAI text-embedding-3-small** (1536d embeddings)
- Stripe (billing), Mux (video)
- GitHub Actions CI/CD
