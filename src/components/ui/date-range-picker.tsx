import * as React from "react"
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfDay, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps {
    className?: string
    date?: DateRange
    onDateChange?: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
    className,
    date,
    onDateChange
}: DatePickerWithRangeProps) {
    const [isOpen, setIsOpen] = React.useState(false)

    const today = new Date()

    const presets = [
        {
            label: "Hoje",
            getValue: () => ({ from: startOfDay(today), to: endOfDay(today) })
        },
        {
            label: "Ontem",
            getValue: () => {
                const yesterday = subDays(today, 1)
                return { from: startOfDay(yesterday), to: endOfDay(yesterday) }
            }
        },
        {
            label: "Última semana",
            getValue: () => ({ from: startOfDay(subDays(today, 7)), to: endOfDay(today) })
        },
        {
            label: "Este mês",
            getValue: () => ({ from: startOfMonth(today), to: endOfMonth(today) })
        },
        {
            label: "Último mês",
            getValue: () => ({
                from: startOfMonth(subMonths(today, 1)),
                to: endOfMonth(subMonths(today, 1))
            })
        },
        {
            label: "Este ano",
            getValue: () => ({ from: startOfYear(today), to: endOfYear(today) })
        },
        {
            label: "Últimos 30 dias",
            getValue: () => ({ from: startOfDay(subDays(today, 30)), to: endOfDay(today) })
        },
        {
            label: "Todo período",
            getValue: () => undefined
        }
    ]

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "dd/MM/yyyy")} -{" "}
                                    {format(date.to, "dd/MM/yyyy")}
                                </>
                            ) : (
                                format(date.from, "dd/MM/yyyy")
                            )
                        ) : (
                            <span>Selecione um período</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 flex flex-col md:flex-row" align="start">
                    <div className="flex flex-col border-r border-border p-2 gap-1 md:w-40 bg-muted/20">
                        {presets.map((preset) => (
                            <Button
                                key={preset.label}
                                variant="ghost"
                                size="sm"
                                className="justify-start text-left font-normal h-8"
                                onClick={() => {
                                    if (onDateChange) {
                                        onDateChange(preset.getValue())
                                    }
                                    setIsOpen(false)
                                }}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>
                    <div className="p-2">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={onDateChange}
                            numberOfMonths={2}
                            locale={ptBR}
                        />
                        <div className="flex items-center justify-end p-2 border-t mt-2">
                            <Button onClick={() => setIsOpen(false)} size="sm">Aplicar</Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
