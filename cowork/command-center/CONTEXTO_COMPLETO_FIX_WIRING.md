# CONTEXTO COMPLETO: Fix Wiring — Conectar Sistema de Bloques a la App

> **INSTRUCCIÓN:** Lee este archivo COMPLETO antes de tocar cualquier código. Contiene el diagnóstico, la arquitectura, el inventario de archivos, y las instrucciones paso a paso.

---

## 1. QUÉ ES AXON

Plataforma educativa médica. Stack: React 18 + Vite 6 + Tailwind v4 (frontend), Hono + Deno en Supabase Edge Functions (backend). Auth dual: `Authorization: Bearer <ANON_KEY>` + `X-Access-Token: <USER_JWT>`.

## 2. QUÉ ES EL SISTEMA DE RESÚMENES

Los resúmenes son contenido educativo que los profesores crean y los estudiantes leen. Se está migrando de un sistema **monolítico** (un solo campo HTML `content_markdown`) a un sistema **block-based** (10 tipos de bloques educativos).

### 10 tipos de bloques educativos (nuevos)
`prose`, `key_point`, `stages`, `comparison`, `list_detail`, `grid`, `two_column`, `callout`, `image_reference`, `section_divider`

### 7 tipos de bloques legacy (ya existían)
`text`, `heading`, `image`, `video`, `pdf`, `callout` (legacy), `divider`, `keyword-ref`

## 3. QUÉ SE HIZO (Fase 2) — Todo esto YA EXISTE en la branch

La Fase 2 creó todos los componentes de rendering. **Todo compiló y pasó build.** Pero NO conectó la tubería de datos.

### Renderers creados (10 archivos) — `src/app/components/student/blocks/`
```
CalloutBlock.tsx      (2959 bytes) — 5 variantes: tip/warning/clinical/mnemonic/exam
ComparisonBlock.tsx   (2073 bytes) — tabla con headers, rows, highlight_column
GridBlock.tsx         (1515 bytes) — grid de items con iconos
IconByName.tsx        (741 bytes)  — helper de iconos por nombre
ImageReferenceBlock.tsx (1454 bytes) — imagen con caption y posición
index.ts             (679 bytes)  — barrel exports
KeyPointBlock.tsx     (1111 bytes) — fondo oscuro teal, badge CRÍTICO
ListDetailBlock.tsx   (2443 bytes) — lista con iconos, labels, detail, severity
ProseBlock.tsx        (918 bytes)  — título Georgia + contenido
SectionDividerBlock.tsx (644 bytes) — divisor con label
StagesBlock.tsx       (2519 bytes) — etapas con conector gradient, severity colors
TwoColumnBlock.tsx    (1466 bytes) — dos columnas con items
```

### Dispatcher — `src/app/components/student/ViewerBlock.tsx`
Switch completo que despacha los 10 tipos edu + 7 legacy. Importa `EduCalloutBlock` (alias del nuevo CalloutBlock) para evitar colisión con el case legacy `callout`. Tiene smart detection: callout edu (con variant tip/warning/etc + title) → nuevo renderer; callout legacy → renderer viejo.

### Vista nueva — `src/app/components/student/SummaryViewer.tsx` (8462 bytes, Mar 22)
Vista block-based del estudiante. **NO está importada en ningún archivo de la app.** Es código muerto.

### Query de bloques — `src/app/hooks/queries/useSummaryBlocksQuery.ts` (1623 bytes, Mar 22)
React Query hook que trae `summary_blocks` del backend. **Nadie lo llama.**

## 4. QUÉ ESTÁ ROTO — El Diagnóstico

### Problema central: la tubería nunca se conectó

```
LO QUE DEBERÍA PASAR:
  Ruta estudiante → SummaryView → useSummaryBlocksQuery → SummaryViewer → ViewerBlock → renderers

LO QUE PASA HOY:
  Ruta estudiante → SummaryView → useSummaryViewQueries → HTML monolítico (content_markdown)
                                                          ↑ NUNCA toca los renderers nuevos
```

### 3 vistas compitiendo
| Archivo | Ubicación | Tamaño | Rol | Estado |
|---------|-----------|--------|-----|--------|
| `SummaryView.tsx` | `content/` | 15KB | Vista ACTIVA (profesor + estudiante) | Renderiza HTML monolítico |
| `SummaryViewer.tsx` | `student/` | 8KB | Vista nueva block-based | **CÓDIGO MUERTO — no importada** |
| `SummaryDetailView.tsx` | `professor/` | 40KB | Editor del profesor | Funciona aparte, NO TOCAR |

### 7 hooks fragmentados
| Hook | Ubicación | Rol | Estado |
|------|-----------|-----|--------|
| `useSummaryViewer.ts` | `hooks/` | UI state (zoom, fullscreen, highlight, scroll) | Funcional |
| `useSummaryPersistence.ts` | `hooks/` | Auto-save a Supabase (annotations, mastery, notes) | Funcional |
| `useSummaryTimer.ts` | `hooks/` | Timer de sesión de estudio | Funcional |
| `useSummaryBlocksQuery.ts` | `hooks/queries/` | **Query de bloques nuevos** | **NADIE LO USA** |
| `useSummaryReaderMutations.ts` | `hooks/queries/` | Mutaciones del reader | Funcional |
| `useSummaryReaderQueries.ts` | `hooks/queries/` | Queries del reader | Funcional |
| `useSummaryViewQueries.ts` | `hooks/queries/` | Queries de la vista vieja | Usado por SummaryView |

### Quién importa SummaryView (la vista activa)
- `FlashcardsManager.tsx` — referencia en comentario
- `TopicSummariesView.tsx` — navega a SummaryView por URL (línea 123)
- `VideosManager.tsx` — referencia en comentario
- `FlashcardReviewer.tsx` — referencia en comentario
- `SummaryHeader.tsx` — usado por SummaryView

### Quién importa SummaryDetailView (profesor)
- `ProfessorCurriculumPage.tsx` — import + render (líneas 16, 146)
- `TopicDetailPanel.tsx` — import + render (líneas 23, 137)

### Quién importa SummaryViewer (la nueva)
- **NADIE** ← Este es el problema

## 5. PROTOTIPO — Referencia Visual

El archivo `Prototipo_Resumenes_Axon_FINAL.jsx` (1897 líneas) es la especificación visual. Está en la carpeta OneDrive del proyecto. Los design tokens clave:

```
LIGHT theme:
  darkTeal: "#1B3B36"    → Tailwind: text-teal-900
  tealAccent: "#2a8c7a"  → Tailwind: text-teal-600
  pageBg: "#F0F2F5"      → Tailwind: bg-gray-100
  textPrimary: "#111827"  → Tailwind: text-gray-900
  textSecondary: "#6b7280" → Tailwind: text-gray-500
  cardBg: "#FFFFFF"       → Tailwind: bg-white
  headerBg: "#1B3B36"    → Tailwind: bg-teal-900

DARK theme:
  darkTeal: "#3cc9a8"    → text-[#3cc9a8]
  pageBg: "#111215"      → dark:bg-gray-950
  cardBg: "#1e1f25"      → dark:bg-gray-900

Callout variants: tip (green), warning (amber), clinical (blue), mnemonic (purple), exam (red)
Severity: mild (#10b981), moderate (#f59e0b), critical (#ef4444)
Typography: Georgia serif for headings, Inter/system for body
```

## 6. BACKEND — Ya Mergeado a Main

El backend (Fase 4) ya está en main (PR #170). Los endpoints de `summary-blocks` funcionan. El frontend solo necesita llamarlos correctamente vía `useSummaryBlocksQuery`.

## 7. INSTRUCCIONES DE FIX

### Branch
```bash
git fetch origin
git checkout feat/block-based-summaries
git pull origin feat/block-based-summaries
```

### Reglas ESTRICTAS
- NO crear archivos nuevos — solo modificar existentes
- NO romper la vista del profesor (`SummaryDetailView.tsx` — NO TOCAR)
- NO eliminar `SummaryView.tsx` — tiene features activas (flashcards, videos tabs, navegación)
- NO modificar los renderers en `blocks/*.tsx` — ya están bien
- NO cambiar archivos de rutas/router
- Build MUST pass: `npm run build`
- Never push to main — commit a `feat/block-based-summaries`

### TASK 1: Investigar estado actual (READ ONLY — no escribir código aún)

Lee estos archivos en orden y toma notas mentales:

```
1. src/app/components/content/SummaryView.tsx          — ¿Cómo renderiza? ¿Qué layout tiene?
2. src/app/components/student/SummaryViewer.tsx         — ¿Qué props espera? ¿Llama useSummaryBlocksQuery internamente?
3. src/app/components/student/ViewerBlock.tsx           — ¿Qué tipo recibe? (block.block_type, block.content)
4. src/app/hooks/queries/useSummaryBlocksQuery.ts       — ¿Qué endpoint llama? ¿Qué devuelve?
5. src/app/hooks/queries/useSummaryViewQueries.ts       — ¿Qué usa la vista vieja?
6. src/app/hooks/useSummaryViewer.ts                    — Hook de UI (zoom, fullscreen, etc.)
7. src/app/hooks/useSummaryPersistence.ts               — Hook de auto-save
8. src/app/components/student/blocks/index.ts           — Barrel exports
```

Preguntas a responder antes de codear:
- ¿`SummaryViewer.tsx` llama `useSummaryBlocksQuery` internamente o recibe bloques por props?
- ¿`SummaryView.tsx` tiene el `summaryId` disponible para pasarlo a `useSummaryBlocksQuery`?
- ¿Hay un campo en el summary que indique si tiene bloques nuevos? (ej: `summary.has_blocks`, `summary.version`)
- ¿Los tipos de `useSummaryBlocksQuery` matchean con lo que `ViewerBlock` espera?

### TASK 2: Estrategia de integración

**Recomendación: Opción A — Integrar DENTRO de SummaryView.tsx** (más segura).

Lógica:
1. Dentro de `SummaryView.tsx`, después de que el summary cargue, llamar `useSummaryBlocksQuery(summaryId)`
2. Si hay bloques (`blocks.length > 0`) → renderizar `SummaryViewer` en lugar del contenido HTML
3. Si NO hay bloques → mantener el render actual (fallback al HTML monolítico)
4. Toda la lógica de layout, navegación, tabs, header se mantiene intacta

### TASK 3: Implementar

En `SummaryView.tsx`:

1. **Importar**:
```tsx
import SummaryViewer from '@/app/components/student/SummaryViewer';
// O { SummaryViewer } — verificar el export en Task 1
```

2. **Agregar query de bloques** (si SummaryViewer no lo hace internamente):
```tsx
import { useSummaryBlocksQuery } from '@/app/hooks/queries/useSummaryBlocksQuery';
// Dentro del componente:
const { data: blocks, isLoading: blocksLoading } = useSummaryBlocksQuery(summaryId);
const hasEduBlocks = !blocksLoading && blocks && blocks.length > 0;
```

3. **Render condicional** — en la sección donde hoy renderiza el HTML monolítico:
```tsx
{hasEduBlocks ? (
  <SummaryViewer /* props que necesite — ver Task 1 */ />
) : (
  /* Mantener el render actual del HTML monolítico exactamente como está */
)}
```

4. Si `SummaryViewer` ya llama `useSummaryBlocksQuery` internamente, solo necesitas importar y renderizar `SummaryViewer` pasándole el `summaryId` — sin llamar el query desde `SummaryView`.

### TASK 4: Verificar cadena completa

La cadena correcta end-to-end:
```
SummaryView.tsx (layout, nav, tabs — ya funciona)
  ├─ useSummaryBlocksQuery(summaryId) → GET /summary-blocks?summary_id=X
  │   └─ Retorna: SummaryBlock[] (block_type, content, position, etc.)
  │
  ├─ SI hay bloques → SummaryViewer
  │   └─ blocks.map(block => <ViewerBlock block={block} />)
  │       └─ switch(block.block_type)
  │           ├─ 'prose'           → <ProseBlock>
  │           ├─ 'key_point'       → <KeyPointBlock>
  │           ├─ 'stages'          → <StagesBlock>
  │           ├─ 'comparison'      → <ComparisonBlock>
  │           ├─ 'list_detail'     → <ListDetailBlock>
  │           ├─ 'grid'            → <GridBlock>
  │           ├─ 'two_column'      → <TwoColumnBlock>
  │           ├─ 'callout' (edu)   → <EduCalloutBlock>
  │           ├─ 'image_reference' → <ImageReferenceBlock>
  │           └─ 'section_divider' → <SectionDividerBlock>
  │
  └─ SI NO hay bloques → HTML monolítico (fallback actual)
```

Verificar:
- El endpoint del backend responde correctamente
- Los tipos de datos matchean (block_type string, content JSONB)
- Los renderers reciben el prop correcto (`{ block: SummaryBlock }`)
- No hay errores de TypeScript

### TASK 5: Build + Commit

```bash
npm run build
```

Si pasa:
```bash
git add -A
git commit -m "fix: wire SummaryViewer into SummaryView with block detection fallback

- Add block detection in SummaryView.tsx via useSummaryBlocksQuery
- Render SummaryViewer when summary has edu blocks
- Fallback to legacy HTML rendering when no blocks exist
- Complete data flow: API → blocks query → SummaryViewer → ViewerBlock → 10 renderers"

git push origin feat/block-based-summaries
```

Si NO pasa: fix errores de TypeScript/import y re-intentar hasta que compile.

### Archivos que PUEDES modificar
- `src/app/components/content/SummaryView.tsx` — PRINCIPAL
- `src/app/components/student/SummaryViewer.tsx` — si necesita ajustes de props
- `src/app/components/student/ViewerBlock.tsx` — si necesita ajustes de tipos
- `src/app/hooks/queries/useSummaryBlocksQuery.ts` — si el query necesita fix

### Archivos que NO debes modificar
- `src/app/components/roles/pages/professor/SummaryDetailView.tsx`
- `src/app/components/student/blocks/*.tsx` (renderers)
- Archivos de rutas/router
- Cualquier archivo fuera de `src/app/components/` y `src/app/hooks/`
