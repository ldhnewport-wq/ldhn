import { motion } from "framer-motion";
import { highlights } from "@/data/mockArenaData";
import SectionTitle from "./SectionTitle";

const HighlightsSection = () => (
  <div className="h-full flex flex-col justify-center px-12">
    <SectionTitle title="Faits Saillants" subtitle="Timeline du match" />
    <div className="max-w-3xl mx-auto w-full relative">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-primary/30" />
      <div className="space-y-4">
        {highlights.map((h, i) => (
          <motion.div
            key={i}
            className="flex items-start gap-6 relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
          >
            <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center z-10 shrink-0">
              <span className="text-lg">{h.event.split(' ')[0]}</span>
            </div>
            <div className="bg-arena-surface rounded-xl px-6 py-4 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-display text-xl font-bold text-foreground">
                  {h.event}
                </span>
                <span className="text-sm text-muted-foreground font-display tracking-wider">{h.time}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className="text-sm font-bold"
                  style={{ color: h.team.color }}
                >
                  {h.team.abbr}
                </span>
                <span className="text-secondary-foreground">{h.player}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

export default HighlightsSection;
