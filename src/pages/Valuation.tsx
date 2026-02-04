import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, TrendingUp, DollarSign, Target, BarChart3, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useDashboardData } from "@/hooks/useDashboardData";

const sensitivityData = [
  { multiplo: "8x", conservador: 28800000, base: 33600000, otimista: 38400000 },
  { multiplo: "10x", conservador: 36000000, base: 42000000, otimista: 48000000 },
  { multiplo: "12x", conservador: 43200000, base: 50400000, otimista: 57600000 },
  { multiplo: "15x", conservador: 54000000, base: 63000000, otimista: 72000000 },
];

const waterfallData = [
  { name: "ARR Base", value: 42000000, isTotal: false },
  { name: "Growth Premium", value: 8400000, isTotal: false },
  { name: "NRR Premium", value: 4200000, isTotal: false },
  { name: "Margin Premium", value: 2100000, isTotal: false },
  { name: "Private Discount", value: -8400000, isTotal: false },
  { name: "Valuation Final", value: 48300000, isTotal: true },
];

export default function Valuation() {
  const { metrics, isLoading } = useDashboardData();
  const [inputs, setInputs] = useState({
    arr: 4200000,
    growthRate: 85,
    ebitdaMargin: 5,
    nrr: 112,
    multiplo: 10,
    wacc: 15,
    terminalGrowth: 3,
  });

  useEffect(() => {
    if (metrics && metrics.length > 0) {
      const current = metrics[metrics.length - 1];
      const previous = metrics[metrics.length - 13] || metrics[0]; // Try to get YoY or fallback to start

      const arr = current.arr || (current.mrr * 12) || 0;
      let growthRate = 0;
      if (previous.arr > 0) {
        growthRate = ((arr - previous.arr) / previous.arr) * 100;
      } else if (previous.mrr > 0) {
        growthRate = (((current.mrr || 0) - previous.mrr) / previous.mrr) * 100;
      }

      setInputs(prev => ({
        ...prev,
        arr: arr,
        growthRate: Math.round(growthRate) || 0
      }));
    }
  }, [metrics]);

  if (isLoading) {
    return (
      <AppLayout title="Valuation" subtitle="Calculadora de valuation e análise de cenários">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const baseValuation = inputs.arr * inputs.multiplo;
  const growthAdjustment = inputs.growthRate > 50 ? 0.2 : inputs.growthRate > 30 ? 0.1 : 0;
  const nrrAdjustment = inputs.nrr > 110 ? 0.1 : inputs.nrr > 100 ? 0.05 : 0;
  const marginAdjustment = inputs.ebitdaMargin > 10 ? 0.05 : 0;
  const privateDiscount = 0.2;

  const adjustedValuation = baseValuation * (1 + growthAdjustment + nrrAdjustment + marginAdjustment) * (1 - privateDiscount);

  const scenarios = {
    conservador: adjustedValuation * 0.8,
    base: adjustedValuation,
    otimista: adjustedValuation * 1.2,
  };

  return (
    <AppLayout
      title="Valuation"
      subtitle="Calculadora de valuation e análise de cenários"
    >
      {/* Metric Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="ARR Atual"
          value="R$ 4.2M"
          change={{ value: 85, isPositive: true }}
          icon={TrendingUp}
          description="Crescimento YoY"
        />
        <MetricCard
          title="Valuation Base"
          value="R$ 42M"
          change={{ value: 0, isPositive: true }}
          icon={DollarSign}
          description="10x ARR"
        />
        <MetricCard
          title="Valuation Ajustado"
          value={`R$ ${(adjustedValuation / 1000000).toFixed(1)}M`}
          change={{ value: 15, isPositive: true }}
          icon={Calculator}
          description="Com ajustes"
        />
        <MetricCard
          title="Múltiplo Implícito"
          value={`${(adjustedValuation / inputs.arr).toFixed(1)}x`}
          change={{ value: 0, isPositive: true }}
          icon={Target}
          description="Valuation / ARR"
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5" />
              Calculadora de Valuation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="multiplos" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="multiplos">Múltiplos</TabsTrigger>
                <TabsTrigger value="dcf">DCF</TabsTrigger>
                <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
              </TabsList>

              <TabsContent value="multiplos" className="space-y-6 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>ARR (R$)</Label>
                    <Input
                      type="number"
                      value={inputs.arr}
                      onChange={(e) => setInputs({ ...inputs, arr: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Taxa de Crescimento YoY: {inputs.growthRate}%</Label>
                    <Slider
                      value={[inputs.growthRate]}
                      onValueChange={([v]) => setInputs({ ...inputs, growthRate: v })}
                      min={0}
                      max={200}
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Margem EBITDA: {inputs.ebitdaMargin}%</Label>
                    <Slider
                      value={[inputs.ebitdaMargin]}
                      onValueChange={([v]) => setInputs({ ...inputs, ebitdaMargin: v })}
                      min={-50}
                      max={50}
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>NRR: {inputs.nrr}%</Label>
                    <Slider
                      value={[inputs.nrr]}
                      onValueChange={([v]) => setInputs({ ...inputs, nrr: v })}
                      min={70}
                      max={150}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Múltiplo Base: {inputs.multiplo}x ARR</Label>
                    <Slider
                      value={[inputs.multiplo]}
                      onValueChange={([v]) => setInputs({ ...inputs, multiplo: v })}
                      min={3}
                      max={25}
                      step={1}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dcf" className="space-y-6 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>WACC: {inputs.wacc}%</Label>
                    <Slider
                      value={[inputs.wacc]}
                      onValueChange={([v]) => setInputs({ ...inputs, wacc: v })}
                      min={8}
                      max={25}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Crescimento Terminal: {inputs.terminalGrowth}%</Label>
                    <Slider
                      value={[inputs.terminalGrowth]}
                      onValueChange={([v]) => setInputs({ ...inputs, terminalGrowth: v })}
                      min={0}
                      max={5}
                      step={0.5}
                    />
                  </div>

                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">
                      O método DCF requer projeções de 5 anos de fluxo de caixa livre.
                      Em startups early-stage, múltiplos de receita são mais comuns.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="scorecard" className="space-y-6 pt-4">
                <div className="space-y-3">
                  {[
                    { label: "Tamanho do Mercado (TAM)", score: 8 },
                    { label: "Tração (MRR/Crescimento)", score: 9 },
                    { label: "Equipe Fundadora", score: 7 },
                    { label: "Produto/Tecnologia", score: 8 },
                    { label: "Retenção de Clientes", score: 9 },
                    { label: "Métricas (LTV/CAC)", score: 8 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <span className="text-sm">{item.label}</span>
                      <Badge variant={item.score >= 8 ? "default" : item.score >= 6 ? "secondary" : "destructive"}>
                        {item.score}/10
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cenários de Valuation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conservador</p>
                    <p className="text-2xl font-bold">R$ {(scenarios.conservador / 1000000).toFixed(1)}M</p>
                  </div>
                  <Badge variant="outline">{((scenarios.conservador / inputs.arr)).toFixed(1)}x ARR</Badge>
                </div>
              </div>

              <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Base</p>
                    <p className="text-3xl font-bold text-primary">R$ {(scenarios.base / 1000000).toFixed(1)}M</p>
                  </div>
                  <Badge className="bg-primary">{((scenarios.base / inputs.arr)).toFixed(1)}x ARR</Badge>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-success/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Otimista</p>
                    <p className="text-2xl font-bold text-success">R$ {(scenarios.otimista / 1000000).toFixed(1)}M</p>
                  </div>
                  <Badge variant="outline" className="text-success border-success">{((scenarios.otimista / inputs.arr)).toFixed(1)}x ARR</Badge>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="mb-3 text-sm font-medium">Ajustes Aplicados</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Growth Premium ({inputs.growthRate}% YoY)</span>
                  <span className="text-success">+{(growthAdjustment * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NRR Premium ({inputs.nrr}%)</span>
                  <span className="text-success">+{(nrrAdjustment * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margin Premium ({inputs.ebitdaMargin}%)</span>
                  <span className="text-success">+{(marginAdjustment * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Private Company Discount</span>
                  <span className="text-destructive">-{(privateDiscount * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sensitivity Analysis */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Análise de Sensibilidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sensitivityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v / 1000000}M`} />
                <YAxis dataKey="multiplo" type="category" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={50} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Legend />
                <Bar dataKey="conservador" name="Conservador" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="base" name="Base" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="otimista" name="Otimista" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Waterfall Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Waterfall de Valuation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {waterfallData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.isTotal
                          ? 'hsl(var(--primary))'
                          : entry.value >= 0
                            ? 'hsl(var(--success))'
                            : 'hsl(var(--destructive))'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
