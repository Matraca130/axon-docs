# Agent Memory: AS-03 (rls-auditor)
Last updated: 2026-03-25

## Rol
Audita políticas Row Level Security de PostgreSQL. Detecta tablas sin protección, políticas permisivas y misconfiguraciones.

## Estado de tablas auditadas
| Tabla | RLS Enabled | Policies (S/I/U/D) | Última auditoría | Issues |
|-------|-------------|---------------------|-----------------|--------|
| (ninguna aún) | — | — | — | — |

> S=SELECT, I=INSERT, U=UPDATE, D=DELETE

## Brechas históricas
| Fecha | Tabla | Tipo de brecha | Severidad | Resuelto? | Cómo |
|-------|-------|---------------|-----------|-----------|------|
| (ninguna aún) | — | — | — | — | — |

## Patrones RLS validados
| Pattern | Notas |
|---------|-------|
| `auth.uid() = user_id` para SELECT propio | Patrón estándar de Supabase |
| `auth.role() = 'service_role'` para admin | Solo backend con service key |
| RLS enabled sin policies = bloqueado | Supabase bloquea todo por defecto |

## Falsos positivos conocidos
| Pattern | Por qué es falso positivo |
|---------|--------------------------|
| (ninguno aún) | — |

## Lecciones aprendidas
| Fecha | Lección | Prevención |
|-------|---------|------------|
| 2026-03-25 | (inicial) Archivo creado | — |
