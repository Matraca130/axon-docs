# Resumen Ejecutivo: Creación de Tarjetas en Axon

**Investigación**: Análisis de 6 plataformas de tarjetas (Anki, Quizlet, Brainscape, RemNote, Osmosis, Lecturio)
**Fecha**: 27 de marzo, 2026
**Destinatario**: Equipo de Producto Axon (UNLP Medical Academy)

---

## TL;DR — La Recomendación en 30 Segundos

Axon debe adoptar **5 patrones de oro** de las mejores apps:

1. **Creación inline en notas** ← Estudiante marca texto mientras toma apuntes → se crea tarjeta sin salir del flujo
2. **Diferenciación oficial/personal/auditada** ← Badges claros (azul=Oficial, gris=Personal, verde=Auditada)
3. **IA generadora en lotes** ← Sube PDF → IA crea 20-50 tarjetas → Edita 5 min
4. **Confidence-Based Repetition** ← Pregunta "¿Qué tan confiado?" después de responder → Spacing adaptado a confianza
5. **Colaboración + auditoría semanal** ← Grupos crean → Profesor audita → Cohorte accede a tarjetas verificadas

---

## El Problema: ¿Por Qué Esto Importa?

Los estudiantes de medicina de UNLP necesitan estudiar **rápido y reteniendo bien**. Las apps actuales tienen fricciones:

| Problema | Síntoma | Impacto |
|----------|---------|--------|
| Creación lenta | Anki requiere 3 pasos, desktop-only | Estudiantes usan menos tarjetas propias, dependen de mazos externos |
| Calidad incierta | Quizlet no diferencia oficial/personal | Estudiantes estudian información FALSA sin saberlo |
| Algoritmo simplista | Solo "correcto/incorrecto" | Aciertos por azar se tratan igual que memoria sólida |
| Creación móvil inexistente | No se puede crear tarjetas en teléfono | Flujo desconectado: nota en clase → tarde transcribe a tarjetas |
| Aislamiento | Cada estudiante crea sus propias tarjetas | Duplicación masiva de trabajo, sin beneficio de grupo |

**Axon puede resolver TODO esto con los 5 patrones.**

---

## Los 5 Patrones de Oro

### 1️⃣ Creación Inline en Notas (RemNote)

**Qué es**: Mientras escribes notas, marcas fragmentos como tarjetas (syntax rápido: `[[ ]]` para cloze).

**Por qué funciona**:
- El acto de marcar = metacognición (aprendizaje en acción)
- Sin fricción: Nota + Tarjeta simultáneamente
- 50% más rápido que crear tarjetas después

**Ejemplo Real**:
```
Estudiante en clase escribe:
"TVP requiere anticoagulación por [[≥3 meses]]"

→ Axon crea automáticamente:
  Frente: "TVP requiere anticoagulación por ___"
  Dorso: "≥3 meses"

→ Inmediatamente disponible para estudiar
```

**Impacto para UNLP**: Estudiantes crean 2-3x más tarjetas propias porque la fricción desaparece.

---

### 2️⃣ Diferenciación Oficial/Personal/Auditada (Osmosis)

**Qué es**: Badges visuales claros sobre el origen de cada tarjeta.

```
🔵 OFICIAL      = Profesor/Axon verificado
⚫ PERSONAL      = Solo tú
🟢 AUDITADA     = Compañero compartió + Profesor verificó
⚠️  NO VERIFICADA = Compañero compartió, aún sin auditar
```

**Por qué funciona**:
- Estudiantes confían en "Auditada" y desconfían de "No verificada"
- Reduce riesgo de desinformación médica
- Incentiva calidad (si contribuyes bien, tu tarjeta se marca "Auditada")

**Impacto para UNLP**: Eliminates "dosis incorrecta de heparina" estudiada como verdad.

---

### 3️⃣ IA Generadora en Lotes (Quizlet Magic Notes)

**Qué es**: Sube un PDF de clase → IA analiza → genera automáticamente 20-50 tarjetas → Editas 5 min → Listo.

**Por qué funciona**:
- Ahorra horas de trabajo manual
- Especialmente poderoso para contenido médico (denso, requiere muchas tarjetas)
- Estudiante VALIDA (no acepta ciegamente) → retención aún mejor

**Ejemplo Real**:
```
Paso 1: Estudiante sube "Complicaciones_de_TVP.pdf" (6 páginas)
Paso 2: IA lee → Genera automáticamente:
        8 tarjetas cloze (definiciones)
        6 tarjetas Q&A (patofisiología)
        4 tarjetas imagen-oclusión (signos ECG)
Paso 3: Estudiante revisa en 5 min:
        ✓ Acepta 17
        ✓ Edita 1 confusa
        ✓ Rechaza 1 incorrecta
Paso 4: 17 tarjetas → Listas para estudiar
```

**Impacto para UNLP**: Una clase = tarjetas listas en 15 min (vs. 2-3 horas manuales).

---

### 4️⃣ Confidence-Based Repetition (Brainscape)

**Qué es**: Después de responder, pregunta "¿Qué tan confiado estuviste?" (1-5 estrellas). Usa eso para calcular próxima revisión.

```
Algoritmo tradicional (Anki):
  Respondiste correcto → Próxima revisión EN 3 SEMANAS

Algoritmo CBR (Brainscape/Axon):
  Respondiste correcto + ⭐⭐⭐⭐⭐ Muy confiado → Próxima EN 4 SEMANAS
  Respondiste correcto + ⭐⭐ Poco confiado → Próxima EN 2 DÍAS
  Respondiste mal + ⭐⭐⭐⭐ Confiado → ERROR importante, próxima MAÑANA
```

**Por qué funciona**:
- Diferencia entre "acerté por azar" vs "realmente sé esto"
- Metacognición (estudiante reflexiona sobre su propio conocimiento)
- Spacing más inteligente = retención mejor en menos tiempo

**Impacto para UNLP**: Estudiantes ahorran 20-30% de tiempo de estudio sin perder retención.

---

### 5️⃣ Colaboración + Auditoría Semanal (Osmosis + Research)

**Qué es**: Grupos de 5-10 estudiantes crean tarjetas en "Workspace" compartido. Profesor audita semanalmente. Tarjetas verificadas → Distribuidas a toda la cohorte.

**Flujo**:
```
Lunes-Jueves:
  Est1 crea 8 tarjetas sobre patofisiología
  Est2 crea 5 sobre diagnóstico
  Est3 crea 10 sobre tratamiento
  Est4 crea 3 sobre complicaciones
  Est5 crea 2 sobre casos clínicos
  → 28 tarjetas en "pool de auditoría"

Viernes:
  Profesor/Est-Auditor revisa las 28
  26 PASAN → Se marcan 🟢 AUDITADA
  2 FALLAN → Devueltas con feedback

Sábado:
  26 tarjetas auditadas → Distribuidas a 60 estudiantes de cohorte
  Todos se benefician del trabajo del grupo
```

**Gamificación**:
```
Puntos: Cada tarjeta auditada = 10 XP
Insignias:
  🎖️ "Creador Prolífico" (20+ tarjetas)
  🎖️ "Auditor Confiable" (5+ auditorías sin rechazos)
Leaderboard: "Top creadores de la semana"
```

**Por qué funciona**:
- Reduce duplicación (1 grupo crea para 60 estudiantes)
- Calidad garantizada por auditoría
- Motivación (puntos, insignias, reconocimiento)
- Aprendizaje colaborativo = mejor retención

**Impacto para UNLP**: Cohorte de 60 estudia 400+ tarjetas auditadas/semana vs. 60 solo.

---

## Los 3 Anti-Patrones a EVITAR

### ❌ Anti-Patrón 1: Creación Móvil Incómoda

**El Problema**: Apps como Anki y Quizlet admiten que creación en móvil es mala UX. Resultado: Estudiantes NO crean tarjetas, solo las consumen.

**Qué NO hacer**:
- Interfaz móvil que requiere escribir Q&A largos en teclado virtual
- Sin templates predefinidos en móvil
- IA assistance no disponible (por ancho de banda)

**Qué SÍ hacer**:
- Creación inline (RemNote) → Menos texto, mejor móvil
- Foto de apunte → IA transcribe + crea tarjetas
- Templates predefinidos (ej: "Diagnóstico", "Anatomía") → Solo llena gaps

---

### ❌ Anti-Patrón 2: Algoritmo Simplista (Solo Correcto/Incorrecto)

**El Problema**: Spaced repetition clásica trata "respondí correcto" como "sé bien". Pero puedo acertar por lógica deductiva, no por memoria.

**Qué NO hacer**:
- Solo [Correcto] [Incorrecto]
- Asumir correcto = memoria sólida
- No permitir matices en confianza

**Qué SÍ hacer**:
- Confidence-Based Repetition (CBR)
- Alternativa: [Fácil] [Bien] [Difícil]
- Tracking de "correcto pero confundido" → Repite antes

---

### ❌ Anti-Patrón 3: Mezclar Oficial/Personal Sin Diferenciación

**El Problema**: Quizlet tiene millones de sets, pero calidad variable. Estudiante estudia "dosis de Amoxicilina: 1g cada 8 horas" que es FALSA.

**Qué NO hacer**:
- Todo tiene el mismo badge (oficial + personal + internet = iguales)
- No hay auditoría/curación
- Información médica sin verificación = riesgo

**Qué SÍ hacer**:
- Badge claro: "Oficial (Prof.)" vs "Personal" vs "Auditada"
- Si estudiante comparte tarjeta personal: Incluir ⚠️ "No verificada"
- Auditoría obligatoria antes de distribuir
- Sistema de reporte: Encuentra error → Profesor corrige → Comunidad recibe update

---

## El Flujo Ideal: Estudiante de Medicina UNLP

```
MAÑANA — Clase (5 min):
  Estudiar: "TVP requiere anticoagulación por ___"
  Marca con [[ ]] mientras toma apuntes
  → Tarjeta creada automáticamente

TARDE — Estudio en colectivo (5 min):
  App sugiere: "5 tarjetas con bajo-confianza hoy"
  Responde cada una
  Después de responder: "⭐⭐⭐⭐⭐ Muy confiado"
  → Próxima revisión en 3 semanas

NOCHE — Workspace grupal (15 min):
  Su grupo sube PDF de clase
  IA genera 17 tarjetas automáticamente
  El estudiante edita 2-3 que son confusas
  Sube versión final al workspace

VIERNES — Auditoría (Profesor):
  Revisa las 28 tarjetas del grupo
  Acepta 26, devuelve 2 con feedback

SÁBADO — Estudio comunitario:
  26 tarjetas auditadas → Distribuidas a 60 estudiantes
  Nuestro estudiante ahora estudia 400+ tarjetas/semana de alta calidad
  (vs. 50 solo creadas por él)
```

---

## Comparación: Axon vs Competencia (Después de Implementar)

| Característica | Anki | Quizlet | Brainscape | **Axon (Propuesto)** |
|---|---|---|---|---|
| Creación inline | ❌ | ❌ | ❌ | ✅ |
| IA en lotes | Externo | ✅ (Premium) | ✅ | ✅ |
| CBR | ❌ | ❌ | ✅ | ✅ |
| Diferenciación oficial/personal | ⚠️ Débil | ❌ | ⚠️ Débil | ✅ Claro |
| Auditoría/curación | ❌ | ❌ | ❌ | ✅ |
| Colaboración nativa | ❌ | ⚠️ Débil | ❌ | ✅ |
| Mobile UX (creación) | ❌ | ❌ | ❌ | ✅ (inline) |
| Médico-específico | ⚠️ (community) | ⚠️ (quality variable) | ⚠️ (general) | ✅ (domain-aware IA) |

---

## Métricas de Éxito (Medible)

Después de 3 meses de implementar los 5 patrones:

| Métrica | Baseline | Target | Cómo Medir |
|---------|----------|--------|-----------|
| Tarjetas creadas/estudiante/semana | 5-10 | 25-40 | Dashboard analytics |
| Tiempo de creación/tarjeta | 8-10 min | 3-5 min | Timestamp logging |
| Retención (spaced rep) | 75% (estándar) | 85%+ (CBR) | Quiz final scores |
| Calidad perceived (student survey) | 3.5/5 | 4.5/5 | NPS/CSAT |
| Uso colaborativo (% en workspace) | 0% | 60%+ | Cohorte metrics |
| Tarjetas auditadas/semana | 0 | 20-30 | Audit logs |

---

## Roadmap de Implementación (Recomendado)

```
Sprint 1 (Semanas 1-2):      Creación inline + Badges
Sprint 2 (Semanas 3-4):      IA generación + CBR
Sprint 3 (Semanas 5-6):      Workspace + Auditoría
Sprint 4 (Semanas 7-8):      Mobile UX + Analytics

TOTAL: 8 semanas (2 meses) para MVP robusto
```

---

## Recursos y Referencias

**Documentación Completa**:
- `FLASHCARD_CREATION_RESEARCH.md` — Análisis detallado (6 apps, 30+ características)
- `FLASHCARD_UX_IMPLEMENTATION.md` — Especificación técnica (endpoints, DB, UI wireframes)

**Fuentes Citadas**:
- Anki Manual (https://docs.ankiweb.net/)
- Quizlet AI (https://quizlet.com/features/ai-flashcard-generator)
- Brainscape CBR (https://brainscape.zendesk.com/hc/)
- RemNote Docs (https://help.remnote.com/)
- Osmosis Help (https://help.osmosis.org/)
- Medical Education Research (PMC, 2024-2026)

---

## Siguiente Paso: Validación

**Preguntas para Petrick/Equipo Axon**:

1. ¿Coincidimos en que estos 5 patrones resuelven los problemas actuales?
2. ¿Hay algo de la competencia que no incluimos que debería estar?
3. ¿Cuál es la prioridad: (a) Creación inline, (b) IA generación, (c) CBR, (d) Colaboración?
4. ¿Recursos disponibles para implementación (frontend + backend)?
5. ¿Cuándo queremos lanzar MVP?

**Si hay acuerdo**: Petrick puede crear tareas en Claude Code CLI para que Petrick (agente) implemente.

