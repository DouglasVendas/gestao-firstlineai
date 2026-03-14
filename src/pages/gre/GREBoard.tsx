
import React from "react";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GREPillar } from "@/types/gre";
import { LayoutDashboard, TrendingUp, Users, Wallet, BrainCircuit, FileText, FolderPlus, Search, HelpCircle, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProcessAuditList } from "@/components/gre/ProcessAuditList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useGREScore } from "@/hooks/useGREScore";
import { FALLBACK_PILLARS } from "@/data/greSimulator";

const PILLAR_ICONS: Record<string, any> = {
    'Oferta & Posicionamento': LayoutDashboard,
    'Aquisição & Comercial': TrendingUp,
    'Entrega & Retenção': Users,
    'Financeiro & Unit Economics': Wallet,
    'Inteligência & Escala': BrainCircuit,
};

export default function GREBoard() {
    const { setPageTitle } = usePageTitle();
    const navigate = useNavigate();
    const { overallScore, completedModules, totalModules } = useGREScore();

    React.useEffect(() => {
        setPageTitle("GRE - Gestão Racional de Escala", "Blinde sua empresa contra falhas de processo e riscos de litígio");
    }, [setPageTitle]);

    const { data: pillars, isLoading } = useQuery({
        queryKey: ['gre-pillars'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('gre_pillars' as any)
                .select('*')
                .order('order');

            // If error or empty, return fallback (unless it's a real error we want to show, but for MVP we fallback)
            if (error || !data || data.length === 0) return FALLBACK_PILLARS;

            return data as unknown as GREPillar[];
        }
    });

    return (
        <>
            <div className="space-y-8 animate-fade-in pb-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">GRE - Gestão Racional de Escala</h1>
                        <p className="text-muted-foreground mt-1">
                            Blinde sua empresa contra falhas de processo e riscos de litígio.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { }}>
                            <HelpCircle className="mr-2 h-4 w-4" /> Ajuda
                        </Button>
                        <Button className="bg-primary hover:bg-primary/90">
                            <FolderPlus className="mr-2 h-4 w-4" /> Novo Documento Padrão
                        </Button>
                    </div>
                </div>

                {/* Risk / Maturity Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Nível de Blindagem</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{overallScore}%</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {overallScore < 50 ? 'Alta Vulnerabilidade' : overallScore < 80 ? 'Proteção Moderada' : 'Empresa Blindada'}
                            </p>
                            <Progress
                                value={overallScore}
                                className={overallScore < 50 ? "h-2 mt-2 bg-destructive/20" : "h-2 mt-2"}
                                indicatorClassName={overallScore < 50 ? "bg-destructive" : ""}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Processos Mapeados</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{completedModules}/{totalModules}</div>
                            <p className="text-xs text-muted-foreground mt-1">Módulos Essenciais</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Documentos na Central</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">1</div>
                            <p className="text-xs text-muted-foreground mt-1">Onboarding & Padrões</p>
                        </CardContent>
                    </Card>
                </div>

                {/* 5 Pillars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {isLoading ? (
                        Array(5).fill(0).map((_, i) => (
                            <Card key={i} className="h-32 animate-pulse bg-muted/50" />
                        ))
                    ) : (
                        pillars?.map((pillar) => {
                            const Icon = PILLAR_ICONS[pillar.title] || LayoutDashboard;
                            return (
                                <Card
                                    key={pillar.id}
                                    className="cursor-pointer hover:border-primary/50 transition-colors group relative overflow-hidden"
                                    onClick={() => navigate(`/gre/pillar/${pillar.id}`)}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <Badge variant="outline" className="mb-2 bg-background/50 backdrop-blur">{pillar.order}</Badge>
                                            <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <CardTitle className="text-sm font-medium leading-tight">{pillar.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <TrendingUp className="h-3 w-3" />
                                            <span>0% Concluído</span>
                                        </div>
                                        <Progress value={0} className="h-1 mt-2 bg-muted/50" />
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Process Audit List (Focus on Risk) */}
                    <div className="lg:col-span-2 space-y-6">
                        <ProcessAuditList />
                    </div>

                    {/* Knowledge Hub / Quick Access */}
                    <div className="space-y-6">
                        <Card className="bg-muted/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    Central de Conhecimento
                                </CardTitle>
                                <CardDescription>Acesso rápido aos padrões da empresa.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Buscar documento..." className="pl-8" />
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Populares</h4>
                                    <Button variant="ghost" className="w-full justify-start h-auto py-2 px-2 text-sm font-normal">
                                        <FileText className="mr-2 h-4 w-4 text-blue-500" />
                                        Acordo de Sócios (Modelo)
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start h-auto py-2 px-2 text-sm font-normal">
                                        <FileText className="mr-2 h-4 w-4 text-purple-500" />
                                        Organograma & Cargos
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start h-auto py-2 px-2 text-sm font-normal">
                                        <FileText className="mr-2 h-4 w-4 text-orange-500" />
                                        Código de Cultura
                                    </Button>
                                </div>

                                <div className="pt-4 border-t">
                                    <Button variant="secondary" className="w-full">
                                        Ver Todos os Documentos
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Stats or Tips */}
                        <Card className="border-primary/20 bg-primary/5">
                            <CardContent className="p-6">
                                <h3 className="font-semibold mb-2">Dica de Blindagem</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Litígios entre sócios são a causa #1 de falência em empresas saudáveis. Formalize seu "Acordo de Sócios" hoje.
                                </p>
                                <Button size="sm" variant="outline" className="w-full bg-background" onClick={() => navigate('/gre')}>
                                    Formalizar Acordo
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
