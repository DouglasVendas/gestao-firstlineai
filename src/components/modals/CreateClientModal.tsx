import { useState, useEffect } from "react";
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
import { ClientSubscriptionsForm } from "@/components/clients/ClientSubscriptionsForm";
import {
    calculateSubscriptionsMrr,
    ClientSubscriptionInput,
    useProductCatalog,
} from "@/hooks/useClientSubscriptions";

// Schema validation
const formSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    status: z.enum(["active", "trial", "churned", "inactive"]),
    mrr: z.coerce.number().min(0, "MRR deve ser positivo."),
    contract_duration: z.coerce.number().min(1, "Duração mínima de 1 mês.").default(12),
    start_date: z.string().optional(),
    billing_cycle: z.enum(["monthly", "bimonthly", "quarterly", "semiannual", "yearly"]).default("monthly"),
    subscriptions: z.array(z.custom<ClientSubscriptionInput>()).default([]),
});

export function CreateClientModal() {
    const [open, setOpen] = useState(false);
    const createClient = useCreateClient();
    const { data: catalog = [] } = useProductCatalog();
    const { toast } = useToast();

    const CYCLE_MONTHS: Record<string, number | null> = {
        monthly: null,
        bimonthly: 2,
        quarterly: 3,
        semiannual: 6,
        yearly: 12,
    };

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            status: "active",
            mrr: 0,
            contract_duration: 12,
            start_date: new Date().toISOString().split("T")[0],
            billing_cycle: "monthly",
            subscriptions: [],
        },
    });

    const billingCycle = form.watch("billing_cycle");
    const subscriptions = form.watch("subscriptions") || [];
    const startDate = form.watch("start_date") || new Date().toISOString().split("T")[0];
    const totalMrr = calculateSubscriptionsMrr(subscriptions);

    useEffect(() => {
        const months = CYCLE_MONTHS[billingCycle];
        if (months !== null && months !== undefined) {
            form.setValue("contract_duration", months);
        }
    }, [billingCycle]);

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        createClient.mutate(
            {
                name: values.name,
                email: values.email || null,
                status: values.status,
                contract_duration: values.contract_duration,
                start_date: values.start_date || null,
                plan_id: undefined,
                billing_cycle: values.billing_cycle,
                products: [],
                subscriptions: values.subscriptions,
                mrr: calculateSubscriptionsMrr(values.subscriptions),
                churn_date: null,
                churn_reason: null,
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
            <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
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
                            <FormItem>
                                <FormLabel>MRR calculado</FormLabel>
                                <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm font-medium">
                                    {totalMrr.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </div>
                            </FormItem>

                            <FormField
                                control={form.control}
                                name="contract_duration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duração do Ciclo</FormLabel>
                                        {billingCycle === "monthly" ? (
                                            <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                                                Recorrente (sem data de fim)
                                            </div>
                                        ) : (
                                            <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm font-medium">
                                                {CYCLE_MONTHS[billingCycle]} meses (automático)
                                            </div>
                                        )}
                                        <input type="hidden" {...field} />
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
                                name="billing_cycle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ciclo de Cobrança</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="monthly">Mensal</SelectItem>
                                                <SelectItem value="bimonthly">Bimestral</SelectItem>
                                                <SelectItem value="quarterly">Trimestral</SelectItem>
                                                <SelectItem value="semiannual">Semestral</SelectItem>
                                                <SelectItem value="yearly">Anual</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="subscriptions"
                            render={() => (
                                <FormItem>
                                    <ClientSubscriptionsForm
                                        catalog={catalog}
                                        value={subscriptions}
                                        onChange={(value) => form.setValue("subscriptions", value, { shouldDirty: true, shouldValidate: true })}
                                        defaultStartDate={startDate}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="email@empresa.com" {...field} />
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
