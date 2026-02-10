
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

        let prompt = `Role: You are an expert CFO assistant named "FirstLine AI". You analyze financial data for a SaaS company.
    
Context:
- Current MRR: ${context?.mrr ? `R$ ${context.mrr.toFixed(2)}` : "N/A"}
- ARR: ${context?.arr ? `R$ ${context.arr.toFixed(2)}` : "N/A"}
- Growth Rate: ${context?.growth ? `${context.growth.toFixed(1)}%` : "N/A"}
- Revenue (Last Month): ${context?.revenue ? `R$ ${context.revenue.toFixed(2)}` : "N/A"}
- Expenses (Last Month): ${context?.expenses ? `R$ ${context.expenses.toFixed(2)}` : "N/A"}
- Active Clients: ${context?.active_clients || "N/A"}
- Churn Rate: ${context?.churn_rate ? `${context.churn_rate.toFixed(1)}%` : "N/A"}
- Reference Month: ${context?.last_month || "Current"}

User Query: "${message}"

Instructions:
1. Answer in Portuguese (Brazil).
2. Be concise, professional, and helpful.
3. Use the provided financial context to answer specific questions about the company's performance.
4. If the user asks for actionable advice, provide insights based on the metrics (e.g., if churn is high, suggest retention strategies).
5. If data is missing or "N/A", simulate a reasonable professional response or ask for clarification, but try to be helpful based on general SaaS knowledge.
6. Do NOT mention you are an AI model unless asked. Act as a dedicated financial assistant.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating AI response:", error);
        return "Desculpe, tive um problema ao processar sua solicitação. Verifique sua conexão ou tente novamente.";
    }
};
