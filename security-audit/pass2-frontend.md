# Security Audit -- Pass 2: Frontend Cross-Review

**Date:** 2026-03-18
**Reviewer:** Quality Gate Agent (Opus 4.6)
**Scope:** Cross-verification of pass1-frontend.md findings against actual source code
**Method:** Every file:line opened and compared. Global searches for omissions performed.

---

## Verification Results

### Hallazgo [FE-001]: dangerouslySetInnerHTML without sanitization

- **Status**: CONFIRMADO
- **Linea verificada**: Si -- todas las 8 instancias confirmadas en el codigo fuente
- **Severidad original -> revisada**: CRITICAL -> CRITICAL (sin cambio)
- **Notas**:
  - ViewerBlock.tsx:61 -- CONFIRMADO. Linea exacta coincide con reporte.
  - ViewerBlock.tsx:228 -- CONFIRMADO (callout variant).
  - ChunkRenderer.tsx:65 -- CONFIRMADO. enrichHtmlWithImages sin sanitizacion.
  - StudentSummaryReader.tsx:322 -- CONFIRMADO.
  - StudentSummaryReader.tsx:420 -- CONFIRMADO.
  - ReaderChunksTab.tsx:73 -- CONFIRMADO.
  - ReaderHeader.tsx:181 -- CONFIRMADO.
  - chart.tsx:83 -- CONFIRMADO. CSS controlado, riesgo menor.
  - DOMPurify: CONFIRMADO ausente en package.json y src/.
  - Omision descartada: KeywordHighlighterInline.tsx:19 es COMENTARIO, no codigo.

---

### Hallazgo [FE-002]: JWT almacenado en localStorage

- **Status**: CONFIRMADO
- **Linea verificada**: Si
- **Severidad original -> revisada**: CRITICAL -> CRITICAL (sin cambio)
- **Notas**:
  - api.ts:38 -- CONFIRMADO.
  - AuthContext.tsx:220,366-369,377,401 -- CONFIRMADO todas las lineas.
  - apiConfig.ts:28 -- CONFIRMADO. Fallback a localStorage.
  - Omision: No menciona localStorage en useQuizBackup.ts, useReviewBatch.ts, ModelPartMesh.tsx.

---

### Hallazgo [FE-003]: Sin Content-Security-Policy

- **Status**: CONFIRMADO
- **Linea verificada**: Si
- **Severidad original -> revisada**: HIGH -> HIGH (sin cambio)
- **Notas**: vercel.json e index.html verificados. Sin CSP.

---

### Hallazgo [FE-004]: Supabase anon key hardcodeada en 3 archivos

- **Status**: CONFIRMADO
- **Linea verificada**: Si
- **Severidad original -> revisada**: HIGH -> HIGH (sin cambio)
- **Notas**: supabase.ts:9-10 y config.ts:11-13 CONFIRMADOS. Keys identicas. api.ts es import, no duplicado.

---

### Hallazgo [FE-005]: Student routes sin RequireRole guard

- **Status**: CONFIRMADO
- **Linea verificada**: Si
- **Severidad original -> revisada**: HIGH -> HIGH (sin cambio)
- **Notas**: routes.tsx:100-107 CONFIRMADO. Sin RequireRole. Professor (linea 90) si tiene.

---

### Hallazgo [FE-006]: Sin HSTS

- **Status**: CONFIRMADO
- **Severidad original -> revisada**: MEDIUM -> MEDIUM (sin cambio)

---

### Hallazgo [FE-007]: ErrorBoundary expone error.message

- **Status**: CONFIRMADO
- **Linea verificada**: Si -- linea 68 exacta
- **Severidad original -> revisada**: MEDIUM -> MEDIUM (sin cambio)

---

### Hallazgo [FE-008]: enrichHtmlWithImages sin validacion de dominio

- **Status**: CONFIRMADO con correccion factual
- **Severidad original -> revisada**: MEDIUM -> MEDIUM (sin cambio)
- **Notas**: Regexes SI validan protocolo https?://. Falta validacion de dominio. Correccion factual menor.

---

### Hallazgo [FE-009]: Sin .env -- secrets hardcodeados

- **Status**: CONFIRMADO
- **Severidad original -> revisada**: MEDIUM -> LOW (ajustada a la baja)
- **Notas**: Anon key es publica por diseno. CLAUDE.md lo documenta. Sin keys privadas.

---

### Hallazgo [FE-010]: Open redirect parcial en LoginPage

- **Status**: CONFIRMADO
- **Linea verificada**: Si -- linea 48
- **Severidad original -> revisada**: LOW -> LOW (sin cambio)

---

### Hallazgo [FE-011]: Sin package-lock.json en git

- **Status**: CONFIRMADO
- **Severidad original -> revisada**: LOW -> LOW (sin cambio)

---

### Hallazgo [FE-012]: Sin CSRF protection

- **Status**: CONFIRMADO
- **Severidad original -> revisada**: LOW -> LOW (sin cambio)
- **Notas**: Headers custom proporcionan proteccion implicita.

---

### Hallazgo [FE-013]: Supabase SDK persistSession

- **Status**: CONFIRMADO
- **Severidad original -> revisada**: INFO -> INFO (sin cambio)
- **Notas**: Reporte dice linea 19, real es linea 20. Discrepancia menor.

---

### Hallazgo [FE-014]: No eval/Function/innerHTML

- **Status**: CONFIRMADO
- **Severidad original -> revisada**: INFO -> INFO (sin cambio)

---

## Hallazgos Adicionales (Omisiones de Pass 1)

### [FE-ADD-001] document.cookie en sidebar.tsx (shadcn/ui)

- **Severidad**: INFO
- **Archivo**: src/app/components/ui/sidebar.tsx:86
- **Descripcion**: Cookie con estado de sidebar (booleano). Sin Secure/SameSite flags.
- **Impacto**: Minimo. Componente shadcn/ui no modificable.

### [FE-ADD-002] localStorage con datos de quiz y reviews

- **Severidad**: INFO
- **Archivos**: useQuizBackup.ts, useReviewBatch.ts, ModelPartMesh.tsx
- **Descripcion**: Datos de estudio en localStorage no mencionados en Pass 1. Exfiltrables via XSS.

### [FE-ADD-003] window.location.reload() en error handlers

- **Severidad**: INFO
- **Archivos**: lazyRetry.ts:47, ModelViewer3D.tsx:603, StudyHubView.tsx:246, ProfessorModelViewerPage.tsx:159
- **Impacto**: Nulo en seguridad.

---

## Estadisticas de Verificacion

| Metrica | Valor |
|---------|-------|
| Hallazgos en Pass 1 | 14 |
| Verificados CONFIRMADOS | 14 (100%) |
| Falsos positivos | 0 |
| Lineas incorrectas | 1 menor (FE-013: linea 19 vs 20) |
| Severidades ajustadas | 1 (FE-009: MEDIUM -> LOW) |
| Correcciones factuales | 1 (FE-008: protocolo SI validado) |
| Hallazgos adicionales | 3 (todos INFO) |
| Precision de Pass 1 | 93% |

## Resumen de Severidades Post-Review

| Severity | Count | Cambio vs Pass 1 |
|----------|-------|-------------------|
| CRITICAL | 2 | sin cambio |
| HIGH | 3 | sin cambio |
| MEDIUM | 3 | -1 (FE-009 rebajado) |
| LOW | 4 | +1 (FE-009) |
| INFO | 5 | +3 adicionales |
| **Total** | **17** | +3 nuevos INFO |

## Veredicto

El reporte de Pass 1 es **preciso y de alta calidad**. Los 14 hallazgos son reales, las lineas coinciden, y la cadena de ataque (FE-001 + FE-002 + FE-003) es valida y explotable. Las 3 omisiones son INFO y no cambian prioridades.

**Prioridades de remediacion confirmadas:**
1. P0: FE-001 (instalar DOMPurify)
2. P0: FE-003 (agregar CSP en vercel.json)
3. P1: FE-005 (RequireRole guard en student routes)
4. P1: FE-002 (evaluar httpOnly cookies)

---

*Fin de Pass 2. Reporte listo para accion.*