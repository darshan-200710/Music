import { Disc3 } from "lucide-react";

export default function Header() {
  return (
    <header
      className="border-b-2 border-black bg-[#FDFBF7] sticky top-0 z-40 backdrop-blur-md bg-opacity-90"
      data-testid="site-header"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3" data-testid="logo">
          <div className="w-10 h-10 rounded-full bg-[#D1F2E3] border-2 border-black flex items-center justify-center shadow-brutal-sm">
            <Disc3 className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="leading-none">
            <div className="font-heading font-black text-xl tracking-tighter">VIBE MATCH</div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#4A4A4A] mt-0.5">
              Music for your reels
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
