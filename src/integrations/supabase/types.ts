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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      circles: {
        Row: {
          connected_profile_id: string
          created_at: string
          id: string
          profile_id: string
          venue_id: string
        }
        Insert: {
          connected_profile_id: string
          created_at?: string
          id?: string
          profile_id: string
          venue_id: string
        }
        Update: {
          connected_profile_id?: string
          created_at?: string
          id?: string
          profile_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circles_connected_profile_id_fkey"
            columns: ["connected_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circles_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_requests: {
        Row: {
          created_at: string
          icebreaker: string | null
          id: string
          receiver_anchor: string | null
          receiver_id: string
          sender_anchor: string | null
          sender_id: string
          status: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          icebreaker?: string | null
          id?: string
          receiver_anchor?: string | null
          receiver_id: string
          sender_anchor?: string | null
          sender_id: string
          status?: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          icebreaker?: string | null
          id?: string
          receiver_anchor?: string | null
          receiver_id?: string
          sender_anchor?: string | null
          sender_id?: string
          status?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          event_date: string
          id: string
          intent: string | null
          max_participants: number | null
          room_type: string
          title: string
          updated_at: string
          venue_id: string | null
          vibe: string | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          event_date: string
          id?: string
          intent?: string | null
          max_participants?: number | null
          room_type: string
          title: string
          updated_at?: string
          venue_id?: string | null
          vibe?: string | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          event_date?: string
          id?: string
          intent?: string | null
          max_participants?: number | null
          room_type?: string
          title?: string
          updated_at?: string
          venue_id?: string | null
          vibe?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_band: string
          created_at: string
          email: string | null
          gender_preference: string
          hometown: string
          id: string
          nickname: string
          phone: string | null
          photo_url: string | null
          profession: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          age_band: string
          created_at?: string
          email?: string | null
          gender_preference?: string
          hometown?: string
          id?: string
          nickname: string
          phone?: string | null
          photo_url?: string | null
          profession?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          age_band?: string
          created_at?: string
          email?: string | null
          gender_preference?: string
          hometown?: string
          id?: string
          nickname?: string
          phone?: string | null
          photo_url?: string | null
          profession?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      room_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          profile_id: string
          room_type: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          profile_id: string
          room_type: string
          venue_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          profile_id?: string
          room_type?: string
          venue_id?: string
        }
        Relationships: []
      }
      room_sessions: {
        Row: {
          id: string
          is_active: boolean
          joined_at: string
          profile_id: string
          rhythm: string | null
          room_type: string
          snoozed: boolean
          updated_at: string
          venue_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          joined_at?: string
          profile_id: string
          rhythm?: string | null
          room_type: string
          snoozed?: boolean
          updated_at?: string
          venue_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          joined_at?: string
          profile_id?: string
          rhythm?: string | null
          room_type?: string
          snoozed?: boolean
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_sessions_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string
          created_at: string
          id: string
          image_url: string | null
          lat: number | null
          lng: number | null
          name: string
          room_type: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          name: string
          room_type: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          name?: string
          room_type?: string
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
