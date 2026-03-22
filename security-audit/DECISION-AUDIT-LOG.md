# Decision Audit Log — Remediation Plan

**Propósito:** Cada iteración del loop audita las decisiones de implementación de iteraciones anteriores.
**Formato:** Cada entrada documenta qué se revisó, qué problemas se encontraron, y qué se corrigió.

---

## Entradas

## Iteracion 1 — 2026-03-18 07:00

### Seccion desarrollada: S1 (Telegram Quick Fixes)
### Secciones auditadas: Ninguna (primera iteracion)

#### Notas de decision — S1

1. **Patron de referencia:** Se eligio copiar exactamente el patron de WhatsApp porque ya esta auditado y probado en produccion. Esto asegura consistencia y reduce riesgo de regresion.

2. **Guard `if (!headerSecret) return false;` antes de timingSafeEqual:** Necesario porque `timingSafeEqual` usa `TextEncoder.encode()` que convertiria `undefined` en la string literal `"undefined"`, pasando una comparacion falsa contra un secret real. WhatsApp no necesita este guard porque su verificacion usa HMAC (la firma nunca es null si el header esta presente).

3. **No se modifica timing-safe.ts:20 (length leak):** El early return cuando las longitudes difieren es un compromiso aceptable. El webhook secret de Telegram tiene longitud fija conocida (la define el desarrollador al registrar el webhook), asi que filtrar la longitud no agrega informacion util. Corregir esto requeriria padding a longitud maxima, lo cual es un cambio separado y de menor prioridad.

4. **Riesgo operacional identificado:** Si TELEGRAM_WEBHOOK_SECRET no esta en produccion, el fix convierte "inseguro pero funcional" en "seguro pero inoperante". Se agrego checklist pre-implementacion para mitigar.

---

## Iteracion 2 — 2026-03-18 07:15

### Seccion desarrollada: S2 (bulk_reorder REVOKE)
### Secciones auditadas: S1

#### Auditoria de S1 (Telegram Quick Fixes)

- **Archivos verificados:** ✅
  - `webhook.ts:120-128` — Confirmado. Linea 120 es `function verifyWebhookSecret`, linea 122 es `if (!secret)`, linea 124 es `return true`, linea 128 es `return headerSecret === secret`.
  - `index.ts:57` — Confirmado. `if (!token || !serviceRoleKey || token !== serviceRoleKey)` en setup-webhook.
  - `index.ts:86` — Confirmado. Misma linea en delete-webhook.
  - `timing-safe.ts` — Confirmado. Existe, exporta `timingSafeEqual`, ya importado por whatsapp/index.ts:18.
- **Compatibilidad:** ✅ Los cambios son minimales (import + 3 lineas). No cambian signatures ni return types.
- **Efectos colaterales:**
  - **RIESGO OPERACIONAL CRITICO:** Si TELEGRAM_WEBHOOK_SECRET no esta configurado en produccion, Telegram deja de funcionar inmediatamente tras deploy. El plan incluye checklist pre-implementacion que mitiga esto, pero deberia ser mas explicito: **S1 requiere verificar secrets ANTES de mergear el PR, no solo antes de deploy.**
  - El re-registro del webhook requiere que `setWebhook()` en tg-client.ts acepte el parametro `secret_token`. Verificar en proxima iteracion.
- **Tests:** ✅ Suficientes. Los 5 tests cubren: fail-closed, timing-safe, admin routes, integracion, y manual post-deploy.
- **Correccion aplicada:** Ninguna. S1 es correcto.

#### Notas de decision — S2

1. **Descubrimiento critico durante S2:** El endpoint `reorder.ts` usa `db` (user client) para llamar `bulk_reorder` via RPC. Tras REVOKE de `authenticated`, esta llamada FALLARA. Se necesita cambiar a `getAdminClient()`. Esto NO estaba identificado en la auditoria original (pass1/pass3-access.md no mencionan este efecto colateral).

2. **Patron de 3 capas copiado de 20260311_02:** Identico al RAG security hardening.

3. **Branch especial para study_plan_tasks:** No esta en el content hierarchy. Se agrego verificacion directa de ownership (study_plan_tasks → study_plans → user_id).

4. **Fallback de N queries no se modifica:** Decision deliberada. Solo se ejecuta si la funcion RPC no existe.

---

## Iteracion 3 — 2026-03-18 07:30

### Seccion desarrollada: S3 (DOMPurify + XSS Frontend)
### Secciones auditadas: S1, S2

#### Auditoria de S1 (Telegram Quick Fixes) — SEGUIMIENTO

- **HALLAZGO CRITICO:** `setWebhook()` en `tg-client.ts:142-149` NO pasa el parametro `secret_token` al registrar el webhook con Telegram API. Esto significa que Telegram NO enviara el header `X-Telegram-Bot-Api-Secret-Token` en los webhooks, y TODAS las verificaciones retornaran false tras el fix de S1 (Paso 2 compara un headerSecret que nunca llega).
- **Codigo actual de setWebhook (tg-client.ts:142-149):**
  ```typescript
  export async function setWebhook(url: string): Promise<boolean> {
    const result = await callTelegramApi("setWebhook", {
      url,
      allowed_updates: ["message", "callback_query"],
      max_connections: 40,
    });
    return !!result;
  }
  ```
- **Fix necesario:** Agregar `secret_token` al body:
  ```typescript
  export async function setWebhook(url: string): Promise<boolean> {
    const secret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
    const result = await callTelegramApi("setWebhook", {
      url,
      allowed_updates: ["message", "callback_query"],
      max_connections: 40,
      ...(secret ? { secret_token: secret } : {}),
    });
    return !!result;
  }
  ```
- **CORRECCION APLICADA AL PLAN:** S1 necesita un **Paso 4** adicional:
  > Paso 4: Modificar `setWebhook()` en tg-client.ts:142-149 para incluir `secret_token` en la llamada al API de Telegram. Sin esto, Telegram nunca envia el header que S1 Pasos 1-2 verifican.
- **Impacto:** Sin este fix, S1 Pasos 1+2 harian que Telegram quede completamente inoperante (fail-closed correcto, pero no funcional). El commit de S1 DEBE incluir este cambio.

#### Auditoria de S2 (bulk_reorder REVOKE)

- **Archivos verificados:** ✅
  - `20260227_01_bulk_reorder.sql:18` — Confirmado: `SECURITY DEFINER`
  - `20260227_01_bulk_reorder.sql:75` — Confirmado: `GRANT EXECUTE ... TO anon, authenticated`
  - `reorder.ts:175` — Confirmado: `db.rpc("bulk_reorder", ...)` usa user client
  - `20260311_02_rag_security_hardening.sql` — Patron de 3 capas verificado y correcto
- **Compatibilidad:** ⚠️ El cambio a `getAdminClient()` en reorder.ts:175 es necesario y correcto. Verificado que `getAdminClient` ya se exporta desde db.ts. El import actual en reorder.ts:18 NO incluye `getAdminClient` — se necesita agregar (documentado en S2).
- **Efectos colaterales:**
  - El fallback (lineas 190-212) usa `db` (user client). Tras REVOKE, si la RPC falla y cae al fallback, los UPDATE individuales seguiran funcionando porque las tablas no tienen RLS. Cuando RLS se habilite (S11), el fallback dejara de funcionar. **Recomendacion:** En S11, eliminar o adaptar el fallback.
  - `resolve_parent_institution` se llama dentro de la funcion SQL. Verificar que esta funcion es accesible desde SECURITY DEFINER context. Si tiene SET search_path, podria fallar. **Verificacion necesaria:** `resolve_parent_institution` esta en schema `public` — accesible. ✅
- **Tests:** ✅ Suficientes. Los 7 tests cubren REVOKE, service_role, authenticated blocked, y integracion.
- **Correccion aplicada:** Ninguna al plan de S2. Solo se documenta el efecto colateral del fallback para S11.

#### Notas de decision — S3

1. **chart.tsx como excepcion:** chart.tsx genera CSS desde constantes de tema (THEMES), no desde user input. Sanitizar con DOMPurify romperia el `<style>` tag (FORBID_TAGS incluye 'style'). Decision: no sanitizar, documentar como excepcion.

2. **Doble sanitizacion intencional:** enrichHtmlWithImages sanitiza internamente + el caller sanitiza. DOMPurify es idempotente, el overhead es negligible (~0.1ms). La redundancia previene bypass accidental si un futuro developer llama enrichHtml sin sanitizar el resultado.

3. **Orden: enrich PRIMERO, sanitize DESPUES:** enrichHtmlWithImages convierte URLs raw a `<img>` tags. Si sanitizamos primero, las URLs raw no se convierten. La sanitizacion posterior valida los `<img>` tags generados.

4. **ALLOWED_TAGS amplio:** La lista incluye todos los tags que TipTap genera (el editor del profesor). Si se usa un tag no listado, DOMPurify lo eliminara silenciosamente. Para detectar esto, el test de regression visual es critico.

---

## Iteracion 4 — 2026-03-18 07:45

### Seccion desarrollada: S4 (Content-Security-Policy)
### Secciones auditadas: S3

#### Auditoria de S3 (DOMPurify + XSS Frontend)

- **Archivos verificados:** ✅
  - `ViewerBlock.tsx:61` — Confirmado: `dangerouslySetInnerHTML={{ __html: html }}` en case 'text'.
  - `ViewerBlock.tsx:228` — Confirmado: `dangerouslySetInnerHTML={{ __html: text }}` en callout block, con regex check `/<[a-z][\s\S]*>/i.test(text)`.
  - `ChunkRenderer.tsx:65` — Confirmado: `dangerouslySetInnerHTML={{ __html: enrichHtmlWithImages(chunk.content, 'light') }}`.
  - `ReaderHeader.tsx:181` — Confirmado: `dangerouslySetInnerHTML={{ __html: htmlPages[safePage] || '' }}`.
  - `ReaderChunksTab.tsx:73` — Confirmado: `dangerouslySetInnerHTML={{ __html: enrichHtmlWithImages(chunk.content) }}`.
  - `StudentSummaryReader.tsx:322` — Confirmado: `dangerouslySetInnerHTML={{ __html: htmlPages[safePage] || '' }}`.
  - `StudentSummaryReader.tsx:420` — Confirmado: `dangerouslySetInnerHTML={{ __html: enrichHtmlWithImages(chunk.content) }}`.
  - `chart.tsx:83` — Confirmado: `dangerouslySetInnerHTML={{ __html: Object.entries(THEMES)...` — genera CSS puro desde constantes.
  - `enrichHtmlWithImages` en `summary-content-helpers.tsx:40-62` — Confirmado: solo regex transforms de URLs a `<img>` tags, NO sanitiza.
  - `KeywordHighlighterInline.tsx:19` — Confirmado: COMENTADO (`//`), no activo.
- **Compatibilidad:** ✅ El import `import { sanitizeHtml } from '@/app/lib/sanitize'` es compatible con el alias `@` configurado en vite.config.ts.
- **Efectos colaterales:**
  - **`'unsafe-inline'` en CSP (S4):** La excepcion de chart.tsx (no sanitizar `<style>`) fuerza `'unsafe-inline'` en `style-src` del CSP. Esto fue anticipado y documentado en S4. Aceptable trade-off.
  - **ALLOWED_TAGS y TipTap:** TipTap usa `<div contenteditable>` internamente, pero el HTML guardado en DB es estandar. Los tags de S3 cubren todo lo que TipTap genera. ✅
  - **Performance:** sanitizeHtml se llama 7 veces por resumen (una por instancia). Con chunks de ~2KB promedio, DOMPurify procesa cada uno en <1ms. Total <10ms. ✅
- **Tests:** ✅ Suficientes. 7 tests cubren sanitizacion basica, tags permitidos/prohibidos, integracion con enrichHtml, helper, regression visual, XSS directo, y build.
- **Correccion aplicada:** Ninguna. S3 es correcto.

#### Notas de decision — S4

1. **`'unsafe-inline'` en style-src obligatorio:** chart.tsx inyecta CSS via `<style dangerouslySetInnerHTML>` y Vite puede inyectar CSS en `<style>` tags. Alternativa seria un nonce system, pero requiere SSR o edge middleware que Axon no tiene. Riesgo aceptado.

2. **`data:` y `blob:` en img-src:** Three.js genera blobs para texturas de modelos 3D. Contenido HTML del backend podria contener data URIs para imagenes inline (ej: `<img src="data:image/png;base64,...">`). Ambos son necesarios.

3. **`wss://` en connect-src:** Supabase Realtime usa WebSocket. Sin esto, cualquier feature de realtime se romperia silenciosamente.

4. **No `'unsafe-eval'`:** No se usa eval() en ningun lugar del frontend (confirmado en FE-014 de la auditoria). Si se agrega en el futuro, CSP lo bloqueara — esto es correcto.

5. **CSP report-uri como fase 2:** No incluido en S4. Requiere endpoint backend dedicado. Se recomienda agregar despues de que el CSP base este estable en produccion.

---

## Iteracion 5 — 2026-03-18 08:00

### Seccion desarrollada: S5 (AI Output Validation)
### Secciones auditadas: S4

#### Auditoria de S4 (Content-Security-Policy)

- **Archivos verificados:** ✅
  - `vercel.json:9-24` — Confirmado: headers section con X-Content-Type-Options, X-Frame-Options, Referrer-Policy.
  - `index.html:12` — Confirmado: `<script type="module" src="/src/main.tsx">` (external, not inline).
  - `fonts.css:1-3` — Confirmado: 3x `@import url('https://fonts.googleapis.com/...')`.
  - `config.ts:11,15` — Confirmado: supabase URL `https://xdnciktarvxyhkrokbng.supabase.co`.
  - Mux URLs en 4 files — Confirmado: `https://image.mux.com/` pattern.
- **Compatibilidad:** ✅ La CSP policy es compatible con todos los dominios identificados.
- **Efectos colaterales:**
  - **Supabase Realtime:** `wss://xdnciktarvxyhkrokbng.supabase.co` esta incluido en connect-src. ✅
  - **Mux player streaming:** Mux player web component puede necesitar `https://*.mux.com` en lugar de solo `stream.mux.com`. **Riesgo menor** — si falla, ampliar el wildcard. Testear en staging.
  - **User-uploaded images en chunk.content:** Si profesores insertan imagenes de dominios arbitrarios (no Supabase), CSP las bloqueara. **Decision:** Esto es CORRECTO — solo permitir imagenes de Supabase Storage. Si se necesitan otros dominios, agregar caso por caso.
- **Tests:** ✅ Suficientes. 8 tests cubren carga de pagina, fonts, imagenes, API, WebSocket, XSS, charts, y 3D.
- **Correccion aplicada:** Ninguna. S4 es correcto.

#### Notas de decision — S5

1. **HTML entity encoding vs DOMPurify en backend:** Se eligio `escapeHtml()` (entity encoding) en backend en lugar de DOMPurify porque: (a) quiz questions y flashcards NO deben contener HTML — son texto plano, (b) entity encoding es mas restrictivo y predecible, (c) no agrega dependencia de DOMPurify al backend (Deno).

2. **Validacion con throws:** Las funciones `validateQuizQuestion`/`validateFlashcard` lanzan error si campos requeridos estan vacios post-sanitizacion. Los 3 archivos generate ya tienen try/catch, asi que items individuales fallan gracefully sin crashear el endpoint.

3. **No se valida `description` en quiz creation (generate-smart.ts:254):** El campo description es hardcoded (`"Quiz generado por IA (${count} preguntas)"`), no viene del LLM. No necesita validacion.

4. **Re-export desde ai-normalizers.ts:** Facilita que los archivos generate usen un solo import point. Tambien permite que futuros archivos importen directamente desde `lib/validate-llm-output.ts` si no necesitan los normalizers.

---

## Iteracion 6 — 2026-03-18 08:15

### Seccion desarrollada: S6 (AI Prompt Sanitization)
### Secciones auditadas: S5

#### Auditoria de S5 (AI Output Validation)

- **Archivos verificados:** ✅
  - `generate.ts:249-260` — Confirmado: `g.question`, `g.options`, `g.correct_answer`, `g.explanation` van directo al insert sin sanitizar.
  - `generate.ts:280-290` — Confirmado: `g.front`, `g.back` van directo al insert.
  - `generate-smart.ts:162-172, 184-194, 248-257` — Confirmado: mismos campos sin sanitizar. Linea 254 description es hardcoded, correctamente excluido de S5.
  - `pre-generate.ts:331-342, 364-374` — Confirmado: mismos campos sin sanitizar, dentro de loop.
  - `parseClaudeJson` en `claude-ai.ts:395-406` — Confirmado: solo JSON.parse, no valida contenido.
  - `ai-normalizers.ts:116-121` — Confirmado: `sanitizeQuizFields` solo normaliza `question_type` y `difficulty`, no campos de texto.
- **Compatibilidad:** ✅ El nuevo modulo `lib/validate-llm-output.ts` se importa con path relativo `../../lib/`. Compatible con la estructura existente donde `lib/` esta al mismo nivel que `routes/`.
- **Efectos colaterales:**
  - **HTML entities en quiz rendering:** escapeHtml convierte `<` → `&lt;`. En el frontend, quiz questions se renderizan de 2 formas: (1) via `dangerouslySetInnerHTML` — las entidades se decodifican correctamente, (2) via React text content (`{question}`) — las entidades se muestran literalmente como `&lt;`. **RIESGO:** Si algún componente de quiz usa textContent en vez de innerHTML, el usuario verá `&lt;` en vez de `<`. **Verificar:** buscar cómo QuestionRenderer.tsx muestra la pregunta.
  - **Throws en batch (pre-generate):** El plan dice que pre-generate tiene `continue` en el catch del loop. Verificar que el catch está DENTRO del loop, no fuera.
- **Tests:** ✅ Suficientes. 7 tests cubren escapeHtml, sanitizeTextField, sanitizeOptions, validateQuizQuestion, validateFlashcard, integracion, y cadena completa.
- **Correccion necesaria:** ⚠️ Investigar en proxima iteracion cómo QuestionRenderer.tsx renderiza `question` — si es textContent, la entity encoding de S5 mostrará caracteres escapados visualmente.

#### Notas de decision — S6

1. **7 hallazgos, 1 causa raiz:** Todos los hallazgos de S6 (AI-002/003/005/008/016/017) comparten la misma causa: aplicacion inconsistente de sanitizeForPrompt+wrapXml. El modulo ya existe y funciona. Solo falta universalizarlo.

2. **AI-008 fix = eliminar lineas:** Las lineas 52 y 94 de generate-smart-prompts.ts son duplicados raw que deben eliminarse. La version XML-wrapped en lineas 53 y 95 es la correcta, solo necesita agregar sanitizeForPrompt() dentro del wrapXml.

3. **rag-search.ts sin wrapXml:** El contexto RAG de rag-search.ts NO se wrappea en XML porque chat.ts (el caller) ya wrappea el contexto completo en `<rag_context>`. Agregar wrapXml en rag-search.ts duplicaria el wrapping. Solo se sanitiza el contenido de cada chunk individual.

4. **Patron sistematico: sanitize → wrap → interpolate:** El orden correcto es siempre: (1) sanitizeForPrompt para truncar y limpiar, (2) wrapXml para delimitar, (3) interpolar en el prompt. Nunca invertir.

---

## Iteracion 7 — 2026-03-18 08:30

### Seccion desarrollada: S7 (JWT Expiry 300s)
### Secciones auditadas: S5 (seguimiento QuestionRenderer), S6

#### Auditoria de S5 — SEGUIMIENTO CRITICO: QuestionRenderer rendering

**HALLAZGO CONFIRMADO:** Investigado como se renderizan quiz questions y flashcards en el frontend:

- `QuestionRenderer.tsx:76` — `{question.question}` — **React textContent** (NO innerHTML)
- `QuizAnswerDetail.tsx:113` — `{q.question}` — **React textContent**
- `FlashcardCard.tsx` — No usa `dangerouslySetInnerHTML` para front/back
- `StudyQueueCard.tsx:54` — `{item.front}` — **React textContent**
- `StudyQueueWidget.tsx:245` — `{nextCard.front}` — **React textContent**

**Impacto:** El escapeHtml de S5 convierte `<` → `&lt;`. React textContent muestra `&lt;` literalmente (no lo decodifica). Si un LLM genera una pregunta como `"Is 5 > 3?"`, despues de S5 se guarda como `"Is 5 &gt; 3?"`, y en el frontend se muestra como `Is 5 &gt; 3?` en vez de `Is 5 > 3?`.

**CORRECCION NECESARIA A S5:** Cambiar la estrategia de `escapeHtml` a **strip HTML tags** (eliminar tags HTML, no escaparlos). Quiz questions y flashcards son texto plano — nunca deben contener HTML. En vez de:
```typescript
function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char] || char);
}
```

Usar:
```typescript
function stripHtmlTags(str: string): string {
  // Remove HTML tags but preserve text content
  return str.replace(/<[^>]*>/g, '');
}
```

Esto elimina `<script>alert(1)</script>` → `alert(1)` (inofensivo como texto plano), y preserva `"Is 5 > 3?"` intacto (el `>` no esta dentro de un tag).

**Pero:** `<img src=x onerror="alert(1)">` → cadena vacia (el tag completo se elimina, incluyendo el onerror). ✅ Seguro.

**ALTERNATIVA MAS SEGURA:** Usar AMBAS estrategias en capas:
1. `stripHtmlTags` — elimina tags HTML
2. Luego validar que no quedan `<` o `>` en el resultado (alertar si quedan, no escapar)

**Documentar esta correccion en S5 del plan.**

#### Auditoria de S6 (AI Prompt Sanitization)

- **Archivos verificados:** ✅
  - `pre-generate.ts:270-311` — Confirmado: 6 campos interpolados sin sanitizar (summary.title, kw.name, kw.definition, profNotesContext, contentSnippet en ambos prompts quiz y flashcard).
  - `retrieval-strategies.ts:120` — Confirmado: `"${originalQuery}"` directo en prompt.
  - `retrieval-strategies.ts:162` — Confirmado: `"${query}"` directo.
  - `retrieval-strategies.ts:206,215` — Confirmado: chunk.summary_title y query directos.
  - `lib/rag-search.ts:110,115` — Confirmado: `chunk.summary_title` y `chunk.content` sin sanitizar.
  - `generate.ts:135` — Confirmado: `block.heading_text` y `block.content?.substring(0, 500)` sin sanitizar.
  - `generate.ts:149-150` — Confirmado: profNotes.join("; ") sin sanitizar.
  - `generate-smart-prompts.ts:52-53, 94-95` — Confirmado: raw profNotesContext en lineas 52 y 94, seguido de wrapXml en 53 y 95. Duplicado confirmado.
  - `generate-smart.ts:92-96` — Confirmado: profNotes.join("; ") sin sanitizar.
  - `prompt-sanitize.ts` — Confirmado: modulo existe con sanitizeForPrompt y wrapXml.
- **Compatibilidad:** ✅ Todos los cambios agregan sanitizeForPrompt/wrapXml existentes. No cambian firmas.
- **Efectos colaterales:** Ninguno significativo. sanitizeForPrompt trunca a maxLen, pero los limites propuestos (200-3000) son generosos.
- **Tests:** ✅ Suficientes. Los 6 tests cubren sanitizacion basica, XML wrapping, y 3 escenarios de prompt injection.
- **Correccion aplicada:** Ninguna. S6 es correcto.

#### Notas de decision — S7

1. **Cambio de dashboard, no de codigo:** S7 es la unica seccion del plan que no requiere commits. Es un cambio de configuracion en Supabase Dashboard. Se documenta en DECISIONS.md.

2. **autoRefreshToken ya configurado:** supabase.ts:21 tiene `autoRefreshToken: true`, lo que significa que el SDK renueva tokens automaticamente. Los usuarios no notaran el cambio de 3600s a 300s.

3. **Impacto en logout:** La mejora real es que despues de logout, un token robado solo sirve por 5 min en vez de 1 hora. Esto resuelve AUTH-003 donde logout no invalida el access token.

---

## Iteracion 8 — 2026-03-18 08:45

### Seccion desarrollada: S8 (Gamification + Subtopics Scoping)
### Secciones auditadas: S7

#### Auditoria de S7 (JWT Expiry 300s)

- **Archivos verificados:** ✅
  - `supabase.ts:18-24` — Confirmado: `autoRefreshToken: true` en linea 21. `persistSession: true` en linea 20.
  - `db.ts:165-168` — Confirmado: exp check local, rechaza tokens expirados antes de DB round-trip.
- **Compatibilidad:** ✅ Es un cambio de configuracion, no de codigo. No puede romper nada excepto si autoRefreshToken no funciona correctamente.
- **Efectos colaterales:**
  - **Refresh frequency:** Con 300s expiry, el SDK hace refresh cada ~270s (~22 refreshes/hora vs ~1/hora actual). Esto aumenta las requests de auth al Supabase Auth server. Para un LMS con <1000 usuarios concurrentes, es insignificante.
  - **Offline/dormido:** Si un usuario esta offline >300s y su refresh token aun es valido (7 dias default), el SDK renueva al reconectarse. Si el refresh token tambien expiro (>7 dias offline), el usuario re-loguea. Comportamiento correcto.
- **Tests:** ✅ Suficientes. 5 tests manuales cubren login normal, refresh visible, logout efectividad, tab dormido, y multiple tabs.
- **Correccion aplicada:** Ninguna. S7 es correcto.

#### Notas de decision — S8

1. **Patron copiado de keyword-connections-batch.ts:** El fix de ACCESS-005 (subtopics-batch) replica exactamente el patron de `resolveInstitutionFromKeyword` + `requireInstitutionRole` que ya funciona en keyword-connections-batch.ts.

2. **ACCESS-004: verify then admin-write pattern:** Los endpoints de gamificacion usan `getAdminClient()` para escribir porque student_xp no tiene RLS. El `requireInstitutionRole` se ejecuta con el user client ANTES de la escritura con admin client. Es el patron correcto: check permissions → execute with elevated privileges.

3. **ACCESS-017 dejado como riesgo aceptado menor:** La verificacion de todos los keyword IDs en keyword-connections-batch (batch cross-institution check) requiere N RPCs o una query batch mas compleja. Para un endpoint read-only donde los keywords vienen del mismo summary en practica, el riesgo es minimo. Documentado para backlog.

4. **Comentario enganoso en subtopics-batch.ts:29:** El fix incluye correccion del comentario que falsamente dice "RLS handles scoping". Este tipo de comentarios enganosos pueden causar que futuros developers omitan controles de seguridad.

---

## Iteracion 9 — 2026-03-18 09:00

### Seccion desarrollada: S9 (SECURITY DEFINER REVOKE)
### Secciones auditadas: S8

#### Auditoria de S8 (Gamification + Subtopics Scoping)

- **Archivos verificados:** ✅
  - `goals.ts:31-34` — Confirmado: `institution_id` del body sin membership check. `getAdminClient()` en linea 46.
  - `goals.ts:80-83` — Confirmado: misma pattern en goals/complete.
  - `goals.ts:148-151` — Confirmado: misma pattern en onboarding. `getAdminClient()` en linea 153.
  - `subtopics-batch.ts:51-98` — Confirmado: no hay institution scoping. Comentario enganoso en linea 29.
  - `keyword-connections-batch.ts:121-134` — Confirmado: patron correcto con resolveInstitutionFromKeyword + requireInstitutionRole.
- **Compatibilidad:** ✅ Los imports de `requireInstitutionRole`, `isDenied`, `ALL_ROLES` ya estan disponibles en auth-helpers.ts. El destructuring `{ user }` → `{ user, db }` es compatible.
- **Efectos colaterales:**
  - goals.ts linea 26: cambiar `const { user } = auth` a `const { user, db } = auth` — `db` es necesario para requireInstitutionRole pero NO se usa para las operaciones reales (que usan adminDb). No hay conflicto.
  - subtopics-batch.ts linea 56: cambiar `const { db } = auth` a `const { user, db } = auth` — `user` es necesario para requireInstitutionRole. No hay conflicto.
- **Tests:** ✅ Suficientes. 7 tests cubren cross-institution denegacion y operacion normal.
- **Correccion aplicada:** Ninguna. S8 es correcto.

#### Notas de decision — S9

1. **ALTER FUNCTION vs CREATE OR REPLACE:** Se usa `ALTER FUNCTION ... SET search_path` en lugar de recrear las funciones. Esto preserva el codigo existente y solo agrega la configuracion de search_path. Menos riesgo de errores.

2. **Selective REVOKE:** No todas las funciones deben ser revocadas. `resolve_parent_institution`, `scoped_search`, `scoped_trash`, y `search_keywords_by_institution` son llamadas desde el user client via Hono endpoints que usan `db` (no adminDb). Revocarlas romperia esos endpoints.

3. **Trigger functions:** `on_review_inserted` y `on_study_session_completed` se ejecutan via triggers PostgreSQL. REVOKE no aplica a triggers (se ejecutan con permisos del trigger owner). Solo se agrega pg_temp al search_path.

4. **Inventario completo:** Se identificaron 16 funciones SECURITY DEFINER en total. 3 ya estan hardened (RAG functions), 1 se maneja en S2 (bulk_reorder), y 12 se manejan en S9. El inventario esta documentado en la tabla del plan.

---

## Iteracion 10 — 2026-03-18 09:15

### Seccion desarrollada: S10 (jose JWT Verification D2)
### Secciones auditadas: S9

#### Auditoria de S9 (SECURITY DEFINER REVOKE)

- **Archivos verificados:** ✅
  - Todas las 16 funciones SECURITY DEFINER identificadas via grep en migrations/. Inventario completo y correcto.
  - `20260311_02_rag_security_hardening.sql` — Confirmado: 3 funciones YA hardened con SET search_path + REVOKE.
  - `20260228_01_dashboard_aggregation_triggers.sql:49,143` — Confirmado: SET search_path = public (sin pg_temp).
  - `20260304_04_resolve_parent_institution_v2.sql:24` — Confirmado: SECURITY DEFINER sin search_path. GRANT to authenticated en linea 186.
- **Compatibilidad:** ✅ ALTER FUNCTION solo agrega configuracion, no modifica el codigo de las funciones. Las firmas deben verificarse contra la base de datos real (no contra archivos de migracion).
- **Efectos colaterales:**
  - **resolve_parent_institution mantiene GRANT to authenticated:** Correcto — S2 (bulk_reorder) y S8 (subtopics-batch) lo llaman desde user client. Si se revocara, esos endpoints se rompen.
  - **get_course_summary_ids legacy bloqueada:** Verificar que NINGUN codigo la llama. Busque en el backend: solo se importa en `ingest.ts` que usa `get_institution_summary_ids` (la version hardened). La funcion legacy no tiene callers activos. ✅
- **Tests:** ✅ Suficientes. 6 tests cubren search_path, REVOKE, integracion con endpoints, y manual.
- **Correccion aplicada:** Ninguna. S9 es correcto.

#### Notas de decision — S10

1. **jose via deno.land/x:** Se usa `https://deno.land/x/jose@v5.9.6/index.ts` que es la forma estandar de importar modulos en Deno. La version se pinea para reproducibilidad.

2. **audience: "authenticated":** DECISIONS.md #1 documenta esta decision. Previene que un JWT de otro proyecto Supabase sea aceptado (cross-project abuse). Todos los JWTs de sesion de Supabase incluyen `aud: "authenticated"` por defecto.

3. **authErr() helper:** DECISIONS.md #2 documenta por que no se usa `err()` para errores de auth. `err()` usa `c.json()` que puede producir double-encoding si el caller tambien serializa.

4. **503 fail-closed cuando JWT_SECRET falta:** DECISIONS.md #3. Es preferible a 500 porque 503 comunica "temporariamente no disponible" — el operador sabe que debe configurar el secret.

5. **S10 resuelve 4 hallazgos simultaneamente:** AUTH-001 (CRITICAL), AUTH-005 (MEDIUM), AUTH-006 (MEDIUM), AUTH-008 (LOW). Es el cambio de mayor impacto-por-esfuerzo de todo el plan.

---

## Iteracion 11 — 2026-03-18 09:30

### Seccion desarrollada: S11 (RLS Policies D3)
### Secciones auditadas: S10

#### Auditoria de S10 (jose JWT Verification D2)

- **Archivos verificados:** ✅
  - `db.ts:84-93` — Confirmado: extractToken con prioridad X-Access-Token > Authorization Bearer.
  - `db.ts:100-123` — Confirmado: decodeJwtPayload con atob, sin verificacion criptografica.
  - `db.ts:150-176` — Confirmado: authenticate() retorna user+db, no verifica firma.
  - `DECISIONS.md:16-20` — Confirmado: decisiones D2 documentadas (audience, authErr, env flag, JWT_SECRET optional D1/required D2).
  - `DECISIONS.md:29` — Confirmado: H1 (P0, PLANNED, D2).
  - jose no importado en ningun archivo actualmente. ✅
- **Compatibilidad:** ✅
  - `jwtVerify` de jose es async — authenticate() ya es async, compatible.
  - `authErr()` retorna Response (mismo tipo que `err()`), compatible con el patron `if (auth instanceof Response) return auth`.
  - El cambio de `decodeJwtPayload` (sync) a `verifyJwt` (async) no afecta callers — authenticate() ya es async.
- **Efectos colaterales:**
  - **rate-limit.ts extractKey()** sigue usando atob(). Documentado como tech debt (DECISIONS.md H8, P2). Post-S10, el rate limiter ya no es el unico punto de verificacion — jose en authenticate() protege antes. El risk residual es que un JWT forjado puede contaminar rate limit counters (pero no consumir APIs pagadas).
  - **AI routes double authenticate()** (DECISIONS.md H9): Algunos handlers de AI llaman authenticate() en middleware + handler. Con jose, esto significa 2x verificacion por request (~0.6ms total). Documentado como P3 tech debt.
- **Tests:** ✅ Suficientes. 9 tests cubren todos los escenarios de jose + verify script de DECISIONS.md.
- **Correccion aplicada:** Ninguna. S10 es correcto.

#### Notas de decision — S11

1. **auth.user_institution_ids() STABLE function:** DECISIONS.md D3 la referencia. PostgreSQL cachea funciones STABLE por transaccion — significa que la query de memberships se ejecuta UNA vez por request, no por cada fila evaluada. Critico para performance.

2. **4 tipos de tablas, 4 estrategias de policy:** Content (institution_id), User-scoped (user_id), Gamification (student_id + institution_id), Admin-only (service_role). Cada tipo tiene un patron de policy distinto.

3. **Write policies necesarias para CRUD factory:** El CRUD factory usa `db` (user client), no adminClient. Sin write policies, INSERT/UPDATE/DELETE via user client fallaran. Esto es el riesgo #2 de S11 y requiere testing exhaustivo.

4. **Phased deployment (5 commits):** S11 se deploya en 4 fases para minimizar blast radius: (1) helper function, (2) content tables SELECT, (3) user+gamification tables, (4) admin tables, (5) write policies. Si fase 2 rompe algo, no se continua con fase 3.

5. **S11 es la seccion mas grande y riesgosa del plan entero.** Requiere 8-12 horas y afecta TODAS las tablas. El rollback plan (DISABLE ROW LEVEL SECURITY) es critico.

---

## Iteracion 12 — 2026-03-18 09:45 (FINAL)

### Secciones desarrolladas: S12, S13, S14, S15, S16 (batch final)
### Secciones auditadas: S11

#### Auditoria de S11 (RLS Policies D3)

- **Archivos verificados:** ✅
  - 8 tablas con RLS confirmadas via grep `ENABLE ROW LEVEL SECURITY`.
  - DECISIONS.md:48 — Confirmado: D3 referencia `auth.user_institution_ids()` y policies.
  - DECISIONS.md:31 — Confirmado: H3 (P1, PLANNED, D3).
- **Compatibilidad:** ⚠️ RIESGO ALTO IDENTIFICADO
  - El CRUD factory (crud-factory.ts) usa `db` (user client) para INSERT/UPDATE/DELETE. Si solo se crean SELECT policies, las escrituras se rompen. S11 documenta este riesgo y propone write policies en Commit 5 (Fase 4), pero requiere testing exhaustivo.
  - `checkContentScope()` en crud-factory.ts resuelve institution_id y verifica rol. Post-RLS, el user client TAMBIEN necesita pasar la policy de escritura. La policy debe verificar membership (no rol — el rol no esta en el JWT).
- **Efectos colaterales:**
  - **S2 fallback de N queries:** Post-S11, el fallback en reorder.ts:190-212 que usa `db` (user client) necesitara write policies para UPDATE. Sin estas, el fallback falla silenciosamente.
  - **Gamification goals:** S8 fix usa `getAdminClient()` para escritura — no afectado por RLS. ✅
  - **Performance:** `auth.user_institution_ids()` como STABLE function es cached per-transaction. Para queries que evaluan muchas filas (LIST endpoints), el overhead es minimo.
- **Tests:** ✅ Suficientes. 7 tests cubren helper function, cross-institution block, own data, service_role bypass, CRUD factory, student isolation, y rollback.
- **Correccion aplicada:** Ninguna — S11 documenta los riesgos correctamente.

#### Notas de decision — S12-S16

1. **S12 — IP rate limiting:** Se usa `x-forwarded-for` que es confiable en Supabase Edge Functions. Para signup, bucket separado mas restrictivo (5/hr vs 120/min global).

2. **S13 — safeErr() helper:** Patron simple: log full error server-side, return generic message to client. No se usa un error mapping complejo — KISS.

3. **S14 — RequireRole minimal:** Agregar `<RequireRole roles={['student']} />` wrapper. Verificar que RequireRole obtiene el rol de la institucion ACTIVA, no de cualquier institucion.

4. **S15 — HSTS preload:** Solo agregar `preload` si se confirma que HTTPS permanente. Para Vercel, es seguro. Permissions-Policy: verificar si VoiceCallPanel.tsx necesita `microphone` antes de bloquearlo.

5. **S16 — Backlog como documento vivo:** Los 19 items se priorizan con features normales. No se implementan en bloque.

---

## Resumen Final de Auditorias Cruzadas

| Seccion | Iteracion desarrollo | Iteracion auditada | Issues encontrados |
|---------|---------------------|--------------------|--------------------|
| S1 | 1 | 2, 3 | setWebhook sin secret_token (CRITICO) |
| S2 | 2 | 3 | Fallback afectado por S11 RLS |
| S3 | 3 | 4 | Ninguno |
| S4 | 4 | 5 | Mux player puede necesitar wildcard |
| S5 | 5 | 6, 7 | QuestionRenderer usa textContent (CRITICO — stripHtmlTags) |
| S6 | 6 | 7 | Ninguno |
| S7 | 7 | 8 | Refresh frequency +22x (aceptable) |
| S8 | 8 | 9 | Ninguno |
| S9 | 9 | 10 | get_course_summary_ids legacy sin callers ✅ |
| S10 | 10 | 11 | Double authenticate() en AI routes (tech debt) |
| S11 | 11 | 12 | CRUD factory write policies criticas |
| S12-S16 | 12 | — | Pendientes de auditoria en implementacion |

**Correcciones criticas identificadas por auditorias:**
1. **S1 Paso 4** — setWebhook debe pasar secret_token
2. **S5 estrategia** — stripHtmlTags en vez de escapeHtml

**Total hallazgos de auditoria:** 2 criticos, 3 menores, 0 falsos positivos en el plan.

---

*Fin del Decision Audit Log. 12 iteraciones completadas.*

