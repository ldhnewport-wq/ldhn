import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const EDITION = "2026";
const CATEGORIES = [
  { key: "all", label: "Toutes" },
  { key: "rookies", label: "Rookies" },
  { key: "intermediaire", label: "Intermédiaire" },
  { key: "elite", label: "Élite" },
];

const TournoiHoraire = () => {
  const [params, setParams] = useSearchParams();
  const active = params.get("cat") ?? "all";

  const { data, isLoading } = useQuery({
    queryKey: ["tournament_schedule", EDITION],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_schedule")
        .select("*, home:home_team_id(name, abbr, color), away:away_team_id(name, abbr, color)")
        .eq("edition", EDITION)
        .order("match_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (data ?? []).filter((m: any) => active === "all" || m.category === active);

  return (
    <div className="min-h-screen bg-arena-gradient p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/tournoi"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <h1 className="font-display text-3xl font-bold text-neon">Horaire du tournoi</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <Button
              key={c.key}
              variant={active === c.key ? "default" : "outline"}
              size="sm"
              onClick={() => setParams(c.key === "all" ? {} : { cat: c.key })}
            >
              {c.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Chargement...</p>
        ) : filtered.length === 0 ? (
          <Card className="bg-card border-border"><CardContent className="py-8 text-center text-muted-foreground">Aucun match prévu.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((m: any) => (
              <Card key={m.id} className="bg-card border-border">
                <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      {new Date(m.match_date).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" })}
                      {m.venue ? ` · ${m.venue}` : ""}
                      {m.round ? ` · ${m.round}` : ""}
                    </span>
                    <span className="font-display text-lg">
                      {m.home?.name ?? m.home_label ?? "À déterminer"} <span className="text-muted-foreground">vs</span> {m.away?.name ?? m.away_label ?? "À déterminer"}
                    </span>
                  </div>
                  <div className="font-display text-2xl text-primary">
                    {m.home_score ?? "-"} : {m.away_score ?? "-"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournoiHoraire;
