
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth/AuthContext';

import { useChatHistory } from '@/hooks/useChatHistory';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

import { generateFinancialResponse, FinancialContext } from '@/services/ai';
import { useFinancialSnapshot } from '@/hooks/useFinancialMetrics';

export function AIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [input, setInput] = useState('');
    const queryClient = useQueryClient();
    const { session } = useAuth();

    // Replace legacy useFinancials with snapshot
    const { current, previous } = useFinancialSnapshot();

    const { messages, addMessage } = useChatHistory([
        {
            id: '1',
            role: 'assistant',
            content: 'Olá! Sou sua IA financeira. Posso ajudar a preencher dados, analisar métricas ou ajustar configurações. Como posso ajudar hoje?',
            timestamp: new Date()
        }
    ]);

    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        addMessage(userMsg);
        setInput('');
        setIsTyping(true);

        try {
            // Prepare Context
            let context: FinancialContext | null = null;
            if (current) {
                // Calculate growth from previous
                let growth = 0;
                if (previous && previous.mrr > 0) {
                    growth = ((current.mrr - previous.mrr) / previous.mrr) * 100;
                }

                context = {
                    mrr: current.mrr,
                    arr: current.arr,
                    growth: growth,
                    revenue: current.revenue,
                    expenses: current.totalExpenses,
                    active_clients: current.activeClients,
                    churn_rate: current.churnRate,
                    last_month: current.month
                };
            }

            const accessToken = session?.access_token || '';
            const { text: responseText } = await generateFinancialResponse(userMsg.content, context, accessToken);

            // Split into separate bubbles
            const parts = responseText.split('[BREAK]').map(p => p.trim()).filter(p => p);

            for (const part of parts) {
                const aiMsg: Message = {
                    id: (Date.now() + Math.random()).toString(),
                    role: 'assistant',
                    content: part,
                    timestamp: new Date()
                };
                addMessage(aiMsg);
                // Optional: small artificial delay could be added here if we had an async addMessage wrapper
            }
        } catch (error) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Desculpe, a Sofia tropeçou nos cabos aqui! 🔌😅 Tente de novo?",
                timestamp: new Date()
            };
            addMessage(errorMsg);
        } finally {
            setIsTyping(false);
        }
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all duration-300 z-50 animate-in fade-in zoom-in"
            >
                <Sparkles className="h-6 w-6 text-white" />
            </Button>
        );
    }

    return (
        <Card className={`fixed bottom-6 right-6 flex flex-col shadow-2xl border-primary/20 bg-background/95 backdrop-blur-md z-50 transition-all duration-300 ${isExpanded ? 'w-[600px] h-[80vh]' : 'w-[350px] h-[500px]'}`}>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-primary/5 rounded-t-lg">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">FirstLine AI</h3>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Online
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExpanded(!isExpanded)}>
                        {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-muted/80 backdrop-blur-sm rounded-tl-none border border-border/50'
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-muted/50 p-3 rounded-2xl rounded-tl-none flex gap-1">
                                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="flex gap-2"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Digite sua solicitação..."
                        className="flex-1 bg-background/50"
                    />
                    <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </Card>
    );
}
