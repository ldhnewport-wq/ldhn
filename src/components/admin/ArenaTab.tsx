import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Upload, ExternalLink } from "lucide-react";

const ALL_SECTIONS = [
  { key: "scores", label: "Scores" },
  { key: "standings", label: "Classement" },
  { key: "top_players", label: "Meneurs" },
  { key: "tournament", label: "Tournoi (horaire & scores)" },
  { key: "highlights", label: "Faits saillants" },
  { key: "reportage", label: "Reportage" },
  { key: "media", label: "Galerie photos/vidéos" },
];

const ArenaTab = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ["arena-config-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arena_config")
        .select("*")
        .eq("id", "default")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [rotation, setRotation] = useState(12);
  const [enabled, setEnabled] = useState<string[]>(ALL_SECTIONS.map((s) => s.key));
  const [liveMode, setLiveMode] = useState("off");
  const [liveFreq, setLiveFreq] = useState(3);

  useEffect(() => {
    if (!config) return;
    setRotation(Math.round((config.rotation_interval_ms ?? 12000) / 1000));
    setEnabled((config.enabled_sections as unknown as string[]) ?? ALL_SECTIONS.map((s) => s.key));
    setLiveMode(config.live_mode ?? "off");
    setLiveFreq(config.live_frequency ?? 3);
  }, [config]);

  const saveConfig = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("arena_config")
        .update({
          rotation_interval_ms: rotation * 1000,
          enabled_sections: enabled,
          live_mode: liveMode,
          live_frequency: liveFreq,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "default");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["arena-config-admin"] });
      qc.invalidateQueries({ queryKey: ["arena-config"] });
      toast({ title: "Configuration enregistrée" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const toggleSection = (key: string) => {
    setEnabled((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  // ── Media management ─────────────────────────────
  const { data: media } = useQuery({
    queryKey: ["arena-media-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arena_media")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const [mediaType, setMediaType] = useState("photo");
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `arena/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, file);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setMediaUrl(data.publicUrl);
      setMediaType(file.type.startsWith("video") ? "video" : "photo");
      toast({ title: "Fichier téléchargé" });
    } catch (err) {
      toast({ title: "Erreur d'upload", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const addMedia = useMutation({
    mutationFn: async () => {
      const maxPos = (media ?? []).reduce((m, x) => Math.max(m, x.position), 0);
      const { error } = await supabase.from("arena_media").insert({
        media_type: mediaType,
        url: mediaUrl,
        caption: caption || null,
        position: maxPos + 1,
        active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["arena-media-admin"] });
      qc.invalidateQueries({ queryKey: ["arena-media"] });
      setMediaUrl(""); setCaption(""); setMediaType("photo");
      toast({ title: "Média ajouté" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("arena_media").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["arena-media-admin"] });
      qc.invalidateQueries({ queryKey: ["arena-media"] });
    },
  });

  const removeMedia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("arena_media").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["arena-media-admin"] });
      qc.invalidateQueries({ queryKey: ["arena-media"] });
      toast({ title: "Supprimé" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">Mode Aréna</h2>
        <a href="/arena" target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm" className="gap-2"><ExternalLink className="h-4 w-4" /> Ouvrir Aréna</Button>
        </a>
      </div>

      {/* Rotation */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-bold text-lg">Défilement</h3>
          <div>
            <Label>Temps par séquence: {rotation} secondes</Label>
            <Slider value={[rotation]} onValueChange={(v) => setRotation(v[0])} min={3} max={60} step={1} className="mt-2" />
          </div>
          <div>
            <Label className="mb-2 block">Séquences actives ({enabled.length})</Label>
            <div className="grid sm:grid-cols-2 gap-2">
              {ALL_SECTIONS.map((s) => (
                <div key={s.key} className="flex items-center justify-between p-2 rounded bg-secondary/30">
                  <span className="text-sm">{s.label}</span>
                  <Switch checked={enabled.includes(s.key)} onCheckedChange={() => toggleSection(s.key)} />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live mode */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-bold text-lg">Match en direct</h3>
          <div>
            <Label>Mode</Label>
            <Select value={liveMode} onValueChange={setLiveMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Désactivé</SelectItem>
                <SelectItem value="periodic">Périodique (intercalé)</SelectItem>
                <SelectItem value="continuous">Continu (toujours affiché)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {liveMode === "periodic" && (
            <div>
              <Label>Afficher le direct toutes les {liveFreq} séquence{liveFreq > 1 ? "s" : ""}</Label>
              <Slider value={[liveFreq]} onValueChange={(v) => setLiveFreq(v[0])} min={1} max={10} step={1} className="mt-2" />
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={() => saveConfig.mutate()} disabled={saveConfig.isPending} className="w-full">
        {saveConfig.isPending ? "Enregistrement..." : "Enregistrer la configuration"}
      </Button>

      {/* Media */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-bold text-lg">Photos & Vidéos (Galerie)</h3>
          <div className="space-y-3 p-3 border rounded-lg">
            <div>
              <Label>Téléverser un fichier (photo ou vidéo)</Label>
              <Input type="file" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} />
            </div>
            <div className="text-center text-xs text-muted-foreground">— ou —</div>
            <div>
              <Label>URL externe</Label>
              <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={mediaType} onValueChange={setMediaType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="video">Vidéo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Légende</Label>
                <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Optionnel" />
              </div>
            </div>
            <Button onClick={() => addMedia.mutate()} disabled={!mediaUrl || addMedia.isPending} className="w-full gap-2">
              <Upload className="h-4 w-4" /> Ajouter à la galerie
            </Button>
          </div>

          <div className="space-y-2">
            {(media ?? []).length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Aucun média</p>}
            {(media ?? []).map((m) => (
              <Card key={m.id}>
                <CardContent className="flex items-center gap-3 p-3">
                  {m.media_type === "video" ? (
                    <video src={m.url} className="w-16 h-16 object-cover rounded bg-black" muted />
                  ) : (
                    <img src={m.url} alt="" className="w-16 h-16 object-cover rounded bg-black" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase font-bold text-muted-foreground">{m.media_type}</p>
                    <p className="text-sm truncate">{m.caption || m.url}</p>
                  </div>
                  <Switch checked={m.active} onCheckedChange={(v) => toggleActive.mutate({ id: m.id, active: v })} />
                  <Button variant="ghost" size="icon" onClick={() => removeMedia.mutate(m.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArenaTab;
