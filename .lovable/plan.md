

# Plano de Implementacao - Paginas Faltantes do Sistema SaaS

## Resumo Executivo

Este plano detalha a criacao de 14 novas funcionalidades/paginas para completar o sistema de gestao financeira SaaS B2B. A implementacao seguira os padroes ja estabelecidos no projeto, usando React, TypeScript, Tailwind CSS, Shadcn/UI e Recharts.

---

## Fase 1: Paginas de Modulos Financeiros

### 1.1 Recebimentos (`/receivables`)
- Cards de metricas: Total Faturado, Total Recebido, Em Aberto, Inadimplencia
- Tabela de faturas com status (Pago, Pendente, Atrasado, Cancelado)
- Aging List visual (0-30, 31-60, 61-90, 90+ dias)
- Grafico de adimplencia mensal
- Acoes: Gerar fatura, Enviar cobranca, Registrar pagamento

### 1.2 Custos Variaveis (`/variable-costs`)
- Cards: Total Custos Variaveis, Margem Contribuicao, Custo por Cliente
- Tabela de fornecedores/APIs (Anthropic, OpenAI, Cloud, Gateway)
- Grafico de consumo por categoria
- Drill-down: custo por cliente
- Alertas de consumo anomalo

### 1.3 Custos Fixos (`/fixed-costs`)
- Cards: Total Custos Fixos, Pessoal, Infra, Operacional
- Categorias expansiveis (Pessoal, Infraestrutura, Operacional, Servicos, Marketing, Impostos)
- Calendario de vencimentos
- Comparativo orcado vs realizado
- Historico de provisionamento

---

## Fase 2: Paginas de Analytics

### 2.1 Churn e Retencao (`/churn`)
- Cards: Churn Rate (Clientes), Churn Rate (Receita), NRR, GRR
- Grafico de evolucao do churn
- Tabela de cancelamentos com motivos
- Analise por cohort
- Dashboard de clientes em risco com health score

### 2.2 LTV e CAC (`/ltv-cac`)
- Cards: LTV, CAC, LTV:CAC Ratio, Payback Period
- Grafico LTV vs CAC ao longo do tempo
- Breakdown por plano e por canal de aquisicao
- Componentes do CAC (Marketing, Vendas)
- Simulador de cenarios ("E se...")

### 2.3 Marketing e Funil (`/marketing`)
- Cards: Total Leads, CPL, Taxa Conversao, ROI
- Funil visual com etapas (Visitante -> Lead -> MQL -> SQL -> Oportunidade -> Cliente)
- Performance por canal (Google Ads, LinkedIn, Organico, Indicacao)
- Grafico de ROI por campanha
- Pipeline de vendas com valor potencial

---

## Fase 3: Paginas Financeiras Avancadas

### 3.1 DRE (`/dre`)
- Estrutura completa do DRE:
  - Receita Bruta
  - Deducoes
  - Receita Liquida
  - Custos Variaveis
  - Margem de Contribuicao
  - Custos Fixos
  - EBITDA
  - Resultado Liquido
- Toggle: Mensal / Trimestral / Anual
- Comparativo: Realizado vs Orcado
- Analise vertical e horizontal
- Export PDF/Excel

### 3.2 Fluxo de Caixa (`/cashflow`)
- Cards: Saldo Atual, Entradas (30d), Saidas (30d), Runway
- Grafico de evolucao do saldo
- Tabela de movimentacoes (Entradas/Saidas)
- Projecao futura (3, 6, 12 meses)
- Indicador de Burn Rate

### 3.3 Valuation (`/valuation`)
- Calculadora interativa com multiplos metodos:
  - Multiplos de Receita (ARR x Multiplo)
  - DCF (Fluxo de Caixa Descontado)
  - Scorecard
- Inputs editaveis (Taxa crescimento, Margem, Multiplo, WACC)
- Analise de sensibilidade com matriz
- Cenarios: Conservador, Base, Otimista
- Grafico waterfall de fatores de valuation

---

## Fase 4: Planejamento e Configuracoes

### 4.1 Orcamento (`/budget`)
- Cards: Orcamento Anual, Realizado, Variacao, Forecast
- Tabela de metas mensais por categoria
- Grafico comparativo orcado vs realizado
- Planejamento de cenarios
- OKRs e tracking de metas

### 4.2 Relatorios (`/reports`)
- Lista de relatorios disponiveis
- Construtor de relatorios simplificado
- Templates pre-definidos (Executivo, Financeiro, Vendas, Marketing)
- Agendamento de envio
- Historico de relatorios gerados

### 4.3 Configuracoes (`/settings`)
- Abas: Geral, Empresa, Usuarios, Integrações, Notificacoes
- Configuracoes de empresa (nome, CNPJ, logo)
- Gestao de usuarios e permissoes
- Integrações (Gateways, Cloud, Contabilidade)
- Preferencias de notificacao
- Planos e billing

---

## Fase 5: Componentes de UI/UX

### 5.1 Icone de Notificacoes
- Dropdown com lista de notificacoes
- Tipos: Alerta, Info, Sucesso
- Badge com contador de nao lidas
- Acoes: Marcar como lida, Ver todas

### 5.2 Perfil do Usuario
- Dropdown com:
  - Foto e nome do usuario
  - Link para perfil
  - Link para configuracoes
  - Trocar conta/workspace
  - Logout
- Avatar com iniciais/foto

---

## Estrutura de Arquivos a Criar

```text
src/pages/
  - Receivables.tsx
  - VariableCosts.tsx
  - FixedCosts.tsx
  - Churn.tsx
  - LtvCac.tsx
  - Marketing.tsx
  - Dre.tsx
  - Cashflow.tsx
  - Valuation.tsx
  - Budget.tsx
  - Reports.tsx
  - Settings.tsx

src/components/
  - header/
    - NotificationsDropdown.tsx
    - UserDropdown.tsx
  - receivables/
    - AgingList.tsx
    - InvoicesTable.tsx
  - costs/
    - CostCategoryCard.tsx
    - CostBreakdownChart.tsx
  - churn/
    - ChurnAnalysisChart.tsx
    - CohortTable.tsx
    - AtRiskClients.tsx
  - ltv-cac/
    - LTVBreakdown.tsx
    - CACBreakdown.tsx
    - Simulator.tsx
  - marketing/
    - FunnelChart.tsx
    - ChannelPerformance.tsx
  - dre/
    - DRETable.tsx
    - DREChart.tsx
  - cashflow/
    - CashflowProjection.tsx
    - TransactionsTable.tsx
  - valuation/
    - ValuationCalculator.tsx
    - SensitivityMatrix.tsx
    - ScenarioComparison.tsx
  - budget/
    - BudgetTable.tsx
    - OKRTracker.tsx
```

---

## Atualizacoes Necessarias

### App.tsx - Novas Rotas
Adicionar rotas para todas as 12 novas paginas no roteador

### AppLayout.tsx - Header
Integrar NotificationsDropdown e UserDropdown no header

---

## Detalhes Tecnicos

### Padroes a Seguir
- Usar `AppLayout` como wrapper de todas as paginas
- Usar `MetricCard` para cards de metricas
- Usar Recharts para todos os graficos (AreaChart, BarChart, LineChart, PieChart, ComposedChart)
- Usar classe `.metric-card` para containers
- Usar classe `.data-table` para tabelas
- Manter paleta de cores: primary (cyan), success (green), warning (orange), destructive (red)

### Dados
- Todos os dados serao mockados inicialmente
- Estrutura preparada para integracao futura com backend/Supabase

### Componentes Reutilizaveis
- Formatadores de moeda (`formatCurrency`)
- Formatadores de data (`formatDate`)
- Badges de status
- Tooltips customizados para graficos

---

## Ordem de Implementacao Sugerida

1. **Batch 1 - UI Components**: NotificationsDropdown, UserDropdown
2. **Batch 2 - Financeiro Basico**: Receivables, VariableCosts, FixedCosts
3. **Batch 3 - Analytics**: Churn, LtvCac, Marketing
4. **Batch 4 - Financeiro Avancado**: DRE, Cashflow, Valuation
5. **Batch 5 - Planejamento**: Budget, Reports, Settings

Cada batch pode ser implementado em sequencia, com testes de navegacao e verificacao visual apos cada um.

