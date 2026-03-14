# Axon v4.5 - Platform Context

> **Proposito:** Pega este archivo al inicio de cada sesion de Figma Make para dar contexto completo.
>
> **Ultima actualizacion:** 2026-03-14 (audit pass 3 — verified against source code)

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
| `owner` | 4 | Acceso total a la institucion |
| `admin` | 3 | Gestiona institucion, miembros, contenido |
| `professor` | 2 | Gestiona cursos y contenido asignado |
| `student` | 1 | Ve contenido de sus cursos |

**Sets:** `ALL_ROLES`, `MANAGEMENT_ROLES` (owner, admin), `CONTENT_WRITE_ROLES` (owner, admin, professor)

## 4. Jerarquia de Datos

```
Institution
  └── Course
        └── Semester
              └── Section
                    └── Topic
                          └── Summary (institution_id denorm, pdf_source_url/page_start/page_end)
                                ├── Chunks (embeddings 1536d)
                                ├── Keywords → Subtopics, Flashcards, Quiz Questions, Connections, Prof Notes
                                ├── Videos (Mux)
                                └── Student Data (notes, annotations, reading_states)
```

## 5. Backend - Patrones Clave

### Rutas
- **Planas con query params**, nunca REST anidadas
- `crud-factory.ts` genera 5 endpoints por entidad
- **10 modulos split + 6 archivos flat**, ~200+ endpoints totales

### Modulos de Rutas (10 split + 6 flat)

| # | Modulo | Archivos | Proposito |
|---|---|---|---|
| 1 | `routes/content/` | 8 | Jerarquia de contenido |
| 2 | `routes/study/` | 6 | Sesiones, reviews, progreso, spaced-rep |
| 3 | `routes/ai/` | 12 | AI/RAG: generate, chat, ingest, reports |
| 4 | `routes/members/` | 4 | Instituciones, memberships, admin-scopes |
| 5 | `routes/mux/` | 5 | Video (upload, playback, tracking) |
| 6 | `routes/plans/` | 5 | Planes, AI generations, diagnostics |
| 7 | `routes/search/` | 4 | Busqueda global, trash, restore |
| 8 | `routes/gamification/` | 5 | XP, badges, streaks, goals |
| 9 | `routes/settings/` | ? | Configuracion (NUEVO) |
| 10 | `routes/whatsapp/` | ? | WhatsApp integration (NUEVO) |

| # | Archivo flat | Proposito |
|---|---|---|
| 1 | `routes-auth.ts` | Auth & profiles |
| 2 | `routes-billing.ts` | Stripe |
| 3 | `routes-models.ts` | 3D models |
| 4 | `routes-storage.ts` | File upload/download |
| 5 | `routes-student.ts` | Student instruments |
| 6 | `routes-study-queue.ts` | Study queue algorithm |

### Archivos de Infraestructura

| Archivo | Proposito |
|---|---|
| `db.ts` | Supabase clients, JWT auth, response helpers |
| `crud-factory.ts` | Generic CRUD route generator |
| `validate.ts` | Runtime validation guards |
| `auth-helpers.ts` | Role-based access control |
| `gemini.ts` | Gemini API: text generation + PDF extraction (Fase 7) |
| `openai-embeddings.ts` | OpenAI embeddings (1536d, text-embedding-3-**large**) |
| `retrieval-strategies.ts` | Multi-Query, HyDE, Re-ranking |
| `chunker.ts` + `semantic-chunker.ts` | Chunking engines |
| `auto-ingest.ts` + `summary-hook.ts` | Auto-chunking pipeline |
| `xp-engine.ts` + `xp-hooks.ts` + `streak-engine.ts` | Gamification engines |
| `ai-normalizers.ts` | AI response normalization |
| `rate-limit.ts` | 120 req/min sliding window |
| `timing-safe.ts` | Constant-time comparison |
| `lib/bkt-v4.ts` + `lib/fsrs-v4.ts` | Spaced repetition algorithms |
| `lib/types.ts` | Shared TypeScript types |

### Tests
- **16 archivos de test** en `tests/` (unit + integration)
- Deno-native test runner
- ~183+ test cases

## 6. Sistema de Gamificacion

Ver `GAMIFICATION_MAP.md` en `axon-backend/docs/` para referencia completa.

13 endpoints, 8 hooks (11 actions), 39 badges, daily cap 500 XP, 4 bonus types.

## 7. Base de Datos

### Embeddings (¡VERIFICADO contra codigo fuente!)

> **Modelo:** OpenAI `text-embedding-3-large` (NO small) truncado a 1536d via Matryoshka
> **Archivo:** `openai-embeddings.ts` — constantes `EMBEDDING_MODEL` y `EMBEDDING_DIMENSIONS`
> **Generacion de texto:** Gemini 2.5 Flash (sin cambios, en `gemini.ts`)
> **HNSW indexes:** Recreados para 1536d

### Tipos que causan confusion
| Campo | Tipo REAL | NO es |
|---|---|---|
| `priority` | INTEGER (1, 2, 3) | String |
| `difficulty` | INTEGER (1, 2, 3) | String |
| `question_type` | TEXT | Enum |
| `daily_goal_minutes` | INTEGER (5-120) | `daily_goal` |
| `order_index` | INTEGER | `sort_order` |

## 8. Estado Actual

### Seguridad — ATENCION

> **CORS sigue siendo wildcard `"*"`** en produccion (verificado en `index.ts`).
> Fue restringido brevemente (commit `33eb56e`) pero **revertido** para desarrollo MVP.
> Comentario en index.ts: "MVP: Temporarily reverted to '*' for development flexibility."
> **TODO:** Re-restringir antes de launch.

- BUG-002 (JWT): Mitigado por PostgREST
- BUG-003 (RLS): Parcialmente mitigado (revoke RPC from authenticated)
- BUG-004 (CORS): **NO FIXED — revertido a wildcard para desarrollo**

### RAG Pipeline
- Gemini 2.5 Flash para generacion + PDF extraction (Fase 7)
- **OpenAI text-embedding-3-large (1536d)** para embeddings
- Fase 7: PDF extraction code exists in `gemini.ts` (`extractTextFromPdf()`)
- Fase 8: Smart generation, quality reports, pre-generation

### Migraciones: **52+ archivos SQL**

### Frontend Gamification (mas conectado de lo documentado)
- 8 React Query hooks en `useGamification.ts`
- 7+ componentes: GamificationView, DailyGoalWidget, GamificationCard, StreakPanel, BadgeShowcase, LeaderboardCard, XpHistoryFeed, StudyQueueCard
- Palette migrada a Axon Medical Academy (teal/gray, commit `b7512445`)

## 9. Tech Stack

### Frontend
React 18, TypeScript, Vite 6, Tailwind CSS v4, React Router v7, React Query v5, shadcn/ui, Lucide, Motion, TipTap, Three.js, Mux Player, @floating-ui/react, Sonner. Deploy: Vercel.

### Backend
Hono + Deno (Supabase Edge Functions), PostgreSQL + pgvector, **Gemini 2.5 Flash** (text) + **OpenAI text-embedding-3-large** (1536d embeddings), Stripe, Mux. CI/CD: GitHub Actions.
