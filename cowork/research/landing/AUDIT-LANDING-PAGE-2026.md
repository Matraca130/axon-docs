# Auditoría de Landing Pages — Patrones 2025-2026

> Investigación realizada: 2026-03-27
> Objetivo: Identificar patrones de las landing pages más exitosas para aplicar a Axon Medical Academy
> Target confirmado: Estudiantes de medicina UNLP (versión B / bento como base)

---

## Fuentes consultadas

- Evil Martians: estudio de 100+ dev tool landing pages (2025)
- Unbounce: 40 best landing page examples 2026 + benchmarks de conversión
- SwipePages: 11 best education landing pages 2026
- SaaSFrame: 10 SaaS landing page trends 2026
- SaaSHero: high-converting enterprise landing page design 2026
- Fibr: 20 best SaaS landing pages + best practices 2026
- HubSpot: 36 landing page examples
- Duolingo case study (gamification + conversion)
- Brilliant.org (interactive learning landing)
- Análisis directo de: Linear, Vercel, Stripe, Notion, Framer, Slack

---

## Los 10 patrones de mayor conversión

### 1. Hero story-driven (no tagline estática)

Los mejores (Notion, Linear, Framer, Duolingo) muestran el valor del producto visualmente en los primeros 3-5 segundos. Duolingo te deja hacer un ejercicio ANTES de registrarte. Brilliant muestra un problema interactivo. El headline ideal tiene menos de 8 palabras (44 caracteres max), según datos de Unbounce sobre miles de landings. No dicen "somos una plataforma de X" — muestran el antes/después.

### 2. Bento Grid es EL layout de 2025-2026

Inspirado en Apple, ya es el estándar para mostrar múltiples features sin abrumar. Funciona porque reduce la carga cognitiva: el usuario escanea cards independientemente, y la jerarquía visual se comunica por tamaño de card, no solo por tipografía. CUIDADO: el bento grid falla en mobile si no se diseña específicamente para 375px. Cada card necesita test individual en mobile.

### 3. Dos CTAs, no una

El patrón más consistente del estudio de 100 páginas: un CTA primario bold ("Começar agora", "Empezar gratis") + uno secundario visualmente distinto (outline/ghost: "Ver demo", "Conocer más"). Evitar "Get started" genérico — ser específico al resultado que el usuario obtiene.

### 4. Trust block inmediatamente después del hero

Logos de instituciones, números ("6,500+ estudantes"), badges de acreditación. En educación, esto responde "¿es legítimo?" antes de que el usuario scrollee. Harvard pone "No application required" para remover miedo.

### 5. Social proof cerca de decision points, no solo arriba

Los testimonios más efectivos están cerca de los CTAs y de la sección de pricing, no aislados en una sección propia. En educación, mostrar el certificado/resultado tangible temprano aumenta conversión significativamente. Nielsen: 83% confía en recomendaciones de personas conocidas.

### 6. Low-friction first step

Duolingo deja que hagas una lección ANTES de registrarte. Harvard muestra un form con progress bar ya en 50%. Cada campo de formulario que removés puede aumentar la conversión entre 8% y 50%.

### 7. Dark mode como decisión de diseño

55% de dispositivos iOS y 43% de Android usan dark mode. Linear y Vercel usan fondos oscuros para sus secciones de features técnicas — da sensación premium y moderna. No es preferencia de usuario, es decisión de diseño para secciones específicas.

### 8. Micro-interacciones > animaciones pesadas

"Clever and simple wins" — regla #1 del estudio de Evil Martians. Una animación bien orquestada de page load con staggered reveals genera más deleite que micro-interacciones dispersas. Scroll-triggered reveals + hover states que sorprenden.

### 9. Tipografía bold y expresiva, no genérica

2025-2026 marca el retorno de serifs en headlines, gradientes, y paletas con personalidad. Las mejores páginas evitan Inter/Roboto/Arial.

### 10. Conversion-centred architecture (CCA)

La estructura que más convierte: Hero → Trust → Problema → Features (bento/tabbed) → Social Proof → Pricing → Final CTA. Cada sección tiene un solo propósito. Nav simplificado al máximo. Sticky CTA siempre visible.

---

## Benchmarks de conversión (Unbounce 2026)

- Mediana SaaS landing page: 3.8%
- Top performers (custom): 11.6%+
- Template-based: ~3.8%
- 83% de visitas son mobile
- Desktop convierte ~8% mejor que mobile
- AI-powered personalization puede aumentar conversión ~40%

---

## Análisis de las dos versiones de Axon

### Versión A — Enterprise (axon_versaoA_enterprise.html)

Inspiración: Linear, Vercel, Stripe. Tono técnico, preciso, confiante. Fondo oscuro para diferenciales. Tabla comparativa vs competidores. 9 diferenciales numerados. Mejor para audiencia técnica y decision-makers institucionales.

### Versión B — Bento (axon_versaoB_bento.html) ← BASE ELEGIDA

Inspiración: Loom, Notion, Duolingo. Tono cálido, centrado en el estudiante. Bento grid con demos visuales interactivas (tutor de voz, barras BKT, chat WhatsApp, knowledge graph SVG, pipeline PDF, barra XP). Mejor para estudiantes directos.

**Lo que ya funciona bien (7/10 patrones cubiertos):** bento grid, trust bar UNLP, sección problema, micro-interacciones, tipografía DM Serif/Sans, dos CTAs, estructura CCA.

---

## Mejoras prioritarias identificadas

### Alta prioridad

1. **Hero interactivo** — En vez de cards estáticas de UI, mostrar una micro-experiencia: flashcard real que se puede voltear, o mini-quiz de una pregunta. Esto aplica el patrón #1 (story-driven) y #6 (low-friction first step).

2. **Social proof cerca del pricing** — Agregar 2-3 testimonios cortos de estudiantes reales justo antes o al lado del pricing. La sección "Fundador" podría incluir citas de estudiantes en vez de ser solo sobre el fundador.

3. **CTA con urgencia real** — El waitlist CTA podría tener "87 vagas restantes" o barra de progreso con deadline real para generar urgencia sin ser manipulativo.

### Media prioridad

4. **Mobile breakpoints del bento** — Testear cada card a 375px. Las cards bento-hero y bento-wide necesitan colapsar bien a 1 columna.

5. **Video/demo corto** — "30 segundos de Axon en acción" como GIF o video corto en el hero o justo después del trust bar.

6. **Sticky CTA** — Un botón flotante "Começar agora" que aparezca después de scrollear pasado el hero.

### Baja prioridad (polish)

7. **Micro-interacciones adicionales** — Typing effect en la burbuja de voz del tutor, counter animado en las stats del hero, parallax sutil en el knowledge graph SVG.

8. **Dark/light toggle** — Sería un diferencial de polish, pero no es prioritario para conversión.

---

## Design system actual

```
Brand:       #1B3B36
Brand-mid:   #244e47
Accent:      #2a8c7a
Accent-light:#2dd4a8
Accent-pale: #ccfbf1
Dark-panel:  #1a2e2a
BG:          #F0F2F5
BG-card:     #FFFFFF
Text:        #1a1a1a
Text-title:  #111827
Text-muted:  #6b7280
Border:      #e5e7eb

Fonts: DM Serif Display (headlines) + DM Sans (body)
Border-radius: 14-20px (cards), 100px (badges/pills)
Shadows: 0 2px 12px rgba(0,0,0,0.06) → hover: 0 8px 24px rgba(0,0,0,0.1)
```

---

## Próximos pasos

1. Design critique formal de versión B (skill: design-critique)
2. Aplicar principios de frontend-design (repo Anthropic skills)
3. UX copy review del microcopy en portugués (skill: ux-copy)
4. Accessibility review WCAG 2.1 AA (skill: accessibility-review)
5. Crawlear landings de referencia con Tavily (Duolingo, Brilliant)
6. Implementar mejoras en nueva versión C
