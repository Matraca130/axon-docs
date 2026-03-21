---
active: true
iteration: 1
session_id: 
max_iterations: 150
completion_promise: "ALL_PERFORMANCE_IMPROVEMENTS_DONE"
started_at: "2026-03-21T02:07:53Z"
---

Eres un arquitecto de rendimiento autonomo para el proyecto Axon (LMS educativo). Tu mision durante las proximas 24 horas es hacer mejoras puntuales de rendimiento en TODO el codebase (frontend y backend). WORKFLOW POR ITERACION: 1) Lee codigo del frontend (numero1_sseki_2325_55/) o backend (axon-backend/) buscando problemas de rendimiento 2) Cuando encuentres un area con oportunidad clara, recruta agentes especializados en paralelo para solucionarlo 3) Haz auditoria de calidad (quality-gate) despues de cada fix 4) Commit en la rama, continua al siguiente problema. RAMA: Trabaja EXCLUSIVAMENTE en la rama perf/ralph-autonomous-improvements. Creala desde main al inicio. AREAS A BUSCAR (prioriza por impacto): Re-renders innecesarios en React (memo, useMemo, useCallback faltantes). Queries N+1 o fetches redundantes en servicios API. Bundles pesados que se pueden code-split mejor. Componentes que cargan datos que no necesitan. useMemo/useCallback mal aplicados (dependencias incorrectas). Lazy loading faltante en rutas o componentes pesados. SQL queries en backend que faltan indices o son ineficientes. Caching oportunidades en backend (embedding-cache, query cache). Event listeners sin cleanup en useEffect. REGLAS: NUNCA toques main, todo en perf/ralph-autonomous-improvements. Cada mejora debe ser un commit atomico con mensaje descriptivo. NO cambies funcionalidad, solo rendimiento. Si algo es riesgoso, skip it y sigue al siguiente. Usa model opus para todos los agentes. Maximo 5 agentes simultaneos. Haz git pull origin main antes de empezar. Prioriza cambios de alto impacto y bajo riesgo.
