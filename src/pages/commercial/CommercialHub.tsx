import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketingContent } from "@/components/commercial/MarketingContent";
import { PlansContent } from "@/components/commercial/PlansContent";

export default function CommercialHub() {
    return (
        <AppLayout
            title="Hub Comercial"
            subtitle="Estratégia de crescimento, marketing e planos"
        >
            <Tabs defaultValue="marketing" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="marketing">Marketing & Funil</TabsTrigger>
                    <TabsTrigger value="plans">Gestão de Planos</TabsTrigger>
                </TabsList>

                <TabsContent value="marketing">
                    <MarketingContent />
                </TabsContent>

                <TabsContent value="plans">
                    <PlansContent />
                </TabsContent>
            </Tabs>
        </AppLayout>
    );
}
