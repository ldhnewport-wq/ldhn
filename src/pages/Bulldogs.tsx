import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import bulldogsImage from "@/assets/bulldogs-2026-27.jpg.asset.json";
import StatTracker from "@/components/bulldogs/StatTracker";

export default function Bulldogs() {
  return (
    <div className="min-h-screen bg-arena-gradient px-4 py-8 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/" aria-label="Retour au menu principal"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-neon">Bulldogs 2026-27</h1>
        </header>
        <StatTracker />
        <img src={new URL(bulldogsImage.url, "https://ldhn.lovable.app").href} alt="Bulldogs Le Rocher" className="block w-full max-w-xl h-auto mx-auto mt-12 object-contain" />
      </div>
    </div>
  );
}