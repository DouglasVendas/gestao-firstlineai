import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
export interface Deal {
    id: string;
    title: string;
    company: string | null;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    value: number;
    stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
    priority: 'cold' | 'warm' | 'hot';
    notes: string | null;
    source: string | null;
    lost_reason: string | null;
    expected_close_date: string | null;
    next_followup_date: string | null;
    next_followup_type: string | null;
    plan_id: string | null;
    billing_cycle: 'monthly' | 'yearly' | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    landing_page_url: string | null;
    created_at: string;
    updated_at: string;
    tags?: DealTag[];
}

export interface DealActivity {
    id: string;
    deal_id: string;
    type: 'call' | 'email' | 'meeting' | 'note' | 'whatsapp' | 'proposal_sent' | 'follow_up' | 'stage_change';
    title: string;
    description: string | null;
    outcome: string | null;
    scheduled_at: string | null;
    completed_at: string | null;
    is_completed: boolean;
    created_at: string;
}

export interface DealTag {
    id: string;
    name: string;
    color: string;
}

// ═══════════════════════════════════════════════════════════
// CONFIGS
// ═══════════════════════════════════════════════════════════
export const STAGE_CONFIG: Record<Deal['stage'], { label: string; color: string; bgColor: string; textOnBg: string }> = {
    lead: { label: 'Lead', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800', textOnBg: 'bg-blue-100 text-blue-700' },
    qualified: { label: 'Qualificado', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800', textOnBg: 'bg-purple-100 text-purple-700' },
    proposal: { label: 'Proposta', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', textOnBg: 'bg-amber-100 text-amber-700' },
    negotiation: { label: 'Negociação', color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800', textOnBg: 'bg-orange-100 text-orange-700' },
    closed_won: { label: 'Ganho ✅', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800', textOnBg: 'bg-green-100 text-green-700' },
    closed_lost: { label: 'Perdido', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800', textOnBg: 'bg-red-100 text-red-700' },
};

export const ACTIVITY_ICONS: Record<DealActivity['type'], { label: string; emoji: string }> = {
    call: { label: 'Ligação', emoji: '📞' },
    email: { label: 'Email', emoji: '📧' },
    meeting: { label: 'Reunião', emoji: '🤝' },
    note: { label: 'Anotação', emoji: '📝' },
    whatsapp: { label: 'WhatsApp', emoji: '💬' },
    proposal_sent: { label: 'Proposta Enviada', emoji: '📄' },
    follow_up: { label: 'Follow-up', emoji: '🔔' },
    stage_change: { label: 'Mudança de Etapa', emoji: '➡️' },
};

export const PRIORITY_CONFIG: Record<Deal['priority'], { label: string; color: string; emoji: string }> = {
    cold: { label: 'Frio', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', emoji: '🧊' },
    warm: { label: 'Morno', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', emoji: '☀️' },
    hot: { label: 'Quente', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', emoji: '🔥' },
};

export const ACTIVE_STAGES: Deal['stage'][] = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

// ═══════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════
const MOCK_TAGS: DealTag[] = [
    { id: 't1', name: 'Upsell', color: '#f59e0b' },
    { id: 't2', name: 'Novo Cliente', color: '#22c55e' },
    { id: 't3', name: 'Enterprise', color: '#6366f1' },
    { id: 't4', name: 'Indicação', color: '#ec4899' },
    { id: 't5', name: 'Renovação', color: '#14b8a6' },
    { id: 't6', name: 'Urgente', color: '#ef4444' },
];

export const MOCK_DEALS: Deal[] = [
    { id: '1', title: 'Contrato Enterprise ABC', company: 'ABC Corp', contact_name: 'João Silva', contact_email: 'joao@abc.com', contact_phone: '5511999998888', value: 15000, stage: 'negotiation', priority: 'hot', notes: 'Reunião marcada para sexta', source: 'Indicação', lost_reason: null, expected_close_date: '2026-03-01', next_followup_date: '2026-02-17', next_followup_type: 'meeting', plan_id: null, billing_cycle: 'monthly', utm_source: null, utm_medium: null, utm_campaign: null, landing_page_url: null, created_at: '2026-02-01T10:00:00Z', updated_at: new Date().toISOString(), tags: [MOCK_TAGS[2], MOCK_TAGS[3]] },
    { id: '2', title: 'Expansão Plano Pro', company: 'Tech Solutions', contact_name: 'Maria Santos', contact_email: 'maria@tech.com', contact_phone: '5511988887777', value: 5000, stage: 'proposal', priority: 'warm', notes: 'Proposta enviada, aguardando retorno', source: 'Inbound', lost_reason: null, expected_close_date: '2026-03-15', next_followup_date: '2026-02-18', next_followup_type: 'call', plan_id: null, billing_cycle: 'monthly', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'saas-compass-brand', landing_page_url: '/landing/demo', created_at: '2026-02-05T14:00:00Z', updated_at: new Date().toISOString(), tags: [MOCK_TAGS[0]] },
    { id: '3', title: 'Novo Cliente - Startup XYZ', company: 'Startup XYZ', contact_name: 'Pedro Lima', contact_email: 'pedro@xyz.com', contact_phone: null, value: 2500, stage: 'lead', priority: 'cold', notes: 'Indicação do Carlos', source: 'Indicação', lost_reason: null, expected_close_date: null, next_followup_date: '2026-02-20', next_followup_type: 'email', plan_id: null, billing_cycle: null, utm_source: null, utm_medium: null, utm_campaign: null, landing_page_url: null, created_at: '2026-02-10T09:00:00Z', updated_at: new Date().toISOString(), tags: [MOCK_TAGS[1], MOCK_TAGS[3]] },
    { id: '4', title: 'Migração Plataforma Delta', company: 'Delta Ltda', contact_name: 'Ana Costa', contact_email: 'ana@delta.com', contact_phone: '5521977776666', value: 8000, stage: 'qualified', priority: 'warm', notes: 'Demonstração agendada', source: 'Website', lost_reason: null, expected_close_date: '2026-02-28', next_followup_date: '2026-02-16', next_followup_type: 'meeting', plan_id: null, billing_cycle: 'monthly', utm_source: 'google', utm_medium: 'organic', utm_campaign: null, landing_page_url: '/precos', created_at: '2026-02-03T11:00:00Z', updated_at: new Date().toISOString(), tags: [] },
    { id: '5', title: 'Licença Anual GammaFi', company: 'GammaFi', contact_name: 'Lucas Rocha', contact_email: 'lucas@gammafi.com', contact_phone: '5531966665555', value: 24000, stage: 'closed_won', priority: 'hot', notes: 'Contrato assinado!', source: 'Outbound', lost_reason: null, expected_close_date: '2026-02-10', next_followup_date: null, next_followup_type: null, plan_id: null, billing_cycle: 'yearly', utm_source: null, utm_medium: null, utm_campaign: null, landing_page_url: null, created_at: '2026-01-15T08:00:00Z', updated_at: new Date().toISOString(), tags: [MOCK_TAGS[2], MOCK_TAGS[4]] },
    { id: '6', title: 'SaaS Pack Omega', company: 'Omega Inc', contact_name: 'Fernanda Alves', contact_email: 'fer@omega.com', contact_phone: null, value: 12000, stage: 'lead', priority: 'warm', notes: 'Primeiro contato via LinkedIn', source: 'LinkedIn', lost_reason: null, expected_close_date: '2026-04-01', next_followup_date: '2026-02-19', next_followup_type: 'whatsapp', plan_id: null, billing_cycle: null, utm_source: 'linkedin', utm_medium: 'social', utm_campaign: 'saas-awareness', landing_page_url: '/landing/linkedin', created_at: '2026-02-12T16:00:00Z', updated_at: new Date().toISOString(), tags: [MOCK_TAGS[1]] },
];

const MOCK_ACTIVITIES: DealActivity[] = [
    { id: 'a1', deal_id: '1', type: 'meeting', title: 'Reunião de descoberta', description: 'Entender as necessidades de automação financeira', outcome: 'Cliente interessado. Enviar proposta até sexta.', scheduled_at: '2026-02-10T14:00:00Z', completed_at: '2026-02-10T15:30:00Z', is_completed: true, created_at: '2026-02-08T10:00:00Z' },
    { id: 'a2', deal_id: '1', type: 'proposal_sent', title: 'Proposta comercial enviada', description: 'Plano Enterprise com desconto de 15%', outcome: null, scheduled_at: null, completed_at: '2026-02-12T10:00:00Z', is_completed: true, created_at: '2026-02-12T10:00:00Z' },
    { id: 'a3', deal_id: '1', type: 'follow_up', title: 'Follow-up pós proposta', description: 'Ligar para saber se tem dúvidas', outcome: null, scheduled_at: '2026-02-17T10:00:00Z', completed_at: null, is_completed: false, created_at: '2026-02-12T10:05:00Z' },
    { id: 'a4', deal_id: '2', type: 'call', title: 'Qualificação por telefone', description: 'Confirmar fit do produto', outcome: 'Qualificado. Dor clara: falta de DRE automatizado', scheduled_at: null, completed_at: '2026-02-07T11:00:00Z', is_completed: true, created_at: '2026-02-07T11:00:00Z' },
    { id: 'a5', deal_id: '2', type: 'email', title: 'Envio de case de sucesso', description: 'Enviar case da empresa similar no mesmo segmento', outcome: null, scheduled_at: '2026-02-18T09:00:00Z', completed_at: null, is_completed: false, created_at: '2026-02-08T09:00:00Z' },
    { id: 'a6', deal_id: '4', type: 'meeting', title: 'Demo agendada', description: 'Mostrar dashboards e importação de dados', outcome: null, scheduled_at: '2026-02-16T15:00:00Z', completed_at: null, is_completed: false, created_at: '2026-02-13T10:00:00Z' },
];

// Mutable local copy of deals for mock mode — survives refetches
let localMockDeals: Deal[] = [...MOCK_DEALS];

// ═══════════════════════════════════════════════════════════
// DEALS HOOK
// ═══════════════════════════════════════════════════════════
export function useDeals() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const usingMockRef = useRef(false);

    const { data: deals = [], isLoading } = useQuery({
        queryKey: ['deals'],
        queryFn: async () => {
            // If already in mock mode, return current local state (don't hit Supabase again)
            if (usingMockRef.current) {
                return localMockDeals;
            }

            // Try fetching deals with tags join
            const { data, error } = await supabase
                .from('deals' as any)
                .select('*, deal_tag_links(deal_tags(*))')
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('[useDeals] Tabela deals não encontrada, usando mock:', error.message);
                usingMockRef.current = true;
                return localMockDeals;
            }

            // Transform the nested join into a flat tags array
            const dealsWithTags = (data || []).map((d: any) => ({
                ...d,
                tags: (d.deal_tag_links || []).map((link: any) => link.deal_tags).filter(Boolean),
            }));

            if (dealsWithTags.length === 0) {
                usingMockRef.current = true;
                return localMockDeals;
            }

            usingMockRef.current = false;
            return dealsWithTags as Deal[];
        },
        refetchOnWindowFocus: false,
        staleTime: usingMockRef.current ? Infinity : 30000,
    });

    const createDeal = useMutation({
        mutationFn: async (deal: Partial<Deal>) => {
            if (usingMockRef.current) {
                // Mock mode: add to local mutable array + cache
                const mockDeal = { ...deal, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), tags: [] } as Deal;
                localMockDeals = [mockDeal, ...localMockDeals];
                queryClient.setQueryData(['deals'], [...localMockDeals]);
                return mockDeal;
            }
            const { tags, ...cleanDeal } = deal as any;
            const { data, error } = await supabase.from('deals' as any).insert(cleanDeal as any).select().single();
            if (error) throw error; return data;
        },
        onSuccess: (_, __, ___) => { if (!usingMockRef.current) queryClient.invalidateQueries({ queryKey: ['deals'] }); toast({ title: "Negócio Criado!" }); },
        onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const updateDeal = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Deal> & { id: string }) => {
            const { tags, ...cleanUpdates } = updates as any;

            if (usingMockRef.current) {
                // Mock mode: update local mutable array + cache
                localMockDeals = localMockDeals.map(d =>
                    d.id === id ? { ...d, ...cleanUpdates, ...(tags !== undefined ? { tags } : {}), updated_at: new Date().toISOString() } : d
                );
                queryClient.setQueryData(['deals'], [...localMockDeals]);
                return null;
            }

            // If tags were provided, sync them via deal_tag_links
            if (tags !== undefined) {
                await supabase.from('deal_tag_links' as any).delete().eq('deal_id', id);
                if (tags.length > 0) {
                    const links = (tags as DealTag[]).map(t => ({ deal_id: id, tag_id: t.id }));
                    await supabase.from('deal_tag_links' as any).insert(links as any);
                }
            }

            if (Object.keys(cleanUpdates).length > 0) {
                const { data, error } = await supabase.from('deals' as any)
                    .update({ ...cleanUpdates, updated_at: new Date().toISOString() } as any)
                    .eq('id', id).select().single();
                if (error) throw error;
                return data;
            }
            return null;
        },
        onSuccess: () => { if (!usingMockRef.current) queryClient.invalidateQueries({ queryKey: ['deals'] }); },
        onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const deleteDeal = useMutation({
        mutationFn: async (id: string) => {
            if (usingMockRef.current) {
                localMockDeals = localMockDeals.filter(d => d.id !== id);
                queryClient.setQueryData(['deals'], [...localMockDeals]);
                return;
            }
            const { error } = await supabase.from('deals' as any).delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => { if (!usingMockRef.current) queryClient.invalidateQueries({ queryKey: ['deals'] }); toast({ title: "Negócio Removido" }); },
    });

    const pipelineValue = deals.filter(d => d.stage !== 'closed_lost').reduce((s, d) => s + d.value, 0);
    const wonValue = deals.filter(d => d.stage === 'closed_won').reduce((s, d) => s + d.value, 0);
    const activeDeals = deals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage)).length;
    const hotDeals = deals.filter(d => d.priority === 'hot' && !['closed_won', 'closed_lost'].includes(d.stage)).length;

    return { deals, isLoading, createDeal: createDeal.mutate, updateDeal: updateDeal.mutate, deleteDeal: deleteDeal.mutate, pipelineValue, wonValue, activeDeals, hotDeals, isCreating: createDeal.isPending, usingMock: usingMockRef.current };
}

// ═══════════════════════════════════════════════════════════
// ACTIVITIES HOOK
// ═══════════════════════════════════════════════════════════
export function useDealActivities(dealId: string | null) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: activities = [], isLoading } = useQuery({
        queryKey: ['deal-activities', dealId],
        queryFn: async () => {
            if (!dealId) return [];
            const { data, error } = await supabase.from('deal_activities' as any).select('*').eq('deal_id', dealId).order('created_at', { ascending: false });
            if (error || !data || data.length === 0) return MOCK_ACTIVITIES.filter(a => a.deal_id === dealId);
            return data as unknown as DealActivity[];
        },
        enabled: !!dealId,
    });

    const addActivity = useMutation({
        mutationFn: async (activity: Omit<DealActivity, 'id' | 'created_at'>) => {
            const { data, error } = await supabase.from('deal_activities' as any).insert(activity as any).select().single();
            if (error) throw error; return data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deal-activities', dealId] }); toast({ title: "Atividade Registrada!" }); },
        onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const completeActivity = useMutation({
        mutationFn: async ({ id, outcome }: { id: string; outcome?: string }) => {
            const { error } = await supabase.from('deal_activities' as any)
                .update({ is_completed: true, completed_at: new Date().toISOString(), outcome } as any).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deal-activities', dealId] }); toast({ title: "Atividade Concluída!" }); },
        onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const deleteActivity = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('deal_activities' as any).delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deal-activities', dealId] }); toast({ title: "Atividade Removida" }); },
        onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const updateActivity = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<DealActivity> & { id: string }) => {
            const { error } = await supabase.from('deal_activities' as any)
                .update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deal-activities', dealId] }); toast({ title: "Atividade Atualizada!" }); },
        onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const pendingActivities = activities.filter(a => !a.is_completed);
    const completedActivities = activities.filter(a => a.is_completed);

    return { activities, isLoading, addActivity: addActivity.mutate, updateActivity: updateActivity.mutate, completeActivity: completeActivity.mutate, deleteActivity: deleteActivity.mutate, pendingActivities, completedActivities, isAdding: addActivity.isPending };
}

// ═══════════════════════════════════════════════════════════
// TAGS HOOK
// ═══════════════════════════════════════════════════════════
export function useDealTags() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: allTags = MOCK_TAGS } = useQuery({
        queryKey: ['deal-tags'],
        queryFn: async () => {
            const { data, error } = await supabase.from('deal_tags' as any).select('*').order('name');
            if (error || !data || data.length === 0) return MOCK_TAGS;
            return data as unknown as DealTag[];
        },
    });

    const createTag = useMutation({
        mutationFn: async ({ name, color }: { name: string; color: string }) => {
            const { data, error } = await supabase.from('deal_tags' as any).insert({ name, color } as any).select().single();
            if (error) throw error; return data as unknown as DealTag;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deal-tags'] }); toast({ title: "Tag Criada!" }); },
        onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const deleteTag = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('deal_tags' as any).delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deal-tags'] }); },
    });

    return { allTags, createTag: createTag.mutate, deleteTag: deleteTag.mutate, isCreatingTag: createTag.isPending };
}
