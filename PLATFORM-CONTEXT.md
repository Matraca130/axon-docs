# Axon v4.4 - Platform Context

> **Proposito:** Pega este archivo al inicio de cada sesion de Figma Make para dar contexto completo.
>
> **Ultima actualizacion:** 2026-02-27

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
  ├── Deploy: Deno Deploy via GitHub Actions
  ├── Repo: Matraca130/axon-backend
  └── Conecta a Supabase via service_role key
        |
        v
Supabase PostgreSQL
  ├── Project ID: xdnciktarvxyhkrokbng
  └── ~60+ tablas (incluye ~25 kv_store_* basura de Figma Make)
```

## 2. Autenticacion (Doble Token)

Todas las requests del frontend al backend llevan:

```
Authorization: Bearer <SUPABASE_ANON_KEY>   <- Identifica el proyecto
X-Access-Token: <USER_JWT>                  <- Identifica al usuario
```

**Bug conocido:** El JWT NO tiene verificacion criptografica en el backend (ver KNOWN-BUGS.md #BUG-002).

## 3. Roles y Acceso

| Rol | Nivel | Acceso |
|---|---|---|
| Student | Section | Ve contenido de sus secciones |
| Professor | Course | Gestiona cursos y secciones asignadas |
| Owner/Admin | Institution | Acceso total a la institucion |

Controlado por:
- `memberships` tabla (user_id + institution_id + role)
- `plan_access_rules` tabla (que features tiene cada plan)
- Multi-tenancy filtrado por `institution_id` en todas las queries

## 4. Jerarquia de Datos

```
Institution
  └── Course
        └── Semester
              └── Section
                    └── Topic
                          └── Summary
                                ├── Chunks (fragmentos de texto)
                                ├── Keywords (conceptos clave)
                                │     ├── Flashcards
                                │     ├── Quiz Questions
                                │     └── Videos
                                └── (content derivado)
```

## 5. Backend - Patrones Clave

### Rutas
- **Planas con query params**, nunca REST anidadas
- Ejemplo: `GET /topics?section_id=xxx` (no `/sections/xxx/topics`)
- Usa `crud-factory.ts` que genera CRUD automatico (5 endpoints por entidad)
- 12 modulos de rutas, ~176 endpoints totales

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
  "data": [...]
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
- Ambos modulos Quiz y Flashcards usan `ensureGeneralKeyword`

## 7. Estado Actual del Proyecto

### Build Status: ROTO
Faltan estas funciones en `platformApi.ts`:
- `createStudySession`
- `updateStudySession`
- `submitReview`

### Hotfixes Pendientes
- HF-D: (pendiente)
- HF-B: (pendiente)

### Queries Pendientes en Supabase SQL Editor
- Query 2: Constraints (CHECK, UNIQUE, FK, PK)
- Query 3: Estado de RLS, policies e indices

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
