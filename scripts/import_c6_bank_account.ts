import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Configure dotenv
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Faltam variáveis de ambiente (VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY).");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const extratoC6 = [
    // Outubro/2025
    { date: '2025-10-08', desc: 'Pix recebido de FIRST LINE AI TECNOLOGIA LTDA', type: 'entrada', amount: 10000.00, category: 'Venda' },
    { date: '2025-10-09', desc: 'CDB C6 LIM.GARANT.', type: 'saida', amount: 10000.00, category: 'Investimento' },

    // Novembro/2025
    { date: '2025-11-04', desc: 'Pix recebido de FIRST LINE AI TECNOLOGIA LTDA', type: 'entrada', amount: 634.45, category: 'Venda' },
    { date: '2025-11-04', desc: 'PGTO FAT CARTAO C6', type: 'saida', amount: 634.45, category: 'Outros Custos Fixos' }, // ou fatura

    // Janeiro/2026
    { date: '2026-01-02', desc: 'Pix recebido de FIRST LINE AI TECNOLOGIA LTDA', type: 'entrada', amount: 1119.67, category: 'Venda' },
    { date: '2026-01-02', desc: 'PGTO FAT CARTAO C6', type: 'saida', amount: 1119.67, category: 'Outros Custos Fixos' },
    { date: '2026-01-29', desc: 'Pix recebido de FIRST LINE AI TECNOLOGIA LTDA', type: 'entrada', amount: 8864.34, category: 'Venda' },
    { date: '2026-01-29', desc: 'CDB C6 LIM.GARANT.', type: 'saida', amount: 8864.00, category: 'Investimento' },

    // Fevereiro/2026
    { date: '2026-02-05', desc: 'Pix recebido de FIRST LINE AI TECNOLOGIA LTDA', type: 'entrada', amount: 695.57, category: 'Venda' },
    { date: '2026-02-05', desc: 'PGTO FAT CARTAO C6', type: 'saida', amount: 695.57, category: 'Outros Custos Fixos' },
    { date: '2026-02-11', desc: 'Pix recebido de FIRST LINE AI TECNOLOGIA LTDA', type: 'entrada', amount: 27009.79, category: 'Venda' },
    { date: '2026-02-12', desc: 'Pagamento de lote #1', type: 'saida', amount: 5000.00, category: 'Pró-Labore' },
];

async function importar() {
    console.log("Iniciando importação do extrato C6 Bank (Conta Corrente)...");
    let inseridos = 0;

    for (const item of extratoC6) {
        try {
            const { error } = await supabase
                .from('transactions')
                .insert({
                    description: `${item.desc} (1/1) - Extrato C6`,
                    category: item.category,
                    amount: item.amount,
                    type: item.type === 'entrada' ? 'income' : 'expense',
                    status: 'completed',
                    date: item.date
                });

            if (error) {
                console.error(`Erro ao inserir ${item.desc}: ${error.message}`);
            } else {
                console.log(`Inserido R$ ${item.amount} | ${item.desc} | Data: ${item.date}`);
                inseridos++;
            }
        } catch (e: any) {
            console.error(`Exceção no item ${item.desc}: ${e.message}`);
        }
    }

    console.log(`\nImportação concluída: ${inseridos} itens inseridos com sucesso na tabela de transações.`);
}

importar();
