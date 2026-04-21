import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, ChevronRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import TeamLogo from "@/components/TeamLogo";

type Team = Tables<"teams">;

const divisions = [
  { key: "rookies", label: "Division Les Rookies" },
  { key: "younguns", label: "Division Les Young Guns" },
  { key: "veterans", label: "Division Les Vétérans" },
];

const Teams = () => {
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);

  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").order("name");
      if (error) throw error;
      return data as Team[];
    },
  });

  const getTeamsForDivision = (divKey: string) => {
    return (teams ?? []).filter((t) => (t as any).division === divKey);
  };

  return (
    <div className="min-h-screen bg-arena-gradient p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          {selectedDivision ? (
            <Button variant="ghost" size="icon" onClick={() => setSelectedDivision(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Link to="/">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
          )}
          <h1 className="font-display text-4xl font-bold text-neon">
            {selectedDivision
              ? divisions.find((d) => d.key === selectedDivision)?.label
              : "Équipes"}
          </h1>
        </div>

        {!selectedDivision ? (
          <div className="flex flex-col gap-4">
            {divisions.map((div) => (
              <Button
                key={div.key}
                variant="outline"
                className="w-full justify-between text-lg py-8 border-primary/30 hover:border-primary hover:bg-primary/10"
                onClick={() => setSelectedDivision(div.key)}
              >
                {div.label}
                <ChevronRight className="h-5 w-5" />
              </Button>
            ))}
          </div>
        ) : isLoading ? (
          <p className="text-muted-foreground text-center">Chargement...</p>
        ) : getTeamsForDivision(selectedDivision).length === 0 ? (
          <p className="text-muted-foreground text-center text-lg">Aucune équipe dans cette division.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getTeamsForDivision(selectedDivision).map((team) => (
              <Card key={team.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center pb-2">
                  <div className="flex items-center gap-3">
                    <TeamLogo
                      logoUrl={team.logo_url}
                      abbr={team.abbr}
                      color={team.color}
                      name={team.name}
                      className="w-10 h-10 rounded-full"
                      textClassName="text-sm"
                    />
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Link to={`/equipes/${team.id}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                    <Users className="h-3 w-3" /> Voir l'alignement
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;
