import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DreContent } from "@/components/financial/DreContent";
import { CashflowContent } from "@/components/financial/CashflowContent";
import { ValuationContent } from "@/components/financial/ValuationContent";

export default function FinancialHub() {
    return (
        <AppLayout
            title="Hub Financeiro"
            subtitle="Gestão centralizada de resultados, caixa e valuation"
        >
            <Tabs defaultValue="dre" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="dre">DRE Gerencial</TabsTrigger>
                    <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
                    <TabsTrigger value="valuation">Valuation</TabsTrigger>
                </TabsList>

                <TabsContent value="dre">
                    <DreContent />
                </TabsContent>

                <TabsContent value="cashflow">
                    <CashflowContent />
                </TabsContent>

                <TabsContent value="valuation">
                    <ValuationContent />
                </TabsContent>
            </Tabs>
        </AppLayout>
    );
}
