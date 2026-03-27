import { useState, useRef, useCallback, useEffect } from "react";

const SECTION_TYPES = {
  prose: { color: "#6B7280", bg: "#F3F4F6", label: "prose" },
  "key point": { color: "#2563EB", bg: "#DBEAFE", label: "key point" },
  stages: { color: "#7C3AED", bg: "#EDE9FE", label: "stages" },
  "list detail": { color: "#059669", bg: "#D1FAE5", label: "list detail" },
  comparison: { color: "#DC2626", bg: "#FEE2E2", label: "comparison" },
  callout: { color: "#D97706", bg: "#FEF3C7", label: "callout" },
  "two column": { color: "#0891B2", bg: "#CFFAFE", label: "two column" },
  grid: { color: "#4F46E5", bg: "#E0E7FF", label: "grid" },
  "image reference": { color: "#9333EA", bg: "#F3E8FF", label: "image reference" },
  timeline: { color: "#E11D48", bg: "#FFE4E6", label: "timeline" },
  diagram: { color: "#0D9488", bg: "#CCFBF1", label: "diagram" },
  formula: { color: "#64748B", bg: "#F1F5F9", label: "formula" },
};

const INITIAL_SECTIONS = [
  { id: "1", title: "Definición y Concepto General", type: "prose" },
  { id: "2", title: "Concepto Central", type: "key point" },
  { id: "3", title: "Patogénesis — Etapas del proceso", type: "stages" },
  { id: "4", title: "Factores de Riesgo", type: "list detail" },
  { id: "5", title: "Diagnóstico Diferencial", type: "comparison" },
  { id: "6", title: "Correlación Clínica", type: "callout" },
  { id: "7", title: "Distribución Anatómica", type: "two column" },
  { id: "8", title: "Territorios Vasculares Afectados", type: "grid" },
  { id: "9", title: "Clave para el Examen", type: "callout" },
  { id: "10", title: "Tratamiento Farmacológico", type: "prose" },
  { id: "11", title: "Mnemotecnia: ABCDE del manejo", type: "callout" },
  { id: "12", title: "Imagen de referencia", type: "image reference" },
];

function TypeBadge({ type }) {
  const config = SECTION_TYPES[type] || SECTION_TYPES.prose;
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 500,
        color: config.color,
        backgroundColor: config.bg,
        padding: "2px 8px",
        borderRadius: "10px",
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
      }}
    >
      {config.label}
    </span>
  );
}

function DotIndicator({ type }) {
  const config = SECTION_TYPES[type] || SECTION_TYPES.prose;
  return (
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        backgroundColor: config.color,
        opacity: 0.7,
        flexShrink: 0,
      }}
    />
  );
}

export default function ResumenMap() {
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [dragOverPosition, setDragOverPosition] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const [isCompact, setIsCompact] = useState(false);
  const [zoom, setZoom] = useState(1);
  const dragCounter = useRef({});

  const handleDragStart = useCallback((e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    // Make ghost semi-transparent
    requestAnimationFrame(() => {
      const el = document.getElementById(`section-${id}`);
      if (el) el.style.opacity = "0.4";
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedId) {
      const el = document.getElementById(`section-${draggedId}`);
      if (el) el.style.opacity = "1";
    }
    setDraggedId(null);
    setDragOverId(null);
    setDragOverPosition(null);
    dragCounter.current = {};
  }, [draggedId]);

  const handleDragOver = useCallback(
    (e, id) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (id === draggedId) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position = e.clientY < midY ? "before" : "after";

      setDragOverId(id);
      setDragOverPosition(position);
    },
    [draggedId]
  );

  const handleDragEnter = useCallback((e, id) => {
    e.preventDefault();
    dragCounter.current[id] = (dragCounter.current[id] || 0) + 1;
  }, []);

  const handleDragLeave = useCallback(
    (e, id) => {
      dragCounter.current[id] = (dragCounter.current[id] || 0) - 1;
      if (dragCounter.current[id] <= 0) {
        dragCounter.current[id] = 0;
        if (dragOverId === id) {
          setDragOverId(null);
          setDragOverPosition(null);
        }
      }
    },
    [dragOverId]
  );

  const handleDrop = useCallback(
    (e, targetId) => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData("text/plain");
      if (!sourceId || sourceId === targetId) return;

      setSections((prev) => {
        const sourceIdx = prev.findIndex((s) => s.id === sourceId);
        const targetIdx = prev.findIndex((s) => s.id === targetId);
        if (sourceIdx === -1 || targetIdx === -1) return prev;

        const newSections = [...prev];
        const [moved] = newSections.splice(sourceIdx, 1);

        let insertIdx = newSections.findIndex((s) => s.id === targetId);
        if (dragOverPosition === "after") insertIdx += 1;

        newSections.splice(insertIdx, 0, moved);
        return newSections;
      });

      setDragOverId(null);
      setDragOverPosition(null);
      dragCounter.current = {};
    },
    [dragOverPosition]
  );

  // Keyboard reordering
  const handleKeyDown = useCallback(
    (e, id) => {
      if (!selectedId || selectedId !== id) return;
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        setSections((prev) => {
          const idx = prev.findIndex((s) => s.id === id);
          const newIdx = e.key === "ArrowUp" ? idx - 1 : idx + 1;
          if (newIdx < 0 || newIdx >= prev.length) return prev;
          const newSections = [...prev];
          [newSections[idx], newSections[newIdx]] = [newSections[newIdx], newSections[idx]];
          return newSections;
        });
      }
    },
    [selectedId]
  );

  const activeTypes = [...new Set(sections.map((s) => s.type))];
  const filteredSections = filterType ? sections.filter((s) => s.type === filterType) : sections;

  const totalSections = sections.length;
  const typeBreakdown = activeTypes
    .map((t) => ({
      type: t,
      count: sections.filter((s) => s.type === t).length,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: 520,
        margin: "0 auto",
        padding: "24px 16px",
        color: "#1F2937",
        userSelect: "none",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "linear-gradient(135deg, #0D9488, #2563EB)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              ≡
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>OUTLINE</h1>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
              style={{
                background: "none",
                border: "1px solid #E5E7EB",
                borderRadius: 6,
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: 14,
                color: "#6B7280",
              }}
            >
              −
            </button>
            <button
              onClick={() => setZoom(1)}
              style={{
                background: "none",
                border: "1px solid #E5E7EB",
                borderRadius: 6,
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: 11,
                color: "#6B7280",
                minWidth: 36,
              }}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
              style={{
                background: "none",
                border: "1px solid #E5E7EB",
                borderRadius: 6,
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: 14,
                color: "#6B7280",
              }}
            >
              +
            </button>
            <button
              onClick={() => setIsCompact((c) => !c)}
              style={{
                background: isCompact ? "#F3F4F6" : "none",
                border: "1px solid #E5E7EB",
                borderRadius: 6,
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: 11,
                color: "#6B7280",
              }}
            >
              {isCompact ? "▤" : "▥"}
            </button>
          </div>
        </div>
        <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>
          {totalSections} secciones · Arrastra para reordenar
        </p>
      </div>

      {/* Type filters */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: "1px solid #F3F4F6",
        }}
      >
        <button
          onClick={() => setFilterType(null)}
          style={{
            fontSize: 11,
            padding: "3px 10px",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            fontWeight: filterType === null ? 600 : 400,
            backgroundColor: filterType === null ? "#1F2937" : "#F3F4F6",
            color: filterType === null ? "white" : "#6B7280",
            transition: "all 0.15s",
          }}
        >
          Todas ({totalSections})
        </button>
        {typeBreakdown.map(({ type, count }) => {
          const config = SECTION_TYPES[type];
          const active = filterType === type;
          return (
            <button
              key={type}
              onClick={() => setFilterType(active ? null : type)}
              style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                fontWeight: active ? 600 : 400,
                backgroundColor: active ? config.color : "#F9FAFB",
                color: active ? "white" : config.color,
                transition: "all 0.15s",
              }}
            >
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Section list */}
      <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: `${100 / zoom}%` }}>
        {filteredSections.map((section, idx) => {
          const isDragging = draggedId === section.id;
          const isOver = dragOverId === section.id && !isDragging;
          const isSelected = selectedId === section.id;

          return (
            <div
              key={section.id}
              id={`section-${section.id}`}
              draggable
              tabIndex={0}
              onDragStart={(e) => handleDragStart(e, section.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, section.id)}
              onDragEnter={(e) => handleDragEnter(e, section.id)}
              onDragLeave={(e) => handleDragLeave(e, section.id)}
              onDrop={(e) => handleDrop(e, section.id)}
              onClick={() => setSelectedId(isSelected ? null : section.id)}
              onKeyDown={(e) => handleKeyDown(e, section.id)}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: isCompact ? "8px 12px" : "12px 14px",
                marginBottom: 2,
                borderRadius: 10,
                cursor: "grab",
                transition: "all 0.15s ease",
                backgroundColor: isSelected ? "#F8FAFC" : isDragging ? "#FEF3C7" : "transparent",
                borderTop: isOver && dragOverPosition === "before" ? "2px solid #2563EB" : "2px solid transparent",
                borderBottom: isOver && dragOverPosition === "after" ? "2px solid #2563EB" : "2px solid transparent",
                boxShadow: isSelected ? "0 0 0 1px #E2E8F0" : "none",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                if (!isDragging) e.currentTarget.style.backgroundColor = isSelected ? "#F8FAFC" : "#FAFAFA";
              }}
              onMouseLeave={(e) => {
                if (!isDragging) e.currentTarget.style.backgroundColor = isSelected ? "#F8FAFC" : "transparent";
              }}
            >
              {/* Drag handle */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  opacity: 0.3,
                  flexShrink: 0,
                  width: 12,
                }}
              >
                <div style={{ display: "flex", gap: 2 }}>
                  <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#9CA3AF" }} />
                  <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#9CA3AF" }} />
                </div>
                <div style={{ display: "flex", gap: 2 }}>
                  <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#9CA3AF" }} />
                  <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#9CA3AF" }} />
                </div>
                <div style={{ display: "flex", gap: 2 }}>
                  <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#9CA3AF" }} />
                  <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#9CA3AF" }} />
                </div>
              </div>

              {/* Color dot */}
              <DotIndicator type={section.type} />

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: isCompact ? 13 : 14,
                    fontWeight: 500,
                    color: "#1F2937",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    lineHeight: 1.3,
                  }}
                >
                  {section.title}
                </div>
              </div>

              {/* Type badge */}
              <TypeBadge type={section.type} />

              {/* Position number */}
              <span
                style={{
                  fontSize: 10,
                  color: "#D1D5DB",
                  fontWeight: 500,
                  minWidth: 16,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {idx + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer stats */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: "1px solid #F3F4F6",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 11, color: "#9CA3AF" }}>
          {filterType
            ? `Mostrando ${filteredSections.length} de ${totalSections}`
            : `${totalSections} bloques`}
        </span>
        <span style={{ fontSize: 11, color: "#D1D5DB" }}>↑↓ mover · click seleccionar</span>
      </div>
    </div>
  );
}
