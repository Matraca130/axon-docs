---
name: Agent isolation and coordination (PERMANENT)
description: MANDATORY rules for ALL multi-agent sessions. Covers file isolation, worktrees, model, quality-gate, merge order. Merges former feedback_agent_coordination_lessons.md.
type: feedback
---

## PRE-LAUNCH

1. `git pull origin main` in each repo
2. `git status --short` — working dir CLEAN (stash if dirty)
3. Assign EXPLICIT file list per agent — zero overlap
4. If file needs 2+ agents, assign to ONE; others wait
5. If agent A creates file that B needs, B goes AFTER A
6. ALWAYS `model: "opus"` — never sonnet/haiku
7. 2+ agents same repo: use `isolation: "worktree"` (pre-create `.claude/worktrees/`)
8. Max 10 agents simultaneously (platform hard limit)

## IN EACH AGENT PROMPT

```
## ISOLATION RULES
1. You MUST ONLY modify these files: [EXPLICIT LIST]
2. Do NOT modify ANY other file
3. If you see uncommitted changes from other agents, IGNORE THEM
4. Do NOT import from files that don't exist on the main branch
5. First: git checkout -b <branch> main
6. Last: verify git diff main..<branch> --stat shows ONLY your files
```

## POST-EXECUTION

9. Quality-gate Opus IMMEDIATELY when each agent completes (in background, don't wait for others)
10. Verify `git diff main..<branch> --stat` — only authorized files
11. If contamination: rebuild clean branch from main
12. Merge PRs ONE at a time; rebase remaining branches after each merge
13. Never `git commit --amend` on branches with open PRs

## PATTERNS

- **Same file, N agents:** sequential (A merges, B branches from updated main, etc.)
- **Disjoint files:** parallel safe, merge without conflicts

## HISTORICAL ERRORS (2026-03-18)

| Error | Prevention |
|-------|------------|
| Scope creep (3x) | Isolation rules in each prompt |
| Import roto (2x) | "Don't import non-existent files" |
| Merge accidental | Never amend with open PR |
| Conflictos merge (3x) | Sequential merge + rebase |
| Worktree EEXIST | Pre-create `.claude/worktrees/` |
| API 529 (2x) | Max 5 simultaneous agents |
