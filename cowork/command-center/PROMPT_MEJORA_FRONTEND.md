# PROMPT: Loop de Mejora — Frontend feat/block-based-summaries

> **Uso:** Copiar TODO este prompt en Claude Code CLI → `/loop`
> **Branch:** `feat/block-based-summaries` (ya existe, ya tiene commits)
> **Repo:** `C:\dev\axon\frontend`
> **Objetivo:** Auditoría visual pixel-perfect contra prototipo + code quality + robustness
> **La memoria se resetea cada ~10 min.** El archivo MEJORA_PROGRESS.md te dice dónde vas.

---

## 🚨 REGLA ABSOLUTA: JAMÁS TRABAJAR EN MAIN 🚨

```bash
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  echo "❌ ABORT: Estás en $CURRENT_BRANCH — PROHIBIDO."
  git checkout feat/block-based-summaries
fi
echo "✅ Branch segura: $(git branch --show-current)"
```

---

## REGLA #1: SIEMPRE EMPIEZA AQUÍ

```bash
# 1. Verificar branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  git checkout feat/block-based-summaries
fi

# 2. Leer progreso
cat MEJORA_PROGRESS.md 2>/dev/null || echo "FRESH_START"
```

- `FRESH_START` → ve a INICIALIZACIÓN
- Una task → continúa desde ahí
- `ALL_COMPLETE` → responde "✅ Loop de mejora completo"

---

## INICIALIZACIÓN (solo primera vez)

```bash
cd C:\dev\axon\frontend
git checkout feat/block-based-summaries
git pull origin feat/block-based-summaries
npm install
```

### Copiar el prototipo como referencia visual

```bash
mkdir -p .ref
cp "C:/Users/petri/OneDrive/Escritorio/AXON PROJECTO/PROJETO DESAROLLO RESUMEN/Prototipo_Resumenes_Axon_FINAL.jsx" .ref/PROTOTYPE.jsx 2>/dev/null || \
cp "C:\Users\petri\OneDrive\Escritorio\AXON PROJECTO\PROJETO DESAROLLO RESUMEN\Prototipo_Resumenes_Axon_FINAL.jsx" .ref/PROTOTYPE.jsx 2>/dev/null
if [ ! -f .ref/PROTOTYPE.jsx ]; then
  find "C:/Users/petri/OneDrive" -name "Prototipo_Resumenes_Axon_FINAL.jsx" 2>/dev/null | head -1 | xargs -I{} cp "{}" .ref/PROTOTYPE.jsx
fi
test -f .ref/PROTOTYPE.jsx && echo "✅ PROTOTYPE.jsx copiado" || echo "❌ ERROR: Buscar manualmente"
```

### Leer archivos clave para contexto

Antes de tocar nada, lee TODO esto:
- `CLAUDE.md` (reglas del repo)
- `.ref/PROTOTYPE.jsx` — **secciones clave:**
  - Líneas 1-60: Design tokens (LIGHT, DARK, CALLOUT, CALLOUT_DARK, SEVERITY)
  - Líneas 208-213: IconByName helper
  - Líneas 215-368: 8 renderers (ProseBlock → CalloutBlock)
  - Líneas 373-480: ImageReferenceBlock
  - Líneas 586-594: SectionDividerBlock
- `src/app/components/student/blocks/` — los 10 renderers implementados
- `src/app/components/student/blocks/__tests__/` — los tests
- `src/app/components/student/ViewerBlock.tsx` — el switch con los 10 cases
- `src/app/services/summariesApi.ts` — tipos SummaryBlock

### Crear MEJORA_PROGRESS.md

```bash
cat > MEJORA_PROGRESS.md << 'EOF'
# Loop de Mejora — Frontend feat/block-based-summaries
## Current: VISUAL_1
## Tasks:
- VISUAL_1: PENDING — run tests + build baseline
- VISUAL_2: PENDING — audit ProseBlock pixel-perfect
- VISUAL_3: PENDING — audit KeyPointBlock pixel-perfect
- VISUAL_4: PENDING — audit StagesBlock pixel-perfect
- VISUAL_5: PENDING — audit ComparisonBlock pixel-perfect
- VISUAL_6: PENDING — audit ListDetailBlock pixel-perfect
- VISUAL_7: PENDING — audit GridBlock + TwoColumnBlock pixel-perfect
- VISUAL_8: PENDING — audit CalloutBlock (5 variants) pixel-perfect
- VISUAL_9: PENDING — audit ImageReferenceBlock + SectionDividerBlock
- VISUAL_10: PENDING — audit IconByName completeness
- CODE_1: PENDING — TypeScript strictness (no any, proper interfaces)
- CODE_2: PENDING — defensive rendering (null/undefined/empty)
- CODE_3: PENDING — dark mode completeness
- CODE_4: PENDING — accessibility (semantic HTML, ARIA, contrast)
- CODE_5: PENDING — test coverage gaps
- CODE_6: PENDING — barrel export + import consistency
- FINAL_1: PENDING — build + all tests green
- FINAL_2: PENDING — commit + push
EOF
```

---

## ═══════════════════════════════════════
## FASE 1: BASELINE
## ═══════════════════════════════════════

### VISUAL_1: Run tests + build baseline

```bash
npm run build 2>&1 | tail -20
npx vitest run src/app/components/student/blocks/__tests__/ --reporter=verbose 2>&1
```

Registrar en MEJORA_PROGRESS.md:
- Build: ✅ o ❌
- Tests: X/Y passing
- Si algo falla → arreglar ANTES de continuar

Actualizar PROGRESS → `VISUAL_1: DONE — build OK, X/Y tests pass`

---

## ═══════════════════════════════════════
## FASE 2: AUDITORÍA VISUAL PIXEL-PERFECT
## ═══════════════════════════════════════

**Método para cada renderer:** Abre `.ref/PROTOTYPE.jsx` y el componente producción side-by-side. Compara CADA clase Tailwind contra el inline style del prototipo. Cualquier diferencia = bug.

### Tabla de referencia rápida (del prototipo)

| Token prototipo | Tailwind correcto |
|---|---|
| theme.darkTeal (#1B3B36) | text-teal-900 / bg-teal-900 |
| theme.tealAccent (#2a8c7a) | text-teal-600 |
| theme.teal50 (#e8f5f1) | bg-teal-50 |
| theme.cardBg (#FFFFFF/#1e1f25) | bg-white / dark:bg-gray-800 |
| theme.headerBg (#1B3B36/#0d0e11) | bg-teal-900 / dark:bg-gray-950 |
| theme.textPrimary (#111827/#e6e7eb) | text-gray-900 / dark:text-gray-200 |
| theme.textSecondary (#6b7280/#9ca3af) | text-gray-500 / dark:text-gray-400 |
| theme.border (#E5E7EB/#2d2e34) | border-gray-200 / dark:border-gray-700 |
| fontSize: 20, fontWeight: 700 | text-xl font-bold |
| fontSize: 17 | text-[17px] |
| fontSize: 15 | text-[15px] |
| fontSize: 13 | text-[13px] |
| fontSize: 11 | text-[11px] |
| fontSize: 10 | text-[10px] |
| lineHeight: 1.75 | leading-[1.75] |
| lineHeight: 1.7 | leading-[1.7] |
| lineHeight: 1.6 | leading-[1.6] |
| borderRadius: 12 | rounded-xl |
| borderRadius: 10 | rounded-[10px] |
| borderRadius: 8 | rounded-lg |
| padding: "20px 24px" | px-6 py-5 |
| padding: "16px 20px" | px-5 py-4 |
| padding: "14px 16px" | px-4 py-3.5 |

---

### VISUAL_2: Audit ProseBlock

Lee `.ref/PROTOTYPE.jsx` líneas 215-232 (ProseBlock) y compara con `src/app/components/student/blocks/ProseBlock.tsx`.

**Checklist del prototipo:**
- [ ] Title: `font-serif text-xl font-bold text-teal-900 dark:text-teal-400 mb-2.5`
- [ ] Body: `text-[15px] leading-[1.75] text-gray-500 dark:text-gray-400`
- [ ] Body `whitespace-pre-line` (preserva saltos de línea del content)
- [ ] Keywords `{{text}}` quedan como texto plano (no se procesan aquí)
- [ ] Image support: si `block.content.image` existe → renderizar `<img>` con `rounded-[10px] border` y caption

**Arreglar discrepancias.** Anotar en PROGRESS.

---

### VISUAL_3: Audit KeyPointBlock

Lee `.ref/PROTOTYPE.jsx` líneas 234-266 (KeyPointBlock) y compara con producción.

**Checklist:**
- [ ] FORZADO DARK: outer `bg-teal-900 dark:bg-gray-950 rounded-xl px-6 py-5` — **siempre fondo oscuro**
- [ ] Icon Zap: `size={18} color="#3cc9a8"` → `className="text-[#3cc9a8]" size={18}`
- [ ] Title: `font-serif text-[17px] font-bold text-[#3cc9a8]` — SIEMPRE color fijo, no usa theme
- [ ] Badge CRÍTICO: solo si `importance === 'critical'` → `text-[11px] bg-red-500 text-white px-2 py-0.5 rounded-[10px] font-semibold uppercase`
- [ ] Badge NO aparece si `importance === 'high'`
- [ ] Body: `text-sm leading-[1.7] text-[#d1d5db]` — SIEMPRE color fijo
- [ ] **WCAG AA:** texto claro (#3cc9a8, #d1d5db) sobre fondo oscuro (#1B3B36) ✅ contraste OK

---

### VISUAL_4: Audit StagesBlock

Lee `.ref/PROTOTYPE.jsx` líneas 268-316 (StagesBlock).

**Checklist:**
- [ ] Title: `font-serif text-xl font-bold text-teal-900 dark:text-teal-400 mb-4`
- [ ] Gradient connector line: `absolute left-[15px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-teal-600 to-red-500`
- [ ] Stage number circles: `w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center` con bg del SEVERITY color correspondiente
- [ ] SEVERITY colors mapping: `mild → bg-emerald-500 (#10b981)`, `moderate → bg-amber-500 (#f59e0b)`, `critical → bg-red-500 (#ef4444)`
- [ ] Stage cards: `rounded-[10px] px-4 py-3 border border-gray-200 dark:border-gray-700`
- [ ] Left border-l del severity color: `border-l-[3px]` con `border-l-emerald-500` / `border-l-amber-500` / `border-l-red-500`
- [ ] Stage title: `text-sm font-bold text-gray-900 dark:text-gray-200`
- [ ] Stage content: `text-[13px] text-gray-500 dark:text-gray-400 leading-[1.6]`
- [ ] Sin severity → no crash, usar color default (teal o gray)

---

### VISUAL_5: Audit ComparisonBlock

Lee `.ref/PROTOTYPE.jsx` líneas 318-368 (ComparisonBlock).

**Checklist:**
- [ ] Title: `font-serif text-xl font-bold text-teal-900 dark:text-teal-400 mb-3`
- [ ] Table wrapper: `overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700`
- [ ] `<table>` con `w-full text-sm border-collapse`
- [ ] `<thead>`: th con `px-3.5 py-2.5 bg-teal-900 dark:bg-gray-950 text-xs font-bold text-left border-b-2 border-b-teal-600`
- [ ] th highlight column: `text-[#3cc9a8]`, th normal: `text-[#d1d5db]`
- [ ] `<tbody>`: td con `px-3.5 py-2.5 border-b border-gray-200 dark:border-gray-700`
- [ ] td highlight column: `text-teal-600 dark:text-teal-400 font-semibold bg-teal-50/40 dark:bg-teal-950/40`
- [ ] Row alternation: even rows `bg-gray-50 dark:bg-gray-800/50`
- [ ] **Semantic HTML:** `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` (no divs)

---

### VISUAL_6: Audit ListDetailBlock

Lee `.ref/PROTOTYPE.jsx` líneas ~338-368 (ListDetailBlock).

**Checklist:**
- [ ] Title: `font-serif text-xl font-bold text-teal-900 dark:text-teal-400 mb-2.5`
- [ ] Intro text (si existe): `text-sm text-gray-500 dark:text-gray-400 mb-3`
- [ ] Each item row: `flex gap-3 items-start`
- [ ] Icon box: `w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center shrink-0`
- [ ] Icon inside: `size={16}` con `text-teal-600 dark:text-teal-400`
- [ ] Label: `text-sm font-semibold text-gray-900 dark:text-gray-200`
- [ ] Detail: `text-[13px] text-gray-500 dark:text-gray-400`
- [ ] Severity badge (si existe): `text-[10px] font-bold px-2 py-0.5 rounded-[10px] uppercase`
  - high → `bg-red-50 text-red-600` (dark: `bg-red-950 text-red-400`)
  - medium → `bg-amber-50 text-amber-600` (dark: `bg-amber-950 text-amber-400`)
  - low → `bg-green-50 text-green-600` (dark: `bg-green-950 text-green-400`)
- [ ] No severity → no badge rendered (no empty span)

---

### VISUAL_7: Audit GridBlock + TwoColumnBlock

**GridBlock** — lee prototipo líneas ~338-350:
- [ ] Grid: `grid gap-2.5` con `grid-cols-2` o `grid-cols-3` basado en `block.content.columns`
- [ ] Card: `bg-white dark:bg-gray-800 rounded-[10px] px-4 py-3.5 border border-gray-200 dark:border-gray-700 text-center`
- [ ] Icon: `size={20} text-teal-600 dark:text-teal-400 mx-auto mb-1.5`
- [ ] Label: `text-[13px] font-semibold text-gray-900 dark:text-gray-200`
- [ ] Detail: `text-[11px] text-gray-500 dark:text-gray-400`
- [ ] Default columns = 2 si `block.content.columns` es undefined

**TwoColumnBlock** — lee prototipo:
- [ ] Grid: `grid grid-cols-1 md:grid-cols-2 gap-4`
- [ ] Column title: `font-serif text-base font-bold text-teal-900 dark:text-teal-400 mb-2.5`
- [ ] Items: `px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700`
- [ ] Item label: `text-[13px] font-semibold text-gray-900 dark:text-gray-200`
- [ ] Item detail: `text-xs text-gray-500 dark:text-gray-400`
- [ ] Handles single column gracefully (if `columns.length === 1`)

---

### VISUAL_8: Audit CalloutBlock (5 variants)

Lee `.ref/PROTOTYPE.jsx` líneas ~350-368 (CalloutBlock) + CALLOUT/CALLOUT_DARK tokens (líneas 44-57).

**Checklist por variant:**

| Variant | Light bg | border-l color | Light accent text | Dark bg | Dark accent |
|---|---|---|---|---|---|
| tip | bg-[#f0fdf4] | border-l-emerald-500 | text-[#065f46] | dark:bg-[#0f2a1d] | dark:text-emerald-300 |
| warning | bg-[#fffbeb] | border-l-amber-500 | text-[#92400e] | dark:bg-[#2a2010] | dark:text-amber-300 |
| clinical | bg-[#eff6ff] | border-l-blue-500 | text-[#1e40af] | dark:bg-[#0f1a2e] | dark:text-blue-300 |
| mnemonic | bg-[#f5f3ff] | border-l-violet-500 | text-[#5b21b6] | dark:bg-[#1a1530] | dark:text-violet-300 |
| exam | bg-[#fef2f2] | border-l-red-500 | text-[#b91c1c] | dark:bg-[#2a1215] | dark:text-red-300 |

- [ ] Outer: `rounded-xl px-5 py-4 border-l-4`
- [ ] Icon: variant's icon component, `size={18}`, accent color
- [ ] Label: `text-xs font-bold uppercase tracking-wide` con accent color
- [ ] Title: `font-serif text-base font-bold mb-1.5` con text-gray-900/dark:text-gray-200
- [ ] Body: `text-sm leading-relaxed whitespace-pre-line` con text-gray-600/dark:text-gray-400
- [ ] Unknown variant → defaults to `tip` (no crash)
- [ ] **Icons correctos por variant:** tip=Lightbulb, warning=AlertTriangle, clinical=Stethoscope, mnemonic=Brain, exam=Target

---

### VISUAL_9: Audit ImageReferenceBlock + SectionDividerBlock

**ImageReferenceBlock:**
- [ ] Con `image_url`: `<img>` con `max-w-full rounded-[10px] border border-gray-200 dark:border-gray-700`
- [ ] Caption: `text-[11px] italic text-gray-400 dark:text-gray-500 mt-1 text-center`
- [ ] Sin `image_url`: placeholder `rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-7 bg-gray-100 dark:bg-gray-950 text-center`
- [ ] Placeholder icon: `Image` from lucide-react, `size={36}`, `text-gray-300 dark:text-gray-600 mx-auto mb-2`
- [ ] Placeholder text (description): `text-sm text-gray-400 dark:text-gray-500`
- [ ] Alt text en `<img>`: usa `block.content.caption` o `block.content.description`

**SectionDividerBlock:**
- [ ] Container: `flex items-center gap-4 py-2`
- [ ] Lines: `flex-1 h-px bg-gray-200 dark:bg-gray-700`
- [ ] Label (si existe): `text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap`
- [ ] Sin label: solo dos lines con el gap (o una sola `<hr>`)

---

### VISUAL_10: Audit IconByName completeness

Lee `.ref/PROTOTYPE.jsx` líneas 208-213 y compara con `blocks/IconByName.tsx`.

**Checklist:**
- [ ] Todos estos íconos están importados y mapeados:
  Activity, Heart, Pill, Stethoscope, Shield, FlaskConical, Clock, Lightbulb, Target, AlertCircle, Brain, Info, AlertTriangle, HelpCircle, CheckCircle2, CircleDot
- [ ] CircleDot es el fallback para nombres desconocidos
- [ ] Props: `{ name: string; size?: number; className?: string }`
- [ ] Default size = 16
- [ ] No crash si `name` es undefined/null → usa fallback

---

## ═══════════════════════════════════════
## FASE 3: CODE QUALITY
## ═══════════════════════════════════════

### CODE_1: TypeScript strictness

Revisar TODOS los archivos en `src/app/components/student/blocks/`:

- [ ] Ningún `any` innecesario — usar `block.content` tipado o al menos `Record<string, unknown>`
- [ ] Props interface: `{ block: SummaryBlock }` usando el import de `summariesApi`
- [ ] Arrays accedidos con optional chaining: `block.content.items?.map(...)` no `block.content.items.map(...)`
- [ ] Verificar que `SummaryBlock` en `summariesApi.ts` tiene los campos correctos (id, summary_id, type, content, order_index, is_active, created_at, updated_at, style?, metadata?)

```bash
# Quick check — buscar "any" en los renderers
grep -n ": any" src/app/components/student/blocks/*.tsx
grep -n "as any" src/app/components/student/blocks/*.tsx
```

---

### CODE_2: Defensive rendering (null/undefined/empty)

Cada renderer debe manejar gracefully:
- [ ] `block.content` es `{}` → no crash, render vacío o mensaje fallback
- [ ] `block.content.title` es `undefined` → no render `undefined` como texto
- [ ] `block.content.items` es `[]` → no crash, render vacío
- [ ] `block.content.items` es `undefined` → no crash (optional chaining)
- [ ] `block.content.items[n]` tiene campos faltantes → no crash

**Verificar para cada tipo:**
- stages: `items` vacío, item sin `severity`
- comparison: `headers` vacío, `rows` vacío, `highlight_column` null
- list_detail: `items` vacío, item sin `icon`, item sin `severity`
- grid: `items` vacío, `columns` undefined
- two_column: `columns` vacío, column sin `items`
- callout: `variant` no reconocido
- image_reference: sin `image_url`, sin `caption`, sin `description`
- section_divider: sin `label`

---

### CODE_3: Dark mode completeness

- [ ] CADA clase de color/bg/border tiene su contraparte `dark:`
- [ ] Ningún color hardcodeado sin dark variant (excepto KeyPointBlock que es forced dark)
- [ ] CalloutBlock usa los 5 pares light/dark correctamente
- [ ] Severity badges tienen dark variants

```bash
# Quick audit — buscar clases sin dark counterpart
grep -n "text-gray-" src/app/components/student/blocks/*.tsx | grep -v "dark:"
grep -n "bg-gray-" src/app/components/student/blocks/*.tsx | grep -v "dark:"
grep -n "border-gray-" src/app/components/student/blocks/*.tsx | grep -v "dark:"
```

**NOTA:** No todo necesita `dark:` — un `text-gray-500` que ya tiene `dark:text-gray-400` en la misma cadena de clases está OK. El grep es para identificar CANDIDATOS, no bugs automáticos.

---

### CODE_4: Accessibility

- [ ] ComparisonBlock usa `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>` (semántico)
- [ ] `<th>` tiene `scope="col"`
- [ ] Images tienen `alt` text significativo
- [ ] KeyPointBlock: contraste ratio ≥ 4.5:1 (texto #3cc9a8 sobre bg #1B3B36 = ~5.2:1 ✅)
- [ ] ComparisonBlock headers: contraste ratio #d1d5db sobre #1B3B36 = ~10:1 ✅
- [ ] Callout icons no son la única forma de comunicar el tipo (hay label texto)
- [ ] SectionDividerBlock: `role="separator"` en el container (o usar `<hr>`)

---

### CODE_5: Test coverage gaps

Revisar tests existentes y agregar lo que falte:

```bash
npx vitest run src/app/components/student/blocks/__tests__/ --reporter=verbose 2>&1
```

**Verificar que existen tests para:**
- [ ] Cada uno de los 10 tipos (smoke render)
- [ ] Cada variant de CalloutBlock (5 variants)
- [ ] Edge cases: empty content, missing fields
- [ ] KeyPointBlock: badge aparece solo con `importance: 'critical'`
- [ ] ComparisonBlock: highlight column styling
- [ ] ListDetailBlock: severity badges (high, medium, low, none)
- [ ] GridBlock: 2 columns vs 3 columns
- [ ] ImageReferenceBlock: con imagen vs sin imagen
- [ ] SectionDividerBlock: con label vs sin label
- [ ] ViewerBlock integration: 10 types se rutean correctamente

Si faltan → agregarlos. Si están todos → marcar DONE.

---

### CODE_6: Barrel export + import consistency

- [ ] `blocks/index.ts` exporta los 10 renderers + IconByName
- [ ] ViewerBlock importa del barrel `from './blocks'` (no imports directos)
- [ ] No hay imports circulares
- [ ] Cada renderer hace `export default function XBlock`

```bash
# Verificar barrel
cat src/app/components/student/blocks/index.ts
# Verificar imports en ViewerBlock
grep "from.*blocks" src/app/components/student/ViewerBlock.tsx
```

---

## ═══════════════════════════════════════
## FASE 4: FINAL GREEN + COMMIT
## ═══════════════════════════════════════

### FINAL_1: Build + all tests green

```bash
# 1. Build completo
npm run build 2>&1 | tail -20

# 2. Todos los tests de blocks
npx vitest run src/app/components/student/blocks/__tests__/ --reporter=verbose

# 3. Tests de integración
npx vitest run src/app/components/student/__tests__/ --reporter=verbose 2>/dev/null

# 4. Verificar branch
git branch --show-current
# DEBE decir feat/block-based-summaries — si dice main, ABORTAR
```

Si todo verde → FINAL_2. Si algo falla → arreglar y re-run.

---

### FINAL_2: Commit + push

```bash
# Verificar branch (última vez)
BRANCH=$(git branch --show-current)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "❌ ABORT: EN MAIN"
  exit 1
fi

# Ver qué cambió
git diff --stat
git diff --cached --stat

# Stage cambios
git add src/app/components/student/blocks/ src/app/components/student/__tests__/ src/app/components/student/ViewerBlock.tsx src/app/services/summariesApi.ts

# Solo si SummaryViewer fue modificado
git diff --name-only src/app/components/student/SummaryViewer.tsx 2>/dev/null | grep -q . && git add src/app/components/student/SummaryViewer.tsx

git diff --cached --stat
git commit -m "refactor: pixel-perfect audit + hardening block renderers

- Visual audit: all 10 renderers match prototype exactly
- TypeScript: eliminate unnecessary any, proper typing
- Defensive rendering: handle null/undefined/empty gracefully
- Dark mode: complete light/dark coverage
- Accessibility: semantic HTML, ARIA, WCAG AA contrast
- Test coverage: additional edge case tests

Part of: block-based summaries (Fase 2 improvement loop)"

git push origin feat/block-based-summaries
```

```bash
cat > MEJORA_PROGRESS.md << 'EOF'
# Loop de Mejora — Frontend feat/block-based-summaries
## Current: ALL_COMPLETE
## All reviews completed successfully.
EOF
```

---

## REGLAS CRÍTICAS

0. **🚨 JAMÁS TRABAJAR EN MAIN.** Verificar branch al inicio de CADA ciclo.
1. **Leer MEJORA_PROGRESS.md AL INICIO de cada ciclo.**
2. **Leer el prototipo `.ref/PROTOTYPE.jsx` ANTES de auditar cada renderer.**
3. **NO instalar dependencias nuevas.**
4. **NO cambiar la API pública** de ningún componente (props, exports).
5. **NO cambiar estructura del layout** (sidebar, header, navegación). Solo los 10 renderers.
6. **Si un cambio rompe tests o build** → revertir ese cambio específico.
7. **Pixel-perfect = mismos valores.** Si el prototipo dice `padding: "20px 24px"` → Tailwind debe ser `px-6 py-5`. No `p-5`, no `px-5 py-4`.
8. **Antes de git push:** `git branch --show-current` — si dice main, ABORTAR.
9. **Anotar TODO lo que cambias** en MEJORA_PROGRESS.md — esto es tu memoria.
