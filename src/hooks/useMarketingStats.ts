import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MOCK_DEALS } from "@/hooks/useDeals";

export interface FunnelData {
    visitors: number;
    leads: number;
    mql: number;
    sql: number;
    opportunities: number;
    customers: number;
}

export interface ChannelPerformance {
    channel: string;
    leads: number;
    conversions: number;
    conversao: number;
    revenue: number;
    cpl: number;
    roi: number;
}

export interface LeadCapture {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    form_source: string;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    status: string;
    deal_id: string | null;
    created_at: string;
}

// ═══════════════════════════════════════════════════════════
// Hook principal: Calcula funil DINAMICAMENTE a partir dos deals reais
// ═══════════════════════════════════════════════════════════
export const useMarketingStats = () => {
    return useQuery({
        queryKey: ["marketing_stats"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("marketing_stats")
                .select("*")
                .order("month", { ascending: true });

            if (error) throw error;
            return data;
        },
    });
};


// ═══════════════════════════════════════════════════════════
// Hook: Funil calculado dinamicamente dos deals em tempo real
// ═══════════════════════════════════════════════════════════
export function calculateFunnelFromDeals(allDeals: any[]) {
    const activePlusWon = allDeals.filter(d => d.stage !== 'closed_lost');

    const funnel: FunnelData = {
        visitors: activePlusWon.length * 10, // estimativa — será substituída por tracking real
        leads: allDeals.length,
        mql: allDeals.filter(d => ['qualified', 'proposal', 'negotiation', 'closed_won'].includes(d.stage)).length,
        sql: allDeals.filter(d => ['proposal', 'negotiation', 'closed_won'].includes(d.stage)).length,
        opportunities: allDeals.filter(d => ['negotiation', 'closed_won'].includes(d.stage)).length,
        customers: allDeals.filter(d => d.stage === 'closed_won').length,
    };

    // Performance por canal baseada no source dos deals
    const sourceMap: Record<string, { leads: number; conversions: number; revenue: number }> = {};
    allDeals.forEach(d => {
        const src = d.source || d.utm_source || 'Direto';
        if (!sourceMap[src]) sourceMap[src] = { leads: 0, conversions: 0, revenue: 0 };
        sourceMap[src].leads++;
        if (d.stage === 'closed_won') {
            sourceMap[src].conversions++;
            sourceMap[src].revenue += d.value || 0;
        }
    });

    const channelPerformance: ChannelPerformance[] = Object.entries(sourceMap).map(([channel, stats]) => ({
        channel,
        leads: stats.leads,
        conversions: stats.conversions,
        conversao: stats.leads > 0 ? Math.round((stats.conversions / stats.leads) * 1000) / 10 : 0,
        revenue: stats.revenue,
        cpl: 0,
        roi: 0,
    })).sort((a, b) => b.leads - a.leads);

    return { funnel, channelPerformance };
}

const INITIAL_FUNNEL_DATA = {
    funnel: {
        visitors: 0,
        leads: 0,
        mql: 0,
        sql: 0,
        opportunities: 0,
        customers: 0
    },
    channelPerformance: [] as ChannelPerformance[],
    allDeals: MOCK_DEALS
};

export const useDynamicFunnel = () => {
    return useQuery({
        queryKey: ["dynamic_funnel"],
        queryFn: async () => {
            // Tentar buscar deals do Supabase (mesma query do CRM pipeline)
            const { data: deals, error: dealsError } = await supabase
                .from("deals" as any)
                .select("*")
                .order("created_at", { ascending: false });

            // Se Supabase falhar, usar mesmos MOCK_DEALS do pipeline CRM
            const allDeals = (dealsError || !deals || deals.length === 0)
                ? MOCK_DEALS
                : (deals as any[]);

            // Buscar visitantes do web_events (tabela pode não existir)
            let visitorCount = 0;
            try {
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);

                const { count, error } = await supabase
                    .from("web_events" as any)
                    .select("visitor_id", { count: "exact", head: true })
                    .eq("event_type", "pageview")
                    .gte("created_at", startOfMonth.toISOString());

                if (!error && count) visitorCount = count;
            } catch {
                // web_events tabela ainda não existe
            }

            const result = calculateFunnelFromDeals(allDeals);

            // Atualizar visitantes com dados reais de tracking (se disponíveis)
            if (visitorCount > 0) {
                result.funnel.visitors = visitorCount;
            }

            // Retornar também os deals raw para filtro no frontend
            return { ...result, allDeals };
        },
        retry: false,
        initialData: INITIAL_FUNNEL_DATA,
    });
};

// ═══════════════════════════════════════════════════════════
// Hook: Leads capturados do site
// ═══════════════════════════════════════════════════════════
export const useLeadCaptures = () => {
    return useQuery({
        queryKey: ["lead_captures"],
        queryFn: async (): Promise<LeadCapture[]> => {
            try {
                const { data, error } = await supabase
                    .from("lead_captures" as any)
                    .select("*")
                    .order("created_at", { ascending: false })
                    .limit(50);

                if (error || !data) return [];
                return data as unknown as LeadCapture[];
            } catch {
                return [];
            }
        },
        retry: false,
        initialData: [],
    });
};

// ═══════════════════════════════════════════════════════════
// Hook: Web events / visitas do site
// ═══════════════════════════════════════════════════════════
const EMPTY_WEB_SUMMARY = { totalPageviews: 0, totalForms: 0, topSources: [] as { source: string; count: number }[] };

export const useWebEvents = () => {
    return useQuery({
        queryKey: ["web_events_summary"],
        queryFn: async () => {
            try {
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);

                const { count: totalPageviews, error: pvErr } = await supabase
                    .from("web_events" as any)
                    .select("*", { count: "exact", head: true })
                    .eq("event_type", "pageview")
                    .gte("created_at", startOfMonth.toISOString());

                // Se a primeira query 404, a tabela não existe — retornar vazio
                if (pvErr) return EMPTY_WEB_SUMMARY;

                const { count: totalForms } = await supabase
                    .from("web_events" as any)
                    .select("*", { count: "exact", head: true })
                    .eq("event_type", "form_submit")
                    .gte("created_at", startOfMonth.toISOString());

                const { data: utmData } = await supabase
                    .from("web_events" as any)
                    .select("utm_source, utm_medium, utm_campaign")
                    .not("utm_source", "is", null)
                    .gte("created_at", startOfMonth.toISOString())
                    .limit(100);

                const utmSources: Record<string, number> = {};
                (utmData || []).forEach((e: any) => {
                    const src = e.utm_source || 'unknown';
                    utmSources[src] = (utmSources[src] || 0) + 1;
                });

                return {
                    totalPageviews: totalPageviews || 0,
                    totalForms: totalForms || 0,
                    topSources: Object.entries(utmSources)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([source, count]) => ({ source, count })),
                };
            } catch {
                return EMPTY_WEB_SUMMARY;
            }
        },
        retry: false,
        initialData: EMPTY_WEB_SUMMARY,
    });
};
