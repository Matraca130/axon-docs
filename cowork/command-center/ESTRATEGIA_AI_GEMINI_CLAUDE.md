# Estrategia AI para Axon: Gemini + Claude

> Documento de decisión — 2026-03-26
> Autor: Investigación Cowork + Petrick

---

## Estado actual

| Función | Modelo | Uso |
|---------|--------|-----|
| Generación de texto (resúmenes, flashcards) | Gemini 2.5 Flash | Principal |
| Embeddings | OpenAI text-embedding-3-large (1536d) | Único |
| Análisis alternativo | Claude 3.5 Sonnet | Secundario |
| Imágenes | ❌ No existe | — |

---

## Propuesta: Arquitectura Dual

```
Petición del profesor: "Generar flashcard sobre anatomía del tiroides"
    │
    ├── Claude (Opus/Sonnet) ──→ Texto médico
    │   ├── Definición clínica precisa
    │   ├── Mnemotecnias
    │   ├── Diagnóstico diferencial
    │   └── Contexto clínico
    │   [78% accuracy en cardiología, menor tasa de alucinación]
    │
    └── Gemini 3.1 Flash Image ──→ Imagen educativa
        ├── Diagrama anatómico con labels
        ├── Imagen interactiva (labels clicables)
        └── Ilustración estilo educativo
        [Anatomía validada: esternón, costillas, cerebro correctos]

    ──→ Flashcard multimodal: texto + imagen + labels interactivos
```

---

## Por qué Claude para texto

Investigaciones recientes (Nature Scientific Reports, 2025-2026):

- **Cardiología:** Claude 78.31% vs GPT-4 75.90% vs Gemini ~70%
- **Neurociencia:** Claude/GPT-4 superiores vs Gemini 53.6%
- **Endodoncia:** GPT-4o1 89.2% vs Gemini Advanced 67.7%
- **Alucinación:** Claude tiene la tasa más baja entre los 3

Para contenido médico educativo donde un error puede enseñar mal, Claude es la opción más segura.

---

## Por qué Gemini para imágenes

- **Generación nativa:** Nano Banana 2 (Gemini 3.1 Flash Image Preview, feb 2026) genera imágenes hasta 4K directamente en la API
- **Anatomía validada:** Estudio de Wiley muestra que Gemini genera anatomía más precisa que DALL-E (esternón correcto, conteo de costillas correcto)
- **Labels interactivos:** Feature exclusiva — labels clicables en diagramas para exploración step-by-step
- **Costo competitivo:** $0.039/imagen (Flash) con 50% descuento en batch

---

## Costos estimados

### Escenario: 5000 flashcards/mes (plataforma en crecimiento)

| Componente | Modelo | Costo/unidad | Mensual |
|------------|--------|-------------|---------|
| Texto | Claude 3.5 Sonnet | ~$0.015/flashcard | $75 |
| Imagen | Gemini 2.5 Flash Image | $0.039/imagen | $195 |
| Embeddings | OpenAI text-embedding-3-large | ~$0.001/chunk | $5 |
| **Total** | | | **~$275/mes** |

Con batch processing (50% descuento en imágenes): **~$177/mes**

### Escenario: 50,000 flashcards/mes (escala)

| Sin batch | Con batch (50% off) |
|-----------|---------------------|
| ~$2,750/mes | ~$1,725/mes |

---

## Casos de uso para Axon

### 1. Flashcards multimodales (PRIORIDAD ALTA)
- Claude genera: pregunta, respuesta, mnemotecnia, contexto clínico
- Gemini genera: diagrama anatómico, imagen de patología, ECG esquemático
- Resultado: flashcard con texto + imagen educativa
- FSRS v4 programa revisiones considerando ambos componentes

### 2. Ilustración de resúmenes (PRIORIDAD MEDIA)
- Bloques de tipo `image_reference` generados automáticamente
- Profesor pide "ilustrar este bloque" → Gemini genera imagen basada en el contenido
- Se guarda en Supabase Storage como los uploads manuales actuales

### 3. Quiz con diagramas (PRIORIDAD MEDIA)
- Preguntas clínicas con imágenes de caso (RX tórax, ECG, dermatología)
- Claude escribe el stem + opciones
- Gemini genera la imagen del caso clínico
- Estudiante ve pregunta + imagen, responde

### 4. Review flow en Telegram/WhatsApp (PRIORIDAD BAJA)
- Flashcards con imagen enviadas via bot
- Texto + imagen en un solo mensaje
- Estudiante revisa con media rica en mobile

---

## Implementación técnica (propuesta)

### Backend: Nuevo servicio de generación multimodal

```typescript
// supabase/functions/server/services/multimodal-generator.ts

interface MultimodalFlashcard {
  text: {
    question: string;
    answer: string;
    mnemonic?: string;
    clinical_context?: string;
  };
  image?: {
    url: string;           // Supabase Storage URL
    alt_text: string;
    labels?: string[];     // Para labels interactivos
    generation_model: string;
  };
}

// Pipeline paralelo
async function generateMultimodalFlashcard(topic: string, context: string) {
  const [textResult, imageResult] = await Promise.allSettled([
    generateTextWithClaude(topic, context),      // Claude Sonnet
    generateImageWithGemini(topic, context),      // Gemini 3.1 Flash Image
  ]);

  // Image es optional — si falla, flashcard solo tiene texto
  return {
    text: textResult.status === 'fulfilled' ? textResult.value : fallback,
    image: imageResult.status === 'fulfilled' ? imageResult.value : null,
  };
}
```

### Frontend: Componente de flashcard con imagen

```typescript
// Extender FlashcardCard.tsx para mostrar imagen
// La imagen se renderiza arriba del texto
// Labels interactivos como chips clicables
```

### Base de datos

```sql
-- Agregar columnas a flashcards table
ALTER TABLE flashcards ADD COLUMN image_url TEXT;
ALTER TABLE flashcards ADD COLUMN image_alt TEXT;
ALTER TABLE flashcards ADD COLUMN image_labels JSONB DEFAULT '[]';
ALTER TABLE flashcards ADD COLUMN image_model TEXT; -- 'gemini-3.1-flash-image'
```

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| Gemini genera imagen incorrecta médicamente | Revisión del profesor antes de publicar (status: draft → review → published) |
| Watermark SynthID en imágenes | Verificar si es visible; evaluar aceptabilidad para uso educativo |
| Latencia de 2 API calls | Promise.allSettled paralelo; imagen es optional (graceful degradation) |
| Costo escala | Batch processing 50% off; generar imágenes off-peak; cache de imágenes similares |
| API breaking changes (Nano Banana 2 es nuevo) | Abstracción de servicio; fácil swap de modelo |

---

## Decisión requerida

1. **¿Adoptamos la arquitectura dual Claude+Gemini?** → Recomendado: SÍ
2. **¿Empezamos con flashcards o resúmenes?** → Recomendado: Flashcards (pipeline más simple)
3. **¿Imagen obligatoria o opcional?** → Recomendado: Opcional (graceful degradation si Gemini falla)
4. **¿Revisión del profesor para imágenes?** → Recomendado: SÍ (draft → review → published)
5. **¿Batch processing o real-time?** → Recomendado: Real-time para 1-5 flashcards, batch para generación masiva

---

## Próximos pasos

1. Arreglar bugs existentes de generación (PROMPT_FIX_FLASHCARD_GENERATION.md)
2. Spike técnico: llamada a Gemini Image API desde Deno/Hono Edge Function
3. Migración DB: agregar columnas de imagen a flashcards
4. Frontend: extender FlashcardCard para mostrar imagen
5. Backend: servicio multimodal-generator con Promise.allSettled
6. QA: auditoría de imágenes generadas con contenido médico real
