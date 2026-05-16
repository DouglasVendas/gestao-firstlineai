import { useMemo, useState } from "react";
import { Building2, CreditCard, Loader2, Plus, RefreshCw, Wallet } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  CashAccountType,
  useCashSummary,
  useCreateCashAccount,
  useCreateCashTransfer,
} from "@/hooks/useCashAccounts";
import { formatCurrency, formatDate } from "@/lib/formatters";

function accountTypeLabel(type: CashAccountType) {
  const labels: Record<CashAccountType, string> = {
    bank: "Banco",
    gateway: "Gateway",
    cash: "Dinheiro",
    other: "Outro",
  };
  return labels[type];
}

function typeIcon(type: CashAccountType) {
  if (type === "gateway") return <CreditCard className="h-5 w-5" />;
  if (type === "bank") return <Building2 className="h-5 w-5" />;
  return <Wallet className="h-5 w-5" />;
}

export function CashContent() {
  const { accountsWithBalance, movements, totalCashBalance, isLoading } = useCashSummary();
  const createAccount = useCreateCashAccount();
  const createTransfer = useCreateCashTransfer();
  const { toast } = useToast();

  const [accountOpen, setAccountOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [accountForm, setAccountForm] = useState({
    type: "bank" as CashAccountType,
    name: "",
    bank_name: "",
    agency: "",
    account_number: "",
    initial_balance: 0,
    initial_balance_date: new Date().toISOString().slice(0, 10),
  });
  const [transferForm, setTransferForm] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    description: "",
  });

  const activeAccounts = useMemo(() => accountsWithBalance.filter((account) => account.active), [accountsWithBalance]);
  const gatewayBalance = activeAccounts
    .filter((account) => account.type === "gateway")
    .reduce((sum, account) => sum + account.current_balance, 0);
  const bankBalance = activeAccounts
    .filter((account) => account.type === "bank")
    .reduce((sum, account) => sum + account.current_balance, 0);

  const handleCreateAccount = () => {
    createAccount.mutate(
      {
        ...accountForm,
        initial_balance: Number(accountForm.initial_balance || 0),
        bank_name: accountForm.bank_name || null,
        agency: accountForm.agency || null,
        account_number: accountForm.account_number || null,
      },
      {
        onSuccess: () => {
          toast({ title: "Conta criada", description: "A conta financeira foi adicionada ao caixa." });
          setAccountOpen(false);
          setAccountForm({
            type: "bank",
            name: "",
            bank_name: "",
            agency: "",
            account_number: "",
            initial_balance: 0,
            initial_balance_date: new Date().toISOString().slice(0, 10),
          });
        },
        onError: (error) => toast({ variant: "destructive", title: "Erro ao criar conta", description: error.message }),
      },
    );
  };

  const handleCreateTransfer = () => {
    createTransfer.mutate(
      {
        ...transferForm,
        amount: Number(transferForm.amount || 0),
        description: transferForm.description || "Transferência entre contas",
      },
      {
        onSuccess: () => {
          toast({ title: "Transferência registrada", description: "Os saldos das contas foram atualizados." });
          setTransferOpen(false);
          setTransferForm({
            fromAccountId: "",
            toAccountId: "",
            amount: 0,
            date: new Date().toISOString().slice(0, 10),
            description: "",
          });
        },
        onError: (error) => toast({ variant: "destructive", title: "Erro na transferência", description: error.message }),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Caixa e Contas</h2>
          <p className="text-sm text-muted-foreground">
            Controle de saldo por banco, gateway e transferências entre contas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Transferir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Transferência entre contas</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Conta de origem</Label>
                    <Select value={transferForm.fromAccountId} onValueChange={(value) => setTransferForm((form) => ({ ...form, fromAccountId: value }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{activeAccounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Conta de destino</Label>
                    <Select value={transferForm.toAccountId} onValueChange={(value) => setTransferForm((form) => ({ ...form, toAccountId: value }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{activeAccounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input type="number" step="0.01" value={transferForm.amount} onChange={(e) => setTransferForm((form) => ({ ...form, amount: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input type="date" value={transferForm.date} onChange={(e) => setTransferForm((form) => ({ ...form, date: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={transferForm.description} onChange={(e) => setTransferForm((form) => ({ ...form, description: e.target.value }))} placeholder="Ex: Saque Asaas para C6 PJ" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateTransfer} disabled={createTransfer.isPending}>
                  {createTransfer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova conta financeira</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={accountForm.type} onValueChange={(value) => setAccountForm((form) => ({ ...form, type: value as CashAccountType }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank">Banco</SelectItem>
                        <SelectItem value="gateway">Gateway</SelectItem>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={accountForm.name} onChange={(e) => setAccountForm((form) => ({ ...form, name: e.target.value }))} placeholder="Ex: C6 Bank PJ, Asaas" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Banco</Label>
                    <Input value={accountForm.bank_name} onChange={(e) => setAccountForm((form) => ({ ...form, bank_name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Agência</Label>
                    <Input value={accountForm.agency} onChange={(e) => setAccountForm((form) => ({ ...form, agency: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Conta</Label>
                    <Input value={accountForm.account_number} onChange={(e) => setAccountForm((form) => ({ ...form, account_number: e.target.value }))} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Saldo atual</Label>
                    <Input type="number" step="0.01" value={accountForm.initial_balance} onChange={(e) => setAccountForm((form) => ({ ...form, initial_balance: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data do saldo</Label>
                    <Input type="date" value={accountForm.initial_balance_date} onChange={(e) => setAccountForm((form) => ({ ...form, initial_balance_date: e.target.value }))} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAccountOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateAccount} disabled={createAccount.isPending}>
                  {createAccount.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Saldo Total" value={formatCurrency(totalCashBalance)} icon={<Wallet className="h-6 w-6" />} description="Soma das contas ativas" variant="primary" allowPrivacy />
        <MetricCard title="Bancos" value={formatCurrency(bankBalance)} icon={<Building2 className="h-6 w-6" />} description="Contas bancárias ativas" variant="default" />
        <MetricCard title="Gateways" value={formatCurrency(gatewayBalance)} icon={<CreditCard className="h-6 w-6" />} description="Saldo em processadores" variant="warning" />
        <MetricCard title="Contas Ativas" value={String(activeAccounts.length)} icon={<Wallet className="h-6 w-6" />} description="Bancos, gateways e outros" variant="default" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contas Financeiras</CardTitle>
          <CardDescription>Saldo na data informada, ajustado apenas por movimentações posteriores.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Banco / Agência / Conta</TableHead>
                    <TableHead>Data de corte do saldo</TableHead>
                  <TableHead className="text-right">Saldo atual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountsWithBalance.length ? accountsWithBalance.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                          {typeIcon(account.type)}
                        </div>
                        <div>
                          <p className="font-medium">{account.name}</p>
                          {!account.active && <p className="text-xs text-muted-foreground">Inativa</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{accountTypeLabel(account.type)}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">
                      {[account.bank_name, account.agency, account.account_number].filter(Boolean).join(" / ") || "-"}
                    </TableCell>
                    <TableCell>{formatDate(account.initial_balance_date)}</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatCurrency(account.current_balance)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhuma conta cadastrada. Crie uma conta com o saldo real atual para o dashboard usar o saldo consolidado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimas Movimentações</CardTitle>
          <CardDescription>Rastro financeiro de recebimentos, pagamentos, transferências e ajustes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length ? movements.slice(0, 20).map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{formatDate(movement.movement_date)}</TableCell>
                    <TableCell>{movement.account?.name || "-"}</TableCell>
                    <TableCell>{movement.description}</TableCell>
                    <TableCell><Badge variant="secondary">{movement.source_type}</Badge></TableCell>
                    <TableCell className={`text-right font-mono font-medium ${movement.amount < 0 ? "text-destructive" : "text-success"}`}>
                      {formatCurrency(movement.amount)}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhuma movimentação de caixa registrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
