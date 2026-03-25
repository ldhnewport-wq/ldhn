import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen bg-arena-gradient flex flex-col items-center justify-center px-6">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="w-24 h-24 rounded-full bg-primary mx-auto mb-8 flex items-center justify-center glow-neon">
          <span className="font-display text-primary-foreground text-4xl font-bold">L</span>
        </div>
        <h1 className="font-display text-6xl md:text-8xl font-bold tracking-wider text-neon mb-4">
          LDHN
        </h1>
        <p className="text-xl text-muted-foreground tracking-[0.4em] uppercase mb-12">
          Ligue de Hockey du Nord
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
