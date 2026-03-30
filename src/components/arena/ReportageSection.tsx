import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";
import { Star, Newspaper, Camera } from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  recap: Camera,
  stars: Star,
  news: Newspaper,
  project: Newspaper,
};

const ReportageSection = () => {
  const { data: articles = [] } = useQuery({
    queryKey: ["articles-arena"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  if (articles.length === 0) {
    return (
      <div className="h-full flex flex-col justify-center px-12">
        <SectionTitle title="Reportage" subtitle="Nouvelles de la ligue" />
        <p className="text-center text-muted-foreground text-2xl">Aucun reportage disponible</p>
      </div>
    );
  }

  // Show featured article (first) large, rest as cards
  const featured = articles[0];
  const others = articles.slice(1);

  return (
    <div className="h-full flex flex-col justify-center px-12">
      <SectionTitle title="Reportage" subtitle="Nouvelles de la ligue" />
      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Featured article */}
        <motion.div
          className="md:col-span-2 bg-arena-surface rounded-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {featured.image_url && (
            <img
              src={featured.image_url}
              alt={featured.title}
              className="w-full h-64 object-cover"
            />
          )}
          <div className="p-6">
            <h3 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              {featured.title}
            </h3>
            {featured.content && (
              <p className="text-lg text-muted-foreground line-clamp-3">{featured.content}</p>
            )}
          </div>
        </motion.div>

        {/* Secondary articles */}
        {others.map((article, i) => {
          const Icon = CATEGORY_ICONS[article.category] || Newspaper;
          return (
            <motion.div
              key={article.id}
              className="bg-arena-surface rounded-2xl p-6 flex items-start gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center shrink-0">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-display text-xl font-bold text-foreground">{article.title}</h4>
                {article.content && (
                  <p className="text-muted-foreground line-clamp-2 mt-1">{article.content}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportageSection;
