# DIAGNÓSTICO INTEGRAL QA + UI/UX — AXON PLATFORM FRONTEND
**Fecha original**: 2026-03-18 | **Re-auditoría**: 2026-03-18
**Método**: 6 rondas × 5 agentes (30 agentes Opus) + 10 agentes de auditoría cruzada contra main
**Alcance**: `numero1_sseki_2325_55/src/` — 374 archivos TSX, 627 archivos TS/TSX total, 50+ hooks, 30+ services
**Precisión auditada**: 130 claims verificados → **82% confirmados, 10% parciales, 8% falsos/corregidos**

---

## RESUMEN EJECUTIVO

Se identificaron **350+ hallazgos** organizados en **15 categorías**. Tras re-auditoría contra main actual, 4 items P0 fueron **ya corregidos** (marcados ~~tachados~~). Los más críticos restantes:

| Prioridad | Categoría | Hallazgos Críticos |
|-----------|-----------|-------------------|
| P0 | Auth & Seguridad | Sin reset de contraseña, sin verificación email, sin manejo de 401, logout no limpia cache |
| P0 | Estabilidad | `withBoundary` definido pero NUNCA usado → 21+ rutas sin error boundary |
| P0 | Design System | Dos sistemas de tokens en conflicto (button radius, fadeUp duration) |
| P1 | Accesibilidad | 35+ botones sin nombre accesible, 0 focus traps en todo el codebase |
| P1 | Performance | `next-themes` innecesario en proyecto no-Next.js |
| P1 | Datos | Cero suscripciones Supabase Realtime, 15 APIs que tragan errores silenciosamente |
| P2 | UX Flujos | Dos flujos de flashcard review compitiendo, quiz sin confirmación de salida |
| P2 | Formularios | 3 modales sin `<form>` tag (no funciona Enter), LoginPage sin autofocus |
| P2 | Code Quality | 205 usos de `any` en 75 archivos, 813 `fontWeight` inline, 37 console.log en producción |
| P3 | Tipografía | 3 fuentes de heading en conflicto, sin escala de tamaños estandarizada |

---

## 1. AUTH & SEGURIDAD (P0)

### 1.1 Sin Flujo de Reset de Contraseña — CRÍTICO ✅
- **Impacto**: Usuarios que olvidan contraseña no pueden recuperar su cuenta
- **Detalle**: No existe `ForgotPasswordPage`, no hay llamada a `supabase.auth.resetPasswordForEmail()`, no hay ruta `/reset-password`
- **Verificado**: Grep en main confirma cero matches

### 1.2 Sin Verificación de Email — CRÍTICO ✅
- **Impacto**: Cuentas creadas sin confirmar email, riesgo de spam/abuso
- **Detalle**: Después del signup, auto-login inmediato sin verificar `user.email_confirmed_at`
- **Archivo**: `AuthContext.tsx:308-354`, `LoginPage.tsx:51-61`

### 1.3 Sin Manejo de 401/Sesión Expirada — CRÍTICO ✅
- **Impacto**: Cuando el JWT expira, la app queda en estado roto con errores crípticos
- **Detalle**: `apiCall()` no tiene interceptor de 401, no hay redirect a login, no hay toast de "sesión expirada"
- **Archivo**: `api.ts:57-160`
- **Fix**: Interceptor en `apiCall()` → intentar refresh → si falla, logout + redirect + toast

### 1.4 Mensajes de Error en Inglés Expuestos al Usuario ✅
- **Severidad**: Alta
- **Detalle**: Supabase devuelve errores como `"Invalid login credentials"` y se muestran directamente
- **Archivo**: `LoginPage.tsx:46`, `AuthContext.tsx:287-288`

### 1.5 Indicador "Conectado al backend" es Estático/Falso ✅
- **Severidad**: Alta
- **Detalle**: Siempre muestra dot verde + "Conectado al backend" sin verificar conectividad real
- **Archivo**: `LoginPage.tsx:257-260`

### 1.6 RequireRole Sin Estado de Loading ✅
- **Severidad**: Alta
- **Detalle**: Durante restore de sesión, `activeMembership` es null → redirect prematuro a `/select-org`
- **Archivo**: `RequireRole.tsx:13-26`

### 1.7 Ruta `/student` Sin Guard de Rol
- **Severidad**: Baja
- **Detalle**: Cualquier usuario autenticado puede acceder a `/student/*`, a diferencia de las otras rutas de rol
- **Archivo**: `routes.tsx:100-107`

### 1.8 Logout No Limpia Cachés — CRÍTICO (DATA LEAKAGE) ✅
- **Severidad**: CRÍTICA (privacidad)
- **Detalle**: `signOut()` no llama `queryClient.clear()`. Si User A cierra sesión y User B inicia sesión en el mismo navegador, User B ve datos cacheados de User A por hasta 10 minutos
- **Archivo**: `AuthContext.tsx:357-371`
- **Verificado**: Grep confirma cero calls a `queryClient.clear` en todo src/

### 1.8b Tres Context Providers Bypassean React Query ✅
- **Severidad**: Alta
- **Detalle**: `ContentTreeContext`, `PlatformDataContext`, `StudentDataContext` usan `useState + useEffect + fetch` manual sin staleness management, sin deduplicación
- **Verificado**: ContentTreeContext no importa React Query en absoluto

### ~~1.9 XSS: 8 Sitios con `dangerouslySetInnerHTML` Sin Sanitización~~ ✅ CORREGIDO
- **Estado**: ✅ **YA CORREGIDO** en main
- **Detalle**: DOMPurify instalado, `lib/sanitize.ts` creado con wrapper `sanitizeHtml()`. Todos los sitios de `dangerouslySetInnerHTML` ahora pasan por sanitización (ChunkRenderer, ReaderHeader, ReaderChunksTab, ViewerBlock, StudentSummaryReader)
- **Fecha fix**: Header dice "FE-001 FIX: Security audit 2026-03-18"

### 1.10 Botón de Logout en PanelSidebar No Funciona ✅
- **Severidad**: Media
- **Detalle**: `<button>` sin `onClick` handler
- **Archivo**: `PanelSidebar.tsx:46-50`

---

## 2. ESTABILIDAD & ERROR HANDLING (P0)

### 2.1 `withBoundary` Definido Pero NUNCA Usado — CRÍTICO ✅
- **Impacto**: 21+ rutas lazy-loaded sin error boundary → pantalla blanca en crash
- **Archivo**: `lib/withBoundary.tsx` — cero imports en archivos de rutas
- **Verificado**: Grep confirma cero matches en `src/app/routes/`

### 2.2 APIs de Gamificación Tragan TODOS los Errores ✅
- **Severidad**: Alta
- **Detalle corregido**: **15 funciones** (no 13) en `gamificationApi.ts` catch todo — 9 retornan `null`, 6 retornan objetos vacíos con arrays/zeros
- **Archivo**: `gamificationApi.ts:133-350`

### 2.3 APIs de Actividad Estudiantil Tragan Errores ✅
- **Severidad**: Alta
- **Archivo**: `sa-activity-sessions.ts:22-41`

### 2.4 ContentTree CRUD Tiene Modal de Confirmación pero Sin Toast de Error
- **Severidad**: Media
- **Detalle corregido**: ContentTree.tsx SÍ tiene modal de confirmación para deletes (`confirmDelete` state, lines 161, 302-314). Pero si la operación de API falla después de confirmar, no hay toast de error
- **Archivo**: `ContentTreeContext.tsx:144-203`

### 2.5 Sin Detección de Offline / Sin Banner ✅
- **Severidad**: Alta
- **Verificado**: Cero `navigator.onLine` en todo src/

### 2.6 Sin Página 404 Dedicada ⚠️
- **Severidad**: Baja
- **Matiz**: No hay 404 page, pero catch-all redirects existen (`PostLoginRouter` para `*`)

### 2.7 NUEVO: Race Conditions en useEffect Async — Alta
- **Severidad**: Alta
- **Detalle**: 5 patrones de `.then()` sin cancellation guard que setean state en componentes potencialmente desmontados
- **Peor caso**: `QuizSelection.tsx:144-163` dispara N fetches paralelos sin AbortController
- **Archivos**: `QuizSelection.tsx`, `useAdaptiveSession.ts`, `BadgeShowcase.tsx`, `XPTimeline.tsx`, `useQuizSession.ts`

### 2.8 NUEVO: 37 console.log en Código de Producción — Media
- **Detalle**: 37 `console.log` sin guardia `import.meta.env.DEV` en 14 archivos
- **Peor**: `useStudyPlans.ts` tiene 18 console.log/warn/error sin guardia
- **Otros**: `useReviewBatch.ts` (4), `StudentDataContext.tsx`, `ContentTreeContext.tsx`, `api.ts` (3)

### 2.9 NUEVO: Dual ApiError Classes — Media ✅
- **Detalle**: Dos clases `ApiError` con firmas diferentes: `error-utils.ts` tiene `(message, status, path)`, `apiConfig.ts` tiene `(message, code, status)`. Además, `apiCall()` lanza `new Error()` plano, no `ApiError`
- **Impacto**: `instanceof ApiError` nunca matchea para calls vía `apiCall()`

### 2.10 NUEVO: `realRequest()`/`figmaRequest()` Sin Timeout ✅
- **Severidad**: Alta
- **Detalle**: A diferencia de `apiCall()` (15s timeout), estas funciones legacy no usan `AbortController`
- **Archivo**: `apiConfig.ts:74-179`

---

## 3. DESIGN SYSTEM (P0)

### 3.1 Dos Sistemas de Tokens en Conflicto ⚠️
- **Impacto**: Tokens contradictorios en áreas específicas
- **Conflictos verificados**:
  | Token | design-system | dk-tokens | ¿Conflicto? |
  |-------|--------------|-----------|-------------|
  | Botón radius | `rounded-full` (pill) | `rounded-xl` | ✅ SÍ |
  | fadeUp duration | 0.35s, y:12 | 0.5s, y:20 | ✅ SÍ |
  | Card bg | `bg-white` | `bg-white` | ❌ NO |
  | Card radius | `rounded-2xl` | `rounded-2xl` | ❌ NO |
- **Nota**: No es conflicto total — solo button radius y animación fadeUp difieren

### 3.2 1,585 Violaciones de Font-Size Prohibido ✅
- **Detalle**: Regla `rules.ts:35` prohíbe clases Tailwind como `text-2xl` → usar `clamp()` o tokens. Pero 1,585 usos en 245 archivos
- **Realidad**: La regla es impracticable en su forma actual — necesita revisión

### 3.3 94+ Violaciones de Colores Prohibidos en Interactivos ✅
- **Detalle**: Sistema de roles usa blue/violet/purple intencionalmente (Admin=blue, Professor=purple)
- **Fix**: Clarificar la regla — excluir contextos de acento de rol

### 3.4 80 Instancias de Glassmorphism en Cards de Contenido ✅

### 3.5 Tres Fuentes de Heading en Conflicto ✅
- **Detalle**: Georgia (canónica), Space Grotesk (4 archivos confirmados: AxonAIAssistant 5×, StudyDashboardsView 3×, KnowledgeHeatmapView 3×, MasteryDashboardView 1×), Inter/default (mayoría)
- **Solo ~27 archivos** (24 consumidores) importan `headingStyle`

### 3.6 Sin Escala de Z-Index Definida ✅

### 3.7 Adopción del Design System: ~16% ✅

---

## 4. ACCESIBILIDAD — a11y (P1)

### 4.1 35+ Botones Icon-Only Sin Nombre Accesible — CRÍTICO ✅
- **Verificado**: Solo 69 `aria-label` en 37 archivos para cientos de botones icon-only
- **Fix**: Agregar `aria-label` a cada botón icon-only

### 4.2 Cero Focus Traps en Todo el Codebase — CRÍTICO ✅
- **Detalle corregido**: No solo "7+ modales" — hay literalmente **CERO** implementaciones de focus trap. Solo 1 `role="dialog"` existe (AxonAIAssistant). Grep para `focus.?trap|FocusTrap` = 0 matches
- **Fix**: Usar Radix Dialog o crear `ModalWrapper` compartido

### 4.3 5+ Elementos Clickeables Sin Soporte de Teclado ✅

### 4.4 Progress Bars Sin ARIA ✅

### 4.5 Solo 2 `aria-live` Regions en 627 Archivos ✅
- **Verificado**: Exactamente 2 matches (AxonAIAssistant, QuestionRenderer)

### 4.6 39 Instancias de `outline-none` Sin Focus Alternativo ✅

### 4.7 Formularios Sin Labels Asociados Programáticamente ✅

---

## 5. PERFORMANCE (P1)

### ~~5.1 MUI + Emotion: Dependencias Fantasma~~ ✅ CORREGIDO
- **Estado**: ✅ **YA REMOVIDOS** de `package.json` en main actual

### ~~5.2 Más Dependencias No Usadas~~ ✅ CORREGIDO
- **Estado**: ✅ **YA REMOVIDOS** — `@popperjs/core`, `react-popper`, `react-slick`, `react-dnd`, `react-dnd-html5-backend` no existen en package.json

### ~~5.3 Cero Virtualización de Listas~~ ❌ CORREGIDO
- **Estado**: ❌ **FALSO** — `@tanstack/react-virtual` v3.13.0 está instalado y en uso (AxonAIAssistant)
- **Matiz**: Aún falta virtualización en varias listas largas (flashcard grids, leaderboard, XP history)

### ~~5.4 `motion/react` Chunk Mismatch~~ ❌ FALSO
- **Estado**: ❌ **FALSO** — `'motion'` en manualChunks captura correctamente `motion/react` (subpath del mismo paquete npm)

### 5.5 `@tiptap/*` y `@mux/*` Sin Manual Chunks ✅

### 5.6 Event Listener Global Nunca Removido ✅

### 5.7 NUEVO: `next-themes` en Proyecto No-Next.js — Media
- **Detalle**: `sonner.tsx` importa `useTheme` de `next-themes` pero este es un proyecto Vite+React. `useTheme()` retorna `{ theme: undefined }` → fallback a `"system"`. Dependencia muerta que agrega al bundle
- **Fix**: Remover `next-themes` y hardcodear theme en sonner

---

## 6. ARQUITECTURA DE CÓDIGO (P1)

### 6.1 Componentes Oversized (>300 líneas) ⚠️ ACTUALIZADO
- **Top offenders verificados**:
  | Líneas | Archivo | Estado |
  |--------|---------|--------|
  | 1,276 | `OwnerMembersPage.tsx` | ✅ Confirmado |
  | 1,186 | `StudyOrganizerWizard.tsx` | ✅ Confirmado |
  | 1,104 | `AxonAIAssistant.tsx` | ⚠️ Era 1,032 → ahora 1,104 (creció) |
  | 861 | `TipTapEditor.tsx` | ✅ Confirmado |
  | ~~1,480~~ | ~~`FlashcardsManager.tsx`~~ | ❌ **REFACTORIZADO a 135 líneas** |

### 6.2 205 Usos de `any` en 75 Archivos ⚠️ ACTUALIZADO
- **Dato corregido**: Era "142 en 40 archivos" → realidad es **205 en 75 archivos** (peor de lo reportado)
- **71 `catch (err: any)`** cuando ya existe `getErrorMessage()` utility (solo 3 archivos la importan)

### 6.3 Interfaces `Course`/`Topic` Triplicadas ✅

### 6.4 Import Fantasma `@/app/data/courses` ✅

### 6.5 Hooks Colocados en `components/student/` en vez de `hooks/` ✅

### 6.6 NUEVO: 813 Instancias de `fontWeight` Inline — Media
- **Detalle**: 813 `fontWeight:` en 123 archivos TSX — mezcla masiva de inline styles con Tailwind classes
- **Impacto**: Imposible auditar/overridear pesos tipográficos consistentemente

### 6.7 NUEVO: 13 TODOs No Resueltos — Baja
- **Detalle**: Incluye 5 TODOs en GamificationContext (stub completo), legacy-stubs.ts pendiente de borrado, flashcardsDue hardcoded a 0, ErrorBoundary esperando logger P0-03

### 6.8 NUEVO: `legacy-stubs.ts` con Funciones Stub Activas — Baja
- **Detalle**: 129 líneas de funciones que retornan arrays vacíos/null, marcado para borrar pero aún importado

---

## 7. QUIZ MODULE UX (P2)

### 7.1 Sin Confirmación de Salida — Datos Perdidos — CRÍTICO ✅
- **Archivos**: `QuizTaker.tsx:89`, `QuizTopBar.tsx:86-91`

### 7.2 Answer Checking Poco Confiable (substring match) ✅
- **Archivo**: `quiz-utils.ts:37-46`

### 7.3 Countdown Auto-Submit Sin Warning ✅

### 7.4 QuizScoreCircle Ignora Prop `color` ✅
- **Verificado**: `color` se destructura pero NUNCA se usa en JSX. Gradient hardcoded a teal

### 7.5 QuizOverview Usa Datos de Progreso Falsos ✅
- **Verificado**: `PLACEHOLDER_PROGRESS` confirmado en quiz-helpers.ts

### 7.6 Sin Shortcuts de Teclado para Submit/Next ✅
- **Verificado**: 0 keyboard handlers en QuizBottomBar y QuizTaker

### 7.7 Glassmorphism en QuizXpConfirmedCard (Violación DS) ✅

---

## 8. FLASHCARD MODULE UX (P2)

### 8.1 Dos Flujos de Review Compitiendo ⚠️ MATIZADO
- **Flow A** (`FlashcardSessionScreen`): SÍ tiene animaciones (opacity/y con Framer Motion, AnimatePresence), pero NO flip 3D, fondo oscuro
- **Flow B** (`FlashcardReviewer`): 3D flip, 6 tipos de card, XP/combo, fondo claro
- **Corrección**: Flow A no es "texto plano" — tiene reveal animations, pero sigue siendo inferior a Flow B

### 8.2 SmartFlashcardGenerator en Portugués ✅

### 8.3 AI Generator Retorna Arrays Vacíos (Deprecated) ✅
- **Verificado**: Header del archivo confirma explícitamente "DEPRECATED (returns [])"

### 8.4 Dos Escalas de Rating en Conflicto ✅
- **Verificado**: RATINGS (5-point) y GRADES (4-point) coexisten en flashcard-types.ts

### 8.5 Sin Undo/Skip en Review ✅

### 8.6 Sin Feedback de Próxima Revisión ✅

### 8.7 Streak Counter Siempre 0 ✅
- **Verificado**: `FlashcardHubScreen.tsx:82` hardcoded `streakDays: 0`

### 8.8 Bulk Import Envía N POSTs Individuales ✅
- **Verificado**: for-loop secuencial sin batching en `FlashcardBulkImport.tsx:368-389`

---

## 9. FORMULARIOS (P2)

### 9.1 3 Modales Sin `<form>` Tag ✅
- **Verificado**: KeywordFormDialog, QuizFormModal, QuestionFormModal — todos usan `onClick` sin `<form>`

### 9.2 LoginPage Sin Autofocus ✅

### 9.3 Signup Success Message Invisible ✅
- **Verificado**: `setSuccess()` y `navigate()` en mismo tick; además, auto-login trigger redirect guard

### 9.4 Sin Validación Inline ✅

### 9.5 Indicadores de Campo Requerido Inconsistentes ✅

### 9.6 `window.confirm()` en 5 Lugares ⚠️ CORREGIDO
- **Dato corregido**: Son **5 lugares** (no 11): ReviewSessionView, FlashcardReviewer, FlashcardFormModal (2×), PinEditor
- **`ConfirmDialog` ya adoptado** en 7 archivos (FlashcardsManager, KeywordConnectionsPanel, etc.)

### 9.7 Deletes de Notas Sin Confirmación ✅

### 9.8 NUEVO: `react-hook-form` Instalado pero Sin Consumidores
- **Detalle**: Solo `ui/form.tsx` (shadcn boilerplate) lo importa. Cero formularios de la app lo usan
- **Fix**: O adoptar para formularios complejos (ej: StudyOrganizerWizard), o remover la dependencia

---

## 10. ONBOARDING & DISCOVERY (P1)

### 10.0 Cero Flujos de Onboarding — CRÍTICO ✅
- **Verificado**: Grep para onboarding/tutorial/tour/walkthrough = 0 en componentes auth

### 10.1 5/8 Páginas de Profesor Son Placeholders — CRÍTICO ✅

### 10.2 6/6 Páginas de Admin Son Placeholders — CRÍTICO ⚠️ PEOR
- **Dato corregido**: Son **6 de 6** placeholders (no 5/7). Dashboard, Members, Content, Scopes, Reports, Settings — TODOS `lazyPlaceholder`

### 10.3 8/8 Páginas de Owner Son Placeholders — CRÍTICO ✅
- **Verificado**: Todos los 8 owner routes usan `lazyPlaceholder`. Componentes reales (OwnerMembersPage, OwnerPlansPage, etc.) existen pero NO están wired

### 10.4 Sin Discovery de Features AI ✅

### 10.5 FSRS y BKT Sin Explicación ✅

### 10.6 Welcome View Muestra Stats en Cero Sin Contexto ✅

### 10.7 Sin Progressive Disclosure ✅

### 10.8 Hardcoded Avatar en UserProfileDropdown ✅
- **Verificado**: URL de Unsplash hardcoded, `user.avatarUrl` completamente ignorado

### 10.9 Sin Redirect-After-Login para Signup ⚠️
- **Matiz**: Login SÍ preserva `location.state`, pero signup siempre navega a `/`

---

## 11. RESPONSIVE & VISUAL (P2)

### 11.1 Sidebars de Ancho Fijo Rompen Mobile ✅
- **Verificado**: `QuizSelection.tsx:335` — `w-[340px] shrink-0` sin breakpoints

### 11.2 Stats Sidebar de Flashcards Hidden en Mobile ✅

### 11.3 Review Mode Indistinguible de Quiz Activo ✅

### 11.4 Topic Sidebar Breakpoint Mismatch ✅
- **Verificado**: TopicSidebarRoot usa `md:`, StudentLayout usa `lg:` — conflicto entre 768-1024px

### 11.5 MobileDrawer Sin Soporte Escape Key ✅
- **Verificado**: 0 `onKeyDown`/Escape handlers en 111 líneas

---

## 12. DATOS & ESTADO (P2)

### 12.0 Estado Duplicado: Dos Fuentes de Verdad ⚠️ PARCIALMENTE ACTUALIZADO
- **12.0a `currentTopic` vs `selectedTopicId`**: `currentTopic` vive en `NavigationContext` (no AppContext directamente), pero sigue siendo fuente de verdad separada de `selectedTopicId` en ContentTreeContext
- **12.0b `studyPlans` duplicado**: ✅ Confirmado — AppContext.StudySessionProvider Y StudyPlansContext mantienen listas separadas
- **12.0c Memoización rota**: ✅ Confirmado en StudyTimeEstimatesContext y TopicMasteryContext
- **12.0d Sin URL state**: ✅ Confirmado — 0 filtros/sort en URL
- **Nota positiva**: AppContext fue refactorizado en 3 providers separados (UIContext, NavigationContext, StudySessionProvider) — ya no es "kitchen sink"

### 12.1 Cero Supabase Realtime ✅

### 12.2 Sin Resolución de Conflictos para Edición Concurrente ✅

### 12.3 Flashcard Engine Sin Rollback en Fallo de Batch ✅

### 12.4 Sin Notificaciones Push ✅

### 12.5 Gamification Query Keys No en Central `queryKeys.ts` ✅
- **Verificado**: `useGamification.ts` define keys locales, `queryKeys.ts` no tiene "gamification"

### 12.6 Missing Gamification Invalidations ✅
- **Verificado**: `dailyCheckIn` solo invalida streak+profile, no xpHistory/badges/leaderboard

### 12.7 StudentDataContext Fetch-Once Sin Auto-Refresh ✅
- **Verificado**: `hasAttemptedLoad.current` previene re-fetch

### 12.8 Module-Level Cache en useStudyQueueData ✅

### 12.9 3D Model localStorage Nunca Limpiado ✅

---

## 13. TESTING (P1)

### 13.0 Cobertura de Tests: ~4% ⚠️ ACTUALIZADO
- **Dato corregido**: **25 archivos de test** (no 18) para ~627 archivos fuente = ~4% (no 3%)
- **2 component tests** (StudyHubHero + context-split), no 1
- **Sin E2E**: ✅ Confirmado — no Cypress, no Playwright
- **Sin a11y tests**: ✅ Confirmado — no jest-axe, no @axe-core/react

### 13.1 Paths Críticos Sin Tests — CRÍTICO ✅
- `api.ts` (apiCall) — no direct tests (solo mocked en otros tests)
- `AuthContext.tsx`, `RequireAuth.tsx`, `RequireRole.tsx` — cero tests
- `fsrs-engine.ts` — cero tests

### 13.2 Lo Que SÍ Está Bien Testeado ✅

---

## 14. INTERNACIONALIZACIÓN (P2)

### 14.0 Sin Librería i18n ✅

### 14.1 Mezcla Caótica de Idiomas ✅

### 14.2 4 Locales Diferentes para Fechas ✅
- **Verificado**: `'es'`, `'es-MX'`, `'es-ES'`, `'pt-BR'` todos presentes

### 14.3 Pluralización Manual y Frágil ✅
- **Verificado**: `StudentDataPanel.tsx:379` literalmente muestra `sessão(ões)`

---

## 15. TIPOGRAFÍA & ESPACIADO (P3)

### 15.1 Sin Jerarquía de Heading Estandarizada ✅
- **Verificado**: typography.ts no define h1-h6

### 15.2 813 Instancias de `fontWeight` Inline ⚠️ CORREGIDO
- **Dato corregido**: Son **813** instancias en 123 archivos (no 60+ — 13x más de lo reportado originalmente)

### 15.3 5+ Valores de `lineHeight` Inline Sin Escala ✅

### 15.4 14 Tamaños de Fuente Arbitrarios en Píxeles ⚠️
- **Dato corregido**: 14 tamaños distintos (no 15+), rango va hasta `text-[80px]` (no 72px)

---

## 16. GAMIFICACIÓN (P2) — NUEVA SECCIÓN

### 16.1 GamificationContext es STUB Completo — CRÍTICO ✅
- **Detalle**: `refresh()`, `triggerBadgeCheck()`, `dismissLevelUp()`, `dismissNewBadges()` son no-ops
- **Impacto**: Quiz results NUNCA muestra badges/level-up reales (useQuizGamificationFeedback depende de este stub)

### 16.2 Level Names Inconsistentes Entre Archivos — Alta ✅
- **Verificado**: `xp-constants.ts` usa nombres genéricos (Estudiante, Conocedor, Experto...), `gamification.ts` usa nombres médicos (Interno, Residente Jr., Especialista...)
- **Solo niveles 1-2 coinciden** (Novato, Aprendiz)

### 16.3 BadgeEarnedToast y LevelUpCelebration Son Stubs ✅
- **Verificado**: Ambos etiquetados "STUB" con TODO para Sprint G5. Funcionales pero básicos

### 16.4 Sin XP Feedback para Lectura/Video ✅
- **Verificado**: XPPopup solo en FlashcardReviewer y ReviewSessionView

### 16.5 Daily Check-in Dispara en 3 Lugares ✅
- **Verificado**: useGamification, useSessionXP, GamificationCard — redundante

### 16.6 Sin Notification Center Persistente ✅

### 16.7 Sin Confetti Library ✅

---

## 17. AI FEATURES (P2) — NUEVA SECCIÓN

### 17.1 VoiceCallPanel Sin summaryId — Alta ✅
- **Verificado**: `AxonAIAssistant.tsx:449` renderiza `<VoiceCallPanel />` sin pasar summaryId

### 17.2 ScriptProcessorNode Deprecated — Alta ✅
- **Verificado**: `useRealtimeVoice.ts:124` usa `createScriptProcessor` (deprecated Web Audio API)

### 17.3 Flashcard Gen: 5 Calls Secuenciales Sin Progreso — Alta ✅
- **Verificado**: Loop 1-5 sin `setGeneratedCards` intermedio

### 17.4 3 Hooks AI Sin Consumidores (Dead Code) ✅
- **Verificado**: `useSmartGeneration`, `useQuickGenerate`, `useAdminAiTools` — 0 imports cada uno

### 17.5 useAiReports Sin Consumidores ✅

### 17.6 RAG Strategy Nunca Expuesta en UI ⚠️
- **Matiz**: No está "hardcoded" — es un parámetro opcional que simplemente nunca se pasa desde la UI

---

## PLAN DE ACCIÓN RECOMENDADO (ACTUALIZADO)

### Sprint 1 — Quick Wins (1-2 días)
1. ~~✂️ Remover dependencias fantasma: MUI, Emotion, Popper, Slick, react-dnd~~ ✅ YA HECHO
2. 🔌 Conectar `withBoundary` en las 21+ rutas lazy
3. 🏷️ Agregar `aria-label` a los 35+ botones icon-only
4. 🔑 Agregar link "¿Olvidaste tu contraseña?" + flujo básico
5. ⌨️ Wrap 3 modales en `<form>` tags
6. 🎯 Agregar `autofocus` a LoginPage
7. 🔄 Agregar `queryClient.clear()` en logout
8. 🧹 Remover `next-themes` (innecesario)

### Sprint 2 — Seguridad & Estabilidad (3-5 días)
9. 🔐 Interceptor 401 en `apiCall()` con refresh/redirect
10. 🌐 Hook `useOnlineStatus` + banner offline global
11. ❌ Confirmación de salida en QuizTaker y FlashcardReviewer
12. 📧 Verificación de email post-signup
13. 🔄 Mapeo de errores Supabase inglés → español
14. 🛡️ Fix race conditions en QuizSelection.tsx async fetches
15. 🧹 Limpiar 37 console.log de producción

### Sprint 3 — Design System Cleanup (1 semana)
16. 🎨 Reconciliar design-system vs design-kit (button radius, fadeUp)
17. 📐 Revisar regla de font-size: permitir Tailwind scale, prohibir solo arbitrarios
18. 🔤 Estandarizar heading font: Georgia via `headingStyle`
19. 📏 Definir escala de headings h1-h4 en `typography.ts`
20. 🎭 Clarificar regla de colores: documentar excepciones de rol-accent

### Sprint 4 — UX Polish (1 semana)
21. 🃏 Unificar flujos de flashcard review (Flow A → Flow B)
22. 🔒 Focus traps en modales custom (o migrar a Radix Dialog)
23. 📱 Responsive fixes: sidebars de ancho fijo, breakpoint mismatch
24. 🇪🇸 Traducir SmartFlashcardGenerator de portugués a español
25. ✅ Reemplazar `window.confirm()` con `ConfirmDialog` (5 lugares)
26. 🔗 Wiring de owner-routes a componentes reales

### Sprint 5 — Arquitectura (1-2 semanas)
27. 📦 Descomponer componentes >500 líneas (OwnerMembersPage, StudyOrganizerWizard, AxonAIAssistant)
28. 🏷️ Reemplazar `catch (err: any)` con `getErrorMessage()` (71 lugares)
29. 📡 Evaluar Supabase Realtime para contenido profesor→estudiante
30. 🧪 Agregar `role="progressbar"` + ARIA a progress components
31. 📋 Consolidar interfaces `Course`/`Topic` triplicadas
32. 🔄 Migrar `StudentDataContext` fetch a React Query
33. 🎮 Implementar GamificationContext real (reemplazar stub)
34. 🏷️ Unificar level names (xp-constants vs gamification)

---

## MÉTRICAS CLAVE (ACTUALIZADAS)

| Métrica | Valor Original | Valor Auditado | Target |
|---------|---------------|----------------|--------|
| Componentes >500 líneas | 12 | ~10 (FlashcardsManager refactorizado) | 0 |
| `catch (err: any)` | 65+ | **71** | 0 |
| `any` type usage | 142 en 40 | **205 en 75 archivos** | <20 |
| `fontWeight` inline | 60+ | **813 en 123 archivos** | <50 |
| Botones sin aria-label | 35+ | 35+ (confirmado) | 0 |
| Focus traps | 7+ missing | **0 en todo codebase** | Todos los modales |
| `window.confirm()` | 11 | **5** | 0 |
| Rutas sin ErrorBoundary | 21+ | 21+ (confirmado) | 0 |
| Deps no usadas | 7 paquetes | **1** (next-themes) | 0 |
| Virtualización | 0 | **1** (AxonAIAssistant) | 5+ listas |
| console.log producción | No medido | **37 en 14 archivos** | 0 |
| Owner routes funcionales | ? | **0/8** (todos placeholder) | 8/8 |
| Professor routes funcionales | ? | **3/8** | 8/8 |
| Admin routes funcionales | ? | **0/6** (todos placeholder) | 6/6 |
| Supabase Realtime channels | 0 | 0 (confirmado) | 3-5 |
| Design system adoption | ~16% | ~16% (confirmado) | >80% |

---

## ARCHIVOS MÁS PROBLEMÁTICOS (Top 10 — ACTUALIZADO)

| Archivo | Líneas | Issues |
|---------|--------|--------|
| `OwnerMembersPage.tsx` | 1,276 | Monolítico, sin error boundary, delete scope sin confirm |
| `StudyOrganizerWizard.tsx` | 1,186 | Sin error boundary, sin step indicator visual |
| `AxonAIAssistant.tsx` | 1,104 | Space Grotesk, sin error boundary, outline-none, VoiceCall sin summaryId |
| `TipTapEditor.tsx` | 861 | Autosave/Ctrl+S race, sin beforeunload, eslint-disable |
| `gamificationApi.ts` | ~350 | 15 funciones que tragan errores silenciosamente |
| `useStudyPlans.ts` | ~630 | 18 console.log sin guardia DEV |
| `GamificationContext.tsx` | 114 | STUB completo — quiz feedback loop es no-op |
| `QuizSelection.tsx` | 749 | Sidebar fija 340px, race conditions en fetch, `any` types |
| `SmartFlashcardGenerator.tsx` | ~400 | Portugués, gradient prohibido, API deprecated que retorna [] |
| `KnowledgeHeatmapView.tsx` | ~400 | Fecha hardcoded Feb 2026, div onClick sin keyboard, Space Grotesk |

---

*Diagnóstico generado por 30 agentes Opus + auditado por 10 agentes de verificación cruzada contra main. Ningún archivo fue modificado.*
*4 items marcados como ~~corregidos~~. 7 datos numéricos corregidos. 3 secciones nuevas agregadas (Gamificación, AI, nuevos hallazgos).*
