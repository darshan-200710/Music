import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Download } from "lucide-react";
import { toast } from "sonner";
import SongCard from "@/components/SongCard";

const ACCENT_COLORS = ["#E6D8F8", "#D1F2E3", "#FFDCC2", "#FEF0A5"];

export default function AnalysisResult({ result }) {
  const [currentlyPlayingUrl, setCurrentlyPlayingUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentlyPlayingUrl(null);
  }, [result]);

  if (!result) return null;

  const handleCopyCaption = () => {
    const hashtagsText = result.hashtags && result.hashtags.length > 0
      ? "\n\n" + result.hashtags.map((h) => h.startsWith("#") ? h : `#${h}`).join(" ")
      : "";
    const fullText = (result.instagram_caption || "") + hashtagsText;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("Caption & hashtags copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportShareCard = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1200;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Could not initialize canvas contexts.");
      return;
    }

    // 1. Draw Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 1200);
    gradient.addColorStop(0, "#FDFBF7"); // page bg
    gradient.addColorStop(0.5, "#E6D8F8"); // soft accent
    gradient.addColorStop(1, "#D1F2E3"); // green accent
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 1200);

    // 2. Draw Main Card Base (Neo-brutalism)
    const cardX = 50;
    const cardY = 120;
    const cardW = 700;
    const cardH = 960;
    const shadowOffset = 12;

    // Shadow
    ctx.fillStyle = "#000000";
    ctx.fillRect(cardX + shadowOffset, cardY + shadowOffset, cardW, cardH);

    // Card background & border
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // 3. Draw Header Title: VIBE MATCH
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.font = "900 44px sans-serif";
    ctx.fillText("VIBE MATCH", 400, 75);

    ctx.font = "bold 18px sans-serif";
    ctx.fillStyle = "#4A4A4A";
    ctx.fillText("YOUR INSTAGRAM SOUNDTRACK", 400, 105);

    // 4. Load & Draw Media Image
    const mediaImg = new Image();
    mediaImg.src = result.thumbnail_base64;
    mediaImg.onload = () => {
      const mediaX = 90;
      const mediaY = 160;
      const mediaW = 620;
      const mediaH = 460;

      // Draw shadow for image box
      ctx.fillStyle = "#000000";
      ctx.fillRect(mediaX + 8, mediaY + 8, mediaW, mediaH);

      // Draw image clipped inside boundary
      ctx.save();
      ctx.beginPath();
      ctx.rect(mediaX, mediaY, mediaW, mediaH);
      ctx.clip();

      const iw = mediaImg.width;
      const ih = mediaImg.height;
      const r = Math.min(mediaW / iw, mediaH / ih);
      let nw = iw * r;
      let nh = ih * r;
      let cx = mediaX + (mediaW - nw) / 2;
      let cy = mediaY + (mediaH - nh) / 2;
      
      if (nw < mediaW || nh < mediaH) {
        const r2 = Math.max(mediaW / iw, mediaH / ih);
        nw = iw * r2;
        nh = ih * r2;
        cx = mediaX + (mediaW - nw) / 2;
        cy = mediaY + (mediaH - nh) / 2;
      }

      ctx.drawImage(mediaImg, cx, cy, nw, nh);
      ctx.restore();
      
      // Image stroke border
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 4;
      ctx.strokeRect(mediaX, mediaY, mediaW, mediaH);

      // 5. Render Vibe details
      ctx.fillStyle = "#000000";
      ctx.textAlign = "left";
      ctx.font = "900 32px sans-serif";
      
      let moodText = result.mood || "Unknown";
      if (moodText.length > 30) moodText = moodText.substring(0, 27) + "...";
      ctx.fillText(`Vibe: ${moodText}`, 90, 680);

      ctx.font = "bold 18px sans-serif";
      ctx.fillStyle = "#4A4A4A";
      ctx.fillText(`Aesthetic: ${result.aesthetic || "—"}`, 90, 715);

      // 6. Draw Top Recommended Song Card
      const songX = 90;
      const songY = 750;
      const songW = 620;
      const songH = 200;

      // Pastel yellow background
      ctx.fillStyle = "#FEF0A5";
      ctx.fillRect(songX, songY, songW, songH);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 4;
      ctx.strokeRect(songX, songY, songW, songH);

      const topSong = result.songs && result.songs[0];
      if (topSong) {
        const artX = 110;
        const artY = 775;
        const artSize = 150;

        const drawSongText = () => {
          ctx.fillStyle = "#000000";
          ctx.textAlign = "left";
          ctx.font = "900 26px sans-serif";

          let titleText = topSong.title;
          if (titleText.length > 20) titleText = titleText.substring(0, 18) + "...";
          ctx.fillText(titleText, 280, 815);

          ctx.font = "bold 18px sans-serif";
          ctx.fillStyle = "#4A4A4A";
          let artistText = topSong.artist;
          if (artistText.length > 25) artistText = artistText.substring(0, 22) + "...";
          ctx.fillText(artistText, 280, 845);

          ctx.font = "italic 15px sans-serif";
          ctx.fillStyle = "#111827";
          let whyText = topSong.why;
          if (whyText.length > 45) whyText = whyText.substring(0, 42) + "...";
          ctx.fillText(`"${whyText}"`, 280, 885);

          ctx.font = "bold 13px sans-serif";
          ctx.fillStyle = "#374151";
          let hintText = topSong.usage_hint || "";
          if (hintText.length > 45) hintText = hintText.substring(0, 42) + "...";
          ctx.fillText(`💡 ${hintText}`, 280, 920);

          // 7. Draw Color Swatches
          ctx.fillStyle = "#000000";
          ctx.font = "bold 16px sans-serif";
          ctx.fillText("COLORS:", 90, 1030);

          const colorsList = result.colors || [];
          colorsList.slice(0, 5).forEach((colorHex, idx) => {
            const swatchX = 200 + idx * 55;
            const swatchY = 1010;
            ctx.beginPath();
            ctx.arc(swatchX, swatchY + 10, 18, 0, Math.PI * 2);
            try {
              ctx.fillStyle = colorHex;
              ctx.fill();
            } catch (e) {
              ctx.fillStyle = "#CCCCCC";
              ctx.fill();
            }
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2.5;
            ctx.stroke();
          });

          // Draw Footer watermark
          ctx.font = "bold 15px sans-serif";
          ctx.fillStyle = "#9CA3AF";
          ctx.textAlign = "center";
          ctx.fillText("Generated by Vibe Match • vibe-match.app", 400, 1145);

          try {
            const dataUrl = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.download = `${result.mood.replace(/\s+/g, "_")}_vibe_card.png`;
            link.href = dataUrl;
            link.click();
            toast.success("Share card exported and downloaded!");
          } catch (e) {
            console.error("Canvas export error:", e);
            toast.error("Failed to generate download image due to security restrictions.");
          }
        };

        if (topSong.album_art) {
          const albumImg = new Image();
          albumImg.crossOrigin = "anonymous";
          albumImg.src = topSong.album_art;
          albumImg.onload = () => {
            ctx.drawImage(albumImg, artX, artY, artSize, artSize);
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 3;
            ctx.strokeRect(artX, artY, artSize, artSize);
            drawSongText();
          };
          albumImg.onerror = () => {
            ctx.fillStyle = "#E6D8F8";
            ctx.fillRect(artX, artY, artSize, artSize);
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 3;
            ctx.strokeRect(artX, artY, artSize, artSize);
            ctx.fillStyle = "#000000";
            ctx.font = "bold 40px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("🎵", artX + artSize/2, artY + artSize/2 + 12);
            drawSongText();
          };
        } else {
          ctx.fillStyle = "#E6D8F8";
          ctx.fillRect(artX, artY, artSize, artSize);
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3;
          ctx.strokeRect(artX, artY, artSize, artSize);
          ctx.fillStyle = "#000000";
          ctx.font = "bold 40px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("🎵", artX + artSize/2, artY + artSize/2 + 12);
          drawSongText();
        }
      }
    };
    mediaImg.onerror = () => {
      toast.error("Could not load media thumbnail for share card.");
    };
  };

  return (
    <div className="flex flex-col gap-6" data-testid="analysis-result">
      {/* Vibe summary */}
      <div className="bg-white border-2 border-black rounded-2xl shadow-brutal p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#4A4A4A]">
              The vibe
            </div>
            <h2
              className="font-heading text-3xl sm:text-4xl font-black tracking-tighter mt-2"
              data-testid="vibe-mood"
            >
              {result.mood}
            </h2>
          </div>
          <button
            onClick={handleExportShareCard}
            className="inline-flex items-center gap-2 self-start bg-[#D1F2E3] border-2 border-black px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs hover:-translate-y-0.5 hover:shadow-brutal-sm transition-all active:scale-95 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Share Card
          </button>
        </div>
        
        <p className="mt-4 text-[#4A4A4A] leading-relaxed" data-testid="vibe-description">
          {result.scene_description}
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Block label="Aesthetic" value={result.aesthetic} accent="#FEF0A5" testid="vibe-aesthetic" />
          <Block label="Themes" value={result.themes?.join(" · ")} accent="#E6D8F8" testid="vibe-themes" />
          <Block label="Colors" value={result.colors?.join(" · ")} accent="#FFDCC2" testid="vibe-colors" />
        </div>
      </div>

      {/* Caption & Hashtags card */}
      {result.instagram_caption && (
        <div className="bg-white border-2 border-black rounded-2xl shadow-brutal p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#4A4A4A]">
              Instagram Caption
            </div>
            <button
              onClick={handleCopyCaption}
              className="inline-flex items-center gap-1.5 border-2 border-black bg-[#E6D8F8] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider hover:-translate-y-0.5 hover:shadow-brutal-sm active:scale-95 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-700" strokeWidth={2.5} />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
          
          <div className="bg-gray-50 border-2 border-black rounded-xl p-4 font-medium text-sm leading-relaxed text-[#1F2937]">
            <p className="whitespace-pre-wrap">{result.instagram_caption}</p>
            {result.hashtags && result.hashtags.length > 0 && (
              <p className="mt-3 text-[#5B21B6] font-semibold">
                {result.hashtags.map((h) => h.startsWith("#") ? h : `#${h}`).join(" ")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Songs */}
      <div>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#4A4A4A]">
              Recommended soundtrack
            </div>
            <h3 className="font-heading text-2xl sm:text-3xl font-black tracking-tighter">
              Six songs for this moment
            </h3>
          </div>
          <span className="px-3 py-1 border-2 border-black rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-[#D1F2E3]">
            {result.songs?.length || 0} picks
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4" data-testid="songs-list">
          {result.songs?.map((song, i) => (
            <motion.div
              key={`${song.title}-${i}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
            >
              <SongCard
                song={song}
                accent={ACCENT_COLORS[i % ACCENT_COLORS.length]}
                index={i}
                currentlyPlayingUrl={currentlyPlayingUrl}
                setCurrentlyPlayingUrl={setCurrentlyPlayingUrl}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Block({ label, value, accent, testid }) {
  return (
    <div
      className="border-2 border-black rounded-xl p-4"
      style={{ backgroundColor: accent }}
      data-testid={testid}
    >
      <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-black/70">
        {label}
      </div>
      <div className="font-bold mt-1 text-sm leading-snug">{value || "—"}</div>
    </div>
  );
}
