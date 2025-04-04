
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tag } from "@/components/tags/Tag";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Database } from "@/integrations/supabase/types";

type Tag = Database['public']['Tables']['tags']['Row'];

export function TagsManager() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState("#9b87f5"); // Default purple
  const { toast } = useToast();

  // Fetch tags on component mount
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setTags(data || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast({
        title: "Error",
        description: "Failed to load your tags. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast({
        title: "Error",
        description: "Tag name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({
          name: newTagName.trim(),
          color: selectedColor,
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        setTags([data[0], ...tags]);
        setNewTagName("");
        toast({
          title: "Success",
          description: "Tag created successfully.",
        });
      }
    } catch (error) {
      console.error("Error creating tag:", error);
      toast({
        title: "Error",
        description: "Failed to create tag. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);
      
      if (error) {
        throw error;
      }
      
      setTags(tags.filter(tag => tag.id !== tagId));
      toast({
        title: "Success",
        description: "Tag deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast({
        title: "Error",
        description: "Failed to delete tag. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="New tag name"
          className="flex-1"
        />
        <Input
          type="color"
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          className="w-12 p-1"
        />
        <Button onClick={handleCreateTag} disabled={!newTagName.trim()}>
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Tag
        </Button>
      </div>

      <div className="border rounded-md">
        <ScrollArea className="h-[300px] p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tags created yet. Start by adding your first tag.
            </div>
          ) : (
            <ul className="space-y-2">
              {tags.map(tag => (
                <li key={tag.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                  <Tag tag={tag} />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteTag(tag.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete tag</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
