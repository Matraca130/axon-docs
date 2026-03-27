---
tags:
  - type/system-config
  - status/evergreen
created: 2026-03-15
updated: 2026-03-15
---

# OBISI — Configuración del Sistema v3.0

> **INSTRUCCIÓN PARA LA IA:** Leer este archivo al inicio de cada sesión con `get_system_config` antes de cualquier operación. Contiene todas las reglas, tags, templates y workflow del vault.

---

## ARQUITECTURA DEL VAULT

```
📁 _system/        ← Config IA (este archivo)
📁 _templates/     ← Templates Templater
📁 _scripts/       ← Scripts JS Templater
📁 Grafos/         ← MOCs + Nodos (OBISI trabaja aquí)
📁 Inbox/          ← Captura rápida manual
📁 Reviews/        ← Auditorías de MOCs
📁 Resources/      ← PDFs, imágenes
```

---

## TAXONOMÍA DE TAGS

### 1. Status (obligatorio, uno)
Controla la madurez del nodo. Útil para filtrar en el grafo qué está completo y qué falta.
- `#status/seedling`   🌱 Idea inicial, borrador
- `#status/growing`    🌿 En desarrollo, tiene contenido pero falta revisar/expandir
- `#status/evergreen`  🌳 Madura, revisada y completa
- `#status/stale`      🍂 Desactualizada, necesita actualización
- `#status/archived`   📦 Archivada, ya no relevante

### 2. Type (obligatorio, uno)
Define la naturaleza del contenido. Permite filtrar el grafo por tipo de nota.
- `#type/concept` — Concepto teórico (ej: Insuficiencia Cardíaca)
- `#type/howto` — Procedimiento o técnica (ej: Examen Físico CV)
- `#type/reference` — Material de referencia, tablas, clasificaciones
- `#type/definition` — Definición formal de un término
- `#type/comparison` — Comparación entre entidades (ej: dolor pericárdico vs coronario)
- `#type/case-study` — Caso clínico
- `#type/question` — Pregunta de estudio o repaso
- `#type/opinion` — Perspectiva personal
- `#type/resource` — Recurso externo (PDF, video, link)
- `#type/moc` — Mapa de contenido (índice de un grafo)

### 3. Source (obligatorio, uno)
Origen del contenido. Permite saber de dónde salió la información.
- `#source/book` `#source/article` `#source/course` `#source/video`
- `#source/experience` `#source/conversation` `#source/ai` `#source/repo`
- `#source/pdf` — Extraído de un PDF subido
- `#source/class-notes` — Apuntes de clase

**Regla:** Si la IA crea el nodo → `source/ai` SIEMPRE.

### 4. Domain (obligatorio, uno)
Área general de conocimiento.
- `#domain/medicine` — Medicina y salud
- `#domain/programming` `#domain/design` `#domain/business`
- `#domain/finance` `#domain/personal` `#domain/learning`

### 5. Topic (NUEVO — obligatorio para domain/medicine, múltiples permitidos)
Tema/sistema específico. **Clave para filtrar el grafo por tema.** En Obsidian: Graph View → Filters → tag:topic/cardio para ver solo nodos de cardiología.

#### Sistemas y Aparatos
- `#topic/cardio` — Sistema Cardiovascular
- `#topic/respiratory` — Sistema Respiratorio
- `#topic/digestive` — Sistema Digestivo
- `#topic/neuro` — Sistema Nervioso
- `#topic/renal` — Sistema Genitourinario
- `#topic/endocrine` — Sistema Endocrino
- `#topic/hemato` — Sistema Hematopoyético
- `#topic/rheumatology` — Reumatología
- `#topic/derma` — Dermatología / Tegumentario

#### Áreas Transversales
- `#topic/semiology` — Semiología general (signos, síntomas, examen físico)
- `#topic/pharmacology` — Farmacología
- `#topic/imaging` — Imágenes y estudios complementarios
- `#topic/emergency` — Emergencias y urgencias
- `#topic/infectiology` — Infectología
- `#topic/surgery` — Cirugía

#### Sub-temas (opcionales, para granularidad extra)
- `#topic/cardio/valvular` — Valvulopatías
- `#topic/cardio/coronary` — Enfermedad coronaria / SCA
- `#topic/cardio/hta` — Hipertensión arterial
- `#topic/cardio/heart-failure` — Insuficiencia cardíaca
- `#topic/cardio/pericardial` — Pericardio
- `#topic/cardio/endocarditis` — Endocarditis
- `#topic/cardio/tep` — Tromboembolismo pulmonar
- `#topic/neuro/cephalea` — Cefaleas
- `#topic/neuro/meningeal` — Síndrome meníngeo
- `#topic/digestive/hepatic` — Hígado y vías biliares
- `#topic/digestive/gi-bleeding` — Hemorragia digestiva

> **Se pueden crear sub-temas nuevos** siguiendo el patrón `#topic/[sistema]/[subtema]` a medida que se expanda el grafo.

### 6. Complexity (NUEVO — opcional)
Nivel de profundidad del contenido. Útil para filtrar en el grafo según nivel de estudio.
- `#level/basic` — Conceptos fundamentales, definiciones
- `#level/intermediate` — Semiología aplicada, diagnóstico diferencial
- `#level/advanced` — Casos complejos, criterios diagnósticos detallados

### 7. Clinical (NUEVO — opcional, múltiples permitidos)
Tipo de contenido clínico. Permite ver en el grafo solo síndromes, solo técnicas, etc.
- `#clinical/syndrome` — Síndrome clínico (ej: SCA, IC, Nefrótico)
- `#clinical/sign` — Signo semiológico (ej: Signo de Musset)
- `#clinical/symptom` — Síntoma (ej: Disnea)
- `#clinical/technique` — Técnica de exploración (ej: Maniobra de Dressler)
- `#clinical/criteria` — Criterios diagnósticos (ej: Framingham, Duke)
- `#clinical/differential` — Diagnóstico diferencial
- `#clinical/emergency` — Emergencia médica (ej: Taponamiento, EAP)

### 8. Action (solo cuando aplique)
- `#action/review` `#action/expand` `#action/connect` `#action/split` `#action/merge`

---

## REGLAS DE TAGS

1. **Mínimo obligatorio**: status + type + source + domain (4 tags)
2. **Para domain/medicine**: agregar SIEMPRE al menos 1 tag `topic/`
3. **Máximo recomendado**: 8 tags por nodo
4. **Tags topic/ permiten múltiples**: un nodo puede tener `topic/cardio` + `topic/emergency` si es una emergencia cardiológica
5. **Tags clinical/ son opcionales** pero muy útiles para filtrar el grafo
6. **Si la IA crea el nodo** → `source/ai` SIEMPRE

---

## VISUALIZACIÓN DEL GRAFO EN OBSIDIAN

### Filtros útiles para Graph View

En Obsidian → Graph View → Filters, podés usar estas queries:

| Quiero ver... | Filtro |
|---|---|
| Solo cardiología | `tag:topic/cardio` |
| Solo síndromes | `tag:clinical/syndrome` |
| Solo emergencias | `tag:clinical/emergency` |
| Nodos incompletos | `tag:status/seedling` |
| Nodos maduros | `tag:status/evergreen` |
| Solo lo básico | `tag:level/basic` |
| Contenido del PDF | `tag:source/pdf` |
| Lo que falta expandir | `tag:action/expand` |
| Cardio + emergencias | `tag:topic/cardio tag:clinical/emergency` |
| Todo menos archivados | `-tag:status/archived` |

### Grupos de color por tag

En Graph View → Groups, configurar colores por sistema:

| Tag | Color sugerido |
|---|---|
| `topic/cardio` | 🔴 Rojo |
| `topic/respiratory` | 🔵 Azul |
| `topic/digestive` | 🟢 Verde |
| `topic/neuro` | 🟡 Amarillo |
| `topic/renal` | 🟠 Naranja |
| `topic/endocrine` | 🟣 Violeta |
| `topic/hemato` | ⚪ Blanco |
| `topic/semiology` | ⚫ Gris |
| `clinical/emergency` | 🔴 Rojo brillante |
| `status/seedling` | Verde claro (opacidad baja) |
| `status/evergreen` | Verde fuerte (opacidad alta) |

### Tips de visualización
- **Depth**: usar profundidad 2-3 para ver vecindarios
- **Orphans**: activar para detectar nodos desconectados
- **Tags**: activar para ver tags como nodos (permite ver clusters por tema)
- **Attachments**: desactivar si hay muchas imágenes

---

## FRONTMATTER ESTÁNDAR

```yaml
---
tags:
  - status/seedling
  - type/[según contenido]
  - source/ai
  - domain/medicine
  - topic/[sistema]
  - topic/[sistema]/[subtema]  # opcional
  - level/[basic|intermediate|advanced]  # opcional
  - clinical/[syndrome|sign|technique...]  # opcional
created: YYYY-MM-DD
updated: YYYY-MM-DD
aliases: []
moc: "[[MOC - Nombre del Grafo]]"
---
```

---

## EDGE TYPES

| Edge Type | Uso | Ejemplo |
|---|---|---|
| `relates_to` | Relación general | React ↔ JavaScript |
| `part_of` | Hijo es parte del padre | Examen Físico CV → Examen Físico General |
| `contains` | Padre contiene al hijo | Sistema CV → Valvulopatías |
| `requires` | A necesita B | Valvulopatías → Auscultación |
| `leads_to` | A lleva a B | Motivos de Consulta → Examen Físico |
| `causes` | A causa B | HTA → IC, IAM → Dressler |
| `supports` | A da evidencia para B | ECG → Diagnóstico de SCA |
| `opposes` | A contradice B | Dolor pericárdico ↔ Dolor coronario |
| `defines` | A define formalmente a B | Criterios de Duke → Endocarditis |
| `implements` | A realiza/implementa B | Maniobra de Dressler → Palpación |

---

## WORKFLOW — 6 FASES

### FASE 0: INICIO DE SESIÓN (SIEMPRE OBLIGATORIO)
1. `get_system_config` → leer esta config
2. `list_graphs` → ver grafos existentes

### FASE 1: INVESTIGAR antes de crear
1. `find_related(query)` → buscar en TODO el vault
   - Score > 8.0 → Ya existe, usar `link_existing_note`
   - Score 4-8  → Existe algo parcial, revisar
   - Score < 4  → No existe, crear nuevo
2. `list_graphs` → verificar si ya hay MOC similar
3. Si hay PDF: `list_uploaded_pdfs` → `read_uploaded_pdf(id, max_chars: 50000)`

### FASE 2: CREAR
1. `create_graph` con 5-12 nodos, mínimo 3 edge_types distintos, 0 huérfanos
2. `write_to_node` × N — contenido REAL, mínimo 100 palabras, frontmatter completo con TODOS los tags obligatorios + topic/
3. `link_existing_note` — vincular notas existentes (target: 10-20% puentes)

### FASE 3: EXPANDIR
- `batch_create` → 3+ nodos nuevos (PREFERIR sobre add_node)
- `add_node` → 1 nodo individual
- `add_edge` → conectar nodos existentes
- **SIEMPRE** hacer `write_to_node` después de batch_create/add_node

### FASE 4: CONSULTAR
- `get_graph` / `get_graph_summary` / `get_node_tree` / `read_node`
- `search_nodes` / `search_all_nodes` / `find_related`
- `export_graph_mermaid` → diagrama visual

### FASE 5: MANTENER
- **Semanal:** detectar huérfanos, densidad < 0.15, hubs > 30%
- **Mensual:** `find_related` con temas del mes, `export_graph_mermaid` × N
- **Trimestral:** revisar MOC de MOCs, actualizar este config

### FASE 6: VAULT DIRECTO
- `list_vault_files` / `read_vault_note` / `write_vault_note` / `search_vault`

---

## 10 REGLAS DE ORO

1. **BUSCAR antes de CREAR** → `find_related` + `list_graphs`
2. **CONTENIDO REAL, no vacío** → Mínimo 100 palabras por nodo, explicaciones completas
3. **FRONTMATTER siempre** → status + type + source + domain + topic/
4. **TAGS DE TEMA** → Todo nodo médico DEBE tener al menos 1 tag `topic/`
5. **EDGE_TYPE específico** → Mínimo 3 tipos por grafo
6. **NODE_TYPE siempre** → No dejar como "other"
7. **5-12 nodos iniciales** → Ni muy poco ni demasiado
8. **0 huérfanos** → Todo nodo con al menos 1 conexión
9. **WRITE_TO_NODE siempre** → Después de batch_create/add_node, escribir contenido
10. **VERIFICAR al final** → `get_graph_summary` siempre

---

## MÉTRICAS DE SALUD

| Métrica | Saludable | Problema |
|---|---|---|
| Nodos por MOC | 5 – 20 | <5 o >25 |
| Conexiones por nodo | 2 – 6 | 0 o >8 |
| Densidad del grafo | 0.15 – 0.40 | <0.10 |
| Nodos huérfanos | < 5% | > 10% |
| Nodos sin contenido | < 10% | > 25% |
| Nodos puente | 10-20% | 0% (silos) |
| Seedlings sin tocar | < 20% | > 40% |
| Edge types distintos | 3+ por grafo | Solo "relates_to" |
| Nodos sin tag topic/ | 0% | > 10% |
| Tags por nodo | 4 – 8 | <4 o >10 |