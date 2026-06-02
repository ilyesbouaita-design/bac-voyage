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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string
          criteria: Json | null
          description_ar: string | null
          description_fr: string | null
          icon: string | null
          id: string
          slug: string
          title_ar: string | null
          title_fr: string
        }
        Insert: {
          created_at?: string
          criteria?: Json | null
          description_ar?: string | null
          description_fr?: string | null
          icon?: string | null
          id?: string
          slug: string
          title_ar?: string | null
          title_fr: string
        }
        Update: {
          created_at?: string
          criteria?: Json | null
          description_ar?: string | null
          description_fr?: string | null
          icon?: string | null
          id?: string
          slug?: string
          title_ar?: string | null
          title_fr?: string
        }
        Relationships: []
      }
      exam_answers: {
        Row: {
          attempt_id: string
          feedback_ar: string | null
          feedback_fr: string | null
          graded_at: string | null
          graded_method: Database["public"]["Enums"]["grade_method"] | null
          id: string
          is_correct: boolean | null
          question_id: string
          response: Json | null
          score: number | null
        }
        Insert: {
          attempt_id: string
          feedback_ar?: string | null
          feedback_fr?: string | null
          graded_at?: string | null
          graded_method?: Database["public"]["Enums"]["grade_method"] | null
          id?: string
          is_correct?: boolean | null
          question_id: string
          response?: Json | null
          score?: number | null
        }
        Update: {
          attempt_id?: string
          feedback_ar?: string | null
          feedback_fr?: string | null
          graded_at?: string | null
          graded_method?: Database["public"]["Enums"]["grade_method"] | null
          id?: string
          is_correct?: boolean | null
          question_id?: string
          response?: Json | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "exam_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          exam_id: string
          graded_at: string | null
          id: string
          max_score: number | null
          score: number | null
          started_at: string
          status: Database["public"]["Enums"]["attempt_status"]
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          exam_id: string
          graded_at?: string | null
          id?: string
          max_score?: number | null
          score?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          exam_id?: string
          graded_at?: string | null
          id?: string
          max_score?: number | null
          score?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          content: Json
          grade_method: Database["public"]["Enums"]["grade_method"]
          id: string
          order_index: number
          points: number
          prompt_ar: string | null
          prompt_de: string | null
          prompt_fr: string | null
          rubric: Json | null
          section_id: string
          type: Database["public"]["Enums"]["exercise_type"]
        }
        Insert: {
          content?: Json
          grade_method?: Database["public"]["Enums"]["grade_method"]
          id?: string
          order_index?: number
          points?: number
          prompt_ar?: string | null
          prompt_de?: string | null
          prompt_fr?: string | null
          rubric?: Json | null
          section_id: string
          type: Database["public"]["Enums"]["exercise_type"]
        }
        Update: {
          content?: Json
          grade_method?: Database["public"]["Enums"]["grade_method"]
          id?: string
          order_index?: number
          points?: number
          prompt_ar?: string | null
          prompt_de?: string | null
          prompt_fr?: string | null
          rubric?: Json | null
          section_id?: string
          type?: Database["public"]["Enums"]["exercise_type"]
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "exam_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_sections: {
        Row: {
          exam_id: string
          id: string
          instructions_ar: string | null
          instructions_fr: string | null
          kind: string
          order_index: number
          passage_de: string | null
          title_ar: string | null
          title_fr: string | null
        }
        Insert: {
          exam_id: string
          id?: string
          instructions_ar?: string | null
          instructions_fr?: string | null
          kind: string
          order_index?: number
          passage_de?: string | null
          title_ar?: string | null
          title_fr?: string | null
        }
        Update: {
          exam_id?: string
          id?: string
          instructions_ar?: string | null
          instructions_fr?: string | null
          kind?: string
          order_index?: number
          passage_de?: string | null
          title_ar?: string | null
          title_fr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_sections_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          cefr_level: Database["public"]["Enums"]["cefr_level"] | null
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_fr: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean
          slug: string | null
          title_ar: string | null
          title_fr: string
          total_points: number
          updated_at: string
        }
        Insert: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_fr?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean
          slug?: string | null
          title_ar?: string | null
          title_fr: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_fr?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean
          slug?: string | null
          title_ar?: string | null
          title_fr?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          cefr_level: Database["public"]["Enums"]["cefr_level"] | null
          content: Json
          created_at: string
          created_by: string | null
          id: string
          instructions_ar: string | null
          instructions_fr: string | null
          is_published: boolean
          order_index: number
          pillar: Database["public"]["Enums"]["pillar"]
          points: number
          set_id: string | null
          title_ar: string | null
          title_fr: string | null
          topic_id: string | null
          type: Database["public"]["Enums"]["exercise_type"]
          updated_at: string
        }
        Insert: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          instructions_ar?: string | null
          instructions_fr?: string | null
          is_published?: boolean
          order_index?: number
          pillar: Database["public"]["Enums"]["pillar"]
          points?: number
          set_id?: string | null
          title_ar?: string | null
          title_fr?: string | null
          topic_id?: string | null
          type: Database["public"]["Enums"]["exercise_type"]
          updated_at?: string
        }
        Update: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          instructions_ar?: string | null
          instructions_fr?: string | null
          is_published?: boolean
          order_index?: number
          pillar?: Database["public"]["Enums"]["pillar"]
          points?: number
          set_id?: string | null
          title_ar?: string | null
          title_fr?: string | null
          topic_id?: string | null
          type?: Database["public"]["Enums"]["exercise_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "vocab_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "grammar_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      grammar_topics: {
        Row: {
          cefr_level: Database["public"]["Enums"]["cefr_level"] | null
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_fr: string | null
          id: string
          is_published: boolean
          order_index: number
          slug: string | null
          title_ar: string | null
          title_fr: string
          updated_at: string
        }
        Insert: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_fr?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          slug?: string | null
          title_ar?: string | null
          title_fr: string
          updated_at?: string
        }
        Update: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_fr?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          slug?: string | null
          title_ar?: string | null
          title_fr?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grammar_topics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          body_ar: Json | null
          body_fr: Json | null
          created_at: string
          id: string
          is_published: boolean
          order_index: number
          title_ar: string | null
          title_fr: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          body_ar?: Json | null
          body_fr?: Json | null
          created_at?: string
          id?: string
          is_published?: boolean
          order_index?: number
          title_ar?: string | null
          title_fr: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          body_ar?: Json | null
          body_fr?: Json | null
          created_at?: string
          id?: string
          is_published?: boolean
          order_index?: number
          title_ar?: string | null
          title_fr?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "grammar_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_streak: number
          display_name: string | null
          id: string
          last_active_date: string | null
          level: number
          locale: Database["public"]["Enums"]["app_locale"]
          longest_streak: number
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          id: string
          last_active_date?: string | null
          level?: number
          locale?: Database["public"]["Enums"]["app_locale"]
          longest_streak?: number
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          id?: string
          last_active_date?: string | null
          level?: number
          locale?: Database["public"]["Enums"]["app_locale"]
          longest_streak?: number
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          student_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          student_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vocab_sets: {
        Row: {
          cefr_level: Database["public"]["Enums"]["cefr_level"] | null
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          order_index: number
          slug: string | null
          theme: string | null
          title_ar: string | null
          title_fr: string
          updated_at: string
        }
        Insert: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          slug?: string | null
          theme?: string | null
          title_ar?: string | null
          title_fr: string
          updated_at?: string
        }
        Update: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          slug?: string | null
          theme?: string | null
          title_ar?: string | null
          title_fr?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocab_sets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vocab_words: {
        Row: {
          article: string | null
          audio_url: string | null
          created_at: string
          example_ar: string | null
          example_de: string | null
          example_fr: string | null
          id: string
          image_url: string | null
          order_index: number
          plural_de: string | null
          set_id: string
          term_de: string
          translation_ar: string | null
          translation_fr: string | null
        }
        Insert: {
          article?: string | null
          audio_url?: string | null
          created_at?: string
          example_ar?: string | null
          example_de?: string | null
          example_fr?: string | null
          id?: string
          image_url?: string | null
          order_index?: number
          plural_de?: string | null
          set_id: string
          term_de: string
          translation_ar?: string | null
          translation_fr?: string | null
        }
        Update: {
          article?: string | null
          audio_url?: string | null
          created_at?: string
          example_ar?: string | null
          example_de?: string | null
          example_fr?: string | null
          id?: string
          image_url?: string | null
          order_index?: number
          plural_de?: string | null
          set_id?: string
          term_de?: string
          translation_ar?: string | null
          translation_fr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vocab_words_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "vocab_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          ref_id: string | null
          ref_type: string | null
          source: string
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          ref_id?: string | null
          ref_type?: string | null
          source: string
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          ref_id?: string | null
          ref_type?: string | null
          source?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_locale: "fr" | "ar"
      attempt_status: "in_progress" | "submitted" | "graded"
      cefr_level: "A1" | "A2" | "B1" | "B2"
      exercise_type:
        | "mcq"
        | "true_false"
        | "fill_blank"
        | "cloze"
        | "matching"
        | "ordering"
        | "short_text"
        | "flashcard"
        | "essay"
      grade_method: "auto" | "ai" | "manual"
      pillar: "grammatik" | "wortschatz" | "exam"
      user_role: "admin" | "student"
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
    Enums: {
      app_locale: ["fr", "ar"],
      attempt_status: ["in_progress", "submitted", "graded"],
      cefr_level: ["A1", "A2", "B1", "B2"],
      exercise_type: [
        "mcq",
        "true_false",
        "fill_blank",
        "cloze",
        "matching",
        "ordering",
        "short_text",
        "flashcard",
        "essay",
      ],
      grade_method: ["auto", "ai", "manual"],
      pillar: ["grammatik", "wortschatz", "exam"],
      user_role: ["admin", "student"],
    },
  },
} as const
