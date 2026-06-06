import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import MediaPreview from "@/components/MediaPreview";
import AnalysisResult from "@/components/AnalysisResult";
import HistoryList from "@/components/HistoryList";
import KineticLoader from "@/components/KineticLoader";
import { analyzeMedia, fetchHistory } from "@/lib/api";

export default function Home() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const loadHistory = async () => {
    try {
      const items = await fetchHistory(8);
      setHistory(items);
    } catch (e) {
      // silent
    }
  };

  const handleFileSelected = (selected) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const data = await analyzeMedia(file);
      setResult(data);
      toast.success("Vibe matched. Songs are ready!");
      loadHistory();
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Something went wrong";
      toast.error(typeof msg === "string" ? msg : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
  };

  const handleSelectHistory = (item) => {
    setResult(item);
    setFile(null);
    setPreviewUrl(item.thumbnail_base64);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasMedia = !!previewUrl;

  return (
    <div className="min-h-screen bg-[#FDFBF7]" data-testid="home-page">
      <Header />
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-24">
        {!hasMedia && !result && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center text-center pt-12 lg:pt-20 pb-12"
            data-testid="hero-section"
          >
            <span className="inline-block px-4 py-1.5 border-2 border-black rounded-full text-[10px] font-bold uppercase tracking-[0.25em] bg-[#FEF0A5] shadow-brutal-sm mb-8">
              AI · Music Direction for Creators
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter leading-[0.95] max-w-4xl">
              Drop a photo. <span className="bg-[#E6D8F8] px-2 inline-block -rotate-1 border-2 border-black rounded-lg">Get the perfect</span> Instagram soundtrack.
            </h1>
            <p className="mt-8 max-w-xl text-base sm:text-lg text-[#4A4A4A] leading-relaxed">
              Upload a picture or short clip. Gemini reads the vibe — mood, colors, aesthetic — and hands you six songs ready for Stories and Reels.
            </p>
            <div className="mt-12 w-full max-w-2xl">
              <UploadZone onFileSelected={handleFileSelected} />
            </div>
            <div className="mt-16 flex items-center gap-3 text-xs uppercase tracking-[0.25em] font-bold text-[#4A4A4A]">
              <span className="w-12 h-px bg-black/30" />
              How it works
              <span className="w-12 h-px bg-black/30" />
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl w-full">
              {[
                { n: "01", t: "Upload", d: "Photo or short video" },
                { n: "02", t: "Analyze", d: "Gemini reads the vibe" },
                { n: "03", t: "Match", d: "6 songs ready to use" },
              ].map((step) => (
                <div
                  key={step.n}
                  className="bg-white border-2 border-black rounded-xl shadow-brutal p-5 text-left"
                >
                  <div className="font-heading text-3xl font-black">{step.n}</div>
                  <div className="mt-2 font-bold">{step.t}</div>
                  <div className="text-sm text-[#4A4A4A]">{step.d}</div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {hasMedia && (
          <section className="pt-8 lg:pt-12" data-testid="workspace-section">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <MediaPreview
                  previewUrl={previewUrl}
                  file={file}
                  result={result}
                  isAnalyzing={isAnalyzing}
                  onAnalyze={handleAnalyze}
                  onReset={handleReset}
                />
              </div>
              <div className="lg:col-span-7 flex flex-col gap-6">
                <AnimatePresence mode="wait">
                  {isAnalyzing && <KineticLoader key="loader" />}
                  {!isAnalyzing && result && (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <AnalysisResult result={result} />
                    </motion.div>
                  )}
                  {!isAnalyzing && !result && (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white border-2 border-dashed border-black rounded-2xl p-12 text-center min-h-[400px] flex flex-col items-center justify-center"
                      data-testid="analysis-placeholder"
                    >
                      <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#4A4A4A]">
                        Step 2
                      </span>
                      <h3 className="font-heading text-3xl font-black mt-3">
                        Ready when you are.
                      </h3>
                      <p className="mt-3 max-w-sm text-[#4A4A4A]">
                        Hit <span className="font-bold">Analyze the Vibe</span> to get your six song picks.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>
        )}

        {history.length > 0 && (
          <HistoryList items={history} onSelect={handleSelectHistory} />
        )}
      </main>
      <footer className="border-t-2 border-black bg-white py-6 text-center text-xs uppercase tracking-[0.25em] font-bold text-[#4A4A4A]">
        Vibe Match · Built with Gemini
      </footer>
    </div>
  );
}
