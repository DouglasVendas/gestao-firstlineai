import { Toaster } from "@/components/ui/toaster";
import { FinancialProvider } from "@/contexts/FinancialContext";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import Metrics from "./pages/Metrics";
import Plans from "./pages/Plans";
import Receivables from "./pages/Receivables";
import VariableCosts from "./pages/VariableCosts";
import FixedCosts from "./pages/FixedCosts";
import Churn from "./pages/Churn";
import LtvCac from "./pages/LtvCac";
import Marketing from "./pages/Marketing";
import Dre from "./pages/Dre";
import Cashflow from "./pages/Cashflow";
import Valuation from "./pages/Valuation";
import Budget from "./pages/Budget";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import ImportData from "./pages/ImportData";
import NotFound from "./pages/NotFound";

import { AIChat } from "@/components/AIChat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FinancialProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AIChat />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/receivables" element={<Receivables />} />
            <Route path="/variable-costs" element={<VariableCosts />} />
            <Route path="/fixed-costs" element={<FixedCosts />} />
            <Route path="/churn" element={<Churn />} />
            <Route path="/ltv-cac" element={<LtvCac />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/dre" element={<Dre />} />
            <Route path="/cashflow" element={<Cashflow />} />
            <Route path="/valuation" element={<Valuation />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/import-data" element={<ImportData />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </FinancialProvider>
  </QueryClientProvider>
);

export default App;
