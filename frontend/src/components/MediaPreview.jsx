import { Sparkles, RotateCcw } from "lucide-react";

export default function MediaPreview({ previewUrl, file, result, isAnalyzing, onAnalyze, onReset }) {
  const isVideo = file ? file.type.startsWith("video/") : result?.media_type === "video";
  const isImageData = previewUrl?.startsWith("data:image");

  return (
    <div
      className="bg-white border-2 border-black rounded-2xl shadow-brutal overflow-hidden"
      data-testid="media-preview"
    >
      <div className="aspect-square bg-[#FDFBF7] flex items-center justify-center overflow-hidden border-b-2 border-black">
        {isVideo && !isImageData ? (
          <video
            src={previewUrl}
            controls
            className="w-full h-full object-cover"
            data-testid="preview-video"
          />
        ) : (
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
            data-testid="preview-image"
          />
        )}
      </div>
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#4A4A4A]">
              Your media
            </div>
            <div className="font-heading font-black text-lg truncate max-w-[220px]">
              {file?.name || "From history"}
            </div>
          </div>
          <span className="px-3 py-1 border-2 border-black rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-[#D1F2E3]">
            {isVideo ? "Video" : "Image"}
          </span>
        </div>
        <div className="flex gap-3 pt-2">
          {!result && (
            <button
              onClick={onAnalyze}
              disabled={isAnalyzing || !file}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3.5 rounded-full font-bold uppercase tracking-wide hover:bg-black/85 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-brutal"
              data-testid="analyze-button"
            >
              <Sparkles className="w-4 h-4" strokeWidth={2.5} />
              {isAnalyzing ? "Analyzing…" : "Analyze the Vibe"}
            </button>
          )}
          <button
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 bg-white text-black border-2 border-black px-5 py-3.5 rounded-full font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-all shadow-brutal-sm active:translate-y-[2px] active:shadow-none"
            data-testid="reset-button"
          >
            <RotateCcw className="w-4 h-4" strokeWidth={2.5} />
            New
          </button>
        </div>
      </div>
    </div>
  );
}
