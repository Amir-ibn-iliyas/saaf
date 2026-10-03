"""Rate limit (cleaned videos per IP per hour) and the sweep that deletes stale job folders."""

from __future__ import annotations

import shutil
import threading
import time
from collections import defaultdict, deque
from pathlib import Path

VIDEOS_PER_HOUR = 10
# Any job folder (crash leftovers) is removed after 15 minutes at most (CLAUDE.md rule 5).
JOB_MAX_AGE_SECONDS = 15 * 60
# A `?result=link` result nobody downloaded (cancelled app) goes after 5 minutes.
LINK_RESULT_MAX_AGE_SECONDS = 5 * 60
SWEEP_EVERY_SECONDS = 60
LINK_MARKER = "source-name"


class RateLimiter:
    """In-memory sliding window of successful cleans per IP. One process is enough for Phase 1.
    Behind a proxy (Phase 6) the key must be the forwarded client IP (uvicorn --proxy-headers)."""

    def __init__(self, limit: int = VIDEOS_PER_HOUR, window: float = 3600.0):
        self.limit = limit
        self.window = window
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def _prune(self, key: str, now: float) -> deque[float]:
        hits = self._hits[key]
        while hits and now - hits[0] >= self.window:
            hits.popleft()
        if not hits:
            del self._hits[key]
            return deque()
        return hits

    def allowed(self, key: str, now: float | None = None) -> bool:
        """True if this IP may start another video (does not count it)."""
        now = time.monotonic() if now is None else now
        with self._lock:
            return len(self._prune(key, now)) < self.limit

    def record(self, key: str, now: float | None = None) -> None:
        """Count one successful clean."""
        now = time.monotonic() if now is None else now
        with self._lock:
            self._prune(key, now)
            self._hits[key].append(now)

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


def sweep(jobs: Path, now: float | None = None) -> int:
    """Delete stale job folders: link results after 5 min, anything after 15 min."""
    if not jobs.exists():
        return 0
    now = time.time() if now is None else now
    removed = 0
    for job in jobs.iterdir():
        try:
            if not job.is_dir():
                continue
            age = now - job.stat().st_mtime
            limit = LINK_RESULT_MAX_AGE_SECONDS if (job / LINK_MARKER).exists() else JOB_MAX_AGE_SECONDS
            if age > limit:
                shutil.rmtree(job, ignore_errors=True)
                removed += 1
        except FileNotFoundError:
            continue
    return removed


def start_sweeper(jobs_dir, stop: threading.Event) -> threading.Thread:
    """Background thread: sweep now and then every minute until `stop` is set."""

    def run():
        while True:
            sweep(jobs_dir())
            if stop.wait(SWEEP_EVERY_SECONDS):
                return

    thread = threading.Thread(target=run, name="saaf-sweeper", daemon=True)
    thread.start()
    return thread
