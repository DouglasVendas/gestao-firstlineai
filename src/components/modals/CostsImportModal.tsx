import { useRef, useState } from "react";
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

function normalizeVariableStatus(status: string | null) {
  const normalized = (status || "pending").toLowerCase().trim();
  if (["pago", "paid"].includes(normalized)) return "paid";
  if (["cancelado", "canceled", "cancelled"].includes(normalized)) return "canceled";
  return "pending";
}

export function CostsImportModal() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedUnifiedCostRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();

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

    for (const row of rows.filter((item) => !item._error)) {
      if (row.type === "fixed") {
        const { error } = await supabase.from("recurring_fixed_costs" as any).insert({
          organization_id: orgId,
          category: row.category,
          name: row.name,
          description: row.description,
          amount: row.amount,
          start_date: row.month,
          due_date_day: row.dueDay || 1,
          status: "active",
          active: true,
        } as any);
        if (error) errors.push(`${row.name}: ${error.message}`); else success++;
      } else {
        const { error } = await supabase.from("variable_costs").insert({
          organization_id: orgId,
          category: row.category,
          name: row.name,
          amount: row.amount,
          month: row.month,
          description: row.description,
          status: normalizeVariableStatus(row.status),
        } as any);
        if (error) errors.push(`${row.name}: ${error.message}`); else success++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ["fixed_costs"] });
    queryClient.invalidateQueries({ queryKey: ["variable_costs"] });
    queryClient.invalidateQueries({ queryKey: ["cash_accounts"] });

    setImporting(false);
    setDone(true);
    toast({
      title: "Importação concluída",
      description: `${success} registros importados${errors.length ? `, ${errors.length} com erro. ${errors.slice(0, 3).join(" | ")}` : ""}.`,
      variant: errors.length ? "destructive" : "default",
    });
    if (!errors.length) setTimeout(() => setOpen(false), 1500);
  };

  const validCount = rows.filter((row) => !row._error).length;
  const errorCount = rows.filter((row) => row._error).length;
  const fixedCount = rows.filter((row) => !row._error && row.type === "fixed").length;
  const variableCount = rows.filter((row) => !row._error && row.type === "variable").length;

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
            Colunas: tipo, nome, categoria, valor, mes (YYYY-MM-DD), dia_vencimento, descricao, status
          </p>
          <p className="text-xs text-muted-foreground">
            Tipo aceita: fixo ou variavel. Dia de vencimento é obrigatório apenas para fixos.
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

        {rows.length > 0 && <UnifiedPreview rows={rows} onClear={() => setRows([])} />}

        {rows.length > 0 && (
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
