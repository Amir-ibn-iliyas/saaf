import asyncio
import os
import re
import shutil
import tempfile
import threading
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from starlette.background import BackgroundTask
from starlette.concurrency import run_in_threadpool

from .limits import LINK_MARKER, RateLimiter, start_sweeper
from .masks import masks_json
from .video import VideoError, carry_c2pa, encode, find_video_logo, probe

VERSION = "0.1.0"

MAX_UPLOAD_BYTES = 100 * 1024 * 1024
# Multipart framing around the file is small; anything bigger than this is refused unread.
MAX_BODY_BYTES = MAX_UPLOAD_BYTES + 1024 * 1024
# Same small slack as the app: containers often report 60.04 s for a "60 s" clip.
MAX_SECONDS = 60.5
MAX_LONG_SIDE, MAX_SHORT_SIDE = 1920, 1080
VIDEO_TYPES = {"video/mp4", "video/quicktime"}
VIDEO_EXTENSIONS = {".mp4", ".mov"}
JOB_ID = re.compile(r"^[0-9a-f]{32}$")

TOO_LARGE = (413, "too_large", "This video is over 100 MB. Export a smaller version and try again.")
RATE_LIMITED = (429, "rate_limited", "You've cleaned 10 videos this hour. Try again later.")
NOT_FOUND = (404, "not_found", "This video is no longer on the server. Clean it again.")

# Local development: any localhost port (Expo web uses :8081, or the next free port if that is
# busy). Production (Phase 6) sets SAAF_CORS_ORIGINS to the exact web origins, comma separated.
# Native apps do not send an Origin, so CORS does not affect them.
CORS_ORIGINS = [o.strip() for o in os.environ.get("SAAF_CORS_ORIGINS", "").split(",") if o.strip()]
LOCALHOST_ORIGIN = r"https?://(localhost|127\.0\.0\.1)(:\d+)?"

rate_limiter = RateLimiter()
# At most this many videos are processed at once (2 OCPU server). An asyncio semaphore, so
# waiting jobs do not hold worker threads that /health and downloads need.
MAX_PARALLEL_JOBS = 2
_job_slots: asyncio.Semaphore | None = None


def jobs_dir() -> Path:
    return Path(os.environ.get("SAAF_JOBS_DIR", Path(tempfile.gettempdir()) / "saaf-jobs"))


@asynccontextmanager
async def lifespan(_app: FastAPI):
    stop = threading.Event()
    start_sweeper(jobs_dir, stop)
    yield
    stop.set()


app = FastAPI(title="Saaf video server", version=VERSION, lifespan=lifespan)


def _error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse({"error": code, "message": message}, status_code=status)


class UploadGuard:
    """Runs before the body is read: rate limit, then the size limit. A declared
    Content-Length over the limit is refused at once; a chunked body is counted while it
    streams in and cut off as soon as it passes the limit."""

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] != "POST" or scope["path"] != "/v1/video":
            return await self.inner(scope, receive, send)

        client = scope.get("client")
        if not rate_limiter.allowed(client[0] if client else "unknown"):
            return await _error(*RATE_LIMITED)(scope, receive, send)

        headers = dict(scope.get("headers") or [])
        length = headers.get(b"content-length")
        if length is not None and length.isdigit() and int(length) > MAX_BODY_BYTES:
            return await _error(*TOO_LARGE)(scope, receive, send)

        seen = 0

        async def counting_receive():
            nonlocal seen
            message = await receive()
            if message["type"] == "http.request":
                seen += len(message.get("body", b""))
                if seen > MAX_BODY_BYTES:
                    raise VideoError(*TOO_LARGE)
            return message

        return await self.inner(scope, counting_receive, send)


app.add_middleware(UploadGuard)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=None if CORS_ORIGINS else LOCALHOST_ORIGIN,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
    expose_headers=["X-Watermark-Detected", "Content-Disposition"],
)


@app.exception_handler(VideoError)
async def video_error(_request: Request, exc: VideoError) -> JSONResponse:
    return _error(exc.status, exc.code, exc.message)


@app.get("/health")
def health() -> dict:
    return {"ok": True, "version": VERSION}


@app.get("/v1/masks")
def masks() -> dict:
    """masks.json plus the mask data, so masks can be updated without an app release."""
    return masks_json()


def _clean_name(filename: str | None) -> str:
    stem = Path(filename or "video").stem or "video"
    return f"{stem}-clean.mp4"


def _copy_upload(upload: UploadFile, target: Path) -> None:
    """Copy Starlette's spooled upload to the job folder (worker thread), enforcing the limit."""
    upload.file.seek(0)
    written = 0
    with open(target, "wb") as f:
        while chunk := upload.file.read(1024 * 1024):
            written += len(chunk)
            if written > MAX_UPLOAD_BYTES:
                raise VideoError(*TOO_LARGE)
            f.write(chunk)


def _process(source: Path, output: Path) -> None:
    """Checks, detection and encoding (blocking; runs in a worker thread)."""
    info = probe(source)
    if info.duration > MAX_SECONDS:
        raise VideoError(422, "too_long", "Videos up to 60 seconds are supported. Trim it and try again.")
    long_side, short_side = max(info.width, info.height), min(info.width, info.height)
    if long_side > MAX_LONG_SIDE or short_side > MAX_SHORT_SIDE:
        raise VideoError(422, "too_big_resolution", "Videos up to 1080p are supported. Export a smaller version and try again.")

    placement = find_video_logo(source, info)
    if placement is None:
        raise VideoError(422, "no_watermark", "No Gemini watermark found in this file. It's unchanged.")

    encode(source, output, info, placement)
    carry_c2pa(source, output)


def _delete_later(path: Path) -> BackgroundTask:
    return BackgroundTask(run_in_threadpool, shutil.rmtree, path, ignore_errors=True)


@app.post("/v1/video")
async def clean_video(request: Request, file: UploadFile = File(...), result: str = "file"):
    """Upload → checks → clean → MP4 back. The job folder is deleted after the response (or on error).

    `?result=link` (native apps, whose upload API only returns text): answer `{"id", "url"}`
    and keep only the cleaned result until GET /v1/video/{id}, DELETE, or the 5-minute sweep.
    """
    global _job_slots
    _job_slots = _job_slots or asyncio.Semaphore(MAX_PARALLEL_JOBS)

    extension = Path(file.filename or "").suffix.lower()
    if file.content_type not in VIDEO_TYPES and extension not in VIDEO_EXTENSIONS:
        raise VideoError(415, "unsupported_type", "This file type isn't supported. Use MP4 or MOV.")

    job = jobs_dir() / uuid.uuid4().hex
    job.mkdir(parents=True)
    keep = False
    try:
        source = job / "in.mp4"
        output = job / "out.mp4"
        await run_in_threadpool(_copy_upload, file, source)
        async with _job_slots:
            await run_in_threadpool(_process, source, output)

        client = request.client.host if request.client else "unknown"
        if result == "link":
            await run_in_threadpool(source.unlink, True)  # only the cleaned result waits
            (job / LINK_MARKER).write_text(_clean_name(file.filename), encoding="utf-8")
            rate_limiter.record(client)
            keep = True
            return {"id": job.name, "url": f"/v1/video/{job.name}"}

        rate_limiter.record(client)
        keep = True
        return FileResponse(
            output,
            media_type="video/mp4",
            filename=_clean_name(file.filename),
            headers={"X-Watermark-Detected": "true"},
            background=_delete_later(job),
        )
    except VideoError:
        raise
    except Exception as exc:  # anything unexpected becomes the contract's 500
        raise VideoError(500, "processing_failed", "Couldn't clean this video. Try again.") from exc
    finally:
        if not keep:
            await run_in_threadpool(shutil.rmtree, job, ignore_errors=True)


def _claim(job_id: str) -> Path:
    """Atomically take a finished link job (a second or concurrent request gets 404)."""
    if not JOB_ID.match(job_id):
        raise VideoError(*NOT_FOUND)
    job = jobs_dir() / job_id
    claimed = job.with_name(job_id + ".sending")
    try:
        os.rename(job, claimed)
    except OSError:
        raise VideoError(*NOT_FOUND) from None
    if not (claimed / "out.mp4").is_file():
        shutil.rmtree(claimed, ignore_errors=True)
        raise VideoError(*NOT_FOUND)
    return claimed


def _read_chunks(path: Path):
    with open(path, "rb") as f:
        while chunk := f.read(1024 * 1024):
            yield chunk


@app.get("/v1/video/{job_id}")
def download_video(job_id: str):
    """One-time download of a `?result=link` job: always the whole file (no Range), then the
    folder is deleted."""
    job = _claim(job_id)
    output = job / "out.mp4"
    name = (job / LINK_MARKER).read_text(encoding="utf-8") if (job / LINK_MARKER).exists() else "video-clean.mp4"
    return StreamingResponse(
        _read_chunks(output),
        media_type="video/mp4",
        headers={
            "Content-Length": str(output.stat().st_size),
            "Content-Disposition": f'attachment; filename="{name}"',
            "X-Watermark-Detected": "true",
        },
        background=_delete_later(job),
    )


@app.delete("/v1/video/{job_id}")
def delete_video(job_id: str) -> dict:
    """The app cancelled: drop the result now instead of waiting for the sweep."""
    job = _claim(job_id)
    shutil.rmtree(job, ignore_errors=True)
    return {"deleted": True}
