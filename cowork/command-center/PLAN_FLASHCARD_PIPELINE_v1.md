# Plan: Flashcard Pipeline — Bug Fixes + Gemini Images

> Estado: 2026-03-27 | Pegar en Claude Code CLI desde `C:\dev\axon\frontend`
> Referencia: `SPEC_FLASHCARD_IMAGES_PIPELINE.md`, `PROMPT_FIX_FLASHCARD_GENERATION.md`, `ESTRATEGIA_AI_GEMINI_CLAUDE.md`

## Estrategia de branches

| Oleada | Branch | Motivo |
|--------|--------|--------|
| A (bug fixes) | `fix/flashcard-generation-bugs` | Hotfix independiente — mergear rápido, desbloquea generación actual |
| B + C (feature) | `feat/flashcard-image-pipeline` | Feature nueva con scope propio — DB migration + Gemini + componente |

**Razón de la separación:**
- Los bugs están rompiendo funcionalidad existente → PR pequeño, review rápido, merge urgente
- La feature de imágenes es trabajo nuevo → PR más grande, puede esperar review completo
- Si la feature tiene problemas, no bloquea el merge de los fixes
- Dos PRs chicos se reviewean mejor que uno gigante

**Orden de ejecución:**
1. `fix/flashcard-generation-bugs` → PR → merge a main
2. `feat/flashcard-image-pipeline` (desde main post-merge) → PR → merge a main

---

## Setup

```
Eres XX-01 (Arquitecto). Lee AGENT-REGISTRY.md, project_current_state.md y feedback_agent_isolation.md.

Ejecuta este plan en 2 sesiones separadas:
  Sesión 1: Oleada A en branch fix/flashcard-generation-bugs (desde main)
  Sesión 2: Oleadas B+C en branch feat/flashcard-image-pipeline (desde main, DESPUÉS de mergear Sesión 1)
```

---

## SESIÓN 1: Oleada A — Fix Bugs Críticos de Generación

> Branch: `fix/flashcard-generation-bugs` desde `main`
> Impacto: ★★★★★ | Esfuerzo: Bajo
> DEBE mergearse ANTES de iniciar Sesión 2

### Agentes

| Agent | ID | Tarea | Archivos |
|-------|----|-------|----------|
| infra-ui | IF-05 | Bug 1: ensureGeneralKeyword() corrompe DB | `src/app/lib/api.ts` (~línea 288) |
| flashcards-frontend | FC-01 | Bug 2: FlashcardFormModal .id sobre string | `src/app/components/professor/FlashcardFormModal.tsx` (~línea 256) |
| flashcards-keywords | FC-05 | Bugs 3+4: MasteryLevel + KeywordCollection unificar tipos | `src/app/types/keywords.ts`, `legacy-stubs.ts`, `hooks/useKeywordMastery.ts`, `services/aiFlashcardGenerator.ts` |
| flashcards-generation | FC-06 | Bug 5: Dead exports en adaptiveGenerationApi | `src/app/services/adaptiveGenerationApi.ts` |
| quality-gate | XX-02 | Auditoría post-fix | — |

### Fases

```
Fase 1 (investigación): IF-05 verifica qué retorna GET /keywords?summary_id=xxx
         → ¿Array o paginado {items, total, limit, offset}?
Fase 2 (paralelo): IF-05 + FC-01 + FC-05 + FC-06 (archivos sin overlap)
Fase 3: XX-02 quality-gate
```

### Detalle de bugs

**Bug 1 (CRÍTICO) — IF-05:**
- `ensureGeneralKeyword()` en `api.ts:~288` hace GET → espera `KeywordRow[]` pero backend retorna `{ items, total, limit, offset }`
- `.find()` sobre objeto paginado → siempre undefined → SIEMPRE crea keyword "General" duplicado
- Fix: `.items.find()` o usar `extractItems()` si existe
- Validación: `SELECT count(*) FROM keywords WHERE term = 'General' GROUP BY summary_id HAVING count(*) > 1` debe dar 0 rows
- Ref: BH-ERR-019

**Bug 2 (MEDIO) — FC-01:**
- `FlashcardFormModal.tsx:~256` llama `(await ensureGeneralKeyword(summaryId)).id`
- Pero `ensureGeneralKeyword()` retorna string, no objeto. `.id` = undefined
- Fix: usar el retorno directamente sin `.id`
- Ref: BH-ERR-033

**Bug 3 (MEDIO) — FC-05:**
- MasteryLevel definido 3 veces diferente:
  - `types/keywords.ts` → `'red'|'yellow'|'green'`
  - `legacy-stubs.ts` → `'none'|'seen'|'learning'|'familiar'|'mastered'`
  - `hooks/useKeywordMastery.ts` → `DeltaColorLevel` alias
- Fix: UN tipo canónico en `keywords.ts`, los demás importan de ahí
- Ref: BH-ERR-021

**Bug 4 (BAJO) — FC-05:**
- `KeywordCollection`: `aiFlashcardGenerator.ts:15` usa `Record<string, KeywordState>`, `types/keywords.ts:29` usa `Record<string, KeywordData>`
- Fix: unificar tipo
- Ref: BH-ERR-024

**Bug 5 (BAJO) — FC-06:**
- `adaptiveGenerationApi.ts` exporta `MAX_CONCURRENT_GENERATIONS`, `RECOMMENDED_MAX_BATCH`, `SmartMetadata` que nadie importa
- Fix: eliminar dead exports
- Ref: BH-ERR-032

---

## SESIÓN 2: Oleadas B + C — Image Pipeline Completo

> Branch: `feat/flashcard-image-pipeline` desde `main` (post-merge de Sesión 1)
> Prerequisito: Oleada A mergeada + `GEMINI_API_KEY` en Supabase Vault/secrets

### Oleada B — Backend: Image Generation Service + DB Migration

> Impacto: ★★★★★ | Esfuerzo: Medio

### Agentes

| Agent | ID | Tarea | Archivos nuevos |
|-------|----|-------|----------------|
| flashcards-backend | FC-02 | Servicio de generación de imágenes + ruta API | `supabase/functions/server/services/flashcard-image-generator.ts` (NUEVO), `supabase/functions/server/routes/content/flashcard-images.ts` (NUEVO) |
| ai-backend | AI-05 | Integración Gemini API + prompt templates | `supabase/functions/server/services/gemini-image-client.ts` (NUEVO) |
| quality-gate | XX-02 | Auditoría | — |

### Fases

```
Fase 1: FC-02 ejecuta migración SQL (via Supabase MCP o manual)
        → ALTER TABLE flashcards + CREATE TABLE image_style_packs, image_prompt_templates, image_generation_log
        → RLS policies + Storage bucket
Fase 2 (paralelo): AI-05 (Gemini client) + FC-02 (servicio + ruta)
Fase 3: Integración AI-05 → FC-02 (el servicio usa el Gemini client)
Fase 4: XX-02 quality-gate
```

### Spec del servicio (FC-02)

**Ruta API:**
```
POST /content/flashcards/:id/generate-image
Body: { imagePrompt?: string, stylePackId?: string }
Response: { image_url: string, model: string }
```

**Pipeline (simplificado v2 — SIN Sharp):**
1. Recibe request del profesor
2. Busca prompt template por categoría del flashcard (o usa imagePrompt custom)
3. Si hay stylePackId → busca reference_images del style pack
4. Llama Gemini API → recibe PNG base64
5. Decodifica base64 → sube PNG original a Supabase Storage (`flashcard-images/{institution_id}/{flashcard_id}/original.png`)
6. Guarda URL base en `flashcards.image_url`
7. Registra en `image_generation_log` (costo, modelo, prompt, duración)

**Importante:** NO se convierte a AVIF/WebP en backend. Supabase Image Transformations lo hace on-demand en el CDN con `?format=avif&quality=80&width=800`.

### Spec del Gemini client (AI-05)

```typescript
// supabase/functions/server/services/gemini-image-client.ts

interface GeminiImageRequest {
  prompt: string;
  referenceImages?: Uint8Array[];  // Para style transfer
  temperature?: number;            // Default 0.4
}

interface GeminiImageResponse {
  imageBuffer: Uint8Array;         // PNG
  mimeType: string;
}

export async function generateImage(request: GeminiImageRequest): Promise<GeminiImageResponse>
```

- Modelo: `gemini-3.1-flash-image-preview`
- `responseModalities: ["TEXT", "IMAGE"]`
- API key: `Deno.env.get("GEMINI_API_KEY")`
- Manejo de errores: retry 1x en 429 (rate limit), throw en otros

### Migración SQL

Ejecutar la migración completa de `SPEC_FLASHCARD_IMAGES_PIPELINE.md` sección 3:
- ALTER TABLE flashcards: `image_url`, `image_prompt`, `image_model`, `image_generated_at`
- CREATE TABLE: `image_style_packs`, `image_prompt_templates`, `image_generation_log`
- INSERT 6 prompt templates globales (anatomy, pharmacology, pathology, physiology, microbiology, general)
- RLS policies para todas las tablas nuevas
- Storage bucket `flashcard-images` con policies

---

### Oleada C — Frontend: Componente de Imagen + Integración

> Impacto: ★★★★☆ | Esfuerzo: Bajo-Medio
> Prerequisito: Oleada B (API disponible)

### Agentes

| Agent | ID | Tarea | Archivos |
|-------|----|-------|----------|
| flashcards-frontend | FC-01 | FlashcardImage component + integración en FlashcardCard y FlashcardsManager | `src/app/components/content/flashcard/FlashcardImage.tsx` (NUEVO), modificar `FlashcardCard.tsx`, `FlashcardsManager.tsx` |
| flashcards-generation | FC-06 | Hook useFlashcardImage + botón generar en SmartFlashcardGenerator | `src/app/hooks/useFlashcardImage.ts` (NUEVO), modificar `SmartFlashcardGenerator.tsx`, `AiGeneratePanel.tsx` |
| quality-gate | XX-02 | Auditoría | — |

### Fases

```
Fase 1 (paralelo): FC-01 (componente visual) + FC-06 (hook + mutation)
Fase 2: FC-01 integra hook de FC-06 en los componentes de flashcard
Fase 3: XX-02 quality-gate
```

### Spec FlashcardImage.tsx (FC-01)

Component completo en `SPEC_FLASHCARD_IMAGES_PIPELINE.md` sección 4. Resumen:
- Props: `{ imageUrl, alt, loading, size, className, onRegenerate, isRegenerating }`
- Usa `<picture>` con 2 `<source>`:
  - AVIF: `{imageUrl}?format=avif&quality=80&width=800`
  - WebP: `{imageUrl}?format=webp&quality=85&width=800`
- Para `size="thumb"`: width=200, quality más bajo
- Skeleton loader mientras carga
- Botón regenerar (solo visible para rol profesor)
- Estado vacío: botón "Generar imagen con IA" (solo profesor)
- Iconos: lucide-react (ImageOff, RefreshCw, Loader2)

### Spec useFlashcardImage.ts (FC-06)

```typescript
// src/app/hooks/useFlashcardImage.ts

interface UseFlashcardImageReturn {
  generateImage: (flashcardId: string, opts?: { imagePrompt?: string; stylePackId?: string }) => Promise<void>;
  isGenerating: boolean;
  error: string | null;
}

export function useFlashcardImage(): UseFlashcardImageReturn
```

- Usa React Query mutation
- Llama `POST /content/flashcards/:id/generate-image`
- Invalida query de flashcard al completar (para que FlashcardCard re-render con imagen)
- Toast de éxito/error

### Integración en SmartFlashcardGenerator.tsx (FC-06)

- Agregar checkbox/toggle: "Generar con imagen" (default: off)
- Si activado, después de crear flashcard con texto, llama `generateImage(flashcardId)`
- Mostrar progreso: "Generando texto... ✓ → Generando imagen... ✓"

### Integración en FlashcardsManager.tsx (FC-01)

- En el grid de flashcards, mostrar thumbnail si existe: `<FlashcardImage size="thumb" />`
- Botón "Generar imagen" en el menú contextual de cada flashcard que no tenga imagen

---

## Resumen ejecutivo

| Sesión | Oleada | Branch | Features | Agentes | Esfuerzo |
|--------|--------|--------|----------|---------|----------|
| 1 | A | `fix/flashcard-generation-bugs` | Fix 5 bugs de generación | IF-05, FC-01, FC-05, FC-06, XX-02 | Bajo |
| 2 | B | `feat/flashcard-image-pipeline` | Gemini image service + DB migration | FC-02, AI-05, XX-02 | Medio |
| 2 | C | `feat/flashcard-image-pipeline` | FlashcardImage component + integración | FC-01, FC-06, XX-02 | Bajo-Medio |

**Total:** 2 sesiones CLI, 2 PRs, 6 agentes únicos.

---

## Validación final (post todas las oleadas)

```bash
# 1. Build limpio
npm run build  # 0 errores TypeScript

# 2. Tests
npm run test   # Flashcard tests pasan

# 3. Bug 1 validación (en Supabase SQL Editor)
SELECT summary_id, count(*) FROM keywords WHERE term = 'General'
GROUP BY summary_id HAVING count(*) > 1;
-- Debe retornar 0 rows

# 4. Verificar servicio de imágenes (manual o via Postman)
# POST /content/flashcards/{id}/generate-image
# → Debe retornar { image_url: "https://...supabase.co/storage/v1/object/public/flashcard-images/..." }

# 5. Verificar transformaciones
# GET {image_url}?format=avif&width=800&quality=80
# → Debe retornar imagen AVIF
# GET {image_url}?format=webp&width=800&quality=85
# → Debe retornar imagen WebP
```

---

## Prompts para el Arquitecto

### Sesión 1: Bug fixes (copiar y pegar en Claude Code CLI)

```
Eres XX-01 (Arquitecto). Lee AGENT-REGISTRY.md y project_current_state.md.

git checkout main && git pull origin main
git checkout -b fix/flashcard-generation-bugs main

Ejecuta la Oleada A del plan PLAN_FLASHCARD_PIPELINE_v1.md:
- 5 bugs de generación de flashcards (BH-ERR-019, 033, 021, 024, 032)
- Agentes: IF-05, FC-01, FC-05, FC-06 en paralelo → XX-02 quality-gate

Fases:
1. IF-05 investiga qué retorna GET /keywords?summary_id=xxx (¿array o paginado?)
2. Paralelo: IF-05 (api.ts), FC-01 (FlashcardFormModal), FC-05 (tipos), FC-06 (dead exports)
3. XX-02 quality-gate

Al terminar: npm run build (0 errors), commit, git push -u origin fix/flashcard-generation-bugs.
```

### Sesión 2: Image pipeline (ejecutar DESPUÉS de mergear Sesión 1)

```
Eres XX-01 (Arquitecto). Lee AGENT-REGISTRY.md y project_current_state.md.

git checkout main && git pull origin main
git checkout -b feat/flashcard-image-pipeline main

Ejecuta Oleadas B+C del plan PLAN_FLASHCARD_PIPELINE_v1.md:

Oleada B (backend):
- FC-02: migración SQL + servicio flashcard-image-generator + ruta API
- AI-05: Gemini client (gemini-image-client.ts)
- XX-02: quality-gate

Oleada C (frontend):
- FC-01: FlashcardImage.tsx component + integrar en FlashcardCard y FlashcardsManager
- FC-06: useFlashcardImage hook + toggle en SmartFlashcardGenerator
- XX-02: quality-gate

Referencia técnica: SPEC_FLASHCARD_IMAGES_PIPELINE.md (v2 — sin Sharp, Supabase Image Transformations on-demand).

Al terminar: npm run build (0 errors), commit, git push -u origin feat/flashcard-image-pipeline.
```
