import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ArenaHeader from "@/components/arena/ArenaHeader";
import LiveScoresSection from "@/components/arena/LiveScoresSection";
import StandingsSection from "@/components/arena/StandingsSection";
import TopPlayersSection from "@/components/arena/TopPlayersSection";
import PlayerOfTheMatchSection from "@/components/arena/PlayerOfTheMatchSection";
import HighlightsSection from "@/components/arena/HighlightsSection";
import ProgressBar from "@/components/arena/ProgressBar";

const SECTIONS = [
  { component: LiveScoresSection, name: "Scores" },
  { component: StandingsSection, name: "Classement" },
  { component: TopPlayersSection, name: "Meneurs" },
  { component: PlayerOfTheMatchSection, name: "MVP" },
  { component: HighlightsSection, name: "Faits saillants" },
];

const ROTATION_INTERVAL = 12000;

const Arena = () => {
  const [currentSection, setCurrentSection] = useState(0);

  const nextSection = useCallback(() => {
    setCurrentSection((prev) => (prev + 1) % SECTIONS.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSection, ROTATION_INTERVAL);
    return () => clearInterval(timer);
  }, [nextSection]);

  // Auto fullscreen + hide cursor
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `body { cursor: none !important; overflow: hidden !important; }`;
    document.head.appendChild(style);

    const tryFullscreen = () => {
      document.documentElement.requestFullscreen?.().catch(() => {});
    };
    const handler = () => tryFullscreen();
    document.addEventListener("click", handler, { once: true });

    return () => {
      document.head.removeChild(style);
      document.removeEventListener("click", handler);
    };
  }, []);

  const CurrentComponent = SECTIONS[currentSection].component;

  return (
    <div className="h-screen w-screen overflow-hidden bg-arena-gradient flex flex-col">
      <ArenaHeader />
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            className="absolute inset-0"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <CurrentComponent />
          </motion.div>
        </AnimatePresence>
      </div>
      <ProgressBar
        duration={ROTATION_INTERVAL}
        currentSection={currentSection}
        totalSections={SECTIONS.length}
        sectionNames={SECTIONS.map((s) => s.name)}
      />
    </div>
  );
};

export default Arena;
