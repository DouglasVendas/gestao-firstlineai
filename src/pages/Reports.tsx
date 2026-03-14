import React from "react";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, Clock, Plus } from "lucide-react";

const reports = [
  { name: "Relatório Executivo", type: "Executivo", lastGenerated: "28/01/2024", scheduled: true },
  { name: "DRE Mensal", type: "Financeiro", lastGenerated: "27/01/2024", scheduled: true },
  { name: "Análise de Churn", type: "CS", lastGenerated: "25/01/2024", scheduled: false },
  { name: "Performance de Marketing", type: "Marketing", lastGenerated: "24/01/2024", scheduled: true },
  { name: "Pipeline de Vendas", type: "Vendas", lastGenerated: "23/01/2024", scheduled: false },
];

const templates = ["Executivo", "Financeiro", "Vendas", "Marketing"];

export default function Reports() {
  const { setPageTitle } = usePageTitle();

  React.useEffect(() => {
    setPageTitle("Relatórios", "Geração e agendamento de relatórios");
  }, [setPageTitle]);

  return (
    <>
      <div className="mb-6 flex gap-3">
        <Button><Plus className="mr-2 h-4 w-4" />Novo Relatório</Button>
        <Button variant="outline"><Calendar className="mr-2 h-4 w-4" />Agendar</Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {templates.map((t) => (
          <Card key={t} className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="pt-6 text-center">
              <FileText className="mx-auto mb-2 h-8 w-8 text-primary" />
              <p className="font-medium">Template {t}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Relatórios Gerados</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-sm text-muted-foreground">Gerado em {r.lastGenerated}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{r.type}</Badge>
                  {r.scheduled && <Badge className="bg-success/10 text-success"><Clock className="mr-1 h-3 w-3" />Agendado</Badge>}
                  <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
