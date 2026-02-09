
# Implementacao das Funcionalidades Restantes

## Visao Geral

Implementar todos os botoes e acoes pendentes: handlers na tabela de faturas, modal de edicao de planos, modal de edicao de clientes com dropdown de acoes, e corrigir o modal de criacao de faturas.

---

## 1. Corrigir CreateInvoiceModal - Campo `paid_at` para `paid_date`

**Arquivo:** `src/components/modals/CreateInvoiceModal.tsx`
- Linha 63: trocar `paid_at` por `paid_date`
- Remover campo `description` do formulario (nao existe na tabela `invoices`)
- Remover `description` do schema Zod

---

## 2. Criar hook `useUpdateInvoice`

**Novo arquivo:** `src/hooks/useUpdateInvoice.ts`
- Mutation para atualizar status e `paid_date` de uma fatura
- Invalidar query `["invoices"]` no sucesso

---

## 3. Criar hook `useUpdatePlan`

**Novo arquivo:** `src/hooks/useUpdatePlan.ts`
- Mutation para atualizar campos de um plano (name, price_monthly, price_yearly, description, features, limits)
- Invalidar query `["plans"]` no sucesso

---

## 4. Criar hook `useUpdateClient`

**Novo arquivo:** `src/hooks/useUpdateClient.ts`
- Mutation para atualizar campos do cliente (name, email, status, mrr, plan_id, churn_date, churn_reason)
- Mutation para deletar cliente
- Invalidar queries `["clients"]` no sucesso

---

## 5. Criar `InvoiceDetailsModal`

**Novo arquivo:** `src/components/modals/InvoiceDetailsModal.tsx`
- Dialog mostrando todos os dados da fatura: ID, cliente, valor, vencimento, status, data de pagamento
- Recebe `Invoice` como prop e `open`/`onOpenChange`

---

## 6. Criar `RegisterPaymentModal`

**Novo arquivo:** `src/components/modals/RegisterPaymentModal.tsx`
- Dialog com campo de data de pagamento (default: hoje)
- Usa `useUpdateInvoice` para atualizar status para "paid" e `paid_date`
- Recebe invoice id como prop

---

## 7. Atualizar `InvoicesTable` com handlers

**Arquivo:** `src/components/receivables/InvoicesTable.tsx`
- Adicionar state para controlar modais (selectedInvoice, detailsOpen, paymentOpen)
- "Ver detalhes" abre `InvoiceDetailsModal`
- "Registrar pagamento" abre `RegisterPaymentModal`
- "Enviar cobranca" exibe toast informativo (simulado)

---

## 8. Criar `EditPlanModal`

**Novo arquivo:** `src/components/modals/EditPlanModal.tsx`
- Dialog com formulario pre-preenchido com dados do plano
- Campos: nome, descricao, preco mensal, preco anual, features
- Usa `useUpdatePlan` para salvar alteracoes

---

## 9. Atualizar `Plans.tsx` com botao Editar funcional

**Arquivo:** `src/pages/Plans.tsx`
- Adicionar state para plano selecionado e modal aberto
- Botao "Editar" abre `EditPlanModal` com dados do plano

---

## 10. Criar `EditClientModal`

**Novo arquivo:** `src/components/modals/EditClientModal.tsx`
- Dialog com formulario pre-preenchido (nome, email, MRR, status, plano)
- Usa `useUpdateClient` para salvar
- Select de planos usando `usePlans`

---

## 11. Atualizar `Clients.tsx` com dropdown de acoes

**Arquivo:** `src/pages/Clients.tsx`
- Trocar botao `MoreHorizontal` por `DropdownMenu` com opcoes:
  - "Editar" abre `EditClientModal`
  - "Cancelar assinatura" atualiza status para "churned"
  - "Excluir" com confirmacao via `AlertDialog`

---

## Resumo de Arquivos

### Novos (7 arquivos)
- `src/hooks/useUpdateInvoice.ts`
- `src/hooks/useUpdatePlan.ts`
- `src/hooks/useUpdateClient.ts`
- `src/components/modals/InvoiceDetailsModal.tsx`
- `src/components/modals/RegisterPaymentModal.tsx`
- `src/components/modals/EditPlanModal.tsx`
- `src/components/modals/EditClientModal.tsx`

### Modificados (4 arquivos)
- `src/components/modals/CreateInvoiceModal.tsx` - corrigir paid_at e remover description
- `src/components/receivables/InvoicesTable.tsx` - adicionar handlers e modais
- `src/pages/Plans.tsx` - integrar EditPlanModal
- `src/pages/Clients.tsx` - adicionar dropdown com acoes
