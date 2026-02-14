import { GREModule, GREPillar } from "@/types/gre";
import {
    TEMPLATE_ACORDO_SOCIOS,
    TEMPLATE_ORGANOGRAMA,
    TEMPLATE_PLAYBOOK_VENDAS,
    TEMPLATE_CODIGO_CULTURA,
    TEMPLATE_PROPOSTA
} from "./templates";

export const FALLBACK_PILLARS: GREPillar[] = [
    { id: '1', title: 'Oferta & Posicionamento', order: 1, created_at: new Date().toISOString() },
    { id: '2', title: 'Aquisição & Comercial', order: 2, created_at: new Date().toISOString() },
    { id: '3', title: 'Entrega & Retenção', order: 3, created_at: new Date().toISOString() },
    { id: '4', title: 'Financeiro & Unit Economics', order: 4, created_at: new Date().toISOString() },
    { id: '5', title: 'Inteligência & Escala', order: 5, created_at: new Date().toISOString() },
];

export const MOCK_MODULES: Record<string, GREModule[]> = {
    '1': [
        { id: '1-1', pillar_id: '1', title: 'Diagnóstico de Oferta', type: 'diagnostic', order: 1, created_at: '', status: 'completed', risk_level: 'low', stage: 'fundacao', trigger_rule: 'Necessário para definir o produto inicial' },
        { id: '1-2', pillar_id: '1', title: 'Playbook de Posicionamento', type: 'playbook', order: 2, created_at: '', status: 'missing', risk_level: 'high', risk_description: 'Posicionamento confuso gera CAC alto', stage: 'validacao', trigger_rule: 'Quando vendas travam ou CAC sobe' },
        { id: '1-3', pillar_id: '1', title: 'Métricas de Conversão', type: 'metric', order: 3, created_at: '', status: 'pending', risk_level: 'medium', stage: 'tracao' },
        { id: '1-4', pillar_id: '1', title: 'Modelo de Proposta', type: 'model', order: 4, created_at: '', status: 'missing', risk_level: 'high', risk_description: 'Propostas ruins perdem vendas', stage: 'fundacao', trigger_rule: 'Antes de enviar a primeira proposta', initial_content: TEMPLATE_PROPOSTA },
        { id: '1-5', pillar_id: '1', title: 'Auditor de ICP', type: 'ai', order: 5, created_at: '', status: 'pending', risk_level: 'low', stage: 'validacao' },
    ],
    '2': [ // Aquisição
        { id: '2-1', pillar_id: '2', title: 'Diagnóstico Comercial', type: 'diagnostic', order: 1, created_at: '', status: 'pending', risk_level: 'medium', stage: 'validacao' },
        { id: '2-2', pillar_id: '2', title: 'Playbook de Vendas', type: 'playbook', order: 2, created_at: '', status: 'missing', risk_level: 'high', risk_description: 'Perda de receita por falta de processo', stage: 'validacao', trigger_rule: 'Ao contratar 1º Vendedor/SDR', initial_content: TEMPLATE_PLAYBOOK_VENDAS },
        { id: '2-3', pillar_id: '2', title: 'Scripts de Vendas', type: 'model', order: 3, created_at: '', status: 'missing', risk_level: 'medium', risk_description: 'Conversão baixa', stage: 'validacao', trigger_rule: 'Para padronizar discurso' },
        { id: '2-4', pillar_id: '2', title: 'Contrato Padrão de Clientes', type: 'model', order: 4, created_at: '', status: 'missing', risk_level: 'high', risk_description: 'Risco de inadimplência e cancelamento', stage: 'fundacao', trigger_rule: 'Antes do primeiro fechamento', initial_content: TEMPLATE_PROPOSTA },
        { id: '2-5', pillar_id: '2', title: 'IA de Objeções', type: 'ai', order: 5, created_at: '', status: 'pending', risk_level: 'low', stage: 'tracao' },
    ],
    '3': [ // Entrega & Time
        { id: '3-1', pillar_id: '3', title: 'Diagnóstico de Entrega', type: 'diagnostic', order: 1, created_at: '', status: 'pending', risk_level: 'medium', stage: 'validacao' },
        { id: '3-2', pillar_id: '3', title: 'Manual de Onboarding (Clientes)', type: 'playbook', order: 2, created_at: '', status: 'pending', risk_level: 'high', risk_description: 'Churn alto no primeiro mês', stage: 'validacao', trigger_rule: 'A partir de 5 clientes ativos' },
        { id: '3-3', pillar_id: '3', title: 'Organograma & Responsabilidades', type: 'model', order: 3, created_at: '', status: 'missing', risk_level: 'high', risk_description: 'Conflitos de gestão e retrabalho', stage: 'fundacao', trigger_rule: 'Dia 1: Definir quem faz o que', initial_content: TEMPLATE_ORGANOGRAMA },
        { id: '3-4', pillar_id: '3', title: 'Código de Cultura', type: 'playbook', order: 4, created_at: '', status: 'missing', risk_level: 'medium', risk_description: 'Desalinhamento do time', stage: 'tracao', trigger_rule: 'A partir de 5 funcionários', initial_content: TEMPLATE_CODIGO_CULTURA },
        { id: '3-5', pillar_id: '3', title: 'Contrato de Prestação de Serviços (Time)', type: 'model', order: 5, created_at: '', status: 'missing', risk_level: 'critical', risk_description: 'Passivo Trabalhista', stage: 'fundacao', trigger_rule: 'Na primeira contratação' },
    ],
    '4': [ // Financeiro
        { id: '4-1', pillar_id: '4', title: 'Diagnóstico Financeiro', type: 'diagnostic', order: 1, created_at: '', status: 'pending', risk_level: 'high', stage: 'fundacao' },
        { id: '4-2', pillar_id: '4', title: 'Política de Reembolso', type: 'model', order: 2, created_at: '', status: 'missing', risk_level: 'low', risk_description: 'Descontrole de gastos', stage: 'tracao', trigger_rule: 'A partir de 3 funcionários com gastos' },
        { id: '4-3', pillar_id: '4', title: 'DRE Gerencial', type: 'metric', order: 3, created_at: '', status: 'pending', risk_level: 'high', stage: 'validacao' },
        { id: '4-4', pillar_id: '4', title: 'Fluxo de Caixa Projetado', type: 'metric', order: 4, created_at: '', status: 'pending', risk_level: 'high', stage: 'fundacao' },
        { id: '4-5', pillar_id: '4', title: 'Auditor Fiscal (IA)', type: 'ai', order: 5, created_at: '', status: 'pending', risk_level: 'medium', stage: 'escala' },
    ],
    '5': [ // Inteligência & Governança (Expandido)
        { id: '5-1', pillar_id: '5', title: 'Diagnóstico de Governança', type: 'diagnostic', order: 1, created_at: '', status: 'pending', risk_level: 'medium', stage: 'fundacao' },
        { id: '5-2', pillar_id: '5', title: 'Acordo de Sócios (Memorando)', type: 'model', order: 2, created_at: '', status: 'missing', risk_level: 'critical', risk_description: 'Alto Risco de Litígio Societário', stage: 'fundacao', trigger_rule: 'Imediato se houver +1 sócio', initial_content: TEMPLATE_ACORDO_SOCIOS },
        { id: '5-3', pillar_id: '5', title: 'Contrato de Vesting', type: 'model', order: 3, created_at: '', status: 'missing', risk_level: 'high', risk_description: 'Disputa de Equity', stage: 'tracao', trigger_rule: 'Ao dar equity para funcionário chave' },
        { id: '5-4', pillar_id: '5', title: 'Matriz de Riscos', type: 'playbook', order: 4, created_at: '', status: 'pending', risk_level: 'medium', stage: 'escala' },
        { id: '5-5', pillar_id: '5', title: 'Conselheiro IA', type: 'ai', order: 5, created_at: '', status: 'pending', risk_level: 'low', stage: 'fundacao' },
    ]
};

// Flattened list for search/audit
export const ALL_MODULES = Object.values(MOCK_MODULES).flat();
