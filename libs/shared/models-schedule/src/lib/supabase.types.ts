export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      family_members: {
        Row: {
          age: number | null
          created_at: string
          deleted_at: string | null
          family_member_id: string
          name: string
          preferences: Json
          role: Database["public"]["Enums"]["family_member_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          deleted_at?: string | null
          family_member_id?: string
          name: string
          preferences?: Json
          role: Database["public"]["Enums"]["family_member_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          created_at?: string
          deleted_at?: string | null
          family_member_id?: string
          name?: string
          preferences?: Json
          role?: Database["public"]["Enums"]["family_member_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          block_id: string | null
          comments: string | null
          created_at: string
          feedback_id: string
          rating: number
          schedule_id: string
          user_id: string
        }
        Insert: {
          block_id?: string | null
          comments?: string | null
          created_at?: string
          feedback_id?: string
          rating: number
          schedule_id: string
          user_id: string
        }
        Update: {
          block_id?: string | null
          comments?: string | null
          created_at?: string
          feedback_id?: string
          rating?: number
          schedule_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "time_blocks"
            referencedColumns: ["block_id"]
          },
          {
            foreignKeyName: "feedback_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "weekly_schedules"
            referencedColumns: ["schedule_id"]
          },
        ]
      }
      recurring_goals: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          family_member_id: string
          frequency_per_week: number
          goal_id: string
          name: string
          preferred_duration_minutes: number | null
          preferred_time_of_day: string[] | null
          priority: number
          rules: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          family_member_id: string
          frequency_per_week?: number
          goal_id?: string
          name: string
          preferred_duration_minutes?: number | null
          preferred_time_of_day?: string[] | null
          priority?: number
          rules?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          family_member_id?: string
          frequency_per_week?: number
          goal_id?: string
          name?: string
          preferred_duration_minutes?: number | null
          preferred_time_of_day?: string[] | null
          priority?: number
          rules?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_goals_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["family_member_id"]
          },
        ]
      }
      suggestions_cache: {
        Row: {
          cache_id: string
          created_at: string
          expires_at: string
          payload: Json
          suggestion_type: Database["public"]["Enums"]["suggestion_type"]
          user_id: string
        }
        Insert: {
          cache_id?: string
          created_at?: string
          expires_at: string
          payload: Json
          suggestion_type: Database["public"]["Enums"]["suggestion_type"]
          user_id: string
        }
        Update: {
          cache_id?: string
          created_at?: string
          expires_at?: string
          payload?: Json
          suggestion_type?: Database["public"]["Enums"]["suggestion_type"]
          user_id?: string
        }
        Relationships: []
      }
      time_blocks: {
        Row: {
          block_id: string
          block_type: Database["public"]["Enums"]["block_type"]
          created_at: string
          deleted_at: string | null
          family_member_id: string | null
          is_shared: boolean
          metadata: Json
          recurring_goal_id: string | null
          schedule_id: string
          time_range: unknown
          title: string
          updated_at: string
        }
        Insert: {
          block_id?: string
          block_type: Database["public"]["Enums"]["block_type"]
          created_at?: string
          deleted_at?: string | null
          family_member_id?: string | null
          is_shared?: boolean
          metadata?: Json
          recurring_goal_id?: string | null
          schedule_id: string
          time_range: unknown
          title: string
          updated_at?: string
        }
        Update: {
          block_id?: string
          block_type?: Database["public"]["Enums"]["block_type"]
          created_at?: string
          deleted_at?: string | null
          family_member_id?: string | null
          is_shared?: boolean
          metadata?: Json
          recurring_goal_id?: string | null
          schedule_id?: string
          time_range?: unknown
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_blocks_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["family_member_id"]
          },
          {
            foreignKeyName: "time_blocks_recurring_goal_id_fkey"
            columns: ["recurring_goal_id"]
            isOneToOne: false
            referencedRelation: "recurring_goals"
            referencedColumns: ["goal_id"]
          },
          {
            foreignKeyName: "time_blocks_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "weekly_schedules"
            referencedColumns: ["schedule_id"]
          },
        ]
      }
      usage_stats: {
        Row: {
          accepted_count: number
          generated_count: number
          stats_date: string
          user_id: string
        }
        Insert: {
          accepted_count?: number
          generated_count?: number
          stats_date: string
          user_id: string
        }
        Update: {
          accepted_count?: number
          generated_count?: number
          stats_date?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_schedules: {
        Row: {
          created_at: string
          deleted_at: string | null
          is_ai_generated: boolean
          metadata: Json
          schedule_id: string
          updated_at: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          is_ai_generated?: boolean
          metadata?: Json
          schedule_id?: string
          updated_at?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          is_ai_generated?: boolean
          metadata?: Json
          schedule_id?: string
          updated_at?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      weekly_usage_stats: {
        Row: {
          accepted_sum: number | null
          generated_sum: number | null
          iso_week: number | null
          iso_year: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      block_type: "WORK" | "ACTIVITY" | "MEAL" | "OTHER"
      family_member_role: "USER" | "SPOUSE" | "CHILD"
      suggestion_type: "ACTIVITY" | "MEAL"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      block_type: ["WORK", "ACTIVITY", "MEAL", "OTHER"],
      family_member_role: ["USER", "SPOUSE", "CHILD"],
      suggestion_type: ["ACTIVITY", "MEAL"],
    },
  },
} as const

