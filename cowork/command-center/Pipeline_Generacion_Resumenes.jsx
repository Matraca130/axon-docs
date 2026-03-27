import { useState } from "react";
import { FileText, Brain, Database, Eye, ChevronRight, Upload, Sparkles, CheckCircle2, AlertTriangle, ArrowDown, Layers, BookOpen, Code2, Monitor } from "lucide-react";

const T = {
  darkTeal: "#1B3B36",
  tealAccent: "#2a8c7a",
  teal50: "#e8f5f1",
  teal100: "#d1f0e7",
  pageBg: "#faf9f6",
  white: "#FFFFFF",
  border: "#E5E7EB",
  textPrimary: "#1a1a1a",
  textSecondary: "#4b5563",
  textTertiary: "#9CA3AF",
};

/* ═══════════════════════════════════════
   PIPELINE STEPS DATA
   ═══════════════════════════════════════ */
const STEPS = [
  {
    id: "upload",
    icon: Upload,
    title: "1. Profesor sube material",
    subtitle: "POST /ai/ingest-pdf",
    color: "#6366f1",
    status: "exists",
    details: [
      "Profesor sube PDF del tema (ej: 'Diabetes Tipo 2')",
      "Se asocia a: Institution → Course → Subject → Topic → Subtopic",
      "Puede subir múltiples PDFs por subtopic",
    ],
    existing: "Pipeline actual: Gemini extrae texto → content_markdown → autoChunkAndEmbed()",
    gap: null,
  },
  {
    id: "extract",
    icon: FileText,
    title: "2. Extracción + Chunking",
    subtitle: "Gemini 2.5 Flash → chunks + embeddings",
    color: "#8b5cf6",
    status: "exists",
    details: [
      "Gemini extrae texto estructurado del PDF",
      "Se chunka semánticamente → embeddings (OpenAI text-embedding-3-large)",
      "Chunks se guardan con pgvector para RAG posterior",
      "content_markdown se guarda en summaries (texto plano)",
    ],
    existing: "Ya funciona en producción: onSummaryWrite() → autoChunkAndEmbed()",
    gap: null,
  },
  {
    id: "analyze",
    icon: Brain,
    title: "3. Análisis de contenido (NUEVO)",
    subtitle: "Claude / Gemini → estructura pedagógica",
    color: "#ec4899",
    status: "new",
    details: [
      "La IA recibe el content_markdown completo",
      "Fase 1: Identifica subtemas reales del material",
      "Fase 2: Clasifica cada subtema (narrativo, secuencial, comparativo, etc.)",
      "Fase 3: Establece jerarquía (core / importante / complementario)",
      "Output: plan de bloques con tipo + justificación",
    ],
    existing: null,
    gap: "Necesita endpoint nuevo: POST /ai/analyze-summary-structure",
  },
  {
    id: "generate",
    icon: Sparkles,
    title: "4. Generación de bloques JSON",
    subtitle: "IA → block-schema.json válido",
    color: "#f59e0b",
    status: "new",
    details: [
      "La IA genera bloques según el plan del paso 3",
      "Usa el WORKFLOW como system prompt (mapeo contenido → tipo de bloque)",
      "Genera JSON que cumple block-schema.json exactamente",
      "Incluye: summary_meta, keywords[], blocks[]",
      "Keywords usan sintaxis {{keyword_id}} dentro del texto",
      "Cada bloque tiene su data estructurada según tipo",
    ],
    existing: "Ya tienes: block-schema.json + 4 ejemplos JSON (diabetes, anatomía, farmaco, patología)",
    gap: "Necesita endpoint: POST /ai/generate-summary-blocks",
  },
  {
    id: "validate",
    icon: CheckCircle2,
    title: "5. Validación + Review",
    subtitle: "Schema validation → profesor revisa",
    color: "#10b981",
    status: "new",
    details: [
      "Backend valida JSON contra block-schema.json",
      "Verifica: todos los {{keyword_id}} existen en keywords[]",
      "Verifica: flujo pedagógico (no empieza con callout, etc.)",
      "summary.status = 'review' → profesor ve preview antes de publicar",
      "Profesor puede editar bloques en modo Editor del prototipo",
    ],
    existing: "summaries.status necesita agregar 'review' al CHECK constraint",
    gap: "Necesita: JSON Schema validator en backend + status migration",
  },
  {
    id: "store",
    icon: Database,
    title: "6. Persistir en Supabase",
    subtitle: "summary_blocks + keywords → PostgreSQL",
    color: "#06b6d4",
    status: "partial",
    details: [
      "Cada bloque → row en summary_blocks con type + data (JSONB)",
      "Keywords → rows en keywords con related[] y priority",
      "Quiz questions → quiz_questions con block_id FK",
      "order_index preserva la secuencia de lectura",
    ],
    existing: "Tablas existen pero: summary_blocks.content es TEXT (no JSONB), falta columna data",
    gap: "Migración: ALTER TABLE summary_blocks ADD COLUMN data jsonb",
  },
  {
    id: "render",
    icon: Monitor,
    title: "7. Render en frontend",
    subtitle: "React components → vista estudiante/editor",
    color: "#ef4444",
    status: "partial",
    details: [
      "Frontend hace GET /summaries/:id/blocks → recibe array de bloques",
      "Cada bloque se renderiza según su type con el componente correcto",
      "Keywords se resuelven inline ({{id}} → chip teal con popover)",
      "Mastery por bloque se calcula desde BKT de keywords del bloque",
      "Modo Estudiante: flujo limpio de lectura",
      "Modo Editor: cards con toolbar, drag & drop, insert buttons",
    ],
    existing: "Prototipo JSX tiene los 10 renderers. TipTap existe pero es monolítico (HTML, no bloques)",
    gap: "Migrar de TipTap monolítico → block renderer basado en type dispatch",
  },
];

const BATCH_FLOW = [
  { label: "Profesor selecciona materia", desc: "Ej: 'Cardiología — Patología Vascular'" },
  { label: "Selecciona temas (multi)", desc: "☑ Aterosclerosis  ☑ HTA  ☑ Valvulopatías  ☑ ICC" },
  { label: "Sube material por tema", desc: "PDF por cada tema, o un PDF grande que la IA segmenta" },
  { label: "IA procesa en batch", desc: "Pasos 2-6 en paralelo para cada tema → SSE progress" },
  { label: "Profesor revisa en cola", desc: "Lista de resúmenes generados con status 'review'" },
  { label: "Publica los aprobados", desc: "status → 'published' → visibles para estudiantes" },
];

/* ═══════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════ */

function StatusBadge({ status }) {
  const styles = {
    exists: { bg: "#f0fdf4", color: "#059669", border: "#10b981", label: "Ya existe" },
    partial: { bg: "#fffbeb", color: "#d97706", border: "#f59e0b", label: "Parcial" },
    new: { bg: "#fef2f2", color: "#dc2626", border: "#ef4444", label: "Por construir" },
  };
  const s = styles[status];
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

function StepCard({ step, isActive, onClick }) {
  const Icon = step.icon;
  return (
    <div
      onClick={onClick}
      style={{
        background: isActive ? T.white : T.white,
        borderRadius: 14,
        padding: "16px 20px",
        border: `2px solid ${isActive ? step.color : T.border}`,
        boxShadow: isActive ? `0 4px 20px ${step.color}20` : "0 1px 3px rgba(0,0,0,0.04)",
        cursor: "pointer",
        transition: "all 0.2s",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${step.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color={step.color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.darkTeal, fontFamily: "Georgia, serif" }}>{step.title}</div>
          <div style={{ fontSize: 12, color: T.textTertiary, fontFamily: "monospace" }}>{step.subtitle}</div>
        </div>
        <StatusBadge status={step.status} />
      </div>

      {isActive && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {step.details.map((d, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: T.textSecondary, lineHeight: 1.5 }}>
                <ChevronRight size={14} color={step.color} style={{ marginTop: 3, flexShrink: 0 }} />
                <span>{d}</span>
              </div>
            ))}
          </div>
          {step.existing && (
            <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#059669", marginBottom: step.gap ? 6 : 0 }}>
              <strong>Ya tienes:</strong> {step.existing}
            </div>
          )}
          {step.gap && (
            <div style={{ background: "#fef2f2", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#dc2626" }}>
              <strong>Falta:</strong> {step.gap}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConnectorArrow() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
      <ArrowDown size={18} color={T.textTertiary} />
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN
   ═══════════════════════════════════════ */
export default function PipelineView() {
  const [activeStep, setActiveStep] = useState("upload");
  const [view, setView] = useState("pipeline"); // pipeline | batch | schema

  return (
    <div style={{ fontFamily: "'Work Sans', system-ui, sans-serif", background: T.pageBg, minHeight: "100vh", padding: "24px 20px" }}>
      {/* Header */}
      <div style={{ maxWidth: 720, margin: "0 auto 24px" }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: T.tealAccent, fontWeight: 600, marginBottom: 4 }}>
          AXON — Sistema de Resúmenes
        </div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: T.darkTeal, margin: "0 0 8px" }}>
          Pipeline de Generación IA
        </h1>
        <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.6, margin: 0 }}>
          Cómo un PDF del profesor se transforma en un resumen de bloques renderizado para el estudiante.
        </p>

        {/* View tabs */}
        <div style={{ display: "flex", gap: 4, marginTop: 16, background: T.white, borderRadius: 10, padding: 4, border: `1px solid ${T.border}` }}>
          {[
            { id: "pipeline", label: "Pipeline completo", icon: Layers },
            { id: "batch", label: "Flujo batch (varios temas)", icon: BookOpen },
            { id: "schema", label: "JSON → Render", icon: Code2 },
          ].map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: view === tab.id ? 600 : 400,
                  background: view === tab.id ? T.teal50 : "transparent",
                  color: view === tab.id ? T.tealAccent : T.textSecondary,
                  transition: "all 0.15s",
                }}
              >
                <TabIcon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {view === "pipeline" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {STEPS.map((step, i) => (
              <div key={step.id}>
                <StepCard step={step} isActive={activeStep === step.id} onClick={() => setActiveStep(activeStep === step.id ? null : step.id)} />
                {i < STEPS.length - 1 && <ConnectorArrow />}
              </div>
            ))}

            {/* Summary stats */}
            <div style={{ marginTop: 24, background: T.darkTeal, borderRadius: 14, padding: "20px 24px", color: T.white }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "Georgia, serif", color: T.tealAccent, marginBottom: 12 }}>
                Resumen del estado
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>2</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>Pasos que ya existen</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#f59e0b" }}>2</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>Parcialmente listos</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#ef4444" }}>3</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>Por construir</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "batch" && (
          <div>
            <div style={{ background: T.white, borderRadius: 14, padding: "20px 24px", border: `1px solid ${T.border}`, marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "Georgia, serif", color: T.darkTeal, marginBottom: 4 }}>
                Generación batch: varios temas a la vez
              </div>
              <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 16 }}>
                El profesor selecciona una materia, marca los temas, y la IA genera todos los resúmenes en paralelo.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {BATCH_FLOW.map((step, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                        background: T.tealAccent, color: T.white, display: "flex",
                        alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, paddingBottom: i < BATCH_FLOW.length - 1 ? 16 : 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: T.darkTeal }}>{step.label}</div>
                        <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 2, fontFamily: step.desc.includes("☑") ? "monospace" : "inherit", fontSize: step.desc.includes("☑") ? 12 : 13 }}>
                          {step.desc}
                        </div>
                      </div>
                    </div>
                    {i < BATCH_FLOW.length - 1 && (
                      <div style={{ marginLeft: 13, width: 2, height: 12, background: T.teal100 }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Progress UI mockup */}
            <div style={{ background: T.white, borderRadius: 14, padding: "20px 24px", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "Georgia, serif", color: T.darkTeal, marginBottom: 14 }}>
                UI del profesor durante generación batch
              </div>
              {[
                { topic: "Aterosclerosis", progress: 100, status: "review", blocks: 12 },
                { topic: "Hipertensión Arterial", progress: 100, status: "review", blocks: 10 },
                { topic: "Valvulopatías", progress: 72, status: "generating", blocks: null },
                { topic: "Insuficiencia Cardíaca", progress: 30, status: "generating", blocks: null },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{item.topic}</div>
                    <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 2 }}>
                      {item.status === "review" ? `${item.blocks} bloques generados` : `Procesando...`}
                    </div>
                  </div>
                  <div style={{ width: 120, height: 6, borderRadius: 3, background: T.border, overflow: "hidden" }}>
                    <div style={{ width: `${item.progress}%`, height: "100%", borderRadius: 3, background: item.progress === 100 ? "#10b981" : T.tealAccent, transition: "width 0.3s" }} />
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
                    background: item.status === "review" ? "#f0fdf4" : "#eff6ff",
                    color: item.status === "review" ? "#059669" : "#2563eb",
                  }}>
                    {item.status === "review" ? "Revisar" : `${item.progress}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "schema" && (
          <div>
            <div style={{ background: T.white, borderRadius: 14, padding: "20px 24px", border: `1px solid ${T.border}`, marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "Georgia, serif", color: T.darkTeal, marginBottom: 4 }}>
                Del JSON al render: un mismo schema, dos salidas
              </div>
              <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>
                La IA genera un JSON que cumple <code style={{ background: T.teal50, padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>block-schema.json</code>.
                Ese mismo JSON alimenta tanto el prototipo HTML como el React.
              </div>
            </div>

            {/* Flow diagram */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 16 }}>
              {/* Source */}
              <div style={{ background: "#6366f1", color: T.white, borderRadius: 10, padding: "12px 24px", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
                PDF del profesor
              </div>
              <ArrowDown size={18} color={T.textTertiary} />

              {/* AI */}
              <div style={{ background: "#ec4899", color: T.white, borderRadius: 10, padding: "12px 24px", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
                IA (Claude/Gemini) + WORKFLOW prompt + block-schema.json
              </div>
              <ArrowDown size={18} color={T.textTertiary} />

              {/* JSON */}
              <div style={{ background: T.darkTeal, color: T.white, borderRadius: 12, padding: "16px 24px", width: "100%", maxWidth: 500 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.tealAccent, marginBottom: 8, fontFamily: "Georgia, serif" }}>
                  JSON generado (schema válido)
                </div>
                <pre style={{ fontSize: 11, lineHeight: 1.5, color: "#d1d5db", margin: 0, overflow: "auto", fontFamily: "monospace" }}>
{`{
  "summary_meta": { "title": "Diabetes Tipo 2", ... },
  "keywords": [
    { "id": "insulina", "term": "Insulina", "definition": "..." },
    { "id": "metformina", "term": "Metformina", ... }
  ],
  "blocks": [
    { "type": "prose", "title": "Definición", "content": "La {{resistencia_insulina}} es..." },
    { "type": "key_point", "title": "Concepto Central", "importance": "critical", ... },
    { "type": "stages", "items": [{ "stage": 1, ... }, ...] },
    { "type": "comparison", "headers": [...], "rows": [...] },
    { "type": "callout", "variant": "exam", ... }
  ]
}`}
                </pre>
              </div>
              <ArrowDown size={18} color={T.textTertiary} />

              {/* Two outputs */}
              <div style={{ display: "flex", gap: 16, width: "100%" }}>
                <div style={{ flex: 1, borderRadius: 12, padding: "14px 18px", border: `2px solid #f59e0b`, background: "#fffbeb" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#d97706", marginBottom: 6 }}>Prototipo HTML</div>
                  <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
                    <code style={{ fontSize: 11 }}>renderBlock(json)</code> genera HTML string con inline styles. Ideal para preview rápido, export PDF, email.
                  </div>
                </div>
                <div style={{ flex: 1, borderRadius: 12, padding: "14px 18px", border: `2px solid #6366f1`, background: "#eef2ff" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", marginBottom: 6 }}>Producción React</div>
                  <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
                    <code style={{ fontSize: 11 }}>{"<BlockRenderer block={json} />"}</code> despacha al componente correcto por type. Interactivo, con mastery, quiz, editor.
                  </div>
                </div>
              </div>
            </div>

            {/* The dispatch pattern */}
            <div style={{ background: T.white, borderRadius: 14, padding: "20px 24px", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "Georgia, serif", color: T.darkTeal, marginBottom: 12 }}>
                Patrón de dispatch (ambos prototipos)
              </div>
              <pre style={{ fontSize: 12, lineHeight: 1.6, color: T.textSecondary, margin: 0, overflow: "auto", fontFamily: "monospace", background: T.pageBg, borderRadius: 8, padding: 14 }}>
{`// El JSON es el contrato entre IA y frontend
// Ambos prototipos usan el mismo switch:

function renderBlock(block) {
  switch (block.type) {
    case "prose":           return <ProseBlock {...block} />
    case "key_point":       return <KeyPointBlock {...block} />
    case "stages":          return <StagesBlock {...block} />
    case "comparison":      return <ComparisonBlock {...block} />
    case "list_detail":     return <ListDetailBlock {...block} />
    case "grid":            return <GridBlock {...block} />
    case "two_column":      return <TwoColumnBlock {...block} />
    case "callout":         return <CalloutBlock {...block} />
    case "image_reference": return <ImageReferenceBlock {...block} />
    case "section_divider": return <SectionDividerBlock {...block} />
  }
}

// Para generar múltiples resúmenes:
// 1. Cada topic genera UN JSON independiente
// 2. Cada JSON se persiste en summary_blocks (1 row por bloque)
// 3. Frontend pide: GET /summaries/:id/blocks → render`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}