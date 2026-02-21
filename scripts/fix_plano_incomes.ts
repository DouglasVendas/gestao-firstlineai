import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Faltam variáveis de ambiente (VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY).");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function corrigirPlanos() {
    console.log("Iniciando correção das transações da categoria 'Plano'...");

    // Update massivo: Onde a categoria for 'Plano', o tipo deve ser obrigatoriamente 'income'
    const { data, error } = await supabase
        .from('transactions')
        .update({ type: 'income' })
        .eq('category', 'Plano')
        .select(); // opcional, apenas pra logar a quantidade

    if (error) {
        console.error("Erro ao aplicar UPDATE massivo:", error);
        return;
    }

    console.log(`Correção concluída. ${data ? data.length : 0} registros de assinaturas (Plano) atualizados para 'income' (Receita).`);
}

corrigirPlanos();
