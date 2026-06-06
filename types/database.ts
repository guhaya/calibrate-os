export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_daily_briefs: {
        Row: {
          date: string
          feedback: string | null
          generated_at: string | null
          id: string
          model_used: string | null
          nutrition_focus: string | null
          raw_prompt: string | null
          readiness_summary: string | null
          recovery_action: string | null
          training_recommendation: string | null
          user_id: string
        }
        Insert: {
          date: string
          feedback?: string | null
          generated_at?: string | null
          id?: string
          model_used?: string | null
          nutrition_focus?: string | null
          raw_prompt?: string | null
          readiness_summary?: string | null
          recovery_action?: string | null
          training_recommendation?: string | null
          user_id: string
        }
        Update: {
          date?: string
          feedback?: string | null
          generated_at?: string | null
          id?: string
          model_used?: string | null
          nutrition_focus?: string | null
          raw_prompt?: string | null
          readiness_summary?: string | null
          recovery_action?: string | null
          training_recommendation?: string | null
          user_id?: string
        }
        Relationships: []
      }
      calibration_scores: {
        Row: {
          checkin_component: number
          created_at: string
          date: string
          id: string
          nutrition_component: number
          readiness_component: number
          score: number
          training_component: number
          user_id: string
          weight_component: number
        }
        Insert: {
          checkin_component: number
          created_at?: string
          date?: string
          id?: string
          nutrition_component: number
          readiness_component: number
          score: number
          training_component: number
          user_id: string
          weight_component: number
        }
        Update: {
          checkin_component?: number
          created_at?: string
          date?: string
          id?: string
          nutrition_component?: number
          readiness_component?: number
          score?: number
          training_component?: number
          user_id?: string
          weight_component?: number
        }
        Relationships: []
      }
      daily_actions: {
        Row: {
          action: string
          created_at: string
          date: string
          expected_impact: string
          id: string
          pillar: string
          priority: string
          reason: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          date?: string
          expected_impact: string
          id?: string
          pillar: string
          priority: string
          reason: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          date?: string
          expected_impact?: string
          id?: string
          pillar?: string
          priority?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          created_at: string | null
          date: string
          energy_level: number | null
          id: string
          mood: number | null
          muscle_soreness: number | null
          notes: string | null
          readiness_score: number | null
          sleep_hours: number | null
          sleep_quality: number | null
          steps: number | null
          stress_level: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          energy_level?: number | null
          id?: string
          mood?: number | null
          muscle_soreness?: number | null
          notes?: string | null
          readiness_score?: number | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          steps?: number | null
          stress_level?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          energy_level?: number | null
          id?: string
          mood?: number | null
          muscle_soreness?: number | null
          notes?: string | null
          readiness_score?: number | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          steps?: number | null
          stress_level?: number | null
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string | null
          description: string | null
          goal_type: string
          id: string
          status: string
          target_date: string | null
          target_unit: string | null
          target_value: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          goal_type: string
          id?: string
          status?: string
          target_date?: string | null
          target_unit?: string | null
          target_value?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          goal_type?: string
          id?: string
          status?: string
          target_date?: string | null
          target_unit?: string | null
          target_value?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nutrition_logs: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string | null
          date: string
          fat_g: number | null
          id: string
          meal_name: string | null
          meal_type: string
          protein_g: number | null
          user_id: string
          water_ml: number | null
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          date: string
          fat_g?: number | null
          id?: string
          meal_name?: string | null
          meal_type: string
          protein_g?: number | null
          user_id: string
          water_ml?: number | null
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          date?: string
          fat_g?: number | null
          id?: string
          meal_name?: string | null
          meal_type?: string
          protein_g?: number | null
          user_id?: string
          water_ml?: number | null
        }
        Relationships: []
      }
      nutrition_targets: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string | null
          effective_from: string
          fat_g: number | null
          id: string
          protein_g: number | null
          target_type: string
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          effective_from?: string
          fat_g?: number | null
          id?: string
          protein_g?: number | null
          target_type: string
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          effective_from?: string
          fat_g?: number | null
          id?: string
          protein_g?: number | null
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          date_of_birth: string | null
          full_name: string | null
          gender: string | null
          height_cm: number | null
          id: string
          onboarding_completed: boolean | null
          primary_activity: string | null
          primary_goal: string | null
          sleep_target_hours: number | null
          training_days_per_week: number | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id: string
          onboarding_completed?: boolean | null
          primary_activity?: string | null
          primary_goal?: string | null
          sleep_target_hours?: number | null
          training_days_per_week?: number | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          onboarding_completed?: boolean | null
          primary_activity?: string | null
          primary_goal?: string | null
          sleep_target_hours?: number | null
          training_days_per_week?: number | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          activity_type: string
          created_at: string | null
          date: string
          duration_minutes: number
          id: string
          notes: string | null
          rpe: number
          training_load: number | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          date: string
          duration_minutes: number
          id?: string
          notes?: string | null
          rpe: number
          training_load?: number | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          date?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          rpe?: number
          training_load?: number | null
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          created_at: string
          exercise_name: string
          id: string
          reps: number
          rpe: number | null
          sets: number
          sort_order: number
          user_id: string
          weight_kg: number
          workout_id: string
        }
        Insert: {
          created_at?: string
          exercise_name: string
          id?: string
          reps: number
          rpe?: number | null
          sets: number
          sort_order?: number
          user_id: string
          weight_kg?: number
          workout_id: string
        }
        Update: {
          created_at?: string
          exercise_name?: string
          id?: string
          reps?: number
          rpe?: number | null
          sets?: number
          sort_order?: number
          user_id?: string
          weight_kg?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          date: string
          id: string
          name: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          name?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          name?: string | null
          notes?: string | null
          user_id?: string
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
