from __future__ import annotations

import os
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from functools import wraps
from typing import Any
from urllib.parse import quote
from uuid import UUID

import bcrypt
import jwt
import requests
from dotenv import load_dotenv
from flask import Flask, g, jsonify, make_response, request
from flask_cors import CORS
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.pool import QueuePool

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

COOKIE_NAME = 'firstline_internal_session'
_FIRSTLINE_ENGINE: Engine | None = None


def json_safe(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, list):
        return [json_safe(item) for item in value]
    if isinstance(value, dict):
        return {key: json_safe(item) for key, item in value.items()}
    return value


def rows_to_dicts(rows: Any) -> list[dict[str, Any]]:
    return [json_safe(dict(row)) for row in rows]


class SupabaseRest:
    def __init__(self) -> None:
        self.url = (os.getenv('SUPABASE_URL') or os.getenv('VITE_SUPABASE_URL') or '').rstrip('/')
        self.key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SECRET_KEY') or ''
        self.anon_key = os.getenv('SUPABASE_ANON_KEY') or os.getenv('VITE_SUPABASE_PUBLISHABLE_KEY') or ''
        if not self.url or not self.key:
            raise RuntimeError('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')

    def _headers(self, extra: dict[str, str] | None = None) -> dict[str, str]:
        return {
            'apikey': self.key,
            'Authorization': f'Bearer {self.key}',
            'Content-Type': 'application/json',
            **(extra or {}),
        }

    def request(self, method: str, path: str, **kwargs: Any) -> requests.Response:
        return requests.request(
            method,
            f'{self.url}/rest/v1/{path}',
            headers=self._headers(kwargs.pop('headers', None)),
            timeout=20,
            **kwargs,
        )

    def count(self, table: str) -> int | None:
        response = self.request('HEAD', f'{table}?select=*', headers={'Prefer': 'count=exact'})
        if response.status_code == 404:
            return None
        response.raise_for_status()
        content_range = response.headers.get('content-range', '')
        if '/' not in content_range:
            return None
        total = content_range.rsplit('/', 1)[-1]
        return None if total == '*' else int(total)

    def select_one(self, table: str, query: str) -> dict[str, Any] | None:
        response = self.request('GET', f'{table}?{query}&limit=1')
        if response.status_code == 404:
            return None
        response.raise_for_status()
        rows = response.json()
        return rows[0] if rows else None

    def authenticate_password(self, email: str, password: str) -> bool:
        if not self.anon_key:
            raise RuntimeError('SUPABASE_ANON_KEY is required for Supabase Auth login')

        response = requests.post(
            f'{self.url}/auth/v1/token?grant_type=password',
            headers={'apikey': self.anon_key, 'Content-Type': 'application/json'},
            json={'email': email, 'password': password},
            timeout=20,
        )
        return response.ok


class FirstlineDb:
    def __init__(self) -> None:
        global _FIRSTLINE_ENGINE
        db_uri = os.getenv('FIRSTLINE_DB_URI') or ''
        if not db_uri:
            raise RuntimeError('FIRSTLINE_DB_URI is required for FirstLine operational data routes')
        if _FIRSTLINE_ENGINE is None:
            _FIRSTLINE_ENGINE = create_engine(
                db_uri,
                poolclass=QueuePool,
                pool_size=5,
                max_overflow=10,
                pool_timeout=30,
                pool_pre_ping=True,
            )
        self.engine = _FIRSTLINE_ENGINE

    def count(self, table: str) -> int | None:
        with self.engine.connect() as conn:
            exists = conn.execute(
                text(
                    """
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = 'public' AND table_name = :table
                    )
                    """
                ),
                {'table': table},
            ).scalar()
            if not exists:
                return None
            return int(conn.execute(text(f'SELECT count(*) FROM public.{table}')).scalar() or 0)

    def list_companies(self, page: int, page_size: int, search: str | None = None) -> dict[str, Any]:
        offset = max(page - 1, 0) * page_size
        where = ''
        params: dict[str, Any] = {'limit': page_size, 'offset': offset}
        if search:
            where = 'WHERE c.company_name ILIKE :search OR c.cnpj ILIKE :search OR c.contact_email ILIKE :search'
            params['search'] = f'%{search}%'

        with self.engine.connect() as conn:
            total = conn.execute(text(f'SELECT count(*) FROM public.company c {where}'), params).scalar() or 0
            rows = conn.execute(
                text(
                    f"""
                    WITH company_users_agg AS (
                        SELECT uc.company_id,
                               count(*) AS users_count,
                               count(*) FILTER (WHERE u.status = 'ACTIVE') AS active_users_count
                        FROM public.user_company uc
                        JOIN public.users u ON u.id = uc.user_id
                        GROUP BY uc.company_id
                    ),
                    latest_plan AS (
                        SELECT DISTINCT ON (cs.company_id)
                               cs.company_id,
                               cs.subscription_id,
                               cs.status AS subscription_status,
                               cs.expiration_date
                        FROM public.company_subscription cs
                        WHERE cs.status = 'active'
                        ORDER BY cs.company_id, COALESCE(cs.updated_at, cs.created_at) DESC
                    )
                    SELECT c.id, c.company_name AS name, c.cnpj, c.contact_email, c.phone,
                           COALESCE(c.account_status, 'active') AS account_status,
                           c.created_at, c.updated_at,
                           c.monthly_analysis_limit,
                           c.max_active_users,
                           COALESCE(cua.users_count, 0) AS users_count,
                           COALESCE(cua.active_users_count, 0) AS active_users_count,
                           lp.subscription_status,
                           lp.expiration_date,
                           s.id AS plan_id,
                           s.name AS plan_name,
                           s.payment_type AS plan_payment_type
                    FROM public.company c
                    LEFT JOIN company_users_agg cua ON cua.company_id = c.id
                    LEFT JOIN latest_plan lp ON lp.company_id = c.id
                    LEFT JOIN public.subscription s ON s.id = lp.subscription_id
                    {where}
                    ORDER BY c.created_at DESC NULLS LAST
                    LIMIT :limit OFFSET :offset
                    """
                ),
                params,
            ).mappings().all()
        return {'items': rows_to_dicts(rows), 'pagination': {'page': page, 'page_size': page_size, 'total': int(total)}}

    def list_users(self, page: int, page_size: int, search: str | None = None, company_id: str | None = None) -> dict[str, Any]:
        offset = max(page - 1, 0) * page_size
        clauses = []
        params: dict[str, Any] = {'limit': page_size, 'offset': offset}
        if search:
            clauses.append('(u.name ILIKE :search OR u.email ILIKE :search OR c.company_name ILIKE :search)')
            params['search'] = f'%{search}%'
        if company_id:
            clauses.append('uc.company_id = :company_id')
            params['company_id'] = company_id
        where = f"WHERE {' AND '.join(clauses)}" if clauses else ''

        with self.engine.connect() as conn:
            total = conn.execute(
                text(
                    f"""
                    SELECT count(*)
                    FROM public.user_company uc
                    JOIN public.users u ON u.id = uc.user_id
                    LEFT JOIN public.company c ON c.id = uc.company_id
                    {where}
                    """
                ),
                params,
            ).scalar() or 0
            rows = conn.execute(
                text(
                    f"""
                    SELECT uc.id AS link_id,
                           uc.company_id,
                           c.company_name,
                           uc.role,
                           uc.seller_type,
                           uc.created_at AS linked_at,
                           uc.onboarding_completed_at,
                           u.id AS user_id,
                           u.name AS user_name,
                           u.email AS user_email,
                           u.phone AS user_phone,
                           u.status AS user_status,
                           u.calendar_connected,
                           u.microsoft_calendar_connected,
                           u.created_at AS user_created_at,
                           u.updated_at AS user_updated_at
                    FROM public.user_company uc
                    JOIN public.users u ON u.id = uc.user_id
                    LEFT JOIN public.company c ON c.id = uc.company_id
                    {where}
                    ORDER BY uc.created_at DESC NULLS LAST
                    LIMIT :limit OFFSET :offset
                    """
                ),
                params,
            ).mappings().all()
            summary = conn.execute(
                text(
                    """
                    SELECT
                        (SELECT count(*) FROM public.user_company) AS links_total,
                        (SELECT count(*) FROM public.user_company uc JOIN public.users u ON u.id = uc.user_id WHERE u.status = 'ACTIVE') AS links_active_users,
                        (SELECT count(*) FROM public.company) AS companies_total,
                        (SELECT count(*) FROM public.users) AS users_total
                    """
                )
            ).mappings().first()
        return {
            'items': rows_to_dicts(rows),
            'pagination': {'page': page, 'page_size': page_size, 'total': int(total)},
            'summary': json_safe(dict(summary or {})),
        }

    def list_plans(self) -> list[dict[str, Any]]:
        with self.engine.connect() as conn:
            plans_rows = conn.execute(
                text(
                    """
                    SELECT id, name, description, subscription_type, payment_type,
                           price, validity_days, status, is_default, created_at, updated_at
                    FROM public.subscription
                    ORDER BY created_at DESC NULLS LAST, name
                    """
                )
            ).mappings().all()
            counts_rows = conn.execute(
                text(
                    """
                    WITH latest_active AS (
                        SELECT DISTINCT ON (cs.company_id)
                               cs.company_id,
                               cs.subscription_id
                        FROM public.company_subscription cs
                        WHERE cs.status = 'active'
                        ORDER BY cs.company_id, COALESCE(cs.updated_at, cs.created_at) DESC
                    )
                    SELECT subscription_id, count(*) AS companies_count
                    FROM latest_active
                    GROUP BY subscription_id
                    """
                )
            ).mappings().all()
        counts = {row['subscription_id']: int(row['companies_count']) for row in counts_rows}
        plans = []
        for row in plans_rows:
            plan = dict(row)
            plan['companies_count'] = counts.get(row['id'], 0)
            plans.append(json_safe(plan))
        return plans

    def get_company(self, company_id: str) -> dict[str, Any] | None:
        with self.engine.connect() as conn:
            row = conn.execute(
                text(
                    """
                    WITH users_agg AS (
                        SELECT uc.company_id,
                               count(*) AS users_count,
                               count(*) FILTER (WHERE u.status = 'ACTIVE') AS active_users_count
                        FROM public.user_company uc
                        JOIN public.users u ON u.id = uc.user_id
                        WHERE uc.company_id = :company_id
                        GROUP BY uc.company_id
                    ),
                    latest_plan AS (
                        SELECT cs.company_id, cs.subscription_id, cs.status, cs.expiration_date
                        FROM public.company_subscription cs
                        WHERE cs.company_id = :company_id
                        ORDER BY (cs.status = 'active') DESC, COALESCE(cs.updated_at, cs.created_at) DESC
                        LIMIT 1
                    )
                    SELECT c.id, c.company_name AS name, c.cnpj, c.contact_email, c.phone,
                           COALESCE(c.account_status, 'active') AS account_status,
                           c.created_at, c.updated_at,
                           c.monthly_analysis_limit, c.max_active_users,
                           COALESCE(ua.users_count, 0) AS users_count,
                           COALESCE(ua.active_users_count, 0) AS active_users_count,
                           lp.subscription_id AS plan_id,
                           s.name AS plan_name,
                           s.payment_type AS plan_payment_type,
                           lp.status AS subscription_status,
                           lp.expiration_date
                    FROM public.company c
                    LEFT JOIN users_agg ua ON ua.company_id = c.id
                    LEFT JOIN latest_plan lp ON lp.company_id = c.id
                    LEFT JOIN public.subscription s ON s.id = lp.subscription_id
                    WHERE c.id = :company_id
                    """
                ),
                {'company_id': company_id},
            ).mappings().first()
            if not row:
                return None
            company = json_safe(dict(row))
            company['subscriptions'] = rows_to_dicts(
                conn.execute(
                    text(
                        """
                        SELECT cs.id, cs.subscription_id, s.name AS plan_name, s.payment_type,
                               cs.status, cs.expiration_date, cs.created_at, cs.updated_at
                        FROM public.company_subscription cs
                        JOIN public.subscription s ON s.id = cs.subscription_id
                        WHERE cs.company_id = :company_id
                        ORDER BY COALESCE(cs.updated_at, cs.created_at) DESC
                        LIMIT 10
                        """
                    ),
                    {'company_id': company_id},
                ).mappings().all()
            )
            company['users'] = rows_to_dicts(
                conn.execute(
                    text(
                        """
                        SELECT u.id, u.name, u.email, u.phone, u.status, uc.role, uc.seller_type,
                               uc.created_at AS linked_at, u.calendar_connected, u.microsoft_calendar_connected,
                               count(a.id) AS analyses_count,
                               count(a.id) FILTER (WHERE a.created_at >= now() - interval '30 days') AS analyses_30d,
                               max(a.created_at) AS last_analysis_at,
                               avg(a.score_geral) AS avg_score_geral
                        FROM public.user_company uc
                        JOIN public.users u ON u.id = uc.user_id
                        LEFT JOIN public.analyses a ON a.user_id = u.id
                        WHERE uc.company_id = :company_id
                        GROUP BY u.id, u.name, u.email, u.phone, u.status, uc.role, uc.seller_type,
                                 uc.created_at, u.calendar_connected, u.microsoft_calendar_connected
                        ORDER BY uc.created_at DESC NULLS LAST
                        """
                    ),
                    {'company_id': company_id},
                ).mappings().all()
            )
            analytics = conn.execute(
                text(
                    """
                    SELECT count(a.id) AS analyses_total,
                           count(a.id) FILTER (WHERE a.created_at >= now() - interval '30 days') AS analyses_30d,
                           count(a.id) FILTER (WHERE a.created_at >= now() - interval '7 days') AS analyses_7d,
                           count(DISTINCT a.user_id) AS users_with_analyses,
                           max(a.created_at) AS last_analysis_at,
                           avg(a.score_geral) AS avg_score_geral
                    FROM public.user_company uc
                    JOIN public.users u ON u.id = uc.user_id
                    LEFT JOIN public.analyses a ON a.user_id = u.id
                    WHERE uc.company_id = :company_id
                    """
                ),
                {'company_id': company_id},
            ).mappings().first()
            company['analytics'] = json_safe(dict(analytics or {}))
            company['analyses_by_month'] = rows_to_dicts(
                conn.execute(
                    text(
                        """
                        SELECT date_trunc('month', a.created_at) AS month, count(a.id) AS analyses_count
                        FROM public.user_company uc
                        JOIN public.users u ON u.id = uc.user_id
                        JOIN public.analyses a ON a.user_id = u.id
                        WHERE uc.company_id = :company_id
                        GROUP BY 1
                        ORDER BY 1 DESC
                        LIMIT 12
                        """
                    ),
                    {'company_id': company_id},
                ).mappings().all()
            )
        return company

    def set_company_status(self, company_id: str, status: str) -> dict[str, Any] | None:
        if status not in {'active', 'inactive', 'suspended', 'ACTIVE', 'INACTIVE', 'SUSPENDED'}:
            raise ValueError('Status inválido')
        with self.engine.begin() as conn:
            conn.execute(
                text("UPDATE public.company SET account_status = :status, updated_at = now() WHERE id = :company_id"),
                {'status': status.lower(), 'company_id': company_id},
            )
        return self.get_company(company_id)

    def set_company_limits(self, company_id: str, monthly_analysis_limit: int | None, max_active_users: int | None) -> dict[str, Any] | None:
        with self.engine.begin() as conn:
            conn.execute(
                text(
                    """
                    UPDATE public.company
                    SET monthly_analysis_limit = COALESCE(:monthly_analysis_limit, monthly_analysis_limit),
                        max_active_users = :max_active_users,
                        updated_at = now()
                    WHERE id = :company_id
                    """
                ),
                {'monthly_analysis_limit': monthly_analysis_limit, 'max_active_users': max_active_users, 'company_id': company_id},
            )
        return self.get_company(company_id)

    def set_company_subscription(self, company_id: str, subscription_id: str, expiration_date: str | None, actor_user_id: str | None) -> dict[str, Any] | None:
        with self.engine.begin() as conn:
            conn.execute(
                text("UPDATE public.company_subscription SET status = 'inactive', updated_at = now() WHERE company_id = :company_id AND status = 'active'"),
                {'company_id': company_id},
            )
            conn.execute(
                text(
                    """
                    INSERT INTO public.company_subscription (company_id, subscription_id, status, expiration_date, created_by)
                    VALUES (:company_id, :subscription_id, 'active', :expiration_date, COALESCE(:actor_user_id, :company_id)::uuid)
                    """
                ),
                {
                    'company_id': company_id,
                    'subscription_id': subscription_id,
                    'expiration_date': expiration_date,
                    'actor_user_id': actor_user_id,
                },
            )
        return self.get_company(company_id)

    def create_audit_log(self, actor: dict[str, Any], action: str, entity_type: str, entity_id: str | None, before_data: Any = None, after_data: Any = None, reason: str | None = None) -> None:
        with self.engine.begin() as conn:
            conn.execute(
                text(
                    """
                    INSERT INTO public.backoffice_audit_log
                        (actor_email, action, entity_type, entity_id, before_data, after_data, reason, ip_address, user_agent)
                    VALUES
                        (:actor_email, :action, :entity_type, :entity_id, CAST(:before_data AS jsonb), CAST(:after_data AS jsonb), :reason, :ip_address, :user_agent)
                    """
                ),
                {
                    'actor_email': actor.get('email'),
                    'action': action,
                    'entity_type': entity_type,
                    'entity_id': entity_id,
                    'before_data': __import__('json').dumps(json_safe(before_data)) if before_data is not None else None,
                    'after_data': __import__('json').dumps(json_safe(after_data)) if after_data is not None else None,
                    'reason': reason,
                    'ip_address': request.headers.get('X-Forwarded-For', request.remote_addr or '').split(',')[0].strip(),
                    'user_agent': request.headers.get('User-Agent'),
                },
            )

    def list_audit_log(self, page: int, page_size: int) -> dict[str, Any]:
        offset = max(page - 1, 0) * page_size
        with self.engine.connect() as conn:
            total = conn.execute(text('SELECT count(*) FROM public.backoffice_audit_log')).scalar() or 0
            rows = conn.execute(
                text(
                    """
                    SELECT id, actor_email, action, entity_type, entity_id, reason, created_at
                    FROM public.backoffice_audit_log
                    ORDER BY created_at DESC
                    LIMIT :limit OFFSET :offset
                    """
                ),
                {'limit': page_size, 'offset': offset},
            ).mappings().all()
        return {'items': rows_to_dicts(rows), 'pagination': {'page': page, 'page_size': page_size, 'total': int(total)}}

    def list_alerts(self) -> dict[str, Any]:
        with self.engine.connect() as conn:
            rows = conn.execute(
                text(
                    """
                    WITH company_users AS (
                        SELECT c.id AS company_id,
                               c.company_name,
                               COALESCE(c.account_status, 'active') AS account_status,
                               c.max_active_users,
                               count(u.id) FILTER (WHERE u.status = 'ACTIVE') AS active_users_total
                        FROM public.company c
                        LEFT JOIN public.user_company uc ON uc.company_id = c.id
                        LEFT JOIN public.users u ON u.id = uc.user_id
                        GROUP BY c.id, c.company_name, c.account_status, c.max_active_users
                    ),
                    analyses_30d AS (
                        SELECT uc.company_id, count(a.id) AS analyses_30d_total
                        FROM public.user_company uc
                        JOIN public.analyses a ON a.user_id = uc.user_id
                        WHERE a.created_at >= now() - interval '30 days'
                        GROUP BY uc.company_id
                    ),
                    latest_plan AS (
                        SELECT DISTINCT ON (cs.company_id) cs.company_id, s.name AS plan_name
                        FROM public.company_subscription cs
                        JOIN public.subscription s ON s.id = cs.subscription_id
                        WHERE cs.status = 'active'
                        ORDER BY cs.company_id, COALESCE(cs.updated_at, cs.created_at) DESC
                    )
                    SELECT cu.company_id,
                           cu.company_name,
                           cu.account_status,
                           lp.plan_name,
                           cu.max_active_users,
                           cu.active_users_total,
                           COALESCE(a30.analyses_30d_total, 0) AS analyses_30d_total,
                           CASE
                             WHEN cu.max_active_users IS NOT NULL AND cu.active_users_total > cu.max_active_users THEN 'USER_LIMIT_EXCEEDED'
                             WHEN lp.plan_name IS NULL THEN 'NO_ACTIVE_PLAN'
                             WHEN cu.account_status <> 'active' THEN 'INACTIVE_COMPANY'
                           END AS alert_code,
                           CASE
                             WHEN cu.max_active_users IS NOT NULL AND cu.active_users_total > cu.max_active_users THEN 'high'
                             WHEN lp.plan_name IS NULL THEN 'medium'
                             WHEN cu.account_status <> 'active' THEN 'low'
                           END AS severity,
                           CASE
                             WHEN cu.max_active_users IS NOT NULL AND cu.active_users_total > cu.max_active_users THEN 'Empresa acima do limite de usuários ativos'
                             WHEN lp.plan_name IS NULL THEN 'Empresa sem plano ativo'
                             WHEN cu.account_status <> 'active' THEN 'Empresa inativa ou suspensa'
                           END AS message
                    FROM company_users cu
                    LEFT JOIN analyses_30d a30 ON a30.company_id = cu.company_id
                    LEFT JOIN latest_plan lp ON lp.company_id = cu.company_id
                    WHERE (cu.max_active_users IS NOT NULL AND cu.active_users_total > cu.max_active_users)
                       OR lp.plan_name IS NULL
                       OR cu.account_status <> 'active'
                    ORDER BY severity, cu.company_name
                    LIMIT 100
                    """
                )
            ).mappings().all()
        items = rows_to_dicts(rows)
        summary = {'high': 0, 'medium': 0, 'low': 0, 'total': len(items)}
        by_code: dict[str, int] = {}
        for item in items:
            severity = item.get('severity')
            code = item.get('alert_code')
            if severity in summary:
                summary[severity] += 1
            if code:
                by_code[code] = by_code.get(code, 0) + 1
        return {'items': items, 'summary': summary, 'by_code': by_code}


def create_app() -> Flask:
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.getenv('INTERNAL_BACKOFFICE_SECRET') or os.getenv('SECRET_TOKEN') or 'firstline-local-dev'
    app.config['COOKIE_SECURE'] = (os.getenv('INTERNAL_COOKIE_SECURE') or '').lower() == 'true'
    origins = [item.strip() for item in (os.getenv('FRONTEND_ORIGINS') or 'http://localhost:5173,http://localhost:5174').split(',') if item.strip()]
    CORS(app, origins=origins, supports_credentials=True)

    def supabase() -> SupabaseRest:
        if not hasattr(g, 'supabase'):
            g.supabase = SupabaseRest()
        return g.supabase

    def firstline_db() -> FirstlineDb:
        if not hasattr(g, 'firstline_db'):
            g.firstline_db = FirstlineDb()
        return g.firstline_db

    def public_user(row: dict[str, Any]) -> dict[str, Any]:
        return {
            'id': row.get('id'),
            'email': row.get('email'),
            'name': row.get('name'),
            'role': row.get('role'),
            'status': row.get('status'),
        }

    def create_token(user: dict[str, Any]) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            'sub': str(user['id']),
            'email': user['email'],
            'role': user['role'],
            'iat': int(now.timestamp()),
            'exp': int((now + timedelta(hours=12)).timestamp()),
            'typ': 'internal_backoffice',
        }
        return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

    def require_internal(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            token = request.cookies.get(COOKIE_NAME)
            if not token:
                return jsonify({'success': False, 'error': 'Autenticação interna obrigatória'}), 401
            try:
                claims = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            except Exception:
                return jsonify({'success': False, 'error': 'Sessão interna inválida'}), 401
            if claims.get('typ') != 'internal_backoffice':
                return jsonify({'success': False, 'error': 'Sessão interna inválida'}), 401
            user_id = quote(str(claims.get('sub') or ''), safe='')
            user = supabase().select_one('internal_users', f'id=eq.{user_id}&select=id,email,name,role,status')
            if not user or user.get('status') != 'ACTIVE':
                return jsonify({'success': False, 'error': 'Usuário interno inativo'}), 403
            g.internal_user = public_user(user)
            return fn(*args, **kwargs)
        return wrapper

    @app.get('/internal/health')
    def health():
        try:
            db = supabase()
            auth_tables = {
                'internal_users': db.count('internal_users'),
                'backoffice_audit_log': db.count('backoffice_audit_log'),
            }
            firstline = {'database': 'not_configured', 'tables': {}}
            try:
                operational = firstline_db()
                firstline = {
                    'database': 'connected',
                    'tables': {
                        'company': operational.count('company'),
                        'users': operational.count('users'),
                        'subscription': operational.count('subscription'),
                        'analyses': operational.count('analyses'),
                    },
                }
            except Exception as exc:
                firstline = {'database': 'error', 'error': str(exc), 'tables': {}}
            return jsonify({'success': True, 'service': 'firstline-backoffice-backend', 'database': 'connected', 'tables': auth_tables, 'firstline': firstline})
        except Exception as exc:
            return jsonify({'success': False, 'service': 'firstline-backoffice-backend', 'database': 'error', 'error': str(exc)}), 503

    @app.post('/internal/auth/login')
    def login():
        data = request.get_json(silent=True) or {}
        email = (data.get('email') or '').strip().lower()
        password = data.get('password') or ''
        if not email or not password:
            return jsonify({'success': False, 'error': 'Email e senha são obrigatórios'}), 400
        db = supabase()
        encoded_email = quote(email, safe='')
        user = db.select_one('internal_users', f'email=eq.{encoded_email}&select=id,email,password_hash,name,role,status')
        if not user or user.get('status') != 'ACTIVE':
            return jsonify({'success': False, 'error': 'Credenciais inválidas'}), 401

        password_hash = user.get('password_hash')
        if password_hash:
            is_authenticated = bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        else:
            is_authenticated = db.authenticate_password(email, password)

        if not is_authenticated:
            return jsonify({'success': False, 'error': 'Credenciais inválidas'}), 401
        response = make_response(jsonify({'success': True, 'user': public_user(user)}))
        response.set_cookie(COOKIE_NAME, create_token(user), httponly=True, secure=app.config['COOKIE_SECURE'], samesite='Lax', max_age=60 * 60 * 12, path='/')
        return response

    @app.post('/internal/auth/logout')
    @require_internal
    def logout():
        response = make_response(jsonify({'success': True}))
        response.delete_cookie(COOKIE_NAME, path='/')
        return response

    @app.get('/internal/auth/me')
    @require_internal
    def me():
        return jsonify({'success': True, 'user': g.internal_user})

    @app.get('/internal/companies')
    @require_internal
    def companies():
        page = max(int(request.args.get('page', 1)), 1)
        page_size = min(max(int(request.args.get('page_size', 50)), 1), 100)
        data = firstline_db().list_companies(page=page, page_size=page_size, search=request.args.get('search'))
        return jsonify({'success': True, **data})

    @app.get('/internal/companies/<string:company_id>')
    @require_internal
    def get_company(company_id: str):
        company = firstline_db().get_company(company_id)
        if not company:
            return jsonify({'success': False, 'error': 'Empresa não encontrada'}), 404
        return jsonify({'success': True, 'company': company})

    @app.patch('/internal/companies/<string:company_id>/status')
    @require_internal
    def update_company_status(company_id: str):
        data = request.get_json(silent=True) or {}
        db = firstline_db()
        before = db.get_company(company_id)
        if not before:
            return jsonify({'success': False, 'error': 'Empresa não encontrada'}), 404
        company = db.set_company_status(company_id, data.get('status'))
        db.create_audit_log(g.internal_user, 'COMPANY_STATUS_UPDATED', 'company', company_id, before, company, data.get('reason'))
        return jsonify({'success': True, 'company': company})

    @app.patch('/internal/companies/<string:company_id>/subscription')
    @require_internal
    def update_company_subscription(company_id: str):
        data = request.get_json(silent=True) or {}
        db = firstline_db()
        before = db.get_company(company_id)
        if not before:
            return jsonify({'success': False, 'error': 'Empresa não encontrada'}), 404
        company = db.set_company_subscription(company_id, data.get('subscription_id'), data.get('expiration_date'), None)
        db.create_audit_log(g.internal_user, 'COMPANY_SUBSCRIPTION_UPDATED', 'company', company_id, before, company, data.get('reason'))
        return jsonify({'success': True, 'company': company})

    @app.patch('/internal/companies/<string:company_id>/limits')
    @require_internal
    def update_company_limits(company_id: str):
        data = request.get_json(silent=True) or {}
        db = firstline_db()
        before = db.get_company(company_id)
        if not before:
            return jsonify({'success': False, 'error': 'Empresa não encontrada'}), 404
        company = db.set_company_limits(company_id, data.get('monthly_analysis_limit'), data.get('max_active_users'))
        db.create_audit_log(g.internal_user, 'COMPANY_LIMITS_UPDATED', 'company', company_id, before, company, data.get('reason'))
        return jsonify({'success': True, 'company': company})

    @app.get('/internal/users')
    @require_internal
    def users():
        page = max(int(request.args.get('page', 1)), 1)
        page_size = min(max(int(request.args.get('page_size', 50)), 1), 100)
        data = firstline_db().list_users(page=page, page_size=page_size, search=request.args.get('search'), company_id=request.args.get('company_id'))
        return jsonify({'success': True, **data})

    @app.get('/internal/plans')
    @require_internal
    def plans():
        return jsonify({'success': True, 'plans': firstline_db().list_plans()})

    @app.get('/internal/alerts')
    @require_internal
    def alerts():
        return jsonify({'success': True, **firstline_db().list_alerts()})

    @app.get('/internal/audit-log')
    @require_internal
    def audit_log():
        page = max(int(request.args.get('page', 1)), 1)
        page_size = min(max(int(request.args.get('page_size', 20)), 1), 100)
        return jsonify({'success': True, **firstline_db().list_audit_log(page, page_size)})

    return app


app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', '5001')))
