import type { VercelRequest, VercelResponse } from '@vercel/node';

// This function runs on the Vercel server — API keys are NEVER sent to the browser.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Validate authentication — user must be logged in
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — token required' });
  }

  const token = authHeader.split(' ')[1];

  // 2. Verify the token with Supabase (using anon key, not service role)
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Server misconfigured — missing Supabase credentials' });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // 3. Parse request body
  const { message, context } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  // 4. Call Kimi/Moonshot API with the SECURE key (server-side only)
  const KIMI_API_KEY = process.env.KIMI_API_KEY;
  if (!KIMI_API_KEY) {
    return res.status(500).json({ error: 'AI service not configured' });
  }

  try {
    const prompt = buildPrompt(message, context);

    // Define read-only tools (no UPDATE — security measure)
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "query_transaction_data",
          description: "Pesquisa por transações financeiras específicas no banco de dados para responder perguntas numéricas (listagem, somatórias, quantidades).",
          parameters: {
            type: "object",
            properties: {
              table_name: {
                type: "string",
                description: "O nome da tabela para pesquisar (prioritariamente 'transactions').",
              },
              filters: {
                type: "object",
                description: "Filtros exatos de igualdade (ex: { category: 'Venda', type: 'income' }).",
              },
              search_description: {
                type: "string",
                description: "Palavra chave para buscar na descrição usando ilike.",
              },
              date_range: {
                type: "object",
                description: "Filtro de período: { start_date: 'YYYY-MM-DD', end_date: 'YYYY-MM-DD' }.",
              }
            },
            required: ["table_name"],
          }
        }
      }
    ];

    // Allowed tables whitelist (security)
    const ALLOWED_TABLES = ['transactions', 'invoices', 'fixed_costs', 'variable_costs', 'clients'];

    const messages: any[] = [
      { role: "system", content: prompt },
      { role: "user", content: message }
    ];

    // Create authenticated Supabase client for queries (uses user's RLS context)
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    let finalResponse = '';
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    // Tool loop
    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KIMI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'moonshot-v1-128k',
          messages,
          tools,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Kimi API error:', response.status, errorBody);
        return res.status(502).json({ error: 'AI service error' });
      }

      const data = await response.json();
      const responseMessage = data.choices?.[0]?.message;

      if (!responseMessage) {
        return res.status(502).json({ error: 'Invalid AI response' });
      }

      messages.push(responseMessage);

      // If no tool calls, we have the final response
      if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
        finalResponse = responseMessage.content || '';
        break;
      }

      // Process tool calls (READ-ONLY)
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function.name === 'query_transaction_data') {
          try {
            const args = JSON.parse(toolCall.function.arguments);

            // Security: validate table name against whitelist
            if (!ALLOWED_TABLES.includes(args.table_name)) {
              messages.push({
                tool_call_id: toolCall.id,
                role: "tool",
                content: JSON.stringify({ status: "error", message: "Table not allowed" })
              });
              continue;
            }

            let query = userSupabase.from(args.table_name).select('*');

            if (args.filters) {
              for (const [key, val] of Object.entries(args.filters)) {
                query = query.eq(key, val as string);
              }
            }
            if (args.search_description) {
              query = query.ilike('description', `%${args.search_description}%`);
            }
            if (args.date_range?.start_date) {
              query = query.gte('date', args.date_range.start_date);
            }
            if (args.date_range?.end_date) {
              query = query.lte('date', args.date_range.end_date);
            }

            const { data: queryData, error: queryError } = await query
              .order('date', { ascending: false })
              .limit(200);

            if (queryError) throw queryError;

            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              content: JSON.stringify({ status: "success", rowsFound: queryData?.length || 0, data: queryData })
            });
          } catch (e: any) {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              content: JSON.stringify({ status: "error", message: e.message })
            });
          }
        } else {
          // Unknown tool — reject
          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify({ status: "error", message: "Tool not available" })
          });
        }
      }
    }

    return res.status(200).json({ text: finalResponse, dataUpdated: false });
  } catch (error: any) {
    console.error('AI proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function buildPrompt(message: string, context: any): string {
  return `Role: Você é a Sofia, Gerente de Projetos (PM) do SaaS Compass. Você fala em nome da "FirstLine" (uma equipe de IAs especialistas).

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
5.  **Pesquisar Lançamentos**: Se o CEO perguntar valores passados, listagens do mês (ex: "Quais todas as entradas de setembro?") ou somatórias, **USE A FERRAMENTA query_transaction_data**. O BD tem todos os dados.
6.  **IMPORTANTE**: Você NÃO pode alterar dados. Apenas consultar. Se o CEO pedir para editar algo, oriente-o a fazer pela interface do sistema.

Pergunta do CEO: "${message}"

Responda como Sofia. Use [BREAK] para separar mensagens e muitos emojis.`;
}
