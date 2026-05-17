from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Any

import bcrypt
import jwt
import requests
from dotenv import load_dotenv
from flask import Flask, g, jsonify, make_response, request
from flask_cors import CORS

load_dotenv()

COOKIE_NAME = 'firstline_internal_session'


class SupabaseRest:
    def __init__(self) -> None:
        self.url = (os.getenv('SUPABASE_URL') or os.getenv('VITE_SUPABASE_URL') or '').rstrip('/')
        self.key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SECRET_KEY') or ''
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
        return requests.request(method, f'{self.url}/rest/v1/{path}', headers=self._headers(kwargs.pop('headers', None)), timeout=20, **kwargs)

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
            user = supabase().select_one('internal_users', f'id=eq.{claims.get("sub")}&select=id,email,name,role,status')
            if not user or user.get('status') != 'ACTIVE':
                return jsonify({'success': False, 'error': 'Usuário interno inativo'}), 403
            g.internal_user = public_user(user)
            return fn(*args, **kwargs)
        return wrapper

    @app.get('/internal/health')
    def health():
        try:
            db = supabase()
            tables = {
                'internal_users': db.count('internal_users'),
                'backoffice_audit_log': db.count('backoffice_audit_log'),
            }
            return jsonify({'success': True, 'service': 'firstline-backoffice-backend', 'database': 'connected', 'tables': tables})
        except Exception as exc:
            return jsonify({'success': False, 'service': 'firstline-backoffice-backend', 'database': 'error', 'error': str(exc)}), 503

    @app.post('/internal/auth/login')
    def login():
        data = request.get_json(silent=True) or {}
        email = (data.get('email') or '').strip().lower()
        password = data.get('password') or ''
        if not email or not password:
            return jsonify({'success': False, 'error': 'Email e senha são obrigatórios'}), 400
        user = supabase().select_one('internal_users', f'email=eq.{email}&select=id,email,password_hash,name,role,status')
        if not user or user.get('status') != 'ACTIVE':
            return jsonify({'success': False, 'error': 'Credenciais inválidas'}), 401
        if not bcrypt.checkpw(password.encode('utf-8'), (user.get('password_hash') or '').encode('utf-8')):
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
        return jsonify({'success': True, 'items': [], 'pagination': {'page': 1, 'page_size': 50, 'total': 0}, 'message': 'Company schema is not attached yet'})

    @app.get('/internal/users')
    @require_internal
    def users():
        return jsonify({'success': True, 'items': [], 'pagination': {'page': 1, 'page_size': 50, 'total': 0}, 'summary': {'links_total': 0, 'links_active_users': 0, 'companies_total': 0, 'users_total': 0}, 'message': 'User-company schema is not attached yet'})

    @app.get('/internal/plans')
    @require_internal
    def plans():
        return jsonify({'success': True, 'plans': [], 'message': 'Subscription schema is not attached yet'})

    @app.get('/internal/alerts')
    @require_internal
    def alerts():
        return jsonify({'success': True, 'items': [], 'summary': {'high': 0, 'medium': 0, 'low': 0, 'total': 0}, 'by_code': {}})

    @app.get('/internal/audit-log')
    @require_internal
    def audit_log():
        return jsonify({'success': True, 'items': [], 'pagination': {'page': 1, 'page_size': 20, 'total': 0}})

    return app


app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', '5001')))
