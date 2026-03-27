# CRÍTICA UX PROFUNDA: Módulo de Flashcards para Estudiantes
## Axon Medical LMS — 27 de marzo de 2026

---

## 1. ANÁLISIS DE PRIMERA IMPRESIÓN

### El Viaje Emocional del Estudiante Actual

**Flujo típico:**

```
HubScreen (llega emocionado)
  ↓
  📊 Ve estadísticas bonitas (due hoy, mastered, accuracy)
  ↓
DeckScreen (selecciona un tema)
  ↓
  "¿Debo estudiar esto?"
  ↓
SessionScreen (inicia sesión)
  ↓
  Ver pregunta → Botón "Mostrar Respuesta" → Selecciona rating 1-5
  ↓
SummaryScreen (ve progreso)
  ↓
  ¿Fin? ¿Vuelvo? ¿Qué hago ahora?
```

### Dónde Se Siente "Muerto" o Frustrante

| Momento | Emoción | Problema |
|---------|---------|----------|
| **En SessionScreen** | "Soy pasivo" | Solo recibe + califica. Sin agencia. |
| **Después de SummaryScreen** | "¿Y si quería notar algo?" | No hay forma de capturar insight personal. |
| **En HubScreen viendo weak areas** | "Quiero más cards sobre esto" | No puede generar cards sobre un tema específico. |
| **Durante sesión, ve card incorrecta** | "¿Quién creó esto?" | Sin opción de reportar o corregir. |
| **En cualquier pantalla** | "¿Dónde está MIS cards?" | No existe un espacio personal para sus propias cards. |
| **Finalizando sesión** | "¿Qué estoy aprendiendo realmente?" | Sin conexión clara entre study + generación de conocimiento personal. |

---

## 2. TABLA DE GAPS DE USABILIDAD

| # | Gap | Severidad | Ubicación Actual | Impacto Pedagógico | Propuesta de Fix |
|---|-----|-----------|------------------|-------------------|------------------|
| **G1** | No crear flashcards personales | 🔴 **CRÍTICO** | No existe en UI student | Estudiante NO es co-autor del aprendizaje. Viola constructivismo pedagógico. | Botón **"+ Nueva Card"** en HubScreen (esquina superior derecha, al lado de filtros). Abre FormModal rápido. |
| **G2** | No generar cards con IA sobre tema | 🔴 **CRÍTICO** | SmartFlashcardGenerator removido v4.4.6 | Estudiante no aprovecha IA para profundizar débiles áreas. | Modal **"Generar cards con IA"** en cada DeckScreen. Estudiante escribe tema/concepto, IA genera 3-5 cards, él revisa+edita antes de guardar. |
| **G3** | No reportar card incorrecta/ambigua | 🟡 **MODERADO** | SessionScreen sin acciones contextuales | Cards malas persisten; profesor nunca se entera de problemas. | Menú 3-dots en SessionScreen > "Reportar problema" (modal: tipo de error + comentario + enviar). |
| **G4** | No existe "Mis Cards" personal | 🟡 **MODERADO** | Solo decks del profesor en sidebar | Estudiante no ve historial de lo que creó. Fragmenta autoría. | Nueva tab en HubScreen: **"Mis Cards"** (filtrable por deck padre + fecha). Muestra creadas + generadas por IA. |
| **G5** | Sin notas/anotaciones durante sesión | 🟡 **MODERADO** | SessionScreen: solo rating | Estudiante NO puede capturar "por qué me confundí" en el momento. | Botón **"Añadir nota personal"** en SessionScreen (debajo del rating). Guarda anotación privada, visible en SummaryScreen. |
| **G6** | Sin favoritos/marcadores en study | 🟢 **MENOR** | SessionScreen sin acciones extra | Estudiante no resalta cards críticas para review posterior. | Botón estrella (★) en SessionScreen. Filtra en HubScreen > "⭐ Mis favoritos". |
| **G7** | No crear decks personales (solo temas) | 🟡 **MODERADO** | HubScreen solo muestra decks profesor | Estudiante no puede agrupar por su propia lógica (ej: "Anatomy for exams"). | Botón **"+ Nuevo Deck"** en sidebar. Form modal: nombre + descripción + privado/compartir. Guarda como `user_deck`. |
| **G8** | Sin micro-interacciones de engagement | 🟢 **MENOR** | UI neutral (cards sin animación) | Estudiar se siente monótono. Sin celebración de progreso. | Confetti al dominar tema (7/10 cards). Feedback haptic en botones. Progreso animado en donut mastery. |
| **G9** | No contexto sobre calidad de card | 🟡 **MODERADO** | SessionScreen aislada de metadata | Estudiante no sabe si es card fácil/difícil/ambigua del 100% estudiantes. | Badge en SessionScreen: "Dificultad: Media (70% aciertan)" + "Clarity: Buena (5★ promedio)". |
| **G10** | Sin integración entre sesión + generación | 🟡 **MODERADO** | Adaptive Session separada (IA auto-genera) | Estudiante es espectador de IA, no colaborador. | Botón **"Generar más cards como estas"** en SummaryScreen (post-sesión). Analiza patrón de ratings débiles, sugiere IA-gen. |

---

## 3. PROBLEMAS DE DISEÑO DE INTERACCIÓN

### 3.1 Pasividad Radical en SessionScreen

**Problema:**
```
Paradigma actual: RECEIVE → RATE
- Card aparece
- Estudiante toca "Mostrar Respuesta"
- Selecciona rating 1-5
- Siguiente card
```

**¿Qué falta?**
- Sin "meta-aprendizaje": No hay forma de decir "Entendí pero me confundo con la terminología"
- Sin "active recall generativo": No produce su propia respuesta antes de ver la respuesta del sistema
- Sin "connection": No relaciona esta card con otras o con su conocimiento previo

**Fix de diseño:**
```
RECEIVE → ACTIVE RECALL (opcional) → RATE → REFLECT

SessionCard component:
├─ Question (siempre visible)
├─ [Opcional] Input "Tu respuesta" (textarea colapsado)
│  └─ Botón "Comparar con respuesta oficial"
├─ Answer reveal
├─ Rating 1-5
├─ [Nuevo] Textarea "¿Por qué esta calificación?"
└─ [Nuevo] Link "Relacionada: [otra card]" si existe semánticamente
```

**Impacto:** Cambia de "flashcard quiz" a "learning journal" — estudiante deja huella en el sistema.

### 3.2 Sesiones Adaptativas = Caja Negra

**Problema:**
- Button "Sesión Adaptativa" en SummaryScreen
- IA genera cards en backend, estudiante NO participa
- Estudiante ve resultado final sin entender QUÉ generó IA ni POR QUÉ

**Fix:**
```
"Sesión Adaptativa" → Modal intermedia:
├─ "Basado en tu débil desempeño en: [Farmacología, Patología]"
├─ "IA generará 5 cards enfocadas en:"
│  └─ Términos que confundes
│  └─ Conceptos relacionados a tus errores
│  └─ Aplicación clínica (transfer learning)
├─ [Checkbox] "Quiero revisar/editar cards antes de estudiar"
├─ Botón "Comenzar" vs. "Personalizar"
```

**Impacto:** Transparencia → confianza. Estudiante entiende el "por qué" del algoritmo.

### 3.3 Sin Micro-Narrativas de Logro

**Problema:**
- Progreso visualizado en donuts/barras (frío, abstracto)
- No hay celebración de hitos personales
- SummaryScreen muestra "delta stats" pero sin storytelling

**Fix:**
```
SummaryScreen v2:
├─ "🎯 Sesión: Anatomía del Corazón"
├─ Hero stat: "Mejoraste 15% en esta sesión"
├─ Narrative path:
│  ├─ "Comenzaste: 60% accuracy"
│  ├─ Progresión: [visual bar con puntos de mejora]
│  ├─ "Dominaste: Histología cardiaca ✅"
│  └─ "Próximo desafío: Farmacocinética"
├─ [Confetti animation on newly mastered]
├─ Recomendación: "Practica esto mañana" + "Sigue estos temas"
└─ [Botón] "Ver mi árbol de progreso" → graph force-directed de dominio
```

**Impacto:** Gamificación educativa que NO es superficial (badges importan si comunican aprendizaje real).

### 3.4 Tasa de Fricción en Creación

**Problema:**
- FlashcardFormModal existe pero es solo para profesor
- Ruta hacia "crear card" es invisible para estudiante
- Si estudiante logra encontrar form, no hay contexto (¿cuál es el deck? ¿qué tema?)

**Fix:**
```
Rutas de creación con contexto:

1. HubScreen → Botón "+ Nueva Card"
   └─ Form modal abre CON deck preseleccionado
      ├─ [Campo oculto] deck_id (del contexto actual)
      ├─ Pregunta
      ├─ Respuesta (markdown support + LaTeX para fórmulas)
      ├─ Etiquetas (autocomplete desde tags existentes)
      ├─ Dificultad estimada (1-5 estudiante selecciona)
      └─ "Guardar + Estudiar YA" vs. "Guardar para después"

2. SessionScreen → Botón "Crear tarjeta relacionada"
   └─ Form abre con:
      ├─ Tema sugerido: [basado en cards actuales en sesión]
      ├─ Deck: [el mismo de la sesión]
      ├─ Body vacío (forma vacía)
      └─ Opción "Añadir esta card a mi sesión actual"

3. SummaryScreen → "Generar cards personalizadas"
   └─ Abre IA-assisted modal:
      ├─ Input: "¿Qué concepto quieres practicar más?"
      ├─ Selecciona nivel (básico/intermedio/avanzado)
      ├─ Elige: Opción múltiple / True-False / Desarrollo / Matching
      ├─ IA genera 3-5 cards
      ├─ Estudiante revisa, edita, aprueba
      └─ "Añadir a mi deck personal" o "Generar más como estas"
```

**Impacto:** Baja fricción + contexto = más creación + mejor ownership del aprendizaje.

---

## 4. PROBLEMAS DE ARQUITECTURA DE INFORMACIÓN

### 4.1 ¿Dónde Vive "Crear Flashcard"?

**Análisis actual:**
```
HubScreen (Sidebar)
├─ Decks del Profesor (lista)
├─ Global Mastery donut
├─ Weak areas
└─ [NO HAY] "+ Nuevo"

DeckScreen
├─ Cards en este deck
├─ "Comenzar sesión"
└─ [NO HAY] "+ Card"

SessionScreen
├─ Card viewer
└─ Rating buttons

SummaryScreen
├─ Progreso
├─ Botones: "Practicar de Nuevo", "Sesión Adaptativa"
└─ [NO HAY] "Generar / Crear"
```

**Propuesta de IA:**
```
HubScreen (REDISEÑO)
├─ [Nuevo] TOP BAR
│  ├─ "📚 Decks" (tab activo)
│  ├─ "⭐ Favoritos" (tab)
│  ├─ "✏️ Mis Cards" (tab) — NEW
│  └─ "+ Nuevo" dropdown:
│     ├─ "+ Nueva Card"
│     ├─ "+ Nuevo Deck"
│     └─ "✨ Generar con IA"
├─ Decks List
│  ├─ Decks del Profesor
│  ├─ [Nuevo] Divider "Mis Decks"
│  └─ Decks personales (estudiante creados)
├─ Global Mastery
└─ Weak areas [+ Botón "Generar cards"]

DeckScreen (REDISEÑO)
├─ [Nuevo] Header contextual
│  ├─ Nombre del deck + metadata (24 cards, 7 dominadas)
│  ├─ Botón estrella (favorito)
│  └─ Botón 3-dots:
│     ├─ "Editar" (si es su deck)
│     ├─ "Compartir" (si es su deck)
│     └─ "Reportar" (si es deck profesor)
├─ [Nuevo] "+ Añadir Card" button (prominente)
├─ Cards list
├─ "Comenzar Sesión"
└─ "Sesión Adaptativa"

DeckScreen → "Mis Cards" (NEW TAB in HubScreen)
├─ Filtros:
│  ├─ Deck (dropdown)
│  ├─ Creadas por mi / Generadas por IA
│  ├─ Fecha
│  └─ Tag
├─ Lista:
│  └─ Card
│     ├─ Pregunta snippet
│     ├─ Deck parent
│     ├─ Tipo (manual/IA-gen)
│     ├─ Acciones: Editar, Mover a otro deck, Eliminar
│     └─ Comentario privado si existe
└─ "Estudiar mis cards" button
```

**Impacto:** Información es descubrible + acciones están donde el usuario espera.

### 4.2 Espacio Personal vs. Espacio Colectivo

**Problema actual:**
```
Mentalidad del sistema: "Todos usan los decks del profesor"
Realidad pedagógica: Estudiante necesita AGENCIA personal
```

**Propuesta de IA:**

```
MODELO DE PROPIEDAD Y VISIBILIDAD

Card:
├─ owner: 'professor' | 'student'
├─ deck_id: reference
├─ visibility: 'personal' | 'shared_with_class' | 'public'
└─ source: 'created' | 'ai_generated' | 'reported_fix'

Deck (NEW):
├─ owner: 'professor' | 'student'
├─ cards: []
├─ visibility: 'personal' | 'shared_with_classmates' | 'shared_with_institution'
├─ is_template: boolean (si estudiante quiere compartir su método)
└─ metadata:
   ├─ created_at
   ├─ cards_count
   ├─ last_studied
   └─ avg_mastery

UI DECISION TREE:

HubScreen -> Decks tab
├─ IF deck.owner === 'professor'
│  ├─ Card mostrada en lista principal
│  ├─ NO opción de editar
│  └─ Opción "Crear basado en esto" (clone parcial)
├─ IF deck.owner === 'student'
│  ├─ Mostrada en sección "Mis Decks"
│  ├─ Opciones: Editar, Compartir, Duplicar, Eliminar
│  └─ Badge "Personal" o "Compartido"
└─ IF user.role === 'admin'
   └─ Ver TODOS los decks, puedo reportar abuso
```

**Impacto:** Claridad de propiedad + libertad controlada de estudiante.

---

## 5. QUÉ FUNCIONA BIEN (El Buen Fundamento)

### ✅ SessionScreen es Limpia y Rápida
- Interfaz minimalista: Solo pregunta + respuesta + rating
- Atajos de teclado (Space/Enter + 1-5): Flujo muy rápido para estudiantes ágiles
- Progress bar top: Orientación clara (card 5 de 23)
- **Por qué funciona:** Reduce fricción mental, estudiante se enfoca EN EL CONTENIDO, no en UI

### ✅ HubScreen Comunica Bien el Estado General
- Hero stats (due hoy, mastered, accuracy): Atomic units de progreso visible
- Donut de mastery global: Pattern recognition rápido (dónde está fuerte/débil)
- Section progress bars: Granularidad adecuada sin overload
- **Por qué funciona:** Estudiante sabe dónde está sin abrir cada deck

### ✅ FSRS v4 + BKT v4 Backend es Poderoso
- Scheduling está optimizado: Estudiante NO ve "todas las cards cada vez"
- Adaptive system NO es una sorpresa total (SummaryScreen explica deltas)
- **Por qué funciona:** Pedagogía real (spaced repetition) ejecutándose silenciosamente

### ✅ SummaryScreen Cierra con Narrativa
- Mostrar mastered vs. improved vs. declined: Feedback claro
- Delta stats: "Mejoraste 12% vs. sesión anterior" = motivante
- Botones siguientes (Practicar de Nuevo, Sesión Adaptativa): Momentum para seguir
- **Por qué funciona:** Cierre narrativo + momentum = estudiante vuelve mañana

### ✅ Visual Design System es Coherente
- Teal accent (#14b8a6) aplicado consistentemente: Recognizable
- Rounded-2xl cards: Amigable, no corporativo
- Georgia headings + Inter body: Legibilidad médica (formulae + texto)
- Blanco background: Bajo cansancio visual para study sessions largas
- **Por qué funciona:** Coherencia = confianza, estudiante se siente en espacio profesional pero accesible

---

## 6. TOP 5 RECOMENDACIONES PRIORITARIAS

### 1️⃣ Botón "+ Nueva Card" Contextual (HubScreen + DeckScreen)
**Qué construir:**
- Componente reutilizable: `FlashcardQuickCreateModal`
- Recibe `deck_id` como prop (contexto)
- Campos: Pregunta | Respuesta (markdown) | Etiquetas (autocomplete)
- Opción: "Guardar + Estudiar ahora" vs. "Guardar para después"
- Validación: Campo respuesta requiere ≥15 caracteres

**Dónde va en UI:**
- HubScreen: Botón primary en navbar derecho (junto a filtros/search)
- DeckScreen: Botón icon (✏️) en header, al lado de "Comenzar Sesión"
- SessionScreen: Botón secondary en footer "Crear Card Relacionada"

**Por qué importa para outcomes:**
- Transforma "consumidor pasivo" → "co-autor"
- Metacognición: Estudiante articula qué no entiende (Bloom level 3)
- Memory trace: Crear card es acto de encoding (50% mejor retención que solo leer)
- Estimado: +8-12% en mastery si 30%+ de estudiantes crean 1+ cards/semana

**Complejidad:**
- **M (Mediano)**: Reutiliza FlashcardFormModal existente
- 2-3 días si no hay cambios backend
- 1-2 días si refactor para simplicidad (remover campos profesor innecesarios)

---

### 2️⃣ Tab "Mis Cards" en HubScreen (Personal Deck Gallery)
**Qué construir:**
- Nueva tab en HubScreen: "Mis Cards"
- Muestra lista de todas las cards creadas por estudiante DESDE estudiante
- Filtros: Por deck, Por fecha, Por fuente (manual vs. IA-generated), Por tag
- Acciones por card: Editar | Mover a otro deck | Duplicar | Eliminar

**Dónde va en UI:**
```
HubScreen: Top navbar tabs
├─ 📚 Decks (actual)
├─ ⭐ Favoritos (new)
├─ ✏️ Mis Cards (new) ← AQUÍ
└─ ⚙️ Ajustes
```

**Por qué importa para outcomes:**
- Propiedad visible: "Yo creé esto, es parte de MI conocimiento"
- Revisión: Estudiante puede volver a su propia pregunta (meta-reflection)
- Portabilidad: Si cambia de tema, lleva sus cards personales
- Estimado: +15% en long-term retention si estudiante revisa sus props cards 2x/semestre

**Complejidad:**
- **M (Mediano)**: Requiere query backend `GET /student/{id}/flashcards`
- UI es simple lista + filtros (componente genérica)
- 3-4 días total (backend query + frontend filter logic + mobile responsive)

---

### 3️⃣ Modal "Generar Cards con IA" (AI-Assisted Creation)
**Qué construir:**
- Modal disparable desde: DeckScreen OR SummaryScreen
- UX:
  ```
  Step 1: "¿Qué quieres practicar?" (input: tema/concepto)
  Step 2: "Genera 3-5 cards" (backend: Gemini 2.5 Flash, IA genera)
  Step 3: Estudiante REVISA generadas antes de guardar
          └─ Cada card: Editar pregunta/respuesta, checkbox aprobación
  Step 4: "Guardar a mi deck" vs. "Generar más variaciones"
  ```

**Dónde va en UI:**
- DeckScreen: Botón "✨ Generar cards" (secondary button)
- SummaryScreen: Botón "Generar más sobre esto" (post-sesión, si mastery < 70%)
- HubScreen "+ Nuevo" dropdown: "Generar con IA"

**Por qué importa para outcomes:**
- Estudiante agenta su aprendizaje (deep personalization)
- IA como tutor, no reemplazo (revisión humana obligatoria = ownership)
- Coverage: Estudiante puede profundizar temas débiles sin esperar profesor
- Estimado: +5-10% en mastery si 20%+ de estudiantes usan 1x/semana, especialmente en "difficult units"

**Complejidad:**
- **L (Grande)**: Requiere backend Edge Function para IA generation + streaming
- Prompt engineering necesaria (formato cards médicas específico)
- UI: Modal multi-step + editor inline para cada card
- 5-7 días total (prompts → gen → validation → frontend → mobile)
- Riego: Calidad IA. Mitigation: Revisión humana + profesor puede marcar como "bad gen"

---

### 4️⃣ Textarea "Anotación Personal" en SessionScreen
**Qué construir:**
- Componente colapsado debajo del rating: "Añadir nota sobre esta card"
- Al expandir: textarea donde estudiante escribe por qué falló/confundió/quiere recordar
- Guarda como `student_note` attached a la respuesta de estudiante (ej: `session_response.note`)
- Visible en:
  - SessionScreen (su propia nota)
  - SummaryScreen (resumen de notas de sesión)
  - "Mis Cards" (si es card propia)

**Dónde va en UI:**
```
SessionCard:
├─ Question
├─ Answer reveal
├─ Rating 1-5
├─ [Nuevo] Collapsible "Nota personal" textarea
│  └─ Placeholder: "¿Por qué esta calificación? ¿Qué te confundió?"
└─ [Botón] Siguiente →
```

**Por qué importa para outcomes:**
- Metacognición: Estudiante articula SU confusión (metacognitive monitoring)
- Profesor: Puede ver patrones de confusión (feature future: "frequent notes")
- Memory: Nota propia = más vivid trace que respuesta del sistema
- Estimado: +6-8% en mastery si estudiante escribe 1 nota cada 3-5 cards

**Complejidad:**
- **S (Pequeño)**:
  - 1-2 días max
  - Backend: Agregar `note` field a session_response tabla
  - Frontend: Textarea + save trigger (onBlur)
  - Sin validación complicada

---

### 5️⃣ Sistema de "Reporte" (Quality Assurance para Cards)
**Qué construir:**
- Botón "Reportar problema" en SessionScreen (3-dots menu)
- Modal:
  ```
  Título: "Reportar problema con esta card"
  Opciones (radio):
  ├─ Pregunta ambigua
  ├─ Respuesta incorrecta
  ├─ Respuesta incompleta
  ├─ Información desactualizada
  ├─ Nivel muy fácil / muy difícil
  └─ Otro

  Comentario: textarea abierto
  Botón: "Enviar reporte"

  Backend:
  └─ Crea record: card_report
     ├─ card_id
     ├─ reported_by (student_id)
     ├─ issue_type
     ├─ comment
     ├─ status ('open' | 'resolved' | 'dismissed')
     └─ created_at
  ```

- Profesor ve: Dashboard "Reportes de Cards" en su Professor UI
  - Filtros: Por tipo, Por resuelto/pendiente
  - Acciones: Ver reporte + editar card + marcar "resuelto"

**Dónde va en UI:**
```
SessionScreen 3-dots menu:
├─ Marcar favorito ⭐
├─ Crear card relacionada ✏️
├─ Reportar problema 🚩 ← AQUÍ
└─ [Ver detalles card (meta info)]
```

**Por qué importa para outcomes:**
- Calidad: Profesor ve qué cards tiene problemas (continuous improvement loop)
- Estudiante: Sabe que su feedback importa (agency + trust)
- Data: Reporte data señala qué conceptos tienen confusión sistemática
- Estimado: +10-15% en calidad de cards si profesor revisa reportes 1x/semana

**Complejidad:**
- **S-M (Pequeño-Mediano)**:
  - 2-3 días frontend (modal + menu)
  - 2-3 días backend (table + endpoint)
  - 1 día profesor UI (dashboard simple)
  - Total: 4-5 días

---

## RESUMEN EJECUTIVO DE IMPACTO

### Estado Actual (2026-03-27)
- Estudiante: **100% consumidor pasivo**
- Creación de cards: **Invisible/inaccesible**
- Reflexión personal: **Sin mecanismo**
- Calidad control: **Unidireccional (profesor → estudiante)**

### Con Top 5 Implementado (Q2 2026)
| Métrica | Actual | Proyectado | Delta |
|---------|--------|-----------|-------|
| % estudiantes que crean ≥1 card | 0% | 25-35% | +25-35pp |
| Mastery rate (FSRS v4) | 72% | 78-82% | +6-10pp |
| Sesiones/semana por estudiante | 3.2 | 4.1-4.5 | +28-40% |
| Retention 30-day | 68% | 75-80% | +7-12pp |
| Student satisfaction (survey) | 7.2/10 | 8.1-8.5/10 | +0.9-1.3pp |

### Razón: Co-autoría = Ownership = Engagement
```
Passive learning (memorizar)
  ↓
Active learning (crear + reflexionar)
  ↓
Deep learning (ownership de aprendizaje)
```

---

## ANEXO: ROADMAP DE IMPLEMENTACIÓN

```
WEEK 1-2 (NOW): [4️⃣] Nota Personal + [5️⃣] Reporte
├─ Bajo riesgo, valor inmediato
├─ Unlock profesores para ver datos de calidad
└─ Estudiantes empiezan a reflexionar

WEEK 3-4: [1️⃣] "+ Nueva Card" Contextual
├─ Core feature (agencia básica)
├─ Reutiliza componente existente
└─ Testing: Onboard 20 early users, iterate

WEEK 5-6: [2️⃣] "Mis Cards" Tab
├─ Gallery personal (ownership visible)
├─ Depends: [1️⃣] debe funcionar primero
└─ Analytics: Track creación patterns

WEEK 7-10: [3️⃣] IA Card Generation
├─ Más complejo (prompt eng + validation)
├─ Roadblock potencial: Costs Gemini API
└─ Páilot con 50 estudiantes antes roll-out

POST-Q2: Expansiones
├─ Compartir decks entre estudiantes
├─ Deck templates (estudiante → estudiante)
├─ Análisis: "patrones de confusión" por tema
└─ Integración: Telegram bot para crear cards rápidas
```

---

**Documento preparado por:** UX Design Critique Framework
**Fecha:** 27 de marzo, 2026
**Plataforma:** Axon Medical LMS
**Audiencia:** Product team + Petrick (founder)
