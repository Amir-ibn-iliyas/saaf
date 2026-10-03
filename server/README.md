# Saaf video server

Small FastAPI service that cleans the visible logo from Veo videos. Everything runs on your
own computer; no Docker yet (Phase 6).

Endpoints: `GET /health`, `POST /v1/video` (multipart `file`, returns the cleaned MP4; with
`?result=link` it returns `{"id","url"}` for a one-time `GET /v1/video/{id}`, or
`DELETE /v1/video/{id}`), `GET /v1/masks`. Limits: 100 MB, 60 s, 1080p, 10 cleaned videos per
IP per hour. Uploads and results are deleted right after the response; link results wait at
most 5 minutes; a sweeper removes anything older than 15 minutes.

Needs **Python 3.12** and **FFmpeg** (`ffmpeg` and `ffprobe` on PATH — see
`docs/00-setup-guide.md`). All commands below run inside the `server` folder.

## First time only: create the virtual env and install packages

Windows (PowerShell):
```powershell
cd server
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-dev.txt
```

macOS:
```bash
cd server
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
```

When the env is active you see `(.venv)` at the start of the terminal line.

## Every time: start the server

Windows:
```powershell
cd server
.venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

macOS:
```bash
cd server
source .venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open http://localhost:8000/health in the browser. You should see
`{"ok":true,"version":"0.1.0"}`. Stop the server with **Ctrl + C**.

`--host 0.0.0.0` lets the Android emulator and your phone (same Wi-Fi) reach the server.
The first time, Windows Firewall may ask "Allow access?" — tick **Private networks** only
and click **Allow**. If you only use the web app, `--host 127.0.0.1` is enough.

## Run the tests
```
python -m pytest -q
```
(with the env active, inside `server`)

## Try it with a video (second terminal, server running)
```powershell
curl.exe -F "file=@../fixtures/videos/veo-1.mp4" http://localhost:8000/v1/video -o clean.mp4
```

## Settings (environment variables, all optional)
- `SAAF_CORS_ORIGINS` — exact web origins allowed to call the API (default: any localhost port)
- `SAAF_JOBS_DIR` — where uploads are kept while processing (default: system temp)
- `SAAF_MASKS_DIR` — folder with `masks.json` (default: `apps/app/src/core`)
- `SAAF_FFMPEG`, `SAAF_FFPROBE` — full paths if they are not on PATH

## Troubleshooting (Windows)
- `ffmpeg is not installed on the server`: open a NEW terminal after installing FFmpeg, or
  set `SAAF_FFMPEG` / `SAAF_FFPROBE` to the full paths of `ffmpeg.exe` / `ffprobe.exe`.
- `python` opens the Microsoft Store or says "Python was not found": turn off the
  `python.exe` and `python3.exe` switches in Settings → Apps → Advanced app settings →
  App execution aliases, then open a new terminal.
- `.venv\Scripts\activate` says "running scripts is disabled": run this once, then try again:
  `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
