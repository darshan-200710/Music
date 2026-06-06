import { motion } from "framer-motion";
import SongCard from "@/components/SongCard";

const ACCENT_COLORS = ["#E6D8F8", "#D1F2E3", "#FFDCC2", "#FEF0A5"];

export default function AnalysisResult({ result }) {
  if (!result) return null;
  return (
    <div className="flex flex-col gap-6" data-testid="analysis-result">
      {/* Vibe summary */}
      <div className="bg-white border-2 border-black rounded-2xl shadow-brutal p-6">
        <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#4A4A4A]">
          The vibe
        </div>
        <h2
          className="font-heading text-3xl sm:text-4xl font-black tracking-tighter mt-2"
          data-testid="vibe-mood"
        >
          {result.mood}
        </h2>
        <p className="mt-3 text-[#4A4A4A] leading-relaxed" data-testid="vibe-description">
          {result.scene_description}
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Block label="Aesthetic" value={result.aesthetic} accent="#FEF0A5" testid="vibe-aesthetic" />
          <Block label="Themes" value={result.themes?.join(" · ")} accent="#E6D8F8" testid="vibe-themes" />
          <Block label="Colors" value={result.colors?.join(" · ")} accent="#FFDCC2" testid="vibe-colors" />
        </div>
      </div>

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
              <SongCard song={song} accent={ACCENT_COLORS[i % ACCENT_COLORS.length]} index={i} />
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
