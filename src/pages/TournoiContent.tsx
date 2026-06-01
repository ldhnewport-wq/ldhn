import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const EDITION = "2026";

const TournoiContent = ({ section }: { section: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["tournament_content", EDITION, section],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_content")
        .select("*")
        .eq("edition", EDITION)
        .eq("section", section)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-arena-gradient p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/tournoi"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <h1 className="font-display text-3xl font-bold text-neon">
            {data?.title ?? (section === "reglements" ? "Règlements" : "Remerciements")}
          </h1>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="py-8">
            {isLoading ? (
              <p className="text-muted-foreground">Chargement...</p>
            ) : (
              <div className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                {data?.body ?? "Contenu à venir."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TournoiContent;
