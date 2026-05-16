import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useUpdateTransaction } from "@/hooks/useUpdateTransaction";
import { Transaction } from "@/hooks/useTransactions";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
    description: z.string().min(1, "Descrição obrigatória"),
    amount: z.coerce.number().min(0.01, "Valor deve ser positivo"),
    type: z.enum(["income", "expense"]),
    category: z.string().optional(),
    date: z.string().min(1, "Data obrigatória"),
    status: z.enum(["pending", "completed", "cancelled"]).default("pending"),
});

type FormValues = z.infer<typeof formSchema>;

interface EditTransactionModalProps {
    transaction: Transaction | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditTransactionModal({ transaction, open, onOpenChange }: EditTransactionModalProps) {
    const updateTransaction = useUpdateTransaction();
    const { toast } = useToast();
    const isResettingRef = useRef(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: "",
            amount: 0,
            type: "expense",
            category: "",
            date: new Date().toISOString().split("T")[0],
            status: "pending",
        },
    });

    useEffect(() => {
        if (!open) form.reset();
    }, [open, form]);

    useEffect(() => {
        if (transaction) {
            isResettingRef.current = true;
            // Normalize type: the DB might store 'entrada'/'saida' in some records
            const normalizedType = (transaction.type === "entrada" || transaction.type === "income")
                ? "income"
                : "expense";
            form.reset({
                description: transaction.description,
                amount: transaction.amount,
                type: normalizedType,
                category: transaction.category || "",
                date: transaction.date ? transaction.date.slice(0, 10) : "",
                status: (transaction.status as FormValues["status"]) || "pending",
            });
            setTimeout(() => { isResettingRef.current = false; }, 0);
        }
    }, [transaction, form]);

    const onSubmit = (values: FormValues) => {
        if (!transaction) return;
        updateTransaction.mutate(
            { id: transaction.id, ...values, category: values.category || null },
            {
                onSuccess: () => {
                    toast({ title: "Transação atualizada", description: "As alterações foram salvas." });
                    onOpenChange(false);
                },
                onError: (err) => {
                    toast({ variant: "destructive", title: "Erro ao atualizar", description: err.message });
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Transação</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descrição</FormLabel>
                                <FormControl><Input placeholder="Ex: Folha de pagamento" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="amount" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Valor (R$)</FormLabel>
                                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="income">Entrada</SelectItem>
                                            <SelectItem value="expense">Saída</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Data</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="status" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="pending">Pendente</SelectItem>
                                            <SelectItem value="completed">Concluído</SelectItem>
                                            <SelectItem value="cancelled">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="category" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoria (Opcional)</FormLabel>
                                <FormControl><Input placeholder="Ex: MRR, Pessoas, Comercial e Marketing..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={updateTransaction.isPending}>
                                {updateTransaction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
