# Diagnostico Final -- Access Control / RLS / IDOR

**Date:** 2026-03-18
**Auditor:** Quality Gate Agent (Claude Opus 4.6)
**Inputs:** pass1-access.md (15 findings), pass2-access.md (15 confirmed + 4 additional)

---

## Estado General

El dominio de Access Control presenta dos deficiencias estructurales criticas: la ausencia sistematica de RLS en 30+ tablas de contenido y la exposicion de funciones SECURITY DEFINER sin verificacion de autenticacion ni tenant scoping. La capa aplicativa (Hono) tiene un diseno de autorizacion solido y fail-closed, pero queda completamente anulada cuando un atacante accede directamente via PostgREST.

---

## Hallazgos Confirmados

| ID | Severidad | Titulo | Archivo:Linea | Status | Recomendacion |
|----|-----------|--------|---------------|--------|---------------|
| ACCESS-001 | CRITICAL | RLS deshabilitado en 30+ tablas de contenido | Multiple tables (courses, flashcards, quizzes, etc.) | Confirmado P1+P2. Documentado como BUG-003/H3 | Habilitar RLS + politicas para todas las tablas de contenido (D3 deploy) |
| ACCESS-002 | CRITICAL | bulk_reorder() SECURITY DEFINER sin auth/tenant check, GRANT a anon | 20260227_01_bulk_reorder.sql:18,75 | Confirmado P1+P2. No documentado | REVOKE de anon/authenticated, agregar auth.uid() + institution check, SET search_path |
| ACCESS-003 | HIGH | messaging_admin_settings getUserInstitution() selecciona primera membresia sin ORDER BY | routes/settings/messaging-admin.ts:38-49 | Confirmado P1+P2 | Agregar parametro institution_id, verificar con requireInstitutionRole(), reemplazar getAdminClient() |
| ACCESS-004 | HIGH | Endpoints de gamificacion aceptan institution_id arbitrario sin verificar membership | routes/gamification/goals.ts:31-34,80-83,148-151 | Confirmado P1+P2. No documentado | Agregar requireInstitutionRole() a PUT /daily-goal, POST /goals/complete, POST /onboarding |
| ACCESS-005 | HIGH | subtopics-batch sin verificacion de institucion | routes/content/subtopics-batch.ts:51-98 | Confirmado P1+P2. No documentado | Resolver institucion desde primer keyword + requireInstitutionRole() |
| ACCESS-006 | MEDIUM | reorder endpoint solo verifica institucion del primer item | routes/content/reorder.ts:149-153 | Confirmado P1+P2 (bajado de HIGH a MEDIUM) | Verificar que todos los items pertenecen a la misma institucion |
| ACCESS-007 | MEDIUM | 12+ funciones SECURITY DEFINER sin SET search_path | Multiple migrations | Confirmado P1+P2 | Agregar SET search_path = public, pg_temp a todas las funciones SECURITY DEFINER |
| ACCESS-008 | MEDIUM | get_course_summary_ids() expuesta a anon/authenticated sin auth check | 20260227_02.sql:20-31 | Confirmado P1+P2. No documentado | REVOKE de anon/authenticated o agregar auth.uid() check |
| ACCESS-009 | MEDIUM | upsert_video_view() acepta user_id arbitrario, SECURITY DEFINER bypasses RLS | 20260227_03.sql:36-79 | Confirmado P1+P2. No documentado | Usar auth.uid() en lugar de p_user_id, REVOKE de anon |
| ACCESS-010 | MEDIUM | resolve_parent_institution() v2 sin search_path, GRANT a authenticated | 20260304_04.sql:24,186 | Confirmado P1+P2. No documentado | Agregar SET search_path; evaluar si GRANT a authenticated es necesario |
| ACCESS-011 | LOW (mitigated) | JWT no verificado criptograficamente en authenticate() | server/db.ts:100-123 | Confirmado P1+P2. Documentado como BUG-002/H1 | Implementar verificacion de firma JWT (planificado D2) |
| ACCESS-012 | LOW | canAssignRole() permite owner-to-owner (intencional) | server/auth-helpers.ts:293-299 | Confirmado P1+P2. Intencional | Considerar audit log para creacion de nuevos owners |
| ACCESS-013 | LOW | student_xp y xp_transactions sin RLS | 20260312_001_gamification_core_tables.sql | Confirmado P1+P2. Subconjunto de ACCESS-001 | Incluir en remediacion de ACCESS-001 |
| ACCESS-014 | INFO (+) | checkContentScope() fail-closed correcto | server/crud-factory.ts:206-244 | Confirmado P1+P2 | Ninguna -- funcionamiento correcto |
| ACCESS-015 | INFO (+) | auth-helpers.ts jerarquia de roles robusta | server/auth-helpers.ts | Confirmado P1+P2 | Ninguna -- funcionamiento correcto |
| ACCESS-016 | INFO | Comentario enganoso en subtopics-batch.ts sobre RLS | routes/content/subtopics-batch.ts:29 | Nuevo en P2 | Corregir comentario para reflejar que RLS NO esta habilitado |
| ACCESS-017 | LOW | keyword-connections-batch.ts verifica institucion solo del primer item | routes/content/keyword-connections-batch.ts:124 | Nuevo en P2 | Verificar que todos los IDs pertenecen a la misma institucion |
| ACCESS-018 | INFO | goals.ts console.warn expone estado interno (SQL details) | routes/gamification/goals.ts:200-203 | Nuevo en P2 | Reemplazar con structured logger, sanitizar mensaje |
| ACCESS-019 | INFO | messaging-admin.ts console.log filtra user_id e institution_id | routes/settings/messaging-admin.ts:213 | Nuevo en P2 | Reemplazar con structured logger |

---

## Detalle de Hallazgos Criticos y Altos

### ACCESS-001: RLS deshabilitado en 30+ tablas (CRITICAL)

Este es el hallazgo mas grave del sistema. Solo 8 de 38+ tablas tienen RLS habilitado. Todas las tablas del content hierarchy (courses, semesters, sections, topics, summaries, keywords, subtopics, flashcards, quizzes, videos, chunks) y las tablas de gamificacion (student_xp, xp_transactions) carecen de RLS. Un atacante con el Supabase URL y la anon key (que es publica en el frontend) puede acceder a PostgREST directamente, saltando completamente la capa Hono. Esto permite lectura y escritura de TODOS los datos de TODAS las instituciones.

- **Vector de ataque**: Cualquier usuario autenticado (o incluso anonimo para tablas sin restriccion) puede realizar queries directas a PostgREST.
- **Documentacion existente**: BUG-003 (CRITICAL, Pending), H3 en DECISIONS.md (P1, planificado para D3 deploy).
- **Remediacion**: Habilitar RLS en todas las tablas y crear politicas basadas en institution_id y user_id segun corresponda. Prioridad absoluta.

### ACCESS-002: bulk_reorder() sin auth ni tenant scoping (CRITICAL)

La funcion bulk_reorder() es SECURITY DEFINER (bypasses RLS) y tiene GRANT a anon y authenticated. No contiene verificacion de auth.uid() ni scoping por institution_id. Solo tiene un allowlist de tablas. Cualquier usuario (incluso anonimo) puede llamarla via PostgREST RPC para reordenar contenido de CUALQUIER institucion.

- **Vector de ataque**: POST /rest/v1/rpc/bulk_reorder con tabla y UUIDs de cualquier institucion.
- **Documentacion existente**: Ninguna -- hallazgo nuevo de esta auditoria.
- **Remediacion inmediata**: REVOKE EXECUTE de anon y authenticated. Agregar auth.uid() + verificacion de institucion dentro de la funcion. Agregar SET search_path.

### ACCESS-003: messaging_admin_settings institution non-deterministic (HIGH)

getUserInstitution() usa .limit(1).single() sin ORDER BY para seleccionar la institucion del admin. Para admins de multiples instituciones, la institucion seleccionada es no deterministica. Ademas usa getAdminClient() innecesariamente.

- **Remediacion**: Requerir institution_id como parametro del request y validar con requireInstitutionRole().

### ACCESS-004: Gamificacion sin verificacion de membership (HIGH)

Los 3 endpoints de gamificacion (PUT /daily-goal, POST /goals/complete, POST /onboarding) aceptan institution_id del body sin verificar que el caller tiene membership activa. Usan getAdminClient() para escribir directamente. Un atacante puede envenenar leaderboards y reclamar XP en instituciones ajenas.

- **Remediacion**: Agregar requireInstitutionRole() antes de cualquier escritura. Reemplazar getAdminClient() por cliente con scope del usuario.

### ACCESS-005: subtopics-batch sin scoping de institucion (HIGH)

El endpoint GET /subtopics-batch acepta hasta 50 keyword_ids y retorna subtopics sin verificar institucion. Contrasta con keyword-connections-batch.ts que si implementa la verificacion. El comentario en linea 29 falsamente afirma que RLS maneja el scoping.

- **Remediacion**: Implementar resolucion de institucion desde el primer keyword y llamar requireInstitutionRole(), identico al patron de keyword-connections-batch.ts.

---

## Buenas Practicas Detectadas

1. **checkContentScope() fail-closed** (ACCESS-014): Los 6 endpoints del CRUD factory (LIST, GET, POST, PUT, DELETE, RESTORE) pasan por checkContentScope() antes de operar. Parent keys desconocidos retornan null, que genera 404. Diseno defensivo ejemplar.

2. **auth-helpers.ts robusto** (ACCESS-015): Jerarquia de roles correcta con fail-closed en todos los paths. Unknown callerRole mapea a nivel 0 (no puede asignar nada), unknown targetRole mapea a Infinity (no puede ser asignado). requireInstitutionRole() retorna descriptor en lugar de Response, haciendolo testeable.

3. **Proteccion de ultimo owner**: El modulo de memberships impide eliminar al ultimo owner de una institucion, previniendo instituciones huerfanas.

4. **3 funciones RAG hardened**: rag_hybrid_search, rag_coarse_to_fine_search, y get_institution_summary_ids tienen REVOKE de anon/authenticated y SET search_path. Estas sirven como modelo para hardening de las demas funciones.

5. **scopeToUser en CRUD factory**: Las operaciones de estudiantes (kw_student_notes, text_annotations, video_notes) filtran correctamente por user.id dentro de la capa Hono.

---

## Nivel de Riesgo: CRITICO

La ausencia sistematica de RLS (ACCESS-001) combinada con funciones SECURITY DEFINER expuestas (ACCESS-002, ACCESS-008, ACCESS-009) significa que la seguridad del sistema depende exclusivamente de que los atacantes no descubran el URL de Supabase y la anon key, los cuales son publicos en el frontend. Esto constituye security by obscurity, que es insuficiente.

---

## Prioridades de Remediacion

### P0 -- Critico (resolver antes de cualquier deploy publico)

| ID | Fix | Esfuerzo |
|----|-----|----------|
| ACCESS-001 | Habilitar RLS + politicas en todas las tablas de contenido y gamificacion | ALTO |
| ACCESS-002 | REVOKE bulk_reorder() de anon/authenticated + auth.uid() + institution check + search_path | BAJO |

### P1 -- Alto (resolver en sprint actual)

| ID | Fix | Esfuerzo |
|----|-----|----------|
| ACCESS-004 | Agregar requireInstitutionRole() a los 3 endpoints de gamificacion | BAJO |
| ACCESS-005 | Agregar resolucion de institucion a subtopics-batch | BAJO |
| ACCESS-008 | REVOKE get_course_summary_ids() de anon/authenticated | BAJO |
| ACCESS-009 | REVOKE upsert_video_view() de anon + usar auth.uid() | BAJO |

### P2 -- Medio (resolver en siguiente sprint)

| ID | Fix | Esfuerzo |
|----|-----|----------|
| ACCESS-003 | Agregar institution_id param a messaging-admin + requireInstitutionRole() | BAJO |
| ACCESS-006 | Verificar todos los items del batch pertenecen a misma institucion | BAJO |
| ACCESS-007 | SET search_path en 12+ funciones SECURITY DEFINER | MEDIO |
| ACCESS-010 | SET search_path en resolve_parent_institution() + evaluar GRANT | BAJO |
| ACCESS-017 | Verificar todos los IDs en keyword-connections-batch | BAJO |

### P3 -- Bajo (backlog)

| ID | Fix | Esfuerzo |
|----|-----|----------|
| ACCESS-011 | Verificacion criptografica de JWT (planificado D2) | MEDIO |
| ACCESS-012 | Audit log para creacion de owners | BAJO |
| ACCESS-013 | Incluir en remediacion de ACCESS-001 | -- |
| ACCESS-016 | Corregir comentario enganoso | TRIVIAL |
| ACCESS-018 | Reemplazar console.warn con structured logger | TRIVIAL |
| ACCESS-019 | Reemplazar console.log con structured logger | TRIVIAL |
