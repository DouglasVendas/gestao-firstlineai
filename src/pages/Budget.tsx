import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PieChart, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const budgetData = [
  { category: "Receita", budgeted: 350000, actual: 358000 },
  { category: "Pessoal", budgeted: 170000, actual: 168800 },
  { category: "Marketing", budgeted: 45000, actual: 48000 },
  { category: "Infraestrutura", budgeted: 30000, actual: 31200 },
  { category: "Operacional", budgeted: 15000, actual: 13800 },
];

const okrs = [
  { objective: "Atingir R$ 500k MRR", keyResults: [{ kr: "MRR de R$ 500k", progress: 69, target: "R$ 500k" }] },
  { objective: "Reduzir churn para < 2%", keyResults: [{ kr: "Churn rate mensal", progress: 85, target: "< 2%" }] },
  { objective: "Melhorar NPS para 70+", keyResults: [{ kr: "NPS Score", progress: 92, target: "70+" }] },
];

export default function Budget() {
  return (
    <AppLayout title="Orçamento" subtitle="Planejamento e acompanhamento orçamentário">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Orçamento Anual" value="R$ 4.2M" icon={PieChart} description="2024" />
        <MetricCard title="Realizado YTD" value="R$ 358k" change={{ value: 2.3, isPositive: true }} icon={TrendingUp} description="Janeiro" />
        <MetricCard title="Variação" value="+2.3%" change={{ value: 2.3, isPositive: true }} icon={Target} description="Acima do orçado" />
        <MetricCard title="Forecast Anual" value="R$ 4.5M" change={{ value: 7, isPositive: true }} icon={AlertTriangle} description="Projeção" />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Orçado vs Realizado</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="category" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [formatCurrency(v), '']} />
                  <Legend />
                  <Bar dataKey="budgeted" name="Orçado" fill="hsl(var(--muted-foreground))" radius={[4,4,0,0]} />
                  <Bar dataKey="actual" name="Realizado" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">OKRs Q1 2024</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-6">
              {okrs.map((okr, idx) => (
                <div key={idx} className="space-y-3">
                  <h4 className="font-medium">{okr.objective}</h4>
                  {okr.keyResults.map((kr, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{kr.kr}</span>
                        <Badge variant={kr.progress >= 80 ? "default" : "secondary"} className={cn(kr.progress >= 80 && "bg-success/10 text-success")}>{kr.progress}%</Badge>
                      </div>
                      <Progress value={kr.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
