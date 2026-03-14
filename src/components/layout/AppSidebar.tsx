import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Wallet,
  Receipt,
  Scale,
  Target,
  BarChart3,
  PieChart,
  FileText,
  Import,
  Settings,
  ChevronDown,
  Activity,
  Building2,
  DollarSign,
  Gauge,
  Calculator,
  ChevronsUpDown,
  Plus,
  Check,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Assuming Avatar components are from shadcn/ui

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
    title: "Cockpit",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    title: "Gestão",
    items: [
      { title: "Hub Financeiro", href: "/financial", icon: BarChart3 },
      { title: "Hub Comercial", href: "/commercial", icon: TrendingUp },
      { title: "Hub Jurídico", href: "/legal", icon: Scale },
      { title: "Clientes", href: "/clients", icon: Users },
    ],
  },
];

export function AppSidebar() {
  const { settings } = useSettings();
  const location = useLocation();
  const { user, signOut } = useAuth();
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
      {/* Logo & Workspace Switcher */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-2 hover:bg-sidebar-accent/50">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt={settings.company_name} className="h-9 w-9 rounded-lg object-cover" />
                ) : (
                  <Building2 className="h-5 w-5" />
                )}
              </div>
              <div className="flex flex-1 flex-col items-start overflow-hidden">
                <span className="truncate text-sm font-semibold text-foreground">
                  {settings.company_name || "SaaS Compass"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {settings.business_model === 'B2B_SERVICE' ? 'Service Hub' : 'Financial Hub'}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[240px]" align="start">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
            <DropdownMenuItem className="gap-2 bg-accent/50">
              <div className="flex h-6 w-6 items-center justify-center rounded-sm border bg-background">
                <Building2 className="h-4 w-4" />
              </div>
              {settings.company_name}
              <Check className="ml-auto h-4 w-4" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-sm border border-dashed">
                <Plus className="h-4 w-4" />
              </div>
              Criar nova empresa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
