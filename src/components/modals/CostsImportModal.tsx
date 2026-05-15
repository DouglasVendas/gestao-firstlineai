import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileDown, Loader2, CheckCircle, AlertTriangle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { COST_CATEGORY_OPTIONS } from "@/lib/costCategories";
import {
  ParsedUnifiedCostRow,
  parseUnifiedCostRows,
  UNIFIED_COST_TEMPLATE_EXAMPLES,
  UNIFIED_COST_TEMPLATE_HEADERS,
} from "@/lib/costImport";
import { useAuth } from "@/contexts/auth/AuthContext";
import { resolveActiveOrganizationId } from "@/hooks/useCostAttachments";
import { CashAccount, upsertCashMovement, useCashAccounts } from "@/hooks/useCashAccounts";

function downloadUnifiedTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([UNIFIED_COST_TEMPLATE_HEADERS, ...UNIFIED_COST_TEMPLATE_EXAMPLES]);
  ws["!cols"] = UNIFIED_COST_TEMPLATE_HEADERS.map((header) => ({ wch: Math.max(header.length + 4, 18) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Custos e Despesas");
  XLSX.writeFile(wb, "template_custos_despesas.xlsx");
}

function readFile(file: File, onDone: (rows: ParsedUnifiedCostRow[]) => void) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => onDone(parseUnifiedCostRows(result.data as Record<string, unknown>[])),
    });
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const wb = XLSX.read(e.target?.result, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Record<string, unknown>[];
    onDone(parseUnifiedCostRows(data));
  };
  reader.readAsArrayBuffer(file);
}

function normalizeAccountKey(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findPaymentAccount(accounts: CashAccount[], name?: string | null) {
  const key = normalizeAccountKey(name);
  if (!key) return null;
  return accounts.find((account) => {
    const candidates = [
      account.name,
      account.bank_name,
      [account.bank_name, account.account_number].filter(Boolean).join(" "),
    ];
    return candidates.some((candidate) => normalizeAccountKey(candidate) === key);
  }) || null;
}

function buildDueDate(month: string, dueDay: number | null) {
  const [year, monthNumber] = month.slice(0, 10).split("-").map(Number);
  const safeDay = Math.min(Math.max(dueDay || 1, 1), new Date(year, monthNumber, 0).getDate());
  return `${year}-${String(monthNumber).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

export function CostsImportModal() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedUnifiedCostRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organizationId, user } = useAuth();
  const { data: cashAccounts = [] } = useCashAccounts();

  const displayRows = useMemo(() => rows.map((row) => {
    if (!row.impactCash || row._error) return row;
    const account = findPaymentAccount(cashAccounts, row.paymentAccountName);
    if (account) return row;
    return {
      ...row,
      _error: `Conta de pagamento não encontrada: ${row.paymentAccountName || "não informada"}`,
    };
  }), [cashAccounts, rows]);

  const reset = () => {
    setRows([]);
    setDone(false);
  };

  const handleImport = async () => {
    setImporting(true);
    let success = 0;
    const errors: string[] = [];

    const orgId = await resolveActiveOrganizationId(organizationId);
    if (!orgId) {
      setImporting(false);
      toast({
        variant: "destructive",
        title: "Organização não identificada",
        description: "Não foi possível importar custos sem organização ativa.",
      });
      return;
    }

    for (const row of displayRows.filter((item) => !item._error)) {
      const paymentAccount = row.impactCash ? findPaymentAccount(cashAccounts, row.paymentAccountName) : null;
      if (row.type === "fixed") {
        const { data, error } = await supabase.from("recurring_fixed_costs" as any).insert({
          organization_id: orgId,
          category: row.category,
          name: row.name,
          description: row.description,
          amount: row.amount,
          start_date: row.month,
          due_date_day: row.dueDay || 1,
          status: "active",
          active: true,
        } as any).select().single();
        if (error) {
          errors.push(`${row.name}: ${error.message}`);
        } else {
          if (row.status === "paid") {
            const dueDate = buildDueDate(row.month, row.dueDay);
            const { data: payment, error: paymentError } = await supabase.from("fixed_cost_payments" as any).insert({
              recurring_fixed_cost_id: data.id,
              organization_id: orgId,
              reference_month: row.month,
              due_date: dueDate,
              amount: row.amount,
              status: "paid",
              paid_at: row.paidAt,
              cash_account_id: paymentAccount?.id || null,
              notes: row.description,
              created_by: user?.id || null,
            } as any).select().single();
            if (paymentError) {
              errors.push(`${row.name}: ${paymentError.message}`);
              continue;
            }
            if (row.impactCash && paymentAccount) {
              await upsertCashMovement({
                cashAccountId: paymentAccount.id,
                movementType: "expense",
                amount: -Math.abs(Number(row.amount)),
                movementDate: row.paidAt || row.month,
                description: row.name,
                sourceType: "fixed_cost_payment",
                sourceId: payment.id,
                organizationId: orgId,
                userId: user?.id,
              });
            }
          }
          success++;
        }
      } else {
        const { data, error } = await supabase.from("variable_costs").insert({
          organization_id: orgId,
          category: row.category,
          name: row.name,
          amount: row.amount,
          month: row.month,
          description: row.description,
          status: row.status,
          paid_at: row.status === "paid" ? row.paidAt : null,
          cash_account_id: row.impactCash ? paymentAccount?.id || null : null,
        } as any).select().single();
        if (error) {
          errors.push(`${row.name}: ${error.message}`);
        } else {
          if (row.status === "paid" && row.impactCash && paymentAccount) {
            await upsertCashMovement({
              cashAccountId: paymentAccount.id,
              movementType: "expense",
              amount: -Math.abs(Number(row.amount)),
              movementDate: row.paidAt || row.month,
              description: row.name || row.description || "Pagamento de custo variável",
              sourceType: "variable_cost",
              sourceId: data.id,
              organizationId: orgId,
              userId: user?.id,
            });
          }
          success++;
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ["fixed_costs"] });
    queryClient.invalidateQueries({ queryKey: ["variable_costs"] });
    queryClient.invalidateQueries({ queryKey: ["cash_accounts"] });
    queryClient.invalidateQueries({ queryKey: ["cash_movements"] });

    setImporting(false);
    setDone(true);
    toast({
      title: "Importação concluída",
      description: `${success} registros importados${errors.length ? `, ${errors.length} com erro. ${errors.slice(0, 3).join(" | ")}` : ""}.`,
      variant: errors.length ? "destructive" : "default",
    });
    if (!errors.length) setTimeout(() => setOpen(false), 1500);
  };

  const validCount = displayRows.filter((row) => !row._error).length;
  const errorCount = displayRows.filter((row) => row._error).length;
  const fixedCount = displayRows.filter((row) => !row._error && row.type === "fixed").length;
  const variableCount = displayRows.filter((row) => !row._error && row.type === "variable").length;

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Importar Custos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[820px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Custos e Despesas via Planilha</DialogTitle>
        </DialogHeader>

        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-sm font-medium">1. Baixe o template unificado e preencha os dados</p>
          <p className="text-xs text-muted-foreground">
            Colunas: tipo, nome, categoria, valor, mes, dia_vencimento, descricao, status, data_pagamento, conta_pagamento, impactar_caixa
          </p>
          <p className="text-xs text-muted-foreground">
            Tipo aceita: fixo ou variavel. Se status for pago, informe data_pagamento. Para gerar caixa, use impactar_caixa = sim e informe conta_pagamento.
          </p>
          <p className="text-xs text-muted-foreground">
            Categorias válidas: {COST_CATEGORY_OPTIONS.join(", ")}
          </p>
          <Button variant="outline" size="sm" onClick={downloadUnifiedTemplate}>
            <FileDown className="mr-2 h-4 w-4" />
            Baixar Template Unificado (.xlsx)
          </Button>
        </div>

        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-sm font-medium">2. Faça upload do arquivo preenchido</p>
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files[0];
              if (file) readFile(file, (parsed) => { setRows(parsed); setDone(false); });
            }}
          >
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Clique ou arraste o arquivo (.xlsx, .xls, .csv)</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) readFile(file, (parsed) => { setRows(parsed); setDone(false); });
              }}
            />
          </div>
        </div>

        {displayRows.length > 0 && <UnifiedPreview rows={displayRows} onClear={() => setRows([])} />}

        {displayRows.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {validCount} registros válidos
                <span className="text-muted-foreground ml-2">({fixedCount} fixos, {variableCount} variáveis)</span>
                {errorCount > 0 && <span className="text-destructive ml-2">· {errorCount} com erro</span>}
              </span>
            </div>
            {done ? (
              <div className="flex items-center gap-2 text-success text-sm font-medium">
                <CheckCircle className="h-4 w-4" /> Importação concluída!
              </div>
            ) : (
              <Button className="w-full" onClick={handleImport} disabled={importing || validCount === 0}>
                {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Importar {validCount} registros
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function UnifiedPreview({ rows, onClear }: { rows: ParsedUnifiedCostRow[]; onClear: () => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Prévia dos dados</p>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4 mr-1" /> Limpar
        </Button>
      </div>
      <div className="rounded-lg border overflow-auto max-h-[280px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Mês</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Caixa</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={`${row.name}-${index}`} className={row._error ? "bg-destructive/5" : ""}>
                <TableCell>
                  <Badge variant={row.type === "fixed" ? "default" : "outline"}>
                    {row.type === "fixed" ? "Fixo" : "Variável"}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{row.name || "-"}</TableCell>
                <TableCell><Badge variant="outline">{row.category || "-"}</Badge></TableCell>
                <TableCell className="text-right">{row.amount ? `R$ ${row.amount.toLocaleString("pt-BR")}` : "-"}</TableCell>
                <TableCell className="text-xs">{row.month || "-"}</TableCell>
                <TableCell>{row.dueDay || "-"}</TableCell>
                <TableCell>{row.status || "-"}</TableCell>
                <TableCell>{row.paidAt || "-"}</TableCell>
                <TableCell>{row.impactCash ? row.paymentAccountName || "-" : "Não"}</TableCell>
                <TableCell>
                  {row._error
                    ? <AlertTriangle className="h-4 w-4 text-destructive" aria-label={row._error} />
                    : <CheckCircle className="h-4 w-4 text-success" />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
