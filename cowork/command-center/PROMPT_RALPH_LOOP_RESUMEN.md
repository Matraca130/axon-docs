# PROMPT — Ralph Loop: Prototipo Completo de Resúmenes Axon

> Cómo usar: Copia SOLO la sección "PROMPT PARA CLAUDE CODE" y pégalo en la terminal de Claude Code. No uses las notas de uso — esas son para ti.

---

## PROMPT PARA CLAUDE CODE

Eres el agente principal de desarrollo del prototipo de resúmenes de Axon, una plataforma de educación médica. Tu objetivo es llevar el prototipo HTML actual a un prototipo funcional COMPLETO que luego se portará a producción (React 18 + Vite 6 + Tailwind v4).

## CONTEXTO DEL PROYECTO

Axon es un LMS médico. Los resúmenes son el módulo central: contenido estructurado en bloques con IA, keywords con mastery tracking, y herramientas de edición para profesores.

### Archivos de referencia (LEER PRIMERO):
1. Prototipo_v1_pro.html — Prototipo actual (634 líneas, HTML/CSS/JS puro). Vista estudiante funcional con 12 bloques, 6 keywords, mastery interpolado, animaciones de scroll. ESTE ES TU ARCHIVO BASE.
2. Prototipo_Resumenes_Axon.jsx — Spec original en React (801 líneas). Define los 10 tipos de bloque, dual mode (editor/student), BlockWrapper, InsertBlockButton, QuizModal. ESTE ES TU SPEC DE FEATURES.
3. Resumen_Aterosclerosis_Axon.html — Referencia de diseño con sidebar de Axon (947 líneas). Muestra el CSS real de producción.

### Stack del prototipo:
- HTML/CSS/JS puro (NO React, NO frameworks, NO CDN externos excepto Google Fonts)
- Fuentes: Crimson Pro (headings), Work Sans (body), Instrument Sans (logo), Instrument Serif (captions)
- Colores: darkTeal #1B3B36, tealAccent #2a8c7a, pageBg #faf9f6, warm-accent #c4704b
- Iconos: SVG inline stroke-based (Lucide/Feather style)

### Los 10 tipos de bloque:
prose, key_point, stages, comparison, list_detail, grid, two_column, callout, image_reference, section_divider

### Sistema de Keywords:
- Sintaxis en texto: se usa doble llave abriendo + keyword_id + doble llave cerrando
- Render: chip teal con popup hover/focus
- Cada keyword tiene: term, definition, related[]

### Sistema de Mastery (por bloque):
- Niveles 0 a 1.3, interpolación continua entre 5 colores: gray (0.0) -> red (0.5) -> yellow (0.85) -> green (1.0) -> blue (1.2)
- Se muestra como borde izquierdo + fondo sutil en cada bloque

---

## EL RALPH LOOP

Vas a ejecutar rondas iterativas de desarrollo. En cada ronda:

1. ANALIZAR — Lee el estado actual del prototipo completo
2. PLANIFICAR — Identifica las 3-5 mejoras de mayor impacto para esta ronda
3. IMPLEMENTAR — Aplica los cambios al HTML
4. VERIFICAR — Valida JS syntax, balance de tags, que no hay regresiones
5. DOCUMENTAR — Escribe un breve log de lo que cambió

### RONDAS Y PRIORIDADES:

#### RONDA 1-3: MODO EDITOR DEL PROFESOR
Objetivo: Construir toda la interfaz de edición que el profesor necesita.

Implementar:
- Toggle funcional Editor/Estudiante que cambia la UI completamente
- Modo Editor: cada bloque se envuelve en una card con barra superior (tipo de bloque label + drag handle + menu de 3 puntos), barra de mastery (progress bar del nivel del estudiante promedio), toolbar flotante al hover (Quiz, IA Transform, Eliminar)
- InsertBlockButton entre cada bloque: boton circular + que al click abre menu 2x5 con los 10 tipos
- Al insertar un bloque nuevo, se crea con contenido placeholder editable
- Context menu (click derecho o menu ...): Duplicar, Mover arriba/abajo, Regenerar con IA, Eliminar
- Edicion inline: click en cualquier texto de bloque activa contenteditable
- Cada bloque en modo editor tiene borde/shadow mas pronunciado para diferenciarlo

#### RONDA 4-5: SISTEMA DE IMAGENES
Objetivo: El profesor puede agregar, posicionar y redimensionar imágenes.

Implementar:
- Bloque image_reference: click en Agregar Imagen abre file picker (simulado con input type file)
- Preview de imagen con 3 tamanos: S (140px), M (220px), L (320px) — selector visual
- Posicion: izquierda o derecha (toggle) — texto fluye alrededor con float
- Drag para reposicionar la imagen dentro del bloque (mousedown/mousemove)
- Caption editable debajo de la imagen
- Cualquier bloque puede tener una imagen adjunta (no solo image_reference)

#### RONDA 6-7: INTERACCION IA POR SECCION
Objetivo: Cada bloque puede interactuar con IA de forma independiente.

Implementar:
- Boton IA en la toolbar de cada bloque (modo editor)
- Al click, abre panel lateral (o modal) con opciones: Reescribir (regenera el contenido del bloque manteniendo el tipo), Simplificar (reduce complejidad del texto), Expandir (agrega mas detalle), Cambiar tipo (convierte el bloque a otro tipo, ej: prose a list_detail), Generar quiz (crea un quiz de 4 opciones basado en el bloque), Extraer keywords (identifica y marca keywords en el texto)
- Preview del cambio ANTES de aplicar (diff visual: rojo = eliminado, verde = nuevo)
- Boton Aplicar / Descartar
- Simulacion: como es prototipo, simula la respuesta IA con delays y texto predefinido. Usa un loading skeleton mientras piensa.

#### RONDA 8-9: GENERACION AUTOMATICA DE RESUMEN
Objetivo: A partir de un tema o resumen previo, generar un resumen completo en formato de bloques.

Implementar:
- Boton Nuevo Resumen con IA en el header
- Modal que pide: Tema, Nivel (basico/intermedio/avanzado), Numero de bloques (~8-15)
- Opcion A partir de texto existente — textarea para pegar un resumen de texto plano
- Proceso de generacion simulado: (1) Muestra Analizando contenido con spinner, (2) Genera estructura: Creando 12 bloques (aparecen placeholders skeleton), (3) Llena bloque por bloque con animacion de streaming (texto aparece caracter por caracter), (4) Al final: Identificando keywords (los chips aparecen resaltados), (5) Asignando tipos de bloque (transforma algunos bloques)
- El resumen generado es completamente editable por el profesor
- JSON exportable: boton Exportar JSON que descarga la estructura de bloques

#### RONDA 10-12: UI/UX POLISH Y RESPONSIVE
Objetivo: Pulir cada detalle visual y asegurar que funciona en todos los dispositivos.

Implementar:
- Transiciones suaves entre modo editor y estudiante (morph animation)
- Drag and drop de bloques para reordenar (simulado con mousedown/mousemove)
- Undo/Redo (Ctrl+Z / Ctrl+Y) — stack de operaciones
- Sidebar con outline del resumen (lista de bloques, click para scroll)
- Responsive perfecto: mobile, tablet, desktop
- Keyboard shortcuts: Ctrl+E (toggle editor), Ctrl+S (guardar), Ctrl+N (nuevo bloque)
- Toast notifications para acciones (bloque eliminado, cambios guardados, etc.)
- Empty states (cuando no hay bloques, cuando no hay keywords)
- Loading skeletons para cada tipo de bloque
- Accesibilidad: ARIA completo, keyboard nav, screen reader friendly

#### RONDA 13-15: QUIZ Y MASTERY INTERACTIVO
Objetivo: El quiz por bloque funciona y actualiza el mastery en tiempo real.

Implementar:
- QuizModal: modal con pregunta MCQ de 4 opciones sobre el contenido del bloque
- Al responder: feedback visual (verde correcto, rojo incorrecto)
- Mastery update: +0.15 si correcto, -0.10 si incorrecto, clamped [0.2, 1.3]
- Animacion del cambio de mastery: el borde izquierdo transiciona de color en real-time
- Badge de mastery en modo editor: 85% con color interpolado
- Preguntas simuladas (como es prototipo): 2-3 preguntas por bloque, hardcoded
- Modo Study Session: recorre bloques con mastery bajo, hace quiz secuencial

---

## REGLAS CRITICAS

### Anti-AI-Slop (OBLIGATORIO):
- NUNCA uses Inter, Roboto, Arial como fuente principal
- NUNCA uses purple gradients
- NUNCA uses border-radius uniforme en todo (varia: 2px, 4px, 6px, 8px, 10px segun contexto)
- NUNCA centres todo — usa asimetria intencional
- NUNCA uses emojis — siempre SVG inline stroke-based
- Cada cambio visual debe ser INTENCIONAL, no decorativo

### Codigo:
- Todo en UN SOLO archivo HTML (CSS en style tag, JS en script tag)
- No React, no CDN externos excepto Google Fonts
- JS vanilla compatible con ES5+ (function, var ok — no modules)
- Validar JS syntax despues de cada ronda con: new Function(scriptContent)
- Validar balance de tags HTML despues de cada ronda
- Comentarios de seccion para navegacion: /* === NOMBRE === */

### Diseno:
- Fuentes: Crimson Pro (headings), Work Sans (body), Instrument Sans (logo), Instrument Serif (captions/accents)
- Color dominante: darkTeal con tealAccent como acento principal
- warm-accent #c4704b para elementos de alerta/examen
- pageBg #faf9f6 (warm off-white, NOT pure white)
- Textura de grano sutil en body (ya implementada)
- Sombras multicapa (micro + ambient) en cards

### UX del Profesor:
- TODO debe ser editable con click
- Las acciones destructivas piden confirmacion
- Los cambios de IA muestran preview antes de aplicar
- El profesor nunca pierde trabajo (undo siempre disponible)
- La interfaz de edicion debe ser OBVIA — no escondida

### UX del Estudiante:
- Vista limpia, sin distracciones (sin toolbars, sin handles, sin botones de edicion)
- Solo ve: contenido, keywords (hover popup), mastery (si esta activado), quiz (boton discreto)
- Scroll suave entre secciones
- Animaciones de entrada sutiles (ya implementadas)

---

## FORMATO DE CADA RONDA

Al iniciar cada ronda, muestra:

RONDA [N] — [TITULO]
Objetivo: [que se logra en esta ronda]

Al finalizar cada ronda:
1. Muestra resumen de cambios (que se agrego/modifico)
2. Muestra resultado de verificacion (JS ok, tags ok, lineas totales)
3. Pregunta: Continuar con Ronda [N+1] o quieres revisar algo?

---

## EMPIEZA AHORA

Lee Prototipo_v1_pro.html completo, luego lee Prototipo_Resumenes_Axon.jsx como spec de referencia. Despues empieza con RONDA 1.

Si el archivo tiene mas de 800 lineas, trabaja con ediciones quirurgicas (Edit tool), no reescribas todo.

Recuerda: este prototipo es la SPEC VISUAL que luego se porta a React. Cada feature que implementes aqui define como se vera y funcionara en produccion. Hazlo con la calidad de alguien que lleva meses puliendo este diseno.

---

## FIN DEL PROMPT

---

## NOTAS DE USO (NO copiar esto al prompt)

### Para ejecutar en Claude Code:
1. Abre Claude Code en la carpeta del proyecto
2. Copia desde "Eres el agente principal..." hasta "...puliendo este diseno."
3. Pegalo como prompt
4. Claude ejecutara la primera ronda y te preguntara antes de continuar
5. Puedes intervenir entre rondas: "salta a ronda 6", "repite esta ronda con mas detalle", "agrega X feature"

### Para resumir sesion y continuar despues:
Si se acaba el contexto, Claude Code puede resumir el progreso y continuar en una nueva sesion. El prompt incluye suficiente contexto para que cualquier instancia nueva entienda el proyecto.

### Variantes del prompt:
- Solo UI/UX: Usa solo las rondas 1-3 y 10-12
- Solo IA features: Usa solo las rondas 6-9
- Sprint completo: Usa todas las rondas 1-15
- Focus mode: Cambia el prompt a "Ejecuta SOLO la ronda [N], hazla en profundidad maxima"
