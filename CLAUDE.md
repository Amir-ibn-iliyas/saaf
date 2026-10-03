# Saaf — AI watermark cleaner (working name)

Saaf removes the **visible** Gemini watermark (the small sparkle logo in the corner) from
Gemini images and Veo videos. One Expo (React Native) codebase runs on web, Android and iOS.

Phase 1 = watermark remover only. The canvas editor comes later — do not start it.

## Read these before any task
- @START-HERE.md and @docs/00-setup-guide.md — owner's setup; the owner is new to Python.
- @progress/PROGRESS.md — what is done, what is next, blockers. ALWAYS read first.
- @steps/README.md — ordered phases and tasks with acceptance criteria.
- @docs/02-stack.md — the chosen stack. Do not swap libraries without logging a decision.
- @docs/04-algorithm.md — how removal works. Use the `watermark-algorithm` skill for this work.
- @design/DESIGN.md — screens, copy and design tokens for any UI work.

## Stack (short)
- App: Expo (latest stable SDK) + Expo Router + TypeScript, web via react-native-web.
- Image processing: ON DEVICE. `@shopify/react-native-skia` decodes/encodes; the math lives
  in `apps/app/src/core/` as pure TypeScript (no React Native imports) so it runs everywhere.
- Video processing: SERVER. Python 3.12 + FastAPI + NumPy + FFmpeg (rawvideo pipes).
- Development is 100% LOCAL until Phase 6. Do not set up hosting, Docker or deploys before
  Phase 6. Later plan (free): web on Cloudflare Pages, video server on Oracle Always Free.
- Theme: Neem green, light + dark (system default, user override). See `design/DESIGN.md`.

## Repo layout
```
apps/app/                 Expo app (web + Android + iOS)
  src/app/                Expo Router screens
  src/core/               pure TS: masks, detection, reverse-alpha, tests
  src/features/           image flow, video flow
  src/ui/                 shared components + theme tokens
server/                   FastAPI video service (Dockerfile, tests)
fixtures/                 sample Gemini images/videos for tests (user supplies)
docs/ design/ steps/ progress/   planning files — keep them updated
```

## Commands (fill in once the project exists)
- App: `cd apps/app && npx expo start` · web: `npx expo start --web` · Android: press `a`
- App checks: `npm run typecheck && npm run lint && npm test`
- Server (always inside the virtual env `server/.venv`):
  - create once: `cd server && python -m venv .venv`
  - activate: Windows `.venv\Scripts\activate` · macOS `source .venv/bin/activate`
  - run: `python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
  - tests: `python -m pytest -q`
- Local API URL for the app (`apps/app/.env`, key `EXPO_PUBLIC_API_URL`):
  web `http://localhost:8000` · Android emulator `http://10.0.2.2:8000` ·
  real phone on same Wi-Fi `http://<PC local IP>:8000`

## Owner's machine
The owner may be on Windows. Give commands for Windows first (PowerShell), macOS second.
Explain setup steps simply; the owner is new to Python. Never install system software
yourself — tell the owner the exact command from `docs/00-setup-guide.md`.

## Working rules
1. One task at a time from `steps/`. Plan briefly, implement, run checks, then update
   `progress/PROGRESS.md` (tick the task, add a one-line log entry with the date).
2. Never mark a task done unless its acceptance criteria pass. If blocked, write the blocker
   in PROGRESS.md and stop — do not guess around it.
3. Any new dependency, library swap or architecture change → add an entry to
   `progress/DECISIONS.md` first.
4. Keep `src/core/` free of React Native / DOM imports. It must be unit-testable in Node.
5. Images never leave the device. Only videos are uploaded, and the server deletes every
   input and output file after the response (or within 15 minutes at most).
6. Scope is the VISIBLE logo only. Do not build anything that targets SynthID (the invisible
   watermark) or strips provenance metadata. App copy must say the invisible mark remains.
7. Third-party code: if you port masks or code from an open-source repo, confirm its license
   file first and add it to `THIRD_PARTY_NOTICES.md`.
8. Do not use "Gemini", "Google" or "Veo" in the app name, icon or store title.
9. Keep things simple. No accounts, database, queue or payments in Phase 1.
10. Stop after each task and tell the owner exactly how to test it by hand.
