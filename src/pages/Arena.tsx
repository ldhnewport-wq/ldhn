import { useState, useEffect, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ArenaHeader from "@/components/arena/ArenaHeader";
import LiveScoresSection from "@/components/arena/LiveScoresSection";
import StandingsSection from "@/components/arena/StandingsSection";
import TopPlayersSection from "@/components/arena/TopPlayersSection";
import PlayerOfTheMatchSection from "@/components/arena/PlayerOfTheMatchSection";
import HighlightsSection from "@/components/arena/HighlightsSection";
import ProgressBar from "@/components/arena/ProgressBar";
import ArenaAdminPanel from "@/components/arena/ArenaAdminPanel";

const ALL_SECTIONS = [
  { component: LiveScoresSection, name: "Scores" },
  { component: StandingsSection, name: "Classement" },
  { component: TopPlayersSection, name: "Meneurs" },
  { component: PlayerOfTheMatchSection, name: "MVP" },
  { component: HighlightsSection, name: "Faits saillants" },
];

const ROTATION_INTERVAL = 12000;

const Arena = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [enabledSections, setEnabledSections] = useState<boolean[]>(
    () => ALL_SECTIONS.map(() => true)
  );
  const [forcedSection, setForcedSection] = useState<number | null>(null);

  const activeSections = useMemo(
    () => ALL_SECTIONS.filter((_, i) => enabledSections[i]),
    [enabledSections]
  );

  const displayedIndex = forcedSection !== null ? forcedSection : currentIndex;
  const CurrentComponent =
    forcedSection !== null
      ? ALL_SECTIONS[forcedSection].component
      : activeSections[currentIndex % activeSections.length]?.component;

  const nextSection = useCallback(() => {
    if (forcedSection !== null || activeSections.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % activeSections.length);
  }, [forcedSection, activeSections.length]);

  useEffect(() => {
    if (forcedSection !== null) return;
    const timer = setInterval(nextSection, ROTATION_INTERVAL);
    return () => clearInterval(timer);
  }, [nextSection, forcedSection]);

  const handleToggleSection = (index: number) => {
    setEnabledSections((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
    setCurrentIndex(0);
  };

  const handleForceSection = (index: number | null) => {
    setForcedSection(index);
    if (index === null) setCurrentIndex(0);
  };

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

  const progressSections = forcedSection !== null
    ? [ALL_SECTIONS[forcedSection]]
    : activeSections;

  const progressIndex = forcedSection !== null ? 0 : currentIndex % activeSections.length;

  return (
    <div className="h-screen w-screen overflow-hidden bg-arena-gradient flex flex-col">
      <ArenaHeader />
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {CurrentComponent && (
            <motion.div
              key={forcedSection !== null ? `forced-${forcedSection}` : `auto-${currentIndex}`}
              className="absolute inset-0"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <CurrentComponent />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ProgressBar
        duration={ROTATION_INTERVAL}
        currentSection={progressIndex}
        totalSections={progressSections.length}
        sectionNames={progressSections.map((s) => s.name)}
      />
      <ArenaAdminPanel
        sections={ALL_SECTIONS}
        enabledSections={enabledSections}
        onToggleSection={handleToggleSection}
        forcedSection={forcedSection}
        onForceSection={handleForceSection}
      />
    </div>
  );
};

export default Arena;
