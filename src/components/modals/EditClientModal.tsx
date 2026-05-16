import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useUpdateClient } from "@/hooks/useUpdateClient";
import { useToast } from "@/hooks/use-toast";
import type { Client } from "@/hooks/useClients";
import { ClientSubscriptionsForm } from "@/components/clients/ClientSubscriptionsForm";
import {
  calculateSubscriptionsMrr,
  ClientSubscriptionInput,
  useClientSubscriptions,
  useProductCatalog,
} from "@/hooks/useClientSubscriptions";

const formSchema = z
  .object({
    name: z.string().min(1, "Nome obrigatório"),
    email: z.string().email("Email inválido").or(z.literal("")).optional(),
    mrr: z.coerce.number().min(0),
    contract_duration: z.coerce.number().min(1).default(12),
    start_date: z.string().optional(),
    status: z.string(),
    plan_id: z.string().optional(),
    billing_cycle: z
      .enum(["monthly", "bimonthly", "quarterly", "semiannual", "yearly"])
      .default("monthly"),
    products: z.array(z.string()).default([]),
    subscriptions: z.array(z.custom<ClientSubscriptionInput>()).default([]),
    churn_date: z.string().optional(),
    churn_reason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "churned" && !data.churn_reason?.trim()) return false;
      return true;
    },
    { message: "Motivo do cancelamento é obrigatório", path: ["churn_reason"] }
  );

type FormValues = z.infer<typeof formSchema>;

interface EditClientModalProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CYCLE_MONTHS: Record<string, number | null> = {
  monthly: null,
  bimonthly: 2,
  quarterly: 3,
  semiannual: 6,
  yearly: 12,
};

const BILLING_CYCLE_LABELS: Record<string, string> = {
  monthly: "Mensal",
  bimonthly: "Bimestral",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  yearly: "Anual",
};

export function EditClientModal({ client, open, onOpenChange }: EditClientModalProps) {
  const updateClient = useUpdateClient();
  const { data: catalog = [] } = useProductCatalog();
  const { data: storedSubscriptions = [] } = useClientSubscriptions(client?.id);
  const { toast } = useToast();
  const isResettingRef = useRef(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      mrr: 0,
      contract_duration: 12,
      start_date: "",
      status: "active",
      plan_id: "",
      billing_cycle: "monthly",
      products: [],
      subscriptions: [],
      churn_date: "",
      churn_reason: "",
    },
  });

  // Reset form when modal closes without saving
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  useEffect(() => {
    if (client) {
      isResettingRef.current = true;
      form.reset({
        name: client.name,
        email: client.email || "",
        mrr: client.mrr,
        contract_duration: client.contract_duration || 12,
        start_date: client.start_date ? client.start_date.slice(0, 10) : "",
        status: client.status,
        plan_id: client.plan_id || "",
        billing_cycle: client.billing_cycle || "monthly",
        products: (client.products as string[]) || [],
        subscriptions: storedSubscriptions.map((subscription) => ({
          product_id: subscription.product_id,
          product_code: subscription.product.code,
          product_plan_id: subscription.product_plan_id,
          status: subscription.status,
          billing_cycle: subscription.billing_cycle,
          quantity: subscription.quantity,
          unit_price: subscription.unit_price,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          addons: subscription.addons.map((addon) => ({
            addon_code: addon.addon_code,
            name: addon.name,
            quantity: addon.quantity,
            unit_price: addon.unit_price,
          })),
        })),
        churn_date: client.churn_date ? client.churn_date.slice(0, 10) : "",
        churn_reason: client.churn_reason || "",
      });
      setTimeout(() => {
        isResettingRef.current = false;
      }, 0);
    }
  }, [client, form, storedSubscriptions]);

  const billingCycle = form.watch("billing_cycle");
  const status = form.watch("status");
  const isChurned = status === "churned";
  const subscriptions = form.watch("subscriptions") || [];
  const startDate = form.watch("start_date") || client?.start_date?.slice(0, 10) || new Date().toISOString().slice(0, 10);
  const totalMrr = calculateSubscriptionsMrr(subscriptions);

  useEffect(() => {
    if (isResettingRef.current) return;
    const months = CYCLE_MONTHS[billingCycle];
    if (months !== null && months !== undefined) {
      form.setValue("contract_duration", months);
    }
  }, [billingCycle, form]);

  // Auto-fill churn_date with today when switching to churned
  useEffect(() => {
    if (isResettingRef.current) return;
    if (isChurned && !form.getValues("churn_date")) {
      form.setValue("churn_date", new Date().toISOString().slice(0, 10));
    }
  }, [isChurned, form]);

  const onSubmit = (values: FormValues) => {
    if (!client) return;

    updateClient.mutate(
      {
        id: client.id,
        name: values.name,
        email: values.email || null,
        contract_duration: values.contract_duration,
        start_date: values.start_date || null,
        status: values.status,
        plan_id: values.plan_id || null,
        billing_cycle: values.billing_cycle,
        products: values.products,
        subscriptions: values.subscriptions.length > 0 ? values.subscriptions : undefined,
        mrr: values.subscriptions.length > 0 ? calculateSubscriptionsMrr(values.subscriptions) : values.mrr,
        churn_date: values.status === "churned" ? (values.churn_date || null) : null,
        churn_reason: values.status === "churned" ? (values.churn_reason || null) : null,
      },
      {
        onSuccess: () => {
          toast({ title: "Cliente atualizado", description: "Dados salvos com sucesso." });
          onOpenChange(false);
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Erro", description: error.message });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Nome */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ciclo legado usado pelas telas atuais de faturamento */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billing_cycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciclo de Cobrança</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(BILLING_CYCLE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* MRR e Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mrr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{subscriptions.length > 0 ? "MRR calculado" : "MRR (R$)"}</FormLabel>
                    {subscriptions.length > 0 ? (
                      <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm font-medium">
                        {totalMrr.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </div>
                    ) : (
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                    )}
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
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="churned">Cancelado</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campos de Churn — visíveis apenas quando status = cancelado */}
            {isChurned && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                <p className="text-sm font-medium text-destructive">Informações de Cancelamento</p>

                <FormField
                  control={form.control}
                  name="churn_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Cancelamento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="churn_reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Motivo do Cancelamento <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Preço alto, migrou para concorrente, encerrou empresa..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Contrato e Renovação */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início do Contrato</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            {/* Produtos e assinaturas */}
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateClient.isPending}>
                {updateClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
