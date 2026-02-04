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
import { useCreateVariableCost } from "@/hooks/useVariableCosts";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";

// Categorias comuns de custo variável. No futuro pode vir do banco.
const CATEGORIES = ["Comissão", "Marketing", "Servidores (Uso)", "Taxas Pagamento", "Outros"];

const formSchema = z.object({
    category: z.string().min(1, "Categoria obrigatória"),
    description: z.string().optional(),
    amount: z.coerce.number().min(0.01, "Valor deve ser positivo"),
    month: z.string().min(1, "Data obrigatória"),
});

export function CreateVariableCostModal() {
    const [open, setOpen] = useState(false);
    const createCost = useCreateVariableCost();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            category: "Marketing",
            amount: 0,
            description: "",
            month: new Date().toISOString().split("T")[0],
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        createCost.mutate(
            values as any,
            {
                onSuccess: () => {
                    toast({
                        title: "Custo variável adicionado",
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
                    Novo Custo Variável
                </Button>
            </DialogTrigger>
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
                                            {CATEGORIES.map((cat) => (
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
