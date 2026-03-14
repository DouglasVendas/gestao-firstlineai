
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// IMPORTANTE: Para criar usuários via script, precisamos da SERVICE_ROLE_KEY.
// Ela NÃO deve estar no .env público (VITE_), então peça ao usuário para passar via argumento ou carregar de uma variável segura.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Erro: Você precisa definir VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no seu ambiente.');
    console.log('Dica: Pegue a service_role key em Project Settings > API no painel do Supabase.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdminUser() {
    const email = 'douglaslopes@firstlineai.com.br';
    const password = 'Douglas@Compass2026';

    console.log(`Criando/Atualizando usuário: ${email}...`);

    // 1. Criar o usuário no Auth
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true // Já confirma o e-mail automaticamente
    });

    if (userError) {
        if (userError.message.includes('already registered')) {
            console.log('Usuário já existe no Auth. Vamos apenas vincular à organização.');
            // Se já existe, precisamos do ID dele.
            const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
            const user = existingUsers?.users.find(u => u.email === email);
            if (user) {
                await linkToOrg(user.id);
            }
        } else {
            console.error('Erro ao criar usuário:', userError.message);
        }
    } else if (userData.user) {
        console.log('Usuário criado com sucesso no Auth!');
        await linkToOrg(userData.user.id);
    }
}

async function linkToOrg(userId: string) {
    console.log('Buscando organização "First Line AI"...');

    // 1. Pegar o ID da Organização
    const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', 'First Line AI')
        .single();

    if (orgError || !orgData) {
        console.error('Erro ao buscar organização. Certifique-se de que rodou a migration de RLS primeiro.');
        return;
    }

    const orgId = orgData.id;

    // 2. Vincular na tabela users_organizations
    console.log(`Vinculando usuário ${userId} à organização ${orgId}...`);
    const { error: linkError } = await supabase
        .from('users_organizations')
        .upsert({
            user_id: userId,
            organization_id: orgId,
            role: 'owner'
        }, { onConflict: 'user_id, organization_id' });

    if (linkError) {
        console.error('Erro ao vincular organização:', linkError.message);
    } else {
        console.log('✅ Acesso configurado com sucesso!');
        console.log('--------------------------------------------------');
        console.log(`Login: ${email}`);
        console.log(`Senha: Douglas@Compass2026`);
        console.log('--------------------------------------------------');
    }
}

const email = 'douglaslopes@firstlineai.com.br';
createAdminUser();
