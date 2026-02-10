
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const plans = [
    {
        name: 'Starter',
        description: 'Ideal para profissionais individuais que estão começando a automatizar suas vendas.',
        price_monthly: 424.22, // Using Quarterly split as monthly reference? Or specific monthly price? 
        // User provided: Trimestral: 3x 424.22, Semestral: 6x 400.89, Anual: 12x 367.50
        // The schema only has price_monthly and price_yearly. 
        // I will use Recurrent Monthly Price (highest) or Annual Monthly Equivalent? 
        // Usually 'price_monthly' is the base monthly price (no discount). 
        // Let's infer a base monthly price or use the quarterly installment as a proxy for "Monthly" since "Mensal" plan usually implies highest rate.
        // However, the user didn't explicitly give a "Monthly" plan price, only Trimestral/Semestral/Annual.
        // I will use the Trimestral installment as 'price_monthly' placeholder (R$ 424.22) and Annual Total as 'price_yearly' (R$ 3573.00).
        // Actually, usually SaaS has a pure Monthly plan. If not, I'll use the 3x val.
        price_yearly: 3573.00,
        features: [
            "1 Usuário",
            "40 análises de vendas",
            "Suporte via WhatsApp",
            "Painel de Gestão",
            "Exportação de dados"
        ],
        limits: { users: 1, analyses: 40 }
    },
    {
        name: 'Team',
        description: 'Focado em pequenas equipes que precisam de mais volume e suporte guiado.',
        price_monthly: 1706.63, // Proxy from Quarterly
        price_yearly: 14373.00,
        features: [
            "5 Usuários",
            "250 análises de vendas",
            "Suporte Prioritário via WhatsApp",
            "Painel de Gestão",
            "Onboarding Guiado"
        ],
        limits: { users: 5, analyses: 250 }
    },
    {
        name: 'Business',
        description: 'Para empresas com alta demanda e necessidade de atendimento dedicado.',
        price_monthly: 5339.83, // Proxy from Quarterly
        price_yearly: 44973.00,
        features: [
            "Usuários Ilimitados",
            "1000 análises de vendas",
            "Gerente de Conta Dedicado",
            "Relatórios Avançados",
            "Prioridade na Fila"
        ],
        limits: { users: "unlimited", analyses: 1000 }
    }
];

async function upsertPlans() {
    console.log('Upserting plans...');

    for (const plan of plans) {
        // Check if plan exists
        const { data: existing } = await supabase.from('plans').select('id').eq('name', plan.name).single();

        if (existing) {
            const { error } = await supabase.from('plans').update({
                description: plan.description,
                price_monthly: plan.price_monthly,
                price_yearly: plan.price_yearly,
                features: JSON.stringify(plan.features), // Supabase Json type expectations
                limits: JSON.stringify(plan.limits)
            }).eq('id', existing.id);

            if (error) console.error(`Error updating ${plan.name}:`, error);
            else console.log(`Updated ${plan.name}`);
        } else {
            const { error } = await supabase.from('plans').insert({
                name: plan.name,
                description: plan.description,
                price_monthly: plan.price_monthly,
                price_yearly: plan.price_yearly,
                features: JSON.stringify(plan.features),
                limits: JSON.stringify(plan.limits)
            });

            if (error) console.error(`Error inserting ${plan.name}:`, error);
            else console.log(`Inserted ${plan.name}`);
        }
    }
}

upsertPlans();
