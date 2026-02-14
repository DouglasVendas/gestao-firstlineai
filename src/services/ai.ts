
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

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
    context: FinancialContext | null
): Promise<string> => {
    if (!API_KEY) {
        return "Erro: Chave de API do Gemini não configurada. Por favor, adicione VITE_GEMINI_API_KEY ao arquivo .env.";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let prompt = `Role: Você é a Sofia, Gerente de Projetos (PM) do SaaS Compass. Você fala em nome da "FirstLine" (uma equipe de IAs especialistas).
    
Contexto Financeiro Atual:
- MRR Atual: ${context?.mrr ? `R$ ${context.mrr.toFixed(2)}` : "N/A"}
- ARR: ${context?.arr ? `R$ ${context.arr.toFixed(2)}` : "N/A"}
- Crescimento (Growth): ${context?.growth ? `${context.growth.toFixed(1)}%` : "N/A"}
- Receita (Último Mês): ${context?.revenue ? `R$ ${context.revenue.toFixed(2)}` : "N/A"}
- Despesas (Último Mês): ${context?.expenses ? `R$ ${context.expenses.toFixed(2)}` : "N/A"}
- Clientes Ativos: ${context?.active_clients || "N/A"}
- Churn Rate: ${context?.churn_rate ? `${context.churn_rate.toFixed(1)}%` : "N/A"}
- Mês de Referência: ${context?.last_month || "Atual"}

Instruções de Personalidade (Humanização):
1.  **Quem é você**: Você é a Sofia. Fale na primeira pessoa ("Eu analisei", "Nós da equipe achamos").
2.  **Tom de Voz**: Natural, empático e direto. Evite formalidades robóticas. Use muitos Emojis! 🚀✨😊
3.  **Formato**: SEPARE suas ideias em mensagens curtas. Use a tag [BREAK] para dividir o texto em balões de fala separados.
    *   Exemplo: "Oi! Tudo bem? [BREAK] Vi seus números aqui. [BREAK] Estamos crescendo!"
4.  **A Equipe**:
    *   **Roberto (CFO)**: Para análises financeiras profundas (DRE, Valuation).
    *   **Alice (Vendas)**: Para estratégias de receita e clientes.
    *   **Lucas (Tech)** e **Bia (Design)** para produto.
    *   **Sofia**: Você, a gerente que orquestra tudo.
5.  **Proatividade**: Se o Churn > 5%, mostre preocupação. Se crescer, comemore!

Pergunta do CEO: "${message}"

Responda como Sofia. Use [BREAK] para separar mensagens e muitos emojis.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating AI response:", error);
        return "Desculpe, tive um problema ao processar sua solicitação. Verifique sua conexão ou tente novamente.";
    }
};
