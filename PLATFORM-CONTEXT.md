# Axon v4.5 - Platform Context

> **Proposito:** Pega este archivo al inicio de cada sesion de Figma Make para dar contexto completo.
>
> **Ultima actualizacion:** 2026-03-14

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

> **Riesgo residual:** Rutas que llaman APIs externas (Gemini, Mux) SIN
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
                          └── Summary (tiene institution_id denormalizado)
                                ├── Chunks (fragmentos + embeddings 768d)
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
| 8 | `routes/gamification/` | 5 | **NUEVO** XP, badges, streaks, goals, leaderboard |

| # | Archivo flat | Proposito |
|---|---|---|
| 1 | `routes-auth.ts` | Auth & profiles |
| 2 | `routes-billing.ts` | Stripe (checkout, portal, webhooks) |
| 3 | `routes-models.ts` | 3D models, pins, notes |
| 4 | `routes-storage.ts` | File upload/download/delete |
| 5 | `routes-student.ts` | Student instruments & notes |
| 6 | `routes-study-queue.ts` | Study queue algorithm |

> **Nota:** Archivos flat renombrados de `.tsx` a `.ts` (no usan JSX).

### Formatos de Respuesta

**Rutas CRUD (factory):**
```json
{
  "data": {
    "items": [...],
    "total": 100,
    "limit": 20,
    "offset": 0
  }
}
```

**Rutas custom:**
```json
{
  "data": { ... }
}
```

## 6. Sistema de Gamificacion (NUEVO — 2026-03-13)

Sistema completo de XP, badges, streaks, y goals:

### Componentes
- **XP Engine** (`xp-engine.ts`): Calcula XP con multiplicadores (streak, daily goal bonus)
- **XP Hooks** (`xp-hooks.ts`): 11 hooks fire-and-forget en acciones del estudiante
- **Badges** (`badges.ts`): 39 badges (19 criteria + 20 COUNT-based), evaluacion en 2 fases
- **Streaks** (`streak.ts`): Check-in diario, freeze (3 max), repair
- **Goals** (`goals.ts`): Daily goal configurable (5-120 min), completion tracking
- **Profile** (`profile.ts`): XP history, leaderboard, student stats

### Tablas de Gamificacion
`student_stats`, `xp_history`, `badge_definitions`, `student_badges`, `badge_notifications`, `streak_repairs`, `streak_freezes`, `algorithm_config`

### XP Actions (11 total)
| Accion | XP Base |
|---|---|
| Completar review | 10 |
| Completar sesion de estudio | 25 |
| Completar resumen (lectura) | 15 |
| Completar video | 20 |
| Pregunta RAG | 5 |
| Completar task de plan | 15 |
| Completar plan completo | 100 |
| Batch reviews | 10 × N |

## 7. Base de Datos - Datos Criticos

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

**NO tiene columna `name`** (esto causo bugs anteriormente).

### Campos nullable vs required
- `flashcards.keyword_id`: NULLABLE en DB pero REQUIRED en backend

## 8. Estado Actual del Proyecto

### Bugs conocidos
Ver `KNOWN-BUGS.md` para la lista completa.
- BUG-002 (JWT): Mitigado por PostgREST, riesgo residual en rutas sin DB query
- BUG-003 (RLS): Pendiente — se aplicara cuando la app este lista
- BUG-004 (CORS): **FIXED** (2026-03-06)
- BUG-008 (Reorder): **FIXED** — usa `bulk_reorder()` RPC
- BUG-010 (Frontend build roto): **FIXED** — study session APIs conectadas

### Gamificacion
- Sprint 0-2: Backend completo (13 endpoints, 11 XP hooks, 39 badges)
- Sprint 3: Frontend parcialmente conectado (DailyGoalWidget, GamificationCard)
- Auditorias: G-001 a G-015 resueltos, A-001 a A-014 resueltos, B-001 a B-004 resueltos

### RAG Pipeline
- Gemini 2.5 Flash para generacion
- gemini-embedding-001 (768d) para embeddings
- rag_hybrid_search() v3: 1 JOIN + stored tsvector
- Fase 6: Multi-Query, HyDE, Re-ranking con Gemini-as-Judge
- Fase 8: Generacion adaptativa (NeedScore), quality reports, pre-generacion bulk

### Performance Batch Endpoints (NUEVO)
- `GET /keyword-connections-batch?keyword_ids=...` — elimina N+1 (25→1 requests)
- `GET /flashcards-by-topic?topic_id=...` — batch flashcards por topico
- `POST /review-batch` — batch atomico reviews + FSRS + BKT
- `GET /topic-progress?topic_id=...` — summaries + reading states + flashcard counts en 1 request
- `GET /topics-overview?topic_ids=a,b,c` — batch de hasta 50 topics

## 9. Frontend - Cambios Recientes (2026-03-13/14)

### Layout v2 (Responsive)
- Todos los layouts migrados a `layout/RoleShell` v2 (MobileDrawer + auto-close)
- `roles/RoleShell` v1 eliminado (dead code)
- `roles/StudentLayout` v1 eliminado (faltaba providers)

### Auth Consolidation
- `contexts/AuthContext.tsx` bridge eliminado
- Canonical: `context/AuthContext.tsx` (unico `createContext()`)
- 6 consumidores migrados a import singular

### lazyRetry
- Nuevo `lazyRetry()` utility en 22 lazy route imports
- Captura errores de chunks stale post-deploy, auto-reload una vez

## 10. Tablas Basura (seguro eliminar)

~25 tablas `kv_store_*` creadas automaticamente por Figma Make. Se pueden dropear sin impacto.

## 11. Tech Stack

### Frontend
- React 18 + TypeScript + Vite 6
- Tailwind CSS v4 (`@tailwindcss/vite`)
- React Router v7 (data mode, `createBrowserRouter`)
- React Query v5 (TanStack Query) para data fetching
- shadcn/ui (Radix UI) + Lucide icons
- Motion (animaciones)
- TipTap (rich text editor)
- Three.js (3D models)
- Mux Player (video)
- `@floating-ui/react` (popovers)
- Sonner (toasts)
- Deploy: Vercel

### Backend
- Hono + Deno (Supabase Edge Functions)
- Supabase PostgreSQL + pgvector
- Gemini 2.5 Flash + gemini-embedding-001 (768d)
- Stripe (billing)
- Mux (video)
- GitHub Actions CI/CD
