import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, addMonths, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useClients } from "@/hooks/useClients";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatClientName } from "@/lib/clientNames";

export function RenewalWidget() {
    const { data: clients, isLoading } = useClients();

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const today = new Date();

    const upcomingRenewals = clients?.map(client => {
        if (!client.start_date || !client.plan) return null;

        const planName = client.plan.name.toLowerCase();
        let monthsToAdd = 1; // Default monthly

        if (planName.includes('anual')) monthsToAdd = 12;
        else if (planName.includes('semestral')) monthsToAdd = 6;
        else if (planName.includes('trimestral')) monthsToAdd = 3;

        // Calculate next renewal date
        // Logic: Start Date + N * Period until > Today
        // Simplified: Start Date + Period. If in past, assume auto-renewed or need logic to find NEXT.
        // For projection, let's assume contract ends at Start + Period and needs action.

        let renewalDate = addMonths(parseISO(client.start_date), monthsToAdd);

        // If renewal date is in past, keep adding period until future (Simulating ongoing subscription)
        while (renewalDate < today) {
            renewalDate = addMonths(renewalDate, monthsToAdd);
        }

        const daysToRenewal = differenceInDays(renewalDate, today);

        return {
            ...client,
            renewalDate,
            daysToRenewal,
            period: monthsToAdd === 12 ? 'Anual' : monthsToAdd === 6 ? 'Semestral' : monthsToAdd === 3 ? 'Trimestral' : 'Mensal'
        };
    })
        .filter(c => c && c.daysToRenewal <= 60 && c.status === 'active') // Show metrics for next 60 days
        .sort((a, b) => a!.daysToRenewal - b!.daysToRenewal)
        .slice(0, 5); // Top 5

    if (!upcomingRenewals || upcomingRenewals.length === 0) {
        return (
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Próximas Renovações</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <CheckCircle2 className="mb-2 h-8 w-8 text-success" />
                        <p>Nenhuma renovação crítica nos próximos 60 dias.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 animate-slide-up">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-medium">
                    <AlertCircle className="h-5 w-5 text-warning" />
                    Próximas Renovações
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Plano</TableHead>
                            <TableHead className="text-right">Vence em</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {upcomingRenewals.map((client) => (
                            <TableRow key={client!.id}>
                                <TableCell className="font-medium">{formatClientName(client!.name)}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                        {client!.period}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex flex-col items-end">
                                        <span className={client!.daysToRenewal <= 30 ? "font-bold text-destructive" : "text-foreground"}>
                                            {format(client!.renewalDate, "dd/MM", { locale: ptBR })}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {client!.daysToRenewal} dias
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
