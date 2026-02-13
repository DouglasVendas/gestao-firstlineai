
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Info } from "lucide-react";
import { useLegalTemplates } from "@/hooks/useLegalTemplates";
import { Badge } from "@/components/ui/badge";

export function CreateTemplateModal() {
    const { addTemplate } = useLegalTemplates();
    const [open, setOpen] = useState(false);
    const [data, setData] = useState({
        title: "",
        description: "",
        content: ""
    });

    const handleSave = () => {
        if (!data.title || !data.content) return;
        addTemplate(data);
        setOpen(false);
        setData({ title: "", description: "", content: "" });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Novo Template
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Modelo de Contrato</DialogTitle>
                    <DialogDescription>
                        Crie seu próprio template. Use as variáveis abaixo para que a IA preencha automaticamente.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Título do Contrato</Label>
                        <Input
                            placeholder="Ex: Contrato de Parceria Comercial"
                            value={data.title}
                            onChange={(e) => setData({ ...data, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição Curta</Label>
                        <Input
                            placeholder="Ex: Utilizado para parceiros revendedores."
                            value={data.description}
                            onChange={(e) => setData({ ...data, description: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Conteúdo do Contrato</Label>
                        <div className="rounded-md bg-muted p-2 text-xs text-muted-foreground flex flex-wrap gap-2">
                            <span className="font-semibold">Variáveis Disponíveis:</span>
                            <Badge variant="outline">{"{{CLIENT_NAME}}"}</Badge>
                            <Badge variant="outline">{"{{CLIENT_CNPJ}}"}</Badge>
                            <Badge variant="outline">{"{{CLIENT_ADDRESS}}"}</Badge>
                            <Badge variant="outline">{"{{MONTHLY_VALUE}}"}</Badge>
                            <Badge variant="outline">{"{{START_DATE}}"}</Badge>
                            <Badge variant="outline">{"{{SPECIAL_CLAUSES}}"}</Badge>
                        </div>
                        <Textarea
                            className="h-[300px] font-mono text-xs"
                            placeholder="Cole aqui o texto do seu contrato..."
                            value={data.content}
                            onChange={(e) => setData({ ...data, content: e.target.value })}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!data.title || !data.content}>Salvar Template</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
