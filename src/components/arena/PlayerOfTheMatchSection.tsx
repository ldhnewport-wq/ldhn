import { motion } from "framer-motion";
import { playerOfTheMatch } from "@/data/mockArenaData";
import SectionTitle from "./SectionTitle";

const PlayerOfTheMatchSection = () => {
  const p = playerOfTheMatch;
  return (
    <div className="h-full flex flex-col justify-center items-center px-12">
      <SectionTitle title="Joueur du Match" subtitle="Performance exceptionnelle" />
      <motion.div
        className="relative bg-arena-surface border-2 border-neon rounded-3xl p-12 glow-neon max-w-2xl w-full text-center"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
      >
        <motion.div
          className="absolute -top-6 left-1/2 -translate-x-1/2 bg-arena-gold text-primary-foreground font-display text-lg font-bold px-6 py-2 rounded-full tracking-wider"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ⭐ MVP ⭐
        </motion.div>
        <motion.div
          className="w-28 h-28 rounded-full mx-auto mb-6 flex items-center justify-center text-5xl font-display font-bold border-4"
          style={{ borderColor: p.team.color, color: p.team.color }}
          animate={{
            boxShadow: [
              `0 0 20px ${p.team.color}40`,
              `0 0 40px ${p.team.color}70`,
              `0 0 20px ${p.team.color}40`,
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          #{p.number}
        </motion.div>
        <h3 className="font-display text-5xl font-bold text-foreground tracking-wide">{p.name}</h3>
        <p className="mt-2 text-lg text-muted-foreground font-display tracking-widest">{p.team.name}</p>
        <div className="mt-8 grid grid-cols-4 gap-6">
          {[
            { label: "BUTS", value: p.goals },
            { label: "PASSES", value: p.assists },
            { label: "POINTS", value: p.points },
            { label: "+/-", value: p.plusMinus },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-display text-5xl font-bold text-neon">{stat.value}</div>
              <div className="text-sm text-muted-foreground tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default PlayerOfTheMatchSection;
