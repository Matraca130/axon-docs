# Especificación UX: Creación de Tarjetas en Axon

**Fecha**: 2026-03-27
**Destinatarios**: Frontend (React), Backend (Hono)
**Estado**: Propuesta (requiere validación de producto)

---

## 1. FLUJO DE CREACIÓN INLINE EN NOTAS

### Caso de Uso: Estudiante Toma Notas + Crea Tarjetas Simultáneamente

```
Interfaz de Notas:
┌─────────────────────────────────────────────┐
│ [← Atrás] TVP - Tratamiento      [Share]   │
├─────────────────────────────────────────────┤
│                                             │
│  La TVP requiere anticoagulación por   │   │
│  [[[[al menos ___]]]  ← Seleccionado!  │   │
│                                        │   │
│  Aparece tooltip:                       │   │
│  "📝 Crear tarjeta cloze"              │   │
│  > Acepto   ✗ Rechazar                 │   │
│                                         │   │
│  Duración: [[≥3 meses]]                 │   │
│                                         │   │
│  Excepto en casos de:                   │   │
│  [[trombosis proximal con síntomas]]   │   │
│                                         │   │
└─────────────────────────────────────────────┘
```

### Cómo Funciona

**Desktop (Recomendado)**:
- Triple-click o arrastra para seleccionar texto
- Aparece tooltip flotante: "📝 Crear tarjeta cloze"
- Click → Tarjeta creada, destacada en color (verde "sin revisar")

**Móvil**:
- Selecciona texto → Aparece menú de contexto
- "Crear cloze" es opción prominent

### Backend

```typescript
// POST /notes/:noteId/create-flashcard
{
  text_content: "al menos ___",
  card_type: "cloze",
  context: "La TVP requiere anticoagulación por al menos 3 meses",
  status: "draft", // ← Sin auditar aún
  created_by: user_id,
  linked_to_note: true
}

// Response:
{
  card_id: "fl_abc123",
  preview: "Frente: La TVP requiere anticoagulación por ___\nDorso: al menos 3 meses",
  status: "draft"
}
```

---

## 2. DIFERENCIACIÓN OFICIAL/PERSONAL/AUDITADA

### Badge System (Visual)

```
┌────────────────────────────┐
│ 🔵 OFICIAL               │ ← Azul: Profesor/Axon
│    La TVP es...          │
├────────────────────────────┤
│ ⚫ PERSONAL               │ ← Gris: Estudiante (Usuario)
│    Mi nota sobre TVP...  │
├────────────────────────────┤
│ 🟢 AUDITADA              │ ← Verde: Verificada por profesor
│    (Compartida por Est5) │    o peer-review exitoso
├────────────────────────────┤
│ ⚠️  NO VERIFICADA        │ ← Rojo: Estudiante, shared pero
│    (De Es2)              │    sin auditar aún
└────────────────────────────┘
```

### Metadata Asociada

```sql
-- Tabla: flashcards
CREATE TABLE flashcards (
  id UUID PRIMARY KEY,
  question TEXT,
  answer TEXT,
  card_type ENUM('basic', 'cloze', 'image_occlusion', 'concept'),

  -- Diferenciación
  created_by UUID REFERENCES users(id),
  origin ENUM('official', 'student', 'ai_generated'),
  verification_status ENUM('unreviewed', 'verified', 'flagged', 'rejected'),
  verified_by UUID REFERENCES users(id), -- NULL si no verificada
  verified_at TIMESTAMP,

  -- Auditoría
  shared_with_cohort BOOLEAN DEFAULT false,
  useful_votes INT DEFAULT 0,
  flagged_votes INT DEFAULT 0,

  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### UI: Cómo Se Muestra

```
Tarjeta Oficial (Profesor):
┌─────────────────────────────┐
│ 🔵 OFICIAL (Prof. García)  │
│                             │
│ Q: La TVP requiere...      │
│ A: Anticoagulación ≥3 meses│
│                             │
│ [📚 Ver fuente] [⭐ Guardar]│
└─────────────────────────────┘

Tarjeta Personal (Estudiante):
┌─────────────────────────────┐
│ ⚫ MI TARJETA (Usuario)     │
│                             │
│ Q: La TVP requiere...      │
│ A: Anticoagulación ≥3 meses│
│                             │
│ [✏️ Editar] [🗑️ Borrar]    │
└─────────────────────────────┘

Tarjeta Compartida Auditada:
┌─────────────────────────────┐
│ 🟢 AUDITADA (Est. María)    │
│ Verificada por Prof. García │
│                             │
│ Q: Diagnóstico TVP...      │
│ A: Doppler venoso          │
│                             │
│ [👍 Útil] [❌ Confusa]     │
└─────────────────────────────┘

Tarjeta Compartida SIN Auditar:
┌─────────────────────────────┐
│ ⚠️  NO VERIFICADA (Est. Jo) │
│                             │
│ Q: Síntomas TVP...         │
│ A: Edema, dolor, calor...  │
│                             │
│ [📢 Reportar] [👍 Útil]    │
└─────────────────────────────┘
```

---

## 3. GENERACIÓN IA EN LOTES

### Flujo Desktop

```
Usuario sube PDF → IA Genera → Revisa → Crea

┌──────────────────────────────────┐
│ 📁 Subir Recurso                │
├──────────────────────────────────┤
│ [Arrastra PDF aquí]              │
│ o [Selecciona archivo]           │
│                                  │
│ Archivo: "TVP_Complicaciones.pdf"│
│ [Procesando IA...] ▮▮▮▮░ 60%    │
└──────────────────────────────────┘

        ↓ (1-2 min)

┌──────────────────────────────────┐
│ ✅ 17 Tarjetas Generadas       │
│                                  │
│ Tipo de tarjeta:                │
│   • 8 cloze (definiciones)      │
│   • 6 Q&A (patofisiología)      │
│   • 3 imagen-oclusión (signos)  │
│                                  │
│ [Aceptar todas] [Revisar una por una]
└──────────────────────────────────┘

        ↓

┌──────────────────────────────────┐
│ 📝 Revisar Tarjeta 1/17         │
├──────────────────────────────────┤
│ Tipo: Cloze                      │
│                                  │
│ Frente: "La TVP proximal requiere│
│         anticoagulación por ___" │
│                                  │
│ Dorso: "al menos 3 meses"       │
│                                  │
│ [✅ Aceptar] [✏️ Editar] [❌ Rechazar]
│                                  │
│ [← Anterior] [Siguiente →]       │
└──────────────────────────────────┘
```

### Prompt IA para Generación (Backend)

```python
# supabase/functions/generate_flashcards/index.ts

async function generateFlashcards(
  pdfText: string,
  subject: string = "Médica"
): Promise<FlashcardDraft[]> {

  const prompt = `
  Eres un experto en educación médica. Analiza el siguiente texto
  y genera tarjetas de estudio de alta calidad para estudiantes de medicina.

  INSTRUCCIONES:
  1. Genera 3-5 tarjetas cloze (llenar espacios)
  2. Genera 2-3 tarjetas Q&A (preguntas conceptuales)
  3. Si hay diagramas mencionados, marca 1-2 como "imagen_oclusión"
  4. Asegúrate que cada tarjeta sea INDEPENDIENTE (sin depender de otras)
  5. Evita trivialidades — enfócate en patofisiología y diagnóstico

  FORMATO JSON:
  {
    "cards": [
      {
        "card_type": "cloze",
        "question": "La TVP proximal requiere anticoagulación por ___",
        "answer": "al menos 3 meses",
        "difficulty": "media"
      },
      {
        "card_type": "qa",
        "question": "¿Cuál es el Gold Standard para diagnóstico de TVP?",
        "answer": "Ecografía de compresión venosa (Doppler)",
        "difficulty": "media"
      }
    ]
  }

  TEXTO:
  ${pdfText}
  `;

  const response = await gemini.generateContent(prompt);
  return JSON.parse(response.text()).cards;
}
```

### Backend Endpoint

```typescript
// POST /flashcards/generate-from-pdf
{
  pdf_url: "https://storage.com/TVP.pdf",
  subject: "Trombosis Venosa Profunda",
  num_cards_target: 15
}

// Response:
{
  draft_id: "draft_xyz789",
  cards_generated: 17,
  cards: [
    {
      id: "draft_card_1",
      card_type: "cloze",
      question: "La TVP requiere anticoagulación por ___",
      answer: "≥3 meses",
      difficulty: "media",
      status: "pending_review"
    },
    // ... 16 more
  ]
}
```

---

## 4. CONFIDENCE-BASED REPETITION (CBR)

### UI: Después de Responder

```
┌─────────────────────────────────────┐
│ ✅ CORRECTO!                        │
│                                     │
│ Tu respuesta: "anticoagulación"     │
│ Respuesta oficial: "anticoagulación"│
│                                     │
│ ¿Qué tan confiado estuviste?       │
│                                     │
│   ⭐ Adiviné         ← CBR = 1     │
│   ⭐⭐ Poco seguro    ← CBR = 2     │
│   ⭐⭐⭐ Más o menos  ← CBR = 3 (default)
│   ⭐⭐⭐⭐ Seguro     ← CBR = 4     │
│   ⭐⭐⭐⭐⭐ Muy seguro ← CBR = 5    │
│                                     │
│       [Continuar →]                 │
└─────────────────────────────────────┘
```

### Algoritmo (Backend)

```typescript
// POST /study/answer
{
  card_id: "fl_abc123",
  user_answer: "anticoagulación",
  confidence_rating: 5, // ← Nueva métrica
  correct: true
}

// Calcular próxima revisión:
function calculateNextReview(
  confidence: number,
  correct: boolean,
  lastIntervalDays: number
): Date {

  // Base: FSRS (como Anki)
  let baseInterval = computeFSRS(correct, lastIntervalDays);

  // Ajuste por confianza:
  if (correct && confidence === 5) {
    // Muy seguro, respuesta correcta → espaciar MUCHO
    return addDays(new Date(), baseInterval * 1.5);
  } else if (correct && confidence === 2) {
    // Acertó pero dudoso → espaciar MENOS
    return addDays(new Date(), baseInterval * 0.6);
  } else if (!correct && confidence === 4) {
    // Erró pero confiado → ERROR IMPORTANTE, repite pronto
    return addDays(new Date(), 1);
  } else if (!correct && confidence === 1) {
    // Erró sin confianza → repite mañana
    return addDays(new Date(), 1);
  }

  return addDays(new Date(), baseInterval);
}
```

### Estadísticas para Estudiante

```
┌──────────────────────────────┐
│ 📊 Tu Desempeño             │
├──────────────────────────────┤
│ Total tarjetas:        145   │
│ Estudiadas hoy:         12   │
│                              │
│ Confianza PROMEDIO:          │
│   ⭐⭐⭐⭐ 4.2/5            │
│                              │
│ Tarjetas por confianza:      │
│   ⭐ Adiviné:        3       │
│   ⭐⭐ Poco seguro:  8       │
│   ⭐⭐⭐ Más o menos: 52      │
│   ⭐⭐⭐⭐ Seguro:    62      │
│   ⭐⭐⭐⭐⭐ Muy seguro: 20  │
│                              │
│ → Enfócate en las 3 de ⭐    │
└──────────────────────────────┘
```

---

## 5. COLABORACIÓN + AUDITORÍA

### Workspace Compartido

```
┌─────────────────────────────────────┐
│ 📚 Workspace: TVP + Tratamiento    │
│ Cohorte: Medicina 3er Año (60)     │
├─────────────────────────────────────┤
│                                     │
│ 👥 Miembros: 5                     │
│   Est1, Est2, Est3, Est4, Est5     │
│                                     │
│ 📝 Tarjetas Esta Semana:           │
│   ⚪ 28 pendientes auditoría       │
│   🟢 45 auditadas                 │
│   🔴 3 rechazadas                 │
│                                     │
│ [Mis Contribuciones] [Todas]       │
│                                     │
│ Tarjeta 1 (Est1):                  │
│ "La TVP requiere..."               │
│ Estado: ⚪ Pendiente (hace 2 días)  │
│ [Ver] [Editar] [Retract]           │
│                                     │
│ Tarjeta 2 (Est2):                  │
│ "Diagnóstico definitivo..."        │
│ Estado: 🟢 Auditada ✅             │
│ Votos: 👍 12 / ❌ 0                │
│                                     │
└─────────────────────────────────────┘
```

### Panel de Auditoría (Profesor)

```
┌─────────────────────────────────────┐
│ 🔍 Panel de Auditoría              │
│ Workspace: TVP (28 pendientes)      │
├─────────────────────────────────────┤
│                                     │
│ [Automatizar] [Revisar Manual]      │
│                                     │
│ Tarjeta 5/28 (Est3):               │
│ ┌─────────────────────────────────┐ │
│ │ Tipo: Q&A                        │ │
│ │ Frente: "Qué es TVP?"            │ │
│ │ Dorso: "Trombosis en venas..."   │ │
│ │                                  │ │
│ │ Comentario: ⚠️ Muy vaga         │ │
│ │                                  │ │
│ │ [✅ Aceptar] [✏️ Editar]        │ │
│ │ [❌ Rechazar] [💬 Comentario]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Tarjeta 6/28 (Est4): Error médico! │
│ ┌─────────────────────────────────┐ │
│ │ Frente: "Dosis de Heparina..."  │ │
│ │ Dorso: "500 U/kg INCORRECTO"    │ │
│ │                                  │ │
│ │ Mi comentario:                   │ │
│ │ "Dosis es 80 U/kg (bolus), luego│ │
│ │  18 U/kg/hr (infusión). Corrigir│ │
│ │  y resubmit."                    │ │
│ │                                  │ │
│ │ [❌ Rechazar + Feedback]         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [← Anterior] Tarjeta 5/28 [Siguiente →]
└─────────────────────────────────────┘
```

### Gamificación

```sql
-- Tabla: user_flashcard_stats
CREATE TABLE user_flashcard_stats (
  user_id UUID REFERENCES users(id),
  cohort_id UUID,

  cards_created INT DEFAULT 0,
  cards_audited_pass INT DEFAULT 0,
  cards_audited_fail INT DEFAULT 0,

  useful_votes_received INT DEFAULT 0,
  flag_votes_received INT DEFAULT 0,

  week_rank INT,
  month_rank INT,

  badges JSONB, -- ["auditor_novice", "prolific_creator", ...]

  updated_at TIMESTAMP
);
```

### Leaderboard

```
┌──────────────────────────────────┐
│ 🏆 Top Creadores (Esta Semana)  │
├──────────────────────────────────┤
│ 1. 🥇 Est1    12 tarjetas ✅    │
│ 2. 🥈 Est4    11 tarjetas ✅    │
│ 3. 🥉 Est2     9 tarjetas ✅    │
│ 4.    Est3     8 tarjetas ✅    │
│ 5.    Est5     2 tarjetas (1❌)  │
│                                  │
│ Mis insignias:                   │
│ 🎖️ Auditor Confiable (5+ audits) │
│ 🎖️ Creador Prolífico (20+ cards) │
└──────────────────────────────────┘
```

---

## 6. ESPECIFICACIÓN TÉCNICA RESUMIDA

### Endpoints Principales

```typescript
// CREACIÓN
POST   /notes/:noteId/create-flashcard      // Inline en notas
POST   /flashcards/generate-from-pdf        // Generación IA
POST   /flashcards/bulk-create              // Crear múltiples

// ESTUDIO
POST   /study/answer                        // Responder + CBR
GET    /study/next-cards                    // Próximas tarjetas (CBR-powered)

// COMPARTICIÓN
POST   /workspaces/:wsId/share-flashcards   // Compartir con grupo
GET    /workspaces/:wsId/flashcards         // Ver tarjetas del workspace

// AUDITORÍA
POST   /audit/review-flashcard              // Revisar como profesor
GET    /audit/pending-review                // Lista de pendientes
POST   /audit/mark-verified                 // Marcar como auditada

// ESTADÍSTICAS
GET    /users/:userId/flashcard-stats       // Stats personales
GET    /workspaces/:wsId/leaderboard        // Ranking del workspace
```

### Tabla Principal: `flashcards`

```sql
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contenido
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  card_type VARCHAR(50) NOT NULL, -- 'cloze', 'qa', 'image_occlusion', 'concept'

  -- Metadata
  created_by UUID REFERENCES users(id),
  workspace_id UUID REFERENCES workspaces(id),
  linked_note_id UUID REFERENCES notes(id),

  -- Origen/Verificación
  origin VARCHAR(50), -- 'official', 'student', 'ai_generated'
  verification_status VARCHAR(50) DEFAULT 'unreviewed', -- 'unreviewed', 'verified', 'rejected', 'flagged'
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  verification_comment TEXT,

  -- Social
  shared_with_cohort BOOLEAN DEFAULT false,
  useful_votes INT DEFAULT 0,
  flag_votes INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- Soft delete
);

CREATE INDEX idx_workspace_id ON flashcards(workspace_id);
CREATE INDEX idx_created_by ON flashcards(created_by);
CREATE INDEX idx_verification_status ON flashcards(verification_status);
```

---

## 7. Roadmap de Implementación (Sugerencia)

**Sprint 1 (Semana 1-2)**
- [ ] Creación inline en notas (UI + Backend)
- [ ] Diferenciación oficial/personal (badge system)
- [ ] Estudio básico (sin CBR aún)

**Sprint 2 (Semana 3-4)**
- [ ] Confidence-Based Repetition (algoritmo + UI)
- [ ] Generación IA desde PDF (batch creation)

**Sprint 3 (Semana 5-6)**
- [ ] Workspace compartido + auditoría
- [ ] Leaderboard + gamificación

**Sprint 4 (Semana 7+)**
- [ ] Mobile UX optimized (creación + estudio)
- [ ] Analytics (estudiante + profesor)
- [ ] Integraciones externas (Anki import/export)

