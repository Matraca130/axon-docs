# Tareas Pendientes de Implementación - Bugs & Tech Debt
## Axon v4.5 Medical Education Platform

**Última Actualización:** 2026-03-21
**Total Bugs Abiertos:** 11 (1 CRÍTICO, 4 MEDIUM, 6 LOW, 3 INFO)
**Completadas:** 0 (Este sprint)
**Pendientes:** 11

---

## 🔴 CRÍTICA PRIORIDAD (1 bug)

### BUG-001: Mux Webhook resolution_tier vs max_resolution Mismatch

**ID:** BUG-001
**Severidad:** 🔴 CRÍTICA
**Módulo:** infra-ai (webhook handler)
**Reported:** 2026-03-15
**Assigned to:** infra-ai agent
**Status:** 🔴 BLOCKING

#### Descripción
Mux webhook envía payload con campo `max_resolution`, pero nuestro handler espera `resolution_tier`. Esto causa que videos de resúmenes no se procesen correctamente.

#### Síntomas
- Video uploads fail with 400 Bad Request
- Webhook processing throws error
- Video metadata not stored in DB
- Impact: Summaries con videos no funcionar

#### Root Cause
En Mux API v2, el campo se cambió de `resolution_tier` a `max_resolution`. Nuestro handler aún usa el nombre antiguo.

#### Código Afectado
```
src/lib/webhooks/mux-handler.ts
├── Function: processMuxEvent()
└── Line: ~45 (resolution_tier field mapping)
```

#### Fix Required
1. Actualizar webhook handler para aceptar `max_resolution`
2. Map backwards compatibility si es necesario
3. Add tests para webhook payload
4. Validate contra actual Mux webhook examples

#### Estimación
- Time to fix: 2 hours
- Testing: 1 hour
- Total: 3 hours

#### Test Cases
- [ ] Webhook con max_resolution=1080p procesa correctamente
- [ ] Webhook con max_resolution=4k procesa correctamente
- [ ] Otros campos del webhook no se ven afectados
- [ ] DB actualiza metadata correctamente

#### Acceptance Criteria
- ✅ Video uploads work without errors
- ✅ Mux webhook processed successfully
- ✅ Video metadata stored in database
- ✅ Tests pass for all webhook scenarios

---

## 🟡 MEDIUM PRIORIDAD (4 bugs)

### BUG-006: Content Tree Filters Actives/Inactives in JavaScript

**ID:** BUG-006
**Severidad:** 🟡 MEDIUM
**Módulo:** summaries-frontend (React component)
**Reported:** 2026-03-12
**Assigned to:** summaries-frontend agent
**Status:** 🟡 IN PROGRESS

#### Descripción
El árbol de contenidos (hierarchy viewer) renderiza items inactivos (deleted content) cuando debería filtrarlos. El problema está en la lógica de filtrado JavaScript.

#### Síntomas
- Content tree shows deleted summaries
- Deleted sections appear in navigation
- UI confusing for users
- Clicking deleted items causes errors

#### Root Cause
Filter function en React component chequea `item.active` pero debería chequear `item.is_active` o el campo correcto de la DB.

#### Código Afectado
```
src/components/summaries/ContentTree.tsx
├── Component: ContentTree
├── Function: filterActiveItems()
└── Line: ~120 (filter logic error)

src/hooks/useSummary.ts
└── Field mismatch: active vs is_active
```

#### Fix Required
1. Identify correct field name en DB schema
2. Update filter function en React
3. Test en todos los estados (activo, inactivo, deleted)
4. Verify API response también filtra

#### Estimación
- Time to fix: 2 hours
- Testing: 1 hour
- Total: 3 hours

#### Acceptance Criteria
- ✅ Deleted items no appear in tree
- ✅ Inactive items respetan toggle
- ✅ Performance no degrada
- ✅ Tests added for filter logic

---

### BUG-021: GamificationContext is STUB (Needs Full Implementation)

**ID:** BUG-021
**Severidad:** 🟡 MEDIUM
**Módulo:** infra-ui (Context + UI)
**Reported:** 2026-03-10
**Assigned to:** infra-ui agent
**Status:** 🟡 PENDING

#### Descripción
El GamificationContext existe pero es solo un stub. No implementa XP tracking, streak management, badges, o leaderboard functionality. Necesita full implementation con backend integration.

#### Componentes STUB
```
src/contexts/GamificationContext.tsx
├── UserXP (stub)
├── StreakManager (stub)
├── BadgeSystem (stub)
└── LeaderboardData (stub)

src/hooks/useGamification.ts
├── useUserXP() → returns mock data
├── useStreaks() → returns mock data
├── useBadges() → returns mock data
└── useLeaderboard() → returns mock data
```

#### Requisitos
1. Implement XP system (track points per action)
2. Implement streak tracker (consecutive days)
3. Implement badge system (achievement unlocks)
4. Implement leaderboard queries
5. Real-time updates via WebSocket or polling

#### Backend Dependencies
- GET /user/xp - Get user XP total
- PUT /user/xp - Add XP
- GET /user/streaks - Get current streaks
- GET /leaderboard - Get top users
- GET /badges/:userId - Get user badges

#### Estimación
- Context implementation: 3 hours
- Hook implementation: 2 hours
- Component integration: 2 hours
- Testing: 2 hours
- Total: 9 hours

#### Acceptance Criteria
- ✅ Real XP tracking from actions
- ✅ Streak management working
- ✅ Badges unlocking on achievement
- ✅ Leaderboard populated + real-time
- ✅ All tests passing

---

### SEC-S9B: 6 SQL Functions Need REVOKE (Security)

**ID:** SEC-S9B
**Severidad:** 🟡 MEDIUM
**Módulo:** infra-plumbing (database)
**Type:** Security Issue
**Reported:** 2026-03-18 (Security Audit Round 1)
**Assigned to:** infra-plumbing agent
**Status:** 🟡 PENDING

#### Descripción
Security audit encontró 6 funciones SQL que tienen permisos ejecutables de forma pública (PUBLIC grant). Debería haber REVOKE para restringir acceso a solo usuarios autorizados.

#### Funciones Afectadas
1. `fn_calculate_fsrs_weight()` - Public (should be SECURITY DEFINER)
2. `fn_bkt_calculate_probability()` - Public (should be SECURITY DEFINER)
3. `fn_chunk_summary()` - Public (should be RESTRICTED)
4. `fn_generate_embedding()` - Public (should be RESTRICTED)
5. `fn_validate_institution_access()` - Public (should be SECURITY DEFINER)
6. `fn_check_course_permission()` - Public (should be SECURITY DEFINER)

#### Fix Required
Para cada función:
```sql
-- Current (VULNERABLE)
GRANT EXECUTE ON FUNCTION fn_name() TO PUBLIC;

-- Should be
REVOKE EXECUTE ON FUNCTION fn_name() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fn_name() TO authenticated;
ALTER FUNCTION fn_name() SECURITY DEFINER;
```

#### Estimación
- Analysis: 1 hour
- REVOKE statements: 2 hours
- Testing: 1 hour
- Total: 4 hours

#### Testing
- [ ] Functions not accessible from anonymous connections
- [ ] Functions accessible from authenticated users
- [ ] SECURITY DEFINER context works correctly
- [ ] No performance regression

#### Acceptance Criteria
- ✅ All REVOKE statements applied
- ✅ All functions use SECURITY DEFINER where appropriate
- ✅ Tests confirm security restrictions
- ✅ Security audit round 1 issues resolved

---

### TEST-001: Frontend Tests Failing / Test Infrastructure Missing

**ID:** TEST-001
**Severidad:** 🟡 MEDIUM (but blocks deployment)
**Módulo:** flashcards-frontend, quiz-frontend, summaries-frontend
**Type:** Testing / Setup
**Reported:** 2026-03-15
**Assigned to:** flashcards-tester, quiz-tester, summaries-tester
**Status:** 🔴 BLOCKING DEPLOYMENT

#### Descripción
Frontend test infrastructure no está configurada. Tests fallan porque Vitest/Jest setup está incompleto. Bloquea:
- Frontend deployments
- Test coverage reporting
- Tester agent work

#### Missing Components
1. Vitest configuration for React 18
2. Testing Library setup
3. Mock setup para API calls
4. Mock setup para Tailwind
5. Test utilities and helpers
6. E2E test setup (Cypress)

#### Setup Required
```
package.json
├── Add: vitest, @testing-library/react, @testing-library/user-event
├── Add: @vitest/ui, @vitest/coverage-v8
└── Update: scripts for test, coverage, watch

vitest.config.ts
├── Configure for React + JSX
├── Setup DOM environment
├── Configure Tailwind resolution
└── Setup path aliases

tests/setup.ts
├── Configure Testing Library
├── Setup mocks
└── Global test utilities
```

#### Estimación
- Vitest config: 2 hours
- Testing Library setup: 1 hour
- Mock setup: 2 hours
- E2E setup (Cypress): 2 hours
- Write initial tests: 4 hours
- Total: 11 hours

#### Acceptance Criteria
- ✅ Tests run without errors
- ✅ Coverage reports generated
- ✅ CI/CD tests passing
- ✅ 40%+ initial coverage
- ✅ Path towards 80% coverage clear

---

## 🔵 LOW PRIORIDAD (6 bugs)

### BUG-011: ~25 kv_store_* Junk Tables (Database Cleanup)

**ID:** BUG-011
**Severidad:** 🔵 LOW
**Módulo:** infra-plumbing (database)
**Type:** Maintenance
**Reported:** 2026-03-10
**Status:** ⏳ PENDING

#### Descripción
Aproximadamente 25 tablas `kv_store_*` colgadas en la DB que parecen ser legado. Deberían removerse o documentarse por qué existen.

#### Tablas Identificadas
- kv_store_sessions
- kv_store_temp_data
- kv_store_cache_v1
- ... (total ~25)

#### Fix
1. Audit cada tabla para verificar si se usa
2. Backup antes de eliminar
3. Drop si no se usan
4. Document si legacy pero necesarias

#### Estimación
- Audit: 1 hour
- Cleanup: 1 hour
- Total: 2 hours

---

### BUG-024: Overlapping Types in 2 Services (TypeScript)

**ID:** BUG-024
**Severidad:** 🔵 LOW
**Módulo:** infra-ui + flashcards-frontend (TypeScript)
**Type:** Code Quality
**Reported:** 2026-03-12
**Status:** ⏳ PENDING

#### Descripción
Tipos TypeScript solapados entre servicios (e.g., `User` type definido en múltiples archivos). Debería centralizarse en infra-ui.

#### Ejemplos
- `types/User.ts` definido en 2+ lugares
- `types/Flashcard.ts` con pequeñas variaciones
- `types/ApiResponse.ts` duplicado

#### Fix
1. Identify all duplicates
2. Merge en archivo central
3. Update imports en todos los servicios
4. Run TypeScript strict check

#### Estimación: 2 hours

---

### BUG-027: Dual Content Tree Implementation (Architecture)

**ID:** BUG-027
**Severidad:** 🔵 LOW
**Módulo:** summaries-frontend
**Type:** Architecture / Refactoring
**Reported:** 2026-03-08
**Status:** ⏳ PENDING

#### Descripción
Hay dos implementaciones del content tree (jerarquía) en diferentes lugares del código. Debería consolidarse a una sola implementación.

#### Duplicados
- `components/summaries/ContentTree.tsx`
- `components/summaries/SectionHierarchy.tsx`

#### Fix
1. Compare ambas implementaciones
2. Identify best approach
3. Consolidate a una
4. Remove duplicate
5. Update all references

#### Estimación: 3 hours

---

### SEC-S7: JWT Expiry 3600s (Should Be Higher)

**ID:** SEC-S7
**Severidad:** 🔵 LOW
**Módulo:** infra-plumbing (auth)
**Type:** Security / Configuration
**Reported:** 2026-03-18
**Status:** ⏳ PENDING

#### Descripción
JWT token expiry configurado a 3600s (1 hora). Para mejor UX, debería ser 7 días o más, con refresh token strategy.

#### Recomendación
- Access token: 24 horas
- Refresh token: 30 días
- Implement refresh endpoint

#### Current Code
```typescript
const expiresIn = '3600s'; // 1 hour
```

#### Fix
```typescript
const accessTokenExpiry = '24h'; // Access token
const refreshTokenExpiry = '30d'; // Refresh token
// Implement POST /auth/refresh endpoint
```

#### Estimación: 3 hours

---

### BUG-034: GET /reading-states Returns 400

**ID:** BUG-034
**Severidad:** 🔵 LOW
**Módulo:** infra-plumbing (API endpoint)
**Type:** Bug
**Reported:** 2026-03-14
**Status:** ⏳ PENDING

#### Descripción
Endpoint GET /reading-states retorna error 400 en lugar de datos. Probablemente query parameter incorrecto o falta validación.

#### Endpoint
```
GET /reading-states?summaryId=123&userId=456
```

#### Error
```
400 Bad Request
Missing required parameter: reading_state_id
```

#### Fix
1. Check endpoint implementation
2. Identify required vs optional params
3. Update validation
4. Add tests

#### Estimación: 1.5 hours

---

## ℹ️ INFORMACIÓN / TRACKING (3 items)

### BUG-022: INFO - Performance Optimization Opportunities

**ID:** BUG-022
**Type:** Information / Tracking
**Status:** 📋 BACKLOG

Identificadas oportunidades de optimización en consultas DB. No es un bug pero debería documentarse para Fase 2.

---

### BUG-023: INFO - Missing Error Handling in AI Provider Fallback

**ID:** BUG-023
**Type:** Information / Tracking
**Status:** 📋 BACKLOG

AI provider calls no tienen fallback si Gemini falla. Debería implementar fallback a Claude o OpenAI.

---

### BUG-025: INFO - Documentation of Data Hierarchy

**ID:** BUG-025
**Type:** Information / Tracking
**Status:** 📋 BACKLOG

Data hierarchy (Institution → Course → Semester → Section → Topic → Summary) debería documentarse en API docs.

---

## 📊 Estadísticas

| Categoría | Total | Abiertos | Cerrados | % Completado |
|-----------|-------|----------|----------|--------------|
| CRÍTICA | 1 | 1 | 0 | 0% |
| MEDIUM | 4 | 4 | 0 | 0% |
| LOW | 6 | 6 | 0 | 0% |
| INFO | 3 | 3 | 0 | 0% |
| **TOTAL** | **14** | **14** | **0** | **0%** |

---

## 🎯 Estimación Total de Trabajo

| Severidad | # Bugs | Estimado | Total |
|-----------|--------|----------|-------|
| CRÍTICA | 1 | 3h | 3h |
| MEDIUM | 4 | 4h, 9h, 4h, 11h | 28h |
| LOW | 6 | 2h, 2h, 3h, 3h, 1.5h, ... | 14h |
| INFO | 3 | Backlog | - |
| **TOTAL** | **11** | - | **45h** |

---

## 🔄 Sprint Prioritization

### Este Sprint (2026-03-21 a 2026-03-28)
1. **BUG-001** (CRITICAL) - 3 hours
   - Fix Mux webhook resolution_tier
   - Unblocks: Video uploads, content

2. **TEST-001** (HIGH) - 11 hours
   - Setup frontend test infrastructure
   - Unblocks: All tester agent work, deployments

3. **BUG-006** (MEDIUM) - 3 hours
   - Fix content tree filter
   - Unblocks: Summaries full feature parity

4. **SEC-S9B** (MEDIUM) - 4 hours
   - Add REVOKE to SQL functions
   - Security hardening

**Sprint Total: 21 hours** (5 working days @ 4h/day per agent)

### Próximo Sprint (2026-03-28 a 2026-04-04)
5. BUG-021 (MEDIUM) - 9 hours
6. BUG-034 (LOW) - 1.5 hours
7. BUG-011 (LOW) - 2 hours
8. BUG-024 (LOW) - 2 hours

---

## 🔗 Plantilla para Reportar Nuevo Bug

```markdown
### BUG-XXX: [Título Descriptivo]

**ID:** BUG-XXX
**Severidad:** 🔴 CRÍTICA / 🟡 MEDIUM / 🔵 LOW / ℹ️ INFO
**Módulo:** [module-name]
**Reported:** YYYY-MM-DD
**Assigned to:** [Agent Name]
**Status:** 🔴 BLOCKING / 🟡 PENDING / ✅ DONE

#### Descripción
[Explicación clara del problema]

#### Síntomas
- [Síntoma 1]
- [Síntoma 2]

#### Root Cause
[Causa raíz identificada o hipótesis]

#### Fix Required
1. [Paso 1]
2. [Paso 2]

#### Estimación
- Time: X hours

#### Acceptance Criteria
- [ ] Criterio 1
- [ ] Criterio 2
```

---

## 📝 Notas Importantes

1. **BUG-001 es CRÍTICO:** Bloquea toda funcionalidad de video
2. **TEST-001 es BLOCKER:** Sin esto, tester agents no pueden trabajar
3. **Orden por severidad:** Resolver CRÍTICA > MEDIUM > LOW
4. **Sprint planning:** Máx 20 horas/sprint por agent disponible
5. **Escalation:** Si bug bloquea otro, notificar inmediatamente

---

**Última actualización:** 2026-03-21
**Estado:** 11 bugs abiertos, 45h estimado total
**Próxima revisión:** 2026-03-28 (fin de sprint)
