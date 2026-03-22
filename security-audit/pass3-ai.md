# Diagnostico Final -- AI / RAG / Prompt Injection

**Date**: 2026-03-18
**Auditor**: Quality Gate Agent (pass 3 -- diagnostico final)
**Inputs**: pass1-ai.md (15 findings), pass2-ai.md (cross-review, 17 revised findings)
**Model**: claude-opus-4-6[1m]

---

## Estado General

El subsistema AI/RAG tiene buena base de aislamiento multi-tenant (SEC-01 fix) y manejo de API keys, pero presenta una vulnerabilidad critica en la falta de validacion de output LLM antes de insercion en DB, y un patron sistematico de sanitizacion inconsistente donde 4 de 7 rutas que construyen prompts omiten sanitizeForPrompt()/wrapXml(). La superficie de ataque principal es prompt injection indirecto via contenido de profesores (keywords, notas, bloques de contenido).

---

## Hallazgos Confirmados

| ID | Severidad | Titulo | Archivo:Linea | Status | Recomendacion |
|----|-----------|--------|---------------|--------|---------------|
| AI-001 | CRITICAL | Output LLM insertado en DB sin validacion | generate.ts:257-259, generate-smart.ts:162-198, pre-generate.ts:338-393 | CONFIRMADO (pass1+pass2) | Crear funcion validateLlmOutput() con HTML escaping, validacion de schema, limites de longitud. Aplicar antes de todo INSERT. |
| AI-002 | HIGH | pre-generate.ts omite sanitizacion de prompts | pre-generate.ts:278-311 | CONFIRMADO (pass1+pass2) | Importar y aplicar sanitizeForPrompt() + wrapXml() a todos los campos interpolados. |
| AI-005 | HIGH | lib/rag-search.ts omite sanitizacion de contexto | lib/rag-search.ts:38-131 (linea 115 clave) | CONFIRMADO (pass1+pass2) | Aplicar sanitizeForPrompt() a chunk.summary_title y chunk.content antes de ensamblar contexto. |
| AI-003 | HIGH | retrieval-strategies.ts pasa queries sin sanitizar al LLM | retrieval-strategies.ts:120, 162, 213 | CONFIRMADO (pass2 corrigio lineas) | Aplicar sanitizeForPrompt(query, 500) + wrapXml() en las 3 funciones. |
| AI-008 | MEDIUM | generate-smart-prompts.ts incluye profNotesContext duplicado (raw + wrapped) | generate-smart-prompts.ts:52-53, 94-95 | CONFIRMADO (pass1+pass2) | Eliminar lineas 52 y 94 (version raw). Mantener solo version wrapXml. |
| AI-016 | MEDIUM | generate.ts no sanitiza blockContext ni profNotes | generate.ts:135-151 | NUEVO en pass2, CONFIRMADO | Aplicar sanitizeForPrompt() a block content y notas. substring() NO es sanitizacion. |
| AI-017 | MEDIUM | generate-smart.ts fetchTargetContext() no sanitiza notas | generate-smart.ts:85-96 | NUEVO en pass2, CONFIRMADO | Sanitizar cada nota individual en fetchTargetContext() antes del join. |
| AI-006 | MEDIUM | Streaming endpoint sin timeout ni limite de tamano | claude-ai.ts:370-378, chat.ts:504-631 | CONFIRMADO (pass1+pass2) | Agregar AbortController con timeout 55s. Agregar contador de bytes con limite 100KB. |
| AI-004 | MEDIUM | Gemini API key expuesta en URL query parameter | gemini.ts:103, 206 | CONFIRMADO, bajado HIGH a MEDIUM | Documentar como riesgo aceptado (limitacion Google API). Verificar logging. |
| AI-009 | MEDIUM | Sin enforcement de presupuesto de tokens por usuario | claude-ai.ts:164, chat.ts:639 | CONFIRMADO (pass1+pass2) | Implementar contador de tokens por usuario/institucion con limites diarios. |
| AI-007 | MEDIUM | query_text almacenado en plaintext en rag_query_log | chat.ts:594, 655 | CONFIRMADO (pass1+pass2) | Evaluar hashing con TTL, anonimizacion, o politica de retencion. |
| AI-010 | LOW | System prompt de realtime revela arquitectura interna | realtime-session.ts:91-171 | CONFIRMADO, bajado MEDIUM a LOW | Riesgo aceptado. SI sanitiza datos de estudiante. |
| AI-011 | LOW | Rate limit AI no cubre GET analytics | routes/ai/index.ts:59 | CONFIRMADO (pass1+pass2) | Riesgo aceptado. Global 120 req/min protege. |
| AI-012 | LOW | parseClaudeJson no limita tamano de input | claude-ai.ts:395-406 | CONFIRMADO (pass1+pass2) | Defense-in-depth: agregar check de tamano maximo. |
| AI-013 | LOW | fetchAdjacentChunks sin filtro institution_id explicito | chat.ts:172-177 (corregido de 459) | CONFIRMADO, linea corregida | Defense-in-depth: agregar .eq institution_id como segunda capa. |
| AI-014 | INFO | API keys correctamente configuradas via env vars | claude-ai.ts:37-40, gemini.ts:28-31 | CONFIRMADO (pass1+pass2) | Buena practica. Sin accion. |
| AI-015 | INFO | Aislamiento multi-tenant RAG correctamente implementado | chat.ts:396-397, rag-search.ts:76-83 | CONFIRMADO (pass1+pass2) | Buena practica (SEC-01 fix). Sin accion. |

---

## Detalle de Hallazgos Criticos y Altos

### AI-001 -- CRITICAL -- Output LLM sin validar antes de DB INSERT

**Problema raiz**: Los 3 endpoints de generacion (generate.ts, generate-smart.ts, pre-generate.ts) parsean la respuesta JSON de Claude con parseClaudeJson() e insertan los campos de contenido (question, explanation, options, correct_answer, front, back) directamente en las tablas quiz_questions y flashcards sin ninguna validacion ni sanitizacion.

**Cadena de ataque**: Profesor malicioso escribe prompt injection en contenido de curso -> LLM genera output con payload XSS -> payload se almacena en DB -> se sirve a TODOS los estudiantes de la institucion -> XSS ejecuta en navegadores de estudiantes.

**Impacto**: XSS almacenado que afecta a todos los estudiantes de una institucion. Posible exfiltracion de tokens JWT, redireccion a phishing, o manipulacion de UI.

**Remediacion concreta**:
1. Crear lib/validate-llm-output.ts con funcion validateAndSanitizeLlmOutput()
2. Para campos texto: HTML entity escape (caracteres < > " & convertidos a entidades HTML)
3. Para options[]: validar que es array de strings, longitud maxima por opcion (500 chars), maximo 6 opciones
4. Para question/front/back: longitud maxima 2000 chars
5. Para explanation: longitud maxima 5000 chars
6. Aplicar en los 3 endpoints antes de cualquier INSERT

**Nota**: El frontend tambien deberia sanitizar al renderizar (defense-in-depth), pero la correccion primaria DEBE ser en backend.

### AI-002 -- HIGH -- pre-generate.ts sin sanitizacion de prompts

**Problema raiz**: pre-generate.ts es el unico endpoint de generacion batch (5 items por llamada) y no importa ni usa sanitizeForPrompt() ni wrapXml(). Los campos kw.name, kw.definition, profNotesContext, summary.title, y contentSnippet van directo al prompt via template literals.

**Cadena de ataque**: Profesor escribe definicion de keyword con instrucciones de prompt injection -> pre-generate crea 5 preguntas/flashcards manipuladas de una vez -> contenido masivo contaminado.

**Remediacion**: Agregar import de sanitizeForPrompt y wrapXml desde lib/prompt-sanitize.ts y envolver cada campo interpolado. Seguir exactamente el patron de generate.ts:196.

### AI-005 -- HIGH -- lib/rag-search.ts sin sanitizacion

**Problema raiz**: La funcion ragSearch() es compartida por bots de Telegram y WhatsApp. Ensambla contexto RAG concatenando chunk.summary_title y chunk.content sin sanitizacion. Este contexto va directo al prompt de Claude en los handlers de mensajeria.

**Cadena de ataque**: Profesor inserta prompt injection en contenido de curso -> estudiante hace pregunta via Telegram -> RAG recupera chunk envenenado -> Claude ejecuta instrucciones inyectadas -> bot responde con contenido arbitrario o danino.

**Remediacion**: Sanitizar cada chunk antes de ensamblar: sanitizeForPrompt(chunk.content, 2000) y wrappear el contexto final en XML.

### AI-003 -- HIGH -- retrieval-strategies.ts sin sanitizacion de queries

**Problema raiz**: Las 3 funciones de estrategia de retrieval (generateMultiQueries, generateHypotheticalDocument, rerankWithClaude) interpolan la query del usuario directamente en prompts usando string templates sin sanitizacion.

**Cadena de ataque**: Usuario envia query con instrucciones de escape -> manipula reformulacion de queries, generacion de documento hipotetico, o scores de reranking -> altera resultados RAG.

**Remediacion**: Aplicar sanitizeForPrompt(query, 500) y wrapXml() en las 3 funciones.

---

## Buenas Practicas Detectadas

1. **Aislamiento multi-tenant robusto (AI-015)**: El fix SEC-01 migro correctamente las busquedas RAG a adminDb con p_institution_id resuelto server-side. RPCs restringidos con REVOKE EXECUTE FROM authenticated. Patron ejemplar.

2. **API keys via env vars (AI-014)**: Los 3 proveedores (Anthropic, OpenAI, Gemini) leen keys de Deno.env.get() con fail-fast. Cero keys hardcodeadas. Gestion via supabase secrets.

3. **Sanitizacion parcial existente**: chat.ts y generate.ts ya usan sanitizeForPrompt() + wrapXml() correctamente. El modulo lib/prompt-sanitize.ts existe y funciona -- el problema es que no se aplica universalmente.

4. **Rate limiting diferenciado**: POST routes tienen 20/hr (AI middleware) + pre-gen tiene bucket propio de 10/hr. Patron granular correcto.

5. **Sanitizacion en realtime-session.ts (detectado en pass2)**: buildSystemPrompt() SI aplica sanitizeForPrompt() a datos de perfil de estudiante (lineas 114, 121, 128, 135) y wrapXml() (linea 141). Pass1 no detecto esta buena practica.

6. **Graceful degradation en retrieval-strategies.ts**: Funciones retornan fallback seguro si LLM falla, limitando blast radius de prompt injection en esa capa.

---

## Nivel de Riesgo: ALTO

Justificacion: Hay 1 hallazgo CRITICAL confirmado por ambas pasadas (output LLM sin validar -> XSS almacenado) y 3 hallazgos HIGH que representan un patron sistematico de sanitizacion inconsistente. La vulnerabilidad critica permite XSS almacenado que afecta a todos los estudiantes de una institucion. Sin embargo, el vector de ataque requiere acceso de profesor (CONTENT_WRITE), lo cual limita la superficie. El aislamiento multi-tenant esta bien implementado, lo que contiene el impacto a una sola institucion.

---

## Prioridades de Remediacion

### Sprint 1 -- Critico (esta semana)

| # | ID | Accion | Esfuerzo |
|---|----|--------|----------|
| 1 | AI-001 | Crear lib/validate-llm-output.ts. Aplicar en generate.ts, generate-smart.ts, pre-generate.ts antes de INSERT. | 4h |
| 2 | AI-002 | Importar y aplicar sanitizeForPrompt+wrapXml en pre-generate.ts (2 prompts). | 1h |
| 3 | AI-005 | Sanitizar chunks en lib/rag-search.ts antes de ensamblar contexto. | 1h |
| 4 | AI-003 | Sanitizar queries en retrieval-strategies.ts (3 funciones). | 1h |

### Sprint 2 -- Medio-Alto (proxima semana)

| # | ID | Accion | Esfuerzo |
|---|----|--------|----------|
| 5 | AI-008 | Eliminar lineas 52 y 94 (raw profNotesContext) de generate-smart-prompts.ts. | 15min |
| 6 | AI-016 | Sanitizar blockContext y profNotes en generate.ts:135-151. | 1h |
| 7 | AI-017 | Sanitizar notas en fetchTargetContext() de generate-smart.ts. | 30min |
| 8 | AI-006 | Agregar AbortController(55s) a generateTextStream() y limite de bytes al ReadableStream. | 2h |

### Sprint 3 -- Medio (siguientes 2 semanas)

| # | ID | Accion | Esfuerzo |
|---|----|--------|----------|
| 9 | AI-004 | Documentar Gemini URL key como riesgo aceptado. Verificar logging de Deno Deploy. | 30min |
| 10 | AI-009 | Disenar e implementar token budget por usuario/institucion. | 4h |
| 11 | AI-007 | Definir politica de retencion de query_text. Implementar TTL o hashing. | 2h |

### Backlog -- Bajo (cuando haya capacidad)

| # | ID | Accion | Esfuerzo |
|---|----|--------|----------|
| 12 | AI-010 | Documentar como riesgo aceptado. | 15min |
| 13 | AI-011 | Documentar como riesgo aceptado (global rate limit protege). | 15min |
| 14 | AI-012 | Agregar size check a parseClaudeJson(). | 15min |
| 15 | AI-013 | Agregar filtro institution_id explicito a fetchAdjacentChunks(). | 30min |

**Esfuerzo total estimado**: ~17 horas

**Patron sistematico identificado**: La causa raiz de 7 de 17 hallazgos (AI-002, AI-003, AI-005, AI-008, AI-016, AI-017, y parcialmente AI-001) es la aplicacion inconsistente de sanitizacion. Recomendacion estructural: crear un linter rule o wrapper obligatorio que impida interpolar variables en prompts LLM sin pasar por sanitizeForPrompt(). Esto previene regresiones futuras.
