import { motion } from "framer-motion";
import { standings } from "@/data/mockArenaData";
import SectionTitle from "./SectionTitle";

const StandingsSection = () => (
  <div className="h-full flex flex-col justify-center px-12">
    <SectionTitle title="Classement" subtitle="Saison régulière" />
    <div className="max-w-4xl mx-auto w-full">
      <div className="grid grid-cols-[auto_1fr_repeat(5,60px)] gap-y-1 text-center font-display">
        <div className="col-span-7 grid grid-cols-[auto_1fr_repeat(5,60px)] text-muted-foreground text-sm tracking-wider border-b border-border pb-3 mb-2">
          <span className="w-10">#</span>
          <span className="text-left pl-4">ÉQUIPE</span>
          <span>PJ</span>
          <span>V</span>
          <span>D</span>
          <span>DP</span>
          <span className="text-neon">PTS</span>
        </div>
        {standings.map((s, i) => (
          <motion.div
            key={s.team.abbr}
            className="col-span-7 grid grid-cols-[auto_1fr_repeat(5,60px)] items-center py-3 rounded-xl hover:bg-arena-surface-light transition-colors"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <span className="w-10 font-bold text-xl text-muted-foreground">{s.rank}</span>
            <div className="flex items-center gap-3 text-left pl-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border"
                style={{ borderColor: s.team.color, color: s.team.color }}
              >
                {s.team.abbr}
              </div>
              <span className="text-lg font-semibold text-foreground">{s.team.name}</span>
            </div>
            <span className="text-lg text-secondary-foreground">{s.gp}</span>
            <span className="text-lg text-secondary-foreground">{s.w}</span>
            <span className="text-lg text-secondary-foreground">{s.l}</span>
            <span className="text-lg text-secondary-foreground">{s.otl}</span>
            <span className="text-2xl font-bold text-neon">{s.pts}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

export default StandingsSection;
