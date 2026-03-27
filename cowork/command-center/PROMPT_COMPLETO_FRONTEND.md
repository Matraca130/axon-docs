# PROMPT COMPLETO: Frontend — Tests + Implementación (Fase 2)

> **Uso:** Copiar TODO este prompt en Claude Code CLI → `/loop`
> **Branch:** `feat/block-based-summaries` desde `main`
> **Repo:** `C:\dev\axon\frontend`
> **Tiempo total:** ~3-4h (tests ~1h + implementación ~2-3h)
> **La memoria se resetea cada ~10 min.** El archivo PROGRESS.md te dice dónde vas.

---

## 🚨 REGLA ABSOLUTA: JAMÁS TRABAJAR EN MAIN 🚨

**Antes de escribir UNA SOLA LÍNEA de código, verificar la branch:**

```bash
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  echo "❌ ABORT: Estás en $CURRENT_BRANCH — PROHIBIDO. Cambiando a feature branch..."
  git checkout feat/block-based-summaries 2>/dev/null || git checkout -b feat/block-based-summaries main
fi
echo "✅ Branch segura: $(git branch --show-current)"
```

**Si por CUALQUIER razón estás en main → cambia a `feat/block-based-summaries` ANTES de hacer nada.**
**NUNCA hacer commit, push, ni editar archivos estando en main.**

---

## REGLA #1: SIEMPRE EMPIEZA AQUÍ

Cada vez que despiertes (nuevo ciclo), ejecuta esto PRIMERO:

```bash
# 1. Verificar branch (NUNCA main)
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  git checkout feat/block-based-summaries 2>/dev/null || git checkout -b feat/block-based-summaries main
fi

# 2. Leer progreso
cat PROGRESS.md 2>/dev/null || echo "FRESH_START"
```

- Si dice `FRESH_START` → ve a INICIALIZACIÓN
- Si dice una task → continúa desde esa task
- Si dice `ALL_COMPLETE` → no hagas nada, responde "✅ Fase 2 completa"

---

## INICIALIZACIÓN (solo la primera vez)

```bash
cd C:\dev\axon\frontend
git pull origin main
git checkout -b feat/block-based-summaries main 2>/dev/null || git checkout feat/block-based-summaries
npm install
```

Leer para contexto:
- `CLAUDE.md` (reglas del repo)
- `src/app/services/summariesApi.ts` (types existentes, entender cómo usa `apiCall`)
- `src/app/components/student/ViewerBlock.tsx` (switch actual de renderers)
- Buscar tests existentes: `find src -name "*.test.*" -type f | head -5` para copiar el pattern

**Crear archivos de referencia** (ver sección REFERENCIA DE DISEÑO más abajo):
```bash
mkdir -p .ref
# Copiar prototipo y crear DESIGN_TOKENS.md y block-schema.json — ver instrucciones completas en REFERENCIA DE DISEÑO
```
**⚠️ IMPORTANTE:** Antes de crear PROGRESS.md, ejecuta TODOS los pasos de la sección "REFERENCIA DE DISEÑO" que está justo después.

Crear PROGRESS.md:
```bash
cat > PROGRESS.md << 'EOF'
# Fase 2 — Frontend Block Renderers
## Current: TASK_1
## Phase: TESTS
## Tasks:
- TASK_1: PENDING — test-utils + fixtures
- TASK_2: PENDING — 10 renderer test files
- TASK_3: PENDING — ViewerBlock integration test
- TASK_4: PENDING — verify tests fail (red)
- TASK_5: PENDING — Types en summariesApi.ts
- TASK_6: PENDING — 10 renderers + barrel
- TASK_7: PENDING — Integrar en ViewerBlock.tsx
- TASK_8: PENDING — SummaryViewer.tsx wrapper
- TASK_9: PENDING — npm run build + tests pass (green)
- TASK_10: PENDING — Commit + push
EOF
```

---

## CÓMO ACTUALIZAR PROGRESS

Después de completar cada task:
```bash
sed -i 's/TASK_N: PENDING/TASK_N: DONE/' PROGRESS.md
sed -i 's/Current: TASK_N/Current: TASK_M/' PROGRESS.md
```
(Reemplaza N y M con los números correctos)

---

## REFERENCIA DE DISEÑO (leer antes de implementar)

### Paso de Inicialización: Crear archivos de referencia en el repo

```bash
mkdir -p .ref
```

### Copiar el prototipo al repo como referencia

**ESTE ES EL ARCHIVO MÁS IMPORTANTE.** Contiene la implementación exacta de cada renderer con inline styles.
Tu trabajo en TASK_6 es leer este archivo, localizar cada renderer (ProseBlock, KeyPointBlock, etc.)
y convertir los inline styles a Tailwind v4 classes manteniendo los MISMOS valores visuales exactos.

```bash
# Intentar copiar (rutas Windows — funciona en PowerShell y Git Bash)
cp "C:/Users/petri/OneDrive/Escritorio/AXON PROJECTO/PROJETO DESAROLLO RESUMEN/Prototipo_Resumenes_Axon_FINAL.jsx" .ref/PROTOTYPE.jsx 2>/dev/null || \
cp "C:\Users\petri\OneDrive\Escritorio\AXON PROJECTO\PROJETO DESAROLLO RESUMEN\Prototipo_Resumenes_Axon_FINAL.jsx" .ref/PROTOTYPE.jsx 2>/dev/null

# Verificar que se copió
if [ ! -f .ref/PROTOTYPE.jsx ]; then
  echo "⚠️ No se encontró el prototipo. Buscando..."
  find "C:/Users/petri/OneDrive" -name "Prototipo_Resumenes_Axon_FINAL.jsx" 2>/dev/null | head -1 | xargs -I{} cp "{}" .ref/PROTOTYPE.jsx
fi

# Validar
test -f .ref/PROTOTYPE.jsx && echo "✅ PROTOTYPE.jsx copiado" || echo "❌ ERROR: No se pudo copiar el prototipo — buscar manualmente"
```

**Secciones clave del prototipo que debes leer:**
- Líneas 1-60: Design tokens (LIGHT, DARK, CALLOUT, CALLOUT_DARK, SEVERITY)
- Líneas 208-213: IconByName helper (mapa ícono-nombre → componente Lucide)
- Líneas 215-368: 8 renderers (ProseBlock → CalloutBlock)
- Líneas 373-480: ImageReferenceBlock (incluye editor features — solo tomar el READ-ONLY view)
- Líneas 586-594: SectionDividerBlock (está DESPUÉS de ResizableImage, no olvidar)

### Crear `.ref/DESIGN_TOKENS.md` — Tabla rápida de conversión inline→Tailwind

```bash
cat > .ref/DESIGN_TOKENS.md << 'TOKENS_EOF'
# Conversión de Design Tokens: Inline Style → Tailwind v4

## Colores (Light / Dark)
| Inline Style value | Tailwind Light | Tailwind Dark |
|---|---|---|
| theme.darkTeal (#1B3B36 / #3cc9a8) | text-teal-900 | dark:text-teal-400 |
| theme.tealAccent (#2a8c7a / #3cc9a8) | text-teal-600 | dark:text-teal-400 |
| theme.teal50 (#e8f5f1 / #1a2e2a) | bg-teal-50 | dark:bg-teal-950 |
| theme.teal100 (#d1f0e7 / #1f3b35) | bg-teal-100 | dark:bg-teal-900/50 |
| theme.pageBg (#F0F2F5 / #111215) | bg-gray-100 | dark:bg-gray-950 |
| theme.cardBg (#FFFFFF / #1e1f25) | bg-white | dark:bg-gray-800 |
| theme.headerBg (#1B3B36 / #0d0e11) | bg-teal-900 | dark:bg-gray-950 |
| theme.textPrimary (#111827 / #e6e7eb) | text-gray-900 | dark:text-gray-200 |
| theme.textSecondary (#6b7280 / #9ca3af) | text-gray-500 | dark:text-gray-400 |
| theme.textTertiary (#9CA3AF / #6b7280) | text-gray-400 | dark:text-gray-500 |
| theme.border (#E5E7EB / #2d2e34) | border-gray-200 | dark:border-gray-700 |

## Tipografía
| Inline | Tailwind |
|---|---|
| fontFamily: "Georgia, serif" | font-serif |
| fontSize: 20, fontWeight: 700 | text-xl font-bold |
| fontSize: 17, fontWeight: 700 | text-[17px] font-bold |
| fontSize: 16, fontWeight: 700 | text-base font-bold |
| fontSize: 15 | text-[15px] |
| fontSize: 14 | text-sm |
| fontSize: 13 | text-[13px] |
| fontSize: 12 | text-xs |
| fontSize: 11 | text-[11px] |
| fontSize: 10 | text-[10px] |
| lineHeight: 1.75 | leading-[1.75] |
| lineHeight: 1.7 | leading-[1.7] |
| lineHeight: 1.6 | leading-[1.6] |
| lineHeight: 1.5 | leading-normal (=1.5, exacto) |

## Espaciado
| Inline | Tailwind |
|---|---|
| padding: "20px 24px" | px-6 py-5 |
| padding: "16px 20px" | px-5 py-4 |
| padding: "14px 16px" | px-4 py-3.5 |
| padding: "12px 16px" | px-4 py-3 |
| padding: "8px 12px" | px-3 py-2 |
| padding: "2px 8px" | px-2 py-0.5 |
| gap: 16 | gap-4 |
| gap: 12 | gap-3 |
| gap: 10 | gap-2.5 |
| gap: 8 | gap-2 |
| gap: 6 | gap-1.5 |
| marginBottom: 16 | mb-4 |
| marginBottom: 12 | mb-3 |
| marginBottom: 10 | mb-2.5 |
| marginBottom: 8 | mb-2 |
| marginBottom: 6 | mb-1.5 |
| marginBottom: 4 | mb-1 |

## Bordes y Redondeo
| Inline | Tailwind |
|---|---|
| borderRadius: 12 | rounded-xl |
| borderRadius: 10 | rounded-[10px] |
| borderRadius: 8 | rounded-lg |
| borderRadius: "50%" | rounded-full |
| border: "1px solid " + theme.border | border border-gray-200 dark:border-gray-700 |
| borderLeft: "4px solid X" | border-l-4 border-l-[color] |
| borderLeft: "3px solid X" | border-l-[3px] border-l-[color] |

## CalloutBlock Variants (con Tailwind arbitrario)
| Variant | Light bg | Light border | Light accent | Dark bg | Dark border | Dark accent |
|---|---|---|---|---|---|---|
| tip | bg-[#f0fdf4] | border-l-emerald-500 | text-[#065f46] | dark:bg-[#0f2a1d] | dark:border-l-emerald-500 | dark:text-emerald-300 |
| warning | bg-[#fffbeb] | border-l-amber-500 | text-[#92400e] | dark:bg-[#2a2010] | dark:border-l-amber-500 | dark:text-amber-300 |
| clinical | bg-[#eff6ff] | border-l-blue-500 | text-[#1e40af] | dark:bg-[#0f1a2e] | dark:border-l-blue-500 | dark:text-blue-300 |
| mnemonic | bg-[#f5f3ff] | border-l-violet-500 | text-[#5b21b6] | dark:bg-[#1a1530] | dark:border-l-violet-500 | dark:text-violet-300 |
| exam | bg-[#fef2f2] | border-l-red-500 | text-[#b91c1c] | dark:bg-[#2a1215] | dark:border-l-red-500 | dark:text-red-300 |

## Severity → Color mapping
| Severity | Color | Tailwind |
|---|---|---|
| mild | #10b981 | bg-emerald-500 |
| moderate | #f59e0b | bg-amber-500 |
| critical | #ef4444 | bg-red-500 |

## ListDetailBlock Severity Badge
| Severity | bg | text |
|---|---|---|
| high | bg-red-50 (#fef2f2) | text-red-600 (#dc2626) |
| medium | bg-amber-50 (#fffbeb) | text-amber-600 (#d97706) |
| low | bg-green-50 (#f0fdf4) | text-green-600 (#059669) |
TOKENS_EOF
```

### Crear `.ref/block-schema.json` (schema canónico de los 10 tipos)

```bash
cat > .ref/block-schema.json << 'SCHEMA_EOF'
{
  "title": "Axon Summary Block Schema v1.0",
  "block_types": {
    "prose": { "required": ["type","title","content"], "fields": { "title": "string", "content": "string (supports {{keyword_id}})", "image": "optional {url,position,size,caption}" } },
    "key_point": { "required": ["type","title","content","importance"], "fields": { "title": "string", "content": "string", "importance": "enum: high|critical" } },
    "stages": { "required": ["type","title","items"], "fields": { "title": "string", "items": "array of {stage:int, title:string, content:string, severity?:mild|moderate|critical|null}" } },
    "comparison": { "required": ["type","title","headers","rows"], "fields": { "title": "string", "headers": "string[]", "rows": "string[][]", "highlight_column": "int|null (0-based)" } },
    "list_detail": { "required": ["type","title","items"], "fields": { "title": "string", "intro": "string|null", "items": "array of {label:string, detail:string, icon:LucideIcon, severity?:high|medium|low|null}" } },
    "grid": { "required": ["type","title","columns","items"], "fields": { "title": "string", "columns": "2|3", "items": "array of {label:string, detail:string, icon:LucideIcon}" } },
    "two_column": { "required": ["type","columns"], "fields": { "columns": "array[2] of {title:string, items: array of {label:string, detail:string}}" } },
    "callout": { "required": ["type","variant","title","content"], "fields": { "variant": "enum: tip|warning|clinical|mnemonic|exam", "title": "string", "content": "string" } },
    "image_reference": { "required": ["type","description","caption"], "fields": { "description": "string", "caption": "string", "image_url": "string|null" } },
    "section_divider": { "required": ["type"], "fields": { "label": "string|null" } }
  },
  "valid_icons": ["Activity","Heart","Pill","Stethoscope","Shield","FlaskConical","Clock","Lightbulb","Target","AlertCircle","Brain","Info","AlertTriangle","HelpCircle","CheckCircle2","CircleDot"]
}
SCHEMA_EOF
```

Agregar `.ref/` a `.gitignore` para no commitear archivos de referencia:
```bash
echo '.ref/' >> .gitignore
```

---

## ═══════════════════════════════════════
## FASE A: TESTS (TDD Red Phase)
## ═══════════════════════════════════════

### TASK_1: Test utilities + fixtures

Crear `src/app/components/student/blocks/__tests__/test-utils.ts`:

```typescript
import type { SummaryBlock } from '../../../../services/summariesApi';

/** Factory — cada test solo overridea lo que le importa */
export function makeBlock(overrides: Partial<SummaryBlock> & { type: string; content: Record<string, any> }): SummaryBlock {
  return {
    id: crypto.randomUUID(),
    summary_id: crypto.randomUUID(),
    order_index: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as SummaryBlock;
}

/** Fixtures — coinciden con block-schema.json */
export const FIXTURES = {
  prose: { type: 'prose' as const, content: { title: 'Introducción a la Aterosclerosis', content: 'La {{aterosclerosis}} es una enfermedad inflamatoria crónica de las arterias.' } },
  key_point: { type: 'key_point' as const, content: { title: 'Concepto Central', content: 'Proceso inflamatorio activo, no acumulación pasiva de grasa.', importance: 'critical' } },
  key_point_high: { type: 'key_point' as const, content: { title: 'Punto Importante', content: 'El {{endotelio}} regula el tono vascular.', importance: 'high' } },
  stages: { type: 'stages' as const, content: { title: 'Progresión', items: [
    { stage: 1, title: 'Disfunción Endotelial', content: 'Daño al endotelio.', severity: 'mild' },
    { stage: 2, title: 'Estría Grasa', content: 'Acumulación de {{macrofagos}}.', severity: 'moderate' },
    { stage: 3, title: 'Placa Vulnerable', content: 'Capa fibrosa delgada.', severity: 'critical' },
  ] } },
  comparison: { type: 'comparison' as const, content: { title: 'Estable vs Vulnerable', headers: ['Característica', 'Estable', 'Vulnerable'], rows: [['Capa fibrosa', 'Gruesa', 'Delgada'], ['Riesgo', 'Bajo', 'Alto']], highlight_column: 2 } },
  list_detail: { type: 'list_detail' as const, content: { title: 'Factores de Riesgo', intro: 'Principales factores.', items: [
    { icon: 'Heart', label: 'Hipertensión', detail: 'Daño mecánico al endotelio', severity: 'high' },
    { icon: 'Pill', label: 'Dislipidemia', detail: 'LDL elevado', severity: 'high' },
  ] } },
  grid: { type: 'grid' as const, content: { title: 'Mediadores', columns: 3, items: [
    { icon: 'Shield', label: 'TNF-α', detail: 'Citoquina proinflamatoria' },
    { icon: 'Shield', label: 'IL-6', detail: 'Activa fase aguda' },
  ] } },
  two_column: { type: 'two_column' as const, content: { columns: [
    { title: 'Protectores', items: [{ label: 'HDL', detail: 'Transporte reverso' }] },
    { title: 'Riesgo', items: [{ label: 'LDL oxidado', detail: 'Inicia inflamación' }] },
  ] } },
  callout_tip: { type: 'callout' as const, content: { variant: 'tip', title: 'Dato', content: 'El ejercicio aumenta HDL.' } },
  callout_warning: { type: 'callout' as const, content: { variant: 'warning', title: 'Atención', content: 'Síntomas silenciosos.' } },
  callout_clinical: { type: 'callout' as const, content: { variant: 'clinical', title: 'Caso Clínico', content: 'Paciente con dolor precordial.' } },
  callout_mnemonic: { type: 'callout' as const, content: { variant: 'mnemonic', title: 'Mnemotecnia', content: 'ABCDE cardiovascular.' } },
  callout_exam: { type: 'callout' as const, content: { variant: 'exam', title: 'Para el Examen', content: 'Pregunta frecuente.' } },
  image_reference: { type: 'image_reference' as const, content: { description: 'Etapas de la placa', caption: 'Figura 1', image_url: 'https://example.com/placa.png' } },
  image_reference_empty: { type: 'image_reference' as const, content: { description: 'Sin imagen' } },
  section_divider: { type: 'section_divider' as const, content: { label: 'Fisiopatología' } },
  section_divider_empty: { type: 'section_divider' as const, content: {} },
};
```

**NOTA:** Si `SummaryBlock` no existe aún en summariesApi.ts, crea un type temporal en test-utils.ts. Se reemplaza en TASK_5.

Actualizar PROGRESS → `TASK_1: DONE`, Current: TASK_2

---

### TASK_2: 10 renderer test files

Crear tests en `src/app/components/student/blocks/__tests__/` para cada componente.
Usar **Vitest + React Testing Library** (seguir pattern de tests existentes del proyecto).

Cada test file: mínimo 4 tests — smoke render, content correctness, edge case (empty/null), keyword markers.

Archivos a crear:
- `ProseBlock.test.tsx` — title renders, content renders, keyword {{}} preserved, handles empty
- `KeyPointBlock.test.tsx` — dark bg always, CRÍTICO badge, no badge for high, handles empty
- `StagesBlock.test.tsx` — all stages render, stage numbers, handles empty items, keywords
- `ComparisonBlock.test.tsx` — table/thead/tbody semantic, headers, rows, highlight column
- `ListDetailBlock.test.tsx` — items with labels, handles empty items
- `GridBlock.test.tsx` — items render, handles empty
- `TwoColumnBlock.test.tsx` — both columns render, handles single column
- `CalloutBlock.test.tsx` — all 5 variants, default variant, title + content
- `ImageReferenceBlock.test.tsx` — image with src, placeholder without image, caption
- `SectionDividerBlock.test.tsx` — label renders, no label = just line

**Patrón para cada test:**
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import XBlock from '../XBlock';
import { makeBlock, FIXTURES } from './test-utils';

describe('XBlock', () => {
  it('renders content', () => {
    const block = makeBlock(FIXTURES.xxx);
    render(<XBlock block={block} />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });
  // ... más tests
});
```

Actualizar PROGRESS → `TASK_2: DONE`, Current: TASK_3

---

### TASK_3: ViewerBlock integration test

Crear `src/app/components/student/__tests__/ViewerBlock.integration.test.tsx`:

Test que cada block type se rutea al componente correcto sin crash.

Actualizar PROGRESS → `TASK_3: DONE`, Current: TASK_4

---

### TASK_4: Verify tests fail (red phase)

```bash
npx vitest run src/app/components/student/blocks/__tests__/ --reporter=verbose 2>&1 | tail -30
```

- **Expected:** Todo falla (componentes no existen)
- Si hay errores de SINTAXIS en los tests → arreglarlos
- Si fallan por "module not found" → correcto, es el red phase

Actualizar PROGRESS → `TASK_4: DONE`, Current: TASK_5, Phase: IMPLEMENTATION

---

## ═══════════════════════════════════════
## FASE B: IMPLEMENTACIÓN (TDD Green Phase)
## ═══════════════════════════════════════

### QUÉ ESTAMOS HACIENDO (lee esto primero)

**La idea es simple:** el contenido del resumen debe verse igual al prototipo (`.ref/PROTOTYPE.jsx`). Los 10 bloques educativos con su diseño rico — tipografía serif, colores teal, severity indicators, callout variants, tablas semánticas, etc.

**Lo que SÍ cambia:** solo el CONTENIDO del área de resumen. Los renderers de bloques.

**Lo que NO cambia:** el sidebar, la navegación, el header, el layout de la página, el tema general de Axon. Todo lo exterior al resumen se mantiene exactamente como está.

**Cómo funciona:** el código ya está modularizado → `SummaryViewer → ViewerBlock → switch(block.type) → renderer`. Solo agregas los 10 renderers nuevos al switch. Cuando la API devuelva un bloque `type: 'prose'` se renderiza con el diseño nuevo. Los bloques legacy (`text`, `heading`, etc.) siguen funcionando — no se borra nada.

**Máxima calidad visual, cero riesgo.** Copiar el diseño exacto del prototipo, convertirlo a Tailwind, conectarlo al switch existente.

---

### TASK_5: Types en `summariesApi.ts`

Agregar al final de `src/app/services/summariesApi.ts` (NO borrar nada):

```typescript
// ═══ Block-based Summary Types + CRUD (Fase 2) ═══

export type EduBlockType =
  | 'prose' | 'key_point' | 'stages' | 'comparison' | 'list_detail'
  | 'grid' | 'two_column' | 'callout' | 'image_reference' | 'section_divider';

export type LegacyBlockType =
  | 'text' | 'heading' | 'image' | 'video' | 'pdf' | 'divider' | 'keyword-ref';

export interface SummaryBlock {
  id: string;
  summary_id: string;
  type: EduBlockType | LegacyBlockType;
  content: Record<string, any>;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  style?: Record<string, any>;
  metadata?: Record<string, any>;
}

export async function fetchSummaryBlocks(summaryId: string): Promise<SummaryBlock[]> {
  return apiCall<SummaryBlock[]>(`/summary-blocks?summary_id=${summaryId}`);
}

export async function createSummaryBlock(data: {
  summary_id: string; type: string; content: Record<string, any>; order_index?: number;
}): Promise<SummaryBlock> {
  return apiCall<SummaryBlock>('/summary-blocks', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateSummaryBlock(
  id: string, data: Partial<Pick<SummaryBlock, 'type' | 'content' | 'order_index' | 'is_active' | 'style' | 'metadata'>>
): Promise<SummaryBlock> {
  return apiCall<SummaryBlock>(`/summary-blocks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteSummaryBlock(id: string): Promise<void> {
  await apiCall(`/summary-blocks/${id}`, { method: 'DELETE' });
}
```

Actualizar PROGRESS → `TASK_5: DONE`, Current: TASK_6

---

### TASK_6: 10 renderers + barrel export

**PASO CRÍTICO: Lee `.ref/PROTOTYPE.jsx` COMPLETO antes de escribir código.**
Ese archivo contiene la implementación EXACTA de cada renderer con inline styles.
Tu trabajo es convertir cada función a TypeScript + Tailwind v4 classes, manteniendo
los MISMOS valores visuales. Consulta `.ref/DESIGN_TOKENS.md` para la tabla de conversión.

Crear `src/app/components/student/blocks/` con los 10 componentes + index.ts.

**Reglas de conversión prototype → producción:**
1. Lee el renderer en `.ref/PROTOTYPE.jsx`
2. Convierte cada inline style a su equivalente Tailwind v4 usando `.ref/DESIGN_TOKENS.md`
3. Si un valor NO tiene equivalente Tailwind estándar, usa arbitrary values: `text-[17px]`, `rounded-[10px]`, `leading-[1.7]`
4. **NO inventes colores ni espaciados** — copia los EXACTOS del prototipo
5. Cada componente: `export default function XBlock({ block }: { block: SummaryBlock })`
6. Acceso a content: `block.content.title`, `block.content.items`, etc. (content es el JSONB)
7. Keywords `{{keyword}}` → emitir como texto plano (TreeWalker existente los procesa)
8. Lucide icons → `import { Zap, ... } from 'lucide-react'`
9. Dark mode → usar prefijo `dark:` de Tailwind

**Reglas CRÍTICAS por componente (del prototipo):**

**ProseBlock:** title=`font-serif text-xl font-bold text-teal-900 dark:text-teal-400 mb-2.5`, body=`text-[15px] leading-[1.75] text-gray-500 dark:text-gray-400`

**KeyPointBlock (FORCED DARK):** outer=`bg-teal-900 dark:bg-gray-950 rounded-xl px-6 py-5`, title=`font-serif text-[17px] font-bold text-[#3cc9a8]` (SIEMPRE #3cc9a8), body=`text-sm leading-[1.7] text-[#d1d5db]` (SIEMPRE #d1d5db), badge CRÍTICO=`text-[11px] bg-red-500 text-white px-2 py-0.5 rounded-[10px] font-semibold`, icon Zap size=18 color=#3cc9a8

**StagesBlock:** gradient connector line=`bg-gradient-to-b from-teal-600 to-red-500` (left:15, width:2), numbered circles=`w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center` con bg del severity color, stage cards=`rounded-[10px] px-4 py-3 border border-gray-200 dark:border-gray-700 border-l-[3px]` con border-l del severity color

**ComparisonBlock:** table wrapper=`overflow-x-auto rounded-xl border`, th=`px-3.5 py-2.5 bg-teal-900 dark:bg-gray-950 text-xs font-bold text-left border-b-2`, th highlight=`text-[#3cc9a8]`, th normal=`text-[#d1d5db]`, td highlight=`text-teal-600 dark:text-teal-400 font-semibold bg-teal-50/40 dark:bg-teal-950/40`

**ListDetailBlock:** icon box=`w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center shrink-0`, severity badges: high=`bg-red-50 text-red-600`, medium=`bg-amber-50 text-amber-600`, low=`bg-green-50 text-green-600` (text-[10px] font-bold px-2 py-0.5 rounded-[10px])

**GridBlock:** grid=`grid grid-cols-2` o `grid-cols-3` (de block.content.columns), card=`bg-white dark:bg-gray-800 rounded-[10px] px-4 py-3.5 border text-center`, icon size=20

**TwoColumnBlock:** grid=`grid grid-cols-1 md:grid-cols-2 gap-4`, column title=`font-serif text-base font-bold text-teal-900 dark:text-teal-400 mb-2.5`, items=`px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border`, label=`text-[13px] font-semibold`, detail=`text-xs text-gray-500 dark:text-gray-400`

**CalloutBlock:** outer=`rounded-xl px-5 py-4 border-l-4`, label=`text-xs font-bold uppercase tracking-wide`, title=`font-serif text-base font-bold mb-1.5`, body=`text-sm leading-relaxed whitespace-pre-line`. **Usar config de CALLOUT/CALLOUT_DARK** del prototipo para bg/border/accent por variant. Para dark mode: crear un config object o usar clases condicionales.

**ImageReferenceBlock (solo READ-ONLY en Fase 2):** con imagen=`max-w-full rounded-[10px] border`, caption=`text-[11px] italic text-gray-400 dark:text-gray-500 mt-1 text-center`. Sin imagen=placeholder `rounded-xl border-2 border-dashed p-7 bg-gray-100 dark:bg-gray-950 text-center`, icon Image size=36

**SectionDividerBlock:** container=`flex items-center gap-4 py-2`, lines=`flex-1 h-px bg-gray-200 dark:bg-gray-700`, label=`text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap`

**IconByName helper (crear en `blocks/IconByName.tsx`):**
```typescript
import { Activity, Heart, Pill, Stethoscope, Shield, FlaskConical, Clock, Lightbulb, Target, AlertCircle, Brain, Info, AlertTriangle, HelpCircle, CheckCircle2, CircleDot } from 'lucide-react';
const ICONS: Record<string, React.FC<any>> = { Activity, Heart, Pill, Stethoscope, Shield, FlaskConical, Clock, Lightbulb, Target, AlertCircle, Brain, Info, AlertTriangle, HelpCircle, CheckCircle2 };
export default function IconByName({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  const Icon = ICONS[name] || CircleDot;
  return <Icon size={size} className={className} />;
}
```

**barrel export (`blocks/index.ts`):**
```typescript
export { default as ProseBlock } from './ProseBlock';
export { default as KeyPointBlock } from './KeyPointBlock';
export { default as StagesBlock } from './StagesBlock';
export { default as ComparisonBlock } from './ComparisonBlock';
export { default as ListDetailBlock } from './ListDetailBlock';
export { default as GridBlock } from './GridBlock';
export { default as TwoColumnBlock } from './TwoColumnBlock';
export { default as CalloutBlock } from './CalloutBlock';
export { default as ImageReferenceBlock } from './ImageReferenceBlock';
export { default as SectionDividerBlock } from './SectionDividerBlock';
export { default as IconByName } from './IconByName';
```

Actualizar PROGRESS → `TASK_6: DONE`, Current: TASK_7

---

### TASK_7: Integrar en ViewerBlock.tsx

Abrir `src/app/components/student/ViewerBlock.tsx` y:

1. **Importar** los 10 renderers del barrel:
```typescript
import {
  ProseBlock, KeyPointBlock, StagesBlock, ComparisonBlock,
  ListDetailBlock, GridBlock, TwoColumnBlock, CalloutBlock,
  ImageReferenceBlock, SectionDividerBlock
} from './blocks';
```

2. **Agregar 10 cases nuevos al switch** (dentro del switch existente, ANTES del `default:`):
```typescript
case 'prose':            return <ProseBlock block={block} />;
case 'key_point':        return <KeyPointBlock block={block} />;
case 'stages':           return <StagesBlock block={block} />;
case 'comparison':       return <ComparisonBlock block={block} />;
case 'list_detail':      return <ListDetailBlock block={block} />;
case 'grid':             return <GridBlock block={block} />;
case 'two_column':       return <TwoColumnBlock block={block} />;
case 'callout':          return <CalloutBlock block={block} />;
case 'image_reference':  return <ImageReferenceBlock block={block} />;
case 'section_divider':  return <SectionDividerBlock block={block} />;
```

3. **NO borrar los cases legacy existentes** (`text`, `heading`, `image`, `video`, `pdf`, `callout`, `divider`, `keyword-ref`). Los dos conjuntos coexisten.

4. **NOTA:** Si el case `callout` ya existe para el legacy type, renombrar el legacy a `legacy_callout` o verificar que `block.type` los distingue. El nuevo `callout` (edu block) tiene `block.content.variant` — el legacy no.

Actualizar PROGRESS → `TASK_7: DONE`, Current: TASK_8

---

### TASK_8: Verificar que SummaryViewer muestra los bloques nuevos

Abrir `src/app/components/student/SummaryViewer.tsx` y verificar:

1. **¿SummaryViewer renderiza bloques via `ViewerBlock`?** Si sí → los nuevos cases de TASK_7 ya los cubren. No necesita cambios.

2. **¿Usa `KeywordHighlighterInline` como wrapper?**
   - Si SÍ lo tiene → no tocar
   - Si NO lo tiene → **no agregar**. Los keywords `{{markers}}` quedan como texto plano por ahora. La integración con el TreeWalker de keywords es una tarea separada (no es parte de Fase 2).

3. **Lo que SÍ debes verificar:** Que el flujo `SummaryViewer → blocks.map() → ViewerBlock → switch` funciona. Si SummaryViewer filtra por tipos de bloque o tiene una condición que excluye los nuevos tipos edu, **remover esa restricción**.

4. **NO cambiar** la estructura de SummaryViewer (layout desktop/mobile, lightbox, video modal). Solo asegurar que los nuevos 10 tipos llegan al switch de ViewerBlock sin ser filtrados.

**En resumen: si ViewerBlock ya se llama para cada bloque, TASK_8 es solo una verificación. Si hay un filtro que bloquea los nuevos tipos, quitarlo.**

Actualizar PROGRESS → `TASK_8: DONE`, Current: TASK_9

---

### TASK_9: Build + Tests Green

```bash
npm run build
npx vitest run src/app/components/student/blocks/__tests__/ --reporter=verbose
```

- Si build falla → arreglar
- Si tests fallan → arreglar los componentes hasta que pasen
- Re-run hasta TODO verde

Actualizar PROGRESS → `TASK_9: DONE`, Current: TASK_10

---

### TASK_10: Commit + Push

```bash
# Agregar todos los archivos modificados (SummaryViewer.tsx solo si se cambió en TASK_8)
git add .gitignore src/app/services/summariesApi.ts src/app/components/student/blocks/ src/app/components/student/__tests__/ src/app/components/student/ViewerBlock.tsx
# Solo si TASK_8 modificó SummaryViewer:
git diff --name-only src/app/components/student/SummaryViewer.tsx | grep -q . && git add src/app/components/student/SummaryViewer.tsx
git commit -m "feat: block-based summary renderers + test suite (TDD green)

- 10 edu block renderers (prose, key_point, stages, comparison, etc.)
- 50+ tests covering rendering, edge cases, a11y, keyword markers
- TypeScript types + CRUD functions for SummaryBlock
- WCAG AA contrast: forced light text on dark backgrounds
- Keywords as plain {{markers}} for TreeWalker highlighter

Part of: block-based summaries migration (Fase 2)"
git push -u origin feat/block-based-summaries
```

Actualizar PROGRESS:
```bash
cat > PROGRESS.md << 'EOF'
# Fase 2 — Frontend Block Renderers
## Current: ALL_COMPLETE
## Phase: DONE
## All 10 tasks completed successfully.
EOF
```

---

## REGLAS CRÍTICAS

0. **🚨 JAMÁS TRABAJAR EN MAIN.** Verificar branch al inicio de CADA ciclo. Si estás en main → `git checkout feat/block-based-summaries`. NUNCA hacer commit/push en main. Si detectas que hiciste commit en main, PARA y avisa al usuario.
1. **Leer PROGRESS.md AL INICIO de cada ciclo.** No repetir trabajo.
2. **NO tocar archivos no listados.** Solo los especificados.
3. **NO borrar código existente** — solo agregar.
4. **NO instalar dependencias nuevas.**
5. **Keywords:** Solo emitir `{{markers}}` como texto. El TreeWalker existente los procesa.
6. **Dark mode:** Usar Tailwind `dark:` prefix.
7. **Si build o tests fallan** → arreglar ANTES de marcar DONE.
8. **Un commit al final** (TASK_10). Solo en `feat/block-based-summaries`, JAMÁS en main.
9. **Antes de git push:** `git branch --show-current` — si dice main, ABORTAR.
