
import { useState, useEffect } from "react";
import { Check, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Tag } from "./Tag";
import { TagEditDialog } from "./TagEditDialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Tag = Database['public']['Tables']['tags']['Row'];
type ContactTag = {
  id: string;
  contactId: string;
  tagId: string;
  tag?: Tag;
};

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
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch all available tags
  useEffect(() => {
    async function fetchTags() {
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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedTags.length && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            {selectedTags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedTags.length <= 3 ? 
                  selectedTags.map(tag => (
                    <Tag 
                      key={tag.id} 
                      id={tag.id} 
                      name={tag.name} 
                      color={tag.color}
                    />
                  )) : 
                  <>
                    <Tag 
                      id={selectedTags[0].id} 
                      name={selectedTags[0].name} 
                      color={selectedTags[0].color}
                    />
                    <Badge variant="secondary">{`+${selectedTags.length - 1} more`}</Badge>
                  </>
                }
              </div>
            ) : (
              "Select tags..."
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandList>
              <CommandGroup>
                {tags.map(tag => (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => toggleTag(tag)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1">{tag.name}</span>
                      {selectedTags.some(t => t.id === tag.id) && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setCreateTagDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create new tag
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      <TagEditDialog
        open={createTagDialogOpen}
        onOpenChange={setCreateTagDialogOpen}
        onSuccess={handleCreateTagSuccess}
      />
    </div>
  );
}
