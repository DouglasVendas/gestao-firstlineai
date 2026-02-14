
export const TEMPLATE_ACORDO_SOCIOS = `
<h1>Memorando de Entendimentos entre Sócios (MoU)</h1>
<p><strong>Objetivo:</strong> Definir as regras do jogo entre os fundadores para evitar conflitos futuros e garantir a perenidade do negócio.</p>

<h2>1. Papéis e Dedicação</h2>
<ul>
    <li><strong>Sócio A (Nome):</strong> Responsável por [Ex: Produto e Tecnologia]. Dedicação: [Ex: Integral].</li>
    <li><strong>Sócio B (Nome):</strong> Responsável por [Ex: Vendas e Marketing]. Dedicação: [Ex: Integral].</li>
    <li><strong>Sócio C (Nome):</strong> Responsável por [Ex: Operações e Financeiro]. Dedicação: [Ex: Parcial - 20h/semana].</li>
</ul>

<h2>2. Vesting (Regra de Maturação)</h2>
<p>As quotas dos sócios não são entregues imediatamente. Elas são conquistadas ao longo do tempo (Vesting) para garantir o compromisso de longo prazo.</p>
<ul>
    <li><strong>Cliff (Carência):</strong> 12 meses. Se sair antes, sai com 0%.</li>
    <li><strong>Período Total:</strong> 48 meses (4 anos).</li>
    <li><strong>Aceleração:</strong> Em caso de venda total da empresa (Exit), o vesting acelera 100%.</li>
</ul>

<h2>3. Tomada de Decisão</h2>
<ul>
    <li><strong>Decisões do Dia a Dia:</strong> Cada sócio tem autonomia total em sua área.</li>
    <li><strong>Decisões Estratégicas (Pivot, Investimento > R$ 50k, Contratação C-Level):</strong> Requer maioria simples (50% + 1) ou Unanimidade? [Definir].</li>
</ul>

<h2>4. Saída de Sócios (Good Leaver vs. Bad Leaver)</h2>
<ul>
    <li><strong>Good Leaver (Saiu por bom motivo/acordo):</strong> A empresa recompra as ações já vestadas pelo valor de mercado (Valuation).</li>
    <li><strong>Bad Leaver (Saiu por justa causa/conflito/concorrência):</strong> A empresa recompra as ações pelo valor nominal (simbólico) ou com desconto agressivo (ex: 50% do Valuation).</li>
</ul>

<h2>5. Remuneração (Pró-Labore) e Distribuição de Lucas</h2>
<p>O Pró-labore deve ser compatível com o caixa da empresa, não com o valor de mercado do profissional.</p>
<ul>
    <li><strong>Pró-labore Inicial:</strong> R$ [Valor] para dedicação integral.</li>
    <li><strong>Distribuição de Lucros:</strong> Trimestral, mantendo sempre [Ex: 3 meses] de caixa operacional na empresa.</li>
</ul>
<hr>
<p><em>Este documento serve como base para a elaboração do Contrato Social e Acordo de Acionistas definitivo com um advogado.</em></p>
`;

export const TEMPLATE_ORGANOGRAMA = `
<h1>Organograma Funcional & Job Descriptions</h1>
<p><strong>Objetivo:</strong> Clarificar quem faz o que, evitando zonas cinzentas onde "cachorro com dois donos morre de fome".</p>

<h2>1. O CEO (Chief Executive Officer)</h2>
<p><strong>Missão:</strong> Garantir que a empresa tenha dinheiro no caixa e as pessoas certas nas cadeiras certas.</p>
<ul>
    <li><strong>Responsabilidades:</strong> Visão estratégica, Cultura, Fundraising, Relação com Investidores.</li>
    <li><strong>KPIs:</strong> Runway (Meses de Caixa), Receita Total, eNPS (Satisfação do Time).</li>
</ul>

<h2>2. O Head de Vendas (CSO/CRO)</h2>
<p><strong>Missão:</strong> Trazer receita nova de forma previsível.</p>
<ul>
    <li><strong>Responsabilidades:</strong> Gestão do time de vendas, Otimização do Funil, Parcerias.</li>
    <li><strong>KPIs:</strong> MRR Novo, CAC (Custo de Aquisição), Taxa de Conversão.</li>
</ul>

<h2>3. O Head de Produto/Tecnologia (CTO/CPO)</h2>
<p><strong>Missão:</strong> Entregar valor para o cliente através da tecnologia.</p>
<ul>
    <li><strong>Responsabilidades:</strong> Roadmap de produto, Estabilidade da plataforma, Gestão dos Devs.</li>
    <li><strong>KPIs:</strong> Churn (por produto), NPS (Satisfação do Cliente), Uptime.</li>
</ul>

<h2>4. O Head de Customer Success (CCO)</h2>
<p><strong>Missão:</strong> Garantir que o cliente tenha sucesso e continue pagando.</p>
<ul>
    <li><strong>Responsabilidades:</strong> Onboarding, Suporte, Expansão de conta (Upsell).</li>
    <li><strong>KPIs:</strong> Churn Rate, LTV (Lifetime Value), Tempo de Primeira Resposta.</li>
</ul>
`;

export const TEMPLATE_PLAYBOOK_VENDAS = `
<h1>Playbook de Vendas V1.0</h1>
<p><strong>Objetivo:</strong> Padronizar o processo comercial para que qualquer novo vendedor consiga performar.</p>

<h2>1. Perfil do Cliente Ideal (ICP)</h2>
<ul>
    <li><strong>Quem é:</strong> [Ex: Donos de PMEs de Serviços].</li>
    <li><strong>Dores:</strong> [Ex: Falta de controle financeiro, mistura PJ/PF].</li>
    <li><strong>Sonhos:</strong> [Ex: Ter previsibilidade, sobrar dinheiro no fim do mês].</li>
</ul>

<h2>2. Processo de Vendas (Funil)</h2>
<h3>Etapa 1: Prospecção / Conexão</h3>
<p>Objetivo: Agendar uma reunião de qualificação.</p>
<blockquote>"Olá [Nome], vi que você atua no mercado de [X]. A maioria das empresas desse setor sofre com [Dor]. Isso faz sentido pra você?"</blockquote>

<h3>Etapa 2: Diagnóstico (Spin Selling)</h3>
<p>Objetivo: Entender se o cliente tem a dor que resolvemos.</p>
<ul>
    <li><strong>Situação:</strong> "Como você controla seu fluxo de caixa hoje?"</li>
    <li><strong>Problema:</strong> "E quando o cliente atrasa, como você descobre?"</li>
    <li><strong>Implicação:</strong> "Quanto de dinheiro você acha que perde por ano por não ver esses furos?"</li>
    <li><strong>Necessidade:</strong> "Se eu te mostrasse uma forma de automatizar isso, você teria 15 min?"</li>
</ul>

<h3>Etapa 3: Apresentação da Solução</h3>
<p>Não venda funcionalidades, venda a transformação.</p>
<p><em>Errado:</em> "Nosso sistema tem conciliação bancária automática com API v2."</p>
<p><em>Certo:</em> "Você nunca mais vai precisar abrir o site do banco pra conferir pagamento. O sistema te avisa no WhatsApp quem pagou."</p>

<h3>Etapa 4: Fechamento & Objeções</h3>
<ul>
    <li><strong>"Está caro":</strong> "Caro comparado a quê? Quanto custa sua hora cobrando cliente inadimplente?"</li>
    <li><strong>"Vou pensar":</strong> "O que falta para você tomar a decisão agora? O problema financeiro vai continuar existindo amanhã."</li>
</ul>
`;

export const TEMPLATE_CODIGO_CULTURA = `
<h1>Código de Cultura (Culture Code)</h1>
<p><strong>Objetivo:</strong> Definir o que é inegociável aqui dentro. "Cultura é o que acontece quando o chefe não está na sala".</p>

<h2>Nossos Valores</h2>

<h3>1. Customer Obsession (Obsessão pelo Cliente)</h3>
<p>Nós não trabalhamos para os investidores, trabalhamos para os clientes. Se o cliente tiver sucesso, nós teremos sucesso.</p>

<h3>2. Extreme Ownership (Responsabilidade Extrema)</h3>
<p>Não existe "não é minha função". Se você viu um problema, você é dono dele até que esteja resolvido ou encaminhado.</p>

<h3>3. Brutal Honesty (Honestidade Brutal)</h3>
<p>Preferimos uma verdade dura do que uma mentira confortável. Feedback deve ser rápido, direto e respeitoso.</p>

<h3>4. Frugalidade</h3>
<p>Tratamos o dinheiro da empresa como se fosse o nosso. Fazemos mais com menos.</p>
`;

export const TEMPLATE_PROPOSTA = `
<h1>Modelo de Proposta Comercial</h1>

<h2>1. Resumo Executivo</h2>
<p>A presente proposta visa soluciona [Problema identificado no diagnóstico] através da implementação da solução [Nome da Solução].</p>

<h2>2. Escopo do Trabalho</h2>
<ul>
    <li><strong>Incluso:</strong> Acesso à plataforma, Treinamento inicial (2h), Suporte via Chat.</li>
    <li><strong>Não Incluso:</strong> Migração de dados legados, Desenvolvimento customizado.</li>
</ul>

<h2>3. Cronograma de Implantação</h2>
<ul>
    <li><strong>Semana 1:</strong> Setup e Configuração.</li>
    <li><strong>Semana 2:</strong> Treinamento da Equipe.</li>
    <li><strong>Semana 3:</strong> Virada de Chave (Go-Live).</li>
</ul>

<h2>4. Investimento</h2>
<h3>Taxa de Implantação (Setup)</h3>
<p>De: <del>R$ 5.000,00</del></p>
<p>Por: <strong>R$ 2.500,00</strong> (Condição válida até [Data])</p>

<h3>Mensalidade (SaaS)</h3>
<p><strong>R$ 499,00 / mês</strong> (Plano Pro)</p>

<h2>5. Termos e Condições</h2>
<ul>
    <li>Pagamento via Boleto ou Cartão de Crédito.</li>
    <li>Contrato de 12 meses com fidelidade (multa de 30% do saldo restante em caso de cancelamento).</li>
    <li>Reajuste anual pelo IGPM.</li>
</ul>
`;
