# Axon v4.4 - Platform Context

> **Proposito:** Pega este archivo al inicio de cada sesion de Figma Make para dar contexto completo.
>
> **Ultima actualizacion:** 2026-03-06

---

## 1. Arquitectura General

```
Frontend (React 18 + Vite + Tailwind v4)
  ├── Deploy: Vercel
  ├── Repo: Matraca130/numero1_sseki_2325_55
  └── Llama al backend via platformApi.ts
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
  └── ~39 tablas reales + ~25 kv_store_* basura de Figma Make
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
                                │     └── Prof Notes (kw_prof_notes)
                                ├── Videos
                                └── Student Notes (kw_student_notes, text_annotations, video_notes)
```

## 5. Backend - Patrones Clave

### Rutas
- **Planas con query params**, nunca REST anidadas
- Ejemplo: `GET /topics?section_id=xxx` (no `/sections/xxx/topics`)
- `crud-factory.ts` genera 6 endpoints por entidad (LIST, GET, POST, PUT, DELETE, RESTORE)
- 14 modulos de rutas, ~176 endpoints totales

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

## 6. Base de Datos - Datos Criticos

### Tipos que causan confusion
| Campo | Tipo REAL en DB | NO es |
|---|---|---|
| `priority` | INTEGER (1, 2, 3) | String |
| `difficulty` | INTEGER (1, 2, 3) | String |
| `question_type` | TEXT con CHECK | Enum |

### Valores validos de `question_type`
`"mcq"`, `"true_false"`, `"fill_blank"`, `"open"`

### `quiz_questions` - Campos reales
`["keyword_id", "question_type", "question", "correct_answer"]`

**NO tiene columna `name`** (esto causo bugs anteriormente).

### Campos nullable vs required
- `flashcards.keyword_id`: NULLABLE en DB pero REQUIRED en backend

## 7. Estado Actual del Proyecto

### Bugs conocidos
Ver `KNOWN-BUGS.md` para la lista completa.
- BUG-002 (JWT): Mitigado por PostgREST, riesgo residual en rutas sin DB query
- BUG-003 (RLS): Pendiente — se aplicara cuando la app este lista
- BUG-004 (CORS): **FIXED** (2026-03-06)

### RAG Pipeline
- Gemini 2.5 Flash para generacion
- gemini-embedding-001 (768d) para embeddings
- rag_hybrid_search() v3: 1 JOIN + stored tsvector (Fase 1+2 completadas)
- Ver `RAG_ROADMAP.md` en axon-backend para estado completo

## 8. Tablas Basura (seguro eliminar)

~25 tablas `kv_store_*` creadas automaticamente por Figma Make. Se pueden dropear sin impacto.

Tablas huerfanas sin rutas: `model_layers`, `model_parts`.

## 9. Tech Stack Frontend

- React 18
- Vite
- Tailwind CSS v4
- Radix UI (componentes base)
- Lucide React (iconos)
- Supabase JS client (auth)
