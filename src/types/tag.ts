
import type { Database } from "@/integrations/supabase/types";

export type Tag = Database['public']['Tables']['tags']['Row'];
export type TagWithCount = Tag & { contact_count: number };
