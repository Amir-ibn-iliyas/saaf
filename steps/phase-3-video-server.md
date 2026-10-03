# Phase 3 — Video server

Use the `watermark-algorithm` skill. See `docs/03-architecture.md` for the API contract.

## 3.1 POST /v1/video
- Save upload to `/tmp/jobs/<uuid>/`, ffprobe it, run the pipe:
  ffmpeg decode → rawvideo rgb24 → NumPy reverse blend → ffmpeg encode (libx264, crf 18,
  preset veryfast, same fps and size, `-c:a copy`, `-movflags +faststart`).
- Return the file with `X-Watermark-Detected` header; delete the folder in `finally`.
**Done when:** a Veo fixture returns a clean MP4 with audio; duration and fps unchanged.

## 3.2 Veo mask and detection
- Mask for the Veo mark (port with license check, or calibrate from a black Veo video by
  averaging frames). Detect on the mean of the first 30 frames.
**Done when:** Veo fixtures detected; non-Gemini video returns `422 no_watermark`.

## 3.3 Limits, cleanup, rate limit
- 100 MB, 60 s, 1080p limits with the error codes in the API contract.
- CORS: localhost only for now (production domain added in Phase 6); 10 videos per IP per hour; cron sweep of `/tmp/jobs` every
  15 min.
**Done when:** pytest covers each error code; no files remain after tests.

## 3.4 Run locally and connect the app
- `apps/app/.env.example` with `EXPO_PUBLIC_API_URL` and the three local URLs in comments
  (web, Android emulator, real phone). Server listens on `0.0.0.0:8000`.
- CORS allows `http://localhost:8081` (Expo web) during development.
- Update `server/README.md` with a "how to start the server" section for Windows and macOS.
**Done when:** the web app and the Android emulator both reach `/health` on the local server.

Docker and deployment are in `phase-6-hosting.md`. Do not do them now.
