# 🎵 Vibe Match

Vibe Match is a creative music direction and content creation web application. It helps Instagram creators, Gen Z social posters, and digital marketers instantly match the visual vibe of their photos and videos with the perfect soundtracks, custom-crafted captions, and hashtags.

Built with a **Neo-brutalist pastel design system**, Vibe Match pairs AI visual analysis with interactive music playback and shareable graphics.

---

## ✨ Features

- 📸 **Multi-Format Media Upload:** Drag-and-drop or select photos (`.jpg`, `.png`, `.webp`) and videos (`.mp4`, `.mov`, `.webm`). The system uses OpenCV to automatically extract representative keyframes from clips.
- 🧠 **AI Vibe Analysis:** Powered by Google Gemini to analyze scene composition, emotional mood, aesthetic styles, dominant colors, and visual themes.
- 🎶 **Curated Soundtracks:** Suggests 6 songs matching the vibe with specific vibe tags, explanations of why they match, and tips for Reels/Stories sync points.
- 🔊 **Interactive Music Player:** Plays 30-second audio previews for recommended tracks. Supports a custom player with progress tracking.
- 🎨 **Dynamic Album Art:** Fetches real Spotify album artwork directly for a high-fidelity visual experience.
- 📝 **Caption & Hashtag Generator:** Automatically generates a catchy Instagram caption and a curated list of relevant hashtags.
- 📋 **One-Click Copy:** Copy captions and hashtags directly with clean micro-animations.
- 🖼️ **Virality Share Card:** Generate and download a beautifully styled social image card (containing your media, top song choice, color palette, and Vibe Match watermark) rendered entirely client-side using HTML5 Canvas.
- 🔄 **Local History:** Persists past searches and results to MongoDB, letting you review previous vibes and recommendations instantly.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React.js
- **Styling:** Tailwind CSS (Neo-brutalist aesthetic)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **HTTP Client:** Axios

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Database Client:** Motor (Asynchronous MongoDB driver)
- **Media Processing:** OpenCV (video keyframing) & Pillow (image normalization)
- **AI Core:** Google Generative AI (Gemini 2.5/3.5 models)
- **HTTP Client:** HTTPX (async Spotify integrations)

---

## ⚙️ Setup and Installation

### Backend Setup

1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment:**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create a local environment configuration:**
   Copy the `.env.example` template to `.env`:
   ```bash
   cp .env.example .env
   ```
   Configure the following keys in your `.env`:
   ```env
   MONGO_URL="mongodb://localhost:27017"
   DB_NAME="test_database"
   CORS_ORIGINS="*"
   GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
   
   # Optional: Add Spotify keys for real catalog previews and album artwork
   SPOTIFY_CLIENT_ID="YOUR_SPOTIFY_CLIENT_ID"
   SPOTIFY_CLIENT_SECRET="YOUR_SPOTIFY_CLIENT_SECRET"
   ```
   > 💡 **No Spotify Keys?** No problem! The application automatically falls back to loading royalty-free audio tracks and high-quality placeholder cover art, so the player remains fully interactive and functional in development.

5. **Start the backend server:**
   ```bash
   uvicorn server:app --reload --port 8001
   ```
   The backend API will run at `http://localhost:8001`.

---

### Frontend Setup

1. **Navigate to the frontend folder:**
   ```bash
   cd ../frontend
   ```

2. **Install node dependencies:**
   ```bash
   npm install
   ```

3. **Create a local environment configuration:**
   Copy the `.env.example` template to `.env`:
   ```bash
   cp .env.example .env
   ```
   Verify that the backend URL points to your API server:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:8001
   ```

4. **Start the React dev server:**
   ```bash
   npm start
   ```
   Open `http://localhost:3000` in your browser.

---

## 🧪 Running Tests

Ensure your virtual environment is active and running in the `backend/` directory, then execute the pytest suite:
```bash
pytest tests/
```
The test suite validates image/video ingestion endpoints, database fallback behaviors, response schemas, and mock generation patterns.
