import { useState, useCallback } from "react";
import {
    Deal, DealActivity, DealTag, STAGE_CONFIG, ACTIVE_STAGES, ACTIVITY_ICONS, PRIORITY_CONFIG,
    useDeals, useDealActivities, useDealTags,
} from "@/hooks/useDeals";
import { usePlans, type Plan } from "@/hooks/usePlans";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
    DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Plus, DollarSign, TrendingUp, User, Building2, Mail, Calendar as CalendarIcon,
    ChevronRight, ChevronLeft, Trophy, Loader2, Flame, Clock, CheckCircle2,
    Circle, Target, Zap, Trash2, X, Tag, Edit2, Save, GripVertical, Package, Phone,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const daysAgo = (dateStr: string) => Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);

const relativeDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const diff = Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000);
    if (diff < 0) return { text: `${Math.abs(diff)}d atrasado`, overdue: true };
    if (diff === 0) return { text: 'Hoje', overdue: false };
    if (diff === 1) return { text: 'Amanhã', overdue: false };
    return { text: `Em ${diff}d`, overdue: false };
};

// ═══════════════════════════════════════════════
// PRIORITY BADGE
// ═══════════════════════════════════════════════
function PriorityBadge({ priority }: { priority: Deal['priority'] }) {
    const cfg = PRIORITY_CONFIG[priority];
    return <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${cfg.color}`}>{cfg.emoji} {cfg.label}</span>;
}

// ═══════════════════════════════════════════════
// DATE PICKER WITH CALENDAR
// ═══════════════════════════════════════════════
function DateTimePicker({ value, onChange, label, showTime = false }: { value: string; onChange: (v: string) => void; label: string; showTime?: boolean }) {
    const [open, setOpen] = useState(false);
    const selected = value ? new Date(value) : undefined;
    const [time, setTime] = useState(value ? format(new Date(value), 'HH:mm') : '10:00');

    return (
        <div className="grid gap-1">
            <Label className="text-xs">{label}</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="h-8 text-xs justify-start font-normal">
                        <CalendarIcon className="h-3 w-3 mr-2 text-muted-foreground" />
                        {selected ? format(selected, showTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={selected}
                        onSelect={(date) => {
                            if (date) {
                                if (showTime) {
                                    const [h, m] = time.split(':').map(Number);
                                    date.setHours(h, m);
                                }
                                onChange(date.toISOString());
                                if (!showTime) setOpen(false);
                            }
                        }}
                        locale={ptBR}
                        initialFocus
                    />
                    {showTime && (
                        <div className="border-t p-3 flex items-center gap-2">
                            <Label className="text-xs">Horário:</Label>
                            <Input type="time" className="h-7 text-xs w-24" value={time} onChange={(e) => {
                                setTime(e.target.value);
                                if (selected) {
                                    const [h, m] = e.target.value.split(':').map(Number);
                                    const d = new Date(selected);
                                    d.setHours(h, m);
                                    onChange(d.toISOString());
                                }
                            }} />
                            <Button size="sm" className="h-7 text-xs ml-auto" onClick={() => setOpen(false)}>OK</Button>
                        </div>
                    )}
                </PopoverContent>
            </Popover>
        </div>
    );
}

// ═══════════════════════════════════════════════
// TAG MANAGER
// ═══════════════════════════════════════════════
function TagManager({ dealTags = [], onToggle, onCreateNew }: {
    dealTags: DealTag[];
    onToggle: (tag: DealTag) => void;
    onCreateNew: (name: string, color: string) => void;
}) {
    const { allTags } = useDealTags();
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#6366f1');
    const [showCreate, setShowCreate] = useState(false);

    const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6'];

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
                {allTags.map(tag => {
                    const isActive = dealTags.some(t => t.id === tag.id);
                    return (
                        <button key={tag.id} onClick={() => onToggle(tag)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all border ${isActive ? 'opacity-100 shadow-sm' : 'opacity-50 hover:opacity-80'}`}
                            style={{ borderColor: tag.color, backgroundColor: isActive ? tag.color + '20' : 'transparent', color: tag.color }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                            {tag.name}
                            {isActive && <X className="h-2.5 w-2.5 ml-0.5" />}
                        </button>
                    );
                })}
                <button onClick={() => setShowCreate(!showCreate)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    <Plus className="h-2.5 w-2.5" /> Nova
                </button>
            </div>
            {showCreate && (
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                    <Input className="h-7 text-xs flex-1" placeholder="Nome da tag" value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)} />
                    <div className="flex gap-1">
                        {COLORS.map(c => (
                            <button key={c} onClick={() => setNewTagColor(c)}
                                className={`w-5 h-5 rounded-full transition-transform ${newTagColor === c ? 'scale-125 ring-2 ring-offset-1 ring-primary' : ''}`}
                                style={{ backgroundColor: c }} />
                        ))}
                    </div>
                    <Button size="sm" className="h-7 text-xs" onClick={() => {
                        if (newTagName.trim()) { onCreateNew(newTagName.trim(), newTagColor); setNewTagName(''); setShowCreate(false); }
                    }}>Criar</Button>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════
// DRAGGABLE DEAL CARD
// ═══════════════════════════════════════════════
function DraggableDealCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
    const followup = relativeDate(deal.next_followup_date);
    const age = daysAgo(deal.created_at);
    const priorityBorder = deal.priority === 'hot' ? 'border-l-red-500' : deal.priority === 'warm' ? 'border-l-yellow-500' : 'border-l-blue-300';

    return (
        <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-40 z-50' : ''}>
            <Card className={`group cursor-pointer hover:shadow-lg transition-all border-l-[3px] ${priorityBorder} hover:scale-[1.01]`}>
                <CardContent className="p-3 space-y-2">
                    {/* Drag handle + Title */}
                    <div className="flex items-start gap-1.5">
                        <button {...listeners} {...attributes} className="mt-0.5 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted/50 shrink-0 touch-none">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <div className="flex-1 min-w-0" onClick={onClick}>
                            <div className="flex items-start justify-between gap-1">
                                <h4 className="font-semibold text-sm leading-tight flex-1 line-clamp-2">{deal.title}</h4>
                                <PriorityBadge priority={deal.priority} />
                            </div>
                        </div>
                    </div>

                    <div onClick={onClick} className="space-y-2">
                        {/* Tags */}
                        {deal.tags && deal.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {deal.tags.map(tag => (
                                    <span key={tag.id} className="px-1.5 py-0 rounded-full text-[9px] font-medium"
                                        style={{ backgroundColor: tag.color + '20', color: tag.color, border: `1px solid ${tag.color}40` }}>
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Company & Contact */}
                        {deal.company && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="h-3 w-3 shrink-0" /><span className="truncate">{deal.company}</span></div>}
                        {deal.contact_name && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><User className="h-3 w-3 shrink-0" /><span className="truncate">{deal.contact_name}</span></div>}

                        {/* Value + Age */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-primary">{fmt(deal.value)}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{age}d</span>
                        </div>

                        {/* Follow-up */}
                        {followup && (
                            <div className={`flex items-center gap-1.5 text-[11px] font-medium rounded-md px-2 py-1 ${followup.overdue ? 'bg-red-50 text-red-600 dark:bg-red-950/30' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/30'}`}>
                                {followup.overdue ? <Flame className="h-3 w-3" /> : <CalendarIcon className="h-3 w-3" />}
                                {followup.text}
                                {deal.next_followup_type && <span className="ml-auto opacity-70">{ACTIVITY_ICONS[deal.next_followup_type as DealActivity['type']]?.emoji}</span>}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Drag overlay (ghost card)
function DragOverlayCard({ deal }: { deal: Deal }) {
    const priorityBorder = deal.priority === 'hot' ? 'border-l-red-500' : deal.priority === 'warm' ? 'border-l-yellow-500' : 'border-l-blue-300';
    return (
        <Card className={`w-[210px] shadow-xl border-l-[3px] ${priorityBorder} rotate-2 opacity-90`}>
            <CardContent className="p-3"><h4 className="font-semibold text-sm">{deal.title}</h4><p className="text-xs text-primary font-bold mt-1">{fmt(deal.value)}</p></CardContent>
        </Card>
    );
}

// ═══════════════════════════════════════════════
// DROPPABLE COLUMN
// ═══════════════════════════════════════════════
function DroppableColumn({ stage, children }: { stage: string; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id: stage });
    return (
        <div ref={setNodeRef} className={`space-y-2 min-h-[120px] transition-colors rounded-lg p-1 ${isOver ? 'bg-primary/5 ring-2 ring-primary/30 ring-dashed' : ''}`}>
            {children}
        </div>
    );
}

// ═══════════════════════════════════════════════
// ACTIVITY ITEM
// ═══════════════════════════════════════════════
function ActivityItem({ activity, onComplete, onDelete, onUpdate }: { activity: DealActivity; onComplete: (id: string) => void; onDelete: (id: string) => void; onUpdate: (data: any) => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const icon = ACTIVITY_ICONS[activity.type];

    if (isEditing) {
        return (
            <ActivityForm
                initialValues={{
                    type: activity.type,
                    title: activity.title,
                    description: activity.description || '',
                    scheduled_at: activity.scheduled_at || ''
                }}
                onSubmit={(data) => {
                    onUpdate({ id: activity.id, ...data });
                    setIsEditing(false);
                }}
                onCancel={() => setIsEditing(false)}
                isSubmitting={false}
            />
        );
    }

    return (
        <div className="flex gap-3 group">
            <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${activity.is_completed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>{icon.emoji}</div>
                <div className="w-px flex-1 bg-border" />
            </div>
            <div className="pb-4 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div><p className="text-sm font-medium">{activity.title}</p><p className="text-xs text-muted-foreground">{icon.label}</p></div>
                    <div className="flex gap-1 shrink-0">
                        {!activity.is_completed && (
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => onComplete(activity.id)}>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Concluir
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground opacity-0 group-hover:opacity-100" onClick={() => setIsEditing(true)}>
                            <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive opacity-0 group-hover:opacity-100" onClick={() => onDelete(activity.id)}>
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
                {activity.description && <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>}
                {activity.outcome && <p className="text-xs text-green-600 dark:text-green-400 mt-1 italic">✓ {activity.outcome}</p>}
                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                    {activity.scheduled_at && <span className="flex items-center gap-0.5"><CalendarIcon className="h-3 w-3" />{format(new Date(activity.scheduled_at), "dd/MM HH:mm", { locale: ptBR })}</span>}
                    {activity.is_completed && <Badge variant="outline" className="text-[9px] px-1 h-4 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">Concluído</Badge>}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// ACTIVITY FORM (Reusable)
// ═══════════════════════════════════════════════════════════
function ActivityForm({ initialValues, onSubmit, onCancel, submitLabel = "Salvar", isSubmitting }: {
    initialValues: { type: DealActivity['type']; title: string; description: string; scheduled_at: string };
    onSubmit: (data: any) => void;
    onCancel?: () => void;
    submitLabel?: string;
    isSubmitting: boolean;
}) {
    const [form, setForm] = useState(initialValues);
    const handleSubmit = () => {
        if (!form.title) return;
        onSubmit(form);
    };

    return (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                {onCancel ? <Edit2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />} {onCancel ? "Editar Atividade" : "Nova Atividade"}
            </h4>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-xs">Tipo</Label>
                    <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v as DealActivity['type'] }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(ACTIVITY_ICONS).filter(([k]) => k !== 'stage_change').map(([k, v]) => (<SelectItem key={k} value={k} className="text-xs">{v.emoji} {v.label}</SelectItem>))}</SelectContent>
                    </Select>
                </div>
                <DateTimePicker label="Data/Hora" value={form.scheduled_at} onChange={(v) => setForm(f => ({ ...f, scheduled_at: v }))} showTime />
            </div>
            <div>
                <Label className="text-xs">Título *</Label>
                <Input className="h-8 text-xs" placeholder="Ex: Ligar para confirmar proposta" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
                <Label className="text-xs">Descrição</Label>
                <Textarea className="text-xs min-h-[40px]" placeholder="Detalhes..." value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex gap-2">
                {onCancel && <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={onCancel}>Cancelar</Button>}
                <Button size="sm" className={`h-7 text-xs ${onCancel ? 'flex-1' : 'w-full'}`} onClick={handleSubmit} disabled={!form.title || isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : (onCancel ? <Save className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />)} {submitLabel}
                </Button>
            </div>
        </div>
    );
}

function AddActivityForm({ dealId, onAdd, isAdding }: { dealId: string; onAdd: (a: any) => void; isAdding: boolean }) {
    const [key, setKey] = useState(0); // Force reset on submit
    return (
        <ActivityForm
            key={key}
            initialValues={{ type: 'call', title: '', description: '', scheduled_at: '' }}
            onSubmit={(data) => {
                onAdd({ deal_id: dealId, type: data.type, title: data.title, description: data.description || null, outcome: null, scheduled_at: data.scheduled_at || null, completed_at: null, is_completed: false });
                setKey(k => k + 1);
            }}
            isSubmitting={isAdding}
            submitLabel="Registrar"
        />
    );
}

// ═══════════════════════════════════════════════
// PLAN SELECTOR (Product-based pricing)
// ═══════════════════════════════════════════════
function PlanSelector({ deal, onUpdate }: { deal: Deal; onUpdate: (updates: Partial<Deal> & { id: string }) => void }) {
    const { data: plans = [] } = usePlans();
    const selectedPlan = plans.find(p => p.id === deal.plan_id);
    const cycle = deal.billing_cycle || 'monthly';

    const handlePlanSelect = (planId: string) => {
        if (planId === 'none') {
            onUpdate({ id: deal.id, plan_id: null });
            return;
        }
        const plan = plans.find(p => p.id === planId);
        if (plan) {
            const value = cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
            onUpdate({ id: deal.id, plan_id: planId, value });
        }
    };

    const handleCycleChange = (newCycle: string) => {
        const plan = selectedPlan;
        if (plan) {
            const value = newCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
            onUpdate({ id: deal.id, billing_cycle: newCycle as 'monthly' | 'yearly', value });
        } else {
            onUpdate({ id: deal.id, billing_cycle: newCycle as 'monthly' | 'yearly' });
        }
    };

    return (
        <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Package className="h-3 w-3" /> Produto / Plano
            </h3>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-xs">Plano</Label>
                    <Select value={deal.plan_id || ''} onValueChange={handlePlanSelect}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar plano" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none" className="text-xs text-muted-foreground italic">-- Sem plano (Personalizado) --</SelectItem>
                            {plans.map(p => (
                                <SelectItem key={p.id} value={p.id} className="text-xs">
                                    {p.name} — {fmt(p.price_monthly)}/mês
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs">Ciclo</Label>
                    <Select value={cycle} onValueChange={handleCycleChange}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="monthly" className="text-xs">Mensal</SelectItem>
                            <SelectItem value="yearly" className="text-xs">Anual</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {selectedPlan && (
                <div className="text-xs bg-primary/5 rounded-md p-2">
                    <span className="font-medium">Valor calculado: </span>
                    <span className="font-bold text-primary">{fmt(cycle === 'yearly' ? selectedPlan.price_yearly : selectedPlan.price_monthly)}</span>
                    <span className="text-muted-foreground">/{cycle === 'yearly' ? 'ano' : 'mês'}</span>
                </div>
            )}
            {!selectedPlan && (
                <div className="grid gap-1">
                    <Label className="text-xs">Valor Manual (R$)</Label>
                    <Input type="number" className="h-8 text-xs" value={deal.value}
                        onChange={(e) => onUpdate({ id: deal.id, value: parseFloat(e.target.value) || 0 })} />
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════
// DEAL DETAIL SHEET
// ═══════════════════════════════════════════════
function DealDetailSheet({ deal, open, onClose, onUpdateDeal, onDeleteDeal }: {
    deal: Deal | null; open: boolean; onClose: () => void;
    onUpdateDeal: (updates: Partial<Deal> & { id: string }) => void; onDeleteDeal: (id: string) => void;
}) {
    const { activities, pendingActivities, completedActivities, addActivity, updateActivity, completeActivity, deleteActivity, isAdding } = useDealActivities(deal?.id || null);
    const { createTag } = useDealTags();
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Deal>>({});
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    if (!deal) return null;

    const stageConfig = STAGE_CONFIG[deal.stage];

    const startEdit = () => {
        setEditForm({ company: deal.company, contact_name: deal.contact_name, contact_email: deal.contact_email, contact_phone: deal.contact_phone, source: deal.source, expected_close_date: deal.expected_close_date });
        setEditing(true);
    };
    const saveEdit = () => {
        onUpdateDeal({ id: deal.id, ...editForm });
        setEditing(false);
    };

    const handleTagToggle = (tag: DealTag) => {
        const current = deal.tags || [];
        const exists = current.some(t => t.id === tag.id);
        const newTags = exists ? current.filter(t => t.id !== tag.id) : [...current, tag];
        // For mock: update local tags (Supabase would need deal_tag_links operations)
        onUpdateDeal({ id: deal.id, tags: newTags } as any);
    };

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-[560px] p-0 flex flex-col">
                {/* Header */}
                <div className="p-5 pb-4 border-b space-y-3">
                    <div className="flex items-start justify-between gap-4 w-full">
                        <div className="space-y-1">
                            <SheetTitle className="text-xl font-bold leading-none">{deal.title}</SheetTitle>
                            <SheetDescription className="text-xs">Criado em {new Date(deal.created_at).toLocaleDateString()}</SheetDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className={`${stageConfig.bgColor} ${stageConfig.color} border-0`}>{stageConfig.label}</Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteDialogOpen(true)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <PriorityBadge priority={deal.priority} />
                        <Select value={deal.priority} onValueChange={(v) => onUpdateDeal({ id: deal.id, priority: v as Deal['priority'] })}>
                            <SelectTrigger className="h-6 w-20 text-[10px] border-dashed"><SelectValue /></SelectTrigger>
                            <SelectContent>{Object.entries(PRIORITY_CONFIG).map(([k, v]) => (<SelectItem key={k} value={k} className="text-xs">{v.emoji} {v.label}</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-lg bg-primary/5 p-2.5 text-center"><p className="text-lg font-bold text-primary">{fmt(deal.value)}</p><p className="text-[10px] text-muted-foreground">Valor</p></div>
                        <div className="rounded-lg bg-muted/50 p-2.5 text-center"><p className="text-lg font-bold">{daysAgo(deal.created_at)}d</p><p className="text-[10px] text-muted-foreground">No Funil</p></div>
                        <div className="rounded-lg bg-muted/50 p-2.5 text-center"><p className="text-lg font-bold">{pendingActivities.length}</p><p className="text-[10px] text-muted-foreground">Pendentes</p></div>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-5 space-y-5">
                        {/* Editable Contact */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contato</h3>
                                {editing ? (
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setEditing(false)}><X className="h-3 w-3" /></Button>
                                        <Button size="sm" className="h-6 px-2 text-[10px]" onClick={saveEdit}><Save className="h-3 w-3 mr-1" /> Salvar</Button>
                                    </div>
                                ) : (
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={startEdit}><Edit2 className="h-3 w-3 mr-1" /> Editar</Button>
                                )}
                            </div>
                            {editing ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="grid gap-1"><Label className="text-[10px]">Empresa</Label><Input className="h-7 text-xs" value={editForm.company || ''} onChange={(e) => setEditForm(f => ({ ...f, company: e.target.value }))} /></div>
                                    <div className="grid gap-1"><Label className="text-[10px]">Nome</Label><Input className="h-7 text-xs" value={editForm.contact_name || ''} onChange={(e) => setEditForm(f => ({ ...f, contact_name: e.target.value }))} /></div>
                                    <div className="grid gap-1"><Label className="text-[10px]">Email</Label><Input className="h-7 text-xs" value={editForm.contact_email || ''} onChange={(e) => setEditForm(f => ({ ...f, contact_email: e.target.value }))} /></div>
                                    <div className="grid gap-1"><Label className="text-[10px]">Telefone</Label><Input className="h-7 text-xs" placeholder="5511999999999" value={editForm.contact_phone || ''} onChange={(e) => setEditForm(f => ({ ...f, contact_phone: e.target.value }))} /></div>
                                    <div className="grid gap-1"><Label className="text-[10px]">Fonte</Label>
                                        <Select value={editForm.source || ''} onValueChange={(v) => setEditForm(f => ({ ...f, source: v }))}>
                                            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                            <SelectContent>{['Inbound', 'Outbound', 'Indicação', 'LinkedIn', 'Website', 'Evento', 'Outro'].map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2">
                                        <DateTimePicker label="Previsão de Fechamento" value={editForm.expected_close_date || ''} onChange={(v) => setEditForm(f => ({ ...f, expected_close_date: v }))} />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {deal.contact_name && <div className="flex items-center gap-2 text-sm bg-muted/30 rounded-md p-2"><User className="h-4 w-4 text-muted-foreground" />{deal.contact_name}</div>}
                                    {deal.contact_email && <div className="flex items-center gap-2 text-sm bg-muted/30 rounded-md p-2 truncate"><Mail className="h-4 w-4 text-muted-foreground shrink-0" /><span className="truncate">{deal.contact_email}</span></div>}
                                    {deal.contact_phone && (
                                        <div className="flex items-center justify-between gap-2 text-sm bg-muted/30 rounded-md p-2 col-span-2">
                                            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground shrink-0" />{deal.contact_phone}</div>
                                            <a href={`https://web.whatsapp.com/send?phone=${deal.contact_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold rounded-md transition-colors">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" className="w-3 h-3 brightness-0 invert" /> WhatsApp
                                            </a>
                                        </div>
                                    )}
                                    {deal.source && <div className="flex items-center gap-2 text-sm bg-muted/30 rounded-md p-2"><Zap className="h-4 w-4 text-muted-foreground" />Fonte: {deal.source}</div>}
                                    {deal.expected_close_date && <div className="flex items-center gap-2 text-sm bg-muted/30 rounded-md p-2"><Target className="h-4 w-4 text-muted-foreground" />Prev: {new Date(deal.expected_close_date).toLocaleDateString('pt-BR')}</div>}
                                </div>
                            )}
                        </div>

                        {/* Tags */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Tag className="h-3 w-3" /> Tags</h3>
                            <TagManager dealTags={deal.tags || []} onToggle={handleTagToggle}
                                onCreateNew={(name, color) => createTag({ name, color })} />
                        </div>

                        <Separator />

                        {/* Plan-based pricing */}
                        <PlanSelector deal={deal} onUpdate={onUpdateDeal} />

                        <Separator />

                        {/* Notes */}
                        {deal.notes && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações</h3>
                                <p className="text-sm text-muted-foreground bg-muted/20 rounded-md p-3">{deal.notes}</p>
                            </div>
                        )}

                        <Separator />

                        {/* Add Activity */}
                        <AddActivityForm dealId={deal.id} onAdd={addActivity} isAdding={isAdding} />

                        {/* Pending */}
                        {pendingActivities.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Circle className="h-3 w-3 text-amber-500" /> Pendentes ({pendingActivities.length})</h3>
                                {pendingActivities.map(a => (<ActivityItem key={a.id} activity={a} onComplete={(id) => completeActivity({ id })} onDelete={deleteActivity} onUpdate={updateActivity} />))}
                            </div>
                        )}

                        {/* Completed */}
                        {completedActivities.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-500" /> Concluídas ({completedActivities.length})</h3>
                                {completedActivities.map(a => (<ActivityItem key={a.id} activity={a} onComplete={() => { }} onDelete={deleteActivity} onUpdate={updateActivity} />))}
                            </div>
                        )}

                        {activities.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade registrada.</p>}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="p-4 border-t flex gap-2">
                    {!['closed_won', 'closed_lost'].includes(deal.stage) && (
                        <>
                            <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { onUpdateDeal({ id: deal.id, stage: 'closed_lost' as Deal['stage'] }); onClose(); }}>Perdido</Button>
                            <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => { onUpdateDeal({ id: deal.id, stage: 'closed_won' as Deal['stage'] }); onClose(); }}><Trophy className="h-4 w-4 mr-1" /> Ganho!</Button>
                        </>
                    )}
                </div>
            </SheetContent>

            <DeleteDealDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={() => {
                    onDeleteDeal(deal.id);
                    setDeleteDialogOpen(false);
                    onClose();
                }}
            />
        </Sheet>
    );
}

// ═══════════════════════════════════════════════
// CREATE DEAL MODAL
// ═══════════════════════════════════════════════
function CreateDealModal({ onCreate, isCreating }: { onCreate: (d: any) => void; isCreating: boolean }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ title: '', company: '', contact_name: '', contact_email: '', contact_phone: '', value: '', stage: 'lead' as Deal['stage'], priority: 'warm' as Deal['priority'], notes: '', expected_close_date: '', source: '', next_followup_date: '', next_followup_type: 'call' });

    const handleSubmit = () => {
        if (!form.title) return;
        onCreate({ title: form.title, company: form.company || null, contact_name: form.contact_name || null, contact_email: form.contact_email || null, contact_phone: form.contact_phone || null, value: parseFloat(form.value) || 0, stage: form.stage, priority: form.priority, notes: form.notes || null, expected_close_date: form.expected_close_date || null, source: form.source || null, lost_reason: null, next_followup_date: form.next_followup_date || null, next_followup_type: form.next_followup_type || null, plan_id: null, billing_cycle: 'monthly' });
        setForm({ title: '', company: '', contact_name: '', contact_email: '', contact_phone: '', value: '', stage: 'lead', priority: 'warm', notes: '', expected_close_date: '', source: '', next_followup_date: '', next_followup_type: 'call' });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Novo Negócio</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Adicionar Negócio</DialogTitle>
                    <DialogDescription>Preencha os dados para iniciar o acompanhamento.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2"><Label>Título *</Label><Input placeholder="Ex: Contrato Enterprise ABC" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label>Empresa</Label><Input placeholder="ABC Corp" value={form.company} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} /></div>
                        <div className="grid gap-2"><Label>Valor (R$)</Label><Input type="number" placeholder="10000" value={form.value} onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label>Contato</Label><Input placeholder="Nome" value={form.contact_name} onChange={(e) => setForm(f => ({ ...f, contact_name: e.target.value }))} /></div>
                        <div className="grid gap-2"><Label>Email</Label><Input type="email" placeholder="email@empresa.com" value={form.contact_email} onChange={(e) => setForm(f => ({ ...f, contact_email: e.target.value }))} /></div>
                    </div>
                    <div className="grid gap-2"><Label>Telefone (WhatsApp)</Label><Input placeholder="5511999999999" value={form.contact_phone} onChange={(e) => setForm(f => ({ ...f, contact_phone: e.target.value }))} /></div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2"><Label>Estágio</Label><Select value={form.stage} onValueChange={(v) => setForm(f => ({ ...f, stage: v as Deal['stage'] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ACTIVE_STAGES.filter(s => s !== 'closed_lost').map(s => (<SelectItem key={s} value={s}>{STAGE_CONFIG[s].label}</SelectItem>))}</SelectContent></Select></div>
                        <div className="grid gap-2"><Label>Temperatura</Label><Select value={form.priority} onValueChange={(v) => setForm(f => ({ ...f, priority: v as Deal['priority'] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PRIORITY_CONFIG).map(([k, v]) => (<SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>))}</SelectContent></Select></div>
                        <div className="grid gap-2"><Label>Fonte</Label><Select value={form.source} onValueChange={(v) => setForm(f => ({ ...f, source: v }))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{['Inbound', 'Outbound', 'Indicação', 'LinkedIn', 'Website', 'Evento', 'Outro'].map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <DateTimePicker label="Previsão de Fechamento" value={form.expected_close_date} onChange={(v) => setForm(f => ({ ...f, expected_close_date: v }))} />
                        <DateTimePicker label="Próximo Follow-up" value={form.next_followup_date} onChange={(v) => setForm(f => ({ ...f, next_followup_date: v }))} />
                    </div>
                    <div className="grid gap-2"><Label>Notas</Label><Textarea placeholder="Observações..." value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={!form.title || isCreating}>{isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Adicionar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ═══════════════════════════════════════════════════════════
function DeleteDealDialog({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void }) {
    const [confirmText, setConfirmText] = useState('');

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) setConfirmText(''); onOpenChange(v); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Excluir Negócio</DialogTitle>
                    <DialogDescription>
                        Esta ação removerá o negócio e todo o histórico permanentemente.
                        <br />Para confirmar, digite <strong className="text-red-600">EXCLUIR</strong> abaixo.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Digite EXCLUIR para confirmar"
                        className="border-red-200 focus-visible:ring-red-500"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button
                        variant="destructive"
                        disabled={confirmText !== 'EXCLUIR'}
                        onClick={onConfirm}
                    >
                        Excluir Permanentemente
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ═══════════════════════════════════════════════════════════
// MAIN PIPELINE
// ═══════════════════════════════════════════════════════════
export function PipelineContent() {
    const { deals, isLoading, createDeal, updateDeal, deleteDeal, pipelineValue, wonValue, activeDeals, hotDeals, isCreating } = useDeals();
    const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
    const selectedDeal = deals.find(d => d.id === selectedDealId) || null;
    const [draggingDeal, setDraggingDeal] = useState<Deal | null>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const handleDragStart = useCallback((e: DragStartEvent) => {
        const deal = deals.find(d => d.id === e.active.id);
        if (deal) setDraggingDeal(deal);
    }, [deals]);

    const handleDragEnd = useCallback((e: DragEndEvent) => {
        setDraggingDeal(null);
        const { active, over } = e;
        if (over && active.id !== over.id) {
            const targetStage = over.id as Deal['stage'];
            if (ACTIVE_STAGES.includes(targetStage)) {
                updateDeal({ id: active.id as string, stage: targetStage });
            }
        }
    }, [updateDeal]);

    if (isLoading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="border-l-[3px] border-l-primary"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><DollarSign className="h-5 w-5 text-primary" /></div><div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pipeline</p><p className="text-lg font-bold">{fmt(pipelineValue)}</p></div></CardContent></Card>
                <Card className="border-l-[3px] border-l-green-500"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center shrink-0"><Trophy className="h-5 w-5 text-green-600" /></div><div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ganhos</p><p className="text-lg font-bold text-green-600">{fmt(wonValue)}</p></div></CardContent></Card>
                <Card className="border-l-[3px] border-l-blue-500"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0"><TrendingUp className="h-5 w-5 text-blue-600" /></div><div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ativos</p><p className="text-lg font-bold">{activeDeals}</p></div></CardContent></Card>
                <Card className="border-l-[3px] border-l-red-500"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0"><Flame className="h-5 w-5 text-red-500" /></div><div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Quentes</p><p className="text-lg font-bold text-red-500">{hotDeals}</p></div></CardContent></Card>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between">
                <div><h2 className="text-lg font-semibold">Pipeline de Vendas</h2><p className="text-xs text-muted-foreground">Arraste os cards entre colunas ou clique para detalhes</p></div>
                <CreateDealModal onCreate={createDeal} isCreating={isCreating} />
            </div>

            {/* DnD Kanban */}
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
                    {ACTIVE_STAGES.map((stage) => {
                        const config = STAGE_CONFIG[stage];
                        const stageDeals = deals.filter(d => d.stage === stage);
                        const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);

                        return (
                            <div key={stage} className="min-w-[220px] w-[220px] shrink-0 space-y-2">
                                <div className={`rounded-lg border p-3 ${config.bgColor}`}>
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className={`text-[11px] font-bold uppercase tracking-wider ${config.color}`}>{config.label}</span>
                                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{stageDeals.length}</Badge>
                                    </div>
                                    <p className="text-[11px] font-semibold text-muted-foreground">{fmt(stageTotal)}</p>
                                </div>
                                <DroppableColumn stage={stage}>
                                    {stageDeals.map(deal => (
                                        <DraggableDealCard key={deal.id} deal={deal} onClick={() => setSelectedDealId(deal.id)} />
                                    ))}
                                    {stageDeals.length === 0 && (
                                        <div className="border-2 border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground">Nenhum negócio</div>
                                    )}
                                </DroppableColumn>
                            </div>
                        );
                    })}
                </div>
                <DragOverlay>{draggingDeal ? <DragOverlayCard deal={draggingDeal} /> : null}</DragOverlay>
            </DndContext>

            {/* Detail Sheet */}
            <DealDetailSheet deal={selectedDeal} open={!!selectedDealId} onClose={() => setSelectedDealId(null)} onUpdateDeal={updateDeal} onDeleteDeal={deleteDeal} />
        </div>
    );
}
