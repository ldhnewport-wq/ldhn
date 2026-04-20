import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  ArrowLeft 
} from 'lucide-react';


import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeMatches } from "@/hooks/useRealtimeMatches";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Programmé",
  live: "En cours",
  final: "Final",
};
const Matches = () => {
  const [matches] = useState(MOCK_MATCHES);
  const isLoading = false;

  // --- HELPERS DE FORMATAGE ---
  const formatTime = (dateStr: string) => {
    if (!dateStr) return "--:--";
    return new Date(dateStr).toLocaleTimeString("fr-CA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("fr-CA", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8 font-sans selection:bg-[#00cc55]/30">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <div className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-[#00cc55] transition-colors cursor-pointer">
            <ArrowLeft size={24} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-[#00cc55] italic uppercase tracking-tighter leading-none shadow-neon">
              Calendrier
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1 italic">Saison 2026 • LDHN Newport</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20 animate-pulse">Chargement de l'aréna...</div>
        ) : (
          <div className="grid gap-6">
            {matches
              // TRI CHRONOLOGIQUE : Du 20 avril jusqu'en mai
              .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
              .map((match) => (
              <div key={match.id} className="bg-[#141414] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden group hover:border-[#00cc55]/40 transition-all duration-500">
                
                {/* Info Bar (Fix Heure) */}
                <div className="bg-[#1a1a1a] px-6 py-3 flex justify-between items-center border-b border-white/5">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                      <CalendarIcon size={12} className="text-[#00cc55]" />
                      {formatDate(match.match_date)}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest bg-slate-800 px-3 py-1 rounded-md shadow-inner">
                      <Clock size={12} className="text-[#00cc55]" />
                      {formatTime(match.match_date)}
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-slate-800 text-slate-500">
                    {STATUS_LABELS[match.status] || match.status}
                  </span>
                </div>

                {/* Match Card Content (Fix Logos) */}
                <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative">
                  
                  {/* Domicile */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 md:justify-end text-center md:text-right">
                    <span className="block font-black text-lg sm:text-xl uppercase tracking-tight text-white leading-none order-2 sm:order-1">
                      {match.home_team.name}
                    </span>
                    <div className="relative shrink-0 order-1 sm:order-2">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center border-2 overflow-hidden bg-black/50 shadow-inner group-hover:scale-105 transition-transform duration-500" style={{ borderColor: match.home_team.color }}>
                        {match.home_team.logo_url ? (
                          <img src={match.home_team.logo_url} className="w-full h-full object-contain p-2" alt="" />
                        ) : (
                          <span className="text-xl font-black italic" style={{ color: match.home_team.color }}>{match.home_team.abbr}</span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#141414]" style={{ backgroundColor: match.home_team.color }}></div>
                    </div>
                  </div>

                  {/* VS */}
                  <div className="flex flex-col items-center px-4 shrink-0">
                    <div className="flex items-center gap-6">
                      <span className="text-5xl font-black italic w-14 text-center text-white">{match.home_score}</span>
                      <div className="flex flex-col items-center gap-1">
                         <div className="h-1 w-8 bg-[#00cc55] rounded-full shadow-[0_0_12px_#00cc55]"></div>
                         <span className="text-[10px] font-black text-slate-700 uppercase italic">VS</span>
                         <div className="h-1 w-8 bg-[#00cc55] rounded-full shadow-[0_0_12px_#00cc55]"></div>
                      </div>
                      <span className="text-5xl font-black italic w-14 text-center text-white">{match.away_score}</span>
                    </div>
                    {match.surface && (
                      <div className="mt-5 bg-slate-900/50 px-4 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
                         <MapPin size={12} className="text-[#00cc55]" />
                         <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{match.surface}</span>
                      </div>
                    )}
                  </div>

                  {/* Visiteur */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 md:justify-start text-center md:text-left">
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center border-2 overflow-hidden bg-black/50 shadow-inner group-hover:scale-105 transition-transform duration-500" style={{ borderColor: match.away_team.color }}>
                        {match.away_team.logo_url ? (
                          <img src={match.away_team.logo_url} className="w-full h-full object-contain p-2" alt="" />
                        ) : (
                          <span className="text-xl font-black italic" style={{ color: match.away_team.color }}>{match.away_team.abbr}</span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full border-4 border-[#141414]" style={{ backgroundColor: match.away_team.color }}></div>
                    </div>
                    <span className="block font-black text-lg sm:text-xl uppercase tracking-tight text-white leading-none">
                      {match.away_team.name}
                    </span>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-20 pt-10 border-t border-white/5 text-center opacity-40">
           <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.4em]">LDHN Newport • Ligue de Dek Hockey Jeunesse</p>
        </div>
      </div>
    </div>
  );
};

export default Matches;
