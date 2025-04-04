
import { Badge } from "@/components/ui/badge";
import { XIcon } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Tag = Database['public']['Tables']['tags']['Row'];

interface TagProps {
  tag: Tag;
  onRemove?: () => void;
  removable?: boolean;
  className?: string;
}

export function Tag({ tag, onRemove, removable = false, className }: TagProps) {
  return (
    <Badge
      className={`px-2 py-0.5 gap-1 ${className}`}
      style={{
        backgroundColor: tag.color,
        color: getContrastColor(tag.color),
      }}
    >
      {tag.name}
      {removable && onRemove && (
        <XIcon
          className="h-3 w-3 cursor-pointer hover:opacity-80"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </Badge>
  );
}

// Helper function to determine if text should be light or dark based on background color
function getContrastColor(hexColor: string): string {
  // Remove the hash if it exists
  const color = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
  
  // Convert to RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark colors, black for light colors
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
