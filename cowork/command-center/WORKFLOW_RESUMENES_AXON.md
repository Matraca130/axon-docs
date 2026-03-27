# Workflow de Generación de Resúmenes — Axon

## Principio Rector

> El bloque NO se elige por variedad visual. Se elige porque la **naturaleza del contenido** lo exige.
> Un resumen con 6 bloques bien elegidos es superior a uno con 15 bloques forzados.

### Regla de repetición
Los tipos de bloque **se pueden y deben repetir** cuando el contenido lo requiere. Si un tema tiene 5 subtemas narrativos, se usan 5 bloques `prose`. No existe obligación de usar todos los tipos, ni restricción de no repetir. Lo que importa es que cada bloque cubra su contenido con calidad. La variedad visual es una consecuencia natural del contenido diverso, no un objetivo en sí mismo.

---

## Fase 1: Análisis del Contenido Fuente

Antes de crear cualquier bloque, responder estas preguntas sobre el material:

1. **¿Cuáles son los subtemas reales?** — Listar cada concepto o sección del material fuente.
2. **¿Qué naturaleza tiene cada subtema?** — Clasificar cada uno:
   - Narrativo/explicativo (necesita párrafos)
   - Secuencial (tiene orden temporal o lógico estricto)
   - Comparativo (dos o más cosas que se diferencian)
   - Enumerativo (lista de items independientes)
   - Conceptual-clave (idea central que da sentido a todo)
   - Referencia rápida (datos discretos para consultar)
   - Tip de examen/clínica/memoria
3. **¿Cuál es la jerarquía?** — No todo tiene la misma importancia. Identificar:
   - Lo que el alumno DEBE saber (core)
   - Lo que DEBERÍA saber (importante)
   - Lo que es ÚTIL saber (complementario)

---

## Fase 2: Mapeo Contenido → Tipo de Bloque

Usar esta guía de decisión:

### `prose`
**Usar cuando:** el contenido es narrativo, requiere explicación en párrafos, establece contexto o conecta ideas. Definiciones complejas, introducciones, tratamientos farmacológicos con razonamiento.
**NO usar cuando:** el contenido es una lista de items, una secuencia, o datos puntuales.
**Ubicación típica:** inicio del resumen (contexto), y donde se necesite explicar "el por qué" de algo.

### `key_point`
**Usar cuando:** hay UN concepto central que es el "aha moment" del tema. La idea que si el alumno entiende, todo lo demás tiene sentido. O un concepto que frecuentemente se malinterpreta.
**NO usar cuando:** quieras resaltar algo que no es realmente central, o para cada cosa "importante" (eso diluye su impacto).
**Límite:** máximo 1-2 por tema. Si todo es key_point, nada lo es.
**Campo `importance`:** `"critical"` solo si es concepto fundacional. `"high"` para conceptos importantes pero no únicos.

### `stages`
**Usar cuando:** el contenido tiene un ORDEN secuencial estricto (fases, etapas, pasos). Donde el paso 1 necesariamente precede al paso 2.
**NO usar cuando:** los items son independientes entre sí y podrían reordenarse sin perder sentido.
**Campo `severity`:** refleja la complejidad o importancia clínica de cada etapa, NO el orden.

### `comparison`
**Usar cuando:** hay 2+ entidades que el alumno tiende a CONFUNDIR y necesita diferenciar. El valor está en la yuxtaposición.
**NO usar cuando:** las categorías no comparten dimensiones comparables, o la comparación es forzada.
**Campo `highlight_column`:** columna más importante o "respuesta correcta" para el examen. Usar 0-indexed.

### `list_detail`
**Usar cuando:** hay múltiples items que necesitan explicación individual (label + detalle). Items técnicos, criterios, clasificaciones con descripción.
**NO usar cuando:** los items son tan cortos que no necesitan "detail", o cuando la relación entre items es más importante que cada item individual.
**Campo `severity`:** indica importancia clínica/académica: `"high"` (pregunta de examen), `"medium"`, `"low"`.

### `two_column`
**Usar cuando:** hay exactamente DOS categorías contrapuestas que se benefician de verse lado a lado. Dicotomías naturales.
**NO usar cuando:** hay 3+ categorías (usar `comparison`), o cuando las dos categorías no tienen items paralelos.

### `grid`
**Usar cuando:** hay 4+ items cortos e independientes que se benefician de una vista panorámica. Características, territorios, clasificaciones rápidas.
**NO usar cuando:** los items necesitan explicación detallada (usar `list_detail`), o son secuenciales (usar `stages`).
**Campo `columns`:** 2 para pocos items, 3 para 6-9 items, 4 para muchos items cortos.

### `callout`
**Usar cuando:** hay información que está FUERA del flujo principal pero es valiosa. Tips, correlaciones, mnemotecnias, advertencias.
**Variantes y cuándo usar cada una:**
- `"exam"` → concepto frecuente de examen, trampa común, dato que distingue un alumno preparado
- `"clinical"` → caso clínico o correlación con la práctica real
- `"mnemonic"` → recurso nemotécnico para memorizar
- `"tip"` → consejo general de estudio
- `"warning"` → error común o concepto peligroso de confundir
**Límite:** máximo 2-3 callouts por tema. Son "pausas" en el flujo — demasiadas interrumpen la lectura.

### `image_reference`
**Usar cuando:** hay un diagrama, esquema o imagen que genuinamente ayuda a entender el contenido. Cuando la descripción visual agrega información que el texto no puede.
**NO usar cuando:** no hay imagen real que referenciar, o sería un placeholder genérico sin valor.

### `section_divider`
**Usar cuando:** el resumen cubre múltiples temas o secciones grandes que necesitan separación visual clara.
**NO usar cuando:** hay un solo tema. No subdividir artificialmente.

---

## Fase 3: Estructura y Flujo Pedagógico

El orden de bloques sigue un flujo cognitivo natural:

```
1. CONTEXTO      → ¿Qué es esto y por qué importa?       → prose / key_point
2. VISIÓN MACRO  → ¿Cuál es el panorama general?          → stages / two_column / grid
3. PROFUNDIDAD   → Detalles técnicos importantes           → list_detail / comparison / prose
4. INTEGRACIÓN   → ¿Cómo se conecta con la clínica?       → callout (clinical/exam)
5. MEMORIA       → ¿Cómo lo retengo?                      → callout (mnemonic)
```

No todos los bloques van en orden rígido — pero el flujo general va de **abstracto → concreto → aplicado → memorable**.

### Reglas de flujo:
- **Nunca** empezar con un `callout` o `grid`. El alumno necesita contexto primero.
- **Nunca** poner dos `callout` consecutivos. Insertar contenido sustancial entre ellos.
- **Nunca** terminar con un `prose` largo. El cierre debe ser memorable (callout mnemonic) o aplicado (callout clinical).
- Un `key_point` puede ir al inicio (después del prose introductorio) O después de un bloque técnico complejo para "aterrizar" el concepto.

---

## Fase 4: Keywords

### Criterios para crear un keyword:
1. Es un **término técnico** que el alumno debe dominar
2. Aparece en **múltiples bloques** o tiene relevancia transversal
3. Su definición no es obvia y beneficia de un popover explicativo
4. Es probable **pregunta de examen**

### Criterios para NO crear un keyword:
- Términos de lenguaje común (dosis, paciente, tratamiento)
- Términos que aparecen una sola vez y se explican in-situ
- Abreviaturas que ya se aclaran en el texto

### Cantidad recomendada: 5-10 por tema. Si hay más de 12, probablemente estás marcando términos que no lo merecen.

---

## Fase 5: Quiz

### Criterios para preguntas de quiz:
1. **Una pregunta por concepto clave**, no por bloque. Si un bloque tiene 3 ideas importantes, puede tener 3 preguntas.
2. Si un bloque es puro contexto (prose introductorio), puede no tener quiz.
3. Las opciones incorrectas deben ser **distractores plausibles**, no respuestas absurdas.
4. Priorizar preguntas que evalúen **comprensión**, no memorización pura.
5. El `correct` index debe variar (no siempre opción 1).

---

## Fase 6: Validación

Antes de finalizar, verificar:

- [ ] ¿Cada bloque tiene una razón de existir? (si no puedo justificar el tipo, cambiar)
- [ ] ¿El flujo sigue la progresión contexto → macro → profundidad → integración → memoria?
- [ ] ¿Los keywords son realmente términos técnicos transversales?
- [ ] ¿Las preguntas de quiz evalúan los conceptos más importantes?
- [ ] ¿No hay bloques redundantes que digan lo mismo de diferente forma?
- [ ] ¿El resumen se puede leer de inicio a fin con coherencia narrativa?

---

## Ejemplo de Decisión Documentada

```
SUBTEMA: "Tipos de estudios epidemiológicos"
NATURALEZA: Comparativa — hay dos grandes categorías (descriptivos vs analíticos)
                          cada una con subdivisiones
BLOQUE ELEGIDO: two_column
JUSTIFICACIÓN: La dicotomía descriptivo/analítico es la clasificación principal.
               Cada lado tiene 3-4 subtipos que se benefician de verse en paralelo.
               No uso comparison porque no hay dimensiones compartidas (filas),
               sino categorías con sus propios items.
ALTERNATIVA DESCARTADA: list_detail — perdería la estructura de dicotomía
```

---

## Anti-patrones (qué NO hacer)

1. **"Block stuffing"** — usar todos los tipos solo para mostrar variedad
2. **"Prose dump"** — poner todo en bloques prose porque es más fácil
3. **"Grid everything"** — comprimir contenido que necesita explicación en grids telegráficos
4. **"Callout spam"** — 4+ callouts que interrumpen el flujo constantemente
5. **"Keyword inflation"** — marcar como keyword cada término técnico que aparece
6. **"Copy-paste académico"** — copiar texto verbatim del fuente sin reestructurar para el formato de bloques
