

# Plano de Auditoria e Correcao de Funcionalidades

## Resumo da Auditoria

Apos analise detalhada de todas as 18 paginas e componentes do sistema, identifiquei **23 problemas** que precisam ser corrigidos para que o sistema funcione completamente.

---

## Erros de Build Criticos (Bloqueiam o Sistema)

### 1. CreateClientModal.tsx - Propriedade Invalida
**Arquivo:** `src/components/modals/CreateClientModal.tsx` (linha 76)
**Problema:** O campo `plan` esta sendo passado no objeto de criacao, mas nao existe no tipo `Client` do banco
**Impacto:** Erro TypeScript impede build

### 2. Dre.tsx - Desestruturacao Incorreta
**Arquivo:** `src/pages/Dre.tsx` (linha 34)
**Problema:** Codigo usa `const { metrics, isLoading } = useDashboardData()` mas o hook retorna `{ data, isLoading }`
**Impacto:** Erro TypeScript e crash na pagina DRE

### 3. Valuation.tsx - Desestruturacao Incorreta
**Arquivo:** `src/pages/Valuation.tsx` (linha 44)
**Problema:** Mesmo erro - usa `metrics` ao inves de `data`
**Impacto:** Erro TypeScript e crash na pagina Valuation

### 4. Budget.tsx - Import Duplicado
**Arquivo:** `src/pages/Budget.tsx` (linha 191)
**Problema:** Import de `Wallet` esta duplicado no final do arquivo
**Impacto:** Erro de sintaxe

---

## Problemas de Funcionalidade (Botoes/Acoes que nao funcionam)

### 5. Hook useFixedCosts - due_day inexistente
**Arquivo:** `src/hooks/useFixedCosts.ts`
**Problema:** Interface define `due_day` mas a tabela no banco nao possui essa coluna
**Impacto:** Modal de criar custo fixo pode falhar

### 6. Hook useCreateClient - Interface desalinhada
**Arquivo:** `src/hooks/useClients.ts`
**Problema:** Interface `Client` possui campos que nao existem na tabela (arr, health_score, payment_method, renewal_date)
**Impacto:** Criacao de clientes pode falhar

### 7. Hook useCreateInvoice - Campo paid_at inexistente
**Arquivo:** `src/hooks/useInvoices.ts`
**Problema:** Modal envia `paid_at` mas tabela usa `paid_date`
**Impacto:** Criacao de faturas com erro de campo

### 8. Invoice Interface - Campo description inexistente
**Arquivo:** `src/hooks/useInvoices.ts`
**Problema:** Interface define `description` mas tabela `invoices` nao possui essa coluna
**Impacto:** Criacao de faturas falha

### 9. Cashflow - Botao "Nova Transacao" nao funcional
**Arquivo:** `src/pages/Cashflow.tsx` (linha 77-80)
**Problema:** Botao nao abre modal, apenas renderiza sem acao
**Impacto:** Impossivel criar transacoes pelo UI

### 10. Budget - Botao "Novo Orcamento" nao funcional
**Arquivo:** `src/pages/Budget.tsx` (linha 93-95)
**Problema:** Botao sem modal ou acao implementada
**Impacto:** Impossivel criar orcamentos

### 11. Reports - Botoes sem funcionalidade
**Arquivo:** `src/pages/Reports.tsx` (linhas 21-23)
**Problema:** Botoes "Novo Relatorio" e "Agendar" sem implementacao
**Impacto:** Funcionalidades de relatorio nao operacionais

### 12. Settings - Botoes sem funcionalidade
**Arquivo:** `src/pages/Settings.tsx`
**Problema:** 
  - "Salvar Alteracoes" (linha 45) sem handler
  - "Convidar Usuario" (linha 54) sem modal
  - "Fazer Upgrade" (linha 111) sem acao
**Impacto:** Configuracoes nao salvam

### 13. InvoicesTable - Acoes do Dropdown sem implementacao
**Arquivo:** `src/components/receivables/InvoicesTable.tsx` (linhas 79-90)
**Problema:** "Ver detalhes", "Enviar cobranca", "Registrar pagamento" sem handlers
**Impacto:** Acoes de fatura nao funcionam

### 14. Receivables - Botao "Enviar Cobrancas em Lote" sem acao
**Arquivo:** `src/pages/Receivables.tsx` (linhas 65-68)
**Problema:** Botao renderiza mas nao tem funcionalidade
**Impacto:** Feature critica de cobranca inoperante

### 15. Plans - Botao "Editar" plano sem funcionalidade
**Arquivo:** `src/pages/Plans.tsx` (linhas 172-175)
**Problema:** Botao de editar nao abre modal de edicao
**Impacto:** Impossivel editar planos existentes

### 16. Clients - Botao MoreHorizontal sem menu
**Arquivo:** `src/pages/Clients.tsx` (linha 220)
**Problema:** Botao de acoes do cliente nao abre dropdown
**Impacto:** Impossivel editar/excluir clientes

---

## Problemas de RLS (Dados nao salvam/carregam)

### 17. Tabela plans - Sem INSERT/UPDATE/DELETE
**Problema:** RLS bloqueia escrita na tabela de planos
**Impacto:** Modal "Novo Plano" vai falhar ao salvar

### 18. Tabela marketing_stats - Sem INSERT/UPDATE/DELETE
**Problema:** RLS bloqueia escrita
**Impacto:** Impossivel adicionar dados de marketing

### 19. Tabela budget - Sem INSERT/UPDATE/DELETE
**Problema:** RLS bloqueia escrita
**Impacto:** Impossivel criar orcamentos mesmo com modal

### 20. Tabela transactions - Sem INSERT/UPDATE/DELETE
**Problema:** RLS bloqueia escrita
**Impacto:** Impossivel criar transacoes mesmo com modal

---

## Problemas de UI/UX

### 21. DRE/Valuation - Tabs nao funcionais
**Arquivo:** `src/pages/Dre.tsx` (linhas 140-144)
**Problema:** Tabs Mensal/Trimestral/Anual nao alteram dados exibidos
**Impacto:** Funcionalidade de periodo inoperante

### 22. Marketing - Dados mockados estaticos
**Arquivo:** `src/pages/Marketing.tsx` (linhas 28-49)
**Problema:** Dados de canal e campanha sao estaticos, nao vem do banco
**Impacto:** Dados nao refletem realidade

### 23. Clients Table - Colunas faltando no banco
**Arquivo:** `src/pages/Clients.tsx`
**Problema:** Exibe `health_score`, `payment_method`, `renewal_date`, `arr` que nao existem na tabela
**Impacto:** Colunas vazias ou erros

---

## Plano de Correcao

### Fase 1: Corrigir Erros de Build (Prioritario)
1. Remover `plan: null` do CreateClientModal
2. Alterar `metrics` para `data` em Dre.tsx e Valuation.tsx
3. Remover import duplicado em Budget.tsx

### Fase 2: Alinhar Interfaces com Banco de Dados
1. Atualizar interface `Client` removendo campos inexistentes
2. Atualizar interface `FixedCost` removendo `due_day`
3. Atualizar interface `Invoice` - `paid_at` para `paid_date`, remover `description`

### Fase 3: Corrigir RLS Policies
Adicionar policies de INSERT/UPDATE/DELETE para:
- `plans`
- `marketing_stats`
- `budget`
- `transactions`

### Fase 4: Implementar Funcionalidades Faltantes
1. Criar `CreateTransactionModal` para Cashflow
2. Criar `CreateBudgetModal` para Budget
3. Adicionar handlers aos DropdownMenuItems em InvoicesTable
4. Implementar logica dos botoes em Settings
5. Criar modal de edicao de planos
6. Adicionar Dropdown ao botao de acoes em Clients

### Fase 5: Melhorias de Dados
1. Remover colunas inexistentes da tabela de clientes
2. Adicionar colunas faltantes ao banco OU remover da interface

---

## Detalhes Tecnicos

### Arquivos a Modificar

```text
src/components/modals/CreateClientModal.tsx
src/pages/Dre.tsx
src/pages/Valuation.tsx
src/pages/Budget.tsx
src/hooks/useClients.ts
src/hooks/useFixedCosts.ts
src/hooks/useInvoices.ts
src/pages/Clients.tsx
src/pages/Cashflow.tsx
src/pages/Settings.tsx
src/pages/Reports.tsx
src/pages/Plans.tsx
src/components/receivables/InvoicesTable.tsx
```

### Novos Componentes a Criar

```text
src/components/modals/CreateTransactionModal.tsx
src/components/modals/CreateBudgetModal.tsx
src/components/modals/EditPlanModal.tsx
src/components/modals/EditClientModal.tsx
```

### Migracao de Banco Necessaria

```sql
-- Adicionar policies de escrita
CREATE POLICY "Allow public write" ON public.plans FOR ALL USING (true);
CREATE POLICY "Allow public write" ON public.marketing_stats FOR ALL USING (true);
CREATE POLICY "Allow public write" ON public.budget FOR ALL USING (true);
CREATE POLICY "Allow public write" ON public.transactions FOR ALL USING (true);
```

---

## Ordem de Execucao Recomendada

1. **Corrigir erros de build** - Sistema nao funciona sem isso
2. **Corrigir RLS policies** - Dados nao salvam sem isso
3. **Alinhar interfaces** - Evita erros futuros
4. **Implementar modais faltantes** - Completa funcionalidades CRUD
5. **Adicionar handlers aos botoes** - Torna o sistema utilizavel
6. **Remover/ajustar colunas da UI** - Polish final

Esta auditoria cobre todos os problemas identificados. Ao aprovar, implementarei as correcoes na ordem especificada para garantir que o sistema funcione de ponta a ponta.
