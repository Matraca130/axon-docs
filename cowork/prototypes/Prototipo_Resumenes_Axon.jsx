import { useState, useCallback, useRef, useEffect } from "react";
import { GripVertical, Plus, Trash2, Copy, ChevronDown, Sparkles, List, Table, Columns2, AlertTriangle, BookOpen, Brain, CircleDot, LayoutGrid, FileText, Minus, Eye, Edit3, Zap, X, Check, HelpCircle, ArrowRight, Activity, Heart, Pill, Stethoscope, Shield, FlaskConical, Clock, Lightbulb, Target, AlertCircle, Info, CheckCircle2, RotateCcw, MessageSquare, Image, AlignLeft, AlignRight, Trash, PanelLeftOpen, PanelRightOpen } from "lucide-react";

/* ═══════════════════════════════════════════════════
   AXON DESIGN TOKENS
   ═══════════════════════════════════════════════════ */
const T = {
  darkTeal: "#1B3B36", tealAccent: "#2a8c7a", teal50: "#e8f5f1", teal100: "#d1f0e7",
  pageBg: "#F0F2F5", white: "#FFFFFF", border: "#E5E7EB",
  textPrimary: "#111827", textSecondary: "#6b7280", textTertiary: "#9CA3AF",
  // mastery delta colors
  masteryGray: { bg: "#f4f4f5", border: "#a1a1aa", text: "#71717a", label: "Por descubrir" },
  masteryRed: { bg: "#fef2f2", border: "#ef4444", text: "#dc2626", label: "Emergente" },
  masteryYellow: { bg: "#fffbeb", border: "#f59e0b", text: "#d97706", label: "En progreso" },
  masteryGreen: { bg: "#f0fdf4", border: "#10b981", text: "#059669", label: "Consolidado" },
  masteryBlue: { bg: "#eff6ff", border: "#3b82f6", text: "#2563eb", label: "Maestría" },
  // callout variants
  callout: {
    tip: { bg: "#f0fdf4", border: "#10b981", icon: Lightbulb, label: "Tip" },
    warning: { bg: "#fffbeb", border: "#f59e0b", icon: AlertTriangle, label: "Atención" },
    clinical: { bg: "#eff6ff", border: "#3b82f6", icon: Stethoscope, label: "Correlación Clínica" },
    mnemonic: { bg: "#f5f3ff", border: "#8b5cf6", icon: Brain, label: "Mnemotecnia" },
    exam: { bg: "#fef2f2", border: "#ef4444", icon: Target, label: "Importante para Examen" },
  },
  severity: { mild: "#10b981", moderate: "#f59e0b", critical: "#ef4444" },
};

function getMasteryStyle(level) {
  if (level >= 1.1) return T.masteryBlue;
  if (level >= 1.0) return T.masteryGreen;
  if (level >= 0.85) return T.masteryYellow;
  if (level >= 0.5) return T.masteryRed;
  return T.masteryGray;
}

/* ═══════════════════════════════════════════════════
   SAMPLE DATA — Aterosclerosis
   ═══════════════════════════════════════════════════ */
const SAMPLE_KEYWORDS = {
  aterosclerosis: { term: "Aterosclerosis", definition: "Enfermedad inflamatoria crónica de las arterias caracterizada por la acumulación de lípidos, células inflamatorias y tejido fibroso en la pared arterial, formando placas ateromatosas.", related: ["Placa ateromatosa", "Endotelio", "LDL oxidado"] },
  endotelio: { term: "Endotelio", definition: "Capa unicelular que reviste el interior de los vasos sanguíneos. Regula el tono vascular, la coagulación y la respuesta inflamatoria.", related: ["Óxido nítrico", "Disfunción endotelial"] },
  ldl: { term: "LDL oxidado", definition: "Lipoproteína de baja densidad que ha sufrido oxidación. Es el principal iniciador de la respuesta inflamatoria en la pared arterial.", related: ["Colesterol", "Macrófagos", "Células espumosas"] },
  macrofagos: { term: "Macrófagos", definition: "Células del sistema inmune que migran al subendotelio y fagocitan LDL oxidado, transformándose en células espumosas. Son componentes centrales de la placa ateromatosa.", related: ["Células espumosas", "Inflamación"] },
  estatinas: { term: "Estatinas", definition: "Grupo farmacológico que inhibe la HMG-CoA reductasa, reduciendo la síntesis hepática de colesterol. Primera línea en el tratamiento de la hipercolesterolemia.", related: ["HMG-CoA reductasa", "LDL", "Colesterol"] },
  trombosis: { term: "Trombosis", definition: "Formación de un coágulo (trombo) dentro de un vaso sanguíneo. Complicación aguda de la ruptura de placa ateromatosa, puede causar infarto o ACV.", related: ["Plaquetas", "Fibrina", "IAM"] },
};

// simulated per-block mastery (in real Axon, computed from keyword BKT states)
const BLOCK_MASTERY = { b1: 0.4, b2: 1.15, b3: 0.9, b4: 0.6, b5: 1.05, b6: 0.3, b7: 0.88, b8: 1.0, b9: 0.7, b10: 0.95, b11: 0.5, b12: 1.2 };

const INITIAL_BLOCKS = [
  { id: "b1", type: "prose", title: "Definición y Concepto General", content: "La {{aterosclerosis}} es una enfermedad inflamatoria crónica de las arterias de mediano y gran calibre. Se caracteriza por la acumulación progresiva de lípidos, células inflamatorias y tejido fibroso en la íntima de la pared arterial, formando lesiones conocidas como placas ateromatosas.\n\nEs la principal causa de enfermedad cardiovascular a nivel mundial, incluyendo infarto agudo de miocardio, accidente cerebrovascular y enfermedad arterial periférica. Su desarrollo es lento y silencioso, iniciándose frecuentemente en la juventud y manifestándose clínicamente décadas después.", image: { url: null, position: "right", size: "medium", caption: "Corte transversal de arteria con placa ateromatosa", description: "Imagen histológica de una arteria coronaria con placa ateromatosa" } },
  { id: "b2", type: "key_point", title: "Concepto Central", content: "La aterosclerosis NO es simplemente una acumulación pasiva de grasa — es un proceso inflamatorio activo donde el sistema inmune responde a la presencia de {{ldl}} en la pared arterial, generando un ciclo de daño y reparación que eventualmente estrecha o obstruye el vaso.", importance: "critical" },
  { id: "b3", type: "stages", title: "Patogénesis — Etapas de Formación de la Placa", items: [
    { stage: 1, title: "Disfunción endotelial", content: "El {{endotelio}} sufre daño por factores como hipertensión, tabaco, hiperglucemia o LDL elevado. Pierde su función protectora y se vuelve permeable a lipoproteínas.", severity: "mild" },
    { stage: 2, title: "Infiltración de LDL", content: "El {{ldl}} penetra al subendotelio y sufre oxidación. El LDL oxidado actúa como señal de alarma que activa el endotelio y recluta células inflamatorias.", severity: "mild" },
    { stage: 3, title: "Formación de células espumosas", content: "Los {{macrofagos}} migran al subendotelio y fagocitan LDL oxidado sin control, transformándose en células espumosas. Esto forma la estría grasa, la lesión más temprana visible.", severity: "moderate" },
    { stage: 4, title: "Placa fibrosa", content: "Las células musculares lisas migran desde la media, proliferan y producen colágeno, formando una capa fibrosa sobre el núcleo lipídico. La placa crece y puede estrechar la luz del vaso.", severity: "moderate" },
    { stage: 5, title: "Complicación: ruptura y trombosis", content: "Si la capa fibrosa es delgada o inflamada, puede romperse. El contenido del núcleo lipídico queda expuesto a la sangre, activando la cascada de coagulación y causando {{trombosis}} aguda.", severity: "critical" },
  ]},
  { id: "b4", type: "list_detail", title: "Factores de Riesgo", intro: "Se clasifican en modificables y no modificables. La presencia de múltiples factores tiene efecto multiplicador sobre el riesgo cardiovascular.", items: [
    { label: "Hipercolesterolemia", detail: "LDL elevado es el factor más directamente aterogénico. Meta terapéutica: LDL < 70 mg/dL en pacientes de alto riesgo.", icon: "Activity", severity: "high" },
    { label: "Hipertensión arterial", detail: "Daña el endotelio por estrés mecánico. Cada 20 mmHg de PAS duplica el riesgo CV.", icon: "Heart", severity: "high" },
    { label: "Tabaquismo", detail: "Causa disfunción endotelial directa, aumenta LDL oxidado, reduce HDL y promueve trombosis.", icon: "AlertCircle", severity: "high" },
    { label: "Diabetes mellitus", detail: "La hiperglucemia crónica acelera la aterosclerosis por glicación de proteínas, inflamación y dislipidemia.", icon: "Activity", severity: "medium" },
    { label: "Edad y sexo", detail: "Hombres > 45 años, mujeres > 55 años. No modificable. El riesgo aumenta progresivamente con la edad.", icon: "Clock", severity: "low" },
  ]},
  { id: "b5", type: "comparison", title: "Diagnóstico Diferencial: Tipos de Angina", headers: ["Característica", "Angina Estable", "Angina Inestable", "IAM"], rows: [
    ["Dolor", "Con esfuerzo, cede con reposo", "En reposo o progresiva", "Intenso, prolongado (>20 min)"],
    ["ECG", "Normal o ST descendente", "ST descendente o T invertida", "ST elevado o nuevo BCRI"],
    ["Troponina", "Normal", "Normal o levemente elevada", "Elevada (diagnóstica)"],
    ["Tratamiento", "Nitratos + betabloqueantes", "Anticoagulación + internación", "Reperfusión urgente (PCI o fibrinolítico)"],
  ], highlight_column: 3 },
  { id: "b6", type: "callout", variant: "clinical", title: "Correlación Clínica", content: "Un paciente de 58 años, fumador, con HTA y dislipidemia que consulta por dolor torácico opresivo de 30 minutos de duración con ECG que muestra supradesnivel del ST en derivaciones V1-V4 sugiere un IAM anterior por oclusión de la arteria descendente anterior (DA). La conducta inmediata es reperfusión." },
  { id: "b7", type: "two_column", columns: [
    { title: "Factores Modificables", content_type: "list_detail", items: [
      { label: "Dislipidemia", detail: "Control con estatinas y dieta" },
      { label: "HTA", detail: "Meta < 130/80 mmHg" },
      { label: "Tabaquismo", detail: "Cesación tabáquica" },
      { label: "Sedentarismo", detail: "150 min/semana de actividad" },
    ]},
    { title: "Factores No Modificables", content_type: "list_detail", items: [
      { label: "Edad", detail: "> 45H / > 55M" },
      { label: "Sexo", detail: "Masculino > Femenino (pre-menopausia)" },
      { label: "Genética", detail: "Historia familiar de ECV precoz" },
      { label: "Etnia", detail: "Mayor prevalencia en ciertas poblaciones" },
    ]},
  ]},
  { id: "b8", type: "grid", title: "Territorios Vasculares Afectados", columns: 3, items: [
    { label: "Coronarias", detail: "→ Angina, IAM", icon: "Heart" },
    { label: "Carótidas", detail: "→ ACV isquémico, AIT", icon: "Brain" },
    { label: "Aorta", detail: "→ Aneurisma, disección", icon: "Activity" },
    { label: "Renales", detail: "→ HTA renovascular, IR", icon: "FlaskConical" },
    { label: "Ilíacas/femorales", detail: "→ Claudicación intermitente", icon: "Activity" },
    { label: "Mesentéricas", detail: "→ Isquemia mesentérica", icon: "AlertCircle" },
  ]},
  { id: "b9", type: "callout", variant: "exam", title: "Clave para el Examen", content: "La placa VULNERABLE (con capa fibrosa delgada, núcleo lipídico grande e infiltración de macrófagos) es más peligrosa que la placa ESTABLE (fibrosa, calcificada). Una placa del 40% puede causar IAM si se rompe, mientras que una del 90% puede ser asintomática si es estable." },
  { id: "b10", type: "prose", title: "Tratamiento Farmacológico", content: "El manejo de la aterosclerosis se basa en la reducción agresiva de factores de riesgo y el uso de fármacos con evidencia de reducción de eventos cardiovasculares.\n\nLas {{estatinas}} son la piedra angular del tratamiento, reduciendo el LDL entre 30-50% dependiendo de la dosis. Además de su efecto hipolipemiante, tienen efectos pleiotrópicos: mejoran la función endotelial, reducen la inflamación (disminuyen PCR) y estabilizan la placa ateromatosa.\n\nEl ácido acetilsalicílico (aspirina) en dosis bajas (75-100 mg/día) inhibe la agregación plaquetaria y reduce el riesgo de eventos trombóticos en prevención secundaria.", image: { url: null, position: "left", size: "large", caption: "Mecanismo de acción de las estatinas", description: "Diagrama del mecanismo de inhibición de HMG-CoA reductasa" } },
  { id: "b11", type: "callout", variant: "mnemonic", title: "Mnemotecnia: ABCDE de Prevención", content: "A — Aspirina y Anticoagulación\nB — Betabloqueantes y control de presión arterial (Blood pressure)\nC — Colesterol (estatinas) y Cesación tabáquica\nD — Dieta y Diabetes (control glucémico)\nE — Ejercicio regular" },
  { id: "b12", type: "image_reference", description: "Diagrama de la formación de la placa ateromatosa mostrando las 5 etapas: disfunción endotelial → infiltración LDL → células espumosas → placa fibrosa → ruptura y trombosis", caption: "Figura 1. Etapas de la aterogénesis", image_url: null },
];

/* ═══════════════════════════════════════════════════
   KEYWORD CHIP (inline text replacement)
   ═══════════════════════════════════════════════════ */
function KeywordChip({ id, keywords, onHover }) {
  const kw = keywords[id];
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  if (!kw) return <span>{`{{${id}}}`}</span>;
  return (
    <span style={{ position: "relative", display: "inline" }}>
      <span ref={ref}
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        style={{ backgroundColor: T.teal50, color: T.tealAccent, padding: "2px 8px", borderRadius: 12, fontWeight: 600, cursor: "pointer", fontSize: "0.95em", border: `1px solid ${T.teal100}`, transition: "all 0.15s" }}>
        {kw.term}
      </span>
      {show && (
        <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", width: 320, background: T.white, borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", padding: 16, zIndex: 100, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.darkTeal, fontFamily: "Georgia, serif", marginBottom: 6 }}>{kw.term}</div>
          <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.5, marginBottom: 8 }}>{kw.definition}</div>
          {kw.related.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {kw.related.map(r => <span key={r} style={{ fontSize: 11, background: T.teal50, color: T.tealAccent, padding: "2px 8px", borderRadius: 10 }}>{r}</span>)}
            </div>
          )}
          <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 12, height: 12, background: T.white, border: `1px solid ${T.border}`, borderTop: "none", borderLeft: "none" }} />
        </div>
      )}
    </span>
  );
}

function renderTextWithKeywords(text, keywords) {
  if (!text) return null;
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, i) => {
    const match = part.match(/^\{\{(.+)\}\}$/);
    if (match) return <KeywordChip key={i} id={match[1]} keywords={keywords} />;
    // handle newlines
    return part.split("\n\n").map((p, j) => (
      <span key={`${i}-${j}`}>{j > 0 && <><br /><br /></>}{p}</span>
    ));
  });
}

/* Icon map helper */
const ICONS = { Activity, Heart, Pill, Stethoscope, Shield, FlaskConical, Clock, Lightbulb, Target, AlertCircle, Brain, Info, AlertTriangle, HelpCircle, CheckCircle2 };
function IconByName({ name, size = 16, color }) {
  const Icon = ICONS[name] || CircleDot;
  return <Icon size={size} color={color} />;
}

/* ═══════════════════════════════════════════════════
   BLOCK RENDERERS (10 types)
   ═══════════════════════════════════════════════════ */
function ProseBlock({ block, keywords }) {
  return (
    <div>
      {block.title && <h3 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: T.darkTeal, marginBottom: 10, marginTop: 0 }}>{block.title}</h3>}
      <div style={{ fontSize: 15, lineHeight: 1.75, color: T.textSecondary }}>{renderTextWithKeywords(block.content, keywords)}</div>
    </div>
  );
}

function KeyPointBlock({ block, keywords }) {
  return (
    <div style={{ background: T.darkTeal, borderRadius: 12, padding: "20px 24px", color: T.white }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Zap size={18} color={T.tealAccent} />
        <span style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, color: T.tealAccent }}>{block.title}</span>
        {block.importance === "critical" && <span style={{ fontSize: 11, background: "#ef4444", color: T.white, padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>CRÍTICO</span>}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.7, color: "#d1d5db" }}>{renderTextWithKeywords(block.content, keywords)}</div>
    </div>
  );
}

function StagesBlock({ block, keywords }) {
  return (
    <div>
      <h3 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: T.darkTeal, marginBottom: 16, marginTop: 0 }}>{block.title}</h3>
      <div style={{ position: "relative", paddingLeft: 36 }}>
        <div style={{ position: "absolute", left: 15, top: 8, bottom: 8, width: 2, background: `linear-gradient(to bottom, ${T.tealAccent}, ${T.severity.critical || T.tealAccent})` }} />
        {block.items.map((item, i) => {
          const sevColor = item.severity ? T.severity[item.severity] : T.tealAccent;
          return (
            <div key={i} style={{ position: "relative", marginBottom: i < block.items.length - 1 ? 20 : 0 }}>
              <div style={{ position: "absolute", left: -36 + 6, top: 2, width: 20, height: 20, borderRadius: "50%", background: sevColor, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{item.stage}</div>
              <div style={{ background: T.white, borderRadius: 10, padding: "12px 16px", border: `1px solid ${T.border}`, borderLeft: `3px solid ${sevColor}` }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: T.darkTeal, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.6 }}>{renderTextWithKeywords(item.content, keywords)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ComparisonBlock({ block }) {
  return (
    <div>
      <h3 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: T.darkTeal, marginBottom: 12, marginTop: 0 }}>{block.title}</h3>
      <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${T.border}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>{block.headers.map((h, i) => (
              <th key={i} style={{ background: T.darkTeal, color: block.highlight_column === i ? T.tealAccent : T.white, padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? T.white : T.pageBg }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: "10px 14px", borderTop: `1px solid ${T.border}`, color: ci === 0 ? T.darkTeal : T.textSecondary, fontWeight: ci === 0 ? 600 : 400, background: block.highlight_column === ci ? "rgba(42,140,122,0.06)" : "transparent" }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ListDetailBlock({ block, keywords }) {
  return (
    <div>
      <h3 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: T.darkTeal, marginBottom: 6, marginTop: 0 }}>{block.title}</h3>
      {block.intro && <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.6, marginBottom: 12, marginTop: 4 }}>{block.intro}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {block.items.map((item, i) => {
          const sevColor = item.severity === "high" ? T.severity.critical : item.severity === "medium" ? T.severity.moderate : T.tealAccent;
          return (
            <div key={i} style={{ display: "flex", gap: 12, padding: "10px 14px", background: T.white, borderRadius: 10, border: `1px solid ${T.border}`, alignItems: "flex-start" }}>
              <div style={{ minWidth: 32, height: 32, borderRadius: 8, background: T.teal50, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconByName name={item.icon} size={16} color={T.tealAccent} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: T.darkTeal }}>{item.label}</span>
                  {item.severity && <span style={{ width: 8, height: 8, borderRadius: "50%", background: sevColor }} />}
                </div>
                <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.5, marginTop: 2 }}>{renderTextWithKeywords(item.detail, keywords)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GridBlock({ block }) {
  const cols = block.columns || 2;
  return (
    <div>
      <h3 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: T.darkTeal, marginBottom: 12, marginTop: 0 }}>{block.title}</h3>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
        {block.items.map((item, i) => (
          <div key={i} style={{ background: T.white, borderRadius: 10, padding: "14px 16px", border: `1px solid ${T.border}`, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ minWidth: 28, height: 28, borderRadius: 8, background: T.teal50, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconByName name={item.icon} size={14} color={T.tealAccent} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.darkTeal }}>{item.label}</div>
              <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>{item.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TwoColumnBlock({ block, keywords }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {block.columns.map((col, ci) => (
        <div key={ci} style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          <div style={{ background: ci === 0 ? T.tealAccent : T.darkTeal, padding: "10px 16px" }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: T.white }}>{col.title}</span>
          </div>
          <div style={{ padding: 14 }}>
            {col.items && col.items.map((item, i) => (
              <div key={i} style={{ padding: "6px 0", borderBottom: i < col.items.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: T.darkTeal }}>{item.label}</div>
                <div style={{ fontSize: 12, color: T.textSecondary }}>{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CalloutBlock({ block }) {
  const v = T.callout[block.variant] || T.callout.tip;
  const Icon = v.icon;
  return (
    <div style={{ background: v.bg, borderRadius: 12, padding: "16px 20px", borderLeft: `4px solid ${v.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Icon size={18} color={v.border} />
        <span style={{ fontSize: 12, fontWeight: 700, color: v.border, textTransform: "uppercase", letterSpacing: "0.05em" }}>{v.label}</span>
      </div>
      <div style={{ fontWeight: 600, fontSize: 15, color: T.darkTeal, marginBottom: 6, fontFamily: "Georgia, serif" }}>{block.title}</div>
      <div style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.65, whiteSpace: "pre-line" }}>{block.content}</div>
    </div>
  );
}

function ImageReferenceBlock({ block }) {
  return (
    <div style={{ background: T.pageBg, borderRadius: 12, padding: 20, border: `2px dashed ${T.border}`, textAlign: "center" }}>
      {block.image_url ? (
        <img src={block.image_url} alt={block.caption} style={{ maxWidth: "100%", borderRadius: 8 }} />
      ) : (
        <div style={{ padding: "30px 20px" }}>
          <FileText size={32} color={T.textTertiary} style={{ margin: "0 auto 10px", display: "block" }} />
          <div style={{ fontSize: 13, color: T.textTertiary, marginBottom: 6 }}>{block.description}</div>
          <button style={{ background: T.tealAccent, color: T.white, border: "none", padding: "8px 20px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Agregar Imagen</button>
        </div>
      )}
      {block.caption && <div style={{ fontSize: 12, color: T.textTertiary, marginTop: 8, fontStyle: "italic" }}>{block.caption}</div>}
    </div>
  );
}

function SectionDividerBlock({ block }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 0" }}>
      <div style={{ flex: 1, height: 2, background: T.teal100 }} />
      {block.label && <span style={{ fontSize: 13, color: T.tealAccent, fontWeight: 600, whiteSpace: "nowrap", fontFamily: "Georgia, serif" }}>{block.label}</span>}
      <div style={{ flex: 1, height: 2, background: T.teal100 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BLOCK IMAGE — renders alongside block content
   ═══════════════════════════════════════════════════ */
const IMAGE_SIZES = {
  small:  { width: 140, label: "S", pct: "~20%" },
  medium: { width: 220, label: "M", pct: "~30%" },
  large:  { width: 320, label: "L", pct: "~45%" },
};

function BlockImage({ image, isEditing, onChangePosition, onChangeSize, onRemoveImage }) {
  if (!image) return null;
  const pos = image.position || "right";
  const size = image.size || "medium";
  const sizeConfig = IMAGE_SIZES[size] || IMAGE_SIZES.medium;

  return (
    <div style={{
      width: sizeConfig.width, minWidth: sizeConfig.width, flexShrink: 0,
      display: "flex", flexDirection: "column", gap: 6,
      transition: "width 0.3s ease, min-width 0.3s ease",
    }}>
      {image.url ? (
        <img src={image.url} alt={image.caption || ""} style={{ width: "100%", borderRadius: 10, objectFit: "cover", border: `1px solid ${T.border}` }} />
      ) : (
        <div style={{ width: "100%", aspectRatio: size === "small" ? "1/1" : "4/3", borderRadius: 10, border: `2px dashed ${T.border}`, background: T.pageBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", transition: "aspect-ratio 0.3s ease" }}
          title={image.description || "Agregar imagen"}>
          <Image size={size === "small" ? 18 : 24} color={T.textTertiary} />
          <span style={{ fontSize: 11, color: T.textTertiary, textAlign: "center", padding: "0 8px", lineHeight: 1.3 }}>
            {size === "small" ? "+" : (image.description || "Agregar imagen")}
          </span>
          {isEditing && size !== "small" && (
            <button style={{ background: T.tealAccent, color: T.white, border: "none", padding: "4px 12px", borderRadius: 14, fontSize: 11, fontWeight: 600, cursor: "pointer", marginTop: 2 }}>
              + Imagen
            </button>
          )}
        </div>
      )}
      {image.caption && (
        <div style={{ fontSize: 11, color: T.textTertiary, fontStyle: "italic", textAlign: "center", lineHeight: 1.3 }}>{image.caption}</div>
      )}
      {isEditing && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Size selector */}
          <div style={{ display: "flex", gap: 2, justifyContent: "center", background: T.pageBg, borderRadius: 6, padding: 2 }}>
            {Object.entries(IMAGE_SIZES).map(([key, cfg]) => (
              <button key={key} onClick={() => onChangeSize(key)}
                style={{
                  flex: 1, padding: "3px 0", border: "none", borderRadius: 4, cursor: "pointer",
                  fontSize: 10, fontWeight: 700, transition: "all 0.15s",
                  background: size === key ? T.tealAccent : "transparent",
                  color: size === key ? T.white : T.textTertiary,
                }}>
                {cfg.label}
              </button>
            ))}
          </div>
          {/* Position + remove */}
          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
            <button onClick={() => onChangePosition(pos === "left" ? "right" : "left")}
              title={pos === "left" ? "Mover a la derecha" : "Mover a la izquierda"}
              style={{ background: T.teal50, border: "none", padding: "4px 8px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.tealAccent, fontWeight: 600 }}>
              {pos === "left" ? <PanelRightOpen size={12} /> : <PanelLeftOpen size={12} />}
              {pos === "left" ? "→ Der" : "← Izq"}
            </button>
            <button onClick={onRemoveImage}
              title="Quitar imagen"
              style={{ background: "#fef2f2", border: "none", padding: "4px 8px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#ef4444", fontWeight: 600 }}>
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BLOCK WRAPPER — mastery color + editor controls
   ═══════════════════════════════════════════════════ */
function BlockWrapper({ block, index, total, isEditing, masteryLevel, showMastery, onDelete, onDuplicate, onMoveUp, onMoveDown, onGenerateQuiz, onUpdateBlockImage, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [quizState, setQuizState] = useState(null); // null | 'generating' | 'done'
  const mastery = showMastery ? getMasteryStyle(masteryLevel) : null;

  // Blocks that already have their own visual container (no extra wrapper needed in student mode)
  const selfStyledBlocks = ["key_point", "callout", "comparison", "image_reference", "section_divider"];
  const isSelfStyled = selfStyledBlocks.includes(block.type);

  const hasImage = block.image && block.type !== "image_reference";
  const imagePos = block.image?.position || "right";

  return (
    <div style={{ position: "relative", display: "flex", gap: 0, transition: "all 0.2s", marginBottom: isEditing ? 0 : (isSelfStyled ? 16 : 6) }}>
      {/* Mastery indicator bar — editor: full bar with % badge. Student: no separate bar (color via block border-left) */}
      {mastery && isEditing && (
        <div style={{ width: 4, borderRadius: 4, background: mastery.border, marginRight: 12, flexShrink: 0, position: "relative" }} title={mastery.label}>
          <div style={{ position: "absolute", top: 8, left: -28, width: 24, height: 24, borderRadius: "50%", background: mastery.bg, border: `2px solid ${mastery.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: mastery.text }}>{Math.round(masteryLevel * 100)}%</span>
          </div>
        </div>
      )}

      {/* Editor drag handle */}
      {isEditing && (
        <div style={{ width: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "grab", color: T.textTertiary, flexShrink: 0, opacity: 0.5, marginRight: 4 }}>
          <GripVertical size={18} />
        </div>
      )}

      {/* Block content */}
      <div style={{
        flex: 1, position: "relative", transition: "background 0.3s, border-color 0.3s",
        // Editor mode: card with border/shadow. Student mode: seamless document flow
        ...(isEditing ? {
          background: mastery ? mastery.bg : T.white, borderRadius: 16, padding: "20px 24px",
          border: `1px solid ${mastery ? mastery.border + "40" : T.border}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        } : {
          // Student mode: transparent flow, mastery shown as subtle left border only
          background: mastery && !isSelfStyled ? mastery.bg + "60" : "transparent",
          borderRadius: isSelfStyled ? 0 : 0,
          padding: isSelfStyled ? "0" : "2px 0",
          border: "none", boxShadow: "none",
          borderLeft: mastery && !isSelfStyled ? `3px solid ${mastery.border}50` : "none",
          paddingLeft: mastery && !isSelfStyled ? 16 : 0,
        }),
      }}>
        {/* Editor toolbar */}
        {isEditing && (
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 2 }}>
            <button onClick={() => onGenerateQuiz(block.id)} title="Generar Quiz"
              style={{ background: "none", border: "none", padding: 4, cursor: "pointer", borderRadius: 6, color: T.textTertiary, display: "flex" }}
              onMouseEnter={e => { e.target.style.background = T.teal50; e.target.style.color = T.tealAccent; }}
              onMouseLeave={e => { e.target.style.background = "none"; e.target.style.color = T.textTertiary; }}>
              <HelpCircle size={16} />
            </button>
            <button title="IA Transform"
              style={{ background: "none", border: "none", padding: 4, cursor: "pointer", borderRadius: 6, color: T.textTertiary, display: "flex" }}
              onMouseEnter={e => { e.target.style.background = "#f5f3ff"; e.target.style.color = "#8b5cf6"; }}
              onMouseLeave={e => { e.target.style.background = "none"; e.target.style.color = T.textTertiary; }}>
              <Sparkles size={16} />
            </button>
            <div style={{ position: "relative" }}>
              <button onClick={() => setMenuOpen(!menuOpen)} title="Opciones"
                style={{ background: menuOpen ? T.pageBg : "none", border: "none", padding: 4, cursor: "pointer", borderRadius: 6, color: T.textTertiary, display: "flex" }}>
                <ChevronDown size={16} />
              </button>
              {menuOpen && (
                <div style={{ position: "absolute", top: "100%", right: 0, background: T.white, borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", padding: 4, zIndex: 50, minWidth: 160, border: `1px solid ${T.border}` }}>
                  {[
                    { icon: Copy, label: "Duplicar", action: () => { onDuplicate(block.id); setMenuOpen(false); } },
                    index > 0 && { icon: ChevronDown, label: "Mover arriba", action: () => { onMoveUp(index); setMenuOpen(false); }, rotate: true },
                    index < total - 1 && { icon: ChevronDown, label: "Mover abajo", action: () => { onMoveDown(index); setMenuOpen(false); } },
                    { icon: RotateCcw, label: "Regenerar con IA", action: () => setMenuOpen(false) },
                    { icon: Trash2, label: "Eliminar", action: () => { onDelete(block.id); setMenuOpen(false); }, danger: true },
                  ].filter(Boolean).map((item, i) => (
                    <button key={i} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", border: "none", background: "none", cursor: "pointer", borderRadius: 6, fontSize: 13, color: item.danger ? "#ef4444" : T.textPrimary, textAlign: "left" }}
                      onMouseEnter={e => e.target.style.background = item.danger ? "#fef2f2" : T.pageBg}
                      onMouseLeave={e => e.target.style.background = "none"}>
                      <item.icon size={14} style={item.rotate ? { transform: "rotate(180deg)" } : {}} />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Block type label in editor mode */}
        {isEditing && (
          <div style={{ fontSize: 10, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{block.type.replace("_", " ")}</span>
            {/* Add/toggle image button in editor */}
            {!hasImage && block.type !== "image_reference" && block.type !== "section_divider" && (
              <button onClick={() => onUpdateBlockImage(block.id, { url: null, position: "right", caption: "", description: "Agregar imagen al bloque" })}
                title="Agregar imagen al bloque"
                style={{ background: "none", border: `1px dashed ${T.textTertiary}`, padding: "2px 8px", borderRadius: 6, cursor: "pointer", fontSize: 10, color: T.textTertiary, display: "flex", alignItems: "center", gap: 4 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.tealAccent; e.currentTarget.style.color = T.tealAccent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.textTertiary; e.currentTarget.style.color = T.textTertiary; }}>
                <Image size={10} /> + Imagen
              </button>
            )}
          </div>
        )}

        {/* Content + optional side image */}
        {hasImage ? (
          <div style={{ display: "flex", gap: 16, flexDirection: imagePos === "left" ? "row-reverse" : "row", alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
            <BlockImage
              image={block.image}
              isEditing={isEditing}
              onChangePosition={(newPos) => onUpdateBlockImage(block.id, { ...block.image, position: newPos })}
              onChangeSize={(newSize) => onUpdateBlockImage(block.id, { ...block.image, size: newSize })}
              onRemoveImage={() => onUpdateBlockImage(block.id, null)}
            />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   INSERT BLOCK BUTTON (+ between blocks)
   ═══════════════════════════════════════════════════ */
function InsertBlockButton({ onInsert, isEditing }) {
  const [open, setOpen] = useState(false);
  if (!isEditing) return null;
  const types = [
    { type: "prose", icon: FileText, label: "Texto / Prosa" },
    { type: "key_point", icon: Zap, label: "Concepto Clave" },
    { type: "stages", icon: ArrowRight, label: "Etapas / Proceso" },
    { type: "comparison", icon: Table, label: "Tabla Comparativa" },
    { type: "list_detail", icon: List, label: "Lista Detallada" },
    { type: "grid", icon: LayoutGrid, label: "Grid" },
    { type: "two_column", icon: Columns2, label: "Dos Columnas" },
    { type: "callout", icon: AlertTriangle, label: "Callout / Nota" },
    { type: "image_reference", icon: FileText, label: "Imagen" },
    { type: "section_divider", icon: Minus, label: "Separador" },
  ];
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4px 0", position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ width: 28, height: 28, borderRadius: "50%", border: `2px dashed ${open ? T.tealAccent : T.border}`, background: open ? T.teal50 : "transparent", color: open ? T.tealAccent : T.textTertiary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
        onMouseEnter={e => { if (!open) { e.target.style.borderColor = T.tealAccent; e.target.style.color = T.tealAccent; }}}
        onMouseLeave={e => { if (!open) { e.target.style.borderColor = T.border; e.target.style.color = T.textTertiary; }}}>
        <Plus size={14} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", background: T.white, borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", padding: 8, zIndex: 50, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, minWidth: 280, border: `1px solid ${T.border}` }}>
          {types.map(t => (
            <button key={t.type} onClick={() => { onInsert(t.type); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "none", background: "none", cursor: "pointer", borderRadius: 8, fontSize: 12, color: T.textPrimary, textAlign: "left", whiteSpace: "nowrap" }}
              onMouseEnter={e => e.target.style.background = T.teal50}
              onMouseLeave={e => e.target.style.background = "none"}>
              <t.icon size={14} color={T.tealAccent} /> {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   QUIZ MODAL (per-block quiz simulation)
   ═══════════════════════════════════════════════════ */
function QuizModal({ block, onClose, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const correct = 2; // simulated correct answer index
  const question = {
    text: `Sobre "${block.title || block.type}": ¿Cuál es la principal característica de la aterosclerosis?`,
    options: [
      "Es una enfermedad exclusivamente genética",
      "Es un depósito pasivo de grasa en las arterias",
      "Es un proceso inflamatorio crónico de las arterias",
      "Afecta solo a las venas de gran calibre",
    ],
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.white, borderRadius: 16, padding: 28, maxWidth: 520, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <HelpCircle size={20} color={T.tealAccent} />
            <span style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: T.darkTeal }}>Quiz del Bloque</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textTertiary }}><X size={20} /></button>
        </div>
        <div style={{ fontSize: 10, background: T.teal50, color: T.tealAccent, padding: "4px 10px", borderRadius: 10, display: "inline-block", marginBottom: 12, fontWeight: 600 }}>
          Generado por IA desde este bloque
        </div>
        <p style={{ fontSize: 15, color: T.textPrimary, lineHeight: 1.6, marginBottom: 16 }}>{question.text}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {question.options.map((opt, i) => {
            let bg = T.white, borderColor = T.border, textColor = T.textPrimary;
            if (answered) {
              if (i === correct) { bg = "#f0fdf4"; borderColor = "#10b981"; textColor = "#059669"; }
              else if (i === selected && i !== correct) { bg = "#fef2f2"; borderColor = "#ef4444"; textColor = "#dc2626"; }
            } else if (i === selected) { bg = T.teal50; borderColor = T.tealAccent; }
            return (
              <button key={i} onClick={() => { if (!answered) setSelected(i); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", border: `2px solid ${borderColor}`, borderRadius: 10, background: bg, cursor: answered ? "default" : "pointer", textAlign: "left", fontSize: 14, color: textColor, transition: "all 0.15s" }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, background: answered && i === correct ? "#10b981" : answered && i === selected ? "#ef4444" : "transparent", color: answered && (i === correct || i === selected) ? T.white : textColor }}>
                  {answered ? (i === correct ? <Check size={14} /> : i === selected ? <X size={14} /> : String.fromCharCode(65 + i)) : String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
        {!answered && selected !== null && (
          <button onClick={() => { setAnswered(true); onAnswer(selected === correct); }}
            style={{ marginTop: 16, width: "100%", padding: "12px", background: T.tealAccent, color: T.white, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            Confirmar Respuesta
          </button>
        )}
        {answered && (
          <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: selected === correct ? "#f0fdf4" : "#fef2f2", border: `1px solid ${selected === correct ? "#10b981" : "#ef4444"}` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: selected === correct ? "#059669" : "#dc2626", marginBottom: 4 }}>
              {selected === correct ? "¡Correcto!" : "Incorrecto"}
            </div>
            <div style={{ fontSize: 13, color: T.textSecondary }}>
              La aterosclerosis es un proceso inflamatorio crónico activo, no un simple depósito de grasa.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════ */
export default function AxonSummaryPrototype() {
  const [blocks, setBlocks] = useState(INITIAL_BLOCKS);
  const [isEditing, setIsEditing] = useState(false);
  const [showMastery, setShowMastery] = useState(true);
  const [quizBlock, setQuizBlock] = useState(null);
  const [blockMastery, setBlockMastery] = useState(BLOCK_MASTERY);

  const deleteBlock = (id) => setBlocks(b => b.filter(x => x.id !== id));
  const duplicateBlock = (id) => {
    const idx = blocks.findIndex(x => x.id === id);
    const dup = { ...blocks[idx], id: `dup_${Date.now()}` };
    const nb = [...blocks]; nb.splice(idx + 1, 0, dup); setBlocks(nb);
  };
  const updateBlockImage = (id, imageData) => {
    setBlocks(b => b.map(block => block.id === id ? { ...block, image: imageData || undefined } : block));
  };
  const moveUp = (i) => { if (i === 0) return; const nb = [...blocks]; [nb[i - 1], nb[i]] = [nb[i], nb[i - 1]]; setBlocks(nb); };
  const moveDown = (i) => { if (i >= blocks.length - 1) return; const nb = [...blocks]; [nb[i], nb[i + 1]] = [nb[i + 1], nb[i]]; setBlocks(nb); };
  const insertBlock = (afterIndex, type) => {
    const newBlock = { id: `new_${Date.now()}`, type, title: `Nuevo bloque ${type}`, content: type === "prose" ? "Escribe aquí el contenido..." : "" };
    if (type === "stages") newBlock.items = [{ stage: 1, title: "Paso 1", content: "Descripción...", severity: null }];
    if (type === "comparison") { newBlock.headers = ["Col 1", "Col 2"]; newBlock.rows = [["—", "—"]]; }
    if (type === "list_detail") { newBlock.items = [{ label: "Item", detail: "Detalle...", icon: "CircleDot" }]; newBlock.intro = null; }
    if (type === "grid") { newBlock.columns = 2; newBlock.items = [{ label: "Item", detail: "Detalle", icon: "CircleDot" }]; }
    if (type === "two_column") { newBlock.columns = [{ title: "Columna A", content_type: "list_detail", items: [{ label: "Item", detail: "Detalle" }] }, { title: "Columna B", content_type: "list_detail", items: [{ label: "Item", detail: "Detalle" }] }]; }
    if (type === "callout") { newBlock.variant = "tip"; }
    if (type === "key_point") { newBlock.importance = "high"; }
    if (type === "image_reference") { newBlock.description = "Describe qué imagen agregar"; newBlock.caption = ""; newBlock.image_url = null; }
    if (type === "section_divider") { newBlock.label = "Nueva Sección"; }
    const nb = [...blocks]; nb.splice(afterIndex + 1, 0, newBlock); setBlocks(nb);
  };

  const handleQuizAnswer = (blockId, correct) => {
    // simulate mastery change
    setBlockMastery(prev => {
      const current = prev[blockId] || 0.5;
      return { ...prev, [blockId]: correct ? Math.min(current + 0.15, 1.3) : Math.max(current - 0.1, 0.2) };
    });
  };

  const renderBlock = (block) => {
    switch (block.type) {
      case "prose": return <ProseBlock block={block} keywords={SAMPLE_KEYWORDS} />;
      case "key_point": return <KeyPointBlock block={block} keywords={SAMPLE_KEYWORDS} />;
      case "stages": return <StagesBlock block={block} keywords={SAMPLE_KEYWORDS} />;
      case "comparison": return <ComparisonBlock block={block} />;
      case "list_detail": return <ListDetailBlock block={block} keywords={SAMPLE_KEYWORDS} />;
      case "grid": return <GridBlock block={block} />;
      case "two_column": return <TwoColumnBlock block={block} keywords={SAMPLE_KEYWORDS} />;
      case "callout": return <CalloutBlock block={block} />;
      case "image_reference": return <ImageReferenceBlock block={block} />;
      case "section_divider": return <SectionDividerBlock block={block} />;
      default: return <div>Tipo desconocido: {block.type}</div>;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.pageBg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ background: T.darkTeal, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: T.tealAccent, fontFamily: "Space Grotesk, sans-serif" }}>AXON</span>
          <span style={{ color: "#8FBFB3", fontSize: 13 }}>Prototipo de Resúmenes</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setShowMastery(!showMastery)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, border: `1px solid ${showMastery ? T.tealAccent : "#4a6b65"}`, background: showMastery ? "rgba(42,140,122,0.15)" : "transparent", color: showMastery ? T.tealAccent : "#8FBFB3", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Activity size={14} /> Mastery {showMastery ? "ON" : "OFF"}
          </button>
          <button onClick={() => setIsEditing(!isEditing)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, border: "none", background: isEditing ? T.tealAccent : "rgba(255,255,255,0.1)", color: T.white, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {isEditing ? <><Eye size={14} /> Vista Alumno</> : <><Edit3 size={14} /> Modo Editor</>}
          </button>
        </div>
      </div>

      {/* Summary Header */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, background: T.teal50, color: T.tealAccent, padding: "3px 10px", borderRadius: 10, fontWeight: 600 }}>Cardiología</span>
          <span style={{ fontSize: 11, background: "#fef2f2", color: "#ef4444", padding: "3px 10px", borderRadius: 10, fontWeight: 600 }}>Alta relevancia</span>
          <span style={{ fontSize: 11, background: T.pageBg, color: T.textTertiary, padding: "3px 10px", borderRadius: 10, border: `1px solid ${T.border}` }}>~15 min lectura</span>
          <span style={{ fontSize: 11, background: "#fffbeb", color: "#d97706", padding: "3px 10px", borderRadius: 10, fontWeight: 600 }}>Intermedio</span>
        </div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 700, color: T.darkTeal, margin: "0 0 6px", lineHeight: 1.2 }}>Aterosclerosis</h1>
        <p style={{ fontSize: 15, color: T.textSecondary, margin: "0 0 8px" }}>Enfermedad inflamatoria crónica de las arterias — fisiopatología, diagnóstico diferencial y manejo terapéutico</p>
        <div style={{ fontSize: 12, color: T.textTertiary, marginBottom: 8 }}>Generado por IA · Revisado por Dr. García · v1.0 · {blocks.length} bloques · {Object.keys(SAMPLE_KEYWORDS).length} keywords</div>

        {/* Mastery legend */}
        {showMastery && (
          <div style={{ display: "flex", gap: 10, padding: "10px 14px", background: T.white, borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: 0, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: T.textTertiary, fontWeight: 600, marginRight: 4 }}>Tu dominio:</span>
            {[T.masteryGray, T.masteryRed, T.masteryYellow, T.masteryGreen, T.masteryBlue].map((m, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: m.border }} />
                <span style={{ color: m.text, fontWeight: 600 }}>{m.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Blocks */}
      <div style={{
        maxWidth: 800, margin: "0 auto", padding: isEditing ? "20px 20px 60px" : "0 20px 60px",
        // Student mode: white document-like container for seamless flow
        ...(isEditing ? {} : {
          background: T.white, borderRadius: 20, padding: "32px 36px 48px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginTop: 16,
          border: `1px solid ${T.border}`,
        }),
      }}>
        {isEditing && <InsertBlockButton onInsert={(type) => insertBlock(-1, type)} isEditing={isEditing} />}

        {blocks.map((block, i) => (
          <div key={block.id}>
            <BlockWrapper
              block={block} index={i} total={blocks.length}
              isEditing={isEditing}
              masteryLevel={blockMastery[block.id] || 0.5}
              showMastery={showMastery}
              onDelete={deleteBlock} onDuplicate={duplicateBlock}
              onMoveUp={moveUp} onMoveDown={moveDown}
              onGenerateQuiz={(id) => setQuizBlock(blocks.find(b => b.id === id))}
              onUpdateBlockImage={updateBlockImage}
            >
              {renderBlock(block)}
            </BlockWrapper>

            {isEditing && <InsertBlockButton onInsert={(type) => insertBlock(i, type)} isEditing={isEditing} />}
          </div>
        ))}
      </div>

      {/* Quiz Modal */}
      {quizBlock && (
        <QuizModal block={quizBlock} onClose={() => setQuizBlock(null)} onAnswer={(correct) => handleQuizAnswer(quizBlock.id, correct)} />
      )}
    </div>
  );
}
