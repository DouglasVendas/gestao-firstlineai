import { Toaster } from "@/components/ui/toaster";
import { FinancialProvider } from "@/contexts/FinancialContext";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import Receivables from "./pages/Receivables";
import Budget from "./pages/Budget";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import ImportData from "./pages/ImportData";
import NotFound from "./pages/NotFound";
import FinancialHub from "./pages/financial/FinancialHub";
import CostsManager from "./pages/costs/CostsManager";
import CommercialHub from "./pages/commercial/CommercialHub";
import LegalHub from "./pages/legal/LegalHub";
import GREBoard from "./pages/gre/GREBoard";
import GREPillarDetail from "./pages/gre/GREPillarDetail";

import { AIChat } from "@/components/AIChat";
import { SetupWizard } from "@/components/onboarding/SetupWizard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FinancialProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SetupWizard />
        <AIChat />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/receivables" element={<Receivables />} />
            <Route path="/financial" element={<FinancialHub />} />
            <Route path="/costs" element={<CostsManager />} />
            <Route path="/commercial" element={<CommercialHub />} />
            <Route path="/legal" element={<LegalHub />} />

            <Route path="/budget" element={<Budget />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/import-data" element={<ImportData />} />

            {/* GRE Module Routes */}
            <Route path="/gre" element={<GREBoard />} />
            <Route path="/gre/pillar/:id" element={<GREPillarDetail />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </FinancialProvider>
  </QueryClientProvider>
);

export default App;
