import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useCreateFixedCost } from "@/hooks/useFixedCosts";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { CostAttachmentInput } from "@/components/costs/CostAttachmentInput";
import { COST_CATEGORY_OPTIONS } from "@/lib/costCategories";

const formSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    category: z.enum(COST_CATEGORY_OPTIONS),
    description: z.string().optional(),
    amount: z.coerce.number().min(0.01, "Valor mensal deve ser positivo"),
    due_day: z.coerce.number().min(1).max(31),
    start_month: z.string().min(1, "Mês de início obrigatório"),
    duration_type: z.enum(["indefinite", "months", "until"]),
    duration_months: z.coerce.number().min(1).optional(),
    end_month: z.string().optional(),
}).superRefine((values, ctx) => {
    if (values.duration_type === "months" && !values.duration_months) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["duration_months"], message: "Informe a quantidade de meses" });
    }
    if (values.duration_type === "until" && !values.end_month) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["end_month"], message: "Informe o mês final" });
    }
});

type FormValues = z.infer<typeof formSchema>;

interface CreateFixedCostModalProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: ReactNode;
    hideTrigger?: boolean;
}

function currentMonth() {
    return new Date().toISOString().slice(0, 7);
}

export function CreateFixedCostModal({ open, onOpenChange, trigger, hideTrigger = false }: CreateFixedCostModalProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
    const createCost = useCreateFixedCost();
    const { toast } = useToast();
    const dialogOpen = open ?? internalOpen;
    const setDialogOpen = onOpenChange ?? setInternalOpen;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            category: "Administrativo",
            amount: 0,
            due_day: 10,
            description: "",
            start_month: currentMonth(),
            duration_type: "indefinite",
            duration_months: undefined,
            end_month: "",
        },
    });

    const durationType = form.watch("duration_type");

    const onSubmit = (values: FormValues) => {
        createCost.mutate(
            {
                name: values.name,
                category: values.category,
                description: values.description || null,
                amount: values.amount,
                due_day: values.due_day,
                start_month: values.start_month,
                duration_months: values.duration_type === "months" ? values.duration_months : null,
                end_month: values.duration_type === "until" ? values.end_month : null,
                attachmentFiles,
            },
            {
                onSuccess: () => {
                    toast({
                        title: "Custo fixo recorrente adicionado",
                        description: "O custo passará a aparecer nos meses previstos.",
                    });
                    setDialogOpen(false);
                    setAttachmentFiles([]);
                    form.reset();
                },
                onError: (error) => {
                    toast({ variant: "destructive", title: "Erro ao criar custo", description: error.message });
                },
            }
        );
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            {!hideTrigger && (
                <DialogTrigger asChild>
                    {trigger || (
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Custo Fixo
                        </Button>
                    )}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Novo Custo Fixo</DialogTitle>
                    <DialogDescription>
                        Cadastre uma saída recorrente com vencimento mensal.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome</FormLabel>
                                <FormControl><Input placeholder="Ex: Pró-labore Douglas, Supabase, Contabilidade" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="category" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoria</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {COST_CATEGORY_OPTIONS.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="amount" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Valor mensal (R$)</FormLabel>
                                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="due_day" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dia de vencimento</FormLabel>
                                    <FormControl><Input type="number" min="1" max="31" {...field} /></FormControl>
                                    <FormDescription>Usado para alertar atraso ou pagamento em dia.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="start_month" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Início</FormLabel>
                                    <FormControl><Input type="month" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="duration_type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Duração</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="indefinite">Indeterminado</SelectItem>
                                            <SelectItem value="months">Quantidade de meses</SelectItem>
                                            <SelectItem value="until">Até mês específico</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {durationType === "months" && (
                            <FormField control={form.control} name="duration_months" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quantidade de meses</FormLabel>
                                    <FormControl><Input type="number" min="1" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}

                        {durationType === "until" && (
                            <FormField control={form.control} name="end_month" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mês final</FormLabel>
                                    <FormControl><Input type="month" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}

                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descrição</FormLabel>
                                <FormControl><Input placeholder="Detalhe opcional" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <CostAttachmentInput files={attachmentFiles} onFilesChange={setAttachmentFiles} disabled={createCost.isPending} />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={createCost.isPending}>
                                {createCost.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
