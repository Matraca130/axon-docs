# Axon Development Workflow Guide
> Updated: 2026-03-27

## Where Things Live

| What | Where | Synced? |
|---|---|---|
| Code repos (frontend, backend, docs) | C:\dev\axon\ | No — GitHub is backup |
| Documents, prototypes, ideas | OneDrive (AXON PROJECTO) | Yes — across machines |
| Cowork memories (.auto-memory/) | OneDrive (AXON PROJECTO) | Yes |
| Claude agent config (.claude/) | OneDrive (AXON PROJECTO) | Yes |

**RULE: NEVER put git repos in OneDrive.** OneDrive corrupts .git/ directories (learned 2026-03-21, DEC-010).

## Git Workflow

### Starting Work
```bash
cd C:\dev\axon\frontend  # or backend
git pull origin main
source /c/dev/axon/worktree.sh frontend feat/my-feature
# → Creates C:\dev\axon\frontend-feat-my-feature
# → All work happens in this directory
```

### Rules
1. NEVER push to main — always feature branch + PR
2. NEVER git checkout <branch> in main repo — always worktree
3. Each agent gets explicit file list — zero overlap
4. Verify before push: git log --oneline main..<branch>

### Finishing Work
```bash
# After commit + push:
cd C:\dev\axon\frontend
git worktree remove ../frontend-feat-my-feature
```

## Cowork Session Workflow

### Starting a Session
1. Read .auto-memory/MEMORY.md and relevant memories
2. git pull origin main in repos you'll touch
3. You have context — don't ask what's already in memories

### During a Session
- Think together: architecture, priorities, bugs, design
- Plan tasks: clear instructions (branch, files, scope) for Claude Code CLI
- Investigate: read code, search patterns, diagnose bugs
- Save decisions: important decisions go to .auto-memory/

### Ending a Session
1. Update .auto-memory/project_current_state.md: what was done, what's pending, date
2. Save new feedback if any corrections/preferences arose
3. This is the handoff — next session on any machine starts with full context

## Agent System

### Config (every agent)
- model: "opus" (ALWAYS, never sonnet/haiku)
- mode: "bypassPermissions"
- 2+ agents same repo → isolation: "worktree"
- Max 5 opus agents simultaneously

### Quality Gate
After every agent that writes code, run quality-gate agent (XX-02). It catches cross-file bugs that isolated agents miss.

### Agent Lessons Learned
- When fixing a function's return type, grep ALL callers across codebase
- When changing a type, check all downstream consumers
- Before writing new utility code, check if a helper already exists
- The quality gate is essential — agents miss cross-cutting bugs
