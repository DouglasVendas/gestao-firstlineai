import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, DollarSign, TrendingUp, Target, ArrowRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const funnelData = [
  { name: "Visitantes", value: 15000, fill: "hsl(var(--chart-1))" },
  { name: "Leads", value: 2250, fill: "hsl(var(--chart-2))" },
  { name: "MQL", value: 680, fill: "hsl(var(--chart-3))" },
  { name: "SQL", value: 340, fill: "hsl(var(--chart-4))" },
  { name: "Oportunidade", value: 170, fill: "hsl(var(--chart-5))" },
  { name: "Cliente", value: 42, fill: "hsl(var(--success))" },
];

const channelPerformanceData = [
  { channel: "Google Ads", leads: 520, cpl: 45, conversao: 2.8, roi: 285 },
  { channel: "LinkedIn Ads", leads: 280, cpl: 85, conversao: 4.2, roi: 180 },
  { channel: "Orgânico/SEO", leads: 850, cpl: 12, conversao: 3.5, roi: 620 },
  { channel: "Indicação", leads: 380, cpl: 0, conversao: 8.5, roi: 950 },
  { channel: "Eventos", leads: 120, cpl: 180, conversao: 6.2, roi: 145 },
  { channel: "Redes Sociais", leads: 100, cpl: 35, conversao: 1.8, roi: 95 },
];

const campaignROIData = [
  { campaign: "Black Friday 2023", investment: 25000, revenue: 85000, roi: 240 },
  { campaign: "Webinar IA", investment: 8000, revenue: 32000, roi: 300 },
  { campaign: "Google Brand", investment: 12000, revenue: 42000, roi: 250 },
  { campaign: "LinkedIn Enterprise", investment: 18000, revenue: 45000, roi: 150 },
  { campaign: "Content Marketing", investment: 6000, revenue: 28000, roi: 367 },
];

const pipelineData = [
  { stage: "Proposta Enviada", deals: 12, value: 145000 },
  { stage: "Negociação", deals: 8, value: 98000 },
  { stage: "Fechamento", deals: 5, value: 67000 },
];

export default function Marketing() {
  return (
    <AppLayout
      title="Marketing & Funil"
      subtitle="Performance de marketing e pipeline de vendas"
    >
      {/* Metric Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Leads"
          value="2.250"
          change={{ value: 18, isPositive: true }}
          icon={Users}
          description="Este mês"
        />
        <MetricCard
          title="CPL Médio"
          value="R$ 42"
          change={{ value: 12, isPositive: true }}
          icon={DollarSign}
          description="Custo por Lead"
        />
        <MetricCard
          title="Taxa de Conversão"
          value="1.87%"
          change={{ value: 0.3, isPositive: true }}
          icon={TrendingUp}
          description="Lead → Cliente"
        />
        <MetricCard
          title="ROI Marketing"
          value="320%"
          change={{ value: 25, isPositive: true }}
          icon={Target}
          description="Retorno sobre investimento"
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Funnel Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funil de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelData.map((stage, idx) => {
                const prevValue = idx > 0 ? funnelData[idx - 1].value : stage.value;
                const conversionRate = ((stage.value / prevValue) * 100).toFixed(1);
                const widthPercent = (stage.value / funnelData[0].value) * 100;

                return (
                  <div key={stage.name} className="relative">
                    <div className="flex items-center gap-4">
                      <div className="w-28 text-sm font-medium">{stage.name}</div>
                      <div className="flex-1">
                        <div
                          className="h-10 rounded-r-lg transition-all flex items-center justify-end pr-3"
                          style={{
                            width: `${Math.max(widthPercent, 10)}%`,
                            backgroundColor: stage.fill,
                          }}
                        >
                          <span className="text-sm font-bold text-white">
                            {stage.value.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {idx > 0 && (
                        <Badge variant="outline" className="min-w-16 justify-center">
                          {conversionRate}%
                        </Badge>
                      )}
                    </div>
                    {idx < funnelData.length - 1 && (
                      <div className="ml-28 pl-4 py-1">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-sm text-muted-foreground">
                Conversão Geral: Visitante → Cliente
              </p>
              <p className="text-2xl font-bold text-primary">
                {((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100).toFixed(2)}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pipeline de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pipelineData.map((stage) => (
                <div
                  key={stage.stage}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{stage.stage}</p>
                    <p className="text-sm text-muted-foreground">
                      {stage.deals} oportunidades
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(stage.value)}
                    </p>
                    <p className="text-xs text-muted-foreground">Valor potencial</p>
                  </div>
                </div>
              ))}
              <div className="rounded-lg bg-primary/10 p-4 text-center">
                <p className="text-sm text-muted-foreground">Pipeline Total</p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(pipelineData.reduce((sum, s) => sum + s.value, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Channel Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">CPL</TableHead>
                  <TableHead className="text-right">Conv.</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channelPerformanceData.map((channel) => (
                  <TableRow key={channel.channel}>
                    <TableCell className="font-medium">{channel.channel}</TableCell>
                    <TableCell className="text-right">{channel.leads}</TableCell>
                    <TableCell className="text-right">
                      {channel.cpl > 0 ? formatCurrency(channel.cpl) : "—"}
                    </TableCell>
                    <TableCell className="text-right">{channel.conversao}%</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={channel.roi >= 300 ? "default" : channel.roi >= 150 ? "secondary" : "destructive"}
                        className={cn(channel.roi >= 300 && "bg-success/10 text-success border-success/20")}
                      >
                        {channel.roi}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Campaign ROI */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ROI por Campanha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignROIData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="campaign" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'ROI']}
                  />
                  <Bar dataKey="roi" radius={[0, 4, 4, 0]}>
                    {campaignROIData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.roi >= 300 ? 'hsl(var(--success))' : entry.roi >= 200 ? 'hsl(var(--primary))' : 'hsl(var(--warning))'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
