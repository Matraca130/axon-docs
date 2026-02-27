# Axon v4.4 - API Route Map

> Mapa de rutas del backend y su estado de conexion con el frontend.
>
> **Ultima actualizacion:** 2026-02-27
>
> **NOTA:** Este documento esta INCOMPLETO. Necesitamos ejecutar un grep en el backend para obtener las ~176 rutas exactas. Lo documentado aqui es lo que conocemos hasta ahora.

---

## Patrones del Backend

### Base URL
```
Produccion: https://axon-backend.deno.dev (o similar)
Local:      http://localhost:8000
```

### Headers requeridos
```
Authorization: Bearer <SUPABASE_ANON_KEY>
X-Access-Token: <USER_JWT>
Content-Type: application/json
```

### Formato de rutas
- Planas con query params: `GET /topics?section_id=xxx`
- NUNCA anidadas: ~~`GET /sections/xxx/topics`~~

---

## Modulos de Rutas (12 archivos)

| # | Archivo | Entidades | Tipo |
|---|---|---|---|
| 1 | `routes-institutions.ts` | institutions | CRUD factory |
| 2 | `routes-courses.ts` | courses | CRUD factory |
| 3 | `routes-semesters.ts` | semesters | CRUD factory |
| 4 | `routes-sections.ts` | sections | CRUD factory |
| 5 | `routes-topics.ts` | topics | CRUD factory |
| 6 | `routes-summaries.ts` | summaries | CRUD factory |
| 7 | `routes-chunks.ts` | chunks | CRUD factory |
| 8 | `routes-keywords.ts` | keywords | CRUD factory |
| 9 | `routes-flashcards.ts` | flashcards | CRUD factory |
| 10 | `routes-quizzes.ts` | quizzes, quiz_questions | CRUD factory |
| 11 | `routes-videos.ts` | videos | CRUD factory |
| 12 | `routes-mux.ts` | mux webhooks | Custom |

### Rutas custom conocidas (fuera del CRUD factory)

| Ruta | Metodo | Descripcion | Estado Frontend |
|---|---|---|---|
| `/study-queue` | GET | Cola de estudio del usuario | Parcial |
| `/study-sessions` | POST | Crear sesion de estudio | FALTA en platformApi.ts |
| `/study-sessions/:id` | PUT | Actualizar sesion | FALTA en platformApi.ts |
| `/reviews` | POST | Enviar review de estudio | FALTA en platformApi.ts |
| `/content-tree` | GET | Arbol completo de contenido | Conectado |
| `/search` | GET | Busqueda global | Conectado |
| `/reorder` | PUT | Reordenar items | Conectado |
| `/mux/webhook` | POST | Webhook de Mux (video) | N/A (server-to-server) |

---

## CRUD Factory - Endpoints por Entidad

Cada entidad registrada en el factory genera estos 5 endpoints:

```
GET    /{entity}          Lista paginada (query params: limit, offset, filtros)
GET    /{entity}/:id      Obtener uno por ID
POST   /{entity}           Crear nuevo
PUT    /{entity}/:id      Actualizar
DELETE /{entity}/:id      Eliminar
```

### Respuesta de lista (GET /{entity})
```json
{
  "data": {
    "items": [
      { "id": "uuid", "...fields" }
    ],
    "total": 100,
    "limit": 20,
    "offset": 0
  }
}
```

### Respuesta de item (GET /{entity}/:id)
```json
{
  "data": { "id": "uuid", "...fields" }
}
```

### Respuesta custom (rutas no-factory)
```json
{
  "data": [...]
}
```

---

## Estado de Conexion Frontend ↔ Backend

### Conectado (funciona)
- CRUD basico de la mayoria de entidades
- Content tree
- Search
- Reorder

### FALTA conectar (build roto)
- `createStudySession` - No existe en platformApi.ts
- `updateStudySession` - No existe en platformApi.ts  
- `submitReview` - No existe en platformApi.ts

### Desconocido (necesita grep del backend)
- Posiblemente mas rutas custom que no conocemos
- Memberships CRUD
- Plan access rules CRUD
- User profile endpoints

---

## Siguiente Paso

Para completar este documento, ejecutar en el repo `axon-backend`:

```bash
# Listar todas las rutas registradas
grep -rn "\.(get\|post\|put\|delete\|patch)(" src/ --include="*.ts" | sort

# Listar entidades del crud-factory
grep -rn "createCrud\|crudFactory" src/ --include="*.ts"
```

Y en el repo `numero1` (frontend):

```bash
# Listar todas las llamadas API
grep -rn "platformApi\." src/ --include="*.ts" --include="*.tsx" | sort
```

Con ambos outputs podemos cruzar y completar el mapa.
