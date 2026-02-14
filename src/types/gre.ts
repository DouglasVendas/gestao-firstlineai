export type GREPillar = {
    id: string;
    title: string;
    order: number;
    created_at: string;
};

export type GREModuleType = 'diagnostic' | 'playbook' | 'metric' | 'model' | 'ai';

export type GREModule = {
    id: string;
    pillar_id: string;
    title: string;
    type: GREModuleType;
    order: number;
    created_at: string;
    status?: 'completed' | 'pending' | 'missing';
    risk_level?: 'critical' | 'high' | 'medium' | 'low';
    risk_description?: string;
    stage?: 'fundacao' | 'validacao' | 'tracao' | 'escala';
    trigger_rule?: string; // Reason/Timing for this module
    initial_content?: string; // HTML Template content
};

export type GREAssessment = {
    id: string;
    user_id: string;
    module_id: string;
    status: 'pending' | 'in_progress' | 'completed';
    data: Record<string, any>;
    created_at: string;
    updated_at: string;
};

export type GRESimulationInput = {
    id: string;
    user_id: string;
    cac: number;
    ltv: number;
    mmr: number;
    churn_rate: number;
    burn_rate: number;
    current_cash: number;
    created_at: string;
};
