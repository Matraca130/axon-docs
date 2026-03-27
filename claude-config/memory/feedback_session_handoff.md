---
name: feedback_session_handoff
description: Rule — at the END of every Cowork session, update project_current_state.md with what was done and what's pending
type: feedback
---

At the end of every session (or when Petrick says "listo", "eso es todo", "terminamos", etc.), update `project_current_state.md` with:

1. **What was done this session** — features, bugs fixed, decisions made
2. **What's pending / next** — tasks discussed but not started, blockers found
3. **Date** of the update

**Why:** Petrick uses this same OneDrive folder across multiple Cowork sessions on different machines. The memory system is the bridge between sessions — if we don't update state at the end, the next session starts blind.

**How to apply:** Treat it like a shift handoff. Be concise. Future-Claude should be able to read project_current_state.md and know exactly where things stand without asking Petrick to repeat context.
