# PROMPT: Loop de Mejora — Backend feat/block-embeddings

> **Uso:** Copiar TODO este prompt en Claude Code CLI → `/loop`
> **Branch:** `feat/block-embeddings` (ya existe, ya tiene PR abierto)
> **Repo:** `C:\dev\axon\backend`
> **Objetivo:** Revisar, mejorar y hardening del código ya implementado
> **La memoria se resetea cada ~10 min.** El archivo MEJORA_PROGRESS.md te dice dónde vas.

---

## 🚨 REGLA ABSOLUTA: JAMÁS TRABAJAR EN MAIN 🚨

```bash
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  echo "❌ ABORT: Estás en $CURRENT_BRANCH — PROHIBIDO."
  git checkout feat/block-embeddings
fi
echo "✅ Branch segura: $(git branch --show-current)"
```

---

## REGLA #1: SIEMPRE EMPIEZA AQUÍ

```bash
# 1. Verificar branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  git checkout feat/block-embeddings
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
cd C:\dev\axon\backend
git checkout feat/block-embeddings
git pull origin feat/block-embeddings
```

Leer para contexto:
- `CLAUDE.md` y `docs/AGENT_INDEX.md`
- `supabase/functions/server/block-hook.ts`
- `supabase/functions/server/block-flatten.ts`
- `supabase/functions/server/routes/content/publish-summary.ts`
- `supabase/functions/server/routes/content/crud.ts`
- `supabase/functions/server/summary-hook.ts`
- `supabase/functions/server/crud-factory.ts`
- `supabase/functions/server/tests/block-fixtures.ts`
- `supabase/functions/server/tests/block-flatten.test.ts`
- `supabase/functions/server/tests/block-hook.test.ts`

Crear MEJORA_PROGRESS.md:
```bash
cat > MEJORA_PROGRESS.md << 'EOF'
# Loop de Mejora — Backend feat/block-embeddings
## Current: REVIEW_1
## Tasks:
- REVIEW_1: PENDING — run tests baseline
- REVIEW_2: PENDING — deno check type safety
- REVIEW_3: PENDING — audit block-flatten.ts
- REVIEW_4: PENDING — audit block-hook.ts
- REVIEW_5: PENDING — audit publish-summary.ts
- REVIEW_6: PENDING — audit crud-factory afterWrite
- REVIEW_7: PENDING — audit summary-hook guard
- REVIEW_8: PENDING — edge cases + robustness
- REVIEW_9: PENDING — test coverage gaps
- REVIEW_10: PENDING — final green + commit
EOF
```

---

## ═══════════════════════════════════════
## FASE 1: BASELINE + TYPE CHECK
## ═══════════════════════════════════════

### REVIEW_1: Run tests baseline

```bash
deno test supabase/functions/server/tests/block-flatten.test.ts --allow-env --allow-net --allow-read 2>&1
deno test supabase/functions/server/tests/block-hook.test.ts --allow-env --allow-net --allow-read 2>&1
```

Registrar resultado en MEJORA_PROGRESS.md:
- Cuántos tests pasan / fallan
- Si alguno falla → arreglar ANTES de continuar (no mejorar código roto)

Actualizar PROGRESS → `REVIEW_1: DONE — X/22 flatten, Y/5 hook`

---

### REVIEW_2: deno check type safety

```bash
deno check supabase/functions/server/block-flatten.ts 2>&1
deno check supabase/functions/server/block-hook.ts 2>&1
deno check supabase/functions/server/routes/content/publish-summary.ts 2>&1
deno check supabase/functions/server/index.ts 2>&1
```

Si hay errores de tipos → arreglar. Anotar qué se arregló.

Actualizar PROGRESS → `REVIEW_2: DONE`

---

## ═══════════════════════════════════════
## FASE 2: AUDITORÍA MÓDULO POR MÓDULO
## ═══════════════════════════════════════

### REVIEW_3: Audit block-flatten.ts

Revisar `supabase/functions/server/block-flatten.ts` contra estos criterios:

**Correctness:**
- [ ] Cada uno de los 10 tipos edu tiene su case en el switch/map
- [ ] Legacy types (text, heading) son manejados
- [ ] `stripKeywordMarkers()` remueve `{{` y `}}` correctamente
- [ ] Sort by `order_index` funciona (números, no strings)
- [ ] Separador entre bloques es `\n\n---\n\n`
- [ ] Array vacío retorna string vacío
- [ ] Tipo desconocido → JSON.stringify fallback (no crash)

**Robustness:**
- [ ] `null`/`undefined` en content → no crash
- [ ] Block sin `type` → no crash
- [ ] Block sin `order_index` → treated as 0 o Infinity, no NaN
- [ ] Campos faltantes en block content → fallback graceful (no `undefined` en output)
- [ ] comparison sin rows/headers → no crash
- [ ] stages sin items → no crash
- [ ] two_column sin columns → no crash

**Code Quality:**
- [ ] No `any` types innecesarios — usar interfaces tipadas
- [ ] Helper functions extraídas para lógica repetida
- [ ] Consistent naming (camelCase para funciones, PascalCase para tipos)
- [ ] Imports usan pattern del proyecto (ver otros archivos del server)

**Arreglar TODO lo que encuentres.** Anotar cambios en MEJORA_PROGRESS.md.

Actualizar PROGRESS → `REVIEW_3: DONE — [resumen de cambios]`

---

### REVIEW_4: Audit block-hook.ts

Revisar `supabase/functions/server/block-hook.ts`:

**Fire-and-forget contract:**
- [ ] La función `onBlockWrite` NUNCA hace throw — todo en try/catch
- [ ] Errores se loguean con `console.error` (no se tragan silenciosamente)
- [ ] No usa `await` de forma que bloquee el response CRUD
- [ ] Si summary_id es null/undefined → early return, no crash

**Logic:**
- [ ] Solo revierte status si es `'published'` → `'review'`
- [ ] No hace nada si status es `'review'`, `'raw'`, `'draft'`
- [ ] Usa el Supabase client correcto del proyecto (ver db.ts o cómo otros hooks lo hacen)
- [ ] Query es eficiente: solo lee status, no el summary completo

**Security:**
- [ ] Usa admin client (no el del usuario) para el update de status
- [ ] No expone información sensible en logs

**Arreglar TODO lo que encuentres.**

Actualizar PROGRESS → `REVIEW_4: DONE — [resumen de cambios]`

---

### REVIEW_5: Audit publish-summary.ts

Revisar `supabase/functions/server/routes/content/publish-summary.ts`:

**Auth + Validation:**
- [ ] Verifica auth (mismo pattern que otros endpoints del proyecto)
- [ ] Valida que summaryId existe y es UUID válido
- [ ] Verifica status = 'review' antes de publicar (no publica drafts/raw)
- [ ] Verifica que tiene blocks (no publica summary vacío)
- [ ] Retorna errores HTTP apropiados (400, 401, 403, 404, 409)

**Publish Flow:**
- [ ] flattenBlocksToMarkdown se ejecuta ANTES de cambiar status
- [ ] content_markdown se actualiza en DB
- [ ] Status → 'published' se hace ANTES de embeddings
- [ ] autoChunkAndEmbed se invoca correctamente (ver auto-ingest.ts para la firma)
- [ ] Per-block embeddings usan Promise.allSettled (no Promise.all)
- [ ] Batch size = 5 para per-block embeddings
- [ ] Response incluye { status, chunks_count, blocks_embedded }

**Error Handling:**
- [ ] Si flatten falla → no cambia status, retorna 500
- [ ] Si embedding falla → status YA es published (correcto — embed es best-effort)
- [ ] Errors en batch de embeddings se cuentan en response (blocks_failed)
- [ ] No deja el summary en estado inconsistente

**Route Registration:**
- [ ] Ruta registrada en el router correcto (buscar donde se registran rutas de content)
- [ ] Path es `POST /content/summaries/:id/publish`
- [ ] Sigue mismo pattern de middleware/auth que otros endpoints

**Arreglar TODO lo que encuentres.**

Actualizar PROGRESS → `REVIEW_5: DONE — [resumen de cambios]`

---

### REVIEW_6: Audit crud-factory afterWrite

Revisar cambios en `supabase/functions/server/crud-factory.ts`:

- [ ] `AfterWriteParams` interface exportada correctamente
- [ ] `afterWrite` es opcional en la config (no rompe CRUDs existentes)
- [ ] Se invoca con `?.()` (optional chaining — no crash si undefined)
- [ ] Se invoca DESPUÉS del db call exitoso (no antes)
- [ ] Se invoca en POST, PUT, y DELETE handlers
- [ ] Pasa `action` correcto ('create'|'update'|'delete')
- [ ] Pasa `row` con los datos del registro
- [ ] afterWrite es fire-and-forget (no awaited, o si es awaited no bloquea response)
- [ ] No rompe los CRUDs existentes — verificar que otros registerCrud siguen funcionando

Verificar en `routes/content/crud.ts`:
- [ ] summary-blocks registerCrud tiene `afterWrite: onBlockWrite`
- [ ] Import de `onBlockWrite` apunta a `../../block-hook.ts`
- [ ] `hasCreatedBy: true`, `hasUpdatedAt: true` están configurados
- [ ] `"style"` y `"metadata"` en createFields y updateFields

**Arreglar TODO lo que encuentres.**

Actualizar PROGRESS → `REVIEW_6: DONE — [resumen de cambios]`

---

### REVIEW_7: Audit summary-hook guard

Revisar `supabase/functions/server/summary-hook.ts`:

- [ ] Guard correcto: si summary tiene summary_blocks activos → skip autoChunkAndEmbed
- [ ] La query para verificar blocks es eficiente (COUNT o EXISTS, no SELECT *)
- [ ] No rompe el flujo existente para summaries SIN blocks (legacy path sigue funcionando)
- [ ] El guard está en el lugar correcto del flujo de `onSummaryWrite`
- [ ] Comentario explica POR QUÉ se skipea (para el próximo dev)

**Arreglar TODO lo que encuentres.**

Actualizar PROGRESS → `REVIEW_7: DONE — [resumen de cambios]`

---

## ═══════════════════════════════════════
## FASE 3: EDGE CASES + TEST GAPS
## ═══════════════════════════════════════

### REVIEW_8: Edge cases + robustness

Verificar estos edge cases con tests manuales o revisando el código:

**block-flatten.ts:**
- Bloque con `content: {}` (objeto vacío)
- Bloque con `content: null`
- Bloque con `type: ""` (string vacío)
- Bloque comparison con `headers: []` y `rows: []`
- Bloque stages con `items: [{}]` (item sin campos)
- Bloque callout con `variant` no reconocido
- Bloque con `order_index: -1` o `order_index: 999999`
- Mezcla de legacy + edu types en mismo array
- Bloque con campos extra no esperados (no debe crashear)

**block-hook.ts:**
- Row sin `summary_id` field
- Row con `summary_id` que no existe en DB
- Concurrent calls (dos bloques editados al mismo tiempo)

**publish-summary.ts:**
- Summary con 0 blocks
- Summary con 100+ blocks (batch logic)
- Summary ya published (re-publish)
- Network error durante embedding (Promise.allSettled maneja esto)

Si encuentras que algún caso no está cubierto o crashea → arreglar código Y agregar test.

Actualizar PROGRESS → `REVIEW_8: DONE — [edge cases encontrados/arreglados]`

---

### REVIEW_9: Test coverage gaps

Revisar tests existentes y agregar lo que falte:

**block-flatten.test.ts (actualmente ~22 tests):**
- Agregar tests para edge cases encontrados en REVIEW_8
- Verificar que CADA tipo de bloque tiene al menos 1 test
- Verificar test de mixed legacy + edu types
- Verificar test de campos faltantes/null para cada tipo

**block-hook.test.ts (actualmente ~5 tests):**
- Agregar test para row con summary_id inexistente
- Agregar test para concurrent calls (si aplica)
- Verificar que los mocks siguen el pattern del proyecto

**Si hay gaps → agregar tests. Si todos los casos están cubiertos → documentar y marcar DONE.**

Actualizar PROGRESS → `REVIEW_9: DONE — [tests agregados: N nuevos]`

---

## ═══════════════════════════════════════
## FASE 4: FINAL GREEN + COMMIT
## ═══════════════════════════════════════

### REVIEW_10: Final green + commit

```bash
# 1. Type check completo
deno check supabase/functions/server/index.ts

# 2. Todos los tests
deno test supabase/functions/server/tests/block-flatten.test.ts --allow-env --allow-net --allow-read
deno test supabase/functions/server/tests/block-hook.test.ts --allow-env --allow-net --allow-read

# 3. Verificar branch
git branch --show-current
# DEBE decir feat/block-embeddings — si dice main, ABORTAR
```

Si todo verde:
```bash
git add supabase/functions/server/block-hook.ts supabase/functions/server/block-flatten.ts supabase/functions/server/routes/content/publish-summary.ts supabase/functions/server/routes/content/crud.ts supabase/functions/server/summary-hook.ts supabase/functions/server/crud-factory.ts supabase/functions/server/tests/
git diff --cached --stat
git commit -m "refactor: hardening block-flatten, block-hook, publish-summary

- Type safety improvements (eliminate unnecessary any)
- Edge case handling (null/undefined/empty inputs)
- Robustness fixes per module audit
- Additional test coverage for edge cases
- Code quality: consistent patterns, extracted helpers

Part of: block-based summaries migration (Fase 4 improvement loop)"
git push origin feat/block-embeddings
```

```bash
cat > MEJORA_PROGRESS.md << 'EOF'
# Loop de Mejora — Backend feat/block-embeddings
## Current: ALL_COMPLETE
## All 10 reviews completed successfully.
EOF
```

---

## REGLAS CRÍTICAS

0. **🚨 JAMÁS TRABAJAR EN MAIN.** Verificar branch al inicio de CADA ciclo.
1. **Leer MEJORA_PROGRESS.md AL INICIO de cada ciclo.**
2. **Leer código existente ANTES de cambiar nada.** Entender el contexto.
3. **NO instalar dependencias nuevas.**
4. **NO cambiar la API pública** de ninguna función (firma, exports, tipos de retorno).
5. **NO cambiar behavior** — solo mejorar calidad, robustez y coverage.
6. **Si un cambio rompe tests** → revertir ese cambio específico.
7. **Fire-and-forget:** block-hook NUNCA bloquea la respuesta CRUD.
8. **Antes de git push:** `git branch --show-current` — si dice main, ABORTAR.
9. **Anotar TODO lo que cambias** en MEJORA_PROGRESS.md — esto es tu memoria.
