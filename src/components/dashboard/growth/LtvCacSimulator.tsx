import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface LtvCacSimulatorProps {
    baseLTV: number;
    baseCAC: number;
}

export function LtvCacSimulator({ baseLTV, baseCAC }: LtvCacSimulatorProps) {
    const [simulatorValues, setSimulatorValues] = useState({
        churnReduction: 0,
        arpaIncrease: 0,
        cacReduction: 0,
    });

    const { simulatedLTV, simulatedCAC, simulatedRatio } = useMemo(() => {
        const sLTV = baseLTV * (1 + simulatorValues.churnReduction / 100) * (1 + simulatorValues.arpaIncrease / 100);
        const sCAC = baseCAC * (1 - simulatorValues.cacReduction / 100);
        const sRatio = sCAC > 0 ? sLTV / sCAC : 0;
        return { simulatedLTV: sLTV, simulatedCAC: sCAC, simulatedRatio: sRatio };
    }, [baseLTV, baseCAC, simulatorValues]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Calculator className="h-5 w-5" />
                    Simulador "E se..." (Unit Economics)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label>Redução no Churn: {simulatorValues.churnReduction}%</Label>
                            <Slider
                                value={[simulatorValues.churnReduction]}
                                onValueChange={([v]) => setSimulatorValues({ ...simulatorValues, churnReduction: v })}
                                min={0}
                                max={50}
                                step={5}
                            />
                        </div>
                        <div className="space-y-3">
                            <Label>Aumento no ARPA: {simulatorValues.arpaIncrease}%</Label>
                            <Slider
                                value={[simulatorValues.arpaIncrease]}
                                onValueChange={([v]) => setSimulatorValues({ ...simulatorValues, arpaIncrease: v })}
                                min={0}
                                max={50}
                                step={5}
                            />
                        </div>
                        <div className="space-y-3">
                            <Label>Redução no CAC: {simulatorValues.cacReduction}%</Label>
                            <Slider
                                value={[simulatorValues.cacReduction]}
                                onValueChange={([v]) => setSimulatorValues({ ...simulatorValues, cacReduction: v })}
                                min={0}
                                max={50}
                                step={5}
                            />
                        </div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-6">
                        <h4 className="mb-4 font-semibold">Resultado da Simulação</h4>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-lg bg-background p-4 text-center">
                                <p className="text-sm text-muted-foreground">Novo LTV</p>
                                <p className="text-2xl font-bold text-success">{formatCurrency(simulatedLTV)}</p>
                                <p className="text-xs text-muted-foreground">
                                    {simulatedLTV > baseLTV ? "+" : ""}{baseLTV > 0 ? ((simulatedLTV - baseLTV) / baseLTV * 100).toFixed(1) : 0}%
                                </p>
                            </div>
                            <div className="rounded-lg bg-background p-4 text-center">
                                <p className="text-sm text-muted-foreground">Novo CAC</p>
                                <p className="text-2xl font-bold text-primary">{formatCurrency(simulatedCAC)}</p>
                                <p className="text-xs text-muted-foreground">
                                    {simulatedCAC < baseCAC ? "-" : "+"}{baseCAC > 0 ? Math.abs((simulatedCAC - baseCAC) / baseCAC * 100).toFixed(1) : 0}%
                                </p>
                            </div>
                            <div className="rounded-lg bg-background p-4 text-center">
                                <p className="text-sm text-muted-foreground">Novo Ratio</p>
                                <p className="text-2xl font-bold text-primary">{simulatedRatio.toFixed(2)}:1</p>
                                <Badge variant={simulatedRatio >= 3 ? "default" : "destructive"} className={simulatedRatio >= 3 ? "bg-success/10 text-success" : ""}>
                                    {simulatedRatio >= 5 ? "Excelente" : simulatedRatio >= 3 ? "Bom" : "Melhorar"}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
