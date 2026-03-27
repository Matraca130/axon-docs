import { useState } from "react";
import { FileText, Brain, Sparkles, Eye, Database, Layers, ArrowDown, ArrowRight, CheckCircle2, AlertTriangle, X, ChevronRight, Upload, Monitor, Zap, BookOpen, Search } from "lucide-react";

const T = {
  darkTeal: "#1B3B36", tealAccent: "#2a8c7a", teal50: "#e8f5f1", teal100: "#d1f0e7",
  pageBg: "#faf9f6", white: "#FFFFFF", border: "#E5E7EB",
  textPrimary: "#1a1a1a", textSecondary: "#4b5563", textTertiary: "#9CA3AF",
};

/* ═══════════════════════════════════════
   DATA
   ═══════════════════════════════════════ */

const OLD_PIPELINE = [
  { id: "upload", label: "PDF sube", sub: "POST /ai/ingest-pdf", color: "#6366f1" },
  { id: "extract", label: "Gemini extrae texto", sub: "content_markdown (crudo)", color: "#8b5cf6" },
  { id: "embed", label: "autoChunkAndEmbed()", sub: "Embedding del texto crudo del PDF", color: "#ef4444", problem: true },
  { id: "render", label: "Frontend muestra markdown", sub: "TipTap monolítico", color: "#6b7280" },
];

const NEW_PIPELINE = [
  {
    id: "upload", label: "1. Profesor sube PDF", sub: "POST /ai/ingest-pdf",
    color: "#6366f1", icon: Upload, status: "exists",
    detail: "Sin cambios. Gemini extrae el texto y lo guarda como content_markdown temporal. PERO ya no se dispara autoChunkAndEmbed() aquí.",
    change: "Remover el hook onSummaryWrite → autoChunkAndEmbed() del paso de ingesta",
  },
  {
    id: "generate", label: "2. IA genera resumen estructurado", sub: "POST /ai/generate-summary-blocks",
    color: "#ec4899", icon: Sparkles, status: "new",
    detail: "La IA recibe content_markdown + WORKFLOW + block-schema.json como contexto. Analiza el contenido, decide tipos de bloque, genera JSON completo con bloques + keywords + quiz. El profesor puede elegir: generar automático o tema por tema.",
    change: "Endpoint nuevo. System prompt = WORKFLOW_RESUMENES_AXON.md. Output = JSON validado contra block-schema.json",
  },
  {
    id: "review", label: "3. Profesor revisa y edita", sub: "summary.status = 'review'",
    color: "#f59e0b", icon: Eye, status: "new",
    detail: "Los bloques se guardan con status 'draft'. El profesor ve el preview en modo Editor: puede reordenar bloques, editar texto, cambiar tipos, agregar imágenes, pedir que la IA regenere un bloque específico. Cuando está conforme, publica.",
    change: "UI de review con modo Editor del prototipo. Botón 'Publicar' que cambia status → 'published'",
  },
  {
    id: "flatten", label: "4. Aplanar bloques → content_markdown", sub: "flattenBlocksToMarkdown()",
    color: "#06b6d4", icon: Layers, status: "new",
    detail: "Al publicar, una función toma todos los bloques y genera un content_markdown derivado: texto limpio, curado, pedagógico. Esto reemplaza el markdown crudo del PDF. El content_markdown ahora es un DERIVADO de los bloques, no la fuente.",
    change: "Nueva función: flattenBlocksToMarkdown(). Se ejecuta como hook en onBlocksPublish()",
  },
  {
    id: "embed", label: "5. Embedding del contenido curado", sub: "autoChunkAndEmbed() sobre bloques",
    color: "#10b981", icon: Database, status: "modify",
    detail: "AHORA sí se hace el embedding — pero del content_markdown derivado de los bloques (contenido curado, no PDF crudo). Cada bloque es un chunk semántico natural. El RAG después devuelve contenido limpio y pedagógico.",
    change: "Mismo autoChunkAndEmbed() que ya existe, pero se dispara AQUÍ (post-publish), no en el paso 1. Opción: embeddear bloque por bloque (cada block = 1 chunk) en vez de re-chunkar",
  },
  {
    id: "live", label: "6. Estudiante ve el resumen", sub: "GET /summaries/:id/blocks → render",
    color: "#2563eb", icon: Monitor, status: "partial",
    detail: "Frontend pide los bloques, los renderiza con el motor de bloques (10 tipos). Keywords con popover, mastery por bloque, quiz integrado. RAG usa el contenido curado para responder preguntas del chat.",
    change: "Portar renderers del prototipo JSX a producción (TypeScript + Tailwind v4)",
  },
];

const ARCH_LAYERS = [
  {
    title: "Edge Function: ingest-pdf.ts",
    status: "modify",
    items: [
      { text: "Gemini extrae texto del PDF → content_markdown_raw", type: "keep" },
      { text: "QUITAR: onSummaryWrite() → autoChunkAndEmbed()", type: "remove" },
      { text: "AGREGAR: summary.status = 'raw' (texto extraído, sin bloques)", type: "add" },
    ],
  },
  {
    title: "Edge Function: generate-summary-blocks.ts (NUEVA)",
    status: "new",
    items: [
      { text: "Input: summary_id (que ya tiene content_markdown_raw)", type: "add" },
      { text: "System prompt: WORKFLOW + block-schema.json + ejemplos", type: "add" },
      { text: "IA (Claude opus) analiza contenido → genera JSON de bloques", type: "add" },
      { text: "Valida JSON contra block-schema.json", type: "add" },
      { text: "INSERT summary_blocks + keywords + quiz_questions", type: "add" },
      { text: "summary.status = 'review'", type: "add" },
    ],
  },
  {
    title: "Edge Function: publish-summary.ts (NUEVA)",
    status: "new",
    items: [
      { text: "Input: summary_id (profesor aprobó los bloques)", type: "add" },
      { text: "flattenBlocksToMarkdown() → content_markdown (derivado)", type: "add" },
      { text: "autoChunkAndEmbed() sobre el content_markdown curado", type: "add" },
      { text: "summary.status = 'published'", type: "add" },
      { text: "Ahora RAG tiene embeddings de contenido pedagógico", type: "add" },
    ],
  },
  {
    title: "summary-hook.ts",
    status: "modify",
    items: [
      { text: "QUITAR: auto-trigger de autoChunkAndEmbed en cada write", type: "remove" },
      { text: "AGREGAR: trigger solo cuando status cambia a 'published'", type: "add" },
    ],
  },
  {
    title: "summaries table",
    status: "modify",
    items: [
      { text: "content_markdown → se mantiene, pero ahora es DERIVADO de bloques", type: "keep" },
      { text: "AGREGAR: content_markdown_raw (texto original del PDF, para referencia)", type: "add" },
      { text: "AGREGAR: status CHECK ('raw', 'review', 'published', 'archived')", type: "add" },
      { text: "AGREGAR: generation_config jsonb (modelo IA, parámetros usados)", type: "add" },
    ],
  },
  {
    title: "summary_blocks table",
    status: "modify",
    items: [
      { text: "AGREGAR: data jsonb (estructura de cada tipo de bloque)", type: "add" },
      { text: "type: expandir de 'paragraph' → los 10 tipos del schema", type: "add" },
      { text: "Cada bloque = 1 chunk semántico natural", type: "keep" },
    ],
  },
];

const STATUS_FLOW = [
  { status: "raw", desc: "PDF subido, texto extraído por Gemini", color: "#6b7280", action: "Generar con IA" },
  { status: "review", desc: "Bloques generados, profesor revisando", color: "#f59e0b", action: "Publicar" },
  { status: "published", desc: "Aprobado → embedding hecho → visible para estudiantes", color: "#10b981", action: null },
];

/* ═══════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════ */

function Badge({ status }) {
  const s = {
    exists: { bg: "#f0fdf4", color: "#059669", label: "Ya existe" },
    modify: { bg: "#fffbeb", color: "#d97706", label: "Modificar" },
    new: { bg: "#fef2f2", color: "#dc2626", label: "Nuevo" },
    partial: { bg: "#eff6ff", color: "#2563eb", label: "Parcial" },
  }[status];
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>;
}

function ChangeTag({ type }) {
  const s = {
    keep: { bg: "#f0fdf4", color: "#059669", icon: CheckCircle2, label: "Se mantiene" },
    remove: { bg: "#fef2f2", color: "#dc2626", icon: X, label: "Quitar" },
    add: { bg: "#eff6ff", color: "#2563eb", icon: Sparkles, label: "Nuevo" },
  }[type];
  const Icon = s.icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 6, background: s.bg, color: s.color }}>
      <Icon size={10} /> {s.label}
    </span>
  );
}

export default function ArchitectureView() {
  const [view, setView] = useState("compare");
  const [activeStep, setActiveStep] = useState("generate");

  return (
    <div style={{ fontFamily: "'Work Sans', system-ui, sans-serif", background: T.pageBg, minHeight: "100vh", padding: "24px 20px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: T.tealAccent, fontWeight: 600, marginBottom: 4 }}>AXON — Arquitectura v2</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: T.darkTeal, margin: "0 0 6px" }}>
            Pipeline: Resumen primero, embedding después
          </h1>
          <p style={{ fontSize: 13, color: T.textSecondary, margin: 0 }}>
            La IA genera el contenido curado ANTES del embedding. El RAG usa contenido pedagógico, no texto crudo de PDF.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: T.white, borderRadius: 10, padding: 4, border: `1px solid ${T.border}` }}>
          {[
            { id: "compare", label: "Antes vs Después" },
            { id: "pipeline", label: "Pipeline nuevo" },
            { id: "backend", label: "Cambios backend" },
            { id: "status", label: "Status flow" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)} style={{
              flex: 1, padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: view === tab.id ? 600 : 400,
              background: view === tab.id ? T.teal50 : "transparent",
              color: view === tab.id ? T.tealAccent : T.textSecondary,
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ COMPARE VIEW ═══ */}
        {view === "compare" && (
          <div style={{ display: "flex", gap: 16 }}>
            {/* OLD */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <X size={14} /> Pipeline actual (problema)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {OLD_PIPELINE.map((step, i) => (
                  <div key={step.id}>
                    <div style={{
                      borderRadius: 10, padding: "10px 14px",
                      border: `1.5px solid ${step.problem ? "#ef4444" : T.border}`,
                      background: step.problem ? "#fef2f2" : T.white,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.darkTeal }}>{step.label}</div>
                      <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 2 }}>{step.sub}</div>
                      {step.problem && (
                        <div style={{ fontSize: 11, color: "#dc2626", marginTop: 6, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <AlertTriangle size={12} /> Embeddea texto crudo con ruido
                        </div>
                      )}
                    </div>
                    {i < OLD_PIPELINE.length - 1 && (
                      <div style={{ display: "flex", justifyContent: "center", padding: "3px 0" }}>
                        <ArrowDown size={14} color={T.textTertiary} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* NEW */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={14} /> Pipeline nuevo (solución)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { label: "PDF sube", sub: "Gemini extrae texto (temporal)", color: "#6366f1" },
                  { label: "IA genera bloques", sub: "WORKFLOW + schema → JSON", color: "#ec4899", highlight: true },
                  { label: "Profesor revisa/edita", sub: "Modo Editor del prototipo", color: "#f59e0b", highlight: true },
                  { label: "Publicar → flatten → embed", sub: "Embedding del contenido curado", color: "#10b981", highlight: true },
                  { label: "Estudiante + RAG limpio", sub: "Todo es contenido pedagógico", color: "#2563eb" },
                ].map((step, i) => (
                  <div key={i}>
                    <div style={{
                      borderRadius: 10, padding: "10px 14px",
                      border: `1.5px solid ${step.highlight ? step.color + "60" : T.border}`,
                      background: step.highlight ? step.color + "08" : T.white,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.darkTeal }}>{step.label}</div>
                      <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 2 }}>{step.sub}</div>
                    </div>
                    {i < 4 && (
                      <div style={{ display: "flex", justifyContent: "center", padding: "3px 0" }}>
                        <ArrowDown size={14} color={T.textTertiary} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ PIPELINE VIEW ═══ */}
        {view === "pipeline" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {NEW_PIPELINE.map((step, i) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              return (
                <div key={step.id}>
                  <div onClick={() => setActiveStep(isActive ? null : step.id)} style={{
                    borderRadius: 14, padding: "14px 18px", cursor: "pointer",
                    border: `2px solid ${isActive ? step.color : T.border}`,
                    background: T.white,
                    boxShadow: isActive ? `0 4px 16px ${step.color}15` : "none",
                    transition: "all 0.2s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${step.color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={16} color={step.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.darkTeal, fontFamily: "Georgia, serif" }}>{step.label}</div>
                        <div style={{ fontSize: 11, color: T.textTertiary, fontFamily: "monospace" }}>{step.sub}</div>
                      </div>
                      <Badge status={step.status} />
                    </div>
                    {isActive && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6, marginBottom: 10 }}>{step.detail}</div>
                        <div style={{ fontSize: 12, background: `${step.color}08`, borderRadius: 8, padding: "8px 12px", color: step.color, border: `1px solid ${step.color}30` }}>
                          <strong>Cambio:</strong> {step.change}
                        </div>
                      </div>
                    )}
                  </div>
                  {i < NEW_PIPELINE.length - 1 && (
                    <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
                      <ArrowDown size={16} color={T.textTertiary} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ BACKEND VIEW ═══ */}
        {view === "backend" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ARCH_LAYERS.map((layer, i) => (
              <div key={i} style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                <div style={{ padding: "12px 18px", background: T.pageBg, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.darkTeal, fontFamily: "monospace" }}>{layer.title}</div>
                  <Badge status={layer.status} />
                </div>
                <div style={{ padding: "10px 18px" }}>
                  {layer.items.map((item, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 0", borderBottom: j < layer.items.length - 1 ? `1px solid ${T.border}40` : "none" }}>
                      <ChangeTag type={item.type} />
                      <span style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Key insight */}
            <div style={{ background: T.darkTeal, borderRadius: 14, padding: "18px 22px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "Georgia, serif", color: T.tealAccent, marginBottom: 8 }}>
                El cambio clave
              </div>
              <div style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.7 }}>
                Hoy el hook <code style={{ background: "#ffffff15", padding: "1px 5px", borderRadius: 3, fontSize: 11 }}>onSummaryWrite()</code> dispara embedding cada vez que se escribe <code style={{ background: "#ffffff15", padding: "1px 5px", borderRadius: 3, fontSize: 11 }}>content_markdown</code>.
                En la v2, ese hook solo se activa cuando <code style={{ background: "#ffffff15", padding: "1px 5px", borderRadius: 3, fontSize: 11 }}>status</code> cambia a <code style={{ background: "#ffffff15", padding: "1px 5px", borderRadius: 3, fontSize: 11 }}>'published'</code>.
                Esto significa que la IA puede generar, el profesor puede editar, y el embedding solo se hace UNA vez con el contenido final curado.
              </div>
            </div>
          </div>
        )}

        {/* ═══ STATUS FLOW VIEW ═══ */}
        {view === "status" && (
          <div>
            <div style={{ background: T.white, borderRadius: 14, padding: "20px 24px", border: `1px solid ${T.border}`, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "Georgia, serif", color: T.darkTeal, marginBottom: 14 }}>
                Lifecycle de un resumen
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                {STATUS_FLOW.map((s, i) => (
                  <div key={s.status} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 56, height: 56, borderRadius: "50%",
                        background: `${s.color}15`, border: `3px solid ${s.color}`,
                        marginBottom: 8,
                      }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: s.color }}>
                          {i + 1}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.status}</div>
                      <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 4, lineHeight: 1.4, maxWidth: 180, margin: "4px auto 0" }}>{s.desc}</div>
                      {s.action && (
                        <div style={{ marginTop: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: `${s.color}15`, color: s.color }}>
                            → {s.action}
                          </span>
                        </div>
                      )}
                    </div>
                    {i < STATUS_FLOW.length - 1 && <ArrowRight size={20} color={T.textTertiary} style={{ flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* What triggers what */}
            <div style={{ background: T.white, borderRadius: 14, padding: "20px 24px", border: `1px solid ${T.border}`, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "Georgia, serif", color: T.darkTeal, marginBottom: 12 }}>
                Qué dispara qué
              </div>
              <pre style={{ fontSize: 12, lineHeight: 1.7, color: T.textSecondary, margin: 0, fontFamily: "monospace", background: T.pageBg, borderRadius: 8, padding: 14, overflow: "auto" }}>
{`// TRANSICIÓN 1: raw → review
POST /ai/generate-summary-blocks { summary_id }
  → Lee content_markdown_raw (texto del PDF)
  → Claude genera JSON de bloques
  → INSERT summary_blocks, keywords, quiz_questions
  → UPDATE summaries SET status = 'review'
  → NO embedding todavía

// TRANSICIÓN 2: review → published
POST /content/summaries/:id/publish
  → flattenBlocksToMarkdown(summary_id)
  → UPDATE summaries SET content_markdown = <texto curado>
  → autoChunkAndEmbed(summary_id)  ← AQUÍ se embeddea
  → UPDATE summaries SET status = 'published'
  → Ahora RAG tiene contenido pedagógico`}
              </pre>
            </div>

            {/* Embedding comparison */}
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, borderRadius: 12, padding: "14px 18px", border: `2px solid #ef4444`, background: "#fef2f2" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>Embedding ANTES (crudo)</div>
                <pre style={{ fontSize: 11, color: "#6b7280", margin: 0, fontFamily: "monospace", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
{`"ATEROSCLEROSIS
Dra. Martínez - Cardiología 2024
Página 1 de 45
---
La aterosclerosis es una
enfermedad inflamatoria
crónica de las arterias...
[header repetido]
[pie de página]
[número de slide]"`}
                </pre>
                <div style={{ fontSize: 11, color: "#dc2626", marginTop: 8, fontWeight: 600 }}>
                  → RAG devuelve basura con headers, footers, números de página
                </div>
              </div>

              <div style={{ flex: 1, borderRadius: 12, padding: "14px 18px", border: `2px solid #10b981`, background: "#f0fdf4" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", marginBottom: 8 }}>Embedding DESPUÉS (curado)</div>
                <pre style={{ fontSize: 11, color: "#6b7280", margin: 0, fontFamily: "monospace", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
{`"La aterosclerosis es una
enfermedad inflamatoria
crónica de las arterias de
mediano y gran calibre.
Se caracteriza por la
acumulación progresiva de
lípidos, células inflamatorias
y tejido fibroso en la íntima
de la pared arterial."`}
                </pre>
                <div style={{ fontSize: 11, color: "#059669", marginTop: 8, fontWeight: 600 }}>
                  → RAG devuelve contenido limpio, pedagógico, sin ruido
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}