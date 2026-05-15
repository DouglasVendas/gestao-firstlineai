import { AppSidebar } from "./AppSidebar";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NotificationsDropdown } from "@/components/header/NotificationsDropdown";
import { UserDropdown } from "@/components/header/UserDropdown";
import { useFinancialData } from "@/contexts/FinancialContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Outlet } from "react-router-dom";

interface AppLayoutProps {
  title?: string;
  subtitle?: string;
}

export function AppLayout({ title: propTitle, subtitle: propSubtitle }: AppLayoutProps) {
  const { dateRange, setDateRange, setSelectedMonth } = useFinancialData();
  const { title: contextTitle, subtitle: contextSubtitle } = usePageTitle();

  // Use prop title if provided, otherwise use context title
  const title = propTitle || contextTitle;
  const subtitle = propSubtitle || contextSubtitle;
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      {/* Main Content */}
      <div className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm">
          <div>
            {title && (
              <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Global Date Filter */}
            <div className="hidden md:block">
              <DatePickerWithRange
                date={dateRange}
                onDateChange={(range) => {
                  setDateRange(range);
                  if (range?.from) setSelectedMonth(range.from);
                }}
              />
            </div>

            {/* Search */}
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="w-64 bg-secondary pl-10"
              />
            </div>

            {/* Notifications */}
            <NotificationsDropdown />

            {/* User */}
            <UserDropdown />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
