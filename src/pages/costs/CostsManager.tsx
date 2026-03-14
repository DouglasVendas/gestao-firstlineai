import React from "react";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FixedCostsContent } from "@/components/costs/FixedCostsContent";
import { VariableCostsContent } from "@/components/costs/VariableCostsContent";

export default function CostsManager() {
    const { setPageTitle } = usePageTitle();

    React.useEffect(() => {
        setPageTitle("Gestão de Custos", "Controle unificado de custos fixos e variáveis");
    }, [setPageTitle]);

    return (
        <>
            <Tabs defaultValue="fixed" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="fixed">Custos Fixos</TabsTrigger>
                    <TabsTrigger value="variable">Custos Variáveis</TabsTrigger>
                </TabsList>

                <TabsContent value="fixed">
                    <FixedCostsContent />
                </TabsContent>

                <TabsContent value="variable">
                    <VariableCostsContent />
                </TabsContent>
            </Tabs>
        </>
    );
}
