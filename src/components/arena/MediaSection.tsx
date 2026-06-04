import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SectionTitle from "./SectionTitle";

interface MediaRow {
  id: string;
  media_type: string;
  url: string;
  caption: string | null;
  position: number;
  active: boolean;
  duration_ms: number | null;
}

const MediaSection = () => {
  const { data: items } = useQuery({
    queryKey: ["arena-media"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arena_media")
        .select("*")
        .eq("active", true)
        .order("position", { ascending: true });
      if (error) throw error;
      return data as MediaRow[];
    },
    refetchInterval: 30000,
  });

  const [idx, setIdx] = useState(0);
  const list = items ?? [];
  const current = list[idx];

  useEffect(() => {
    if (list.length <= 1) return;
    if (current?.media_type === "video") return; // video advances onEnded
    const t = current?.duration_ms ?? 6000;
    const timer = setTimeout(() => setIdx((i) => (i + 1) % list.length), t);
    return () => clearTimeout(timer);
  }, [idx, list.length, current]);

  if (list.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <SectionTitle title="Galerie" subtitle="Photos et vidéos de la ligue" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Aucun média configuré</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <SectionTitle title="Galerie" subtitle="Photos et vidéos de la ligue" />
      <div className="flex-1 flex items-center justify-center px-12 pb-8">
        <div className="relative w-full max-w-5xl h-full max-h-[70vh] rounded-2xl overflow-hidden bg-arena-surface border border-border">
          {current.media_type === "video" ? (
            <video
              key={current.id}
              src={current.url}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain bg-black"
              onEnded={() => setIdx((i) => (i + 1) % list.length)}
            />
          ) : (
            <img
              key={current.id}
              src={current.url}
              alt={current.caption ?? ""}
              className="w-full h-full object-contain bg-black"
            />
          )}
          {current.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <p className="text-foreground text-lg font-display">{current.caption}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaSection;
