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
import { useCreateFixedCost } from "@/hooks/useFixedCosts";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";

const formSchema = z.object({
    category: z.enum(["Pessoal", "Infraestrutura", "Operacional", "Outros"]),
    description: z.string().optional(),
    budgeted: z.coerce.number().min(0),
    actual: z.coerce.number().min(0),
    due_day: z.coerce.number().min(1).max(31).optional(),
    month: z.string().min(1, "Mês de competência obrigatório"), // C3 fix: add month field
});

export function CreateFixedCostModal() {
    const [open, setOpen] = useState(false);
    const createCost = useCreateFixedCost();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            category: "Operacional",
            budgeted: 0,
            actual: 0,
            description: "",
            month: new Date().toISOString().split("T")[0], // Default to today (YYYY-MM-DD format)
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        // Cast to any to avoid strict Supabase type mismatches with Schema
        const payload = {
            ...values,
            due_day: values.due_day || null,
        } as any;

        createCost.mutate(
            payload,
            {
                onSuccess: () => {
                    toast({
                        title: "Custo fixo adicionado",
                        description: "O custo foi registrado com sucesso.",
                    });
                    setOpen(false);
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Custo Fixo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Novo Custo Fixo</DialogTitle>
                    <DialogDescription>
                        Adicione um custo recorrente ou fixo.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoria</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Pessoal">Pessoal</SelectItem>
                                            <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                                            <SelectItem value="Operacional">Operacional</SelectItem>
                                            <SelectItem value="Outros">Outros</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Aluguel servidores" {...field} />
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
                                        <FormLabel>Orçado (R$)</FormLabel>
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
                                        <FormLabel>Realizado (R$)</FormLabel>
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
                                    <FormLabel>Mês de Competência</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="due_day"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dia de Vencimento</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="1" max="31" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
