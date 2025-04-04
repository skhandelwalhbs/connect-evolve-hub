
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Tag } from "@/components/tags/Tag";
import { Tag as TagType } from "@/types/database-extensions";

interface TagSelectorProps {
  contactId?: string;
  selectedTags: TagType[];
  onTagsChange: (tags: TagType[]) => void;
}

export function TagSelector({ contactId, selectedTags, onTagsChange }: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<TagType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all available tags
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      console.log("Fetched tags:", data);
      setTags(data || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast({
        title: "Error",
        description: "Failed to load tags. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTag = (selectedTag: TagType, e?: React.MouseEvent) => {
    // Stop propagation to prevent the click from reaching underlying elements
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log("Tag selected:", selectedTag);
    
    // Check if tag is already selected
    const isSelected = selectedTags.some(tag => tag.id === selectedTag.id);
    console.log("Is already selected:", isSelected);
    
    if (isSelected) {
      // Remove tag
      const newTags = selectedTags.filter(tag => tag.id !== selectedTag.id);
      console.log("Removing tag, new tags:", newTags);
      onTagsChange(newTags);
    } else {
      // Add tag
      const newTags = [...selectedTags, selectedTag];
      console.log("Adding tag, new tags:", newTags);
      onTagsChange(newTags);
    }
    
    // Don't close the popover when selecting tags
    // This allows users to select multiple tags without reopening the popover
  };

  const handleRemoveTag = (tagId: string) => {
    console.log("Removing tag with ID:", tagId);
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {selectedTags.map(tag => (
          <Tag 
            key={tag.id} 
            tag={tag} 
            removable 
            onRemove={() => handleRemoveTag(tag.id)} 
          />
        ))}
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            Select tags
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-full p-0" 
          align="start"
          style={{ zIndex: 100 }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Loading..." : "No tags found."}
              </CommandEmpty>
              <CommandGroup>
                {tags.map((tag) => {
                  const isSelected = selectedTags.some(t => t.id === tag.id);
                  return (
                    <CommandItem
                      key={tag.id}
                      value={tag.id}
                      onSelect={(currentValue) => {
                        console.log(`CommandItem onSelect fired for tag: ${tag.name}`);
                        // We'll handle selection in the div onClick handler instead
                      }}
                      className="cursor-pointer"
                    >
                      <div 
                        className="flex items-center w-full mr-2 cursor-pointer select-none"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelectTag(tag, e);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1">
                          <Tag tag={tag} />
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
