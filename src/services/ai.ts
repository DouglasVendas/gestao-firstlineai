import OpenAI from "openai";
import { supabase } from "@/integrations/supabase/client";

// Initialize Moonshot (Kimi) AI
const API_KEY = import.meta.env.VITE_KIMI_API_KEY || "";
const openai = new OpenAI({
    apiKey: API_KEY,
    baseURL: "https://api.moonshot.cn/v1",
    dangerouslyAllowBrowser: true, // we are calling it from vite frontend
});

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

// 1. Declarar as ferramentas que o Kimi pode chamar
const tools: any[] = [
    {
        type: "function",
        function: {
            name: "update_transaction_data",
            description: "Atualiza os dados de uma ou múltiplas transações financeiras específicas (Invoices, fixed_costs, variable_costs ou transactions) no banco de dados.",
            parameters: {
                type: "object",
                properties: {
                    table_name: {
                        type: "string",
                        description: "O nome da tabela para atualizar (invoices, fixed_costs, variable_costs, transactions). Caso a intenção seja sobre vendas, provavelmente é invoices.",
                    },
                    filters: {
                        type: "object",
                        description: "Filtros para encontrar os registros (ex: { description: 'Nome do Cliente' }).",
                    },
                    updates: {
                        type: "object",
                        description: "Colunas e novos valores para atualizar (ex: { amount: 150.50, status: 'completed' }).",
                    }
                },
                required: ["table_name", "filters", "updates"],
            }
        }
    },
    {
        type: "function",
        function: {
            name: "query_transaction_data",
            description: "Pesquisa por transações financeiras específicas no banco de dados para responder perguntas numéricas (listagem, somatórias, quantidades). Útil para listar itens de um mês ou pesquisar uma entrada específica.",
            parameters: {
                type: "object",
                properties: {
                    table_name: {
                        type: "string",
                        description: "O nome da tabela para pesquisar (prioritariamente 'transactions').",
                    },
                    filters: {
                        type: "object",
                        description: "Filtros exatos de igualdade (ex: { category: 'Venda', type: 'income' }). Opcional.",
                    },
                    search_description: {
                        type: "string",
                        description: "Palavra chave opcional para buscar na descrição usando ilike (ex: 'C6 Bank').",
                    },
                    date_range: {
                        type: "object",
                        description: "Filtro opcional de período. Objeto com { start_date: 'YYYY-MM-DD', end_date: 'YYYY-MM-DD' }.",
                    }
                },
                required: ["table_name"],
            }
        }
    }
];

export const generateFinancialResponse = async (
    message: string,
    context: FinancialContext | null,
    history: any[] = [] // Opcional, para passar histórico no futuro
): Promise<{ text: string; dataUpdated: boolean }> => {
    if (!API_KEY) {
        return { text: "Erro: Chave de API do Kimi não configurada. Por favor, adicione VITE_KIMI_API_KEY ao arquivo .env.", dataUpdated: false };
    }

    try {
        const prompt = `Role: Você é a Sofia, Gerente de Projetos (PM) do SaaS Compass. Você fala em nome da "FirstLine" (uma equipe de IAs especialistas).
    
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
4.  **A Equipe**: Roberto (CFO), Alice (Vendas), Lucas (Tech), Bia (Design), Sofia (PM - Você).
7.  **Acesso Direto ao Banco**: O CEO deu permissões para occê alterar DADOS! Se ele pedir para editar ou atualizar dados de uma certa transação, **USE A FERRAMENTA update_transaction_data**. Nunca diga "clique ali para fazer", faça por você mesma se possível!
8.  **Pesquisar Lançamentos**: Se o CEO perguntar valores passados, listagens do mês (ex: "Quais todas as entradas de setembro?") ou somatórias, **USE A FERRAMENTA query_transaction_data**. O BD tem todos os dados.

Pergunta do CEO: "${message}"

Responda como Sofia. Use [BREAK] para separar mensagens e muitos emojis.`;

        // Configure the chat messages
        const messages: any[] = [
            { role: "system", content: prompt },
            { role: "user", content: message } // The user's query is also in the system prompt above, but standard is passing user role too.
        ];

        let dataUpdated = false;

        let chatCompletion = await openai.chat.completions.create({
            model: "moonshot-v1-128k",
            messages: messages,
            tools: tools,
            temperature: 0.7,
        });

        let responseMessage = chatCompletion.choices[0].message;
        messages.push(responseMessage);

        // Loop para lidar com múltiplas chamadas de função
        while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            for (const toolCall of responseMessage.tool_calls) {
                if (!toolCall.function.name) continue;

                const args = JSON.parse(toolCall.function.arguments);

                if (toolCall.function.name === "update_transaction_data") {
                    console.log("[Sofia AI Tool] - Executing DB Update", args);
                    try {
                        let query = supabase.from(args.table_name).update(args.updates);

                        // Appending dynamic filters
                        if (args.filters) {
                            for (const [key, val] of Object.entries(args.filters)) {
                                if (typeof val === 'string' && key === 'description') {
                                    query = query.ilike(key, `%${val}%`);
                                } else {
                                    query = query.eq(key, val);
                                }
                            }
                        }

                        const { data, error } = await query.select();

                        if (error) throw error;
                        dataUpdated = true;

                        messages.push({
                            tool_call_id: toolCall.id,
                            role: "tool",
                            name: toolCall.function.name,
                            content: JSON.stringify({ status: "success", updatedRows: data?.length || 0, details: data })
                        });
                    } catch (e: any) {
                        console.error("AI Database Update Error", e);
                        messages.push({
                            tool_call_id: toolCall.id,
                            role: "tool",
                            name: toolCall.function.name,
                            content: JSON.stringify({ status: "error", message: e.message })
                        });
                    }
                } else if (toolCall.function.name === "query_transaction_data") {
                    console.log("[Sofia AI Tool] - Executing DB Query", args);
                    try {
                        let query = supabase.from(args.table_name).select('*');

                        if (args.filters) {
                            for (const [key, val] of Object.entries(args.filters)) {
                                query = query.eq(key, val);
                            }
                        }
                        if (args.search_description) {
                            query = query.ilike('description', `%${args.search_description}%`);
                        }
                        if (args.date_range && args.date_range.start_date) {
                            query = query.gte('date', args.date_range.start_date);
                        }
                        if (args.date_range && args.date_range.end_date) {
                            query = query.lte('date', args.date_range.end_date);
                        }

                        // Log para audit
                        console.log("Query parameters: ", args);

                        // Adicionar order e limit de segurança
                        const { data, error } = await query.order('date', { ascending: false }).limit(200);

                        if (error) throw error;

                        messages.push({
                            tool_call_id: toolCall.id,
                            role: "tool",
                            name: toolCall.function.name,
                            content: JSON.stringify({ status: "success", rowsFound: data?.length || 0, data: data })
                        });
                    } catch (e: any) {
                        console.error("AI Database Query Error", e);
                        messages.push({
                            tool_call_id: toolCall.id,
                            role: "tool",
                            name: toolCall.function.name,
                            content: JSON.stringify({ status: "error", message: e.message })
                        });
                    }
                }
            }

            // Call again with tool results
            chatCompletion = await openai.chat.completions.create({
                model: "moonshot-v1-128k",
                messages: messages,
                tools: tools,
                temperature: 0.7,
            });

            responseMessage = chatCompletion.choices[0].message;
            messages.push(responseMessage);
        }

        return { text: responseMessage.content || "", dataUpdated };
    } catch (error) {
        console.error("Error generating AI response:", error);
        return { text: "Desculpe, tive um problema ao processar sua solicitação. Verifique sua conexão ou tente novamente.", dataUpdated: false };
    }
};
