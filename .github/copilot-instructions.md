## Quick orientation for AI coding agents

This file captures the minimal, actionable knowledge an AI assistant needs to be productive in this repository.

### Project snapshot
- Tech: Vite + React + TypeScript + Tailwind + shadcn-ui
- Entry: `src/main.tsx` -> `src/App.tsx`
- dev server: `npm run dev` (Vite on port 8080, host `::`)
- Important alias: `@` -> `src` (see `vite.config.ts`)

### Key scripts (from `package.json`)
- `dev` -> `vite` (development server)
- `build` -> `vite build`
- `build:dev` -> `vite build --mode development`
- `preview` -> `vite preview`
- `lint` -> `eslint .`
- `test` -> `vitest run`
- `test:watch` -> `vitest`

When suggesting changes or edits, prefer the `dev` workflow for fast iteration. Run tests with `npm run test` after substantive logic changes.

### Where to look (high-value files & folders)
- `src/services/ai.ts` — central AI integration with Google Generative AI (Gemini). This file defines the function declarations the model can call (`update_transaction_data`, `query_transaction_data`) and shows how function-call results are handled.
- `src/integrations/supabase` — Supabase client and DB access used by the AI tools; review before suggesting DB schema changes.
- `src/hooks` — many domain hooks (clients, transactions, invoices, GRE, etc.); follow these patterns when adding data-fetching logic.
- `src/components` & `src/pages` — UI components and route pages; follow `shadcn`-style composition and tailwind classes.
- `supabase/` — infra: `config.toml`, `seed.sql` and serverless functions; changes here may require DB migrations and careful review.

### AI integration patterns you must follow (derived from `src/services/ai.ts`)
- The code uses `@google/generative-ai` and initializes a model with `tools` that include two function declarations:
  - `update_transaction_data` — updates rows in `invoices`, `fixed_costs`, `variable_costs`, or `transactions`.
  - `query_transaction_data` — reads rows with optional filters, text search (`ilike`) and date ranges.
- Environment variable: `VITE_GEMINI_API_KEY` is required to call Gemini. If missing, `generateFinancialResponse` returns an explicit error string.
- The AI session lifecycle: `model.startChat()` -> `chat.sendMessage(prompt)` -> handle `response.functionCalls` loop -> send function responses back to the chat. Match this pattern if you add other tools.

### DB access notes (what actual code does)
- `update_transaction_data` builds queries against Supabase using `.update(...)` and appends filters via `.eq(...)` or `.ilike(...)` for `description` fields.
- `query_transaction_data` uses `.select('*')`, optional `.eq`, `.ilike('description', '%...%')`, `.gte/.lte` for dates, then `.order('date', { ascending: false }).limit(200)` as a safety cap.
- When proposing changes that touch DB reads/writes, reference `src/services/ai.ts` and `supabase/seed.sql` for table/column names; avoid exceeding the 200-row limit unless the UI requires it.

### Personas & prompt rules (project-specific)
- The prompt in `src/services/ai.ts` instructs the assistant to act as "Sofia" (a PM persona) and to use `[BREAK]` separators and emojis. If altering prompt wording, keep persona references and tooling names consistent.
- The prompt explicitly allows the AI to call DB update tools when authorized (the code comments: "O CEO deu permissões..."). Do not assume blanket permission—mirror the repository's code by keeping any automated DB updates within the same function-call pattern.

### Conventions & patterns to preserve
- Use the `@` path alias for imports (e.g., `@/integrations/supabase/client`).
- Follow existing hook naming and data flow patterns in `src/hooks` (fetch, mutate, cache with react-query). Reuse hooks where possible instead of adding new fetch logic directly in components.
- UI follows shadcn + Tailwind utilities; prefer small presentational components and reuse existing `ui/` primitives under `src/components/ui`.

### Build / test / debug tips
- Local dev: `npm i` then `npm run dev`. Vite runs on port 8080 by default (see `vite.config.ts`).
- Tests: `npm run test` (Vitest). When changing shared logic (hooks/services), add a unit test under `src/test` mirroring existing style.
- Lint: `npm run lint` (ESLint config in repo root).

### Safety & discovery checklist for PRs
1. If you change AI tool declarations in `src/services/ai.ts`, also update any front-end UX that references those behaviors and `supabase/` seed or migrations if schema changes.
2. For DB writes, confirm there is an explicit authorization flow (mirrors the repo's comment that CEO granted permission). If unsure, mark the change as requiring human approval.
3. Keep environment variables documented (e.g., `VITE_GEMINI_API_KEY`) and do not commit secrets.

### Example snippets (how to call the AI tool safely)
- Read-only query example (match `query_transaction_data` parameters):
  - table_name: `transactions`
  - filters: `{ category: 'Venda' }`
  - date_range: `{ start_date: '2025-09-01', end_date: '2025-09-30' }`

### Where to ask questions
- For unclear domain rules (billing, contracts, churn), check `src/config/financialConfig.ts` and `src/data/templates.ts`. If domain intent is still unclear, ask the repo owner before changing database mutating logic.

---
If you want, I can tighten this into stricter guard rails (e.g., automated safety checks that block PRs that change `update_transaction_data`) — tell me how conservative you want the agent to be.
