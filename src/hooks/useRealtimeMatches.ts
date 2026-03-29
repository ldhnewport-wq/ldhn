import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRealtimeMatches = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("realtime-matches")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => {
        queryClient.invalidateQueries({ queryKey: ["matches"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "match_events" }, () => {
        queryClient.invalidateQueries({ queryKey: ["match_events"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
