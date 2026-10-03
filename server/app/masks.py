"""Loads the alpha masks shared with the app (apps/app/src/core/masks.json + masks/*.json)."""

from __future__ import annotations

import base64
import json
import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import numpy as np

# One source of truth: the app's core folder. Phase 6 copies it into the Docker image and
# points SAAF_MASKS_DIR at the copy.
DEFAULT_MASKS_DIR = Path(__file__).resolve().parents[2] / "apps" / "app" / "src" / "core"


@dataclass(frozen=True)
class Template:
    id: str
    size: int
    margin_right: int
    margin_bottom: int
    alpha: np.ndarray  # float32, shape (size, size), values 0..1


@dataclass(frozen=True)
class MasksConfig:
    version: str
    threshold: float
    search_radius: int
    min_outline_edge: float
    max_outline_edge_after: float
    templates: tuple[Template, ...]


def masks_dir() -> Path:
    return Path(os.environ.get("SAAF_MASKS_DIR", DEFAULT_MASKS_DIR))


def _decode_mask(path: Path) -> np.ndarray:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data["encoding"] != "base64-u8":
        raise ValueError(f"unknown mask encoding in {path.name}")
    size = data["size"]
    raw = np.frombuffer(base64.b64decode(data["data"]), dtype=np.uint8)
    if raw.size != size * size:
        raise ValueError(f"{path.name}: {raw.size} values, expected {size * size}")
    return (raw.astype(np.float32) / 255.0).reshape(size, size)


@lru_cache(maxsize=2)
def load_config(kind: str = "image") -> MasksConfig:
    """kind="image" uses `templates`; kind="video" uses `videoTemplates` (Veo, D-017)."""
    root = masks_dir()
    config = json.loads((root / "masks.json").read_text(encoding="utf-8"))
    alphas: dict[str, np.ndarray] = {}
    templates = []
    for t in config["videoTemplates" if kind == "video" else "templates"]:
        if t["file"] not in alphas:
            alphas[t["file"]] = _decode_mask(root / "masks" / f"{t['file']}.json")
        alpha = alphas[t["file"]]
        if alpha.shape[0] != t["size"]:
            raise ValueError(f"template {t['id']} is {t['size']} px but its mask is {alpha.shape[0]} px")
        templates.append(Template(t["id"], t["size"], t["marginRight"], t["marginBottom"], alpha))
    return MasksConfig(
        version=config["version"],
        threshold=config["threshold"],
        search_radius=config["searchRadius"],
        min_outline_edge=config["minOutlineEdge"],
        max_outline_edge_after=config["maxOutlineEdgeAfter"],
        templates=tuple(templates),
    )


def masks_json() -> dict:
    """Served at GET /v1/masks: the app's masks.json plus every mask file it references
    (`masks`: id → mask JSON), so the app can switch to new masks without a release (5.2)."""
    root = masks_dir()
    config = json.loads((root / "masks.json").read_text(encoding="utf-8"))
    ids = {t["file"] for t in config.get("templates", []) + config.get("videoTemplates", [])}
    config["masks"] = {
        mask_id: json.loads((root / "masks" / f"{mask_id}.json").read_text(encoding="utf-8")) for mask_id in sorted(ids)
    }
    return config
