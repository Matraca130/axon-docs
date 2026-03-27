# PROMPT: Fix Wiring — Conectar SummaryViewer a la App

## Contexto

La Fase 2 creó todos los componentes pero NO los conectó:
- ✅ 10 renderers en `src/app/components/student/blocks/` — COMPLETOS
- ✅ `ViewerBlock.tsx` en `src/app/components/student/` — switch completo con 10 tipos edu + 7 legacy
- ✅ `SummaryViewer.tsx` en `src/app/components/student/` — vista nueva block-based
- ✅ `useSummaryBlocksQuery.ts` en `src/app/hooks/queries/` — query que trae bloques
- ❌ **NADA de esto está conectado a la app.** La ruta del estudiante usa `SummaryView.tsx` (content/, 15KB) que renderiza HTML monolítico con `useSummaryViewQueries`.

## Branch

```bash
git fetch origin
git checkout feat/block-based-summaries
git pull origin feat/block-based-summaries
```

## Reglas

- NO crear archivos nuevos — solo modificar existentes
- NO romper la vista del profesor (`SummaryDetailView.tsx` en professor/ — NO TOCAR)
- NO eliminar `SummaryView.tsx` — podría tener features que aún se usan (flashcards, videos tabs)
- Build MUST pass: `npm run build`
- Commit al final si build pasa

## TASK 1: Investigar el estado actual (READ ONLY)

Antes de tocar código, lee y entiende estos archivos en este orden:

```
1. src/app/components/content/SummaryView.tsx          — la vista activa (15KB). Entender qué renderiza y cómo.
2. src/app/components/student/SummaryViewer.tsx         — la vista nueva (8KB). Entender qué props espera.
3. src/app/components/student/ViewerBlock.tsx           — el dispatcher de bloques
4. src/app/hooks/queries/useSummaryBlocksQuery.ts       — el query de bloques
5. src/app/hooks/queries/useSummaryViewQueries.ts       — los queries viejos
6. src/app/hooks/useSummaryViewer.ts                    — hook de UI state (zoom, fullscreen, etc.)
7. src/app/hooks/useSummaryPersistence.ts               — hook de auto-save
8. src/app/components/student/blocks/index.ts           — barrel exports
```

Documenta en PROGRESS.md:
- ¿Qué hace `SummaryView.tsx`? ¿Cómo renderiza el contenido?
- ¿Qué props espera `SummaryViewer.tsx`? ¿Usa `useSummaryBlocksQuery` internamente o recibe bloques por props?
- ¿Dónde en la app se renderiza `SummaryView`? (buscar imports y rutas)
- ¿Hay un fallback viable? (si un summary no tiene bloques, ¿se muestra el HTML viejo?)

## TASK 2: Determinar la estrategia de integración

Hay dos caminos posibles. Elige basándote en lo que encontraste en Task 1:

### Opción A: Reemplazar dentro de SummaryView.tsx
Si `SummaryView.tsx` es el componente de ruta y tiene mucha lógica de layout/navegación/tabs que no queremos perder:
- Agregar detección de bloques DENTRO de `SummaryView.tsx`
- Si `summary_blocks` existen → renderizar `SummaryViewer`
- Si no → fallback al HTML monolítico actual
- Esto es más seguro porque no rompe la navegación existente

### Opción B: Reemplazar la ruta directamente
Si `SummaryView.tsx` es simple y `SummaryViewer.tsx` ya tiene todo lo necesario:
- Cambiar el import en el router/parent para usar `SummaryViewer`
- Mover la lógica de navegación/layout necesaria a `SummaryViewer`

**Recomendación: Opción A** — es más segura, no rompe nada, y permite fallback gradual.

## TASK 3: Implementar la conexión

### Si elegiste Opción A:

En `SummaryView.tsx`:

1. **Importar** `SummaryViewer` y `useSummaryBlocksQuery`:
```tsx
import { SummaryViewer } from '@/app/components/student/SummaryViewer';
// O el import que corresponda según el export de SummaryViewer
```

2. **Detectar bloques** — dentro del componente, después de que el summary cargue:
```tsx
// Pseudocódigo — adaptar al código real
const { data: blocks, isLoading: blocksLoading } = useSummaryBlocksQuery(summaryId);
const hasBlocks = blocks && blocks.length > 0;
```

3. **Renderizar condicionalmente**:
```tsx
{hasBlocks ? (
  <SummaryViewer
    // Pasar los props que SummaryViewer espera
    // Verificar en Task 1 qué necesita
  />
) : (
  // Mantener el render actual del HTML monolítico
  <div dangerouslySetInnerHTML={...} /> // o como sea que renderice ahora
)}
```

4. **Verificar que SummaryViewer use ViewerBlock internamente** — si no, conectarlo:
```tsx
// Dentro de SummaryViewer, debe haber algo como:
{blocks.map(block => <ViewerBlock key={block.id} block={block} />)}
```

## TASK 4: Verificar la cadena completa

Después de implementar, verificar que la cadena funciona end-to-end:

```
Ruta del estudiante
  → SummaryView.tsx (layout, navegación, tabs)
    → useSummaryBlocksQuery(summaryId) → fetch bloques de la API
      → Si hay bloques → SummaryViewer
        → blocks.map() → ViewerBlock (switch por block_type)
          → ProseBlock / KeyPointBlock / StagesBlock / etc.
      → Si NO hay bloques → HTML monolítico (fallback)
```

Buscar y verificar:
- `useSummaryBlocksQuery` hace fetch a la ruta correcta del backend (`/summary-blocks?summary_id=...` o similar)
- El tipo de dato que devuelve matchea con lo que `ViewerBlock` espera (`block.block_type`, `block.content`, etc.)
- Los 10 renderers reciben `{ block: SummaryBlock }` como prop (verificar el tipo en `blocks/index.ts` o tipos)

## TASK 5: Build + Commit

```bash
npm run build
```

Si pasa:
```bash
git add -A
git commit -m "fix: wire SummaryViewer into SummaryView with block detection fallback

- Add block detection in SummaryView.tsx (useSummaryBlocksQuery)
- Render SummaryViewer when summary_blocks exist
- Fallback to legacy HTML rendering when no blocks
- Complete data flow: API → blocks query → SummaryViewer → ViewerBlock → renderers"
git push origin feat/block-based-summaries
```

Si NO pasa: fix los errores de TypeScript/import y re-intentar.

## Archivos que puedes modificar

- `src/app/components/content/SummaryView.tsx` — PRINCIPAL: agregar detección + render condicional
- `src/app/components/student/SummaryViewer.tsx` — si necesita ajustes de props
- `src/app/components/student/ViewerBlock.tsx` — si necesita ajustes de tipos
- `src/app/hooks/queries/useSummaryBlocksQuery.ts` — si el query necesita fix

## Archivos que NO debes modificar

- `src/app/components/roles/pages/professor/SummaryDetailView.tsx` — vista del profesor, funciona aparte
- `src/app/components/student/blocks/*.tsx` — los renderers ya están bien
- Archivos de rutas/router — no cambiar la navegación
