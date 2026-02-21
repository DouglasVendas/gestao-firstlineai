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

async function main() {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or("category.eq.Plano,category.eq.Venda,description.ilike.%venda%")
        .order('date', { ascending: false });

    if (error || !data) return;

    const grouped = new Map<string, typeof data>();

    data.forEach((t) => {
        // Clean string to find identical ones that had some space/typo diff
        const cleanDesc = t.description.toLowerCase().replace(/[^a-z0-9]/g, '');
        const key = `${t.date}_${t.amount}_${cleanDesc}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(t);
    });

    const idsToDelete: string[] = [];

    grouped.forEach((group, key) => {
        if (group.length > 1) {
            console.log(`\nExact Duplicates Found:`);
            group.forEach((t, i) => {
                console.log(`   ${i === 0 ? 'KEEP' : 'DEL '} ID: ${t.id} | ${t.description} | ${t.date}`);
                if (i > 0) idsToDelete.push(t.id);
            });
        }
    });

    if (idsToDelete.length === 0) {
        console.log("No exact duplicates found using normalized string match.");
    } else {
        console.log(`\nDeleting ${idsToDelete.length} duplicates...`);
        for (const id of idsToDelete) {
            await supabase.from('transactions').delete().eq('id', id);
            console.log(`Deleted ID: ${id}`);
        }
    }
}

main();
