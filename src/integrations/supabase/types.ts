export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      plans: {
        Row: {
          id: string
          name: string
          description: string | null
          price_monthly: number
          price_yearly: number
          features: Json | null
          limits: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price_monthly: number
          price_yearly: number
          features?: Json | null
          limits?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price_monthly?: number
          price_yearly?: number
          features?: Json | null
          limits?: Json | null
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          cnpj: string | null
          plan_id: string | null
          mrr: number
          arr: number
          status: "active" | "trial" | "churned" | "inactive"
          start_date: string | null
          renewal_date: string | null
          health_score: number
          payment_method: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          cnpj?: string | null
          plan_id?: string | null
          mrr?: number
          arr?: number
          status?: "active" | "trial" | "churned" | "inactive"
          start_date?: string | null
          renewal_date?: string | null
          health_score?: number
          payment_method?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          cnpj?: string | null
          plan_id?: string | null
          mrr?: number
          arr?: number
          status?: "active" | "trial" | "churned" | "inactive"
          start_date?: string | null
          renewal_date?: string | null
          health_score?: number
          payment_method?: string | null
          created_at?: string
        }
      }
      financial_metrics: {
        Row: {
          id: string
          month: string
          mrr: number
          arr: number
          revenue: number
          expenses: number
          churn_rate: number
          customers_count: number
          created_at: string
        }
        Insert: {
          id?: string
          month: string
          mrr?: number
          arr?: number
          revenue?: number
          expenses?: number
          churn_rate?: number
          customers_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          month?: string
          mrr?: number
          arr?: number
          revenue?: number
          expenses?: number
          churn_rate?: number
          customers_count?: number
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          date: string
          description: string
          type: "entrada" | "saida"
          category: string | null
          amount: number
          status: "pending" | "completed" | "cancelled"
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          description: string
          type: "entrada" | "saida"
          category?: string | null
          amount: number
          status?: "pending" | "completed" | "cancelled"
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          description?: string
          type?: "entrada" | "saida"
          category?: string | null
          amount?: number
          status?: "pending" | "completed" | "cancelled"
          created_at?: string
        }
      }
      fixed_costs: {
        Row: {
          id: string
          month: string
          category: string
          budgeted: number
          actual: number
          created_at: string
        }
        Insert: {
          id?: string
          month: string
          category: string
          budgeted?: number
          actual?: number
          created_at?: string
        }
        Update: {
          id?: string
          month?: string
          category?: string
          budgeted?: number
          actual?: number
          created_at?: string
        }
      }
      variable_costs: {
        Row: {
          id: string
          month: string
          category: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          month: string
          category: string
          amount?: number
          created_at?: string
        }
        Update: {
          id?: string
          month?: string
          category?: string
          amount?: number
          created_at?: string
        }
      }
      marketing_stats: {
        Row: {
          id: string
          month: string
          visitors: number
          leads: number
          opportunities: number
          customers: number
          channel_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          month: string
          visitors?: number
          leads?: number
          opportunities?: number
          customers?: number
          channel_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          month?: string
          visitors?: number
          leads?: number
          opportunities?: number
          customers?: number
          channel_data?: Json | null
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          client_id: string | null
          amount: number
          due_date: string
          status: "paid" | "pending" | "overdue"
          created_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          amount: number
          due_date: string
          status?: "paid" | "pending" | "overdue"
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          amount?: number
          due_date?: string
          status?: "paid" | "pending" | "overdue"
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
