# Instrucciones: Cómo Ejecutar la Migración

> **Para:** Petrick
> **Resumen:** 6 prompts, 4 terminales, 1 archivo de control global.

---

## ANTES DE EMPEZAR

1. Abre `MISSION_CONTROL.md` (este directorio) — es tu dashboard
2. Cada vez que una fase termine, marca la checkbox ✅ ahí
3. Si un agente se traba, revisa su `CHECKPOINT` local en el repo

---

## PASO 1: Fase 0+1 — SQL (tú desde Cowork, ~30 min)

**No necesita CLI.** Lo hacemos juntos con MCP Supabase o SQL Editor.

```
📄 Prompt: PROMPT_LOOP_FASE0_1_SQL.md
📍 Dónde: Cowork (esta misma sesión) o Supabase Dashboard
```

Cuando los 12+4 tests SQL pasen → actualizar MISSION_CONTROL → Fases 0 y 1 = ✅

---

## PASO 2: Frontend + Backend EN PARALELO (2 terminales)

Abre 2 terminales de Claude Code CLI. Cada prompt es UNIFICADO (tests + implementación juntos, TDD automático).

### Terminal 1 — Frontend (Fase 2 completa)

```bash
cd C:\dev\axon\frontend

# Copiar contenido COMPLETO de: PROMPT_COMPLETO_FRONTEND.md
# Ejecutar con: /loop
```

El agente hace todo en secuencia: fixtures → tests → verify fail → types → 10 renderers → build → commit+push.

### Terminal 2 — Backend (Fase 4 completa)

```bash
cd C:\dev\axon\backend

# Copiar contenido COMPLETO de: PROMPT_COMPLETO_BACKEND.md
# Ejecutar con: /loop
```

El agente hace todo: fixtures → 22 tests → verify fail → CRUD → hook → flatten → publish → check → commit+push.

> **Ambas terminales corren EN PARALELO** — repos distintos, cero conflicto.
> Cada prompt incluye el schema y las specs de diseño embebidas — el agente no necesita nada externo.

### ¿Cómo saber cuándo terminó cada agente?

Revisa PROGRESS.md en cada repo:
```bash
cat C:\dev\axon\frontend\PROGRESS.md    # Fase 2
cat C:\dev\axon\backend\PROGRESS.md     # Fase 4
# Si dice "ALL_COMPLETE" → listo
```

O revisa el git log:
```bash
git log --oneline -3
# Si ves "feat: block-based summary renderers..." → Fase 2 lista
# Si ves "feat: block hooks, flatten, publish..." → Fase 4 lista
```

---

## PASO 3: Merge PR de Fase 2

Cuando Terminal 1 termine la implementación:

```bash
cd C:\dev\axon\frontend
git log --oneline main..feat/block-based-summaries  # verificar commits
```

Ve a GitHub → crea PR → revisa → merge a main.

Actualizar MISSION_CONTROL → Fase 2 = ✅, "PR mergeada"

---

## PASO 4: Fase 3 — Primer Resumen Real (~30 min, Cowork)

Volvemos a Cowork juntos. Insertamos un resumen real en la DB y verificamos que se ve en el frontend.

---

## PASO 5: Fase 5 — Editor Profesor

**SOLO después de que Fase 2 esté mergeada a main.**

### Terminal 3

```bash
cd C:\dev\axon\frontend

# Copiar contenido de: PROMPT_LOOP_FASE5.md
# Ejecutar con: /loop
```

---

## RESUMEN VISUAL

```
                    ┌─────────────┐
                    │  Fase 0+1   │  ← Cowork (SQL + 16 tests)
                    │   30 min    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
    ┌──────────────────┐    ┌──────────────────┐
    │  Terminal 1       │    │  Terminal 2       │
    │  Frontend         │    │  Backend          │
    │                   │    │                   │
    │  1. Tests F2 🔴   │    │  1. Tests F4 🔴   │
    │     (~1h)         │    │     (~1h)         │
    │  2. Impl F2 🟢   │    │  2. Impl F4 🟢   │
    │     (~2-3h)       │    │     (~3-4h)       │
    └────────┬─────────┘    └──────────────────┘
             │
             ▼
    ┌──────────────────┐
    │  Merge PR Fase 2 │  ← GitHub (manual)
    └────────┬─────────┘
             │
    ┌────────┴─────────┐
    │  Fase 3 (Cowork) │  ← Insertar resumen real
    │     ~30 min       │
    └────────┬─────────┘
             │
    ┌────────┴─────────┐
    │  Terminal 3       │
    │  Fase 5: Editor   │
    │     ~4-6h         │
    └──────────────────┘
```

---

## TROUBLESHOOTING

### "El agente repite trabajo ya hecho"
→ Revisar que el CHECKPOINT existe y no se borró:
```bash
cat CHECKPOINT.md              # Fase 2
cat CHECKPOINT_FASE4.md        # Fase 4
cat CHECKPOINT_FASE5.md        # Fase 5
cat CHECKPOINT_TESTS_F2.md     # Tests Fase 2
cat CHECKPOINT_TESTS_F4.md     # Tests Fase 4
```

### "npm run build falla después de la implementación"
→ El agente debería arreglarlo solo (Task 5/7 incluye fix loop). Si se traba, revisar el error y darle contexto.

### "Los tests pasan pero el componente se ve mal"
→ Los tests validan estructura y contenido, no visual pixel-perfect. Para visual → revisar en browser.

### "Quiero pausar y continuar mañana"
→ Los CHECKPOINTs persisten. Solo vuelve a pegar el mismo prompt en `/loop` y el agente retoma donde quedó.

### "Quiero ver el progreso global"
→ Abre `MISSION_CONTROL.md` — tiene el estado de todas las fases.

---

## ARCHIVOS DE REFERENCIA

| Archivo | Qué es |
|---------|--------|
| `MISSION_CONTROL.md` | Dashboard global — actualizar manualmente |
| `PROMPT_LOOP_FASE0_1_SQL.md` | SQL migration + 15 tests (YA EJECUTADO) |
| `PROMPT_COMPLETO_FRONTEND.md` | Frontend: tests + implementación unificado (Fase 2) |
| `PROMPT_COMPLETO_BACKEND.md` | Backend: tests + implementación unificado (Fase 4) |
| `PROMPT_LOOP_FASE5.md` | Editor profesor (Fase 5, después de merge Fase 2) |
| `PLAN_MIGRACION_BLOQUES_v3.md` | Plan completo (referencia) |
| `Prototipo_Resumenes_Axon_FINAL.jsx` | Prototipo visual (referencia diseño) |
| `schema/block-schema.json` | Schema JSON de los 10 block types |
