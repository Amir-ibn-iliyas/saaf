"""Video cleaning: ffprobe → detect on the mean of the first frames → per-frame removal →
re-encode (same size and fps, audio copied) → keep the C2PA box. See docs/03-architecture.md."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from numpy.lib.stride_tricks import sliding_window_view

from .detect import Placement, find_logo, remove
from .masks import load_config

DETECT_FRAMES = 30
PROBE_TIMEOUT_SECONDS = 30
# A 60 s 1080p clip takes well under a minute on the free server; this only stops a hung ffmpeg.
ENCODE_TIMEOUT_SECONDS = 600
# BMFF uuid of the C2PA manifest store box.
C2PA_UUID = bytes.fromhex("d8fec3d61b0e483c92975828877ec481")


class VideoError(Exception):
    """An error with an API code (see the contract in docs/03-architecture.md)."""

    def __init__(self, status: int, code: str, message: str):
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message


def _tool(name: str) -> str:
    path = os.environ.get(f"SAAF_{name.upper()}") or shutil.which(name)
    if not path:
        raise VideoError(500, "processing_failed", f"{name} is not installed on the server.")
    return path


@dataclass(frozen=True)
class Probe:
    width: int
    height: int
    fps: str  # exact rational, e.g. "24/1"
    duration: float
    has_audio: bool
    frames: int | None = None  # nb_frames when the container says


def probe(path: Path) -> Probe:
    try:
        result = subprocess.run(
            [_tool("ffprobe"), "-v", "error", "-print_format", "json", "-show_streams", "-show_format", str(path)],
            capture_output=True,
            timeout=PROBE_TIMEOUT_SECONDS,
        )
    except subprocess.TimeoutExpired:
        raise VideoError(415, "unsupported_type", "This file type isn't supported. Use MP4 or MOV.") from None
    if result.returncode != 0:
        raise VideoError(415, "unsupported_type", "This file type isn't supported. Use MP4 or MOV.")
    info = json.loads(result.stdout or b"{}")
    streams = info.get("streams", [])
    video = next((s for s in streams if s.get("codec_type") == "video"), None)
    if video is None:
        raise VideoError(415, "unsupported_type", "This file type isn't supported. Use MP4 or MOV.")
    duration = float(info.get("format", {}).get("duration") or video.get("duration") or 0)
    width, height = int(video["width"]), int(video["height"])
    # ffmpeg auto-rotates on decode, so frames come out in display orientation.
    rotation = int(float(video.get("tags", {}).get("rotate", 0) or 0))
    for side in video.get("side_data_list", []) or []:
        rotation = int(float(side.get("rotation", rotation) or 0))
    if abs(rotation) % 180 == 90:
        width, height = height, width
    nb = video.get("nb_frames")
    return Probe(
        width=width,
        height=height,
        fps=video.get("r_frame_rate") or "30/1",
        duration=duration,
        has_audio=any(s.get("codec_type") == "audio" for s in streams),
        frames=int(nb) if nb and str(nb).isdigit() else None,
    )


def _decoder(path: Path, frames: int | None = None) -> subprocess.Popen:
    # Untagged HD video is BT.709; use it explicitly both ways so colours do not shift.
    cmd = [_tool("ffmpeg"), "-v", "error", "-i", str(path)]
    if frames:
        cmd += ["-frames:v", str(frames)]
    cmd += ["-vf", "scale=in_color_matrix=bt709:in_range=tv", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    return subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)


def _frames(proc: subprocess.Popen, width: int, height: int):
    size = width * height * 3
    assert proc.stdout is not None
    while True:
        buf = proc.stdout.read(size)
        if len(buf) < size:
            return
        yield np.frombuffer(buf, np.uint8).reshape(height, width, 3)


def _stop(proc: subprocess.Popen) -> None:
    """Kill (if still running) and reap a child process; never raises."""
    try:
        if proc.poll() is None:
            proc.kill()
        proc.wait(timeout=10)
    except Exception:
        pass


def find_video_logo(path: Path, info: Probe) -> Placement | None:
    """Detect on the mean of the first frames: moving content averages out, the logo does not."""
    proc = _decoder(path, DETECT_FRAMES)
    total = np.zeros((info.height, info.width, 3), np.float64)
    count = 0
    try:
        for frame in _frames(proc, info.width, info.height):
            total += frame
            count += 1
    finally:
        _stop(proc)
    if count == 0:
        raise VideoError(415, "unsupported_type", "This file type isn't supported. Use MP4 or MOV.")
    mean = np.rint(total / count).astype(np.uint8)
    return find_logo(mean, load_config("video"))


def edge_band(alpha: np.ndarray) -> np.ndarray:
    """Pixels on the logo outline, where video compression leaves a faint ring after removal."""
    a = np.pad(alpha, 1, mode="edge")
    step = np.abs(a[1:-1, 2:] - a[1:-1, :-2]) + np.abs(a[2:, 1:-1] - a[:-2, 1:-1])
    # 0.08 for a full-strength (max ≈ 0.5) mask, scaled for fainter ones.
    return step > 0.08 * (float(alpha.max()) / 0.5)


def clean_frame(frame: np.ndarray, placement: Placement, band: np.ndarray) -> np.ndarray:
    """Reverse blend in the box, then a 3×3 median on the outline band (docs/04 edge cleanup)."""
    t, x, y = placement.template, placement.x, placement.y
    out = remove(frame, t.alpha, x, y)
    s = t.size
    h, w = frame.shape[:2]
    if x < 1 or y < 1 or x + s + 1 > w or y + s + 1 > h:
        return out
    region = out[y - 1 : y + s + 1, x - 1 : x + s + 1]
    median = np.median(sliding_window_view(region, (3, 3), axis=(0, 1)), axis=(-2, -1)).astype(np.uint8)
    box = out[y : y + s, x : x + s]
    box[band] = median[band]
    return out


def encode(src: Path, out: Path, info: Probe, placement: Placement) -> None:
    """Decode → clean every frame → encode H.264 (CRF 18), same size and fps, audio copied."""
    log = out.with_suffix(".log")
    cmd = [
        _tool("ffmpeg"), "-v", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{info.width}x{info.height}", "-r", info.fps, "-i", "-",
        "-i", str(src),
        "-map", "0:v:0", "-map", "1:a?",
        "-vf", "scale=out_color_matrix=bt709:out_range=tv",
        "-c:v", "libx264", "-crf", "18", "-preset", "veryfast", "-pix_fmt", "yuv420p",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
        "-c:a", "copy", "-movflags", "+faststart",
        str(out),
    ]
    failed = VideoError(500, "processing_failed", "Couldn't clean this video. Try again.")
    band = edge_band(placement.template.alpha)
    decoder = _decoder(src)
    written = 0
    ok = False
    with open(log, "wb") as log_file:
        encoder = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=log_file)
        assert encoder.stdin is not None
        try:
            for frame in _frames(decoder, info.width, info.height):
                encoder.stdin.write(clean_frame(frame, placement, band).tobytes())
                written += 1
            decoder.wait(timeout=ENCODE_TIMEOUT_SECONDS)
            encoder.stdin.close()
            encoder.wait(timeout=ENCODE_TIMEOUT_SECONDS)
            ok = decoder.returncode == 0 and encoder.returncode == 0
        except (OSError, subprocess.TimeoutExpired):
            ok = False  # ffmpeg died (broken pipe) or hung
        finally:
            # Stop the decoder first so it does not keep the upload open (Windows file lock).
            _stop(decoder)
            try:
                encoder.stdin.close()
            except OSError:
                pass
            _stop(encoder)
    # A cut-off or corrupt file decodes fewer frames than the container promises.
    if info.frames and written < info.frames:
        ok = False
    if not ok or written == 0 or not out.exists():
        raise failed
    log.unlink(missing_ok=True)


def _top_level_boxes(data: bytes):
    """(offset, size, type) of each top-level ISO-BMFF box."""
    o = 0
    while o + 8 <= len(data):
        size = int.from_bytes(data[o : o + 4], "big")
        kind = data[o + 4 : o + 8]
        if size == 1 and o + 16 <= len(data):
            size = int.from_bytes(data[o + 8 : o + 16], "big")
        elif size == 0:
            size = len(data) - o
        if size < 8 or o + size > len(data):
            return
        yield o, size, kind
        o += size


def carry_c2pa(src: Path, out: Path) -> bool:
    """Append the source's C2PA uuid box(es) to the output (end of file, so no chunk offsets
    move). Returns True if the source had none or they were carried (D-017)."""
    data = src.read_bytes()
    boxes = [
        data[o : o + size]
        for o, size, kind in _top_level_boxes(data)
        if kind == b"uuid" and data[o + 8 : o + 24] == C2PA_UUID
    ]
    if not boxes:
        return True
    with open(out, "ab") as f:
        for box in boxes:
            f.write(box)
    return True
