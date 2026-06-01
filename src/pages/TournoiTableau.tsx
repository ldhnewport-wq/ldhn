import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const EDITION = "2026";

const TournoiTableau = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["tournament_bracket", EDITION],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_bracket")
        .select("*, home:home_team_id(name, abbr, color), away:away_team_id(name, abbr, color)")
        .eq("edition", EDITION)
        .order("position", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const grouped = (data ?? []).reduce<Record<string, any[]>>((acc, row: any) => {
    const key = `${row.category}|${row.round}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-arena-gradient p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/tournoi"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <h1 className="font-display text-3xl font-bold text-neon">Tableau du tournoi</h1>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Chargement...</p>
        ) : Object.keys(grouped).length === 0 ? (
          <Card className="bg-card border-border"><CardContent className="py-8 text-center text-muted-foreground">Le bracket sera publié sous peu.</CardContent></Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([key, matches]) => {
              const [cat, round] = key.split("|");
              return (
                <div key={key}>
                  <h2 className="font-display text-lg font-bold tracking-wider uppercase text-primary mb-3">
                    {cat} — {round}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {matches.map((m: any) => (
                      <Card key={m.id} className="bg-card border-border">
                        <CardContent className="py-4 flex items-center justify-between">
                          <div>
                            <div>{m.home?.name ?? m.home_label ?? "À déterminer"}</div>
                            <div>{m.away?.name ?? m.away_label ?? "À déterminer"}</div>
                          </div>
                          <div className="font-display text-xl text-primary text-right">
                            <div>{m.home_score ?? "-"}</div>
                            <div>{m.away_score ?? "-"}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournoiTableau;
