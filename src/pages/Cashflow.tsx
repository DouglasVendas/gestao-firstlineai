import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet, TrendingUp, TrendingDown, Clock, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const balanceEvolutionData = [
  { month: "Jul", saldo: 185000, entradas: 285000, saidas: 248000 },
  { month: "Ago", saldo: 228000, entradas: 295000, saidas: 252000 },
  { month: "Set", saldo: 278000, entradas: 305000, saidas: 255000 },
  { month: "Out", saldo: 340000, entradas: 320000, saidas: 258000 },
  { month: "Nov", saldo: 415000, entradas: 335000, saidas: 260000 },
  { month: "Dez", saldo: 501000, entradas: 348000, saidas: 262000 },
  { month: "Jan", saldo: 598000, entradas: 358000, saidas: 261000 },
];

const projectionData = [
  { month: "Fev", pessimista: 550000, base: 620000, otimista: 680000 },
  { month: "Mar", pessimista: 510000, base: 650000, otimista: 750000 },
  { month: "Abr", pessimista: 480000, base: 690000, otimista: 830000 },
  { month: "Mai", pessimista: 450000, base: 740000, otimista: 920000 },
  { month: "Jun", pessimista: 420000, base: 800000, otimista: 1020000 },
  { month: "Jul", pessimista: 390000, base: 870000, otimista: 1130000 },
];

const transactions = [
  { id: 1, date: "2024-01-28", description: "Recebimento - Tech Solutions", type: "entrada", category: "MRR", value: 4500 },
  { id: 2, date: "2024-01-27", description: "Recebimento - Digital Corp", type: "entrada", category: "MRR", value: 4500 },
  { id: 3, date: "2024-01-26", description: "Folha de Pagamento", type: "saida", category: "Pessoal", value: -85000 },
  { id: 4, date: "2024-01-25", description: "AWS Cloud", type: "saida", category: "Infraestrutura", value: -8000 },
  { id: 5, date: "2024-01-24", description: "Recebimento - Fintech Brasil", type: "entrada", category: "MRR", value: 4500 },
  { id: 6, date: "2024-01-23", description: "Anthropic API", type: "saida", category: "API", value: -14200 },
  { id: 7, date: "2024-01-22", description: "Aluguel Escritório", type: "saida", category: "Operacional", value: -8500 },
  { id: 8, date: "2024-01-21", description: "Google Ads", type: "saida", category: "Marketing", value: -12000 },
];

export default function Cashflow() {
  return (
    <AppLayout
      title="Fluxo de Caixa"
      subtitle="Gestão de entradas, saídas e projeções"
    >
      {/* Metric Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Saldo Atual"
          value="R$ 598.000"
          change={{ value: 19.4, isPositive: true }}
          icon={Wallet}
          description="Em caixa"
        />
        <MetricCard
          title="Entradas (30d)"
          value="R$ 358.000"
          change={{ value: 8.2, isPositive: true }}
          icon={TrendingUp}
          description="Recebimentos"
        />
        <MetricCard
          title="Saídas (30d)"
          value="R$ 261.000"
          change={{ value: 3.1, isPositive: true }}
          icon={TrendingDown}
          description="Pagamentos"
        />
        <MetricCard
          title="Runway"
          value="24 meses"
          change={{ value: 4, isPositive: true }}
          icon={Clock}
          description="Burn: R$ 25k/mês"
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Balance Evolution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução do Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={balanceEvolutionData}>
                  <defs>
                    <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="saldo"
                    name="Saldo"
                    stroke="hsl(var(--primary))"
                    fill="url(#saldoGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow (Entries vs Exits) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Entradas vs Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={balanceEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Legend />
                  <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span>Projeção de Caixa (6 meses)</span>
            <Tabs defaultValue="6m" className="w-auto">
              <TabsList>
                <TabsTrigger value="3m">3 meses</TabsTrigger>
                <TabsTrigger value="6m">6 meses</TabsTrigger>
                <TabsTrigger value="12m">12 meses</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id="pessimistaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="baseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="otimistaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Legend />
                <Area type="monotone" dataKey="pessimista" name="Pessimista" stroke="hsl(var(--destructive))" fill="url(#pessimistaGradient)" strokeWidth={2} strokeDasharray="5 5" />
                <Area type="monotone" dataKey="base" name="Base" stroke="hsl(var(--primary))" fill="url(#baseGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="otimista" name="Otimista" stroke="hsl(var(--success))" fill="url(#otimistaGradient)" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span>Movimentações Recentes</span>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova Movimentação
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDate(tx.date)}
                  </TableCell>
                  <TableCell className="font-medium">{tx.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tx.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {tx.type === "entrada" ? (
                      <Badge className="bg-success/10 text-success border-success/20">
                        <ArrowUpRight className="mr-1 h-3 w-3" />
                        Entrada
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                        <ArrowDownRight className="mr-1 h-3 w-3" />
                        Saída
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-medium tabular-nums",
                    tx.value > 0 ? "text-success" : "text-destructive"
                  )}>
                    {tx.value > 0 ? "+" : ""}{formatCurrency(tx.value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
