import { motion } from "framer-motion";

const PHRASES = [
  "READING THE COLORS",
  "FEELING THE MOOD",
  "CRATE-DIGGING FOR SONGS",
  "MATCHING THE VIBE",
];

export default function KineticLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white border-2 border-black rounded-2xl shadow-brutal p-10 min-h-[400px] flex flex-col items-center justify-center text-center"
      data-testid="kinetic-loader"
    >
      <div className="font-heading text-4xl sm:text-5xl font-black tracking-tighter mb-8">
        {"ANALYZING VIBES".split("").map((c, i) => (
          <span
            key={i}
            className="vibe-letter"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            {c === " " ? "\u00A0" : c}
          </span>
        ))}
      </div>
      <div className="space-y-2 text-sm font-bold uppercase tracking-[0.25em] text-[#4A4A4A]">
        {PHRASES.map((p, i) => (
          <motion.div
            key={p}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 2.4,
              delay: i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {p}
          </motion.div>
        ))}
      </div>
      <div className="mt-8 flex gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-8 bg-black rounded-full"
            animate={{ scaleY: [0.4, 1, 0.4] }}
            transition={{
              duration: 1,
              delay: i * 0.12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
