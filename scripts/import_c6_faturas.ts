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

const expenses = [
  // Novembro/2025
  { description: "CLICKBUS (1/3) - C6 Bank", amount: 530.45, date: "2025-11-10", type: "expense", category: "Transporte", status: "completed" },
  { description: "AIRBNB (1/6) - C6 Bank", amount: 104.00, date: "2025-11-10", type: "expense", category: "Hospedagem", status: "completed" },
  
  // Dezembro/2025
  { description: "CLICKBUS (2/3) - C6 Bank", amount: 530.44, date: "2025-12-10", type: "expense", category: "Transporte", status: "completed" },
  { description: "AIRBNB (2/6) - C6 Bank", amount: 104.00, date: "2025-12-10", type: "expense", category: "Hospedagem", status: "completed" },
  { description: "KIWIFY (1/12) - C6 Bank", amount: 485.87, date: "2025-12-10", type: "expense", category: "Educação", status: "completed" },
  { description: "Encargos - C6 Bank", amount: 9.84, date: "2025-12-10", type: "expense", category: "Taxas Financeiras", status: "completed" },
  { description: "IOF Rotativo - C6 Bank", amount: 2.46, date: "2025-12-10", type: "expense", category: "Taxas Financeiras", status: "completed" },
  { description: "Juros de Mora - C6 Bank", amount: 0.63, date: "2025-12-10", type: "expense", category: "Taxas Financeiras", status: "completed" },
  { description: "Multa Contratual - C6 Bank", amount: 12.69, date: "2025-12-10", type: "expense", category: "Taxas Financeiras", status: "completed" },

  // Janeiro/2026
  { description: "CLICKBUS (3/3) - C6 Bank", amount: 530.44, date: "2026-01-10", type: "expense", category: "Transporte", status: "completed" },
  { description: "AIRBNB (3/6) - C6 Bank", amount: 104.00, date: "2026-01-10", type: "expense", category: "Hospedagem", status: "completed" },
  { description: "KIWIFY (2/12) - C6 Bank", amount: 485.77, date: "2026-01-10", type: "expense", category: "Educação", status: "completed" },

  // Fevereiro/2026
  { description: "AIRBNB (4/6) - C6 Bank", amount: 104.00, date: "2026-02-10", type: "expense", category: "Hospedagem", status: "completed" },
  { description: "KIWIFY (3/12) - C6 Bank", amount: 485.77, date: "2026-02-10", type: "expense", category: "Educação", status: "completed" },
  { description: "PG AFFILIATES (Única) - C6 Bank", amount: 105.80, date: "2026-02-10", type: "expense", category: "Marketing", status: "completed" }
];

async function main() {
  console.log("Starting data import to Supabase...");
  let successCount = 0;
  for (const exp of expenses) {
    const { data, error } = await supabase.from('transactions').insert(exp);
    if (error) {
      console.error(`Error inserting ${exp.description}:`, error.message);
    } else {
      console.log(`Successfully inserted: ${exp.description}`);
      successCount++;
    }
  }
  console.log(`Import completed! ${successCount}/${expenses.length} inserted.`);
}

main();
