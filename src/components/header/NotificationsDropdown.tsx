import { useState } from "react";
import { Bell, Check, AlertTriangle, Info, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "alert" | "info" | "success";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "alert",
    title: "Churn elevado detectado",
    message: "Taxa de churn subiu para 4.2% este mês",
    time: "Há 5 min",
    read: false,
  },
  {
    id: "2",
    type: "success",
    title: "Meta de MRR atingida",
    message: "Parabéns! Você atingiu R$ 500k de MRR",
    time: "Há 1 hora",
    read: false,
  },
  {
    id: "3",
    type: "info",
    title: "Novo cliente adicionado",
    message: "Tech Solutions Ltda foi cadastrado",
    time: "Há 2 horas",
    read: false,
  },
  {
    id: "4",
    type: "alert",
    title: "Fatura atrasada",
    message: "Cliente ABC Corp tem fatura vencida há 15 dias",
    time: "Há 3 horas",
    read: true,
  },
  {
    id: "5",
    type: "info",
    title: "Relatório gerado",
    message: "Relatório mensal de Janeiro está disponível",
    time: "Ontem",
    read: true,
  },
];

const typeIcons = {
  alert: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const typeColors = {
  alert: "text-destructive",
  info: "text-primary",
  success: "text-success",
};

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllAsRead}
            >
              <Check className="mr-1 h-3 w-3" />
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = typeIcons[notification.type];
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 p-3",
                    !notification.read && "bg-muted/50"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <Icon
                    className={cn("mt-0.5 h-4 w-4", typeColors[notification.type])}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {notification.time}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </DropdownMenuItem>
              );
            })
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-primary">
          Ver todas as notificações
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
