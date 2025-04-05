
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { TagListItem } from "./TagListItem";
import type { TagWithCount } from "@/types/tag";

interface TagListProps {
  tags: TagWithCount[];
  isLoading: boolean;
  onEdit: (tag: TagWithCount) => void;
  onDelete: (tag: TagWithCount) => void;
}

export function TagList({ tags, isLoading, onEdit, onDelete }: TagListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (tags.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="mb-4">You haven't created any tags yet.</p>
      </div>
    );
  }
  
  return (
    <div className="grid gap-2">
      {tags.map(tag => (
        <TagListItem 
          key={tag.id} 
          tag={tag} 
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
