import numpy as np
import pytest

from app.detect import detect, find_logo, remove
from app.masks import load_config

from .conftest import blend, make_photo

CONFIG = load_config("image")
VIDEO = load_config("video")


@pytest.mark.parametrize("template", CONFIG.templates, ids=lambda t: t.id)
def test_round_trip(template):
    photo = make_photo(360, 400, seed=7)
    x, y = 400 - template.margin_right - template.size, 360 - template.margin_bottom - template.size
    cleaned = remove(blend(photo, template.alpha, x, y), template.alpha, x, y)
    assert int(np.abs(cleaned.astype(int) - photo.astype(int)).max()) <= 2


@pytest.mark.parametrize("template", CONFIG.templates, ids=lambda t: t.id)
def test_detects_and_verifies_each_template(template):
    photo = make_photo(640, 900, seed=11)
    x, y = 900 - template.margin_right - template.size, 640 - template.margin_bottom - template.size
    found = find_logo(blend(photo, template.alpha, x, y), CONFIG)
    assert found is not None
    assert (found.template.id, found.x, found.y) == (template.id, x, y)


def test_veo_template_found_on_a_video_sized_frame():
    t = next(t for t in VIDEO.templates if t.id == "veo-48-m96")
    frame = make_photo(720, 1280, seed=3, noise=6)
    found = find_logo(blend(frame, t.alpha, 1280 - 96 - 48, 720 - 96 - 48), VIDEO)
    assert found is not None
    assert (found.template.id, found.x, found.y) == ("veo-48-m96", 1136, 576)


def test_plain_photos_are_left_alone():
    for seed in range(1, 6):
        assert find_logo(make_photo(768, 1024, seed=seed), CONFIG) is None
        assert find_logo(make_photo(720, 1280, seed=seed), VIDEO) is None


def test_flat_image_scores_zero():
    d = detect(np.full((300, 300, 3), 128, np.uint8), CONFIG)
    assert not d.detected and d.score == 0
