import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Newspaper, Star, Camera, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  recap: { label: "Résumé de match", icon: Camera, color: "bg-primary" },
  stars: { label: "3 étoiles", icon: Star, color: "bg-yellow-500" },
  news: { label: "Nouvelles", icon: Newspaper, color: "bg-blue-500" },
  project: { label: "Projets à venir", icon: Video, color: "bg-green-500" },
};

const Reportage = () => {
  const { data: articles = [] } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-2xl font-bold tracking-wider uppercase text-foreground">
          Reportage
        </h1>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {articles.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            Aucun reportage publié pour le moment.
          </p>
        )}

        {articles.map((article, i) => {
          const cat = CATEGORY_LABELS[article.category] || CATEGORY_LABELS.news;
          const Icon = cat.icon;
          return (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="overflow-hidden border-border bg-card">
                {article.image_url && (
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-56 object-cover"
                  />
                )}
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="gap-1">
                      <Icon className="h-3 w-3" />
                      {cat.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(article.created_at).toLocaleDateString("fr-CA")}
                    </span>
                  </div>
                  <h2 className="font-display text-xl font-bold text-foreground mb-2">
                    {article.title}
                  </h2>
                  {article.content && (
                    <p className="text-muted-foreground whitespace-pre-line">{article.content}</p>
                  )}
                  {article.video_url && (
                    <div className="mt-4 aspect-video rounded-lg overflow-hidden bg-muted">
                      <iframe
                        src={article.video_url}
                        className="w-full h-full"
                        allowFullScreen
                        title={article.title}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Reportage;
