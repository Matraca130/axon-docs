# PROMPT: Fase 5 — Block Editor Profesor

> **Uso:** Copiar este prompt completo en Claude Code CLI con `/loop`.
> **Branch:** `feat/block-editor-professor` desde `feat/block-based-summaries`
> **Repo:** `C:\dev\axon\frontend`
> **PREREQUISITO:** Backend Fase 4 ya mergeado a main (PR #170). Frontend Fase 2 está en `feat/block-based-summaries` (no mergeada aún — esta branch sale de ahí).
> **Validación final:** `npm run build` sin errores

---

## 🚨 REGLA ABSOLUTA: JAMÁS TRABAJAR EN MAIN 🚨

**Antes de escribir UNA SOLA LÍNEA de código, verificar la branch:**

```bash
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  echo "❌ ABORT: Estás en $CURRENT_BRANCH — PROHIBIDO. Cambiando a feature branch..."
  git checkout feat/block-editor-professor 2>/dev/null || git checkout -b feat/block-editor-professor feat/block-based-summaries
fi
echo "✅ Branch segura: $(git branch --show-current)"
```

**NUNCA hacer commit, push, ni editar archivos estando en main.**

---

## INSTRUCCIONES PARA EL AGENTE

Eres un agente de implementación quirúrgica. Tu memoria se resetea cada ~10 minutos. **SIEMPRE** empieza cada ciclo así:

### PASO 0 — ORIENTACIÓN (hacer SIEMPRE al iniciar)

```bash
# 1. Verificar branch (NUNCA main)
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  git checkout feat/block-editor-professor 2>/dev/null || git checkout -b feat/block-editor-professor feat/block-based-summaries
fi

# 2. Leer progreso
cat C:\dev\axon\frontend\CHECKPOINT_FASE5.md 2>/dev/null || echo "NO_CHECKPOINT"
```

### PASO 1 — CONTEXTO (solo primer ciclo)

```bash
cd C:\dev\axon\frontend
git fetch origin
git checkout feat/block-based-summaries && git pull origin feat/block-based-summaries
git checkout -b feat/block-editor-professor feat/block-based-summaries 2>/dev/null || git checkout feat/block-editor-professor
npm install
```

Leer antes de escribir código:
- `CLAUDE.md` (reglas del repo)
- `src/app/components/roles/pages/professor/SummaryDetailView.tsx` (lo que vas a modificar)
- `src/app/services/summariesApi.ts` (los types SummaryBlock ya existen de Fase 2)
- `src/app/hooks/queries/` (pattern de mutations del proyecto)
- `src/app/components/student/blocks/` (los renderers de Fase 2 — para preview mode)
- `src/app/components/shared/ImageUploadDialog.tsx` (reutilizar para image blocks)

---

## REFERENCIA: Block Schema + Design Tokens

Crear `.ref/` al iniciar (si no existe de Fase 2):

```bash
mkdir -p .ref
cat > .ref/block-schema.json << 'SCHEMA_EOF'
{
  "block_types": {
    "prose": { "fields": { "title": "string", "content": "string" } },
    "key_point": { "fields": { "title": "string", "content": "string", "importance": "high|critical" } },
    "stages": { "fields": { "title": "string", "items": "[{stage, title, content, severity?}]" } },
    "comparison": { "fields": { "title": "string", "headers": "string[]", "rows": "string[][]", "highlight_column": "int|null" } },
    "list_detail": { "fields": { "title": "string", "intro?": "string", "items": "[{label, detail, icon, severity?}]" } },
    "grid": { "fields": { "title": "string", "columns": "2|3", "items": "[{label, detail, icon}]" } },
    "two_column": { "fields": { "columns": "[{title, items: [{label, detail}]}]" } },
    "callout": { "fields": { "variant": "tip|warning|clinical|mnemonic|exam", "title": "string", "content": "string" } },
    "image_reference": { "fields": { "description": "string", "caption": "string", "image_url?": "string" } },
    "section_divider": { "fields": { "label?": "string" } }
  },
  "valid_icons": ["Activity","Heart","Pill","Stethoscope","Shield","FlaskConical","Clock","Lightbulb","Target","AlertCircle","Brain","Info","AlertTriangle","HelpCircle","CheckCircle2","CircleDot"],
  "callout_variants": {
    "tip": { "icon": "Lightbulb", "label": "Tip", "color": "green" },
    "warning": { "icon": "AlertTriangle", "label": "Atención", "color": "amber" },
    "clinical": { "icon": "Stethoscope", "label": "Correlación Clínica", "color": "blue" },
    "mnemonic": { "icon": "Brain", "label": "Mnemotecnia", "color": "violet" },
    "exam": { "icon": "Target", "label": "Importante para Examen", "color": "red" }
  }
}
SCHEMA_EOF
```

Los forms del editor deben generar content que cumpla exactamente con los campos requeridos de cada tipo. Los renderers de Fase 2 (en `src/app/components/student/blocks/`) ya están implementados y se reusan para el modo preview.

---

## TASKS

### TASK 1: Crear `useBlockEditorMutations.ts`

**Archivo NUEVO:** `src/app/hooks/queries/useBlockEditorMutations.ts`

Mutations React Query para el editor de bloques:
- `createBlock` → POST /summary-blocks
- `updateBlock` → PUT /summary-blocks/:id
- `deleteBlock` → DELETE /summary-blocks/:id
- `reorderBlocks` → PUT /reorder (tabla summary_blocks)

**Seguir el pattern de mutations existente del proyecto** (buscar otros `useMutation` en hooks/queries/ para copiar el estilo). Usa `queryKeys` del proyecto si existe, sino crear key `['summary-blocks', summaryId]`.

Importar las funciones CRUD de `summariesApi.ts` (createSummaryBlock, updateSummaryBlock, deleteSummaryBlock).

**Verificación:** `npx tsc --noEmit` del archivo

**Al completar:** CHECKPOINT → `TASK 1: DONE`

---

### TASK 2: Crear componentes base del editor (4 archivos)

**Directorio NUEVO:** `src/app/components/professor/block-editor/`

#### `BlockTypeSelector.tsx`
- Dropdown/modal con los 10 tipos de bloque educativo
- Cada opción: ícono Lucide + nombre + descripción corta
- Props: `onSelect(type: EduBlockType)`, `onClose()`
- Tipos con íconos: prose=FileText, key_point=Zap, stages=ArrowRight, comparison=Table, list_detail=List, grid=LayoutGrid, two_column=Columns2, callout=AlertTriangle, image_reference=Image, section_divider=Minus

#### `AddBlockButton.tsx`
- Botón "+" que aparece entre bloques
- Al hacer click abre `BlockTypeSelector`
- Props: `onInsert(type: EduBlockType, afterIndex: number)`

#### `BlockCard.tsx`
- Wrapper de cada bloque en el editor
- Muestra: drag handle (GripVertical), badge de tipo, botones de acción (editar, duplicar, eliminar, mover ↑↓)
- Toggleable: modo edición (muestra form) vs modo preview (muestra renderer de Fase 2)
- Props: `block: SummaryBlock`, `isEditing: boolean`, `onToggleEdit()`, `onDelete()`, `onDuplicate()`, `onMoveUp()`, `onMoveDown()`, `children` (el form o renderer)

#### `BlockEditorToolbar.tsx`
- Toolbar superior: botón "Agregar bloque", toggle "Preview", botón "Publicar" (si status=review)
- Props: `onAddBlock()`, `isPreview`, `onTogglePreview()`, `onPublish()`, `status: string`

**Verificación:** Todos compilan sin error

**Al completar:** CHECKPOINT → `TASK 2: DONE`

---

### TASK 3: Crear block forms (10 archivos)

**Directorio:** `src/app/components/professor/block-editor/forms/`

Cada form recibe `{ block, onChange }` donde `onChange(field, value)` actualiza el content JSONB.

#### Forms simples (campos de texto):
- **ProseForm.tsx** — título (input) + contenido (textarea o TipTap mini si disponible)
- **KeyPointForm.tsx** — título + contenido + selector importancia (critical/high/medium)
- **CalloutForm.tsx** — selector variante (tip/warning/clinical/mnemonic/exam) + título + contenido
- **SectionDividerForm.tsx** — label (input, opcional)

#### Forms con listas dinámicas:
- **StagesForm.tsx** — título + items[] (cada item: stage number, title, content, severity)
- **ListDetailForm.tsx** — título + intro + items[] (icon, label, detail, severity)
- **GridForm.tsx** — título + columns (number input) + items[] (icon, label, detail)
- **TwoColumnForm.tsx** — columns[] con title + items[] cada una

#### Forms con tabla:
- **ComparisonForm.tsx** — título + headers[] (inputs) + rows[][] (grid de inputs) + highlight_column selector + botones add/remove row/col

#### Form con imagen:
- **ImageReferenceForm.tsx** — reutilizar `ImageUploadDialog` del proyecto + caption (input) + description (textarea)
  - Las imágenes nuevas suben a Supabase Storage → `content.image_url`
  - **NOTA del prototipo:** El prototipo usa `imageData` (base64) para preview local. En producción usar `image_url` de Supabase Storage.

**Patrón para cada form:**
```tsx
export default function XForm({ block, onChange }: BlockFormProps) {
  const c = block.content;
  return (
    <div className="space-y-3">
      <input value={c.title || ''} onChange={e => onChange('title', e.target.value)}
        className="w-full text-sm border rounded-lg px-3 py-2 ..." placeholder="Título" />
      {/* ... more fields */}
    </div>
  );
}
```

**Verificación:** Todos compilan

**Al completar:** CHECKPOINT → `TASK 3: DONE`

---

### TASK 4: Crear `BlockFormRouter.tsx`

**Archivo:** `src/app/components/professor/block-editor/BlockFormRouter.tsx`

Switch que rutea cada block.type al form correcto:

```tsx
import ProseForm from './forms/ProseForm';
import KeyPointForm from './forms/KeyPointForm';
// ... etc

export default function BlockFormRouter({ block, onChange }: { block: SummaryBlock; onChange: (field: string, value: any) => void }) {
  switch (block.type) {
    case 'prose':           return <ProseForm block={block} onChange={onChange} />;
    case 'key_point':       return <KeyPointForm block={block} onChange={onChange} />;
    // ... all 10 types
    default:                return <div>Tipo no soportado: {block.type}</div>;
  }
}
```

**Al completar:** CHECKPOINT → `TASK 4: DONE`

---

### TASK 5: Crear `BlockEditor.tsx` (orquestador principal)

**Archivo:** `src/app/components/professor/block-editor/BlockEditor.tsx`

Este es el componente principal. Orquesta todo:

1. **Fetch blocks** con `useSummaryBlocksQuery(summaryId)` (o crear query inline)
2. **State:** `isPreview`, `editingBlockId`, blocks locales optimistas
3. **Drag-and-drop:** HTML5 nativo (draggable + onDragStart/Over/Drop) → reorderBlocks mutation
4. **Auto-save:** debounce 2s por bloque — cuando el form hace onChange → buffer local → después de 2s sin cambios → updateBlock mutation
5. **Render:**
   ```
   <BlockEditorToolbar ... />
   <div className="space-y-4">
     {blocks.map((block, i) => (
       <>
         <AddBlockButton afterIndex={i-1} onInsert={handleInsert} />
         <BlockCard block={block} isEditing={editingBlockId === block.id} ...>
           {isPreview || editingBlockId !== block.id
             ? <StudentBlockRenderer block={block} /> // Reusa renderers de Fase 2
             : <BlockFormRouter block={block} onChange={(f,v) => handleFieldChange(block.id, f, v)} />}
         </BlockCard>
       </>
     ))}
     <AddBlockButton afterIndex={blocks.length-1} onInsert={handleInsert} />
   </div>
   ```

6. **Publicar:** llamar `POST /content/summaries/${summaryId}/publish` (Fase 4 endpoint)

**Props:**
```typescript
interface BlockEditorProps {
  summaryId: string;
  onBack: () => void;
  onStatusChange?: (status: string) => void;
  summaryTitle?: string;
  summaryStatus?: string;
}
```

**Al completar:** CHECKPOINT → `TASK 5: DONE`

---

### TASK 6: Integrar en `SummaryDetailView.tsx`

**Archivo:** `src/app/components/roles/pages/professor/SummaryDetailView.tsx`

**Cambio:** Reemplazar el editor existente (TipTap o similar) por `BlockEditor` para resúmenes nuevos.

```tsx
import BlockEditor from '../../../professor/block-editor/BlockEditor';

// En el render, donde estaba el editor de texto:
<BlockEditor
  summaryId={summary.id}
  onBack={onBack}
  onStatusChange={handleStatusChange}
  summaryTitle={summary.title}
  summaryStatus={summary.status}
/>
```

**IMPORTANTE:** Leer el archivo existente completo antes de modificar. Entender cómo pasa props, cómo maneja estado, cómo hace navigation. Ajustar la integración al pattern del archivo.

**Al completar:** CHECKPOINT → `TASK 6: DONE`

---

### TASK 7: Build + fix + commit + push

```bash
npm run build
```

Arreglar todos los errores. Re-run hasta que pase limpio. Luego:

```bash
git add src/app/components/professor/block-editor/ src/app/hooks/queries/useBlockEditorMutations.ts src/app/components/roles/pages/professor/SummaryDetailView.tsx
git commit -m "feat: block editor for professor summary editing

- Add BlockEditor with drag-and-drop, auto-save, preview toggle
- Add 10 type-specific block forms (prose, stages, comparison, etc.)
- Add useBlockEditorMutations for CRUD operations
- Integrate into SummaryDetailView (replaces legacy text editor)
- Reuse student block renderers for preview mode
- Publish button calls POST /summaries/:id/publish

Part of: block-based summaries migration (Fase 5)"
git push -u origin feat/block-editor-professor
```

**Al completar:** CHECKPOINT → `TASK 7: DONE — ALL COMPLETE`

---

## CHECKPOINT FILE FORMAT

```markdown
# Fase 5 Progress
- TASK 1: DONE | PENDING | IN_PROGRESS (mutations hook)
- TASK 2: DONE | PENDING | IN_PROGRESS (base components)
- TASK 3: DONE | PENDING | IN_PROGRESS (10 block forms)
- TASK 4: DONE | PENDING | IN_PROGRESS (form router)
- TASK 5: DONE | PENDING | IN_PROGRESS (BlockEditor main)
- TASK 6: DONE | PENDING | IN_PROGRESS (SummaryDetailView)
- TASK 7: DONE | PENDING | IN_PROGRESS (build + commit)
## Notes
```

## REGLAS CRÍTICAS

0. **🚨 JAMÁS TRABAJAR EN MAIN.** Verificar branch al inicio de CADA ciclo. Si estás en main → `git checkout feat/block-editor-professor`. NUNCA hacer commit/push en main. Si detectas que hiciste commit en main, PARA y avisa al usuario.
1. **Leer CHECKPOINT al inicio de CADA ciclo.**
2. **Leer código existente ANTES de escribir.** Especialmente SummaryDetailView.tsx — entender su structure antes de integrarte.
3. **Reutilizar components del proyecto:** ImageUploadDialog, botones, modals, etc.
4. **Tailwind v4** — no inline styles. Seguir el pattern del proyecto.
5. **React Query** — seguir el pattern de mutations existente del proyecto.
6. **NO instalar dependencias nuevas.**
7. **Forms deben ser responsive** — funcionar en mobile (el profesor puede usar tablet).
8. **Si `npm run build` falla** → arreglar ANTES de marcar DONE.
9. **Un commit al final** (Task 7). Solo en `feat/block-editor-professor`, JAMÁS en main.
10. **Antes de git push:** `git branch --show-current` — si dice main, ABORTAR.
