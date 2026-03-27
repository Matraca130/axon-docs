# Landing Page v3

**Status:** En desarrollo activo
**Branch:** `feat/landing-v3-institutional`
**Repo:** `Matraca130/numero1_sseki_2325_55` (frontend)

## Decisiones clave
- Idioma: **español** (target: estudiantes UNLP Argentina)
- Base: Versión B (bento grid), evolucionando a Versión C
- Hero: video 3-4s generado con Gemini, scroll-linked como spritesheet WebP
- Fondo: `#1B3B36` (brand color)
- Tipografía: DM Serif Display (headlines) + DM Sans (body)

## Hero — 5 cards animadas
1. Calavera 3D
2. Flashcard flip
3. Quiz + profesor
4. Calendario orbital
5. Knowledge graph (nodos)

## Estructura CCA (orden de secciones)
Hero → Trust → Problema → Features → Social Proof → Pricing → CTA

## Specs técnicas
- Spritesheet WebP: ~3-5MB, 58 Mbps Argentina OK, carga <1s en 4G
- Fallback Android: autoplay normal (no scroll-linked)
- Cards: staggered activation para evitar cognitive overload

## Documento maestro
`docs/LANDING-PAGE-MASTER-PLAN.md` — prompts Gemini, estructura completa, re-auditorías
