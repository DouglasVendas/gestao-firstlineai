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
import { useCreateBudget } from "@/hooks/useCreateBudget";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";

const formSchema = z.object({
    category: z.string().min(2, "Categoria deve ter pelo menos 2 caracteres."),
    budgeted: z.coerce.number().min(0, "Valor orçado deve ser positivo."),
    actual: z.coerce.number().min(0).optional(),
    month: z.string().optional(),
});

export function CreateBudgetModal() {
    const [open, setOpen] = useState(false);
    const createBudget = useCreateBudget();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            category: "",
            budgeted: 0,
            actual: 0,
            month: new Date().toISOString().slice(0, 7) + "-01",
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        createBudget.mutate(
            {
                category: values.category,
                budgeted: values.budgeted,
                actual: values.actual || 0,
                month: values.month || undefined,
            },
            {
                onSuccess: () => {
                    toast({
                        title: "Orçamento criado",
                        description: "O item de orçamento foi adicionado com sucesso.",
                    });
                    setOpen(false);
                    form.reset();
                },
                onError: (error) => {
                    toast({
                        variant: "destructive",
                        title: "Erro ao criar orçamento",
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
                    Novo Orçamento
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Novo Item de Orçamento</DialogTitle>
                    <DialogDescription>
                        Adicione uma nova linha ao orçamento mensal.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoria *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Marketing" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="budgeted"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor Orçado (R$) *</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="actual"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor Realizado (R$)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="month"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mês de Referência</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createBudget.isPending}>
                                {createBudget.isPending && (
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
