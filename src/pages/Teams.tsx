import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowLeft, Trash2, Users } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Team = Tables<"teams">;

const Teams = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [abbr, setAbbr] = useState("");
  const [color, setColor] = useState("#FF8C00");

  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").order("name");
      if (error) throw error;
      return data as Team[];
    },
  });

  const createTeam = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("teams").insert({ name, abbr: abbr.toUpperCase(), color });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setOpen(false);
      setName("");
      setAbbr("");
      setColor("#FF8C00");
      toast({ title: "Équipe créée !" });
    },
    onError: (e) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const deleteTeam = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast({ title: "Équipe supprimée" });
    },
  });

  return (
    <div className="min-h-screen bg-arena-gradient p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <h1 className="font-display text-4xl font-bold text-neon">Équipes</h1>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Nouvelle équipe</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une équipe</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createTeam.mutate(); }} className="space-y-4">
                <div>
                  <Label>Nom de l'équipe</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tigres de Laval" required />
                </div>
                <div>
                  <Label>Abréviation (3 lettres)</Label>
                  <Input value={abbr} onChange={(e) => setAbbr(e.target.value)} placeholder="TIG" maxLength={4} required />
                </div>
                <div>
                  <Label>Couleur</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
                    <Input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createTeam.isPending}>
                  {createTeam.isPending ? "Création..." : "Créer l'équipe"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-center">Chargement...</p>
        ) : teams?.length === 0 ? (
          <p className="text-muted-foreground text-center text-lg">Aucune équipe. Créez-en une !</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams?.map((team) => (
              <Card key={team.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2"
                      style={{ borderColor: team.color, color: team.color }}
                    >
                      {team.abbr}
                    </div>
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTeam.mutate(team.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
