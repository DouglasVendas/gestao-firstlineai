
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Calculator, ShoppingCart, Users, Wallet, AlertTriangle } from "lucide-react";

export function ScaleSimulator() {
    const [trafficBudget, setTrafficBudget] = useState(5000);
    const [cac, setCac] = useState(100);
    const [ltv, setLtv] = useState(400); // 4x CAC default
    const [cashBalance, setCashBalance] = useState(50000); // Starting cash

    const [simulation, setSimulation] = useState({
        newCustomers: 0,
        revenue: 0,
        roi: 0,
        ltvCac: 0,
        runwayImpact: 0,
        viable: true
    });

    useEffect(() => {
        const newCustomers = Math.floor(trafficBudget / (cac || 1));
        const revenue = newCustomers * ltv;
        const ltvCac = cac > 0 ? ltv / cac : 0;
        const profit = revenue - trafficBudget;
        const roi = trafficBudget > 0 ? (profit / trafficBudget) * 100 : 0;

        // Simple logic: Is this viable?
        // 1. Do we have cash?
        // 2. Is LTV/CAC > 3?
        const hasCash = cashBalance >= trafficBudget;
        const isEfficient = ltvCac >= 3;
        const viable = hasCash && isEfficient;

        setSimulation({
            newCustomers,
            revenue,
            roi,
            ltvCac,
            runwayImpact: cashBalance - trafficBudget,
            viable
        });

    }, [trafficBudget, cac, ltv, cashBalance]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label>Orçamento de Tráfego (R$)</Label>
                    <div className="flex items-center gap-4">
                        <Slider
                            value={[trafficBudget]}
                            onValueChange={(v) => setTrafficBudget(v[0])}
                            max={100000}
                            step={500}
                            className="flex-1"
                        />
                        <Input
                            type="number"
                            value={trafficBudget}
                            onChange={(e) => setTrafficBudget(Number(e.target.value))}
                            className="w-24"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>CAC (R$)</Label>
                        <Input
                            type="number"
                            value={cac}
                            onChange={(e) => setCac(Number(e.target.value))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>LTV (R$)</Label>
                        <Input
                            type="number"
                            value={ltv}
                            onChange={(e) => setLtv(Number(e.target.value))}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Caixa Disponível (R$)</Label>
                    <Input
                        type="number"
                        value={cashBalance}
                        onChange={(e) => setCashBalance(Number(e.target.value))}
                    />
                </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-6 border flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-primary" />
                            Resultado da Simulação
                        </h3>
                        {simulation.viable ? (
                            <Badge className="bg-green-500 hover:bg-green-600">Escala Viável</Badge>
                        ) : (
                            <Badge variant="destructive">Risco Alto</Badge>
                        )}
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Novos Clientes Estimados</span>
                            <span className="font-medium flex items-center gap-1">
                                <Users className="h-3 w-3" /> {simulation.newCustomers}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Receita Projetada (LTV)</span>
                            <span className="font-medium text-green-600">
                                + R$ {simulation.revenue.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">ROI da Campanha</span>
                            <span className={`font-medium ${simulation.roi >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {simulation.roi.toFixed(0)}%
                            </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                            <span className="text-muted-foreground">Impacto no Caixa Imediato</span>
                            <span className="font-medium text-red-500 flex items-center gap-1">
                                <Wallet className="h-3 w-3" /> - R$ {trafficBudget.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 space-y-3">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span>Eficiência (LTV/CAC)</span>
                            <span className={simulation.ltvCac >= 3 ? "text-green-600 font-bold" : "text-yellow-600 font-bold"}>
                                {simulation.ltvCac.toFixed(1)}x
                            </span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${simulation.ltvCac >= 3 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                style={{ width: `${Math.min(simulation.ltvCac * 20, 100)}%` }}
                            />
                        </div>
                    </div>

                    {!simulation.viable && (
                        <Alert variant="destructive" className="py-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="text-xs font-bold">Gargalo Detectado</AlertTitle>
                            <AlertDescription className="text-xs">
                                {cashBalance < trafficBudget
                                    ? "Falta de caixa para este investimento."
                                    : "LTV/CAC abaixo de 3.0x. Melhore a conversão antes de escalar."
                                }
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>
        </div>
    );
}
