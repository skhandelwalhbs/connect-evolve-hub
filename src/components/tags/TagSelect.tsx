
import { useState, useEffect } from "react";
import { Check, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area"; 
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tag } from "./Tag";
import { TagEditDialog } from "./TagEditDialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Tag = Database['public']['Tables']['tags']['Row'];

interface TagSelectProps {
  contactId: string;
  onTagsChange?: (tags: Tag[]) => void;
  className?: string;
  disabled?: boolean;
}

export function TagSelect({ contactId, onTagsChange, className, disabled = false }: TagSelectProps) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch all available tags
  useEffect(() => {
    async function fetchTags() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching tags:', error);
        toast({
          variant: "destructive",
          title: "Error fetching tags",
          description: error.message
        });
      } else {
        setTags(data || []);
      }
      setIsLoading(false);
    }
    
    fetchTags();
  }, [toast]);
  
  // Fetch existing tags for this contact
  useEffect(() => {
    async function fetchContactTags() {
      if (!contactId) return;
      
      const { data, error } = await supabase
        .from('contact_tags')
        .select('*, tag:tags(*)')
        .eq('contact_id', contactId);
      
      if (error) {
        console.error('Error fetching contact tags:', error);
        toast({
          variant: "destructive",
          title: "Error fetching contact tags",
          description: error.message
        });
      } else if (data) {
        const contactTags = data.map(item => item.tag as Tag).filter(Boolean);
        setSelectedTags(contactTags);
        if (onTagsChange) {
          onTagsChange(contactTags);
        }
      }
    }
    
    fetchContactTags();
  }, [contactId, toast, onTagsChange]);
  
  const toggleTag = async (tag: Tag) => {
    try {
      const isSelected = selectedTags.some(t => t.id === tag.id);
      
      if (isSelected) {
        // Remove tag
        const { error } = await supabase
          .from('contact_tags')
          .delete()
          .eq('contact_id', contactId)
          .eq('tag_id', tag.id);
        
        if (error) throw error;
        
        const updatedTags = selectedTags.filter(t => t.id !== tag.id);
        setSelectedTags(updatedTags);
        if (onTagsChange) onTagsChange(updatedTags);
        
        toast({
          title: "Tag removed",
          description: `"${tag.name}" has been removed from this contact`
        });
      } else {
        // Add tag
        const { error } = await supabase
          .from('contact_tags')
          .insert({ contact_id: contactId, tag_id: tag.id });
        
        if (error) throw error;
        
        const updatedTags = [...selectedTags, tag];
        setSelectedTags(updatedTags);
        if (onTagsChange) onTagsChange(updatedTags);
        
        toast({
          title: "Tag added",
          description: `"${tag.name}" has been added to this contact`
        });
      }
    } catch (error: any) {
      console.error('Error toggling tag:', error);
      toast({
        variant: "destructive",
        title: "Error updating tags",
        description: error.message
      });
    }
  };
  
  const handleCreateTagSuccess = (newTag: Tag) => {
    // Add new tag to list
    setTags(prevTags => [...prevTags, newTag].sort((a, b) => a.name.localeCompare(b.name)));
    
    // Automatically select the new tag
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
            onClick={() => setCreateTagDialogOpen(true)}
            disabled={disabled}
            className="text-xs h-7 px-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            New
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : tags.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No tags available. Create your first tag.</p>
        ) : (
          <ScrollArea className="max-h-[180px]">
            <div className="grid grid-cols-2 gap-2 mt-1">
              {tags.map(tag => {
                const isSelected = selectedTags.some(t => t.id === tag.id);
                return (
                  <div
                    key={tag.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
                      isSelected 
                        ? "bg-accent text-accent-foreground" 
                        : "hover:bg-muted",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => {
                      if (!disabled) {
                        toggleTag(tag);
                      }
                    }}
                  >
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm truncate flex-1">{tag.name}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
        
        {selectedTags.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-sm font-medium mb-2">Selected tags:</div>
            <div className="flex flex-wrap gap-1">
              {selectedTags.map(tag => (
                <Tag 
                  key={tag.id} 
                  id={tag.id} 
                  name={tag.name} 
                  color={tag.color}
                  removable
                  onRemove={() => toggleTag(tag)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      <TagEditDialog
        open={createTagDialogOpen}
        onOpenChange={setCreateTagDialogOpen}
        onSuccess={handleCreateTagSuccess}
      />
    </div>
  );
}
