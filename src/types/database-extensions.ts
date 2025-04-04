
import type { Database as OriginalDatabase } from "@/integrations/supabase/types";

// Extend the original Database type with our new tables
export interface ExtendedDatabase {
  public: {
    Tables: {
      // Include all existing tables from the original Database type
      contact_interactions: OriginalDatabase['public']['Tables']['contact_interactions'];
      contact_reminders: OriginalDatabase['public']['Tables']['contact_reminders'];
      contacts: OriginalDatabase['public']['Tables']['contacts'];
      
      // Add the new tables
      tags: {
        Row: {
          id: string;
          name: string;
          color: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      contact_tags: {
        Row: {
          id: string;
          contact_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          contact_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          contact_id?: string;
          tag_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_tags_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: OriginalDatabase['public']['Views'];
    Functions: OriginalDatabase['public']['Functions'];
    Enums: OriginalDatabase['public']['Enums'];
    CompositeTypes: OriginalDatabase['public']['CompositeTypes'];
  };
}

// Create custom type for Tag and export it for use in components
export type Tag = ExtendedDatabase['public']['Tables']['tags']['Row'];
export type ContactTag = ExtendedDatabase['public']['Tables']['contact_tags']['Row'];

// Define a custom client type for strongly typed queries
import { createClient } from "@supabase/supabase-js";
export type ExtendedClient = ReturnType<typeof createClient<ExtendedDatabase>>;
