export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: Database["public"]["Enums"]["user_role"];
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          role?: Database["public"]["Enums"]["user_role"];
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: Database["public"]["Enums"]["user_role"];
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          code: string;
          name: string;
          client_name: string;
          object_type: Database["public"]["Enums"]["project_object_type"];
          location: string;
          description: string | null;
          status: Database["public"]["Enums"]["project_status"];
          start_date: string | null;
          target_end_date: string | null;
          actual_end_date: string | null;
          progress_percent: number;
          floor_plan_url: string | null;
          floor_plan_path: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          client_name: string;
          object_type: Database["public"]["Enums"]["project_object_type"];
          location: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          start_date?: string | null;
          target_end_date?: string | null;
          actual_end_date?: string | null;
          progress_percent?: number;
          floor_plan_url?: string | null;
          floor_plan_path?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          client_name?: string;
          object_type?: Database["public"]["Enums"]["project_object_type"];
          location?: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          start_date?: string | null;
          target_end_date?: string | null;
          actual_end_date?: string | null;
          progress_percent?: number;
          floor_plan_url?: string | null;
          floor_plan_path?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      project_members: {
        Row: {
          project_id: string;
          profile_id: string;
          role: Database["public"]["Enums"]["user_role"];
          is_primary: boolean;
          joined_at: string;
        };
        Insert: {
          project_id: string;
          profile_id: string;
          role?: Database["public"]["Enums"]["user_role"];
          is_primary?: boolean;
          joined_at?: string;
        };
        Update: {
          project_id?: string;
          profile_id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          is_primary?: boolean;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_members_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_members_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      stages: {
        Row: {
          id: string;
          project_id: string;
          checklist_id: string | null;
          responsible_profile_id: string | null;
          name: string;
          sequence: number;
          status: Database["public"]["Enums"]["stage_status"];
          progress_percent: number;
          planned_start_date: string | null;
          planned_end_date: string | null;
          actual_start_date: string | null;
          actual_end_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          checklist_id?: string | null;
          responsible_profile_id?: string | null;
          name: string;
          sequence: number;
          status?: Database["public"]["Enums"]["stage_status"];
          progress_percent?: number;
          planned_start_date?: string | null;
          planned_end_date?: string | null;
          actual_start_date?: string | null;
          actual_end_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          checklist_id?: string | null;
          responsible_profile_id?: string | null;
          name?: string;
          sequence?: number;
          status?: Database["public"]["Enums"]["stage_status"];
          progress_percent?: number;
          planned_start_date?: string | null;
          planned_end_date?: string | null;
          actual_start_date?: string | null;
          actual_end_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stages_checklist_id_fkey";
            columns: ["checklist_id"];
            referencedRelation: "checklists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stages_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stages_responsible_profile_id_fkey";
            columns: ["responsible_profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      checklists: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          description: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checklists_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checklists_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      checklist_items: {
        Row: {
          id: string;
          checklist_id: string;
          sort_order: number;
          title: string;
          description: string | null;
          item_type: Database["public"]["Enums"]["checklist_item_type"];
          expected_value: string | null;
          is_required: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          checklist_id: string;
          sort_order: number;
          title: string;
          description?: string | null;
          item_type?: Database["public"]["Enums"]["checklist_item_type"];
          expected_value?: string | null;
          is_required?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          checklist_id?: string;
          sort_order?: number;
          title?: string;
          description?: string | null;
          item_type?: Database["public"]["Enums"]["checklist_item_type"];
          expected_value?: string | null;
          is_required?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checklist_items_checklist_id_fkey";
            columns: ["checklist_id"];
            referencedRelation: "checklists";
            referencedColumns: ["id"];
          },
        ];
      };
      stage_reports: {
        Row: {
          id: string;
          stage_id: string;
          checklist_id: string | null;
          reported_by: string;
          report_date: string;
          status: Database["public"]["Enums"]["report_status"];
          summary: string;
          inspector_comments: string | null;
          issues: string | null;
          recommendations: string | null;
          health_score: number;
          progress_before: number | null;
          progress_after: number | null;
          ai_summary_text: string | null;
          ai_issues: string | null;
          ai_recommendations: string | null;
          ai_health_status: string | null;
          ai_next_action: string | null;
          ai_model: string | null;
          ai_generated_at: string | null;
          ai_generation_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          stage_id: string;
          checklist_id?: string | null;
          reported_by: string;
          report_date?: string;
          status?: Database["public"]["Enums"]["report_status"];
          summary: string;
          inspector_comments?: string | null;
          issues?: string | null;
          recommendations?: string | null;
          health_score?: number;
          progress_before?: number | null;
          progress_after?: number | null;
          ai_summary_text?: string | null;
          ai_issues?: string | null;
          ai_recommendations?: string | null;
          ai_health_status?: string | null;
          ai_next_action?: string | null;
          ai_model?: string | null;
          ai_generated_at?: string | null;
          ai_generation_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          stage_id?: string;
          checklist_id?: string | null;
          reported_by?: string;
          report_date?: string;
          status?: Database["public"]["Enums"]["report_status"];
          summary?: string;
          inspector_comments?: string | null;
          issues?: string | null;
          recommendations?: string | null;
          health_score?: number;
          progress_before?: number | null;
          progress_after?: number | null;
          ai_summary_text?: string | null;
          ai_issues?: string | null;
          ai_recommendations?: string | null;
          ai_health_status?: string | null;
          ai_next_action?: string | null;
          ai_model?: string | null;
          ai_generated_at?: string | null;
          ai_generation_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stage_reports_checklist_id_fkey";
            columns: ["checklist_id"];
            referencedRelation: "checklists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stage_reports_reported_by_fkey";
            columns: ["reported_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stage_reports_stage_id_fkey";
            columns: ["stage_id"];
            referencedRelation: "stages";
            referencedColumns: ["id"];
          },
        ];
      };
      inspection_item_results: {
        Row: {
          id: string;
          report_id: string;
          checklist_item_id: string;
          result: Database["public"]["Enums"]["inspection_result"];
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          checklist_item_id: string;
          result: Database["public"]["Enums"]["inspection_result"];
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          checklist_item_id?: string;
          result?: Database["public"]["Enums"]["inspection_result"];
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inspection_item_results_checklist_item_id_fkey";
            columns: ["checklist_item_id"];
            referencedRelation: "checklist_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inspection_item_results_report_id_fkey";
            columns: ["report_id"];
            referencedRelation: "stage_reports";
            referencedColumns: ["id"];
          },
        ];
      };
      report_photos: {
        Row: {
          id: string;
          report_id: string;
          storage_path: string;
          caption: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          storage_path: string;
          caption?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          storage_path?: string;
          caption?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "report_photos_report_id_fkey";
            columns: ["report_id"];
            referencedRelation: "stage_reports";
            referencedColumns: ["id"];
          },
        ];
      };
      safety_violations: {
        Row: {
          id: string;
          project_id: string;
          stage_id: string | null;
          reported_by: string;
          assigned_to: string | null;
          violation_type: string;
          severity: Database["public"]["Enums"]["severity_level"];
          status: Database["public"]["Enums"]["violation_status"];
          title: string;
          details: string | null;
          location_note: string | null;
          occurred_at: string;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          stage_id?: string | null;
          reported_by: string;
          assigned_to?: string | null;
          violation_type: string;
          severity?: Database["public"]["Enums"]["severity_level"];
          status?: Database["public"]["Enums"]["violation_status"];
          title: string;
          details?: string | null;
          location_note?: string | null;
          occurred_at?: string;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          stage_id?: string | null;
          reported_by?: string;
          assigned_to?: string | null;
          violation_type?: string;
          severity?: Database["public"]["Enums"]["severity_level"];
          status?: Database["public"]["Enums"]["violation_status"];
          title?: string;
          details?: string | null;
          location_note?: string | null;
          occurred_at?: string;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "safety_violations_assigned_to_fkey";
            columns: ["assigned_to"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "safety_violations_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "safety_violations_reported_by_fkey";
            columns: ["reported_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "safety_violations_stage_id_fkey";
            columns: ["stage_id"];
            referencedRelation: "stages";
            referencedColumns: ["id"];
          },
        ];
      };
      safety_violation_photos: {
        Row: {
          id: string;
          violation_id: string;
          storage_path: string;
          caption: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          violation_id: string;
          storage_path: string;
          caption?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          violation_id?: string;
          storage_path?: string;
          caption?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "safety_violation_photos_violation_id_fkey";
            columns: ["violation_id"];
            referencedRelation: "safety_violations";
            referencedColumns: ["id"];
          },
        ];
      };
      micro_lessons: {
        Row: {
          id: string;
          violation_id: string;
          target_profile_id: string | null;
          title: string;
          violated_rule: string;
          why_dangerous: string;
          correct_method: string;
          knowledge_check_question: string;
          knowledge_check_answer: string | null;
          status: Database["public"]["Enums"]["lesson_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          violation_id: string;
          target_profile_id?: string | null;
          title: string;
          violated_rule: string;
          why_dangerous: string;
          correct_method: string;
          knowledge_check_question: string;
          knowledge_check_answer?: string | null;
          status?: Database["public"]["Enums"]["lesson_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          violation_id?: string;
          target_profile_id?: string | null;
          title?: string;
          violated_rule?: string;
          why_dangerous?: string;
          correct_method?: string;
          knowledge_check_question?: string;
          knowledge_check_answer?: string | null;
          status?: Database["public"]["Enums"]["lesson_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "micro_lessons_target_profile_id_fkey";
            columns: ["target_profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "micro_lessons_violation_id_fkey";
            columns: ["violation_id"];
            referencedRelation: "safety_violations";
            referencedColumns: ["id"];
          },
        ];
      };
      ar_plans: {
        Row: {
          id: string;
          project_id: string;
          stage_id: string | null;
          uploaded_by: string;
          title: string;
          wall_photo_path: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          stage_id?: string | null;
          uploaded_by: string;
          title: string;
          wall_photo_path: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          stage_id?: string | null;
          uploaded_by?: string;
          title?: string;
          wall_photo_path?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ar_plans_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ar_plans_stage_id_fkey";
            columns: ["stage_id"];
            referencedRelation: "stages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ar_plans_uploaded_by_fkey";
            columns: ["uploaded_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ar_markers: {
        Row: {
          id: string;
          ar_plan_id: string;
          marker_type: Database["public"]["Enums"]["marker_type"];
          x_percent: number;
          y_percent: number;
          label: string | null;
          notes: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ar_plan_id: string;
          marker_type: Database["public"]["Enums"]["marker_type"];
          x_percent: number;
          y_percent: number;
          label?: string | null;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ar_plan_id?: string;
          marker_type?: Database["public"]["Enums"]["marker_type"];
          x_percent?: number;
          y_percent?: number;
          label?: string | null;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ar_markers_ar_plan_id_fkey";
            columns: ["ar_plan_id"];
            referencedRelation: "ar_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      acts: {
        Row: {
          id: string;
          project_id: string;
          stage_id: string;
          prepared_by: string;
          signed_by: string | null;
          act_number: string;
          status: Database["public"]["Enums"]["act_status"];
          summary: string | null;
          signed_at: string | null;
          pdf_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          stage_id: string;
          prepared_by: string;
          signed_by?: string | null;
          act_number: string;
          status?: Database["public"]["Enums"]["act_status"];
          summary?: string | null;
          signed_at?: string | null;
          pdf_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          stage_id?: string;
          prepared_by?: string;
          signed_by?: string | null;
          act_number?: string;
          status?: Database["public"]["Enums"]["act_status"];
          summary?: string | null;
          signed_at?: string | null;
          pdf_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "acts_prepared_by_fkey";
            columns: ["prepared_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "acts_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "acts_signed_by_fkey";
            columns: ["signed_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "acts_stage_id_fkey";
            columns: ["stage_id"];
            referencedRelation: "stages";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          project_id: string | null;
          stage_id: string | null;
          report_id: string | null;
          violation_id: string | null;
          act_id: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          title: string;
          body: string;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          project_id?: string | null;
          stage_id?: string | null;
          report_id?: string | null;
          violation_id?: string | null;
          act_id?: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          title: string;
          body: string;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          project_id?: string | null;
          stage_id?: string | null;
          report_id?: string | null;
          violation_id?: string | null;
          act_id?: string | null;
          type?: Database["public"]["Enums"]["notification_type"];
          title?: string;
          body?: string;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_act_id_fkey";
            columns: ["act_id"];
            referencedRelation: "acts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_report_id_fkey";
            columns: ["report_id"];
            referencedRelation: "stage_reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_stage_id_fkey";
            columns: ["stage_id"];
            referencedRelation: "stages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_violation_id_fkey";
            columns: ["violation_id"];
            referencedRelation: "safety_violations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      save_ar_plan_with_markers: {
        Args: {
          p_plan_id: string | null;
          p_project_id: string;
          p_stage_id: string | null;
          p_uploaded_by: string;
          p_title: string;
          p_wall_photo_path: string | null;
          p_notes: string | null;
          p_markers: Json;
        };
        Returns: string;
      };
    };
    Enums: {
      act_status: "draft" | "pending_signature" | "signed" | "archived";
      checklist_item_type: "boolean" | "text" | "number" | "photo";
      inspection_result: "passed" | "failed" | "not_applicable";
      lesson_status: "draft" | "published" | "assigned" | "completed";
      marker_type: "socket" | "pipe" | "switch" | "light";
      notification_type:
        | "project"
        | "stage"
        | "report"
        | "safety"
        | "lesson"
        | "act"
        | "system";
      project_status: "planned" | "active" | "on_hold" | "completed" | "archived";
      project_object_type:
        | "apartment"
        | "residential_building"
        | "office"
        | "retail"
        | "industrial"
        | "renovation"
        | "fit_out"
        | "other";
      report_status: "draft" | "submitted" | "approved" | "rejected";
      severity_level: "low" | "medium" | "high" | "critical";
      stage_status: "planned" | "in_progress" | "review" | "blocked" | "complete";
      user_role: "admin" | "foreman" | "engineer" | "worker";
      violation_status: "open" | "in_review" | "resolved" | "dismissed";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type PublicSchema = Database["public"];
