import { useState } from "react";
import { CalendarClock, ChevronDown, Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateFixedCostModal } from "@/components/modals/CreateFixedCostModal";
import { CreateVariableCostModal } from "@/components/modals/CreateVariableCostModal";

export function CreateCostExpenseButton() {
    const [fixedOpen, setFixedOpen] = useState(false);
    const [variableOpen, setVariableOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Custo/Despesa
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuLabel>Informe o tipo do lançamento</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setFixedOpen(true)}>
                        <CalendarClock className="mr-2 h-4 w-4" />
                        <div>
                            <p className="font-medium">Fixo recorrente</p>
                            <p className="text-xs text-muted-foreground">Repete nos próximos meses até ser encerrado.</p>
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setVariableOpen(true)}>
                        <Receipt className="mr-2 h-4 w-4" />
                        <div>
                            <p className="font-medium">Variável pontual</p>
                            <p className="text-xs text-muted-foreground">Lançamento específico de uma competência.</p>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <CreateFixedCostModal hideTrigger open={fixedOpen} onOpenChange={setFixedOpen} />
            <CreateVariableCostModal hideTrigger open={variableOpen} onOpenChange={setVariableOpen} />
        </>
    );
}
