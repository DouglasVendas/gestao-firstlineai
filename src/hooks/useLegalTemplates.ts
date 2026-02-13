
import { useState, useEffect } from "react";
import { CONTRACT_TEMPLATES } from "@/components/legal/ContractTemplates";
import { useToast } from "@/components/ui/use-toast";

export interface Template {
    id: string;
    title: string;
    description: string;
    content: string;
    isCustom?: boolean;
}

const STORAGE_KEY = "saas_compass_custom_templates";

export function useLegalTemplates() {
    const [templates, setTemplates] = useState<Template[]>(CONTRACT_TEMPLATES);
    const { toast } = useToast();

    // Load templates on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const customTemplates = JSON.parse(stored);
                setTemplates([...CONTRACT_TEMPLATES, ...customTemplates]);
            } catch (e) {
                console.error("Failed to parse custom templates", e);
            }
        }
    }, []);

    const addTemplate = (template: Omit<Template, "id" | "isCustom">) => {
        const newTemplate: Template = {
            ...template,
            id: `custom-${Date.now()}`,
            isCustom: true
        };

        const stored = localStorage.getItem(STORAGE_KEY);
        const currentCustom = stored ? JSON.parse(stored) : [];
        const updatedCustom = [...currentCustom, newTemplate];

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustom));
        setTemplates([...CONTRACT_TEMPLATES, ...updatedCustom]);

        toast({
            title: "Template Salvo",
            description: "Seu novo modelo de contrato foi adicionado com sucesso.",
        });
    };

    const removeTemplate = (id: string) => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const currentCustom = JSON.parse(stored);
            const updatedCustom = currentCustom.filter((t: Template) => t.id !== id);

            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustom));
            setTemplates([...CONTRACT_TEMPLATES, ...updatedCustom]);

            toast({
                title: "Template Removido",
                description: "O modelo foi excluído da sua biblioteca.",
            });
        }
    };

    return {
        templates,
        addTemplate,
        removeTemplate
    };
}
