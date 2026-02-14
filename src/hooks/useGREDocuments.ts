import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface GREDocument {
    id: string;
    module_id: string;
    content: any; // JSON content from Tiptap
    status: 'draft' | 'completed';
    created_at: string;
    updated_at: string;
}

export function useGREDocuments(moduleId: string | undefined) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: document, isLoading } = useQuery({
        queryKey: ['gre-document', moduleId],
        queryFn: async () => {
            if (!moduleId) return null;
            const { data, error } = await supabase
                .from('gre_documents' as any)
                .select('*')
                .eq('module_id', moduleId)
                .maybeSingle();

            if (error) {
                console.warn('GRE Document fetch error (table may not exist yet):', error.message);
                return null;
            }
            return data as unknown as GREDocument | null;
        },
        enabled: !!moduleId,
    });

    const saveMutation = useMutation({
        mutationFn: async ({ content, status }: { content: any; status?: 'draft' | 'completed' }) => {
            if (!moduleId) throw new Error('No module ID');

            // Check if document exists
            const existing = document;

            if (existing) {
                // Update
                const { data, error } = await supabase
                    .from('gre_documents' as any)
                    .update({ content, status: status || existing.status, updated_at: new Date().toISOString() } as any)
                    .eq('id', existing.id)
                    .select()
                    .single();
                if (error) throw error;
                return data;
            } else {
                // Insert
                const { data, error } = await supabase
                    .from('gre_documents' as any)
                    .insert({ module_id: moduleId, content, status: status || 'draft' } as any)
                    .select()
                    .single();
                if (error) throw error;
                return data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gre-document', moduleId] });
            toast({ title: "Documento Salvo!", description: "Seu progresso foi salvo com sucesso." });
        },
        onError: (error: any) => {
            console.error('Save error:', error);
            toast({ title: "Erro ao Salvar", description: error.message || "Tente novamente.", variant: "destructive" });
        },
    });

    return {
        document,
        isLoading,
        savedContent: document?.content || null,
        isSaved: !!document,
        save: (content: any, status?: 'draft' | 'completed') => saveMutation.mutate({ content, status }),
        isSaving: saveMutation.isPending,
    };
}
