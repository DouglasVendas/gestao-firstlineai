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
  company(companyId: string) {
    return request<{
      success: boolean;
      company: CompanyDetail;
      billing: BillingCompany | null;
      billing_events: BillingEvent[];
      stripe_events: StripeEvent[];
      stripe_purchases: StripePurchase[];
      alerts: BackofficeAlert[];
      audit_log: AuditLogItem[];
    }>(`/internal/companies/${companyId}`);
  },
  updateCompanyStatus(companyId: string, payload: { status: string; reason?: string }) {
    return request<{ success: boolean; company: CompanyDetail }>(`/internal/companies/${companyId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  updateCompanySubscription(companyId: string, payload: { subscription_id: string; expiration_date?: string | null; reason?: string }) {
    return request<{ success: boolean; company: CompanyDetail }>(`/internal/companies/${companyId}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  updateCompanyLimits(companyId: string, payload: { monthly_analysis_limit?: number | null; max_active_users?: number | null; reason?: string }) {
    return request<{ success: boolean; company: CompanyDetail }>(`/internal/companies/${companyId}/limits`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  users(page = 1, pageSize = 50, search = '') {
    const encodedSearch = encodeURIComponent(search);
    return request<{ success: boolean; items: CompanyUserLink[]; pagination: Pagination; summary: UsersSummary; message?: string }>(
      `/internal/users?page=${page}&page_size=${pageSize}&search=${encodedSearch}`,
    );
  },
  updateUserStatus(linkId: string, payload: { status: string; reason?: string }) {
    return request<{ success: boolean; item: CompanyUserLink }>(`/internal/users/${linkId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  updateUserRole(linkId: string, payload: { role?: string; seller_type?: string; reason?: string }) {
    return request<{ success: boolean; item: CompanyUserLink }>(`/internal/users/${linkId}/role`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  updateUserOnboarding(linkId: string, payload: { completed: boolean; reason?: string }) {
    return request<{ success: boolean; item: CompanyUserLink }>(`/internal/users/${linkId}/onboarding`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  removeUserLink(linkId: string, reason?: string) {
    return request<{ success: boolean; deleted: boolean }>(`/internal/users/${linkId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  },
  plans() {
    return request<{ success: boolean; plans: Plan[]; message?: string }>('/internal/plans');
  },
  billingOverview() {
    return request<{ success: boolean; items: BillingCompany[]; summary: BillingSummary }>('/internal/billing/overview');
  },
  syncBilling() {
    return request<{ success: boolean; created: number; items: BillingCompany[]; summary: BillingSummary }>('/internal/billing/sync', {
      method: 'POST',
    });
  },
  updateBilling(companyId: string, payload: Partial<BillingCompany> & { reason?: string }) {
    return request<{ success: boolean; billing: BillingCompany }>(`/internal/billing/companies/${companyId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  alerts() {
    return request<{ success: boolean; items: BackofficeAlert[]; summary: AlertSummary; by_code: Record<string, number> }>(
      '/internal/alerts',
    );
  },
  growthOverview() {
    return request<{ success: boolean; referral: GrowthReferralOverview; plg: GrowthPlgOverview }>(
      '/internal/growth/overview',
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
  monthly_analysis_limit?: number | null;
  max_active_users?: number | null;
  analyses_total?: number;
  analyses_7d?: number;
  analyses_30d?: number;
  users_with_analyses_30d?: number;
  last_analysis_at?: string;
  avg_score_geral?: number;
  analyses_current_month?: number;
  analyses_previous_month?: number;
};

export type CompanyDetail = Company & {
  plan_id?: string;
  subscription_status?: string;
  subscriptions?: Array<{
    id: string;
    subscription_id: string;
    plan_name?: string;
    payment_type?: string;
    status?: string;
    expiration_date?: string;
    created_at?: string;
    updated_at?: string;
  }>;
  users?: Array<{
    id: string;
    link_id?: string;
    company_id?: string;
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
    role?: string;
    seller_type?: string;
    linked_at?: string;
    onboarding_completed_at?: string;
    calendar_connected?: boolean;
    microsoft_calendar_connected?: boolean;
    analyses_count?: number;
    analyses_7d?: number;
    analyses_30d?: number;
    last_analysis_at?: string;
    avg_score_geral?: number;
  }>;
  analytics?: {
    analyses_total?: number;
    analyses_30d?: number;
    analyses_7d?: number;
    users_with_analyses?: number;
    last_analysis_at?: string;
    avg_score_geral?: number;
  };
  analyses_by_month?: Array<{
    month: string;
    analyses_count: number;
  }>;
  health?: {
    score?: number;
    label?: string;
    next_actions?: string[];
    analyses_current_month?: number;
    analyses_previous_month?: number;
  };
};

export type CompanyUserLink = {
  link_id: string;
  company_id?: string;
  company_name?: string;
  role?: string;
  seller_type?: string;
  linked_at?: string;
  onboarding_completed_at?: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  user_status?: string;
  calendar_connected?: boolean;
  microsoft_calendar_connected?: boolean;
  user_created_at?: string;
  user_updated_at?: string;
  analyses_total?: number;
  analyses_7d?: number;
  analyses_30d?: number;
  last_analysis_at?: string;
};

export type UsersSummary = {
  links_total: number;
  links_active_users: number;
  companies_total: number;
  users_total: number;
  links_with_calendar?: number;
  links_without_calendar?: number;
  links_no_usage_7d?: number;
  links_no_usage_30d?: number;
  onboarding_pending?: number;
};

export type Plan = {
  id: string;
  name: string;
  description?: string;
  subscription_type?: string;
  payment_type?: string;
  price?: number;
  validity_days?: number;
  status: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
  companies_count?: number;
};

export type BillingSummary = {
  total_companies: number;
  configured_companies: number;
  unconfigured_companies: number;
  expected_mrr: number;
  expected_arr: number;
  due_soon: number;
  overdue: number;
  manual_review: number;
};

export type BillingCompany = {
  id?: string | null;
  firstline_company_id: string;
  firstline_subscription_id?: string;
  firstline_company_name?: string;
  plan_name?: string;
  billing_cycle?: 'monthly' | 'yearly' | 'trial' | 'manual' | 'none';
  billing_source?: 'manual' | 'stripe' | 'imported';
  contracted_seats?: number;
  active_users_count?: number;
  active_users_count_cached?: number;
  unit_price?: number;
  discount_type?: 'none' | 'percent' | 'fixed_amount' | 'custom';
  discount_value?: number;
  discount_reason?: string;
  discount_expires_at?: string;
  gross_period_amount?: number;
  expected_period_amount?: number;
  expected_mrr?: number;
  expected_arr?: number;
  start_date?: string;
  last_billing_date?: string;
  next_billing_date?: string;
  billing_health?: string;
  access_policy?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  stripe_product_id?: string;
  notes?: string;
  is_configured?: boolean;
  firstline_plan_name?: string;
  firstline_unit_price?: number;
};

export type BillingEvent = {
  id: string;
  billing_id?: string;
  firstline_company_id?: string;
  event_type: string;
  event_source?: string;
  amount?: number;
  currency?: string;
  event_date?: string;
  description?: string;
  before_data?: Record<string, unknown> | null;
  after_data?: Record<string, unknown> | null;
  created_by?: string;
  created_at?: string;
};

export type StripeEvent = {
  id: string;
  stripe_event_id?: string;
  event_type: string;
  stripe_object_id?: string;
  processing_status?: string;
  error_message?: string;
  created_at?: string;
  processed_at?: string;
};

export type StripePurchase = {
  id: string;
  stripe_checkout_session_id?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_invoice_id?: string;
  firstline_company_id?: string;
  plan_name?: string;
  billing_cycle?: string;
  seat_quantity?: number;
  amount_total?: number;
  currency?: string;
  payment_status?: string;
  subscription_status?: string;
  account_creation_status?: string;
  account_creation_error?: string;
  company_name?: string;
  admin_name?: string;
  admin_email?: string;
  created_at?: string;
  processed_at?: string;
};

export type AlertSummary = {
  high: number;
  medium: number;
  low: number;
  total: number;
};

export type BackofficeAlert = {
  company_id?: string;
  company_name: string;
  account_status?: string;
  plan_name?: string;
  max_active_users?: number;
  active_users_total?: number;
  analyses_30d_total?: number;
  alert_code: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  source?: 'operational' | 'billing' | 'stripe' | string;
  billing_health?: string;
  next_billing_date?: string;
  event_date?: string;
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

export type GrowthReferralItem = {
  id: string;
  referrer_name?: string;
  origin?: string;
  referred_company?: string;
  referred_contact?: string;
  stage?: string;
  value?: number;
  is_converted?: boolean;
  firstline_company_id?: string;
  customer_created_at?: string;
  customer_account_status?: string;
  lost_reason?: string;
  created_at?: string;
  updated_at?: string;
};

export type GrowthReferralReferrer = {
  referrer_name: string;
  indications: number;
  conversions: number;
  conversion_rate: number;
  revenue: number;
};

export type GrowthReferralOverview = {
  summary: {
    total_indications: number;
    converted_customers: number;
    customers_in_base: number;
    conversion_rate: number;
    pipeline_value: number;
    revenue_won: number;
    top_referrers_count: number;
  };
  referrers: GrowthReferralReferrer[];
  items: GrowthReferralItem[];
  customers: GrowthReferralItem[];
};

export type GrowthPlgItem = {
  id: string;
  created_at?: string;
  company_name?: string;
  admin_name?: string;
  admin_email?: string;
  plan_name?: string;
  billing_cycle?: string;
  seat_quantity?: number;
  amount_total?: number;
  currency?: string;
  payment_status?: string;
  subscription_status?: string;
  account_creation_status?: string;
  account_creation_error?: string;
  firstline_company_id?: string;
};

export type GrowthPlgOverview = {
  summary: {
    total_purchases: number;
    paid_purchases: number;
    linked_or_created_accounts: number;
    pending_accounts: number;
    failed_accounts: number;
    active_subscriptions: number;
    paid_conversion_rate: number;
    account_link_rate: number;
    revenue_total: number;
  };
  monthly: Array<{
    month: string;
    purchases: number;
    paid: number;
    linked: number;
    revenue: number;
  }>;
  items: GrowthPlgItem[];
};
