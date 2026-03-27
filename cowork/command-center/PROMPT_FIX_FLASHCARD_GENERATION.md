# Prompt: Fix Flashcard AI Generation Bugs

> Pegar en Claude Code CLI desde C:\dev\axon\frontend
> Branch: feat/fix-flashcard-generation desde main

```
Eres XX-01 (Arquitecto). Lee AGENT-REGISTRY.md, project_current_state.md y feedback_agent_isolation.md.

Hay bugs CRÍTICOS en la generación de flashcards vía AI que corrompen datos. Necesito que los arregles.

## Setup
git checkout main && git pull && git checkout -b feat/fix-flashcard-generation

## BUGS A ARREGLAR (en orden de prioridad)

### BUG 1 (CRÍTICO): ensureGeneralKeyword() corrompe la base de datos
Archivo: src/app/lib/api.ts, línea ~288
Problema: ensureGeneralKeyword() hace GET /keywords?summary_id=xxx esperando KeywordRow[] pero el backend retorna objeto paginado { items, total, limit, offset }. Llama .find() sobre el objeto paginado → siempre retorna undefined → SIEMPRE crea un nuevo keyword "General" duplicado.
Impacto: Duplica keywords en la DB en CADA llamada de creación de flashcard/quiz.
Consumidores afectados: FlashcardsManager, FlashcardFormModal, useQuestionForm.
Fix: Cambiar .find() a .items.find() o usar el helper extractItems() si existe. Verificar qué retorna el backend realmente (puede ser array o paginado según la ruta).
Referencia: BH-ERR-019 en .claude/bug-hunter/STATE.md

### BUG 2 (MEDIO): FlashcardFormModal .id sobre string
Archivo: src/app/components/professor/FlashcardFormModal.tsx, línea ~256
Problema: Llama (await ensureGeneralKeyword(summaryId)).id pero ensureGeneralKeyword() retorna string, no objeto. .id es siempre undefined.
Fix: Si ensureGeneralKeyword retorna string (el ID), usar directamente sin .id. Si retorna objeto, ajustar el tipo.
Referencia: BH-ERR-033

### BUG 3 (MEDIO): MasteryLevel definido 3 veces diferente
Archivos:
- src/app/types/keywords.ts → 'red'|'yellow'|'green'
- legacy-stubs.ts → 'none'|'seen'|'learning'|'familiar'|'mastered'
- hooks/useKeywordMastery.ts → DeltaColorLevel alias
Problema: Los consumidores importan tipos diferentes según el archivo. Esto causa type mismatches silenciosos.
Fix: Definir UN tipo canónico MasteryLevel en keywords.ts y exportar desde ahí. Los demás importan de ahí. Eliminar las definiciones duplicadas.
Referencia: BH-ERR-021

### BUG 4 (BAJO): KeywordCollection type divergence
Archivos:
- src/app/services/aiFlashcardGenerator.ts:15 usa Record<string, KeywordState>
- src/app/types/keywords.ts:29 define como Record<string, KeywordData>
Problema: KeywordState vs KeywordData — interfaces diferentes, misma variable.
Fix: Unificar en un solo tipo. Verificar cuál es la forma correcta del dato.
Referencia: BH-ERR-024

### BUG 5 (BAJO): Dead exports en adaptiveGenerationApi
Archivo: src/app/services/adaptiveGenerationApi.ts
Problema: Exporta MAX_CONCURRENT_GENERATIONS, RECOMMENDED_MAX_BATCH, SmartMetadata que nadie importa.
Fix: Eliminar exports muertos o conectarlos si son necesarios.
Referencia: BH-ERR-032

## Agentes sugeridos

| Agent | ID | Tarea |
|-------|----|-------|
| infra-ui o summaries-frontend-v2 | IF-05 o SM-01 | Bug 1 (api.ts es shared — verificar quién es dueño) |
| flashcards-frontend | FC-01 | Bug 2 (FlashcardFormModal) |
| flashcards-keywords | FC-05 | Bugs 3 y 4 (tipos de keywords/mastery) |
| flashcards-generation | FC-06 | Bug 5 (adaptiveGenerationApi dead exports) |
| quality-gate | XX-02 | Auditoría post-fix |

## Fases
Fase 1: Investigar api.ts — quién es dueño, qué retorna el backend realmente (array o paginado)
Fase 2 (paralelo): Fix bugs 1-5 con agentes asignados
Fase 3: XX-02 quality-gate
Fase 4: npm run build → verificar 0 errores → commit → push

## Validación post-fix
1. Verificar que ensureGeneralKeyword() NO crea duplicados (buscar en Supabase: SELECT count(*) FROM keywords WHERE term = 'General' GROUP BY summary_id HAVING count(*) > 1)
2. Verificar que FlashcardFormModal puede crear flashcards sin error
3. Verificar que los tipos de MasteryLevel son consistentes en todo el codebase
4. npm run build limpio
```
