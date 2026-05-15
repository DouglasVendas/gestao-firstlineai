import React from "react";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { CostsContent } from "@/components/costs/CostsContent";

export default function CostsManager() {
    const { setPageTitle } = usePageTitle();

    React.useEffect(() => {
        setPageTitle("Gestão de Custos", "Controle unificado de custos fixos e variáveis");
    }, [setPageTitle]);

    return (
        <CostsContent />
    );
}
