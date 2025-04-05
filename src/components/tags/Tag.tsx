
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagProps {
  id: string;
  name: string;
  color: string;
  onRemove?: () => void;
  className?: string;
  removable?: boolean;
}

export function Tag({ id, name, color, onRemove, className, removable = false }: TagProps) {
  return (
    <Badge 
      className={cn(
        "flex items-center gap-1 px-2 py-0.5 text-xs font-medium whitespace-nowrap", 
        className
      )}
      style={{ backgroundColor: color, color: getContrastColor(color) }}
    >
      {name}
      {removable && onRemove && (
        <X 
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

// Helper function to determine if text should be white or black based on background color
function getContrastColor(hexColor: string): string {
  // Remove the # if it exists
  const hex = hexColor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance using perceived brightness formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
