import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DreContent } from "@/components/financial/DreContent";
import { CashflowContent } from "@/components/financial/CashflowContent";
import { ValuationContent } from "@/components/financial/ValuationContent";
import { DataImportModal } from "@/components/financial/DataImportModal";
import { useFinancialData } from "@/contexts/FinancialContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function FinancialHub() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const { setSelectedMonth } = useFinancialData();

    useEffect(() => {
        if (date) {
            setSelectedMonth(date);
        }
    }, [date, setSelectedMonth]);

    return (
        <AppLayout
            title="Hub Financeiro"
            subtitle="Gestão centralizada de resultados, caixa e valuation"
        >
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
                        <p className="text-muted-foreground">Gestão completa do fluxo de caixa e DRE.</p>
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
            </div>
        </AppLayout>
    );
}
