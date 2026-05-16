import * as React from "react"
import { endOfMonth, endOfQuarter, endOfYear, format, startOfMonth, startOfQuarter, startOfYear, subMonths, subQuarters, subYears } from "date-fns"
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

export function DatePickerWithRange({ className, date, onDateChange }: DatePickerWithRangeProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [pending, setPending] = React.useState<DateRange | undefined>(date)

    const today = new Date()

    React.useEffect(() => {
        setPending(date)
    }, [date])

    const previousMonth = subMonths(today, 1)
    const previousQuarter = subQuarters(today, 1)
    const previousYear = subYears(today, 1)

    const presetGroups = [
        {
            title: "Mês",
            items: [
                {
                    label: "Este mês",
                    getValue: () => ({ from: startOfMonth(today), to: endOfMonth(today) }),
                },
                {
                    label: "Mês anterior",
                    getValue: () => ({ from: startOfMonth(previousMonth), to: endOfMonth(previousMonth) }),
                },
            ],
        },
        {
            title: "Trimestre",
            items: [
                {
                    label: "Este trimestre",
                    getValue: () => ({ from: startOfQuarter(today), to: endOfQuarter(today) }),
                },
                {
                    label: "Trimestre anterior",
                    getValue: () => ({ from: startOfQuarter(previousQuarter), to: endOfQuarter(previousQuarter) }),
                },
            ],
        },
        {
            title: "Ano",
            items: [
                {
                    label: "Este ano",
                    getValue: () => ({ from: startOfYear(today), to: endOfYear(today) }),
                },
                {
                    label: "Ano anterior",
                    getValue: () => ({ from: startOfYear(previousYear), to: endOfYear(previousYear) }),
                },
            ],
        },
    ]

    const handleApply = () => {
        if (onDateChange) onDateChange(pending)
        setIsOpen(false)
    }

    const handleCancel = () => {
        setPending(date)
        setIsOpen(false)
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant="outline"
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        {date?.from ? (
                            <span className="flex items-center gap-1.5 text-sm">
                                <span className="text-muted-foreground text-xs font-medium">DE</span>
                                {format(date.from, "dd/MM/yyyy")}
                                {date.to && (
                                    <>
                                        <span className="text-muted-foreground text-xs font-medium">ATÉ</span>
                                        {format(date.to, "dd/MM/yyyy")}
                                    </>
                                )}
                            </span>
                        ) : (
                            <span>Selecione um período</span>
                        )}
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0 flex flex-col md:flex-row" align="start">
                    {/* Presets */}
                    <div className="flex flex-col border-r border-border p-3 gap-3 md:w-52 bg-muted/20">
                        <p className="text-xs font-medium text-muted-foreground px-2 uppercase tracking-wide">
                            Atalhos financeiros
                        </p>
                        {presetGroups.map((group) => (
                            <div key={group.title} className="space-y-1">
                                <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                                    {group.title}
                                </p>
                                {group.items.map((preset) => (
                                    <Button
                                        key={preset.label}
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-left font-normal h-8"
                                        onClick={() => {
                                            const value = preset.getValue()
                                            setPending(value)
                                            if (onDateChange) onDateChange(value)
                                            setIsOpen(false)
                                        }}
                                    >
                                        {preset.label}
                                    </Button>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Calendar */}
                    <div className="p-3">
                        {/* DE / ATÉ indicators */}
                        <div className="flex items-center gap-3 mb-3 px-1 pb-3 border-b border-border">
                            <div className="flex flex-col min-w-[100px]">
                                <span className="text-xs font-semibold text-muted-foreground tracking-wide">DE:</span>
                                <span className="text-sm font-medium">
                                    {pending?.from
                                        ? format(pending.from, "dd/MM/yyyy", { locale: ptBR })
                                        : <span className="text-muted-foreground">—</span>}
                                </span>
                            </div>
                            <div className="h-px w-6 bg-border mt-3" />
                            <div className="flex flex-col min-w-[100px]">
                                <span className="text-xs font-semibold text-muted-foreground tracking-wide">ATÉ:</span>
                                <span className="text-sm font-medium">
                                    {pending?.to
                                        ? format(pending.to, "dd/MM/yyyy", { locale: ptBR })
                                        : <span className="text-muted-foreground">—</span>}
                                </span>
                            </div>
                        </div>

                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={pending?.from}
                            selected={pending}
                            onSelect={setPending}
                            numberOfMonths={2}
                            locale={ptBR}
                        />

                        <div className="flex items-center justify-end gap-2 pt-3 border-t mt-2">
                            <Button variant="outline" size="sm" onClick={handleCancel}>
                                Cancelar
                            </Button>
                            <Button size="sm" onClick={handleApply} disabled={!pending?.from}>
                                Aplicar
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
