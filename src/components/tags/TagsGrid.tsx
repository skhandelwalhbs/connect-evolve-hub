
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TagGridItem } from "./TagGridItem";
import type { Database } from "@/integrations/supabase/types";

type Tag = Database['public']['Tables']['tags']['Row'];

interface TagsGridProps {
  tags: Tag[];
  selectedTags: Tag[];
  isLoading: boolean;
  disabled: boolean;
  onToggleTag: (tag: Tag) => void;
}

export function TagsGrid({ 
  tags, 
  selectedTags, 
  isLoading, 
  disabled,
  onToggleTag 
}: TagsGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (tags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No tags available. Create your first tag.
      </p>
    );
  }
  
  return (
    <ScrollArea className="max-h-[180px]">
      <div className="grid grid-cols-2 gap-2 mt-1">
        {tags.map(tag => {
          const isSelected = selectedTags.some(t => t.id === tag.id);
          return (
            <TagGridItem 
              key={tag.id}
              id={tag.id}
              name={tag.name}
              color={tag.color}
              isSelected={isSelected}
              disabled={disabled}
              onToggle={() => onToggleTag(tag)}
            />
          );
        })}
      </div>
    </ScrollArea>
  );
}
