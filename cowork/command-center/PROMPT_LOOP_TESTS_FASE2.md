# PROMPT: Tests-First — Fase 2 (Student Block Renderers)

> **Uso:** Ejecutar con `/loop` en Claude Code CLI ANTES de PROMPT_LOOP_FASE2.
> **Branch:** `feat/block-based-summaries` (misma branch, tests primero)
> **Repo:** `C:\dev\axon\frontend`
> **Filosofía:** TDD — los tests definen el contrato, la implementación los cumple.

---

## INSTRUCCIONES PARA EL AGENTE

Escribes tests de altísima calidad. Tu trabajo define el estándar que la implementación debe cumplir. Cada test es un contrato: si pasa, la feature funciona correctamente.

### PASO 0 — ORIENTACIÓN

```bash
cat C:\dev\axon\frontend\CHECKPOINT_TESTS_F2.md 2>/dev/null || echo "NO_CHECKPOINT"
```

### PASO 1 — CONTEXTO (primer ciclo)

```bash
cd C:\dev\axon\frontend
git pull origin main
git checkout -b feat/block-based-summaries main 2>/dev/null || git checkout feat/block-based-summaries
npm install
```

Leer:
- `CLAUDE.md`
- `vite.config.ts` o `vitest.config.ts` — entender cómo corren los tests
- Buscar tests existentes: `find src -name "*.test.*" | head -10` — copiar el pattern
- `src/app/services/summariesApi.ts` — ver types existentes
- `src/app/components/student/ViewerBlock.tsx` — ver switch actual

---

## TASKS

### TASK 1: Setup — Crear estructura + test utilities

**Directorio:** `src/app/components/student/blocks/__tests__/`

**Archivo:** `test-utils.ts`
```typescript
import { SummaryBlock } from '../../../../services/summariesApi';

/**
 * Factory para crear bloques de test con defaults sensatos.
 * Cada test solo overridea lo que le importa.
 */
export function makeBlock(overrides: Partial<SummaryBlock> & { type: string; content: Record<string, any> }): SummaryBlock {
  return {
    id: crypto.randomUUID(),
    summary_id: crypto.randomUUID(),
    order_index: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Sample content fixtures per block type — matches block-schema.json exactly.
 */
export const FIXTURES = {
  prose: {
    type: 'prose' as const,
    content: {
      title: 'Introducción a la Aterosclerosis',
      content: 'La {{aterosclerosis}} es una enfermedad inflamatoria crónica...',
    },
  },
  key_point: {
    type: 'key_point' as const,
    content: {
      title: 'Concepto Central',
      content: 'La aterosclerosis NO es simplemente una acumulación pasiva de grasa.',
      importance: 'critical',
    },
  },
  key_point_high: {
    type: 'key_point' as const,
    content: {
      title: 'Punto Importante',
      content: 'El {{endotelio}} regula el tono vascular.',
      importance: 'high',
    },
  },
  stages: {
    type: 'stages' as const,
    content: {
      title: 'Progresión de la Aterosclerosis',
      items: [
        { stage: 1, title: 'Disfunción Endotelial', content: 'Daño al endotelio por factores de riesgo.', severity: 'mild' },
        { stage: 2, title: 'Formación de Estría Grasa', content: 'Acumulación de {{macrofagos}} y lípidos.', severity: 'moderate' },
        { stage: 3, title: 'Placa Vulnerable', content: 'Capa fibrosa delgada, núcleo lipídico grande.', severity: 'critical' },
      ],
    },
  },
  comparison: {
    type: 'comparison' as const,
    content: {
      title: 'Placa Estable vs Vulnerable',
      headers: ['Característica', 'Estable', 'Vulnerable'],
      rows: [
        ['Capa fibrosa', 'Gruesa', 'Delgada'],
        ['Núcleo lipídico', 'Pequeño', 'Grande'],
        ['Riesgo', 'Bajo', 'Alto'],
      ],
      highlight_column: 2,
    },
  },
  list_detail: {
    type: 'list_detail' as const,
    content: {
      title: 'Factores de Riesgo',
      intro: 'Los principales factores que contribuyen a la aterosclerosis.',
      items: [
        { icon: 'Heart', label: 'Hipertensión', detail: 'Daño mecánico al endotelio', severity: 'critical' },
        { icon: 'Pill', label: 'Dislipidemia', detail: 'LDL elevado, HDL bajo', severity: 'critical' },
        { icon: 'Activity', label: 'Sedentarismo', detail: 'Falta de ejercicio', severity: 'moderate' },
      ],
    },
  },
  grid: {
    type: 'grid' as const,
    content: {
      title: 'Mediadores Inflamatorios',
      columns: 3,
      items: [
        { icon: 'Shield', label: 'TNF-α', detail: 'Citoquina proinflamatoria' },
        { icon: 'Shield', label: 'IL-6', detail: 'Activa proteínas de fase aguda' },
        { icon: 'Shield', label: 'PCR', detail: 'Marcador de inflamación sistémica' },
      ],
    },
  },
  two_column: {
    type: 'two_column' as const,
    content: {
      columns: [
        { title: 'Factores Protectores', items: [{ label: 'HDL', detail: 'Transporte reverso' }] },
        { title: 'Factores de Riesgo', items: [{ label: 'LDL oxidado', detail: 'Inicia inflamación' }] },
      ],
    },
  },
  callout_tip: {
    type: 'callout' as const,
    content: { variant: 'tip', title: 'Dato Importante', content: 'El ejercicio aumenta HDL.' },
  },
  callout_warning: {
    type: 'callout' as const,
    content: { variant: 'warning', title: 'Atención', content: 'Síntomas silenciosos hasta evento agudo.' },
  },
  callout_clinical: {
    type: 'callout' as const,
    content: { variant: 'clinical', title: 'Caso Clínico', content: 'Paciente con dolor precordial.' },
  },
  callout_mnemonic: {
    type: 'callout' as const,
    content: { variant: 'mnemonic', title: 'Mnemotecnia', content: 'ABCDE de riesgo cardiovascular.' },
  },
  callout_exam: {
    type: 'callout' as const,
    content: { variant: 'exam', title: 'Para el Examen', content: 'Pregunta frecuente: cuál es el primer paso.' },
  },
  image_reference: {
    type: 'image_reference' as const,
    content: {
      description: 'Etapas de la aterogénesis',
      caption: 'Figura 1. Formación de la placa ateromatosa',
      image_url: 'https://example.com/placa.png',
    },
  },
  image_reference_empty: {
    type: 'image_reference' as const,
    content: {
      description: 'Sin imagen cargada',
    },
  },
  section_divider: {
    type: 'section_divider' as const,
    content: { label: 'Fisiopatología' },
  },
  section_divider_empty: {
    type: 'section_divider' as const,
    content: {},
  },
};
```

**Al completar:** CHECKPOINT → `TASK 1: DONE`

---

### TASK 2: Tests para cada block renderer (10 test files)

**Directorio:** `src/app/components/student/blocks/__tests__/`

Usar **Vitest + React Testing Library** (RTL). Seguir el pattern de tests existentes del proyecto.

**CADA test file debe cubrir:**

1. **Renders without crash** — basic smoke test
2. **Renders content correctly** — title, body text, items visible
3. **Handles missing/empty fields** — no crash on undefined
4. **Keyword markers preserved** — `{{keyword}}` appears as text (TreeWalker processes later)
5. **Accessibility** — semantic HTML (headings, tables, lists), meaningful text
6. **Visual contract** — critical CSS classes or attributes present

#### `ProseBlock.test.tsx`
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProseBlock from '../ProseBlock';
import { makeBlock, FIXTURES } from './test-utils';

describe('ProseBlock', () => {
  it('renders title and content', () => {
    const block = makeBlock(FIXTURES.prose);
    render(<ProseBlock block={block} />);
    expect(screen.getByText('Introducción a la Aterosclerosis')).toBeInTheDocument();
    expect(screen.getByText(/enfermedad inflamatoria crónica/)).toBeInTheDocument();
  });

  it('preserves keyword markers in text', () => {
    const block = makeBlock(FIXTURES.prose);
    render(<ProseBlock block={block} />);
    // Keywords should be rendered as plain text with markers for TreeWalker
    expect(screen.getByText(/\{\{aterosclerosis\}\}/)).toBeInTheDocument();
  });

  it('renders without title gracefully', () => {
    const block = makeBlock({ type: 'prose', content: { content: 'Just body text' } });
    render(<ProseBlock block={block} />);
    expect(screen.getByText('Just body text')).toBeInTheDocument();
  });

  it('handles empty content without crash', () => {
    const block = makeBlock({ type: 'prose', content: {} });
    const { container } = render(<ProseBlock block={block} />);
    expect(container).toBeInTheDocument();
  });
});
```

#### `KeyPointBlock.test.tsx`
```typescript
describe('KeyPointBlock', () => {
  it('renders with dark background (always)', () => {
    const block = makeBlock(FIXTURES.key_point);
    const { container } = render(<KeyPointBlock block={block} />);
    // Must have dark background class regardless of theme
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toMatch(/bg-teal-900|bg-gray-900/);
  });

  it('renders title in light color for contrast', () => {
    const block = makeBlock(FIXTURES.key_point);
    render(<KeyPointBlock block={block} />);
    expect(screen.getByText('Concepto Central')).toBeInTheDocument();
  });

  it('shows CRÍTICO badge for critical importance', () => {
    const block = makeBlock(FIXTURES.key_point);
    render(<KeyPointBlock block={block} />);
    expect(screen.getByText(/CRÍTICO/i)).toBeInTheDocument();
  });

  it('does NOT show badge for high importance', () => {
    const block = makeBlock(FIXTURES.key_point_high);
    render(<KeyPointBlock block={block} />);
    expect(screen.queryByText(/CRÍTICO/i)).not.toBeInTheDocument();
  });

  it('handles missing importance gracefully', () => {
    const block = makeBlock({ type: 'key_point', content: { title: 'Test', content: 'Text' } });
    const { container } = render(<KeyPointBlock block={block} />);
    expect(container).toBeInTheDocument();
  });
});
```

#### `StagesBlock.test.tsx`
```typescript
describe('StagesBlock', () => {
  it('renders all stages in order', () => {
    const block = makeBlock(FIXTURES.stages);
    render(<StagesBlock block={block} />);
    expect(screen.getByText('Disfunción Endotelial')).toBeInTheDocument();
    expect(screen.getByText('Formación de Estría Grasa')).toBeInTheDocument();
    expect(screen.getByText('Placa Vulnerable')).toBeInTheDocument();
  });

  it('renders stage numbers', () => {
    const block = makeBlock(FIXTURES.stages);
    render(<StagesBlock block={block} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('handles empty items array', () => {
    const block = makeBlock({ type: 'stages', content: { title: 'Empty', items: [] } });
    const { container } = render(<StagesBlock block={block} />);
    expect(container).toBeInTheDocument();
  });

  it('preserves keyword markers in stage content', () => {
    const block = makeBlock(FIXTURES.stages);
    render(<StagesBlock block={block} />);
    expect(screen.getByText(/\{\{macrofagos\}\}/)).toBeInTheDocument();
  });
});
```

#### `ComparisonBlock.test.tsx`
```typescript
describe('ComparisonBlock', () => {
  it('renders table with correct headers', () => {
    const block = makeBlock(FIXTURES.comparison);
    render(<ComparisonBlock block={block} />);
    expect(screen.getByText('Característica')).toBeInTheDocument();
    expect(screen.getByText('Estable')).toBeInTheDocument();
    expect(screen.getByText('Vulnerable')).toBeInTheDocument();
  });

  it('renders all rows', () => {
    const block = makeBlock(FIXTURES.comparison);
    render(<ComparisonBlock block={block} />);
    expect(screen.getByText('Capa fibrosa')).toBeInTheDocument();
    expect(screen.getByText('Gruesa')).toBeInTheDocument();
    expect(screen.getByText('Delgada')).toBeInTheDocument();
  });

  it('uses semantic table elements', () => {
    const block = makeBlock(FIXTURES.comparison);
    const { container } = render(<ComparisonBlock block={block} />);
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelector('thead')).toBeInTheDocument();
    expect(container.querySelector('tbody')).toBeInTheDocument();
    expect(container.querySelectorAll('th').length).toBe(3);
  });

  it('highlight column has emphasis styling', () => {
    const block = makeBlock(FIXTURES.comparison);
    const { container } = render(<ComparisonBlock block={block} />);
    // highlight_column = 2, so 3rd column should have emphasis
    const ths = container.querySelectorAll('th');
    expect(ths[2].className).toMatch(/text-teal|font-semibold/);
  });
});
```

#### `CalloutBlock.test.tsx`
```typescript
describe('CalloutBlock', () => {
  const variants = ['tip', 'warning', 'clinical', 'mnemonic', 'exam'] as const;

  variants.forEach(variant => {
    it(`renders ${variant} variant without crash`, () => {
      const fixture = FIXTURES[`callout_${variant}`] || FIXTURES.callout_tip;
      const block = makeBlock({ ...fixture, content: { ...fixture.content, variant } });
      const { container } = render(<CalloutBlock block={block} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it('renders label text for tip variant', () => {
    const block = makeBlock(FIXTURES.callout_tip);
    render(<CalloutBlock block={block} />);
    // The label should reflect the variant
    expect(screen.getByText(/Tip|tip/i)).toBeInTheDocument();
    expect(screen.getByText('El ejercicio aumenta HDL.')).toBeInTheDocument();
  });

  it('renders exam variant with correct label', () => {
    const block = makeBlock(FIXTURES.callout_exam);
    render(<CalloutBlock block={block} />);
    expect(screen.getByText(/Importante para Examen|examen/i)).toBeInTheDocument();
  });

  it('handles missing variant (defaults to tip)', () => {
    const block = makeBlock({ type: 'callout', content: { content: 'Default callout' } });
    const { container } = render(<CalloutBlock block={block} />);
    expect(container).toBeInTheDocument();
  });

  it('renders title when present', () => {
    const block = makeBlock(FIXTURES.callout_warning);
    render(<CalloutBlock block={block} />);
    expect(screen.getByText('Atención')).toBeInTheDocument();
  });
});
```

#### Remaining test files (create similar patterns for):

- **`ListDetailBlock.test.tsx`** — renders items with labels, handles severity, handles empty items, icons render
- **`GridBlock.test.tsx`** — renders N items, respects columns value, handles empty grid
- **`TwoColumnBlock.test.tsx`** — renders both columns, handles single column, empty items
- **`ImageReferenceBlock.test.tsx`** — renders image with src/alt, renders caption, shows placeholder when no image_url, handles empty content
- **`SectionDividerBlock.test.tsx`** — renders label, renders without label (just line), handles empty content

**CADA archivo debe tener mínimo 4 tests.**

**Al completar:** CHECKPOINT → `TASK 2: DONE`

---

### TASK 3: Integration test — ViewerBlock switch

**Archivo:** `src/app/components/student/__tests__/ViewerBlock.test.tsx`

```typescript
describe('ViewerBlock — block type routing', () => {
  const typeToFixture: Record<string, any> = {
    prose: FIXTURES.prose,
    key_point: FIXTURES.key_point,
    stages: FIXTURES.stages,
    comparison: FIXTURES.comparison,
    list_detail: FIXTURES.list_detail,
    grid: FIXTURES.grid,
    two_column: FIXTURES.two_column,
    callout: FIXTURES.callout_tip,
    image_reference: FIXTURES.image_reference,
    section_divider: FIXTURES.section_divider,
  };

  Object.entries(typeToFixture).forEach(([type, fixture]) => {
    it(`routes type="${type}" to correct renderer`, () => {
      const block = makeBlock(fixture);
      const { container } = render(<ViewerBlock block={block} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it('handles unknown block type without crash', () => {
    const block = makeBlock({ type: 'unknown_future_type' as any, content: {} });
    const { container } = render(<ViewerBlock block={block} />);
    expect(container).toBeInTheDocument();
  });
});
```

**Al completar:** CHECKPOINT → `TASK 3: DONE`

---

### TASK 4: Run tests — verify they fail (TDD red phase)

```bash
cd C:\dev\axon\frontend
npx vitest run src/app/components/student/blocks/__tests__/ --reporter=verbose 2>&1 | tail -30
```

**Expected:** ALL tests FAIL (because the components don't exist yet). This is correct TDD — red phase.

Verify:
- Tests themselves have no syntax errors
- The import paths are correct (they'll fail with "module not found", which is expected)
- If tests have SYNTAX errors, fix them

**Al completar:** CHECKPOINT → `TASK 4: DONE — Tests written, all fail as expected (red phase). Ready for PROMPT_LOOP_FASE2 to make them green.`

---

### TASK 5: Commit tests

```bash
git add src/app/components/student/blocks/__tests__/ src/app/components/student/__tests__/
git commit -m "test: add test suite for block renderers (TDD red phase)

- 10 block renderer test files with 50+ test cases
- Test fixtures matching block-schema.json
- Integration test for ViewerBlock type routing
- All tests fail (components not yet implemented)
- Tests define the contract: renders, contrast, a11y, edge cases

TDD: run PROMPT_LOOP_FASE2 next to implement and go green."
git push -u origin feat/block-based-summaries
```

**Al completar:** CHECKPOINT → `TASK 5: DONE — ALL COMPLETE`

---

## CHECKPOINT FILE

```markdown
# Tests Fase 2 Progress
- TASK 1: DONE | PENDING (test-utils + fixtures)
- TASK 2: DONE | PENDING (10 renderer test files)
- TASK 3: DONE | PENDING (ViewerBlock integration test)
- TASK 4: DONE | PENDING (verify tests fail — red phase)
- TASK 5: DONE | PENDING (commit + push)
## Notes
```

## REGLAS

1. **Tests PRIMERO, implementación DESPUÉS.** Estos tests definen el contrato.
2. **Cada test debe tener un nombre descriptivo** que explica QUÉ se valida y POR QUÉ.
3. **No mockear DOM innecesariamente** — RTL renderiza componentes reales.
4. **Fixtures deben coincidir con block-schema.json** exactamente.
5. **Mínimo 4 tests por componente:** smoke, content, edge case, a11y.
6. **Los tests deben FALLAR** al final de este prompt — la implementación los hace pasar.
