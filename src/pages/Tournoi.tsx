import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, CalendarRange, Trophy, FileText, Heart, Users } from "lucide-react";
import TeamLogo from "@/components/TeamLogo";
import ldhnLogo from "@/assets/logo-new.png";

const EDITION = "2026";

const categoryLabels: Record<string, string> = {
  rookies: "Rookies",
  intermediaire: "Les Young Guns",
  elite: "Les vétérans",
};

const Tournoi = () => {
  const { data: registered, isLoading } = useQuery({
    queryKey: ["tournament_teams", EDITION],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_teams")
        .select("id, category, team_id, teams:team_id(id, name, abbr, color, logo_url)")
        .eq("edition", EDITION);
      if (error) throw error;
      return data ?? [];
    },
  });

  const byCategory = (registered ?? []).reduce<Record<string, any[]>>((acc, row: any) => {
    const cat = row.category || "rookies";
    if (!acc[cat]) acc[cat] = [];
    if (row.teams) acc[cat].push({ ...row.teams, registrationId: row.id });
    return acc;
  }, {});

  const buttons = [
    { to: "/tournoi/horaire", icon: Calendar, label: "Horaire général", desc: "Tous les matchs du tournoi" },
    { to: "/tournoi/horaire?par=categorie", icon: CalendarRange, label: "Horaire par catégorie", desc: "Filtré par division" },
    { to: "/tournoi/tableau", icon: Trophy, label: "Tableau du tournoi", desc: "Bracket éliminatoire" },
    { to: "/tournoi/reglements", icon: FileText, label: "Règlements", desc: "Règles officielles" },
    { to: "/tournoi/remerciements", icon: Heart, label: "Remerciements", desc: "Commanditaires & bénévoles" },
  ];

  return (
    <div className="min-h-screen bg-arena-gradient p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <img src={ldhnLogo} alt="LDHN" className="w-14 h-14 object-contain rounded-xl border-4 border-double border-primary" />
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-neon tracking-wider">
              Tournoi 3<sup>e</sup> édition 2026
            </h1>
            <p className="text-sm text-muted-foreground tracking-widest uppercase">Ligue de Dek Hockey Newport</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-10"
        >
          {buttons.map((b) => (
            <Link
              key={b.to}
              to={b.to}
              className="flex flex-col items-center gap-2 bg-card border border-border hover:border-primary/40 rounded-xl p-4 transition-all hover:scale-[1.03] hover:glow-neon"
            >
              <b.icon className="h-7 w-7 text-primary" />
              <span className="font-display text-sm font-bold tracking-wider uppercase text-center">{b.label}</span>
              <span className="text-[11px] text-muted-foreground text-center">{b.desc}</span>
            </Link>
          ))}
        </motion.div>

        <section>
          <h2 className="font-display text-2xl font-bold mb-4 text-neon">Équipes inscrites</h2>

          {isLoading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : (registered ?? []).length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucune équipe inscrite pour le moment. Les administrateurs peuvent inscrire les équipes dans l'onglet Admin.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(byCategory).map(([cat, teams]) => (
                <div key={cat}>
                  <h3 className="font-display text-lg font-bold tracking-wider uppercase text-primary mb-3">
                    {categoryLabels[cat] ?? cat}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((team) => (
                      <Card key={team.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                        <CardHeader className="flex flex-row items-center pb-2">
                          <div className="flex items-center gap-3">
                            <TeamLogo
                              logoUrl={team.logo_url}
                              abbr={team.abbr}
                              color={team.color}
                              name={team.name}
                              className="w-14 h-14 rounded-full shrink-0"
                              textClassName="text-sm"
                            />
                            <CardTitle className="text-base">{team.name}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Link
                            to={`/equipes/${team.id}`}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <Users className="h-3 w-3" /> Voir l'alignement
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Tournoi;
