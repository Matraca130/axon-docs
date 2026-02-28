# Guia Pre-Commit — Axon v4.4+

> **Proposito:** Workflow obligatorio antes de hacer `git commit` en cualquier repo de Axon.
> Aplica a **frontend** (`numero1_sseki_2325_55`), **backend** (`axon-backend`), y **docs** (`axon-docs`).
>
> **Fecha:** 2026-02-28

---

## Tabla de Contenidos

1. [Commit Message Convention](#1-commit-message-convention)
2. [Pre-Commit Checklist — Frontend](#2-pre-commit-checklist--frontend)
3. [Pre-Commit Checklist — Backend](#3-pre-commit-checklist--backend)
4. [Pre-Commit Checklist — Documentacion](#4-pre-commit-checklist--documentacion)
5. [Git Workflow](#5-git-workflow)
6. [Archivos Prohibidos](#6-archivos-prohibidos)
7. [Futuro: Automatizacion](#7-futuro-automatizacion)

---

## 1. Commit Message Convention

### Formato

```
type(scope): descripcion corta en minusculas

Cuerpo opcional: contexto, razon del cambio.
Referencia a ticket/bug si aplica.
```

### Types permitidos

| Type | Cuando usarlo | Ejemplo |
|------|--------------|--------|
| `feat` | Nueva funcionalidad | `feat(flashcards): add FSRS scheduling engine` |
| `fix` | Correccion de bug | `fix(auth): prevent token refresh loop on 401` |
| `refactor` | Reestructuracion sin cambio funcional | `refactor(api): consolidate triple API layer into apiClient` |
| `perf` | Mejora de performance | `perf(content): lazy load content tree on demand` |
| `chore` | Mantenimiento, cleanup, config | `chore: remove dead owner-routes.tsx` |
| `docs` | Solo documentacion | `docs: add COMMIT-GUIDE.md` |
| `style` | Formato, whitespace (sin cambio logico) | `style: fix indentation in routes-study.ts` |
| `test` | Agregar o corregir tests | `test(validate): add edge cases for isUuid` |
| `ci` | Cambios en CI/CD | `ci: add TypeScript check to deploy workflow` |
| `security` | Fix de seguridad | `security(auth): implement JWT verification` |
| `migration` | Migracion SQL | `migration: add get_content_tree RPC` |

### Scopes comunes

**Frontend:** `auth`, `content`, `flashcards`, `quiz`, `study`, `video`, `3d`, `dashboard`, `admin`, `billing`, `api`, `routing`, `ui`

**Backend:** `auth`, `content`, `members`, `billing`, `mux`, `plans`, `search`, `storage`, `student`, `study`, `study-queue`, `models`, `crud-factory`, `validate`

### Reglas

- Primera linea: maximo 72 caracteres
- Descripcion en **minusculas** (no capitalizar despues del type)
- Sin punto final en la primera linea
- Si el commit resuelve un bug conocido: `fix(BUG-XXX): descripcion`
- Si el commit es parte de un diagnostico: `fix(F-XX): descripcion` o `fix(O-XX): descripcion`

### Ejemplos reales de Axon

```
# BIEN
feat(content): implement content tree with get_content_tree RPC
fix(BUG-003): add JWT verification before external API calls
refactor(F-02): consolidate triple API layer into single apiClient
perf(BUG-014): route-level code splitting with React Router lazy
chore(M-4): delete dead owner-routes.tsx
migration: add indexes for institution_id foreign keys

# MAL
Update files                        ← no type, no scope, no contexto
fixed stuff                         ← no type, vago
Feat: Add new feature               ← capitalizado, sin scope
feat(flashcards): Added FSRS.       ← capitalizado, punto final
```

---

## 2. Pre-Commit Checklist — Frontend

Antes de hacer `git commit` en `numero1_sseki_2325_55`:

### Obligatorio (bloquea commit)

```markdown
- [ ] TypeScript compila sin errores (`npx tsc --noEmit`)
- [ ] No hay `console.log` / `console.error` sueltos (usar `logger` de `lib/logger.ts`)
- [ ] No hay `any` nuevo en tipos de API o props de componentes
- [ ] No hay `fetch()` directo — todo pasa por `apiClient`
- [ ] No hay secrets/keys hardcodeados (ANON_KEY va en env vars)
- [ ] Imports usan `@/` alias (no `../../../`)
- [ ] No se importa de `context/` Y `contexts/` — solo uno
- [ ] No hay archivos nuevos en `data/` (mock data no va en el bundle)
- [ ] Archivo no excede limites: componente < 500 lineas, hook < 250, service < 400
```

### Recomendado (no bloquea, pero revisar)

```markdown
- [ ] Componentes de lista usan `React.memo`
- [ ] Callbacks en listas usan `useCallback`
- [ ] Nuevas paginas usan `lazy()` en routes
- [ ] Nuevos componentes tienen ErrorBoundary si hacen fetch
- [ ] Tipos nuevos estan en `types/platform.ts` o `types/ui.ts` (no inline)
- [ ] Si toca auth: verificar que `useAuth()` funciona en dev (login → navigate)
```

### Comando rapido de verificacion

```bash
# Correr ANTES de git commit
npx tsc --noEmit && \
grep -rn "console\.log" src/app/ --include="*.tsx" --include="*.ts" | grep -v "logger" | grep -v "node_modules" && \
echo "--- CHECK: No console.log found ---" || \
echo "⚠️  Found console.log — replace with logger"
```

---

## 3. Pre-Commit Checklist — Backend

Antes de hacer `git commit` en `axon-backend`:

### Obligatorio (bloquea commit)

```markdown
- [ ] `deno check supabase/functions/server/index.ts` pasa sin errores
- [ ] Tests pasan: `deno test supabase/functions/server/tests/`
- [ ] Toda ruta nueva sigue la secuencia: Auth → Role → Validate → Logic → Response
- [ ] Toda ruta LIST tiene paginacion con `limit` (MAX 500) y `offset`
- [ ] Todo SELECT usa columnas especificas (no `select("*")` en listas)
- [ ] No hay archivos `.tsx` sin JSX (debe ser `.ts`)
- [ ] No hay secrets hardcodeados (Stripe key, Mux key van en env vars)
- [ ] Si toca `crud-factory.ts`: DETENERSE — el factory es sagrado
- [ ] Queries independientes en `Promise.all` (no secuenciales)
- [ ] Aggregaciones en SQL, no en JS (`reduce` sobre arrays grandes = bug)
```

### Recomendado (no bloquea, pero revisar)

```markdown
- [ ] Ruta custom < 80 lineas (extraer logica si excede)
- [ ] Route file < 400 lineas (split por dominio si excede)
- [ ] Input validado con `validate.ts` (no `typeof` inline)
- [ ] Si llama API externa: tiene canary query antes
- [ ] Si usa RPC nuevo: tiene fallback pattern
- [ ] Nuevo endpoint documentado en `API-MAP.md`
```

### Comando rapido de verificacion

```bash
# Correr ANTES de git commit
deno check supabase/functions/server/index.ts && \
deno test supabase/functions/server/tests/ && \
echo "✅ All checks passed"
```

---

## 4. Pre-Commit Checklist — Documentacion

Antes de hacer `git commit` en `axon-docs`:

```markdown
- [ ] Archivos < 10KB (si excede, split en secciones)
- [ ] Links internos entre documentos son correctos
- [ ] Si documenta una ruta nueva: `API-MAP.md` actualizado
- [ ] Si documenta un bug resuelto: `KNOWN-BUGS.md` status → RESOLVED
- [ ] Si documenta una migracion: tiene verification query
- [ ] Si documenta una decision: usa formato DEC-NNN en `DECISION-LOG.md`
- [ ] Sin typos en nombres de tablas/columnas (cross-check con schema docs)
```

---

## 5. Git Workflow

### 5.1 Branch Naming

```
# Formato
type/descripcion-corta

# Ejemplos
feat/flashcard-fsrs-engine
fix/BUG-003-jwt-verification
refactor/consolidate-api-layer
chore/cleanup-dead-files
migration/content-tree-rpc
```

### 5.2 Cuando Crear un Branch

| Cambio | Branch? | Razon |
|--------|---------|-------|
| Hotfix de 1 archivo, < 20 lineas | No, directo a `main` | Overhead innecesario para solo-dev |
| Feature nueva o refactor multi-archivo | Si | Poder revertir atomicamente |
| Migracion SQL + backend update | Si | Coordinar deploy |
| Solo documentacion | No, directo a `main` | No afecta codigo |

**Nota:** Esta regla aplica mientras Axon sea un proyecto de 1 developer. Con equipo, TODO va en branch + PR.

### 5.3 Commits Atomicos

Cada commit debe ser una unidad logica completa:

```
# MAL: Un commit gigante
git commit -m "update everything"

# BIEN: Commits atomicos
git commit -m "refactor(api): extract apiClient from platformApi"
git commit -m "refactor(api): migrate auth service to use apiClient"
git commit -m "refactor(api): migrate content service to use apiClient"
git commit -m "chore: remove old platformApi.ts"
```

### 5.4 Orden de Operaciones para Cambios Cross-Repo

Cuando un cambio toca backend + frontend + docs:

```
1. Backend: commit + push (auto-deploy via GitHub Actions)
2. Verificar deploy: curl https://...supabase.co/functions/v1/server/health
3. Frontend: commit + push (auto-deploy via Vercel)
4. Verificar deploy: abrir app en Vercel preview
5. Docs: commit + push (actualizar API-MAP, KNOWN-BUGS, etc.)
```

**NUNCA** pushear frontend antes que backend si el frontend depende de un endpoint nuevo.

---

## 6. Archivos Prohibidos

Estos archivos NUNCA deben aparecer en un commit:

### Frontend (`numero1_sseki_2325_55`)

```gitignore
# Ya en .gitignore (verificar)
node_modules/          ← CRITICO: actualmente committeado, limpiar
.env                   ← Variables de entorno
.env.local
*.patch                ← Archivos de diff temporal
dist/                  ← Build output
.vite/                 ← Cache de Vite

# No deberian existir en src/
src/app/data/          ← Mock data no va en el bundle
src/**/*.md            ← Documentacion va en axon-docs
*.tsx que solo tiene texto/docs ← No es un componente React
```

### Backend (`axon-backend`)

```gitignore
# Ya en .gitignore (verificar)
.env
.env.local
node_modules/

# Nunca committear
__tests__/             ← Duplicado; el canonico es tests/
*.tsx                  ← Backend no tiene JSX; usar .ts
```

### Verificar antes de push

```bash
# Ver que archivos se van a committear
git diff --cached --name-only

# Buscar archivos problematicos
git diff --cached --name-only | grep -E "(node_modules|.env|\.patch|__tests__)" && \
echo "⚠️ ABORT: Prohibited files staged" || \
echo "✅ No prohibited files"
```

---

## 7. Futuro: Automatizacion

Cuando el equipo crezca (>1 developer), implementar:

### 7.1 Husky + lint-staged (Frontend)

```bash
# Instalar
npx husky init
npm install --save-dev lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged
npx tsc --noEmit
```

### 7.2 GitHub Actions — CI para Frontend

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx vitest run --reporter=verbose
```

### 7.3 GitHub Actions — Mejorar CI de Backend

El `deploy.yml` actual solo deployea. Agregar paso de tests:

```yaml
# Agregar ANTES del deploy step:
- name: Type check
  run: deno check supabase/functions/server/index.ts

- name: Run tests
  run: deno test supabase/functions/server/tests/
```

### 7.4 PR Template

Crear `.github/PULL_REQUEST_TEMPLATE.md` en ambos repos:

```markdown
## Que cambia este PR?

<!-- Descripcion breve -->

## Tipo de cambio

- [ ] feat (nueva funcionalidad)
- [ ] fix (correccion de bug)
- [ ] refactor (reestructuracion)
- [ ] chore (mantenimiento)
- [ ] migration (SQL)

## Checklist

- [ ] TypeScript compila sin errores
- [ ] Tests pasan
- [ ] No hay console.log sueltos
- [ ] No hay secrets hardcodeados
- [ ] Documentacion actualizada (si aplica)

## Tickets relacionados

<!-- BUG-XXX, F-XX, O-XX -->
```

---

## Resumen Visual

```
                    ┌─────────────────────┐
                    │  Escribir codigo     │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Checklist pre-commit│
                    │  (seccion 2, 3, o 4) │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  git add -p         │
                    │  (review cada hunk) │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Verificar staged   │
                    │  git diff --cached  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Commit message     │
                    │  type(scope): desc  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Push               │
                    │  (auto-deploy)      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Verificar deploy   │
                    │  curl /health o app │
                    └─────────────────────┘
```
