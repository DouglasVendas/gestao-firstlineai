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
import { Loader2 } from "lucide-react";
import { useUpdateInvoice } from "@/hooks/useUpdateInvoice";
import { useToast } from "@/hooks/use-toast";

interface RegisterPaymentModalProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegisterPaymentModal({ invoiceId, open, onOpenChange }: RegisterPaymentModalProps) {
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);
  const updateInvoice = useUpdateInvoice();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!invoiceId) return;

    updateInvoice.mutate(
      { id: invoiceId, status: "paid", paid_date: paidDate },
      {
        onSuccess: () => {
          toast({ title: "Pagamento registrado", description: "Fatura marcada como paga." });
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={updateInvoice.isPending}>
            {updateInvoice.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
