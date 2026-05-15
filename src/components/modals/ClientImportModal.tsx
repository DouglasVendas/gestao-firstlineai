import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileDown, Loader2, CheckCircle, AlertTriangle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlans } from "@/hooks/usePlans";
import { useAuth } from "@/contexts/auth/AuthContext";

const TEMPLATE_HEADERS = [
  "nome", "email", "plano", "ciclo_cobranca", "mrr", "status",
  "data_inicio", "produtos", "motivo_churn", "data_churn",
];

const TEMPLATE_EXAMPLE = [
  "Empresa Exemplo", "contato@empresa.com", "Pro", "monthly", "2990",
  "active", "2024-01-15", "CRM,Auditoria", "", "",
];

const CICLO_MAP: Record<string, string> = {
  mensal: "monthly", monthly: "monthly",
  bimestral: "bimonthly", bimonthly: "bimonthly",
  trimestral: "quarterly", quarterly: "quarterly",
  semestral: "semiannual", semiannual: "semiannual",
  anual: "yearly", yearly: "yearly",
};

const STATUS_MAP: Record<string, string> = {
  ativo: "active", active: "active",
  trial: "trial",
  cancelado: "churned", churned: "churned",
  inativo: "inactive", inactive: "inactive",
};

interface ParsedRow {
  name: string;
  email: string | null;
  plan_name: string;
  billing_cycle: string;
  mrr: number;
  status: string;
  start_date: string | null;
  products: string[];
  churn_reason: string | null;
  churn_date: string | null;
  _error?: string;
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_EXAMPLE]);
  ws["!cols"] = TEMPLATE_HEADERS.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clientes");
  XLSX.writeFile(wb, "template_clientes.xlsx");
}

function parseRows(raw: any[]): ParsedRow[] {
  return raw.map((row) => {
    const get = (key: string) => {
      const found = Object.keys(row).find(
        (k) => k.toLowerCase().trim() === key.toLowerCase()
      );
      return found ? String(row[found] ?? "").trim() : "";
    };

    const name = get("nome");
    if (!name) return { ...({} as ParsedRow), _error: "Nome obrigatório" };

    const billing_cycle = CICLO_MAP[get("ciclo_cobranca").toLowerCase()] || "monthly";
    const status = STATUS_MAP[get("status").toLowerCase()] || "active";
    const mrr = parseFloat(get("mrr").replace(",", ".")) || 0;
    const productsRaw = get("produtos");
    const products = productsRaw
      ? productsRaw.split(",").map((p) => p.trim()).filter(Boolean)
      : [];

    const start_date = get("data_inicio") || null;
    const churn_date = get("data_churn") || null;
    const churn_reason = get("motivo_churn") || null;

    return {
      name,
      email: get("email") || null,
      plan_name: get("plano"),
      billing_cycle,
      mrr,
      status,
      start_date,
      products,
      churn_reason,
      churn_date,
    };
  }).filter((r) => r.name);
}

export function ClientImportModal() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: plans } = usePlans();
  const { organizationId } = useAuth();

  const resolveOrganizationId = async (): Promise<string | null> => {
    if (organizationId) return organizationId;

    const { data: fsData } = await supabase
      .from("financial_settings")
      .select("organization_id")
      .limit(1)
      .maybeSingle();
    if (fsData?.organization_id) return fsData.organization_id;

    const { data: clientData } = await supabase
      .from("clients")
      .select("organization_id")
      .limit(1)
      .maybeSingle();
    if (clientData?.organization_id) return clientData.organization_id;

    return null;
  };

  const handleFile = (file: File) => {
    setDone(false);
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => setRows(parseRows(result.data)),
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        setRows(parseRows(data));
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleImport = async () => {
    const orgId = await resolveOrganizationId();
    if (!orgId) {
      toast({
        title: "Organização não identificada",
        description: "Não foi possível resolver organization_id para este usuário.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    const validRows = rows.filter((r) => !r._error);
    let success = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    for (const row of validRows) {
      let plan_id: string | null = null;
      if (row.plan_name && plans) {
        const plan = plans.find(
          (p) => p.name.toLowerCase() === row.plan_name.toLowerCase()
        );
        plan_id = plan?.id ?? null;
      }

      const { error } = await supabase.from("clients").insert({
        name: row.name,
        email: row.email,
        organization_id: orgId,
        plan_id,
        billing_cycle: row.billing_cycle,
        mrr: row.mrr,
        status: row.status,
        start_date: row.start_date,
        products: row.products.length ? row.products : null,
        churn_reason: row.churn_reason,
        churn_date: row.churn_date,
      });

      if (error) {
        errors++;
        if (errorMessages.length < 5) {
          errorMessages.push(`${row.name}: ${error.message}`);
        }
      }
      else success++;
    }

    setImporting(false);
    setDone(true);
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    toast({
      title: `Importação concluída`,
      description: errors
        ? `${success} clientes importados, ${errors} com erro. ${errorMessages.join(" | ")}`
        : `${success} clientes importados.`,
      variant: errors ? "destructive" : "default",
    });
    if (!errors) setTimeout(() => setOpen(false), 1500);
  };

  const reset = () => { setRows([]); setDone(false); };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Importar Clientes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Clientes via Planilha</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1 - Download template */}
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium">1. Baixe o template e preencha os dados</p>
            <p className="text-xs text-muted-foreground">
              Colunas: nome, email, plano, ciclo_cobranca, mrr, status, data_inicio, produtos, motivo_churn, data_churn
            </p>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <FileDown className="mr-2 h-4 w-4" />
              Baixar Template (.xlsx)
            </Button>
          </div>

          {/* Step 2 - Upload */}
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium">2. Faça upload do arquivo preenchido</p>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
            >
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Clique ou arraste o arquivo aqui (.xlsx, .xls, .csv)
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          </div>

          {/* Preview */}
          {rows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {rows.filter((r) => !r._error).length} clientes válidos
                  {rows.filter((r) => r._error).length > 0 && (
                    <span className="text-destructive ml-2">
                      · {rows.filter((r) => r._error).length} com erro
                    </span>
                  )}
                </p>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <X className="h-4 w-4 mr-1" /> Limpar
                </Button>
              </div>
              <div className="rounded-lg border overflow-auto max-h-[220px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Ciclo</TableHead>
                      <TableHead className="text-right">MRR</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={i} className={row._error ? "bg-destructive/5" : ""}>
                        <TableCell className="font-medium">{row.name || "—"}</TableCell>
                        <TableCell>{row.plan_name || "—"}</TableCell>
                        <TableCell>{row.billing_cycle}</TableCell>
                        <TableCell className="text-right">
                          {row.mrr ? `R$ ${row.mrr.toLocaleString("pt-BR")}` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.status}</Badge>
                        </TableCell>
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

              {done ? (
                <div className="flex items-center gap-2 text-success text-sm font-medium">
                  <CheckCircle className="h-4 w-4" /> Importação concluída!
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleImport}
                  disabled={importing || rows.filter((r) => !r._error).length === 0}
                >
                  {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Importar {rows.filter((r) => !r._error).length} clientes
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
