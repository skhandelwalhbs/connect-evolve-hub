
import type { Database } from "@/integrations/supabase/types";

export type Tag = Database['public']['Tables']['tags']['Row'];
export type TagWithCount = Tag & { contact_count: number };

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaded_at: string;
}

export interface HistoricalTag {
  id: string;
  name: string;
  color: string;
}
