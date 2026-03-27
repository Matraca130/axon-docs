# PROMPT: Construir Prototipo Interactivo — Creación de Flashcards por Estudiantes

> **INSTRUCCIÓN:** Copiá este documento completo y pegalo como prompt a un agente de IA (Claude Code, Cowork, etc.) para que construya el prototipo. El documento es autocontenido — el agente NO necesita leer ningún otro archivo.

---

## ROL Y OBJETIVO

Sos un frontend developer senior especializado en React y Tailwind CSS. Tu tarea es crear UN SOLO archivo `.jsx` que funcione como prototipo interactivo navegable de una nueva feature para Axon (plataforma educativa médica).

**La feature:** Permitir que los estudiantes de medicina creen sus propias flashcards — manualmente y con ayuda de IA — dentro de la experiencia de estudio existente.

**El entregable:** Un archivo `.jsx` con `export default` que se renderiza como artifact en Claude/Cowork. Debe ser navegable — el usuario clickea botones y ve las transiciones entre pantallas.

**Restricciones técnicas del archivo:**
- React functional component con `export default`
- Solo Tailwind core utilities (clases pre-definidas, NO compiler)
- Imports permitidos: `import { useState, useEffect, useCallback } from "react"` y `import { ... } from "lucide-react"`
- NO usar localStorage ni sessionStorage
- Simular todos los datos — NO conectar a APIs
- NO usar bibliotecas externas más allá de las listadas

---

## CONTEXTO: AXON — Plataforma Educativa Médica

Axon es un LMS para estudiantes de medicina en la Universidad Nacional de La Plata (Argentina). La plataforma tiene flashcards con repetición espaciada (FSRS v4).

**IDIOMA DE LA UI:** Español argentino (vos/querés, no tú/quieres). El módulo de flashcards actual ya está en español (ver RATINGS: "No sé", "Difícil", etc.). Existe una inconsistencia histórica con portugués en otras partes de la app, pero para flashcards el idioma confirmado es **español argentino**.

**Problema actual:** El estudiante solo puede revisar flashcards creadas por el profesor. No puede crear las suyas, ni pedirle a la IA que genere nuevas, ni anotar confusiones durante el estudio. Es 100% pasivo.

**Lo que vamos a prototipar:** Una experiencia donde el estudiante puede:
1. Ver sus flashcards separadas de las oficiales (con badges visuales)
2. Crear flashcards manualmente con un modal rápido
3. Pedirle a la IA que genere flashcards sobre un tema
4. Revisar y seleccionar las cards generadas por IA antes de guardarlas
5. Estudiar todas las cards (oficiales + personales) en sesión
6. Agregar notas personales y reportar errores durante la sesión

---

## DESIGN SYSTEM DE AXON (tokens exactos, NO inventar otros)

### Paleta de Colores

```
PRIMARY:          #1B3B36   (botones principales, headers oscuros)
PRIMARY-HOVER:    #244e47
ACCENT:           #2a8c7a   (teal — iconos, focus, links, badges activos)
ACCENT-LIGHT:     #14b8a6   (teal claro)
SURFACE-DASHBOARD: zinc-50  (fondo de áreas scrollables ≈ #fafafa)
SURFACE-CARD:     #ffffff   (fondo de cards y modales)
SURFACE-INPUT:    #F0F2F5   (fondo de inputs y pills)
BORDER-SUBTLE:    gray-200 con opacity 80%
TEXT-PRIMARY:     gray-900
TEXT-SECONDARY:   gray-500
TEXT-TERTIARY:    gray-400
```

### Tipografía — Familias (CRÍTICO)

El design system de Axon usa **dos familias** diferenciadas:

```
HEADINGS:  fontFamily: 'Georgia, serif'       ← TODOS los títulos, h1-h4, section titles, card titles
BODY:      fontFamily: 'Inter, system-ui, sans-serif'  ← textos, labels, captions, botones
DISPLAY:   fontFamily: 'Space Grotesk, sans-serif'     ← solo en hero/landing (NO usar en flashcards)
```

**REGLA:** Todo elemento que sea `h2`, `h3`, título de sección, o título de card DEBE llevar `style={{ fontFamily: 'Georgia, serif' }}` además de sus clases Tailwind. Los textos de body, labels, buttons y captions NO llevan fontFamily (usan el default sans-serif del sistema).

### Mastery Colors (6 niveles — usar EXACTAMENTE estos)

```
Level 0 "Nueva":       #94a3b8  bg-slate-400    text-slate-500
Level 1 "No sabe":     #f43f5e  bg-rose-500     text-rose-600
Level 2 "Difícil":     #f97316  bg-orange-500   text-orange-600
Level 3 "En progreso": #f59e0b  bg-amber-500    text-amber-600
Level 4 "Bien":        #14b8a6  bg-teal-500     text-teal-600
Level 5 "Dominada":    #10b981  bg-emerald-500  text-emerald-600
```

### Tipografía

```
Título pantalla:   text-lg sm:text-2xl   fontWeight: 700   + style={{ fontFamily: 'Georgia, serif' }}
Subtítulo:         text-xs sm:text-sm    fontWeight: 500    text-gray-500
Label sección:     text-xs               fontWeight: 600    uppercase tracking-widest  color accent
Pregunta card:     text-xs               fontWeight: 600    line-clamp-3  + style={{ fontFamily: 'Georgia, serif' }}
Respuesta card:    text-[11px]           text-gray-400
Botón primary:     text-sm               fontWeight: 700
Botón secondary:   text-xs               fontWeight: 600
Badge/pill:        text-[10px]           fontWeight: 600
Hint/caption:      text-[10px]           fontWeight: 400    text-gray-400
Modal título:      text-lg               fontWeight: 700    + style={{ fontFamily: 'Georgia, serif' }}
```

**NOTA SOBRE FONT-SIZE:** En producción, Axon usa `clamp()` en vez de clases Tailwind como `text-2xl`. Para el prototipo standalone `.jsx`, usar las clases Tailwind está bien. Pero en el checklist se documenta para que al portar a producción se migren a clamp().

### Spacing y Radii

```
Padding pantalla:    px-4 sm:px-6 md:px-8
Padding cards:       p-3
Gaps:                gap-3 sm:gap-4
Border radius cards: rounded-2xl
Border radius botón: rounded-full (pills) o rounded-xl (inputs)
Shadow cards:        shadow-sm  hover:shadow-lg
Shadow CTAs:         shadow-lg shadow-[color]/20
Focus ring:          focus-visible:ring-2 focus-visible:ring-teal-500
```

### Reglas de Estilo (IMPORTANTE — evitar "AI slop")

- NO gradientes morados ni violetas
- NO glassmorphism (blur + transparencia)
- NO centrar todo — usar alineación a la izquierda para contenido
- NO usar Inter como único font (dejar el default de Tailwind)
- NO bordes gruesos — usar border-gray-200 con opacity
- SÍ usar whitespace generoso
- SÍ fondo zinc-50 para áreas de scroll, blanco para cards
- SÍ teal como color accent principal (NO azul, NO morado)

### Nota sobre Badges "Oficial" vs "Personal" (para implementación real)

En el prototipo, cada card tiene un campo `source: 'official' | 'personal'` para distinguirlas visualmente. En la implementación real, esta distinción se hará por `created_by`:
- Card del profesor → `created_by` = ID del profesor → badge "Oficial ✓"
- Card del estudiante → `created_by` = ID del estudiante → badge "Personal"
- El campo `FlashcardItem.source` en el backend actual tiene valores `'ai' | 'manual' | 'imported'` (no 'official'/'personal')

Para el prototipo esto no importa — usamos el campo `source` simulado.

---

## MÁQUINA DE ESTADOS

El componente principal maneja estas pantallas via `useState`:

```
type Screen = 'deck' | 'create-manual' | 'create-ai' | 'ai-preview' | 'session' | 'summary';

const [screen, setScreen] = useState('deck');
```

### Flujo de navegación:

```
DECK ──── "＋ Crear" ──────────► CREATE-MANUAL ──── "Crear" ────► DECK (+ toast)
  │                                    │
  │                               "Cancelar" ──────────────────► DECK
  │
  ├──── "Generar ✨" ──────────► CREATE-AI ──── "Generar" ──────► AI-PREVIEW
  │                                    │                              │
  │                               "Cancelar" ──► DECK          "Guardar" ──► DECK (+ toast)
  │                                                                   │
  │                                                              "Cancelar" ──► DECK
  │
  ├──── "Estudiar" ────────────► SESSION ──── última card ──────► SUMMARY
  │                                    │                              │
  │                                  "✕" ──► DECK              "Volver" ──► DECK
  │
  └──── (cards personales visibles inline en DECK)
```

---

## DATOS SIMULADOS (copiar literal en el componente)

```jsx
const KEYWORDS = ['Anatomía cardíaca', 'Fisiología cardiovascular', 'Hemodinámica', 'Sistema vascular', 'General'];

const OFFICIAL_CARDS = [
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

const INITIAL_MY_CARDS = [
  { id: 'my-1', question: '¿Cuál es la diferencia entre arterias elásticas y musculares?', answer: 'Las elásticas (aorta) tienen más elastina para absorber presión; las musculares tienen más músculo liso para regular flujo', mastery: 2, source: 'personal' },
  { id: 'my-2', question: 'Mnemotecnia: capas del corazón', answer: 'END-MIO-EPI: de adentro hacia afuera (ENDo, MIOcardio, EPIcardio)', mastery: 4, source: 'personal' },
];

const AI_GENERATED_CARDS = [
  { question: '¿Cuáles son las 3 capas de una arteria?', answer: 'Túnica íntima (endotelio), túnica media (músculo liso) y túnica adventicia (tejido conectivo)' },
  { question: '¿Por qué las venas tienen válvulas y las arterias no?', answer: 'Las venas trabajan contra la gravedad con baja presión. Las válvulas previenen el reflujo. Las arterias no las necesitan por la alta presión del bombeo cardíaco.' },
  { question: '¿Qué es la vasoconstricción?', answer: 'Contracción del músculo liso de la pared vascular que reduce el diámetro del vaso y aumenta la resistencia al flujo sanguíneo' },
  { question: '¿Cuál es la diferencia principal entre circulación mayor y menor?', answer: 'Mayor (sistémica): VI → aorta → tejidos → venas cavas → AD. Menor (pulmonar): VD → arteria pulmonar → pulmones → venas pulmonares → AI' },
  { question: '¿Qué factores regulan la presión arterial?', answer: 'Gasto cardíaco × resistencia vascular periférica. Regulado por: barorreceptores, SRAA, sistema nervioso simpático, y factores locales' },
];

const MASTERY_COLORS = {
  0: { hex: '#94a3b8', bg: 'bg-slate-400', bgLight: 'bg-slate-50', text: 'text-slate-500', label: 'Nueva' },
  1: { hex: '#f43f5e', bg: 'bg-rose-500', bgLight: 'bg-rose-50', text: 'text-rose-600', label: 'No sabe' },
  2: { hex: '#f97316', bg: 'bg-orange-500', bgLight: 'bg-orange-50', text: 'text-orange-600', label: 'Difícil' },
  3: { hex: '#f59e0b', bg: 'bg-amber-500', bgLight: 'bg-amber-50', text: 'text-amber-600', label: 'En progreso' },
  4: { hex: '#14b8a6', bg: 'bg-teal-500', bgLight: 'bg-teal-50', text: 'text-teal-600', label: 'Bien' },
  5: { hex: '#10b981', bg: 'bg-emerald-500', bgLight: 'bg-emerald-50', text: 'text-emerald-600', label: 'Dominada' },
};

const getMasteryColor = (m) => MASTERY_COLORS[Math.max(0, Math.min(5, Math.round(m ?? 0)))] || MASTERY_COLORS[0];

const RATINGS = [
  { value: 1, label: 'No sé', color: 'bg-rose-500', hover: 'hover:bg-rose-600', desc: 'Repetir pronto' },
  { value: 2, label: 'Difícil', color: 'bg-orange-500', hover: 'hover:bg-orange-600', desc: 'Necesito repasar' },
  { value: 3, label: 'Regular', color: 'bg-yellow-400', hover: 'hover:bg-yellow-500', desc: 'Algo de duda' },
  { value: 4, label: 'Fácil', color: 'bg-lime-500', hover: 'hover:bg-lime-600', desc: 'Lo entendí bien' },
  { value: 5, label: 'Perfecto', color: 'bg-emerald-500', hover: 'hover:bg-emerald-600', desc: 'Memorizado' },
];
```

---

## PANTALLA POR PANTALLA — ESPECIFICACIÓN EXACTA

### PANTALLA 1: DECK VIEW (screen === 'deck')

Esta es la pantalla principal. Tiene 3 zonas verticales: HEADER, CONTENT (scrollable), MOBILE CTA.

**HEADER (parte superior fija):**

Fondo: `bg-white border-b border-gray-200/80`
Padding: `px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-4`

Contenido del header:
1. **Breadcrumb** (fila 1): `text-xs text-gray-400` — "Flashcards > Anatomía > Sistema Cardiovascular" — separados por `ChevronRight` size 12
2. **Título + Botones** (fila 2):
   - Izquierda: botón back `ChevronLeft` + título "Sistema Cardiovascular" `text-lg sm:text-2xl fontWeight:700 text-gray-900` **+ `style={{ fontFamily: 'Georgia, serif' }}`**
   - Derecha: 3 botones en fila `flex gap-2`:
     - "Estudiar" — `hidden sm:flex px-5 py-2.5 rounded-full text-white text-sm fontWeight:700` con backgroundColor del mastery color del deck (usar `#14b8a6` para este prototipo). Icono `Play` size 16 fill. Click → `setScreen('session')`
     - "Con IA" — `px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#2a8c7a] hover:bg-[#244e47] text-white text-xs sm:text-sm fontWeight:600`. Icono `Sparkles` size 14. Click → `setScreen('create-ai')`
     - **NUEVO** "＋ Crear" — `px-3 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs text-gray-600 fontWeight:600`. Icono `Plus` size 12. Click → `setScreen('create-manual')`

3. **Barra de progreso** (fila 3): `flex h-1.5 rounded-full overflow-hidden bg-gray-100 max-w-xs`
   - Segmento verde (mastered 5/12 = 41.7%): `bg-emerald-500`
   - Segmento ámbar (learning 3/12 = 25%): `bg-amber-400`
   - Segmento rosa (new 4/12 = 33.3%): `bg-rose-400`

4. **Filter pills** (al lado de la barra): `flex gap-1.5`
   - "Todos (12)" — activo por default: `text-gray-700 bg-gray-100 ring-1 ring-gray-200 shadow-sm`
   - "A revisar (4)" — inactivo: `text-gray-400 hover:text-gray-600`
   - "Aprendiendo (3)" — inactivo
   - "Dominados (5)" — inactivo
   - Cada pill: `px-2.5 py-1 rounded-full text-[11px] fontWeight:500`

**CONTENT (zona scrollable):**

Fondo: `bg-zinc-50 flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-5`

**Sección "MIS FLASHCARDS" (aparece primero, antes de las oficiales):**

Contenedor: `bg-white border-2 border-dashed border-teal-300/60 rounded-2xl p-4 sm:p-5 mb-5`

Header de sección:
- Fila flex: `flex items-center justify-between mb-3`
- Izquierda: `flex items-center gap-2`
  - Icono `User` de lucide, size 14, `text-teal-600`
  - "Mis Flashcards" — `text-sm text-gray-800 fontWeight:600`
  - "(2)" — `text-xs text-gray-400 fontWeight:400`
- Derecha: `flex items-center gap-2`
  - Botón "＋ Crear" (misma spec que el del header)
  - Botón "Generar ✨" — `px-3 py-1.5 rounded-full bg-[#2a8c7a] hover:bg-[#244e47] text-white text-xs fontWeight:600` + icono `Sparkles` size 12

Grid de cards personales:
- `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3`
- Cada card personal: misma estructura que MiniCard oficial PERO:
  - Barra de color arriba: SIEMPRE `bg-teal-400` (no por mastery — indica "personal")
  - Badge "Personal": `absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-600 border border-teal-200 fontWeight:600`

**Estructura de cada MiniCard (tanto oficial como personal):**

```
┌──────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ ← barra 4px (mastery color o teal para personal)
│                      │
│ [1]          ▏▏▏▏▏  │ ← número en badge + 5 dots de mastery
│                      │
│ ¿Cuáles son las      │ ← pregunta (text-xs, fontWeight:600, line-clamp-3)
│ 4 cavidades del      │
│ corazón?             │
│                      │
│ Aurícula derecha,    │ ← respuesta (text-[11px], text-gray-400, line-clamp-2)
│ aurícula izq...      │
│                      │
└──────────────────────┘
```

- Contenedor: `bg-white rounded-2xl border border-gray-200/80 hover:border-gray-300 hover:shadow-lg transition-all shadow-sm cursor-pointer overflow-hidden`
- Barra color: `h-1 w-full` + clase del mastery color
- Padding interior: `p-3`
- Badge número: `w-5 h-5 rounded-md text-[10px] fontWeight:700 flex items-center justify-center` + bgLight y text del mastery
- Dots mastery: 5 divs `w-1 h-2.5 rounded-full` — filled = mastery color dot, unfilled = `bg-gray-200`

**Cards oficiales (después de "Mis Flashcards"):**

Separador: `flex items-center gap-2 mb-3 mt-2`
- Línea: `flex-1 h-px bg-gray-200`
- Texto: "Cards Oficiales" — `text-[11px] text-gray-400 fontWeight:500 uppercase tracking-wider`
- Línea: `flex-1 h-px bg-gray-200`

Grid: misma clase `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3`

Cada card oficial: MiniCard estándar + badge "Oficial ✓" en `absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 fontWeight:600`

**MOBILE STICKY CTA (solo visible en mobile):**

```
<div className="sm:hidden px-4 py-3 bg-white border-t border-gray-200">
  <button className="w-full py-3.5 rounded-full text-white text-sm fontWeight:700 shadow-lg"
    style={{ backgroundColor: '#14b8a6' }}
    onClick={() => setScreen('session')}>
    ▶ Estudiar (12)
  </button>
</div>
```

---

### PANTALLA 2: MODAL CREAR MANUAL (screen === 'create-manual')

**Backdrop:** `fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4`
Click en backdrop → `setScreen('deck')` (usar `onClick={(e) => e.target === e.currentTarget && setScreen('deck')}` para no cerrar al click dentro del modal)

**Modal:** `bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative`

**Cerrar:** `absolute top-4 right-4` — icono `X` size 18, `text-gray-400 hover:text-gray-700 cursor-pointer`

**Header:**
- Icono `Layers` size 20 `text-[#2a8c7a]` + "Nueva Flashcard" `text-lg text-gray-900 fontWeight:700` **+ `style={{ fontFamily: 'Georgia, serif' }}`**
- Gap: `flex items-center gap-2.5 mb-5`

**Campos del formulario:**

Usar estado: `const [front, setFront] = useState('')` y `const [back, setBack] = useState('')` y `const [keyword, setKeyword] = useState('General')`

1. **Label "Frente (pregunta)"** — `text-xs text-gray-500 fontWeight:600 uppercase tracking-wide mb-1.5`
2. **Textarea front** — `w-full min-h-[80px] p-3 rounded-xl border border-gray-200 bg-[#F0F2F5] text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#2a8c7a] focus:ring-2 focus:ring-[#2a8c7a]/20 outline-none resize-none transition-colors`
   - Placeholder: "ej: ¿Cuáles son las capas del corazón?"
3. **Spacer:** `mt-4`
4. **Label "Reverso (respuesta)"** — mismo estilo
5. **Textarea back** — mismo estilo, placeholder: "ej: Endocardio, miocardio y epicardio"
6. **Spacer:** `mt-4`
7. **Label "Keyword (opcional)"** — mismo estilo
8. **Select keyword** — `w-full p-3 rounded-xl border border-gray-200 bg-[#F0F2F5] text-sm text-gray-800 outline-none focus:border-[#2a8c7a]`
   - Options: mapear KEYWORDS array

**Toggle Preview:**
- `mt-4 flex items-center gap-1.5`
- Botón: `px-3 py-1.5 rounded-full text-xs fontWeight:500 cursor-pointer transition-colors`
  - Inactivo: `bg-gray-100 text-gray-500`
  - Activo: `bg-teal-50 text-teal-600 border border-teal-200`
- Icono `Eye` size 12
- Estado: `const [showPreview, setShowPreview] = useState(false)`

**Preview (si showPreview && front):**
- `mt-3 p-4 bg-zinc-50 rounded-xl border border-dashed border-gray-200`
- Renderizar un MiniCard con los datos del form (mastery 0, source 'personal')
- Debajo: "Así se verá en tu deck" — `text-[10px] text-gray-400 mt-2 text-center`

**Botones footer:**
- `flex items-center gap-3 mt-6`
- "Cancelar": `flex-1 py-2.5 rounded-full border border-gray-200 text-sm text-gray-500 fontWeight:500 hover:bg-gray-50 cursor-pointer text-center`
- "Crear Flashcard": `flex-1 py-2.5 rounded-full bg-[#1B3B36] hover:bg-[#244e47] text-white text-sm fontWeight:700 shadow-lg shadow-[#1B3B36]/20 cursor-pointer text-center flex items-center justify-center gap-2`
  - Icono `Check` size 14
  - **DISABLED** si `!front.trim() || !back.trim()`: agregar `opacity-50 cursor-not-allowed pointer-events-none`

**Al crear:**
1. Agregar `{ id: 'my-' + Date.now(), question: front, answer: back, mastery: 0, source: 'personal' }` al array de myCards
2. Limpiar form
3. `setScreen('deck')`
4. Mostrar toast "✓ Flashcard creada"

---

### PANTALLA 3: MODAL GENERAR CON IA (screen === 'create-ai')

**Misma estructura de modal que create-manual** (backdrop, cerrar, etc.)

**Header:** icono `Sparkles` size 20 `text-[#2a8c7a]` + "Generar Flashcards con IA" `text-lg text-gray-900 fontWeight:700` **+ `style={{ fontFamily: 'Georgia, serif' }}`**

**Contenido:**

1. **Label "¿Sobre qué querés practicar?"** — mismo estilo de labels
2. **Textarea** — `min-h-[100px]`, placeholder: "ej: Diferencias entre arterias y venas, sus capas y funciones"
3. **Spacer: mt-4**
4. **Label "Cantidad de cards"**
5. **Selector pills:** `flex gap-2 mt-1.5`
   - 4 botones: [3, 5, 8, 10]
   - Cada uno: `w-10 h-10 rounded-xl border text-sm fontWeight:600 flex items-center justify-center cursor-pointer transition-colors`
   - Seleccionado: `border-[#2a8c7a] bg-teal-50 text-[#2a8c7a]`
   - No seleccionado: `border-gray-200 bg-white text-gray-500 hover:border-gray-300`
   - Default: 5
   - Estado: `const [cardCount, setCardCount] = useState(5)`

6. **Botón "Generar Flashcards"** — `mt-6 w-full py-3 rounded-full bg-[#2a8c7a] hover:bg-[#244e47] text-white text-sm fontWeight:700 shadow-lg flex items-center justify-center gap-2 cursor-pointer`
   - Icono `Sparkles` size 14
   - DISABLED si textarea vacío
   - Estado loading: `const [generating, setGenerating] = useState(false)`
   - En loading: texto cambia a "Generando..." + icono `Loader2` con `animate-spin`

7. **Hint:** `text-[11px] text-gray-400 text-center mt-3 flex items-center justify-center gap-1`
   - Icono `Lightbulb` size 12
   - "La IA creará cards basadas en el contenido de este tópico"

**Al generar:**
1. `setGenerating(true)`
2. `setTimeout(() => { setGenerating(false); setScreen('ai-preview'); }, 2000)`

---

### PANTALLA 4: PREVIEW DE CARDS IA (screen === 'ai-preview')

**Modal más ancho:** `max-w-2xl` (en vez de max-w-lg)

**Header:** `Sparkles` + "5 Flashcards Generadas" `style={{ fontFamily: 'Georgia, serif' }}` + subtítulo "Revisá y seleccioná las que querés guardar" `text-sm text-gray-500 fontWeight:400 mt-1`

**Estado:** `const [selectedAI, setSelectedAI] = useState(new Set(AI_GENERATED_CARDS.map((_, i) => i)))`
(todas seleccionadas por default)

**Lista de cards (scrollable):**

Para cada card en AI_GENERATED_CARDS:

```
┌────────────────────────────────────────────────┐
│  [✓] Seleccionada                        [✏️]  │
│                                                │
│  F: ¿Cuáles son las 3 capas de una arteria?   │
│                                                │
│  R: Túnica íntima (endotelio), túnica media    │
│     (músculo liso) y túnica adventicia          │
│     (tejido conectivo).                        │
└────────────────────────────────────────────────┘
```

- Contenedor: `p-4 rounded-xl border mb-3 transition-all cursor-pointer`
  - Seleccionada: `border-teal-200 bg-teal-50/30`
  - Deseleccionada: `border-gray-200 bg-gray-50 opacity-60`
- Click en el contenedor → toggle selección
- Checkbox visual: `w-5 h-5 rounded border-2 flex items-center justify-center`
  - Checked: `bg-[#2a8c7a] border-[#2a8c7a]` con `Check` icon blanco size 12
  - Unchecked: `border-gray-300 bg-white`
- "F:" label: `text-[10px] uppercase tracking-wider text-[#2a8c7a] fontWeight:700`
- "R:" label: `text-[10px] uppercase tracking-wider text-emerald-500 fontWeight:700`
- Pregunta: `text-sm text-gray-800 fontWeight:600`
- Respuesta: `text-sm text-gray-600 fontWeight:400`
- Botón editar: `text-gray-400 hover:text-[#2a8c7a]` icono `Pencil` size 14 — en el prototipo, solo mostrar el icono (no implementar edición inline)

**Footer:**
- Counter: `"{n} de 5 seleccionadas"` — `text-xs text-gray-500 fontWeight:500 mb-3`
- Botones: misma estructura que modal manual
  - "Cancelar" → `setScreen('deck')`
  - "Guardar {n} cards" → agregar cards seleccionadas a myCards, cerrar, toast

---

### PANTALLA 5: SESSION VIEW (screen === 'session')

Pantalla fullscreen de estudio con flujo reveal → rate.

**Estado:**
```jsx
const [sessionCards] = useState([...myCards, ...OFFICIAL_CARDS]); // todas mezcladas
const [currentIdx, setCurrentIdx] = useState(0);
const [isRevealed, setIsRevealed] = useState(false);
const [sessionRatings, setSessionRatings] = useState([]);
const [showNoteInput, setShowNoteInput] = useState(false);
const [showReportMenu, setShowReportMenu] = useState(false);
```

**Layout fullscreen:**
- `flex flex-col h-screen bg-[#111118]` — NO, corregir: usar `bg-white` para el card interior
- Estructura:

```
┌──────────────────────────────────────────────┐
│ PROGRESS BAR (6px, gradiente por ratings)    │
├──────────────────────────────────────────────┤
│ [✕ Salir]    3 / 14 (11 restantes)   [···]  │ ← header
├──────────────────────────────────────────────┤
│                                              │
│       🧠 PREGUNTA                            │
│                                              │
│  ¿Cuáles son las 4 cavidades                │
│  del corazón?                                │
│                                              │
│         [👁 Mostrar Respuesta]               │ ← si no revelada
│                                              │
│  ── si revelada: ──                          │
│                                              │
│  ✅ RESPUESTA                                │
│  Aurícula derecha, aurícula izquierda...     │
│                                              │
│  ┌─ 📝 Agregar nota (colapsable) ─────────┐ │ ← NUEVO
│  │ [textarea]                              │ │
│  └─────────────────────────────────────────┘ │
│                                              │
├──────────────────────────────────────────────┤
│  ¿Qué tan bien lo sabías?                   │
│  [1 No sé] [2 Difícil] [3 Regular]          │
│  [4 Fácil] [5 Perfecto]                     │
└──────────────────────────────────────────────┘
```

**Header bar:**
- `flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100`
- Izq: botón salir — `X` icon + "Salir" `text-xs fontWeight:500 text-gray-400 hover:text-gray-700`
- Centro: counter `"3 / 14"` en `bg-[#F0F2F5] rounded-lg px-3 py-1.5 text-sm fontWeight:700 text-[#1B3B36]`
- Der: botón `MoreVertical` size 16 `text-gray-400` — Click → toggle `showReportMenu`

**Menú de 3 puntos (dropdown):**
- `absolute top-12 right-4 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 w-48`
- Opción 1: `Flag` icon + "Reportar error" — `flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50 cursor-pointer`
- Opción 2: `PenLine` icon + "Agregar nota" — mismo estilo. Click → `setShowNoteInput(true); setShowReportMenu(false)`

**Pregunta (no revelada):**
- Centrada vertical y horizontalmente en el espacio disponible
- Label: "🧠 Pregunta" — `text-[#2a8c7a] text-xs uppercase tracking-[0.15em] fontWeight:600` con icono `Brain` size 13
- Texto: `text-xl md:text-2xl lg:text-3xl text-gray-900 fontWeight:700 text-center`

**Botón revelar:**
- `bg-[#1B3B36] text-white px-8 py-3.5 rounded-full shadow-lg fontWeight:600 text-sm flex items-center gap-2.5 cursor-pointer hover:bg-[#244e47]`
- Icono `Eye` size 16

**Después de revelar:**
- Pregunta se achica: `text-base text-gray-500 fontWeight:500 text-left` en zona superior con `bg-[#F0F2F5]/80 p-6 border-b border-gray-200/60`
- Respuesta aparece debajo: `p-6 bg-white`
  - Label: "✅ Respuesta" — `text-emerald-500 text-xs uppercase tracking-[0.15em] fontWeight:600` con `CheckCircle` size 14
  - Texto: `text-lg md:text-xl text-gray-900 fontWeight:700 leading-relaxed`

**Nota personal (NUEVO — colapsable, post-reveal):**
> **Nota para implementación real:** El proyecto ya tiene `BlockAnnotationsPanel` que implementa notas por bloque con un patrón similar (textarea teal, colapsable). Reusar ese patrón al portar a producción.
- Toggle: "＋ Agregar nota" — `text-[11px] text-amber-600 fontWeight:500 cursor-pointer px-6 py-2` con `PenLine` size 10
- Expandido (si `showNoteInput`):
  - Contenedor: `mx-6 mb-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100`
  - Textarea: `w-full p-2 rounded-lg border border-amber-200 bg-white text-xs text-gray-700 placeholder:text-gray-400 min-h-[40px] resize-none outline-none focus:border-amber-400`
  - Placeholder: "ej: Me confundo con la diferencia entre sístole y diástole..."

**Rating buttons (zona inferior, solo post-reveal):**
- Contenedor: `bg-[#F0F2F5] border-t border-gray-200 px-4 py-4`
- Label: "¿Qué tan bien lo sabías?" — `text-[11px] text-gray-400 fontWeight:500 text-center mb-3`
- Grid: `grid grid-cols-5 gap-1.5 sm:gap-2 max-w-xl mx-auto`
- Cada botón de rating:
  - Cuadrado: `h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center text-white fontWeight:700 cursor-pointer transition-transform active:scale-95`
  - Color: usar RATINGS[i].color
  - Número grande + label debajo
  - **Al click:** agregar rating al array, avanzar `currentIdx`, resetear `isRevealed` y `showNoteInput`
  - Si `currentIdx >= sessionCards.length - 1` → `setScreen('summary')`

---

### PANTALLA 6: SUMMARY VIEW (screen === 'summary')

**Layout:** `flex flex-col items-center justify-center h-screen bg-zinc-50 p-4 sm:p-8 text-center`

**Contenido (centrado verticalmente):**
1. Icono trofeo: `w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-6 shadow-xl shadow-teal-500/25` — `Trophy` size 40 `text-teal-500`
2. "Sesión Completada!" — `text-2xl sm:text-3xl fontWeight:700 text-gray-900 mb-2` **+ `style={{ fontFamily: 'Georgia, serif' }}`**
3. "Completaste {n} flashcards" — `text-gray-500 text-sm mb-8`
4. **Donut de mastery:**
   - SVG circle `w-36 h-36 sm:w-48 sm:h-48`
   - Calcular promedio de ratings
   - Porcentaje grande en el centro: `text-3xl fontWeight:700`
   - "Dominio" debajo: `text-xs text-gray-500 fontWeight:600 uppercase`

5. **Banner "Crear cards de refuerzo"** (si promedio < 3.5):
   - `bg-teal-50/80 border border-teal-200/40 rounded-2xl p-4 mt-8 max-w-sm`
   - Icono `PenLine` + "¿Querés crear cards sobre lo que más te costó?"
   - Botón: "Crear cards de refuerzo" → `setScreen('create-ai')` con tema pre-sugerido

6. **Botones:**
   - `flex flex-col sm:flex-row gap-3 mt-8`
   - "Volver al Deck": `px-6 py-3 rounded-full border border-gray-300 text-gray-600 fontWeight:600 hover:bg-gray-50 cursor-pointer`
   - "Practicar de Nuevo": `px-6 py-3 rounded-full text-white fontWeight:600 shadow-lg cursor-pointer` — backgroundColor del mastery color del promedio

---

## TOAST NOTIFICATION

Componente inline para toasts:

```jsx
const [toast, setToast] = useState(null);
// Mostrar: setToast('✓ Flashcard creada')
// Auto-dismiss: useEffect con setTimeout 2500ms → setToast(null)
```

**Visual:**
- `fixed top-4 left-1/2 -translate-x-1/2 z-[60]`
- `bg-emerald-500 text-white px-4 py-2.5 rounded-full text-sm fontWeight:600 shadow-lg flex items-center gap-2`
- Icono `Check` size 14
- Transición: aparecer con slide-down (manejar con conditional render + transition classes)

---

## CHECKLIST FINAL

Antes de entregar el `.jsx`, verificar:

- [ ] Las 6 pantallas son navegables clickeando botones
- [ ] Los colores coinciden con la tabla de Design Tokens (NO inventar otros)
- [ ] **TODOS los títulos/headings usan `style={{ fontFamily: 'Georgia, serif' }}`** (títulos de pantalla, de modal, de sección, pregunta en MiniCard, "Sesión Completada")
- [ ] Textos de body, labels, botones y captions NO llevan fontFamily (usan default sans)
- [ ] Botones disabled cuando campos están vacíos (opacity-50)
- [ ] Toast aparece al crear/guardar cards
- [ ] Cards personales se distinguen de oficiales (borde dashed teal + badge "Personal")
- [ ] Cards oficiales tienen badge "Oficial ✓"
- [ ] Empty state no es necesario en este prototipo (ya hay 2 cards personales)
- [ ] Loading state en IA (spinner 2 segundos)
- [ ] Session funciona: reveal → rate → siguiente card → summary
- [ ] Nota personal es colapsable (empieza oculta)
- [ ] Menú 3 puntos en session tiene "Reportar" y "Agregar nota"
- [ ] Mobile responsive: grid 2 cols, modal full-width en mobile
- [ ] TODO el texto está en español argentino (vos/querés, no tú/quieres). NO portugués.
- [ ] NO hay gradientes morados, glassmorphism, ni "AI slop"
- [ ] El componente tiene `export default` y no requiere props
- [ ] Solo importa de "react" y "lucide-react"
- [ ] Click en backdrop de modales usa `e.target === e.currentTarget` (no cierra al click dentro)

---

## NOTAS PARA EL AGENTE

1. **Prioridad:** que sea navegable y que se SIENTA como Axon. Es un prototipo para validar UX, no código de producción.
2. **Si algo no queda claro:** elegir la opción más simple y limpia. Menos es más.
3. **Tamaño estimado:** ~600-900 líneas de JSX.
4. **Nombre del archivo:** `Prototipo_Flashcard_Alumno_v1.jsx`
5. **Guardar en:** `/sessions/festive-charming-hypatia/mnt/AXON PROJECTO/Prototipo_Flashcard_Alumno_v1.jsx`
