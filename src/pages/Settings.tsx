import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, Users, Plug, Bell, CreditCard } from "lucide-react";

const users = [
  { name: "João Silva", email: "joao@empresa.com", role: "Admin" },
  { name: "Maria Santos", email: "maria@empresa.com", role: "Financeiro" },
  { name: "Pedro Costa", email: "pedro@empresa.com", role: "Vendas" },
];

const integrations = [
  { name: "Stripe", status: "connected", icon: "💳" },
  { name: "Asaas", status: "connected", icon: "💰" },
  { name: "HubSpot", status: "pending", icon: "📊" },
  { name: "Slack", status: "disconnected", icon: "💬" },
];

export default function Settings() {
  return (
    <AppLayout title="Configurações" subtitle="Configurações do sistema e preferências">
      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList>
          <TabsTrigger value="empresa"><Building2 className="mr-2 h-4 w-4" />Empresa</TabsTrigger>
          <TabsTrigger value="usuarios"><Users className="mr-2 h-4 w-4" />Usuários</TabsTrigger>
          <TabsTrigger value="integracoes"><Plug className="mr-2 h-4 w-4" />Integrações</TabsTrigger>
          <TabsTrigger value="notificacoes"><Bell className="mr-2 h-4 w-4" />Notificações</TabsTrigger>
          <TabsTrigger value="plano"><CreditCard className="mr-2 h-4 w-4" />Plano</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <Card>
            <CardHeader><CardTitle>Dados da Empresa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Razão Social</Label><Input defaultValue="SaaS Metrics Corp LTDA" /></div>
                <div className="space-y-2"><Label>CNPJ</Label><Input defaultValue="12.345.678/0001-90" /></div>
              </div>
              <Button>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Usuários</CardTitle>
              <Button size="sm">Convidar Usuário</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((u, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                      <Avatar><AvatarFallback>{u.name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
                      <div><p className="font-medium">{u.name}</p><p className="text-sm text-muted-foreground">{u.email}</p></div>
                    </div>
                    <Badge variant="outline">{u.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integracoes">
          <Card>
            <CardHeader><CardTitle>Integrações</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {integrations.map((int, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{int.icon}</span>
                      <span className="font-medium">{int.name}</span>
                    </div>
                    <Badge variant={int.status === "connected" ? "default" : int.status === "pending" ? "secondary" : "outline"} className={int.status === "connected" ? "bg-success/10 text-success" : ""}>
                      {int.status === "connected" ? "Conectado" : int.status === "pending" ? "Pendente" : "Desconectado"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card>
            <CardHeader><CardTitle>Preferências de Notificação</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {["Alertas de Churn", "Faturas Atrasadas", "Metas Atingidas", "Relatórios Semanais"].map((n, i) => (
                <div key={i} className="flex items-center justify-between"><Label>{n}</Label><Switch defaultChecked={i < 2} /></div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plano">
          <Card>
            <CardHeader><CardTitle>Plano Atual</CardTitle><CardDescription>Gerencie sua assinatura</CardDescription></CardHeader>
            <CardContent>
              <div className="rounded-lg border-2 border-primary bg-primary/5 p-6">
                <div className="flex items-center justify-between">
                  <div><Badge className="mb-2">Plano Pro</Badge><p className="text-2xl font-bold">R$ 299/mês</p></div>
                  <Button variant="outline">Fazer Upgrade</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
