# PLAN: Creación de Flashcards por Estudiantes

> **Fecha:** 2026-03-27
> **Estado:** Propuesta (pendiente aprobación)
> **Impacto:** Alto — transforma al estudiante de consumidor pasivo a co-autor de su aprendizaje

---

## 1. Problema

El módulo de flashcards del estudiante es **100% pasivo**. El alumno solo puede revisar cards que creó el profesor o la IA. No existe:

- Botón "Crear flashcard" en ninguna pantalla del alumno
- Input para escribir pregunta/respuesta
- Forma de anotar/editar una card durante estudio
- Generación AI interactiva iniciada por el alumno
- Espacio "Mis Cards" personal
- Forma de reportar una card incorrecta

El `FlashcardFormModal` existe pero vive en `/professor/`. El `SmartFlashcardGenerator` fue **eliminado** en v4.4.6 con el comentario: "A new UI for this can be built when needed."

### Por qué importa

En pedagogía constructivista, **el acto de formular una pregunta** es tan valioso como responderla. Anki (el estándar de oro para med students) tiene la creación como feature central. Estudios muestran +8-12% en retención cuando el estudiante co-crea su material de estudio.

---

## 2. Análisis UX: Crítica del Flujo Actual

### Primera Impresión

El estudiante entra al HubScreen y ve estadísticas bonitas (dominio global, áreas débiles, decks pendientes). Eso está bien. Pero cuando quiere **hacer algo** más allá de revisar cards existentes, no hay salida. Es un callejón sin salida creativo.

### Gaps de Usabilidad

| # | Gap | Severidad | Pantalla | Propuesta |
|---|-----|-----------|----------|-----------|
| 1 | No puede crear flashcards propias | 🔴 Crítico | Global | Botón "+ Crear" en DeckScreen + Modal liviano |
| 2 | No puede pedir cards con IA sobre un tema | 🔴 Crítico | DeckScreen | "Generar con IA" → input de tema → genera → revisa → guarda |
| 3 | No hay espacio "Mis Cards" | 🟡 Moderado | DeckScreen | Sección colapsable "Mis Flashcards" antes del grid |
| 4 | No puede anotar confusiones durante estudio | 🟡 Moderado | SessionScreen | Textarea "Nota personal" post-reveal |
| 5 | No puede reportar card incorrecta | 🟡 Moderado | SessionScreen | 3-dots → "Reportar error" → llega al profesor |
| 6 | Sesión Adaptativa es caja negra | 🟢 Menor | SummaryScreen | Mostrar QUÉ debilidades detectó antes de generar |
| 7 | No puede editar sus propias cards | 🟡 Moderado | DeckScreen | Botón "Editar" en cards creadas por el alumno |
| 8 | No hay distinción visual profe vs estudiante | 🟢 Menor | DeckScreen | Badge "Oficial" vs "Personal" en cada card |

### Lo que Funciona Bien

- **SessionScreen** es limpio y enfocado — reveal + rate con keyboard shortcuts
- **HubScreen** comunica bien el estado global (dominio, áreas débiles)
- **Motor FSRS/BKT** es potente y bien implementado
- **Design system** coherente (teal accent, rounded cards, buen spacing)
- **Progress bar** con gradiente por mastery es excelente feedback visual

---

## 3. Benchmarking: Patrones de la Competencia

### Los 5 Patrones que Axon Debe Adoptar

**1. Creación Quick-Add (patrón Anki)**
- 2 campos: frente + reverso. Sin fricción.
- Axon: Botón "+" en DeckScreen → modal minimalista → guardar.
- Por qué: El 80% de cards manuales en Anki se crean en <30 segundos.

**2. Generación AI desde input del estudiante (patrón Quizlet AI)**
- Estudiante escribe tema o pega texto → IA genera 5-10 cards → revisa → guarda las buenas.
- Axon: Ya tiene `POST /ai/generate-smart` en backend. Falta UI.
- Por qué: Med students tienen PDFs de clase. Poder convertirlos en cards es game-changer.

**3. Badges Oficial/Personal (patrón Osmosis)**
- Cards del profesor: badge "Oficial ✓". Cards del alumno: badge "Personal".
- Evita confusión y da confianza en la calidad del contenido oficial.

**4. Nota Personal durante sesión (patrón RemNote)**
- Al estudiar una card, poder agregar una nota rápida ("esto me confunde porque...").
- No es una card nueva, es metadata personal adjunta a la card existente.
- Facilita metacognición — el estudiante reflexiona sobre su confusión.

**5. Reporte de errores con loop al profesor (patrón Osmosis)**
- 3-dots en card → "Reportar error" → categoría (dato incorrecto, ambiguo, duplicado) → llega al dashboard del profesor.
- Crea un QA loop que mejora la calidad del contenido.

### Anti-Patrones a Evitar

1. **Formulario largo tipo Anki Desktop** — demasiados campos para mobile. Mantener 2 campos + keyword.
2. **IA sin revisión** — nunca guardar cards generadas automáticamente sin que el estudiante las apruebe.
3. **Mezclar cards sin distinción** — siempre marcar origen (oficial vs personal vs IA).

---

## 4. Arquitectura Técnica

### Backend: Estado Actual

**Buena noticia:** `POST /flashcards` ya existe y acepta:
```typescript
{
  summary_id: string;   // Requerido — vincula a un resumen del topic
  keyword_id: string;   // Requerido — vincula a un keyword
  front: string;
  back: string;
  source: 'manual' | 'ai';
  front_image_url?: string;
  back_image_url?: string;
}
```

El campo `created_by` existe en el type `FlashcardItem`. **Lo que falta:**

1. **RLS en Supabase** — Estudiantes solo pueden crear/editar/borrar SUS propias cards
2. **Filtro `GET /flashcards?created_by=me`** — para la sección "Mis Cards"
3. **Inicialización FSRS** — Card nueva debe entrar con `fsrs_state = 'new'` automáticamente

### Frontend: Componentes Nuevos

| Archivo | Propósito | Líneas est. | Reutiliza |
|---------|-----------|-------------|-----------|
| `flashcard/StudentFlashcardModal.tsx` | Modal de creación (frente/reverso/keyword) | ~280 | FlashcardTypeSelector, FlashcardPreview, FlashcardImageUpload |
| `flashcard/StudentFlashcardSection.tsx` | Sección "Mis Cards" en DeckScreen | ~120 | FlashcardMiniCard |
| `hooks/useStudentFlashcards.ts` | Lifecycle hook (fetch/crear/editar/borrar) | ~150 | flashcardApi |

### Frontend: Archivos Modificados

| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `flashcard/FlashcardDeckScreen.tsx` | Botón "Crear" + render StudentFlashcardSection + modal | +50 |
| `flashcard/FlashcardSessionScreen.tsx` | Prop `onCreateFlashcard` + botón contextual | +15 |
| `services/flashcardApi.ts` | Mínimo — ya tiene `createFlashcard()` | +2 |

### Flujo de Datos

```
Estudiante crea card
  → StudentFlashcardModal.handleSubmit()
    → flashcardApi.createFlashcard({ source: 'manual', ... })
      → Backend: inserta + created_by = JWT.sub
      → Backend: auto-crea fsrs_state = 'new'
    → onCreated(newCard)
      → Invalida cardCache en useFlashcardNavigation
      → Card aparece en "Mis Flashcards" del DeckScreen
      → Card entra en study queue normal (FSRS la programa)
```

### Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| `summary_id` requerido pero alumno no sabe cuál | Dropdown pre-filtrado del topic actual (auto-selecciona si hay 1 solo) |
| Alumno edita cards del profesor | RLS backend: `UPDATE WHERE created_by = current_user` |
| Card sin FSRS state inicial | Backend auto-inicializa en POST |
| UI clutter en DeckScreen | Sección "Mis Cards" colapsable, máx 10 visibles |

---

## 5. Plan de Implementación

### Fase 1: MVP — "El alumno puede crear" (2-3 días)

**Scope:**
- `StudentFlashcardModal` — formulario minimalista (frente/reverso/keyword)
- Botón "Crear" en DeckScreen header
- RLS backend para proteger cards ajenas
- Card entra automáticamente en pipeline FSRS

**Criterio de éxito:** Estudiante crea una card → aparece en su estudio → FSRS la programa.

**Branch:** `feat/student-flashcard-creation`

**Archivos a tocar:**
1. NUEVO: `src/app/components/content/flashcard/StudentFlashcardModal.tsx`
2. MODIFICAR: `src/app/components/content/flashcard/FlashcardDeckScreen.tsx`
3. BACKEND: Migración RLS en Supabase

### Fase 2: "Mis Cards" + Edición (2-3 días)

**Scope:**
- Sección "Mis Flashcards" en DeckScreen (colapsable)
- Editar/eliminar cards propias
- Badge visual "Oficial" vs "Personal"
- Hook `useStudentFlashcards`

**Branch:** `feat/student-my-flashcards`

### Fase 3: Notas + Reportes (2-3 días)

**Scope:**
- Textarea "Nota personal" en SessionScreen (post-reveal)
- Botón "Reportar error" en SessionScreen (3-dots menu)
- Backend: tabla `card_reports` + endpoint
- Dashboard profesor para ver reportes

**Branch:** `feat/student-notes-reports`

### Fase 4: Generación AI Interactiva (5-7 días)

**Scope:**
- UI multi-step: input tema → IA genera → alumno revisa → guarda las buenas
- Reutiliza `POST /ai/generate-smart` existente
- Límite diario para evitar abuso (ej: 20 cards/día)
- Preview y edición antes de guardar

**Branch:** `feat/student-ai-generation`

---

## 6. Métricas de Éxito

| Métrica | Actual | Target Q2 2026 |
|---------|--------|----------------|
| % estudiantes que crean ≥1 card | 0% | 25-35% |
| Mastery rate (FSRS) | ~72% | 78-82% |
| Sesiones/semana promedio | ~3.2 | 4.1-4.5 |
| Retención 30 días | ~68% | 75-80% |

---

## 7. Decisiones Pendientes

1. **¿Students cards visibles para otros estudiantes?** — Recomendación: NO en MVP. Solo el creador las ve. Futuro: sistema de "cards compartidas + peer review".

2. **¿Límite de cards por estudiante?** — Recomendación: Sí, 50 cards/topic para evitar spam. Generoso pero con tope.

3. **¿IA generation cuenta contra cuota de tokens?** — Depende del modelo de pricing de Axon. Definir con producto.

4. **¿Cards del estudiante afectan las métricas del profesor?** — Recomendación: NO. Métricas de mastery del profesor solo cuentan cards oficiales. Cards del alumno son "suplemento personal".

---

## 8. Instrucciones para Claude Code CLI

### Fase 1 (MVP) — Copiar y ejecutar

```
Branch: feat/student-flashcard-creation
Repo: C:\dev\axon\frontend (worktree)
Base: main (git pull primero)

Tareas:
1. Crear StudentFlashcardModal.tsx en src/app/components/content/flashcard/
   - Versión simplificada de FlashcardFormModal del profesor
   - Solo 2 campos obligatorios: frente + reverso
   - Dropdown de keywords del topic (pre-filtrado)
   - Auto-seleccionar summary_id si hay uno solo en el topic
   - Usar flashcardApi.createFlashcard() existente
   - source: 'manual'
   - Design: rounded-2xl, teal accent, Inter body

2. Modificar FlashcardDeckScreen.tsx:
   - Agregar estado isStudentModalOpen
   - Botón "Crear" en header (al lado de "Estudiar" y "Con IA")
   - Renderizar StudentFlashcardModal
   - onCreated → invalidar cache, toast éxito

3. npm run build — debe pasar sin errores
4. Commit con mensaje descriptivo
```
