# Practicas Arquitectonicas — Axon v4.4+

> **Proposito:** Reglas estructurales y patrones arquitectonicos para frontend y backend. Complementa `ENGINEERING-PRACTICES.md` (que cubre patrones de codigo) con reglas de **estructura de directorios, composicion de componentes, flujo de datos, y limites de modulo**.
>
> **Audiencia:** Cualquier desarrollador (humano o AI) que toque el codebase.
>
> **Fecha:** 2026-02-28 | **Basado en:** Analisis de `numero1_sseki_2325_55` (80+ archivos) y `axon-backend` (16 archivos)

---

## Tabla de Contenidos

### Parte I — Principios Compartidos
1. [Limites de Modulo](#1-limites-de-modulo)
2. [Flujo de Dependencias](#2-flujo-de-dependencias)
3. [Naming Conventions Unificadas](#3-naming-conventions-unificadas)
4. [Tipos Compartidos — Fuente de Verdad](#4-tipos-compartidos--fuente-de-verdad)

### Parte II — Arquitectura Frontend
5. [Estructura de Directorios](#5-estructura-de-directorios-frontend)
6. [Jerarquia de Componentes](#6-jerarquia-de-componentes)
7. [Estado y Flujo de Datos](#7-estado-y-flujo-de-datos)
8. [Capa de API del Frontend](#8-capa-de-api-del-frontend)
9. [Routing y Code Splitting](#9-routing-y-code-splitting)
10. [Performance Frontend](#10-performance-frontend)
11. [Error Handling Frontend](#11-error-handling-frontend)
12. [Testing Frontend](#12-testing-frontend)

### Parte III — Arquitectura Backend
13. [Estructura de Directorios Backend](#13-estructura-de-directorios-backend)
14. [Patron de Ruta Extendido](#14-patron-de-ruta-extendido)
15. [Middleware Chain](#15-middleware-chain)
16. [Performance Backend](#16-performance-backend)

### Parte IV — Arquitectura de Sistema
17. [Contrato Frontend-Backend](#17-contrato-frontend-backend)
18. [Checklist Arquitectonico](#18-checklist-arquitectonico)

---

# PARTE I — PRINCIPIOS COMPARTIDOS

---

## 1. Limites de Modulo

### 1.1 Regla del Unico Responsable

Cada archivo tiene UNA razon para existir. Si un archivo tiene dos responsabilidades, es candidato a split.

```
// MAL: platformApi.ts (26KB) — tipos + fetch wrapper + 40 funciones API + interfaces inline
// BIEN: Separar en modulos por dominio
```

### 1.2 Regla de Tamanio

| Tipo de archivo | Limite suave | Limite duro | Accion si excede |
|-----------------|-------------|-------------|------------------|
| Componente React | 300 lineas | 500 lineas | Split en sub-componentes |
| Service/API file | 200 lineas | 400 lineas | Split por dominio |
| Hook | 150 lineas | 250 lineas | Extraer sub-hooks |
| Route handler (backend) | 80 lineas | 150 lineas | Extraer logica a helper |
| Archivo de tipos | 200 lineas | Sin limite | Mantener organizado por seccion |
| Context/Provider | 150 lineas | 300 lineas | Extraer logica a hooks |

### 1.3 Regla Anti-Circular

Ningun modulo puede importar de un modulo que directa o indirectamente lo importa a el.

```
// PROHIBIDO:
// context/AuthContext.tsx → services/platformApi.ts → services/apiConfig.ts → lib/api.ts
// context/PlatformDataContext.tsx → context/AuthContext.tsx (stub) → contexts/AuthContext.tsx
//
// La cadena de dependencia debe ser un DAG (grafo dirigido aciclico):
// components → hooks → context → services → lib
```

### 1.4 Regla de Bridge Files

Un bridge file (re-export) es aceptable TEMPORALMENTE durante una migracion. Pero:

- Debe tener un comentario `// TODO: Eliminar cuando todos los imports migren`
- No debe durar mas de 2 sprints
- Debe listarse en `KNOWN-BUGS.md` como deuda tecnica

```typescript
// context/AuthContext.tsx — BRIDGE FILE (temporal)
// TODO: Migrar todos los imports a @/app/contexts/AuthContext y eliminar este archivo
export { AuthProvider, useAuth } from '@/app/contexts/AuthContext';
```

---

## 2. Flujo de Dependencias

### 2.1 Diagrama de Capas

```
FRONTEND                                      BACKEND
========                                      ========

Pages/Routes                                  Route Handlers
    |                                              |
    v                                              v
Components (UI)                               Middleware (auth, role, rate-limit)
    |                                              |
    v                                              v
Hooks (useXxx)                                Business Logic (helpers)
    |                                              |
    v                                              v
Context (providers)                           CRUD Factory / Custom Queries
    |                                              |
    v                                              v
Services (API calls)                          Database (Supabase Client)
    |                                              |
    v                                              v
Lib (apiClient, config, utils)                Lib (db, validate, rate-limit)
    |                                              |
    v                                              v
Types (platform.ts, ui.ts)                    Types (shared-types.ts)
```

### 2.2 Regla: Las Flechas Solo Apuntan Hacia Abajo

- Un componente puede importar un hook. Un hook NO importa un componente.
- Un service puede importar un tipo. Un tipo NO importa un service.
- Un context puede importar un service. Un service NO importa un context.

### 2.3 Excepciones Permitidas

| Excepcion | Motivo | Condicion |
|-----------|--------|-----------||
| Hook importa componente (JSX) | Custom hook que devuelve un elemento | Solo si el hook es un render hook |
| Context importa otro Context | Provider anidado | Solo `useAuth()` en otros providers |
| Page importa contextos multiples | Composicion en pages | OK — las pages son el nivel mas alto |

---

## 3. Naming Conventions Unificadas

### 3.1 Archivos

| Tipo | Frontend | Backend | Ejemplo |
|------|----------|---------|--------|
| Componente React | PascalCase.tsx | N/A | `FlashcardCard.tsx` |
| Hook | camelCase.ts (use-prefix) | N/A | `useFlashcardEngine.ts` |
| Service/API | camelCase.ts | kebab-case.ts | FE: `platformApi.ts`, BE: `routes-content.ts` |
| Types | camelCase.ts | camelCase.ts | `platform.ts` |
| Context | PascalCase.tsx | N/A | `AuthContext.tsx` |
| Utility | kebab-case.ts | kebab-case.ts | `mastery-helpers.ts` |
| Test | {name}.test.ts | {name}_test.ts | FE: Vitest, BE: Deno.test |
| CSS | kebab-case.css | N/A | `theme.css` |

### 3.2 Exports

| Que | Convencion | Ejemplo |
|-----|-----------|--------|
| Componente | Named export (PascalCase) | `export function LoginPage()` |
| Hook | Named export (camelCase) | `export function useAuth()` |
| Tipo/Interface | Named export (PascalCase) | `export interface AuthUser` |
| Constante | Named export (UPPER_SNAKE) | `export const API_BASE = ...` |
| Funcion util | Named export (camelCase) | `export function isUuid()` |
| Default export | SOLO para App.tsx (Vite requiere) | `export default function App()` |

### 3.3 Variables y Props

| Contexto | Convencion | Ejemplo |
|----------|-----------|--------|
| DB column names | snake_case | `institution_id`, `created_at` |
| JS/TS variables | camelCase | `institutionId`, `createdAt` |
| React props | camelCase | `onSelect`, `isLoading` |
| URL query params | snake_case (match DB) | `?institution_id=` |
| CSS classes | kebab-case (Tailwind) | `bg-zinc-900` |
| Environment vars | UPPER_SNAKE | `VITE_SUPABASE_ANON_KEY` |

### 3.4 Directorios

Siempre **singular**, nunca plural:

```
// BIEN                    // MAL
context/                   contexts/
hook/                      hooks/         (excepcion aceptada por convencion React)
type/                      types/         (excepcion aceptada por convencion TS)
service/                   services/      (excepcion aceptada)
```

**Excepcion de Axon:** `hooks/`, `types/`, `services/` son aceptados porque siguen la convencion de la comunidad React. Pero NUNCA tener `context/` Y `contexts/` — elegir UNO y usarlo en toda la app.

---

## 4. Tipos Compartidos — Fuente de Verdad

### 4.1 Principio: UN tipo por concepto, UNA ubicacion

```
// PROHIBIDO: Course definido en 3 archivos distintos
// types/platform.ts  → { id, institution_id, name, color, sort_order }
// types/content.ts   → { id, name, color, accentColor, semesters[] }
// types/legacy-stubs.ts → { id, name, color, icon, semesters[] }
```

### 4.2 Estructura de Tipos para Axon

```
src/app/types/
  platform.ts     ← Fuente de verdad: mirrors shared-types.ts del backend
                     Todos los tipos que matchean columnas de DB
  ui.ts           ← Tipos derivados que solo el frontend necesita
                     (nested trees, view states, form data)
  index.ts        ← Barrel re-export
```

### 4.3 Reglas de Tipos

| Regla | Explicacion |
|-------|------------|
| **DB types van en `platform.ts`** | Si el campo existe como columna en Supabase, el tipo va aqui |
| **UI-only types van en `ui.ts`** | Tipos que el backend nunca ve (ej: `ViewType`, `ThemeType`) |
| **Inline types prohibidos en services** | `platformApi.ts` NO debe definir interfaces. Importar de `types/` |
| **`any` prohibido en tipos de API** | Toda response de API debe tener un tipo especifico |
| **Tipos de hook en su propio archivo** | `flashcard-types.ts` junto a `useFlashcardEngine.ts` — ACEPTABLE |

### 4.4 Patron de Sincronizacion Backend-Frontend

```
Backend: shared-types.ts (fuente de verdad)
    ↓ (copia manual o script)
Frontend: types/platform.ts (mirror)
```

Cuando el backend agrega un campo a una tabla:
1. Actualizar `shared-types.ts` en el backend
2. Actualizar `types/platform.ts` en el frontend
3. TypeScript flaggea todos los lugares que necesitan actualizarse

**Futuro:** Generar tipos automaticamente con `supabase gen types typescript`.

---

# PARTE II — ARQUITECTURA FRONTEND

---

## 5. Estructura de Directorios Frontend

### 5.1 Estructura Ideal (target)

```
src/
  main.tsx                    ← Entrypoint (no tocar)
  app/
    App.tsx                   ← RouterProvider + Toaster + ErrorBoundary global
    routes.tsx                ← Thin assembler (NO importa pages directamente)
    routes/
      student-routes.ts       ← Lazy route definitions (student)
      professor-routes.ts     ← Lazy route definitions (professor)
      admin-routes.ts         ← Lazy route definitions (admin)
      owner-routes.ts         ← Lazy route definitions (owner)

    components/
      auth/                   ← AuthLayout, LoginPage, RequireAuth, RequireRole
      layout/                 ← Shell, Sidebar, TopNav, UserDropdown
      shared/                 ← ErrorBoundary, AsyncState, EmptyState
      ui/                     ← Radix/ShadCN primitives (button, dialog, etc.)
      student/                ← Componentes de vista de estudiante
      professor/              ← Componentes de vista de profesor
      content/                ← Content tree, summary viewer
      dashboard/              ← Dashboard widgets
      video/                  ← Video player, video uploader
      viewer3d/               ← 3D model viewer

    context/                  ← UN solo directorio (no context/ + contexts/)
      AuthContext.tsx          ← Auth state + Supabase listener
      AppContext.tsx           ← UI-only state (theme, sidebar)

    hooks/
      useFlashcardEngine.ts   ← Logica de flashcards
      useStudyPlans.ts        ← Logica de study plans
      useContentTree.ts       ← Data fetching para content tree
      ...

    services/                 ← API calls organizados por dominio
      api-client.ts           ← UNA funcion request<T>() — unica capa
      institutions.ts         ← getInstitutions, createInstitution, etc.
      members.ts              ← getMembers, createMember, etc.
      content.ts              ← getCourses, getSummaries, etc.
      flashcards.ts           ← getFlashcards, createFlashcard, etc.
      study.ts                ← submitReview, getBktStates, etc.
      ai.ts                   ← AI generation endpoints

    lib/                      ← Utilidades puras (sin React, sin side effects)
      config.ts               ← Environment variables
      supabase.ts             ← UNA instancia de Supabase client
      bkt-engine.ts           ← Calculo BKT (pure function)
      fsrs-engine.ts          ← Calculo FSRS (pure function)
      mastery-helpers.ts      ← Color mapping, labels
      logger.ts               ← Logger con niveles (dev vs prod)

    types/
      platform.ts             ← DB types (mirror de shared-types.ts)
      ui.ts                   ← UI-only types
      index.ts                ← Barrel re-export

    design-system/            ← Tokens y constantes de diseno
      colors.ts
      typography.ts
      animation.ts
      ...

  styles/
    index.css
    fonts.css
    tailwind.css
    theme.css
```

### 5.2 Reglas de Directorio

| Regla | Detalle |
|-------|--------|
| **No colocar archivos .tsx de documentacion en `src/`** | Documentacion va en `axon-docs/`, no como `DEVELOPER_CONTRACT.tsx` |
| **No colocar datos mock en `data/`** | Datos de ejemplo van como seed en la DB, no en el bundle |
| **Un solo directorio de context** | Elegir `context/` (singular). Eliminar `contexts/` |
| **No duplicar clientes Supabase** | Un solo `lib/supabase.ts`, importado por todo |
| **`utils/` de root no debe existir** | Mover a `src/app/lib/` |
| **No commitear `node_modules/`** | Agregar a `.gitignore` |
| **`.patch` files no se commitean** | Eliminar `platformApi.ts.patch` |

### 5.3 Regla de Imports: Path Aliases

```typescript
// SIEMPRE usar el alias @/
import { useAuth } from '@/app/context/AuthContext';
import { apiClient } from '@/app/services/api-client';
import type { Course } from '@/app/types/platform';

// NUNCA usar rutas relativas que suban mas de 1 nivel
// MAL:  import { useAuth } from '../../../context/AuthContext';
// BIEN: import { useAuth } from '@/app/context/AuthContext';
```

---

## 6. Jerarquia de Componentes

### 6.1 Tipos de Componentes

| Tipo | Responsabilidad | Imports permitidos | Tamano max |
|------|----------------|-------------------|------------|
| **Page** | Composicion + data loading | Hooks, Context, Components | 200 lineas |
| **Feature** | Logica de una feature completa | Hooks, UI components, Services | 500 lineas |
| **UI (shared)** | Rendering puro, design system | Solo props + Tailwind | 100 lineas |
| **Layout** | Shell, sidebar, nav | Context (theme, auth), UI components | 200 lineas |

### 6.2 Patron de Split para Componentes Grandes

Cuando un componente excede 500 lineas:

```
// ANTES: KeywordPopup.tsx (36KB, 900+ lineas)
// - Fetching de datos
// - Logica de UI (tabs, estados)
// - Rendering de contenido
// - Botones de accion

// DESPUES:
KeywordPopup/
  index.tsx              ← Orchestrator: state + composition (< 150 lineas)
  KeywordContent.tsx     ← Rendering del contenido (< 200 lineas)
  KeywordActions.tsx     ← Botones y acciones (< 100 lineas)
  KeywordTabs.tsx        ← Tab navigation (< 100 lineas)
  useKeywordData.ts      ← Hook de datos (< 100 lineas)
```

### 6.3 Regla de Props Drilling

Si un prop pasa por mas de 2 niveles de componentes, debe ir en Context o en un hook.

```typescript
// MAL: Page → Layout → Sidebar → SidebarItem (prop: currentCourse)
// BIEN: Context provee currentCourse, SidebarItem lo lee con useApp()
```

### 6.4 Patron de Componente de Lista

Todo componente que se renderiza en una lista DEBE usar `React.memo`:

```typescript
interface FlashcardItemProps {
  card: FlashcardCard;
  onFlip: (id: string) => void;
}

export const FlashcardItem = React.memo(function FlashcardItem({
  card,
  onFlip,
}: FlashcardItemProps) {
  return (/* rendering */);
});
```

---

## 7. Estado y Flujo de Datos

### 7.1 Clasificacion de Estado

| Tipo | Donde vive | Ejemplo en Axon |
|------|-----------|----------------|
| **Server State** | React Query / Hook con cache | Courses, flashcards, summaries, BKT states |
| **Auth State** | Context + Supabase listener | User, token, role, selectedInstitution |
| **UI State local** | `useState` en componente | Modal abierto, tab activo, form input |
| **UI State global** | Context | Theme, sidebar abierto/cerrado |
| **Navigation State** | URL (route params) | `/student/summary/:topicId` |
| **Form State** | `react-hook-form` | Crear curso, editar summary |

### 7.2 Regla: Navigation State en la URL, No en Context

```typescript
// MAL (AppContext.tsx actual):
const [currentCourse, setCurrentCourse] = useState(courses[0]);
const [currentTopic, setCurrentTopic] = useState(defaultTopic);

// BIEN (route params):
// En routes.tsx: { path: "topic/:topicId", Component: TopicPage }
// En TopicPage: const { topicId } = useParams();
```

**Por que:** Si el usuario comparte la URL o refresca, el estado se pierde con Context pero se preserva con route params.

### 7.3 Regla: Server State NO va en Context

```typescript
// MAL (PlatformDataContext actual):
// Context que hace fetch, guarda en useState, y expone refresh functions
// Esto reinventa React Query mal — sin cache, sin dedup, sin stale-while-revalidate

// BIEN (React Query o hook con cache):
function useInstitution(instId: string) {
  return useQuery({
    queryKey: ['institution', instId],
    queryFn: () => apiClient.get(`/institutions/${instId}`),
    staleTime: 60_000, // 1 minuto
  });
}
```

### 7.4 Patron de Provider Stack

```tsx
// App.tsx — orden correcto de providers
<ErrorBoundary fallback={<CrashScreen />}>
  <AuthProvider>              {/* Auth state — solo Supabase listener */}
    <RouterProvider router={router} />
    <Toaster />
  </AuthProvider>
</ErrorBoundary>

// Dentro de RoleLayout (ej: StudentLayout)
<QueryClientProvider client={queryClient}>  {/* Data cache */}
  <AppProvider>                               {/* UI-only state */}
    <Outlet />
  </AppProvider>
</QueryClientProvider>
```

### 7.5 Lo que AuthContext DEBE contener (y nada mas)

```typescript
interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  institutions: UserInstitution[];
  selectedInstitution: UserInstitution | null;
  role: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Result>;
  signup: (email: string, password: string, name: string) => Promise<Result>;
  logout: () => Promise<void>;
  selectInstitution: (inst: UserInstitution) => void;
}
// NO backward-compat aliases. NO memberships. NO activeMembership.
// NO signIn/signUp/signOut (usar login/signup/logout).
```

---

## 8. Capa de API del Frontend

### 8.1 Regla: UNA Funcion de Request

```typescript
// services/api-client.ts — UNICA capa de HTTP
import { getAccessToken } from '@/app/lib/api-tokens';
import { config } from '@/app/lib/config';
import { logger } from '@/app/lib/logger';

class ApiClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(!(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    'Authorization': `Bearer ${config.anonKey}`,
    ...((options.headers as Record<string, string>) || {}),
  };

  const token = getAccessToken();
  if (token) headers['X-Access-Token'] = token;

  const url = `${config.apiBase}${path}`;
  logger.debug(`[API] ${options.method || 'GET'} ${path}`);

  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch {
    throw new ApiClientError('Invalid JSON response', 'PARSE_ERROR', res.status);
  }

  if (!res.ok) {
    throw new ApiClientError(
      json?.error || `API Error ${res.status}`,
      json?.code || 'API_ERROR',
      res.status
    );
  }

  // Unwrap { data: ... } envelope
  return ('data' in json) ? json.data : json;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: 'POST', body: formData }),
};
```

### 8.2 Service Files por Dominio (consumen apiClient)

```typescript
// services/institutions.ts
import { apiClient } from './api-client';
import type { Institution, UUID } from '@/app/types/platform';

export const institutionsApi = {
  list: () => apiClient.get<Institution[]>('/institutions'),
  get: (id: UUID) => apiClient.get<Institution>(`/institutions/${id}`),
  create: (data: { name: string; slug: string }) =>
    apiClient.post<Institution>('/institutions', data),
  update: (id: UUID, data: Partial<Institution>) =>
    apiClient.put<Institution>(`/institutions/${id}`, data),
  delete: (id: UUID) =>
    apiClient.delete(`/institutions/${id}`),
};
```

### 8.3 Regla: CRUD Factory en Frontend (espeja backend)

```typescript
// services/crud-factory.ts
import { apiClient } from './api-client';

interface CrudEndpoints<T> {
  list: (params?: Record<string, string>) => Promise<T[]>;
  get: (id: string) => Promise<T>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
}

export function createCrud<T>(slug: string): CrudEndpoints<T> {
  return {
    list: (params) => {
      const qs = params ? `?${new URLSearchParams(params)}` : '';
      return apiClient.get<T[]>(`/${slug}${qs}`);
    },
    get: (id) => apiClient.get<T>(`/${slug}/${id}`),
    create: (data) => apiClient.post<T>(`/${slug}`, data),
    update: (id, data) => apiClient.put<T>(`/${slug}/${id}`, data),
    delete: (id) => apiClient.delete(`/${slug}/${id}`),
  };
}

// Uso:
// import type { Course } from '@/app/types/platform';
// export const coursesApi = createCrud<Course>('courses');
```

### 8.4 Lo que NUNCA debe existir

| Prohibido | Por que | Solucion |
|-----------|---------|----------|
| `fetch()` directo en un componente | Bypasa headers, error handling | Usar `apiClient` |
| `fetch()` directo en un context | Duplica logica de request | Usar `apiClient` |
| Headers manuales en un service file | Inconsistencia con otros calls | `apiClient` los maneja |
| Dos wrappers de request (`apiCall` + `realRequest`) | Confuso, bugs sutiles | UN solo `apiClient` |
| `console.log` en API layer | Expone info en prod | Usar `logger.debug()` |

---

## 9. Routing y Code Splitting

### 9.1 Patron de routes.tsx

`routes.tsx` es un **thin assembler** — no importa componentes de pagina directamente.

```typescript
// routes.tsx — CORRECTO (actual)
import { studentChildren } from '@/app/routes/student-routes';

{
  path: 'student',
  lazy: () => import('@/app/components/roles/StudentLayout')
    .then(m => ({ Component: m.StudentLayout })),
  children: studentChildren,
}
```

### 9.2 Regla: TODA pagina usa lazy()

```typescript
// student-routes.ts — CORRECTO
export const studentChildren = [
  {
    index: true,
    lazy: () => import('@/app/pages/student/DashboardPage')
      .then(m => ({ Component: m.DashboardPage })),
  },
  {
    path: 'summary/:topicId',
    lazy: () => import('@/app/pages/student/SummaryPage')
      .then(m => ({ Component: m.SummaryPage })),
  },
];

// owner-routes.ts — INCORRECTO (actual: importa PlaceholderPage directamente)
// FIX: Usar lazy() igual que student-routes.ts
```

### 9.3 Regla: RequireRole envuelve por grupo de rutas, no por ruta individual

```typescript
// BIEN (actual): RequireRole como wrapper de un grupo
{
  element: <RequireRole roles={['professor', 'admin', 'owner']} />,
  children: [{ path: 'professor', ... }],
}
```

### 9.4 Manual Chunks en Vite (actual — correcto)

```typescript
// vite.config.ts — mantener esto
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router'],
  'vendor-three': ['three'],
  'vendor-motion': ['motion'],
}
```

Agregar cuando sea necesario:
```typescript
'vendor-radix': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', ...],
'vendor-recharts': ['recharts'],
```

---

## 10. Performance Frontend

### 10.1 Reglas No Negociables

| # | Regla | Detalle |
|---|-------|--------|
| 1 | **Toda lista usa `key` unico (no index)** | `key={item.id}`, nunca `key={index}` |
| 2 | **Componentes de lista usan `React.memo`** | `FlashcardItem`, `KeywordBadge`, etc. |
| 3 | **Callbacks en listas usan `useCallback`** | Evitar re-creacion en cada render |
| 4 | **Heavy components son lazy** | Three.js, recharts, MUX player |
| 5 | **No cargar datos que no se ven** | Lazy load tabs, accordions, modales |
| 6 | **Imagenes tienen dimensiones explicitas** | `width` y `height` para evitar layout shift |
| 7 | **No `useEffect` para derivar datos** | Usar `useMemo` o computar inline |

### 10.2 Patron de Data Loading Progresivo

```typescript
// MAL (StudentDataContext actual): Carga TODO al mount
useEffect(() => {
  loadProfile();     // OK
  loadStats();       // OK
  loadProgress();    // Podria esperar
  loadActivity();    // Podria esperar
  loadSessions();    // Podria esperar
  loadReviews();     // DEFINITIVAMENTE deberia esperar
}, []);

// BIEN: Carga escalonada
// Mount: profile + stats (lo que se ve en dashboard)
// On navigate to /progress: courseProgress
// On navigate to /activity: dailyActivity
// On navigate to /sessions: sessions
// On navigate to /reviews: reviews
```

### 10.3 Bundle Targets

| Metrica | Target | Actual (estimado) |
|---------|--------|-------------------|
| Bundle total (gzipped) | < 400KB | ~800KB+ |
| Chunk inicial (gzipped) | < 150KB | ~300KB+ |
| Time to Interactive (3G) | < 3s | Desconocido |
| Largest Contentful Paint | < 2.5s | Desconocido |

---

## 11. Error Handling Frontend

### 11.1 ErrorBoundary Obligatorio

```typescript
// components/shared/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 11.2 Donde Colocar ErrorBoundaries

```
App.tsx                    ← ErrorBoundary GLOBAL (crash total = pantalla de error amigable)
  [Role]Layout             ← ErrorBoundary POR ROL (crash en una pagina no mata la nav)
    LazyPageComponent      ← Suspense con fallback (loading skeleton)
      FeatureComponent     ← try/catch en event handlers
```

### 11.3 Logger con Niveles

```typescript
// lib/logger.ts
const isDev = import.meta.env.DEV;

export const logger = {
  debug: isDev ? console.log.bind(console) : () => {},
  info: isDev ? console.info.bind(console) : () => {},
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};
```

---

## 12. Testing Frontend

### 12.1 Stack Recomendado

```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "jsdom": "^25.0.0"
  }
}
```

### 12.2 Que Testear (por prioridad)

| Prioridad | Que | Como | Cobertura target |
|-----------|-----|------|------------------|
| **P0** | Auth flow (login, logout, token refresh) | Integration test | 90% |
| **P0** | API client (request, error handling) | Unit test | 100% |
| **P1** | Hooks criticos (useFlashcardEngine, useStudyPlans) | Unit test | 80% |
| **P1** | Calculos puros (BKT, FSRS, mastery) | Unit test | 100% |
| **P2** | Componentes de formulario | Component test | 60% |
| **P3** | Componentes de UI (rendering) | Snapshot test | Opcional |

### 12.3 Template de Test

```typescript
// services/__tests__/api-client.test.ts
import { describe, it, expect, vi } from 'vitest';
import { apiClient } from '../api-client';

describe('apiClient', () => {
  it('unwraps { data } envelope', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: { id: '123' } }))
    );
    const result = await apiClient.get('/test');
    expect(result).toEqual({ id: '123' });
  });

  it('throws ApiClientError on non-ok response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
    );
    await expect(apiClient.get('/missing')).rejects.toThrow('Not found');
  });
});
```

---

# PARTE III — ARQUITECTURA BACKEND

---

## 13. Estructura de Directorios Backend

### 13.1 Estructura Actual (correcta, mantener)

```
supabase/functions/server/
  index.ts              ← Entrypoint: routing + middleware stack
  db.ts                 ← Supabase clients, authenticate(), ok(), err()
  crud-factory.ts       ← CRUD generico (SAGRADO — no modificar)
  validate.ts           ← Validacion runtime
  rate-limit.ts         ← Rate limiting in-memory
  timing-safe.ts        ← Crypto utility
  routes-auth.ts        ← Auth + profiles
  routes-content.ts     ← Jerarquia de contenido
  routes-members.ts     ← Memberships + institutions
  routes-billing.ts     ← Stripe checkout + webhooks
  routes-mux.ts         ← Mux video upload + webhooks
  routes-plans.ts       ← Platform plans + institution plans
  routes-search.ts      ← Search + trash
  routes-storage.ts     ← File upload + signed URLs
  routes-student.ts     ← Student stats + daily activities
  routes-study.ts       ← Study sessions + reviews + BKT/FSRS
  routes-study-queue.ts ← Study queue + NeedScore
  routes-models.ts      ← 3D models
  tests/                ← Deno-native tests (UNICO directorio)
  migrations/           ← SQL migration files
```

### 13.2 Archivos a Agregar (cuando se necesiten)

```
require-role.ts         ← Middleware de autorizacion por rol
cache.ts                ← In-memory TTL cache
request-id.ts           ← X-Request-Id middleware
error-codes.ts          ← Enum de codigos de error estandarizados
```

### 13.3 Archivos a Corregir

| Archivo | Problema | Fix |
|---------|----------|-----|
| `routes-auth.tsx` | Extension `.tsx` sin JSX | Renombrar a `.ts` |
| `routes-members.tsx` | Extension `.tsx` sin JSX | Renombrar a `.ts` |
| `routes-content.tsx` | Extension `.tsx` sin JSX | Renombrar a `.ts` |
| (todos los `routes-*.tsx`) | Extension `.tsx` sin JSX | Renombrar a `.ts` |
| `__tests__/` | Directorio duplicado | Consolidar en `tests/` |

---

## 14. Patron de Ruta Extendido

### 14.1 Secuencia Obligatoria (repaso de ENGINEERING-PRACTICES.md)

```
1. Autenticacion     → authenticate(c)
2. Autorizacion      → requireRole(c, db, userId, instId, roles)
3. Validacion        → validateFields(body, rules)
4. Logica de negocio → db queries, RPCs, external APIs
5. Respuesta         → ok(c, data, status)
```

### 14.2 Patron de Ruta Custom (no-factory)

Cuando una ruta necesita logica que el CRUD factory no soporta:

```typescript
// Registrar CRUD basico CON factory
registerCrud(app, { table: "courses", slug: "courses", ... });

// Agregar rutas custom EN EL MISMO archivo
app.get(`${PREFIX}/content-tree`, async (c) => {
  const auth = await authenticate(c);
  if (auth instanceof Response) return auth;
  const { user, db } = auth;

  const institutionId = c.req.query("institution_id");
  if (!institutionId || !isUuid(institutionId)) {
    return err(c, "institution_id required", 400);
  }

  // Primary: RPC
  const { data, error } = await db.rpc("get_content_tree", {
    p_institution_id: institutionId,
  });
  if (!error) return ok(c, data);

  // Fallback: PostgREST embed
  console.warn(`[content-tree] RPC failed, using fallback: ${error.message}`);
  // ... fallback logic
});
```

---

## 15. Middleware Chain

### 15.1 Orden del Middleware Stack en index.ts

```typescript
// index.ts — orden correcto
const app = new Hono();

// 1. CORS (siempre primero)
app.use("*", cors({ origin: ALLOWED_ORIGINS }));

// 2. Request ID (para tracing)
app.use("*", requestIdMiddleware);

// 3. Rate Limiting (antes de cualquier logica)
app.use("*", rateLimitMiddleware);

// 4. Logging (despues de rate limit para no loggear requests rechazados)
app.use("*", loggerMiddleware);

// 5. Routes
registerRoutes(app);
```

### 15.2 Patron de Middleware Custom

```typescript
// require-role.ts — a crear
export async function requireRole(
  c: Context,
  db: SupabaseClient,
  userId: string,
  institutionId: string,
  allowedRoles: string[]
): Promise<Response | null> {
  const { data } = await db
    .from("memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("institution_id", institutionId)
    .eq("is_active", true)
    .single();

  if (!data || !allowedRoles.includes(data.role)) {
    return err(c, "Insufficient permissions", 403);
  }
  return null; // OK — continuar
}
```

---

## 16. Performance Backend

(Complementa seccion 5 de ENGINEERING-PRACTICES.md)

### 16.1 Patron de Cache para Datos Semi-Estaticos

```typescript
// cache.ts
const store = new Map<string, { data: unknown; expires: number }>();

export function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const entry = store.get(key);
  if (entry && entry.expires > Date.now()) return Promise.resolve(entry.data as T);

  return fetcher().then((data) => {
    store.set(key, { data, expires: Date.now() + ttlMs });
    return data;
  });
}

export function invalidate(keyPrefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(keyPrefix)) store.delete(key);
  }
}
```

### 16.2 Candidatos de Cache

| Ruta | TTL | Invalidar cuando |
|------|-----|-------------------|
| `GET /content-tree?institution_id=X` | 60s | POST/PUT/DELETE en courses, semesters, sections, topics |
| `GET /institution-plans?institution_id=X` | 300s | POST/PUT/DELETE en institution-plans |
| `GET /platform-plans` | 600s | POST/PUT/DELETE en platform-plans |
| `GET /institutions/:id` | 60s | PUT en institutions |

---

# PARTE IV — ARQUITECTURA DE SISTEMA

---

## 17. Contrato Frontend-Backend

### 17.1 Response Envelope

```typescript
// Exito: SIEMPRE envuelve en { data: ... }
{ "data": { "id": "abc", "name": "Course 1" } }

// Exito lista: items + metadata de paginacion
{ "data": { "items": [...], "total": 42, "limit": 20, "offset": 0 } }

// Error: SIEMPRE { error: string, code?: string }
{ "error": "Missing required field: name", "code": "VALIDATION_ERROR" }
```

### 17.2 Header Convention

```
Authorization: Bearer <ANON_KEY>     ← SIEMPRE (gateway Supabase)
X-Access-Token: <USER_JWT>           ← Cuando el usuario esta autenticado
Content-Type: application/json       ← Para POST/PUT/PATCH
X-Request-Id: <UUID>                 ← Para tracing (futuro)
```

**REGLA CRITICA:** El user JWT NUNCA va en Authorization. SIEMPRE en X-Access-Token.

### 17.3 Error Handling Cross-Stack

```
Backend:    throw err(c, "message", status)
              ↓ HTTP Response
              ↓ { "error": "message", "code": "ERROR_CODE" }
              ↓
Frontend:   apiClient catches → throws ApiClientError(message, code, status)
              ↓
Hook/Page:  try/catch → toast.error(error.message) o setState({ error })
              ↓
UI:         ErrorBoundary catches uncaught → fallback UI
```

---

## 18. Checklist Arquitectonico

Copiar y llenar ANTES de crear cualquier feature nueva:

```markdown
## Architecture Checklist: [FEATURE NAME]

### Frontend
- [ ] Componente < 500 lineas?
- [ ] Datos de servidor en hook (no Context)?
- [ ] Navegacion en URL params (no Context)?
- [ ] Usa apiClient (no fetch directo)?
- [ ] Tipos importados de types/ (no inline)?
- [ ] Pagina lazy-loaded?
- [ ] ErrorBoundary envuelve la feature?
- [ ] React.memo en componentes de lista?
- [ ] Logger en vez de console.log?

### Backend
- [ ] Archivo de ruta < 400 lineas?
- [ ] Secuencia: Auth → Role → Validate → Logic → Response?
- [ ] Input validado con validate.ts (no typeof inline)?
- [ ] LIST tiene paginacion con MAX cap?
- [ ] SELECT usa columnas especificas (no *)?
- [ ] Queries independientes en Promise.all?
- [ ] Aggregaciones en SQL (no JS reduce)?
- [ ] Extension .ts (no .tsx sin JSX)?
- [ ] Cache si datos cambian < 1 vez/minuto?

### Compartido
- [ ] Tipos definidos en platform.ts (no inline)?
- [ ] Nuevo endpoint documentado en API-MAP.md?
- [ ] Test unitario para logica pura?
- [ ] KNOWN-BUGS.md actualizado si aplica?
```

---

## Apendice: Migrar de Estado Actual a Ideal

### Paso 1: Consolidacion (2-3 sesiones)
1. Merge `context/` + `contexts/` → `context/` unico
2. Merge `lib/api.ts` + `services/apiConfig.ts` → `services/api-client.ts` unico
3. Eliminar `data/` completo (95KB de mock data)
4. Eliminar archivos .tsx de documentacion (62KB)
5. Eliminar `platformApi.ts.patch` (0 bytes)
6. `git rm -r --cached node_modules/`

### Paso 2: Tipos (1-2 sesiones)
1. Mover interfaces inline de platformApi.ts → types/platform.ts
2. Unificar Course/Topic/Section entre content.ts y legacy-stubs.ts
3. Eliminar backward-compat aliases en AuthContext
4. Reemplazar `any` en responses de API

### Paso 3: Componentes (2-3 sesiones)
1. Split componentes > 500 lineas (KeywordPopup, QuizTaker, FlashcardReviewer)
2. Agregar ErrorBoundary global + per-role
3. Agregar React.memo a componentes de lista
4. Lazy() en owner-routes.ts
5. Evaluar eliminar MUI (reemplazar con Radix)

### Paso 4: Data Layer (3-4 sesiones)
1. Implementar React Query o hook con cache
2. Reemplazar PlatformDataContext con hooks de React Query
3. Reemplazar StudentDataContext con hooks de React Query
4. AppContext: eliminar currentCourse, currentTopic (usar route params)
5. Setup Vitest + tests criticos
