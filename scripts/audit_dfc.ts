import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Faltam variáveis de ambiente.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: true });

    if (error) {
        console.error("Erro ao buscar dados:", error);
        return;
    }

    console.log(`Total de transações encontradas: ${data.length}`);

    // Agrupar por Mês/Ano e Categoria
    const resumo: Record<string, any> = {};
    let totalEntradas = 0;
    let totalSaidas = 0;

    data.forEach((t: any) => {
        const mesAno = t.date.substring(0, 7); // YYYY-MM
        if (!resumo[mesAno]) {
            resumo[mesAno] = { entradas: 0, saidas: 0, categorias: {} };
        }

        if (t.type === 'income') {
            resumo[mesAno].entradas += t.amount;
            totalEntradas += t.amount;
        } else {
            resumo[mesAno].saidas += t.amount;
            totalSaidas += t.amount;
        }

        const cat = t.category || 'Sem Categoria';
        if (!resumo[mesAno].categorias[cat]) {
            resumo[mesAno].categorias[cat] = 0;
        }
        if (t.type === 'income') {
            resumo[mesAno].categorias[cat] += t.amount;
        } else {
            resumo[mesAno].categorias[cat] -= t.amount;
        }
    });

    console.log("\n--- RESUMO GERAL ---");
    console.log(`Entradas Totais: R$ ${totalEntradas.toFixed(2)}`);
    console.log(`Saídas Totais: R$ ${totalSaidas.toFixed(2)}`);
    console.log(`Saldo Bruto: R$ ${(totalEntradas - totalSaidas).toFixed(2)}`);

    console.log("\n--- RESUMO MENSAL POR CATEGORIA ---");
    Object.keys(resumo).sort().forEach(mes => {
        console.log(`Mês: ${mes} | Entradas: R$ ${resumo[mes].entradas.toFixed(2)} | Saídas: R$ ${resumo[mes].saidas.toFixed(2)}`);
        console.log("  Categorias (Líquido):");
        Object.keys(resumo[mes].categorias).forEach(cat => {
            console.log(`    - ${cat}: R$ ${resumo[mes].categorias[cat].toFixed(2)}`);
        });
    });

    // Checking for specific things like opening balances or transfers
    const investigacao = data.filter((t: any) => t.category === 'Investimento' || t.category === 'Sem Categoria');
    console.log(`\n--- TRANSAÇÕES DE INVESTIMENTO E SEM CATEGORIA (${investigacao.length}) ---`);
    investigacao.forEach((t: any) => {
        console.log(`[${t.date}] ${t.type === 'income' ? '+' : '-'}${t.amount} | Cat: ${t.category} | Desc: ${t.description}`);
    });
}

checkData();
