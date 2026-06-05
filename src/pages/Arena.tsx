import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import ArenaHeader from "@/components/arena/ArenaHeader";
import LiveScoresSection from "@/components/arena/LiveScoresSection";
import StandingsSection from "@/components/arena/StandingsSection";
import TopPlayersSection from "@/components/arena/TopPlayersSection";
import HighlightsSection from "@/components/arena/HighlightsSection";
import ReportageSection from "@/components/arena/ReportageSection";
import MediaSection from "@/components/arena/MediaSection";
import LiveMatchSection from "@/components/arena/LiveMatchSection";
import TournamentSection from "@/components/arena/TournamentSection";
import {
  TournamentStandingsRookies,
  TournamentStandingsYoungGuns,
  TournamentStandingsVeterans,
} from "@/components/arena/TournamentStandingsSections";
import ProgressBar from "@/components/arena/ProgressBar";
import ArenaAdminPanel from "@/components/arena/ArenaAdminPanel";
import TodayScheduleBar from "@/components/arena/TodayScheduleBar";

const SECTION_MAP = {
  scores: { component: LiveScoresSection, name: "Scores" },
  standings: { component: StandingsSection, name: "Classement" },
  top_players: { component: TopPlayersSection, name: "Meneurs" },
  highlights: { component: HighlightsSection, name: "Faits saillants" },
  reportage: { component: ReportageSection, name: "Reportage" },
  media: { component: MediaSection, name: "Galerie" },
  tournament: { component: TournamentSection, name: "Tournoi" },
  tournament_standings_rookies: { component: TournamentStandingsRookies, name: "Classement Rookies" },
  tournament_standings_young: { component: TournamentStandingsYoungGuns, name: "Classement Young Guns" },
  tournament_standings_veterans: { component: TournamentStandingsVeterans, name: "Classement Vétérans" },
  live: { component: LiveMatchSection, name: "En direct" },
} as const;

type SectionKey = keyof typeof SECTION_MAP;
const DEFAULT_KEYS: SectionKey[] = ["scores", "standings", "top_players", "tournament", "highlights", "reportage", "media"];

const Arena = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [forcedSection, setForcedSection] = useState<number | null>(null);
  const [localDisabled, setLocalDisabled] = useState<Set<SectionKey>>(new Set());

  const { data: config } = useQuery({
    queryKey: ["arena-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arena_config")
        .select("*")
        .eq("id", "default")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  const rotationInterval = config?.rotation_interval_ms ?? 12000;
  const liveMode = config?.live_mode ?? "off";
  const liveFrequency = Math.max(1, config?.live_frequency ?? 3);

  const configuredKeys = useMemo<SectionKey[]>(() => {
    const raw = (config?.enabled_sections as unknown as string[]) ?? DEFAULT_KEYS;
    return raw.filter((k): k is SectionKey => k in SECTION_MAP);
  }, [config]);

  // Build rotation: in continuous live mode, only the live section. In periodic, insert "live" every N.
  const activeSections = useMemo(() => {
    const base = configuredKeys.filter((k) => !localDisabled.has(k));
    if (liveMode === "continuous") {
      return [SECTION_MAP.live];
    }
    if (liveMode === "periodic") {
      const out: { component: any; name: string }[] = [];
      base.forEach((k, i) => {
        out.push(SECTION_MAP[k]);
        if ((i + 1) % liveFrequency === 0) out.push(SECTION_MAP.live);
      });
      return out.length ? out : [SECTION_MAP.live];
    }
    return base.map((k) => SECTION_MAP[k]);
  }, [configuredKeys, localDisabled, liveMode, liveFrequency]);

  // For admin panel toggles, show all configured keys
  const panelSections = configuredKeys.map((k) => SECTION_MAP[k]);
  const enabledFlags = configuredKeys.map((k) => !localDisabled.has(k));

  const CurrentComponent =
    forcedSection !== null
      ? panelSections[forcedSection]?.component
      : activeSections[currentIndex % Math.max(1, activeSections.length)]?.component;

  const nextSection = useCallback(() => {
    if (forcedSection !== null || activeSections.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % activeSections.length);
  }, [forcedSection, activeSections.length]);

  useEffect(() => {
    if (forcedSection !== null) return;
    const timer = setInterval(nextSection, rotationInterval);
    return () => clearInterval(timer);
  }, [nextSection, forcedSection, rotationInterval]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeSections.length]);

  const handleToggleSection = (index: number) => {
    const key = configuredKeys[index];
    setLocalDisabled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleForceSection = (index: number | null) => {
    setForcedSection(index);
    if (index === null) setCurrentIndex(0);
  };

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `body { cursor: none !important; overflow: hidden !important; }`;
    document.head.appendChild(style);
    const tryFullscreen = () => { document.documentElement.requestFullscreen?.().catch(() => {}); };
    const handler = () => tryFullscreen();
    document.addEventListener("click", handler, { once: true });
    return () => {
      document.head.removeChild(style);
      document.removeEventListener("click", handler);
    };
  }, []);

  const progressSections = forcedSection !== null ? [panelSections[forcedSection]].filter(Boolean) : activeSections;
  const progressIndex = forcedSection !== null ? 0 : currentIndex % Math.max(1, activeSections.length);

  return (
    <div className="h-screen w-screen overflow-hidden bg-arena-gradient flex flex-col">
      <ArenaHeader />
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {CurrentComponent && (
            <motion.div
              key={forcedSection !== null ? `forced-${forcedSection}` : `auto-${currentIndex}-${liveMode}`}
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
      <TodayScheduleBar />
      <ProgressBar
        duration={rotationInterval}
        currentSection={progressIndex}
        totalSections={progressSections.length}
        sectionNames={progressSections.map((s) => s.name)}
      />
      <ArenaAdminPanel
        sections={panelSections}
        enabledSections={enabledFlags}
        onToggleSection={handleToggleSection}
        forcedSection={forcedSection}
        onForceSection={handleForceSection}
      />
    </div>
  );
};

export default Arena;
