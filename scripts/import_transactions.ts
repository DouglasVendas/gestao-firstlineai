
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Using publishable key as we might not have service role, but for RLS we might need service role if we are not logged in.
// Actually, for a script, we typically need the SERVICE_ROLE_KEY to bypass RLS, or we need to sign in. 
// checking .env content again... it only has VITE_SUPABASE_PUBLISHABLE_KEY.
// If RLS is enabled, I might not be able to insert without being authenticated.
// However, I will try with the publishable key first. If it fails, I'll need to ask the user for the service role key or insert via SQL in the dashboard (which I can't do directly).
// Wait, the user is locally developing. Maybe I can use the existing client if I run it within the app context?
// But this is a standalone script.
// Let's assume for now I can insert with the anon key if policies allow or if I can mock a user.
// But standard RLS usually blocks anon inserts. 
// I will try to use the VITE_SUPABASE_PUBLISHABLE_KEY.

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = [
    { Tipo: 'Pago', DtBaixa: '2025-07-19', Valor: 1900, DepesasReceitas: 'Eventos', historico: 'PASSAGEM SP EVENTO JOÃO ADOLFO' },
    { Tipo: 'Pago', DtBaixa: '2025-07-22', Valor: 197.5, DepesasReceitas: 'SEFAZ', historico: 'Tributos início da empresa' },
    { Tipo: 'Pago', DtBaixa: '2025-07-23', Valor: 311.03, DepesasReceitas: 'Uso e Consumo', historico: 'Almoço reunião Rafaelli' },
    { Tipo: 'Pago', DtBaixa: '2025-07-28', Valor: 1290, DepesasReceitas: 'Custos Operacionais', historico: 'Abertura Empresa' },
    { Tipo: 'Pago', DtBaixa: '2025-07-30', Valor: 195, DepesasReceitas: 'Custos Operacionais', historico: 'CERTIFICADO DIGITAL' },
    { Tipo: 'Pago', DtBaixa: '2025-07-30', Valor: 850, DepesasReceitas: 'Designer Gráfico', historico: 'DESIGNER GRÁFICO' },
    { Tipo: 'Pago', DtBaixa: '2025-07-31', Valor: 905.36, DepesasReceitas: 'Eventos', historico: 'AIRBNB EVENTO JOÃO ADOLFO' },
    { Tipo: 'Pago', DtBaixa: '2025-08-02', Valor: 650, DepesasReceitas: 'Designer Gráfico', historico: 'DESIGNER GRÁFICO' },
    { Tipo: 'Pago', DtBaixa: '2025-08-05', Valor: 1000, DepesasReceitas: 'Gestor de Tráfego', historico: 'GESTOR DE TRÁFEGO' },
    { Tipo: 'Pago', DtBaixa: '2025-08-12', Valor: 2000, DepesasReceitas: 'Desenvolvedor', historico: 'PAGAMENTO DESENVOLVEDOR' },
    { Tipo: 'Pago', DtBaixa: '2025-08-14', Valor: 969, DepesasReceitas: 'INVESTIMENTO EM FERRAMENTA DE TRABALHO', historico: 'COMPRA DO MIC LAPELA' },
    { Tipo: 'Pago', DtBaixa: '2025-08-20', Valor: 2500, DepesasReceitas: 'Eventos', historico: 'QUITAÇÃO INGRESSO JOÃO ADOLFO' },
    { Tipo: 'Pago', DtBaixa: '2025-08-22', Valor: 497, DepesasReceitas: 'Eventos', historico: 'COMPRA INGRESSO LIBERTE SUA VOZ' },
    { Tipo: 'Pago', DtBaixa: '2025-08-25', Valor: 0, DepesasReceitas: 'nan', historico: 'ABERTURA' },
    { Tipo: 'Pago', DtBaixa: '2025-08-26', Valor: 4000, DepesasReceitas: 'nan', historico: 'APLICACAO CONTAMAX' },
    { Tipo: 'Pago', DtBaixa: '2025-08-26', Valor: 1000, DepesasReceitas: 'Anúncio Facebook', historico: 'Crédito para Facebook Ads' },
    { Tipo: 'Recebido', DtBaixa: '2025-08-26', Valor: 5000, DepesasReceitas: 'nan', historico: 'PIX RECEBIDO   LUCAS NICOLAI MARTINS' },
    { Tipo: 'Pago', DtBaixa: '2025-08-27', Valor: 850, DepesasReceitas: 'Designer Gráfico', historico: 'Pagamento parcial Designer' },
    { Tipo: 'Recebido', DtBaixa: '2025-08-27', Valor: 850, DepesasReceitas: 'nan', historico: 'RESGATE CONTAMAX AUTOMATICO' },
    { Tipo: 'Pago', DtBaixa: '2025-08-28', Valor: 98, DepesasReceitas: 'Boton personalizado', historico: 'Botão personalizado First Line' },
    { Tipo: 'Recebido', DtBaixa: '2025-08-28', Valor: 98, DepesasReceitas: 'nan', historico: 'RESGATE CONTAMAX AUTOMATICO' },
    { Tipo: 'Pago', DtBaixa: '2025-09-04', Valor: 25.8, DepesasReceitas: 'Uso e Consumo', historico: 'Café Aeroporto' },
    { Tipo: 'Recebido', DtBaixa: '2025-09-04', Valor: 175.8, DepesasReceitas: 'nan', historico: 'RESGATE CONTAMAX AUTOMATICO' },
    { Tipo: 'Pago', DtBaixa: '2025-09-04', Valor: 150, DepesasReceitas: 'Uso e Consumo', historico: 'Táxi Evento João Adolfo' },
    { Tipo: 'Pago', DtBaixa: '2025-09-08', Valor: 150, DepesasReceitas: 'Uso e Consumo', historico: 'Táxi Evento João Adolfo' },
    { Tipo: 'Recebido', DtBaixa: '2025-09-08', Valor: 150, DepesasReceitas: 'nan', historico: 'RESGATE CONTAMAX AUTOMATICO' },
    { Tipo: 'Recebido', DtBaixa: '2025-09-09', Valor: 10000, DepesasReceitas: 'nan', historico: 'PIX RECEBIDO   LUCAS NICOLAI MARTINS' },
    { Tipo: 'Pago', DtBaixa: '2025-09-09', Valor: 10000, DepesasReceitas: 'nan', historico: 'APLICACAO CONTAMAX' },
    { Tipo: 'Recebido', DtBaixa: '2025-09-11', Valor: 2000, DepesasReceitas: 'nan', historico: 'RESGATE CONTAMAX AUTOMATICO' },
    { Tipo: 'Pago', DtBaixa: '2025-09-11', Valor: 2000, DepesasReceitas: 'nan', historico: 'PIX ENVIADO   DOUGLAS VIEIRA SANTOS LOP' },
    { Tipo: 'Pago', DtBaixa: '2025-09-15', Valor: 600, DepesasReceitas: 'Videomaker', historico: 'Captação e edição de vídeos' },
    { Tipo: 'Recebido', DtBaixa: '2025-09-15', Valor: 1400, DepesasReceitas: 'nan', historico: 'RESGATE CONTAMAX AUTOMATICO' },
    { Tipo: 'Pago', DtBaixa: '2025-09-15', Valor: 800, DepesasReceitas: 'Designer Gráfico', historico: 'Designer Gráfico' },
    { Tipo: 'Pago', DtBaixa: '2025-09-22', Valor: 133.46, DepesasReceitas: 'nan', historico: 'PIX ENVIADO   CWD COMERCIO DE ALIMENTOS' },
    { Tipo: 'Pago', DtBaixa: '2025-09-22', Valor: 220.72, DepesasReceitas: 'DARF', historico: 'PAGAMENTO DARF' },
    { Tipo: 'Pago', DtBaixa: '2025-09-22', Valor: 1000, DepesasReceitas: 'nan', historico: 'PIX ENVIADO   D MIDIAS GESTAO DE TRAFEG' },
    { Tipo: 'Recebido', DtBaixa: '2025-09-22', Valor: 3654.18, DepesasReceitas: 'nan', historico: 'RESGATE CONTAMAX AUTOMATICO' },
    { Tipo: 'Pago', DtBaixa: '2025-09-22', Valor: 1800, DepesasReceitas: 'Estrategista Digital', historico: 'Primeiro pagamento Estrategista Digital' },
    { Tipo: 'Pago', DtBaixa: '2025-09-22', Valor: 1500, DepesasReceitas: 'Desenvolvedor', historico: 'Pagamento DEV' },
    { Tipo: 'Recebido', DtBaixa: '2025-09-22', Valor: 1000, DepesasReceitas: 'nan', historico: 'PIX DEVOLVIDO   50882137000195' },
    { Tipo: 'Pago', DtBaixa: '2025-09-26', Valor: 66048.1, DepesasReceitas: 'nan', historico: 'APLICACAO CONTAMAX' },
    { Tipo: 'Recebido', DtBaixa: '2025-09-26', Valor: 67548.1, DepesasReceitas: 'nan', historico: 'PIX RECEBIDO   03220627056' },
    { Tipo: 'Pago', DtBaixa: '2025-09-26', Valor: 1500, DepesasReceitas: 'nan', historico: 'PIX ENVIADO   SERVICO DE APOIO AS MICRO' },
    { Tipo: 'Pago', DtBaixa: '2025-09-29', Valor: 198, DepesasReceitas: 'Eventos', historico: 'Ingressos Networking na prática' },
    { Tipo: 'Pago', DtBaixa: '2025-09-29', Valor: 890, DepesasReceitas: 'Contabilidade anterior', historico: 'PAGAMENTO DE BOLETO OUTROS BANCOS   J. A. CONTABILIDADE' },
    { Tipo: 'Recebido', DtBaixa: '2025-09-29', Valor: 1088, DepesasReceitas: 'nan', historico: 'RESGATE CONTAMAX AUTOMATICO' },
    { Tipo: 'Recebido', DtBaixa: '2025-09-30', Valor: 5000, DepesasReceitas: 'nan', historico: 'PIX RECEBIDO   03220627056' },
    { Tipo: 'Pago', DtBaixa: '2025-09-30', Valor: 5000, DepesasReceitas: 'nan', historico: 'APLICACAO CONTAMAX' },
    { Tipo: 'Pago', DtBaixa: '2025-10-01', Valor: 48, DepesasReceitas: 'nan', historico: 'PIX ENVIADO   ZIG TECNOLOGIA S A' },
    { Tipo: 'Recebido', DtBaixa: '2025-10-01', Valor: 5000, DepesasReceitas: 'nan', historico: 'PIX RECEBIDO   03220627056' },
    { Tipo: 'Pago', DtBaixa: '2025-10-01', Valor: 95.7, DepesasReceitas: 'Uso e Consumo', historico: 'Café Instituto Caldeira' },
    { Tipo: 'Pago', DtBaixa: '2025-10-01', Valor: 9808.3, DepesasReceitas: 'nan', historico: 'APLICACAO CONTAMAX' },
    { Tipo: 'Recebido', DtBaixa: '2025-10-01', Valor: 5000, DepesasReceitas: 'nan', historico: 'PIX RECEBIDO   03220627056' },
    { Tipo: 'Pago', DtBaixa: '2025-10-01', Valor: 48, DepesasReceitas: 'Uso e Consumo', historico: 'Almoço Instituto Caldeira' },
    { Tipo: 'Recebido', DtBaixa: '2025-10-02', Valor: 105, DepesasReceitas: 'nan', historico: 'RESGATE CONTAMAX AUTOMATICO' },
    { Tipo: 'Pago', DtBaixa: '2025-10-02', Valor: 57, DepesasReceitas: 'Uso e Consumo', historico: 'Almoço Instituto Caldeira' },
    { Tipo: 'Pago', DtBaixa: '2025-10-02', Valor: 48, DepesasReceitas: 'Uso e Consumo', historico: 'Almoço Instituto Caldeira' },
    { Tipo: 'Saldo Inicial', DtBaixa: '2025-10-04', Valor: 85336.6, DepesasReceitas: 'Saldo Inicial Santander', historico: 'Saldo Inicial Santander' },
    { Tipo: 'Pago', DtBaixa: '2025-10-04', Valor: 1271.8, DepesasReceitas: 'Uso e Consumo', historico: 'Ressarcimento almoços e jantas SP + estacionamento + gasolina' },
    { Tipo: 'Pago', DtBaixa: '2025-10-06', Valor: 2342.85, DepesasReceitas: 'Uso e Consumo', historico: 'Reembolso custos de uso e consumo Sócio Douglas' },
    { Tipo: 'Saldo Inicial', DtBaixa: '2025-10-08', Valor: 10000, DepesasReceitas: 'Saldo Inicial C6 Bank', historico: 'Saldo Inicial C6 Bank' },
    { Tipo: 'Pago', DtBaixa: '2025-10-13', Valor: 70, DepesasReceitas: 'Uso e Consumo', historico: 'Uber hotel evento G4' },
    { Tipo: 'Pago', DtBaixa: '2025-10-13', Valor: 405.67, DepesasReceitas: 'Uso e Consumo', historico: 'Janta de negócios e relacionamento São Paulo - G4' },
    { Tipo: 'Pago', DtBaixa: '2025-10-13', Valor: 126.7, DepesasReceitas: 'Uso e Consumo', historico: 'Almoço São Paulo - G4' },
    { Tipo: 'Pago', DtBaixa: '2025-10-14', Valor: 277.05, DepesasReceitas: 'Uso e Consumo', historico: 'Almoço de Negócios e Networking - São Paulo G4' },
    { Tipo: 'Pago', DtBaixa: '2025-10-16', Valor: 2000, DepesasReceitas: 'Prolabore Douglas', historico: 'Prolabore Douglas - Outubro' },
    { Tipo: 'Pago', DtBaixa: '2025-10-17', Valor: 1500, DepesasReceitas: 'Desenvolvedor', historico: 'Pagamento Fixo Desenvolvedor' },
    { Tipo: 'Pago', DtBaixa: '2025-10-19', Valor: 157.01, DepesasReceitas: 'Uso e Consumo', historico: 'Almoço evento Networking na Prática' },
    { Tipo: 'Pago', DtBaixa: '2025-10-21', Valor: 89.3, DepesasReceitas: 'Uso e Consumo', historico: 'Café Caldeira' },
    { Tipo: 'Pago', DtBaixa: '2025-10-21', Valor: 58, DepesasReceitas: 'Uso e Consumo', historico: 'Almoço Caldeira' },
    { Tipo: 'Pago', DtBaixa: '2025-10-21', Valor: 1800, DepesasReceitas: 'Estrategista Digital', historico: 'Pagamento Estrategista Digital' },
    { Tipo: 'Pago', DtBaixa: '2025-10-22', Valor: 149, DepesasReceitas: 'Eventos', historico: 'Ingressos Evento Youtube -  Lu Finanças' },
    { Tipo: 'Pago', DtBaixa: '2025-10-23', Valor: 96, DepesasReceitas: 'Uso e Consumo', historico: 'Almoço Caldeira' },
    { Tipo: 'Pago', DtBaixa: '2025-07-29', Valor: 2500, DepesasReceitas: 'Eventos', historico: '50% INGRESSO EVENTO JOÃO ADOLFO' },
    { Tipo: 'Pago', DtBaixa: '2025-11-03', Valor: 149, DepesasReceitas: 'Tarifa Banco Santander', historico: 'Tarifa Banco Santander' },
    { Tipo: 'Saldo Inicial', DtBaixa: '2025-11-04', Valor: 0, DepesasReceitas: 'Saldo Inicial Conta Green', historico: 'Saldo Inicial Conta Green' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-04', Valor: 186.17, DepesasReceitas: 'Venda Plano Starter Mensal', historico: 'nan' },
    { Tipo: 'Pago', DtBaixa: '2025-11-04', Valor: 1000, DepesasReceitas: 'Conselheiro Carlos Lucas', historico: 'Conselho Carlos Lucas' },
    { Tipo: 'Pago', DtBaixa: '2025-11-04', Valor: 634.45, DepesasReceitas: 'Pagamento Cartão de Crédito C6', historico: 'Pagamento fatura Cartão de Crédio C6' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-06', Valor: 946.25, DepesasReceitas: 'Venda Plano Team Mensal', historico: 'nan' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-06', Valor: 946.25, DepesasReceitas: 'Venda Plano Team Mensal', historico: 'nan' },
    { Tipo: 'Pago', DtBaixa: '2025-11-06', Valor: 55, DepesasReceitas: 'Uso e Consumo', historico: 'Almoço Caldeira' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-10', Valor: 376.19, DepesasReceitas: 'Venda Plano Starter Mensal', historico: 'nan' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-10', Valor: 0.07, DepesasReceitas: 'nan', historico: 'RENDIMENTO LIQUIDO DE CONTAMAX   7000 RENDIMENTO LIQUIDO DE CONTAMAX' },
    { Tipo: 'Pago', DtBaixa: '2025-11-10', Valor: 736.2, DepesasReceitas: 'Cartão de crédito Santander', historico: 'DEBITO AUT. FAT.CARTAO MASTER CARD   FINAL 0988' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-11', Valor: 0.28, DepesasReceitas: 'nan', historico: 'RENDIMENTO LIQUIDO DE CONTAMAX   7000 RENDIMENTO LIQUIDO DE CONTAMAX' },
    { Tipo: 'Pago', DtBaixa: '2025-11-11', Valor: 2000, DepesasReceitas: 'Prolabore Douglas', historico: 'PIX ENVIADO   DOUGLAS VIEIRA SANTOS LOP' },
    { Tipo: 'Pago', DtBaixa: '2025-11-11', Valor: 34.47, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   ALEGROW CONVENIENCIAS LTD' },
    { Tipo: 'Pago', DtBaixa: '2025-11-11', Valor: 70.8, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   MERCADO BRASCO LTDA' },
    { Tipo: 'Pago', DtBaixa: '2025-11-11', Valor: 88, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   FABIANO NOGUEIRA DA ROSA' },
    { Tipo: 'Pago', DtBaixa: '2025-11-12', Valor: 9.9, DepesasReceitas: 'Tarifa Banco Santander', historico: 'TARIFA AVULSA ENVIO PIX   11/11/2025' },
    { Tipo: 'Pago', DtBaixa: '2025-11-13', Valor: 7, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   VALDINEI BRANDAO' },
    { Tipo: 'Pago', DtBaixa: '2025-11-13', Valor: 65.5, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   FABIANO NOGUEIRA DA ROSA' },
    { Tipo: 'Pago', DtBaixa: '2025-11-13', Valor: 279.32, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   SIM REDE DE POSTOS LTDA' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-13', Valor: 0.05, DepesasReceitas: 'nan', historico: 'RENDIMENTO LIQUIDO DE CONTAMAX   7000 RENDIMENTO LIQUIDO DE CONTAMAX' },
    { Tipo: 'Pago', DtBaixa: '2025-11-17', Valor: 1100, DepesasReceitas: 'Desenvolvedor', historico: 'PIX ENVIADO   GABRIEL CAMPOS SANINI' },
    { Tipo: 'Pago', DtBaixa: '2025-11-17', Valor: 96, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   ZIG TECNOLOGIA S A' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-17', Valor: 0.21, DepesasReceitas: 'nan', historico: 'RENDIMENTO LIQUIDO DE CONTAMAX   7000 RENDIMENTO LIQUIDO DE CONTAMAX' },
    { Tipo: 'Pago', DtBaixa: '2025-11-17', Valor: 206.39, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   POSTO ROTA 80 LTDA' },
    { Tipo: 'Pago', DtBaixa: '2025-11-18', Valor: 58, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   FABIANO NOGUEIRA DA ROSA' },
    { Tipo: 'Pago', DtBaixa: '2025-11-18', Valor: 2600, DepesasReceitas: 'Estrategista Digital', historico: 'PIX ENVIADO   FERNANDA DE ARAUJO BERTOL + MAURO (TRÁFEGO)' },
    { Tipo: 'Pago', DtBaixa: '2025-11-18', Valor: 79.57, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   SIM REDE DE POSTOS LTDA' },
    { Tipo: 'Pago', DtBaixa: '2025-11-18', Valor: 31.5, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   INDIGO' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-18', Valor: 0.38, DepesasReceitas: 'nan', historico: 'RENDIMENTO LIQUIDO DE CONTAMAX   7000 RENDIMENTO LIQUIDO DE CONTAMAX' },
    { Tipo: 'Pago', DtBaixa: '2025-11-18', Valor: 9.9, DepesasReceitas: 'Tarifa Banco Santander', historico: 'TARIFA AVULSA ENVIO PIX   17/11/2025' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-18', Valor: 149, DepesasReceitas: 'RESSARCIMENTO', historico: 'PIX RECEBIDO  RESSARCIMENTO INGRESSO YOUTUBE' },
    { Tipo: 'Pago', DtBaixa: '2025-11-19', Valor: 194, DepesasReceitas: 'Eventos', historico: 'PIX ENVIADO   THIAGO DE OLIVEIRA ZANONI' },
    { Tipo: 'Pago', DtBaixa: '2025-11-19', Valor: 330, DepesasReceitas: 'Anúncio Facebook', historico: 'PIX ENVIADO   FACEBOOK SERVICOS ONLINE' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-19', Valor: 0.08, DepesasReceitas: 'nan', historico: 'RENDIMENTO LIQUIDO DE CONTAMAX   7000 RENDIMENTO LIQUIDO DE CONTAMAX' },
    { Tipo: 'Pago', DtBaixa: '2025-11-19', Valor: 26, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   FABIANO NOGUEIRA DA ROSA' },
    { Tipo: 'Pago', DtBaixa: '2025-11-19', Valor: 9.9, DepesasReceitas: 'Tarifa Banco Santander', historico: 'TARIFA AVULSA ENVIO PIX   18/11/2025' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-21', Valor: 0.01, DepesasReceitas: 'nan', historico: 'RENDIMENTO LIQUIDO DE CONTAMAX   7000 RENDIMENTO LIQUIDO DE CONTAMAX' },
    { Tipo: 'Pago', DtBaixa: '2025-11-21', Valor: 2.72, DepesasReceitas: 'Tarifa Banco Santander', historico: 'TARIFA AVULSA ENVIO PIX   19/11/2025' },
    { Tipo: 'Pago', DtBaixa: '2025-11-21', Valor: 48, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   ZIG TECNOLOGIA S A' },
    { Tipo: 'Pago', DtBaixa: '2025-11-24', Valor: 66.8, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   ZVC FRANQUEADORA LTDA' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-24', Valor: 0.23, DepesasReceitas: 'nan', historico: 'RENDIMENTO LIQUIDO DE CONTAMAX   7000 RENDIMENTO LIQUIDO DE CONTAMAX' },
    { Tipo: 'Pago', DtBaixa: '2025-11-24', Valor: 500, DepesasReceitas: 'OFERTA', historico: 'PIX ENVIADO   MANANCIAL DE VIDA PORTO A' },
    { Tipo: 'Pago', DtBaixa: '2025-11-24', Valor: 30, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   ABASTECEDORA DE COMBUSTIV' },
    { Tipo: 'Pago', DtBaixa: '2025-11-24', Valor: 91.4, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   ZVC FRANQUEADORA LTDA' },
    { Tipo: 'Pago', DtBaixa: '2025-11-24', Valor: 750, DepesasReceitas: 'Videomaker', historico: 'PIX ENVIADO   LUIS GUILHERME SIMOES 50% AUDIO VISUAL CR.IA' },
    { Tipo: 'Pago', DtBaixa: '2025-11-25', Valor: 58, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   FABIANO NOGUEIRA DA ROSA' },
    { Tipo: 'Pago', DtBaixa: '2025-11-25', Valor: 9.9, DepesasReceitas: 'Tarifa Banco Santander', historico: 'TARIFA AVULSA ENVIO PIX   24/11/2025' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-25', Valor: 0.42, DepesasReceitas: 'nan', historico: 'RENDIMENTO LIQUIDO DE CONTAMAX   7000 RENDIMENTO LIQUIDO DE CONTAMAX' },
    { Tipo: 'Pago', DtBaixa: '2025-11-26', Valor: 9.9, DepesasReceitas: 'Tarifa Banco Santander', historico: 'TARIFA AVULSA ENVIO PIX   25/11/2025' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-27', Valor: 0.08, DepesasReceitas: 'nan', historico: 'RENDIMENTO LIQUIDO DE CONTAMAX   7000 RENDIMENTO LIQUIDO DE CONTAMAX' },
    { Tipo: 'Pago', DtBaixa: '2025-11-27', Valor: 233.05, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   SIM REDE DE POSTOS LTDA' },
    { Tipo: 'Pago', DtBaixa: '2025-11-27', Valor: 60.83, DepesasReceitas: 'Eventos', historico: 'PIX ENVIADO   PAGAR ME PAGAMENTOS' },
    { Tipo: 'Pago', DtBaixa: '2025-11-27', Valor: 120, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   DON AURELIO RESTAURANTE E' },
    { Tipo: 'Pago', DtBaixa: '2025-11-27', Valor: 55, DepesasReceitas: 'Eventos', historico: 'PIX ENVIADO   INDIGO' },
    { Tipo: 'Pago', DtBaixa: '2025-11-28', Valor: 265.8, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   RESTAURANTE FIGUEIRAS LTD' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-28', Valor: 0.05, DepesasReceitas: 'nan', historico: 'RENDIMENTO LIQUIDO DE CONTAMAX   7000 RENDIMENTO LIQUIDO DE CONTAMAX' },
    { Tipo: 'Recebido', DtBaixa: '2025-12-01', Valor: 0.52, DepesasReceitas: 'nan', historico: 'RENDIMENTO LIQUIDO DE CONTAMAX   7000 RENDIMENTO LIQUIDO DE CONTAMAX' },
    { Tipo: 'Pago', DtBaixa: '2025-12-01', Valor: 500, DepesasReceitas: 'Eventos', historico: 'PIX ENVIADO   DOUGLAS DA LUZ LOURENCO' },
    { Tipo: 'Pago', DtBaixa: '2025-12-01', Valor: 2238.13, DepesasReceitas: 'Cartão de crédito Santander', historico: 'PAGAMENTO CARTAO CREDITO BCE   28/11 23:08 CARTAO MASTER' },
    { Tipo: 'Pago', DtBaixa: '2025-12-02', Valor: 7, DepesasReceitas: 'Tarifa Banco Santander', historico: 'TARIFA AVULSA ENVIO PIX   29/11/2025' },
    { Tipo: 'Recebido', DtBaixa: '2025-12-03', Valor: 0.99, DepesasReceitas: 'nan', historico: 'RENDIMENTO LIQUIDO DE CONTAMAX   7000 RENDIMENTO LIQUIDO DE CONTAMAX' },
    { Tipo: 'Pago', DtBaixa: '2025-12-03', Valor: 1014.6, DepesasReceitas: 'RESSARCIMENTO', historico: 'PIX ENVIADO   DOUGLAS VIEIRA SANTOS LOP' },
    { Tipo: 'Pago', DtBaixa: '2025-12-03', Valor: 3000, DepesasReceitas: 'Prolabore Douglas', historico: 'PIX ENVIADO   DOUGLAS VIEIRA SANTOS LOP' },
    { Tipo: 'Pago', DtBaixa: '2025-12-03', Valor: 916.33, DepesasReceitas: 'COMISSÃO DOUGLAS', historico: 'PIX ENVIADO   DOUGLAS VIEIRA SANTOS LOP' },
    { Tipo: 'Recebido', DtBaixa: '2025-12-08', Valor: 0.58, DepesasReceitas: 'nan', historico: 'RENDIMENTO LIQUIDO DE CONTAMAX   7000 RENDIMENTO LIQUIDO DE CONTAMAX' },
    { Tipo: 'Pago', DtBaixa: '2025-12-08', Valor: 2000, DepesasReceitas: 'PROLABORE LUCAS', historico: 'PIX ENVIADO   LUCAS NICOLAI MARTINS' },
    { Tipo: 'Pago', DtBaixa: '2025-12-08', Valor: 495.34, DepesasReceitas: 'DARF', historico: 'PAGAMENTO DARF EM CANAIS   INTERNET TRIBUTOS FEDERAI' },
    { Tipo: 'Pago', DtBaixa: '2025-12-08', Valor: 220, DepesasReceitas: 'DARF', historico: 'PAGAMENTO DARF EM CANAIS   INTERNET TRIBUTOS FEDERAI' },
    { Tipo: 'Pago', DtBaixa: '2025-12-10', Valor: 1000, DepesasReceitas: 'Conselheiro Carlos Lucas', historico: 'PIX ENVIADO   CARLOS LUCAS EDUCACAO E T' },
    { Tipo: 'Pago', DtBaixa: '2025-12-10', Valor: 2800, DepesasReceitas: 'GESTOR DE PRODUTO', historico: 'PIX ENVIADO   LEONARDO DA SILVEIRA MART' },
    { Tipo: 'Pago', DtBaixa: '2025-12-10', Valor: 300, DepesasReceitas: 'Desenvolvedor', historico: 'PIX ENVIADO   RONALDO LACERDA DA SILVA' },
    { Tipo: 'Recebido', DtBaixa: '2025-12-10', Valor: 0.91, DepesasReceitas: 'nan', historico: 'RENDIMENTO LIQUIDO DE CONTAMAX   7000 RENDIMENTO LIQUIDO DE CONTAMAX' },
    { Tipo: 'Pago', DtBaixa: '2025-12-11', Valor: 26, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   GRINGOS PARK' },
    { Tipo: 'Pago', DtBaixa: '2025-12-11', Valor: 38, DepesasReceitas: 'Uso e Consumo', historico: 'PIX ENVIADO   CASA DAS CUCAS VITIACERI' },
    { Tipo: 'Recebido', DtBaixa: '2025-12-11', Valor: 0.01, DepesasReceitas: 'nan', historico: 'RENDIMENTO LIQUIDO DE CONTAMAX   7000 RENDIMENTO LIQUIDO DE CONTAMAX' },
    { Tipo: 'Pago', DtBaixa: '2025-12-16', Valor: 47, DepesasReceitas: 'INVESTIMENTO EM FERRAMENTA DE TRABALHO', historico: 'PIX ENVIADO   KIWIFY PAGAMENTOS TECNOLO' },
    { Tipo: 'Recebido', DtBaixa: '2025-12-16', Valor: 0.01, DepesasReceitas: 'nan', historico: 'RENDIMENTO LIQUIDO DE CONTAMAX   7000 RENDIMENTO LIQUIDO DE CONTAMAX' },
    { Tipo: 'Recebido', DtBaixa: '2025-12-18', Valor: 0.5, DepesasReceitas: 'nan', historico: 'RENDIMENTO LIQUIDO DE CONTAMAX   7000 RENDIMENTO LIQUIDO DE CONTAMAX' },
    { Tipo: 'Pago', DtBaixa: '2025-12-18', Valor: 2000, DepesasReceitas: 'Estrategista Digital', historico: 'PIX ENVIADO   FERNANDA DE ARAUJO BERTOL + MAURO TRÁFEGO PROPORCIONAL' }
];

async function importTransactions() {
    console.log(`Starting import of ${rawData.length} transactions...`);

    const transactions = rawData.map(item => {
        let type = 'saida';
        if (item.Tipo === 'Recebido' || item.Tipo === 'Saldo Inicial') {
            type = 'entrada';
        }

        // Default status to completed for past transactions
        const status = 'completed';

        // Handle NaN strings in category
        let category = item.DepesasReceitas;
        if (category === 'nan') {
            category = 'Investimentos/Outros'; // Default category for undefined ones
        }

        return {
            date: item.DtBaixa,
            description: item.historico,
            type: type,
            category: category,
            amount: Number(item.Valor),
            status: status,
            created_at: new Date().toISOString()
        };
    });

    const { data, error } = await supabase
        .from('transactions')
        .insert(transactions)
        .select();

    if (error) {
        console.error('Error importing transactions:', error);
    } else {
        console.log(`Successfully imported ${data.length} transactions.`);
    }
}

importTransactions();
