# 03 — Architecture

## Image flow (on device)
```
Pick file(s) ──► Skia decode ──► RGBA buffer ──► core.detect() ──► found?
                                                     │ no → show "No Gemini watermark found"
                                                     ▼ yes
                                              core.remove() ──► Skia encode (same format,
                                              JPEG q=95 or PNG) ──► Before/After screen
                                              ──► Save / Download / Share
```

## Video flow (server)
```
App ──POST /v1/video (multipart, ≤100 MB)──► FastAPI
FastAPI: save to /tmp/jobs/<id>/in.mp4 → ffprobe (≤60 s, ≤1080p) →
         detect on avg of first 30 frames → pipe frames: ffmpeg → NumPy → ffmpeg
         (libx264 crf 18, audio copied) → return file → delete folder
App ◄── 200 video/mp4  (or JSON error)
```
v1 is synchronous: short clips finish in seconds. If requests start timing out, switch to
jobs: `POST /v1/jobs` → `GET /v1/jobs/{id}` → `GET /v1/jobs/{id}/result`, and log the decision.

## API contract (v1)
| Method | Path | Request | Success | Errors |
|---|---|---|---|---|
| GET | `/health` | – | `{"ok":true,"version":"x.y.z"}` | – |
| POST | `/v1/video` | multipart `file` | `200 video/mp4`, header `X-Watermark-Detected: true` | `413 too_large`, `415 unsupported_type`, `422 too_long`, `422 too_big_resolution`, `422 no_watermark`, `429 rate_limited`, `500 processing_failed` |
| POST | `/v1/video?result=link` | multipart `file` (native apps) | `200 {"id","url"}`; only the cleaned result is kept | same as `/v1/video` |
| GET | `/v1/video/{id}` | – | `200 video/mp4`, once (whole file, no Range); then deleted | `404 not_found` |
| DELETE | `/v1/video/{id}` | – | `{"deleted": true}` (app cancelled) | `404 not_found` |
| POST | `/v1/image` (fallback) | multipart `file` | `200 image/png|jpeg` | same codes |
| GET | `/v1/masks` | – | `masks.json` incl. `videoTemplates` (lets the app update masks without a release) | – |

Error body: `{"error":"too_long","message":"Videos up to 60 seconds are supported."}`

Server rules: CORS only for the app's web domain; rate limit 10 videos per IP per hour;
max upload 100 MB (refused before the body is read); delete job folder in a `finally` block;
link results wait at most 5 min for their one-time download; a sweep every minute removes
anything older (15 min for any job). The rate limit counts successful cleans only.

## App folders
```
apps/app/src/
  app/            (tabs)/index.tsx  result.tsx  video.tsx  about.tsx
  core/           detect.ts  remove.ts  masks/  masks.json  __tests__/
  features/image/ useCleanImage.ts  skiaIO.ts (decode/encode per platform)
  features/video/ useCleanVideo.ts  api.ts
  ui/             theme.ts  Button.tsx  CompareSlider.tsx  Toast.tsx
```

## Server folders
```
server/
  app/main.py  app/video.py  app/detect.py  app/masks/
  tests/  Dockerfile  requirements.txt
```
