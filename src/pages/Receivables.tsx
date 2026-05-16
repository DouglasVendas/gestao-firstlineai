import { useEffect } from "react";
import { ReceivablesContent } from "@/components/financial/ReceivablesContent";
import { usePageTitle } from "@/contexts/PageTitleContext";

export default function Receivables() {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle("Recebimentos", "Faturas, cobranças e previsões de recebimento");
  }, [setPageTitle]);

  return <ReceivablesContent />;
}
