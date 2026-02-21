import { GoogleGenerativeAI, FunctionDeclaration, FunctionDeclarationSchema, FunctionDeclarationSchemaProperty } from "@google/generative-ai";
import { supabase } from "@/integrations/supabase/client";

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

// 1. Declarar as ferramentas que o Gemini pode chamar
const updateTransactionDeclaration: FunctionDeclaration = {
    name: "update_transaction_data",
    description: "Atualiza os dados de uma ou múltiplas transações financeiras específicas (Invoices, fixed_costs, variable_costs ou transactions) no banco de dados.",
    parameters: {
        type: "object" as any,
        properties: {
            table_name: {
                type: "string" as any,
                description: "O nome da tabela para atualizar (invoices, fixed_costs, variable_costs, transactions). Caso a intenção seja sobre vendas, provavelmente é invoices.",
            },
            filters: {
                type: "object" as any,
                description: "Filtros para encontrar os registros (ex: { description: 'Nome do Cliente' }).",
            },
            updates: {
                type: "object" as any,
                description: "Colunas e novos valores para atualizar (ex: { amount: 150.50, status: 'completed' }).",
            }
        },
        required: ["table_name", "filters", "updates"],
    } as FunctionDeclarationSchema,
};

const queryTransactionDeclaration: FunctionDeclaration = {
    name: "query_transaction_data",
    description: "Pesquisa por transações financeiras específicas no banco de dados para responder perguntas numéricas (listagem, somatórias, quantidades). Útil para listar itens de um mês ou pesquisar uma entrada específica.",
    parameters: {
        type: "object" as any,
        properties: {
            table_name: {
                type: "string" as any,
                description: "O nome da tabela para pesquisar (prioritariamente 'transactions').",
            },
            filters: {
                type: "object" as any,
                description: "Filtros exatos de igualdade (ex: { category: 'Venda', type: 'income' }). Opcional.",
            },
            search_description: {
                type: "string" as any,
                description: "Palavra chave opcional para buscar na descrição usando ilike (ex: 'C6 Bank').",
            },
            date_range: {
                type: "object" as any,
                description: "Filtro opcional de período. Objeto com { start_date: 'YYYY-MM-DD', end_date: 'YYYY-MM-DD' }.",
            }
        },
        required: ["table_name"],
    } as FunctionDeclarationSchema,
};

export const generateFinancialResponse = async (
    message: string,
    context: FinancialContext | null,
    history: any[] = [] // Opcional, para passar histórico no futuro
): Promise<{ text: string; dataUpdated: boolean }> => {
    if (!API_KEY) {
        return { text: "Erro: Chave de API do Gemini não configurada. Por favor, adicione VITE_GEMINI_API_KEY ao arquivo .env.", dataUpdated: false };
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            tools: [{
                functionDeclarations: [updateTransactionDeclaration, queryTransactionDeclaration],
            }],
        });

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
7.  **Acesso Direto ao Banco**: O CEO deu permissões para vocé alterar DADOS! Se ele pedir para editar ou atualizar dados de uma certa transação, **USE A FERRAMENTA update_transaction_data**.
    Nunca diga "clique ali para fazer", faça por você mesma se possível!
8.  **Pesquisar Lançamentos**: Se o CEO perguntar valores passados, listagens do mês (ex: "Quais todas as entradas de setembro?") ou somatórias, **USE A FERRAMENTA query_transaction_data**. O BD tem todos os dados.

Pergunta do CEO: "${message}"

Responda como Sofia. Use [BREAK] para separar mensagens e muitos emojis.`;

        // Create a chat session to handle multiple turns (Prompt -> Call -> Return -> Response)
        const chat = model.startChat();

        let result = await chat.sendMessage(prompt);
        let response = result.response;
        let dataUpdated = false;

        // Loop para lidar com múltiplas chamadas na mesma sessão
        while (response.functionCalls && response.functionCalls.length > 0) {
            const call = response.functionCalls[0];

            if (call.name === "update_transaction_data") {
                console.log("[Sofia AI Tool] - Executing DB Update", call.args);
                try {
                    const args = call.args as any;
                    let query = supabase.from(args.table_name).update(args.updates);

                    // Appending dynamic filters
                    if (args.filters) {
                        for (const [key, val] of Object.entries(args.filters)) {
                            // Se o valor for string e não exato, tenta usar ilike. Senão, equals.
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

                    // Devolver o resultado para a IA formular a resposta final
                    result = await chat.sendMessage([{
                        functionResponse: {
                            name: call.name,
                            response: { status: "success", updatedRows: data?.length || 0, details: data }
                        }
                    }]);

                    response = result.response;
                } catch (e: any) {
                    console.error("AI Database Update Error", e);
                    // Devolve o erro para a IA
                    result = await chat.sendMessage([{
                        functionResponse: {
                            name: call.name,
                            response: { status: "error", message: e.message }
                        }
                    }]);
                    response = result.response;
                }
            } else if (call.name === "query_transaction_data") {
                console.log("[Sofia AI Tool] - Executing DB Query", call.args);
                try {
                    const args = call.args as any;
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

                    result = await chat.sendMessage([{
                        functionResponse: {
                            name: call.name,
                            response: { status: "success", rowsFound: data?.length || 0, data: data }
                        }
                    }]);

                    response = result.response;
                } catch (e: any) {
                    console.error("AI Database Query Error", e);
                    result = await chat.sendMessage([{
                        functionResponse: {
                            name: call.name,
                            response: { status: "error", message: e.message }
                        }
                    }]);
                    response = result.response;
                }
            } else {
                // Break infinite loop se for uma função desconhecida
                break;
            }
        }

        return { text: response.text(), dataUpdated };
    } catch (error) {
        console.error("Error generating AI response:", error);
        return { text: "Desculpe, tive um problema ao processar sua solicitação. Verifique sua conexão ou tente novamente.", dataUpdated: false };
    }
};
