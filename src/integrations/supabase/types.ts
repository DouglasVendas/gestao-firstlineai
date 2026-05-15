export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      budget: {
        Row: {
          actual: number
          budgeted: number
          category: string
          created_at: string
          id: string
          month: string | null
        }
        Insert: {
          actual?: number
          budgeted?: number
          category: string
          created_at?: string
          id?: string
          month?: string | null
        }
        Update: {
          actual?: number
          budgeted?: number
          category?: string
          created_at?: string
          id?: string
          month?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          billing_cycle: string | null
          churn_date: string | null
          churn_reason: string | null
          contract_duration: number | null
          created_at: string
          email: string | null
          id: string
          mrr: number
          name: string
          plan_id: string | null
          products: Json | null
          start_date: string | null
          status: string
          voluntary: boolean | null
        }
        Insert: {
          billing_cycle?: string | null
          churn_date?: string | null
          churn_reason?: string | null
          contract_duration?: number | null
          created_at?: string
          email?: string | null
          id?: string
          mrr?: number
          name: string
          plan_id?: string | null
          products?: Json | null
          start_date?: string | null
          status?: string
          voluntary?: boolean | null
        }
        Update: {
          billing_cycle?: string | null
          churn_date?: string | null
          churn_reason?: string | null
          contract_duration?: number | null
          created_at?: string
          email?: string | null
          id?: string
          mrr?: number
          name?: string
          plan_id?: string | null
          products?: Json | null
          start_date?: string | null
          status?: string
          voluntary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_metrics: {
        Row: {
          arr: number
          churn_rate: number
          churned_mrr: number | null
          contraction_mrr: number | null
          created_at: string
          expansion_mrr: number | null
          expenses: number | null
          id: string
          month: string
          mrr: number
          new_mrr: number | null
          revenue: number | null
        }
        Insert: {
          arr?: number
          churn_rate?: number
          churned_mrr?: number | null
          contraction_mrr?: number | null
          created_at?: string
          expansion_mrr?: number | null
          expenses?: number | null
          id?: string
          month: string
          mrr?: number
          new_mrr?: number | null
          revenue?: number | null
        }
        Update: {
          arr?: number
          churn_rate?: number
          churned_mrr?: number | null
          contraction_mrr?: number | null
          created_at?: string
          expansion_mrr?: number | null
          expenses?: number | null
          id?: string
          month?: string
          mrr?: number
          new_mrr?: number | null
          revenue?: number | null
        }
        Relationships: []
      }
      financial_settings: {
        Row: {
          id: string
          organization_id: string | null
          initial_balance: number
          balance_reference_date: string
          tax_rate: number
          accounting_method: string
          budget_revenue: number
          depreciation_monthly: number
          financial_result_monthly: number
          ir_csll_rate: number
          private_discount: number
          cac_categories: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          initial_balance?: number
          balance_reference_date?: string
          tax_rate?: number
          accounting_method?: string
          budget_revenue?: number
          depreciation_monthly?: number
          financial_result_monthly?: number
          ir_csll_rate?: number
          private_discount?: number
          cac_categories?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          initial_balance?: number
          balance_reference_date?: string
          tax_rate?: number
          accounting_method?: string
          budget_revenue?: number
          depreciation_monthly?: number
          financial_result_monthly?: number
          ir_csll_rate?: number
          private_discount?: number
          cac_categories?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      fixed_costs: {
        Row: {
          actual: number
          budgeted: number | null
          category: string
          created_at: string
          description: string | null
          id: string
          month: string | null
          status: string | null
        }
        Insert: {
          actual?: number
          budgeted?: number | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          month?: string | null
          status?: string | null
        }
        Update: {
          actual?: number
          budgeted?: number | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          month?: string | null
          status?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          client_id: string | null
          created_at: string
          due_date: string
          id: string
          paid_date: string | null
          status: string
          value: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          due_date: string
          id?: string
          paid_date?: string | null
          status?: string
          value?: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          due_date?: string
          id?: string
          paid_date?: string | null
          status?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      mrr_changes: {
        Row: {
          id: string
          client_id: string
          change_date: string
          previous_mrr: number
          new_mrr: number
          change_type: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          change_date?: string
          previous_mrr: number
          new_mrr: number
          change_type: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          change_date?: string
          previous_mrr?: number
          new_mrr?: number
          change_type?: string
          reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mrr_changes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_stats: {
        Row: {
          campaign_roi: Json | null
          channel_performance: Json | null
          created_at: string
          customers: number | null
          id: string
          leads: number | null
          month: string
          mql: number | null
          opportunities: number | null
          sql: number | null
          visitors: number | null
        }
        Insert: {
          campaign_roi?: Json | null
          channel_performance?: Json | null
          created_at?: string
          customers?: number | null
          id?: string
          leads?: number | null
          month: string
          mql?: number | null
          opportunities?: number | null
          sql?: number | null
          visitors?: number | null
        }
        Update: {
          campaign_roi?: Json | null
          channel_performance?: Json | null
          created_at?: string
          customers?: number | null
          id?: string
          leads?: number | null
          month?: string
          mql?: number | null
          opportunities?: number | null
          sql?: number | null
          visitors?: number | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          limits: Json | null
          name: string
          price_monthly: number
          price_yearly: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          limits?: Json | null
          name: string
          price_monthly?: number
          price_yearly?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          limits?: Json | null
          name?: string
          price_monthly?: number
          price_yearly?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          date: string
          description: string
          id: string
          status: string
          type: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          date: string
          description: string
          id?: string
          status?: string
          type?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
      variable_costs: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          id: string
          is_auto_generated: boolean | null
          month: string
          status: string | null
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_auto_generated?: boolean | null
          month: string
          status?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_auto_generated?: boolean | null
          month?: string
          status?: string | null
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
