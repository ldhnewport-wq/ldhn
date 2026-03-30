import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Arena from "./pages/Arena.tsx";
import Teams from "./pages/Teams.tsx";
import TeamDetail from "./pages/TeamDetail.tsx";
import Matches from "./pages/Matches.tsx";
import Classement from "./pages/Classement.tsx";
import Admin from "./pages/Admin.tsx";
import Reportage from "./pages/Reportage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/arena" element={<Arena />} />
          <Route path="/equipes" element={<Teams />} />
          <Route path="/equipes/:id" element={<TeamDetail />} />
          <Route path="/matchs" element={<Matches />} />
          <Route path="/classement" element={<Classement />} />
          <Route path="/reportage" element={<Reportage />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
