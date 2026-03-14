import React from "react";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractGenerator } from "@/components/legal/ContractGenerator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Shield, PlayCircle, Trash2 } from "lucide-react";
import { CreateTemplateModal } from "@/components/modals/CreateTemplateModal";
import { useLegalTemplates } from "@/hooks/useLegalTemplates";
import { Button } from "@/components/ui/button";

export default function LegalHub() {
    const { setPageTitle } = usePageTitle();
    const { templates, removeTemplate } = useLegalTemplates();

    React.useEffect(() => {
        setPageTitle("Hub Jurídico", "Gestão de contratos, compliance e segurança jurídica");
    }, [setPageTitle]);

    return (
        <>
            <Tabs defaultValue="generator" className="space-y-6">
                <div className="flex items-center justify-between">
                    <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                        <TabsTrigger value="generator">Gerador de Contratos</TabsTrigger>
                        <TabsTrigger value="templates">Biblioteca de Modelos</TabsTrigger>
                    </TabsList>
                    <div className="hidden md:block">
                        <CreateTemplateModal />
                    </div>
                </div>

                {/* Tab: Generator */}
                <TabsContent value="generator" className="space-y-4">
                    <ContractGenerator />
                </TabsContent>

                {/* Tab: Templates Library */}
                <TabsContent value="templates">
                    <div className="mb-4 md:hidden">
                        <CreateTemplateModal />
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {templates.map((template) => (
                            <Card key={template.id} className="flex flex-col relative group">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <FileText className="h-5 w-5 text-primary" />
                                            {template.title}
                                        </CardTitle>
                                        {template.isCustom && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                onClick={() => removeTemplate(template.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <CardDescription>{template.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="rounded-md bg-muted p-3">
                                        <p className="text-xs font-medium uppercase text-muted-foreground mb-2">Prévia</p>
                                        <p className="text-xs text-muted-foreground line-clamp-4 font-mono">
                                            {template.content.substring(0, 150)}...
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </>
    );
}
