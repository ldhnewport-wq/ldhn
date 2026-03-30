import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ldhnLogo from "@/assets/ldhn-logo-full.jpg";
import { Users, Swords, Trophy, Monitor, Settings, Newspaper } from "lucide-react";

const navItems = [
  { to: "/equipes", icon: Users, label: "Équipes", desc: "Gérer les équipes et alignements" },
  { to: "/matchs", icon: Swords, label: "Matchs", desc: "Créer et scorer les matchs" },
  { to: "/classement", icon: Trophy, label: "Classement", desc: "Voir le classement en temps réel" },
  { to: "/reportage", icon: Newspaper, label: "Reportage", desc: "Photos, vidéos et nouvelles de la ligue" },
  { to: "/arena", icon: Monitor, label: "Mode Aréna", desc: "Affichage plein écran pour projection" },
  { to: "/admin", icon: Settings, label: "Admin", desc: "Gérer la ligue complète" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-arena-gradient flex flex-col items-center justify-center px-6">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <img src={ldhnLogo} alt="LDHN" className="w-40 h-40 object-contain mx-auto mb-8" />
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-wider text-neon mb-2">
          LDHN
        </h1>
        <p className="text-lg text-muted-foreground tracking-[0.3em] uppercase mb-12">
          Ligue de Dek Hockey Newport
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
          {navItems.map((item, i) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <Link
                to={item.to}
                className="flex flex-col items-center gap-2 bg-card border border-border hover:border-primary/40 rounded-xl p-6 transition-all hover:scale-105 hover:glow-neon"
              >
                <item.icon className="h-8 w-8 text-primary" />
                <span className="font-display text-lg font-bold tracking-wider uppercase">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.desc}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
