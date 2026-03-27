# Spec Técnica: Pipeline de Imágenes para Flashcards

> Decisiones tomadas: 2026-03-26 | Actualizado: 2026-03-27
> Stack: Hono + Deno (backend) → Supabase Storage + Image Transformations + PostgreSQL
> Generación: Gemini 3.1 Flash Image (Nano Banana 2)
> Cambio v2: Eliminado Sharp del pipeline — Supabase Transformations soporta `format=avif` nativo

---

## 1. Análisis de formatos: AVIF vs WebP

### Comparación directa

| Aspecto | WebP | AVIF |
|---------|------|------|
| Compresión (vs JPEG) | 25-35% menor | 50% menor |
| Compresión (AVIF vs WebP) | — | 20-30% menor que WebP |
| Calidad visual (mismo tamaño) | Buena | Superior |
| Velocidad de encoding | Rápida (~50ms) | Lenta (~500ms-2s) |
| Velocidad de decoding (browser) | Rápida | Más lenta |
| Browser support 2026 | 96%+ | 94%+ |
| Supabase Transformations | ✅ Auto-detect | ✅ `format=avif` explícito (auto-detect solo WebP aún) |
| Sharp (Node.js) | ✅ Nativo | ✅ Nativo |
| HDR / 10-bit | No | Sí |
| Max resolución | 16383×16383 | Sin límite práctico |

### Tamaño real para un diagrama educativo (800px ancho)

| Formato | Quality | Tamaño | vs PNG original |
|---------|---------|--------|----------------|
| PNG (original Gemini) | lossless | ~800KB | baseline |
| WebP q90 | lossy | ~100KB | -87% |
| WebP lossless | lossless | ~550KB | -31% |
| **AVIF q80** | **lossy** | **~60KB** | **-92%** |
| AVIF lossless | lossless | ~400KB | -50% |

### Proyección de storage a escala

| Escala | AVIF q80 (~60KB) | WebP q90 (~100KB) | PNG (~800KB) |
|--------|------------------|-------------------|--------------|
| 5K flashcards | 300MB | 500MB | 4GB |
| 20K | 1.2GB | 2GB | 16GB |
| 50K | 3GB | 5GB | 40GB |
| 100K | 6GB | 10GB | 80GB |

### Decisión: ORIGINAL PNG + TRANSFORMACIONES ON-DEMAND (v2 simplificada)

```
Almacenar: PNG original (máxima calidad, re-procesable)
Servir:    AVIF on-demand via Supabase Image Transformations (?format=avif&quality=80&width=800)
Fallback:  WebP on-demand (?format=webp) para browsers antiguos
```

**Pipeline simplificado (v2 — sin Sharp):**
1. Gemini genera PNG (base64)
2. Backend sube PNG original a Supabase Storage
3. Frontend pide `?format=avif&quality=80&width=800` → Supabase transforma y cachea en CDN
4. Fallback: `?format=webp` para browsers sin AVIF

**¿Por qué guardar PNG original?**
- Supabase Transformations opera sobre el original → siempre puedes re-generar variantes
- Si AVIF auto-detect llega a Supabase (está en roadmap), las imágenes existentes se benefician automáticamente
- Cero dependencia de Sharp en Edge Functions (más simple, más rápido de deploy)
- El PNG solo vive en storage, nunca se sirve al browser (siempre va transformado)

**¿Y el costo de storage extra?**
- PNG ~800KB vs AVIF ~60KB = 13x más storage
- PERO: Supabase Image Transformations cachea las variantes en CDN
- A 50K flashcards: 40GB de PNG vs 3GB de AVIF → la diferencia es ~$0.77/mes en storage ($0.021/GB)
- Trade-off vale la pena por la simplicidad operativa

**Supabase Image Transformations — lo confirmado:**
- ✅ `?format=avif` funciona (formato explícito)
- ✅ `?format=webp` funciona (formato explícito)
- ⚠️ `format=auto` solo sirve WebP por ahora (AVIF auto-detect viene "near future")
- ✅ `?width=800&quality=80` resize + quality en CDN
- ✅ Cada imagen única transformada se factura una sola vez (cache posterior es gratis)
- ✅ Incluido en Pro plan

---

## 2. Pipeline completo: Generación → Storage → Delivery (v2 simplificado)

```
Profesor: "Generar flashcard con imagen"
    │
    ▼
[Backend: Edge Function]
    │
    ├── 1. Claude genera texto del flashcard (en paralelo ↓)
    │      POST https://api.anthropic.com/v1/messages
    │      model: claude-3-5-sonnet
    │      → { question, answer, mnemonic, clinical_context }
    │
    ├── 2. Gemini genera imagen (EN PARALELO con paso 1)
    │      POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent
    │      → PNG base64
    │
    ├── 3. Upload PNG original a Supabase Storage (SIN conversión)
    │      PUT /storage/v1/object/flashcard-images/{institution_id}/{flashcard_id}/original.png
    │
    └── 4. Guardar URL base en tabla flashcards
           UPDATE flashcards SET image_url = '...'
           (NO se guarda thumb_url — se genera on-demand via URL params)

[Frontend: al renderizar]
    │
    └── Pide imagen con transformación on-demand:
        Full:  {image_url}?format=avif&quality=80&width=800
        Thumb: {image_url}?format=avif&quality=60&width=200
        WebP:  {image_url}?format=webp&quality=85&width=800
```

### Código del pipeline (Deno/Hono Edge Function) — v2 sin Sharp

```typescript
// supabase/functions/server/services/flashcard-image-generator.ts

import { createClient } from "@supabase/supabase-js";

// Types
interface ImageGenerationResult {
  imageUrl: string;          // URL base del PNG en Storage (sin transformaciones)
  model: string;
  promptUsed: string;
}

interface FlashcardImageRequest {
  flashcardId: string;
  institutionId: string;
  topic: string;
  content: string;           // el texto del flashcard para contexto
  imagePrompt?: string;      // prompt custom del profesor (opcional)
  stylePackUrls?: string[];  // URLs de imágenes de referencia (style pack)
}

// ═══════════════════════════════════════════════════════
// Helper: URLs de transformación (frontend las usa para renderizar)
// ═══════════════════════════════════════════════════════
export function getTransformedImageUrl(
  baseUrl: string,
  opts: { width?: number; quality?: number; format?: "avif" | "webp" | "origin" } = {}
): string {
  const { width = 800, quality = 80, format = "avif" } = opts;
  // Supabase Image Transformations via query params en URLs públicas
  // Ref: https://supabase.com/docs/guides/storage/serving/image-transformations
  const params = new URLSearchParams();
  params.set("width", String(width));
  params.set("quality", String(quality));
  if (format !== "origin") params.set("format", format);
  return `${baseUrl}?${params.toString()}`;
}

// Helpers pre-armados para el frontend
export const imageVariants = {
  full:     (url: string) => getTransformedImageUrl(url, { width: 800, quality: 80, format: "avif" }),
  fullWebp: (url: string) => getTransformedImageUrl(url, { width: 800, quality: 85, format: "webp" }),
  thumb:    (url: string) => getTransformedImageUrl(url, { width: 200, quality: 60, format: "avif" }),
  thumbWebp:(url: string) => getTransformedImageUrl(url, { width: 200, quality: 70, format: "webp" }),
} as const;

// ═══════════════════════════════════════════════════════
// PASO 1: Generar imagen con Gemini
// ═══════════════════════════════════════════════════════
async function generateImageWithGemini(
  request: FlashcardImageRequest
): Promise<Uint8Array> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  const model = "gemini-3.1-flash-image-preview"; // Nano Banana 2

  const basePrompt = buildImagePrompt(request);
  const parts: Array<Record<string, unknown>> = [];

  // Agregar style pack si existe (imágenes de referencia)
  if (request.stylePackUrls?.length) {
    for (const url of request.stylePackUrls) {
      const imgResponse = await fetch(url);
      const imgBuffer = await imgResponse.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
      parts.push({
        inlineData: { mimeType: "image/png", data: base64 },
      });
    }
    parts.push({
      text: `Genera una nueva imagen en el MISMO estilo visual que las imágenes de referencia. ${basePrompt}`,
    });
  } else {
    parts.push({ text: basePrompt });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          temperature: 0.4,
        },
      }),
    }
  );

  const data = await response.json();

  for (const part of data.candidates[0].content.parts) {
    if (part.inlineData) {
      const binaryString = atob(part.inlineData.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
  }

  throw new Error("Gemini no retornó imagen");
}

// ═══════════════════════════════════════════════════════
// PASO 2: Construir prompt inteligente
// ═══════════════════════════════════════════════════════
function buildImagePrompt(request: FlashcardImageRequest): string {
  if (request.imagePrompt) return request.imagePrompt;

  return [
    `Crea una ilustración educativa médica sobre: ${request.topic}.`,
    `Contexto del flashcard: ${request.content.substring(0, 300)}`,
    "",
    "Requisitos de estilo:",
    "- Estilo diagramático educativo, limpio y profesional",
    "- Fondo blanco o muy claro",
    "- Labels en español con tipografía legible",
    "- Colores: usar tonos teal (#14b8a6) como acento principal",
    "- Sin texto decorativo innecesario",
    "- Anatomía precisa si aplica",
    "- Resolución clara para pantalla móvil",
  ].join("\n");
}

// ═══════════════════════════════════════════════════════
// PASO 3: Upload PNG original a Supabase Storage
// (Sin conversión — Supabase transforma on-demand)
// ═══════════════════════════════════════════════════════
async function uploadToStorage(
  supabase: ReturnType<typeof createClient>,
  institutionId: string,
  flashcardId: string,
  pngBuffer: Uint8Array
): Promise<string> {
  const bucket = "flashcard-images";
  const path = `${institutionId}/${flashcardId}/original.png`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, pngBuffer, {
      contentType: "image/png",
      upsert: true, // Sobrescribir si regenera
    });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

// ═══════════════════════════════════════════════════════
// PIPELINE COMPLETO (función exportada)
// ═══════════════════════════════════════════════════════
export async function generateFlashcardImage(
  supabase: ReturnType<typeof createClient>,
  request: FlashcardImageRequest
): Promise<ImageGenerationResult> {
  // 1. Generar PNG con Gemini
  const pngBuffer = await generateImageWithGemini(request);

  // 2. Upload PNG original (sin conversión)
  const imageUrl = await uploadToStorage(
    supabase,
    request.institutionId,
    request.flashcardId,
    pngBuffer
  );

  // 3. Retornar URL base — frontend usa imageVariants.full(url) para AVIF on-demand
  return {
    imageUrl,
    model: "gemini-3.1-flash-image-preview",
    promptUsed: request.imagePrompt || "auto-generated",
  };
}
```

### Comparación v1 vs v2

| Aspecto | v1 (Sharp en backend) | v2 (Supabase Transformations) |
|---------|----------------------|-------------------------------|
| Dependencias backend | sharp (npm, ~30MB) | Ninguna extra |
| Upload | 2 archivos (full.avif + thumb.avif) | 1 archivo (original.png) |
| Storage | ~60KB/flashcard | ~800KB/flashcard |
| Costo storage 50K | 3GB = $0.06/mes | 40GB = $0.84/mes |
| Complejidad deploy | Media (sharp requiere binarios nativos en Deno) | Baja |
| Re-procesamiento | Re-generar y re-subir | Cambiar params en URL |
| Variantes futuras | Código nuevo por variante | Nuevo URL param |
| Latencia generación | +500ms-2s (AVIF encode) | 0 (upload directo) |
| Latencia primer request | Inmediata (ya convertido) | ~200ms (transform + cache) |
| Requests posteriores | CDN cache | CDN cache (igual) |

---

## 3. Schema de Base de Datos + RLS

### Migración SQL

```sql
-- ═══════════════════════════════════════════════════════
-- MIGRACIÓN: Agregar soporte de imágenes a flashcards
-- ═══════════════════════════════════════════════════════

-- 1. Nuevas columnas en flashcards
-- NOTA v2: Solo image_url (PNG original). Thumbnails y AVIF se generan
-- on-demand via Supabase Image Transformations (?format=avif&width=200)
ALTER TABLE flashcards
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  -- URL base del PNG original en Storage (sin query params)
  ADD COLUMN IF NOT EXISTS image_prompt TEXT,
  ADD COLUMN IF NOT EXISTS image_model TEXT DEFAULT 'gemini-3.1-flash-image-preview',
  ADD COLUMN IF NOT EXISTS image_generated_at TIMESTAMPTZ;

-- 2. Índice para queries de flashcards con/sin imagen
CREATE INDEX IF NOT EXISTS idx_flashcards_has_image
  ON flashcards ((image_url IS NOT NULL));

-- 3. Style packs por institución
CREATE TABLE IF NOT EXISTS image_style_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'default',
  description TEXT,
  reference_images JSONB NOT NULL DEFAULT '[]',
  -- Formato: [{ "url": "https://...", "label": "anatomía" }]
  base_prompt TEXT,
  -- Prompt base que se antepone a todos los prompts de esta institución
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(institution_id, name)
);

-- 4. Prompt templates por tipo de contenido
CREATE TABLE IF NOT EXISTS image_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  -- NULL = template global (de sistema)
  category TEXT NOT NULL,
  -- 'anatomy', 'pharmacology', 'pathology', 'physiology', 'microbiology', etc.
  template TEXT NOT NULL,
  -- Template con placeholders: "Diagrama de {topic}, estilo educativo..."
  example_output_url TEXT,
  -- URL de ejemplo para que el profesor vea qué esperar
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(institution_id, category)
);

-- Templates globales iniciales
INSERT INTO image_prompt_templates (institution_id, category, template) VALUES
  (NULL, 'anatomy', 'Ilustración anatómica educativa de {topic}. Vista {view}. Labels en español. Estilo diagramático limpio, colores profesionales, fondo blanco. Preciso anatómicamente.'),
  (NULL, 'pharmacology', 'Diagrama de mecanismo de acción de {topic}. Muestra receptor, molécula y efecto. Labels en español. Estilo esquemático educativo.'),
  (NULL, 'pathology', 'Ilustración de la patología de {topic}. Muestra el proceso patológico paso a paso. Labels en español. Colores que distingan tejido sano de patológico.'),
  (NULL, 'physiology', 'Diagrama fisiológico de {topic}. Muestra el flujo/proceso con flechas. Labels en español. Estilo educativo con colores funcionales.'),
  (NULL, 'microbiology', 'Ilustración de {topic}. Muestra estructura/morfología con labels. Estilo educativo médico. Escala relativa correcta.'),
  (NULL, 'general', 'Ilustración educativa sobre {topic}. Estilo profesional, limpio, con labels en español. Fondo claro.')
ON CONFLICT DO NOTHING;

-- 5. Log de generaciones (para tracking de costos y auditoría)
CREATE TABLE IF NOT EXISTS image_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  flashcard_id UUID REFERENCES flashcards(id) ON DELETE SET NULL,
  summary_block_id UUID REFERENCES summary_blocks(id) ON DELETE SET NULL,
  -- Puede ser para flashcard O para summary block
  model TEXT NOT NULL,
  prompt_used TEXT NOT NULL,
  style_pack_id UUID REFERENCES image_style_packs(id),
  generation_mode TEXT NOT NULL CHECK (generation_mode IN ('realtime', 'batch')),
  cost_estimate_usd NUMERIC(10, 6),
  -- ~$0.039 realtime, ~$0.0195 batch
  duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para reportes de costos
CREATE INDEX IF NOT EXISTS idx_image_gen_log_institution
  ON image_generation_log (institution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_gen_log_status
  ON image_generation_log (status) WHERE status = 'pending';

-- ═══════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════

-- Habilitar RLS en tablas nuevas
ALTER TABLE image_style_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_generation_log ENABLE ROW LEVEL SECURITY;

-- Style Packs: solo admin/owner de la institución puede CRUD
CREATE POLICY "style_packs_select"
  ON image_style_packs FOR SELECT
  USING (
    institution_id IN (
      SELECT institution_id FROM institution_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "style_packs_insert"
  ON image_style_packs FOR INSERT
  WITH CHECK (
    institution_id IN (
      SELECT institution_id FROM institution_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "style_packs_update"
  ON image_style_packs FOR UPDATE
  USING (
    institution_id IN (
      SELECT institution_id FROM institution_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "style_packs_delete"
  ON image_style_packs FOR DELETE
  USING (
    institution_id IN (
      SELECT institution_id FROM institution_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Prompt Templates: global readable, institution-specific editable por admin
CREATE POLICY "prompt_templates_select"
  ON image_prompt_templates FOR SELECT
  USING (
    institution_id IS NULL  -- Globales: visibles para todos
    OR institution_id IN (
      SELECT institution_id FROM institution_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "prompt_templates_manage"
  ON image_prompt_templates FOR ALL
  USING (
    institution_id IS NOT NULL
    AND institution_id IN (
      SELECT institution_id FROM institution_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'professor')
    )
  );

-- Generation Log: visible por admin/professor de la institución
CREATE POLICY "gen_log_select"
  ON image_generation_log FOR SELECT
  USING (
    institution_id IN (
      SELECT institution_id FROM institution_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'professor')
    )
  );

-- Insert: solo via service role (backend)
CREATE POLICY "gen_log_insert"
  ON image_generation_log FOR INSERT
  WITH CHECK (true);
  -- Backend usa service_role key, no necesita RLS para insert

-- ═══════════════════════════════════════════════════════
-- STORAGE BUCKET + POLICIES
-- ═══════════════════════════════════════════════════════

-- Crear bucket (ejecutar via Dashboard o API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('flashcard-images', 'flashcard-images', true);

-- Storage RLS: leer = cualquier miembro de la institución
-- La estructura es: flashcard-images/{institution_id}/{flashcard_id}/original.png
CREATE POLICY "flashcard_images_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'flashcard-images'
    AND (storage.foldername(name))[1] IN (
      SELECT institution_id::text FROM institution_members
      WHERE user_id = auth.uid()
    )
  );

-- Storage RLS: subir/modificar = profesor o admin de la institución
CREATE POLICY "flashcard_images_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'flashcard-images'
    AND (storage.foldername(name))[1] IN (
      SELECT institution_id::text FROM institution_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'professor')
    )
  );

CREATE POLICY "flashcard_images_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'flashcard-images'
    AND (storage.foldername(name))[1] IN (
      SELECT institution_id::text FROM institution_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'professor')
    )
  );

CREATE POLICY "flashcard_images_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'flashcard-images'
    AND (storage.foldername(name))[1] IN (
      SELECT institution_id::text FROM institution_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'professor')
    )
  );
```

---

## 4. Frontend: React component para flashcards con imagen (v2)

```tsx
// src/app/components/content/flashcard/FlashcardImage.tsx

import { useState } from "react";
import { ImageOff, RefreshCw, Loader2 } from "lucide-react";

// ═══════════════════════════════════════════════════════
// Helper: generar URLs con Supabase Image Transformations
// ═══════════════════════════════════════════════════════
function getTransformedUrl(
  baseUrl: string,
  opts: { width: number; quality: number; format: "avif" | "webp" }
): string {
  return `${baseUrl}?width=${opts.width}&quality=${opts.quality}&format=${opts.format}`;
}

interface FlashcardImageProps {
  imageUrl: string | null;      // URL base del PNG original en Storage
  alt: string;
  loading?: "lazy" | "eager";
  size?: "thumb" | "full";
  className?: string;
  onRegenerate?: () => void;    // Solo para profesor
  isRegenerating?: boolean;
}

export function FlashcardImage({
  imageUrl,
  alt,
  loading = "lazy",
  size = "full",
  className = "",
  onRegenerate,
  isRegenerating = false,
}: FlashcardImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sin imagen — mostrar botón de generar (profesor) o nada (estudiante)
  if (!imageUrl) {
    return onRegenerate ? (
      <button
        onClick={onRegenerate}
        disabled={isRegenerating}
        className="w-full h-40 rounded-xl border-2 border-dashed border-teal-300
                   bg-teal-50/50 flex flex-col items-center justify-center gap-2
                   hover:bg-teal-50 transition-colors cursor-pointer"
      >
        {isRegenerating ? (
          <Loader2 size={24} className="text-teal-500 animate-spin" />
        ) : (
          <ImageOff size={24} className="text-teal-400" />
        )}
        <span className="text-sm text-teal-600 font-medium">
          {isRegenerating ? "Generando imagen..." : "Generar imagen con IA"}
        </span>
      </button>
    ) : null;
  }

  // Generar URLs transformadas on-demand
  const width = size === "thumb" ? 200 : 800;
  const avifUrl = getTransformedUrl(imageUrl, {
    width,
    quality: size === "thumb" ? 60 : 80,
    format: "avif",
  });
  const webpUrl = getTransformedUrl(imageUrl, {
    width,
    quality: size === "thumb" ? 70 : 85,
    format: "webp",
  });

  if (hasError) {
    return (
      <div className="w-full h-40 rounded-xl bg-gray-100 flex items-center
                      justify-center text-gray-400">
        <ImageOff size={20} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {/* Skeleton mientras carga */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-xl" />
      )}

      {/* <picture> con AVIF preferido + WebP fallback */}
      <picture>
        <source srcSet={avifUrl} type="image/avif" />
        <source srcSet={webpUrl} type="image/webp" />
        {/* Fallback: WebP (funciona en todos los browsers modernos) */}
        <img
          src={webpUrl}
          alt={alt}
          loading={loading}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-auto object-contain transition-opacity duration-300
                     ${isLoaded ? "opacity-100" : "opacity-0"}`}
        />
      </picture>

      {/* Botón regenerar (solo profesor) */}
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80
                     backdrop-blur-sm border border-gray-200 hover:bg-white
                     transition-colors"
          title="Regenerar imagen"
        >
          <RefreshCw
            size={14}
            className={`text-gray-600 ${isRegenerating ? "animate-spin" : ""}`}
          />
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// USO EN FlashcardCard.tsx (estudiante)
// ═══════════════════════════════════════════════════════
/*
<FlashcardImage
  imageUrl={flashcard.image_url}
  alt={flashcard.question}
  loading="lazy"
  size="full"
/>
*/

// ═══════════════════════════════════════════════════════
// USO EN FlashcardsManager.tsx (profesor — grid con thumbnails)
// ═══════════════════════════════════════════════════════
/*
<FlashcardImage
  imageUrl={flashcard.image_url}
  alt={flashcard.question}
  size="thumb"
  onRegenerate={() => handleRegenerate(flashcard.id)}
  isRegenerating={regeneratingId === flashcard.id}
/>
*/
```

---

## 5. Resumen de arquitectura (v2)

```
┌────────────────────────────────────────────────────────┐
│                    GENERACIÓN                          │
│                                                        │
│  Profesor → "Generar flashcard con imagen"              │
│       │                                                │
│       ├── Claude 3.5 Sonnet → texto médico preciso     │
│       └── Gemini Nano Banana 2 → imagen PNG            │
│               ↓                                        │
│       Upload directo: PNG original → Supabase Storage  │
│       (SIN conversión server-side — zero dependencias) │
│               ↓                                        │
│       DB: flashcards.image_url (URL base)              │
├────────────────────────────────────────────────────────┤
│                    DELIVERY (on-demand)                │
│                                                        │
│  Estudiante abre flashcard                             │
│       │                                                │
│       └── Frontend pide via <picture>:                 │
│           ├── AVIF: {url}?format=avif&w=800&q=80      │
│           │   → Supabase transforma + CDN cache        │
│           │   → ~60KB al browser (94%+ browsers)       │
│           │                                            │
│           └── WebP: {url}?format=webp&w=800&q=85      │
│               → fallback para browsers sin AVIF (6%)   │
│               → ~100KB al browser                      │
│                                                        │
│  ⚡ Primera request: ~200ms (transform). Cache: 0ms.   │
├────────────────────────────────────────────────────────┤
│                    COSTOS                              │
│                                                        │
│  Generación:  $0.039/imagen (realtime)                 │
│               $0.0195/imagen (batch 50% off)           │
│  Storage:     $0.021/GB/mes (40GB a 50K = $0.84/mes)  │
│  Transforms:  Facturado por imagen única (cache free)  │
│  CDN:         Incluido en Supabase Pro                 │
│  Total 5K flashcards: ~$200 gen + $0.17 storage/mes   │
├────────────────────────────────────────────────────────┤
│                    VENTAJAS v2                         │
│                                                        │
│  ✅ Zero dependencias extra (no Sharp, no binarios)    │
│  ✅ Deploy más simple y rápido                         │
│  ✅ PNG original preservado para re-procesamiento      │
│  ✅ Cuando Supabase lance AVIF auto-detect, beneficio  │
│     automático sin cambios de código                   │
│  ✅ Cambiar quality/width = cambiar URL, no re-generar │
│  ✅ Menos código = menos bugs                          │
└────────────────────────────────────────────────────────┘
```
