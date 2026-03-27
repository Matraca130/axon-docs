# CALENDAR_MANIFEST.md
# Axon/Seeki — Sesión de Calendario v2
# Documento Maestro de Ejecución (Agentes + Schedule)

> **Cómo usar este documento:**
> - Al iniciar una sesión: buscar la sección correspondiente, leer PRERREQUISITOS y TAREAS
> - Al terminar una tarea: cambiar `[ ]` a `[x]` y escribir nota en la sección "Notas del agente"
> - Al terminar una sesión: cambiar `status:` de `PENDING` a `DONE` y llenar `completed:`
> - **NO saltear validaciones de salida** — son el criterio de merge
> - Este archivo es la fuente de verdad. Si hay conflicto con otro doc, este gana.

---

## DASHBOARD DE ESTADO (actualizar al cerrar cada sesión)

| Sesión | Nombre | Status | Agente | Iniciado | Completado | Días est. |
|--------|--------|--------|--------|----------|------------|-----------|
| S-0A   | Backend DB + API | `PENDING` | — | — | — | 1.5d |
| S-0B   | Frontend Hooks + PoC | `PENDING` | — | — | — | 1.5d |
| S-1    | CalendarView + DayCell + Skeleton | `PENDING` | — | — | — | 3d |
| S-2    | ExamPanel + CRUD | `PENDING` | — | — | — | 2d |
| S-3    | Countdown + Finals Week | `PENDING` | — | — | — | 1.5d |
| S-4    | Mobile Polish + Dark Mode | `PENDING` | — | — | — | 2d |
| S-QA   | QA Checklist (22 checks) | `PENDING` | — | — | — | 1.5d |

**TOTAL ESTIMADO: ~17 días calendario (13 días hábiles + buffer 30%)**
**BRANCH: `feat/calendar-v2`**
**REPOS: `Matraca130/axon-backend` + `Matraca130/numero1_sseki_2325_55`**

---

## GATES PRE-SPRINT (resolver ANTES de S-0A)

> Si algún gate queda `[ ]`, NO arrancar la sesión que lo requiere.

- [ ] **G-01** — `exam_events` existe en DB? (`SELECT * FROM information_schema.tables WHERE table_name = 'exam_events'`)
  - Resultado: ___________________
- [ ] **G-02** — Definición de "día completado" para streak
  - Decisión tomada: `[ ] A: cualquier actividad` `[ ] B: >=1 sesión` `[ ] C: >=30 min`
  - Documentado en CLAUDE.md del repo: `[ ]`
- [ ] **G-03** — PoC react-day-picker overlay (se hace en S-0B)
  - Resultado: `[ ] PASSED — overlay funciona` `[ ] FAILED — usar fallback border-bottom`
- [ ] **G-04** — Índices en `fsrs_states` y `study_plan_tasks` verificados
  - EXPLAIN ANALYZE ejecutado: `[ ]`
  - ¿Seq Scan? `[ ] SÍ — agregar índice en S-0A` `[ ] NO — ok`
- [ ] **G-05** — Endpoint confirmado como `GET /calendar/data` (no POST)
  - Confirmado con equipo: `[ ]`

---

## ADICIONES NO-NEGOCIABLES (todas deben estar `[x]` antes de S-QA)

- [ ] **A-01** `useMediaQuery` hook con SSR guard → implementar en **S-0B**
- [ ] **A-02** Split `useCalendar` en 3 hooks → implementar en **S-0B** (obligatorio)
- [ ] **A-03** `CalendarSkeleton` component → implementar en **S-1**
- [ ] **A-04** `aria-label` en DayCells → implementar en **S-1**
- [ ] **A-05** RLS policy para Profesor en SQL → implementar en **S-0A**

---

## SESIÓN S-0A — Backend: DB + API Base

```
status: PENDING
agent: —
worktree: C:\dev\axon\backend-feat-calendar-v2  (crear con worktree.sh)
branch: feat/calendar-v2
started: —
completed: —
```

### Prerrequisitos
- [ ] G-01 resuelto (saber si exam_events existe)
- [ ] G-04 resuelto (índices verificados)
- [ ] Worktree creado: `source /c/dev/axon/worktree.sh backend feat/calendar-v2`

### Tareas

#### DB Migration
- [ ] Ejecutar SQL: `CREATE TABLE IF NOT EXISTS exam_events (...)` (ver Sección SQL abajo)
- [ ] Verificar tabla creada: `SELECT COUNT(*) FROM exam_events`
- [ ] Crear índice `idx_exam_events_student_date`
- [ ] Crear índice `idx_fsrs_student_due`
- [ ] Crear índice `idx_tasks_student_date` (WHERE completed = false)

#### RLS Policies
- [ ] `ALTER TABLE exam_events ENABLE ROW LEVEL SECURITY`
- [ ] Policy `exam_student_all` — estudiante full control sobre sus datos
- [ ] **[A-05]** Policy `exam_professor_read` — profesor ve exam_events de sus cursos (SELECT only)
- [ ] Verificar RLS con 2 JWTs distintos

#### Endpoint GET /calendar/data
- [ ] Crear route en Hono: `GET /calendar/data`
- [ ] Query params: `from=YYYY-MM-DD`, `to=YYYY-MM-DD`, `types=all`
- [ ] Implementar `Promise.all()` con las 3 queries internas:
  - [ ] Query 1: `exam_events` del rango
  - [ ] Query 2: `fsrs_states` (heatmap datos)
  - [ ] Query 3: `study_plan_tasks` (tareas pendientes)
- [ ] Circuit breaker: timeout 8s, fallback a arrays vacíos por query
- [ ] Response shape: `{ events: [], heatmap: [], tasks: [] }`

#### Tests
- [ ] `deno test supabase/functions/server/tests/` — todo PASSED
- [ ] Test RLS: estudiante A no ve datos de B
- [ ] Test RLS: profesor ve exam_events de sus cursos
- [ ] Benchmark: p95 latencia <400ms con 100 registros por tabla

### Validaciones de salida (BLOQUEANTES — no cerrar sesión sin esto)
- [ ] `curl GET /calendar/data?from=2026-04-01&to=2026-04-30` → 200 con shape correcto
- [ ] RLS estudiante: ✅
- [ ] RLS profesor: ✅
- [ ] p95 <400ms: ✅
- [ ] deno test: ✅

### Notas del agente
> _(el agente escribe acá al cerrar la sesión)_

---

## SESIÓN S-0B — Frontend: Hooks Base + PoC

```
status: PENDING
agent: —
worktree: C:\dev\axon\frontend-feat-calendar-v2  (crear con worktree.sh)
branch: feat/calendar-v2
started: —
completed: —
```

### Prerrequisitos
- [ ] G-02 resuelto (definición de streak)
- [ ] G-03 listo para ejecutar (PoC se hace acá)
- [ ] Worktree creado: `source /c/dev/axon/worktree.sh frontend feat/calendar-v2`

### Tareas

#### [A-01] useMediaQuery hook
- [ ] Crear `src/hooks/useMediaQuery.ts`
- [ ] Acepta breakpoint en px (ej: `768`)
- [ ] SSR guard: `if (typeof window === 'undefined') return false`
- [ ] Usa `window.matchMedia`, NO `window.innerWidth`
- [ ] Cleanup en useEffect (`removeEventListener`)
- [ ] Test: retorna `false` en SSR (no crash)

#### [A-02] Split useCalendar → 3 hooks
- [ ] Crear `src/hooks/useCalendarEvents.ts`
  - [ ] React Query, `GET /calendar/data?from&to&types=all`
  - [ ] `staleTime: 5 * 60 * 1000`
  - [ ] Retorna: `{ events, heatmap, tasks, isLoading, error }`
- [ ] Crear `src/hooks/useCalendarUI.ts`
  - [ ] `viewMode: 'month' | 'week' | 'agenda'` (useState)
  - [ ] `selectedDate: Date` (useState)
  - [ ] `useSearchParams` para `examId` (React Router)
  - [ ] `openExam(id)`, `closeExam()`
- [ ] Crear `src/hooks/useHeatmap.ts`
  - [ ] Acepta `events` de `useCalendarEvents`
  - [ ] Lógica derivada PURA (sin fetch)
  - [ ] Retorna `HeatmapDay[]` con `level 0-4` y `label` texto

#### Constantes y tokens
- [ ] Crear `src/lib/calendar-constants.ts`
  - [ ] `ZINDEX = { overlay: 10, streak: 20, panel: 100, drawer: 200 }`
  - [ ] `EVENT_COLORS` con clases Tailwind ESTÁTICAS (sin template literals)
  - [ ] `HEATMAP_CLASSES` array

#### [G-03] PoC overlay
- [ ] Crear `src/components/calendar/__tests__/OverlayPoC.tsx`
- [ ] Renderizar react-day-picker con DayContent custom + div `position:absolute`
- [ ] Verificar que el div se posiciona sobre la celda sin desplazar layout
- [ ] Resultado del PoC: `[ ] PASSED` `[ ] FAILED → activar fallback`
- [ ] Si FAILED: documentar fallback elegido acá: ___________________

### Validaciones de salida (BLOQUEANTES)
- [ ] `npm run build` — 0 errores TypeScript
- [ ] `useMediaQuery(768)` no crashea en SSR
- [ ] React Query dedup: mismo rango, 2 componentes = 1 fetch
- [ ] PoC overlay: resultado documentado arriba
- [ ] `ZINDEX` y `EVENT_COLORS` exportados sin template literals dinámicos

### Notas del agente
> _(el agente escribe acá al cerrar la sesión)_

---

## SESIÓN S-1 — CalendarView + DayCell + Skeleton

```
status: PENDING
agent: —
worktree: C:\dev\axon\frontend-feat-calendar-v2
branch: feat/calendar-v2
started: —
completed: —
```

### Prerrequisitos
- [ ] S-0A DONE
- [ ] S-0B DONE (hooks disponibles, PoC resuelta)

### Tareas

#### CalendarView.tsx
- [ ] Crear `src/components/calendar/CalendarView.tsx`
- [ ] react-day-picker como base con DayCell custom
- [ ] Usa `useCalendarEvents` + `useCalendarUI` + `useHeatmap` (de S-0B)
- [ ] Navegación mes (prev/next buttons)
- [ ] `useMediaQuery(768)` para detectar mobile (NO `window.innerWidth`)
- [ ] Condicional: mobile → max 1 badge + overflow "+N"

#### WeekView.tsx (componente independiente)
- [ ] Crear `src/components/calendar/WeekView.tsx` — archivo SEPARADO
- [ ] 7 columnas, scroll horizontal en mobile (`scroll-snap-x`)
- [ ] Acepta: `events[]`, `selectedDate`, `onDaySelect`
- [ ] NO inline en CalendarView

#### DayCell.tsx
- [ ] Crear `src/components/calendar/DayCell.tsx`
- [ ] Heatmap overlay: `position:absolute`, `inset:0`, `pointer-events:none`, `zIndex: ZINDEX.overlay`
- [ ] Streak dot: div 6px círculo verde, `position:absolute`, `zIndex: ZINDEX.streak`
- [ ] **[A-04]** `aria-label`: formato `"Lunes 3 de marzo, 2 eventos"`

#### EventBadge.tsx
- [ ] Crear `src/components/calendar/EventBadge.tsx`
- [ ] Desktop: badge normal con color de evento
- [ ] **Mobile CRÍTICO**: `min-h-[44px]` siempre
- [ ] Si >1 evento en celda mobile: badge "+N" de overflow
- [ ] Tap en badge → abrir bottom sheet con lista completa

#### [A-03] CalendarSkeleton.tsx
- [ ] Crear `src/components/calendar/CalendarSkeleton.tsx`
- [ ] 7 columnas de celdas grises animadas (`animate-pulse`)
- [ ] Mismo aspect ratio que CalendarView real
- [ ] Mostrar mientras `isLoading=true` en `useCalendarEvents`

#### Integraciones
- [ ] `useSearchParams` para `selectedExam` (ADR-03) — NO `useState`
- [ ] Focus management: `focus()` al abrir Sheet/Drawer
- [ ] Focus management: retornar foco al trigger al cerrar

### Validaciones de salida (BLOQUEANTES)
- [ ] `npm run build` — 0 errores TS
- [ ] EventBadge mobile ≥44px (medido en DevTools)
- [ ] CalendarSkeleton visible con "Slow 3G" throttle
- [ ] `aria-label` correcto en DOM (inspeccionar)
- [ ] Deep link `?examId=abc123` → panel abre automáticamente
- [ ] WeekView es archivo separado (verificar que NO está inline)

### Notas del agente
> _(el agente escribe acá al cerrar la sesión)_

---

## SESIÓN S-2 — ExamPanel + Formulario CRUD

```
status: PENDING
agent: —
worktree: C:\dev\axon\frontend-feat-calendar-v2
branch: feat/calendar-v2
started: —
completed: —
```

### Prerrequisitos
- [ ] S-1 DONE y validaciones pasando

### Tareas

#### ExamDetailsPanel.tsx
- [ ] Crear `src/components/calendar/ExamDetailsPanel.tsx`
- [ ] Desktop: shadcn `Sheet` (panel lateral)
- [ ] Mobile: shadcn `Drawer` (bottom sheet)
- [ ] Detectar via `useMediaQuery(768)`
- [ ] **CRÍTICO mobile** — footer locked:
  ```jsx
  <div className="sticky bottom-0 bg-white border-t p-4">
    <Button className="w-full">Editar examen</Button>
  </div>
  ```
- [ ] Header: título + countdown badge + botón X
- [ ] Countdown colors: verde >14d, amber 7-14d, rojo <7d

#### ExamForm.tsx
- [ ] Crear `src/components/calendar/ExamForm.tsx`
- [ ] Campos: `title`, `date`, `time`, `location`, `course_id`, `is_final`, `exam_type`
- [ ] Validación Zod + react-hook-form
- [ ] Submit → `POST/PATCH /exam-events`
- [ ] On success: `invalidateQueries(['calendar-data'])`
- [ ] DELETE con `shadcn AlertDialog` de confirmación

#### HeatmapTooltip.tsx
- [ ] Crear `src/components/calendar/HeatmapTooltip.tsx`
- [ ] Desktop: tooltip en hover
- [ ] Mobile: long-press 300ms
- [ ] **WCAG 1.4.1**: texto `"Carga: baja | media | alta | máxima"` (no solo color)

### Validaciones de salida (BLOQUEANTES)
- [ ] Footer visible en iPhone SE 375px sin scroll
- [ ] HeatmapTooltip muestra texto descriptivo (no solo color)
- [ ] CRUD completo: crear/editar/eliminar refrescan calendario sin refresh
- [ ] AlertDialog antes de delete
- [ ] `npm run build` — 0 errores TS

### Notas del agente
> _(el agente escribe acá al cerrar la sesión)_

---

## SESIÓN S-3 — Countdown + Finals Week Mode

```
status: PENDING
agent: —
worktree: C:\dev\axon\frontend-feat-calendar-v2
branch: feat/calendar-v2
started: —
completed: —
```

### Prerrequisitos
- [ ] S-2 DONE

### Tareas

#### CountdownWidget.tsx
- [ ] Crear `src/components/calendar/CountdownWidget.tsx`
- [ ] Lista de próximos `exam_events` ordenados por fecha ASC
- [ ] Datos de `useCalendarEvents` (no fetch propio — reusar cache)
- [ ] Filtrar: `date >= hoy`
- [ ] Máximo 5 items + "ver todos" si hay más
- [ ] Badge de días restantes con color semáforo

#### useFinalsWeek.ts
- [ ] Crear `src/hooks/useFinalsWeek.ts`
- [ ] Acepta `events[]`
- [ ] Retorna `Set<string>` de ISO weeks con ≥2 `exam_events` con `is_final=true`

#### CalendarView.tsx — modificar (no reescribir)
- [ ] Importar `useFinalsWeek`
- [ ] Si semana está en el Set → clase `'bg-red-50 ring-1 ring-red-200'`
- [ ] Animación `pulse` SOLO en badge del countdown (NO en celdas)

### Validaciones de salida (BLOQUEANTES)
- [ ] CountdownWidget muestra eventos en orden correcto
- [ ] Finals Week highlight CON 2 finales: ✅
- [ ] Finals Week NO highlight CON 1 solo final: ✅
- [ ] Animación pulse no causa layout shift (DevTools Performance)
- [ ] `npm run build` — 0 errores TS

### Notas del agente
> _(el agente escribe acá al cerrar la sesión)_

---

## SESIÓN S-4 — Mobile Polish + Dark Mode

```
status: PENDING
agent: —
worktree: C:\dev\axon\frontend-feat-calendar-v2
branch: feat/calendar-v2
started: —
completed: —
```

### Prerrequisitos
- [ ] S-3 DONE

### Tareas

#### Touch Target Audit sistemático
Verificar `min-h-[44px] min-w-[44px]` en mobile para CADA componente:
- [ ] `CalendarView` — nav buttons (prev/next mes)
- [ ] `DayCell` — cada celda tappable
- [ ] `EventBadge` — ya corregido en S-1, re-verificar
- [ ] `WeekView` — columnas de día
- [ ] `ExamDetailsPanel` — botón cerrar X + footer CTA
- [ ] `ExamForm` — todos los inputs y botones
- [ ] `CountdownWidget` — cada item de la lista

#### Swipe gesture
- [ ] Instalar `react-swipeable` si no existe
- [ ] `swipeLeft` → mes siguiente
- [ ] `swipeRight` → mes anterior
- [ ] Solo activar con `useMediaQuery(768)` (no en desktop)

#### Dark mode — CSS tokens
- [ ] Agregar a `globals.css` o `calendar.css`:
  ```css
  @layer base {
    :root {
      --cal-exam: #C0392B; --cal-recov: #E67E22;
      --cal-review: #2980B9; --cal-study: #27AE60;
      --cal-quiz: #F39C12; --cal-reading: #16A085;
      --heat-0: transparent; --heat-1: #EFF6FF;
      --heat-2: #BFDBFE; --heat-3: #60A5FA; --heat-4: #1D4ED8;
      --streak-active: #22C55E; --streak-freeze: #F59E0B;
    }
    .dark {
      --cal-exam: #F87171; --cal-review: #60A5FA; --cal-study: #4ADE80;
      --heat-1: #1E3A5F; --heat-2: #1E40AF; --heat-3: #1D4ED8; --heat-4: #312E81;
    }
  }
  ```
- [ ] Todos los componentes del calendario usan `var(--cal-*)` y `var(--heat-*)` (no hardcodeado)

#### WeekView scroll
- [ ] `scroll-snap-type: x mandatory` en container
- [ ] `scroll-snap-align: start` en cada columna de día

### Validaciones de salida (BLOQUEANTES)
- [ ] 0 elementos interactivos <44px en mobile (DevTools audit)
- [ ] Swipe funciona en emulador mobile de DevTools
- [ ] Dark mode: todos los colores usan CSS vars
- [ ] Contraste dark mode ≥3:1 en heatmap
- [ ] `npm run build` — 0 errores TS

### Notas del agente
> _(el agente escribe acá al cerrar la sesión)_

---

## SESIÓN S-QA — 22 Checks (no abrir PR sin esto)

```
status: PENDING
agent: —
repos: frontend + backend
branch: feat/calendar-v2
started: —
completed: —
```

### Prerrequisitos
- [ ] S-4 DONE
- [ ] Todas las ADICIONES NO-NEGOCIABLES `[x]`
- [ ] Todos los GATES PRE-SPRINT `[x]`

### QA Checklist — 22 checks

#### Build & Render
- [ ] QA-01 `npm run build` sin errores TypeScript
- [ ] QA-02 CalendarView renderiza con 0 eventos (estado vacío)
- [ ] QA-03 CalendarView renderiza con 50+ eventos (stress test)

#### Backend
- [ ] QA-04 `GET /calendar/data` → 200 con shape correcto
- [ ] QA-05 RLS: estudiante A no ve datos de estudiante B
- [ ] QA-06 ★ RLS: profesor ve exam_events de sus cursos

#### Frontend tokens
- [ ] QA-07 `EVENT_COLORS` — todas las clases Tailwind en CSS bundle (grep en `dist/`)
- [ ] QA-08 Heatmap con 0 eventos: nivel 0 en todas las celdas
- [ ] QA-09 Heatmap con 100 actividades: nivel 4 visible

#### Accesibilidad & Performance
- [ ] QA-10 ★ Touch target audit: todos ≥44px en mobile
- [ ] QA-11 ★ axe-core scan: 0 violations WCAG AA
- [ ] QA-12 ★ No hydration mismatch en console al cargar CalendarView
- [ ] QA-13 ★ React Query dedup: mismo rango, 2 componentes = 1 fetch (Network tab)

#### UX & Integración
- [ ] QA-14 ★ `?examId=xxx` → panel se abre automáticamente
- [ ] QA-15 CalendarSkeleton visible con Slow 3G throttle
- [ ] QA-16 ★ ExamDetailsPanel CTA visible sin scroll en 375px
- [ ] QA-17 ★ HeatmapTooltip muestra texto (no solo color)
- [ ] QA-18 ★ Dark mode heatmap contraste ≥3:1
- [ ] QA-19 ★ Timeout >8s → respuesta parcial, no error 500
- [ ] QA-20 ★ Tab navigation sin trampa de foco

#### Edge cases & Tests
- [ ] QA-21 Finals Week Mode con exactamente 2 finales (boundary test)
- [ ] QA-22 ★ vitest: hooks tests pasan (useCalendarEvents, useHeatmap)

### Resultado final
- QA pasados: ___ / 22
- Checks fallidos: ___________________
- OK para PR: `[ ] SÍ` `[ ] NO — faltan: ___`

### Notas del agente
> _(el agente escribe acá al cerrar la sesión)_

---

## SQL MIGRATION (referencia para S-0A)

```sql
-- ╔══════════════════════════════════════╗
-- ║  AXON Calendar v2 Migration          ║
-- ╚══════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS exam_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id      UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  date           DATE NOT NULL,
  time           TIME,
  location       TEXT,
  is_final       BOOLEAN DEFAULT true,
  exam_type      VARCHAR(50) DEFAULT 'written',
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_exam_events_student_date
  ON exam_events(student_id, date);
CREATE INDEX IF NOT EXISTS idx_fsrs_student_due
  ON fsrs_states(student_id, due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_student_date
  ON study_plan_tasks(student_id, scheduled_date) WHERE completed = false;

-- RLS Estudiante
ALTER TABLE exam_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY exam_student_all ON exam_events
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- RLS Profesor (★ A-05 — obligatorio v2)
CREATE POLICY exam_professor_read ON exam_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments ce
      WHERE ce.course_id = exam_events.course_id
        AND ce.user_id = auth.uid()
        AND ce.role = 'professor'
    )
  );
```

---

## DECISION LOG (agentes completan durante ejecución)

> Decisiones que modifiquen el plan DEBEN registrarse acá antes de implementar.

| ID | Decisión | Tomada por | Fecha | Impacta |
|----|----------|------------|-------|---------|
| D-01 | GET /calendar/data (no POST /batch) | Arquitecto | 2026-03-27 | S-0A, S-0B |
| D-02 | Split useCalendar en 3 hooks | Arquitecto | 2026-03-27 | S-0B, S-1 |
| D-03 | selectedExam → useSearchParams | Arquitecto | 2026-03-27 | S-1 |
| D-04 | PoC overlay resultado | _(agente S-0B)_ | — | S-1 |
| D-05 | Definición streak (G-02) | _(Petrick)_ | — | S-1, S-3 |

---

## RISK TRACKER (actualizar si se materializan)

| ID | Riesgo | Status | Acción tomada |
|----|--------|--------|---------------|
| R-01 | God-hook sin refactorizar | `MITIGADO` — split en S-0B obligatorio | — |
| R-02 | window.innerWidth hydration | `MITIGADO` — useMediaQuery en S-0B | — |
| R-03 | WeekView integration compleja | `MONITOREANDO` | Componente separado desde S-1 |
| R-04 | Batch timeout >8s | `MONITOREANDO` | Circuit breaker 8s en S-0A |
| R-05 | Tailwind class purge | `MITIGADO` — EVENT_COLORS estáticas | — |
| R-06 | Dark mode contraste insuficiente | `MONITOREANDO` | QA-18 lo verifica |

---

## CRITERIO DE ÉXITO (para PR a main)

- [ ] `npm run build`: 0 errores TypeScript
- [ ] 22/22 QA checks `[x]`
- [ ] Lighthouse Mobile: Performance ≥80, Accessibility ≥90
- [ ] No security comments abiertos en PR
- [ ] Revisión de Petrick aprobada

---

## INSTRUCCIÓN PARA CREAR SCHEDULE (ejecutar cuando todas las sesiones sean DONE)

```
Leer CALENDAR_MANIFEST.md completo. Para cada sesión:
- Tomar la fecha de 'started' y 'completed'
- Calcular duración real vs estimada
- Identificar dependencias (qué sesión requería cuál)
- Crear un schedule/Gantt con las fechas reales

Si alguna sesión está PENDING, usar los días estimados del DASHBOARD
para proyectar fechas futuras a partir de hoy.
```

---

*Última actualización: 2026-03-27 | Arquitecto: Petrick*
*Versión del plan: v2.0 (auditado por 4 agentes)*
