import { useMemo } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { FixedCostsCategories } from "@/components/costs/FixedCostsCategories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Server, Briefcase, Calendar, Loader2 } from "lucide-react";
import { useFinancialData } from "@/contexts/FinancialContext";
import { formatCurrency } from "@/lib/formatters";
import { CreateFixedCostModal } from "@/components/modals/CreateFixedCostModal";
import { CostsImportModal } from "@/components/modals/CostsImportModal";
import { isSameMonth, parseISO } from "date-fns";
import { normalizeCostCategory } from "@/lib/costCategories";

export function FixedCostsContent() {
    const { fixedCosts, selectedMonth, isLoading } = useFinancialData();

    const filteredCosts = useMemo(() => {
        if (!fixedCosts) return [];
        return fixedCosts.filter(c => c.month && isSameMonth(parseISO(c.month), selectedMonth));
    }, [fixedCosts, selectedMonth]);

    const { totalActual, peopleCost, techCost, adminCost, peoplePercent, techPercent, adminPercent, overdueCosts, upcomingCosts } = useMemo(() => {
        if (!filteredCosts.length) return {
            totalActual: 0,
            peopleCost: 0,
            techCost: 0,
            adminCost: 0,
            peoplePercent: 0,
            techPercent: 0,
            adminPercent: 0,
            overdueCosts: [],
            upcomingCosts: [],
        };

        const tActual = filteredCosts.reduce((acc, c) => acc + Number(c.actual), 0);
        const pCost = filteredCosts.filter(c => normalizeCostCategory(c.category) === "Pessoas").reduce((acc, c) => acc + Number(c.actual), 0);
        const tCost = filteredCosts.filter(c => normalizeCostCategory(c.category) === "Tecnologia e Produto").reduce((acc, c) => acc + Number(c.actual), 0);
        const aCost = filteredCosts.filter(c => normalizeCostCategory(c.category) === "Administrativo").reduce((acc, c) => acc + Number(c.actual), 0);

        return {
            totalActual: tActual,
            peopleCost: pCost,
            techCost: tCost,
            adminCost: aCost,
            peoplePercent: tActual ? (pCost / tActual) * 100 : 0,
            techPercent: tActual ? (tCost / tActual) * 100 : 0,
            adminPercent: tActual ? (aCost / tActual) * 100 : 0,
            overdueCosts: filteredCosts.filter(c => c.status === "overdue"),
            upcomingCosts: filteredCosts.filter(c => c.status === "pending").sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 5),
        };
    }, [filteredCosts]);

    if (isLoading) {
        return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-2">
                <CostsImportModal />
                <CreateFixedCostModal />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Total Custos Fixos" value={formatCurrency(totalActual)} change={0} icon={<Building2 className="h-6 w-6" />} description="Este mês" variant="default" />
                <MetricCard title="Pessoas" value={formatCurrency(peopleCost)} change={0} icon={<Users className="h-6 w-6" />} description={`${peoplePercent.toFixed(1)}% do total`} variant="default" />
                <MetricCard title="Tecnologia e Produto" value={formatCurrency(techCost)} change={0} icon={<Server className="h-6 w-6" />} description={`${techPercent.toFixed(1)}% do total`} variant="default" />
                <MetricCard title="Administrativo" value={formatCurrency(adminCost)} change={0} icon={<Briefcase className="h-6 w-6" />} description={`${adminPercent.toFixed(1)}% do total`} variant="default" />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Pagamentos do Mês</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FixedCostsCategories costs={filteredCosts} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg"><Calendar className="h-5 w-5" /> Vencimentos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {overdueCosts.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-destructive">{overdueCosts.length} pagamento(s) atrasado(s)</p>
                                {overdueCosts.slice(0, 4).map(cost => (
                                    <div key={cost.id} className="rounded-md border border-destructive/30 p-2 text-sm">
                                        <p className="font-medium">{cost.name}</p>
                                        <p className="text-xs text-muted-foreground">Venceu em {new Date(`${cost.due_date}T12:00:00`).toLocaleDateString("pt-BR")}</p>
                                    </div>
                                ))}
                            </div>
                        ) : upcomingCosts.length > 0 ? (
                            <div className="space-y-2">
                                {upcomingCosts.map(cost => (
                                    <div key={cost.id} className="rounded-md border p-2 text-sm">
                                        <p className="font-medium">{cost.name}</p>
                                        <p className="text-xs text-muted-foreground">Vence em {new Date(`${cost.due_date}T12:00:00`).toLocaleDateString("pt-BR")}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-[160px] items-center justify-center text-center text-sm text-muted-foreground p-4">Nenhum vencimento pendente neste mês.</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
