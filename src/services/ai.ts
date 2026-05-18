// AI service — calls the secure serverless proxy at /api/ai-chat
// API keys are NEVER exposed to the browser.

export interface FinancialContext {
    mrr: number;
    arr: number;
    growth: number;
    revenue: number;
    expenses: number;
    active_clients: number;
    churn_rate: number;
    last_month: string;
}

export const generateFinancialResponse = async (
    message: string,
    context: FinancialContext | null,
    token: string
): Promise<{ text: string; dataUpdated: boolean }> => {
    if (!token) {
        return { text: "Erro: Você precisa estar logado para usar a IA.", dataUpdated: false };
    }

    try {
        const response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ message, context }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('AI proxy error:', response.status, errorData);
            throw new Error(errorData.error || 'AI request failed');
        }

        return await response.json();
    } catch (error) {
        console.error("Error generating AI response:", error);
        return {
            text: "Desculpe, tive um problema ao processar sua solicitação. Verifique sua conexão ou tente novamente.",
            dataUpdated: false
        };
    }
};
