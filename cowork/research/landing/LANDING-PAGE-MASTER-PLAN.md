# AXON — Landing Page Institucional: Plan Maestro

> Documento unificado con toda la investigación, decisiones, re-auditorías, y plan de ejecución.
> Fecha: 2026-03-27 | Target: Estudiantes de medicina UNLP | Idioma: Español

---

## 1. DECISIONES CONFIRMADAS

| Decisión | Detalle |
|---|---|
| Base | Versión B (bento) — centrada en el estudiante |
| Idioma | Español (todo el copy, CTAs, secciones) |
| Target | Estudiantes de medicina de la UNLP |
| Hero | Video scroll-linked generado con Gemini (3-4 segundos) |
| Fondo del video | #1B3B36 (brand color de Axon) |
| Formato técnico | Spritesheet WebP (canvas + frames) — mejor cross-device |
| Tipografía | DM Serif Display (headlines) + DM Sans (body) — se mantiene |
| Paleta | Se mantiene el design system actual |

---

## 2. INVESTIGACIÓN BASE — 10 Patrones de Conversión 2025-2026

Fuentes: Evil Martians (100+ pages), Unbounce, SwipePages, SaaSFrame, Duolingo, Brilliant, Linear, Vercel, HubSpot.

### Patrón 1: Hero story-driven
- Mostrar el valor visualmente en 3-5 segundos, no con tagline estática
- Headline ideal: <8 palabras, <44 caracteres
- Duolingo deja probar antes de registrarse → 135M MAU

### Patrón 2: Bento Grid
- EL layout de 2025-2026 (inspirado en Apple)
- Reduce carga cognitiva: usuario escanea cards independientemente
- CUIDADO en mobile: diseñar stacking order específico para 375px

### Patrón 3: Dos CTAs
- CTA primario bold + secundario ghost/outline
- Ser específico al resultado, no genérico ("Empezar gratis" > "Get started")

### Patrón 4: Trust block post-hero
- Logos, números, badges inmediatamente después del hero
- Responde "¿es legítimo?" antes del scroll

### Patrón 5: Social proof en decision points
- Testimonios cerca de CTAs y pricing, no en sección aislada
- En educación: mostrar resultados tangibles temprano

### Patrón 6: Low-friction first step
- Dejar que el usuario pruebe antes de registrarse
- Cada campo de form removido = +8-50% conversión

### Patrón 7: Dark mode como decisión de diseño
- Fondos oscuros para secciones premium/técnicas
- Linear/Vercel pattern: hero oscuro → contenido claro

### Patrón 8: Micro-interacciones > animaciones pesadas
- "Clever and simple wins" — staggered reveals en page load
- Scroll-triggered + hover states que sorprenden

### Patrón 9: Tipografía expresiva
- Retorno de serifs en headlines (DM Serif Display ✓)
- Evitar Inter/Roboto/Arial

### Patrón 10: Conversion-centred architecture (CCA)
- Hero → Trust → Problema → Features → Social Proof → Pricing → Final CTA
- Cada sección = un solo propósito
- Sticky CTA siempre visible

### Benchmarks
- Mediana SaaS: 3.8% | Top custom: 11.6%+ | Mobile: 83% de visitas
- Argentina mobile: 58 Mbps promedio (Personal 4G, 2025)

---

## 3. CONCEPTO DEL HERO — Video Scroll-Linked

### La visión
Video de 3-4 segundos generado con Gemini. Personajes/elementos animados que emergen del fondo oscuro (#1B3B36). Cada elemento representa una feature de Axon:

1. **Modelo 3D de cráneo** — rotando en una card, representa Anatomía
2. **Flashcard** — alguien interactúa, se voltea mostrando pregunta→respuesta
3. **Quiz con profesor** — avatar interactivo que mueve la cabeza mientras se relaciona con el quiz
4. **Calendario creativo** — idea orbital: círculos que orbitan representando sesiones de estudio hasta el examen
5. **Knowledge Graph** — nodos que se conectan formando un sistema solar de conocimiento

Todo esto en la pantalla del hero, relativamente pequeño pero vivo. El estudiante ve todas las capacidades de Axon de un vistazo.

### Implementación técnica

**Producción del video:**
- Generar imagen frame inicial + imagen frame final con Gemini
- Gemini genera el video intermedio (3-4 segundos)
- Exportar como secuencia de frames PNG

**Implementación web (recomendada):**
- Spritesheet WebP (canvas + secuencia de imágenes)
- 3-4 segundos × 24fps = 72-96 frames
- Spritesheet WebP a 1280px: ~3-5MB total
- Scroll position controla qué frame se muestra
- Fallback mobile: autoplay normal si scroll-linking no es suave

**¿Por qué spritesheet y no MP4?**
- MP4 scrubbing depende de keyframes del codec → puede verse choppy
- Spritesheet = control perfecto frame-a-frame en TODOS los dispositivos
- Apple usa esta técnica exacta en sus product pages

**Alternativa MP4 (si se prefiere simplicidad):**
```
ffmpeg -i input.mp4 -vf scale=1280:-1 -movflags faststart -vcodec libx264 -crf 18 -g 2 -pix_fmt yuv420p -an output.mp4
```
`-g 2` = keyframe cada 2 frames → scrubbing suave. Peso: 1-3MB a 1280px.

### Browser support
- ScrollTimeline: Chrome 115+, Edge 115+, Safari 26+, Firefox (polyfill)
- Canvas image sequence: funciona en TODOS los browsers

---

## 4. PROMPTS PARA GEMINI

### Prompt — Imagen 1 (frame inicial, todo en reposo)

```
Clean, modern digital illustration on a solid dark green background (#1B3B36).
Five stylized medical education UI cards arranged in a bento grid layout,
slightly tilted and stacked as if they're about to come alive. The cards show:
(1) a 3D anatomical skull in a rounded card,
(2) a flashcard with a medical question in Spanish,
(3) a quiz interface with multiple choice options,
(4) a circular orbital timeline with glowing dots representing study sessions,
(5) a network of connected nodes like a constellation/solar system representing
a knowledge graph.
All cards use green accent color (#2dd4a8), white text, and have soft shadows.
Style: flat design with subtle depth, professional, minimal, Notion/Linear
aesthetic. No text other than UI labels in Spanish.
2K resolution, 16:9 aspect ratio.
```

### Prompt — Imagen 2 (frame final, todo activado)

```
Same composition as reference image but now all five cards are fully activated
and alive:
(1) the skull has rotated 45 degrees showing a different angle with a green glow,
(2) the flashcard has flipped revealing the answer side with a green checkmark,
(3) the quiz shows a selected correct answer highlighted in green with a small
animated professor avatar giving a thumbs up,
(4) the orbital timeline has progressed with 3 dots now glowing bright green
showing completed study sessions,
(5) the knowledge graph nodes have expanded outward with pulsing connections
and one node highlighted in red (#f43f5e) with a label "revisar".
Background remains solid dark green (#1B3B36). Same style, same layout.
2K resolution, 16:9.
```

### Prompt — Video (con las dos imágenes de referencia)

```
Create a smooth 4-second animation transitioning from the first image to the
second. The five cards should activate one by one with a staggered 0.5s delay
between each, starting from the top-left card. Each card should have a subtle
rising motion (5-10px upward) as it activates. The transition should feel
premium and fluid, like a high-end product launch video. Maintain the dark
green background (#1B3B36) throughout. No camera movement, only the elements
within the cards animate. 24fps, 2K resolution.
```

### Tip de workflow
1. Iterar imagen 1 hasta que esté perfecta (colores, estilo, composición)
2. Usar imagen 1 como referencia fija para generar imagen 2
3. Solo cuando ambas imágenes estén aprobadas → generar el video
4. No intentar generar el video con imágenes "más o menos"

---

## 5. ESTRUCTURA DE LA LANDING — Versión C (español)

```
┌─────────────────────────────────────────────┐
│  NAV                                        │
│  Logo Axon · Funcionalidades · Materias ·   │
│  Precios · [Empezar gratis]                 │
├─────────────────────────────────────────────┤
│  HERO (fondo #1B3B36)                       │
│  ┌────────────────┐  ┌──────────────────┐   │
│  │ Headline +      │  │ VIDEO/SPRITESHEET│   │
│  │ Subtext +       │  │ scroll-linked    │   │
│  │ 2 CTAs +        │  │ (5 cards         │   │
│  │ Stats           │  │  animándose)     │   │
│  └────────────────┘  └──────────────────┘   │
├─────────────────────────────────────────────┤
│  TRUST BAR                                  │
│  UNLP · 6,500+ estudiantes · 1° y 3° año · │
│  IA adaptativa · Modelos 3D                 │
├─────────────────────────────────────────────┤
│  EL PROBLEMA (fondo claro)                  │
│  "Estudiar medicina en la UNLP es difícil.  │
│  No tiene por qué serlo."                   │
│  4 pain points en grid 2x2                  │
├─────────────────────────────────────────────┤
│  DIFERENCIALES — BENTO GRID (fondo claro)   │
│  ┌──────────┬────────┐                      │
│  │ Tutor IA │ Motor  │                      │
│  │ de voz   │ FSRS+  │                      │
│  │ (hero)   │ BKT    │                      │
│  ├──────────┤ (tall) │                      │
│  │ WhatsApp │        │                      │
│  ├──────────┴────────┤                      │
│  │ Knowledge Graph   │                      │
│  │ (wide)            │                      │
│  ├─────────┬─────────┤                      │
│  │ PDF→    │ Gamifi- │                      │
│  │ Flash   │ cación  │                      │
│  ├─────────┴─────────┤                      │
│  │ Predictor (dark)  │                      │
│  └───────────────────┘                      │
├─────────────────────────────────────────────┤
│  FUNCIONALIDADES — Grid 3x2                 │
│  Resúmenes · Flashcards SRS · Quiz IA ·    │
│  Modelos 3D · Videos · Dashboard            │
├─────────────────────────────────────────────┤
│  CÓMO FUNCIONA — 3 pasos                   │
│  01 Elegís la materia                       │
│  02 La IA se adapta a vos                   │
│  03 Llegás preparado al examen              │
├─────────────────────────────────────────────┤
│  MATERIAS — Grid 4 cols                     │
│  Anatomía (live) · Histología (live) ·      │
│  Biología (live) · Microbiología (live) ·   │
│  + próximamente                             │
├─────────────────────────────────────────────┤
│  PRECIOS + SOCIAL PROOF (testimonios acá)   │
│  Plan gratuito | Plan Pro (featured)        │
│  "Aprobé Anatomía en el primer parcial"     │
│  — María, 2do año                           │
├─────────────────────────────────────────────┤
│  FUNDADOR + TESTIMONIOS ESTUDIANTES         │
│  Cita del fundador + 2-3 citas de alumnos   │
├─────────────────────────────────────────────┤
│  CTA FINAL (waitlist / registro)            │
│  Con urgencia: "X lugares disponibles"      │
├─────────────────────────────────────────────┤
│  FOOTER                                     │
│  Links · Legal · Redes · © 2026             │
└─────────────────────────────────────────────┘
```

---

## 6. RE-AUDITORÍA — Lo que se validó y lo que se corrigió

### Validado ✓
- Los 10 patrones de conversión se sostienen con múltiples fuentes
- DM Serif Display + DM Sans: buena combinación, no genérica
- Bento grid funciona para Axon pero necesita stacking order específico en mobile
- Trust bar UNLP ya es fuerte
- ScrollTimeline: Safari 26+ (shipped 2025), Chrome 115+, Edge 115+ — soporte amplio

### Corregido ✗→✓
- **Scroll-linked video:** no es problemático si es un video CORTO (3-4s). El peso es manejable (3-5MB spritesheet). Argentina tiene 58 Mbps mobile promedio — carga en <1 segundo
- **"Falta video":** en vez de un screencast genérico, el video de Gemini con personajes animados es 100x más impactante y no requiere que el producto esté terminado
- **Idioma:** era portugués, ahora TODO pasa a español (decisión confirmada)
- **UX copy review:** ahora será en español, no en portugués

### Alertas del abogado del diablo
- **Cognitive overload en hero:** 5 elementos animados simultáneamente. Solución: staggered activation (uno a uno con delay)
- **Mobile hero:** el video scroll-linked podría no sentirse fluido en Android. Solución: fallback a autoplay normal en mobile
- **Producción del video:** la calidad de las imágenes de Gemini determina todo. Iterar imagen 1 primero hasta que esté perfecta

---

## 7. IDEAS EXTRA (para considerar)

### Alta prioridad
1. **Demo interactivo inline** — flashcard real que se voltea en la landing. 89% de visitantes interactúan con demos en landing pages. Podría ir en la sección de funcionalidades.
2. **Scroll-driven CSS animations** en el bento de diferenciales — barras de BKT que se llenan, nodos que se conectan, mientras el usuario scrollea. CSS puro, cero peso extra.
3. **"Diagnóstico rápido" como lead magnet** — "Respondé 3 preguntas de Anatomía y te mostramos qué tan preparado estás." Resultado con barras BKT. Para ver resultado completo: registrate.

### Media prioridad
4. **Testimonios contextuales** — una frase de estudiante dentro de cada feature card del bento, no en sección separada.
5. **Calculadora de ahorro en pricing** — "¿Cuánto gastás en fotocopias + clases particulares?" → "Con Axon ahorrás X por semestre."
6. **Sticky CTA** — botón flotante "Empezar gratis" que aparece después de scrollear pasado el hero.

### Baja prioridad (polish)
7. **Carrusel swipeable en mobile** para las cards del hero (en vez de scroll vertical)
8. **Typing effect** en la burbuja del tutor de voz
9. **Counter animado** en las stats del hero

---

## 8. DESIGN SYSTEM

```css
:root {
  /* Brand */
  --brand:       #1B3B36;
  --brand-mid:   #244e47;
  --accent:      #2a8c7a;
  --accent-light:#2dd4a8;
  --accent-pale: #ccfbf1;
  --dark-panel:  #1a2e2a;

  /* Backgrounds */
  --bg:          #F0F2F5;
  --bg-card:     #FFFFFF;

  /* Text */
  --text:        #1a1a1a;
  --text-title:  #111827;
  --text-muted:  #6b7280;
  --text-light:  #9ca3af;

  /* Borders & Shadows */
  --border:      #e5e7eb;
  /* Cards: border-radius 14-20px */
  /* Badges/pills: border-radius 100px */
  /* Shadow default: 0 2px 12px rgba(0,0,0,0.06) */
  /* Shadow hover: 0 8px 24px rgba(0,0,0,0.1) */

  /* Subject colors */
  --micro-bg:#ede9fe; --micro-fg:#7c3aed;
  --bio-bg:#d1fae5;   --bio-fg:#059669;
  --histo-bg:#e0f2fe; --histo-fg:#0284c7;
  --anat-bg:#ffe4e6;  --anat-fg:#e11d48;
}

/* Fonts */
font-family: 'DM Serif Display', serif; /* Headlines */
font-family: 'DM Sans', sans-serif;     /* Body */
```

---

## 9. HERRAMIENTAS Y SKILLS DISPONIBLES

### Para producción del video
- **Gemini Image Generation** → frames iniciales y finales
- **Gemini Video Generation** → video intermedio (3-4s)
- **ffmpeg** → encoding optimizado si se usa MP4 (`-g 2` para keyframes densos)

### Para implementación web
- **web-artifacts-builder** (skill) → React + Tailwind + shadcn/ui para prototipo complejo
- **frontend-design** (repo Anthropic skills) → guía anti-AI-slop, composición, motion
- **theme-factory** (skill) → aplicar tema coherente

### Para revisión de calidad
- **design-critique** (skill) → feedback estructurado de usabilidad
- **ux-copy** (skill) → pulir CTAs y microcopy en español
- **accessibility-review** (skill) → WCAG 2.1 AA antes de publicar
- **Figma MCP** → conectado, disponible para mockups
- **Canva MCP** → conectado, disponible para diseño

### Para investigación
- **Tavily** → crawling, scraping, research de competidores
- **WebSearch** → búsquedas rápidas de tendencias

---

## 10. PRÓXIMOS PASOS (en orden)

### Fase 0 — Preparación
- [ ] Petrick genera el video con Gemini (usando los prompts de sección 4)
- [ ] Iterar hasta tener las imágenes y el video con calidad satisfactoria

### Fase 1 — Prototipo HTML
- [ ] Crear landing versión C en español
- [ ] Implementar hero con placeholder para el video scroll-linked
- [ ] Bento grid de diferenciales con demos visuales
- [ ] Todas las secciones según estructura (sección 5)
- [ ] Aplicar principios de frontend-design del repo Anthropic

### Fase 2 — Integración del video
- [ ] Convertir video de Gemini a spritesheet WebP
- [ ] Implementar scroll-scrubbing con canvas
- [ ] Fallback mobile (autoplay o static)
- [ ] Testear performance en 4G Argentina

### Fase 3 — Revisión de calidad
- [ ] Design critique con la skill
- [ ] UX copy review en español
- [ ] Accessibility review WCAG 2.1 AA
- [ ] Test en dispositivos: iPhone SE, Android mid-range, desktop

### Fase 4 — Deploy
- [ ] Integrar en el frontend de Axon (repo: Matraca130/numero1_sseki_2325_55)
- [ ] Feature branch: `feat/landing-v3-institutional`
- [ ] PR para review

---

## FUENTES

- [Evil Martians: 100 dev tool landing pages](https://evilmartians.com/chronicles/we-studied-100-devtool-landing-pages-here-is-what-actually-works-in-2025)
- [Unbounce: 40 Best Landing Page Examples 2026](https://unbounce.com/landing-page-examples/best-landing-page-examples/)
- [SwipePages: Education Landing Pages 2026](https://swipepages.com/blog/11-best-education-landing-page-examples-of-2026/)
- [SaaSFrame: 10 Landing Page Trends 2026](https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples)
- [WebKit: Scroll-driven Animations](https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/)
- [CSS-Tricks: Apple-style scroll animation](https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/)
- [Geyer.dev: CSS spritesheet scroll animations](https://geyer.dev/blog/css-image-sequence-animations/)
- [Argentina internet speed (SpeedGeo)](https://www.speedgeo.net/statistics/argentina)
- [Duolingo conversion (Paddle)](https://www.paddle.com/studios/shows/fix-that-funnel/duolingo)
- [HowdyGo: 89% interactive demo engagement](https://www.howdygo.com/blog/interactive-product-demo-examples)
- [Lottie animations guide](https://inside.cowrywise.com/article/lightweight-dynamic-web-animations-a-guide-to-lottie)
