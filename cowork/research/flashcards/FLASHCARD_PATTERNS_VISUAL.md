# Visual Reference: Los 5 Patrones de Oro

---

## Patrón 1: Creación Inline en Notas

### Flujo Visual

```
┌──────────────────────────────────┐
│ 📝 Escribiendo Apuntes           │
├──────────────────────────────────┤
│                                  │
│ Estudiante escribe en clase:     │
│ "TVP requiere anticoagulación    │
│  por [[al menos ___]]"           │
│           ↓                       │
│  ✨ Tarjeta creada instantáneamente
│                                  │
│ Status: 🟢 Draft (sin auditar)   │
│                                  │
│ Disponible inmediatamente en:    │
│ - Estudio personal               │
│ - Compartir con grupo            │
│                                  │
└──────────────────────────────────┘
```

### Ventajas
✅ Sin fricción (no salir del flujo de notas)
✅ Metacognición instantánea (marcar = aprendizaje)
✅ Disponible INMEDIATAMENTE para estudiar
✅ Móvil-friendly (menos texto que Q&A manual)

### Implementación (Syntax Options)
```
[[ texto ]]       → Cloze básico
[[ texto ]] (alt) → Cloze con alternativa
{{ texto }}       → Image occlusion (para diagramas)
:: término ::     → Bidirectional (término ↔ definición)
```

---

## Patrón 2: Diferenciación Oficial/Personal/Auditada

### Sistema de Badges

```
TARJETA OFICIAL (Profesor/Axon)
┌─────────────────────────────────┐
│ 🔵 OFICIAL                      │ ← Azul = Verificado
│    Prof. García                 │
├─────────────────────────────────┤
│ Q: TVP requiere...              │
│ A: Anticoagulación ≥3 meses     │
├─────────────────────────────────┤
│ Status: ✅ Verificado           │
│ Editable: ❌ No (read-only)     │
│ [📚 Ver fuente] [⭐ Guardar]   │
└─────────────────────────────────┘

TARJETA PERSONAL (Estudiante)
┌─────────────────────────────────┐
│ ⚫ MI TARJETA                   │ ← Gris = Personal
│    Usuario                      │
├─────────────────────────────────┤
│ Q: TVP requiere...              │
│ A: Anticoagulación ≥3 meses     │
├─────────────────────────────────┤
│ Status: 🟢 Draft (sin auditar)  │
│ Editable: ✅ Sí                 │
│ [✏️ Editar] [🗑️ Borrar]        │
└─────────────────────────────────┘

TARJETA COMPARTIDA AUDITADA
┌─────────────────────────────────┐
│ 🟢 AUDITADA                     │ ← Verde = Verificado
│    Est. María                   │    (Peer + Profesor)
│    Verificada por Prof. García  │
├─────────────────────────────────┤
│ Q: Diagnóstico definitivo TVP   │
│ A: Doppler compresión venosa    │
├─────────────────────────────────┤
│ Status: ✅ Auditada             │
│ Votos: 👍 12 / ❌ 0             │
│ [👍 Útil] [❌ Confusa]          │
└─────────────────────────────────┘

TARJETA COMPARTIDA SIN AUDITAR
┌─────────────────────────────────┐
│ ⚠️  NO VERIFICADA               │ ← Rojo = Riesgo
│    Est. Jorge                   │
├─────────────────────────────────┤
│ Q: Síntomas TVP                 │
│ A: Edema, dolor, calor...       │
├─────────────────────────────────┤
│ Status: 🟡 Esperando auditoría  │
│ [⚠️ Reportar] [👍 Útil]        │
└─────────────────────────────────┘
```

### Confianza del Estudiante por Badge

```
¿Cuánto confían los estudiantes en cada badge?

Confianza ↑
    │
 100│  🟢 AUDITADA
    │     (Prof verificó)
    │
 85│  🔵 OFICIAL
    │     (Profesor/Axon)
    │
 60│  ⚫ PERSONAL
    │     (Yo misma)
    │
 30│  ⚠️  NO VERIFICADA
    │     (Compañero sin auditar)
    │
    └──────────────────────
      Nivel de Confianza
```

---

## Patrón 3: IA Generadora en Lotes

### Flujo de Generación

```
PASO 1: SUBE DOCUMENTO
┌─────────────────────────────────┐
│ 📄 PDF: Complicaciones_TVP.pdf  │
│    (6 páginas, 12,000 palabras) │
└─────────────────────────────────┘
         ↓
PASO 2: IA ANALIZA (1-2 min)
┌─────────────────────────────────┐
│ 🧠 Gemini/Claude leyendo...     │
│                                 │
│ Detectado:                      │
│ • Conceptos clave: 17           │
│ • Patofisiología: 4             │
│ • Signos clínicos: 5            │
│ • Complicaciones: 3             │
│                                 │
│ [Procesando...] ▮▮▮▮░ 60%       │
└─────────────────────────────────┘
         ↓
PASO 3: GENERA TARJETAS
┌─────────────────────────────────┐
│ ✅ 17 TARJETAS GENERADAS       │
│                                 │
│ 8 Cloze (definiciones):         │
│   "La TVP proximal..."          │
│   "El síndrome post-..."        │
│                                 │
│ 6 Q&A (preguntas):              │
│   "¿Cuál es el riesgo?"         │
│   "¿Qué complicación?"          │
│                                 │
│ 3 Imagen-Oclusión:              │
│   [ECG con puntos ocultos]      │
│   [Anatomía circulatoria]       │
│                                 │
│ [Aceptar todos] [Revisar uno a uno]
└─────────────────────────────────┘
         ↓
PASO 4: REVISAR + EDITAR (5 min)
┌─────────────────────────────────┐
│ 📝 Revisar Tarjeta 1/17         │
├─────────────────────────────────┤
│ Q: "La TVP proximal requiere    │
│    anticoagulación por ___"     │
│                                 │
│ A: "al menos 3 meses"           │
│                                 │
│ [✅ Aceptar] [✏️ Editar]        │
│ [❌ Rechazar]                   │
│                                 │
│ [← Anterior] [Siguiente →]      │
└─────────────────────────────────┘
         ↓
PASO 5: LISTA PARA ESTUDIAR
┌─────────────────────────────────┐
│ 🎉 COMPLETADO                   │
│                                 │
│ 16 tarjetas aceptadas           │
│ 1 rechazada                     │
│                                 │
│ Status: 🟢 Personal (sin auditar)
│                                 │
│ [Iniciar estudio] [Compartir]   │
└─────────────────────────────────┘
```

### Ahorro de Tiempo

```
Método Manual (Anki):
PDF (6 págs) → Leer → Crear 17 tarjetas a mano
Tiempo: 2.5-3 HORAS

Método IA (Axon):
PDF (6 págs) → Sube → Genera automático → Revisa
Tiempo: 15-20 MINUTOS (87% más rápido!)
```

---

## Patrón 4: Confidence-Based Repetition (CBR)

### Algoritmo Visual

```
MOMENTO DE RESPUESTA:

Student reads: "TVP requiere anticoagulación por ___"
Student thinks: "3 meses? 6 meses?"
Student answers: "3 meses"

Result: ✅ CORRECTO
         "Oficial: ≥3 meses"

         ↓ PERO... ¿Cuánto confiado?

PREGUNTA METACOGNITIVA:
┌─────────────────────────────────┐
│ ¿Qué tan confiado estuviste?   │
│                                 │
│ ⭐ Adiviné               (CBR=1) │
│ ⭐⭐ Poco seguro         (CBR=2) │
│ ⭐⭐⭐ Más o menos       (CBR=3) │
│ ⭐⭐⭐⭐ Seguro          (CBR=4) │
│ ⭐⭐⭐⭐⭐ Muy seguro    (CBR=5) │
│                                 │
└─────────────────────────────────┘

ALGORITMO ADAPTA SPACING:

CBR=5 (Muy seguro) → Próxima revisión EN 21 DÍAS
  "Realmente sabes esto → repasa en 3 semanas"

CBR=3 (Neutral)    → Próxima revisión EN 7 DÍAS
  "Más o menos → repasa en 1 semana"

CBR=1 (Adiviné)    → Próxima revisión EN 1 DÍA
  "Suerte nada más → repasa mañana"

ERRORES TAMBIÉN CUENTAN:

Si respondiste MALO + CBR=4 (confiado):
  → ERROR IMPORTANTE (falso conocimiento)
  → Próxima revisión EN 1 DÍA (más pronto)
  → Marca como "revisión urgente"

Si respondiste MALO + CBR=1 (no confiado):
  → Esperado (no lo sabías)
  → Próxima revisión EN 1 DÍA (normal)
```

### Comparación de Algoritmos

```
ESCENARIO: Estudiante responde CORRECTO

Algoritmo Tradicional (Anki FSRS):
Respuesta: CORRECTO
Próxima: EN 3 SEMANAS
(Sin importar si fue suerte o seguridad)

Algoritmo CBR (Axon):
Respuesta: CORRECTO + ⭐⭐⭐⭐⭐ Muy seguro
Próxima: EN 4 SEMANAS
(Confía en tu conocimiento → espaciar más)

Respuesta: CORRECTO + ⭐⭐ Poco seguro
Próxima: EN 2 DÍAS
(Dudaste → repasa pronto)


RESULTADO:
┌──────────────────────────────────┐
│ Ahorro de tiempo: 20-30%        │
│ Retención: Igual o mejor         │
│ Satisfacción: Más control         │
└──────────────────────────────────┘
```

---

## Patrón 5: Colaboración + Auditoría

### Timeline Semanal

```
MONDAY-THURSDAY: CREACIÓN (Estudiantes)
┌─────────────────────────────────┐
│ Workspace Compartido             │
│ TVP + Tratamiento + Complic.     │
├─────────────────────────────────┤
│                                 │
│ Est1: "Crearé tarjetas sobre    │
│        patofisiología"           │
│        ✏️ 8 tarjetas creadas    │
│                                 │
│ Est2: "Yo diagnóstico diferencial"
│        ✏️ 5 tarjetas creadas    │
│                                 │
│ Est3: "Tratamiento"              │
│        ✏️ 10 tarjetas creadas   │
│                                 │
│ Est4: "Complicaciones"           │
│        ✏️ 3 tarjetas creadas    │
│                                 │
│ Est5: "Casos clínicos"           │
│        ✏️ 2 tarjetas creadas    │
│                                 │
│ TOTAL: 28 tarjetas en "Draft"   │
│ Status: ⚪ Pending Audit         │
│                                 │
└─────────────────────────────────┘

FRIDAY: AUDITORÍA (Profesor)
┌─────────────────────────────────┐
│ 🔍 Panel de Auditoría           │
│ Workspace: TVP (28 tarjetas)    │
├─────────────────────────────────┤
│                                 │
│ Tarjeta 1-17: ✅ ACEPTADA       │
│ Tarjeta 18-23: ✅ ACEPTADA      │
│ Tarjeta 24-25: ⚠️ FEEDBACK      │
│   "Error médico: revisar dosis" │
│ Tarjeta 26-28: ✅ ACEPTADA      │
│                                 │
│ RESULTADO:                       │
│ 26 AUDITADAS ✅                 │
│ 2 CON FEEDBACK ⚠️               │
│                                 │
│ [Enviar feedback a Est]         │
│                                 │
└─────────────────────────────────┘

SATURDAY: DISTRIBUCIÓN (Cohort)
┌─────────────────────────────────┐
│ 🎓 Cohorte Medicina 3er Año     │
│ 60 estudiantes                  │
├─────────────────────────────────┤
│                                 │
│ ✅ 26 Tarjetas Auditadas       │
│    Ahora disponibles para TODOS │
│                                 │
│ Est6 (nuevo): "Wow, 26 tarjetas│
│                de TV alta P     │
│                de Aud quality!  │
│                Puedo estudiar   │
│                estas en lugar   │
│                de crear las     │
│                mías"            │
│                                 │
│ BENEFICIO:                       │
│ Grupo de 5 → Crea para 60       │
│ Reducción de duplicación: 92%!   │
│                                 │
└─────────────────────────────────┘
```

### Sistema de Gamificación

```
PUNTOS Y ESTADÍSTICAS:

Creación:
  • Tarjeta creada: 5 XP
  • Tarjeta auditada exitosamente: 10 XP
  • Tarjeta rechazada (feedback): -2 XP (aprender)

Auditoría:
  • Tarjeta auditada (como profesor): 15 XP
  • Auditoría rechazada (error tuyo): -5 XP

Engagement:
  • Tarjeta compartida (útil votes): 2 XP c/voto
  • Tarjeta con 10+ útiles: Insignia "Popular"

INSIGNIAS (Badges):
🎖️ Creador Novicio      (5 tarjetas creadas)
🎖️ Creador Prolífico    (20+ tarjetas creadas)
🎖️ Auditor Novicio      (5 auditorías completadas)
🎖️ Auditor Confiable    (5+ auditorías sin errores)
🎖️ Coautor Estrella     (2+ colaboraciones verificadas)
🎖️ Contribuyente Semanal (Fue top 3 creador esa semana)

LEADERBOARD:
┌─────────────────────────────────┐
│ 🏆 Top Creadores (Esta Semana) │
├─────────────────────────────────┤
│ 1. 🥇 Est1    12 tarjetas ✅   │
│        280 XP, insignia: ⭐    │
│                                 │
│ 2. 🥈 Est4    11 tarjetas ✅   │
│        265 XP                   │
│                                 │
│ 3. 🥉 Est2     9 tarjetas ✅   │
│        215 XP                   │
│                                 │
│ 4.    Est3     8 tarjetas ✅   │
│        190 XP                   │
│                                 │
│ 5.    Est5     2 tarjetas (1❌) │
│        25 XP                    │
│                                 │
│ [Histórico] [Badges] [Estadísticas]
└─────────────────────────────────┘
```

---

## Resumen Comparativo: Los 5 Patrones

```
┌─────────────────┬──────────┬──────────┬──────────┬──────────┐
│ Patrón          │ Fricción │ Calidad  │ Tiempo   │ Impacto  │
├─────────────────┼──────────┼──────────┼──────────┼──────────┤
│ 1. Inline Notas │ Muy baja │ Media    │ 50% ↓    │ ⭐⭐⭐⭐⭐ │
│                 │ (0 pasos)│          │          │          │
├─────────────────┼──────────┼──────────┼──────────┼──────────┤
│ 2. Oficial/Pers │ Nula     │ Variable │ 0        │ ⭐⭐⭐⭐  │
│    (Badges)     │ (visual) │ → Alta   │          │ (seguridad)
├─────────────────┼──────────┼──────────┼──────────┼──────────┤
│ 3. IA Lotes     │ Muy baja │ Alta     │ 87% ↓    │ ⭐⭐⭐⭐⭐ │
│                 │ (1 sube) │ (validar)│          │          │
├─────────────────┼──────────┼──────────┼──────────┼──────────┤
│ 4. CBR          │ Muy baja │ Alta     │ 30% ↓    │ ⭐⭐⭐⭐⭐ │
│                 │ (1 click)│ (adapta) │          │ (smart)  │
├─────────────────┼──────────┼──────────┼──────────┼──────────┤
│ 5. Colab+Audit  │ Media    │ Muy alta │ 92% ↓    │ ⭐⭐⭐⭐⭐ │
│                 │ (workspace)│ (verif) │ (grupo)  │ (comun.) │
└─────────────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## Quick Start: Implementar en Orden

```
SEMANA 1-2: Patrón #1 + #2
  ├─ Inline creation: [[ ]] syntax
  └─ Badges: 🔵 Official, ⚫ Personal, 🟢 Audited

SEMANA 3-4: Patrón #3 + #4
  ├─ IA generación desde PDF
  └─ CBR algoritmo

SEMANA 5-6: Patrón #5
  ├─ Workspace + Auditoría
  └─ Gamificación

TOTAL: 8 semanas → MVP robusto con todos 5 patrones
```

