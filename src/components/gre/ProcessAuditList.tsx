
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, ChevronRight, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGREScore } from "@/hooks/useGREScore";

export function ProcessAuditList() {
    const navigate = useNavigate();
    const { criticalMissing, highMissing } = useGREScore();

    // Combine critical and high risks for the audit list, sorted by priority (Critical first)
    const risks = [...criticalMissing, ...highMissing];

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-destructive/20 bg-destructive/5">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            Blindagem da Empresa (Riscos Abertos)
                        </CardTitle>
                        <CardDescription>
                            Identificamos {risks.length} pontos de falha que colocam sua empresa em risco.
                        </CardDescription>
                    </div>
                    <Badge variant="destructive" className="text-sm px-3 py-1">
                        {criticalMissing.length} Riscos Críticos
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border bg-background">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Processo Faltante</TableHead>
                                <TableHead>Risco Gerado</TableHead>
                                <TableHead>Quando Fazer (Gatilho)</TableHead>
                                <TableHead>Prioridade</TableHead>
                                <TableHead className="text-right">Ação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {risks.map((process, index) => (
                                <TableRow key={`${process.id}-${index}`}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        {process.title}
                                    </TableCell>
                                    <TableCell className="text-destructive/80 font-medium">{process.risk_description || 'Risco Não Mapeado'}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{process.trigger_rule || 'Imediato'}</TableCell>
                                    <TableCell>
                                        <Badge variant={process.risk_level === 'critical' ? 'destructive' : 'outline'} className={process.risk_level === 'high' ? 'border-destructive text-destructive' : ''}>
                                            {process.risk_level === 'critical' ? 'Crítica' : 'Alta'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => navigate(`/gre/pillar/${process.pillar_id}`)}
                                        >
                                            Blindar <ChevronRight className="ml-1 h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {risks.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                                        Sua empresa está blindada! Todos os processos críticos mapeados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
