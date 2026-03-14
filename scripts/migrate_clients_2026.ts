import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ======================================
// DADOS FORNECIDOS PELO CEO
// ======================================
const clientesCEO = [
    // --- ATIVOS ---
    {
        name: "RODRIGO AVELAR CORTE REAL",
        status: "active", // ATIVO
        planName: "Business Mensal",
        mrr: 2500,
        start_date: "2026-02-06",
        churn_date: null,
        history: [
            { month: "2026-02-06", value: 2500, status: "paid" },
            { month: "2026-03-06", value: 2500, status: "paid" },
            { month: "2026-04-06", value: 2500, status: "pending" }
        ]
    },
    {
        name: "ELAINE FERREIRA DUARTE DE SÁ",
        status: "active",
        planName: "Team Mensal",
        mrr: 997,
        start_date: "2025-11-06",
        churn_date: null,
        history: [
            { month: "2025-11-06", value: 997, status: "paid" },
            { month: "2025-12-06", value: 997, status: "paid" },
            { month: "2026-01-06", value: 997, status: "paid" },
            { month: "2026-02-06", value: 997, status: "paid" },
            { month: "2026-03-06", value: 997, status: "paid" },
            { month: "2026-04-06", value: 997, status: "pending" }
        ]
    },
    {
        name: "FÁBIO COSTA",
        status: "active",
        planName: "Starter Anual",
        mrr: 0,
        start_date: "2026-01-14",
        churn_date: null,
        history: [
            { month: "2026-01-14", value: 3564, status: "paid" }
        ]
    },
    {
        name: "FELIPE CAMPOS DA SILVA",
        status: "active", // INADIMPLENTE mas ativo
        planName: "Team Mensal",
        mrr: 997,
        start_date: "2025-11-06",
        churn_date: null,
        history: [
            { month: "2025-11-06", value: 997, status: "paid" },
            { month: "2025-12-06", value: 997, status: "paid" },
            { month: "2026-01-06", value: 997, status: "overdue" },
            { month: "2026-02-06", value: 997, status: "overdue" },
            { month: "2026-03-06", value: 997, status: "overdue" },
            { month: "2026-04-06", value: 997, status: "pending" }
        ]
    },
    {
        name: "DAIANE DALAVI",
        status: "churned",
        planName: "Starter Mensal",
        mrr: 397,
        start_date: "2025-12-12",
        churn_date: "2026-03-12",
        history: [
            { month: "2025-12-12", value: 397, status: "paid" },
            { month: "2026-01-12", value: 397, status: "paid" },
            { month: "2026-02-12", value: 397, status: "paid" }
        ]
    },
    {
        name: "FABIANO BRINO",
        status: "active",
        planName: "Starter Trimestral", // Mapped to closest if not exist
        mrr: 0,
        start_date: "2026-01-16",
        churn_date: null,
        history: [
            { month: "2026-01-16", value: 997, status: "paid" }
        ]
    },
    {
        name: "COMUNICAÇÃO ASAS SERVIÇO DE DESENVOLVIMENTO",
        status: "active",
        planName: "Starter Anual",
        mrr: 0,
        start_date: "2026-02-07",
        churn_date: null,
        history: [
            { month: "2026-02-07", value: 618, status: "paid" }, // Anual em parcelas (?) "Anual quitado... historico fev: 618 , mar: 618" -> treating as monthly payments
            { month: "2026-03-07", value: 618, status: "paid" },
            { month: "2026-04-07", value: 618, status: "pending" },
        ]
    },
    {
        name: "MOSKO DIGITAL TREINAMENTO E MARKETING LTDA",
        status: "active",
        planName: "Starter Trimestral", // BIMESTRAL quitado
        mrr: 0,
        start_date: "2026-01-16",
        churn_date: null,
        history: [
            { month: "2026-01-16", value: 594, status: "paid" }
        ]
    },
    {
        name: "VITÓRIA PONTIN MOMBACH",
        status: "active",
        planName: "Business Mensal", // CRM anual pagamento mensal
        mrr: 402,
        start_date: "2026-02-07",
        churn_date: null,
        history: [
            { month: "2026-02-07", value: 402, status: "paid" },
            { month: "2026-03-07", value: 402, status: "paid" },
            { month: "2026-04-07", value: 402, status: "pending" },
        ]
    },
    {
        name: "ANTONY SOUZA GOMES",
        status: "active",
        planName: "Business Mensal",
        mrr: 355.43,
        start_date: "2026-03-03",
        churn_date: null,
        history: [
            { month: "2026-03-03", value: 366.43, status: "paid" },
            { month: "2026-04-03", value: 366.43, status: "pending" },
        ]
    },

    // --- CHURNED ---
    {
        name: "BFR ASSESSOR DE INVESTIMENTOS LTDA",
        status: "churned",
        planName: "Team Mensal",
        mrr: 0, // was 997
        start_date: "2025-12-05",
        churn_date: "2026-03-05", // churn
        history: [
            { month: "2025-12-05", value: 997, status: "paid" },
            { month: "2026-01-05", value: 997, status: "paid" },
            { month: "2026-02-05", value: 997, status: "paid" },
            { month: "2026-03-05", value: 997, status: "paid" }
        ]
    },
    {
        name: "VIRTUX TECH LTDA",
        status: "churned",
        planName: "Starter Mensal",
        mrr: 0,
        start_date: "2025-11-10",
        churn_date: "2026-02-10",
        history: [
            { month: "2025-11-10", value: 397, status: "paid" },
            { month: "2025-12-10", value: 397, status: "paid" },
            { month: "2026-01-10", value: 397, status: "paid" },
            { month: "2026-02-10", value: 397, status: "paid" }
        ]
    },
    {
        name: "ALISSON GONÇALVES",
        status: "churned",
        planName: "Starter Mensal",
        mrr: 0,
        start_date: "2025-11-26",
        churn_date: "2026-01-26",
        history: [
            { month: "2025-11-26", value: 397, status: "paid" },
            { month: "2025-12-26", value: 397, status: "paid" },
            { month: "2026-01-26", value: 397, status: "paid" }
        ]
    },
    {
        name: "DENER MARQUES SARUBBI",
        status: "churned",
        planName: "Starter Mensal",
        mrr: 0,
        start_date: "2025-12-08",
        churn_date: "2026-02-08",
        history: [
            { month: "2025-12-08", value: 397, status: "paid" },
            { month: "2026-01-08", value: 397, status: "paid" },
            { month: "2026-02-08", value: 397, status: "paid" },
            { month: "2026-03-08", value: 397, status: "overdue" } // Listed as Inadimplente before churn
        ]
    },
    {
        name: "JULIANA DA SILVA ANHAIA",
        status: "churned",
        planName: "Starter Mensal",
        mrr: 0,
        start_date: "2025-11-04",
        churn_date: "2026-01-15",
        history: [
            { month: "2025-11-04", value: 197, status: "paid" },
            { month: "2025-12-04", value: 197, status: "paid" },
            { month: "2026-01-04", value: 197, status: "paid" },
            { month: "2026-02-04", value: 197, status: "overdue" } // Listed as inadiplente before churn
        ]
    },
    {
        name: "GUILHERME COSTA DE SOUZA SALES",
        status: "active", // Listed as INADIMPLENTE but logically active until churned
        planName: "Starter Mensal",
        mrr: 397,
        start_date: "2025-11-21",
        churn_date: null,
        history: [
            { month: "2025-11-21", value: 397, status: "paid" },
            { month: "2025-12-21", value: 397, status: "overdue" },
            { month: "2026-01-21", value: 397, status: "overdue" },
            { month: "2026-02-21", value: 397, status: "overdue" },
            { month: "2026-03-21", value: 397, status: "overdue" },
            { month: "2026-04-21", value: 397, status: "pending" },
        ]
    }
];

async function main() {
    console.log("Iniciando migração da base de clientes First Line AI...");

    // 1. Fetch available plans
    console.log("Listando planos...");
    const { data: plansData, error: plansErr } = await supabase.from("plans").select("id, name");
    if (plansErr || !plansData) {
        console.error("Erro buscando planos:", plansErr);
        return;
    }

    // Fallback mappings as some plan names from CEO might not exactly match
    const getPlanId = (planName: string) => {
        const p = plansData.find(pl => planName.toLowerCase().includes(pl.name.toLowerCase().split(' ')[0]));
        return p ? p.id : plansData[0].id;
    };

    // 2. Clear old invoices
    console.log("Deletando faturas antigas...");
    const { error: invErr } = await supabase.from("invoices").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (invErr) console.error("Erro deletando faturas:", invErr);

    // 3. Clear old clients
    console.log("Deletando clientes antigos...");
    const { error: cliErr } = await supabase.from("clients").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (cliErr) console.error("Erro deletando clientes:", cliErr);

    // 4. Insert new clients and invoices
    for (const c of clientesCEO) {
        console.log(`Processando cliente: ${c.name}`);
        const planId = getPlanId(c.planName);

        const { data: clientRes, error: clientError } = await supabase.from("clients").insert({
            name: c.name,
            status: c.status,
            mrr: c.mrr,
            start_date: c.start_date,
            churn_date: c.churn_date,
            plan_id: planId
        }).select("id").single();

        if (clientError || !clientRes) {
            console.error(`Erro ao criar ${c.name}:`, clientError);
            continue;
        }

        const clientId = clientRes.id;

        // 5. Create invoices history
        const invoicesInsert = c.history.map(h => ({
            client_id: clientId,
            value: h.value,
            due_date: h.month, // treating month point as due_date
            status: h.status,
            paid_date: h.status === 'paid' ? h.month : null // simplify
        }));

        if (invoicesInsert.length > 0) {
            const { error: histErr } = await supabase.from("invoices").insert(invoicesInsert);
            if (histErr) {
                console.error(`Erro inserindo faturas para ${c.name}:`, histErr);
            }
        }
    }

    console.log("Migração concluída com sucesso!");
}

main();
