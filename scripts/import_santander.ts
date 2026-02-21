import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

const santanderData = [
    // Outubro/2025
    { desc: 'VAPI API SAN FRANCISCO', amount: 56.63, parcel: '1/1', month: '2025-10' },
    { desc: 'IOF DESPESA NO EXTERIOR', amount: 1.98, parcel: '1/1', month: '2025-10' },
    { desc: 'ANUIDADE DIFERENCIADA', amount: 18.50, parcel: '1/1', month: '2025-10' },

    // Novembro/2025
    { desc: 'FACEBK 9375J65CL2*', amount: 97.76, parcel: '1/1', month: '2025-11' },
    { desc: '*FACEBK ZCQ266ZBL2', amount: 156.01, parcel: '1/1', month: '2025-11' },
    { desc: '*FACEBK BEQ6Q5MBL2', amount: 170.01, parcel: '1/1', month: '2025-11' },
    { desc: 'FACEBK 2B8UB6RBL2*', amount: 185.17, parcel: '1/1', month: '2025-11' },
    { desc: 'ANTHROPIC SAN FRANCISCO', amount: 56.65, parcel: '1/1', month: '2025-11' },
    { desc: 'IOF DESPESA NO EXTERIOR', amount: 1.98, parcel: '1/1', month: '2025-11' },
    { desc: 'ANTHROPIC SAN FRANCISCO', amount: 57.36, parcel: '1/1', month: '2025-11' },
    { desc: 'IOF DESPESA NO EXTERIOR', amount: 2.01, parcel: '1/1', month: '2025-11' },
    { desc: 'ANUIDADE DIFERENCIADA', amount: 9.25, parcel: '1/1', month: '2025-11' },

    // Dezembro/2025
    { desc: '*FACEBK ENZM38DBL2', amount: 89.00, parcel: '1/1', month: '2025-12' },
    { desc: '*PG WSYSTEM SAAS LTDA', amount: 250.00, parcel: '1/1', month: '2025-12' },
    { desc: '*FACEBK BFYVH9DCL2', amount: 201.39, parcel: '1/1', month: '2025-12' },
    { desc: '*FACEBK 9NN6P95CL2', amount: 218.33, parcel: '1/1', month: '2025-12' },
    { desc: 'FACEBK K5CCS9DCL2*', amount: 236.09, parcel: '1/1', month: '2025-12' },
    { desc: 'FACEBK C36PX8DBL2*', amount: 255.27, parcel: '1/1', month: '2025-12' },
    { desc: 'FACEBK 8AHNR8RBL2*', amount: 276.49, parcel: '1/1', month: '2025-12' },
    { desc: 'FACEBK MVCYH8MBL2*', amount: 298.02, parcel: '1/1', month: '2025-12' },
    { desc: 'ANTHROPIC SAN FRANCISCO', amount: 58.45, parcel: '1/1', month: '2025-12' },
    { desc: 'IOF DESPESA NO EXTERIOR', amount: 2.05, parcel: '1/1', month: '2025-12' },
    { desc: 'ANTHROPIC SAN FRANCISCO', amount: 56.62, parcel: '1/1', month: '2025-12' },
    { desc: 'IOF DESPESA NO EXTERIOR', amount: 1.98, parcel: '1/1', month: '2025-12' },
    { desc: 'CURSOR, AI POWERED IDE', amount: 113.09, parcel: '1/1', month: '2025-12' },
    { desc: 'IOF DESPESA NO EXTERIOR', amount: 3.96, parcel: '1/1', month: '2025-12' },
    { desc: 'OPENAI SAN FRANCISCO', amount: 57.13, parcel: '1/1', month: '2025-12' },
    { desc: 'IOF DESPESA NO EXTERIOR', amount: 2.00, parcel: '1/1', month: '2025-12' },
    { desc: 'RECALL AI SAN FRANCISCO', amount: 114.26, parcel: '1/1', month: '2025-12' },
    { desc: 'IOF DESPESA NO EXTERIOR', amount: 4.00, parcel: '1/1', month: '2025-12' },

    // Fevereiro/2026
    { desc: '*FACEBK PCTF4CDBL2', amount: 105.22, parcel: '1/1', month: '2026-02' },
    { desc: 'FACEBK H5SYGBMBL2*', amount: 267.85, parcel: '1/1', month: '2026-02' },
    { desc: 'FACEBK H3KERCDBL2*', amount: 257.93, parcel: '1/1', month: '2026-02' },
    { desc: 'FACEBK UEVHVCVBL2*', amount: 457.62, parcel: '1/1', month: '2026-02' },
    { desc: 'RECALL AI SAN FRANCISCO', amount: 117.47, parcel: '1/1', month: '2026-02' },
    { desc: 'IOF DESPESA NO EXTERIOR', amount: 4.11, parcel: '1/1', month: '2026-02' },
    { desc: 'ANTHROPIC SAN FRANCISCO', amount: 57.75, parcel: '1/1', month: '2026-02' },
    { desc: 'IOF DESPESA NO EXTERIOR', amount: 2.02, parcel: '1/1', month: '2026-02' },
    { desc: 'RECALL AI SAN FRANCISCO', amount: 114.22, parcel: '1/1', month: '2026-02' },
    { desc: 'IOF DESPESA NO EXTERIOR', amount: 4.00, parcel: '1/1', month: '2026-02' },
    { desc: 'ANTHROPIC SAN FRANCISCO', amount: 57.49, parcel: '1/1', month: '2026-02' },
    { desc: 'IOF DESPESA NO EXTERIOR', amount: 2.01, parcel: '1/1', month: '2026-02' },
    { desc: 'RECALL AI SAN FRANCISCO', amount: 113.85, parcel: '1/1', month: '2026-02' },
    { desc: 'IOF DESPESA NO EXTERIOR', amount: 3.98, parcel: '1/1', month: '2026-02' },
    { desc: 'ANTHROPIC SAN FRANCISCO', amount: 57.02, parcel: '1/1', month: '2026-02' },
    { desc: 'IOF DESPESA NO EXTERIOR', amount: 2.00, parcel: '1/1', month: '2026-02' },
    { desc: 'RECALL AI SAN FRANCISCO', amount: 114.04, parcel: '1/1', month: '2026-02' },
    { desc: 'IOF DESPESA NO EXTERIOR', amount: 3.99, parcel: '1/1', month: '2026-02' },
    { desc: 'CURSOR, AI POWERED IDE', amount: 114.03, parcel: '1/1', month: '2026-02' },
    { desc: 'IOF DESPESA NO EXTERIOR', amount: 3.99, parcel: '1/1', month: '2026-02' },
    { desc: 'RECALL AI SAN FRANCISCO', amount: 112.60, parcel: '1/1', month: '2026-02' },
    { desc: 'IOF DESPESA NO EXTERIOR', amount: 3.94, parcel: '1/1', month: '2026-02' },
    { desc: 'ANTHROPIC SAN FRANCISCO', amount: 56.64, parcel: '1/1', month: '2026-02' },
    { desc: 'IOF DESPESA NO EXTERIOR', amount: 1.98, parcel: '1/1', month: '2026-02' }
];

async function main() {
    console.log('Iniciando importação de faturas do Santander...');

    let totalImported = 0;

    for (const item of santanderData) {
        // Determine the exact date (use day 10 for faturas)
        const exactDate = `${item.month}-10`;

        // Clean string description
        const rawDesc = item.desc.replace(/^\*+/, '').trim();

        // Add "Santander" identifier for easy filtering in the App later
        const label = `${rawDesc} (${item.parcel}) - Santander`;

        // Determine category based on common patterns
        let category = "Cartão de Crédito";
        if (rawDesc.includes('FACEBK') || rawDesc.includes('FB')) {
            category = "Marketing (Meta Ads)";
        } else if (rawDesc.includes('ANTHROPIC') || rawDesc.includes('OPENAI') || rawDesc.includes('VAPI') || rawDesc.includes('RECALL') || rawDesc.includes('CURSOR')) {
            category = "Serviços de IA / APIs";
        }

        const { error } = await supabase
            .from('transactions')
            .insert({
                description: label,
                category: category,
                amount: item.amount,
                type: 'expense',
                status: 'completed',
                date: exactDate
            });

        if (error) {
            console.error(`Erro ao inserir ${label}:`, error);
        } else {
            console.log(`Inserido R$ ${item.amount} | ${label} | Data: ${exactDate}`);
            totalImported++;
        }
    }

    console.log(`Importação concluída: ${totalImported} itens inseridos com sucesso na tabela de transações.`);
}

main();
