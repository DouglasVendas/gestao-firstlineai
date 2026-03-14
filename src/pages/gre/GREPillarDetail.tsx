import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GREPillar, GREModule } from "@/types/gre";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, CheckCircle2, PlayCircle, BarChart3, Database, Bot, ChevronRight, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ModuleRouter } from "@/components/gre/module/ModuleRouter";
import { cn } from "@/lib/utils";
import { FALLBACK_PILLARS, MOCK_MODULES } from "@/data/greSimulator";

const TYPE_ICONS: Record<string, any> = {
    'diagnostic': CheckCircle2,
    'playbook': PlayCircle,
    'metric': BarChart3,
    'model': FileText,
    'ai': Bot,
};

export default function GREPillarDetail() {
    const { setPageTitle } = usePageTitle();
    const { id } = useParams();
    const navigate = useNavigate();
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

    const { data: pillar } = useQuery({
        queryKey: ['gre-pillar', id],
        queryFn: async () => {
            // Fallback for pillar details
            const fallbackPillar = FALLBACK_PILLARS.find(p => p.id === id);
            if (fallbackPillar) return fallbackPillar;

            const { data, error } = await supabase
                .from('gre_pillars' as any)
                .select('*')
                .eq('id', id)
                .single();

            if (error) return FALLBACK_PILLARS[0];
            return data as unknown as GREPillar;
        },
        enabled: !!id
    });

    const { data: modules, isLoading } = useQuery({
        queryKey: ['gre-modules', id],
        queryFn: async () => {
            // Fallback for modules (Shared Data)
            if (id && MOCK_MODULES[id]) return MOCK_MODULES[id];

            const { data, error } = await supabase
                .from('gre_modules' as any)
                .select('*')
                .eq('pillar_id', id)
                .order('order');

            if (error || !data) return [];
            return data as unknown as GREModule[];
        },
        enabled: !!id
    });

    if (!pillar) return null;

    const selectedModule = modules?.find(m => m.id === selectedModuleId);

    React.useEffect(() => {
        setPageTitle(pillar.title, "GRE Operating System");
    }, [pillar.title, setPageTitle]);

    return (
        <>
            <div className="h-[calc(100vh-10rem)] flex flex-col space-y-4 animate-fade-in overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-4 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/gre')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            {pillar.title}
                            {selectedModule && (
                                <>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-primary">{selectedModule.title}</span>
                                </>
                            )}
                        </h1>
                        <p className="text-muted-foreground text-xs">GRE Operating System</p>
                    </div>
                </div>

                <div className="flex flex-1 gap-6 overflow-hidden">
                    {/* Module Sidebar */}
                    <div className={cn("w-full md:w-1/3 lg:w-1/4 space-y-2 overflow-y-auto pr-2", selectedModuleId ? "hidden md:block" : "block")}>
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <Card key={i} className="animate-pulse bg-muted/50 h-20" />
                            ))
                        ) : (
                            modules?.map((module) => {
                                const Icon = TYPE_ICONS[module.type] || Database;
                                const isSelected = selectedModuleId === module.id;

                                // Risk Indicator
                                const hasRisk = module.status !== 'completed' && (module.risk_level === 'critical' || module.risk_level === 'high');
                                const riskColor = module.risk_level === 'critical' ? 'text-destructive' : 'text-orange-500';

                                return (
                                    <Card
                                        key={module.id}
                                        className={cn(
                                            "cursor-pointer transition-all hover:border-primary/50 relative overflow-hidden",
                                            isSelected ? "border-primary bg-primary/5 shadow-md" : ""
                                        )}
                                        onClick={() => setSelectedModuleId(module.id)}
                                    >
                                        {hasRisk && (
                                            <div className="absolute top-0 right-0 p-1">
                                                <AlertCircle className={cn("h-3 w-3", riskColor)} />
                                            </div>
                                        )}
                                        <CardContent className="flex items-center gap-3 p-4">
                                            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                                isSelected ? "bg-primary text-primary-foreground" :
                                                    module.status === 'completed' ? "bg-green-100 text-green-600 dark:bg-green-900/20" :
                                                        "bg-primary/10 text-primary")}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-medium text-sm truncate">{module.title}</h3>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 capitalize">{module.type}</Badge>
                                                    {isSelected && <ChevronRight className="h-4 w-4 text-primary animate-in slide-in-from-left-2" />}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })
                        )}
                    </div>

                    {/* Content Area */}
                    <div className={cn("flex-1 bg-background border rounded-lg shadow-sm overflow-hidden flex flex-col", !selectedModuleId ? "hidden md:flex" : "flex")}>
                        {selectedModule ? (
                            <>
                                {/* Handover for mobile to go back */}
                                <div className="md:hidden border-b p-2">
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedModuleId(null)}>
                                        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Lista
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="max-w-4xl mx-auto h-full">
                                        <ModuleRouter module={selectedModule} />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <Database className="h-8 w-8 opacity-50" />
                                </div>
                                <h3 className="text-lg font-medium">Selecione um Módulo</h3>
                                <p className="max-w-xs mx-auto mt-2">Escolha uma das ferramentas à esquerda para iniciar o trabalho neste pilar.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
