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
import { useCreateClient } from "@/hooks/useClients";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";

// Schema validation
const formSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
    cnpj: z.string().optional(),
    status: z.enum(["active", "trial", "churned", "inactive"]),
    mrr: z.coerce.number().min(0, "MRR deve ser positivo."),
    arr: z.coerce.number().optional(),
    start_date: z.string().optional(), // Date input returns string YYYY-MM-DD
    payment_method: z.string().optional(),
    health_score: z.coerce.number().min(0).max(100).optional(),
});

export function CreateClientModal() {
    const [open, setOpen] = useState(false);
    const createClient = useCreateClient();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            cnpj: "",
            status: "active",
            mrr: 0,
            arr: 0,
            start_date: new Date().toISOString().split("T")[0],
            payment_method: "Boleto",
            health_score: 100,
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        // Calculate ARR automatically if not provided or valid
        const arr = values.arr && values.arr > 0 ? values.arr : values.mrr * 12;

        createClient.mutate(
            {
                ...values,
                arr,
                plan_id: undefined, // Plan selection can be added later if needed hooks exist
                renewal_date: null,
                plan: null,
            },
            {
                onSuccess: () => {
                    toast({
                        title: "Cliente criado",
                        description: "O cliente foi adicionado com sucesso.",
                    });
                    setOpen(false);
                    form.reset();
                },
                onError: (error) => {
                    toast({
                        variant: "destructive",
                        title: "Erro ao criar cliente",
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
                    Novo Cliente
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Novo Cliente</DialogTitle>
                    <DialogDescription>
                        Adicione um novo cliente à base. Clique em salvar quando terminar.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Empresa *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Acme Corp" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="mrr"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>MRR (R$) *</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
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
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="active">Ativo</SelectItem>
                                                <SelectItem value="trial">Trial</SelectItem>
                                                <SelectItem value="churned">Cancelado (Churn)</SelectItem>
                                                <SelectItem value="inactive">Inativo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="start_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data de Início</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="cnpj"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CNPJ</FormLabel>
                                        <FormControl>
                                            <Input placeholder="00.000.000/0000-00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createClient.isPending}>
                                {createClient.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Salvar Cliente
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
