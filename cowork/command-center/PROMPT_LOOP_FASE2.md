# PROMPT: Fase 2 — Student Block Rendering

> **Uso:** Copiar este prompt completo en Claude Code CLI con `/loop`.
> **Branch:** `feat/block-based-summaries` desde `main`
> **Repo:** `C:\dev\axon\frontend`
> **Validación final:** `npm run build` sin errores

---

## INSTRUCCIONES PARA EL AGENTE

Eres un agente de implementación quirúrgica. Tu memoria se resetea cada ~10 minutos. **SIEMPRE** empieza cada ciclo así:

### PASO 0 — ORIENTACIÓN (hacer SIEMPRE al iniciar)

```bash
# 1. Leer tu checkpoint de progreso
cat C:\dev\axon\frontend\CHECKPOINT.md 2>/dev/null || echo "NO_CHECKPOINT"

# 2. Si NO_CHECKPOINT → crear archivo y empezar desde TASK 1
# 3. Si existe → leer qué task está completada y continuar con la siguiente
```

### PASO 1 — CONTEXTO (solo si es tu primer ciclo / no hay checkpoint)

```bash
cd C:\dev\axon\frontend
git pull origin main
git checkout -b feat/block-based-summaries main 2>/dev/null || git checkout feat/block-based-summaries
npm install
```

Leer estos archivos de referencia:
- `CLAUDE.md` (raíz del repo — reglas del proyecto)
- El plan de migración está resumido abajo en este prompt. NO necesitas otro archivo.

### PASO 2 — EJECUTAR LA SIGUIENTE TASK PENDIENTE

Hay **6 tasks atómicas** en orden. Cada una es completable en un ciclo de ~10 min.

---

## TASKS

### TASK 1: Types en `summariesApi.ts`

**Archivo:** `src/app/services/summariesApi.ts`
**Acción:** AGREGAR (no borrar nada existente) al final del archivo, antes del último `}` o después de las funciones existentes:

```typescript
// ══════════════════════════════════════════════════
// Block-based Summary Types + CRUD (Fase 2)
// ══════════════════════════════════════════════════

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
  summary_id: string;
  type: string;
  content: Record<string, any>;
  order_index?: number;
}): Promise<SummaryBlock> {
  return apiCall<SummaryBlock>('/summary-blocks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSummaryBlock(
  id: string,
  data: Partial<Pick<SummaryBlock, 'type' | 'content' | 'order_index' | 'is_active' | 'style' | 'metadata'>>
): Promise<SummaryBlock> {
  return apiCall<SummaryBlock>(`/summary-blocks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteSummaryBlock(id: string): Promise<void> {
  await apiCall(`/summary-blocks/${id}`, { method: 'DELETE' });
}
```

**Verificación:** `npx tsc --noEmit src/app/services/summariesApi.ts` — sin errores de tipo.

**Al completar:** Actualizar CHECKPOINT.md → `TASK 1: DONE`

---

### TASK 2: Crear los 10 block renderers + barrel export

**Directorio:** `src/app/components/student/blocks/`

Crear **11 archivos**. Cada renderer es un componente React funcional con Tailwind v4. **FUENTE DE VERDAD** para el diseño: el prototipo `Prototipo_Resumenes_Axon_FINAL.jsx` (está en OneDrive, pero el diseño está especificado abajo).

**REGLAS de conversión del prototipo → producción:**
- Inline styles → Tailwind v4 classes
- `T.darkTeal` / `#1B3B36` → `text-teal-900 dark:text-teal-300`
- `T.tealAccent` / `#2a8c7a` → `text-teal-600 dark:text-teal-400`
- `T.textPrimary` → `text-gray-900 dark:text-gray-100`
- `T.textSecondary` → `text-gray-500 dark:text-gray-400`
- `T.cardBg` → `bg-white dark:bg-gray-800`
- `T.headerBg` → `bg-teal-900 dark:bg-gray-900`
- `T.border` → `border-gray-200 dark:border-gray-700`
- `T.teal50` → `bg-teal-50 dark:bg-teal-900/30`
- Georgia serif → `font-serif`
- Lucide icons: importar de `lucide-react`
- Keywords `{{keyword}}` → NO procesar aquí. El `KeywordHighlighterInline` padre ya lo hace via TreeWalker DOM. Solo renderizar el texto plano con los `{{markers}}` — el highlighter los detecta.
- Cada componente recibe `{ block: SummaryBlock }` como props mínimas
- Exportar como `export default function XBlock({ block }: { block: SummaryBlock }) {}`
- `content` es un objeto (JSONB). Acceder campos así: `block.content.title`, `block.content.items`, etc.

**Los 11 archivos:**

#### `blocks/ProseBlock.tsx`
- `content.title` → h3 serif bold `text-teal-900`
- `content.content` → p con `leading-relaxed text-gray-500`
- `content.imageData` → img opcional flotante (respetar `content.imagePos`: left/center/right)

#### `blocks/KeyPointBlock.tsx`
- Fondo SIEMPRE oscuro: `bg-teal-900 dark:bg-gray-900`
- Texto SIEMPRE claro: título `text-teal-400`, body `text-gray-300`
- Ícono `Zap` color teal-400
- Badge `content.importance`: critical=red, high=amber, medium=teal

#### `blocks/StagesBlock.tsx`
- Timeline vertical con línea gradiente teal→red
- Cada `content.items[i]`: dot circular con severity color, card con border-left
- Severity map: `mild=#10b981, moderate=#f59e0b, critical=#ef4444`

#### `blocks/ComparisonBlock.tsx`
- `<table>` con `content.headers` y `content.rows`
- Header row: `bg-teal-900` con texto SIEMPRE claro (`text-gray-300`, highlight col `text-teal-400`)
- `content.highlight_column` → columna resaltada con `font-semibold bg-teal-50/60`

#### `blocks/ListDetailBlock.tsx`
- Cada `content.items[i]`: ícono Lucide (por nombre), label bold, detail text
- Severity bar lateral opcional (`content.items[i].severity`)

#### `blocks/GridBlock.tsx`
- `content.columns` columnas de cards
- Cada `content.items[i]`: card con ícono, título bold, detalle

#### `blocks/TwoColumnBlock.tsx`
- Grid 2 cols: `content.left` y `content.right`
- Cada lado tiene `title` + `items[]`

#### `blocks/CalloutBlock.tsx`
- 5 variantes en `content.variant`: tip/warning/clinical/mnemonic/exam
- Cada variante tiene: bg, border-left color, ícono, label
- **LIGHT MODE accent colors** (para label+ícono, NO usar border color como text):
  - tip: `#065f46`, warning: `#92400e`, clinical: `#1e40af`, mnemonic: `#5b21b6`, exam: `#b91c1c`
- **DARK MODE accent colors:**
  - tip: `#6ee7b7`, warning: `#fcd34d`, clinical: `#93c5fd`, mnemonic: `#c4b5fd`, exam: `#fca5a5`

#### `blocks/ImageReferenceBlock.tsx`
- Imagen con caption, posición configurable
- Placeholder si no hay `content.imageData`

#### `blocks/SectionDividerBlock.tsx`
- Línea decorativa `border-t` + label opcional centrado

#### `blocks/index.ts`
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
```

**Verificación:** Todos los archivos deben importar `SummaryBlock` desde `../../services/summariesApi` (o ajustar path). `npx tsc --noEmit` sin errores.

**Al completar:** Actualizar CHECKPOINT.md → `TASK 2: DONE`

---

### TASK 3: Integrar renderers en `ViewerBlock.tsx`

**Archivo:** `src/app/components/student/ViewerBlock.tsx`
**Acción:** Agregar imports y cases al switch de renderizado.

```typescript
import {
  ProseBlock, KeyPointBlock, StagesBlock, ComparisonBlock,
  ListDetailBlock, GridBlock, TwoColumnBlock, CalloutBlock,
  ImageReferenceBlock, SectionDividerBlock
} from './blocks';
```

En el switch/render, agregar:
```typescript
case 'prose':             return <ProseBlock block={block} />;
case 'key_point':         return <KeyPointBlock block={block} />;
case 'stages':            return <StagesBlock block={block} />;
case 'comparison':        return <ComparisonBlock block={block} />;
case 'list_detail':       return <ListDetailBlock block={block} />;
case 'grid':              return <GridBlock block={block} />;
case 'two_column':        return <TwoColumnBlock block={block} />;
case 'callout':           return <CalloutBlock block={block} />;
case 'image_reference':   return <ImageReferenceBlock block={block} />;
case 'section_divider':   return <SectionDividerBlock block={block} />;
```

**IMPORTANTE:** NO borrar los cases existentes (text, heading, image, etc.) — esos son legacy y siguen funcionando para los 11 resúmenes viejos.

**Al completar:** Actualizar CHECKPOINT.md → `TASK 3: DONE`

---

### TASK 4: Envolver bloques en `SummaryViewer.tsx`

**Archivo:** `src/app/components/student/SummaryViewer.tsx`
**Acción:** Asegurar que el contenedor de bloques está envuelto en `KeywordHighlighterInline`.

Buscar dónde se renderizan los bloques (map de `blocks` → `ViewerBlock`). Asegurar que está dentro de:
```tsx
<KeywordHighlighterInline summaryId={summaryId} onNavigateKeyword={onKeywordClick}>
  <div ref={containerRef} className="space-y-6">
    {blocks.map((block) => (
      <ViewerBlock key={block.id} block={block} ... />
    ))}
  </div>
</KeywordHighlighterInline>
```

Si ya está envuelto, no cambiar nada. El TreeWalker del highlighter recorre el DOM y decora `{{keyword}}` automáticamente — los block renderers solo emiten texto plano.

**Al completar:** Actualizar CHECKPOINT.md → `TASK 4: DONE`

---

### TASK 5: Build validation

```bash
cd C:\dev\axon\frontend
npm run build
```

- Si hay errores de tipos → arreglarlos
- Si hay errores de imports → arreglar paths
- Si hay warnings de ESLint → arreglar los que sean errores (warnings OK)
- Re-correr `npm run build` hasta que pase limpio

**Al completar:** Actualizar CHECKPOINT.md → `TASK 5: DONE`

---

### TASK 6: Commit + Push

```bash
cd C:\dev\axon\frontend
git add src/app/services/summariesApi.ts src/app/components/student/blocks/ src/app/components/student/ViewerBlock.tsx src/app/components/student/SummaryViewer.tsx
git commit -m "feat: add block-based summary renderers for student view

- Add 10 edu block types (prose, key_point, stages, comparison, etc.)
- Add TypeScript types + CRUD functions for SummaryBlock
- Integrate block renderers into ViewerBlock switch
- WCAG AA contrast: forced light text on dark backgrounds
- Keywords rendered as plain {{markers}} for TreeWalker highlighter

Part of: block-based summaries migration (Fase 2)"
git push -u origin feat/block-based-summaries
```

**Al completar:** Actualizar CHECKPOINT.md → `TASK 6: DONE — ALL COMPLETE`

---

## CHECKPOINT FILE FORMAT

Crear/actualizar `C:\dev\axon\frontend\CHECKPOINT.md`:

```markdown
# Fase 2 Progress
- TASK 1: DONE | PENDING | IN_PROGRESS
- TASK 2: DONE | PENDING | IN_PROGRESS
- TASK 3: DONE | PENDING | IN_PROGRESS
- TASK 4: DONE | PENDING | IN_PROGRESS
- TASK 5: DONE | PENDING | IN_PROGRESS
- TASK 6: DONE | PENDING | IN_PROGRESS
## Notes
(cualquier nota sobre problemas encontrados)
```

## REGLAS CRÍTICAS

1. **NO tocar archivos no listados.** Solo los 3 existentes + 11 nuevos.
2. **NO borrar código existente** en summariesApi.ts ni ViewerBlock.tsx — solo agregar.
3. **NO instalar dependencias nuevas.** Solo usa lo que ya está (`lucide-react`, `react`, Tailwind).
4. **Keywords:** NO implementar popover/chip. Solo emitir texto con `{{markers}}`. El `KeywordHighlighterInline` existente ya maneja el DOM decoration.
5. **Dark mode:** Usar Tailwind `dark:` prefix. El proyecto ya tiene dark mode configurado.
6. **Si `npm run build` falla** después de tu cambio → arréglalo ANTES de marcar la task como DONE.
7. **Leer CHECKPOINT.md** al inicio de CADA ciclo. No repetir trabajo ya hecho.
8. **Un commit al final** (Task 6). No hacer commits intermedios.
