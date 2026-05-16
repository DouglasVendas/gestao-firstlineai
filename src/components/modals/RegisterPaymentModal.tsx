import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useUpdateInvoice } from "@/hooks/useUpdateInvoice";
import { useCreateInvoice } from "@/hooks/useInvoices";
import { useToast } from "@/hooks/use-toast";
import { useCashSummary, useUpsertCashMovement } from "@/hooks/useCashAccounts";

interface RegisterPaymentModalProps {
  invoiceId: string | null;
  computedInvoice?: { client_id: string; value: number; due_date: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegisterPaymentModal({ invoiceId, computedInvoice, open, onOpenChange }: RegisterPaymentModalProps) {
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);
  const [cashAccountId, setCashAccountId] = useState("");
  const updateInvoice = useUpdateInvoice();
  const createInvoice = useCreateInvoice();
  const { accountsWithBalance } = useCashSummary();
  const upsertCashMovement = useUpsertCashMovement();
  const { toast } = useToast();

  const isPending = updateInvoice.isPending || createInvoice.isPending || upsertCashMovement.isPending;

  const handleSubmit = () => {
    if (!cashAccountId) {
      toast({ variant: "destructive", title: "Conta obrigatória", description: "Informe em qual conta o dinheiro entrou." });
      return;
    }

    if (invoiceId) {
      updateInvoice.mutate(
        { id: invoiceId, status: "paid", paid_date: paidDate, cash_account_id: cashAccountId },
        {
          onSuccess: async (invoice) => {
            await upsertCashMovement.mutateAsync({
              cashAccountId,
              movementType: "income",
              amount: Number(invoice.value),
              movementDate: paidDate,
              description: "Recebimento de fatura",
              sourceType: "invoice",
              sourceId: invoice.id,
            });
            toast({ title: "Pagamento registrado", description: "Fatura marcada como paga." });
            onOpenChange(false);
            setCashAccountId("");
          },
          onError: (error) => {
            toast({ variant: "destructive", title: "Erro", description: error.message });
          },
        }
      );
    } else if (computedInvoice) {
      createInvoice.mutate(
        {
          client_id: computedInvoice.client_id,
          value: computedInvoice.value,
          due_date: computedInvoice.due_date,
          status: "paid",
          paid_date: paidDate,
          cash_account_id: cashAccountId,
        },
        {
          onSuccess: async (invoice) => {
            await upsertCashMovement.mutateAsync({
              cashAccountId,
              movementType: "income",
              amount: Number(invoice.value),
              movementDate: paidDate,
              description: `Recebimento de cliente`,
              sourceType: "invoice",
              sourceId: invoice.id,
            });
            toast({ title: "Pagamento registrado", description: "Fatura criada e marcada como paga." });
            onOpenChange(false);
            setCashAccountId("");
          },
          onError: (error) => {
            toast({ variant: "destructive", title: "Erro", description: error.message });
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>Informe a data do pagamento recebido.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Data do Pagamento</Label>
            <Input
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Conta de recebimento</Label>
            <Select value={cashAccountId} onValueChange={setCashAccountId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {accountsWithBalance.filter((account) => account.active).map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
