---
description: Run all checks for the parts of the repo that exist.
---
Run whichever of these exist and report pass/fail for each in a short table:
- `cd apps/app && npm run typecheck`
- `cd apps/app && npm run lint`
- `cd apps/app && npm test`
- `cd server && python -m pytest -q` (inside `server/.venv`)
If something fails, fix it when the cause is clear and small. Otherwise report the error with
file and line, and add it to the Blockers section of `progress/PROGRESS.md`.
