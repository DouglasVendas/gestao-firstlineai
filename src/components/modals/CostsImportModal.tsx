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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Upload, FileDown, Loader2, CheckCircle, AlertTriangle, X, Info } from "lucide-react";
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
    return candidates.some((candidate) => {
      const candidateKey = normalizeAccountKey(candidate);
      return candidateKey === key || candidateKey.includes(key) || key.includes(candidateKey);
    });
  }) || null;
}


function getErrorSummary(rows: ParsedUnifiedCostRow[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row._error) continue;
    for (const reason of row._error.split(";").map((item) => item.trim()).filter(Boolean)) {
      counts.set(reason, (counts.get(reason) || 0) + 1);
    }
  }
  return Array.from(counts.entries()).map(([reason, count]) => ({ reason, count }));
}

function availableAccountNames(accounts: CashAccount[]) {
  return accounts.map((account) => account.name).filter(Boolean).join(", ");
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
  const errorSummary = getErrorSummary(displayRows);
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
      <DialogContent className="w-[96vw] max-w-[1180px] h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle>Importar Custos e Despesas via Planilha</DialogTitle>
        </DialogHeader>

        <div className="h-[calc(90vh-88px)] overflow-y-auto px-6 pb-6 space-y-4">
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

        {displayRows.length > 0 && (
          <ImportValidationSummary
            rows={displayRows}
            errorSummary={errorSummary}
            accountNames={availableAccountNames(cashAccounts)}
          />
        )}

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
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImportValidationSummary({
  rows,
  errorSummary,
  accountNames,
}: {
  rows: ParsedUnifiedCostRow[];
  errorSummary: { reason: string; count: number }[];
  accountNames: string;
}) {
  const validCount = rows.filter((row) => !row._error).length;
  const errorCount = rows.filter((row) => row._error).length;

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_1.2fr]">
      <div className="rounded-lg border bg-muted/20 p-4">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-primary mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-medium">Validação do arquivo</p>
            <p className="text-muted-foreground">
              {validCount} linhas prontas para importar. {errorCount} linhas precisam correção.
            </p>
            {accountNames && (
              <p className="text-xs text-muted-foreground">Contas reconhecidas: {accountNames}</p>
            )}
          </div>
        </div>
      </div>

      {errorSummary.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive mb-2">Erros encontrados</p>
          <div className="space-y-1 text-sm">
            {errorSummary.map((item) => (
              <div key={item.reason} className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">{item.reason}</span>
                <Badge variant="destructive">{item.count}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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
      <div className="rounded-lg border">
        <ScrollArea className="h-[420px] w-full">
          <Table className="min-w-[1180px] table-fixed">
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className="w-[100px]">Tipo</TableHead>
                <TableHead className="w-[240px]">Nome</TableHead>
                <TableHead className="w-[190px]">Categoria</TableHead>
                <TableHead className="w-[110px] text-right">Valor</TableHead>
                <TableHead className="w-[110px]">Mês</TableHead>
                <TableHead className="w-[105px]">Venc.</TableHead>
                <TableHead className="w-[95px]">Status</TableHead>
                <TableHead className="w-[125px]">Pagamento</TableHead>
                <TableHead className="w-[150px]">Caixa</TableHead>
                <TableHead className="w-[270px]">Validação</TableHead>
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
                  <TableCell className="font-medium whitespace-normal break-words">{row.name || "-"}</TableCell>
                  <TableCell><Badge variant="outline" className="whitespace-normal text-left">{row.category || "-"}</Badge></TableCell>
                  <TableCell className="text-right">{row.amount ? `R$ ${row.amount.toLocaleString("pt-BR")}` : "-"}</TableCell>
                  <TableCell className="text-xs">{row.month || "-"}</TableCell>
                  <TableCell>{row.dueDay || "-"}</TableCell>
                  <TableCell>{row.status || "-"}</TableCell>
                  <TableCell>{row.paidAt || "-"}</TableCell>
                  <TableCell className="whitespace-normal break-words">{row.impactCash ? row.paymentAccountName || "-" : "Não"}</TableCell>
                  <TableCell>
                    {row._error ? (
                      <div className="flex items-start gap-2 text-xs text-destructive">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="whitespace-normal break-words">{row._error}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-success">
                        <CheckCircle className="h-4 w-4" /> OK
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
