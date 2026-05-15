import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileDown, Loader2, CheckCircle, AlertTriangle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { COST_CATEGORY_OPTIONS, normalizeCostCategory } from "@/lib/costCategories";
import { useAuth } from "@/contexts/auth/AuthContext";
import { resolveActiveOrganizationId } from "@/hooks/useCostAttachments";

// ─── Fixed Costs ───────────────────────────────────────────────────────────────

const FIXED_HEADERS = ["nome", "categoria", "descricao", "valor_orcado", "valor_realizado", "mes", "dia_vencimento"];
const FIXED_EXAMPLE = ["Folha", "Pessoas", "Folha de pagamento", "85000", "84000", "2024-01-01", "5"];

const VARIABLE_HEADERS = ["nome", "categoria", "valor", "mes", "descricao"];
const VARIABLE_EXAMPLE = ["Google Ads", "Comercial e Marketing", "12000", "2024-01-01", "Campanha principal"];

function downloadFixedTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([FIXED_HEADERS, FIXED_EXAMPLE]);
  ws["!cols"] = FIXED_HEADERS.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Custos Fixos");
  XLSX.writeFile(wb, "template_custos_fixos.xlsx");
}

function downloadVariableTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([VARIABLE_HEADERS, VARIABLE_EXAMPLE]);
  ws["!cols"] = VARIABLE_HEADERS.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Custos Variáveis");
  XLSX.writeFile(wb, "template_custos_variaveis.xlsx");
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ParsedFixed {
  name: string;
  category: string;
  description: string | null;
  budgeted: number;
  actual: number;
  month: string;
  due_day: number | null;
  _error?: string;
}

interface ParsedVariable {
  name: string;
  category: string;
  amount: number;
  month: string;
  description: string | null;
  _error?: string;
}

// ─── Parsers ───────────────────────────────────────────────────────────────────

function parseFixedRows(raw: any[]): ParsedFixed[] {
  return raw.map((row) => {
    const get = (key: string) => {
      const found = Object.keys(row).find((k) => k.toLowerCase().trim() === key);
      return found ? String(row[found] ?? "").trim() : "";
    };

    const category = get("categoria");
    if (!category) return { ...({} as ParsedFixed), _error: "Categoria obrigatória" };
    const name = get("nome") || get("descricao") || category;

    const normalizedCategory = normalizeCostCategory(category);

    const budgeted = parseFloat(get("valor_orcado").replace(",", ".")) || 0;
    const actual = parseFloat(get("valor_realizado").replace(",", ".")) || 0;
    const month = get("mes") || null;
    if (!month) return { ...({} as ParsedFixed), category, _error: "Mês obrigatório" };

    const dueDayRaw = get("dia_vencimento");
    const due_day = dueDayRaw ? parseInt(dueDayRaw) : null;

    return {
      category: normalizedCategory,
      name,
      description: get("descricao") || null,
      budgeted,
      actual,
      month,
      due_day: due_day && due_day >= 1 && due_day <= 31 ? due_day : null,
    };
  }).filter((r) => r.category);
}

function parseVariableRows(raw: any[]): ParsedVariable[] {
  return raw.map((row) => {
    const get = (key: string) => {
      const found = Object.keys(row).find((k) => k.toLowerCase().trim() === key);
      return found ? String(row[found] ?? "").trim() : "";
    };

    const category = get("categoria");
    if (!category) return { ...({} as ParsedVariable), _error: "Categoria obrigatória" };
    const name = get("nome") || get("descricao") || category;

    const amount = parseFloat(get("valor").replace(",", ".")) || 0;
    const month = get("mes") || null;
    if (!month) return { ...({} as ParsedVariable), category, _error: "Mês obrigatório" };

    return {
      category: normalizeCostCategory(category),
      name,
      amount,
      month,
      description: get("descricao") || null,
    };
  }).filter((r) => r.category);
}

// ─── Shared file handler ────────────────────────────────────────────────────────

function readFile<T>(file: File, parser: (raw: any[]) => T[], onDone: (rows: T[]) => void) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => onDone(parser(result.data)),
    });
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target?.result, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
      onDone(parser(data));
    };
    reader.readAsArrayBuffer(file);
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface CostsImportModalProps {
  defaultTab?: "fixed" | "variable";
}

export function CostsImportModal({ defaultTab = "fixed" }: CostsImportModalProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"fixed" | "variable">(defaultTab);

  const [fixedRows, setFixedRows] = useState<ParsedFixed[]>([]);
  const [variableRows, setVariableRows] = useState<ParsedVariable[]>([]);

  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  const fixedRef = useRef<HTMLInputElement>(null);
  const variableRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();

  const reset = () => { setFixedRows([]); setVariableRows([]); setDone(false); };

  const handleImport = async () => {
    setImporting(true);
    let success = 0;
    let errors = 0;
    const orgId = await resolveActiveOrganizationId(organizationId);
    if (!orgId) {
      setImporting(false);
      toast({ variant: "destructive", title: "Organização não identificada", description: "Não foi possível importar custos sem organização ativa." });
      return;
    }

    if (tab === "fixed") {
      for (const row of fixedRows.filter((r) => !r._error)) {
        const { error } = await supabase.from("recurring_fixed_costs" as any).insert({
          organization_id: orgId,
          category: row.category,
          name: row.name,
          description: row.description,
          amount: row.actual || row.budgeted,
          start_date: row.month,
          due_date_day: row.due_day || 1,
          status: "active",
          active: true,
        } as any);
        if (error) errors++; else success++;
      }
      queryClient.invalidateQueries({ queryKey: ["fixed_costs"] });
    } else {
      for (const row of variableRows.filter((r) => !r._error)) {
        const { error } = await supabase.from("variable_costs").insert({
          organization_id: orgId,
          category: row.category,
          name: row.name,
          amount: row.amount,
          month: row.month,
          description: row.description,
        } as any);
        if (error) errors++; else success++;
      }
      queryClient.invalidateQueries({ queryKey: ["variable_costs"] });
    }

    setImporting(false);
    setDone(true);
    toast({
      title: "Importação concluída",
      description: `${success} registros importados${errors ? `, ${errors} com erro` : ""}.`,
    });
    if (!errors) setTimeout(() => setOpen(false), 1500);
  };

  const activeRows = tab === "fixed" ? fixedRows : variableRows;
  const validCount = activeRows.filter((r) => !r._error).length;
  const errorCount = activeRows.filter((r) => r._error).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { reset(); setTab(defaultTab); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Importar Custos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Custos via Planilha</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as "fixed" | "variable"); reset(); }}>
          <TabsList className="w-full">
            <TabsTrigger value="fixed" className="flex-1">Custos Fixos</TabsTrigger>
            <TabsTrigger value="variable" className="flex-1">Custos Variáveis</TabsTrigger>
          </TabsList>

          {/* ── Fixed Costs Tab ── */}
          <TabsContent value="fixed" className="space-y-4 mt-4">
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-medium">1. Baixe o template e preencha os dados</p>
              <p className="text-xs text-muted-foreground">
                Colunas: nome, categoria, descricao, valor_orcado, valor_realizado, mes (YYYY-MM-DD), dia_vencimento
              </p>
              <p className="text-xs text-muted-foreground">
                Categorias válidas: {COST_CATEGORY_OPTIONS.join(", ")}
              </p>
              <Button variant="outline" size="sm" onClick={downloadFixedTemplate}>
                <FileDown className="mr-2 h-4 w-4" />
                Baixar Template Custos Fixos (.xlsx)
              </Button>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-medium">2. Faça upload do arquivo preenchido</p>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fixedRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) readFile(f, parseFixedRows, setFixedRows);
                }}
              >
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Clique ou arraste o arquivo (.xlsx, .xls, .csv)</p>
                <input
                  ref={fixedRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) readFile(f, parseFixedRows, setFixedRows);
                  }}
                />
              </div>
            </div>

            {fixedRows.length > 0 && (
              <FixedPreview rows={fixedRows} onClear={() => setFixedRows([])} />
            )}
          </TabsContent>

          {/* ── Variable Costs Tab ── */}
          <TabsContent value="variable" className="space-y-4 mt-4">
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-medium">1. Baixe o template e preencha os dados</p>
              <p className="text-xs text-muted-foreground">
                Colunas: nome, categoria, valor, mes (YYYY-MM-DD), descricao
              </p>
              <Button variant="outline" size="sm" onClick={downloadVariableTemplate}>
                <FileDown className="mr-2 h-4 w-4" />
                Baixar Template Custos Variáveis (.xlsx)
              </Button>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-medium">2. Faça upload do arquivo preenchido</p>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => variableRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) readFile(f, parseVariableRows, setVariableRows);
                }}
              >
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Clique ou arraste o arquivo (.xlsx, .xls, .csv)</p>
                <input
                  ref={variableRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) readFile(f, parseVariableRows, setVariableRows);
                  }}
                />
              </div>
            </div>

            {variableRows.length > 0 && (
              <VariablePreview rows={variableRows} onClear={() => setVariableRows([])} />
            )}
          </TabsContent>
        </Tabs>

        {/* Import button — shown when any rows are loaded */}
        {activeRows.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {validCount} registros válidos
                {errorCount > 0 && (
                  <span className="text-destructive ml-2">· {errorCount} com erro</span>
                )}
              </span>
            </div>
            {done ? (
              <div className="flex items-center gap-2 text-success text-sm font-medium">
                <CheckCircle className="h-4 w-4" /> Importação concluída!
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={handleImport}
                disabled={importing || validCount === 0}
              >
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

// ─── Preview sub-components ────────────────────────────────────────────────────

function FixedPreview({ rows, onClear }: { rows: ParsedFixed[]; onClear: () => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Prévia dos dados</p>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4 mr-1" /> Limpar
        </Button>
      </div>
      <div className="rounded-lg border overflow-auto max-h-[220px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Orçado</TableHead>
              <TableHead className="text-right">Realizado</TableHead>
              <TableHead>Mês</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i} className={row._error ? "bg-destructive/5" : ""}>
                <TableCell className="font-medium">{row.name || "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{row.category || "—"}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{row.description || "—"}</TableCell>
                <TableCell className="text-right">
                  {row.budgeted ? `R$ ${row.budgeted.toLocaleString("pt-BR")}` : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.actual ? `R$ ${row.actual.toLocaleString("pt-BR")}` : "—"}
                </TableCell>
                <TableCell className="text-xs">{row.month || "—"}</TableCell>
                <TableCell>
                  {row._error
                    ? <AlertTriangle className="h-4 w-4 text-destructive" title={row._error} />
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

function VariablePreview({ rows, onClear }: { rows: ParsedVariable[]; onClear: () => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Prévia dos dados</p>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4 mr-1" /> Limpar
        </Button>
      </div>
      <div className="rounded-lg border overflow-auto max-h-[220px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Mês</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i} className={row._error ? "bg-destructive/5" : ""}>
                <TableCell className="font-medium">{row.name || "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{row.category || "—"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {row.amount ? `R$ ${row.amount.toLocaleString("pt-BR")}` : "—"}
                </TableCell>
                <TableCell className="text-xs">{row.month || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{row.description || "—"}</TableCell>
                <TableCell>
                  {row._error
                    ? <AlertTriangle className="h-4 w-4 text-destructive" title={row._error} />
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
