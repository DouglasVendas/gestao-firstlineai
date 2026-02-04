import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Loader2, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ImportRow {
    tipo: "receita" | "custo_fixo" | "custo_variavel";
    descricao_ou_categoria: string;
    valor: number;
    data: string; // YYYY-MM-DD
    status?: string; // payment status for invoices
}

export default function ImportData() {
    const { toast } = useToast();
    const [data, setData] = useState<ImportRow[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [summary, setSummary] = useState({ receita: 0, fixo: 0, variavel: 0 });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const bstr = event.target?.result;
                const wb = XLSX.read(bstr, { type: "binary" });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData = XLSX.utils.sheet_to_json(ws) as any[];

                const formattedData: ImportRow[] = jsonData.map((row) => ({
                    tipo: normalizeType(row.tipo),
                    descricao_ou_categoria: row.descricao || row.categoria || "Sem Categoria",
                    valor: Number(row.valor) || 0,
                    data: formatDate(row.data),
                    status: row.status,
                })).filter(r => r.valor > 0); // basic filter

                setData(formattedData);

                // Calculate summary
                const sum = { receita: 0, fixo: 0, variavel: 0 };
                formattedData.forEach(r => {
                    if (r.tipo === "receita") sum.receita++;
                    else if (r.tipo === "custo_fixo") sum.fixo++;
                    else if (r.tipo === "custo_variavel") sum.variavel++;
                });
                setSummary(sum);

            } catch (error) {
                console.error(error);
                toast({
                    title: "Erro ao ler arquivo",
                    description: "Verifique se o formato está correto.",
                    variant: "destructive",
                });
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const normalizeType = (type: string): "receita" | "custo_fixo" | "custo_variavel" => {
        const t = String(type).toLowerCase().trim();
        if (t.includes("receita") || t.includes("fatura") || t.includes("entrada")) return "receita";
        if (t.includes("fix") || t.includes("fixo")) return "custo_fixo";
        if (t.includes("var") || t.includes("vari")) return "custo_variavel";
        return "receita"; // Default fallback, customizable
    };

    // Helper to standard Format YYYY-MM-DD
    const formatDate = (rawDate: any): string => {
        if (!rawDate) return new Date().toISOString().split("T")[0];
        // If Excel number date
        if (typeof rawDate === 'number') {
            const date = new Date((rawDate - (25567 + 2)) * 86400 * 1000); // Excel date logic adaptation
            return date.toISOString().split("T")[0];
        }
        // If string
        try {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
        } catch (e) { }
        return String(rawDate);
    };

    const handleImport = async () => {
        setIsUploading(true);
        try {
            // 1. Process Invoices (Receitas)
            const revenues: Database['public']['Tables']['invoices']['Insert'][] = data.filter(d => d.tipo === "receita").map(d => ({
                amount: d.valor,
                due_date: d.data,
                status: (d.status?.toLowerCase() === "pago" ? "paid" : "pending") as "paid" | "pending" | "overdue",
                // Description/Category is lost for invoices table unless we map client? 
                // For now, simpler: user manually manages clients.
            }));

            // 2. Process Fixed Costs
            const fixed: Database['public']['Tables']['fixed_costs']['Insert'][] = data.filter(d => d.tipo === "custo_fixo").map(d => ({
                actual: d.valor,
                month: d.data.substring(0, 7), // YYYY-MM
                category: d.descricao_ou_categoria,
                budgeted: d.valor // Assume budgeted = actual for bulk import to simplify
            }));

            // 3. Process Variable Costs
            const variable: Database['public']['Tables']['variable_costs']['Insert'][] = data.filter(d => d.tipo === "custo_variavel").map(d => ({
                amount: d.valor,
                month: d.data.substring(0, 7), // YYYY-MM
                category: d.descricao_ou_categoria,
            }));

            const errors = [];

            if (revenues.length > 0) {
                const { error } = await supabase.from("invoices").insert(revenues as any);
                if (error) errors.push(`Receitas: ${error.message}`);
            }

            if (fixed.length > 0) {
                const { error } = await supabase.from("fixed_costs").insert(fixed as any);
                if (error) errors.push(`Custos Fixos: ${error.message}`);
            }

            if (variable.length > 0) {
                const { error } = await supabase.from("variable_costs").insert(variable as any);
                if (error) errors.push(`Custos Variáveis: ${error.message}`);
            }

            if (errors.length > 0) {
                toast({
                    title: "Erro parcial na importação",
                    description: errors.join(", "),
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Importação realizada com sucesso!",
                    description: `${data.length} registros foram importados.`,
                });
                setData([]);
                setFile(null);
                setSummary({ receita: 0, fixo: 0, variavel: 0 });
            }

        } catch (error) {
            toast({
                title: "Erro crítico",
                description: "Falha ao enviar dados.",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const downloadTemplate = () => {
        // Basic CSV template
        const csvContent = "data:text/csv;charset=utf-8,tipo,descricao,valor,data,status\nreceita,Venda de Software,150.00,2024-05-20,pago\ncusto_fixo,Aluguel Escritório,2000.00,2024-05-05,pago\ncusto_variavel,Comissão Vendedor,300.00,2024-05-10,pago";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "template_importacao.csv");
        document.body.appendChild(link);
        link.click();
    };

    return (
        <AppLayout title="Importação de Dados" subtitle="Importe dados financeiros em massa via Excel ou CSV">
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Upload de Arquivo</CardTitle>
                        <CardDescription>
                            Selecione um arquivo .xlsx ou .csv para processar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6">
                            <div className="flex items-center gap-4">
                                <Input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileUpload}
                                />
                                <Button variant="outline" onClick={downloadTemplate}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Baixar Modelo
                                </Button>
                            </div>

                            {data.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <Alert className="bg-blue-50 border-blue-200">
                                            <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                                            <AlertTitle className="text-blue-700">Resumo da Importação</AlertTitle>
                                            <AlertDescription className="text-blue-600">
                                                Serão importados: <span className="font-bold">{summary.receita}</span> Saisas (Faturas), <span className="font-bold">{summary.fixo}</span> Custos Fixos, <span className="font-bold">{summary.variavel}</span> Custos Variáveis.
                                            </AlertDescription>
                                        </Alert>
                                    </div>

                                    <div className="rounded-md border h-[300px] overflow-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Tipo</TableHead>
                                                    <TableHead>Descrição / Categoria</TableHead>
                                                    <TableHead>Valor</TableHead>
                                                    <TableHead>Data</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.slice(0, 50).map((row, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <Badge variant="outline" className={
                                                                row.tipo === 'receita' ? 'bg-green-100 text-green-700' :
                                                                    row.tipo === 'custo_fixo' ? 'bg-gray-100 text-gray-700' :
                                                                        'bg-orange-100 text-orange-700'
                                                            }>
                                                                {row.tipo}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{row.descricao_ou_categoria}</TableCell>
                                                        <TableCell>R$ {row.valor.toFixed(2)}</TableCell>
                                                        <TableCell>{row.data}</TableCell>
                                                        <TableCell>{row.status || '-'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        {data.length > 50 && (
                                            <p className="p-4 text-center text-sm text-muted-foreground">Exibindo os primeiros 50 registros de {data.length}.</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end">
                                        <Button onClick={handleImport} disabled={isUploading}>
                                            {isUploading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="mr-2 h-4 w-4" /> Confirmar Importação
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
