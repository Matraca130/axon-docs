# Diagnostico Final -- Frontend Security (XSS, CSP, Secrets, Route Guards)

**Date:** 2026-03-18
**Auditor:** Quality Gate Agent (Opus 4.6)
**Inputs:** pass1-frontend.md (14 hallazgos), pass2-frontend.md (14 confirmados + 3 adicionales)
**Method:** Consolidacion de Pass 1 + Pass 2, severidades finales ajustadas, prioridades de remediacion

---

## Estado General

El frontend de Axon presenta una cadena de ataque explotable compuesta por XSS via HTML no sanitizado (FE-001), tokens de sesion accesibles en localStorage (FE-002), y ausencia total de Content-Security-Policy (FE-003). Los 14 hallazgos originales fueron confirmados al 100% sin falsos positivos; se agregaron 3 hallazgos informativos menores en Pass 2.

---

## Hallazgos Confirmados

| ID | Severidad | Titulo | Archivo:Linea | Status | Recomendacion |
|----|-----------|--------|---------------|--------|---------------|
| FE-001 | CRITICAL | dangerouslySetInnerHTML sin sanitizacion (8 instancias) | ViewerBlock.tsx:61,228; ChunkRenderer.tsx:65; StudentSummaryReader.tsx:322,420; ReaderChunksTab.tsx:73; ReaderHeader.tsx:181; chart.tsx:83 | CONFIRMADO (Pass 1 + Pass 2) | Instalar dompurify, crear wrapper safeDangerousHtml(), aplicar en las 8 instancias |
| FE-002 | CRITICAL | JWT almacenado en localStorage | api.ts:38; AuthContext.tsx:220,366-369,377,401; apiConfig.ts:28 | CONFIRMADO (Pass 1 + Pass 2) | Corto plazo: eliminar vector XSS (FE-001/FE-003). Mediano plazo: migrar a httpOnly cookies |
| FE-003 | HIGH | Sin Content-Security-Policy | vercel.json:9-24; index.html | CONFIRMADO (Pass 1 + Pass 2) | Agregar CSP en vercel.json |
| FE-004 | HIGH | Supabase anon key hardcodeada en 2 archivos | supabase.ts:9-10; config.ts:11-13 | CONFIRMADO (Pass 1 + Pass 2) | Eliminar duplicado en config.ts, importar desde supabase.ts |
| FE-005 | HIGH | Student routes sin RequireRole guard | routes.tsx:100-107 | CONFIRMADO (Pass 1 + Pass 2) | Agregar RequireRole con roles student wrapper |
| FE-006 | MEDIUM | Sin header HSTS | vercel.json | CONFIRMADO (Pass 1 + Pass 2) | Agregar Strict-Transport-Security en vercel.json |
| FE-007 | MEDIUM | ErrorBoundary expone error.message | ErrorBoundary.tsx:68 | CONFIRMADO (Pass 1 + Pass 2) | Mostrar mensaje generico, loguear detalle internamente |
| FE-008 | MEDIUM | enrichHtmlWithImages sin validacion de dominio | summary-content-helpers.tsx:40-62 | CONFIRMADO con correccion (protocolo SI se valida, falta dominio) | Agregar allowlist de dominios |
| FE-009 | LOW | Sin .env -- config hardcodeada en source | supabase.ts; config.ts | CONFIRMADO, rebajado en Pass 2 (MEDIUM a LOW) | Migrar a import.meta.env |
| FE-010 | LOW | Open redirect parcial en LoginPage | LoginPage.tsx:48 | CONFIRMADO (Pass 1 + Pass 2) | Validar que pathname empiece con / y no contenga // |
| FE-011 | LOW | package-lock.json en .gitignore | .gitignore:6 | CONFIRMADO (Pass 1 + Pass 2) | Quitar de .gitignore y commitear el lockfile |
| FE-012 | LOW | Sin CSRF protection explicita | N/A (patron general) | CONFIRMADO (Pass 1 + Pass 2) | Riesgo mitigado por headers custom. No requiere accion inmediata |
| FE-013 | INFO | Supabase SDK persistSession en localStorage | supabase.ts:20 | CONFIRMADO (linea corregida 19 a 20) | Considerar persistSession false si se migra a httpOnly cookies |
| FE-014 | INFO | No se encontraron eval/Function/innerHTML | N/A | CONFIRMADO (Pass 1 + Pass 2) | Buena practica. Mantener |
| FE-ADD-001 | INFO | document.cookie en sidebar.tsx (shadcn/ui) | sidebar.tsx:86 | Nuevo en Pass 2 | Componente de terceros, sin accion requerida |
| FE-ADD-002 | INFO | localStorage con datos de quiz y reviews | useQuizBackup.ts; useReviewBatch.ts; ModelPartMesh.tsx | Nuevo en Pass 2 | Datos exfiltrables via XSS. Se mitiga con FE-001 + FE-003 |
| FE-ADD-003 | INFO | window.location.reload() en error handlers | lazyRetry.ts:47; ModelViewer3D.tsx:603; StudyHubView.tsx:246 | Nuevo en Pass 2 | Impacto nulo en seguridad |

---

## Detalle de Hallazgos Criticos y Altos

### FE-001 + FE-002 + FE-003: Cadena de ataque XSS-to-Account-Takeover

Estos tres hallazgos forman una cadena de explotacion completa y realista:

1. **Vector de entrada (FE-001):** 8 instancias de dangerouslySetInnerHTML renderizan HTML del backend sin pasar por DOMPurify ni ningun sanitizador. La dependencia dompurify no existe en el proyecto. La funcion enrichHtmlWithImages() transforma URLs pero NO sanitiza HTML.

2. **Persistencia de credenciales (FE-002):** El JWT de sesion (axon_access_token) y datos de membership se almacenan en localStorage, accesible desde cualquier script JS en el mismo origen.

3. **Sin defensa en profundidad (FE-003):** No hay Content-Security-Policy que restrinja la ejecucion de scripts inline o la conexion a dominios externos.

**Escenario de ataque concreto:** Un profesor inserta HTML malicioso en un resumen (o el contenido AI generado por Gemini/Claude se contamina). Cuando un estudiante visualiza ese resumen, se ejecuta JavaScript arbitrario que lee el token de sesion de localStorage y lo envia a un servidor externo. El atacante obtiene acceso completo a la cuenta del estudiante.

**Probabilidad:** Media-alta. El vector es viable tanto por actores internos (profesor malicioso) como por contaminacion del pipeline AI.

### FE-004: Anon Key Duplicada

La misma Supabase anon key aparece hardcodeada en supabase.ts y config.ts. Aunque la anon key es publica por diseno de Supabase, la duplicacion crea riesgo de desincronizacion y establece un mal patron. Ya documentado como BUG-025.

### FE-005: Student Routes sin Guard de Rol

Las rutas /student/* no tienen wrapper RequireRole, a diferencia de owner, admin y professor que si lo tienen. Un usuario con rol professor podria navegar manualmente a /student/*. El impacto real depende de la validacion backend, pero viola el principio de defensa en profundidad.

---

## Buenas Practicas Detectadas

1. **No hay eval(), new Function(), ni .innerHTML =** en todo el codebase (FE-014). Los unicos vectores de inyeccion son los dangerouslySetInnerHTML documentados.
2. **Headers de seguridad parciales** ya configurados en vercel.json: X-Content-Type-Options nosniff, X-Frame-Options DENY, Referrer-Policy strict-origin-when-cross-origin.
3. **Proteccion CSRF implicita** via headers custom (Authorization, X-Access-Token) que el navegador no envia automaticamente en peticiones cross-origin.
4. **Login redirect** usa solo pathname del router state (no query params completos), lo que limita significativamente el riesgo de open redirect.
5. **AutoRefreshToken habilitado** en Supabase SDK, asegurando que los tokens expiren y se renueven correctamente.

---

## Nivel de Riesgo: ALTO

Justificacion: Existe una cadena de ataque explotable (XSS then robo de JWT then account takeover) con 3 componentes confirmados. No se clasifica como CRITICO porque el vector de entrada requiere acceso al contenido del backend (profesor o AI comprometida), no es un ataque remoto directo sin autenticacion.

---

## Prioridades de Remediacion

### P0 -- Bloquear la cadena de ataque XSS (hacer ANTES de cualquier otro trabajo)

| Orden | ID | Accion | Esfuerzo estimado |
|-------|----|--------|-------------------|
| 1 | FE-001 | npm install dompurify @types/dompurify. Crear src/app/lib/sanitize.ts con wrapper safeDangerousHtml(). Aplicar en las 8 instancias. | 2-3 horas |
| 2 | FE-003 | Agregar header CSP en vercel.json. Probar que no rompa estilos inline de Tailwind ni scripts de Vite. | 1-2 horas |

### P1 -- Cerrar brechas de autorizacion

| Orden | ID | Accion | Esfuerzo estimado |
|-------|----|--------|-------------------|
| 3 | FE-005 | Agregar RequireRole con roles student en routes.tsx para las rutas student. | 30 min |
| 4 | FE-002 | Evaluar migracion a httpOnly cookies. Requiere coordinacion con backend. Priorizar despues de que FE-001 y FE-003 eliminen el vector XSS. | 1-2 dias |

### P2 -- Endurecimiento general

| Orden | ID | Accion | Esfuerzo estimado |
|-------|----|--------|-------------------|
| 5 | FE-006 | Agregar HSTS header en vercel.json. | 10 min |
| 6 | FE-007 | Reemplazar error.message por mensaje generico en ErrorBoundary. | 15 min |
| 7 | FE-004 | Eliminar duplicado de anon key en config.ts. | 15 min |
| 8 | FE-011 | Quitar package-lock.json de .gitignore. | 10 min |
| 9 | FE-008 | Agregar allowlist de dominios en enrichHtmlWithImages. | 30 min |

### P3 -- Mejoras a futuro (no urgentes)

| ID | Accion |
|----|--------|
| FE-009 | Migrar config a import.meta.env |
| FE-010 | Validar pathname en redirect post-login |
| FE-013 | Evaluar persistSession false si se migra a httpOnly cookies |

---

## Estadisticas Consolidadas

| Metrica | Valor |
|---------|-------|
| Hallazgos totales | 17 |
| CRITICAL | 2 |
| HIGH | 3 |
| MEDIUM | 3 |
| LOW | 4 |
| INFO | 5 |
| Falsos positivos | 0 |
| Precision de Pass 1 | 93% (1 linea menor, 1 correccion factual, 1 ajuste de severidad) |
| Hallazgos ya documentados en KNOWN-BUGS | 1 (FE-004 = BUG-025) |
| Hallazgos nuevos para KNOWN-BUGS | 4 criticos/altos (FE-001, FE-002, FE-003, FE-005) |

---

*Fin del diagnostico final. Siguiente paso: ejecutar remediacion P0 (FE-001 + FE-003).*
