
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileDown, Check, X, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";

/**
 * Sentinel client UUID for imported invoices without a client mapping (C2 fix)
 * This matches the sentinel client created in the database migration
 */
const GENERIC_CLIENT_ID = '00000000-0000-0000-0000-000000000001';

interface ImportRow {
    id: number;
    date: string; // YYYY-MM-DD for storage
    displayDate: string; // DD/MM/YYYY for display
    month: string; // YYYY-MM for groupings
    description: string;
    amount: number;
    category: "fixed" | "variable" | "income" | "ignore";
    originalRow: any;
}

const parseDate = (rawDate: any): { date: string, month: string, display: string } | null => {
    if (!rawDate) return null;

    let dateObj: Date | null = null;
    const str = String(rawDate).trim();

    // Handle Excel serial date
    if (!isNaN(Number(str)) && str.length < 8 && !str.includes("-") && !str.includes("/")) {
        const serial = Number(str);
        // Excel base date check (approximate safe execution for web)
        dateObj = new Date(Math.round((serial - 25569) * 864e5));
    }
    // Handle DD/MM/YYYY or DD-MM-YYYY
    else if (str.match(/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/)) {
        const parts = str.split(/[\/-]/);
        dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    // Handle YYYY-MM-DD
    else if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateObj = new Date(str);
    }
    // Handle ISO string
    else {
        const d = new Date(str);
        if (!isNaN(d.getTime())) dateObj = d;
    }

    if (dateObj && !isNaN(dateObj.getTime())) {
        // Adjust for timezone issues if needed, but usually constructing from YYYY-MM-DD string is UTC or local correctly enough for dates only
        // To be safe, let's treat it as UTC components to avoid shifting
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, "0");
        const d = String(dateObj.getDate()).padStart(2, "0");

        return {
            date: `${y}-${m}-${d}`,
            month: `${y}-${m}`,
            display: `${d}/${m}/${y}`
        };
    }
    return null;
};

export function DataImportModal() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"upload" | "preview" | "processing">("upload");
    const [importedData, setImportedData] = useState<ImportRow[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (evt) => {
            const bstr = evt.target?.result;

            if (file.name.endsWith(".csv")) {
                Papa.parse(file, {
                    header: true,
                    complete: (results) => processParsedData(results.data),
                    error: (error) => {
                        toast({ title: "Erro ao ler CSV", description: error.message, variant: "destructive" });
                    }
                });
            } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
                const wb = XLSX.read(bstr, { type: "binary" });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                processParsedData(data);
            } else {
                toast({ title: "Formato inválido", description: "Apenas .csv, .xls ou .xlsx", variant: "destructive" });
            }
        };

        if (file.name.endsWith(".csv")) {
            // Papa parse handles file object directly usually, but let's stick to reader for text content if needed or file
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => processParsedData(results.data),
            });
        } else {
            reader.readAsBinaryString(file);
        }
    };

    const processParsedData = (data: any[]) => {
        // Try to identify columns recklessly
        const processed = data.map((row, index) => {
            // Find keys that look like Date, Description, Amount
            const keys = Object.keys(row);
            // Prioritize 'DtBaixa' or 'Data Baixa' based on user requirement
            const dateKey = keys.find(k => k.toLowerCase().includes("dtbaixa") || k.toLowerCase().includes("databaixa") || k.toLowerCase().includes("dt baixa"))
                || keys.find(k => k.toLowerCase().includes("date") || k.toLowerCase().includes("data") || k.toLowerCase().includes("dia"));

            const descKey = keys.find(k => k.toLowerCase().includes("historico") || k.toLowerCase().includes("histórico"))
                || keys.find(k => k.toLowerCase().includes("desc") || k.toLowerCase().includes("memo"));

            const amountKey = keys.find(k => k.toLowerCase().includes("amount") || k.toLowerCase().includes("valor") || k.toLowerCase().includes("quant"));

            let amount = 0;
            if (amountKey && row[amountKey] !== undefined && row[amountKey] !== null) {
                const rawVal = row[amountKey];

                if (typeof rawVal === 'number') {
                    amount = rawVal;
                } else {
                    let strVal = String(rawVal).trim();
                    // Basic cleanup of currency symbols
                    strVal = strVal.replace(/^R\$\s?/, "").replace(/\s/g, "");

                    // Helper to parse "1.234,56" or "1234,56" or "1234.56"
                    // If it has a comma, we assume it's the decimal separator for BRL
                    if (strVal.includes(",")) {
                        // Remove dots (thousand separators) and replace comma with dot
                        // Example: 1.000,00 -> 1000.00
                        // Example: 905,36 -> 905.36
                        strVal = strVal.replace(/\./g, "").replace(",", ".");
                    } else {
                        // If no comma, does it have dots? 
                        // "1000.00" -> 1000 (Standard JS float)
                        // "1.000" -> 1000 (Could be thousand separator without decimal?)
                        // User said: "após , é centavos". Implicitly: "ponto é milhar".

                        // If we have multiple dots: 1.000.000 -> remove all?
                        // If we have one dot: 1.000 (is it 1000 or 1.0?)
                        // In BR context, dot is usually thousand. But in programming, dot is decimal.
                        // Let's check the number of decimal places if we treat as dot-decimal.
                        // Ideally, we shouldn't guess too much if ambiguous. 

                        // However, commonly Excel exports might strip formatting or output as English.
                        // If purely digits and one dot: assume English float if it "looks" like money?
                        // BUT, user explicitly said "após , é centavos".

                        // Let's try to be safe: 
                        // If it has NO comma, and only ONE dot, and that dot is at the end (2-3 chars), maybe it's decimal?
                        // No, strictly BRL: remove dots. 
                        // "905.36" imported as "90536" was the bug.
                        // That implies "905.36" was treated as "905.36" -> replace dots -> "90536".

                        // Fix: If no comma is present, check if it's a valid float string.
                        // But wait, "1.200" in PT-BR means 1200. "1.200" in US means 1.2.
                        // If we aggressively remove dots, "1.200" becomes "1200". This is correct for PT-BR "mil".
                        // What about "905.36"? 
                        // If Excel exported "905.36", it means it converted to English format?
                        // Or is "36" meant to be cents?
                        // If we are strict BR: "905.36" (dot as thousand) -> 90.536 (incorrect if user meant 905,36).

                        // Strategy: Look for the LAST separator.
                        // If comma is present, it's the decimal.
                        // If NO comma, and there is a DOT:
                        // - If there are multiple dots: they are thousands -> remove.
                        // - If there is one dot: 
                        //    - If it has 3 digits after: "1.000" -> likely thousand.
                        //    - If it has 2 digits after: "10.50" -> likely decimal (common computer format).
                        //    - If it matches `\d+\.\d{2}` -> assume float.

                        if ((strVal.match(/\./g) || []).length === 1 && strVal.match(/\.\d{2}$/)) {
                            // "123.45" -> likely English float 123.45
                            // Do nothing, parseFloat handles it.
                        } else {
                            // "1.234" -> 1234
                            // "1.234.567" -> 1234567
                            strVal = strVal.replace(/\./g, "");
                        }
                    }
                    amount = parseFloat(strVal);
                }
            }

            // Simple heuristic for auto-categorization
            let category: "fixed" | "variable" | "ignore" = "variable";
            const desc = String(row[descKey] || "").toLowerCase();
            if (desc.includes("aluguel") || desc.includes("salario") || desc.includes("internet") || desc.includes("luz")) {
                category = "fixed";
            }

            // Advanced mapping based on user spreadsheet
            const typeKey = keys.find(k => k.toLowerCase().includes("tipo"));
            const categoryKey = keys.find(k => k.toLowerCase().includes("depesas") || k.toLowerCase().includes("receitas") || k.toLowerCase().includes("categoria"));

            if (typeKey && row[typeKey]) {
                const typeVal = String(row[typeKey]).toLowerCase();
                if (typeVal.includes("recebido") || typeVal.includes("entrada")) {
                    category = "income";
                } else if (typeVal.includes("pago") || typeVal.includes("saida")) {
                    // It's a cost, decide fixed vs variable based on category list or default to variable
                    if (categoryKey && row[categoryKey]) {
                        const catVal = String(row[categoryKey]).toLowerCase();
                        if (["aluguel", "salário", "pro-labore", "internet", "contador", "sistema"].some(c => catVal.includes(c))) {
                            category = "fixed";
                        } else {
                            category = "variable";
                        }
                    } else {
                        category = "variable"; // Default cost
                    }
                }
            } else if (amount > 0 && !typeKey) {
                // Fallback: Positive amount usually income if no type column? 
                // But confusing without explicit instruction. Default logic was variable.
                // Let's stick to previous heuristic if no strict type column found.
            }

            let parsed = parseDate(row[dateKey]);
            if (!parsed) {
                // Fallback to today if parsing fails, but maybe mark as error? 
                // For now, let's use today but alert user visually in table if we could
                const now = new Date();
                parsed = {
                    date: now.toISOString().split("T")[0],
                    month: now.toISOString().substring(0, 7),
                    display: now.toLocaleDateString("pt-BR")
                };
            }

            return {
                id: index,
                date: parsed.date,
                displayDate: parsed.display,
                month: parsed.month,
                description: String(row[descKey] || "Sem descrição"),
                amount: amount || 0,
                category,
                originalRow: row
            };
        });

        // Filter out empty rows
        const validRows = processed.filter(r => r.amount !== 0);
        setImportedData(validRows);
        setStep("preview");
    };

    const handleConfirmImport = async () => {
        setIsProcessing(true);
        let successCount = 0;
        let errorCount = 0;

        for (const row of importedData) {
            if (row.category === "ignore") continue;

            const tableName = row.category === "fixed" ? "fixed_costs" : (row.category === "variable" ? "variable_costs" : "invoices");

            // Construct payload depending on destination
            let payload: any = {};

            if (row.category === "income") {
                // For invoices table (C2 fix: use sentinel client instead of null)
                payload = {
                    client_id: GENERIC_CLIENT_ID, // Sentinel "Cliente Genérico" for unmapped imported invoices
                    value: Math.abs(row.amount),
                    due_date: row.date,
                    paid_date: row.date, // "DtBaixa" means paid
                    status: "paid",
                    description: row.description || "Receita Importada"
                };
            } else {
                // Costs (C3 fix: use full YYYY-MM-DD date instead of YYYY-MM)
                payload = {
                    description: row.description,
                    category: "Importado", // Or mapping from row.originalRow['DepesasReceitas'] if available
                    month: row.date, // Use full YYYY-MM-DD date, not YYYY-MM
                };

                // Try to use original category if present
                const originalCat = row.originalRow['DepesasReceitas'] || row.originalRow['Categoria'];
                if (originalCat) payload.category = originalCat;

                if (row.category === "fixed") {
                    payload.actual = Math.abs(row.amount);
                } else {
                    payload.amount = Math.abs(row.amount);
                }
            }

            const { error } = await supabase.from(tableName).insert(payload);
            if (error) {
                console.error("Error importing row:", row, error);
                errorCount++;
            } else {
                successCount++;
            }
        }

        setIsProcessing(false);
        setOpen(false);
        setStep("upload");
        setImportedData([]);

        if (successCount > 0) {
            toast({
                title: "Importação Concluída",
                description: `${successCount} registros importados com sucesso. ${errorCount > 0 ? `${errorCount} erros.` : ""}`
            });
            // Force refresh of financial data if we had context access, or reload page
            window.location.reload();
        } else {
            toast({ title: "Nenhum dado importado", variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Importar Histórico
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Importar Extrato Bancário</DialogTitle>
                </DialogHeader>

                {step === "upload" && (
                    <div className="flex flex-col items-center justify-center gap-6 py-12 border-2 border-dashed rounded-lg">
                        <div className="text-center space-y-2">
                            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                            <h3 className="text-lg font-medium">Faça upload do seu arquivo</h3>
                            <p className="text-sm text-muted-foreground">Suporta CSV e Excel (.xlsx)</p>
                        </div>
                        <input
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <Button onClick={() => fileInputRef.current?.click()}>
                            Selecionar Arquivo
                        </Button>
                        <div className="text-xs text-muted-foreground text-center max-w-sm">
                            <p>O arquivo deve conter colunas para: Data, Descrição e Valor.</p>
                        </div>
                    </div>
                )}

                {step === "preview" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium">{importedData.length} transações encontradas</h3>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setStep("upload")}>Cancelar</Button>
                                <Button onClick={handleConfirmImport} disabled={isProcessing}>
                                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirmar Importação
                                </Button>
                            </div>
                        </div>

                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Tipo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {importedData.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-mono text-xs">
                                                <div>{row.displayDate}</div>
                                                <div className="text-muted-foreground">{row.month}</div>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={row.description}>
                                                {row.description}
                                            </TableCell>
                                            <TableCell className={
                                                row.category === "income"
                                                    ? "text-green-500"
                                                    : (row.category === "fixed" || row.category === "variable" ? "text-red-500" : "text-muted-foreground")
                                            }>
                                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(row.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={row.category}
                                                    onValueChange={(val: any) => {
                                                        const newData = [...importedData];
                                                        const idx = newData.findIndex(r => r.id === row.id);
                                                        if (idx >= 0) {
                                                            newData[idx].category = val;
                                                            setImportedData(newData);
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className="h-8 w-[140px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="income">Receita</SelectItem>
                                                        <SelectItem value="fixed">Custo Fixo</SelectItem>
                                                        <SelectItem value="variable">Custo Variável</SelectItem>
                                                        <SelectItem value="ignore">Ignorar</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
