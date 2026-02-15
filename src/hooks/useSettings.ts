import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type BusinessModel = 'B2B_SAAS' | 'B2B_SERVICE';

export interface SaasSettings {
    id?: string;
    company_name: string;
    logo_url?: string;
    primary_color: string;
    currency: string;
    business_model: BusinessModel;
    mrr_goal: number;
    setup_completed: boolean;
}

interface SettingsState {
    settings: SaasSettings;
    isLoading: boolean;
    updateSettings: (newSettings: Partial<SaasSettings>) => Promise<void>;
    completeSetup: () => Promise<void>;
    fetchSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: SaasSettings = {
    company_name: 'Minha Empresa SaaS',
    primary_color: '#0f172a',
    currency: 'BRL',
    business_model: 'B2B_SAAS',
    mrr_goal: 100000,
    setup_completed: false,
};

export const useSettings = create<SettingsState>()(
    persist(
        (set, get) => ({
            settings: DEFAULT_SETTINGS,
            isLoading: true,

            fetchSettings: async () => {
                set({ isLoading: true });
                try {
                    // Tenta buscar do Supabase
                    const { data, error } = await supabase
                        .from('saas_settings' as any)
                        .select('*')
                        .single();

                    if (error) {
                        // Se der erro (ex: tabela não existe), usa o estado local persistido ou default
                        console.warn('Supabase settings not found, using local fallback:', error.message);
                        set({ isLoading: false }); // Mantém o que já está no strorage ou default
                        return;
                    }

                    if (data) {
                        set({ settings: data as SaasSettings, isLoading: false });
                    }
                } catch (error) {
                    console.error('Error fetching settings:', error);
                    set({ isLoading: false });
                }
            },

            updateSettings: async (newSettings) => {
                const currentSettings = get().settings;
                const updated = { ...currentSettings, ...newSettings };

                // Otimista update no estado local
                set({ settings: updated });

                try {
                    // Tenta salvar no Supabase
                    const { error } = await supabase
                        .from('saas_settings' as any)
                        .upsert({
                            ...updated,
                            updated_at: new Date().toISOString(),
                        }, { onConflict: 'id' });

                    if (error) throw error;

                } catch (error) {
                    console.warn('Failed to sync settings with Supabase, saved locally only.', error);
                    // Não reverte o estado local, pois queremos que funcione offline/sem tabela
                    toast.success('Configurações salvas localmente (Supabase indisponível)');
                }
            },

            completeSetup: async () => {
                await get().updateSettings({ setup_completed: true });
                toast.success('Setup concluído com sucesso! 🚀');
            },
        }),
        {
            name: 'saas-settings-storage', // unique name for localStorage
        }
    )
);
