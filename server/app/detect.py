"""NumPy port of apps/app/src/core (detect, refine, verify, remove). Keep the two in step.

Images are uint8 arrays of shape (height, width, 3) in RGB.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.lib.stride_tricks import sliding_window_view

from .masks import MasksConfig, Template

MAX_ALPHA = 0.99


@dataclass(frozen=True)
class Detection:
    detected: bool
    template_id: str | None
    x: int
    y: int
    score: float


def brightness(img: np.ndarray) -> np.ndarray:
    """max(r, g, b) per pixel as float32 — the white logo raises every channel."""
    return img.max(axis=2).astype(np.float32)


def remove(img: np.ndarray, alpha: np.ndarray, x: int, y: int) -> np.ndarray:
    """original = (watermarked − a·255) / (1 − a), inside the box only. Returns a new array."""
    out = img.copy()
    h, w = img.shape[:2]
    s = alpha.shape[0]
    x0, y0, x1, y1 = max(0, x), max(0, y), min(w, x + s), min(h, y + s)
    if x0 >= x1 or y0 >= y1:
        return out
    a = np.minimum(alpha[y0 - y : y1 - y, x0 - x : x1 - x], MAX_ALPHA)[..., None]
    box = img[y0:y1, x0:x1].astype(np.float32)
    restored = (box - a * 255.0) / (1.0 - a)
    out[y0:y1, x0:x1] = np.where(a > 0, np.clip(np.rint(restored), 0, 255), box).astype(np.uint8)
    return out


def candidates(img: np.ndarray, config: MasksConfig) -> list[Detection]:
    """Best NCC match per template (within ± search_radius of its expected position), best
    score first. `detected` marks the ones at or above the threshold."""
    h, w = img.shape[:2]
    r = config.search_radius
    found: list[Detection] = []
    for t in config.templates:
        s = t.size
        ex, ey = w - t.margin_right - s, h - t.margin_bottom - s
        ax0, ay0 = max(0, ex - r), max(0, ey - r)
        ax1, ay1 = min(w, ex + r + s), min(h, ey + r + s)
        if ax1 - ax0 < s or ay1 - ay0 < s:
            continue
        area = brightness(img[ay0:ay1, ax0:ax1])
        windows = sliding_window_view(area, (s, s))  # (ny, nx, s, s)
        m = t.alpha - t.alpha.mean()
        m_norm = float((m * m).sum())
        win_mean = windows.mean(axis=(2, 3), keepdims=True)
        d = windows - win_mean
        cross = (d * m).sum(axis=(2, 3))
        energy = (d * d).sum(axis=(2, 3))
        with np.errstate(divide="ignore", invalid="ignore"):
            score = np.where((energy > 0) & (m_norm > 0), cross / np.sqrt(energy * m_norm), 0.0)
        iy, ix = np.unravel_index(int(np.argmax(score)), score.shape)
        best = float(score[iy, ix])
        found.append(Detection(best >= config.threshold, t.id, ax0 + int(ix), ay0 + int(iy), best))
    return sorted(found, key=lambda d: d.score, reverse=True)


def detect(img: np.ndarray, config: MasksConfig) -> Detection:
    """The single best candidate (see `candidates`)."""
    found = candidates(img, config)
    return found[0] if found else Detection(False, None, 0, 0, 0.0)


def _edge_energy(patch: np.ndarray) -> float:
    b = brightness(patch)
    return float(np.abs(b[:-1, 1:] - b[:-1, :-1]).sum() + np.abs(b[1:, :-1] - b[:-1, :-1]).sum())


def refine_position(img: np.ndarray, alpha: np.ndarray, x: int, y: int, radius: int = 2, margin: int = 4) -> tuple[int, int]:
    """Try every offset within ± radius; keep the one whose removal leaves the least edge energy."""
    h, w = img.shape[:2]
    pad = radius + margin
    s = alpha.shape[0]
    px0, py0 = max(0, x - pad), max(0, y - pad)
    px1, py1 = min(w, x - pad + s + 2 * pad + 1), min(h, y - pad + s + 2 * pad + 1)
    patch = img[py0:py1, px0:px1]
    if patch.size == 0:
        return x, y
    best, best_energy = (x, y), np.inf
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            energy = _edge_energy(remove(patch, alpha, x + dx - px0, y + dy - py0))
            if energy < best_energy or (energy == best_energy and dx == 0 and dy == 0):
                best_energy, best = energy, (x + dx, y + dy)
    return best


def outline_edge_ratio(img: np.ndarray, alpha: np.ndarray, x: int, y: int) -> float:
    """Mean brightness step on the mask outline ÷ (mean step elsewhere in the box + 1). D-015."""
    h, w = img.shape[:2]
    s = alpha.shape[0]
    a = np.pad(alpha, 1, mode="edge")
    mask_step = np.abs(a[1:-1, 2:] - a[1:-1, :-2]) + np.abs(a[2:, 1:-1] - a[:-2, 1:-1])
    b = np.pad(brightness(img), 1, mode="edge")
    ys, xs = np.mgrid[0:s, 0:s]
    px, py = x + xs, y + ys
    inside = (px >= 1) & (py >= 1) & (px < w - 1) & (py < h - 1) & (xs >= 1) & (ys >= 1) & (xs < s - 1) & (ys < s - 1)
    pxc, pyc = np.clip(px, 0, w - 1) + 1, np.clip(py, 0, h - 1) + 1
    step = np.abs(b[pyc, pxc + 1] - b[pyc, pxc - 1]) + np.abs(b[pyc + 1, pxc] - b[pyc - 1, pxc])
    on = inside & (mask_step > 0.1)
    off = inside & (mask_step < 0.005)
    if not on.any() or not off.any():
        return 0.0
    return float(step[on].mean() / (step[off].mean() + 1.0))


def box_variance(img: np.ndarray, x: int, y: int, size: int) -> float:
    h, w = img.shape[:2]
    box = brightness(img[max(0, y) : min(h, y + size), max(0, x) : min(w, x + size)])
    return float(box.var()) if box.size else 0.0


@dataclass(frozen=True)
class Placement:
    """Where to remove, decided once per video."""

    template: Template
    x: int
    y: int
    score: float


def _verified(img: np.ndarray, config: MasksConfig, found: Detection) -> Placement | None:
    """refine → outline visible before, gone after, box smoother (D-015)."""
    t = next(t for t in config.templates if t.id == found.template_id)
    x, y = refine_position(img, t.alpha, found.x, found.y)
    if outline_edge_ratio(img, t.alpha, x, y) < config.min_outline_edge:
        return None
    cleaned = remove(img, t.alpha, x, y)
    if outline_edge_ratio(cleaned, t.alpha, x, y) > config.max_outline_edge_after:
        return None
    if box_variance(cleaned, x, y, t.size) >= box_variance(img, x, y, t.size):
        return None
    return Placement(t, x, y, found.score)


def find_logo(img: np.ndarray, config: MasksConfig) -> Placement | None:
    """Try every candidate above the threshold, best score first; the first one that passes
    verification wins. Texture can make a wrong template outscore the real one. None = no logo."""
    for found in candidates(img, config):
        if not found.detected:
            break
        placement = _verified(img, config, found)
        if placement:
            return placement
    return None
