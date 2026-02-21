// =============================================================================
// Vita Social -- Database Type Definitions
// Matches the Supabase / PostgreSQL schema in supabase/migrations/001_initial_schema.sql
// =============================================================================
// Generated-style types for use with createClient<Database>().
// =============================================================================

/** PostGIS geography point represented as { lat, lng } in application code. */
export interface GeoPoint {
  lat: number;
  lng: number;
}

// =============================================================================
// Database root type -- used with Supabase client
// =============================================================================

export type Database = {
  public: {
    Tables: {
      // -----------------------------------------------------------------------
      // profiles
      // -----------------------------------------------------------------------
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string | null;
          bio: string | null;
          gender: string | null;
          birthday: string | null;
          avatar_url: string | null;
          photos: string[];
          interests: string[];
          location: unknown | null; // PostGIS geography(point, 4326)
          location_name: string | null;
          verification_level: Database["public"]["Enums"]["verification_level"];
          is_online: boolean;
          last_seen: string | null;
          gold_subscriber: boolean;
          gold_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name: string;
          last_name?: string | null;
          bio?: string | null;
          gender?: string | null;
          birthday?: string | null;
          avatar_url?: string | null;
          photos?: string[];
          interests?: string[];
          location?: unknown | null;
          location_name?: string | null;
          verification_level?: Database["public"]["Enums"]["verification_level"];
          is_online?: boolean;
          last_seen?: string | null;
          gold_subscriber?: boolean;
          gold_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never; // primary key cannot be updated
          first_name?: string;
          last_name?: string | null;
          bio?: string | null;
          gender?: string | null;
          birthday?: string | null;
          avatar_url?: string | null;
          photos?: string[];
          interests?: string[];
          location?: unknown | null;
          location_name?: string | null;
          verification_level?: Database["public"]["Enums"]["verification_level"];
          is_online?: boolean;
          last_seen?: string | null;
          gold_subscriber?: boolean;
          gold_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      // swipe_actions
      // -----------------------------------------------------------------------
      swipe_actions: {
        Row: {
          id: string;
          swiper_id: string;
          swiped_id: string;
          action: Database["public"]["Enums"]["swipe_action"];
          created_at: string;
        };
        Insert: {
          id?: string;
          swiper_id: string;
          swiped_id: string;
          action: Database["public"]["Enums"]["swipe_action"];
          created_at?: string;
        };
        Update: {
          id?: never;
          swiper_id?: string;
          swiped_id?: string;
          action?: Database["public"]["Enums"]["swipe_action"];
          created_at?: string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      // matches
      // -----------------------------------------------------------------------
      matches: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          matched_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user1_id: string;
          user2_id: string;
          matched_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: never;
          user1_id?: string;
          user2_id?: string;
          matched_at?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      // conversations
      // -----------------------------------------------------------------------
      conversations: {
        Row: {
          id: string;
          match_id: string;
          last_message_text: string | null;
          last_message_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          last_message_text?: string | null;
          last_message_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          match_id?: string;
          last_message_text?: string | null;
          last_message_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      // messages
      // -----------------------------------------------------------------------
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type: Database["public"]["Enums"]["message_type"];
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type?: Database["public"]["Enums"]["message_type"];
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          message_type?: Database["public"]["Enums"]["message_type"];
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      // groups
      // -----------------------------------------------------------------------
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string | null;
          cover_image_url: string | null;
          creator_id: string;
          privacy: Database["public"]["Enums"]["group_privacy"];
          max_members: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category?: string | null;
          cover_image_url?: string | null;
          creator_id: string;
          privacy?: Database["public"]["Enums"]["group_privacy"];
          max_members?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          name?: string;
          description?: string | null;
          category?: string | null;
          cover_image_url?: string | null;
          creator_id?: string;
          privacy?: Database["public"]["Enums"]["group_privacy"];
          max_members?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      // group_members
      // -----------------------------------------------------------------------
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["group_role"];
          days_since_last_checkin: number;
          last_checkin_at: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["group_role"];
          days_since_last_checkin?: number;
          last_checkin_at?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: never;
          group_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["group_role"];
          days_since_last_checkin?: number;
          last_checkin_at?: string | null;
          joined_at?: string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      // group_posts
      // -----------------------------------------------------------------------
      group_posts: {
        Row: {
          id: string;
          group_id: string;
          author_id: string;
          content: string;
          image_url: string | null;
          likes_count: number;
          comments_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          author_id: string;
          content: string;
          image_url?: string | null;
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
        };
        Update: {
          id?: never;
          group_id?: string;
          author_id?: string;
          content?: string;
          image_url?: string | null;
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      // events
      // -----------------------------------------------------------------------
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          host_id: string;
          group_id: string | null;
          location: unknown; // PostGIS geography(point, 4326)
          location_name: string;
          location_address: string | null;
          starts_at: string;
          ends_at: string;
          visibility: Database["public"]["Enums"]["event_visibility"];
          max_attendees: number | null;
          is_residential: boolean;
          cover_image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          host_id: string;
          group_id?: string | null;
          location: unknown;
          location_name: string;
          location_address?: string | null;
          starts_at: string;
          ends_at: string;
          visibility?: Database["public"]["Enums"]["event_visibility"];
          max_attendees?: number | null;
          is_residential?: boolean;
          cover_image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          title?: string;
          description?: string | null;
          host_id?: string;
          group_id?: string | null;
          location?: unknown;
          location_name?: string;
          location_address?: string | null;
          starts_at?: string;
          ends_at?: string;
          visibility?: Database["public"]["Enums"]["event_visibility"];
          max_attendees?: number | null;
          is_residential?: boolean;
          cover_image_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      // event_attendees
      // -----------------------------------------------------------------------
      event_attendees: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          status: Database["public"]["Enums"]["rsvp_status"];
          checked_in: boolean;
          checked_in_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          status?: Database["public"]["Enums"]["rsvp_status"];
          checked_in?: boolean;
          checked_in_at?: string | null;
        };
        Update: {
          id?: never;
          event_id?: string;
          user_id?: string;
          status?: Database["public"]["Enums"]["rsvp_status"];
          checked_in?: boolean;
          checked_in_at?: string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      // event_checkins
      // -----------------------------------------------------------------------
      event_checkins: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          location: unknown; // PostGIS geography(point, 4326)
          distance_from_event: number;
          is_valid: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          location: unknown;
          distance_from_event: number;
          is_valid?: boolean;
          created_at?: string;
        };
        Update: {
          id?: never;
          event_id?: string;
          user_id?: string;
          location?: unknown;
          distance_from_event?: number;
          is_valid?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      // reports
      // -----------------------------------------------------------------------
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string | null;
          reported_content_type: Database["public"]["Enums"]["report_content_type"];
          reported_content_id: string;
          reason: string;
          description: string | null;
          status: Database["public"]["Enums"]["report_status"];
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id?: string | null;
          reported_content_type: Database["public"]["Enums"]["report_content_type"];
          reported_content_id: string;
          reason: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          created_at?: string;
        };
        Update: {
          id?: never;
          reporter_id?: string;
          reported_user_id?: string | null;
          reported_content_type?: Database["public"]["Enums"]["report_content_type"];
          reported_content_id?: string;
          reason?: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          created_at?: string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      // blocks
      // -----------------------------------------------------------------------
      blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          id?: never;
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      // notifications
      // -----------------------------------------------------------------------
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: Database["public"]["Enums"]["notification_type"];
          title: string;
          body: string | null;
          data: Record<string, unknown>;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: Database["public"]["Enums"]["notification_type"];
          title: string;
          body?: string | null;
          data?: Record<string, unknown>;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: never;
          user_id?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          title?: string;
          body?: string | null;
          data?: Record<string, unknown>;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };

    Views: Record<string, never>;

    Functions: {
      is_blocked: {
        Args: { user_a: string; user_b: string };
        Returns: boolean;
      };
      is_conversation_participant: {
        Args: { p_user_id: string; p_conversation_id: string };
        Returns: boolean;
      };
      increment_days_since_last_checkin: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };

    Enums: {
      verification_level: "none" | "green" | "blue" | "gold";
      swipe_action: "like" | "pass" | "super_like";
      message_type: "text" | "image" | "icebreaker" | "system";
      group_privacy: "open" | "closed" | "secret";
      group_role: "admin" | "moderator" | "member";
      event_visibility: "public" | "group" | "friends";
      rsvp_status: "going" | "maybe" | "declined";
      report_content_type: "user" | "message" | "group_post" | "event";
      report_status: "pending" | "reviewed" | "resolved" | "dismissed";
      notification_type:
        | "match"
        | "message"
        | "event_reminder"
        | "group_invite"
        | "health_warning"
        | "checkin_reminder";
    };
  };
};

// =============================================================================
// Convenience aliases for Row types (used throughout the application)
// =============================================================================

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type SwipeAction = Database["public"]["Tables"]["swipe_actions"]["Row"];
export type SwipeActionInsert = Database["public"]["Tables"]["swipe_actions"]["Insert"];

export type Match = Database["public"]["Tables"]["matches"]["Row"];
export type MatchUpdate = Database["public"]["Tables"]["matches"]["Update"];

export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];

export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];

export type Group = Database["public"]["Tables"]["groups"]["Row"];
export type GroupInsert = Database["public"]["Tables"]["groups"]["Insert"];
export type GroupUpdate = Database["public"]["Tables"]["groups"]["Update"];

export type GroupMember = Database["public"]["Tables"]["group_members"]["Row"];
export type GroupMemberInsert = Database["public"]["Tables"]["group_members"]["Insert"];
export type GroupMemberUpdate = Database["public"]["Tables"]["group_members"]["Update"];

export type GroupPost = Database["public"]["Tables"]["group_posts"]["Row"];
export type GroupPostInsert = Database["public"]["Tables"]["group_posts"]["Insert"];

export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

export type EventAttendee = Database["public"]["Tables"]["event_attendees"]["Row"];
export type EventAttendeeInsert = Database["public"]["Tables"]["event_attendees"]["Insert"];
export type EventAttendeeUpdate = Database["public"]["Tables"]["event_attendees"]["Update"];

export type EventCheckin = Database["public"]["Tables"]["event_checkins"]["Row"];
export type EventCheckinInsert = Database["public"]["Tables"]["event_checkins"]["Insert"];

export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"];

export type Block = Database["public"]["Tables"]["blocks"]["Row"];
export type BlockInsert = Database["public"]["Tables"]["blocks"]["Insert"];

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationUpdate = Database["public"]["Tables"]["notifications"]["Update"];

// =============================================================================
// Enum value aliases
// =============================================================================

export type VerificationLevel = Database["public"]["Enums"]["verification_level"];
export type SwipeActionType = Database["public"]["Enums"]["swipe_action"];
export type MessageType = Database["public"]["Enums"]["message_type"];
export type GroupPrivacy = Database["public"]["Enums"]["group_privacy"];
export type GroupRole = Database["public"]["Enums"]["group_role"];
export type EventVisibility = Database["public"]["Enums"]["event_visibility"];
export type RsvpStatus = Database["public"]["Enums"]["rsvp_status"];
export type ReportContentType = Database["public"]["Enums"]["report_content_type"];
export type ReportStatus = Database["public"]["Enums"]["report_status"];
export type NotificationType = Database["public"]["Enums"]["notification_type"];

// =============================================================================
// Legacy / Backward-Compatible Types
// =============================================================================
// The following types preserve compatibility with existing mock data and API
// services that were written against the original schema. They will be removed
// once those modules are migrated to use the new Profile-based types.
// =============================================================================

/**
 * @deprecated Use `Profile` instead. This type exists only for backward
 * compatibility with mock data and prototype API services.
 */
export interface User {
  id: string;
  phone_number: string;
  first_name: string;
  birthdate: string;
  gender: "male" | "female" | "non-binary" | "other";
  bio: string | null;
  verification_level: "none" | "photo" | "id";
  location: GeoPoint | null;
  last_active_at: string;
  created_at: string;
  subscription_tier: "free" | "plus" | "premium";
  avatar_url: string | null;
  photos: string[];
  interests: string[];
}
