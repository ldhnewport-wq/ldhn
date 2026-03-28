import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ldhnLogo from "@/assets/ldhn-logo-full.jpg";

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
        <h1 className="font-display text-6xl md:text-8xl font-bold tracking-wider text-neon mb-4">
          LDHN
        </h1>
        <p className="text-xl text-muted-foreground tracking-[0.4em] uppercase mb-12">
          Ligue de Dek Hockey Newport
        </p>
        <Link
          to="/arena"
          className="inline-flex items-center gap-3 bg-primary text-primary-foreground font-display text-xl font-bold px-10 py-4 rounded-2xl tracking-wider uppercase glow-neon hover:scale-105 transition-transform"
        >
          🏒 Mode Aréna
        </Link>
        <p className="mt-6 text-sm text-muted-foreground">
          Affichage plein écran pour projection
        </p>
      </motion.div>
    </div>
  );
};

export default Index;
