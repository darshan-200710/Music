import { useState, useEffect, useRef } from "react";
import { Play, Pause, ExternalLink, Music2 } from "lucide-react";
import { spotifySearchUrl } from "@/lib/api";

export default function SongCard({ song, accent, index, currentlyPlayingUrl, setCurrentlyPlayingUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  const fallbackUrl = spotifySearchUrl(song.title, song.artist);
  const spotifyUrl = song.spotify_url || fallbackUrl;

  useEffect(() => {
    if (currentlyPlayingUrl === song.preview_url && song.preview_url) {
      if (!audioRef.current) {
        audioRef.current = new Audio(song.preview_url);
        audioRef.current.addEventListener("timeupdate", () => {
          if (audioRef.current) {
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
          }
        });
        audioRef.current.addEventListener("ended", () => {
          setIsPlaying(false);
          setProgress(0);
          setCurrentlyPlayingUrl(null);
        });
      }
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.warn("Audio playback failed:", e);
          setIsPlaying(false);
          setCurrentlyPlayingUrl(null);
        });
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    }
  }, [currentlyPlayingUrl, song.preview_url, setCurrentlyPlayingUrl]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayToggle = () => {
    if (!song.preview_url) return;
    if (isPlaying) {
      setCurrentlyPlayingUrl(null);
    } else {
      setCurrentlyPlayingUrl(song.preview_url);
    }
  };

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-stretch bg-white border-2 border-black rounded-xl shadow-brutal overflow-hidden hover:-translate-y-0.5 hover:shadow-brutal-lg transition-all"
      data-testid={`song-card-${index}`}
    >
      <div
        className="sm:w-24 sm:h-auto w-full h-32 flex-shrink-0 flex items-center justify-center border-b-2 sm:border-b-0 sm:border-r-2 border-black overflow-hidden bg-black"
      >
        {song.album_art ? (
          <img src={song.album_art} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: accent }}>
            <Music2 className="w-7 h-7" strokeWidth={2.5} />
          </div>
        )}
      </div>
      <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#4A4A4A]">
              #{String(index + 1).padStart(2, "0")}
            </span>
            <span
              className="px-2 py-0.5 border border-black rounded-full text-[10px] font-bold uppercase tracking-wider bg-white"
              data-testid={`song-vibe-${index}`}
            >
              {song.vibe}
            </span>
          </div>
          <div className="font-heading text-xl font-black tracking-tight truncate" data-testid={`song-title-${index}`}>
            {song.title}
          </div>
          <div className="text-sm font-bold text-[#4A4A4A]" data-testid={`song-artist-${index}`}>
            {song.artist}
          </div>
          <div className="text-sm text-[#4A4A4A] mt-2 leading-snug" data-testid={`song-why-${index}`}>
            {song.why}
          </div>
          <div className="text-xs text-black/70 mt-2 italic" data-testid={`song-hint-${index}`}>
            💡 {song.usage_hint}
          </div>
          
          {/* Audio progress bar */}
          {isPlaying && (
            <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden mt-3 border border-black">
              <div className="bg-[#D1F2E3] h-full transition-all duration-100" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
        
        <div className="flex flex-row sm:flex-col items-stretch gap-2">
          {song.preview_url && (
            <button
              onClick={handlePlayToggle}
              className="inline-flex items-center justify-center gap-2 bg-[#FEF0A5] border-2 border-black text-black px-4 py-2 rounded-full font-bold uppercase tracking-wider text-xs hover:-translate-y-0.5 hover:shadow-brutal-sm transition-all active:scale-95 whitespace-nowrap"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" fill="currentColor" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" fill="currentColor" />
                  Preview
                </>
              )}
            </button>
          )}
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-full font-bold uppercase tracking-wider text-xs hover:bg-black/85 transition-all active:scale-95 whitespace-nowrap shadow-brutal-sm"
            data-testid={`spotify-link-${index}`}
          >
            <Play className="w-3 h-3" fill="currentColor" />
            Spotify
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
