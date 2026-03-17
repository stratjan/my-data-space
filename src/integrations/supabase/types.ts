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
      contacts: {
        Row: {
          created_at: string
          department1: string | null
          department2: string | null
          email_display: string | null
          fax: string | null
          first_name: string | null
          full_name: string
          id: string
          last_name: string | null
          mobile: string | null
          pager: string | null
          phone_other: string | null
          phone_work: string | null
          phone_work2: string | null
          position: string | null
          salutation: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department1?: string | null
          department2?: string | null
          email_display?: string | null
          fax?: string | null
          first_name?: string | null
          full_name?: string
          id?: string
          last_name?: string | null
          mobile?: string | null
          pager?: string | null
          phone_other?: string | null
          phone_work?: string | null
          phone_work2?: string | null
          position?: string | null
          salutation?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department1?: string | null
          department2?: string | null
          email_display?: string | null
          fax?: string | null
          first_name?: string | null
          full_name?: string
          id?: string
          last_name?: string | null
          mobile?: string | null
          pager?: string | null
          phone_other?: string | null
          phone_work?: string | null
          phone_work2?: string | null
          position?: string | null
          salutation?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      journal_metrics: {
        Row: {
          journal_lower: string
          journal_name: string
          sjr_value: number
        }
        Insert: {
          journal_lower: string
          journal_name: string
          sjr_value: number
        }
        Update: {
          journal_lower?: string
          journal_name?: string
          sjr_value?: number
        }
        Relationships: []
      }
      news_items: {
        Row: {
          abstract: string | null
          created_at: string
          doi: string | null
          entity: string | null
          is_oa: boolean | null
          journal: string | null
          metric_name: string | null
          metric_value: number | null
          oa_url: string | null
          pmid: string
          pubdate: string | null
          pubtypes: Json | null
          study_class: string | null
          title: string
          trial_type: string | null
          url_doi: string | null
          url_pubmed: string | null
        }
        Insert: {
          abstract?: string | null
          created_at?: string
          doi?: string | null
          entity?: string | null
          is_oa?: boolean | null
          journal?: string | null
          metric_name?: string | null
          metric_value?: number | null
          oa_url?: string | null
          pmid: string
          pubdate?: string | null
          pubtypes?: Json | null
          study_class?: string | null
          title: string
          trial_type?: string | null
          url_doi?: string | null
          url_pubmed?: string | null
        }
        Update: {
          abstract?: string | null
          created_at?: string
          doi?: string | null
          entity?: string | null
          is_oa?: boolean | null
          journal?: string | null
          metric_name?: string | null
          metric_value?: number | null
          oa_url?: string | null
          pmid?: string
          pubdate?: string | null
          pubtypes?: Json | null
          study_class?: string | null
          title?: string
          trial_type?: string | null
          url_doi?: string | null
          url_pubmed?: string | null
        }
        Relationships: []
      }
      news_meta: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
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
