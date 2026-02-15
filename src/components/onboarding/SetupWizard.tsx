import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { useSettings, BusinessModel } from "@/hooks/useSettings";
import { Building2, Palette, Target, Rocket, Briefcase, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export function SetupWizard() {
    const { settings, updateSettings, completeSetup, fetchSettings, isLoading } = useSettings();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);

    // Form state local
    const [formData, setFormData] = useState({
        company_name: "",
        primary_color: "#0f172a",
        business_model: "B2B_SAAS" as BusinessModel,
        mrr_goal: 100000
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (!isLoading && !settings.setup_completed) {
            setFormData({
                company_name: settings.company_name,
                primary_color: settings.primary_color,
                business_model: settings.business_model,
                mrr_goal: settings.mrr_goal,
            });
            setOpen(true);
        }
    }, [isLoading, settings.setup_completed]);

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else handleFinish();
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleFinish = async () => {
        await updateSettings(formData);
        await completeSetup();
        setOpen(false);
    };

    if (settings.setup_completed) return null;

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0" hideCloseButton>
                {/* Header com Progresso */}
                <div className="bg-muted/30 p-6 border-b">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Rocket className="h-5 w-5 text-primary" />
                            <span className="font-semibold text-lg">Configuração Inicial</span>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">Passo {step} de 3</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-in-out"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="p-8 min-h-[300px]">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold tracking-tight">Sua Identidade</h2>
                                <p className="text-muted-foreground">Como sua empresa deve ser chamada no sistema?</p>
                            </div>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="company_name">Nome da Empresa</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="company_name"
                                            value={formData.company_name}
                                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                            className="pl-9"
                                            placeholder="Ex: Acme Corp"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="color">Cor Principal (Tema)</Label>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-9 w-9 rounded-full border shadow-sm"
                                            style={{ backgroundColor: formData.primary_color }}
                                        />
                                        <Input
                                            id="color"
                                            type="color"
                                            value={formData.primary_color}
                                            onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                            className="w-full h-9 p-1 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold tracking-tight">Modelo de Negócio</h2>
                                <p className="text-muted-foreground">Isso ajusta a terminologia do sistema para você.</p>
                            </div>

                            <RadioGroup
                                value={formData.business_model}
                                onValueChange={(v) => setFormData({ ...formData, business_model: v as BusinessModel })}
                                className="grid gap-4 pt-2"
                            >
                                <Label
                                    htmlFor="saas"
                                    className={cn(
                                        "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all",
                                        formData.business_model === 'B2B_SAAS' ? "border-primary bg-primary/5" : ""
                                    )}
                                >
                                    <RadioGroupItem value="B2B_SAAS" id="saas" className="sr-only" />
                                    <LayoutDashboard className="mb-3 h-8 w-8 text-primary" />
                                    <div className="text-center space-y-1">
                                        <div className="font-semibold text-lg">SaaS / Recorrência</div>
                                        <div className="text-xs text-muted-foreground max-w-[200px]">
                                            Foco em MRR, Churn, Planos e Assinaturas mensais.
                                        </div>
                                    </div>
                                </Label>

                                <Label
                                    htmlFor="service"
                                    className={cn(
                                        "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all",
                                        formData.business_model === 'B2B_SERVICE' ? "border-primary bg-primary/5" : ""
                                    )}
                                >
                                    <RadioGroupItem value="B2B_SERVICE" id="service" className="sr-only" />
                                    <Briefcase className="mb-3 h-8 w-8 text-primary" />
                                    <div className="text-center space-y-1">
                                        <div className="font-semibold text-lg">Serviços B2B / Projetos</div>
                                        <div className="text-xs text-muted-foreground max-w-[200px]">
                                            Foco em Contratos, Projetos, Retainers e Fluxo de Caixa.
                                        </div>
                                    </div>
                                </Label>
                            </RadioGroup>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold tracking-tight">Defina sua Meta</h2>
                                <p className="text-muted-foreground">Qual o seu objetivo de MRR (Receita Mensal Recorrente) para este ano?</p>
                            </div>

                            <div className="py-8">
                                <div className="flex items-center justify-center mb-8">
                                    <div className="text-4xl font-bold text-primary">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.mrr_goal)}
                                    </div>
                                </div>

                                <Slider
                                    defaultValue={[formData.mrr_goal]}
                                    max={1000000}
                                    step={5000}
                                    onValueChange={(vals) => setFormData({ ...formData, mrr_goal: vals[0] })}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                    <span>R$ 0</span>
                                    <span>R$ 1.000.000+</span>
                                </div>
                            </div>

                            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 p-4 border border-yellow-200 dark:border-yellow-900">
                                <div className="flex items-start gap-3">
                                    <Target className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                                    <div className="text-sm text-yellow-700 dark:text-yellow-400">
                                        <p className="font-medium mb-1">Por que isso é importante?</p>
                                        <p>Seu dashboard usará este valor para calcular o progresso (% da meta) e motivar seu time de vendas.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="bg-muted/30 p-6 border-t sm:justify-between">
                    {step > 1 ? (
                        <Button variant="outline" onClick={handleBack}>Voltar</Button>
                    ) : (
                        <div /> // Spacer
                    )}

                    <Button onClick={handleNext} disabled={!formData.company_name}>
                        {step === 3 ? "Concluir Setup 🚀" : "Próximo Passo"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
