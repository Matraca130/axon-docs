# Frontend -> Backend API Map

> Maps frontend function calls to backend endpoints.
> **UPDATED 2025-02-27** with actual code audit results.

## Status Legend

- CONNECTED — function exists and is imported by components
- RUNTIME BUG — function exists but sends wrong payload
- UNUSED — function exists but nothing imports it

## Study Sessions

| Function | Defined In | Called By | Endpoint | Status |
|---|---|---|---|---|
| `createStudySession` | studySessionApi.ts | FlashcardReviewer, ReviewSessionView, useFlashcardEngine | `POST /study-sessions` | CONNECTED |
| `createStudySession` | quizApi.ts | QuizTaker | `POST /study-sessions` | CONNECTED |
| `closeStudySession` | studySessionApi.ts | FlashcardReviewer, ReviewSessionView, useFlashcardEngine | `PUT /study-sessions/:id` | RUNTIME BUG (RT-001) |
| `closeStudySession` | quizApi.ts | QuizTaker | `PUT /study-sessions/:id` | RUNTIME BUG (RT-001) |

## Reviews

| Function | Defined In | Called By | Endpoint | Status |
|---|---|---|---|---|
| `submitReview` | studySessionApi.ts | FlashcardReviewer, ReviewSessionView, useFlashcardEngine | `POST /reviews` | RUNTIME BUG (RT-003) |
| `submitReview` | platformApi.ts | (self-contained, used by platformApi consumers) | `POST /reviews` | RUNTIME BUG (RT-004) |
| Direct `apiCall('/reviews')` | — | QuizTaker | `POST /reviews` | CONNECTED (correct payload) |

Note: QuizTaker uses `apiCall` directly instead of `submitReview`, and its payload is actually correct: `{ session_id, item_id, instrument_type: 'quiz', grade }`. No phantom fields.

## FSRS States

| Function | Defined In | Called By | Endpoint | Status |
|---|---|---|---|---|
| `getFsrsStates` | studySessionApi.ts | ReviewSessionView | `GET /fsrs-states` | CONNECTED |
| `upsertFsrsState` | studySessionApi.ts | useFlashcardEngine | `POST /fsrs-states` | CONNECTED |
| Direct `apiCall('/fsrs-states')` | — | FlashcardReviewer, ReviewSessionView | `POST /fsrs-states` | CONNECTED |

## CRUD Factory Endpoints (Auto-Generated)

Every entity through `crud-factory.ts` gets:

```
GET    /{entity}           -> list (paginated)
GET    /{entity}/:id       -> get one
POST   /{entity}           -> create
PUT    /{entity}/:id       -> update
DELETE /{entity}/:id       -> delete
```

Response format for list: `{ data: { items: [...], total, limit, offset } }`
Response format for single: `{ data: { ... } }`

## Duplicate Function Definitions

Some functions are defined in multiple files:

| Function | Files | Notes |
|---|---|---|
| `createStudySession` | studySessionApi.ts, quizApi.ts | Same endpoint, slightly different types |
| `closeStudySession` | studySessionApi.ts, quizApi.ts | Same endpoint, same bug |
| `submitReview` | studySessionApi.ts, platformApi.ts | Different type definitions, both have issues |
| `getFsrsStates` | studySessionApi.ts, platformApi.ts | Different signatures |

These duplicates should eventually be consolidated into a single source of truth.
