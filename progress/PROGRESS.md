# Progress

**Current phase:** 0 — Setup and spike
**Current task:** owner tests (Phases 0–5 built). 5.4 optional; Phase 6 needs the owner (Oracle account, DuckDNS).
**Last updated:** 2026-10-02

## Status
| Phase | Name | Status |
|---|---|---|
| 0 | Setup and spike | 🟨 in progress |
| 1 | Core algorithm (TypeScript) | 🟨 in progress (1.4 needs fixtures) |
| 2 | Image flow in the app | 🟨 in progress |
| 3 | Video server | 🟨 built, review pending |
| 4 | Video flow in the app | 🟨 built, owner test pending |
| 5 | Polish and test build | 🟨 in progress |
| 6 | Hosting (later) | ⬜ not started |

Legend: ⬜ not started · 🟨 in progress · ✅ done · 🟥 blocked

## Tasks
Mirror of `steps/`. Tick here when a task's acceptance criteria pass.

### Phase 0
- [x] 0.0 Check the owner's tools
- [ ] 0.1 Create the Expo app
- [ ] 0.2 Skia pixel spike (web + Android)
- [x] 0.3 Server skeleton (local)
- [ ] 0.4 Fixtures in place

### Phase 1
- [x] 1.1 Masks and masks.json
- [x] 1.2 remove()
- [x] 1.3 detect()
- [ ] 1.4 Tests on real fixtures

### Phase 2
- [ ] 2.1 Theme and base components
- [ ] 2.2 Home screen and file picking
- [ ] 2.3 Image cleaning with Skia
- [ ] 2.4 Result screen with compare slider
- [ ] 2.5 Save, download and share
- [ ] 2.6 Batch images

### Phase 3
- [ ] 3.1 /v1/video endpoint
- [ ] 3.2 Veo mask and detection
- [ ] 3.3 Limits, cleanup, rate limit
- [ ] 3.4 Run locally and connect the app

### Phase 4
- [ ] 4.1 Upload with progress
- [ ] 4.2 Video result and save

### Phase 5
- [ ] 5.1 Errors, empty states, About page
- [ ] 5.2 Remote masks
- [ ] 5.3 Android test APK
- [ ] 5.4 (optional) Web video in the browser

### Phase 6 (later)
- [ ] 6.1 Dockerize the server
- [ ] 6.2 Deploy the video server (free)
- [ ] 6.3 Web release (free)
- [ ] 6.4 Play Store

## Blockers
(none)

## Waiting for owner test (owner tests everything at the end)
- **How to start testing:** in the `saaf` folder run `.dev.ps1` (opens "Saaf server" and "Saaf app" windows, writes `apps/app/.env` with the PC Wi-Fi IP). Scan the QR in "Saaf app" with Expo Go, or press `w` (web) / `a` (emulator).
- 0.1 — app opens on web (`npx expo start --web`) and Android emulator (press `a`).
- 5.3 — Copy `buildssaaf-0.1.0-test.apk` to the phone and install it (allow "install unknown apps"). Check: icon is the green "s", name "Saaf"; clean a Gemini image; with the server running on the PC (`--host 0.0.0.0`, Windows Firewall: allow Private) and the phone on the same Wi-Fi, clean a Veo video. If the PC IP changed, run `appsappscriptsuild-apk.ps1` again.
- 5.1 — Trigger each message once: normal photo → "No Gemini watermark…"; a .gif → "isn't supported"; video > 60 s → "up to 60 seconds"; video > 100 MB → "over 100 MB"; 4K video → "up to 1080p"; stop the server, pick a video → "Can't reach the server"; deny gallery permission → "Allow photo access…".
- 5.2 — Server running: edit `apps/app/src/core/masks.json` (e.g. threshold 0.98), restart the app → Gemini photos are left alone; set it back → cleaned again. No rebuild.
- 4.x — With the server running: pick a Veo video on web and Android → Uploading % → Cleaning → video plays, "Watermark removed"; Save to gallery (Android: plays with sound in the gallery) / Download (web); Cancel during upload works; a non-Gemini video shows "No Gemini watermark found…".
- 3.x — Server: in `server`, activate the venv and run `python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`; open http://localhost:8000/health. Then About (dev mode) on web and on the Android emulator must say "video server … connected" (emulator needs `apps/app/.env` with `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000`).
- 2.6 — Pick 10 images at once: progress "Cleaning… n/10", the UI stays responsive, thumbnails get ✓, then "Save all (n)" saves all of them to the gallery (web: Download all).
- 2.5 — "Save to gallery" on Android → file shows in the gallery as `<name>-clean.png`; deny the permission once → message to allow it in Settings. Web: "Download" saves `<name>-clean.png`.
- 2.4 — Drag the slider handle on Android (smooth?) and on web (mouse + arrow keys).
- 2.3 — Pick a Gemini image on web and Android → "Cleaning…" then the clean image + "Watermark removed"; pick a normal photo → "No Gemini watermark found…". Note the time on Android.
- 2.2 — Home: tap the pick area or "Choose files"; 1–20 photos → Result screen lists them; one video → Video screen; photo + video → photos screen + toast; a .gif/.heic → error toast. Web: drag files onto the pick area. Android: same with the gallery picker.
- 2.1 — UI kit (Home → "Dev: UI kit", dev mode only): components look right in light + dark; Theme switch changes instantly; pick Dark, close and reopen the app (web: reload) → still Dark.
- 0.2 — Skia spike (Home → "Dev: Skia spike", dev mode only): pick a large image on web and Android; note total time + device (target < 1.5 s on Android).

## Follow-ups
- Remove the dev-only Skia spike (`src/app/spike.tsx`, `src/features/spike/`) and UI kit (`src/app/ui-kit.tsx`) once the owner has run the 0.2 and 2.1 checks.
- App icon and splash image are still the Expo template ones; need a Saaf icon (owner decision on the name first).

## Needs from the owner
- **Task 0.4 / 1.4:** more sample files in `fixtures/` (see `fixtures/README.md`). Have (2026-10-02):
  3 Gemini 2K PNGs, 2 videos. Still needed: at least 2 more Gemini images (a 1K/small one and
  one saved as JPEG), 3 NON-Gemini photos (`images/other-1.jpg` …), 1 non-Gemini video.
  Please put them in `fixtures/`, not in `apps/app/assets/`.
- App name decision (working name: Saaf).
- Oracle Cloud account and DuckDNS subdomain — only in Phase 6.

## Log
<!-- newest first: YYYY-MM-DD — task — one line -->
- 2026-10-03 — repo — project moved up to `C:	mp	mpsaaf` (one folder), template git repo in apps/app removed, one git repo at the root (remote github.com/Amir-ibn-iliyas/saaf), fixture media ignored, .gitattributes. Tests re-run after the move: app 107, server 34 pass.
- 2026-10-03 — dev setup — `dev.ps1` starts server + Expo and writes .env with the Wi-Fi IP; verified server reachable on 172.25.191.246:8000 and Expo on :8081.
- 2026-10-02 — responsive — useResponsive hook + size classes, split layout on desktop, media fitted to height, font scale cap (D-021). Screenshots at 4 sizes OK; 107 app tests pass.
- 2026-10-02 — 5.3 — Release APK built locally (builds/saaf-0.1.0-test.apk, arm64, label Saaf, server http://172.25.191.246:8000); build script scripts/build-apk.ps1. Waiting for owner install test on a real phone.
- 2026-10-02 — 3.x/4.x review fixes — upload guard (413/429 before reading), success-only rate limit, safe ffmpeg cleanup + frame-count check + timeouts, atomic one-time download + DELETE, honest privacy copy, native/web upload hardening. 34 server / 94 app tests; web e2e OK.
- 2026-10-02 — 5.3 (in progress) — icon/splash from tokens (build-icons.cjs), permissions trimmed, cleartext for local server, local release build started (D-020).
- 2026-10-02 — 5.2 — /v1/masks serves mask data; app caches/validates remote masks with fallback (D-019); web e2e shows server masks change behaviour without rebuild. 94 app tests, 29 server tests pass.
- 2026-10-02 — 4.1–4.2 — Video screen: device-side limits, upload with progress + cancel (XHR on web, UploadTask/DownloadTask on native via new ?result=link + one-time GET), expo-video preview, save/download/share (D-018). Web e2e with local server: veo-1 cleaned and downloaded with C2PA. App 84 tests, server 29 tests pass.
- 2026-10-02 — 3.1–3.4 — FastAPI /v1/video (Veo mask 0.62×, mean-of-30 detection, per-frame removal + edge median, BT.709 pipes, x264 CRF 18, audio copy, C2PA uuid kept), limits/rate limit/CORS/sweeper, /v1/masks, .env.example + About server status (D-017). 27 pytest pass incl. both Veo fixtures (2–3 s each); web dev app reaches /health. App core now tries all candidates (81 tests pass).
- 2026-10-02 — 2.4–2.6 review fixes — slider no longer blocks page scroll, WebP C2PA → no output + message, media permissions limited to photo, share/partial-save errors, provenance parser hardening, 60 seeded logo-free crops (0 false positives). 81 tests pass; web e2e re-run OK.
- 2026-10-02 — 2.4–2.6 — Compare slider (RNGH + Reanimated, arrow keys), save/download/share, batch strip + Save all (D-016). Web e2e: 3 dropped files → 2 cleaned + 1 "no watermark", arrows move slider, Download all gives Gemini_A-clean.png / Gemini_B-clean.png with C2PA kept. Waiting for owner test on Android.
- 2026-10-02 — 2.3/1.4 review fixes — C2PA caBX/APP11 carried into outputs (D-014); outline-edge verification after 9/60 false positives on logo-free crops (D-015); err.clean_failed; logo-free crop + provenance tests. 72 tests pass; web e2e keeps caBX.
- 2026-10-02 — 2.3 — Skia on device / canvas on web (D-012); result screen with Cleaning…/no-watermark states; web e2e (headless Chrome drop): real Gemini PNG cleaned in ~1 s, logo-free crop → no-watermark message. 2.2 review fixes (blob URL cleanup, page-wide drop guard, redirect on reload, honest video copy, err.pick). Waiting for owner test on Android.
- 2026-10-02 — 1.4 (partial) — 3 real Gemini fixtures detected (g96-m192) and cleaned; added refine step, dropped residual check, new outline-edge metric (D-013). Not ticked: needs 5 Gemini + 3 non-Gemini fixtures.
- 2026-10-01 — 2.2 — Template tabs removed; Stack with Home/Result/Video/About; picker (≤20) + web drag-and-drop; classify() routing with tests (D-011); 2.1 review fixes (aria on web). Checks pass; web screenshots match mockup. Waiting for owner test on web + Android.
- 2026-10-01 — 2.1 — Neem theme (tokens test + contrast test, D-010), fonts, Button/Chip/Toast/Screen/ThemeSwitch, UI sample tab; checks pass; web screenshots light/dark OK. Waiting for owner test of restart persistence.
- 2026-10-01 — 1.1–1.3 — Masks ported from GargantuaX (MIT, D-008), remove(), detect() (NCC ±8 px) and clean() with post-removal check (D-009); 38 tests pass; detect 18 ms / remove 4 ms on 2528×1696; review PASS.
- 2026-10-01 — 0.4 — `fixtures/` is empty; listed under Needs from the owner. Continuing with 1.1–1.3 (synthetic tests).
- 2026-10-01 — 0.3 — FastAPI skeleton in `server/` (venv, pinned deps, README); pytest passes; `/health` returned {"ok":true,"version":"0.1.0"} on localhost:8000; review PASS.
- 2026-10-01 — 0.2 — Skia spike built (Spike tab); checks pass; CanvasKit works, web PNG encode ~1.6 s (see D-006). Waiting for owner test on web + Android timing.
- 2026-10-01 — 0.1 — Expo SDK 57 app in `apps/app`; typecheck/lint/test pass, web export OK, review PASS. Waiting for owner to open it on web + Android before ticking.
- 2026-09-30 — 0.0 — Tools checked (Windows 11):

  | Tool | Version | Status |
  |---|---|---|
  | git | 2.52.0 | ✅ |
  | node | v24.11.1 (LTS) | ✅ |
  | npm | 11.6.2 | ✅ |
  | Android Studio + SDK (adb 1.0.41) | installed | ✅ |
  | python | 3.12.10 (installed by owner same day) | ✅ |
  | ffmpeg | 9.0.2 (installed by owner same day) | ✅ |
