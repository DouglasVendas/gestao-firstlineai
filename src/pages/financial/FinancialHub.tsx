import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DreContent } from "@/components/financial/DreContent";
import { CashflowContent } from "@/components/financial/CashflowContent";
import { ValuationContent } from "@/components/financial/ValuationContent";
import { ReceivablesContent } from "@/components/financial/ReceivablesContent";
import { CashContent } from "@/components/financial/CashContent";
import { CostsContent } from "@/components/costs/CostsContent";
import { DataImportModal } from "@/components/financial/DataImportModal";
import { useFinancialData } from "@/contexts/FinancialContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";

export default function FinancialHub() {
    const { dateRange, setDateRange, setSelectedMonth } = useFinancialData();
    const { setPageTitle } = usePageTitle();

    useEffect(() => {
        setPageTitle("Hub Financeiro", "Centralizada de resultados, caixa, e gestão de SaaS");
    }, [setPageTitle]);

    return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
                        <p className="text-muted-foreground p-1">Gestão completa "Quote-to-Cash": Receita, Custos e Resultados.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <DataImportModal />
                        <DatePickerWithRange
                            date={dateRange}
                            onDateChange={(range) => {
                                setDateRange(range);
                                if (range?.from) setSelectedMonth(range.from);
                            }}
                        />
                    </div>
                </div>

                <Tabs defaultValue="dre" className="space-y-6">
                    <div className="w-full overflow-x-auto pb-2">
                        <TabsList className="grid w-full min-w-[720px] grid-cols-6 lg:w-[960px]">
                            <TabsTrigger value="dre">DRE Gerencial</TabsTrigger>
                            <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
                            <TabsTrigger value="cash">Caixa</TabsTrigger>
                            <TabsTrigger value="receivables">Recebimentos</TabsTrigger>
                            <TabsTrigger value="costs">Custos e Despesas</TabsTrigger>
                            <TabsTrigger value="valuation">Valuation</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="dre">
                        <DreContent />
                    </TabsContent>

                    <TabsContent value="cashflow">
                        <CashflowContent />
                    </TabsContent>

                    <TabsContent value="cash">
                        <CashContent />
                    </TabsContent>

                    <TabsContent value="receivables">
                        <ReceivablesContent />
                    </TabsContent>

                    <TabsContent value="costs">
                        <CostsContent />
                    </TabsContent>

                    <TabsContent value="valuation">
                        <ValuationContent />
                    </TabsContent>
                </Tabs>
            </div>
    );
}
