import shutil
from pathlib import Path

import numpy as np
import pytest

FIXTURES = Path(__file__).resolve().parents[2] / "fixtures" / "videos"
HAS_FFMPEG = bool(shutil.which("ffmpeg") and shutil.which("ffprobe"))

needs_ffmpeg = pytest.mark.skipif(not HAS_FFMPEG, reason="ffmpeg/ffprobe not on PATH")


@pytest.fixture(autouse=True)
def fresh_rate_limit():
    from app.main import rate_limiter

    rate_limiter.reset()
    yield
    rate_limiter.reset()


@pytest.fixture(autouse=True)
def jobs_dir(tmp_path, monkeypatch):
    """Every test gets its own job folder so we can check nothing is left behind."""
    path = tmp_path / "jobs"
    monkeypatch.setenv("SAAF_JOBS_DIR", str(path))
    return path


def make_photo(height: int, width: int, seed: int = 1, noise: float = 12) -> np.ndarray:
    """Photo-like test image: smooth gradients plus a little noise (uint8 RGB)."""
    rng = np.random.default_rng(seed)
    ys, xs = np.mgrid[0:height, 0:width].astype(np.float32)
    img = np.stack(
        [40 + 150 * xs / width, 30 + 170 * ys / height, 90 + 60 * np.sin((xs + ys) / 37)], axis=-1
    )
    img += (rng.random(img.shape) - 0.5) * noise
    return np.clip(np.rint(img), 0, 255).astype(np.uint8)


def blend(img: np.ndarray, alpha: np.ndarray, x: int, y: int) -> np.ndarray:
    """The white-logo blend: out = a * 255 + (1 - a) * in."""
    out = img.astype(np.float32).copy()
    s = alpha.shape[0]
    a = alpha[..., None]
    out[y : y + s, x : x + s] = a * 255 + (1 - a) * out[y : y + s, x : x + s]
    return np.clip(np.rint(out), 0, 255).astype(np.uint8)
