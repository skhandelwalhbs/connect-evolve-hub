
import { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Tag = Database['public']['Tables']['tags']['Row'];

interface TagFilterProps {
  selectedTagIds: string[];
  onTagsChange: (selectedTags: string[]) => void;
  className?: string;
}

export function TagFilter({ selectedTagIds, onTagsChange, className }: TagFilterProps) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleTagToggle = (tagId: string) => {
    const updatedTags = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];
    
    onTagsChange(updatedTags);
  };

  // Count active filters
  const activeFiltersCount = selectedTagIds.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filter by Tags
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <div className="p-4 border-b">
          <h4 className="font-medium">Filter by Tags</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Select tags to filter contacts
          </p>
        </div>
        <ScrollArea className="h-72">
          <div className="p-4 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tags available</p>
            ) : (
              tags.map(tag => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`tag-${tag.id}`}
                    checked={selectedTagIds.includes(tag.id)}
                    onCheckedChange={() => handleTagToggle(tag.id)}
                  />
                  <label 
                    htmlFor={`tag-${tag.id}`}
                    className="flex items-center text-sm font-medium cursor-pointer"
                  >
                    <div
                      className="h-3 w-3 rounded-full mr-2"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span>{tag.name}</span>
                  </label>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        {selectedTagIds.length > 0 && (
          <div className="p-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onTagsChange([])}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
