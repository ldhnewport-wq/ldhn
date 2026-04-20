import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  ArrowLeft,
  Zap
} from 'lucide-react';
import { useRealtimeMatches } from "@/hooks/useRealtimeMatches";
import type { Tables } from "@/integrations/supabase/types";

type Team = Tables<"teams">;

interface MatchWithTeams {
  id: string;
  home_score: number;
  away_score: number;
  status: string;
  period: string | null;
  match_date: string;
  is_live: boolean;
  home_team_id: string;
  away_team_id: string;
  home_team: Team;
  away_team: Team;
  surface?: string;
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Programmé",
  live: "En cours",
  final: "Final",
};

const Matches = () => {
  // Active la synchronisation des scores en direct
  useRealtimeMatches();

  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches-ldhn-final-v3"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*)
        `)
        // TRI CHRONOLOGIQUE : Du 20 avril jusqu'à mai
        .order("match_date", { ascending: true });
      
      if (error) throw error;
      return data as MatchWithTeams[];
    },
  });

  // Formate l'heure pour afficher "18:30"
  const formatTime = (dateStr: string) => {
    if (!dateStr) return "--:--";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("fr-CA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  // Formate la date pour afficher "20 avril 2026"
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("fr-CA", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-arena-gradient text-white p-4 sm:p-8 font-sans selection:bg-[#00cc55]/30">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Style Arena avec bouton de retour */}
        <div className="flex items-center gap-4 mb-12 border-l-4 border-[#00cc55] pl-6 py-2">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-[#00cc55] mr-2">
              <ArrowLeft size={24} />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-[#00cc55] italic uppercase tracking-tighter leading-none shadow-neon">
              Calendrier
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
              <Zap size={12} className="text-[#00cc55]" /> Saison régulière 2026
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00cc55]"></div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Surfaçage de la glace...</p>
          </div>
        ) : matches?.length === 0 ? (
          <div className="bg-black/40 p-12 rounded-[2.5rem] border border-white/5 text-center">
            <Trophy className="mx-auto text-slate-800 mb-4" size={48} />
            <p className="text-slate-500 font-bold uppercase tracking-widest">Aucun match trouvé</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {matches.map((match) => (
              <div key={match.id} className="bg-black/40 backdrop-blur-sm rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden group hover:border-[#00cc55]/40 transition-all duration-500">
                
                {/* Barre d'info (Date & Heure corrigées) */}
                <div className="bg-white/5 px-8 py-3.5 flex justify-between items-center border-b border-white/5">
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                      <CalendarIcon size={12} className="text-[#00cc55]" />
                      {formatDate(match.match_date)}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest bg-black/40 px-3 py-1 rounded-md leading-none shadow-inner border border-white/5">
                      <Clock size={12} className="text-[#00cc55]" />
                      {formatTime(match.match_date)}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    match.status === 'live' ? 'bg-red-600 animate-pulse text-white' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {STATUS_LABELS[match.status] || match.status}
                  </span>
                </div>

                {/* Contenu du Match (Logos & Scores) */}
                <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative">
                  
                  {/* Équipe Domicile */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 md:justify-end text-center md:text-right">
                    <div className="order-2 sm:order-1">
                      <span className="block font-black text-lg uppercase tracking-tight text-white leading-none">
                        {match.home_team.name}
                      </span>
                    </div>
                    <div className="relative order-1 sm:order-2 shrink-0">
                      <div 
                        className="w-20 h-20 rounded-2xl flex items-center justify-center border-2 overflow-hidden bg-black/50 shadow-inner group-hover:scale-105 transition-transform duration-500"
                        style={{ borderColor: match.home_team.color }}
                      >
                        {/* Affiche le logo de Supabase s'il existe, sinon l'abréviation */}
                        {match.home_team.logo_url ? (
                          <img src={match.home_team.logo_url} className="w-full h-full object-contain p-2" alt={match.home_team.name} />
                        ) : (
                          <span className="text-xl font-black italic" style={{ color: match.home_team.color }}>
                            {match.home_team.abbr}
                          </span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#141414] shadow-lg" style={{ backgroundColor: match.home_team.color }}></div>
                    </div>
                  </div>

                  {/* Zone de Score Centrale */}
                  <div className="flex flex-col items-center px-4 shrink-0">
                    <div className="flex items-center gap-6">
                      <span className={`text-5xl font-black italic w-14 text-center ${match.home_score >= match.away_score ? 'text-white' : 'text-slate-700'}`}>
                        {match.home_score || 0}
                      </span>
                      <div className="flex flex-col items-center gap-1">
                         <div className="h-1 w-8 bg-[#00cc55] rounded-full shadow-[0_0_12px_#00cc55]"></div>
                         <span className="text-[10px] font-black text-slate-700 uppercase italic tracking-tighter">VS</span>
                         <div className="h-1 w-8 bg-[#00cc55] rounded-full shadow-[0_0_12px_#00cc55]"></div>
                      </div>
                      <span className={`text-5xl font-black italic w-14 text-center ${match.away_score >= match.home_score ? 'text-white' : 'text-slate-700'}`}>
                        {match.away_score || 0}
                      </span>
                    </div>
                    {match.surface && (
                      <div className="mt-5 bg-black/40 px-4 py-1.5 rounded-xl border border-white/5 flex items-center gap-2">
                         <MapPin size={12} className="text-[#00cc55]" />
                         <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{match.surface}</span>
                      </div>
                    )}
                  </div>

                  {/* Équipe Visiteuse */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 md:justify-start text-center md:text-left">
                    <div className="relative shrink-0">
                      <div 
                        className="w-20 h-20 rounded-2xl flex items-center justify-center border-2 overflow-hidden bg-black/50 shadow-inner group-hover:scale-105 transition-transform duration-500"
                        style={{ borderColor: match.away_team.color }}
                      >
                        {/* Affiche le logo de Supabase s'il existe, sinon l'abréviation */}
                        {match.away_team.logo_url ? (
                          <img src={match.away_team.logo_url} className="w-full h-full object-contain p-2" alt={match.away_team.name} />
                        ) : (
                          <span className="text-xl font-black italic" style={{ color: match.away_team.color }}>
                            {match.away_team.abbr}
                          </span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full border-4 border-[#141414] shadow-lg" style={{ backgroundColor: match.away_team.color }}></div>
                    </div>
                    <div>
                      <span className="block font-black text-lg uppercase tracking-tight text-white leading-none">
                        {match.away_team.name}
                      </span>
                    </div>
                  </div>

                </div>

                {/* État du direct (Live) */}
                {match.status === 'live' && (
                  <div className="bg-red-600/10 py-3 border-t border-red-600/20 flex items-center justify-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-ping"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">
                      Action en direct • Période {match.period || '1'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-20 pt-10 border-t border-white/5 text-center opacity-40 italic">
           <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.4em]">LDHN Newport • Ligue de Dek Hockey Jeunesse</p>
        </div>
      </div>
    </div>
  );
};

export default Matches;
