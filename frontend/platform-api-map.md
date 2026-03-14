# Frontend -> Backend API Map

> Maps frontend function calls to backend endpoints.
> **Updated:** 2026-03-14

## Status Legend

- CONNECTED — function exists, imported by components, correct payload
- RESOLVED — previously broken, now fixed

## Study Sessions

| Function | Defined In | Endpoint | Status |
|---|---|---|---|
| `createStudySession` | studySessionApi.ts | `POST /study-sessions` | CONNECTED |
| `createStudySession` | quizApi.ts | `POST /study-sessions` | CONNECTED |
| `closeStudySession` | studySessionApi.ts | `PUT /study-sessions/:id` | RESOLVED (was RT-001) |
| `closeStudySession` | quizApi.ts | `PUT /study-sessions/:id` | RESOLVED (was RT-001) |

## Reviews

| Function | Defined In | Endpoint | Status |
|---|---|---|---|
| `submitReview` | studySessionApi.ts | `POST /reviews` | RESOLVED (was RT-003) |
| Direct `apiCall('/reviews')` | QuizTaker | `POST /reviews` | CONNECTED (always correct) |
| `POST /review-batch` | FlashcardReviewer | `POST /review-batch` | CONNECTED (PERF M1: 90→1) |

## FSRS States

| Function | Defined In | Endpoint | Status |
|---|---|---|---|
| `getFsrsStates` | studySessionApi.ts | `GET /fsrs-states` | CONNECTED |
| `upsertFsrsState` | studySessionApi.ts | `POST /fsrs-states` | CONNECTED |

## AI / RAG

| Function | Defined In | Endpoint | Status |
|---|---|---|---|
| `generateContent` | aiService.ts | `POST /ai/generate` | CONNECTED |
| `generateSmart` | aiService.ts | `POST /ai/generate-smart` | CONNECTED |
| `ragChat` | aiService.ts | `POST /ai/rag-chat` | CONNECTED |
| `ragFeedback` | aiService.ts | `PATCH /ai/rag-feedback` | CONNECTED |

## Gamification

| Function | Defined In | Endpoint | Status |
|---|---|---|---|
| `getProfile` | gamificationApi.ts | `GET /gamification/profile` | CONNECTED |
| `dailyCheckIn` | gamificationApi.ts | `POST /gamification/daily-check-in` | CONNECTED |
| `checkBadges` | gamificationApi.ts | `POST /gamification/check-badges` | CONNECTED |
| Other endpoints | gamificationApi.ts | Various | In progress (Sprint 3) |

## Content CRUD

All entities use the CRUD factory pattern and are connected via `platformApi.ts`, `summariesApi.ts`, or `studentApi.ts`.

```
GET    /{entity}           -> list (paginated)
GET    /{entity}/:id       -> get one
POST   /{entity}           -> create
PUT    /{entity}/:id       -> update
DELETE /{entity}/:id       -> delete
```

Response format for list: `{ data: { items: [...], total, limit, offset } }`
Response format for single: `{ data: { ... } }`

## API Service Files

| File | Scope |
|---|---|
| `lib/api.ts` | Central `apiCall()` wrapper with dual-token headers |
| `services/platformApi.ts` | Owner/Admin/Professor API calls |
| `services/studentApi.ts` | Student API calls |
| `services/summariesApi.ts` | Summary CRUD + chunks + keywords |
| `services/studentSummariesApi.ts` | Reading states, annotations, video notes |
| `services/quizApi.ts` | Quiz taking + study sessions |
| `services/flashcardApi.ts` | Flashcard CRUD |
| `services/contentTreeApi.ts` | Content tree |
| `services/authApi.ts` | Auth flows |
| `services/aiService.ts` | AI/RAG endpoints |
| `services/studySessionApi.ts` | Study sessions + reviews + FSRS |
| `services/gamificationApi.ts` | Gamification endpoints |
