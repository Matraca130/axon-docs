# AUDITORÍA DEL PROCESO DE GENERACIÓN DE RESÚMENES — AXON

**Fecha:** 23 de marzo de 2026
**Revisor:** Claude Code Agent
**Alcance:** Análisis de renderización, calidad de datos, cobertura de workflow, patrones de diseño y código

---

## RESUMEN EJECUTIVO

Se identificaron **14 hallazgos críticos, importantes y de mejora** en el proceso de generación de resúmenes Axon. Los más graves:

1. **🔴 CRÍTICO:** Mismatch entre variantes de callout soportadas en código vs. workflow (falta `tip`, `warning`, `clinical`)
2. **🔴 CRÍTICO:** Grid block ignora completamente el campo `columns` — siempre renderiza con 3 columnas CSS hardcodeadas
3. **🔴 CRÍTICO:** Campo `importance` en `key_point` no se usa en resúmenes reales (Farmacoepidemiología sin este campo)
4. **🟡 IMPORTANTE:** `highlight_column` en comparison table usa índice 1 pero no especifica claramente si es 0-indexed o 1-indexed
5. **🟡 IMPORTANTE:** Solo 2 de 5 variantes de callout documentadas en workflow se implementan en código

---

## I. HALLAZGOS POR CATEGORÍA

### A. PROBLEMAS DE RENDERIZACIÓN

#### A.1 Grid Block No Respeta Parámetro `columns` 🔴 CRÍTICO

**Ubicación:** `Prototipo_v1_pro.html` líneas 1247-1251

```javascript
function renderGrid(b) {
  var items = b.items.map(function(it) {
    return '<div class="g-item"><div class="g-ico">'+getIcon(it.icon)+'</div><div><div class="g-label">'+it.label+'</div><div class="g-detail">'+it.detail+'</div></div></div>';
  }).join('');
  return '<div><h3 class="block-title">'+b.title+'</h3><div class="grid-items">'+items+'</div></div>';
}
```

**Problema:**
- El bloque define `columns` en los datos (ej: `{ id:"b6", type:"grid", title:"...", columns:3, items:[...] }`)
- La función `renderGrid` **ignora completamente** el parámetro `columns`
- El CSS `.grid-items` está hardcodeado a `grid-template-columns: repeat(3, 1fr)`
- Si un bloque necesita 2 columnas o 4 columnas, **no hay forma de cambiarlo sin editar CSS**

**Impacto:** El workflow permite elegir columnas (Fase 2, línea 70 de WORKFLOW_RESUMENES_AXON.md), pero la implementación no lo soporta.

**Recomendación:**
```javascript
function renderGrid(b) {
  var cols = b.columns || 3;  // Usar parámetro con default
  var gridClass = 'grid-col-' + cols;  // grid-col-2, grid-col-3, grid-col-4
  var items = b.items.map(function(it) {
    return '<div class="g-item"><div class="g-ico">'+getIcon(it.icon)+'</div><div><div class="g-label">'+it.label+'</div><div class="g-detail">'+it.detail+'</div></div></div>';
  }).join('');
  return '<div><h3 class="block-title">'+b.title+'</h3><div class="grid-items '+gridClass+'">'+items+'</div></div>';
}
```

Y agregar CSS dinámico:
```css
.grid-items.grid-col-2 { grid-template-columns: repeat(2, 1fr); }
.grid-items.grid-col-3 { grid-template-columns: repeat(3, 1fr); }
.grid-items.grid-col-4 { grid-template-columns: repeat(4, 1fr); }
```

---

#### A.2 Mismatch de Variantes de Callout: Código vs. Workflow 🔴 CRÍTICO

**Código implementado** (`Prototipo_v1_pro.html` línea 1262-1267):
```javascript
var icons = { clinical: SVG.stethoscope, exam: SVG.target, mnemonic: SVG.brain };
var labels = { clinical:'Correlación Clínica', exam:'Importante para Examen', mnemonic:'Mnemotecnia' };
var colors = { clinical:'#3b82f6', exam:'#c4704b', mnemonic:'#8b5cf6' };
```

**Variantes documentadas en workflow** (línea 74-79 de WORKFLOW_RESUMENES_AXON.md):
- `exam`
- `clinical`
- `mnemonic`
- `tip` ← **NO IMPLEMENTADO**
- `warning` ← **NO IMPLEMENTADO**

**Datos reales en Farmacoepidemiologia.html:**
- b11: `variant:"exam"`
- b12: `variant:"mnemonic"`
- **Ninguno con `tip` o `warning`**

**Impacto:**
- El workflow recomienda usar `tip` y `warning` para callouts generales
- Si alguien intenta usar estos, el bloque renderizará sin estilo ni ícono
- En JSX sí existen definiciones para `tip` y `warning` (línea 28-32 de Prototipo_Resumenes_Axon.jsx)

**Recomendación:**
```javascript
var icons = {
  clinical: SVG.stethoscope,
  exam: SVG.target,
  mnemonic: SVG.brain,
  tip: SVG.lightbulb,        // Agregar
  warning: SVG.alertTriangle  // Agregar
};
var labels = {
  clinical:'Correlación Clínica',
  exam:'Importante para Examen',
  mnemonic:'Mnemotecnia',
  tip: 'Tip',                 // Agregar
  warning: 'Atención'         // Agregar
};
var colors = {
  clinical:'#3b82f6',
  exam:'#c4704b',
  mnemonic:'#8b5cf6',
  tip: '#10b981',             // Verde
  warning: '#f59e0b'          // Naranja
};
```

---

#### A.3 Campo `importance` en Key Point Blocks No Se Usa 🔴 CRÍTICO

**Especificación de código** (`Prototipo_v1_pro.html` línea 1218-1220):
```javascript
function renderKeyPoint(b) {
  var badge = b.importance === 'critical' ? ' <span class="critical-badge">CRÍTICO</span>' : '';
  return '<div class="key_point-block">...'+badge+'...</div>';
}
```

**Código renderiza:**
- `importance: "critical"` → Mostrar badge rojo "CRÍTICO"
- `importance: "high"` o cualquier otro → **Sin badge visual**

**Datos reales:**
- `Resumen_Farmacoepidemiologia.html`: **0 key_point blocks tienen el campo `importance` definido**
- `Prototipo_v1_pro.html` (aterosclerosis): Sí lo usa: `importance:"critical"`

**Problema:**
- Según workflow (línea 46), field `importance` debe tener:
  - `"critical"` para concepto fundacional
  - `"high"` para conceptos importantes pero no únicos
- Los bloques reales no lo usan, así que la categorización se pierde
- El badge solo aparece con `"critical"`, nada para `"high"`

**Recomendación:**
```javascript
function renderKeyPoint(b) {
  var importance = b.importance || 'normal';
  var badgeHtml = '';
  if (importance === 'critical') {
    badgeHtml = ' <span class="critical-badge" style="background:#ef4444;">CRÍTICO</span>';
  } else if (importance === 'high') {
    badgeHtml = ' <span class="critical-badge" style="background:#f59e0b;">IMPORTANTE</span>';
  }
  return '<div class="key-point-block"><div class="key-point-header">...'+badgeHtml+'</div>...';
}
```

**Además, en WORKFLOW_RESUMENES_AXON.md línea 6-7:** Documentar explícitamente que es obligatorio llenar `importance` en cada `key_point`.

---

#### A.4 Variación de `highlight_column` en Comparison Table: Índice Ambiguo 🟡 IMPORTANTE

**Datos reales** (`Resumen_Farmacoepidemiologia.html`):
```javascript
{ id:"b10", type:"comparison", ..., highlight_column:1 }
```

**Código de renderización** (`Prototipo_v1_pro.html` línea 1231-1234):
```javascript
var ths = b.headers.map(function(h,i){ return '<th scope="col"'+(i===b.highlight_column?' class="hl"':'')+'>'+h+'</th>'; }).join('');
var rows = b.rows.map(function(row){ return '<tr>'+row.map(function(c,i){ return i===0?'<th scope="row" ...>':
  '<td'+(i===b.highlight_column?' class="hl-col"':'')+'>'+c+'</td>'; }).join('')+'</tr>'; }).join('');
```

**Ambigüedad:**
- La comparación: `i === b.highlight_column`
- Si `highlight_column: 1`, ¿se refiere a la columna 1 (0-indexed) o la segunda columna (1-indexed)?
- En HTML tables: fila `<th scope="row">` cuenta como columna 0
- Así que `highlight_column: 1` = **segunda columna de datos** = aparentemente correcto

**Pero en la estructura de datos:**
```javascript
headers: ["Característica", "Idiosincrasia", "Hipersensibilidad", "Hiper-reaccionantes"]
rows: [["Dolor", "...", "...", "..."], ...]
```

- `headers[0]` = "Característica" (columna de criterios)
- `headers[1]` = "Idiosincrasia" (primera opción a comparar)
- Si `highlight_column: 1`, se destaca "Idiosincrasia"

**Problema:** No está documentado en el código ni en workflow. Usuario puede confundirse.

**Recomendación:** En WORKFLOW_RESUMENES_AXON.md línea 56, aclarar:
```
**Campo `highlight_column`:** índice 0-based de la columna a destacar.
  - 0 = primera columna (usualmente labels/criterios) — NO RECOMENDADO
  - 1, 2, 3... = columnas de datos
  Ejemplo: headers: ["Criterio", "Opción A", "Opción B"], highlight_column: 2
           → destaca "Opción B"
```

---

### B. PROBLEMAS DE CALIDAD DE DATOS

#### B.1 Campo `importance` Missing en Key Point Blocks 🔴 CRÍTICO

**Impacto:** Ya cubierto en A.3. Agregar acción: todos los `key_point` bloques DEBEN llenar este campo.

**Validación necesaria:** En insertBlock() (línea 1970-1980 de Prototipo_v1_pro.html):
```javascript
case 'key_point':
  newBlock.content = 'Escribe el concepto clave aquí...';
  newBlock.importance = 'high';  // ← Agregar default
  break;
```

Actual: ✗
Necesario: `newBlock.importance = 'high'` (o requerir selección explícita en UI)

---

#### B.2 Block IDs Secuenciales Pero No Validados 🟢 NICE-TO-HAVE

**Datos reales** (Farmacoepidemiologia):
- IDs: b1, b2, b3, ... b12 ✓ Secuenciales
- BLOCK_MASTERY tiene exactamente estos 12 ✓ Coincide

**Datos reales** (Aterosclerosis en JSX):
- IDs: b1, b2, ... b12 ✓ Consistente

**Pero:** No hay validación automática. Si alguien duplica un bloque manualmente, podría haber:
- Gaps (b1, b2, b4)
- Duplicados (b1, b1_copy)
- BLOCK_MASTERY quedaría con claves huérfanas

**Recomendación:** Agregar función de validación (no crítica, pero buena práctica):
```javascript
function validateBlockConsistency(blocks, mastery) {
  const blockIds = new Set(blocks.map(b => b.id));
  const masteryIds = new Set(Object.keys(mastery));

  const orphanMastery = [...masteryIds].filter(id => !blockIds.has(id));
  const unmappedBlocks = [...blockIds].filter(id => !masteryIds.has(id));

  if (orphanMastery.length) console.warn('Mastery entries sin bloques:', orphanMastery);
  if (unmappedBlocks.length) console.warn('Bloques sin entrada en mastery:', unmappedBlocks);
}
```

---

#### B.3 Keywords {{syntax}} Funciona pero Sin Validación 🟢 NICE-TO-HAVE

**Observación:** Los keywords se referencian correctamente con `{{keyword_id}}` en bloques.

**Ejemplo correcto:**
```javascript
content: "La {{aterosclerosis}} es una enfermedad inflamatoria..."
```

**Renderización:** `renderText()` (línea 1187-1207) detecta y reemplaza correctamente con `KeywordChip`.

**Pero:** No hay validación si se intenta referenciar un keyword que no existe:
```javascript
content: "El {{keyword_inexistente}} causa..."
// → Se renderiza como <span>{{keyword_inexistente}}</span> sin error
```

**Recomendación:** Agregar validación (no crítica):
```javascript
function validateKeywordReferences(blocks, keywords) {
  blocks.forEach(block => {
    const refs = (block.content || '').match(/\{\{([^}]+)\}\}/g) || [];
    refs.forEach(ref => {
      const kw = ref.slice(2, -2);  // Remove {{ }}
      if (!keywords[kw]) {
        console.warn(`Keyword no existe: "${kw}" en bloque ${block.id}`);
      }
    });
  });
}
```

---

### C. GAPS EN EL WORKFLOW

#### C.1 Workflow No Cubre Quiz Generation Strategy 🟡 IMPORTANTE

**Estado actual:**
- WORKFLOW_RESUMENES_AXON.md Fase 5 (línea 131-139) describe "Criterios para preguntas de quiz"
- Pero es muy breve y no especifica **cómo mapear preguntas a bloques**

**Datos reales:**
- En `Resumen_Farmacoepidemiologia.html` hay ~15 preguntas pero no está clara su asignación a bloques
- QUIZ_DATA no se vé estructura en datos JSON de bloques

**Ejemplo de quiz encontrado:**
```javascript
{ q:'Según la OMS, ¿qué estudia la farmacoepidemiología?',
  opts:['Mecanismos...', 'Formulación...', 'Uso y efectos en grandes poblaciones', ...],
  correct:2 }
```

- `correct: 2` → ¿0-indexed o 1-indexed? (probablemente 0-indexed = opción C)

**Recomendación:** Expandir Fase 5 del workflow con:
```markdown
### Quiz: Mapeo a Bloques

El quiz NO es un bloque de contenido — es metadata asociada a bloques específicos.

**Estructura recomendada en JSON:**
```json
{
  "id": "b7",
  "type": "list_detail",
  ...
  "quiz": [
    {
      "q": "¿Cuál es la medida más importante para comparar riesgos?",
      "opts": ["Incidencia Acumulada", "Riesgo Relativo", "Odds Ratio", "NNT"],
      "correct": 2,  // 0-indexed: opción C (Odds Ratio) — FALSO, es B (RR)
      "explanation": "El Riesgo Relativo es la medida fundamental..."
    }
  ]
}
```

**Reglas:**
- 1 pregunta por concepto clave, no por bloque
- `correct` es índice 0-based
- Incluir explicación de la respuesta correcta
- Opciones incorrectas: distractores plausibles, no absurdos
```

---

#### C.2 Workflow No Menciona Block Images 🟡 IMPORTANTE

**Observación:**
- WORKFLOW_RESUMENES_AXON.md cubre `image_reference` (línea 82-84)
- Pero la mayoría de bloques pueden tener imágenes attachadas (prose, stages, callout, etc.)

**Datos reales:**
- `Prototipo_v1_pro.html`: Función `renderAttachedImage()` (línea 1352-1363) soporta imágenes en cualquier bloque
- Pero no hay directrices en workflow sobre **cuándo y cómo** usarlas

**Recomendación:** Agregar a Fase 2 del workflow:
```markdown
### Imágenes y Diagramas

Dos tipos de uso:

**1. Image Reference Block**
Usar cuando: la imagen ES el contenido (ej: anatomía, estructura)
- Se renderiza como componente standalone
- Requiere descripción (`description`) y caption

**2. Image Attached**
Usar cuando: la imagen COMPLEMENTA el texto (ej: diagrama en prose, gráfico en stages)
- Se flota junto al contenido (left/right)
- Requiere caption
- Tamaños disponibles: sm (pequeño), md (mediano), lg (grande)

No sobrecargar — máximo 1-2 imágenes por tema.
```

---

#### C.3 Workflow No Documenta Límites/Recomendaciones de Contenido 🟡 IMPORTANTE

**Observación:**
- El workflow es flexible (ej: "no hay límite de repetición de bloques")
- Pero **sin guía sobre cuándo es "demasiado"**

**Ejemplo:** ¿Cuántos items en un `list_detail` son aceptables?
- Si > 10, ¿dividir en dos bloques?
- Si < 3, ¿cambiar a prose?

**Recomendación:** Agregar a Fase 6 (Validación):
```markdown
### Límites Recomendados

- **Prose:** 200-400 palabras máximo. Si > 500, dividir en dos bloques.
- **Stages:** 3-5 etapas típicas. Si > 8, usar comparison o list_detail.
- **List Detail:** 4-8 items típicos. Si > 10, crear dos bloques o usar grid.
- **Grid:** 4-12 items (2-4 por fila). Si > 12, usar list_detail.
- **Comparison:** 2-4 columnas. Si > 5 dimensiones, repensar la estructura.
- **Callout:** máx 3 por tema. Si > 4, el contenido interrumpido confunde.
- **Keywords:** 5-10 por tema. Si > 12, probablemente marcar términos que no merecen popup.
```

---

### D. PROBLEMAS DE PATRONES DE DISEÑO

#### D.1 Stages Block: Severity vs. Stage Order 🟡 IMPORTANTE

**Observación:** En `stages`, cada item tiene:
- `stage`: número (1, 2, 3...)
- `severity`: "mild", "moderate", "critical"

**Confusión potencial:**
```javascript
{ stage: 3, title: "Formación de células espumosas",
  severity: "moderate", ... }
```

- `stage: 3` → es el tercer paso (orden secuencial)
- `severity: "moderate"` → cuán grave/importante es

**En workflow** (línea 51):
> Campo `severity`: refleja la complejidad o importancia clínica de cada etapa, NO el orden.

✓ Claramente documentado. **Sin problema aquí.**

**Pero visual podría mejorarse:** En renderización (línea 1226), el color del número se basa en severity:
```javascript
<div class="stage-num '+s.severity+'">'+s.stage+'</div>
```

- Etapa 3 podría ser roja (crítica) aunque sea paso intermedio
- **Podría confundir:** ¿es rojo porque es urgente o porque es grave?

**Recomendación:** Aclaración en workflow:
```markdown
El color del número refleja la IMPORTANCIA, no el orden:
- Verde (mild): paso necesario pero de menor impacto
- Naranja (moderate): paso crítico en la secuencia
- Rojo (critical): consecuencias graves si se omite o falla

Ejemplo: Ruptura de placa (etapa 5, critical) es última pero roja porque tiene consecuencias mortales.
```

---

#### D.2 Callout Variant Colors No Están en Workflow 🟢 NICE-TO-HAVE

**Observación:**
- Código de callout define colores: `clinical:'#3b82f6'` (azul), `exam:'#c4704b'` (marrón), `mnemonic:'#8b5cf6'` (púrpura)
- Workflow (línea 74-79) describe los 5 tipos pero **no menciona colores asignados**

**Recomendación:** Agregar a workflow:
```markdown
### Callout Variants — Colores y Semántica

| Variant | Color | Ícono | Cuándo usar |
|---------|-------|-------|-------------|
| `tip` | Verde (#10b981) | Bombilla | Consejo general de estudio |
| `warning` | Naranja (#f59e0b) | Alerta | Error común o concepto peligroso |
| `clinical` | Azul (#3b82f6) | Estetoscopio | Caso clínico o aplicación real |
| `exam` | Marrón (#c4704b) | Target | Pregunta de examen frecuente |
| `mnemonic` | Púrpura (#8b5cf6) | Cerebro | Truco de memoria |

Los colores son consistentes across prototipos (HTML y JSX).
```

---

### E. PROBLEMAS DE CÓDIGO

#### E.1 Función `renderImageRef` Tiene Lógica Compleja e Inconsistente 🟡 IMPORTANTE

**Ubicación:** `Prototipo_v1_pro.html` línea 1273-1286

```javascript
function renderImageRef(b) {
  // ... SVG bigIcon setup ...
  if (b.imageData) {
    return '<div...>' +
      (isEditing ? renderImageToolbar(...) : '') +
      '<img src="'+b.imageData+'" alt="'+(b.description||'')+'">' +
      '<div class="block-image-caption"'+ editAttr(b.id,'caption') +'>'+(b.caption||'Agregar caption...')+'</div>' +
    '</div>';
  }
  return '<div class="img-ref"><div class="img-ref-placeholder"...' +
    (isEditing ? '<button...onclick="pickImage(\''+b.id+'\')"...' : '') +
    ...
}
```

**Problemas:**
1. **Inconsistencia:** Cuando `imageData` existe, muestra img + caption. Cuando no, muestra placeholder.
2. **placeholder fallback:** Si el bloque es tipo `image_reference` pero sin imagen aún, muestra UI para agregar.
3. **caption fallback:** En estudiante mode, si no hay caption dice "Agregar caption..." (que es UI de editor)

**Recomendación:**
```javascript
function renderImageRef(b) {
  var bigIcon = SVG.fileText.replace(/width="16"/, 'width="36"').replace(/height="16"/, 'height="36"');

  if (!b.imageData) {
    // Modo estudiante: imagen no cargada, mostrar placeholder apenas
    if (!isEditing) {
      return '<div class="img-ref-placeholder-student">' +
        '<span style="color:var(--textSecondary)">'+bigIcon+'</span>' +
        '<div class="img-ref-text">'+(b.description||'[Imagen no disponible]')+'</div>' +
        '</div>';
    }
    // Modo editor: placeholder interactivo
    return '<div class="img-ref"><div class="img-ref-placeholder" onclick="pickImage(\''+b.id+'\')" style="cursor:pointer;">' +
      '<span style="color:var(--textSecondary)">'+bigIcon+'</span>' +
      '<div class="img-ref-text">'+(b.description||'[Sin imagen]')+'</div>' +
      '<button class="img-ref-btn" onclick="event.stopPropagation();pickImage(\''+b.id+'\')">+ Agregar Imagen</button>' +
      '</div></div>';
  }

  // Imagen cargada: mostrar
  var sizeClass = 'img-size-'+(b.imageSize||'md');
  return '<div style="text-align:center;"><div class="block-image-wrap '+sizeClass+'" style="display:inline-block;">' +
    (isEditing ? renderImageToolbar(b.id, b.imageSize||'md', 'none') : '') +
    '<img src="'+b.imageData+'" alt="'+(b.description||'')+'">' +
    '<div class="block-image-caption"'+ editAttr(b.id,'caption') +'>'+(b.caption||'')+'</div>' +
    '</div></div>';
}
```

---

#### E.2 renderBlocks() Function No Valida Block Data 🟡 IMPORTANTE

**Ubicación:** `Prototipo_v1_pro.html` línea 2215+

```javascript
function renderBlocks() {
  var wrapper = document.getElementById('documentWrapper');
  var docWrap = document.querySelector('.document-wrapper');

  if (BLOCKS.length === 0) {
    docWrap.classList.toggle('editor-active', isEditing);
    // ... empty state ...
  }

  // Itera BLOCKS sin validación
  BLOCKS.forEach(function(block, idx) {
    // ... renderBlockContent(block) ...
  });
}
```

**Problema:** Si un bloque tiene datos faltantes:
```javascript
{ id: 'b3', type: 'comparison' }  // Falta headers, rows, highlight_column
```

La función `renderComparison` intentaría hacer `b.headers.map()` y **error en consola**, pero no amable.

**Recomendación:** Agregar validación mínima:
```javascript
function validateBlock(block) {
  if (!block.id) { console.error('Block sin ID', block); return false; }
  if (!block.type) { console.error('Block sin type', block); return false; }

  const required = {
    'prose': ['title', 'content'],
    'key_point': ['title', 'content', 'importance'],
    'stages': ['title', 'items'],
    'comparison': ['title', 'headers', 'rows', 'highlight_column'],
    'list_detail': ['title', 'items'],
    'grid': ['title', 'items', 'columns'],
    'two_column': ['title', 'columns'],
    'callout': ['title', 'content', 'variant'],
    'image_reference': ['title', 'description'],
    'section_divider': ['title']
  };

  const reqs = required[block.type] || [];
  for (let field of reqs) {
    if (!block[field] && block[field] !== 0) {
      console.warn(`Block ${block.id} (${block.type}) missing field: ${field}`);
      return false;
    }
  }
  return true;
}

// En renderBlocks:
BLOCKS.forEach(function(block, idx) {
  if (!validateBlock(block)) { console.warn('Skipping invalid block'); return; }
  // ... renderBlockContent(block) ...
});
```

---

#### E.3 SVG Object Not Exported/Available in Some Contexts 🟢 NICE-TO-HAVE

**Observación:**
- `Prototipo_v1_pro.html` define `var SVG = { ... }` inline (línea ~800+)
- `Prototipo_Resumenes_Axon.jsx` importa de lucide-react: `import { ... Heart, Pill, ... } from "lucide-react"`
- Si alguien intenta usar SVG map en otro archivo, **no disponible**

**Recomendación:** Crear archivo separado `icons.js`:
```javascript
// icons.js
export const SVG = {
  activity: '<svg width="16" height="16"...>...</svg>',
  heart: '<svg width="16" height="16"...>...</svg>',
  // ... etc
};

export const ICON_MAP = {
  activity: SVG.activity,
  heart: SVG.heart,
  // ...
};
```

Luego en HTML:
```html
<script src="icons.js"></script>
<script src="prototipo_v1_pro.html"></script>
```

---

### F. ANTI-PATRONES OBSERVADOS

#### F.1 "Block Stuffing" Parcial en Farmacoepidemiologia 🟢 NICE-TO-HAVE

**Observación:**
- Resumen tiene 12 bloques (tipo distribution: 1 key_point, 3 prose, 1 stages, 1 list_detail, 1 grid, 2 callout, 1 two_column, 1 comparison)
- La distribución es **razonable** para un tema

**Pero:**
- 3 bloques `prose` podrían ser 2 + 1 callout (menos redundancia)
- 2 callout consecutivos (b11 exam, b12 mnemonic) — ideal sería 1 sustancia entre ellos

**Recomendación:** En feedback de usuario, sugerir:
```
💡 Tip: Evita 2+ callouts consecutivos. Inserta contenido sustancial entre ellos para mantener flujo de lectura.
```

---

#### F.2 Grid vs. List Detail: Frontera Difusa 🟢 NICE-TO-HAVE

**Observación:**
- b6 (Farmacoepidemiologia): `grid` con 6 items (características del ensayo ideal)
- Pero items solo tienen label + detail cortos

**Pregunta:** ¿Por qué no `two_column`?

**Según workflow** (línea 67-70):
- `grid`: 4+ items CORTOS e independientes
- b6 tiene 6 items cortos → correcto uso de grid

**Pero visual:** En CSS, grid-items usa `repeat(3, 1fr)` = 2 filas × 3 cols, muy comprimido.

**Recomendación:** En workflow agregar:
```markdown
**Guía: Grid vs. List Detail vs. Two Column**

| Bloque | Cuando usar | Items | Layout |
|--------|-------------|-------|--------|
| `grid` | Vista de galería, características rápidas | 4-12, cortos | Grid 2-4 cols |
| `list_detail` | Items con explicaciones | 3-8 items | Vertical, expandible |
| `two_column` | Dicotomía clara (A vs. B) | 2 grupos paralelos | 2 columnas iguales |

Decisión: **¿Necesita más de 1-2 líneas de detalle?** → use `list_detail`
```

---

## II. HALLAZGOS SUMARIZADOS POR SEVERIDAD

### 🔴 CRÍTICOS (deben corregirse)

| # | Hallazgo | Ubicación | Acción |
|---|----------|-----------|--------|
| 1 | Grid ignora `columns` | `Prototipo_v1_pro.html` L1247 | Implementar lógica dinámica de columnas |
| 2 | Callout falta `tip` y `warning` | `Prototipo_v1_pro.html` L1262 | Agregar dos variantes faltantes |
| 3 | Key_point `importance` no usado | `Resumen_Farmacoepidemiologia.html` | Garantizar que cada key_point tenga importance |
| 4 | Mismatch código vs. workflow en callout variants | Múltiples | Sincronizar 5 variantes documentadas |

### 🟡 IMPORTANTES (mejoría notable)

| # | Hallazgo | Ubicación | Acción |
|---|----------|-----------|--------|
| 5 | `highlight_column` índice ambiguo | Workflow L56 | Documentar claramente 0-indexed |
| 6 | Quiz generation sin estructura definida | Workflow L131-139 | Expandir Fase 5 con mapeo block→quiz |
| 7 | Block images sin guía en workflow | Workflow general | Agregar sección sobre image_reference vs. attached |
| 8 | Límites de contenido no documentados | Workflow L142-152 | Agregar tabla de recomendaciones |
| 9 | Stages severity vs. order confuso visualmente | Workflow L51 | Aclaración de colores en docs |
| 10 | renderImageRef lógica convoluta | `Prototipo_v1_pro.html` L1273 | Refactorizar con casos claros |
| 11 | renderBlocks sin validación de datos | `Prototipo_v1_pro.html` L2215 | Agregar función validateBlock |

### 🟢 NICE-TO-HAVE (mejoras menores)

| # | Hallazgo | Ubicación | Acción |
|---|----------|-----------|--------|
| 12 | Block IDs y BLOCK_MASTERY pueden desincronizarse | General | Agregar validación (no crítica) |
| 13 | Keywords {{}} sin validación si no existen | General | Agregar warn si keyword_id missing |
| 14 | SVG map no reutilizable | `Prototipo_v1_pro.html` | Exportar a archivo separado |
| 15 | Block stuffing parcial | `Resumen_Farmacoepidemiologia.html` | Feedback UI: evitar callouts consecutivos |
| 16 | Grid vs. List Detail frontera difusa | Workflow | Agregar tabla comparativa |

---

## III. IMPACTO DE HALLAZGOS EN USUARIOS

### Para Productores de Resúmenes (Instructores/IA)

**Más afectados:**
- Hallazgo #1 (Grid): imposible usar 2 o 4 columnas
- Hallazgo #2 (Callout variants): no pueden acceder a `tip` y `warning`
- Hallazgo #3 (Importance): no pueden marcar conceptos como CRÍTICO vs. IMPORTANTE
- Hallazgo #6 (Quiz): sin estructura clara para crear quizzes

**Acción:**
1. Corregir A.1, A.2, A.3 en código ANTES de publicar nuevos resúmenes
2. Expandir workflow con hallazgos #5-11 ANTES de producción

### Para Estudiantes

**Impacto:**
- Verán badges "CRÍTICO" en algunos key_points (proto Aterosclerosis) pero no en otros (Farmacoepidemiologia)
- Grids siempre en 3 columnas, sin flexibilidad
- Callouts `tip` y `warning` no renderizarían si se intentan usar

**Acción:** Transparencia — documentar que proto está en fase de stabilización

---

## IV. ROADMAP DE CORRECCIONES

### Fase 1: Critical Fixes (semana 1)
- [ ] Implementar grid `columns` dinámico (A.1)
- [ ] Agregar callout variants `tip` y `warning` (A.2)
- [ ] Garantizar `importance` en key_point bloques (A.3)
- [ ] Documentar `highlight_column` 0-indexed (C.1)

### Fase 2: Workflow Expansion (semana 1-2)
- [ ] Expandir Fase 5 de workflow: Quiz mapping (C.1)
- [ ] Agregar sección: Image guidance (C.2)
- [ ] Agregar tabla: Límites de contenido (C.3)
- [ ] Aclaración: Stages severity colors (D.1)
- [ ] Tabla: Callout variant colors (D.2)

### Fase 3: Code Quality (semana 2)
- [ ] Refactorizar `renderImageRef` (E.1)
- [ ] Agregar `validateBlock()` function (E.2)
- [ ] Exportar SVG map a archivo separado (E.3)
- [ ] Agregar linting/validation on save

### Fase 4: Testing & Documentation (semana 3)
- [ ] Test: cada tipo de bloque con datos edge case
- [ ] Test: grid con 2, 3, 4, 5+ columnas
- [ ] Test: keyword references that don't exist
- [ ] Update: WORKFLOW_RESUMENES_AXON.md con todos los cambios

---

## CONCLUSIÓN

El sistema Axon de resúmenes en bloques es **sólido en concepto y flujo pedagógico**, pero tiene **gaps de implementación** entre lo que el código soporta y lo que el workflow promete.

**Prioridades:**
1. Corregir 3 issues críticos (grid, callout variants, importance)
2. Sincronizar workflow con capacidades reales del código
3. Agregar validaciones mínimas para evitar data quality issues

Con estos cambios, el sistema será **robusto, predecible y documentado** para usuarios finales.

---

**Fecha de reporte:** 23/03/2026
**Próxima revisión:** Después de implementar Fase 1 + 2
