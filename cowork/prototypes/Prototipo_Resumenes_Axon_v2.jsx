import { useState, useCallback, useRef, useEffect } from "react";
import { GripVertical, Plus, Trash2, Copy, ChevronDown, Sparkles, List, Table, Columns2, AlertTriangle, BookOpen, Brain, CircleDot, LayoutGrid, FileText, Minus, Eye, Edit3, Zap, X, Check, HelpCircle, ArrowRight, Activity, Heart, Pill, Stethoscope, Shield, FlaskConical, Clock, Lightbulb, Target, AlertCircle, Info, CheckCircle2, RotateCcw, MessageSquare } from "lucide-react";

/* ═══════════════════════════════════════════════════
   KEYFRAMES & CSS
   ═══════════════════════════════════════════════════ */
const KEYFRAMES = `
@keyframes breathe { 0%,100% { opacity:0.7 } 50% { opacity:1 } }
@keyframes fadeSlideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
@keyframes confetti { 0% { transform:translateY(0) rotate(0); opacity:1 } 100% { transform:translateY(-80px) rotate(360deg); opacity:0 } }
@keyframes countUp { from { opacity:0; transform:scale(0.8) } to { opacity:1; transform:scale(1) } }
@keyframes progressRing { from { stroke-dashoffset:94.25 } to { stroke-dashoffset:0 } }
@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
@keyframes skeletonShimmer { 0% { background-position:-200% 0 } 100% { background-position:200% 0 } }
@keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
@keyframes dotPulse { 0%,80%,100% { opacity:0 } 40% { opacity:1 } }

/* === LIQUID GLASS MOTION === */
@keyframes liquidBounceIn { 0% { transform:scale(0.92); opacity:0.6 } 50% { transform:scale(1.04) } 75% { transform:scale(0.98) } 100% { transform:scale(1); opacity:1 } }
@keyframes liquidRipple { 0% { transform:scale(0); opacity:0.5 } 100% { transform:scale(2.5); opacity:0 } }
@keyframes liquidMorph { 0% { border-radius:12px } 25% { border-radius:14px 10px 16px 10px } 50% { border-radius:10px 16px 10px 14px } 75% { border-radius:16px 10px 14px 12px } 100% { border-radius:12px } }
@keyframes liquidFloat { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-3px) } }
@keyframes liquidPop { 0% { transform:scale(1) } 40% { transform:scale(1.12) } 70% { transform:scale(0.95) } 100% { transform:scale(1) } }
@keyframes liquidSlideUp { 0% { opacity:0; transform:translateY(16px) scale(0.96) } 60% { opacity:1; transform:translateY(-4px) scale(1.01) } 100% { transform:translateY(0) scale(1) } }

.axon-breathe { animation: breathe 2s ease-in-out infinite; }
.axon-fade-slide { animation: fadeSlideUp 400ms ease-out forwards; }
.axon-confetti { animation: confetti 600ms ease-out forwards; }
.axon-count-up { animation: countUp 300ms ease-out; }
.axon-pulse { animation: pulse 1s ease-in-out infinite; }
.axon-skeleton-shimmer { animation: skeletonShimmer 2s infinite; }
.axon-blink { animation: blink 600ms steps(1) infinite; }

/* Liquid motion utility classes */
.axon-liquid-bounce { animation: liquidBounceIn 500ms cubic-bezier(0.34,1.56,0.64,1) forwards; }
.axon-liquid-morph { animation: liquidMorph 6s ease-in-out infinite; }
.axon-liquid-float { animation: liquidFloat 3s ease-in-out infinite; }
.axon-liquid-pop { animation: liquidPop 400ms cubic-bezier(0.34,1.56,0.64,1); }
.axon-liquid-slide { animation: liquidSlideUp 450ms cubic-bezier(0.34,1.56,0.64,1) forwards; }

/* Spring transition for all interactive elements */
.axon-spring { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease; }
.axon-spring:hover { transform: translateY(-2px) scale(1.02); }
.axon-spring:active { transform: translateY(0) scale(0.97); }
`;

/* ═══════════════════════════════════════════════════
   AXON DESIGN TOKENS
   ═══════════════════════════════════════════════════ */
const T = {
  darkTeal: "#1B3B36", tealAccent: "#2a8c7a", teal50: "#e8f5f1", teal100: "#d1f0e7",
  pageBg: "#F0F2F5", white: "#FFFFFF", border: "#E5E7EB",
  textPrimary: "#111827", textSecondary: "#6b7280", textTertiary: "#9CA3AF",
  masteryGray: { bg: "#f4f4f5", border: "#a1a1aa", text: "#71717a", label: "Por descubrir" },
  masteryRed: { bg: "#fef2f2", border: "#ef4444", text: "#dc2626", label: "Emergente" },
  masteryYellow: { bg: "#fffbeb", border: "#f59e0b", text: "#d97706", label: "En progreso" },
  masteryGreen: { bg: "#f0fdf4", border: "#10b981", text: "#059669", label: "Consolidado" },
  masteryBlue: { bg: "#eff6ff", border: "#3b82f6", text: "#2563eb", label: "Maestría" },
  callout: {
    tip: { bg: "#f0fdf4", border: "#10b981", icon: Lightbulb, label: "Tip" },
    warning: { bg: "#fffbeb", border: "#f59e0b", icon: AlertTriangle, label: "Atención" },
    clinical: { bg: "#eff6ff", border: "#3b82f6", icon: Stethoscope, label: "Correlación Clínica" },
    mnemonic: { bg: "#f5f3ff", border: "#8b5cf6", icon: Brain, label: "Mnemotecnia" },
    exam: { bg: "#fef2f2", border: "#ef4444", icon: Target, label: "Importante para Examen" },
  },
  severity: { mild: "#10b981", moderate: "#f59e0b", critical: "#ef4444" },
};

/* ═══════════════════════════════════════════════════
   LIQUID MOTION HOOKS
   ═══════════════════════════════════════════════════ */
function useLiquidTilt(intensity = 8) {
  const ref = useRef(null);
  const [style, setStyle] = useState({ transform: "perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)", transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)" });

  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setStyle({
      transform: `perspective(600px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale(1.015)`,
      transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)",
    });
  }, [intensity]);

  const handleMouseLeave = useCallback(() => {
    setStyle({
      transform: "perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)",
      transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
    });
  }, []);

  return { ref, style, handleMouseMove, handleMouseLeave };
}

function useRipple() {
  const [ripples, setRipples] = useState([]);

  const addRipple = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
  }, []);

  const rippleElements = ripples.map(r => (
    <span key={r.id} style={{
      position: "absolute", left: r.x, top: r.y, width: 20, height: 20,
      marginLeft: -10, marginTop: -10, borderRadius: "50%",
      background: "rgba(42,140,122,0.25)", pointerEvents: "none",
      animation: "liquidRipple 600ms cubic-bezier(0.34,1.56,0.64,1) forwards",
    }} />
  ));

  return { addRipple, rippleElements };
}

function getMasteryStyle(level) {
  if (level >= 1.1) return T.masteryBlue;
  if (level >= 1.0) return T.masteryGreen;
  if (level >= 0.85) return T.masteryYellow;
  if (level >= 0.5) return T.masteryRed;
  return T.masteryGray;
}

function getMasteryColor(level) {
  const style = getMasteryStyle(level);
  return style.border;
}

/* ═══════════════════════════════════════════════════
   SAMPLE DATA — Aterosclerosis (with mastery field)
   ═══════════════════════════════════════════════════ */
const SAMPLE_KEYWORDS = {
  aterosclerosis: { term: "Aterosclerosis", definition: "Enfermedad inflamatoria crónica de las arterias caracterizada por la acumulación de lípidos, células inflamatorias y tejido fibroso en la pared arterial, formando placas ateromatosas.", related: ["Placa ateromatosa", "Endotelio", "LDL oxidado"], mastered: true },
  endotelio: { term: "Endotelio", definition: "Capa unicelular que reviste el interior de los vasos sanguíneos. Regula el tono vascular, la coagulación y la respuesta inflamatoria.", related: ["Óxido nítrico", "Disfunción endotelial"], mastered: false },
  ldl: { term: "LDL oxidado", definition: "Lipoproteína de baja densidad que ha sufrido oxidación. Es el principal iniciador de la respuesta inflamatoria en la pared arterial.", related: ["Colesterol", "Macrófagos", "Células espumosas"], mastered: true },
  macrofagos: { term: "Macrófagos", definition: "Células del sistema inmune que migran al subendotelio y fagocitan LDL oxidado, transformándose en células espumosas. Son componentes centrales de la placa ateromatosa.", related: ["Células espumosas", "Inflamación"], mastered: false },
  estatinas: { term: "Estatinas", definition: "Grupo farmacológico que inhibe la HMG-CoA reductasa, reduciendo la síntesis hepática de colesterol. Primera línea en el tratamiento de la hipercolesterolemia.", related: ["HMG-CoA reductasa", "LDL", "Colesterol"], mastered: true },
  trombosis: { term: "Trombosis", definition: "Formación de un coágulo (trombo) dentro de un vaso sanguíneo. Complicación aguda de la ruptura de placa ateromatosa, puede causar infarto o ACV.", related: ["Plaquetas", "Fibrina", "IAM"], mastered: false },
};

const BLOCK_MASTERY = { b1: 0.4, b2: 1.15, b3: 0.9, b4: 0.6, b5: 1.05, b6: 0.3, b7: 0.88, b8: 1.0, b9: 0.7, b10: 0.95, b11: 0.5, b12: 1.2 };

const BLOCK_AI_CONFIDENCE = {
  b1: "alta", b2: "media", b3: "alta", b4: "revisar", b5: "alta", b6: "media",
  b7: "alta", b8: "revisar", b9: "media", b10: "alta", b11: "alta", b12: "revisar",
};

const INITIAL_BLOCKS = [
  { id: "b1", type: "prose", title: "Definición y Concepto General", content: "La {{aterosclerosis}} es una enfermedad inflamatoria crónica de las arterias de mediano y gran calibre. Se caracteriza por la acumulación progresiva de lípidos, células inflamatorias y tejido fibroso en la íntima de la pared arterial, formando lesiones conocidas como placas ateromatosas.\n\nEs la principal causa de enfermedad cardiovascular a nivel mundial, incluyendo infarto agudo de miocardio, accidente cerebrovascular y enfermedad arterial periférica. Su desarrollo es lento y silencioso, iniciándose frecuentemente en la juventud y manifestándose clínicamente décadas después." },
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
  { id: "b10", type: "prose", title: "Tratamiento Farmacológico", content: "El manejo de la aterosclerosis se basa en la reducción agresiva de factores de riesgo y el uso de fármacos con evidencia de reducción de eventos cardiovasculares.\n\nLas {{estatinas}} son la piedra angular del tratamiento, reduciendo el LDL entre 30-50% dependiendo de la dosis. Además de su efecto hipolipemiante, tienen efectos pleiotrópicos: mejoran la función endotelial, reducen la inflamación (disminuyen PCR) y estabilizan la placa ateromatosa.\n\nEl ácido acetilsalicílico (aspirina) en dosis bajas (75-100 mg/día) inhibe la agregación plaquetaria y reduce el riesgo de eventos trombóticos en prevención secundaria." },
  { id: "b11", type: "callout", variant: "mnemonic", title: "Mnemotecnia: ABCDE de Prevención", content: "A — Aspirina y Anticoagulación\nB — Betabloqueantes y control de presión arterial (Blood pressure)\nC — Colesterol (estatinas) y Cesación tabáquica\nD — Dieta y Diabetes (control glucémico)\nE — Ejercicio regular" },
  { id: "b12", type: "image_reference", description: "Diagrama de la formación de la placa ateromatosa mostrando las 5 etapas: disfunción endotelial → infiltración LDL → células espumosas → placa fibrosa → ruptura y trombosis", caption: "Figura 1. Etapas de la aterogénesis", image_url: null },
];

/* ═══════════════════════════════════════════════════
   ENHANCED KEYWORD CHIP (with mastery glow/breathing)
   ═══════════════════════════════════════════════════ */
function KeywordChip({ id, keywords, onHover }) {
  const kw = keywords[id];
  const [show, setShow] = useState(false);
  const chipRef = useRef(null);
  const { addRipple, rippleElements } = useRipple();
  if (!kw) return <span>{`{{${id}}}`}</span>;

  const isMastered = kw.mastered;
  const chipStyle = isMastered ? {
    backgroundColor: T.teal50,
    color: T.tealAccent,
    padding: "2px 8px",
    borderRadius: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.95em",
    border: `2px solid ${T.tealAccent}`,
    transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
    boxShadow: `0 0 8px ${T.tealAccent}40`,
    position: "relative",
    overflow: "hidden",
  } : {
    backgroundColor: "transparent",
    color: T.tealAccent,
    padding: "2px 8px",
    borderRadius: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.95em",
    border: `2px dashed ${T.tealAccent}`,
    transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
    position: "relative",
    overflow: "hidden",
  };

  return (
    <span style={{ position: "relative", display: "inline" }}>
      <span ref={chipRef}
        onMouseEnter={(e) => { setShow(true); e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = `0 0 14px ${T.tealAccent}50`; }}
        onMouseLeave={(e) => { setShow(false); e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = isMastered ? `0 0 8px ${T.tealAccent}40` : "none"; }}
        onClick={addRipple}
        style={chipStyle} className={!isMastered ? "axon-breathe" : ""}>
        {kw.term}
        {rippleElements}
      </span>
      {show && (
        <div className="axon-liquid-slide" style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", width: 320, background: T.white, borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", padding: 16, zIndex: 100, border: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.darkTeal, fontFamily: "Georgia, serif" }}>{kw.term}</div>
            <span style={{ fontSize: 16 }}>{isMastered ? "✓" : "?"}</span>
          </div>
          <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.5, marginBottom: 8 }}>{kw.definition}</div>
          {kw.related.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {kw.related.map(r => <span key={r} style={{ fontSize: 11, background: T.teal50, color: T.tealAccent, padding: "2px 8px", borderRadius: 10, transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>{r}</span>)}
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
   AI CONFIDENCE INDICATOR
   ═══════════════════════════════════════════════════ */
function AIConfidenceIndicator({ confidence }) {
  const colorMap = {
    alta: "#10b981",
    media: "#f59e0b",
    revisar: "#ef4444",
  };
  const labelMap = {
    alta: "Alta confianza — Contenido bien fundamentado",
    media: "Confianza media — Verificar con fuentes",
    revisar: "Requiere revisión — Validar información",
  };
  const dotColor = colorMap[confidence] || "#9CA3AF";
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div style={{
        width: 10, height: 10, borderRadius: "50%", background: dotColor,
        cursor: "pointer", display: "inline-block",
        animation: confidence === "revisar" ? "pulse 1s ease-in-out infinite" : "none"
      }} title={labelMap[confidence]} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BLOCK RENDERERS (10 types — from v1)
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
              <div className="axon-spring" style={{ background: T.white, borderRadius: 10, padding: "12px 16px", border: `1px solid ${T.border}`, borderLeft: `3px solid ${sevColor}` }}>
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
            <div key={i} className="axon-spring" style={{ display: "flex", gap: 12, padding: "10px 14px", background: T.white, borderRadius: 10, border: `1px solid ${T.border}`, alignItems: "flex-start" }}>
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
          <div key={i} className="axon-spring" style={{ background: T.white, borderRadius: 10, padding: "14px 16px", border: `1px solid ${T.border}`, display: "flex", gap: 10, alignItems: "flex-start" }}>
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
          <button className="axon-spring" style={{ background: T.tealAccent, color: T.white, border: "none", padding: "8px 20px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Agregar Imagen</button>
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
   FLOATING TABLE OF CONTENTS
   ═══════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════
   OUTLINE MAP — Drag & Drop integrated with blocks
   ═══════════════════════════════════════════════════ */
const BLOCK_TYPE_COLORS = {
  prose:            { dot: "#6B7280", bg: "#F3F4F6", label: "prose" },
  key_point:        { dot: "#2563EB", bg: "#DBEAFE", label: "key point" },
  stages:           { dot: "#7C3AED", bg: "#EDE9FE", label: "stages" },
  list_detail:      { dot: "#059669", bg: "#D1FAE5", label: "list detail" },
  comparison:       { dot: "#DC2626", bg: "#FEE2E2", label: "comparison" },
  callout:          { dot: "#D97706", bg: "#FEF3C7", label: "callout" },
  two_column:       { dot: "#0891B2", bg: "#CFFAFE", label: "two column" },
  grid:             { dot: "#4F46E5", bg: "#E0E7FF", label: "grid" },
  image_reference:  { dot: "#9333EA", bg: "#F3E8FF", label: "image ref" },
  section_divider:  { dot: "#9CA3AF", bg: "#F3F4F6", label: "divider" },
};

function OutlineTypeBadge({ type }) {
  const c = BLOCK_TYPE_COLORS[type] || BLOCK_TYPE_COLORS.prose;
  return (
    <span style={{ fontSize: 10, fontWeight: 500, color: c.dot, backgroundColor: c.bg, padding: "1px 7px", borderRadius: 8, whiteSpace: "nowrap", letterSpacing: "0.01em", lineHeight: "18px" }}>
      {c.label}
    </span>
  );
}

function FloatingTableOfContents({ blocks, isEditing, blockMastery, onBlockClick, onReorderBlocks }) {
  const [isOpen, setIsOpen] = useState(isEditing);
  const [readingProgress, setReadingProgress] = useState(0);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [dragOverPos, setDragOverPos] = useState(null);
  const [filterType, setFilterType] = useState(null);
  // 3 states: "open" | "dots" | "hidden"
  const [panelState, setPanelState] = useState("open");
  const dragCounterRef = useRef({});

  useEffect(() => {
    if (isEditing) return;
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min((window.scrollY / docHeight) * 100, 100) : 0;
      setReadingProgress(progress);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isEditing]);

  // Scroll to block
  const scrollToBlock = useCallback((blockId) => {
    const el = document.getElementById(`block-${blockId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // Drag handlers
  const handleDragStart = useCallback((e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    requestAnimationFrame(() => {
      const el = document.getElementById(`outline-item-${id}`);
      if (el) el.style.opacity = "0.35";
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedId) {
      const el = document.getElementById(`outline-item-${draggedId}`);
      if (el) el.style.opacity = "1";
    }
    setDraggedId(null);
    setDragOverId(null);
    setDragOverPos(null);
    dragCounterRef.current = {};
  }, [draggedId]);

  const handleDragOver = useCallback((e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id === draggedId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
    setDragOverId(id);
    setDragOverPos(pos);
  }, [draggedId]);

  const handleDragEnter = useCallback((e, id) => {
    e.preventDefault();
    dragCounterRef.current[id] = (dragCounterRef.current[id] || 0) + 1;
  }, []);

  const handleDragLeave = useCallback((e, id) => {
    dragCounterRef.current[id] = (dragCounterRef.current[id] || 0) - 1;
    if (dragCounterRef.current[id] <= 0) {
      dragCounterRef.current[id] = 0;
      if (dragOverId === id) { setDragOverId(null); setDragOverPos(null); }
    }
  }, [dragOverId]);

  const handleDrop = useCallback((e, targetId) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetId) return;

    // Use the callback from parent to reorder blocks
    const sourceIdx = blocks.findIndex(b => b.id === sourceId);
    const targetIdx = blocks.findIndex(b => b.id === targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(sourceIdx, 1);
    let insertIdx = newBlocks.findIndex(b => b.id === targetId);
    if (dragOverPos === "after") insertIdx += 1;
    newBlocks.splice(insertIdx, 0, moved);

    if (onReorderBlocks) onReorderBlocks(newBlocks);

    setDragOverId(null);
    setDragOverPos(null);
    dragCounterRef.current = {};
  }, [blocks, dragOverPos, onReorderBlocks]);

  const activeTypes = [...new Set(blocks.map(b => b.type))];
  const displayBlocks = filterType ? blocks.filter(b => b.type === filterType) : blocks;

  // Cycle: open → dots → hidden → open
  const cyclePanelState = () => {
    setPanelState(prev => prev === "open" ? "dots" : prev === "dots" ? "hidden" : "open");
  };

  // === EDITOR MODE — full sidebar with drag & drop ===
  if (isEditing) {
    // Hidden: just a tiny floating button to reopen
    if (panelState === "hidden") {
      return (
        <button onClick={() => setPanelState("open")} className="axon-spring"
          style={{
            position: "fixed", left: 20, top: 80, width: 36, height: 36,
            borderRadius: 10, background: T.white, border: `1px solid ${T.border}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 40, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", color: T.tealAccent, fontSize: 14,
          }}
          title="Abrir outline"
        >
          ≡
        </button>
      );
    }

    return (
      <div style={{
        position: "fixed", left: 20, top: 80, width: panelState === "dots" ? 48 : 280, maxHeight: "calc(100vh - 100px)",
        background: T.white, borderRadius: 14, border: `1px solid ${T.border}`,
        padding: panelState === "dots" ? "12px 8px" : "14px 12px", zIndex: 40, overflowY: "auto",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)", transition: "width 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: panelState === "dots" ? 8 : 10 }}>
          {panelState === "open" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: 5, background: `linear-gradient(135deg, ${T.tealAccent}, ${T.darkTeal})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 700 }}>≡</div>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary, letterSpacing: "-0.01em" }}>OUTLINE</span>
              <span style={{ fontSize: 10, color: T.textTertiary, marginLeft: 2 }}>{blocks.length}</span>
            </div>
          )}
          <button onClick={cyclePanelState} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: T.textTertiary, fontSize: 14, display: "flex" }}
            title={panelState === "open" ? "Minimizar" : "Ocultar"}>
            {panelState === "dots" ? "×" : "◂"}
          </button>
        </div>

        {panelState === "dots" ? (
          /* Dots: colored squares, clickable to navigate */
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
            <button onClick={() => setPanelState("open")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 4, color: T.tealAccent, fontSize: 12 }} title="Expandir">▸</button>
            {blocks.map(block => {
              const tc = BLOCK_TYPE_COLORS[block.type] || BLOCK_TYPE_COLORS.prose;
              const mastery = blockMastery[block.id] || 0.5;
              const ms = getMasteryStyle(mastery);
              return (
                <div key={block.id} onClick={() => scrollToBlock(block.id)} title={block.title || block.type}
                  style={{ width: 28, height: 28, borderRadius: 6, background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `2px solid ${ms.border}40`, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.15)"; e.currentTarget.style.borderColor = ms.border; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = ms.border + "40"; }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: tc.dot }} />
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {/* Type filter chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${T.border}20` }}>
              <button onClick={() => setFilterType(null)} style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 10, border: "none", cursor: "pointer",
                fontWeight: filterType === null ? 600 : 400,
                backgroundColor: filterType === null ? T.darkTeal : T.pageBg,
                color: filterType === null ? "white" : T.textTertiary,
                transition: "all 0.15s",
              }}>Todas</button>
              {activeTypes.map(type => {
                const tc = BLOCK_TYPE_COLORS[type] || BLOCK_TYPE_COLORS.prose;
                const active = filterType === type;
                return (
                  <button key={type} onClick={() => setFilterType(active ? null : type)} style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 10, border: "none", cursor: "pointer",
                    fontWeight: active ? 600 : 400,
                    backgroundColor: active ? tc.dot : "#F9FAFB",
                    color: active ? "white" : tc.dot,
                    transition: "all 0.15s",
                  }}>{tc.label}</button>
                );
              })}
            </div>

            {/* Draggable list */}
            {displayBlocks.map((block, idx) => {
              const tc = BLOCK_TYPE_COLORS[block.type] || BLOCK_TYPE_COLORS.prose;
              const mastery = blockMastery[block.id] || 0.5;
              const ms = getMasteryStyle(mastery);
              const isDragging = draggedId === block.id;
              const isOver = dragOverId === block.id && !isDragging;

              return (
                <div
                  key={block.id}
                  id={`outline-item-${block.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, block.id)}
                  onDragEnter={(e) => handleDragEnter(e, block.id)}
                  onDragLeave={(e) => handleDragLeave(e, block.id)}
                  onDrop={(e) => handleDrop(e, block.id)}
                  onClick={() => scrollToBlock(block.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "7px 8px", marginBottom: 1, borderRadius: 8,
                    cursor: "grab", transition: "all 0.15s ease",
                    backgroundColor: isDragging ? "#FEF3C7" : "transparent",
                    borderTop: isOver && dragOverPos === "before" ? `2px solid ${T.tealAccent}` : "2px solid transparent",
                    borderBottom: isOver && dragOverPos === "after" ? `2px solid ${T.tealAccent}` : "2px solid transparent",
                  }}
                  onMouseEnter={e => { if (!isDragging) e.currentTarget.style.backgroundColor = T.pageBg; }}
                  onMouseLeave={e => { if (!isDragging) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  {/* Drag grip */}
                  <div style={{ opacity: 0.25, flexShrink: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {[0,1,2].map(r => (
                      <div key={r} style={{ display: "flex", gap: 1.5 }}>
                        <div style={{ width: 2.5, height: 2.5, borderRadius: "50%", backgroundColor: "#9CA3AF" }} />
                        <div style={{ width: 2.5, height: 2.5, borderRadius: "50%", backgroundColor: "#9CA3AF" }} />
                      </div>
                    ))}
                  </div>

                  {/* Mastery + type dot */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: tc.dot, opacity: 0.8 }} />
                    <div style={{ position: "absolute", top: -2, right: -2, width: 5, height: 5, borderRadius: "50%", backgroundColor: ms.border, border: `1px solid ${T.white}` }} />
                  </div>

                  {/* Title */}
                  <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 500, color: T.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>
                    {block.title || `Bloque ${idx + 1}`}
                  </div>

                  {/* Type badge */}
                  <OutlineTypeBadge type={block.type} />
                </div>
              );
            })}

            {/* Footer */}
            <div style={{ marginTop: 8, paddingTop: 6, borderTop: `1px solid ${T.border}20`, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, color: T.textTertiary }}>
                {filterType ? `${displayBlocks.length}/${blocks.length}` : `${blocks.length} bloques`}
              </span>
              <span style={{ fontSize: 10, color: "#D1D5DB" }}>arrastra ↕</span>
            </div>
          </>
        )}
      </div>
    );
  }

  // === STUDENT MODE — floating panel with scroll progress ===
  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="axon-spring axon-liquid-float"
        style={{
          position: "fixed", left: 20, bottom: 30, width: 48, height: 48,
          borderRadius: "50%", background: T.tealAccent, color: T.white,
          border: "none", cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 40, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <BookOpen size={20} style={{ transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)", transform: isOpen ? "rotate(-15deg) scale(0.9)" : "rotate(0)" }} />
      </button>

      {isOpen && (
        <div className="axon-liquid-bounce" style={{
          position: "fixed", left: 20, bottom: 90, width: 260, maxHeight: 420,
          background: T.white, borderRadius: 14, border: `1px solid ${T.border}`,
          padding: "14px 12px", zIndex: 40, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
        }}>
          {/* Progress header */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: 4, background: `linear-gradient(135deg, ${T.tealAccent}, ${T.darkTeal})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 9, fontWeight: 700 }}>≡</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.textPrimary }}>OUTLINE</span>
            <span style={{ fontSize: 10, color: T.textTertiary, marginLeft: "auto" }}>{Math.round(readingProgress)}%</span>
          </div>
          <div style={{ width: "100%", height: 3, background: T.teal50, borderRadius: 2, marginBottom: 10, overflow: "hidden" }}>
            <div style={{ height: "100%", background: T.tealAccent, width: `${readingProgress}%`, transition: "width 0.1s linear", borderRadius: 2 }} />
          </div>

          {/* Block list with type badges */}
          {blocks.map((block, i) => {
            const tc = BLOCK_TYPE_COLORS[block.type] || BLOCK_TYPE_COLORS.prose;
            const mastery = blockMastery[block.id] || 0.5;
            const ms = getMasteryStyle(mastery);
            return (
              <div key={block.id} onClick={() => scrollToBlock(block.id)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 6px", marginBottom: 1, borderRadius: 6, cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = T.pageBg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: tc.dot, opacity: 0.8 }} />
                  <div style={{ position: "absolute", top: -1.5, right: -1.5, width: 4, height: 4, borderRadius: "50%", backgroundColor: ms.border, border: `1px solid ${T.white}` }} />
                </div>
                <div style={{ flex: 1, minWidth: 0, fontSize: 11, color: T.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                  {block.title || `Bloque ${i + 1}`}
                </div>
                <OutlineTypeBadge type={block.type} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   READING PROGRESS BAR
   ═══════════════════════════════════════════════════ */
function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
      setProgress(scrolled);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{
      position: "fixed", top: 57, left: 0, right: 0, height: 3, zIndex: 99,
      background: "transparent"
    }}>
      <div style={{
        height: "100%", background: `linear-gradient(to right, ${T.tealAccent}, ${T.teal100})`,
        width: `${progress}%`, transition: "width 0.2s ease-out"
      }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SCROLL REVEAL ANIMATION WRAPPER
   ═══════════════════════════════════════════════════ */
function ScrollRevealBlock({ children, blockId }) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [revealed]);

  return (
    <div ref={ref} className={revealed ? "axon-liquid-slide" : ""} style={{ opacity: revealed ? 1 : 0 }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SMART BLOCK TRANSITIONS
   ═══════════════════════════════════════════════════ */
function SmartTransition({ currentType, nextType }) {
  const transitions = {
    prose_stages: "¿Cómo ocurre?",
    stages_list_detail: "Factores que influyen →",
    comparison_callout: "Nota clínica",
  };
  const key = `${currentType}_${nextType}`;
  const text = transitions[key];

  if (!text) return null;
  return (
    <div style={{
      textAlign: "center", padding: "8px 0", fontSize: 12,
      fontStyle: "italic", color: T.textTertiary, margin: "12px 0"
    }}>
      {text}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   FOCUS MODE WRAPPER
   ═══════════════════════════════════════════════════ */
function FocusedBlockWrapper({ blockId, focusedBlockId, children }) {
  const isFocused = !focusedBlockId || blockId === focusedBlockId;
  return (
    <div style={{
      opacity: isFocused ? 1 : 0.35,
      filter: isFocused ? "blur(0px)" : "blur(1px)",
      transform: isFocused ? "scale(1)" : "scale(0.985)",
      transition: "opacity 0.4s cubic-bezier(0.34,1.56,0.64,1), filter 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)"
    }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ENHANCED QUIZ MODAL
   ═══════════════════════════════════════════════════ */
function EnhancedQuizModal({ block, onClose, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const correct = 2;
  const question = {
    text: `Sobre "${block.title || block.type}": ¿Cuál es la principal característica de la aterosclerosis?`,
    options: [
      "Es una enfermedad exclusivamente genética",
      "Es un depósito pasivo de grasa en las arterias",
      "Es un proceso inflamatorio crónico de las arterias",
      "Afecta solo a las venas de gran calibre",
    ],
  };

  const handleAnswer = () => {
    setAnswered(true);
    const isCorrect = selected === correct;
    if (isCorrect) {
      setShowConfetti(true);
      setStreak(streak + 1);
      setTimeout(() => setShowConfetti(false), 600);
    } else {
      setStreak(0);
    }
    onAnswer(isCorrect);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="axon-liquid-bounce" style={{ background: T.white, borderRadius: 16, padding: 28, maxWidth: 520, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", position: "relative" }}>
        {/* Confetti animation */}
        {showConfetti && (
          <>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="axon-confetti" style={{
                position: "absolute", left: "50%", top: "50%", width: 6, height: 6,
                background: [T.tealAccent, "#10b981", "#f59e0b"][i % 3],
                borderRadius: "50%", pointerEvents: "none",
                marginLeft: `${(i - 4) * 15}px`
              }} />
            ))}
          </>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <HelpCircle size={20} color={T.tealAccent} />
            <span style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: T.darkTeal }}>Quiz del Bloque</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textTertiary }}><X size={20} /></button>
        </div>

        {streak > 0 && !answered && (
          <div className="axon-count-up" style={{ fontSize: 12, background: "#f0fdf4", color: "#059669", padding: "6px 12px", borderRadius: 10, display: "inline-block", marginBottom: 12, fontWeight: 600 }}>
            ✓ Racha: {streak}
          </div>
        )}

        <div style={{ fontSize: 10, background: T.teal50, color: T.tealAccent, padding: "4px 10px", borderRadius: 10, display: "inline-block", marginBottom: 12, fontWeight: 600 }}>
          Generado por IA desde este bloque
        </div>

        <p style={{ fontSize: 15, color: T.textPrimary, lineHeight: 1.6, marginBottom: 16 }}>{question.text}</p>

        {/* Confidence selector — before answering */}
        {!answered && selected !== null && (
          <div style={{ marginBottom: 16, padding: "12px", background: T.teal50, borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.tealAccent, marginBottom: 8 }}>¿Qué tan seguro estás?</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "space-around" }}>
              {["😕", "🤔", "😊"].map((emoji, i) => (
                <button key={i} onClick={() => setConfidence(i)} className="axon-spring"
                  style={{
                    fontSize: 20, background: confidence === i ? T.tealAccent + "20" : "transparent",
                    border: `2px solid ${confidence === i ? T.tealAccent : "transparent"}`,
                    borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                  }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {question.options.map((opt, i) => {
            let bg = T.white, borderColor = T.border, textColor = T.textPrimary;
            if (answered) {
              if (i === correct) { bg = "#f0fdf4"; borderColor = "#10b981"; textColor = "#059669"; }
              else if (i === selected && i !== correct) { bg = "#fef2f2"; borderColor = "#ef4444"; textColor = "#dc2626"; }
            } else if (i === selected) { bg = T.teal50; borderColor = T.tealAccent; }
            return (
              <button key={i} onClick={() => { if (!answered) setSelected(i); }} className="axon-spring"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", border: `2px solid ${borderColor}`, borderRadius: 10, background: bg, cursor: answered ? "default" : "pointer", textAlign: "left", fontSize: 14, color: textColor, position: "relative", overflow: "hidden" }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, background: answered && i === correct ? "#10b981" : answered && i === selected ? "#ef4444" : "transparent", color: answered && (i === correct || i === selected) ? T.white : textColor }}>
                  {answered ? (i === correct ? <Check size={14} /> : i === selected ? <X size={14} /> : String.fromCharCode(65 + i)) : String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {!answered && selected !== null && (
          <button onClick={handleAnswer} className="axon-spring"
            style={{ marginTop: 16, width: "100%", padding: "12px", background: T.tealAccent, color: T.white, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", position: "relative", overflow: "hidden" }}>
            Confirmar Respuesta
          </button>
        )}

        {answered && (
          <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: selected === correct ? "#f0fdf4" : "#fef2f2", border: `1px solid ${selected === correct ? "#10b981" : "#ef4444"}` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: selected === correct ? "#059669" : "#dc2626", marginBottom: 4 }}>
              {selected === correct ? "¡Excelente!" : "Buena intención"}
            </div>
            <div style={{ fontSize: 13, color: T.textSecondary }}>
              {selected === correct ? "La aterosclerosis es un proceso inflamatorio crónico activo. ¡Sigue así!" : "La aterosclerosis es un proceso inflamatorio crónico activo, no un simple depósito de grasa. Vuelve a leer la sección."}
            </div>
            {selected === correct && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#059669", fontWeight: 600 }}>Mastery +15%</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BLOCK WRAPPER — mastery + AI confidence + focus mode
   ═══════════════════════════════════════════════════ */
function BlockWrapper({ block, index, total, isEditing, masteryLevel, showMastery, onDelete, onDuplicate, onMoveUp, onMoveDown, onGenerateQuiz, focusedBlockId, onBlockFocus, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const mastery = showMastery ? getMasteryStyle(masteryLevel) : null;
  const selfStyledBlocks = ["key_point", "callout", "comparison", "image_reference", "section_divider"];
  const isSelfStyled = selfStyledBlocks.includes(block.type);
  const aiConfidence = BLOCK_AI_CONFIDENCE[block.id] || "media";
  const tilt = useLiquidTilt(isEditing ? 5 : 0);

  return (
    <ScrollRevealBlock blockId={block.id}>
      <FocusedBlockWrapper blockId={block.id} focusedBlockId={focusedBlockId}>
        <div ref={isEditing ? tilt.ref : null}
          onMouseMove={isEditing ? tilt.handleMouseMove : undefined}
          onMouseLeave={(e) => { if (isEditing) tilt.handleMouseLeave(e); if (!isEditing) onBlockFocus(null); }}
          style={{ position: "relative", display: "flex", gap: 0, marginBottom: isEditing ? 0 : (isSelfStyled ? 16 : 6), ...(isEditing ? tilt.style : { transition: "all 0.2s" }) }}
          onMouseEnter={() => !isEditing && onBlockFocus(block.id)}>

          {mastery && isEditing && (
            <div style={{ width: 4, borderRadius: 4, background: mastery.border, marginRight: 12, flexShrink: 0, position: "relative" }} title={mastery.label}>
              <div style={{ position: "absolute", top: 8, left: -28, width: 24, height: 24, borderRadius: "50%", background: mastery.bg, border: `2px solid ${mastery.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: mastery.text }}>{Math.round(masteryLevel * 100)}%</span>
              </div>
            </div>
          )}

          {isEditing && (
            <div style={{ width: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "grab", color: T.textTertiary, flexShrink: 0, opacity: 0.5, marginRight: 4 }}>
              <GripVertical size={18} />
            </div>
          )}

          <div className={isEditing ? "axon-liquid-morph" : ""} style={{
            flex: 1, position: "relative", transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
            ...(isEditing ? {
              background: mastery ? mastery.bg : T.white, borderRadius: 16, padding: "20px 24px",
              border: `1px solid ${mastery ? mastery.border + "40" : T.border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            } : {
              background: mastery && !isSelfStyled ? mastery.bg + "60" : "transparent",
              borderRadius: isSelfStyled ? 0 : 0,
              padding: isSelfStyled ? "0" : "2px 0",
              border: "none", boxShadow: "none",
              borderLeft: mastery && !isSelfStyled ? `3px solid ${mastery.border}50` : "none",
              paddingLeft: mastery && !isSelfStyled ? 16 : 0,
            }),
          }}>
            {isEditing && (
              <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 2 }}>
                {/* AI Confidence indicator */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6 }} title={`Confianza: ${aiConfidence}`}>
                  <AIConfidenceIndicator confidence={aiConfidence} />
                </div>

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
                    <div className="axon-liquid-bounce" style={{ position: "absolute", top: "100%", right: 0, background: T.white, borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", padding: 4, zIndex: 50, minWidth: 160, border: `1px solid ${T.border}` }}>
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
            {isEditing && (
              <div style={{ fontSize: 10, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontWeight: 600 }}>
                {block.type.replace("_", " ")}
              </div>
            )}
            {children}
          </div>
        </div>
      </FocusedBlockWrapper>
    </ScrollRevealBlock>
  );
}

/* ═══════════════════════════════════════════════════
   INSERT BLOCK BUTTON
   ═══════════════════════════════════════════════════ */
function InsertBlockButton({ onInsert, isEditing }) {
  const [open, setOpen] = useState(false);
  const { addRipple, rippleElements } = useRipple();
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
      <button onClick={(e) => { setOpen(!open); addRipple(e); }} className="axon-spring" style={{ width: 28, height: 28, borderRadius: "50%", border: `2px dashed ${open ? T.tealAccent : T.border}`, background: open ? T.teal50 : "transparent", color: open ? T.tealAccent : T.textTertiary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.borderColor = T.tealAccent; e.currentTarget.style.color = T.tealAccent; }}}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textTertiary; }}}>
        <Plus size={14} style={{ transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)", transform: open ? "rotate(45deg)" : "rotate(0)" }} />
        {rippleElements}
      </button>
      {open && (
        <div className="axon-liquid-bounce" style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", background: T.white, borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", padding: 8, zIndex: 50, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, minWidth: 280, border: `1px solid ${T.border}` }}>
          {types.map(t => (
            <button key={t.type} onClick={() => { onInsert(t.type); setOpen(false); }} className="axon-spring"
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "none", background: "none", cursor: "pointer", borderRadius: 8, fontSize: 12, color: T.textPrimary, textAlign: "left", whiteSpace: "nowrap" }}
              onMouseEnter={e => e.currentTarget.style.background = T.teal50}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <t.icon size={14} color={T.tealAccent} /> {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════ */
export default function AxonSummaryPrototypeV2() {
  const [blocks, setBlocks] = useState(INITIAL_BLOCKS);
  const [isEditing, setIsEditing] = useState(false);
  const [showMastery, setShowMastery] = useState(true);
  const [quizBlock, setQuizBlock] = useState(null);
  const [blockMastery, setBlockMastery] = useState(BLOCK_MASTERY);
  const [focusedBlockId, setFocusedBlockId] = useState(null);
  const [focusMode, setFocusMode] = useState(false);

  // Inject keyframes once
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);
  }, []);

  const deleteBlock = (id) => setBlocks(b => b.filter(x => x.id !== id));
  const duplicateBlock = (id) => {
    const idx = blocks.findIndex(x => x.id === id);
    const dup = { ...blocks[idx], id: `dup_${Date.now()}` };
    const nb = [...blocks]; nb.splice(idx + 1, 0, dup); setBlocks(nb);
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

  const overallMastery = Object.values(blockMastery).reduce((a, b) => a + b, 0) / Object.keys(blockMastery).length;
  const masteryPercent = Math.round(overallMastery * 100);

  return (
    <div style={{ minHeight: "100vh", background: T.pageBg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{KEYFRAMES}</style>

      {/* Header */}
      <div style={{ background: T.darkTeal, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: T.tealAccent, fontFamily: "Space Grotesk, sans-serif" }}>AXON</span>
          <span style={{ color: "#8FBFB3", fontSize: 13 }}>Prototipo de Resúmenes v2</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {!isEditing && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8FBFB3" }}>
              <Clock size={14} />
              <span>Estudiaste esto hace 2 días</span>
            </div>
          )}
          <button onClick={() => setFocusMode(!focusMode)} className="axon-spring"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, border: `1px solid ${focusMode ? "#f59e0b" : "#4a6b65"}`, background: focusMode ? "rgba(245,158,11,0.15)" : "transparent", color: focusMode ? "#f59e0b" : "#8FBFB3", fontSize: 12, fontWeight: 600, cursor: "pointer", position: "relative", overflow: "hidden" }}>
            <Target size={14} /> Focus {focusMode ? "ON" : "OFF"}
          </button>
          <button onClick={() => setShowMastery(!showMastery)} className="axon-spring"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, border: `1px solid ${showMastery ? T.tealAccent : "#4a6b65"}`, background: showMastery ? "rgba(42,140,122,0.15)" : "transparent", color: showMastery ? T.tealAccent : "#8FBFB3", fontSize: 12, fontWeight: 600, cursor: "pointer", position: "relative", overflow: "hidden" }}>
            <Activity size={14} /> Mastery {showMastery ? "ON" : "OFF"}
          </button>
          <button onClick={() => setIsEditing(!isEditing)} className="axon-spring"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, border: "none", background: isEditing ? T.tealAccent : "rgba(255,255,255,0.1)", color: T.white, fontSize: 12, fontWeight: 600, cursor: "pointer", position: "relative", overflow: "hidden" }}>
            {isEditing ? <><Eye size={14} /> Vista Alumno</> : <><Edit3 size={14} /> Modo Editor</>}
          </button>
        </div>
      </div>

      {/* Reading progress bar */}
      <ReadingProgressBar />

      {/* Summary Header */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, background: T.teal50, color: T.tealAccent, padding: "3px 10px", borderRadius: 10, fontWeight: 600 }}>Cardiología</span>
          <span style={{ fontSize: 11, background: T.teal50, color: T.tealAccent, padding: "3px 10px", borderRadius: 10, fontWeight: 600 }}>Aterosclerosis</span>
          <span style={{ fontSize: 11, background: "#fef2f2", color: "#ef4444", padding: "3px 10px", borderRadius: 10, fontWeight: 600 }}>Alta relevancia</span>
          <span style={{ fontSize: 11, background: T.pageBg, color: T.textTertiary, padding: "3px 10px", borderRadius: 10, border: `1px solid ${T.border}` }}>~15 min lectura</span>
        </div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 700, color: T.darkTeal, margin: "0 0 6px", lineHeight: 1.2 }}>Aterosclerosis</h1>
        <p style={{ fontSize: 15, color: T.textSecondary, margin: "0 0 8px" }}>Enfermedad inflamatoria crónica de las arterias — fisiopatología, diagnóstico diferencial y manejo terapéutico</p>
        <div style={{ fontSize: 12, color: T.textTertiary, marginBottom: 8 }}>Generado por IA · Revisado por Dr. García · v2.0 · {blocks.length} bloques · {Object.keys(SAMPLE_KEYWORDS).length} keywords</div>

        {/* Mastery legend + overall progress ring */}
        {showMastery && (
          <div style={{ display: "flex", gap: 16, padding: "12px 14px", background: T.white, borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: 0, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="40" height="40" viewBox="0 0 40 40" className="axon-liquid-float" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="20" cy="20" r="15" fill="none" stroke={T.border} strokeWidth="2" />
                <circle cx="20" cy="20" r="15" fill="none" stroke={getMasteryColor(overallMastery)} strokeWidth="2" strokeDasharray={Math.PI * 30} strokeDashoffset={Math.PI * 30 * (1 - overallMastery / 1.3)} style={{ transition: "stroke-dashoffset 0.3s" }} />
              </svg>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.darkTeal }}>{masteryPercent}%</div>
                <div style={{ fontSize: 11, color: T.textTertiary }}>Dominio</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: T.textTertiary, fontWeight: 600 }}>Estado:</span>
              {[T.masteryGray, T.masteryRed, T.masteryYellow, T.masteryGreen, T.masteryBlue].map((m, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: m.border }} />
                  <span style={{ color: m.text, fontWeight: 600 }}>{m.label}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Blocks */}
      <div style={{
        maxWidth: 800, margin: "0 auto", padding: isEditing ? "20px 20px 60px" : "0 20px 60px",
        ...(isEditing ? {} : {
          background: T.white, borderRadius: 20, padding: "32px 36px 48px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginTop: 16,
          border: `1px solid ${T.border}`,
        }),
      }}>
        {isEditing && <InsertBlockButton onInsert={(type) => insertBlock(-1, type)} isEditing={isEditing} />}

        {blocks.map((block, i) => (
          <div key={block.id} id={`block-${block.id}`}>
            <BlockWrapper
              block={block} index={i} total={blocks.length}
              isEditing={isEditing}
              masteryLevel={blockMastery[block.id] || 0.5}
              showMastery={showMastery}
              onDelete={deleteBlock} onDuplicate={duplicateBlock}
              onMoveUp={moveUp} onMoveDown={moveDown}
              onGenerateQuiz={(id) => setQuizBlock(blocks.find(b => b.id === id))}
              focusedBlockId={focusMode ? focusedBlockId : null}
              onBlockFocus={focusMode ? setFocusedBlockId : () => {}}
            >
              {renderBlock(block)}
            </BlockWrapper>

            {!isEditing && i < blocks.length - 1 && <SmartTransition currentType={block.type} nextType={blocks[i + 1].type} />}
            {isEditing && <InsertBlockButton onInsert={(type) => insertBlock(i, type)} isEditing={isEditing} />}
          </div>
        ))}
      </div>

      {/* Floating TOC + Quiz Modal */}
      <FloatingTableOfContents blocks={blocks} isEditing={isEditing} blockMastery={blockMastery} onBlockClick={() => {}} onReorderBlocks={setBlocks} />
      {quizBlock && (
        <EnhancedQuizModal block={quizBlock} onClose={() => setQuizBlock(null)} onAnswer={(correct) => handleQuizAnswer(quizBlock.id, correct)} />
      )}
    </div>
  );
}
