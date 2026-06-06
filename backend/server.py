from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import base64
import uuid
import tempfile
import io
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False
    genai = None

from PIL import Image
import cv2


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
try:
    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=2000)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    HAS_DB = True
except Exception as e:
    logger.warning(f"MongoDB not available: {e}. History persistence is disabled.")
    db = None
    client = None
    HAS_DB = False

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-2.5-flash')
ENABLE_MOCK_ANALYSIS = os.environ.get('ENABLE_MOCK_ANALYSIS', '').lower() in {'1', 'true', 'yes'}

if HAS_GEMINI and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Create the main app
app = FastAPI(title="Vibe Match - Instagram Song Suggester")
api_router = APIRouter(prefix="/api")


# ============ Models ============
class SongSuggestion(BaseModel):
    title: str
    artist: str
    vibe: str
    why: str
    usage_hint: str


class AnalysisResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    media_type: str  # "image" or "video"
    mood: str
    themes: List[str]
    colors: List[str]
    scene_description: str
    aesthetic: str
    songs: List[SongSuggestion]
    thumbnail_base64: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ============ Media Processing ============
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/mov"}
MAX_DIM = 1280


def _normalize_image_bytes(raw_bytes: bytes) -> bytes:
    """Open via Pillow, convert to RGB JPEG, resize if too large."""
    img = Image.open(io.BytesIO(raw_bytes))
    if getattr(img, "is_animated", False):
        img.seek(0)
    img = img.convert("RGB")
    w, h = img.size
    if max(w, h) > MAX_DIM:
        scale = MAX_DIM / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    out = io.BytesIO()
    img.save(out, format="JPEG", quality=85)
    return out.getvalue()


def _extract_video_frame(raw_bytes: bytes) -> bytes:
    """Extract a representative frame (~30% mark) from a video as JPEG bytes."""
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp.write(raw_bytes)
        tmp_path = tmp.name
    try:
        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Could not open video file")
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        target = max(0, int(total * 0.3)) if total > 0 else 0
        cap.set(cv2.CAP_PROP_POS_FRAMES, target)
        ok, frame = cap.read()
        if not ok:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ok, frame = cap.read()
        cap.release()
        if not ok or frame is None:
            raise HTTPException(status_code=400, detail="Could not read video frame")
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(rgb)
        w, h = img.size
        if max(w, h) > MAX_DIM:
            scale = MAX_DIM / max(w, h)
            img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        out = io.BytesIO()
        img.save(out, format="JPEG", quality=85)
        return out.getvalue()
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


# ============ LLM Prompting ============
SYSTEM_PROMPT = """You are a creative music director for Instagram content creators. You analyze visual media and recommend songs that perfectly match the vibe for Instagram Stories and Posts.

You understand current Instagram audio trends, viral sounds, and how to match music to visual aesthetics.

You MUST respond ONLY with a valid JSON object, no markdown, no code fences, no commentary. The JSON schema is:
{
  "mood": "one short phrase capturing the dominant emotional tone",
  "themes": ["theme1", "theme2", "theme3"],
  "colors": ["dominant color description 1", "color 2", "color 3"],
  "scene_description": "1-2 sentence vivid description of what's in the media",
  "aesthetic": "the overall aesthetic style (e.g., golden hour, minimalist, vibrant urban, soft pastel, moody cinematic)",
  "songs": [
    {
      "title": "Song Title",
      "artist": "Artist Name",
      "vibe": "2-3 word vibe tag",
      "why": "one sentence on why this song matches the visual",
      "usage_hint": "short Instagram usage tip (e.g., 'great for Reels with slow motion at 0:30')"
    }
  ]
}

Provide exactly 6 song suggestions. Mix popular Instagram-trending tracks with timeless songs. Be specific with real song titles and artists - do not invent fake songs."""


def _build_user_prompt(media_type: str) -> str:
    label = "image" if media_type == "image" else "key frame from a video"
    return (
        f"Analyze this {label} and suggest 6 songs that would be perfect for an "
        f"Instagram Story or Post featuring this content. Consider the mood, colors, "
        f"themes, and overall aesthetic. Return ONLY the JSON object."
    )


def _parse_llm_json(text: str) -> Dict[str, Any]:
    """Strip code fences and parse JSON."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```", 2)[1] if "```" in cleaned else cleaned
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip("`").strip()
    # find first { and last }
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON object in LLM response")
    return json.loads(cleaned[start:end + 1])


def _get_mock_analysis() -> Dict[str, Any]:
    """Return a mock analysis when LLM is not available."""
    moods = ["Chill", "Energetic", "Moody", "Uplifting", "Dark", "Euphoric"]
    themes = ["Urban", "Nature", "Nightlife", "Summer", "Indie", "Electronic"]
    aesthetics = ["Minimalist", "Vibrant", "Cinematic", "Retro", "Modern", "Dreamy"]
    colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#C299FF"]
    
    songs = [
        {
            "title": "Midnight Dreams",
            "artist": "Luna Wave",
            "vibe": "Atmospheric",
            "why": "Matches the overall mood and aesthetic",
            "usage_hint": "Perfect for intro or establishing shots"
        },
        {
            "title": "Electric Pulse",
            "artist": "Neon City",
            "vibe": "Upbeat",
            "why": "Complements the energy of the scene",
            "usage_hint": "Great for transitions and dynamic moments"
        },
        {
            "title": "Velvet Echo",
            "artist": "Sonic Dreams",
            "vibe": "Smooth",
            "why": "Adds depth and sophistication",
            "usage_hint": "Ideal for emotional or introspective shots"
        },
        {
            "title": "Digital Horizon",
            "artist": "Synth Wave",
            "vibe": "Modern",
            "why": "Contemporary feel matches the visual style",
            "usage_hint": "Works well for forward-moving sequences"
        },
        {
            "title": "Golden Hour",
            "artist": "Ambient Collective",
            "vibe": "Warm",
            "why": "Captures the warmth and emotion",
            "usage_hint": "Perfect for background or ambient moments"
        },
        {
            "title": "Neon Lights",
            "artist": "Cyber Sound",
            "vibe": "Futuristic",
            "why": "Complements the visual narrative",
            "usage_hint": "Great for climactic or impactful moments"
        }
    ]
    
    return {
        "mood": "Vibrant & Dynamic",
        "themes": [themes[0], themes[1], themes[2]],
        "colors": colors[:3],
        "scene_description": "A visually compelling composition with strong aesthetic appeal",
        "aesthetic": aesthetics[2],
        "songs": songs
    }


def _gemini_error(error: Exception) -> str:
    message = " ".join(str(error).split()) or error.__class__.__name__
    lower_message = message.lower()
    if "429" in message or "quota" in lower_message:
        message = (
            f"quota exceeded for {GEMINI_MODEL}. Use a Gemini key with quota, "
            "enable billing, or change GEMINI_MODEL."
        )
    if len(message) > 500:
        message = f"{message[:497]}..."
    return f"Gemini: {message}"


async def _analyze_with_gemini(image_bytes: bytes, media_type: str) -> Dict[str, Any]:
    if not HAS_GEMINI:
        raise RuntimeError("google-generativeai is not installed")
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    image = Image.open(io.BytesIO(image_bytes))
    model = genai.GenerativeModel(GEMINI_MODEL)
    user_prompt = _build_user_prompt(media_type)
    full_prompt = f"{SYSTEM_PROMPT}\n\n{user_prompt}"
    response = model.generate_content([full_prompt, image])
    return _parse_llm_json(response.text)


async def _analyze_with_llm(image_bytes: bytes, media_type: str) -> Dict[str, Any]:
    """Analyze media using Gemini only."""
    try:
        return await _analyze_with_gemini(image_bytes, media_type)
    except Exception as e:
        logger.warning("Gemini analysis failed", exc_info=True)
        if ENABLE_MOCK_ANALYSIS:
            logger.warning("Using mock analysis because ENABLE_MOCK_ANALYSIS is enabled")
            return _get_mock_analysis()
        raise RuntimeError(
            "Gemini analysis failed. "
            "Mock analysis is disabled, so no fake response was returned. "
            + _gemini_error(e)
        ) from e

# ============ Routes ============
@api_router.get("/")
async def root():
    return {"message": "Vibe Match API is running", "version": "1.0"}


@api_router.post("/analyze", response_model=AnalysisResult)
async def analyze_media(file: UploadFile = File(...)):
    if not file.content_type:
        raise HTTPException(status_code=400, detail="Missing content type")

    raw = await file.read()
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(raw) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")

    ctype = file.content_type.lower()
    media_type: str
    if ctype in ALLOWED_IMAGE_TYPES or ctype.startswith("image/"):
        media_type = "image"
        try:
            image_bytes = _normalize_image_bytes(raw)
        except Exception as e:
            logger.exception("Image processing failed")
            raise HTTPException(status_code=400, detail=f"Invalid image: {e}")
    elif ctype in ALLOWED_VIDEO_TYPES or ctype.startswith("video/"):
        media_type = "video"
        try:
            image_bytes = _extract_video_frame(raw)
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Video processing failed")
            raise HTTPException(status_code=400, detail=f"Invalid video: {e}")
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ctype}")

    try:
        parsed = await _analyze_with_llm(image_bytes, media_type)
    except Exception as e:
        logger.exception("LLM analysis failed")
        raise HTTPException(status_code=502, detail=f"Analysis failed: {e}")

    songs = [SongSuggestion(**s) for s in parsed.get("songs", [])]
    thumb_b64 = base64.b64encode(image_bytes).decode("utf-8")

    result = AnalysisResult(
        media_type=media_type,
        mood=parsed.get("mood", "Unknown"),
        themes=parsed.get("themes", []),
        colors=parsed.get("colors", []),
        scene_description=parsed.get("scene_description", ""),
        aesthetic=parsed.get("aesthetic", ""),
        songs=songs,
        thumbnail_base64=f"data:image/jpeg;base64,{thumb_b64}",
    )

    doc = result.model_dump()
    if HAS_DB:
        try:
            await db.analyses.insert_one(doc)
        except Exception as e:
            logger.warning(f"Failed to save to database: {e}")
    return result


@api_router.get("/history", response_model=List[AnalysisResult])
async def get_history(limit: int = 12):
    if not HAS_DB:
        return []
    try:
        docs = await db.analyses.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
        return docs
    except Exception as e:
        logger.warning(f"Failed to fetch history: {e}")
        return []


@api_router.get("/analysis/{analysis_id}", response_model=AnalysisResult)
async def get_analysis(analysis_id: str):
    if not HAS_DB:
        raise HTTPException(status_code=404, detail="Analysis not found")
    try:
        doc = await db.analyses.find_one({"id": analysis_id}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return doc
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Failed to fetch analysis: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch analysis")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    if client:
        client.close()
