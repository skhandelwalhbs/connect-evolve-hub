
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagGridItemProps {
  id: string;
  name: string;
  color: string;
  isSelected: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export function TagGridItem({ 
  id, 
  name, 
  color, 
  isSelected, 
  disabled, 
  onToggle 
}: TagGridItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
        isSelected 
          ? "bg-accent text-accent-foreground" 
          : "hover:bg-muted",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => {
        if (!disabled) {
          onToggle();
        }
      }}
    >
      <div
        className="h-3 w-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm truncate flex-1">{name}</span>
      {isSelected && (
        <Check className="h-4 w-4 flex-shrink-0" />
      )}
    </div>
  );
}
