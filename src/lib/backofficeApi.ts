const API_URL = import.meta.env.VITE_INTERNAL_API_URL || '';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Erro HTTP ${response.status}`);
  }
  return data;
}

export const backofficeApi = {
  login(email: string, password: string) {
    return request<{ success: boolean; user: InternalUser }>('/internal/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  logout() {
    return request<{ success: boolean }>('/internal/auth/logout', { method: 'POST' });
  },
  me() {
    return request<{ success: boolean; user: InternalUser }>('/internal/auth/me');
  },
  health() {
    return request<{ success: boolean; database: string; service: string; tables: Record<string, number | null> }>('/internal/health');
  },
  companies(page = 1, pageSize = 50) {
    return request<{ success: boolean; items: Company[]; pagination: Pagination; message?: string }>(
      `/internal/companies?page=${page}&page_size=${pageSize}`,
    );
  },
  users(page = 1, pageSize = 50, search = '') {
    const encodedSearch = encodeURIComponent(search);
    return request<{ success: boolean; items: CompanyUserLink[]; pagination: Pagination; summary: UsersSummary; message?: string }>(
      `/internal/users?page=${page}&page_size=${pageSize}&search=${encodedSearch}`,
    );
  },
  plans() {
    return request<{ success: boolean; plans: Plan[]; message?: string }>('/internal/plans');
  },
  alerts() {
    return request<{ success: boolean; items: BackofficeAlert[]; summary: AlertSummary; by_code: Record<string, number> }>(
      '/internal/alerts',
    );
  },
  auditLog(page = 1, pageSize = 20) {
    return request<{ success: boolean; items: AuditLogItem[]; pagination: Pagination }>(
      `/internal/audit-log?page=${page}&page_size=${pageSize}`,
    );
  },
};

export type InternalUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
};

export type Pagination = {
  page: number;
  page_size: number;
  total: number;
};

export type Company = {
  id: string;
  name?: string;
  cnpj?: string;
  contact_email?: string;
  phone?: string;
  account_status?: string;
  created_at?: string;
  users_count?: number;
  active_users_count?: number;
  plan_name?: string;
  plan_payment_type?: string;
  expiration_date?: string;
};

export type CompanyUserLink = {
  link_id: string;
  company_name?: string;
  role?: string;
  seller_type?: string;
  linked_at?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  user_status?: string;
  calendar_connected?: boolean;
  microsoft_calendar_connected?: boolean;
};

export type UsersSummary = {
  links_total: number;
  links_active_users: number;
  companies_total: number;
  users_total: number;
};

export type Plan = {
  id: string;
  name: string;
  description?: string;
  subscription_type?: string;
  payment_type?: string;
  price?: number;
  status: string;
  companies_count?: number;
};

export type AlertSummary = {
  high: number;
  medium: number;
  low: number;
  total: number;
};

export type BackofficeAlert = {
  company_id: string;
  company_name: string;
  account_status: string;
  plan_name?: string;
  max_active_users?: number;
  active_users_total?: number;
  analyses_30d_total?: number;
  alert_code: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
};

export type AuditLogItem = {
  id: string;
  actor_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  reason?: string;
  created_at?: string;
};
