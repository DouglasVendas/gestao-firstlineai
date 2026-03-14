import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DreContent } from "@/components/financial/DreContent";
import { CashflowContent } from "@/components/financial/CashflowContent";
import { ValuationContent } from "@/components/financial/ValuationContent";
import { ReceivablesContent } from "@/components/financial/ReceivablesContent";
import { FixedCostsContent } from "@/components/costs/FixedCostsContent";
import { VariableCostsContent } from "@/components/costs/VariableCostsContent";
import { DataImportModal } from "@/components/financial/DataImportModal";
import { useFinancialData } from "@/contexts/FinancialContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function FinancialHub() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const { setSelectedMonth } = useFinancialData();
    const { setPageTitle } = usePageTitle();

    useEffect(() => {
        setPageTitle("Hub Financeiro", "Centralizada de resultados, caixa, e gestão de SaaS");
    }, [setPageTitle]);

    useEffect(() => {
        if (date) {
            setSelectedMonth(date);
        }
    }, [date, setSelectedMonth]);

    return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
                        <p className="text-muted-foreground p-1">Gestão completa "Quote-to-Cash": Receita, Custos e Resultados.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <DataImportModal />
                        <div className="flex items-center gap-2 bg-card border rounded-md p-1">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"ghost"}
                                        className={cn(
                                            "w-[140px] justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "MMM yyyy") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                        captionLayout="dropdown-buttons"
                                        fromYear={2020}
                                        toYear={new Date().getFullYear() + 1}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="dre" className="space-y-6">
                    <div className="w-full overflow-x-auto pb-2">
                        <TabsList className="grid w-full min-w-[600px] grid-cols-5 lg:w-[800px]">
                            <TabsTrigger value="dre">DRE Gerencial</TabsTrigger>
                            <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
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

                    <TabsContent value="receivables">
                        <ReceivablesContent />
                    </TabsContent>

                    <TabsContent value="costs">
                        <Tabs defaultValue="fixed" className="space-y-4">
                            <TabsList className="w-[400px]">
                                <TabsTrigger value="fixed" className="w-[200px]">Custos Fixos</TabsTrigger>
                                <TabsTrigger value="variable" className="w-[200px]">Custos Variáveis</TabsTrigger>
                            </TabsList>
                            <TabsContent value="fixed">
                                <FixedCostsContent />
                            </TabsContent>
                            <TabsContent value="variable">
                                <VariableCostsContent />
                            </TabsContent>
                        </Tabs>
                    </TabsContent>

                    <TabsContent value="valuation">
                        <ValuationContent />
                    </TabsContent>
                </Tabs>
            </div>
    );
}
