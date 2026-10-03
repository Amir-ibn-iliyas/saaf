import json
import subprocess

import pytest
from fastapi.testclient import TestClient

from app import main
from app.video import C2PA_UUID

from .conftest import FIXTURES, needs_ffmpeg

client = TestClient(main.app)


def post(path, content_type="video/mp4"):
    with open(path, "rb") as f:
        return client.post("/v1/video", files={"file": (path.name, f, content_type)})


def assert_error(response, status, code):
    assert response.status_code == status, response.text
    assert response.json()["error"] == code
    assert response.json()["message"]


def assert_no_jobs_left(jobs_dir):
    assert not jobs_dir.exists() or not any(jobs_dir.iterdir())


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", str(path)],
        capture_output=True,
        check=True,
    ).stdout
    return json.loads(out)


def test_masks_endpoint_serves_config_and_mask_data():
    data = client.get("/v1/masks").json()
    assert data["templates"] and data["videoTemplates"]
    for t in data["templates"] + data["videoTemplates"]:
        mask = data["masks"][t["file"]]
        assert mask["size"] == t["size"] and mask["encoding"] == "base64-u8" and mask["data"]


def test_wrong_type_is_415(tmp_path, jobs_dir):
    note = tmp_path / "notes.txt"
    note.write_text("hello")
    assert_error(post(note, content_type="text/plain"), 415, "unsupported_type")
    assert_no_jobs_left(jobs_dir)


@needs_ffmpeg
def test_broken_mp4_is_415(tmp_path, jobs_dir):
    broken = tmp_path / "broken.mp4"
    broken.write_bytes(b"\x00" * 5000)
    assert_error(post(broken), 415, "unsupported_type")
    assert_no_jobs_left(jobs_dir)


def test_too_large_is_413(tmp_path, jobs_dir, monkeypatch):
    monkeypatch.setattr(main, "MAX_UPLOAD_BYTES", 1000)
    monkeypatch.setattr(main, "MAX_BODY_BYTES", 10**9)
    big = tmp_path / "big.mp4"
    big.write_bytes(b"\x00" * 5000)
    assert_error(post(big), 413, "too_large")
    assert_no_jobs_left(jobs_dir)


@pytest.fixture
def plain_video(tmp_path):
    """3 s test pattern without any logo (made by ffmpeg)."""
    path = tmp_path / "plain.mp4"
    subprocess.run(
        [
            "ffmpeg", "-v", "error", "-f", "lavfi", "-i", "testsrc2=size=640x360:rate=24:duration=3",
            "-pix_fmt", "yuv420p", str(path),
        ],
        check=True,
    )
    return path


@needs_ffmpeg
def test_too_long_is_422(plain_video, jobs_dir, monkeypatch):
    monkeypatch.setattr(main, "MAX_SECONDS", 1)
    assert_error(post(plain_video), 422, "too_long")
    assert_no_jobs_left(jobs_dir)


@needs_ffmpeg
def test_over_1080p_is_422(plain_video, jobs_dir, monkeypatch):
    monkeypatch.setattr(main, "MAX_LONG_SIDE", 320)
    assert_error(post(plain_video), 422, "too_big_resolution")
    assert_no_jobs_left(jobs_dir)


@needs_ffmpeg
def test_video_without_logo_is_422(plain_video, jobs_dir):
    assert_error(post(plain_video), 422, "no_watermark")
    assert_no_jobs_left(jobs_dir)


VEO = sorted(FIXTURES.glob("veo-*.mp4")) if FIXTURES.exists() else []


@needs_ffmpeg
@pytest.mark.skipif(not VEO, reason="no Veo fixtures")
@pytest.mark.parametrize("video", VEO, ids=lambda p: p.name)
def test_veo_fixture_is_cleaned(video, tmp_path, jobs_dir):
    response = post(video)
    assert response.status_code == 200, response.text
    assert response.headers["x-watermark-detected"] == "true"
    assert video.stem + "-clean.mp4" in response.headers["content-disposition"]

    out = tmp_path / "out.mp4"
    out.write_bytes(response.content)
    src, dst = probe(video), probe(out)
    v_src = next(s for s in src["streams"] if s["codec_type"] == "video")
    v_dst = next(s for s in dst["streams"] if s["codec_type"] == "video")
    assert (v_dst["width"], v_dst["height"], v_dst["r_frame_rate"]) == (
        v_src["width"], v_src["height"], v_src["r_frame_rate"],
    )
    assert v_dst["nb_frames"] == v_src["nb_frames"]
    assert abs(float(dst["format"]["duration"]) - float(src["format"]["duration"])) < 0.1
    assert any(s["codec_type"] == "audio" for s in dst["streams"])
    # Provenance kept (D-017): the source's C2PA uuid box is carried into the output.
    assert C2PA_UUID in video.read_bytes()
    assert C2PA_UUID in response.content
    assert_no_jobs_left(jobs_dir)


def test_download_rejects_bad_or_unknown_ids(jobs_dir):
    for job_id in ("..%2F..%2Fetc", "abc", "0" * 32):
        response = client.get(f"/v1/video/{job_id}")
        assert response.status_code in (404, 405)
        if response.status_code == 404 and response.headers.get("content-type", "").startswith("application/json"):
            assert response.json().get("error", "not_found") == "not_found"


@needs_ffmpeg
def test_link_mode_error_leaves_nothing(plain_video, jobs_dir):
    with open(plain_video, "rb") as f:
        response = client.post("/v1/video?result=link", files={"file": ("plain.mp4", f, "video/mp4")})
    assert_error(response, 422, "no_watermark")
    assert_no_jobs_left(jobs_dir)


def _link_job(video):
    with open(video, "rb") as f:
        response = client.post("/v1/video?result=link", files={"file": (video.name, f, "video/mp4")})
    assert response.status_code == 200, response.text
    return response.json()["id"]


@needs_ffmpeg
@pytest.mark.skipif(not VEO, reason="no Veo fixtures")
def test_link_download_ignores_range_and_is_one_time(jobs_dir):
    job_id = _link_job(VEO[0])
    response = client.get(f"/v1/video/{job_id}", headers={"Range": "bytes=0-9"})
    assert response.status_code == 200
    assert len(response.content) > 1000 and response.content[4:8] == b"ftyp"
    assert_no_jobs_left(jobs_dir)
    assert client.get(f"/v1/video/{job_id}").status_code == 404


@needs_ffmpeg
@pytest.mark.skipif(not VEO, reason="no Veo fixtures")
def test_link_delete_removes_the_result(jobs_dir):
    job_id = _link_job(VEO[0])
    assert client.delete(f"/v1/video/{job_id}").json() == {"deleted": True}
    assert_no_jobs_left(jobs_dir)
    assert client.get(f"/v1/video/{job_id}").status_code == 404


@needs_ffmpeg
@pytest.mark.skipif(not VEO, reason="no Veo fixtures")
def test_link_mode_then_one_time_download(tmp_path, jobs_dir):
    video = VEO[0]
    with open(video, "rb") as f:
        response = client.post("/v1/video?result=link", files={"file": (video.name, f, "video/mp4")})
    assert response.status_code == 200, response.text
    job_id = response.json()["id"]
    assert response.json()["url"] == f"/v1/video/{job_id}"
    # only the cleaned result waits on the server, not the upload
    assert sorted(p.name for p in (jobs_dir / job_id).iterdir()) == ["out.mp4", "source-name"]

    download = client.get(f"/v1/video/{job_id}")
    assert download.status_code == 200
    assert video.stem + "-clean.mp4" in download.headers["content-disposition"]
    assert C2PA_UUID in download.content
    assert_no_jobs_left(jobs_dir)
    assert client.get(f"/v1/video/{job_id}").status_code == 404
