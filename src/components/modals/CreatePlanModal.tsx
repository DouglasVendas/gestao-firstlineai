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
import { Textarea } from "@/components/ui/textarea";
import { useCreatePlan } from "@/hooks/usePlans";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
    description: z.string().optional(),
    price_monthly: z.coerce.number().min(0),
    price_yearly: z.coerce.number().min(0),
    features: z.string().optional(), // We'll parse comma-separated string
});

export function CreatePlanModal() {
    const [open, setOpen] = useState(false);
    const createPlan = useCreatePlan();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            price_monthly: 0,
            price_yearly: 0,
            features: "Dashboard, Suporte, Usuários ilimitados",
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const featuresArray = values.features
            ? values.features.split(",").map((f) => f.trim()).filter((f) => f.length > 0)
            : [];

        createPlan.mutate(
            {
                name: values.name,
                description: values.description,
                price_monthly: values.price_monthly,
                price_yearly: values.price_yearly,
                features: featuresArray,
                limits: { users: "unlimited", storage: "10GB" }, // Default limits
            },
            {
                onSuccess: () => {
                    toast({
                        title: "Plano criado",
                        description: "O novo plano foi adicionado com sucesso.",
                    });
                    setOpen(false);
                    form.reset();
                },
                onError: (error) => {
                    toast({
                        variant: "destructive",
                        title: "Erro ao criar plano",
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
                    Novo Plano
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Novo Plano</DialogTitle>
                    <DialogDescription>
                        Crie um novo plano de preços para seus clientes.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Plano</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Enterprise" {...field} />
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
                                    <FormLabel>Descrição Curta</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Para grandes empresas..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="price_monthly"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Preço Mensal (R$)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="price_yearly"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Preço Anual (R$)</FormLabel>
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
                            name="features"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Recursos (separados por vírgula)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Feature 1, Feature 2, Feature 3" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createPlan.isPending}>
                                {createPlan.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Salvar Plano
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
