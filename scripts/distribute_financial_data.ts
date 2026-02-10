
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
    { Tipo: 'Pago', DtBaixa: '2025-12-18', Valor: 2000, DepesasReceitas: 'Estrategista Digital', historico: 'PIX ENVIADO   FERNANDA DE ARAUJO BERTOL + MAURO TRÁFEGO PROPORCIONAL' },
    // Sales Data
    { Tipo: 'Recebido', DtBaixa: '2026-02-08', Valor: 397, DepesasReceitas: 'Plano', historico: 'Venda Plano Starter Mensal - DENER MARQUES SARUBBI' },
    { Tipo: 'Recebido', DtBaixa: '2026-02-07', Valor: 618, DepesasReceitas: 'Plano', historico: 'Venda CRM First Line Anual + AI Starter - Comunicação Asas' },
    { Tipo: 'Recebido', DtBaixa: '2026-02-07', Valor: 402, DepesasReceitas: 'Plano', historico: 'Venda CRM First Line Anual - Vitória Pontin Mombach' },
    { Tipo: 'Recebido', DtBaixa: '2026-02-06', Valor: 2500, DepesasReceitas: 'Plano', historico: 'Venda Plano Business Mensal - Rodrigo Avelar Corte Real' },
    { Tipo: 'Recebido', DtBaixa: '2026-02-06', Valor: 997, DepesasReceitas: 'Plano', historico: 'Venda Plano Team Mensal - Elaine Ferreira Duarte de Sá' },
    { Tipo: 'Recebido', DtBaixa: '2026-02-05', Valor: 997, DepesasReceitas: 'Plano', historico: 'Venda Plano Team Mensal - BFR Assessor de Investimentos Ltda' },
    { Tipo: 'Recebido', DtBaixa: '2026-01-26', Valor: 397, DepesasReceitas: 'Plano', historico: 'Venda Plano Starter Mensal - Alisson Gonçalves' },
    { Tipo: 'Recebido', DtBaixa: '2026-01-16', Valor: 594, DepesasReceitas: 'Plano', historico: 'Venda Plano Starter Anual - Mosko Digital Treinamento e Marketing Ltda' },
    { Tipo: 'Recebido', DtBaixa: '2026-01-16', Valor: 997, DepesasReceitas: 'Plano', historico: 'Venda Plano Starter Anual - Fabiano Brino' },
    { Tipo: 'Recebido', DtBaixa: '2026-01-15', Valor: 197, DepesasReceitas: 'Plano', historico: 'Venda Plano Starter Mensal - JULIANA da silva ANHAIA' },
    { Tipo: 'Recebido', DtBaixa: '2026-01-14', Valor: 3564, DepesasReceitas: 'Plano', historico: 'Venda Plano Starter Anual - FÁBIO COSTA' },
    { Tipo: 'Recebido', DtBaixa: '2026-01-12', Valor: 397, DepesasReceitas: 'Plano', historico: 'Venda Plano Starter Mensal - Daiane Dalavi' },
    { Tipo: 'Recebido', DtBaixa: '2026-01-10', Valor: 397, DepesasReceitas: 'Plano', historico: 'Venda Plano Starter Mensal - Virtux Tech Ltda' },
    { Tipo: 'Recebido', DtBaixa: '2026-01-08', Valor: 397, DepesasReceitas: 'Plano', historico: 'Venda Plano Starter Mensal - DENER MARQUES SARUBBI' },
    { Tipo: 'Recebido', DtBaixa: '2026-01-06', Valor: 997, DepesasReceitas: 'Plano', historico: 'Venda Plano Team Mensal - Elaine Ferreira Duarte de Sá' },
    { Tipo: 'Recebido', DtBaixa: '2026-01-05', Valor: 997, DepesasReceitas: 'Plano', historico: 'Venda Plano Team Mensal - BFR Assessor de Investimentos Ltda' },
    { Tipo: 'Recebido', DtBaixa: '2025-12-26', Valor: 397, DepesasReceitas: 'Plano', historico: 'Venda Plano Starter Mensal - Alisson Gonçalves' },
    { Tipo: 'Recebido', DtBaixa: '2025-12-15', Valor: 197, DepesasReceitas: 'Plano', historico: 'Venda Plano Starter Mensal - JULIANA da silva ANHAIA' },
    { Tipo: 'Recebido', DtBaixa: '2025-12-12', Valor: 397, DepesasReceitas: 'Plano', historico: 'Venda Plano Starter Mensal - Daiane Dalavi' },
    { Tipo: 'Recebido', DtBaixa: '2025-12-10', Valor: 397, DepesasReceitas: 'Plano', historico: 'Venda Plano Starter Mensal - Virtux Tech Ltda' },
    { Tipo: 'Recebido', DtBaixa: '2025-12-08', Valor: 397, DepesasReceitas: 'Plano', historico: 'Venda Plano Starter Mensal - DENER MARQUES SARUBBI' },
    { Tipo: 'Recebido', DtBaixa: '2025-12-06', Valor: 997, DepesasReceitas: 'Plano', historico: 'Venda Plano Team Mensal - Elaine Ferreira Duarte de Sá' },
    { Tipo: 'Recebido', DtBaixa: '2025-12-06', Valor: 997, DepesasReceitas: 'Plano', historico: 'Venda Plano Team Mensal - Felipe Campos da Silva' },
    { Tipo: 'Recebido', DtBaixa: '2025-12-05', Valor: 997, DepesasReceitas: 'Plano', historico: 'Venda Plano Team Mensal - BFR Assessor de Investimentos Ltda' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-26', Valor: 397, DepesasReceitas: 'Plano', historico: 'Venda Plano Starter Mensal - Alisson Gonçalves' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-21', Valor: 397, DepesasReceitas: 'Plano', historico: 'Venda Plano Starter Mensal - GUILHERME COSTA DE SOUZA SALES' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-10', Valor: 397, DepesasReceitas: 'Plano', historico: 'Venda Plano Starter Mensal - Virtux Tech Ltda' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-06', Valor: 997, DepesasReceitas: 'Plano', historico: 'Venda Plano Team Mensal - Elaine Ferreira Duarte de Sá' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-06', Valor: 997, DepesasReceitas: 'Plano', historico: 'Venda Plano Team Mensal - Felipe Campos da Silva' },
    { Tipo: 'Recebido', DtBaixa: '2025-11-04', Valor: 197, DepesasReceitas: 'Plano', historico: 'Venda Plano Starter Mensal - Juliana Anhaia' }
];

// Helper to determine Category Type
function getCategoryType(description: string, category: string): 'Fixed' | 'Variable' {
    const upperDesc = description.toUpperCase();
    const upperCat = category.toUpperCase();

    // Specific mapping based on user feedback (CFO Perspective)
    // Pro-labore and INSS -> Fixed
    if (upperDesc.includes('PROLABORE') || upperDesc.includes('PRO-LABORE') || upperDesc.includes('INSS')) {
        return 'Fixed';
    }

    // Taxes on Revenue (Simples, ISS, etc.) -> Variable
    if (upperCat.includes('SEFAZ') || upperCat.includes('DARF') || upperCat.includes('SIMPLES') || upperCat.includes('DAS')) {
        return 'Variable';
    }

    // Fixed Costs (Recurring/Structural)
    if (
        upperDesc.includes('DESENVOLVEDOR') ||
        upperDesc.includes('DESIGNER') ||
        upperDesc.includes('ESTATEGIST') ||
        upperDesc.includes('ESTRATEGISTA') ||
        upperDesc.includes('GESTOR') ||
        upperDesc.includes('CONSELHEIRO') ||
        upperDesc.includes('VIDEOMAKER') ||
        upperDesc.includes('CONTABILIDADE') ||
        upperCat.includes('CUSTOS OPERACIONAIS') ||
        upperCat.includes('INVESTIMENTO EM FERRAMENTA') ||
        upperCat.includes('CARTÃO DE CRÉDITO') ||
        upperDesc.includes('CARTAO CREDITO')
    ) {
        return 'Fixed';
    }

    // Variable Costs (Usage/Activity based)
    if (
        upperCat.includes('EVENTOS') ||
        upperCat.includes('ANÚNCIO') ||
        upperCat.includes('FACEBOOK') ||
        upperCat.includes('USO E CONSUMO') ||
        upperCat.includes('TARIFA') ||
        upperCat.includes('OFERTA') ||
        upperDesc.includes('COMISSÃO') ||
        upperDesc.includes('RESSARCIMENTO')
    ) {
        return 'Variable';
    }

    // New Sales Data
    if (upperCat.includes('PLANO') || upperDesc.includes('VENDA PLANO') || upperDesc.includes('CRM FIRST LINE')) {
        return 'Variable';
    }

    return 'Variable';
}

function getCorrectCategoryName(description: string, category: string): string {
    const type = getCategoryType(description, category);

    // Revenue Categories
    if (category.toUpperCase().includes('PLANO') || description.toUpperCase().includes('VENDA')) {
        if (description.toUpperCase().includes('STARTER')) return 'Plano Starter';
        if (description.toUpperCase().includes('TEAM')) return 'Plano Team';
        if (description.toUpperCase().includes('BUSINESS')) return 'Plano Business';
        if (description.toUpperCase().includes('CRM')) return 'CRM';
        return 'Vendas';
    }

    if (type === 'Fixed') {
        if (description.toUpperCase().includes('PROLABORE') || description.toUpperCase().includes('DOUGLAS')) return 'Pessoal';
        if (category.toUpperCase().includes('INVESTIMENTO') || category.toUpperCase().includes('CUSTOS OPERACIONAIS')) return 'Operacional';
        if (description.toUpperCase().includes('CARTAO CREDITO')) return 'Operacional';
        return 'Pessoal'; // Services usually go here or Operational
    } else {
        if (category.toUpperCase().includes('ANÚNCIO') || category.toUpperCase().includes('FACEBOOK')) return 'Marketing';
        if (category.toUpperCase().includes('SEFAZ') || category.toUpperCase().includes('DARF')) return 'Impostos';
        if (category.toUpperCase().includes('USO E CONSUMO')) return 'Uso e Consumo';
        return 'Outros';
    }
}

async function distributeData() {
    console.log('Starting data distribution...');

    // 1. Clear existing data to avoid duplicates
    const tables = ['transactions', 'fixed_costs', 'variable_costs', 'financial_metrics', 'marketing_stats', 'invoices', 'budget']; // Clients cleared first
    for (const table of tables) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) console.error(`Error clearing ${table}:`, error);
    }
    await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Fetch Plans for mapping
    const { data: plans } = await supabase.from('plans').select('*');
    const planMap = new Map(plans?.map(p => [p.name.toUpperCase(), p.id]));

    // 3. Process Clients (First Pass)
    console.log('Processing Clients...');
    const uniqueClients = new Map<string, { name: string, plan_id: string, start_date: string, status: string, mrr: number }>();

    for (const item of rawData) {
        if (item.Tipo === 'Recebido' && (item.DepesasReceitas.includes('Plano') || item.DepesasReceitas.includes('CRM'))) {
            const parts = item.historico.split(' - ');
            if (parts.length > 1) {
                const name = parts[1].trim();
                const date = item.DtBaixa;
                let planId = null;
                const descUpper = item.historico.toUpperCase();
                if (descUpper.includes('STARTER')) planId = planMap.get('STARTER') || planMap.get('PLANO STARTER');
                else if (descUpper.includes('TEAM')) planId = planMap.get('TEAM') || planMap.get('PLANO TEAM');
                else if (descUpper.includes('BUSINESS')) planId = planMap.get('BUSINESS') || planMap.get('PLANO BUSINESS');

                const tVal = item.Valor;
                if (!planId && plans && plans.length > 0) planId = plans[0].id;

                if (planId) {
                    if (!uniqueClients.has(name)) {
                        uniqueClients.set(name, { name, plan_id: planId, start_date: date, status: 'active', mrr: tVal });
                    } else {
                        const existing = uniqueClients.get(name)!;
                        if (date < existing.start_date) existing.start_date = date;
                        if (date > existing.start_date) { existing.plan_id = planId; existing.mrr = tVal; }
                    }
                }
            }
        }
    }

    let clientNameIdMap = new Map<string, string>();

    const clientsPayload = Array.from(uniqueClients.values()).map(c => ({
        name: c.name, plan_id: c.plan_id, status: c.status, start_date: c.start_date, mrr: c.mrr
    }));

    if (clientsPayload.length > 0) {
        const { data: insertedClients, error } = await supabase.from('clients').insert(clientsPayload).select('id, name');
        if (error) console.error('Error inserting clients:', error);
        else {
            console.log(`Inserted ${clientsPayload.length} clients.`);
            if (insertedClients) {
                clientNameIdMap = new Map(insertedClients.map(c => [c.name.trim().toUpperCase(), c.id]));
            }
        }
    }

    // 4. Process Financials (Second Pass)
    console.log('Processing Financials...');
    const transactionsInsert = [];
    const fixedCostsMap = new Map<string, { month: string, category: string, amount: number }>();
    const variableCostsMap = new Map<string, { month: string, category: string, amount: number }>();
    const metricsMap = new Map<string, {
        month: string, revenue: number, expenses: number, mrr: number, active_clients: number, new_mrr: number, churn_mrr: number, marketing_spend: number
    }>();

    const calculateMRR = (amount: number, description: string): number => {
        const descUpper = description.toUpperCase();
        if (descUpper.includes('ANUAL')) return amount / 12;
        if (descUpper.includes('SEMESTRAL')) return amount / 6;
        if (descUpper.includes('TRIMESTRAL')) return amount / 3;
        if (descUpper.includes('MENSAL')) return amount;
        return 0; // Not a recurring subscription or unknown term
    };

    const monthlyActiveClients = new Map<string, Set<string>>();
    const monthlyNewClients = new Map<string, number>();

    for (const item of rawData) {
        let type = 'saida';
        if (item.Tipo === 'Recebido' || item.Tipo === 'Saldo Inicial') type = 'entrada';
        const amount = Number(item.Valor);
        const date = item.DtBaixa;
        const month = date.substring(0, 7) + '-01';
        let category = item.DepesasReceitas;
        if (category === 'nan') category = 'Outros';

        transactionsInsert.push({
            date: date, description: item.historico, type: type, category: category, amount: amount, status: 'completed', created_at: new Date().toISOString()
        });

        if (!metricsMap.has(month)) {
            metricsMap.set(month, { month, revenue: 0, expenses: 0, mrr: 0, active_clients: 0, new_mrr: 0, churn_mrr: 0, marketing_spend: 0 });
        }
        const metric = metricsMap.get(month)!;

        if (type === 'saida') {
            const costType = getCategoryType(item.historico, item.DepesasReceitas);
            const cleanCategory = getCorrectCategoryName(item.historico, item.DepesasReceitas);
            const key = `${month}-${cleanCategory}`;

            if (costType === 'Fixed') {
                const current = fixedCostsMap.get(key) || { month, category: cleanCategory, amount: 0 };
                current.amount += amount;
                fixedCostsMap.set(key, current);
            } else {
                const current = variableCostsMap.get(key) || { month, category: cleanCategory, amount: 0 };
                current.amount += amount;
                variableCostsMap.set(key, current);
            }
            metric.expenses += amount;
            if (cleanCategory === 'Marketing' || cleanCategory.includes('Anúncio') || cleanCategory.includes('Tráfego') || category.toUpperCase().includes('FACEBOOK')) {
                metric.marketing_spend += amount;
            }
        } else if (type === 'entrada') {
            if (item.Tipo === 'Saldo Inicial') continue;
            metric.revenue += amount;
            const catName = getCorrectCategoryName(item.historico, item.DepesasReceitas);
            if (catName.includes('Plano') || catName.includes('CRM')) {
                const mrrContrib = calculateMRR(amount, item.historico);
                if (mrrContrib > 0) {
                    metric.mrr += mrrContrib;
                    metric.new_mrr += mrrContrib;
                    const parts = item.historico.split(' - ');
                    const clientName = parts.length > 1 ? parts[1].trim() : 'Cliente Desconhecido';
                    if (!monthlyActiveClients.has(month)) monthlyActiveClients.set(month, new Set());
                    const clientsSet = monthlyActiveClients.get(month)!;
                    if (!clientsSet.has(clientName)) {
                        clientsSet.add(clientName);
                        metric.active_clients += 1;
                        const currentNew = monthlyNewClients.get(month) || 0;
                        monthlyNewClients.set(month, currentNew + 1);
                    }
                }
            }
        }
    }

    // Insert Transactions
    if (transactionsInsert.length > 0) {
        const { error } = await supabase.from('transactions').insert(transactionsInsert);
        if (error) console.error('Error inserting transactions:', error);
        else console.log(`Inserted ${transactionsInsert.length} transactions.`);
    }

    // Insert Costs
    const fixedCostsInsert = Array.from(fixedCostsMap.values()).map(c => ({
        month: c.month, category: c.category, actual: c.amount, budgeted: 0, created_at: new Date().toISOString()
    }));
    if (fixedCostsInsert.length > 0) {
        await supabase.from('fixed_costs').insert(fixedCostsInsert);
        console.log(`Inserted ${fixedCostsInsert.length} fixed cost records.`);
    }
    const variableCostsInsert = Array.from(variableCostsMap.values()).map(c => ({
        month: c.month, category: c.category, amount: c.amount, created_at: new Date().toISOString()
    }));
    if (variableCostsInsert.length > 0) {
        await supabase.from('variable_costs').insert(variableCostsInsert);
        console.log(`Inserted ${variableCostsInsert.length} variable cost records.`);
    }

    // Insert Metrics
    const financialMetricsInsert = Array.from(metricsMap.values()).map(m => {
        const newClients = monthlyNewClients.get(m.month) || 0;
        const cac = newClients > 0 ? (m.marketing_spend / newClients) : 0;
        const churn_rate = 0;
        // Check for calculated cac/ltv support in schema if needed
        return {
            month: m.month, revenue: m.revenue, expenses: m.expenses, mrr: m.mrr, arr: m.mrr * 12, new_mrr: m.new_mrr, churn_rate: churn_rate,
            created_at: new Date().toISOString()
        };
    });
    if (financialMetricsInsert.length > 0) {
        const { error } = await supabase.from('financial_metrics').insert(financialMetricsInsert);
        if (error) console.error('Error inserting financial metrics:', error);
        else console.log(`Inserted ${financialMetricsInsert.length} financial metric records.`);
    }

    // Insert Marketing Stats
    const marketingStatsInsert = Array.from(metricsMap.values()).map(m => {
        return {
            month: m.month, customers: m.active_clients, visitors: 0, leads: 0, opportunities: 0, created_at: new Date().toISOString()
        };
    });
    if (marketingStatsInsert.length > 0) {
        await supabase.from('marketing_stats').insert(marketingStatsInsert);
        console.log(`Inserted ${marketingStatsInsert.length} marketing stats records.`);
    }

    // 5. Insert Invoices (linked to Clients)
    // clientNameIdMap is populated in Step 3
    const invoicesInsert = [];
    for (const item of rawData) {
        if (item.Tipo === 'Recebido' && (item.DepesasReceitas.includes('Plano') || item.DepesasReceitas.includes('CRM'))) {
            const parts = item.historico.split(' - ');
            if (parts.length > 1) {
                const name = parts[1].trim();
                const clientId = clientNameIdMap.get(name.toUpperCase());
                if (clientId) {
                    invoicesInsert.push({
                        client_id: clientId, value: item.Valor, due_date: item.DtBaixa, paid_date: item.DtBaixa, status: 'paid', created_at: new Date().toISOString()
                    });
                }
            }
        }
    }
    if (invoicesInsert.length > 0) {
        const { error } = await supabase.from('invoices').insert(invoicesInsert);
        if (error) console.error('Error inserting invoices:', error);
        else console.log(`Inserted ${invoicesInsert.length} invoice records.`);
    }

}

distributeData();
