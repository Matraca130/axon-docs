# PROMPT: Tests-First — Fase 4 (Backend: Hooks + Flatten + Publish)

> **Uso:** Ejecutar con `/loop` en Claude Code CLI ANTES de PROMPT_LOOP_FASE4.
> **Branch:** `feat/block-embeddings` (misma branch, tests primero)
> **Repo:** `C:\dev\axon\backend`
> **Filosofía:** TDD — los tests definen el contrato, la implementación los cumple.

---

## INSTRUCCIONES

Tu trabajo: escribir tests de la más alta calidad posible para los 3 módulos nuevos del backend. Cada test es un contrato irrompible.

### PASO 0 — ORIENTACIÓN

```bash
cat C:\dev\axon\backend\CHECKPOINT_TESTS_F4.md 2>/dev/null || echo "NO_CHECKPOINT"
```

### PASO 1 — CONTEXTO (primer ciclo)

```bash
cd C:\dev\axon\backend
git pull origin main
git checkout -b feat/block-embeddings main 2>/dev/null || git checkout feat/block-embeddings
```

Leer:
- `CLAUDE.md` y `docs/AGENT_INDEX.md`
- `supabase/functions/server/tests/` — encontrar tests existentes y copiar el pattern (Deno.test, asserts, etc.)
- `supabase/functions/server/summary-hook.ts` — hook existente (referencia)
- `supabase/functions/server/auto-ingest.ts` — función autoChunkAndEmbed (referencia)

---

## TASKS

### TASK 1: Test utilities + fixtures

**Archivo NUEVO:** `supabase/functions/server/tests/block-fixtures.ts`

```typescript
/**
 * Test fixtures for block-based summary tests.
 * Mirrors block-schema.json structure exactly.
 */

export interface TestBlock {
  type: string;
  content: Record<string, any>;
  order_index: number;
}

export const BLOCKS: Record<string, TestBlock> = {
  prose: {
    type: "prose",
    content: { title: "Introducción", content: "La {{aterosclerosis}} es una enfermedad crónica." },
    order_index: 0,
  },
  key_point: {
    type: "key_point",
    content: { title: "Concepto Central", content: "Proceso inflamatorio activo.", importance: "critical" },
    order_index: 1,
  },
  stages: {
    type: "stages",
    content: {
      title: "Progresión",
      items: [
        { stage: 1, title: "Disfunción", content: "Daño al {{endotelio}}.", severity: "mild" },
        { stage: 2, title: "Estría Grasa", content: "Acumulación de lípidos.", severity: "moderate" },
      ],
    },
    order_index: 2,
  },
  comparison: {
    type: "comparison",
    content: {
      title: "Estable vs Vulnerable",
      headers: ["Característica", "Estable", "Vulnerable"],
      rows: [["Capa fibrosa", "Gruesa", "Delgada"], ["Riesgo", "Bajo", "Alto"]],
      highlight_column: 2,
    },
    order_index: 3,
  },
  list_detail: {
    type: "list_detail",
    content: {
      title: "Factores de Riesgo",
      intro: "Principales factores.",
      items: [
        { icon: "Heart", label: "Hipertensión", detail: "Daño mecánico", severity: "critical" },
        { icon: "Pill", label: "Dislipidemia", detail: "LDL elevado", severity: "critical" },
      ],
    },
    order_index: 4,
  },
  grid: {
    type: "grid",
    content: {
      title: "Mediadores",
      columns: 3,
      items: [
        { icon: "Shield", label: "TNF-α", detail: "Citoquina" },
        { icon: "Shield", label: "IL-6", detail: "Fase aguda" },
      ],
    },
    order_index: 5,
  },
  two_column: {
    type: "two_column",
    content: {
      columns: [
        { title: "Protectores", items: [{ label: "HDL", detail: "Transporte reverso" }] },
        { title: "Riesgo", items: [{ label: "LDL", detail: "Inicia inflamación" }] },
      ],
    },
    order_index: 6,
  },
  callout_tip: {
    type: "callout",
    content: { variant: "tip", title: "Dato", content: "El ejercicio aumenta HDL." },
    order_index: 7,
  },
  callout_warning: {
    type: "callout",
    content: { variant: "warning", title: "Atención", content: "Síntomas silenciosos." },
    order_index: 8,
  },
  callout_exam: {
    type: "callout",
    content: { variant: "exam", content: "Pregunta frecuente sobre aterogénesis." },
    order_index: 9,
  },
  image_reference: {
    type: "image_reference",
    content: { caption: "Figura 1", description: "Etapas de la placa" },
    order_index: 10,
  },
  section_divider: {
    type: "section_divider",
    content: { label: "Fisiopatología" },
    order_index: 11,
  },
  section_divider_empty: {
    type: "section_divider",
    content: {},
    order_index: 12,
  },
  // Legacy types (11 old summaries)
  legacy_text: {
    type: "text",
    content: { html: "<p>Texto <b>legacy</b></p>", text: "Texto legacy" },
    order_index: 0,
  },
  legacy_heading: {
    type: "heading",
    content: { text: "Título Legacy" },
    order_index: 0,
  },
};

/** Helper: create an ordered array of blocks */
export function makeBlockList(...keys: string[]): TestBlock[] {
  return keys.map((k, i) => ({ ...BLOCKS[k], order_index: i }));
}
```

**Al completar:** CHECKPOINT → `TASK 1: DONE`

---

### TASK 2: Tests para `block-flatten.ts`

**Archivo NUEVO:** `supabase/functions/server/tests/block-flatten.test.ts`

**Este es el módulo más crítico — convierte bloques estructurados en texto para embeddings. Si falla, los embeddings son basura y el RAG no funciona.**

```typescript
import { assertEquals, assertStringIncludes, assert } from "https://deno.land/std/assert/mod.ts";
// NOTE: adjust import path when block-flatten.ts exists
// import { flattenBlocksToMarkdown } from "../block-flatten.ts";
import { BLOCKS, makeBlockList } from "./block-fixtures.ts";

// Until block-flatten.ts exists, define the expected interface:
// function flattenBlocksToMarkdown(blocks: Array<{type: string; content: Record<string,any>; order_index: number}>): string

Deno.test("block-flatten: prose block produces title + content", () => {
  const result = flattenBlocksToMarkdown([BLOCKS.prose]);
  assertStringIncludes(result, "## Introducción");
  assertStringIncludes(result, "es una enfermedad crónica");
});

Deno.test("block-flatten: strips keyword markers {{...}}", () => {
  const result = flattenBlocksToMarkdown([BLOCKS.prose]);
  // Must NOT contain {{ }} in output (plain text for embeddings)
  assertEquals(result.includes("{{"), false, "Output should not contain {{ markers");
  assertEquals(result.includes("}}"), false, "Output should not contain }} markers");
  assertStringIncludes(result, "aterosclerosis"); // keyword text preserved without markers
});

Deno.test("block-flatten: key_point includes CONCEPTO CLAVE + importance", () => {
  const result = flattenBlocksToMarkdown([BLOCKS.key_point]);
  assertStringIncludes(result, "CONCEPTO CLAVE");
  assertStringIncludes(result, "Concepto Central");
  assertStringIncludes(result, "CRÍTICO");
});

Deno.test("block-flatten: stages lists all stages with numbers", () => {
  const result = flattenBlocksToMarkdown([BLOCKS.stages]);
  assertStringIncludes(result, "Etapa 1");
  assertStringIncludes(result, "Disfunción");
  assertStringIncludes(result, "Etapa 2");
  assertStringIncludes(result, "Estría Grasa");
  // Keywords stripped
  assertStringIncludes(result, "endotelio");
  assertEquals(result.includes("{{endotelio}}"), false);
});

Deno.test("block-flatten: comparison produces table with headers and rows", () => {
  const result = flattenBlocksToMarkdown([BLOCKS.comparison]);
  assertStringIncludes(result, "Característica");
  assertStringIncludes(result, "Estable");
  assertStringIncludes(result, "Vulnerable");
  assertStringIncludes(result, "Gruesa");
  assertStringIncludes(result, "Delgada");
  // Headers and rows are pipe-separated
  assertStringIncludes(result, " | ");
});

Deno.test("block-flatten: list_detail includes intro + items", () => {
  const result = flattenBlocksToMarkdown([BLOCKS.list_detail]);
  assertStringIncludes(result, "Factores de Riesgo");
  assertStringIncludes(result, "Principales factores");
  assertStringIncludes(result, "Hipertensión");
  assertStringIncludes(result, "Daño mecánico");
});

Deno.test("block-flatten: grid produces labeled items", () => {
  const result = flattenBlocksToMarkdown([BLOCKS.grid]);
  assertStringIncludes(result, "TNF-α");
  assertStringIncludes(result, "Citoquina");
});

Deno.test("block-flatten: two_column includes both columns", () => {
  const result = flattenBlocksToMarkdown([BLOCKS.two_column]);
  assertStringIncludes(result, "Protectores");
  assertStringIncludes(result, "HDL");
  assertStringIncludes(result, "Riesgo");
  assertStringIncludes(result, "LDL");
});

Deno.test("block-flatten: callout includes variant label + content", () => {
  const result = flattenBlocksToMarkdown([BLOCKS.callout_tip]);
  assertStringIncludes(result, "TIP");
  assertStringIncludes(result, "ejercicio");
});

Deno.test("block-flatten: callout without title still works", () => {
  const result = flattenBlocksToMarkdown([BLOCKS.callout_exam]);
  assertStringIncludes(result, "EXAM");
  assertStringIncludes(result, "Pregunta frecuente");
});

Deno.test("block-flatten: image_reference produces placeholder text", () => {
  const result = flattenBlocksToMarkdown([BLOCKS.image_reference]);
  assertStringIncludes(result, "Imagen");
  assert(result.includes("Figura 1") || result.includes("Etapas de la placa"));
});

Deno.test("block-flatten: section_divider with label", () => {
  const result = flattenBlocksToMarkdown([BLOCKS.section_divider]);
  assertStringIncludes(result, "Fisiopatología");
});

Deno.test("block-flatten: section_divider without label returns empty", () => {
  const result = flattenBlocksToMarkdown([BLOCKS.section_divider_empty]);
  assertEquals(result.trim(), "");
});

Deno.test("block-flatten: legacy text strips HTML", () => {
  const result = flattenBlocksToMarkdown([BLOCKS.legacy_text]);
  assertStringIncludes(result, "Texto legacy");
  assertEquals(result.includes("<p>"), false, "HTML tags should be stripped");
  assertEquals(result.includes("<b>"), false, "HTML tags should be stripped");
});

Deno.test("block-flatten: legacy heading produces text", () => {
  const result = flattenBlocksToMarkdown([BLOCKS.legacy_heading]);
  assertStringIncludes(result, "Título Legacy");
});

Deno.test("block-flatten: multiple blocks separated by ---", () => {
  const blocks = makeBlockList("prose", "key_point", "stages");
  const result = flattenBlocksToMarkdown(blocks);
  const sections = result.split("---");
  assert(sections.length >= 3, `Expected ≥3 sections, got ${sections.length}`);
});

Deno.test("block-flatten: respects order_index sorting", () => {
  // Pass blocks in reverse order — flatten should sort by order_index
  const blocks = [
    { ...BLOCKS.key_point, order_index: 1 },
    { ...BLOCKS.prose, order_index: 0 },
  ];
  const result = flattenBlocksToMarkdown(blocks);
  const prosePos = result.indexOf("Introducción");
  const keyPointPos = result.indexOf("CONCEPTO CLAVE");
  assert(prosePos < keyPointPos, "prose (order 0) should appear before key_point (order 1)");
});

Deno.test("block-flatten: empty blocks array returns empty string", () => {
  const result = flattenBlocksToMarkdown([]);
  assertEquals(result, "");
});

Deno.test("block-flatten: unknown type falls back to JSON.stringify", () => {
  const result = flattenBlocksToMarkdown([{
    type: "future_unknown_type",
    content: { foo: "bar" },
    order_index: 0,
  }]);
  assertStringIncludes(result, "foo");
  assertStringIncludes(result, "bar");
});

Deno.test("block-flatten: handles null/undefined content gracefully", () => {
  const result = flattenBlocksToMarkdown([{
    type: "prose",
    content: { title: null, content: undefined } as any,
    order_index: 0,
  }]);
  // Should not crash
  assert(typeof result === "string");
});

Deno.test("block-flatten: full realistic summary", () => {
  const blocks = makeBlockList(
    "prose", "key_point", "stages", "comparison",
    "list_detail", "callout_tip", "callout_warning",
    "image_reference", "section_divider"
  );
  const result = flattenBlocksToMarkdown(blocks);

  // Should produce substantial text
  assert(result.length > 200, `Expected >200 chars, got ${result.length}`);

  // No keyword markers in output
  assertEquals(result.includes("{{"), false);
  assertEquals(result.includes("}}"), false);

  // All major content present
  assertStringIncludes(result, "Introducción");
  assertStringIncludes(result, "CONCEPTO CLAVE");
  assertStringIncludes(result, "Etapa 1");
  assertStringIncludes(result, "Hipertensión");
  assertStringIncludes(result, "Fisiopatología");
});
```

**Total: 22 tests para block-flatten.** Esto cubre: cada tipo de bloque, edge cases, sorting, separadores, legacy types, null safety, keyword stripping.

**Al completar:** CHECKPOINT → `TASK 2: DONE`

---

### TASK 3: Tests para `block-hook.ts`

**Archivo NUEVO:** `supabase/functions/server/tests/block-hook.test.ts`

```typescript
// These tests require mocking the Supabase client.
// Check how existing tests in the project mock db calls and follow that pattern.
// If the project uses a test helper or mock factory, reuse it.

Deno.test("block-hook: onBlockWrite does nothing if summary_id is missing", () => {
  // Should not crash and should not make any db calls
  // onBlockWrite({ action: 'create', row: { id: '123' } });
  // Verify no errors thrown
});

Deno.test("block-hook: onBlockWrite does nothing if summary status is 'review'", () => {
  // Mock: db.from("summaries").select("status") returns { status: "review" }
  // Verify: no update call is made (already in review)
});

Deno.test("block-hook: onBlockWrite reverts published summary to review", () => {
  // Mock: db.from("summaries").select("status") returns { status: "published" }
  // Verify: db.from("summaries").update({ status: "review" }) is called
});

Deno.test("block-hook: onBlockWrite does nothing for draft status", () => {
  // Mock: status = "draft"
  // Verify: no update call
});

Deno.test("block-hook: onBlockWrite is fire-and-forget (errors logged, not thrown)", () => {
  // Mock: db call throws error
  // Verify: onBlockWrite does NOT throw (it catches and logs)
});
```

**NOTA:** Los tests de block-hook dependen de cómo el proyecto mockea Supabase. Leer los tests existentes (`supabase/functions/server/tests/`) para encontrar el pattern de mocking. Si no hay patrón, crear mocks mínimos.

**Al completar:** CHECKPOINT → `TASK 3: DONE`

---

### TASK 4: Run + verify + commit

```bash
cd C:\dev\axon\backend
deno test supabase/functions/server/tests/block-flatten.test.ts --allow-env --allow-net --allow-read 2>&1 | tail -20
deno test supabase/functions/server/tests/block-hook.test.ts --allow-env --allow-net --allow-read 2>&1 | tail -20
```

**Expected:** Tests fail because modules don't exist yet (TDD red phase).

Fix any syntax errors in the tests themselves. Then commit:

```bash
git add supabase/functions/server/tests/block-fixtures.ts supabase/functions/server/tests/block-flatten.test.ts supabase/functions/server/tests/block-hook.test.ts
git commit -m "test: add test suite for block-flatten and block-hook (TDD red phase)

- 22 tests for flattenBlocksToMarkdown (every block type, edge cases, sorting)
- 5 tests for onBlockWrite hook (status transitions, fire-and-forget)
- Fixtures matching block-schema.json
- All tests fail (modules not yet implemented)

TDD: run PROMPT_LOOP_FASE4 next to implement and go green."
git push -u origin feat/block-embeddings
```

**Al completar:** CHECKPOINT → `TASK 4: DONE — ALL COMPLETE`

---

## REGLAS

1. **Tests DEFINE el contrato.** Si el test dice "strip keyword markers", la implementación DEBE hacerlo.
2. **22 tests para flatten, 5 para hook** = mínimo. Agregar más si encuentras edge cases.
3. **Seguir el pattern de testing del proyecto** (imports, mocking, assertions).
4. **Tests deben FALLAR al final** — la implementación los hace pasar.
