import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Wallet,
  Receipt,
  Target,
  BarChart3,
  PieChart,
  FileText,
  Settings,
  ChevronDown,
  Activity,
  Building2,
  DollarSign,
  Gauge,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
      { title: "Métricas SaaS", href: "/metrics", icon: Gauge },
    ],
  },
  {
    title: "Clientes & Receita",
    items: [
      { title: "Clientes", href: "/clients", icon: Users },
      { title: "Planos", href: "/plans", icon: CreditCard },
      { title: "Recebimentos", href: "/receivables", icon: Receipt },
    ],
  },
  {
    title: "Custos",
    items: [
      { title: "Custos Variáveis", href: "/variable-costs", icon: TrendingDown },
      { title: "Custos Fixos", href: "/fixed-costs", icon: Building2 },
    ],
  },
  {
    title: "Análises",
    items: [
      { title: "Churn & Retenção", href: "/churn", icon: Activity },
      { title: "LTV & CAC", href: "/ltv-cac", icon: TrendingUp },
      { title: "Marketing & Funil", href: "/marketing", icon: Target },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { title: "DRE", href: "/dre", icon: FileText },
      { title: "Fluxo de Caixa", href: "/cashflow", icon: Wallet },
      { title: "Valuation", href: "/valuation", icon: Calculator },
    ],
  },
  {
    title: "Planejamento",
    items: [
      { title: "Orçamento", href: "/budget", icon: PieChart },
      { title: "Relatórios", href: "/reports", icon: BarChart3 },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    navigation.map((g) => g.title)
  );

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) =>
      prev.includes(title)
        ? prev.filter((g) => g !== title)
        : [...prev, title]
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <DollarSign className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">SaaS Metrics</h1>
          <p className="text-xs text-muted-foreground">Financial Hub</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        {navigation.map((group) => (
          <div key={group.title} className="mb-4">
            <button
              onClick={() => toggleGroup(group.title)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              {group.title}
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  expandedGroups.includes(group.title) ? "rotate-0" : "-rotate-90"
                )}
              />
            </button>
            {expandedGroups.includes(group.title) && (
              <div className="mt-1 space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "nav-item",
                        isActive && "nav-item-active"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <Link
          to="/settings"
          className="nav-item"
        >
          <Settings className="h-4 w-4" />
          <span>Configurações</span>
        </Link>
      </div>
    </aside>
  );
}
