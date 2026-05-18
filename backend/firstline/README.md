# FirstLine internal backend

Backend Flask isolado para acoplar o backoffice interno ao projeto atual sem mexer no frontend financeiro.

## Rotas iniciais

- `GET /internal/health`
- `POST /internal/auth/login`
- `POST /internal/auth/logout`
- `GET /internal/auth/me`
- `GET /internal/companies`
- `GET /internal/users`
- `GET /internal/plans`
- `GET /internal/alerts`
- `GET /internal/audit-log`

Nesta primeira fase, somente autenticação interna e health usam tabelas reais. As rotas de empresas/usuários/planos estão estabilizadas como placeholders até o schema FirstLine ser mapeado para o banco atual.

## Banco

A migration mínima está em `migrations/001_internal_backoffice.sql` e cria apenas:

- `internal_users`
- `backoffice_audit_log`

Não restaura o dump antigo e não altera tabelas financeiras do ERP.

## Ambiente

Copie `.env.example` para `.env` no servidor e defina a `SUPABASE_SERVICE_ROLE_KEY` fora do Git.
