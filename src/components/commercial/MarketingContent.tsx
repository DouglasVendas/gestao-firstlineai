import { useState, useMemo } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Users, TrendingUp, ArrowRight, Loader2,
    Globe, Webhook, Zap, Code2, MousePointerClick, FileText,
    Link2, CheckCircle2, Filter, Copy, Check,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useDynamicFunnel, useLeadCaptures, useWebEvents, calculateFunnelFromDeals } from "@/hooks/useMarketingStats";
import { Button } from "@/components/ui/button";

// ─── URL real do projeto Supabase ─────────────────────────
const SUPABASE_URL = "https://eeudoelnnsmavaugfhwv.supabase.co";

// ─── Canais disponíveis para filtro de funil ──────────────
const FUNNEL_CHANNELS = [
    { value: "all", label: "📊 Todos os Canais", emoji: "📊" },
    { value: "Inbound", label: "🧲 Inbound", emoji: "🧲" },
    { value: "Outbound", label: "📤 Outbound", emoji: "📤" },
    { value: "Indicação", label: "🤝 Indicação", emoji: "🤝" },
    { value: "Website", label: "🌐 Website", emoji: "🌐" },
    { value: "LinkedIn", label: "💼 LinkedIn", emoji: "💼" },
    { value: "Evento", label: "🎤 Evento", emoji: "🎤" },
    { value: "Google Ads", label: "📢 Google Ads", emoji: "📢" },
    { value: "Meta Ads", label: "📱 Meta Ads", emoji: "📱" },
    { value: "Direto", label: "➡️ Direto", emoji: "➡️" },
];

const campaignROIData = [
    { campaign: "Black Friday 2023", investment: 25000, revenue: 85000, roi: 240 },
    { campaign: "Webinar IA", investment: 8000, revenue: 32000, roi: 300 },
    { campaign: "Google Brand", investment: 12000, revenue: 42000, roi: 250 },
    { campaign: "LinkedIn Enterprise", investment: 18000, revenue: 45000, roi: 150 },
    { campaign: "Content Marketing", investment: 6000, revenue: 28000, roi: 367 },
];

// ─── Integrations with REAL Supabase URLs ─────────────────
const INTEGRATIONS = [
    {
        name: "Formulários do Site",
        description: "Captura automática de leads de formulários",
        endpoint: `${SUPABASE_URL}/functions/v1/capture-lead`,
        status: "active",
        icon: FileText,
        method: "POST",
    },
    {
        name: "Tracking de Visitantes",
        description: "Script JS para rastreamento de visitas e UTMs",
        endpoint: `${SUPABASE_URL}/functions/v1/track-visit`,
        status: "active",
        icon: MousePointerClick,
        method: "POST",
    },
    {
        name: "Webhook Genérico",
        description: "Recebe dados de Unbounce, Stripe, chatbots, etc.",
        endpoint: `${SUPABASE_URL}/functions/v1/webhook-receiver`,
        status: "active",
        icon: Webhook,
        method: "POST",
    },
    {
        name: "UTM Tracking",
        description: "utm_source, utm_medium, utm_campaign, utm_term, utm_content",
        endpoint: "Automático via Edge Functions",
        status: "active",
        icon: Link2,
        method: "—",
    },
    {
        name: "DB Trigger → Funil",
        description: "Recalcula marketing_stats ao mover deals no pipeline",
        endpoint: "Trigger: trg_deals_recalc_funnel",
        status: "active",
        icon: Zap,
        method: "AUTO",
    },
];

export function MarketingContent() {
    const [selectedChannel, setSelectedChannel] = useState("all");
    const [copiedSnippet, setCopiedSnippet] = useState(false);

    const { data: dynamicData, isLoading: dynamicLoading } = useDynamicFunnel();
    const { data: leads } = useLeadCaptures();
    const { data: webSummary } = useWebEvents();

    if (dynamicLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const allDeals = dynamicData?.allDeals || [];

    // ═══ Filtrar deals pelo canal selecionado ═══
    const filteredDeals = selectedChannel === "all"
        ? allDeals
        : allDeals.filter((d: any) => {
            const src = (d.source || d.utm_source || 'Direto').toLowerCase();
            return src === selectedChannel.toLowerCase();
        });

    // ═══ Recalcular funil para os deals filtrados ═══
    const { funnel, channelPerformance: channelPerf } = selectedChannel === "all"
        ? { funnel: dynamicData?.funnel, channelPerformance: dynamicData?.channelPerformance }
        : calculateFunnelFromDeals(filteredDeals);

    // Channels that actually have deals (for dynamic filter list)
    const availableChannels = useMemo(() => {
        const channels = new Set<string>();
        allDeals.forEach((d: any) => {
            const src = d.source || d.utm_source || 'Direto';
            channels.add(src);
        });
        return channels;
    }, [allDeals]);

    const funnelData = funnel ? [
        { name: "Visitantes", value: funnel.visitors || 0, fill: "hsl(var(--chart-1))" },
        { name: "Leads", value: funnel.leads || 0, fill: "hsl(var(--chart-2))" },
        { name: "MQL", value: funnel.mql || 0, fill: "hsl(var(--chart-3))" },
        { name: "SQL", value: funnel.sql || 0, fill: "hsl(var(--chart-4))" },
        { name: "Oportunidades", value: funnel.opportunities || 0, fill: "hsl(var(--chart-5))" },
        { name: "Clientes", value: funnel.customers || 0, fill: "hsl(var(--success))" },
    ] : [];

    const totalLeads = funnel?.leads || 0;
    const totalCustomers = funnel?.customers || 0;
    const totalVisitors = funnel?.visitors || 0;
    const convRate = totalVisitors > 0 ? ((totalCustomers / totalVisitors) * 100).toFixed(2) : "0";

    const jsSnippet = `<script>
(function(){
  var S='${SUPABASE_URL}';
  var u=new URLSearchParams(location.search);
  var vid=localStorage.getItem('_sc_vid')||
    (localStorage.setItem('_sc_vid',
      'v_'+Math.random().toString(36).substr(2,9)+Date.now().toString(36)),
    localStorage.getItem('_sc_vid'));
  // Salvar UTMs na sessão
  var utms={source:u.get('utm_source'),medium:u.get('utm_medium'),campaign:u.get('utm_campaign')};
  if(utms.source) sessionStorage.setItem('_sc_utms',JSON.stringify(utms));
  else try{utms=JSON.parse(sessionStorage.getItem('_sc_utms')||'{}')}catch(e){}
  // Track visit
  fetch(S+'/functions/v1/track-visit',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      event_type:'pageview',
      page:location.pathname+location.search,
      referrer:document.referrer,
      visitor_id:vid,
      utm_source:utms.source,
      utm_medium:utms.medium,
      utm_campaign:utms.campaign
    })
  }).catch(function(){});
  // Helper para formulários
  window.__captureLeadFromForm=function(d){
    return fetch(S+'/functions/v1/capture-lead',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        name:d.name,email:d.email,phone:d.phone,company:d.company,
        message:d.message,form_source:'website',page_url:location.href,
        utm_source:utms.source,utm_medium:utms.medium,utm_campaign:utms.campaign
      })
    });
  };
})();
</script>`;

    const handleCopySnippet = () => {
        navigator.clipboard.writeText(jsSnippet);
        setCopiedSnippet(true);
        setTimeout(() => setCopiedSnippet(false), 2000);
    };

    return (
        <div className="space-y-6">
            {/* ═══ Header: Métricas + Seletor de Funil ═══ */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 flex-1 w-full">
                    <MetricCard
                        title="Total de Leads"
                        value={totalLeads.toLocaleString()}
                        change={{ value: 18, isPositive: true }}
                        icon={Users}
                        description={selectedChannel === "all" ? "Todos os canais" : selectedChannel}
                    />
                    <MetricCard
                        title="Visitantes"
                        value={(webSummary?.totalPageviews || totalVisitors).toLocaleString()}
                        change={{ value: 12, isPositive: true }}
                        icon={Globe}
                        description="Pageviews do mês"
                    />
                    <MetricCard
                        title="Taxa de Conversão"
                        value={`${convRate}%`}
                        change={{ value: 0.3, isPositive: true }}
                        icon={TrendingUp}
                        description="Visitante → Cliente"
                    />
                    <MetricCard
                        title="Integrações Ativas"
                        value={INTEGRATIONS.filter(i => i.status === "active").length.toString()}
                        change={{ value: 5, isPositive: true }}
                        icon={Zap}
                        description="Endpoints configurados"
                    />
                </div>
            </div>

            {/* ═══ Filtro de Funil + Badges ═══ */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                        <SelectTrigger className="w-[220px] h-9">
                            <SelectValue placeholder="Selecione o funil" />
                        </SelectTrigger>
                        <SelectContent>
                            {FUNNEL_CHANNELS.map(ch => {
                                const hasDeals = ch.value === "all" || availableChannels.has(ch.value);
                                return (
                                    <SelectItem key={ch.value} value={ch.value} className={!hasDeals ? "opacity-50" : ""}>
                                        <span className="flex items-center gap-2">
                                            {ch.label}
                                            {hasDeals && ch.value !== "all" && (
                                                <Badge variant="secondary" className="text-[9px] h-4 px-1 ml-1">
                                                    {allDeals.filter((d: any) => (d.source || d.utm_source || 'Direto').toLowerCase() === ch.value.toLowerCase()).length}
                                                </Badge>
                                            )}
                                        </span>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={cn(
                        "text-xs",
                        funnel ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400" : "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                        {funnel ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" /> Dados em tempo real dos deals</>
                        ) : (
                            <><Loader2 className="h-3 w-3 mr-1" /> Sem dados</>
                        )}
                    </Badge>
                    {selectedChannel !== "all" && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400">
                            <Filter className="h-3 w-3 mr-1" /> Funil: {selectedChannel} ({filteredDeals.length} deals)
                        </Badge>
                    )}
                    {webSummary && webSummary.totalPageviews > 0 && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400">
                            <Globe className="h-3 w-3 mr-1" /> {webSummary.totalPageviews} visitas rastreadas
                        </Badge>
                    )}
                </div>
            </div>

            {/* ═══ Funil + Performance por Canal ═══ */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Funil de Vendas — {selectedChannel === "all" ? "Geral" : selectedChannel}
                        </CardTitle>
                        <CardDescription>
                            {selectedChannel === "all"
                                ? "Calculado a partir de todos os deals do pipeline"
                                : `Filtrado por canal "${selectedChannel}" (${filteredDeals.length} deals)`
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {funnelData.length > 0 && funnelData.some(s => s.value > 0) ? (
                            <>
                                <div className="space-y-3">
                                    {funnelData.map((stage, idx) => {
                                        const prevValue = idx > 0 ? funnelData[idx - 1].value : stage.value;
                                        const conversionRate = prevValue ? ((stage.value / prevValue) * 100).toFixed(1) : "0";
                                        const widthPercent = funnelData[0].value ? (stage.value / funnelData[0].value) * 100 : 0;

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
                                        {funnelData[0].value ? ((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100).toFixed(2) : 0}%
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Filter className="h-10 w-10 text-muted-foreground/30 mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    Nenhum deal encontrado para o funil "{selectedChannel}"
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Troque o filtro ou crie deals com essa fonte no pipeline
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Channel Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Performance por Canal</CardTitle>
                        <CardDescription>Baseado no campo "fonte" de cada deal</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {channelPerf && channelPerf.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Canal</TableHead>
                                        <TableHead className="text-right">Leads</TableHead>
                                        <TableHead className="text-right">Conv.</TableHead>
                                        <TableHead className="text-right">Receita</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {channelPerf.map((channel) => (
                                        <TableRow
                                            key={channel.channel}
                                            className={cn(
                                                "cursor-pointer hover:bg-muted/50 transition-colors",
                                                selectedChannel === channel.channel && "bg-primary/5 border-l-2 border-l-primary"
                                            )}
                                            onClick={() => setSelectedChannel(
                                                selectedChannel === channel.channel ? "all" : channel.channel
                                            )}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {channel.channel}
                                                    {selectedChannel === channel.channel && (
                                                        <Badge variant="secondary" className="text-[8px] h-4 px-1">Ativo</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">{channel.leads}</TableCell>
                                            <TableCell className="text-right">{channel.conversao}%</TableCell>
                                            <TableCell className="text-right">
                                                {channel.revenue > 0 ? formatCurrency(channel.revenue) : "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Globe className="h-10 w-10 text-muted-foreground/30 mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    Dados de canal aparecerão quando deals tiverem o campo "fonte" preenchido
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
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

                {/* Leads Capturados */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Leads Capturados do Site</CardTitle>
                        <CardDescription>Leads recentes via formulários e integrações</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {leads && leads.length > 0 ? (
                            <div className="space-y-2 max-h-[250px] overflow-y-auto">
                                {leads.slice(0, 8).map((lead) => (
                                    <div key={lead.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-sm truncate">{lead.name || lead.email || 'Lead anônimo'}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                <span>{lead.form_source}</span>
                                                {lead.utm_source && (
                                                    <Badge variant="outline" className="text-[9px] h-4 px-1">
                                                        {lead.utm_source}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <Badge
                                            variant={lead.status === 'converted' ? 'default' : lead.status === 'qualified' ? 'secondary' : 'outline'}
                                            className={cn(
                                                "text-[10px] shrink-0",
                                                lead.status === 'converted' && "bg-green-100 text-green-700"
                                            )}
                                        >
                                            {lead.status === 'new' ? 'Novo' :
                                                lead.status === 'contacted' ? 'Contatado' :
                                                    lead.status === 'qualified' ? 'Qualificado' :
                                                        lead.status === 'converted' ? 'Convertido' : 'Descartado'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    Nenhum lead capturado do site ainda
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Configure o snippet JS ou webhooks para começar
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ═══ Integrações com URLs REAIS ═══ */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Webhook className="h-5 w-5" />
                        Integrações Configuradas
                    </CardTitle>
                    <CardDescription>
                        Endpoints reais do Supabase — prontos para conectar com seu site/landing page
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {INTEGRATIONS.map((integration) => {
                            const Icon = integration.icon;
                            return (
                                <div key={integration.name} className="rounded-lg border p-4 space-y-2 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Icon className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{integration.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{integration.description}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400">
                                            Ativo
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono bg-muted/50 rounded px-2 py-1">
                                        <Code2 className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{integration.endpoint}</span>
                                        {integration.method !== "—" && integration.method !== "AUTO" && (
                                            <Badge variant="secondary" className="text-[8px] h-3 px-1 ml-auto shrink-0">
                                                {integration.method}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ═══ JS Snippet com URL REAL ═══ */}
                    <div className="mt-4 rounded-lg border border-dashed p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Code2 className="h-4 w-4 text-primary" />
                                <h4 className="text-sm font-semibold">Snippet JS para seu site</h4>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={handleCopySnippet}
                            >
                                {copiedSnippet ? (
                                    <><Check className="h-3 w-3" /> Copiado!</>
                                ) : (
                                    <><Copy className="h-3 w-3" /> Copiar</>
                                )}
                            </Button>
                        </div>
                        <pre className="text-[10px] bg-muted/50 rounded-lg p-3 overflow-x-auto font-mono leading-relaxed max-h-[200px] overflow-y-auto">
                            {jsSnippet}
                        </pre>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            URL do projeto configurada: <code className="bg-muted px-1 rounded">{SUPABASE_URL}</code>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
