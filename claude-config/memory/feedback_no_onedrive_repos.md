---
name: feedback_no_onedrive_repos
description: Never put git repos inside OneDrive — causes corruption of .git/ directories
type: feedback
---

NEVER put git repositories inside OneDrive-synced folders.

**Why:** OneDrive corrupted .git/ directories for both frontend and backend repos (error 0x8007017F). Files showed as "arquivo ilegível", git commands failed with "not a git repository", and .lock files couldn't be deleted. This caused data loss risk and blocked all git operations.

**How to apply:** Code repos live in C:\dev\axon\ (outside OneDrive). Documents and non-code files can stay in OneDrive. When suggesting file organization or new repo setup, always direct repos to C:\dev\ or similar non-synced location.
