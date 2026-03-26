import { motion } from "framer-motion";
import ldhnLogo from "@/assets/ldhn-logo.png";

const ArenaHeader = () => (
  <header className="flex items-center justify-between px-8 py-4 border-b border-neon glow-neon">
    <motion.div
      className="flex items-center gap-4"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      <img src={ldhnLogo} alt="LDHN" className="w-14 h-14 object-contain" />
      <div>
        <h1 className="font-display text-3xl font-bold tracking-wider text-neon">
          LDHN
        </h1>
        <p className="text-xs text-muted-foreground tracking-[0.3em] uppercase">
          Ligue de Dek Hockey Newport
        </p>
      </div>
    </motion.div>
    <motion.div
      className="text-right"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="font-display text-lg text-muted-foreground">
        SAISON 2025-2026
      </div>
    </motion.div>
  </header>
);

export default ArenaHeader;
