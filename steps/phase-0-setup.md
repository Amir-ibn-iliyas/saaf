# Phase 0 — Setup and spike

## 0.0 Check the owner's tools
- Run: `git --version`, `node -v`, `npm -v`, `python --version` (macOS: `python3.12 --version`),
  `ffmpeg -version`.
- Node must be an LTS version ≥ 22; Python must be 3.12.x.
- If anything is missing, do NOT install it. Show the owner the exact command from
  `docs/00-setup-guide.md` and stop. Python/FFmpeg are only required from Phase 3, so a
  missing Python can be a warning instead of a blocker for Phases 0–2.
**Done when:** a small table of tools and versions is written in PROGRESS.md log.

## 0.1 Create the Expo app
- `npx create-expo-app@latest apps/app` with TypeScript and Expo Router (latest stable SDK).
- Add scripts: `typecheck` (tsc --noEmit), `lint` (expo lint), `test` (jest).
- Record SDK and key versions in `progress/DECISIONS.md`.
**Done when:** app opens on web (`npx expo start --web`) and on an Android device/emulator;
`npm run typecheck`, `lint` and `test` pass (one placeholder test).

## 0.2 Skia pixel spike
- Install `@shopify/react-native-skia` and set up web loading (CanvasKit) per its docs.
- Spike screen: pick an image → decode with Skia → read RGBA pixels → invert the colors of a
  100 × 100 box in the bottom-right → encode PNG → show it.
- Time decode + encode for a large image.
**Done when:** works on web and Android; a 2528 × 1696 image takes < 1.5 s on Android
(note the device). If it fails on a platform, write a blocker and propose the server fallback.

## 0.3 Server skeleton (local only)
- Needs Python 3.12. If missing, skip this task for now, note it in PROGRESS.md, and come
  back before Phase 3.
- `server/` with a virtual env (`.venv`, gitignored), FastAPI, `GET /health`, pytest,
  `requirements.txt` with pinned versions, and `server/README.md` with the exact run
  commands for Windows and macOS. No Docker yet.
**Done when:** `python -m pytest -q` passes; `http://localhost:8000/health` returns
`{"ok":true}` in the browser.

## 0.4 Fixtures
- Check `fixtures/README.md`. If files are missing, list what is missing under
  "Needs from the owner" in PROGRESS.md.
**Done when:** at least 5 Gemini images, 3 non-Gemini images and 1 Veo video are present.
