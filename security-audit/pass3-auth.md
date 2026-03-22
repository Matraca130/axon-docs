# Diagnostico Final -- AUTH/JWT/Sessions

> **Auditor:** Quality Gate Agent (Claude Opus 4.6)
> **Date:** 2026-03-18
> **Inputs:** pass1-auth.md (Infra Agent), pass2-auth.md (Cross-Review)

---

## Estado General

El dominio AUTH tiene un defecto estructural critico: la funcion authenticate() no verifica la firma criptografica del JWT, lo que convierte toda la cadena de autenticacion en dependiente de que cada ruta haga un query a PostgREST antes de actuar. El almacenamiento de tokens en localStorage sigue el patron estandar de SPAs con Supabase pero amplifica el impacto de cualquier XSS. Hay un plan de remediacion documentado (DEC-003, jose deployment) que resolveria 4 hallazgos simultaneamente, pero no se ha ejecutado.

---

## Hallazgos Confirmados

| ID | Severidad | Titulo | Archivo:Linea | Status | Recomendacion |
|----|-----------|--------|---------------|--------|---------------|
| AUTH-001 | CRITICAL | JWT no verificado criptograficamente en authenticate() | db.ts:100-176 | Conocido (BUG-002, DEC-003) | Implementar verificacion con jose antes de launch (D2) |
| AUTH-002 | HIGH | Token almacenado en localStorage, vulnerable a XSS | api.ts:37-41 | Nuevo | Migrar a HttpOnly cookies o in-memory con PKCE flow |
| AUTH-003 | HIGH | Sin invalidacion server-side de sesion al logout | AuthContext.tsx:357-371 | Nuevo | Reducir JWT expiry a 300s via Supabase dashboard; evaluar token blocklist |
| AUTH-004 | HIGH | ANON_KEY hardcodeada y expuesta en bundle, combinada con RLS deshabilitado | supabase.ts:9-10 | Conocido (BUG-025 + BUG-003) | Habilitar RLS (D3); mover key a env var con build-time injection |
| AUTH-005 | MEDIUM | Rate-limit middleware usa userId no verificado via adminClient | routes/ai/index.ts:68-74 | Conocido (DEC-003) | Se resuelve con D2 (jose). Impacto real: rate-limit pollution, no consumo de APIs pagadas |
| AUTH-006 | MEDIUM | Rate limiter bypassable via rotacion de sub en JWT forjado | rate-limit.ts:76-77 | Conocido (DEC-007) | Se resuelve con D2 (jose). Fallback: rate-limit por IP como segunda capa |
| AUTH-007 | MEDIUM | getAdminClient() singleton accesible globalmente (31 archivos) | db.ts:50-55 | Nuevo | Wrapper con audit logging y restriccion de importacion a modulos autorizados |
| AUTH-014 | MEDIUM | Requests sin autenticacion bypasean rate limiter completamente | rate-limit.ts:152-156 | Nuevo | Aplicar rate-limit por IP para requests sin token |
| AUTH-008 | LOW | Tokens sin campo exp son aceptados | db.ts:166 | Nuevo | Post-D2: rechazar JWTs sin exp como defensa en profundidad |
| AUTH-009 | LOW | Refresh token tambien en localStorage via Supabase SDK | supabase.ts:19-21 | Nuevo | Se resuelve junto con AUTH-002 si se migra a cookies |
| AUTH-013 | LOW | extractToken() acepta JWT de ambos headers sin prioridad clara | db.ts:84-93 | Nuevo | Documentar comportamiento; considerar rechazar si ambos headers difieren |
| AUTH-010 | INFO | CSRF mitigado via custom headers + CORS | api.ts:75-82 | N/A | Nota arquitectural: mantener CORS restrictivo |
| AUTH-011 | INFO | auth-helpers.ts bien disenado, fail-closed en todo | auth-helpers.ts | N/A | Buena practica, no requiere accion |
| AUTH-012 | INFO | AI rate limiter ahora fail-closed (D1 fix confirmado) | routes/ai/index.ts:82-98 | N/A | Buena practica, no requiere accion |

---

## Detalle de Hallazgos Criticos y Altos

### AUTH-001 -- CRITICAL: JWT no verificado criptograficamente

**Descripcion:** La funcion authenticate() en db.ts solo decodifica el payload del JWT en base64 (lineas 100-123). No verifica la firma HMAC-SHA256. El comentario en linea 97 dice "PostgREST/RLS handles that", delegando la verificacion a las queries de base de datos.

**Cadena de ataque:**
1. Atacante construye un JWT con sub arbitrario y exp futuro
2. Envia request con ese JWT en X-Access-Token
3. authenticate() decodifica el payload sin cuestionar la firma
4. Si la ruta usa user.id antes de un query a PostgREST (o si usa adminClient), la identidad forjada nunca es retada
5. El atacante puede contaminar rate-limit counters, inyectar datos en logs, y potencialmente acceder a rutas que usan adminClient con el userId forjado

**Impacto concreto:** En el estado actual, los handlers de AI (chat.ts, etc.) SI validan el JWT via DB queries antes de llamar a APIs externas (PF-05 FIX). Esto limita el impacto real a: (a) contaminacion de rate-limit counters, (b) consumo de compute en Edge Functions con 401s tardios, (c) inyeccion de identidades falsas en logs de telemetria. Si se agrega cualquier ruta futura que no siga este patron, el impacto escala a exfiltracion de datos y consumo de APIs pagadas.

**Recomendacion:** Implementar verificacion de firma con la libreria jose (ya planificado como D2 en DEC-003). Verificar contra la clave HMAC de Supabase (SUPABASE_JWT_SECRET). Esto resuelve AUTH-001, AUTH-005, AUTH-006 y AUTH-008 simultaneamente. Esfuerzo: medio (1-2 dias de desarrollo + testing).

---

### AUTH-002 -- HIGH: Token en localStorage vulnerable a XSS

**Descripcion:** El access token del usuario se almacena en localStorage bajo la clave axon_access_token. Cualquier JavaScript ejecutado en el mismo origen puede leerlo con localStorage.getItem().

**Cadena de ataque:**
1. Atacante inyecta JS via XSS (vulnerable dependency, stored XSS en contenido educativo, etc.)
2. Script ejecuta localStorage.getItem y obtiene axon_access_token y sb-ref-auth-token
3. Atacante obtiene access token + refresh token
4. Con el refresh token, genera access tokens indefinidamente desde cualquier maquina
5. Account takeover completo hasta que el usuario cambie su contrasena

**Impacto concreto:** Full account takeover. El atacante hereda los permisos del usuario (puede ser Owner, Admin, Professor). En una plataforma educativa medica, esto puede significar acceso a datos de estudiantes, modificacion de contenido curricular, y consumo de creditos de AI.

**Recomendacion:** A corto plazo: implementar Content Security Policy estricta para reducir superficie XSS. A medio plazo: evaluar migracion a Supabase PKCE flow con tokens en memoria (no persisted). El patron actual (localStorage) es el estandar de la industria SPA y el propio Supabase SDK lo usa, por lo que la migracion requiere coordinacion significativa con el backend.

---

### AUTH-003 -- HIGH: Sin invalidacion server-side al logout

**Descripcion:** logout() llama a supabase.auth.signOut() que revoca el refresh token, pero el access JWT sigue siendo valido hasta que expire (default: 3600s / 1 hora).

**Cadena de ataque:**
1. Atacante obtiene access token (via XSS, shoulder surfing, shared computer)
2. Usuario detecta actividad sospechosa y hace logout
3. El logout NO invalida el access token -- sigue funcionando por hasta 1 hora
4. Atacante continua operando con total normalidad durante la ventana de validez

**Impacto concreto:** El logout es una accion de emergencia que no cumple su proposito. Un usuario comprometido no puede cortar el acceso del atacante de forma inmediata. Esta es una limitacion arquitectural de Supabase (no soporta token blocklists).

**Recomendacion:** Reducir JWT expiry a 300 segundos (5 minutos) via Supabase Dashboard > Auth > JWT Expiry. Esto reduce la ventana de exposicion de 1 hora a 5 minutos. El Supabase SDK maneja el refresh automaticamente, por lo que los usuarios legitimos no notaran diferencia. Esfuerzo: trivial (cambio de configuracion en dashboard).

---

### AUTH-004 -- HIGH: ANON_KEY hardcodeada + RLS deshabilitado

**Descripcion:** La ANON_KEY de Supabase esta hardcodeada en supabase.ts y visible en el bundle de produccion. Por si sola no es vulnerable (es publica por diseno). Pero combinada con BUG-003 (RLS deshabilitado en tablas de contenido), permite acceso directo a la base de datos sin autenticacion.

**Cadena de ataque:**
1. Atacante extrae ANON_KEY del bundle JS de produccion (es un JWT con exp en 2036)
2. Hace requests directos a la URL de Supabase PostgREST con solo la ANON_KEY
3. Sin RLS, PostgREST devuelve TODOS los datos de las tablas de contenido
4. El backend y su autenticacion son completamente bypasseados

**Impacto concreto:** Exfiltracion completa de todo el contenido educativo, datos de estudiantes, y cualquier tabla sin RLS. El atacante no necesita credenciales de usuario.

**Recomendacion:** Prioridad maxima: habilitar RLS en todas las tablas de contenido (D3, ya planificado). Mover la ANON_KEY a variables de entorno con build-time injection (VITE_SUPABASE_ANON_KEY). Esfuerzo: significativo para RLS (requiere politicas para 43 tablas), trivial para env var.

---

## Buenas Practicas Detectadas

- **auth-helpers.ts implementa fail-closed correctamente**: roles desconocidos deniegan, inputs vacios deniegan, errores de DB deniegan. Modulo bien ingeniado (AUTH-011).
- **AI rate limiter es fail-closed**: errores de RPC y excepciones devuelven 500 en lugar de permitir el request (AUTH-012). Fix D1 confirmado.
- **PF-05 FIX en handlers de AI**: Los handlers de chat/AI hacen DB queries con el user-scoped client ANTES de llamar a APIs externas, lo que valida el JWT via PostgREST antes de incurrir costos.
- **CORS actualmente restringido a origenes especificos** (fix BUG-004), lo que provee proteccion CSRF implicita via custom headers.
- **Dual-token architecture** (ANON_KEY + User JWT) es un patron solido que separa identidad de proyecto de identidad de usuario.
- **signOut() revoca refresh token server-side**, limitando la persistencia de tokens robados (aunque el access token sigue vivo hasta exp).

---

## Nivel de Riesgo: ALTO

Justificacion: Existe un defecto CRITICO confirmado (JWT sin verificacion criptografica) con un plan de remediacion documentado pero no ejecutado. El impacto real esta parcialmente mitigado por el patron PF-05 en handlers de AI, pero cualquier nueva ruta que no siga este patron reintroduce el riesgo completo. La combinacion ANON_KEY + RLS deshabilitado permite exfiltracion de datos sin autenticacion.

---

## Prioridades de Remediacion

1. **Reducir JWT expiry a 300s** -- Mitiga AUTH-003 inmediatamente. Esfuerzo: **trivial** (cambio en Supabase Dashboard).
2. **Implementar verificacion JWT con jose (D2)** -- Resuelve AUTH-001, AUTH-005, AUTH-006, AUTH-008 simultaneamente. Es el cambio de mayor impacto. Esfuerzo: **medio** (1-2 dias).
3. **Habilitar RLS en tablas de contenido (D3)** -- Resuelve el multiplicador de fuerza detras de AUTH-004. Esfuerzo: **significativo** (politicas para 43 tablas, requiere testing exhaustivo).
4. **Rate-limit por IP para requests sin token** -- Resuelve AUTH-014. Esfuerzo: **trivial** (agregar fallback a IP en extractKey()).
5. **Content Security Policy estricta** -- Reduce superficie para AUTH-002 y AUTH-009. Esfuerzo: **medio** (requiere inventario de scripts/estilos inline).
6. **Mover ANON_KEY a env var** -- Parte de AUTH-004. No es critico por si solo pero es buena higiene. Esfuerzo: **trivial**.
7. **Wrapper para getAdminClient() con audit logging** -- Resuelve AUTH-007. Esfuerzo: **medio** (refactor de 31 archivos).
8. **Documentar y endurecer extractToken()** -- Resuelve AUTH-013. Esfuerzo: **trivial**.

---

*End of Pass 3 diagnostic.*
