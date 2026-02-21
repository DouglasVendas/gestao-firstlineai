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

const extratoSantander = [
    // Agosto/2025
    { date: '2025-08-25', desc: 'ABERTURA', type: 'entrada', amount: 0.00, category: 'Outros' },
    { date: '2025-08-26', desc: 'PIX RECEBIDO', type: 'entrada', amount: 5000.00, category: 'Venda' },
    { date: '2025-08-26', desc: 'APLICACAO CONTAMAX', type: 'saida', amount: 4000.00, category: 'Investimento' },
    { date: '2025-08-26', desc: 'PIX ENVIADO', type: 'saida', amount: 1000.00, category: 'Outros Custos Fixos' },
    { date: '2025-08-27', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 850.00, category: 'Investimento' },
    { date: '2025-08-27', desc: 'PIX ENVIADO', type: 'saida', amount: 850.00, category: 'Outros Custos Fixos' },
    { date: '2025-08-28', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 98.00, category: 'Investimento' },
    { date: '2025-08-28', desc: 'PIX ENVIADO', type: 'saida', amount: 98.00, category: 'Outros Custos Fixos' },

    // Setembro/2025
    { date: '2025-09-04', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 175.80, category: 'Investimento' },
    { date: '2025-09-04', desc: 'PIX ENVIADO (x2)', type: 'saida', amount: 175.80, category: 'Outros Custos Fixos' },
    { date: '2025-09-08', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 150.00, category: 'Investimento' },
    { date: '2025-09-08', desc: 'PIX ENVIADO', type: 'saida', amount: 150.00, category: 'Outros Custos Fixos' },
    { date: '2025-09-09', desc: 'PIX RECEBIDO', type: 'entrada', amount: 10000.00, category: 'Venda' },
    { date: '2025-09-09', desc: 'APLICACAO CONTAMAX', type: 'saida', amount: 10000.00, category: 'Investimento' },
    { date: '2025-09-11', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 2000.00, category: 'Investimento' },
    { date: '2025-09-11', desc: 'PIX ENVIADO', type: 'saida', amount: 2000.00, category: 'Outros Custos Fixos' },
    { date: '2025-09-15', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 1400.00, category: 'Investimento' },
    { date: '2025-09-15', desc: 'PIX ENVIADO (x2)', type: 'saida', amount: 1400.00, category: 'Outros Custos Fixos' },
    { date: '2025-09-22', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 3654.18, category: 'Investimento' },
    { date: '2025-09-22', desc: 'PIX DEVOLVIDO', type: 'entrada', amount: 1000.00, category: 'Venda' },
    { date: '2025-09-22', desc: 'PIX ENVIADO (Vários)', type: 'saida', amount: 4433.46, category: 'Outros Custos Fixos' },
    { date: '2025-09-22', desc: 'PAGAMENTO DARF EM CANAIS', type: 'saida', amount: 220.72, category: 'Impostos' },
    { date: '2025-09-26', desc: 'PIX RECEBIDO', type: 'entrada', amount: 67548.12, category: 'Venda' },
    { date: '2025-09-26', desc: 'APLICACAO CONTAMAX', type: 'saida', amount: 66048.12, category: 'Investimento' },
    { date: '2025-09-26', desc: 'PIX ENVIADO', type: 'saida', amount: 1500.00, category: 'Outros Custos Fixos' },
    { date: '2025-09-29', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 1088.00, category: 'Investimento' },
    { date: '2025-09-29', desc: 'PIX ENVIADO', type: 'saida', amount: 198.00, category: 'Outros Custos Fixos' },
    { date: '2025-09-29', desc: 'PAGAMENTO DE BOLETO', type: 'saida', amount: 890.00, category: 'Outros Custos Fixos' },
    { date: '2025-09-30', desc: 'PIX RECEBIDO', type: 'entrada', amount: 5000.00, category: 'Venda' },
    { date: '2025-09-30', desc: 'APLICACAO CONTAMAX', type: 'saida', amount: 5000.00, category: 'Investimento' },

    // Outubro/2025
    { date: '2025-10-01', desc: 'PIX RECEBIDO (x2)', type: 'entrada', amount: 10000.00, category: 'Venda' },
    { date: '2025-10-01', desc: 'APLICACAO CONTAMAX', type: 'saida', amount: 9808.30, category: 'Investimento' },
    { date: '2025-10-01', desc: 'PIX ENVIADO (Vários)', type: 'saida', amount: 191.70, category: 'Outros Custos Fixos' },
    { date: '2025-10-02', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 105.00, category: 'Investimento' },
    { date: '2025-10-02', desc: 'PIX ENVIADO (x2)', type: 'saida', amount: 105.00, category: 'Outros Custos Fixos' },
    { date: '2025-10-06', desc: 'PIX RECEBIDO', type: 'entrada', amount: 5000.00, category: 'Venda' },
    { date: '2025-10-06', desc: 'APLICACAO CONTAMAX', type: 'saida', amount: 1141.35, category: 'Investimento' },
    { date: '2025-10-06', desc: 'PIX ENVIADO (Vários)', type: 'saida', amount: 3858.65, category: 'Outros Custos Fixos' },
    { date: '2025-10-08', desc: 'PIX RECEBIDO', type: 'entrada', amount: 5000.00, category: 'Venda' },
    { date: '2025-10-08', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 5000.00, category: 'Investimento' },
    { date: '2025-10-08', desc: 'PIX ENVIADO', type: 'saida', amount: 10000.00, category: 'Outros Custos Fixos' },
    { date: '2025-10-10', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 33077.11, category: 'Investimento' },
    { date: '2025-10-10', desc: 'PIX ENVIADO', type: 'saida', amount: 33000.00, category: 'Outros Custos Fixos' },
    { date: '2025-10-10', desc: 'DEBITO AUT. FAT.CARTAO', type: 'saida', amount: 77.11, category: 'Outros Custos Fixos' },
    { date: '2025-10-13', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 602.37, category: 'Investimento' },
    { date: '2025-10-13', desc: 'PIX ENVIADO (Vários)', type: 'saida', amount: 602.37, category: 'Outros Custos Fixos' },
    { date: '2025-10-14', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 277.05, category: 'Investimento' },
    { date: '2025-10-14', desc: 'PIX ENVIADO', type: 'saida', amount: 277.05, category: 'Outros Custos Fixos' },
    { date: '2025-10-16', desc: 'PIX RECEBIDO', type: 'entrada', amount: 33000.00, category: 'Venda' },
    { date: '2025-10-16', desc: 'APLICACAO CONTAMAX', type: 'saida', amount: 31000.00, category: 'Investimento' },
    { date: '2025-10-16', desc: 'PIX ENVIADO', type: 'saida', amount: 2000.00, category: 'Outros Custos Fixos' },
    { date: '2025-10-17', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 1500.00, category: 'Investimento' },
    { date: '2025-10-17', desc: 'PIX ENVIADO', type: 'saida', amount: 1500.00, category: 'Outros Custos Fixos' },
    { date: '2025-10-20', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 157.01, category: 'Investimento' },
    { date: '2025-10-20', desc: 'PIX ENVIADO', type: 'saida', amount: 157.01, category: 'Outros Custos Fixos' },
    { date: '2025-10-21', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 1947.30, category: 'Investimento' },
    { date: '2025-10-21', desc: 'PIX ENVIADO (Vários)', type: 'saida', amount: 1947.30, category: 'Outros Custos Fixos' },
    { date: '2025-10-22', desc: 'PIX DEVOLVIDO', type: 'entrada', amount: 244.00, category: 'Venda' },
    { date: '2025-10-22', desc: 'PIX ENVIADO', type: 'saida', amount: 149.00, category: 'Outros Custos Fixos' },
    { date: '2025-10-23', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 1.00, category: 'Investimento' },
    { date: '2025-10-23', desc: 'PIX ENVIADO', type: 'saida', amount: 96.00, category: 'Outros Custos Fixos' },

    // Novembro/2025
    { date: '2025-11-03', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 244.00, category: 'Investimento' },
    { date: '2025-11-03', desc: 'PIX ENVIADO', type: 'saida', amount: 95.00, category: 'Outros Custos Fixos' },
    { date: '2025-11-03', desc: 'TARIFA MENSALIDADE', type: 'saida', amount: 149.00, category: 'Outros Custos Fixos' },
    { date: '2025-11-04', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 1634.45, category: 'Investimento' },
    { date: '2025-11-04', desc: 'PIX ENVIADO (x2)', type: 'saida', amount: 1634.45, category: 'Outros Custos Fixos' },
    { date: '2025-11-06', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 55.00, category: 'Investimento' },
    { date: '2025-11-06', desc: 'PIX ENVIADO', type: 'saida', amount: 55.00, category: 'Outros Custos Fixos' },
    { date: '2025-11-10', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 736.20, category: 'Investimento' },
    { date: '2025-11-10', desc: 'DEBITO AUT. FAT.CARTAO', type: 'saida', amount: 736.20, category: 'Outros Custos Fixos' },
    { date: '2025-11-11', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 2193.27, category: 'Investimento' },
    { date: '2025-11-11', desc: 'PIX ENVIADO (Vários)', type: 'saida', amount: 2193.27, category: 'Outros Custos Fixos' },
    { date: '2025-11-12', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 9.90, category: 'Investimento' },
    { date: '2025-11-12', desc: 'TARIFA AVULSA ENVIO PIX', type: 'saida', amount: 9.90, category: 'Outros Custos Fixos' },
    { date: '2025-11-13', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 351.82, category: 'Investimento' },
    { date: '2025-11-13', desc: 'PIX ENVIADO (Vários)', type: 'saida', amount: 351.82, category: 'Outros Custos Fixos' },
    { date: '2025-11-17', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 1402.39, category: 'Investimento' },
    { date: '2025-11-17', desc: 'PIX ENVIADO (Vários)', type: 'saida', amount: 1402.39, category: 'Outros Custos Fixos' },
    { date: '2025-11-18', desc: 'PIX RECEBIDO', type: 'entrada', amount: 149.00, category: 'Venda' },
    { date: '2025-11-18', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 2629.97, category: 'Investimento' },
    { date: '2025-11-18', desc: 'PIX ENVIADO (Vários)', type: 'saida', amount: 2769.07, category: 'Outros Custos Fixos' },
    { date: '2025-11-18', desc: 'TARIFA AVULSA ENVIO PIX', type: 'saida', amount: 9.90, category: 'Outros Custos Fixos' },
    { date: '2025-11-19', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 559.90, category: 'Investimento' },
    { date: '2025-11-19', desc: 'PIX ENVIADO (Vários)', type: 'saida', amount: 550.00, category: 'Outros Custos Fixos' },
    { date: '2025-11-19', desc: 'TARIFA AVULSA ENVIO PIX', type: 'saida', amount: 9.90, category: 'Outros Custos Fixos' },
    { date: '2025-11-21', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 50.72, category: 'Investimento' },
    { date: '2025-11-21', desc: 'PIX ENVIADO', type: 'saida', amount: 48.00, category: 'Outros Custos Fixos' },
    { date: '2025-11-21', desc: 'TARIFA AVULSA ENVIO PIX', type: 'saida', amount: 2.72, category: 'Outros Custos Fixos' },
    { date: '2025-11-24', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 1438.20, category: 'Investimento' },
    { date: '2025-11-24', desc: 'PIX ENVIADO (Vários)', type: 'saida', amount: 1438.20, category: 'Outros Custos Fixos' },
    { date: '2025-11-25', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 2551.51, category: 'Investimento' },
    { date: '2025-11-25', desc: 'PIX ENVIADO (x2)', type: 'saida', amount: 2541.61, category: 'Outros Custos Fixos' },
    { date: '2025-11-25', desc: 'TARIFA AVULSA ENVIO PIX', type: 'saida', amount: 9.90, category: 'Outros Custos Fixos' },
    { date: '2025-11-26', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 9.90, category: 'Investimento' },
    { date: '2025-11-26', desc: 'TARIFA AVULSA ENVIO PIX', type: 'saida', amount: 9.90, category: 'Outros Custos Fixos' },
    { date: '2025-11-27', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 468.88, category: 'Investimento' },
    { date: '2025-11-27', desc: 'PIX ENVIADO (Vários)', type: 'saida', amount: 468.88, category: 'Outros Custos Fixos' },
    { date: '2025-11-28', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 265.80, category: 'Investimento' },
    { date: '2025-11-28', desc: 'PIX ENVIADO', type: 'saida', amount: 265.80, category: 'Outros Custos Fixos' },

    // Dezembro/2025
    { date: '2025-12-01', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 2738.13, category: 'Investimento' },
    { date: '2025-12-01', desc: 'PIX ENVIADO', type: 'saida', amount: 500.00, category: 'Outros Custos Fixos' },
    { date: '2025-12-01', desc: 'PAGAMENTO CARTAO CREDITO BCE', type: 'saida', amount: 2238.13, category: 'Outros Custos Fixos' },
    { date: '2025-12-02', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 7.00, category: 'Investimento' },
    { date: '2025-12-02', desc: 'TARIFA AVULSA ENVIO PIX', type: 'saida', amount: 7.00, category: 'Outros Custos Fixos' },
    { date: '2025-12-03', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 4930.93, category: 'Investimento' },
    { date: '2025-12-03', desc: 'PIX ENVIADO (Vários)', type: 'saida', amount: 4930.93, category: 'Outros Custos Fixos' },
    { date: '2025-12-08', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 2715.34, category: 'Investimento' },
    { date: '2025-12-08', desc: 'PAGAMENTO DARF EM CANAIS (x2)', type: 'saida', amount: 715.34, category: 'Impostos' },
    { date: '2025-12-08', desc: 'PIX ENVIADO', type: 'saida', amount: 2000.00, category: 'Outros Custos Fixos' },
    { date: '2025-12-10', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 4100.00, category: 'Investimento' },
    { date: '2025-12-10', desc: 'PIX ENVIADO (Vários)', type: 'saida', amount: 4100.00, category: 'Outros Custos Fixos' },
    { date: '2025-12-11', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 64.00, category: 'Investimento' },
    { date: '2025-12-11', desc: 'PIX ENVIADO (x2)', type: 'saida', amount: 64.00, category: 'Outros Custos Fixos' },
    { date: '2025-12-16', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 47.00, category: 'Investimento' },
    { date: '2025-12-16', desc: 'PIX ENVIADO', type: 'saida', amount: 47.00, category: 'Outros Custos Fixos' },
    { date: '2025-12-18', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 2000.00, category: 'Investimento' },
    { date: '2025-12-18', desc: 'PIX ENVIADO', type: 'saida', amount: 2000.00, category: 'Outros Custos Fixos' },
    { date: '2025-12-22', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 71.16, category: 'Investimento' },
    { date: '2025-12-22', desc: 'PIX ENVIADO', type: 'saida', amount: 71.16, category: 'Outros Custos Fixos' },
    { date: '2025-12-23', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 2465.90, category: 'Investimento' },
    { date: '2025-12-23', desc: 'PAGAMENTO CARTAO CREDITO BCE', type: 'saida', amount: 2465.90, category: 'Outros Custos Fixos' },
    { date: '2025-12-29', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 43.79, category: 'Investimento' },
    { date: '2025-12-29', desc: 'PIX ENVIADO', type: 'saida', amount: 43.79, category: 'Outros Custos Fixos' },

    // Janeiro/2026
    { date: '2026-01-02', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 1278.67, category: 'Investimento' },
    { date: '2026-01-02', desc: 'PIX ENVIADO', type: 'saida', amount: 1119.67, category: 'Outros Custos Fixos' },
    { date: '2026-01-02', desc: 'TARIFA MENSALIDADE', type: 'saida', amount: 159.00, category: 'Outros Custos Fixos' },
    { date: '2026-01-05', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 9.90, category: 'Investimento' },
    { date: '2026-01-05', desc: 'TARIFA AVULSA ENVIO PIX', type: 'saida', amount: 9.90, category: 'Outros Custos Fixos' },
    { date: '2026-01-08', desc: 'ESTORNO DE TARIFA', type: 'entrada', amount: 9.90, category: 'Outros Custos Fixos' },
    { date: '2026-01-12', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 7192.72, category: 'Investimento' },
    { date: '2026-01-12', desc: 'DEBITO AUT. FAT.CARTAO', type: 'saida', amount: 665.32, category: 'Outros Custos Fixos' },
    { date: '2026-01-12', desc: 'PIX AGENDADO (Vários)', type: 'saida', amount: 6537.30, category: 'Outros Custos Fixos' },
    { date: '2026-01-14', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 1091.78, category: 'Investimento' },
    { date: '2026-01-14', desc: 'PAGAMENTO CARTAO CREDITO BCE', type: 'saida', amount: 1091.78, category: 'Outros Custos Fixos' },
    { date: '2026-01-20', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 550.00, category: 'Investimento' },
    { date: '2026-01-20', desc: 'PAGAMENTO DARF EM CANAIS', type: 'saida', amount: 550.00, category: 'Impostos' },
    { date: '2026-01-23', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 204.93, category: 'Investimento' },
    { date: '2026-01-23', desc: 'PAGAMENTO DARF EM CANAIS', type: 'saida', amount: 204.93, category: 'Impostos' },
    { date: '2026-01-26', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 579.44, category: 'Investimento' },
    { date: '2026-01-26', desc: 'PAGAMENTO DARF EM CANAIS (x2)', type: 'saida', amount: 579.44, category: 'Impostos' },
    { date: '2026-01-27', desc: 'PIX RECEBIDO', type: 'entrada', amount: 8864.34, category: 'Venda' },
    { date: '2026-01-27', desc: 'APLICACAO CONTAMAX', type: 'saida', amount: 8864.34, category: 'Investimento' },
    { date: '2026-01-29', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 8864.34, category: 'Investimento' },
    { date: '2026-01-29', desc: 'PIX ENVIADO', type: 'saida', amount: 8864.34, category: 'Outros Custos Fixos' },
    { date: '2026-01-30', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 9.90, category: 'Investimento' },
    { date: '2026-01-30', desc: 'TARIFA AVULSA ENVIO PIX', type: 'saida', amount: 9.90, category: 'Outros Custos Fixos' },

    // Fevereiro/2026
    { date: '2026-02-02', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 396.57, category: 'Investimento' },
    { date: '2026-02-02', desc: 'TARIFA MENSALIDADE', type: 'saida', amount: 159.00, category: 'Outros Custos Fixos' },
    { date: '2026-02-02', desc: 'PIX ENVIADO (x2)', type: 'saida', amount: 237.57, category: 'Outros Custos Fixos' },
    { date: '2026-02-05', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 695.57, category: 'Investimento' },
    { date: '2026-02-05', desc: 'PIX ENVIADO', type: 'saida', amount: 695.57, category: 'Outros Custos Fixos' },
    { date: '2026-02-09', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 188.00, category: 'Investimento' },
    { date: '2026-02-09', desc: 'PIX ENVIADO (x2)', type: 'saida', amount: 188.00, category: 'Outros Custos Fixos' },
    { date: '2026-02-10', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 1943.97, category: 'Investimento' },
    { date: '2026-02-10', desc: 'DEBITO AUT. FAT.CARTAO', type: 'saida', amount: 943.97, category: 'Outros Custos Fixos' },
    { date: '2026-02-10', desc: 'PIX AGENDADO', type: 'saida', amount: 1000.00, category: 'Outros Custos Fixos' },
    { date: '2026-02-11', desc: 'RESGATE CONTAMAX AUTOMATICO', type: 'entrada', amount: 27009.79, category: 'Investimento' },
    { date: '2026-02-11', desc: 'PIX ENVIADO', type: 'saida', amount: 27009.79, category: 'Outros Custos Fixos' },
];

async function importar() {
    console.log("Iniciando importação do extrato Santander (Conta Corrente e Contamax)...");
    let inseridos = 0;

    for (const item of extratoSantander) {
        if (item.amount === 0) continue; // Pular transação zerada de abertura

        try {
            const { error } = await supabase
                .from('transactions')
                .insert({
                    description: `${item.desc} (1/1) - Extrato Santander`,
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
