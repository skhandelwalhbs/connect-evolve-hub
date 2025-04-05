
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Tag } from "./Tag";
import type { TagWithCount } from "@/types/tag";

interface TagListItemProps {
  tag: TagWithCount;
  onEdit: (tag: TagWithCount) => void;
  onDelete: (tag: TagWithCount) => void;
}

export function TagListItem({ tag, onEdit, onDelete }: TagListItemProps) {
  return (
    <div 
      className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
    >
      <div className="flex items-center gap-2">
        <div 
          className="h-4 w-4 rounded-full" 
          style={{ backgroundColor: tag.color }}
        />
        <Tag 
          id={tag.id} 
          name={tag.name} 
          color={tag.color}
        />
        <span className="text-xs text-muted-foreground ml-1">
          {tag.contact_count > 0 ? `(${tag.contact_count} contact${tag.contact_count === 1 ? '' : 's'})` : '(0)'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onEdit(tag)}
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onDelete(tag)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
}
