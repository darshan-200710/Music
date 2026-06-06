# Vibe Match — PRD

## Original Problem Statement
Build a Python program that suggests suitable songs for Instagram stories and posts based on uploaded photos or videos. Analyze media for mood, themes, colors, aesthetics, then recommend songs matching the visual vibe.

## User Choices (Feb 2026)
- Media Analysis AI: Google Gemini via `GEMINI_API_KEY`
- Song Suggestions: AI-curated (LLM generates real song titles + artists)
- Media Support: Photos + Videos (videos: extract a ~30% frame via OpenCV)
- UI: React + Tailwind (Neo-brutalist pastel design system)
- Backend: FastAPI + MongoDB
- Auth: None (open MVP)

## Architecture
- **Backend (`/app/backend/server.py`)**
  - `POST /api/analyze` — accepts multipart file (image or video), normalizes via Pillow (resize ≤1280px, JPEG, RGB), or extracts a video keyframe via OpenCV. Sends the image to Gemini with a strict JSON schema. Persists to Mongo.
  - `GET /api/history?limit=N` — returns recent analyses, newest first
  - `GET /api/analysis/{id}` — fetch single
- **Frontend (`/app/frontend/src/`)**
  - `pages/Home.jsx` — single-page workspace
  - Components: `Header`, `UploadZone` (drag & drop + click), `MediaPreview`, `AnalysisResult`, `SongCard`, `KineticLoader`, `HistoryList`
  - `lib/api.js` — uses `REACT_APP_BACKEND_URL`
- **Storage**: MongoDB `analyses` collection
- **External Services**: Spotify search (deep link only, no API key required)

## Personas
- Instagram creators / Gen Z social posters who want fast soundtrack suggestions

## Core Requirements (Static)
1. Drag & drop or click upload of photo/video
2. AI visual analysis (mood, themes, colors, aesthetic, scene description)
3. 6 song suggestions per upload with vibe, why-it-matches, Instagram usage hint
4. Spotify search deep link per song
5. Local history of past analyses with thumbnail preview

## Implemented (Feb 2026)
- ✅ FastAPI backend with Gemini vision analysis (`GEMINI_API_KEY`)
- ✅ Image normalization (Pillow) and video keyframe extraction (OpenCV)
- ✅ Strict JSON output parsing from LLM (6 songs)
- ✅ MongoDB persistence for analyses + history endpoints
- ✅ Neo-brutalist pastel React UI (Cabinet Grotesk + Satoshi)
- ✅ Drag & drop upload zone, kinetic loader, song cards, Spotify deep link, history grid
- ✅ Full data-testid coverage
- ✅ Backend pytest suite (8 tests, 100% pass)
- ✅ Full E2E browser test (100% pass)

## Backlog
- **P1** Spotify Web API integration for real preview URLs (optional upgrade)
- **P1** Multi-frame video analysis (currently 1 keyframe; could analyze 3-5 frames + duration)
- **P2** Persistent user accounts to save curated playlists
- **P2** Generate Instagram caption + hashtags alongside songs (revenue/conversion lever for creator tools)
- **P2** Direct "Save to Spotify playlist" via OAuth
- **P2** Migrate FastAPI `on_event('shutdown')` → lifespan handlers
- **P3** Strict server-side MIME sniffing via Pillow `.verify()`

## Next Tasks
1. Add caption+hashtag generation (high-value, single Gemini call extension)
2. Optional Spotify Web API integration when user requests previewable tracks
3. Share-card export (downloadable image card with media + top song) for virality
