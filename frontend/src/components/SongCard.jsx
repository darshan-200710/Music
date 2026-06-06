import { Play, ExternalLink, Music2 } from "lucide-react";
import { spotifySearchUrl } from "@/lib/api";

export default function SongCard({ song, accent, index }) {
  const url = spotifySearchUrl(song.title, song.artist);
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-stretch bg-white border-2 border-black rounded-xl shadow-brutal overflow-hidden hover:-translate-y-0.5 hover:shadow-brutal-lg transition-all"
      data-testid={`song-card-${index}`}
    >
      <div
        className="sm:w-24 sm:min-h-[110px] flex items-center justify-center border-b-2 sm:border-b-0 sm:border-r-2 border-black py-6 sm:py-0"
        style={{ backgroundColor: accent }}
      >
        <Music2 className="w-7 h-7" strokeWidth={2.5} />
      </div>
      <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#4A4A4A]">
              #{String(index + 1).padStart(2, "0")}
            </span>
            <span
              className="px-2 py-0.5 border border-black rounded-full text-[10px] font-bold uppercase tracking-wider"
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
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-full font-bold uppercase tracking-wider text-xs hover:bg-black/85 transition-all active:scale-95 whitespace-nowrap shadow-brutal-sm"
          data-testid={`spotify-link-${index}`}
        >
          <Play className="w-3.5 h-3.5" fill="currentColor" />
          Spotify
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
