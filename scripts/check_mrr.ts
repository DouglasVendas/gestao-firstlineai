import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

async function check() {
  const { data: clients } = await supabase.from('clients').select('name, status, mrr');
  let activeMrr = 0;
  let activeCount = 0;
  clients?.forEach(c => {
    if (c.status === 'active') {
      activeMrr += Number(c.mrr);
      activeCount++;
    }
    console.log(`${c.status.padEnd(8)} | MRR: R$ ${String(c.mrr).padEnd(6)} | ${c.name}`);
  });
  console.log(`\nTotal Active MRR: R$ ${activeMrr.toFixed(2)} (${activeCount} clients)`);
}
check();
