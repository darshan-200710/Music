"""Backend tests for Vibe Match API."""
import os
import io
import time
import subprocess
import pytest
import requests
from PIL import Image, ImageDraw

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://vibe-match-126.preview.emergentagent.com').rstrip('/')
# Allow override via frontend .env at runtime
try:
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
except Exception:
    pass

TIMEOUT = 120


def _make_real_photo_bytes() -> bytes:
    """Create a JPEG with real features (gradient + shapes + text) so it isn't solid color."""
    img = Image.new('RGB', (800, 600), (30, 50, 90))
    draw = ImageDraw.Draw(img)
    # gradient sky
    for y in range(0, 300):
        c = (30 + y // 3, 50 + y // 4, 90 + y // 5)
        draw.line([(0, y), (800, y)], fill=c)
    # sun
    draw.ellipse((600, 60, 740, 200), fill=(255, 210, 120))
    # mountains
    draw.polygon([(0, 400), (200, 200), (400, 400)], fill=(60, 70, 80))
    draw.polygon([(300, 400), (550, 220), (800, 400)], fill=(80, 90, 100))
    # foreground
    draw.rectangle((0, 400, 800, 600), fill=(40, 80, 50))
    # trees
    for x in (100, 250, 500, 680):
        draw.polygon([(x, 500), (x - 30, 580), (x + 30, 580)], fill=(20, 60, 30))
    draw.text((50, 50), "Golden hour vibes", fill=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=88)
    return buf.getvalue()


@pytest.fixture(scope='session')
def photo_bytes():
    return _make_real_photo_bytes()


@pytest.fixture(scope='session')
def video_bytes(tmp_path_factory):
    """Generate a tiny mp4 using OpenCV with real-feature frames."""
    import cv2
    import numpy as np
    out = tmp_path_factory.mktemp('vid') / 'sample.mp4'
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(str(out), fourcc, 10.0, (320, 240))
    if not writer.isOpened():
        pytest.skip("OpenCV cannot open mp4 writer")
    base = _make_real_photo_bytes()
    img = np.array(Image.open(io.BytesIO(base)).resize((320, 240)))
    img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    for i in range(20):  # 2 seconds @ 10fps
        frame = img_bgr.copy()
        cv2.circle(frame, (20 + i * 10, 120), 15, (0, 0, 255), -1)
        cv2.putText(frame, f"f{i}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        writer.write(frame)
    writer.release()
    if not out.exists() or out.stat().st_size < 100:
        pytest.skip("Failed to create mp4")
    return out.read_bytes()


# ---------- Health ----------
def test_root_endpoint():
    r = requests.get(f"{BASE_URL}/api/", timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    data = r.json()
    assert 'message' in data
    assert 'version' in data


# ---------- Validation ----------
def test_analyze_rejects_text_file():
    files = {'file': ('test.txt', b'hello world', 'text/plain')}
    r = requests.post(f"{BASE_URL}/api/analyze", files=files, timeout=TIMEOUT)
    assert r.status_code == 400, r.text
    assert 'Unsupported' in r.text or 'unsupported' in r.text.lower()


def test_analyze_rejects_empty_file():
    files = {'file': ('empty.jpg', b'', 'image/jpeg')}
    r = requests.post(f"{BASE_URL}/api/analyze", files=files, timeout=TIMEOUT)
    assert r.status_code == 400, r.text
    assert 'empty' in r.text.lower()


# ---------- Image analysis ----------
ANALYSIS_ID_HOLDER = {}


def _assert_analysis_shape(data, media_type):
    assert data['media_type'] == media_type
    assert isinstance(data['mood'], str) and data['mood']
    assert isinstance(data['themes'], list) and len(data['themes']) >= 1
    assert isinstance(data['colors'], list) and len(data['colors']) >= 1
    assert isinstance(data['scene_description'], str)
    assert isinstance(data['aesthetic'], str)
    assert isinstance(data['songs'], list) and len(data['songs']) == 6
    for s in data['songs']:
        assert s['title'] and s['artist'] and s['vibe'] and s['why'] and s['usage_hint']
    assert data['thumbnail_base64'].startswith('data:image/')
    assert 'id' in data and isinstance(data['id'], str)


def test_analyze_image(photo_bytes):
    files = {'file': ('photo.jpg', photo_bytes, 'image/jpeg')}
    r = requests.post(f"{BASE_URL}/api/analyze", files=files, timeout=TIMEOUT)
    assert r.status_code == 200, r.text[:500]
    data = r.json()
    _assert_analysis_shape(data, 'image')
    ANALYSIS_ID_HOLDER['image_id'] = data['id']


def test_analyze_video(video_bytes):
    files = {'file': ('clip.mp4', video_bytes, 'video/mp4')}
    r = requests.post(f"{BASE_URL}/api/analyze", files=files, timeout=TIMEOUT)
    assert r.status_code == 200, r.text[:500]
    data = r.json()
    _assert_analysis_shape(data, 'video')


# ---------- History & retrieval ----------
def test_history_lists_recent():
    # Ensure at least one analysis exists
    if 'image_id' not in ANALYSIS_ID_HOLDER:
        pytest.skip("image analysis didn't run")
    r = requests.get(f"{BASE_URL}/api/history", timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list) and len(data) >= 1
    ids = [d['id'] for d in data]
    assert ANALYSIS_ID_HOLDER['image_id'] in ids
    # sorted desc by created_at
    timestamps = [d['created_at'] for d in data]
    assert timestamps == sorted(timestamps, reverse=True)


def test_get_analysis_by_id():
    if 'image_id' not in ANALYSIS_ID_HOLDER:
        pytest.skip("image analysis didn't run")
    aid = ANALYSIS_ID_HOLDER['image_id']
    r = requests.get(f"{BASE_URL}/api/analysis/{aid}", timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    assert r.json()['id'] == aid


def test_get_analysis_invalid_id():
    r = requests.get(f"{BASE_URL}/api/analysis/does-not-exist-xyz", timeout=TIMEOUT)
    assert r.status_code == 404
