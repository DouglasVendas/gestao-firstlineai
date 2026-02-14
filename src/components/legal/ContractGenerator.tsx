import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClients } from "@/hooks/useClients";
import { CONTRACT_TEMPLATES } from "./ContractTemplates";
import { Check, Download, FileText, ChevronRight, ChevronLeft, Loader2, Wand2, Upload, File, X, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

export function ContractGenerator() {
    const { data: clients, isLoading } = useClients();
    const { toast } = useToast();

    // Mode State
    const [mode, setMode] = useState<"generate" | "upload">("generate");

    // Generator State
    const [step, setStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [isManualClient, setIsManualClient] = useState(false);
    const [manualClientData, setManualClientData] = useState({
        name: "",
        cnpj: "",
        address: ""
    });
    const [contractData, setContractData] = useState({
        monthlyValue: "",
        specialClauses: "",
        startDate: format(new Date(), "yyyy-MM-dd")
    });
    const [generatedContent, setGeneratedContent] = useState("");

    // Upload State
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerate = () => {
        const template = CONTRACT_TEMPLATES.find(t => t.id === selectedTemplate);

        // Validation logic
        if (!template) return;
        if (!isManualClient && !selectedClientId) return;
        if (isManualClient && !manualClientData.name) return;

        const clientName = isManualClient ? manualClientData.name : clients?.find(c => c.id === selectedClientId)?.name;
        // Mock data for existing clients if columns don't exist yet, or use manual data
        const clientCnpj = isManualClient ? manualClientData.cnpj : "00.000.000/0000-00";
        const clientAddress = isManualClient ? manualClientData.address : "Endereço Cadastrado no Sistema";
        const planName = isManualClient ? "Personalizado" : clients?.find(c => c.id === selectedClientId)?.plan?.name || "Personalizado";
        const planPrice = isManualClient ? "0,00" : clients?.find(c => c.id === selectedClientId)?.plan?.price_monthly?.toString() || "0,00";

        let content = template.content;

        // Replace variables
        content = content.replace(/{{CLIENT_NAME}}/g, clientName || "_________________");
        content = content.replace(/{{CLIENT_CNPJ}}/g, clientCnpj || "_________________");
        content = content.replace(/{{CLIENT_ADDRESS}}/g, clientAddress || "_________________");
        content = content.replace(/{{SOFTWARE_NAME}}/g, "FirstLine");
        content = content.replace(/{{PLAN_NAME}}/g, planName);
        content = content.replace(/{{MONTHLY_VALUE}}/g, contractData.monthlyValue || planPrice);
        content = content.replace(/{{START_DATE}}/g, format(new Date(contractData.startDate), "dd/MM/yyyy"));
        content = content.replace(/{{CURRENT_DATE}}/g, format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }));
        content = content.replace(/{{SPECIAL_CLAUSES}}/g, contractData.specialClauses || "Nenhuma cláusula especial.");

        setGeneratedContent(content);
        setStep(3);
    };

    const handleDownload = () => {
        if (mode === 'upload' && uploadedFile) {
            // Create a fake link to download the uploaded file
            const url = URL.createObjectURL(uploadedFile);
            const a = document.createElement('a');
            a.href = url;
            a.download = uploadedFile.name;
            a.click();
            URL.revokeObjectURL(url);
            return;
        }

        window.print();
        toast({
            title: "Impressão iniciada",
            description: "Você pode salvar como PDF na janela de impressão.",
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== "application/pdf") {
                toast({
                    title: "Formato inválido",
                    description: "Por favor, envie apenas arquivos PDF.",
                    variant: "destructive"
                });
                return;
            }
            setUploadedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            toast({
                title: "Arquivo carregado",
                description: `Pré-visualização disponível para: ${file.name}`
            });
        }
    };

    const handleRemoveFile = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setUploadedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="generate">Gerar Novo Contrato</TabsTrigger>
                <TabsTrigger value="upload">Upload de Contrato PDF</TabsTrigger>
            </TabsList>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Left: Configuration Wizard */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>{mode === 'generate' ? "Configurar Contrato" : "Anexar Contrato Existente"}</CardTitle>
                        <CardDescription>
                            {mode === 'generate'
                                ? `Passo ${step} de 3`
                                : "Faça upload de um contrato em PDF já assinado ou para revisão."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* MODE: GENERATE */}
                        <TabsContent value="generate" className="mt-0 space-y-6">
                            {/* Step 1: Selection */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Modelo de Contrato</Label>
                                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um modelo..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CONTRACT_TEMPLATES.map(t => (
                                                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-4 rounded-md border p-4">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="manual-mode"
                                                className="h-4 w-4 rounded border-gray-300"
                                                checked={isManualClient}
                                                onChange={(e) => setIsManualClient(e.target.checked)}
                                            />
                                            <Label htmlFor="manual-mode" className="font-medium">
                                                Cliente não cadastrado (Preencher manualmente)
                                            </Label>
                                        </div>

                                        {isManualClient ? (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                <div className="space-y-2">
                                                    <Label>Nome / Razão Social</Label>
                                                    <Input
                                                        placeholder="Ex: Empresa X Ltda"
                                                        value={manualClientData.name}
                                                        onChange={(e) => setManualClientData({ ...manualClientData, name: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <Label>CNPJ / CPF</Label>
                                                        <Input
                                                            placeholder="00.000.000/0001-00"
                                                            value={manualClientData.cnpj}
                                                            onChange={(e) => setManualClientData({ ...manualClientData, cnpj: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Endereço</Label>
                                                        <Input
                                                            placeholder="Cidade - UF"
                                                            value={manualClientData.address}
                                                            onChange={(e) => setManualClientData({ ...manualClientData, address: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label>Cliente Cadastrado</Label>
                                                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione o cliente..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {clients?.map(client => (
                                                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        className="w-full"
                                        disabled={!selectedTemplate || (!isManualClient && !selectedClientId) || (isManualClient && !manualClientData.name)}
                                        onClick={() => setStep(2)}
                                    >
                                        Próximo <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            {/* Step 2: Details */}
                            {step === 2 && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Valor Mensal (R$)</Label>
                                            <Input
                                                type="number"
                                                placeholder="Ex: 1500,00"
                                                value={contractData.monthlyValue}
                                                onChange={(e) => setContractData({ ...contractData, monthlyValue: e.target.value })}
                                            />
                                            <p className="text-xs text-muted-foreground">Deixe em branco para usar o valor do plano.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Data de Início</Label>
                                            <Input
                                                type="date"
                                                value={contractData.startDate}
                                                onChange={(e) => setContractData({ ...contractData, startDate: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            Cláusulas Especiais
                                            <div className="rounded-full bg-primary/10 p-1">
                                                <Wand2 className="h-3 w-3 text-primary" />
                                            </div>
                                        </Label>
                                        <Textarea
                                            placeholder="Ex: Multa de 10% em caso de rescisão antes de 12 meses."
                                            className="h-32"
                                            value={contractData.specialClauses}
                                            onChange={(e) => setContractData({ ...contractData, specialClauses: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground">O Dr. Ricardo formatará isso no contrato final.</p>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setStep(1)}>
                                            <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                                        </Button>
                                        <Button className="flex-1" onClick={handleGenerate}>
                                            Gerar Contrato <FileText className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Action */}
                            {step === 3 && (
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
                                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                                            <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                                        </div>
                                        <h3 className="font-medium text-green-900 dark:text-green-100">Contrato Pronto!</h3>
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            Seu contrato foi formatado e está pronto para impressão ou PDF.
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setStep(2)}>
                                            <ChevronLeft className="mr-2 h-4 w-4" /> Editar
                                        </Button>
                                        <Button className="flex-1" onClick={handleDownload} variant="default">
                                            Salvar como PDF <Download className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* MODE: UPLOAD */}
                        <TabsContent value="upload" className="mt-0 space-y-6">
                            <div className="space-y-2">
                                <Label>Vincular ao Cliente</Label>
                                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o cliente..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients?.map(client => (
                                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div
                                className={`
                                    flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 transition-colors
                                    ${uploadedFile ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                                `}
                            >
                                {uploadedFile ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                            <File className="h-8 w-8 text-primary" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-medium text-foreground">{uploadedFile.name}</p>
                                            <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <Button variant="outline" size="sm" onClick={handleRemoveFile}>
                                                <X className="mr-2 h-4 w-4" /> Remover
                                            </Button>
                                            <Button size="sm" onClick={() => {
                                                if (previewUrl) window.open(previewUrl, '_blank');
                                            }}>
                                                <Eye className="mr-2 h-4 w-4" /> Abrir em Nova Aba
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-center" onClick={() => fileInputRef.current?.click()}>
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                            <Upload className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">Clique para fazer upload</p>
                                            <p className="text-sm text-muted-foreground">Suporta apenas arquivos PDF</p>
                                        </div>
                                        <Input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="application/pdf"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                        <Button variant="secondary" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                                            Selecionar Arquivo
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                                <p className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    O arquivo será exibido na visualização ao lado.
                                </p>
                            </div>
                        </TabsContent>
                    </CardContent>
                </Card>

                {/* Right: Preview (A4 Style or PDF) */}
                <div className="flex flex-col h-[700px] lg:h-auto overflow-hidden rounded-xl border bg-zinc-100 dark:bg-zinc-900 p-4 lg:p-8 overflow-y-auto">
                    {mode === 'generate' && generatedContent ? (
                        <div id="contract-preview" className="a4-paper shadow-xl mx-auto">
                            <pre className="whitespace-pre-wrap font-serif text-justify">{generatedContent}</pre>
                        </div>
                    ) : mode === 'upload' && previewUrl ? (
                        <div className="h-full w-full rounded-lg bg-white shadow-xl overflow-hidden">
                            <iframe
                                src={previewUrl}
                                className="h-full w-full border-0"
                                title="Pré-visualização do PDF"
                            />
                        </div>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center space-y-4 text-muted-foreground border-2 border-dashed rounded-lg p-10">
                            <FileText className="h-16 w-16 opacity-20" />
                            <p className="text-center max-w-[200px]">
                                {mode === 'generate'
                                    ? "Preencha os dados ao lado para pré-visualizar o contrato formatado."
                                    : "Faça upload de um arquivo PDF para pré-visualizar aqui."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Tabs>
    );
}
