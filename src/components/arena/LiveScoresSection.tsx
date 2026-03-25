import { motion } from "framer-motion";
import { liveMatches, recentMatches } from "@/data/mockArenaData";
import LiveIndicator from "./LiveIndicator";
import SectionTitle from "./SectionTitle";

const ScoreCard = ({ match, isLive }: { match: typeof liveMatches[0] | typeof recentMatches[0]; isLive: boolean }) => (
  <motion.div
    className="relative bg-arena-surface border border-border rounded-2xl p-6 glow-neon"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4 }}
  >
    {isLive && (
      <div className="absolute top-4 right-4">
        <LiveIndicator />
      </div>
    )}
    {'period' in match && (
      <div className="absolute top-4 left-4 text-muted-foreground font-display text-sm tracking-wider">
        {match.period} · {match.time}
      </div>
    )}
    {'date' in match && (
      <div className="absolute top-4 left-4 text-muted-foreground font-display text-sm tracking-wider">
        {match.date} · FINAL
      </div>
    )}
    <div className="flex items-center justify-center gap-8 mt-8">
      {/* Home */}
      <div className="flex flex-col items-center gap-3">
        <motion.div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-display font-bold border-2"
          style={{ borderColor: match.home.color, color: match.home.color }}
          animate={isLive ? { boxShadow: [`0 0 10px ${match.home.color}40`, `0 0 25px ${match.home.color}60`, `0 0 10px ${match.home.color}40`] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {match.home.abbr}
        </motion.div>
        <span className="text-sm text-muted-foreground font-display tracking-wider">{match.home.name}</span>
      </div>
      {/* Score */}
      <div className="flex items-center gap-4">
        <span className="font-display text-7xl font-bold text-foreground">{match.homeScore}</span>
        <span className="font-display text-3xl text-muted-foreground">-</span>
        <span className="font-display text-7xl font-bold text-foreground">{match.awayScore}</span>
      </div>
      {/* Away */}
      <div className="flex flex-col items-center gap-3">
        <motion.div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-display font-bold border-2"
          style={{ borderColor: match.away.color, color: match.away.color }}
          animate={isLive ? { boxShadow: [`0 0 10px ${match.away.color}40`, `0 0 25px ${match.away.color}60`, `0 0 10px ${match.away.color}40`] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {match.away.abbr}
        </motion.div>
        <span className="text-sm text-muted-foreground font-display tracking-wider">{match.away.name}</span>
      </div>
    </div>
  </motion.div>
);

const LiveScoresSection = () => (
  <div className="h-full flex flex-col justify-center px-12">
    <SectionTitle title="Scores" subtitle="Matchs en cours & récents" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto w-full">
      {liveMatches.map((m) => (
        <ScoreCard key={m.id} match={m} isLive />
      ))}
      {recentMatches.slice(0, 2).map((m) => (
        <ScoreCard key={m.id} match={m} isLive={false} />
      ))}
    </div>
  </div>
);

export default LiveScoresSection;
