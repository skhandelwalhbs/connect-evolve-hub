
import { Tag } from "./Tag";
import type { Database } from "@/integrations/supabase/types";

type Tag = Database['public']['Tables']['tags']['Row'];

interface SelectedTagsListProps {
  tags: Tag[];
  onRemove: (tag: Tag) => void;
}

export function SelectedTagsList({ tags, onRemove }: SelectedTagsListProps) {
  if (tags.length === 0) return null;
  
  return (
    <div className="mt-3 pt-3 border-t">
      <div className="text-sm font-medium mb-2">Selected tags:</div>
      <div className="flex flex-wrap gap-1">
        {tags.map(tag => (
          <Tag 
            key={tag.id} 
            id={tag.id} 
            name={tag.name} 
            color={tag.color}
            removable
            onRemove={() => onRemove(tag)}
          />
        ))}
      </div>
    </div>
  );
}
