import { Clock } from "lucide-react";

export default function HistoryList({ items, onSelect }) {
  return (
    <section className="mt-20" data-testid="history-section">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full border-2 border-black bg-[#FEF0A5] flex items-center justify-center shadow-brutal-sm">
          <Clock className="w-4 h-4" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#4A4A4A]">
            Recent
          </div>
          <h3 className="font-heading text-2xl font-black tracking-tighter">
            Past vibe matches
          </h3>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="history-grid">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="text-left bg-white border-2 border-black rounded-xl shadow-brutal overflow-hidden hover:-translate-y-1 hover:shadow-brutal-lg transition-all"
            data-testid={`history-item-${i}`}
          >
            <div className="aspect-square overflow-hidden border-b-2 border-black bg-[#FDFBF7]">
              {item.thumbnail_base64 && (
                <img
                  src={item.thumbnail_base64}
                  alt={item.mood}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="p-3">
              <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#4A4A4A]">
                {item.media_type}
              </div>
              <div className="font-heading font-black text-sm tracking-tight truncate mt-0.5">
                {item.mood}
              </div>
              <div className="text-[11px] text-[#4A4A4A] truncate">
                {item.songs?.[0]?.title} · {item.songs?.[0]?.artist}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
