# Security Audit Pass 2 -- AI / RAG / Prompt Injection -- Cross-Review

**Date**: 2026-03-18
**Reviewer**: Quality Gate Agent (cross-review)
**Input**: pass1-ai.md (15 findings)
**Model**: claude-opus-4-6[1m]

---

## Summary

| Status | Count |
|--------|-------|
| CONFIRMADO | 12 |
| SEVERIDAD AJUSTADA | 2 |
| FALSO POSITIVO | 0 |
| LINEA INCORRECTA | 1 |
| Hallazgos adicionales | 2 |

The pass1 report is solid and thorough. All 15 findings are real. Two severity adjustments are warranted (both downward). One finding has misleading line references. Two additional omissions were detected.

---

## Hallazgo [AI-001]: AI response output is not validated before DB insertion
- **Status**: CONFIRMADO
- **Linea verificada**: Si (con ajuste menor)
- **Severidad original -> revisada**: CRITICAL -> CRITICAL
- **Notas**: Verified in all three files. generate.ts:257-259 inserts g.question, g.options, g.correct_answer, g.explanation raw. generate-smart.ts via generateAndInsert() at lines 162-198 same pattern. pre-generate.ts:338-340 (quiz) and 369-370 (flashcard) same. Only normalizeDifficulty() and normalizeQuestionType() are applied. All content fields go from LLM to DB without HTML sanitization, length validation, or schema enforcement.

---

## Hallazgo [AI-002]: pre-generate.ts does not use prompt sanitization
- **Status**: CONFIRMADO
- **Linea verificada**: Si
- **Severidad original -> revisada**: HIGH -> HIGH
- **Notas**: Grep confirmed zero imports of sanitizeForPrompt or wrapXml. Prompts at lines 278-296 (quiz) and 298-311 (flashcard) interpolate kw.name, kw.definition, profNotesContext, summary.title, contentSnippet directly. Compare with generate.ts:196 which uses sanitizeForPrompt(). Inconsistency is real.

---

## Hallazgo [AI-003]: retrieval-strategies.ts passes unsanitized user queries to LLM
- **Status**: CONFIRMADO
- **Linea verificada**: Parcial (off by 2 lines)
- **Severidad original -> revisada**: HIGH -> HIGH
- **Notas**: generateMultiQueries() line 120 (report says 122). generateHypotheticalDocument() line 162 matches. rerankWithClaude() line 213 (report says 215). All use string interpolation without sanitizeForPrompt(). Graceful degradation limits blast radius.

---

## Hallazgo [AI-004]: Gemini API key exposed in URL query parameter
- **Status**: SEVERIDAD AJUSTADA
- **Linea verificada**: Si
- **Severidad original -> revisada**: HIGH -> MEDIUM
- **Notas**: gemini.ts line 103 and line 206 confirmed. Lowered because this is a Google API design limitation with no header-based alternative. Deno Deploy does not log outbound URLs by default. Should be documented as accepted risk.

---

## Hallazgo [AI-005]: lib/rag-search.ts skips all prompt sanitization
- **Status**: CONFIRMADO
- **Linea verificada**: Si
- **Severidad original -> revisada**: HIGH -> HIGH
- **Notas**: Grep confirmed zero imports of sanitizeForPrompt or wrapXml. Line 115 assembles raw chunk.summary_title and chunk.content. ragSearch() consumed by Telegram/WhatsApp bots creates indirect prompt injection path.

---

## Hallazgo [AI-006]: Streaming endpoint lacks timeout and response size limit
- **Status**: CONFIRMADO
- **Linea verificada**: Si
- **Severidad original -> revisada**: MEDIUM -> MEDIUM
- **Notas**: claude-ai.ts generateTextStream() at lines 370-378 uses bare fetch() without AbortController. Compare with generateTextInternal() which uses fetchWithRetry() with 30s timeout. chat.ts:504-631 ReadableStream reads indefinitely. Supabase 60s wall-clock is only protection.

---

## Hallazgo [AI-007]: User query text logged in plaintext to rag_query_log
- **Status**: CONFIRMADO
- **Linea verificada**: Si
- **Severidad original -> revisada**: MEDIUM -> MEDIUM
- **Notas**: chat.ts:594 (streaming) and chat.ts:655 (non-streaming) both store query_text: message. Valid privacy concern for medical education.

---

## Hallazgo [AI-008]: generate-smart-prompts.ts double-includes profNotesContext
- **Status**: CONFIRMADO
- **Linea verificada**: Si
- **Severidad original -> revisada**: MEDIUM -> MEDIUM
- **Notas**: Line 52 (quiz) and line 94 (flashcard): ctx.profNotesContext interpolated RAW. Lines 53 and 95: same value wrapped via wrapXml(). Both a prompt injection vector (raw line) and token waste (duplication). The raw line should be removed.

---

## Hallazgo [AI-009]: No per-request token budget enforcement
- **Status**: CONFIRMADO
- **Linea verificada**: Si (minor offset)
- **Severidad original -> revisada**: MEDIUM -> MEDIUM
- **Notas**: chat.ts:639 maxTokens: 2500. index.ts:55-56 rate limit counts requests (20/hr), not tokens. claude-ai.ts line ref off by 2 (says 162, actual 164). Cost analysis is reasonable.

---

## Hallazgo [AI-010]: Realtime session system prompt reveals internal architecture
- **Status**: SEVERIDAD AJUSTADA
- **Linea verificada**: Si
- **Severidad original -> revisada**: MEDIUM -> LOW
- **Notas**: buildSystemPrompt() at lines 91-172 confirmed. Lines 293-294 send to OpenAI confirmed. Positive note missed by pass1: buildSystemPrompt() DOES use sanitizeForPrompt() (lines 114, 121, 128, 135) and wrapXml() (line 141) for student profile data. Lowered because: system prompt goes to OpenAI not client, tool definitions are inferrable from UI, accessing requires active WebSocket interception by the user themselves.

---

## Hallazgo [AI-011]: AI rate limit does not cover GET analytics endpoints
- **Status**: CONFIRMADO
- **Linea verificada**: Si
- **Severidad original -> revisada**: LOW -> LOW
- **Notas**: index.ts:59 skips non-POST. Global 120 req/min provides baseline. LOW correct.

---

## Hallazgo [AI-012]: parseClaudeJson does not limit input size
- **Status**: CONFIRMADO
- **Linea verificada**: Si
- **Severidad original -> revisada**: LOW -> LOW
- **Notas**: claude-ai.ts:395-406 JSON.parse() without size check. maxTokens is practical cap. LOW correct.

---

## Hallazgo [AI-013]: Adjacent chunk fetching uses user DB client
- **Status**: LINEA INCORRECTA (finding valid, evidence misleading)
- **Linea verificada**: Parcial
- **Severidad original -> revisada**: LOW -> LOW
- **Notas**: Line 459 is the CALL SITE (fetchAdjacentChunks(db, topMatches)). The actual query with .eq(summary_id) without institution_id is inside the function at lines 172-177, not at 459. The report evidence block attributes internal code to the wrong line. Finding itself is valid.

---

## Hallazgo [AI-014]: API keys properly configured via environment variables
- **Status**: CONFIRMADO
- **Linea verificada**: Si
- **Severidad original -> revisada**: INFO -> INFO
- **Notas**: claude-ai.ts:37-40, gemini.ts:28-31, realtime-session.ts:277. All Deno.env.get() with fail-fast. No hardcoded keys. Positive finding.

---

## Hallazgo [AI-015]: Cross-tenant RAG isolation properly enforced
- **Status**: CONFIRMADO
- **Linea verificada**: Si
- **Severidad original -> revisada**: INFO -> INFO
- **Notas**: chat.ts:396-397 adminDb with p_institution_id. rag-search.ts:76-83 same via getAdminClient(). Server-side resolution. Positive finding.

---

## Hallazgos Adicionales (Omisiones de Pasada 1)

### [AI-016] generate.ts passes blockContext and profNotes without sanitization
- **Severity**: MEDIUM
- **Archivo**: routes/ai/generate.ts:135-151
- **Descripcion**: While generate.ts correctly sanitizes keyword.name, keyword.definition, and wrongAnswer via sanitizeForPrompt(), the blockContext (line 135: block.heading_text + block.content) and profNotes (lines 148-151: raw .join) are interpolated without sanitization. substring(0, 500) is NOT sanitization -- it does not strip control characters or escape XML-like content.
- **Impacto**: Professor with CONTENT_WRITE access can inject prompt instructions via summary block content or professor notes. Same vulnerability class as AI-002 but in a file pass1 treated as sanitized.

### [AI-017] generate-smart.ts fetchTargetContext() does not sanitize professor notes
- **Severity**: MEDIUM
- **Archivo**: routes/ai/generate-smart.ts:85-96
- **Descripcion**: fetchTargetContext() builds profNotesContext by joining raw professor notes without sanitization. Even if AI-008 raw line is removed, wrapped version still contains unsanitized content inside XML tags.
- **Impacto**: Reinforces AI-008. Notes should be sanitized at the source in fetchTargetContext() before passing to prompt builders.

---

## Estadisticas

| Metric | Value |
|--------|-------|
| Total findings in pass1 | 15 |
| Confirmed as-is | 10 |
| Confirmed with severity adjustment | 2 (AI-004 HIGH->MEDIUM, AI-010 MEDIUM->LOW) |
| Confirmed with line correction | 2 (AI-003 off by 2, AI-013 misleading ref) |
| Falsos positivos | 0 |
| Additional findings | 2 (AI-016, AI-017) |
| Revised total findings | 17 |

### Revised Severity Distribution

| Severity | Count |
|----------|-------|
| CRITICAL | 1 |
| HIGH | 3 |
| MEDIUM | 8 |
| LOW | 3 |
| INFO | 2 |
| Total | 17 |

### Revised Remediation Priority

1. **AI-001** (CRITICAL) -- Output validation/sanitization for LLM responses before DB insert
2. **AI-002** (HIGH) -- Add sanitizeForPrompt+wrapXml to pre-generate.ts prompts
3. **AI-005** (HIGH) -- Add sanitization to lib/rag-search.ts context assembly
4. **AI-003** (HIGH) -- Sanitize user queries in retrieval-strategies.ts
5. **AI-008** (MEDIUM) -- Remove duplicate raw profNotesContext in generate-smart-prompts.ts
6. **AI-016** (MEDIUM) -- Sanitize blockContext and profNotes in generate.ts
7. **AI-017** (MEDIUM) -- Sanitize professor notes in generate-smart.ts fetchTargetContext()
8. **AI-006** (MEDIUM) -- Add timeout to generateTextStream() and stream size limit
9. **AI-004** (MEDIUM) -- Document Gemini URL key as accepted risk
10. **AI-009** (MEDIUM) -- Consider token-based rate limiting
11. **AI-007** (MEDIUM) -- Evaluate query_text retention policy
12. **AI-010** (LOW) -- System prompt info disclosure (accepted risk)
