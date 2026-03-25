# Agent Memory: XX-06 (test-orchestrator)
Last updated: 2026-03-25

## Rol
Ejecuta todas las suites de tests, reporta fallos y verifica cobertura. NO modifica código.

## Tests flaky conocidos (max 15)
| Fecha | Test | Archivo | Razón | Status |
|-------|------|---------|-------|--------|
| (ninguno aún) | — | — | — | — |

## Módulos problemáticos (top error producers)
| Módulo | Tests fallidos (acumulado) | Última vez | Tendencia |
|--------|---------------------------|------------|-----------|
| (ninguno aún) | — | — | — |

## Baseline de ejecución
| Métrica | Valor | Última actualización |
|---------|-------|---------------------|
| Frontend tests (total) | — | — |
| Backend tests (total) | — | — |
| Tiempo típico frontend | — | — |
| Tiempo típico backend | — | — |
| Tests con .only | — | — |
| Tests con .skip | — | — |

## Lecciones aprendidas
| Fecha | Lección | Prevención |
|-------|---------|------------|
| 2026-03-25 | (inicial) Archivo creado | — |

## Decisiones
| Fecha | Decisión | Contexto |
|-------|----------|----------|
| 2026-03-25 | Tests >5s se reportan como candidatos a optimización | Umbral definido en la spec del agente |
| 2026-03-25 | Agrupar fallos por módulo/feature | Facilita triaje por el Arquitecto |
