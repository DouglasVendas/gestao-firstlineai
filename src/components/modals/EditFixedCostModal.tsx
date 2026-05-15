import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { FixedCost, useSaveFixedCostPayment, useUpdateFixedCost } from "@/hooks/useFixedCosts";
import { useToast } from "@/hooks/use-toast";
import { CostAttachmentInput } from "@/components/costs/CostAttachmentInput";
import { COST_CATEGORY_OPTIONS, normalizeCostCategory } from "@/lib/costCategories";
import { useCashSummary } from "@/hooks/useCashAccounts";

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
    payment_status: z.enum(["pending", "paid", "canceled"]),
    cash_account_id: z.string().optional(),
    paid_at: z.string().optional(),
}).superRefine((values, ctx) => {
    if (values.payment_status === "paid") {
        if (!values.cash_account_id) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cash_account_id"], message: "Informe a conta de saída" });
        }
        if (!values.paid_at) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paid_at"], message: "Informe a data de pagamento" });
        }
    }
});

type FormValues = z.infer<typeof formSchema>;

interface EditFixedCostModalProps {
    cost: FixedCost | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function toMonthInput(value?: string | null) {
    return value ? value.slice(0, 7) : new Date().toISOString().slice(0, 7);
}

export function EditFixedCostModal({ cost, open, onOpenChange }: EditFixedCostModalProps) {
    const updateCost = useUpdateFixedCost();
    const savePayment = useSaveFixedCostPayment();
    const { accountsWithBalance } = useCashSummary();
    const { toast } = useToast();
    const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            category: "Administrativo",
            description: "",
            amount: 0,
            due_day: 10,
            start_month: new Date().toISOString().slice(0, 7),
            duration_type: "indefinite",
            duration_months: undefined,
            end_month: "",
            payment_status: "pending",
            cash_account_id: "",
            paid_at: new Date().toISOString().slice(0, 10),
        },
    });

    const durationType = form.watch("duration_type");
    const paymentStatus = form.watch("payment_status");

    useEffect(() => {
        if (!open) {
            form.reset();
            setAttachmentFiles([]);
        }
    }, [open, form]);

    useEffect(() => {
        if (!cost) return;
        form.reset({
            name: cost.name,
            category: normalizeCostCategory(cost.category),
            description: cost.description || "",
            amount: cost.actual,
            due_day: cost.due_day,
            start_month: toMonthInput(cost.start_date),
            duration_type: cost.duration_months ? "months" : cost.end_date ? "until" : "indefinite",
            duration_months: cost.duration_months || undefined,
            end_month: cost.end_date ? toMonthInput(cost.end_date) : "",
            payment_status: cost.status === "paid" || cost.status === "canceled" ? cost.status : "pending",
            cash_account_id: cost.payment?.cash_account_id || "",
            paid_at: cost.payment?.paid_at || new Date().toISOString().slice(0, 10),
        });
    }, [cost, form]);

    const onSubmit = async (values: FormValues) => {
        if (!cost) return;

        try {
            await updateCost.mutateAsync({
                id: cost.recurring_id,
                name: values.name,
                category: values.category,
                description: values.description || null,
                amount: values.amount,
                due_day: values.due_day,
                start_month: values.start_month,
                duration_months: values.duration_type === "months" ? values.duration_months : null,
                end_month: values.duration_type === "until" ? values.end_month : null,
            });

            await savePayment.mutateAsync({
                occurrence: { ...cost, actual: values.amount, due_day: values.due_day },
                status: values.payment_status,
                paid_at: values.payment_status === "paid" ? values.paid_at : null,
                cashAccountId: values.payment_status === "paid" ? values.cash_account_id : null,
                attachmentFiles,
            });

            toast({ title: "Custo fixo atualizado", description: "Recorrência e pagamento do mês foram salvos." });
            setAttachmentFiles([]);
            onOpenChange(false);
        } catch (err) {
            const error = err as Error;
            toast({ variant: "destructive", title: "Erro ao atualizar", description: error.message });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Editar Custo Fixo</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <FormField control={form.control} name="category" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoria</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>{COST_CATEGORY_OPTIONS.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="amount" render={({ field }) => (
                                <FormItem><FormLabel>Valor mensal (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="due_day" render={({ field }) => (
                                <FormItem><FormLabel>Dia de vencimento</FormLabel><FormControl><Input type="number" min="1" max="31" {...field} /></FormControl><FormDescription>Usado para alertar atrasos.</FormDescription><FormMessage /></FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="start_month" render={({ field }) => (
                                <FormItem><FormLabel>Início</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem>
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

                        {durationType === "months" && <FormField control={form.control} name="duration_months" render={({ field }) => (
                            <FormItem><FormLabel>Quantidade de meses</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />}

                        {durationType === "until" && <FormField control={form.control} name="end_month" render={({ field }) => (
                            <FormItem><FormLabel>Mês final</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />}

                        <FormField control={form.control} name="payment_status" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status do mês selecionado</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="pending">Pendente</SelectItem>
                                        <SelectItem value="paid">Pago</SelectItem>
                                        <SelectItem value="canceled">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {paymentStatus === "paid" && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField control={form.control} name="paid_at" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data de pagamento</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="cash_account_id" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Conta de saída</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {accountsWithBalance.filter((account) => account.active).map((account) => (
                                                    <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        )}

                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Descrição</FormLabel><FormControl><Input placeholder="Detalhe opcional" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <CostAttachmentInput files={attachmentFiles} onFilesChange={setAttachmentFiles} existingAttachments={cost?.attachments || []} disabled={updateCost.isPending || savePayment.isPending} />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={updateCost.isPending || savePayment.isPending}>
                                {(updateCost.isPending || savePayment.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
