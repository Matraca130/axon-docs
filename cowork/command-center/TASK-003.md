# TASK-003: Fix BUG-006 (MEDIUM) - Content Tree Filter (Inactive Items)

## Metadata
- **ID**: TASK-003
- **Created**: 2026-03-21
- **Priority**: 🟡 MEDIUM
- **Status**: 🟡 ABIERTO
- **Sprint/Fase**: Fase 1 - Bug Fixing
- **Estimación**: 3 horas
- **Deadline**: 2026-03-25

## Agentes Asignados
| Agente | Rol | Estado | Última Actividad |
|--------|-----|--------|-----------------|
| summaries-frontend | Frontend (React) | ABIERTO | 2026-03-21 |

## Descripción
Corregir bug en content tree (jerarquía de resúmenes) que renderiza items inactivos (deleted content). El filter logic en React tiene error en nombre de campo o lógica booleana.

**Síntomas:**
- Content tree muestra resúmenes deleted
- Secciones inactivas aparecen en navegación
- Clicking deleted items causa errores (404)
- UI confuso para usuarios

## Contexto
El árbol de contenidos (ContentTree component) permite a usuarios navegar por la jerarquía:
```
Institution
  └─ Course
      └─ Semester
          └─ Section (deleted - SHOULD NOT SHOW)
              └─ Topic
                  └─ Summary (deleted - SHOULD NOT SHOW)
```

Actualmente, items marcados como deleted/inactive aparecen en el árbol.

## Criterios de Aceptación
- [ ] Identificar archivo del component
- [ ] Encontrar source del error (field name vs logic)
- [ ] Corregir filter function
- [ ] Verificar contra API response
- [ ] Deleted items no aparecen en tree
- [ ] Inactive items respetan toggle
- [ ] Performance no degrada
- [ ] Tests agregados para filter logic
- [ ] No regressions en otros components

## Dependencias
- Depende de: summaries-backend (API debe filtrar también)
- Bloquea a: UX quality (not critical functionality)

## Archivos Afectados
```
src/components/summaries/ContentTree.tsx (PRINCIPAL)
├── Component: ContentTree
├── Function: filterActiveItems() ← ERROR AQUÍ
└── Line: ~120

src/hooks/useSummary.ts (SECUNDARIO)
├── Function: fetchSummaryHierarchy()
└── Field mapping: active vs is_active

tests/components/ContentTree.test.tsx (NEW)
└── Add tests para filter logic
```

## Pasos de Implementación

### 1. Investigación (45 minutos)
- [ ] Revisar `src/components/summaries/ContentTree.tsx`
- [ ] Revisar respuesta de API: `GET /summaries/hierarchy`
- [ ] Comparar field names: `active`, `is_active`, `deleted`, `status`
- [ ] Revisar hook `useSummary.ts` para data fetching
- [ ] Verificar DB schema en backend

Preguntas a responder:
- ¿Cuál es el field name exacto de la API?
- ¿Es booleano (active: true/false) o enum (status: 'active'/'deleted')?
- ¿El API filtra antes o frontend debe filtrar?

### 2. Identificación del Bug (30 minutos)
- [ ] Encontrar línea exacta del error
- [ ] Verificar si es typo en field name
- [ ] O si es lógica incorrecta (e.g., !item.active cuando debería ser item.active)

Patrón esperado (CORRECTO):
```typescript
const activeItems = items.filter(item => item.is_active === true);
// O
const activeItems = items.filter(item => !item.deleted);
// O
const activeItems = items.filter(item => item.status === 'active');
```

Patrón actual (INCORRECTO):
```typescript
const activeItems = items.filter(item => item.active); // field doesn't exist
// O
const activeItems = items.filter(item => !item.is_active); // logic inverted!
```

### 3. Implementación Fix (45 minutos)
- [ ] Actualizar filter function con field correcto
- [ ] Asegurar lógica booleana correcta
- [ ] Add null checks (items might not have field)
- [ ] Teste en todos los niveles del tree

Solución esperada:
```typescript
// FIXED filterActiveItems function
function filterActiveItems(items: TreeNode[]): TreeNode[] {
  return items
    .filter(item => {
      // Check correct field from API
      const isActive = item.is_active || item.status === 'active';
      return isActive;
    })
    .map(item => ({
      ...item,
      // Recursively filter children
      children: filterActiveItems(item.children || [])
    }));
}
```

### 4. Testing (1 hora)
- [ ] Unit test: filter function
- [ ] Component test: tree rendering
- [ ] Edge cases: mixed active/inactive

Test template:
```typescript
describe('ContentTree - filterActiveItems', () => {
  test('excludes inactive items', () => {
    const items = [
      { id: 1, name: 'Active', is_active: true },
      { id: 2, name: 'Inactive', is_active: false },
      { id: 3, name: 'Deleted', status: 'deleted' }
    ];

    const filtered = filterActiveItems(items);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(1);
  });

  test('recursively filters children', () => {
    const items = [
      {
        id: 1,
        is_active: true,
        children: [
          { id: 11, is_active: true },
          { id: 12, is_active: false }
        ]
      }
    ];

    const filtered = filterActiveItems(items);
    expect(filtered[0].children).toHaveLength(1);
    expect(filtered[0].children[0].id).toBe(11);
  });

  test('handles missing is_active field', () => {
    const items = [{ id: 1, name: 'Unknown' }];
    expect(() => filterActiveItems(items)).not.toThrow();
  });
});
```

### 5. Integration Testing (30 minutos)
- [ ] Verificar API response tiene correcta structure
- [ ] Llamar API directamente e inspeccionare
- [ ] Render component con real data
- [ ] Manual testing en UI

## Log de Progreso

### 2026-03-21 - STATUS: ABIERTO
- Tarea creada
- Asignada a: summaries-frontend agent
- Waiting for investigation phase

### [Agent Work Here]

---

## Información Técnica

### Tree Structure (Expected from API)
```typescript
interface TreeNode {
  id: string;
  type: 'topic' | 'section' | 'course' | 'institution';
  name: string;
  is_active: boolean;  // KEY FIELD
  status?: 'active' | 'deleted' | 'archived';
  children?: TreeNode[];
}
```

### Possible Field Names (API Variants)
| DB Schema | API Response | Meaning |
|-----------|--------------|---------|
| is_active | is_active | Boolean true/false |
| deleted_at | deleted_at | Timestamp or null |
| status | status | Enum: 'active'/'deleted' |
| active | active | Boolean (legacy) |

### Related Components
```
SummaryReader.tsx
  └─ ContentTree.tsx (HERE - filter broken)
      └─ TreeNode.tsx (renders single item)
      └─ filterActiveItems() (filter logic)
```

## Testing Checklist

- [ ] Unit tests for filter function
- [ ] Component render tests
- [ ] Integration test with real API
- [ ] ESLint passing
- [ ] TypeScript strict mode passing
- [ ] All existing tests still pass
- [ ] Coverage >80%

## Success Metrics

✅ **Definition of Done:**
- Deleted items no longer appear in tree
- Tree renders only active items
- No performance regression
- All tests passing
- No console errors or warnings

## Notas Importantes

1. **API Dependency:** Verificar que backend también filtra (not just frontend)
2. **Performance:** Don't filter recursively en render (memoize)
3. **Consistency:** Use mismo filter en multiple places si needed
4. **UX:** Consider "show inactive" toggle para admins

## Recursos

- **Component:** `/src/components/summaries/ContentTree.tsx`
- **Hook:** `/src/hooks/useSummary.ts`
- **API Docs:** `/sessions/nice-brave-hawking/mnt/AXON PROJECTO/axon-docs/api-endpoints.md`
- **Bug Details:** `/ideas/TODO_IMPLEMENT.md` (BUG-006)

---

**Próxima Acción:** summaries-frontend agent comienza investigación
**Tiempo Total Estimado:** 3 horas (45 + 30 + 45 + 60 + 30 = 210 minutos)
**Impacto:** UX quality improvement, no critical
**Complication:** Depende de backend API structure
