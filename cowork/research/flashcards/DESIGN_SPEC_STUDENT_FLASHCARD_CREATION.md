# DESIGN SPEC: Creación de Flashcards por Estudiantes — Axon

> **Para:** Agente de IA que construya el prototipo interactivo (.jsx)
> **Fecha:** 2026-03-27
> **Stage:** Exploración (prototipo navegable, no código de producción)
> **Audiencia del prototipo:** Petrick (founder) para validar UX antes de implementar

---

## 0. INSTRUCCIONES PARA EL AGENTE

Vas a crear UN SOLO archivo `.jsx` que funcione como prototipo interactivo navegable. El archivo debe:

1. Ser un React functional component con `export default`
2. Usar solo Tailwind core utilities (no compiler, solo clases pre-definidas)
3. Importar `{ useState } from "react"` y `lucide-react` para iconos
4. Simular datos — NO conectar a APIs reales
5. Implementar TODAS las pantallas descritas abajo como estados internos del componente
6. Ser navegable: el usuario clickea y ve las transiciones entre pantallas

**NO hacer:** gradientes morados, glassmorphism, centrar todo, usar Inter como único font. Seguir el design system de Axon documentado abajo.

---

## 1. DESIGN TOKENS (extraídos del código real de Axon)

### Colores

| Token | Valor | Uso |
|-------|-------|-----|
| `primary` | `#1B3B36` | Botones principales, headers oscuros |
| `primary-hover` | `#244e47` | Hover de botones principales |
| `accent` | `#2a8c7a` | Accent teal, iconos, focus ring, links |
| `accent-light` | `#14b8a6` | Teal más claro (badges, mastery level 4) |
| `surface-dashboard` | `bg-zinc-50` (≈ `#fafafa`) | Fondo de áreas de contenido scrollable |
| `surface-card` | `#ffffff` | Fondo de cards y modales |
| `surface-header` | `#ffffff` | Fondo de headers con `border-b border-gray-200/80` |
| `surface-input` | `#F0F2F5` | Fondo de inputs, pills, áreas secundarias |
| `border-subtle` | `border-gray-200/80` | Bordes de cards |
| `border-divider` | `border-gray-200/60` | Divisores en sidebars |
| `text-primary` | `text-gray-900` | Títulos, texto principal |
| `text-secondary` | `text-gray-500` | Subtítulos, descripciones |
| `text-tertiary` | `text-gray-400` | Hints, metadatos, timestamps |
| `text-accent` | `text-[#2a8c7a]` | Links, labels activos |

### Mastery Colors (escala de 6 niveles)

| Level | Label | Hex | Tailwind bg | Tailwind text |
|-------|-------|-----|-------------|---------------|
| 0 (Nueva) | "Nueva" | `#94a3b8` | `bg-slate-400` | `text-slate-500` |
| 1 (No sabe) | "No sabe" | `#f43f5e` | `bg-rose-500` | `text-rose-600` |
| 2 (Difícil) | "Difícil" | `#f97316` | `bg-orange-500` | `text-orange-600` |
| 3 (En progreso) | "En progreso" | `#f59e0b` | `bg-amber-500` | `text-amber-600` |
| 4 (Bien) | "Bien" | `#14b8a6` | `bg-teal-500` | `text-teal-600` |
| 5 (Dominada) | "Dominada" | `#10b981` | `bg-emerald-500` | `text-emerald-600` |

### Tipografía

| Elemento | Tamaño | Peso | Extra |
|----------|--------|------|-------|
| Título de pantalla (h2) | `text-lg sm:text-2xl` | `fontWeight: 700` | — |
| Subtítulo | `text-xs sm:text-sm` | `fontWeight: 500` | `text-gray-500` |
| Label de sección | `text-xs` | `fontWeight: 600` | `uppercase tracking-[0.15em]` + color accent |
| Texto de card (pregunta) | `text-xs` | `fontWeight: 600` | `line-clamp-3 leading-snug` |
| Texto de card (respuesta) | `text-[11px]` | — | `text-gray-400` |
| Texto de botón primary | `text-sm` | `fontWeight: 700` | — |
| Texto de botón secondary | `text-xs` | `fontWeight: 600` | — |
| Badge/pill | `text-[10px]` o `text-[11px]` | `fontWeight: 600` | — |
| Hint/caption | `text-[10px]` | `fontWeight: 400-500` | `text-gray-400` |

### Spacing & Layout

| Elemento | Valor |
|----------|-------|
| Padding de pantalla | `px-4 sm:px-6 md:px-8` |
| Padding top | `pt-4 sm:pt-6` |
| Gap entre secciones | `gap-3 sm:gap-4` |
| Border radius cards | `rounded-2xl` |
| Border radius botones pill | `rounded-full` |
| Border radius inputs | `rounded-xl` |
| Border radius badges | `rounded-full` |
| Shadow de cards | `shadow-sm` → `hover:shadow-lg` |
| Shadow de botones CTA | `shadow-lg shadow-[color]/20` |

### Componentes Reutilizados (simular en el prototipo)

| Componente | Forma visual |
|------------|--------------|
| **MiniCard** | Rectángulo blanco `rounded-2xl`, barra de color de 4px arriba (mastery color), número en badge arriba-izq, 5 dots de mastery arriba-der, pregunta truncada, respuesta sutil abajo |
| **FilterPill** | Pill `rounded-full px-2.5 py-1 text-[11px]`, activo: color + `ring-1`, inactivo: `text-gray-400` |
| **ProgressBar** | `h-1.5 rounded-full bg-gray-100` con segmentos verde/ámbar/rosa |
| **EmptyState** | Icono centered + título bold + descripción gris |

---

## 2. DIAGRAMA DE FLUJO — ESTADOS DEL PROTOTIPO

```
┌─────────────┐
│  DECK VIEW  │ ← Pantalla principal del prototipo
│  (con cards  │
│  del profe)  │
└──────┬──────┘
       │
       ├──── Click "＋ Crear" ──────────► ┌──────────────────┐
       │                                  │  MODAL CREAR     │
       │                                  │  (Quick-Add)     │
       │                                  └────────┬─────────┘
       │                                           │
       │                                  ┌────────▼─────────┐
       │                                  │  MODAL IA        │
       │                                  │  (Generar con IA)│
       │                                  └────────┬─────────┘
       │                                           │
       │                                  ┌────────▼─────────┐
       │                                  │  PREVIEW CARDS   │
       │                                  │  (Revisar & Save)│
       │                                  └──────────────────┘
       │
       ├──── Click "Estudiar" ──────────► ┌──────────────────┐
       │                                  │  SESSION VIEW    │
       │                                  │  (Reveal + Rate) │
       │                                  └────────┬─────────┘
       │                                           │
       │                                  ┌────────▼─────────┐
       │                                  │  SUMMARY VIEW    │
       │                                  │  (Post-session)  │
       │                                  └──────────────────┘
       │
       └──── Sección "Mis Cards" ───────► visible inline en DECK VIEW
```

**Estados del componente principal:**
```
type Screen = 'deck' | 'create-manual' | 'create-ai' | 'ai-preview' | 'session' | 'summary';
```

---

## 3. PANTALLA 1: DECK VIEW (estado `deck`)

Esta es la pantalla principal. Simula el `FlashcardDeckScreen` existente **más las adiciones nuevas**.

### Layout

```
┌──────────────────────────────────────────────────────────┐
│ HEADER (bg-white, border-b)                              │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Breadcrumb: Flashcards > Anatomía > Sistema Cardio │   │
│ └────────────────────────────────────────────────────┘   │
│ ┌────────────────────────┐  ┌──────┐┌────────┐┌──────┐  │
│ │ ← Sistema Cardiovasc.. │  │Ver T.││Estudiar││Con IA│  │
│ │   12 cards en total    │  └──────┘└────────┘└──────┘  │
│ └────────────────────────┘                               │
│                             ┌─────────────────────────┐  │
│ [▓▓▓▓▓▓▓▓▒▒▒▒▒░░░░░░░░░]  │ Todos(12) A revisar(4)  │  │
│  progress bar               │ Aprendiendo(3) Domin(5) │  │
│                             └─────────────────────────┘  │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 🧠 Keywords: 8/12  [▓▓▓▓▓▓░░░░] 67%              │   │
│ │      Reforzar: Válvulas cardíacas                  │   │
│ └────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────┤
│ CONTENT (bg-zinc-50, scrollable)                         │
│                                                          │
│ ╔═══════════════════════════════════════════════════════╗ │
│ ║ 📌 MIS FLASHCARDS (3)              [＋ Crear] [IA ✨]║ │
│ ║─────────────────────────────────────────────────────  ║ │
│ ║ ┌─────┐ ┌─────┐ ┌─────┐                             ║ │
│ ║ │Card │ │Card │ │Card │  ← miniCards con badge       ║ │
│ ║ │ 🧑  │ │ 🧑  │ │ 🧑  │    "Personal" y borde       ║ │
│ ║ └─────┘ └─────┘ └─────┘    punteado teal             ║ │
│ ╚═══════════════════════════════════════════════════════╝ │
│                                                          │
│ ── Cards Oficiales ────────────────────────────────────  │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│ │Card │ │Card │ │Card │ │Card │ │Card │ │Card │      │
│ │ ✓   │ │ ✓   │ │ ✓   │ │ ✓   │ │ ✓   │ │ ✓   │      │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘      │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│ │Card │ │Card │ │Card │ │Card │ │Card │ │Card │      │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘      │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ MOBILE STICKY CTA (sm:hidden)                            │
│ ┌──────────────────────────────────────────────────────┐ │
│ │             ▶ Estudiar (12)                          │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Spec del área "MIS FLASHCARDS" (NUEVA)

**Contenedor:**
- `bg-white border border-dashed border-teal-300/60 rounded-2xl p-4 sm:p-5 mb-5`
- Solo aparece si el alumno tiene ≥1 card propia O si aún no tiene ninguna (empty state invita a crear)

**Header de sección:**
- Icono: `User` de lucide-react, tamaño 14px, color `text-teal-600`
- Título: "Mis Flashcards" — `text-sm text-gray-800 fontWeight: 600`
- Count: `(3)` — `text-xs text-gray-400`
- Alineado a la derecha: dos botones

**Botón "＋ Crear":**
- `px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs text-gray-600 fontWeight: 600`
- Icono: `Plus` de lucide, size 12, antes del texto
- Click → `setScreen('create-manual')`

**Botón "IA ✨" (Generar con IA):**
- `px-3 py-1.5 rounded-full bg-[#2a8c7a] hover:bg-[#244e47] text-white text-xs fontWeight: 600`
- Icono: `Sparkles` de lucide, size 12, antes del texto "Generar"
- Click → `setScreen('create-ai')`

**MiniCards personales:**
- Misma forma que `FlashcardMiniCard` oficial PERO con estas diferencias:
  - Barra de color arriba: `bg-teal-400` (siempre teal, no por mastery) — indica "personal"
  - Badge extra: `"Personal"` — `text-[9px] px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-600 border border-teal-200` — posicionado arriba-derecha dentro del card
  - Al hover: aparece icono de lápiz (Edit) para editar

**Empty state (si no tiene cards propias):**
- Centrado dentro del contenedor
- Icono: `PenLine` de lucide, size 28, color `text-teal-400`
- Texto: "Creá tus propias flashcards" — `text-sm text-gray-500 fontWeight: 500`
- Subtexto: "Formular preguntas mejora tu retención un 12%" — `text-[11px] text-gray-400`
- Botón CTA: "Crear mi primera card" — estilo del botón "＋ Crear" pero más grande: `px-4 py-2 text-sm`

### Spec de MiniCards Oficiales

**Badge "Oficial":**
- En cards del profesor, agregar badge: `"Oficial ✓"` — `text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200`
- Posición: arriba-derecha, mismo lugar que el badge "Personal" en las cards propias

---

## 4. PANTALLA 2: MODAL CREAR MANUAL (estado `create-manual`)

### Diseño: Overlay modal (NO pantalla completa)

```
┌─────────── MODAL ────────────────────────┐
│                                    [✕]   │
│  🃏 Nueva Flashcard                      │
│  ─────────────────────────               │
│                                          │
│  Frente (pregunta)                       │
│  ┌──────────────────────────────────┐    │
│  │                                  │    │
│  │  ej: ¿Cuáles son las capas      │    │
│  │  del corazón?                    │    │
│  │                                  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  Reverso (respuesta)                     │
│  ┌──────────────────────────────────┐    │
│  │                                  │    │
│  │  ej: Endocardio, miocardio      │    │
│  │  y epicardio                     │    │
│  │                                  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  Keyword (opcional)                      │
│  ┌──────────────────────────────────┐    │
│  │  Anatomía cardíaca           ▼   │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌───────────────────┐                   │
│  │  👁 Preview       │ ← toggle         │
│  └───────────────────┘                   │
│                                          │
│  ┌─ PREVIEW (si activo) ──────────────┐  │
│  │ ┌───────────────┐                  │  │
│  │ │ MiniCard      │  Así se verá     │  │
│  │ │ preview       │  en tu deck      │  │
│  │ └───────────────┘                  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────┐ ┌──────────────────────────┐ │
│  │Cancelar│ │   ✓ Crear Flashcard      │ │
│  └────────┘ └──────────────────────────┘ │
└──────────────────────────────────────────┘
```

### Spec exacto

**Backdrop:** `fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4`

**Modal container:**
- `bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto`
- Padding: `p-6`

**Header:**
- Icono: `Layers` de lucide, size 20, color `text-[#2a8c7a]`
- Título: "Nueva Flashcard" — `text-lg text-gray-900 fontWeight: 700`
- Botón cerrar: `absolute top-4 right-4`, icono `X` size 18, `text-gray-400 hover:text-gray-700`

**Label de campos:**
- `text-xs text-gray-500 fontWeight: 600 uppercase tracking-wide mb-1.5`

**Textarea "Frente":**
- `w-full min-h-[80px] p-3 rounded-xl border border-gray-200 bg-[#F0F2F5] text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#2a8c7a] focus:ring-2 focus:ring-[#2a8c7a]/20 outline-none resize-none`
- Placeholder: "ej: ¿Cuáles son las capas del corazón?"

**Textarea "Reverso":**
- Mismo estilo que Frente
- Placeholder: "ej: Endocardio, miocardio y epicardio"

**Select "Keyword":**
- `w-full p-3 rounded-xl border border-gray-200 bg-[#F0F2F5] text-sm text-gray-800 appearance-none`
- Opciones simuladas: "Anatomía cardíaca", "Fisiología", "Farmacología", "General"
- Label: "Keyword (opcional)"

**Toggle Preview:**
- Botón tipo pill: `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs fontWeight: 500`
- Inactivo: `bg-gray-100 text-gray-500`
- Activo: `bg-teal-50 text-teal-600 border border-teal-200`
- Icono: `Eye` de lucide, size 12

**Preview card:**
- Si activo, renderizar un MiniCard con los datos ingresados
- Contenedor: `mt-3 p-4 bg-zinc-50 rounded-xl border border-dashed border-gray-200`
- Texto: "Así se verá en tu deck" — `text-[10px] text-gray-400 mt-2 text-center`

**Botones footer:**
- Contenedor: `flex items-center gap-3 mt-6`
- "Cancelar": `flex-1 py-2.5 rounded-full border border-gray-200 text-sm text-gray-500 fontWeight: 500 hover:bg-gray-50`
- "Crear Flashcard": `flex-1 py-2.5 rounded-full bg-[#1B3B36] hover:bg-[#244e47] text-white text-sm fontWeight: 700 shadow-lg shadow-[#1B3B36]/20`
- Icono `Check` size 14 antes del texto
- Disabled si frente O reverso están vacíos: `opacity-50 cursor-not-allowed`

**Al clickear "Crear":**
1. Simular creación (agregar card al array local de "mis cards")
2. Cerrar modal
3. Mostrar toast simulado: `"✓ Flashcard creada"` — barra verde arriba por 2 segundos
4. Volver a `deck` con la nueva card visible en "Mis Flashcards"

---

## 5. PANTALLA 3: MODAL GENERAR CON IA (estado `create-ai`)

### Diseño: Modal de 2 pasos

**PASO 1: Input del tema**

```
┌─────────── MODAL ────────────────────────┐
│                                    [✕]   │
│  ✨ Generar Flashcards con IA            │
│  ─────────────────────────               │
│                                          │
│  ¿Sobre qué querés practicar?           │
│  ┌──────────────────────────────────┐    │
│  │                                  │    │
│  │  ej: Diferencias entre arterias  │    │
│  │  y venas, sus capas y funciones  │    │
│  │                                  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  Cantidad de cards                       │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐               │
│  │ 3 │ │ 5 │ │ 8 │ │10 │               │
│  └───┘ └───┘ └───┘ └───┘               │
│   (selector tipo radio pills)            │
│                                          │
│  ┌──────────────────────────────────────┐│
│  │      ✨ Generar Flashcards           ││
│  └──────────────────────────────────────┘│
│                                          │
│  💡 La IA creará cards basadas en el     │
│     contenido de este tópico             │
└──────────────────────────────────────────┘
```

**Spec:**

**Textarea tema:**
- Mismo estilo que el modal manual
- `min-h-[100px]`
- Placeholder: "ej: Diferencias entre arterias y venas, sus capas y funciones"

**Selector de cantidad:**
- 4 pills en fila: `flex gap-2`
- Cada pill: `w-10 h-10 rounded-xl border text-sm fontWeight: 600 flex items-center justify-center`
- Seleccionado: `border-[#2a8c7a] bg-teal-50 text-[#2a8c7a]`
- No seleccionado: `border-gray-200 bg-white text-gray-500 hover:border-gray-300`
- Default seleccionado: 5

**Botón generar:**
- Full width: `w-full py-3 rounded-full bg-[#2a8c7a] hover:bg-[#244e47] text-white text-sm fontWeight: 700 shadow-lg`
- Icono: `Sparkles` size 14
- Disabled si textarea vacío

**Hint:**
- `text-[11px] text-gray-400 text-center mt-3`
- Icono: `Lightbulb` size 12 inline

**Al clickear "Generar":**
1. Cambiar botón a estado loading: `"Generando..."` con spinner (icono `Loader2` animado con `animate-spin`)
2. Simular delay de 2 segundos
3. Transicionar a estado `ai-preview`

---

## 6. PANTALLA 4: PREVIEW DE CARDS IA (estado `ai-preview`)

### Diseño: Modal expandido con lista de cards generadas

```
┌─────────── MODAL (más ancho) ────────────┐
│                                    [✕]   │
│  ✨ 5 Flashcards Generadas               │
│  Revisá y seleccioná las que querés      │
│  guardar                                 │
│  ─────────────────────────               │
│                                          │
│  ┌─ CARD 1 ───────────────────────────┐  │
│  │ ☑ Seleccionada                     │  │
│  │                                    │  │
│  │ F: ¿Cuáles son las 3 capas de     │  │
│  │    una arteria?                    │  │
│  │                                    │  │
│  │ R: Túnica íntima (endotelio),      │  │
│  │    túnica media (músculo liso)     │  │
│  │    y túnica adventicia             │  │
│  │    (tejido conectivo).             │  │
│  │                              [✏️]  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌─ CARD 2 ───────────────────────────┐  │
│  │ ☑ Seleccionada                     │  │
│  │ F: ¿Por qué las venas tienen      │  │
│  │    válvulas y las arterias no?     │  │
│  │ R: Las venas trabajan contra       │  │
│  │    gravedad...                     │  │
│  │                              [✏️]  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌─ CARD 3 (deseleccionada) ──────────┐  │
│  │ ☐ (gris, opacidad reducida)        │  │
│  │ F: ...                             │  │
│  │ R: ...                             │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ── Footer ──────────────────────────    │
│  3 de 5 seleccionadas                    │
│  ┌────────┐ ┌──────────────────────────┐ │
│  │Cancelar│ │  ✓ Guardar 3 cards       │ │
│  └────────┘ └──────────────────────────┘ │
└──────────────────────────────────────────┘
```

### Spec exacto

**Modal:**
- `max-w-2xl` (más ancho que el modal de creación manual)
- `max-h-[85vh] overflow-y-auto`

**Cada card generada:**
- Contenedor: `p-4 rounded-xl border mb-3 transition-all`
- Seleccionada: `border-teal-200 bg-teal-50/30`
- Deseleccionada: `border-gray-200 bg-gray-50 opacity-60`
- Checkbox: `w-5 h-5 rounded border-2` — custom: checked = `bg-[#2a8c7a] border-[#2a8c7a]` con `Check` icon blanco, unchecked = `border-gray-300 bg-white`

**Labels "F:" y "R:":**
- "F:" — `text-[10px] uppercase tracking-wider text-[#2a8c7a] fontWeight: 700 mr-1`
- "R:" — `text-[10px] uppercase tracking-wider text-emerald-500 fontWeight: 700 mr-1`

**Texto de pregunta:** `text-sm text-gray-800 fontWeight: 600`
**Texto de respuesta:** `text-sm text-gray-600`

**Botón editar (por card):**
- `absolute bottom-3 right-3` (posición relativa al card)
- Icono `Pencil` size 14, `text-gray-400 hover:text-[#2a8c7a]`
- Click → convierte el texto en textarea editable inline (simular toggle)

**Counter en footer:**
- "3 de 5 seleccionadas" — `text-xs text-gray-500 fontWeight: 500`

**Botón "Guardar X cards":**
- Mismo estilo que "Crear Flashcard" del modal manual
- Texto dinámico con la cantidad seleccionada
- Disabled si 0 seleccionadas

**Al clickear "Guardar":**
1. Agregar cards seleccionadas al array de "mis cards"
2. Cerrar modal
3. Toast: `"✓ 3 flashcards guardadas"`
4. Volver a `deck`

---

## 7. PANTALLA 5: SESSION VIEW (estado `session`)

Simula el `SessionScreen` existente **con adiciones**.

### Adiciones sobre la sesión actual

**Botón "Reportar" (3-dots menu):**
- Posición: header, al lado del counter de progreso
- Icono: `MoreVertical` de lucide, size 16, `text-gray-400`
- Click → dropdown con:
  - `Flag` icon + "Reportar error" → abre mini-modal de reporte
  - `PenLine` icon + "Agregar nota" → abre textarea de nota

**Mini-modal de reporte (overlay sobre session):**
```
┌──────────────────────────────┐
│  🚩 Reportar Error           │
│                              │
│  ○ Dato incorrecto           │
│  ○ Pregunta ambigua          │
│  ○ Respuesta incompleta      │
│  ○ Duplicada                 │
│                              │
│  Comentario (opcional)       │
│  ┌────────────────────────┐  │
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  [Cancelar]  [Enviar]        │
└──────────────────────────────┘
```

- Container: `bg-white rounded-2xl p-5 shadow-2xl max-w-sm mx-auto`
- Radio options: `flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer`
- Radio circle: `w-4 h-4 rounded-full border-2 border-gray-300` — selected: `border-[#2a8c7a]` con dot interno `bg-[#2a8c7a]`
- Botón enviar: `bg-rose-500 hover:bg-rose-600 text-white` (rojo porque es reporte)

**Textarea de nota personal (aparece post-reveal, antes de los rating buttons):**
```
┌──────────────────────────────────────┐
│ 📝 Nota personal (opcional)          │
│ ┌──────────────────────────────────┐ │
│ │ ej: Me confundo con la          │ │
│ │ diferencia entre sístole y...   │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

- Contenedor: `px-6 py-3 bg-amber-50/50 border-t border-amber-100`
- Label: `text-[10px] text-amber-600 fontWeight: 600 uppercase tracking-wider`
- Textarea: `w-full mt-1.5 p-2 rounded-lg border border-amber-200 bg-white text-xs text-gray-700 placeholder:text-gray-400 min-h-[40px] resize-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200`
- Colapsable: empieza como link "＋ Agregar nota" que al click expande el textarea

---

## 8. PANTALLA 6: SUMMARY VIEW (estado `summary`)

Simula el `SummaryScreen` existente. **Sin cambios significativos** — solo agregar un CTA extra si el dominio es bajo:

**Banner "Crear cards de refuerzo"** (solo si mastery < 70%):
- Posición: entre el donut de mastery y los botones de acción
- `bg-teal-50/80 border border-teal-200/40 rounded-2xl p-4 text-center`
- Icono: `PenLine` size 16
- Texto: "¿Querés crear cards sobre lo que más te costó?"
- CTA: `"Crear cards de refuerzo"` → navega a `create-ai` con el tema pre-llenado

---

## 9. DATOS SIMULADOS

```javascript
// Cards oficiales del profesor (12)
const officialCards = [
  { id: 'off-1', question: '¿Cuáles son las 4 cavidades del corazón?', answer: 'Aurícula derecha, aurícula izquierda, ventrículo derecho y ventrículo izquierdo', mastery: 5, source: 'official' },
  { id: 'off-2', question: '¿Qué es la sístole?', answer: 'Fase de contracción del ciclo cardíaco donde el corazón bombea sangre', mastery: 4, source: 'official' },
  { id: 'off-3', question: '¿Cuál es la función del nodo sinoauricular?', answer: 'Marcapasos natural del corazón, genera impulsos eléctricos que inician la contracción', mastery: 4, source: 'official' },
  { id: 'off-4', question: '¿Qué arteria irriga el miocardio?', answer: 'Las arterias coronarias (izquierda y derecha)', mastery: 3, source: 'official' },
  { id: 'off-5', question: '¿Cuáles son las capas del corazón?', answer: 'Endocardio (interna), miocardio (muscular media) y epicardio (externa)', mastery: 3, source: 'official' },
  { id: 'off-6', question: '¿Qué es la diástole?', answer: 'Fase de relajación del ciclo cardíaco donde las cavidades se llenan de sangre', mastery: 3, source: 'official' },
  { id: 'off-7', question: '¿Qué válvula separa la aurícula izquierda del ventrículo izquierdo?', answer: 'Válvula mitral (bicúspide)', mastery: 2, source: 'official' },
  { id: 'off-8', question: '¿Cuál es el gasto cardíaco normal en reposo?', answer: 'Aproximadamente 5 litros por minuto (FC × Vol. sistólico)', mastery: 2, source: 'official' },
  { id: 'off-9', question: '¿Qué es la precarga?', answer: 'Volumen de sangre que llena el ventrículo al final de la diástole (volumen telediastólico)', mastery: 1, source: 'official' },
  { id: 'off-10', question: '¿Qué ley describe la relación entre precarga y fuerza de contracción?', answer: 'Ley de Frank-Starling: a mayor estiramiento de las fibras, mayor fuerza de contracción', mastery: 0, source: 'official' },
  { id: 'off-11', question: '¿Qué es la postcarga?', answer: 'Resistencia que debe vencer el ventrículo para eyectar la sangre (presión aórtica)', mastery: 0, source: 'official' },
  { id: 'off-12', question: '¿Cuáles son los ruidos cardíacos normales?', answer: 'S1 (cierre de válvulas AV) y S2 (cierre de válvulas semilunares)', mastery: 0, source: 'official' },
];

// Cards personales del alumno (2 existentes)
const myCards = [
  { id: 'my-1', question: '¿Cuál es la diferencia entre arterias elásticas y musculares?', answer: 'Las elásticas (aorta) tienen más elastina para absorber presión; las musculares tienen más músculo liso para regular flujo', mastery: 2, source: 'personal' },
  { id: 'my-2', question: 'Mnemotecnia: capas del corazón', answer: 'END-MIO-EPI: de adentro hacia afuera (ENDo, MIOcardio, EPIcardio)', mastery: 4, source: 'personal' },
];

// Cards generadas por IA (para preview)
const aiGeneratedCards = [
  { question: '¿Cuáles son las 3 capas de una arteria?', answer: 'Túnica íntima (endotelio), túnica media (músculo liso) y túnica adventicia (tejido conectivo)' },
  { question: '¿Por qué las venas tienen válvulas y las arterias no?', answer: 'Las venas trabajan contra la gravedad con baja presión. Las válvulas previenen el reflujo. Las arterias no las necesitan por la alta presión del bombeo cardíaco.' },
  { question: '¿Qué es la vasoconstricción?', answer: 'Contracción del músculo liso de la pared vascular que reduce el diámetro del vaso y aumenta la resistencia al flujo sanguíneo' },
  { question: '¿Cuál es la diferencia principal entre circulación mayor y menor?', answer: 'Mayor (sistémica): VI → aorta → tejidos → venas cavas → AD. Menor (pulmonar): VD → arteria pulmonar → pulmones → venas pulmonares → AI' },
  { question: '¿Qué factores regulan la presión arterial?', answer: 'Gasto cardíaco × resistencia vascular periférica. Regulado por: barorreceptores, SRAA, sistema nervioso simpático, y factores locales' },
];

// Keywords simulados
const keywords = ['Anatomía cardíaca', 'Fisiología cardiovascular', 'Hemodinámica', 'Sistema vascular', 'General'];

// Stats
const stats = { mastered: 5, learning: 3, newCards: 4, total: 12, pct: 58 };
```

---

## 10. INTERACCIONES Y TRANSICIONES

| Acción | Desde | Hacia | Transición |
|--------|-------|-------|------------|
| Click "＋ Crear" | deck | create-manual | Modal fade-in (opacity 0→1, 200ms) |
| Click "IA ✨" / "Generar" | deck | create-ai | Modal fade-in |
| Click "Generar Flashcards" | create-ai | ai-preview | Content swap dentro del modal (fade 150ms) |
| Click "Guardar X cards" | ai-preview | deck | Modal fade-out, toast aparece |
| Click "Crear Flashcard" | create-manual | deck | Modal fade-out, toast aparece |
| Click "Estudiar" | deck | session | Slide left (x: 0→-100%, nuevo x: 100%→0) |
| Click rating (1-5) | session | session (next card) | Fade swap del contenido |
| Última card rated | session | summary | Fade |
| Click "Volver al Deck" | summary | deck | Fade |
| Click "Cancelar" en modales | modal | deck | Modal fade-out |
| Click backdrop de modal | modal | deck | Modal fade-out |

**Toast notification:**
- Posición: `fixed top-4 left-1/2 -translate-x-1/2 z-60`
- `bg-emerald-500 text-white px-4 py-2.5 rounded-full text-sm fontWeight: 600 shadow-lg`
- Icono: `Check` size 14
- Auto-dismiss: 2.5 segundos
- Animación: slide down + fade in → slide up + fade out

---

## 11. RESPONSIVE (MOBILE-FIRST)

| Breakpoint | Cambios |
|------------|---------|
| `< 640px` (mobile) | Modales ocupan full-width con `p-4`. Botones de header en DeckView: solo iconos (sin texto). "Mis Flashcards" grid: 2 columnas. Sticky "Estudiar" CTA abajo. Session: nota colapsada por default. |
| `640-1024px` (tablet) | Modales centrados max-w-lg. Grid 3 cols. Botones con texto. |
| `> 1024px` (desktop) | Grid 4-6 cols. Modal centrado. Session con keyboard hints visibles. |

---

## 12. EDGE CASES A SIMULAR

1. **Deck sin cards propias** → mostrar empty state con CTA "Crear mi primera card"
2. **Modal con campos vacíos** → botón "Crear" disabled, opacidad reducida
3. **IA generando** → estado loading con spinner, botón disabled
4. **0 cards seleccionadas en preview IA** → botón "Guardar" disabled, counter en 0
5. **Texto muy largo en card** → truncar con `line-clamp-3` (pregunta) y `line-clamp-2` (respuesta)
6. **Session con 1 sola card** → funciona normal, summary dice "1 flashcard"

---

## 13. CHECKLIST PARA EL AGENTE

Antes de entregar el archivo `.jsx`, verificar:

- [ ] Todas las 6 pantallas/estados son navegables
- [ ] Design tokens coinciden con la tabla de la Sección 1 (no inventar colores)
- [ ] Botones disabled cuando corresponde (campos vacíos, 0 seleccionadas)
- [ ] Toast notification aparece después de crear/guardar
- [ ] Cards personales se distinguen visualmente de oficiales (borde punteado teal + badge)
- [ ] Empty state de "Mis Flashcards" se muestra cuando no hay cards propias
- [ ] Loading state en generación IA (spinner 2 seg)
- [ ] Mobile responsive: grid 2 cols, modal full-width, sticky CTA
- [ ] No hay text en portugués — todo en español argentino
- [ ] No hay gradientes morados, glassmorphism, ni layouts centrados genéricos
- [ ] El archivo exporta un `default` component y no tiene props requeridos
