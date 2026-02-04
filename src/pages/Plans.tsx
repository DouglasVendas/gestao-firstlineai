import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, MoreHorizontal, Users, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyDiscount: number;
  activeClients: number;
  mrr: number;
  status: "active" | "discontinued" | "hidden";
  features: string[];
  limits: {
    users: number | "unlimited";
    storage: string;
    apiCalls: number | "unlimited";
  };
}

const plans: Plan[] = [
  {
    id: "1",
    name: "Basic",
    description: "Para pequenas equipes começando",
    monthlyPrice: 990,
    yearlyPrice: 9900,
    yearlyDiscount: 17,
    activeClients: 28,
    mrr: 27720,
    status: "active",
    features: [
      "Até 5 usuários",
      "10GB de armazenamento",
      "Suporte por email",
      "API básica",
    ],
    limits: {
      users: 5,
      storage: "10GB",
      apiCalls: 10000,
    },
  },
  {
    id: "2",
    name: "Pro",
    description: "Para equipes em crescimento",
    monthlyPrice: 2990,
    yearlyPrice: 29900,
    yearlyDiscount: 17,
    activeClients: 65,
    mrr: 194350,
    status: "active",
    features: [
      "Até 20 usuários",
      "50GB de armazenamento",
      "Suporte prioritário",
      "API completa",
      "Integrações avançadas",
      "Relatórios personalizados",
    ],
    limits: {
      users: 20,
      storage: "50GB",
      apiCalls: 100000,
    },
  },
  {
    id: "3",
    name: "Enterprise",
    description: "Para grandes organizações",
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    yearlyDiscount: 17,
    activeClients: 42,
    mrr: 415800,
    status: "active",
    features: [
      "Usuários ilimitados",
      "Armazenamento ilimitado",
      "Suporte 24/7 dedicado",
      "API ilimitada",
      "SSO & SAML",
      "SLA garantido",
      "Gerente de conta dedicado",
    ],
    limits: {
      users: "unlimited",
      storage: "Ilimitado",
      apiCalls: "unlimited",
    },
  },
  {
    id: "4",
    name: "Starter (Legado)",
    description: "Plano descontinuado",
    monthlyPrice: 490,
    yearlyPrice: 4900,
    yearlyDiscount: 17,
    activeClients: 12,
    mrr: 5880,
    status: "discontinued",
    features: [
      "Até 3 usuários",
      "5GB de armazenamento",
      "Suporte por email",
    ],
    limits: {
      users: 3,
      storage: "5GB",
      apiCalls: 5000,
    },
  },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function Plans() {
  return (
    <AppLayout
      title="Planos e Precificação"
      subtitle="Gerencie seus planos e tiers de preços"
    >
      {/* Actions Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-success" />
            3 ativos
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-muted-foreground" />
            1 descontinuado
          </Badge>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Total Clientes</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
            147
          </p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">MRR Total</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-primary">
            {formatCurrency(643750)}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">ARPU Médio</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
            {formatCurrency(4379)}
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "metric-card relative flex flex-col",
              plan.status === "discontinued" && "opacity-60"
            )}
          >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {plan.name}
                  </h3>
                  {plan.status === "discontinued" && (
                    <Badge variant="secondary" className="text-xs">
                      Descontinuado
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Pricing */}
            <div className="mb-4">
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-3xl font-bold text-foreground">
                  {formatCurrency(plan.monthlyPrice)}
                </span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                ou {formatCurrency(plan.yearlyPrice)}/ano ({plan.yearlyDiscount}%
                off)
              </p>
            </div>

            {/* Stats */}
            <div className="mb-4 flex items-center gap-4 rounded-lg bg-secondary/50 p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm font-medium text-foreground">
                  {plan.activeClients}
                </span>
                <span className="text-xs text-muted-foreground">clientes</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div>
                <span className="font-mono text-sm font-medium text-primary">
                  {formatCurrency(plan.mrr)}
                </span>
                <span className="text-xs text-muted-foreground"> MRR</span>
              </div>
            </div>

            {/* Features */}
            <div className="mb-4 flex-1">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Recursos
              </p>
              <ul className="space-y-2">
                {plan.features.slice(0, 4).map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <Check className="h-4 w-4 text-success" />
                    {feature}
                  </li>
                ))}
                {plan.features.length > 4 && (
                  <li className="text-sm text-muted-foreground">
                    +{plan.features.length - 4} mais recursos
                  </li>
                )}
              </ul>
            </div>

            {/* Limits */}
            <div className="mb-4 rounded-lg border border-border p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Limites
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="font-mono font-medium text-foreground">
                    {plan.limits.users === "unlimited" ? "∞" : plan.limits.users}
                  </p>
                  <p className="text-muted-foreground">Usuários</p>
                </div>
                <div>
                  <p className="font-mono font-medium text-foreground">
                    {plan.limits.storage}
                  </p>
                  <p className="text-muted-foreground">Storage</p>
                </div>
                <div>
                  <p className="font-mono font-medium text-foreground">
                    {plan.limits.apiCalls === "unlimited"
                      ? "∞"
                      : `${(plan.limits.apiCalls / 1000).toFixed(0)}k`}
                  </p>
                  <p className="text-muted-foreground">API/mês</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
