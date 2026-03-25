import { motion } from "framer-motion";
import { topScorers, topAssists, topPoints, type TopPlayer } from "@/data/mockArenaData";
import SectionTitle from "./SectionTitle";

const PlayerRow = ({ player, rank, label }: { player: TopPlayer; rank: number; label: string }) => (
  <motion.div
    className="flex items-center gap-4 py-3 px-4 rounded-xl bg-arena-surface"
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: rank * 0.1 }}
  >
    <span className="font-display text-2xl font-bold text-muted-foreground w-8">{rank}</span>
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-display font-bold border"
      style={{ borderColor: player.team.color, color: player.team.color }}
    >
      #{player.number}
    </div>
    <div className="flex-1">
      <span className="font-display text-lg font-semibold text-foreground">{player.name}</span>
      <span className="ml-2 text-sm text-muted-foreground">{player.team.abbr}</span>
    </div>
    <div className="text-right">
      <span className="font-display text-3xl font-bold text-neon">{player.value}</span>
      <span className="ml-1 text-xs text-muted-foreground uppercase">{label}</span>
    </div>
  </motion.div>
);

const Column = ({ title, players, label }: { title: string; players: TopPlayer[]; label: string }) => (
  <div className="flex-1">
    <h3 className="font-display text-2xl font-bold text-arena-gold tracking-wider mb-4 text-center uppercase">{title}</h3>
    <div className="space-y-2">
      {players.map((p, i) => (
        <PlayerRow key={p.name + label} player={p} rank={i + 1} label={label} />
      ))}
    </div>
  </div>
);

const TopPlayersSection = () => (
  <div className="h-full flex flex-col justify-center px-12">
    <SectionTitle title="Meneurs" subtitle="Top 5 de la ligue" />
    <div className="flex gap-8 max-w-7xl mx-auto w-full">
      <Column title="🏒 Buts" players={topScorers} label="B" />
      <Column title="🎯 Passes" players={topAssists} label="A" />
      <Column title="⭐ Points" players={topPoints} label="PTS" />
    </div>
  </div>
);

export default TopPlayersSection;
