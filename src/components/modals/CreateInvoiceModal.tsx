import { useState } from "react";
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
import { useCreateInvoice } from "@/hooks/useInvoices";
import { useClients } from "@/hooks/useClients";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";

const formSchema = z.object({
    client_id: z.string().min(1, "Selecione um cliente"),
    value: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
    due_date: z.string().min(1, "Data de vencimento obrigatória"),
    status: z.enum(["paid", "pending", "overdue", "canceled"]),
});

export function CreateInvoiceModal() {
    const [open, setOpen] = useState(false);
    const createInvoice = useCreateInvoice();
    const { data: clients } = useClients();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            value: 0,
            status: "pending",
            due_date: new Date().toISOString().split("T")[0],
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        createInvoice.mutate(
            {
                ...values,
                paid_date: values.status === "paid" ? new Date().toISOString().split("T")[0] : null,
            },
            {
                onSuccess: () => {
                    toast({
                        title: "Fatura criada",
                        description: "A nova fatura foi registrada com sucesso.",
                    });
                    setOpen(false);
                    form.reset();
                },
                onError: (error) => {
                    toast({
                        variant: "destructive",
                        title: "Erro ao criar fatura",
                        description: error.message,
                    });
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Fatura
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nova Fatura</DialogTitle>
                    <DialogDescription>
                        Lançamento manual de fatura para cliente.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="client_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cliente</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {clients?.map((client) => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    {client.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="value"
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
                                name="due_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vencimento</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="pending">Pendente</SelectItem>
                                            <SelectItem value="paid">Pago</SelectItem>
                                            <SelectItem value="overdue">Atrasado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createInvoice.isPending}>
                                {createInvoice.isPending && (
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
