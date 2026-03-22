# REPORTE QA + PERFORMANCE — AXON PLATFORM
**Fecha:** 2026-03-20
**Alcance:** 9 sesiones del codebase completo (Frontend + Backend)
**Metodologia:** Analisis estatico de codigo, sin modificaciones. Enfoque QA + Performance.

---

## RESUMEN EJECUTIVO

| Ronda | Sesion | CRITICAL | HIGH | MEDIUM | LOW |
|-------|--------|----------|------|--------|-----|
| 1 | Auth | 1 | 3 | 12 | 5 |
| 1 | Quiz | 4 | 8 | 12 | 4 |
| 1 | Flashcards | 6 | 8 | 18 | 4 |
| 2 | Study Hub | 1 | 8 | 10 | 5 |
| 2 | Dashboard | 3 | 5 | 8 | 4 |
| 2 | Gamification | 6 | 18 | 34 | 12 |
| 3 | Summaries | 3 | 5 | 14 | 2 |
| 3 | AI/RAG | 9 | 12 | 18+ | 8+ |
| 3 | Backend Infra | 0 | 6 | 18 | 27+ |
| **TOTAL** | | **33** | **73** | **144+** | **71+** |

---

## TOP 10 CRITICAL ISSUES (Cross-Session)

| # | Sesion | Issue | Impacto |
|---|--------|-------|---------|
| 1 | Quiz | Double BKT computation (frontend PATH A + backend PATH B) | Mastery scores 2x inflados |
| 2 | Gamification | `_incrementStudentStat` read-then-write race condition | Badges nunca se desbloquean |
| 3 | Gamification | Streak freeze buy double-spend (fallback JS no atomico) | XP puede ir negativo |
| 4 | Flashcards | `handleRate` double-fire sin guard en cards intermedias | Reviews duplicados, FSRS corrupto |
| 5 | AI/RAG | Token tracking streaming sobreescribe en vez de acumular | Billing/costos completamente incorrectos |
| 6 | Summaries | DELETE -> INSERT chunks sin transaction | RAG retorna 0 resultados temporalmente |
| 7 | AI/RAG | Prompt injection via history (sanitize DESPUES de augmentation) | LLM jailbreak posible |
| 8 | Auth | JWT stored unencrypted in localStorage | XSS -> robo de token |
| 9 | Flashcards | FSRS lapse stability clamp permite sf ~ S (sin penalizacion) | Lapses no castigan suficiente |
| 10 | Dashboard | `useMasteryOverviewData` dispara 1000+ requests a `/subtopics` | Servidor saturado, DoS self-inflicted |

---

## PATRONES RECURRENTES

1. **Race conditions read-then-write** — Auth, Gamification, Flashcards, Quiz (necesitan RPCs atomicos)
2. **Fire-and-forget sin retry** — Summaries hook, XP hooks, BKT updates
3. **N+1 / bulk request storms** — Dashboard (1000+ calls), Quiz preload (150+ calls), Gamification badges
4. **Falta de memoizacion** — Auth context re-renders 17+ consumers, Study Hub section cards, Dashboard charts
5. **Prompt injection surface** — History, profile JSON, summary content sin sanitizar antes de RAG
6. **Double computation** — BKT frontend+backend, badge Phase 1 + Phase 2

---

## PRIORIDADES DE FIX

- **Semana 1 (Blockers):** Issues #1-#4 (double BKT, race conditions, double-fire)
- **Semana 2 (Security):** Issues #5-#8 (token tracking, prompt injection, JWT storage)
- **Semana 3 (Performance):** Issues #9-#10 + bulk request storms + memoizacion

---

# SESION 1: AUTH

## Frontend

### AuthLayout.tsx
- Sin issues detectados. Arquitectura limpia.

### LoginPage.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QA-001 | QA | MEDIUM | Race condition en handleSubmit: `setLoading(false)` en multiples caminos (finally + early returns). Submit rapido puede causar inconsistencia de estado. |
| QA-002 | QA | MEDIUM | Email validation ausente — input tiene `type="email"` pero NO hay validacion real antes de enviar. |
| QA-003 | QA | MEDIUM | Manejo de error generico — sin informacion especifica del error, usuario no sabe que fallo. |
| QA-004 | QA | LOW | Password validation en signup (length < 8) sin feedback UX claro. |
| QA-005 | QA | LOW | switchMode() limpia fields pero NO resetea loading/error states en navegacion rapida. |
| PERF-001 | PERF | LOW | Background animation blur-3xl se procesa antes de ser visible en mobile. |
| PERF-002 | PERF | LOW | Motion animations en features list: 4 motion.div con delay generan re-renders rapidos. |
| SEC-001 | SEC | LOW | Password toggle sin autocomplete hints. |
| SEC-002 | SEC | LOW | Error messages exponen diferencias entre "user doesn't exist" vs "password wrong". |

### PostLoginRouter.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QA-006 | QA | HIGH | Fallback role fragil: `role || activeMembership?.role || institutions[0]?.role || memberships[0]?.role || 'student'`. Si institutions vacio pero memberships tiene datos, inconsistencia. |
| QA-007 | QA | MEDIUM | No hay loading state visual si `status === 'loading'`. |
| QA-008 | QA | MEDIUM | Condicion redundante institutions.length === 0 && memberships.length === 0 indica inconsistencia potencial. |
| SEC-004 | SEC | MEDIUM | ROLE_ROUTES hardcoded — unknown role silenciosamente fallback a '/student'. Permission bypass risk. |

### RequireAuth.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QA-009 | QA | MEDIUM | Si auth.status nunca deja 'loading' (servidor cuelga), spinner infinito sin timeout. |
| QA-010 | QA | LOW | Location restoration se pierde tras redirect si usuario sale y vuelve. |

### RequireRole.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QA-011 | QA | MEDIUM | Logica de role checking confusa entre activeMembership y selectedInstitution. |
| QA-012 | QA | LOW | No validacion de que roles array sea non-empty. roles={[]} siempre redirige. |
| SEC-005 | SEC | MEDIUM | Role check usa string inclusion sin explicit null checks. |

### SelectRolePage.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QA-013 | QA | MEDIUM | Auto-redirect si memberships.length === 1 pero NO auto-select. Gap si user edita antes de render. |
| QA-014 | QA | MEDIUM | Sync bug: setActiveMembership() luego selectInstitution() depende de institutions list async. |
| QA-015 | QA | MEDIUM | handleSignOut llama logout() async pero NO awaits. Navigate inmediato, race con localStorage cleanup. |
| PERF-005 | PERF | MEDIUM | 10+ memberships con motion.button animaciones puede causar jank en mobile. |

### AuthContext.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QA-016 | QA | HIGH | Profile load failure: fetchProfile() falla pero retorna null, loadSession() llama signOut(). Token en memory pero user null. |
| QA-017 | QA | MEDIUM | localStorage race: axon_active_membership escrito en selectInstitution() y loadSession(). Ultimo write gana. |
| QA-018 | QA | HIGH | Signup auto-login failure retorna success=true. Usuario no autenticado pero frontend navega. |
| QA-019 | QA | MEDIUM | Token sync via setApiToken() con timing issue si token cambia mid-render. |
| QA-020 | QA | MEDIUM | fetchProfile() error: log + retorna null silenciosamente. Sin retry, toda sesion se pierde. |
| PERF-007 | PERF | HIGH | Every useAuth() consumer re-renders cuando ANY auth state cambia. 17+ consumers afectados. Splitting context recomendado. |
| PERF-008 | PERF | MEDIUM | toMembership() en useMemo para derivar memberships: O(n) con 100 items. |
| PERF-009 | PERF | MEDIUM | fetchProfile/fetchInstitutions no deduped — multiples useEffect hooks pueden duplicar requests. |
| SEC-008 | SEC | CRITICAL | JWT stored unencrypted in localStorage. XSS = token robado. |
| SEC-010 | SEC | MEDIUM | Signup endpoint sin CSRF token. |
| SEC-013 | SEC | MEDIUM | Token rotation: dos tabs refresh simultaneo, race en _accessToken global. |

## Backend Auth

### auth-helpers.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QA-023 | QA | LOW | canAssignRole() returns boolean sin error context. |
| QA-024 | QA | LOW | ROLE_HIERARCHY manual — nuevo role requiere nivel manual. Sin validacion de completitud. |

### institutions.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QA-025 | QA | MEDIUM | POST /institutions: si owner membership falla, rollback tambien puede fallar. Sin retry. |
| QA-026 | QA | MEDIUM | GET /institutions: filtra inactive institutions pero NO inactive memberships. |
| QA-028 | QA | MEDIUM | DELETE solo soft-delete. Re-creacion con mismo slug sin uniqueness constraint check. |
| PERF-012 | PERF | MEDIUM | GET /institutions sin pagination. 100 institutions carga todo. |
| PERF-013 | PERF | MEDIUM | Filter post-fetch — DB retorna todas, filtra en application code. |
| SEC-017 | SEC | MEDIUM | POST sin validacion de name/slug length. 10MB string posible. |
| SEC-021 | SEC | MEDIUM | Response incluye owner_id — leaks info a cualquier member. |

### db.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QA-029 | QA | MEDIUM | verifyJwt(): network timeout en JWKS se reporta como "jwt_verification_failed" (401 en vez de 503). |
| PERF-014 | PERF | MEDIUM | JWKS fetch en cold start: 200-500ms. Sin pre-warming. |

### api.ts (Frontend)

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| PERF-016 | PERF | MEDIUM | GET deduplication: si uno falla, todos fallan. Sin fallback. |
| SEC-027 | SEC | MEDIUM | Token en localStorage — XSS vector. |

---

# SESION 2: QUIZ

## QuizView.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QV-01 | QA | CRITICAL | Perdida de datos en transicion selection -> session. State de quiz A heredado por quiz B si usuario vuelve atras. |
| QV-02 | QA | HIGH | ErrorBoundary solo envuelve QuizSelection, NO QuizTaker. Crash no manejado en fase 'session'. |
| QV-03 | QA | MEDIUM | handleBackToStudy no resetea estado local. Estado de sesion anterior persiste. |
| QV-P01 | PERF | MEDIUM | QuizTaker recibe props nuevas en cada render sin memoizacion. |

## QuizSelection.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QSE-01 | QA | CRITICAL | Race condition: handleSelectSummary con Promise.allSettled. Summary A resuelve DESPUES de B, sobreescribe datos. |
| QSE-02 | QA | MEDIUM | Sin validacion de preloadedQuestions vacio. Filtros persisten globalmente entre navegaciones. |
| QSE-03 | QA | MEDIUM | Preload summaries sin cancelacion. Requests huerfanas se acumulan al cambiar curso. |
| QSE-05 | QA | HIGH | onStart() NO se llama si quiz load falla. UI en estado inconsistente (boton enabled). |
| QSE-P01 | PERF | HIGH | Preload ALL topic summaries: 30 topics x 5 summaries = 150 API calls en paralelo. Sin throttle. |

## QuizOverview.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QOV-01 | QA | MEDIUM | nextRecommendedTopicId logica fragil si hay solo 1 section o 1 topic. |
| QOV-02 | DATA | MEDIUM | PLACEHOLDER_PROGRESS (75%, 60%...) no conectado a BKT real. Estudiante ve progreso falso. |

## QuizTaker.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QT-01 | QA | MEDIUM | Si createStudySession falla en Promise.all, loadAndNormalizeQuestions sigue ejecutandose. sessionId null en submitAnswer. |
| QT-02 | QA | MEDIUM | gamificationRefreshedRef nunca se resetea si phase = 'results' -> 'session' (repetir quiz). |
| QT-04 | QA | MEDIUM | pendingBackup no cleared si usuario selecciona "Continuar". Posible doble restauracion. |

## useQuizSession.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| US-01 | QA | CRITICAL | Race condition: submitAnswer + finishQuiz paralelos. 5 clicks en 1s = solo 1 answer persistida. |
| US-02 | QA | HIGH | savedAnswersRef.current vs setSavedAnswers desincronizacion. Component unmount entre ambos. |
| US-03 | QA | MEDIUM | checkAndProcessBackup retorna null sin warning. Progreso anterior descartado silenciosamente. |
| US-04 | QA | MEDIUM | loadKeywordNames falla silenciosamente (catch vacio). QuizResults muestra "Keyword kw-xxx". |
| US-05 | DATA | MEDIUM | BKT delta computation frontend no sincronizado con backend. Deltas pueden sumarse erroneamente. |

## useQuizBkt.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| BKT-01 | QA | MEDIUM | upsertBktState fire-and-forget. Si falla, BKT no se actualiza. Sin retry. |
| BKT-03 | QA | MEDIUM | Recovery factor nunca se aplica correctamente si prevMax > newP. |
| BKT-DI01 | DATA | HIGH | upsertBktState payload total_attempts siempre = 1. Backend espera acumulativo. |
| BKT-DI02 | DATA | CRITICAL | Frontend PATH A + Backend PATH B ambos llaman computeBktMastery. p_know se actualiza 2x. |

## Backend Quiz (batch-review.ts)

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| BR-01 | DATA | CRITICAL | Double BKT computation: Frontend + Backend ambos paths ejecutan. Mastery = 2x esperado. |
| BR-02 | DATA | CRITICAL | Missing deduplication guard. Sin idempotency key en bkt_states. |

## quiz-helpers.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QH-01 | QA | MEDIUM | checkAnswer open/fill_blank: `norm.includes(expected)` permite coincidencias parciales erroneas. |
| QH-03 | DATA | MEDIUM | PLACEHOLDER_PROGRESS hardcoded, nunca conectado a real BKT mastery. |

---

# SESION 3: FLASHCARDS

## FlashcardSessionScreen.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| FC-01 | QA | CRITICAL | Keyboard shortcut handler captura isRevealed stale. Re-mount causa rating cuando no deberia. |
| FC-02 | QA | HIGH | sessionStats[i] puede ser undefined en progress bar gradient. |
| FC-03 | QA | MEDIUM | Race condition en onBack: se llama mientras useFlashcardEngine aun procesa submitBatch. Perdida de reviews. |
| FC-P01 | PERF | HIGH | 20+ animaciones motion.div simultaneas sin virtualizacion. Jank despues de 50+ cards. |
| FC-P02 | PERF | HIGH | useMemo progressBarGradient recalcula en CADA rating. O(n^2) gradient string. |
| FC-P03 | PERF | MEDIUM | AnimatePresence mode="wait" bloquea render entre ratings (200-500ms en 3G). |

## ReviewSessionView.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| RV-01 | QA | CRITICAL | Race condition en buildDecksFromFsrs: tree cambia mientras itera. Decks con label 'unknown'. |
| RV-02 | QA | HIGH | getFsrsStates timeout sin reintentos. Falla = mock decks sin aviso. |
| RV-03 | QA | MEDIUM | Mock data fallback enmascarador de bugs. Error API silenciosamente ignorado. |
| RV-P01 | PERF | HIGH | O(n^3) lookup en buildDecksFromFsrs. 500+ cards = 500-2000ms render. |
| RV-D01 | DATA | MEDIUM | Ease factor reducer: `s.difficulty` sin `sum +`. avgDifficulty siempre ~ ultimo valor. |

## useFlashcardEngine.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| FE-01 | QA | CRITICAL | handleRate double-fire: isFinishingRef solo cubre ultima card. Click rapido = 2 reviews para misma tarjeta. |
| FE-02 | QA | HIGH | submitBatch puede fallar sin error UI. Usuario ve "Session complete" pero datos no guardados. |
| FE-03 | QA | HIGH | Grace period POST_PERSIST_GRACE_MS=400 hardcoded. Supabase lento = datos stale en SummaryScreen. |
| FE-P01 | PERF | MEDIUM | optimisticRef no limpiado entre sesiones. Memory leak en sesiones largas (500 cards x 10 restarts). |
| FE-D01 | DATA | HIGH | currentIndex incrementa via setTimeout sin validar que sesion sigue activa. Card 5 actualiza stats de card 3. |

## useReviewBatch.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| RB-01 | QA | MEDIUM | localStorage fallback puede perder datos en incognito mode sin notificacion. |
| RB-02 | QA | MEDIUM | Batch age check 24h arbitrario. Usuario que deja app abierta pierde datos al dia siguiente. |
| RB-P01 | PERF | MEDIUM | fallbackToIndividualPosts: 200 cards = 200 requests simultaneos. Sin concurrency limit. |

## fsrs-v4.ts (Backend)

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| FSRS-01 | DATA | CRITICAL | Grade multipliers w15=0.29 y w16=2.61 no validados contra spec v4.2. Hard-rated cards avanzan demasiado lento. |
| FSRS-02 | DATA | CRITICAL | Lapse stability: sf clamped a maximo S. Con D=1, sf ~ S, sin castigo suficiente por lapse. |
| FSRS-03 | DATA | HIGH | Rounding 4 decimales: imprecision acumulativa. 200+ reviews = 1% error. |
| FSRS-04 | DATA | MEDIUM | isRecovering flag pasado desde frontend no validado. Estudiante puede game el sistema. |

## FlashcardDeckScreen.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| FD-01 | QA | MEDIUM | toggleGroup mutation logica invertida: `if (next.has(groupId))` luego `next.add(groupId)`. |
| FD-02 | QA | MEDIUM | useEffect expandedGroups expande TODOS los grupos cada vez que cardGroups.length cambia. |
| FD-P01 | PERF | MEDIUM | cardGroups recalculation O(n) en cada render sin useMemo. |

## FlashcardMiniCard.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| FM-01 | PERF | MEDIUM | React.memo comparator no captura onClick cambios si es arrow function inline. Perdida de memoizacion. |

## FlashcardSummaryScreen.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| FS-01 | DATA | MEDIUM | realMasteryPercent fallback calcula (average/5)*100. average es ratings (1-5), no p_know (0-1). Mismatch. |

## batch-review.ts (Backend)

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| BR-PATH | DATA | CRITICAL | PATH A vs B detection ambiguo. Item con bkt_update=undefined puede ser PATH A cuando deberia ser B. |
| BR-LEECH | QA | HIGH | leechThreshold: loadLeechThreshold retorna DEFAULT si config error. Error DB silencioso. |
| BR-KW | PERF | HIGH | Keyword BKT propagation: N database queries por review. 100 items = 400 queries. |

---

# SESION 4: STUDY HUB

## StudyHubHero.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| SH-001 | PERF | HIGH | StudyPathCard re-renderiza en cada hover sin memoizacion. |
| SH-003 | QA | HIGH | defaultVideoImage y defaultSummaryImage son URLs externas (Unsplash). Sin fallback si CDN esta down. |
| SH-004 | DATA | MEDIUM | Math.round(heroProgress * 5) trunca a 5 segmentos. Off-by-one en visual. |
| SH-005 | QA | MEDIUM | useReducedMotion() importado pero NO respetado en hover animations. Accesibilidad comprometida. |

## StudyHubSectionCards.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| SC-001 | QA | CRITICAL | expandedSectionId permite SOLO 1 section pero grid tiene col-span-full. UX rota si 2+ secciones se expanden. |
| SC-002 | PERF | HIGH | SectionCard renderiza TODO el arbol de topics en expanded sin virtualizacion. 50+ topics = muy lento. |
| SC-005 | DATA | MEDIUM | progress = sp.progress / 100 asume 0-100. Si API retorna 0-1, off by 100x. |

## StudyDashboardsView.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| SD-001 | DATA | HIGH | String interpolation en heatmap colors: `bg-${c}-500` son DINAMICAS. Tailwind NO procesa clases dinamicas. Colores NO aparecen en produccion. |
| SD-002 | DATA | HIGH | ringOffset = Math.round((1 - avgPKnow) * 125) asume radio SVG 20. Si viewport cambia, incorrecto. |
| SD-003 | QA | HIGH | displayTasks muta estado sin race condition handling. bktStates y TODAY_TASKS llegan async. |
| SD-004 | PERF | HIGH | Grid 200-300 motion elements sin layoutId o key estable. Re-mount costoso. |
| SD-006 | DATA | MEDIUM | completionPct = reduce/length. Si bktStates vacio, NaN. |

## MasteryDashboardView.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| MD-001 | DATA | HIGH | Date parsing: `new Date(d.date + 'T12:00:00')` sin timezone. Calendar muestra dias incorrectos en algunos timezones. |
| MD-002 | QA | HIGH | Math.round(bktStates.reduce(..) / bktStates.length * 100). Si vacio, NaN. Usado en SVG sin null check. |
| MD-004 | QA | MEDIUM | Title hardcoded "Sexta-feira, 14" — no respeta fecha actual. |

## KnowledgeHeatmapView.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| KH-001 | DATA | HIGH | getHeatLevel() retorna 'high' si minutes >= 80. Mock y realData pueden divergir. |
| KH-002 | QA | MEDIUM | Popover position hardcoded. Puede salirse de pantalla en moviles. |
| KH-004 | QA | MEDIUM | criticalTopic puede ser null. downstream access a .topicTitle lanza error. |

## WeeklyActivityChart.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| WA-001 | PERF | MEDIUM | Motion.div en cada bar con stagger. 7 bars overhead innecesario vs SVG/CSS. |
| WA-002 | QA | MEDIUM | Si maxBarValue es 0, division by zero -> Infinity. |

## studyhub-helpers.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| SHH-001 | DATA | MEDIUM | new Date(isoDate).getTime() asume ISO valido. Algunos navegadores retornan UTC-1 sin hora explicita. |

---

# SESION 5: DASHBOARD

## DashboardCharts.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| DC-01 | PERF | HIGH | Sin React.memo() en ActivityChart y MasteryDonut. Recharts recalcula layout en cada render. |
| DC-02 | PERF | MEDIUM | Inline style objects en Tooltip.contentStyle generan nuevas referencias cada render. |

## DashboardStudyPlans.tsx / .responsive.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| DSP-01 | QA | CRITICAL | Race condition en todayTasks: new Date() captura hora actual CADA render. Tarea 23:59 desaparece a las 00:00 sin aviso. |
| DSP-02 | QA | MEDIUM | Sin validacion de plan.tasks siendo undefined/null. tasks: null lanza error. |
| DSP-03 | PERF | HIGH | Calculo de pct, todayTasks se repite en cada render del map sin useMemo. |
| DSP-04 | PERF | MEDIUM | toggleTaskComplete sin debounce. Click rapido 3x = 3 requests simultaneos. |
| DSP-05 | DATA | MEDIUM | todayTasks usa toDateString() que ignora timezone. Tareas incorrectas en Australia vs Japon. |

## ActivityHeatMap.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| AHM-01 | QA | MEDIUM | cursor.setDate() mutation 182 veces en loop. Fragil. Mejor new Date() cada iteracion. |
| AHM-02 | PERF | MEDIUM | useMemo incluye dataMap que cambia cada vez que data cambia. |

## MasteryOverview.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| MO-01 | QA | MEDIUM | Dropdown no se cierra al scroll. mousedown listener no captura scroll. |
| MO-02 | PERF | MEDIUM | grouped recalculo con sort O(n log n) en cada filtered change. 500+ keywords = lento. |

## useMasteryOverviewData.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| UMO-01 | QA | HIGH | Promise.all sin timeout. Servidor lento = loading: true indefinidamente. |
| UMO-02 | PERF | CRITICAL | Promise.all fetches ALL summaries de ALL topicos: 100 topicos = 100 requests simultaneos. |
| UMO-03 | PERF | CRITICAL | Promise.all para ALL summaries -> keywords: 200 summaries = 200 requests mas. |
| UMO-04 | PERF | CRITICAL | Promise.all para ALL keywords -> subtopics: 1000 keywords = 1000 requests. MATANDO EL SERVIDOR. |

## StatsCards.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| SC-01 | QA | MEDIUM | todayAccuracy es string (.toFixed), yesterdayAccuracy es number. Inconsistencia de tipo en diff. |
| SC-02 | PERF | MEDIUM | getDailyActivities sin debounce. Scroll/refocus rapido = 3+ requests. |

## StudyStreakCard.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| SSC-01 | DATA | MEDIUM | streak === longest === 0 muestra "Record personal!" cuando no es verdad. |

## KeywordRow.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| KR-01 | QA | MEDIUM | Boton "Repetir" solo tiene devLog(). Sin onClick handler implementado. Incompleto. |
| KR-02 | DATA | MEDIUM | Subtopics asumen orden por pKnow (weakest first). Si padre cambia orden, se rompe silenciosamente. |

---

# SESION 6: GAMIFICATION

## Backend: xp-hooks.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| XP-001 | DATA | CRITICAL | _incrementStudentStat: read-then-write no atomico. Dos reviews simultaneos pierden incrementos. total_reviews incorrecta -> badges nunca se desbloquean. |
| XP-002 | QA | HIGH | getBonusContext sin manejo de errores granular. FSRS/BKT bonus se pierde sin logging. |
| XP-003 | QA | HIGH | _awardPlanTaskXP: no valida null antes de acceder course.institution_id. 500 error si course_id corrupto. |
| XP-004 | QA | MEDIUM | xpHookForBatchReviews: fallback a sharedBonus sin logging si per-card fetch falla. |
| XP-005 | QA | MEDIUM | xpHookForSessionComplete: no valida que completed_at es ISO timestamp. |
| XP-P01 | PERF | HIGH | xpHookForBatchReviews chunking 10 items paralelo. 1000 items = 100 rounds secuenciales. Deberia ser 50+. |
| XP-D02 | SEC | HIGH | xpHookForBatchReviews no deduplica items repetidos. XP farming: cliente envia duplicados. |
| XP-SEC01 | SEC | HIGH | xpHookForQuizAttempt: no valida que is_correct viene del servidor. Frontend puede manipular. |
| XP-SEC02 | SEC | HIGH | _incrementStudentStat crea stats row si no existe. Stats fantasma para estudiantes sin onboarding. |

## Backend: badges.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| BADGE-001 | QA | HIGH | tryAwardBadge: no valida que xpReward es positivo. Badge con xp_reward: -100 resta XP. |
| BADGE-002 | QA | MEDIUM | Race condition: Fase 1 y Fase 2 pueden otorgar mismo badge 2x. 23505 silenciada. |
| BADGE-D01 | DATA | HIGH | Race concurrent check-badges: Request A y B ambas eval criteria -> doble insert -> inconsistente response. |
| BADGE-D02 | DATA | MEDIUM | newBadges pushed BEFORE awardXP. Si awardXP falla, frontend cree badge ganado pero XP no. |
| BADGE-P01 | PERF | HIGH | POST /check-badges carga TODOS badges activos + filtro earned. 500 badges = 2 queries grandes. |
| BADGE-SEC01 | SEC | HIGH | xp_reward no validado como positivo en INSERT. Badge con xp_reward: NULL otorga badge sin XP. |

## Backend: streak.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| STREAK-001 | DATA | CRITICAL | POST /streak-freeze/buy: fallback JS read-then-write. Doble-gasto posible. |
| STREAK-002 | QA | HIGH | xpHookForDailyCheckIn no incrementa total_sessions cuando streak no se rompe. Inconsistencia. |
| STREAK-003 | QA | HIGH | POST /streak-repair: repairCost formula con longest_streak = 0 permite reparar streak no roto. |
| STREAK-004 | QA | MEDIUM | POST /daily-check-in: no valida si estudiante ya hizo check-in hoy. Retry = 2x streak XP. |
| STREAK-005 | QA | MEDIUM | Freeze fallback: entre read y update, otra request puede gastar XP. Double-spend race. |
| STREAK-D01 | DATA | CRITICAL | Fallback path read-then-write no atomico. Balance puede ir negativo. |
| STREAK-D02 | DATA | HIGH | xpHookForDailyCheckIn no deduplica. 2x check-in calls antes de DB update = XP duplicado. |
| STREAK-D03 | DATA | MEDIUM | Repair usa student_stats.update() sin WHERE institution_id. 2 instituciones = repara ambas con 1 request. |
| STREAK-SEC01 | SEC | CRITICAL | Fallback JS permite comprar freeze mientras RPC esta deploying. Bypass de security patch. |
| STREAK-SEC02 | SEC | HIGH | POST /daily-check-in no valida que institutionId owns student. XP farming cross-institution. |

## Backend: profile.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| PROFILE-001 | QA | MEDIUM | GET /leaderboard fallback a student_xp si MV falla. xp_this_week puede estar stale. |
| PROFILE-002 | SEC | MEDIUM | GET /xp-history no valida limit. limit=1000000 carga toda xp_transactions. DOS potential. |

## Backend: goals.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| GOAL-001 | DATA | HIGH | POST /goals/complete: source_id = goalType_date. Timezone mismatch = completar 2x en "mismo dia". |
| GOAL-002 | QA | MEDIUM | PUT /daily-goal acepta 5-120, pero frontend slider 10-500. Mismatch front/back validation. |
| GOAL-003 | QA | MEDIUM | POST /onboarding: student_xp INSERT falla pero student_stats INSERT ok. No idempotente. |
| GOAL-D01 | DATA | HIGH | source_id timezone: UTC server vs local client = duplicate goal completion allowed. |
| GOAL-P01 | PERF | MEDIUM | POST /goals/complete checks xp_transactions sin indice (student_id, source_type, source_id). Full scan. |

## Frontend: GamificationCard.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| CARD-001 | QA | HIGH | useEffect: 4 APIs en paralelo. dailyCheckIn + onboarding results ignorados. Silent failures. |
| CARD-002 | QA | MEDIUM | Streak break condition: last_study_date null -> null.startsWith() dependiente de optional chaining. |
| CARD-P01 | PERF | HIGH | 4 API calls on mount sin deduplication. Tab switch = 8 calls. Deberia cachear en context. |

## Frontend: LeaderboardPage.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| LB-001 | QA | MEDIUM | getXp fallback total_xp en vez de xp_this_week. Valores inconsistentes. |
| LB-002 | QA | MEDIUM | PodiumCard con < 3 entries: undefined access crash. |
| LB-003 | QA | MEDIUM | Rank calculation: top3 empty pero rest rank dice 4. Wrong labels. |
| LB-P02 | PERF | MEDIUM | Re-fetch on period change: toggle rapido = multiple in-flight requests race. |

## Frontend: BadgesPage.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| BP-001 | QA | MEDIUM | Badge icon_url espera URL pero backend retorna emoji. Siempre muestra fallback. |
| BP-002 | QA | MEDIUM | Null rarity badges desaparecen si filter != 'all'. |
| BP-P02 | PERF | MEDIUM | Grid renderiza all filtered badges sin virtualizacion. 200 badges = 200 motion nodes. |

## Frontend: DailyGoalWidget.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| GW-001 | QA | MEDIUM | Slider min=10, max=500. Backend acepta 5-120. Mismatch front/back. |
| GW-002 | PERF | MEDIUM | Slider onChange sin debounce. Drag rapido = muchos renders. |

## Cross-Cutting Gamification

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| RC-001 | DATA | CRITICAL | Read-then-write en xp-hooks._incrementStudentStat |
| RC-002 | DATA | CRITICAL | Read-then-write en streak.ts POST /streak-freeze/buy fallback |
| RC-003 | DATA | HIGH | Double-award en badges.ts Phase 1 + Phase 2 |
| RC-004 | DATA | HIGH | Double check-in en xp-hooks.xpHookForDailyCheckIn |
| RC-005 | DATA | HIGH | Duplicated batch items en xp-hooks.xpHookForBatchReviews |

### Recomendaciones Gamification
1. Usar Database Transactions / RPCs para todas operaciones atomicas
2. Implementar Idempotency Keys (X-Idempotency-Key header)
3. Validar is_correct server-side (no confiar en frontend)
4. Usar SWR / React Query para request dedup + caching frontend

---

# SESION 7: SUMMARIES

## semantic-chunker.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| SC-1 | PERF | HIGH | Memory leak en paragraphEmbeddings Map. Paragrafos >100KB sin limite. |
| SC-2 | QA | MEDIUM | Fallback silencioso sin metricas. Embedding falla = recursivo sin contar fallos. |
| SC-3 | DATA | MEDIUM | Similitud umbral hardcoded 0.35. Para espanol medico puede ser muy estricto/permisivo. |
| SC-4 | QA | MEDIUM | splitOversizedGroup recursion sin limite de profundidad. Stack overflow posible. |

## chunker.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| CH-1 | QA | MEDIUM | hardSplit pierde contexto: parte por caracteres sin considerar palabras. |
| CH-3 | QA | MEDIUM | mergeSmallChunks siempre une al ultimo. Mega-chunk puede exceder maxChunkSize 2x. |

## auto-ingest.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| AI-1 | DATA | CRITICAL | RACE CONDITION: DELETE -> INSERT chunks sin transaction. Chunks temporalmente vacios. RAG retorna 0 resultados. |
| AI-2 | QA | MEDIUM | Advisory lock hash funcion debil (djb2). Colisiones posibles en UUIDs similares. |
| AI-3 | PERF | HIGH | Embedding fallback secuencial: 200 chunks = 20s. Edge function timeout 60s. |
| AI-4 | QA | MEDIUM | No valida chunk.content tamano antes de embed. OpenAI rechaza >10K chars silenciosamente. |
| AI-6 | QA | MEDIUM | lastChunked_at actualizado sin rollback en error. Proximo auto-ingest cree que ya esta chunked. |

## summary-hook.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| SH-1 | QA | HIGH | Fire-and-forget sin retry. autoChunkAndEmbed falla = chunks perdidos silenciosamente. |

## routes/ai/ingest.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| IN-1 | QA | HIGH | Nested !inner join con 5 JOINs encadenados. Fallback RPC seguro pero lento. Timeout en 1000+ chunks. |
| IN-2 | QA | MEDIUM | Batch embeddings sin validacion de tamano por chunk. OpenAI falla silenciosamente. |

## Frontend: SummaryView.tsx + StudentSummaryReader.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| SV-1 | QA | MEDIUM | Chunking invisible en UI. Sin indicador de error si chunks no existen. |
| SV-2 | QA | MEDIUM | contentPage no sincroniza con keyword pageMap durante loading. |
| SV-3 | PERF | HIGH | enrichHtmlWithImages sincronico y pesado (500KB HTML en main thread). UI freeze en mobile. |

## TipTapEditor.tsx

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| TIP-1 | QA | MEDIUM | Auto-save cada 30s sin conflict detection. 2 professors = last write wins, data loss. |
| TIP-2 | SEC | HIGH | Image upload sin size limit. 500MB posible, backend timeout 60s. |
| TIP-3 | PERF | MEDIUM | KeywordHighlightPlugin refetch every render. Repeated DOM mutations. |

## Security: Prompt Injection

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| SEC-1 | SEC | CRITICAL | Summary content NO sanitizado antes de RAG. Professor pega malicious prompt = LLM jailbreak. |
| SEC-2 | SEC | MEDIUM | TipTap permite HTML. Professor pega `<script>` = XSS en student reader. |

---

# SESION 8: AI/RAG

## chat.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QA-001 | DATA | CRITICAL | Token tracking streaming: inputTokens se SOBREESCRIBE en cada message_start, no acumula. Billing completamente inexacto. |
| QA-002 | QA | HIGH | Fire-and-forget logging: XP hook ejecuta sin esperar rag_query_log insert. |
| SEC-002 | SEC | HIGH | History truncation 500 chars sin sanitizar ANTES de augmentation. Prompt injection via history. |
| PERF-001 | PERF | MEDIUM | Adjacent chunks N+1 query. Deberia usar CTE batch. |

## generate.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QA-003 | SEC | HIGH | wrongAnswer retry sin limite de profundidad. User envia 10x = 10 preguntas. Plan limit abuse. |
| SEC-003 | SEC | HIGH | profileContext (JSON.stringify) no sanitizado antes de prompt. Injection via profile. |
| PERF-002 | PERF | MEDIUM | Fetch profesor notes sin paginacion. .limit(3) pero sin indice covering. |

## generate-smart-prompts.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| PERF-003 | PERF | MEDIUM | Prompts >2500 tokens sin truncation. Token waste en multi_query. |

## pre-generate.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QA-004 | DATA | HIGH | existingContent count no filtra deleted_at. Coverage desbalanceada. Keywords sin cobertura ignorados. |
| PERF-004 | PERF | MEDIUM | Sequential generation sin per-item timeout. Item lento bloquea toda cola. |

## suggest-connections.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QA-006 | SEC | HIGH | idList join(",") en .or() string. SQL injection risk (bajo pero no validado). Usar .in() method. |
| DATA-009 | DATA | MEDIUM | Sin deduplicacion en suggested connections. A->B y B->A ambos sugeridos. |

## rag-search.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QA-007 | QA | HIGH | .single() en membership query. >1 active membership = crash. Usar .maybeSingle(). |
| PERF-009 | PERF | MEDIUM | RAG_TOP_K=5 hardcoded. Caller no puede customizar. |

## retrieval-strategies.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| PERF-010 | PERF | HIGH | HyDE + Multi-query: 2-3 Claude calls por strategy. Sin rate limit ni backpressure. |
| QA-008 | QA | HIGH | parseClaudeJson en multi-query: invalid JSON -> validResults vacio -> crash. Sin graceful degrade. |

## claude-ai.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QA-009 | QA | MEDIUM | generateTextStream timeout 60s vs generateText 30s. Inconsistente. |
| SEC-006 | SEC | MEDIUM | No validation de systemPrompt length. >100k chars = API rejection. |

## openai-embeddings.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| DATA-013 | DATA | MEDIUM | Cache key sin model versioning. Cambio de modelo = cache corrupto. |
| PERF-014 | PERF | MEDIUM | Batch timeout = TIMEOUT_MS * 2. Deberia escalar con batch size. |

## validate-llm-output.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| QA-010 | DATA | HIGH | MCQ options puede ser null pero se inserta. Throw si options.length < 2. |

## prompt-sanitize.ts / ai-normalizers.ts

Sin issues criticos. Implementaciones correctas.

---

# SESION 9: BACKEND INFRA

## crud-factory.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| CF-01 | QA | MEDIUM | afterWrite hooks fire-and-forget. Si hook falla, response ya enviada. |
| CF-02 | QA | MEDIUM | cascadeChildren no transaccional. Padre deleted pero children partial = inconsistencia. |
| CF-P01 | PERF | HIGH | N+1 en cascadeChildren fallback: parallelBatch(20) para 200 items = 10 batches secuenciales. Mejor bulk UPDATE. |
| CF-P02 | PERF | MEDIUM | Institution resolution RPC overhead: cada GET/:id = 1 RPC. 10 GETs paralelos = 10 RPCs. Sin cache. |
| CF-SEC01 | SEC | MEDIUM | Authorization bypass en cascadeChildren: no verifica children pertenecen a misma institucion. Depende de RLS. |

## db.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| DB-01 | QA | MEDIUM | JWKS corrupta/no responde: excepcion sin timeout ni retry. Bloquea toda autenticacion. |
| DB-02 | PERF | MEDIUM | No persistent connection pooling. Cada getUserClient() = nueva instancia Supabase. |
| DB-SEC01 | SEC | MEDIUM | JWKS URL construida desde env var. Env poisoning = JWKS bypass (pero env admin-controlled). |

## validate.ts

Sin issues significativos. Validacion correcta y O(1) por campo.

## safe-error.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| SE-01 | SEC | HIGH (positive) | S-13 FIX correctamente sanitiza. Clientes no ven table names, constraints, schema info. |

## embedding-cache.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| EC-01 | DATA | MEDIUM | djb2 hash collision posible. Dos textos con mismo hash = embedding incorrecto. Mejor SHA256. |
| EC-02 | PERF | MEDIUM | Eviction es FIFO, no LRU. Items frecuentes evicted si cache lleno. |
| EC-03 | QA | MEDIUM | Text size unbounded. 100MB text = memory spike. Sin MAX_TEXT_SIZE. |

## timing-safe.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| TS-01 | SEC | HIGH (positive) | Constant-time comparison correcta. XOR accumulation. N-10 FIX. |

## routes/content/reorder.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| RO-01 | PERF | HIGH | Fallback parallelBatch(20) para N items. 200 items = 10 rounds secuenciales. Deberia Promise.all(). |
| RO-02 | PERF | MEDIUM | Institution resolution RPC llamada ANTES de verificar si tabla es INSTITUTION_RESOLVABLE. Wasted RPC. |
| RO-03 | SEC | MEDIUM | study_plan_tasks en allowedReorderTables pero NO en INSTITUTION_RESOLVABLE_TABLES. Skip institution check intencional? Audit. |

## routes/content/keyword-connections.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| KC-01 | PERF | HIGH | Multiples RPC calls por endpoint sin batching. 10 GETs = 20 calls. |
| KC-02 | PERF | MEDIUM | LIST .limit(200) hardcoded. 500 connections = parcial sin pagination. |
| KC-03 | PERF | MEDIUM | OR filter (keyword_a_id.eq OR keyword_b_id.eq) sin UNION optimization. |

## routes/content/content-tree.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| CT-01 | PERF | MEDIUM | Nested PostgREST select 4 niveles. 1000 topics = payload >10MB. Sin pagination. |
| CT-02 | DATA | MEDIUM | Soft-deleted items visible si deleted_at != null pero is_active = true. Deberia check ambos. |

## routes/search/search.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| SS-01 | QA | HIGH | search_scoped RPC es single point of failure. Sin fallback si RPC falla. |

## routes/content/keyword-search.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| KS-01 | QA | MEDIUM | Fallback path: 3 sub-queries con riesgo de cascading failures. |
| KS-02 | PERF | MEDIUM | RPC timeout no configurado. PostgREST default 60s = frontend cuelga. |
| KS-03 | SEC | MEDIUM | Fallback muestra all institution keywords. Si RPC buggy, podria leak keywords de otra institucion. |

## routes/members/admin-scopes.ts

| ID | Tipo | Severidad | Descripcion |
|----|------|-----------|-------------|
| AS-01 | QA | MEDIUM | Owner-only authorization. Si institucion solo tiene admins, users locked out. |
| AS-02 | DATA | MEDIUM | Orphaned scopes si membership deleted. Sin CASCADE DELETE en schema. |

---

# APENDICE: RECOMENDACIONES CONSOLIDADAS

## Semana 1 — Blockers (CRITICAL)
1. Fix Double BKT: Deshabilitar frontend PATH A o agregar idempotency en backend
2. Fix _incrementStudentStat: Reemplazar con RPC atomico (SELECT...FOR UPDATE)
3. Fix streak freeze: Implementar RPC buy_streak_freeze atomico en DB
4. Fix handleRate double-fire: Agregar isRatingRef guard
5. Fix token tracking streaming: Acumular en vez de sobreescribir
6. Fix auto-ingest transaction: BEGIN/COMMIT para DELETE+INSERT chunks

## Semana 2 — Security (HIGH)
7. Sanitizar history ANTES de augmentation en chat.ts
8. Sanitizar profileContext antes de prompt en generate.ts
9. Mover JWT a sessionStorage o httpOnly cookie
10. Validar is_correct server-side en quiz XP hooks
11. Agregar retry limit tracking en generate wrongAnswer
12. Fix FSRS lapse stability clamp

## Semana 3 — Performance (HIGH)
13. Consolidar useMasteryOverviewData: POST /subtopics/batch en vez de 1000 GETs
14. Throttle Quiz preload a max 5-10 concurrent
15. Split AuthContext en user/token vs institutions
16. Memoizar progressBarGradient, cardGroups, enrichHtmlWithImages
17. Pre-indexar tree como Map en ReviewSessionView
18. Implementar concurrency limit en batch fallback

## Semana 4+ — Tech Debt (MEDIUM)
19. Reemplazar djb2 con SHA256 en embedding-cache
20. Implementar LRU real en embedding-cache
21. Agregar conflict detection en TipTap auto-save
22. Refactorizar Tailwind dynamic classes a mapa estatico
23. Agregar pagination a content-tree y keyword-connections
24. Agregar fallback a search_scoped RPC

---

*Generado por auditoria automatizada. Ningun archivo fue modificado.*
