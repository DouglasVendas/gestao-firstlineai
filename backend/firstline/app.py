from __future__ import annotations

import hashlib
import hmac
import json
import os
import time
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from functools import wraps
from typing import Any
from urllib.parse import quote, urlencode
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


def parse_date(value: Any) -> date | None:
    if not value:
        return None
    if isinstance(value, date):
        return value
    try:
        return datetime.fromisoformat(str(value).replace('Z', '+00:00')).date()
    except ValueError:
        try:
            return date.fromisoformat(str(value))
        except ValueError:
            return None


def add_months(anchor: date, months: int) -> date:
    month = anchor.month - 1 + months
    year = anchor.year + month // 12
    month = month % 12 + 1
    last_day = [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
    return date(year, month, min(anchor.day, last_day))


def next_billing_date(anchor: date | None, cycle: str | None, from_date: date | None = None) -> str | None:
    if not anchor or cycle not in {'monthly', 'yearly'}:
        return None
    current = from_date or date.today()
    months = 1 if cycle == 'monthly' else 12
    candidate = anchor
    while candidate < current:
        candidate = add_months(candidate, months)
    return candidate.isoformat()


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

    def select_many(self, table: str, query: str) -> list[dict[str, Any]]:
        response = self.request('GET', f'{table}?{query}')
        if response.status_code == 404:
            return []
        response.raise_for_status()
        return response.json()

    def insert(self, table: str, payload: dict[str, Any] | list[dict[str, Any]]) -> list[dict[str, Any]]:
        response = self.request(
            'POST',
            table,
            json=payload,
            headers={'Prefer': 'return=representation'},
        )
        response.raise_for_status()
        return response.json()

    def update_rows(self, table: str, query: str, payload: dict[str, Any]) -> list[dict[str, Any]]:
        response = self.request(
            'PATCH',
            f'{table}?{query}',
            json=payload,
            headers={'Prefer': 'return=representation'},
        )
        response.raise_for_status()
        return response.json()

    def upsert(self, table: str, payload: dict[str, Any] | list[dict[str, Any]], on_conflict: str) -> list[dict[str, Any]]:
        response = self.request(
            'POST',
            f'{table}?on_conflict={quote(on_conflict, safe=",")}',
            json=payload,
            headers={'Prefer': 'resolution=merge-duplicates,return=representation'},
        )
        response.raise_for_status()
        return response.json()

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


class StripeClient:
    def __init__(self) -> None:
        self.key = os.getenv('STRIPE_SECRET_KEY') or ''
        if not self.key:
            raise RuntimeError('STRIPE_SECRET_KEY is required')

    def request(self, method: str, path: str, data: dict[str, Any] | None = None) -> dict[str, Any]:
        headers = {'Authorization': f'Bearer {self.key}'}
        kwargs: dict[str, Any] = {'headers': headers, 'timeout': 20}
        if data is not None:
            headers['Content-Type'] = 'application/x-www-form-urlencoded'
            kwargs['data'] = urlencode(data, doseq=True)
        response = requests.request(method, f'https://api.stripe.com/v1{path}', **kwargs)
        response.raise_for_status()
        return response.json()

    def retrieve_subscription(self, subscription_id: str | None) -> dict[str, Any] | None:
        if not subscription_id:
            return None
        return self.request('GET', f'/subscriptions/{quote(subscription_id, safe="")}')


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
                    company_analytics_agg AS (
                        SELECT uc.company_id,
                               count(a.id) AS analyses_total,
                               count(a.id) FILTER (WHERE a.created_at >= now() - interval '7 days') AS analyses_7d,
                               count(a.id) FILTER (WHERE a.created_at >= now() - interval '30 days') AS analyses_30d,
                               count(DISTINCT a.user_id) FILTER (WHERE a.created_at >= now() - interval '30 days') AS users_with_analyses_30d,
                               max(a.created_at) AS last_analysis_at,
                               avg(a.score_geral) AS avg_score_geral
                        FROM public.user_company uc
                        LEFT JOIN public.analyses a ON a.user_id = uc.user_id
                        GROUP BY uc.company_id
                    ),
                    company_monthly_usage AS (
                        SELECT company_id,
                               COALESCE(max(analyses_count) FILTER (WHERE month_rank = 1), 0) AS analyses_current_month,
                               COALESCE(max(analyses_count) FILTER (WHERE month_rank = 2), 0) AS analyses_previous_month
                        FROM (
                            SELECT uc.company_id,
                                   date_trunc('month', a.created_at) AS usage_month,
                                   count(a.id) AS analyses_count,
                                   dense_rank() OVER (
                                       PARTITION BY uc.company_id
                                       ORDER BY date_trunc('month', a.created_at) DESC
                                   ) AS month_rank
                            FROM public.user_company uc
                            JOIN public.analyses a ON a.user_id = uc.user_id
                            GROUP BY uc.company_id, date_trunc('month', a.created_at)
                        ) ranked_usage
                        WHERE month_rank <= 2
                        GROUP BY company_id
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
                           COALESCE(caa.analyses_total, 0) AS analyses_total,
                           COALESCE(caa.analyses_7d, 0) AS analyses_7d,
                           COALESCE(caa.analyses_30d, 0) AS analyses_30d,
                           COALESCE(caa.users_with_analyses_30d, 0) AS users_with_analyses_30d,
                           caa.last_analysis_at,
                           COALESCE(caa.avg_score_geral, 0) AS avg_score_geral,
                           COALESCE(cmu.analyses_current_month, 0) AS analyses_current_month,
                           COALESCE(cmu.analyses_previous_month, 0) AS analyses_previous_month,
                           lp.subscription_status,
                           lp.expiration_date,
                           s.id AS plan_id,
                           s.name AS plan_name,
                           s.payment_type AS plan_payment_type
                    FROM public.company c
                    LEFT JOIN company_users_agg cua ON cua.company_id = c.id
                    LEFT JOIN company_analytics_agg caa ON caa.company_id = c.id
                    LEFT JOIN company_monthly_usage cmu ON cmu.company_id = c.id
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

    def list_billing_candidates(self) -> list[dict[str, Any]]:
        with self.engine.connect() as conn:
            rows = conn.execute(
                text(
                    """
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
                               cs.expiration_date,
                               cs.created_at AS subscription_created_at,
                               cs.updated_at AS subscription_updated_at
                        FROM public.company_subscription cs
                        WHERE cs.status = 'active'
                        ORDER BY cs.company_id, COALESCE(cs.updated_at, cs.created_at) DESC
                    )
                    SELECT c.id AS firstline_company_id,
                           c.company_name AS firstline_company_name,
                           c.contact_email,
                           c.created_at AS company_created_at,
                           c.max_active_users,
                           COALESCE(cua.users_count, 0) AS users_count,
                           COALESCE(cua.active_users_count, 0) AS active_users_count,
                           lp.subscription_id AS firstline_subscription_id,
                           lp.subscription_status,
                           lp.expiration_date,
                           lp.subscription_created_at,
                           lp.subscription_updated_at,
                           s.name AS plan_name,
                           s.price AS unit_price,
                           s.payment_type,
                           s.validity_days
                    FROM public.company c
                    LEFT JOIN company_users_agg cua ON cua.company_id = c.id
                    LEFT JOIN latest_plan lp ON lp.company_id = c.id
                    LEFT JOIN public.subscription s ON s.id = lp.subscription_id
                    ORDER BY c.company_name
                    """
                )
            ).mappings().all()
        return rows_to_dicts(rows)

    def find_company_for_purchase(self, admin_email: str | None, company_name: str | None) -> dict[str, Any] | None:
        clauses = []
        params: dict[str, Any] = {}
        if admin_email:
            params['email'] = admin_email.strip().lower()
            clauses.append(
                """
                EXISTS (
                    SELECT 1
                    FROM public.user_company uc
                    JOIN public.users u ON u.id = uc.user_id
                    WHERE uc.company_id = c.id AND lower(u.email) = :email
                )
                """
            )
            clauses.append('lower(c.contact_email) = :email')
        else:
            params['email'] = ''
        if company_name:
            params['company_name'] = company_name.strip()
            clauses.append('c.company_name ILIKE :company_name')
        if not clauses:
            return None

        with self.engine.connect() as conn:
            row = conn.execute(
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
                               cs.expiration_date,
                               cs.created_at AS subscription_created_at,
                               cs.updated_at AS subscription_updated_at
                        FROM public.company_subscription cs
                        WHERE cs.status = 'active'
                        ORDER BY cs.company_id, COALESCE(cs.updated_at, cs.created_at) DESC
                    )
                    SELECT c.id AS firstline_company_id,
                           c.company_name AS firstline_company_name,
                           c.contact_email,
                           c.created_at AS company_created_at,
                           c.max_active_users,
                           COALESCE(cua.users_count, 0) AS users_count,
                           COALESCE(cua.active_users_count, 0) AS active_users_count,
                           lp.subscription_id AS firstline_subscription_id,
                           lp.subscription_status,
                           lp.expiration_date,
                           lp.subscription_created_at,
                           lp.subscription_updated_at,
                           s.name AS plan_name,
                           s.price AS unit_price,
                           s.payment_type,
                           s.validity_days
                    FROM public.company c
                    LEFT JOIN company_users_agg cua ON cua.company_id = c.id
                    LEFT JOIN latest_plan lp ON lp.company_id = c.id
                    LEFT JOIN public.subscription s ON s.id = lp.subscription_id
                    WHERE {' OR '.join(clauses)}
                    ORDER BY
                        CASE WHEN lower(c.contact_email) = :email THEN 0 ELSE 1 END,
                        c.updated_at DESC NULLS LAST
                    LIMIT 1
                    """
                ),
                params,
            ).mappings().first()
        return json_safe(dict(row)) if row else None

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
                    WITH user_analytics AS (
                        SELECT a.user_id,
                               count(a.id) AS analyses_total,
                               count(a.id) FILTER (WHERE a.created_at >= now() - interval '7 days') AS analyses_7d,
                               count(a.id) FILTER (WHERE a.created_at >= now() - interval '30 days') AS analyses_30d,
                               max(a.created_at) AS last_analysis_at
                        FROM public.analyses a
                        GROUP BY a.user_id
                    )
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
                           u.updated_at AS user_updated_at,
                           COALESCE(ua.analyses_total, 0) AS analyses_total,
                           COALESCE(ua.analyses_7d, 0) AS analyses_7d,
                           COALESCE(ua.analyses_30d, 0) AS analyses_30d,
                           ua.last_analysis_at
                    FROM public.user_company uc
                    JOIN public.users u ON u.id = uc.user_id
                    LEFT JOIN public.company c ON c.id = uc.company_id
                    LEFT JOIN user_analytics ua ON ua.user_id = u.id
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
                    WITH user_analytics AS (
                        SELECT a.user_id,
                               count(a.id) FILTER (WHERE a.created_at >= now() - interval '7 days') AS analyses_7d,
                               count(a.id) FILTER (WHERE a.created_at >= now() - interval '30 days') AS analyses_30d
                        FROM public.analyses a
                        GROUP BY a.user_id
                    )
                    SELECT
                        (SELECT count(*) FROM public.user_company) AS links_total,
                        (SELECT count(*) FROM public.user_company uc JOIN public.users u ON u.id = uc.user_id WHERE u.status = 'ACTIVE') AS links_active_users,
                        (SELECT count(*) FROM public.company) AS companies_total,
                        (SELECT count(*) FROM public.users) AS users_total,
                        (
                            SELECT count(*)
                            FROM public.user_company uc
                            JOIN public.users u ON u.id = uc.user_id
                            WHERE COALESCE(u.calendar_connected, false) = true OR COALESCE(u.microsoft_calendar_connected, false) = true
                        ) AS links_with_calendar,
                        (
                            SELECT count(*)
                            FROM public.user_company uc
                            JOIN public.users u ON u.id = uc.user_id
                            WHERE COALESCE(u.calendar_connected, false) = false AND COALESCE(u.microsoft_calendar_connected, false) = false
                        ) AS links_without_calendar,
                        (
                            SELECT count(*)
                            FROM public.user_company uc
                            JOIN public.users u ON u.id = uc.user_id
                            LEFT JOIN user_analytics ua ON ua.user_id = u.id
                            WHERE COALESCE(ua.analyses_7d, 0) = 0
                        ) AS links_no_usage_7d,
                        (
                            SELECT count(*)
                            FROM public.user_company uc
                            JOIN public.users u ON u.id = uc.user_id
                            LEFT JOIN user_analytics ua ON ua.user_id = u.id
                            WHERE COALESCE(ua.analyses_30d, 0) = 0
                        ) AS links_no_usage_30d,
                        (
                            SELECT count(*)
                            FROM public.user_company
                            WHERE onboarding_completed_at IS NULL
                        ) AS onboarding_pending
                    """
                )
            ).mappings().first()
        return {
            'items': rows_to_dicts(rows),
            'pagination': {'page': page, 'page_size': page_size, 'total': int(total)},
            'summary': json_safe(dict(summary or {})),
        }

    def get_user_link(self, link_id: str) -> dict[str, Any] | None:
        with self.engine.connect() as conn:
            row = conn.execute(
                text(
                    """
                    WITH user_analytics AS (
                        SELECT a.user_id,
                               count(a.id) AS analyses_total,
                               count(a.id) FILTER (WHERE a.created_at >= now() - interval '7 days') AS analyses_7d,
                               count(a.id) FILTER (WHERE a.created_at >= now() - interval '30 days') AS analyses_30d,
                               max(a.created_at) AS last_analysis_at
                        FROM public.analyses a
                        GROUP BY a.user_id
                    )
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
                           u.updated_at AS user_updated_at,
                           COALESCE(ua.analyses_total, 0) AS analyses_total,
                           COALESCE(ua.analyses_7d, 0) AS analyses_7d,
                           COALESCE(ua.analyses_30d, 0) AS analyses_30d,
                           ua.last_analysis_at
                    FROM public.user_company uc
                    JOIN public.users u ON u.id = uc.user_id
                    LEFT JOIN public.company c ON c.id = uc.company_id
                    LEFT JOIN user_analytics ua ON ua.user_id = u.id
                    WHERE uc.id = :link_id
                    LIMIT 1
                    """
                ),
                {'link_id': link_id},
            ).mappings().first()
        return json_safe(dict(row)) if row else None

    def set_user_status_by_link(self, link_id: str, status: str) -> dict[str, Any] | None:
        status_value = str(status or '').upper()
        if status_value not in {'ACTIVE', 'INACTIVE', 'SUSPENDED'}:
            raise ValueError('Status de usuário inválido')
        with self.engine.begin() as conn:
            conn.execute(
                text(
                    """
                    UPDATE public.users u
                    SET status = :status, updated_at = now()
                    FROM public.user_company uc
                    WHERE uc.user_id = u.id AND uc.id = :link_id
                    """
                ),
                {'status': status_value, 'link_id': link_id},
            )
        return self.get_user_link(link_id)

    def set_user_link_role(self, link_id: str, role: str | None = None, seller_type: str | None = None) -> dict[str, Any] | None:
        if role is None and seller_type is None:
            raise ValueError('Informe role ou seller_type')
        with self.engine.begin() as conn:
            conn.execute(
                text(
                    """
                    UPDATE public.user_company
                    SET role = COALESCE(:role, role),
                        seller_type = COALESCE(:seller_type, seller_type)
                    WHERE id = :link_id
                    """
                ),
                {'role': role, 'seller_type': seller_type, 'link_id': link_id},
            )
        return self.get_user_link(link_id)

    def set_user_link_onboarding(self, link_id: str, completed: bool) -> dict[str, Any] | None:
        with self.engine.begin() as conn:
            conn.execute(
                text(
                    """
                    UPDATE public.user_company
                    SET onboarding_completed_at = CASE WHEN :completed THEN now() ELSE NULL END
                    WHERE id = :link_id
                    """
                ),
                {'completed': completed, 'link_id': link_id},
            )
        return self.get_user_link(link_id)

    def remove_user_link(self, link_id: str) -> bool:
        with self.engine.begin() as conn:
            result = conn.execute(
                text("DELETE FROM public.user_company WHERE id = :link_id"),
                {'link_id': link_id},
            )
        return (result.rowcount or 0) > 0

    def list_company_audit_log(self, company_id: str, page_size: int = 30) -> list[dict[str, Any]]:
        with self.engine.connect() as conn:
            rows = conn.execute(
                text(
                    """
                    SELECT id, actor_email, action, entity_type, entity_id, reason, created_at
                    FROM public.backoffice_audit_log
                    WHERE entity_id = :company_id
                    ORDER BY created_at DESC
                    LIMIT :limit
                    """
                ),
                {'company_id': company_id, 'limit': page_size},
            ).mappings().all()
        return rows_to_dicts(rows)

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
                        SELECT u.id, u.name, u.email, u.phone, u.status, uc.id AS link_id, uc.company_id,
                               uc.role, uc.seller_type, uc.created_at AS linked_at, uc.onboarding_completed_at,
                               u.calendar_connected, u.microsoft_calendar_connected,
                               count(a.id) AS analyses_count,
                               count(a.id) FILTER (WHERE a.created_at >= now() - interval '30 days') AS analyses_30d,
                               count(a.id) FILTER (WHERE a.created_at >= now() - interval '7 days') AS analyses_7d,
                               max(a.created_at) AS last_analysis_at,
                               avg(a.score_geral) AS avg_score_geral
                        FROM public.user_company uc
                        JOIN public.users u ON u.id = uc.user_id
                        LEFT JOIN public.analyses a ON a.user_id = u.id
                        WHERE uc.company_id = :company_id
                        GROUP BY u.id, u.name, u.email, u.phone, u.status, uc.id, uc.company_id, uc.role, uc.seller_type,
                                 uc.created_at, uc.onboarding_completed_at, u.calendar_connected, u.microsoft_calendar_connected
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

    def billing_rows_by_company() -> dict[str, dict[str, Any]]:
        rows = supabase().select_many(
            'backoffice_company_billing',
            'select=*&order=next_billing_date.asc.nullslast',
        )
        return {str(row.get('firstline_company_id')): row for row in rows}

    def billing_payload_from_company(company: dict[str, Any], actor_email: str | None = None) -> dict[str, Any]:
        cycle = 'trial' if company.get('payment_type') == 'trial' else 'monthly'
        active_users = int(company.get('active_users_count') or 0)
        max_users = int(company.get('max_active_users') or 0)
        contracted_seats = max(max_users, active_users, 1)
        start = parse_date(company.get('subscription_created_at')) or parse_date(company.get('company_created_at')) or date.today()
        unit_price = float(company.get('unit_price') or 0)
        plan_name = company.get('plan_name') or 'Sem plano'
        billing_health = 'trial' if cycle == 'trial' else ('ok' if company.get('firstline_subscription_id') else 'not_configured')
        return {
            'firstline_company_id': company.get('firstline_company_id'),
            'firstline_subscription_id': company.get('firstline_subscription_id'),
            'firstline_company_name': company.get('firstline_company_name'),
            'plan_name': plan_name,
            'billing_cycle': cycle,
            'billing_source': 'imported',
            'contracted_seats': contracted_seats,
            'active_users_count_cached': active_users,
            'unit_price': unit_price,
            'start_date': start.isoformat(),
            'next_billing_date': next_billing_date(start, cycle),
            'billing_health': billing_health,
            'access_policy': 'trial_only' if cycle == 'trial' else 'active',
            'created_by': actor_email,
            'updated_by': actor_email,
        }

    def merge_billing_rows(candidates: list[dict[str, Any]], billing_by_company: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
        items = []
        for company in candidates:
            company_id = str(company.get('firstline_company_id'))
            row = billing_by_company.get(company_id)
            if row:
                item = {**row, 'is_configured': True}
                item.setdefault('firstline_company_name', company.get('firstline_company_name'))
                item['active_users_count'] = company.get('active_users_count') or row.get('active_users_count_cached') or 0
                item['firstline_plan_name'] = company.get('plan_name')
                item['firstline_unit_price'] = company.get('unit_price')
            else:
                derived = billing_payload_from_company(company)
                seats = int(derived.get('contracted_seats') or 0)
                price = float(derived.get('unit_price') or 0)
                period_amount = seats * price
                expected_mrr = period_amount if derived.get('billing_cycle') == 'monthly' else 0
                expected_arr = period_amount * 12 if derived.get('billing_cycle') == 'monthly' else 0
                item = {
                    **derived,
                    'id': None,
                    'is_configured': False,
                    'gross_period_amount': period_amount,
                    'expected_period_amount': period_amount,
                    'expected_mrr': expected_mrr,
                    'expected_arr': expected_arr,
                    'active_users_count': company.get('active_users_count') or 0,
                    'firstline_plan_name': company.get('plan_name'),
                    'firstline_unit_price': company.get('unit_price'),
                }
            items.append(json_safe(item))
        return items

    def billing_summary(items: list[dict[str, Any]]) -> dict[str, Any]:
        today = date.today()
        due_limit = today + timedelta(days=7)
        summary = {
            'total_companies': len(items),
            'configured_companies': 0,
            'unconfigured_companies': 0,
            'expected_mrr': 0.0,
            'expected_arr': 0.0,
            'due_soon': 0,
            'overdue': 0,
            'manual_review': 0,
        }
        for item in items:
            if item.get('is_configured'):
                summary['configured_companies'] += 1
            else:
                summary['unconfigured_companies'] += 1
            summary['expected_mrr'] += float(item.get('expected_mrr') or 0)
            summary['expected_arr'] += float(item.get('expected_arr') or 0)
            if item.get('billing_health') == 'manual_review':
                summary['manual_review'] += 1
            due = parse_date(item.get('next_billing_date'))
            if due:
                if due < today:
                    summary['overdue'] += 1
                elif due <= due_limit:
                    summary['due_soon'] += 1
        summary['expected_mrr'] = round(summary['expected_mrr'], 2)
        summary['expected_arr'] = round(summary['expected_arr'], 2)
        return summary

    def verify_stripe_signature(payload: bytes, signature_header: str | None) -> bool:
        secret = os.getenv('STRIPE_WEBHOOK_SECRET') or ''
        if not secret or not signature_header:
            return False
        parts = {}
        for item in signature_header.split(','):
            if '=' in item:
                key, value = item.split('=', 1)
                parts.setdefault(key, []).append(value)
        try:
            timestamp = int((parts.get('t') or [''])[0])
        except ValueError:
            return False
        if abs(time.time() - timestamp) > 300:
            return False
        signed_payload = f'{timestamp}.'.encode('utf-8') + payload
        expected = hmac.new(secret.encode('utf-8'), signed_payload, hashlib.sha256).hexdigest()
        return any(hmac.compare_digest(expected, signature) for signature in parts.get('v1', []))

    def stripe_custom_fields(session: dict[str, Any]) -> dict[str, str]:
        fields = {}
        for item in session.get('custom_fields') or []:
            key = item.get('key')
            if not key:
                continue
            value = (item.get('text') or {}).get('value') or item.get('dropdown', {}).get('value') or item.get('numeric', {}).get('value')
            fields[key] = value
        return fields

    def subscription_payload(subscription: dict[str, Any] | None) -> dict[str, Any]:
        if not subscription:
            return {}
        item = ((subscription.get('items') or {}).get('data') or [{}])[0]
        price = item.get('price') or {}
        recurring = price.get('recurring') or {}
        return {
            'stripe_subscription_id': subscription.get('id'),
            'subscription_status': subscription.get('status'),
            'current_period_start': datetime.fromtimestamp(subscription['current_period_start'], tz=timezone.utc).isoformat() if subscription.get('current_period_start') else None,
            'current_period_end': datetime.fromtimestamp(subscription['current_period_end'], tz=timezone.utc).isoformat() if subscription.get('current_period_end') else None,
            'stripe_price_id': price.get('id'),
            'stripe_product_id': price.get('product'),
            'billing_cycle': 'yearly' if recurring.get('interval') == 'year' else 'monthly',
            'seat_quantity': item.get('quantity') or 1,
            'firstline_subscription_id': (price.get('metadata') or {}).get('firstline_subscription_id'),
            'plan_code': (price.get('metadata') or {}).get('plan_code'),
        }

    def upsert_purchase_from_checkout(session: dict[str, Any], subscription: dict[str, Any] | None = None) -> dict[str, Any] | None:
        custom = stripe_custom_fields(session)
        customer_details = session.get('customer_details') or {}
        metadata = session.get('metadata') or {}
        sub_payload = subscription_payload(subscription)
        admin_email = customer_details.get('email')
        company_name = custom.get('company_name')
        matched_company = firstline_db().find_company_for_purchase(admin_email, company_name)
        firstline_company_id = matched_company.get('firstline_company_id') if matched_company else None
        amount_total = session.get('amount_total')

        payload = {
            'stripe_checkout_session_id': session.get('id'),
            'stripe_customer_id': session.get('customer'),
            'stripe_subscription_id': session.get('subscription') or sub_payload.get('stripe_subscription_id'),
            'stripe_payment_intent_id': session.get('payment_intent'),
            'stripe_invoice_id': session.get('invoice'),
            'firstline_company_id': firstline_company_id,
            'firstline_subscription_id': sub_payload.get('firstline_subscription_id') or metadata.get('firstline_subscription_id'),
            'plan_code': sub_payload.get('plan_code') or metadata.get('plan_code'),
            'plan_name': (sub_payload.get('plan_code') or metadata.get('plan_code') or '').title() or None,
            'billing_cycle': sub_payload.get('billing_cycle') or metadata.get('billing_cycle') or 'monthly',
            'billing_model': metadata.get('billing_model') or 'per_seat',
            'seat_quantity': sub_payload.get('seat_quantity') or 1,
            'amount_total': round((amount_total or 0) / 100, 2),
            'currency': (session.get('currency') or 'brl').upper(),
            'payment_status': session.get('payment_status'),
            'subscription_status': sub_payload.get('subscription_status'),
            'current_period_start': sub_payload.get('current_period_start'),
            'current_period_end': sub_payload.get('current_period_end'),
            'company_name': company_name,
            'admin_name': custom.get('admin_name'),
            'admin_email': admin_email,
            'admin_phone': customer_details.get('phone'),
            'tax_document': custom.get('tax_document'),
            'account_creation_status': 'linked' if firstline_company_id else 'pending',
            'raw_checkout_session': session,
            'raw_subscription': subscription,
            'processed_at': datetime.now(timezone.utc).isoformat(),
        }
        rows = supabase().upsert('backoffice_stripe_purchases', payload, 'stripe_checkout_session_id')
        purchase = rows[0] if rows else None

        if firstline_company_id and purchase:
            billing_payload = {
                'firstline_company_id': firstline_company_id,
                'firstline_subscription_id': payload.get('firstline_subscription_id'),
                'firstline_company_name': matched_company.get('firstline_company_name') if matched_company else company_name,
                'plan_name': payload.get('plan_name'),
                'billing_cycle': payload.get('billing_cycle'),
                'billing_source': 'stripe',
                'contracted_seats': payload.get('seat_quantity') or 1,
                'active_users_count_cached': matched_company.get('active_users_count') if matched_company else None,
                'unit_price': round((payload.get('amount_total') or 0) / max(payload.get('seat_quantity') or 1, 1), 2),
                'start_date': datetime.now(timezone.utc).date().isoformat(),
                'last_billing_date': datetime.now(timezone.utc).date().isoformat(),
                'next_billing_date': parse_date(payload.get('current_period_end')).isoformat() if parse_date(payload.get('current_period_end')) else None,
                'billing_health': 'ok' if payload.get('payment_status') == 'paid' else 'manual_review',
                'access_policy': 'active',
                'stripe_customer_id': payload.get('stripe_customer_id'),
                'stripe_subscription_id': payload.get('stripe_subscription_id'),
                'stripe_price_id': sub_payload.get('stripe_price_id'),
                'stripe_product_id': sub_payload.get('stripe_product_id'),
                'stripe_last_invoice_id': payload.get('stripe_invoice_id'),
                'stripe_last_payment_status': payload.get('payment_status'),
                'stripe_current_period_start': payload.get('current_period_start'),
                'stripe_current_period_end': payload.get('current_period_end'),
                'updated_by': 'stripe_webhook',
            }
            supabase().upsert('backoffice_company_billing', billing_payload, 'firstline_company_id')
            supabase().insert(
                'backoffice_billing_events',
                {
                    'billing_id': None,
                    'firstline_company_id': firstline_company_id,
                    'event_type': 'STRIPE_CHECKOUT_COMPLETED',
                    'event_source': 'stripe',
                    'amount': payload.get('amount_total'),
                    'currency': payload.get('currency') or 'BRL',
                    'description': 'Compra Stripe vinculada automaticamente a uma empresa FirstLine existente',
                    'after_data': payload,
                    'created_by': 'stripe_webhook',
                },
            )
        return purchase

    def update_purchase_by_subscription(subscription: dict[str, Any], payment_status: str | None = None, invoice_id: str | None = None) -> None:
        sub_payload = subscription_payload(subscription)
        subscription_id = sub_payload.get('stripe_subscription_id')
        if not subscription_id:
            return
        existing = supabase().select_one('backoffice_stripe_purchases', f'stripe_subscription_id=eq.{quote(subscription_id, safe="")}&select=*')
        payload = {
            'subscription_status': sub_payload.get('subscription_status'),
            'current_period_start': sub_payload.get('current_period_start'),
            'current_period_end': sub_payload.get('current_period_end'),
            'stripe_invoice_id': invoice_id,
            'payment_status': payment_status,
            'raw_subscription': subscription,
            'processed_at': datetime.now(timezone.utc).isoformat(),
        }
        if existing:
            supabase().update_rows('backoffice_stripe_purchases', f'stripe_subscription_id=eq.{quote(subscription_id, safe="")}', payload)
            company_id = existing.get('firstline_company_id')
            if company_id:
                health = 'ok' if payment_status in {'paid', None} and sub_payload.get('subscription_status') in {'active', 'trialing'} else 'payment_failed'
                supabase().update_rows(
                    'backoffice_company_billing',
                    f'firstline_company_id=eq.{quote(company_id, safe="")}',
                    {
                        'billing_health': health,
                        'stripe_last_invoice_id': invoice_id,
                        'stripe_last_payment_status': payment_status,
                        'stripe_current_period_start': sub_payload.get('current_period_start'),
                        'stripe_current_period_end': sub_payload.get('current_period_end'),
                        'next_billing_date': parse_date(sub_payload.get('current_period_end')).isoformat() if parse_date(sub_payload.get('current_period_end')) else None,
                        'updated_by': 'stripe_webhook',
                    },
                )

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

    @app.post('/internal/stripe/webhook')
    def stripe_webhook():
        payload = request.get_data()
        if not verify_stripe_signature(payload, request.headers.get('Stripe-Signature')):
            return jsonify({'success': False, 'error': 'Assinatura Stripe inválida'}), 400

        try:
            event = json.loads(payload.decode('utf-8'))
        except json.JSONDecodeError:
            return jsonify({'success': False, 'error': 'Payload inválido'}), 400

        event_id = event.get('id')
        event_type = event.get('type')
        event_object = ((event.get('data') or {}).get('object') or {})
        object_id = event_object.get('id')
        if not event_id or not event_type:
            return jsonify({'success': False, 'error': 'Evento Stripe inválido'}), 400

        existing = supabase().select_one('backoffice_stripe_events', f'stripe_event_id=eq.{quote(event_id, safe="")}&select=id,processing_status')
        if existing and existing.get('processing_status') == 'processed':
            return jsonify({'success': True, 'duplicate': True})

        event_row = {
            'stripe_event_id': event_id,
            'event_type': event_type,
            'stripe_object_id': object_id,
            'processing_status': 'pending',
            'payload': event,
        }
        if existing:
            supabase().update_rows('backoffice_stripe_events', f'stripe_event_id=eq.{quote(event_id, safe="")}', event_row)
        else:
            supabase().insert('backoffice_stripe_events', event_row)

        try:
            stripe = StripeClient()
            purchase = None
            if event_type == 'checkout.session.completed':
                subscription = stripe.retrieve_subscription(event_object.get('subscription'))
                purchase = upsert_purchase_from_checkout(event_object, subscription)
                company_id = purchase.get('firstline_company_id') if purchase else None
                supabase().update_rows(
                    'backoffice_stripe_events',
                    f'stripe_event_id=eq.{quote(event_id, safe="")}',
                    {
                        'firstline_company_id': company_id,
                        'processing_status': 'processed',
                        'processed_at': datetime.now(timezone.utc).isoformat(),
                    },
                )
            elif event_type in {'invoice.paid', 'invoice.payment_failed'}:
                subscription_id = event_object.get('subscription')
                if subscription_id:
                    subscription = stripe.retrieve_subscription(subscription_id)
                    update_purchase_by_subscription(
                        subscription or {'id': subscription_id},
                        payment_status='paid' if event_type == 'invoice.paid' else 'failed',
                        invoice_id=event_object.get('id'),
                    )
                supabase().update_rows(
                    'backoffice_stripe_events',
                    f'stripe_event_id=eq.{quote(event_id, safe="")}',
                    {'processing_status': 'processed', 'processed_at': datetime.now(timezone.utc).isoformat()},
                )
            elif event_type in {'customer.subscription.updated', 'customer.subscription.deleted'}:
                update_purchase_by_subscription(event_object)
                supabase().update_rows(
                    'backoffice_stripe_events',
                    f'stripe_event_id=eq.{quote(event_id, safe="")}',
                    {'processing_status': 'processed', 'processed_at': datetime.now(timezone.utc).isoformat()},
                )
            else:
                supabase().update_rows(
                    'backoffice_stripe_events',
                    f'stripe_event_id=eq.{quote(event_id, safe="")}',
                    {'processing_status': 'ignored', 'processed_at': datetime.now(timezone.utc).isoformat()},
                )
        except Exception as exc:
            supabase().update_rows(
                'backoffice_stripe_events',
                f'stripe_event_id=eq.{quote(event_id, safe="")}',
                {
                    'processing_status': 'failed',
                    'error_message': str(exc),
                    'processed_at': datetime.now(timezone.utc).isoformat(),
                },
            )
            return jsonify({'success': False, 'error': 'Falha ao processar evento Stripe'}), 500

        return jsonify({'success': True})

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
        db = firstline_db()
        company = db.get_company(company_id)
        if not company:
            return jsonify({'success': False, 'error': 'Empresa não encontrada'}), 404
        encoded_company_id = quote(company_id, safe='')

        billing = supabase().select_one(
            'backoffice_company_billing',
            f'firstline_company_id=eq.{encoded_company_id}&select=*',
        )
        billing_events = supabase().select_many(
            'backoffice_billing_events',
            f'firstline_company_id=eq.{encoded_company_id}&select=*&order=event_date.desc&limit=50',
        )
        stripe_events = supabase().select_many(
            'backoffice_stripe_events',
            f'firstline_company_id=eq.{encoded_company_id}&select=id,stripe_event_id,event_type,stripe_object_id,processing_status,error_message,created_at,processed_at&order=created_at.desc&limit=30',
        )
        stripe_purchases = supabase().select_many(
            'backoffice_stripe_purchases',
            f'firstline_company_id=eq.{encoded_company_id}&select=*&order=created_at.desc&limit=30',
        )

        stripe_customer_id = billing.get('stripe_customer_id') if billing else None
        if stripe_customer_id:
            encoded_customer_id = quote(str(stripe_customer_id), safe='')
            purchases_by_customer = supabase().select_many(
                'backoffice_stripe_purchases',
                f'stripe_customer_id=eq.{encoded_customer_id}&select=*&order=created_at.desc&limit=30',
            )
            existing_ids = {str(item.get('id')) for item in stripe_purchases}
            for purchase in purchases_by_customer:
                if str(purchase.get('id')) not in existing_ids:
                    stripe_purchases.append(purchase)

        alerts_payload = db.list_alerts()
        alerts = [item for item in alerts_payload.get('items', []) if str(item.get('company_id')) == company_id]
        audit_log = db.list_company_audit_log(company_id, 30)

        analytics = company.get('analytics') or {}
        analyses_current_month = int(company.get('analyses_by_month', [{}])[0].get('analyses_count') or 0) if company.get('analyses_by_month') else 0
        analyses_previous_month = int(company.get('analyses_by_month', [{}, {}])[1].get('analyses_count') or 0) if len(company.get('analyses_by_month') or []) > 1 else 0

        score = 100
        account_status = str(company.get('account_status') or 'active').lower()
        if account_status != 'active':
            score -= 30
        billing_health = str((billing or {}).get('billing_health') or '')
        if billing_health in {'overdue', 'payment_failed'}:
            score -= 35
        elif billing_health in {'due_soon', 'trial_expiring', 'manual_review', 'not_configured'}:
            score -= 15
        analyses_30d = int(analytics.get('analyses_30d') or 0)
        if analyses_30d <= 0:
            score -= 25
        elif analyses_30d < 5:
            score -= 10
        if analyses_previous_month > 0 and analyses_current_month < int(analyses_previous_month * 0.5):
            score -= 15
        active_users = int(company.get('active_users_count') or 0)
        max_active_users = int(company.get('max_active_users') or 0)
        if max_active_users > 0 and active_users > max_active_users:
            score -= 10
        score = max(0, min(100, score))

        if score >= 75:
            health_label = 'saudavel'
        elif score >= 45:
            health_label = 'atencao'
        else:
            health_label = 'critico'

        next_actions: list[str] = []
        if billing_health in {'overdue', 'payment_failed'}:
            next_actions.append('Cobrar cliente')
        if billing_health in {'due_soon', 'trial_expiring'}:
            next_actions.append('Renovar contrato')
        if max_active_users > 0 and active_users > max_active_users:
            next_actions.append('Ajustar limite de usuarios')
        if active_users >= max(max_active_users, 1) and analyses_30d > 30:
            next_actions.append('Fazer upsell')
        if analyses_30d <= 0 and account_status == 'active':
            next_actions.append('Ativar onboarding')
        if account_status in {'suspended', 'blocked'}:
            next_actions.append('Revisar manualmente')
        if not next_actions:
            next_actions.append('Sem acao imediata')

        company['health'] = {
            'score': score,
            'label': health_label,
            'next_actions': next_actions,
            'analyses_current_month': analyses_current_month,
            'analyses_previous_month': analyses_previous_month,
        }

        return jsonify(
            {
                'success': True,
                'company': company,
                'billing': billing,
                'billing_events': billing_events,
                'stripe_events': stripe_events,
                'stripe_purchases': stripe_purchases,
                'alerts': alerts,
                'audit_log': audit_log,
            }
        )

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

    @app.patch('/internal/users/<string:link_id>/status')
    @require_internal
    def update_user_status(link_id: str):
        data = request.get_json(silent=True) or {}
        db = firstline_db()
        before = db.get_user_link(link_id)
        if not before:
            return jsonify({'success': False, 'error': 'Vínculo de usuário não encontrado'}), 404
        updated = db.set_user_status_by_link(link_id, data.get('status'))
        db.create_audit_log(g.internal_user, 'USER_STATUS_UPDATED', 'user_link', link_id, before, updated, data.get('reason'))
        return jsonify({'success': True, 'item': updated})

    @app.patch('/internal/users/<string:link_id>/role')
    @require_internal
    def update_user_role(link_id: str):
        data = request.get_json(silent=True) or {}
        db = firstline_db()
        before = db.get_user_link(link_id)
        if not before:
            return jsonify({'success': False, 'error': 'Vínculo de usuário não encontrado'}), 404
        updated = db.set_user_link_role(link_id, data.get('role'), data.get('seller_type'))
        db.create_audit_log(g.internal_user, 'USER_LINK_ROLE_UPDATED', 'user_link', link_id, before, updated, data.get('reason'))
        return jsonify({'success': True, 'item': updated})

    @app.patch('/internal/users/<string:link_id>/onboarding')
    @require_internal
    def update_user_onboarding(link_id: str):
        data = request.get_json(silent=True) or {}
        db = firstline_db()
        before = db.get_user_link(link_id)
        if not before:
            return jsonify({'success': False, 'error': 'Vínculo de usuário não encontrado'}), 404
        completed = bool(data.get('completed'))
        updated = db.set_user_link_onboarding(link_id, completed)
        db.create_audit_log(g.internal_user, 'USER_ONBOARDING_UPDATED', 'user_link', link_id, before, updated, data.get('reason'))
        return jsonify({'success': True, 'item': updated})

    @app.delete('/internal/users/<string:link_id>')
    @require_internal
    def delete_user_link(link_id: str):
        data = request.get_json(silent=True) or {}
        db = firstline_db()
        before = db.get_user_link(link_id)
        if not before:
            return jsonify({'success': False, 'error': 'Vínculo de usuário não encontrado'}), 404
        deleted = db.remove_user_link(link_id)
        if not deleted:
            return jsonify({'success': False, 'error': 'Não foi possível remover vínculo'}), 400
        db.create_audit_log(g.internal_user, 'USER_LINK_REMOVED', 'user_link', link_id, before, {'deleted': True}, data.get('reason'))
        return jsonify({'success': True, 'deleted': True})

    @app.get('/internal/plans')
    @require_internal
    def plans():
        return jsonify({'success': True, 'plans': firstline_db().list_plans()})

    @app.get('/internal/billing/overview')
    @require_internal
    def billing_overview():
        candidates = firstline_db().list_billing_candidates()
        items = merge_billing_rows(candidates, billing_rows_by_company())
        purchases = supabase().select_many(
            'backoffice_stripe_purchases',
            'select=*&order=created_at.desc&limit=100',
        )
        purchase_summary = {
            'pending': sum(1 for item in purchases if item.get('account_creation_status') == 'pending'),
            'linked': sum(1 for item in purchases if item.get('account_creation_status') == 'linked'),
            'created': sum(1 for item in purchases if item.get('account_creation_status') == 'created'),
            'failed': sum(1 for item in purchases if item.get('account_creation_status') == 'failed'),
            'total': len(purchases),
        }
        return jsonify({'success': True, 'items': items, 'summary': billing_summary(items), 'stripe_purchases': purchases, 'stripe_purchase_summary': purchase_summary})

    @app.get('/internal/billing/stripe-purchases')
    @require_internal
    def stripe_purchases():
        rows = supabase().select_many(
            'backoffice_stripe_purchases',
            'select=*&order=created_at.desc&limit=100',
        )
        return jsonify({'success': True, 'items': rows})

    @app.post('/internal/billing/sync')
    @require_internal
    def sync_billing():
        candidates = firstline_db().list_billing_candidates()
        existing = billing_rows_by_company()
        payload = [
            billing_payload_from_company(company, g.internal_user.get('email'))
            for company in candidates
            if str(company.get('firstline_company_id')) not in existing
        ]
        created = supabase().insert('backoffice_company_billing', payload) if payload else []
        if created:
            supabase().insert(
                'backoffice_billing_events',
                [
                    {
                        'billing_id': row.get('id'),
                        'firstline_company_id': row.get('firstline_company_id'),
                        'event_type': 'BILLING_FORECAST_CREATED',
                        'event_source': 'system',
                        'description': 'Previsão financeira criada a partir do plano ativo da FirstLine',
                        'after_data': row,
                        'created_by': g.internal_user.get('email'),
                    }
                    for row in created
                ],
            )
        items = merge_billing_rows(candidates, billing_rows_by_company())
        return jsonify({'success': True, 'created': len(created), 'items': items, 'summary': billing_summary(items)})

    @app.patch('/internal/billing/companies/<string:company_id>')
    @require_internal
    def update_billing_company(company_id: str):
        allowed_fields = {
            'plan_name',
            'billing_cycle',
            'contracted_seats',
            'unit_price',
            'discount_type',
            'discount_value',
            'discount_reason',
            'discount_expires_at',
            'start_date',
            'last_billing_date',
            'next_billing_date',
            'billing_health',
            'access_policy',
            'notes',
            'stripe_customer_id',
            'stripe_subscription_id',
            'stripe_price_id',
            'stripe_product_id',
        }
        data = request.get_json(silent=True) or {}
        payload = {key: value for key, value in data.items() if key in allowed_fields}
        if not payload:
            return jsonify({'success': False, 'error': 'Nenhum campo permitido informado'}), 400
        payload['updated_by'] = g.internal_user.get('email')

        encoded_company_id = quote(company_id, safe='')
        before = supabase().select_one('backoffice_company_billing', f'firstline_company_id=eq.{encoded_company_id}&select=*')
        if not before:
            company = next((item for item in firstline_db().list_billing_candidates() if str(item.get('firstline_company_id')) == company_id), None)
            if not company:
                return jsonify({'success': False, 'error': 'Empresa não encontrada'}), 404
            created_payload = {**billing_payload_from_company(company, g.internal_user.get('email')), **payload}
            rows = supabase().insert('backoffice_company_billing', created_payload)
        else:
            rows = supabase().update_rows('backoffice_company_billing', f'firstline_company_id=eq.{encoded_company_id}', payload)

        billing = rows[0] if rows else None
        supabase().insert(
            'backoffice_billing_events',
            {
                'billing_id': billing.get('id') if billing else None,
                'firstline_company_id': company_id,
                'event_type': 'BILLING_FORECAST_UPDATED',
                'event_source': 'manual',
                'description': data.get('reason') or 'Ajuste manual de previsão financeira',
                'before_data': before,
                'after_data': billing,
                'created_by': g.internal_user.get('email'),
            },
        )
        return jsonify({'success': True, 'billing': billing})

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
