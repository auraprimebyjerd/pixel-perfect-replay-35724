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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      cash_claims: {
        Row: {
          account_name: string | null
          account_number: string | null
          amount: number
          back_path: string
          created_at: string
          front_path: string
          id: string
          payment_method_id: string | null
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          amount: number
          back_path: string
          created_at?: string
          front_path: string
          id?: string
          payment_method_id?: string | null
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          amount?: number
          back_path?: string
          created_at?: string
          front_path?: string
          id?: string
          payment_method_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_claims_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_submissions: {
        Row: {
          admin_note: string | null
          back_path: string
          consent_given: boolean
          created_at: string
          front_path: string
          ghana_card_number: string
          id: string
          reference1_name: string
          reference1_phone: string
          reference2_name: string
          reference2_phone: string
          reviewed_at: string | null
          selfie_path: string
          status: Database["public"]["Enums"]["review_status"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          back_path: string
          consent_given: boolean
          created_at?: string
          front_path: string
          ghana_card_number: string
          id?: string
          reference1_name: string
          reference1_phone: string
          reference2_name: string
          reference2_phone: string
          reviewed_at?: string | null
          selfie_path: string
          status?: Database["public"]["Enums"]["review_status"]
          user_id: string
        }
        Update: {
          admin_note?: string | null
          back_path?: string
          consent_given?: boolean
          created_at?: string
          front_path?: string
          ghana_card_number?: string
          id?: string
          reference1_name?: string
          reference1_phone?: string
          reference2_name?: string
          reference2_phone?: string
          reviewed_at?: string | null
          selfie_path?: string
          status?: Database["public"]["Enums"]["review_status"]
          user_id?: string
        }
        Relationships: []
      }
      lending_settings: {
        Row: {
          id: number
          max_amount: number
          min_amount: number
          updated_at: string
        }
        Insert: {
          id?: number
          max_amount?: number
          min_amount?: number
          updated_at?: string
        }
        Update: {
          id?: number
          max_amount?: number
          min_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      loan_applications: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          date_needed: string
          decided_at: string | null
          duration_months: number
          email: string
          full_name: string
          id: string
          monthly_rate_percent: number
          monthly_repayment: number
          phone: string
          purpose: string
          status: Database["public"]["Enums"]["loan_status"]
          total_repayment: number
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          date_needed: string
          decided_at?: string | null
          duration_months: number
          email: string
          full_name: string
          id?: string
          monthly_rate_percent: number
          monthly_repayment: number
          phone: string
          purpose: string
          status?: Database["public"]["Enums"]["loan_status"]
          total_repayment: number
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          date_needed?: string
          decided_at?: string | null
          duration_months?: number
          email?: string
          full_name?: string
          id?: string
          monthly_rate_percent?: number
          monthly_repayment?: number
          phone?: string
          purpose?: string
          status?: Database["public"]["Enums"]["loan_status"]
          total_repayment?: number
          user_id?: string
        }
        Relationships: []
      }
      loan_repayments: {
        Row: {
          amount_due: number
          amount_paid: number
          created_at: string
          due_date: string
          id: string
          loan_id: string
          paid_at: string | null
          user_id: string
        }
        Insert: {
          amount_due: number
          amount_paid?: number
          created_at?: string
          due_date: string
          id?: string
          loan_id: string
          paid_at?: string | null
          user_id: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          created_at?: string
          due_date?: string
          id?: string
          loan_id?: string
          paid_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_repayments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_terms: {
        Row: {
          active: boolean
          duration_months: number
          id: string
          monthly_rate_percent: number
        }
        Insert: {
          active?: boolean
          duration_months: number
          id?: string
          monthly_rate_percent: number
        }
        Update: {
          active?: boolean
          duration_months?: number
          id?: string
          monthly_rate_percent?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          kind: string
          reference_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          kind: string
          reference_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          kind?: string
          reference_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          account_name: string
          account_number: string
          admin_note: string | null
          amount: number
          created_at: string
          decided_at: string | null
          id: string
          payment_method_id: string
          status: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          admin_note?: string | null
          amount: number
          created_at?: string
          decided_at?: string | null
          id?: string
          payment_method_id: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          admin_note?: string | null
          amount?: number
          created_at?: string
          decided_at?: string | null
          id?: string
          payment_method_id?: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_wallet: {
        Args: { p_amount: number; p_note: string; p_user: string }
        Returns: undefined
      }
      admin_decide_loan: {
        Args: { p_approve: boolean; p_id: string; p_note: string }
        Returns: undefined
      }
      admin_decide_withdrawal: {
        Args: { p_id: string; p_note: string; p_paid: boolean }
        Returns: undefined
      }
      admin_exists: { Args: never; Returns: boolean }
      admin_record_repayment: {
        Args: { p_amount: number; p_loan: string; p_note: string }
        Returns: undefined
      }
      admin_review_kyc: {
        Args: { p_approve: boolean; p_id: string; p_note: string }
        Returns: undefined
      }
      calculate_loan: {
        Args: { p_amount: number; p_duration: number }
        Returns: {
          amount: number
          duration_months: number
          monthly_rate_percent: number
          monthly_repayment: number
          total_interest: number
          total_repayment: number
        }[]
      }
      claim_first_admin: { Args: never; Returns: boolean }
      claim_instant_cash: {
        Args: { p_amount: number; p_back: string; p_front: string }
        Returns: string
      }
      claim_instant_cash_with_payout: {
        Args: {
          p_account_name: string
          p_account_number: string
          p_amount: number
          p_back: string
          p_front: string
          p_method: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit: {
        Args: { _action: string; _details: Json; _id: string; _table: string }
        Returns: undefined
      }
      request_withdrawal: {
        Args: {
          p_account_name: string
          p_account_number: string
          p_amount: number
          p_method: string
        }
        Returns: string
      }
      require_admin: { Args: never; Returns: undefined }
      submit_kyc: {
        Args: {
          p_back: string
          p_card_number: string
          p_consent: boolean
          p_front: string
          p_ref1_name: string
          p_ref1_phone: string
          p_ref2_name: string
          p_ref2_phone: string
          p_selfie: string
        }
        Returns: string
      }
      submit_loan_application: {
        Args: {
          p_amount: number
          p_date_needed: string
          p_duration: number
          p_email: string
          p_full_name: string
          p_phone: string
          p_purpose: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
      loan_status: "pending" | "approved" | "rejected" | "repaid"
      review_status: "pending" | "approved" | "rejected"
      withdrawal_status: "pending" | "paid" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      loan_status: ["pending", "approved", "rejected", "repaid"],
      review_status: ["pending", "approved", "rejected"],
      withdrawal_status: ["pending", "paid", "rejected"],
    },
  },
} as const
