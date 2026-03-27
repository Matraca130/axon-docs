# Investigación: Patrones de Creación de Tarjetas Didácticas en Apps Médicas

**Fecha**: 2026-03-27
**Objetivo**: Identificar las mejores prácticas para flujos de creación de tarjetas en Axon (LMS médico)

---

## 1. ANÁLISIS POR PLATAFORMA

### Anki — El Estándar de Oro

**Flujo de Creación**
- **Pasos**: 3 (Crear mazo → Añadir → Rellenar Q&A)
- **Complejidad**: Media-alta (requiere aprendizaje de templates)
- Creación de tarjetas cloze (eliminación) en la misma oración
- Oclusión de imágenes (ocultar partes de diagramas)
- Soporte para multimedia: audio, imágenes, videos, LaTeX científico

**Asistencia IA**
- No integrada nativamente
- Ecosistema externo (anki-decks.com, Jungle AI) permite generar tarjetas desde texto

**Creación en Sesión**
- No está diseñado para crear tarjetas mientras estudias
- Necesita salir del flujo de estudio para crear nuevas tarjetas

**Personal vs Compartido**
- Los usuarios crean sus propios mazos
- Gran ecosistema de mazos compartidos (AnkiHub, compartidos en comunidades)
- Diferenciación clara: mazos personales vs descargados

**Mobile UX**
- Experiencia buena para estudio (pequeñas tarjetas, gestos naturales)
- Creación de tarjetas NO está optimizada para móvil — mejor en desktop

**Clave de Innovación**
- **Algoritmo FSRS (última generación)**: El más poderoso en spaced repetition
- Customización HTML/CSS completa de templates
- Ecosistema médico más rico (decks para Step 1, Step 2, etc.)

---

### Quizlet — Enfoque Masivo + AI

**Flujo de Creación**
- **Pasos**: 2-3 (Subir documento/notas → IA genera → Editar)
- **Complejidad**: Muy baja — optimizado para principiantes
- Magic Notes: Sube apuntes, IA genera automáticamente esquemas, tarjetas, tests, resúmenes

**Asistencia IA**
- **Central en la propuesta**: IA transforma notas, PDFs, slides en tarjetas
- Generación en lotes: de 1 documento → decenas de tarjetas en minutos
- AI Study Tools: práctica, guías de estudio, tests

**Creación en Sesión**
- No hay creación en vivo durante estudio
- Workflow: nota → generar → estudiar (separado)

**Personal vs Compartido**
- Biblioteca MASIVA de mazos preconstruidos (millones de sets públicos)
- Los estudiantes pueden compartir sus mazos personales
- Diferenciación débil entre oficial/estudiante — todo es comunitario

**Mobile UX**
- Excelente para estudio en móvil
- Creación principalmente en web (documento → IA)
- App móvil es solo para consumo

**Clave de Innovación**
- **Magic Notes**: La mejor integración IA-para-generación-masiva
- Ecosistema social (sets públicos descubribles)
- Features AI bloqueados en suscripción → monetización clara

---

### Brainscape — Confidence-Based Repetition

**Flujo de Creación**
- **Pasos**: 2-3 (Crear → Llenar → Estudiar)
- **Complejidad**: Baja
- Flashcard Copilot: AI para crear/refinar tarjetas una a una

**Asistencia IA**
- Generación en lotes con IA
- Copilot: construcción asistida interactiva (mejor para refinamiento)

**Creación en Sesión**
- No nativa en flujo de estudio

**Personal vs Compartido**
- Mazos personales
- Biblioteca de Brainscape Certified (curados por expertos)

**Mobile UX**
- Buena (basada en confianza — estudiantes califican 1-5)
- Creación mejor en web

**Clave de Innovación**
- **Confidence-Based Repetition (CBR)**: En lugar de solo medir correcto/incorrecto, usa la confianza autorreportada (1-5) del estudiante para espaciar
- Pregunta metacognitiva: "¿Qué tan confiado estás?" → optimiza tiempo de estudio
- Esto acelera aprendizaje vs spaced repetition clásico

---

### RemNote — Notas + Tarjetas Integradas

**Flujo de Creación**
- **Pasos**: 1-2 (Escribir nota + marcar con símbolo → Tarjeta creada)
- **Complejidad**: Muy baja — creación inline
- Syntax: `>>`, `==`, `::`, `;` para crear diferentes tipos (Basic, Cloze, Concept, Descriptor)

**Asistencia IA**
- IA genera tarjetas desde notas/PDFs/transcripciones de conferencias
- Integrada en el editor

**Creación en Sesión**
- **ÉL MEJOR AQUÍ**: Creas tarjetas mientras tomas notas → sin salir de flujo
- Escribes notas, inmediatamente marcas partes como tarjetas
- Luego estudias (spaced repetition integrado)

**Personal vs Compartido**
- Notas personales → tarjetas personales
- Posibilidad de compartir "rems" (bullets)

**Mobile UX**
- App móvil disponible
- Mejor para estudio que creación (Markdown con símbolos es incómodo en móvil)

**Clave de Innovación**
- **Creación inline en notas**: Revoluciona el workflow
- "Las tarjetas viven junto a tus notas" → aprendes MIENTRAS creas
- Syntax elegante y rápida (:: para bidireccional, ;; para descriptor)

---

### Osmosis — Médico-Específico (Consumo + Creación Colaborativa)

**Flujo de Creación**
- **Pasos**: 2-4 (Workspace → Subir notas/slides → Crear tarjetas → Compartir)
- **Complejidad**: Media
- Creación desde PowerPoints
- Creación colaborativa con compañeros (workspace compartido)

**Asistencia IA**
- No está claro si hay asistencia IA nativa
- Se genera desde notas/slides existentes

**Creación en Sesión**
- Posible en Quiz Builder (herramienta integrada)
- Algún soporte para crear mientras estudias

**Personal vs Compartido**
- **Diferenciación clara**: School Flashcards (custodias en Workspace) vs Custom Decks (personales)
- Workspace Flashcards pueden ser attachments en documentos compartidos
- Visualización de slides asociadas mientras estudias

**Mobile UX**
- App móvil con Quiz Builder → creación de quizzes en vivo
- Creación de tarjetas posible desde móvil

**Clave de Innovación**
- **Colaboración integrada**: Estudiantes crean tarjetas JUNTOS en workspace
- **Vinculación a diapositivas**: Cada tarjeta muestra su slide asociada → contexto instantáneo
- Algoritmo adaptativo que considera confianza (similar a Brainscape)

---

### Lecturio — Médico-Específico (Consumo Principal)

**Flujo de Creación**
- **Pasos**: Limitado — Lecturio es principalmente consumo
- Enfoque: 6,500+ videos, 20,000+ preguntas de repaso, 8,700+ de examen
- Los estudiantes NO crean tarjetas — consumen contenido de Lecturio

**Asistencia IA**
- Tutor IA personal que monitorea desempeño
- AI Qbank y planes de estudio personalizados
- Hints para preguntas difíciles

**Creación en Sesión**
- No aplicable

**Personal vs Compartido**
- Todo es contenido oficial de Lecturio (no hay user-generated)

**Mobile UX**
- App móvil fuerte con offline
- Estudio en tránsito (médicos muy móviles)

**Clave de Innovación**
- **Creación cero para estudiantes**: Lecturio proporciona TODO
- Cambio de modelo: No "aprende creando", sino "aprende de expertos"
- Tutor IA adapta curriculum basado en desempeño individual

---

## 2. MATRIZ COMPARATIVA: LOS PATRONES EMERGENTES

| Dimensión | Anki | Quizlet | Brainscape | RemNote | Osmosis | Lecturio |
|-----------|------|---------|-----------|---------|---------|----------|
| **Pasos para crear** | 3 | 2-3 | 2-3 | 1-2 | 2-4 | N/A |
| **AI Integrado** | Externo | Sí (Magic Notes) | Sí (Copilot) | Sí (generación) | Débil | Sí (tutor) |
| **En-sesión** | No | No | No | **Sí** | Parcial | N/A |
| **Mobile optimizado** | Estudio | Estudio | Estudio | Notas+estudio | Sí | Sí |
| **Creación mobile** | Pobre | Pobre | Pobre | Pobre | Buena | N/A |
| **Diferenciación user/oficial** | Comunitario | Débil | Curado | Personalizado | **Claro** | N/A (oficial) |
| **Algoritmo** | **FSRS** (mejor) | SRAlgo | CBR | Spaced Rep | Adaptativo | Tutor IA |
| **Innovación clave** | Customización | IA masiva | CBR metacog | Inline notes | Colab+slides | Modelo Zero-Create |

---

## 3. CINCO MEJORES PATRONES PARA AXON

### 1. **Creación Inline en Contexto de Notas** (RemNote)

**Raciocinio**
- Los médicos toman notas en clase/en clínica
- Si pueden marcar fragmentos como "esto es importante → tarjeta" sin salir del flujo, optimizas tiempo cognitivo
- El acto de marcar ES aprendizaje (metacognición)

**Implementación en Axon**
```
Usuario lee una nota o apunte:
"La trombosis venosa profunda (TVP) requiere anticoagulación por ≥3 meses"

Marca con símbolo (ej: [[ ]] o hover → "Crear tarjeta"):
[[La TVP requiere anticoagulación por ≥3 meses]]

→ Se crea automáticamente como tarjeta cloze:
Frente: "La TVP requiere anticoagulación por ___"
Dorso: "≥3 meses"

Estudia con spaced repetition sin salir de la app.
```

---

### 2. **Diferenciación Explícita: Personal vs Oficial** (Osmosis)

**Raciocinio**
- Axon tendrá contenido oficial (generado por profesores) Y tarjetas de estudiantes
- Ambas son valiosas pero deben marcarse diferente
- Los estudiantes necesitan saber cuál es "fuente de verdad" vs "notas de compañeros"

**Implementación en Axon**
```
Tarjetas Oficiales (generadas por Axon/Profesor):
- Badge: "Oficial" (color azul)
- Icono: ✓ verificada
- En el estudio, se destaca: "Contenido verificado"
- No editable por estudiante, pero anotable

Tarjetas Personales (generadas por estudiante):
- Badge: "Mi tarjeta" o "Estudiante de UNLP"
- Icono: Inicial del estudiante
- Editable, borrable
- Estadísticas privadas

Tarjetas Colaborativas (de compañeros, compartidas):
- Badge: "Compartida por [Nombre]"
- Icono: Múltiples iniciates
- Vista readonly, pero copiable a personal
- Votación de utilidad (👍 útil, 👎 confusa)
```

---

### 3. **IA para Generación en Lotes** (Quizlet Magic Notes)

**Raciocinio**
- Los estudiantes están ocupados. Crear 50 tarjetas manualmente es trabajo.
- Si pueden subir un PDF de clase → IA genera tarjetas automáticamente → editan 5 min, estudian → ROI enorme
- Especialmente importante para contenido médico (denso, requiere muchas tarjetas)

**Implementación en Axon**
```
Flujo:
1. Estudiante sube: apunte/PDF/transcripción de clase
2. IA (Gemini/Claude) analiza → genera 20-50 tarjetas draft
3. Estudiante revisa/edita antes de agregar al deck
4. Sistema permite feedback: "Regenear con más detalle", "Simplificar"

Ejemplo:
Sube: Capítulo sobre Infarto de Miocardio (5 págs)
IA genera automáticamente:
- 15 tarjetas cloze (definiciones)
- 10 tarjetas Q&A (patofisiología)
- 5 tarjetas imagen-oclusión (ECG)
```

---

### 4. **Confidence-Based Repetition (CBR) en Algoritmo** (Brainscape)

**Raciocinio**
- FSRS (Anki) es poderoso pero no pregunta "¿cuán confiado estás?"
- CBR mejora el spacing porque diferencia entre "respondí bien por luck" vs "realmente sé esto"
- Metacognición = mejor retención + estudiante siente control

**Implementación en Axon**
```
Después de responder una tarjeta:
Frente: "Diagnóstico definitivo de TVP"
Respuesta mostrada: "Doppler compresión venosa"
Estudiante resolvió: Correcto

En lugar de solo [Correcto/Incorrecto], preguntar:
"¿Qué tan confiado estás en esa respuesta?"
  1 ⭐ Adiviné
  2 ⭐ Poco seguro
  3 ⭐ Más o menos
  4 ⭐ Bastante seguro
  5 ⭐ Completamente seguro

→ Si responde 1: repite EN 1 DÍA
→ Si responde 5: repite EN 3 SEMANAS

Algoritmo ajusta spacing basado en confianza, no solo acierto.
```

---

### 5. **Creación Colaborativa + Auditoría de Calidad** (Osmosis + Investigación)

**Raciocinio**
- Estudiantes crean mejor contenido cuando colaboran (menos errores)
- Calidad garantizada si hay auditoría (profesor/peer-review)
- Incentiva: crear bien = todos se benefician

**Implementación en Axon**
```
Flujo:
1. Grupo de estudiantes (ej: 5 personas) crea tarjetas en Workspace compartido
2. Al final de la semana: Pool de tarjetas pendientes de auditoría
3. Profesor o estudiante "auditor" revisa:
   - ¿Información correcta?
   - ¿Claridad OK?
   - ¿Formato válido?
4. Tarjetas auditadas → Badge "Auditada" → Se distribuyen a toda la cohorte
5. Estadísticas de contribución: "Usuario X contribuyó 12 tarjetas auditadas"

Gamificación:
- Puntos por tarjeta auditada exitosamente
- Leaderboard: "Top creadores de la semana"
- Insignia: "Auditor confiable" (5+ auditorías sin rechazos)
```

---

## 4. TRES ANTI-PATRONES A EVITAR

### ❌ Anti-Patrón 1: Creación Móvil Incómoda

**Problema Real**
- Lecturio y Quizlet admiten: Creación de tarjetas NO está optimizada para móvil
- Escribir Q&A en teléfono es lento, frustrante
- Resultado: Estudiantes NO crean tarjetas, solo consumen

**Qué NO hacer**
```
❌ Interfaz móvil que requiere:
   - Teclado virtual grande
   - Campos pequeños para Q&A largo
   - Sin acceso a templates predefinidos
   - Sin IA assistance (por limitaciones de ancho de banda)

❌ Esto lleva a:
   - Uso de móvil solo para estudio (como Anki, Quizlet)
   - Necesidad de desktop/web para crear
   - Fricción en flujo natural del estudiante
```

**Qué SÍ hacer**
- Creación inline (RemNote) requiere menos texto = OK móvil
- Generación IA desde foto de apunte (captura → IA → revisa → acepta)
- Acceso a templates: Toca "Usar template de diagnóstico" → precargado → solo llena gaps

---

### ❌ Anti-Patrón 2: Algoritmo "Simplista" (Solo Correcto/Incorrecto)

**Problema Real**
- Spaced repetition clásico (Anki FSRS) trata "correcto" = "sé esto bien"
- Pero: Estudiante puede acertar por azar o por lógica deductiva (no memoria)
- Resultado: Tarjetas que "pasaron" pero el estudiante no retiene

**Qué NO hacer**
```
❌ Mostrar solo: [Correcto] [Incorrecto]
❌ Asumir que correcto = memoria sólida
❌ No permitir matices en confianza
```

**Qué SÍ hacer**
- CBR: Pregunta confianza explícitamente
- Alternativa: Permitir [Fácil] [Bien] [Difícil] (como Anki v3)
- Tracking de "correcto pero confundido" → repite antes

---

### ❌ Anti-Patrón 3: Falta de Diferenciación Oficial/Personal + Riesgo de Desinformación

**Problema Real**
- Quizlet tiene millones de sets, pero calidad variable
- "¿Cuál es la dosis de Amoxicilina?" → 10 respuestas diferentes en sets públicos
- Estudiante estudia información FALSA sin saber

**Qué NO hacer**
```
❌ Todo es igual: Oficial + Estudiante + Extraído de internet = misma insignia
❌ No hay curación: Si 100 estudiantes crean tarjetas malas, se propagan
❌ No hay auditoría: Información médica sin verificación = riesgo
```

**Qué SÍ hacer**
- Badge explícito: "Oficial (Prof.)" vs "Personal" vs "Auditada (Pares)"
- Si estudiante comparte tarjeta personal, incluye aviso: "⚠️ No verificada"
- Auditoría + curación = confianza
- Sistema de reporte: Estudiante encuentra error → profesor corrige → la comunidad recibe update

---

## 5. FLUJO IDEAL PARA UN ESTUDIANTE MÉDICO DE AXON

### Escenario Realista

**Contexto**: Estudiante de medicina en UNLP, estudiando "Trombosis Venosa Profunda" en clase clínica.

---

### **Fase 1: Tomar Notas + Crear Tarjetas Inline** (En clase, ~5 min)

```
Profesor: "La TVP requiere anticoagulación por al menos 3 meses,
           salvo en casos de trombosis proximal de alto riesgo."

Estudiante abre Axon en tablet/laptop.
Escribe nota:
  "Tratamiento TVP:
   - [[TVP requiere anticoagulación por ___]]
   - Duración: [[al menos ___]]
   - Excepto: [[en ___]]"

Axon crea 3 tarjetas cloze en vivo.

Inmediatamente marca:
  - Difícil (porque "casos de alto riesgo" es vago)
  - IA sugiere: "¿Refinarías con ejemplo?"

Estudiante agrega:
  "Excepto: Trombosis iliofemoral >5 cm con síntomas neuro"

→ Tarjeta mejorada, lista para estudiar.
```

---

### **Fase 2: Sesión de Estudio Distribuida** (Móvil, 2-3 min/día)

**Día 1** (Primera exposición, ~4 hrs después de clase)

```
Abre Axon en teléfono.
Le aparece tarjeta cloze:
  Frente: "La TVP requiere anticoagulación por ___"

Intenta recordar: "3 meses? 6 meses?"

Revela: "≥3 meses"

Se califica:
  ⭐⭐⭐⭐⭐ "Lo recordé perfectamente"

→ Axon (CBR): Próxima revisión EN 5 DÍAS
```

**Día 3** (Revisión temprana, porque es médica)

```
Aparece la misma tarjeta inesperadamente.
Intenta: "¿3 meses?"

Revela: "≥3 meses"

Se califica:
  ⭐⭐ "Lo sabía pero dudé"

→ Axon (CBR): Próxima revisión EN 2 DÍAS (más pronto)

Porque la confianza (2) es baja.
```

**Día 5+** (Espaciamiento largo)

```
Aparece de nuevo.
Responde: ⭐⭐⭐⭐⭐ "Completamente seguro"

→ Axon: Próxima EN 3 SEMANAS
```

---

### **Fase 3: Crear Tarjetas desde Recurso Externo** (Desktop, 15 min)

El estudiante descarga un artículo PDF sobre "Complicaciones de TVP".

```
1. Sube PDF a Axon
2. IA lee → genera automáticamente:
   - 8 tarjetas cloze (definiciones)
   - 6 tarjetas Q&A (patofisiología)
   - 4 tarjetas imagen-oclusión (ECG + signos)

3. Aparecen como DRAFT. Estudiante revisa 5 min:
   - ✓ Edita 1 que es confusa
   - ✓ Rechaza 1 que es incorrecta
   - ✓ Acepta el resto

4. 17 tarjetas nuevas → "Personal" (Badge estudiante)

5. Opcionalmente: "Compartir con grupo de estudio"
   → Aparecen como "Compartida por Usuario X"
   → Resto de grupo puede votar 👍/👎
   → Si 5+ votos 👍, profesor la revisa
   → Si pasa, se marca "Auditada por Prof."
```

---

### **Fase 4: Estudio Colaborativo Estructurado** (Semanal, asincrónico)

```
Grupo de 5 estudiantes en "Workspace: TVP + Complicaciones"

Lunes (Cada uno contribuye):
  Est1: Crea 8 tarjetas sobre patofisiología
  Est2: Crea 5 sobre diagnóstico diferencial
  Est3: Crea 10 sobre tratamiento
  Est4: Crea 3 sobre complicaciones
  Est5: Crea 2 sobre casos clínicos

Viernes (Auditoría):
  Profesor/Est-Auditor revisa 28 tarjetas
  - 26 pasan: Se marcan "Auditadas"
  - 2 tienen errores: Se devuelven con comentario

Sábado:
  28 tarjetas "Auditadas" → Distribuidas a toda la cohorte
  (Grupo médico, 60 estudiantes)

Estadísticas públicas:
  "Este grupo contribuyó 28 tarjetas de alta calidad"
  → Motivación, credibilidad
```

---

### **Fase 5: Revisión Adaptativa Inteligente** (Algoritmo, diario)

```
Axon crea "Agenda Personal" usando:
  - CBR: Qué tarjetas tienen baja confianza (⭐⭐)
  - Análisis: Cuáles errores cometió recientemente
  - Planificación: Examen final en 3 semanas

Sugerencia diaria:
  "Estudia 15 min hoy:
   - 5 tarjetas de bajo-confianza (TVP, Embolia Pulmonar, Síndrome Post-Trombótico)
   - 3 tarjetas donde cometiste errores últimamente

   Total: ~10 min si vas bien rápido"
```

---

### **Resumen del Flujo: Tiempo Total del Estudiante**

| Fase | Contexto | Tiempo | Valor |
|------|----------|--------|-------|
| 1. Notas+Crear inline | Clase | 5 min | Notas + Tarjetas simultáneamente |
| 2. Estudio móvil | Transporte | 2-3 min/día | Spaced repetition, confianza adaptativa |
| 3. Recursos externos | Desktop | 15 min | 17 tarjetas en draft → 5 min editar |
| 4. Colab semanal | Workspace | 30-40 min | Calidad curada, comunidad |
| 5. Revisión IA | Diaria | Sugerida, no forzada | Priorización inteligente |

**Total semanal**: ~2-3 horas de estudio → **Retención mucho mayor que traditional flashcards** (por CBR + colaboración)

---

## 6. SÍNTESIS FINAL: RECOMENDACIONES PARA AXON

### Lo Que Axon Debe Hacer

1. **Creación Inline en Notas** (RemNote)
   - `[[ ]]` marca cloze mientras tomas notas
   - Tarjeta creada automáticamente
   - Estudia después sin salir de app

2. **Diferenciación Clara Oficial/Personal** (Osmosis)
   - Badge visual: Oficial (azul), Personal (gris), Auditada (verde)
   - Estudiantes confían en "Auditadas"

3. **IA para Generación en Lotes** (Quizlet Magic Notes)
   - Sube PDF → IA genera 20-50 tarjetas
   - Estudiante edita 5 min, estudia

4. **Confidence-Based Repetition** (Brainscape CBR)
   - Después de responder: "¿Qué tan confiado?"
   - Spacing adaptado a confianza, no solo acierto

5. **Colaboración + Auditoría** (Osmosis + Research)
   - Grupos crean tarjetas → Profesor audita → Toda la cohorte accede
   - Gamificación: Puntos por contribución

---

### Lo Que Axon DEBE EVITAR

1. ❌ Creación móvil complicada (desktop only)
2. ❌ Algoritmo simplista (solo correcto/incorrecto)
3. ❌ Mezclar oficial/personal sin diferenciación clara (riesgo de desinformación)

---

## Referencias

- Anki Manual: https://docs.ankiweb.net/getting-started.html
- Quizlet AI Flashcard Generator: https://quizlet.com/features/ai-flashcard-generator
- Brainscape CBR: https://brainscape.zendesk.com/hc/en-us/articles/13103043051149-How-does-Brainscape-s-spaced-repetition-algorithm-work
- RemNote Creating Flashcards: https://help.remnote.com/en/articles/6025481-creating-flashcards
- Osmosis Flashcard Creation: https://help.osmosis.org/en/articles/1629969-flashcard-creation-and-organization
- Medical Student Research (Spaced Repetition): https://pmc.ncbi.nlm.nih.gov/articles/PMC8368120/
- Mobile UX Best Practices (2026): https://studycardsai.com/best-flashcard-apps-medical-students
- Comparison of Platforms (2026): https://www.iatrox.com/academy/study/anki-vs-remnote-vs-quizlet-medical

