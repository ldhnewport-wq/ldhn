import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Player = Tables<"players">;
type Team = Tables<"teams">;

const POSITIONS = [
  { value: "F", label: "Attaquant" },
  { value: "D", label: "Défenseur" },
  { value: "G", label: "Gardien" },
];

const TeamDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: team } = useQuery({
    queryKey: ["team", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as Team;
    },
  });

  const { data: players, isLoading } = useQuery({
    queryKey: ["players", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("players").select("*").eq("team_id", id!).order("number");
      if (error) throw error;
      return data as Player[];
    },
  });


  return (
    <div className="min-h-screen bg-arena-gradient p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/equipes">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div className="flex items-center gap-3">
              {team && (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2"
                  style={{ borderColor: team.color, color: team.color }}
                >
                  {team.abbr}
                </div>
              )}
              <h1 className="font-display text-4xl font-bold text-neon">{team?.name || "..."}</h1>
            </div>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-center">Chargement...</p>
        ) : players?.length === 0 ? (
          <p className="text-muted-foreground text-center text-lg">Aucun joueur dans cette équipe.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-sm uppercase tracking-wider">
                  <th className="text-left py-3 px-4">#</th>
                  <th className="text-left py-3 px-4">Joueur</th>
                  <th className="text-left py-3 px-4">Position</th>
                  
                </tr>
              </thead>
              <tbody>
                {players?.map((player) => (
                  <tr key={player.id} className="border-b border-border/50 hover:bg-arena-surface-light/50 transition-colors">
                    <td className="py-3 px-4 font-display text-2xl font-bold text-muted-foreground">{player.number}</td>
                    <td className="py-3 px-4 text-lg font-semibold">{player.first_name} {player.last_name}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {POSITIONS.find((p) => p.value === player.position)?.label || player.position}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => deletePlayer.mutate(player.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDetail;
