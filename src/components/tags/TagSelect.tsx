
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TagEditDialog } from "./TagEditDialog";
import { TagsGrid } from "./TagsGrid";
import { SelectedTagsList } from "./SelectedTagsList";
import { useTagSelection } from "@/hooks/useTagSelection";
import type { Database } from "@/integrations/supabase/types";

type Tag = Database['public']['Tables']['tags']['Row'];

interface TagSelectProps {
  contactId: string;
  onTagsChange?: (tags: Tag[]) => void;
  className?: string;
  disabled?: boolean;
}

export function TagSelect({ 
  contactId, 
  onTagsChange, 
  className, 
  disabled = false 
}: TagSelectProps) {
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false);
  const { tags, selectedTags, isLoading, toggleTag } = useTagSelection(contactId, onTagsChange);

  // Added this handler to stop event propagation
  const handleNewButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCreateTagDialogOpen(true);
  };

  const handleCreateTagSuccess = (newTag: Tag) => {
    // The tag will be added to the list on the next fetch
    // But we can immediately toggle it to select it
    toggleTag(newTag);
  };

  return (
    <div className={className}>
      <div className="border rounded-md p-3 bg-background">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Select tags</span>
          <Button 
            variant="ghost"
            size="sm"
            onClick={handleNewButtonClick}
            disabled={disabled}
            className="text-xs h-7 px-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            New
          </Button>
        </div>
        
        <TagsGrid 
          tags={tags}
          selectedTags={selectedTags}
          isLoading={isLoading}
          disabled={disabled}
          onToggleTag={toggleTag}
        />
        
        <SelectedTagsList 
          tags={selectedTags} 
          onRemove={toggleTag} 
        />
      </div>
      
      <TagEditDialog
        open={createTagDialogOpen}
        onOpenChange={setCreateTagDialogOpen}
        onSuccess={handleCreateTagSuccess}
      />
    </div>
  );
}
