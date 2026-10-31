import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Archive, ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export default function Archives() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["season-archives"],
    queryFn: async () => {
      const { data, error } = await supabase.from("season_archives").select("season_key, label").order("season_key", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return <div className="min-h-screen bg-arena-gradient px-4 py-8 sm:p-8">
    <div className="max-w-5xl mx-auto">
      <header className="flex items-center gap-4 mb-10">
        <Button variant="ghost" size="icon" asChild><Link to="/" aria-label="Retour au menu principal"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <Archive className="h-8 w-8 text-primary" />
        <h1 className="font-display text-4xl font-bold text-neon">Archives</h1>
      </header>
      {isLoading ? <p className="text-muted-foreground">Chargement des archives…</p> : isError ? <div role="alert"><p className="mb-3">Les archives ne sont pas disponibles pour le moment.</p><Button variant="outline" onClick={() => refetch()}>Réessayer</Button></div> :
        <div className="grid gap-4 sm:grid-cols-2">{data?.map(season => <Button key={season.season_key} variant="outline" className="h-auto p-6 justify-between gap-4 bg-card rounded-lg" asChild>
          <Link to={`/archives/${season.season_key}`}><span className="flex items-center gap-4"><CalendarDays className="h-7 w-7 text-primary shrink-0" /><span className="font-display text-2xl">{season.label}</span></span><ArrowRight className="h-5 w-5 shrink-0" /></Link>
        </Button>)}</div>}
    </div>
  </div>;
}