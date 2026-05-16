# Client Subscriptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Model customer contracts as multiple product subscriptions with product-specific plans and CRM add-ons.

**Architecture:** Keep `clients.mrr` as a compatibility field for current dashboards while introducing normalized subscription tables as the professional source for contracted products. Create/edit customer flows write the normalized rows and synchronize the legacy `clients.mrr` and `clients.products` fields.

**Tech Stack:** Supabase/Postgres, React, React Hook Form, TanStack Query, TypeScript.

---

### Task 1: Subscription Schema

**Files:**
- Create: `supabase/migrations/20260513002000_client_subscriptions.sql`

- [x] Create `products`, `product_plans`, `client_subscriptions`, and `client_subscription_addons`.
- [x] Seed `Auditoria` and `CRM`.
- [x] Seed audit legacy plans through `2026-04-30`, audit new plans from `2026-05-01`, and CRM `Starter`.
- [x] Add RLS policies tied to `users_organizations` through the related client.
- [x] Apply the migration locally with Docker/Postgres.

### Task 2: Subscription Data Layer

**Files:**
- Create: `src/hooks/useClientSubscriptions.ts`
- Modify: `src/hooks/useClients.ts`
- Modify: `src/hooks/useUpdateClient.ts`
- Modify: `src/contexts/FinancialContext.tsx`

- [x] Add catalog and subscription hooks.
- [x] Add MRR calculation helpers.
- [x] Save subscription rows and add-ons transactionally enough for local UI flows.
- [x] Synchronize `clients.mrr` and `clients.products` when subscriptions are provided.
- [x] Fetch normalized subscriptions alongside clients.

### Task 3: Customer Forms

**Files:**
- Create: `src/components/clients/ClientSubscriptionsForm.tsx`
- Modify: `src/components/modals/CreateClientModal.tsx`
- Modify: `src/components/modals/EditClientModal.tsx`
- Modify: `src/pages/Clients.tsx`

- [x] Replace checkbox-only products in create customer with a product subscription editor.
- [x] Support CRM add-ons for extra users and extra channels.
- [x] Show calculated MRR from selected subscriptions.
- [x] Preserve legacy manual MRR for existing customers without subscriptions.
- [x] Show normalized product/plan labels in the clients table when available.

### Task 4: Verification

**Commands:**
- `npm run test -- computeInvoices.test.ts`
- `npm run build`

- [x] Confirm database seeds exist.
- [x] Confirm focused tests pass.
- [x] Confirm production build succeeds.
