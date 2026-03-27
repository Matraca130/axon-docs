# Auditoría Completa — landing-institucional-v4.html
**Fecha:** 2026-03-27 | **Archivo:** 1326 líneas | **3 auditorías paralelas**

---

## EXECUTIVE SUMMARY

La landing v4 tiene diseño sofisticado (scroll-linked hero, bento grid interactivo, grain texture, SVG icons) pero presenta **gaps críticos** en accesibilidad, SEO técnico, y performance móvil que deben resolverse antes del deploy. El sitio tiene una ventaja competitiva enorme: **ningún competidor (Anki, Lecturio, Osmosis) apunta al mercado argentino/UNLP** — si se corrige SEO y a11y, Axon puede dominar ese nicho.

### Top 5 Prioridades
1. **Menú hamburguesa mobile** — nav desaparece en <900px sin reemplazo
2. **Schema.org JSON-LD** — zero structured data = invisible para rich snippets
3. **Focus states + keyboard a11y** — violación WCAG 2.4.7
4. **Open Graph + canonical + robots meta** — sin esto, social sharing y crawling débiles
5. **Carga progresiva de frames** — 184 AVIF eager = 28MB bloqueante

---

## I. DESIGN CRITIQUE

### 1. First Impression (2-Second Test)
- **Eye draw:** Hero overlay gradient → título "Estudiá medicina de otro modo" → CTA verde
- **Emotional reaction:** Profesional, moderno, propositivo. No se siente genérico.
- **Purpose clarity:** SÍ — en 2 segundos se entiende "plataforma de aprendizaje para medicina"
- **Rating: 8.5/10** — Falta: hamburger nav mobile, social proof inmediato

### 2. Usability — Sección por Sección

#### NAV
| Finding | Severity | Detail |
|---------|----------|--------|
| Sin menú hamburguesa | 🔴 CRITICAL | `.nav-links { display: none }` en <900px sin alternativa. Mobile users no pueden navegar. |
| Sin focus states | 🔴 CRITICAL | Ningún `:focus-visible` definido. Keyboard users bloqueados. |
| Nav transition hardcoded | 🟡 MEDIUM | `window.scrollY > window.innerHeight * 4` no se adapta a viewport resize. Usar IntersectionObserver. |
| CTA inconsistencia | 🟡 MEDIUM | Nav dice "Empezar gratis" (infinitivo), hero dice "Empezá gratis" (voseo). Estandarizar a "Empezá". |

#### HERO (Scroll-linked Canvas)
| Finding | Severity | Detail |
|---------|----------|--------|
| 500vh scroll container | 🟡 MEDIUM | ~5400px de scroll antes del siguiente contenido. Puede frustrar en mobile. Reducir a 350-400vh. |
| Stats placeholder | 🔴 CRITICAL | "X,XXX", "XX%", "XXk+" destruyen credibilidad instantáneamente. |
| Terminal cards no keyboard-accessible | 🟠 HIGH | Flashcard flip y quiz no tienen `tabindex`, `role="button"`, ni keyboard handlers. |
| Preloader sin timeout | 🟠 HIGH | Si red es lenta, preloader cuelga indefinidamente. Agregar timeout de 15s. |
| prefers-reduced-motion no cubre JS | 🟡 MEDIUM | Canvas sigue animando en scroll. Detectar `matchMedia` y mostrar imagen estática. |

#### TRUST BAR
| Finding | Severity | Detail |
|---------|----------|--------|
| "UNLP Facultad de Ciencias Médicas" ambiguo | 🟠 HIGH | ¿Es endorsement oficial o targeting language? Si no hay acuerdo formal, cambiar a "Hecho para estudiantes de la UNLP". |
| Mix de trust + features | 🟢 LOW | "IA adaptativa" y "Modelos 3D" son features, no trust signals. Separar. |

#### PROBLEMA
| Finding | Severity | Detail |
|---------|----------|--------|
| Pain points relevantes | ✅ GOOD | Costos, tiempo, materiales dispersos, ansiedad = dolores reales de estudiantes UNLP. |
| Grid asimétrico 1.1fr/0.9fr | ✅ GOOD | Crea tensión visual sutil. Funciona. |
| Hover border animation invisible en mobile | 🟢 LOW | Progressive enhancement aceptable. |

#### BENTO GRID (Diferenciales)
| Finding | Severity | Detail |
|---------|----------|--------|
| 7 cards = cognitive load | 🟡 MEDIUM | Borderline aceptable gracias al hero card que ancla. Considerar reducir a 5-6. |
| "En roadmap" en predictor | 🟡 MEDIUM | Feature no construida en landing page puede reducir confianza. Mover a "Próximamente" separado. |
| Demos interactivos | ✅ EXCELLENT | WhatsApp mock, BKT bars, knowledge graph SVG, voice wave — demuestran producto, no solo describen. |
| Headline diferenciador fuerte | ✅ EXCELLENT | "Otras plataformas rastrean tus clics. Axon rastrea tu comprensión." — memorable. |

#### FEATURES
| Finding | Severity | Detail |
|---------|----------|--------|
| Redundancia con bento | 🟡 MEDIUM | Ambas secciones describen features. Bento = HOW, Features = WHAT — algo redundante. |
| Offset row 2 (translateX 20px) | 🟢 LOW | Asimetría intencional. Funciona pero es muy sutil. |
| "Sin vueltas" colloquial | ✅ GOOD | Apropiado para target audience argentino. |

#### CÓMO FUNCIONA
| Finding | Severity | Detail |
|---------|----------|--------|
| Left column vacía | 🟡 MEDIUM | Solo texto, sin screenshot/mockup. Se siente desbalanceado. Agregar visual. |
| Step descriptions vagas | 🟢 LOW | "Elegís la materia y empezás" no explica UX real. Agregar screenshot o micro-demo. |

#### MATERIAS
| Finding | Severity | Detail |
|---------|----------|--------|
| Progress bars sin legend | 🟡 MEDIUM | ¿Qué representan los %? Content coverage? Student progress? Ambiguo. |
| "Votá la próxima" sin mecanismo | 🟢 LOW | No hay forma visible de votar. Link muerto. |
| Opacity 55% para upcoming | ✅ GOOD | Diferenciación clara entre disponible y próximamente. |

#### PRECIOS
| Finding | Severity | Detail |
|---------|----------|--------|
| Precio placeholder "ARS XXX" | 🔴 CRITICAL | Sin precio, imposible convertir. |
| Framing "2 min de clase particular" | ✅ EXCELLENT | Anchoring strategy brillante. |
| Free vs Pro diferenciación | ✅ GOOD | Checkmarks vs dashes, hierarchy clara. |

#### TESTIMONIAL
| Finding | Severity | Detail |
|---------|----------|--------|
| Placeholder quote | 🟠 HIGH | "Placeholder, 2° año" destruye social proof. Necesita real. |
| Single testimonial | 🟡 MEDIUM | 1 quote es débil. Idealmente 3+ diversas (diferentes años, materias). |

#### FUNDADOR
| Finding | Severity | Detail |
|---------|----------|--------|
| Avatar placeholder SVG | 🟠 HIGH | Icon genérico reduce confianza. Foto real de Petrick esencial. |
| Quote compelling | ✅ GOOD | Origen story relatable para target. |

#### CTA FINAL
| Finding | Severity | Detail |
|---------|----------|--------|
| 🔥 emoji inconsistente | 🟡 MEDIUM | Única emoji en página que usa SVG icons. Reemplazar con SVG o eliminar. |
| "Tu email de la UNLP" restrictivo | 🟡 MEDIUM | Excluye prospectos sin email UNLP. Aceptar cualquier email. |
| Form sin label | 🟠 HIGH | Solo placeholder, sin `<label>`. Screen readers no identifican el campo. |

#### FOOTER
| Finding | Severity | Detail |
|---------|----------|--------|
| Links todos href="#" | 🟡 MEDIUM | Necesitan URLs reales antes de deploy. |
| Sin redes sociales | 🟢 LOW | Agregar Instagram, TikTok (canales del target). |

### 3. Visual Hierarchy
- **Eye flow:** Nav logo → Hero title → CTA → Stats → Terminal cards → Trust bar → Pain → Bento → Features → Steps → Materias → Pricing → Founder → Final CTA
- **Assessment:** Sigue arco natural de discovery → proof → pricing → conversion. ✅ GOOD
- **Typography scale fragmented:** 12+ font-sizes diferentes (0.62rem a 4.2rem). Consolidar a 8 pasos.

### 4. Consistency Issues

| Element | Values Found | Recommendation |
|---------|-------------|---------------|
| Border-radius | 8, 10, 12, 14, 16, 20, 100px | Consolidar a 8, 12, 16, 100px |
| Button padding | 14px 32px, 0.5rem 1.2rem, 0.9rem, 0.72rem 1.4rem | Crear tokens: --btn-sm, --btn-md, --btn-lg |
| Icon container | 44px, 40px, 38px | Estandarizar a 44px |
| Card border-radius | 16px (pain, feat, materia) vs 20px (bento, price) | Estandarizar a 16px |
| Font sizes | 0.62, 0.65, 0.68, 0.7, 0.72, 0.75, 0.78, 0.8, 0.82, 0.85, 0.87, 0.88, 0.9, 0.95rem | Reducir a: 0.65, 0.75, 0.85, 0.95rem |
| Shadow system | 6+ variantes de opacity | Definir 3 niveles: subtle, medium, heavy |

### 5. Accessibility Deep Dive

| Check | Status | Detail |
|-------|--------|--------|
| Color contrast hero stats | 🔴 FAIL | `rgba(245,245,245,0.45)` = ~1.4:1 ratio |
| Color contrast scroll indicator | 🔴 FAIL | `rgba(245,245,245,0.35)` = ~0.8:1 ratio |
| Color contrast --text-light | 🔴 FAIL | #9ca3af on white = ~3.0:1 (need 4.5:1) |
| Color contrast trust bar text | 🔴 FAIL | #8fbfb3 on #1B3B36 = ~1.3:1 |
| Focus indicators | 🔴 FAIL | Zero `:focus-visible` styles |
| Form label | 🔴 FAIL | Input sin `<label>` ni `aria-label` |
| Keyboard nav terminal cards | 🔴 FAIL | No tabindex, no role, no keyboard handlers |
| `<main>` landmark | 🟠 MISSING | Sections sin wrapper semántico |
| Skip-to-content link | 🟠 MISSING | No hay forma de saltar nav |
| prefers-reduced-motion JS | 🟠 PARTIAL | CSS cubierto, JS canvas no |
| lang attribute | ✅ PASS | `lang="es"` correcto |
| Heading hierarchy | ✅ PASS | h1 → h2 → h3 correcto |
| Canvas aria-label | ✅ PASS | Descriptivo y presente |

### 6. Conversion Optimization
- **CTA count:** ~15 interactive elements, 5 direct conversion CTAs
- **CTA copy inconsistente:** "Empezar" (infinitivo) vs "Empezá" (voseo argentino). Estandarizar a "Empezá".
- **Urgency:** Baja — apropiado para estudiantes de medicina (no son compradores impulsivos)
- **Trust signals:** Débiles — placeholders en stats, testimonial, avatar fundador
- **Form friction:** Baja (1 campo) pero "email UNLP" puede ser restrictivo
- **Mobile conversion path:** ROTO — sin nav mobile, scroll lineal obligatorio

### 7. Lo Que Funciona Bien
1. Scroll-linked hero animation — técnicamente impresionante y memorable
2. Terminal card reveals con demos interactivos (flashcard flip, quiz, tutor wave)
3. Español argentino nativo ("Sin vueltas", "Elegís", "Votá") — no se siente traducido
4. Pain points específicos y relevantes para UNLP
5. Bento grid asimétrico con demos interactivos
6. Founder story compelling y contextual
7. Sistema tipográfico DM Serif + DM Sans + JetBrains Mono — sofisticado
8. Paleta de colores calmada y médica (teal-green brand)
9. Grain texture sutil (opacity 0.025) — anti-flat, anti-AI-slop
10. Section labels consistentes (monospace, uppercase, con línea decorativa)
11. Pricing framing "2 min de clase particular" — anchoring brillante
12. Responsive design sin breaks mayores hasta 640px

---

## II. SEO AUDIT

### On-Page SEO

| Element | Status | Current | Recommendation |
|---------|--------|---------|---------------|
| Title tag | ✅ GOOD | "Axon Medical Academy — Estudiá medicina de otro modo" (53 chars) | OK. Podría agregar "UNLP" |
| Meta description | 🟡 MEDIUM | 149 chars, keywords presentes | Agregar CTA: "Prueba gratis hoy" |
| H1 | ✅ GOOD | 1 H1, incluye "medicina" | OK |
| H2 hierarchy | 🟡 MEDIUM | 7 H2s sin keywords secundarios | Agregar "UNLP", "repetición espaciada" en H2s |
| Open Graph tags | 🔴 MISSING | Zero OG/Twitter cards | Agregar og:title, og:description, og:image, twitter:card |
| Canonical tag | 🔴 MISSING | No `<link rel="canonical">` | Agregar antes de deploy |
| Schema.org JSON-LD | 🔴 MISSING | Zero structured data | Implementar EducationalOrganization, Course, Product, FAQPage |
| Robots meta | 🟢 OK | Implicit allow (default) | Formalizar con meta tag explícito |
| Internal links | 🟡 MEDIUM | Footer links todos `href="#"` | Necesitan URLs reales |
| Image alt text | ✅ GOOD | Canvas aria-label, KG SVG aria-label | Adecuado para diseño actual |
| lang attribute | ✅ GOOD | `lang="es"` | Considerar `lang="es-AR"` |

### Keyword Coverage

| Keyword Cluster | Est. Searches/mes | Competition | Page Coverage | Gap |
|----------------|-------------------|-------------|--------------|-----|
| estudiar medicina UNLP | 500-800 | MEDIUM | ✗ Débil | Agregar en H2 y body |
| flashcards medicina | 800-1500 | HIGH | ✅ Buena (29 mentions) | — |
| repetición espaciada medicina | 300-600 | MEDIUM | ✗ Muy débil (3 mentions) | Dedicar H2 |
| aprobar anatomía UNLP | 400-800 | MEDIUM | ✗ ZERO | Content gap crítico |
| parcial medicina UNLP | 500-900 | MEDIUM | ✗ ZERO | Content gap crítico |
| tutor IA medicina | 300-600 | MEDIUM | 🟡 Moderada | Reforzar |
| anki medicina español | 600-1000 | HIGH | ✗ ZERO | Comparison page needed |
| mejor app flashcards medicina | 400-800 | MEDIUM-HIGH | ✗ ZERO | Blog post needed |
| FSRS v4 / BKT v4 | 100-300 | LOW | ✗ ZERO | Educational content |
| medicina la plata | 300-500 | LOW | ✗ ZERO | Local SEO gap |

### Technical SEO

| Check | Status | Detail |
|-------|--------|--------|
| Page speed (fonts) | 🟠 HIGH | 3 Google Font families ~260KB. Self-host o subset. |
| Page speed (frames) | 🟠 HIGH | 184 AVIF eager load ~28MB. Progressive loading needed. |
| Mobile-friendly | ✅ GOOD | viewport meta, clamp(), responsive grids |
| Core Web Vitals LCP | 🟡 MEDIUM | Canvas preload puede demorar LCP >2.5s |
| Core Web Vitals CLS | 🟡 MEDIUM | Font swap puede causar layout shift |
| Structured data | 🔴 CRITICAL | ZERO schemas implementados |
| robots.txt | 🟡 N/A | Single page, no aplica aún |
| sitemap.xml | 🟡 N/A | Necesario para multi-page Phase 2 |
| HTTPS | ✅ OK | Vercel maneja automáticamente |
| Render-blocking | ✅ GOOD | CSS inline, JS al final |

### Content Gaps

| Missing Content | Impact | Priority | Effort |
|----------------|--------|----------|--------|
| FAQ section (PAA optimization) | HIGH | 🔴 CRITICAL | 2-3 horas |
| "Aprobar Anatomía UNLP" blog post | HIGH | 🟠 HIGH | 1 día |
| "Axon vs Anki" comparison page | HIGH | 🟠 HIGH | medio día |
| Course pages individuales (/materias/anatomia) | HIGH | 🟠 HIGH | 2-3 días |
| Student testimonials reales | MEDIUM | 🟠 HIGH | 1 semana (recolectar) |
| "FSRS vs SM-2" explainer | MEDIUM | 🟡 MEDIUM | medio día |
| Glossary médico | MEDIUM | 🟡 MEDIUM | 2-3 días |

### Competitor Analysis

| Dimension | Axon | Anki | Lecturio | Osmosis |
|-----------|------|------|----------|---------|
| Target market | UNLP Argentina 🏆 | Global | USMLE/ENARM | USMLE |
| Local keywords | Oportunidad ENORME | Zero | Zero | Zero |
| Schema markup | ✗ Missing | ✗ None | ✓ Likely | ✓ Likely |
| Spanish content | ✓ Nativo argentino | ✗ Community | ✗ Minimal | ✗ None |
| AI features | ✓ FSRS+BKT+Voice | ✗ SM-2 only | ✓ Basic | ✓ Basic |
| Backlinks | To build | Millions | High | High |

**Ventaja competitiva clave:** Ningún competidor apunta al mercado argentino/UNLP. Axon puede construir moat de SEO local antes de que los grandes lo noten.

---

## III. PERFORMANCE AUDIT (resumen de auditoría anterior)

| Issue | Severity | Fix |
|-------|----------|-----|
| backdrop-filter mobile | 🔴 CRITICAL | Disable en <768px, usar bg sólido |
| 184 frames eager load | 🟠 HIGH | Load first 30, rest in background |
| 20 animaciones simultáneas | 🟡 MEDIUM | Stagger starts, box-shadow pulse no es GPU-accel |
| 400vh mobile scroll | 🟡 MEDIUM | Reducir a 300vh |
| ~260KB fonts | 🟡 MEDIUM | Self-host, subset, preload |
| overflow-x:hidden iOS | 🟡 MEDIUM | Usar `contain: layout` |
| Canvas 3x DPR memory | 🟢 LOW | Cap DPR at 2 |
| z-index 9999 grain | 🟢 LOW | Reducir a 100, documentar hierarchy |

---

## IV. PRIORITIZED ACTION PLAN

### Quick Wins (esta semana, <2h cada uno)

| # | Fix | Impact |
|---|-----|--------|
| 1 | Agregar hamburger menu mobile | 🔴 CRITICAL — mobile UX roto |
| 2 | Agregar `:focus-visible` styles | 🔴 CRITICAL — WCAG violation |
| 3 | Agregar OG tags + canonical + robots meta | 🟠 HIGH — social sharing + crawling |
| 4 | Agregar `<label>` al form input | 🟠 HIGH — a11y |
| 5 | Remover 🔥 emoji del waitlist counter | 🟡 MEDIUM — consistencia |
| 6 | Fix color contrast (5 fallos) | 🟠 HIGH — WCAG AA |
| 7 | Agregar skip-to-content link | 🟡 MEDIUM — a11y |
| 8 | Estandarizar CTA copy a "Empezá" (voseo) | 🟡 MEDIUM — conversion |
| 9 | Agregar meta description CTA | 🟢 LOW — CTR improvement |
| 10 | Cambiar `lang="es"` a `lang="es-AR"` | 🟢 LOW — local targeting |

### Strategic Investments (antes de launch)

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| 1 | Implementar Schema.org JSON-LD (5 schemas) | 🔴 CRITICAL | 1 día |
| 2 | Progressive frame loading (30 first, rest bg) | 🟠 HIGH | medio día |
| 3 | Keyboard a11y en terminal cards | 🟠 HIGH | 2-3 horas |
| 4 | Self-host fonts + preload | 🟡 MEDIUM | 2 horas |
| 5 | Agregar FAQ section con FAQPage schema | 🟠 HIGH | medio día |
| 6 | Design tokens (border-radius, buttons, shadows) | 🟡 MEDIUM | medio día |
| 7 | Disable backdrop-filter mobile | 🟡 MEDIUM | 30 min |
| 8 | Agregar `<main>` landmark | 🟢 LOW | 10 min |

### Phase 2 (post-launch)

| # | Initiative | Impact |
|---|-----------|--------|
| 1 | Multi-page site: /materias/, /blog/, /faq/, /comparacion/ | 🔴 SEO growth engine |
| 2 | Blog: "Aprobar Anatomía UNLP", "FSRS vs Anki", "Flashcards medicina" | 🟠 Organic traffic |
| 3 | Real testimonials + Review schema | 🟠 E-E-A-T + conversion |
| 4 | Backlink outreach: UNLP, med blogs, YouTube | 🟡 Domain authority |
| 5 | Google Search Console + GA4 tracking | 🟠 Data foundation |

---

## V. SCHEMA.ORG TEMPLATES (ready to implement)

### EducationalOrganization
```json
{
  "@context": "https://schema.org/",
  "@type": "EducationalOrganization",
  "name": "Axon Medical Academy",
  "url": "https://axon.edu.ar/",
  "description": "Plataforma de aprendizaje inteligente para estudiantes de medicina de la UNLP",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "La Plata",
    "addressRegion": "Buenos Aires",
    "addressCountry": "AR"
  },
  "founder": {
    "@type": "Person",
    "name": "Petrick"
  }
}
```

### Course (por materia)
```json
{
  "@context": "https://schema.org/",
  "@type": "Course",
  "name": "Anatomía — Axon Medical Academy",
  "description": "Flashcards inteligentes, quizzes adaptativos y tutor IA para Anatomía I de la UNLP",
  "provider": { "@type": "Organization", "name": "Axon Medical Academy" },
  "educationalLevel": "1° Año Medicina",
  "inLanguage": "es-AR"
}
```

### Product (pricing)
```json
{
  "@context": "https://schema.org/",
  "@type": "SoftwareApplication",
  "name": "Axon Medical Academy",
  "applicationCategory": "EducationalApplication",
  "offers": [
    { "@type": "Offer", "name": "Free", "price": "0", "priceCurrency": "ARS" },
    { "@type": "Offer", "name": "Pro", "price": "XXX", "priceCurrency": "ARS" }
  ]
}
```

---

*Generado por 3 auditorías paralelas: Design Critique, SEO Audit, Performance Audit*
