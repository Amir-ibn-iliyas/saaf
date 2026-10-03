---
description: Pick the next unfinished task from steps/, do it, verify it, and update progress.
---
1. Read `progress/PROGRESS.md` and `steps/README.md`.
2. Find the first unchecked task in the current phase. If a blocker is listed, stop and tell
   me what you need from me instead.
3. Read that phase's file in `steps/` for details and acceptance criteria.
4. Write a short plan (max 6 lines), then implement it.
5. Run the checks in the acceptance criteria, then `/verify`.
6. Ask the `reviewer` subagent to review the change. Fix anything it marks FAIL.
7. Update `progress/PROGRESS.md`: tick the task, set "Current task" to the next one, add a
   dated one-line log entry. Record any design or dependency choice in
   `progress/DECISIONS.md`.
8. Finish with: what changed, how I can test it by hand, and what is next.

Extra instructions from me (may be empty): $ARGUMENTS
