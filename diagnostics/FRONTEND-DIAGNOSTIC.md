# Diagnostico Frontend — Axon v4.4

> **Fecha:** 2026-02-28 | **Analista:** Claude (Architect)  
> **Repo:** `Matraca130/numero1_sseki_2325_55`  
> **Commit analizado:** `c4c1a5d`  
> **Archivos leidos:** ~80 archivos (todos los archivos de logica, tipos, rutas, contextos, servicios, hooks, y muestreo de componentes)  
> **Metodo:** Lectura linea por linea de todo archivo < 30KB; listado de directorio para el resto.

---

## Resumen Ejecutivo

El frontend tiene una **arquitectura ambiciosa y bien intencionada** — code splitting por rol, lazy loading, separation of concerns con contexts, y un buen sistema de UI con Radix/ShadCN. Sin embargo, tiene **deuda tecnica acumulada significativa**: directorios duplicados, capas de API redundantes, datos mock hardcodeados que coexisten con la API real, y archivos de documentacion incrustados como `.tsx`. El path a millones de usuarios requiere resolver estas fricciones antes de escalar.

**Nota:** Muchos de estos hallazgos son consecuencia natural del desarrollo rapido con AI (Figma Make). No son errores de diseno — son deuda tecnica acumulada que se debe resolver sistematicamente.

---

## Scorecard

| Dimension | Grado | Notas |
|-----------|-------|-------|
| **Arquitectura** | B- | Buena separacion por rol, pero duplicaciones severas |
| **Seguridad** | C | ANON_KEY hardcodeado, console.log en prod, sin ErrorBoundary |
| **Performance** | C+ | Code splitting existe pero es inconsistente; no hay cache |
| **Mantenibilidad** | C | Directorios duplicados, 3 archivos .tsx de docs, types incoherentes |
| **Calidad de Tipos** | C- | `any` masivo en contexts y API responses |
| **Bundle** | B- | manualChunks configurado pero MUI + Three.js inflados |
| **Escalabilidad** | B | Patron de roles escalable, pero API layer es monolito |

**Promedio Ponderado: C+/B-**

---

## Hallazgos Detallados

### CRITICOS (Bloquean escalabilidad)

---

#### F-001: Directorios duplicados `context/` vs `contexts/`

**Severidad:** CRITICA  
**Archivos:**
```
src/app/context/AuthContext.tsx      <- 495 bytes, STUB (re-export?)
src/app/contexts/AuthContext.tsx     <- 16KB, REAL implementation
src/app/context/AppContext.tsx       <- 4.5KB
src/app/context/ContentTreeContext.tsx <- 8.4KB
src/app/context/PlatformDataContext.tsx <- 10KB
src/app/context/StudentDataContext.tsx <- 7.3KB
```

**Problema:** Dos directorios para el mismo proposito. `context/AuthContext.tsx` (495 bytes) es probablemente un re-export del real en `contexts/AuthContext.tsx` (16KB). Esto causa:
- Confusión para cualquier developer
- Import paths inconsistentes (`@/app/context/AuthContext` vs `@/app/contexts/AuthContext`)
- PlatformDataContext importa de `@/app/context/AuthContext` (el stub)
- El real AuthContext vive en `contexts/`

**Fix:** Consolidar TODO en `context/` (singular). Mover el AuthContext real ahi y eliminar `contexts/`.

---

#### F-002: Triple capa de API redundante

**Severidad:** CRITICA  
**Archivos:**
```
src/app/lib/api.ts           <- apiCall() + ANON_KEY + token management
src/app/services/apiConfig.ts <- realRequest() + figmaRequest() + ApiError class
src/app/services/platformApi.ts <- 26KB monolito que usa realRequest()
```

**Problema:** Hay DOS implementaciones del mismo request wrapper:

| Feature | lib/api.ts `apiCall()` | services/apiConfig.ts `realRequest()` |
|---------|----------------------|--------------------------------------|
| Builds headers | Si | Si (duplicado) |
| Unwraps `{ data }` | Si | Si (duplicado) |
| Logs to console | Si | Si (duplicado) |
| Error handling | `throw new Error()` | `throw new ApiError()` |
| Token source | Module variable | Module variable + localStorage |

Ademas, `getAdminStudents()` en platformApi.ts **bypassa ambas** y hace su propio `fetch()` con headers manuales (linea ~350).

**Fix:** Un unico `apiClient.ts` con:
- Una sola funcion `request<T>()`
- Una sola clase de error
- Una sola fuente de token
- Eliminar `apiConfig.ts`, renombrar `api.ts` a `apiClient.ts`

---

#### F-003: ANON_KEY hardcodeado en codigo fuente

**Severidad:** CRITICA (seguridad)  
**Archivo:** `src/app/lib/api.ts:3`

```typescript
export const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Problema:** La Supabase ANON_KEY esta hardcodeada en el source code. Si bien es una key publica (anon), la best practice es usar variables de entorno:
- Permite rotar keys sin re-deploy
- Permite diferentes keys por environment (dev/staging/prod)
- `import.meta.env.VITE_SUPABASE_ANON_KEY` ya esta soportado por Vite

**Nota:** La API_BASE URL tambien esta hardcodeada. Misma solucion.

**Fix:** Mover a `.env` y usar `import.meta.env.VITE_*`.

---

#### F-004: 95KB de datos mock en `data/` coexistiendo con API real

**Severidad:** CRITICA (bundle + confusión)  
**Directorio:** `src/app/data/`

```
courses.ts       41,777 bytes   <- Mock data masivo
studyContent.ts  33,454 bytes   <- Mock data masivo  
keywords.ts      11,678 bytes   <- Mock data
sectionImages.ts  6,303 bytes   <- Hardcoded URLs
lessonData.ts     1,933 bytes   <- Mock data
```

**Total: ~95KB de datos mock** que se incluyen en el bundle de produccion.

Ademas, `types/content.ts` exporta un array `courses` con datos stub, Y `types/legacy-stubs.ts` TAMBIEN exporta un array `courses` vacio. Dos simbolos identicos, importados desde distintos archivos por distintos componentes.

`AppContext.tsx` todavia hace:
```typescript
import { Course, Topic, courses } from '@/app/types/content';
const [currentCourse, setCurrentCourse] = useState<Course>(courses[0]);
```

Esto significa que el AppContext depende de datos mock hardcodeados.

**Fix:**
1. Eliminar `src/app/data/` completo
2. Unificar `content.ts` y `legacy-stubs.ts` en un solo archivo de tipos sin datos
3. AppContext debe leer del ContentTreeContext (datos reales) o tener un estado null

---

#### F-005: Archivos de documentacion como `.tsx` (62KB muertos)

**Severidad:** CRITICA (bundle)  
**Archivos:**
```
src/app/DEVELOPER_CONTRACT.tsx       13,644 bytes
src/app/PARALLEL_READINESS_AUDIT.tsx 30,539 bytes
src/app/STUDENT_VIEW_CONTRACT.tsx    18,333 bytes
```

**Total: 62KB** de archivos `.tsx` que no son componentes React. Son documentacion en formato de comentarios/objetos TypeScript.

**Problema:**
- Se incluyen en el bundle de produccion (Vite los procesa como modulos)
- Confunden el tree del proyecto
- No son importados por nada — dead code puro

**Fix:** Mover contenido util a `axon-docs/` y eliminar del repo frontend.

---

#### F-006: Sin ErrorBoundary

**Severidad:** CRITICA  

**Problema:** No hay ningun `ErrorBoundary` en la aplicacion. Con lazy loading y code splitting, si un chunk falla al cargar (red lenta, deploy en curso), toda la aplicacion crashea con pantalla blanca.

**Fix:**
```typescript
// components/shared/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return <ErrorFallback error={this.state.error} />;
    return this.props.children;
  }
}
```

Colocar:
1. Uno global en `App.tsx` (atrapa crasheos criticos)
2. Uno por lazy route (permite recovery sin perder la sesion)

---

### ALTOS (Afectan calidad y performance)

---

#### F-007: `any` masivo en API layer y contexts

**Severidad:** ALTA  
**Archivos:** `platformApi.ts`, `studentApi.ts`, `PlatformDataContext.tsx`, `StudentDataContext.tsx`, `AuthContext.tsx`

Ejemplos:
```typescript
// AuthContext.tsx
const data = await apiCall<any>('/me');              // line ~130
const data = await apiCall<any>('/institutions');     // line ~145

// platformApi.ts  
export async function toggleStudentStatus(...): Promise<any>  // line ~370
export async function changeStudentPlan(...): Promise<any>    // line ~380

// PlatformDataContext.tsx
catch (err: any)   // 8 occurrences
```

**Impacto:** 
- Zero type safety en las respuestas del backend
- Bugs silenciosos cuando el backend cambia un campo
- Imposible refactorizar con confianza

**Fix:** Crear tipos de respuesta que matcheen la API real. El backend tiene `shared-types.ts` — el frontend debe tener un mirror exacto.

---

#### F-008: console.log en cada API call (produccion)

**Severidad:** ALTA  
**Archivos:** `lib/api.ts`, `services/apiConfig.ts`

```typescript
console.log(`[API] ${options.method || 'GET'} ${path}`);
console.log(`[FigmaAPI] ${options.method || 'GET'} ${path}`);
console.log(`[Auth] Profile loaded: ${u.email}`);
console.log(`[Auth] ${mapped.length} institution(s) loaded`);
```

**Problema:** En produccion, cada interaccion del usuario genera decenas de console.log. Esto:
- Expone informacion sensible (emails, IDs) en la consola del usuario
- Puede afectar performance en loops de rendering
- No es filtrable (no usa log levels)

**Fix:** Crear un logger con niveles:
```typescript
const logger = {
  debug: import.meta.env.DEV ? console.log : () => {},
  warn: console.warn,
  error: console.error,
};
```

---

#### F-009: platformApi.ts es un monolito de 26KB (750+ lineas)

**Severidad:** ALTA  
**Archivo:** `src/app/services/platformApi.ts`

**Problema:** Un solo archivo con ALL API calls, ALL interfaces, ALL types. Ningun developer va a leer 750 lineas para encontrar la funcion que necesita.

**Fix:** Split por dominio (mirror del backend):
```
services/
  api-client.ts        <- Core request function
  api/
    institutions.ts    <- getInstitutions, createInstitution, etc.
    members.ts         <- getMembers, createMember, etc.
    plans.ts           <- getPlatformPlans, getInstitutionPlans, etc.
    content.ts         <- getCourses, getSummaries, etc.
    flashcards.ts      <- getFlashcards, createFlashcard, etc.
    study.ts           <- submitReview, getBktStates, etc.
    admin.ts           <- getAdminStudents, etc.
```

Alternativa: usar un `crudFactory` en frontend que espeje el del backend:
```typescript
const courses = createApiResource<Course>('courses');
const summaries = createApiResource<Summary>('summaries');
// courses.list({ institution_id: '...' })
// courses.get(id)
// courses.create(data)
```

---

#### F-010: owner-routes.ts no usa lazy() — mata code splitting

**Severidad:** ALTA  
**Archivo:** `src/app/routes/owner-routes.ts`

```typescript
import { PlaceholderPage } from '@/app/components/roles/PlaceholderPage';
import { LayoutDashboard, Building2, Users, ... } from 'lucide-react';

function OwnerDashboardPlaceholder() {
  return React.createElement(PlaceholderPage, { ... });
}
```

**Problema:** Mientras `student-routes.ts` usa `lazy()` para cada ruta (correcto), `owner-routes.ts` importa directamente `PlaceholderPage` y 8 iconos de Lucide. Esto los incluye en el bundle inicial.

Con 8 rutas placeholder, es menor, pero sienta un mal precedente. Cuando se implementen las paginas reales, si no se migra a `lazy()`, el bundle del owner se inflara.

**Fix:** Usar el mismo patron de lazy() que student-routes.ts.

---

#### F-011: node_modules commiteado al repo

**Severidad:** ALTA  
**Path:** `node_modules/` visible en root listing

**Problema:** El directorio `node_modules/` esta commiteado al repositorio Git. Esto:
- Agrega ~500MB+ al repo
- Hace que clones sean lentos
- Conflictos de merge constantes
- Vulnerabilidades no se actualizan

**Fix:** Agregar `node_modules/` a `.gitignore` y `git rm -r --cached node_modules/`.

---

#### F-012: Doble supabase client

**Severidad:** ALTA  
**Archivos:**
```
src/app/lib/supabase.ts           <- 1,210 bytes
src/app/lib/supabase-client.ts    <- 375 bytes
utils/supabase/                   <- directorio adicional
```

**Problema:** Multiples inicializaciones del cliente Supabase. Cada una crea su propia instancia con su propio auth listener. Esto puede causar:
- Race conditions en auth state
- Multiple websocket connections
- Memory leaks

**Fix:** Un unico `supabase.ts` en `lib/`, importado por todos.

---

#### F-013: platformApi.ts.patch vacio

**Severidad:** MEDIA  
**Archivo:** `src/app/services/platformApi.ts.patch` (0 bytes)

**Problema:** Archivo patch vacio commiteado. Indica un proceso de patch manual que quedo incompleto.

**Fix:** Eliminar.

---

### MEDIOS (Deuda tecnica)

---

#### F-014: Sin cache de datos — fetch en cada navegacion

**Severidad:** MEDIA  

**Problema:** ContentTreeContext, PlatformDataContext, y StudentDataContext hacen `fetch` completo cada vez que el componente se monta o la institucion cambia. No hay:
- Stale-while-revalidate
- Cache invalidation selectiva
- Deduplicacion de requests en vuelo

Para 1 usuario esto no importa. Para 10,000 usuarios concurrentes, el backend recibe 6x mas requests de las necesarias.

**Fix ideal:** React Query (TanStack Query) reemplaza los 4 contexts de data:
- Cache automatico con TTL
- Deduplicacion
- Background refetch
- Optimistic updates

**Fix minimo:** Agregar un timestamp de ultima carga y no refetchear si < 30s.

---

#### F-015: Types definidos en 4 lugares diferentes

**Severidad:** MEDIA  
**Archivos con definiciones de tipos:**
```
src/app/types/platform.ts      <- Tipos "canonicos" (platform.ts dice "mirrors shared-types.ts")
src/app/types/content.ts       <- Nested UI types + `courses` array
src/app/types/student.ts       <- Student types
src/app/types/keywords.ts      <- Keyword types
src/app/types/legacy-stubs.ts  <- Stubs con sus propios Course/Topic types
src/app/hooks/flashcard-types.ts <- Flashcard types (en hooks?)
src/app/services/platformApi.ts <- Inline interfaces (AdminStudentListItem, FlashcardCard, etc.)
```

**Problema:** El mismo concepto (ej: `Course`) esta definido en 3 archivos distintos con campos diferentes:

| Archivo | Course type | Tiene data? |
|---------|------------|-------------|
| `types/platform.ts` | `{ id, institution_id, name, description, color, sort_order }` | No |
| `types/content.ts` | `{ id, name, color, accentColor, semesters[] }` (nested) | Si (array `courses`) |
| `types/legacy-stubs.ts` | `{ id, name, color, icon, accentColor, semesters[] }` | Si (array `courses` vacio) |

**Fix:**
1. `types/platform.ts` es la fuente de verdad para tipos que matchean la DB
2. `types/ui.ts` para tipos derivados/nested que solo el UI necesita
3. Eliminar `content.ts` y `legacy-stubs.ts` (mover tipos utiles a `ui.ts`)
4. Mover interfaces inline de `platformApi.ts` a `types/platform.ts`

---

#### F-016: MUI instalado (1MB+) — probablemente infrautilizado

**Severidad:** MEDIA  
**Paquetes:**
```json
"@emotion/react": "11.14.0",
"@emotion/styled": "11.14.1",
"@mui/icons-material": "7.3.5",
"@mui/material": "7.3.5"
```

**Problema:** MUI + Emotion + MUI Icons agrega ~1MB al bundle. Axon ya usa Radix UI + Tailwind + Lucide Icons como sistema de UI primario. MUI probablemente se usa en 1-2 componentes (posiblemente legado de Figma Make).

**Fix:** Grep por `@mui` imports. Si son < 5 componentes, reemplazar con equivalentes Radix/Tailwind y desinstalar MUI.

---

#### F-017: AppContext mantiene estado que deberia estar en URL o Context especifico

**Severidad:** MEDIA  
**Archivo:** `src/app/context/AppContext.tsx`

```typescript
currentCourse, setCurrentCourse       // <- deberia ser route param o ContentTreeContext
currentTopic, setCurrentTopic         // <- deberia ser route param
isSidebarOpen, setSidebarOpen         // <- OK (UI state)
isStudySessionActive, setStudySessionActive  // <- OK
studyPlans, addStudyPlan              // <- deberia venir del backend
quizAutoStart, setQuizAutoStart       // <- OK (preference)
theme, setTheme                       // <- OK
```

**Problema:** `currentCourse` y `currentTopic` son datos de navegacion, no estado global. Deben ser route params (`/student/summary/:topicId`). `studyPlans` deberia venir de la API (ya existe `getStudyPlans()` en platformApi.ts).

**Fix:** Eliminar `currentCourse`, `currentTopic`, y `studyPlans` del AppContext. Usar route params y el API.

---

#### F-018: AuthContext tiene backward-compat surface area excesiva

**Severidad:** MEDIA  
**Archivo:** `src/app/contexts/AuthContext.tsx`

El AuthContextType tiene 20 propiedades, de las cuales 8 son "backward-compat aliases":
```typescript
status, memberships, activeMembership, setActiveMembership,
signIn, signUp, signOut
```

Ademas hay una funcion `toMembership()` que convierte entre formatos.

**Problema:** Doble interfaz = doble area de bugs. Cada nuevo consumer puede usar el nombre viejo o el nuevo inconsistentemente.

**Fix:** Grep por usos de los aliases. Migrar todos a los nombres nuevos. Eliminar aliases.

---

#### F-019: No hay patron de loading/error consistente

**Severidad:** MEDIA  

**Problema:** Cada context maneja loading/error de forma diferente:
- `AuthContext`: `loading: boolean`
- `PlatformDataContext`: `loading: boolean, error: string | null`
- `StudentDataContext`: `loading: boolean, error: string | null, isConnected: boolean`
- `ContentTreeContext`: `loading: boolean, error: string | null`

No hay un componente compartido para mostrar estados de carga o error.

**Fix:** Crear `<AsyncState loading={x} error={y}>` wrapper y hooks `useAsyncData()` que estandaricen.

---

#### F-020: Componentes gigantes sin split

**Severidad:** MEDIA  
**Componentes mas grandes:**
```
KeywordPopup.tsx        36,890 bytes
QuizTaker.tsx           33,019 bytes
FlashcardReviewer.tsx   30,579 bytes
VideoPlayer.tsx         24,941 bytes
sidebar.tsx (UI)        21,663 bytes
DiagnosticsPage.tsx     16,334 bytes
TextHighlighter.tsx     16,021 bytes
QuizResults.tsx         17,151 bytes
FlashcardCard.tsx       13,545 bytes
```

**Problema:** Componentes de 30-36KB son demasiado grandes para mantener, debuggear, o testear. `KeywordPopup.tsx` (36KB) probablemente hace rendering, fetching, y logica de negocio en un solo archivo.

**Fix:** Split en:
```
KeywordPopup/
  index.tsx          <- Orchestrator (state + composition)
  KeywordContent.tsx <- Pure render
  KeywordActions.tsx <- Botones y acciones
  useKeywordData.ts  <- Data fetching hook
```

---

#### F-021: Sin React.memo en componentes pesados de listas

**Severidad:** MEDIA  

**Problema:** `FlashcardCard.tsx`, `KeywordBadges.tsx`, y otros componentes que se renderizan en listas no usan `React.memo()`. Cuando el parent re-renderiza (ej: al actualizar mastery de una card), TODOS los items de la lista se re-renderizan.

**Fix:** Agregar `React.memo()` a todo componente de lista que recibe props estables.

---

### BAJOS (Mejoras opcionales)

---

#### F-022: design-system/ directorio (pendiente de explorar)

Existe `src/app/design-system/` que no se leyo en detalle. Puede tener componentes duplicados con `components/ui/`.

---

#### F-023: lib/ tiene logica de negocio (BKT, FSRS, mastery-helpers)

`src/app/lib/bkt-engine.ts`, `fsrs-engine.ts`, `mastery-helpers.ts` contienen calculos de repeticion espaciada. Estos DUPLICAN logica que existe en el backend (`routes-study-queue.tsx`). Si el algoritmo cambia en el backend, hay que cambiarlo en el frontend tambien.

**Evaluacion:** Depende del caso de uso. Si se necesitan calculos offline/optimistic, es OK. Si no, deberian ser solo rendering de datos que vienen del backend.

---

#### F-024: Hooks bien estructurados pero sin index barrel

`src/app/hooks/` tiene 11 hooks bien nombrados pero sin `index.ts` para re-exportar. Los imports son verbose:
```typescript
import { useFlashcardEngine } from '@/app/hooks/useFlashcardEngine';
import { useStudyPlans } from '@/app/hooks/useStudyPlans';
```

**Fix (opcional):** Agregar `hooks/index.ts` con re-exports.

---

#### F-025: vercel.json present (confirmar config)

`vercel.json` existe y puede tener rewrites para SPA. Confirmar que tiene:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
Sin esto, refresh en rutas como `/student/dashboard` da 404.

---

#### F-026: Three.js importado pero isolado

Three.js esta en `manualChunks` de Vite (correcto), pero `@types/three` esta en `dependencies` en vez de `devDependencies`. Moverlo a devDependencies reduce el metadata del package.

---

#### F-027: services/ tiene 15 archivos API

Hay 15 archivos en `services/` pero muchos son variaciones del mismo patron:
```
platformApi.ts, flashcardApi.ts, quizApi.ts, summariesApi.ts,
studentApi.ts, studentSummariesApi.ts, studySessionApi.ts,
contentTreeApi.ts, models3dApi.ts, keywordManager.ts,
studyQueueApi.ts, aiFlashcardGenerator.ts, aiService.ts,
apiConfig.ts, authApi.ts
```

Bien separados por dominio (esto es bueno), pero sin una capa de abstraccion comun. Cada archivo repite el patron de `request()` con headers.

---

#### F-028: Auth signup hace fetch manual sin usar apiCall

En `AuthContext.tsx`, el signup hace `fetch()` directo:
```typescript
const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
  body: JSON.stringify({ email, password, full_name: fullName }),
});
```

En vez de usar `apiCall()` (que maneja headers y unwrap). Es comprensible porque signup no lleva `X-Access-Token`, pero deberia usar `apiCall()` con una opcion `{ skipAuth: true }`.

---

#### F-029: types/platform.ts dice `sort_order` en Course

```typescript
export interface Course {
  sort_order?: number;  // <-- DB column is actually `order_index`
}
```

Esto contradice `context/04-api-conventions.md` que dice que el nombre real es `order_index`, no `sort_order`. Este bug ya esta documentado en axon-docs, pero el type no se ha corregido.

---

#### F-030: Datos de `StudentDataContext` se cargan EAGERLY para todos los estudiantes

`StudentDataContext` carga profile, stats, courseProgress, dailyActivity, sessions, Y reviews apenas el componente se monta. Para un estudiante con 1000 reviews, esto es mucho data upfront.

**Fix:** Cargar solo profile y stats en mount. Reviews y sessions on-demand cuando el usuario navega a esas vistas.

---

#### F-031: `spacedRepetition.ts` es 16KB de logica compleja

`services/spacedRepetition.ts` tiene 16KB de algoritmos (BKT + FSRS + NeedScore). Este es logica critica de negocio que:
- No tiene tests
- Duplica logica del backend
- Es dificil de debuggear

**Recomendacion:** Si los calculos DEBEN ocurrir en frontend (optimistic UI), extraer a una libreria pura con tests unitarios. Si no, delegar al backend.

---

#### F-032: No hay testing infrastructure

No hay ningun test file en el frontend. Ni `vitest.config.ts`, ni archivos `*.test.tsx`. Para escalar a millones, los componentes criticos (auth flow, study session, review submission) necesitan tests.

---

#### F-033: `data/courses.ts` tiene 41KB de contenido medico hardcodeado

El archivo mas grande del proyecto tiene datos de Anatomia Humana hardcodeados en portugues. Esto es contenido de ejemplo que deberia vivir como seed data en la DB, no en el bundle del frontend.

---

## Plan de Accion

### Fase 1: Limpieza Critica (1-2 sesiones)

| # | Accion | Hallazgos | Riesgo | Esfuerzo |
|---|--------|-----------|--------|----------|
| 1 | Consolidar `context/` + `contexts/` | F-001 | Bajo | 30 min |
| 2 | Unificar API layer en un `apiClient.ts` | F-002, F-028 | Medio | 2 hrs |
| 3 | Mover ANON_KEY + API_BASE a `.env` | F-003 | Bajo | 15 min |
| 4 | Eliminar `data/` completo | F-004, F-033 | Medio | 1 hr |
| 5 | Eliminar 3 archivos .tsx de docs | F-005 | Nulo | 5 min |
| 6 | Eliminar `platformApi.ts.patch` | F-013 | Nulo | 1 min |
| 7 | Agregar ErrorBoundary | F-006 | Bajo | 30 min |
| 8 | Fix `node_modules` en git | F-011 | Bajo | 10 min |

### Fase 2: Calidad de Tipos (1-2 sesiones)

| # | Accion | Hallazgos | Riesgo | Esfuerzo |
|---|--------|-----------|--------|----------|
| 9 | Eliminar `any` en contexts y API | F-007 | Medio | 2 hrs |
| 10 | Consolidar types en `types/platform.ts` + `types/ui.ts` | F-015, F-029 | Medio | 1 hr |
| 11 | Eliminar backward-compat aliases en AuthContext | F-018 | Medio | 1 hr |

### Fase 3: Performance (2-3 sesiones)

| # | Accion | Hallazgos | Riesgo | Esfuerzo |
|---|--------|-----------|--------|----------|
| 12 | Implementar logger con niveles | F-008 | Bajo | 30 min |
| 13 | Split platformApi.ts en modulos | F-009 | Bajo | 1.5 hrs |
| 14 | Lazy() en owner-routes.ts | F-010 | Bajo | 15 min |
| 15 | Evaluar eliminar MUI | F-016 | Medio | 1-3 hrs |
| 16 | Agregar React.memo a componentes de lista | F-021 | Bajo | 1 hr |
| 17 | Lazy load student data (no eager) | F-030 | Medio | 1 hr |

### Fase 4: Escalabilidad (futuro)

| # | Accion | Hallazgos | Riesgo | Esfuerzo |
|---|--------|-----------|--------|----------|
| 18 | Migrar a React Query | F-014 | Alto | 4-6 hrs |
| 19 | Split componentes gigantes | F-020 | Medio | 3-4 hrs |
| 20 | Eliminar navegacion de AppContext | F-017 | Medio | 2 hrs |
| 21 | Setup testing (Vitest) | F-032 | Bajo | 2 hrs |
| 22 | Evaluar logica duplicada frontend/backend | F-023, F-031 | Alto | Evaluacion |
| 23 | Supabase client unico | F-012 | Medio | 30 min |

---

## Diagrama de Arquitectura Actual vs Ideal

### Actual
```
App.tsx
  AuthProvider (contexts/AuthContext.tsx)
    RouterProvider
      AuthLayout
        LoginPage | RequireAuth
          PostLoginRouter | SelectRolePage
          RequireRole
            [Owner|Admin|Professor|Student]Layout
              AppProvider (context/AppContext.tsx) ← usa datos mock
              ContentTreeProvider (context/)
              PlatformDataProvider (context/) ← importa context/AuthContext (stub)
              StudentDataProvider (context/) ← carga todo eagerly
              LazyPageComponents
                ← usan platformApi.ts (26KB monolito)
                ← usan services/xxxApi.ts (15 archivos)
                ← usan lib/api.ts Y services/apiConfig.ts (dual layer)
```

### Ideal
```
App.tsx
  ErrorBoundary (global)
    AuthProvider (context/AuthContext.tsx) ← unico directorio
      RouterProvider
        AuthLayout
          LoginPage | RequireAuth
            PostLoginRouter | SelectRolePage
            RequireRole
              [Role]Layout
                ErrorBoundary (per-role)
                <QueryClientProvider> ← React Query
                  LazyPageComponents
                    ← useQuery() hooks (cache + dedupe)
                    ← apiClient.ts (unica capa)
                    ← types/platform.ts (fuente de verdad)
```

---

## Metricas a Rastrear

| Metrica | Valor Actual (estimado) | Target |
|---------|------------------------|--------|
| Bundle size (gzipped) | ~800KB+ | < 400KB |
| Archivos con `any` | ~25+ | 0 |
| Console.log en prod | ~50+ statements | 0 |
| Directorios duplicados | 2 (`context/` + `contexts/`) | 0 |
| Dead code files | 6 (3 .tsx docs + 5 data files + 1 patch) | 0 |
| Test coverage | 0% | > 30% (flows criticos) |
| Largest component file | 36KB | < 10KB |
| Time to interactive (cold) | Unknown | < 2s |
