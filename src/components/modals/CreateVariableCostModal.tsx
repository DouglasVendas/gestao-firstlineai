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
import { useCreateVariableCost } from "@/hooks/useVariableCosts";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { CostAttachmentInput } from "@/components/costs/CostAttachmentInput";
import { COST_CATEGORY_OPTIONS } from "@/lib/costCategories";
import { useCashSummary } from "@/hooks/useCashAccounts";

const formSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    category: z.string().min(1, "Categoria obrigatória"),
    description: z.string().optional(),
    amount: z.coerce.number().min(0.01, "Valor deve ser positivo"),
    month: z.string().min(1, "Data obrigatória"),
    status: z.enum(["pending", "paid"]),
    cash_account_id: z.string().optional(),
    paid_at: z.string().optional(),
}).superRefine((values, ctx) => {
    if (values.status === "paid") {
        if (!values.cash_account_id) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cash_account_id"], message: "Informe a conta de saída" });
        }
        if (!values.paid_at) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paid_at"], message: "Informe a data de pagamento" });
        }
    }
});

interface CreateVariableCostModalProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: ReactNode;
    hideTrigger?: boolean;
}

export function CreateVariableCostModal({ open, onOpenChange, trigger, hideTrigger = false }: CreateVariableCostModalProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
    const createCost = useCreateVariableCost();
    const { accountsWithBalance } = useCashSummary();
    const { toast } = useToast();
    const dialogOpen = open ?? internalOpen;
    const setDialogOpen = onOpenChange ?? setInternalOpen;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            category: "Comercial e Marketing",
            amount: 0,
            description: "",
            month: new Date().toISOString().split("T")[0],
            status: "pending",
            cash_account_id: "",
            paid_at: new Date().toISOString().split("T")[0],
        },
    });
    const status = form.watch("status");

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        createCost.mutate(
            {
                ...values,
                cash_account_id: values.status === "paid" ? values.cash_account_id : null,
                paid_at: values.status === "paid" ? values.paid_at : null,
                attachmentFiles,
            } as any,
            {
                onSuccess: () => {
                    toast({
                        title: "Custo variável adicionado",
                        description: "O custo foi registrado com sucesso.",
                    });
                    setDialogOpen(false);
                    setAttachmentFiles([]);
                    form.reset();
                },
                onError: (error) => {
                    toast({
                        variant: "destructive",
                        title: "Erro ao criar custo",
                        description: error.message,
                    });
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
                            Novo Custo Variável
                        </Button>
                    )}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Novo Custo Variável</DialogTitle>
                    <DialogDescription>
                        Adicione um custo variável (ex: comissões, ads).
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Google Ads, Comissão, Stripe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="pending">Pendente</SelectItem>
                                            <SelectItem value="paid">Pago</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {status === "paid" && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="paid_at"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data de pagamento</FormLabel>
                                            <FormControl><Input type="date" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="cash_account_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Conta de saída</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione a conta" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {accountsWithBalance.filter((account) => account.active).map((account) => (
                                                        <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoria</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione ou digite" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {COST_CATEGORY_OPTIONS.map((cat) => (
                                                <SelectItem key={cat} value={cat}>
                                                    {cat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Valor (R$)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="month"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Data de Competência</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Detalhes do custo..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <CostAttachmentInput
                            files={attachmentFiles}
                            onFilesChange={setAttachmentFiles}
                            disabled={createCost.isPending}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createCost.isPending}>
                                {createCost.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
