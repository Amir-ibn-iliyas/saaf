import os
import time

from fastapi.testclient import TestClient

from app import main
from app.limits import LINK_MARKER, RateLimiter, sweep

client = TestClient(main.app)


def test_rate_limiter_counts_only_recorded_cleans():
    limiter = RateLimiter(limit=2, window=60)
    assert limiter.allowed("a", now=0)
    limiter.record("a", now=0)
    limiter.record("a", now=1)
    assert not limiter.allowed("a", now=2)
    assert limiter.allowed("b", now=2)  # per IP
    assert limiter.allowed("a", now=61)  # window moved on
    assert "a" not in limiter._hits  # old keys are dropped


def test_eleventh_clean_in_an_hour_is_429_before_reading_the_body():
    for _ in range(10):
        main.rate_limiter.record("testclient")
    response = client.post("/v1/video", files={"file": ("v.mp4", b"x" * 100, "video/mp4")})
    assert response.status_code == 429
    assert response.json()["error"] == "rate_limited"


def test_failed_attempts_do_not_count(tmp_path):
    for _ in range(12):
        assert client.post("/v1/video", files={"file": ("n.txt", b"x", "text/plain")}).status_code == 415


def test_oversize_body_is_refused_unread(monkeypatch):
    monkeypatch.setattr(main, "MAX_BODY_BYTES", 1000)
    response = client.post("/v1/video", files={"file": ("big.mp4", b"\0" * 5000, "video/mp4")})
    assert response.status_code == 413
    assert response.json()["error"] == "too_large"


def test_sweep_ages(tmp_path):
    now = time.time()
    old, new, link_old = tmp_path / "old", tmp_path / "new", tmp_path / "link"
    for d in (old, new, link_old):
        d.mkdir()
    (link_old / LINK_MARKER).write_text("x-clean.mp4")
    os.utime(old, (now - 16 * 60, now - 16 * 60))
    os.utime(link_old, (now - 6 * 60, now - 6 * 60))
    assert sweep(tmp_path, now=now) == 2
    assert new.exists() and not old.exists() and not link_old.exists()
    assert sweep(tmp_path / "missing") == 0


def test_cors_allows_local_expo_web_only():
    for origin in ("http://localhost:8081", "http://localhost:8083", "http://127.0.0.1:19006"):
        ok = client.get("/health", headers={"Origin": origin})
        assert ok.headers.get("access-control-allow-origin") == origin
    other = client.get("/health", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in other.headers
